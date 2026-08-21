const fs = require('node:fs')
const path = require('node:path')
const {
	buildSanitizedSessionReport,
	validateSanitizedSessionReport,
} = require('./passive-session-observer-lib')
const { analyzeOfficialCapture } = require('./passive-session-official-filter')

const ROOT = path.resolve(__dirname, '..')

function arg(name) {
	const i = process.argv.indexOf(name)
	return i >= 0 ? process.argv[i + 1] : null
}

function timestamp() {
	const d = new Date()
	const p = (v) => String(v).padStart(2, '0')
	return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
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
}

try {
	main()
} catch (error) {
	const safe = String(error?.message || error || 'unknown error')
		.replace(/\b[A-Za-z]:\\[^\r\n]+/g, '<path>')
		.replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '<endpoint>')
	console.error(`PASSIVE SESSION PARSE FAILED: ${safe}`)
	process.exitCode = 1
}
