'use strict'

const {
	isSupportedModel,
	directOutputWriteSupported,
	rawItemWriteSupported,
} = require('./hardware-policy')

function outputFromChoice(instance, choice) {
	return instance.device?.outputs?.[Number(choice?.id)]
}

function filterOutputOption(instance, definition, control) {
	return {
		...definition,
		options: (definition.options || []).map((option) => {
			if (option.id !== 'output' || !Array.isArray(option.choices)) return option
			const choices = option.choices.filter((choice) =>
				directOutputWriteSupported(instance.device, outputFromChoice(instance, choice), control),
			)
			return { ...option, choices, default: choices.some((choice) => choice.id === option.default) ? option.default : choices[0]?.id }
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
			if (!directOutputWriteSupported(instance.device, output, control)) {
				instance.log('warn', `Direct ${control} write is not supported for ${output?.name || 'this output'} on the validated hardware profile`)
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

function filterAdvancedRaw(instance, definition) {
	const callback = definition.callback
	return {
		...definition,
		options: (definition.options || []).map((option) => {
			if (option.id !== 'item' || !Array.isArray(option.choices)) return option
			const choices = option.choices.filter((choice) => rawItemWriteSupported(instance.device, choice.id))
			return { ...option, choices, default: choices.some((choice) => choice.id === option.default) ? option.default : choices[0]?.id }
		}),
		callback: async (event) => {
			if (!rawItemWriteSupported(instance.device, event.options.item)) {
				instance.log('error', `Blocked raw write to hardware-tested read-only/no-effect item ${event.options.item}`)
				return
			}
			return callback(event)
		},
	}
}

function filterActionDefinitions(instance, definitions) {
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

	// These schema items are still retained as readable state/feedback, but the
	// current 18i20 Gen3 hardware campaign confirmed no useful write transition.
	delete actions.mixer_slot_source
	delete actions.mixer_slot_stereo
	delete actions.mix_talkback

	if (actions.advanced_raw_set) actions.advanced_raw_set = filterAdvancedRaw(instance, actions.advanced_raw_set)
	return actions
}

function presetUsesBlockedOutputMute(instance, preset) {
	for (const step of preset.steps || []) {
		for (const action of [...(step.down || []), ...(step.up || [])]) {
			if (action.actionId !== 'output_mute') continue
			const output = instance.device?.outputs?.[Number(action.options?.output)]
			if (!directOutputWriteSupported(instance.device, output, 'mute')) return true
		}
	}
	return false
}

function filterPresetDefinitions(instance, structure, presets) {
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
	installDefinitionPolicy,
}
