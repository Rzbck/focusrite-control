'use strict'

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')
const {
	EXPECTED_MODULE_VERSION,
	resultsDir,
	nowIso,
	line,
	sleep,
	hashObject,
	canonicalBool,
	readVariableOptional,
	mapLimit,
} = require('./FullTestBenchBase')
const { Reporter, verifyMany, exactCheck, batchChecksForLane } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { pressBatch } = require('./FullTestBenchV4Common')
const { laneBase } = require('./FullTestBenchAudit')
const { pairBatchIds, pairedTestMapping } = require('./FullTestBenchPairsV4')
const {
	REPORT_VERSION,
	METER_FLOOR_DBFS,
	METER_EVIDENCE_MODE,
	buildMeterDescriptors,
	newTrack,
	restoreTrack,
	sampleAgrees,
	applySample,
	classifyTrack,
	summarizeTracks,
	reportPayload,
} = require('./MeterFeedbackClosure')
const {
	METER_DRIVE_GAIN_DB,
	laneId,
	augmentMeterRoutingHarness,
	writeMeterRoutingPages,
} = require('./MeterRoutingPage')
const { replacePage2FromFile } = require('./MeterRoutingPageImport')

const ALLOW_ROUTING_FLAG = '--allow-routing-writes'
const ISOLATION_FLAG = '--confirm-all-output-routing-isolated'
const LATEST_METER_REPORT = path.join(resultsDir, 'LATEST_METER_FEEDBACK_CLOSURE.json')
const LATEST_ROUTING_REPORT = path.join(resultsDir, 'LATEST_METER_ROUTING_EXACT_RESTORE.json')
const RELATIVE_METER_REPORT = 'testbench\\results\\LATEST_METER_FEEDBACK_CLOSURE.json'
const RELATIVE_ROUTING_REPORT = 'testbench\\results\\LATEST_METER_ROUTING_EXACT_RESTORE.json'

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

function clonePlain(value) {
	return JSON.parse(JSON.stringify(value))
}

