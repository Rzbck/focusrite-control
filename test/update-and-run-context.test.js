'use strict'

const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const repoRoot = path.join(__dirname, '..')

test('UPDATE_AND_RUN prints canonical synchronized branch, HEAD and handoff context before RUN', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'UPDATE_AND_RUN.bat'), 'utf8')
	const updateIndex = source.indexOf('call "!TMP_UPDATE!" --worker "!REPO_DIR!" --no-pause')
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

test('stable UPDATE snapshot receives the real repository path instead of deriving TEMP as repo', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'UPDATE_AND_RUN.bat'), 'utf8')

	assert.match(source, /copy \/Y "!REPO_DIR!UPDATE\.bat" "!TMP_UPDATE!"/)
	assert.match(source, /call "!TMP_UPDATE!" --worker "!REPO_DIR!" --no-pause/)
	assert.doesNotMatch(source, /call "!TMP_UPDATE!" --no-pause/)
	assert.match(source, /cd \/d "!REPO_DIR!"/)
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

test('handoff resume contract requires live remote HEAD and newest relevant movement before decisions', () => {
	const rootHandoff = fs.readFileSync(path.join(repoRoot, 'HANDOFF'), 'utf8')
	const currentHandoff = fs.readFileSync(path.join(repoRoot, 'docs', 'CURRENT_HANDOFF.md'), 'utf8')

	for (const source of [rootHandoff, currentHandoff]) {
		assert.match(source, /MANDATORY STARTUP FRESHNESS GATE/)
		assert.match(source, /current HEAD/i)
		assert.match(source, /latest relevant commits|latest relevant commits\/diff|newer material commits|relevant newer commits/i)
		assert.match(source, /newer completed.*user|newer result.*human user|newer completed user\/hardware result/i)
	}

	assert.match(
		rootHandoff,
		/Never assume the HEAD, branch, gate state, package state, or next step from an older chat summary|do not guess from chat history/i,
	)
	assert.match(currentHandoff, /An SHA.*checkpoint.*skip.*live/is)
})

test('HANDOFF freshness is repo-wide and cannot trust default-branch recency alone', () => {
	const rootHandoff = fs.readFileSync(path.join(repoRoot, 'HANDOFF'), 'utf8')

	assert.match(rootHandoff, /REPO-WIDE RECENCY FIRST/)
	assert.match(rootHandoff, /recent REMOTE branch movement across the repository/i)
	assert.match(rootHandoff, /not only `main`/i)
	assert.match(rootHandoff, /newest MATERIAL movements by commit time/i)
	assert.match(rootHandoff, /BOTH recency and relevance/i)
	assert.match(rootHandoff, /Never trust the branch named in `docs\/CURRENT_HANDOFF\.md` until this repo-wide movement check/i)
	assert.match(rootHandoff, /default-branch commit search can miss work living on another branch/i)
	assert.match(rootHandoff, /Prefer explicit branch enumeration plus branch-tip\/ref comparison/i)
	assert.match(rootHandoff, /live GitHub access is unavailable.*live freshness could not be verified/is)
	assert.match(rootHandoff, /document timestamp is context, never proof/i)
})
