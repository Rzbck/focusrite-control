const fs = require('node:fs')
const path = require('node:path')
const { EXPECTED_MODEL, EXPECTED_MODULE, EXPECTED_MODULE_VERSION, R9_PAGE_NAME, R9_MARKER, EXT_MARKER, EXT_INSTANCE_ID, FILE_VERSION, COMPANION_BUILD, testbenchDir, safePlanPath, generatedDir, resultsDir, generatedPagePath, generatedManifestPath, MONITOR_PRESET_VALUES, TALKBACK_SOURCE_CANDIDATES, OUTPUT_PAIR_LEFT_INDICES, DISRUPTIVE_DEFINITIONS, FORBIDDEN_DEFINITIONS, EXTENDED_ALLOWED, nowIso, line, sleep, stableStringify, hashObject, deterministicId, canonicalBool, boolState, rawPanToPercent, expectedPanRaw, request, findCompanion, get, post, readVariableOptional, readVariable, waitVariable, waitExact, mapLimit, unwrapOptions, actionSetsContainWrites, collectActions, collectFeedbacks, pageHasMarker, resolveLiveConnection, exportButtons } = require('./FullTestBenchBase')
const { auditSafeSetters, auditR9, expectedFeedback, readFeedbackMarker, sweepFeedbacks, getR9ActionLocations, pressLocation, safePlanSetter, captureOptionalVars, uniqueBy, discoverShapeFromFeedbacks, laneBase, captureFullSnapshot, chooseTestSource } = require('./FullTestBenchAudit')

