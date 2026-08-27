'use strict'

const fs = require('node:fs')
const path = require('node:path')
const {
	EXPECTED_MODULE_VERSION,
	generatedDir,
	resultsDir,
	nowIso,
	line,
	sleep,
	canonicalBool,
	readVariableOptional,
} = require('./FullTestBenchBase')
const { Reporter, verifyMany } = require('./FullTestBenchCorePhases')
const { prepareLab } = require('./FullTestBenchRunnerV4Preflight')
const { readFeedbackMarker } = require('./FullTestBenchAudit')
const { pressBatch } = require('./FullTestBenchV4Common')
const { detectPlaybackSource } = require('./MeterRoutingClosure')
const { playbackSlotBaseline, actionBoolState } = require('./MeterMixPlaybackPage')
const { appendBatch } = require('./MeterRoutingPage')
const { replacePage2FromFile } = require('./MeterRoutingPageImport')

const ALLOW_FLAG = '--allow-mix-feedback-writes'
const ISOLATION_FLAG = '--confirm-all-output-routing-isolated'
const NO_ACTIONABLE_EXIT = 8
const TEMP_PAGE = path.join(generatedDir, 'MIX_FEEDBACK_EXTENDED.companionconfig')
const BASE_RESTORE_PAGE = path.join(generatedDir, 'MIX_FEEDBACK_BASE_RESTORE.companionconfig')
const RESULT_PATH = path.join(resultsDir, 'LATEST_MIX_FEEDBACK_CLOSURE.json')
const RELATIVE_RESULT = 'testbench\\results\\LATEST_MIX_FEEDBACK_CLOSURE.json'

function clonePlain(value) {
	return JSON.parse(JSON.stringify(value))
}

function laneId(lane) {
	return `${String(lane.mix).replace(/\s+/g, '').toLowerCase()}-${String(lane.side)[0]}`
}

function mixSpec(definitionId, lane, slot, state) {
	return {
		definitionId,
		options: { mix: lane.mix, side: lane.side, slot, state: actionBoolState(state) },
	}
}

function augmentMixFeedbackHarness(built, snapshot, playbackSlot) {
	const slot = Number(playbackSlot)
	if (!Number.isInteger(slot) || slot < 1 || slot > 24) {
		throw new Error(`Invalid existing Playback mixer slot ${playbackSlot}.`)
	}
	const lanes = []
	for (const lane of snapshot.shape.lanes || []) {
		const baseline = playbackSlotBaseline(snapshot, lane, slot)
		const id = `mix-feedback-${laneId(lane)}-slot-${slot}`
		if (!baseline) {
			lanes.push({ lane, slot, id, status: 'SKIP_BASELINE_UNKNOWN' })
			continue
		}
		const muteAlternate = baseline.mute === 'true' ? 'false' : 'true'
		const soloAlternate = baseline.solo === 'true' ? 'false' : 'true'
		const batches = {
			muteAlternate: `${id}-mute-alt`,
			muteRestore: `${id}-mute-restore`,
			soloAlternate: `${id}-solo-alt`,
			soloRestore: `${id}-solo-restore`,
		}
		appendBatch(built, {
			id: batches.muteAlternate,
			label: `${lane.mix} ${lane.side}\nS${slot} MUTE ${muteAlternate}`,
			specs: [mixSpec('mix_mute', lane, slot, muteAlternate)],
		})
		appendBatch(built, {
			id: batches.muteRestore,
			label: `${lane.mix} ${lane.side}\nS${slot} MUTE RESTORE`,
			specs: [mixSpec('mix_mute', lane, slot, baseline.mute)],
		})
		appendBatch(built, {
			id: batches.soloAlternate,
			label: `${lane.mix} ${lane.side}\nS${slot} SOLO ${soloAlternate}`,
			specs: [mixSpec('mix_solo', lane, slot, soloAlternate)],
		})
		appendBatch(built, {
			id: batches.soloRestore,
			label: `${lane.mix} ${lane.side}\nS${slot} SOLO RESTORE`,
			specs: [mixSpec('mix_solo', lane, slot, baseline.solo)],
		})
		lanes.push({
			lane,
			slot,
			id,
			status: 'READY',
			baseline,
			alternates: { mute: muteAlternate, solo: soloAlternate },
			batches,
		})
	}
	return { built, lanes, playbackSlot: slot }
}

