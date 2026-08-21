const fs = require('node:fs')
const path = require('node:path')

const RESULT_RE = /^official_memory_observer_\d{8}_\d{6}\.txt$/

function validateReport(text) {
	const value = String(text || '')
	for (const marker of [
		'FOCUSRITE OFFICIAL CLIENT MEMORY OBSERVER v1',
		'Mode: READ-ONLY PROCESS MEMORY OBSERVATION',
		'Process memory writes: NONE',
		'Memory dump files: NONE',
		'Outcome:',
		'Stage:',
		'Code:',
	]) {
		if (!value.includes(marker)) throw new Error(`Memory observer report missing marker: ${marker}`)
	}
	const outcome = /Outcome: (SUCCESS|FAILED)/.exec(value)?.[1]
	if (!outcome) throw new Error('Invalid memory observer outcome')
	const forbidden = [
		/\b[A-Za-z]:\\/, /\\\\[^\\\s]+\\/, /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
		/<\/?[A-Za-z][^>]*>/, /\bLength=[0-9A-Fa-f]{6}\b/,
		/\bhostname\s*=/i, /\bclient-key\s*=/i, /\bdevid\s*=/i,
		/\bserial(?:-number)?\s*[:=]/i, /\bport\s*[:=]\s*\d+/i,
	]
	for (const rx of forbidden) if (rx.test(value)) throw new Error(`Memory observer report rejected by privacy rule: ${rx}`)
	return true
}

function listResults(dir) {
	if (!fs.existsSync(dir)) return []
	return fs.readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isFile() && RESULT_RE.test(e.name))
		.map((e) => {
			const fullPath = path.join(dir, e.name)
			return { name: e.name, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs }
		})
		.sort((a,b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))
}

function latestResult(dir) { return listResults(dir)[0] || null }

function buildPublished({ reportText, sourceBranch, sourceCommit, sourceFile, nodeVersion }) {
	validateReport(reportText)
	if (sourceBranch !== 'debug/official-client-memory-observer') throw new Error('Memory observer publication refused from wrong branch')
	if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit || ''))) throw new Error('Invalid source commit')
	if (!RESULT_RE.test(String(sourceFile || ''))) throw new Error('Invalid memory observer filename')
	if (!/^v?22\.\d+\.\d+$/.test(String(nodeVersion || ''))) throw new Error('Invalid Node version')
	const out = [
		'# Automated sanitized Focusrite official-client memory observer', '',
		'> Generated locally from read-only process-memory observation.',
		'> No memory dump, raw XML, local path, endpoint, serial, client key, device/client ID or raw frame is included.', '',
		`Source branch: ${sourceBranch}`,
		`Source commit: ${sourceCommit}`,
		`Source result: ${sourceFile}`,
		`Node: ${String(nodeVersion).replace(/^v/,'')}`,
		'Raw memory upload: none',
		'Process memory writes: none', '', '---', '', reportText.trimEnd(), '',
	].join('\n')
	validateReport(out)
	return out
}

module.exports = { RESULT_RE, validateReport, listResults, latestResult, buildPublished }
