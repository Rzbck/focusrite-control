'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const test = require('node:test')
const assert = require('node:assert/strict')

const { METER_FLOOR_DBFS } = require('../testbench/MeterFeedbackClosure')
const { METER_DRIVE_GAIN_DB } = require('../testbench/MeterRoutingPage')
const {
	playbackSlotBaseline,
	actionBoolState,
	augmentMixPlaybackHarness,
} = require('../testbench/MeterMixPlaybackPage')
const { laneActionability, classifyEntries } = require('../testbench/MeterMixPlaybackActionability')
const { ALLOW_MIX_FLAG, ISOLATION_FLAG, checksForState } = require('../testbench/MeterMixPlaybackClosure')

const repoRoot = path.join(__dirname, '..')

function syntheticBuilt() {
	return {
		signature: 'synthetic-focused-mix',
		batches: [],
		locations: {},
		file: {
			page: {
				name: 'Synthetic focused mix',
				controls: {},
				gridSize: { minColumn: 0, maxColumn: 45, minRow: 0, maxRow: 0 },
			},
		},
	}
}

function syntheticSnapshot() {
	return {
		shape: {
			lanes: [
				{ mix: 'Mix A', side: 'left' },
				{ mix: 'Mix A', side: 'right' },
			],
		},
		values: {
			mix_mix_a_l_slot_3_gain: { exists: true, value: '-31.5' },
			mix_mix_a_l_slot_3_mute: { exists: true, value: 'false' },
			mix_mix_a_l_slot_3_solo: { exists: true, value: 'true' },
			mix_mix_a_l_slot_4_gain: { exists: true, value: '' },
			mix_mix_a_l_slot_4_mute: { exists: true, value: 'unknown' },
			mix_mix_a_r_slot_3_gain: { exists: true, value: '-22' },
			mix_mix_a_r_slot_3_mute: { exists: true, value: 'true' },
			mix_mix_a_r_slot_3_solo: { exists: true, value: 'false' },
		},
	}
}

function syntheticMixTrack(label, { floor = false, movement = false, mismatch = false } = {}) {
	return {
		definitionId: 'mix_meter',
		label,
		seenFloor: floor,
		seenMovement: movement,
		mismatch,
	}
}

test('focused mix baseline requires only the detected Playback strip, not all 24 lane strips', () => {
	const snapshot = syntheticSnapshot()
	const baseline = playbackSlotBaseline(snapshot, { mix: 'Mix A', side: 'left' }, 3)
	assert.deepEqual(
		{ gain: baseline.gain, mute: baseline.mute, solo: baseline.solo },
		{ gain: -31.5, mute: 'false', solo: 'true' },
	)
	assert.equal(playbackSlotBaseline(snapshot, { mix: 'Mix A', side: 'left' }, 4), null)
})

test('focused mix harness touches only selected Playback slot gain/mute/solo and restores exact baselines', () => {
	const result = augmentMixPlaybackHarness(syntheticBuilt(), syntheticSnapshot(), 3)
	assert.equal(result.lanes.length, 2)
	assert.ok(result.lanes.every((entry) => entry.status === 'READY'))
	assert.equal(result.built.batches.length, 6)
	const specs = result.built.batches.flatMap((batch) => batch.specs)
	assert.ok(specs.every((spec) => Number(spec.options.slot) === 3))
	assert.ok(specs.every((spec) => ['mix_gain_set', 'mix_mute', 'mix_solo'].includes(spec.definitionId)))
	assert.equal(
		specs.some((spec) => spec.definitionId === 'output_pair_source'),
		false,
	)
	const left = result.lanes[0]
	const floor = checksForState(left, 'floor')
	const drive = checksForState(left, 'drive')
	const restore = checksForState(left, 'restore')
	assert.equal(floor[0].expected, String(METER_FLOOR_DBFS))
	assert.equal(drive[0].expected, String(METER_DRIVE_GAIN_DB))
	assert.deepEqual(
		restore.map((check) => check.expected),
		['-31.5', 'true', 'false'],
	)
})

test('focused mix harness emits Companion boolean action states as on/off and preserves true baselines', () => {
	assert.equal(actionBoolState('true'), 'on')
	assert.equal(actionBoolState('false'), 'off')
	assert.throws(() => actionBoolState('unknown'), /Cannot encode unknown focused mix boolean action state/)

	const result = augmentMixPlaybackHarness(syntheticBuilt(), syntheticSnapshot(), 3)
	const booleanSpecs = result.built.batches
		.flatMap((batch) => batch.specs.map((spec) => ({ batch: batch.id, spec })))
		.filter(({ spec }) => ['mix_mute', 'mix_solo'].includes(spec.definitionId))

	assert.ok(booleanSpecs.length > 0)
	assert.ok(booleanSpecs.every(({ spec }) => ['on', 'off'].includes(spec.options.state)))
	assert.ok(booleanSpecs.every(({ spec }) => !['true', 'false'].includes(spec.options.state)))

	const left = result.lanes.find((entry) => entry.lane.mix === 'Mix A' && entry.lane.side === 'left')
	const right = result.lanes.find((entry) => entry.lane.mix === 'Mix A' && entry.lane.side === 'right')
	assert.ok(left?.batches)
	assert.ok(right?.batches)

	const leftFloorMute = booleanSpecs.find(
		({ batch, spec }) => batch === left.batches.floor && spec.definitionId === 'mix_mute',
	)
	const leftRestoreSolo = booleanSpecs.find(
		({ batch, spec }) => batch === left.batches.restore && spec.definitionId === 'mix_solo',
	)
	const rightRestoreMutes = booleanSpecs.filter(
		({ batch, spec }) => batch === right.batches.restore && spec.definitionId === 'mix_mute',
	)
	assert.equal(leftFloorMute?.spec.options.state, 'on')
	assert.equal(leftRestoreSolo?.spec.options.state, 'on')
	assert.deepEqual(
		rightRestoreMutes.map(({ spec }) => spec.options.state),
		['on', 'on'],
	)
})

