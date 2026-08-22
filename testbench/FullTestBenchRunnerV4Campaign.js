'use strict'

const { canonicalBool, readVariableOptional, line } = require('./FullTestBenchBase')
const { testReconnect } = require('./FullTestBenchExtendedPhases')
const { engageMonitorMuteGuardV2, restoreMonitorMuteV2 } = require('./FullTestBenchPhasesV2')
const { STATUS } = require('./FullTestBenchCapabilityV4')
const { rowUpdater } = require('./FullTestBenchV4Common')
const { probeCoreTarget, coreRowId } = require('./FullTestBenchCoreV4')
const {
	probeOutputMutes,
	establishSourceNoneSafety,
	restoreSourceSafety,
	testMetadataTargets,
	testOutputFamilies,
} = require('./FullTestBenchOutputsV4')
const { testOutputPairSource } = require('./FullTestBenchPairsV4')
const {
	buildSignalPathSafety,
	establishPairSourceSafety,
	restorePairSourceSafety,
} = require('./FullTestBenchPairSafetyV5')
const { testMixerSlots, testMixLanes } = require('./FullTestBenchMixerV4')
const { testMonitoringMetadata } = require('./FullTestBenchMonitorV4')
const { sweepPairTopology } = require('./FullTestBenchTopologyV6')
const { derivePairOwnership } = require('./FullTestBenchOwnershipV7')
const {
	sweepFeedbacksV6,
	createTransitionFeedbackObserver,
	observeMeterDynamicsV7,
	observeMonitorGain,
} = require('./FullTestBenchFeedbackV7')

const ROUTING_ISOLATION_FLAG = '--confirm-all-output-routing-isolated'

async function monitorStillSafe(baseUrl, label) {
	const item = await readVariableOptional(baseUrl, label, 'monitor_mute', 2500)
	return item.exists && canonicalBool(item.value) === 'true'
}

function globalSafetyFrom(outputEligibility, sourceSafety) {
	return outputEligibility.every(
		(row) => row.availability === 'UNAVAILABLE' || sourceSafety.get(row.output)?.safe === true,
	)
}

