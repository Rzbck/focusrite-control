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
const { OUTPUT_GAIN_PROBE } = require('../testbench/FullTestBenchProbePolicyV8')
const { buildIsolatedBatches, computeHarnessSignature } = require('../testbench/FullTestBenchPageV4')
const { directOutputWriteSupported, mixerSlotWriteSupported, mixLaneWriteSupported } = require('../src/hardware-policy')
const { filterActionDefinitions } = require('../src/definition-policy')

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

function actionWithOutputs(count, extraOptions = []) {
	return {
		name: 'test',
		options: [
			{
				type: 'dropdown',
				id: 'output',
				choices: Array.from({ length: count }, (_, index) => ({ id: String(index), label: `Out ${index + 1}` })),
				default: '0',
			},
			...extraOptions,
		],
		callback: async () => {},
	}
}

function outputChoiceIds(definition) {
	return definition.options.find((option) => option.id === 'output').choices.map((choice) => Number(choice.id))
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
	assert.equal(
		outputWriteWithheld(profile, 11, 'nickname'),
		true,
		'Out 12 nickname has separate direct no-effect evidence',
	)
	assert.equal(outputWriteWithheld(profile, 1, 'mute'), true, 'Out 2 mute direct write is hardware no-effect/mismatch')
	assert.equal(profile.evidence.output.noEffect.gain.has(1), false, 'Monitor Out 2 gain is not labelled no-effect')
	assert.equal(profile.evidence.output.withheld.gain.has(1), true, 'Monitor Out 2 gain is withheld pending safe restore proof')
	assert.equal(outputWriteWithheld(profile, 1, 'gain'), true, 'Monitor Out 2 gain direct write is withheld')
	assert.equal(outputWriteWithheld(profile, 5, 'stereo'), true, 'Out 6 stereo direct write is hardware no-effect')
	assert.equal(outputWriteWithheld(profile, 7, 'stereo'), false, 'Out 8 stereo remains unproven, not inferred')
	assert.equal(outputWriteWithheld(profile, 3, 'gain'), true, 'Line Out 4 gain direct write is hardware no-effect')
})

test('V8 output gain probe uses interior levels and harness signatures include action contracts', () => {
	assert.deepEqual(OUTPUT_GAIN_PROBE, { low: -127, high: -126 })

	const snapshot = {
		shape: { inputs: [], outputs: [1], mixerSlots: [], lanes: [] },
		values: { output_2_gain: { exists: true, value: '-20' } },
	}
	const testSources = { primary: '1', secondary: '2' }
	const batches = buildIsolatedBatches(snapshot, testSources)
	const byId = new Map(batches.map((batch) => [batch.id, batch]))
	assert.deepEqual(byId.get('v4-output-2-gain-low').specs[0].options, { output: '1', level: -127 })
	assert.deepEqual(byId.get('v4-output-2-gain-prime').specs[0].options, { output: '1', level: -126 })

	const changed = batches.map((batch) =>
		batch.id === 'v4-output-2-gain-low'
			? { ...batch, specs: [{ definitionId: 'output_gain_set', options: { output: '1', level: -125 } }] }
			: batch,
	)
	assert.notEqual(
		computeHarnessSignature(snapshot, testSources, batches),
		computeHarnessSignature(snapshot, testSources, changed),
		'Page 2 signature must change when its action contract changes',
	)
})

test('semantic classification preserves prior and withheld hardware evidence on non-writing rows', () => {
	const profile = withEvidenceProfile(profileForModel('Scarlett 18i20 (3rd Gen)'))
	const inventory = {
		rows: [
			row({ id: 'output:2:source', variable: 'output_2_source', status: STATUS.EVAL_ONLY }),
			row({
				id: 'output:2:gain',
				family: 'output_gain_set',
				variable: 'output_2_gain',
				status: STATUS.EVAL_ONLY,
			}),
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
	assert.equal(inventory.rows[2].classification, CLASSIFICATION.WITHHELD_BY_PROFILE)
	assert.equal(inventory.rows[3].classification, CLASSIFICATION.NO_EFFECT_CONFIRMED)
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

test('production definition policy exposes only control-specific 18i20 output targets and withholds dead families', () => {
	const outputs = Array.from({ length: 12 }, (_, index) => ({
		index,
		name: `Output ${index + 1}`,
		mute: `m${index}`,
		source: `s${index}`,
		stereo: `t${index}`,
		nickname: `n${index}`,
		gain: `g${index}`,
	}))
	const instance = { device: { model: 'Scarlett 18i20 (3rd Gen)', outputs }, log() {} }
	const definitions = {
		output_mute: actionWithOutputs(12, [
			{ type: 'dropdown', id: 'scope', choices: [{ id: 'single' }, { id: 'pair' }], default: 'pair' },
		]),
		output_source: actionWithOutputs(12),
		output_stereo: actionWithOutputs(12),
		output_nickname: actionWithOutputs(12),
		output_gain_set: actionWithOutputs(12),
		output_gain_adjust: actionWithOutputs(12),
		mixer_slot_source: { callback: async () => {}, options: [] },
		mixer_slot_stereo: { callback: async () => {}, options: [] },
		mix_talkback: { callback: async () => {}, options: [] },
		reconnect: { callback: async () => {}, options: [] },
	}
	const filtered = filterActionDefinitions(instance, definitions)

	assert.deepEqual(outputChoiceIds(filtered.output_source), [0, 2, 4, 6, 8, 10])
	assert.deepEqual(outputChoiceIds(filtered.output_mute), [0, 2, 4, 6, 8, 10, 11])
	assert.deepEqual(outputChoiceIds(filtered.output_stereo), [0, 2, 4, 6, 7, 8, 9, 10, 11])
	assert.deepEqual(outputChoiceIds(filtered.output_nickname), [0, 2, 4, 6, 8, 10])
	assert.deepEqual(outputChoiceIds(filtered.output_gain_set), [2, 4, 6, 8, 10, 11])
	assert.deepEqual(outputChoiceIds(filtered.output_gain_adjust), [2, 4, 6, 8, 10, 11])
	assert.equal(filtered.output_mute.options.find((option) => option.id === 'scope').choices.length, 1)
	assert.equal(filtered.mixer_slot_source, undefined)
	assert.equal(filtered.mixer_slot_stereo, undefined)
	assert.equal(filtered.mix_talkback, undefined)

	const unknown = filterActionDefinitions(
		{ device: { model: 'Future Focusrite Model' }, log() {} },
		{ output_source: actionWithOutputs(1), reconnect: definitions.reconnect },
	)
	assert.deepEqual(Object.keys(unknown), ['reconnect'])
})
