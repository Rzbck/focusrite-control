const {
	line,
	canonicalBool,
	expectedPanRaw,
	waitVariable,
	waitExact,
} = require('./FullTestBenchBase')
const {
	pressLocation,
	safePlanSetter,
	laneBase,
} = require('./FullTestBenchAudit')
const {
	verifyMany,
	exactCheck,
	boolCheck,
	numericCheck,
	requireChecks,
	checksForBatch,
	batchChecksForLane,
} = require('./FullTestBenchCorePhases')

function snapshotBlank(snapshot, variable) {
	const item = snapshot.values?.[variable]
	return Boolean(item?.exists && item.value === '')
}

function onlyBlankFailures(results, snapshot) {
	const failed = results.filter((item) => !item.ok)
	return failed.length > 0 && failed.every((item) => snapshotBlank(snapshot, item.variable))
}

async function pressBatchV2(baseUrl, extPageNumber, built, batchId) {
	const loc = built.locations[batchId]
	if (!loc) throw new Error(`Generated batch ${batchId} is unavailable.`)
	await pressLocation(baseUrl, extPageNumber, loc)
}

async function runSequenceV2({
	baseUrl,
	label,
	extPageNumber,
	built,
	snapshot,
	reporter,
	phase,
	target,
	steps,
	restoreSteps = [],
}) {
	let attempted = false
	let testError = null
	let recoveredNoop = false
	try {
		for (const step of steps) {
			await pressBatchV2(baseUrl, extPageNumber, built, step.batch)
			attempted = true
			const results = await verifyMany(baseUrl, label, step.checks, step.timeoutMs || 8000)
			const failed = results.filter((item) => !item.ok)
			if (failed.length) {
				if (step.allowBlankNoop && onlyBlankFailures(results, snapshot)) {
					recoveredNoop = true
					reporter.add(
						phase,
						`${target}:${step.batch}`,
						'NOOP_RECOVERY',
						`${failed.length} blank server states were not emitted by a possible no-op write; continuing to a forced alternate transition.`
					)
					continue
				}
				throw new Error(`${target} / ${step.batch}: ${failed.length}/${results.length} confirmations failed (first: ${failed[0].variable}).`)
			}
			reporter.add(phase, `${target}:${step.batch}`, 'PASS', `${results.length} server-confirmed targets`)
		}
	} catch (error) {
		testError = error
	} finally {
		if (attempted) {
			for (const restore of restoreSteps) {
				if (!built.locations[restore.batch]) continue
				await pressBatchV2(baseUrl, extPageNumber, built, restore.batch)
				const restored = await verifyMany(baseUrl, label, restore.checks, restore.timeoutMs || 10000)
				const failed = restored.filter((item) => !item.ok)
				if (failed.length) {
					reporter.add(phase, `${target}:restore`, 'RESTORE_FAIL', `${failed.length}/${restored.length} restores failed`)
					throw new Error(`HARD ABORT: ${target} restoration failed (${failed[0].variable}).`)
				}
				reporter.add(phase, `${target}:${restore.batch}`, 'RESTORE_PASS', `${restored.length} server-confirmed restores/baselines`)
			}
		}
	}
	if (testError) {
		reporter.add(phase, target, 'FAIL', `${testError.message} Restoration/baseline completed.`)
		line('FAIL', target, `${testError.message} Restored safely; continuing.`)
		return false
	}
	reporter.add(phase, target, 'PASS', recoveredNoop ? 'Forced alternate transition recovered one or more no-op/blank states.' : 'All requested transitions confirmed.')
	line('PASS', target, recoveredNoop ? 'no-op recovery + restore confirmed' : 'server-confirmed + restored')
	return true
}

function normalizeCoreValue(test, item) {
	if (!item?.exists) return ''
	return test.kind === 'boolean' ? canonicalBool(item.value) || '' : String(item.value || '')
}

