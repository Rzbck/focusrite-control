const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const topology = require('../testbench/FullTestBenchTopologyV6')
const feedback = require('../testbench/FullTestBenchFeedbackV6')
const { addV6InventoryRows } = require('../testbench/FullTestBenchInventoryV6')
const runner = require('../testbench/FullTestBenchRunnerV4')

test('V6 topology helpers are pair-generic and preserve per-member observations', () => {
	assert.equal(topology.pairTopologyRowId(0, 1), 'output-pair:1-2:topology')
	assert.equal(topology.pairTopologyRowId(10, 11), 'output-pair:11-12:topology')

	const observation = topology.classifyPairObservation(
		{ left: { exists: true, value: '0' }, right: { exists: true, value: '9876' } },
		'1234',
		'9876',
		'5555',
	)
	assert.deepEqual(observation, { left: 'zero', right: 'original' })
	assert.equal(topology.observationOutcome(observation), 'ZERO_ORIGINAL')
})

test('V6 inventory creates topology rows for every declared pair, not a hardcoded diagnostic pair', () => {
	const inventory = { rows: [] }
	const snapshot = {
		shape: { outputs: [0, 1, 2, 3, 4, 5] },
		values: {
			output_1_source: { exists: true, value: '10' },
			output_2_source: { exists: true, value: '11' },
			output_3_source: { exists: true, value: '20' },
			output_4_source: { exists: true, value: '21' },
			output_5_source: { exists: true, value: '30' },
			output_6_source: { exists: true, value: '31' },
		},
	}
	const profile = {
		outputPairs: [
			[0, 1],
			[2, 3],
			[4, 5],
		],
	}

	addV6InventoryRows(inventory, snapshot, profile)

	const topologyRows = inventory.rows.filter((row) => row.family === 'output_pair_topology').map((row) => row.id)
	assert.deepEqual(topologyRows, ['output-pair:1-2:topology', 'output-pair:3-4:topology', 'output-pair:5-6:topology'])
	assert.ok(inventory.rows.some((row) => row.id === 'manual:feedback-meter-dynamics'))
	assert.ok(inventory.rows.some((row) => row.id === 'manual:monitor-gain-readback'))
})

test('V6 topology sweep enumerates profile pairs and hard-aborts an unconfirmed restore', () => {
	const sourcePath = path.join(root, 'testbench', 'FullTestBenchTopologyV6.js')
	const source = fs.readFileSync(sourcePath, 'utf8')

	assert.match(source, /for \(const \[left, right\] of profile\.outputPairs \|\| \[\]\)/)
	assert.match(source, /TOPOLOGY RESTORE FAILED/)
	assert.match(source, /v4-output-\$\{left \+ 1\}-source-restore/)
	assert.match(source, /v4-output-\$\{right \+ 1\}-source-restore/)
	assert.match(source, /exact original restore confirmed/)
	assert.doesNotMatch(source, /const LEFT\s*=\s*2|const RIGHT\s*=\s*3|PAIR34/)
})

test('meter feedbacks use the real numeric server value and threshold as their independent oracle', () => {
	const meterProbe = {
		definitionId: 'input_meter',
		options: { input: '2', threshold: '-40' },
	}
	const meterOracle = feedback.feedbackOracle(meterProbe)

	assert.deepEqual(meterOracle, {
		kind: 'threshold',
		source: 'input_3_meter',
		threshold: -40,
	})
	assert.deepEqual(feedback.evaluateOracle({ kind: 'threshold', threshold: -40 }, '-39.5'), {
		evaluable: true,
		wanted: true,
	})
	assert.deepEqual(feedback.evaluateOracle({ kind: 'threshold', threshold: -40 }, '-80'), {
		evaluable: true,
		wanted: false,
	})
})

