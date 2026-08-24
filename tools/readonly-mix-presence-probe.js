const dgram = require('node:dgram')
const net = require('node:net')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { parseAttrs } = require('../src/utils')
const {
	TARGET_MODEL,
	DISCOVERY_PORTS,
	DISCOVERY_REQUEST_XML,
	frameXml,
	decodeFrames,
	assertAllowedTcpXml,
	buildClientDetails,
	buildDeviceSubscribe,
	buildKeepAlive,
	parseDeviceArrival,
	parseSetMessage,
	parseServerAnnouncement,
} = require('./readback-probe-lib')
const {
	canonicalBool,
	createStatePresenceCollector,
	applySetPresence,
	detectPlaybackSlot,
	buildMixPresenceRows,
	summarizeMixPresence,
} = require('./mix-presence-probe-lib')

const CLIENT_NAME = 'Focusrite ReadOnly Mix Probe'
const OBSERVE_MS = 10000
const APPROVAL_WAIT_MS = 20000
const RESULTS_DIR = path.resolve(__dirname, '..', 'probe-results')
const CLIENT_KEY_PATH = path.join(RESULTS_DIR, '.readonly-mix-presence-client-key')

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function stableClientKey() {
	fs.mkdirSync(RESULTS_DIR, { recursive: true })
	if (fs.existsSync(CLIENT_KEY_PATH)) {
		const existing = fs.readFileSync(CLIENT_KEY_PATH, 'utf8').trim()
		if (existing) return existing
	}
	const key = randomUUID()
	fs.writeFileSync(CLIENT_KEY_PATH, `${key}\n`, { encoding: 'utf8', mode: 0o600 })
	return key
}

function discoverServer(timeoutMs = 3000) {
	return new Promise((resolve, reject) => {
		const socket = dgram.createSocket('udp4')
		const packet = frameXml(DISCOVERY_REQUEST_XML)
		let settled = false
		let timer = null

		const finish = (error, result) => {
			if (settled) return
			settled = true
			if (timer) clearTimeout(timer)
			try {
				socket.close()
			} catch {
				// Already closed.
			}
			if (error) reject(error)
			else resolve(result)
		}

		socket.on('error', (error) => finish(error))
		socket.on('message', (message, rinfo) => {
			const decoded = decodeFrames(message)
			const candidates = decoded.frames.length ? decoded.frames : [message.toString('utf8')]
			for (const xml of candidates) {
				const announcement = parseServerAnnouncement(xml)
				if (!announcement) continue
				finish(null, {
					address: rinfo.address === '0.0.0.0' ? '127.0.0.1' : rinfo.address,
					port: announcement.port,
				})
				return
			}
		})

		socket.bind(0, '0.0.0.0', () => {
			try {
				socket.setBroadcast(true)
			} catch {
				// Loopback discovery is still attempted.
			}
			for (const address of ['127.0.0.1', '255.255.255.255']) {
				for (const port of DISCOVERY_PORTS) socket.send(packet, port, address, () => {})
			}
		})

		timer = setTimeout(() => finish(new Error('No Focusrite Control Server discovery response')), timeoutMs)
	})
}

