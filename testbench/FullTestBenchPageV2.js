const fs = require('node:fs')
const {
	EXPECTED_MODULE,
	EXPECTED_MODULE_VERSION,
	EXT_MARKER,
	EXT_INSTANCE_ID,
	FILE_VERSION,
	COMPANION_BUILD,
	generatedDir,
	generatedPagePath,
	generatedManifestPath,
	MONITOR_PRESET_VALUES,
	TALKBACK_SOURCE_CANDIDATES,
	FORBIDDEN_DEFINITIONS,
	DISRUPTIVE_DEFINITIONS,
	hashObject,
	stableStringify,
	unwrapOptions,
	pageHasMarker,
	resolveLiveConnection,
	readVariableOptional,
} = require('./FullTestBenchBase')
const { publicSnapshot, actionEntity, buildButton, buildExtendedBatches } = require('./FullTestBenchBuild')
const { laneBase } = require('./FullTestBenchAudit')

const GENERATOR_REVISION = 'full-v2-noop-recovery-20260821'

function restoreSpec(definitionId, options) {
	return { definitionId, options }
}

function addBatch(batches, id, label, specs) {
	if (specs.length) batches.push({ id, label, specs })
}

async function chooseTestSourcesV2(baseUrl, label, snapshot, shape) {
	const candidates = []
	const add = (value) => {
		const raw = String(value || '').trim()
		if (raw && raw !== '0' && !candidates.includes(raw)) candidates.push(raw)
	}

	for (const s of shape.mixerSlots) add(snapshot.values[`mixer_slot_${s}_source`]?.value)
	for (const o of shape.outputs) add(snapshot.values[`output_${o + 1}_source`]?.value)

	for (let n = 1; n <= 128 && candidates.length < 2; n++) {
		const v = await readVariableOptional(baseUrl, label, `source_${n}_root_id`, 2000)
		if (!v.exists) {
			if (n > 8) break
			continue
		}
		add(v.value)
	}

	if (candidates.length < 2) {
		throw new Error('FULL requires two distinct known hardware/playback sources for no-op-safe mixer/source validation.')
	}
	return { primary: candidates[0], secondary: candidates[1] }
}

