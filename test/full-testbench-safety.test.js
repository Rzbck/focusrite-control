const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const runnerPath = path.join(root, 'testbench', 'Focusrite_18i20_FullTestBench.js')
const runnerParts = [
	runnerPath,
	path.join(root, 'testbench', 'FullTestBenchBase.js'),
	path.join(root, 'testbench', 'FullTestBenchAudit.js'),
	path.join(root, 'testbench', 'FullTestBenchBuild.js'),
	path.join(root, 'testbench', 'FullTestBenchPage.js'),
	path.join(root, 'testbench', 'FullTestBenchCorePhases.js'),
	path.join(root, 'testbench', 'FullTestBenchExtendedPhases.js'),
	path.join(root, 'testbench', 'FullTestBenchPageV2.js'),
	path.join(root, 'testbench', 'FullTestBenchPhasesV2.js'),
	path.join(root, 'testbench', 'FullTestBenchGuardV2.js'),
	path.join(root, 'testbench', 'FullTestBenchRunnerV2.js'),
	path.join(root, 'testbench', 'FullTestBenchOutputAvailability.js'),
	path.join(root, 'testbench', 'FullTestBenchGuardV3.js'),
	path.join(root, 'testbench', 'FullTestBenchRunnerV3.js'),
	path.join(root, 'testbench', 'FullTestBenchV4Common.js'),
	path.join(root, 'testbench', 'FullTestBenchCoreV4.js'),
	path.join(root, 'testbench', 'FullTestBenchOutputsV4.js'),
	path.join(root, 'testbench', 'FullTestBenchPairsV4.js'),
	path.join(root, 'testbench', 'FullTestBenchPairSafetyV5.js'),
	path.join(root, 'testbench', 'FullTestBenchMixerV4.js'),
	path.join(root, 'testbench', 'FullTestBenchMonitorV4.js'),
	path.join(root, 'testbench', 'FullTestBenchRunnerV4.js'),
	path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js'),
	path.join(root, 'testbench', 'FullTestBenchTopologyV6.js'),
	path.join(root, 'testbench', 'FullTestBenchFeedbackV6.js'),
	path.join(root, 'testbench', 'FullTestBenchInventoryV6.js'),
	path.join(root, 'testbench', 'FullTestBenchOwnershipV7.js'),
	path.join(root, 'testbench', 'FullTestBenchFeedbackV7.js'),
	path.join(root, 'testbench', 'FullTestBenchResumeV7.js'),
	path.join(root, 'testbench', 'FullTestBenchCompanionImportV7.js'),
]
const launcherPath = path.join(root, 'testbench', 'RUN_SAFE_HARDWARE_TESTS.cmd')
const runner = runnerParts.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
const launcher = fs.readFileSync(launcherPath, 'utf8')
const gitattributes = fs.readFileSync(path.join(root, '.gitattributes'), 'utf8')

const { collectFeedbacks } = require('../testbench/FullTestBenchBase')

function literal(value) {
	return { isExpression: false, value }
}

function probeFeedback(isInverted, marker) {
	return {
		type: 'feedback',
		definitionId: 'input_air',
		connectionId: 'focusrite-test',
		options: { input: literal('0') },
		isInverted: literal(isInverted),
		styleOverrides: [{ elementProperty: 'text', override: literal(`IN01 AIR\n${marker}`) }],
	}
}

test('FULL r9 feedback collector collapses the T/F normal-inverted pair into one logical probe', () => {
	const page = {
		controls: {
			0: {
				8: {
					feedbacks: [probeFeedback(false, 'T'), probeFeedback(true, 'F')],
					steps: {},
				},
			},
		},
	}
	const probes = collectFeedbacks(page)
	assert.equal(probes.length, 1)
	assert.deepEqual(probes[0], {
		row: 0,
		column: 8,
		definitionId: 'input_air',
		connectionId: 'focusrite-test',
		options: { input: '0' },
	})
})

test('FULL r9 feedback collector rejects a malformed normal-inverted pair', () => {
	const bad = probeFeedback(true, 'F')
	bad.options = { input: literal('1') }
	const page = {
		controls: {
			0: {
				8: { feedbacks: [probeFeedback(false, 'T'), bad], steps: {} },
			},
		},
	}
	assert.throws(() => collectFeedbacks(page), /pair mismatch/)
})

