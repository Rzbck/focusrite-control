const fs = require('node:fs')
const path = require('node:path')

const RESULT_NAME_RE = /^static_protocol_scan_\d{8}_\d{6}\.txt$/
const KNOWN_PROTOCOL_ROOTS = [
	'approval',
	'client-details',
	'client-discovery',
	'device-arrival',
	'device-removal',
	'device-subscribe',
	'keep-alive',
	'server-announcement',
	'set',
]

const INTEREST_KEYWORDS = [
	'approval', 'client', 'control', 'current', 'device', 'fetch', 'focusrite',
	'get', 'item', 'keep', 'query', 'read', 'remote', 'request', 'response',
	'server', 'snapshot', 'state', 'subscribe', 'value',
]

function isPrintableAscii(byte) {
	return byte >= 0x20 && byte <= 0x7e
}

function extractAsciiStrings(buffer, minLength = 4, maxLength = 512) {
	const out = []
	let start = -1
	for (let i = 0; i <= buffer.length; i++) {
		const printable = i < buffer.length && isPrintableAscii(buffer[i])
		if (printable && start < 0) start = i
		if ((!printable || i === buffer.length) && start >= 0) {
			const length = i - start
			if (length >= minLength) out.push(buffer.subarray(start, start + Math.min(length, maxLength)).toString('ascii'))
			start = -1
		}
	}
	return out
}

function extractUtf16LeStrings(buffer, minLength = 4, maxLength = 512) {
	const out = []
	for (const offset of [0, 1]) {
		let chars = []
		for (let i = offset; i + 1 < buffer.length; i += 2) {
			const lo = buffer[i]
			const hi = buffer[i + 1]
			if (hi === 0 && isPrintableAscii(lo)) {
				chars.push(String.fromCharCode(lo))
				if (chars.length >= maxLength) {
					out.push(chars.join(''))
					chars = []
				}
			} else {
				if (chars.length >= minLength) out.push(chars.join(''))
				chars = []
			}
		}
		if (chars.length >= minLength) out.push(chars.join(''))
	}
	return out
}

function normalizeToken(value) {
	const token = String(value || '').toLowerCase()
	return /^[a-z][a-z0-9-]{1,47}$/.test(token) ? token : null
}

function isInterestingToken(token) {
	if (!token) return false
	if (KNOWN_PROTOCOL_ROOTS.includes(token)) return true
	const parts = token.split('-')
	return INTEREST_KEYWORDS.some((word) => parts.includes(word))
}

function isReadLikeToken(token) {
	if (!token) return false
	const parts = token.split('-')
	return parts.some((part) => ['fetch', 'get', 'query', 'read', 'request', 'snapshot', 'state', 'current'].includes(part))
}

function analyzeStrings(strings) {
	const xmlRoots = new Set()
	const lexicalTokens = new Set()
	for (const raw of strings) {
		const text = String(raw || '')
		const rootRx = /<\/?([a-z][a-z0-9-]{1,47})\b/gi
		let match
		while ((match = rootRx.exec(text))) {
			const token = normalizeToken(match[1])
			if (isInterestingToken(token)) xmlRoots.add(token)
		}

		const tokenRx = /\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b/gi
		while ((match = tokenRx.exec(text))) {
			const token = normalizeToken(match[0])
			if (isInterestingToken(token)) lexicalTokens.add(token)
		}
	}

	const knownRoots = [...xmlRoots].filter((token) => KNOWN_PROTOCOL_ROOTS.includes(token)).sort()
	const candidateRoots = [...xmlRoots].filter((token) => !KNOWN_PROTOCOL_ROOTS.includes(token)).sort()
	const candidateTokens = [...new Set([...lexicalTokens, ...candidateRoots])]
		.filter((token) => !KNOWN_PROTOCOL_ROOTS.includes(token))
		.sort()
	const readLikeTokens = candidateTokens.filter(isReadLikeToken)

	return { knownRoots, candidateRoots, candidateTokens, readLikeTokens }
}

function analyzeBuffers(buffers) {
	const strings = []
	for (const buffer of buffers) {
		strings.push(...extractAsciiStrings(buffer))
		strings.push(...extractUtf16LeStrings(buffer))
	}
	return analyzeStrings(strings)
}

function safeList(values) {
	const list = [...new Set((values || []).map(normalizeToken).filter(Boolean))].sort()
	return list.length ? list.join(', ') : '(none)'
}

