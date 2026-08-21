const fs = require('node:fs')
const path = require('node:path')

const RESULT_NAME_RE = /^official_client_memory_observer_\d{8}_\d{6}\.txt$/
const KNOWN_ROOTS = new Set([
	'approval',
	'client-details',
	'client-discovery',
	'device-arrival',
	'device-removal',
	'device-subscribe',
	'keep-alive',
	'server-announcement',
	'set',
])
const CORE_IDS = new Set([
	'1259','1260','1261','1266','1267','1268','1273','1274','1279','1280',
	'1285','1286','1291','1292','1297','1298','1303','1304','1678','1679','1682',
])
const CORE_NAMES = new Map([
	['1259','Input 1 Mode'], ['1260','Air 1'], ['1261','Pad 1'], ['1266','Input 2 Mode'], ['1267','Air 2'], ['1268','Pad 2'],
	['1273','Air 3'], ['1274','Pad 3'], ['1279','Air 4'], ['1280','Pad 4'], ['1285','Air 5'], ['1286','Pad 5'],
	['1291','Air 6'], ['1292','Pad 6'], ['1297','Air 7'], ['1298','Pad 7'], ['1303','Air 8'], ['1304','Pad 8'],
	['1678','Monitor Dim'], ['1679','Monitor Mute'], ['1682','Talkback'],
])

function normalizeEvidence(input) {
	if (!input || typeof input !== 'object') throw new Error('Memory evidence must be an object')
	const attempted = Number(input.ProcessesAttempted ?? input.processesAttempted)
	const scanned = Number(input.ProcessesScanned ?? input.processesScanned)
	const limit = Boolean(input.ScanLimitReached ?? input.scanLimitReached)
	const restartDetected = Boolean(input.RestartDetected ?? input.restartDetected)
	if (!Number.isInteger(attempted) || attempted < 0 || attempted > 8) throw new Error('Invalid processes attempted')
	if (!Number.isInteger(scanned) || scanned < 0 || scanned > attempted) throw new Error('Invalid processes scanned')
	const framesIn = input.Frames ?? input.frames
	if (!Array.isArray(framesIn) || framesIn.length > 5000) throw new Error('Invalid memory frame evidence')
	const frames = framesIn.map((frame) => {
		const root = String(frame.Root ?? frame.root ?? '').toLowerCase()
		if (!/^[a-z][a-z0-9-]{0,63}$/.test(root)) throw new Error('Invalid memory frame root')
		const attrs = [...new Set((frame.Attributes ?? frame.attributes ?? []).map((v) => String(v).toLowerCase()))].sort()
		if (attrs.length > 64 || attrs.some((v) => !/^[a-z_:][a-z0-9_.:-]{0,63}$/.test(v))) throw new Error('Invalid memory frame attributes')
		const coreIds = [...new Set((frame.CoreIds ?? frame.coreIds ?? []).map(String))].sort((a,b) => Number(a)-Number(b))
		if (coreIds.some((id) => !CORE_IDS.has(id))) throw new Error('Unexpected Core ID in sanitized memory evidence')
		const count = Number(frame.Count ?? frame.count)
		if (!Number.isInteger(count) || count < 1 || count > 5000) throw new Error('Invalid memory frame count')
		return { root, attributes: attrs, coreIds, count }
	})
	return { processesAttempted: attempted, processesScanned: scanned, scanLimitReached: limit, restartDetected, frames }
}

function safeList(values) {
	return values.length ? values.join(', ') : '(none)'
}

