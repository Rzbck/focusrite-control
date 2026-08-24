# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-24

This matrix is the parent hardware-validation checklist for the 31 public Companion feedback definitions.

It deliberately separates **static oracle agreement**, **schema/documentation evidence**, **session readback**, and **dynamic hardware closure**. A feedback is not dynamically closed merely because the V8 sweep rendered the correct current state, the inventory is complete, a software test passes, or one session failed to materialise a baseline.

Evidence used:

- completed V8 hardware report `docs/hardware-results/LATEST_SHAREABLE.json`;
- V8 transition tracker (`feedbackDynamic`);
- later dedicated meter-closure evidence;
- completed read-only Mix baseline observations;
- targeted Core feedback-closure run on 2026-08-24;
- targeted Mix mute/solo run on 2026-08-24;
- current production feedback/action definitions and 18i20 schema parser;
- Focusrite official Scarlett 3rd Gen / Focusrite Control documentation;
- independent Control Server research, kept explicitly research-only where not 18i20 hardware-tested;
- current 18i20 hardware evidence profile (`FullTestBenchProfilesV8.js`).

## Classification vocabulary

- **HARDWARE_DYNAMIC_CLOSED** — relevant transition/physical behavior was actually observed and matched the independent server oracle.
- **HARDWARE_STATIC_CONFIRMED** — rendered feedback matched current server state, but dynamic closure is incomplete.
- **EVAL_ONLY_SAFE_ACTIONABLE** — dynamic closure is still open and a targeted reversible test may run only when exact runtime restoration is available.
- **EVAL_ONLY_NONACTIONABLE** — current evidence positively establishes that no responsible exact-restore write path is available under the present validated conditions; do not manufacture a baseline.
- **RESEARCH_OPEN / EVAL_ONLY** — feature/schema evidence exists, but current actionability cannot be classified safely because readback or semantics remain unresolved.
- **READ_ONLY_STATUS** — passive server observation is the correct validation model; do not force a disruptive state change merely for coverage.
- **UNSUPPORTED/BLOCKED** — deliberately excluded from dynamic testing under current safety policy/evidence profile.

`PARTIAL` means the classification differs across instances of one public feedback definition.

## Current V8 feedback facts

- public definitions: **31**;
- feedback instances: **829**;
- static/oracle result after V8: **190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- dynamic-tracked instances: **742**;
- both states observed: **20**;
- one state observed: **12**;
- never observed dynamically: **710**;
- dynamic mismatches: **0**.

The later meter campaign is stronger evidence for meter movement: **14/46** meter paths are dynamically closed — inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.

## 31-definition matrix

