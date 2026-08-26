const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')

const originalLoad = Module._load
const baseStub = {
	combineRgb: (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255),
	InstanceBase: class InstanceBase {},
	Regex: { IP: '/.*/', PORT: '/.*/' },
	InstanceStatus: {
		Ok: 'ok',
		Connecting: 'connecting',
		Disconnected: 'disconnected',
		ConnectionFailure: 'connection_failure',
	},
}

Module._load = function patchedLoad(request, parent, isMain) {
	if (request === '@companion-module/base') return baseStub
	return originalLoad.call(this, request, parent, isMain)
}

const { parseDeviceArrival } = require('../src/device-parser')
const { updateActions } = require('../src/actions')
const { updateFeedbacks } = require('../src/feedbacks')
const { buildVariableDefinitions, buildVariableValues } = require('../src/variables')
const { getPresets } = require('../src/presets')
const buildSynthetic18i20Schema = require('../test-support/synthetic-18i20')

function defaultOptions(definition) {
	const result = {}
	for (const option of definition.options || []) {
		if (option.default !== undefined) result[option.id] = option.default
		else if (Array.isArray(option.choices) && option.choices.length) result[option.id] = option.choices[0].id
		else if (option.type === 'number') result[option.id] = option.min ?? 0
		else result[option.id] = ''
	}
	return result
}

function collectPresetReferences(presets) {
	const actions = []
	const feedbacks = []
	for (const preset of Object.values(presets)) {
		for (const step of preset.steps || []) {
			for (const action of step.down || []) actions.push(action.actionId)
			for (const action of step.up || []) actions.push(action.actionId)
		}
		for (const feedback of preset.feedbacks || []) feedbacks.push(feedback.feedbackId)
	}
	return { actions, feedbacks }
}

test.after(() => {
	Module._load = originalLoad
})

test('full synthetic 18i20 schema generates coherent Companion definitions', async () => {
	const xml = buildSynthetic18i20Schema()
	const device = parseDeviceArrival(xml)

	assert.equal(device.model, 'Scarlett 18i20 (3rd Gen)')
	assert.equal(device.hardwareInputs.length, 8)
	assert.equal(device.sources.length, 43)
	assert.equal(device.outputs.length, 26)
	assert.equal(device.mixerSlots.length, 24)
	assert.equal(device.mixes.length, 12)

	assert.equal(device.hardwareInputs[2].id, '1269')
	assert.equal(device.hardwareInputs[2].meter, '1272')
	assert.equal(device.hardwareInputs[2].air, '1273')
	assert.equal(device.hardwareInputs[2].pad, '1274')
	assert.equal(device.monitoring.gain, '1677')
	assert.equal(device.monitoring.dim, '1678')
	assert.equal(device.monitoring.mute, '1679')
	assert.equal(device.monitoring.altEnable, '1680')
	assert.equal(device.monitoring.alt, '1681')
	assert.equal(device.monitoring.talkback, '1682')

	assert.equal(device.writableIds.has('1272'), false, 'Analogue 3 meter must never be writable')
	assert.equal(device.writableIds.has('4'), false, 'Snapshot command must never be writable')
	assert.equal(device.writableIds.has('5'), false, 'Save snapshot command must never be writable')
	assert.equal(device.writableIds.has('7'), false, 'Reset command must never be writable')
	assert.equal(device.writableIds.has('1677'), false, 'Monitor gain 1677 must never be writable')

	const state = new Map()
	const writes = []
	const instance = {
		device,
		config: { enableAdvancedRawWrites: false, exposeMixerVariables: false },
		client: {
			connected: true,
			ready: true,
			server: { host: '127.0.0.1', port: 49678 },
			state,
			getValue(id) {
				return state.get(String(id))
			},
		},
		log() {},
		setItem(id, value) {
			assert.ok(device.writableIds.has(String(id)), `action attempted unsafe item ${id}`)
			writes.push([String(id), String(value)])
			state.set(String(id), String(value))
			return true
		},
		async reconnectNow() {},
		setActionDefinitions(value) {
			this.actions = value
		},
		setFeedbackDefinitions(value) {
			this.feedbacks = value
		},
	}

	updateActions(instance)
	updateFeedbacks(instance)
	const variableDefinitions = buildVariableDefinitions(instance)
	const variableValues = buildVariableValues(instance)
	const presetResult = getPresets(instance)

	const requiredActions = [
		'monitor_mute',
		'monitor_dim',
		'monitor_talkback',
		'monitor_preset',
		'input_air',
		'input_pad',
		'input_mode',
		'input_mode_cycle',
		'input_nickname',
		'output_mute',
		'output_gain_set',
		'output_gain_adjust',
		'output_source',
		'output_pair_source',
		'output_stereo',
		'output_nickname',
		'mixer_slot_source',
		'mixer_slot_stereo',
		'mix_mute',
		'mix_solo',
		'mix_gain_set',
		'mix_gain_adjust',
		'mix_pan',
		'mix_talkback',
		'device_nickname',
		'device_preset',
		'clock_source',
		'sample_rate',
		'spdif_mode',
		'phantom_persistence',
		'talkback_source',
		'reconnect',
	]
	for (const id of requiredActions) assert.ok(instance.actions[id], `missing action ${id}`)

	for (const id of [
		'input_mute',
		'input_gain',
		'input_phantom',
		'mic_kill',
		'monitor_gain_set',
		'monitor_gain_adjust',
	]) {
		assert.equal(instance.actions[id], undefined, `unsupported action ${id} must not exist`)
	}

	for (const [id, value] of Object.entries(variableValues)) {
		assert.ok(variableDefinitions[id], `variable value ${id} has no definition`)
		assert.notEqual(value, undefined, `variable ${id} returned undefined`)
	}

	// Every feedback callback must be executable using its own defaults.
	for (const [id, definition] of Object.entries(instance.feedbacks)) {
		const options = defaultOptions(definition)
		const result = await definition.callback({ options, instance })
		assert.equal(typeof result, 'boolean', `feedback ${id} did not return boolean`)
	}

	// Every action callback must be executable using its own defaults.
	for (const [, definition] of Object.entries(instance.actions)) {
		const options = defaultOptions(definition)
		await definition.callback({ options })
	}

	const refs = collectPresetReferences(presetResult.presets)
	for (const actionId of refs.actions) {
		assert.ok(instance.actions[actionId], `preset references missing action ${actionId}`)
	}
	for (const feedbackId of refs.feedbacks) {
		assert.ok(instance.feedbacks[feedbackId], `preset references missing feedback ${feedbackId}`)
	}

	const structuredPresetIds = new Set()
	for (const section of presetResult.structure) {
		for (const definition of section.definitions || []) {
			for (const presetId of definition.presets || []) structuredPresetIds.add(presetId)
		}
	}
	for (const presetId of Object.keys(presetResult.presets)) {
		assert.ok(structuredPresetIds.has(presetId), `preset ${presetId} is not present in structure`)
	}

	assert.ok(writes.length > 0, 'action smoke test did not exercise any writes')
})

test('API 2.0 CommonJS entrypoint exports the module class directly', () => {
	const entry = require('../src/main')
	assert.equal(typeof entry, 'function')
	assert.match(entry.name, /FocusriteScarlett18i20Instance/)
})
