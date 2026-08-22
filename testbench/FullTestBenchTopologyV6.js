'use strict'

const { readVariableOptional, sleep } = require('./FullTestBenchBase')
const { exactCheck, verifyMany } = require('./FullTestBenchCorePhases')
const { STATUS } = require('./FullTestBenchCapabilityV4')
const { pairBatchIds } = require('./FullTestBenchPairsV4')
const { pressBatch } = require('./FullTestBenchV4Common')

function pairTopologyRowId(left, right) {
	return `output-pair:${left + 1}-${right + 1}:topology`
}

function classifySource(item, original, requested = '') {
	if (!item?.exists || String(item.value ?? '') === '') return 'unknown'
	const value = String(item.value)
	if (value === '0') return 'zero'
	if (requested !== '' && value === String(requested)) return 'requested'
	if (value === String(original)) return 'original'
	return 'other'
}

function classifyPairObservation(pair, leftOriginal, rightOriginal, leftRequested = '') {
	return {
		left: classifySource(pair.left, leftOriginal, leftRequested),
		right: classifySource(pair.right, rightOriginal),
	}
}

function observationOutcome(observation) {
	return `${String(observation.left).toUpperCase()}_${String(observation.right).toUpperCase()}`
}

async function readPair(baseUrl, label, left, right) {
	const [leftItem, rightItem] = await Promise.all([
		readVariableOptional(baseUrl, label, `output_${left + 1}_source`, 1500),
		readVariableOptional(baseUrl, label, `output_${right + 1}_source`, 1500),
	])
	return { left: leftItem, right: rightItem }
}

async function sampleNoneTimeline({ baseUrl, label, left, right, leftOriginal, rightOriginal }) {
	const offsets = [0, 100, 500, 1500, 4000]
	const started = Date.now()
	const samples = []
	for (const targetMs of offsets) {
		const remaining = started + targetMs - Date.now()
		if (remaining > 0) await sleep(remaining)
		const pair = await readPair(baseUrl, label, left, right)
		samples.push({
			atMs: Date.now() - started,
			...classifyPairObservation(pair, leftOriginal, rightOriginal),
		})
	}
	return samples
}

function exactPairChecks(left, right, leftExpected, rightExpected) {
	return [
		exactCheck(`output_${left + 1}_source`, leftExpected),
		exactCheck(`output_${right + 1}_source`, rightExpected),
	]
}

async function verifyExactPair(baseUrl, label, left, right, leftOriginal, rightOriginal, timeout = 8000) {
	const result = await verifyMany(
		baseUrl,
		label,
		exactPairChecks(left, right, leftOriginal, rightOriginal),
		timeout,
	)
	return result.every((item) => item.ok)
}

async function restoreExactPair({ baseUrl, label, pageNumber, built, batches, left, right, leftOriginal, rightOriginal }) {
	try {
		await pressBatch(baseUrl, pageNumber, built, batches.restore)
		if (await verifyExactPair(baseUrl, label, left, right, leftOriginal, rightOriginal)) {
			return { restored: true, method: 'pair', fallbackNoneConfirmed: false }
		}
	} catch {
		// Try exact individual restores below.
	}

	const leftRestore = `v4-output-${left + 1}-source-restore`
	const rightRestore = `v4-output-${right + 1}-source-restore`
	if (built.locations[leftRestore] && built.locations[rightRestore]) {
		try {
			await pressBatch(baseUrl, pageNumber, built, leftRestore)
			await pressBatch(baseUrl, pageNumber, built, rightRestore)
			if (await verifyExactPair(baseUrl, label, left, right, leftOriginal, rightOriginal)) {
				return { restored: true, method: 'individual', fallbackNoneConfirmed: false }
			}
		} catch {
			// Try the safe None fallback below.
		}
	}

	let fallbackNoneConfirmed = false
	try {
		await pressBatch(baseUrl, pageNumber, built, batches.none)
		const fallback = await verifyMany(baseUrl, label, exactPairChecks(left, right, '0', '0'), 7500)
		fallbackNoneConfirmed = fallback.every((item) => item.ok)
	} catch {
		fallbackNoneConfirmed = false
	}
	return { restored: false, method: 'failed', fallbackNoneConfirmed }
}

function uniqueTimelineOutcomes(samples) {
	return [...new Set(samples.map((sample) => observationOutcome(sample)))].join('>')
}

