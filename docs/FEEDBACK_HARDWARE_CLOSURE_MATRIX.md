# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-25

This is the parent hardware-validation checklist for the **31 public Companion feedback definitions**. It separates product/schema evidence, session readback, implementation, real hardware write confirmation, and full dynamic closure.

A software test, static render match, one sparse client session, or one successful sub-test is not enough by itself to close a hardware row.

## Evidence / classification rule

Keep these levels separate:

1. **OFFICIAL PRODUCT BEHAVIOUR**;
2. **SCHEMA_PRESENT**;
3. **SESSION_STATE_OBSERVED**;
4. **IMPLEMENTED**;
5. **HARDWARE_WRITE_CONFIRMED**;
6. **HARDWARE_DYNAMIC_CLOSED**.

Additional current classes:

- **READ_ONLY_STATUS** — passive observation is the correct validation model;
- **HARDWARE_STATIC_CONFIRMED** — rendered/current state matched, but dynamic closure is incomplete or not appropriate;
- **EVAL_ONLY_SAFE_ACTIONABLE** — a reversible test may run only from an exact server-confirmed baseline;
- **RESEARCH_OPEN / EVAL_ONLY** — capability exists, but transaction/ownership semantics remain unresolved;
- **CONFIGURATION_UNAVAILABLE** — current server-confirmed configuration says unavailable; this is not a permanent unsupported claim;
- **UNSUPPORTED/BLOCKED** — deliberately excluded from write-driven validation under the current safety/product contract;
- **PARTIAL** — instances within the public feedback definition have different closure states.

`UNKNOWN`, blank state, missing cache, `BASELINE_UNKNOWN`, `SKIP_BASELINE_UNKNOWN`, or `neverObserved` means **not observed in that client/session** unless stronger evidence proves otherwise. It never means unsupported by itself.

## Current retained aggregate evidence

Historical V8 baseline:

- public feedback definitions: **31**;
- feedback instances: **829**;
- original V8 static/oracle result: **190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- original V8 dynamic tracker: **20 both-state / 12 single-state / 710 neverObserved / 0 FAIL**.

Latest stronger 0.1.19 user-host evidence supersedes the older aggregate counts where they conflict:

- latest reconciled manual feedback sweep reportVersion 5: **51 transitions = 50 PASS + 1 TRANSIENT_RACE + 0 confirmed mismatch**;
- `input_air`: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- `input_pad`: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- `input_mode`: Inputs 1-2 retain dynamic closure;
- `monitor_dim`: **HARDWARE_DYNAMIC_CLOSED**;
- `monitor_mute`: **HARDWARE_DYNAMIC_CLOSED**;
- `monitor_talkback`: retain stronger prior closure despite one latest fast-reversal transient race;
- meters: **inputs 8/8 closed, outputs 22 closed in the current configuration, mixes 6/12 closed, persistent mismatch 0**;
- Outputs 21-24 / ADAT 2.1-2.4 are currently server-confirmed `available=false` and therefore **CONFIGURATION_UNAVAILABLE**, not unsupported.

The remaining Mix meter gaps are floor-only: **Mix B L/R, Mix C L/R, Mix E R, Mix F R**.

## 31-definition matrix

### 1. `connected`

**Evidence:** connection lifecycle is server status; static feedback has matched.

**Class:** READ_ONLY_STATUS.

**Remaining action:** no forced disconnect merely for coverage.

### 2. `authorised`

**Evidence:** current Focusrite Control Remote Devices state and module state have matched the canonical Companion client authorization flow.

**Class:** READ_ONLY_STATUS.

**Remaining action:** reuse the approved canonical client; do not reject/reapprove merely for coverage.

### 3. `monitor_mute`

**Evidence:** latest reportVersion 5 captured both state edges with server-confirmed PASS.

**Class:** **HARDWARE_DYNAMIC_CLOSED**.

**Remaining action:** no broad retest.

### 4. `monitor_dim`

**Evidence:** latest reportVersion 5 captured both state edges with server-confirmed PASS.

