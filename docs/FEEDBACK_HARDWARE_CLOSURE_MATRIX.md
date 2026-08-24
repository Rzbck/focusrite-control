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
- current production feedback/action definitions and permanent safety rules.

## Classification vocabulary

- **HARDWARE_DYNAMIC_CLOSED** — relevant transition/physical behavior was actually observed and matched the independent server oracle.
- **HARDWARE_STATIC_CONFIRMED** — rendered feedback matched current server state, but dynamic closure is incomplete.
- **EVAL_ONLY_SAFE_ACTIONABLE** — dynamic closure is still open and a targeted reversible test may run only when exact runtime restoration is available.
- **EVAL_ONLY_NONACTIONABLE** — current evidence does not provide a responsible exact-restore write path; do not manufacture a baseline.
- **READ_ONLY_STATUS** — passive server observation is the correct validation model; do not force a disruptive state change merely for coverage.
- **UNSUPPORTED/BLOCKED** — deliberately excluded from dynamic testing under current safety policy.

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
| 3 | `monitor_mute` | V8 static EVAL_ONLY; dynamic never 1/1; 2026-08-24 targeted run again found initial server state missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Do not manufacture a baseline. Reconsider only if the existing Companion session later receives a real server-confirmed current value naturally. |
| 4 | `monitor_dim` | V8 static EVAL_ONLY; dynamic never 1/1; 2026-08-24 targeted run again found initial server state missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Do not manufacture a baseline. Reconsider only if the existing Companion session later receives a real server-confirmed current value naturally. |
| 5 | `monitor_talkback` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 6 | `monitor_alt` | V8 static EVAL_ONLY; dynamic never 1/1 | EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline | Later isolated targeted closure only if exact current baseline is already server-confirmed. |
| 7 | `monitor_alt_enable` | V8 static EVAL_ONLY; dynamic never 1/1 | EVAL_ONLY_SAFE_ACTIONABLE only with known runtime baseline | Later isolated targeted closure only if exact current baseline is already server-confirmed. |
| 8 | `monitor_preset` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 9 | `input_air` | V8 0 PASS / 8 EVAL_ONLY; dynamic never 8/8; 2026-08-24 targeted run found all 8 initial server states missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Do not assume `false` and do not write merely to create a baseline. Reconsider individual inputs only after a real server-confirmed current value exists. |
| 10 | `input_pad` | V8 0 PASS / 8 EVAL_ONLY; dynamic never 8/8; 2026-08-24 targeted run found all 8 initial server states missing; zero write | EVAL_ONLY_NONACTIONABLE in current bootstrap state | Do not assume `false` and do not write merely to create a baseline. Reconsider individual inputs only after a real server-confirmed current value exists. |
| 11 | `input_available` | V8 static 8/8 PASS | READ_ONLY_STATUS | Passive availability state; no write exists/needed to force it. |
| 12 | `input_mode` | V8 dynamic both states 4/4 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 13 | `input_meter` | Later meter closure 8/8 floor + real movement | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 14 | `output_mute` | V8 static 7 PASS / 19 EVAL_ONLY; dynamic never 26/26 | PARTIAL — EVAL_ONLY_SAFE_ACTIONABLE | Next candidate family, but only per output where availability and exact baseline are both already known. Unknown availability or unknown baseline receives no write. |
| 15 | `output_stereo` | V8 static 26/26 PASS; dynamic 1 both-state, 1 single-state, 24 never | PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY_SAFE_ACTIONABLE | Pair-aware targeted closure only where the exact stereo baseline is known; never infer pair behavior from another pair. |
| 16 | `output_source` | V8 static 26/26 PASS; dynamic 11 both-state, 11 single-state, 4 never | PARTIAL — HARDWARE_DYNAMIC_CLOSED / HARDWARE_STATIC_CONFIRMED | Close only remaining per-instance gaps through already-validated pair-aware routing and exact restore. |
| 17 | `output_available` | V8 static 22 PASS / 4 EVAL_ONLY | READ_ONLY_STATUS | Four UNKNOWN availability outputs remain unknown; this is a no-write condition, not a reason to force availability. |
| 18 | `output_meter` | V8 static 26/26 PASS; later meter closure only 4/26 | PARTIAL — 4 HARDWARE_DYNAMIC_CLOSED / 22 open | Use existing meter exact-restore routing only for safe eligible pairs; static meter PASS is not movement closure. |
| 19 | `mixer_slot_stereo` | V8 static 24/24 PASS; dynamic never 24/24 | HARDWARE_STATIC_CONFIRMED / EVAL_ONLY_SAFE_ACTIONABLE | Target only slots with exact baseline and isolated reversible path; no score-driven write. |
| 20 | `mixer_slot_source` | V8 static 16 PASS / 8 EVAL_ONLY; dynamic never 24/24 | PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY_SAFE_ACTIONABLE | Target only slots with exact baseline and validated alternate sources; exact source restore mandatory. |
| 21 | `mix_mute` | V8 288/288 EVAL_ONLY; dynamic never 288/288 | EVAL_ONLY_SAFE_ACTIONABLE only where exact baseline exists; otherwise NONACTIONABLE | Runtime baseline audit first. Missing mute baseline means no write. Never infer defaults. |
| 22 | `mix_solo` | V8 288/288 EVAL_ONLY; dynamic never 288/288 | EVAL_ONLY_SAFE_ACTIONABLE only where exact baseline exists; otherwise NONACTIONABLE | Runtime baseline audit first. Missing solo baseline means no write. Never infer defaults. |
| 23 | `mix_talkback` | V8 static 6 PASS / 6 EVAL_ONLY; dynamic never 12/12 | PARTIAL — HARDWARE_STATIC_CONFIRMED / EVAL_ONLY_SAFE_ACTIONABLE | Target only lanes with exact baseline and physical isolation. |
| 24 | `mix_meter` | V8 static 7 PASS / 5 EVAL_ONLY; later meter closure 2/12 | PARTIAL — 2 HARDWARE_DYNAMIC_CLOSED / 10 EVAL_ONLY_NONACTIONABLE for write-driven closure | Mix A L/R closed. Mix B–F write-driven closure is blocked by missing exact baselines; passive natural-signal evidence may still accumulate without routing changes. |
| 25 | `device_preset` | V8 EVAL_ONLY; normal FULL deliberately excludes preset apply | UNSUPPORTED/BLOCKED for normal dynamic closure | Do not apply presets merely to exercise feedback; disruptive dedicated test would require separate explicit user agreement. |
| 26 | `clock_source` | V8 static PASS; normal FULL excludes clock changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change clock source merely for feedback coverage. |
| 27 | `sample_rate` | V8 static PASS; normal FULL excludes sample-rate changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change sample rate merely for feedback coverage. |
| 28 | `spdif_mode` | V8 static PASS; normal FULL excludes digital-I/O mode changes | HARDWARE_STATIC_CONFIRMED / UNSUPPORTED/BLOCKED dynamically | Do not change S/PDIF mode merely for feedback coverage. |
| 29 | `clock_locked` | V8 static 1/1 PASS; read-only device status | READ_ONLY_STATUS | Passive observation only. |
| 30 | `talkback_source` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required. |
| 31 | `phantom_persistence` | V8 dynamic both states 1/1 | HARDWARE_DYNAMIC_CLOSED | No retest required; this is persistence setting, not per-channel phantom switching. |

