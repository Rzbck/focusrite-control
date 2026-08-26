'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const sourcePath = path.join(root, 'testbench', 'FullTestBenchV1Release.js')
const launcherPath = path.join(root, 'testbench', 'RUN_V1_RELEASE_SMOKE.cmd')
const rootLauncherPath = path.join(root, 'RUN_V1_RELEASE_SMOKE.bat')

function source() {
	return fs.readFileSync(sourcePath, 'utf8')
}

test('V1 release smoke is pinned to the final 0.1.20 public write surface', () => {
	const text = source()
	for (const action of [
		'monitor_preset',
		'input_mode',
		'input_mode_cycle',
		'input_nickname',
		'output_mute',
		'output_gain_set',
		'output_gain_adjust',
		'output_source',
		'output_pair_source',
		'output_nickname',
		'device_nickname',
		'phantom_persistence',
		'talkback_source',
		'reconnect',
	]) {
		assert.match(text, new RegExp(`'${action}'`))
	}
	assert.match(text, /EXPECTED_MODULE_VERSION !== '0\.1\.20'/)
	assert.match(text, /V1_RELEASE_ALLOWED/)
})

test('V1 release smoke explicitly blocks withheld and forbidden families', () => {
	const text = source()
	for (const action of [
		'monitor_alt_enable',
		'monitor_alt',
		'output_stereo',
		'mixer_slot_source',
		'mixer_slot_stereo',
		'mix_mute',
		'mix_solo',
		'mix_gain_set',
		'mix_gain_adjust',
		'mix_pan',
		'mix_talkback',
		'device_preset',
		'clock_source',
		'sample_rate',
		'spdif_mode',
		'advanced_raw_set',
		'monitor_gain_set',
		'monitor_gain_adjust',
	]) {
		assert.match(text, new RegExp(`'${action}'`))
	}
	assert.match(text, /V1_RELEASE_WITHHELD/)
	assert.match(text, /Forbidden\/non-release action/)
	assert.doesNotMatch(text, /\.setItem\s*\(/)
	assert.doesNotMatch(text, /<set\b/i)
})

test('V1 release smoke uses server-confirmed exact restore and hard-aborts on restore failure', () => {
	const text = source()
	assert.match(text, /readVariableOptional/)
	assert.match(text, /waitExpected/)
	assert.match(text, /waitPair/)
	assert.match(text, /exact original state was not server-confirmed after restore/i)
	assert.match(text, /hardAbort: true/)
	assert.match(text, /process\.exitCode = 4/)
	assert.match(text, /Baseline drift detected before write/)
	assert.match(text, /SAFE Core was not complete/)
	assert.match(text, /safe\.skip !== 0/)
	assert.match(text, /safe\.pass !== 21/)
	assert.match(text, /verifyReleaseStateBaseline/)
	assert.match(text, /Global restore audit/)
})

test('V1 release output selection follows the restrictive production evidence policy', () => {
	const text = source()
	for (const policy of [
		'PAIR_SOURCE_RIGHT_OUTPUTS',
		'WITHHELD_OUTPUT_MUTES',
		'NO_EFFECT_OUTPUT_NICKNAMES',
		'NO_EFFECT_OUTPUT_GAINS',
		'UNVALIDATED_CONFIGURATION_OUTPUTS',
		'WITHHELD_OUTPUT_GAINS',
	]) {
		assert.match(text, new RegExp(policy))
	}
	assert.match(text, /outputAvailabilityAllows/)
	assert.match(text, /outputControlAllowed/)
	assert.match(text, /baselinePairSource/)
	assert.match(text, /0\/0 baseline is unambiguous/)
	assert.match(text, /baselineValueEqual/)
	assert.doesNotMatch(text, /restorePair:/)
})

test('V1 release page replacement is fail-closed and preserves other pages and connections', () => {
	const text = source()
	assert.match(text, /Page 2 is not a verified Focusrite TestBench page/)
	assert.match(text, /Page 2 is missing/)
	assert.match(text, /hashPagesExcept/)
	assert.match(text, /sameConnectionSet/)
	assert.match(text, /buildConnectionRemap/)
	assert.match(text, /existing Focusrite connection/i)
})

test('V1 release launcher requires preflight, two explicit confirmations and SAFE before release writes', () => {
	const launcher = fs.readFileSync(launcherPath, 'utf8')
	const preflight = launcher.indexOf('Focusrite_18i20_Preflight.ps1')
	const prepareOnly = launcher.indexOf('--prepare-only')
	const releaseConfirm = launcher.indexOf('V1_RELEASE')
	const isolationConfirm = launcher.indexOf('ALL_ISOLATED')
	const safe = launcher.indexOf('Focusrite_18i20_SafeHardwareTest.js')
	const release = launcher.lastIndexOf('FullTestBenchV1Release.js')
	assert.ok(preflight >= 0)
	assert.ok(prepareOnly > preflight)
	assert.ok(releaseConfirm > prepareOnly)
	assert.ok(isolationConfirm > releaseConfirm)
	assert.ok(safe > isolationConfirm)
	assert.ok(release > safe)
	assert.match(launcher, /0\.1\.20\.tgz/)
	assert.match(launcher, /AUCUN write hardware lance/)
	assert.match(launcher, /READ-ONLY HARDWARE/)
})

test('root V1 release shortcut delegates only to the canonical release launcher', () => {
	const launcher = fs.readFileSync(rootLauncherPath, 'utf8')
	assert.match(launcher, /testbench\\RUN_V1_RELEASE_SMOKE\.cmd/i)
	assert.doesNotMatch(launcher, /allow-hardware-writes|confirm-all-output-routing-isolated/i)
})
