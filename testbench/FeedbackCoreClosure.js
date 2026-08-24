'use strict'

const fs = require('node:fs')
const path = require('node:path')
const {
	EXPECTED_MODULE_VERSION,
	safePlanPath,
	resultsDir,
	line,
	canonicalBool,
	findCompanion,
	get,
	readVariableOptional,
	exportButtons,
	sleep,
} = require('./FullTestBenchBase')
const { auditR9, pressLocation, safePlanSetter } = require('./FullTestBenchAudit')

const TARGET_IDS = Object.freeze([
	'air-1',
	'air-2',
	'air-3',
	'air-4',
	'air-5',
	'air-6',
	'air-7',
	'air-8',
	'pad-1',
	'pad-2',
	'pad-3',
	'pad-4',
	'pad-5',
	'pad-6',
	'pad-7',
	'pad-8',
	'monitor-mute',
	'monitor-dim',
])

const RESULT_PATH = path.join(resultsDir, 'LATEST_FEEDBACK_CORE_CLOSURE.json')

function canonicalTestValue(test, raw) {
	if (test.kind === 'boolean') return canonicalBool(raw)
	const value = String(raw ?? '').trim()
	return value || null
}

function feedbackIdentityOptions(test) {
	const sample = test.setters?.[0]?.options || {}
	return Object.fromEntries(Object.entries(sample).filter(([key]) => key !== 'state'))
}

function sameLiteralOptions(actual, expected) {
	const actualKeys = Object.keys(actual || {}).sort()
	const expectedKeys = Object.keys(expected || {}).sort()
	if (actualKeys.length !== expectedKeys.length) return false
	return expectedKeys.every((key, index) => key === actualKeys[index] && String(actual[key]) === String(expected[key]))
}

function findFeedbackProbe(r9, test) {
	const definitionId = test.setters?.[0]?.definitionId
	const expectedOptions = feedbackIdentityOptions(test)
	const candidates = r9.probes.filter(
		(probe) => probe.definitionId === definitionId && sameLiteralOptions(probe.options || {}, expectedOptions),
	)
	if (candidates.length !== 1) {
		throw new Error(`Expected exactly one feedback probe for ${test.id}; found ${candidates.length} (${definitionId}).`)
	}
	return candidates[0]
}

async function readFeedbackMarkerPassive(baseUrl, pageNumber, probe) {
	const variable = `b_text_${pageNumber}_${probe.row}_${probe.column}`
	const item = await readVariableOptional(baseUrl, 'internal', variable, 1800)
	if (!item.exists) return null
	const lines = String(item.value).split(/\r?\n/)
	const marker = String(lines.at(-1) || '').trim()
	return ['T', 'F'].includes(marker) ? marker : null
}

function wantedMarker(test, expectedValue) {
	if (test.kind !== 'boolean') throw new Error(`Unsupported targeted feedback kind for ${test.id}: ${test.kind}`)
	return expectedValue === 'true' ? 'T' : 'F'
}

async function waitVariableValue(baseUrl, label, test, expected, timeoutMs = 5000) {
	const deadline = Date.now() + timeoutMs
	let observed = null
	while (Date.now() < deadline) {
		const item = await readVariableOptional(baseUrl, label, test.variable, 1500)
		observed = item.exists ? canonicalTestValue(test, item.value) : null
		if (observed === expected) return { ok: true, observed }
		await sleep(100)
	}
	return { ok: false, observed }
}

async function waitFeedbackValue(baseUrl, pageNumber, probe, test, expected, timeoutMs = 3000) {
	const wanted = wantedMarker(test, expected)
	const deadline = Date.now() + timeoutMs
	let observed = null
	while (Date.now() < deadline) {
		observed = await readFeedbackMarkerPassive(baseUrl, pageNumber, probe)
		if (observed === wanted) return { ok: true, observed, wanted }
		await sleep(100)
	}
	return { ok: false, observed, wanted }
}

function makeResult(test, status, detail, extra = {}) {
	return {
		id: test.id,
		definitionId: test.setters?.[0]?.definitionId || '',
		status,
		detail,
		...extra,
	}
}

async function preflightTargets({ baseUrl, label, r9, tests }) {
	const runnable = []
	const results = []
	for (const test of tests) {
		const probe = findFeedbackProbe(r9, test)
		const item = await readVariableOptional(baseUrl, label, test.variable, 2500)
		const initial = item.exists ? canonicalTestValue(test, item.value) : null
		if (!initial || !test.allowedInitial.includes(initial)) {
			results.push(
				makeResult(test, 'SKIP_BASELINE_UNKNOWN', 'Initial server state is missing/invalid; no write attempted.'),
			)
			continue
		}
		const feedback = await waitFeedbackValue(baseUrl, r9.pageNumber, probe, test, initial, 2200)
		if (!feedback.ok) {
			results.push(
				makeResult(
					test,
					'FAIL_INITIAL_FEEDBACK',
					`Initial rendered feedback did not match server baseline; wanted=${feedback.wanted} observed=${feedback.observed || 'missing'}. No write attempted.`,
				),
			)
			continue
		}
		const alternate = initial === 'true' ? 'false' : 'true'
		runnable.push({ test, probe, initial, alternate })
	}
	return { runnable, results }
}