## Targeted Core feedback run — completed 2026-08-24

User-validated run on clean worktree at `0b9b87da582b`:

- targeted self-check: **13/13 PASS**;
- exact model: PASS;
- canonical existing Companion client authorization: PASS;
- module version: **0.1.16**;
- targets: **18**;
- `HARDWARE_DYNAMIC_CLOSED`: **0**;
- `SKIP_BASELINE_UNKNOWN`: **18**;
- feedback/hardware FAIL: **0**;
- restore quarantine: **0**;
- hardware writes: **0** because all targets were rejected before the first write.

The missing baselines were:

- Air 1–8: 8/8;
- Pad 1–8: 8/8;
- Monitor Mute: 1/1;
- Monitor Dim: 1/1.

This is consistent with the earlier V8 evidence, where the same families were EVAL_ONLY because initial server state was unknown. It is also consistent with the production client policy: missing Control Server values stay unknown and are never replaced by defaults. Historical hardware testing also established that repeated `device-subscribe subscribe=true` requests made no state progress, so reconnect/resubscribe guessing is not a justified next step.

Therefore this targeted batch is **closed as a baseline/actionability result**, not as dynamic feedback closure. The 18 targets are currently non-actionable for automatic write closure unless a genuine server-confirmed current value appears through the existing Companion session.

Do not:

- assume `false` for Air/Pad/Mute/Dim;
- use the rendered `F` marker as proof of `false` when the underlying server state is missing;
- send a no-op/opposite write merely to manufacture a known baseline;
- reconnect/resubscribe repeatedly to chase state;
- create another direct Control Server client.

## Parent-objective completion rule

The feedback parent objective is complete only when every row above is either:

- dynamically closed where dynamic hardware testing is meaningful and safe;
- correctly classified as passive/read-only;
- explicitly non-actionable because exact restore/safety is unavailable; or
- deliberately blocked/unsupported under the current safety policy.

A green software gate, a complete inventory, or closure of one sub-question cannot replace this matrix.

## Immediate next step

Do **not** rerun the Core feedback closure.

Perform a read-only planning pass over the existing V8 snapshot/capability evidence to enumerate the exact output/mixer feedback instances whose current evidence already contains:

1. server-confirmed baseline;
2. required availability where applicable;
3. a previously validated reversible action path;
4. exact restoration path.

Then build the next targeted hardware batch only from those eligible instances. No unknown-baseline row may be promoted merely to improve coverage.
