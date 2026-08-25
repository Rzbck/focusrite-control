'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { generatedDir, resultsDir, nowIso, line, sleep, readVariableOptional } = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { appendBatch } = require('./MeterRoutingPage')
const { pressBatch } = require('./FullTestBenchV4Common')
const { replacePage2FromFile } = require('./MeterRoutingPageImport')
const { pairBatchIds } = require('./FullTestBenchPairsV4')
const { restoreExactPair } = require('./FullTestBenchTopologyV6')
const {
	collectPlaybackCandidates,
	loadPriorPlaybackHint,
	playbackExactLaneCount,
} = require('./MixFeedbackClosureRunner')
const { chooseTopologyBootstrapPlayback, sanitizedPlaybackCandidates } = require('./MixTopologyMaterialize')

const TEMP_PAGE = path.join(generatedDir, 'MIX_OUTPUT_ROUTING_MATERIALIZE.companionconfig')
const BASE_RESTORE_PAGE = path.join(generatedDir, 'MIX_OUTPUT_ROUTING_MATERIALIZE_BASE_RESTORE.companionconfig')
const RESULT_PATH = path.join(resultsDir, 'LATEST_MIX_OUTPUT_ROUTING_MATERIALIZE.json')
const RELATIVE_RESULT = 'testbench\\results\\LATEST_MIX_OUTPUT_ROUTING_MATERIALIZE.json'
const NO_ACTIONABLE_EXIT = 8
const ALLOW_FLAG = '--allow-output-route-materialize'

function clonePlain(value) {
	return JSON.parse(JSON.stringify(value))
}

function pairedSourceNames(leftName, rightName) {
	const left = String(leftName || '').trim()
	const right = String(rightName || '').trim()
	const leftMix = /^(Mix\s+[A-F])\s+L$/i.exec(left)
	const rightMix = /^(Mix\s+[A-F])\s+R$/i.exec(right)
	if (leftMix || rightMix) return Boolean(leftMix && rightMix && leftMix[1].toLowerCase() === rightMix[1].toLowerCase())
	const leftNumbered = /^(.*?)(\d+)$/i.exec(left)
	const rightNumbered = /^(.*?)(\d+)$/i.exec(right)
	if (!leftNumbered || !rightNumbered) return false
	const leftChannel = Number(leftNumbered[2])
	const rightChannel = Number(rightNumbered[2])
	return (
		leftNumbered[1].trim().toLowerCase() === rightNumbered[1].trim().toLowerCase() &&
		leftChannel % 2 === 1 &&
		rightChannel === leftChannel + 1
	)
}

function outputAvailabilityMap(rows) {
	return new Map((rows || []).map((row) => [Number(row.output), String(row.availability || '')]))
}

function chooseOutputMaterializationPair({ profile, snapshot, outputEligibility, built, sourceNames = {} }) {
	const availability = outputAvailabilityMap(outputEligibility)
	const pairs = [...(profile?.outputPairs || [])].filter(([left, right]) => !(left === 0 && right === 1))
	pairs.sort((a, b) => {
		const aPreferred = a[0] === 2 && a[1] === 3 ? 0 : 1
		const bPreferred = b[0] === 2 && b[1] === 3 ? 0 : 1
		return aPreferred - bPreferred || a[0] - b[0]
	})
	for (const [left, right] of pairs) {
		const leftAvail = availability.get(left)
		const rightAvail = availability.get(right)
		if (['UNKNOWN', 'UNAVAILABLE'].includes(leftAvail) || ['UNKNOWN', 'UNAVAILABLE'].includes(rightAvail)) continue
		if (!['AVAILABLE', 'NO_FLAG'].includes(leftAvail) || !['AVAILABLE', 'NO_FLAG'].includes(rightAvail)) continue
		const leftSource = snapshot?.values?.[`output_${left + 1}_source`]
		const rightSource = snapshot?.values?.[`output_${right + 1}_source`]
		if (!leftSource?.exists || !rightSource?.exists) continue
		if (!String(leftSource.value ?? '').trim() || !String(rightSource.value ?? '').trim()) continue
		const batches = pairBatchIds(left, right)
		if (!built?.locations?.[batches.restore] || !built?.locations?.[batches.none]) continue
		const names = sourceNames[`${left}/${right}`] || { left: '', right: '' }
		return {
			left,
			right,
			label: `${left + 1}-${right + 1}`,
			leftOriginal: String(leftSource.value),
			rightOriginal: String(rightSource.value),
			leftSourceName: names.left || 'UNKNOWN',
			rightSourceName: names.right || 'UNKNOWN',
			pairNamedBaseline: pairedSourceNames(names.left, names.right),
			batches,
		}
	}
	return null
}

