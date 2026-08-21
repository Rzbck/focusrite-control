const fs = require('node:fs')
const path = require('node:path')

const RESULT_NAME_RE = /^official_session_observer_\d{8}_\d{6}\.txt$/
const KNOWN_ROOTS = new Set([
	'approval', 'client-details', 'device-arrival', 'device-removal',
	'device-subscribe', 'keep-alive', 'set',
])
const CORE_TARGET_IDS = new Set([
	'1259','1260','1261','1266','1267','1268','1273','1274','1279','1280',
	'1285','1286','1291','1292','1297','1298','1303','1304','1678','1679','1682',
])
const CORE_NAMES = new Map([
	['1259','Input 1 Mode'], ['1260','Air 1'], ['1261','Pad 1'],
	['1266','Input 2 Mode'], ['1267','Air 2'], ['1268','Pad 2'],
	['1273','Air 3'], ['1274','Pad 3'], ['1279','Air 4'], ['1280','Pad 4'],
	['1285','Air 5'], ['1286','Pad 5'], ['1291','Air 6'], ['1292','Pad 6'],
	['1297','Air 7'], ['1298','Pad 7'], ['1303','Air 8'], ['1304','Pad 8'],
	['1678','Monitor Dim'], ['1679','Monitor Mute'], ['1682','Talkback'],
])

function u32(buffer, offset, little) {
	return little ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset)
}

function parsePcapngPackets(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 12) throw new Error('Invalid pcapng input')
	const packets = []
	let offset = 0
	let little = true
	while (offset + 12 <= buffer.length) {
		const rawTypeLE = buffer.readUInt32LE(offset)
		const rawTypeBE = buffer.readUInt32BE(offset)
		if (rawTypeLE === 0x0a0d0d0a || rawTypeBE === 0x0a0d0d0a) {
			if (offset + 16 > buffer.length) break
			const bomLE = buffer.readUInt32LE(offset + 8)
			const bomBE = buffer.readUInt32BE(offset + 8)
			if (bomLE === 0x1a2b3c4d) little = true
			else if (bomBE === 0x1a2b3c4d) little = false
			else throw new Error('Unsupported pcapng byte order')
		}
		const blockType = u32(buffer, offset, little)
		const total = u32(buffer, offset + 4, little)
		if (total < 12 || offset + total > buffer.length) break
		if (blockType === 0x00000006 && total >= 32) {
			const captured = u32(buffer, offset + 20, little)
			const dataStart = offset + 28
			if (captured > 0 && dataStart + captured <= offset + total - 4) {
				packets.push(Buffer.from(buffer.subarray(dataStart, dataStart + captured)))
			}
		} else if (blockType === 0x00000003 && total >= 16) {
			const dataStart = offset + 12
			const dataEnd = offset + total - 4
			if (dataEnd > dataStart) packets.push(Buffer.from(buffer.subarray(dataStart, dataEnd)))
		}
		offset += total
	}
	return packets
}

function parseTcpPacket(packet) {
	if (!Buffer.isBuffer(packet) || packet.length < 40) return null
	let ip = 0
	if ((packet[0] >> 4) === 4 || (packet[0] >> 4) === 6) {
		ip = 0
	} else if (packet.length >= 14) {
		let etherType = packet.readUInt16BE(12)
		ip = 14
		if ((etherType === 0x8100 || etherType === 0x88a8) && packet.length >= 18) {
			etherType = packet.readUInt16BE(16)
			ip = 18
		}
		if (etherType !== 0x0800 && etherType !== 0x86dd) return null
	} else return null

	const version = packet[ip] >> 4
	let tcp = 0
	let srcIp = ''
	let dstIp = ''
	if (version === 4) {
		if (packet.length < ip + 20) return null
		const ihl = (packet[ip] & 0x0f) * 4
		if (ihl < 20 || packet[ip + 9] !== 6 || packet.length < ip + ihl + 20) return null
		srcIp = [...packet.subarray(ip + 12, ip + 16)].join('.')
		dstIp = [...packet.subarray(ip + 16, ip + 20)].join('.')
		tcp = ip + ihl
	} else if (version === 6) {
		if (packet.length < ip + 40 || packet[ip + 6] !== 6) return null
		srcIp = packet.subarray(ip + 8, ip + 24).toString('hex')
		dstIp = packet.subarray(ip + 24, ip + 40).toString('hex')
		tcp = ip + 40
	} else return null

	if (packet.length < tcp + 20) return null
	const srcPort = packet.readUInt16BE(tcp)
	const dstPort = packet.readUInt16BE(tcp + 2)
	const seq = packet.readUInt32BE(tcp + 4)
	const headerLen = ((packet[tcp + 12] >> 4) & 0x0f) * 4
	if (headerLen < 20 || packet.length < tcp + headerLen) return null
	return {
		srcIp, dstIp, srcPort, dstPort, seq,
		payload: Buffer.from(packet.subarray(tcp + headerLen)),
	}
}