test('focused mix actionability skips already-closed meters and keeps only pending exact-baseline lanes', () => {
	const result = augmentMixPlaybackHarness(syntheticBuilt(), syntheticSnapshot(), 3)
	const tracks = new Map([
		['left', syntheticMixTrack('Mix Mix A left', { floor: true, movement: true })],
		['right', syntheticMixTrack('Mix Mix A right', { movement: true })],
	])

	assert.equal(laneActionability(result.lanes[0], tracks), 'SKIP_ALREADY_CLOSED')
	assert.equal(laneActionability(result.lanes[1], tracks), 'ACTIONABLE')
	assert.deepEqual(
		classifyEntries(result.lanes, tracks).map((entry) => entry.actionability),
		['SKIP_ALREADY_CLOSED', 'ACTIONABLE'],
	)

	const unknown = { ...result.lanes[1], status: 'SKIP_BASELINE_UNKNOWN' }
	assert.equal(laneActionability(unknown, tracks), 'SKIP_BASELINE_UNKNOWN')
})

test('focused mix harness skips only the lane whose selected Playback strip baseline is unknown', () => {
	const snapshot = syntheticSnapshot()
	snapshot.values.mix_mix_a_r_slot_3_gain.value = ''
	const result = augmentMixPlaybackHarness(syntheticBuilt(), snapshot, 3)
	assert.deepEqual(
		result.lanes.map((entry) => entry.status),
		['READY', 'SKIP_BASELINE_UNKNOWN'],
	)
	assert.equal(result.built.batches.length, 3)
})

test('focused mix campaign contains no output routing, direct protocol, raw, or mixer-slot source write path', () => {
	const closure = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterMixPlaybackClosure.js'), 'utf8')
	const page = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterMixPlaybackPage.js'), 'utf8')
	const actionability = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterMixPlaybackActionability.js'), 'utf8')
	for (const source of [closure, page, actionability]) {
		assert.doesNotMatch(source, /<set\b/i)
		assert.doesNotMatch(source, /\bsetValue\s*\(/)
		assert.doesNotMatch(source, /definitionId\s*:\s*['"]output_pair_source['"]/)
		assert.doesNotMatch(source, /definitionId\s*:\s*['"]output_source['"]/)
		assert.doesNotMatch(source, /definitionId\s*:\s*['"]mixer_slot_source['"]/)
		assert.doesNotMatch(source, /definitionId\s*:\s*['"]advanced_raw_set['"]/)
	}
	assert.equal(ALLOW_MIX_FLAG, '--allow-mix-meter-writes')
	assert.equal(ISOLATION_FLAG, '--confirm-all-output-routing-isolated')
	assert.match(closure, /activeChanges\.add\(token\)\s+touched = true\s+await pressBatch/)
	assert.match(closure, /RESTORE FAILED/)
})

test('focused mix launcher gates actionability before write permission and stays open for result capture', () => {
	const launcherPath = path.join(repoRoot, 'testbench', 'RUN_METER_MIX_PLAYBACK_CLOSURE.cmd')
	const source = fs.readFileSync(launcherPath, 'utf8')
	const prep = source.indexOf('MeterRoutingPrepare.js')
	const actionability = source.indexOf('MeterMixPlaybackActionability.js')
	const permission = source.indexOf('MIX_METERS')
	assert.ok(prep >= 0)
	assert.ok(actionability > prep)
	assert.ok(permission > actionability)
	assert.match(source, /MIX METER NO-OP SAFE/)
	assert.match(source, /PAGE2_AUTO/)
	assert.match(source, /ALL_ISOLATED/)
	assert.match(source, /--allow-mix-meter-writes --confirm-all-output-routing-isolated/)
	assert.match(source, /ne touche PAS aux Output Source/i)
	assert.ok((source.match(/^\s*pause\s*$/gim) || []).length >= 4)
	const blob = execFileSync('git', ['show', 'HEAD:testbench/RUN_METER_MIX_PLAYBACK_CLOSURE.cmd'], {
		cwd: repoRoot,
		windowsHide: true,
	})
	assert.equal(blob.includes(0x0d), false)
})
