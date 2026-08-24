'use strict'

const fs = require('node:fs')
const path = require('node:path')
const {
	EXPECTED_MODULE,
	EXPECTED_MODULE_VERSION,
	generatedDir,
	resultsDir,
	nowIso,
	line,
	sleep,
	get,
	exportButtons,
	collectActions,
	resolveLiveConnection,
	canonicalBool,
	readVariableOptional,
} = require('./FullTestBenchBase')
const { Reporter } = require('./FullTestBenchCorePhases')
const { prepareLab, countPageControls } = require('./FullTestBenchRunnerV4Preflight')
const { detectPlaybackSource } = require('./MeterRoutingClosure')
const { actionBoolState } = require('./MeterMixPlaybackPage')
const { appendBatch } = require('./MeterRoutingPage')
const { replacePage2FromFile } = require('./MeterRoutingPageImport')
const {
	ALLOW_FLAG,
	ISOLATION_FLAG,
	NO_ACTIONABLE_EXIT,
	mixSpec,
	augmentMixFeedbackHarness,
	findFeedbackProbe,
	waitFeedbackValue,
	prepareTargets,
	runTarget,
} = require('./MixFeedbackClosure')
const { PREP_REQUIRED_EXIT } = require('./MixFeedbackPreparationCheck')

const TEMP_PAGE = path.join(generatedDir, 'MIX_FEEDBACK_EXTENDED.companionconfig')
const BASE_RESTORE_PAGE = path.join(generatedDir, 'MIX_FEEDBACK_BASE_RESTORE.companionconfig')
const RESULT_PATH = path.join(resultsDir, 'LATEST_MIX_FEEDBACK_CLOSURE.json')
const RELATIVE_RESULT = 'testbench\\results\\LATEST_MIX_FEEDBACK_CLOSURE.json'

function clonePlain(value) {
	return JSON.parse(JSON.stringify(value))
}

