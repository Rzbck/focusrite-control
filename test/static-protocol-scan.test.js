const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const {
	extractAsciiStrings,
	extractUtf16LeStrings,
	analyzeBuffers,
	buildSanitizedStaticReport,
	validateSanitizedStaticReport,
	buildPublishedStaticScan,
} = require('../tools/static-protocol-scan-lib')

const VALID_ANALYSIS = {
	knownRoots: ['client-details', 'device-subscribe', 'keep-alive'],
	candidateRoots: [],
	readLikeRoots: [],
	lexicalReadHints: [],
	readLikeTokens: [],
}

function validReport() {
	return buildSanitizedStaticReport({ processCount: 2, filesScanned: 4, exeCount: 2, dllCount: 2, analysis: VALID_ANALYSIS })
}

test('static scanner extracts ASCII and UTF16LE protocol strings', () => {
	const ascii = Buffer.from('xx<client-details hostname="x"/>yy', 'ascii')
	assert.ok(extractAsciiStrings(ascii).some((v) => v.includes('client-details')))
	const wide = Buffer.from('<device-subscribe devid="1"/>', 'utf16le')
	assert.ok(extractUtf16LeStrings(wide).some((v) => v.includes('device-subscribe')))
})

test('static analysis finds known roots and isolates actual read-like XML roots', () => {
	const a = Buffer.from('<client-details/><device-subscribe/><state-request/><keep-alive/>', 'ascii')
	const result = analyzeBuffers([a])
	assert.deepEqual(result.knownRoots, ['client-details', 'device-subscribe', 'keep-alive'])
	assert.deepEqual(result.candidateRoots, ['state-request'])
	assert.deepEqual(result.readLikeRoots, ['state-request'])
	assert.deepEqual(result.readLikeTokens, ['state-request'])
})

test('generic Windows/device-schema strings are not promoted to readback commands', () => {
	const a = Buffer.from('current-layer read-only save-snapshot ext-ms-win-kernel32-package-current-l1-1-0', 'ascii')
	const result = analyzeBuffers([a])
	assert.deepEqual(result.candidateRoots, [])
	assert.deepEqual(result.readLikeRoots, [])
	assert.deepEqual(result.readLikeTokens, [])
	assert.deepEqual(result.lexicalReadHints, [])
	const report = buildSanitizedStaticReport({ processCount: 2, filesScanned: 4, exeCount: 2, dllCount: 2, analysis: result })
	assert.match(report, /NO SEPARATE STATIC READ-LIKE PROTOCOL ROOT FOUND/)
})

test('static report contains no raw XML or local path', () => {
	const report = validReport()
	assert.equal(validateSanitizedStaticReport(report), true)
	assert.doesNotMatch(report, /<\/?[A-Za-z]/)
	assert.doesNotMatch(report, /[A-Za-z]:\\/)
})

test('static sanitizer rejects paths, endpoints and raw XML', () => {
	for (const bad of [
		`${validReport()}\nPath E:\\Private\\Focusrite.exe`,
		`${validReport()}\nEndpoint 127.0.0.1`,
		`${validReport()}\n<state-request devid="1"/>`,
	]) assert.throws(() => validateSanitizedStaticReport(bad))
})

test('static publisher accepts only official read-source branch metadata', () => {
	const report = validReport()
	const doc = buildPublishedStaticScan({
		reportText: report,
		sourceBranch: 'debug/official-client-read-source',
		sourceCommit: 'a'.repeat(40),
		sourceFile: 'static_protocol_scan_20260821_100000.txt',
		nodeVersion: '22.23.2',
	})
	assert.match(doc, /Focusrite protocol transmission: none/)
	assert.doesNotMatch(doc, /[A-Za-z]:\\/)
	assert.throws(() => buildPublishedStaticScan({
		reportText: report,
		sourceBranch: 'main',
		sourceCommit: 'a'.repeat(40),
		sourceFile: 'static_protocol_scan_20260821_100000.txt',
		nodeVersion: '22.23.2',
	}))
})

test('static publisher performs commit, push, remote verification and idempotent second run', () => {
	if (!childProcess.spawnSync('git', ['--version'], { encoding: 'utf8' }).stdout) return
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-static-publisher-test-'))
	const bare = path.join(root, 'remote.git')
	const repo = path.join(root, 'repo')
	try {
		childProcess.execFileSync('git', ['init', '--bare', bare], { stdio: 'ignore' })
		childProcess.execFileSync('git', ['init', repo], { stdio: 'ignore' })
		const git = (args, cwd = repo) => childProcess.execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
		git(['config', 'user.name', 'Test'])
		git(['config', 'user.email', 'test@example.invalid'])
		fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n')
		git(['add', 'seed.txt'])
		git(['commit', '-m', 'seed'])
		git(['branch', '-M', 'debug/official-client-read-source'])
		git(['remote', 'add', 'origin', bare])
		git(['push', '-u', 'origin', 'debug/official-client-read-source'])
		git(['switch', '--orphan', 'diagnostics/readback-results'])
		fs.rmSync(path.join(repo, 'seed.txt'), { force: true })
		fs.mkdirSync(path.join(repo, 'diagnostics', 'runtime'), { recursive: true })
		fs.writeFileSync(path.join(repo, 'diagnostics', 'runtime', 'README.md'), 'sanitized only\n')
		git(['add', '.'])
		git(['commit', '-m', 'diagnostics seed'])
		git(['push', '-u', 'origin', 'diagnostics/readback-results'])
		git(['switch', 'debug/official-client-read-source'])

		const results = path.join(repo, 'probe-results')
		fs.mkdirSync(results)
		fs.writeFileSync(path.join(results, 'static_protocol_scan_20260821_100000.txt'), validReport())
		const script = path.resolve(__dirname, '..', 'tools', 'publish-sanitized-static-scan.js')
		const env = {
			...process.env,
			NODE_ENV: 'test',
			FOCUSRITE_STATIC_PUBLISH_TEST_ROOT: repo,
			FOCUSRITE_STATIC_PUBLISH_TEST_BRANCH: 'diagnostics/readback-results',
			FOCUSRITE_STATIC_PUBLISH_TEST_SOURCE_BRANCH: 'debug/official-client-read-source',
		}
		childProcess.execFileSync(process.execPath, [script], { cwd: repo, env, stdio: 'pipe' })
		git(['fetch', 'origin', 'diagnostics/readback-results'])
		const first = git(['show', 'origin/diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md'])
		assert.match(first, /FOCUSRITE OFFICIAL CLIENT STATIC PROTOCOL SCAN v1/)
		const before = git(['rev-parse', 'origin/diagnostics/readback-results']).trim()
		childProcess.execFileSync(process.execPath, [script], { cwd: repo, env, stdio: 'pipe' })
		git(['fetch', 'origin', 'diagnostics/readback-results'])
		const after = git(['rev-parse', 'origin/diagnostics/readback-results']).trim()
		assert.equal(after, before)
	} finally {
		fs.rmSync(root, { recursive: true, force: true })
	}
})
