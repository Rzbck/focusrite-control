# GitHub workflow

This repository adopts the branch/update safety pattern used successfully in the ContAIners Signal project.

## 1. Branch roles

- `main`: latest testable integration baseline.
- `backup/...`: immutable human/checkpoint references before risky work.
- `debug/...`: protocol experiments and diagnostics.
- `agent/...`: bounded implementation work when useful.

`main` being testable does not mean official Bitfocus release-ready.

## 2. Before a risky change

1. fetch the exact current `main` HEAD;
2. verify tests and current project state;
3. create a `backup/...` branch on that exact SHA;
4. create a `debug/...` or `agent/...` branch from the same SHA;
5. change only necessary files;
6. run tests/CI;
7. inspect the diff;
8. promote without force-push.

## 3. Windows update launchers

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

## 4. Validation before promotion

At minimum:

```text
yarn check-format
yarn lint
yarn check
yarn test
yarn companion-module-build
```

For hardware-relevant changes, CI is not enough. Keep hardware-tested vs implemented vs research-only distinct.

## 5. Public/privacy rule

Never commit raw private captures, real serials/hostnames/client IDs, user-specific paths or TestBench session logs. Keep only sanitized summaries and synthetic fixtures.

## 6. Official Bitfocus repo

This repository is the development workspace. Once Bitfocus creates/chooses the official module repository, inspect its exact seed/default branch/permissions and use its expected workflow rather than blindly mirroring this repository.
