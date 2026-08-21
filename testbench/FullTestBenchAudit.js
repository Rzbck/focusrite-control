const { EXPECTED_MODEL, EXPECTED_MODULE, EXPECTED_MODULE_VERSION, R9_PAGE_NAME, R9_MARKER, EXT_MARKER, EXT_INSTANCE_ID, FILE_VERSION, COMPANION_BUILD, testbenchDir, safePlanPath, generatedDir, resultsDir, generatedPagePath, generatedManifestPath, MONITOR_PRESET_VALUES, TALKBACK_SOURCE_CANDIDATES, OUTPUT_PAIR_LEFT_INDICES, DISRUPTIVE_DEFINITIONS, FORBIDDEN_DEFINITIONS, EXTENDED_ALLOWED, nowIso, line, sleep, stableStringify, hashObject, deterministicId, canonicalBool, boolState, rawPanToPercent, expectedPanRaw, request, findCompanion, get, post, readVariableOptional, readVariable, waitVariable, waitExact, mapLimit, unwrapOptions, actionSetsContainWrites, collectActions, collectFeedbacks, pageHasMarker, resolveLiveConnection, exportButtons } = require('./FullTestBenchBase')

function auditSafeSetters(page, safePlan) {
	const seen = new Set()
	const refs = new Set()
	for (const test of safePlan.tests) {
		for (const setter of test.setters) {
			const location = `${setter.row}/${setter.column}`
			if (seen.has(location)) throw new Error(`Duplicate SAFE setter ${location}.`)
			seen.add(location)
			const control = page.controls?.[String(setter.row)]?.[String(setter.column)]
			if (!control || control.type !== 'button-layered') throw new Error(`SAFE control mismatch at ${location}.`)
			const down = control.steps?.['0']?.action_sets?.down
			if (!Array.isArray(down) || down.length !== 1) throw new Error(`SAFE action-set mismatch at ${location}.`)
			for (const [setId, actions] of Object.entries(control.steps?.['0']?.action_sets || {})) {
				if (setId === 'down') continue
				if (!Array.isArray(actions) || actions.length !== 0) throw new Error(`SAFE extra action-set at ${location}.`)
			}
			const action = down[0]
			if (action.type !== 'action' || action.definitionId !== setter.definitionId) {
				throw new Error(`SAFE action mismatch at ${location}.`)
			}
			if (stableStringify(unwrapOptions(action.options)) !== stableStringify(setter.options)) {
				throw new Error(`SAFE option mismatch at ${location}.`)
			}
			if (!action.connectionId) throw new Error(`SAFE connection missing at ${location}.`)
			refs.add(action.connectionId)
		}
	}
	if (seen.size !== 42 || refs.size !== 1) throw new Error('SAFE Core must contain exactly 42 setters on one Focusrite instance.')
	return [...refs][0]
}

function auditR9(exported, safePlan, connections) {
	let matches = Object.entries(exported.pages).filter(([, page]) => page?.name === R9_PAGE_NAME)
	if (matches.length === 0) matches = Object.entries(exported.pages).filter(([, page]) => pageHasMarker(page, R9_MARKER))
	if (matches.length !== 1) throw new Error('Expected exactly one existing r9 FULL MATRIX page.')
	const [pageNumber, page] = matches[0]
	const grid = page.gridSize || {}
	if (Number(grid.minColumn) !== 0 || Number(grid.maxColumn) !== 45 || Number(grid.minRow) !== 0 || Number(grid.maxRow) !== 25) {
		throw new Error('r9 page grid is not 46x26.')
	}
	const coreConnectionId = auditSafeSetters(page, safePlan)
	const probes = collectFeedbacks(page)
	const defs = new Set(probes.map((probe) => probe.definitionId))
	if (probes.length !== 829 || defs.size !== 31) {
		throw new Error(`r9 feedback matrix mismatch: ${probes.length} probes / ${defs.size} definitions.`)
	}
	const referenced = new Set([coreConnectionId, ...probes.map((probe) => probe.connectionId)])
	if (referenced.size !== 1) throw new Error('r9 Core and feedback matrix must reference one Focusrite instance.')
	const referencedId = [...referenced][0]
	const instance = exported.instances?.[referencedId]
	if (!instance || instance.moduleId !== EXPECTED_MODULE) throw new Error('r9 page does not reference the expected Focusrite module.')
	const version = String(instance.moduleVersionId || '').trim()
	if (version !== EXPECTED_MODULE_VERSION) {
		throw new Error(`Loaded Focusrite Companion module version mismatch: expected ${EXPECTED_MODULE_VERSION}, got ${version || 'unknown'}.`)
	}
	return {
		pageNumber: Number(pageNumber),
		page,
		probes,
		instance,
		connection: resolveLiveConnection(connections, instance),
	}
}

