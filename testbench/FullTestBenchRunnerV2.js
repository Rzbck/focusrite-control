const fs = require('node:fs')
const path = require('node:path')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE_VERSION,
	DISRUPTIVE_DEFINITIONS,
	testbenchDir,
	safePlanPath,
	line,
	canonicalBool,
	findCompanion,
	get,
	readVariable,
	readVariableOptional,
	exportButtons,
	collectActions,
} = require('./FullTestBenchBase')
const {
	auditR9,
	discoverShapeFromFeedbacks,
	captureFullSnapshot,
	sweepFeedbacks,
	laneBase,
} = require('./FullTestBenchAudit')
const { Reporter, recordBaselineImpacts } = require('./FullTestBenchCorePhases')
const { testReconnect } = require('./FullTestBenchExtendedPhases')
const {
	GENERATOR_REVISION,
	chooseTestSourcesV2,
	buildExtendedPageV2,
	writeGeneratedExtendedV2,
	auditExtendedPageV2,
} = require('./FullTestBenchPageV2')
const {
	captureCoreInitialV2,
	runCoreFullV2,
	engageMonitorMuteGuardV2,
	testOutputMutesIndividuallyV2,
	testExtendedV2,
	testMonitorMuteCoreV2,
	restoreOutputMutesV2,
	restoreMonitorMuteV2,
} = require('./FullTestBenchPhasesV2')
const { engageOutputMuteGuardV2Safe } = require('./FullTestBenchGuardV2')

async function selfTestV2() {
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
		for (const [key, val] of Object.entries({ mute: '', source: '', stereo: '', nickname: '', gain: '' })) {
			values[`output_${o + 1}_${key}`] = { exists: true, value: val }
		}
	}
	for (const s of shape.mixerSlots) {
		values[`mixer_slot_${s}_source`] = { exists: true, value: '' }
		values[`mixer_slot_${s}_stereo`] = { exists: true, value: '' }
	}
	for (const lane of shape.lanes) {
		const base = laneBase(lane)
		values[`${base}_talkback`] = { exists: true, value: '' }
		for (let slot = 1; slot <= 24; slot++) {
			for (const key of ['gain', 'pan', 'mute', 'solo']) values[`${base}_slot_${slot}_${key}`] = { exists: true, value: '' }
		}
	}
	Object.assign(values, {
		device_nickname: { exists: true, value: '' },
		monitor_altEnable: { exists: true, value: '' },
		monitor_alt: { exists: true, value: '' },
		monitor_preset: { exists: true, value: '' },
		device_phantomPersistence: { exists: true, value: '' },
		device_talkbackInputSource: { exists: true, value: '' },
	})
	const built = buildExtendedPageV2({ shape, values }, { primary: '100', secondary: '101' })
	for (const id of [
		'output-mute-on',
		'v2-output-mute-off-all',
		'v2-output-1-mute-off',
		'v2-output-source-test',
		'v2-output-gain-prime',
		'v2-mixer-source-alt',
		'v2-mixa-l-gain-prime',
		'v2-monitor-preset-baseline',
		'v2-talkback-source-alt',
	]) {
		if (!built.locations[id]) throw new Error(`V2 self-test missing required recovery batch ${id}.`)
	}
	const generatedDefinitionIds = []
	for (const row of Object.values(built.file.page.controls || {})) {
		for (const control of Object.values(row || {})) {
			for (const action of collectActions(control)) generatedDefinitionIds.push(action.definitionId)
		}
	}
	if (generatedDefinitionIds.includes('advanced_raw_set') || generatedDefinitionIds.includes('monitor_gain_set')) {
		throw new Error('V2 self-test generated a forbidden action.')
	}
	console.log(`SELFTEST PASS - ${built.batches.length} batches, revision ${GENERATOR_REVISION}, signature ${built.signature}`)
}

