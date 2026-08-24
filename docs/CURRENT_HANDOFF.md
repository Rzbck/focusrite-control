# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T15:58+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `CORE_FEEDBACK_BASELINE_BLOCK_CLOSED_PLAN_NEXT_TARGETED_BATCH`
Exact fully validated software-audit checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840`
User-validated targeted Core feedback run checkpoint: `0b9b87da582b690b6d22c19a791816b3d584b7d1`
Canonical production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — ALWAYS DO THIS FIRST

Future AI/contributors must never resume from an embedded SHA, old chat summary, copied handoff, uploaded handoff or remembered branch without first checking the live repository.

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. identify the branch that actually owns the current objective;
2. fetch that remote branch and resolve its **current HEAD**;
3. inspect the **latest relevant commits/diff** since the last validated checkpoint;
4. read `docs/CURRENT_HANDOFF.md` from that live branch/ref;
5. inspect current code/tests and newest relevant sanitized hardware evidence;
6. reconcile any **newer result validated by the human user**;
7. only then choose the next action.

An SHA written here is a checkpoint, not permission to skip the live remote check.

Evidence priority:

1. newest explicit physical-hardware evidence / completed human-validated run;
2. newest completed software gate evidence;
3. current checked-in code/tests and latest relevant commits;
4. this handoff;
5. broader historical docs/captures.

Always distinguish **hardware-tested**, **software-tested**, **implemented**, **schema-observed**, **research-only**, **pending**, and **unsupported**.

## IMMUTABLE objective continuity — no premature closure

Permanent repository rule exists in both `AI_PROJECT_RULES.md` and root `HANDOFF`, with regression coverage.

A completed sub-question **does not close the parent hardware-validation objective**.

In particular:

- green software/tests/package does not mean feedback hardware validation is complete;
- complete inventory / `0 FAIL` / static oracle PASS does not close rows that remain `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised or otherwise open;
- the completed Mix B-F baseline research closes only that Mix B-F baseline question;
- tooling/release/publication work may interrupt hardware validation only when it directly blocks the next safe hardware step, and work must return to the parent objective immediately afterward;
- every objective change must state the parent objective, exact closing evidence, remaining open matrix rows and why the next objective is allowed; otherwise the objective change is forbidden.

Current parent objective remains **explicit hardware feedback closure**.

## 31-definition feedback matrix

Canonical checklist:

`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`

V8 facts retained:

- feedback definitions: **31**;
- feedback instances: **829**;
- V8 static/oracle after sweep: **190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- dynamic tracker: **20 both-state / 12 single-state / 710 neverObserved / 0 FAIL**.

Do **not** rerun FULL to improve these numbers.

## Targeted Core feedback run — USER VALIDATED 2026-08-24

User fast-forwarded the clean audit worktree to:

`0b9b87da582b`

`git status --short` was empty before launch.

Launcher self-check:

- syntax/targeted contract/regression tests: **13/13 PASS**;
- no hardware during self-check.

Read-only preflight:

- local Companion detected;
- exact `Scarlett 18i20 (3rd Gen)` detected;
- module `focusrite-scarlett-18i20` found;
- existing canonical Companion client authorised;
- module connection `Connected / authorised`;
- no hardware changed by preflight.

Targeted hardware phase result:

- module version: **0.1.16**;
- scope: Air 1–8 + Pad 1–8 + Monitor Mute + Monitor Dim;
- `DYNAMIC_CLOSED`: **0**;
- `SKIP_BASELINE_UNKNOWN`: **18**;
- FAIL: **0**;
- restore quarantine: **0**;
- runnable targets: **0**;
- **hardware writes: 0** because every target was rejected before first write.

Missing initial server state:

- Air 1–8: 8/8;
- Pad 1–8: 8/8;
- Monitor Mute: 1/1;
- Monitor Dim: 1/1.

This is a valid baseline/actionability result, not a control failure.

It is consistent with V8, where the same families were EVAL_ONLY because initial server state was unknown.

