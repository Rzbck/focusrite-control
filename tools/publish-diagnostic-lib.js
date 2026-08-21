const fs = require('node:fs')
const path = require('node:path')

const RESULT_NAME_RE = /^readonly_state_probe_\d{8}_\d{6}\.txt$/

function listReadbackResults(resultDir) {
	if (!fs.existsSync(resultDir)) return []
	return fs
		.readdirSync(resultDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && RESULT_NAME_RE.test(entry.name))
		.map((entry) => {
			const fullPath = path.join(resultDir, entry.name)
			return { name: entry.name, fullPath, mtimeMs: fs.statSync(fullPath).mtimeMs }
		})
		.sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name))
}

function findLatestReadbackResult(resultDir) {
	return listReadbackResults(resultDir)[0] || null
}

function validateSanitizedReadback(text) {
	const value = String(text || '')
	const required = [
		'FOCUSRITE CONTROL READ-ONLY STATE PROBE v2',
		'Target model: Scarlett 18i20 (3rd Gen)',
		'TCP transmit allowlist: client-details, device-subscribe, keep-alive',
		'Hardware <set> writes: FORBIDDEN',
		'Raw/private protocol logging: DISABLED',
		'DECISION',
		'RESULT:',
	]
	for (const marker of required) {
		if (!value.includes(marker)) throw new Error(`Sanitized result missing required marker: ${marker}`)
	}

	const forbidden = [
		{ name: 'Windows absolute path', rx: /\b[A-Za-z]:\\/ },
		{ name: 'UNC path', rx: /\\\\[^\\\s]+\\/ },
		{ name: 'IPv4 address', rx: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
		{ name: 'raw Focusrite frame header', rx: /\bLength=[0-9A-Fa-f]{6}\b/ },
		{ name: 'raw server announcement', rx: /<server-announcement\b/i },
		{ name: 'raw device arrival', rx: /<device-arrival\b/i },
		{ name: 'raw client details', rx: /<client-details\b/i },
		{ name: 'raw approval', rx: /<approval\b/i },
		{ name: 'raw set payload', rx: /<set\b[^>]*(?:devid|id|value)=/i },
		{ name: 'client key', rx: /\bclient-key\s*=/i },
		{ name: 'device id attribute', rx: /\bdevid\s*=/i },
		{ name: 'hostname attribute', rx: /\bhostname\s*=/i },
		{ name: 'port attribute', rx: /\bport\s*=/i },
		{ name: 'serial value', rx: /\bserial(?:-number)?\s*[:=]/i },
	]
	for (const item of forbidden) {
		if (item.rx.test(value)) throw new Error(`Sanitized result rejected: ${item.name}`)
	}

	const phases = ['PHASE A', 'PHASE B', 'PHASE C']
	for (const phase of phases) {
		if (!value.includes(phase)) throw new Error(`Sanitized result missing ${phase}`)
	}

	return true
}

function buildPublishedReadback({ reportText, sourceBranch, sourceCommit, sourceFile, nodeVersion }) {
	validateSanitizedReadback(reportText)
	if (!/^debug\/cold-start-readback$/.test(String(sourceBranch || ''))) {
		throw new Error('Automatic readback publication is allowed only from debug/cold-start-readback')
	}
	if (!/^[0-9a-f]{40}$/i.test(String(sourceCommit || ''))) throw new Error('Invalid source commit SHA')
	if (!RESULT_NAME_RE.test(String(sourceFile || ''))) throw new Error('Invalid sanitized source filename')
	if (!/^v?22\.\d+\.\d+$/.test(String(nodeVersion || ''))) throw new Error('Invalid Node 22 version metadata')

	return [
		'# Automated sanitized Focusrite readback diagnostic',
		'',
		'> Generated locally by `debug/cold-start-readback` and pushed automatically.',
		'> This file intentionally excludes raw XML, serial numbers, hostnames, network endpoints, client/device IDs and local paths.',
		'',
		`Source branch: ${sourceBranch}`,
		`Source commit: ${sourceCommit}`,
		`Source result: ${sourceFile}`,
		`Node: ${String(nodeVersion).replace(/^v/, '')}`,
		'Runner preflight: syntax checks + dedicated readback tests passed',
		'Hardware write path: forbidden by probe allowlist',
		'',
		'---',
		'',
		reportText.trimEnd(),
		'',
	].join('\n')
}

module.exports = {
	RESULT_NAME_RE,
	listReadbackResults,
	findLatestReadbackResult,
	validateSanitizedReadback,
	buildPublishedReadback,
}
