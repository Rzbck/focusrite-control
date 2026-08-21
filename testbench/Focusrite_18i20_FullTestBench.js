const fs = require('node:fs')
const path = require('node:path')
const { EXPECTED_MODEL, EXPECTED_MODULE, EXPECTED_MODULE_VERSION, R9_PAGE_NAME, R9_MARKER, EXT_MARKER, EXT_INSTANCE_ID, FILE_VERSION, COMPANION_BUILD, testbenchDir, safePlanPath, generatedDir, resultsDir, generatedPagePath, generatedManifestPath, MONITOR_PRESET_VALUES, TALKBACK_SOURCE_CANDIDATES, OUTPUT_PAIR_LEFT_INDICES, DISRUPTIVE_DEFINITIONS, FORBIDDEN_DEFINITIONS, EXTENDED_ALLOWED, nowIso, line, sleep, stableStringify, hashObject, deterministicId, canonicalBool, boolState, rawPanToPercent, expectedPanRaw, request, findCompanion, get, post, readVariableOptional, readVariable, waitVariable, waitExact, mapLimit, unwrapOptions, actionSetsContainWrites, collectActions, collectFeedbacks, pageHasMarker, resolveLiveConnection, exportButtons } = require('./FullTestBenchBase')
const { auditSafeSetters, auditR9, expectedFeedback, readFeedbackMarker, sweepFeedbacks, getR9ActionLocations, pressLocation, safePlanSetter, captureOptionalVars, uniqueBy, discoverShapeFromFeedbacks, laneBase, captureFullSnapshot, chooseTestSource } = require('./FullTestBenchAudit')
const { buildExtendedPage, writeGeneratedExtended, auditExtendedPage } = require('./FullTestBenchPage')
const { Reporter, pressBatch, verifyMany, exactCheck, boolCheck, numericCheck, requireChecks, runBatchSequence, checksForBatch, batchChecksForLane, recordBaselineImpacts, runCoreFull, testMonitorMuteCore, restoreMonitorMuteCore } = require('./FullTestBenchCorePhases')
const { testSimpleExtended, testPairSource, testMixerSlots, testMixLanes, testMonitoringSettings, testReconnect } = require('./FullTestBenchExtendedPhases')

async function selfTest() {
	const shape = {
		inputs: Array.from({ length: 8 }, (_, i) => i),
		outputs: Array.from({ length: 26 }, (_, i) => i),
		mixerSlots: Array.from({ length: 24 }, (_, i) => i + 1),
		lanes: ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((letter) => [
			{ mix: `Mix ${letter}`, side: 'left' },
			{ mix: `Mix ${letter}`, side: 'right' },
		]),
	}
	const values = {}
	for (const i of shape.inputs) values[`input_${i + 1}_nickname`] = { exists: true, value: '' }
	for (const o of shape.outputs) {
		for (const [key, val] of Object.entries({ mute: 'false', source: '100', stereo: 'false', nickname: '', gain: '-12' })) {
			values[`output_${o + 1}_${key}`] = { exists: true, value: val }
		}
	}
	for (const s of shape.mixerSlots) {
		values[`mixer_slot_${s}_source`] = { exists: true, value: '100' }
		values[`mixer_slot_${s}_stereo`] = { exists: true, value: 'false' }
	}
	for (const lane of shape.lanes) {
		const base = laneBase(lane)
		values[`${base}_talkback`] = { exists: true, value: 'false' }
		for (let slot = 1; slot <= 24; slot++) {
			values[`${base}_slot_${slot}_gain`] = { exists: true, value: '-10' }
			values[`${base}_slot_${slot}_pan`] = { exists: true, value: '32768' }
			values[`${base}_slot_${slot}_mute`] = { exists: true, value: 'false' }
			values[`${base}_slot_${slot}_solo`] = { exists: true, value: 'false' }
		}
	}
	Object.assign(values, {
		device_nickname: { exists: true, value: '' },
		monitor_altEnable: { exists: true, value: 'false' },
		monitor_alt: { exists: true, value: 'false' },
		monitor_preset: { exists: true, value: '1-2' },
		device_phantomPersistence: { exists: true, value: 'false' },
		device_talkbackInputSource: { exists: true, value: 'Scarlett Internal Mic' },
	})
	const built = buildExtendedPage({ shape, values }, '100')
	if (!built.batches.length || !built.locations['output-mute-on'] || !built.locations['mixa-l-pan-restore']) {
		throw new Error('FULL generator self-test did not build expected batches.')
	}
	const generatedDefinitionIds = []
	for (const row of Object.values(built.file.page.controls || {})) {
		for (const control of Object.values(row || {})) {
			for (const action of collectActions(control)) generatedDefinitionIds.push(action.definitionId)
		}
	}
	for (const forbidden of [...FORBIDDEN_DEFINITIONS, ...DISRUPTIVE_DEFINITIONS]) {
		if (generatedDefinitionIds.includes(forbidden)) throw new Error(`FULL generator self-test found forbidden action ${forbidden}.`)
	}
	console.log(`SELFTEST PASS - ${built.batches.length} batches, signature ${built.signature}`)
}

