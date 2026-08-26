'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const packageJson = require('../package.json')
const {
	EXPECTED_MODEL,
	EXPECTED_MODULE,
	FILE_VERSION,
	COMPANION_BUILD,
	testbenchDir,
	safePlanPath,
	generatedDir,
	resultsDir,
	OUTPUT_PAIR_LEFT_INDICES,
	MONITOR_PRESET_VALUES,
	TALKBACK_SOURCE_CANDIDATES,
	line,
	sleep,
	stableStringify,
	deterministicId,
	canonicalBool,
	findCompanion,
	get,
	post,
	readVariableOptional,
	readVariable,
	waitVariable,
	mapLimit,
	unwrapOptions,
	collectActions,
	exportButtons,
	resolveLiveConnection,
} = require('./FullTestBenchBase')
const { auditR9 } = require('./FullTestBenchAudit')
const {
	TrpcWsRpc,
	rpcWebSocketUrl,
	normalizeConnections,
	buildConnectionRemap,
	prepareImport,
	hashPagesExcept,
	sameConnectionSet,
} = require('./FullTestBenchCompanionImportV7')
const {
	PAIR_SOURCE_RIGHT_OUTPUTS,
	WITHHELD_OUTPUT_MUTES,
	NO_EFFECT_OUTPUT_NICKNAMES,
	NO_EFFECT_OUTPUT_GAINS,
	UNVALIDATED_CONFIGURATION_OUTPUTS,
	WITHHELD_OUTPUT_GAINS,
} = require('../src/hardware-policy')

const EXPECTED_MODULE_VERSION = packageJson.version
const RELEASE_MARKER = 'TB-V1-RELEASE'
const RELEASE_INSTANCE_ID = 'focusrite-v1-release-target'
const RELEASE_REVISION = 'v1-release-smoke-20260826'
const generatedPagePath = path.join(generatedDir, 'V1_RELEASE_SMOKE.companionconfig')
const generatedManifestPath = path.join(generatedDir, 'V1_RELEASE_SMOKE_MANIFEST.json')
const outputPath = path.join(resultsDir, 'latest-v1-release-smoke.json')
const safeResultPath = path.join(resultsDir, 'latest-safe-hardware-result.json')

const V1_RELEASE_ALLOWED = new Set([
	'monitor_preset',
	'input_mode',
	'input_mode_cycle',
	'input_nickname',
	'output_mute',
	'output_gain_set',
	'output_gain_adjust',
	'output_source',
	'output_pair_source',
	'output_nickname',
	'device_nickname',
	'phantom_persistence',
	'talkback_source',
	'reconnect',
])

const V1_RELEASE_WITHHELD = new Set([
	'monitor_alt_enable',
	'monitor_alt',
	'output_stereo',
	'mixer_slot_source',
	'mixer_slot_stereo',
	'mix_mute',
	'mix_solo',
	'mix_gain_set',
	'mix_gain_adjust',
	'mix_pan',
	'mix_talkback',
	'device_preset',
	'clock_source',
	'sample_rate',
	'spdif_mode',
	'advanced_raw_set',
	'monitor_gain_set',
	'monitor_gain_adjust',
])

function exprValue(value) {
	return { value, isExpression: false }
}

