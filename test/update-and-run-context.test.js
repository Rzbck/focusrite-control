'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const repoRoot = path.join(__dirname, '..')

test('UPDATE_AND_RUN prints canonical synchronized branch, HEAD and handoff context before RUN', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'UPDATE_AND_RUN.bat'), 'utf8')
	const updateIndex = source.indexOf('call "!REPO_DIR!UPDATE.bat" --no-pause')
	const contextIndex = source.indexOf('CONTEXTE CANONIQUE APRES SYNCHRONISATION')
	const runIndex = source.indexOf('call "!REPO_DIR!RUN.bat"')

	assert.ok(updateIndex >= 0)
	assert.ok(contextIndex > updateIndex)
	assert.ok(runIndex > contextIndex)
	assert.match(source, /git branch --show-current/)
	assert.match(source, /git rev-parse --verify HEAD/)
	assert.match(source, /git rev-parse --verify HEAD:docs\/CURRENT_HANDOFF\.md/)
	assert.match(source, /CURRENT_HEAD:~0,12/)
	assert.match(source, /Handoff blob/)
	assert.doesNotMatch(source, /findstr .*Updated:/i)
	assert.match(source, /Un handoff copie\/uploade plus ancien est historique/i)
})

test('RUN prints current checkout context immediately so first post-update run is identifiable', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'RUN.bat'), 'utf8')
	const contextIndex = source.indexOf('CONTEXTE CANONIQUE DU RUN')
	const dependencyIndex = source.indexOf('[1/6] Dependances')

	assert.ok(contextIndex >= 0)
	assert.ok(dependencyIndex > contextIndex)
	assert.match(source, /git branch --show-current/)
	assert.match(source, /git rev-parse --verify HEAD/)
	assert.match(source, /git rev-parse --verify HEAD:docs\/CURRENT_HANDOFF\.md/)
	assert.match(source, /CURRENT_CONTEXT_HEAD:~0,12/)
	assert.match(source, /Handoff blob/)
	assert.doesNotMatch(source, /findstr .*Updated:/i)
	assert.doesNotMatch(source, /^necho\b/gim)
})
