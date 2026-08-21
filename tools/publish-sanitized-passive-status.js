const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { readStatusFile, buildPublishedStatus } = require('./passive-session-status-lib')

const DEFAULT_ROOT = path.resolve(__dirname, '..')
const ROOT = process.env.NODE_ENV === 'test' && process.env.FOCUSRITE_STATUS_PUBLISH_TEST_ROOT
	? path.resolve(process.env.FOCUSRITE_STATUS_PUBLISH_TEST_ROOT)
	: DEFAULT_ROOT
const STATUS_FILE = path.join(ROOT, '.local-logs', 'PASSIVE_SESSION_STATUS.txt')
const TARGET_BRANCH = process.env.NODE_ENV === 'test' && process.env.FOCUSRITE_STATUS_PUBLISH_TEST_BRANCH
	? process.env.FOCUSRITE_STATUS_PUBLISH_TEST_BRANCH
	: 'diagnostics/readback-results'
const TARGET_FILE = 'diagnostics/runtime/latest-official-session-observer-status.md'
const REQUIRED_SOURCE_BRANCH = 'debug/official-client-passive-session'

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
function gitText(args, cwd = ROOT) { return String(runGit(args, { cwd, capture: true }).stdout || '').trim() }
function cleanup(dir) {
	try { runGit(['worktree','remove','--force',dir], { allowFailure:true }) } catch {}
	try { fs.rmSync(dir, { recursive:true, force:true }) } catch {}
}
function fetchTarget() {
	runGit(['fetch','origin',TARGET_BRANCH])
	const ref = `origin/${TARGET_BRANCH}`
	gitText(['rev-parse','--verify',ref])
	return ref
}
function remoteText(ref) {
	const r = runGit(['show',`${ref}:${TARGET_FILE}`], { capture:true, allowFailure:true })
	return r.status === 0 ? String(r.stdout || '') : null
}
function verify(expected) {
	const ref = fetchTarget()
	if (remoteText(ref) !== expected) throw new Error('Remote passive-session status verification failed')
	return gitText(['rev-parse',ref])
}

function main() {
	const sourceBranch = gitText(['branch','--show-current'])
	if (sourceBranch !== REQUIRED_SOURCE_BRANCH) throw new Error(`Status publication refused from ${sourceBranch || '<detached>'}`)
	const status = readStatusFile(STATUS_FILE)
	const published = buildPublishedStatus({
		status,
		sourceBranch,
		sourceCommit: gitText(['rev-parse','HEAD']),
		nodeVersion: process.versions.node,
	})
	const ref = fetchTarget()
	if (remoteText(ref) === published) {
		console.log(`[STATUS] Already present and verified @ ${verify(published)}`)
		return
	}
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-session-status-'))
	try {
		runGit(['worktree','add','--detach',tempDir,ref])
		const target = path.join(tempDir, ...TARGET_FILE.split('/'))
		fs.mkdirSync(path.dirname(target), { recursive:true })
		fs.writeFileSync(target, published, 'utf8')
		runGit(['add','--',TARGET_FILE], { cwd:tempDir })
		const statusText = gitText(['status','--porcelain'], tempDir)
		if (!statusText) throw new Error('Status publisher produced no Git change')
		if (statusText.split(/\r?\n/).some((line) => !line.replace(/\\/g,'/').endsWith(TARGET_FILE))) throw new Error('Unexpected status publisher worktree change')
		runGit(['-c','user.name=Focusrite Session Diagnostics','-c','user.email=focusrite-session@users.noreply.github.com','commit','-m',`diagnostic: passive harness ${status.outcome.toLowerCase()} ${status.stage} ${status.code}`], { cwd:tempDir })
		runGit(['push','origin',`HEAD:refs/heads/${TARGET_BRANCH}`], { cwd:tempDir })
	} finally { cleanup(tempDir) }
	console.log(`[STATUS] GitHub content verified @ ${verify(published)}`)
}

try { main() } catch (error) {
	console.error(`[STATUS] FAILED: ${String(error?.message || error)}`)
	console.error('[STATUS] No raw local log/capture was uploaded.')
	process.exitCode = 2
}
