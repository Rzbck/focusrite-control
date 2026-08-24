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
	canonicalBool,
	readVariableOptional,
	mapLimit,
} = require('./FullTestBenchBase')
const { Reporter, verifyMany } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { pressBatch } = require('./FullTestBenchV4Common')
const {
	METER_FLOOR_DBFS,
	buildMeterDescriptors,
	sampleAgrees,
	applySample,
	classifyTrack,
	summarizeTracks,
	reportPayload,
} = require('./MeterFeedbackClosure')
const {
	METER_DRIVE_GAIN_DB,
	writeMeterRoutingPages,
} = require('./MeterRoutingPage')
const {
	meterSignature,
	loadTracks,
	restoreFailureError,
	detectPlaybackSource,
	resolveSourceMeter,
} = require('./MeterRoutingClosure')
const { augmentMixPlaybackHarness } = require('./MeterMixPlaybackPage')
const { replacePage2FromFile } = require('./MeterRoutingPageImport')

const ALLOW_MIX_FLAG = '--allow-mix-meter-writes'
const ISOLATION_FLAG = '--confirm-all-output-routing-isolated'
const LATEST_METER_REPORT = path.join(resultsDir, 'LATEST_METER_FEEDBACK_CLOSURE.json')
const LATEST_MIX_REPORT = path.join(resultsDir, 'LATEST_METER_MIX_PLAYBACK_CLOSURE.json')
const RELATIVE_METER_REPORT = 'testbench\\results\\LATEST_METER_FEEDBACK_CLOSURE.json'
const RELATIVE_MIX_REPORT = 'testbench\\results\\LATEST_METER_MIX_PLAYBACK_CLOSURE.json'

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

function numericCheck(variable, expected, tolerance = 0.0001) {
	return {
		variable,
		expected: String(expected),
		predicate: (value) => Number.isFinite(Number(value)) && Math.abs(Number(value) - Number(expected)) <= tolerance,
	}
}

function boolCheck(variable, expected) {
	return {
		variable,
		expected: String(expected),
		predicate: (value) => canonicalBool(value) === String(expected),
	}
}

function checksForState(entry, state) {
	const { variables } = entry.baseline
	if (state === 'floor') {
		return [
			numericCheck(variables.gain, METER_FLOOR_DBFS),
			boolCheck(variables.solo, 'false'),
			boolCheck(variables.mute, 'true'),
		]
	}
	if (state === 'drive') {
		return [
			numericCheck(variables.gain, METER_DRIVE_GAIN_DB),
			boolCheck(variables.solo, 'false'),
			boolCheck(variables.mute, 'false'),
		]
	}
	return [
		numericCheck(variables.gain, entry.baseline.gain),
		boolCheck(variables.solo, entry.baseline.solo),
		boolCheck(variables.mute, entry.baseline.mute),
	]
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
			return
		}
		persistentMismatch = sample
		validMismatchSamples++
	}
	if (persistentMismatch && validMismatchSamples === 3) applySample(track, persistentMismatch)
}

