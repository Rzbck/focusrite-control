# Git / branch workflow

This repository uses a branch/update safety pattern that keeps local Windows testing reviewable and avoids destructive automation.

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

`RUN.bat` executes the current branch validation task. Debug branches may use bounded branch-specific diagnostics.

If Bitfocus later creates the official module repository and requires its own reusable CI, follow the maintainers' workflow in that official repository. Keep this personal repo's no-Actions policy unless the user explicitly changes it.

## 2. Branch roles

- `main`: latest testable integration baseline + current project documentation;
- `backup/...`: immutable human/checkpoint references before risky work;
- `rc/...`: release-hardening candidates that must pass the full local gate before promotion;
- `debug/...`: bounded protocol experiments and diagnostics;
- `agent/...`: bounded implementation work when useful;
- `diagnostics/readback-results`: sanitized machine-generated diagnostic/status results only.

`main` being testable does not mean official Bitfocus release-ready.

Current fixed checkpoint:

`backup/v0.1.12-user-loaded-20260820`

Current validated release-hardening branch:

`rc/v0.1.13-state-contract`

Do not move an existing backup branch merely because `main` documentation advances later.

## 3. Before a risky change

1. fetch the exact current `main` HEAD;
2. read `AI_PROJECT_RULES.md`, handoff and project state;
3. verify local tests and current evidence;
4. confirm an appropriate immutable `backup/...` exists;
5. create/use a `debug/...`, `agent/...` or `rc/...` branch as appropriate;
6. change only necessary files;
7. run local validation;
8. inspect the diff/privacy/safety regressions;
9. promote through a reviewable branch/PR without force-pushing `main`.

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

`RUN.bat` performs validation/package work only. It must not install/update Focusrite software, firmware or drivers and must not perform hardware writes unless a branch-specific hardware test was explicitly designed and approved for that purpose.

## 5. Promotion rules

Before moving a debug/agent/RC result into `main`:

- local automated validation must pass;
- privacy scan must be clean;
- forbidden-feature regression checks must pass;
- hardware-relevant behavior changes require explicit hardware evidence;
- distinguish hardware-tested / implemented / schema-observed / research-only / unsupported;
- incomplete cold-start readback must follow `STATE_CONTRACT.md` rather than guessed defaults, write-to-warm behavior or timing loops;
- Monitor gain item `1677` must remain read-only;
- promotion should be reviewable and should not carry temporary diagnostic/repair history into `main` when a clean squash/PR is available.

The v0.1.13 state-contract RC passed the automated gate with **31/31 tests**, lint, manifest and package build clean. Because production control behavior was unchanged by the contract hardening, existing real-hardware evidence remains applicable and broad hardware cycling is not repeated for version churn alone.

## 6. Public/privacy rule

Never commit raw private captures, real serials/hostnames/client IDs/client keys/device IDs, user-specific paths or TestBench session logs. Keep only sanitized summaries and synthetic fixtures.

Automatic diagnostic/status publication must use a fixed sanitized schema, rejection tests and remote verification. Never upload raw logs merely because a validator failed.

## 7. Official Bitfocus repo

This repository is the development workspace. Once Bitfocus creates/chooses the official module repository, inspect its exact name, seed, default branch and permissions and use its expected contribution workflow rather than blindly mirroring this repository.

The official repo may require Bitfocus CI even though this personal development repository intentionally does not use GitHub Actions.
