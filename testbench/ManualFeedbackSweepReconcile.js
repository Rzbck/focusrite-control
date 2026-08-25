'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { resultsDir } = require('./FullTestBenchBase')

const LATEST_REPORT = path.join(resultsDir, 'LATEST_MANUAL_FEEDBACK_SWEEP.json')
const RELATIVE_REPORT = 'testbench\\results\\LATEST_MANUAL_FEEDBACK_SWEEP.json'
const RECONCILED_REPORT_VERSION = 5
const TRANSIENT_RACE_WINDOW_MS = 500

function canonicalObject(value) {
	if (Array.isArray(value)) return value.map(canonicalObject)
	if (!value || typeof value !== 'object') return value
	return Object.fromEntries(
		Object.keys(value)
			.sort()
			.map((key) => [key, canonicalObject(value[key])]),
	)
}

function eventIdentity(event) {
	return `${String(event?.definitionId || '')}:${JSON.stringify(canonicalObject(event?.options || {}))}`
}

function isReversePass(failed, candidate, raceWindowMs = TRANSIENT_RACE_WINDOW_MS) {
	if (!failed || !candidate) return false
	if (failed.status !== 'FAIL_MISMATCH' || candidate.status !== 'PASS') return false
	if (eventIdentity(failed) !== eventIdentity(candidate)) return false
	const deltaMs = Number(candidate.atMs) - Number(failed.atMs)
	if (!Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > raceWindowMs) return false
	return candidate.before === failed.after && candidate.after === failed.before
}

function reconcileEvents(events, raceWindowMs = TRANSIENT_RACE_WINDOW_MS) {
	const reconciled = (Array.isArray(events) ? events : []).map((event) => ({ ...event }))
	const usedPasses = new Set()

	for (const event of reconciled) {
		if (event.status !== 'TRANSIENT_RACE' || !Number.isFinite(Number(event.raceResolvedAtMs))) continue
		const passIndex = reconciled.findIndex(
			(candidate) =>
				candidate.status === 'PASS' &&
				eventIdentity(candidate) === eventIdentity(event) &&
				Number(candidate.atMs) === Number(event.raceResolvedAtMs),
		)
		if (passIndex >= 0) usedPasses.add(passIndex)
	}

	for (let index = 0; index < reconciled.length; index++) {
		const failed = reconciled[index]
		if (failed.status !== 'FAIL_MISMATCH') continue
		let bestIndex = -1
		let bestDelta = Number.POSITIVE_INFINITY
		for (let candidateIndex = 0; candidateIndex < reconciled.length; candidateIndex++) {
			if (usedPasses.has(candidateIndex)) continue
			const candidate = reconciled[candidateIndex]
			if (!isReversePass(failed, candidate, raceWindowMs)) continue
			const deltaMs = Number(candidate.atMs) - Number(failed.atMs)
			if (deltaMs < bestDelta) {
				bestDelta = deltaMs
				bestIndex = candidateIndex
			}
		}
		if (bestIndex < 0) continue
		usedPasses.add(bestIndex)
		reconciled[index] = {
			...failed,
			captureStatus: failed.captureStatus || 'FAIL_MISMATCH',
			status: 'TRANSIENT_RACE',
			raceResolvedAtMs: reconciled[bestIndex].atMs,
			raceDeltaMs: bestDelta,
		}
	}

	return {
		events: reconciled,
		transientRaceEvents: reconciled.filter((event) => event.status === 'TRANSIENT_RACE').length,
		confirmedMismatchEvents: reconciled.filter((event) => event.status === 'FAIL_MISMATCH').length,
		confirmedPassEvents: reconciled.filter((event) => event.status === 'PASS').length,
	}
}

function reconcileControlPaths(paths, events) {
	const byIdentity = new Map()
	for (const event of events) {
		const identity = eventIdentity(event)
		if (!byIdentity.has(identity)) byIdentity.set(identity, [])
		byIdentity.get(identity).push(event)
	}

	return (Array.isArray(paths) ? paths : []).map((entry) => {
		const identity = `${String(entry?.definitionId || '')}:${JSON.stringify(canonicalObject(entry?.options || {}))}`
		const related = byIdentity.get(identity) || []
		const transientRaceTransitions = related.filter((event) => event.status === 'TRANSIENT_RACE').length
		const confirmedMismatchTransitions = related.filter((event) => event.status === 'FAIL_MISMATCH').length
		const confirmedPassTransitions = related.filter((event) => event.status === 'PASS').length
		return {
			...entry,
			mismatch: confirmedMismatchTransitions > 0,
			transientRace: transientRaceTransitions > 0,
			confirmedPassTransitions,
			transientRaceTransitions,
			confirmedMismatchTransitions,
		}
	})
}

