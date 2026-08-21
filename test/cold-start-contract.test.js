const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

const originalLoad = Module._load
const baseStub = { combineRgb: (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255) }
Module._load = function patchedLoad(request, parent, isMain) {
	if (request === '@companion-module/base') return baseStub
	return originalLoad.call(this, request, parent, isMain)
}

const { parseDeviceArrival } = require('../src/device-parser')
const { updateActions } = require('../src/actions')
const { updateFeedbacks } = require('../src/feedbacks')
const { buildVariableValues } = require('../src/variables')
const buildSynthetic18i20Schema = require('../test-support/synthetic-18i20')

function makeInstance() {
	const device = parseDeviceArrival(buildSynthetic18i20Schema())
	const state = new Map()
	const writes = []
	const instance = {
		device,
		config: { enableAdvancedRawWrites: false, exposeMixerVariables: false },
		client: {
			connected: true,
			authorised: true,
			ready: true,
			state,
			getValue(id) { return state.get(String(id)) },
		},
		log() {},
		setItem(id, value) { writes.push([String(id), String(value)]); return true },
		setActionDefinitions(value) { this.actions = value },
		setFeedbackDefinitions(value) { this.feedbacks = value },
	}
	updateActions(instance)
	updateFeedbacks(instance)
	return { instance, device, state, writes }
}

test.after(() => { Module._load = originalLoad })

test('explicit Air On/Off remains usable when cold-start state is unknown', async () => {
	const { instance, device, writes } = makeInstance()
	const air = String(device.hardwareInputs[0].air)
	await instance.actions.input_air.callback({ options: { input: '0', state: 'on' } })
	await instance.actions.input_air.callback({ options: { input: '0', state: 'off' } })
	assert.deepEqual(writes, [[air, 'true'], [air, 'false']])
})

test('Air Toggle remains blocked until server-confirmed state exists', async () => {
	const { instance, device, state, writes } = makeInstance()
	const air = String(device.hardwareInputs[0].air)
	await instance.actions.input_air.callback({ options: { input: '0', state: 'toggle' } })
	assert.deepEqual(writes, [])
	state.set(air, 'false')
	await instance.actions.input_air.callback({ options: { input: '0', state: 'toggle' } })
	assert.deepEqual(writes, [[air, 'true']])
})

test('explicit Monitor Mute On remains usable when cold-start state is unknown', async () => {
	const { instance, device, writes } = makeInstance()
	await instance.actions.monitor_mute.callback({ options: { state: 'on' } })
	assert.deepEqual(writes, [[String(device.monitoring.mute), 'true']])
})

test('cold-start variables stay blank until the server confirms a value', () => {
	const { instance, device, state } = makeInstance()
	let values = buildVariableValues(instance)
	assert.equal(values.input_1_air, '')
	assert.equal(values.monitor_mute, '')
	state.set(String(device.hardwareInputs[0].air), 'false')
	state.set(String(device.monitoring.mute), 'true')
	values = buildVariableValues(instance)
	assert.equal(values.input_1_air, 'false')
	assert.equal(values.monitor_mute, 'true')
})

test('boolean feedback cannot become active from an unknown cold-start value', async () => {
	const { instance, device, state } = makeInstance()
	assert.equal(await instance.feedbacks.input_air.callback({ options: { input: '0' } }), false)
	assert.equal(await instance.feedbacks.monitor_mute.callback({ options: {} }), false)
	state.set(String(device.hardwareInputs[0].air), 'true')
	state.set(String(device.monitoring.mute), 'true')
	assert.equal(await instance.feedbacks.input_air.callback({ options: { input: '0' } }), true)
	assert.equal(await instance.feedbacks.monitor_mute.callback({ options: {} }), true)
})
