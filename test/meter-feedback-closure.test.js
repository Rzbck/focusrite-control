'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	METER_FLOOR_DBFS,
	buildMeterDescriptors,
	newTrack,
	applySample,
	classifyTrack,
	summarizeTracks,
	reportPayload,
} = require('../testbench/MeterFeedbackClosure')

function syntheticR9(threshold = '-30') {
	const probes = []
	let column = 0
	for (let input = 0; input < 8; input++) {
		probes.push({
			definitionId: 'input_meter',
			row: 0,
			column: column++,
			options: { input: String(input), threshold },
		})
	}
	for (let output = 0; output < 26; output++) {
		probes.push({
			definitionId: 'output_meter',
			row: 1,
			column: column++,
			options: { output: String(output), threshold },
		})
	}
	for (const mix of ['A', 'B', 'C', 'D', 'E', 'F']) {
		for (const side of ['left', 'right']) {
			probes.push({
				definitionId: 'mix_meter',
				row: 2,
				column: column++,
				options: { mix, side, threshold },
			})
		}
	}
	return { probes }
}

test('meter closure inventory covers exactly 8 input + 26 output + 12 mix paths', () => {
	const descriptors = buildMeterDescriptors(syntheticR9())
	assert.equal(descriptors.length, 46)
	assert.equal(descriptors.filter((entry) => entry.definitionId === 'input_meter').length, 8)
	assert.equal(descriptors.filter((entry) => entry.definitionId === 'output_meter').length, 26)
	assert.equal(descriptors.filter((entry) => entry.definitionId === 'mix_meter').length, 12)
	assert.equal(new Set(descriptors.map((entry) => entry.source)).size, 46)
	assert.ok(descriptors.every((entry) => Number.isFinite(entry.threshold)))
})

test('meter closure requires numeric floor plus real movement for PASS', () => {
	const descriptor = buildMeterDescriptors(syntheticR9())[0]
	const track = newTrack(descriptor)
	applySample(track, { marker: 'F', value: METER_FLOOR_DBFS })
	assert.equal(classifyTrack(track), 'MANUAL_PENDING_FLOOR_ONLY')
	applySample(track, { marker: 'T', value: -12 })
	assert.equal(classifyTrack(track), 'PASS_FLOOR_AND_MOVEMENT')
	assert.equal(track.min, METER_FLOOR_DBFS)
	assert.equal(track.max, -12)
	assert.equal(track.seenFloor, true)
	assert.equal(track.seenMovement, true)
})

test('threshold -128 does not misclassify silent floor as movement-only evidence', () => {
	const descriptor = buildMeterDescriptors(syntheticR9('-128'))[0]
	const track = newTrack(descriptor)
	applySample(track, { marker: 'T', value: -128 })
	assert.equal(track.seenFloor, true)
	assert.equal(track.seenMovement, false)
	assert.equal(track.seenFeedbackTrue, true)
	assert.equal(classifyTrack(track), 'MANUAL_PENDING_FLOOR_ONLY')
	applySample(track, { marker: 'T', value: -40 })
	assert.equal(classifyTrack(track), 'PASS_FLOOR_AND_MOVEMENT')
})

test('meter mismatch is sticky and can never be hidden by later matching samples', () => {
	const descriptor = buildMeterDescriptors(syntheticR9())[0]
	const track = newTrack(descriptor)
	applySample(track, { marker: 'T', value: -60 })
	assert.equal(classifyTrack(track), 'FAIL_MISMATCH')
	applySample(track, { marker: 'F', value: -128 })
	applySample(track, { marker: 'T', value: -5 })
	assert.equal(classifyTrack(track), 'FAIL_MISMATCH')
	assert.equal(track.mismatch, true)
	assert.equal(track.mismatchCount, 1)
})

test('meter closure summary keeps floor/movement partial evidence separate from mismatches', () => {
	const descriptors = buildMeterDescriptors(syntheticR9()).slice(0, 4)
	const tracks = new Map(descriptors.map((descriptor) => [descriptor.id, newTrack(descriptor)]))
	const list = [...tracks.values()]
	applySample(list[0], { marker: 'F', value: -128 })
	applySample(list[0], { marker: 'T', value: -10 })
	applySample(list[1], { marker: 'F', value: -128 })
	applySample(list[2], { marker: 'T', value: -10 })
	applySample(list[3], { marker: 'T', value: -60 })
	const summary = summarizeTracks(tracks)
	assert.equal(summary.total, 4)
	assert.equal(summary.closed, 1)
	assert.equal(summary.floorOnly, 1)
	assert.equal(summary.movementOnly, 1)
	assert.equal(summary.mismatch, 1)
	assert.equal(summary.complete, false)
})

test('meter report is sanitized and records floor/movement evidence mode', () => {
	const descriptor = buildMeterDescriptors(syntheticR9())[0]
	const tracks = new Map([[descriptor.id, newTrack(descriptor)]])
	applySample(tracks.get(descriptor.id), { marker: 'F', value: -128 })
	const payload = reportPayload({
		model: 'Scarlett 18i20 (3rd Gen)',
		moduleVersion: '0.1.16',
		signature: 'synthetic-signature',
		tracks,
	})
	const text = JSON.stringify(payload)
	assert.equal(payload.reportVersion, 2)
	assert.equal(payload.evidenceMode, 'floor-and-movement-v2')
	assert.equal(payload.meterFloorDbfs, -128)
	assert.equal(payload.readOnly, true)
	assert.equal(payload.hardwareWrites, false)
	assert.equal(payload.companionButtonPresses, false)
	assert.equal(payload.routingChangesByHarness, false)
	for (const forbidden of ['baseUrl', 'connectionLabel', 'clientId', 'clientKey', 'hostname', 'serial']) {
		assert.equal(text.includes(forbidden), false)
	}
})

test('meter closure source has no Companion press or Focusrite write path', () => {
	const source = fs.readFileSync(path.join(__dirname, '..', 'testbench', 'MeterFeedbackClosure.js'), 'utf8')
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/api\/location\//)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /\bsetValue\s*\(/)
	assert.doesNotMatch(source, /allow-hardware-writes/)
	assert.doesNotMatch(source, /PublishLatestShareable/)
})
