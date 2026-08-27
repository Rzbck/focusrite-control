'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE,
	safePlanPath,
	resultsDir,
	nowIso,
	line,
	sleep,
	canonicalBool,
	findCompanion,
	get,
	readVariable,
	readVariableOptional,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')

const TARGET_OUTPUTS = [3, 4]
const REPORT_PATH = path.join(resultsDir, 'LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json'
const POLL_MIN_INTERVAL_MS = 150
const TRACKED_FIELDS = ['available', 'sourceName', 'stereo', 'assignMixClass', 'assignMixProvenance']

async function ask(prompt) {
	if (!stdin.isTTY || !stdout.isTTY) return ''
	const rl = readline.createInterface({ input: stdin, output: stdout })
	try {
		return String(await rl.question(prompt)).trim()
	} finally {
		rl.close()
	}
}

function known(item) {
	return Boolean(item?.exists && String(item.value ?? '').trim() !== '')
}

function sanitizeRow(index, values) {
	return {
		index,
		name: known(values.name) ? String(values.name.value) : `Output ${index}`,
		availableKnown: known(values.available),
		available: known(values.available) ? canonicalBool(values.available.value) : null,
		sourceKnown: known(values.sourceName),
		sourceName: known(values.sourceName) ? String(values.sourceName.value) : '',
		stereoKnown: known(values.stereo),
		stereo: known(values.stereo) ? canonicalBool(values.stereo.value) : null,
		assignMixSchemaPresent: Boolean(values.assignMixClass?.exists && values.assignMixProvenance?.exists),
		assignMixKnown: known(values.assignMixClass),
		assignMixClass: known(values.assignMixClass) ? String(values.assignMixClass.value) : '',
		assignMixProvenance: known(values.assignMixProvenance)
			? String(values.assignMixProvenance.value)
			: 'never-observed',
	}
}

async function readOutput(baseUrl, label, index) {
	const [name, available, sourceName, stereo, assignMixClass, assignMixProvenance] = await Promise.all([
		readVariableOptional(baseUrl, label, `output_${index}_name`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_available`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_source_name`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_stereo`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_assign_mix_class`, 1800),
		readVariableOptional(baseUrl, label, `output_${index}_assign_mix_provenance`, 1800),
	])
	return sanitizeRow(index, { name, available, sourceName, stereo, assignMixClass, assignMixProvenance })
}

async function snapshot(baseUrl, label, stage) {
	const outputs = []
	for (const index of TARGET_OUTPUTS) outputs.push(await readOutput(baseUrl, label, index))
	return { stage, at: nowIso(), outputs }
}

function diffSnapshots(before, after) {
	const changes = []
	for (const [i, previous] of before.outputs.entries()) {
		const current = after.outputs[i]
		if (!current || current.index !== previous.index) {
			changes.push({ output: previous.index, field: 'row', before: 'present', after: 'missing' })
			continue
		}
		for (const field of TRACKED_FIELDS) {
			if (previous[field] === current[field]) continue
			changes.push({
				output: previous.index,
				field,
				before: previous[field] ?? null,
				after: current[field] ?? null,
			})
		}
	}
	return changes
}

function routingChanged(before, after) {
	return diffSnapshots(before, after).some((change) =>
		['sourceName', 'stereo', 'assignMixClass', 'assignMixProvenance'].includes(change.field),
	)
}

function assignMixBaselineKnown(snap) {
	return snap.outputs.every((row) => row.assignMixSchemaPresent && row.assignMixKnown)
}

function baselineRestored(baseline, current) {
	const mismatches = []
	let assignMixChecked = 0
	for (const [i, before] of baseline.outputs.entries()) {
		const after = current.outputs[i]
		if (!after || before.index !== after.index) {
			mismatches.push(`Output ${before.index}: missing snapshot row`)
			continue
		}
		if (!before.sourceKnown || !after.sourceKnown || before.sourceName !== after.sourceName) {
			mismatches.push(`Output ${before.index}: source not restored`)
		}
		if (!before.stereoKnown || !after.stereoKnown || before.stereo !== after.stereo) {
			mismatches.push(`Output ${before.index}: stereo not restored`)
		}
		if (before.assignMixKnown) {
			assignMixChecked++
			if (!after.assignMixKnown || before.assignMixClass !== after.assignMixClass) {
				mismatches.push(`Output ${before.index}: assign-mix not restored`)
			}
		}
	}
	return { ok: mismatches.length === 0, mismatches, assignMixChecked }
}

function assertSafeBaseline(snap) {
	for (const row of snap.outputs) {
		if (!row.availableKnown || row.available !== 'true') {
			throw new Error(`${row.name}: availability must be server-confirmed true before this manual routing test.`)
		}
		if (!row.sourceKnown || !row.stereoKnown) {
			throw new Error(`${row.name}: source/stereo baseline is incomplete; manual routing test blocked.`)
		}
		if (!row.assignMixSchemaPresent) {
			throw new Error(
				`${row.name}: assign-mix research variables are not exposed. Enable Expose all mixer slot variables.`,
			)
		}
	}
}

function printSnapshot(snap) {
	console.log('')
	console.log(`SNAPSHOT ${snap.stage}`)
	for (const row of snap.outputs) {
		line(
			'INFO',
			row.name,
			`source=${row.sourceName || 'UNKNOWN'} stereo=${row.stereo ?? 'UNKNOWN'} assignMix=${row.assignMixKnown ? row.assignMixClass : 'UNKNOWN'}[${row.assignMixProvenance}]`,
		)
	}
}

function writeReport(payload) {
	fs.mkdirSync(resultsDir, { recursive: true })
	fs.writeFileSync(REPORT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function reportPayload(ctx, recording, current, status, restore = null) {
	return {
		reportVersion: 2,
		reportClass: 'output-routing-line34-free-recorder-sanitized',
		updatedAt: nowIso(),
		model: ctx.model,
		readOnlyHarness: true,
		hardwareWritesByHarness: false,
		companionButtonPressesByHarness: false,
		status,
		recording: {
			startedAt: recording.startedAt,
			stoppedAt: recording.stoppedAt,
			durationMs: recording.startedAtMs ? Date.now() - recording.startedAtMs : 0,
			scanCycles: recording.scanCycles,
			averageScanCycleMs: recording.scanCycles ? Math.round(recording.totalScanCycleMs / recording.scanCycles) : 0,
			maxScanCycleMs: recording.maxScanCycleMs,
			transitionCount: recording.events.length,
			events: recording.events,
			states: recording.states,
		},
		baseline: recording.baseline,
		current,
		restore,
		assignMixMaterialized: recording.events.some(
			(event) => event.field === 'assignMixClass' && String(event.after || '').trim() !== '',
		),
		privacy: 'No raw item values/IDs, serial, hostname, endpoint, client identity, raw XML or user path is stored.',
	}
}

async function resolveContext() {
	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const connectionsPayload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	if (r9.connection.moduleId !== EXPECTED_MODULE)
		throw new Error('Resolved Companion connection is not the Focusrite module.')
	const label = String(r9.connection.label)
	const model = await readVariable(baseUrl, label, 'device_model')
	if (model !== EXPECTED_MODEL) throw new Error(`Unsupported hardware for this test: ${model}`)
	const authorised = canonicalBool(await readVariable(baseUrl, label, 'client_authorised'))
	if (authorised !== 'true') throw new Error('Companion Focusrite client is not authorised in Remote Devices.')
	return { baseUrl, label, model }
}

async function observe(ctx, baseline, stopState, recording) {
	let current = baseline
	while (!stopState.stop) {
		const cycleStart = Date.now()
		const next = await snapshot(ctx.baseUrl, ctx.label, 'LIVE')
		const changes = diffSnapshots(current, next)
		if (changes.length) {
			const atMs = Date.now() - recording.startedAtMs
			for (const change of changes) {
				const event = { atMs, ...change }
				recording.events.push(event)
				console.log(
					`REC +${(atMs / 1000).toFixed(1).padStart(6)}s  Output ${change.output} ${change.field}: ${String(change.before ?? 'UNKNOWN')} -> ${String(change.after ?? 'UNKNOWN')}`,
				)
			}
			recording.states.push({ atMs, outputs: next.outputs })
			writeReport(reportPayload(ctx, recording, next, 'REC_ON'))
		}
		current = next
		const cycleMs = Date.now() - cycleStart
		recording.scanCycles++
		recording.totalScanCycleMs += cycleMs
		recording.maxScanCycleMs = Math.max(recording.maxScanCycleMs, cycleMs)
		const remaining = POLL_MIN_INTERVAL_MS - cycleMs
		if (!stopState.stop && remaining > 0) await sleep(remaining)
	}
	return current
}

async function heartbeat(stopState, recording) {
	while (!stopState.stop) {
		await sleep(5000)
		if (stopState.stop) break
		const elapsed = Math.round((Date.now() - recording.startedAtMs) / 1000)
		console.log(`>>> REC ON | ${elapsed}s | routing changes=${recording.events.length}`)
	}
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 LINE 3-4 ROUTING RECORDER - FREE / READ ONLY')
	console.log('==================================================================')
	console.log('AUCUN write Focusrite. AUCUN bouton Companion presse par le harness.')
	console.log('Le recorder observe en continu UNIQUEMENT Line Outputs 3-4.')
	console.log('Il capture source + stereo + assign-mix sans etapes 1/6, 2/6, etc.')
	console.log('')

	const ctx = await resolveContext()
	line('PASS', 'Preflight', `${ctx.model} / Companion client authorised`)
	const baseline = await snapshot(ctx.baseUrl, ctx.label, 'BASELINE')
	assertSafeBaseline(baseline)
	printSnapshot(baseline)

	console.log('')
	console.log('Pendant REC ON, reste UNIQUEMENT sur Line Outputs 3-4.')
	console.log('Tu peux tester Stereo, plusieurs sources directes et Custom Mix dans l ordre que tu veux.')
	console.log('Laisse chaque etat environ 2 secondes pour etre certain qu il soit capture.')
	console.log('AVANT d arreter REC, remets Line Outputs 3-4 comme le BASELINE affiche ci-dessus.')
	console.log('')
	await ask('Appuie sur ENTREE pour DEMARRER REC : ')

	const recording = {
		startedAt: nowIso(),
		startedAtMs: Date.now(),
		stoppedAt: null,
		scanCycles: 0,
		totalScanCycleMs: 0,
		maxScanCycleMs: 0,
		events: [],
		states: [{ atMs: 0, outputs: baseline.outputs }],
		baseline,
	}
	const stopState = { stop: false }
	let observerError = null
	const observerTask = observe(ctx, baseline, stopState, recording).catch((error) => {
		observerError = error
		stopState.stop = true
		return baseline
	})
	const heartbeatTask = heartbeat(stopState, recording)

	console.log('')
	console.log('##################################################################')
	console.log('########################  >>> REC ON <<<  ########################')
	console.log('## BOUGE LIBREMENT UNIQUEMENT LINE OUTPUTS 3-4.                 ##')
	console.log('## Source / Stereo / Custom Mix: laisse chaque etat ~2 secondes.##')
	console.log('## RESTAURE LE BASELINE AVANT D APPUYER SUR ENTREE POUR STOP.    ##')
	console.log('##################################################################')
	console.log('')
	await ask('>>> REC ON - Appuie sur ENTREE seulement quand tu as fini ET restaure le baseline : ')

	stopState.stop = true
	await Promise.all([observerTask, heartbeatTask])
	if (observerError) throw observerError
	recording.stoppedAt = nowIso()
	const final = await snapshot(ctx.baseUrl, ctx.label, 'FINAL')
	const restore = baselineRestored(baseline, final)
	let status = 'RECORDED_RESTORE_CONFIRMED'
	if (!restore.ok) status = 'RECORDED_RESTORE_NOT_CONFIRMED'
	else if (!recording.events.length) status = 'NO_ROUTING_CHANGE_OBSERVED'
	else if (!assignMixBaselineKnown(baseline))
		status = 'RECORDED_SOURCE_STEREO_RESTORE_CONFIRMED_ASSIGN_MIX_BASELINE_UNKNOWN'
	const report = reportPayload(ctx, recording, final, status, restore)
	writeReport(report)

	console.log('')
	console.log('##################################################################')
	console.log('########################  >>> REC OFF <<<  #######################')
	console.log('##################################################################')
	console.log(`Routing changes captures: ${report.recording.transitionCount}`)
	console.log(`Assign-mix materialise pendant REC: ${report.assignMixMaterialized ? 'OUI' : 'NON'}`)
	console.log(`Restauration source/stereo: ${restore.ok ? 'CONFIRMEE' : 'NON CONFIRMEE'}`)
	if (restore.mismatches.length) console.log(`Restore detail: ${restore.mismatches.join('; ')}`)
	console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
	console.log('Aucun write Focusrite ni bouton Companion n a ete declenche par ce harness.')
	console.log('==================================================================')
	if (!restore.ok) process.exitCode = 4
	else if (!recording.events.length) process.exitCode = 3
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`FAIL: ${error.message}`)
		process.exitCode = 2
	})
}

module.exports = {
	TRACKED_FIELDS,
	diffSnapshots,
	routingChanged,
	baselineRestored,
	assignMixBaselineKnown,
	assertSafeBaseline,
	reportPayload,
}
