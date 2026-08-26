'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const baseSourcePath = path.join(root, 'testbench', 'FullTestBenchV1Release.js')
const sourcePath = path.join(root, 'testbench', 'FullTestBenchV1ReleaseV2.js')
const launcherPath = path.join(root, 'testbench', 'RUN_V1_RELEASE_SMOKE.cmd')
const rootLauncherPath = path.join(root, 'RUN_V1_RELEASE_SMOKE.bat')

function source() {
	return fs.readFileSync(sourcePath, 'utf8')
}

function baseSource() {
	return fs.readFileSync(baseSourcePath, 'utf8')
}

test('V1 release smoke V2 stays pinned to the audited 0.1.20 public write surface', () => {
	const text = source()
	const base = baseSource()
	assert.match(text, /EXPECTED_MODULE_VERSION !== '0\.1\.20'/)
	assert.match(text, /buildReleaseTests/)
	assert.match(text, /buildReleasePage/)
	assert.match(text, /V1_RELEASE_ALLOWED/)
	assert.match(text, /V1_RELEASE_WITHHELD/)
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
		assert.match(base, new RegExp(`'${action}'`))
		assert.match(text, new RegExp(`'${action}'`))
	}
})

test('V1 release smoke V2 inherits the explicit withheld/forbidden policy and has no direct Focusrite write path', () => {
	const text = source()
	const base = baseSource()
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
		assert.match(base, new RegExp(`'${action}'`))
	}
	assert.match(text, /V1_RELEASE_WITHHELD/)
	assert.doesNotMatch(text, /\.setItem\s*\(/)
	assert.doesNotMatch(text, /<set\b/i)
})

test('prepare-only refreshes verified Page 2 before runnable-family gating and never requires a hardware baseline', () => {
	const text = source()
	assert.match(text, /const prepareOnly = process\.argv\.includes\('--prepare-only'\)/)
	assert.match(text, /const tests = buildReleaseTests\(values, sources\)/)
	assert.match(text, /const built = buildReleasePage\(tests\)/)
	assert.match(text, /ensureReleasePage/)
	assert.match(text, /if \(prepareOnly\)/)
	assert.doesNotMatch(text, /no runnable .* release test in current state/i)
	assert.match(text, /ZERO hardware writes/i)
})

test('V1 release smoke V2 treats unknown baselines as safe coverage gaps instead of invented writes', () => {
	const text = source()
	assert.match(text, /pass \+ skip !== 21/)
	assert.doesNotMatch(text, /safe\.skip !== 0/)
	assert.doesNotMatch(text, /safe\.pass !== 21/)
	assert.match(text, /PARTIAL_SAFE/)
	assert.match(text, /notRunnableActionIds/)
	assert.match(text, /process\.exitCode = 5/)
	assert.match(text, /SKIP means baseline unknown, not unsupported/)
})

test('V1 release smoke V2 keeps exact restore, baseline drift and global restore hard-abort guards', () => {
	const text = source()
	assert.match(text, /readVariableOptional/)
	assert.match(text, /waitExpected/)
	assert.match(text, /waitPair/)
	assert.match(text, /exact original state was not server-confirmed after restore/i)
	assert.match(text, /Baseline drift detected before write/)
	assert.match(text, /verifyReleaseStateBaseline/)
	assert.match(text, /Global restore audit/)
	assert.match(text, /hardAbort: true/)
	assert.match(text, /process\.exitCode = 4/)
})

test('V1 release Page 2 replacement remains fail-closed and preserves Page 1, other pages and connections', () => {
	const text = source()
	assert.match(text, /Page 2 is not a verified Focusrite TestBench page/)
	assert.match(text, /Page 2 is missing/)
	assert.match(text, /hashPagesExcept/)
	assert.match(text, /sameConnectionSet/)
	assert.match(text, /buildConnectionRemap/)
	assert.match(text, /Page 1 r9 \/ module audit/)
	assert.match(text, /Page 1 preserved/)
})

test('V1 release launcher uses V2, prepares Page 2 before confirmations, then runs SAFE before release writes', () => {
	const launcher = fs.readFileSync(launcherPath, 'utf8')
	const preflight = launcher.indexOf('Focusrite_18i20_Preflight.ps1')
	const prepareOnly = launcher.indexOf('FullTestBenchV1ReleaseV2.js" --prepare-only')
	const releaseConfirm = launcher.indexOf('V1_RELEASE')
	const isolationConfirm = launcher.indexOf('ALL_ISOLATED')
	const safe = launcher.indexOf('Focusrite_18i20_SafeHardwareTest.js')
	const release = launcher.lastIndexOf('FullTestBenchV1ReleaseV2.js')
	assert.ok(preflight >= 0)
	assert.ok(prepareOnly > preflight)
	assert.ok(releaseConfirm > prepareOnly)
	assert.ok(isolationConfirm > releaseConfirm)
	assert.ok(safe > isolationConfirm)
	assert.ok(release > safe)
	assert.match(launcher, /Page 1 r9 reste intacte/)
	assert.match(launcher, /Page 2 est remplacee automatiquement/)
	assert.match(launcher, /COUVERTURE LIVE PARTIELLE/)
	assert.match(launcher, /0\.1\.20\.tgz/)
})

test('root V1 release shortcut still delegates only to the canonical release launcher', () => {
	const launcher = fs.readFileSync(rootLauncherPath, 'utf8')
	assert.match(launcher, /testbench\\RUN_V1_RELEASE_SMOKE\.cmd/i)
	assert.doesNotMatch(launcher, /allow-hardware-writes|confirm-all-output-routing-isolated/i)
})
