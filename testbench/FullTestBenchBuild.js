const { EXPECTED_MODEL, EXPECTED_MODULE, EXPECTED_MODULE_VERSION, R9_PAGE_NAME, R9_MARKER, EXT_MARKER, EXT_INSTANCE_ID, FILE_VERSION, COMPANION_BUILD, testbenchDir, safePlanPath, generatedDir, resultsDir, generatedPagePath, generatedManifestPath, MONITOR_PRESET_VALUES, TALKBACK_SOURCE_CANDIDATES, OUTPUT_PAIR_LEFT_INDICES, DISRUPTIVE_DEFINITIONS, FORBIDDEN_DEFINITIONS, EXTENDED_ALLOWED, nowIso, line, sleep, stableStringify, hashObject, deterministicId, canonicalBool, boolState, rawPanToPercent, expectedPanRaw, request, findCompanion, get, post, readVariableOptional, readVariable, waitVariable, waitExact, mapLimit, unwrapOptions, actionSetsContainWrites, collectActions, collectFeedbacks, pageHasMarker, resolveLiveConnection, exportButtons } = require('./FullTestBenchBase')
const { auditSafeSetters, auditR9, expectedFeedback, readFeedbackMarker, sweepFeedbacks, getR9ActionLocations, pressLocation, safePlanSetter, captureOptionalVars, uniqueBy, discoverShapeFromFeedbacks, laneBase, captureFullSnapshot, chooseTestSource } = require('./FullTestBenchAudit')

function publicSnapshot(snapshot, testSource) {
	const values = Object.fromEntries(
		Object.entries(snapshot.values).map(([name, item]) => [name, { exists: item.exists, value: item.value }])
	)
	return { shape: snapshot.shape, values, testSource }
}

function exprValue(value) {
	return { value, isExpression: false }
}

function actionEntity(definitionId, options, salt) {
	if (!EXTENDED_ALLOWED.has(definitionId)) throw new Error(`Generator refused non-Extended action ${definitionId}.`)
	if (DISRUPTIVE_DEFINITIONS.has(definitionId) || FORBIDDEN_DEFINITIONS.has(definitionId)) {
		throw new Error(`Generator refused unsafe action ${definitionId}.`)
	}
	return {
		type: 'action',
		id: deterministicId(`${salt}/${definitionId}/${stableStringify(options)}`),
		definitionId,
		connectionId: EXT_INSTANCE_ID,
		options: Object.fromEntries(Object.entries(options).map(([key, value]) => [key, exprValue(value)])),
		upgradeIndex: 0,
	}
}

function buttonLayers(label) {
	return [
		{
			id: 'canvas',
			name: 'Canvas',
			usage: 'auto',
			type: 'canvas',
			decoration: exprValue('default'),
			showStatusIcons: exprValue('default'),
		},
		{
			id: 'box0',
			name: 'Background',
			usage: 'auto',
			type: 'box',
			enabled: exprValue(true),
			opacity: exprValue(100),
			x: exprValue(0),
			y: exprValue(0),
			width: exprValue(100),
			height: exprValue(100),
			rotation: exprValue(0),
			color: exprValue(0),
			borderWidth: exprValue(0),
			borderColor: exprValue(0),
			borderPosition: exprValue('inside'),
		},
		{
			id: 'text0',
			name: 'Text',
			usage: 'auto',
			type: 'text',
			enabled: exprValue(true),
			opacity: exprValue(100),
			x: exprValue(0),
			y: exprValue(0),
			width: exprValue(100),
			height: exprValue(100),
			rotation: exprValue(0),
			text: exprValue(label),
			color: exprValue(0xffffff),
			halign: exprValue('center'),
			valign: exprValue('center'),
			fontsize: exprValue(11),
			fontsizeAllowShrink: exprValue(true),
			font: exprValue('companion-sans'),
			outlineColor: exprValue(0xff000000),
		},
	]
}

function buildButton(label, batchId, actions, signature) {
	return {
		type: 'button-layered',
		feedbacks: [],
		steps: {
			0: {
				action_sets: { down: actions },
				options: { runWhileHeld: [] },
			},
		},
		localVariables: [],
		options: {
			stepProgression: 'auto',
			stepExpression: '',
			rotaryActions: false,
			canModifyStyleInApis: false,
			notes: `${EXT_MARKER}:${signature}:${batchId}`,
		},
		style: { layers: buttonLayers(label) },
	}
}

