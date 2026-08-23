'use strict'

const SUPPORTED_MODEL = 'Scarlett 18i20 (3rd Gen)'

// Hardware evidence is intentionally control-specific. A source-pair topology
// observation must never be promoted into a mute/stereo/nickname conclusion.
const PAIR_SOURCE_RIGHT_OUTPUTS = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25])
const MISMATCH_OUTPUT_MUTES = new Set([1, 3, 5, 7, 9])
const NO_EFFECT_OUTPUT_STEREO = new Set([1, 3, 5])
const NO_EFFECT_OUTPUT_NICKNAMES = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25])
const NO_EFFECT_OUTPUT_GAINS = new Set([3, 5, 7, 9])

function isSupportedModel(device) {
	return device?.model === SUPPORTED_MODEL
}

function outputIndex(outputOrIndex) {
	if (Number.isInteger(outputOrIndex)) return outputOrIndex
	return Number.isInteger(outputOrIndex?.index) ? outputOrIndex.index : null
}

function setForOutputControl(control) {
	if (control === 'source') return PAIR_SOURCE_RIGHT_OUTPUTS
	if (control === 'mute') return MISMATCH_OUTPUT_MUTES
	if (control === 'stereo') return NO_EFFECT_OUTPUT_STEREO
	if (control === 'nickname') return NO_EFFECT_OUTPUT_NICKNAMES
	if (control === 'gain') return NO_EFFECT_OUTPUT_GAINS
	return null
}

function directOutputWriteSupported(device, output, control) {
	if (!output?.[control]) return false
	// Unknown/unvalidated models fail closed. The current production module also
	// rejects them earlier, but the policy itself must never become permissive.
	if (!isSupportedModel(device)) return false
	const blocked = setForOutputControl(control)
	return !blocked?.has(output.index)
}

function mixerSlotWriteSupported(device, control) {
	if (!isSupportedModel(device)) return false
	// Source 1-4 and Stereo 3-4 were hardware-tested no-effect. Until a useful
	// slot write path is proven, keep the whole public family read-only.
	return !['source', 'stereo'].includes(control)
}

function mixLaneWriteSupported(device, control) {
	if (!isSupportedModel(device)) return false
	// Six left-lane Talkback controls were hardware-tested no-effect. Preserve
	// lane state/feedback, but withhold the public write family for now.
	return control !== 'talkback'
}

function rawItemWriteSupported(device, id) {
	if (!isSupportedModel(device) || !device?.writableIds?.has(String(id))) return false

	const descriptor = device.descriptors?.get(String(id))
	if (!descriptor) return false
	if (descriptor.category === 'output') {
		const output = device.outputs?.[Number(descriptor.ownerIndex)]
		return directOutputWriteSupported(device, output, descriptor.control)
	}
	if (descriptor.category === 'mixer-slot') return mixerSlotWriteSupported(device, descriptor.control)
	if (descriptor.category === 'mix' && descriptor.control === 'talkback') return false
	return true
}

module.exports = {
	SUPPORTED_MODEL,
	PAIR_SOURCE_RIGHT_OUTPUTS,
	MISMATCH_OUTPUT_MUTES,
	NO_EFFECT_OUTPUT_STEREO,
	NO_EFFECT_OUTPUT_NICKNAMES,
	NO_EFFECT_OUTPUT_GAINS,
	isSupportedModel,
	directOutputWriteSupported,
	mixerSlotWriteSupported,
	mixLaneWriteSupported,
	rawItemWriteSupported,
}