function restoreFailureError(context, restoreError, operationError = null) {
	const operationDetail = operationError ? `; operation also failed: ${operationError.message}` : ''
	return new Error(`RESTORE FAILED: ${context}; ${restoreError.message}${operationDetail}`, { cause: restoreError })
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

async function captureRounds({ baseUrl, label, pageNumber, tracks, rounds = 3 }) {
	const list = [...tracks.values()]
	for (let round = 0; round < rounds; round++) {
		await mapLimit(list, 16, async (track) => observeTrack(baseUrl, label, pageNumber, track))
		if (round + 1 < rounds) await sleep(250)
	}
}

function meterSignature(model, descriptors) {
	return hashObject({
		model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		evidenceMode: METER_EVIDENCE_MODE,
		descriptors,
	})
}

function loadTracks(signature, descriptors) {
	if (!fs.existsSync(LATEST_METER_REPORT)) {
		return new Map(descriptors.map((descriptor) => [descriptor.id, newTrack(descriptor)]))
	}
	try {
		const prior = JSON.parse(fs.readFileSync(LATEST_METER_REPORT, 'utf8'))
		if (
			prior.reportVersion !== REPORT_VERSION ||
			prior.evidenceMode !== METER_EVIDENCE_MODE ||
			prior.signature !== signature ||
			!Array.isArray(prior.paths)
		) {
			return new Map(descriptors.map((descriptor) => [descriptor.id, newTrack(descriptor)]))
		}
		const byId = new Map(prior.paths.map((entry) => [entry.id, entry]))
		return new Map(descriptors.map((descriptor) => [descriptor.id, restoreTrack(descriptor, byId.get(descriptor.id))]))
	} catch {
		return new Map(descriptors.map((descriptor) => [descriptor.id, newTrack(descriptor)]))
	}
}

function writeMeterEvidence({ model, signature, tracks }) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = reportPayload({ model, moduleVersion: EXPECTED_MODULE_VERSION, signature, tracks })
	fs.writeFileSync(LATEST_METER_REPORT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
	return payload
}

function printMeterSummary(summary) {
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

function printPending(tracks) {
	const pending = [...tracks.values()].filter((track) => classifyTrack(track) !== 'PASS_FLOOR_AND_MOVEMENT')
	if (!pending.length) return
	console.log('CHEMINS ENCORE NON CLOS :')
	for (const track of pending) {
		console.log(
			`  - ${track.label.padEnd(18)} ${classifyTrack(track)} min=${track.min ?? '?'} max=${track.max ?? '?'} threshold=${track.threshold}`,
		)
	}
}

function choosePlaybackCandidate(candidates) {
	const usable = candidates.filter(
		(candidate) =>
			candidate && candidate.raw && String(candidate.raw) !== '0' && /playback/i.test(String(candidate.name || '')),
	)
	usable.sort((a, b) => Number(Boolean(b.stereo)) - Number(Boolean(a.stereo)) || Number(a.slot) - Number(b.slot))
	return usable[0] || null
}

async function detectPlaybackSource(baseUrl, label, snapshot) {
	const candidates = []
	for (const slot of snapshot.shape.mixerSlots || []) {
		const [source, name, stereo] = await Promise.all([
			readVariableOptional(baseUrl, label, `mixer_slot_${slot}_source`, 1800),
			readVariableOptional(baseUrl, label, `mixer_slot_${slot}_source_name`, 1800),
			readVariableOptional(baseUrl, label, `mixer_slot_${slot}_stereo`, 1800),
		])
		if (!source.exists) continue
		candidates.push({
			slot,
			raw: String(source.value ?? '').trim(),
			name: String(name.value ?? '').trim(),
			stereo: canonicalBool(stereo.value) === 'true',
		})
	}
	const selected = choosePlaybackCandidate(candidates)
	if (!selected) {
		throw new Error(
			'No existing mixer slot is currently assigned to a Playback source; mixer-slot source writes remain intentionally withheld.',
		)
	}
	return selected
}

async function resolveSourceMeter(baseUrl, label, rawSource) {
	for (let n = 1; n <= 128; n++) {
		const root = await readVariableOptional(baseUrl, label, `source_${n}_root_id`, 1000)
		if (!root.exists) {
			if (n > 16) break
			continue
		}
		if (String(root.value) !== String(rawSource)) continue
		const meter = await readVariableOptional(baseUrl, label, `source_${n}_meter`, 1200)
		return meter.exists ? `source_${n}_meter` : null
	}
	return null
}

async function waitForPlaybackMovement(baseUrl, label, meterVariable) {
	if (!meterVariable) {
		line(
			'INFO',
			'Playback activity oracle',
			'Playback source has no exposed source meter; routed output/mix meters will be the activity proof.',
		)
		return true
	}
	for (let attempt = 0; attempt < 30; attempt++) {
		const item = await readVariableOptional(baseUrl, label, meterVariable, 1200)
		if (item.exists && Number.isFinite(Number(item.value)) && Number(item.value) > METER_FLOOR_DBFS) return true
		await sleep(200)
	}
	return false
}

function laneExactRestorable(snapshot, lane) {
	const base = laneBase(lane)
	let gainCount = 0
	for (let slot = 1; slot <= 24; slot++) {
		for (const property of ['gain', 'mute', 'solo']) {
			const variable = `${base}_slot_${slot}_${property}`
			const item = snapshot.values[variable]
			if (!item?.exists) continue
			if (item.value === '') return false
			if (property === 'gain') {
				gainCount++
				if (!Number.isFinite(Number(item.value))) return false
			} else if (canonicalBool(item.value) === null) return false
		}
	}
	return gainCount > 0
}

function pairExactRestorable(snapshot, left, right) {
	for (const output of [left, right]) {
		const item = snapshot.values[`output_${output + 1}_source`]
		if (!item?.exists || String(item.value ?? '').trim() === '') return false
	}
	return true
}

async function livePairAvailable(baseUrl, label, snapshot, left, right) {
	for (const output of [left, right]) {
		const variable = `output_${output + 1}_available`
		const item = snapshot.values[variable]
		if (!item?.exists) continue
		const live = await readVariableOptional(baseUrl, label, variable, 1800)
		if (!live.exists || canonicalBool(live.value) !== 'true') return false
	}
	return true
}

async function requireChecks(baseUrl, label, checks, context, timeout = 8000) {
	const results = await verifyMany(baseUrl, label, checks, timeout)
	const failed = results.find((item) => !item.ok)
	if (failed) {
		throw new Error(
			`${context}: ${failed.variable} expected ${failed.expected}, observed ${failed.actual ?? 'unknown'}.`,
		)
	}
	return results
}

async function restoreLane({ baseUrl, label, pageNumber, built, snapshot, lane }) {
	const id = laneId(lane)
	const restores = [
		{
			batch: `${id}-gain-restore`,
			checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', restore: true }),
		},
		{
			batch: `${id}-mute-restore`,
			checks: batchChecksForLane(snapshot, lane, { property: 'mute', kind: 'bool', restore: true }),
		},
		{
			batch: `${id}-solo-restore`,
			checks: batchChecksForLane(snapshot, lane, { property: 'solo', kind: 'bool', restore: true }),
		},
	]
	for (const restore of restores) {
		if (!built.locations[restore.batch] || !restore.checks.length) continue
		await pressBatch(baseUrl, pageNumber, built, restore.batch)
		await requireChecks(
			baseUrl,
			label,
			restore.checks,
			`RESTORE FAILED ${lane.mix} ${lane.side} ${restore.batch}`,
			10000,
		)
	}
}

async function driveLane({
	baseUrl,
	label,
	pageNumber,
	built,
	snapshot,
	lane,
	tracks,
	r9PageNumber,
	activeChanges = new Set(),
}) {
	if (!laneExactRestorable(snapshot, lane)) {
		return { lane: `${lane.mix} ${lane.side}`, status: 'SKIP_BASELINE_UNKNOWN' }
	}
	const id = laneId(lane)
	const token = `lane:${id}`
	let touched = false
	let operationError = null
	let restoreError = null
	try {
		activeChanges.add(token)
		touched = true
		await pressBatch(baseUrl, pageNumber, built, `${id}-gain-set`)
		await requireChecks(
			baseUrl,
			label,
			batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: METER_FLOOR_DBFS }),
			`${lane.mix} ${lane.side} floor gain`,
		)
		await captureRounds({ baseUrl, label, pageNumber: r9PageNumber, tracks, rounds: 2 })

		await pressBatch(baseUrl, pageNumber, built, `${id}-solo-off`)
		await requireChecks(
			baseUrl,
			label,
			batchChecksForLane(snapshot, lane, { property: 'solo', kind: 'bool', value: 'false' }),
			`${lane.mix} ${lane.side} solo off`,
		)
		await pressBatch(baseUrl, pageNumber, built, `${id}-mute-off`)
		await requireChecks(
			baseUrl,
			label,
			batchChecksForLane(snapshot, lane, { property: 'mute', kind: 'bool', value: 'false' }),
			`${lane.mix} ${lane.side} mute off`,
		)
		await pressBatch(baseUrl, pageNumber, built, `meter-route-${id}-gain-drive`)
		await requireChecks(
			baseUrl,
			label,
			batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: METER_DRIVE_GAIN_DB }),
			`${lane.mix} ${lane.side} meter drive gain`,
		)
		await captureRounds({ baseUrl, label, pageNumber: r9PageNumber, tracks, rounds: 3 })
	} catch (error) {
		operationError = error
	} finally {
		if (touched) {
			try {
				await restoreLane({ baseUrl, label, pageNumber, built, snapshot, lane })
				activeChanges.delete(token)
			} catch (error) {
				restoreError = error
			}
		} else {
			activeChanges.delete(token)
		}
	}
	if (restoreError) throw restoreFailureError(`${lane.mix} ${lane.side}`, restoreError, operationError)
	if (operationError) throw operationError
	return { lane: `${lane.mix} ${lane.side}`, status: 'EXERCISED' }
}

