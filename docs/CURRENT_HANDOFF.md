# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 10:50+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_RUNTIME_PAIRING_PLUS_OUTPUT_ROUTING_FALLBACK_FIVE_TEST_FIXES_APPLIED_FULL_GATE_PENDING`
Canonical production candidate: audited **0.1.16**
Research 0.1.17: software validated, packaged, real hardware exercised.
Research 0.1.18 module/package checkpoint: **SOFTWARE VALIDATED / PACKAGED / LOADED ON EXISTING AUTHORISED CONNECTION** at `d6df45c59ab825e1ebccae90d98212b561449feb`.
Current TestBench changes after that checkpoint: **SOURCE_IMPLEMENTED / USER-HOST SOFTWARE-GATE PENDING / HARDWARE PENDING**.

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
- Do NOT make the user type ad-hoc PowerShell, raw Git commands, Node commands when the normal launcher workflow can do the work.

## Objective continuity

Closing a sub-question never closes its parent validation objective. Parent objective remains explicit hardware feedback closure while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised or otherwise open rows remain. Publication is not the current objective.

Tooling/documentation work may interrupt hardware only for a direct blocker. Once that direct blocker is removed, return to the parent hardware objective. Before changing objectives, account for remaining open matrix rows; objective change is forbidden while relevant open rows remain unless the user explicitly changes the objective.

## Remote Devices authorization — mandatory before any write

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- Missing approval is `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware-control failure.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.
- See `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

## Retained 0.1.18 module/package gate

User-host `UPDATE_AND_RUN.bat` completed at module checkpoint `d6df45c59ab8` with Node/Yarn/dependencies/Prettier/ESLint/source manifest/tests/package build green. The operator imported/selected research 0.1.18 on the EXISTING authorised Companion connection and kept the diagnostic mixer variables enabled.

A later full user-host gate at source HEAD `e0a477d401b2` was also green: dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, Node tests **230/230 PASS**, package build PASS. No hardware write occurred during that gate.

The newest TestBench/test changes described below were implemented **after** that green checkpoint and therefore need one fresh normal user-host `UPDATE_AND_RUN.bat` before hardware.

## Latest Mix hardware attempt — safe pre-write stop

After the green `e0a477d...` gate, `RUN_MIX_FEEDBACK_CLOSURE.cmd` ran with 0.1.18 selected:

- targeted self-check **63/63 PASS**;
- exact Scarlett 18i20 Gen3 / existing Companion connection / Remote Devices authorization PASS;
- Page 2 current with **768** audited controls;
- user confirmed `MIX_FEEDBACK` and `ALL_ISOLATED`;
- bootstrap stopped with `No unique adjacent confirmed-mono Playback pair is available for autonomous materialisation.`;
- hardware writes **0**;
- no topology write;
- no Mix Mute/Solo write;
- no restore incident.

### Correct interpretation

The TestBench still imposed an obsolete assumption that paired Playback channels must occupy adjacent mixer-slot numbers. The safe stop means **zero candidates satisfied that old slot-adjacency requirement**. It does **not** prove that mono/stereo is unwritable and does **not** prove that multiple live mono pairs were ambiguous.

Playback pairing must be derived from the runtime source identity — e.g. `Playback 1` ↔ `Playback 2` — not from mixer-slot arithmetic.

## Runtime Playback-channel pairing fix

`MixFeedbackClosureRunner.js` and `MixTopologyMaterialize.js` now pair Playback channels by canonical runtime names even when their mixer-slot numbers are nonadjacent.

Safety contract:

- source/name/stereo is read live for each mixer slot;
- unique `Playback N` identities are required;
- partner is the canonical odd/even Playback channel, independent of slot number;
- both members require distinct slots, non-zero source IDs and server-confirmed topology state;
- duplicate/ambiguous identities fail closed before write, before prior-hint reuse or generic fallback;
- diagnostics are sanitized to slot/name/mono|stereo and never print raw source IDs;
- paired topology actions remain only `mixer_slot_stereo` explicit ON/OFF through the existing authorised Companion connection;
- source/name is collateral state only and is never written;
- exact original source/topology restore remains mandatory;
- no raw/direct TCP helper exists.

