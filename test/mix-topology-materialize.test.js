'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const materialize = require('../testbench/MixTopologyMaterialize')
const runner = require('../testbench/MixFeedbackClosureRunner')
const source = fs.readFileSync(path.join(root, 'testbench', 'MixTopologyMaterialize.js'), 'utf8')
const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_MIX_FEEDBACK_CLOSURE.cmd'), 'utf8')

function candidates() {
	return [
		{ slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
		{ slot: 7, raw: 'p2', name: 'Playback 2', stereoKnown: true, stereo: false },
		{ slot: 5, raw: 'p3', name: 'Playback 3', stereoKnown: true, stereo: false },
		{ slot: 11, raw: 'p4', name: 'Playback 4', stereoKnown: true, stereo: false },
	]
}

function syntheticBuilt() {
	return {
		batches: [],
		locations: {},
		file: {
			page: {
				gridSize: { minColumn: 0, maxColumn: 45, minRow: 0, maxRow: 0 },
				controls: {},
			},
		},
	}
}

test('topology materialisation preserves the prior Playback target without requiring a Mix baseline or adjacent slots', () => {
	const selected = materialize.chooseTopologyBootstrapPlayback(candidates(), { slot: 3, name: 'Playback 1' })
	assert.equal(selected.playback.slot, 3)
	assert.equal(selected.pair.left.slot, 3)
	assert.equal(selected.pair.right.slot, 7)
	assert.equal(selected.selection, 'previous-topology-target')
})

test('topology materialisation uses the unique runtime Playback 1/2 channel pair even on nonadjacent mixer slots', () => {
	const selected = materialize.chooseTopologyBootstrapPlayback(candidates())
	assert.equal(selected.playback.slot, 3)
	assert.equal(selected.playback.name, 'Playback 1')
	assert.equal(selected.pair.left.name, 'Playback 1')
	assert.equal(selected.pair.left.slot, 3)
	assert.equal(selected.pair.right.name, 'Playback 2')
	assert.equal(selected.pair.right.slot, 7)
	assert.equal(selected.selection, 'campaign-playback1-runtime-anchor')
	const directPair = runner.findPlaybackChannelPair({ ...selected.playback, candidates: candidates() })
	assert.equal(directPair.left.slot, 3)
	assert.equal(directPair.right.slot, 7)
})

test('topology materialisation refuses duplicate runtime Playback channel anchors instead of guessing', () => {
	const ambiguous = [
		...candidates(),
		{ slot: 13, raw: 'p1b', name: 'Playback 1', stereoKnown: true, stereo: false },
		{ slot: 15, raw: 'p2b', name: 'Playback 2', stereoKnown: true, stereo: false },
	]
	assert.throws(
		() => materialize.chooseTopologyBootstrapPlayback(ambiguous),
		/No unique confirmed-mono Playback channel pair|Ambiguous confirmed-mono Playback channel topology/,
	)
})

test('Playback candidate diagnostics are sanitized and never expose raw source ids', () => {
	const safe = materialize.sanitizedPlaybackCandidates(candidates())
	assert.deepEqual(safe[0], { slot: 3, name: 'Playback 1', topology: 'mono' })
	assert.equal(Object.prototype.hasOwnProperty.call(safe[0], 'raw'), false)
	assert.doesNotMatch(JSON.stringify(safe), /"raw"|p1|p2|p3|p4/)
})

test('topology materialisation harness contains only paired explicit stereo on and mono restore actions', () => {
	const pair = {
		left: { slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
		right: { slot: 7, raw: 'p2', name: 'Playback 2', stereoKnown: true, stereo: false },
	}
	const plan = materialize.buildTopologyHarness(syntheticBuilt(), pair)
	const specs = plan.built.batches.flatMap((batch) => batch.specs || [])
	assert.equal(specs.length, 4)
	assert.deepEqual(
		specs.map((spec) => spec.definitionId),
		['mixer_slot_stereo', 'mixer_slot_stereo', 'mixer_slot_stereo', 'mixer_slot_stereo'],
	)
	assert.deepEqual(
		specs.map((spec) => spec.options.state),
		['on', 'on', 'off', 'off'],
	)
	assert.deepEqual(
		specs.map((spec) => spec.options.slot),
		[3, 7, 3, 7],
	)
})

test('topology materialisation has no broader Focusrite write family or direct protocol path', () => {
	assert.doesNotMatch(
		source,
		/definitionId:\s*['"](?:mix_mute|mix_solo|mix_gain|mixer_slot_source|output_source|advanced_raw)['"]/,
	)
	assert.doesNotMatch(source, /<set\b|\.writeItem\(|\.sendSet\(|net\.connect|createConnection/)
	assert.match(source, /topologySourcesMatch/)
	assert.match(source, /mixer-slot adjacency is not assumed/)
	assert.match(source, /Any unconfirmed topology\/source restore = HARD ABORT/)
})

test('existing Mix launcher runs guarded materialisation and routing fallback after isolation confirmation before closure', () => {
	const selfCheck = launcher.indexOf('MixTopologyMaterialize.js')
	const preflight = launcher.indexOf('[1/3] PREFLIGHT READ-ONLY')
	const isolation = launcher.indexOf('ALL_ISOLATED')
	const materializeRun = launcher.indexOf('MixTopologyMaterialize.js" --allow-topology-materialize')
	const routingRun = launcher.indexOf('MixOutputRoutingMaterialize.js" --allow-output-route-materialize')
	const closureRun = launcher.indexOf('MixFeedbackClosureRunner.js" --allow-mix-feedback-writes')
	assert.ok(selfCheck >= 0)
	assert.ok(selfCheck < preflight)
	assert.ok(materializeRun > isolation)
	assert.ok(routingRun > materializeRun)
	assert.ok(closureRun > routingRun)
	assert.match(launcher, /mix-topology-materialize\.test\.js/)
	assert.match(launcher, /mix-output-routing-materialize\.test\.js/)
})