test('FULL TestBench reuses r9 and covers the intended live matrix', () => {
	assert.match(runner, /R9_PAGE_NAME/)
	assert.match(runner, /829/)
	assert.match(runner, /31/)
	assert.match(runner, /inputs\.length !== 8/)
	assert.match(runner, /outputs\.length !== 26/)
	assert.match(runner, /mixerSlots\.length !== 24/)
	assert.match(runner, /lanes\.length !== 12/)
	assert.match(runner, /mixStrips: 288/)
	assert.match(runner, /Device-wide output-pair topology sweep/)
	assert.match(runner, /Manual feedback dynamics/)
	assert.match(runner, /derivePairOwnership/)
	assert.match(runner, /createTransitionFeedbackObserver/)
})

test('FULL generated Extended surface contains only approved reversible definitions', () => {
	assert.match(runner, /const EXTENDED_ALLOWED = new Set/)
	assert.match(runner, /const DISRUPTIVE_DEFINITIONS = new Set/)
	assert.match(runner, /const FORBIDDEN_DEFINITIONS = new Set/)
	assert.match(runner, /Generator refused unsafe action/)
	assert.match(runner, /device_preset/)
	assert.match(runner, /clock_source/)
	assert.match(runner, /sample_rate/)
	assert.match(runner, /spdif_mode/)
	assert.match(runner, /advanced_raw_set/)
	assert.match(runner, /monitor_gain_set/)
	assert.match(runner, /monitor_gain_adjust/)
})

test('FULL runner never writes Focusrite protocol directly and keeps local privacy boundaries', () => {
	assert.doesNotMatch(runner, /\.setItem\s*\(/)
	assert.doesNotMatch(runner, /<set\b/i)
	assert.doesNotMatch(runner, /device_serial|client_control_id|server_port|client[_-]?key/i)
	assert.match(runner, /\/api\/location\//)
	assert.match(runner, /includeSecrets=false/)
	assert.match(runner, /connections=false/)
	assert.match(runner, /testbench.*generated|generatedDir/)
})

test('FULL runner requires explicit permission and protects restoration paths', () => {
	assert.match(runner, /--allow-hardware-writes/)
	assert.match(runner, /--confirm-all-output-routing-isolated/)
	assert.match(runner, /TOPOLOGY RESTORE FAILED/)
	assert.match(runner, /RESTORE FAILED/)
	assert.match(runner, /HARD ABORT/)
	assert.match(runner, /RESTORE_FAIL/)
	assert.match(runner, /output-mute-on/)
	assert.match(runner, /monitor_mute/)
	assert.match(runner, /BASELINE_DESTRUCTIVE/)
	assert.match(runner, /OUTPUT_PAIR_LEFT_INDICES/)
	assert.match(runner, /SKIP_UNAVAILABLE/)
	assert.match(runner, /output-availability/)
})

test('FULL generator self-test passes without Companion or hardware on the pair-aware harness revision', () => {
	const result = spawnSync(process.execPath, [runnerPath, '--self-test'], {
		cwd: root,
		encoding: 'utf8',
		timeout: 30000,
	})
	assert.equal(result.status, 0, result.stderr || result.stdout)
	assert.match(result.stdout, /SELFTEST PASS/)
	assert.match(result.stdout, /V5 batches/)
	assert.match(result.stdout, /full-v5-pair-aware-safety/)
})

test('Windows batch launchers are checked out with CRLF line endings', () => {
	assert.match(gitattributes, /^\*\.bat text eol=crlf$/m)
	assert.match(gitattributes, /^\*\.cmd text eol=crlf$/m)
})

test('the TestBench launcher exposes SAFE/FULL/RESUME and gates hardware plus Page 2 automation', () => {
	assert.match(launcher, /Tape SAFE, FULL ou RESUME/)
	assert.match(launcher, /Focusrite_18i20_SafeHardwareTest\.js/)
	assert.match(launcher, /Focusrite_18i20_FullTestBench\.js/)
	assert.match(launcher, /FULL V7/)
	assert.match(launcher, /Tape ALL_ISOLATED/)
	assert.match(launcher, /--confirm-all-output-routing-isolated/)
	assert.match(launcher, /--manual-feedback/)
	assert.match(launcher, /--diagnostic-resume=auto/)
	assert.match(launcher, /PAGE2_AUTO/)
	assert.match(launcher, /FullTestBenchCompanionImportV7\.js/)
	assert.match(launcher, /SILENT/)
	assert.match(launcher, /SIGNAL/)
	assert.doesNotMatch(launcher, /PAIR34|FullTestBenchPair34ProbeV6|confirm-output-3-4/i)
	assert.match(launcher, /PREPARATION REQUISE/)
	assert.match(launcher, /Exit code: %EXITCODE%/)
	assert.match(launcher, /PublishLatestShareable\.js/)
	assert.match(launcher, /Aucun publisher n'est lance pour RESUME/)
})
