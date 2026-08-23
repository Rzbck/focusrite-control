'use strict'

const MODEL_18I20 = 'Scarlett 18i20 (3rd Gen)'

const set = (values = []) => new Set(values)

const GENERIC_EVIDENCE = Object.freeze({
	model: 'unvalidated',
	hardwareValidated: false,
	output: Object.freeze({
		pairOwnedSourceRight: set(),
		withheld: Object.freeze({ mute: set(), source: set(), stereo: set(), nickname: set(), gain: set() }),
		noEffect: Object.freeze({ mute: set(), source: set(), stereo: set(), nickname: set(), gain: set() }),
		behaviorMismatch: Object.freeze({ mute: set(), source: set(), stereo: set(), nickname: set(), gain: set() }),
	}),
	mixerSlot: Object.freeze({
		withheldControls: set(),
		noEffectSourceSlots: set(),
		noEffectStereoSlots: set(),
	}),
	mixLane: Object.freeze({
		withheldControls: set(),
		noEffectTalkbackLaneIds: set(),
	}),
	readOnlyVariables: set(),
})

const EVIDENCE_18I20 = Object.freeze({
	model: MODEL_18I20,
	hardwareValidated: true,
	output: Object.freeze({
		// Source-specific runtime topology evidence. Do not infer mute/stereo
		// ownership from this set.
		pairOwnedSourceRight: set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25]),
		// Monitor Out 1/2 gain is intentionally withheld rather than called
		// no-effect. The latest hardware run exposed cross-output/restoration
		// uncertainty, so no independent direct gain write is attempted until a
		// useful exact restoration path is proven.
		withheld: Object.freeze({
			mute: set(),
			source: set(),
			stereo: set(),
			nickname: set(),
			gain: set([0, 1]),
		}),
		noEffect: Object.freeze({
			mute: set(),
			source: set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25]),
			stereo: set([1, 3, 5]),
			nickname: set([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25]),
			gain: set([3, 5, 7, 9]),
		}),
		behaviorMismatch: Object.freeze({
			mute: set([1, 3, 5, 7, 9]),
			source: set(),
			stereo: set(),
			nickname: set(),
			gain: set(),
		}),
	}),
	mixerSlot: Object.freeze({
		// A family is withheld from automatic/public writes when current hardware
		// evidence has no demonstrated useful write path. Individual proof remains
		// separate so untested slots are not falsely labelled hardware-tested.
		withheldControls: set(['source', 'stereo']),
		noEffectSourceSlots: set([1, 2, 3, 4]),
		noEffectStereoSlots: set([3, 4]),
	}),
	mixLane: Object.freeze({
		withheldControls: set(['talkback']),
		noEffectTalkbackLaneIds: set(['mix-a-l', 'mix-b-l', 'mix-c-l', 'mix-d-l', 'mix-e-l', 'mix-f-l']),
	}),
	readOnlyVariables: set(['monitor_gain']),
})

function evidenceForModel(model) {
	return model === MODEL_18I20 ? EVIDENCE_18I20 : GENERIC_EVIDENCE
}

function withEvidenceProfile(profile) {
	return Object.freeze({ ...profile, evidence: evidenceForModel(profile?.model) })
}

function outputWriteWithheld(profile, outputIndex, control) {
	if (!profile?.writeEnabled) return true
	return Boolean(
		profile.evidence?.output?.withheld?.[control]?.has(outputIndex) ||
			profile.evidence?.output?.noEffect?.[control]?.has(outputIndex) ||
			profile.evidence?.output?.behaviorMismatch?.[control]?.has(outputIndex),
	)
}

function mixerSlotWriteWithheld(profile, control) {
	if (!profile?.writeEnabled) return true
	return Boolean(profile.evidence?.mixerSlot?.withheldControls?.has(control))
}

function mixLaneWriteWithheld(profile, control) {
	if (!profile?.writeEnabled) return true
	return Boolean(profile.evidence?.mixLane?.withheldControls?.has(control))
}

module.exports = {
	MODEL_18I20,
	GENERIC_EVIDENCE,
	EVIDENCE_18I20,
	evidenceForModel,
	withEvidenceProfile,
	outputWriteWithheld,
	mixerSlotWriteWithheld,
	mixLaneWriteWithheld,
}
