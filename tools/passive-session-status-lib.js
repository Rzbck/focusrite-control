const fs = require('node:fs')

const ALLOWED_OUTCOMES = new Set(['SUCCESS', 'FAILED'])
const ALLOWED_STAGES = new Set([
	'bootstrap', 'elevation', 'preflight', 'detect-server-port', 'inspect-filters',
	'add-filter', 'capture-start', 'capture-window', 'capture-stop', 'convert',
	'parse', 'cleanup', 'complete',
])
const ALLOWED_CODES = new Set([
	'ok', 'uac-cancelled', 'elevation-failed', 'pktmon-unavailable', 'node-unavailable',
	'invalid-duration', 'no-server-listener', 'ambiguous-server-listener', 'filter-inspect-failed',
	'filters-active', 'filter-add-failed', 'capture-start-failed', 'capture-stop-failed',
	'etl-missing', 'conversion-failed', 'parser-failed', 'cleanup-failed', 'unexpected',
])

function parseStatusText(text) {
	const fields = new Map()
	for (const line of String(text || '').split(/\r?\n/)) {
		const match = /^([a-z-]+)=([A-Za-z0-9-]+)$/.exec(line.trim())
		if (match) fields.set(match[1], match[2])
	}
	const outcome = fields.get('outcome') || ''
	const stage = fields.get('stage') || ''
	const code = fields.get('code') || ''
	if (!ALLOWED_OUTCOMES.has(outcome)) throw new Error('Invalid passive-session status outcome')
	if (!ALLOWED_STAGES.has(stage)) throw new Error('Invalid passive-session status stage')
	if (!ALLOWED_CODES.has(code)) throw new Error('Invalid passive-session status code')
	if (outcome === 'SUCCESS' && (stage !== 'complete' || code !== 'ok')) throw new Error('Invalid success status tuple')
	if (outcome === 'FAILED' && code === 'ok') throw new Error('Invalid failure status tuple')
	return { outcome, stage, code }
}

function readStatusFile(file) {
	return parseStatusText(fs.readFileSync(file, 'utf8'))
}

function buildPublishedStatus({ status, sourceBranch, sourceCommit, nodeVersion }) {
	if (!status || !ALLOWED_OUTCOMES.has(status.outcome) || !ALLOWED_STAGES.has(status.stage) || !ALLOWED_CODES.has(status.code)) {
		throw new Error('Invalid passive-session status object')
	}
	if (sourceBranch !== 'debug/official-client-passive-session') throw new Error('Status publication refused from wrong branch')
	if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit || ''))) throw new Error('Invalid source commit SHA')
	if (!/^v?22\.\d+\.\d+$/.test(String(nodeVersion || ''))) throw new Error('Invalid Node 22 metadata')
	const text = [
		'# Sanitized Focusrite passive-session harness status', '',
		'> Machine-generated status only. No raw log, local path, endpoint, port, process name, XML, client key, serial or device/client ID is included.', '',
		`Source branch: ${sourceBranch}`,
		`Source commit: ${sourceCommit}`,
		`Node: ${String(nodeVersion).replace(/^v/, '')}`, '',
		`Outcome: ${status.outcome}`,
		`Stage: ${status.stage}`,
		`Code: ${status.code}`, '',
		'Raw capture upload: none',
		'Focusrite observer protocol transmission: none', '',
	].join('\n')
	validatePublishedStatus(text)
	return text
}

function validatePublishedStatus(text) {
	const value = String(text || '')
	for (const marker of ['Sanitized Focusrite passive-session harness status', 'Outcome:', 'Stage:', 'Code:', 'Raw capture upload: none']) {
		if (!value.includes(marker)) throw new Error(`Status missing marker: ${marker}`)
	}
	const forbidden = [
		/\b[A-Za-z]:\\/, /\\\\[^\\\s]+\\/, /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
		/<\/?[A-Za-z][^>]*>/, /\bLength=[0-9A-Fa-f]{6}\b/, /\bclient-key\s*=/i,
		/\bhostname\s*=/i, /\bdevid\s*=/i, /\bserial(?:-number)?\s*[:=]/i,
		/\bport\s*[:=]\s*\d+/i,
	]
	for (const rx of forbidden) if (rx.test(value)) throw new Error(`Status rejected by privacy rule: ${rx}`)
	return true
}

module.exports = {
	ALLOWED_OUTCOMES, ALLOWED_STAGES, ALLOWED_CODES,
	parseStatusText, readStatusFile, buildPublishedStatus, validatePublishedStatus,
}