function writePages(baseBuilt, augmentedBuilt) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(TEMP_PAGE, `${JSON.stringify(augmentedBuilt.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(BASE_RESTORE_PAGE, `${JSON.stringify(baseBuilt.file, null, '\t')}\n`, 'utf8')
	return { temporary: TEMP_PAGE, baseRestore: BASE_RESTORE_PAGE }
}

function writeReport({
	model,
	playback,
	results,
	hardwareWrites,
	hardwareRestored,
	pageTouched,
	pageRestored,
	hardAbort,
}) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = {
		schemaVersion: 1,
		reportClass: 'local-sanitized-mix-feedback-closure',
		updatedAt: nowIso(),
		model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		writeScope: 'existing-playback-slot-mute-solo-only',
		playback: { slot: playback.slot, name: playback.name, stereo: playback.stereo },
		hardwareWrites,
		hardwareRestored,
		page2MutationAttempted: pageTouched,
		page2BaseRestored: pageRestored,
		hardAbort,
		dynamicClosed: results.filter((item) => item.status === 'HARDWARE_DYNAMIC_CLOSED').length,
		skippedBaselineUnknown: results.filter((item) => item.status === 'SKIP_BASELINE_UNKNOWN').length,
		skippedBaselineDrift: results.filter((item) => item.status === 'SKIP_BASELINE_DRIFT').length,
		fail: results.filter((item) => item.status.startsWith('FAIL')).length,
		quarantinedRestore: results.filter((item) => item.status === 'QUARANTINED_RESTORE').length,
		results,
		privacy:
			'No serial, hostname, Control Server endpoint, client identity, raw source ID, raw XML, Companion connection ID or user path is stored.',
	}
	fs.writeFileSync(RESULT_PATH, `${JSON.stringify(payload, null, '\t')}\n`, 'utf8')
	return payload
}

function prepRequired(ctx, detail) {
	const page2 = ctx?.page2State
	console.log(`PREP_REQUIRED - ${detail}`)
	if (page2) {
		console.log(
			`Page 2 identity: ${page2.classification}; controls=${page2.controlCount}; known-TestBench-replacement-candidate=${page2.safeReplacementCandidate ? 'YES' : 'NO'}`,
		)
	}
	console.log('Hardware writes: 0')
	console.log('Page 2 mutations: 0')
	console.log('Hardware restore required: NO')
	process.exitCode = PREP_REQUIRED_EXIT
}

function auditCompatibleStaleBasePage({ exported, built, connections, r9, page2State }) {
	if (
		page2State?.classification !== 'STALE_FOCUSRITE_TESTBENCH_HARNESS' ||
		page2State?.safeReplacementCandidate !== true ||
		!built ||
		!r9?.connection
	) {
		return null
	}

	const page = exported?.pages?.['2']
	if (!page) return null
	if (countPageControls(page) !== built.batches.length) return null
	if (Object.keys(built.locations || {}).length !== built.batches.length) return null

	const refs = new Set()
	for (const expected of Object.values(built.locations || {})) {
		const control = page.controls?.[String(expected.row)]?.[String(expected.column)]
		if (!control) return null
		const allActions = collectActions(control)
		const down = control.steps?.['0']?.action_sets?.down
		if (
			!Array.isArray(down) ||
			down.length !== expected.actions.length ||
			allActions.length !== expected.actions.length
		) {
			return null
		}
		for (let i = 0; i < down.length; i++) {
			const actual = down[i]
			const wanted = expected.actions[i]
			if (actual?.definitionId !== wanted?.definitionId || !actual?.connectionId) return null
			refs.add(actual.connectionId)
		}
	}
	if (refs.size !== 1) return null

	const instance = exported.instances?.[[...refs][0]]
	if (
		!instance ||
		instance.moduleId !== EXPECTED_MODULE ||
		String(instance.moduleVersionId || '') !== EXPECTED_MODULE_VERSION
	) {
		return null
	}

	let connection
	try {
		connection = resolveLiveConnection(connections, instance)
	} catch {
		return null
	}
	if (
		connection.id !== r9.connection.id &&
		String(connection.label || '').trim() !== String(r9.connection.label || '').trim()
	) {
		return null
	}

	return { pageNumber: 2, connection }
}

async function acceptCompatibleSnapshotDrift(ctx) {
	if (ctx.prep !== 'harness') return null
	const exported = await exportButtons(ctx.baseUrl)
	const connectionsPayload = JSON.parse(await get(ctx.baseUrl, '/api/connections'))
	const connections = Array.isArray(connectionsPayload) ? connectionsPayload : connectionsPayload.connections || []
	return auditCompatibleStaleBasePage({
		exported,
		built: ctx.built,
		connections,
		r9: ctx.r9,
		page2State: ctx.page2State,
	})
}

function pairKey(mix, property) {
	return `${mix}/${property}`
}

function buildStereoPairTargets({ built, lanes, r9, playback }) {
	if (!playback?.stereo) return { targets: [], pairedKeys: new Set() }
	const grouped = new Map()
	for (const entry of lanes || []) {
		if (entry.status !== 'READY') continue
		const current = grouped.get(entry.lane.mix) || {}
		current[entry.lane.side] = entry
		grouped.set(entry.lane.mix, current)
	}

	const targets = []
	const pairedKeys = new Set()
	for (const [mix, pair] of grouped) {
		const left = pair.left
		const right = pair.right
		if (!left || !right || left.slot !== right.slot) continue
		for (const property of ['mute', 'solo']) {
			const baseline = left.baseline[property]
			if (baseline !== right.baseline[property] || !['true', 'false'].includes(String(baseline))) continue
			const alternate = baseline === 'true' ? 'false' : 'true'
			const definitionId = `mix_${property}`
			const id = `mix-feedback-pair-${String(mix).replace(/\s+/g, '').toLowerCase()}-slot-${left.slot}-${property}`
			const alternateBatch = `${id}-alt`
			const restoreBatch = `${id}-restore`
			const actionLane = { mix, side: 'both' }
			appendBatch(built, {
				id: alternateBatch,
				label: `${mix} pair\nS${left.slot} ${property.toUpperCase()} ${alternate}`,
				specs: [mixSpec(definitionId, actionLane, left.slot, alternate)],
			})
			appendBatch(built, {
				id: restoreBatch,
				label: `${mix} pair\nS${left.slot} ${property.toUpperCase()} RESTORE`,
				specs: [mixSpec(definitionId, actionLane, left.slot, baseline)],
			})
			targets.push({
				mix,
				slot: left.slot,
				property,
				definitionId,
				baseline,
				alternate,
				alternateBatch,
				restoreBatch,
				left: {
					lane: left.lane,
					variable: left.baseline.variables[property],
					probe: findFeedbackProbe(r9, definitionId, left.lane, left.slot),
				},
				right: {
					lane: right.lane,
					variable: right.baseline.variables[property],
					probe: findFeedbackProbe(r9, definitionId, right.lane, right.slot),
				},
			})
			pairedKeys.add(pairKey(mix, property))
		}
	}
	return { targets, pairedKeys }
}

async function readPairVariables(baseUrl, label, target) {
	const [leftItem, rightItem] = await Promise.all([
		readVariableOptional(baseUrl, label, target.left.variable, 1800),
		readVariableOptional(baseUrl, label, target.right.variable, 1800),
	])
	return {
		left: leftItem.exists ? canonicalBool(leftItem.value) : null,
		right: rightItem.exists ? canonicalBool(rightItem.value) : null,
	}
}

async function waitPairVariables(baseUrl, label, target, expected, timeoutMs = 7000) {
	const deadline = Date.now() + timeoutMs
	let observed = { left: null, right: null }
	while (Date.now() < deadline) {
		observed = await readPairVariables(baseUrl, label, target)
		if (observed.left === expected && observed.right === expected) return { ok: true, ...observed }
		await sleep(100)
	}
	return { ok: false, ...observed }
}

async function waitPairFeedbacks(baseUrl, pageNumber, target, expected, timeoutMs = 3000) {
	const [left, right] = await Promise.all([
		waitFeedbackValue(baseUrl, pageNumber, target.left.probe, expected, timeoutMs),
		waitFeedbackValue(baseUrl, pageNumber, target.right.probe, expected, timeoutMs),
	])
	return { ok: left.ok && right.ok, left, right }
}

function pairResult(target, side, status, detail) {
	return {
		lane: `${target.mix} ${side}`,
		slot: target.slot,
		property: target.property,
		definitionId: target.definitionId,
		status,
		detail,
		stereoPairAction: true,
	}
}

async function runStereoPairTarget({ baseUrl, label, pageNumber, r9PageNumber, locations, target, activeChanges }) {
	const before = await waitPairVariables(baseUrl, label, target, target.baseline, 2200)
	if (!before.ok) {
		return {
			results: [
				pairResult(
					target,
					'left',
					'SKIP_BASELINE_DRIFT',
					`Stereo-pair baseline drift; expected=${target.baseline}/${target.baseline} observed=${before.left ?? 'unknown'}/${before.right ?? 'unknown'}. No write attempted.`,
				),
				pairResult(
					target,
					'right',
					'SKIP_BASELINE_DRIFT',
					`Stereo-pair baseline drift; expected=${target.baseline}/${target.baseline} observed=${before.left ?? 'unknown'}/${before.right ?? 'unknown'}. No write attempted.`,
				),
			],
			writeAttempted: false,
			hardAbort: false,
		}
	}
	const beforeFeedback = await waitPairFeedbacks(baseUrl, r9PageNumber, target, target.baseline, 2200)
	if (!beforeFeedback.ok) {
		return {
			results: [
				pairResult(
					target,
					'left',
					beforeFeedback.left.ok ? 'SKIP_PAIR_PRECHECK_BLOCKED' : 'FAIL_INITIAL_FEEDBACK',
					`Stereo-pair preflight feedback ${beforeFeedback.left.ok ? 'matched' : 'did not match'} on left; no write attempted because both sides must be independently confirmed.`,
				),
				pairResult(
					target,
					'right',
					beforeFeedback.right.ok ? 'SKIP_PAIR_PRECHECK_BLOCKED' : 'FAIL_INITIAL_FEEDBACK',
					`Stereo-pair preflight feedback ${beforeFeedback.right.ok ? 'matched' : 'did not match'} on right; no write attempted because both sides must be independently confirmed.`,
				),
			],
			writeAttempted: false,
			hardAbort: false,
		}
	}

	const token = `${target.mix}/both/slot${target.slot}/${target.property}`
	activeChanges.add(token)
	let writeAttempted = false
	let actionError = ''
	let transitionVariables = { ok: false, left: null, right: null }
	let transitionFeedback = { ok: false, left: { ok: false }, right: { ok: false } }
	let restoreVariables = { ok: false, left: null, right: null }
	let restoreFeedback = { ok: false, left: { ok: false }, right: { ok: false } }
	let restoreActionError = ''

	try {
		writeAttempted = true
		await pressBatch(baseUrl, pageNumber, { locations }, target.alternateBatch)
		transitionVariables = await waitPairVariables(baseUrl, label, target, target.alternate, 7000)
		transitionFeedback = await waitPairFeedbacks(baseUrl, r9PageNumber, target, target.alternate, 3000)
	} catch (error) {
		actionError = error.message
	} finally {
		if (writeAttempted) {
			try {
				await pressBatch(baseUrl, pageNumber, { locations }, target.restoreBatch)
				restoreVariables = await waitPairVariables(baseUrl, label, target, target.baseline, 9000)
				restoreFeedback = await waitPairFeedbacks(baseUrl, r9PageNumber, target, target.baseline, 3000)
				if (restoreVariables.ok) activeChanges.delete(token)
			} catch (error) {
				restoreActionError = error.message
			}
		} else {
			activeChanges.delete(token)
		}
	}

	if (!restoreVariables.ok || restoreActionError) {
		const detail = restoreActionError
			? `Stereo-pair restore action failed: ${restoreActionError}`
			: `Stereo-pair restore not confirmed; expected=${target.baseline}/${target.baseline} observed=${restoreVariables.left ?? 'unknown'}/${restoreVariables.right ?? 'unknown'}.`
		return {
			results: [
				pairResult(target, 'left', 'QUARANTINED_RESTORE', detail),
				pairResult(target, 'right', 'QUARANTINED_RESTORE', detail),
			],
			writeAttempted,
			hardAbort: true,
		}
	}

	const results = []
	for (const side of ['left', 'right']) {
		const transitionVariableOk = transitionVariables[side] === target.alternate
		const transitionFeedbackOk = Boolean(transitionFeedback[side]?.ok)
		const restoreFeedbackOk = Boolean(restoreFeedback[side]?.ok)
		if (!restoreFeedbackOk) {
			results.push(
				pairResult(
					target,
					side,
					'FAIL_RESTORED_FEEDBACK',
					`Stereo-pair hardware baseline restored, but ${side} rendered feedback did not return to ${target.baseline}.`,
				),
			)
			continue
		}
		if (actionError || !transitionVariableOk || !transitionFeedbackOk) {
			const observed = transitionVariables[side] ?? 'unknown'
			results.push(
				pairResult(
					target,
					side,
					'FAIL_TRANSITION_FEEDBACK',
					`Stereo side=both transition not confirmed on ${side}: expected=${target.alternate}, server=${observed}, feedback=${transitionFeedbackOk ? 'MATCH' : 'NO_MATCH'}${actionError ? `; action=${actionError}` : ''}. Exact pair baseline restored.`,
				),
			)
			continue
		}
		results.push(
			pairResult(
				target,
				side,
				'HARDWARE_DYNAMIC_CLOSED',
				`Stereo side=both action + server variable + rendered feedback confirmed at ${target.baseline} -> ${target.alternate} -> ${target.baseline}; exact pair restore confirmed.`,
			),
		)
	}
	return { results, writeAttempted, hardAbort: false }
}

async function main() {
	if (!process.argv.includes(ALLOW_FLAG)) throw new Error(`REFUSED: missing explicit ${ALLOW_FLAG} permission.`)
	if (!process.argv.includes(ISOLATION_FLAG)) throw new Error(`REFUSED: missing explicit ${ISOLATION_FLAG} permission.`)

	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 - MIX MUTE/SOLO FEEDBACK EXACT RESTORE')
	console.log('==================================================================')
	console.log('Scope: existing Playback slot only, runtime baseline required per lane.')
	console.log('Writes: mix_mute + mix_solo only. No mix gain, no output routing, no mixer-slot assignment.')
	console.log('Stereo Playback: exact L/R pairs with equal baselines are exercised via side=both and verified per member.')
	console.log('Unknown baseline = SKIP / NO WRITE. Hardware restore failure = HARD ABORT.')
	console.log('No FULL, no direct Control Server client, no raw write, no package install.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		prepRequired(ctx, 'required mixer variables are not currently exposed by Companion.')
		return
	}

	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		const compatibleExt = await acceptCompatibleSnapshotDrift(ctx)
		if (!compatibleExt) {
			prepRequired(ctx, 'the exact current V8 capability-lab harness is not on Companion Page 2.')
			return
		}
		ctx.ext = compatibleExt
		ctx.prep = null
		line(
			'PASS',
			'Capability Lab Page 2 compatibility',
			'trusted V8 structure + exact Focusrite module/connection; snapshot-signature drift only',
		)
	}

	const playback = await detectPlaybackSource(ctx.baseUrl, ctx.label, ctx.snapshot)
	line(
		'PASS',
		'Playback source',
		`existing mixer slot ${playback.slot} :: ${playback.name}${playback.stereo ? ' / stereo' : ''}`,
	)

	const baseBuilt = clonePlain(ctx.built)
	const augmented = augmentMixFeedbackHarness(clonePlain(ctx.built), ctx.snapshot, playback.slot)
	const readyLanes = augmented.lanes.filter((entry) => entry.status === 'READY')
	line('INFO', 'Exact-baseline lanes', `${readyLanes.length}/${augmented.lanes.length}`)

	const prepared = await prepareTargets({ baseUrl: ctx.baseUrl, label: ctx.label, r9: ctx.r9, lanes: augmented.lanes })
	for (const item of prepared.results) {
		line(item.status.startsWith('FAIL') ? 'FAIL' : 'SKIP', `${item.lane} ${item.property}`, item.detail)
	}

	const pairPlan = buildStereoPairTargets({ built: augmented.built, lanes: augmented.lanes, r9: ctx.r9, playback })
	const directRunnable = prepared.runnable.filter(
		(target) => !pairPlan.pairedKeys.has(pairKey(target.lane.mix, target.property)),
	)
	line('INFO', 'Stereo-pair feedback operations', String(pairPlan.targets.length))
	line('INFO', 'Direct feedback targets', String(directRunnable.length))
	line('INFO', 'No-write skipped/failed preflight targets', String(prepared.results.length))

	const results = [...prepared.results]
	if (!directRunnable.length && !pairPlan.targets.length) {
		const payload = writeReport({
			model: ctx.model,
			playback,
			results,
			hardwareWrites: false,
			hardwareRestored: true,
			pageTouched: false,
			pageRestored: true,
			hardAbort: false,
		})
		console.log('')
		console.log(`Rapport local sanitise: ${RELATIVE_RESULT}`)
		console.log(
			`SUMMARY: DYNAMIC_CLOSED ${payload.dynamicClosed} / SKIP_BASELINE_UNKNOWN ${payload.skippedBaselineUnknown} / FAIL ${payload.fail} / RESTORE_QUARANTINE ${payload.quarantinedRestore}`,
		)
		if (payload.fail > 0) {
			console.log(
				'MIX FEEDBACK PREFLIGHT FAIL - aucun write hardware, mais un feedback connu ne correspond pas a son oracle.',
			)
			process.exitCode = 2
		} else {
			console.log('MIX FEEDBACK NO-OP SAFE - aucun feedback mute/solo ne dispose d une baseline exacte exploitable.')
			process.exitCode = NO_ACTIONABLE_EXIT
		}
		return
	}

	const files = writePages(baseBuilt, augmented.built)
	const activeChanges = new Set()
	let hardwareWrites = false
	let hardAbort = false
	let pageTouched = false
	let pageRestored = false
	let pageInstallAttempted = false
	let pageNumber
	let campaignError = null

	try {
		pageInstallAttempted = true
		pageTouched = true
		const ext = await replacePage2FromFile({
			baseUrl: ctx.baseUrl,
			r9: ctx.r9,
			built: augmented.built,
			filePath: files.temporary,
		})
		pageNumber = ext.pageNumber
		line('PASS', 'Temporary Mix feedback Page 2', 'imported; Page 1 and existing Focusrite connection preserved')

		for (const target of directRunnable) {
			const outcome = await runTarget({
				baseUrl: ctx.baseUrl,
				label: ctx.label,
				pageNumber,
				r9PageNumber: ctx.r9.pageNumber,
				locations: augmented.built.locations,
				target,
				activeChanges,
			})
			if (outcome.writeAttempted) hardwareWrites = true
			results.push(outcome.result)
			line(
				outcome.result.status === 'HARDWARE_DYNAMIC_CLOSED' ? 'PASS' : 'FAIL',
				`${outcome.result.lane} ${outcome.result.property}`,
				outcome.result.detail,
			)
			if (outcome.hardAbort) {
				hardAbort = true
				break
			}
			await sleep(120)
		}

		if (!hardAbort) {
			for (const target of pairPlan.targets) {
				const outcome = await runStereoPairTarget({
					baseUrl: ctx.baseUrl,
					label: ctx.label,
					pageNumber,
					r9PageNumber: ctx.r9.pageNumber,
					locations: augmented.built.locations,
					target,
					activeChanges,
				})
				if (outcome.writeAttempted) hardwareWrites = true
				for (const result of outcome.results) {
					results.push(result)
					line(
						result.status === 'HARDWARE_DYNAMIC_CLOSED' ? 'PASS' : result.status.startsWith('SKIP') ? 'SKIP' : 'FAIL',
						`${result.lane} ${result.property}`,
						result.detail,
					)
				}
				if (outcome.hardAbort) {
					hardAbort = true
					break
				}
				await sleep(120)
			}
		}
	} catch (error) {
		campaignError = error
	} finally {
		if (pageInstallAttempted) {
			try {
				await replacePage2FromFile({
					baseUrl: ctx.baseUrl,
					r9: ctx.r9,
					built: baseBuilt,
					filePath: files.baseRestore,
				})
				pageRestored = true
				line('PASS', 'Companion Page 2 restore', 'fresh audited capability-lab page restored')
			} catch (error) {
				line('FAIL', 'Companion Page 2 restore', error.message)
				campaignError = campaignError || error
			}
		}
	}

	const hardwareRestored = activeChanges.size === 0
	if (!hardwareRestored) hardAbort = true
	const payload = writeReport({
		model: ctx.model,
		playback,
		results,
		hardwareWrites,
		hardwareRestored,
		pageTouched,
		pageRestored,
		hardAbort,
	})

	console.log('')
	console.log('==================================================================')
	console.log(
		`SUMMARY: DYNAMIC_CLOSED ${payload.dynamicClosed} / SKIP_BASELINE_UNKNOWN ${payload.skippedBaselineUnknown} / SKIP_BASELINE_DRIFT ${payload.skippedBaselineDrift} / FAIL ${payload.fail} / RESTORE_QUARANTINE ${payload.quarantinedRestore}`,
	)
	console.log(`Hardware restore confirme: ${hardwareRestored ? 'YES' : 'NO'}`)
	console.log(`Companion Page 2 base restauree: ${pageRestored ? 'YES' : 'NO'}`)
	console.log(`Rapport local sanitise: ${RELATIVE_RESULT}`)
	if (campaignError) console.log(`Campaign error: ${campaignError.message}`)
	console.log('==================================================================')

	if (hardAbort || !hardwareRestored) process.exitCode = 4
	else if (!pageRestored) process.exitCode = 6
	else if (campaignError || payload.fail > 0) process.exitCode = 2
	else process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`MIX FEEDBACK FATAL - ${error.message}`)
		console.error('No hardware-restore failure is inferred from an unexpected pre-write exception.')
		process.exitCode = 2
	})
}

module.exports = {
	PREP_REQUIRED_EXIT,
	prepRequired,
	auditCompatibleStaleBasePage,
	acceptCompatibleSnapshotDrift,
	pairKey,
	buildStereoPairTargets,
	readPairVariables,
	waitPairVariables,
	waitPairFeedbacks,
	runStereoPairTarget,
	writePages,
	writeReport,
	main,
}
