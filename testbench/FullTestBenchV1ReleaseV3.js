'use strict'

const fs = require('node:fs')
const path = require('node:path')
const packageJson = require('../package.json')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE,
	safePlanPath,
	resultsDir,
	OUTPUT_PAIR_LEFT_INDICES,
	TALKBACK_SOURCE_CANDIDATES,
	line,
	sleep,
	stableStringify,
	findCompanion,
	get,
	post,
	readVariableOptional,
	readVariable,
	waitVariable,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')
const { normalizeConnections } = require('./FullTestBenchCompanionImportV7')
const {
	V1_RELEASE_ALLOWED,
	V1_RELEASE_WITHHELD,
	buildReleaseTests,
	buildReleasePage,
	directSourceCandidates,
	stereoSourcePairs,
	outputAvailabilityAllows,
	expectedMatches,
	baselineValueEqual,
} = require('./FullTestBenchV1Release')
const {
	captureReleaseState,
	ensureReleasePage,
	collectReleaseActionIds,
	requireFreshSafeResultBaselineAware,
} = require('./FullTestBenchV1ReleaseV2')
const { UNVALIDATED_CONFIGURATION_OUTPUTS } = require('../src/hardware-policy')

const EXPECTED_MODULE_VERSION = packageJson.version
const RELEASE_REVISION = 'v1-release-smoke-v3-20260826'
const outputPath = path.join(resultsDir, 'latest-v1-release-smoke.json')

const EXPECTED_RELEASE_ACTIONS = [
	'monitor_preset',
	'input_mode',
	'input_mode_cycle',
	'input_nickname',
	'output_mute',
	'output_gain_set',
	'output_gain_adjust',
	'output_source',
	'output_pair_source',
	'output_nickname',
	'device_nickname',
	'phantom_persistence',
	'talkback_source',
	'reconnect',
]

function itemText(item) {
	if (!item?.exists) return null
	return String(item.value ?? '')
}

async function captureSourceCatalog(baseUrl, label) {
	const routingSources = []
	const sourceNames = new Set()
	let misses = 0
	for (let n = 1; n <= 128 && misses < 8; n++) {
		const [id, name, type] = await Promise.all([
			readVariableOptional(baseUrl, label, `source_${n}_root_id`, 1800),
			readVariableOptional(baseUrl, label, `source_${n}_name`, 1800),
			readVariableOptional(baseUrl, label, `source_${n}_type`, 1800),
		])
		if (!name.exists || !String(name.value || '').trim()) {
			misses++
			continue
		}
		misses = 0
		const sourceName = String(name.value || '').trim()
		sourceNames.add(sourceName)
		const rawId = id.exists ? String(id.value || '').trim() : ''
		if (rawId && rawId !== '0') {
			routingSources.push({ id: rawId, name: sourceName, type: String(type.value || '').trim() })
		}
	}
	return { routingSources, sourceNames: [...sourceNames] }
}

function stateSignature(values) {
	const compact = {}
	for (const [name, item] of Object.entries(values)) {
		compact[name] = item?.exists ? { exists: true, value: String(item.value ?? '') } : { exists: false }
	}
	return stableStringify(compact)
}

async function captureStableReleaseState(baseUrl, label, timeoutMs = 10000) {
	const deadline = Date.now() + timeoutMs
	let previousSignature = null
	let previousValues = null
	let stableSamples = 0
	let samples = 0
	while (Date.now() < deadline) {
		const values = await captureReleaseState(baseUrl, label)
		const signature = stateSignature(values)
		samples++
		if (signature === previousSignature) {
			stableSamples++
			if (stableSamples >= 1) return { values, samples, stable: true }
		} else {
			stableSamples = 0
		}
		previousSignature = signature
		previousValues = values
		await sleep(350)
	}
	return { values: previousValues || {}, samples, stable: false }
}

