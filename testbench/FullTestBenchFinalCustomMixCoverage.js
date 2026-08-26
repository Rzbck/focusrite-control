'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { EXPECTED_MODULE, resultsDir, nowIso, findCompanion, get, readVariableOptional } = require('./FullTestBenchBase')
const { normalizeConnections } = require('./FullTestBenchCompanionImportV7')

const PREVIOUS_REPORT = path.join(resultsDir, 'FINAL_PREVIOUS_MANUAL_FEEDBACK_SWEEP.json')
const CURRENT_REPORT = path.join(resultsDir, 'LATEST_MANUAL_FEEDBACK_SWEEP.json')
const EVIDENCE_REPORT = path.join(resultsDir, 'FINAL_CUSTOM_MIX_EVIDENCE.json')
const OUTPUT_REPORT = path.join(resultsDir, 'FINAL_CUSTOM_MIX_COVERAGE.json')
const RELATIVE_EVIDENCE = 'testbench\\results\\FINAL_CUSTOM_MIX_EVIDENCE.json'
const RELATIVE_OUTPUT = 'testbench\\results\\FINAL_CUSTOM_MIX_COVERAGE.json'
const OUTPUT_PAIR_LEFT_NUMBERS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25]
const MIX_BOOL_DEFINITIONS = ['mix_mute', 'mix_solo', 'mix_talkback']

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
			current.observations = Math.max(current.observations, Number(pathEntry.observations || 0))
			current.transitions = Math.max(current.transitions, Number(pathEntry.transitions || 0))
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
			current.transitions = Math.max(current.transitions, Number(pathEntry.transitions || 0))
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

function pathChanged(entry) {
	return Number(entry?.transitions || 0) > 0 || usefulObservedValues(entry).length > 1
}

function pathObservedTrue(entry) {
	return usefulObservedValues(entry).includes('true')
}

function pathObservedCustomMix(entry) {
	return usefulObservedValues(entry).some((value) => /mix/i.test(value))
}

function summarizeBooleanFamily(controlPaths, definitionId) {
	const paths = [...controlPaths.values()].filter((entry) => entry.definitionId === definitionId)
	const mismatch = paths.filter((entry) => entry.mismatch).length
	const closedPaths = paths.filter((entry) => entry.seenTrue && entry.seenFalse && !entry.mismatch).length
	return {
		total: paths.length,
		closedPaths,
		mismatch,
		complete: closedPaths > 0 && mismatch === 0,
	}
}

function summarizeChangedDiagnostics(diagnosticPaths, pattern) {
	const paths = [...diagnosticPaths.values()].filter((entry) => pattern.test(entry.id))
	const changed = paths.filter(pathChanged).length
	return { total: paths.length, changed, complete: changed > 0 }
}

