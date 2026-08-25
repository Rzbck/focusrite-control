'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { generatedDir, resultsDir, nowIso, line, sleep } = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { appendBatch } = require('./MeterRoutingPage')
const { pressBatch } = require('./FullTestBenchV4Common')
const { replacePage2FromFile } = require('./MeterRoutingPageImport')
const {
	collectPlaybackCandidates,
	loadPriorPlaybackHint,
	chooseMixClosurePlayback,
	findPlaybackChannelPair,
	topologySpec,
	readTopologyPair,
	topologySourcesMatch,
	topologyStereoMatches,
	waitTopologyPair,
	playbackExactLaneCount,
} = require('./MixFeedbackClosureRunner')

const TEMP_PAGE = path.join(generatedDir, 'MIX_TOPOLOGY_MATERIALIZE.companionconfig')
const BASE_RESTORE_PAGE = path.join(generatedDir, 'MIX_TOPOLOGY_MATERIALIZE_BASE_RESTORE.companionconfig')
const RESULT_PATH = path.join(resultsDir, 'LATEST_MIX_TOPOLOGY_MATERIALIZE.json')
const RELATIVE_RESULT = 'testbench\\results\\LATEST_MIX_TOPOLOGY_MATERIALIZE.json'
const NO_ACTIONABLE_EXIT = 8
const ALLOW_FLAG = '--allow-topology-materialize'

function clonePlain(value) {
	return JSON.parse(JSON.stringify(value))
}

function usablePlaybackCandidates(candidates) {
	return (candidates || []).filter(
		(candidate) =>
			candidate &&
			candidate.raw &&
			String(candidate.raw) !== '0' &&
			/^Playback\s+\d+$/i.test(String(candidate.name || '').trim()) &&
			candidate.stereoKnown === true,
	)
}

function sanitizedPlaybackCandidates(candidates) {
	return (candidates || [])
		.filter((candidate) => candidate && /^Playback\s+\d+$/i.test(String(candidate.name || '').trim()))
		.map((candidate) => ({
			slot: Number(candidate.slot),
			name: String(candidate.name || '').trim(),
			topology: candidate.stereoKnown === true ? (candidate.stereo ? 'stereo' : 'mono') : 'unknown',
		}))
		.sort((a, b) => a.slot - b.slot)
}

function printPlaybackCandidates(candidates) {
	const safe = sanitizedPlaybackCandidates(candidates)
	if (!safe.length) {
		line('INFO', 'Playback candidates', 'none with a canonical Playback channel name')
		return
	}
	for (const candidate of safe) {
		line('INFO', 'Playback candidate', `slot ${candidate.slot} :: ${candidate.name} :: ${candidate.topology}`)
	}
}

function pairKey(pair) {
	return `${pair.left.name}@${pair.left.slot}/${pair.right.name}@${pair.right.slot}`
}

function chooseTopologyBootstrapPlayback(candidates, priorHint = null) {
	const usable = usablePlaybackCandidates(candidates)
	if (!usable.length) throw new Error('No server-confirmed Playback source/topology candidates are available.')

	if (priorHint) {
		const prior = usable.find(
			(candidate) =>
				Number(candidate.slot) === Number(priorHint.slot) && String(candidate.name) === String(priorHint.name),
		)
		if (prior && prior.stereo === false) {
			const pair = findPlaybackChannelPair({ ...prior, candidates: usable }, usable)
			if (pair && pair.left.stereo === false && pair.right.stereo === false) {
				return { playback: { ...prior, candidates: usable }, pair, selection: 'previous-topology-target' }
			}
		}
	}

	const playback1 = usable.filter((candidate) => /^Playback\s+1$/i.test(String(candidate.name || '').trim()))
	if (playback1.length === 1 && playback1[0].stereo === false) {
		const anchor = playback1[0]
		const pair = findPlaybackChannelPair({ ...anchor, candidates: usable }, usable)
		if (
			pair &&
			pair.left.stereo === false &&
			pair.right.stereo === false &&
			/^Playback\s+1$/i.test(String(pair.left.name || '').trim()) &&
			/^Playback\s+2$/i.test(String(pair.right.name || '').trim())
		) {
			return { playback: { ...anchor, candidates: usable }, pair, selection: 'campaign-playback1-runtime-anchor' }
		}
	}

	const pairs = new Map()
	for (const candidate of usable) {
		if (candidate.stereo) continue
		const pair = findPlaybackChannelPair({ ...candidate, candidates: usable }, usable)
		if (!pair || pair.left.stereo || pair.right.stereo) continue
		pairs.set(pairKey(pair), pair)
	}
	if (pairs.size !== 1) {
		throw new Error(
			pairs.size === 0
				? 'No unique confirmed-mono Playback channel pair is available for autonomous materialisation.'
				: `Ambiguous confirmed-mono Playback channel topology: ${[...pairs.keys()].join(', ')}. No write attempted.`,
		)
	}
	const pair = [...pairs.values()][0]
	return {
		playback: { ...pair.left, candidates: usable },
		pair,
		selection: 'unique-runtime-playback-channel-pair',
	}
}

