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

The free-running Line 3-4 recorder rewrite is therefore software-gate validated at `6bbf1b3...`. No `src/` file or production protocol/write path changed in that recorder rewrite.

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

## Latest Line Outputs 3-4 free-recorder result — completed

The user completed the free-running read-only Line 3-4 recorder successfully.

Safety/result:

- harness made **zero Focusrite writes**;
- harness pressed **zero Companion buttons**;
- **19 routing-state changes captured**;
- final source/stereo restoration **CONFIRMED**;
- `assign-mix` materialized during REC: **NO**.

Baseline:

- Line Output 3: `source=Playback 3`, `stereo=true`, `assignMix=UNKNOWN[never-observed]`;
- Line Output 4: `source=None / Unassigned`, `stereo=false`, `assignMix=UNKNOWN[never-observed]`.

Repeated stereo unlink/relink observation:

- Output 3 `stereo true -> false` accompanied Output 4 `source None / Unassigned -> Playback 4`;
- Output 3 `stereo false -> true` accompanied Output 4 `source Playback 4 -> None / Unassigned`;
- this cycle was observed repeatedly and restored.

Classification: **SESSION_STATE_OBSERVED** hardware behavior for Line Outputs 3-4 in this configuration. Do not generalize this exact pair behavior to all output pairs until another pair is observed on real hardware.

Direct/source-routing observations on Line Output 3:

- `Playback 3 -> Playback 1`;
- `Playback 1 -> Playback 19`;
- `Playback 19 -> Analogue 1`;
- `Analogue 1 -> Analogue 7`;
- `Analogue 7 -> Mix D L`;
- `Mix D L -> Playback 1`;
- `Playback 1 -> Playback 3`;
- final baseline restore confirmed.

Important routing conclusion:

- selecting a Custom Mix route was server-visible as ordinary source readback: `sourceName=Mix D L`;
- `assign-mix` remained `UNKNOWN[never-observed]` throughout Stereo changes, multiple direct sources, Custom Mix selection, and restoration;
- this tested routing path therefore does **not** require inventing an assign-mix value to represent the observed Custom Mix selection;
- this does not prove assign-mix is absent from every firmware/configuration.

## Latest assign-mix status — active test supersedes passive-only evidence

- descriptor/schema coverage remains **26/26 outputs SCHEMA_PRESENT**;
- earlier passive value coverage was **0/26**;
- the active Line 3-4 recorder now exercised Stereo, several direct sources and Custom Mix while assign-mix still never materialized;
- raw value semantics remain **UNKNOWN**;
- official write transaction remains **UNKNOWN**;
- no public/raw assign-mix write surface exists and none may be added from this evidence;
- `NAVIGATE_MIXES` is historical passive research only and must not be rerun for this objective.

Classification: `SCHEMA_PRESENT + ACTIVE_SESSION_STATE_UNOBSERVED` for the tested Line 3-4 path, not unsupported and not writable.

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

## Line 3-4 workflow status

The staged `1/6..6/6` workflow is retired and must not be used again.

The free-running recorder has now completed the intended capture with confirmed restoration. Do not rerun it merely to chase assign-mix: active routing changes already left assign-mix unobserved while normal `sourceName` clearly exposed direct and Custom Mix routing.

If the sanitized JSON report is supplied, reconcile its exact event list before any code/release change that depends on this capture.

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

1. Prefer receiving/reconciling `testbench\results\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json` if available; do not rerun the completed Line 3-4 recorder just to reproduce the console result.
2. Keep assign-mix read-only/research-only; do not add a write path.
3. Return to the parent hardware objective: remaining Mixer topology evidence and the six residual Mix meter floor paths.
4. Do not run another broad sweep and do not rerun `NAVIGATE_MIXES`.
5. Before any new write-capable campaign, use the checked-in launcher/preflight and exact-restoration guards.

After every material software/hardware/user result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
