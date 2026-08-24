'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const closure = require('../testbench/MixFeedbackClosure')
const runner = require('../testbench/MixFeedbackClosureRunner')

const source = fs.readFileSync(path.join(root, 'testbench', 'MixFeedbackClosure.js'), 'utf8')
const runnerSource = fs.readFileSync(path.join(root, 'testbench', 'MixFeedbackClosureRunner.js'), 'utf8')
const launcherPath = path.join(root, 'testbench', 'RUN_MIX_FEEDBACK_CLOSURE.cmd')

function syntheticBuilt() {
	return {
		signature: 'synthetic',
		batches: [],
		locations: {},
		file: {
			page: {
				gridSize: { minColumn: 0, maxColumn: 45, minRow: 0, maxRow: 0 },
				controls: {},
			},
		},
	}
}

function stereoSnapshot({ rightMute = 'false', rightSolo = 'false' } = {}) {
	return {
		shape: {
			lanes: [
				{ mix: 'Mix A', side: 'left' },
				{ mix: 'Mix A', side: 'right' },
			],
		},
		values: {
			mix_mix_a_l_slot_7_gain: { exists: true, value: '-12' },
			mix_mix_a_l_slot_7_mute: { exists: true, value: 'false' },
			mix_mix_a_l_slot_7_solo: { exists: true, value: 'false' },
			mix_mix_a_r_slot_7_gain: { exists: true, value: '-12' },
			mix_mix_a_r_slot_7_mute: { exists: true, value: rightMute },
			mix_mix_a_r_slot_7_solo: { exists: true, value: rightSolo },
		},
	}
}

function stereoR9() {
	return {
		probes: [
			{ definitionId: 'mix_mute', options: { mix: 'Mix A', side: 'left', slot: 7 }, row: 1, column: 2 },
			{ definitionId: 'mix_mute', options: { mix: 'Mix A', side: 'right', slot: 7 }, row: 1, column: 3 },
			{ definitionId: 'mix_solo', options: { mix: 'Mix A', side: 'left', slot: 7 }, row: 2, column: 2 },
			{ definitionId: 'mix_solo', options: { mix: 'Mix A', side: 'right', slot: 7 }, row: 2, column: 3 },
		],
	}
}

test('Mix feedback harness touches only mute/solo on the runtime Playback slot and preserves exact baselines', () => {
	const built = syntheticBuilt()
	const snapshot = {
		shape: {
			lanes: [
				{ mix: 'Mix A', side: 'left' },
				{ mix: 'Mix B', side: 'right' },
			],
		},
		values: {
			mix_mix_a_l_slot_7_gain: { exists: true, value: '-12' },
			mix_mix_a_l_slot_7_mute: { exists: true, value: 'false' },
			mix_mix_a_l_slot_7_solo: { exists: true, value: 'true' },
			mix_mix_b_r_slot_7_gain: { exists: true, value: '-20' },
			mix_mix_b_r_slot_7_mute: { exists: false, value: '' },
			mix_mix_b_r_slot_7_solo: { exists: true, value: 'false' },
		},
	}

	const result = closure.augmentMixFeedbackHarness(built, snapshot, 7)
	assert.equal(result.playbackSlot, 7)
	assert.equal(result.lanes.length, 2)
	assert.equal(result.lanes[0].status, 'READY')
	assert.equal(result.lanes[0].baseline.mute, 'false')
	assert.equal(result.lanes[0].baseline.solo, 'true')
	assert.equal(result.lanes[0].alternates.mute, 'true')
	assert.equal(result.lanes[0].alternates.solo, 'false')
	assert.equal(result.lanes[1].status, 'SKIP_BASELINE_UNKNOWN')
	assert.equal(result.built.batches.length, 4)
	for (const batch of result.built.batches) {
		assert.equal(batch.specs.length, 1)
		assert.ok(['mix_mute', 'mix_solo'].includes(batch.specs[0].definitionId))
		assert.equal(Number(batch.specs[0].options.slot), 7)
	}
})

test('Mix feedback probe matching is exact for lane, side and dynamically detected slot', () => {
	const r9 = stereoR9()
	const lane = { mix: 'Mix A', side: 'left' }
	assert.equal(closure.findFeedbackProbe(r9, 'mix_mute', lane, 7).column, 2)
	assert.equal(closure.findFeedbackProbe(r9, 'mix_solo', lane, 7).row, 2)
})

