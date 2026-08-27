'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const {
	TRANSIENT_RACE_WINDOW_MS,
	isReversePass,
	reconcileEvents,
	reconcileReport,
} = require('../testbench/ManualFeedbackSweepReconcile')

const repoRoot = path.join(__dirname, '..')

function event(atMs, status, before, after, definitionId = 'input_air', options = { input: '0' }) {
	return {
		atMs,
		definitionId,
		options,
		before,
		after,
		oracleSource: 'input_1_air',
		oracleClass: status === 'PASS' ? (after === 'T' ? 'TRUE' : 'FALSE') : 'FALSE',
		status,
	}
}

test('quick reverse PASS reclassifies a captured mismatch as transient race', () => {
	const failed = event(1000, 'FAIL_MISMATCH', 'F', 'T')
	const reversed = event(1240, 'PASS', 'T', 'F')
	assert.equal(isReversePass(failed, reversed), true)
	const result = reconcileEvents([failed, reversed])
	assert.equal(result.transientRaceEvents, 1)
	assert.equal(result.confirmedMismatchEvents, 0)
	assert.equal(result.events[0].status, 'TRANSIENT_RACE')
	assert.equal(result.events[0].captureStatus, 'FAIL_MISMATCH')
	assert.equal(result.events[0].raceDeltaMs, 240)
})

test('race reconciliation is idempotent', () => {
	const first = reconcileEvents([event(1000, 'FAIL_MISMATCH', 'F', 'T'), event(1240, 'PASS', 'T', 'F')])
	const second = reconcileEvents(first.events)
	assert.equal(second.transientRaceEvents, 1)
	assert.equal(second.confirmedMismatchEvents, 0)
	assert.equal(second.events[0].status, 'TRANSIENT_RACE')
	assert.equal(second.events[0].raceDeltaMs, 240)
})

test('a persistent mismatch is never hidden without a fast inverse PASS', () => {
	const failed = event(1000, 'FAIL_MISMATCH', 'F', 'T')
	const lateReverse = event(1000 + TRANSIENT_RACE_WINDOW_MS + 1, 'PASS', 'T', 'F')
	const result = reconcileEvents([failed, lateReverse])
	assert.equal(result.transientRaceEvents, 0)
	assert.equal(result.confirmedMismatchEvents, 1)
	assert.equal(result.events[0].status, 'FAIL_MISMATCH')
})

test('same-family activity on another target cannot resolve a mismatch', () => {
	const failed = event(1000, 'FAIL_MISMATCH', 'F', 'T', 'output_mute', { output: '2' })
	const other = event(1200, 'PASS', 'T', 'F', 'output_mute', { output: '3' })
	assert.equal(isReversePass(failed, other), false)
	assert.equal(reconcileEvents([failed, other]).confirmedMismatchEvents, 1)
})

test('report reconciliation separates observed activity, timing races and confirmed mismatches', () => {
	const report = {
		reportVersion: 4,
		reportClass: 'manual-feedback-sweep-local-sanitized',
		recording: {
			events: [
				event(1000, 'FAIL_MISMATCH', 'F', 'T'),
				event(1240, 'PASS', 'T', 'F'),
				event(2000, 'PASS', 'F', 'T', 'monitor_mute', {}),
			],
		},
		controls: {
			summary: { total: 2, bothStates: 2, singleState: 0, unresolved: 0, mismatch: 1, transitions: 3 },
			paths: [
				{
					id: 'input_air:0/8',
					definitionId: 'input_air',
					options: { input: '0' },
					seenTrue: true,
					seenFalse: true,
					mismatch: true,
				},
				{
					id: 'monitor_mute:6/44',
					definitionId: 'monitor_mute',
					options: {},
					seenTrue: true,
					seenFalse: true,
					mismatch: false,
				},
			],
		},
		meters: { summary: { mismatch: 0 } },
	}
	const reconciled = reconcileReport(report)
	assert.equal(reconciled.reportVersion, 5)
	assert.equal(reconciled.controls.summary.mismatch, 0)
	assert.equal(reconciled.controls.summary.transientRacePaths, 1)
	assert.equal(reconciled.controls.summary.transientRaceEvents, 1)
	assert.equal(reconciled.controls.summary.confirmedPassEvents, 2)
	assert.equal(reconciled.controls.paths[0].mismatch, false)
	assert.equal(reconciled.controls.paths[0].transientRace, true)
	assert.match(reconciled.reconciliation.classification, /not counted as PASS or confirmed mismatch/i)
})

test('manual feedback launcher reconciles normal runs and supports reconcile-only recovery', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_MANUAL_FEEDBACK_SWEEP.cmd'), 'utf8')
	assert.match(source, /ManualFeedbackSweepReconcile\.js/)
	assert.match(source, /RECONCILE_ONLY/i)
	assert.match(source, /RECORDER_EXITCODE/)
	assert.match(source, /RECONCILE_EXITCODE/)
})
