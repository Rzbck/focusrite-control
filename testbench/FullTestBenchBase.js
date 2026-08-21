const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const packageJson = require('../package.json')

const EXPECTED_MODEL = 'Scarlett 18i20 (3rd Gen)'
const EXPECTED_MODULE = 'focusrite-scarlett-18i20'
const EXPECTED_MODULE_VERSION = packageJson.version
const R9_PAGE_NAME = 'Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]'
const R9_MARKER = 'TB-R9-ALL'
const EXT_MARKER = 'TB-FULL-EXT'
const EXT_INSTANCE_ID = 'focusrite-full-testbench-target'
const FILE_VERSION = 12
const COMPANION_BUILD = '5.0.3'
const testbenchDir = __dirname
const safePlanPath = path.join(testbenchDir, 'Focusrite_18i20_SafeHardwarePlan.json')
const generatedDir = path.join(testbenchDir, 'generated')
const resultsDir = path.join(testbenchDir, 'results')
const generatedPagePath = path.join(generatedDir, 'FULL_EXTENDED.companionconfig')
const generatedManifestPath = path.join(generatedDir, 'FULL_EXTENDED_MANIFEST.json')

const MONITOR_PRESET_VALUES = ['1-2', '1-4', '1-6', '1-8', 'All', 'None']
const TALKBACK_SOURCE_CANDIDATES = ['Scarlett Internal Mic', 'Analogue 1']
// Schema-observed left members of all Scarlett 18i20 (3rd Gen) output pairs.
const OUTPUT_PAIR_LEFT_INDICES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]
const DISRUPTIVE_DEFINITIONS = new Set(['device_preset', 'clock_source', 'sample_rate', 'spdif_mode'])
const FORBIDDEN_DEFINITIONS = new Set([
	'monitor_gain_set',
	'monitor_gain_adjust',
	'advanced_raw_set',
	'input_mode_cycle',
])
const EXTENDED_ALLOWED = new Set([
	'monitor_alt_enable',
	'monitor_alt',
	'monitor_preset',
	'input_nickname',
	'output_mute',
	'output_gain_set',
	'output_gain_adjust',
	'output_source',
	'output_pair_source',
	'output_stereo',
	'output_nickname',
	'mixer_slot_source',
	'mixer_slot_stereo',
	'mix_mute',
	'mix_solo',
	'mix_gain_set',
	'mix_gain_adjust',
	'mix_pan',
	'mix_talkback',
	'device_nickname',
	'phantom_persistence',
	'talkback_source',
])

function nowIso() {
	return new Date().toISOString()
}

function line(status, name, detail = '') {
	console.log(`${String(status).padEnd(18)} ${name}${detail ? ` :: ${detail}` : ''}`)
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function stableStringify(value) {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
	if (value && typeof value === 'object') {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
			.join(',')}}`
	}
	return JSON.stringify(value)
}

function hashObject(value) {
	return crypto.createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 16)
}

function deterministicId(text) {
	const hash = crypto.createHash('sha256').update(text).digest('hex')
	return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

function canonicalBool(value) {
	const raw = String(value ?? '').trim().toLowerCase()
	if (['true', 'on', '1'].includes(raw)) return 'true'
	if (['false', 'off', '0'].includes(raw)) return 'false'
	return null
}

function boolState(value, fallback = 'off') {
	const b = canonicalBool(value)
	if (b === 'true') return 'on'
	if (b === 'false') return 'off'
	return fallback
}

function rawPanToPercent(raw) {
	const n = Number(raw)
	if (!Number.isFinite(n)) return 0
	return ((n / 65535) * 200) - 100
}

function expectedPanRaw(percent) {
	return String(Math.round(((Number(percent) + 100) / 200) * 65535))
}

async function request(baseUrl, route, method = 'GET', timeoutMs = 5000, body = undefined) {
	const response = await fetch(`${baseUrl}${route}`, {
		method,
		body,
		headers: body === undefined ? undefined : { 'content-type': 'application/json' },
		signal: AbortSignal.timeout(timeoutMs),
	})
	const text = method === 'HEAD' ? '' : await response.text()
	return { status: response.status, text, xApp: response.headers.get('x-app') || '' }
}

async function findCompanion() {
	const ports = new Set([8000])
	try {
		const output = execFileSync(
			'powershell.exe',
			[
				'-NoProfile',
				'-NonInteractive',
				'-Command',
				'[System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | ForEach-Object { $_.Port }',
			],
			{ encoding: 'utf8', windowsHide: true }
		)
		for (const raw of output.split(/\r?\n/)) {
			const port = Number(raw.trim())
			if (Number.isInteger(port)) ports.add(port)
		}
	} catch {
		// Portable fallback candidates are probed below.
	}

	for (const port of ports) {
		if (!Number.isInteger(port) || port < 1024 || port > 65535) continue
		try {
			const probe = await request(`http://127.0.0.1:${port}`, '/', 'HEAD', 650)
			if (probe.xApp === 'Bitfocus Companion') return `http://127.0.0.1:${port}`
		} catch {
			// Not Companion.
		}
	}
	throw new Error('No local Bitfocus Companion web service was detected.')
}

async function get(baseUrl, route, timeoutMs = 5000) {
	const response = await request(baseUrl, route, 'GET', timeoutMs)
	if (response.status === 403) throw new Error('Companion refused a required local API call (HTTP 403).')
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`Companion returned HTTP ${response.status} for required read ${route}.`)
	}
	return response.text
}

async function post(baseUrl, route, timeoutMs = 5000) {
	const response = await request(baseUrl, route, 'POST', timeoutMs)
	if (response.status === 204) throw new Error(`No control exists for ${route}.`)
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`Companion returned HTTP ${response.status} for required write ${route}.`)
	}
	return response.text
}

