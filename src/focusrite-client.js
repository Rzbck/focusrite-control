const EventEmitter = require('events')
const net = require('net')
const dgram = require('dgram')
const { parseDeviceArrival, parseSetMessage, parseServerAnnouncement } = require('./device-parser')
const { xmlEncode, parseAttrs, boolValue } = require('./utils')

const DISCOVERY_PORTS = [30096, 30097, 30098]
const DISCOVERY_REQUEST_XML = '<client-discovery app="SAFFIRE-CONTROL" version="4"/>'

function frameXml(xml) {
	const payload = Buffer.from(xml, 'utf8')
	const header = Buffer.from(`Length=${payload.length.toString(16).toUpperCase().padStart(6, '0')} `, 'ascii')
	return Buffer.concat([header, payload])
}

function decodeFrames(buffer) {
	const frames = []
	let remaining = buffer
	while (remaining.length >= 14) {
		if (remaining.subarray(0, 7).toString('ascii') !== 'Length=') {
			const index = remaining.indexOf(Buffer.from('Length=', 'ascii'))
			if (index < 0) return { frames, remaining: Buffer.alloc(0) }
			remaining = remaining.subarray(index)
			if (remaining.length < 14) break
		}
		const hex = remaining.subarray(7, 13).toString('ascii')
		if (!/^[0-9A-Fa-f]{6}$/.test(hex) || remaining[13] !== 0x20) {
			remaining = remaining.subarray(1)
			continue
		}
		const length = Number.parseInt(hex, 16)
		if (remaining.length < 14 + length) break
		frames.push(remaining.subarray(14, 14 + length).toString('utf8'))
		remaining = remaining.subarray(14 + length)
	}
	return { frames, remaining }
}

class FocusriteClient extends EventEmitter {
	constructor(options = {}) {
		super()
		this.mode = options.mode || 'auto'
		this.host = options.host || '127.0.0.1'
		this.port = Number(options.port || 0)
		this.discoveryAddress = options.discoveryAddress || '255.255.255.255'
		this.clientName = options.clientName || 'Companion Scarlett 18i20'
		this.clientId = options.clientId || ''
		this.debugEnabled = Boolean(options.debug)
		this.targetModel = options.targetModel || ''

		this.socket = null
		this.buffer = Buffer.alloc(0)
		this.connected = false
		this.ready = false
		this.intentionalDisconnect = false
		this.keepAliveTimer = null
		this.reconnectTimer = null
		this.reconnectAttempt = 0
		this.server = null
		this.device = null
		this.state = new Map()
		this.serverClientId = null
		this.authorised = null
		this.approvalStates = new Map()
	}

	debug(message) {
		if (this.debugEnabled) this.emit('debug', message)
	}

	diagnostic(message) {
		this.emit('diagnostic', message)
	}

	async start() {
		this.intentionalDisconnect = false
		await this.connect()
	}

	async connect() {
		this.clearReconnect()
		this.disconnectSocketOnly()
		this.emit('connecting')

		let target
		if (this.mode === 'manual') {
			if (!Number.isInteger(this.port) || this.port < 1 || this.port > 65535) {
				throw new Error('Manual connection mode requires an explicit TCP port between 1 and 65535.')
			}
			target = { host: this.host, port: this.port, discovered: false }
			this.diagnostic(`Manual mode target TCP ${target.host}:${target.port}`)
		} else {
			try {
				target = await this.discoverServer()
			} catch (error) {
				this.debug(`Discovery failed: ${error.message}`)
				this.diagnostic(`Discovery failed: ${error.message}`)
				throw error
			}
		}
		this.diagnostic(`Connecting TCP ${target.host}:${target.port}${target.discovered ? ' (discovered)' : ''}`)
		await this.connectTcp(target)
	}

