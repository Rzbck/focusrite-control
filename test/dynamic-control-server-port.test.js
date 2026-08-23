const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { FocusriteClient } = require('../src/focusrite-client')

const root = path.join(__dirname, '..')

test('auto mode fails closed when dynamic Control Server discovery fails', async () => {
	const client = new FocusriteClient({ mode: 'auto', host: '127.0.0.1', port: 49152 })
	let tcpConnects = 0
	client.discoverServer = async () => {
		throw new Error('dynamic discovery unavailable')
	}
	client.connectTcp = async () => {
		tcpConnects += 1
	}

	await assert.rejects(client.connect(), /dynamic discovery unavailable/)
	assert.equal(tcpConnects, 0)
})

test('manual mode requires an explicit user-supplied TCP port', async () => {
	const client = new FocusriteClient({ mode: 'manual', host: '127.0.0.1' })
	let tcpConnects = 0
	client.connectTcp = async () => {
		tcpConnects += 1
	}

	await assert.rejects(client.connect(), /requires an explicit TCP port/)
	assert.equal(tcpConnects, 0)
})

test('manual mode uses the explicit user-supplied TCP port without substituting a default', async () => {
	const client = new FocusriteClient({ mode: 'manual', host: '127.0.0.1', port: 49678 })
	let target = null
	client.connectTcp = async (value) => {
		target = value
	}

	await client.connect()
	assert.deepEqual(target, { host: '127.0.0.1', port: 49678, discovered: false })
})

test('production connection code and public help contain no hardcoded Control Server TCP fallback port', () => {
	const clientSource = fs.readFileSync(path.join(root, 'src', 'focusrite-client.js'), 'utf8')
	const mainSource = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8')
	const helpSource = fs.readFileSync(path.join(root, 'companion', 'HELP.md'), 'utf8')
	const combined = `${clientSource}\n${mainSource}\n${helpSource}`

	assert.doesNotMatch(combined, /DEFAULT_PORT|49152|fallback TCP|Manual\/fallback port/)
	assert.match(helpSource, /does not assume a default TCP port/)
	assert.match(helpSource, /do not guess a TCP port/)
})

test('public help documents the V8 withheld write families instead of advertising them as actions', () => {
	const helpSource = fs.readFileSync(path.join(root, 'companion', 'HELP.md'), 'utf8')

	assert.match(helpSource, /direct output mute is intentionally single-output only/)
	assert.match(helpSource, /Mixer Slot Source.*Mixer Slot Stereo.*per-lane Mix Talkback/s)
	assert.match(helpSource, /public write families are therefore withheld/)
	assert.match(helpSource, /Advanced Raw therefore cannot be used as a bypass around the hardware policy/)
})
