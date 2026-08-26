'use strict'

const SUPPORTED_MODEL = 'Scarlett 18i20 (3rd Gen)'

// Hardware evidence is intentionally control-specific. A source-pair topology
// observation must never be promoted into a mute/stereo/nickname conclusion.
const PAIR_SOURCE_RIGHT_OUTPUTS = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25])

// Direct mute writes are withheld on every right/pair-owned member. Outputs
// 2/4/6/8/10 produced repeatable direct-write mismatches, while the remaining
// right members did not establish an independently writable mute path in the
// completed V4/V8 hardware campaigns. Pair/feedback state remains readable.
const WITHHELD_OUTPUT_MUTES = new Set(PAIR_SOURCE_RIGHT_OUTPUTS)
// Backward-compatible evidence name retained for existing tests/docs.
const MISMATCH_OUTPUT_MUTES = WITHHELD_OUTPUT_MUTES

const NO_EFFECT_OUTPUT_STEREO = new Set([1, 3, 5])
const NO_EFFECT_OUTPUT_NICKNAMES = new Set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25])
const NO_EFFECT_OUTPUT_GAINS = new Set([3, 5, 7, 9])

// Human Outputs 21-24 were never hardware-write validated in an available
// configuration. They are currently server-confirmed unavailable. Even if a
// future sample-rate/Digital-I/O configuration makes them available, keep all
// production writes blocked until that configuration receives explicit real
// hardware validation.
const UNVALIDATED_CONFIGURATION_OUTPUTS = new Set([20, 21, 22, 23])

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
	if (control === 'mute') return WITHHELD_OUTPUT_MUTES
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
	if (UNVALIDATED_CONFIGURATION_OUTPUTS.has(Number(output.index))) return false
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
	// ownership. Both members must nevertheless be server-confirmed available and
	// neither member may belong to an unvalidated output configuration.
	if (!directOutputWriteSupported(device, leftOutput, 'source', getValue)) return false
	if (UNVALIDATED_CONFIGURATION_OUTPUTS.has(Number(rightOutput.index))) return false
	return outputAvailabilityAllowsWrite(rightOutput, getValue)
}

function mixerSlotWriteSupported(device, control) {
	if (!isSupportedModel(device)) return false
	// Earlier hardware testing proved only that DIRECT SINGLE-ITEM source writes
	// on slots 1-4 and DIRECT SINGLE-ITEM stereo writes on slots 3-4 produced no
	// useful transition. Newer Focusrite Control UI evidence proves runtime
	// mono/stereo topology is configurable, so capability absence must NOT be
	// inferred from those old no-effect results. Generic/public source/stereo and
	// Advanced Raw writes remain withheld while grouped transaction semantics are
	// unresolved.
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
		// Output Stereo is withheld from the v1 public write surface. Do not allow
		// Advanced Raw to become an alternate path around that release decision.
		if (descriptor.control === 'stereo') return false
		const output = device.outputs?.[Number(descriptor.ownerIndex)]
		return directOutputWriteSupported(device, output, descriptor.control, getValue)
	}
	if (descriptor.category === 'mixer-slot') return mixerSlotWriteSupported(device, descriptor.control)
	// Generic Custom Mix writes are withheld for v1. Readback/feedback remains
	// available, but Advanced Raw must not bypass the public action policy.
	if (descriptor.category === 'mix') return false
	if (descriptor.category === 'settings') {
		// Only the two already hardware-write-confirmed, non-disruptive settings
		// remain eligible at policy level. Device preset, clock, sample-rate and
		// Digital I/O mode are deliberately withheld for v1.
		return ['phantomPersistence', 'talkbackInputSource'].includes(descriptor.control)
	}
	if (descriptor.category === 'monitor' && ['gain', 'altEnable', 'alt'].includes(descriptor.control)) return false
	return true
}

module.exports = {
	SUPPORTED_MODEL,
	PAIR_SOURCE_RIGHT_OUTPUTS,
	WITHHELD_OUTPUT_MUTES,
	MISMATCH_OUTPUT_MUTES,
	NO_EFFECT_OUTPUT_STEREO,
	NO_EFFECT_OUTPUT_NICKNAMES,
	NO_EFFECT_OUTPUT_GAINS,
	UNVALIDATED_CONFIGURATION_OUTPUTS,
	WITHHELD_OUTPUT_GAINS,
	isSupportedModel,
	outputAvailabilityAllowsWrite,
	directOutputWriteSupported,
	outputPairSourceWriteSupported,
	mixerSlotWriteSupported,
	mixLaneWriteSupported,
	rawItemWriteSupported,
}
