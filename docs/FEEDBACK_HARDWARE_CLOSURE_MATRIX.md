# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-24

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
- dedicated Mix run on 2026-08-24 dynamically closed two Mix A Left instances and safely restored two failed direct-right stereo attempts; this stronger evidence is recorded below without rewriting the old V8 tracker counts.

## Classification vocabulary

- **HARDWARE_DYNAMIC_CLOSED** — relevant state transition and Companion feedback were observed against server-confirmed state, with exact restore where applicable.
- **HARDWARE_STATIC_CONFIRMED** — current rendered feedback matched server state, but dynamic closure is incomplete.
- **EVAL_ONLY_SAFE_ACTIONABLE** — a targeted reversible test may run only when the exact needed baseline is known.
- **RESEARCH_OPEN / EVAL_ONLY** — the product/schema evidence exists, but readback or write semantics are unresolved.
- **READ_ONLY_STATUS** — passive server observation is the correct validation model.
- **UNSUPPORTED/BLOCKED** — deliberately excluded from write-driven validation under current positive safety/evidence constraints.
- **PARTIAL** — different instances of the same public feedback definition have different closure states.

## 31-definition matrix

| # | Feedback | Current evidence | Current class | Remaining action |
| ---: | --- | --- | --- | --- |
| 1 | `connected` | V8 static 1/1 PASS; connection lifecycle is server status. | READ_ONLY_STATUS | No forced disconnect merely for coverage. |
| 2 | `authorised` | V8 static 1/1 PASS; current Focusrite Control UI showed existing `Companion Scarlett 18i20` approved. | READ_ONLY_STATUS | Reuse canonical client; do not reject/reapprove merely for coverage. |
| 3 | `monitor_mute` | V8 EVAL_ONLY; targeted session baseline missing. Official/UI evidence confirms real Monitor Mute. | EVAL_ONLY / READBACK_UNRESOLVED | Test only from server-confirmed baseline with physical monitor/headphone isolation. |
| 4 | `monitor_dim` | V8 EVAL_ONLY; targeted session baseline missing. Official/UI evidence confirms real DIM. | EVAL_ONLY / READBACK_UNRESOLVED | Same exact-baseline + physical-isolation rule. |
| 5 | `monitor_talkback` | V8 dynamic both states 1/1. | HARDWARE_DYNAMIC_CLOSED | No retest. |
| 6 | `monitor_alt` | V8 EVAL_ONLY; UI shows Speaker Switching/ALT. | EVAL_ONLY_SAFE_ACTIONABLE only with known baseline | Defer until exact baseline + physical output isolation. |
| 7 | `monitor_alt_enable` | V8 EVAL_ONLY; UI shows Speaker Switching Enable/Disable. | EVAL_ONLY_SAFE_ACTIONABLE only with known baseline | Same; do not toggle merely to materialise state. |
| 8 | `monitor_preset` | V8 dynamic both states 1/1; UI shows Monitor Controls scopes. | HARDWARE_DYNAMIC_CLOSED | No retest; Focusrite warns reassignment can change output level abruptly. |
| 9 | `input_air` | 8 instances; V8 dynamic never; targeted session baselines missing; official/UI evidence confirms Air on Analogue 1-8. | EVAL_ONLY / READBACK_UNRESOLVED | Property-specific exact-baseline test only; never assume missing = false. |
| 10 | `input_pad` | 8 instances; V8 dynamic never; targeted session baselines missing; official/UI evidence confirms Pad on Analogue 1-8. | EVAL_ONLY / READBACK_UNRESOLVED | Same. |
| 11 | `input_available` | V8 static 8/8 PASS. | READ_ONLY_STATUS | Passive only. |
| 12 | `input_mode` | V8 dynamic both states 4/4; official/UI evidence confirms Line/Instrument only on Analogue 1-2. | HARDWARE_DYNAMIC_CLOSED | No retest. |
| 13 | `input_meter` | Later meter campaign closed 8/8 with floor + real movement. | HARDWARE_DYNAMIC_CLOSED | No retest. |
| 14 | `output_mute` | V8 7 PASS / 19 EVAL_ONLY; ownership/readback complications remain; outputs 21-24 availability UNKNOWN. | PARTIAL — mostly EVAL_ONLY / unresolved | Revisit only individually eligible, available, exactly restorable paths. |
| 15 | `output_stereo` | V8 static 26/26 PASS; dynamic coverage sparse; some pair reconstruction semantics unresolved. | PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY | Retest only specifically proven exact-restorable pair semantics. |
| 16 | `output_source` | V8 static 26/26 PASS; many pair-aware paths write-confirmed; right members can be pair-owned aliases; outputs 21-24 availability UNKNOWN. | PARTIAL — HARDWARE_DYNAMIC_CLOSED / HARDWARE_STATIC_CONFIRMED / no-write UNKNOWN | Use only existing validated pair-aware path for exact eligible gaps. |
| 17 | `output_available` | V8 static 22 PASS / 4 EVAL_ONLY. | READ_ONLY_STATUS | Four explicit UNKNOWN availability outputs receive no writes. |
| 18 | `output_meter` | V8 static 26/26 PASS; later movement closure 4/26. | PARTIAL — 4 HARDWARE_DYNAMIC_CLOSED / 22 open | Prefer passive/natural signal or already-proven exact-restore routing. |
| 19 | `mixer_slot_stereo` | V8 static 24/24 PASS; old direct **single-item** stereo writes on tested slots 3-4 produced no useful transition. Newer Focusrite Control UI proves runtime mono/stereo topology is configurable. Generic/public and raw writes remain withheld. Research 0.1.18 implements a paired two-action exact-restore TestBench path, not yet hardware-run. | **RESEARCH_OPEN / EVAL_ONLY** | Validate 0.1.18 software gate, then one guarded paired-slot topology run. If no useful transition, restore and move research to official-client grouped/atomic-set semantics; do not call capability absent. |
| 20 | `mixer_slot_source` | V8 static 16 PASS / 8 EVAL_ONLY; old direct **single-item** source writes on tested slots 1-4 produced no useful transition. Official UI proves source/topology selection exists, but server transaction semantics remain unresolved. 0.1.18 does **not** write source; it only monitors source IDs/names as collateral state. | **RESEARCH_OPEN / EVAL_ONLY** | Keep generic/public/raw source writes withheld. Investigate only if paired stereo testing proves source mutation is part of the official grouped semantics. |
| 21 | `mix_mute` | Official docs + schema confirm per-strip Mute. Dedicated 0.1.17 hardware run: Mix A Left server variable + rendered feedback `false -> true -> false`, exact restore = closed. Mix A Right direct write did not transition under tested stereo topology but restored exactly. Mix B-F baselines remain sparse/open. | **PARTIAL — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right topology-dependent research open; Mix B-F open** | Run the 0.1.18 autonomous mono→paired-stereo→restore differential once software-gated. No more manual mono/stereo switching. |
| 22 | `mix_solo` | Official docs + schema confirm per-strip Solo. Dedicated 0.1.17 hardware run: Mix A Left server variable + rendered feedback `false -> true -> false`, exact restore = closed. Mix A Right direct write did not transition under tested stereo topology but restored exactly. Mix B-F baselines remain sparse/open. | **PARTIAL — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right topology-dependent research open; Mix B-F open** | Same autonomous 0.1.18 topology differential; no obsolete manual Solo materialisation step. |
| 23 | `mix_talkback` | V8 6 PASS / 6 EVAL_ONLY; left-lane no-effect evidence; UI/official docs confirm Custom Mix + Talkback product mode but not lane-item write semantics. | PARTIAL HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for current write campaign | Keep withheld; do not infer `assign-talkback-mix` semantics from UI. |
| 24 | `mix_meter` | V8 7 PASS / 5 EVAL_ONLY; later meter movement closure 2/12. | PARTIAL — 2 HARDWARE_DYNAMIC_CLOSED / 10 open | Mix A L/R closed; prefer passive/natural signal for Mix B-F. |
| 25 | `device_preset` | FULL deliberately excludes preset recall because it changes routing broadly. | UNSUPPORTED/BLOCKED for normal dynamic closure | Do not recall presets merely for feedback coverage. |
| 26 | `clock_source` | V8 static PASS; FULL excludes clock changes. | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically | Do not change clock source merely for feedback coverage. |
| 27 | `sample_rate` | V8 static PASS; FULL excludes sample-rate changes. | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically | Do not interrupt audio merely for feedback coverage. |
| 28 | `spdif_mode` | V8 static PASS; FULL excludes digital-I/O mode changes. | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically | Do not change mode/restart merely for feedback coverage. |
| 29 | `clock_locked` | V8 static 1/1 PASS; read-only device status. | READ_ONLY_STATUS | Passive only. |
| 30 | `talkback_source` | V8 dynamic both states 1/1; UI corroborates product feature. | HARDWARE_DYNAMIC_CLOSED | No retest. |
| 31 | `phantom_persistence` | V8 dynamic both states 1/1; UI shows `Retain 48V`, consistent with persistence rather than per-channel switching. | HARDWARE_DYNAMIC_CLOSED | No retest; never reinterpret as per-channel phantom. |

