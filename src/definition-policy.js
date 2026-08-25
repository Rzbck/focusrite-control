'use strict'

const {
	isSupportedModel,
	directOutputWriteSupported,
	outputPairSourceWriteSupported,
	rawItemWriteSupported,
} = require('./hardware-policy')

function outputFromChoice(instance, choice) {
	return instance.device?.outputs?.[Number(choice?.id)]
}

function serverValueReader(instance) {
	return (itemId) => instance.client?.getValue?.(itemId)
}

function filterOutputOption(instance, definition, control) {
	const getValue = serverValueReader(instance)
	return {
		...definition,
		options: (definition.options || []).map((option) => {
			if (option.id !== 'output' || !Array.isArray(option.choices)) return option
			const choices = option.choices.filter((choice) =>
				directOutputWriteSupported(instance.device, outputFromChoice(instance, choice), control, getValue),
			)
			return {
				...option,
				choices,
				default: choices.some((choice) => choice.id === option.default) ? option.default : choices[0]?.id,
			}
		}),
	}
}

function guardOutputCallback(instance, definition, control, { forceSingle = false } = {}) {
	const callback = definition.callback
	if (typeof callback !== 'function') return definition
	return {
		...definition,
		callback: async (event) => {
			const output = instance.device?.outputs?.[Number(event.options.output)]
			if (!directOutputWriteSupported(instance.device, output, control, serverValueReader(instance))) {
				instance.log(
					'warn',
					`Direct ${control} write is not supported or not server-confirmed available for ${output?.name || 'this output'} on the validated hardware profile`,
				)
				return
			}
			const nextEvent = forceSingle ? { ...event, options: { ...event.options, scope: 'single' } } : event
			return callback(nextEvent)
		},
	}
}

function filterOutputDefinition(instance, definition, control, options = {}) {
	let next = filterOutputOption(instance, definition, control)
	if (options.forceSingle) {
		next = {
			...next,
			options: (next.options || []).map((option) =>
				option.id === 'scope'
					? { ...option, choices: [{ id: 'single', label: 'Selected output only' }], default: 'single' }
					: option,
			),
		}
	}
	return guardOutputCallback(instance, next, control, options)
}

function filterPairSourceDefinition(instance, definition) {
	const callback = definition.callback
	const getValue = serverValueReader(instance)
	const next = {
		...definition,
		options: (definition.options || []).map((option) => {
			if (option.id !== 'output' || !Array.isArray(option.choices)) return option
			const choices = option.choices.filter((choice) =>
				outputPairSourceWriteSupported(instance.device, outputFromChoice(instance, choice), getValue),
			)
			return {
				...option,
				choices,
				default: choices.some((choice) => choice.id === option.default) ? option.default : choices[0]?.id,
			}
		}),
	}
	if (typeof callback !== 'function') return next
	return {
		...next,
		callback: async (event) => {
			const leftOutput = instance.device?.outputs?.[Number(event.options.output)]
			if (!outputPairSourceWriteSupported(instance.device, leftOutput, serverValueReader(instance))) {
				instance.log(
					'warn',
					`Stereo pair source write is blocked because the selected pair is unsupported or not server-confirmed available`,
				)
				return
			}
			return callback(event)
		},
	}
}

function filterResearchMixerSlotStereo(instance, definition) {
	// Research build only: the diagnostic mixer-variable option is already a
	// prerequisite for the dedicated TestBench. Keep this write surface absent
	// from normal connections while allowing a narrow explicit on/off path for
	// exact-restore topology research. Generic/public support remains withheld.
	if (instance.config?.exposeMixerVariables !== true) return null
	const callback = definition?.callback
	const next = {
		...definition,
		name: 'Research/TestBench: Mixer input slot stereo flag',
		options: (definition.options || []).map((option) => {
			if (option.id !== 'state' || !Array.isArray(option.choices)) return option
			const choices = option.choices.filter((choice) => ['on', 'off'].includes(String(choice.id)))
			return { ...option, choices, default: 'off' }
		}),
	}
	if (typeof callback !== 'function') return next
	return {
		...next,
		callback: async (event) => {
			const slotNumber = Number(event.options.slot)
			const slot = instance.device?.mixerSlots?.[slotNumber - 1]
			const requested = String(event.options.state || '').toLowerCase()
			if (!slot?.stereo || !['on', 'off'].includes(requested)) {
				instance.log('warn', 'Research mixer-slot stereo write blocked: invalid slot or non-explicit state')
				return
			}
			const current = serverValueReader(instance)(slot.stereo)
			if (current === undefined || current === null || String(current).trim() === '') {
				instance.log(
					'warn',
					`Research mixer-slot stereo write blocked for slot ${slotNumber}: current server state unknown`,
				)
				return
			}
			const normalized = String(current).trim().toLowerCase()
			if (!['true', 'false', '1', '0'].includes(normalized)) {
				instance.log('warn', `Research mixer-slot stereo write blocked for slot ${slotNumber}: invalid server state`)
				return
			}
			return callback(event)
		},
	}
}

