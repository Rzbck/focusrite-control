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

test('tracked Windows launchers are stored canonically as LF in Git blobs', () => {
	for (const relativePath of [
		'UPDATE.bat',
		'UPDATE_AND_RUN.bat',
		'testbench/RUN_METER_FEEDBACK_CLOSURE.cmd',
	]) {
		const blob = execFileSync('git', ['show', `HEAD:${relativePath}`], {
			cwd: repoRoot,
			windowsHide: true,
		})
		assert.equal(blob.includes(0x0d), false, `${relativePath} must be LF in the Git blob`)
	}
})