function buildRecoveryBatches(snapshot, testSources) {
	const batches = []
	const { shape, values } = snapshot
	const value = (name) => values[name] || { exists: false, value: '' }

	const outputMuteOffAll = []
	const outputSourceTest = []
	const outputGainPrime = []
	const outputNickAlt = []
	for (const o of shape.outputs) {
		const idx = String(o)
		if (value(`output_${o + 1}_mute`).exists) {
			outputMuteOffAll.push(restoreSpec('output_mute', { output: idx, scope: 'single', state: 'off' }))
			addBatch(batches, `v2-output-${o + 1}-mute-off`, `OUT ${o + 1}\nMUTE OFF`, [
				restoreSpec('output_mute', { output: idx, scope: 'single', state: 'off' }),
			])
			addBatch(batches, `v2-output-${o + 1}-mute-on`, `OUT ${o + 1}\nMUTE ON`, [
				restoreSpec('output_mute', { output: idx, scope: 'single', state: 'on' }),
			])
		}
		if (value(`output_${o + 1}_source`).exists) {
			outputSourceTest.push(restoreSpec('output_source', { output: idx, source: testSources.primary }))
		}
		if (value(`output_${o + 1}_gain`).exists) {
			outputGainPrime.push(restoreSpec('output_gain_set', { output: idx, level: -127 }))
		}
		if (value(`output_${o + 1}_nickname`).exists) {
			outputNickAlt.push(restoreSpec('output_nickname', { output: idx, name: `TB2_OUT_${String(o + 1).padStart(2, '0')}` }))
		}
	}
	addBatch(batches, 'v2-output-mute-off-all', 'OUTPUT\nMUTE OFF ALL', outputMuteOffAll)
	addBatch(batches, 'v2-output-source-test', 'OUTPUT\nSOURCE TEST', outputSourceTest)
	addBatch(batches, 'v2-output-gain-prime', 'OUTPUT\nGAIN -127 PRIME', outputGainPrime)
	addBatch(batches, 'v2-output-nick-alt', 'OUTPUT\nNICK ALT', outputNickAlt)

	const inputNickAlt = []
	for (const i of shape.inputs) {
		if (value(`input_${i + 1}_nickname`).exists) {
			inputNickAlt.push(restoreSpec('input_nickname', { input: String(i), name: `TB2_IN_${String(i + 1).padStart(2, '0')}` }))
		}
	}
	addBatch(batches, 'v2-input-nick-alt', 'INPUT\nNICK ALT', inputNickAlt)

	const mixerSourceAlt = []
	for (const slot of shape.mixerSlots) {
		if (value(`mixer_slot_${slot}_source`).exists) {
			mixerSourceAlt.push(restoreSpec('mixer_slot_source', { slot, source: testSources.secondary }))
		}
	}
	addBatch(batches, 'v2-mixer-source-alt', 'MIXER SLOT\nSOURCE ALT', mixerSourceAlt)

	for (const lane of shape.lanes) {
		const base = laneBase(lane)
		const laneId = `${lane.mix.replace(/\s+/g, '').toLowerCase()}-${lane.side[0]}`
		const gainPrime = []
		for (let slot = 1; slot <= 24; slot++) {
			if (value(`${base}_slot_${slot}_gain`).exists) {
				gainPrime.push(restoreSpec('mix_gain_set', { mix: lane.mix, side: lane.side, slot, level: -127 }))
			}
		}
		addBatch(batches, `v2-${laneId}-gain-prime`, `${lane.mix} ${lane.side}\nGAIN -127 PRIME`, gainPrime)
	}

	const monitorBaseline = MONITOR_PRESET_VALUES.includes('None') ? 'None' : MONITOR_PRESET_VALUES[0]
	const monitorAlt = MONITOR_PRESET_VALUES.find((v) => v !== monitorBaseline)
	if (value('monitor_preset').exists && monitorBaseline && monitorAlt) {
		addBatch(batches, 'v2-monitor-preset-baseline', 'MON PRESET\nBASELINE', [
			restoreSpec('monitor_preset', { preset: monitorBaseline }),
		])
		addBatch(batches, 'v2-monitor-preset-alt', 'MON PRESET\nALT', [restoreSpec('monitor_preset', { preset: monitorAlt })])
	}

	const talkbackBaseline = TALKBACK_SOURCE_CANDIDATES.includes('Scarlett Internal Mic')
		? 'Scarlett Internal Mic'
		: TALKBACK_SOURCE_CANDIDATES[0]
	const talkbackAlt = TALKBACK_SOURCE_CANDIDATES.find((v) => v !== talkbackBaseline)
	if (value('device_talkbackInputSource').exists && talkbackBaseline && talkbackAlt) {
		addBatch(batches, 'v2-talkback-source-baseline', 'TALKBACK SRC\nBASELINE', [
			restoreSpec('talkback_source', { source: talkbackBaseline }),
		])
		addBatch(batches, 'v2-talkback-source-alt', 'TALKBACK SRC\nALT', [
			restoreSpec('talkback_source', { source: talkbackAlt }),
		])
	}

	if (value('device_nickname').exists) {
		addBatch(batches, 'v2-device-nick-alt', 'DEVICE NICK\nALT', [restoreSpec('device_nickname', { name: 'TB_18I20_TEST_2' })])
	}

	return batches
}

function buildExtendedPageV2(snapshot, testSources) {
	const signature = hashObject({
		generatorRevision: GENERATOR_REVISION,
		snapshot: publicSnapshot(snapshot, testSources.primary),
		testSources,
	})
	const batches = [...buildExtendedBatches(snapshot, testSources.primary), ...buildRecoveryBatches(snapshot, testSources)]
	const ids = new Set()
	for (const batch of batches) {
		if (ids.has(batch.id)) throw new Error(`Duplicate FULL batch id ${batch.id}.`)
		ids.add(batch.id)
	}

	const controls = {}
	const locations = {}
	const maxColumn = 23
	for (let index = 0; index < batches.length; index++) {
		const row = Math.floor(index / (maxColumn + 1))
		const column = index % (maxColumn + 1)
		const batch = batches[index]
		const actions = batch.specs.map((spec, actionIndex) =>
			actionEntity(spec.definitionId, spec.options, `${GENERATOR_REVISION}/${signature}/${batch.id}/${actionIndex}`)
		)
		controls[String(row)] ??= {}
		controls[String(row)][String(column)] = buildButton(batch.label, batch.id, actions, signature)
		locations[batch.id] = { row, column, actions: batch.specs }
	}

	const maxRow = Math.max(0, Math.ceil(batches.length / (maxColumn + 1)) - 1)
	const pageName = `Focusrite 18i20 TB FULL EXT [${EXT_MARKER}:${signature}]`
	const file = {
		version: FILE_VERSION,
		type: 'page',
		companionBuild: COMPANION_BUILD,
		page: {
			name: pageName,
			controls,
			gridSize: { minColumn: 0, maxColumn, minRow: 0, maxRow },
		},
		instances: {
			[EXT_INSTANCE_ID]: {
				label: 'FOCUSRITE TESTBENCH TARGET',
				moduleId: EXPECTED_MODULE,
				lastUpgradeIndex: 0,
			},
		},
		connectionCollections: [],
		oldPageNumber: 1,
		imageLibrary: [],
		imageLibraryCollections: [],
	}
	return { signature, batches, locations, pageName, file, testSources, generatorRevision: GENERATOR_REVISION }
}

