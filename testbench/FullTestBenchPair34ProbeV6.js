'use strict'

const fs = require('node:fs')
const path = require('node:path')
const {
	EXPECTED_MODEL,
	resultsDir,
	line,
	nowIso,
	sleep,
	readVariableOptional,
} = require('./FullTestBenchBase')
const { Reporter, exactCheck, verifyMany } = require('./FullTestBenchCorePhases')
const { pressBatch } = require('./FullTestBenchV4Common')
const { pairBatchIds } = require('./FullTestBenchPairsV4')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const {
	AUTO_PUBLISH_BRANCH,
	currentBranch,
	publishSanitizedToRemote,
} = require('./PublishLatestShareable')

const LEFT = 2
const RIGHT = 3
const LEFT_NUMBER = LEFT + 1
const RIGHT_NUMBER = RIGHT + 1
const PROBE_REVISION = 'pair34-source-none-observer-v1-20260822'
const PUBLIC_RELATIVE_PATH = path.join('docs', 'hardware-results', 'LATEST_PAIR34_PROBE.json')
const LOCAL_SHAREABLE_PATH = path.join(resultsDir, 'LATEST_PAIR34_SHAREABLE.json')
const REQUIRED_FLAGS = ['--allow-hardware-writes', '--confirm-output-3-4-physically-isolated']

function classifySource(item, original) {
	if (!item?.exists || String(item.value ?? '') === '') return 'unknown'
	const value = String(item.value)
	if (value === '0') return 'zero'
	if (value === String(original)) return 'original'
	return 'other'
}

function classifyPairObservation(leftItem, rightItem, leftOriginal, rightOriginal) {
	return {
		left: classifySource(leftItem, leftOriginal),
		right: classifySource(rightItem, rightOriginal),
	}
}

function outcomeFromObservation(observation, noneConfirmed) {
	if (noneConfirmed) return 'BOTH_ZERO_CONFIRMED'
	return `${String(observation.left).toUpperCase()}_${String(observation.right).toUpperCase()}`
}

function requireExplicitPermission(argv = process.argv.slice(2)) {
	for (const flag of REQUIRED_FLAGS) {
		if (!argv.includes(flag)) throw new Error(`REFUSED: missing explicit ${flag} permission.`)
	}
}

function pairChecks(leftExpected, rightExpected) {
	return [
		exactCheck(`output_${LEFT_NUMBER}_source`, leftExpected),
		exactCheck(`output_${RIGHT_NUMBER}_source`, rightExpected),
	]
}

async function readPair(baseUrl, label) {
	const [left, right] = await Promise.all([
		readVariableOptional(baseUrl, label, `output_${LEFT_NUMBER}_source`, 1500),
		readVariableOptional(baseUrl, label, `output_${RIGHT_NUMBER}_source`, 1500),
	])
	return { left, right }
}

async function samplePairTimeline(baseUrl, label, leftOriginal, rightOriginal) {
	const offsets = [0, 100, 500, 1500, 4000]
	const started = Date.now()
	const samples = []
	for (const targetMs of offsets) {
		const remaining = started + targetMs - Date.now()
		if (remaining > 0) await sleep(remaining)
		const pair = await readPair(baseUrl, label)
		samples.push({
			atMs: Date.now() - started,
			...classifyPairObservation(pair.left, pair.right, leftOriginal, rightOriginal),
		})
	}
	return samples
}

async function restoreOrFallback({ baseUrl, label, pageNumber, built, batches, leftOriginal, rightOriginal }) {
	let restoreResult = []
	try {
		await pressBatch(baseUrl, pageNumber, built, batches.restore)
		restoreResult = await verifyMany(baseUrl, label, pairChecks(leftOriginal, rightOriginal), 8000)
		if (restoreResult.every((item) => item.ok)) {
			return { restored: true, fallbackConfirmed: false }
		}
	} catch {
		restoreResult = []
	}

	let fallbackResult = []
	try {
		await pressBatch(baseUrl, pageNumber, built, batches.none)
		fallbackResult = await verifyMany(baseUrl, label, pairChecks('0', '0'), 7500)
	} catch {
		fallbackResult = []
	}
	return {
		restored: false,
		fallbackConfirmed: fallbackResult.length === 2 && fallbackResult.every((item) => item.ok),
	}
}