function buildDirectionalStreams(packets, serverPort) {
	const flows = new Map()
	for (const packet of packets) {
		const tcp = parseTcpPacket(packet)
		if (!tcp || tcp.payload.length === 0) continue
		let direction = null
		if (tcp.dstPort === serverPort) direction = 'client->server'
		else if (tcp.srcPort === serverPort) direction = 'server->client'
		else continue
		const key = `${direction}|${tcp.srcIp}|${tcp.srcPort}|${tcp.dstIp}|${tcp.dstPort}`
		if (!flows.has(key)) flows.set(key, { direction, segments: [] })
		flows.get(key).segments.push({ seq: tcp.seq, data: tcp.payload })
	}

	const streams = []
	for (const flow of flows.values()) {
		const unique = new Map()
		for (const seg of flow.segments) {
			const key = `${seg.seq}:${seg.data.toString('hex')}`
			if (!unique.has(key)) unique.set(key, seg)
		}
		const sorted = [...unique.values()].sort((a, b) => a.seq - b.seq)
		let chunks = []
		let current = []
		let expected = null
		for (const seg of sorted) {
			if (expected === null) {
				current = [seg.data]
				expected = seg.seq + seg.data.length
				continue
			}
			if (seg.seq > expected) {
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
		for (const data of chunks) streams.push({ direction: flow.direction, data })
	}
	return streams
}

function openingAttributeNames(xml) {
	const end = xml.indexOf('>')
	if (end < 0) return []
	const open = xml.slice(0, end + 1)
	const names = new Set()
	const rx = /\s([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=/g
	let m
	while ((m = rx.exec(open))) names.add(m[1].toLowerCase())
	return [...names].sort()
}

function parseFramedStream(data, direction) {
	const frames = []
	let offset = 0
	while (offset + 14 <= data.length) {
		const idx = data.indexOf('Length=', offset, 'ascii')
		if (idx < 0 || idx + 14 > data.length) break
		const header = data.subarray(idx, idx + 14).toString('ascii')
		const m = /^Length=([0-9A-Fa-f]{6}) $/.exec(header)
		if (!m) { offset = idx + 1; continue }
		const length = Number.parseInt(m[1], 16)
		if (!Number.isFinite(length) || length <= 0) { offset = idx + 14; continue }
		const start = idx + 14
		const end = start + length
		if (end > data.length) { offset = idx + 1; continue }
		const xml = data.subarray(start, end).toString('utf8')
		const rootMatch = /^\s*<([A-Za-z][A-Za-z0-9-]*)\b/.exec(xml)
		if (rootMatch) {
			const root = rootMatch[1].toLowerCase()
			const coreIds = []
			if (root === 'set') {
				const idRx = /<item\b[^>]*\bid=["'](\d+)["']/gi
				let idm
				while ((idm = idRx.exec(xml))) if (CORE_TARGET_IDS.has(idm[1])) coreIds.push(idm[1])
			}
			frames.push({
				direction,
				root,
				attributes: openingAttributeNames(xml),
				coreIds: [...new Set(coreIds)].sort((a, b) => Number(a) - Number(b)),
			})
		}
		offset = end
	}
	return frames
}

function analyzeCapture(pcapng, serverPort) {
	const packets = parsePcapngPackets(pcapng)
	const streams = buildDirectionalStreams(packets, serverPort)
	const frames = streams.flatMap((stream) => parseFramedStream(stream.data, stream.direction))
	const summary = new Map()
	const coreByDirection = new Map([['client->server', new Set()], ['server->client', new Set()]])
	for (const frame of frames) {
		const key = `${frame.direction}|${frame.root}|${frame.attributes.join(',')}`
		if (!summary.has(key)) summary.set(key, { ...frame, count: 0 })
		summary.get(key).count++
		for (const id of frame.coreIds) coreByDirection.get(frame.direction)?.add(id)
	}
	return {
		packetCount: packets.length,
		streamCount: streams.length,
		frameCount: frames.length,
		frames: [...summary.values()].sort((a, b) => a.direction.localeCompare(b.direction) || a.root.localeCompare(b.root)),
		coreServerToClient: [...coreByDirection.get('server->client')].sort((a,b)=>Number(a)-Number(b)),
		unknownRoots: [...new Set(frames.filter((f) => !KNOWN_ROOTS.has(f.root)).map((f) => f.root))].sort(),
	}
}

function safeList(values) {
	return values && values.length ? values.join(', ') : '(none)'
}

function buildSanitizedSessionReport({ analysis, captureSeconds, serverPortChanged }) {
	const frameLines = analysis.frames.length
		? analysis.frames.map((f) => `- ${f.direction} | ${f.root} | count=${f.count} | attrs=${safeList(f.attributes)}`)
		: ['- (no complete Focusrite frames reconstructed)']
	const core = analysis.coreServerToClient
	const coreNames = core.map((id) => `${id}:${CORE_NAMES.get(id) || 'Core'}`)
	const missing = [...CORE_TARGET_IDS].filter((id) => !core.includes(id)).map((id) => `${id}:${CORE_NAMES.get(id)}`)
	const separateRead = analysis.unknownRoots.length > 0
		? 'RESULT: UNKNOWN XML ROOT(S) OBSERVED. Research their exact official message role before sending anything.'
		: 'RESULT: NO SEPARATE UNKNOWN XML ROOT OBSERVED IN THE CAPTURED OFFICIAL SESSION.'
	return [
		'FOCUSRITE OFFICIAL CLIENT PASSIVE SESSION OBSERVER v1',
		'Mode: PASSIVE PKTMON CAPTURE + LOCAL PARSE',
		'Focusrite protocol messages transmitted by observer: NONE',
		'Hardware/settings writes by observer: NONE',
		'Raw ETL/PCAPNG publication: FORBIDDEN',
		'Private paths/endpoints/ports/IDs publication: FORBIDDEN',
		`Capture duration seconds: ${Number(captureSeconds || 0)}`,
		`Server port changed during capture: ${serverPortChanged ? 'YES' : 'NO'}`,
		`Captured packet snapshots parsed: ${analysis.packetCount}`,
		`TCP stream chunks reconstructed: ${analysis.streamCount}`,
		`Complete Focusrite frames reconstructed: ${analysis.frameCount}`,
		'',
		'ROOT SUMMARY',
		...frameLines,
		'',
		`Unknown XML roots: ${safeList(analysis.unknownRoots)}`,
		`Core IDs observed in server->client SET frames: ${safeList(coreNames)}`,
		`Core IDs not observed in server->client SET frames: ${safeList(missing)}`,
		'',
		'DECISION',
		separateRead,
		'',
	].join('\n')
}

function validateSanitizedSessionReport(text) {
	const value = String(text || '')
	for (const marker of [
		'FOCUSRITE OFFICIAL CLIENT PASSIVE SESSION OBSERVER v1',
		'Focusrite protocol messages transmitted by observer: NONE',
		'Raw ETL/PCAPNG publication: FORBIDDEN',
		'ROOT SUMMARY', 'DECISION', 'RESULT:',
	]) if (!value.includes(marker)) throw new Error(`Session report missing marker: ${marker}`)
	const forbidden = [
		/\b[A-Za-z]:\\/, /\\\\[^\\\s]+\\/, /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
		/<\/?[A-Za-z][^>]*>/, /\bLength=[0-9A-Fa-f]{6}\b/,
		/\bhostname\s*=/i, /\bclient-key\s*=/i, /\bserial(?:-number)?\s*[:=]/i,
		/\bport\s*[:=]\s*\d+/i, /\bdevid\s*=/i,
	]
	for (const rx of forbidden) if (rx.test(value)) throw new Error(`Session report rejected by privacy rule: ${rx}`)
	return true
}

function listSessionResults(resultDir) {
	if (!fs.existsSync(resultDir)) return []
	return fs.readdirSync(resultDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && RESULT_NAME_RE.test(entry.name))
		.map((entry) => {
			const fullPath = path.join(resultDir, entry.name)
			return { name: entry.name, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs }
		})
		.sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))
}

function findLatestSessionResult(resultDir) {
	return listSessionResults(resultDir)[0] || null
}

function buildPublishedSession({ reportText, sourceBranch, sourceCommit, sourceFile, nodeVersion }) {
	validateSanitizedSessionReport(reportText)
	if (sourceBranch !== 'debug/official-client-passive-session') throw new Error('Passive session publication refused from wrong branch')
	if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit || ''))) throw new Error('Invalid source commit SHA')
	if (!RESULT_NAME_RE.test(String(sourceFile || ''))) throw new Error('Invalid passive session result filename')
	if (!/^v?22\.\d+\.\d+$/.test(String(nodeVersion || ''))) throw new Error('Invalid Node 22 metadata')
	return [
		'# Automated sanitized Focusrite official-client passive session result', '',
		'> Generated locally from a temporary Windows Pktmon capture.',
		'> Raw capture files, endpoints, ports, client keys, serials and paths are excluded.', '',
		`Source branch: ${sourceBranch}`, `Source commit: ${sourceCommit}`,
		`Source result: ${sourceFile}`, `Node: ${String(nodeVersion).replace(/^v/, '')}`,
		'Raw capture upload: none', 'Focusrite observer protocol transmission: none', '', '---', '',
		reportText.trimEnd(), '',
	].join('\n')
}

module.exports = {
	RESULT_NAME_RE, CORE_TARGET_IDS, CORE_NAMES,
	parsePcapngPackets, parseTcpPacket, buildDirectionalStreams, parseFramedStream,
	analyzeCapture, buildSanitizedSessionReport, validateSanitizedSessionReport,
	listSessionResults, findLatestSessionResult, buildPublishedSession,
}
