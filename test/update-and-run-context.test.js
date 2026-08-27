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

test('UPDATE resolves the canonical Git root and refreshes tracked state before safety stash decisions', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'UPDATE.bat'), 'utf8')
	const rootIndex = source.indexOf('git rev-parse --show-toplevel')
	const refreshIndex = source.indexOf('git update-index --really-refresh')
	const dirtyIndex = source.indexOf('git diff-files --quiet --')
	const pullIndex = source.indexOf('git pull --ff-only origin')

	assert.ok(rootIndex >= 0)
	assert.ok(refreshIndex > rootIndex)
	assert.ok(dirtyIndex > refreshIndex)
	assert.ok(pullIndex > dirtyIndex)
	assert.match(source, /git stash push --include-untracked/)
	assert.match(source, /Dossier depot : !REPO_DIR!/)
	assert.match(source, /HEAD local\s+: !CURRENT_HEAD!/)
	assert.match(source, /HEAD distant\s+: !REMOTE_HEAD!/)
	assert.match(source, /Dossier\s+: !REPO_DIR!/)
	assert.match(source, /HEAD\s+: !FINAL_HEAD!/)
})

test('UPDATE refuses a duplicate linked-worktree checkout instead of auto-jumping directories', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'UPDATE.bat'), 'utf8')
	const worktreeIndex = source.indexOf('git worktree list --porcelain')
	const switchIndex = source.indexOf('git switch -c "!TARGET_BRANCH!"')
	const pullIndex = source.indexOf('git pull --ff-only origin "!TARGET_BRANCH!"')

	assert.ok(worktreeIndex >= 0)
	assert.ok(switchIndex > worktreeIndex)
	assert.ok(pullIndex > worktreeIndex)
	assert.match(source, /refs\/heads\/!TARGET_BRANCH!/)
	assert.match(source, /est deja active dans un autre worktree/)
	assert.match(source, /Worktree proprietaire/)
	assert.match(source, /Lance UPDATE\.bat depuis ce worktree/)
	assert.doesNotMatch(source, /Bascule automatique vers/)
	assert.doesNotMatch(source, /set "REPO_DIR=!TARGET_WORKTREE/)
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
		assert.match(source, /MANDATORY STARTUP FRESHNESS GATE|Startup freshness gate/i)
		assert.match(source, /current (?:remote )?HEAD/i)
		assert.match(source, /repository-wide branch movement|newer commits\/diff|newer material branch movement/i)
		assert.match(source, /newest explicit physical hardware\/user-host result|newest physical hardware result/i)
	}

	assert.match(rootHandoff, /verify the LIVE repository first/i)
	assert.match(rootHandoff, /objective-owning branch/i)
	assert.match(currentHandoff, /Evidence priority: newest explicit physical hardware\/user-host result/i)
})

test('HANDOFF freshness remains repo-wide and objective-branch aware', () => {
	const rootHandoff = fs.readFileSync(path.join(repoRoot, 'HANDOFF'), 'utf8')

	assert.match(rootHandoff, /repository-wide branch movement/i)
	assert.match(rootHandoff, /current remote HEAD of the objective-owning branch/i)
	assert.match(rootHandoff, /inspect newer commits\/diff/i)
	assert.match(rootHandoff, /newest explicit physical hardware\/user-host result/i)
	assert.match(rootHandoff, /verify the LIVE repository first/i)
})

test('normal project launchers remain the canonical user workflow', () => {
	const rootHandoff = fs.readFileSync(path.join(repoRoot, 'HANDOFF'), 'utf8')
	const currentHandoff = fs.readFileSync(path.join(repoRoot, 'docs', 'CURRENT_HANDOFF.md'), 'utf8')

	assert.match(rootHandoff, /PROJECT LAUNCHERS FIRST/)
	assert.match(rootHandoff, /UPDATE\.bat/)
	assert.match(rootHandoff, /UPDATE_AND_RUN\.bat/)
	assert.match(rootHandoff, /RUN\.bat/)
	assert.match(rootHandoff, /RUN_\*\.cmd/)
	assert.match(rootHandoff, /last resort/i)
	assert.match(currentHandoff, /Run the checked-in:\s*\n\n`UPDATE_AND_RUN\.bat`/)
	assert.match(currentHandoff, /Do \*\*not\*\* run another broad hardware REC/i)
})
