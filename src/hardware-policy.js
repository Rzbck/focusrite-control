'use strict'

const SUPPORTED_MODEL = 'Scarlett 18i20 (3rd Gen)'

// Hardware-tested on the current 18i20 Gen3 validation device.
// These AVAILABLE right members expose server state, but direct per-member
// writes for mute/source/stereo/nickname did not produce an independent
// transition. The source IDs remain usable internally by the pair topology
// research path, but they must not be offered as normal direct/raw writes.
const OBSERVED_PAIR_RIGHT_OUTPUTS = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25])

// Monitor Output 2 gain is independently writable. The tested right members
// of Line Output pairs 3-10 below did not react to direct gain writes.
const NO_EFFECT_OUTPUT_GAINS = new Set([3, 5, 7, 9])

function isSupportedModel(device) {
	return device?.model === SUPPORTED_MODEL
}

function outputIndex(outputOrIndex) {
	if (Number.isInteger(outputOrIndex)) return outputOrIndex
	return Number.isInteger(outputOrIndex?.index) ? outputOrIndex.index : null
}

function isObservedPairRightOutput(outputOrIndex) {
	const index = outputIndex(outputOrIndex)
	return index !== null && OBSERVED_PAIR_RIGHT_OUTPUTS.has(index)
}

function directOutputWriteSupported(device, output, control) {
	if (!output?.[control]) return false
	if (!isSupportedModel(device)) return true

	if (['mute', 'source', 'stereo', 'nickname'].includes(control) && isObservedPairRightOutput(output)) return false
	if (control === 'gain' && NO_EFFECT_OUTPUT_GAINS.has(output.index)) return false
	return true
}

function mixerSlotWriteSupported(device, control) {
	if (!isSupportedModel(device)) return true
	return !['source', 'stereo'].includes(control)
}

function mixLaneWriteSupported(device, control) {
	if (!isSupportedModel(device)) return true
	return control !== 'talkback'
}

function rawItemWriteSupported(device, id) {
	if (!device?.writableIds?.has(String(id))) return false
	if (!isSupportedModel(device)) return true

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
	OBSERVED_PAIR_RIGHT_OUTPUTS,
	NO_EFFECT_OUTPUT_GAINS,
	isSupportedModel,
	isObservedPairRightOutput,
	directOutputWriteSupported,
	mixerSlotWriteSupported,
	mixLaneWriteSupported,
	rawItemWriteSupported,
}