function buildSanitizedMemoryReport(input) {
	const evidence = normalizeEvidence(input)
	const roots = [...new Set(evidence.frames.map((f) => f.root))].sort()
	const unknown = roots.filter((r) => !KNOWN_ROOTS.has(r))
	const core = [...new Set(evidence.frames.flatMap((f) => f.coreIds))].sort((a,b) => Number(a)-Number(b))
	const missing = [...CORE_IDS].filter((id) => !core.includes(id)).sort((a,b) => Number(a)-Number(b))
	const frameLines = evidence.frames.length
		? evidence.frames.map((f) => `- ${f.root} | count=${f.count} | attrs=${safeList(f.attributes)} | core=${safeList(f.coreIds.map((id) => `${id}:${CORE_NAMES.get(id)}`))}`)
		: ['- (no concrete framed Focusrite buffer found)']
	let decision
	if (unknown.length) decision = 'RESULT: UNKNOWN CONCRETE XML ROOT(S) FOUND IN OFFICIAL CLIENT MEMORY. Inspect observed schema before any transmission.'
	else if (evidence.frames.length) decision = 'RESULT: ONLY KNOWN CONTROL-SERVER ROOTS FOUND IN CONCRETE OFFICIAL-CLIENT MEMORY FRAMES.'
	else decision = 'RESULT: NO CONCRETE FOCUSRITE Length=XXXXXX FRAME WAS FOUND IN THE SCANNED OFFICIAL-CLIENT MEMORY.'
	const report = [
		'FOCUSRITE OFFICIAL CLIENT MEMORY OBSERVER v1',
		'Mode: READ-ONLY PROCESS MEMORY FRAME SCAN',
		'Process memory writes/injection: FORBIDDEN',
		'Focusrite protocol messages transmitted by observer: NONE',
		'Raw process memory dump/file: NONE',
		'Private paths/endpoints/ports/IDs/values publication: FORBIDDEN',
		`Official processes attempted: ${evidence.processesAttempted}`,
		`Official processes scanned: ${evidence.processesScanned}`,
		`Fresh GUI restart detected: ${evidence.restartDetected ? 'YES' : 'NO'}`,
		`Safety scan limit reached: ${evidence.scanLimitReached ? 'YES' : 'NO'}`,
		'',
		'CONCRETE FRAME SUMMARY',
		...frameLines,
		'',
		`Concrete XML roots: ${safeList(roots)}`,
		`Unknown concrete XML roots: ${safeList(unknown)}`,
		`Guarded Core IDs found inside concrete SET frames: ${safeList(core.map((id) => `${id}:${CORE_NAMES.get(id)}`))}`,
		`Guarded Core IDs not found: ${safeList(missing.map((id) => `${id}:${CORE_NAMES.get(id)}`))}`,
		'',
		'DECISION',
		decision,
		'',
	].join('\n')
	validateSanitizedMemoryReport(report)
	return report
}

function validateSanitizedMemoryReport(text) {
	const value = String(text || '')
	for (const marker of [
		'FOCUSRITE OFFICIAL CLIENT MEMORY OBSERVER v1',
		'Process memory writes/injection: FORBIDDEN',
		'Raw process memory dump/file: NONE',
		'CONCRETE FRAME SUMMARY', 'DECISION', 'RESULT:',
	]) if (!value.includes(marker)) throw new Error(`Memory report missing marker: ${marker}`)
	const forbidden = [
		/\b[A-Za-z]:\\/, /\\\\[^\\\s]+\\/, /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
		/<\/?[A-Za-z][^>]*>/, /\bLength=[0-9A-Fa-f]{6}\b/, /\bclient-key\s*=/i,
		/\bhostname\s*=/i, /\bdevid\s*=/i, /\bserial(?:-number)?\s*[:=]/i,
		/\bport\s*[:=]\s*\d+/i,
	]
	for (const rx of forbidden) if (rx.test(value)) throw new Error(`Memory report rejected by privacy rule: ${rx}`)
	return true
}

function listMemoryResults(resultDir) {
	if (!fs.existsSync(resultDir)) return []
	return fs.readdirSync(resultDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && RESULT_NAME_RE.test(entry.name))
		.map((entry) => {
			const fullPath = path.join(resultDir, entry.name)
			return { name: entry.name, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs }
		})
		.sort((a,b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))
}

function findLatestMemoryResult(resultDir) { return listMemoryResults(resultDir)[0] || null }

function buildPublishedMemory({ reportText, sourceBranch, sourceCommit, sourceFile, nodeVersion }) {
	validateSanitizedMemoryReport(reportText)
	if (sourceBranch !== 'debug/official-client-memory-observer') throw new Error('Memory observer publication refused from wrong branch')
	if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit || ''))) throw new Error('Invalid source commit SHA')
	if (!RESULT_NAME_RE.test(String(sourceFile || ''))) throw new Error('Invalid memory result filename')
	if (!/^v?22\.\d+\.\d+$/.test(String(nodeVersion || ''))) throw new Error('Invalid Node 22 metadata')
	return [
		'# Automated sanitized Focusrite official-client memory observer result', '',
		'> Generated locally from read-only process memory scanning of the freshly reopened official Focusrite client.',
		'> No raw process memory, paths, endpoints, ports, IDs, serials, client keys or values are uploaded.', '',
		`Source branch: ${sourceBranch}`, `Source commit: ${sourceCommit}`,
		`Source result: ${sourceFile}`, `Node: ${String(nodeVersion).replace(/^v/, '')}`,
		'Raw memory upload: none', 'Process memory write/injection: none', 'Focusrite observer protocol transmission: none', '',
		'---', '', reportText.trimEnd(), '',
	].join('\n')
}

module.exports = {
	RESULT_NAME_RE, KNOWN_ROOTS, CORE_IDS, CORE_NAMES,
	normalizeEvidence, buildSanitizedMemoryReport, validateSanitizedMemoryReport,
	listMemoryResults, findLatestMemoryResult, buildPublishedMemory,
}
