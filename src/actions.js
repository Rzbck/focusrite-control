const { boolValue, clamp, choice } = require('./utils')

const BOOL_CHOICES = [
	choice('on', 'On'),
	choice('off', 'Off'),
	choice('toggle', 'Toggle'),
]

function stateValue(instance, itemId) {
	return itemId ? instance.client?.getValue(itemId) : undefined
}

function setBoolean(instance, itemId, requested) {
	if (!itemId) return instance.log('warn', 'This control is not available on the connected device')
	if (requested === 'toggle') {
		const current = stateValue(instance, itemId)
		if (current === undefined || current === null || String(current).trim() === '') {
			instance.log('warn', `Cannot toggle Focusrite item ${itemId}: current server state is unknown`)
			return
		}
		const normalized = String(current).trim().toLowerCase()
		if (!['true', 'false', '1', '0'].includes(normalized)) {
			instance.log('warn', `Cannot toggle Focusrite item ${itemId}: current server state '${current}' is not boolean`)
			return
		}
		instance.setItem(itemId, boolValue(current) ? 'false' : 'true')
	} else {
		instance.setItem(itemId, requested === 'on' ? 'true' : 'false')
	}
}

function numericState(instance, itemId, controlName) {
	const current = stateValue(instance, itemId)
	if (current === undefined || current === null || String(current).trim() === '') {
		instance.log('warn', `Cannot adjust ${controlName}: current server state is unknown`)
		return null
	}
	const number = Number(current)
	if (!Number.isFinite(number)) {
		instance.log('warn', `Cannot adjust ${controlName}: current server state '${current}' is not numeric`)
		return null
	}
	return number
}

function enumChoices(values) {
	return (values || []).map((value) => choice(value, value))
}

function hardwareInputChoices(instance, filter = () => true) {
	return (instance.device?.hardwareInputs || []).filter(filter).map((input, index) => choice(index, input.name))
}

function outputChoices(instance, filter = () => true) {
	return (instance.device?.outputs || []).filter(filter).map((output) => choice(output.index, output.name))
}

function outputPairChoices(instance, filter = () => true) {
	return (instance.device?.outputs || [])
		.filter((output) => output.pairSide === 'L' && output.pairIndex !== undefined && filter(output))
		.map((output) => choice(output.index, output.pairLabel || output.name))
}

function sourceChoices(instance, includeHidden = false, includeMixes = false, includeNone = true) {
	const choices = includeNone ? [choice('0', 'None / Unassigned')] : []
	for (const source of instance.device?.sources || []) {
		if (!includeHidden && source.hidden) continue
		choices.push(choice(source.id, source.name))
	}
	if (includeMixes) {
		for (const mix of instance.device?.mixes || []) choices.push(choice(mix.id, mix.label || mix.name))
	}
	return choices
}

function pairedSourceChoices(instance) {
	const choices = [choice('0', 'None / Unassigned')]
	for (const source of instance.device?.sources || []) {
		if (source.hidden || source.pairSide !== 'L' || !source.pairId) continue
		choices.push(choice(source.id, source.pairLabel || source.name))
	}
	for (const mix of instance.device?.mixes || []) {
		if (mix.side === 'L' && mix.pairId) choices.push(choice(mix.id, mix.name))
	}
	return choices
}

function uniqueMixChoices(instance) {
	const names = [...new Set((instance.device?.mixes || []).map((mix) => mix.name).filter(Boolean))]
	return names.map((name) => choice(name, name))
}

function getMixLanes(instance, name, side) {
	const lanes = (instance.device?.mixes || []).filter((mix) => mix.name === name)
	if (side === 'left') return lanes.filter((mix) => mix.side === 'L')
	if (side === 'right') return lanes.filter((mix) => mix.side === 'R')
	return lanes
}

