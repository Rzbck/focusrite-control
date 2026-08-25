# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback/protocol closure before release**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## MANDATORY STARTUP FRESHNESS GATE

Before resuming, resolve the current remote HEAD of the objective branch and inspect newer commits/diff plus the newest MATERIAL movements relevant to the objective. Reconcile any newer completed user/hardware result before choosing the next action. Do not let an older copied/uploaded handoff override the live checkout. A document timestamp or embedded SHA is a checkpoint only, never permission to skip live repository verification.

Evidence priority:

1. newest explicit physical-hardware / completed user-host result;
2. current checked-in code/tests;
3. this handoff;
4. broader current docs;
5. older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

`UNKNOWN`, blank and never-observed never mean unsupported.

## PROJECT LAUNCHERS FIRST

Use checked-in launchers first:

- `UPDATE.bat` — sync;
- `UPDATE_AND_RUN.bat` — sync + full software gate;
- `RUN.bat` — software gate when already current;
- exact `testbench\RUN_*.cmd` — targeted research/hardware work.

Manual Git/PowerShell/Node is last resort only when a checked-in launcher is broken or insufficient.

Do NOT make the user type ad-hoc PowerShell, raw Git commands, Node commands when the checked-in launcher already performs the required workflow.

Do not rebuild a second tool/workflow for behavior already present in the repository.

## Text-write hygiene

After modifying tracked text through GitHub, preserve the final newline and verify the resulting file/expected formatting before asking the user to rerun the full gate. The user-host gate must not be used merely to discover avoidable formatting mistakes.

## Objective-continuity / no premature closure

Closing a sub-question never closes its parent validation objective. A tooling fix, one research hypothesis, one meter family, one green software gate, or one solved routing sub-question does not close the parent hardware-validation objective while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised, or otherwise open rows remain.

Tooling/release/documentation work may interrupt the hardware objective only when it is a direct blocker for the next safe validation step. Once that direct blocker is removed, return to the parent hardware objective. Before any objective change, re-open the parent matrix and account for the remaining open matrix rows.

The parent objective remains **explicit hardware feedback closure** before public release.

## Latest fully green software checkpoint

Exact user-host HEAD:

`9127b0634a0999a5409be38afb393c1ab14783b4`

passed:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **272/272 Node tests PASS**;
- Companion package build PASS;
- package `focusrite-scarlett-18i20-0.1.19.tgz`;
- no hardware test/write from the gate.

This supersedes `4497f363...` as the latest fully validated software checkpoint.

Immediately before this documentation refresh, remote branch HEAD was `c19a906bf151377461d6a8f929c817faa9fa2581`, exactly two documentation-only commits ahead of the green `9127b063...` checkpoint. Comparison `9127b063...` → `c19a906...` contained only root `HANDOFF` and this handoff; no `src/`, production write path, testbench logic, or package code changed.

## Latest completed hardware/recorder result — manual feedback sweep reportVersion 5

Latest reconciled sanitized `LATEST_MANUAL_FEEDBACK_SWEEP.json`:

- Scarlett 18i20 (3rd Gen), module 0.1.19;
- updated `2026-08-25T18:11:50.399Z`;
- read-only harness, zero harness hardware writes, zero harness Companion presses;
- duration about **207.3 s**;
- **820** scan cycles;
- average **246 ms**, max **1496 ms**;
- **51** feedback transitions;
- **50 confirmed PASS**;
- **1 TRANSIENT_RACE** (Monitor Talkback fast reversal);
- **0 confirmed feedback mismatch**.

### Closed input/monitoring feedbacks

- `input_air`: **Inputs 1-8 HARDWARE_DYNAMIC_CLOSED**, each both states with PASS edges.
- `input_pad`: **Inputs 1-8 HARDWARE_DYNAMIC_CLOSED**, each both states with PASS edges.
- `input_mode`: Inputs 1-2 Line/Inst retain **HARDWARE_DYNAMIC_CLOSED**.
- `monitor_dim`: **HARDWARE_DYNAMIC_CLOSED**.
- `monitor_mute`: **HARDWARE_DYNAMIC_CLOSED**.
- `monitor_talkback`: latest run contains one transient race; retain stronger prior hardware closure and do not downgrade.