function parseTagAttrs(xml, tag) {
	const escaped = String(tag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const match = String(xml).match(new RegExp(`<${escaped}\\b([^>]*)/?>`, 'i'))
	return match ? parseAttrs(match[1]) : null
}

class ReadonlyMixPresenceSession {
	constructor(target, clientKey) {
		this.target = target
		this.clientKey = clientKey
		this.socket = null
		this.buffer = Buffer.alloc(0)
		this.keepAliveTimer = null
		this.device = null
		this.collector = null
		this.serverClientId = null
		this.authorised = null
		this.approvalStates = new Map()
		this.fatalError = null
		this.closing = false
	}

	async connect() {
		await new Promise((resolve, reject) => {
			const socket = new net.Socket()
			this.socket = socket
			socket.setNoDelay(true)
			socket.setKeepAlive(true, 5000)
			socket.setTimeout(5000)
			let connected = false

			socket.on('connect', () => {
				connected = true
				socket.setTimeout(0)
				this.sendSafe(buildClientDetails(CLIENT_NAME, this.clientKey))
				this.keepAliveTimer = setInterval(() => {
					try {
						this.sendSafe(buildKeepAlive())
					} catch {
						// Socket shutdown is handled by close/error.
					}
				}, 3000)
				resolve()
			})
			socket.on('data', (data) => this.handleData(data))
			socket.on('timeout', () => socket.destroy(new Error('TCP connection timeout')))
			socket.on('close', () => {
				if (!this.closing && connected && !this.fatalError) {
					this.fatalError = new Error('TCP session closed unexpectedly')
				}
			})
			socket.on('error', (error) => {
				if (!connected) reject(error)
				else if (!this.closing && !this.fatalError) this.fatalError = error
			})
			socket.connect(this.target.port, this.target.address)
		})
	}

	sendSafe(xml) {
		assertAllowedTcpXml(xml)
		if (!this.socket || this.socket.destroyed) throw new Error('TCP session is not connected')
		this.socket.write(frameXml(xml))
	}

	subscribe() {
		if (!this.device?.id) throw new Error('Device ID is not available yet')
		this.sendSafe(buildDeviceSubscribe(this.device.id, true))
	}

	applyOwnApproval(id, authorised) {
		if (!this.serverClientId || String(id) !== String(this.serverClientId)) return false
		this.authorised = Boolean(authorised)
		return true
	}

	handleData(data) {
		this.buffer = Buffer.concat([this.buffer, Buffer.from(data)])
		const decoded = decodeFrames(this.buffer)
		this.buffer = decoded.remaining
		for (const xml of decoded.frames) {
			try {
				this.handleFrame(xml)
			} catch (error) {
				if (!this.fatalError) this.fatalError = error
			}
		}
	}

	handleFrame(xml) {
		if (/<client-details\b/i.test(xml)) {
			const attrs = parseTagAttrs(xml, 'client-details')
			if (attrs?.id) {
				this.serverClientId = String(attrs.id)
				if (this.approvalStates.has(this.serverClientId)) {
					this.applyOwnApproval(this.serverClientId, this.approvalStates.get(this.serverClientId))
				}
			}
			return
		}

		if (/<approval\b/i.test(xml)) {
			const attrs = parseTagAttrs(xml, 'approval')
			if (!attrs?.id || attrs.authorised === undefined) return
			const id = String(attrs.id)
			const authorised = canonicalBool(attrs.authorised)
			if (authorised === null) return
			this.approvalStates.set(id, authorised)
			this.applyOwnApproval(id, authorised)
			return
		}

		if (/<device-arrival\b/i.test(xml) || /<device\s/i.test(xml)) {
			const device = parseDeviceArrival(xml)
			if (!device) return
			if (device.model !== TARGET_MODEL) {
				throw new Error(`Unsupported Focusrite model. Expected exactly '${TARGET_MODEL}'.`)
			}
			this.device = device
			this.collector = createStatePresenceCollector(device)
			return
		}

		if (/<set\b/i.test(xml) && this.collector) {
			applySetPresence(this.collector, parseSetMessage(xml))
		}
	}

	assertHealthy() {
		if (this.fatalError) throw this.fatalError
	}

	async waitForDevice(timeoutMs = 5000) {
		const deadline = Date.now() + timeoutMs
		while (Date.now() < deadline) {
			this.assertHealthy()
			if (this.device && this.collector && this.device.mixes?.length === 12) return
			await delay(25)
		}
		throw new Error(`No exact ${TARGET_MODEL} device-arrival received`)
	}

	async waitForApproval(timeoutMs = APPROVAL_WAIT_MS) {
		const deadline = Date.now() + timeoutMs
		while (Date.now() < deadline) {
			this.assertHealthy()
			if (this.authorised === true) return true
			await delay(100)
		}
		return false
	}

	close() {
		this.closing = true
		if (this.keepAliveTimer) clearInterval(this.keepAliveTimer)
		this.keepAliveTimer = null
		if (this.socket) {
			this.socket.removeAllListeners('error')
			this.socket.destroy()
		}
		this.socket = null
	}
}

function timestamp() {
	const now = new Date()
	const p = (value) => String(value).padStart(2, '0')
	return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
}

function safeErrorMessage(error) {
	return String(error?.message || error || 'unknown error')
		.replace(/\b(?:\d{1,3}\.){3}\d{1,3}:\d+\b/g, '<endpoint>')
		.replace(/[A-Za-z]:\\[^\r\n]+/g, '<path>')
}

function writeSanitizedReport({ playback, rows, collector }) {
	fs.mkdirSync(RESULTS_DIR, { recursive: true })
	const summary = summarizeMixPresence(rows)
	const payload = {
		reportVersion: 1,
		reportClass: 'direct-readonly-mix-presence-sanitized',
		targetModel: TARGET_MODEL,
		readOnly: true,
		hardwareWrites: false,
		transmitRoots: ['client-details', 'device-subscribe', 'keep-alive'],
		clientIdentity: 'local-persistent-private',
		clientAuthorised: true,
		playback: { slot: playback.slot, name: playback.name, stereo: playback.stereo },
		summary,
		rows,
		trafficSummary: { setPacketsReceived: collector.setPackets, setItemsReceived: collector.setItems },
		privacy:
			'No raw values, item IDs, device ID, serial, hostname, endpoint, client key/client ID or raw XML is stored.',
	}
	const outFile = path.join(RESULTS_DIR, `readonly_mix_presence_${timestamp()}.json`)
	fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
	return path.basename(outFile)
}

async function main() {
	console.log('')
	console.log('FOCUSRITE CONTROL - DIRECT READ-ONLY MIX STATE PRESENCE PROBE')
	console.log(TARGET_MODEL)
	console.log('')
	console.log('RESEARCH-ONLY / ISOLATED PATH')
	console.log('  - Disable the normal Companion Focusrite connection before this probe.')
	console.log('  - Hardware writes are structurally forbidden by the TCP transmit allowlist.')
	console.log('  - Allowed TCP roots: client-details, device-subscribe, keep-alive.')
	console.log('  - Raw XML, values, item IDs, serial, endpoint and client identity are not logged.')
	console.log('  - If Remote Devices shows Focusrite ReadOnly Mix Probe, approve that dedicated research client.')
	console.log('')

	const target = await discoverServer()
	console.log('PASS  Focusrite Control Server discovered dynamically.')

	let session = null
	try {
		session = new ReadonlyMixPresenceSession(target, stableClientKey())
		await session.connect()
		await session.waitForDevice()
		console.log(`PASS  Exact model detected: ${TARGET_MODEL}`)
		console.log('INFO  Waiting for dedicated research-client approval in Focusrite Control Remote Devices...')
		if (!(await session.waitForApproval())) {
			throw new Error(
				`Research client approval was not confirmed for '${CLIENT_NAME}'. No device subscription was sent.`,
			)
		}
		console.log('PASS  Dedicated research client authorised.')
		session.subscribe()
		console.log(`INFO  Observing read-only server state for ${OBSERVE_MS / 1000} seconds...`)
		await delay(OBSERVE_MS)
		session.assertHealthy()

		const playback = detectPlaybackSlot(session.device, session.collector)
		if (!playback) {
			throw new Error('No server-confirmed mixer slot assigned to a Playback source was observed.')
		}
		console.log(
			`PASS  Playback source detected dynamically: slot ${playback.slot} :: ${playback.name}${playback.stereo ? ' / stereo' : ''}`,
		)

		const rows = buildMixPresenceRows(session.device, session.collector, playback.slot)
		const summary = summarizeMixPresence(rows)
		console.log('')
		console.log('DIRECT SERVER PRESENCE')
		for (const row of rows) {
			console.log(
				`${row.mix} ${row.side}`.padEnd(18) +
					` gain=${row.gain.padEnd(7)} mute=${row.mute.padEnd(7)} solo=${row.solo.padEnd(7)} exact=${row.exactPresence ? 'YES' : 'NO'}`,
			)
		}
		console.log('')
		console.log(`SUMMARY exact-presence=${summary.exactPresence}/${summary.total}; missing-any=${summary.missingAny}`)
		const report = writeSanitizedReport({ playback, rows, collector: session.collector })
		console.log(`Sanitized result: probe-results\\${report}`)
		console.log('DIRECT READ-ONLY MIX PRESENCE PROBE COMPLETE - no hardware write was sent.')
	} finally {
		if (session) session.close()
	}
}

main().catch((error) => {
	console.error(`\nPROBE FAILED: ${safeErrorMessage(error)}`)
	console.error('No hardware write should have been sent by this research probe.')
	process.exitCode = 1
})
