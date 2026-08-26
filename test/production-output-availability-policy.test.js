'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const {
	UNVALIDATED_CONFIGURATION_OUTPUTS,
	outputAvailabilityAllowsWrite,
	directOutputWriteSupported,
	outputPairSourceWriteSupported,
	rawItemWriteSupported,
} = require('../src/hardware-policy')
const {
	V1_WITHHELD_ACTIONS,
	filterActionDefinitions,
	filterPresetDefinitions,
	installDefinitionPolicy,
} = require('../src/definition-policy')

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
		mixes: [
			{ id: 'mix-left', side: 'L' },
			{ id: 'mix-right', side: 'R' },
		],
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

function sourceAction(count, callback = async () => {}) {
	return {
		...outputAction(count, callback),
		options: [
			...outputAction(count).options,
			{
				type: 'dropdown',
				id: 'source',
				choices: [
					{ id: '0', label: 'None' },
					{ id: 'direct-source', label: 'Playback 1' },
					{ id: 'mix-left', label: 'Internal custom mix' },
				],
				default: 'mix-left',
			},
		],
	}
}

function choiceIds(definition) {
	return definition.options.find((option) => option.id === 'output').choices.map((choice) => Number(choice.id))
}

function sourceChoiceIds(definition) {
	return definition.options.find((option) => option.id === 'source').choices.map((choice) => String(choice.id))
}

function instanceFor(device, state) {
	return {
		device,
		client: { getValue: (id) => state.get(String(id)) },
		log() {},
	}
}

function simpleAction() {
	return { name: 'test', options: [], callback: async () => {} }
}

function simplePreset(actionId, options = {}) {
	return { steps: [{ down: [{ actionId, options }], up: [] }] }
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
	assert.equal(
		outputPairSourceWriteSupported(device, device.outputs[0], getValue),
		false,
		'unknown right member blocks the retained research primitive',
	)

	state.set('a1', 'true')
	assert.equal(
		outputPairSourceWriteSupported(device, device.outputs[0], getValue),
		true,
		'policy primitive can remain available to dedicated research even though the public action is withheld',
	)
})

test('production definitions omit unavailable/unknown, pair-owned direct writes and public pair routing', () => {
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

	assert.deepEqual(choiceIds(filtered.output_mute), [0, 4, 6, 8, 10])
	assert.deepEqual(choiceIds(filtered.output_source), [0, 4, 6, 8, 10])
	assert.equal(filtered.output_pair_source, undefined)
	assert.equal(
		rawItemWriteSupported(device, 's2', (id) => state.get(String(id))),
		false,
	)
	assert.equal(
		rawItemWriteSupported(device, 's10', (id) => state.get(String(id))),
		true,
	)
})

test('human Outputs 21-24 stay write-blocked even if a future configuration reports them available', () => {
	const device = makeDevice()
	const state = new Map()
	const getValue = (id) => state.get(String(id))

	assert.deepEqual([...UNVALIDATED_CONFIGURATION_OUTPUTS], [20, 21, 22, 23])
	for (const index of UNVALIDATED_CONFIGURATION_OUTPUTS) {
		const output = {
			...device.outputs[0],
			index,
			name: `Output ${index + 1}`,
			available: `future-${index}`,
		}
		state.set(output.available, 'true')
		for (const control of ['mute', 'source', 'stereo', 'nickname', 'gain']) {
			assert.equal(directOutputWriteSupported(device, output, control, getValue), false)
		}
	}
})

test('v1 public action surface removes unproven, pair, disruptive and raw write families', () => {
	const device = makeDevice()
	const state = new Map()
	for (let index = 0; index < 12; index += 1) state.set(`a${index}`, 'true')
	const instance = instanceFor(device, state)
	const definitions = {
		reconnect: simpleAction(),
		input_air: simpleAction(),
		...Object.fromEntries([...V1_WITHHELD_ACTIONS].map((id) => [id, simpleAction()])),
	}
	const filtered = filterActionDefinitions(instance, definitions)

	assert.ok(V1_WITHHELD_ACTIONS.has('output_pair_source'))
	assert.ok(filtered.reconnect)
	assert.ok(filtered.input_air)
	for (const actionId of V1_WITHHELD_ACTIONS) assert.equal(filtered[actionId], undefined, actionId)
})

