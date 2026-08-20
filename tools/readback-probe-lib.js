const { parseDeviceArrival, parseSetMessage, parseServerAnnouncement } = require('../src/device-parser')
const { xmlEncode } = require('../src/utils')

const TARGET_MODEL = 'Scarlett 18i20 (3rd Gen)'
const DISCOVERY_PORTS = [30096, 30097, 30098]
const DISCOVERY_REQUEST_XML = '<client-discovery app="SAFFIRE-CONTROL" version="4"/>'
const ALLOWED_TCP_ROOTS = new Set(['client-details', 'device-subscribe', 'keep-alive'])

function frameXml(xml) {
	const payload = Buffer.from(String(xml), 'utf8')
	const header = Buffer.from(`Length=${payload.length.toString(16).toUpperCase().padStart(6, '0')} `, 'ascii')
	return Buffer.concat([header, payload])
}

function decodeFrames(buffer) {
	const frames = []
	let remaining = Buffer.from(buffer || Buffer.alloc(0))

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

function outgoingRoot(xml) {
	const match = String(xml).trim().match(/^<([A-Za-z0-9_-]+)\b/)
	return match ? match[1].toLowerCase() : ''
}

function assertAllowedTcpXml(xml) {
	const text = String(xml)
	const root = outgoingRoot(text)
	if (!root || !ALLOWED_TCP_ROOTS.has(root)) {
		throw new Error(`SAFETY BLOCK: outgoing XML root '${root || 'unknown'}' is not allowlisted`)
	}
	if (/<set\b/i.test(text)) {
		throw new Error('SAFETY BLOCK: hardware <set> writes are forbidden in the readback probe')
	}
	return root
}

function buildClientDetails(clientName, clientKey) {
	return `<client-details hostname="${xmlEncode(clientName)}" client-key="${xmlEncode(clientKey)}"/>`
}

function buildDeviceSubscribe(deviceId, subscribe) {
	return `<device-subscribe devid="${xmlEncode(deviceId)}" subscribe="${subscribe ? 'true' : 'false'}"/>`
}

function buildKeepAlive() {
	return '<keep-alive/>'
}

function collectCoreTargets(device) {
	if (!device || device.model !== TARGET_MODEL) {
		throw new Error(`Unsupported Focusrite model. Expected exactly '${TARGET_MODEL}'.`)
	}
	if (!Array.isArray(device.hardwareInputs) || device.hardwareInputs.length !== 8) {
		throw new Error(`Unexpected analogue input count: ${device.hardwareInputs?.length ?? 0}`)
	}

	const targets = []
	for (const [index, input] of device.hardwareInputs.entries()) {
		const channel = index + 1
		if (!input.air) throw new Error(`Schema missing Air ${channel}`)
		if (!input.pad) throw new Error(`Schema missing Pad ${channel}`)
		targets.push({ id: String(input.air), name: `Air ${channel}` })
		targets.push({ id: String(input.pad), name: `Pad ${channel}` })
		if (channel <= 2) {
			if (!input.mode) throw new Error(`Schema missing Input ${channel} Mode`)
			targets.push({ id: String(input.mode), name: `Input ${channel} Mode` })
		}
	}

	if (!device.monitoring?.mute) throw new Error('Schema missing Monitor Mute')
	if (!device.monitoring?.dim) throw new Error('Schema missing Monitor Dim')
	if (!device.monitoring?.talkback) throw new Error('Schema missing Talkback')

	targets.push({ id: String(device.monitoring.mute), name: 'Monitor Mute' })
	targets.push({ id: String(device.monitoring.dim), name: 'Monitor Dim' })
	targets.push({ id: String(device.monitoring.talkback), name: 'Talkback' })

	if (targets.length !== 21 || new Set(targets.map((target) => target.id)).size !== 21) {
		throw new Error(`Unexpected Core target map: ${targets.length}/21 unique controls`)
	}
	return targets
}

function createCollector(name) {
	return {
		name,
		seen: new Map(),
		source: new Map(),
		setPackets: 0,
		setItems: 0,
		otherSetIds: new Set(),
	}
}

function seedCollectorFromArrival(collector, targets, device) {
	const targetIds = new Set(targets.map((target) => target.id))
	for (const [id, value] of device.initialState || []) {
		const key = String(id)
		if (!targetIds.has(key)) continue
		collector.seen.set(key, String(value))
		collector.source.set(key, 'device-arrival')
	}
}

function applySetToCollector(collector, targets, setMessage, expectedDeviceId) {
	if (!setMessage) return
	if (expectedDeviceId && String(setMessage.deviceId) !== String(expectedDeviceId)) return

	const targetIds = new Set(targets.map((target) => target.id))
	collector.setPackets += 1
	for (const item of setMessage.items) {
		const id = String(item.id)
		collector.setItems += 1
		if (targetIds.has(id)) {
			collector.seen.set(id, String(item.value))
			collector.source.set(id, 'set')
		} else {
			collector.otherSetIds.add(id)
		}
	}
}

function summarizeCollector(collector, targets) {
	const rows = targets.map((target) => ({
		name: target.name,
		seen: collector.seen.has(target.id),
		value: collector.seen.has(target.id) ? collector.seen.get(target.id) : '<MISSING>',
		source: collector.source.get(target.id) || '-',
	}))
	return {
		name: collector.name,
		seen: rows.filter((row) => row.seen).length,
		missing: rows.filter((row) => !row.seen).length,
		setPackets: collector.setPackets,
		setItems: collector.setItems,
		otherSetIds: collector.otherSetIds.size,
		rows,
	}
}

module.exports = {
	TARGET_MODEL,
	DISCOVERY_PORTS,
	DISCOVERY_REQUEST_XML,
	ALLOWED_TCP_ROOTS,
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
}
