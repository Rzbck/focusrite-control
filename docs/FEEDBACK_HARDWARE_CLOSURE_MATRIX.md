# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-24

This matrix is the parent hardware-validation checklist for the 31 public Companion feedback definitions.

It deliberately separates **static oracle agreement** from **dynamic hardware closure**. A feedback is not dynamically closed merely because the V8 sweep rendered the correct current state, the inventory is complete, or a software test passes.

Evidence used:

- completed V8 hardware report `docs/hardware-results/LATEST_SHAREABLE.json`;
- V8 transition tracker (`feedbackDynamic`);
- later dedicated meter-closure evidence;
- completed direct read-only Mix baseline research;
- targeted Core feedback-closure run on 2026-08-24;
- current production feedback/action definitions and permanent safety rules;
- current 18i20 hardware evidence profile (`FullTestBenchProfilesV8.js`).

## Classification vocabulary

- **HARDWARE_DYNAMIC_CLOSED** — relevant transition/physical behavior was actually observed and matched the independent server oracle.
- **HARDWARE_STATIC_CONFIRMED** — rendered feedback matched current server state, but dynamic closure is incomplete.
- **EVAL_ONLY_SAFE_ACTIONABLE** — dynamic closure is still open and a targeted reversible test may run only when exact runtime restoration is available.
- **EVAL_ONLY_NONACTIONABLE** — current evidence does not provide a responsible exact-restore write path; do not manufacture a baseline.
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
| 3 | `monitor_mute` | V8 static EVAL_ONLY; dynamic never 1/1; 2026-08-24 targeted run again found initial server state missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Reconsider only if the existing Companion session later receives a genuine server-confirmed value naturally. |
| 4 | `monitor_dim` | V8 static EVAL_ONLY; dynamic never 1/1; 2026-08-24 targeted run again found initial server state missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Reconsider only if the existing Companion session later receives a genuine server-confirmed value naturally. |
| 5 | `monitor_talkback` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 6 | `monitor_alt` | V8 static EVAL_ONLY; dynamic never 1/1 | EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline | Later isolated targeted closure only if exact current baseline is already server-confirmed. |
| 7 | `monitor_alt_enable` | V8 static EVAL_ONLY; dynamic never 1/1 | EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline | Later isolated targeted closure only if exact current baseline is already server-confirmed. |
| 8 | `monitor_preset` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 9 | `input_air` | V8 0 PASS / 8 EVAL_ONLY; dynamic never 8/8; 2026-08-24 targeted run found all 8 initial server states missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Do not assume `false`; reconsider individual inputs only after genuine server state exists. |
| 10 | `input_pad` | V8 0 PASS / 8 EVAL_ONLY; dynamic never 8/8; 2026-08-24 targeted run found all 8 initial server states missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Do not assume `false`; reconsider individual inputs only after genuine server state exists. |
| 11 | `input_available` | V8 static 8/8 PASS | READ_ONLY_STATUS | Passive availability state; no write exists/needed to force it. |
| 12 | `input_mode` | V8 dynamic both states 4/4 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 13 | `input_meter` | Later meter closure 8/8 floor + real movement | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 14 | `output_mute` | V8 static 7 PASS / 19 EVAL_ONLY; dynamic never 26/26; many AVAILABLE outputs have unknown mute baseline, several early right members have repeatable behavior mismatch, outputs 21–24 availability UNKNOWN | PARTIAL — mostly EVAL_ONLY_NONACTIONABLE; passive/static where state exists | Do not make this the next score-driven batch. Only reconsider an individual output when availability is eligible, baseline is known and current evidence profile does not withhold/mismatch the path. |
| 15 | `output_stereo` | V8 static 26/26 PASS; dynamic 1 both-state, 1 single-state, 24 never; many pair vectors are true/true with exact reconstruction not proven | PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY_NONACTIONABLE under current pair evidence | Do not force true/true pair reconstruction. Retest only a specifically proven exact-restorable pair. |
| 16 | `output_source` | V8 static 26/26 PASS; dynamic 11 both-state, 11 single-state, 4 never; available left members already WRITE_CONFIRMED, right members pair-owned aliases; 21–24 availability UNKNOWN | PARTIAL — HARDWARE_DYNAMIC_CLOSED / HARDWARE_STATIC_CONFIRMED / no-write UNKNOWN | No blind output batch. Existing validated pair-aware routing remains the only write path for future exact eligible gaps. |
| 17 | `output_available` | V8 static 22 PASS / 4 EVAL_ONLY | READ_ONLY_STATUS | Four UNKNOWN availability outputs remain unknown; no write. |
| 18 | `output_meter` | V8 static 26/26 PASS; later meter closure only 4/26 | PARTIAL — 4 HARDWARE_DYNAMIC_CLOSED / 22 open | Use existing meter exact-restore routing only where already proven safe; static PASS is not movement closure. |
| 19 | `mixer_slot_stereo` | V8 static 24/24 PASS; dynamic never 24/24; current 18i20 evidence profile explicitly withholds mixer-slot `stereo` writes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for current write-driven closure | Do not create a targeted write campaign while the evidence profile withholds this family. |
| 20 | `mixer_slot_source` | V8 static 16 PASS / 8 EVAL_ONLY; dynamic never 24/24; current 18i20 evidence profile explicitly withholds mixer-slot `source` writes | PARTIAL HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for current write-driven closure | Do not change mixer-slot assignments merely for feedback coverage. |
| 21 | `mix_mute` | V8 288/288 EVAL_ONLY; dynamic never 288/288; later focused Playback campaign proved exact gain/mute/solo baseline+restore on the lanes it could exercise | PARTIAL — EVAL_ONLY_SAFE_ACTIONABLE only for runtime Playback-strip tuples with exact baseline; otherwise NONACTIONABLE | **Next targeted batch:** dynamically detect existing Playback slot and exercise only baseline-known mute instances, exact restore required. Historical evidence suggests Mix A L/R may qualify, but runtime decides. |
| 22 | `mix_solo` | V8 288/288 EVAL_ONLY; dynamic never 288/288; later focused Playback campaign proved exact gain/mute/solo baseline+restore on the lanes it could exercise | PARTIAL — EVAL_ONLY_SAFE_ACTIONABLE only for runtime Playback-strip tuples with exact baseline; otherwise NONACTIONABLE | **Next targeted batch:** same dynamically detected Playback slot, baseline-known solo instances only, exact restore required. |
| 23 | `mix_talkback` | V8 static 6 PASS / 6 EVAL_ONLY; dynamic never 12/12; current 18i20 evidence profile withholds mix-lane `talkback`, with no-effect evidence on left lanes | PARTIAL HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED for current write-driven closure | Do not target this family while the evidence profile withholds it. |
| 24 | `mix_meter` | V8 static 7 PASS / 5 EVAL_ONLY; later meter closure 2/12 | PARTIAL — 2 HARDWARE_DYNAMIC_CLOSED / 10 EVAL_ONLY_NONACTIONABLE for write-driven closure | Mix A L/R closed. Mix B–F write-driven closure remains blocked by missing exact baselines; passive natural-signal evidence may still accumulate. |
| 25 | `device_preset` | V8 EVAL_ONLY; normal FULL deliberately excludes preset apply | UNSUPPORTED/BLOCKED for normal dynamic closure | Do not apply presets merely to exercise feedback. |
| 26 | `clock_source` | V8 static PASS; normal FULL excludes clock changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change clock source merely for feedback coverage. |
| 27 | `sample_rate` | V8 static PASS; normal FULL excludes sample-rate changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change sample rate merely for feedback coverage. |
| 28 | `spdif_mode` | V8 static PASS; normal FULL excludes digital-I/O mode changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change S/PDIF mode merely for feedback coverage. |
| 29 | `clock_locked` | V8 static 1/1 PASS; read-only device status | READ_ONLY_STATUS | Passive observation only. |
| 30 | `talkback_source` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 31 | `phantom_persistence` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required; persistence setting only, not per-channel phantom. |