async function restorePairExact({
	baseUrl,
	label,
	pageNumber,
	built,
	snapshot,
	left,
	right,
	quarantineOnFailure = true,
}) {
	const batches = pairBatchIds(left, right)
	const checks = [
		exactCheck(`output_${left + 1}_source`, snapshot.values[`output_${left + 1}_source`].value),
		exactCheck(`output_${right + 1}_source`, snapshot.values[`output_${right + 1}_source`].value),
	]
	try {
		await pressBatch(baseUrl, pageNumber, built, batches.restore)
		await requireChecks(baseUrl, label, checks, `RESTORE FAILED output pair ${left + 1}-${right + 1}`, 10000)
	} catch (error) {
		if (quarantineOnFailure && built.locations[batches.none]) {
			try {
				await pressBatch(baseUrl, pageNumber, built, batches.none)
				await requireChecks(
					baseUrl,
					label,
					[exactCheck(`output_${left + 1}_source`, '0'), exactCheck(`output_${right + 1}_source`, '0')],
					`Pair ${left + 1}-${right + 1} Source=None quarantine`,
					7000,
				)
			} catch {
				// The original restore error remains authoritative; no optimistic quarantine claim is made.
			}
		}
		throw error
	}
}

async function establishPairNoneGuards({
	baseUrl,
	label,
	pageNumber,
	built,
	snapshot,
	pairBatches,
	tracks,
	r9PageNumber,
	activeChanges = new Set(),
}) {
	const guarded = []
	for (const pair of pairBatches) {
		const { left, right } = pair
		if (!pairExactRestorable(snapshot, left, right)) continue
		if (!(await livePairAvailable(baseUrl, label, snapshot, left, right))) continue
		const batches = pairBatchIds(left, right)
		if (!built.locations[batches.none] || !built.locations[batches.restore]) continue
		const token = `pair-guard:${left}-${right}`
		activeChanges.add(token)
		try {
			await pressBatch(baseUrl, pageNumber, built, batches.none)
			await requireChecks(
				baseUrl,
				label,
				[exactCheck(`output_${left + 1}_source`, '0'), exactCheck(`output_${right + 1}_source`, '0')],
				`Pair ${left + 1}-${right + 1} Source=None guard`,
				7500,
			)
			guarded.push({ left, right, token })
			await captureRounds({ baseUrl, label, pageNumber: r9PageNumber, tracks, rounds: 2 })
		} catch (error) {
			try {
				await restorePairExact({ baseUrl, label, pageNumber, built, snapshot, left, right })
				activeChanges.delete(token)
				line(
					'INFO',
					`Pair ${left + 1}-${right + 1} guard`,
					`${error.message}; original pair sources restored, continuing under physical isolation.`,
				)
			} catch (restoreError) {
				throw restoreFailureError(`pair ${left + 1}-${right + 1}`, restoreError, error)
			}
		}
	}
	return guarded
}