function buildTopologyHarness(baseBuilt, pair) {
	const built = clonePlain(baseBuilt)
	const alternateBatch = `mix-materialize-slots-${pair.left.slot}-${pair.right.slot}-stereo-on`
	const restoreBatch = `mix-materialize-slots-${pair.left.slot}-${pair.right.slot}-restore-mono`
	appendBatch(built, {
		id: alternateBatch,
		label: `PLAYBACK ${pair.left.slot}-${pair.right.slot}\nMATERIALIZE STEREO`,
		specs: [topologySpec(pair.left.slot, 'on'), topologySpec(pair.right.slot, 'on')],
	})
	appendBatch(built, {
		id: restoreBatch,
		label: `PLAYBACK ${pair.left.slot}-${pair.right.slot}\nRESTORE MONO`,
		specs: [topologySpec(pair.left.slot, 'off'), topologySpec(pair.right.slot, 'off')],
	})
	return { built, alternateBatch, restoreBatch }
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
				reportClass: 'local-sanitized-mix-topology-materialize',
				updatedAt: nowIso(),
				...payload,
				privacy:
					'No serial, hostname, Control Server endpoint, client identity, raw source ID, raw XML, Companion connection ID or user path is stored.',
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
		return { ok: false, left: 0, right: 0, reason: 'fresh post-restore capability snapshot is not ready' }
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
	console.log(' FOCUSRITE 18i20 - MIX TOPOLOGY MATERIALISATION BOOTSTRAP')
	console.log('==================================================================')
	console.log('Purpose: recover server-confirmed Mix baselines without manual Mute/Solo clicks.')
	console.log('Writes: exactly two guarded mixer_slot_stereo ON actions plus exact two-action mono restore.')
	console.log('Playback channel pairing is resolved by runtime source names; mixer-slot adjacency is not assumed.')
	console.log('No Mix gain/Mute/Solo, Mixer Slot Source, output routing, raw, Monitor gain or direct TCP write.')
	console.log('Any unconfirmed topology/source restore = HARD ABORT.')
	console.log('')

	const ctx = await prepareLab(new Reporter())
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		console.log('MATERIALIZE PREP_REQUIRED - exact current Capability Lab Page 2 is required; no write attempted.')
		process.exitCode = 9
		return
	}

	const candidates = await collectPlaybackCandidates(ctx.baseUrl, ctx.label, ctx.snapshot)
	printPlaybackCandidates(candidates)
	const priorHint = loadPriorPlaybackHint()
	try {
		const already = chooseMixClosurePlayback(candidates, ctx.snapshot, priorHint)
		line(
			'PASS',
			'Mix baseline already exact',
			`slot ${already.slot} ${already.name} exact-baseline-lanes=${already.exactBaselineLanes}; topology bootstrap not needed`,
		)
		process.exitCode = 0
		return
	} catch (error) {
		if (!/none has an exact materialised Mix gain\/mute\/solo baseline/i.test(error.message)) {
			console.log(`MATERIALIZE SAFE STOP - ${error.message}`)
			console.log('Hardware writes: 0')
			process.exitCode = NO_ACTIONABLE_EXIT
			return
		}
	}

	let selected
	try {
		selected = chooseTopologyBootstrapPlayback(candidates, priorHint)
	} catch (error) {
		console.log(`MATERIALIZE SAFE STOP - ${error.message}`)
		console.log('Hardware writes: 0')
		process.exitCode = NO_ACTIONABLE_EXIT
		return
	}

	const playback = selected.playback
	const pair = selected.pair
	const plan = {
		pair,
		...buildTopologyHarness(ctx.built, pair),
	}
	const baseBuilt = clonePlain(ctx.built)
	const files = writePages(baseBuilt, plan.built)
	const baseline = await readTopologyPair(ctx.baseUrl, ctx.label, plan)
	if (!topologyStereoMatches(baseline, { left: 'false', right: 'false' }) || !topologySourcesMatch(baseline, plan)) {
		console.log('MATERIALIZE SAFE STOP - topology/source baseline drifted before write; no write attempted.')
		process.exitCode = NO_ACTIONABLE_EXIT
		return
	}

	line(
		'PASS',
		'Materialisation target',
		`slots ${pair.left.slot}/${pair.right.slot} :: ${pair.left.name} + ${pair.right.name} :: ${selected.selection}`,
	)

	let transitionConfirmed = false
	let sourcesStable = true
	let topologyRestored = false
	let pageRestored = false
	let pageNumber
	let topologyWriteAttempted = false
	let pageTouched = false
	let hardAbort = false
	let detail = ''

	try {
		const ext = await replacePage2FromFile({
			baseUrl: ctx.baseUrl,
			r9: ctx.r9,
			built: plan.built,
			filePath: files.temporary,
		})
		pageNumber = ext.pageNumber
		pageTouched = true
		line('PASS', 'Materialisation Page 2', 'temporary guarded topology page imported')

		topologyWriteAttempted = true
		await pressBatch(ctx.baseUrl, pageNumber, { locations: plan.built.locations }, plan.alternateBatch)
		const transition = await waitTopologyPair(ctx.baseUrl, ctx.label, plan, { left: 'true', right: 'true' }, 7000)
		transitionConfirmed = transition.ok
		sourcesStable = topologySourcesMatch(transition.observed, plan)
		if (transitionConfirmed && sourcesStable) {
			line('PASS', 'Materialisation topology', 'server-confirmed mono -> stereo; sources unchanged')
			await sleep(1500)
		} else if (!transitionConfirmed) {
			detail = `paired stereo action produced no confirmed true/true transition; observed=${transition.observed.left.stereo ?? 'unknown'}/${transition.observed.right.stereo ?? 'unknown'}`
			line('INFO', 'Materialisation topology', detail)
		} else {
			detail = 'stereo flags transitioned but Playback source/name changed as collateral'
			line('FAIL', 'Materialisation topology collateral', detail)
		}
	} catch (error) {
		detail = `materialisation action error: ${error.message}`
		line('FAIL', 'Materialisation topology', detail)
	} finally {
		if (topologyWriteAttempted) {
			try {
				await pressBatch(ctx.baseUrl, pageNumber, { locations: plan.built.locations }, plan.restoreBatch)
				const restored = await waitTopologyPair(ctx.baseUrl, ctx.label, plan, { left: 'false', right: 'false' }, 9000)
				topologyRestored = restored.ok && topologySourcesMatch(restored.observed, plan)
				if (topologyRestored) {
					line('PASS', 'Materialisation topology restore', 'original mono flags and Playback sources exact')
				} else {
					hardAbort = true
					line('FAIL', 'Materialisation topology restore', 'exact original topology/source state not confirmed')
				}
			} catch (error) {
				hardAbort = true
				detail = `topology restore action failed: ${error.message}`
				line('FAIL', 'Materialisation topology restore', detail)
			}
		} else {
			topologyRestored = true
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
				line('PASS', 'Materialisation Page 2 restore', 'fresh audited capability-lab page restored')
			} catch (error) {
				detail = `Page 2 restore failed: ${error.message}`
				line('FAIL', 'Materialisation Page 2 restore', detail)
			}
		} else {
			pageRestored = true
		}
	}

	if (hardAbort || !topologyRestored) {
		writeReport({
			playback: { slot: playback.slot, name: playback.name },
			pair: { leftSlot: pair.left.slot, rightSlot: pair.right.slot },
			transitionConfirmed,
			sourcesStable,
			topologyRestored,
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

	const coverage = await freshExactCoverage(pair)
	const exactAvailable = coverage.ok && Math.max(coverage.left, coverage.right) > 0
	line(
		exactAvailable ? 'PASS' : 'INFO',
		'Post-materialisation Mix baseline',
		coverage.ok
			? `exact-baseline-lanes slot ${pair.left.slot}=${coverage.left}, slot ${pair.right.slot}=${coverage.right}`
			: coverage.reason,
	)
	writeReport({
		playback: { slot: playback.slot, name: playback.name },
		pair: { leftSlot: pair.left.slot, rightSlot: pair.right.slot },
		transitionConfirmed,
		sourcesStable,
		topologyRestored,
		pageRestored,
		exactBaselineLanesAfter: { left: coverage.left, right: coverage.right },
		detail,
	})
	console.log(`Rapport local sanitise: ${RELATIVE_RESULT}`)

	if (!sourcesStable) process.exitCode = 2
	else if (!exactAvailable) process.exitCode = NO_ACTIONABLE_EXIT
	else process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MIX TOPOLOGY MATERIALIZE FATAL - ${error.message}`)
		console.error('No hardware-restore success is inferred from an unexpected exception.')
		process.exitCode = 2
	})
}

module.exports = {
	ALLOW_FLAG,
	usablePlaybackCandidates,
	sanitizedPlaybackCandidates,
	printPlaybackCandidates,
	chooseTopologyBootstrapPlayback,
	buildTopologyHarness,
	freshExactCoverage,
	main,
}
