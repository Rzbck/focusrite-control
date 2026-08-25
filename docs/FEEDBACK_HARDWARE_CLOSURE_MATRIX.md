# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-25

This is the parent hardware-validation checklist for the **31 public Companion feedback definitions**. It separates static/oracle agreement, official/schema evidence, session readback, implementation, hardware write confirmation, and full dynamic closure.

A feedback is not dynamically closed merely because a software test passes, V8 rendered its current state correctly, the inventory is complete, or one client session did not materialise a current value.

## Evidence/inference rule

Keep these levels separate:

1. **OFFICIAL PRODUCT BEHAVIOUR**;
2. **SCHEMA_PRESENT**;
3. **SESSION_STATE_OBSERVED**;
4. **IMPLEMENTED**;
5. **HARDWARE_WRITE_CONFIRMED**;
6. **HARDWARE_DYNAMIC_CLOSED**.

`UNKNOWN`, blank state, missing cache, `BASELINE_UNKNOWN`, `SKIP_BASELINE_UNKNOWN`, or sparse device-arrival state means only **not observed in that client session** unless stronger evidence proves otherwise. It is not proof of `false`, absence, unsupported hardware, or permanent non-actionability.

## Retained historical facts

- public feedback definitions: **31**;
- feedback instances: **829**;
- original V8 static/oracle result: **190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- original V8 dynamic tracker: **20 both-state / 12 single-state / 710 neverObserved / 0 FAIL**;
- later meter movement closure: **14/46** — inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0;
- targeted Core run: **18/18 `SKIP_BASELINE_UNKNOWN`**, zero writes/FAIL/restore quarantine — readback evidence only;
- dedicated Mix run on 2026-08-24 dynamically closed two Mix A Left instances and safely restored two failed direct-right stereo attempts;
- latest 0.1.18 Mix bootstrap attempt stopped before the first write because its TestBench still required paired Playback channels to occupy adjacent mixer-slot numbers. Hardware writes were **0**; this was a tooling-selection blocker, not a hardware capability result.

## Classification vocabulary

- **HARDWARE_DYNAMIC_CLOSED** — relevant state transition and Companion feedback were observed against server-confirmed state, with exact restore where applicable.
- **HARDWARE_STATIC_CONFIRMED** — current rendered feedback matched server state, but dynamic closure is incomplete.
- **EVAL_ONLY_SAFE_ACTIONABLE** — a targeted reversible test may run only when the exact needed baseline is known.
- **RESEARCH_OPEN / EVAL_ONLY** — the product/schema evidence exists, but readback or write semantics are unresolved.
- **READ_ONLY_STATUS** — passive server observation is the correct validation model.
- **UNSUPPORTED/BLOCKED** — deliberately excluded from write-driven validation under current positive safety/evidence constraints.
- **PARTIAL** — different instances of the same public feedback definition have different closure states.

## 31-definition matrix

### 1. `connected`

**Evidence:** V8 static 1/1 PASS; connection lifecycle is server status.

**Class:** READ_ONLY_STATUS.

**Remaining action:** no forced disconnect merely for coverage.

### 2. `authorised`

**Evidence:** V8 static 1/1 PASS; current Focusrite Control UI showed the existing `Companion Scarlett 18i20` approved.

**Class:** READ_ONLY_STATUS.

**Remaining action:** reuse the canonical client; do not reject/reapprove merely for coverage.

### 3. `monitor_mute`

**Evidence:** V8 EVAL_ONLY; targeted session baseline missing. Official/UI evidence confirms real Monitor Mute.

**Class:** EVAL_ONLY / READBACK_UNRESOLVED.

**Remaining action:** test only from a server-confirmed baseline with physical monitor/headphone isolation.

### 4. `monitor_dim`

**Evidence:** V8 EVAL_ONLY; targeted session baseline missing. Official/UI evidence confirms real DIM.

**Class:** EVAL_ONLY / READBACK_UNRESOLVED.

**Remaining action:** same exact-baseline and physical-isolation rule.

### 5. `monitor_talkback`

**Evidence:** V8 dynamic both states 1/1.

**Class:** HARDWARE_DYNAMIC_CLOSED.

**Remaining action:** no retest.

### 6. `monitor_alt`

**Evidence:** V8 EVAL_ONLY; UI shows Speaker Switching/ALT.

**Class:** EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline.

