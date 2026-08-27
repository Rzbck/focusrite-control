'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { UNVALIDATED_CONFIGURATION_OUTPUTS } = require('../src/hardware-policy')
const EXPECTED_MODEL = 'Scarlett 18i20 (3rd Gen)'
const CLIENT_NAME = 'Companion Write Promotion Probe'
const privateDir = path.join(__dirname, 'private')
const resultsDir = path.join(__dirname, 'results')
const identityPath = path.join(privateDir, 'write-promotion-client.json')
const resultPath = path.join(resultsDir, 'latest-write-promotion.json')

const MODES = new Set(['inventory', 'custom-mix', 'mixer-slots', 'alt', 'output-stereo', 'all-nondisruptive'])
const WRITE_FLAGS = ['--allow-hardware-writes', '--confirm-audio-isolated']

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function line(status, name, detail = '') {
	console.log(`${String(status).padEnd(18)} ${name}${detail ? ` :: ${detail}` : ''}`)
}

function known(value) {
	return value !== undefined && value !== null && String(value).trim() !== ''
}

function canonicalBool(value) {
	const raw = String(value ?? '').trim().toLowerCase()
	if (['true', '1', 'on'].includes(raw)) return true
	if (['false', '0', 'off'].includes(raw)) return false
	return null
}

function publicTarget(target) {
	return {
		key: target.key,
		family: target.family,
		status: target.status,
		detail: target.detail || '',
	}
}

function readOrCreateClientId() {
	fs.mkdirSync(privateDir, { recursive: true })
	try {
		const parsed = JSON.parse(fs.readFileSync(identityPath, 'utf8'))
		if (typeof parsed.clientId === 'string' && parsed.clientId.length >= 16) return parsed.clientId
	} catch {
		// Create a local private identity below.
	}
	const clientId = randomUUID()
	fs.writeFileSync(identityPath, `${JSON.stringify({ clientId }, null, 2)}\n`, 'utf8')
	return clientId
}

function boolProbe(baseline) {
	const value = canonicalBool(baseline)
	if (value === null) return null
	return value ? 'false' : 'true'
}

function numericProbe(baseline, min, max, delta) {
	const value = Number(baseline)
	if (!Number.isFinite(value)) return null
	const plus = value + delta
	if (plus <= max) return String(plus)
	const minus = value - delta
	if (minus >= min) return String(minus)
	return null
}

function chooseAlternateSource(device, baseline) {
	const current = String(baseline)
	for (const source of device.sources || []) {
		if (!source?.id || source.hidden) continue
		if (String(source.id) !== current) return String(source.id)
	}
	return null
}

function snapshotKnownWritable(device, client) {
	const snapshot = new Map()
	for (const itemId of device.writableIds || []) {
		const id = String(itemId)
		if (device.meterIds?.has(id)) continue
		const value = client.getValue(id)
		if (known(value)) snapshot.set(id, String(value))
	}
	return snapshot
}

function diffSnapshot(before, after, ignored = new Set()) {
	const drift = []
	for (const [id, value] of before) {
		if (ignored.has(String(id))) continue
		if (!after.has(id)) continue
		if (String(after.get(id)) !== String(value)) drift.push(id)
	}
	return drift
}

async function waitValue(client, itemId, expected, timeoutMs = 5000) {
	const wanted = String(expected)
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		if (String(client.getValue(itemId) ?? '') === wanted) return true
		await sleep(50)
	}
	return false
}

function candidate(itemId, family, key, baseline, probe, extra = {}) {
	const id = itemId ? String(itemId) : ''
	if (!id) return { id, family, key, baseline, probe, status: 'SKIP_NO_CAPABILITY', ...extra }
	if (!known(baseline)) return { id, family, key, baseline, probe, status: 'SKIP_UNKNOWN_BASELINE', ...extra }
	if (probe === null || probe === undefined || String(probe) === String(baseline)) {
		return { id, family, key, baseline, probe, status: 'SKIP_NO_SAFE_PROBE', ...extra }
	}
	return { id, family, key, baseline: String(baseline), probe: String(probe), status: 'READY', ...extra }
}