async function restorePairGuards({ baseUrl, label, pageNumber, built, snapshot, guarded, activeChanges = new Set() }) {
	for (const { left, right, token } of [...guarded].reverse()) {
		await restorePairExact({ baseUrl, label, pageNumber, built, snapshot, left, right })
		activeChanges.delete(token)
	}
}

async function driveOutputPairs({
	baseUrl,
	label,
	pageNumber,
	built,
	snapshot,
	pairBatches,
	driveSource,
	tracks,
	r9PageNumber,
	activeChanges = new Set(),
}) {
	const results = []
	for (const pair of pairBatches) {
		const { left, right, id } = pair
		if (!pairExactRestorable(snapshot, left, right)) {
			results.push({ pair: `${left + 1}-${right + 1}`, status: 'SKIP_BASELINE_UNKNOWN' })
			continue
		}
		if (!(await livePairAvailable(baseUrl, label, snapshot, left, right))) {
			results.push({ pair: `${left + 1}-${right + 1}`, status: 'SKIP_AVAILABILITY_CHANGED' })
			continue
		}
		const token = `pair-drive:${left}-${right}`
		let touched = false
		let operationError = null
		let restoreError = null
		try {
			activeChanges.add(token)
			touched = true
			await pressBatch(baseUrl, pageNumber, built, id)
			const mapped = await pairedTestMapping(baseUrl, label, left, right, driveSource)
			if (!mapped.ok) {
				results.push({ pair: `${left + 1}-${right + 1}`, status: 'NO_PAIR_MAPPING' })
			} else {
				await captureRounds({ baseUrl, label, pageNumber: r9PageNumber, tracks, rounds: 3 })
				results.push({ pair: `${left + 1}-${right + 1}`, status: 'EXERCISED' })
			}
		} catch (error) {
			operationError = error
		} finally {
			if (touched) {
				try {
					await restorePairExact({ baseUrl, label, pageNumber, built, snapshot, left, right })
					activeChanges.delete(token)
				} catch (error) {
					restoreError = error
				}
			} else {
				activeChanges.delete(token)
			}
		}
		if (restoreError) {
			throw restoreFailureError(`output pair ${left + 1}-${right + 1}`, restoreError, operationError)
		}
		if (operationError) throw operationError
	}
	return results
}