function validateShareablePayload(payload) {
	const allowedStates = new Set(['zero', 'original', 'other', 'unknown'])
	if (payload?.schemaVersion !== 1) throw new Error('Pair probe shareable schemaVersion mismatch.')
	if (payload?.reportClass !== 'shareable-sanitized-pair-source-probe') {
		throw new Error('Pair probe shareable reportClass mismatch.')
	}
	if (payload?.model !== EXPECTED_MODEL || payload?.pair?.left !== LEFT_NUMBER || payload?.pair?.right !== RIGHT_NUMBER) {
		throw new Error('Pair probe shareable target mismatch.')
	}
	if (!Array.isArray(payload.samples) || payload.samples.length === 0) throw new Error('Pair probe samples are missing.')
	for (const sample of payload.samples) {
		if (!Number.isFinite(sample.atMs) || !allowedStates.has(sample.left) || !allowedStates.has(sample.right)) {
			throw new Error('Pair probe sample contains an invalid public value.')
		}
	}
	const text = JSON.stringify(payload)
	if (/\b[A-Za-z]:[\\/]|https?:\/\/|<set\b|<device\b|client[_ -]?key|server[_ -]?port/i.test(text)) {
		throw new Error('Pair probe privacy gate refused sensitive content.')
	}
	return true
}

async function publishResult(payload) {
	validateShareablePayload(payload)
	fs.mkdirSync(resultsDir, { recursive: true })
	const serialized = `${JSON.stringify(payload, null, 2)}\n`
	fs.writeFileSync(LOCAL_SHAREABLE_PATH, serialized, 'utf8')
	if (currentBranch() !== AUTO_PUBLISH_BRANCH) {
		line('INFO', 'Pair 3-4 publication', 'skipped outside validation branch; local sanitized result retained')
		return
	}
	try {
		const result = publishSanitizedToRemote({ relativePublicPath: PUBLIC_RELATIVE_PATH, serialized })
		line(
			'PASS',
			'Pair 3-4 publication',
			result.published ? `published in ${result.attempts} attempt(s)` : 'GitHub already matches this result',
		)
	} catch (error) {
		line('WARN', 'Pair 3-4 publication', `${error.message}; local sanitized result retained`)
	}
}