function customMixTargets(device, client) {
	const targets = []
	const lanes = device.mixes || []
	for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
		const lane = lanes[laneIndex]
		const laneName = lane.label || `${lane.name} ${lane.side || ''}`.trim()
		if (lane.talkback) {
			const baseline = client.getValue(lane.talkback)
			targets.push(candidate(lane.talkback, 'mix_talkback', `${laneName}:talkback`, baseline, boolProbe(baseline)))
		}

		// Two strips per lane. Across 12 lanes this covers every slot number 1..24 exactly once,
		// while exercising both sides of every Custom Mix pair.
		const slotNumbers = [laneIndex * 2 + 1, laneIndex * 2 + 2].filter((slot) => slot >= 1 && slot <= 24)
		for (const slotNumber of slotNumbers) {
			const strip = lane.inputs?.[slotNumber - 1]
			if (!strip) continue
			for (const property of ['mute', 'solo', 'gain', 'pan']) {
				const itemId = strip[property]
				const baseline = itemId ? client.getValue(itemId) : undefined
				let probe = null
				if (property === 'mute' || property === 'solo') probe = boolProbe(baseline)
				else if (property === 'gain') probe = numericProbe(baseline, -128, 6, -1)
				else if (property === 'pan') probe = numericProbe(baseline, 0, 65535, 1024)
				targets.push(
					candidate(itemId, `mix_${property}`, `${laneName}:slot:${slotNumber}:${property}`, baseline, probe, {
						laneIndex,
						slotNumber,
					}),
				)
			}
		}
	}
	return targets
}

function mixerSlotTargets(device, client) {
	const targets = []
	for (const slot of device.mixerSlots || []) {
		const slotNumber = Number(slot.index) + 1
		if (slot.source) {
			const baseline = client.getValue(slot.source)
			targets.push(
				candidate(
					slot.source,
					'mixer_slot_source',
					`mixer-slot:${slotNumber}:source`,
					baseline,
					known(baseline) ? chooseAlternateSource(device, baseline) : null,
				),
			)
		}
		if (slot.stereo) {
			const baseline = client.getValue(slot.stereo)
			targets.push(
				candidate(slot.stereo, 'mixer_slot_stereo', `mixer-slot:${slotNumber}:stereo`, baseline, boolProbe(baseline)),
			)
		}
	}
	return targets
}

function altTargets(device, client) {
	const targets = []
	for (const [property, family] of [
		['altEnable', 'monitor_alt_enable'],
		['alt', 'monitor_alt'],
	]) {
		const itemId = device.monitoring?.[property]
		const baseline = itemId ? client.getValue(itemId) : undefined
		targets.push(candidate(itemId, family, `monitor:${property}`, baseline, boolProbe(baseline)))
	}
	return targets
}

function outputStereoTargets(device, client) {
	const targets = []
	for (const output of device.outputs || []) {
		if (output.pairSide !== 'L' || !output.stereo) continue
		if (UNVALIDATED_CONFIGURATION_OUTPUTS.has(Number(output.index))) {
			targets.push({
				id: String(output.stereo),
				family: 'output_stereo',
				key: `output:${output.index + 1}:stereo`,
				status: 'SKIP_UNVALIDATED_CONFIGURATION',
			})
			continue
		}
		const availableValue = output.available ? client.getValue(output.available) : 'true'
		const available = canonicalBool(availableValue)
		if (available !== true) {
			targets.push({
				id: String(output.stereo),
				family: 'output_stereo',
				key: `output:${output.index + 1}:stereo`,
				status: available === false ? 'SKIP_CONFIGURATION_UNAVAILABLE' : 'SKIP_UNKNOWN_AVAILABILITY',
			})
			continue
		}
		const baseline = client.getValue(output.stereo)
		targets.push(candidate(output.stereo, 'output_stereo', `output:${output.index + 1}:stereo`, baseline, boolProbe(baseline)))
	}
	return targets
}

function targetsForMode(mode, device, client) {
	if (mode === 'custom-mix') return customMixTargets(device, client)
	if (mode === 'mixer-slots') return mixerSlotTargets(device, client)
	if (mode === 'alt') return altTargets(device, client)
	if (mode === 'output-stereo') return outputStereoTargets(device, client)
	if (mode === 'all-nondisruptive') {
		return [
			...customMixTargets(device, client),
			...mixerSlotTargets(device, client),
			...altTargets(device, client),
			...outputStereoTargets(device, client),
		]
	}
	return [
		...customMixTargets(device, client),
		...mixerSlotTargets(device, client),
		...altTargets(device, client),
		...outputStereoTargets(device, client),
	]
}

