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

`UNKNOWN`, blank and `neverObserved` never mean unsupported.

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

Tooling/release/documentation work may interrupt the hardware objective only when it is a direct blocker for the next safe validation step. Once that direct blocker is removed, return to the parent hardware objective. Before any objective change, re-open the parent matrix and account for the remaining open matrix rows. If those rows and the evidence closing the current objective cannot be stated, the objective change is forbidden.

The parent objective remains **explicit hardware feedback closure** before public release.

## Latest fully green software checkpoint

Exact user-host HEAD:

`6bbf1b3fe162b67272397e5ce82940419c59080c`

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

This supersedes `9127b063...` as the latest fully validated software checkpoint. The free-running Line 3-4 recorder rewrite is therefore software-gate validated at `6bbf1b3...`. No `src/` file or production protocol/write path changed in this recorder rewrite.

## Latest completed hardware result — manual feedback sweep reportVersion 5

Latest reconciled sanitized report:

- Scarlett 18i20 (3rd Gen), module 0.1.19;
- updated `2026-08-25T18:11:50.399Z`;
- read-only harness, zero harness hardware writes, zero harness Companion presses;
- **51** feedback transitions;
- **50 confirmed PASS**;
- **1 TRANSIENT_RACE** (Monitor Talkback fast reversal);
- **0 confirmed feedback mismatch**.

Retained hardware closure:

- `input_air`: Inputs 1-8 **HARDWARE_DYNAMIC_CLOSED**;
- `input_pad`: Inputs 1-8 **HARDWARE_DYNAMIC_CLOSED**;
- `input_mode`: Inputs 1-2 Line/Inst **HARDWARE_DYNAMIC_CLOSED**;
- `monitor_dim`: **HARDWARE_DYNAMIC_CLOSED**;
- `monitor_mute`: **HARDWARE_DYNAMIC_CLOSED**;
- `monitor_talkback`: retain stronger prior closure.

No additional Air/Pad/Mode/DIM/Mute broad retest is needed.

## Latest assign-mix read-only result — completed

- `assign-mix` descriptor/schema coverage: **26/26 outputs SCHEMA_PRESENT**;
- server-observed assign-mix value coverage: **0/26**;
- every output remained `UNKNOWN[never-observed]`;
- this includes Monitor Outputs 1-2 while Focusrite Control visibly showed Mix A L/R routing;
- visible routing state does **not** justify inferring an assign-mix value;
- raw value semantics remain **UNKNOWN**;
- official write transaction semantics remain **UNKNOWN**;
- no public/raw assign-mix write surface exists and none may be added from this evidence.

`NAVIGATE_MIXES` was a passive historical observation mode only. Do not rerun it for the current objective.

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

## Latest Line Outputs 3-4 user-host attempt

The user ran the sequential read-only Line 3-4 harness that had been software-gate validated at `9127b063...`.

Baseline:

- Line Output 3: `source=Analogue 3`, `stereo=true`, `assignMix=UNKNOWN[never-observed]`;
- Line Output 4: `source=None / Unassigned`, `stereo=false`, `assignMix=UNKNOWN[never-observed]`.

After the first prompted user operation:

- Line Output 3: `source=Playback 3`, `stereo=true`, `assignMix=UNKNOWN[never-observed]`;
- Line Output 4 remained `source=None / Unassigned`, `stereo=false`, `assignMix=UNKNOWN[never-observed]`.

The harness exited code 2 only because it demanded a stereo-field change at that exact checkpoint.

Classification: **HARNESS_WORKFLOW_FAILURE**, not hardware/protocol failure. Preserve `Analogue 3 → Playback 3` as `SESSION_STATE_OBSERVED`. Do not infer that Stereo is broken, unsupported, or unwritable from this attempt.

## Current Line 3-4 workflow — free-running targeted recorder

The staged `1/6..6/6` workflow is retired. Do not use it again.

The existing same launcher/file were rewritten instead of creating a second tool:

- `testbench\RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd` remains the only launcher;
- `OutputRoutingLine34Capture.js` now behaves like the successful free manual recorder;
- during `REC ON` it continuously scans only Line Outputs 3-4;
- it records every observed change in source name, stereo, assign-mix opaque class/provenance, and availability;
- source-only, stereo-only, combined, and assign-mix-materialization events are all retained;
- it does not stop early because one expected intermediate field did not move;
- Custom Mix may be exercised through normal Focusrite Control even if assign-mix was unknown at baseline, because the research goal is to see whether the server materializes it;
- before `REC OFF` the user restores the displayed baseline;
- final source/stereo restoration is checked;
- assign-mix restoration is checked only when its baseline was actually known;
- report is sanitized and stores no raw item IDs/values, serial, hostname, client identity, raw XML, endpoint, or user path;
- harness performs **zero Focusrite writes** and presses **zero Companion buttons**.

User-host software gate at `6bbf1b3...` validates this rewrite: Prettier PASS, ESLint PASS, manifest PASS, **272/272 tests PASS**, package PASS.

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

1. Run the same `testbench\RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd` from the validated `6bbf1b3...` checkout.
2. Wait for `>>> REC ON <<<`.
3. During REC ON, manipulate only Line Outputs 3-4 in Focusrite Control: Stereo, several direct Sources, and Custom Mix in any order. Leave each state about 2 seconds.
4. Before pressing Enter to stop, restore exactly the BASELINE printed by the recorder.
5. Send `testbench\results\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json`.
6. Then return to the remaining Mixer topology evidence and six residual Mix meter floor paths. No broad sweep and no `NAVIGATE_MIXES` rerun.

After every material software/hardware/user result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