async function runCampaign(ctx, reporter) {
	const {
		baseUrl,
		label,
		r9,
		safePlan,
		profile,
		snapshot,
		coreInitial,
		inventory,
		outputEligibility,
		built,
		ext,
	} = ctx
	const update = rowUpdater(inventory, reporter)
	const manualFeedbackEnabled = process.argv.includes('--manual-feedback')
	const physicalIsolationConfirmed = process.argv.includes(ROUTING_ISOLATION_FLAG)
	const hardAbortOnRestoreFailure = physicalIsolationConfirmed
	const transitionFeedback = createTransitionFeedbackObserver({ baseUrl, label, r9 })
	const observeVariable = transitionFeedback.observeVariable.bind(transitionFeedback)
	const observeVariables = transitionFeedback.observeVariables.bind(transitionFeedback)
	let monitorGuardEngaged = false
	let muteResults = new Map()
	let sourceSafety = new Map()
	let pairGuards = new Map()
	let signalPathSafety = []
	let globalSafety = false
	let pairTopology = []
	let pairOwnership = new Map()

	const feedbackBefore = await sweepFeedbacksV6(baseUrl, label, r9, reporter, 'feedback-before')
	if (feedbackBefore.fail) {
		for (const row of inventory.rows) {
			if (row.status === 'DISCOVERED') {
				row.status = STATUS.BLOCKED_BY_SAFETY
				row.detail = 'Pre-write r9 feedback sweep contains failures; hardware campaign blocked.'
			}
		}
		return { feedbackBefore, feedbackAfter: null, hardwareWrites: false, blockedBeforeHardware: true }
	}

	line('INFO', 'Phase', 'Protective Monitor Mute')
	await engageMonitorMuteGuardV2(baseUrl, label, r9, safePlan, coreInitial.monitor_mute, reporter)
	monitorGuardEngaged = true
	update(
		'monitor:mute',
		STATUS.PASS_BASELINE,
		'Protective Monitor Mute ON server-confirmed before signal-path tests.',
		'safety',
	)
	await observeVariable('monitor_mute')

	line('INFO', 'Phase', 'Device-wide output-pair topology sweep')
	pairTopology = await sweepPairTopology({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		profile,
		outputEligibility,
		update,
	})
	pairOwnership = derivePairOwnership(pairTopology)
	line(
		'PASS',
		'Pair topology sweep',
		`${pairTopology.length} available/observable pairs exercised with immediate exact restore; runtime ownership derived for ${[...pairOwnership.values()].filter((item) => item.role === 'pair-owned-right').length} right members`,
	)

	try {
		line('INFO', 'Phase', 'Output mute capability / pair-alias discovery')
		muteResults = await probeOutputMutes({
			baseUrl,
			label,
			pageNumber: ext.pageNumber,
			built,
			snapshot,
			outputEligibility,
			profile,
			update,
			reporter,
			hardAbortOnRestoreFailure,
			observeVariable,
		})
		if (!(await monitorStillSafe(baseUrl, label))) {
			throw new Error('GLOBAL SAFETY LOST: Monitor Mute is no longer server-confirmed ON.')
		}
		line('INFO', 'Phase', 'Output safety guards (confirmed mute / passive mute / individual Source=None)')
		sourceSafety = await establishSourceNoneSafety({
			baseUrl,
			label,
			pageNumber: ext.pageNumber,
			built,
			snapshot,
			outputEligibility,
			muteResults,
			update,
			pairOwnership,
		})
		line('INFO', 'Phase', 'Pair-aware Source=None safety guards')
		pairGuards = await establishPairSourceSafety({
			baseUrl,
			label,
			pageNumber: ext.pageNumber,
			built,
			snapshot,
			profile,
			outputEligibility,
			sourceSafety,
			update,
			pairOwnership,
			hardAbortOnRestoreFailure,
		})
		signalPathSafety = buildSignalPathSafety(outputEligibility, sourceSafety)
		globalSafety = globalSafetyFrom(outputEligibility, sourceSafety)
		const blockers = signalPathSafety.filter((item) => !item.safe)
		line(
			globalSafety ? 'PASS' : 'INFO',
			'Global output safety',
			globalSafety
				? 'all potentially active outputs have a server-confirmed safety guard'
				: `server-side guard incomplete; blockers=${blockers.map((item) => `Out${item.output}:${item.reason}`).join(', ')}`,
		)
		if (!globalSafety && physicalIsolationConfirmed) {
			line(
				'PASS',
				'Physical isolation gate',
				'ALL_ISOLATED is explicitly confirmed; reversible signal-path tests may continue with exact local restoration and hard abort on restore failure.',
			)
		}
	} catch (error) {
		if (/^RESTORE FAILED:|GLOBAL SAFETY LOST:/i.test(error.message)) throw error
		if (!(await monitorStillSafe(baseUrl, label))) throw new Error(`GLOBAL SAFETY LOST: ${error.message}`)
		reporter.add(
			'safety',
			'output-safety-discovery',
			STATUS.FAIL_MISMATCH,
			`${error.message}; Monitor Mute still ON, continuing only under explicit physical isolation where allowed.`,
		)
		signalPathSafety = buildSignalPathSafety(outputEligibility, sourceSafety)
		globalSafety = false
	}

	const signalTestsAllowed = globalSafety || physicalIsolationConfirmed

	line('INFO', 'Phase', 'Input/output metadata')
	await testMetadataTargets({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		update,
		outputEligibility,
		hardAbortOnRestoreFailure,
		observeVariable,
	})

	line('INFO', 'Phase', 'Core controls')
	if (signalTestsAllowed) {
		for (const test of safePlan.tests) {
			if (test.id === 'monitor-mute') continue
			await probeCoreTarget({
				baseUrl,
				label,
				r9,
				safePlan,
				test,
				update,
				hardAbortOnRestoreFailure,
				observeVariable,
			})
		}
	} else {
		for (const test of safePlan.tests) {
			if (test.id === 'monitor-mute') continue
			update(
				coreRowId(test),
				STATUS.BLOCKED_BY_SAFETY,
				'Signal-changing Core probe skipped because neither server-side global safety nor explicit physical isolation is available.',
				'core',
			)
		}
	}

	line('INFO', 'Phase', 'Output source/gain/stereo families')
	await testOutputFamilies({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		profile,
		muteResults,
		update,
		outputEligibility,
		pairOwnership,
		isolationConfirmed: physicalIsolationConfirmed,
		hardAbortOnRestoreFailure,
		observeVariable,
	})
	line('INFO', 'Phase', 'Output pair source families')
	await testOutputPairSource({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		profile,
		muteResults,
		outputEligibility,
		update,
		pairGuards,
		pairTopology,
		hardAbortOnRestoreFailure,
	})
	line('INFO', 'Phase', 'Mixer slots')
	await testMixerSlots({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		update,
		globalSafety,
		signalTestsAllowed,
		hardAbortOnRestoreFailure,
		observeVariable,
	})
	line('INFO', 'Phase', 'Mixer lanes')
	await testMixLanes({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		update,
		globalSafety,
		signalTestsAllowed,
		hardAbortOnRestoreFailure,
		observeVariable,
		observeVariables,
	})
	line('INFO', 'Phase', 'Monitoring / device metadata')
	await testMonitoringMetadata({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		update,
		globalSafety,
		signalTestsAllowed,
		hardAbortOnRestoreFailure,
		observeVariable,
	})

	if (signalTestsAllowed) {
		line('INFO', 'Phase', 'Monitor Mute guarded dynamic cycle')
		const monitorMuteTest = safePlan.tests.find((test) => test.id === 'monitor-mute')
		await probeCoreTarget({
			baseUrl,
			label,
			r9,
			safePlan,
			test: monitorMuteTest,
			update,
			hardAbortOnRestoreFailure,
			observeVariable,
		})
	}

	if (!physicalIsolationConfirmed) {
		for (const [output, safety] of sourceSafety.entries()) {
			if (safety.restoreNeeded && muteResults.get(output)?.safetyConfirmed !== true) {
				safety.restoreNeeded = false
				update(
					`output:${output + 1}:source`,
					STATUS.QUARANTINED_RESTORE,
					'Source=None retained because this output lacks confirmed mute safety; restore saved Focusrite configuration after the lab.',
					'restore',
				)
			}
		}
	}
	line('INFO', 'Phase', 'Restore temporary individual Source=None guards')
	await restoreSourceSafety({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		sourceSafety,
		snapshot,
		update,
		hardAbortOnRestoreFailure,
	})
	line('INFO', 'Phase', 'Restore temporary pair Source=None guards')
	await restorePairSourceSafety({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		pairGuards,
		update,
		hardAbortOnRestoreFailure,
	})

	line('INFO', 'Phase', 'Manual feedback dynamics')
	const meterManual = await observeMeterDynamicsV7({
		baseUrl,
		label,
		r9,
		enabled: manualFeedbackEnabled,
	})
	if (meterManual.fail) {
		update(
			'manual:feedback-meter-dynamics',
			STATUS.FAIL_MISMATCH,
			`Manual meter observation found ${meterManual.fail} rendered/server threshold mismatches; both-state coverage ${meterManual.bothStates}/${meterManual.total}.`,
			'manual-feedback',
		)
	} else if (meterManual.attempted && meterManual.bothStates === meterManual.total) {
		update(
			'manual:feedback-meter-dynamics',
			'PASS_MANUAL',
			`All ${meterManual.total} meter feedback probes were observed in both threshold states with server-confirmed agreement.`,
			'manual-feedback',
		)
	} else {
		update(
			'manual:feedback-meter-dynamics',
			'MANUAL_PENDING',
			`Phased meter oracle coverage: both states ${meterManual.bothStates}/${meterManual.total}, single state ${meterManual.singleState}, never observed ${meterManual.neverObserved}. Remaining paths need real targeted signal, not an optimistic PASS.`,
			'manual-feedback',
		)
	}

	line('INFO', 'Phase', 'Manual read-only Monitor gain observation')
	const monitorGainManual = await observeMonitorGain({ baseUrl, label, enabled: manualFeedbackEnabled })
	update(
		'manual:monitor-gain-readback',
		monitorGainManual.status,
		monitorGainManual.status === 'PASS_MANUAL'
			? 'Physical Monitor movement changed read-only item 1677 and the original server value was observed again after manual return.'
			: monitorGainManual.status === STATUS.SKIP_NO_CAPABILITY
				? 'Monitor gain read-only variable is not exposed in this live session.'
				: monitorGainManual.changed
					? 'Physical Monitor movement was observed, but exact manual return to the starting server value remains pending.'
					: 'Physical Monitor readback exercise remains pending; no software write was attempted.',
		'manual-feedback',
	)

	const feedbackDynamic = transitionFeedback.summary()
	line(
		feedbackDynamic.fail ? 'FAIL' : 'PASS',
		'Dynamic feedback coverage',
		`both-state=${feedbackDynamic.bothStates}/${feedbackDynamic.total} single-state=${feedbackDynamic.singleState} never-observed=${feedbackDynamic.neverObserved} mismatches=${feedbackDynamic.fail}`,
	)

	const feedbackAfter = await sweepFeedbacksV6(baseUrl, label, r9, reporter, 'feedback-after')
	if (feedbackAfter.fail) {
		reporter.add(
			'feedback',
			'feedback-after',
			STATUS.FAIL_MISMATCH,
			`${feedbackAfter.fail} rendered/independent mismatches after hardware campaign.`,
		)
	}

	if (monitorGuardEngaged) {
		try {
			line('INFO', 'Phase', 'Restore original Monitor Mute')
			await restoreMonitorMuteV2(baseUrl, label, r9, safePlan, coreInitial.monitor_mute, reporter)
		} catch (error) {
			const detail = `Original Monitor Mute state restore not confirmed: ${error.message}. Protective state may remain ON.`
			update('monitor:mute', STATUS.QUARANTINED_RESTORE, detail, 'restore')
			if (hardAbortOnRestoreFailure) throw new Error(`RESTORE FAILED: monitor:mute; ${detail}`)
		}
	}

	try {
		line('INFO', 'Phase', 'Reconnect validation (no writes after reconnect)')
		await testReconnect(baseUrl, label, r9, reporter)
		update('connection:reconnect', STATUS.PASS, 'Reconnect returned to Connected / authorised.', 'connection')
	} catch (error) {
		update('connection:reconnect', STATUS.FAIL_NO_EFFECT, `Reconnect validation failed: ${error.message}`, 'connection')
	}

	return {
		feedbackBefore,
		feedbackAfter,
		feedbackDynamic,
		hardwareWrites: true,
		globalSafety,
		physicalIsolationConfirmed,
		signalPathSafety,
		pairTopology,
		manualFeedback: { meter: meterManual, monitorGain: monitorGainManual },
	}
}

module.exports = { runCampaign, monitorStillSafe, globalSafetyFrom }