function actionEntity(definitionId, options, salt) {
	if (!V1_RELEASE_ALLOWED.has(definitionId)) {
		throw new Error(`V1 release generator refused non-release action ${definitionId}.`)
	}
	return {
		type: 'action',
		id: deterministicId(`${RELEASE_REVISION}/${salt}/${definitionId}/${stableStringify(options)}`),
		definitionId,
		connectionId: RELEASE_INSTANCE_ID,
		options: Object.fromEntries(Object.entries(options || {}).map(([key, value]) => [key, exprValue(value)])),
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

function buildButton(label, action, signature, id) {
	return {
		type: 'button-layered',
		feedbacks: [],
		steps: {
			0: {
				action_sets: { down: [action] },
				options: { runWhileHeld: [] },
			},
		},
		localVariables: [],
		options: {
			stepProgression: 'auto',
			stepExpression: '',
			rotaryActions: false,
			canModifyStyleInApis: false,
			notes: `${RELEASE_MARKER}:${signature}:${id}`,
		},
		style: { layers: buttonLayers(label) },
	}
}

function normalizeBool(raw) {
	return canonicalBool(raw)
}

function outputAvailabilityAllows(availability) {
	if (!availability?.exists) return true
	return normalizeBool(availability.value) === 'true'
}

function outputControlAllowed(index, control, availability) {
	if (UNVALIDATED_CONFIGURATION_OUTPUTS.has(index)) return false
	if (!outputAvailabilityAllows(availability)) return false
	if (control === 'source' && PAIR_SOURCE_RIGHT_OUTPUTS.has(index)) return false
	if (control === 'mute' && WITHHELD_OUTPUT_MUTES.has(index)) return false
	if (control === 'nickname' && NO_EFFECT_OUTPUT_NICKNAMES.has(index)) return false
	if (control === 'gain' && (WITHHELD_OUTPUT_GAINS.has(index) || NO_EFFECT_OUTPUT_GAINS.has(index))) return false
	return true
}

function textState(item) {
	if (!item?.exists) return null
	return String(item.value ?? '')
}

function boolState(item) {
	if (!item?.exists) return null
	return normalizeBool(item.value)
}

function numericState(item) {
	if (!item?.exists || String(item.value ?? '').trim() === '') return null
	const value = Number(item.value)
	return Number.isFinite(value) ? value : null
}

async function captureSources(baseUrl, label) {
	const sources = []
	let misses = 0
	for (let n = 1; n <= 128 && misses < 8; n++) {
		const [id, name, type] = await Promise.all([
			readVariableOptional(baseUrl, label, `source_${n}_root_id`, 1800),
			readVariableOptional(baseUrl, label, `source_${n}_name`, 1800),
			readVariableOptional(baseUrl, label, `source_${n}_type`, 1800),
		])
		if (!id.exists || !name.exists) {
			misses++
			continue
		}
		misses = 0
		const rawId = String(id.value || '').trim()
		const sourceName = String(name.value || '').trim()
		if (!rawId || rawId === '0' || !sourceName) continue
		sources.push({ id: rawId, name: sourceName, type: String(type.value || '').trim() })
	}
	return sources
}

function isUserVisibleRoutingSource(source) {
	return /playback|analogue|analog|spdif|s\/pdif|adat/i.test(source.name) && !/internal mic/i.test(source.name)
}

function directSourceCandidates(sources) {
	return sources.filter(isUserVisibleRoutingSource)
}

function parseTrailingChannel(name) {
	const match = String(name || '').trim().match(/^(.*?)(\d+)$/)
	if (!match) return null
	return { prefix: match[1].trim().toLowerCase(), channel: Number(match[2]) }
}

function stereoSourcePairs(sources) {
	const visible = directSourceCandidates(sources)
	const pairs = []
	for (const left of visible) {
		const parsed = parseTrailingChannel(left.name)
		if (!parsed || !Number.isInteger(parsed.channel) || parsed.channel % 2 !== 1) continue
		const right = visible.find((candidate) => {
			const p = parseTrailingChannel(candidate.name)
			return p && p.prefix === parsed.prefix && p.channel === parsed.channel + 1
		})
		if (right) pairs.push({ left, right })
	}
	return pairs
}

function chooseDifferentSource(candidates, current) {
	return candidates.find((source) => String(source.id) !== String(current)) || null
}

function baselinePairSource(_pairs, leftCurrent, rightCurrent) {
	// Final release smoke restores a pair only through the public pair action.
	// A 0/0 baseline is unambiguous and exactly restorable without relying on
	// internal source-pair metadata that Companion does not expose as variables.
	return String(leftCurrent) === '0' && String(rightCurrent) === '0' ? '0' : null
}

function chooseDifferentPair(pairs, leftCurrent, rightCurrent) {
	return (
		pairs.find(
			(pair) => String(pair.left.id) !== String(leftCurrent) || String(pair.right.id) !== String(rightCurrent),
		) || null
	)
}

async function captureReleaseState(baseUrl, label) {
	const values = {}
	const read = async (name) => {
		values[name] = await readVariableOptional(baseUrl, label, name, 2500)
		return values[name]
	}

	for (const name of [
		'monitor_preset',
		'device_nickname',
		'device_phantomPersistence',
		'device_talkbackInputSource',
	]) {
		await read(name)
	}
	for (let input = 1; input <= 8; input++) {
		for (const key of ['nickname', 'mode']) await read(`input_${input}_${key}`)
	}
	for (let output = 1; output <= 26; output++) {
		for (const key of ['available', 'mute', 'source', 'nickname', 'gain']) await read(`output_${output}_${key}`)
	}
	return values
}

function addTest(tests, test) {
	if (!test.change || !test.restore) throw new Error(`V1 release test ${test.id} is missing change/restore actions.`)
	for (const spec of [test.change, test.restore]) {
		if (!V1_RELEASE_ALLOWED.has(spec.definitionId)) throw new Error(`Refused action ${spec.definitionId} in ${test.id}.`)
	}
	tests.push(test)
}

function buildReleaseTests(values, sources) {
	const tests = []
	const directSources = directSourceCandidates(sources)
	const sourcePairs = stereoSourcePairs(sources)

	const monitorPreset = textState(values.monitor_preset)
	if (monitorPreset && MONITOR_PRESET_VALUES.includes(monitorPreset)) {
		const alternate = MONITOR_PRESET_VALUES.find((value) => value !== monitorPreset)
		if (alternate) {
			addTest(tests, {
				id: 'monitor-preset',
				label: 'Monitor preset',
				variable: 'monitor_preset',
				kind: 'text',
				expectedChange: alternate,
				expectedRestore: monitorPreset,
				change: { definitionId: 'monitor_preset', options: { preset: alternate } },
				restore: { definitionId: 'monitor_preset', options: { preset: monitorPreset } },
			})
		}
	}

	for (let input = 1; input <= 8; input++) {
		const nickname = textState(values[`input_${input}_nickname`])
		if (nickname !== null) {
			const temp = `V1RC_IN_${String(input).padStart(2, '0')}`
			addTest(tests, {
				id: `input-${input}-nickname`,
				label: `Input ${input} nickname`,
				variable: `input_${input}_nickname`,
				kind: 'text-private',
				expectedChange: temp,
				expectedRestore: nickname,
				change: { definitionId: 'input_nickname', options: { input: String(input - 1), name: temp } },
				restore: { definitionId: 'input_nickname', options: { input: String(input - 1), name: nickname } },
			})
		}
	}

	for (let input = 1; input <= 2; input++) {
		const mode = textState(values[`input_${input}_mode`])
		if (!mode) continue
		const alternate = mode === 'Line' ? 'Inst' : mode === 'Inst' ? 'Line' : null
		if (!alternate) continue
		addTest(tests, {
			id: `input-${input}-mode-cycle`,
			label: `Input ${input} mode cycle`,
			variable: `input_${input}_mode`,
			kind: 'text',
			expectedChange: alternate,
			expectedRestore: mode,
			change: { definitionId: 'input_mode_cycle', options: { input: String(input - 1) } },
			restore: { definitionId: 'input_mode', options: { input: String(input - 1), mode } },
		})
	}

	for (let output = 1; output <= 26; output++) {
		const index = output - 1
		const availability = values[`output_${output}_available`]

		const mute = boolState(values[`output_${output}_mute`])
		if (mute !== null && outputControlAllowed(index, 'mute', availability)) {
			const alternate = mute === 'true' ? 'false' : 'true'
			addTest(tests, {
				id: `output-${output}-mute`,
				label: `Output ${output} mute`,
				variable: `output_${output}_mute`,
				kind: 'bool',
				expectedChange: alternate,
				expectedRestore: mute,
				change: {
					definitionId: 'output_mute',
					options: { output: String(index), scope: 'single', state: alternate === 'true' ? 'on' : 'off' },
				},
				restore: {
					definitionId: 'output_mute',
					options: { output: String(index), scope: 'single', state: mute === 'true' ? 'on' : 'off' },
				},
			})
		}

		const gain = numericState(values[`output_${output}_gain`])
		if (gain !== null && outputControlAllowed(index, 'gain', availability)) {
			let prime = gain <= -2 ? gain + 1 : gain - 2
			prime = Math.max(-127, Math.min(-1, prime))
			if (prime === gain) prime = gain === -1 ? -2 : -1
			const adjusted = Math.max(-128, Math.min(0, prime + 1))
			addTest(tests, {
				id: `output-${output}-gain-set`,
				label: `Output ${output} gain set`,
				variable: `output_${output}_gain`,
				kind: 'number',
				expectedChange: String(prime),
				expectedRestore: String(gain),
				change: { definitionId: 'output_gain_set', options: { output: String(index), level: prime } },
				restore: { definitionId: 'output_gain_set', options: { output: String(index), level: gain } },
			})
			addTest(tests, {
				id: `output-${output}-gain-adjust`,
				label: `Output ${output} gain adjust`,
				variable: `output_${output}_gain`,
				kind: 'number',
				expectedChange: String(adjusted),
				expectedRestore: String(gain),
				precondition: { definitionId: 'output_gain_set', options: { output: String(index), level: prime }, expected: String(prime) },
				change: { definitionId: 'output_gain_adjust', options: { output: String(index), step: 1 } },
				restore: { definitionId: 'output_gain_set', options: { output: String(index), level: gain } },
			})
		}

		const source = textState(values[`output_${output}_source`])
		const sourceRestorable = source === '0' || directSources.some((candidate) => String(candidate.id) === String(source))
		if (source !== null && source !== '' && sourceRestorable && outputControlAllowed(index, 'source', availability)) {
			const alternate = chooseDifferentSource(directSources, source)
			if (alternate) {
				addTest(tests, {
					id: `output-${output}-source`,
					label: `Output ${output} source`,
					variable: `output_${output}_source`,
					kind: 'opaque-source',
					expectedChange: alternate.id,
					expectedRestore: source,
					change: { definitionId: 'output_source', options: { output: String(index), source: alternate.id } },
					restore: { definitionId: 'output_source', options: { output: String(index), source } },
				})
			}
		}

		const nickname = textState(values[`output_${output}_nickname`])
		if (nickname !== null && outputControlAllowed(index, 'nickname', availability)) {
			const temp = `V1RC_OUT_${String(output).padStart(2, '0')}`
			addTest(tests, {
				id: `output-${output}-nickname`,
				label: `Output ${output} nickname`,
				variable: `output_${output}_nickname`,
				kind: 'text-private',
				expectedChange: temp,
				expectedRestore: nickname,
				change: { definitionId: 'output_nickname', options: { output: String(index), name: temp } },
				restore: { definitionId: 'output_nickname', options: { output: String(index), name: nickname } },
			})
		}
	}

	for (const leftIndex of OUTPUT_PAIR_LEFT_INDICES) {
		const rightIndex = leftIndex + 1
		const leftNumber = leftIndex + 1
		const rightNumber = rightIndex + 1
		if (rightNumber > 26) continue
		if (UNVALIDATED_CONFIGURATION_OUTPUTS.has(leftIndex) || UNVALIDATED_CONFIGURATION_OUTPUTS.has(rightIndex)) continue
		const leftAvailability = values[`output_${leftNumber}_available`]
		const rightAvailability = values[`output_${rightNumber}_available`]
		if (!outputAvailabilityAllows(leftAvailability) || !outputAvailabilityAllows(rightAvailability)) continue
		const leftCurrent = textState(values[`output_${leftNumber}_source`])
		const rightCurrent = textState(values[`output_${rightNumber}_source`])
		if (!leftCurrent || !rightCurrent) continue
		const restoreSource = baselinePairSource(sourcePairs, leftCurrent, rightCurrent)
		if (restoreSource === null) continue
		let alternate = chooseDifferentPair(sourcePairs, leftCurrent, rightCurrent)
		let changeSource = alternate?.left.id || null
		let expectedChange = alternate ? [alternate.left.id, alternate.right.id] : null
		if (!changeSource && restoreSource !== '0') {
			changeSource = '0'
			expectedChange = ['0', '0']
		}
		if (!changeSource || !expectedChange) continue
		addTest(tests, {
			id: `output-pair-${leftNumber}-${rightNumber}-source`,
			label: `Output pair ${leftNumber}-${rightNumber} source`,
			variables: [`output_${leftNumber}_source`, `output_${rightNumber}_source`],
			kind: 'opaque-source-pair',
			expectedChange,
			expectedRestore: [leftCurrent, rightCurrent],
			change: { definitionId: 'output_pair_source', options: { output: String(leftIndex), source: changeSource } },
			restore: { definitionId: 'output_pair_source', options: { output: String(leftIndex), source: restoreSource } },
		})
	}

	const deviceNickname = textState(values.device_nickname)
	if (deviceNickname !== null) {
		addTest(tests, {
			id: 'device-nickname',
			label: 'Device nickname',
			variable: 'device_nickname',
			kind: 'text-private',
			expectedChange: 'V1RC_18I20',
			expectedRestore: deviceNickname,
			change: { definitionId: 'device_nickname', options: { name: 'V1RC_18I20' } },
			restore: { definitionId: 'device_nickname', options: { name: deviceNickname } },
		})
	}

	const phantom = boolState(values.device_phantomPersistence)
	if (phantom !== null) {
		const alternate = phantom === 'true' ? 'false' : 'true'
		addTest(tests, {
			id: 'phantom-persistence',
			label: 'Phantom persistence',
			variable: 'device_phantomPersistence',
			kind: 'bool',
			expectedChange: alternate,
			expectedRestore: phantom,
			change: { definitionId: 'phantom_persistence', options: { state: alternate === 'true' ? 'on' : 'off' } },
			restore: { definitionId: 'phantom_persistence', options: { state: phantom === 'true' ? 'on' : 'off' } },
		})
	}

	const talkbackSource = textState(values.device_talkbackInputSource)
	if (talkbackSource && TALKBACK_SOURCE_CANDIDATES.includes(talkbackSource)) {
		const availableTalkbackNames = sources.map((source) => source.name)
		const alternate = TALKBACK_SOURCE_CANDIDATES.find(
			(candidate) => candidate !== talkbackSource && availableTalkbackNames.includes(candidate),
		)
		if (alternate) {
			addTest(tests, {
				id: 'talkback-source',
				label: 'Talkback source',
				variable: 'device_talkbackInputSource',
				kind: 'text',
				expectedChange: alternate,
				expectedRestore: talkbackSource,
				change: { definitionId: 'talkback_source', options: { source: alternate } },
				restore: { definitionId: 'talkback_source', options: { source: talkbackSource } },
			})
		}
	}

	return tests
}

function allSpecs(test) {
	const specs = []
	if (test.precondition) specs.push({ role: 'precondition', spec: test.precondition })
	specs.push({ role: 'change', spec: test.change })
	if (Array.isArray(test.restorePair)) {
		for (const spec of test.restorePair) specs.push({ role: 'restore', spec })
	} else {
		specs.push({ role: 'restore', spec: test.restore })
	}
	return specs
}

function hashReleasePlan(tests) {
	const exactPlan = tests.map((test) => ({
		id: test.id,
		kind: test.kind,
		expectedChange: test.expectedChange,
		expectedRestore: test.expectedRestore,
		actions: allSpecs(test).map(({ role, spec }) => ({ role, definitionId: spec.definitionId, options: spec.options })),
	}))
	return crypto.createHash('sha256').update(stableStringify(exactPlan)).digest('hex').slice(0, 16)
}

function redactOptions(spec) {
	const options = { ...(spec?.options || {}) }
	if (spec?.definitionId?.includes('nickname') || spec?.definitionId === 'device_nickname') {
		if ('name' in options) options.name = '<private-text>'
	}
	if (spec?.definitionId === 'output_source' || spec?.definitionId === 'output_pair_source') {
		if ('source' in options) options.source = '<source-id>'
	}
	return options
}

function buildReleasePage(tests) {
	const signature = hashReleasePlan(tests)
	const controls = {}
	const locations = {}
	const maxColumn = 23
	let cursor = 0
	for (const test of tests) {
		locations[test.id] = {}
		for (const { role, spec } of allSpecs(test)) {
			const row = Math.floor(cursor / (maxColumn + 1))
			const column = cursor % (maxColumn + 1)
			const action = actionEntity(spec.definitionId, spec.options, `${signature}/${test.id}/${role}/${cursor}`)
			controls[String(row)] ??= {}
			controls[String(row)][String(column)] = buildButton(`${test.label}\n${role.toUpperCase()}`, action, signature, `${test.id}:${role}`)
			if (role === 'restore') {
				locations[test.id].restore ??= []
				locations[test.id].restore.push({ row, column, spec })
			} else {
				locations[test.id][role] = { row, column, spec }
			}
			cursor++
		}
	}

	const reconnectRow = Math.floor(cursor / (maxColumn + 1))
	const reconnectColumn = cursor % (maxColumn + 1)
	const reconnectSpec = { definitionId: 'reconnect', options: {} }
	const reconnectAction = actionEntity('reconnect', {}, `${signature}/reconnect/${cursor}`)
	controls[String(reconnectRow)] ??= {}
	controls[String(reconnectRow)][String(reconnectColumn)] = buildButton(
		'Connection\nRECONNECT',
		reconnectAction,
		signature,
		'reconnect',
	)
	locations.reconnect = { change: { row: reconnectRow, column: reconnectColumn, spec: reconnectSpec } }
	cursor++

	const maxRow = Math.max(0, Math.ceil(cursor / (maxColumn + 1)) - 1)
	const pageName = `Focusrite 18i20 V1 RELEASE [${RELEASE_MARKER}:${signature}]`
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
			[RELEASE_INSTANCE_ID]: {
				label: 'FOCUSRITE V1 RELEASE TARGET',
				moduleId: EXPECTED_MODULE,
				lastUpgradeIndex: 0,
			},
		},
		connectionCollections: [],
		oldPageNumber: 1,
		imageLibrary: [],
		imageLibraryCollections: [],
	}
	return { signature, pageName, locations, file, testCount: tests.length }
}

