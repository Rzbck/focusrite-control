'use strict'

const fs = require('node:fs')
const path = require('node:path')
const packageJson = require('../package.json')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE,
	safePlanPath,
	resultsDir,
	line,
	sleep,
	findCompanion,
	get,
	post,
	readVariable,
	waitVariable,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')
const { normalizeConnections } = require('./FullTestBenchCompanionImportV7')
const { buildReleaseTests, buildReleasePage } = require('./FullTestBenchV1Release')
const {
	captureReleaseState,
	ensureReleasePage,
	collectReleaseActionIds,
	requireFreshSafeResultBaselineAware,
} = require('./FullTestBenchV1ReleaseV2')
const {
	captureSourceCatalog,
	schemaSourcePairs,
	captureStableReleaseState,
	addTalkbackSourceTest,
	orderReleaseTests,
	executeTestV4,
	verifyKnownBaseline,
} = require('./FullTestBenchV1ReleaseV4')

const EXPECTED_MODULE_VERSION = packageJson.version
const RELEASE_REVISION = 'v1-release-smoke-v5-pair-withheld-20260826'
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
	'output_nickname',
	'device_nickname',
	'phantom_persistence',
	'talkback_source',
	'reconnect',
]

function buildReleaseTestsV5(values, catalog) {
	let tests = buildReleaseTests(values, catalog.routingSources).filter(
		(test) => test.change.definitionId !== 'output_pair_source',
	)
	tests = addTalkbackSourceTest(tests, values, catalog.sourceNames)
	return orderReleaseTests(tests)
}

function missingReleaseActionIds(tests) {
	const present = collectReleaseActionIds(tests)
	return EXPECTED_RELEASE_ACTIONS.filter((id) => !present.has(id))
}

function publicResult(test, status, detail, classification = null) {
	return { id: test.id, label: test.label, action: test.change.definitionId, status, classification, detail }
}

async function pressLocation(baseUrl, pageNumber, location) {
	await post(baseUrl, `/api/location/${pageNumber}/${location.row}/${location.column}/press`, 10000)
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
		withheldActionIds: ['output_pair_source'],
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
	if (EXPECTED_MODULE_VERSION !== '0.1.21') {
		throw new Error(`REFUSED: V1 release smoke V5 is pinned to module 0.1.21, current package is ${EXPECTED_MODULE_VERSION}.`)
	}

	const safe = prepareOnly ? null : requireFreshSafeResultBaselineAware()

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 V1 RELEASE SMOKE V5 - PAIR ROUTING WITHHELD')
	console.log('==================================================================')
	console.log(
		prepareOnly
			? 'PREPARE-ONLY: Page 2 audit/import; ZERO Focusrite hardware writes.'
			: 'The live Focusrite configuration is read and stabilised before the release plan is built.',
	)
	console.log('No fixed routing/preset baseline is assumed; unknown state remains SKIP/NOT-RUNNABLE.')
	console.log('Output stereo-pair routing is WITHHELD from the v1 write plan after repeated two-member hardware closure failed.')
	console.log('Schema source-pair metadata is read only for diagnostics; no output_pair_source button is generated or pressed.')
	console.log('Every attempted retained write requires exact target restore plus a collateral-state audit.')
	console.log('No ALT/Stereo/Custom Mix/pair-routing/disruptive/raw/Monitor-gain write exists in this public-surface runner.')
	console.log('')

	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const connections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	if (r9.connection.moduleId !== EXPECTED_MODULE) throw new Error(`Unexpected module ${r9.connection.moduleId}.`)
	const label = String(r9.connection.label)
	line(
		'PASS',
		'Page 1 r9 / module audit',
		`Page 1 preserved; ${EXPECTED_MODULE_VERSION} loaded; 829 feedback probes present`,
	)

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
	const schemaPairs = schemaSourcePairs(catalog.routingSources)
	line(
		'INFO',
		'Schema source-pair readback',
		`${schemaPairs.length} reciprocal source pair(s) observed; pair-routing write remains withheld`,
	)
	const tests = buildReleaseTestsV5(stable.values, catalog)
	if (tests.some((test) => test.change.definitionId === 'output_pair_source' || test.restore.definitionId === 'output_pair_source')) {
		throw new Error('REFUSED BEFORE WRITE: withheld output_pair_source escaped into the V5 release plan.')
	}
	const missingActions = missingReleaseActionIds(tests)
	const built = buildReleasePage(tests)
	const releasePage = await ensureReleasePage(baseUrl, built, r9, connections, exported)
	line('PASS', 'Page 2 release harness', `${built.signature}; ${tests.length} exact-restore test(s); existing connection reused`)
	if (missingActions.length) {
		line(
			'INFO',
			'Current baseline coverage',
			`${missingActions.length} retained action ID(s) not runnable now: ${missingActions.join(', ')}`,
		)
	} else {
		line('PASS', 'Current baseline coverage', 'All retained release action IDs have a live exact-restorable path.')
	}
	line('INFO', 'Withheld pair routing', 'output_pair_source is intentionally NOT RUN by V5.')
	if (prepareOnly) {
		line('PASS', 'Prepare-only', 'Page 2 is current; Page 1/other pages/connections preserved; ZERO hardware writes.')
		return
	}

	line(
		'INFO',
		'SAFE Core result',
		`PASS=${safe.pass} FAIL=${safe.fail} SKIP=${safe.skip}; SKIP means baseline unknown, not unsupported`,
	)

	const phaseBaseline = stable.values
	const results = []
	let hardAbort = false
	let hardAbortClass = null
	for (const test of tests) {
		const preTestBaseline = await captureReleaseState(baseUrl, label)
		const execution = await executeTestV4(baseUrl, label, releasePage.pageNumber, test, built.locations[test.id])
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
			line(
				'FAIL',
				'Global restore audit',
				`HARD ABORT: ${drift.length} known release-state variable(s) differ from the phase baseline: ${drift.slice(0, 8).join(', ')}`,
			)
		} else {
			line('PASS', 'Global restore audit', 'All known phase-baseline release-state variables match.')
		}
	}

	let reconnectStatus = 'NOT_RUN'
	if (!hardAbort) {
		try {
			const reconnectPass = await runReconnect(baseUrl, label, releasePage.pageNumber, built.locations.reconnect.change)
			reconnectStatus = reconnectPass ? 'PASS' : 'FAIL'
			line(
				reconnectPass ? 'PASS' : 'FAIL',
				'Reconnect',
				reconnectPass ? 'Connection returned authorised.' : 'Connection did not return authorised in time.',
			)
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
	console.log(
		`LIVE COVERAGE: ${summary.coverage} / SAFE SKIP ${summary.safeCore.skip} / RELEASE NOT-RUNNABLE ${summary.notRunnableActionIds.length}`,
	)
	console.log('WITHHELD: output_pair_source (not executed)')
	if (summary.hardAbort) console.log(`SAFETY ABORT CLASS: ${summary.hardAbortClass}`)
	console.log('==================================================================')

	if (hardAbort) process.exitCode = 4
	else if (summary.fail > 0 || reconnectStatus === 'FAIL') process.exitCode = 2
	else if (summary.coverage !== 'FULL_LIVE') process.exitCode = 5
	else process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		line('FAIL', 'V1 release smoke V5', error.message)
		console.log('ABORTED. No hardware write should be attempted until the failure is diagnosed.')
		process.exitCode = 2
	})
}

module.exports = {
	RELEASE_REVISION,
	EXPECTED_RELEASE_ACTIONS,
	buildReleaseTestsV5,
	missingReleaseActionIds,
	makeSummary,
}
