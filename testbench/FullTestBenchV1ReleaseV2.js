'use strict'

const fs = require('node:fs')
const path = require('node:path')
const packageJson = require('../package.json')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE,
	safePlanPath,
	generatedDir,
	resultsDir,
	line,
	sleep,
	findCompanion,
	get,
	post,
	readVariableOptional,
	readVariable,
	waitVariable,
	exportButtons,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')
const {
	TrpcWsRpc,
	rpcWebSocketUrl,
	normalizeConnections,
	buildConnectionRemap,
	prepareImport,
	hashPagesExcept,
	sameConnectionSet,
} = require('./FullTestBenchCompanionImportV7')
const {
	V1_RELEASE_ALLOWED,
	V1_RELEASE_WITHHELD,
	buildReleaseTests,
	buildReleasePage,
	pageLooksLikeVerifiedTestBench,
	auditReleasePage,
	expectedMatches,
	verifyReleaseStateBaseline,
} = require('./FullTestBenchV1Release')

const EXPECTED_MODULE_VERSION = packageJson.version
const RELEASE_REVISION = 'v1-release-smoke-v2-20260826'
const generatedPagePath = path.join(generatedDir, 'V1_RELEASE_SMOKE.companionconfig')
const generatedManifestPath = path.join(generatedDir, 'V1_RELEASE_SMOKE_MANIFEST.json')
const outputPath = path.join(resultsDir, 'latest-v1-release-smoke.json')
const safeResultPath = path.join(resultsDir, 'latest-safe-hardware-result.json')

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

async function captureSources(baseUrl, label) {
	const sources = []
	let misses = 0
	for (let n = 1; n <= 128 && misses < 8; n++) {
		const [id, name, type] = await Promise.all([
			readVariableOptional(baseUrl, label, `source_${n}_root_id`, 1800),
			readVariableOptional(baseUrl, label, `source_${n}_name`, 1800),
			readVariableOptional(baseUrl, label, `source_${n}_type`, 1800),
		])
		if (!id.exists || !name.exists) {
			misses++
			continue
		}
		misses = 0
		const rawId = String(id.value || '').trim()
		const sourceName = String(name.value || '').trim()
		if (!rawId || rawId === '0' || !sourceName) continue
		sources.push({ id: rawId, name: sourceName, type: String(type.value || '').trim() })
	}
	return sources
}

async function captureReleaseState(baseUrl, label) {
	const values = {}
	const read = async (name) => {
		values[name] = await readVariableOptional(baseUrl, label, name, 2500)
		return values[name]
	}

	for (const name of [
		'monitor_preset',
		'device_nickname',
		'device_phantomPersistence',
		'device_talkbackInputSource',
	]) {
		await read(name)
	}
	for (let input = 1; input <= 8; input++) {
		for (const key of ['nickname', 'mode']) await read(`input_${input}_${key}`)
	}
	for (let output = 1; output <= 26; output++) {
		for (const key of ['available', 'mute', 'source', 'nickname', 'gain']) await read(`output_${output}_${key}`)
	}
	return values
}