**Remaining action:** defer until exact baseline and physical output isolation.

### 7. `monitor_alt_enable`

**Evidence:** V8 EVAL_ONLY; UI shows Speaker Switching Enable/Disable.

**Class:** EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline.

**Remaining action:** same; do not toggle merely to materialise state.

### 8. `monitor_preset`

**Evidence:** V8 dynamic both states 1/1; UI shows Monitor Controls scopes.

**Class:** HARDWARE_DYNAMIC_CLOSED.

**Remaining action:** no retest; Focusrite warns reassignment can change output level abruptly.

### 9. `input_air`

**Evidence:** eight instances; V8 dynamic never; targeted session baselines missing; official/UI evidence confirms Air on Analogue 1-8.

**Class:** EVAL_ONLY / READBACK_UNRESOLVED.

**Remaining action:** property-specific exact-baseline test only; never assume missing = false.

### 10. `input_pad`

**Evidence:** eight instances; V8 dynamic never; targeted session baselines missing; official/UI evidence confirms Pad on Analogue 1-8.

**Class:** EVAL_ONLY / READBACK_UNRESOLVED.

**Remaining action:** same.

### 11. `input_available`

**Evidence:** V8 static 8/8 PASS.

**Class:** READ_ONLY_STATUS.

**Remaining action:** passive only.

### 12. `input_mode`

**Evidence:** V8 dynamic both states 4/4; official/UI evidence confirms Line/Instrument only on Analogue 1-2.

**Class:** HARDWARE_DYNAMIC_CLOSED.

**Remaining action:** no retest.

### 13. `input_meter`

**Evidence:** later meter campaign closed 8/8 with floor and real movement.

**Class:** HARDWARE_DYNAMIC_CLOSED.

**Remaining action:** no retest.

### 14. `output_mute`

**Evidence:** V8 7 PASS / 19 EVAL_ONLY; ownership/readback complications remain; outputs 21-24 availability UNKNOWN.

**Class:** PARTIAL — mostly EVAL_ONLY / unresolved.

**Remaining action:** revisit only individually eligible, available, exactly restorable paths.

### 15. `output_stereo`

**Evidence:** V8 static 26/26 PASS; dynamic coverage sparse; some pair reconstruction semantics unresolved.

**Class:** PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY.

**Remaining action:** retest only specifically proven exact-restorable pair semantics.

### 16. `output_source`

**Evidence:** V8 static 26/26 PASS; many pair-aware paths write-confirmed; right members can be pair-owned aliases; outputs 21-24 availability UNKNOWN. The module already implements `output_pair_source` (`Output: Route stereo pair`) and the V8 harness already has pair Test/None/Restore operations with exact left/right source restoration.

**Class:** PARTIAL — HARDWARE_DYNAMIC_CLOSED / HARDWARE_STATIC_CONFIRMED / no-write UNKNOWN.

**Remaining action:** use only existing validated pair-aware exact-restore mechanisms for eligible gaps. The new Mix materialisation fallback may temporarily use `output_pair_source` on one eligible **non-Monitor** pair; this new use is IMPLEMENTED but hardware pending and does not change the closure class yet.

### 17. `output_available`

**Evidence:** V8 static 22 PASS / 4 EVAL_ONLY.

**Class:** READ_ONLY_STATUS.

**Remaining action:** four explicit UNKNOWN availability outputs receive no writes.

### 18. `output_meter`

**Evidence:** V8 static 26/26 PASS; later movement closure 4/26.

**Class:** PARTIAL — 4 HARDWARE_DYNAMIC_CLOSED / 22 open.

**Remaining action:** prefer passive/natural signal or already-proven exact-restore routing.

### 19. `mixer_slot_stereo`

**Evidence:** V8 static 24/24 PASS. Old direct **single-item** stereo writes on tested slots 3-4 produced no useful transition. Newer Focusrite Control UI proves runtime mono/stereo topology is configurable. Research 0.1.18 implements a paired exact-restore TestBench path. The latest hardware attempt never reached this write because the TestBench wrongly required `Playback 1` and `Playback 2` to occupy adjacent mixer-slot numbers; hardware writes were 0. That slot-adjacency assumption is now removed: channel pairing is based on runtime `Playback N` identity, independent of slot number.

**Class:** **RESEARCH_OPEN / EVAL_ONLY**.

