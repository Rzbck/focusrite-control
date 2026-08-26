# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback/protocol closure before release**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## MANDATORY STARTUP FRESHNESS GATE

Before resuming, resolve the current remote HEAD of the objective branch and inspect newer commits/diff plus the newest MATERIAL movements relevant to the objective. Reconcile any newer completed user/hardware result before choosing the next action. A document timestamp or embedded SHA is a checkpoint only, never permission to skip live repository verification.

Evidence priority: newest explicit physical-hardware/completed user-host result, current code/tests, this handoff, broader current docs, then older captures. Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`. `UNKNOWN`, blank and `neverObserved` never mean unsupported.

## PROJECT LAUNCHERS FIRST

Use checked-in launchers first: `UPDATE.bat`, `UPDATE_AND_RUN.bat`, `RUN.bat`, then exact `testbench\RUN_*.cmd`. Manual Git/PowerShell/Node is last resort only when a checked-in launcher is broken or insufficient.

Do NOT make the user type ad-hoc PowerShell, raw Git commands, Node commands when the checked-in launcher already performs the required workflow.

Do not rebuild a second tool/workflow for behavior already present in the repository.

## Objective continuity

Closing a sub-question never closes its parent validation objective. A tooling fix or green software gate does not close hardware validation while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised, or otherwise open rows remain. Tooling work may interrupt only for a direct blocker; once removed, return to the parent hardware objective and account for the remaining open matrix rows. Objective change is forbidden without that accounting. The parent objective remains **explicit hardware feedback closure**.

## Latest fully green software checkpoint

Exact user-host HEAD `e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7` passed the complete local gate on 2026-08-26: Node 22.23.2, Yarn 4.17.0, dependencies PASS, Prettier 3.9.6 PASS, ESLint PASS, manifest PASS, **279/279 Node tests PASS**, Companion package PASS, `focusrite-scarlett-18i20-0.1.19.tgz`. No hardware test/write from the gate. Broad REC extension is **SOFTWARE-GATE-VALIDATED**; no production `src/` protocol/write path changed.

## Newest hardware result — broad REC reportVersion 6

Sanitized report updated `2026-08-26T05:59:47.636Z`, Scarlett 18i20 (3rd Gen), module 0.1.19. `readOnlyHarness=true`, `hardwareWritesByHarness=false`, `companionButtonPressesByHarness=false`. Duration 425041 ms. Matrix size remains 829 probes / 31 definitions / 783 non-meter controls / 46 meters.

Control result: **193 transitions, 193 confirmed PASS, 0 transient race, 0 confirmed mismatch, 92 both-state paths, 0 unresolved**.

Semantic diagnostics: **810 exposed safe paths, 94 changed, 367 semantic transitions**. Raw/private values remain excluded.

## Mixer / Custom Mix topology — major new evidence

Normal Focusrite Control UI operations produced server-confirmed `mixer_slot_stereo` transitions on slots **1-6 and 13-18** plus semantic source-name changes across multiple slots. Representative exact behavior on slots 3/4: both stereo flags `true -> false`; follower slot 4 materialized `None / Unassigned -> Playback 2`; relink restored `false -> true` and follower `Playback 2 -> None / Unassigned`. Similar paired source/topology materialisation occurred on other tested pairs.

Classification: `mixer_slot_stereo` and `mixer_slot_source` now have strong multi-pair **SESSION_STATE_OBSERVED** feedback/readback evidence for the official UI path. This is not proof of a generic Companion/direct/raw write transaction. Blind single-item/raw writes remain forbidden, and exact behavior must not be generalized to every unobserved pair.

## Custom Mix strips

`mix_mute` and `mix_solo` changed cleanly across many Mix A left/right slots and Mix D left slots, with server-confirmed PASS and no mismatch. Gain/Pan semantic diagnostics also changed repeatedly across many Mix A and Mix D strips, proving UI-driven state materialisation/readback while keeping raw values as opaque `V1/V2/...` classes.

Mix Talkback changed on Mix A left/right and Mix D left. Keep generic write semantics withheld until the official exact transaction is proven; this REC is feedback/session evidence, not direct-write proof.

## Outputs — digital/analogue evidence

Representative output evidence now extends beyond Line 3-4. Output 11 had repeated Stereo/Source changes; semantic source names included Playback, Analogue, `Mix F L`, and S/PDIF. Output 12 follower source changed between `None / Unassigned` and `S/PDIF 2`. Output 25/26 also showed Stereo/Source behavior; Output 25 Mute changed both ways. Additional output Mute both-state PASS occurred on Outputs 13, 15, 17 and 19.

Direct output gain diagnostics exist only for **Outputs 1-10**. No `output_*_gain` semantic variable is exposed for Outputs **11-26**. This matches Focusrite Control: S/PDIF/ADAT/digital outputs have no direct per-output volume fader in the current Control Server/module schema. Do not invent digital-output gain. Custom Mix can still shape level when that routing path is used.

## Assign-mix

`assign-mix` remains 26/26 `SCHEMA_PRESENT` but no value materialized. The broad REC exercised representative Outputs 1, 3, 11 and 25 with Playback/Analogue/Custom Mix/digital source changes while assign-mix class/provenance stayed `UNKNOWN`.

Classification is strengthened to `SCHEMA_PRESENT + ACTIVE_SESSION_STATE_UNOBSERVED` across several tested output families. Raw semantics and official write transaction remain `UNKNOWN`; no public/raw assign-mix action may be added. Do not infer absence from all firmware/configurations. Do not rerun `NAVIGATE_MIXES`.

## Meter state

ReportVersion 6 aggregate: **37/46 closed, 4 floorOnly, 5 movementOnly, 0 neverObserved, 0 mismatch**.

- Inputs: 8/8 closed.
- Outputs 1-20 and 25-26: floor + movement closed.
- Outputs 21-24: floor-only and `CONFIGURATION_UNAVAILABLE` in this configuration; no write-driven closure.
- Mix F right newly acquired floor and is closed.
- Remaining Mix floor gaps: **Mix B L/R, Mix C L/R, Mix E R**.
- Mix closure is now **7/12 closed / 5 MANUAL_PENDING floor-only**.

## Monitor ALT

No `monitor_alt` or `monitor_alt_enable` transition occurred in reportVersion 6. Keep them open as `EVAL_ONLY_SAFE_ACTIONABLE` only with physical isolation and an exact restorable baseline. No transition is not an unsupported claim.

## Important: broad REC did not end at the REC baseline

The recorder is read-only and does not restore user UI changes. The final semantic snapshot differs from the REC baseline on multiple paths. Known examples include opaque gain state on Outputs 3, 4 and 9; Output 11 source `Playback 11 -> S/PDIF 1`; mixer slots 1/2 left unlinked with slot 2 source `Analogue 2`; slots 17/18 changed to stereo with slot 17 source `ADAT 1.7`; mixer slot 23 source `Analogue 7 -> S/PDIF 1`; Mix D left Talkback `false -> true`; and several Mix D slot 13/14 Pan classes not at baseline. Opaque numeric values are intentionally not stored, so exact gain/pan numbers cannot be reconstructed from the sanitized report. This is session-state drift, not a recorder failure. Do not claim exact restoration for this broad REC.

## Outputs 21-24 availability

Outputs 21-24 / ADAT 2.1-2.4 remain `available=false` in the current configuration: **CONFIGURATION_UNAVAILABLE**, not unsupported. Availability remains dynamic and must never be hardcoded. Do not change sample rate or digital mode merely for coverage.

## Retained closure

Air Inputs 1-8, Pad Inputs 1-8, Input Mode 1-2, Monitor Mute, Monitor Dim, Monitor Talkback, Monitor Preset, Talkback Source, Phantom Persistence and prior Line 3-4 evidence retain their stronger prior classification. Do not retest just for coverage.

## Remote Devices authorization — mandatory before any write

Read `docs/REMOTE_DEVICES_AUTHORIZATION.md` before any write-capable hardware campaign. Focusrite Control → Device Settings → Remote Devices must show the existing **Companion Scarlett 18i20** approved. Reuse the existing Companion Focusrite connection. Missing approval = **AUTHORIZATION/PREFLIGHT BLOCKED**, not hardware failure. Approval must match this module's own server-assigned client ID. No extra direct clients by default. Never reuse/copy the Companion private client key into another process.

## Permanent boundaries

Supported hardware remains Scarlett 18i20 (3rd Gen) only. Monitor gain item `1677` remains read-only. Do not add unsupported preamp gain, direct per-input hardware mute, per-channel phantom, Mic Kill, or physical Monitor level. Control Server port and device ID are dynamic. Feedback must be server-confirmed. Outputs with `available=false` or UNKNOWN are not write targets. Do not expose unknown/unsafe raw writes, firmware/reset/restore/snapshot, or read-only meter/status writes. Do not alter Focusrite software, firmware, sample rate, digital mode, or unrelated routing merely for coverage. Preserve privacy and third-party attribution.

## Immediate next action

Do not rerun the broad REC merely to repeat already-observed Mixer/Output/Mute/Solo paths. First account for current UI state drift if preserving the pre-REC configuration matters. Then reconcile `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md` with reportVersion 6 and choose only the smallest remaining justified hardware test. Material remaining gaps include Monitor ALT/ALT Enable, the five Mix meter floors (`Mix B L/R`, `Mix C L/R`, `Mix E R`), unobserved representative instances only where evidence is still insufficient, and write-transaction questions that feedback-only UI observation cannot prove. Do not rerun `NAVIGATE_MIXES` or chase assign-mix with blind writes.

After every material software/hardware/user result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