function addDirectPairRestoreTests(tests, values, routingSources) {
	const existingIds = new Set(tests.map((test) => test.id))
	const sourcePairs = stereoSourcePairs(routingSources)
	for (const leftIndex of OUTPUT_PAIR_LEFT_INDICES) {
		const rightIndex = leftIndex + 1
		const leftNumber = leftIndex + 1
		const rightNumber = rightIndex + 1
		if (rightNumber > 26) continue
		if (UNVALIDATED_CONFIGURATION_OUTPUTS.has(leftIndex) || UNVALIDATED_CONFIGURATION_OUTPUTS.has(rightIndex)) continue
		if (!outputAvailabilityAllows(values[`output_${leftNumber}_available`])) continue
		if (!outputAvailabilityAllows(values[`output_${rightNumber}_available`])) continue
		const leftCurrent = itemText(values[`output_${leftNumber}_source`])
		const rightCurrent = itemText(values[`output_${rightNumber}_source`])
		if (!leftCurrent || !rightCurrent) continue
		const baselinePair = sourcePairs.find(
			(pair) => String(pair.left.id) === String(leftCurrent) && String(pair.right.id) === String(rightCurrent),
		)
		if (!baselinePair) continue
		const id = `output-pair-${leftNumber}-${rightNumber}-source`
		if (existingIds.has(id)) continue
		const alternate = sourcePairs.find(
			(pair) => String(pair.left.id) !== String(leftCurrent) || String(pair.right.id) !== String(rightCurrent),
		)
		if (!alternate) continue
		tests.push({
			id,
			label: `Output pair ${leftNumber}-${rightNumber} source`,
			variables: [`output_${leftNumber}_source`, `output_${rightNumber}_source`],
			kind: 'opaque-source-pair',
			expectedChange: [alternate.left.id, alternate.right.id],
			expectedRestore: [leftCurrent, rightCurrent],
			change: { definitionId: 'output_pair_source', options: { output: String(leftIndex), source: alternate.left.id } },
			restore: { definitionId: 'output_pair_source', options: { output: String(leftIndex), source: baselinePair.left.id } },
		})
		existingIds.add(id)
	}
	return tests
}

function addTalkbackSourceTest(tests, values, sourceNames) {
	if (tests.some((test) => test.id === 'talkback-source')) return tests
	const current = itemText(values.device_talkbackInputSource)
	if (!current || !TALKBACK_SOURCE_CANDIDATES.includes(current)) return tests
	const availableNames = new Set(sourceNames)
	const alternate = TALKBACK_SOURCE_CANDIDATES.find((candidate) => candidate !== current && availableNames.has(candidate))
	if (!alternate) return tests
	tests.push({
		id: 'talkback-source',
		label: 'Talkback source',
		variable: 'device_talkbackInputSource',
		kind: 'text',
		expectedChange: alternate,
		expectedRestore: current,
		change: { definitionId: 'talkback_source', options: { source: alternate } },
		restore: { definitionId: 'talkback_source', options: { source: current } },
	})
	return tests
}

function orderReleaseTests(tests) {
	const priority = (test) => {
		if (test.change.definitionId === 'monitor_preset') return 100
		if (test.change.definitionId === 'talkback_source') return 80
		if (test.change.definitionId === 'phantom_persistence') return 75
		if (test.change.definitionId === 'device_nickname') return 70
		return 10
	}
	return [...tests].sort((a, b) => priority(a) - priority(b))
}

function buildReleaseTestsV3(values, catalog) {
	let tests = buildReleaseTests(values, catalog.routingSources)
	tests = addDirectPairRestoreTests(tests, values, catalog.routingSources)
	tests = addTalkbackSourceTest(tests, values, catalog.sourceNames)
	return orderReleaseTests(tests)
}

function missingReleaseActionIds(tests) {
	const present = collectReleaseActionIds(tests)
	return EXPECTED_RELEASE_ACTIONS.filter((id) => !present.has(id))
}

async function pressLocation(baseUrl, pageNumber, location) {
	await post(baseUrl, `/api/location/${pageNumber}/${location.row}/${location.column}/press`, 10000)
}

async function waitExpected(baseUrl, label, variable, kind, expected, timeoutMs = 5000) {
	return waitVariable(baseUrl, label, variable, (value) => expectedMatches(kind, value, expected), timeoutMs)
}

async function waitPair(baseUrl, label, variables, expected, timeoutMs = 6000) {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		const current = await Promise.all(variables.map((variable) => readVariableOptional(baseUrl, label, variable, 1800)))
		if (
			current.every((item) => item.exists) &&
			current.every((item, index) => String(item.value) === String(expected[index]))
		) {
			return true
		}
		await sleep(100)
	}
	return false
}

function publicResult(test, status, detail, classification = null) {
	return { id: test.id, label: test.label, action: test.change.definitionId, status, classification, detail }
}