function writeGeneratedExtendedV2(built) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(generatedPagePath, `${JSON.stringify(built.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(
		generatedManifestPath,
		`${JSON.stringify(
			{
				schemaVersion: 2,
				generatorRevision: GENERATOR_REVISION,
				marker: EXT_MARKER,
				signature: built.signature,
				pageName: built.pageName,
				batches: Object.fromEntries(
					Object.entries(built.locations).map(([id, item]) => [id, { row: item.row, column: item.column, actionCount: item.actions.length }])
				),
			},
			null,
			'\t'
		)}\n`,
		'utf8'
	)
}

function normalizedActionSignature(action) {
	return { definitionId: action.definitionId, options: unwrapOptions(action.options) }
}

function auditExtendedPageV2(exported, built, connections) {
	const matches = Object.entries(exported.pages).filter(
		([, page]) => page?.name === built.pageName || pageHasMarker(page, `${EXT_MARKER}:${built.signature}`)
	)
	if (matches.length === 0) return null
	if (matches.length !== 1) throw new Error('Multiple matching FULL Extended pages exist for the current snapshot/revision.')
	const [pageNumber, page] = matches[0]
	const refs = new Set()
	for (const [batchId, expected] of Object.entries(built.locations)) {
		const control = page.controls?.[String(expected.row)]?.[String(expected.column)]
		if (!control || control.type !== 'button-layered') throw new Error(`FULL Extended control missing for ${batchId}.`)
		const down = control.steps?.['0']?.action_sets?.down
		if (!Array.isArray(down) || down.length !== expected.actions.length) {
			throw new Error(`FULL Extended action count mismatch for ${batchId}.`)
		}
		for (let i = 0; i < down.length; i++) {
			const actual = down[i]
			if (FORBIDDEN_DEFINITIONS.has(actual.definitionId) || DISRUPTIVE_DEFINITIONS.has(actual.definitionId)) {
				throw new Error(`Unsafe action ${actual.definitionId} found in FULL Extended page.`)
			}
			const wanted = expected.actions[i]
			const sig = normalizedActionSignature(actual)
			if (sig.definitionId !== wanted.definitionId || stableStringify(sig.options) !== stableStringify(wanted.options)) {
				throw new Error(`FULL Extended action mismatch for ${batchId} action ${i + 1}.`)
			}
			refs.add(actual.connectionId)
		}
	}
	if (refs.size !== 1) throw new Error('FULL Extended actions must reference exactly one Focusrite instance.')
	const instance = exported.instances?.[[...refs][0]]
	if (!instance || instance.moduleId !== EXPECTED_MODULE) throw new Error('FULL Extended page is not mapped to the Focusrite module.')
	if (String(instance.moduleVersionId || '') !== EXPECTED_MODULE_VERSION) {
		throw new Error(`FULL Extended page uses module version ${instance.moduleVersionId || 'unknown'}, expected ${EXPECTED_MODULE_VERSION}.`)
	}
	return { pageNumber: Number(pageNumber), connection: resolveLiveConnection(connections, instance) }
}

module.exports = {
	GENERATOR_REVISION,
	chooseTestSourcesV2,
	buildRecoveryBatches,
	buildExtendedPageV2,
	writeGeneratedExtendedV2,
	auditExtendedPageV2,
}