## Mix/readback chronology and corrected interpretation

The project intentionally retains the chronology because it explains why older conclusions were wrong:

1. an earlier normal Companion session had exact Mix A Left/Right Playback-strip gain/mute/solo state;
2. a later tuple-based targeted run had 0/12 complete tuples and therefore made zero writes;
3. 0.1.17 provenance instrumentation proved some Mix state was later-`set` while other state was never observed in that client session;
4. official Focusrite Control interaction materialised additional Mix A state, proving the missing cache was conditional rather than capability absence;
5. the later automated Mix closure then dynamically closed Mix A Left Mute and Solo and safely demonstrated that direct-right writes did not transition under the tested **stereo** topology;
6. subsequent UI evidence proved the Playback presentation can be changed between separate mono channels and linked stereo pairs;
7. therefore the direct-right failure cannot be promoted into a global right-lane ownership/unsupported claim;
8. the old mixer-slot `noEffect` evidence is also narrowed to **single-item writes only** because the official UI proves the topology itself is configurable.

The current open hypothesis is not “does mono/stereo exist?” It is **which Control Server pair/group/transaction semantics reproduce the official topology safely**.

## 0.1.18 autonomous research path

Research build 0.1.18 is source-implemented specifically to remove manual topology switching from the final differential test.

Safety contract:

