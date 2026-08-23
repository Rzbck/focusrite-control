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
	hashObject,
	canonicalBool,
	findCompanion,
	get,
	readVariable,
	readVariableOptional,
	mapLimit,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')
const { METER_DEFINITIONS, feedbackOracle } = require('./FullTestBenchFeedbackV6')

const REPORT_VERSION = 2
const METER_FLOOR_DBFS = -128
const METER_EVIDENCE_MODE = 'floor-and-movement-v2'
const LATEST_REPORT = path.join(resultsDir, 'LATEST_METER_FEEDBACK_CLOSURE.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_METER_FEEDBACK_CLOSURE.json'

function meterPathLabel(probe) {
	const options = probe.options || {}
	if (probe.definitionId === 'input_meter') return `Input ${Number(options.input) + 1}`
	if (probe.definitionId === 'output_meter') return `Output ${Number(options.output) + 1}`
	if (probe.definitionId === 'mix_meter') {
		const mix = String(options.mix || '?')
		const side = String(options.side || '?')
		return `Mix ${mix} ${side}`
	}
	return `${probe.definitionId} ${probe.row}/${probe.column}`
}

function buildMeterDescriptors(r9) {
	return r9.probes
		.filter((probe) => METER_DEFINITIONS.has(probe.definitionId))
		.map((probe) => {
			const oracle = feedbackOracle(probe)
			return {
				id: `${probe.definitionId}:${probe.row}/${probe.column}`,
				definitionId: probe.definitionId,
				row: probe.row,
				column: probe.column,
				label: meterPathLabel(probe),
				source: oracle.source,
				threshold: Number(oracle.threshold),
			}
		})
}

function newTrack(descriptor) {
	return {
		...descriptor,
		min: null,
		max: null,
		samples: 0,
		seenFloor: false,
		seenMovement: false,
		seenBelow: false,
		seenAtOrAbove: false,
		seenFeedbackFalse: false,
		seenFeedbackTrue: false,
		mismatch: false,
		mismatchCount: 0,
		missingMarker: 0,
		missingValue: 0,
	}
}

function restoreTrack(descriptor, prior) {
	const track = newTrack(descriptor)
	if (!prior || prior.source !== descriptor.source || Number(prior.threshold) !== Number(descriptor.threshold))
		return track
	for (const key of [
		'min',
		'max',
		'samples',
		'seenFloor',
		'seenMovement',
		'seenBelow',
		'seenAtOrAbove',
		'seenFeedbackFalse',
		'seenFeedbackTrue',
		'mismatch',
		'mismatchCount',
		'missingMarker',
		'missingValue',
	]) {
		if (prior[key] !== undefined) track[key] = prior[key]
	}
	return track
}

function sampleAgrees(track, sample) {
	if (!sample.marker || !Number.isFinite(sample.value)) return null
	const actual = sample.marker === 'T'
	const expected = sample.value >= track.threshold
	return actual === expected
}

function applySample(track, sample) {
	if (!sample.marker) track.missingMarker++
	if (!Number.isFinite(sample.value)) track.missingValue++
	if (!sample.marker || !Number.isFinite(sample.value)) return track

	track.samples++
	track.min = track.min === null ? sample.value : Math.min(track.min, sample.value)
	track.max = track.max === null ? sample.value : Math.max(track.max, sample.value)
	if (sample.value <= METER_FLOOR_DBFS) track.seenFloor = true
	if (sample.value > METER_FLOOR_DBFS) track.seenMovement = true

	const expected = sample.value >= track.threshold
	const actual = sample.marker === 'T'
	if (expected) track.seenAtOrAbove = true
	else track.seenBelow = true
	if (actual) track.seenFeedbackTrue = true
	else track.seenFeedbackFalse = true
	if (actual !== expected) {
		track.mismatch = true
		track.mismatchCount++
	}
	return track
}

function classifyTrack(track) {
	if (track.mismatch) return 'FAIL_MISMATCH'
	if (track.seenFloor && track.seenMovement) return 'PASS_FLOOR_AND_MOVEMENT'
	if (track.seenFloor) return 'MANUAL_PENDING_FLOOR_ONLY'
	if (track.seenMovement) return 'MANUAL_PENDING_MOVEMENT_ONLY'
	return 'MANUAL_PENDING_NEVER_OBSERVED'
}

function summarizeTracks(tracks) {
	const summary = {
		total: tracks.size,
		closed: 0,
		floorOnly: 0,
		movementOnly: 0,
		neverObserved: 0,
		mismatch: 0,
	}
	const definitions = {}
	for (const track of tracks.values()) {
		if (!definitions[track.definitionId]) {
			definitions[track.definitionId] = {
				total: 0,
				closed: 0,
				floorOnly: 0,
				movementOnly: 0,
				neverObserved: 0,
				mismatch: 0,
			}
		}
		const target = definitions[track.definitionId]
		target.total++
		const status = classifyTrack(track)
		if (status === 'FAIL_MISMATCH') {
			summary.mismatch++
			target.mismatch++
		} else if (status === 'PASS_FLOOR_AND_MOVEMENT') {
			summary.closed++
			target.closed++
		} else if (status === 'MANUAL_PENDING_FLOOR_ONLY') {
			summary.floorOnly++
			target.floorOnly++
		} else if (status === 'MANUAL_PENDING_MOVEMENT_ONLY') {
			summary.movementOnly++
			target.movementOnly++
		} else {
			summary.neverObserved++
			target.neverObserved++
		}
	}
	return { ...summary, definitions, complete: summary.closed === summary.total && summary.mismatch === 0 }
}

async function readFeedbackMarkerNoPress(baseUrl, pageNumber, descriptor) {
	const variable = `b_text_${pageNumber}_${descriptor.row}_${descriptor.column}`
	const item = await readVariableOptional(baseUrl, 'internal', variable, 1800)
	if (!item.exists) return null
	const lines = String(item.value).split(/\r?\n/)
	const marker = String(lines.at(-1) || '').trim()
	return ['T', 'F'].includes(marker) ? marker : null
}

async function sampleDescriptor(baseUrl, label, pageNumber, descriptor) {
	const [marker, item] = await Promise.all([
		readFeedbackMarkerNoPress(baseUrl, pageNumber, descriptor),
		readVariableOptional(baseUrl, label, descriptor.source, 1800),
	])
	const value = item.exists && item.value !== '' ? Number(item.value) : Number.NaN
	return { marker, value }
}

async function observeTrack(baseUrl, label, pageNumber, track) {
	let persistentMismatch = null
	let validMismatchSamples = 0
	for (const delay of [0, 180, 420]) {
		if (delay) await sleep(delay)
		const sample = await sampleDescriptor(baseUrl, label, pageNumber, track)
		const agrees = sampleAgrees(track, sample)
		if (agrees === null) {
			applySample(track, sample)
			continue
		}
		if (agrees) {
			applySample(track, sample)
			return true
		}
		persistentMismatch = sample
		validMismatchSamples++
	}
	if (persistentMismatch && validMismatchSamples === 3) {
		applySample(track, persistentMismatch)
		return true
	}
	return false
}

async function captureRounds({ baseUrl, label, pageNumber, tracks, rounds = 4 }) {
	const list = [...tracks.values()]
	for (let round = 0; round < rounds; round++) {
		await mapLimit(list, 16, async (track) => observeTrack(baseUrl, label, pageNumber, track))
		if (round + 1 < rounds) await sleep(250)
	}
}

function reportPayload({ model, moduleVersion, signature, tracks }) {
	const summary = summarizeTracks(tracks)
	return {
		reportVersion: REPORT_VERSION,
		reportClass: 'meter-feedback-closure-local-sanitized',
		evidenceMode: METER_EVIDENCE_MODE,
		meterFloorDbfs: METER_FLOOR_DBFS,
		updatedAt: nowIso(),
		model,
		moduleVersion,
		signature,
		readOnly: true,
		hardwareWrites: false,
		companionButtonPresses: false,
		routingChangesByHarness: false,
		summary,
		paths: [...tracks.values()].map((track) => ({
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
			seenBelow: track.seenBelow,
			seenAtOrAbove: track.seenAtOrAbove,
			seenFeedbackFalse: track.seenFeedbackFalse,
			seenFeedbackTrue: track.seenFeedbackTrue,
			mismatch: track.mismatch,
			mismatchCount: track.mismatchCount,
			missingMarker: track.missingMarker,
			missingValue: track.missingValue,
			status: classifyTrack(track),
		})),
	}
}

function writeReport(context) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = reportPayload(context)
	fs.writeFileSync(LATEST_REPORT, `${JSON.stringify(payload, null, 2)}\n`)
	return payload
}

