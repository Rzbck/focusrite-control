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
const { playbackSlotBaseline } = require('./MeterMixPlaybackPage')
const { laneBase } = require('./FullTestBenchAudit')
const { appendBatch } = require('./MeterRoutingPage')
const { pressBatch } = require('./FullTestBenchV4Common')
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
	topology = null,
}) {
	fs.mkdirSync(resultsDir, { recursive: true })
	const payload = {
		schemaVersion: 2,
		reportClass: 'local-sanitized-mix-feedback-closure',
		updatedAt: nowIso(),
		model,
		moduleVersion: EXPECTED_MODULE_VERSION,
		writeScope: 'mix-mute-solo-plus-guarded-mixer-slot-stereo-topology',
		playback: {
			slot: playback.slot,
			name: playback.name,
			stereo: playback.stereo,
			selection: playback.selection,
			exactBaselineLanes: playback.exactBaselineLanes,
		},
		topology: topology
			? {
					attempted: Boolean(topology.attempted),
					transitionConfirmed: Boolean(topology.transitionConfirmed),
					sourcesStableDuringTransition: topology.sourcesStableDuringTransition !== false,
					restored: topology.restored !== false,
					stereoPairTargets: Number(topology.stereoPairTargets || 0),
					detail: String(topology.detail || ''),
				}
			: null,
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

function playbackExactLaneCount(snapshot, slot) {
	let count = 0
	for (const lane of snapshot?.shape?.lanes || []) {
		if (playbackSlotBaseline(snapshot, lane, slot)) count++
	}
	return count
}

function loadPriorPlaybackHint() {
	if (!fs.existsSync(RESULT_PATH)) return null
	try {
		const prior = JSON.parse(fs.readFileSync(RESULT_PATH, 'utf8'))
		const slot = Number(prior?.playback?.slot)
		const name = String(prior?.playback?.name || '').trim()
		if (!Number.isInteger(slot) || slot < 1 || !name) return null
		return { slot, name }
	} catch {
		return null
	}
}

function chooseMixClosurePlayback(candidates, snapshot, priorHint = null) {
	const usable = (candidates || [])
		.filter(
			(candidate) =>
				candidate &&
				candidate.raw &&
				String(candidate.raw) !== '0' &&
				/playback/i.test(String(candidate.name || '')) &&
				candidate.stereoKnown === true,
		)
		.map((candidate) => ({ ...candidate, exactBaselineLanes: playbackExactLaneCount(snapshot, candidate.slot) }))

	if (!usable.length)
		throw new Error('No existing mixer slot has a server-confirmed Playback source and stereo/mono state.')

	if (priorHint) {
		const prior = usable.find(
			(candidate) =>
				Number(candidate.slot) === Number(priorHint.slot) &&
				String(candidate.name) === String(priorHint.name) &&
				candidate.exactBaselineLanes > 0,
		)
		if (prior) return { ...prior, selection: 'previous-closure-target' }
	}

	const maxExact = Math.max(...usable.map((candidate) => candidate.exactBaselineLanes))
	if (maxExact <= 0) {
		throw new Error(
			'Playback sources are present, but none has an exact materialised Mix gain/mute/solo baseline; no write attempted.',
		)
	}
	const best = usable.filter((candidate) => candidate.exactBaselineLanes === maxExact)
	if (best.length !== 1) {
		throw new Error(
			`Ambiguous Playback target: ${best
				.map(
					(candidate) =>
						`slot ${candidate.slot} ${candidate.name} ${candidate.stereo ? 'stereo' : 'mono'} exact=${candidate.exactBaselineLanes}`,
				)
				.join('; ')}. No write attempted.`,
		)
	}
	return { ...best[0], selection: 'unique-best-materialised-baseline' }
}

async function collectPlaybackCandidates(baseUrl, label, snapshot) {
	const candidates = []
	for (const slot of snapshot?.shape?.mixerSlots || []) {
		const [source, name, stereo] = await Promise.all([
			readVariableOptional(baseUrl, label, `mixer_slot_${slot}_source`, 1800),
			readVariableOptional(baseUrl, label, `mixer_slot_${slot}_source_name`, 1800),
			readVariableOptional(baseUrl, label, `mixer_slot_${slot}_stereo`, 1800),
		])
		if (!source.exists) continue
		const stereoValue = stereo.exists ? canonicalBool(stereo.value) : null
		candidates.push({
			slot,
			raw: String(source.value ?? '').trim(),
			name: String(name.value ?? '').trim(),
			stereoKnown: stereo.exists && ['true', 'false'].includes(stereoValue),
			stereo: stereoValue === 'true',
		})
	}
	return candidates
}

async function detectPlaybackSourceForMixClosure(baseUrl, label, snapshot) {
	const candidates = await collectPlaybackCandidates(baseUrl, label, snapshot)
	const selected = chooseMixClosurePlayback(candidates, snapshot, loadPriorPlaybackHint())
	return { ...selected, candidates }
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
		const detail = `Stereo-pair baseline drift; expected=${target.baseline}/${target.baseline} observed=${before.left ?? 'unknown'}/${before.right ?? 'unknown'}. No write attempted.`
		return {
			results: [
				pairResult(target, 'left', 'SKIP_BASELINE_DRIFT', detail),
				pairResult(target, 'right', 'SKIP_BASELINE_DRIFT', detail),
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
			results.push(
				pairResult(
					target,
					side,
					'FAIL_TRANSITION_FEEDBACK',
					`Stereo side=both transition not confirmed on ${side}: expected=${target.alternate}, server=${transitionVariables[side] ?? 'unknown'}, feedback=${transitionFeedbackOk ? 'MATCH' : 'NO_MATCH'}${actionError ? `; action=${actionError}` : ''}. Exact pair baseline restored.`,
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

function playbackChannelNumber(name) {
	const match = /^Playback\s+(\d+)$/i.exec(String(name || '').trim())
	return match ? Number(match[1]) : null
}

function findPlaybackChannelPair(playback, candidates = playback?.candidates || []) {
	const channel = playbackChannelNumber(playback?.name)
	if (!Number.isInteger(channel) || channel < 1) return null
	const leftChannel = channel % 2 === 1 ? channel : channel - 1
	const rightChannel = leftChannel + 1
	const leftMatches = candidates.filter((candidate) => playbackChannelNumber(candidate.name) === leftChannel)
	const rightMatches = candidates.filter((candidate) => playbackChannelNumber(candidate.name) === rightChannel)
	if (leftMatches.length !== 1 || rightMatches.length !== 1) return null
	const selected = { ...playback }
	delete selected.candidates
	const left = channel === leftChannel ? selected : { ...leftMatches[0] }
	const right = channel === rightChannel ? selected : { ...rightMatches[0] }
	if (
		Number(left.slot) === Number(right.slot) ||
		!left.raw ||
		!right.raw ||
		String(left.raw) === '0' ||
		String(right.raw) === '0' ||
		left.stereoKnown !== true ||
		right.stereoKnown !== true
	) {
		return null
	}
	delete left.candidates
	delete right.candidates
	return { left, right }
}

function findAdjacentPlaybackPair(playback, candidates = playback?.candidates || []) {
	return findPlaybackChannelPair(playback, candidates)
}

function topologySpec(slot, state) {
	return { definitionId: 'mixer_slot_stereo', options: { slot: Number(slot), state } }
}

function buildLiveStereoPairTemplates({ built, lanes, r9, slot }) {
	const grouped = new Map()
	for (const entry of lanes || []) {
		if (entry.status !== 'READY') continue
		const current = grouped.get(entry.lane.mix) || {}
		current[entry.lane.side] = entry.lane
		grouped.set(entry.lane.mix, current)
	}
	const templates = []
	for (const [mix, pair] of grouped) {
		if (!pair.left || !pair.right) continue
		for (const property of ['mute', 'solo']) {
			const definitionId = `mix_${property}`
			let leftProbe
			let rightProbe
			try {
				leftProbe = findFeedbackProbe(r9, definitionId, pair.left, slot)
				rightProbe = findFeedbackProbe(r9, definitionId, pair.right, slot)
			} catch {
				continue
			}
			const root = `mix-feedback-livepair-${String(mix).replace(/\s+/g, '').toLowerCase()}-slot-${slot}-${property}`
			const onBatch = `${root}-on`
			const offBatch = `${root}-off`
			const actionLane = { mix, side: 'both' }
			appendBatch(built, {
				id: onBatch,
				label: `${mix} pair\nS${slot} ${property.toUpperCase()} ON`,
				specs: [mixSpec(definitionId, actionLane, slot, 'true')],
			})
			appendBatch(built, {
				id: offBatch,
				label: `${mix} pair\nS${slot} ${property.toUpperCase()} OFF`,
				specs: [mixSpec(definitionId, actionLane, slot, 'false')],
			})
			templates.push({
				mix,
				slot,
				property,
				definitionId,
				onBatch,
				offBatch,
				left: {
					lane: pair.left,
					variable: `${laneBase(pair.left)}_slot_${slot}_${property}`,
					probe: leftProbe,
				},
				right: {
					lane: pair.right,
					variable: `${laneBase(pair.right)}_slot_${slot}_${property}`,
					probe: rightProbe,
				},
			})
		}
	}
	return templates
}

function buildAutonomousTopologyPlan({ built, playback, lanes, r9 }) {
	if (playback.stereo) return { eligible: false, reason: 'selected Playback already stereo' }
	const pair = findPlaybackChannelPair(playback)
	if (!pair) return { eligible: false, reason: 'no unique canonical Playback channel mate with known topology state' }
	if (pair.left.stereo || pair.right.stereo) {
		return { eligible: false, reason: 'starting pair is not two confirmed mono members' }
	}
	const alternateBatch = `mix-topology-slots-${pair.left.slot}-${pair.right.slot}-stereo-on`
	const restoreBatch = `mix-topology-slots-${pair.left.slot}-${pair.right.slot}-restore-mono`
	appendBatch(built, {
		id: alternateBatch,
		label: `PLAYBACK ${pair.left.slot}-${pair.right.slot}\nPAIR STEREO ON`,
		specs: [topologySpec(pair.left.slot, 'on'), topologySpec(pair.right.slot, 'on')],
	})
	appendBatch(built, {
		id: restoreBatch,
		label: `PLAYBACK ${pair.left.slot}-${pair.right.slot}\nPAIR RESTORE MONO`,
		specs: [topologySpec(pair.left.slot, 'off'), topologySpec(pair.right.slot, 'off')],
	})
	return {
		eligible: true,
		pair,
		alternateBatch,
		restoreBatch,
		templates: buildLiveStereoPairTemplates({ built, lanes, r9, slot: playback.slot }),
	}
}

async function readTopologyMember(baseUrl, label, member) {
	const [source, name, stereo] = await Promise.all([
		readVariableOptional(baseUrl, label, `mixer_slot_${member.slot}_source`, 1800),
		readVariableOptional(baseUrl, label, `mixer_slot_${member.slot}_source_name`, 1800),
		readVariableOptional(baseUrl, label, `mixer_slot_${member.slot}_stereo`, 1800),
	])
	return {
		slot: member.slot,
		source: source.exists ? String(source.value ?? '').trim() : null,
		name: name.exists ? String(name.value ?? '').trim() : null,
		stereo: stereo.exists ? canonicalBool(stereo.value) : null,
	}
}

async function readTopologyPair(baseUrl, label, plan) {
	const [left, right] = await Promise.all([
		readTopologyMember(baseUrl, label, plan.pair.left),
		readTopologyMember(baseUrl, label, plan.pair.right),
	])
	return { left, right }
}

function topologySourcesMatch(observed, plan) {
	return (
		observed.left.source === String(plan.pair.left.raw) &&
		observed.right.source === String(plan.pair.right.raw) &&
		observed.left.name === String(plan.pair.left.name) &&
		observed.right.name === String(plan.pair.right.name)
	)
}

function topologyStereoMatches(observed, expected) {
	return observed.left.stereo === expected.left && observed.right.stereo === expected.right
}

async function waitTopologyPair(baseUrl, label, plan, expected, timeoutMs = 7000) {
	const deadline = Date.now() + timeoutMs
	let observed = await readTopologyPair(baseUrl, label, plan)
	while (Date.now() < deadline) {
		if (topologyStereoMatches(observed, expected)) return { ok: true, observed }
		await sleep(100)
		observed = await readTopologyPair(baseUrl, label, plan)
	}
	return { ok: false, observed }
}

async function prepareLiveStereoPairTargets(baseUrl, label, templates) {
	const targets = []
	for (const template of templates || []) {
		const [leftItem, rightItem] = await Promise.all([
			readVariableOptional(baseUrl, label, template.left.variable, 1800),
			readVariableOptional(baseUrl, label, template.right.variable, 1800),
		])
		const left = leftItem.exists ? canonicalBool(leftItem.value) : null
		const right = rightItem.exists ? canonicalBool(rightItem.value) : null
		if (!['true', 'false'].includes(left) || left !== right) continue
		const alternate = left === 'true' ? 'false' : 'true'
		targets.push({
			...template,
			baseline: left,
			alternate,
			alternateBatch: alternate === 'true' ? template.onBatch : template.offBatch,
			restoreBatch: left === 'true' ? template.onBatch : template.offBatch,
		})
	}
	return targets
}

async function runAutonomousTopologyPhase({
	baseUrl,
	label,
	pageNumber,
	r9PageNumber,
	locations,
	plan,
	activeChanges,
	results,
}) {
	const status = {
		attempted: false,
		transitionConfirmed: false,
		sourcesStableDuringTransition: true,
		restored: true,
		stereoPairTargets: 0,
		detail: plan?.reason || 'not eligible',
		writeAttempted: false,
		hardAbort: false,
	}
	if (!plan?.eligible) return status

	const baseline = await readTopologyPair(baseUrl, label, plan)
	if (!topologyStereoMatches(baseline, { left: 'false', right: 'false' }) || !topologySourcesMatch(baseline, plan)) {
		status.detail = 'Topology baseline drift before write; expected two mono Playback members with unchanged sources.'
		return status
	}

	const token = `mixer-topology/${plan.pair.left.slot}-${plan.pair.right.slot}`
	activeChanges.add(token)
	status.attempted = true
	status.writeAttempted = true

	try {
		await pressBatch(baseUrl, pageNumber, { locations }, plan.alternateBatch)
		const transition = await waitTopologyPair(baseUrl, label, plan, { left: 'true', right: 'true' }, 7000)
		status.transitionConfirmed = transition.ok
		status.sourcesStableDuringTransition = topologySourcesMatch(transition.observed, plan)

		if (!transition.ok) {
			status.detail = `Paired mixer_slot_stereo actions produced no confirmed true/true transition; observed=${transition.observed.left.stereo ?? 'unknown'}/${transition.observed.right.stereo ?? 'unknown'}.`
			line('INFO', 'Autonomous topology transition', status.detail)
		} else if (!status.sourcesStableDuringTransition) {
			status.detail =
				'Stereo flags transitioned, but Playback source state changed as collateral; stereo Mix phase withheld pending exact restore.'
			line('FAIL', 'Autonomous topology collateral', status.detail)
		} else {
			line(
				'PASS',
				'Autonomous topology transition',
				`slots ${plan.pair.left.slot}/${plan.pair.right.slot} server-confirmed mono -> stereo with sources unchanged`,
			)
			const liveTargets = await prepareLiveStereoPairTargets(baseUrl, label, plan.templates)
			status.stereoPairTargets = liveTargets.length
			line('INFO', 'Stereo topology live feedback targets', String(liveTargets.length))
			for (const target of liveTargets) {
				const outcome = await runStereoPairTarget({
					baseUrl,
					label,
					pageNumber,
					r9PageNumber,
					locations,
					target,
					activeChanges,
				})
				for (const result of outcome.results) {
					results.push(result)
					line(
						result.status === 'HARDWARE_DYNAMIC_CLOSED' ? 'PASS' : result.status.startsWith('SKIP') ? 'SKIP' : 'FAIL',
						`${result.lane} ${result.property}`,
						`[AUTO-STEREO] ${result.detail}`,
					)
				}
				if (outcome.hardAbort) {
					status.hardAbort = true
					break
				}
				await sleep(120)
			}
			status.detail = `Stereo transition confirmed; ${liveTargets.length} property pair target(s) evaluated before topology restore.`
		}
	} catch (error) {
		status.detail = `Autonomous topology phase error: ${error.message}`
		line('FAIL', 'Autonomous topology phase', status.detail)
	} finally {
		try {
			await pressBatch(baseUrl, pageNumber, { locations }, plan.restoreBatch)
			const restored = await waitTopologyPair(baseUrl, label, plan, { left: 'false', right: 'false' }, 9000)
			status.restored = restored.ok && topologySourcesMatch(restored.observed, plan)
			if (status.restored) {
				activeChanges.delete(token)
				line('PASS', 'Autonomous topology restore', 'original mono flags and Playback sources server-confirmed exact')
			} else {
				line(
					'FAIL',
					'Autonomous topology restore',
					`exact original topology not confirmed; stereo=${restored.observed.left.stereo ?? 'unknown'}/${restored.observed.right.stereo ?? 'unknown'} sourceExact=${topologySourcesMatch(restored.observed, plan) ? 'YES' : 'NO'}`,
				)
				status.hardAbort = true
			}
		} catch (error) {
			status.restored = false
			status.hardAbort = true
			line('FAIL', 'Autonomous topology restore', `restore action failed: ${error.message}`)
		}
	}
	return status
}

async function main() {
	if (!process.argv.includes(ALLOW_FLAG)) throw new Error(`REFUSED: missing explicit ${ALLOW_FLAG} permission.`)
	if (!process.argv.includes(ISOLATION_FLAG)) throw new Error(`REFUSED: missing explicit ${ISOLATION_FLAG} permission.`)

	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 - MIX MUTE/SOLO + AUTONOMOUS TOPOLOGY EXACT RESTORE')
	console.log('==================================================================')
	console.log(
		'Scope: previous exact Playback target if still live; otherwise unique best materialised Playback baseline.',
	)
	console.log('Writes: mix_mute + mix_solo, plus guarded paired mixer_slot_stereo research actions only.')
	console.log('No mix gain, mixer-slot source, output routing, raw, firmware/reset or Monitor gain write.')
	console.log(
		'Starting mono: direct per-lane Mix test, then paired stereo attempt, server-confirmed stereo Mix test if safe, exact mono restore.',
	)
	console.log(
		'Unknown/ambiguous target/topology baseline = STOP/SKIP / NO WRITE. Any topology/hardware restore failure = HARD ABORT.',
	)
	console.log('No FULL, no direct Control Server client, no raw write, no package install.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		prepRequired(ctx, 'required mixer variables/research action gate are not currently exposed by Companion.')
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

	const playback = await detectPlaybackSourceForMixClosure(ctx.baseUrl, ctx.label, ctx.snapshot)
	line(
		'PASS',
		'Playback target',
		`existing mixer slot ${playback.slot} :: ${playback.name} / ${playback.stereo ? 'stereo' : 'mono'} :: ${playback.selection} :: exact-baseline-lanes=${playback.exactBaselineLanes}`,
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
	const topologyPlan = buildAutonomousTopologyPlan({
		built: augmented.built,
		playback,
		lanes: augmented.lanes,
		r9: ctx.r9,
	})
	line(
		'INFO',
		'Playback topology',
		playback.stereo ? 'STEREO - pair-aware side=both eligible where exact' : 'MONO - direct per-lane diagnostic',
	)
	line('INFO', 'Stereo-pair feedback operations', String(pairPlan.targets.length))
	line('INFO', 'Direct feedback targets', String(directRunnable.length))
	line(
		'INFO',
		'Autonomous topology phase',
		topologyPlan.eligible
			? `READY slots ${topologyPlan.pair.left.slot}/${topologyPlan.pair.right.slot} :: ${topologyPlan.pair.left.name} + ${topologyPlan.pair.right.name}`
			: `SKIP :: ${topologyPlan.reason}`,
	)
	line('INFO', 'No-write skipped/failed preflight targets', String(prepared.results.length))

	const results = [...prepared.results]
	if (!directRunnable.length && !pairPlan.targets.length && !topologyPlan.eligible) {
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
			console.log(
				'MIX FEEDBACK NO-OP SAFE - aucune cible/action topologique ne dispose d une baseline exacte exploitable.',
			)
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
	let topologyStatus = topologyPlan.eligible ? null : { attempted: false, restored: true, detail: topologyPlan.reason }

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
				`[INITIAL-${playback.stereo ? 'STEREO' : 'MONO'}] ${outcome.result.detail}`,
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
						`[INITIAL-STEREO] ${result.detail}`,
					)
				}
				if (outcome.hardAbort) {
					hardAbort = true
					break
				}
				await sleep(120)
			}
		}

		if (!hardAbort && topologyPlan.eligible) {
			topologyStatus = await runAutonomousTopologyPhase({
				baseUrl: ctx.baseUrl,
				label: ctx.label,
				pageNumber,
				r9PageNumber: ctx.r9.pageNumber,
				locations: augmented.built.locations,
				plan: topologyPlan,
				activeChanges,
				results,
			})
			if (topologyStatus.writeAttempted) hardwareWrites = true
			if (topologyStatus.hardAbort) hardAbort = true
		}
	} catch (error) {
		campaignError = error
	} finally {
		if (pageInstallAttempted) {
			try {
				await replacePage2FromFile({ baseUrl: ctx.baseUrl, r9: ctx.r9, built: baseBuilt, filePath: files.baseRestore })
				pageRestored = true
				line('PASS', 'Companion Page 2 restore', 'fresh audited capability-lab page restored')
			} catch (error) {
				line('FAIL', 'Companion Page 2 restore', error.message)
				campaignError = campaignError || error
			}
		}
	}

	const hardwareRestored = activeChanges.size === 0 && topologyStatus?.restored !== false
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
		topology: topologyStatus,
	})

	console.log('')
	console.log('==================================================================')
	console.log(
		`SUMMARY: DYNAMIC_CLOSED ${payload.dynamicClosed} / SKIP_BASELINE_UNKNOWN ${payload.skippedBaselineUnknown} / SKIP_BASELINE_DRIFT ${payload.skippedBaselineDrift} / FAIL ${payload.fail} / RESTORE_QUARANTINE ${payload.quarantinedRestore}`,
	)
	if (payload.topology) {
		console.log(`Topology transition confirmee: ${payload.topology.transitionConfirmed ? 'YES' : 'NO'}`)
		console.log(`Topology originale restauree: ${payload.topology.restored ? 'YES' : 'NO'}`)
		console.log(`Topology detail: ${payload.topology.detail}`)
	}
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
	playbackExactLaneCount,
	loadPriorPlaybackHint,
	chooseMixClosurePlayback,
	collectPlaybackCandidates,
	detectPlaybackSourceForMixClosure,
	pairKey,
	buildStereoPairTargets,
	readPairVariables,
	waitPairVariables,
	waitPairFeedbacks,
	runStereoPairTarget,
	playbackChannelNumber,
	findPlaybackChannelPair,
	findAdjacentPlaybackPair,
	topologySpec,
	buildLiveStereoPairTemplates,
	buildAutonomousTopologyPlan,
	readTopologyPair,
	topologySourcesMatch,
	topologyStereoMatches,
	waitTopologyPair,
	prepareLiveStereoPairTargets,
	runAutonomousTopologyPhase,
	writePages,
	writeReport,
	main,
}