function expectedFeedback(probe) {
	const o = probe.options || {}
	const input = Number(o.input) + 1
	const output = Number(o.output) + 1
	const slot = Number(o.slot)
	const lane = o.mix && o.side ? `mix_${String(o.mix).toLowerCase().replace(/\s+/g, '_')}_${o.side === 'left' ? 'l' : 'r'}` : ''
	const map = {
		connected: { kind: 'connected', variable: 'connection_status' },
		authorised: { kind: 'bool', variable: 'client_authorised' },
		monitor_mute: { kind: 'bool', variable: 'monitor_mute' },
		monitor_dim: { kind: 'bool', variable: 'monitor_dim' },
		monitor_talkback: { kind: 'bool', variable: 'monitor_talkback' },
		monitor_alt: { kind: 'bool', variable: 'monitor_alt' },
		monitor_alt_enable: { kind: 'bool', variable: 'monitor_altEnable' },
		monitor_preset: { kind: 'equals', variable: 'monitor_preset', value: String(o.value) },
		device_preset: { kind: 'equals', variable: 'device_devicePreset', value: String(o.value) },
		clock_source: { kind: 'equals', variable: 'device_clockSource', value: String(o.value) },
		sample_rate: { kind: 'equals', variable: 'device_sampleRate', value: String(o.value) },
		spdif_mode: { kind: 'equals', variable: 'device_spdifMode', value: String(o.value) },
		clock_locked: { kind: 'bool', variable: 'device_clockLocked' },
		talkback_source: { kind: 'equals', variable: 'device_talkbackInputSource', value: String(o.source) },
		phantom_persistence: { kind: 'bool', variable: 'device_phantomPersistence' },
	}
	if (map[probe.definitionId]) return map[probe.definitionId]
	if (probe.definitionId === 'input_air') return { kind: 'bool', variable: `input_${input}_air` }
	if (probe.definitionId === 'input_pad') return { kind: 'bool', variable: `input_${input}_pad` }
	if (probe.definitionId === 'input_available') return { kind: 'bool', variable: `input_${input}_available` }
	if (probe.definitionId === 'input_mode') return { kind: 'equals', variable: `input_${input}_mode`, value: String(o.mode) }
	if (probe.definitionId === 'input_meter') return { kind: 'eval', source: `input_${input}_meter` }
	if (probe.definitionId === 'output_mute') return { kind: 'bool', variable: `output_${output}_mute` }
	if (probe.definitionId === 'output_stereo') return { kind: 'bool', variable: `output_${output}_stereo` }
	if (probe.definitionId === 'output_source') return { kind: 'equals', variable: `output_${output}_source`, value: String(o.source) }
	if (probe.definitionId === 'output_available') return { kind: 'bool', variable: `output_${output}_available` }
	if (probe.definitionId === 'output_meter') return { kind: 'eval', source: `output_${output}_meter` }
	if (probe.definitionId === 'mixer_slot_stereo') return { kind: 'bool', variable: `mixer_slot_${slot}_stereo` }
	if (probe.definitionId === 'mixer_slot_source') return { kind: 'equals', variable: `mixer_slot_${slot}_source`, value: String(o.source) }
	if (probe.definitionId === 'mix_mute') return { kind: 'optionalBool', variable: `${lane}_slot_${slot}_mute` }
	if (probe.definitionId === 'mix_solo') return { kind: 'optionalBool', variable: `${lane}_slot_${slot}_solo` }
	if (probe.definitionId === 'mix_talkback') return { kind: 'bool', variable: `${lane}_talkback` }
	if (probe.definitionId === 'mix_meter') return { kind: 'eval', source: `${lane}_meter` }
	return { kind: 'eval', source: 'unmapped-callback' }
}

