'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const materialize = require('../testbench/MixOutputRoutingMaterialize')
const source = fs.readFileSync(path.join(root, 'testbench', 'MixOutputRoutingMaterialize.js'), 'utf8')

function syntheticBuilt() {
	return {
		signature: 'synthetic',
		batches: [],
		locations: {
			'v4-pair-1-2-source-restore': { row: 0, column: 0 },
			'v4-pair-1-2-source-none': { row: 0, column: 1 },
			'v4-pair-3-4-source-restore': { row: 0, column: 2 },
			'v4-pair-3-4-source-none': { row: 0, column: 3 },
			'v4-pair-5-6-source-restore': { row: 0, column: 4 },
			'v4-pair-5-6-source-none': { row: 0, column: 5 },
		},
		file: {
			page: { gridSize: { minColumn: 0, maxColumn: 45, minRow: 0, maxRow: 0 }, controls: {} },
		},
	}
}

function snapshot() {
	return {
		values: {
			output_1_source: { exists: true, value: 'mix-a-l' },
			output_2_source: { exists: true, value: 'mix-a-r' },
			output_3_source: { exists: true, value: 'playback-3' },
			output_4_source: { exists: true, value: 'playback-4' },
			output_5_source: { exists: true, value: 'playback-5' },
			output_6_source: { exists: true, value: 'playback-6' },
		},
	}
}

function profile() {
	return {
		outputPairs: [
			[0, 1],
			[2, 3],
			[4, 5],
		],
	}
}

function availability(overrides = {}) {
	return [0, 1, 2, 3, 4, 5].map((output) => ({ output, availability: overrides[output] || 'AVAILABLE' }))
}

function sourceNames() {
	return {
		'0/1': { left: 'Mix A L', right: 'Mix A R' },
		'2/3': { left: 'Playback 3', right: 'Playback 4' },
		'4/5': { left: 'Playback 5', right: 'Playback 6' },
	}
}

function playbackCandidatesUnknownTopology() {
	return [
		{ slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: false, stereo: false },
		{ slot: 4, raw: 'p2', name: 'Playback 2', stereoKnown: false, stereo: false },
		{ slot: 5, raw: 'p3', name: 'Playback 3', stereoKnown: true, stereo: true },
	]
}

test('output routing coverage target can use Playback 1/2 while mixer topology state is unknown', () => {
	const selected = materialize.chooseOutputMaterializationPlayback(playbackCandidatesUnknownTopology())
	assert.equal(selected.pair.left.slot, 3)
	assert.equal(selected.pair.right.slot, 4)
	assert.equal(selected.pair.left.name, 'Playback 1')
	assert.equal(selected.pair.right.name, 'Playback 2')
	assert.equal(selected.selection, 'campaign-playback1-source-anchor')
	assert.equal(selected.pair.left.stereoKnown, false)
	assert.equal(selected.pair.right.stereoKnown, false)
})

test('output routing coverage target refuses duplicate Playback identities before write', () => {
	const candidates = [
		...playbackCandidatesUnknownTopology(),
		{ slot: 8, raw: 'p1b', name: 'Playback 1', stereoKnown: true, stereo: false },
	]
	assert.throws(
		() => materialize.chooseOutputMaterializationPlayback(candidates),
		/Ambiguous Playback channel identities: Playback 1.*No write attempted/,
	)
})

test('output routing coverage target requires nonzero server-confirmed source ids', () => {
	const candidates = playbackCandidatesUnknownTopology()
	candidates[1].raw = '0'
	assert.throws(
		() => materialize.chooseOutputMaterializationPlayback(candidates),
		/No complete unique Playback source\/name pair/,
	)
})

test('output materialisation prefers Line Outputs 3-4 and skips Monitor 1-2 by default', () => {
	const selected = materialize.chooseOutputMaterializationPair({
		profile: profile(),
		snapshot: snapshot(),
		outputEligibility: availability(),
		built: syntheticBuilt(),
		sourceNames: sourceNames(),
	})
	assert.equal(selected.left, 2)
	assert.equal(selected.right, 3)
	assert.equal(selected.label, '3-4')
})

test('output materialisation never writes availability UNKNOWN and falls forward to another exact non-Monitor pair', () => {
	const selected = materialize.chooseOutputMaterializationPair({
		profile: profile(),
		snapshot: snapshot(),
		outputEligibility: availability({ 2: 'UNKNOWN', 3: 'UNKNOWN' }),
		built: syntheticBuilt(),
		sourceNames: sourceNames(),
	})
	assert.equal(selected.left, 4)
	assert.equal(selected.right, 5)
})

test('output materialisation refuses a pair whose exact original source baseline is missing', () => {
	const state = snapshot()
	state.values.output_3_source.value = ''
	state.values.output_5_source.value = ''
	assert.equal(
		materialize.chooseOutputMaterializationPair({
			profile: profile(),
			snapshot: state,
			outputEligibility: availability(),
			built: syntheticBuilt(),
			sourceNames: sourceNames(),
		}),
		null,
	)
})

test('output materialisation uses exact raw source state for restore and treats display names as diagnostic only', () => {
	const names = sourceNames()
	names['2/3'] = { left: 'Unexpected Left', right: 'Unexpected Right' }
	const selected = materialize.chooseOutputMaterializationPair({
		profile: profile(),
		snapshot: snapshot(),
		outputEligibility: availability(),
		built: syntheticBuilt(),
		sourceNames: names,
	})
	assert.equal(selected.left, 2)
	assert.equal(selected.right, 3)
	assert.equal(selected.pairNamedBaseline, false)
	assert.equal(selected.leftOriginal, 'playback-3')
	assert.equal(selected.rightOriginal, 'playback-4')
})

test('temporary output routing harness adds only one output_pair_source route to the selected pair', () => {
	const selected = materialize.chooseOutputMaterializationPair({
		profile: profile(),
		snapshot: snapshot(),
		outputEligibility: availability(),
		built: syntheticBuilt(),
		sourceNames: sourceNames(),
	})
	const plan = materialize.buildOutputRouteHarness(syntheticBuilt(), selected, { raw: 'mix-a-l', name: 'Mix A L' })
	const added = plan.built.batches.at(-1)
	assert.equal(added.id, 'mix-materialize-output-pair-3-4-mix-a')
	assert.equal(added.specs.length, 1)
	assert.equal(added.specs[0].definitionId, 'output_pair_source')
	assert.deepEqual(added.specs[0].options, { output: '2', source: 'mix-a-l' })
})

test('output materialisation code has no mixer-slot source, Mix gain, raw, Monitor gain or direct protocol write escape hatch', () => {
	assert.match(source, /output_pair_source/)
	assert.match(source, /restoreExactPair/)
	assert.match(source, /Monitor 1-2 is excluded by default/)
	assert.match(source, /stereo state is diagnostic only/)
	assert.doesNotMatch(source, /chooseTopologyBootstrapPlayback/)
	assert.doesNotMatch(
		source,
		/definitionId:\s*['"](?:mixer_slot_source|mix_gain_set|advanced_raw_set|monitor_gain_set)['"]/,
	)
	assert.doesNotMatch(source, /<set\b|\.writeItem\(|\.sendSet\(|net\.connect|createConnection/)
})