| # | Feedback definition | Existing evidence | Current closure class | Remaining action |
|---:|---|---|---|---|
| 1 | `connected` | V8 static 1/1 PASS | READ_ONLY_STATUS | No forced disconnect needed; server/connection state observation is sufficient. |
| 2 | `authorised` | V8 static 1/1 PASS | READ_ONLY_STATUS | Do not reject/reapprove the canonical client merely for coverage. |
| 3 | `monitor_mute` | V8 static EVAL_ONLY; dynamic never 1/1; targeted run found initial server value absent in that session; zero write | EVAL_ONLY / READBACK_UNRESOLVED | Missing cache value is not proof the documented Monitor Mute function is absent. Reassess only from real server-confirmed state; do not invent a default. |
| 4 | `monitor_dim` | V8 static EVAL_ONLY; dynamic never 1/1; targeted run found initial server value absent in that session; zero write | EVAL_ONLY / READBACK_UNRESOLVED | Same distinction: absent session value is not absence of the documented DIM control. |
| 5 | `monitor_talkback` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 6 | `monitor_alt` | V8 static EVAL_ONLY; dynamic never 1/1 | EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline | Later isolated targeted closure only if exact current baseline is server-confirmed. |
| 7 | `monitor_alt_enable` | V8 static EVAL_ONLY; dynamic never 1/1 | EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline | Later isolated targeted closure only if exact current baseline is server-confirmed. |
| 8 | `monitor_preset` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 9 | `input_air` | V8 0 PASS / 8 EVAL_ONLY; dynamic never 8/8; targeted run found all 8 session values missing; zero write | EVAL_ONLY / READBACK_UNRESOLVED | Do not assume `false`. Missing session state alone is not proof the hardware function is absent. |
| 10 | `input_pad` | V8 0 PASS / 8 EVAL_ONLY; dynamic never 8/8; targeted run found all 8 session values missing; zero write | EVAL_ONLY / READBACK_UNRESOLVED | Same; preserve fail-closed behavior while distinguishing cache absence from capability absence. |
| 11 | `input_available` | V8 static 8/8 PASS | READ_ONLY_STATUS | Passive availability state; no write exists/needed to force it. |
| 12 | `input_mode` | V8 dynamic both states 4/4 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 13 | `input_meter` | Later meter closure 8/8 floor + real movement | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 14 | `output_mute` | V8 static 7 PASS / 19 EVAL_ONLY; dynamic never 26/26; several paths have unknown state or pair/ownership complications; outputs 21–24 availability UNKNOWN | PARTIAL — mostly EVAL_ONLY / unresolved | Do not make this a score-driven batch. Reconsider only an eligible output with proven ownership, availability and exact restore. |
| 15 | `output_stereo` | V8 static 26/26 PASS; dynamic 1 both-state, 1 single-state, 24 never; many pair vectors are true/true with exact reconstruction not proven | PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY_NONACTIONABLE under current pair evidence | Do not force true/true pair reconstruction. Retest only a specifically proven exact-restorable pair. |
| 16 | `output_source` | V8 static 26/26 PASS; dynamic 11 both-state, 11 single-state, 4 never; available left members already WRITE_CONFIRMED, right members pair-owned aliases; 21–24 availability UNKNOWN | PARTIAL — HARDWARE_DYNAMIC_CLOSED / HARDWARE_STATIC_CONFIRMED / no-write UNKNOWN | Existing validated pair-aware routing remains the only write path for future exact eligible gaps. |
| 17 | `output_available` | V8 static 22 PASS / 4 EVAL_ONLY | READ_ONLY_STATUS | Four UNKNOWN availability outputs remain unknown; no write. |
| 18 | `output_meter` | V8 static 26/26 PASS; later meter closure only 4/26 | PARTIAL — 4 HARDWARE_DYNAMIC_CLOSED / 22 open | Prefer passive/natural signal or already-proven exact-restore routing. Static PASS is not movement closure. |
| 19 | `mixer_slot_stereo` | V8 static 24/24 PASS; dynamic never 24/24; current 18i20 evidence profile explicitly withholds mixer-slot `stereo` writes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for current write-driven closure | Do not create a targeted write campaign while the evidence profile withholds this family. |
| 20 | `mixer_slot_source` | V8 static 16 PASS / 8 EVAL_ONLY; dynamic never 24/24; current 18i20 evidence profile explicitly withholds mixer-slot `source` writes | PARTIAL HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for current write-driven closure | Do not change mixer-slot assignments merely for feedback coverage. |
| 21 | `mix_mute` | Focusrite official Custom Mix docs confirm per-channel Mute; exact 18i20 Control Server schema has distinct per-strip mute IDs; earlier read-only session saw Mix A L/R Playback-strip gain/mute/solo all KNOWN; later targeted run saw 0/12 complete three-value tuples and skipped 12 mute targets with zero write | **RESEARCH_OPEN / EVAL_ONLY** | Do not rerun the unchanged three-value tuple harness. Research why mute values materialise inconsistently in the existing authorised Companion session. Then design a property-specific exact-restore test if the mute baseline itself is server-confirmed. |
| 22 | `mix_solo` | Focusrite official Custom Mix docs confirm per-channel Solo; exact 18i20 schema has distinct per-strip solo IDs; earlier read-only session saw Mix A L/R solo KNOWN; later targeted run saw 0/12 complete tuples and skipped 12 solo targets with zero write | **RESEARCH_OPEN / EVAL_ONLY** | Same readback research first. Solo semantics affect what is heard from the mix, so a later property-specific test must observe related state and prove exact restoration; do not infer behavior from raw USB alone. |
| 23 | `mix_talkback` | V8 static 6 PASS / 6 EVAL_ONLY; dynamic never 12/12; current 18i20 evidence profile withholds mix-lane `talkback`, with no-effect evidence on left lanes | PARTIAL HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for current write-driven closure | Do not target this family while the evidence profile withholds it. |
| 24 | `mix_meter` | V8 static 7 PASS / 5 EVAL_ONLY; later meter closure 2/12 | PARTIAL — 2 HARDWARE_DYNAMIC_CLOSED / 10 open | Mix A L/R closed. For Mix B–F prefer passive natural-signal evidence; do not treat mute/solo readback uncertainty as proof meter closure is impossible. |
| 25 | `device_preset` | V8 EVAL_ONLY; normal FULL deliberately excludes preset apply | UNSUPPORTED/BLOCKED for normal dynamic closure | Do not apply presets merely to exercise feedback. |
| 26 | `clock_source` | V8 static PASS; normal FULL excludes clock changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change clock source merely for feedback coverage. |
| 27 | `sample_rate` | V8 static PASS; normal FULL excludes sample-rate changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change sample rate merely for feedback coverage. |
| 28 | `spdif_mode` | V8 static PASS; normal FULL excludes digital-I/O mode changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically | Do not change S/PDIF mode merely for feedback coverage. |
| 29 | `clock_locked` | V8 static 1/1 PASS; read-only device status | READ_ONLY_STATUS | Passive observation only. |
| 30 | `talkback_source` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 31 | `phantom_persistence` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required; persistence setting only, not per-channel phantom. |

