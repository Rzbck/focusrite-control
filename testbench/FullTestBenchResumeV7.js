'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { resultsDir } = require('./FullTestBenchBase')

const RESUME_PHASES = Object.freeze([
	'output-families',
	'output-pairs',
	'mixer-slots',
	'mixer-lanes',
	'monitoring',
	'manual',
	'reconnect',
])

function phaseForCapabilityId(id = '') {
	const value = String(id)
	if (value.startsWith('output-pair:')) return 'output-pairs'
	if (value.startsWith('output:')) return 'output-families'
	if (value.startsWith('mixer-slot:')) return 'mixer-slots'
	if (value.startsWith('mix:')) return 'mixer-lanes'
	if (value.startsWith('monitor:') || value.startsWith('setting:') || value.startsWith('device:')) return 'monitoring'
	if (value.startsWith('manual:')) return 'manual'
	if (value.startsWith('connection:')) return 'reconnect'
	return null
}

function inferResumePhaseFromRows(rows = []) {
	const quarantined = rows.find((row) => row?.status === 'QUARANTINED_RESTORE')
	const inferred = phaseForCapabilityId(quarantined?.id)
	return inferred || 'output-families'
}

function findLatestPrivateDiagnostic(directory = resultsDir) {
	if (!fs.existsSync(directory)) return null
	const names = fs
		.readdirSync(directory)
		.filter((name) => /^capability-lab_.*\.json$/i.test(name) && !/\.shareable\.json$/i.test(name))
		.sort()
		.reverse()
	for (const name of names) {
		try {
			const report = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))
			if (report?.reportClass === 'private-local-diagnostic') return { name, report }
		} catch {
			// Ignore malformed/partial historical diagnostics and keep looking.
		}
	}
	return null
}

function resolveDiagnosticResumePhase(argv = process.argv, directory = resultsDir) {
	const arg = argv.find((value) => String(value).startsWith('--diagnostic-resume='))
	if (!arg) return null
	const requested = String(arg).slice('--diagnostic-resume='.length).trim().toLowerCase()
	if (requested === 'auto') {
		const latest = findLatestPrivateDiagnostic(directory)
		return latest ? inferResumePhaseFromRows(latest.report.capabilities || []) : 'output-families'
	}
	if (!RESUME_PHASES.includes(requested)) {
		throw new Error(`Invalid diagnostic resume phase '${requested}'. Allowed: auto, ${RESUME_PHASES.join(', ')}.`)
	}
	return requested
}

function shouldRunResumePhase(resumePhase, phase) {
	if (!resumePhase) return true
	const start = RESUME_PHASES.indexOf(resumePhase)
	const current = RESUME_PHASES.indexOf(phase)
	if (start < 0 || current < 0) return true
	return current >= start
}

module.exports = {
	RESUME_PHASES,
	phaseForCapabilityId,
	inferResumePhaseFromRows,
	findLatestPrivateDiagnostic,
	resolveDiagnosticResumePhase,
	shouldRunResumePhase,
}
