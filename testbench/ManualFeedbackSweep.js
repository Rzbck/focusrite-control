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

async function ask(prompt) {
	if (!stdin.isTTY || !stdout.isTTY) return 'DONE'
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
	const rows = await mapLimit(probes, 24, async (probe) => [keyOf(probe), await readMarker(baseUrl, pageNumber, probe)])
	return new Map(rows)
}

function changedProbes(probes, before, after) {
	return probes.filter((probe) => before.get(keyOf(probe)) !== after.get(keyOf(probe)))
}

async function validateProbe(baseUrl, label, pageNumber, probe) {
	const marker = await readMarker(baseUrl, pageNumber, probe)
	const oracle = feedbackOracle(probe)
	if (!marker || oracle.kind === 'unmapped' || !oracle.source) {
		return { status: 'EVAL_ONLY', marker, source: oracle.source || '', state: '' }
	}
	const item = await readVariableOptional(baseUrl, label, oracle.source, 2000)
	if (!item.exists || item.value === '') return { status: 'EVAL_ONLY', marker, source: oracle.source, state: '' }
	const evaluated = evaluateOracle(oracle, item.value)
	if (!evaluated.evaluable) return { status: 'EVAL_ONLY', marker, source: oracle.source, state: String(item.value) }
	return {
		status: (marker === 'T') === evaluated.wanted ? 'PASS' : 'FAIL_MISMATCH',
		marker,
		source: oracle.source,
		state: String(item.value),
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

function seedMeterTracks(probes) {
	const tracks = new Map(
		probes.map((probe) => {
			const track = newMeterTrack(probe)
			return [track.id, track]
		}),
	)
	let loaded = 0
	try {
		if (!fs.existsSync(PRIOR_METER_REPORT)) return { tracks, loaded }
		const prior = JSON.parse(fs.readFileSync(PRIOR_METER_REPORT, 'utf8'))
		if (!Array.isArray(prior.paths)) return { tracks, loaded }
		const byId = new Map(prior.paths.map((entry) => [entry.id, entry]))
		for (const track of tracks.values()) {
			const old = byId.get(track.id)
			if (!old || old.source !== track.source || Number(old.threshold) !== track.threshold) continue
			track.min = old.min === null || old.min === undefined ? null : Number(old.min)
			track.max = old.max === null || old.max === undefined ? null : Number(old.max)
			if (!Number.isFinite(track.min)) track.min = null
			if (!Number.isFinite(track.max)) track.max = null
			track.samples = Number(old.samples || 0)
			track.seenFloor = Boolean(old.seenFloor)
			track.seenMovement = Boolean(old.seenMovement)
			track.mismatch = Boolean(old.mismatch)
			track.mismatchCount = Number(old.mismatchCount || 0)
			loaded++
		}
	} catch {
		return { tracks, loaded: 0 }
	}
	return { tracks, loaded }
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

function saveReport(context, steps, meterTracks, priorMeterEvidenceLoaded) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const meterSummary = summarizeMeterTracks(meterTracks)
	const report = {
		reportVersion: 2,
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
		priorMeterEvidenceLoaded,
		steps,
		meters: {
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
			'No serial, hostname, client key, server endpoint, device ID, raw XML, Companion connection ID or user path is stored.',
	}
	fs.writeFileSync(LATEST_REPORT, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
	return report
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 MANUAL FEEDBACK SWEEP - READ ONLY')
	console.log('==================================================================')
	console.log('AUCUN write Focusrite et AUCUN bouton Companion ne sont declenches par ce harness.')
	console.log('Tu modifies toi-meme UN controle a la fois sur la Scarlett ou dans Focusrite Control.')
	console.log(
		'Les feedbacks de controle sont attribues geste par geste; les 46 meters sont observes en continu a part.',
	)
	console.log('')
	console.log('VB-AUDIO MATRIX: tu peux envoyer du son partout pendant la session.')
	console.log(
		'Pour maximiser la preuve meter, laisse aussi quelques secondes de silence complet a un moment, sans changer le routing Focusrite.',
	)
	console.log('')
	console.log('NE TESTE PAS: Device Preset, Clock Source, Sample Rate, S/PDIF, firmware/reset/restore/snapshot.')
	console.log('Ne tourne pas le bouton Monitor: item 1677 reste read-only.')
	console.log('Routing/Source/Stereo: seulement si tu connais l etat de depart et peux le restaurer exactement.')
	console.log('')

	const context = await prepare()
	line('PASS', 'Preflight', `${context.model}; module ${EXPECTED_MODULE_VERSION}; 829 feedbacks / 31 definitions`)
	const seeded = seedMeterTracks(context.meters)
	line('INFO', 'Meter observer', `46 paths continuous; prior meter evidence loaded=${seeded.loaded}/46`)
	console.log('Capture de la baseline des feedbacks hors meters...')
	const baseline = await captureMarkers(context.baseUrl, context.r9.pageNumber, context.controls)
	const resolved = [...baseline.values()].filter(Boolean).length
	line(
		'PASS',
		'Baseline control feedback',
		`${resolved}/${context.controls.length} markers lisibles; meters exclus de l attribution`,
	)

	const stopState = { stop: false }
	let meterError = null
	const meterTask = observeMeters(context, seeded.tracks, stopState).catch((error) => {
		meterError = error
		stopState.stop = true
	})
	const steps = []

	try {
		while (true) {
			console.log('')
			const userLabel = await ask('Controle a tester (ex: AIR 1, MONITOR MUTE), ou DONE : ')
			if (!userLabel || userLabel.toUpperCase() === 'DONE') break
			const ready = (
				await ask(`Change UNIQUEMENT ${userLabel}, garde le nouvel etat, puis tape CAPTURE : `)
			).toUpperCase()
			if (ready !== 'CAPTURE') continue

			const changedState = await captureMarkers(context.baseUrl, context.r9.pageNumber, context.controls)
			const changed = changedProbes(context.controls, baseline, changedState)
			const results = await mapLimit(changed, 12, async (probe) => ({
				probe,
				result: await validateProbe(context.baseUrl, context.label, context.r9.pageNumber, probe),
			}))

			console.log(`RESULTAT ${userLabel}`)
			if (!results.length) console.log('  INFO          Aucun feedback public hors meter n a change.')
			for (const entry of results) {
				const from = baseline.get(keyOf(entry.probe)) || '?'
				const to = changedState.get(keyOf(entry.probe)) || '?'
				const oracle = entry.result.source ? ` / ${entry.result.source}=${entry.result.state || '?'}` : ''
				console.log(`  ${entry.result.status.padEnd(13)} ${labelOf(entry.probe)} :: ${from} -> ${to}${oracle}`)
			}

			let restored = false
			while (!restored) {
				const answer = (
					await ask(`Remets ${userLabel} comme avant, attends le feedback, puis tape RESTORED : `)
				).toUpperCase()
				if (answer !== 'RESTORED') break
				const restoredState = await captureMarkers(context.baseUrl, context.r9.pageNumber, context.controls)
				const pending = changed.filter((probe) => restoredState.get(keyOf(probe)) !== baseline.get(keyOf(probe)))
				if (!pending.length) restored = true
				else {
					console.log(`RESTORE NON CONFIRME pour ${pending.length} feedback(s). Ne change rien d autre.`)
					for (const probe of pending.slice(0, 10)) console.log(`  - ${labelOf(probe)}`)
				}
			}

			steps.push({
				label: userLabel,
				changedFeedbacks: results.map((entry) => ({
					definitionId: entry.probe.definitionId,
					options: entry.probe.options,
					before: baseline.get(keyOf(entry.probe)) || null,
					after: changedState.get(keyOf(entry.probe)) || null,
					status: entry.result.status,
					source: entry.result.source,
					state: entry.result.state,
				})),
				feedbackRestoreConfirmed: restored,
			})
			saveReport(context, steps, seeded.tracks, seeded.loaded)
			if (!restored) {
				console.log('STOP - retour a la baseline non confirme. Ne teste pas un autre controle.')
				process.exitCode = 3
				break
			}
			console.log(`PASS RESTORE ${userLabel}`)
		}
	} finally {
		stopState.stop = true
		await meterTask
	}

	if (meterError) throw meterError
	const report = saveReport(context, steps, seeded.tracks, seeded.loaded)
	const transitions = report.steps.reduce((sum, step) => sum + step.changedFeedbacks.length, 0)
	const mismatches = report.steps.reduce(
		(sum, step) => sum + step.changedFeedbacks.filter((feedback) => feedback.status === 'FAIL_MISMATCH').length,
		0,
	)
	const totalMismatch = mismatches + report.meters.summary.mismatch
	console.log('')
	console.log('==================================================================')
	console.log(`Etapes manuelles: ${report.steps.length}`)
	console.log(`Transitions de feedback hors meters: ${transitions}`)
	console.log(`Mismatch feedback/oracle hors meters: ${mismatches}`)
	console.log(
		`Meters: closed=${report.meters.summary.closed}/46 floor-only=${report.meters.summary.floorOnly} movement-only=${report.meters.summary.movementOnly} never=${report.meters.summary.neverObserved} mismatch=${report.meters.summary.mismatch}`,
	)
	console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
	console.log('Aucun write Focusrite ni bouton Companion n a ete declenche par ce harness.')
	console.log('==================================================================')
	if (totalMismatch && !process.exitCode) process.exitCode = 4
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MANUAL FEEDBACK SWEEP FATAL - ${error.message}`)
		console.error('Aucun write Focusrite n a ete effectue par ce harness.')
		process.exitCode = 2
	})
}

module.exports = {
	keyOf,
	labelOf,
	controlProbes,
	changedProbes,
	newMeterTrack,
	applyMeterSample,
	meterStatus,
	summarizeMeterTracks,
}
