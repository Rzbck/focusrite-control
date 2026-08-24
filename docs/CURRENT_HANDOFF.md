# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 20:42+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_OUTPUT_TO_INTERNAL_MIX_MAPPING_READONLY_PENDING`
Canonical production candidate: exact audited **0.1.16**
Research/readback build: **0.1.17 — SOFTWARE VALIDATED, PACKAGED, LOADED ON EXISTING AUTHORISED COMPANION CONNECTION, REAL-SESSION PROVENANCE OBSERVED**

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, identify the newest MATERIAL movements by commit time, choose the objective branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, read root `HANDOFF`, `AI_PROJECT_RULES.md`, this file, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, and `docs/COLD_START_READBACK.md`, reconcile any newer completed user/hardware result, then choose the next action.

A document timestamp or embedded SHA is a checkpoint only.

## MANDATORY EVIDENCE / INFERENCE GATE

Keep separate:
1. **OFFICIAL PRODUCT BEHAVIOUR**;
2. **SCHEMA_PRESENT**;
3. **SESSION_STATE_OBSERVED**;
4. **IMPLEMENTED**;
5. **HARDWARE_WRITE_CONFIRMED**;
6. **HARDWARE_DYNAMIC_CLOSED**.

`UNKNOWN`, blank, missing cache state, `BASELINE_UNKNOWN` or `SKIP_BASELINE_UNKNOWN` means only **not observed in this client session** unless stronger evidence proves more. It is not proof of schema absence, `false`, unsupported hardware or permanent non-actionability.

If older physical/session evidence contradicts current cache coverage, keep the question **READBACK/MATERIALISATION RESEARCH OPEN** until reconciled.

A reversible hardware test must require only state genuinely necessary for exact restoration of the property being changed. Do not impose unrelated prerequisite tuples merely because an older harness grouped them.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST

- `UPDATE.bat` for normal sync.
- `UPDATE_AND_RUN.bat` for update + normal software validation.
- `RUN.bat` when already current.
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Manual shell/Git/PowerShell is last resort only when the launcher itself is broken or cannot expose the required diagnostic.
- Never build a second helper/workflow for behavior already implemented.

## Remote Devices authorization — mandatory before any write

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Always reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- If the existing module client is not approved, classify the run as `AUTHORIZATION/PREFLIGHT BLOCKED`; this is not a hardware-control failure.
- See `docs/REMOTE_DEVICES_AUTHORIZATION.md` before authorization recovery or direct Control Server research.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.

## Objective continuity

Closing a sub-question does not close the parent hardware-validation objective. Parent objective remains **explicit hardware feedback closure** across all 31 public feedback definitions/instances while material EVAL_ONLY, MANUAL_PENDING, BASELINE_UNKNOWN, neverObserved, unexercised or otherwise open rows remain. Before objective change, account for remaining open matrix rows. Tooling/documentation may interrupt only as a direct blocker; once removed, return to the parent hardware objective. Objective change is forbidden while relevant open rows remain unless the user explicitly changes scope.

## Software gate — COMPLETE PASS

User-host source HEAD `515e9cf2f3e9`:
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **216/216 PASS / 0 FAIL**;
- package build PASS: `focusrite-scarlett-18i20-0.1.17.tgz`.

Later branch commits are TestBench/docs-only and do not alter that validated 0.1.17 package.

## Latest real 0.1.17 read-only provenance observation

0.1.17 is loaded and selected on the **existing** authorised Companion Focusrite connection.

Read-only preflight observed:
- exact Scarlett 18i20 (3rd Gen);
- module 0.1.17;
- module client authorised;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- evidence coverage 1436/1436;
- Playback source existing mixer slot 3 / Playback 1 / stereo.

The read-only provenance probe completed twice with no Focusrite write, no Companion button press and no routing mutation. Stable result both times:
- Mix A left through Mix F left: gain KNOWN `[set]`;
- every right member: gain UNKNOWN `[never-observed]`;
- all mute: UNKNOWN `[never-observed]`;
- all solo: UNKNOWN `[never-observed]`;
- exact baseline tuple 0/12.

The 30-second Output Routing UI navigation produced **zero additional state materialisation**. Do not repeat this unchanged navigation phase.

## UI correction from user screenshots

The previous mental model “click visible Mix A-F tabs” was wrong. Focusrite Control Output Routing is organised by physical output destination.

Observed in the same session:
- Monitor Outputs 1-2: `Custom Mix`;
- Line Outputs 3-4: `Playback 3-4`;
- Line Outputs 5-6: `Playback 5-6`;
- Line Outputs 7-8: `Playback 7-8`;
- Line Outputs 9-10: `Playback 9-10`;
- S/PDIF Outputs 1-2: `Playback 11-12`.

The output-source menu visibly offers `Playback (DAW)`, `Hardware Input`, `Custom Mix`, and `Custom Mix + Talkback`. Focusrite's official 18i20 documentation confirms that `Custom Mix + Talkback` adds Talkback to the selected output Custom Mix.

