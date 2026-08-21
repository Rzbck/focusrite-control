const { EXPECTED_MODEL, EXPECTED_MODULE, EXPECTED_MODULE_VERSION, R9_PAGE_NAME, R9_MARKER, EXT_MARKER, EXT_INSTANCE_ID, FILE_VERSION, COMPANION_BUILD, testbenchDir, safePlanPath, generatedDir, resultsDir, generatedPagePath, generatedManifestPath, MONITOR_PRESET_VALUES, TALKBACK_SOURCE_CANDIDATES, OUTPUT_PAIR_LEFT_INDICES, DISRUPTIVE_DEFINITIONS, FORBIDDEN_DEFINITIONS, EXTENDED_ALLOWED, nowIso, line, sleep, stableStringify, hashObject, deterministicId, canonicalBool, boolState, rawPanToPercent, expectedPanRaw, request, findCompanion, get, post, readVariableOptional, readVariable, waitVariable, waitExact, mapLimit, unwrapOptions, actionSetsContainWrites, collectActions, collectFeedbacks, pageHasMarker, resolveLiveConnection, exportButtons } = require('./FullTestBenchBase')
const { auditSafeSetters, auditR9, expectedFeedback, readFeedbackMarker, sweepFeedbacks, getR9ActionLocations, pressLocation, safePlanSetter, captureOptionalVars, uniqueBy, discoverShapeFromFeedbacks, laneBase, captureFullSnapshot, chooseTestSource } = require('./FullTestBenchAudit')
const { Reporter, pressBatch, verifyMany, exactCheck, boolCheck, numericCheck, requireChecks, runBatchSequence, checksForBatch, batchChecksForLane, recordBaselineImpacts, runCoreFull, testMonitorMuteCore, restoreMonitorMuteCore } = require('./FullTestBenchCorePhases')

async function testSimpleExtended(baseUrl, label, extPage, built, snapshot, reporter) {
	const restoreFor = (id) => checksForBatch(snapshot, id)

	await runBatchSequence({
		baseUrl,
		label,
		extPageNumber: extPage,
		built,
		reporter,
		phase: 'inputs',
		target: 'input_nickname all applicable',
		steps: [{ batch: 'input-nick-temp', checks: checksForBatch(snapshot, 'input-nick-temp') }],
		restore: { batch: 'input-nick-restore', checks: restoreFor('input-nick-restore') },
	})

	await runBatchSequence({
		baseUrl,
		label,
		extPageNumber: extPage,
		built,
		reporter,
		phase: 'outputs',
		target: 'output gain set + adjust all applicable',
		steps: [
			{ batch: 'output-gain-set', checks: checksForBatch(snapshot, 'output-gain-set') },
			{ batch: 'output-gain-adjust', checks: checksForBatch(snapshot, 'output-gain-adjust') },
		],
		restore: { batch: 'output-gain-restore', checks: restoreFor('output-gain-restore') },
	})

	await runBatchSequence({
		baseUrl,
		label,
		extPageNumber: extPage,
		built,
		reporter,
		phase: 'outputs',
		target: 'output source all applicable',
		steps: [{ batch: 'output-source-none', checks: checksForBatch(snapshot, 'output-source-none') }],
		restore: { batch: 'output-source-restore', checks: restoreFor('output-source-restore') },
	})

	await runBatchSequence({
		baseUrl,
		label,
		extPageNumber: extPage,
		built,
		reporter,
		phase: 'outputs',
		target: 'output stereo all applicable',
		steps: [
			{ batch: 'output-stereo-off', checks: checksForBatch(snapshot, 'output-stereo-off') },
			{ batch: 'output-stereo-on', checks: checksForBatch(snapshot, 'output-stereo-on') },
		],
		restore: { batch: 'output-stereo-restore', checks: restoreFor('output-stereo-restore') },
	})

	await runBatchSequence({
		baseUrl,
		label,
		extPageNumber: extPage,
		built,
		reporter,
		phase: 'outputs',
		target: 'output nickname all applicable',
		steps: [{ batch: 'output-nick-temp', checks: checksForBatch(snapshot, 'output-nick-temp') }],
		restore: { batch: 'output-nick-restore', checks: restoreFor('output-nick-restore') },
	})
}

