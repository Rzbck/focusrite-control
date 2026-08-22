'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')
const latestPath = path.join(__dirname, 'results', 'LATEST_SHAREABLE.json')
const publicDir = path.join(root, 'docs', 'hardware-results')
const publicPath = path.join(publicDir, 'LATEST_SHAREABLE.json')
const PUBLIC_RELATIVE_PATH = path.join('docs', 'hardware-results', 'LATEST_SHAREABLE.json')
const AUTO_PUBLISH_BRANCH = 'testbench/v0.2-hardware-validation'
const MAX_PUBLISH_ATTEMPTS = 2

const CAPABILITY_KEYS = new Set([
	'id',
	'family',
	'availability',
	'r9ProbeCount',
	'stateKnown',
	'capability',
	'risk',
	'dependency',
	'status',
	'detail',
])
const META_KEYS = new Set([
	'completed',
	'hardwareWrites',
	'reason',
	'revision',
	'signature',
	'model',
	'r9Probes',
	'r9Definitions',
	'globalSignalPathSafety',
	'signalPathSafety',
])
const FORBIDDEN_KEY =
	/^(?:state|variable|serial|serialNumber|hostname|clientKey|serverPort|connectionId|clientId|deviceId|rawXml|rawXML|path)$/i

function validateShareable(payload, rawText = JSON.stringify(payload)) {
	const errors = []
	if (!payload || payload.reportClass !== 'shareable-sanitized') errors.push('reportClass must be shareable-sanitized')
	if (payload?.meta?.completed !== true) errors.push('only completed campaigns may be published')

	for (const key of Object.keys(payload?.meta || {}))
		if (!META_KEYS.has(key)) errors.push(`unexpected meta key: ${key}`)
	for (const row of payload?.capabilities || []) {
		for (const key of Object.keys(row || {}))
			if (!CAPABILITY_KEYS.has(key)) errors.push(`unexpected capability key: ${key}`)
	}

	const walk = (value, key = '') => {
		if (FORBIDDEN_KEY.test(key)) errors.push(`forbidden key: ${key}`)
		if (Array.isArray(value)) return value.forEach((item) => walk(item, ''))
		if (value && typeof value === 'object')
			return Object.entries(value).forEach(([childKey, child]) => walk(child, childKey))
	}
	walk(payload)

	const deny = [
		/\b[A-Za-z]:[\\/](?!<path-redacted>)[^\s"']+/,
		/\/(?:Users|home)\/[^\s"']+/,
		/https?:\/\/(?!<url-redacted>)[^\s"']+/i,
		/\b(?:localhost|(?:\d{1,3}\.){3}\d{1,3}|[A-Za-z0-9.-]+\.local):\d{2,5}\b/i,
		/<set\b/i,
		/<device\b/i,
		/\b(?:client[_ -]?key|server[_ -]?port)\s*[=:]\s*[^\s,;}]+/i,
		/\b(?:client|device|connection)[-_ ]?id\s*[=:]\s*[^\s,;}]+/i,
		/\b(?:hostname|host|server)[-_ ]?(?:name)?\s*[=:]\s*[^\s,;}]+/i,
	]
	for (const pattern of deny)
		if (pattern.test(rawText)) errors.push(`content matched forbidden privacy pattern: ${pattern}`)

	return [...new Set(errors)]
}

function runGit(args, cwd = root) {
	return spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true })
}

function gitMessage(result) {
	return String(result?.stderr || result?.stdout || '').trim()
}

function requireGit(result, operation) {
	if (result.status !== 0) throw new Error(`${operation} failed: ${gitMessage(result)}`)
	return result
}

function currentBranch(repoRoot = root) {
	const result = runGit(['branch', '--show-current'], repoRoot)
	if (result.status !== 0) throw new Error(`cannot determine current Git branch: ${gitMessage(result)}`)
	return String(result.stdout || '').trim()
}

function cleanupWorktree(repoRoot, worktreePath) {
	if (!worktreePath) return
	runGit(['worktree', 'remove', '--force', worktreePath], repoRoot)
	fs.rmSync(worktreePath, { recursive: true, force: true })
	runGit(['worktree', 'prune'], repoRoot)
}

function isNonFastForwardPush(result) {
	return /(?:non-fast-forward|fetch first|rejected)/i.test(gitMessage(result))
}