function summarizeCustomMixCoverage(controlPaths, diagnosticPaths, meterPaths) {
	const representatives = Object.fromEntries(
		MIX_BOOL_DEFINITIONS.map((definitionId) => [definitionId, summarizeBooleanFamily(controlPaths, definitionId)]),
	)
	const controlSummary = {
		total: MIX_BOOL_DEFINITIONS.reduce((sum, definitionId) => sum + representatives[definitionId].total, 0),
		mismatch: MIX_BOOL_DEFINITIONS.reduce((sum, definitionId) => sum + representatives[definitionId].mismatch, 0),
		representatives,
		complete: MIX_BOOL_DEFINITIONS.every((definitionId) => representatives[definitionId].complete),
	}

	const stripSummary = {
		gain: summarizeChangedDiagnostics(diagnosticPaths, /^mix_.+_slot_\d+_gain$/),
		pan: summarizeChangedDiagnostics(diagnosticPaths, /^mix_.+_slot_\d+_pan$/),
	}
	stripSummary.complete = stripSummary.gain.complete && stripSummary.pan.complete

	const stereoSummary = summarizeChangedDiagnostics(diagnosticPaths, /^mixer_slot_\d+_stereo$/)

	const routingSummary = { eligiblePairs: 0, customMixObservedPairs: 0, complete: false }
	for (const leftNumber of OUTPUT_PAIR_LEFT_NUMBERS) {
		const rightNumber = leftNumber + 1
		const leftAvailable = diagnosticPaths.get(`output_${leftNumber}_available`)
		const rightAvailable = diagnosticPaths.get(`output_${rightNumber}_available`)
		if (!pathObservedTrue(leftAvailable) || !pathObservedTrue(rightAvailable)) continue
		routingSummary.eligiblePairs++
		const leftSource = diagnosticPaths.get(`output_${leftNumber}_source_name`)
		const rightSource = diagnosticPaths.get(`output_${rightNumber}_source_name`)
		if (pathObservedCustomMix(leftSource) || pathObservedCustomMix(rightSource)) routingSummary.customMixObservedPairs++
	}
	routingSummary.complete = routingSummary.customMixObservedPairs > 0

	const mixMeters = [...meterPaths.values()].filter((entry) => entry.definitionId === 'mix_meter')
	const meterSummary = { total: mixMeters.length, closed: 0, partial: 0, mismatch: 0, complete: false }
	for (const entry of mixMeters) {
		if (entry.mismatch) meterSummary.mismatch++
		if (entry.seenFloor && entry.seenMovement && !entry.mismatch) meterSummary.closed++
		else meterSummary.partial++
	}
	meterSummary.complete = meterSummary.total === 12 && meterSummary.closed === 12 && meterSummary.mismatch === 0

	const complete =
		controlSummary.complete &&
		stripSummary.complete &&
		stereoSummary.complete &&
		routingSummary.complete &&
		meterSummary.complete

	return {
		complete,
		controls: controlSummary,
		strips: stripSummary,
		stereo: stereoSummary,
		routing: routingSummary,
		meters: meterSummary,
	}
}

function missingTasks(summary) {
	const tasks = []
	if (!summary.controls.representatives.mix_mute.complete) tasks.push('Mute ON/OFF sur UNE tranche')
	if (!summary.controls.representatives.mix_solo.complete) tasks.push('Solo ON/OFF sur UNE tranche')
	if (!summary.strips.gain.complete) tasks.push('fader: 2 positions sur UNE tranche')
	if (!summary.strips.pan.complete) tasks.push('pan: 2 positions sur UNE tranche')
	if (!summary.stereo.complete) tasks.push('Stereo/Mono: UNE bascule visible')
	if (!summary.routing.complete) tasks.push("router UNE paire d'Outputs disponible vers Custom Mix")
	if (!summary.controls.representatives.mix_talkback.complete) tasks.push('Talkback ON/OFF sur UN Custom Mix, seulement si sur')
	if (!summary.meters.complete) tasks.push('meters: quelques secondes de signal puis silence')
	return tasks
}

function persistentEvidence(controlPaths, diagnosticPaths, meterPaths) {
	return {
		reportVersion: 1,
		reportClass: 'final-custom-mix-cumulative-evidence',
		updatedAt: nowIso(),
		readOnlyEvidence: true,
		controls: { paths: [...controlPaths.values()] },
		diagnostics: {
			paths: [...diagnosticPaths.values()].map((entry) => ({ ...entry, observed: [...entry.observed] })),
		},
		meters: { paths: [...meterPaths.values()] },
		privacy:
			'Safe semantic state classes and feedback booleans only; no serial, hostname, endpoint, client identity, raw XML, raw private item value or user path is stored.',
	}
}

function mergedLocalEvidence(requireCurrent = true) {
	const accumulated = loadJson(EVIDENCE_REPORT)
	const previous = loadJson(PREVIOUS_REPORT)
	const current = loadJson(CURRENT_REPORT)
	if (requireCurrent && !current) throw new Error('Current manual feedback report is missing.')
	const reports = [accumulated, previous, current].filter(Boolean)
	return {
		reports,
		controlPaths: mergeControlPaths(reports),
		diagnosticPaths: mergeDiagnosticPaths(reports),
		meterPaths: mergeMeterPaths(reports),
	}
}