function writeGeneratedPage(built) {
	fs.mkdirSync(generatedDir, { recursive: true })
	fs.writeFileSync(generatedPagePath, `${JSON.stringify(built.file, null, '\t')}\n`, 'utf8')
	fs.writeFileSync(
		generatedManifestPath,
		`${JSON.stringify(
			{
				schemaVersion: 1,
				revision: RELEASE_REVISION,
				signature: built.signature,
				pageName: built.pageName,
				testCount: built.testCount,
				generatedUtc: new Date().toISOString(),
			},
			null,
			'\t',
		)}\n`,
		'utf8',
	)
}

function pageLooksLikeVerifiedTestBench(page, exported) {
	if (!page) return false
	const text = JSON.stringify(page)
	const marker = text.includes('TB-FULL-EXT:') || text.includes(`${RELEASE_MARKER}:`)
	if (!marker) return false
	const refs = new Set()
	for (const row of Object.values(page.controls || {})) {
		for (const control of Object.values(row || {})) {
			for (const action of collectActions(control)) {
				if (action?.connectionId) refs.add(action.connectionId)
			}
		}
	}
	if (refs.size !== 1) return false
	const instance = exported.instances?.[[...refs][0]]
	return instance?.moduleId === EXPECTED_MODULE && String(instance?.moduleVersionId || '') === EXPECTED_MODULE_VERSION
}

