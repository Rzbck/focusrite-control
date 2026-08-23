'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const updatePath = path.join(__dirname, '..', 'UPDATE.bat')
const source = fs.readFileSync(updatePath, 'utf8')

test('UPDATE materialises the explicitly selected remote branch before switching', () => {
	assert.match(source, /git ls-remote --exit-code --heads origin "!TARGET_BRANCH!"/)
	assert.match(
		source,
		/git fetch origin "\+refs\/heads\/!TARGET_BRANCH!:refs\/remotes\/origin\/!TARGET_BRANCH!"/,
	)
	assert.match(source, /git switch --track -c "!TARGET_BRANCH!" "origin\/!TARGET_BRANCH!"/)
})

test('UPDATE keeps local branch updates fail-closed and fast-forward only', () => {
	assert.match(source, /git pull --ff-only origin "!TARGET_BRANCH!"/)
	assert.doesNotMatch(source, /git reset\s+--hard/i)
	assert.doesNotMatch(source, /git checkout\s+-f/i)
})
