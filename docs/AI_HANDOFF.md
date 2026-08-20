# AI / contributor handoff

Updated: 2026-08-20

## Read first

1. `AI_PROJECT_RULES.md`
2. `docs/PROJECT_STATE.md`
3. `docs/GITHUB_WORKFLOW.md`
4. `docs/COLD_START_READBACK.md`
5. current code/tests

## Current checkpoint

Integration baseline: **v0.1.12**.

The Windows build completed successfully with Prettier, ESLint, source-manifest validation, 23/23 Node tests, `companion-module-build`, packaged manifest API 2.0.0 and packaged-entrypoint smoke validation. The built module was loaded in Companion 5.0.3 and reached status `OK`.

A subsequent read-only TestBench state audit blocked with **zero hardware writes** because 18 initial values were unknown: Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. Talkback and Input 1/2 mode were known.

## Important interpretation

Do not reinterpret the missing cold-start values as failed control mappings. A prior guarded physical test completed 21/21 reversible control changes and restorations through Companion / Focusrite Control Server. The unresolved issue is obtaining current values safely after a fresh client process.

## Current branch plan

- `main`: frozen/testable v0.1.12 integration baseline with the known readback limitation documented.
- `backup/v0.1.12-user-loaded-20260820`: immutable checkpoint on the same baseline.
- `debug/cold-start-readback`: protocol/readback investigation only.

Do not change hardware mappings on the debug branch unless new evidence specifically requires it. Start by isolating the read-only startup behavior.

## Do not do

- do not guess missing booleans as false;
- do not write values to warm the cache;
- do not re-add repeated timed subscriptions without new evidence;
- do not expose Monitor gain 1677 writes;
- do not publish private captures/logs/identifiers;
- do not expand hardware scope beyond Scarlett 18i20 (3rd Gen).