function auditReleasePage(exported, built, connections, expectedConnection) {
	const matches = Object.entries(exported.pages || {}).filter(([, page]) => page?.name === built.pageName)
	if (matches.length !== 1) throw new Error('Expected exactly one current V1 release smoke page.')
	const [pageNumber, page] = matches[0]
	const refs = new Set()
	for (const [testId, roles] of Object.entries(built.locations)) {
		for (const [role, rawLocations] of Object.entries(roles)) {
			const locations = Array.isArray(rawLocations) ? rawLocations : [rawLocations]
			for (const expected of locations) {
				const control = page.controls?.[String(expected.row)]?.[String(expected.column)]
				const actions = control?.steps?.['0']?.action_sets?.down
				if (!Array.isArray(actions) || actions.length !== 1) {
					throw new Error(`Release page action count mismatch for ${testId}/${role}.`)
				}
				const action = actions[0]
				if (!V1_RELEASE_ALLOWED.has(action.definitionId) || V1_RELEASE_WITHHELD.has(action.definitionId)) {
					throw new Error(`Forbidden/non-release action ${action.definitionId} in V1 release page.`)
				}
				if (
					action.definitionId !== expected.spec.definitionId ||
					stableStringify(unwrapOptions(action.options)) !== stableStringify(expected.spec.options)
				) {
					throw new Error(`Release page action mismatch for ${testId}/${role}.`)
				}
				refs.add(action.connectionId)
			}
		}
	}
	if (refs.size !== 1) throw new Error('V1 release page must reference exactly one Focusrite instance.')
	const instance = exported.instances?.[[...refs][0]]
	if (!instance || instance.moduleId !== EXPECTED_MODULE) throw new Error('V1 release page is not mapped to Focusrite 18i20 module.')
	if (String(instance.moduleVersionId || '') !== EXPECTED_MODULE_VERSION) {
		throw new Error(`V1 release page module version mismatch: ${instance.moduleVersionId || 'unknown'}.`)
	}
	const connection = resolveLiveConnection(connections, instance)
	if (connection.id !== expectedConnection.id && String(connection.label) !== String(expectedConnection.label)) {
		throw new Error('V1 release page is not mapped to the already-audited Focusrite connection.')
	}
	return { pageNumber: Number(pageNumber), connection }
}

