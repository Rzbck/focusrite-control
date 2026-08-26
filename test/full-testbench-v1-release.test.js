'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const baseSourcePath = path.join(root, 'testbench', 'FullTestBenchV1Release.js')
const v2SourcePath = path.join(root, 'testbench', 'FullTestBenchV1ReleaseV2.js')
const sourcePath = path.join(root, 'testbench', 'FullTestBenchV1ReleaseV3.js')
const launcherPath = path.join(root, 'testbench', 'RUN_V1_RELEASE_SMOKE.cmd')
const rootLauncherPath = path.join(root, 'RUN_V1_RELEASE_SMOKE.bat')

function source() {
	return fs.readFileSync(sourcePath, 'utf8')
}

function baseSource() {
	return fs.readFileSync(baseSourcePath, 'utf8')
}

function v2Source() {
	return fs.readFileSync(v2SourcePath, 'utf8')
}

test('V1 release smoke V3 stays pinned to the audited 0.1.20 public write surface', () => {
	const text = source()
	const base = baseSource()
	assert.match(text, /EXPECTED_MODULE_VERSION !== '0\.1\.20'/)
	assert.match(text, /buildReleaseTestsV3/)
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

test('V1 release smoke V3 inherits withheld policy and contains no direct Focusrite protocol write path', () => {
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

test('V1 release smoke V3 accepts the live configuration and waits for a stable baseline', () => {
	const text = source()
	assert.match(text, /captureStableReleaseState/)
	assert.match(text, /current configuration accepted as baseline/i)
	assert.match(text, /live release state did not stabilise/i)
	assert.match(text, /No fixed routing\/preset baseline is assumed/)
	assert.match(text, /prepareOnly/)
})

test('V1 release smoke V3 restores a direct stereo pair through the public pair action', () => {
	const text = source()
	assert.match(text, /addDirectPairRestoreTests/)
	assert.match(text, /stereoSourcePairs/)
	assert.match(text, /String\(pair\.left\.id\) === String\(leftCurrent\)/)
	assert.match(text, /String\(pair\.right\.id\) === String\(rightCurrent\)/)
	assert.match(text, /definitionId: 'output_pair_source'/)
	assert.match(text, /source: baselinePair\.left\.id/)
})

test('V1 release smoke V3 can discover Talkback names independently of routing source ids', () => {
	const text = source()
	assert.match(text, /captureSourceCatalog/)
	assert.match(text, /sourceNames\.add\(sourceName\)/)
	assert.match(text, /if \(rawId && rawId !== '0'\)/)
	assert.match(text, /addTalkbackSourceTest/)
	assert.match(text, /TALKBACK_SOURCE_CANDIDATES/)
})

test('V1 release smoke V3 runs monitor preset last and audits collateral state after every attempted write', () => {
	const text = source()
	assert.match(text, /if \(test\.change\.definitionId === 'monitor_preset'\) return 100/)
	assert.match(text, /const preTestBaseline = await captureReleaseState/)
	assert.match(text, /verifyKnownBaseline/)
	assert.match(text, /COLLATERAL_DRIFT/)
	assert.match(text, /PREWRITE_DRIFT/)
	assert.match(text, /RESTORE_FAILURE/)
	assert.match(text, /NO_TRANSITION/)
	assert.match(text, /process\.exitCode = 4/)
})

test('V1 release smoke V3 reports reconnect NOT_RUN after a safety abort instead of inventing a reconnect failure', () => {
	const text = source()
	assert.match(text, /let reconnectStatus = 'NOT_RUN'/)
	assert.match(text, /if \(!hardAbort\)/)
	assert.match(text, /reconnect: reconnectStatus/)
	assert.match(text, /hardAbortClass/)
})

test('V1 release Page 2 replacement remains fail-closed and preserves Page 1, other pages and connections', () => {
	const text = source()
	const v2 = v2Source()
	assert.match(text, /ensureReleasePage/)
	assert.match(v2, /Page 2 is not a verified Focusrite TestBench page/)
	assert.match(v2, /Page 2 is missing/)
	assert.match(v2, /hashPagesExcept/)
	assert.match(v2, /sameConnectionSet/)
	assert.match(text, /Page 1 r9 \/ module audit/)
	assert.match(text, /Page 1 preserved/)
})

test('V1 release launcher uses V3, keeps the current Focusrite configuration and gates hardware after Page 2 preparation', () => {
	const launcher = fs.readFileSync(launcherPath, 'utf8')
	const preflight = launcher.indexOf('Focusrite_18i20_Preflight.ps1')
	const prepareOnly = launcher.indexOf('FullTestBenchV1ReleaseV3.js" --prepare-only')
	const releaseConfirm = launcher.indexOf('V1_RELEASE')
	const isolationConfirm = launcher.indexOf('ALL_ISOLATED')
	const safe = launcher.indexOf('Focusrite_18i20_SafeHardwareTest.js')
	const release = launcher.lastIndexOf('FullTestBenchV1ReleaseV3.js')
	assert.ok(preflight >= 0)
	assert.ok(prepareOnly > preflight)
	assert.ok(releaseConfirm > prepareOnly)
	assert.ok(isolationConfirm > releaseConfirm)
	assert.ok(safe > isolationConfirm)
	assert.ok(release > safe)
	assert.match(launcher, /Page 1 r9 reste intacte/)
	assert.match(launcher, /Page 2 est remplacee automatiquement/)
	assert.match(launcher, /laisse TA CONFIGURATION ACTUELLE telle quelle/)
	assert.doesNotMatch(launcher, /restaure ta configuration Focusrite normale/i)
	assert.match(launcher, /GARDE DE SECURITE BASELINE\/RESTAURATION\/COLLATERAL/)
	assert.match(launcher, /0\.1\.20\.tgz/)
})

test('root V1 release shortcut still delegates only to the canonical release launcher', () => {
	const launcher = fs.readFileSync(rootLauncherPath, 'utf8')
	assert.match(launcher, /testbench\\RUN_V1_RELEASE_SMOKE\.cmd/i)
	assert.doesNotMatch(launcher, /allow-hardware-writes|confirm-all-output-routing-isolated/i)
})
