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

test('UPDATE refreshes stale tracked metadata before deciding whether a safety stash is needed', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'UPDATE.bat'), 'utf8')
	const refreshIndex = source.indexOf('git update-index --really-refresh')
	const dirtyIndex = source.indexOf('git diff-files --quiet --')
	const pullIndex = source.indexOf('git pull --ff-only origin')

	assert.ok(refreshIndex >= 0)
	assert.ok(dirtyIndex > refreshIndex)
	assert.ok(pullIndex > dirtyIndex)
	assert.match(source, /git stash push --include-untracked/)
	assert.match(source, /Dossier depot : !REPO_DIR!/)
	assert.match(source, /HEAD local\s+: !CURRENT_HEAD!/)
	assert.match(source, /HEAD distant\s+: !REMOTE_HEAD!/)
	assert.match(source, /Dossier\s+: !REPO_DIR!/)
	assert.match(source, /HEAD\s+: !FINAL_HEAD!/)
})

test('UPDATE follows a selected branch to the linked worktree that already owns it', () => {
	const source = fs.readFileSync(path.join(repoRoot, 'UPDATE.bat'), 'utf8')
	const worktreeIndex = source.indexOf('git worktree list --porcelain')
	const switchIndex = source.indexOf('git switch -c "!TARGET_BRANCH!"')
	const pullIndex = source.indexOf('git pull --ff-only origin "!TARGET_BRANCH!"')

	assert.ok(worktreeIndex >= 0)
	assert.ok(switchIndex > worktreeIndex)
	assert.ok(pullIndex > worktreeIndex)
	assert.match(source, /refs\/heads\/!TARGET_BRANCH!/)
	assert.match(source, /La branche cible est deja active dans un autre worktree/)
	assert.match(source, /Bascule automatique vers/)
	assert.match(source, /set "REPO_DIR=!TARGET_WORKTREE_NORM!\\"/)
	assert.match(source, /if \/I not "!CURRENT_BRANCH!"=="!TARGET_BRANCH!"/)
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
		assert.match(source, /current (?:remote )?HEAD/i)
		assert.match(source, /newest MATERIAL movements|newer commits\/diff|newer material movement/i)
		assert.match(source, /newer completed physical\/human result|newer completed user\/hardware result/i)
	}

	assert.match(rootHandoff, /do not guess from chat history/i)
	assert.match(rootHandoff, /embedded SHA.*never permission|embedded SHA.*context only/is)
	assert.match(currentHandoff, /document timestamp or embedded SHA is a checkpoint only/i)
})

test('HANDOFF freshness is repo-wide and cannot trust default-branch recency alone', () => {
	const rootHandoff = fs.readFileSync(path.join(repoRoot, 'HANDOFF'), 'utf8')

	assert.match(rootHandoff, /REPO-WIDE RECENCY FIRST/)
	assert.match(rootHandoff, /remote branch movement across the repository/i)
	assert.match(rootHandoff, /not only `main`/i)
	assert.match(rootHandoff, /newest MATERIAL movements by commit time/i)
	assert.match(rootHandoff, /BOTH recency and relevance/i)
	assert.match(rootHandoff, /default-branch commit search can miss work on another branch/i)
	assert.match(rootHandoff, /live Git verification/i)
})

test('HANDOFF requires normal project launchers before ad-hoc shell commands', () => {
	const rootHandoff = fs.readFileSync(path.join(repoRoot, 'HANDOFF'), 'utf8')
	const currentHandoff = fs.readFileSync(path.join(repoRoot, 'docs', 'CURRENT_HANDOFF.md'), 'utf8')

	for (const source of [rootHandoff, currentHandoff]) {
		assert.match(source, /PROJECT LAUNCHERS FIRST/)
		assert.match(source, /UPDATE\.bat/)
		assert.match(source, /UPDATE_AND_RUN\.bat/)
		assert.match(source, /RUN\.bat/)
		assert.match(source, /RUN_\*\.cmd|RUN_\*\.cmd` launcher/i)
		assert.match(source, /last resort/i)
	}

	assert.match(rootHandoff, /Do NOT make the user type ad-hoc PowerShell, raw Git commands, Node commands/i)
	assert.match(rootHandoff, /Do not rebuild a second tool\/workflow for behavior already present in the repository/i)
})
