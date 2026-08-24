'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	laneVariables,
	classifyObservation,
	mergeObserved,
} = require('../testbench/MeterMixPlaybackBaselineReadOnlyProbe')

const repoRoot = path.join(__dirname, '..')

function item(value, exists = true) {
	return { exists, value }
}

test('read-only baseline probe classifies only server-confirmed nonblank strip state as exact', () => {
	assert.deepEqual(laneVariables({ mix: 'Mix B', side: 'left' }, 3), {
		gain: 'mix_mix_b_l_slot_3_gain',
		mute: 'mix_mix_b_l_slot_3_mute',
		solo: 'mix_mix_b_l_slot_3_solo',
	})

	assert.deepEqual(classifyObservation({ gain: item(''), mute: item('false'), solo: item('false') }), {
		gainKnown: false,
		muteKnown: true,
		soloKnown: true,
		exactBaseline: false,
	})
	assert.deepEqual(classifyObservation({ gain: item('-24'), mute: item('false'), solo: item('true') }), {
		gainKnown: true,
		muteKnown: true,
		soloKnown: true,
		exactBaseline: true,
	})

	const observed = new Map()
	mergeObserved(observed, [
		{
			lane: { mix: 'Mix B', side: 'left' },
			gainKnown: false,
			muteKnown: true,
			soloKnown: false,
			exactBaseline: false,
		},
	])
	mergeObserved(observed, [
		{
			lane: { mix: 'Mix B', side: 'left' },
			gainKnown: true,
			muteKnown: false,
			soloKnown: true,
			exactBaseline: true,
		},
	])
	assert.deepEqual(observed.get('Mix B/left'), {
		lane: { mix: 'Mix B', side: 'left' },
		gainKnown: true,
		muteKnown: true,
		soloKnown: true,
		exactBaseline: true,
	})
})

test('read-only baseline probe and launcher contain no hardware-write or Companion-press path', () => {
	const probe = fs.readFileSync(path.join(repoRoot, 'testbench', 'MeterMixPlaybackBaselineReadOnlyProbe.js'), 'utf8')
	const launcher = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_METER_MIX_BASELINE_READONLY.cmd'), 'utf8')

	for (const source of [probe, launcher]) {
		assert.doesNotMatch(source, /<set\b/i)
		assert.doesNotMatch(source, /\bsetValue\s*\(/)
		assert.doesNotMatch(source, /\bpressLocation\s*\(/)
		assert.doesNotMatch(source, /\/api\/location\//)
		assert.doesNotMatch(source, /replacePage2FromFile/)
		assert.doesNotMatch(source, /--allow-hardware-writes/)
		assert.doesNotMatch(source, /--allow-mix-meter-writes/)
	}
	assert.match(launcher, /MeterMixPlaybackBaselineReadOnlyProbe\.js/)
	assert.doesNotMatch(launcher, /MIX_METERS/)
	assert.doesNotMatch(launcher, /ALL_ISOLATED/)
})