function filterAdvancedRaw(instance, definition) {
	const callback = definition.callback
	const getValue = serverValueReader(instance)
	return {
		...definition,
		options: (definition.options || []).map((option) => {
			if (option.id !== 'item' || !Array.isArray(option.choices)) return option
			const choices = option.choices.filter((choice) => rawItemWriteSupported(instance.device, choice.id, getValue))
			return {
				...option,
				choices,
				default: choices.some((choice) => choice.id === option.default) ? option.default : choices[0]?.id,
			}
		}),
		callback: async (event) => {
			if (!rawItemWriteSupported(instance.device, event.options.item, serverValueReader(instance))) {
				instance.log(
					'error',
					`Blocked raw write to hardware-tested read-only/no-effect/unavailable item ${event.options.item}`,
				)
				return
			}
			return callback(event)
		},
	}
}

function filterActionDefinitions(instance, definitions) {
	if (instance.device && !isSupportedModel(instance.device)) {
		// Unvalidated hardware gets no state-changing action surface by default.
		return definitions.reconnect ? { reconnect: definitions.reconnect } : {}
	}
	if (!isSupportedModel(instance.device)) return definitions
	const actions = { ...definitions }

	for (const [id, control, options] of [
		['output_mute', 'mute', { forceSingle: true }],
		['output_gain_set', 'gain', {}],
		['output_gain_adjust', 'gain', {}],
		['output_source', 'source', {}],
		['output_stereo', 'stereo', {}],
		['output_nickname', 'nickname', {}],
	]) {
		if (actions[id]) actions[id] = filterOutputDefinition(instance, actions[id], control, options)
	}
	if (actions.output_pair_source)
		actions.output_pair_source = filterPairSourceDefinition(instance, actions.output_pair_source)

	// Mixer-slot source remains withheld. Mixer-slot stereo is exposed only to
	// the diagnostic mixer-variable configuration in this research build so the
	// existing TestBench can test pair/group semantics with exact restoration.
	delete actions.mixer_slot_source
	if (actions.mixer_slot_stereo) {
		const researchStereo = filterResearchMixerSlotStereo(instance, actions.mixer_slot_stereo)
		if (researchStereo) actions.mixer_slot_stereo = researchStereo
		else delete actions.mixer_slot_stereo
	}
	delete actions.mix_talkback

	if (actions.advanced_raw_set) actions.advanced_raw_set = filterAdvancedRaw(instance, actions.advanced_raw_set)
	return actions
}

function presetUsesBlockedOutputMute(instance, preset) {
	const getValue = serverValueReader(instance)
	for (const step of preset.steps || []) {
		for (const action of [...(step.down || []), ...(step.up || [])]) {
			if (action.actionId !== 'output_mute') continue
			const output = instance.device?.outputs?.[Number(action.options?.output)]
			if (!directOutputWriteSupported(instance.device, output, 'mute', getValue)) return true
		}
	}
	return false
}

function filterPresetDefinitions(instance, structure, presets) {
	if (instance.device && !isSupportedModel(instance.device)) return { structure: [], presets: {} }
	if (!isSupportedModel(instance.device)) return { structure, presets }
	const filteredPresets = Object.fromEntries(
		Object.entries(presets || {}).filter(([, preset]) => !presetUsesBlockedOutputMute(instance, preset)),
	)
	const filteredStructure = (structure || []).map((section) => ({
		...section,
		definitions: (section.definitions || []).map((definition) => ({
			...definition,
			presets: (definition.presets || []).filter((presetId) => filteredPresets[presetId]),
		})),
	}))
	return { structure: filteredStructure, presets: filteredPresets }
}

function installDefinitionPolicy(instance) {
	if (instance.__focusriteDefinitionPolicyInstalled) return
	instance.__focusriteDefinitionPolicyInstalled = true

	const setActionDefinitions = instance.setActionDefinitions.bind(instance)
	instance.setActionDefinitions = (definitions) => setActionDefinitions(filterActionDefinitions(instance, definitions))

	const setPresetDefinitions = instance.setPresetDefinitions.bind(instance)
	instance.setPresetDefinitions = (structure, presets) => {
		const filtered = filterPresetDefinitions(instance, structure, presets)
		return setPresetDefinitions(filtered.structure, filtered.presets)
	}
}

module.exports = {
	filterActionDefinitions,
	filterPresetDefinitions,
	filterResearchMixerSlotStereo,
	installDefinitionPolicy,
}
