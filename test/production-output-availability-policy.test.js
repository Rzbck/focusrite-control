'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const {
	outputAvailabilityAllowsWrite,
	directOutputWriteSupported,
	outputPairSourceWriteSupported,
	rawItemWriteSupported,
} = require('../src/hardware-policy')
const { filterActionDefinitions, filterPresetDefinitions } = require('../src/definition-policy')

function makeDevice() {
	const outputs = Array.from({ length: 12 }, (_, index) => ({
		index,
		name: `Output ${index + 1}`,
		available: `a${index}`,
		mute: `m${index}`,
		source: `s${index}`,
		stereo: `t${index}`,
		nickname: `n${index}`,
		gain: `g${index}`,
		pairSide: index % 2 === 0 ? 'L' : 'R',
		pairIndex: index % 2 === 0 ? index + 1 : index - 1,
	}))
	// A missing availability flag is a separately proven eligible case.
	outputs[10].available = null

	const descriptors = new Map()
	const writableIds = new Set()
	for (const output of outputs) {
		for (const control of ['mute', 'source', 'stereo', 'nickname', 'gain']) {
			const id = output[control]
			writableIds.add(id)
			descriptors.set(id, { category: 'output', ownerIndex: output.index, control })
		}
	}
	return {
		model: 'Scarlett 18i20 (3rd Gen)',
		outputs,
		descriptors,
		writableIds,
	}
}

function outputAction(count, callback = async () => {}) {
	return {
		name: 'test',
		options: [
			{
				type: 'dropdown',
				id: 'output',
				choices: Array.from({ length: count }, (_, index) => ({ id: String(index), label: `Out ${index + 1}` })),
				default: '0',
			},
		],
		callback,
	}
}

function choiceIds(definition) {
	return definition.options.find((option) => option.id === 'output').choices.map((choice) => Number(choice.id))
}

function instanceFor(device, state) {
	return {
		device,
		client: { getValue: (id) => state.get(String(id)) },
		log() {},
	}
}

test('production output availability permits true/no-flag and blocks false/unknown', () => {
	const device = makeDevice()
	const state = new Map([
		['a0', 'true'],
		['a1', ''],
		['a2', 'false'],
	])
	const getValue = (id) => state.get(String(id))

	assert.equal(outputAvailabilityAllowsWrite(device.outputs[0], getValue), true)
	assert.equal(outputAvailabilityAllowsWrite(device.outputs[1], getValue), false)
	assert.equal(outputAvailabilityAllowsWrite(device.outputs[2], getValue), false)
	assert.equal(outputAvailabilityAllowsWrite(device.outputs[10], getValue), true)
	assert.equal(directOutputWriteSupported(device, device.outputs[2], 'source', getValue), false)
	assert.equal(outputPairSourceWriteSupported(device, device.outputs[0], getValue), false, 'unknown right member blocks pair')

	state.set('a1', 'true')
	assert.equal(outputPairSourceWriteSupported(device, device.outputs[0], getValue), true)
})

test('production definitions omit unavailable/unknown direct and pair output write surfaces', () => {
	const device = makeDevice()
	const state = new Map()
	for (let index = 0; index < 12; index += 1) state.set(`a${index}`, 'true')
	state.set('a1', '')
	state.set('a2', 'false')
	const instance = instanceFor(device, state)

	const definitions = {
		output_mute: outputAction(12),
		output_source: outputAction(12),
		output_pair_source: {
			...outputAction(12),
			options: [
				{
					type: 'dropdown',
					id: 'output',
					choices: [0, 2, 4, 6, 8, 10].map((index) => ({ id: String(index), label: `Pair ${index + 1}` })),
					default: '0',
				},
			],
		},
		reconnect: { callback: async () => {}, options: [] },
	}
	const filtered = filterActionDefinitions(instance, definitions)

	assert.deepEqual(choiceIds(filtered.output_mute), [0, 4, 6, 8, 10, 11])
	assert.deepEqual(choiceIds(filtered.output_source), [0, 4, 6, 8, 10])
	assert.deepEqual(choiceIds(filtered.output_pair_source), [4, 6, 8, 10])
	assert.equal(rawItemWriteSupported(device, 's2', (id) => state.get(String(id))), false)
	assert.equal(rawItemWriteSupported(device, 's10', (id) => state.get(String(id))), true)
})

test('production callback rechecks availability so a stale visible action still fails closed', async () => {
	const device = makeDevice()
	const state = new Map()
	for (let index = 0; index < 12; index += 1) state.set(`a${index}`, 'true')
	const instance = instanceFor(device, state)
	let calls = 0
	const filtered = filterActionDefinitions(instance, {
		output_source: outputAction(12, async () => {
			calls += 1
		}),
		reconnect: { callback: async () => {}, options: [] },
	})

	assert.ok(choiceIds(filtered.output_source).includes(0))
	state.set('a0', '')
	await filtered.output_source.callback({ options: { output: '0' } })
	assert.equal(calls, 0)
})

test('output mute presets targeting unavailable outputs are removed by the same policy', () => {
	const device = makeDevice()
	const state = new Map()
	for (let index = 0; index < 12; index += 1) state.set(`a${index}`, 'true')
	state.set('a2', 'false')
	const instance = instanceFor(device, state)
	const presets = {
		blocked: {
			steps: [{ down: [{ actionId: 'output_mute', options: { output: '2', state: 'toggle' } }], up: [] }],
		},
		allowed: {
			steps: [{ down: [{ actionId: 'output_mute', options: { output: '10', state: 'toggle' } }], up: [] }],
		},
	}
	const structure = [
		{ id: 'outputs', definitions: [{ id: 'mutes', presets: ['blocked', 'allowed'] }] },
	]
	const filtered = filterPresetDefinitions(instance, structure, presets)

	assert.equal(filtered.presets.blocked, undefined)
	assert.ok(filtered.presets.allowed)
	assert.deepEqual(filtered.structure[0].definitions[0].presets, ['allowed'])
})
