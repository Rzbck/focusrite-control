const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { readStatusFile, buildPublishedStatus } = require('./rc-validation-status-lib')

const ROOT = path.resolve(__dirname, '..')
const STATUS_FILE = path.join(ROOT, '.local-logs', 'RC_STATE_CONTRACT_STATUS.txt')
const TARGET_BRANCH = 'diagnostics/readback-results'
const TARGET_FILE = 'diagnostics/runtime/latest-rc-state-contract-validation.md'
const REQUIRED_SOURCE_BRANCH = 'rc/v0.1.13-state-contract'

function runGit(args, options = {}) {
	const result = childProcess.spawnSync('git', args, {
		cwd: options.cwd || ROOT,
		encoding: 'utf8',
		stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
	})
	if (result.error) throw result.error
	if (result.status !== 0 && !options.allowFailure) {
		const detail = options.capture ? String(result.stderr || result.stdout || '').trim() : ''
		throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
	}
	return result
}

function gitText(args, cwd = ROOT) {
	return String(runGit(args, { cwd, capture: true }).stdout || '').trim()
}

function cleanupWorktree(tempDir) {
	try {
		runGit(['worktree', 'remove', '--force', tempDir], { allowFailure: true })
	} catch {
		// Best-effort cleanup only; publication verification remains authoritative.
	}
	try {
		fs.rmSync(tempDir, { recursive: true, force: true })
	} catch {
		// Best-effort cleanup only; stale temp content must not fail status publication.
	}
}

function fetchTarget() {
	runGit(['fetch', 'origin', TARGET_BRANCH])
	const ref = `origin/${TARGET_BRANCH}`
	gitText(['rev-parse', '--verify', ref])
	return ref
}

function remoteText(ref) {
	const result = runGit(['show', `${ref}:${TARGET_FILE}`], { capture: true, allowFailure: true })
	return result.status === 0 ? String(result.stdout || '') : null
}

function verify(expected) {
	const ref = fetchTarget()
	if (remoteText(ref) !== expected) throw new Error('Remote RC validation verification failed')
	return gitText(['rev-parse', ref])
}

function main() {
	const branch = gitText(['branch', '--show-current'])
	if (branch !== REQUIRED_SOURCE_BRANCH)
		throw new Error(`RC validation publication refused from ${branch || '<detached>'}`)
	const status = readStatusFile(STATUS_FILE)
	const published = buildPublishedStatus({
		status,
		sourceBranch: branch,
		sourceCommit: gitText(['rev-parse', 'HEAD']),
		nodeVersion: process.versions.node,
	})
	const ref = fetchTarget()
	if (remoteText(ref) === published) {
		console.log(`[RC STATUS] Already present and verified @ ${verify(published)}`)
		return
	}
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-rc-status-'))
	try {
		runGit(['worktree', 'add', '--detach', tempDir, ref])
		const target = path.join(tempDir, ...TARGET_FILE.split('/'))
		fs.mkdirSync(path.dirname(target), { recursive: true })
		fs.writeFileSync(target, published, 'utf8')
		runGit(['add', '--', TARGET_FILE], { cwd: tempDir })
		const statusText = gitText(['status', '--porcelain'], tempDir)
		if (!statusText) throw new Error('RC status publisher produced no Git change')
		if (statusText.split(/\r?\n/).some((line) => !line.replace(/\\/g, '/').endsWith(TARGET_FILE))) {
			throw new Error('Unexpected RC status publisher worktree change')
		}
		runGit(
			[
				'-c',
				'user.name=Focusrite RC Diagnostics',
				'-c',
				'user.email=focusrite-rc@users.noreply.github.com',
				'commit',
				'-m',
				`diagnostic: RC validation ${status.outcome.toLowerCase()} ${status.stage} ${status.code}`,
			],
			{ cwd: tempDir },
		)
		runGit(['push', 'origin', `HEAD:refs/heads/${TARGET_BRANCH}`], { cwd: tempDir })
	} finally {
		cleanupWorktree(tempDir)
	}
	console.log(`[RC STATUS] GitHub content verified @ ${verify(published)}`)
}

try {
	main()
} catch (error) {
	console.error(`[RC STATUS] FAILED: ${String(error?.message || error)}`)
	console.error('[RC STATUS] Raw validation logs were not uploaded.')
	process.exitCode = 2
}