function routingFailureClass(error) {
	if (!error) return null
	if (/RESTORE FAILED/i.test(error.message)) return 'RESTORE_FAILED'
	if (/mismatch/i.test(error.message)) return 'FEEDBACK_MISMATCH'
	if (/cancel/i.test(error.message)) return 'OPERATOR_CANCELLED'
	return 'CAMPAIGN_FAILED'
}

function writeRoutingReport({
	model,
	playback,
	lanes,
	pairs,
	meterSummary,
	pageRestored,
	hardwareRestored,
	hardwareWritesStarted,
	failureClass,
}) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = {
		reportVersion: 1,
		reportClass: 'meter-routing-exact-restore-local-sanitized',
		updatedAt: nowIso(),
		model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		hardwareWrites: hardwareWritesStarted,
		routingChangesTemporary: hardwareWritesStarted,
		exactRestoreRequired: true,
		playback: { slot: playback.slot, name: playback.name, stereo: playback.stereo },
		lanes,
		pairs,
		meterSummary,
		hardwareRestored,
		page2BaseRestored: pageRestored,
		failureClass,
		privacy:
			'No serial, hostname, Control Server endpoint, client identity, raw source ID, raw XML, Companion connection ID or user path is stored.',
	}
	fs.writeFileSync(LATEST_ROUTING_REPORT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
	return payload
}

async function manualInputPasses({ baseUrl, label, pageNumber, tracks }) {
	while (
		[...tracks.values()].some(
			(track) => track.definitionId === 'input_meter' && classifyTrack(track) !== 'PASS_FLOOR_AND_MOVEMENT',
		)
	) {
		console.log('')
		console.log('INPUTS PHYSIQUES - READ ONLY')
		console.log('Tu peux maintenant alimenter une ou plusieurs entrees physiques sans changer le routing Focusrite.')
		const answer = await ask('Tape INPUT_SIGNAL pour capturer, ou DONE : ')
		if (answer !== 'INPUT_SIGNAL') break
		await captureRounds({ baseUrl, label, pageNumber, tracks, rounds: 4 })
		printMeterSummary(summarizeTracks(tracks))
	}
}