async function testPairSource(baseUrl, label, extPage, built, snapshot, reporter) {
	if (!built.locations['pair-source-prep'] || !built.locations['pair-source-none']) return
	const checksPrep = []
	const checksNone = []
	for (const left of OUTPUT_PAIR_LEFT_INDICES) {
		if (!snapshot.shape.outputs.includes(left) || !snapshot.shape.outputs.includes(left + 1)) continue
		const right = left + 1
		const l = snapshot.values[`output_${left + 1}_source`]
		const r = snapshot.values[`output_${right + 1}_source`]
		if (!l?.exists || !r?.exists) continue
		checksPrep.push(exactCheck(`output_${left + 1}_source`, built.testSource))
		checksPrep.push(exactCheck(`output_${right + 1}_source`, built.testSource))
		checksNone.push(exactCheck(`output_${left + 1}_source`, '0'))
		checksNone.push(exactCheck(`output_${right + 1}_source`, '0'))
	}
	const restore = checksForBatch(snapshot, 'output-source-restore')
	try {
		await pressBatch(baseUrl, extPage, built, 'pair-source-prep')
		requireChecks(await verifyMany(baseUrl, label, checksPrep), 'pair source prep')
		await pressBatch(baseUrl, extPage, built, 'pair-source-none')
		requireChecks(await verifyMany(baseUrl, label, checksNone), 'pair source None branch')
		reporter.add('outputs', 'output_pair_source', 'PASS', `${checksNone.length / 2} output pairs exercised through source=None branch`)
	} finally {
		if (built.locations['pair-source-restore']) {
			await pressBatch(baseUrl, extPage, built, 'pair-source-restore')
			const restored = await verifyMany(baseUrl, label, restore, 10000)
			requireChecks(restored, 'pair source restoration')
			reporter.add('outputs', 'output_pair_source:restore', 'RESTORE_PASS', `${restored.length} individual output source restores`)
		}
	}
}

async function testMixerSlots(baseUrl, label, extPage, built, snapshot, reporter, testSource) {
	const sourceChecks = snapshot.shape.mixerSlots
		.filter((s) => snapshot.values[`mixer_slot_${s}_source`]?.exists)
		.map((s) => exactCheck(`mixer_slot_${s}_source`, testSource))
	await runBatchSequence({
		baseUrl,
		label,
		extPageNumber: extPage,
		built,
		reporter,
		phase: 'mixer-slots',
		target: 'mixer_slot_source 1-24',
		steps: [{ batch: 'mixer-source-test', checks: sourceChecks }],
		restore: { batch: 'mixer-source-restore', checks: checksForBatch(snapshot, 'mixer-source-restore') },
	})
	await runBatchSequence({
		baseUrl,
		label,
		extPageNumber: extPage,
		built,
		reporter,
		phase: 'mixer-slots',
		target: 'mixer_slot_stereo 1-24',
		steps: [
			{ batch: 'mixer-stereo-off', checks: checksForBatch(snapshot, 'mixer-stereo-off') },
			{ batch: 'mixer-stereo-on', checks: checksForBatch(snapshot, 'mixer-stereo-on') },
		],
		restore: { batch: 'mixer-stereo-restore', checks: checksForBatch(snapshot, 'mixer-stereo-restore') },
	})
}

