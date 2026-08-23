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

	assert.match(documentation, /Focusrite ReadOnly State Probe/)
	assert.match(documentation, /debug\/cold-start-readback/)
	assert.match(documentation, /Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE\/FULL\/write-capable TestBench campaign/)
	assert.match(documentation, /TestBench → Companion HTTP\/API\/buttons → existing approved Companion Scarlett 18i20 connection/)
	assert.match(documentation, /research-only/)
})

test('read-only preflight tells the user exactly how to approve the existing client', () => {
	const preflight = read('testbench/Focusrite_18i20_Preflight.ps1')

	assert.match(preflight, /REMOTE DEVICES - OBLIGATOIRE AVANT TOUT TEST QUI ECRIT/)
	assert.match(preflight, /Focusrite Control > Device Settings > Remote Devices/)
	assert.match(preflight, /Companion Scarlett 18i20/)
	assert.match(preflight, /Do not delete\/recreate|Ne supprime\/recree/)
	assert.match(preflight, /PAS un echec du controle materiel/)
})