async function runTarget({ baseUrl, label, pageNumber, item }) {
	const { test, probe, initial, alternate } = item
	const changeSetter = safePlanSetter(null, test, alternate)
	const restoreSetter = safePlanSetter(null, test, initial)
	let transitionError = ''

	const current = await readVariableOptional(baseUrl, label, test.variable, 2200)
	if (!current.exists || canonicalTestValue(test, current.value) !== initial) {
		return {
			result: makeResult(test, 'FAIL_PREFLIGHT_DRIFT', 'Server baseline changed after preflight; no write attempted.'),
			hardAbort: false,
		}
	}
	const prewriteFeedback = await waitFeedbackValue(baseUrl, pageNumber, probe, test, initial, 1800)
	if (!prewriteFeedback.ok) {
		return {
			result: makeResult(
				test,
				'FAIL_PREWRITE_FEEDBACK',
				`Rendered feedback changed/mismatched before write; wanted=${prewriteFeedback.wanted}, observed=${prewriteFeedback.observed || 'missing'}. No write attempted.`,
			),
			hardAbort: false,
		}
	}

	try {
		await pressLocation(baseUrl, pageNumber, changeSetter)
		const alternateVariable = await waitVariableValue(baseUrl, label, test, alternate)
		if (!alternateVariable.ok) {
			transitionError = `Server transition not confirmed; expected=${alternate}, observed=${alternateVariable.observed || 'missing'}.`
		} else {
			const alternateFeedback = await waitFeedbackValue(baseUrl, pageNumber, probe, test, alternate)
			if (!alternateFeedback.ok) {
				transitionError = `Rendered feedback mismatch at alternate state; wanted=${alternateFeedback.wanted}, observed=${alternateFeedback.observed || 'missing'}.`
			}
		}
	} catch (error) {
		transitionError = `Transition threw: ${error.message}`
	}

	let restoreVariableError = ''
	let restoreFeedbackError = ''
	try {
		await pressLocation(baseUrl, pageNumber, restoreSetter)
		const restoreVariable = await waitVariableValue(baseUrl, label, test, initial)
		if (!restoreVariable.ok) {
			restoreVariableError = `Exact restore not server-confirmed; expected=${initial}, observed=${restoreVariable.observed || 'missing'}.`
		} else {
			const restoreFeedback = await waitFeedbackValue(baseUrl, pageNumber, probe, test, initial)
			if (!restoreFeedback.ok) {
				restoreFeedbackError = `Hardware baseline restored but rendered feedback mismatch remains; wanted=${restoreFeedback.wanted}, observed=${restoreFeedback.observed || 'missing'}.`
			}
		}
	} catch (error) {
		restoreVariableError = `Restore threw: ${error.message}`
	}

	if (restoreVariableError) {
		return {
			result: makeResult(test, 'QUARANTINED_RESTORE', restoreVariableError, { transitionError }),
			hardAbort: true,
		}
	}
	if (restoreFeedbackError) {
		return {
			result: makeResult(
				test,
				'FAIL_RESTORED_FEEDBACK',
				`${restoreFeedbackError}${transitionError ? ` Earlier transition issue: ${transitionError}` : ''}`,
			),
			hardAbort: false,
		}
	}
	if (transitionError) {
		return {
			result: makeResult(
				test,
				'FAIL_TRANSITION_FEEDBACK',
				`${transitionError} Exact hardware baseline restoration confirmed.`,
			),
			hardAbort: false,
		}
	}

	return {
		result: makeResult(
			test,
			'HARDWARE_DYNAMIC_CLOSED',
			`Server variable + rendered feedback confirmed at ${initial} -> ${alternate} -> ${initial}; exact restore confirmed.`,
		),
		hardAbort: false,
	}
}

