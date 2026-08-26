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
const { getPresets } = require('../src/presets')
const { buildVariableValues } = require('../src/variables')
const buildSynthetic18i20Schema = require('../test-support/synthetic-18i20')
const xml = buildSynthetic18i20Schema()

function makeInstance() {
	const device = parseDeviceArrival(xml)
	const state = new Map()
	const writes = []
	const logs = []
	const instance = {
		device,
		config: { enableAdvancedRawWrites: false, exposeMixerVariables: false },
		client: {
			connected: true,
			authorised: true,
			state,
			getValue(id) {
				return state.get(String(id))
			},
		},
		log(level, message) {
			logs.push([level, message])
		},
		setItem(id, value) {
			writes.push([String(id), String(value)])
			return true
		},
		setActionDefinitions(value) {
			this.actions = value
		},
		setFeedbackDefinitions(value) {
			this.feedbacks = value
		},
	}
	updateActions(instance)
	updateFeedbacks(instance)
	return { instance, device, state, writes, logs }
}

test.after(() => {
	Module._load = originalLoad
})

test('mixer slot source feedback never treats unknown state as source 0', async () => {
	const { instance, device, state } = makeInstance()
	const feedback = instance.feedbacks.mixer_slot_source
	const slot = device.mixerSlots[3]
	assert.equal(await feedback.callback({ options: { slot: 4, source: '0' } }), false)
	state.set(String(slot.source), '0')
	assert.equal(await feedback.callback({ options: { slot: 4, source: '0' } }), true)
	state.set(String(slot.source), '1234')
	assert.equal(await feedback.callback({ options: { slot: 4, source: '0' } }), false)
})

test('output source feedback and source-name variables do not invent None from unknown state', async () => {
	const { instance, device, state } = makeInstance()
	const output = device.outputs.find((item) => item.source)
	const feedback = instance.feedbacks.output_source
	const outputNumber = String(output.index)
	assert.equal(await feedback.callback({ options: { output: outputNumber, source: '0' } }), false)
	let values = buildVariableValues(instance)
	assert.equal(values[`output_${output.index + 1}_source`], '')
	assert.equal(values[`output_${output.index + 1}_source_name`], '')
	state.set(String(output.source), '0')
	assert.equal(await feedback.callback({ options: { output: outputNumber, source: '0' } }), true)
	values = buildVariableValues(instance)
	assert.equal(values[`output_${output.index + 1}_source_name`], 'None / Unassigned')
})

test('meter feedbacks never evaluate true from unknown or non-numeric state', async () => {
	const { instance, device, state } = makeInstance()
	const input = device.hardwareInputs.find((item) => item.meter)
	const output = device.outputs.find((item) => item.meter)
	const lane = device.mixes.find((item) => item.meter)

	assert.equal(
		await instance.feedbacks.input_meter.callback({
			options: { input: String(device.hardwareInputs.indexOf(input)), threshold: -128 },
		}),
		false,
	)
	assert.equal(
		await instance.feedbacks.output_meter.callback({ options: { output: String(output.index), threshold: -128 } }),
		false,
	)
	assert.equal(
		await instance.feedbacks.mix_meter.callback({
			options: { mix: lane.name, side: lane.side === 'L' ? 'left' : 'right', threshold: -128 },
		}),
		false,
	)

	state.set(String(input.meter), 'bad')
	state.set(String(output.meter), 'bad')
	state.set(String(lane.meter), 'bad')
	assert.equal(
		await instance.feedbacks.input_meter.callback({
			options: { input: String(device.hardwareInputs.indexOf(input)), threshold: -128 },
		}),
		false,
	)
	assert.equal(
		await instance.feedbacks.output_meter.callback({ options: { output: String(output.index), threshold: -128 } }),
		false,
	)
	assert.equal(
		await instance.feedbacks.mix_meter.callback({
			options: { mix: lane.name, side: lane.side === 'L' ? 'left' : 'right', threshold: -128 },
		}),
		false,
	)

	state.set(String(input.meter), '-12')
	state.set(String(output.meter), '-12')
	state.set(String(lane.meter), '-12')
	assert.equal(
		await instance.feedbacks.input_meter.callback({
			options: { input: String(device.hardwareInputs.indexOf(input)), threshold: -40 },
		}),
		true,
	)
	assert.equal(
		await instance.feedbacks.output_meter.callback({ options: { output: String(output.index), threshold: -40 } }),
		true,
	)
	assert.equal(
		await instance.feedbacks.mix_meter.callback({
			options: { mix: lane.name, side: lane.side === 'L' ? 'left' : 'right', threshold: -40 },
		}),
		true,
	)
})

