const childProcess = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { readStatusFile, buildPublishedStatus } = require('./memory-observer-status-lib')

const ROOT = path.resolve(__dirname, '..')
const STATUS_FILE = path.join(ROOT,'.local-logs','MEMORY_OBSERVER_STATUS.txt')
const TARGET_BRANCH = 'diagnostics/readback-results'
const TARGET_FILE = 'diagnostics/runtime/latest-official-client-memory-observer-status.md'
const SOURCE_BRANCH = 'debug/official-client-memory-observer'

function runGit(args, options={}) {
	const r = childProcess.spawnSync('git', args, { cwd:options.cwd||ROOT, encoding:'utf8', stdio:options.capture?['ignore','pipe','pipe']:'inherit' })
	if (r.error) throw r.error
	if (r.status !== 0 && !options.allowFailure) throw new Error(`git ${args.join(' ')} failed${options.capture ? `: ${String(r.stderr||r.stdout||'').trim()}` : ''}`)
	return r
}
function gitText(args,cwd=ROOT){ return String(runGit(args,{cwd,capture:true}).stdout||'').trim() }
function fetchTarget(){ runGit(['fetch','origin',TARGET_BRANCH]); const ref=`origin/${TARGET_BRANCH}`; gitText(['rev-parse','--verify',ref]); return ref }
function remoteText(ref){ const r=runGit(['show',`${ref}:${TARGET_FILE}`],{capture:true,allowFailure:true}); return r.status===0?String(r.stdout||''):null }
function cleanup(dir){ try{runGit(['worktree','remove','--force',dir],{allowFailure:true})}catch{} try{fs.rmSync(dir,{recursive:true,force:true})}catch{} }
function verify(expected){ const ref=fetchTarget(); if(remoteText(ref)!==expected) throw new Error('Remote memory status verification failed'); return gitText(['rev-parse',ref]) }

function main(){
	const branch=gitText(['branch','--show-current'])
	if(branch!==SOURCE_BRANCH) throw new Error(`Memory status publication refused from ${branch||'<detached>'}`)
	const status=readStatusFile(STATUS_FILE)
	const published=buildPublishedStatus({status,sourceBranch:branch,sourceCommit:gitText(['rev-parse','HEAD']),nodeVersion:process.versions.node})
	const ref=fetchTarget()
	if(remoteText(ref)===published){ console.log(`[STATUS] Already present and verified @ ${verify(published)}`); return }
	const temp=fs.mkdtempSync(path.join(os.tmpdir(),'focusrite-memory-status-'))
	try{
		runGit(['worktree','add','--detach',temp,ref])
		const target=path.join(temp,...TARGET_FILE.split('/')); fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,published,'utf8')
		runGit(['add','--',TARGET_FILE],{cwd:temp})
		const changes=gitText(['status','--porcelain'],temp); if(!changes) throw new Error('Status publisher produced no Git change')
		if(changes.split(/\r?\n/).some((line)=>!line.replace(/\\/g,'/').endsWith(TARGET_FILE))) throw new Error('Unexpected status worktree change')
		runGit(['-c','user.name=Focusrite Memory Diagnostics','-c','user.email=focusrite-memory@users.noreply.github.com','commit','-m',`diagnostic: memory observer ${status.outcome.toLowerCase()} ${status.stage} ${status.code}`],{cwd:temp})
		runGit(['push','origin',`HEAD:refs/heads/${TARGET_BRANCH}`],{cwd:temp})
	}finally{cleanup(temp)}
	console.log(`[STATUS] GitHub content verified @ ${verify(published)}`)
}
try{main()}catch(error){console.error(`[STATUS] FAILED: ${String(error?.message||error)}`);console.error('[STATUS] No raw process memory/log was uploaded.');process.exitCode=2}
