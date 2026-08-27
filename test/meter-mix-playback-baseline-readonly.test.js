'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	laneVariables,
	laneProvenanceVariables,
	provenanceFlags,
	provenanceLabel,
	classifyObservation,
	mergeObserved,
	reportRow,
	reportOutputRouting,
} = require('../testbench/MeterMixPlaybackBaselineReadOnlyProbe')

const repoRoot = path.join(__dirname, '..')

function item(value, exists = true) {
	return { exists, value }
}

test('read-only baseline probe separates schema/value coverage from arrival/set provenance', () => {
	assert.deepEqual(laneVariables({ mix: 'Mix B', side: 'left' }, 3), {
		gain: 'mix_mix_b_l_slot_3_gain',
		mute: 'mix_mix_b_l_slot_3_mute',
		solo: 'mix_mix_b_l_slot_3_solo',
	})
	assert.deepEqual(laneProvenanceVariables({ mix: 'Mix B', side: 'left' }, 3), {
		gain: 'mix_mix_b_l_slot_3_gain_provenance',
		mute: 'mix_mix_b_l_slot_3_mute_provenance',
		solo: 'mix_mix_b_l_slot_3_solo_provenance',
	})
	assert.deepEqual(provenanceFlags(item('arrival')), { arrivalObserved: true, setObserved: false })
	assert.deepEqual(provenanceFlags(item('set')), { arrivalObserved: false, setObserved: true })
	assert.deepEqual(provenanceFlags(item('arrival+set')), { arrivalObserved: true, setObserved: true })
	assert.equal(provenanceLabel(false, false), 'never-observed')
	assert.equal(provenanceLabel(true, true), 'arrival+set')

	assert.deepEqual(
		classifyObservation({
			gain: item(''),
			mute: item('false'),
			solo: item('false'),
			gainProvenance: item(''),
			muteProvenance: item('set'),
			soloProvenance: item('arrival'),
		}),
		{
			gainSchemaPresent: true,
			muteSchemaPresent: true,
			soloSchemaPresent: true,
			gainKnown: false,
			muteKnown: true,
			soloKnown: true,
			gainArrivalObserved: false,
			gainSetObserved: false,
			muteArrivalObserved: false,
			muteSetObserved: true,
			soloArrivalObserved: true,
			soloSetObserved: false,
			exactBaseline: false,
		},
	)
})

test('read-only probe merges provenance over time without storing raw values', () => {
	const observed = new Map()
	mergeObserved(observed, [
		{
			lane: { mix: 'Mix B', side: 'left' },
			gainSchemaPresent: true,
			muteSchemaPresent: true,
			soloSchemaPresent: true,
			gainKnown: true,
			muteKnown: false,
			soloKnown: true,
			gainArrivalObserved: true,
			gainSetObserved: false,
			muteArrivalObserved: false,
			muteSetObserved: false,
			soloArrivalObserved: true,
			soloSetObserved: false,
			exactBaseline: false,
		},
	])
	mergeObserved(observed, [
		{
			lane: { mix: 'Mix B', side: 'left' },
			gainSchemaPresent: true,
			muteSchemaPresent: true,
			soloSchemaPresent: true,
			gainKnown: true,
			muteKnown: true,
			soloKnown: true,
			gainArrivalObserved: false,
			gainSetObserved: true,
			muteArrivalObserved: false,
			muteSetObserved: true,
			soloArrivalObserved: false,
			soloSetObserved: true,
			exactBaseline: true,
		},
	])

	const row = observed.get('Mix B/left')
	assert.equal(row.gainArrivalObserved, true)
	assert.equal(row.gainSetObserved, true)
	assert.equal(row.muteArrivalObserved, false)
	assert.equal(row.muteSetObserved, true)
	assert.equal(row.soloArrivalObserved, true)
	assert.equal(row.soloSetObserved, true)
	assert.equal(row.exactBaseline, true)

	assert.deepEqual(reportRow(row), {
		mix: 'Mix B',
		side: 'left',
		gainSchemaPresent: true,
		muteSchemaPresent: true,
		soloSchemaPresent: true,
		gainKnown: true,
		muteKnown: true,
		soloKnown: true,
		gainProvenance: 'arrival+set',
		muteProvenance: 'set',
		soloProvenance: 'arrival+set',
		exactBaseline: true,
	})
})

test('assign-mix read-only report preserves only opaque equality class and provenance', () => {
	const row = reportOutputRouting({
		index: 3,
		name: 'Line Output 3',
		sourceKnown: true,
		sourceName: 'Playback 3',
		stereoKnown: true,
		stereo: 'true',
		assignMixSchemaPresent: true,
		assignMixKnown: true,
		assignMixClass: 'V2',
		assignMixProvenance: 'set',
	})
	assert.deepEqual(row, {
		index: 3,
		name: 'Line Output 3',
		sourceKnown: true,
		sourceName: 'Playback 3',
		stereoKnown: true,
		stereo: 'true',
		assignMixSchemaPresent: true,
		assignMixKnown: true,
		assignMixClass: 'V2',
		assignMixProvenance: 'set',
	})
	assert.match(row.assignMixClass, /^V\d+$/)
	assert.doesNotMatch(JSON.stringify(row), /"assignMixRaw"|"itemId"/)
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
	assert.match(
		probe,
		/No raw values, item IDs, serial, hostname, endpoint, client identity, raw XML or user path is stored/,
	)
	assert.match(probe, /output_\$\{index\}_assign_mix_class/)
	assert.match(probe, /assignMix V1\/V2\/\.\.\. are opaque equality classes only/)
	assert.match(launcher, /MeterMixPlaybackBaselineReadOnlyProbe\.js/)
	assert.match(launcher, /0\.1\.19/)
	assert.match(launcher, /assign-mix est observe en LECTURE SEULE/)
	assert.doesNotMatch(launcher, /MIX_METERS/)
	assert.doesNotMatch(launcher, /ALL_ISOLATED/)
})