function summary(targets) {
	const byFamily = {}
	for (const target of targets) {
		const family = (byFamily[target.family] ??= { total: 0, ready: 0, pass: 0, fail: 0, skipped: 0 })
		family.total++
		if (target.status === 'READY') family.ready++
		else if (target.status === 'PASS') family.pass++
		else if (String(target.status).startsWith('FAIL')) family.fail++
		else family.skipped++
	}
	return byFamily
}

async function executeTarget(client, device, target) {
	if (target.status !== 'READY') return target
	if (!device.writableIds?.has(String(target.id))) {
		return { ...target, status: 'FAIL_POLICY', detail: 'Target is not in parser writableIds.' }
	}

	const before = snapshotKnownWritable(device, client)
	if (!before.has(String(target.id))) {
		return { ...target, status: 'FAIL_BASELINE_LOST', detail: 'Known target baseline disappeared before write.' }
	}

	if (!client.setValue(device.id, target.id, target.probe)) {
		return { ...target, status: 'FAIL_WRITE_BLOCKED', detail: 'Focusrite client refused the probe write.' }
	}

	const transitionConfirmed = await waitValue(client, target.id, target.probe, target.transitionTimeoutMs || 5000)

	// A transmitted write is always followed by an explicit restore attempt, even if
	// the requested target transition was not observed. A no-transition write can still
	// have affected an alias/collateral path, so returning before restore would be unsafe.
	if (!client.setValue(device.id, target.id, target.baseline)) {
		return { ...target, status: 'FAIL_RESTORE_WRITE_BLOCKED', detail: 'Focusrite client refused the restore write.' }
	}
	if (!(await waitValue(client, target.id, target.baseline, target.restoreTimeoutMs || 7000))) {
		return { ...target, status: 'FAIL_RESTORE', detail: 'Exact target baseline was not restored.' }
	}

	await sleep(150)
	const after = snapshotKnownWritable(device, client)
	const drift = diffSnapshot(before, after, new Set([String(target.id)]))
	if (drift.length) {
		return {
			...target,
			status: 'FAIL_COLLATERAL_DRIFT',
			detail: `${drift.length} other known writable state item(s) differ after restore.`,
		}
	}
	if (!transitionConfirmed) {
		return {
			...target,
			status: 'FAIL_NO_TRANSITION',
			detail: 'Probe value was not server-confirmed; exact baseline and collateral state were restored.',
		}
	}
	return { ...target, status: 'PASS', detail: 'Probe transition + exact restore + collateral audit confirmed.' }
}

async function connectProbe({ requireAuthorised = true } = {}) {
	const { FocusriteClient } = require('../src/focusrite-client')
	const client = new FocusriteClient({
		mode: 'auto',
		host: '127.0.0.1',
		discoveryAddress: '255.255.255.255',
		clientName: CLIENT_NAME,
		clientId: readOrCreateClientId(),
		debug: false,
		targetModel: EXPECTED_MODEL,
	})

	let device = null
	let ready = false
	client.on('device-arrived', (value) => {
		device = value
	})
	client.on('ready', () => {
		ready = true
	})
	client.on('approval-required', () => {
		line('WAIT', 'Remote Devices approval', `Approve "${CLIENT_NAME}" in Focusrite Control.`)
	})
	client.on('error', (error) => line('WARN', 'Focusrite client', error.message))
	client.on('write-blocked', ({ reason }) => line('FAIL', 'Write blocked', reason))

	await client.start()
	const deadline = Date.now() + 60000
	while (Date.now() < deadline) {
		if (device?.model === EXPECTED_MODEL && ready && (!requireAuthorised || client.authorised === true)) return { client, device }
		await sleep(100)
	}
	client.stop()
	throw new Error(
		requireAuthorised
			? `Timed out waiting for exact model, state subscription and Remote Devices approval for "${CLIENT_NAME}".`
			: 'Timed out waiting for exact model and state subscription.',
	)
}

function parseMode() {
	const arg = process.argv.find((value) => value.startsWith('--mode='))
	const mode = arg ? arg.slice('--mode='.length) : 'inventory'
	if (!MODES.has(mode)) throw new Error(`Unknown mode ${mode}. Expected one of: ${[...MODES].join(', ')}`)
	return mode
}