async function testMixLanes(baseUrl, label, extPage, built, snapshot, reporter) {
	for (const lane of snapshot.shape.lanes) {
		const laneId = `${lane.mix.replace(/\s+/g, '').toLowerCase()}-${lane.side[0]}`
		line('INFO', 'Mixer lane', `${lane.mix} ${lane.side}`)
		for (const prop of ['mute', 'solo']) {
			await runBatchSequence({
				baseUrl,
				label,
				extPageNumber: extPage,
				built,
				reporter,
				phase: 'mix-lanes',
				target: `${lane.mix} ${lane.side} ${prop} slots 1-24`,
				steps: [
					{ batch: `${laneId}-${prop}-off`, checks: batchChecksForLane(snapshot, lane, { property: prop, kind: 'bool', value: 'false' }) },
					{ batch: `${laneId}-${prop}-on`, checks: batchChecksForLane(snapshot, lane, { property: prop, kind: 'bool', value: 'true' }) },
				],
				restore: { batch: `${laneId}-${prop}-restore`, checks: batchChecksForLane(snapshot, lane, { property: prop, kind: 'bool', restore: true }) },
			})
		}
		await runBatchSequence({
			baseUrl,
			label,
			extPageNumber: extPage,
			built,
			reporter,
			phase: 'mix-lanes',
			target: `${lane.mix} ${lane.side} gain slots 1-24`,
			steps: [
				{ batch: `${laneId}-gain-set`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-128' }) },
				{ batch: `${laneId}-gain-adjust`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', value: '-127' }) },
			],
			restore: { batch: `${laneId}-gain-restore`, checks: batchChecksForLane(snapshot, lane, { property: 'gain', kind: 'exact', restore: true }) },
		})
		await runBatchSequence({
			baseUrl,
			label,
			extPageNumber: extPage,
			built,
			reporter,
			phase: 'mix-lanes',
			target: `${lane.mix} ${lane.side} pan slots 1-24`,
			steps: [
				{ batch: `${laneId}-pan-center`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 0 }) },
				{ batch: `${laneId}-pan-right`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', value: 25 }) },
			],
			restore: { batch: `${laneId}-pan-restore`, checks: batchChecksForLane(snapshot, lane, { property: 'pan', kind: 'exact', restore: true }) },
		})
		const tbVar = `${laneBase(lane)}_talkback`
		const tb = snapshot.values[tbVar]
		if (tb?.exists) {
			await runBatchSequence({
				baseUrl,
				label,
				extPageNumber: extPage,
				built,
				reporter,
				phase: 'mix-lanes',
				target: `${lane.mix} ${lane.side} talkback map`,
				steps: [
					{ batch: `${laneId}-talkback-off`, checks: [boolCheck(tbVar, 'false')] },
					{ batch: `${laneId}-talkback-on`, checks: [boolCheck(tbVar, 'true')] },
				],
				restore: { batch: `${laneId}-talkback-restore`, checks: [boolCheck(tbVar, canonicalBool(tb.value) || 'false')] },
			})
		}
	}
}

async function testMonitoringSettings(baseUrl, label, extPage, built, snapshot, reporter) {
	const v = (name) => snapshot.values[name]
	const boolSequence = async (prefix, variable, phaseName) => {
		if (!v(variable)?.exists || !built.locations[`${prefix}-off`] || !built.locations[`${prefix}-on`]) return
		const restore = { batch: `${prefix}-restore`, checks: [boolCheck(variable, canonicalBool(v(variable).value) || 'false')] }
		await runBatchSequence({
			baseUrl,
			label,
			extPageNumber: extPage,
			built,
			reporter,
			phase: 'monitor-settings',
			target: phaseName,
			steps: [
				{ batch: `${prefix}-off`, checks: [boolCheck(variable, 'false')] },
				{ batch: `${prefix}-on`, checks: [boolCheck(variable, 'true')] },
			],
			restore,
		})
	}
	await boolSequence('monitor-alt-enable', 'monitor_altEnable', 'Monitor Alt enable')
	await boolSequence('monitor-alt', 'monitor_alt', 'Monitor Alt select')
	await boolSequence('phantom-persistence', 'device_phantomPersistence', 'Phantom persistence setting')

	if (v('monitor_preset')?.exists && built.locations['monitor-preset-test']) {
		const initial = v('monitor_preset').value
		const alternate = MONITOR_PRESET_VALUES.find((x) => x !== initial) || MONITOR_PRESET_VALUES[0]
		await runBatchSequence({
			baseUrl,
			label,
			extPageNumber: extPage,
			built,
			reporter,
			phase: 'monitor-settings',
			target: 'Monitor output-control preset',
			steps: [{ batch: 'monitor-preset-test', checks: [exactCheck('monitor_preset', alternate)] }],
			restore: { batch: 'monitor-preset-restore', checks: [exactCheck('monitor_preset', initial || 'None')] },
		})
	}
	if (v('device_talkbackInputSource')?.exists && built.locations['talkback-source-test']) {
		const initial = v('device_talkbackInputSource').value
		const alternate = TALKBACK_SOURCE_CANDIDATES.find((x) => x !== initial) || TALKBACK_SOURCE_CANDIDATES[0]
		await runBatchSequence({
			baseUrl,
			label,
			extPageNumber: extPage,
			built,
			reporter,
			phase: 'monitor-settings',
			target: 'Talkback input source',
			steps: [{ batch: 'talkback-source-test', checks: [exactCheck('device_talkbackInputSource', alternate)] }],
			restore: { batch: 'talkback-source-restore', checks: [exactCheck('device_talkbackInputSource', initial || 'Scarlett Internal Mic')] },
		})
	}
	if (v('device_nickname')?.exists && built.locations['device-nick-temp']) {
		await runBatchSequence({
			baseUrl,
			label,
			extPageNumber: extPage,
			built,
			reporter,
			phase: 'monitor-settings',
			target: 'Device nickname',
			steps: [{ batch: 'device-nick-temp', checks: [exactCheck('device_nickname', 'TB_18I20_TEST')] }],
			restore: { batch: 'device-nick-restore', checks: [exactCheck('device_nickname', v('device_nickname').value)] },
		})
	}
}

async function testReconnect(baseUrl, label, r9, reporter) {
	const locations = getR9ActionLocations(r9.page)
	const reconnect = locations.get('reconnect')?.[0]
	if (!reconnect) {
		reporter.add('connection', 'reconnect', 'SKIP', 'No reconnect action exists on the current r9 page.')
		return
	}
	await pressLocation(baseUrl, r9.pageNumber, reconnect)
	const status = await waitVariable(baseUrl, label, 'connection_status', (v) => /Connected \/ authorised/i.test(v), 20000)
	const auth = await waitVariable(baseUrl, label, 'client_authorised', (v) => canonicalBool(v) === 'true', 20000)
	if (!status.ok || !auth.ok) throw new Error('Reconnect action did not return to Connected / authorised.')
	reporter.add('connection', 'reconnect', 'PASS', 'connection returned authorised')
}


module.exports = { testSimpleExtended, testPairSource, testMixerSlots, testMixLanes, testMonitoringSettings, testReconnect }
