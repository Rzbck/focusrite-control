# AI / contributor handoff

Updated: 2026-08-21

## Read first

1. `README.md`
2. `AI_PROJECT_RULES.md`
3. `docs/PROJECT_STATE.md`
4. `docs/BITFOCUS_SLACK_AND_RELEASE.md`
5. `docs/GITHUB_WORKFLOW.md`
6. `docs/COLD_START_READBACK.md`
7. current code/tests

Do not start from old chat assumptions when these files exist.

## Project in one sentence

Build a safe Bitfocus Companion module that controls **Scarlett 18i20 (3rd Gen)** through local Focusrite Control Server, then publish it through the official Bitfocus workflow once repository/naming is decided.

The architecture may support other Focusrite Control Server devices later, but no broader hardware support may be claimed without real testing.

## Current checkpoint

Integration baseline: **v0.1.12**.

The Windows build completed successfully with Prettier, ESLint, source-manifest validation, 23/23 Node tests, `companion-module-build`, packaged manifest API 2.0.0 and packaged-entrypoint smoke validation. The built module was loaded in Companion 5.0.3 and reached status `OK`.

A subsequent read-only TestBench state audit blocked with **zero hardware writes** because 18 initial values were unknown: Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. Talkback and Input 1/2 mode were known.

## Important interpretation

Do not reinterpret the missing cold-start values as failed control mappings. A prior guarded physical test completed 21/21 reversible control changes and restorations through Companion / Focusrite Control Server. The unresolved issue is obtaining current values safely after a fresh client process.

## Repository / validation policy

This personal development repository does **not use GitHub Actions**.

Future AI/contributors must not:

- add `.github/workflows/*` here;
- wait for an Actions run/status;
- treat absence of Actions as a failed validation.

Use local `RUN.bat` / Node / Yarn validation and document the actual result. The future official Bitfocus repository may have different maintainer-required CI; follow it there only when it exists.

## Current branches

- `main`: latest testable integration baseline + current docs/policy.
- `backup/v0.1.12-user-loaded-20260820`: immutable v0.1.12 checkpoint confirmed to load and reach `OK`.
- `debug/cold-start-readback`: protocol/readback investigation only.

Do not change hardware mappings on the debug branch unless new evidence specifically requires it.

## Slack / official publication context

The first repository request was posted in Companion Slack `#module-development` for the 18i20 module. Bryce Seifert suggested `focusrite-control` may be a better scope because the transport is Focusrite Control Server, and offered hardware for future testing.

The project replied that only Scarlett 18i20 (3rd Gen) is validated, and is open to Bitfocus's preferred naming while refusing to claim untested hardware.

The official Bitfocus repository/naming decision is still pending. Stable public target remains `v1.0.0` unless maintainers direct otherwise.

## Debug branch status

`debug/cold-start-readback` contains a checked-in Node read-only probe and branch runner.

Implemented files:

- `tools/readback-probe-lib.js`;
- `tools/readonly-state-probe.js`;
- `test/readback-probe.test.js`;
- `tools/RUN_BRANCH.bat`;
- `tools/ENSURE_NODE22.ps1`.

Local validation before pushing the probe tooling:

- probe syntax: pass;
- dedicated probe tests: **6/6 pass**;
- full Node test suite: **29/29 pass**;
- static safety/privacy scan: pass.

The probe has no hardware `<set>` transmit path. TCP sends are allowlisted to `client-details`, `device-subscribe` and `keep-alive`; discovery uses only the exact proven `client-discovery` packet. Missing state is never guessed.

## Windows launcher incidents already fixed

Do not regress these fixes:

1. Root `UPDATE.bat` / `UPDATE_AND_RUN.bat` originally used `cd /d "..." || endlocal & exit /b 1`. In `cmd.exe`, the ungrouped `& exit /b 1` executed even after a successful `cd`, causing an immediate silent close. This is fixed with explicit `cd` + `if errorlevel` blocks.
2. Persistent local logs were added under `.local-logs/`, which is gitignored.
3. The first debug runner used `for /f (...) in ('"%NODE_EXE%" -p ...')`, which `cmd.exe` misparsed as `'node" -p ...'`. This is removed.
4. Node version detection now writes command output to a temporary file instead of using `FOR /F` command substitution.
5. If PATH Node is missing or incompatible with Node 22.20+, the debug runner automatically invokes `tools/ENSURE_NODE22.ps1` and uses the SHA-256-verified portable Node under `.build-tools/node22/`.
6. The debug runner writes `.local-logs/DEBUG_READBACK_latest.txt` before running the real probe.

The root updater/branch switch has already been verified on the real Windows host: fetch, switch from `main` to `debug/cold-start-readback`, tracking setup and `git pull --ff-only` all completed successfully. The next verification point is the corrected debug runner itself.

## Immediate next work

The next step is **real Windows execution**, not more speculative code:

1. while already on `debug/cold-start-readback`, run `UPDATE_AND_RUN.bat` again;
2. choose `[1] Continue on debug/cold-start-readback` (or `[4] DEBUG`);
3. the updated branch should pull the corrected runner;
4. let the runner check/bootstrap Node, run syntax/tests, then execute the read-only probe;
5. do not touch Air/Pad/Mute/Dim/Talkback during the ~25 second real probe;
6. inspect only the sanitized result in `probe-results`;
7. if the runner itself fails, inspect `.local-logs/DEBUG_READBACK_latest.txt` instead of guessing;
8. decide any protocol change only from that evidence.

If no standard subscription lifecycle yields 21/21 current Core values, stop timing/resubscribe experiments and research a separate Focusrite read primitive/state source.

## Do not do

- do not guess missing booleans as false;
- do not write values to warm the cache;
- do not re-add repeated timed subscriptions without new evidence;
- do not expose Monitor gain 1677 writes;
- do not publish private captures/logs/identifiers;
- do not expand hardware scope beyond Scarlett 18i20 (3rd Gen);
- do not update Focusrite software/firmware/settings without explicit agreement.