function summarizeReconciledControls(previous, paths, reconciliation) {
	const base = previous && typeof previous === 'object' ? previous : {}
	return {
		...base,
		mismatch: paths.filter((entry) => entry.mismatch).length,
		transientRacePaths: paths.filter((entry) => entry.transientRace).length,
		confirmedPassEvents: reconciliation.confirmedPassEvents,
		transientRaceEvents: reconciliation.transientRaceEvents,
		confirmedMismatchEvents: reconciliation.confirmedMismatchEvents,
	}
}

function reconcileReport(report, raceWindowMs = TRANSIENT_RACE_WINDOW_MS) {
	if (!report || report.reportClass !== 'manual-feedback-sweep-local-sanitized') {
		throw new Error('Unsupported manual feedback report.')
	}
	const sourceReportVersion = report?.reconciliation?.sourceReportVersion || Number(report.reportVersion || 0)
	const reconciliation = reconcileEvents(report?.recording?.events, raceWindowMs)
	const paths = reconcileControlPaths(report?.controls?.paths, reconciliation.events)
	return {
		...report,
		reportVersion: Math.max(RECONCILED_REPORT_VERSION, Number(report.reportVersion || 0)),
		recording: {
			...report.recording,
			events: reconciliation.events,
		},
		controls: {
			...report.controls,
			summary: summarizeReconciledControls(report?.controls?.summary, paths, reconciliation),
			paths,
		},
		reconciliation: {
			applied: true,
			sourceReportVersion,
			raceWindowMs,
			transientRaceEvents: reconciliation.transientRaceEvents,
			confirmedPassEvents: reconciliation.confirmedPassEvents,
			confirmedMismatchEvents: reconciliation.confirmedMismatchEvents,
			classification:
				'TRANSIENT_RACE means a rendered feedback transition reversed with a PASS inside the timing window; it is not counted as PASS or confirmed mismatch.',
		},
	}
}

function main() {
	if (!fs.existsSync(LATEST_REPORT)) throw new Error(`Missing ${RELATIVE_REPORT}.`)
	const report = JSON.parse(fs.readFileSync(LATEST_REPORT, 'utf8'))
	const reconciled = reconcileReport(report)
	fs.writeFileSync(LATEST_REPORT, `${JSON.stringify(reconciled, null, 2)}\n`, 'utf8')
	const controls = reconciled.controls.summary
	const meters = reconciled.meters?.summary || {}
	console.log('==================================================================')
	console.log(' MANUAL FEEDBACK RECORDER - TIMING RECONCILIATION')
	console.log('==================================================================')
	console.log(
		`Transient races: ${controls.transientRaceEvents || 0} events / ${controls.transientRacePaths || 0} paths`,
	)
	console.log(
		`Confirmed feedback mismatches: ${controls.confirmedMismatchEvents || 0} events / ${controls.mismatch || 0} paths`,
	)
	console.log(`Confirmed PASS transitions: ${controls.confirmedPassEvents || 0}`)
	console.log(`Meter mismatches: ${meters.mismatch || 0}`)
	console.log(`Rapport reconcilie: ${RELATIVE_REPORT}`)
	console.log('TRANSIENT_RACE = geste observe mais trop rapide pour une preuve oracle stable; ni PASS ni FAIL confirme.')
	console.log('==================================================================')
	if ((controls.mismatch || meters.mismatch) && !process.exitCode) process.exitCode = 4
}

if (require.main === module) {
	try {
		main()
	} catch (error) {
		console.error(`MANUAL FEEDBACK RECONCILE FATAL - ${error.message}`)
		process.exitCode = 2
	}
}

module.exports = {
	TRANSIENT_RACE_WINDOW_MS,
	eventIdentity,
	isReversePass,
	reconcileEvents,
	reconcileControlPaths,
	reconcileReport,
}