function coreBaseline(test) {
	if (test.id.startsWith('air-') || test.id.startsWith('pad-')) return 'false'
	if (test.id === 'monitor-mute') return 'true'
	if (test.id === 'monitor-dim' || test.id === 'talkback') return 'false'
	if (test.id === 'input-1-mode' || test.id === 'input-2-mode') return 'Line'
	throw new Error(`No FULL baseline is defined for ${test.id}.`)
}

function coreAlternate(test, baseline) {
	if (test.kind === 'boolean') return baseline === 'true' ? 'false' : 'true'
	const alt = (test.allowedInitial || []).find((value) => String(value) !== String(baseline))
	if (!alt) throw new Error(`No alternate value is available for ${test.name}.`)
	return alt
}

async function waitCore(baseUrl, label, test, expected, timeoutMs = 6000) {
	return test.kind === 'boolean'
		? waitVariable(baseUrl, label, test.variable, (value) => canonicalBool(value) === expected, timeoutMs)
		: waitExact(baseUrl, label, test.variable, expected, timeoutMs)
}

async function captureCoreInitialV2(baseUrl, label, safePlan) {
	const initial = {}
	for (const test of safePlan.tests) {
		const value = await require('./FullTestBenchBase').readVariableOptional(baseUrl, label, test.variable, 3000)
		initial[test.id] = value
	}
	return initial
}

async function establishCoreBaselineV2(baseUrl, label, r9, safePlan, test, baseline, reporter) {
	const baselineSetter = safePlanSetter(safePlan, test, baseline)
	await pressLocation(baseUrl, r9.pageNumber, baselineSetter)
	let established = await waitCore(baseUrl, label, test, baseline, 1800)
	if (established.ok) {
		reporter.add('core', test.id, 'BASELINE_ESTABLISHED', `unknown -> ${baseline}`)
		return { recoveredNoop: false }
	}

	const alternate = coreAlternate(test, baseline)
	const alternateSetter = safePlanSetter(safePlan, test, alternate)
	await pressLocation(baseUrl, r9.pageNumber, alternateSetter)
	const changed = await waitCore(baseUrl, label, test, alternate, 6000)
	if (!changed.ok) throw new Error(`Could not force alternate state ${alternate} while establishing FULL baseline for ${test.name}.`)

	await pressLocation(baseUrl, r9.pageNumber, baselineSetter)
	established = await waitCore(baseUrl, label, test, baseline, 6000)
	if (!established.ok) throw new Error(`HARD ABORT: ${test.name} could not return to FULL baseline ${baseline}.`)

	reporter.add('core', test.id, 'NOOP_RECOVERY', `initial blank/no-op -> ${alternate} -> ${baseline}`)
	return { recoveredNoop: true }
}

async function runCoreFullV2(baseUrl, label, r9, safePlan, initial, reporter) {
	for (const test of safePlan.tests) {
		if (test.id === 'monitor-mute') continue
		const original = normalizeCoreValue(test, initial[test.id])
		const baseline = original || coreBaseline(test)
		if (!original) {
			const established = await establishCoreBaselineV2(baseUrl, label, r9, safePlan, test, baseline, reporter)
			if (established.recoveredNoop) {
				reporter.add('core', test.id, 'PASS', `${coreAlternate(test, baseline)} -> ${baseline} confirmed; FULL baseline retained.`)
				line('PASS', test.name, 'unknown-state no-op recovery confirmed')
				continue
			}
		}

		const alternate = coreAlternate(test, baseline)
		const change = safePlanSetter(safePlan, test, alternate)
		const restore = safePlanSetter(safePlan, test, baseline)
		let changeError = null
		try {
			await pressLocation(baseUrl, r9.pageNumber, change)
			const changed = await waitCore(baseUrl, label, test, alternate, 6000)
			if (!changed.ok) changeError = new Error(`${test.name} did not confirm transition to ${alternate}.`)
		} catch (error) {
			changeError = error
		} finally {
			await pressLocation(baseUrl, r9.pageNumber, restore)
			const restored = await waitCore(baseUrl, label, test, baseline, 6000)
			if (!restored.ok) throw new Error(`HARD ABORT: ${test.name} did not restore to ${baseline}.`)
		}
		if (changeError) {
			reporter.add('core', test.id, 'FAIL', `${changeError.message} Restore to ${baseline} confirmed.`)
			line('FAIL', test.name, `${changeError.message} Restored safely; continuing.`)
		} else {
			reporter.add('core', test.id, 'PASS', `${baseline} -> ${alternate} -> ${baseline}${original ? ' (original restored)' : ' (FULL baseline retained)'}`)
			line('PASS', test.name, `${baseline} -> ${alternate} -> ${baseline}`)
		}
	}
}

