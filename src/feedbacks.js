const { combineRgb } = require('@companion-module/base')
const { boolValue, choice } = require('./utils')

const RED = combineRgb(220, 0, 0)
const GREEN = combineRgb(0, 170, 0)
const AMBER = combineRgb(220, 140, 0)
const BLUE = combineRgb(0, 100, 220)
const WHITE = combineRgb(255, 255, 255)
const BLACK = combineRgb(0, 0, 0)

function value(instance, id) {
	return id ? instance.client?.getValue(id) : undefined
}

function numericValue(instance, id) {
	const raw = value(instance, id)
	if (raw === undefined || raw === null || String(raw).trim() === '') return null
	const number = Number(raw)
	return Number.isFinite(number) ? number : null
}

function meterAboveThreshold(instance, id, threshold) {
	const meter = numericValue(instance, id)
	return meter !== null && meter >= Number(threshold)
}

function updateFeedbacks(instance) {
	const device = instance.device
	const monitoring = device?.monitoring || {}
	const settings = device?.settings || {}
	const inputChoices = (device?.hardwareInputs || []).map((input, index) => choice(index, input.name))
	const outputChoices = (device?.outputs || []).map((output) => choice(output.index, output.name))
	const mixNames = [...new Set((device?.mixes || []).map((mix) => mix.name))].map((name) => choice(name, name))
	const sourceChoices = [choice('0', 'None / Unassigned')]
	for (const source of device?.sources || []) if (!source.hidden) sourceChoices.push(choice(source.id, source.name))
	for (const mix of device?.mixes || []) sourceChoices.push(choice(mix.id, mix.label || mix.name))

	const defs = {
		connected: {
			type: 'boolean',
			name: 'Connection: Scarlett online',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => Boolean(instance.client?.connected && instance.device),
		},
		authorised: {
			type: 'boolean',
			name: 'Connection: Focusrite control authorised',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => instance.client?.authorised === true,
		},
	}

	if (monitoring.mute) {
		defs.monitor_mute = {
			type: 'boolean',
			name: 'Monitor: Muted',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [],
			callback: () => boolValue(value(instance, monitoring.mute)),
		}
	}
	if (monitoring.dim) {
		defs.monitor_dim = {
			type: 'boolean',
			name: 'Monitor: Dim active',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: [],
			callback: () => boolValue(value(instance, monitoring.dim)),
		}
	}
	if (monitoring.talkback) {
		defs.monitor_talkback = {
			type: 'boolean',
			name: 'Monitor: Talkback active',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => boolValue(value(instance, monitoring.talkback)),
		}
	}
	if (monitoring.alt) {
		defs.monitor_alt = {
			type: 'boolean',
			name: 'Monitor: Alt speakers selected',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [],
			callback: () => boolValue(value(instance, monitoring.alt)),
		}
	}
	if (monitoring.altEnable) {
		defs.monitor_alt_enable = {
			type: 'boolean',
			name: 'Monitor: Alt speakers enabled',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [],
			callback: () => boolValue(value(instance, monitoring.altEnable)),
		}
	}
	if (monitoring.preset) {
		defs.monitor_preset = {
			type: 'boolean',
			name: 'Monitor: Control output preset equals',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [
				{
					type: 'dropdown',
					id: 'value',
					label: 'Preset',
					choices: (monitoring.presetValues || []).map((v) => choice(v, v)),
					default: monitoring.presetValues?.[0] || '',
				},
			],
			callback: (feedback) => value(instance, monitoring.preset) === feedback.options.value,
		}
	}

	if (inputChoices.length) {
		defs.input_air = {
			type: 'boolean',
			name: 'Input: Air enabled',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: [{ type: 'dropdown', id: 'input', label: 'Input', choices: inputChoices, default: inputChoices[0].id }],
			callback: (feedback) => {
				const input = device.hardwareInputs[Number(feedback.options.input)]
				return Boolean(input?.air && boolValue(value(instance, input.air)))
			},
		}
		defs.input_pad = {
			type: 'boolean',
			name: 'Input: Pad enabled',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [{ type: 'dropdown', id: 'input', label: 'Input', choices: inputChoices, default: inputChoices[0].id }],
			callback: (feedback) => {
				const input = device.hardwareInputs[Number(feedback.options.input)]
				return Boolean(input?.pad && boolValue(value(instance, input.pad)))
			},
		}
		const modeValues = [...new Set(device.hardwareInputs.flatMap((input) => input.modeValues || []))]
		if (modeValues.length) {
			defs.input_mode = {
				type: 'boolean',
				name: 'Input: Mode equals',
				defaultStyle: { bgcolor: AMBER, color: BLACK },
				options: [
					{ type: 'dropdown', id: 'input', label: 'Input', choices: inputChoices, default: inputChoices[0].id },
					{
						type: 'dropdown',
						id: 'mode',
						label: 'Mode',
						choices: modeValues.map((v) => choice(v, v)),
						default: modeValues[0],
					},
				],
				callback: (feedback) => {
					const input = device.hardwareInputs[Number(feedback.options.input)]
					return Boolean(input?.mode && value(instance, input.mode) === feedback.options.mode)
				},
			}
		}
		defs.input_available = {
			type: 'boolean',
			name: 'Input: Available',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [{ type: 'dropdown', id: 'input', label: 'Input', choices: inputChoices, default: inputChoices[0].id }],
			callback: (feedback) => {
				const input = device.hardwareInputs[Number(feedback.options.input)]
				return Boolean(input?.available && boolValue(value(instance, input.available)))
			},
		}
		defs.input_meter = {
			type: 'boolean',
			name: 'Input: Meter above threshold',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'input', label: 'Input', choices: inputChoices, default: inputChoices[0].id },
				{ type: 'number', id: 'threshold', label: 'Threshold dBFS', default: -40, min: -128, max: 0 },
			],
			callback: (feedback) => {
				const input = device.hardwareInputs[Number(feedback.options.input)]
				return Boolean(input?.meter && meterAboveThreshold(instance, input.meter, feedback.options.threshold))
			},
		}
	}

	if (outputChoices.length) {
		defs.output_mute = {
			type: 'boolean',
			name: 'Output: Muted',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'output', label: 'Output', choices: outputChoices, default: outputChoices[0].id },
			],
			callback: (feedback) => {
				const output = device.outputs[Number(feedback.options.output)]
				return Boolean(output?.mute && boolValue(value(instance, output.mute)))
			},
		}
		defs.output_stereo = {
			type: 'boolean',
			name: 'Output: Stereo flag enabled',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'output', label: 'Output', choices: outputChoices, default: outputChoices[0].id },
			],
			callback: (feedback) => {
				const output = device.outputs[Number(feedback.options.output)]
				return Boolean(output?.stereo && boolValue(value(instance, output.stereo)))
			},
		}
		defs.output_source = {
			type: 'boolean',
			name: 'Output: Source equals',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'output', label: 'Output', choices: outputChoices, default: outputChoices[0].id },
				{ type: 'dropdown', id: 'source', label: 'Source', choices: sourceChoices, default: '0' },
			],
			callback: (feedback) => {
				const output = device.outputs[Number(feedback.options.output)]
				return Boolean(
					output?.source && String(value(instance, output.source) ?? '') === String(feedback.options.source),
				)
			},
		}
		defs.output_available = {
			type: 'boolean',
			name: 'Output: Available',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'output', label: 'Output', choices: outputChoices, default: outputChoices[0].id },
			],
			callback: (feedback) => {
				const output = device.outputs[Number(feedback.options.output)]
				return Boolean(output?.available && boolValue(value(instance, output.available)))
			},
		}
		defs.output_meter = {
			type: 'boolean',
			name: 'Output: Meter above threshold',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'output', label: 'Output', choices: outputChoices, default: outputChoices[0].id },
				{ type: 'number', id: 'threshold', label: 'Threshold dBFS', default: -40, min: -128, max: 0 },
			],
			callback: (feedback) => {
				const output = device.outputs[Number(feedback.options.output)]
				return Boolean(output?.meter && meterAboveThreshold(instance, output.meter, feedback.options.threshold))
			},
		}
	}

	if (mixNames.length) {
		const mixOptions = [
			{ type: 'dropdown', id: 'mix', label: 'Mix', choices: mixNames, default: mixNames[0].id },
			{
				type: 'dropdown',
				id: 'side',
				label: 'Lane',
				choices: [choice('left', 'Left'), choice('right', 'Right')],
				default: 'left',
			},
			{ type: 'number', id: 'slot', label: 'Mixer slot', default: 1, min: 1, max: 24 },
		]
		const getLane = (feedback) =>
			device.mixes.find(
				(mix) => mix.name === feedback.options.mix && mix.side === (feedback.options.side === 'left' ? 'L' : 'R'),
			)

		defs.mix_mute = {
			type: 'boolean',
			name: 'Mixer: Slot muted',
			defaultStyle: { bgcolor: RED, color: WHITE },
			options: mixOptions,
			callback: (feedback) => {
				const input = getLane(feedback)?.inputs?.[Number(feedback.options.slot) - 1]
				return Boolean(input?.mute && boolValue(value(instance, input.mute)))
			},
		}
		defs.mix_solo = {
			type: 'boolean',
			name: 'Mixer: Slot soloed',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: mixOptions,
			callback: (feedback) => {
				const input = getLane(feedback)?.inputs?.[Number(feedback.options.slot) - 1]
				return Boolean(input?.solo && boolValue(value(instance, input.solo)))
			},
		}
		defs.mix_talkback = {
			type: 'boolean',
			name: 'Mixer: Talkback mapped to mix lane',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'mix', label: 'Mix', choices: mixNames, default: mixNames[0].id },
				{
					type: 'dropdown',
					id: 'side',
					label: 'Lane',
					choices: [choice('left', 'Left'), choice('right', 'Right')],
					default: 'left',
				},
			],
			callback: (feedback) => {
				const lane = getLane(feedback)
				return Boolean(lane?.talkback && boolValue(value(instance, lane.talkback)))
			},
		}
		defs.mix_meter = {
			type: 'boolean',
			name: 'Mixer: Mix meter above threshold',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'mix', label: 'Mix', choices: mixNames, default: mixNames[0].id },
				{
					type: 'dropdown',
					id: 'side',
					label: 'Lane',
					choices: [choice('left', 'Left'), choice('right', 'Right')],
					default: 'left',
				},
				{ type: 'number', id: 'threshold', label: 'Threshold dBFS', default: -40, min: -128, max: 0 },
			],
			callback: (feedback) => {
				const lane = getLane(feedback)
				return Boolean(lane?.meter && meterAboveThreshold(instance, lane.meter, feedback.options.threshold))
			},
		}
	}

	if (device?.mixerSlots?.length) {
		defs.mixer_slot_stereo = {
			type: 'boolean',
			name: 'Mixer: Input slot stereo enabled',
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [{ type: 'number', id: 'slot', label: 'Mixer slot', default: 1, min: 1, max: device.mixerSlots.length }],
			callback: (feedback) => {
				const slot = device.mixerSlots[Number(feedback.options.slot) - 1]
				return Boolean(slot?.stereo && boolValue(value(instance, slot.stereo)))
			},
		}
		const plainSources = [choice('0', 'None / Unassigned')]
		for (const source of device.sources) if (!source.hidden) plainSources.push(choice(source.id, source.name))
		defs.mixer_slot_source = {
			type: 'boolean',
			name: 'Mixer: Input slot source equals',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'number', id: 'slot', label: 'Mixer slot', default: 1, min: 1, max: device.mixerSlots.length },
				{ type: 'dropdown', id: 'source', label: 'Source', choices: plainSources, default: '0' },
			],
			callback: (feedback) => {
				const slot = device.mixerSlots[Number(feedback.options.slot) - 1]
				return Boolean(slot?.source && String(value(instance, slot.source) ?? '') === String(feedback.options.source))
			},
		}
	}

	const enumFeedback = (id, name, itemId, values) => {
		if (!itemId || !values?.length) return
		defs[id] = {
			type: 'boolean',
			name,
			defaultStyle: { bgcolor: BLUE, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'value', label: 'Value', choices: values.map((v) => choice(v, v)), default: values[0] },
			],
			callback: (feedback) => value(instance, itemId) === feedback.options.value,
		}
	}
	enumFeedback('device_preset', 'Device: Routing preset equals', settings.devicePreset, settings.devicePresetValues)
	enumFeedback('clock_source', 'Device: Clock source equals', settings.clockSource, settings.clockSourceValues)
	enumFeedback('sample_rate', 'Device: Sample rate equals', settings.sampleRate, settings.sampleRateValues)
	enumFeedback('spdif_mode', 'Device: Digital I/O mode equals', settings.spdifMode, settings.spdifModeValues)

	if (settings.clockLocked) {
		defs.clock_locked = {
			type: 'boolean',
			name: 'Device: Clock locked',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [],
			callback: () => boolValue(value(instance, settings.clockLocked)),
		}
	}
	if (settings.talkbackInputSource) {
		const choices = (device.sources || [])
			.filter((source) => source.supportsTalkback || source.name === 'Scarlett Internal Mic')
			.map((source) => choice(source.name, source.name))
		defs.talkback_source = {
			type: 'boolean',
			name: 'Talkback: Source equals',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [{ type: 'dropdown', id: 'source', label: 'Source', choices, default: choices[0]?.id || '' }],
			callback: (feedback) => value(instance, settings.talkbackInputSource) === feedback.options.source,
		}
	}
	if (settings.phantomPersistence) {
		defs.phantom_persistence = {
			type: 'boolean',
			name: 'Device: Phantom persistence enabled',
			defaultStyle: { bgcolor: AMBER, color: BLACK },
			options: [],
			callback: () => boolValue(value(instance, settings.phantomPersistence)),
		}
	}

	if (instance.config.enableAdvancedRawWrites && device?.descriptors?.size) {
		const itemChoices = [...device.descriptors.keys()]
			.map((id) => {
				const d = device.descriptors.get(id)
				return choice(id, `${id} — ${d?.name || d?.tag || 'item'}`)
			})
			.sort((a, b) => Number(a.id) - Number(b.id))
		defs.generic_item_equals = {
			type: 'boolean',
			name: 'Advanced: Raw item equals value',
			defaultStyle: { bgcolor: GREEN, color: WHITE },
			options: [
				{ type: 'dropdown', id: 'item', label: 'Item', choices: itemChoices, default: itemChoices[0]?.id || '' },
				{ type: 'textinput', id: 'value', label: 'Expected value', default: '', useVariables: true },
			],
			callback: (feedback) => String(value(instance, feedback.options.item) ?? '') === String(feedback.options.value),
		}
	}

	instance.setFeedbackDefinitions(defs)
}

module.exports = { updateFeedbacks }