async function collectOutputSourceNames(baseUrl, label, profile) {
	const result = {}
	for (const [left, right] of profile?.outputPairs || []) {
		const [leftName, rightName] = await Promise.all([
			readVariableOptional(baseUrl, label, `output_${left + 1}_source_name`, 1800),
			readVariableOptional(baseUrl, label, `output_${right + 1}_source_name`, 1800),
		])
		result[`${left}/${right}`] = {
			left: leftName.exists ? String(leftName.value ?? '').trim() : '',
			right: rightName.exists ? String(rightName.value ?? '').trim() : '',
		}
	}
	return result
}

async function discoverMixALeftSource(baseUrl, label, shape) {
	const matches = new Map()
	for (const output of shape?.outputs || []) {
		const [source, name] = await Promise.all([
			readVariableOptional(baseUrl, label, `output_${output + 1}_source`, 1800),
			readVariableOptional(baseUrl, label, `output_${output + 1}_source_name`, 1800),
		])
		const sourceId = source.exists ? String(source.value ?? '').trim() : ''
		const sourceName = name.exists ? String(name.value ?? '').trim() : ''
		if (sourceId && sourceId !== '0' && /^Mix\s+A\s+L$/i.test(sourceName)) matches.set(sourceId, sourceName)
	}
	if (matches.size !== 1) return null
	const [[raw, name]] = [...matches.entries()]
	return { raw, name }
}

async function readOutputPair(baseUrl, label, pair) {
	const [leftSource, rightSource, leftName, rightName] = await Promise.all([
		readVariableOptional(baseUrl, label, `output_${pair.left + 1}_source`, 1800),
		readVariableOptional(baseUrl, label, `output_${pair.right + 1}_source`, 1800),
		readVariableOptional(baseUrl, label, `output_${pair.left + 1}_source_name`, 1800),
		readVariableOptional(baseUrl, label, `output_${pair.right + 1}_source_name`, 1800),
	])
	return {
		leftSource: leftSource.exists ? String(leftSource.value ?? '').trim() : null,
		rightSource: rightSource.exists ? String(rightSource.value ?? '').trim() : null,
		leftName: leftName.exists ? String(leftName.value ?? '').trim() : null,
		rightName: rightName.exists ? String(rightName.value ?? '').trim() : null,
	}
}

function outputPairBaselineMatches(observed, pair) {
	return observed.leftSource === pair.leftOriginal && observed.rightSource === pair.rightOriginal
}

function outputPairRoutedToMixA(observed, mixSource) {
	return (
		observed.leftSource === String(mixSource.raw) &&
		/^Mix\s+A\s+L$/i.test(String(observed.leftName || '')) &&
		Boolean(observed.rightSource && observed.rightSource !== '0') &&
		/^Mix\s+A\s+R$/i.test(String(observed.rightName || ''))
	)
}

async function waitOutputPair(baseUrl, label, pair, predicate, timeoutMs = 7500) {
	const deadline = Date.now() + timeoutMs
	let observed = await readOutputPair(baseUrl, label, pair)
	while (Date.now() < deadline) {
		if (predicate(observed)) return { ok: true, observed }
		await sleep(100)
		observed = await readOutputPair(baseUrl, label, pair)
	}
	return { ok: false, observed }
}

function buildOutputRouteHarness(baseBuilt, pair, mixSource) {
	const built = clonePlain(baseBuilt)
	const routeBatch = `mix-materialize-output-pair-${pair.left + 1}-${pair.right + 1}-mix-a`
	appendBatch(built, {
		id: routeBatch,
		label: `OUT ${pair.left + 1}-${pair.right + 1}\nMIX A MATERIALIZE`,
		specs: [
			{
				definitionId: 'output_pair_source',
				options: { output: String(pair.left), source: String(mixSource.raw) },
			},
		],
	})
	return { built, routeBatch }
}

