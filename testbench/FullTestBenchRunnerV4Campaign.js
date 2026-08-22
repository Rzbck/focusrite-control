'use strict'

const { canonicalBool, readVariableOptional, line } = require('./FullTestBenchBase')
const { testReconnect } = require('./FullTestBenchExtendedPhases')
const {
	engageMonitorMuteGuardV2,
	restoreMonitorMuteV2,
	testMonitorMuteCoreV2,
} = require('./FullTestBenchPhasesV2')
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
const {
	sweepFeedbacksV6,
	observeMeterDynamics,
	observeMonitorGain,
} = require('./FullTestBenchFeedbackV6')

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
	let monitorGuardEngaged = false
	let muteResults = new Map()
	let sourceSafety = new Map()
	let pairGuards = new Map()
	let signalPathSafety = []
	let globalSafety = false
	let pairTopology = []

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
	line('PASS', 'Pair topology sweep', `${pairTopology.length} available/observable pairs exercised with immediate exact restore`)

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
		})
		signalPathSafety = buildSignalPathSafety(outputEligibility, sourceSafety)
		globalSafety = globalSafetyFrom(outputEligibility, sourceSafety)
		const blockers = signalPathSafety.filter((item) => !item.safe)
		line(
			globalSafety ? 'PASS' : 'INFO',
			'Global output safety',
			globalSafety
				? 'all potentially active outputs have a server-confirmed safety guard'
				: `incomplete; blockers=${blockers.map((item) => `Out${item.output}:${item.reason}`).join(', ')}`,
		)
	} catch (error) {
		if (!(await monitorStillSafe(baseUrl, label))) throw new Error(`GLOBAL SAFETY LOST: ${error.message}`)
		reporter.add(
			'safety',
			'output-safety-discovery',
			STATUS.FAIL_MISMATCH,
			`${error.message}; Monitor Mute still ON, continuing safe/metadata work.`,
		)
		signalPathSafety = buildSignalPathSafety(outputEligibility, sourceSafety)
		globalSafety = false
	}

	line('INFO', 'Phase', 'Input/output metadata')
	await testMetadataTargets({
		baseUrl,
		label,
		pageNumber: ext.pageNumber,
		built,
		snapshot,
		update,
		outputEligibility,
		muteResults,
	})

	line('INFO', 'Phase', 'Core controls')
	if (globalSafety) {
		for (const test of safePlan.tests) {
			if (test.id === 'monitor-mute') continue
			await probeCoreTarget({ baseUrl, label, r9, safePlan, test, update })
		}
	} else {
		for (const test of safePlan.tests) {
			if (test.id === 'monitor-mute') continue
			update(
				coreRowId(test),
				STATUS.BLOCKED_BY_SAFETY,
				'Signal-changing Core probe skipped because global output safety is incomplete.',
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
	})
	line('INFO', 'Phase', 'Mixer slots')
	await testMixerSlots({ baseUrl, label, pageNumber: ext.pageNumber, built, snapshot, update, globalSafety })
	line('INFO', 'Phase', 'Mixer lanes')
	await testMixLanes({ baseUrl, label, pageNumber: ext.pageNumber, built, snapshot, update, globalSafety })
	line('INFO', 'Phase', 'Monitoring / device metadata')
	await testMonitoringMetadata({ baseUrl, label, pageNumber: ext.pageNumber, built, snapshot, update, globalSafety })

	if (globalSafety) {
		try {
			line('INFO', 'Phase', 'Monitor Mute cycle')
			await testMonitorMuteCoreV2(baseUrl, label, r9, safePlan, reporter)
			update('monitor:mute', STATUS.PASS, 'Monitor Mute ON -> OFF -> ON confirmed under global output safety.', 'core')
		} catch (error) {
			update('monitor:mute', STATUS.QUARANTINED_RESTORE, `Monitor Mute cycle failed: ${error.message}`, 'core')
		}
	}

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
	line('INFO', 'Phase', 'Restore temporary individual Source=None guards')
	await restoreSourceSafety({ baseUrl, label, pageNumber: ext.pageNumber, built, sourceSafety, snapshot, update })
	line('INFO', 'Phase', 'Restore temporary pair Source=None guards')
	await restorePairSourceSafety({ baseUrl, label, pageNumber: ext.pageNumber, built, pairGuards, update })

	line('INFO', 'Phase', 'Manual feedback dynamics')
	const meterManual = await observeMeterDynamics({
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
			`Meter oracle is active; both-state manual coverage ${meterManual.bothStates}/${meterManual.total}. Remaining paths need real signal/silence observation, not an optimistic PASS.`,
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
			update(
				'monitor:mute',
				STATUS.QUARANTINED_RESTORE,
				`Original Monitor Mute state restore not confirmed: ${error.message}. Protective state may remain ON.`,
				'restore',
			)
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
		hardwareWrites: true,
		globalSafety,
		signalPathSafety,
		pairTopology,
		manualFeedback: { meter: meterManual, monitorGain: monitorGainManual },
	}
}

module.exports = { runCampaign, monitorStillSafe, globalSafetyFrom }