async function mainV2() {
	if (process.argv.includes('--self-test')) return selfTestV2()
	if (!process.argv.includes('--allow-hardware-writes')) throw new Error('REFUSED: missing explicit --allow-hardware-writes permission.')

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 COMPANION TESTBENCH v0.2.1 - FULL LAB')
	console.log('==================================================================')
	console.log('No-op recovery revision: unknown state is never guessed from a silent same-value write.')
	console.log('Protective Monitor Mute is confirmed before output/routing/mixer phases.')
	console.log('Normal FULL still excludes device preset, clock source, sample rate and S/PDIF mode.')
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
			files = reporter.save({ completed: false, hardwareWrites: false, reason: 'mixer-variables-disabled', generatorRevision: GENERATOR_REVISION })
			process.exitCode = 6
			return
		}

		line('INFO', 'Snapshot', 'capturing restorable module state before first hardware write')
		const snapshot = await captureFullSnapshot(baseUrl, label, shape)
		const destructiveBaselineCount = recordBaselineImpacts(snapshot, reporter)
		if (destructiveBaselineCount) line('INFO', 'FULL baselines', `${destructiveBaselineCount} blank states will retain safe documented baselines`)
		const testSources = await chooseTestSourcesV2(baseUrl, label, snapshot, shape)
		const built = buildExtendedPageV2(snapshot, testSources)
		const ext = auditExtendedPageV2(exported, built, connections)
		if (!ext) {
			writeGeneratedExtendedV2(built)
			line('PREP REQUIRED', 'FULL Extended page v2', 'generated/FULL_EXTENDED.companionconfig regenerated for no-op recovery; delete/replace the old FULL EXT page, import as ONE page, and remap FOCUSRITE TESTBENCH TARGET to the existing Focusrite connection.')
			line('INFO', 'Snapshot lock', `revision=${GENERATOR_REVISION}; signature=${built.signature}; rerun FULL without changing Focusrite state after import`)
			reporter.add('prepare', 'extended-page-v2', 'PREP_REQUIRED', `Generated no-op-recovery Extended page for signature ${built.signature}; zero hardware writes.`)
			files = reporter.save({ completed: false, hardwareWrites: false, reason: 'extended-page-v2-import-required', signature: built.signature, generatorRevision: GENERATOR_REVISION })
			process.exitCode = 6
			return
		}
		if (ext.connection.id !== r9.connection.id && String(ext.connection.label) !== String(r9.connection.label)) {
			throw new Error('r9 and FULL Extended pages do not resolve to the same live Focusrite connection.')
		}
		line('PASS', 'FULL Extended page', `${built.batches.length} audited batch controls / revision ${GENERATOR_REVISION} / snapshot ${built.signature}`)

		const feedbackBefore = await sweepFeedbacks(baseUrl, label, r9, reporter, 'feedback-before')
		if (feedbackBefore.fail) throw new Error(`Pre-write feedback sweep has ${feedbackBefore.fail} failures; hardware phase blocked.`)

		const coreInitial = await captureCoreInitialV2(baseUrl, label, safePlan)
		console.log('')
		line('INFO', 'Hardware phase', 'Monitor Mute guard first, then output mutes, then Core/routing/mixer tests')
		hardwarePhaseStarted = true
		let monitorGuardEngaged = false
		let outputGuardEngaged = false
		let hardwareError = null
		try {
			await engageMonitorMuteGuardV2(baseUrl, label, r9, safePlan, coreInitial['monitor-mute'], reporter)
			monitorGuardEngaged = true
			await engageOutputMuteGuardV2Safe(baseUrl, label, ext.pageNumber, built, snapshot, reporter)
			outputGuardEngaged = true

			await runCoreFullV2(baseUrl, label, r9, safePlan, coreInitial, reporter)
			await testMonitorMuteCoreV2(baseUrl, label, r9, safePlan, reporter)
			await testOutputMutesIndividuallyV2(baseUrl, label, ext.pageNumber, built, snapshot, reporter)
			await testExtendedV2(baseUrl, label, ext.pageNumber, built, snapshot, reporter, testSources)
		} catch (error) {
			hardwareError = error
			throw error
		} finally {
			const hardAbort = Boolean(hardwareError && /HARD ABORT/.test(hardwareError.message))
			if (hardAbort) {
				if (outputGuardEngaged) reporter.add('protect', 'all-output-mutes', 'BASELINE_RETAINED', 'HARD ABORT: protective output mutes intentionally retained ON.')
				if (monitorGuardEngaged) reporter.add('protect', 'monitor-mute', 'BASELINE_RETAINED', 'HARD ABORT: protective Monitor Mute intentionally retained ON.')
			} else {
				if (outputGuardEngaged) await restoreOutputMutesV2(baseUrl, label, ext.pageNumber, built, snapshot, reporter)
				if (monitorGuardEngaged) await restoreMonitorMuteV2(baseUrl, label, r9, safePlan, coreInitial['monitor-mute'], reporter)
			}
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
			generatorRevision: GENERATOR_REVISION,
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
		if (!files) files = reporter.save({ completed: false, hardwareWrites: hardwarePhaseStarted, fatal: true, generatorRevision: GENERATOR_REVISION })
		process.exitCode = /HARD ABORT/.test(error.message) ? 4 : 2
	}
}

module.exports = { mainV2, selfTestV2 }