function writePages(baseBuilt, materializeBuilt) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(TEMP_PAGE, `${JSON.stringify(materializeBuilt.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(BASE_RESTORE_PAGE, `${JSON.stringify(baseBuilt.file, null, '\t')}\n`, 'utf8')
	return { temporary: TEMP_PAGE, baseRestore: BASE_RESTORE_PAGE }
}

function writeReport(payload) {
	fs.mkdirSync(resultsDir, { recursive: true })
	fs.writeFileSync(
		RESULT_PATH,
		`${JSON.stringify(
			{
				schemaVersion: 1,
				reportClass: 'local-sanitized-mix-output-routing-materialize',
				updatedAt: nowIso(),
				...payload,
				privacy:
					'No serial, hostname, endpoint, client identity, raw source ID, raw XML, Companion connection ID or user path is stored.',
			},
			null,
			'\t',
		)}\n`,
		'utf8',
	)
}

async function freshExactCoverage(pair) {
	const fresh = await prepareLab(new Reporter())
	if (fresh.prep !== null || !fresh.ext || fresh.ext.pageNumber !== 2) {
		return { ok: false, left: 0, right: 0, reason: 'fresh post-route capability snapshot is not ready' }
	}
	return {
		ok: true,
		left: playbackExactLaneCount(fresh.snapshot, pair.left.slot),
		right: playbackExactLaneCount(fresh.snapshot, pair.right.slot),
	}
}

async function main() {
	if (!process.argv.includes(ALLOW_FLAG)) throw new Error(`REFUSED: missing explicit ${ALLOW_FLAG} permission.`)

	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 - MIX BASELINE OUTPUT-ROUTING MATERIALISATION')
	console.log('==================================================================')
	console.log('Fallback only: temporary output_pair_source route to Mix A, then exact pair restore.')
	console.log('Priority: Line Outputs 3-4 when AVAILABLE and exactly restorable; Monitor 1-2 is excluded by default.')
	console.log(
		'Only exact server-confirmed output source values are required for restoration; display names are diagnostic only.',
	)
	console.log('No mixer-slot source, Mix gain/Mute/Solo, raw, Monitor gain or direct TCP write.')
	console.log('Any unconfirmed output-source restore = HARD ABORT.')
	console.log('')

	const ctx = await prepareLab(new Reporter())
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		console.log('OUTPUT MATERIALIZE PREP_REQUIRED - exact current Capability Lab Page 2 required; no write attempted.')
		process.exitCode = 9
		return
	}

	const candidates = await collectPlaybackCandidates(ctx.baseUrl, ctx.label, ctx.snapshot)
	for (const candidate of sanitizedPlaybackCandidates(candidates)) {
		line('INFO', 'Playback candidate', `slot ${candidate.slot} :: ${candidate.name} :: ${candidate.topology}`)
	}
	let playback
	try {
		playback = chooseTopologyBootstrapPlayback(candidates, loadPriorPlaybackHint())
	} catch (error) {
		console.log(`OUTPUT MATERIALIZE SAFE STOP - Playback target unresolved: ${error.message}`)
		console.log('Hardware writes: 0')
		process.exitCode = NO_ACTIONABLE_EXIT
		return
	}

	const mixSource = await discoverMixALeftSource(ctx.baseUrl, ctx.label, ctx.snapshot.shape)
	if (!mixSource) {
		console.log(
			'OUTPUT MATERIALIZE SAFE STOP - no unique server-observed Mix A L source is available; no write attempted.',
		)
		process.exitCode = NO_ACTIONABLE_EXIT
		return
	}

	const sourceNames = await collectOutputSourceNames(ctx.baseUrl, ctx.label, ctx.profile)
	const outputPair = chooseOutputMaterializationPair({
		profile: ctx.profile,
		snapshot: ctx.snapshot,
		outputEligibility: ctx.outputEligibility,
		built: ctx.built,
		sourceNames,
	})
	if (!outputPair) {
		console.log(
			'OUTPUT MATERIALIZE SAFE STOP - no non-Monitor AVAILABLE output pair has exact source baselines and a V8 exact-restore path; no write attempted.',
		)
		process.exitCode = NO_ACTIONABLE_EXIT
		return
	}

	line(
		'PASS',
		'Output materialisation target',
		`outputs ${outputPair.label} :: baseline ${outputPair.leftSourceName} + ${outputPair.rightSourceName} :: temporary route Mix A`,
	)
	line(
		'INFO',
		'Output baseline labels',
		outputPair.pairNamedBaseline
			? 'display names also look pair-shaped'
			: 'display names are not used as a restore prerequisite',
	)
	line(
		'PASS',
		'Playback materialisation target',
		`slots ${playback.pair.left.slot}/${playback.pair.right.slot} :: ${playback.pair.left.name} + ${playback.pair.right.name}`,
	)

	const baseline = await readOutputPair(ctx.baseUrl, ctx.label, outputPair)
	if (!outputPairBaselineMatches(baseline, outputPair)) {
		console.log('OUTPUT MATERIALIZE SAFE STOP - output source baseline drifted before write; no write attempted.')
		process.exitCode = NO_ACTIONABLE_EXIT
		return
	}

	const baseBuilt = clonePlain(ctx.built)
	const routePlan = buildOutputRouteHarness(clonePlain(ctx.built), outputPair, mixSource)
	const files = writePages(baseBuilt, routePlan.built)
	let pageNumber
	let pageTouched = false
	let routeWriteAttempted = false
	let routeConfirmed = false
	let outputRestored = false
	let pageRestored = false
	let hardAbort = false
	let detail = ''

	try {
		const ext = await replacePage2FromFile({
			baseUrl: ctx.baseUrl,
			r9: ctx.r9,
			built: routePlan.built,
			filePath: files.temporary,
		})
		pageNumber = ext.pageNumber
		pageTouched = true
		line('PASS', 'Output materialisation Page 2', 'temporary guarded output-pair route button imported')

		routeWriteAttempted = true
		await pressBatch(ctx.baseUrl, pageNumber, { locations: routePlan.built.locations }, routePlan.routeBatch)
		const routed = await waitOutputPair(
			ctx.baseUrl,
			ctx.label,
			outputPair,
			(observed) => outputPairRoutedToMixA(observed, mixSource),
			7500,
		)
		routeConfirmed = routed.ok
		if (routeConfirmed) {
			line('PASS', 'Output pair temporary route', `outputs ${outputPair.label} server-confirmed on Mix A L/R`)
			await sleep(1800)
		} else {
			detail = `output_pair_source did not confirm Mix A L/R on outputs ${outputPair.label}`
			line('INFO', 'Output pair temporary route', detail)
		}
	} catch (error) {
		detail = `output materialisation action error: ${error.message}`
		line('FAIL', 'Output pair temporary route', detail)
	} finally {
		if (routeWriteAttempted) {
			const restored = await restoreExactPair({
				baseUrl: ctx.baseUrl,
				label: ctx.label,
				pageNumber,
				built: routePlan.built,
				batches: outputPair.batches,
				left: outputPair.left,
				right: outputPair.right,
				leftOriginal: outputPair.leftOriginal,
				rightOriginal: outputPair.rightOriginal,
			})
			outputRestored = restored.restored
			if (outputRestored) {
				line('PASS', 'Output pair exact restore', `outputs ${outputPair.label} original sources server-confirmed exact`)
			} else {
				hardAbort = true
				detail = `exact output ${outputPair.label} source restore not confirmed; safe-none-fallback=${restored.fallbackNoneConfirmed ? 'YES' : 'NO'}`
				line('FAIL', 'Output pair exact restore', detail)
			}
		} else {
			outputRestored = true
		}

		if (pageTouched) {
			try {
				await replacePage2FromFile({
					baseUrl: ctx.baseUrl,
					r9: ctx.r9,
					built: baseBuilt,
					filePath: files.baseRestore,
				})
				pageRestored = true
				line('PASS', 'Output materialisation Page 2 restore', 'fresh audited capability-lab page restored')
			} catch (error) {
				detail = `Page 2 restore failed: ${error.message}`
				line('FAIL', 'Output materialisation Page 2 restore', detail)
			}
		} else {
			pageRestored = true
		}
	}

	if (hardAbort || !outputRestored) {
		writeReport({
			playback: { leftSlot: playback.pair.left.slot, rightSlot: playback.pair.right.slot },
			outputPair: outputPair.label,
			routeConfirmed,
			outputRestored,
			pageRestored,
			exactBaselineLanesAfter: { left: 0, right: 0 },
			detail,
		})
		console.log(`Rapport local sanitise: ${RELATIVE_RESULT}`)
		process.exitCode = 4
		return
	}
	if (!pageRestored) {
		process.exitCode = 6
		return
	}

	const coverage = await freshExactCoverage(playback.pair)
	const exactAvailable = coverage.ok && Math.max(coverage.left, coverage.right) > 0
	line(
		exactAvailable ? 'PASS' : 'INFO',
		'Post-output-route Mix baseline',
		coverage.ok
			? `exact-baseline-lanes slot ${playback.pair.left.slot}=${coverage.left}, slot ${playback.pair.right.slot}=${coverage.right}`
			: coverage.reason,
	)
	writeReport({
		playback: { leftSlot: playback.pair.left.slot, rightSlot: playback.pair.right.slot },
		outputPair: outputPair.label,
		routeConfirmed,
		outputRestored,
		pageRestored,
		exactBaselineLanesAfter: { left: coverage.left, right: coverage.right },
		detail,
	})
	console.log(`Rapport local sanitise: ${RELATIVE_RESULT}`)

	process.exitCode = exactAvailable ? 0 : NO_ACTIONABLE_EXIT
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MIX OUTPUT ROUTING MATERIALIZE FATAL - ${error.message}`)
		console.error('No output-restore success is inferred from an unexpected exception.')
		process.exitCode = 2
	})
}

module.exports = {
	ALLOW_FLAG,
	pairedSourceNames,
	chooseOutputMaterializationPair,
	collectOutputSourceNames,
	discoverMixALeftSource,
	readOutputPair,
	outputPairBaselineMatches,
	outputPairRoutedToMixA,
	waitOutputPair,
	buildOutputRouteHarness,
	freshExactCoverage,
	main,
}