	discoverServer(timeoutMs = 1600) {
		return new Promise((resolve, reject) => {
			this.diagnostic(
				`Discovery start: XML=${DISCOVERY_REQUEST_XML} ports=${DISCOVERY_PORTS.join(',')} broadcast=${this.discoveryAddress}`,
			)
			const socket = dgram.createSocket('udp4')
			let settled = false
			const finish = (error, result) => {
				if (settled) return
				settled = true
				clearTimeout(timer)
				try {
					socket.close()
				} catch {
					// Socket may already be closed while resolving discovery.
				}
				if (error) reject(error)
				else resolve(result)
			}
			const packet = frameXml(DISCOVERY_REQUEST_XML)

			socket.on('error', (error) => finish(error))
			socket.on('message', (message, rinfo) => {
				this.diagnostic(
					`UDP RX ${rinfo.address}:${rinfo.port} ${message.length} bytes: ${message.toString('utf8').slice(0, 500)}`,
				)
				const decoded = decodeFrames(message)
				const candidateXml = decoded.frames.length ? decoded.frames : [message.toString('utf8')]
				for (const xml of candidateXml) {
					const announcement = parseServerAnnouncement(xml)
					if (!announcement) continue
					const address = rinfo.address === '0.0.0.0' ? '127.0.0.1' : rinfo.address
					this.debug(`Discovery announcement ${address}:${announcement.port}`)
					this.diagnostic(`Discovery announcement parsed: ${address}:${announcement.port}`)
					finish(null, { host: address, port: announcement.port, discovered: true })
					return
				}
			})

			socket.bind(0, '0.0.0.0', () => {
				const local = socket.address()
				this.diagnostic(`UDP discovery socket bound ${local.address}:${local.port}`)
				try {
					socket.setBroadcast(true)
				} catch {
					// Loopback discovery can still work if broadcast mode is unavailable.
				}
				const destinations = new Set([this.discoveryAddress, '127.0.0.1'])
				if (this.host) destinations.add(this.host)
				for (const address of destinations) {
					for (const port of DISCOVERY_PORTS) {
						socket.send(packet, port, address, (error) => {
							if (error) {
								this.debug(`Discovery send ${address}:${port}: ${error.message}`)
								this.diagnostic(`UDP TX FAILED ${address}:${port}: ${error.message}`)
							} else {
								this.diagnostic(`UDP TX ${address}:${port} ${packet.length} bytes`)
							}
					})
					}
				}
			})
			const timer = setTimeout(() => finish(new Error('No Focusrite Control Server discovery response')), timeoutMs)
		})
	}

	connectTcp(target) {
		return new Promise((resolve, reject) => {
			this.server = target
			this.buffer = Buffer.alloc(0)
			const socket = new net.Socket()
			this.socket = socket
			socket.setNoDelay(true)
			socket.setKeepAlive(true, 5000)
			socket.setTimeout(5000)

			let connectedOnce = false
			socket.on('connect', () => {
				socket.setTimeout(0)
				connectedOnce = true
				this.connected = true
				this.ready = false
				this.serverClientId = null
				this.authorised = null
				this.approvalStates.clear()
				this.reconnectAttempt = 0
				this.emit('connected', target)
				this.sendClientDetails()
				this.startKeepAlive()
				resolve()
			})
			socket.on('data', (data) => this.handleData(data))
			socket.on('close', () => {
				this.connected = false
				this.ready = false
				this.stopKeepAlive()
				this.emit('disconnected')
				if (!this.intentionalDisconnect) this.scheduleReconnect()
			})
			socket.on('timeout', () => {
				socket.destroy(new Error(`Timeout connecting to ${target.host}:${target.port}`))
			})
			socket.on('error', (error) => {
				this.emit('error', error)
				if (!connectedOnce) reject(error)
			})
			socket.connect(target.port, target.host)
		})
	}

	send(xml) {
		if (!this.socket || !this.connected) return false
		this.socket.write(frameXml(xml))
		this.debug(`TX ${xml}`)
		return true
	}

	sendClientDetails() {
		return this.send(
			`<client-details hostname="${xmlEncode(this.clientName)}" client-key="${xmlEncode(this.clientId)}"/>`,
		)
	}

	subscribeDevice(deviceId) {
		return this.send(`<device-subscribe devid="${xmlEncode(deviceId)}" subscribe="true"/>`)
	}

	markReadyIfStateObserved() {
		if (this.ready || this.state.size === 0) return this.ready
		this.ready = true
		this.diagnostic(`Device state subscription active: ${this.state.size} server-confirmed value(s) observed`)
		this.emit('ready')
		return true
	}

	sendKeepAlive() {
		return this.send('<keep-alive/>')
	}

	setValue(deviceId, itemId, value) {
		if (this.authorised !== true) {
			this.emit('write-blocked', {
				reason: this.authorised === false ? 'not-authorised' : 'authorisation-pending',
				deviceId: String(deviceId),
				itemId: String(itemId),
				value: String(value),
			})
			return false
		}
		return this.send(
			`<set devid="${xmlEncode(deviceId)}"><item id="${xmlEncode(itemId)}" value="${xmlEncode(value)}"/></set>`,
		)
	}

	startKeepAlive() {
		this.stopKeepAlive()
		this.keepAliveTimer = setInterval(() => this.sendKeepAlive(), 3000)
	}

	stopKeepAlive() {
		if (this.keepAliveTimer) clearInterval(this.keepAliveTimer)
		this.keepAliveTimer = null
	}