test('Stereo Playback pair diagnostic emits one side=both operation per equal known mute/solo baseline', () => {
	const augmented = closure.augmentMixFeedbackHarness(syntheticBuilt(), stereoSnapshot(), 7)
	const before = augmented.built.batches.length
	const plan = runner.buildStereoPairTargets({
		built: augmented.built,
		lanes: augmented.lanes,
		r9: stereoR9(),
		playback: { slot: 7, stereo: true },
	})

	assert.equal(plan.targets.length, 2)
	assert.equal(plan.pairedKeys.has('Mix A/mute'), true)
	assert.equal(plan.pairedKeys.has('Mix A/solo'), true)
	assert.equal(augmented.built.batches.length, before + 4)

	for (const batch of augmented.built.batches.slice(before)) {
		assert.equal(batch.specs.length, 1)
		assert.ok(['mix_mute', 'mix_solo'].includes(batch.specs[0].definitionId))
		assert.equal(batch.specs[0].options.mix, 'Mix A')
		assert.equal(batch.specs[0].options.side, 'both')
		assert.equal(Number(batch.specs[0].options.slot), 7)
		assert.ok(['on', 'off'].includes(batch.specs[0].options.state))
	}

	for (const target of plan.targets) {
		assert.equal(target.left.lane.side, 'left')
		assert.equal(target.right.lane.side, 'right')
		assert.ok(target.left.variable.endsWith(`_${target.property}`))
		assert.ok(target.right.variable.endsWith(`_${target.property}`))
		assert.equal(target.left.probe.options.side, 'left')
		assert.equal(target.right.probe.options.side, 'right')
	}
})

test('Stereo pair diagnostic fails closed for mono Playback or unequal member baselines', () => {
	const mono = closure.augmentMixFeedbackHarness(syntheticBuilt(), stereoSnapshot(), 7)
	const monoPlan = runner.buildStereoPairTargets({
		built: mono.built,
		lanes: mono.lanes,
		r9: stereoR9(),
		playback: { slot: 7, stereo: false },
	})
	assert.equal(monoPlan.targets.length, 0)
	assert.equal(monoPlan.pairedKeys.size, 0)

	const mismatch = closure.augmentMixFeedbackHarness(
		syntheticBuilt(),
		stereoSnapshot({ rightMute: 'true', rightSolo: 'false' }),
		7,
	)
	const mismatchPlan = runner.buildStereoPairTargets({
		built: mismatch.built,
		lanes: mismatch.lanes,
		r9: stereoR9(),
		playback: { slot: 7, stereo: true },
	})
	assert.equal(mismatchPlan.targets.length, 1)
	assert.equal(mismatchPlan.targets[0].property, 'solo')
	assert.equal(mismatchPlan.pairedKeys.has('Mix A/mute'), false)
	assert.equal(mismatchPlan.pairedKeys.has('Mix A/solo'), true)
})

test('Stereo pair runner verifies both member variables and feedbacks and requires exact pair restore', () => {
	assert.match(runnerSource, /Stereo Playback: exact L\/R pairs with equal baselines are exercised via side=both/)
	assert.match(runnerSource, /waitPairVariables/)
	assert.match(runnerSource, /waitPairFeedbacks/)
	assert.match(runnerSource, /transitionVariables\[side\]/)
	assert.match(runnerSource, /transitionFeedback\[side\]/)
	assert.match(runnerSource, /restoreVariables\.ok/)
	assert.match(runnerSource, /restoreFeedback\[side\]/)
	assert.match(runnerSource, /QUARANTINED_RESTORE/)
	assert.match(runnerSource, /Exact pair baseline restored/)
	assert.doesNotMatch(runnerSource, /output_pair_source|output_source|mixer_slot_source|mixer_slot_stereo|mix_gain_set/)
	assert.doesNotMatch(runnerSource, /advanced_raw_set|monitor_gain_set|monitor_gain_adjust|<set\b/i)
})

test('Mix feedback closure is fail-closed and contains no forbidden or broader write family', () => {
	assert.match(source, /detectPlaybackSource/)
	assert.match(source, /playbackSlotBaseline/)
	assert.match(source, /SKIP_BASELINE_UNKNOWN/)
	assert.match(source, /QUARANTINED_RESTORE/)
	assert.match(source, /replacePage2FromFile/)
	assert.match(source, /readFeedbackMarkerPassive/)
	assert.match(source, /return readFeedbackMarker\(baseUrl, pageNumber, probe\)/)
	assert.match(source, /feedback cells are audited to contain no actions/)
	assert.match(source, /Hardware restore confirme/)
	assert.doesNotMatch(source, /output_pair_source|output_source|mixer_slot_source|mixer_slot_stereo|mix_gain_set/)
	assert.doesNotMatch(source, /advanced_raw_set|monitor_gain_set|monitor_gain_adjust/)
	assert.doesNotMatch(source, /device-subscribe|client-details|<set\b/i)
	assert.doesNotMatch(source, /playbackSlot\s*=\s*3|slot\s*=\s*3/)
})

