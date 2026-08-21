const fs = require('node:fs')
const path = require('node:path')
const { buildSanitizedMemoryReport } = require('./memory-observer-lib')

const ROOT = path.resolve(__dirname, '..')
const EVIDENCE = path.join(ROOT, '.local-logs', 'MEMORY_OBSERVER_EVIDENCE.json')
const RESULT_DIR = path.join(ROOT, 'probe-results')

function timestamp() {
	const d = new Date()
	const p = (v) => String(v).padStart(2, '0')
	return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function main() {
	const raw = fs.readFileSync(EVIDENCE, 'utf8').replace(/^\uFEFF/, '')
	const evidence = JSON.parse(raw)
	const report = buildSanitizedMemoryReport(evidence)
	fs.mkdirSync(RESULT_DIR, { recursive: true })
	const out = path.join(RESULT_DIR, `official_client_memory_observer_${timestamp()}.txt`)
	fs.writeFileSync(out, report, 'utf8')
	console.log(`Sanitized result: probe-results\\${path.basename(out)}`)
}

try { main() } catch (error) {
	console.error(`MEMORY OBSERVER REPORT FAILED: ${String(error?.message || error)}`)
	process.exitCode = 1
}