function buildSanitizedStaticReport({ processCount, filesScanned, exeCount, dllCount, analysis }) {
	const known = analysis?.knownRoots || []
	const roots = analysis?.candidateRoots || []
	const readLike = analysis?.readLikeTokens || []
	const decision = readLike.length
		? 'RESULT: STATIC READ-LIKE TOKEN CANDIDATES FOUND. Treat them as research clues only; do not transmit anything until a real protocol message shape is independently observed.'
		: 'RESULT: NO SEPARATE STATIC READ-LIKE PROTOCOL TOKEN FOUND. Public/community clients plus this static scan still support the subscription/event model; next step is passive official-client session observation, not invented requests.'

	return [
		'FOCUSRITE OFFICIAL CLIENT STATIC PROTOCOL SCAN v1',
		'Target: installed/running Focusrite software binaries',
		'Mode: READ-ONLY STATIC FILE SCAN',
		'Hardware/network writes: NONE',
		'Raw binary strings: NOT PUBLISHED',
		'Local paths: NOT PUBLISHED',
		`Focusrite processes discovered: ${Number(processCount || 0)}`,
		`Files scanned: ${Number(filesScanned || 0)}`,
		`Executable files scanned: ${Number(exeCount || 0)}`,
		`Library files scanned: ${Number(dllCount || 0)}`,
		`Known protocol roots found: ${safeList(known)}`,
		`Additional protocol-like XML roots: ${safeList(roots)}`,
		`Read-like lexical candidates: ${safeList(readLike)}`,
		'',
		'DECISION',
		decision,
		'',
	].join('\n')
}

function validateSanitizedStaticReport(text) {
	const value = String(text || '')
	for (const marker of [
		'FOCUSRITE OFFICIAL CLIENT STATIC PROTOCOL SCAN v1',
		'Mode: READ-ONLY STATIC FILE SCAN',
		'Hardware/network writes: NONE',
		'Raw binary strings: NOT PUBLISHED',
		'Local paths: NOT PUBLISHED',
		'DECISION',
		'RESULT:',
	]) {
		if (!value.includes(marker)) throw new Error(`Static scan missing required marker: ${marker}`)
	}

	const forbidden = [
		{ name: 'Windows absolute path', rx: /\b[A-Za-z]:\\/ },
		{ name: 'UNC path', rx: /\\\\[^\\\s]+\\/ },
		{ name: 'IPv4 address', rx: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
		{ name: 'raw XML', rx: /<\/?[A-Za-z][^>]*>/ },
		{ name: 'raw Focusrite frame header', rx: /\bLength=[0-9A-Fa-f]{6}\b/ },
		{ name: 'client key value', rx: /\bclient-key\s*=/i },
		{ name: 'device id value', rx: /\bdevid\s*=/i },
		{ name: 'hostname value', rx: /\bhostname\s*=/i },
		{ name: 'port value', rx: /\bport\s*=/i },
		{ name: 'serial value', rx: /\bserial(?:-number)?\s*[:=]/i },
	]
	for (const item of forbidden) {
		if (item.rx.test(value)) throw new Error(`Static scan rejected: ${item.name}`)
	}
	return true
}

function listStaticScanResults(resultDir) {
	if (!fs.existsSync(resultDir)) return []
	return fs.readdirSync(resultDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && RESULT_NAME_RE.test(entry.name))
		.map((entry) => {
			const fullPath = path.join(resultDir, entry.name)
			return { name: entry.name, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs }
		})
		.sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))
}

function findLatestStaticScanResult(resultDir) {
	return listStaticScanResults(resultDir)[0] || null
}

function buildPublishedStaticScan({ reportText, sourceBranch, sourceCommit, sourceFile, nodeVersion }) {
	validateSanitizedStaticReport(reportText)
	if (String(sourceBranch) !== 'debug/official-client-read-source') throw new Error('Static scan publication allowed only from debug/official-client-read-source')
	if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit || ''))) throw new Error('Invalid source commit SHA')
	if (!RESULT_NAME_RE.test(String(sourceFile || ''))) throw new Error('Invalid static scan source filename')
	if (!/^v?22\.\d+\.\d+$/.test(String(nodeVersion || ''))) throw new Error('Invalid Node 22 version metadata')

	return [
		'# Automated sanitized Focusrite official-client static protocol scan',
		'',
		'> Generated locally from installed Focusrite software in read-only mode.',
		'> Raw binary strings and local paths are intentionally excluded.',
		'',
		`Source branch: ${sourceBranch}`,
		`Source commit: ${sourceCommit}`,
		`Source result: ${sourceFile}`,
		`Node: ${String(nodeVersion).replace(/^v/, '')}`,
		'Local binary modification: none',
		'Focusrite protocol transmission: none',
		'',
		'---',
		'',
		reportText.trimEnd(),
		'',
	].join('\n')
}

module.exports = {
	RESULT_NAME_RE,
	KNOWN_PROTOCOL_ROOTS,
	extractAsciiStrings,
	extractUtf16LeStrings,
	analyzeStrings,
	analyzeBuffers,
	buildSanitizedStaticReport,
	validateSanitizedStaticReport,
	listStaticScanResults,
	findLatestStaticScanResult,
	buildPublishedStaticScan,
}