async function sweepPairTopology({
	baseUrl,
	label,
	pageNumber,
	built,
	snapshot,
	profile,
	outputEligibility,
	update,
}) {
	const eligibility = new Map((outputEligibility || []).map((row) => [row.output, row.availability]))
	const results = []

	for (const [left, right] of profile.outputPairs || []) {
		if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(right)) continue
		const rowId = pairTopologyRowId(left, right)
		const leftSource = snapshot.values[`output_${left + 1}_source`]
		const rightSource = snapshot.values[`output_${right + 1}_source`]
		if (!leftSource?.exists || !rightSource?.exists) {
			update(rowId, STATUS.SKIP_NO_CAPABILITY, 'Both pair members do not expose output source state.', 'output-topology')
			continue
		}
		const leftAvail = eligibility.get(left)
		const rightAvail = eligibility.get(right)
		if (leftAvail === 'UNAVAILABLE' || rightAvail === 'UNAVAILABLE') {
			update(
				rowId,
				STATUS.SKIP_UNAVAILABLE,
				`Pair availability is ${leftAvail}/${rightAvail}; topology write skipped.`,
				'output-topology',
			)
			continue
		}
		if (leftAvail === 'UNKNOWN' || rightAvail === 'UNKNOWN') {
			update(
				rowId,
				STATUS.SKIP_AVAILABILITY_UNKNOWN,
				`Pair availability is ${leftAvail}/${rightAvail}; topology write skipped.`,
				'output-topology',
			)
			continue
		}
		if (leftSource.value === '' || rightSource.value === '') {
			update(
				rowId,
				STATUS.EVAL_ONLY,
				'Exact original source state is not server-confirmed on both members; topology write refused because exact restoration is not guaranteed.',
				'output-topology',
			)
			continue
		}

		const batches = pairBatchIds(left, right)
		if (
			!built.locations[batches.test] ||
			!built.locations[batches.alt] ||
			!built.locations[batches.none] ||
			!built.locations[batches.restore]
		) {
			update(
				rowId,
				STATUS.SKIP_NO_HARNESS,
				'Pair test-A/test-B/None/restore harness is incomplete.',
				'output-topology',
			)
			continue
		}

		const liveBefore = await readPair(baseUrl, label, left, right)
		if (
			!liveBefore.left.exists ||
			!liveBefore.right.exists ||
			String(liveBefore.left.value) !== String(leftSource.value) ||
			String(liveBefore.right.value) !== String(rightSource.value)
		) {
			update(
				rowId,
				STATUS.EVAL_ONLY,
				'Live pair source state changed after the preflight snapshot; topology write refused because exact restoration cannot be guaranteed.',
				'output-topology',
			)
			continue
		}

		let routeObservation = { left: 'unknown', right: 'unknown' }
		let noneSamples = []
		let probeError = ''
		let restoration = { restored: false, method: 'failed', fallbackNoneConfirmed: false }
		try {
			let requested = String(built.testSources.primary)
			await pressBatch(baseUrl, pageNumber, built, batches.test)
			await sleep(500)
			let routed = await readPair(baseUrl, label, left, right)
			routeObservation = classifyPairObservation(routed, leftSource.value, rightSource.value, requested)
			if (routeObservation.left !== 'requested') {
				requested = String(built.testSources.secondary)
				await pressBatch(baseUrl, pageNumber, built, batches.alt)
				await sleep(500)
				routed = await readPair(baseUrl, label, left, right)
				routeObservation = classifyPairObservation(routed, leftSource.value, rightSource.value, requested)
			}

			await pressBatch(baseUrl, pageNumber, built, batches.none)
			noneSamples = await sampleNoneTimeline({
				baseUrl,
				label,
				left,
				right,
				leftOriginal: leftSource.value,
				rightOriginal: rightSource.value,
			})
		} catch (error) {
			probeError = error.message
		} finally {
			restoration = await restoreExactPair({
				baseUrl,
				label,
				pageNumber,
				built,
				batches,
				left,
				right,
				leftOriginal: leftSource.value,
				rightOriginal: rightSource.value,
			})
		}

		const routeOutcome = observationOutcome(routeObservation)
		const noneOutcome = noneSamples.length ? observationOutcome(noneSamples.at(-1)) : 'UNKNOWN_UNKNOWN'
		const timeline = noneSamples.length ? uniqueTimelineOutcomes(noneSamples) : 'none'
		results.push({
			left: left + 1,
			right: right + 1,
			routeOutcome,
			noneOutcome,
			restored: restoration.restored,
			restoreMethod: restoration.method,
		})

		if (!restoration.restored) {
			update(
				rowId,
				STATUS.QUARANTINED_RESTORE,
				`${probeError ? `${probeError}; ` : ''}route=${routeOutcome}; none=${noneOutcome}; pair and exact individual restores failed; both-member None fallback=${restoration.fallbackNoneConfirmed ? 'confirmed' : 'not confirmed'}.`,
				'output-topology',
			)
			throw new Error(
				`TOPOLOGY RESTORE FAILED for outputs ${left + 1}-${right + 1}; fallback None ${restoration.fallbackNoneConfirmed ? 'confirmed' : 'not confirmed'}.`,
			)
		}

		const restoreDetail = `exact original restore confirmed via ${restoration.method} action path`
		if (probeError) {
			update(
				rowId,
				STATUS.FAIL_NO_EFFECT,
				`${probeError}; route=${routeOutcome}; none=${noneOutcome}; timeline=${timeline}; ${restoreDetail}.`,
				'output-topology',
			)
		} else {
			update(
				rowId,
				STATUS.PASS,
				`Observed route=${routeOutcome}; none=${noneOutcome}; timeline=${timeline}; ${restoreDetail}. This is per-pair topology evidence, not a parity rule.`,
				'output-topology',
			)
		}
	}

	return results
}

module.exports = {
	pairTopologyRowId,
	classifySource,
	classifyPairObservation,
	observationOutcome,
	uniqueTimelineOutcomes,
	restoreExactPair,
	sweepPairTopology,
}