The protocol still exposes six stereo mixes / 12 mono lanes (`Mix A L/R` through `Mix F L/R`). **Exact runtime output↔Mix mapping is not yet proven.** Do not infer `Mix A = Monitor 1-2` merely from ordering.

Current parser sees output `assignMix` and `assignTalkbackMix`, but those remain research-only and must not be written/exposed to manufacture evidence.

## Additional Input / Device Settings UI evidence — NOT NEW CLOSURE

User screenshots from the same session show:
- Line/Instrument selector only for Analogue 1-2;
- Air and Pad controls for Analogue 1-8;
- Speaker Switching Enable/Disable;
- Monitor Controls scope choices `1-2`, `1-4`, `1-6`, `1-8`, `All`, `None`;
- Talkback source and level controls;
- `Retain 48V` persistence setting;
- the existing Companion Scarlett 18i20 client approved under Remote Devices.

Official Focusrite docs corroborate the product shape: INST only on inputs 1-2; Air/Pad on all eight analogue channels; Talkback routable through `Custom Mix + Talkback`; Monitor Controls can target analogue output groups.

These are **UI_OBSERVED / OFFICIAL_PRODUCT_BEHAVIOUR cross-checks**, not new TCP or dynamic hardware closure. Do not infer input preamp gain, direct input mute, per-channel phantom, or any new public action from them. `Retain 48V` remains persistence only.

Existing dynamically closed rows `input_mode`, `monitor_preset`, `talkback_source`, and `phantom_persistence` remain closed and should not be retested.

Safety: Focusrite warns changing Monitor Controls assignment can make affected output level jump to full scale. Do not touch that selector merely to materialise state. Speaker Switching/ALT changes physical monitor routing and is deferred until exact baseline + physical isolation exist.

## Current TestBench-only read-only extension

The existing `testbench/MeterMixPlaybackBaselineReadOnlyProbe.js` now prints a sanitized `OUTPUT ROUTING SNAPSHOT` using already-existing 0.1.17 Companion variables:
- `output_N_name`;
- `output_N_source_name`;
- `output_N_stereo`.

No module source/version changed, no new package is required, no second client was added, and no write path was introduced.

The user has **not yet synchronized this TestBench-only extension**.

## Exact immediate next action

If an older probe prompt is still open, type:

`DONE`

Do not run a third navigation cycle.

Then:
1. run `UPDATE.bat` only;
2. do **not** rerun the 216-test software gate and do not reimport 0.1.17;
3. rerun `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`;
4. copy the new `OUTPUT ROUTING SNAPSHOT` block;
5. at the prompt type `DONE`; no 30-second navigation is needed.

Use the server-confirmed output source names to identify which physical destination currently uses which internal Mix A-F. No routing, `assign-mix`, source or hardware write is permitted merely to discover this mapping.

## Test sequence after mapping — do not skip ahead

1. **Mix Mute materialisation:** one server-mapped active Custom Mix, one known Playback strip, one manually guided Focusrite-Control Mute cycle only after physical output isolation; observe server readback and exact restore. No Companion write yet.
2. **Mix Mute action/feedback closure:** only if Mute itself now has a server-confirmed baseline; redesign the harness so Gain/Solo are collateral observations, not automatic restoration prerequisites.
3. **Mix Solo:** independently after Mute semantics are understood.
4. **Input Air/Pad readback:** later, one isolated/non-live input and one property at a time, then targeted Companion closure only from server-confirmed baseline.
5. **Monitor Mute/Dim:** later with monitor/headphone path physically safe and exact baseline available.
6. **Monitor ALT/ALT-enable:** last among open Core monitoring rows because Speaker Switching affects physical output routing. Do not retest the already-closed Monitor Controls preset.
7. Remaining meter/output gaps: passive natural signal or already-proven exact-restore paths only; no score-driven routing changes.

## Mix Mute/Solo status

- `mix_mute`: **RESEARCH_OPEN / EVAL_ONLY**;
- `mix_solo`: **RESEARCH_OPEN / EVAL_ONLY**.

Do not rerun the old gain+mute+solo tuple campaign unchanged.

## Retained parent evidence

- 31 public feedback definitions / 829 instances.
- Static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.
- Targeted Core: 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes/FAIL/restore quarantine — readback evidence, not proof of capability absence.

## Permanent safety

- Hardware support claim only Scarlett 18i20 (3rd Gen).
- Monitor gain 1677 read-only.
- No input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill or physical Monitor level write.
- Dynamic Control Server port and device ID.
- Writes only after this module's own server-assigned client ID is authorised.
- Feedback/state from server-confirmed state only.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands or writes to meter/status/read-only items.
- No writes to explicit UNKNOWN output availability.
- No Focusrite software/firmware/routing changes outside explicitly agreed tests.
- Keep audited 0.1.16 distinguishable from research build 0.1.17.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
