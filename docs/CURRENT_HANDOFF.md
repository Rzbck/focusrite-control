# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback/protocol closure before release**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## MANDATORY STARTUP FRESHNESS GATE

Before resuming, resolve the current remote HEAD of the objective branch and inspect newer commits/diff plus the newest material movement relevant to the objective. Reconcile any newer completed user/hardware result before choosing the next action. A document timestamp or embedded SHA is a checkpoint only, never permission to skip live repository verification.

Evidence priority: newest explicit hardware/user-host result, current code/tests, this handoff, broader docs, then older captures.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`. `UNKNOWN`, blank and `neverObserved` never mean unsupported.

## PROJECT LAUNCHERS FIRST

Use checked-in launchers first: `UPDATE.bat`, `UPDATE_AND_RUN.bat`, `RUN.bat`, then the exact `testbench\RUN_*.cmd`. Manual Git/PowerShell/Node is last resort only when a checked-in launcher is broken or insufficient.

Do NOT make the user type ad-hoc PowerShell, raw Git commands, Node commands when the checked-in launcher already performs the required workflow.

Do not rebuild a second tool/workflow for behavior already present in the repository.

## Objective continuity

Closing a sub-question never closes its parent validation objective. A tooling fix or green software gate does not close hardware validation while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised, or otherwise open rows remain. Tooling work may interrupt only for a direct blocker; once removed, return to the parent hardware objective and account for the remaining open matrix rows. Objective change is forbidden without that accounting. The parent objective remains **explicit hardware feedback closure**.

## Latest fully green software checkpoint

Exact user-host HEAD `e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7` passed the complete local gate on 2026-08-26:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier 3.9.6 PASS;
- ESLint PASS;
- source manifest PASS;
- **279/279 Node tests PASS / 0 FAIL**;
- Companion package build PASS;
- package `focusrite-scarlett-18i20-0.1.19.tgz`;
- no hardware test/write from the gate.

This supersedes `6bbf1b3...` as the latest fully green checkpoint. The broad REC extension is **SOFTWARE-GATE-VALIDATED**. No `src/` file or production protocol/write path changed in this TestBench extension.

## Broad REC aspirateur — ready

Reuse the existing single launcher `testbench\RUN_MANUAL_FEEDBACK_SWEEP.cmd`; there is no second broad-recorder workflow. One REC session observes all **783 public non-meter feedback probes**, all **46 meters**, plus the safe semantic diagnostics already added to the same recorder.

Semantic diagnostics cover output availability/mute/stereo/source-name/gain classes and assign-mix class/provenance, mixer-slot source-name/stereo, Mix lane/slot gain/pan as opaque `V1/V2/...` classes, Mix talkback, and safe Monitor/device state. Semantic source names such as `Playback 3`, `Analogue 7`, and `Mix D L` are preserved. Numeric unresolved source IDs are masked as `UNRESOLVED_SOURCE`. Raw private values and identities are not part of the sanitized report.

The recorder is read-only: zero Focusrite writes and zero Companion button presses. User clicks in Focusrite Control still change hardware.

## Latest hardware evidence retained

Prior broad manual sweep: 51 transitions, 50 confirmed PASS, 1 transient race, 0 confirmed mismatch. Retain hardware closure for Air Inputs 1-8, Pad Inputs 1-8, Input Mode 1-2, Monitor DIM, Monitor Mute, and stronger prior Monitor Talkback evidence. Do not retest these just for coverage.

Line Outputs 3-4 free recorder: 19 routing-state changes, exact source/stereo restoration confirmed, and assign-mix never materialized. Output 3 showed semantic sources including Playback, Analogue, and `Mix D L`. Stereo unlink/relink repeatedly changed Output 4 between `None / Unassigned` and `Playback 4`. Classification: `SESSION_STATE_OBSERVED` for this tested pair only.

Assign-mix remains 26/26 `SCHEMA_PRESENT`, but active Line 3-4 routing still left it unobserved. Raw semantics and official write transaction remain `UNKNOWN`; no public/raw assign-mix action may be added. Do not rerun `NAVIGATE_MIXES`.

Outputs 21-24 are currently `CONFIGURATION_UNAVAILABLE` (`available=false`), not unsupported. Availability remains dynamic and must never be hardcoded.

Meter status: input 8/8 closed; output 22 hardware-closed in this configuration; Mix 6/12 closed. Residual Mix meter paths need floor only: Mix B L/R, Mix C L/R, Mix E R, Mix F R. Persistent mismatch: 0.

## Remaining parent-matrix focus

The next broad REC must leave safe possibilities open rather than target only one family. Useful remaining evidence may include mixer-slot topology/source, Mix mute/solo, Mix gain/pan semantic changes, eligible output mute/stereo/source/gain behavior, Monitor ALT/ALT Enable when safely isolated, and residual Mix meter floors. `mix_talkback` remains withheld where transaction semantics are not established.

## Remote Devices authorization — mandatory before any write

Read `docs/REMOTE_DEVICES_AUTHORIZATION.md` before any write-capable hardware campaign. Focusrite Control → Device Settings → Remote Devices must show the existing **Companion Scarlett 18i20** approved. Reuse the existing Companion Focusrite connection. Missing approval = **AUTHORIZATION/PREFLIGHT BLOCKED**, not hardware failure. Approval must match this module's own server-assigned client ID. No extra direct clients by default. Never reuse/copy the Companion private client key into another process.

## Permanent boundaries

Supported hardware remains Scarlett 18i20 (3rd Gen) only. Monitor gain item `1677` remains read-only. Do not add unsupported preamp gain, direct per-input hardware mute, per-channel phantom, Mic Kill, or physical Monitor level. Control Server port and device ID are dynamic. Feedback must be server-confirmed. Outputs with `available=false` or UNKNOWN are not write targets. Do not alter Focusrite software, firmware, sample rate, digital mode, or unrelated routing merely for coverage. Preserve privacy and third-party attribution.

## Immediate next action

Do not rerun `UPDATE_AND_RUN.bat` merely because handoff-only commits follow the green `e8d7e72...` checkpoint; no TestBench/production code changed after that gate.

Run `testbench\RUN_MANUAL_FEEDBACK_SWEEP.cmd`. Before `REC ON`, physically isolate/quiet speakers, headphones and sensitive outputs. During `REC ON`, freely explore the remaining safe clickable controls with no required click order and leave each state about 2 seconds. Do not touch Device Preset, Clock Source, Sample Rate, S/PDIF mode, firmware/reset/restore/snapshot, Monitor gain `1677`, or outputs currently unavailable. Nicknames are intentionally ignored. Include a few seconds of silence where practical for the residual Mix meter floors. Stop with Enter and provide `testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json`.

After every material software/hardware/user result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
