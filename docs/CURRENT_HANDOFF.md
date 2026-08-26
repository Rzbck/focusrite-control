# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback/protocol closure before release**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## MANDATORY STARTUP FRESHNESS GATE

Before resuming, resolve the current remote HEAD of the objective branch and inspect newer commits/diff plus the newest MATERIAL movements relevant to the objective. Reconcile any newer completed user/hardware result before choosing the next action. A document timestamp or embedded SHA is a checkpoint only, never permission to skip live repository verification.

Evidence priority: newest explicit physical-hardware/completed user-host result, current code/tests, this handoff, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, broader current docs, then older captures. Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`. `UNKNOWN`, blank and `neverObserved` never mean unsupported.

## PROJECT LAUNCHERS FIRST

Use checked-in launchers first: `UPDATE.bat`, `UPDATE_AND_RUN.bat`, `RUN.bat`, then exact `testbench\RUN_*.cmd`. Manual Git/PowerShell/Node is last resort only when a checked-in launcher is broken or insufficient.

Do not rebuild a second tool/workflow for behavior already present in the repository. Do not ask the user for ad-hoc Git/PowerShell/Node commands when a checked-in launcher already performs the required workflow.

## Objective continuity

Closing a sub-question never closes its parent validation objective. A tooling fix, one research hypothesis, one meter family, one green software gate, or one solved routing question does not close hardware validation while material `EVAL_ONLY`, `MANUAL_PENDING`, unexercised public write surfaces, or otherwise open rows remain.

The parent objective remains **explicit hardware feedback/protocol closure before release**. Publication work is not the current objective.

## Latest fully green software checkpoint

Exact user-host HEAD `e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7` passed the complete local gate on 2026-08-26:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier 3.9.6 PASS;
- ESLint PASS;
- source manifest PASS;
- **279/279 Node tests PASS**;
- Companion package PASS;
- `focusrite-scarlett-18i20-0.1.19.tgz`.

No hardware test/write was performed by that software gate. The broad REC extension is **SOFTWARE-GATE-VALIDATED**; no production `src/` protocol/write path changed.

## Newest hardware result — broad REC reportVersion 6

Sanitized report updated `2026-08-26T05:59:47.636Z`, Scarlett 18i20 (3rd Gen), module 0.1.19:

- `readOnlyHarness=true`;
- `hardwareWritesByHarness=false`;
- `companionButtonPressesByHarness=false`;
- duration 425041 ms;
- 829 feedback probes / 31 definitions / 783 non-meter controls / 46 meters;
- **193 feedback transitions**;
- **193 confirmed PASS**;
- **0 transient race**;
- **0 confirmed mismatch**;
- 92/783 non-meter paths observed in both rendered states;
- 810 safe semantic paths exposed;
- 94 semantic paths changed;
- 367 semantic transitions.

This is strong server-confirmed **feedback/session evidence** for the Focusrite Control UI operations that occurred. It is not automatically proof of the equivalent generic Companion write transaction.

## Mixer / Custom Mix topology — strong new session evidence

Normal Focusrite Control UI operations produced server-confirmed `mixer_slot_stereo` transitions on slots **1-6 and 13-18** plus semantic source-name changes across multiple slots and source families.

Representative exact behavior on slots 3/4:

- both stereo flags `true -> false`;
- follower slot 4 source `None / Unassigned -> Playback 2`;
- relink returned stereo `false -> true` and follower source `Playback 2 -> None / Unassigned`.

Similar paired source/topology materialisation occurred on other tested pairs.

Classification: `mixer_slot_stereo` and `mixer_slot_source` have strong multi-pair **SESSION_STATE_OBSERVED** evidence for the official UI path. Generic/public single-item source writes remain withheld. `mixer_slot_stereo` remains diagnostic-gated for explicit research only. Blind raw/single-item writes remain forbidden.

## Custom Mix strips

`mix_mute` and `mix_solo` changed cleanly across many Mix A left/right slots and Mix D left slots with server-confirmed PASS and no mismatch. Gain/Pan semantic diagnostics also changed repeatedly across many Mix A and Mix D strips, proving UI-driven state materialisation/readback while keeping numeric values private as opaque equality classes.

Mix Talkback changed on Mix A left/right and Mix D left. Public `mix_talkback` write remains withheld because UI readback does not prove the generic Companion write transaction.

Important release distinction: `mix_mute`, `mix_solo`, `mix_gain_set/adjust`, and `mix_pan` remain public actions. Their broad UI/readback evidence is now strong, but generic Companion writes across arbitrary mix/side/slot combinations are not all hardware-proven. This is a material **action-surface audit item**, not a reason to rerun the broad recorder.

## Outputs — representative analogue + digital evidence

ReportVersion 6 extends representative output readback beyond Line 3-4:

- Output 3 retained strong Mute/Stereo/Source behavior;
- Output 11 Stereo/Source changed repeatedly with sources including Playback, Analogue, Custom Mix and S/PDIF families;
- Output 12 follower source changed between `None / Unassigned` and `S/PDIF 2` during pair activity;
- Output 25/26 showed Stereo/Source behavior;
- Output 25 Mute changed both ways;
- additional Output Mute both-state PASS occurred on Outputs 13, 15, 17 and 19.

Direct output gain diagnostics exist only for **Outputs 1-10**. No direct gain semantic variable exists for Outputs **11-26**. This matches Focusrite Control: S/PDIF/ADAT/digital outputs have no direct per-output volume fader in the current Control Server/module schema. Do not invent digital-output gain. Custom Mix can shape level when that routing path is used.

Existing `hardware-policy.js` remains control-specific. ReportVersion 6 UI/readback evidence must **not** be used to automatically remove historical direct-write blocks. Before release, audit the output action choices that remain visible after policy filtering against retained write evidence.

## Assign-mix — stop chasing it for v1

`assign-mix` remains 26/26 `SCHEMA_PRESENT`, but no value materialized. The broad REC exercised representative Outputs 1, 3, 11 and 25 with Playback/Analogue/Custom Mix/digital source changes while assign-mix class/provenance stayed `UNKNOWN`.

Classification: **SCHEMA_PRESENT + ACTIVE_SESSION_STATE_UNOBSERVED** across several tested output families.

- raw semantics: `UNKNOWN`;
- official write transaction: `UNKNOWN`;
- public action/preset/feedback: absent;
- Advanced Raw: absent.

No public Focusrite product documentation found in the 2026-08-26 cross-check documents this private Control Server field or its low-level transaction. Product documentation describes assigning **Custom Mix** through normal Output Routing instead. Do not rerun `NAVIGATE_MIXES`; do not add blind/raw `assign-mix` writes. It is not a v1 blocker while the normal source path and UI behavior are understood and safe surfaces remain bounded.

## Meter state after reportVersion 6

Aggregate: **37/46 closed, 4 floorOnly, 5 movementOnly, 0 neverObserved, 0 mismatch**.

- Inputs: **8/8 closed**.
- Outputs 1-20 and 25-26: **22 closed** with floor + movement.
- Outputs 21-24 / ADAT 2.1-2.4: floor-only and `CONFIGURATION_UNAVAILABLE` in the current configuration; no write-driven closure.
- Custom Mix lanes: **7/12 closed**.
- Mix F right is now closed.
- Remaining Custom Mix meter floor gaps: **Mix B L/R, Mix C L/R, Mix E R**.

Prefer passive silence capture from existing routing. Do not alter routing, sample rate or Digital I/O mode merely to improve the meter score.

## Monitor ALT / Speaker Switching

No `monitor_alt` or `monitor_alt_enable` transition occurred in reportVersion 6. Both remain **EVAL_ONLY_SAFE_ACTIONABLE**.

Official Focusrite documentation cross-checked on 2026-08-26 confirms the 18i20 3rd Gen behavior:

- MAIN speakers use Monitor Outputs 1-2;
- ALT speakers use Line Outputs 3-4;
- Speaker Switching copies/switches the main monitor mix between those pairs;
- the inactive pair is muted;
- disabling Speaker Switching initially mutes MAIN and ALT for safety;
- the 18i20 front-panel ALT button and Focusrite Control UI can select ALT.

Therefore one physically isolated, exact-restorable ALT/ALT Enable hardware test is justified **if these actions are intended to remain public**. Otherwise withhold them for v1. Do not test with active loud monitoring.

## Official documentation cross-check — digital routing / sample-rate consequences

Focusrite's current Scarlett 18i20 3rd Gen documentation confirms:

- the device supports six Custom Mixes;
- Hardware Inputs and Software (DAW) Playback sources can be stereo-linked in the Custom Mix UI;
- Custom Mix is disabled at 176.4/192 kHz;
- optical/ADAT availability changes with sample-rate band;
- Digital I/O mode changes S/PDIF/ADAT port topology;
- changing Digital I/O mode requires restarting the interface for the new configuration to take effect;
- changing Monitor Controls can cause large output-level changes.

These public facts corroborate our capability/availability model. They do **not** provide private Control Server item write semantics.

## Public action-surface audit — material remaining release work

The 31-feedback closure matrix is now reconciled with reportVersion 6, but feedback validation alone does not validate every public action.

Current production policy already withholds important unresolved paths:

- `mixer_slot_source` removed from normal public actions;
- `mixer_slot_stereo` absent from normal connections and diagnostic-gated for research;
- `mix_talkback` removed from normal public actions;
- output actions filtered by exact model, server-confirmed availability and control-specific hardware evidence;
- Monitor pair gain writes withheld;
- Monitor gain item `1677` read-only;
- Advanced Raw constrained through hardware policy.

Remaining action-surface decisions:

1. **ALT / ALT Enable** — dynamically test once under isolation or withhold for v1.
2. **Custom Mix public writes** — audit `mix_mute`, `mix_solo`, `mix_gain_set`, `mix_gain_adjust`, and `mix_pan`. Broad UI readback is strong; generic arbitrary lane/side/slot write behavior still needs representative exact-restore proof or tighter policy.
3. **Disruptive settings** — `device_preset`, `clock_source`, `sample_rate`, and `spdif_mode` are still defined as actions even though dynamic testing is intentionally blocked for safety. Before v1, explicitly choose **withhold** or a deliberately approved hardware campaign. Do not change them merely for coverage.
4. **Nickname writes** — input/output/device nickname actions are low-risk but outside the sanitized broad REC. Validate with a temporary synthetic nickname + exact restoration if they are to be called hardware-tested; otherwise document them only as implemented/schema-observed.
5. **Allowed output writes** — audit every output option that remains visible after `hardware-policy.js` filtering against retained direct-write evidence. Do not loosen policy merely because UI-driven feedback now looks good.

The safest default for disruptive settings is **withhold for v1 unless a deliberate product decision says otherwise**. This avoids changing sample rate, clocking, Digital I/O mode or routing preset solely for validation.

## Important: broad REC ended with user UI state drift

The read-only recorder does not restore user UI operations. Its final semantic snapshot differs from its baseline on several paths, including:

- opaque gain state on Outputs 3, 4 and 9;
- Output 11 source `Playback 11 -> S/PDIF 1`;
- mixer slots 1/2 left unlinked with slot 2 source `Analogue 2`;
- slots 17/18 changed to stereo with slot 17 source `ADAT 1.7`;
- mixer slot 23 source `Analogue 7 -> S/PDIF 1`;
- Mix D left Talkback `false -> true`;
- several Mix D slot 13/14 Pan classes not at the REC baseline.

Opaque numeric gain/pan values are intentionally not stored, so the sanitized report cannot reconstruct the original numbers. This is session-state drift, not a recorder failure. Do not claim exact restoration for this REC.

## Outputs 21-24 availability

Outputs 21-24 / ADAT 2.1-2.4 remain `available=false` in the current configuration: **CONFIGURATION_UNAVAILABLE**, not unsupported. Availability is dynamic and must never be hardcoded. Do not change sample rate or Digital I/O mode merely to force them available.

## Retained stronger closure

Do not retest merely for coverage:

- Air Inputs 1-8;
- Pad Inputs 1-8;
- Input Mode 1-2;
- Monitor Mute;
- Monitor Dim;
- Monitor Talkback;
- Monitor Preset;
- Talkback Source;
- Phantom Persistence;
- prior Line Outputs 3-4 routing evidence.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware campaign, Focusrite Control → Device Settings → Remote Devices must show the existing **Companion Scarlett 18i20** approved. Reuse the existing Companion Focusrite connection.

Missing approval = **AUTHORIZATION/PREFLIGHT BLOCKED**, not hardware failure. Approval must match this module's own server-assigned client ID. No extra direct clients by default. Never reuse/copy the Companion private client key into another process.

## Permanent boundaries

- supported hardware: Scarlett 18i20 (3rd Gen) only;
- Monitor gain item `1677` remains read-only;
- no analogue input preamp gain action;
- no direct per-input hardware mute claim;
- no per-channel phantom action;
- no Mic Kill;
- Focusrite Control Server TCP port and device ID are dynamic;
- feedback/state is server-confirmed only;
- no write to explicit UNKNOWN or `available=false`;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no meter/status writes;
- no Focusrite software/firmware update without explicit agreement;
- no sample-rate/Digital-I/O/routing change merely for coverage;
- reversible hardware tests require exact baseline/restoration; restore failure = quarantine/hard abort;
- preserve privacy and third-party attribution.

## Immediate next action

The documentation/matrix reconciliation is complete. Do **not** rerun the broad REC and do not rerun `NAVIGATE_MIXES`.

Smallest justified remaining sequence:

1. If preserving the pre-REC device configuration matters, manually account for the known UI state drift; the sanitized report cannot reconstruct opaque numeric gain/pan values.
2. Let the five remaining Custom Mix meter paths reach true silence naturally if possible and capture floor passively. No routing change just for meter closure.
3. Decide whether ALT / Speaker Switching remains a v1 action. If yes, run one isolated exact-restorable ALT/ALT Enable test; if no, withhold it.
4. Audit the **actual public action surface** against retained hardware evidence. Focus first on Custom Mix writes and disruptive settings.
5. For each unproven public write, choose **targeted exact-restorable proof** or **withhold for v1**. Do not create a broad new campaign unless multiple unresolved public actions genuinely require it.
6. `assign-mix` is not on the remaining-v1-work list. Unavailable Outputs 21-24 are not test targets in the current configuration.

After every material software/hardware/user result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
