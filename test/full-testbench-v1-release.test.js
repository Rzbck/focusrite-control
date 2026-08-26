'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const v2SourcePath = path.join(root, 'testbench', 'FullTestBenchV1ReleaseV2.js')
const v4SourcePath = path.join(root, 'testbench', 'FullTestBenchV1ReleaseV4.js')
const v5SourcePath = path.join(root, 'testbench', 'FullTestBenchV1ReleaseV5.js')
const launcherPath = path.join(root, 'testbench', 'RUN_V1_RELEASE_SMOKE.cmd')
const rootLauncherPath = path.join(root, 'RUN_V1_RELEASE_SMOKE.bat')

function v4Source() {
	return fs.readFileSync(v4SourcePath, 'utf8')
}

function v5Source() {
	return fs.readFileSync(v5SourcePath, 'utf8')
}

function v2Source() {
	return fs.readFileSync(v2SourcePath, 'utf8')
}

test('V1 release smoke V5 is pinned to 0.1.21 and tests only the retained public write surface', () => {
	const text = v5Source()
	assert.match(text, /EXPECTED_MODULE_VERSION !== '0\.1\.21'/)
	assert.match(text, /buildReleaseTestsV5/)
	assert.match(text, /buildReleasePage/)
	for (const action of [
		'monitor_preset',
		'input_mode',
		'input_mode_cycle',
		'input_nickname',
		'output_mute',
		'output_gain_set',
		'output_gain_adjust',
		'output_source',
		'output_nickname',
		'device_nickname',
		'phantom_persistence',
		'talkback_source',
		'reconnect',
	]) {
		assert.match(text, new RegExp(`'${action}'`))
	}
	assert.doesNotMatch(text, /change:\s*\{\s*definitionId:\s*'output_pair_source'/)
	assert.doesNotMatch(text, /restore:\s*\{\s*definitionId:\s*'output_pair_source'/)
})

test('V1 release smoke V5 strips inherited pair tests and records output_pair_source as withheld', () => {
	const text = v5Source()
	assert.match(text, /test\.change\.definitionId !== 'output_pair_source'/)
	assert.match(text, /withheldActionIds:\s*\['output_pair_source'\]/)
	assert.match(text, /no output_pair_source button is generated or pressed/i)
	assert.match(text, /withheld from the v1 write plan/i)
	assert.match(text, /REFUSED BEFORE WRITE: withheld output_pair_source escaped into the V5 release plan/)
})

test('historical V4 remains available as the strict two-member pair-closure evidence runner', () => {
	const text = v4Source()
	assert.match(text, /schemaSourcePairs/)
	assert.match(text, /source_\$\{n\}_pair_side/)
	assert.match(text, /source_\$\{n\}_pair_root_id/)
	assert.match(text, /definitionId: 'output_pair_source'/)
	assert.match(text, /expectedChange: \[alternate\.left\.id, alternate\.right\.id\]/)
	assert.doesNotMatch(text, /parseTrailingChannel/)
})

test('V5 keeps stable-live-baseline, exact restore and collateral guards from the V4 execution engine', () => {
	const v5 = v5Source()
	const v4 = v4Source()
	assert.match(v5, /captureStableReleaseState/)
	assert.match(v5, /current configuration accepted as baseline/i)
	assert.match(v5, /live release state did not stabilise/i)
	assert.match(v5, /No fixed routing\/preset baseline is assumed/)
	assert.match(v5, /const preTestBaseline = await captureReleaseState/)
	assert.match(v5, /verifyKnownBaseline/)
	assert.match(v5, /COLLATERAL_DRIFT/)
	assert.match(v5, /process\.exitCode = 4/)
	assert.match(v4, /PREWRITE_DRIFT/)
	assert.match(v4, /RESTORE_FAILURE/)
	assert.match(v4, /NO_TRANSITION/)
	assert.doesNotMatch(v5, /\.setItem\s*\(/)
	assert.doesNotMatch(v5, /<set\b/i)
})

test('V5 reports reconnect NOT_RUN after a safety abort instead of inventing a reconnect failure', () => {
	const text = v5Source()
	assert.match(text, /let reconnectStatus = 'NOT_RUN'/)
	assert.match(text, /if \(!hardAbort\)/)
	assert.match(text, /reconnect: reconnectStatus/)
	assert.match(text, /hardAbortClass/)
})

test('V1 release Page 2 replacement remains fail-closed and preserves Page 1, other pages and connections', () => {
	const text = v5Source()
	const v2 = v2Source()
	assert.match(text, /ensureReleasePage/)
	assert.match(v2, /Page 2 is not a verified Focusrite TestBench page/)
	assert.match(v2, /Page 2 is missing/)
	assert.match(v2, /hashPagesExcept/)
	assert.match(v2, /sameConnectionSet/)
	assert.match(text, /Page 1 r9 \/ module audit/)
	assert.match(text, /Page 1 preserved/)
})

test('V1 release launcher uses V5, keeps the current configuration and gates writes after prepare-only', () => {
	const launcher = fs.readFileSync(launcherPath, 'utf8')
	const preflight = launcher.indexOf(
		'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%Focusrite_18i20_Preflight.ps1"',
	)
	const prepareOnly = launcher.indexOf('"%SCRIPT_DIR%FullTestBenchV1ReleaseV5.js" --prepare-only')
	const releaseConfirm = launcher.indexOf('set /p "RELEASE_CONFIRM=Tape V1_RELEASE')
	const isolationConfirm = launcher.indexOf('set /p "ISOLATION_CONFIRM=Tape ALL_ISOLATED')
	const safe = launcher.indexOf('"%SCRIPT_DIR%Focusrite_18i20_SafeHardwareTest.js" --allow-hardware-writes')
	const release = launcher.indexOf(
		'"%SCRIPT_DIR%FullTestBenchV1ReleaseV5.js" --allow-hardware-writes --confirm-all-output-routing-isolated',
	)
	assert.ok(preflight >= 0)
	assert.ok(prepareOnly > preflight)
	assert.ok(releaseConfirm > prepareOnly)
	assert.ok(isolationConfirm > releaseConfirm)
	assert.ok(safe > isolationConfirm)
	assert.ok(release > safe)
	assert.match(launcher, /Page 1 r9 reste intacte/)
	assert.match(launcher, /Page 2 est remplacee automatiquement/)
	assert.match(launcher, /laisse TA CONFIGURATION ACTUELLE telle quelle/)
	assert.match(launcher, /output_pair_source.*WITHHELD/i)
	assert.doesNotMatch(launcher, /restaure ta configuration Focusrite normale/i)
	assert.match(launcher, /GARDE DE SECURITE BASELINE\/RESTAURATION\/COLLATERAL/)
	assert.match(launcher, /0\.1\.21\.tgz/)
})

test('root V1 release shortcut still delegates only to the canonical release launcher', () => {
	const launcher = fs.readFileSync(rootLauncherPath, 'utf8')
	assert.match(launcher, /testbench\\RUN_V1_RELEASE_SMOKE\.cmd/i)
	assert.doesNotMatch(launcher, /allow-hardware-writes|confirm-all-output-routing-isolated/i)
})
