'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const closure = require('../testbench/MixFeedbackClosure')
const runner = require('../testbench/MixFeedbackClosureRunner')
const { filterActionDefinitions } = require('../src/definition-policy')

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

function playbackSelectionSnapshot() {
	return {
		shape: {
			lanes: [
				{ mix: 'Mix A', side: 'left' },
				{ mix: 'Mix A', side: 'right' },
			],
		},
		values: {
			mix_mix_a_l_slot_3_gain: { exists: true, value: '-12' },
			mix_mix_a_l_slot_3_mute: { exists: true, value: 'false' },
			mix_mix_a_l_slot_3_solo: { exists: true, value: 'false' },
			mix_mix_a_r_slot_3_gain: { exists: true, value: '-12' },
			mix_mix_a_r_slot_3_mute: { exists: true, value: 'false' },
			mix_mix_a_r_slot_3_solo: { exists: true, value: 'false' },
			mix_mix_a_l_slot_5_gain: { exists: true, value: '-20' },
			mix_mix_a_l_slot_5_mute: { exists: true, value: 'false' },
			mix_mix_a_l_slot_5_solo: { exists: true, value: 'false' },
		},
	}
}

function monoPlaybackWithMate() {
	return {
		slot: 7,
		raw: 'p1',
		name: 'Playback 1',
		stereoKnown: true,
		stereo: false,
		candidates: [
			{ slot: 7, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
			{ slot: 8, raw: 'p2', name: 'Playback 2', stereoKnown: true, stereo: false },
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

test('Mix closure playback selection preserves the previous exact target across runtime stereo to mono changes', () => {
	const snapshot = playbackSelectionSnapshot()
	const selected = runner.chooseMixClosurePlayback(
		[
			{ slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
			{ slot: 5, raw: 'p34', name: 'Playback 3', stereoKnown: true, stereo: true },
		],
		snapshot,
		{ slot: 3, name: 'Playback 1' },
	)
	assert.equal(selected.slot, 3)
	assert.equal(selected.stereo, false)
	assert.equal(selected.selection, 'previous-closure-target')
	assert.equal(selected.exactBaselineLanes, 2)
})

test('Mix closure playback selection uses exact materialised baseline coverage, not stereo preference', () => {
	const snapshot = playbackSelectionSnapshot()
	const selected = runner.chooseMixClosurePlayback(
		[
			{ slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
			{ slot: 5, raw: 'p34', name: 'Playback 3', stereoKnown: true, stereo: true },
		],
		snapshot,
		null,
	)
	assert.equal(selected.slot, 3)
	assert.equal(selected.stereo, false)
	assert.equal(selected.selection, 'unique-best-materialised-baseline')
})

test('Mix closure playback selection stops on an ambiguous exact target instead of guessing', () => {
	const snapshot = playbackSelectionSnapshot()
	snapshot.values.mix_mix_a_r_slot_5_gain = { exists: true, value: '-20' }
	snapshot.values.mix_mix_a_r_slot_5_mute = { exists: true, value: 'false' }
	snapshot.values.mix_mix_a_r_slot_5_solo = { exists: true, value: 'false' }
	assert.throws(
		() =>
			runner.chooseMixClosurePlayback(
				[
					{ slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
					{ slot: 5, raw: 'p34', name: 'Playback 3', stereoKnown: true, stereo: true },
				],
				snapshot,
				null,
			),
		/Ambiguous Playback target/,
	)
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
})

test('Autonomous topology plan identifies the canonical adjacent Playback mate dynamically', () => {
	const augmented = closure.augmentMixFeedbackHarness(syntheticBuilt(), stereoSnapshot(), 7)
	const playback = monoPlaybackWithMate()
	const pair = runner.findAdjacentPlaybackPair(playback)
	assert.equal(pair.left.slot, 7)
	assert.equal(pair.right.slot, 8)
	assert.equal(pair.left.name, 'Playback 1')
	assert.equal(pair.right.name, 'Playback 2')

	const before = augmented.built.batches.length
	const plan = runner.buildAutonomousTopologyPlan({
		built: augmented.built,
		playback,
		lanes: augmented.lanes,
		r9: stereoR9(),
	})
	assert.equal(plan.eligible, true)
	const added = augmented.built.batches.slice(before)
	const topologyBatches = added.filter((batch) => batch.id.startsWith('mix-topology-slots-'))
	assert.equal(topologyBatches.length, 2)
	for (const batch of topologyBatches) {
		assert.equal(batch.specs.length, 2)
		assert.deepEqual(
			batch.specs.map((spec) => spec.definitionId),
			['mixer_slot_stereo', 'mixer_slot_stereo'],
		)
		assert.deepEqual(
			batch.specs.map((spec) => Number(spec.options.slot)),
			[7, 8],
		)
		assert.ok(batch.specs.every((spec) => ['on', 'off'].includes(spec.options.state)))
	}
	assert.equal(plan.templates.length, 2)
})

test('Autonomous topology plan fails closed for missing mate, mixed topology, or starting stereo', () => {
	const augmented = closure.augmentMixFeedbackHarness(syntheticBuilt(), stereoSnapshot(), 7)
	const noMate = { ...monoPlaybackWithMate(), candidates: [monoPlaybackWithMate().candidates[0]] }
	assert.equal(
		runner.buildAutonomousTopologyPlan({ built: syntheticBuilt(), playback: noMate, lanes: augmented.lanes, r9: stereoR9() }).eligible,
		false,
	)
	const mixed = monoPlaybackWithMate()
	mixed.candidates[1].stereo = true
	assert.equal(
		runner.buildAutonomousTopologyPlan({ built: syntheticBuilt(), playback: mixed, lanes: augmented.lanes, r9: stereoR9() }).eligible,
		false,
	)
	assert.equal(
		runner.buildAutonomousTopologyPlan({
			built: syntheticBuilt(),
			playback: { ...monoPlaybackWithMate(), stereo: true },
			lanes: augmented.lanes,
			r9: stereoR9(),
		}).eligible,
		false,
	)
})

test('Autonomous topology runner is narrowly scoped and exact-restore guarded', () => {
	assert.match(runnerSource, /paired mixer_slot_stereo research actions only/)
	assert.match(runnerSource, /buildAutonomousTopologyPlan/)
	assert.match(runnerSource, /topologySourcesMatch/)
	assert.match(runnerSource, /Autonomous topology restore/)
	assert.match(runnerSource, /activeChanges\.add\(token\)/)
	assert.match(runnerSource, /prepareLiveStereoPairTargets/)
	assert.match(runnerSource, /pressBatch/)
	assert.doesNotMatch(runnerSource, /mixer_slot_source|output_pair_source|output_source|mix_gain_set|advanced_raw_set/)
	assert.doesNotMatch(runnerSource, /monitor_gain_set|monitor_gain_adjust|<set\b/i)
})

test('Research mixer-slot stereo action is hidden normally and explicit-only when mixer diagnostics are enabled', async () => {
	let calls = 0
	const state = new Map([['stereo-1', 'false']])
	const device = {
		model: 'Scarlett 18i20 (3rd Gen)',
		outputs: [],
		mixerSlots: [{ stereo: 'stereo-1' }],
	}
	const definition = {
		name: 'Mixer stereo',
		options: [
			{ id: 'slot', type: 'number' },
			{
				id: 'state',
				type: 'dropdown',
				choices: [
					{ id: 'on', label: 'On' },
					{ id: 'off', label: 'Off' },
					{ id: 'toggle', label: 'Toggle' },
				],
				default: 'toggle',
			},
		],
		callback: async () => {
			calls++
		},
	}
	const makeInstance = (enabled) => ({
		device,
		config: { exposeMixerVariables: enabled },
		client: { getValue: (id) => state.get(String(id)) },
		log() {},
	})
	let filtered = filterActionDefinitions(makeInstance(false), {
		mixer_slot_stereo: definition,
		mixer_slot_source: { ...definition },
	})
	assert.equal(filtered.mixer_slot_stereo, undefined)
	assert.equal(filtered.mixer_slot_source, undefined)

	filtered = filterActionDefinitions(makeInstance(true), {
		mixer_slot_stereo: definition,
		mixer_slot_source: { ...definition },
	})
	assert.match(filtered.mixer_slot_stereo.name, /Research\/TestBench/)
	assert.equal(filtered.mixer_slot_source, undefined)
	const states = filtered.mixer_slot_stereo.options.find((option) => option.id === 'state')
	assert.deepEqual(states.choices.map((choice) => choice.id), ['on', 'off'])
	await filtered.mixer_slot_stereo.callback({ options: { slot: 1, state: 'on' } })
	assert.equal(calls, 1)
	await filtered.mixer_slot_stereo.callback({ options: { slot: 1, state: 'toggle' } })
	assert.equal(calls, 1)
	state.delete('stereo-1')
	await filtered.mixer_slot_stereo.callback({ options: { slot: 1, state: 'off' } })
	assert.equal(calls, 1)
})

test('Stereo pair runner verifies both member variables and feedbacks and requires exact pair restore', () => {
	assert.match(runnerSource, /waitPairVariables/)
	assert.match(runnerSource, /waitPairFeedbacks/)
	assert.match(runnerSource, /transitionVariables\[side\]/)
	assert.match(runnerSource, /transitionFeedback\[side\]/)
	assert.match(runnerSource, /restoreVariables\.ok/)
	assert.match(runnerSource, /restoreFeedback\[side\]/)
	assert.match(runnerSource, /QUARANTINED_RESTORE/)
	assert.match(runnerSource, /Exact pair baseline restored/)
})

test('Mix feedback closure remains fail-closed and contains no forbidden broader write family', () => {
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
	const playbackDetection = runnerSource.indexOf('detectPlaybackSourceForMixClosure', compatibilityRefusal)
	assert.ok(prepGuard >= 0)
	assert.ok(compatibilityCall > prepGuard)
	assert.ok(compatibilityRefusal > compatibilityCall)
	assert.ok(playbackDetection > compatibilityRefusal)
	assert.match(runnerSource, /auditCompatibleStaleBasePage/)
	assert.match(runnerSource, /STALE_FOCUSRITE_TESTBENCH_HARNESS/)
	assert.match(runnerSource, /trusted V8 structure \+ exact Focusrite module\/connection; snapshot-signature drift only/)
	assert.match(runnerSource, /PREP_REQUIRED_EXIT/)
	assert.match(runnerSource, /Hardware writes: 0/)
	assert.match(runnerSource, /Page 2 mutations: 0/)
	assert.match(runnerSource, /Hardware restore required: NO/)
	assert.match(runnerSource, /No hardware-restore failure is inferred from an unexpected pre-write exception/)
	assert.match(runnerSource, /process\.exitCode = 2/)
	assert.doesNotMatch(runnerSource, /main\(\)\.catch[\s\S]{0,300}process\.exitCode = 4/)
})

test('Mix feedback Page 2 reporting is conservative from mutation attempt through verified restore', () => {
	const mutationAttempt = runnerSource.indexOf('pageTouched = true')
	const replaceAttempt = runnerSource.indexOf('replacePage2FromFile', mutationAttempt)
	const restore = runnerSource.indexOf('pageRestored = true', replaceAttempt)
	assert.ok(mutationAttempt >= 0)
	assert.ok(replaceAttempt > mutationAttempt)
	assert.ok(restore > replaceAttempt)
	assert.match(runnerSource, /page2MutationAttempted: pageTouched/)
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
