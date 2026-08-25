'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const materialize = require('../testbench/MixTopologyMaterialize')
const source = fs.readFileSync(path.join(root, 'testbench', 'MixTopologyMaterialize.js'), 'utf8')
const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_MIX_FEEDBACK_CLOSURE.cmd'), 'utf8')

function candidates() {
	return [
		{ slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
		{ slot: 4, raw: 'p2', name: 'Playback 2', stereoKnown: true, stereo: false },
		{ slot: 5, raw: 'p3', name: 'Playback 3', stereoKnown: true, stereo: false },
		{ slot: 6, raw: 'p4', name: 'Playback 4', stereoKnown: true, stereo: false },
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

test('topology materialisation preserves the prior Playback target without requiring a Mix baseline', () => {
	const selected = materialize.chooseTopologyBootstrapPlayback(candidates(), { slot: 3, name: 'Playback 1' })
	assert.equal(selected.playback.slot, 3)
	assert.equal(selected.pair.left.slot, 3)
	assert.equal(selected.pair.right.slot, 4)
	assert.equal(selected.selection, 'previous-topology-target')
})

test('topology materialisation uses the unique runtime Playback 1 anchor when several mono pairs exist', () => {
	const selected = materialize.chooseTopologyBootstrapPlayback(candidates())
	assert.equal(selected.playback.slot, 3)
	assert.equal(selected.playback.name, 'Playback 1')
	assert.equal(selected.pair.left.name, 'Playback 1')
	assert.equal(selected.pair.right.name, 'Playback 2')
	assert.equal(selected.selection, 'campaign-playback1-runtime-anchor')
})

test('topology materialisation refuses duplicate runtime Playback 1 anchors instead of guessing', () => {
	const ambiguous = [
		...candidates(),
		{ slot: 7, raw: 'p1b', name: 'Playback 1', stereoKnown: true, stereo: false },
		{ slot: 8, raw: 'p2b', name: 'Playback 2', stereoKnown: true, stereo: false },
	]
	assert.throws(
		() => materialize.chooseTopologyBootstrapPlayback(ambiguous),
		/Ambiguous confirmed-mono Playback topology/,
	)
})

test('topology materialisation harness contains only paired explicit stereo on and mono restore actions', () => {
	const pair = {
		left: { slot: 3, raw: 'p1', name: 'Playback 1', stereoKnown: true, stereo: false },
		right: { slot: 4, raw: 'p2', name: 'Playback 2', stereoKnown: true, stereo: false },
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
		[3, 4, 3, 4],
	)
})

test('topology materialisation has no broader Focusrite write family or direct protocol path', () => {
	assert.doesNotMatch(
		source,
		/definitionId:\s*['"](?:mix_mute|mix_solo|mix_gain|mixer_slot_source|output_source|advanced_raw)['"]/,
	)
	assert.doesNotMatch(source, /<set\b|\.writeItem\(|\.sendSet\(|net\.connect|createConnection/)
	assert.match(source, /topologySourcesMatch/)
	assert.match(source, /Any unconfirmed topology\/source restore = HARD ABORT/)
})

test('existing Mix launcher runs guarded materialisation after isolation confirmation and before the closure runner', () => {
	const selfCheck = launcher.indexOf('MixTopologyMaterialize.js')
	const preflight = launcher.indexOf('[1/3] PREFLIGHT READ-ONLY')
	const isolation = launcher.indexOf('ALL_ISOLATED')
	const materializeRun = launcher.indexOf('MixTopologyMaterialize.js" --allow-topology-materialize')
	const closureRun = launcher.indexOf('MixFeedbackClosureRunner.js" --allow-mix-feedback-writes')
	assert.ok(selfCheck >= 0)
	assert.ok(selfCheck < preflight)
	assert.ok(materializeRun > isolation)
	assert.ok(closureRun > materializeRun)
	assert.match(launcher, /mix-topology-materialize\.test\.js/)
})
