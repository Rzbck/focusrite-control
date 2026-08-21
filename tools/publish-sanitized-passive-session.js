const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { findLatestSessionResult, buildPublishedSession } = require('./passive-session-observer-lib')

const DEFAULT_ROOT = path.resolve(__dirname, '..')
const ROOT = process.env.NODE_ENV === 'test' && process.env.FOCUSRITE_SESSION_PUBLISH_TEST_ROOT
	? path.resolve(process.env.FOCUSRITE_SESSION_PUBLISH_TEST_ROOT)
	: DEFAULT_ROOT
const RESULT_DIR = path.join(ROOT, 'probe-results')
const TARGET_BRANCH = process.env.NODE_ENV === 'test' && process.env.FOCUSRITE_SESSION_PUBLISH_TEST_BRANCH
	? process.env.FOCUSRITE_SESSION_PUBLISH_TEST_BRANCH
	: 'diagnostics/readback-results'
const TARGET_FILE = 'diagnostics/runtime/latest-official-session-observer.md'
const REQUIRED_SOURCE_BRANCH = process.env.NODE_ENV === 'test' && process.env.FOCUSRITE_SESSION_PUBLISH_TEST_SOURCE_BRANCH
	? process.env.FOCUSRITE_SESSION_PUBLISH_TEST_SOURCE_BRANCH
	: 'debug/official-client-passive-session'

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
	try { runGit(['worktree', 'remove', '--force', tempDir], { allowFailure: true }) } catch {}
	try { fs.rmSync(tempDir, { recursive: true, force: true }) } catch {}
}

function fetchDiagnosticBranch() {
	runGit(['fetch', 'origin', TARGET_BRANCH])
	const remoteRef = `origin/${TARGET_BRANCH}`
	gitText(['rev-parse', '--verify', remoteRef])
	return remoteRef
}

function remotePublishedText(remoteRef) {
	const result = runGit(['show', `${remoteRef}:${TARGET_FILE}`], { capture: true, allowFailure: true })
	return result.status === 0 ? String(result.stdout || '') : null
}

function verifyRemotePublication(expected) {
	const remoteRef = fetchDiagnosticBranch()
	const actual = remotePublishedText(remoteRef)
	if (actual === null) throw new Error(`Remote verification failed: ${TARGET_FILE} is absent`)
	if (actual !== expected) throw new Error('Remote verification failed: passive-session report differs from sanitized local report')
	return gitText(['rev-parse', remoteRef])
}

function main() {
	const sourceBranch = gitText(['branch', '--show-current'])
	if (sourceBranch !== REQUIRED_SOURCE_BRANCH) throw new Error(`Automatic passive-session publication refused from ${sourceBranch || '<detached>'}`)
	const latest = findLatestSessionResult(RESULT_DIR)
	if (!latest) throw new Error('No sanitized passive-session report found in probe-results')
	const reportText = fs.readFileSync(latest.fullPath, 'utf8')
	const published = buildPublishedSession({
		reportText,
		sourceBranch: REQUIRED_SOURCE_BRANCH,
		sourceCommit: gitText(['rev-parse', 'HEAD']),
		sourceFile: latest.name,
		nodeVersion: process.versions.node,
	})
	console.log(`[PUBLISH] Sanitized passive-session report accepted: ${latest.name}`)
	console.log(`[PUBLISH] Target: ${TARGET_BRANCH}:${TARGET_FILE}`)
	const remoteRef = fetchDiagnosticBranch()
	if (remotePublishedText(remoteRef) === published) {
		console.log(`[PUBLISH] Already present and verified @ ${verifyRemotePublication(published)}`)
		return
	}
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-session-publish-'))
	try {
		runGit(['worktree', 'add', '--detach', tempDir, remoteRef])
		const targetPath = path.join(tempDir, ...TARGET_FILE.split('/'))
		fs.mkdirSync(path.dirname(targetPath), { recursive: true })
		fs.writeFileSync(targetPath, published, 'utf8')
		runGit(['add', '--', TARGET_FILE], { cwd: tempDir })
		const status = gitText(['status', '--porcelain'], tempDir)
		if (!status) throw new Error('Publisher wrote report but Git detected no change')
		const changed = status.split(/\r?\n/).filter(Boolean)
		if (changed.some((line) => !line.replace(/\\/g, '/').endsWith(TARGET_FILE))) throw new Error(`Unexpected publisher worktree change: ${changed.join(' | ')}`)
		const suffix = latest.name.replace(/^official_session_observer_|\.txt$/g, '')
		runGit(['-c','user.name=Focusrite Session Diagnostics','-c','user.email=focusrite-session@users.noreply.github.com','commit','-m',`diagnostic: publish passive session ${suffix}`], { cwd: tempDir })
		runGit(['push','origin',`HEAD:refs/heads/${TARGET_BRANCH}`], { cwd: tempDir })
	} finally {
		cleanupWorktree(tempDir)
	}
	console.log(`[PUBLISH] GitHub content verified @ ${verifyRemotePublication(published)}`)
}

try { main() } catch (error) {
	console.error(`[PUBLISH] FAILED: ${String(error?.message || error)}`)
	console.error('[PUBLISH] Sanitized local report kept; no raw capture was uploaded.')
	process.exitCode = 2
}