function addBatch(batches, id, label, specs) {
	if (!specs.length) return
	batches.push({ id, label, specs })
}

function restoreSpec(definitionId, options) {
	return { definitionId, options }
}

function buildExtendedBatches(snapshot, testSource) {
	const batches = []
	const { shape, values } = snapshot
	const value = (name) => values[name] || { exists: false, value: '' }

	const outputMuteOn = []
	const outputMuteRestore = []
	const outputSourceNone = []
	const outputSourceRestore = []
	const outputGainSet = []
	const outputGainAdjust = []
	const outputGainRestore = []
	const outputNickTemp = []
	const outputNickRestore = []
	const outputStereoOff = []
	const outputStereoOn = []
	const outputStereoRestore = []
	const pairPrep = []
	const pairNone = []
	const pairRestore = []

	for (const o of shape.outputs) {
		const idx = String(o)
		const mute = value(`output_${o + 1}_mute`)
		if (mute.exists) {
			outputMuteOn.push(restoreSpec('output_mute', { output: idx, scope: 'single', state: 'on' }))
			outputMuteRestore.push(restoreSpec('output_mute', { output: idx, scope: 'single', state: canonicalBool(mute.value) ? boolState(mute.value) : 'on' }))
		}
		const source = value(`output_${o + 1}_source`)
		if (source.exists) {
			outputSourceNone.push(restoreSpec('output_source', { output: idx, source: '0' }))
			outputSourceRestore.push(restoreSpec('output_source', { output: idx, source: source.value !== '' ? source.value : '0' }))
		}
		const gain = value(`output_${o + 1}_gain`)
		if (gain.exists) {
			outputGainSet.push(restoreSpec('output_gain_set', { output: idx, level: -128 }))
			outputGainAdjust.push(restoreSpec('output_gain_adjust', { output: idx, step: 1 }))
			outputGainRestore.push(restoreSpec('output_gain_set', { output: idx, level: gain.value !== '' && Number.isFinite(Number(gain.value)) ? Number(gain.value) : -128 }))
		}
		const nick = value(`output_${o + 1}_nickname`)
		if (nick.exists) {
			outputNickTemp.push(restoreSpec('output_nickname', { output: idx, name: `TB_OUT_${String(o + 1).padStart(2, '0')}` }))
			outputNickRestore.push(restoreSpec('output_nickname', { output: idx, name: nick.value }))
		}
		const stereo = value(`output_${o + 1}_stereo`)
		if (stereo.exists) {
			outputStereoOff.push(restoreSpec('output_stereo', { output: idx, state: 'off' }))
			outputStereoOn.push(restoreSpec('output_stereo', { output: idx, state: 'on' }))
			outputStereoRestore.push(restoreSpec('output_stereo', { output: idx, state: canonicalBool(stereo.value) ? boolState(stereo.value) : 'off' }))
		}
	}
	for (const left of OUTPUT_PAIR_LEFT_INDICES) {
		if (!shape.outputs.includes(left) || !shape.outputs.includes(left + 1)) continue
		const right = left + 1
		const leftSource = value(`output_${left + 1}_source`)
		const rightSource = value(`output_${right + 1}_source`)
		if (!leftSource.exists || !rightSource.exists) continue
		pairPrep.push(restoreSpec('output_source', { output: String(left), source: testSource }))
		pairPrep.push(restoreSpec('output_source', { output: String(right), source: testSource }))
		pairNone.push(restoreSpec('output_pair_source', { output: String(left), source: '0' }))
		pairRestore.push(restoreSpec('output_source', { output: String(left), source: leftSource.value !== '' ? leftSource.value : '0' }))
		pairRestore.push(restoreSpec('output_source', { output: String(right), source: rightSource.value !== '' ? rightSource.value : '0' }))
	}

	addBatch(batches, 'output-mute-on', 'OUTPUT\nMUTE ALL', outputMuteOn)
	addBatch(batches, 'output-mute-restore', 'OUTPUT\nMUTE RESTORE', outputMuteRestore)
	addBatch(batches, 'output-source-none', 'OUTPUT\nSOURCE NONE', outputSourceNone)
	addBatch(batches, 'output-source-restore', 'OUTPUT\nSOURCE RESTORE', outputSourceRestore)
	addBatch(batches, 'output-gain-set', 'OUTPUT\nGAIN -128', outputGainSet)
	addBatch(batches, 'output-gain-adjust', 'OUTPUT\nGAIN +1', outputGainAdjust)
	addBatch(batches, 'output-gain-restore', 'OUTPUT\nGAIN RESTORE', outputGainRestore)
	addBatch(batches, 'output-nick-temp', 'OUTPUT\nNICK TEST', outputNickTemp)
	addBatch(batches, 'output-nick-restore', 'OUTPUT\nNICK RESTORE', outputNickRestore)
	addBatch(batches, 'output-stereo-off', 'OUTPUT\nSTEREO OFF', outputStereoOff)
	addBatch(batches, 'output-stereo-on', 'OUTPUT\nSTEREO ON', outputStereoOn)
	addBatch(batches, 'output-stereo-restore', 'OUTPUT\nSTEREO RESTORE', outputStereoRestore)
	addBatch(batches, 'pair-source-prep', 'PAIR SRC\nPREP', pairPrep)
	addBatch(batches, 'pair-source-none', 'PAIR SRC\nNONE', pairNone)
	addBatch(batches, 'pair-source-restore', 'PAIR SRC\nRESTORE', pairRestore)

	const inputNickTemp = []
	const inputNickRestore = []
	for (const i of shape.inputs) {
		const nick = value(`input_${i + 1}_nickname`)
		if (!nick.exists) continue
		inputNickTemp.push(restoreSpec('input_nickname', { input: String(i), name: `TB_IN_${String(i + 1).padStart(2, '0')}` }))
		inputNickRestore.push(restoreSpec('input_nickname', { input: String(i), name: nick.value }))
	}
	addBatch(batches, 'input-nick-temp', 'INPUT\nNICK TEST', inputNickTemp)
	addBatch(batches, 'input-nick-restore', 'INPUT\nNICK RESTORE', inputNickRestore)

	const mixerSourceTest = []
	const mixerSourceRestore = []
	const mixerStereoOff = []
	const mixerStereoOn = []
	const mixerStereoRestore = []
	for (const slot of shape.mixerSlots) {
		const source = value(`mixer_slot_${slot}_source`)
		if (source.exists) {
			mixerSourceTest.push(restoreSpec('mixer_slot_source', { slot, source: testSource }))
			mixerSourceRestore.push(restoreSpec('mixer_slot_source', { slot, source: source.value !== '' ? source.value : testSource }))
		}
		const stereo = value(`mixer_slot_${slot}_stereo`)
		if (stereo.exists) {
			mixerStereoOff.push(restoreSpec('mixer_slot_stereo', { slot, state: 'off' }))
			mixerStereoOn.push(restoreSpec('mixer_slot_stereo', { slot, state: 'on' }))
			mixerStereoRestore.push(restoreSpec('mixer_slot_stereo', { slot, state: canonicalBool(stereo.value) ? boolState(stereo.value) : 'off' }))
		}
	}
	addBatch(batches, 'mixer-source-test', 'MIXER SLOT\nSOURCE TEST', mixerSourceTest)
	addBatch(batches, 'mixer-source-restore', 'MIXER SLOT\nSOURCE RESTORE', mixerSourceRestore)
	addBatch(batches, 'mixer-stereo-off', 'MIXER SLOT\nSTEREO OFF', mixerStereoOff)
	addBatch(batches, 'mixer-stereo-on', 'MIXER SLOT\nSTEREO ON', mixerStereoOn)
	addBatch(batches, 'mixer-stereo-restore', 'MIXER SLOT\nSTEREO RESTORE', mixerStereoRestore)

	for (const lane of shape.lanes) {
		const base = laneBase(lane)
		const laneId = `${lane.mix.replace(/\s+/g, '').toLowerCase()}-${lane.side[0]}`
		const common = (slot) => ({ mix: lane.mix, side: lane.side, slot })
		const muteOff = []
		const muteOn = []
		const muteRestore = []
		const soloOff = []
		const soloOn = []
		const soloRestore = []
		const gainSet = []
		const gainAdjust = []
		const gainRestore = []
		const panCenter = []
		const panRight = []
		const panRestore = []
		for (let slot = 1; slot <= 24; slot++) {
			const mute = value(`${base}_slot_${slot}_mute`)
			if (mute.exists) {
				muteOff.push(restoreSpec('mix_mute', { ...common(slot), state: 'off' }))
				muteOn.push(restoreSpec('mix_mute', { ...common(slot), state: 'on' }))
				muteRestore.push(restoreSpec('mix_mute', { ...common(slot), state: canonicalBool(mute.value) ? boolState(mute.value) : 'on' }))
			}
			const solo = value(`${base}_slot_${slot}_solo`)
			if (solo.exists) {
				soloOff.push(restoreSpec('mix_solo', { ...common(slot), state: 'off' }))
				soloOn.push(restoreSpec('mix_solo', { ...common(slot), state: 'on' }))
				soloRestore.push(restoreSpec('mix_solo', { ...common(slot), state: canonicalBool(solo.value) ? boolState(solo.value) : 'off' }))
			}
			const gain = value(`${base}_slot_${slot}_gain`)
			if (gain.exists) {
				gainSet.push(restoreSpec('mix_gain_set', { ...common(slot), level: -128 }))
				gainAdjust.push(restoreSpec('mix_gain_adjust', { ...common(slot), step: 1 }))
				if (gain.value !== '' && Number.isFinite(Number(gain.value))) {
					gainRestore.push(restoreSpec('mix_gain_set', { ...common(slot), level: Number(gain.value) }))
				}
			}
			const pan = value(`${base}_slot_${slot}_pan`)
			if (pan.exists) {
				panCenter.push(restoreSpec('mix_pan', { ...common(slot), pan: 0 }))
				panRight.push(restoreSpec('mix_pan', { ...common(slot), pan: 25 }))
				if (pan.value !== '' && Number.isFinite(Number(pan.value))) {
					panRestore.push(restoreSpec('mix_pan', { ...common(slot), pan: rawPanToPercent(pan.value) }))
				}
			}
		}
		addBatch(batches, `${laneId}-mute-off`, `${lane.mix} ${lane.side}\nMUTE OFF`, muteOff)
		addBatch(batches, `${laneId}-mute-on`, `${lane.mix} ${lane.side}\nMUTE ON`, muteOn)
		addBatch(batches, `${laneId}-mute-restore`, `${lane.mix} ${lane.side}\nMUTE RESTORE`, muteRestore)
		addBatch(batches, `${laneId}-solo-off`, `${lane.mix} ${lane.side}\nSOLO OFF`, soloOff)
		addBatch(batches, `${laneId}-solo-on`, `${lane.mix} ${lane.side}\nSOLO ON`, soloOn)
		addBatch(batches, `${laneId}-solo-restore`, `${lane.mix} ${lane.side}\nSOLO RESTORE`, soloRestore)
		addBatch(batches, `${laneId}-gain-set`, `${lane.mix} ${lane.side}\nGAIN -128`, gainSet)
		addBatch(batches, `${laneId}-gain-adjust`, `${lane.mix} ${lane.side}\nGAIN +1`, gainAdjust)
		addBatch(batches, `${laneId}-gain-restore`, `${lane.mix} ${lane.side}\nGAIN RESTORE`, gainRestore)
		addBatch(batches, `${laneId}-pan-center`, `${lane.mix} ${lane.side}\nPAN CENTER`, panCenter)
		addBatch(batches, `${laneId}-pan-right`, `${lane.mix} ${lane.side}\nPAN +25`, panRight)
		addBatch(batches, `${laneId}-pan-restore`, `${lane.mix} ${lane.side}\nPAN RESTORE`, panRestore)

		const talkback = value(`${base}_talkback`)
		if (talkback.exists) {
			addBatch(batches, `${laneId}-talkback-off`, `${lane.mix} ${lane.side}\nTB OFF`, [
				restoreSpec('mix_talkback', { mix: lane.mix, side: lane.side, state: 'off' }),
			])
			addBatch(batches, `${laneId}-talkback-on`, `${lane.mix} ${lane.side}\nTB ON`, [
				restoreSpec('mix_talkback', { mix: lane.mix, side: lane.side, state: 'on' }),
			])
			addBatch(batches, `${laneId}-talkback-restore`, `${lane.mix} ${lane.side}\nTB RESTORE`, [
				restoreSpec('mix_talkback', { mix: lane.mix, side: lane.side, state: canonicalBool(talkback.value) ? boolState(talkback.value) : 'off' }),
			])
		}
	}

	const altEnable = value('monitor_altEnable')
	if (altEnable.exists) {
		addBatch(batches, 'monitor-alt-enable-off', 'MON ALT ENABLE\nOFF', [restoreSpec('monitor_alt_enable', { state: 'off' })])
		addBatch(batches, 'monitor-alt-enable-on', 'MON ALT ENABLE\nON', [restoreSpec('monitor_alt_enable', { state: 'on' })])
		addBatch(batches, 'monitor-alt-enable-restore', 'MON ALT ENABLE\nRESTORE', [restoreSpec('monitor_alt_enable', { state: canonicalBool(altEnable.value) ? boolState(altEnable.value) : 'off' })])
	}
	const alt = value('monitor_alt')
	if (alt.exists) {
		addBatch(batches, 'monitor-alt-off', 'MON ALT\nOFF', [restoreSpec('monitor_alt', { state: 'off' })])
		addBatch(batches, 'monitor-alt-on', 'MON ALT\nON', [restoreSpec('monitor_alt', { state: 'on' })])
		addBatch(batches, 'monitor-alt-restore', 'MON ALT\nRESTORE', [restoreSpec('monitor_alt', { state: canonicalBool(alt.value) ? boolState(alt.value) : 'off' })])
	}
	const preset = value('monitor_preset')
	if (preset.exists) {
		const alternate = MONITOR_PRESET_VALUES.find((v) => v !== preset.value) || MONITOR_PRESET_VALUES[0]
		addBatch(batches, 'monitor-preset-test', 'MON PRESET\nTEST', [restoreSpec('monitor_preset', { preset: alternate })])
		addBatch(batches, 'monitor-preset-restore', 'MON PRESET\nRESTORE', [restoreSpec('monitor_preset', { preset: preset.value || 'None' })])
	}
	const phantom = value('device_phantomPersistence')
	if (phantom.exists) {
		addBatch(batches, 'phantom-persistence-off', 'PHANTOM PERSIST\nOFF', [restoreSpec('phantom_persistence', { state: 'off' })])
		addBatch(batches, 'phantom-persistence-on', 'PHANTOM PERSIST\nON', [restoreSpec('phantom_persistence', { state: 'on' })])
		addBatch(batches, 'phantom-persistence-restore', 'PHANTOM PERSIST\nRESTORE', [restoreSpec('phantom_persistence', { state: canonicalBool(phantom.value) ? boolState(phantom.value) : 'off' })])
	}
	const tbSource = value('device_talkbackInputSource')
	if (tbSource.exists) {
		const alternate = TALKBACK_SOURCE_CANDIDATES.find((v) => v !== tbSource.value) || TALKBACK_SOURCE_CANDIDATES[0]
		addBatch(batches, 'talkback-source-test', 'TALKBACK SRC\nTEST', [restoreSpec('talkback_source', { source: alternate })])
		addBatch(batches, 'talkback-source-restore', 'TALKBACK SRC\nRESTORE', [restoreSpec('talkback_source', { source: tbSource.value || 'Scarlett Internal Mic' })])
	}
	const deviceNick = value('device_nickname')
	if (deviceNick.exists) {
		addBatch(batches, 'device-nick-temp', 'DEVICE NICK\nTEST', [restoreSpec('device_nickname', { name: 'TB_18I20_TEST' })])
		addBatch(batches, 'device-nick-restore', 'DEVICE NICK\nRESTORE', [restoreSpec('device_nickname', { name: deviceNick.value })])
	}

	return batches
}


module.exports = { publicSnapshot, actionEntity, buildButton, buildExtendedBatches }
