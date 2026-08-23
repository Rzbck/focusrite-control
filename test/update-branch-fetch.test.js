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

test('meter closure launcher is stored canonically as LF in the Git blob', () => {
	const blob = execFileSync('git', ['show', 'HEAD:testbench/RUN_METER_FEEDBACK_CLOSURE.cmd'], {
		cwd: repoRoot,
		windowsHide: true,
	})
	assert.equal(blob.includes(0x0d), false)
})
