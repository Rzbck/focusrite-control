const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { findLatestReadbackResult, buildPublishedReadback } = require('./publish-diagnostic-lib')

const ROOT = path.resolve(__dirname, '..')
const RESULT_DIR = path.join(ROOT, 'probe-results')
const TARGET_BRANCH = 'diagnostics/readback-results'
const TARGET_FILE = path.join('diagnostics', 'runtime', 'latest-readback.md')

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

	runGit(['fetch', 'origin', TARGET_BRANCH])
	const remoteRef = `origin/${TARGET_BRANCH}`
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-readback-publish-'))
	try {
		runGit(['worktree', 'add', '--detach', tempDir, remoteRef])
		const targetPath = path.join(tempDir, TARGET_FILE)
		fs.mkdirSync(path.dirname(targetPath), { recursive: true })
		fs.writeFileSync(targetPath, published, 'utf8')

		runGit(['add', '--', TARGET_FILE], { cwd: tempDir })
		const status = gitText(['status', '--porcelain', '--', TARGET_FILE], tempDir)
		if (!status) {
			console.log('[PUBLISH] Result already published; no commit needed.')
			return
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
		const publishedCommit = gitText(['rev-parse', 'HEAD'], tempDir)
		console.log(`[PUBLISH] GitHub OK: ${TARGET_BRANCH} @ ${publishedCommit}`)
	} finally {
		cleanupWorktree(tempDir)
	}
}

try {
	main()
} catch (error) {
	console.error(`[PUBLISH] FAILED: ${String(error?.message || error)}`)
	console.error('[PUBLISH] The local probe result remains available in probe-results; no raw local log was uploaded.')
	process.exitCode = 2
}