async function readVariableOptional(baseUrl, label, variable, timeoutMs = 5000) {
	const route = `/api/variable/${encodeURIComponent(label)}/${encodeURIComponent(variable)}/value`
	const response = await request(baseUrl, route, 'GET', timeoutMs)
	if (response.status === 404) return { exists: false, value: '' }
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`Variable read failed for ${variable} (HTTP ${response.status}).`)
	}
	return { exists: true, value: response.text.trim() }
}

async function readVariable(baseUrl, label, variable, timeoutMs = 5000) {
	const item = await readVariableOptional(baseUrl, label, variable, timeoutMs)
	if (!item.exists) throw new Error(`Required variable ${variable} is not exposed by Companion.`)
	return item.value
}

async function waitVariable(baseUrl, label, variable, predicate, timeoutMs = 5000) {
	const deadline = Date.now() + timeoutMs
	let last = ''
	while (Date.now() < deadline) {
		const item = await readVariableOptional(baseUrl, label, variable, 1500)
		last = item.exists ? item.value : ''
		if (item.exists && predicate(last)) return { ok: true, value: last }
		await sleep(100)
	}
	return { ok: false, value: last }
}

async function waitExact(baseUrl, label, variable, expected, timeoutMs = 5000) {
	const wanted = String(expected)
	return waitVariable(baseUrl, label, variable, (value) => String(value) === wanted, timeoutMs)
}

async function mapLimit(items, limit, worker) {
	const output = new Array(items.length)
	let cursor = 0
	const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (true) {
			const index = cursor++
			if (index >= items.length) return
			output[index] = await worker(items[index], index)
		}
	})
	await Promise.all(runners)
	return output
}

function unwrapOptions(options) {
	return Object.fromEntries(
		Object.entries(options || {}).map(([key, wrapped]) => {
			if (!wrapped || wrapped.isExpression !== false) {
				throw new Error('TestBench entity option is not a literal value.')
			}
			return [key, wrapped.value]
		})
	)
}

function actionSetsContainWrites(control) {
	for (const step of Object.values(control?.steps || {})) {
		for (const actions of Object.values(step?.action_sets || {})) {
			if (Array.isArray(actions) && actions.length > 0) return true
		}
	}
	return false
}

function collectActions(control) {
	const found = []
	for (const step of Object.values(control?.steps || {})) {
		for (const actions of Object.values(step?.action_sets || {})) {
			for (const action of Array.isArray(actions) ? actions : []) found.push(action)
		}
	}
	return found
}

function collectFeedbacks(page) {
	const probes = []
	for (const [row, rowObj] of Object.entries(page.controls || {})) {
		for (const [column, control] of Object.entries(rowObj || {})) {
			if (!control || !Array.isArray(control.feedbacks) || control.feedbacks.length === 0) continue
			if (actionSetsContainWrites(control)) {
				throw new Error(`Feedback probe at ${row}/${column} unexpectedly contains an action.`)
			}
			for (const feedback of control.feedbacks) {
				if (feedback?.type !== 'feedback') throw new Error(`Invalid feedback entity at ${row}/${column}.`)
				probes.push({
					row: Number(row),
					column: Number(column),
					definitionId: feedback.definitionId,
					connectionId: feedback.connectionId,
					options: unwrapOptions(feedback.options),
				})
			}
		}
	}
	return probes
}

function pageHasMarker(page, marker) {
	return JSON.stringify(page || {}).includes(marker)
}

function resolveLiveConnection(connections, exportedInstance) {
	const candidates = connections.filter((item) => item?.moduleId === EXPECTED_MODULE && item?.enabled === true)
	if (candidates.length === 0) throw new Error('No enabled Focusrite 18i20 Companion connection was found.')
	if (candidates.length === 1) return candidates[0]
	const exportedLabel = String(exportedInstance?.label || '').trim()
	if (exportedLabel) {
		const matches = candidates.filter((item) => String(item?.label || '').trim() === exportedLabel)
		if (matches.length === 1) return matches[0]
	}
	throw new Error('Multiple Focusrite connections exist and the TestBench page cannot be mapped uniquely.')
}

async function exportButtons(baseUrl) {
	const route =
		'/int/export/custom?buttons=true&connections=false&surfaces.known=false&surfaces.instances=false&surfaces.remote=false&triggers=false&customVariables=false&expressionVariables=false&includeSecrets=false&imageLibrary=false&format=json'
	const exported = JSON.parse(await get(baseUrl, route, 30000))
	if (exported.type !== 'full' || !exported.pages) throw new Error('Companion buttons-only export is unavailable.')
	return exported
}


module.exports = { EXPECTED_MODEL, EXPECTED_MODULE, EXPECTED_MODULE_VERSION, R9_PAGE_NAME, R9_MARKER, EXT_MARKER, EXT_INSTANCE_ID, FILE_VERSION, COMPANION_BUILD, testbenchDir, safePlanPath, generatedDir, resultsDir, generatedPagePath, generatedManifestPath, MONITOR_PRESET_VALUES, TALKBACK_SOURCE_CANDIDATES, OUTPUT_PAIR_LEFT_INDICES, DISRUPTIVE_DEFINITIONS, FORBIDDEN_DEFINITIONS, EXTENDED_ALLOWED, nowIso, line, sleep, stableStringify, hashObject, deterministicId, canonicalBool, boolState, rawPanToPercent, expectedPanRaw, request, findCompanion, get, post, readVariableOptional, readVariable, waitVariable, waitExact, mapLimit, unwrapOptions, actionSetsContainWrites, collectActions, collectFeedbacks, pageHasMarker, resolveLiveConnection, exportButtons }