function writeGeneratedPage(built) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(generatedPagePath, `${JSON.stringify(built.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(
		generatedManifestPath,
		`${JSON.stringify(
			{
				schemaVersion: 2,
				revision: RELEASE_REVISION,
				signature: built.signature,
				pageName: built.pageName,
				testCount: built.testCount,
				generatedUtc: new Date().toISOString(),
			},
			null,
			'\t',
		)}\n`,
		'utf8',
	)
}

async function ensureReleasePage(baseUrl, built, r9, connections, exported) {
	const existing = Object.entries(exported.pages || {}).find(([, page]) => page?.name === built.pageName)
	if (existing) return auditReleasePage(exported, built, connections, r9.connection)

	const page2 = exported.pages?.['2']
	if (page2 && !pageLooksLikeVerifiedTestBench(page2, exported)) {
		throw new Error('REFUSED: Companion Page 2 is not a verified Focusrite TestBench page; release smoke will not overwrite it.')
	}
	if (!page2) throw new Error('REFUSED: Companion Page 2 is missing; release smoke will not create/reorder user pages.')

	writeGeneratedPage(built)
	const beforeOtherPagesHash = hashPagesExcept(exported, 2)
	const beforeConnections = connections
	const rpc = new TrpcWsRpc(rpcWebSocketUrl(baseUrl))
	try {
		await rpc.connect()
		const prepared = await prepareImport(rpc, generatedPagePath)
		const remap = buildConnectionRemap(prepared, r9.connection)
		await rpc.mutate('importExport.importSinglePage', {
			targetPage: 2,
			sourcePage: 1,
			connectionIdRemapping: remap,
		})
	} finally {
		rpc.close()
	}

	const after = await exportButtons(baseUrl)
	const afterConnections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	if (hashPagesExcept(after, 2) !== beforeOtherPagesHash) {
		throw new Error('Release Page 2 audit failed: a page other than Page 2 changed.')
	}
	if (!sameConnectionSet(beforeConnections, afterConnections)) {
		throw new Error('Release Page 2 audit failed: Companion connection set changed.')
	}
	return auditReleasePage(after, built, afterConnections, r9.connection)
}

function collectReleaseActionIds(tests) {
	const ids = new Set(['reconnect'])
	for (const test of tests) {
		for (const spec of [test.precondition, test.change, test.restore, ...(test.restorePair || [])].filter(Boolean)) {
			ids.add(spec.definitionId)
		}
	}
	return ids
}

function missingReleaseActionIds(tests) {
	const present = collectReleaseActionIds(tests)
	return EXPECTED_RELEASE_ACTIONS.filter((id) => !present.has(id))
}

function requireFreshSafeResultBaselineAware() {
	if (!fs.existsSync(safeResultPath)) throw new Error('REFUSED: SAFE Core result is missing.')
	const safe = JSON.parse(fs.readFileSync(safeResultPath, 'utf8'))
	const ageMs = Date.now() - Date.parse(safe.generatedUtc || '')
	if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 15 * 60 * 1000) {
		throw new Error('REFUSED: SAFE Core result is not fresh; run the V1 release launcher from the beginning.')
	}
	if (safe.moduleVersion !== EXPECTED_MODULE_VERSION || safe.targetModel !== EXPECTED_MODEL) {
		throw new Error('REFUSED: SAFE Core result does not match the final 0.1.20 Scarlett 18i20 target.')
	}
	const pass = Number(safe.pass || 0)
	const fail = Number(safe.fail || 0)
	const skip = Number(safe.skip || 0)
	if (safe.hardAbort || fail !== 0 || pass + skip !== 21 || pass <= 0) {
		throw new Error(`REFUSED: SAFE Core is unsafe/incomplete (PASS=${pass} FAIL=${fail} SKIP=${skip}).`)
	}
	return safe
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

function publicResult(test, status, detail) {
	return { id: test.id, label: test.label, action: test.change.definitionId, status, detail }
}

async function executeTest(baseUrl, label, pageNumber, test, locations) {
	const currentBefore = test.variables
		? await Promise.all(test.variables.map((variable) => readVariableOptional(baseUrl, label, variable, 2000)))
		: [await readVariableOptional(baseUrl, label, test.variable, 2000)]
	if (currentBefore.some((item) => !item.exists)) {
		return {
			hardAbort: true,
			result: publicResult(test, 'FAIL', 'Required server-confirmed baseline disappeared before write.'),
		}
	}
	const wantedBaseline = Array.isArray(test.expectedRestore) ? test.expectedRestore : [test.expectedRestore]
	const baselineKind = test.kind === 'opaque-source-pair' ? 'text' : test.kind
	const baselineOk = currentBefore.every((item, index) => expectedMatches(baselineKind, item.value, wantedBaseline[index]))
	if (!baselineOk) {
		return {
			hardAbort: true,
			result: publicResult(test, 'FAIL', 'Baseline drift detected before write; no action pressed.'),
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
					result: publicResult(test, 'FAIL', 'HARD ABORT: exact original state was not server-confirmed after restore.'),
				}
			}
		} catch (error) {
			return {
				hardAbort: true,
				result: publicResult(test, 'FAIL', `HARD ABORT: restore failed (${error.message}).`),
			}
		}
	}

	return {
		hardAbort: false,
		result: changeConfirmed
			? publicResult(test, 'PASS', 'Server-confirmed change and exact restore.')
			: publicResult(test, 'FAIL', `Change unconfirmed; exact original state restored. ${changeDetail}`),
	}
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

function makeSummary({ tests, results, hardAbort, reconnectPass, safe, missingActions }) {
	const passedActionIds = new Set(results.filter((result) => result.status === 'PASS').map((result) => result.action))
	if (reconnectPass) passedActionIds.add('reconnect')
	const coveragePartial = Number(safe.skip || 0) > 0 || missingActions.length > 0
	return {
		generatedUtc: new Date().toISOString(),
		revision: RELEASE_REVISION,
		moduleVersion: EXPECTED_MODULE_VERSION,
		targetModel: EXPECTED_MODEL,
		coverage: coveragePartial ? 'PARTIAL_SAFE' : 'FULL_LIVE',
		safeCore: {
			pass: Number(safe.pass || 0),
			fail: Number(safe.fail || 0),
			skip: Number(safe.skip || 0),
		},
		testCount: tests.length,
		pass: results.filter((result) => result.status === 'PASS').length,
		fail: results.filter((result) => result.status === 'FAIL').length,
		hardAbort,
		reconnect: reconnectPass ? 'PASS' : 'FAIL',
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
	console.log(' FOCUSRITE 18i20 V1 RELEASE SMOKE V2 - BASELINE-AWARE')
	console.log('==================================================================')
	console.log(prepareOnly ? 'PREPARE-ONLY: Page 2 audit/import; ZERO Focusrite hardware writes.' : 'Only retained v1 public actions with exact current baselines are pressed.')
	console.log('Unknown current state is SKIP/NOT-RUNNABLE, never invented and never written to warm state.')
	console.log('Any attempted write still requires exact server-confirmed restoration or HARD ABORT.')
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

	const [values, sources] = await Promise.all([captureReleaseState(baseUrl, label), captureSources(baseUrl, label)])
	const tests = buildReleaseTests(values, sources)
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

	const results = []
	let hardAbort = false
	for (const test of tests) {
		const execution = await executeTest(baseUrl, label, releasePage.pageNumber, test, built.locations[test.id])
		results.push(execution.result)
		line(execution.result.status, test.label, execution.result.detail)
		if (execution.hardAbort) {
			hardAbort = true
			break
		}
		await sleep(120)
	}

	if (!hardAbort) {
		const drift = await verifyReleaseStateBaseline(baseUrl, label, values)
		if (drift.length) {
			hardAbort = true
			line('FAIL', 'Global restore audit', `HARD ABORT: ${drift.length} release-state variable(s) differ from the pre-write baseline.`)
		} else {
			line('PASS', 'Global restore audit', 'All captured release-state variables match the pre-write baseline.')
		}
	}

	let reconnectPass = false
	if (!hardAbort) {
		try {
			reconnectPass = await runReconnect(baseUrl, label, releasePage.pageNumber, built.locations.reconnect.change)
			line(reconnectPass ? 'PASS' : 'FAIL', 'Reconnect', reconnectPass ? 'Connection returned authorised.' : 'Connection did not return authorised in time.')
		} catch (error) {
			line('FAIL', 'Reconnect', error.message)
		}
	}

	const summary = makeSummary({ tests, results, hardAbort, reconnectPass, safe, missingActions })
	fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, '\t')}\n`, 'utf8')
	console.log('')
	console.log('==================================================================')
	console.log(`V1 RELEASE SUMMARY: PASS ${summary.pass} / FAIL ${summary.fail} / RECONNECT ${summary.reconnect}`)
	console.log(`LIVE COVERAGE: ${summary.coverage} / SAFE SKIP ${summary.safeCore.skip} / RELEASE NOT-RUNNABLE ${summary.notRunnableActionIds.length}`)
	console.log('==================================================================')

	if (hardAbort) process.exitCode = 4
	else if (summary.fail > 0 || !reconnectPass) process.exitCode = 2
	else if (summary.coverage !== 'FULL_LIVE') process.exitCode = 5
	else process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		line('FAIL', 'V1 release smoke V2', error.message)
		console.log('ABORTED. No further hardware write should be attempted until the failure is diagnosed.')
		process.exitCode = 2
	})
}

module.exports = {
	RELEASE_REVISION,
	EXPECTED_RELEASE_ACTIONS,
	captureSources,
	captureReleaseState,
	ensureReleasePage,
	collectReleaseActionIds,
	missingReleaseActionIds,
	requireFreshSafeResultBaselineAware,
	executeTest,
	makeSummary,
	V1_RELEASE_ALLOWED,
	V1_RELEASE_WITHHELD,
}