function safeItemChoices(instance) {
	const ids = instance.device?.writableIds || new Set()
	return [...ids]
		.map((id) => {
			const descriptor = instance.device.descriptors.get(String(id))
			return choice(id, `${id} — ${descriptor?.name || descriptor?.tag || 'control'}`)
		})
		.sort((a, b) => Number(a.id) - Number(b.id))
}

function updateActions(instance) {
	const device = instance.device
	const monitoring = device?.monitoring || {}
	const settings = device?.settings || {}
	const actions = {}

	const addMonitorBool = (id, name, itemId) => {
		if (!itemId) return
		actions[id] = {
			name,
			options: [
				{ type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' },
			],
			callback: async (event) => setBoolean(instance, itemId, event.options.state),
		}
	}
	addMonitorBool('monitor_mute', 'Monitor: Mute', monitoring.mute)
	addMonitorBool('monitor_dim', 'Monitor: Dim', monitoring.dim)
	addMonitorBool('monitor_talkback', 'Monitor: Talkback', monitoring.talkback)
	addMonitorBool('monitor_alt_enable', 'Monitor: Alt speakers enable', monitoring.altEnable)
	addMonitorBool('monitor_alt', 'Monitor: Select Alt speakers', monitoring.alt)

	if (monitoring.preset && monitoring.presetValues?.length) {
		actions.monitor_preset = {
			name: 'Monitor: Outputs controlled by Monitor/Dim/Mute',
			options: [
				{
					type: 'dropdown',
					id: 'preset',
					label: 'Monitor control outputs',
					choices: enumChoices(monitoring.presetValues),
					default: monitoring.presetValues[0],
				},
			],
			callback: async (event) => instance.setItem(monitoring.preset, event.options.preset),
		}
	}

	if (device?.hardwareInputs?.some((i) => i.air)) {
		actions.input_air = {
			name: 'Input: Air',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Analogue input',
					choices: hardwareInputChoices(instance, (i) => i.air),
					default: String(device.hardwareInputs.findIndex((i) => i.air)),
				},
				{ type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' },
			],
			callback: async (event) => {
				const input = device.hardwareInputs[Number(event.options.input)]
				setBoolean(instance, input?.air, event.options.state)
			},
		}
	}

	if (device?.hardwareInputs?.some((i) => i.pad)) {
		actions.input_pad = {
			name: 'Input: Pad',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Analogue input',
					choices: hardwareInputChoices(instance, (i) => i.pad),
					default: String(device.hardwareInputs.findIndex((i) => i.pad)),
				},
				{ type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' },
			],
			callback: async (event) => {
				const input = device.hardwareInputs[Number(event.options.input)]
				setBoolean(instance, input?.pad, event.options.state)
			},
		}
	}

	if (device?.hardwareInputs?.some((i) => i.mode)) {
		actions.input_mode = {
			name: 'Input: Set Line/Instrument mode',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Analogue input',
					choices: hardwareInputChoices(instance, (i) => i.mode),
					default: '0',
				},
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					choices: [...new Set(device.hardwareInputs.flatMap((i) => i.modeValues || []))].map((v) => choice(v, v)),
					default: 'Line',
				},
			],
			callback: async (event) => {
				const input = device.hardwareInputs[Number(event.options.input)]
				if (!input?.mode || !(input.modeValues || []).includes(event.options.mode)) {
					instance.log('warn', `${event.options.mode} is not valid for ${input?.name || 'this input'}`)
					return
				}
				instance.setItem(input.mode, event.options.mode)
			},
		}
		actions.input_mode_cycle = {
			name: 'Input: Cycle mode',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Analogue input',
					choices: hardwareInputChoices(instance, (i) => i.mode),
					default: '0',
				},
			],
			callback: async (event) => {
				const input = device.hardwareInputs[Number(event.options.input)]
				const values = input?.modeValues || []
				if (!input?.mode || !values.length) return
				const current = stateValue(instance, input.mode)
				const index = values.indexOf(current)
				if (index < 0) {
					instance.log('warn', `Cannot cycle ${input.name}: current server state is unknown or invalid`)
					return
				}
				instance.setItem(input.mode, values[(index + 1) % values.length])
			},
		}
	}

	if (device?.hardwareInputs?.some((i) => i.nickname)) {
		actions.input_nickname = {
			name: 'Input: Set nickname',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Analogue input',
					choices: hardwareInputChoices(instance, (i) => i.nickname),
					default: '0',
				},
				{ type: 'textinput', id: 'name', label: 'Nickname', default: '', useVariables: true },
			],
			callback: async (event) => {
				const input = device.hardwareInputs[Number(event.options.input)]
				if (input?.nickname) instance.setItem(input.nickname, event.options.name)
			},
		}
	}

	if (device?.outputs?.some((o) => o.mute)) {
		actions.output_mute = {
			name: 'Output: Mute',
			options: [
				{
					type: 'dropdown',
					id: 'output',
					label: 'Output',
					choices: outputChoices(instance, (o) => o.mute),
					default: String(device.outputs.find((o) => o.mute)?.index ?? 0),
				},
				{
					type: 'dropdown',
					id: 'scope',
					label: 'Apply to',
					choices: [choice('single', 'Selected output only'), choice('pair', 'Stereo pair (if available)')],
					default: 'single',
				},
				{ type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' },
			],
			callback: async (event) => {
				const output = device.outputs[Number(event.options.output)]
				const targets = [output]
				if (event.options.scope === 'pair' && output?.pairIndex !== undefined) targets.push(device.outputs[output.pairIndex])
				for (const target of targets.filter(Boolean)) setBoolean(instance, target.mute, event.options.state)
			},
		}
	}

	if (device?.outputs?.some((o) => o.gain)) {
		actions.output_gain_set = {
			name: 'Output: Set analogue level',
			options: [
				{
					type: 'dropdown',
					id: 'output',
					label: 'Analogue output',
					choices: outputChoices(instance, (o) => o.gain),
					default: String(device.outputs.find((o) => o.gain)?.index ?? 0),
				},
				{ type: 'number', id: 'level', label: 'Level (dB)', default: 0, min: -128, max: 0 },
			],
			callback: async (event) => {
				const output = device.outputs[Number(event.options.output)]
				if (output?.gain) instance.setItem(output.gain, String(event.options.level))
			},
		}
		actions.output_gain_adjust = {
			name: 'Output: Adjust analogue level',
			options: [
				{
					type: 'dropdown',
					id: 'output',
					label: 'Analogue output',
					choices: outputChoices(instance, (o) => o.gain),
					default: String(device.outputs.find((o) => o.gain)?.index ?? 0),
				},
				{ type: 'number', id: 'step', label: 'Relative change (dB)', default: 1, min: -128, max: 128 },
			],
			callback: async (event) => {
				const output = device.outputs[Number(event.options.output)]
				if (!output?.gain) return
				const current = numericState(instance, output.gain, `${output.name} gain`)
				if (current === null) return
				instance.setItem(output.gain, String(clamp(current + Number(event.options.step), -128, 0)))
			},
		}
	}

	if (device?.outputs?.some((o) => o.source)) {
		actions.output_source = {
			name: 'Output: Route source (single channel)',
			options: [
				{
					type: 'dropdown',
					id: 'output',
					label: 'Output',
					choices: outputChoices(instance, (o) => o.source),
					default: String(device.outputs.find((o) => o.source)?.index ?? 0),
				},
				{
					type: 'dropdown',
					id: 'source',
					label: 'Source',
					choices: sourceChoices(instance, false, true),
					default: '0',
				},
			],
			callback: async (event) => {
				const output = device.outputs[Number(event.options.output)]
				if (output?.source) instance.setItem(output.source, event.options.source)
			},
		}

		const pairOutputs = outputPairChoices(instance, (o) => o.source)
		const pairSources = pairedSourceChoices(instance)
		if (pairOutputs.length && pairSources.length) {
			actions.output_pair_source = {
				name: 'Output: Route stereo pair',
				options: [
					{
						type: 'dropdown',
						id: 'output',
						label: 'Output pair',
						choices: pairOutputs,
						default: pairOutputs[0].id,
					},
					{
						type: 'dropdown',
						id: 'source',
						label: 'Stereo source pair',
						choices: pairSources,
						default: '0',
					},
				],
				callback: async (event) => {
					const leftOut = device.outputs[Number(event.options.output)]
					const rightOut = leftOut?.pairIndex !== undefined ? device.outputs[leftOut.pairIndex] : null
					if (!leftOut?.source || !rightOut?.source) return

					if (event.options.source === '0') {
						instance.setItem(leftOut.source, '0')
						instance.setItem(rightOut.source, '0')
						return
					}

					const leftSource =
						device.sources.find((s) => String(s.id) === String(event.options.source)) ||
						device.mixes.find((m) => String(m.id) === String(event.options.source))
					const rightId = leftSource?.pairId
					if (!rightId) {
						instance.log('warn', 'Selected source does not have a known right-channel pair')
						return
					}
					instance.setItem(leftOut.source, String(leftSource.id))
					instance.setItem(rightOut.source, String(rightId))
				},
			}
		}
	}

	if (device?.outputs?.some((o) => o.stereo)) {
		actions.output_stereo = {
			name: 'Output: Stereo link flag',
			options: [
				{
					type: 'dropdown',
					id: 'output',
					label: 'Output',
					choices: outputChoices(instance, (o) => o.stereo),
					default: String(device.outputs.find((o) => o.stereo)?.index ?? 0),
				},
				{ type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' },
			],
			callback: async (event) => {
				const output = device.outputs[Number(event.options.output)]
				setBoolean(instance, output?.stereo, event.options.state)
			},
		}
	}

	if (device?.outputs?.some((o) => o.nickname)) {
		actions.output_nickname = {
			name: 'Output: Set nickname',
			options: [
				{
					type: 'dropdown',
					id: 'output',
					label: 'Output',
					choices: outputChoices(instance, (o) => o.nickname),
					default: String(device.outputs.find((o) => o.nickname)?.index ?? 0),
				},
				{ type: 'textinput', id: 'name', label: 'Nickname', default: '', useVariables: true },
			],
			callback: async (event) => {
				const output = device.outputs[Number(event.options.output)]
				if (output?.nickname) instance.setItem(output.nickname, event.options.name)
			},
		}
	}

	if (device?.mixerSlots?.length) {
		actions.mixer_slot_source = {
			name: 'Mixer: Assign source to input slot',
			options: [
				{ type: 'number', id: 'slot', label: 'Mixer input slot', default: 1, min: 1, max: device.mixerSlots.length },
				{
					type: 'dropdown',
					id: 'source',
					label: 'Hardware / Playback source',
					choices: sourceChoices(instance, false, false, false),
					default: sourceChoices(instance, false, false, false)[0]?.id || '',
				},
			],
			callback: async (event) => {
				const slot = device.mixerSlots[Number(event.options.slot) - 1]
				if (slot?.source) instance.setItem(slot.source, event.options.source)
			},
		}
		actions.mixer_slot_stereo = {
			name: 'Mixer: Input slot stereo link',
			options: [
				{ type: 'number', id: 'slot', label: 'Mixer input slot', default: 1, min: 1, max: device.mixerSlots.length },
				{ type: 'dropdown', id: 'state', label: 'Stereo', choices: BOOL_CHOICES, default: 'toggle' },
			],
			callback: async (event) => {
				const slot = device.mixerSlots[Number(event.options.slot) - 1]
				setBoolean(instance, slot?.stereo, event.options.state)
			},
		}
	}

	const mixChoices = uniqueMixChoices(instance)
	const mixSideOptions = [
		choice('both', 'Both L + R'),
		choice('left', 'Left lane'),
		choice('right', 'Right lane'),
	]
	const mixBaseOptions = [
		{ type: 'dropdown', id: 'mix', label: 'Mix', choices: mixChoices, default: mixChoices[0]?.id || 'Mix A' },
		{ type: 'dropdown', id: 'side', label: 'Lane(s)', choices: mixSideOptions, default: 'both' },
		{ type: 'number', id: 'slot', label: 'Mixer input slot', default: 1, min: 1, max: 24 },
	]
	if (device?.mixes?.length) {
		actions.mix_mute = {
			name: 'Mixer: Mute slot',
			options: [...mixBaseOptions, { type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' }],
			callback: async (event) => {
				for (const lane of getMixLanes(instance, event.options.mix, event.options.side)) {
					const input = lane.inputs[Number(event.options.slot) - 1]
					setBoolean(instance, input?.mute, event.options.state)
				}
			},
		}
		actions.mix_solo = {
			name: 'Mixer: Solo slot',
			options: [...mixBaseOptions, { type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' }],
			callback: async (event) => {
				for (const lane of getMixLanes(instance, event.options.mix, event.options.side)) {
					const input = lane.inputs[Number(event.options.slot) - 1]
					setBoolean(instance, input?.solo, event.options.state)
				}
			},
		}
		actions.mix_gain_set = {
			name: 'Mixer: Set slot fader',
			options: [...mixBaseOptions, { type: 'number', id: 'level', label: 'Level (dB)', default: 0, min: -128, max: 6 }],
			callback: async (event) => {
				for (const lane of getMixLanes(instance, event.options.mix, event.options.side)) {
					const input = lane.inputs[Number(event.options.slot) - 1]
					if (input?.gain) instance.setItem(input.gain, String(event.options.level))
				}
			},
		}
		actions.mix_gain_adjust = {
			name: 'Mixer: Adjust slot fader',
			options: [...mixBaseOptions, { type: 'number', id: 'step', label: 'Relative change (dB)', default: 1, min: -128, max: 128 }],
			callback: async (event) => {
				for (const lane of getMixLanes(instance, event.options.mix, event.options.side)) {
					const input = lane.inputs[Number(event.options.slot) - 1]
					if (!input?.gain) continue
					const current = numericState(instance, input.gain, `${lane.label} slot ${Number(event.options.slot)} gain`)
					if (current === null) continue
					instance.setItem(input.gain, String(clamp(current + Number(event.options.step), -128, 6)))
				}
			},
		}
		actions.mix_pan = {
			name: 'Mixer: Set slot pan',
			options: [...mixBaseOptions, { type: 'number', id: 'pan', label: 'Pan (-100 left, 0 centre, +100 right)', default: 0, min: -100, max: 100 }],
			callback: async (event) => {
				const raw = Math.round(((Number(event.options.pan) + 100) / 200) * 65535)
				for (const lane of getMixLanes(instance, event.options.mix, event.options.side)) {
					const input = lane.inputs[Number(event.options.slot) - 1]
					if (input?.pan) instance.setItem(input.pan, String(raw))
				}
			},
		}
		actions.mix_talkback = {
			name: 'Mixer: Talkback to mix',
			options: [
				{ type: 'dropdown', id: 'mix', label: 'Mix', choices: mixChoices, default: mixChoices[0]?.id || 'Mix A' },
				{ type: 'dropdown', id: 'side', label: 'Lane(s)', choices: mixSideOptions, default: 'both' },
				{ type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' },
			],
			callback: async (event) => {
				for (const lane of getMixLanes(instance, event.options.mix, event.options.side)) {
					setBoolean(instance, lane.talkback, event.options.state)
				}
			},
		}
	}

	if (device?.nickname) {
		actions.device_nickname = {
			name: 'Device: Set nickname',
			options: [{ type: 'textinput', id: 'name', label: 'Device nickname', default: '', useVariables: true }],
			callback: async (event) => instance.setItem(device.nickname, event.options.name),
		}
	}

	if (settings.devicePreset && settings.devicePresetValues?.length) {
		actions.device_preset = {
			name: 'Device: Recall routing preset (changes routing)',
			options: [
				{
					type: 'dropdown',
					id: 'preset',
					label: 'Preset',
					choices: enumChoices(settings.devicePresetValues),
					default: settings.devicePresetValues[0],
				},
			],
			callback: async (event) => instance.setItem(settings.devicePreset, event.options.preset),
		}
	}
	if (settings.clockSource && settings.clockSourceValues?.length) {
		actions.clock_source = {
			name: 'Device: Set clock source',
			options: [
				{
					type: 'dropdown',
					id: 'source',
					label: 'Clock source',
					choices: enumChoices(settings.clockSourceValues),
					default: settings.clockSourceValues[0],
				},
			],
			callback: async (event) => instance.setItem(settings.clockSource, event.options.source),
		}
	}
	if (settings.sampleRate && settings.sampleRateValues?.length) {
		actions.sample_rate = {
			name: 'Device: Set sample rate (interrupts audio)',
			options: [
				{
					type: 'dropdown',
					id: 'rate',
					label: 'Sample rate — changing this can interrupt audio',
					choices: enumChoices(settings.sampleRateValues),
					default: settings.sampleRateValues[0],
				},
			],
			callback: async (event) => instance.setItem(settings.sampleRate, event.options.rate),
		}
	}
	if (settings.spdifMode && settings.spdifModeValues?.length) {
		actions.spdif_mode = {
			name: 'Device: Set Digital I/O mode (device restart required)',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Digital I/O mode — device restart required',
					choices: enumChoices(settings.spdifModeValues),
					default: settings.spdifModeValues[0],
				},
			],
			callback: async (event) => instance.setItem(settings.spdifMode, event.options.mode),
		}
	}
	if (settings.phantomPersistence) {
		actions.phantom_persistence = {
			name: 'Device: Phantom power persistence',
			options: [{ type: 'dropdown', id: 'state', label: 'State', choices: BOOL_CHOICES, default: 'toggle' }],
			callback: async (event) => setBoolean(instance, settings.phantomPersistence, event.options.state),
		}
	}
	if (settings.talkbackInputSource) {
		const tbChoices = (device.sources || [])
			.filter((source) => source.supportsTalkback || source.name === 'Scarlett Internal Mic')
			.map((source) => choice(source.name, source.hidden ? `${source.name} (internal)` : source.name))
		if (tbChoices.length) {
			actions.talkback_source = {
				name: 'Talkback: Select input source',
				options: [
					{
						type: 'dropdown',
						id: 'source',
						label: 'Talkback source',
						choices: tbChoices,
						default: tbChoices[0].id,
					},
				],
				callback: async (event) => instance.setItem(settings.talkbackInputSource, event.options.source),
			}
		}
	}

	actions.reconnect = {
		name: 'Connection: Rediscover and reconnect',
		options: [],
		callback: async () => instance.reconnectNow(),
	}

	if (instance.config.enableAdvancedRawWrites && device?.writableIds?.size) {
		actions.advanced_raw_set = {
			name: 'Advanced: Set known-safe raw item',
			options: [
				{
					type: 'dropdown',
					id: 'item',
					label: 'Known writable item',
					choices: safeItemChoices(instance),
					default: safeItemChoices(instance)[0]?.id || '',
				},
				{ type: 'textinput', id: 'value', label: 'Raw value', default: '', useVariables: true },
			],
			callback: async (event) => {
				if (!device.writableIds.has(String(event.options.item))) {
					instance.log('error', `Blocked raw write to unknown/read-only item ${event.options.item}`)
					return
				}
				instance.setItem(event.options.item, event.options.value)
			},
		}
	}

	instance.setActionDefinitions(actions)
}

module.exports = { updateActions }
