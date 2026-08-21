const assert = require('node:assert/strict')
const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const {
	findLatestReadbackResult,
	validateSanitizedReadback,
	buildPublishedReadback,
} = require('../tools/publish-diagnostic-lib')

const VALID = `FOCUSRITE CONTROL READ-ONLY STATE PROBE v2
Target model: Scarlett 18i20 (3rd Gen)
TCP transmit allowlist: client-details, device-subscribe, keep-alive
Hardware <set> writes: FORBIDDEN
Raw/private protocol logging: DISABLED
PASS  Focusrite Control Server discovered dynamically.
PHASE A - cold connect + one subscribe=true: Core seen=3/21; missing=18; setPackets=0; setItems=0; otherSetIds=0
PHASE B - subscribe=false then subscribe=true: Core seen=3/21; missing=18; setPackets=0; setItems=0; otherSetIds=0
PHASE C - clean TCP reconnect + one subscribe=true: Core seen=3/21; missing=18; setPackets=0; setItems=0; otherSetIds=0
DECISION
RESULT: standard subscription lifecycle does not cold-read all Core controls.
`

function git(cwd, args, options = {}) {
	const result = childProcess.spawnSync('git', args, {
		cwd,
		encoding: 'utf8',
		stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'ignore',
	})
	if (result.error) throw result.error
	if (result.status !== 0) {
		throw new Error(`git ${args.join(' ')} failed: ${String(result.stderr || result.stdout || '').trim()}`)
	}
	return String(result.stdout || '')
}

test('publisher accepts the expected sanitized report shape', () => {
	assert.equal(validateSanitizedReadback(VALID), true)
})

test('publisher rejects private paths, endpoints and raw protocol payloads', () => {
	for (const bad of [
		`${VALID}\nPath: E:\\Private\\capture.xml`,
		`${VALID}\nEndpoint: 127.0.0.1`,
		`${VALID}\n<server-announcement hostname="PRIVATE" port="12345"/>`,
		`${VALID}\n<set devid="1"><item id="1679" value="false"/></set>`,
	]) {
		assert.throws(() => validateSanitizedReadback(bad))
	}
})

test('publisher document carries only public source metadata plus sanitized report', () => {
	const doc = buildPublishedReadback({
		reportText: VALID,
		sourceBranch: 'debug/cold-start-readback',
		sourceCommit: 'a'.repeat(40),
		sourceFile: 'readonly_state_probe_20260821_092205.txt',
		nodeVersion: '22.23.2',
	})
	assert.match(doc, /Source branch: debug\/cold-start-readback/)
	assert.match(doc, /Source commit: a{40}/)
	assert.match(doc, /Hardware write path: forbidden/)
	assert.doesNotMatch(doc, /[A-Za-z]:\\/)
})

test('publisher refuses publication metadata from a non-debug branch', () => {
	assert.throws(() =>
		buildPublishedReadback({
			reportText: VALID,
			sourceBranch: 'main',
			sourceCommit: 'a'.repeat(40),
			sourceFile: 'readonly_state_probe_20260821_092205.txt',
			nodeVersion: '22.23.2',
		}),
	)
})

test('publisher selects the newest valid sanitized result filename', () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-publish-test-'))
	try {
		const older = path.join(dir, 'readonly_state_probe_20260821_090000.txt')
		const newer = path.join(dir, 'readonly_state_probe_20260821_091000.txt')
		fs.writeFileSync(older, VALID)
		fs.writeFileSync(newer, VALID)
		const now = Date.now() / 1000
		fs.utimesSync(older, now - 60, now - 60)
		fs.utimesSync(newer, now, now)
		fs.writeFileSync(path.join(dir, 'not-a-probe.log'), VALID)
		assert.equal(findLatestReadbackResult(dir).name, path.basename(newer))
	} finally {
		fs.rmSync(dir, { recursive: true, force: true })
	}
})

test('publisher performs and remotely verifies the real Git flow, then is idempotent', () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-publish-git-'))
	const remote = path.join(root, 'remote.git')
	const work = path.join(root, 'work')
	const script = path.resolve(__dirname, '..', 'tools', 'publish-sanitized-readback.js')
	try {
		fs.mkdirSync(work)
		git(root, ['init', '--bare', remote])
		git(work, ['init'])
		git(work, ['config', 'user.name', 'Focusrite Publisher Test'])
		git(work, ['config', 'user.email', 'focusrite-publisher-test@example.invalid'])
		git(work, ['switch', '-c', 'debug/cold-start-readback'])
		fs.writeFileSync(path.join(work, 'README.md'), 'test repo\n')
		git(work, ['add', 'README.md'])
		git(work, ['commit', '-m', 'test: debug baseline'])
		git(work, ['remote', 'add', 'origin', remote])
		git(work, ['push', '-u', 'origin', 'debug/cold-start-readback'])

		git(work, ['switch', '-c', 'diagnostics/readback-results'])
		const diagDir = path.join(work, 'diagnostics', 'runtime')
		fs.mkdirSync(diagDir, { recursive: true })
		fs.writeFileSync(path.join(diagDir, 'README.md'), 'sanitized diagnostics only\n')
		git(work, ['add', 'diagnostics/runtime/README.md'])
		git(work, ['commit', '-m', 'diagnostic: initialize branch'])
		git(work, ['push', '-u', 'origin', 'diagnostics/readback-results'])
		git(work, ['switch', 'debug/cold-start-readback'])

		const resultDir = path.join(work, 'probe-results')
		fs.mkdirSync(resultDir)
		fs.writeFileSync(path.join(resultDir, 'readonly_state_probe_20260821_093000.txt'), VALID)

		const runPublisher = () =>
			childProcess.spawnSync(process.execPath, [script], {
				cwd: work,
				encoding: 'utf8',
				env: {
					...process.env,
					NODE_ENV: 'test',
					FOCUSRITE_PUBLISH_TEST_ROOT: work,
				},
			})

		const first = runPublisher()
		assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`)
		git(work, ['fetch', 'origin', 'diagnostics/readback-results'])
		const published = git(work, ['show', 'origin/diagnostics/readback-results:diagnostics/runtime/latest-readback.md'], {
			capture: true,
		})
		assert.match(published, /Automated sanitized Focusrite readback diagnostic/)
		assert.match(published, /RESULT: standard subscription lifecycle does not cold-read all Core controls/)
		assert.doesNotMatch(published, /[A-Za-z]:\\/)
		assert.doesNotMatch(published, /(?:\d{1,3}\.){3}\d{1,3}/)

		const before = git(work, ['rev-parse', 'origin/diagnostics/readback-results'], { capture: true }).trim()
		const second = runPublisher()
		assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`)
		git(work, ['fetch', 'origin', 'diagnostics/readback-results'])
		const after = git(work, ['rev-parse', 'origin/diagnostics/readback-results'], { capture: true }).trim()
		assert.equal(after, before)
	} finally {
		fs.rmSync(root, { recursive: true, force: true })
	}
})