function publishSanitizedToRemote({
	repoRoot = root,
	branch = AUTO_PUBLISH_BRANCH,
	relativePublicPath = PUBLIC_RELATIVE_PATH,
	serialized,
	maxAttempts = MAX_PUBLISH_ATTEMPTS,
}) {
	if (typeof serialized !== 'string' || serialized.length === 0) throw new Error('serialized shareable report is empty')

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		let worktreePath = ''
		try {
			const remoteRef = `refs/remotes/origin/${branch}`
			requireGit(
				runGit(['fetch', 'origin', `refs/heads/${branch}:${remoteRef}`], repoRoot),
				`git fetch origin ${branch}`,
			)

			worktreePath = fs.mkdtempSync(path.join(os.tmpdir(), 'focusrite-shareable-publish-'))
			requireGit(runGit(['worktree', 'add', '--detach', worktreePath, remoteRef], repoRoot), 'git worktree add')

			const targetPath = path.join(worktreePath, relativePublicPath)
			fs.mkdirSync(path.dirname(targetPath), { recursive: true })
			fs.writeFileSync(targetPath, serialized, 'utf8')

			requireGit(runGit(['add', '--', relativePublicPath], worktreePath), 'git add sanitized report')
			const diff = runGit(['diff', '--cached', '--quiet', '--', relativePublicPath], worktreePath)
			if (diff.status === 0) {
				return { published: false, skipped: true, attempts: attempt }
			}
			if (diff.status !== 1) throw new Error(`git diff failed: ${gitMessage(diff)}`)

			requireGit(
				runGit(
					['commit', '-m', 'testbench: publish latest sanitized hardware report', '--', relativePublicPath],
					worktreePath,
				),
				'git commit sanitized report',
			)

			const push = runGit(['push', 'origin', `HEAD:refs/heads/${branch}`], worktreePath)
			if (push.status === 0) return { published: true, skipped: false, attempts: attempt }
			if (!isNonFastForwardPush(push) || attempt === maxAttempts) {
				throw new Error(`git push failed safely (no force used): ${gitMessage(push)}`)
			}
		} finally {
			cleanupWorktree(repoRoot, worktreePath)
		}
	}

	throw new Error('git push failed safely after retry')
}

function publishLatestShareable() {
	const branch = currentBranch()
	if (branch !== AUTO_PUBLISH_BRANCH) {
		console.log(`PUBLISH SKIP - automatic report publication is disabled on branch ${branch || '(detached HEAD)'}.`)
		return { published: false, skipped: true }
	}
	if (!fs.existsSync(latestPath)) {
		console.log('PUBLISH SKIP - no LATEST_SHAREABLE.json exists.')
		return { published: false, skipped: true }
	}
	const raw = fs.readFileSync(latestPath, 'utf8')
	let payload
	try {
		payload = JSON.parse(raw)
	} catch (error) {
		throw new Error(`Privacy gate refused invalid JSON: ${error.message}`, { cause: error })
	}
	if (payload?.reportClass === 'shareable-sanitized' && payload?.meta?.completed !== true) {
		console.log('PUBLISH SKIP - report is sanitized but the campaign is not completed (PREP/fatal report).')
		return { published: false, skipped: true }
	}
	const errors = validateShareable(payload, raw)
	if (errors.length) throw new Error(`Privacy gate refused publication: ${errors.join('; ')}`)

	const result = publishSanitizedToRemote({ serialized: `${JSON.stringify(payload, null, 2)}\n` })
	if (result.published) {
		console.log(`PUBLISH OK - sanitized completed hardware report pushed to GitHub in ${result.attempts} attempt(s).`)
	} else {
		console.log('PUBLISH OK - sanitized GitHub report already matches the latest completed campaign.')
	}
	return result
}

function main() {
	try {
		publishLatestShareable()
	} catch (error) {
		console.error(`PUBLISH FAIL - ${error.message}`)
		process.exitCode = 7
	}
}

if (require.main === module) main()

module.exports = {
	AUTO_PUBLISH_BRANCH,
	MAX_PUBLISH_ATTEMPTS,
	PUBLIC_RELATIVE_PATH,
	validateShareable,
	currentBranch,
	publishSanitizedToRemote,
	publishLatestShareable,
	latestPath,
	publicPath,
}