test('installed Companion policy strips the research mixer-slot stereo action even with diagnostics enabled', () => {
	const device = makeDevice()
	device.mixerSlots = [{ stereo: 'slot-stereo-1' }]
	const state = new Map([['slot-stereo-1', 'false']])
	let installedActions = null
	const instance = {
		...instanceFor(device, state),
		config: { exposeMixerVariables: true },
		setActionDefinitions(definitions) {
			installedActions = definitions
		},
		setPresetDefinitions() {},
	}
	installDefinitionPolicy(instance)
	instance.setActionDefinitions({
		mixer_slot_stereo: {
			name: 'Mixer stereo',
			options: [
				{ id: 'slot', type: 'number' },
				{
					id: 'state',
					type: 'dropdown',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'toggle',
				},
			],
			callback: async () => {},
		},
		reconnect: simpleAction(),
	})

	assert.ok(installedActions)
	assert.equal(installedActions.mixer_slot_stereo, undefined)
	assert.ok(installedActions.reconnect)
})

test('v1 direct output source removes Custom Mix IDs while stereo pair routing is absent', async () => {
	const device = makeDevice()
	const state = new Map()
	for (let index = 0; index < 12; index += 1) state.set(`a${index}`, 'true')
	const instance = instanceFor(device, state)
	let directCalls = 0
	const filtered = filterActionDefinitions(instance, {
		output_source: sourceAction(12, async () => {
			directCalls += 1
		}),
		output_pair_source: sourceAction(12),
		reconnect: simpleAction(),
	})

	assert.deepEqual(sourceChoiceIds(filtered.output_source), ['0', 'direct-source'])
	assert.equal(filtered.output_pair_source, undefined)

	await filtered.output_source.callback({ options: { output: '0', source: 'mix-left' } })
	assert.equal(directCalls, 0)
	await filtered.output_source.callback({ options: { output: '0', source: 'direct-source' } })
	assert.equal(directCalls, 1)
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

test('presets using blocked outputs or withheld v1 actions including pair routing are removed', () => {
	const device = makeDevice()
	const state = new Map()
	for (let index = 0; index < 12; index += 1) state.set(`a${index}`, 'true')
	state.set('a2', 'false')
	const instance = instanceFor(device, state)
	const presets = {
		blockedOutput: simplePreset('output_mute', { output: '2', state: 'toggle' }),
		allowedOutput: simplePreset('output_mute', { output: '10', state: 'toggle' }),
		pair: simplePreset('output_pair_source', { output: '0', source: 'direct-source' }),
		alt: simplePreset('monitor_alt', { state: 'toggle' }),
		mix: simplePreset('mix_mute', { slot: 1, state: 'toggle' }),
		raw: simplePreset('advanced_raw_set', { item: 'x', value: '1' }),
		allowedInput: simplePreset('input_air', { input: '0', state: 'toggle' }),
	}
	const all = Object.keys(presets)
	const structure = [{ id: 'test', definitions: [{ id: 'items', presets: all }] }]
	const filtered = filterPresetDefinitions(instance, structure, presets)

	assert.equal(filtered.presets.blockedOutput, undefined)
	assert.equal(filtered.presets.pair, undefined)
	assert.equal(filtered.presets.alt, undefined)
	assert.equal(filtered.presets.mix, undefined)
	assert.equal(filtered.presets.raw, undefined)
	assert.ok(filtered.presets.allowedOutput)
	assert.ok(filtered.presets.allowedInput)
	assert.deepEqual(filtered.structure[0].definitions[0].presets, ['allowedOutput', 'allowedInput'])
})
