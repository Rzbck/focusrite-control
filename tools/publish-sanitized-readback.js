const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { findLatestReadbackResult, buildPublishedReadback } = require('./publish-diagnostic-lib')

const DEFAULT_ROOT = path.resolve(__dirname, '..')
const ROOT =
	process.env.NODE_ENV === 'test' && process.env.FOCUSRITE_PUBLISH_TEST_ROOT
		? path.resolve(process.env.FOCUSRITE_PUBLISH_TEST_ROOT)
		: DEFAULT_ROOT
const RESULT_DIR = path.join(ROOT, 'probe-results')
const TARGET_BRANCH = 'diagnostics/readback-results'
const TARGET_FILE = 'diagnostics/runtime/latest-readback.md'

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
		// Best effort only.
	}
	try {
		fs.rmSync(tempDir, { recursive: true, force: true })
	} catch {
		// Best effort only.
	}
}

function fetchDiagnosticBranch() {
	runGit(['fetch', 'origin', TARGET_BRANCH])
	const remoteRef = `origin/${TARGET_BRANCH}`
	gitText(['rev-parse', '--verify', remoteRef])
	return remoteRef
}

function remotePublishedText(remoteRef) {
	const result = runGit(['show', `${remoteRef}:${TARGET_FILE}`], { capture: true, allowFailure: true })
	if (result.status !== 0) return null
	return String(result.stdout || '')
}

function verifyRemotePublication(expected) {
	const remoteRef = fetchDiagnosticBranch()
	const actual = remotePublishedText(remoteRef)
	if (actual === null) throw new Error(`Remote verification failed: ${TARGET_FILE} is absent from ${TARGET_BRANCH}`)
	if (actual !== expected) throw new Error('Remote verification failed: published diagnostic content does not match the sanitized local report')
	return gitText(['rev-parse', remoteRef])
}

function main() {
	const sourceBranch = gitText(['branch', '--show-current'])
	if (sourceBranch !== 'debug/cold-start-readback') {
		throw new Error(`Automatic diagnostic publication refused from branch ${sourceBranch || '<detached>'}`)
	}

	const latest = findLatestReadbackResult(RESULT_DIR)
	if (!latest) throw new Error('No sanitized readback result found in probe-results')
	const reportText = fs.readFileSync(latest.fullPath, 'utf8')
	const sourceCommit = gitText(['rev-parse', 'HEAD'])
	const nodeVersion = process.versions.node
	const published = buildPublishedReadback({
		reportText,
		sourceBranch,
		sourceCommit,
		sourceFile: latest.name,
		nodeVersion,
	})

	console.log(`[PUBLISH] Sanitized source accepted: ${latest.name}`)
	console.log(`[PUBLISH] Target: ${TARGET_BRANCH}:${TARGET_FILE}`)

	const remoteRef = fetchDiagnosticBranch()
	const existing = remotePublishedText(remoteRef)
	if (existing === published) {
		const verifiedCommit = verifyRemotePublication(published)
		console.log(`[PUBLISH] Result already present and remotely verified @ ${verifiedCommit}`)
		return
	}

	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-readback-publish-'))
	try {
		runGit(['worktree', 'add', '--detach', tempDir, remoteRef])
		const targetPath = path.join(tempDir, ...TARGET_FILE.split('/'))
		fs.mkdirSync(path.dirname(targetPath), { recursive: true })
		fs.writeFileSync(targetPath, published, 'utf8')

		runGit(['add', '--', TARGET_FILE], { cwd: tempDir })
		const status = gitText(['status', '--porcelain'], tempDir)
		if (!status) throw new Error('Publisher wrote the report but Git did not detect a change')

		const changedLines = status.split(/\r?\n/).filter(Boolean)
		if (changedLines.some((line) => !line.replace(/\\/g, '/').endsWith(TARGET_FILE))) {
			throw new Error(`Publisher worktree contains an unexpected change: ${changedLines.join(' | ')}`)
		}

		const message = `diagnostic: publish sanitized readback ${latest.name.replace(/^readonly_state_probe_|\.txt$/g, '')}`
		runGit(
			[
				'-c',
				'user.name=Focusrite Readback Diagnostics',
				'-c',
				'user.email=focusrite-readback@users.noreply.github.com',
				'commit',
				'-m',
				message,
			],
			{ cwd: tempDir },
		)
		runGit(['push', 'origin', `HEAD:refs/heads/${TARGET_BRANCH}`], { cwd: tempDir })
	} finally {
		cleanupWorktree(tempDir)
	}

	const verifiedCommit = verifyRemotePublication(published)
	console.log(`[PUBLISH] GitHub content verified: ${TARGET_BRANCH} @ ${verifiedCommit}`)
}

try {
	main()
} catch (error) {
	console.error(`[PUBLISH] FAILED: ${String(error?.message || error)}`)
	console.error('[PUBLISH] Local sanitized result kept in probe-results; raw local logs were not uploaded.')
	process.exitCode = 2
}