async function ensureReleasePage(baseUrl, built, r9, connections, exported) {
	const existing = Object.entries(exported.pages || {}).find(([, page]) => page?.name === built.pageName)
	if (existing) return auditReleasePage(exported, built, connections, r9.connection)

	const page2 = exported.pages?.['2']
	if (page2 && !pageLooksLikeVerifiedTestBench(page2, exported)) {
		throw new Error('REFUSED: Companion Page 2 is not a verified Focusrite TestBench page; release smoke will not overwrite it.')
	}
	if (!page2) throw new Error('REFUSED: Companion Page 2 is missing; release smoke will not create/reorder user pages.')

	writeGeneratedPage(built)
	const beforeOtherPagesHash = hashPagesExcept(exported, 2)
	const beforeConnections = connections
	const rpc = new TrpcWsRpc(rpcWebSocketUrl(baseUrl))
	try {
		await rpc.connect()
		const prepared = await prepareImport(rpc, generatedPagePath)
		const remap = buildConnectionRemap(prepared, r9.connection)
		await rpc.mutate('importExport.importSinglePage', {
			targetPage: 2,
			sourcePage: 1,
			connectionIdRemapping: remap,
		})
	} finally {
		rpc.close()
	}

	const after = await exportButtons(baseUrl)
	const afterConnections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	if (hashPagesExcept(after, 2) !== beforeOtherPagesHash) {
		throw new Error('Release Page 2 audit failed: a page other than Page 2 changed.')
	}
	if (!sameConnectionSet(beforeConnections, afterConnections)) {
		throw new Error('Release Page 2 audit failed: Companion connection set changed.')
	}
	return auditReleasePage(after, built, afterConnections, r9.connection)
}