async function main() {
	if (!process.argv.includes('--allow-hardware-writes')) {
		throw new Error('REFUSED: missing explicit --allow-hardware-writes permission.')
	}
	if (!process.argv.includes('--confirm-feedback-core-isolated')) {
		throw new Error('REFUSED: missing explicit --confirm-feedback-core-isolated acknowledgement.')
	}

	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const tests = TARGET_IDS.map((id) => safePlan.tests.find((test) => test.id === id))
	if (tests.some((test) => !test))
		throw new Error('Targeted Core feedback plan does not match the checked-in SAFE plan.')
	if (tests.some((test) => test.kind !== 'boolean'))
		throw new Error('Targeted Core closure contains a non-boolean target.')

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 - TARGETED CORE FEEDBACK CLOSURE')
	console.log('==================================================================')
	console.log('Scope: Air 1-8 + Pad 1-8 + Monitor Mute + Monitor Dim.')
	console.log('Existing r9 feedbacks and existing audited SAFE setters only.')
	console.log('Unknown baseline = SKIP / NO WRITE. Restore failure = HARD ABORT.')
	console.log('No FULL, no direct Control Server client, no raw write, no package install.')
	console.log('')

	const baseUrl = await findCompanion()
	const connectionsPayload = JSON.parse(await get(baseUrl, '/api/connections'))
	const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	const label = String(r9.connection.label)
	line('PASS', 'r9 audit', '829 feedback probes / 31 definitions + 42 SAFE setters verified')
	line('PASS', 'Module version', EXPECTED_MODULE_VERSION)

	const model = await readVariableOptional(baseUrl, label, 'device_model', 2500)
	const authorised = await readVariableOptional(baseUrl, label, 'client_authorised', 2500)
	const connectionStatus = await readVariableOptional(baseUrl, label, 'connection_status', 2500)
	if (
		!model.exists ||
		String(model.value) !== String(safePlan.target.model) ||
		!authorised.exists ||
		canonicalBool(authorised.value) !== 'true' ||
		!connectionStatus.exists ||
		!/authorised/i.test(String(connectionStatus.value))
	) {
		throw new Error('Exact model / existing Companion authorization preflight failed.')
	}
	line('PASS', 'Preflight', 'Exact model + existing authorised Companion client confirmed')

	const prepared = await preflightTargets({ baseUrl, label, r9, tests })
	for (const result of prepared.results)
		line(result.status.startsWith('FAIL') ? 'FAIL' : 'SKIP', result.id, result.detail)
	line('INFO', 'Runnable exact-baseline targets', String(prepared.runnable.length))
	line('INFO', 'No-write skipped/failed preflight targets', String(prepared.results.length))

	const results = [...prepared.results]
	let hardAbort = false
	for (const item of prepared.runnable) {
		const outcome = await runTarget({ baseUrl, label, pageNumber: r9.pageNumber, item })
		results.push(outcome.result)
		line(
			outcome.result.status === 'HARDWARE_DYNAMIC_CLOSED' ? 'PASS' : 'FAIL',
			outcome.result.id,
			outcome.result.detail,
		)
		if (outcome.hardAbort) {
			hardAbort = true
			break
		}
		await sleep(120)
	}

	const summary = {
		schemaVersion: 1,
		reportClass: 'local-sanitized-feedback-core-closure',
		generatedAt: new Date().toISOString(),
		model: safePlan.target.model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		targetCount: TARGET_IDS.length,
		dynamicClosed: results.filter((result) => result.status === 'HARDWARE_DYNAMIC_CLOSED').length,
		skippedBaselineUnknown: results.filter((result) => result.status === 'SKIP_BASELINE_UNKNOWN').length,
		fail: results.filter((result) => result.status.startsWith('FAIL')).length,
		quarantinedRestore: results.filter((result) => result.status === 'QUARANTINED_RESTORE').length,
		hardAbort,
		results,
	}
	fs.mkdirSync(path.dirname(RESULT_PATH), { recursive: true })
	fs.writeFileSync(RESULT_PATH, `${JSON.stringify(summary, null, '\t')}\n`, 'utf8')

	console.log('')
	console.log('==================================================================')
	console.log(
		`SUMMARY: DYNAMIC_CLOSED ${summary.dynamicClosed} / SKIP_BASELINE_UNKNOWN ${summary.skippedBaselineUnknown} / FAIL ${summary.fail} / RESTORE_QUARANTINE ${summary.quarantinedRestore}`,
	)
	console.log('==================================================================')
	if (hardAbort) process.exitCode = 4
	else if (summary.fail > 0) process.exitCode = 2
	else if (summary.dynamicClosed === 0) process.exitCode = 3
	else process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`FAIL  ${error.message}`)
		process.exitCode = 1
	})
}

module.exports = {
	TARGET_IDS,
	canonicalTestValue,
	feedbackIdentityOptions,
	sameLiteralOptions,
	findFeedbackProbe,
	readFeedbackMarkerPassive,
	wantedMarker,
	waitVariableValue,
	waitFeedbackValue,
	preflightTargets,
	runTarget,
}
