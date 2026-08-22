const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const {
	AUTO_PUBLISH_BRANCH,
	PUBLIC_RELATIVE_PATH,
	publishSanitizedToRemote,
	validateShareable,
} = require('../testbench/PublishLatestShareable')

function cleanPayload() {
	return {
		schemaVersion: 4,
		reportClass: 'shareable-sanitized',
		generatedAt: '2026-08-22T06:28:31.968Z',
		meta: {
			completed: true,
			hardwareWrites: true,
			revision: 'full-v7-runtime-ownership-isolated-feedback-20260822',
			signature: '0123456789abcdef',
			model: 'Scarlett 18i20 (3rd Gen)',
			r9Probes: 829,
			r9Definitions: 31,
			globalSignalPathSafety: false,
			physicalIsolationConfirmed: true,
			signalPathSafety: [{ output: 1, availability: 'AVAILABLE', safe: true, reason: 'mute-confirmed' }],
		},
		summary: { PASS: 1 },
		feedbackBefore: { pass: 1, evalOnly: 0, fail: 0, total: 1 },
		feedbackAfter: { pass: 1, evalOnly: 0, fail: 0, total: 1 },
		feedbackDynamic: {
			total: 2,
			bothStates: 1,
			singleState: 1,
			neverObserved: 0,
			fail: 0,
			definitions: {
				mix_mute: { total: 2, bothStates: 1, singleState: 1, neverObserved: 0, fail: 0 },
			},
		},
		capabilities: [
			{
				id: 'output:1:mute',
				family: 'output_mute',
				availability: 'AVAILABLE',
				r9ProbeCount: 1,
				stateKnown: true,
				capability: true,
				risk: 'safe',
				dependency: '',
				status: 'PASS_INDEPENDENT',
				detail: 'server-confirmed',
			},
		],
		privacy: 'Sanitized for sharing.',
	}
}

function git(cwd, args) {
	const result = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true })
	assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr || result.stdout}`)
	return String(result.stdout || '').trim()
}

function write(filePath, content) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true })
	fs.writeFileSync(filePath, content, 'utf8')
}

test('automatic publication is restricted to the validation branch', () => {
	assert.equal(AUTO_PUBLISH_BRANCH, 'testbench/v0.2-hardware-validation')
})

test('generated public hardware reports are excluded from the source formatting gate', () => {
	const ignore = fs.readFileSync(path.join(__dirname, '..', '.prettierignore'), 'utf8')
	assert.match(ignore, /^docs\/hardware-results\/\*\.json$/m)
})

test('publisher accepts the sanitized completed V7 isolation and dynamic-feedback schema', () => {
	const payload = cleanPayload()
	assert.deepEqual(validateShareable(payload, JSON.stringify(payload)), [])
})

test('publisher refuses private state/variable keys and local paths', () => {
	const payload = cleanPayload()
	payload.capabilities[0].state = 'secret'
	payload.capabilities[0].detail = 'C:\\Users\\Private\\capture.xml'
	const errors = validateShareable(payload, JSON.stringify(payload))
	assert.ok(errors.some((error) => /unexpected capability key: state|forbidden key: state/.test(error)))
	assert.ok(errors.some((error) => /privacy pattern/.test(error)))
})

test('publisher refuses URLs and local network endpoints that escaped redaction', () => {
	const payload = cleanPayload()
	payload.capabilities[0].detail = 'connect failed at http://192.168.1.40:12345/session'
	assert.ok(validateShareable(payload, JSON.stringify(payload)).some((error) => /privacy pattern/.test(error)))

	payload.capabilities[0].detail = 'connect failed at device-name.local:12345'
	assert.ok(validateShareable(payload, JSON.stringify(payload)).some((error) => /privacy pattern/.test(error)))
})

test('publisher refuses incomplete PREP or fatal campaign reports', () => {
	const payload = cleanPayload()
	payload.meta.completed = false
	assert.ok(validateShareable(payload, JSON.stringify(payload)).some((error) => /completed campaigns/.test(error)))
})

test('publisher uses an isolated remote worktree when the validation checkout is dirty and behind', () => {
	const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-publisher-test-'))
	const remote = path.join(temp, 'remote.git')
	const local = path.join(temp, 'local')
	const other = path.join(temp, 'other')
	try {
		git(temp, ['init', '--bare', remote])
		fs.mkdirSync(local)
		git(local, ['init'])
		git(local, ['config', 'user.email', 'test@example.invalid'])
		git(local, ['config', 'user.name', 'Focusrite Publisher Test'])
		git(local, ['checkout', '-b', AUTO_PUBLISH_BRANCH])
		write(path.join(local, 'README.md'), 'base\n')
		git(local, ['add', 'README.md'])
		git(local, ['commit', '-m', 'base'])
		git(local, ['remote', 'add', 'origin', remote])
		git(local, ['push', '-u', 'origin', AUTO_PUBLISH_BRANCH])

		git(temp, ['clone', '--branch', AUTO_PUBLISH_BRANCH, remote, other])
		git(other, ['config', 'user.email', 'test@example.invalid'])
		git(other, ['config', 'user.name', 'Remote Advance Test'])
		write(path.join(other, 'REMOTE_ADVANCE.txt'), 'remote advanced\n')
		git(other, ['add', 'REMOTE_ADVANCE.txt'])
		git(other, ['commit', '-m', 'remote advance'])
		git(other, ['push', 'origin', AUTO_PUBLISH_BRANCH])

		const localHeadBefore = git(local, ['rev-parse', 'HEAD'])
		write(path.join(local, 'LOCAL_UNTRACKED.txt'), 'must stay local\n')
		fs.appendFileSync(path.join(local, 'README.md'), 'dirty local edit\n', 'utf8')
		const localStatusBefore = git(local, ['status', '--porcelain', '--untracked-files=all'])

		const serialized = `${JSON.stringify(cleanPayload(), null, 2)}\n`
		const result = publishSanitizedToRemote({ repoRoot: local, serialized })
		assert.equal(result.published, true)
		assert.equal(result.skipped, false)
		assert.equal(git(local, ['rev-parse', 'HEAD']), localHeadBefore)
		assert.equal(git(local, ['status', '--porcelain', '--untracked-files=all']), localStatusBefore)
		assert.equal(
			git(temp, ['--git-dir', remote, 'show', `${AUTO_PUBLISH_BRANCH}:${PUBLIC_RELATIVE_PATH.replaceAll('\\', '/')}`]),
			serialized.trim(),
		)
		assert.equal(
			git(temp, ['--git-dir', remote, 'show', `${AUTO_PUBLISH_BRANCH}:REMOTE_ADVANCE.txt`]),
			'remote advanced',
		)
	} finally {
		fs.rmSync(temp, { recursive: true, force: true })
	}
})