'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE_VERSION,
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
	mapLimit,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')
const { METER_DEFINITIONS, feedbackOracle, evaluateOracle } = require('./FullTestBenchFeedbackV6')

const LATEST_REPORT = path.join(resultsDir, 'LATEST_MANUAL_FEEDBACK_SWEEP.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_MANUAL_FEEDBACK_SWEEP.json'
const PRIOR_METER_REPORT = path.join(resultsDir, 'LATEST_METER_FEEDBACK_CLOSURE.json')
const METER_FLOOR_DBFS = -128
const CONTROL_POLL_INTERVAL_MS = 120
const FEEDBACK_SETTLE_TIMEOUT_MS = 1200

async function ask(prompt) {
	if (!stdin.isTTY || !stdout.isTTY) return ''
	const rl = readline.createInterface({ input: stdin, output: stdout })
	try {
		return String(await rl.question(prompt)).trim()
	} finally {
		rl.close()
	}
}

function keyOf(probe) {
	return `${probe.row}/${probe.column}`
}

function labelOf(probe) {
	const options = Object.entries(probe.options || {})
		.map(([key, value]) => `${key}=${value}`)
		.join(',')
	return options ? `${probe.definitionId} [${options}]` : probe.definitionId
}

function controlProbes(probes) {
	return probes.filter((probe) => !METER_DEFINITIONS.has(probe.definitionId))
}

function meterPathLabel(probe) {
	const options = probe.options || {}
	if (probe.definitionId === 'input_meter') return `Input ${Number(options.input) + 1}`
	if (probe.definitionId === 'output_meter') return `Output ${Number(options.output) + 1}`
	if (probe.definitionId === 'mix_meter') return `Mix ${String(options.mix || '?')} ${String(options.side || '?')}`
	return labelOf(probe)
}

async function readMarker(baseUrl, pageNumber, probe) {
	const variable = `b_text_${pageNumber}_${probe.row}_${probe.column}`
	const item = await readVariableOptional(baseUrl, 'internal', variable, 1800)
	if (!item.exists) return null
	const marker = String(item.value).split(/\r?\n/).at(-1)?.trim()
	return ['T', 'F'].includes(marker) ? marker : null
}

async function captureMarkers(baseUrl, pageNumber, probes) {
	const rows = await mapLimit(probes, 32, async (probe) => [keyOf(probe), await readMarker(baseUrl, pageNumber, probe)])
	return new Map(rows)
}

function changedProbes(probes, before, after) {
	return probes.filter((probe) => before.get(keyOf(probe)) !== after.get(keyOf(probe)))
}

function controlOracleGroups(probes) {
	const groups = new Map()
	for (const probe of probes) {
		const oracle = feedbackOracle(probe)
		if (oracle.kind === 'unmapped' || !oracle.source) continue
		if (!groups.has(oracle.source)) groups.set(oracle.source, { source: oracle.source, entries: [] })
		groups.get(oracle.source).entries.push({ probe, oracle })
	}
	return groups
}

async function captureControlSources(context, groups) {
	const rows = await mapLimit([...groups.values()], 48, async (group) => {
		const item = await readVariableOptional(context.baseUrl, context.label, group.source, 1600)
		return [group.source, item.exists ? String(item.value) : null]
	})
	return new Map(rows)
}

function expectedTransitions(group, before, after) {
	const transitions = []
	for (const entry of group.entries) {
		if (before === null || after === null || before === '' || after === '') continue
		const previous = evaluateOracle(entry.oracle, before)
		const next = evaluateOracle(entry.oracle, after)
		if (!previous.evaluable || !next.evaluable || previous.wanted === next.wanted) continue
		transitions.push({ ...entry, beforeWanted: previous.wanted, afterWanted: next.wanted })
	}
	return transitions
}

function valueClass(group, raw) {
	if (raw === null || raw === '') return 'UNKNOWN'
	const bool = canonicalBool(raw)
	if (bool !== null) return bool === 'true' ? 'TRUE' : 'FALSE'
	const connected = group.entries.find((entry) => entry.oracle.kind === 'connected')
	if (connected) return String(raw).startsWith('Connected') ? 'CONNECTED' : 'NOT_CONNECTED'
	const matches = group.entries.filter(
		(entry) => entry.oracle.kind === 'equals' && String(raw) === String(entry.oracle.value),
	)
	if (matches.length === 1) return `MATCH:${labelOf(matches[0].probe)}`
	if (matches.length > 1) return `MATCH:${matches.map((entry) => keyOf(entry.probe)).join(',')}`
	return 'KNOWN_VALUE'
}

async function waitForExpectedMarker(context, probe, wanted) {
	const deadline = Date.now() + FEEDBACK_SETTLE_TIMEOUT_MS
	let marker = null
	while (Date.now() < deadline) {
		marker = await readMarker(context.baseUrl, context.r9.pageNumber, probe)
		if (marker && (marker === 'T') === wanted) return { marker, matched: true }
		await sleep(75)
	}
	return { marker, matched: Boolean(marker) && (marker === 'T') === wanted }
}

function newControlTrack(probe, baselineMarker) {
	return {
		id: `${probe.definitionId}:${keyOf(probe)}`,
		probe,
		definitionId: probe.definitionId,
		seenTrue: baselineMarker === 'T',
		seenFalse: baselineMarker === 'F',
		observations: baselineMarker ? 1 : 0,
		transitions: 0,
		mismatch: false,
	}
}

function seedControlTracks(probes, baselineMarkers) {
	return new Map(
		probes.map((probe) => {
			const track = newControlTrack(probe, baselineMarkers.get(keyOf(probe)) || null)
			return [track.id, track]
		}),
	)
}

function applyControlObservation(track, marker, status) {
	if (marker === 'T') track.seenTrue = true
	if (marker === 'F') track.seenFalse = true
	if (marker) track.observations++
	track.transitions++
	if (status === 'FAIL_MISMATCH') track.mismatch = true
}

function summarizeControlTracks(tracks) {
	const summary = { total: tracks.size, bothStates: 0, singleState: 0, unresolved: 0, mismatch: 0, transitions: 0 }
	for (const track of tracks.values()) {
		if (track.mismatch) summary.mismatch++
		if (track.seenTrue && track.seenFalse) summary.bothStates++
		else if (track.seenTrue || track.seenFalse) summary.singleState++
		else summary.unresolved++
		summary.transitions += track.transitions
	}
	return summary
}

async function validateSourceChange(context, group, before, after, controlTracks, startedAtMs) {
	const transitions = expectedTransitions(group, before, after)
	const feedbacks = await mapLimit(transitions, 16, async (entry) => {
		const observed = await waitForExpectedMarker(context, entry.probe, entry.afterWanted)
		const status = observed.matched ? 'PASS' : observed.marker ? 'FAIL_MISMATCH' : 'EVAL_ONLY'
		const track = controlTracks.get(`${entry.probe.definitionId}:${keyOf(entry.probe)}`)
		if (track) applyControlObservation(track, observed.marker, status)
		return {
			definitionId: entry.probe.definitionId,
			options: entry.probe.options,
			marker: observed.marker,
			expectedMarker: entry.afterWanted ? 'T' : 'F',
			status,
		}
	})
	const pass = feedbacks.filter((entry) => entry.status === 'PASS').length
	const fail = feedbacks.filter((entry) => entry.status === 'FAIL_MISMATCH').length
	const evalOnly = feedbacks.filter((entry) => entry.status === 'EVAL_ONLY').length
	const elapsedMs = Date.now() - startedAtMs
	console.log(
		`REC +${(elapsedMs / 1000).toFixed(1).padStart(6)}s  ${group.source}  ${valueClass(group, before)} -> ${valueClass(group, after)}  feedback PASS=${pass} EVAL=${evalOnly} FAIL=${fail}`,
	)
	return {
		atMs: elapsedMs,
		source: group.source,
		before: valueClass(group, before),
		after: valueClass(group, after),
		expectedFeedbackTransitions: transitions.length,
		feedbacks,
	}
}

async function observeControls(context, groups, baselineSources, controlTracks, stopState, recording, meterTracks, seeded) {
	const current = new Map(baselineSources)
	while (!stopState.stop) {
		const cycleStart = Date.now()
		const next = await captureControlSources(context, groups)
		const changes = []
		for (const group of groups.values()) {
			const before = current.get(group.source) ?? null
			const after = next.get(group.source) ?? null
			if (before === after) continue
			current.set(group.source, after)
			changes.push({ group, before, after })
		}
		if (changes.length) {
			const events = await mapLimit(changes, 12, async (change) =>
				validateSourceChange(
					context,
					change.group,
					change.before,
					change.after,
					controlTracks,
					recording.startedAtMs,
				),
			)
			recording.events.push(...events)
			recording.sourceChanges += events.length
			recording.feedbackTransitions += events.reduce((sum, event) => sum + event.feedbacks.length, 0)
			saveReport(context, recording, controlTracks, meterTracks, seeded)
		}
		recording.scanCycles++
		recording.maxScanCycleMs = Math.max(recording.maxScanCycleMs, Date.now() - cycleStart)
		const remaining = CONTROL_POLL_INTERVAL_MS - (Date.now() - cycleStart)
		if (!stopState.stop && remaining > 0) await sleep(remaining)
	}
}

async function heartbeat(stopState, recording) {
	while (!stopState.stop) {
		await sleep(5000)
		if (stopState.stop) break
		const elapsed = Math.round((Date.now() - recording.startedAtMs) / 1000)
		console.log(
			`>>> REC ON | ${elapsed}s | server changes=${recording.sourceChanges} | feedback transitions=${recording.feedbackTransitions}`,
		)
	}
}

function newMeterTrack(probe) {
	const oracle = feedbackOracle(probe)
	return {
		id: `${probe.definitionId}:${keyOf(probe)}`,
		probe,
		definitionId: probe.definitionId,
		label: meterPathLabel(probe),
		source: oracle.source,
		threshold: Number(oracle.threshold),
		min: null,
		max: null,
		samples: 0,
		seenFloor: false,
		seenMovement: false,
		mismatch: false,
		mismatchCount: 0,
		mismatchStreak: 0,
	}
}

function mergeMeterEvidence(tracks, paths) {
	let loaded = 0
	if (!Array.isArray(paths)) return loaded
	const byId = new Map(paths.map((entry) => [entry.id, entry]))
	for (const track of tracks.values()) {
		const old = byId.get(track.id)
		if (!old || old.source !== track.source || Number(old.threshold) !== track.threshold) continue
		const oldMin = old.min === null || old.min === undefined ? null : Number(old.min)
		const oldMax = old.max === null || old.max === undefined ? null : Number(old.max)
		if (Number.isFinite(oldMin)) track.min = track.min === null ? oldMin : Math.min(track.min, oldMin)
		if (Number.isFinite(oldMax)) track.max = track.max === null ? oldMax : Math.max(track.max, oldMax)
		track.samples = Math.max(track.samples, Number(old.samples || 0))
		track.seenFloor = track.seenFloor || Boolean(old.seenFloor)
		track.seenMovement = track.seenMovement || Boolean(old.seenMovement)
		track.mismatch = track.mismatch || Boolean(old.mismatch)
		track.mismatchCount = Math.max(track.mismatchCount, Number(old.mismatchCount || 0))
		loaded++
	}
	return loaded
}

function seedMeterTracks(probes) {
	const tracks = new Map(
		probes.map((probe) => {
			const track = newMeterTrack(probe)
			return [track.id, track]
		}),
	)
	const candidates = [
		{ path: LATEST_REPORT, kind: 'manual' },
		{ path: PRIOR_METER_REPORT, kind: 'meter' },
	]
	for (const candidate of candidates) {
		try {
			if (!fs.existsSync(candidate.path)) continue
			const prior = JSON.parse(fs.readFileSync(candidate.path, 'utf8'))
			const paths = candidate.kind === 'manual' ? prior?.meters?.paths : prior?.paths
			const loaded = mergeMeterEvidence(tracks, paths)
			if (loaded) return { tracks, loaded, source: candidate.kind }
		} catch {
			// Fall through to the older compatible meter accumulator.
		}
	}
	return { tracks, loaded: 0, source: 'none' }
}

function applyMeterSample(track, marker, rawValue) {
	const value = Number(rawValue)
	if (!marker || !Number.isFinite(value)) return
	track.samples++
	track.min = track.min === null ? value : Math.min(track.min, value)
	track.max = track.max === null ? value : Math.max(track.max, value)
	if (value <= METER_FLOOR_DBFS) track.seenFloor = true
	if (value > METER_FLOOR_DBFS) track.seenMovement = true
	const actual = marker === 'T'
	const expected = value >= track.threshold
	if (actual !== expected) {
		track.mismatchStreak++
		if (track.mismatchStreak >= 3) {
			track.mismatch = true
			track.mismatchCount++
		}
	} else {
		track.mismatchStreak = 0
	}
}

async function sampleMetersOnce(context, tracks) {
	await mapLimit([...tracks.values()], 16, async (track) => {
		const [marker, item] = await Promise.all([
			readMarker(context.baseUrl, context.r9.pageNumber, track.probe),
			readVariableOptional(context.baseUrl, context.label, track.source, 1800),
		])
		applyMeterSample(track, marker, item.exists ? item.value : '')
	})
}

async function observeMeters(context, tracks, stopState) {
	while (!stopState.stop) {
		await sampleMetersOnce(context, tracks)
		if (!stopState.stop) await sleep(350)
	}
}

function meterStatus(track) {
	if (track.mismatch) return 'FAIL_MISMATCH'
	if (track.seenFloor && track.seenMovement) return 'PASS_FLOOR_AND_MOVEMENT'
	if (track.seenFloor) return 'MANUAL_PENDING_FLOOR_ONLY'
	if (track.seenMovement) return 'MANUAL_PENDING_MOVEMENT_ONLY'
	return 'MANUAL_PENDING_NEVER_OBSERVED'
}

function summarizeMeterTracks(tracks) {
	const summary = { total: tracks.size, closed: 0, floorOnly: 0, movementOnly: 0, neverObserved: 0, mismatch: 0 }
	for (const track of tracks.values()) {
		const status = meterStatus(track)
		if (status === 'PASS_FLOOR_AND_MOVEMENT') summary.closed++
		else if (status === 'MANUAL_PENDING_FLOOR_ONLY') summary.floorOnly++
		else if (status === 'MANUAL_PENDING_MOVEMENT_ONLY') summary.movementOnly++
		else if (status === 'FAIL_MISMATCH') summary.mismatch++
		else summary.neverObserved++
	}
	return summary
}

async function prepare() {
	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const payload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(payload) ? payload : payload.connections || []
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	const label = String(r9.connection.label)
	const model = await readVariable(baseUrl, label, 'device_model')
	if (model !== EXPECTED_MODEL) throw new Error(`Expected ${EXPECTED_MODEL}, got ${model || 'unknown'}.`)
	const authorised = canonicalBool(await readVariable(baseUrl, label, 'client_authorised'))
	const connectionStatus = await readVariable(baseUrl, label, 'connection_status')
	if (authorised !== 'true' || !/authorised/i.test(connectionStatus)) {
		throw new Error('Existing Companion Focusrite connection is not currently authorised.')
	}
	if (r9.probes.length !== 829) throw new Error(`Expected 829 feedback probes, got ${r9.probes.length}.`)
	const controls = controlProbes(r9.probes)
	const meters = r9.probes.filter((probe) => METER_DEFINITIONS.has(probe.definitionId))
	if (meters.length !== 46) throw new Error(`Expected 46 meter probes, got ${meters.length}.`)
	return { baseUrl, label, r9, model, controls, meters }
}

function saveReport(context, recording, controlTracks, meterTracks, seeded) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const controlSummary = summarizeControlTracks(controlTracks)
	const meterSummary = summarizeMeterTracks(meterTracks)
	const report = {
		reportVersion: 3,
		reportClass: 'manual-feedback-sweep-local-sanitized',
		updatedAt: nowIso(),
		model: context.model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		readOnlyHarness: true,
		hardwareWritesByHarness: false,
		companionButtonPressesByHarness: false,
		feedbackProbeCount: 829,
		feedbackDefinitionCount: 31,
		controlFeedbackProbeCount: context.controls.length,
		meterFeedbackProbeCount: context.meters.length,
		recording: {
			startedAt: recording.startedAt,
			stoppedAt: recording.stoppedAt || null,
			durationMs: recording.startedAtMs ? Date.now() - recording.startedAtMs : 0,
			oracleSourceCount: recording.oracleSourceCount,
			sourceChanges: recording.sourceChanges,
			feedbackTransitions: recording.feedbackTransitions,
			scanCycles: recording.scanCycles,
			maxScanCycleMs: recording.maxScanCycleMs,
			events: recording.events,
		},
		controls: {
			summary: controlSummary,
			paths: [...controlTracks.values()].map((track) => ({
				id: track.id,
				definitionId: track.definitionId,
				options: track.probe.options,
				seenTrue: track.seenTrue,
				seenFalse: track.seenFalse,
				observations: track.observations,
				transitions: track.transitions,
				mismatch: track.mismatch,
			})),
		},
		meters: {
			priorEvidenceLoaded: seeded.loaded,
			priorEvidenceSource: seeded.source,
			floorDbfs: METER_FLOOR_DBFS,
			summary: meterSummary,
			paths: [...meterTracks.values()].map((track) => ({
				id: track.id,
				definitionId: track.definitionId,
				label: track.label,
				source: track.source,
				threshold: track.threshold,
				min: track.min,
				max: track.max,
				samples: track.samples,
				seenFloor: track.seenFloor,
				seenMovement: track.seenMovement,
				mismatch: track.mismatch,
				mismatchCount: track.mismatchCount,
				status: meterStatus(track),
			})),
		},
		privacy:
			'No serial, hostname, client key, server endpoint, device ID, raw XML, Companion connection ID, raw server value or user path is stored.',
	}
	fs.writeFileSync(LATEST_REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
	return report
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 FREE MANUAL FEEDBACK RECORDER - READ ONLY')
	console.log('==================================================================')
	console.log('AUCUN write Focusrite et AUCUN bouton Companion ne sont declenches par ce harness.')
	console.log('AUCUN nom de controle, CAPTURE ou RESTORED a taper pendant le test.')
	console.log('NE BOUGE RIEN avant que la console affiche clairement >>> REC ON <<<.')
	console.log('Pendant REC ON: bouge librement les controles et laisse chaque nouvel etat environ 1 seconde.')
	console.log('Les 46 meters sont observes en continu en parallele. VB-Audio Matrix peut envoyer du son.')
	console.log('')
	console.log('NE TESTE PAS: Device Preset, Clock Source, Sample Rate, S/PDIF, firmware/reset/restore/snapshot.')
	console.log('Ne tourne pas le bouton Monitor: item 1677 reste read-only.')
	console.log('Routing/Source/Stereo: seulement si tu connais l etat de depart et peux le restaurer exactement.')
	console.log('')

	const context = await prepare()
	line('PASS', 'Preflight', `${context.model}; module ${EXPECTED_MODULE_VERSION}; 829 feedbacks / 31 definitions`)
	const groups = controlOracleGroups(context.controls)
	line('INFO', 'Control observer', `${groups.size} server-confirmed oracle sources watched continuously`)
	const seeded = seedMeterTracks(context.meters)
	line('INFO', 'Meter observer', `46 paths continuous; prior meter evidence loaded=${seeded.loaded}/46 from ${seeded.source}`)

	console.log('Capture des baselines. NE BOUGE RIEN...')
	const [baselineMarkers, baselineSources] = await Promise.all([
		captureMarkers(context.baseUrl, context.r9.pageNumber, context.controls),
		captureControlSources(context, groups),
	])
	const resolvedMarkers = [...baselineMarkers.values()].filter(Boolean).length
	const resolvedSources = [...baselineSources.values()].filter((value) => value !== null && value !== '').length
	line('PASS', 'Baseline feedback', `${resolvedMarkers}/${context.controls.length} markers lisibles`)
	line('PASS', 'Baseline server', `${resolvedSources}/${groups.size} oracle sources materialised`)
	const controlTracks = seedControlTracks(context.controls, baselineMarkers)

	console.log('')
	console.log('==================================================================')
	console.log(' PRET A ENREGISTRER')
	console.log(' Rien de ce que tu as fait AVANT REC ON ne compte pour cette nouvelle capture.')
	console.log('==================================================================')
	await ask('Appuie sur ENTREE pour DEMARRER l enregistrement : ')

	const recording = {
		startedAt: nowIso(),
		startedAtMs: Date.now(),
		stoppedAt: null,
		oracleSourceCount: groups.size,
		sourceChanges: 0,
		feedbackTransitions: 0,
		scanCycles: 0,
		maxScanCycleMs: 0,
		events: [],
	}
	const stopState = { stop: false }
	let observerError = null
	const meterTask = observeMeters(context, seeded.tracks, stopState).catch((error) => {
		observerError = error
		stopState.stop = true
	})
	const controlTask = observeControls(
		context,
		groups,
		baselineSources,
		controlTracks,
		stopState,
		recording,
		seeded.tracks,
		seeded,
	).catch((error) => {
		observerError = error
		stopState.stop = true
	})
	const heartbeatTask = heartbeat(stopState, recording)

	console.log('')
	console.log('##################################################################')
	console.log('########################  >>> REC ON <<<  ########################')
	console.log('## TU PEUX BOUGER LES CONTROLES MAINTENANT.                    ##')
	console.log('## Laisse chaque nouvel etat environ 1 seconde avant de rebouger.##')
	console.log('## Reviens ici seulement quand tu as fini.                       ##')
	console.log('##################################################################')
	console.log('')
	await ask('>>> REC ON - Appuie sur ENTREE seulement quand tu veux ARRETER : ')

	stopState.stop = true
	await Promise.all([meterTask, controlTask, heartbeatTask])
	recording.stoppedAt = nowIso()
	if (observerError) throw observerError
	const report = saveReport(context, recording, controlTracks, seeded.tracks, seeded)
	const controlSummary = report.controls.summary
	const meterSummary = report.meters.summary

	console.log('')
	console.log('##################################################################')
	console.log('########################  >>> REC OFF <<<  #######################')
	console.log('##################################################################')
	console.log(`Server changes captures: ${report.recording.sourceChanges}`)
	console.log(`Feedback transitions verifies: ${report.recording.feedbackTransitions}`)
	console.log(
		`Control feedback: both-states=${controlSummary.bothStates} single-state=${controlSummary.singleState} unresolved=${controlSummary.unresolved} mismatch=${controlSummary.mismatch}`,
	)
	console.log(
		`Meters: closed=${meterSummary.closed}/46 floor-only=${meterSummary.floorOnly} movement-only=${meterSummary.movementOnly} never=${meterSummary.neverObserved} mismatch=${meterSummary.mismatch}`,
	)
	console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
	console.log('Aucun write Focusrite ni bouton Companion n a ete declenche par ce harness.')
	console.log('==================================================================')
	if ((controlSummary.mismatch || meterSummary.mismatch) && !process.exitCode) process.exitCode = 4
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MANUAL FEEDBACK RECORDER FATAL - ${error.message}`)
		console.error('Aucun write Focusrite n a ete effectue par ce harness.')
		process.exitCode = 2
	})
}

module.exports = {
	keyOf,
	labelOf,
	controlProbes,
	changedProbes,
	controlOracleGroups,
	expectedTransitions,
	valueClass,
	newControlTrack,
	applyControlObservation,
	summarizeControlTracks,
	newMeterTrack,
	mergeMeterEvidence,
	applyMeterSample,
	meterStatus,
	summarizeMeterTracks,
}
