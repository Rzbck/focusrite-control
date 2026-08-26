'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { EXPECTED_MODULE, resultsDir, nowIso, findCompanion, get, readVariableOptional } = require('./FullTestBenchBase')
const { normalizeConnections } = require('./FullTestBenchCompanionImportV7')

const PREVIOUS_REPORT = path.join(resultsDir, 'FINAL_PREVIOUS_MANUAL_FEEDBACK_SWEEP.json')
const CURRENT_REPORT = path.join(resultsDir, 'LATEST_MANUAL_FEEDBACK_SWEEP.json')
const OUTPUT_REPORT = path.join(resultsDir, 'FINAL_CUSTOM_MIX_COVERAGE.json')
const RELATIVE_OUTPUT = 'testbench\\results\\FINAL_CUSTOM_MIX_COVERAGE.json'
const OUTPUT_PAIR_LEFT_NUMBERS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25]

const MIX_BOOL_DEFINITIONS = new Set(['mix_mute', 'mix_solo', 'mix_talkback'])

function loadJson(file) {
	if (!fs.existsSync(file)) return null
	return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function mergeControlPaths(reports) {
	const merged = new Map()
	for (const report of reports.filter(Boolean)) {
		for (const pathEntry of report?.controls?.paths || []) {
			const id = String(pathEntry.id || '')
			if (!id) continue
			const current = merged.get(id) || {
				id,
				definitionId: pathEntry.definitionId,
				options: pathEntry.options || {},
				seenTrue: false,
				seenFalse: false,
				observations: 0,
				transitions: 0,
				mismatch: false,
			}
			current.seenTrue ||= Boolean(pathEntry.seenTrue)
			current.seenFalse ||= Boolean(pathEntry.seenFalse)
			current.observations += Number(pathEntry.observations || 0)
			current.transitions += Number(pathEntry.transitions || 0)
			current.mismatch ||= Boolean(pathEntry.mismatch)
			merged.set(id, current)
		}
	}
	return merged
}

function mergeDiagnosticPaths(reports) {
	const merged = new Map()
	for (const report of reports.filter(Boolean)) {
		for (const pathEntry of report?.diagnostics?.paths || []) {
			const id = String(pathEntry.id || '')
			if (!id) continue
			const current = merged.get(id) || {
				id,
				label: String(pathEntry.label || id),
				kind: String(pathEntry.kind || ''),
				transitions: 0,
				observed: new Set(),
			}
			current.transitions += Number(pathEntry.transitions || 0)
			for (const value of pathEntry.observed || []) current.observed.add(String(value))
			merged.set(id, current)
		}
	}
	return merged
}

function mergeMeterPaths(reports) {
	const merged = new Map()
	for (const report of reports.filter(Boolean)) {
		for (const pathEntry of report?.meters?.paths || []) {
			const id = String(pathEntry.id || '')
			if (!id) continue
			const current = merged.get(id) || {
				id,
				definitionId: pathEntry.definitionId,
				label: String(pathEntry.label || id),
				seenFloor: false,
				seenMovement: false,
				mismatch: false,
			}
			current.seenFloor ||= Boolean(pathEntry.seenFloor)
			current.seenMovement ||= Boolean(pathEntry.seenMovement)
			current.mismatch ||= Boolean(pathEntry.mismatch)
			merged.set(id, current)
		}
	}
	return merged
}

function usefulObservedValues(entry) {
	return [...(entry?.observed || [])].filter((value) => value && value !== 'UNKNOWN')
}

function pathObservedTrue(entry) {
	return usefulObservedValues(entry).includes('true')
}

function pathObservedCustomMix(entry) {
	return usefulObservedValues(entry).some((value) => /mix/i.test(value))
}

function summarizeCustomMixCoverage(controlPaths, diagnosticPaths, meterPaths) {
	const mixControls = [...controlPaths.values()].filter((entry) => MIX_BOOL_DEFINITIONS.has(entry.definitionId))
	const controlSummary = { total: mixControls.length, closedBothStates: 0, singleState: 0, mismatch: 0 }
	for (const entry of mixControls) {
		if (entry.mismatch) controlSummary.mismatch++
		if (entry.seenTrue && entry.seenFalse && !entry.mismatch) controlSummary.closedBothStates++
		else controlSummary.singleState++
	}

	const stripDiagnostics = [...diagnosticPaths.values()].filter((entry) =>
		/^mix_.+_slot_\d+_(gain|pan)$/.test(entry.id),
	)
	const stripSummary = { total: stripDiagnostics.length, changed: 0, unchanged: 0 }
	for (const entry of stripDiagnostics) {
		if (entry.transitions > 0 || usefulObservedValues(entry).length > 1) stripSummary.changed++
		else stripSummary.unchanged++
	}

	const slotStereo = [...diagnosticPaths.values()].filter((entry) => /^mixer_slot_\d+_stereo$/.test(entry.id))
	const stereoSummary = { total: slotStereo.length, changed: 0, unchanged: 0 }
	for (const entry of slotStereo) {
		if (entry.transitions > 0 || usefulObservedValues(entry).length > 1) stereoSummary.changed++
		else stereoSummary.unchanged++
	}

	const routingSummary = { eligiblePairs: 0, customMixObservedPairs: 0, missingPairs: 0 }
	for (const leftNumber of OUTPUT_PAIR_LEFT_NUMBERS) {
		const rightNumber = leftNumber + 1
		const leftAvailable = diagnosticPaths.get(`output_${leftNumber}_available`)
		const rightAvailable = diagnosticPaths.get(`output_${rightNumber}_available`)
		if (!pathObservedTrue(leftAvailable) || !pathObservedTrue(rightAvailable)) continue
		routingSummary.eligiblePairs++
		const leftSource = diagnosticPaths.get(`output_${leftNumber}_source_name`)
		const rightSource = diagnosticPaths.get(`output_${rightNumber}_source_name`)
		if (pathObservedCustomMix(leftSource) || pathObservedCustomMix(rightSource)) routingSummary.customMixObservedPairs++
		else routingSummary.missingPairs++
	}

	const mixMeters = [...meterPaths.values()].filter((entry) => entry.definitionId === 'mix_meter')
	const meterSummary = { total: mixMeters.length, closed: 0, partial: 0, mismatch: 0 }
	for (const entry of mixMeters) {
		if (entry.mismatch) meterSummary.mismatch++
		if (entry.seenFloor && entry.seenMovement && !entry.mismatch) meterSummary.closed++
		else meterSummary.partial++
	}

	const complete =
		controlSummary.total > 0 &&
		controlSummary.closedBothStates === controlSummary.total &&
		controlSummary.mismatch === 0 &&
		stripSummary.total > 0 &&
		stripSummary.changed === stripSummary.total &&
		stereoSummary.total > 0 &&
		stereoSummary.changed === stereoSummary.total &&
		routingSummary.eligiblePairs > 0 &&
		routingSummary.customMixObservedPairs === routingSummary.eligiblePairs &&
		meterSummary.total > 0 &&
		meterSummary.closed === meterSummary.total &&
		meterSummary.mismatch === 0

	return {
		complete,
		controls: controlSummary,
		strips: stripSummary,
		stereo: stereoSummary,
		routing: routingSummary,
		meters: meterSummary,
	}
}

async function preflight() {
	const baseUrl = await findCompanion()
	const connections = normalizeConnections(JSON.parse(await get(baseUrl, '/api/connections')))
	const candidates = connections.filter((connection) => connection?.moduleId === EXPECTED_MODULE && connection?.label)
	if (candidates.length !== 1) {
		throw new Error(`Expected exactly one live ${EXPECTED_MODULE} connection, got ${candidates.length}.`)
	}
	const label = String(candidates[0].label)
	const diagnosticVariables = ['mix_mix_a_l_slot_1_gain', 'mix_mix_a_l_slot_1_pan']
	let found = 0
	for (const variable of diagnosticVariables) {
		const item = await readVariableOptional(baseUrl, label, variable, 1200).catch(() => ({ exists: false }))
		if (item.exists) found++
	}
	if (found !== diagnosticVariables.length) {
		console.log('FINAL CUSTOM MIX PREFLIGHT: diagnostic mixer variables are not fully exposed.')
		console.log("Dans la connexion Companion Focusrite, active 'Expose mixer diagnostic variables (read-only)'.")
		console.log('Cette option est READ-ONLY et ne change aucun routing Focusrite.')
		process.exitCode = 3
		return
	}
	console.log(`FINAL CUSTOM MIX PREFLIGHT PASS: ${found}/${diagnosticVariables.length} representative diagnostic variable(s) visible.`)
}

function writeCoverage() {
	const previous = loadJson(PREVIOUS_REPORT)
	const current = loadJson(CURRENT_REPORT)
	if (!current) throw new Error('Current manual feedback report is missing.')
	const reports = [previous, current].filter(Boolean)
	const controlPaths = mergeControlPaths(reports)
	const diagnosticPaths = mergeDiagnosticPaths(reports)
	const meterPaths = mergeMeterPaths(reports)
	const summary = summarizeCustomMixCoverage(controlPaths, diagnosticPaths, meterPaths)
	const payload = {
		reportVersion: 1,
		reportClass: 'final-custom-mix-cumulative-coverage',
		updatedAt: nowIso(),
		reportsMerged: reports.length,
		readOnlyEvidence: true,
		complete: summary.complete,
		summary,
		privacy:
			'Counts and safe semantic coverage only; no serial, hostname, endpoint, client identity, raw XML, raw item value or user path is stored.',
	}
	fs.mkdirSync(resultsDir, { recursive: true })
	fs.writeFileSync(OUTPUT_REPORT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

	console.log('==================================================================')
	console.log(' FINAL CUSTOM MIX - COUVERTURE CUMULATIVE')
	console.log('==================================================================')
	console.log(`Rapports cumules: ${payload.reportsMerged}`)
	console.log(
		`Mute/Solo/Talkback both-states: ${summary.controls.closedBothStates}/${summary.controls.total} mismatch=${summary.controls.mismatch}`,
	)
	console.log(`Fader/Pan diagnostic paths changed: ${summary.strips.changed}/${summary.strips.total}`)
	console.log(`Mixer-slot Stereo paths changed: ${summary.stereo.changed}/${summary.stereo.total}`)
	console.log(
		`Output pairs ayant observe Custom Mix: ${summary.routing.customMixObservedPairs}/${summary.routing.eligiblePairs} missing=${summary.routing.missingPairs}`,
	)
	console.log(
		`Custom Mix meters floor+movement: ${summary.meters.closed}/${summary.meters.total} mismatch=${summary.meters.mismatch}`,
	)
	console.log(`Rapport local: ${RELATIVE_OUTPUT}`)
	console.log(
		summary.complete
			? 'FINAL CUSTOM MIX COVERAGE: COMPLETE'
			: 'FINAL CUSTOM MIX COVERAGE: PARTIAL - les compteurs ci-dessus montrent ce qui reste.',
	)
	if (summary.controls.mismatch || summary.meters.mismatch) process.exitCode = 4
	else if (!summary.complete) process.exitCode = 5
}

async function main() {
	if (process.argv.includes('--preflight')) return preflight()
	writeCoverage()
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`FINAL CUSTOM MIX COVERAGE FAILED - ${error.message}`)
		process.exitCode = 2
	})
}

module.exports = {
	mergeControlPaths,
	mergeDiagnosticPaths,
	mergeMeterPaths,
	summarizeCustomMixCoverage,
}