async function executeTestV3(baseUrl, label, pageNumber, test, locations) {
	const currentBefore = test.variables
		? await Promise.all(test.variables.map((variable) => readVariableOptional(baseUrl, label, variable, 2000)))
		: [await readVariableOptional(baseUrl, label, test.variable, 2000)]
	if (currentBefore.some((item) => !item.exists)) {
		return {
			hardAbort: true,
			writeAttempted: false,
			abortClass: 'PREWRITE_BASELINE_LOST',
			result: publicResult(test, 'FAIL', 'Required server-confirmed baseline disappeared before write.', 'PREWRITE_BASELINE_LOST'),
		}
	}
	const wantedBaseline = Array.isArray(test.expectedRestore) ? test.expectedRestore : [test.expectedRestore]
	const baselineKind = test.kind === 'opaque-source-pair' ? 'text' : test.kind
	const baselineOk = currentBefore.every((item, index) => expectedMatches(baselineKind, item.value, wantedBaseline[index]))
	if (!baselineOk) {
		return {
			hardAbort: true,
			writeAttempted: false,
			abortClass: 'PREWRITE_DRIFT',
			result: publicResult(test, 'FAIL', 'Baseline drift detected before write; no action pressed.', 'PREWRITE_DRIFT'),
		}
	}

	let writeAttempted = false
	let changeConfirmed = false
	let changeDetail = ''
	try {
		if (test.precondition) {
			writeAttempted = true
			await pressLocation(baseUrl, pageNumber, locations.precondition)
			const pre = await waitExpected(baseUrl, label, test.variable, test.kind, test.precondition.expected, 5000)
			if (!pre.ok) throw new Error('Precondition was not server-confirmed.')
		}
		writeAttempted = true
		await pressLocation(baseUrl, pageNumber, locations.change)
		if (test.variables) {
			changeConfirmed = await waitPair(baseUrl, label, test.variables, test.expectedChange)
		} else {
			changeConfirmed = (await waitExpected(baseUrl, label, test.variable, test.kind, test.expectedChange, 6000)).ok
		}
		if (!changeConfirmed) changeDetail = 'No server-confirmed transition.'
	} catch (error) {
		changeDetail = error.message
	}

	if (writeAttempted) {
		try {
			for (const restoreLocation of locations.restore || []) await pressLocation(baseUrl, pageNumber, restoreLocation)
			const restored = test.variables
				? await waitPair(baseUrl, label, test.variables, test.expectedRestore, 7000)
				: (await waitExpected(baseUrl, label, test.variable, test.kind, test.expectedRestore, 7000)).ok
			if (!restored) {
				return {
					hardAbort: true,
					writeAttempted: true,
					abortClass: 'RESTORE_FAILURE',
					result: publicResult(
						test,
						'FAIL',
						'HARD ABORT: exact original target state was not server-confirmed after restore.',
						'RESTORE_FAILURE',
					),
				}
			}
		} catch (error) {
			return {
				hardAbort: true,
				writeAttempted: true,
				abortClass: 'RESTORE_FAILURE',
				result: publicResult(test, 'FAIL', `HARD ABORT: restore failed (${error.message}).`, 'RESTORE_FAILURE'),
			}
		}
	}

	return {
		hardAbort: false,
		writeAttempted,
		abortClass: null,
		result: changeConfirmed
			? publicResult(test, 'PASS', 'Server-confirmed change and exact target restore.', 'WRITE_CONFIRMED')
			: publicResult(test, 'FAIL', `Change unconfirmed; exact target state restored. ${changeDetail}`, 'NO_TRANSITION'),
	}
}

async function verifyKnownBaseline(baseUrl, label, baseline) {
	const drift = []
	for (const [name, expected] of Object.entries(baseline)) {
		if (!expected?.exists) continue
		const current = await readVariableOptional(baseUrl, label, name, 2500)
		if (!current.exists || !baselineValueEqual(name, current.value, expected.value)) drift.push(name)
	}
	return drift
}

async function runReconnect(baseUrl, label, pageNumber, location) {
	await pressLocation(baseUrl, pageNumber, location)
	const result = await waitVariable(
		baseUrl,
		label,
		'connection_status',
		(value) => /connected.*authorised/i.test(String(value)) || /authorised/i.test(String(value)),
		20000,
	)
	return result.ok
}

