'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const test = require('node:test')
const assert = require('node:assert/strict')

const repoRoot = path.join(__dirname, '..')
const updatePath = path.join(repoRoot, 'UPDATE.bat')
const source = fs.readFileSync(updatePath, 'utf8')

test('UPDATE materialises the explicitly selected remote branch before switching', () => {
	assert.match(source, /git ls-remote --exit-code --heads origin "!TARGET_BRANCH!"/)
	assert.match(source, /git fetch origin "\+refs\/heads\/!TARGET_BRANCH!:refs\/remotes\/origin\/!TARGET_BRANCH!"/)
	assert.match(source, /git switch -c "!TARGET_BRANCH!" "refs\/remotes\/origin\/!TARGET_BRANCH!"/)
	assert.doesNotMatch(source, /git switch --track -c "!TARGET_BRANCH!"/)
})

test('UPDATE keeps local branch updates fail-closed and fast-forward only', () => {
	assert.match(source, /git pull --ff-only origin "!TARGET_BRANCH!"/)
	assert.doesNotMatch(source, /git reset\s+--hard/i)
	assert.doesNotMatch(source, /git checkout\s+-f/i)
})

test('UPDATE force-refreshes tracked state before deciding the worktree is clean', () => {
	const refreshIndex = source.indexOf('git update-index --really-refresh')
	const trackedDiffIndex = source.indexOf('git diff-files --quiet --')
	const untrackedIndex = source.indexOf('git ls-files --others --exclude-standard')
	const pullIndex = source.indexOf('git pull --ff-only origin "!TARGET_BRANCH!"')

	assert.ok(refreshIndex >= 0)
	assert.ok(trackedDiffIndex > refreshIndex)
	assert.ok(untrackedIndex > trackedDiffIndex)
	assert.ok(pullIndex > untrackedIndex)
})

test('direct UPDATE bootstrap cannot resume inside a branch-replaced tracked file', () => {
	const workerIndex = source.indexOf('\n:worker\n')
	const guardedBootstrapIndex = source.indexOf('if /I not "%~1"=="--worker" (')
	const workerCallIndex = source.indexOf('call "!TMP_SCRIPT!" --worker')
	const parsedExitIndex = source.indexOf('endlocal & exit /b !BOOT_RC!')

	assert.ok(guardedBootstrapIndex >= 0)
	assert.ok(workerCallIndex > guardedBootstrapIndex)
	assert.ok(parsedExitIndex > workerCallIndex)
	assert.ok(workerIndex > parsedExitIndex)
	assert.doesNotMatch(source.slice(0, workerIndex), /exit \/b %BOOT_RC%/)
	assert.match(source, /whole bootstrap[\s\S]*inside one parsed block/i)
})

test('UPDATE resolves full local and remote SHAs before shortening them for display', () => {
	assert.match(source, /git rev-parse --verify HEAD 2\^>nul/)
	assert.match(source, /git rev-parse --verify "refs\/remotes\/origin\/!TARGET_BRANCH!" 2\^>nul/)
	assert.match(source, /set "CURRENT_HEAD=!CURRENT_HEAD:~0,12!"/)
	assert.match(source, /set "REMOTE_HEAD=!REMOTE_HEAD:~0,12!"/)
	assert.match(source, /set "FINAL_HEAD=!FINAL_HEAD:~0,12!"/)
})

test('tracked Windows launchers are stored canonically as LF in Git blobs', () => {
	for (const relativePath of ['UPDATE.bat', 'UPDATE_AND_RUN.bat', 'testbench/RUN_METER_FEEDBACK_CLOSURE.cmd']) {
		const blob = execFileSync('git', ['show', `HEAD:${relativePath}`], {
			cwd: repoRoot,
			windowsHide: true,
		})
		assert.equal(blob.includes(0x0d), false, `${relativePath} must be LF in the Git blob`)
	}
})
