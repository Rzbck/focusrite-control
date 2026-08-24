'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const { classifyPage2State } = require('../testbench/FullTestBenchRunnerV4Preflight')
const { PREP_REQUIRED_EXIT } = require('../testbench/MixFeedbackPreparationCheck')

function control(connectionId) {
	return {
		type: 'button-layered',
		steps: {
			0: {
				action_sets: {
					down: [{ type: 'action', connectionId, definitionId: 'mix_mute', options: {} }],
				},
			},
		},
		options: { notes: 'TB-FULL-EXT:stale-signature:test' },
	}
}

test('Page 2 classification distinguishes current, stale TestBench and user pages without mutation', () => {
	const built = { pageName: 'Focusrite 18i20 TB CAP LAB [TB-FULL-EXT:current-signature]' }
	const instance = {
		moduleId: 'focusrite-scarlett-18i20',
		moduleVersionId: '0.1.16',
	}

	assert.deepEqual(classifyPage2State({ pages: {} }, built), {
		exists: false,
		classification: 'MISSING',
		controlCount: 0,
		safeReplacementCandidate: false,
	})

	const current = classifyPage2State(
		{ pages: { 2: { name: built.pageName, controls: {} } }, instances: {} },
		built,
	)
	assert.equal(current.classification, 'CURRENT_EXACT_NAME')
	assert.equal(current.safeReplacementCandidate, false)

	const stale = classifyPage2State(
		{
			pages: {
				2: {
					name: 'Focusrite 18i20 TB CAP LAB [TB-FULL-EXT:older-signature]',
					controls: { 0: { 0: control('focusrite-instance') } },
				},
			},
			instances: { 'focusrite-instance': instance },
		},
		built,
	)
	assert.equal(stale.classification, 'STALE_FOCUSRITE_TESTBENCH_HARNESS')
	assert.equal(stale.safeReplacementCandidate, true)
	assert.equal(stale.controlCount, 1)

	const userPage = classifyPage2State(
		{ pages: { 2: { name: 'My normal Companion page', controls: {} } }, instances: {} },
		built,
	)
	assert.equal(userPage.classification, 'OTHER_OR_USER_PAGE')
	assert.equal(userPage.safeReplacementCandidate, false)
})

test('Page 2 TestBench marker is not trusted when its Focusrite identity is unverified', () => {
	const built = { pageName: 'Focusrite 18i20 TB CAP LAB [TB-FULL-EXT:current-signature]' }
	const result = classifyPage2State(
		{
			pages: {
				2: {
					name: 'Focusrite 18i20 TB CAP LAB [TB-FULL-EXT:older-signature]',
					controls: { 0: { 0: control('other-instance') } },
				},
			},
			instances: { 'other-instance': { moduleId: 'other-module', moduleVersionId: '1.0.0' } },
		},
		built,
	)
	assert.equal(result.classification, 'UNVERIFIED_TESTBENCH_MARKER')
	assert.equal(result.safeReplacementCandidate, false)
})

test('Mix feedback preparation checker is strictly read-only and uses a distinct PREP_REQUIRED exit', () => {
	assert.equal(PREP_REQUIRED_EXIT, 9)
	const source = fs.readFileSync(path.join(root, 'testbench', 'MixFeedbackPreparationCheck.js'), 'utf8')

	assert.match(source, /PREP_REQUIRED/)
	assert.match(source, /Hardware writes: 0/)
	assert.match(source, /Page 2 mutations: 0/)
	assert.match(source, /Do NOT replace it automatically/)
	assert.doesNotMatch(source, /pressBatch|pressLocation|replacePage2FromFile|importSinglePage|\.setItem\s*\(/)
	assert.doesNotMatch(source, /--allow-mix-feedback-writes|--confirm-all-output-routing-isolated/)
})

test('Mix feedback launcher checks Page 2 before hardware confirmations and maps PREP_REQUIRED separately from restore failure', () => {
	const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_MIX_FEEDBACK_CLOSURE.cmd'), 'utf8')
	const prepCheck = launcher.indexOf('MixFeedbackPreparationCheck.js')
	const scopeConfirm = launcher.indexOf('set /p "CONFIRM_SCOPE=')
	const isolationConfirm = launcher.indexOf('set /p "CONFIRM_ISOLATION=')
	const hardwareRun = launcher.indexOf(
		'MixFeedbackClosureRunner.js" --allow-mix-feedback-writes --confirm-all-output-routing-isolated',
	)

	assert.ok(prepCheck >= 0)
	assert.ok(scopeConfirm > prepCheck)
	assert.ok(isolationConfirm > prepCheck)
	assert.ok(hardwareRun > scopeConfirm)
	assert.ok(hardwareRun > isolationConfirm)
	assert.match(launcher, /if "!PREP_CODE!"=="9"/)
	assert.match(launcher, /PREP_REQUIRED - la campagne hardware NE DEMARRE PAS/)
	assert.match(launcher, /Hardware writes: 0/)
	assert.match(launcher, /Companion Page 2 mutations: 0/)
	assert.match(launcher, /MixFeedbackClosureRunner\.js/)
	assert.match(launcher, /else if "!EXITCODE!"=="9"/)
	assert.match(launcher, /else if "!EXITCODE!"=="4"/)
})