No additional Air/Pad/Mode/DIM/Mute broad retest is needed.

## Latest assign-mix read-only result — completed, do not rerun the passive phase

The latest explicit user-host observation supersedes the older generic statement that assign-mix had merely "not materialised":

- `assign-mix` descriptor/schema coverage: **26/26 outputs SCHEMA_PRESENT**;
- server-observed assign-mix value coverage: **0/26**;
- every output remained `UNKNOWN[never-observed]`;
- this includes **Monitor Outputs 1-2 while Focusrite Control visibly showed Mix A L/R routing**;
- therefore visible routing state does **not** justify inferring an assign-mix value;
- raw value semantics remain **UNKNOWN**;
- official write transaction semantics remain **UNKNOWN**;
- no public/raw assign-mix write surface exists and none may be added from this evidence.

The `NAVIGATE_MIXES` 30-second mode was a passive historical observation mode only. If the user did nothing during the countdown, nothing was missed and no state was changed. It is not needed again for the current objective.

Classification: `SCHEMA_PRESENT + SESSION_STATE_UNOBSERVED`, not unsupported and not writable.

## Outputs 21-24 / ADAT 2 availability

Latest report observes `output_available=false` for zero-based options `20..23`, corresponding to human Outputs **21-24 / ADAT 2.1-2.4** in the current configuration.

Classification: **CONFIGURATION_UNAVAILABLE**, not unsupported.

Required module behavior:

- never hardcode Outputs 21-24 as permanently unavailable;
- follow server-confirmed `available` dynamically;
- block writes while `available=false`;
- if another valid configuration reports `available=true`, allow those outputs through the normal dynamic parser/policy path;
- a future real-hardware run in such a configuration is required before claiming that mode hardware-tested.

Do not change sample rate or digital I/O mode merely for coverage right now.

## Meter state retained

- Inputs: **8/8 closed**.
- Outputs: **22 hardware-closed paths** in the current configuration.
- Outputs 21-24: confirmed configuration-unavailable, so no drive/write test is allowed in this configuration.
- Mix: **6/12 closed**.
- Remaining Mix paths needing floor only: **Mix B L/R, Mix C L/R, Mix E R, Mix F R**.
- persistent meter mismatch: **0**.