async function main() {
	if (!process.argv.includes(ALLOW_ROUTING_FLAG)) {
		throw new Error(`REFUSED: missing explicit ${ALLOW_ROUTING_FLAG} permission.`)
	}
	if (!process.argv.includes(ISOLATION_FLAG)) {
		throw new Error(`REFUSED: missing explicit ${ISOLATION_FLAG} permission.`)
	}

	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 METER ROUTING - EXACT RESTORE')
	console.log('==================================================================')
	console.log('Cette campagne modifie temporairement routing/mix via les actions Companion auditees.')
	console.log('Aucun write protocole Focusrite direct. Aucun Monitor gain 1677. Aucun Mixer Slot Source write.')
	console.log(
		'Toute restauration non confirmee provoque un HARD ABORT; les sorties availability UNKNOWN ne sont jamais ecrites.',
	)
	console.log('Le launcher doit avoir recu les confirmations ROUTE_METERS + ALL_ISOLATED avant ces flags.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		throw new Error('Expose all mixer slot variables must remain enabled before meter routing.')
	}
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		throw new Error(
			'Meter routing requires the current V8 capability-lab harness to be already present and audited exactly on Companion Page 2.',
		)
	}

	const playback = await detectPlaybackSource(ctx.baseUrl, ctx.label, ctx.snapshot)
	line(
		'PASS',
		'Playback source',
		`existing mixer slot ${playback.slot} :: ${playback.name}${playback.stereo ? ' / stereo' : ''}`,
	)
	const sourceMeter = await resolveSourceMeter(ctx.baseUrl, ctx.label, playback.raw)
	const descriptors = buildMeterDescriptors(ctx.r9)
	if (descriptors.length !== 46) throw new Error(`Expected exactly 46 meter probes, got ${descriptors.length}.`)
	const signature = meterSignature(ctx.model, descriptors)
	const tracks = loadTracks(signature, descriptors)

	console.log('')
	console.log('BASELINE SILENCE / PLANCHER')
	console.log('Arrete le playback PC pour cette capture initiale. Aucun routing hardware n est encore modifie.')
	const silent = await ask('Tape SILENT quand le playback est arrete : ')
	if (silent !== 'SILENT') throw new Error('Operator cancelled before hardware writes: SILENT baseline not confirmed.')
	await captureRounds({ baseUrl: ctx.baseUrl, label: ctx.label, pageNumber: ctx.r9.pageNumber, tracks, rounds: 4 })
	let meterPayload = writeMeterEvidence({ model: ctx.model, signature, tracks })
	printMeterSummary(meterPayload.summary)
	if (meterPayload.summary.mismatch) {
		throw new Error('Persistent feedback/oracle mismatch exists before routing; hardware writes are blocked.')
	}

	const baseBuilt = clonePlain(ctx.built)
	const augmented = augmentMeterRoutingHarness(
		ctx.built,
		ctx.snapshot,
		ctx.profile,
		ctx.outputEligibility,
		playback.raw,
	)
	const files = writeMeterRoutingPages(baseBuilt, augmented.built)
	const activeChanges = new Set()
	let customPageInstallAttempted = false
	let pageRestored = false
	let hardwareWritesStarted = false
	let guarded = []
	let laneResults = []
	let pairResults = []
	let campaignError = null
	let pageNumber = ctx.ext.pageNumber

	try {
		customPageInstallAttempted = true
		const ext = await replacePage2FromFile({
			baseUrl: ctx.baseUrl,
			r9: ctx.r9,
			built: augmented.built,
			filePath: files.routing,
		})
		pageNumber = ext.pageNumber
		line(
			'PASS',
			'Meter routing Page 2',
			'temporary augmented harness imported; Page 1 and existing Focusrite connection preserved',
		)

		console.log('')
		console.log('SIGNAL DE REFERENCE')
		console.log(`Lance maintenant un signal PC continu sur ${playback.name}. Niveau raisonnable, sans saturation.`)
		while (true) {
			const ready = await ask('Tape SIGNAL_READY quand le playback tourne, ou DONE : ')
			if (ready !== 'SIGNAL_READY')
				throw new Error('Operator cancelled before hardware writes: playback signal not confirmed.')
			if (await waitForPlaybackMovement(ctx.baseUrl, ctx.label, sourceMeter)) break
			console.log(
				'Le meter source Playback est encore au plancher. Verifie que le son sort bien par la Scarlett puis reessaie.',
			)
		}
		line('PASS', 'Playback activity', 'reference signal observed or delegated to routed meter proof')

		hardwareWritesStarted = true
		guarded = await establishPairNoneGuards({
			baseUrl: ctx.baseUrl,
			label: ctx.label,
			pageNumber,
			built: augmented.built,
			snapshot: ctx.snapshot,
			pairBatches: augmented.pairBatches,
			tracks,
			r9PageNumber: ctx.r9.pageNumber,
			activeChanges,
		})
		line(
			'PASS',
			'Output pair guards',
			`${guarded.length}/${augmented.pairBatches.length} exact-restorable available pairs held at Source=None; remaining safety is physical isolation`,
		)

		for (const lane of ctx.snapshot.shape.lanes) {
			const result = await driveLane({
				baseUrl: ctx.baseUrl,
				label: ctx.label,
				pageNumber,
				built: augmented.built,
				snapshot: ctx.snapshot,
				lane,
				tracks,
				r9PageNumber: ctx.r9.pageNumber,
				activeChanges,
			})
			laneResults.push(result)
			line(result.status === 'EXERCISED' ? 'PASS' : 'INFO', `Mix ${result.lane}`, result.status)
		}

		await restorePairGuards({
			baseUrl: ctx.baseUrl,
			label: ctx.label,
			pageNumber,
			built: augmented.built,
			snapshot: ctx.snapshot,
			guarded,
			activeChanges,
		})
		guarded = []

		pairResults = await driveOutputPairs({
			baseUrl: ctx.baseUrl,
			label: ctx.label,
			pageNumber,
			built: augmented.built,
			snapshot: ctx.snapshot,
			pairBatches: augmented.pairBatches,
			driveSource: playback.raw,
			tracks,
			r9PageNumber: ctx.r9.pageNumber,
			activeChanges,
		})
		for (const result of pairResults) {
			line(result.status === 'EXERCISED' ? 'PASS' : 'INFO', `Output pair ${result.pair}`, result.status)
		}

		meterPayload = writeMeterEvidence({ model: ctx.model, signature, tracks })
		printMeterSummary(meterPayload.summary)
		if (meterPayload.summary.mismatch) {
			throw new Error('Persistent feedback/oracle mismatch observed during routing campaign.')
		}

		console.log('')
		console.log(
			'Le routing/mix temporaire est restaure. Arrete maintenant le playback PC; garde les sorties physiquement isolees.',
		)
		const stopped = await ask('Tape PLAYBACK_STOPPED pour passer aux entrees physiques, ou DONE pour terminer : ')
		if (stopped === 'PLAYBACK_STOPPED') {
			await manualInputPasses({
				baseUrl: ctx.baseUrl,
				label: ctx.label,
				pageNumber: ctx.r9.pageNumber,
				tracks,
			})
		}
		meterPayload = writeMeterEvidence({ model: ctx.model, signature, tracks })
	} catch (error) {
		campaignError = error
	} finally {
		if (guarded.length) {
			try {
				await restorePairGuards({
					baseUrl: ctx.baseUrl,
					label: ctx.label,
					pageNumber,
					built: augmented.built,
					snapshot: ctx.snapshot,
					guarded,
					activeChanges,
				})
				guarded = []
			} catch (restoreError) {
				campaignError = campaignError || restoreError
			}
		}
		if (customPageInstallAttempted) {
			try {
				await replacePage2FromFile({
					baseUrl: ctx.baseUrl,
					r9: ctx.r9,
					built: baseBuilt,
					filePath: files.baseRestore,
				})
				pageRestored = true
				line('PASS', 'Companion Page 2 restore', 'original audited capability-lab page restored')
			} catch (pageError) {
				line('FAIL', 'Companion Page 2 restore', pageError.message)
				campaignError = campaignError || pageError
			}
		}
	}

	const finalSummary = summarizeTracks(tracks)
	const hardwareRestored = activeChanges.size === 0
	writeRoutingReport({
		model: ctx.model,
		playback,
		lanes: laneResults,
		pairs: pairResults,
		meterSummary: finalSummary,
		pageRestored,
		hardwareRestored,
		hardwareWritesStarted,
		failureClass: routingFailureClass(campaignError),
	})

	console.log('')
	console.log('==================================================================')
	printMeterSummary(finalSummary)
	printPending(tracks)
	console.log(`Rapport meter local sanitise: ${RELATIVE_METER_REPORT}`)
	console.log(`Rapport routing local sanitise: ${RELATIVE_ROUTING_REPORT}`)
	console.log(`Hardware restore confirme: ${hardwareRestored ? 'YES' : 'NO'}`)
	console.log(`Companion Page 2 base restauree: ${pageRestored ? 'YES' : 'NO'}`)
	if (campaignError) console.log(`Campaign result: ${routingFailureClass(campaignError)}`)

	if (!hardwareRestored) {
		console.log('METER ROUTING HARD ABORT - restauration hardware non confirmee. Ne lance aucune autre campagne.')
		process.exitCode = 4
	} else if (!pageRestored) {
		console.log(
			'METER ROUTING PARTIAL - hardware restaure, mais Page 2 Companion doit etre restauree avant autre campagne.',
		)
		process.exitCode = 6
	} else if (campaignError) {
		console.log('METER ROUTING STOPPED - restauration confirmee, mais la campagne n a pas atteint sa fin normale.')
		process.exitCode = 2
	} else if (finalSummary.mismatch) {
		console.log('METER ROUTING FAIL - feedback/oracle mismatch persistant.')
		process.exitCode = 4
	} else if (finalSummary.complete) {
		console.log('METER ROUTING COMPLETE - 46/46 chemins ont plancher + mouvement avec restauration exacte.')
	} else {
		console.log('METER ROUTING PARTIAL - aucun mismatch/restore failure, certains chemins restent MANUAL_PENDING.')
	}
	console.log('==================================================================')
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`METER ROUTING FATAL - ${error.message}`)
		console.error('Aucun write ne doit etre suppose restaure sans preuve serveur.')
		process.exitCode = 4
	})
}

module.exports = {
	ALLOW_ROUTING_FLAG,
	ISOLATION_FLAG,
	meterSignature,
	loadTracks,
	restoreFailureError,
	choosePlaybackCandidate,
	detectPlaybackSource,
	resolveSourceMeter,
	laneExactRestorable,
	pairExactRestorable,
	livePairAvailable,
	routingFailureClass,
	driveLane,
	driveOutputPairs,
	writeRoutingReport,
}