**Class:** **HARDWARE_DYNAMIC_CLOSED**.

**Remaining action:** no broad retest.

### 5. `monitor_talkback`

**Evidence:** older hardware run dynamically closed the path. Latest reportVersion 5 had one fast-reversal `TRANSIENT_RACE` plus inverse PASS and no persistent mismatch.

**Class:** **HARDWARE_DYNAMIC_CLOSED** retained from stronger evidence.

**Remaining action:** no retest solely because of the transient race.

### 6. `monitor_alt`

**Evidence:** product/UI and schema support exist; exact dynamic closure is incomplete.

**Class:** EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline and physical output isolation.

**Remaining action:** defer until an independently justified exact-restorable campaign.

### 7. `monitor_alt_enable`

**Evidence:** product/UI and schema support exist; exact dynamic closure is incomplete.

**Class:** EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline and physical output isolation.

**Remaining action:** same as `monitor_alt`.

### 8. `monitor_preset`

**Evidence:** prior V8 hardware run observed both states; Focusrite Control exposes Monitor Controls scope selection.

**Class:** **HARDWARE_DYNAMIC_CLOSED**.

**Remaining action:** no retest; reassignment can change output level abruptly.

### 9. `input_air`

**Evidence:** latest reportVersion 5 captured Analogue Inputs 1-8 in both states with PASS edges.

**Class:** **HARDWARE_DYNAMIC_CLOSED — 8/8**.

**Remaining action:** none for parent closure.

### 10. `input_pad`

**Evidence:** latest reportVersion 5 captured Analogue Inputs 1-8 in both states with PASS edges.

**Class:** **HARDWARE_DYNAMIC_CLOSED — 8/8**.

**Remaining action:** none for parent closure.

### 11. `input_available`

**Evidence:** current schema/server state exposes availability; static paths have matched.

**Class:** READ_ONLY_STATUS.

**Remaining action:** passive only.

### 12. `input_mode`

**Evidence:** Inputs 1-2 Line/Instrument paths have both-state hardware closure; later report preserved clean complementary transitions.

**Class:** **HARDWARE_DYNAMIC_CLOSED**.

**Remaining action:** no retest.

### 13. `input_meter`

**Evidence:** retained meter campaign has floor + real movement for all eight analogue input paths with zero persistent mismatch.

**Class:** **HARDWARE_DYNAMIC_CLOSED — 8/8**.

**Remaining action:** no retest for parent closure.

### 14. `output_mute`

**Evidence:** some output mute paths are hardware-confirmed; ownership/independence differs by output topology. Outputs 21-24 are currently `available=false`.

**Class:** PARTIAL — hardware-confirmed where eligible, EVAL_ONLY/withheld elsewhere.

**Remaining action:** revisit only individually eligible, server-available, exactly restorable paths. Never write current configuration-unavailable outputs.

### 15. `output_stereo`

**Evidence:** static coverage is broad; runtime mono/stereo topology is real, but pair/group transaction semantics are not fully closed across every output.

**Class:** PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY.

**Remaining action:** only targeted exact-restorable pair work; no blanket direct-member writes.

### 16. `output_source`

**Evidence:** many pair-aware routes are hardware-confirmed. Right members can be pair-owned aliases. A guarded Line 3-4 pair route toward Mix A produced `NO_CONFIRMED_TRANSITION` and exact Playback 3/4 restoration; this is not proof that output routing is globally broken. Outputs 21-24 are currently unavailable.

**Class:** PARTIAL — HARDWARE_DYNAMIC_CLOSED / HARDWARE_WRITE_CONFIRMED / STATIC / EVAL_ONLY depending on path.

**Remaining action:** do not repeat the same Mix-A-via-`source` attempt blindly. Use only validated pair-aware exact-restoration paths when independently justified.

### 17. `output_available`

**Evidence:** latest report confirms human Outputs 21-24 / ADAT 2.1-2.4 as `available=false` in the current configuration; other current output paths are available.