**Remaining action:** pass the current user-host software gate, then run one guarded runtime-channel-pair topology/materialisation attempt. If no useful transition occurs, exact-restore and preserve that evidence; do not call capability absent and do not escalate to raw writes.

### 20. `mixer_slot_source`

**Evidence:** V8 static 16 PASS / 8 EVAL_ONLY. Old direct **single-item** source writes on tested slots 1-4 produced no useful transition. Official UI proves source/topology selection exists, but server transaction semantics remain unresolved. Current research does **not** write `mixer_slot_source`; it monitors source IDs/names only as state/collateral evidence.

**Class:** **RESEARCH_OPEN / EVAL_ONLY**.

**Remaining action:** keep generic/public/raw source writes withheld. Runtime Playback pairing now uses server-observed source names rather than assuming slot adjacency.

### 21. `mix_mute`

**Evidence:** official docs and schema confirm per-strip Mute. Dedicated 0.1.17 hardware run dynamically closed Mix A Left with server variable plus rendered feedback `false -> true -> false` and exact restore. Mix A Right direct write did not transition under the tested stereo topology but restored exactly. Mix B-F baselines remain sparse/open. The latest 0.1.18 run performed **zero writes** because the pre-materialisation target selector stopped on its obsolete slot-adjacency rule.

**Class:** **PARTIAL — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right topology-dependent research open; Mix B-F open**.

**Remaining action:** run the corrected two-path materialisation workflow (runtime Playback channel pairing, then non-Monitor `output_pair_source` fallback only if needed) and continue to Mute closure only if an exact baseline appears.

### 22. `mix_solo`

**Evidence:** official docs and schema confirm per-strip Solo. Dedicated 0.1.17 hardware run dynamically closed Mix A Left with server variable plus rendered feedback `false -> true -> false` and exact restore. Mix A Right direct write did not transition under the tested stereo topology but restored exactly. Mix B-F baselines remain sparse/open. Latest 0.1.18 attempt made zero hardware writes for the same TestBench-selection blocker as Mute.

**Class:** **PARTIAL — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right topology-dependent research open; Mix B-F open**.

**Remaining action:** same corrected materialisation workflow; no manual Solo materialisation and no blind repeat after a two-path `NO-OP SAFE`.

### 23. `mix_talkback`

**Evidence:** V8 6 PASS / 6 EVAL_ONLY; left-lane no-effect evidence; UI/official docs confirm Custom Mix + Talkback product mode but not lane-item write semantics.

**Class:** PARTIAL HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for the current write campaign.

**Remaining action:** keep withheld; do not infer `assign-talkback-mix` semantics from UI.

### 24. `mix_meter`

**Evidence:** V8 7 PASS / 5 EVAL_ONLY; later meter movement closure 2/12.

**Class:** PARTIAL — 2 HARDWARE_DYNAMIC_CLOSED / 10 open.

**Remaining action:** Mix A L/R closed; prefer passive/natural signal for Mix B-F.

### 25. `device_preset`

**Evidence:** FULL deliberately excludes preset recall because it changes routing broadly.

**Class:** UNSUPPORTED/BLOCKED for normal dynamic closure.

**Remaining action:** do not recall presets merely for feedback coverage.

### 26. `clock_source`

**Evidence:** V8 static PASS; FULL excludes clock changes.

**Class:** HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically.

**Remaining action:** do not change clock source merely for feedback coverage.

### 27. `sample_rate`

**Evidence:** V8 static PASS; FULL excludes sample-rate changes.

**Class:** HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically.

**Remaining action:** do not interrupt audio merely for feedback coverage.

### 28. `spdif_mode`

**Evidence:** V8 static PASS; FULL excludes digital-I/O mode changes.

**Class:** HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically.

**Remaining action:** do not change mode/restart merely for feedback coverage.

### 29. `clock_locked`

**Evidence:** V8 static 1/1 PASS; read-only device status.

**Class:** READ_ONLY_STATUS.

**Remaining action:** passive only.

### 30. `talkback_source`

**Evidence:** V8 dynamic both states 1/1; UI corroborates the product feature.

**Class:** HARDWARE_DYNAMIC_CLOSED.

**Remaining action:** no retest.

### 31. `phantom_persistence`

**Evidence:** V8 dynamic both states 1/1; UI shows `Retain 48V`, consistent with persistence rather than per-channel switching.

**Class:** HARDWARE_DYNAMIC_CLOSED.

