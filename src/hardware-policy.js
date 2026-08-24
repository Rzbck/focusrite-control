'use strict'

const SUPPORTED_MODEL = 'Scarlett 18i20 (3rd Gen)'

// Hardware evidence is intentionally control-specific. A source-pair topology
// observation must never be promoted into a mute/stereo/nickname conclusion.
const PAIR_SOURCE_RIGHT_OUTPUTS = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25])
const MISMATCH_OUTPUT_MUTES = new Set([1, 3, 5, 7, 9])
const NO_EFFECT_OUTPUT_STEREO = new Set([1, 3, 5])
const NO_EFFECT_OUTPUT_NICKNAMES = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25])
const NO_EFFECT_OUTPUT_GAINS = new Set([3, 5, 7, 9])
// Monitor Out 1/2 gain writes are withheld for now. The newest hardware run
// exposed cross-output/restoration uncertainty on the Monitor pair. This is
// deliberately NOT labelled no-effect: readable state remains useful, but a
// direct independently-restorable write path has not been proven.
const WITHHELD_OUTPUT_GAINS = new Set([0, 1])

function isSupportedModel(device) {
	return device?.model === SUPPORTED_MODEL
}

function outputAvailabilityAllowsWrite(output, getValue) {
	// V3 hardware testing established that an output with no availability flag
	// is eligible, but an explicit flag that is false or whose server-confirmed
	// value is still unknown must receive no write.
	if (!output?.available) return true
	if (typeof getValue !== 'function') return false
	const raw = getValue(output.available)
	if (raw === undefined || raw === null || String(raw).trim() === '') return false
	const normalized = String(raw).trim().toLowerCase()
	if (normalized === 'true' || normalized === '1') return true
	return false
}

function setForOutputControl(control) {
	if (control === 'source') return PAIR_SOURCE_RIGHT_OUTPUTS
	if (control === 'mute') return MISMATCH_OUTPUT_MUTES
	if (control === 'stereo') return NO_EFFECT_OUTPUT_STEREO
	if (control === 'nickname') return NO_EFFECT_OUTPUT_NICKNAMES
	if (control === 'gain') return NO_EFFECT_OUTPUT_GAINS
	return null
}

function directOutputWriteSupported(device, output, control, getValue) {
	if (!output?.[control]) return false
	// Unknown/unvalidated models fail closed. The current production module also
	// rejects them earlier, but the policy itself must never become permissive.
	if (!isSupportedModel(device)) return false
	if (!outputAvailabilityAllowsWrite(output, getValue)) return false
	if (control === 'gain' && WITHHELD_OUTPUT_GAINS.has(output.index)) return false
	const blocked = setForOutputControl(control)
	return !blocked?.has(output.index)
}

function outputPairSourceWriteSupported(device, leftOutput, getValue) {
	if (!isSupportedModel(device) || !leftOutput?.source || leftOutput.pairIndex === undefined) return false
	if (leftOutput.pairSide && leftOutput.pairSide !== 'L') return false
	const rightOutput = device.outputs?.[Number(leftOutput.pairIndex)]
	if (!rightOutput?.source) return false
	// The dedicated pair action is allowed to traverse a pair-owned right member;
	// V8 topology testing validated that pair path separately from direct-source
	// ownership. Both members must nevertheless be server-confirmed available.
	if (!directOutputWriteSupported(device, leftOutput, 'source', getValue)) return false
	return outputAvailabilityAllowsWrite(rightOutput, getValue)
}

function mixerSlotWriteSupported(device, control) {
	if (!isSupportedModel(device)) return false
	// Earlier hardware testing proved only that DIRECT SINGLE-ITEM source writes
	// on slots 1-4 and DIRECT SINGLE-ITEM stereo writes on slots 3-4 produced no
	// useful transition. Newer Focusrite Control UI evidence proves runtime
	// mono/stereo topology is configurable, so capability absence must NOT be
	// inferred from those old no-effect results. Generic/public source/stereo and
	// Advanced Raw writes remain withheld while the dedicated TestBench researches
	// pair/group/transaction semantics with exact restore.
	return !['source', 'stereo'].includes(control)
}

function mixLaneWriteSupported(device, control) {
	if (!isSupportedModel(device)) return false
	// Six left-lane Talkback controls were hardware-tested no-effect. Preserve
	// lane state/feedback, but withhold the public write family for now.
	return control !== 'talkback'
}

function rawItemWriteSupported(device, id, getValue) {
	if (!isSupportedModel(device) || !device?.writableIds?.has(String(id))) return false

	const descriptor = device.descriptors?.get(String(id))
	if (!descriptor) return false
	if (descriptor.category === 'output') {
		const output = device.outputs?.[Number(descriptor.ownerIndex)]
		return directOutputWriteSupported(device, output, descriptor.control, getValue)
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
	WITHHELD_OUTPUT_GAINS,
	isSupportedModel,
	outputAvailabilityAllowsWrite,
	directOutputWriteSupported,
	outputPairSourceWriteSupported,
	mixerSlotWriteSupported,
	mixLaneWriteSupported,
	rawItemWriteSupported,
}
