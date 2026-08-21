const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const {
	decodeStatusBuffer,
	parseStatusText,
	parseStatusBuffer,
	safeFallbackStatus,
	buildPublishedStatus,
	validatePublishedStatus,
} = require('../tools/passive-session-status-lib')

test('status schema accepts only fixed safe tuples', () => {
	assert.deepEqual(parseStatusText('outcome=FAILED\nstage=detect-server-port\ncode=no-server-listener\n'), {
		outcome: 'FAILED', stage: 'detect-server-port', code: 'no-server-listener',
	})
	assert.deepEqual(parseStatusText('outcome = SUCCESS\r\nstage = complete\r\ncode = ok\r\n'), {
		outcome: 'SUCCESS', stage: 'complete', code: 'ok',
	})
	assert.throws(() => parseStatusText('outcome=FAILED\nstage=C:\\Private\ncode=unexpected\n'))
	assert.throws(() => parseStatusText('outcome=SUCCESS\nstage=parse\ncode=ok\n'))
})

test('status reader accepts ASCII UTF8 BOM and UTF16LE Windows files', () => {
	const text = 'outcome=FAILED\r\nstage=elevation\r\ncode=elevation-failed\r\n'
	assert.equal(decodeStatusBuffer(Buffer.from(text, 'ascii')), text)
	assert.deepEqual(parseStatusBuffer(Buffer.from(text, 'ascii')), { outcome:'FAILED', stage:'elevation', code:'elevation-failed' })
	assert.deepEqual(parseStatusBuffer(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]), Buffer.from(text, 'utf8')])), { outcome:'FAILED', stage:'elevation', code:'elevation-failed' })
	assert.deepEqual(parseStatusBuffer(Buffer.concat([Buffer.from([0xff,0xfe]), Buffer.from(text, 'utf16le')])), { outcome:'FAILED', stage:'elevation', code:'elevation-failed' })
})

test('invalid or missing status maps only to fixed safe fallback tuples', () => {
	assert.deepEqual(safeFallbackStatus(new Error('bad')), { outcome:'FAILED', stage:'bootstrap', code:'status-file-invalid' })
	const missing = new Error('missing'); missing.code = 'ENOENT'
	assert.deepEqual(safeFallbackStatus(missing), { outcome:'FAILED', stage:'bootstrap', code:'status-file-missing' })
})

test('published status contains no raw machine data', () => {
	const doc = buildPublishedStatus({
		status: { outcome:'FAILED', stage:'elevation', code:'uac-cancelled' },
		sourceBranch:'debug/official-client-passive-session',
		sourceCommit:'a'.repeat(40),
		nodeVersion:'22.23.2',
	})
	assert.equal(validatePublishedStatus(doc), true)
	assert.doesNotMatch(doc, /[A-Za-z]:\\|127\.0\.0\.1|<set|client-key=/i)
	assert.match(doc, /Outcome: FAILED/)
	assert.match(doc, /Stage: elevation/)
})

test('PowerShell harness writes fixed ASCII status fields via .NET', () => {
	const ps = fs.readFileSync(path.resolve(__dirname, '..', 'tools', 'CAPTURE_OFFICIAL_SESSION.ps1'), 'utf8')
	assert.match(ps, /PASSIVE_SESSION_STATUS\.txt/)
	assert.match(ps, /Set-SafeStatus/)
	assert.match(ps, /System\.IO\.File\]::WriteAllLines/)
	assert.match(ps, /System\.Text\.Encoding\]::ASCII/)
	assert.doesNotMatch(ps, /Set-SafeStatus[^\r\n]*\$_.Exception/i)
	assert.doesNotMatch(ps, /<set\b|client-details|device-subscribe|keep-alive/i)
})

test('status publisher commits, pushes and verifies remote content', () => {
	if (!childProcess.spawnSync('git', ['--version'], { encoding:'utf8' }).stdout) return
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-status-publisher-test-'))
	const bare = path.join(root, 'remote.git')
	const repo = path.join(root, 'repo')
	try {
		childProcess.execFileSync('git', ['init','--bare',bare], { stdio:'ignore' })
		childProcess.execFileSync('git', ['init',repo], { stdio:'ignore' })
		const git = (args, cwd=repo) => childProcess.execFileSync('git', args, { cwd, encoding:'utf8', stdio:['ignore','pipe','pipe'] })
		git(['config','user.name','Test']); git(['config','user.email','test@example.invalid'])
		fs.writeFileSync(path.join(repo,'seed.txt'),'seed\n'); git(['add','seed.txt']); git(['commit','-m','seed'])
		git(['branch','-M','debug/official-client-passive-session']); git(['remote','add','origin',bare]); git(['push','-u','origin','debug/official-client-passive-session'])
		git(['switch','--orphan','diagnostics/readback-results']); fs.rmSync(path.join(repo,'seed.txt'), { force:true })
		fs.mkdirSync(path.join(repo,'diagnostics','runtime'), { recursive:true }); fs.writeFileSync(path.join(repo,'diagnostics','runtime','README.md'),'sanitized only\n')
		git(['add','.']); git(['commit','-m','diag']); git(['push','-u','origin','diagnostics/readback-results']); git(['switch','debug/official-client-passive-session'])
		fs.mkdirSync(path.join(repo,'.local-logs'), { recursive:true })
		fs.writeFileSync(path.join(repo,'.local-logs','PASSIVE_SESSION_STATUS.txt'), Buffer.from('outcome=FAILED\r\nstage=detect-server-port\r\ncode=no-server-listener\r\n', 'utf16le'))
		const script = path.resolve(__dirname, '..', 'tools', 'publish-sanitized-passive-status.js')
		const env = { ...process.env, NODE_ENV:'test', FOCUSRITE_STATUS_PUBLISH_TEST_ROOT:repo, FOCUSRITE_STATUS_PUBLISH_TEST_BRANCH:'diagnostics/readback-results' }
		childProcess.execFileSync(process.execPath, [script], { cwd:repo, env, stdio:'pipe' })
		git(['fetch','origin','diagnostics/readback-results'])
		const first = git(['show','origin/diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md'])
		assert.match(first, /Stage: detect-server-port/)
		assert.match(first, /Code: no-server-listener/)
		assert.doesNotMatch(first, /[A-Za-z]:\\|127\.0\.0\.1/)

		fs.writeFileSync(path.join(repo,'.local-logs','PASSIVE_SESSION_STATUS.txt'), Buffer.from('garbage\0status\0', 'binary'))
		childProcess.execFileSync(process.execPath, [script], { cwd:repo, env, stdio:'pipe' })
		git(['fetch','origin','diagnostics/readback-results'])
		const fallback = git(['show','origin/diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md'])
		assert.match(fallback, /Stage: bootstrap/)
		assert.match(fallback, /Code: status-file-invalid/)
	} finally { fs.rmSync(root, { recursive:true, force:true }) }
})