Regression tests cover nonadjacent slots and ambiguity refusal.

## Existing Companion output-pair routing path verified and reused

The module already contains `output_pair_source` (`Output: Route stereo pair`). For a paired destination it can accept a paired source, including Mix L/R, and writes both output members using the source pair relationship. The Scarlett 18i20 hardware policy contains a dedicated pair-aware guard, separate from unsafe direct right-member source writes.

The V8 TestBench already contains pair `SRC TEST`, alternate, `SRC NONE`, and `SRC REST` buttons plus an exact pair restore helper. This is existing project capability, not a newly invented raw protocol write.

## New second materialisation path: output-pair routing fallback

`testbench/MixOutputRoutingMaterialize.js` is now called by the **same** `RUN_MIX_FEEDBACK_CLOSURE.cmd` only when the topology bootstrap returns `NO-OP SAFE`.

Purpose: try one different already-validated Companion mechanism that may cause Focusrite Control Server to materialise the missing Mix state before declaring the session nonactionable.

Safety contract:

- finds one unique server-observed `Mix A L` source; raw source ID is never persisted in the sanitized report;
- excludes Monitor Outputs **1-2** from automatic routing fallback;
- prioritizes Line Outputs **3-4** only if both members are `AVAILABLE` or have no availability flag, both original source values are exact, and the existing V8 restore path is present;
- otherwise searches another eligible non-Monitor pair;
- explicit `UNKNOWN` or `UNAVAILABLE` availability receives no write;
- display source names are diagnostic only, not an artificial restore prerequisite;
- writes exactly one temporary `output_pair_source` Companion action to route that pair to Mix A;
- requires server-confirmed Mix A L/R destination state;
- ALWAYS calls the existing V8 exact pair restore helper before a fresh snapshot or closure continuation;
- exact left/right original source values must return server-side;
- unconfirmed hardware restore = HARD ABORT;
- Page 2 restore not confirmed = stop;
- after exact restore, a fresh snapshot checks exact Mix baseline coverage for the runtime Playback pair;
- exact baseline appears → launcher continues to Mix closure;
- no baseline → `NO-OP SAFE`; do not repeat blindly.

This fallback does **not** write mixer-slot source, Mix gain, Mix Mute/Solo, direct single-channel `output_source`, raw items, Monitor gain, firmware/reset/restore/snapshot, or use a direct TCP client.

## Targeted launcher contract now

`RUN_MIX_FEEDBACK_CLOSURE.cmd` flow is:

1. targeted syntax/tests, read-only preflight and Page 2 preparation;
2. explicit `MIX_FEEDBACK` + `ALL_ISOLATED` confirmation;
3. `MixTopologyMaterialize.js` — runtime Playback-channel pair topology materialisation + exact restore;
4. if code 8 only: `MixOutputRoutingMaterialize.js` — non-Monitor output-pair route to Mix A + exact restore;
5. only if an exact baseline is available: `MixFeedbackClosureRunner.js` for Mute/Solo and guarded topology differential.

Any restore code 4 stops the entire chain. Two materialisation paths both returning no actionable exact baseline produce one final `NO-OP SAFE` rather than repeated writes.

The launcher now syntax-checks `MixOutputRoutingMaterialize.js` and includes `test/mix-output-routing-materialize.test.js`. Regressions cover:

- Playback 1/2 on nonadjacent mixer slots;
- ambiguity fail-closed;
- sanitized Playback diagnostics;
- Line 3-4 priority;
- Monitor 1-2 exclusion;
- UNKNOWN availability no-write;
- exact source baseline requirement;
- one temporary `output_pair_source` action;
- forbidden mixer-slot source/Mix gain/raw/Monitor gain/direct-protocol escape paths.

## Latest user-host revalidation attempt — 234/239 tests, fixes applied, full gate pending

At source HEAD `869dcfd8a74b`, `UPDATE_AND_RUN.bat` completed dependencies PASS, Prettier PASS, ESLint PASS and source manifest PASS. Node tests completed **234/239 PASS / 5 FAIL**. Package build did not run. No hardware write occurred.