async function pressLocation(baseUrl, pageNumber, location) {
	await post(baseUrl, `/api/location/${pageNumber}/${location.row}/${location.column}/press`, 10000)
}

function expectedMatches(kind, actual, expected) {
	if (kind === 'bool') return normalizeBool(actual) === String(expected)
	if (kind === 'number') {
		const a = Number(actual)
		const e = Number(expected)
		return Number.isFinite(a) && Number.isFinite(e) && Math.abs(a - e) < 0.001
	}
	return String(actual) === String(expected)
}

async function waitExpected(baseUrl, label, variable, kind, expected, timeoutMs = 5000) {
	return waitVariable(baseUrl, label, variable, (value) => expectedMatches(kind, value, expected), timeoutMs)
}

async function waitPair(baseUrl, label, variables, expected, timeoutMs = 6000) {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		const current = await Promise.all(variables.map((variable) => readVariableOptional(baseUrl, label, variable, 1800)))
		if (
			current.every((item) => item.exists) &&
			current.every((item, index) => String(item.value) === String(expected[index]))
		) {
			return true
		}
		await sleep(100)
	}
	return false
}

function publicResult(test, status, detail) {
	return { id: test.id, label: test.label, action: test.change.definitionId, status, detail }
}

async function executeTest(baseUrl, label, pageNumber, test, locations) {
	const currentBefore = test.variables
		? await Promise.all(test.variables.map((variable) => readVariableOptional(baseUrl, label, variable, 2000)))
		: [await readVariableOptional(baseUrl, label, test.variable, 2000)]
	if (currentBefore.some((item) => !item.exists)) {
		return { hardAbort: true, result: publicResult(test, 'FAIL', 'Required server-confirmed baseline disappeared before write.') }
	}
	const wantedBaseline = Array.isArray(test.expectedRestore) ? test.expectedRestore : [test.expectedRestore]
	const baselineOk = currentBefore.every((item, index) => expectedMatches(test.kind === 'opaque-source-pair' ? 'text' : test.kind, item.value, wantedBaseline[index]))
	if (!baselineOk) {
		return { hardAbort: true, result: publicResult(test, 'FAIL', 'Baseline drift detected before write; no action pressed.') }
	}

	let writeAttempted = false
	let changeConfirmed = false
	let changeDetail = ''
	try {
		if (test.precondition) {
			writeAttempted = true
			await pressLocation(baseUrl, pageNumber, locations.precondition)
			const pre = await waitExpected(baseUrl, label, test.variable, test.kind, test.precondition.expected, 5000)
			if (!pre.ok) throw new Error('Precondition was not server-confirmed.')
		}
		writeAttempted = true
		await pressLocation(baseUrl, pageNumber, locations.change)
		if (test.variables) {
			changeConfirmed = await waitPair(baseUrl, label, test.variables, test.expectedChange)
		} else {
			changeConfirmed = (await waitExpected(baseUrl, label, test.variable, test.kind, test.expectedChange, 6000)).ok
		}
		if (!changeConfirmed) changeDetail = 'No server-confirmed transition.'
	} catch (error) {
		changeDetail = error.message
	}

	if (writeAttempted) {
		try {
			for (const restoreLocation of locations.restore || []) await pressLocation(baseUrl, pageNumber, restoreLocation)
			const restored = test.variables
				? await waitPair(baseUrl, label, test.variables, test.expectedRestore, 7000)
				: (await waitExpected(baseUrl, label, test.variable, test.kind, test.expectedRestore, 7000)).ok
			if (!restored) {
				return {
					hardAbort: true,
					result: publicResult(test, 'FAIL', 'HARD ABORT: exact original state was not server-confirmed after restore.'),
				}
			}
		} catch (error) {
			return { hardAbort: true, result: publicResult(test, 'FAIL', `HARD ABORT: restore failed (${error.message}).`) }
		}
	}

	return {
		hardAbort: false,
		result: changeConfirmed
			? publicResult(test, 'PASS', 'Server-confirmed change and exact restore.')
			: publicResult(test, 'FAIL', `Change unconfirmed; exact original state restored. ${changeDetail}`),
	}
}