async function main() {
	if (process.argv.includes('--self-test')) return selfTest()
	if (!process.argv.includes('--allow-hardware-writes')) throw new Error('REFUSED: missing explicit --allow-hardware-writes permission.')

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 COMPANION TESTBENCH v0.2 - FULL LAB')
	console.log('==================================================================')
	console.log('r9 feedback/Core page is reused. Extended actions use one generated local page.')
	console.log('Normal FULL excludes device preset, clock source, sample rate and S/PDIF mode.')
	console.log('Monitor gain 1677, Advanced Raw, firmware/reset/restore/snapshot writes remain forbidden.')
	console.log('')

	const reporter = new Reporter()
	let files = null
	let hardwarePhaseStarted = false
	try {
		const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
		const baseUrl = await findCompanion()
		const connectionsPayload = JSON.parse(await get(baseUrl, '/api/connections'))
		const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
		let exported = await exportButtons(baseUrl)
		const r9 = auditR9(exported, safePlan, connections)
		const label = String(r9.connection.label)
		line('PASS', 'r9 page audit', '42 SAFE setters + 829 feedback probes + 31 feedback definitions')
		line('PASS', 'Module version', EXPECTED_MODULE_VERSION)

		const model = await readVariable(baseUrl, label, 'device_model')
		const authorised = canonicalBool(await readVariable(baseUrl, label, 'client_authorised'))
		const status = await readVariable(baseUrl, label, 'connection_status')
		if (model !== EXPECTED_MODEL || authorised !== 'true' || !/authorised/i.test(status)) {
			throw new Error('Exact model / authorization preflight failed.')
		}
		line('PASS', 'Preflight', 'exact model + module client authorised')

		const shape = discoverShapeFromFeedbacks(r9.probes)
		if (shape.inputs.length !== 8 || shape.outputs.length !== 26 || shape.mixerSlots.length !== 24 || shape.lanes.length !== 12) {
			throw new Error(`Unexpected live shape: inputs=${shape.inputs.length}, outputs=${shape.outputs.length}, mixerSlots=${shape.mixerSlots.length}, lanes=${shape.lanes.length}.`)
		}
		line('PASS', 'Live TestBench shape', '8 inputs / 26 outputs / 24 mixer slots / 12 mix lanes')

		const mixerProbe = await readVariableOptional(baseUrl, label, 'mix_mix_a_l_slot_1_gain', 3000)
		if (!mixerProbe.exists) {
			line('PREP REQUIRED', 'Mixer variables', 'Enable "Expose all mixer slot variables" on the existing Focusrite connection, Apply, then rerun FULL.')
			reporter.add('prepare', 'exposeMixerVariables', 'PREP_REQUIRED', 'Enable mixer variables in Companion connection config; zero hardware writes.')
			files = reporter.save({ completed: false, hardwareWrites: false, reason: 'mixer-variables-disabled' })
			process.exitCode = 6
			return
		}

		line('INFO', 'Snapshot', 'capturing restorable module state before first hardware write')
		const snapshot = await captureFullSnapshot(baseUrl, label, shape)
		const destructiveBaselineCount = recordBaselineImpacts(snapshot, reporter)
		if (destructiveBaselineCount) line('INFO', 'FULL baselines', `${destructiveBaselineCount} blank states will retain safe documented baselines`)
		const testSource = await chooseTestSource(baseUrl, label, snapshot, shape)
		const built = buildExtendedPage(snapshot, testSource)
		built.testSource = testSource
		const ext = auditExtendedPage(exported, built, connections)
		if (!ext) {
			writeGeneratedExtended(built)
			line('PREP REQUIRED', 'FULL Extended page', 'generated/FULL_EXTENDED.companionconfig created locally; import it as ONE new page and remap FOCUSRITE TESTBENCH TARGET to the existing Focusrite connection.')
			line('INFO', 'Snapshot lock', `signature=${built.signature}; rerun FULL without changing Focusrite state after import`)
			reporter.add('prepare', 'extended-page', 'PREP_REQUIRED', `Generated local Extended page for snapshot signature ${built.signature}; zero hardware writes.`)
			files = reporter.save({ completed: false, hardwareWrites: false, reason: 'extended-page-import-required', signature: built.signature })
			process.exitCode = 6
			return
		}
		if (ext.connection.id !== r9.connection.id && String(ext.connection.label) !== String(r9.connection.label)) {
			throw new Error('r9 and FULL Extended pages do not resolve to the same live Focusrite connection.')
		}
		line('PASS', 'FULL Extended page', `${built.batches.length} audited batch controls / snapshot ${built.signature}`)

		const feedbackBefore = await sweepFeedbacks(baseUrl, label, r9, reporter, 'feedback-before')
		if (feedbackBefore.fail) throw new Error(`Pre-write feedback sweep has ${feedbackBefore.fail} failures; hardware phase blocked.`)

		console.log('')
		line('INFO', 'Hardware phase', 'protective Monitor Mute and output mutes will remain engaged during routing/mixer tests')
		hardwarePhaseStarted = true
		const corePre = await runCoreFull(baseUrl, label, r9, safePlan, reporter, true)
		const monitorInitial = corePre.initial['monitor-mute']
		let outputGuardEngaged = false
		let monitorGuardEngaged = false
		try {
			const monitorTest = safePlan.tests.find((item) => item.id === 'monitor-mute')
			await pressLocation(baseUrl, r9.pageNumber, safePlanSetter(safePlan, monitorTest, 'true'))
			requireChecks(await verifyMany(baseUrl, label, [boolCheck('monitor_mute', 'true')]), 'protective Monitor Mute guard')
			monitorGuardEngaged = true

			await pressBatch(baseUrl, ext.pageNumber, built, 'output-mute-on')
			const outMuteChecks = checksForBatch(snapshot, 'output-mute-on')
			requireChecks(await verifyMany(baseUrl, label, outMuteChecks, 10000), 'protective output mute guard')
			outputGuardEngaged = true
			reporter.add('protect', 'all-output-mutes', 'PASS', `${outMuteChecks.length} output mute states confirmed ON`)

			await testMonitorMuteCore(baseUrl, label, r9, safePlan, reporter, monitorInitial)
			await testSimpleExtended(baseUrl, label, ext.pageNumber, built, snapshot, reporter)
			await testPairSource(baseUrl, label, ext.pageNumber, built, snapshot, reporter)
			await testMixerSlots(baseUrl, label, ext.pageNumber, built, snapshot, reporter, testSource)
			await testMixLanes(baseUrl, label, ext.pageNumber, built, snapshot, reporter)
			await testMonitoringSettings(baseUrl, label, ext.pageNumber, built, snapshot, reporter)
		} finally {
			if (outputGuardEngaged && built.locations['output-mute-restore']) {
				await pressBatch(baseUrl, ext.pageNumber, built, 'output-mute-restore')
				const restoredMutes = checksForBatch(snapshot, 'output-mute-restore')
				const restoreResult = await verifyMany(baseUrl, label, restoredMutes, 10000)
				if (restoreResult.some((item) => !item.ok)) throw new Error('HARD ABORT: output mute restoration failed.')
				reporter.add('restore', 'all-output-mutes', 'RESTORE_PASS', `${restoredMutes.length} output mute states restored/baselined`)
			}
			if (monitorGuardEngaged) await restoreMonitorMuteCore(baseUrl, label, r9, safePlan, reporter, monitorInitial)
		}

		const feedbackAfter = await sweepFeedbacks(baseUrl, label, r9, reporter, 'feedback-after')
		await testReconnect(baseUrl, label, r9, reporter)

		for (const id of DISRUPTIVE_DEFINITIONS) reporter.add('disruptive', id, 'MANUAL_PENDING', 'Excluded from normal FULL; requires separate explicit disruptive run.')
		reporter.add('forbidden', 'monitor-gain-1677', 'BLOCKED', 'Read-only; never written.')
		reporter.add('forbidden', 'advanced_raw_set', 'BLOCKED', 'Not used by TestBench.')
		reporter.add('forbidden', 'firmware-reset-snapshot', 'BLOCKED', 'No such TestBench write path exists.')

		files = reporter.save({
			completed: true,
			hardwareWrites: true,
			signature: built.signature,
			feedbackBefore,
			feedbackAfter,
			shape: { inputs: 8, outputs: 26, mixerSlots: 24, mixLanes: 12, mixStrips: 288 },
		})
		const summary = reporter.summary()
		console.log('')
		console.log('==================================================================')
		console.log(' FULL LAB SUMMARY')
		console.log('==================================================================')
		for (const [statusName, count] of Object.entries(summary)) console.log(`${statusName.padEnd(20)} ${count}`)
		console.log(`REPORT TXT          ${path.relative(testbenchDir, files.txt)}`)
		console.log(`REPORT JSON         ${path.relative(testbenchDir, files.json)}`)
		console.log(`REPORT CSV          ${path.relative(testbenchDir, files.csv)}`)
		console.log('Disruptive actions remain MANUAL_PENDING, not silently executed.')
		console.log('')
		if ((summary.FAIL || 0) > 0 || (summary.RESTORE_FAIL || 0) > 0) process.exitCode = 2
	} catch (error) {
		line('FAIL', 'FULL TestBench', error.message)
		reporter.add('fatal', 'runner', /HARD ABORT/.test(error.message) ? 'RESTORE_FAIL' : 'FAIL', error.message)
		if (!files) files = reporter.save({ completed: false, hardwareWrites: hardwarePhaseStarted, fatal: true })
		process.exitCode = /HARD ABORT/.test(error.message) ? 4 : 2
	}
}

main().catch((error) => {
	console.error(`FATAL: ${error.message}`)
	process.exitCode = 2
})
