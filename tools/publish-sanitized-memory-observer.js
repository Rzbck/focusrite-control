const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { findLatestMemoryResult, buildPublishedMemory } = require('./memory-observer-lib')

const ROOT = path.resolve(__dirname, '..')
const RESULT_DIR = path.join(ROOT, 'probe-results')
const TARGET_BRANCH = 'diagnostics/readback-results'
const TARGET_FILE = 'diagnostics/runtime/latest-official-client-memory-observer.md'
const REQUIRED_SOURCE_BRANCH = 'debug/official-client-memory-observer'

function runGit(args, options = {}) {
	const result = childProcess.spawnSync('git', args, {
		cwd: options.cwd || ROOT,
		encoding: 'utf8',
		stdio: options.capture ? ['ignore','pipe','pipe'] : 'inherit',
	})
	if (result.error) throw result.error
	if (result.status !== 0 && !options.allowFailure) {
		const detail = options.capture ? String(result.stderr || result.stdout || '').trim() : ''
		throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
	}
	return result
}
function gitText(args, cwd = ROOT) { return String(runGit(args, { cwd, capture:true }).stdout || '').trim() }
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
	if (remoteText(ref) !== expected) throw new Error('Remote memory-observer verification failed')
	return gitText(['rev-parse',ref])
}

function main() {
	const branch = gitText(['branch','--show-current'])
	if (branch !== REQUIRED_SOURCE_BRANCH) throw new Error(`Memory observer publication refused from ${branch || '<detached>'}`)
	const latest = findLatestMemoryResult(RESULT_DIR)
	if (!latest) throw new Error('No sanitized memory-observer report found')
	const published = buildPublishedMemory({
		reportText: fs.readFileSync(latest.fullPath, 'utf8'),
		sourceBranch: branch,
		sourceCommit: gitText(['rev-parse','HEAD']),
		sourceFile: latest.name,
		nodeVersion: process.versions.node,
	})
	const ref = fetchTarget()
	if (remoteText(ref) === published) {
		console.log(`[PUBLISH] Already present and verified @ ${verify(published)}`)
		return
	}
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-memory-publish-'))
	try {
		runGit(['worktree','add','--detach',tempDir,ref])
		const target = path.join(tempDir, ...TARGET_FILE.split('/'))
		fs.mkdirSync(path.dirname(target), { recursive:true })
		fs.writeFileSync(target, published, 'utf8')
		runGit(['add','--',TARGET_FILE], { cwd:tempDir })
		const status = gitText(['status','--porcelain'], tempDir)
		if (!status) throw new Error('Memory publisher produced no Git change')
		if (status.split(/\r?\n/).some((line) => !line.replace(/\\/g,'/').endsWith(TARGET_FILE))) throw new Error('Unexpected memory publisher worktree change')
		const suffix = latest.name.replace(/^official_client_memory_observer_|\.txt$/g, '')
		runGit(['-c','user.name=Focusrite Memory Diagnostics','-c','user.email=focusrite-memory@users.noreply.github.com','commit','-m',`diagnostic: publish memory observer ${suffix}`], { cwd:tempDir })
		runGit(['push','origin',`HEAD:refs/heads/${TARGET_BRANCH}`], { cwd:tempDir })
	} finally { cleanup(tempDir) }
	console.log(`[PUBLISH] GitHub content verified @ ${verify(published)}`)
}

try { main() } catch (error) {
	console.error(`[PUBLISH] FAILED: ${String(error?.message || error)}`)
	console.error('[PUBLISH] No raw process memory was uploaded.')
	process.exitCode = 2
}