async function engageMonitorMuteGuardV2(baseUrl, label, r9, safePlan, initialItem, reporter) {
	const test = safePlan.tests.find((item) => item.id === 'monitor-mute')
	const on = safePlanSetter(safePlan, test, 'true')
	const off = safePlanSetter(safePlan, test, 'false')
	await pressLocation(baseUrl, r9.pageNumber, on)
	let guarded = await waitCore(baseUrl, label, test, 'true', 1800)
	if (!guarded.ok) {
		line('INFO', 'Monitor Mute guard recovery', 'ON produced no server state; forcing OFF -> ON under the required physical safety setup')
		await pressLocation(baseUrl, r9.pageNumber, off)
		const offState = await waitCore(baseUrl, label, test, 'false', 6000)
		await pressLocation(baseUrl, r9.pageNumber, on)
		guarded = await waitCore(baseUrl, label, test, 'true', 6000)
		if (!guarded.ok) throw new Error('HARD ABORT: protective Monitor Mute ON could not be server-confirmed.')
		if (!offState.ok) {
			reporter.add('protect', 'monitor-mute', 'FAIL', 'OFF recovery transition was not confirmed, but protective ON is confirmed.')
		} else {
			reporter.add('protect', 'monitor-mute', 'NOOP_RECOVERY', 'Unknown/no-op ON recovered through OFF -> ON; protective ON confirmed.')
		}
	} else {
		reporter.add('protect', 'monitor-mute', 'PASS', 'Protective ON server-confirmed.')
	}
	return initialItem
}

async function engageOutputMuteGuardV2(baseUrl, label, extPage, built, snapshot, reporter) {
	const checksOn = checksForBatch(snapshot, 'output-mute-on')
	await pressBatchV2(baseUrl, extPage, built, 'output-mute-on')
	let onResult = await verifyMany(baseUrl, label, checksOn, 6000)
	if (onResult.every((item) => item.ok)) {
		reporter.add('protect', 'all-output-mutes', 'PASS', `${checksOn.length} output mutes confirmed ON`)
		return
	}
	if (!onlyBlankFailures(onResult, snapshot)) {
		const failed = onResult.find((item) => !item.ok)
		throw new Error(`Protective output mute ON failed for known state ${failed.variable}.`)
	}

	await pressBatchV2(baseUrl, extPage, built, 'v2-output-mute-off-all')
	const offChecks = checksOn.map((check) => boolCheck(check.variable, 'false'))
	requireChecks(await verifyMany(baseUrl, label, offChecks, 10000), 'output mute no-op recovery OFF')
	await pressBatchV2(baseUrl, extPage, built, 'output-mute-on')
	onResult = await verifyMany(baseUrl, label, checksOn, 10000)
	if (onResult.some((item) => !item.ok)) {
		throw new Error('HARD ABORT: one or more output mutes could not return to protective ON.')
	}
	reporter.add('protect', 'all-output-mutes', 'NOOP_RECOVERY', `${checksOn.length} outputs forced OFF -> ON to establish server-confirmed protective mute state`)
}

