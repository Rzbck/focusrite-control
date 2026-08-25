const fs = require('node:fs')
const path = require('node:path')
const {
	buildSanitizedSessionReport,
	validateSanitizedSessionReport,
} = require('./passive-session-observer-lib')
const { analyzeOfficialCapture } = require('./passive-session-official-filter')

const ROOT = path.resolve(__dirname, '..')
const ASSIGN_MIX_NAMES = new Map([
	['1471', 'Line Output 3'],
	['1481', 'Line Output 4'],
])

function arg(name) {
	const i = process.argv.indexOf(name)
	return i >= 0 ? process.argv[i + 1] : null
}

function timestamp() {
	const d = new Date()
	const p = (v) => String(v).padStart(2, '0')
	return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function safeAssignMixList(ids) {
	const names = (ids || []).map((id) => ASSIGN_MIX_NAMES.get(String(id))).filter(Boolean)
	return names.length ? names.join(', ') : '(none)'
}

function assignMixBaselineStatus(analysis) {
	if (analysis.nonCompanionSessions !== 1) return 'AMBIGUOUS_OFFICIAL_SESSION'
	const initial = new Set(analysis.assignMixInitialServerToClient || [])
	if (initial.has('1471') && initial.has('1481')) return 'COMPLETE_INITIAL_VALUE_BASELINE'
	if (initial.has('1471') || initial.has('1481')) return 'PARTIAL_INITIAL_VALUE_BASELINE'
	return 'NO_INITIAL_VALUE_BASELINE'
}

function injectAssignMixPreflight(report, analysis) {
	const status = assignMixBaselineStatus(analysis)
	const section = [
		'ASSIGN-MIX LINE OUTPUTS 3-4 PREFLIGHT',
		`Initial device-arrival non-empty value coverage: ${safeAssignMixList(analysis.assignMixInitialServerToClient)}`,
		`Server SET non-empty value coverage: ${safeAssignMixList(analysis.assignMixSetServerToClient)}`,
		`Baseline status: ${status}`,
		status === 'COMPLETE_INITIAL_VALUE_BASELINE'
			? 'NEXT ROUTING TEST: baseline presence is proven; a separate exact-restore differential may now be designed.'
			: 'NEXT ROUTING TEST: BLOCKED; do not switch Line Outputs 3-4 to Custom Mix from this result.',
		'',
	].join('\n')
	return report.replace('DECISION', `${section}\nDECISION`)
}

function main() {
	const pcap = arg('--pcapng')
	const port = Number(arg('--server-port'))
	const seconds = Number(arg('--capture-seconds') || 25)
	const portChanged = String(arg('--server-port-changed') || 'false').toLowerCase() === 'true'
	if (!pcap || !path.isAbsolute(pcap)) throw new Error('Missing absolute --pcapng path')
	if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --server-port')
	const buffer = fs.readFileSync(pcap)
	const analysis = analyzeOfficialCapture(buffer, port)
	let report = buildSanitizedSessionReport({ analysis, captureSeconds: seconds, serverPortChanged: portChanged })
	report = report.replace(
		'ROOT SUMMARY',
		`Companion sessions excluded locally: ${analysis.companionSessionsExcluded}\nNon-Companion sessions analysed: ${analysis.nonCompanionSessions}\n\nROOT SUMMARY`,
	)
	report = injectAssignMixPreflight(report, analysis)
	if (analysis.nonCompanionSessions === 0) {
		report = report.replace(
			/RESULT: .*$/m,
			'RESULT: NO NON-COMPANION FOCUSRITE SESSION WAS RECONSTRUCTED. Do not infer protocol behavior from this capture.',
		)
	}
	validateSanitizedSessionReport(report)
	const outDir = path.join(ROOT, 'probe-results')
	fs.mkdirSync(outDir, { recursive: true })
	const outFile = path.join(outDir, `official_session_observer_${timestamp()}.txt`)
	fs.writeFileSync(outFile, report, 'utf8')
	console.log(`Sanitized result: probe-results\\${path.basename(outFile)}`)
	console.log(`Companion sessions excluded locally: ${analysis.companionSessionsExcluded}`)
	console.log(`Non-Companion sessions analysed: ${analysis.nonCompanionSessions}`)
	console.log(`Complete Focusrite frames reconstructed: ${analysis.frameCount}`)
	console.log(`Unknown XML roots: ${analysis.unknownRoots.join(', ') || '(none)'}`)
	console.log(`Core server->client SET coverage: ${analysis.coreServerToClient.length}/21`)
	console.log(`Assign-mix Line 3-4 baseline status: ${assignMixBaselineStatus(analysis)}`)
}

if (require.main === module) {
	try {
		main()
	} catch (error) {
		const safe = String(error?.message || error || 'unknown error')
			.replace(/\b[A-Za-z]:\\[^\r\n]+/g, '<path>')
			.replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '<endpoint>')
		console.error(`PASSIVE SESSION PARSE FAILED: ${safe}`)
		process.exitCode = 1
	}
}

module.exports = {
	safeAssignMixList,
	assignMixBaselineStatus,
	injectAssignMixPreflight,
}
