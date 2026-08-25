'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	keyOf,
	labelOf,
	controlProbes,
	changedProbes,
	newMeterTrack,
	applyMeterSample,
	meterStatus,
	summarizeMeterTracks,
} = require('../testbench/ManualFeedbackSweep')

const repoRoot = path.join(__dirname, '..')

test('manual feedback sweep excludes meters from per-control attribution', () => {
	const probes = [
		{ row: 1, column: 1, definitionId: 'input_air', options: { input: 0 } },
		{ row: 1, column: 2, definitionId: 'input_meter', options: { input: 0, threshold: -128 } },
		{ row: 1, column: 3, definitionId: 'input_pad', options: { input: 0 } },
	]
	assert.deepEqual(controlProbes(probes), [probes[0], probes[2]])
})

test('manual feedback sweep detects only changed rendered control markers', () => {
	const probes = [
		{ row: 1, column: 1, definitionId: 'input_air', options: { input: 0 } },
		{ row: 1, column: 2, definitionId: 'input_pad', options: { input: 0 } },
	]
	const before = new Map([
		['1/1', 'F'],
		['1/2', 'F'],
	])
	const after = new Map([
		['1/1', 'T'],
		['1/2', 'F'],
	])
	assert.deepEqual(changedProbes(probes, before, after), [probes[0]])
	assert.equal(keyOf(probes[0]), '1/1')
	assert.match(labelOf(probes[0]), /input_air/)
})

test('manual feedback sweep meter tracker records floor, movement and oracle agreement', () => {
	const probe = { row: 2, column: 3, definitionId: 'output_meter', options: { output: 13, threshold: -128 } }
	const track = newMeterTrack(probe)
	applyMeterSample(track, 'T', '-128')
	assert.equal(meterStatus(track), 'MANUAL_PENDING_FLOOR_ONLY')
	applyMeterSample(track, 'T', '-12.5')
	assert.equal(meterStatus(track), 'PASS_FLOOR_AND_MOVEMENT')
	assert.deepEqual(summarizeMeterTracks(new Map([[track.id, track]])), {
		total: 1,
		closed: 1,
		floorOnly: 0,
		movementOnly: 0,
		neverObserved: 0,
		mismatch: 0,
	})
})

test('manual feedback sweep requires persistent meter mismatch', () => {
	const probe = {
		row: 4,
		column: 5,
		definitionId: 'mix_meter',
		options: { mix: 'Mix B', side: 'left', threshold: -128 },
	}
	const track = newMeterTrack(probe)
	applyMeterSample(track, 'F', '-20')
	assert.equal(track.mismatch, false)
	applyMeterSample(track, 'T', '-20')
	assert.equal(track.mismatch, false)
	applyMeterSample(track, 'F', '-20')
	applyMeterSample(track, 'F', '-20')
	assert.equal(track.mismatch, false)
	applyMeterSample(track, 'F', '-20')
	assert.equal(track.mismatch, true)
})

test('manual feedback sweep source contains no Companion press or Focusrite write path', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'ManualFeedbackSweep.js'), 'utf8')
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/press\b/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /advanced_raw_set/)
	assert.match(source, /hardwareWritesByHarness:\s*false/)
	assert.match(source, /companionButtonPressesByHarness:\s*false/)
	assert.match(source, /r9\.probes\.length !== 829/)
	assert.match(source, /meters\.length !== 46/)
	assert.match(source, /LATEST_METER_FEEDBACK_CLOSURE\.json/)
	assert.match(source, /mismatchStreak\s*>=\s*3/)
})

test('manual feedback sweep launcher states the read-only and continuous-meter contract', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_MANUAL_FEEDBACK_SWEEP.cmd'), 'utf8')
	assert.match(source, /Aucun write Focusrite/i)
	assert.match(source, /Aucun bouton Companion/i)
	assert.match(source, /46 meters/i)
	assert.match(source, /ManualFeedbackSweep\.js/)
})
