# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T16:12+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `TARGETED_MIX_MUTE_SOLO_FEEDBACK_CLOSURE_READY_FOR_USER_RUN`
Exact fully validated software-audit checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840`
User-validated targeted Core feedback run checkpoint: `0b9b87da582b690b6d22c19a791816b3d584b7d1`
Prepared Mix feedback runner/test checkpoint before matrix/handoff docs: `78578efac82f57f146d36b3f17af75d64b540b1b`
Canonical production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — ALWAYS FIRST

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. identify the branch that owns the current objective;
2. fetch the remote branch and resolve current HEAD;
3. inspect latest relevant commits/diff since last validated checkpoint;
4. read this file from that live ref;
5. inspect current code/tests and newest sanitized hardware evidence;
6. reconcile any newer result validated by the human user;
7. only then choose the next action.

An embedded SHA is a checkpoint, not permission to skip the live remote check.

Evidence priority: newest completed physical/human hardware result > completed software gate > current code/tests > this handoff > older docs/captures.

Always distinguish **hardware-tested**, **software-tested**, **implemented**, **schema-observed**, **research-only**, **pending**, and **unsupported**.

## IMMUTABLE objective continuity — no premature closure

Permanent rule exists in `AI_PROJECT_RULES.md` + root `HANDOFF` and is regression-tested.

A completed sub-question does **not** close the parent hardware-validation objective. Green software, complete inventory, zero FAIL or static PASS cannot replace unresolved `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved` or otherwise open hardware evidence.

Tooling/release work may interrupt only when it directly blocks the next safe hardware step, then work must immediately return to the parent objective.

Current parent objective: **explicit hardware feedback closure using `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`**.

## User-validated targeted Core run — 2026-08-24

User clean worktree was fast-forwarded to `0b9b87da582b`; `git status --short` was empty.

`RUN_FEEDBACK_CORE_CLOSURE.cmd` result:

- launcher targeted self-check: **13/13 PASS**;
- exact Scarlett 18i20 (3rd Gen): PASS;
- canonical existing `Companion Scarlett 18i20` client: authorised;
- module version: **0.1.16**;
- Air 1–8: baseline missing, 8 SKIP;
- Pad 1–8: baseline missing, 8 SKIP;
- Monitor Mute: baseline missing, 1 SKIP;
- Monitor Dim: baseline missing, 1 SKIP;
- runnable targets: **0**;
- `DYNAMIC_CLOSED=0`;
- `SKIP_BASELINE_UNKNOWN=18`;
- `FAIL=0`;
- `RESTORE_QUARANTINE=0`;
- **hardware writes=0**.

This is a valid baseline/actionability result, not a hardware-control failure.

Production state policy intentionally leaves absent Control Server values unknown; the parser records an initial value only when the server supplies one. Historical hardware work already showed repeated `device-subscribe subscribe=true` made no state progress.

Therefore these 18 Core feedback instances are currently **EVAL_ONLY_NONACTIONABLE in this bootstrap state**. Do not assume false, use rendered F as a baseline, write to manufacture a baseline, repeatedly reconnect/resubscribe, rerun Core unchanged, or create another direct client.

## Read-only planning after Core result

Planning against V8 evidence + current 18i20 hardware evidence profile produced these corrections:

- `mixer_slot_source` and `mixer_slot_stereo` are explicitly **withheld by the current 18i20 hardware evidence profile**; do not target them for write-driven feedback closure;
- `mix_talkback` is likewise withheld; left lanes also carry no-effect evidence;
- `output_mute` is not a good next batch: many AVAILABLE outputs have unknown mute baseline, several right members have repeatable behavior mismatch, and outputs 21–24 have availability UNKNOWN;
- `output_stereo` has many true/true pair vectors whose exact reconstruction is not proven;
- `output_source` available left-member paths are already largely WRITE_CONFIRMED while right members are pair-owned aliases; availability UNKNOWN remains no-write.

The next safe actionable island is the already-proven **existing Playback strip exact-restore path** used by focused meter closure.

## Prepared next batch — Mix mute/solo feedback

Files:

- `testbench/MixFeedbackClosure.js`;
- `testbench/RUN_MIX_FEEDBACK_CLOSURE.cmd`;
- `test/mix-feedback-closure.test.js`.

Status: **prepared/static-reviewed; not yet user hardware-validated**.

Scope/safety contract:

1. no FULL;
2. no package build/install;
3. no direct Control Server client;
4. existing canonical Companion connection only;
5. dynamically detect the already-existing Playback mixer slot — never hardcode historical slot 3;
6. fresh snapshot through existing Companion path;
7. lane is eligible only if Playback strip gain+mute+solo baseline tuple is server-confirmed;
8. campaign writes only `mix_mute` and `mix_solo`;
9. campaign does **not** change mix gain;
10. no Output Source / pair source writes;
11. no Mixer Slot Source/Stereo writes;
12. no mix talkback;
13. no 1677 / Advanced Raw / firmware/reset/restore/snapshot;
14. unknown baseline => SKIP, zero write for that target;
15. feedback checked against independent server boolean at baseline, alternate and restored baseline;
16. exact hardware restore failure => `QUARANTINED_RESTORE` + HARD ABORT;
17. confirmed hardware restore + wrong feedback => feedback FAIL, not fake restore failure;
18. temporary Page 2 mutation is conservative/audited; original V8 capability-lab Page 2 must be restored before another campaign;
19. if `b_text_*` marker has not materialized, the runner may use the existing V8 fallback that presses only the already-audited **action-free r9 feedback cell**; this cannot issue a Focusrite write;
20. no-runnable + known feedback mismatch exits FAIL, not misleading NO-OP SAFE.

Historical evidence suggests Mix A L/R may be the only baseline-ready lanes, but **runtime decides**. Do not promise a target count before the run.

Launcher sequence:

- `[0/2]` Node syntax + targeted regression tests, no hardware;
- `[1/2]` existing read-only Remote Devices/connection preflight;
- explicit `MIX_FEEDBACK` confirmation;
- explicit `ALL_ISOLATED` confirmation;
- `[2/2]` targeted Mix mute/solo closure.

Exit semantics:

- `0`: exercised targets complete without FAIL/quarantine and Page 2 restored;
- `8`: no exact-baseline target, no useful hardware write;
- `2`: feedback/campaign failure with restoration safe where reported;
- `4`: hardware restoration not confirmed / hard abort;
- `6`: hardware restored but Page 2 restoration not confirmed — no later campaign until fixed.

Local sanitized result:

`testbench\results\LATEST_MIX_FEEDBACK_CLOSURE.json`

## Meter evidence retained

46 meter paths:

- inputs 8/8 closed;
- outputs 4/26 closed;
- mixes 2/12 closed;
- total 14/46;
- mismatch 0.

Mix A L/R meter closure remains valid. Mix B–F write-driven meter closure remains non-actionable because exact Playback-strip baselines are missing (`ACTIONABLE=0 ALREADY_CLOSED=2 BASELINE_UNKNOWN=10`). Do not infer defaults or rerun direct research.

## Remote Devices authorization — mandatory before any write

Canonical normal client is the existing approved **Companion Scarlett 18i20** connection. Reuse it; never recreate it merely for testing. Require current own-client authorisation before writes.

Do not create a new direct Control Server client to inspect state Companion can expose. A future direct client is exceptional and requires explicit warning/agreement before launch. Never reuse/copy Companion's private client key into another process.

## Production package / permanent safety

Keep exact audited installed package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

No TestBench/debug package installation.

Permanent restrictions:

- only Scarlett 18i20 (3rd Gen) supported;
- Monitor gain 1677 read-only;
- no input preamp gain, direct input HW mute, per-channel phantom, Mic Kill or physical Monitor-level write;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no write to explicit UNKNOWN output availability;
- server-confirmed feedback/state only;
- dynamic Control Server port/device ID;
- no Focusrite software/firmware/routing/hardware setting changes outside an explicitly agreed test.

## Software/tooling state

Last broad software audit remains `fba6d977...`: **192/192 PASS**, package build PASS, RUN OK, no hardware.

Current feedback work after that checkpoint is TestBench/tests/docs only; production `src/` behavior and installed 0.1.16 remain unchanged.

Do not divert to broad release/tooling audit now.

## Publication

Official Bitfocus repository/name decision still pending. Publication is not the current parent objective while feedback closure remains open. Do not rename IDs/packages or broaden scope.

## Exact immediate next step

Fetch current live `testbench/meter-routing-exact-restore`, fast-forward the clean audit worktree, require empty `git status --short`, then run only:

`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`

Do not run Core, FULL, SAFE, direct probes or broad output tests first.

If targeted self-check fails, diagnose only that failure; no hardware should have run. If preflight passes, type `MIX_FEEDBACK` and then `ALL_ISOLATED`. No special audio signal is required.

After the run, record full per-target/summary result, exact hardware restore and Page 2 restore. Do not launch another campaign before reconciling those results into the matrix/handoff.