test('boolean toggle does not write when current server state is unknown', async () => {
	const { instance, device, state, writes } = makeInstance()
	const input = device.hardwareInputs[0]
	await instance.actions.input_air.callback({ options: { input: '0', state: 'toggle' } })
	assert.deepEqual(writes, [])
	state.set(String(input.air), 'false')
	await instance.actions.input_air.callback({ options: { input: '0', state: 'toggle' } })
	assert.deepEqual(writes, [[String(input.air), 'true']])
})

test('input mode cycle does not write from unknown or invalid current state', async () => {
	const { instance, device, state, writes } = makeInstance()
	const input = device.hardwareInputs[0]
	await instance.actions.input_mode_cycle.callback({ options: { input: '0' } })
	assert.deepEqual(writes, [])
	state.set(String(input.mode), 'Unexpected')
	await instance.actions.input_mode_cycle.callback({ options: { input: '0' } })
	assert.deepEqual(writes, [])
	state.set(String(input.mode), 'Line')
	await instance.actions.input_mode_cycle.callback({ options: { input: '0' } })
	assert.deepEqual(writes, [[String(input.mode), 'Inst']])
})

test('relative gain actions do not derive writes from missing or non-numeric state', async () => {
	const { instance, device, state, writes } = makeInstance()
	const output = device.outputs.find((item) => item.gain)
	const lane = device.mixes.find((item) => item.inputs?.[0]?.gain)
	const side = lane.side === 'L' ? 'left' : 'right'
	await instance.actions.output_gain_adjust.callback({ options: { output: String(output.index), step: 1 } })
	await instance.actions.mix_gain_adjust.callback({ options: { mix: lane.name, side, slot: 1, step: 1 } })
	assert.deepEqual(writes, [])
	state.set(String(output.gain), 'not-a-number')
	state.set(String(lane.inputs[0].gain), 'not-a-number')
	await instance.actions.output_gain_adjust.callback({ options: { output: String(output.index), step: 1 } })
	await instance.actions.mix_gain_adjust.callback({ options: { mix: lane.name, side, slot: 1, step: 1 } })
	assert.deepEqual(writes, [])
	state.set(String(output.gain), '-10')
	state.set(String(lane.inputs[0].gain), '-20')
	await instance.actions.output_gain_adjust.callback({ options: { output: String(output.index), step: 1 } })
	await instance.actions.mix_gain_adjust.callback({ options: { mix: lane.name, side, slot: 1, step: 1 } })
	assert.deepEqual(writes, [
		[String(output.gain), '-9'],
		[String(lane.inputs[0].gain), '-19'],
	])
})

test('Monitor gain 1677 is read-only and excluded from actions, presets, and Advanced Raw writes', async () => {
	const { instance, device, writes } = makeInstance()
	const presetResult = getPresets(instance)
	assert.equal(device.monitoring.gain, '1677')
	assert.equal(device.writableIds.has('1677'), false)
	assert.equal(instance.actions.monitor_gain_set, undefined)
	assert.equal(instance.actions.monitor_gain_adjust, undefined)
	assert.equal(presetResult.presets.monitor_up, undefined)
	assert.equal(presetResult.presets.monitor_down, undefined)

	instance.config.enableAdvancedRawWrites = true
	updateActions(instance)
	assert.ok(instance.actions.advanced_raw_set)
	const itemOption = instance.actions.advanced_raw_set.options.find((option) => option.id === 'item')
	assert.ok(itemOption)
	assert.equal(
		itemOption.choices.some((entry) => String(entry.id) === '1677'),
		false,
	)
	await instance.actions.advanced_raw_set.callback({ options: { item: '1677', value: '-12' } })
	assert.deepEqual(writes, [])
})