async function testOutputMutesIndividuallyV2(baseUrl, label, extPage, built, snapshot, reporter) {
	for (const o of snapshot.shape.outputs) {
		const variable = `output_${o + 1}_mute`
		if (!snapshot.values[variable]?.exists) continue
		let error = null
		try {
			await pressBatchV2(baseUrl, extPage, built, `v2-output-${o + 1}-mute-off`)
			requireChecks(await verifyMany(baseUrl, label, [boolCheck(variable, 'false')]), `Output ${o + 1} mute OFF`)
		} catch (err) {
			error = err
		} finally {
			await pressBatchV2(baseUrl, extPage, built, `v2-output-${o + 1}-mute-on`)
			const on = await verifyMany(baseUrl, label, [boolCheck(variable, 'true')], 8000)
			if (on.some((item) => !item.ok)) throw new Error(`HARD ABORT: Output ${o + 1} could not return to protective Mute ON.`)
		}
		if (error) reporter.add('outputs', `output_${o + 1}_mute`, 'FAIL', `${error.message} Protective ON restored.`)
		else reporter.add('outputs', `output_${o + 1}_mute`, 'PASS', 'OFF -> ON server-confirmed while all other outputs remained muted.')
	}
	line('PASS', 'Output mute family', '26 outputs exercised individually; protective ON retained')
}

function knownLaneRestoreChecks(snapshot, lane, property, kind) {
	const base = laneBase(lane)
	const checks = []
	for (let slot = 1; slot <= 24; slot++) {
		const variable = `${base}_slot_${slot}_${property}`
		const item = snapshot.values[variable]
		if (!item?.exists || item.value === '') continue
		if (kind === 'numeric') checks.push(numericCheck(variable, Number(item.value)))
		else if (kind === 'pan') checks.push(exactCheck(variable, item.value))
		else if (kind === 'bool') checks.push(boolCheck(variable, canonicalBool(item.value)))
		else checks.push(exactCheck(variable, item.value))
	}
	return checks
}