Do not run broad `RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is.

## Timing reconciliation

`ManualFeedbackSweepReconcile.js` is software-gate validated.

Contract:

- only same-path exact inverse PASS within 500 ms can reclassify a raw mismatch as `TRANSIENT_RACE`;
- persistent mismatch remains `FAIL_MISMATCH`;
- original capture status is retained;
- reconciliation is idempotent.

Prior reportVersion 4 reconciled to 27 transient races / 0 confirmed mismatches. Latest reportVersion 5 contains 1 transient race / 0 confirmed mismatches.

## Current work — targeted Line Outputs 3-4 routing capture

The targeted read-only research harness is **SOFTWARE-GATE-VALIDATED** at user-host HEAD `9127b0634a0999a5409be38afb393c1ab14783b4`:

- `testbench/OutputRoutingLine34Capture.js`
- `testbench/RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd`
- `test/output-routing-line34-capture.test.js`

No `src/` file or production write path changed.

The package produced by the gate does **not** need to be imported solely for the targeted capture because the work is TestBench-only and the required read-only source/stereo/assign-mix variables already exist in the current module surface.

### Why this capture is still useful after 0/26 passive assign-mix readback

The completed passive observation proves only that no assign-mix value was emitted in that session. The targeted Line 3-4 capture tests whether normal **Stereo** and direct **Source** changes in Focusrite Control cause assign-mix to materialise, while preserving exact restoration.

It does **not** write assign-mix and it does **not** assume any assign-mix meaning.

### Targeted capture safety contract

- harness performs **zero Focusrite writes**;
- harness presses **zero Companion buttons**;
- user changes only what the launcher explicitly asks in Focusrite Control;
- sanitized report contains source name, stereo and opaque assign-mix equality class/provenance, not raw private IDs/values;
- Line 3-4 must be server-confirmed `available=true` with known source/stereo baseline;
- Stereo phase must restore before Source phase;
- Source phase must restore before any Custom Mix phase;
- if assign-mix is still unknown after Source restoration, the harness stops safe with `CUSTOM_MIX_BLOCKED_ASSIGN_MIX_BASELINE_UNKNOWN` and does **not** ask for Custom Mix;
- Custom Mix proceeds only with known assign-mix baseline;
- final source + stereo + assign-mix must match the promoted baseline exactly;
- restore failure = hard failure/quarantine.

Older guarded attempt to route Line 3-4 toward Mix A through the normal source path produced **NO_CONFIRMED_TRANSITION** and restored Playback 3/4 exactly. Do not repeat it blindly.

## Topology patterns retained as inference only

- feedback output options are zero-based while exposed variables are one-based;
- adjacent outputs act as stereo pairs in observed topology;
- mixer slots are one-based;
- mixer-slot `source=0` is genuinely observed around stereo split/rejoin, but its universal semantic meaning remains unproven;
- Mix D slot 17/18 left/right coupling is proven only for the observed runtime topology, not globally.

## Permanent safety boundaries

- Scarlett 18i20 (3rd Gen) only.
- Monitor gain item `1677` is read-only; never re-add Monitor set/adjust actions, presets, or raw-write access without new hardware proof.
- Never invent analogue input preamp gain.
- Never invent direct per-input hardware mute.
- Never invent per-channel phantom power.
- Never invent Mic Kill.
- Never invent physical Monitor level control.
- Focusrite Control Server TCP port and device ID are dynamic; never hardcode them.
- Writes require Remote Devices authorization for this module's own server-assigned client ID.
- Feedback/state must be server-confirmed; no optimistic updates.
- No unknown/unsafe raw item writes, firmware/reset/restore/snapshot commands, or meter/status writes.
- Never write to explicit `UNKNOWN` or `available=false` outputs.
- Do not update Focusrite software/firmware or unrelated routing/settings without explicit user agreement.
- Reversible tests require exact baseline and restoration; restoration failure = quarantine/hard abort.
- Never publish serial, private hostname, client key, raw private captures/XML/diagnostics, private IDs, or user-specific paths.
- Preserve relevant MIT/third-party attribution; do not claim all protocol knowledge was independently discovered.

## Remote Devices authorization — mandatory before any write

Read `docs/REMOTE_DEVICES_AUTHORIZATION.md` before any write-capable hardware campaign.

Focusrite Control → Device Settings → Remote Devices must show the existing **Companion Scarlett 18i20** approved. Reuse the existing Companion Focusrite connection; do not delete/recreate it for testing. Approval must match this module's own server-assigned client ID. Missing approval = **AUTHORIZATION/PREFLIGHT BLOCKED**, not a hardware failure.

No extra direct clients by default. Never reuse/copy the Companion private client key into another process. A direct research client must never run concurrently with normal Companion write-capable validation.

## Personal repository / publication

No GitHub Actions in the personal development repository. Validate with local checked-in launchers. Use official Bitfocus CI only after the official repository exists.

Repository/naming request is already in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better scope and offered hardware. Keep public validated hardware scope at Scarlett 18i20 (3rd Gen) only until real tests expand it. Wait for the official naming/repository decision. Stable public target remains **v1.0.0** unless maintainers direct otherwise.

## Immediate next action

1. Synchronize `testbench/meter-routing-exact-restore` with `UPDATE.bat` if the local checkout is not already at current remote HEAD.
2. Run `testbench\RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd`.
3. Follow only its prompts for Line Outputs 3-4; do not improvise additional routing changes.
4. If it safe-stops because assign-mix remains `UNKNOWN`, do not force Custom Mix manually; send the console output/report.
5. Otherwise send `testbench\results\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json` after completion.
6. Then reconcile remaining Mixer topology evidence and the six residual Mix meter floor paths. No new broad sweep and no `NAVIGATE_MIXES` rerun.

After every material software/hardware/user result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