async function readFeedbackMarker(baseUrl, pageNumber, probe) {
	const variable = `b_text_${pageNumber}_${probe.row}_${probe.column}`
	const readOnce = async () => {
		const item = await readVariableOptional(baseUrl, 'internal', variable, 1800)
		if (!item.exists) return null
		const lines = String(item.value).split(/\r?\n/)
		const marker = String(lines.at(-1) || '').trim()
		return ['T', 'F'].includes(marker) ? marker : null
	}
	let marker = await readOnce()
	if (marker) return marker
	await post(baseUrl, `/api/location/${pageNumber}/${probe.row}/${probe.column}/press`, 3000)
	const deadline = Date.now() + 1500
	while (Date.now() < deadline) {
		marker = await readOnce()
		if (marker) return marker
		await sleep(80)
	}
	return null
}

async function sweepFeedbacks(baseUrl, label, r9, report, phase) {
	line('INFO', 'Feedback sweep', `${phase}: 829 probes / 31 definitions`)
	let pass = 0
	let evalOnly = 0
	let fail = 0
	let completed = 0
	await mapLimit(r9.probes, 20, async (probe) => {
		const marker = await readFeedbackMarker(baseUrl, r9.pageNumber, probe)
		const expected = expectedFeedback(probe)
		let status = 'EVAL_ONLY'
		let detail = `definition=${probe.definitionId}; marker=${marker || '?'}`
		if (!marker) {
			status = 'FAIL'
			detail += '; unresolved rendered feedback marker'
			fail++
		} else if (expected.kind === 'eval') {
			evalOnly++
			detail += `; source=${expected.source}`
		} else {
			const item = await readVariableOptional(baseUrl, label, expected.variable, 2500)
			if (!item.exists || item.value === '') {
				evalOnly++
				detail += `; independent variable unavailable (${expected.variable})`
			} else {
				let wanted = false
				if (expected.kind === 'connected') wanted = String(item.value).startsWith('Connected')
				else if (expected.kind === 'bool' || expected.kind === 'optionalBool') wanted = canonicalBool(item.value) === 'true'
				else if (expected.kind === 'equals') wanted = String(item.value) === String(expected.value)
				const actual = marker === 'T'
				if (actual === wanted) {
					status = 'PASS'
					pass++
				} else {
					status = 'FAIL'
					fail++
				}
				detail += `; expected=${wanted ? 'T' : 'F'}; source=${expected.variable}`
			}
		}
		report.add(phase, `fb:${probe.row}/${probe.column}`, status, detail)
		completed++
		if (completed % 100 === 0) line('INFO', 'Feedback progress', `${completed}/829`)
	})
	line(fail ? 'FAIL' : 'PASS', 'Feedback sweep result', `PASS=${pass} EVAL_ONLY=${evalOnly} FAIL=${fail}`)
	return { pass, evalOnly, fail, total: 829 }
}

function getR9ActionLocations(page) {
	const found = new Map()
	for (const [row, rowObj] of Object.entries(page.controls || {})) {
		for (const [column, control] of Object.entries(rowObj || {})) {
			for (const action of collectActions(control)) {
				if (action?.type !== 'action') continue
				const list = found.get(action.definitionId) || []
				list.push({ row: Number(row), column: Number(column), options: unwrapOptions(action.options) })
				found.set(action.definitionId, list)
			}
		}
	}
	return found
}

async function pressLocation(baseUrl, pageNumber, location) {
	await post(baseUrl, `/api/location/${pageNumber}/${location.row}/${location.column}/press`, 10000)
}

function safePlanSetter(safePlan, test, target) {
	const match = test.setters.find((setter) => String(setter.targetValue) === String(target))
	if (!match) throw new Error(`No SAFE setter for ${test.id} -> ${target}.`)
	return match
}

