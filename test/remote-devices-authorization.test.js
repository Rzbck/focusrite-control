const fs = require('fs')
const path = require('path')
const test = require('node:test')
const assert = require('node:assert/strict')

const repoRoot = path.resolve(__dirname, '..')

function read(relativePath) {
	return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

test('living handoff requires Remote Devices approval before write-capable hardware tests', () => {
	const handoff = read('docs/CURRENT_HANDOFF.md')

	assert.match(handoff, /Remote Devices authorization — mandatory preflight/)
	assert.match(handoff, /Focusrite Control → Device Settings → Remote Devices/)
	assert.match(handoff, /Reuse the existing Companion Focusrite connection/)
	assert.match(handoff, /AUTHORIZATION\/PREFLIGHT BLOCKED/)
	assert.match(handoff, /Companion Scarlett 18i20/)
	assert.match(handoff, /REMOTE_DEVICES_AUTHORIZATION\.md/)
})

test('authorization documentation preserves the stable private client identity rule', () => {
	const documentation = read('docs/REMOTE_DEVICES_AUTHORIZATION.md')

	assert.match(documentation, /Do not delete\/recreate the Companion Focusrite connection/)
	assert.match(documentation, /client-key/)
	assert.match(documentation, /new UUID/)
	assert.match(documentation, /authorization\/preflight blocker/i)
	assert.match(documentation, /Never publish it/)
})

test('direct read-only research probes are isolated from normal SAFE and FULL campaigns', () => {
	const documentation = read('docs/REMOTE_DEVICES_AUTHORIZATION.md')
	const aiRules = read('AI_PROJECT_RULES.md')

	assert.match(documentation, /Focusrite ReadOnly State Probe/)
	assert.match(documentation, /debug\/cold-start-readback/)
	assert.match(
		documentation,
		/Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE\/FULL\/write-capable TestBench campaign/,
	)
	assert.match(
		documentation,
		/TestBench → Companion HTTP\/API\/buttons → existing approved Companion Scarlett 18i20 connection/,
	)
	assert.match(documentation, /research-only/)
	assert.match(aiRules, /Remote Devices and control-path isolation/)
	assert.match(
		aiRules,
		/Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE\/FULL\/write-capable TestBench campaign/,
	)
	assert.match(aiRules, /REMOTE_DEVICES_AUTHORIZATION\.md/)
})

test('read-only preflight tells the user exactly how to approve the existing client', () => {
	const preflight = read('testbench/Focusrite_18i20_Preflight.ps1')

	assert.match(preflight, /REMOTE DEVICES - OBLIGATOIRE AVANT TOUT TEST QUI ECRIT/)
	assert.match(preflight, /Focusrite Control > Device Settings > Remote Devices/)
	assert.match(preflight, /Companion Scarlett 18i20/)
	assert.match(preflight, /Do not delete\/recreate|Ne supprime\/recree/)
	assert.match(preflight, /PAS un echec du controle materiel/)
})

test('SAFE/FULL/RESUME launcher runs the read-only authorization preflight before any hardware-write command', () => {
	const launcher = read('testbench/RUN_SAFE_HARDWARE_TESTS.cmd')
	const firstPreflightCallIndex = launcher.indexOf('call :RUN_PREFLIGHT')
	const preflightRoutineIndex = launcher.indexOf('\n:RUN_PREFLIGHT')
	const firstWritePermissionIndex = launcher.indexOf('--allow-hardware-writes')
	const preflightRoutine = preflightRoutineIndex >= 0 ? launcher.slice(preflightRoutineIndex) : ''

	assert.ok(firstPreflightCallIndex >= 0, 'launcher must call the Remote Devices preflight')
	assert.ok(preflightRoutineIndex >= 0, 'launcher must define the Remote Devices preflight routine')
	assert.ok(firstWritePermissionIndex >= 0, 'launcher must contain an explicit hardware-write command')
	assert.ok(
		firstPreflightCallIndex < firstWritePermissionIndex,
		'preflight call must run before any hardware-write command',
	)
	assert.match(preflightRoutine, /Focusrite_18i20_Preflight\.ps1/)
	assert.match(launcher, /PREFLIGHT BLOQUE - AUCUN write SAFE\/FULL\/RESUME ne sera lance/)
	assert.match(launcher, /Companion Scarlett 18i20 doit etre APPROUVE/)
	assert.match(launcher, /ne lance aucun ancien Focusrite ReadOnly State Probe en parallele/)
})