async function runProbe() {
	requireExplicitPermission()
	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		line('PREP REQUIRED', 'Mixer variables', 'Enable Expose all mixer slot variables, Apply, then rerun this targeted probe.')
		process.exitCode = 6
		return
	}
	if (ctx.prep === 'harness') {
		line('PREP REQUIRED', 'Capability Lab page 2', 'Replace only page 2 with generated/FULL_EXTENDED.companionconfig, remap the target connection, then rerun this targeted probe.')
		process.exitCode = 6
		return
	}

	if (ctx.model !== EXPECTED_MODEL) throw new Error(`REFUSED: targeted probe supports only ${EXPECTED_MODEL}.`)
	if (!ctx.profile.outputPairs.some(([left, right]) => left === LEFT && right === RIGHT)) {
		throw new Error('REFUSED: outputs 3-4 are not an explicit profile pair.')
	}
	const eligibility = new Map(ctx.outputEligibility.map((row) => [row.output, row.availability]))
	if (eligibility.get(LEFT) !== 'AVAILABLE' || eligibility.get(RIGHT) !== 'AVAILABLE') {
		throw new Error(`REFUSED: outputs 3-4 must both be AVAILABLE, observed ${eligibility.get(LEFT)}/${eligibility.get(RIGHT)}.`)
	}

	const leftSnapshot = ctx.snapshot.values[`output_${LEFT_NUMBER}_source`]
	const rightSnapshot = ctx.snapshot.values[`output_${RIGHT_NUMBER}_source`]
	if (!leftSnapshot?.exists || !rightSnapshot?.exists || leftSnapshot.value === '' || rightSnapshot.value === '') {
		throw new Error('REFUSED: exact original sources for outputs 3-4 are not both server-confirmed; no hardware write attempted.')
	}
	if (String(leftSnapshot.value) === '0' || String(rightSnapshot.value) === '0') {
		throw new Error('REFUSED: one of outputs 3-4 is already Source=None; this probe would be a no-op and is not diagnostic.')
	}

	const batches = pairBatchIds(LEFT, RIGHT)
	if (!ctx.built.locations[batches.none] || !ctx.built.locations[batches.restore]) {
		throw new Error('REFUSED: pair 3-4 None/restore actions are missing from the audited Page 2 harness.')
	}

	const liveBefore = await readPair(ctx.baseUrl, ctx.label)
	if (
		!liveBefore.left.exists ||
		!liveBefore.right.exists ||
		String(liveBefore.left.value) !== String(leftSnapshot.value) ||
		String(liveBefore.right.value) !== String(rightSnapshot.value)
	) {
		throw new Error('REFUSED: outputs 3-4 changed after the preflight snapshot; exact restoration cannot be guaranteed.')
	}

	line('INFO', 'PAIR 3-4 targeted probe', 'physical isolation flag accepted; only audited pair Source=None then exact pair restore will be pressed')
	let attempted = false
	let samples = []
	let noneConfirmed = false
	let finalObservation = { left: 'unknown', right: 'unknown' }
	let restoration = { restored: false, fallbackConfirmed: false }
	let probeError = ''

	try {
		attempted = true
		await pressBatch(ctx.baseUrl, ctx.ext.pageNumber, ctx.built, batches.none)
		samples = await samplePairTimeline(ctx.baseUrl, ctx.label, leftSnapshot.value, rightSnapshot.value)
		const noneResult = await verifyMany(ctx.baseUrl, ctx.label, pairChecks('0', '0'), 4000)
		noneConfirmed = noneResult.every((item) => item.ok)
		const observed = await readPair(ctx.baseUrl, ctx.label)
		finalObservation = classifyPairObservation(observed.left, observed.right, leftSnapshot.value, rightSnapshot.value)
	} catch (error) {
		probeError = error.message
	} finally {
		if (attempted) {
			restoration = await restoreOrFallback({
				baseUrl: ctx.baseUrl,
				label: ctx.label,
				pageNumber: ctx.ext.pageNumber,
				built: ctx.built,
				batches,
				leftOriginal: leftSnapshot.value,
				rightOriginal: rightSnapshot.value,
			})
		}
	}

	const payload = {
		schemaVersion: 1,
		reportClass: 'shareable-sanitized-pair-source-probe',
		generatedAt: nowIso(),
		revision: PROBE_REVISION,
		model: EXPECTED_MODEL,
		hardwareWrites: attempted,
		pair: { left: LEFT_NUMBER, right: RIGHT_NUMBER },
		samples,
		final: finalObservation,
		noneConfirmed,
		outcome: outcomeFromObservation(finalObservation, noneConfirmed),
		restoreConfirmed: restoration.restored,
		fallbackNoneConfirmed: restoration.fallbackConfirmed,
		probeCompletedWithoutException: probeError === '',
	}
	await publishResult(payload)

	line('INFO', 'Pair Source=None result', `${payload.outcome}; restoreConfirmed=${payload.restoreConfirmed}; fallbackNoneConfirmed=${payload.fallbackNoneConfirmed}`)
	if (probeError) line('FAIL', 'Pair 3-4 probe', probeError)
	if (!restoration.restored) {
		line('HARD ABORT', 'Pair 3-4 restore', `original sources not both confirmed; Source=None fallback=${restoration.fallbackConfirmed ? 'confirmed' : 'not confirmed'}`)
		process.exitCode = 4
		return
	}
	process.exitCode = probeError || !noneConfirmed ? 2 : 0
}

if (require.main === module) {
	runProbe().catch((error) => {
		console.error(`FATAL: ${error.message}`)
		process.exitCode = 2
	})
}

module.exports = {
	LEFT,
	RIGHT,
	PROBE_REVISION,
	PUBLIC_RELATIVE_PATH,
	REQUIRED_FLAGS,
	classifySource,
	classifyPairObservation,
	outcomeFromObservation,
	requireExplicitPermission,
	validateShareablePayload,
	runProbe,
}
