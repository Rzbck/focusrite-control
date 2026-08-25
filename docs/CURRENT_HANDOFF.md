# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 09:46+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_TOPOLOGY_PLAYBACK1_RUNTIME_ANCHOR_REVALIDATION_PENDING`
Canonical production candidate: audited **0.1.16**
Research 0.1.17: software validated, packaged, real hardware exercised.
Research 0.1.18 module/package checkpoint: **SOFTWARE VALIDATED / PACKAGED / LOADED ON EXISTING AUTHORISED CONNECTION** at `d6df45c59ab825e1ebccae90d98212b561449feb`.
Current TestBench changes after that checkpoint: **SOURCE_IMPLEMENTED / USER-HOST REVALIDATION PENDING**.

## MANDATORY STARTUP FRESHNESS GATE — REPO-WIDE RECENCY FIRST

When the user says `HANDOFF`, inspect remote branch movement across the repository, not only `main`. Identify the newest MATERIAL movements by commit time, choose the objective-owning branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, then read live root `HANDOFF`, this file, `AI_PROJECT_RULES.md`, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence. Reconcile any newer completed user/hardware result before choosing work.

A document timestamp or embedded SHA is a checkpoint only. It never replaces live Git verification.

Keep evidence levels separate: OFFICIAL PRODUCT BEHAVIOUR / SCHEMA_PRESENT / SESSION_STATE_OBSERVED / IMPLEMENTED / HARDWARE_WRITE_CONFIRMED / HARDWARE_DYNAMIC_CLOSED. `UNKNOWN`, `BASELINE_UNKNOWN`, sparse cache or `neverObserved` is never unsupported by itself.

## PROJECT LAUNCHERS FIRST

- `UPDATE.bat` for normal sync.
- `UPDATE_AND_RUN.bat` for update + normal software gate.
- `RUN.bat` when already current.
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Manual Git/PowerShell/Node is last resort only when a normal launcher is itself blocked or cannot expose the required diagnostic.

## Objective continuity

Closing a sub-question never closes its parent validation objective. Parent objective remains explicit hardware feedback closure while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised or otherwise open rows remain. Tooling/documentation may interrupt only when it is a direct blocker for the next safe validation step. Once that direct blocker is removed, return to the parent hardware objective. Before any objective change, account for remaining open matrix rows. objective change is forbidden while relevant remaining open matrix rows exist unless the user explicitly changes the project objective.

## Remote Devices authorization — mandatory before any write

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Always reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- Missing approval is `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware-control failure.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.
- See `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

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

## Prior 0.1.18 targeted run — safe pre-write stop

`RUN_MIX_FEEDBACK_CLOSURE.cmd` initially stopped before first write because no exact Mix gain/mute/solo tuple was materialised after the 0.1.18 reload. That was a session/cache blocker, not a capability verdict. The TestBench-only ordering fix added `MixTopologyMaterialize.js` before the closure runner. Do not ask the operator to manually click Mute/Solo again.

## TestBench-only materialisation safety contract

No module `src/` file changed after the validated/package checkpoint `d6df45c...`.

`testbench/MixTopologyMaterialize.js` is integrated into the existing `RUN_MIX_FEEDBACK_CLOSURE.cmd` workflow after `MIX_FEEDBACK` + `ALL_ISOLATED` and before the existing closure runner.

Safety contract:

- direct invocation requires explicit `--allow-topology-materialize`;
- if an exact Mix baseline already exists, exits without hardware write;
- otherwise resolves one exact runtime Playback pair target or stops without write;
- writes exactly two `mixer_slot_stereo` ON actions and exactly two OFF restore actions;
- no Mix gain/Mute/Solo, mixer-slot source, output routing, raw, Monitor gain or direct TCP write in the bootstrap;
- exact mono/source baseline checked before write;
- mono→stereo transition observed server-side; source/name collateral observed but never written;
- exact original mono + source state required after restore;
- Page 2 restored before a fresh snapshot;
- fresh exact Mix coverage checked after restore;
- only if coverage appears does the launcher continue to the existing Mix closure runner;
- no coverage / nonactionable topology => `NO-OP SAFE` and no further Mix write;
- unconfirmed topology/source restore => HARD ABORT.

## Latest full software gate — GREEN

User-host `UPDATE_AND_RUN.bat` at source HEAD `e0a477d401b2` completed fully:

- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **230/230 PASS**;
- package build PASS: `focusrite-scarlett-18i20-0.1.18.tgz`;
- no hardware write occurred during the gate.

This validates the TestBench state that existed at `e0a477d...`. The loaded 0.1.18 module did not require re-import because the relevant later changes were TestBench/docs only.