test('Fail-safe Mix runner audits compatible snapshot drift before playback detection and keeps prep separate from restore failure', () => {
	const prepGuard = runnerSource.indexOf('if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2)')
	const compatibilityCall = runnerSource.indexOf('acceptCompatibleSnapshotDrift(ctx)', prepGuard)
	const compatibilityRefusal = runnerSource.indexOf('if (!compatibleExt)', compatibilityCall)
	const playbackDetection = runnerSource.indexOf('detectPlaybackSource', compatibilityRefusal)
	assert.ok(prepGuard >= 0)
	assert.ok(compatibilityCall > prepGuard)
	assert.ok(compatibilityRefusal > compatibilityCall)
	assert.ok(playbackDetection > compatibilityRefusal)
	assert.match(runnerSource, /auditCompatibleStaleBasePage/)
	assert.match(runnerSource, /STALE_FOCUSRITE_TESTBENCH_HARNESS/)
	assert.match(
		runnerSource,
		/trusted V8 structure \+ exact Focusrite module\/connection; snapshot-signature drift only/,
	)
	assert.match(runnerSource, /PREP_REQUIRED_EXIT/)
	assert.match(runnerSource, /Hardware writes: 0/)
	assert.match(runnerSource, /Page 2 mutations: 0/)
	assert.match(runnerSource, /Hardware restore required: NO/)
	assert.match(runnerSource, /No hardware-restore failure is inferred from an unexpected pre-write exception/)
	assert.match(runnerSource, /process\.exitCode = 2/)
	assert.doesNotMatch(runnerSource, /main\(\)\.catch[\s\S]{0,300}process\.exitCode = 4/)
})

test('Mix feedback no-runnable path reports a known feedback mismatch as FAIL before NO-OP SAFE', () => {
	const noRunnable = source.indexOf('if (!prepared.runnable.length)')
	const failBranch = source.indexOf('if (payload.fail > 0)', noRunnable)
	const failExit = source.indexOf('process.exitCode = 2', failBranch)
	const noOpText = source.indexOf('MIX FEEDBACK NO-OP SAFE', noRunnable)
	const noOpExit = source.indexOf('process.exitCode = NO_ACTIONABLE_EXIT', noRunnable)

	assert.ok(noRunnable >= 0)
	assert.ok(failBranch > noRunnable)
	assert.ok(failExit > failBranch)
	assert.ok(noOpText > failExit)
	assert.ok(noOpExit > noOpText)
})

test('Mix feedback Page 2 reporting is conservative from mutation attempt through verified restore', () => {
	assert.match(source, /page2MutationAttempted: pageTouched/)
	const mutationAttempt = source.indexOf('pageTouched = true')
	const replaceAttempt = source.indexOf('const ext = await replacePage2FromFile', mutationAttempt)
	const restore = source.indexOf('pageRestored = true', replaceAttempt)
	assert.ok(mutationAttempt >= 0)
	assert.ok(replaceAttempt > mutationAttempt)
	assert.ok(restore > replaceAttempt)
})

test('Mix feedback launcher self-checks before preflight and gates hardware behind explicit confirmations', () => {
	assert.ok(fs.existsSync(launcherPath), 'launcher must exist')
	const launcher = fs.readFileSync(launcherPath, 'utf8')
	const selfCheck = launcher.indexOf('[0/3] AUTOCONTROLE LOGICIEL CIBLE')
	const preflight = launcher.indexOf('call :RUN_PREFLIGHT', selfCheck)
	const prepCheck = launcher.indexOf('call :RUN_PREP_CHECK', preflight)
	const scopeConfirm = launcher.indexOf('set /p "CONFIRM_SCOPE=', prepCheck)
	const isolationConfirm = launcher.indexOf('set /p "CONFIRM_ISOLATION=', prepCheck)
	const hardwareInvocation = launcher.indexOf(
		'MixFeedbackClosureRunner.js" --allow-mix-feedback-writes --confirm-all-output-routing-isolated',
	)

	assert.ok(selfCheck >= 0)
	assert.ok(preflight > selfCheck)
	assert.ok(prepCheck > preflight)
	assert.ok(scopeConfirm > prepCheck)
	assert.ok(isolationConfirm > prepCheck)
	assert.ok(hardwareInvocation > scopeConfirm)
	assert.ok(hardwareInvocation > isolationConfirm)
	assert.match(launcher, /Companion Scarlett 18i20/)
	assert.match(launcher, /Aucun client TCP direct supplementaire/)
	assert.match(launcher, /Aucun package Companion/)
	assert.doesNotMatch(launcher, /Focusrite_18i20_FullTestBench\.js/)
})
