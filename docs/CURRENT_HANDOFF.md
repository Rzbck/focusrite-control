# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T15:24+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `TARGETED_CORE_FEEDBACK_CLOSURE_READY_FOR_USER_RUN`
Exact fully validated software-audit checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840`
Prepared targeted feedback-closure code checkpoint before this handoff update: `13fe7319697ba2671c38d4b0b31ef1fff69903c1`
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

This is now a permanent repository rule in both `AI_PROJECT_RULES.md` and root `HANDOFF`, with regression coverage in `test/full-testbench-v6-device-wide.test.js`.

A completed sub-question **does not close the parent hardware-validation objective**.

In particular:

- green software/tests/package does not mean feedback hardware validation is complete;
- complete inventory / `0 FAIL` / static oracle PASS does not close rows that remain `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised or otherwise open;
- the completed Mix B-F baseline research closes only that Mix B-F baseline question;
- tooling/release/publication work may interrupt hardware validation only when it directly blocks the next safe hardware step, and work must return to the parent objective immediately afterward;
- every objective change must state the parent objective, exact closing evidence, remaining open matrix rows and why the next objective is allowed; otherwise the objective change is forbidden.

Current parent objective remains **explicit hardware feedback closure**.

## 31-definition feedback matrix — COMPLETE AS AUDIT, HARDWARE CLOSURE STILL OPEN

The read-only classification audit is now checked in as:

`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`

V8 facts retained:

- feedback definitions: **31**;
- feedback instances: **829**;
- V8 static/oracle after sweep: **190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- dynamic tracker: **20 both-state / 12 single-state / 710 neverObserved / 0 FAIL**.

The matrix separates:

1. `HARDWARE_DYNAMIC_CLOSED`;
2. `HARDWARE_STATIC_CONFIRMED`;
3. `EVAL_ONLY_SAFE_ACTIONABLE`;
4. `EVAL_ONLY_NONACTIONABLE`;
5. `READ_ONLY_STATUS`;
6. `UNSUPPORTED/BLOCKED`.

Do **not** rerun FULL to improve these numbers.

## Meter evidence — newer evidence overrides V8 static meter PASS

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

## First targeted hardware batch — Core feedback closure

Prepared files:

- `testbench/FeedbackCoreClosure.js`;
- `testbench/RUN_FEEDBACK_CORE_CLOSURE.cmd`;
- `test/feedback-core-closure.test.js`.

This is **not FULL** and does not install/build a Companion module package.

Scope is only the 18 currently open reversible Core feedback targets:

- Air inputs 1–8;
- Pad inputs 1–8;
- Monitor Mute;
- Monitor Dim.

`monitor_talkback` and `input_mode` are intentionally excluded because V8 already recorded both-state dynamic closure for them.

Safety/runtime contract:

1. launcher performs Node syntax check plus targeted regression tests **before any Focusrite preflight/write**;
2. read-only `Focusrite_18i20_Preflight.ps1` must confirm the existing Companion path;
3. user explicitly types `FEEDBACK_CORE` and `ALL_ISOLATED`;
4. only existing audited r9 SAFE action setters are pressed;
5. each target must have a valid server-confirmed initial baseline;
6. unknown/invalid baseline => `SKIP_BASELINE_UNKNOWN`, **no write**;
7. rendered r9 feedback must match the baseline before write;
8. explicit opposite setter is pressed through Companion;
9. independent server variable and rendered feedback must both confirm the opposite state;
10. explicit original setter restores the exact baseline;
11. server-confirmed hardware restore failure => `QUARANTINED_RESTORE` + **HARD ABORT**;
12. if hardware restore succeeds but rendered feedback is wrong, record feedback FAIL but do not falsely classify the hardware restore as unsafe;
13. no direct Control Server client, no `<set>` construction in the harness, no raw write, no 1677 write, no optimistic state.

The r9 feedback cells themselves are audited by `collectFeedbacks()` to contain no actions; the closure runner reads their `b_text_*` marker passively and does not press feedback cells.

The new targeted runner/test files have **not yet received a real Windows user run**. Do not call them validated until the launcher self-check and hardware result are observed from the user.

## Remote Devices authorization — mandatory before any write

The canonical normal client is the existing approved **Companion Scarlett 18i20** connection.

Before this or any future write-capable hardware test:

1. **reuse the existing Companion Focusrite connection**;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm `Companion Scarlett 18i20` remains approved;
4. require authorization for this module's own current server-assigned client ID;
5. if approval/preflight is absent, classify **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

Read-only `device-subscribe` not requiring approval does not weaken the write rule.

### No extra direct clients by default

Do not create a new direct Control Server client merely to inspect state Companion can already expose. A direct research client may create another Remote Devices row and requires an explicit reason plus user warning/agreement before launch.

**Never reuse/copy the Companion private client key into another process.**

Never run a direct research client concurrently with SAFE/FULL/write-capable Companion validation.

## Production package / permanent safety

Keep Companion on the exact audited package already installed:

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

The last complete software audit remains valid at `fba6d977...` with **192/192 PASS**, package build PASS and RUN OK. That run contained no hardware validation.

The later anti-drift/matrix/targeted-runner changes are docs/TestBench/tests only; production `src/` hardware behavior and the installed exact 0.1.16 package are unchanged.

Do not divert into another broad release/tooling audit now. The targeted launcher self-check exists specifically to validate the new closure path immediately before the hardware batch.

The old original checkout still has its safety stash. Continue using the clean audit worktree for this targeted campaign; do not pop/delete the old stash as part of feedback testing.

## Publication state

The official Bitfocus repository/name decision is still pending, but publication is **not** the current parent objective while feedback hardware closure remains open.

Do not rename public IDs/packages or broaden hardware support.

## Exact immediate next step

Use the existing clean audit worktree, fast-forward it to the **live** `testbench/meter-routing-exact-restore` remote HEAD, confirm `git status --short` is empty, then run:

`testbench\RUN_FEEDBACK_CORE_CLOSURE.cmd`

Do not run `RUN.bat`, SAFE, FULL or the direct Mix probe first.

The launcher will self-check the new targeted code before any hardware path. If that self-check fails, no hardware write occurs; diagnose only that targeted failure. If it reaches the hardware phase, follow the `FEEDBACK_CORE` and `ALL_ISOLATED` prompts exactly.

After the run, record the full summary and per-target outcomes, update the matrix/handoff, and only then choose the next targeted feedback batch.