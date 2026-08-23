'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { profileForModel, buildCapabilityInventory, STATUS } = require('../testbench/FullTestBenchCapabilityV4')
const {
	withEvidenceProfile,
	outputWriteWithheld,
	mixerSlotWriteWithheld,
	mixLaneWriteWithheld,
} = require('../testbench/FullTestBenchProfilesV8')
const {
	CLASSIFICATION,
	applyEvidenceClassifications,
	auditEvidenceCoverage,
} = require('../testbench/FullTestBenchEvidenceV8')
const {
	directOutputWriteSupported,
	mixerSlotWriteSupported,
	mixLaneWriteSupported,
} = require('../src/hardware-policy')

function row(overrides = {}) {
	return {
		id: 'output:1:source',
		family: 'output_source',
		variable: 'output_1_source',
		availability: 'AVAILABLE',
		r9ProbeCount: 1,
		state: '0',
		stateKnown: true,
		capability: true,
		risk: 'routing',
		dependency: '',
		status: 'DISCOVERED',
		detail: '',
		...overrides,
	}
}

test('unvalidated Focusrite profiles are discoverable but fail closed for writes', () => {
	const base = profileForModel('Future Focusrite Model', { allowUnvalidated: true })
	const profile = withEvidenceProfile(base)
	assert.equal(profile.hardwareTested, false)
	assert.equal(profile.writeEnabled, false)
	assert.equal(outputWriteWithheld(profile, 0, 'source'), true)
	assert.equal(mixerSlotWriteWithheld(profile, 'source'), true)
	assert.equal(mixLaneWriteWithheld(profile, 'talkback'), true)

	const unknownDevice = { model: 'Future Focusrite Model' }
	assert.equal(directOutputWriteSupported(unknownDevice, { index: 0, source: '123' }, 'source'), false)
	assert.equal(mixerSlotWriteSupported(unknownDevice, 'source'), false)
	assert.equal(mixLaneWriteSupported(unknownDevice, 'talkback'), false)
})

test('18i20 evidence remains control-specific instead of inferring every pair behavior from source topology', () => {
	const profile = withEvidenceProfile(profileForModel('Scarlett 18i20 (3rd Gen)'))

	assert.equal(outputWriteWithheld(profile, 11, 'source'), true, 'Out 12 source has source-pair ownership evidence')
	assert.equal(outputWriteWithheld(profile, 11, 'mute'), false, 'Out 12 mute must not inherit source ownership')
	assert.equal(outputWriteWithheld(profile, 11, 'stereo'), false, 'Out 12 stereo must not inherit source ownership')
	assert.equal(outputWriteWithheld(profile, 11, 'nickname'), true, 'Out 12 nickname has separate direct no-effect evidence')

	assert.equal(outputWriteWithheld(profile, 1, 'mute'), true, 'Out 2 mute direct write is hardware no-effect/mismatch')
	assert.equal(outputWriteWithheld(profile, 5, 'stereo'), true, 'Out 6 stereo direct write is hardware no-effect')
	assert.equal(outputWriteWithheld(profile, 7, 'stereo'), false, 'Out 8 stereo remains unproven, not inferred')
	assert.equal(outputWriteWithheld(profile, 3, 'gain'), true, 'Line Out 4 gain direct write is hardware no-effect')
})

test('semantic classification preserves prior hardware evidence on a non-writing diagnostic row', () => {
	const profile = withEvidenceProfile(profileForModel('Scarlett 18i20 (3rd Gen)'))
	const inventory = {
		rows: [
			row({ id: 'output:2:source', variable: 'output_2_source', status: STATUS.EVAL_ONLY }),
			row({
				id: 'mixer-slot:5:source',
				family: 'mixer_slot_source',
				variable: 'mixer_slot_5_source',
				status: STATUS.EVAL_ONLY,
			}),
			row({
				id: 'mix:mix-a-l:talkback',
				family: 'mix_talkback',
				variable: 'mix_mix_a_l_talkback',
				status: STATUS.EVAL_ONLY,
			}),
		],
	}
	applyEvidenceClassifications(inventory, profile)

	assert.equal(inventory.rows[0].classification, CLASSIFICATION.PAIR_OWNED_ALIAS)
	assert.equal(inventory.rows[0].status, STATUS.EVAL_ONLY)
	assert.equal(inventory.rows[1].classification, CLASSIFICATION.WITHHELD_BY_PROFILE)
	assert.equal(inventory.rows[2].classification, CLASSIFICATION.NO_EFFECT_CONFIRMED)
})

test('evidence coverage fails closed when an observed variable has no inventory row', () => {
	const profile = withEvidenceProfile(profileForModel('Scarlett 18i20 (3rd Gen)'))
	const inventory = {
		rows: [row()],
		r9Coverage: { total: 1, byDefinition: new Map([['output_source', 1]]) },
	}
	applyEvidenceClassifications(inventory, profile)

	const good = auditEvidenceCoverage({
		inventory,
		snapshot: { values: { output_1_source: { exists: true, value: '0' } } },
		coreInitial: {},
		r9Coverage: inventory.r9Coverage,
	})
	assert.equal(good.complete, true)
	assert.equal(good.snapshotMapped, 1)

	const bad = auditEvidenceCoverage({
		inventory,
		snapshot: {
			values: {
				output_1_source: { exists: true, value: '0' },
				future_unknown_control: { exists: true, value: 'true' },
			},
		},
		coreInitial: {},
		r9Coverage: inventory.r9Coverage,
	})
	assert.equal(bad.complete, false)
	assert.deepEqual(bad.unmappedSnapshotVariables, ['future_unknown_control'])
})

test('generic capability inventory accepts an unknown model without granting a write profile', () => {
	const inventory = buildCapabilityInventory({
		model: 'Future Focusrite Model',
		shape: { inputs: [], outputs: [], mixerSlots: [], lanes: [] },
		snapshot: { values: {} },
		coreInitial: {},
		r9Probes: [],
		availabilityMap: new Map(),
	})
	assert.equal(inventory.profile.model, 'Future Focusrite Model')
	assert.equal(inventory.profile.hardwareTested, false)
	assert.equal(inventory.profile.writeEnabled, false)
})