**Class:** READ_ONLY_STATUS; four current instances are **CONFIGURATION_UNAVAILABLE**.

**Remaining action:** follow server-confirmed availability dynamically. Never hardcode these outputs as permanently unavailable.

### 18. `output_meter`

**Evidence:** retained campaigns now close **22 paths** with required floor/movement evidence in the current configuration and zero persistent mismatch. Outputs 21-24 are `available=false`.

**Class:** **22 HARDWARE_DYNAMIC_CLOSED / 4 CONFIGURATION_UNAVAILABLE** in the current configuration.

**Remaining action:** no write-driven meter closure is allowed for Outputs 21-24 in this configuration. A future configuration where they become available would require new real-hardware validation.

### 19. `mixer_slot_stereo`

**Evidence:** official Focusrite Control UI proves runtime mono/stereo topology exists. Older direct single-item writes did not establish useful semantics. 0.1.18 research correctly withheld topology writes when the exact original state was server-UNKNOWN.

**Class:** **RESEARCH_OPEN / EVAL_ONLY**.

**Remaining action:** do not write topology while the original state is unknown. Do not escalate to raw writes.

### 20. `mixer_slot_source`

**Evidence:** official UI proves source selection exists; old direct single-item source writes did not establish the official grouped transaction semantics. Current research observes source identity but keeps generic/public/raw writes withheld.

**Class:** **RESEARCH_OPEN / EVAL_ONLY**.

**Remaining action:** continue only through evidence-based grouped/transaction research; no blind single-item/raw write.

### 21. `mix_mute`

**Evidence:** Mix A Left was dynamically closed with server variable + rendered feedback `false -> true -> false` and exact restoration. Mix A Right direct write did not transition under the tested stereo topology and restored exactly. Mix B-F remain open where exact state/topology evidence is insufficient.

**Class:** PARTIAL — **Mix A Left HARDWARE_DYNAMIC_CLOSED; topology-dependent/open elsewhere**.

**Remaining action:** resume only from an exact server-confirmed changed-property baseline; no blind routing fallback.

### 22. `mix_solo`

**Evidence:** same current topology/evidence pattern as `mix_mute`; Mix A Left dynamically closed, direct-right attempt did not transition under tested stereo topology and restored exactly.

**Class:** PARTIAL — **Mix A Left HARDWARE_DYNAMIC_CLOSED; topology-dependent/open elsewhere**.

**Remaining action:** same baseline/restoration rule as `mix_mute`.

### 23. `mix_talkback`

**Evidence:** product/schema support exists, but current lane-item write semantics are not sufficiently established for a generic write campaign.

**Class:** PARTIAL HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for the current write campaign.

**Remaining action:** keep withheld. Do not infer `assign-talkback-mix` semantics from UI or assign-mix research.

### 24. `mix_meter`

**Evidence:** retained read-only meter evidence now closes **6/12** lanes with floor + movement and zero persistent mismatch. Remaining lanes are already movement-observed and need only floor evidence: Mix B L/R, Mix C L/R, Mix E R, Mix F R.

**Class:** PARTIAL — **6 HARDWARE_DYNAMIC_CLOSED / 6 MANUAL_PENDING floor-only**.

**Remaining action:** prefer read-only floor capture from existing routing. Do not force routing merely to improve meter score.

### 25. `device_preset`

**Evidence:** preset recall changes routing broadly and was deliberately excluded from FULL dynamic validation.

**Class:** UNSUPPORTED/BLOCKED for normal dynamic closure.

**Remaining action:** do not recall presets merely for feedback coverage.

### 26. `clock_source`

**Evidence:** static/server state is understood; changing clock source is intentionally disruptive.

**Class:** HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically.

**Remaining action:** do not change clock source merely for feedback coverage.

### 27. `sample_rate`

**Evidence:** static/server state is understood; sample-rate changes are intentionally disruptive.

**Class:** HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically.

**Remaining action:** do not interrupt audio merely for feedback coverage.

