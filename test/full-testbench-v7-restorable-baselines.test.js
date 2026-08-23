const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const { buildRestorableV7Context } = require('../testbench/FullTestBenchRestorableV7')
const { GENERIC_EVIDENCE } = require('../testbench/FullTestBenchProfilesV8')

function item(value, exists = true) {
	return { exists, value }
}

test('V7 exact-restore prefilter masks unknown reversible baselines without mutating the captured snapshot', () => {
	const snapshot = {
		shape: {
			outputs: [0, 1, 2],
			mixerSlots: [1],
			lanes: [{ mix: 'Mix A', side: 'left' }],
		},
		values: {
			output_1_source: item('100'),
			output_2_source: item(''),
			output_1_stereo: item('false'),
			output_2_stereo: item(''),
			output_3_gain: item(''),
			mixer_slot_1_source: item(''),
			mixer_slot_1_stereo: item('true'),
			mix_mix_a_l_slot_1_mute: item('true'),
			mix_mix_a_l_slot_2_mute: item(''),
			mix_mix_a_l_slot_1_gain: item('-12'),
			mix_mix_a_l_slot_2_gain: item('-6'),
			mix_mix_a_l_talkback: item(''),
			monitor_altEnable: item(''),
			monitor_preset: item(''),
			device_nickname: item(''),
		},
	}
	const built = {
		locations: {
			'mixa-l-mute-on': { row: 1, column: 1 },
			'mixa-l-mute-off': { row: 1, column: 2 },
			'mixa-l-mute-restore': { row: 1, column: 3 },
			'mixa-l-gain-set': { row: 2, column: 1 },
			'v2-mixa-l-gain-prime': { row: 2, column: 2 },
			'mixa-l-gain-adjust': { row: 2, column: 3 },
			'mixa-l-gain-restore': { row: 2, column: 4 },
		},
	}
	const profile = { model: 'restore-fixture', writeEnabled: true, outputPairs: [[0, 1]], evidence: GENERIC_EVIDENCE }

	const result = buildRestorableV7Context({ snapshot, built, profile, enabled: true })

	assert.equal(result.snapshot.values.output_1_source.exists, false)
	assert.equal(result.snapshot.values.output_2_source.exists, false)
	assert.equal(result.snapshot.values.output_1_stereo.exists, false)
	assert.equal(result.snapshot.values.output_2_stereo.exists, false)
	assert.equal(result.snapshot.values.output_3_gain.exists, false)
	assert.equal(result.snapshot.values.mixer_slot_1_source.exists, false)
	assert.equal(result.snapshot.values.mixer_slot_1_stereo.exists, true)
	assert.equal(result.snapshot.values.mix_mix_a_l_slot_1_mute.exists, false)
	assert.equal(result.snapshot.values.mix_mix_a_l_slot_2_mute.exists, false)
	assert.equal(result.snapshot.values.mix_mix_a_l_slot_1_gain.exists, true)
	assert.equal(result.snapshot.values.mix_mix_a_l_talkback.exists, false)
	assert.equal(result.snapshot.values.monitor_altEnable.exists, false)
	assert.equal(result.snapshot.values.monitor_preset.exists, false)
	assert.equal(result.snapshot.values.device_nickname.exists, true)
	assert.equal(result.built.locations['mixa-l-mute-on'], undefined)
	assert.ok(result.built.locations['mixa-l-gain-set'])
	assert.equal(result.pairProfile.outputPairs.length, 0)
	assert.equal(result.skippedSourcePairs, 1)
	assert.ok(result.maskedLaneFamilies.includes('Mix A:left:mute'))

	assert.equal(snapshot.values.output_1_source.exists, true)
	assert.equal(snapshot.values.output_2_source.exists, true)
	assert.ok(built.locations['mixa-l-mute-on'])
})

test('V7 exact-restore prefilter is a no-op outside the hard-restore campaign', () => {
	const snapshot = { shape: { outputs: [], mixerSlots: [], lanes: [] }, values: { monitor_alt: item('') } }
	const built = { locations: { x: { row: 1, column: 1 } } }
	const profile = { outputPairs: [] }
	const result = buildRestorableV7Context({ snapshot, built, profile, enabled: false })

	assert.equal(result.snapshot, snapshot)
	assert.equal(result.built, built)
	assert.equal(result.pairProfile, profile)
	assert.deepEqual(result.maskedVariables, [])
})

test('V7 campaign applies the exact-restore prefilter to every reversible extended family', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js'), 'utf8')

	assert.match(source, /buildRestorableV7Context/)
	assert.match(source, /Exact-restore \/ hardware-write prefilter/)
	assert.match(source, /establishSourceNoneSafety\(\{[\s\S]*built: restorableBuilt,[\s\S]*snapshot: restorableSnapshot/)
	assert.match(source, /testOutputFamilies\(\{[\s\S]*built: restorableBuilt,[\s\S]*snapshot: restorableSnapshot/)
	assert.match(source, /testOutputPairSource\(\{[\s\S]*profile: restorablePairProfile/)
	assert.match(source, /testMixerSlots\(\{[\s\S]*snapshot: restorableSnapshot/)
	assert.match(source, /testMixLanes\(\{[\s\S]*snapshot: restorableSnapshot/)
	assert.match(source, /testMonitoringMetadata\(\{[\s\S]*snapshot: restorableSnapshot/)
})