function loadPrior(signature, descriptors) {
	if (!fs.existsSync(LATEST_REPORT))
		return new Map(descriptors.map((descriptor) => [descriptor.id, newTrack(descriptor)]))
	try {
		const prior = JSON.parse(fs.readFileSync(LATEST_REPORT, 'utf8'))
		if (
			prior.reportVersion !== REPORT_VERSION ||
			prior.evidenceMode !== METER_EVIDENCE_MODE ||
			prior.signature !== signature ||
			!Array.isArray(prior.paths)
		) {
			return new Map(descriptors.map((descriptor) => [descriptor.id, newTrack(descriptor)]))
		}
		const byId = new Map(prior.paths.map((entry) => [entry.id, entry]))
		line('INFO', 'Previous meter evidence', 'matching local accumulator loaded; evidence will be merged')
		return new Map(descriptors.map((descriptor) => [descriptor.id, restoreTrack(descriptor, byId.get(descriptor.id))]))
	} catch {
		return new Map(descriptors.map((descriptor) => [descriptor.id, newTrack(descriptor)]))
	}
}

function printSummary(summary) {
	line(
		summary.mismatch ? 'FAIL' : summary.complete ? 'PASS' : 'INFO',
		'Meter evidence',
		`closed=${summary.closed}/${summary.total} floor-only=${summary.floorOnly} movement-only=${summary.movementOnly} never=${summary.neverObserved} mismatch=${summary.mismatch}`,
	)
	for (const [definition, counts] of Object.entries(summary.definitions)) {
		line(
			'INFO',
			definition,
			`closed=${counts.closed}/${counts.total} floor-only=${counts.floorOnly} movement-only=${counts.movementOnly} never=${counts.neverObserved} mismatch=${counts.mismatch}`,
		)
	}
}