### 28. `spdif_mode`

**Evidence:** static/server state is understood; digital-I/O mode changes can require restart/reconfiguration.

**Class:** HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically.

**Remaining action:** do not change mode/restart merely for feedback coverage.

### 29. `clock_locked`

**Evidence:** read-only device status has matched server state.

**Class:** READ_ONLY_STATUS.

**Remaining action:** passive only.

### 30. `talkback_source`

**Evidence:** prior hardware run observed both states; UI corroborates the product feature.

**Class:** **HARDWARE_DYNAMIC_CLOSED**.

**Remaining action:** no retest.

### 31. `phantom_persistence`

**Evidence:** prior hardware run observed both states; UI shows `Retain 48V`, consistent with persistence rather than per-channel phantom switching.

**Class:** **HARDWARE_DYNAMIC_CLOSED**.

**Remaining action:** no retest; never reinterpret as per-channel phantom power.

## Output `assign-mix` research note — outside the 31 public feedback definitions

`assign-mix` is **not** a public feedback/action. It is a schema-observed output control used only to investigate routing/materialisation.

Latest explicit user-host evidence:

- output assign-mix descriptor/schema coverage: **26/26 SCHEMA_PRESENT**;
- server-observed value coverage: **0/26**;
- every output remained `UNKNOWN[never-observed]`;
- this includes **Monitor Outputs 1-2 while Focusrite Control visibly showed Mix A L/R routing**;
- therefore visible routing must not be translated into an inferred assign-mix value;
- raw value semantics: **UNKNOWN**;
- official write transaction semantics: **UNKNOWN**;
- writable IDs: excluded;
- public action/preset/feedback: absent;
- Advanced Raw: absent;
- 0.1.19 exposes only opaque read-only equality class/provenance diagnostics behind the existing diagnostic variable gate;
- sanitized reports do not store raw assign-mix values or item IDs.

`NAVIGATE_MIXES` was a passive historical observation mode. Its 30-second countdown did not require writes or fader/routing changes, and it does not need to be repeated for the current objective.

No `assign-mix` write is permitted from this evidence alone.

## Current targeted routing research

`testbench/OutputRoutingLine34Capture.js` and `testbench/RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd` are software-gate validated at user-host HEAD `9127b0634a0999a5409be38afb393c1ab14783b4`.

Purpose: determine whether ordinary Focusrite Control **Stereo** and direct **Source** changes on Line Outputs 3-4 cause assign-mix to materialise, without adding any unknown write path.

Safety contract:

- read-only harness; zero Focusrite writes and zero Companion presses;
- user performs only explicitly prompted UI changes;
- exact source/stereo restoration is verified after each phase;
- if assign-mix remains unknown after Source restoration, the harness safe-stops before Custom Mix with `CUSTOM_MIX_BLOCKED_ASSIGN_MIX_BASELINE_UNKNOWN`;
- Custom Mix is allowed only if assign-mix baseline becomes known;
- any restoration failure is a hard abort/quarantine.

## Parent-objective completion rule

The feedback parent objective is complete only when every row is either:

- dynamically closed where meaningful and safe;
- correctly passive/read-only;
- positively shown non-actionable under exact-restoration/safety evidence; or
- deliberately blocked under the validated product/safety policy.

A green software gate, complete inventory, or one closed sub-question does not close the parent matrix.

## Immediate next step

Do **not** rerun FULL, `NAVIGATE_MIXES`, the completed passive assign-mix observation, the old broad meter-routing campaign, or the same Mix-A-via-`source` attempt.

1. synchronize `testbench/meter-routing-exact-restore` if needed;
2. run only `testbench\RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd`;
3. follow only its Line 3-4 prompts;
4. if it safe-stops because assign-mix remains UNKNOWN, do not force Custom Mix; preserve/send the report/console result;
5. otherwise preserve/send `testbench\results\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json`;
6. after that, reconcile remaining Mixer topology evidence and the six Mix meter floor-only paths without a new broad sweep.