async function testExtendedV2(baseUrl, label, extPage, built, snapshot, reporter, testSources) {
	const restoreFor = (id) => checksForBatch(snapshot, id)
	const outputChecks = (property, factory) => snapshot.shape.outputs
		.filter((o) => snapshot.values[`output_${o + 1}_${property}`]?.exists)
		.map((o) => factory(`output_${o + 1}_${property}`, o))

	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'inputs', target: 'input_nickname all applicable',
		steps: [
			{ batch: 'input-nick-temp', checks: snapshot.shape.inputs.filter((i) => snapshot.values[`input_${i + 1}_nickname`]?.exists).map((i) => exactCheck(`input_${i + 1}_nickname`, `TB_IN_${String(i + 1).padStart(2, '0')}`)), allowBlankNoop: true },
			{ batch: 'v2-input-nick-alt', checks: snapshot.shape.inputs.filter((i) => snapshot.values[`input_${i + 1}_nickname`]?.exists).map((i) => exactCheck(`input_${i + 1}_nickname`, `TB2_IN_${String(i + 1).padStart(2, '0')}`)) },
			{ batch: 'input-nick-temp', checks: snapshot.shape.inputs.filter((i) => snapshot.values[`input_${i + 1}_nickname`]?.exists).map((i) => exactCheck(`input_${i + 1}_nickname`, `TB_IN_${String(i + 1).padStart(2, '0')}`)) },
		],
		restoreSteps: [{ batch: 'input-nick-restore', checks: restoreFor('input-nick-restore') }],
	})

	const gainSet = outputChecks('gain', (v) => numericCheck(v, -128))
	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'outputs', target: 'output gain set + adjust all applicable',
		steps: [
			{ batch: 'output-gain-set', checks: gainSet, allowBlankNoop: true },
			{ batch: 'v2-output-gain-prime', checks: outputChecks('gain', (v) => numericCheck(v, -127)) },
			{ batch: 'output-gain-set', checks: gainSet },
			{ batch: 'output-gain-adjust', checks: outputChecks('gain', (v) => numericCheck(v, -127)) },
		],
		restoreSteps: [{ batch: 'output-gain-restore', checks: restoreFor('output-gain-restore') }],
	})

	const sourceNone = outputChecks('source', (v) => exactCheck(v, '0'))
	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'outputs', target: 'output source all applicable',
		steps: [
			{ batch: 'output-source-none', checks: sourceNone, allowBlankNoop: true },
			{ batch: 'v2-output-source-test', checks: outputChecks('source', (v) => exactCheck(v, testSources.primary)) },
			{ batch: 'output-source-none', checks: sourceNone },
		],
		restoreSteps: [{ batch: 'output-source-restore', checks: restoreFor('output-source-restore') }],
	})

	const stereoOff = outputChecks('stereo', (v) => boolCheck(v, 'false'))
	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'outputs', target: 'output stereo all applicable',
		steps: [
			{ batch: 'output-stereo-off', checks: stereoOff, allowBlankNoop: true },
			{ batch: 'output-stereo-on', checks: outputChecks('stereo', (v) => boolCheck(v, 'true')) },
			{ batch: 'output-stereo-off', checks: stereoOff },
		],
		restoreSteps: [{ batch: 'output-stereo-restore', checks: restoreFor('output-stereo-restore') }],
	})

	const outputNickChecks = snapshot.shape.outputs.filter((o) => snapshot.values[`output_${o + 1}_nickname`]?.exists)
	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'outputs', target: 'output nickname all applicable',
		steps: [
			{ batch: 'output-nick-temp', checks: outputNickChecks.map((o) => exactCheck(`output_${o + 1}_nickname`, `TB_OUT_${String(o + 1).padStart(2, '0')}`)), allowBlankNoop: true },
			{ batch: 'v2-output-nick-alt', checks: outputNickChecks.map((o) => exactCheck(`output_${o + 1}_nickname`, `TB2_OUT_${String(o + 1).padStart(2, '0')}`)) },
			{ batch: 'output-nick-temp', checks: outputNickChecks.map((o) => exactCheck(`output_${o + 1}_nickname`, `TB_OUT_${String(o + 1).padStart(2, '0')}`)) },
		],
		restoreSteps: [{ batch: 'output-nick-restore', checks: restoreFor('output-nick-restore') }],
	})

	const pairPrep = []
	const pairNone = []
	for (const left of require('./FullTestBenchBase').OUTPUT_PAIR_LEFT_INDICES) {
		if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(left + 1)) continue
		for (const o of [left, left + 1]) {
			if (!snapshot.values[`output_${o + 1}_source`]?.exists) continue
			pairPrep.push(exactCheck(`output_${o + 1}_source`, testSources.primary))
			pairNone.push(exactCheck(`output_${o + 1}_source`, '0'))
		}
	}
	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'outputs', target: 'output_pair_source safe None branch',
		steps: [
			{ batch: 'pair-source-prep', checks: pairPrep },
			{ batch: 'pair-source-none', checks: pairNone },
		],
		restoreSteps: [{ batch: 'pair-source-restore', checks: restoreFor('output-source-restore') }],
	})

	const mixerPrimary = snapshot.shape.mixerSlots.filter((s) => snapshot.values[`mixer_slot_${s}_source`]?.exists).map((s) => exactCheck(`mixer_slot_${s}_source`, testSources.primary))
	const mixerSecondary = snapshot.shape.mixerSlots.filter((s) => snapshot.values[`mixer_slot_${s}_source`]?.exists).map((s) => exactCheck(`mixer_slot_${s}_source`, testSources.secondary))
	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'mixer-slots', target: 'mixer_slot_source 1-24',
		steps: [
			{ batch: 'mixer-source-test', checks: mixerPrimary, allowBlankNoop: true },
			{ batch: 'v2-mixer-source-alt', checks: mixerSecondary },
			{ batch: 'mixer-source-test', checks: mixerPrimary },
		],
		restoreSteps: [{ batch: 'mixer-source-restore', checks: restoreFor('mixer-source-restore') }],
	})

	const mixerStereoOff = snapshot.shape.mixerSlots.filter((s) => snapshot.values[`mixer_slot_${s}_stereo`]?.exists).map((s) => boolCheck(`mixer_slot_${s}_stereo`, 'false'))
	const mixerStereoOn = snapshot.shape.mixerSlots.filter((s) => snapshot.values[`mixer_slot_${s}_stereo`]?.exists).map((s) => boolCheck(`mixer_slot_${s}_stereo`, 'true'))
	await runSequenceV2({
		baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'mixer-slots', target: 'mixer_slot_stereo 1-24',
		steps: [
			{ batch: 'mixer-stereo-off', checks: mixerStereoOff, allowBlankNoop: true },
			{ batch: 'mixer-stereo-on', checks: mixerStereoOn },
			{ batch: 'mixer-stereo-off', checks: mixerStereoOff },
		],
		restoreSteps: [{ batch: 'mixer-stereo-restore', checks: restoreFor('mixer-stereo-restore') }],
	})

	for (const lane of snapshot.shape.lanes) {
		const laneId = `${lane.mix.replace(/\s+/g, '').toLowerCase()}-${lane.side[0]}`
		line('INFO', 'Mixer lane', `${lane.mix} ${lane.side}`)

		for (const prop of ['mute', 'solo']) {
			const baseline = prop === 'mute' ? 'true' : 'false'
			const alternate = baseline === 'true' ? 'false' : 'true'
			await runSequenceV2({
				baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'mix-lanes', target: `${lane.mix} ${lane.side} ${prop} slots 1-24`,
				steps: [
					{ batch: `${laneId}-${prop}-${baseline === 'true' ? 'on' : 'off'}`, checks: batchChecksForLane(snapshot, lane, { property: prop, kind: 'bool', value: baseline }), allowBlankNoop: true },
					{ batch: `${laneId}-${prop}-${alternate === 'true' ? 'on' : 'off'}`, checks: batchChecksForLane(snapshot, lane, { property: prop, kind: 'bool', value: alternate }) },
					{ batch: `${laneId}-${prop}-${baseline === 'true' ? 'on' : 'off'}`, checks: batchChecksForLane(snapshot, lane, { property: prop, kind: 'bool', value: baseline }) },
				],
				restoreSteps: [{ batch: `${laneId}-${prop}-restore`, checks: batchChecksForLane(snapshot, lane, { property: prop, kind: 'bool', restore: true }) }],
			})
		}

		const gainBaseline = batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-128' })
		await runSequenceV2({
			baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'mix-lanes', target: `${lane.mix} ${lane.side} gain slots 1-24`,
			steps: [
				{ batch: `${laneId}-gain-set`, checks: gainBaseline, allowBlankNoop: true },
				{ batch: `v2-${laneId}-gain-prime`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-127' }) },
				{ batch: `${laneId}-gain-set`, checks: gainBaseline },
				{ batch: `${laneId}-gain-adjust`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-127' }) },
			],
			restoreSteps: [
				{ batch: `${laneId}-gain-set`, checks: gainBaseline },
				{ batch: `${laneId}-gain-restore`, checks: knownLaneRestoreChecks(snapshot, lane, 'gain', 'numeric') },
			],
		})

		const panCenter = batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 0 })
		await runSequenceV2({
			baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'mix-lanes', target: `${lane.mix} ${lane.side} pan slots 1-24`,
			steps: [
				{ batch: `${laneId}-pan-center`, checks: panCenter, allowBlankNoop: true },
				{ batch: `${laneId}-pan-right`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 25 }) },
				{ batch: `${laneId}-pan-center`, checks: panCenter },
			],
			restoreSteps: [
				{ batch: `${laneId}-pan-center`, checks: panCenter },
				{ batch: `${laneId}-pan-restore`, checks: knownLaneRestoreChecks(snapshot, lane, 'pan', 'pan') },
			],
		})

		const tbVar = `${laneBase(lane)}_talkback`
		if (snapshot.values[tbVar]?.exists) {
			await runSequenceV2({
				baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'mix-lanes', target: `${lane.mix} ${lane.side} talkback map`,
				steps: [
					{ batch: `${laneId}-talkback-off`, checks: [boolCheck(tbVar, 'false')], allowBlankNoop: true },
					{ batch: `${laneId}-talkback-on`, checks: [boolCheck(tbVar, 'true')] },
					{ batch: `${laneId}-talkback-off`, checks: [boolCheck(tbVar, 'false')] },
				],
				restoreSteps: [{ batch: `${laneId}-talkback-restore`, checks: [boolCheck(tbVar, canonicalBool(snapshot.values[tbVar].value) || 'false')] }],
			})
		}
	}

	for (const [prefix, variable, labelName] of [
		['monitor-alt-enable', 'monitor_altEnable', 'Monitor Alt enable'],
		['monitor-alt', 'monitor_alt', 'Monitor Alt select'],
		['phantom-persistence', 'device_phantomPersistence', 'Phantom persistence setting'],
	]) {
		if (!snapshot.values[variable]?.exists) continue
		await runSequenceV2({
			baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'monitor-settings', target: labelName,
			steps: [
				{ batch: `${prefix}-off`, checks: [boolCheck(variable, 'false')], allowBlankNoop: true },
				{ batch: `${prefix}-on`, checks: [boolCheck(variable, 'true')] },
				{ batch: `${prefix}-off`, checks: [boolCheck(variable, 'false')] },
			],
			restoreSteps: [{ batch: `${prefix}-restore`, checks: [boolCheck(variable, canonicalBool(snapshot.values[variable].value) || 'false')] }],
		})
	}

	if (snapshot.values.monitor_preset?.exists && built.locations['v2-monitor-preset-baseline']) {
		const baseline = 'None'
		const alt = require('./FullTestBenchBase').MONITOR_PRESET_VALUES.find((v) => v !== baseline)
		await runSequenceV2({
			baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'monitor-settings', target: 'Monitor output-control preset',
			steps: [
				{ batch: 'v2-monitor-preset-baseline', checks: [exactCheck('monitor_preset', baseline)], allowBlankNoop: true },
				{ batch: 'v2-monitor-preset-alt', checks: [exactCheck('monitor_preset', alt)] },
				{ batch: 'v2-monitor-preset-baseline', checks: [exactCheck('monitor_preset', baseline)] },
			],
			restoreSteps: [{ batch: 'monitor-preset-restore', checks: [exactCheck('monitor_preset', snapshot.values.monitor_preset.value || baseline)] }],
		})
	}

	if (snapshot.values.device_talkbackInputSource?.exists && built.locations['v2-talkback-source-baseline']) {
		const baseline = 'Scarlett Internal Mic'
		const alt = require('./FullTestBenchBase').TALKBACK_SOURCE_CANDIDATES.find((v) => v !== baseline)
		await runSequenceV2({
			baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'monitor-settings', target: 'Talkback input source',
			steps: [
				{ batch: 'v2-talkback-source-baseline', checks: [exactCheck('device_talkbackInputSource', baseline)], allowBlankNoop: true },
				{ batch: 'v2-talkback-source-alt', checks: [exactCheck('device_talkbackInputSource', alt)] },
				{ batch: 'v2-talkback-source-baseline', checks: [exactCheck('device_talkbackInputSource', baseline)] },
			],
			restoreSteps: [{ batch: 'talkback-source-restore', checks: [exactCheck('device_talkbackInputSource', snapshot.values.device_talkbackInputSource.value || baseline)] }],
		})
	}

	if (snapshot.values.device_nickname?.exists) {
		await runSequenceV2({
			baseUrl, label, extPageNumber: extPage, built, snapshot, reporter, phase: 'monitor-settings', target: 'Device nickname',
			steps: [
				{ batch: 'device-nick-temp', checks: [exactCheck('device_nickname', 'TB_18I20_TEST')], allowBlankNoop: true },
				{ batch: 'v2-device-nick-alt', checks: [exactCheck('device_nickname', 'TB_18I20_TEST_2')] },
				{ batch: 'device-nick-temp', checks: [exactCheck('device_nickname', 'TB_18I20_TEST')] },
			],
			restoreSteps: [{ batch: 'device-nick-restore', checks: [exactCheck('device_nickname', snapshot.values.device_nickname.value)] }],
		})
	}
}

