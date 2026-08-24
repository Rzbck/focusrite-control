# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 17:44+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_FEEDBACK_TARGETED_SELFCHECK_FIXES_PREPARED_PENDING_USER_LOCAL_VALIDATION`
Canonical production candidate in Companion: exact audited **0.1.16**
Last fully validated broad software checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840` — 192/192 tests PASS + package build PASS, no hardware validation.

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default.

Before proposing code or asking for a run:
1. inspect recent remote branch movement repo-wide, not only `main`;
2. identify the newest MATERIAL movements by commit time;
3. choose the objective branch using BOTH recency and relevance;
4. resolve its current remote HEAD;
5. inspect newer commits/diff since the last validated checkpoint;
6. read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref;
7. reconcile any newer completed user/hardware result and newer completed physical/human result;
8. only then choose the next action.

A default-branch search can miss newer work on another branch. A document timestamp or embedded SHA is a checkpoint only.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST

Permanent usability rule:
- `UPDATE.bat` for normal branch update/sync;
- `UPDATE_AND_RUN.bat` for update + normal validation;
- `RUN.bat` when already current and a normal software gate is needed;
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work;
- prefer these launchers over raw Git, PowerShell, Node, or one-off shell commands;
- manual shell/Git/PowerShell is last resort only when the launcher itself is blocked/broken or cannot expose the needed diagnostic;
- after recovery, return immediately to launchers;
- never build a second helper/workflow for behavior already implemented in the repository;
- linked worktrees are supported: update the worktree that already owns the selected branch rather than trying to attach the same branch twice.

## Latest completed user TestBench result — 2026-08-24 17:44+02:00

User ran:

`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`

Checkout during this completed run:

`e9c4a528315b`

Result at `[0/3]`:
- targeted test count: **34**;
- PASS: **32**;
- FAIL: **2**;
- launcher stopped before preflight exactly as intended;
- Remote Devices preflight launched: **NO**;
- PAGE2_AUTO launched: **NO**;
- Focusrite hardware writes: **0**;
- Companion Page 2 mutations: **0**;
- hardware restore required: **NO**.

The two failures were software-regression assertions only:
1. `test/full-testbench-v6-device-wide.test.js` required the root HANDOFF to retain the explicit immutable objective-continuity/no-premature-closure contract; the condensed handoff had dropped that wording.
2. `test/mix-feedback-closure.test.js` used `launcher.indexOf('MixFeedbackPreparationCheck.js', preflight)`, which matched the syntax self-check mention instead of the executed preparation guard after PAGE2_AUTO integration.

## Source fixes prepared after that run — NOT YET USER-VALIDATED

Two targeted corrections only:
- root `HANDOFF` now restores the full `IMMUTABLE OBJECTIVE-CONTINUITY / NO-PREMATURE-CLOSURE RULE`, including EVAL_ONLY, MANUAL_PENDING, BASELINE_UNKNOWN, neverObserved, remaining open matrix rows, direct blocker handling, mandatory return to the parent hardware objective, and the rule that an incomplete objective change is forbidden;
- `test/mix-feedback-closure.test.js` now checks the actual execution order using `call :RUN_PREFLIGHT` followed by `call :RUN_PREP_CHECK`, then `MIX_FEEDBACK`, `ALL_ISOLATED`, and finally the hardware runner.

No change was made for these failures to:
- `testbench/MixFeedbackClosure.js`;
- `testbench/MixFeedbackClosureRunner.js`;
- `testbench/RUN_MIX_FEEDBACK_CLOSURE.cmd` execution order;
- Focusrite hardware write scope.

Static source inspection confirms the two previously failing assertions now target the intended content/order, but the environment available to the AI could not clone/execute GitHub code because outbound GitHub DNS/network access was blocked. Therefore these fixes remain **implemented / source-reviewed, not software-tested PASS** until the user's local `[0/3]` succeeds.

## Last completed read-only Page 2 classification

Earlier completed run at `804d977809ff`:
- targeted software self-check **20/20 PASS**;
- local Companion / Focusrite connection preflight PASS;
- exact model `Scarlett 18i20 (3rd Gen)`;
- existing `Companion Scarlett 18i20` client authorised;
- r9 audit: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module 0.1.16;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- evidence coverage 1436/1436 inventory, snapshot 1340/1340, core 21/21, feedback 829/31;
- output availability AVAILABLE=22, UNKNOWN=4;
- Page 2 = **`STALE_FOCUSRITE_TESTBENCH_HARNESS`**;
- Page 2 controls = **769**;
- `replacement-candidate=YES`;
- Focusrite hardware writes = **0**;
- Companion Page 2 mutations = **0**;
- hardware restore required = **NO**.

Interpretation: Page 2 is a recognized older Focusrite TestBench harness, not arbitrary user content. Read-only classification is complete.

## Existing Page 2 preparation path

Do not rebuild it. `FullTestBenchCompanionImportV7.js` already implements the historical V8 `PAGE2_AUTO` path used by `RUN_SAFE_HARDWARE_TESTS.cmd`: replace only Page 2, keep Page 1 r9, reuse/remap to the existing Focusrite connection, refuse connection recreation, re-audit other pages/connections, and send no Focusrite hardware write.

The targeted Mix launcher reuses this existing path only for the recognized stale TestBench classification. User/other/unverified pages remain blocked.

## Update/worktree recovery completed

The objective worktree `E:\_Project\focusrite-control` was successfully fast-forwarded from `89d0b61` to `e9c4a52` after one-time recovery of the historically mis-normalized local `UPDATE_AND_RUN.bat` state. No forced reset/merge was used. The old local version remains preserved in stash.

Current updater source includes stale-index refresh, linked-worktree ownership routing, safety-stash handling, and exact path/HEAD diagnostics. Normal operator workflow remains launcher-first.

## Parent hardware objective remains open

Canonical feedback matrix retained:
- 31 public feedback definitions / 829 instances;
- static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL;
- dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.

Retained evidence:
- meter closure 14/46; inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0, hardware restore YES, Page 2 restore YES;
- Mix A L/R meters remain closed;
- Mix B-F meter write path remains nonactionable because exact Playback-strip baselines are unavailable;
- targeted Core feedback 18/18 SKIP_BASELINE_UNKNOWN, zero writes/FAIL/restore quarantine; currently nonactionable in this bootstrap state.

Do not rerun FULL just to improve counts. Once this software gate passes, return directly to targeted `mix_mute` / `mix_solo` closure.

## Remote Devices / client isolation

No extra direct clients by default.
Never reuse/copy the Companion private client key into another process.
Reuse the existing approved `Companion Scarlett 18i20` client for normal validation. Direct Control Server research clients remain isolated research-only tools and must not run in parallel with SAFE/FULL/write-capable TestBench campaigns.

## Permanent safety

- Hardware support claim only Scarlett 18i20 (3rd Gen).
- Monitor gain 1677 read-only.
- No input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, or physical Monitor level write.
- Dynamic Control Server port and device ID.
- Writes only after this module's own Remote Devices authorization is confirmed.
- Feedback/state from server-confirmed state only.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands, or writes to meter/status/read-only items.
- No writes to explicit UNKNOWN output availability.
- No Focusrite software/firmware/routing changes outside explicitly agreed tests.
- No TestBench/debug package install over exact audited 0.1.16.

## Exact immediate next step

1. Resolve live branch freshness first.
2. In the objective worktree, use normal `UPDATE.bat` and choose `[1]` to receive the latest targeted source fixes.
3. Run `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd` again.
4. `[0/3]` must pass completely before any preflight or hardware work.
5. If the recognized stale harness state recurs, use existing `PAGE2_AUTO`; let the launcher redo read-only preflight + Page 2 audit.
6. Continue to `MIX_FEEDBACK` / `ALL_ISOLATED` only under launcher safety conditions and capture the full targeted hardware result.
7. Do not substitute FULL/Core/SAFE/broad meter/direct probes/package install.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file before handoff. Do not claim pending work passed.