Four failures were documentation/handoff contract regressions from shortened wording. The missing canonical contracts are restored: parent-objective continuity/no-premature-closure language, the normal-project-launcher rule, the `docs/REMOTE_DEVICES_AUTHORIZATION.md` reference, and the exact `Never reuse/copy the Companion private client key into another process` isolation rule.

The fifth failure was functional TestBench logic: duplicated runtime Playback channel identities did not throw because the campaign-specific Playback 1/2 anchor became unavailable and the generic fallback could still select another unique pair. `MixTopologyMaterialize.js` now checks all usable canonical `Playback N` identities for duplicates first and fails closed before prior-hint reuse or fallback selection. Source fix commit: `8015bf11a212...`.

These corrections are SOURCE_IMPLEMENTED only. A fresh complete `UPDATE_AND_RUN.bat` must prove Prettier, ESLint, manifest, all Node tests and package build before hardware.

## Retained strong hardware evidence

Latest strong automated Mix closure from 0.1.17 / Playback slot 3 Playback 1 under the then-tested stereo topology:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false, server variable + rendered feedback + exact restore.
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same.
- Mix A Right Mute direct stereo write: no transition, exact restore.
- Mix A Right Solo direct stereo write: no transition, exact restore.
- Mix B-F: 20 `SKIP_BASELINE_UNKNOWN`.
- restore quarantine 0; hardware restore YES; Page 2 restore YES.

Do not infer Right is globally pair-owned/unwritable/unsupported from that stereo-only result.

UI evidence proves mono/stereo presentation is runtime-configurable. Current known operator state remains **Playback 1 + Playback 2 mono** unless newer live evidence says otherwise. Old single-item mixer-slot stereo/source no-effect evidence is narrowed to those tested single-item writes only. `mixer_slot_stereo` and `mixer_slot_source` remain **RESEARCH_OPEN / EVAL_ONLY**; public/raw writes remain withheld.

## Current status

- `mix_mute`: PARTIAL.
- `mix_solo`: PARTIAL.
- `mixer_slot_stereo`: RESEARCH_OPEN, runtime channel-pair/group semantics pending hardware.
- `mixer_slot_source`: RESEARCH_OPEN, no source write exposed/attempted.
- `output_pair_source`: existing pair-aware hardware path; new use as a Mix-state materialisation fallback is IMPLEMENTED but hardware pending.
- parent matrix remains 31 definitions / 829 instances; publication is not the current objective.

## Exact next action

1. Keep existing 0.1.18 selected on the existing authorised Companion connection. Do not recreate it and do not manually change mono/stereo/Mute/Solo/faders/routing.
2. Run `UPDATE_AND_RUN.bat`, stay on `testbench/meter-routing-exact-restore`.
3. Required: dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, **all** Node tests PASS, package build PASS.
4. If green, do **not** re-import 0.1.18 solely for these latest changes because no module `src/` file changed after the validated 0.1.18 module/package checkpoint.
5. Pause YouTube/DAW playback; keep physical Monitor/speakers/headphones safe.
6. Run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
7. Use PAGE2_AUTO only when positively recognized.
8. Confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`; touch nothing in Focusrite Control afterward.
9. Paste the complete output including topology bootstrap, possible output-routing fallback, restore lines and closure summary.
10. Any restore quarantine/HARD ABORT means stop all further hardware testing until diagnosed. A final two-path `NO-OP SAFE` is useful research evidence and must not be repeated blindly.

## Permanent safety

Scarlett 18i20 (3rd Gen) only. Monitor gain item 1677 read-only. No invented input preamp gain, direct per-input mute, per-channel phantom, Mic Kill or physical Monitor level write. Dynamic server port/device ID only. Feedback/state server-confirmed only. No unsafe raw writes, firmware/reset/restore/snapshot commands, or meter/status writes. No write to explicit UNKNOWN output availability. No Focusrite software/firmware update or unrelated routing change without explicit agreement. Preserve privacy and attribution.