## Latest Mix hardware attempt — NO-OP SAFE before write

Immediately after the green gate, `RUN_MIX_FEEDBACK_CLOSURE.cmd` ran with 0.1.18 selected:

- targeted self-check **63/63 PASS**;
- exact Scarlett 18i20 Gen3 / Companion connection / Remote Devices authorization PASS;
- Page 2 already current: **768** audited controls, no mutation required;
- user confirmed `MIX_FEEDBACK` and `ALL_ISOLATED`;
- bootstrap stopped with `No unique adjacent confirmed-mono Playback pair is available for autonomous materialisation.`;
- hardware writes: **0**;
- no Page 2 mutation in the bootstrap;
- no restore incident;
- no Mix Mute/Solo phase executed.

Interpretation: multiple confirmed-mono Playback pairs were live and the bootstrap had lost the historical target hint because `loadPriorPlaybackHint()` depended only on the local `LATEST_MIX_FEEDBACK_CLOSURE.json`. This is a TestBench target-selection blocker, not hardware evidence about mono/stereo writability.

## Target-selection fix implemented after the green checkpoint

`MixTopologyMaterialize.js` now resolves the bootstrap target in this order:

1. previous explicit sanitized closure target if still live;
2. otherwise a **unique runtime `Playback 1`** candidate with its adjacent runtime `Playback 2` mate, both server-confirmed mono;
3. otherwise one unique adjacent mono Playback pair;
4. otherwise STOP / no write.

The `Playback 1` anchor is a campaign target, not a hardware slot rule: no slot number is hardcoded. Duplicate `Playback 1` candidates remain ambiguous and fail closed. New regressions verify selection with multiple mono pairs and rejection of duplicated runtime anchors.

These latest TestBench/test changes are SOURCE_IMPLEMENTED but **USER-HOST REVALIDATION PENDING**. Do not run hardware until `UPDATE_AND_RUN.bat` is green again.

## Retained hardware evidence

Latest strong automated Mix closure from 0.1.17 / Playback slot 3 Playback 1 stereo:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false, server variable + rendered feedback + exact restore.
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same.
- Mix A Right Mute direct stereo write: no transition, exact restore.
- Mix A Right Solo direct stereo write: no transition, exact restore.
- Mix B-F: 20 `SKIP_BASELINE_UNKNOWN`.
- restore quarantine 0; hardware restore YES; Page 2 restore YES.

Do not infer that Right is globally pair-owned/unwritable/unsupported from that stereo-only result.

UI evidence shows mono/stereo presentation is runtime-configurable. Current known operator state remains **Playback 1 + Playback 2 mono** unless newer live evidence says otherwise. Old single-item mixer-slot stereo no-effect evidence does not prove capability absence. `mixer_slot_stereo` and `mixer_slot_source` remain **RESEARCH_OPEN / EVAL_ONLY**; public/raw writes remain withheld.

## Current status

- `mix_mute`: PARTIAL.
- `mix_solo`: PARTIAL.
- `mixer_slot_stereo`: RESEARCH_OPEN, grouped pair semantics pending hardware.
- `mixer_slot_source`: RESEARCH_OPEN, no source write exposed/attempted.
- parent matrix remains 31 definitions / 829 instances; publication is not the current objective.

## Exact next action

1. Keep the existing 0.1.18 Companion connection/version selected. Do not recreate it and do not manually change mono/stereo/Mute/Solo.
2. Run `UPDATE_AND_RUN.bat`, choose the current `testbench/meter-routing-exact-restore` branch. Required: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, all Node tests PASS, package build PASS.
3. If green, no package re-import is required solely for these TestBench/docs changes because no module `src/` file changed after `d6df45c...`.
4. Pause YouTube/DAW playback; keep Monitor/speakers/headphones physically safe.
5. Run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
6. Use PAGE2_AUTO only when positively recognized; then confirm `MIX_FEEDBACK`, `ALL_ISOLATED`, and touch nothing in Focusrite Control.
7. Capture the complete bootstrap + closure output. `NO-OP SAFE` after exact restore is research evidence; do not repeat blindly.

## Permanent safety

Scarlett 18i20 (3rd Gen) only. Monitor gain item 1677 read-only. No invented input preamp gain, direct per-input mute, per-channel phantom, Mic Kill or physical Monitor level write. Dynamic server port/device ID only. Feedback/state server-confirmed only. No unsafe raw writes, firmware/reset/restore/snapshot commands, or meter/status writes. No write to explicit UNKNOWN output availability. No Focusrite software/firmware update or unrelated routing change without explicit agreement. Preserve privacy and attribution.
