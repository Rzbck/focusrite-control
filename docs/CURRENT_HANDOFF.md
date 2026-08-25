# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 08:14+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_TOPOLOGY_MATERIALISE_PRETTIER_FIXED_REVALIDATION_PENDING`
Canonical production candidate: audited **0.1.16**
Research 0.1.17: software validated, packaged, real hardware exercised.
Research 0.1.18 module/package checkpoint: **SOFTWARE VALIDATED / PACKAGED / LOADED ON EXISTING AUTHORISED CONNECTION** at `d6df45c59ab825e1ebccae90d98212b561449feb`.
Current TestBench changes after that checkpoint: **SOURCE_IMPLEMENTED / USER-HOST REVALIDATION PENDING**.

## Mandatory resume rules

When the user says `HANDOFF`, inspect live remote branch movement repo-wide, resolve the current objective branch HEAD, inspect newer material commits/diff, then read live root `HANDOFF`, this file, `AI_PROJECT_RULES.md`, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence.

Keep evidence levels separate: OFFICIAL PRODUCT BEHAVIOUR / SCHEMA_PRESENT / SESSION_STATE_OBSERVED / IMPLEMENTED / HARDWARE_WRITE_CONFIRMED / HARDWARE_DYNAMIC_CLOSED. `UNKNOWN`, `BASELINE_UNKNOWN`, sparse cache or `neverObserved` is never unsupported by itself.

Closing a sub-question never closes its parent validation objective. Parent objective remains explicit hardware feedback closure while `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved` or otherwise open rows remain.

Project launchers first: `UPDATE.bat`, `UPDATE_AND_RUN.bat`, `RUN.bat`, exact `testbench\RUN_*.cmd`. Manual shell only if a launcher is itself blocked.

Reuse the existing Focusrite Companion connection. Remote Devices must show the same `Companion Scarlett 18i20` client approved before any write. Do not create another direct client or copy its private identity.

## Retained 0.1.18 green module/package gate

User-host `UPDATE_AND_RUN.bat` completed at code HEAD `d6df45c59ab8`:

- Node 22.23.2 / Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **225/225 PASS**;
- package build PASS: `focusrite-scarlett-18i20-0.1.18.tgz`;
- launcher did not install/activate it and performed no hardware write.

The operator then imported/selected 0.1.18 on the **existing** authorised Companion connection and kept the mixer diagnostic variables enabled.

## Latest 0.1.18 targeted run — safe pre-write stop

`RUN_MIX_FEEDBACK_CLOSURE.cmd` result:

- targeted self-check **58/58 PASS**;
- local Companion / exact Scarlett 18i20 Gen3 / Remote Devices authorization PASS;
- recognized stale Page 2 -> PAGE2_AUTO PASS -> fresh read-only preflight PASS -> current Capability Lab Page 2 PASS;
- user confirmed `MIX_FEEDBACK` and `ALL_ISOLATED`;
- hardware stage then stopped before first write:
  `Playback sources are present, but none has an exact materialised Mix gain/mute/solo baseline; no write attempted.`
- no Mix Mute/Solo write;
- no topology write;
- no hardware restore failure;
- this is a session/cache blocker, not a capability verdict.

The operator noted YouTube/audio playback was running. It is **not the cause of this blocker** because selection requires server-confirmed Mix gain/mute/solo state rather than meter/audio level, and no hardware write was attempted. Future hardware run should pause YouTube/DAW as a safety/convenience precaution because Mute/Solo/topology transitions can audibly interrupt/recombine a live signal.

## Diagnosis — ordering defect in TestBench autonomy

After loading/restarting 0.1.18, the current client session no longer had the exact Mix tuples previously materialised under 0.1.17. `MixFeedbackClosureRunner.js` still chose a Playback target by requiring an exact Mix tuple **before** its autonomous topology phase. Therefore zero exact lanes prevented the topology operation that might itself materialise server state.

Do not ask the operator to manually click Mute/Solo again and do not rerun the unchanged launcher.

## TestBench-only fix implemented

No module `src/` file changed after the validated/package checkpoint `d6df45c...`.

New `testbench/MixTopologyMaterialize.js` is integrated into the existing `RUN_MIX_FEEDBACK_CLOSURE.cmd` workflow after `MIX_FEEDBACK` + `ALL_ISOLATED` and before the existing closure runner.

Safety contract:

- direct invocation requires explicit `--allow-topology-materialize`;
- if an exact Mix baseline already exists, exits without hardware write;
- otherwise preserves the previous Playback target if live, or requires one unique adjacent confirmed-mono Playback pair;
- writes exactly two `mixer_slot_stereo` ON actions in one Companion button and exactly two OFF restore actions;
- no Mix gain/Mute/Solo, mixer-slot source, output routing, raw, Monitor gain or direct TCP write;
- exact mono/source baseline checked before write;
- transition mono->stereo observed server-side; source/name collateral observed but never written;
- exact original mono + source state required after restore;
- Page 2 restored before fresh snapshot;
- fresh exact Mix coverage checked on both pair members;
- only if coverage appears does launcher continue to the existing Mix closure runner;
- no coverage / nonactionable topology => `NO-OP SAFE` and no further Mix write;
- unconfirmed topology/source restore => HARD ABORT.

New regression: `test/mix-topology-materialize.test.js` covers prior-target continuity without Mix baseline, ambiguity fail-closed, paired stereo-only action plan, no broader write family/direct protocol path, and launcher order after isolation confirmation.

The launcher now syntax-checks this helper and includes the new test in targeted self-check. It also explicitly asks the operator to pause YouTube/DAW playback if possible.

Because this helper/launcher/test was added after the last green gate, the current TestBench source is **not yet revalidated on the user host**. Do not run hardware until the normal software gate is green again.

## Latest TestBench revalidation attempt

User-host `UPDATE_AND_RUN.bat` at source HEAD `f5f1709bcfec`:

- immutable dependencies PASS;
- Prettier stopped at step 2/6 on exactly two files: `test/mix-topology-materialize.test.js` and `testbench/MixTopologyMaterialize.js`;
- ESLint, source manifest, Node tests and package build were NOT RUN;
- no hardware write and no automatic Git promotion occurred.

The exact Prettier diagnostic transformations were applied only as formatting changes. Resulting blob SHAs match the expected diagnostic blobs: test `c56449ca6ee2...`, runner `67e66f939470...`. Compare from `f5f1709...` to the format-fix code HEAD showed only those two files, with +4/-1 and +2/-1 respectively; no functional TestBench logic changed in the formatting pass.

A fresh complete `UPDATE_AND_RUN.bat` remains mandatory before hardware.

## Retained hardware evidence

Latest strong automated Mix closure from 0.1.17 / Playback slot 3 Playback 1 stereo:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false -> true -> false, server variable + rendered feedback + exact restore.
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same.
- Mix A Right Mute direct stereo write: no transition, exact restore.
- Mix A Right Solo direct stereo write: no transition, exact restore.
- Mix B-F: 20 `SKIP_BASELINE_UNKNOWN`.
- restore quarantine 0; hardware restore YES; Page 2 restore YES.

Do not infer that Right is globally pair-owned/unwritable/unsupported from that stereo-only result.

UI evidence shows mono/stereo presentation is runtime-configurable. Current known operator state remains **Playback 1 + Playback 2 mono** unless a newer live read says otherwise. Old single-item mixer-slot stereo no-effect evidence does not prove capability absence. `mixer_slot_stereo` and `mixer_slot_source` remain **RESEARCH_OPEN / EVAL_ONLY**; public/raw writes remain withheld.

## Current status

- `mix_mute`: PARTIAL.
- `mix_solo`: PARTIAL.
- `mixer_slot_stereo`: RESEARCH_OPEN, grouped pair semantics pending hardware.
- `mixer_slot_source`: RESEARCH_OPEN, no source write exposed/attempted.
- parent matrix remains 31 definitions / 829 instances; publication is not the current objective.

## Exact next action

1. Keep the existing 0.1.18 Companion connection/version selected. Do not recreate it and do not manually change mono/stereo/Mute/Solo.
2. Run `UPDATE_AND_RUN.bat`, choose the current `testbench/meter-routing-exact-restore` branch. Required: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, all Node tests PASS, package build PASS.
3. This revalidates the **new TestBench-only** code after the exact Prettier fixes. If green, no package re-import is required solely for this change because no module `src/` file changed after `d6df45c...`.
4. Pause YouTube/DAW playback; keep Monitor/speakers/headphones physically safe.
5. Run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
6. Use PAGE2_AUTO only when positively recognized; then confirm `MIX_FEEDBACK`, `ALL_ISOLATED`, and touch nothing in Focusrite Control.
7. Capture the complete bootstrap + closure output. `NO-OP SAFE` after exact restore is research evidence; do not repeat blindly.

## Permanent safety

Scarlett 18i20 (3rd Gen) only. Monitor gain item 1677 read-only. No invented input preamp gain, direct per-input mute, per-channel phantom, Mic Kill or physical Monitor level write. Dynamic server port/device ID only. Feedback/state server-confirmed only. No unsafe raw, firmware/reset/restore/snapshot or meter/status writes. No write to explicit UNKNOWN output availability. No Focusrite software/firmware update or unrelated routing change without explicit agreement. Preserve privacy and attribution.