	handleData(data) {
		this.buffer = Buffer.concat([this.buffer, Buffer.from(data)])
		const decoded = decodeFrames(this.buffer)
		this.buffer = decoded.remaining
		for (const xml of decoded.frames) this.parseMessage(xml)
	}

	parseTagAttrs(xml, tag) {
		const escaped = String(tag).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		const match = xml.match(new RegExp(`<${escaped}\\b([^>]*)/?>`, 'i'))
		return match ? parseAttrs(match[1]) : null
	}

	applyOwnApproval(id, authorised) {
		if (!this.serverClientId || String(id) !== String(this.serverClientId)) return false
		const next = Boolean(authorised)
		if (this.authorised === next) return true
		this.authorised = next
		const event = { id: String(id), authorised: next }
		this.emit('approval', event)
		if (next) this.emit('approved', event)
		else this.emit('approval-required', event)
		return true
	}

	parseMessage(xml) {
		this.debug(`RX ${xml.length > 500 ? `${xml.slice(0, 500)}…` : xml}`)

		if (/<client-details\b/i.test(xml)) {
			const attrs = this.parseTagAttrs(xml, 'client-details')
			if (attrs?.id) {
				this.serverClientId = String(attrs.id)
				this.emit('client-id', this.serverClientId)
				if (this.approvalStates.has(this.serverClientId)) {
					this.applyOwnApproval(this.serverClientId, this.approvalStates.get(this.serverClientId))
				}
			}
			return
		}

		if (/<approval\b/i.test(xml)) {
			const attrs = this.parseTagAttrs(xml, 'approval')
			if (!attrs?.id || attrs.authorised === undefined) {
				this.emit('unhandled', xml)
				return
			}
			const id = String(attrs.id)
			const authorised = boolValue(attrs.authorised)
			this.approvalStates.set(id, authorised)
			if (!this.applyOwnApproval(id, authorised)) {
				this.debug(`Ignoring approval for another client id=${id} authorised=${authorised}`)
			}
			return
		}

		if (/<device-arrival>/i.test(xml) || /<device\s/i.test(xml)) {
			const device = parseDeviceArrival(xml)
			if (device) {
				if (this.targetModel && device.model !== this.targetModel) {
					this.emit('device-ignored', device)
					return
				}

				this.device = device
				this.ready = false
				this.state.clear()

				// Preserve only state explicitly supplied by Focusrite Control Server.
				// Missing values stay unknown and must never be replaced with defaults.
				for (const [id, value] of device.initialState || []) {
					this.state.set(String(id), String(value))
				}

				this.emit('device-arrived', device)

				// Exactly one subscription per device arrival. Real-hardware v0.1.11
				// testing showed repeated subscribe=true requests made no state progress.
				this.subscribeDevice(device.id)
				this.markReadyIfStateObserved()
			}
			return
		}

		const set = parseSetMessage(xml)
		if (set) {
			if (!this.device || String(set.deviceId) !== String(this.device.id)) return
			for (const item of set.items) this.state.set(String(item.id), item.value)
			this.markReadyIfStateObserved()
			this.emit('state', set)
			return
		}

		if (/<device-removal\b/i.test(xml)) {
			this.device = null
			this.emit('device-removed')
			return
		}

		if (/<server-announcement\b/i.test(xml)) return
		this.emit('unhandled', xml)
	}

	getValue(itemId) {
		return this.state.get(String(itemId))
	}

	scheduleReconnect() {
		if (this.reconnectTimer || this.intentionalDisconnect) return
		const delay = Math.min(30000, 1000 * 2 ** Math.min(this.reconnectAttempt, 5))
		this.reconnectAttempt += 1
		this.emit('reconnecting', delay)
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null
			this.connect().catch((error) => {
				this.emit('error', error)
				this.scheduleReconnect()
			})
		}, delay)
	}

	clearReconnect() {
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
		this.reconnectTimer = null
	}

	disconnectSocketOnly() {
		this.stopKeepAlive()
		if (this.socket) {
			this.socket.removeAllListeners()
			this.socket.destroy()
			this.socket = null
		}
		this.connected = false
		this.ready = false
		this.serverClientId = null
		this.authorised = null
		this.approvalStates.clear()
	}

	stop() {
		this.intentionalDisconnect = true
		this.clearReconnect()
		this.disconnectSocketOnly()
	}

	async reconnectNow() {
		this.intentionalDisconnect = false
		this.reconnectAttempt = 0
		await this.connect()
	}
}

module.exports = {
	FocusriteClient,
	frameXml,
	decodeFrames,
	DISCOVERY_PORTS,
	DISCOVERY_REQUEST_XML,
}
