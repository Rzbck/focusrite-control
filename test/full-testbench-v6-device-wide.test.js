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
	assert.deepEqual(
		topology.classifyPairObservation(
			{ left: { exists: true, value: '0' }, right: { exists: true, value: '9876' } },
			'1234',
			'9876',
			'5555',
		),
		{ left: 'zero', right: 'original' },
	)
	assert.equal(topology.observationOutcome({ left: 'zero', right: 'original' }), 'ZERO_ORIGINAL')
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
	addV6InventoryRows(inventory, snapshot, { outputPairs: [[0, 1], [2, 3], [4, 5]] })
	assert.deepEqual(
		inventory.rows.filter((row) => row.family === 'output_pair_topology').map((row) => row.id),
		['output-pair:1-2:topology', 'output-pair:3-4:topology', 'output-pair:5-6:topology'],
	)
	assert.ok(inventory.rows.some((row) => row.id === 'manual:feedback-meter-dynamics'))
	assert.ok(inventory.rows.some((row) => row.id === 'manual:monitor-gain-readback'))
})

test('V6 topology sweep enumerates profile pairs and hard-aborts an unconfirmed restore', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchTopologyV6.js'), 'utf8')
	assert.match(source, /for \(const \[left, right\] of profile\.outputPairs \|\| \[\]\)/)
	assert.match(source, /TOPOLOGY RESTORE FAILED/)
	assert.match(source, /exact original restore confirmed/)
	assert.doesNotMatch(source, /const LEFT\s*=\s*2|const RIGHT\s*=\s*3|PAIR34/)
})

test('meter feedbacks use the real numeric server value and threshold as their independent oracle', () => {
	assert.deepEqual(feedback.feedbackOracle({ definitionId: 'input_meter', options: { input: '2', threshold: '-40' } }), {
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

test('manual feedback code observes Monitor gain read-only and contains no direct Focusrite write path', () => {
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchFeedbackV6.js'), 'utf8')
	assert.match(source, /monitor_gain/)
	assert.match(source, /bouton physique Monitor/)
	assert.match(source, /Remets maintenant le bouton Monitor/)
	assert.doesNotMatch(source, /\.setItem\s*\(/)
	assert.doesNotMatch(source, /monitor_gain_set|monitor_gain_adjust|advanced_raw_set/)
})

test('FULL V6 requires explicit whole-output routing isolation and exposes manual feedback mode', () => {
	assert.equal(runner.FULL_CAMPAIGN_REVISION, 'full-v6-device-wide-topology-feedback-20260822')
	assert.equal(runner.FULL_ROUTING_ISOLATION_FLAG, '--confirm-all-output-routing-isolated')
	const source = fs.readFileSync(path.join(root, 'testbench', 'FullTestBenchRunnerV4Campaign.js'), 'utf8')
	assert.match(source, /Device-wide output-pair topology sweep/)
	assert.match(source, /--manual-feedback/)
	assert.match(source, /observeMeterDynamics/)
	assert.match(source, /observeMonitorGain/)
})

test('AI project rules forbid turning narrow diagnostics into the FULL strategy and require manual feedback coverage', () => {
	const rules = fs.readFileSync(path.join(root, 'AI_PROJECT_RULES.md'), 'utf8')
	assert.match(rules, /TestBench breadth and targeted-probe rule/)
	assert.match(rules, /must not become the normal launcher workflow/)
	assert.match(rules, /all public feedback instances/)
	assert.match(rules, /guided manual phase/)
	assert.match(rules, /Monitor gain item `1677` may only be observed/)
})