class Reporter {
	constructor() {
		this.rows = []
		this.started = nowIso()
	}
	add(phase, target, status, detail = '') {
		this.rows.push({ at: nowIso(), phase, target, status, detail })
	}
	summary() {
		return this.rows.reduce((acc, row) => {
			acc[row.status] = (acc[row.status] || 0) + 1
			return acc
		}, {})
	}
	save(meta) {
		fs.mkdirSync(resultsDir, { recursive: true })
		const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
		const base = path.join(resultsDir, `full-testbench_${stamp}`)
		const payload = {
			schemaVersion: 1,
			started: this.started,
			finished: nowIso(),
			targetModel: EXPECTED_MODEL,
			moduleVersion: EXPECTED_MODULE_VERSION,
			meta,
			summary: this.summary(),
			results: this.rows,
			privacy: 'No serial, host, port, client key, raw XML/page export, Companion connection IDs, or live nicknames are stored.',
		}
		fs.writeFileSync(`${base}.json`, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
		const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
		const csv = [
			['at', 'phase', 'target', 'status', 'detail'].map(escapeCsv).join(','),
			...this.rows.map((row) => [row.at, row.phase, row.target, row.status, row.detail].map(escapeCsv).join(',')),
		].join('\n')
		fs.writeFileSync(`${base}.csv`, `${csv}\n`, 'utf8')
		const summary = this.summary()
		const txt = [
			'Focusrite Scarlett 18i20 (3rd Gen) FULL TestBench result',
			`Module: ${EXPECTED_MODULE_VERSION}`,
			`Started: ${this.started}`,
			`Finished: ${nowIso()}`,
			'',
			...Object.entries(summary).map(([key, value]) => `${key}: ${value}`),
			'',
			'Disruptive actions not executed by FULL: device_preset, clock_source, sample_rate, spdif_mode.',
			'Forbidden: Monitor gain 1677 writes, Advanced Raw writes, firmware/reset/restore/snapshot paths.',
			'Privacy: report omits endpoint, connection IDs, serial, live nicknames, client key, device ID, raw XML and raw page export.',
		].join('\n')
		fs.writeFileSync(`${base}.txt`, `${txt}\n`, 'utf8')
		return { json: `${base}.json`, csv: `${base}.csv`, txt: `${base}.txt` }
	}
}

async function pressBatch(baseUrl, extPageNumber, built, batchId) {
	const loc = built.locations[batchId]
	if (!loc) throw new Error(`Generated batch ${batchId} is unavailable.`)
	await pressLocation(baseUrl, extPageNumber, loc)
}

async function verifyMany(baseUrl, label, checks, timeoutMs = 8000) {
	const results = await mapLimit(checks, 20, async (check) => {
		const wait = await waitVariable(baseUrl, label, check.variable, check.predicate, timeoutMs)
		return { ...check, ok: wait.ok, actual: wait.value }
	})
	return results
}

function exactCheck(variable, expected) {
	return { variable, expected: String(expected), predicate: (value) => String(value) === String(expected) }
}

function boolCheck(variable, expected) {
	return { variable, expected: String(expected), predicate: (value) => canonicalBool(value) === String(expected) }
}

function numericCheck(variable, expected, tolerance = 0.0001) {
	return {
		variable,
		expected: String(expected),
		predicate: (value) => Number.isFinite(Number(value)) && Math.abs(Number(value) - Number(expected)) <= tolerance,
	}
}

function requireChecks(results, context) {
	const failed = results.filter((item) => !item.ok)
	if (failed.length) throw new Error(`${context}: ${failed.length}/${results.length} server confirmations failed (first: ${failed[0].variable}).`)
}

async function runBatchSequence({ baseUrl, label, extPageNumber, built, reporter, phase, target, steps, restore }) {
	let restoreNeeded = false
	try {
		for (const step of steps) {
			await pressBatch(baseUrl, extPageNumber, built, step.batch)
			restoreNeeded = true
			const results = await verifyMany(baseUrl, label, step.checks, step.timeoutMs || 8000)
			requireChecks(results, `${target} / ${step.batch}`)
			reporter.add(phase, `${target}:${step.batch}`, 'PASS', `${results.length} server-confirmed targets`)
		}
	} finally {
		if (restore && restoreNeeded && built.locations[restore.batch]) {
			await pressBatch(baseUrl, extPageNumber, built, restore.batch)
			const restored = await verifyMany(baseUrl, label, restore.checks, 10000)
			const failed = restored.filter((item) => !item.ok)
			if (failed.length) {
				reporter.add(phase, `${target}:restore`, 'RESTORE_FAIL', `${failed.length}/${restored.length} restores failed`)
				throw new Error(`HARD ABORT: ${target} restoration failed (${failed[0].variable}).`)
			}
			reporter.add(phase, `${target}:restore`, 'RESTORE_PASS', `${restored.length} server-confirmed restores`)
		}
	}
}

function checksForBatch(snapshot, batchId) {
	const { shape, values } = snapshot
	const v = (name) => values[name] || { exists: false, value: '' }
	const knownRestore = (name, kind = 'exact', baseline = '') => {
		const item = v(name)
		if (!item.exists) return null
		if (kind === 'bool') return boolCheck(name, canonicalBool(item.value) || baseline)
		if (kind === 'numeric') return numericCheck(name, item.value !== '' && Number.isFinite(Number(item.value)) ? Number(item.value) : Number(baseline))
		return exactCheck(name, item.value !== '' || baseline === '' ? item.value : baseline)
	}
	if (batchId === 'output-mute-on') return shape.outputs.filter((o) => v(`output_${o + 1}_mute`).exists).map((o) => boolCheck(`output_${o + 1}_mute`, 'true'))
	if (batchId === 'output-mute-restore') return shape.outputs.map((o) => knownRestore(`output_${o + 1}_mute`, 'bool', 'true')).filter(Boolean)
	if (batchId === 'output-source-none') return shape.outputs.filter((o) => v(`output_${o + 1}_source`).exists).map((o) => exactCheck(`output_${o + 1}_source`, '0'))
	if (batchId === 'output-source-restore') return shape.outputs.map((o) => knownRestore(`output_${o + 1}_source`, 'exact', '0')).filter(Boolean)
	if (batchId === 'output-gain-set') return shape.outputs.filter((o) => v(`output_${o + 1}_gain`).exists).map((o) => numericCheck(`output_${o + 1}_gain`, -128))
	if (batchId === 'output-gain-adjust') return shape.outputs.filter((o) => v(`output_${o + 1}_gain`).exists).map((o) => numericCheck(`output_${o + 1}_gain`, -127))
	if (batchId === 'output-gain-restore') return shape.outputs.map((o) => knownRestore(`output_${o + 1}_gain`, 'numeric', -128)).filter(Boolean)
	if (batchId === 'output-nick-temp') return shape.outputs.filter((o) => v(`output_${o + 1}_nickname`).exists).map((o) => exactCheck(`output_${o + 1}_nickname`, `TB_OUT_${String(o + 1).padStart(2, '0')}`))
	if (batchId === 'output-nick-restore') return shape.outputs.map((o) => knownRestore(`output_${o + 1}_nickname`)).filter(Boolean)
	if (batchId === 'output-stereo-off') return shape.outputs.filter((o) => v(`output_${o + 1}_stereo`).exists).map((o) => boolCheck(`output_${o + 1}_stereo`, 'false'))
	if (batchId === 'output-stereo-on') return shape.outputs.filter((o) => v(`output_${o + 1}_stereo`).exists).map((o) => boolCheck(`output_${o + 1}_stereo`, 'true'))
	if (batchId === 'output-stereo-restore') return shape.outputs.map((o) => knownRestore(`output_${o + 1}_stereo`, 'bool', 'false')).filter(Boolean)
	if (batchId === 'input-nick-temp') return shape.inputs.filter((i) => v(`input_${i + 1}_nickname`).exists).map((i) => exactCheck(`input_${i + 1}_nickname`, `TB_IN_${String(i + 1).padStart(2, '0')}`))
	if (batchId === 'input-nick-restore') return shape.inputs.map((i) => knownRestore(`input_${i + 1}_nickname`)).filter(Boolean)
	if (batchId === 'mixer-source-restore') return shape.mixerSlots.map((s) => knownRestore(`mixer_slot_${s}_source`)).filter(Boolean)
	if (batchId === 'mixer-stereo-off') return shape.mixerSlots.filter((s) => v(`mixer_slot_${s}_stereo`).exists).map((s) => boolCheck(`mixer_slot_${s}_stereo`, 'false'))
	if (batchId === 'mixer-stereo-on') return shape.mixerSlots.filter((s) => v(`mixer_slot_${s}_stereo`).exists).map((s) => boolCheck(`mixer_slot_${s}_stereo`, 'true'))
	if (batchId === 'mixer-stereo-restore') return shape.mixerSlots.map((s) => knownRestore(`mixer_slot_${s}_stereo`, 'bool', 'false')).filter(Boolean)
	return []
}

function batchChecksForLane(snapshot, lane, operation) {
	const base = laneBase(lane)
	const checks = []
	for (let slot = 1; slot <= 24; slot++) {
		const variable = `${base}_slot_${slot}_${operation.property}`
		const item = snapshot.values[variable]
		if (!item?.exists) continue
		if (operation.restore) {
			if (operation.kind === 'bool') {
				const baseline = operation.property === 'mute' ? 'true' : 'false'
				checks.push(boolCheck(variable, canonicalBool(item.value) || baseline))
			} else if (operation.property === 'gain') {
				checks.push(numericCheck(variable, item.value !== '' && Number.isFinite(Number(item.value)) ? Number(item.value) : -128))
			} else if (operation.property === 'pan') {
				checks.push(exactCheck(variable, item.value !== '' && Number.isFinite(Number(item.value)) ? item.value : expectedPanRaw(0)))
			} else checks.push(exactCheck(variable, item.value))
		} else if (operation.kind === 'bool') checks.push(boolCheck(variable, operation.value))
		else if (operation.property === 'pan') checks.push(exactCheck(variable, expectedPanRaw(operation.value)))
		else if (operation.property === 'gain') checks.push(numericCheck(variable, operation.value))
		else checks.push(exactCheck(variable, operation.value))
	}
	return checks
}

function recordBaselineImpacts(snapshot, reporter) {
	let count = 0
	for (const [name, item] of Object.entries(snapshot.values)) {
		if (!item.exists || item.value !== '') continue
		if (/nickname$/i.test(name) || name === 'device_nickname') continue
		count++
		reporter.add('baseline', name, 'BASELINE_DESTRUCTIVE', 'Initial server state was blank; FULL will retain a documented safe baseline for this state.')
	}
	return count
}

async function runCoreFull(baseUrl, label, r9, safePlan, reporter, deferMonitorMuteTest = true) {
	const initial = {}
	for (const test of safePlan.tests) initial[test.id] = await readVariableOptional(baseUrl, label, test.variable, 3000)
	const baselines = {
		'air-': 'false',
		'pad-': 'false',
		'monitor-mute': 'true',
		'monitor-dim': 'false',
		talkback: 'false',
		'input-1-mode': 'Line',
		'input-2-mode': 'Line',
	}
	const deferred = []
	for (const test of safePlan.tests) {
		if (deferMonitorMuteTest && test.id === 'monitor-mute') {
			deferred.push(test)
			continue
		}
		const item = initial[test.id]
		const kind = test.kind
		let original = item.exists ? item.value : ''
		if (kind === 'boolean') original = canonicalBool(original) || ''
		let baseline = original
		if (!baseline) {
			if (test.id.startsWith('air-')) baseline = baselines['air-']
			else if (test.id.startsWith('pad-')) baseline = baselines['pad-']
			else baseline = baselines[test.id]
			const setter = safePlanSetter(safePlan, test, baseline)
			await pressLocation(baseUrl, r9.pageNumber, setter)
			const established = kind === 'boolean'
				? await waitVariable(baseUrl, label, test.variable, (v) => canonicalBool(v) === baseline, 6000)
				: await waitExact(baseUrl, label, test.variable, baseline, 6000)
			if (!established.ok) throw new Error(`Could not establish FULL baseline for ${test.name}.`)
			reporter.add('core', test.id, 'BASELINE_ESTABLISHED', `cold-start unknown -> ${baseline}`)
		}
		const alternate = kind === 'boolean' ? (baseline === 'true' ? 'false' : 'true') : test.allowedInitial.find((x) => x !== baseline)
		const change = safePlanSetter(safePlan, test, alternate)
		const restore = safePlanSetter(safePlan, test, baseline)
		let changeError = ''
		let changeAttempted = false
		try {
			changeAttempted = true
			await pressLocation(baseUrl, r9.pageNumber, change)
			const changed = kind === 'boolean'
				? await waitVariable(baseUrl, label, test.variable, (v) => canonicalBool(v) === alternate, 6000)
				: await waitExact(baseUrl, label, test.variable, alternate, 6000)
			if (!changed.ok) changeError = `${test.name} did not confirm transition to ${alternate}.`
		} catch (error) {
			changeError = error.message
		} finally {
			if (changeAttempted) {
				await pressLocation(baseUrl, r9.pageNumber, restore)
				const restored = kind === 'boolean'
					? await waitVariable(baseUrl, label, test.variable, (v) => canonicalBool(v) === baseline, 6000)
					: await waitExact(baseUrl, label, test.variable, baseline, 6000)
				if (!restored.ok) throw new Error(`HARD ABORT: ${test.name} did not restore to ${baseline}.`)
			}
		}
		if (changeError) reporter.add('core', test.id, 'FAIL', `${changeError} Restore to ${baseline} confirmed.`)
		else reporter.add('core', test.id, 'PASS', `${baseline} -> ${alternate} -> ${baseline}${original ? ' (original restored)' : ' (FULL baseline retained)'}`)
	}
	return { initial, deferred }
}

async function testMonitorMuteCore(baseUrl, label, r9, safePlan, reporter, initialItem) {
	const test = safePlan.tests.find((item) => item.id === 'monitor-mute')
	const on = safePlanSetter(safePlan, test, 'true')
	const off = safePlanSetter(safePlan, test, 'false')
	await pressLocation(baseUrl, r9.pageNumber, on)
	requireChecks(await verifyMany(baseUrl, label, [boolCheck('monitor_mute', 'true')]), 'Monitor Mute guard')
	let changeError = ''
	try {
		await pressLocation(baseUrl, r9.pageNumber, off)
		const changed = await verifyMany(baseUrl, label, [boolCheck('monitor_mute', 'false')])
		if (changed.some((item) => !item.ok)) changeError = 'Monitor Mute OFF transition was not server-confirmed.'
	} catch (error) {
		changeError = error.message
	} finally {
		await pressLocation(baseUrl, r9.pageNumber, on)
		requireChecks(await verifyMany(baseUrl, label, [boolCheck('monitor_mute', 'true')]), 'Monitor Mute re-guard')
	}
	if (changeError) reporter.add('core', 'monitor-mute', 'FAIL', `${changeError} Protective ON restored.`)
	else reporter.add('core', 'monitor-mute', 'PASS', 'ON -> OFF -> ON under output-mute guard')
	return initialItem
}

async function restoreMonitorMuteCore(baseUrl, label, r9, safePlan, reporter, initialItem) {
	const original = initialItem?.exists ? canonicalBool(initialItem.value) : null
	if (!original) {
		reporter.add('restore', 'monitor-mute', 'BASELINE_RETAINED', 'Initial cold-start state was unknown; protective ON retained.')
		return
	}
	const test = safePlan.tests.find((item) => item.id === 'monitor-mute')
	const setter = safePlanSetter(safePlan, test, original)
	await pressLocation(baseUrl, r9.pageNumber, setter)
	const restored = await waitVariable(baseUrl, label, 'monitor_mute', (v) => canonicalBool(v) === original, 6000)
	if (!restored.ok) throw new Error('HARD ABORT: Monitor Mute original state restoration failed.')
	reporter.add('restore', 'monitor-mute', 'RESTORE_PASS', `restored original=${original}`)
}


module.exports = { Reporter, pressBatch, verifyMany, exactCheck, boolCheck, numericCheck, requireChecks, runBatchSequence, checksForBatch, batchChecksForLane, recordBaselineImpacts, runCoreFull, testMonitorMuteCore, restoreMonitorMuteCore }
