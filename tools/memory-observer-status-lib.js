const fs = require('node:fs')

const OUTCOMES = new Set(['SUCCESS','FAILED'])
const STAGES = new Set(['bootstrap','elevation','preflight','compile-scanner','wait-restart','scan-memory','write-sanitized-evidence','complete'])
const CODES = new Set(['ok','unexpected','uac-cancelled','elevation-failed','invalid-duration','node-unavailable','scanner-source-missing','official-client-not-found','process-memory-unreadable','status-file-invalid','preflight-validation-failed'])

function decodeStatusBuffer(buffer) {
	if (!Buffer.isBuffer(buffer)) throw new Error('Invalid status buffer')
	if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le')
	return buffer.toString('utf8').replace(/^\uFEFF/, '')
}
function parseStatusText(text) {
	const fields = new Map()
	const normalized = String(text || '').replace(/^\uFEFF/, '')
	for (const line of normalized.split(/\r?\n/)) {
		const m = /^([a-z-]+)=([A-Za-z0-9-]+)$/.exec(line.trim())
		if (m) fields.set(m[1], m[2])
	}
	const status = { outcome:fields.get('outcome')||'', stage:fields.get('stage')||'', code:fields.get('code')||'' }
	if (!OUTCOMES.has(status.outcome) || !STAGES.has(status.stage) || !CODES.has(status.code)) throw new Error('Invalid memory-observer status')
	if (status.outcome === 'SUCCESS' && (status.stage !== 'complete' || status.code !== 'ok')) throw new Error('Invalid success tuple')
	if (status.outcome === 'FAILED' && status.code === 'ok') throw new Error('Invalid failure tuple')
	return status
}
function readStatusFile(file) {
	try { return parseStatusText(decodeStatusBuffer(fs.readFileSync(file))) }
	catch { return { outcome:'FAILED', stage:'bootstrap', code:'status-file-invalid' } }
}
function buildPublishedStatus({status,sourceBranch,sourceCommit,nodeVersion}) {
	if (sourceBranch !== 'debug/official-client-memory-observer') throw new Error('Memory status publication refused from wrong branch')
	if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit||''))) throw new Error('Invalid SHA')
	if (!/^v?22\.\d+\.\d+$/.test(String(nodeVersion||''))) throw new Error('Invalid Node metadata')
	if (!OUTCOMES.has(status.outcome) || !STAGES.has(status.stage) || !CODES.has(status.code)) throw new Error('Invalid status object')
	const text = [
		'# Sanitized Focusrite official-client memory observer status','',
		'> Status only. No process names, paths, endpoints, ports, raw memory, XML, values, serials or client/device IDs are included.','',
		`Source branch: ${sourceBranch}`,`Source commit: ${sourceCommit}`,`Node: ${String(nodeVersion).replace(/^v/,'')}`,'',
		`Outcome: ${status.outcome}`,`Stage: ${status.stage}`,`Code: ${status.code}`,'',
		'Raw process memory upload: none','Process memory write/injection: none','Focusrite observer protocol transmission: none','',
	].join('\n')
	validatePublishedStatus(text)
	return text
}
function validatePublishedStatus(text) {
	const value = String(text||'')
	for (const marker of ['memory observer status','Outcome:','Stage:','Code:','Raw process memory upload: none']) if (!value.includes(marker)) throw new Error(`Missing status marker: ${marker}`)
	for (const rx of [/\b[A-Za-z]:\\/,/\\\\[^\\\s]+\\/,/\b(?:\d{1,3}\.){3}\d{1,3}\b/,/<\/?[A-Za-z][^>]*>/,/\bLength=[0-9A-Fa-f]{6}\b/,/\bclient-key\s*=/i,/\bhostname\s*=/i,/\bdevid\s*=/i,/\bserial(?:-number)?\s*[:=]/i]) if (rx.test(value)) throw new Error(`Status rejected: ${rx}`)
	return true
}
module.exports = { OUTCOMES, STAGES, CODES, decodeStatusBuffer, parseStatusText, readStatusFile, buildPublishedStatus, validatePublishedStatus }
