'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const repoRoot = path.join(__dirname, '..')
const closure = require('../testbench/FeedbackCoreClosure')

const source = fs.readFileSync(path.join(repoRoot, 'testbench', 'FeedbackCoreClosure.js'), 'utf8')
const launcher = fs.readFileSync(path.join(repoRoot, 'testbench', 'RUN_FEEDBACK_CORE_CLOSURE.cmd'), 'utf8')
const plan = JSON.parse(fs.readFileSync(path.join(repoRoot, 'testbench', 'Focusrite_18i20_SafeHardwarePlan.json'), 'utf8'))

test('targeted Core feedback closure contains only the 18 still-open reversible Core feedback targets', () => {
	assert.equal(closure.TARGET_IDS.length, 18)
	assert.deepEqual(closure.TARGET_IDS.slice(0, 8), [
		'air-1',
		'air-2',
		'air-3',
		'air-4',
		'air-5',
		'air-6',
		'air-7',
		'air-8',
	])
	assert.deepEqual(closure.TARGET_IDS.slice(8, 16), [
		'pad-1',
		'pad-2',
		'pad-3',
		'pad-4',
		'pad-5',
		'pad-6',
		'pad-7',
		'pad-8',
	])
	assert.deepEqual(closure.TARGET_IDS.slice(16), ['monitor-mute', 'monitor-dim'])
	assert.equal(closure.TARGET_IDS.includes('talkback'), false)
	assert.equal(closure.TARGET_IDS.includes('input-1-mode'), false)
	assert.equal(closure.TARGET_IDS.includes('input-2-mode'), false)
	for (const id of closure.TARGET_IDS) assert.ok(plan.tests.some((item) => item.id === id), id)
})

test('feedback probe matching strips action-only state and remains target-specific', () => {
	const air = plan.tests.find((item) => item.id === 'air-1')
	const mute = plan.tests.find((item) => item.id === 'monitor-mute')
	assert.deepEqual(closure.feedbackIdentityOptions(air), { input: '0' })
	assert.deepEqual(closure.feedbackIdentityOptions(mute), {})

	const syntheticR9 = {
		probes: [
			{ definitionId: 'input_air', options: { input: '0' }, row: 10, column: 1 },
			{ definitionId: 'input_air', options: { input: '1' }, row: 10, column: 2 },
			{ definitionId: 'monitor_mute', options: {}, row: 11, column: 1 },
		],
	}
	assert.equal(closure.findFeedbackProbe(syntheticR9, air).column, 1)
	assert.equal(closure.findFeedbackProbe(syntheticR9, mute).row, 11)
})

test('targeted Core feedback closure requires explicit permission, passive feedback reads and hard restore quarantine', () => {
	assert.match(source, /--allow-hardware-writes/)
	assert.match(source, /--confirm-feedback-core-isolated/)
	assert.match(source, /SKIP_BASELINE_UNKNOWN/)
	assert.match(source, /Initial server state is missing\/invalid; no write attempted/)
	assert.match(source, /QUARANTINED_RESTORE/)
	assert.match(source, /hardAbort: true/)
	assert.match(source, /readFeedbackMarkerPassive/)
	assert.match(source, /b_text_/)
	assert.doesNotMatch(source, /device-subscribe/)
	assert.doesNotMatch(source, /client-details/)
	assert.doesNotMatch(source, /<set\b/i)
	assert.doesNotMatch(source, /setItem\s*\(/)
	assert.doesNotMatch(source, /advanced_raw_set|monitor_gain_set|monitor_gain_adjust/)
})

test('targeted Core launcher gates preflight and isolation before the hardware runner', () => {
	const preflight = launcher.indexOf('Focusrite_18i20_Preflight.ps1')
	const scopeConfirm = launcher.indexOf('FEEDBACK_CORE')
	const isolationConfirm = launcher.indexOf('ALL_ISOLATED')
	const runner = launcher.indexOf('FeedbackCoreClosure.js')

	assert.ok(preflight >= 0)
	assert.ok(scopeConfirm >= 0)
	assert.ok(isolationConfirm >= 0)
	assert.ok(runner > preflight)
	assert.ok(runner > scopeConfirm)
	assert.ok(runner > isolationConfirm)
	assert.match(launcher, /Companion Scarlett 18i20/)
	assert.match(launcher, /Aucun client TCP direct supplementaire n'est cree/)
	assert.match(launcher, /HARD ABORT/)
	assert.doesNotMatch(launcher, /Focusrite_18i20_FullTestBench\.js/)
})