async function main() {
	const mode = parseMode()
	const writeMode = mode !== 'inventory'
	if (writeMode) {
		for (const flag of WRITE_FLAGS) {
			if (!process.argv.includes(flag)) throw new Error(`REFUSED: missing explicit ${flag}.`)
		}
	}

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 - WRITE PROMOTION PROBE')
	console.log('==================================================================')
	console.log(`Mode: ${mode}`)
	console.log('Exact hardware scope: Scarlett 18i20 (3rd Gen) only.')
	console.log('Dynamic Focusrite Control Server discovery; separate persistent Remote Device identity.')
	console.log('No Monitor gain 1677, assign-mix, output_pair_source, raw/unknown, firmware/reset/restore/snapshot,')
	console.log('device preset, clock source, sample rate or S/PDIF mode write exists in this probe.')
	if (writeMode) {
		console.log('Every attempted write requires a known server baseline, server-confirmed transition, exact restore,')
		console.log('and collateral-state audit. Any restore/collateral failure aborts the campaign immediately.')
		console.log('Do not touch Focusrite Control while the automated write phase is running.')
	} else {
		console.log('INVENTORY ONLY: zero Focusrite writes.')
	}
	console.log('')

	const { client, device } = await connectProbe({ requireAuthorised: writeMode })
	try {
		line(
			'PASS',
			'Session',
			writeMode
				? 'Exact model + state subscription + own-client authorisation confirmed'
				: 'Exact model + state subscription confirmed; no write authorisation required for inventory',
		)
		const targets = targetsForMode(mode, device, client)
		const initial = summary(targets)
		for (const [family, counts] of Object.entries(initial)) {
			line('INFO', family, `READY=${counts.ready} / TOTAL=${counts.total} / SKIP=${counts.skipped}`)
		}

		if (!writeMode) {
			fs.mkdirSync(resultsDir, { recursive: true })
			const localResult = {
				generatedUtc: new Date().toISOString(),
				mode,
				model: EXPECTED_MODEL,
				hardwareWrites: false,
				hardAbort: false,
				byFamily: initial,
				results: targets.map(publicTarget),
			}
			fs.writeFileSync(resultPath, `${JSON.stringify(localResult, null, 2)}\n`, 'utf8')
			line('PASS', 'Inventory complete', 'No Focusrite hardware write attempted; sanitized local inventory written.')
			return
		}

		const results = []
		let hardAbort = false
		for (const target of targets) {
			if (target.status !== 'READY') {
				results.push(target)
				continue
			}
			const result = await executeTarget(client, device, target)
			results.push(result)
			line(result.status, target.key, result.detail)
			if (['FAIL_RESTORE', 'FAIL_RESTORE_WRITE_BLOCKED', 'FAIL_COLLATERAL_DRIFT'].includes(result.status)) {
				hardAbort = true
				break
			}
			await sleep(100)
		}

		const byFamily = summary(results)
		fs.mkdirSync(resultsDir, { recursive: true })
		const localResult = {
			generatedUtc: new Date().toISOString(),
			mode,
			model: EXPECTED_MODEL,
			hardwareWrites: true,
			hardAbort,
			byFamily,
			results: results.map(publicTarget),
		}
		fs.writeFileSync(resultPath, `${JSON.stringify(localResult, null, 2)}\n`, 'utf8')

		console.log('')
		console.log('==================================================================')
		console.log('WRITE PROMOTION SUMMARY')
		for (const [family, counts] of Object.entries(byFamily)) {
			console.log(`${family}: PASS=${counts.pass} FAIL=${counts.fail} SKIP=${counts.skipped} TOTAL=${counts.total}`)
		}
		console.log(`HARD ABORT: ${hardAbort}`)
		console.log('==================================================================')

		if (hardAbort) process.exitCode = 4
		else if (Object.values(byFamily).some((counts) => counts.fail > 0)) process.exitCode = 2
		else if (Object.values(byFamily).some((counts) => counts.skipped > 0)) process.exitCode = 5
		else process.exitCode = 0
	} finally {
		client.stop()
	}
}

if (require.main === module) {
	main().catch((error) => {
		line('FAIL', 'Write promotion probe', error.message)
		process.exitCode = 2
	})
}

module.exports = {
	MODES,
	known,
	canonicalBool,
	boolProbe,
	numericProbe,
	customMixTargets,
	mixerSlotTargets,
	altTargets,
	outputStereoTargets,
	targetsForMode,
	diffSnapshot,
	executeTarget,
	summary,
}