async function runReconnect(baseUrl, label, pageNumber, location) {
	await pressLocation(baseUrl, pageNumber, location)
	const result = await waitVariable(
		baseUrl,
		label,
		'connection_status',
		(value) => /connected.*authorised/i.test(String(value)) || /authorised/i.test(String(value)),
		20000,
	)
	return result.ok
}

function baselineValueEqual(name, actual, expected) {
	const a = String(actual ?? '')
	const e = String(expected ?? '')
	if (/_gain$/i.test(name) && a !== '' && e !== '') {
		const an = Number(a)
		const en = Number(e)
		if (Number.isFinite(an) && Number.isFinite(en)) return Math.abs(an - en) < 0.001
	}
	if (/(?:_mute|_available)$/i.test(name) || name === 'device_phantomPersistence') {
		const ab = normalizeBool(a)
		const eb = normalizeBool(e)
		if (ab !== null && eb !== null) return ab === eb
	}
	return a === e
}

async function verifyReleaseStateBaseline(baseUrl, label, baseline) {
	const names = Object.keys(baseline)
	const checks = await mapLimit(names, 16, async (name) => {
		const expected = baseline[name]
		const current = await readVariableOptional(baseUrl, label, name, 2500)
		if (Boolean(current.exists) !== Boolean(expected.exists)) return { name, ok: false }
		if (!expected.exists) return { name, ok: true }
		return { name, ok: baselineValueEqual(name, current.value, expected.value) }
	})
	return checks.filter((check) => !check.ok).map((check) => check.name)
}

function requireFreshSafeResult() {
	if (!fs.existsSync(safeResultPath)) throw new Error('REFUSED: SAFE Core result is missing.')
	const safe = JSON.parse(fs.readFileSync(safeResultPath, 'utf8'))
	const ageMs = Date.now() - Date.parse(safe.generatedUtc || '')
	if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 15 * 60 * 1000) {
		throw new Error('REFUSED: SAFE Core result is not fresh; run the V1 release launcher from the beginning.')
	}
	if (safe.moduleVersion !== EXPECTED_MODULE_VERSION || safe.targetModel !== EXPECTED_MODEL) {
		throw new Error('REFUSED: SAFE Core result does not match the final 0.1.20 Scarlett 18i20 target.')
	}
	if (safe.hardAbort || safe.fail !== 0 || safe.skip !== 0 || safe.pass !== 21) {
		throw new Error(`REFUSED: SAFE Core was not complete (PASS=${safe.pass} FAIL=${safe.fail} SKIP=${safe.skip}).`)
	}
	return safe
}

function summarize(tests, results, hardAbort, reconnectPass) {
	const actionIds = new Set(results.filter((result) => result.status === 'PASS').map((result) => result.action))
	if (reconnectPass) actionIds.add('reconnect')
	return {
		generatedUtc: new Date().toISOString(),
		revision: RELEASE_REVISION,
		moduleVersion: EXPECTED_MODULE_VERSION,
		targetModel: EXPECTED_MODEL,
		testCount: tests.length,
		pass: results.filter((result) => result.status === 'PASS').length,
		fail: results.filter((result) => result.status === 'FAIL').length,
		hardAbort,
		reconnect: reconnectPass ? 'PASS' : 'FAIL',
		passedActionIds: [...actionIds].sort(),
		results,
	}
}

