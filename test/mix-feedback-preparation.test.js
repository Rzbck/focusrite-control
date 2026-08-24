'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.join(__dirname, '..')
const { classifyPage2State } = require('../testbench/FullTestBenchRunnerV4Preflight')
const { PREP_REQUIRED_EXIT, PREP_AUTO_REPLACE_EXIT } = require('../testbench/MixFeedbackPreparationCheck')
const { auditCompatibleStaleBasePage } = require('../testbench/MixFeedbackClosureRunner')

function control(connectionId, definitionId = 'mix_mute') {
	return {
		type: 'button-layered',
		steps: {
			0: {
				action_sets: {
					down: [{ type: 'action', connectionId, definitionId, options: {} }],
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

test('Mix runner accepts only strict V8 structural compatibility when the snapshot signature alone drifted', () => {
	const built = {
		batches: [{ id: 'lane-a' }],
		locations: {
			'lane-a': {
				row: 0,
				column: 0,
				actions: [{ definitionId: 'mix_mute', options: { mix: 'Mix A', side: 'left', slot: 7, state: 'on' } }],
			},
		},
	}
	const page2State = {
		classification: 'STALE_FOCUSRITE_TESTBENCH_HARNESS',
		safeReplacementCandidate: true,
		controlCount: 1,
	}
	const exported = {
		pages: {
			2: {
				name: 'Focusrite 18i20 TB CAP LAB [TB-FULL-EXT:previous-snapshot]',
				controls: { 0: { 0: control('focusrite-instance', 'mix_mute') } },
			},
		},
		instances: {
			'focusrite-instance': {
				label: 'Companion Scarlett 18i20',
				moduleId: 'focusrite-scarlett-18i20',
				moduleVersionId: '0.1.16',
			},
		},
	}
	const connections = [
		{
			id: 'focusrite-instance',
			label: 'Companion Scarlett 18i20',
			moduleId: 'focusrite-scarlett-18i20',
			enabled: true,
		},
	]
	const r9 = { connection: connections[0] }

	const compatible = auditCompatibleStaleBasePage({ exported, built, connections, r9, page2State })
	assert.equal(compatible.pageNumber, 2)
	assert.equal(compatible.connection.id, 'focusrite-instance')

	const wrongAction = structuredClone(exported)
	wrongAction.pages[2].controls[0][0] = control('focusrite-instance', 'mix_solo')
	assert.equal(auditCompatibleStaleBasePage({ exported: wrongAction, built, connections, r9, page2State }), null)

	const extraControl = structuredClone(exported)
	extraControl.pages[2].controls[0][1] = control('focusrite-instance', 'mix_mute')
	assert.equal(auditCompatibleStaleBasePage({ exported: extraControl, built, connections, r9, page2State }), null)

	const wrongInstance = structuredClone(exported)
	wrongInstance.instances['focusrite-instance'].moduleId = 'other-module'
	assert.equal(auditCompatibleStaleBasePage({ exported: wrongInstance, built, connections, r9, page2State }), null)

	assert.equal(
		auditCompatibleStaleBasePage({
			exported,
			built,
			connections,
			r9,
			page2State: { ...page2State, classification: 'OTHER_OR_USER_PAGE', safeReplacementCandidate: false },
		}),
		null,
	)
})

test('Mix feedback preparation checker stays read-only and distinguishes reusable PAGE2_AUTO from unsafe prep', () => {
	assert.equal(PREP_REQUIRED_EXIT, 9)
	assert.equal(PREP_AUTO_REPLACE_EXIT, 10)
	const source = fs.readFileSync(path.join(root, 'testbench', 'MixFeedbackPreparationCheck.js'), 'utf8')

	assert.match(source, /PREP_REQUIRED/)
	assert.match(source, /PREP_AUTO_REPLACE_EXIT/)
	assert.match(source, /existing validated PAGE2_AUTO importer path/)
	assert.match(source, /Do NOT replace it automatically/)
	assert.match(source, /Hardware writes: 0/)
	assert.match(source, /Page 2 mutations: 0/)
	assert.doesNotMatch(source, /pressBatch|pressLocation|replacePage2FromFile|importSinglePage|\.setItem\s*\(/)
	assert.doesNotMatch(source, /--allow-mix-feedback-writes|--confirm-all-output-routing-isolated/)
})

test('Mix feedback launcher reuses existing PAGE2_AUTO before hardware confirmations and keeps prep distinct from restore failure', () => {
	const launcher = fs.readFileSync(path.join(root, 'testbench', 'RUN_MIX_FEEDBACK_CLOSURE.cmd'), 'utf8')
	const prepCheck = launcher.indexOf('MixFeedbackPreparationCheck.js')
	const page2Auto = launcher.indexOf('FullTestBenchCompanionImportV7.js')
	const scopeConfirm = launcher.indexOf('set /p "CONFIRM_SCOPE=')
	const isolationConfirm = launcher.indexOf('set /p "CONFIRM_ISOLATION=')
	const hardwareRun = launcher.indexOf(
		'MixFeedbackClosureRunner.js" --allow-mix-feedback-writes --confirm-all-output-routing-isolated',
	)

	assert.ok(prepCheck >= 0)
	assert.ok(page2Auto > prepCheck)
	assert.ok(scopeConfirm > page2Auto)
	assert.ok(isolationConfirm > page2Auto)
	assert.ok(hardwareRun > scopeConfirm)
	assert.ok(hardwareRun > isolationConfirm)
	assert.match(launcher, /if "!PREP_CODE!"=="10"/)
	assert.match(launcher, /PAGE 2 TESTBENCH OBSOLETE - CHEMIN PAGE2_AUTO EXISTANT/)
	assert.match(launcher, /Tape PAGE2_AUTO/)
	assert.match(launcher, /FullTestBenchCompanionImportV7\.js" --replace-page-2/)
	assert.match(launcher, /PAGE2_AUTO PASS - nouveau preflight read-only obligatoire/)
	assert.match(launcher, /Verification finale du harness V8 apres PAGE2_AUTO/)
	assert.match(launcher, /if "!PREP_CODE!"=="9"/)
	assert.match(launcher, /MixFeedbackClosureRunner\.js/)
	assert.match(launcher, /else if "!EXITCODE!"=="9"/)
	assert.match(launcher, /else if "!EXITCODE!"=="4"/)
})
