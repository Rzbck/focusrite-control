# Git / branch workflow

This repository adopts the branch/update safety pattern used successfully in the ContAIners Signal project.

## 1. No GitHub Actions in this repository

**Do not use GitHub Actions in `Rzbck/focusrite-control`.**

There should be no `.github/workflows/*` dependency for development validation. Do not add one, wait for one, or use a missing Actions status as a blocker.

Validation in this personal repository is local:

```text
yarn check-format
yarn lint
yarn check
yarn test
yarn companion-module-build
```

`RUN.bat` executes the current branch task. A debug branch may override it with `tools/RUN_BRANCH.bat`.

If Bitfocus later creates the official module repository and requires its own reusable CI, follow the maintainers' workflow in that official repository. Keep this personal repo's no-Actions policy unless the user explicitly changes it.

## 2. Branch roles

- `main`: latest testable integration baseline + current project documentation.
- `backup/...`: immutable human/checkpoint references before risky work.
- `debug/...`: protocol experiments and diagnostics.
- `agent/...`: bounded implementation work when useful.

`main` being testable does not mean official Bitfocus release-ready.

Current fixed checkpoint:

`backup/v0.1.12-user-loaded-20260820`

Current research branch:

`debug/cold-start-readback`

## 3. Before a risky change

1. fetch the exact current `main` HEAD;
2. read `AI_PROJECT_RULES.md`, handoff and project state;
3. verify local tests and current evidence;
4. confirm an appropriate immutable `backup/...` exists;
5. create/use a `debug/...` or `agent/...` branch;
6. change only necessary files;
7. run local validation;
8. inspect the diff/privacy/safety regressions;
9. promote without force-push.

Do not move an existing backup branch merely because `main` documentation advanced later.

## 4. Windows update launchers

`UPDATE.bat` and `UPDATE_AND_RUN.bat` copy themselves to `%TEMP%` before any `git switch` or `git pull`.

Reason: Git may replace a tracked batch file while `cmd.exe` is still reading it. Executing the worker outside the repository prevents resuming inside a different version of the same script.

The updater:

- fetches/prunes remote branches;
- offers a branch menu;
- confirms the remote branch exists;
- stashes dirty/untracked local state before switching;
- uses `git pull --ff-only`;
- never auto-merges;
- never force-resets;
- never auto-applies a stash onto a different branch.

## 5. Promotion rules

Before moving a debug/agent result into `main`:

- local automated validation must pass;
- privacy scan must be clean;
- forbidden-feature regression checks must pass;
- hardware-relevant behavior requires explicit hardware evidence;
- distinguish hardware-tested / implemented / schema-observed / research-only / unsupported;
- cold-start research must not be promoted based on a one-off timing coincidence.

## 6. Public/privacy rule

Never commit raw private captures, real serials/hostnames/client IDs, user-specific paths or TestBench session logs. Keep only sanitized summaries and synthetic fixtures.

## 7. Official Bitfocus repo

This repository is the development workspace. Once Bitfocus creates/chooses the official module repository, inspect its exact name, seed, default branch and permissions and use its expected contribution workflow rather than blindly mirroring this repository.

The official repo may require Bitfocus CI even though this personal development repository intentionally does not use GitHub Actions.