async function main() {
	const prepareOnly = process.argv.includes('--prepare-only')
	if (!prepareOnly) {
		if (!process.argv.includes('--allow-hardware-writes')) throw new Error('REFUSED: missing --allow-hardware-writes.')
		if (!process.argv.includes('--confirm-all-output-routing-isolated')) {
			throw new Error('REFUSED: missing --confirm-all-output-routing-isolated.')
		}
	}
	if (EXPECTED_MODULE_VERSION !== '0.1.20') {
		throw new Error(`REFUSED: V1 release smoke is pinned to audited module 0.1.20, current package is ${EXPECTED_MODULE_VERSION}.`)
	}
	if (!prepareOnly) requireFreshSafeResult()

	console.log('')
	console.log('==================================================================')
	console.log(' FOCUSRITE 18i20 V1 RELEASE SMOKE - FINAL PUBLIC WRITE SURFACE')
	console.log('==================================================================')
	console.log(prepareOnly ? 'PREPARE-ONLY: Companion Page 2 audit/import; zero hardware writes.' : 'Only retained v1 public actions are generated or pressed.')
	console.log('Every hardware write requires known server state and exact restoration.')
	console.log('Any unconfirmed restore causes an immediate hard abort.')
	console.log('No ALT/Stereo/Custom Mix/disruptive/raw/Monitor-gain write exists in this runner.')
	console.log('')

	const safePlan = JSON.parse(fs.readFileSync(safePlanPath, 'utf8'))
	const baseUrl = await findCompanion()
	const connections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	const exported = await exportButtons(baseUrl)
	const r9 = auditR9(exported, safePlan, connections)
	const label = String(r9.connection.label)
	line('PASS', 'r9 / module audit', '0.1.20 loaded on existing Focusrite connection; 829 feedback probes present')

	const model = await readVariable(baseUrl, label, 'device_model')
	const authorised = normalizeBool(await readVariable(baseUrl, label, 'client_authorised'))
	const status = await readVariable(baseUrl, label, 'connection_status')
	if (model !== EXPECTED_MODEL || authorised !== 'true' || !/authorised/i.test(status)) {
		throw new Error('Exact model / Remote Devices authorisation preflight failed.')
	}
	line('PASS', 'Preflight', 'Scarlett 18i20 (3rd Gen) + authorised module client')

	const [values, sources] = await Promise.all([captureReleaseState(baseUrl, label), captureSources(baseUrl, label)])
	const tests = buildReleaseTests(values, sources)
	if (!tests.length) throw new Error('No V1 release hardware tests could be built from current server-confirmed state.')
	const actionFamilies = new Set(tests.map((test) => test.change.definitionId))
	for (const required of [
		'monitor_preset',
		'input_mode_cycle',
		'input_nickname',
		'output_mute',
		'output_gain_set',
		'output_gain_adjust',
		'output_source',
		'output_pair_source',
		'output_nickname',
		'device_nickname',
		'phantom_persistence',
		'talkback_source',
	]) {
		if (!actionFamilies.has(required)) throw new Error(`REFUSED BEFORE WRITE: no runnable ${required} release test in current state.`)
	}
	line('PASS', 'Release plan', `${tests.length} exact-restore tests across ${actionFamilies.size + 1} retained action IDs`)

	const built = buildReleasePage(tests)
	const releasePage = await ensureReleasePage(baseUrl, built, r9, connections, exported)
	line('PASS', 'Release Page 2', `${built.signature}; ${tests.length} tests; only retained v1 actions`)
	if (prepareOnly) {
		line('PASS', 'Prepare-only', 'Release harness ready; ZERO hardware writes performed.')
		return
	}

	const results = []
	let hardAbort = false
	for (const test of tests) {
		const execution = await executeTest(baseUrl, label, releasePage.pageNumber, test, built.locations[test.id])
		results.push(execution.result)
		line(execution.result.status, test.label, execution.result.detail)
		if (execution.hardAbort) {
			hardAbort = true
			break
		}
		await sleep(120)
	}

	if (!hardAbort) {
		const drift = await verifyReleaseStateBaseline(baseUrl, label, values)
		if (drift.length) {
			hardAbort = true
			line('FAIL', 'Global restore audit', `HARD ABORT: ${drift.length} release-state variable(s) differ from the pre-write baseline.`)
		} else {
			line('PASS', 'Global restore audit', 'All captured release-state variables match the pre-write baseline.')
		}
	}

	let reconnectPass = false
	if (!hardAbort) {
		try {
			reconnectPass = await runReconnect(baseUrl, label, releasePage.pageNumber, built.locations.reconnect.change)
			line(reconnectPass ? 'PASS' : 'FAIL', 'Reconnect', reconnectPass ? 'Connection returned authorised.' : 'Connection did not return authorised in time.')
		} catch (error) {
			line('FAIL', 'Reconnect', error.message)
		}
	}

	const summary = summarize(tests, results, hardAbort, reconnectPass)
	fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, '\t')}\n`, 'utf8')
	console.log('')
	console.log('==================================================================')
	console.log(`V1 RELEASE SUMMARY: PASS ${summary.pass} / FAIL ${summary.fail} / RECONNECT ${summary.reconnect}`)
	console.log('==================================================================')

	if (hardAbort) process.exitCode = 4
	else if (summary.fail > 0 || !reconnectPass) process.exitCode = 2
	else process.exitCode = 0
}

if (require.main === module) {
	main().catch((error) => {
		line('FAIL', 'V1 release smoke', error.message)
		console.log('ABORTED. No further hardware write should be attempted until the failure is diagnosed.')
		process.exitCode = 2
	})
}

module.exports = {
	RELEASE_MARKER,
	RELEASE_REVISION,
	V1_RELEASE_ALLOWED,
	V1_RELEASE_WITHHELD,
	outputAvailabilityAllows,
	outputControlAllowed,
	directSourceCandidates,
	stereoSourcePairs,
	baselinePairSource,
	buildReleaseTests,
	buildReleasePage,
	redactOptions,
	pageLooksLikeVerifiedTestBench,
	auditReleasePage,
	expectedMatches,
	requireFreshSafeResult,
	verifyReleaseStateBaseline,
	baselineValueEqual,
}