function printSummary(summary, heading = 'FINAL CUSTOM MIX - COUVERTURE REPRESENTATIVE') {
	console.log('==================================================================')
	console.log(` ${heading}`)
	console.log('==================================================================')
	for (const definitionId of MIX_BOOL_DEFINITIONS) {
		const family = summary.controls.representatives[definitionId]
		console.log(`${definitionId}: representative closed=${family.closedPaths > 0 ? 'oui' : 'non'} mismatch=${family.mismatch}`)
	}
	console.log(`Fader representative: ${summary.strips.gain.changed > 0 ? 'oui' : 'non'} (${summary.strips.gain.changed} path(s) change(s))`)
	console.log(`Pan representative: ${summary.strips.pan.changed > 0 ? 'oui' : 'non'} (${summary.strips.pan.changed} path(s) change(s))`)
	console.log(`Stereo/Mono representative: ${summary.stereo.changed > 0 ? 'oui' : 'non'} (${summary.stereo.changed} path(s) change(s))`)
	console.log(`Routing Custom Mix: ${summary.routing.customMixObservedPairs > 0 ? 'oui' : 'non'} (${summary.routing.customMixObservedPairs} paire(s) observee(s))`)
	console.log(`Custom Mix meters: ${summary.meters.closed}/${summary.meters.total} mismatch=${summary.meters.mismatch}`)
	const tasks = missingTasks(summary)
	console.log(tasks.length ? `A FAIRE PENDANT LE REC: ${tasks.join(' | ')}` : 'A FAIRE PENDANT LE REC: rien; preuve representative deja complete.')
	return tasks
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

function statusOnly() {
	const { reports, controlPaths, diagnosticPaths, meterPaths } = mergedLocalEvidence(false)
	if (!reports.length) {
		console.log('FINAL CUSTOM MIX STATUS: aucune evidence locale precedente.')
		process.exitCode = 5
		return
	}
	const summary = summarizeCustomMixCoverage(controlPaths, diagnosticPaths, meterPaths)
	printSummary(summary, 'FINAL CUSTOM MIX - ETAT AVANT REC')
	if (!summary.complete) process.exitCode = 5
}

function writeCoverage() {
	const { reports, controlPaths, diagnosticPaths, meterPaths } = mergedLocalEvidence(true)
	const summary = summarizeCustomMixCoverage(controlPaths, diagnosticPaths, meterPaths)
	const evidence = persistentEvidence(controlPaths, diagnosticPaths, meterPaths)
	const payload = {
		reportVersion: 2,
		reportClass: 'final-custom-mix-representative-coverage',
		updatedAt: nowIso(),
		sourceReportsThisPass: reports.length,
		persistentEvidence: true,
		readOnlyEvidence: true,
		coverageRule: 'Representative hardware readback closure per withheld family; exhaustive 12x24 internal-strip exercise is not required for v1.',
		complete: summary.complete,
		summary,
		privacy:
			'Counts only; no serial, hostname, endpoint, client identity, raw XML, raw item value or user path is stored.',
	}
	fs.mkdirSync(resultsDir, { recursive: true })
	fs.writeFileSync(EVIDENCE_REPORT, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
	fs.writeFileSync(OUTPUT_REPORT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

	printSummary(summary)
	console.log(`Evidence locale cumulative: ${RELATIVE_EVIDENCE}`)
	console.log(`Rapport local: ${RELATIVE_OUTPUT}`)
	console.log(summary.complete ? 'FINAL CUSTOM MIX COVERAGE: COMPLETE' : 'FINAL CUSTOM MIX COVERAGE: PARTIAL')
	if (summary.controls.mismatch || summary.meters.mismatch) process.exitCode = 4
	else if (!summary.complete) process.exitCode = 5
}

async function main() {
	if (process.argv.includes('--preflight')) return preflight()
	if (process.argv.includes('--status')) return statusOnly()
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
	missingTasks,
	persistentEvidence,
}