function makeSummary({ tests, results, hardAbort, hardAbortClass, reconnectStatus, safe, missingActions, stableSamples }) {
	const passedActionIds = new Set(results.filter((result) => result.status === 'PASS').map((result) => result.action))
	if (reconnectStatus === 'PASS') passedActionIds.add('reconnect')
	const coveragePartial = Number(safe.skip || 0) > 0 || missingActions.length > 0
	return {
		generatedUtc: new Date().toISOString(),
		revision: RELEASE_REVISION,
		moduleVersion: EXPECTED_MODULE_VERSION,
		targetModel: EXPECTED_MODEL,
		coverage: coveragePartial ? 'PARTIAL_SAFE' : 'FULL_LIVE',
		stableBaselineSamples: stableSamples,
		safeCore: {
			pass: Number(safe.pass || 0),
			fail: Number(safe.fail || 0),
			skip: Number(safe.skip || 0),
		},
		testCount: tests.length,
		pass: results.filter((result) => result.status === 'PASS').length,
		fail: results.filter((result) => result.status === 'FAIL').length,
		hardAbort,
		hardAbortClass: hardAbortClass || null,
		reconnect: reconnectStatus,
		passedActionIds: [...passedActionIds].sort(),
		notRunnableActionIds: [...missingActions].sort(),
		results,
	}
}

