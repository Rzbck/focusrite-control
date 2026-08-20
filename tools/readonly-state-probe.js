const dgram = require('node:dgram')
const net = require('node:net')
const fs = require('node:fs')
const path = require('node:path')
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
	collectCoreTargets,
	createCollector,
	seedCollectorFromArrival,
	applySetToCollector,
	summarizeCollector,
	parseDeviceArrival,
	parseSetMessage,
	parseServerAnnouncement,
} = require('./readback-probe-lib')

const CLIENT_NAME = 'Focusrite ReadOnly State Probe'
const CLIENT_KEY = 'focusrite-control-readback-debug-v2'
const PHASE_MS = 7000

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
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
				finish(null, { address: rinfo.address === '0.0.0.0' ? '127.0.0.1' : rinfo.address, port: announcement.port })
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

class ReadonlySession {
	constructor(target, collector) {
		this.target = target
		this.collector = collector
		this.socket = null
		this.buffer = Buffer.alloc(0)
		this.device = null
		this.deviceId = null
		this.targets = []
		this.keepAliveTimer = null
		this.fatalError = null
		this.closing = false
	}

	setCollector(collector) {
		this.collector = collector
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
				this.sendSafe(buildClientDetails(CLIENT_NAME, CLIENT_KEY))
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
				if (!this.closing && connected && !this.fatalError) this.fatalError = new Error('TCP session closed unexpectedly')
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

	subscribe(enabled) {
		if (!this.deviceId) throw new Error('Device ID is not available yet')
		this.sendSafe(buildDeviceSubscribe(this.deviceId, enabled))
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
		if (/<device-arrival\b/i.test(xml)) {
			const device = parseDeviceArrival(xml)
			if (!device) return
			this.device = device
			this.deviceId = device.id
			this.targets = collectCoreTargets(device)
			if (this.collector) seedCollectorFromArrival(this.collector, this.targets, device)
			return
		}

		if (/<set\b/i.test(xml)) {
			if (!this.collector || this.targets.length === 0) return
			applySetToCollector(this.collector, this.targets, parseSetMessage(xml), this.deviceId)
		}
	}

	assertHealthy() {
		if (this.fatalError) throw this.fatalError
	}

	async waitForDevice(timeoutMs = 5000) {
		const deadline = Date.now() + timeoutMs
		while (Date.now() < deadline) {
			this.assertHealthy()
			if (this.device && this.targets.length === 21) return
			await delay(25)
		}
		throw new Error(`No exact ${TARGET_MODEL} device-arrival received`)
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

function reportSummary(summary, lines) {
	const headline = `${summary.name}: Core seen=${summary.seen}/21; missing=${summary.missing}; setPackets=${summary.setPackets}; setItems=${summary.setItems}; otherSetIds=${summary.otherSetIds}`
	console.log(`\n${headline}`)
	lines.push('', headline)
	for (const row of summary.rows) {
		const line = `${row.seen ? 'SEEN   ' : 'MISSING'}  ${row.name.padEnd(16)} value=${String(row.value).padEnd(10)} source=${row.source}`
		console.log(line)
		lines.push(line)
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

async function main() {
	console.log('')
	console.log('FOCUSRITE CONTROL - READ-ONLY COLD-START STATE PROBE v2')
	console.log(TARGET_MODEL)
	console.log('')
	console.log('SAFETY:')
	console.log('  - No hardware <set> message is allowed on the TCP transmit path.')
	console.log('  - Allowed TCP roots: client-details, device-subscribe, keep-alive.')
	console.log('  - Discovery uses only the exact proven client-discovery packet.')
	console.log('  - Raw XML, serial, hostname, ports, client IDs and device IDs are not logged.')
	console.log('')
	console.log('Pendant ce probe (~25 s), ne touche pas Air/Pad/Mute/Dim/Talkback dans Focusrite Control.')
	console.log('')

	const lines = [
		'FOCUSRITE CONTROL READ-ONLY STATE PROBE v2',
		`Target model: ${TARGET_MODEL}`,
		'TCP transmit allowlist: client-details, device-subscribe, keep-alive',
		'Hardware <set> writes: FORBIDDEN',
		'Raw/private protocol logging: DISABLED',
	]

	const target = await discoverServer()
	console.log('PASS  Focusrite Control Server discovered dynamically.')
	lines.push('PASS  Focusrite Control Server discovered dynamically.')

	let session = null
	try {
		const phaseA = createCollector('PHASE A - cold connect + one subscribe=true')
		session = new ReadonlySession(target, phaseA)
		await session.connect()
		await session.waitForDevice()
		console.log(`PASS  Exact model detected: ${TARGET_MODEL}`)
		lines.push(`PASS  Exact model detected: ${TARGET_MODEL}`)
		session.subscribe(true)
		await delay(PHASE_MS)
		session.assertHealthy()
		const summaryA = summarizeCollector(phaseA, session.targets)
		reportSummary(summaryA, lines)

		const phaseB = createCollector('PHASE B - subscribe=false then subscribe=true')
		session.setCollector(phaseB)
		session.subscribe(false)
		await delay(750)
		session.subscribe(true)
		await delay(PHASE_MS)
		session.assertHealthy()
		const summaryB = summarizeCollector(phaseB, session.targets)
		reportSummary(summaryB, lines)

		session.close()
		session = null
		await delay(500)

		const phaseC = createCollector('PHASE C - clean TCP reconnect + one subscribe=true')
		session = new ReadonlySession(target, phaseC)
		await session.connect()
		await session.waitForDevice()
		session.subscribe(true)
		await delay(PHASE_MS)
		session.assertHealthy()
		const summaryC = summarizeCollector(phaseC, session.targets)
		reportSummary(summaryC, lines)

		const best = Math.max(summaryA.seen, summaryB.seen, summaryC.seen)
		let decision
		if (best === 21) {
			decision = 'RESULT: FULL CORE SNAPSHOT OBTAINED. The successful phase is a read-only bootstrap candidate.'
		} else if (summaryB.seen > summaryA.seen) {
			decision = 'RESULT: unsubscribe->subscribe improved readback but stayed incomplete. Inspect the exact sanitized phase delta before module changes.'
		} else if (summaryC.seen > summaryA.seen) {
			decision = 'RESULT: clean reconnect improved readback but stayed incomplete. Inspect the exact sanitized phase delta before module changes.'
		} else {
			decision = 'RESULT: standard subscription lifecycle does not cold-read all Core controls. Stop timing/resubscribe guesses and research a separate read primitive/state source.'
		}
		console.log(`\n${decision}`)
		lines.push('', 'DECISION', decision)

		const outDir = path.resolve(__dirname, '..', 'probe-results')
		fs.mkdirSync(outDir, { recursive: true })
		const outFile = path.join(outDir, `readonly_state_probe_${timestamp()}.txt`)
		fs.writeFileSync(outFile, `${lines.join('\n')}\n`, 'utf8')
		console.log(`\nSanitized result: probe-results\\${path.basename(outFile)}`)
		console.log('Envoie uniquement ce fichier resultat.')
	} finally {
		if (session) session.close()
	}
}

main().catch((error) => {
	console.error(`\nPROBE FAILED: ${safeErrorMessage(error)}`)
	process.exitCode = 1
})