async function captureRounds({ baseUrl, label, pageNumber, tracks, rounds = 3 }) {
	const list = [...tracks.values()]
	for (let round = 0; round < rounds; round++) {
		await mapLimit(list, 16, async (track) => observeTrack(baseUrl, label, pageNumber, track))
		if (round + 1 < rounds) await sleep(250)
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

function printPendingMixes(tracks) {
	const pending = [...tracks.values()].filter(
		(track) => track.definitionId === 'mix_meter' && classifyTrack(track) !== 'PASS_FLOOR_AND_MOVEMENT',
	)
	if (!pending.length) return
	console.log('MIX METERS ENCORE NON CLOS :')
	for (const track of pending) {
		console.log(
			`  - ${track.label.padEnd(18)} ${classifyTrack(track)} min=${track.min ?? '?'} max=${track.max ?? '?'} threshold=${track.threshold}`,
		)
	}
}

async function waitForPlaybackMovement(baseUrl, label, meterVariable) {
	if (!meterVariable) {
		line(
			'INFO',
			'Playback activity oracle',
			'Playback source has no exposed source meter; routed mix/output meters will be the activity proof.',
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

async function drivePlaybackLane({ baseUrl, label, pageNumber, entry, tracks, r9PageNumber, activeChanges }) {
	if (entry.status !== 'READY') {
		return { lane: `${entry.lane.mix} ${entry.lane.side}`, slot: entry.slot, status: entry.status }
	}
	const token = `mix-playback:${entry.id}`
	let touched = false
	let operationError = null
	let restoreError = null
	try {
		activeChanges.add(token)
		touched = true
		await pressBatch(baseUrl, pageNumber, { locations: entry.locations }, entry.batches.floor)
		await requireChecks(baseUrl, label, checksForState(entry, 'floor'), `${entry.lane.mix} ${entry.lane.side} playback floor`)
		await captureRounds({ baseUrl, label, pageNumber: r9PageNumber, tracks, rounds: 2 })

		await pressBatch(baseUrl, pageNumber, { locations: entry.locations }, entry.batches.drive)
		await requireChecks(baseUrl, label, checksForState(entry, 'drive'), `${entry.lane.mix} ${entry.lane.side} playback drive`)
		await captureRounds({ baseUrl, label, pageNumber: r9PageNumber, tracks, rounds: 3 })
	} catch (error) {
		operationError = error
	} finally {
		if (touched) {
			try {
				await pressBatch(baseUrl, pageNumber, { locations: entry.locations }, entry.batches.restore)
				await requireChecks(
					baseUrl,
					label,
					checksForState(entry, 'restore'),
					`RESTORE FAILED ${entry.lane.mix} ${entry.lane.side} playback slot ${entry.slot}`,
					10000,
				)
				activeChanges.delete(token)
			} catch (error) {
				restoreError = error
			}
		} else {
			activeChanges.delete(token)
		}
	}
	if (restoreError) {
		throw restoreFailureError(`${entry.lane.mix} ${entry.lane.side} playback slot ${entry.slot}`, restoreError, operationError)
	}
	if (operationError) throw operationError
	return { lane: `${entry.lane.mix} ${entry.lane.side}`, slot: entry.slot, status: 'EXERCISED' }
}

function attachLocations(lanes, built) {
	return lanes.map((entry) => ({ ...entry, locations: built.locations }))
}

function writeMixReport({ model, playback, lanes, meterSummary, pageRestored, hardwareRestored, hardwareWritesStarted, failureClass }) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = {
		reportVersion: 1,
		reportClass: 'meter-mix-playback-closure-local-sanitized',
		updatedAt: nowIso(),
		model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		hardwareWrites: hardwareWritesStarted,
		exactRestoreRequired: true,
		writeScope: 'existing-playback-slot-only',
		outputSourceWrites: false,
		playback: { slot: playback.slot, name: playback.name, stereo: playback.stereo },
		lanes,
		meterSummary,
		hardwareRestored,
		page2BaseRestored: pageRestored,
		failureClass,
		privacy:
			'No serial, hostname, Control Server endpoint, client identity, raw source ID, raw XML, Companion connection ID or user path is stored.',
	}
	fs.writeFileSync(LATEST_MIX_REPORT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
	return payload
}

function failureClass(error) {
	if (!error) return null
	if (/RESTORE FAILED/i.test(error.message)) return 'RESTORE_FAILED'
	if (/mismatch/i.test(error.message)) return 'FEEDBACK_MISMATCH'
	if (/cancel/i.test(error.message)) return 'OPERATOR_CANCELLED'
	return 'CAMPAIGN_FAILED'
}

async function main() {
	if (!process.argv.includes(ALLOW_MIX_FLAG)) throw new Error(`REFUSED: missing explicit ${ALLOW_MIX_FLAG} permission.`)
	if (!process.argv.includes(ISOLATION_FLAG)) throw new Error(`REFUSED: missing explicit ${ISOLATION_FLAG} permission.`)

	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 MIX METER - PLAYBACK SLOT EXACT RESTORE')
	console.log('==================================================================')
	console.log('Cette campagne touche uniquement gain/mute/solo du strip Playback detecte dans chaque lane.')
	console.log('Aucun Output Source write. Aucun Pair Source=None. Aucun Mixer Slot Source write.')
	console.log('Aucun Monitor gain 1677. Aucun Advanced Raw. Toute restauration doit etre serveur-confirmee.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') throw new Error('Expose all mixer slot variables must remain enabled before mix meter closure.')
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		throw new Error('Focused mix meter closure requires the current V8 capability-lab harness on Companion Page 2.')
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
	const initial = summarizeTracks(tracks)
	printMeterSummary(initial)
	if (initial.mismatch) throw new Error('Persistent feedback/oracle mismatch exists before focused mix writes.')

	const baseBuilt = clonePlain(ctx.built)
	const augmented = augmentMixPlaybackHarness(ctx.built, ctx.snapshot, playback.slot)
	const laneEntries = attachLocations(augmented.lanes, augmented.built)
	const ready = laneEntries.filter((entry) => entry.status === 'READY')
	line('INFO', 'Focused lane eligibility', `${ready.length}/${laneEntries.length} lanes have exact Playback-slot gain/mute/solo baselines`)
	if (!ready.length) throw new Error('No mix lane has an exact-restorable baseline for the detected Playback slot.')

	const files = writeMeterRoutingPages(baseBuilt, augmented.built)
	const activeChanges = new Set()
	let pageRestored = false
	let pageInstallAttempted = false
	let hardwareWritesStarted = false
	let laneResults = []
	let campaignError = null
	let pageNumber = ctx.ext.pageNumber

	try {
		pageInstallAttempted = true
		const ext = await replacePage2FromFile({
			baseUrl: ctx.baseUrl,
			r9: ctx.r9,
			built: augmented.built,
			filePath: files.routing,
		})
		pageNumber = ext.pageNumber
		line('PASS', 'Focused mix Page 2', 'temporary Playback-slot harness imported; Page 1 and connection set preserved')

		console.log('')
		console.log('SIGNAL DE REFERENCE')
		console.log(`Lance un signal PC continu sur ${playback.name}. Le script le mute/unmute lane par lane.`)
		while (true) {
			const answer = await ask('Tape SIGNAL_READY quand le playback tourne, ou DONE : ')
			if (answer !== 'SIGNAL_READY') throw new Error('Operator cancelled before focused mix hardware writes.')
			if (await waitForPlaybackMovement(ctx.baseUrl, ctx.label, sourceMeter)) break
			console.log('Le meter source Playback est encore au plancher. Verifie le signal puis reessaie.')
		}
		line('PASS', 'Playback activity', 'reference signal confirmed or delegated to routed meter proof')

		hardwareWritesStarted = true
		for (const entry of laneEntries) {
			const result = await drivePlaybackLane({
				baseUrl: ctx.baseUrl,
				label: ctx.label,
				pageNumber,
				entry,
				tracks,
				r9PageNumber: ctx.r9.pageNumber,
				activeChanges,
			})
			laneResults.push(result)
			line(result.status === 'EXERCISED' ? 'PASS' : 'INFO', `Mix ${result.lane}`, `${result.status} / Playback slot ${result.slot}`)
		}
		const meterPayload = writeMeterEvidence({ model: ctx.model, signature, tracks })
		printMeterSummary(meterPayload.summary)
		if (meterPayload.summary.mismatch) throw new Error('Persistent feedback/oracle mismatch observed during focused mix closure.')
	} catch (error) {
		campaignError = error
	} finally {
		if (pageInstallAttempted) {
			try {
				await replacePage2FromFile({
					baseUrl: ctx.baseUrl,
					r9: ctx.r9,
					built: baseBuilt,
					filePath: files.baseRestore,
				})
				pageRestored = true
				line('PASS', 'Companion Page 2 restore', 'original audited capability-lab page restored')
			} catch (error) {
				line('FAIL', 'Companion Page 2 restore', error.message)
				campaignError = campaignError || error
			}
		}
	}

	const finalSummary = summarizeTracks(tracks)
	const hardwareRestored = activeChanges.size === 0
	writeMixReport({
		model: ctx.model,
		playback,
		lanes: laneResults,
		meterSummary: finalSummary,
		pageRestored,
		hardwareRestored,
		hardwareWritesStarted,
		failureClass: failureClass(campaignError),
	})
	writeMeterEvidence({ model: ctx.model, signature, tracks })

	console.log('')
	console.log('==================================================================')
	printMeterSummary(finalSummary)
	printPendingMixes(tracks)
	console.log(`Rapport meter local sanitise: ${RELATIVE_METER_REPORT}`)
	console.log(`Rapport mix local sanitise: ${RELATIVE_MIX_REPORT}`)
	console.log(`Hardware restore confirme: ${hardwareRestored ? 'YES' : 'NO'}`)
	console.log(`Companion Page 2 base restauree: ${pageRestored ? 'YES' : 'NO'}`)
	if (campaignError) console.log(`Campaign result: ${failureClass(campaignError)}`)
	if (!hardwareRestored) {
		console.log('MIX METER HARD ABORT - restauration hardware non confirmee. Ne lance aucune autre campagne.')
		process.exitCode = 4
	} else if (!pageRestored) {
		console.log('MIX METER PARTIAL - hardware restaure, mais Page 2 doit etre restauree avant autre campagne.')
		process.exitCode = 6
	} else if (campaignError) {
		console.log('MIX METER STOPPED - restauration confirmee, campagne incomplete.')
		process.exitCode = 2
	} else {
		console.log('MIX METER PASS - campagne Playback-slot terminee sans mismatch ni restore failure.')
	}
	console.log('==================================================================')
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MIX METER FATAL - ${error.message}`)
		console.error('Aucun write ne doit etre suppose restaure sans preuve serveur.')
		process.exitCode = 4
	})
}

module.exports = {
	ALLOW_MIX_FLAG,
	ISOLATION_FLAG,
	checksForState,
	drivePlaybackLane,
	failureClass,
}
