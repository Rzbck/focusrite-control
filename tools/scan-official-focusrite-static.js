const childProcess = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const {
	analyzeBuffers,
	buildSanitizedStaticReport,
	validateSanitizedStaticReport,
} = require('./static-protocol-scan-lib')

const ROOT = path.resolve(__dirname, '..')
const MAX_FILE_BYTES = 128 * 1024 * 1024
const MAX_TOTAL_BYTES = 512 * 1024 * 1024
const MAX_FILES = 96

function timestamp() {
	const now = new Date()
	const p = (value) => String(value).padStart(2, '0')
	return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`
}

function findRunningFocusriteExecutables() {
	if (process.platform !== 'win32') throw new Error('This static scan must run on Windows')
	const command = [
		"$ErrorActionPreference='SilentlyContinue'",
		"Get-Process | Where-Object { $_.ProcessName -match '(?i)focusrite' } | ForEach-Object { try { $_.Path } catch {} } | Where-Object { $_ } | Sort-Object -Unique",
	].join('; ')
	const result = childProcess.spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-Command', command], {
		encoding: 'utf8',
		windowsHide: true,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	if (result.error) throw result.error
	if (result.status !== 0) throw new Error('Unable to enumerate running Focusrite processes')
	return [...new Set(String(result.stdout || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean))]
}

function collectCandidateFiles(executables) {
	const files = new Set()
	const dirs = new Set()
	for (const executable of executables) {
		if (!path.isAbsolute(executable) || !fs.existsSync(executable)) continue
		files.add(path.resolve(executable))
		dirs.add(path.dirname(path.resolve(executable)))
	}

	for (const dir of dirs) {
		let entries = []
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true })
		} catch {
			continue
		}
		for (const entry of entries) {
			if (!entry.isFile()) continue
			const ext = path.extname(entry.name).toLowerCase()
			if (!['.exe', '.dll'].includes(ext)) continue
			if (!/(focusrite|control|server|scarlett|device|remote|usb)/i.test(entry.name)) continue
			files.add(path.join(dir, entry.name))
			if (files.size >= MAX_FILES) break
		}
		if (files.size >= MAX_FILES) break
	}
	return [...files].slice(0, MAX_FILES)
}

function readBoundedFiles(files) {
	const buffers = []
	let totalBytes = 0
	let exeCount = 0
	let dllCount = 0
	for (const file of files) {
		let stat
		try {
			stat = fs.statSync(file)
		} catch {
			continue
		}
		if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_FILE_BYTES) continue
		if (totalBytes + stat.size > MAX_TOTAL_BYTES) break
		try {
			buffers.push(fs.readFileSync(file))
			totalBytes += stat.size
			const ext = path.extname(file).toLowerCase()
			if (ext === '.exe') exeCount++
			if (ext === '.dll') dllCount++
		} catch {
			// Locked/inaccessible sibling binaries are skipped.
		}
	}
	return { buffers, exeCount, dllCount }
}

function main() {
	console.log('')
	console.log('FOCUSRITE OFFICIAL CLIENT STATIC PROTOCOL SCAN v1')
	console.log('READ-ONLY: local binaries are read only; no Focusrite protocol message is transmitted.')
	console.log('Private paths and raw binary strings are never written to the public report.')
	console.log('')

	const executables = findRunningFocusriteExecutables()
	if (!executables.length) throw new Error('No readable running Focusrite executable found. Keep Focusrite Control open and retry.')
	const candidates = collectCandidateFiles(executables)
	const { buffers, exeCount, dllCount } = readBoundedFiles(candidates)
	if (!buffers.length) throw new Error('No readable Focusrite executable/library candidate could be scanned')

	const analysis = analyzeBuffers(buffers)
	const report = buildSanitizedStaticReport({
		processCount: executables.length,
		filesScanned: buffers.length,
		exeCount,
		dllCount,
		analysis,
	})
	validateSanitizedStaticReport(report)

	console.log(`Focusrite processes discovered: ${executables.length}`)
	console.log(`Files scanned: ${buffers.length}`)
	console.log(`Known protocol roots found: ${analysis.knownRoots.join(', ') || '(none)'}`)
	console.log(`Additional protocol-like XML roots: ${analysis.candidateRoots.join(', ') || '(none)'}`)
	console.log(`Read-like lexical candidates: ${analysis.readLikeTokens.join(', ') || '(none)'}`)

	const outDir = path.join(ROOT, 'probe-results')
	fs.mkdirSync(outDir, { recursive: true })
	const outFile = path.join(outDir, `static_protocol_scan_${timestamp()}.txt`)
	fs.writeFileSync(outFile, report, 'utf8')
	console.log(`Sanitized result: probe-results\\${path.basename(outFile)}`)
}

try {
	main()
} catch (error) {
	const safe = String(error?.message || error || 'unknown error')
		.replace(/\b[A-Za-z]:\\[^\r\n]+/g, '<path>')
		.replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '<endpoint>')
	console.error(`STATIC SCAN FAILED: ${safe}`)
	process.exitCode = 1
}
