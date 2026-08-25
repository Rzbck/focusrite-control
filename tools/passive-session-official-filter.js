const { parsePcapngPackets, parseTcpPacket, CORE_TARGET_IDS } = require('./passive-session-observer-lib')

const KNOWN_ROOTS = new Set(['approval','client-details','device-arrival','device-removal','device-subscribe','keep-alive','set'])
const COMPANION_HOSTNAME = 'Companion Scarlett 18i20'
const ASSIGN_MIX_TARGET_IDS = new Set(['1471', '1481'])

function itemIdsWithNonEmptyValue(xml, targets) {
	const found = []
	let item
	const itemRx = /<item\b([^>]*)>/gi
	while ((item = itemRx.exec(xml))) {
		const attrs = item[1]
		const idMatch = /\bid=["'](\d+)["']/i.exec(attrs)
		const valueMatch = /\bvalue=["']([^"']*)["']/i.exec(attrs)
		if (!idMatch || !valueMatch || !String(valueMatch[1]).trim()) continue
		if (targets.has(idMatch[1])) found.push(idMatch[1])
	}
	return [...new Set(found)].sort((a, b) => Number(a) - Number(b))
}

function reassemble(segments) {
	const unique = new Map()
	for (const seg of segments) {
		const key = `${seg.seq}:${seg.data.toString('hex')}`
		if (!unique.has(key)) unique.set(key, seg)
	}
	const sorted = [...unique.values()].sort((a, b) => a.seq - b.seq)
	const chunks = []
	let current = []
	let expected = null
	for (const seg of sorted) {
		if (expected === null || seg.seq > expected) {
			if (current.length) chunks.push(Buffer.concat(current))
			current = [seg.data]
			expected = seg.seq + seg.data.length
			continue
		}
		const overlap = expected - seg.seq
		if (overlap < seg.data.length) {
			current.push(seg.data.subarray(Math.max(0, overlap)))
			expected += seg.data.length - Math.max(0, overlap)
		}
	}
	if (current.length) chunks.push(Buffer.concat(current))
	return chunks
}

function parseFrames(data, direction) {
	const frames = []
	let offset = 0
	while (offset + 14 <= data.length) {
		const idx = data.indexOf('Length=', offset, 'ascii')
		if (idx < 0 || idx + 14 > data.length) break
		const header = data.subarray(idx, idx + 14).toString('ascii')
		const match = /^Length=([0-9A-Fa-f]{6}) $/.exec(header)
		if (!match) { offset = idx + 1; continue }
		const length = Number.parseInt(match[1], 16)
		const start = idx + 14
		const end = start + length
		if (!Number.isFinite(length) || length <= 0 || end > data.length) { offset = idx + 1; continue }
		const xml = data.subarray(start, end).toString('utf8')
		const rootMatch = /^\s*<([A-Za-z][A-Za-z0-9-]*)\b/.exec(xml)
		if (rootMatch) {
			const root = rootMatch[1].toLowerCase()
			const openEnd = xml.indexOf('>')
			const open = openEnd >= 0 ? xml.slice(0, openEnd + 1) : xml.slice(0, 256)
			const attributes = new Set()
			let am
			const arx = /\s([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=/g
			while ((am = arx.exec(open))) attributes.add(am[1].toLowerCase())
			const coreIds = []
			if (root === 'set') {
				let im
				const irx = /<item\b[^>]*\bid=["'](\d+)["']/gi
				while ((im = irx.exec(xml))) if (CORE_TARGET_IDS.has(im[1])) coreIds.push(im[1])
			}
			const assignMixIds = root === 'set' || root === 'device-arrival'
				? itemIdsWithNonEmptyValue(xml, ASSIGN_MIX_TARGET_IDS)
				: []
			let hostname = null
			if (root === 'client-details') {
				const hm = /\bhostname=["']([^"']*)["']/i.exec(open)
				if (hm) hostname = hm[1]
			}
			frames.push({
				direction,
				root,
				attributes:[...attributes].sort(),
				coreIds:[...new Set(coreIds)],
				assignMixIds,
				hostname,
			})
		}
		offset = end
	}
	return frames
}

function analyzeOfficialCapture(pcapng, serverPort) {
	const packets = parsePcapngPackets(pcapng)
	const sessions = new Map()
	for (const packet of packets) {
		const tcp = parseTcpPacket(packet)
		if (!tcp || !tcp.payload.length) continue
		let direction, clientIp, clientPort, serverIp
		if (tcp.dstPort === serverPort) {
			direction = 'client->server'; clientIp = tcp.srcIp; clientPort = tcp.srcPort; serverIp = tcp.dstIp
		} else if (tcp.srcPort === serverPort) {
			direction = 'server->client'; clientIp = tcp.dstIp; clientPort = tcp.dstPort; serverIp = tcp.srcIp
		} else continue
		const key = `${clientIp}|${clientPort}|${serverIp}|${serverPort}`
		if (!sessions.has(key)) sessions.set(key, { client:[], server:[] })
		const target = direction === 'client->server' ? sessions.get(key).client : sessions.get(key).server
		target.push({ seq:tcp.seq, data:tcp.payload })
	}

	const acceptedFrames = []
	let companionSessionsExcluded = 0
	let nonCompanionSessions = 0
	for (const session of sessions.values()) {
		const clientFrames = reassemble(session.client).flatMap((chunk) => parseFrames(chunk, 'client->server'))
		const companion = clientFrames.some((f) => f.root === 'client-details' && String(f.hostname || '').toLowerCase() === COMPANION_HOSTNAME.toLowerCase())
		if (companion) { companionSessionsExcluded++; continue }
		if (clientFrames.length === 0 && session.server.length === 0) continue
		nonCompanionSessions++
		acceptedFrames.push(...clientFrames)
		acceptedFrames.push(...reassemble(session.server).flatMap((chunk) => parseFrames(chunk, 'server->client')))
	}

	const summary = new Map()
	const core = new Set()
	const assignMixInitial = new Set()
	const assignMixSet = new Set()
	for (const frame of acceptedFrames) {
		const key = `${frame.direction}|${frame.root}|${frame.attributes.join(',')}`
		if (!summary.has(key)) summary.set(key, { direction:frame.direction, root:frame.root, attributes:frame.attributes, coreIds:[], assignMixIds:[], count:0 })
		summary.get(key).count++
		if (frame.direction === 'server->client') {
			for (const id of frame.coreIds) core.add(id)
			if (frame.root === 'device-arrival') for (const id of frame.assignMixIds) assignMixInitial.add(id)
			if (frame.root === 'set') for (const id of frame.assignMixIds) assignMixSet.add(id)
		}
	}
	return {
		packetCount: packets.length,
		streamCount: nonCompanionSessions * 2,
		frameCount: acceptedFrames.length,
		frames: [...summary.values()].sort((a,b)=>a.direction.localeCompare(b.direction)||a.root.localeCompare(b.root)),
		coreServerToClient: [...core].sort((a,b)=>Number(a)-Number(b)),
		assignMixInitialServerToClient: [...assignMixInitial].sort((a,b)=>Number(a)-Number(b)),
		assignMixSetServerToClient: [...assignMixSet].sort((a,b)=>Number(a)-Number(b)),
		unknownRoots: [...new Set(acceptedFrames.filter((f)=>!KNOWN_ROOTS.has(f.root)).map((f)=>f.root))].sort(),
		companionSessionsExcluded,
		nonCompanionSessions,
	}
}

module.exports = {
	analyzeOfficialCapture,
	COMPANION_HOSTNAME,
	ASSIGN_MIX_TARGET_IDS,
	itemIdsWithNonEmptyValue,
}