**Remaining action:** no retest; never reinterpret as per-channel phantom.

## Mix/readback chronology and corrected interpretation

1. an earlier normal Companion session had exact Mix A Left/Right Playback-strip gain/mute/solo state;
2. a later tuple-based targeted run had 0/12 complete tuples and therefore made zero writes;
3. 0.1.17 provenance instrumentation proved some Mix state was later-`set` while other state was never observed in that client session;
4. official Focusrite Control interaction materialised additional Mix A state, proving the missing cache was conditional rather than capability absence;
5. the later automated Mix closure dynamically closed Mix A Left Mute and Solo and safely showed that direct-right writes did not transition under the tested **stereo** topology;
6. later UI evidence proved Playback presentation can be changed between separate mono channels and linked stereo pairs;
7. therefore the direct-right failure cannot be promoted into a global right-lane ownership/unsupported claim;
8. old mixer-slot `noEffect` evidence is narrowed to **single-item writes only**;
9. the first 0.1.18 autonomous materialisation run stopped before write because its algorithm still conflated Playback channel pairing with mixer-slot adjacency;
10. the safe stop therefore supplied no hardware evidence about paired topology writes;
11. TestBench now pairs `Playback 1` with `Playback 2` by runtime channel identity even on nonadjacent slots;
12. if that path still does not materialise Mix state, the same launcher may use the existing pair-aware `output_pair_source` mechanism on one safe non-Monitor output pair, restore exact left/right source state, then recapture Mix state.

The current open hypothesis is not “does mono/stereo exist?” It is **which safe Control Server/Companion operation causes the needed state transition/materialisation, and whether right-lane Mute/Solo semantics depend on topology**.

## Current 0.1.18 two-path research workflow

The 0.1.18 module itself remains the already loaded research package; latest changes are TestBench/tests/docs only.

### Path A — Playback topology materialisation

- runtime Playback candidates read from server-confirmed source/name/stereo variables;
- canonical Playback channel pairing by names, not slot adjacency;
- paired `mixer_slot_stereo` actions only;
- exact source/topology restore mandatory;
- no `mixer_slot_source`, raw or direct TCP write.

### Path B — output-pair routing fallback

Used only if Path A returns `NO-OP SAFE`:

- discovers one server-observed Mix A L source;
- Monitor Outputs 1-2 excluded from automatic fallback;
- Line Outputs 3-4 preferred only if eligible/exact-restorable; otherwise another eligible non-Monitor pair;
- explicit UNKNOWN/UNAVAILABLE availability never written;
- one temporary `output_pair_source` action routes the pair to Mix A;
- server confirms Mix A L/R route;
- existing V8 exact pair restore returns both original output source values;
- restore failure = HARD ABORT;
- fresh Mix snapshot after exact restore;
- exact baseline appears → continue; otherwise final `NO-OP SAFE`.

No public capability is promoted merely because these paths are implemented.

## Targeted Core result retained

The 2026-08-24 Core run had 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes, zero FAIL, zero restore quarantine. That is a session/readback observation only. Official/UI evidence still corroborates Air/Pad and Monitor controls as real product functions.

## Parent-objective completion rule

The feedback parent objective is complete only when every row is either dynamically closed where meaningful/safe, correctly passive/read-only, positively shown non-actionable under exact-restoration/safety evidence, or deliberately blocked under current validated policy.

A green software gate, complete inventory, or one closed sub-question does not close this parent matrix.

## Immediate next step

Do **not** rerun FULL, repeat the old tuple campaign, manually switch Playback topology, or manually materialise Mute/Solo.

1. keep the existing authorised 0.1.18 Companion connection selected;
2. run `UPDATE_AND_RUN.bat` on `testbench/meter-routing-exact-restore`;
3. require dependencies, Prettier, ESLint, source manifest, **all Node tests**, and package build PASS;
4. no package re-import is required solely for these latest TestBench/tests/docs changes if the gate is green;
5. pause playback and physically isolate/safeguard Monitor/speakers/headphones;
6. run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`;
7. use PAGE2_AUTO only if positively recognized;
8. confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`, and touch nothing afterward;
9. preserve the complete output including both materialisation paths, exact restore lines and final Mix closure summary;
10. HARD ABORT/restore quarantine stops all further hardware testing; a final two-path `NO-OP SAFE` is valid evidence and must not be repeated blindly.