async function main() {
	const prepareOnly = process.argv.includes('--prepare-only')
	if (!prepareOnly) {
		if (!process.argv.includes('--allow-hardware-writes')) throw new Error('REFUSED: missing --allow-hardware-writes.')
		if (!process.argv.includes('--confirm-all-output-routing-isolated')) {
			throw new Error('REFUSED: missing --confirm-all-output-routing-isolated.')
		}
	}
	if (EXPECTED_MODULE_VERSION !== '0.1.20') {
		throw new Error(`REFUSED: V1 release smoke is pinned to audited module 0.1.20, current package is ${EXPECTED_MODULE_VERSION}.`)
	}

	const safe = prepareOnly ? null : requireFreshSafeResultBaselineAware()

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 V1 RELEASE SMOKE V3 - CONFIGURATION-AUTONOMOUS')
	console.log('==================================================================')
	console.log(prepareOnly ? 'PREPARE-ONLY: Page 2 audit/import; ZERO Focusrite hardware writes.' : 'The live Focusrite configuration is read and stabilised before the release plan is built.')
	console.log('No fixed routing/preset baseline is assumed; unknown state remains SKIP/NOT-RUNNABLE.')
	console.log('Every attempted write requires exact target restore plus a collateral-state audit.')
	console.log('No ALT/Stereo/Custom Mix/disruptive/raw/Monitor-gain write exists in this runner.')
	console.log('')

	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const connections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	const label = String(r9.connection.label)
	line('PASS', 'Page 1 r9 / module audit', 'Page 1 preserved; 0.1.20 loaded; 829 feedback probes present')

	const model = await readVariable(baseUrl, label, 'device_model')
	const authorised = String(await readVariable(baseUrl, label, 'client_authorised')).trim().toLowerCase()
	const status = await readVariable(baseUrl, label, 'connection_status')
	if (model !== EXPECTED_MODEL || !['true', '1'].includes(authorised) || !/authorised/i.test(status)) {
		throw new Error('Exact model / Remote Devices authorisation preflight failed.')
	}
	line('PASS', 'Preflight', 'Scarlett 18i20 (3rd Gen) + authorised module client')

	const stable = await captureStableReleaseState(baseUrl, label)
	if (!stable.stable) throw new Error('REFUSED BEFORE WRITE: live release state did not stabilise; no hardware write attempted.')
	line('PASS', 'Live state stabilisation', `${stable.samples} snapshot(s); current configuration accepted as baseline`)
	const catalog = await captureSourceCatalog(baseUrl, label)
	const tests = buildReleaseTestsV3(stable.values, catalog)
	const missingActions = missingReleaseActionIds(tests)
	const built = buildReleasePage(tests)
	const releasePage = await ensureReleasePage(baseUrl, built, r9, connections, exported)
	line('PASS', 'Page 2 release harness', `${built.signature}; ${tests.length} exact-restore test(s); existing connection reused`)
	if (missingActions.length) {
		line('INFO', 'Current baseline coverage', `${missingActions.length} action ID(s) not runnable now: ${missingActions.join(', ')}`)
	} else {
		line('PASS', 'Current baseline coverage', 'All retained release action IDs have a live exact-restorable path.')
	}
	if (prepareOnly) {
		line('PASS', 'Prepare-only', 'Page 2 is current; Page 1/other pages/connections preserved; ZERO hardware writes.')
		return
	}

	line('INFO', 'SAFE Core result', `PASS=${safe.pass} FAIL=${safe.fail} SKIP=${safe.skip}; SKIP means baseline unknown, not unsupported`)

	const phaseBaseline = stable.values
	const results = []
	let hardAbort = false
	let hardAbortClass = null
	for (const test of tests) {
		const preTestBaseline = await captureReleaseState(baseUrl, label)
		const execution = await executeTestV3(baseUrl, label, releasePage.pageNumber, test, built.locations[test.id])
		let result = execution.result
		if (execution.writeAttempted) {
			await sleep(450)
			const collateralDrift = await verifyKnownBaseline(baseUrl, label, preTestBaseline)
			if (collateralDrift.length) {
				hardAbort = true
				hardAbortClass = 'COLLATERAL_DRIFT'
				result = publicResult(
					test,
					'FAIL',
					`HARD ABORT: ${collateralDrift.length} known collateral state variable(s) did not return to the immediate pre-test baseline: ${collateralDrift.slice(0, 8).join(', ')}`,
					'COLLATERAL_DRIFT',
				)
			}
		}
		results.push(result)
		line(result.status, test.label, result.detail)
		if (hardAbort || execution.hardAbort) {
			hardAbort = true
			hardAbortClass ||= execution.abortClass || 'SAFETY_ABORT'
			break
		}
		await sleep(150)
	}

	if (!hardAbort) {
		const drift = await verifyKnownBaseline(baseUrl, label, phaseBaseline)
		if (drift.length) {
			hardAbort = true
			hardAbortClass = 'GLOBAL_DRIFT'
			line('FAIL', 'Global restore audit', `HARD ABORT: ${drift.length} known release-state variable(s) differ from the phase baseline: ${drift.slice(0, 8).join(', ')}`)
		} else {
			line('PASS', 'Global restore audit', 'All known phase-baseline release-state variables match.')
		}
	}

	let reconnectStatus = 'NOT_RUN'
	if (!hardAbort) {
		try {
			const reconnectPass = await runReconnect(baseUrl, label, releasePage.pageNumber, built.locations.reconnect.change)
			reconnectStatus = reconnectPass ? 'PASS' : 'FAIL'
			line(reconnectPass ? 'PASS' : 'FAIL', 'Reconnect', reconnectPass ? 'Connection returned authorised.' : 'Connection did not return authorised in time.')
		} catch (error) {
			reconnectStatus = 'FAIL'
			line('FAIL', 'Reconnect', error.message)
		}
	}

	const summary = makeSummary({
		tests,
		results,
		hardAbort,
		hardAbortClass,
		reconnectStatus,
		safe,
		missingActions,
		stableSamples: stable.samples,
	})
	fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, '\t')}\n`, 'utf8')
	console.log('')
	console.log('==================================================================')
	console.log(`V1 RELEASE SUMMARY: PASS ${summary.pass} / FAIL ${summary.fail} / RECONNECT ${summary.reconnect}`)
	console.log(`LIVE COVERAGE: ${summary.coverage} / SAFE SKIP ${summary.safeCore.skip} / RELEASE NOT-RUNNABLE ${summary.notRunnableActionIds.length}`)
	if (summary.hardAbort) console.log(`SAFETY ABORT CLASS: ${summary.hardAbortClass}`)
	console.log('==================================================================')

	if (hardAbort) process.exitCode = 4
	else if (summary.fail > 0 || reconnectStatus === 'FAIL') process.exitCode = 2
	else if (summary.coverage !== 'FULL_LIVE') process.exitCode = 5
	else process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		line('FAIL', 'V1 release smoke V3', error.message)
		console.log('ABORTED. No hardware write should be attempted until the failure is diagnosed.')
		process.exitCode = 2
	})
}

module.exports = {
	RELEASE_REVISION,
	EXPECTED_RELEASE_ACTIONS,
	captureSourceCatalog,
	captureStableReleaseState,
	addDirectPairRestoreTests,
	addTalkbackSourceTest,
	orderReleaseTests,
	buildReleaseTestsV3,
	missingReleaseActionIds,
	executeTestV3,
	verifyKnownBaseline,
	makeSummary,
	V1_RELEASE_ALLOWED,
	V1_RELEASE_WITHHELD,
	directSourceCandidates,
}
