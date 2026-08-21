const fs = require('node:fs')
const { EXPECTED_MODEL, EXPECTED_MODULE, EXPECTED_MODULE_VERSION, R9_PAGE_NAME, R9_MARKER, EXT_MARKER, EXT_INSTANCE_ID, FILE_VERSION, COMPANION_BUILD, testbenchDir, safePlanPath, generatedDir, resultsDir, generatedPagePath, generatedManifestPath, MONITOR_PRESET_VALUES, TALKBACK_SOURCE_CANDIDATES, OUTPUT_PAIR_LEFT_INDICES, DISRUPTIVE_DEFINITIONS, FORBIDDEN_DEFINITIONS, EXTENDED_ALLOWED, nowIso, line, sleep, stableStringify, hashObject, deterministicId, canonicalBool, boolState, rawPanToPercent, expectedPanRaw, request, findCompanion, get, post, readVariableOptional, readVariable, waitVariable, waitExact, mapLimit, unwrapOptions, actionSetsContainWrites, collectActions, collectFeedbacks, pageHasMarker, resolveLiveConnection, exportButtons } = require('./FullTestBenchBase')
const { auditSafeSetters, auditR9, expectedFeedback, readFeedbackMarker, sweepFeedbacks, getR9ActionLocations, pressLocation, safePlanSetter, captureOptionalVars, uniqueBy, discoverShapeFromFeedbacks, laneBase, captureFullSnapshot, chooseTestSource } = require('./FullTestBenchAudit')
const { publicSnapshot, actionEntity, buildButton, buildExtendedBatches } = require('./FullTestBenchBuild')

function buildExtendedPage(snapshot, testSource) {
	const signature = hashObject(publicSnapshot(snapshot, testSource))
	const batches = buildExtendedBatches(snapshot, testSource)
	const controls = {}
	const locations = {}
	const maxColumn = 23
	for (let index = 0; index < batches.length; index++) {
		const row = Math.floor(index / (maxColumn + 1))
		const column = index % (maxColumn + 1)
		const batch = batches[index]
		const actions = batch.specs.map((spec, actionIndex) =>
			actionEntity(spec.definitionId, spec.options, `${signature}/${batch.id}/${actionIndex}`)
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
	return { signature, batches, locations, pageName, file }
}

function writeGeneratedExtended(built) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(generatedPagePath, `${JSON.stringify(built.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(
		generatedManifestPath,
		`${JSON.stringify(
			{
				schemaVersion: 1,
				marker: EXT_MARKER,
				signature: built.signature,
				pageName: built.pageName,
				batches: Object.fromEntries(Object.entries(built.locations).map(([id, item]) => [id, { row: item.row, column: item.column, actionCount: item.actions.length }])),
			},
			null,
			'\t'
		)}\n`,
		'utf8'
	)
}

function normalizedActionSignature(action) {
	return {
		definitionId: action.definitionId,
		options: unwrapOptions(action.options),
	}
}

function auditExtendedPage(exported, built, connections) {
	const matches = Object.entries(exported.pages).filter(([, page]) => page?.name === built.pageName || pageHasMarker(page, `${EXT_MARKER}:${built.signature}`))
	if (matches.length === 0) return null
	if (matches.length !== 1) throw new Error('Multiple matching FULL Extended pages exist. Keep only one imported page for the current snapshot.')
	const [pageNumber, page] = matches[0]
	const refs = new Set()
	for (const [batchId, expected] of Object.entries(built.locations)) {
		const control = page.controls?.[String(expected.row)]?.[String(expected.column)]
		if (!control || control.type !== 'button-layered') throw new Error(`FULL Extended control missing for ${batchId}.`)
		const down = control.steps?.['0']?.action_sets?.down
		if (!Array.isArray(down) || down.length !== expected.actions.length) throw new Error(`FULL Extended action count mismatch for ${batchId}.`)
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
	return {
		pageNumber: Number(pageNumber),
		connection: resolveLiveConnection(connections, instance),
	}
}


module.exports = { buildExtendedPage, writeGeneratedExtended, normalizedActionSignature, auditExtendedPage }
