'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	keyOf,
	labelOf,
	controlProbes,
	recorderTargetProbes,
	changedProbes,
	oracleValueClass,
	newControlTrack,
	applyControlObservation,
	summarizeControlTracks,
	newMeterTrack,
	mergeMeterEvidence,
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

test('free recorder targets every non-meter feedback with an independent oracle', () => {
	const probes = [
		{ row: 1, column: 1, definitionId: 'monitor_mute', options: {} },
		{ row: 1, column: 2, definitionId: 'monitor_talkback', options: {} },
		{ row: 1, column: 3, definitionId: 'input_air', options: { input: 0 } },
		{ row: 1, column: 4, definitionId: 'output_source', options: { output: 0, source: 'Playback 1' } },
		{ row: 1, column: 5, definitionId: 'mix_mute', options: { mix: 'Mix A', side: 'left', slot: 1 } },
	]
	assert.deepEqual(recorderTargetProbes(probes), probes)
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

test('free recorder sanitizes oracle state classes instead of storing raw values', () => {
	assert.equal(oracleValueClass({ kind: 'bool' }, 'true'), 'TRUE')
	assert.equal(oracleValueClass({ kind: 'bool' }, 'false'), 'FALSE')
	assert.equal(oracleValueClass({ kind: 'connected' }, 'Connected (authorised)'), 'CONNECTED')
	assert.equal(oracleValueClass({ kind: 'equals', value: 'Playback 1' }, 'Playback 1'), 'MATCH')
	assert.equal(oracleValueClass({ kind: 'equals', value: 'Playback 1' }, 'Playback 2'), 'OTHER')
	assert.equal(oracleValueClass({ kind: 'equals', value: 'Playback 1' }, ''), 'UNKNOWN')
})

test('free recorder control tracker preserves both-state and mismatch evidence', () => {
	const probe = { row: 1, column: 1, definitionId: 'input_air', options: { input: 0 } }
	const track = newControlTrack(probe, 'F')
	applyControlObservation(track, 'T', 'PASS')
	assert.deepEqual(summarizeControlTracks(new Map([[track.id, track]])), {
		total: 1,
		bothStates: 1,
		singleState: 0,
		unresolved: 0,
		mismatch: 0,
		transitions: 1,
	})
	applyControlObservation(track, 'F', 'FAIL_MISMATCH')
	assert.equal(track.mismatch, true)
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

test('manual recorder merges prior manual meter evidence instead of regressing it', () => {
	const probe = { row: 2, column: 3, definitionId: 'output_meter', options: { output: 13, threshold: -128 } }
	const track = newMeterTrack(probe)
	const tracks = new Map([[track.id, track]])
	const loaded = mergeMeterEvidence(tracks, [
		{
			id: track.id,
			source: track.source,
			threshold: track.threshold,
			min: -128,
			max: -29.834,
			samples: 952,
			seenFloor: true,
			seenMovement: true,
			mismatch: false,
			mismatchCount: 0,
		},
	])
	assert.equal(loaded, 1)
	assert.equal(meterStatus(track), 'PASS_FLOOR_AND_MOVEMENT')
	assert.equal(track.samples, 952)
})

test('manual feedback recorder source contains no Companion press or Focusrite write path', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'ManualFeedbackSweep.js'), 'utf8')
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/press\b/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /advanced_raw_set/)
	assert.match(source, /hardwareWritesByHarness:\s*false/)
	assert.match(source, /companionButtonPressesByHarness:\s*false/)
	assert.match(source, /r9\.probes\.length !== 829/)
	assert.match(source, /controls\.length !== 783/)
	assert.match(source, /recorderControls\.length !== 783/)
	assert.match(source, /meters\.length !== 46/)
	assert.match(source, /LATEST_METER_FEEDBACK_CLOSURE\.json/)
	assert.match(source, /mismatchStreak\s*>=\s*3/)
})

test('manual feedback recorder scans all non-meter rendered feedbacks during REC', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'ManualFeedbackSweep.js'), 'utf8')
	assert.match(source, /captureMarkers\(context\.baseUrl, context\.r9\.pageNumber, probes\)/)
	assert.match(source, /changedProbes\(probes, current, next\)/)
	assert.match(source, /validateChangedMarker/)
	assert.match(source, /averageScanCycleMs/)
	assert.doesNotMatch(source, /RECORDER_TARGET_DEFINITIONS/)
})

test('manual feedback recorder is free-running with explicit REC boundaries', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'ManualFeedbackSweep.js'), 'utf8')
	assert.match(source, />>> REC ON <<</)
	assert.match(source, />>> REC OFF <<</)
	assert.match(source, /ENTREE pour DEMARRER/)
	assert.match(source, /ENTREE seulement quand tu veux ARRETER/)
	assert.doesNotMatch(source, /Controle a tester/)
	assert.doesNotMatch(source, /tape CAPTURE/)
	assert.doesNotMatch(source, /tape RESTORED/)
	assert.match(source, /LATEST_REPORT, kind: 'manual'/)
})

test('manual feedback sweep launcher states the free-running read-only recorder contract', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_MANUAL_FEEDBACK_SWEEP.cmd'), 'utf8')
	assert.match(source, /Aucun write Focusrite/i)
	assert.match(source, /Aucun bouton Companion/i)
	assert.match(source, /783 feedbacks/i)
	assert.match(source, /46 meters/i)
	assert.match(source, /REC ON/i)
	assert.match(source, /ManualFeedbackSweep\.js/)
})