function printPending(tracks, limit = 46) {
	const pending = [...tracks.values()].filter((track) => classifyTrack(track) !== 'PASS_FLOOR_AND_MOVEMENT')
	if (!pending.length) return
	console.log('')
	console.log('CHEMINS ENCORE NON CLOS :')
	for (const track of pending.slice(0, limit)) {
		console.log(
			`  - ${track.label.padEnd(18)} ${classifyTrack(track)} floor=${METER_FLOOR_DBFS} threshold=${track.threshold} min=${track.min ?? '?'} max=${track.max ?? '?'}`,
		)
	}
}

async function ask(prompt) {
	if (!stdin.isTTY || !stdout.isTTY) return 'DONE'
	const rl = readline.createInterface({ input: stdin, output: stdout })
	try {
		return String(await rl.question(prompt))
			.trim()
			.toUpperCase()
	} finally {
		rl.close()
	}
}

async function prepareReadOnlyContext() {
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
		throw new Error('Existing Companion module connection is not currently authorised.')
	}
	const descriptors = buildMeterDescriptors(r9)
	if (descriptors.length !== 46) throw new Error(`Expected exactly 46 meter probes, got ${descriptors.length}.`)
	for (const descriptor of descriptors) {
		if (!descriptor.source || !Number.isFinite(descriptor.threshold)) {
			throw new Error(`Meter oracle is incomplete for ${descriptor.id}.`)
		}
	}
	const signature = hashObject({
		model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		evidenceMode: METER_EVIDENCE_MODE,
		descriptors,
	})
	return { baseUrl, label, r9, model, moduleVersion: EXPECTED_MODULE_VERSION, descriptors, signature }
}