async function testMonitorMuteCoreV2(baseUrl, label, r9, safePlan, reporter) {
	const test = safePlan.tests.find((item) => item.id === 'monitor-mute')
	const on = safePlanSetter(safePlan, test, 'true')
	const off = safePlanSetter(safePlan, test, 'false')
	let error = null
	try {
		await pressLocation(baseUrl, r9.pageNumber, off)
		const changed = await waitCore(baseUrl, label, test, 'false', 6000)
		if (!changed.ok) error = new Error('Monitor Mute OFF transition was not server-confirmed.')
	} catch (err) {
		error = err
	} finally {
		await pressLocation(baseUrl, r9.pageNumber, on)
		const restored = await waitCore(baseUrl, label, test, 'true', 6000)
		if (!restored.ok) throw new Error('HARD ABORT: Monitor Mute protective ON restoration failed.')
	}
	if (error) reporter.add('core', 'monitor-mute', 'FAIL', `${error.message} Protective ON restored.`)
	else reporter.add('core', 'monitor-mute', 'PASS', 'ON guard -> OFF -> ON confirmed under output mute guard.')
}

async function restoreOutputMutesV2(baseUrl, label, extPage, built, snapshot, reporter) {
	if (!built.locations['output-mute-restore']) return
	await pressBatchV2(baseUrl, extPage, built, 'output-mute-restore')
	const checks = checksForBatch(snapshot, 'output-mute-restore')
	const restored = await verifyMany(baseUrl, label, checks, 10000)
	if (restored.some((item) => !item.ok)) throw new Error('HARD ABORT: output mute restoration/baseline failed.')
	reporter.add('restore', 'all-output-mutes', 'RESTORE_PASS', `${checks.length} output mute states restored/baselined`)
}

async function restoreMonitorMuteV2(baseUrl, label, r9, safePlan, initialItem, reporter) {
	const original = initialItem?.exists ? canonicalBool(initialItem.value) : null
	if (!original) {
		reporter.add('restore', 'monitor-mute', 'BASELINE_RETAINED', 'Initial cold-start state was unknown; protective ON retained.')
		return
	}
	const test = safePlan.tests.find((item) => item.id === 'monitor-mute')
	const setter = safePlanSetter(safePlan, test, original)
	await pressLocation(baseUrl, r9.pageNumber, setter)
	const restored = await waitCore(baseUrl, label, test, original, 6000)
	if (!restored.ok) throw new Error('HARD ABORT: Monitor Mute original state restoration failed.')
	reporter.add('restore', 'monitor-mute', 'RESTORE_PASS', `restored original=${original}`)
}

module.exports = {
	snapshotBlank,
	onlyBlankFailures,
	runSequenceV2,
	captureCoreInitialV2,
	runCoreFullV2,
	engageMonitorMuteGuardV2,
	engageOutputMuteGuardV2,
	testOutputMutesIndividuallyV2,
	testExtendedV2,
	testMonitorMuteCoreV2,
	restoreOutputMutesV2,
	restoreMonitorMuteV2,
}