test('all 31 current public feedback definitions have an independent V6 oracle mapping', () => {
	const probes = [
		{ definitionId: 'connected', options: {} },
		{ definitionId: 'authorised', options: {} },
		{ definitionId: 'monitor_mute', options: {} },
		{ definitionId: 'monitor_dim', options: {} },
		{ definitionId: 'monitor_talkback', options: {} },
		{ definitionId: 'monitor_alt', options: {} },
		{ definitionId: 'monitor_alt_enable', options: {} },
		{ definitionId: 'monitor_preset', options: { value: 'All' } },
		{ definitionId: 'input_air', options: { input: '0' } },
		{ definitionId: 'input_pad', options: { input: '0' } },
		{ definitionId: 'input_available', options: { input: '0' } },
		{ definitionId: 'input_mode', options: { input: '0', mode: 'Line' } },
		{ definitionId: 'input_meter', options: { input: '0', threshold: -40 } },
		{ definitionId: 'output_mute', options: { output: '0' } },
		{ definitionId: 'output_stereo', options: { output: '0' } },
		{ definitionId: 'output_source', options: { output: '0', source: '0' } },
		{ definitionId: 'output_available', options: { output: '0' } },
		{ definitionId: 'output_meter', options: { output: '0', threshold: -40 } },
		{ definitionId: 'mixer_slot_stereo', options: { slot: 1 } },
		{ definitionId: 'mixer_slot_source', options: { slot: 1, source: '0' } },
		{ definitionId: 'mix_mute', options: { mix: 'Mix A', side: 'left', slot: 1 } },
		{ definitionId: 'mix_solo', options: { mix: 'Mix A', side: 'left', slot: 1 } },
		{ definitionId: 'mix_talkback', options: { mix: 'Mix A', side: 'left' } },
		{ definitionId: 'mix_meter', options: { mix: 'Mix A', side: 'left', threshold: -40 } },
		{ definitionId: 'device_preset', options: { value: 'Custom' } },
		{ definitionId: 'clock_source', options: { value: 'Internal' } },
		{ definitionId: 'sample_rate', options: { value: '48000' } },
		{ definitionId: 'spdif_mode', options: { value: 'RCA' } },
		{ definitionId: 'clock_locked', options: {} },
		{ definitionId: 'talkback_source', options: { source: 'Scarlett Internal Mic' } },
		{ definitionId: 'phantom_persistence', options: {} },
	]

	assert.equal(probes.length, 31)
	for (const probe of probes) {
		assert.notEqual(feedback.feedbackOracle(probe).kind, 'unmapped', probe.definitionId)
	}
})

test('manual feedback code observes Monitor gain read-only and contains no direct Focusrite write path', () => {
	const sourcePath = path.join(root, 'testbench', 'FullTestBenchFeedbackV6.js')
	const source = fs.readFileSync(sourcePath, 'utf8')

	assert.match(source, /monitor_gain/)
	assert.match(source, /bouton physique Monitor/)
	assert.match(source, /Remets maintenant le bouton Monitor/)
	assert.doesNotMatch(source, /\.setItem\s*\(/)
	assert.doesNotMatch(source, /monitor_gain_set|monitor_gain_adjust|advanced_raw_set/)
})

test('FULL V6 requires explicit whole-output routing isolation and exposes manual feedback mode', () => {
	assert.equal(runner.FULL_CAMPAIGN_REVISION, 'full-v6-device-wide-topology-feedback-20260822')
	assert.equal(runner.FULL_ROUTING_ISOLATION_FLAG, '--confirm-all-output-routing-isolated')

	const sourcePath = path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js')
	const source = fs.readFileSync(sourcePath, 'utf8')
	assert.match(source, /Device-wide output-pair topology sweep/)
	assert.match(source, /--manual-feedback/)
	assert.match(source, /observeMeterDynamics/)
	assert.match(source, /observeMonitorGain/)
})

test('AI project rules forbid narrow FULL diagnostics and require manual feedback coverage', () => {
	const rules = fs.readFileSync(path.join(root, 'AI_PROJECT_RULES.md'), 'utf8')

	assert.match(rules, /TestBench breadth and targeted-probe rule/)
	assert.match(rules, /must not become the normal launcher workflow/)
	assert.match(rules, /all public feedback instances/)
	assert.match(rules, /guided manual phase/)
	assert.match(rules, /Monitor gain item `1677` may only be observed/)
})
