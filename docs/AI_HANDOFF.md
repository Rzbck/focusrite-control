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

Do not change hardware mappings on the debug branch unless new evidence specifically requires it. Start by isolating read-only startup behavior.

## Slack / official publication context

The first repository request was posted in Companion Slack `#module-development` for the 18i20 module. Bryce Seifert suggested `focusrite-control` may be a better scope because the transport is Focusrite Control Server, and offered hardware for future testing.

The project replied that only Scarlett 18i20 (3rd Gen) is validated, and is open to Bitfocus's preferred naming while refusing to claim untested hardware.

The official Bitfocus repository/naming decision is still pending. Stable public target remains `v1.0.0` unless maintainers direct otherwise.

## Immediate next work

On `debug/cold-start-readback`:

1. create a checked-in Node read-only state probe;
2. hard-allowlist outgoing protocol roots to session/read operations only;
3. test the probe parser/framing/allowlist locally;
4. use `tools/RUN_BRANCH.bat` so `UPDATE_AND_RUN.bat` selects and runs the debug task;
5. run the probe on the real Windows host without touching hardware controls;
6. record only sanitized summaries;
7. decide the module change from evidence, not timing guesses.

## Do not do

- do not guess missing booleans as false;
- do not write values to warm the cache;
- do not re-add repeated timed subscriptions without new evidence;
- do not expose Monitor gain 1677 writes;
- do not publish private captures/logs/identifiers;
- do not expand hardware scope beyond Scarlett 18i20 (3rd Gen);
- do not update Focusrite software/firmware/settings without explicit agreement.