## Research correction: what the targeted Mix run did and did not prove

Completed 2026-08-24 run:
- self-check 34/34 PASS;
- exact 18i20 / module 0.1.16 / authorised Companion connection PASS;
- Playback detected dynamically as slot 3, Playback 1, stereo;
- exact full gain+mute+solo tuple 0/12 lanes in that session;
- 24 SKIP_BASELINE_UNKNOWN, zero writes, zero FAIL, zero restore quarantine.

**Supported conclusion:** the unchanged tuple-based campaign had no safe runnable target in that session.

**Unsupported conclusion (retracted):** that `mix_mute` / `mix_solo` are therefore inherently non-actionable or closed.

Why the stronger conclusion is invalid:
- official Focusrite documentation explicitly defines Custom Mix Mute and Solo on Scarlett 3rd Gen;
- current 18i20 schema parsing exposes distinct mute/solo IDs for every strip;
- current actions write those explicit schema IDs as booleans;
- an earlier read-only observation saw exact gain/mute/solo values for Mix A L/R on the Playback strip;
- the module's state cache only contains values supplied in device-arrival or later `<set>` messages, so `UNKNOWN` means unobserved in that session, not unsupported.

Independent Control Server research by Antonio-Radu Varga also parses Mix `gain`, `pan`, `mute`, `solo` items. This corroborates the schema model but is older-hardware research and is not a substitute for 18i20 Gen 3 testing.

Linux Scarlett2 research exposes the 18i20 Gen 3 mixer primarily as a crosspoint gain matrix. Treat this as a different abstraction layer; do not claim the Control Server mute/solo item maps to any specific raw USB operation without direct proof.

## Targeted Core feedback run — retained evidence

The 2026-08-24 Core run had 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes, zero FAIL and zero restore quarantine. That remains a valid session/readback observation. As with Mix, missing server-state cache values must not be overinterpreted as absence of the documented/schema capability.

## Parent-objective completion rule

The feedback parent objective is complete only when every row above is either:
- dynamically closed where dynamic hardware testing is meaningful and safe;
- correctly classified as passive/read-only;
- explicitly non-actionable based on positive exact-restore/safety evidence rather than mere missing cache state; or
- deliberately blocked/unsupported under current safety policy/evidence profile.

A green software gate, a complete inventory, or closure of one sub-question cannot replace this matrix.

## Immediate next step

Do not rerun the unchanged Mix mute/solo tuple campaign and do not move on as if Mix were closed.

First investigate the existing authorised Companion client's readback/materialisation behavior:
- schema item present but value missing at device-arrival;
- value present in initial state;
- value arriving later through subscription `<set>`;
- why the same Mix A L/R Playback items were KNOWN in one normal read-only session and not in the later targeted session.

Keep this research read-only where possible and do not create another direct Control Server client by default. Once the readback discrepancy is understood, reassess property-specific safe tests for `mix_mute` and `mix_solo` separately.
