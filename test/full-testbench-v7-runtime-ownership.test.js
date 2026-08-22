const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const ownership = require('../testbench/FullTestBenchOwnershipV7')
const feedbackV7 = require('../testbench/FullTestBenchFeedbackV7')
const { rowUpdater } = require('../testbench/FullTestBenchV4Common')
const runner = require('../testbench/FullTestBenchRunnerV4')

test('V7 derives right-member ownership only from restored runtime topology evidence', () => {
	const map = ownership.derivePairOwnership([
		{
			left: 1,
			right: 2,
			routeOutcome: 'REQUESTED_ORIGINAL',
			noneOutcome: 'ZERO_ORIGINAL',
			restored: true,
		},
		{
			left: 3,
			right: 4,
			routeOutcome: 'REQUESTED_REQUESTED',
			noneOutcome: 'ZERO_ZERO',
			restored: true,
		},
		{
			left: 5,
			right: 6,
			routeOutcome: 'REQUESTED_ORIGINAL',
			noneOutcome: 'ZERO_ORIGINAL',
			restored: false,
		},
	])

	assert.equal(map.get(0)?.role, 'pair-owner-left')
	assert.equal(map.get(1)?.role, 'pair-owned-right')
	assert.equal(ownership.isPairOwnedRight(map, 1), true)
	assert.equal(map.has(2), false)
	assert.equal(map.has(3), false)
	assert.equal(map.has(4), false)
	assert.equal(map.has(5), false)
})

test('V7 quarantine status cannot be overwritten by a later PASS or FAIL row update', () => {
	const inventory = { rows: [{ id: 'x', status: 'DISCOVERED', detail: '' }] }
	const reporter = {
		rows: [],
		add(...args) {
			this.rows.push(args)
		},
	}
	const update = rowUpdater(inventory, reporter)

	update('x', 'QUARANTINED_RESTORE', 'restore failed')
	update('x', 'PASS', 'later transition passed')
	assert.equal(inventory.rows[0].status, 'QUARANTINED_RESTORE')
	assert.equal(inventory.rows[0].detail, 'restore failed')
})

test('V7 output logic uses runtime pair ownership and not mute alias as source/stereo ownership oracle', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchOutputsV4.js'), 'utf8')

	assert.match(source, /isPairOwnedRight/)
	assert.match(source, /Runtime pair topology proved this right-member source is pair-owned/)
	assert.match(source, /direct right-member stereo writes are intentionally skipped/)
	assert.doesNotMatch(source, /aliasFollower/)
})

test('V7 pair safety does not retry an impossible both-member None guard after runtime ownership proof', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchPairSafetyV5.js'), 'utf8')

	assert.match(source, /isPairOwnedRight/)
	assert.match(source, /a false both-member None guard is not retried/)
})

test('V7 physical isolation unlocks reversible families but restore failures hard-abort', () => {
	const campaign = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js'), 'utf8')
	const common = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchV4Common.js'), 'utf8')
	const mixer = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchMixerV4.js'), 'utf8')

	assert.match(campaign, /signalTestsAllowed = globalSafety \|\| physicalIsolationConfirmed/)
	assert.match(campaign, /hardAbortOnRestoreFailure = physicalIsolationConfirmed/)
	assert.match(common, /RESTORE FAILED:/)
	assert.match(mixer, /signalTestsAllowed/)
	assert.match(mixer, /RESTORE FAILED:/)
})

test('V7 restores temporary Source=None guards under physical isolation instead of quarantining them pre-emptively', () => {
	const campaign = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js'), 'utf8')

	assert.match(campaign, /if \(!physicalIsolationConfirmed\) \{[\s\S]*Source=None retained/)
	assert.match(campaign, /Restore temporary individual Source=None guards/)
	assert.match(campaign, /restoreSourceSafety\(\{[\s\S]*hardAbortOnRestoreFailure/)
})

test('V7 feedback validation keeps static, dynamic and phased manual meter evidence separate', () => {
	const feedback = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchFeedbackV7.js'), 'utf8')
	const report = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchReportV4.js'), 'utf8')

	assert.match(feedback, /createTransitionFeedbackObserver/)
	assert.match(feedback, /SILENT/)
	assert.match(feedback, /SIGNAL/)
	assert.match(feedback, /observeMeterDynamicsV7/)
	assert.match(feedback, /mapLimit\(unique, 8/)
	assert.match(report, /feedbackDynamic/)
	assert.match(report, /physicalIsolationConfirmed/)
	assert.equal(feedbackV7.DYNAMIC_DEFINITIONS.has('mix_mute'), true)
	assert.equal(feedbackV7.DYNAMIC_DEFINITIONS.has('mix_solo'), true)
	assert.equal(feedbackV7.DYNAMIC_DEFINITIONS.has('connected'), false)
	assert.equal(feedbackV7.DYNAMIC_DEFINITIONS.has('clock_locked'), false)
})

test('V7 remains read-only for Monitor gain and adds no direct Focusrite write path', () => {
	const files = [
		'FullTestBenchOwnershipV7.js',
		'FullTestBenchFeedbackV7.js',
		'FullTestBenchRunnerV4Campaign.js',
	]
	const source = files
		.map((name) => fs.readFileSync(path.join(root, 'testbench', name), 'utf8'))
		.join('\n')

	assert.doesNotMatch(source, /\.setItem\s*\(/)
	assert.doesNotMatch(source, /monitor_gain_set|monitor_gain_adjust|advanced_raw_set/)
})

test('current FULL revision is V7 and the launcher describes SILENT/SIGNAL manual phases', () => {
	assert.equal(runner.FULL_CAMPAIGN_REVISION, 'full-v7-runtime-ownership-isolated-feedback-20260822')
	const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_SAFE_HARDWARE_TESTS.cmd'), 'utf8')
	assert.match(launcher, /FULL V7/)
	assert.match(launcher, /ALL_ISOLATED/)
	assert.match(launcher, /SILENT/)
	assert.match(launcher, /SIGNAL/)
})
