'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	buildDiagnosticTargets,
	classifyDiagnosticValue,
	newDiagnosticTrack,
	applyDiagnosticObservation,
	summarizeDiagnosticTracks,
	diagnosticPaths,
} = require('../testbench/ManualFeedbackSweepDiagnostics')

const repoRoot = path.join(__dirname, '..')

function probe(definitionId, options) {
	return { definitionId, options }
}

test('broad recorder derives safe semantic diagnostics from the existing feedback matrix', () => {
	const targets = buildDiagnosticTargets([
		probe('output_source', { output: 2, source: 'Playback 3' }),
		probe('mixer_slot_source', { slot: 7, source: 'Playback 1' }),
		probe('mixer_slot_stereo', { slot: 7 }),
		probe('mix_mute', { mix: 'Mix B', side: 'left', slot: 7 }),
		probe('mix_solo', { mix: 'Mix B', side: 'left', slot: 7 }),
	])
	const ids = new Set(targets.map((target) => target.id))
	for (const id of [
		'output_3_source_name',
		'output_3_stereo',
		'output_3_mute',
		'output_3_gain',
		'output_3_assign_mix_class',
		'output_3_assign_mix_provenance',
		'mixer_slot_7_source_name',
		'mixer_slot_7_stereo',
		'mix_mix_b_l_slot_7_gain',
		'mix_mix_b_l_slot_7_pan',
	]) {
		assert.equal(ids.has(id), true, id)
	}
	assert.equal([...ids].some((id) => /nickname/i.test(id)), false)
	assert.equal(ids.has('mixer_slot_7_source'), false)
})

test('diagnostic source names remain semantic and numeric raw source ids are masked', () => {
	const target = { id: 'output_3_source_name', label: 'Output 3: source', kind: 'sourceName' }
	const track = newDiagnosticTrack(target, { value: 'Playback 3' })
	assert.equal(track.baseline, 'Playback 3')
	assert.equal(classifyDiagnosticValue(target, 'Mix D L', track), 'Mix D L')
	assert.equal(classifyDiagnosticValue(target, '1474', track), 'UNRESOLVED_SOURCE')
})

test('diagnostic opaque values preserve equality changes without storing raw values', () => {
	const target = { id: 'mix_mix_b_l_slot_7_gain', label: 'Mix B L slot 7: gain', kind: 'opaque' }
	const track = newDiagnosticTrack(target, { value: '12345' })
	assert.equal(track.baseline, 'V1')
	assert.equal(classifyDiagnosticValue(target, '12345', track), 'V1')
	assert.equal(classifyDiagnosticValue(target, '23456', track), 'V2')
	assert.equal(applyDiagnosticObservation(track, 'V2'), true)
	assert.equal(applyDiagnosticObservation(track, 'V2'), false)
	assert.deepEqual(summarizeDiagnosticTracks(new Map([[target.id, track]])), {
		total: 1,
		changed: 1,
		transitions: 1,
		unknownBaseline: 0,
		unknownCurrent: 0,
	})
	assert.deepEqual(diagnosticPaths(new Map([[target.id, track]]))[0].observed, ['V1', 'V2'])
})

test('diagnostic booleans and provenance are sanitized to stable classes', () => {
	const boolTarget = { id: 'output_3_stereo', label: 'Output 3: stereo', kind: 'bool' }
	const boolTrack = newDiagnosticTrack(boolTarget, { value: 'on' })
	assert.equal(boolTrack.baseline, 'true')
	assert.equal(classifyDiagnosticValue(boolTarget, 'off', boolTrack), 'false')

	const provenanceTarget = {
		id: 'output_3_assign_mix_provenance',
		label: 'Output 3: assign-mix provenance',
		kind: 'provenance',
	}
	const provenanceTrack = newDiagnosticTrack(provenanceTarget, { value: 'never-observed' })
	assert.equal(provenanceTrack.baseline, 'never-observed')
	assert.equal(classifyDiagnosticValue(provenanceTarget, 'set', provenanceTrack), 'set')
	assert.equal(classifyDiagnosticValue(provenanceTarget, 'private-value', provenanceTrack), 'KNOWN_PROVENANCE')
})

test('diagnostic helper is read-only and excludes private identity and raw source variables', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'ManualFeedbackSweepDiagnostics.js'), 'utf8')
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/press\b/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /advanced_raw_set/)
	assert.doesNotMatch(source, /server_host|server_port|device_serial|device_id|client_control_id|nickname/i)
	assert.doesNotMatch(source, /`mixer_slot_\$\{slot\}_source`/)
	assert.match(source, /mixer_slot_\$\{slot\}_source_name/)
	assert.match(source, /assign_mix_class/)
	assert.match(source, /slot_\$\{slot\}_gain/)
	assert.match(source, /slot_\$\{slot\}_pan/)
})

test('existing manual feedback recorder integrates semantic diagnostics without a second workflow', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'ManualFeedbackSweep.js'), 'utf8')
	assert.match(source, /ManualFeedbackSweepDiagnostics/)
	assert.match(source, /buildDiagnosticTargets/)
	assert.match(source, /seedDiagnosticTracks/)
	assert.match(source, /observeDiagnostics/)
	assert.match(source, /diagnosticEvents/)
	assert.match(source, /diagnosticPaths/)
	assert.match(source, /reportVersion:\s*6/)
	assert.doesNotMatch(source, /\bpost\s*\(/)
	assert.doesNotMatch(source, /\/press\b/)
	assert.doesNotMatch(source, /<set\b/i)
})

test('existing manual feedback launcher remains the single broad REC entrypoint', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_MANUAL_FEEDBACK_SWEEP.cmd'), 'utf8')
	assert.match(source, /ManualFeedbackSweep\.js/)
	assert.match(source, /REC ON/i)
	assert.match(source, /783 feedbacks/i)
	assert.match(source, /46 meters/i)
	assert.match(source, /semanti/i)
	assert.match(source, /read.only|read only/i)
})