async function captureOptionalVars(baseUrl, label, names, concurrency = 24) {
	const pairs = await mapLimit(names, concurrency, async (name) => [name, await readVariableOptional(baseUrl, label, name, 3000)])
	return Object.fromEntries(pairs)
}

function uniqueBy(items, keyFn) {
	const map = new Map()
	for (const item of items) map.set(keyFn(item), item)
	return [...map.values()]
}

function discoverShapeFromFeedbacks(probes) {
	const inputs = uniqueBy(
		probes
			.filter((p) => ['input_air', 'input_pad', 'input_available', 'input_mode'].includes(p.definitionId))
			.map((p) => Number(p.options.input)),
		(x) => x
	).sort((a, b) => a - b)
	const outputs = uniqueBy(
		probes.filter((p) => p.definitionId === 'output_mute').map((p) => Number(p.options.output)),
		(x) => x
	).sort((a, b) => a - b)
	const mixerSlots = uniqueBy(
		probes.filter((p) => p.definitionId === 'mixer_slot_stereo').map((p) => Number(p.options.slot)),
		(x) => x
	).sort((a, b) => a - b)
	const lanes = uniqueBy(
		probes
			.filter((p) => p.definitionId === 'mix_mute')
			.map((p) => ({ mix: String(p.options.mix), side: String(p.options.side) })),
		(x) => `${x.mix}/${x.side}`
	).sort((a, b) => `${a.mix}/${a.side}`.localeCompare(`${b.mix}/${b.side}`))
	return { inputs, outputs, mixerSlots, lanes }
}

function laneBase(lane) {
	return `mix_${lane.mix.toLowerCase().replace(/\s+/g, '_')}_${lane.side === 'left' ? 'l' : 'r'}`
}

async function captureFullSnapshot(baseUrl, label, shape) {
	const names = new Set([
		'device_nickname',
		'monitor_altEnable',
		'monitor_alt',
		'monitor_preset',
		'device_phantomPersistence',
		'device_talkbackInputSource',
	])
	for (const i of shape.inputs) names.add(`input_${i + 1}_nickname`)
	for (const o of shape.outputs) {
		for (const key of ['mute', 'source', 'stereo', 'nickname', 'gain']) names.add(`output_${o + 1}_${key}`)
	}
	for (const s of shape.mixerSlots) {
		names.add(`mixer_slot_${s}_source`)
		names.add(`mixer_slot_${s}_stereo`)
	}
	for (const lane of shape.lanes) {
		const base = laneBase(lane)
		names.add(`${base}_talkback`)
		for (let slot = 1; slot <= 24; slot++) {
			for (const key of ['gain', 'pan', 'mute', 'solo']) names.add(`${base}_slot_${slot}_${key}`)
		}
	}
	const values = await captureOptionalVars(baseUrl, label, [...names])
	return { shape, values }
}

async function chooseTestSource(baseUrl, label, snapshot, shape) {
	for (const s of shape.mixerSlots) {
		const v = snapshot.values[`mixer_slot_${s}_source`]
		if (v?.exists && v.value && v.value !== '0') return v.value
	}
	for (const o of shape.outputs) {
		const v = snapshot.values[`output_${o + 1}_source`]
		if (v?.exists && v.value && v.value !== '0') return v.value
	}
	for (let n = 1; n <= 128; n++) {
		const v = await readVariableOptional(baseUrl, label, `source_${n}_root_id`, 2000)
		if (!v.exists) {
			if (n > 8) break
			continue
		}
		if (v.value && v.value !== '0') return v.value
	}
	throw new Error('No known non-zero hardware/playback source could be selected for routing tests.')
}


module.exports = { auditSafeSetters, auditR9, expectedFeedback, readFeedbackMarker, sweepFeedbacks, getR9ActionLocations, pressLocation, safePlanSetter, captureOptionalVars, uniqueBy, discoverShapeFromFeedbacks, laneBase, captureFullSnapshot, chooseTestSource }