- normal/public `mixer_slot_source` remains hidden;
- normal/public/raw mixer-slot source/stereo remain withheld by hardware policy;
- `mixer_slot_stereo` appears only under the existing diagnostic mixer-variable option in the research build;
- it permits explicit `on`/`off` only and refuses unknown current state;
- TestBench dynamically finds the adjacent Playback mate rather than hardcoding slots 3/4;
- one Companion button step contains exactly two `mixer_slot_stereo` actions;
- source IDs/names are monitored but never written;
- server-confirmed topology transition is required before stereo Mix testing;
- exact dual-slot topology + source restoration is mandatory;
- restore failure hard-aborts/quarantines;
- no raw/direct TCP helper exists in this path.

Status: **SOURCE_IMPLEMENTED / SOFTWARE-GATE-PENDING / HARDWARE-PENDING**. Do not promote `mixer_slot_stereo` or the Mix Right instances based on implementation alone.

## Targeted Core result retained

The 2026-08-24 Core run had 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes, zero FAIL, zero restore quarantine. That is a session/readback observation only. Official/UI evidence still corroborates Air/Pad and Monitor controls as real product functions.

## Parent-objective completion rule

The feedback parent objective is complete only when every row is either dynamically closed where meaningful/safe, correctly passive/read-only, positively shown non-actionable under exact-restoration/safety evidence, or deliberately blocked under current validated policy.

A green software gate, complete inventory, or one closed sub-question does not close this parent matrix.

## Immediate next step

Do **not** rerun FULL, repeat the old tuple campaign, repeat manual Mute/Solo materialisation, or manually switch Playback 1/2 back to stereo.

The next operator sequence is:

1. run `UPDATE_AND_RUN.bat` on `testbench/meter-routing-exact-restore` and choose the current branch;
2. require the complete 0.1.18 gate to pass: dependencies, Prettier, ESLint, source manifest, all Node tests, package build;
3. only after that green user-host gate, import/select `focusrite-scarlett-18i20-0.1.18.tgz` on the **existing authorised Companion Focusrite connection**;
4. keep/enable the existing diagnostic `Expose all mixer slot variables` option for this research build;
5. leave Playback 1 and Playback 2 in their current separate **mono** state;
6. run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`;
7. confirm `MIX_FEEDBACK` and `ALL_ISOLATED` once;
8. touch nothing in Focusrite Control while TestBench performs current-topology Mute/Solo, guarded paired stereo attempt, stereo pair test if confirmed, and exact original mono/source restore.

If paired normal Companion actions still do not produce a useful topology transition, preserve the exact restored result and investigate official-client grouped/atomic multi-item `<set>` semantics next. Do not escalate to raw writes.