function writePages(baseBuilt, augmentedBuilt) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(TEMP_PAGE, `${JSON.stringify(augmentedBuilt.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(BASE_RESTORE_PAGE, `${JSON.stringify(baseBuilt.file, null, '\t')}\n`, 'utf8')
	return { temporary: TEMP_PAGE, baseRestore: BASE_RESTORE_PAGE }
}

function findFeedbackProbe(r9, definitionId, lane, slot) {
	const matches = r9.probes.filter((probe) => {
		if (probe.definitionId !== definitionId) return false
		const options = probe.options || {}
		return (
			String(options.mix) === String(lane.mix) &&
			String(options.side) === String(lane.side) &&
			Number(options.slot) === Number(slot)
		)
	})
	if (matches.length !== 1) {
		throw new Error(
			`Expected one ${definitionId} feedback for ${lane.mix} ${lane.side} slot ${slot}; found ${matches.length}.`,
		)
	}
	return matches[0]
}

async function readFeedbackMarkerPassive(baseUrl, pageNumber, probe) {
	const variable = `b_text_${pageNumber}_${probe.row}_${probe.column}`
	const item = await readVariableOptional(baseUrl, 'internal', variable, 1800)
	if (item.exists) {
		const marker = String(item.value).split(/\r?\n/).at(-1)?.trim() || ''
		if (['T', 'F'].includes(marker)) return marker
	}
	// r9 feedback cells are audited to contain no actions. If Companion has not
	// rendered b_text yet, reuse the V8 feedback-only render fallback. This may
	// press the feedback cell in Companion but cannot issue a Focusrite write.
	return readFeedbackMarker(baseUrl, pageNumber, probe)
}

function wantedMarker(value) {
	const normalized = canonicalBool(value)
	if (normalized === 'true') return 'T'
	if (normalized === 'false') return 'F'
	throw new Error(`Cannot map unknown boolean feedback value '${value}'.`)
}

async function waitFeedbackValue(baseUrl, pageNumber, probe, expected, timeoutMs = 3000) {
	const wanted = wantedMarker(expected)
	const deadline = Date.now() + timeoutMs
	let observed = null
	while (Date.now() < deadline) {
		observed = await readFeedbackMarkerPassive(baseUrl, pageNumber, probe)
		if (observed === wanted) return { ok: true, wanted, observed }
		await sleep(100)
	}
	return { ok: false, wanted, observed }
}

function boolCheck(variable, expected) {
	return {
		variable,
		expected: String(expected),
		predicate: (value) => canonicalBool(value) === String(expected),
	}
}

async function requireBool(baseUrl, label, variable, expected, context, timeoutMs = 7000) {
	const results = await verifyMany(baseUrl, label, [boolCheck(variable, expected)], timeoutMs)
	const result = results[0]
	if (!result?.ok) {
		throw new Error(`${context}: ${variable} expected ${expected}, observed ${result?.actual ?? 'unknown'}.`)
	}
	return result
}

function resultFor(target, status, detail, extra = {}) {
	return {
		lane: `${target.lane.mix} ${target.lane.side}`,
		slot: target.slot,
		property: target.property,
		definitionId: target.definitionId,
		status,
		detail,
		...extra,
	}
}

async function prepareTargets({ baseUrl, label, r9, lanes }) {
	const runnable = []
	const results = []
	for (const entry of lanes) {
		if (entry.status !== 'READY') {
			for (const property of ['mute', 'solo']) {
				results.push({
					lane: `${entry.lane.mix} ${entry.lane.side}`,
					slot: entry.slot,
					property,
					definitionId: `mix_${property}`,
					status: 'SKIP_BASELINE_UNKNOWN',
					detail: 'Exact Playback-slot gain/mute/solo baseline tuple is incomplete; no write attempted.',
				})
			}
			continue
		}

		for (const property of ['mute', 'solo']) {
			const definitionId = `mix_${property}`
			const variable = entry.baseline.variables[property]
			const baseline = entry.baseline[property]
			const alternate = entry.alternates[property]
			const probe = findFeedbackProbe(r9, definitionId, entry.lane, entry.slot)
			const item = await readVariableOptional(baseUrl, label, variable, 2200)
			const current = item.exists ? canonicalBool(item.value) : null
			if (current !== baseline) {
				results.push(
					resultFor(
						{ ...entry, property, definitionId },
						'SKIP_BASELINE_DRIFT',
						`Current server baseline is ${current ?? 'unknown'}, snapshot baseline was ${baseline}; no write attempted.`,
					),
				)
				continue
			}
			const feedback = await waitFeedbackValue(baseUrl, r9.pageNumber, probe, baseline, 2200)
			if (!feedback.ok) {
				results.push(
					resultFor(
						{ ...entry, property, definitionId },
						'FAIL_INITIAL_FEEDBACK',
						`Rendered feedback did not match known server baseline; wanted=${feedback.wanted} observed=${feedback.observed || 'missing'}. No write attempted.`,
					),
				)
				continue
			}
			runnable.push({
				lane: entry.lane,
				slot: entry.slot,
				property,
				definitionId,
				variable,
				baseline,
				alternate,
				probe,
				alternateBatch: property === 'mute' ? entry.batches.muteAlternate : entry.batches.soloAlternate,
				restoreBatch: property === 'mute' ? entry.batches.muteRestore : entry.batches.soloRestore,
			})
		}
	}
	return { runnable, results }
}

async function runTarget({ baseUrl, label, pageNumber, r9PageNumber, locations, target, activeChanges }) {
	const before = await readVariableOptional(baseUrl, label, target.variable, 2200)
	const current = before.exists ? canonicalBool(before.value) : null
	if (current !== target.baseline) {
		return {
			result: resultFor(
				target,
				'FAIL_PREFLIGHT_DRIFT',
				`Server baseline changed before write; expected=${target.baseline} observed=${current ?? 'unknown'}. No write attempted.`,
			),
			writeAttempted: false,
			hardAbort: false,
		}
	}
	const beforeFeedback = await waitFeedbackValue(baseUrl, r9PageNumber, target.probe, target.baseline, 1800)
	if (!beforeFeedback.ok) {
		return {
			result: resultFor(
				target,
				'FAIL_PREFLIGHT_FEEDBACK_DRIFT',
				`Feedback changed before write; wanted=${beforeFeedback.wanted} observed=${beforeFeedback.observed || 'missing'}. No write attempted.`,
			),
			writeAttempted: false,
			hardAbort: false,
		}
	}

	const token = `${target.lane.mix}/${target.lane.side}/slot${target.slot}/${target.property}`
	let writeAttempted = false
	let transitionError = ''
	let restoreHardwareError = ''
	let restoreFeedbackError = ''
	activeChanges.add(token)
	try {
		writeAttempted = true
		await pressBatch(baseUrl, pageNumber, { locations }, target.alternateBatch)
		try {
			await requireBool(
				baseUrl,
				label,
				target.variable,
				target.alternate,
				`${target.lane.mix} ${target.lane.side} slot ${target.slot} ${target.property} alternate`,
			)
			const feedback = await waitFeedbackValue(baseUrl, r9PageNumber, target.probe, target.alternate)
			if (!feedback.ok) {
				transitionError = `Rendered feedback mismatch at alternate state; wanted=${feedback.wanted} observed=${feedback.observed || 'missing'}.`
			}
		} catch (error) {
			transitionError = `Transition not confirmed: ${error.message}`
		}
	} catch (error) {
		transitionError = `Alternate action threw: ${error.message}`
	} finally {
		if (writeAttempted) {
			try {
				await pressBatch(baseUrl, pageNumber, { locations }, target.restoreBatch)
				await requireBool(
					baseUrl,
					label,
					target.variable,
					target.baseline,
					`RESTORE FAILED ${target.lane.mix} ${target.lane.side} slot ${target.slot} ${target.property}`,
					9000,
				)
				activeChanges.delete(token)
				const restoredFeedback = await waitFeedbackValue(baseUrl, r9PageNumber, target.probe, target.baseline)
				if (!restoredFeedback.ok) {
					restoreFeedbackError = `Hardware restored but feedback mismatch remained; wanted=${restoredFeedback.wanted} observed=${restoredFeedback.observed || 'missing'}.`
				}
			} catch (error) {
				restoreHardwareError = error.message
			}
		} else {
			activeChanges.delete(token)
		}
	}

	if (restoreHardwareError) {
		return {
			result: resultFor(target, 'QUARANTINED_RESTORE', restoreHardwareError, { transitionError }),
			writeAttempted,
			hardAbort: true,
		}
	}
	if (restoreFeedbackError) {
		return {
			result: resultFor(target, 'FAIL_RESTORED_FEEDBACK', restoreFeedbackError, { transitionError }),
			writeAttempted,
			hardAbort: false,
		}
	}
	if (transitionError) {
		return {
			result: resultFor(target, 'FAIL_TRANSITION_FEEDBACK', `${transitionError} Exact hardware baseline restored.`),
			writeAttempted,
			hardAbort: false,
		}
	}
	return {
		result: resultFor(
			target,
			'HARDWARE_DYNAMIC_CLOSED',
			`Server variable + rendered feedback confirmed at ${target.baseline} -> ${target.alternate} -> ${target.baseline}; exact restore confirmed.`,
		),
		writeAttempted,
		hardAbort: false,
	}
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

async function main() {
	if (!process.argv.includes(ALLOW_FLAG)) throw new Error(`REFUSED: missing explicit ${ALLOW_FLAG} permission.`)
	if (!process.argv.includes(ISOLATION_FLAG)) throw new Error(`REFUSED: missing explicit ${ISOLATION_FLAG} permission.`)

	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 - MIX MUTE/SOLO FEEDBACK EXACT RESTORE')
	console.log('==================================================================')
	console.log('Scope: existing Playback slot only, runtime baseline required per lane.')
	console.log('Writes: mix_mute + mix_solo only. No mix gain, no output routing, no mixer-slot assignment.')
	console.log('Unknown baseline = SKIP / NO WRITE. Hardware restore failure = HARD ABORT.')
	console.log('No FULL, no direct Control Server client, no raw write, no package install.')
	console.log('')

	const reporter = new Reporter()
	const ctx = await prepareLab(reporter)
	if (ctx.prep === 'mixer-variables') {
		throw new Error('Expose all mixer slot variables must remain enabled before Mix feedback closure.')
	}
	if (ctx.prep !== null || !ctx.ext || ctx.ext.pageNumber !== 2) {
		throw new Error('Mix feedback closure requires the current audited V8 capability-lab harness on Companion Page 2.')
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
	line('INFO', 'Runnable feedback targets', String(prepared.runnable.length))
	line('INFO', 'No-write skipped/failed preflight targets', String(prepared.results.length))

	let results = [...prepared.results]
	if (!prepared.runnable.length) {
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

		for (const target of prepared.runnable) {
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
				line('PASS', 'Companion Page 2 restore', 'original audited capability-lab page restored')
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
		console.error('Aucun write ne doit etre suppose restaure sans preuve serveur.')
		process.exitCode = 4
	})
}

module.exports = {
	ALLOW_FLAG,
	ISOLATION_FLAG,
	NO_ACTIONABLE_EXIT,
	laneId,
	mixSpec,
	augmentMixFeedbackHarness,
	findFeedbackProbe,
	readFeedbackMarkerPassive,
	wantedMarker,
	waitFeedbackValue,
	prepareTargets,
	runTarget,
}