async function main() {
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 METER FEEDBACK CLOSURE - READ ONLY')
	console.log('==================================================================')
	console.log('AUCUN write Focusrite. AUCUN bouton Companion presse. AUCUN routing change par ce harness.')
	console.log('Le feedback rendu reste compare a son oracle production: meter >= threshold.')
	console.log(`La fermeture hardware utilise le plancher ${METER_FLOOR_DBFS} dBFS + un mouvement reel au-dessus du plancher.`)
	console.log('Un threshold r9 egal au plancher peut rester T au silence; cela ne sera plus confondu avec du signal.')
	console.log('Les chemins impossibles a exercer resteront MANUAL_PENDING au lieu de recevoir un faux PASS.')
	console.log('')

	const context = await prepareReadOnlyContext()
	line(
		'PASS',
		'Read-only preflight',
		`${context.model}; module ${context.moduleVersion}; authorised existing connection`,
	)
	line(
		'PASS',
		'Meter inventory',
		`${context.descriptors.length} paths / input+output+mix / rendered feedback oracle + numeric floor/movement evidence`,
	)
	const tracks = loadPrior(context.signature, context.descriptors)
	let payload = writeReport({ ...context, tracks })
	printSummary(payload.summary)

	console.log('')
	console.log('PHASE SILENCE / PLANCHER')
	console.log('Coupe ou arrete les signaux que tu peux couper sans changer le routing Focusrite.')
	console.log(`Le but est d observer ${METER_FLOOR_DBFS} dBFS sur autant de chemins que possible.`)
	const silent = await ask('Tape SILENT puis Entree pour capturer, ou SKIP : ')
	if (silent === 'SILENT') {
		await captureRounds({
			baseUrl: context.baseUrl,
			label: context.label,
			pageNumber: context.r9.pageNumber,
			tracks,
			rounds: 4,
		})
		payload = writeReport({ ...context, tracks })
		printSummary(payload.summary)
		printPending(tracks)
	}

	while (true) {
		console.log('')
		console.log('PHASE SIGNAL / MOUVEMENT REEL')
		console.log(
			'Cree du signal uniquement sur des chemins que tu peux exercer sans modifier automatiquement le routing Focusrite.',
		)
		console.log('Un chemin progresse des qu une valeur numerique strictement superieure au plancher est observee.')
		const answer = await ask('Tape SIGNAL pour capturer une passe, DONE si tu ne peux plus progresser, ou SKIP : ')
		if (answer !== 'SIGNAL') break
		await captureRounds({
			baseUrl: context.baseUrl,
			label: context.label,
			pageNumber: context.r9.pageNumber,
			tracks,
			rounds: 5,
		})
		payload = writeReport({ ...context, tracks })
		printSummary(payload.summary)
		printPending(tracks)
		if (payload.summary.complete || payload.summary.mismatch) break
	}

	payload = writeReport({ ...context, tracks })
	console.log('')
	console.log('==================================================================')
	printSummary(payload.summary)
	printPending(tracks)
	console.log(`Rapport local sanitise: ${RELATIVE_REPORT}`)
	if (payload.summary.mismatch) {
		console.log('METER CLOSURE FAIL - au moins un feedback ne correspond pas a son oracle numerique.')
		process.exitCode = 4
	} else if (payload.summary.complete) {
		console.log('METER CLOSURE COMPLETE - les 46 chemins ont montre plancher + mouvement avec oracle feedback coherent.')
	} else {
		console.log('METER CLOSURE PARTIAL - aucun mismatch, mais certains chemins restent MANUAL_PENDING.')
	}
	console.log('Aucun write hardware n a ete effectue.')
	console.log('==================================================================')
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`METER CLOSURE FATAL - ${error.message}`)
		console.error('Aucun write hardware n a ete effectue.')
		process.exitCode = 2
	})
}

module.exports = {
	REPORT_VERSION,
	METER_FLOOR_DBFS,
	METER_EVIDENCE_MODE,
	meterPathLabel,
	buildMeterDescriptors,
	newTrack,
	restoreTrack,
	sampleAgrees,
	applySample,
	classifyTrack,
	summarizeTracks,
	reportPayload,
}