Production client behavior is intentionally fail-closed:

- values absent from device-arrival / server `<set>` state remain unknown;
- missing values are never replaced by defaults;
- real-hardware testing already established that repeated `device-subscribe subscribe=true` made no state progress.

Therefore these 18 targets are now classified **EVAL_ONLY_NONACTIONABLE in the current bootstrap state** for automatic write-driven feedback closure.

Do not:

- assume `false` for missing Air/Pad/Mute/Dim;
- interpret rendered `F` as proof of `false` while the underlying state is absent;
- send a write merely to manufacture a baseline;
- repeatedly reconnect/resubscribe to chase missing state;
- rerun `RUN_FEEDBACK_CORE_CLOSURE.cmd` unchanged;
- create another direct Control Server client.

Reconsider an individual target only if the existing Companion session later receives a genuine server-confirmed current value naturally.

## Meter evidence

46 meter paths:

- inputs: **8/8 closed**;
- outputs: **4/26 closed**;
- mixes: **2/12 closed**;
- total: **14/46 closed**;
- mismatch: **0**.

Mix A L/R remain dynamically closed from exact-baseline hardware evidence.

Mix B-F remain write-driven `BASELINE_UNKNOWN` / non-actionable:

- `ACTIONABLE=0`;
- `ALREADY_CLOSED=2`;
- `BASELINE_UNKNOWN=10`.

Do not infer right from left, assume mute/solo defaults, manufacture a baseline, rerun the direct Mix probe or rerun FULL.

## Remote Devices authorization — mandatory before any write

The canonical normal client is the existing approved **Companion Scarlett 18i20** connection.

Before any future write-capable hardware test:

1. **reuse the existing Companion Focusrite connection**;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm `Companion Scarlett 18i20` remains approved;
4. require authorization for this module's own current server-assigned client ID;
5. if approval/preflight is absent, classify **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write.

Read-only `device-subscribe` not requiring approval does not weaken the write rule.

Do not create a new direct Control Server client merely to inspect state Companion can already expose. A direct research client requires an exceptional reason plus explicit user warning/agreement before launch.

**Never reuse/copy the Companion private client key into another process.**

## Production package / permanent safety

Keep Companion on exact audited package already installed:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do not install audit/debug/TestBench packages over it.

Permanent restrictions remain:

- supported hardware only Scarlett 18i20 (3rd Gen);
- Monitor gain 1677 read-only;
- no input preamp gain, direct input hardware mute, per-channel phantom, Mic Kill or physical Monitor-level write;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no writes to explicit output availability UNKNOWN;
- server-confirmed feedback/state only;
- dynamic Control Server port/device ID;
- no Focusrite software/firmware/routing/hardware setting changes without explicit user agreement.

## Software/tooling status

Last complete software audit remains `fba6d977...` with **192/192 PASS**, package build PASS and RUN OK. That run contained no hardware validation.

The later matrix/rules/targeted TestBench changes do not alter production `src/` behavior or the installed exact 0.1.16 package.

Do not divert into a broad release/tooling audit now.

## Publication state

Official Bitfocus repository/name decision is still pending, but publication is **not** the current parent objective while feedback hardware closure remains open.

Do not rename public IDs/packages or broaden hardware support.

## Exact immediate next step

Do **not** rerun the Core feedback closure.

Perform a **read-only planning pass** over current V8 snapshot/capability evidence and current TestBench code to enumerate exact remaining feedback instances that already have all of:

1. server-confirmed baseline;
2. required availability where applicable;
3. previously validated reversible action path;
4. exact restoration path.

Priority families to evaluate next:

- `output_mute`;
- `output_stereo`;
- remaining `output_source` gaps;
- `mixer_slot_stereo` / `mixer_slot_source`;
- `mix_mute` / `mix_solo` / `mix_talkback` only where exact baselines exist.

Build the next targeted hardware batch only from those proven eligible instances. Unknown baseline/availability remains no-write/non-actionable. No FULL, no direct client, no score-driven baseline manufacturing.
