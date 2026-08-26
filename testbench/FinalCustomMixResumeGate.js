'use strict'

const fs = require('node:fs')
const path = require('node:path')
const packageJson = require('../package.json')
const { resultsDir } = require('./FullTestBenchBase')
const { waitForRecorderReady } = require('./FinalCustomMixRecorderReady')

const RELEASE_REPORT = path.join(resultsDir, 'latest-v1-release-smoke.json')
const EXPECTED_REVISION = 'v1-release-smoke-v5-pair-withheld-20260826'
const MAX_REPORT_AGE_MS = 12 * 60 * 60 * 1000

function validateReleaseReport(report, now = Date.now()) {
	const errors = []
	if (!report || typeof report !== 'object') return ['release report missing or invalid']
	if (report.revision !== EXPECTED_REVISION) errors.push('wrong release revision')
	if (report.moduleVersion !== packageJson.version || packageJson.version !== '0.1.21')
		errors.push('wrong module version')
	if (Number(report.testCount) !== 42 || Number(report.pass) !== 42 || Number(report.fail) !== 0)
		errors.push('release tests are not 42/42 PASS')
	if (report.hardAbort !== false) errors.push('release report contains a hard abort')
	if (String(report.reconnect) !== 'PASS') errors.push('reconnect did not pass')
	if (Number(report?.safeCore?.fail || 0) !== 0) errors.push('SAFE Core contains a failure')
	if (!Array.isArray(report.withheldActionIds) || !report.withheldActionIds.includes('output_pair_source')) {
		errors.push('withheld pair routing marker missing')
	}
	const generated = Date.parse(String(report.generatedUtc || ''))
	if (!Number.isFinite(generated) || now - generated < 0 || now - generated > MAX_REPORT_AGE_MS) {
		errors.push('release report is not recent enough for Phase B resume')
	}
	return errors
}

async function main() {
	if (!fs.existsSync(RELEASE_REPORT)) throw new Error('latest-v1-release-smoke.json is missing; cannot skip Phase A.')
	const report = JSON.parse(fs.readFileSync(RELEASE_REPORT, 'utf8'))
	const errors = validateReleaseReport(report)
	if (errors.length) throw new Error(`Phase A evidence is not reusable: ${errors.join('; ')}.`)
	console.log('PHASE B RESUME: clean recent Phase A 0.1.21 evidence accepted (42/42, restore/reconnect safe).')
	await waitForRecorderReady()
	console.log('PHASE B RESUME PREFLIGHT PASS: no Phase A rerun and no hardware write performed by this gate.')
}

if (require.main === module) {
	main().catch((error) => {
		console.error(`PHASE B RESUME REFUSED - ${error.message}`)
		console.error('Aucun write Focusrite et aucun bouton Companion n ont ete declenches par ce gate.')
		process.exitCode = 3
	})
}

module.exports = { EXPECTED_REVISION, MAX_REPORT_AGE_MS, validateReleaseReport }
