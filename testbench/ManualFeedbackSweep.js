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
const {
	buildDiagnosticTargets,
	seedDiagnosticTracks,
	observeDiagnostics,
	summarizeDiagnosticTracks,
	diagnosticPaths,
} = require('./ManualFeedbackSweepDiagnostics')

const LATEST_REPORT = path.join(resultsDir, 'LATEST_MANUAL_FEEDBACK_SWEEP.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_MANUAL_FEEDBACK_SWEEP.json'
const PRIOR_METER_REPORT = path.join(resultsDir, 'LATEST_METER_FEEDBACK_CLOSURE.json')
const METER_FLOOR_DBFS = -128
const CONTROL_SCAN_MIN_INTERVAL_MS = 150
const FEEDBACK_ORACLE_SETTLE_TIMEOUT_MS = 1200

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

function recorderTargetProbes(probes) {
	return probes.filter((probe) => {
		const oracle = feedbackOracle(probe)
		return oracle.kind !== 'unmapped' && Boolean(oracle.source)
	})
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
	const rows = await mapLimit(probes, 48, async (probe) => [keyOf(probe), await readMarker(baseUrl, pageNumber, probe)])
	return new Map(rows)
}

function changedProbes(probes, before, after) {
	return probes.filter((probe) => before.get(keyOf(probe)) !== after.get(keyOf(probe)))
}

function oracleValueClass(oracle, raw) {
	if (raw === null || raw === undefined || raw === '') return 'UNKNOWN'
	if (oracle.kind === 'connected') return String(raw).startsWith('Connected') ? 'CONNECTED' : 'NOT_CONNECTED'
	if (oracle.kind === 'bool' || oracle.kind === 'optionalBool') {
		const value = canonicalBool(raw)
		if (value === 'true') return 'TRUE'
		if (value === 'false') return 'FALSE'
		return 'KNOWN_VALUE'
	}
	if (oracle.kind === 'equals') {
		return String(raw) === String(oracle.value) ? 'MATCH' : 'OTHER'
	}
	return 'KNOWN_VALUE'
}

async function validateChangedMarker(context, probe, beforeMarker, afterMarker, startedAtMs) {
	const oracle = feedbackOracle(probe)
	let lastClass = 'UNKNOWN'
	let status = 'EVAL_ONLY'
	const deadline = Date.now() + FEEDBACK_ORACLE_SETTLE_TIMEOUT_MS

	while (Date.now() < deadline) {
		const item = await readVariableOptional(context.baseUrl, context.label, oracle.source, 1600)
		if (!item.exists || item.value === '') {
			await sleep(75)
			continue
		}
		lastClass = oracleValueClass(oracle, item.value)
		const evaluated = evaluateOracle(oracle, item.value)
		if (!evaluated.evaluable) {
			await sleep(75)
			continue
		}
		status = (afterMarker === 'T') === evaluated.wanted ? 'PASS' : 'FAIL_MISMATCH'
		if (status === 'PASS') break
		await sleep(75)
	}

	const elapsedMs = Date.now() - startedAtMs
	console.log(
		`REC +${(elapsedMs / 1000).toFixed(1).padStart(6)}s  ${labelOf(probe)}  ${beforeMarker || '?'} -> ${afterMarker || '?'}  ${status}`,
	)
	return {
		atMs: elapsedMs,
		definitionId: probe.definitionId,
		options: probe.options,
		before: beforeMarker || null,
		after: afterMarker || null,
		oracleSource: oracle.source,
		oracleClass: lastClass,
		status,
	}
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

async function observeControls(context, probes, baselineMarkers, controlTracks, stopState, recording, onChange) {
	const current = new Map(baselineMarkers)
	while (!stopState.stop) {
		const cycleStart = Date.now()
		const next = await captureMarkers(context.baseUrl, context.r9.pageNumber, probes)
		const changed = changedProbes(probes, current, next)
		const events = await mapLimit(changed, 16, async (probe) => {
			const key = keyOf(probe)
			const beforeMarker = current.get(key) || null
			const afterMarker = next.get(key) || null
			current.set(key, afterMarker)
			const event = await validateChangedMarker(context, probe, beforeMarker, afterMarker, recording.startedAtMs)
			const track = controlTracks.get(`${probe.definitionId}:${key}`)
			if (track) applyControlObservation(track, afterMarker, event.status)
			return event
		})
		if (events.length) {
			recording.events.push(...events)
			recording.feedbackTransitions += events.length
			if (onChange) onChange()
		}
		const cycleMs = Date.now() - cycleStart
		recording.scanCycles++
		recording.totalScanCycleMs += cycleMs
		recording.maxScanCycleMs = Math.max(recording.maxScanCycleMs, cycleMs)
		const remaining = CONTROL_SCAN_MIN_INTERVAL_MS - cycleMs
		if (!stopState.stop && remaining > 0) await sleep(remaining)
	}
}

async function heartbeat(stopState, recording) {
	while (!stopState.stop) {
		await sleep(5000)
		if (stopState.stop) break
		const elapsed = Math.round((Date.now() - recording.startedAtMs) / 1000)
		const average = recording.scanCycles ? Math.round(recording.totalScanCycleMs / recording.scanCycles) : 0
		console.log(
			`>>> REC ON | ${elapsed}s | feedback=${recording.feedbackTransitions} | diagnostics=${recording.diagnosticEvents.length} | scan avg=${average}ms max=${recording.maxScanCycleMs}ms`,
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
	const recorderControls = recorderTargetProbes(controls)
	const meters = r9.probes.filter((probe) => METER_DEFINITIONS.has(probe.definitionId))
	if (controls.length !== 783) throw new Error(`Expected 783 non-meter feedback probes, got ${controls.length}.`)
	if (recorderControls.length !== 783) {
		throw new Error(
			`Expected all 783 non-meter feedback probes to have oracle mappings, got ${recorderControls.length}.`,
		)
	}
	if (meters.length !== 46) throw new Error(`Expected 46 meter probes, got ${meters.length}.`)
	return { baseUrl, label, r9, model, controls, recorderControls, meters }
}

function saveReport(context, recording, controlTracks, meterTracks, seeded, diagnostics) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const controlSummary = summarizeControlTracks(controlTracks)
	const meterSummary = summarizeMeterTracks(meterTracks)
	const averageScanCycleMs = recording.scanCycles ? Math.round(recording.totalScanCycleMs / recording.scanCycles) : 0
	const diagnosticSummary = summarizeDiagnosticTracks(diagnostics.tracks)
	const diagnosticAverageScanCycleMs = recording.diagnosticScanCycles
		? Math.round(recording.diagnosticTotalScanCycleMs / recording.diagnosticScanCycles)
		: 0
	const report = {
		reportVersion: 6,
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
		recorderTargetProbeCount: context.recorderControls.length,
		meterFeedbackProbeCount: context.meters.length,
		recording: {
			startedAt: recording.startedAt,
			stoppedAt: recording.stoppedAt || null,
			durationMs: recording.startedAtMs ? Date.now() - recording.startedAtMs : 0,
			feedbackTransitions: recording.feedbackTransitions,
			scanCycles: recording.scanCycles,
			averageScanCycleMs,
			maxScanCycleMs: recording.maxScanCycleMs,
			events: recording.events,
		},
		controls: {
			targetDefinitions: [...new Set(context.recorderControls.map((probe) => probe.definitionId))],
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
		diagnostics: {
			candidateCount: diagnostics.candidateCount,
			exposedCount: diagnostics.exposedCount,
			scanCycles: recording.diagnosticScanCycles,
			averageScanCycleMs: diagnosticAverageScanCycleMs,
			maxScanCycleMs: recording.diagnosticMaxScanCycleMs,
			summary: diagnosticSummary,
			events: recording.diagnosticEvents,
			paths: diagnosticPaths(diagnostics.tracks),
		},
		privacy:
			'Semantic names and opaque equality classes only; no serial, hostname, client key, endpoint, device/client IDs, raw XML, raw source/control values, nicknames or user path is stored.',
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
	console.log('')
	console.log('COUVERTURE REC:')
	console.log('  - les 783 feedbacks publics hors meters sont scannes en continu;')
	console.log('  - chaque feedback qui change est compare a son oracle serveur;')
	console.log('  - les 46 meters restent observes en parallele;')
	console.log('  - les variables semantiques safe restantes sont observees en parallele;')
	console.log('  - l evidence meter precedente est reprise automatiquement.')
	console.log('')
	console.log('SECURITE AVANT REC ON: coupe/isole enceintes, casque et sorties sensibles avant d explorer librement.')
	console.log('Tes clics dans Focusrite Control changent le hardware; seul le harness reste 100% read-only.')
	console.log('')
	console.log('Pendant REC ON: explore librement les controles RESTANTS ET SURS dans Focusrite Control.')
	console.log('Laisse chaque nouvel etat environ 2 secondes avant de rebouger pour maximiser la capture.')
	console.log('Quelques secondes de silence peuvent aussi fermer les six Mix meters encore en attente du floor.')
	console.log('')
	console.log('NE CLIQUE PAS uniquement pour ce test:')
	console.log('  - Device Preset, Clock Source, Sample Rate ou S/PDIF mode;')
	console.log('  - firmware, reset, restore ou snapshot;')
	console.log('  - Monitor gain 1677;')
	console.log('  - une sortie que Focusrite Control/Companion indique indisponible.')
	console.log('Les nicknames ne sont volontairement pas enregistres.')
	console.log('')

	const context = await prepare()
	line('PASS', 'Preflight', `${context.model}; module ${EXPECTED_MODULE_VERSION}; 829 feedbacks / 31 definitions`)
	line('INFO', 'Control observer', `${context.recorderControls.length} non-meter feedback probes`)
	const seeded = seedMeterTracks(context.meters)
	line(
		'INFO',
		'Meter observer',
		`46 paths continuous; prior meter evidence loaded=${seeded.loaded}/46 from ${seeded.source}`,
	)
	const diagnosticTargets = buildDiagnosticTargets(context.r9.probes)
	const diagnostics = await seedDiagnosticTracks(context, diagnosticTargets)
	line('INFO', 'Semantic observer', `${diagnostics.exposedCount}/${diagnostics.candidateCount} safe variables exposed`)

	console.log('Capture des baselines. NE BOUGE RIEN...')
	const baselineMarkers = await captureMarkers(context.baseUrl, context.r9.pageNumber, context.recorderControls)
	const resolvedMarkers = [...baselineMarkers.values()].filter(Boolean).length
	line('PASS', 'Baseline feedback', `${resolvedMarkers}/${context.recorderControls.length} non-meter markers lisibles`)
	const controlTracks = seedControlTracks(context.recorderControls, baselineMarkers)

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
		feedbackTransitions: 0,
		scanCycles: 0,
		totalScanCycleMs: 0,
		maxScanCycleMs: 0,
		events: [],
		diagnosticEvents: [],
		diagnosticScanCycles: 0,
		diagnosticTotalScanCycleMs: 0,
		diagnosticMaxScanCycleMs: 0,
	}
	const stopState = { stop: false }
	let observerError = null
	const saveLiveReport = () => saveReport(context, recording, controlTracks, seeded.tracks, seeded, diagnostics)
	const meterTask = observeMeters(context, seeded.tracks, stopState).catch((error) => {
		observerError = error
		stopState.stop = true
	})
	const controlTask = observeControls(
		context,
		context.recorderControls,
		baselineMarkers,
		controlTracks,
		stopState,
		recording,
		saveLiveReport,
	).catch((error) => {
		observerError = error
		stopState.stop = true
	})
	const diagnosticTask = observeDiagnostics(context, diagnostics.tracks, stopState, recording, saveLiveReport).catch(
		(error) => {
			observerError = error
			stopState.stop = true
		},
	)
	const heartbeatTask = heartbeat(stopState, recording)

	console.log('')
	console.log('##################################################################')
	console.log('########################  >>> REC ON <<<  ########################')
	console.log('## EXPLORE LIBREMENT LES CONTROLES RESTANTS ET SURS.            ##')
	console.log('## Laisse chaque nouvel etat environ 2 secondes avant de rebouger.##')
	console.log('## Reviens ici seulement quand tu as fini.                       ##')
	console.log('##################################################################')
	console.log('')
	await ask('>>> REC ON - Appuie sur ENTREE seulement quand tu veux ARRETER : ')

	stopState.stop = true
	await Promise.all([meterTask, controlTask, diagnosticTask, heartbeatTask])
	recording.stoppedAt = nowIso()
	if (observerError) throw observerError
	const report = saveReport(context, recording, controlTracks, seeded.tracks, seeded, diagnostics)
	const controlSummary = report.controls.summary
	const meterSummary = report.meters.summary
	const diagnosticSummary = report.diagnostics.summary

	console.log('')
	console.log('##################################################################')
	console.log('########################  >>> REC OFF <<<  #######################')
	console.log('##################################################################')
	console.log(`Feedback transitions captures: ${report.recording.feedbackTransitions}`)
	console.log(
		`Scans: cycles=${report.recording.scanCycles} avg=${report.recording.averageScanCycleMs}ms max=${report.recording.maxScanCycleMs}ms`,
	)
	console.log(
		`Non-meter feedbacks: both-states=${controlSummary.bothStates}/${controlSummary.total} single-state=${controlSummary.singleState} unresolved=${controlSummary.unresolved} mismatch=${controlSummary.mismatch}`,
	)
	console.log(
		`Meters: closed=${meterSummary.closed}/46 floor-only=${meterSummary.floorOnly} movement-only=${meterSummary.movementOnly} never=${meterSummary.neverObserved} mismatch=${meterSummary.mismatch}`,
	)
	console.log(
		`Semantic diagnostics: changed=${diagnosticSummary.changed}/${diagnosticSummary.total} transitions=${diagnosticSummary.transitions}`,
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
	recorderTargetProbes,
	changedProbes,
	oracleValueClass,
	newControlTrack,
	applyControlObservation,
	summarizeControlTracks,
	newMeterTrack,
	mergeMeterEvidence,
	applyMeterSample,
	meterStatus,
	summarizeMeterTracks,
}