## Targeted Core feedback run — completed 2026-08-24

User-validated clean-worktree run at `0b9b87da582b`:

- targeted self-check: **13/13 PASS**;
- exact model and canonical existing Companion authorization: PASS;
- module version: **0.1.16**;
- targets: **18**;
- `HARDWARE_DYNAMIC_CLOSED`: **0**;
- `SKIP_BASELINE_UNKNOWN`: **18**;
- feedback/hardware FAIL: **0**;
- restore quarantine: **0**;
- **hardware writes: 0**.

Missing baselines were Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. This is consistent with V8 and with production fail-closed state handling. Repeated `device-subscribe` already proved no state progress historically, so reconnect/resubscribe guessing is not a justified next step.

This batch is closed as a **baseline/actionability result**, not dynamic feedback closure. Do not rerun it unchanged.

## Next targeted batch — Mix mute/solo on existing Playback strip

Prepared TestBench path:

- `testbench/MixFeedbackClosure.js`;
- `testbench/RUN_MIX_FEEDBACK_CLOSURE.cmd`;
- `test/mix-feedback-closure.test.js`.

This batch is deliberately narrower than the old meter driver:

- dynamically detects the already-existing Playback mixer slot; **never hardcodes historical slot 3**;
- snapshots all lanes through the existing Companion connection;
- a lane is eligible only when the detected Playback strip has exact server-confirmed gain + mute + solo baselines;
- only `mix_mute` and `mix_solo` are written;
- **gain is not changed** by this feedback campaign;
- no Output Source / pair source write;
- no Mixer Slot Source/Stereo write;
- no mix talkback write;
- no Monitor gain 1677 / Advanced Raw / direct Control Server client;
- feedback is checked against the independent server boolean before change, at the alternate state and after exact restoration;
- missing baseline => SKIP / zero write for that target;
- hardware restore failure => quarantine + HARD ABORT;
- feedback mismatch after confirmed hardware restore remains a feedback FAIL, not a fake hardware-restore failure;
- temporary Page 2 mutation is audited and the original capability-lab Page 2 must be restored before another campaign;
- r9 feedback render fallback may press only the already-audited **action-free feedback cell** when Companion has not materialized its `b_text_*` marker; it cannot issue a Focusrite write.

The runner is **prepared, not hardware-validated yet**. Its launcher performs syntax + targeted regression tests before the Focusrite preflight/write path.

## Parent-objective completion rule

The feedback parent objective is complete only when every row above is either:

- dynamically closed where dynamic hardware testing is meaningful and safe;
- correctly classified as passive/read-only;
- explicitly non-actionable because exact restore/safety is unavailable; or
- deliberately blocked/unsupported under current safety policy/evidence profile.

A green software gate, a complete inventory, or closure of one sub-question cannot replace this matrix.

## Immediate next step

Do **not** rerun Core, FULL, direct Mix research or broad output/mixer-slot campaigns.

Fast-forward the clean audit worktree to the live validation branch and run only:

`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`

The launcher must self-check before hardware. Type `MIX_FEEDBACK` then `ALL_ISOLATED` only after the preflight passes. Runtime baseline decides which lanes/targets are eligible; no unknown target receives a write.
