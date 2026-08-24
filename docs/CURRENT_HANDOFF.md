# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 17:50+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `UPDATER_SELF_NORMALIZATION_FIX_PREPARED_PENDING_ONE_TIME_BOOTSTRAP`
Canonical production candidate in Companion: exact audited **0.1.16**
Last fully validated broad software checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840` — 192/192 tests PASS + package build PASS, no hardware validation.

## MANDATORY STARTUP FRESHNESS GATE
When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, not only `main`; identify the newest MATERIAL movements by commit time; choose the objective branch using BOTH recency and relevance; resolve its current remote HEAD; inspect newer commits/diff; read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref; reconcile any newer completed user/hardware result and newer completed physical/human result; only then choose the next action.

A default-branch search can miss newer branch work. A document timestamp or embedded SHA is a checkpoint only.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST
- `UPDATE.bat` for normal branch update/sync.
- `UPDATE_AND_RUN.bat` for update + normal validation.
- `RUN.bat` when already current and a normal software gate is needed.
- Exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Prefer these launchers over raw Git, PowerShell, Node, or one-off shell commands.
- Manual shell/Git/PowerShell is last resort only when the launcher itself is blocked/broken or cannot expose the needed diagnostic; use the smallest recovery and return immediately to launchers.
- Never build a second helper/workflow for behavior already implemented in the repository.
- Worktree behavior is conservative: if a different selected branch is already owned by another linked worktree, report its owner and stop; do not auto-jump directories.

## Latest completed user TestBench result
User ran `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd` from checkout `e9c4a528315b`.

Result at `[0/3]`:
- total tests 34;
- **32 PASS / 2 FAIL**;
- launcher stopped before preflight exactly as intended;
- Remote Devices preflight: NO;
- PAGE2_AUTO: NO;
- Focusrite hardware writes: 0;
- Companion Page 2 mutations: 0;
- hardware restore required: NO.

The two software failures were diagnosed and source-fixed:
1. root HANDOFF had lost explicit objective-continuity wording required by an existing regression contract; the immutable block is restored rather than weakening the test.
2. `test/mix-feedback-closure.test.js` matched the syntax-check mention of `MixFeedbackPreparationCheck.js` instead of the executed prep guard; it now checks `call :RUN_PREFLIGHT` then `call :RUN_PREP_CHECK`, then `MIX_FEEDBACK`, `ALL_ISOLATED`, and finally the hardware runner.

No hardware engine/write-scope change was made for these failures. They remain implemented/source-reviewed, not software-tested PASS until the user's local `[0/3]` succeeds.

## Latest updater failure and diagnosis
A later normal `UPDATE.bat` run, intended to receive the above fixes, failed before merge:
- `Dossier depot : E:_Project\focusrite-control` was malformed;
- `HEAD local : UNKNOWN` and `HEAD distant : UNKNOWN`;
- automatic linked-worktree routing selected the same malformed path;
- `git status --short` reported `M UPDATE.bat`;
- updater created a safety stash but `UPDATE.bat` remained modified afterward;
- updater aborted with no merge/reset.

Diagnosis:
- the tracked `UPDATE.bat` blob had been written with CRLF into Git while `.gitattributes` requires Windows launchers to be stored canonically as LF in Git and checked out CRLF;
- this creates a self-dirty launcher state that stash/restore can fail to clear predictably;
- automatic linked-worktree directory switching added unnecessary path manipulation.

Prepared source correction:
- current `UPDATE.bat` is republished as a canonical **LF Git blob**;
- root path is derived from `git rev-parse --show-toplevel`;
- local/remote/final HEAD diagnostics remain;
- explicit selected-branch fetch, stale-index refresh, safety stash, and `git pull --ff-only` remain;
- automatic linked-worktree switching is removed;
- if a different branch is already active elsewhere, updater prints `Worktree proprietaire` and stops safely;
- `test/update-branch-fetch.test.js` enforces canonical LF Git blobs for tracked Windows launchers;
- `test/update-and-run-context.test.js` locks canonical-root resolution and conservative worktree behavior.

This updater correction is implemented/source-reviewed but pending user-local validation.

## Last completed read-only Page 2 classification
Earlier completed run at `804d977809ff`:
- targeted self-check 20/20 PASS;
- Remote Devices/model/connection preflight PASS;
- exact model Scarlett 18i20 (3rd Gen);
- existing `Companion Scarlett 18i20` client authorised;
- r9 audit 42 SAFE setters + 829 feedback probes + 31 definitions;
- module 0.1.16;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- evidence coverage 1436/1436 inventory, snapshot 1340/1340, core 21/21, feedback 829/31;
- output availability AVAILABLE=22, UNKNOWN=4;
- Page 2 = `STALE_FOCUSRITE_TESTBENCH_HARNESS`;
- Page 2 controls = 769;
- `replacement-candidate=YES`;
- hardware writes 0;
- Page 2 mutations 0;
- hardware restore required NO.

Interpretation: Page 2 is a recognized older Focusrite TestBench harness, not arbitrary user content.

## Existing Page 2 preparation path
Do not rebuild it. `FullTestBenchCompanionImportV7.js` already implements historical V8 `PAGE2_AUTO`: replace only Page 2, keep Page 1 r9, reuse/remap to the existing Focusrite connection, refuse connection recreation, re-audit pages/connections, and send no Focusrite hardware write. Targeted Mix uses this path only for the recognized stale TestBench classification; user/other/unverified pages remain blocked.

## Parent hardware objective remains open
- 31 public feedback definitions / 829 instances.
- Static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Meter closure 14/46; inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0; hardware restore YES; Page 2 restore YES.
- Mix A L/R meters remain closed.
- Mix B-F meter write path remains nonactionable because exact Playback-strip baselines are unavailable.
- Targeted Core feedback 18/18 SKIP_BASELINE_UNKNOWN, zero writes/FAIL/restore quarantine; currently nonactionable.

Do not rerun FULL just to improve counts. Once the updater/software gate blocker is removed, return directly to targeted `mix_mute` / `mix_solo` closure.

## Remote Devices / client isolation
No extra direct clients by default.
Never reuse/copy the Companion private client key into another process.
Reuse the existing approved `Companion Scarlett 18i20` client for normal validation. Direct Control Server research clients remain research-only and must not run in parallel with SAFE/FULL/write-capable TestBench campaigns.

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
2. Because the user's installed `UPDATE.bat` is the broken self-dirty version, one final minimal manual bootstrap is allowed: fetch the live objective branch, restore only `UPDATE.bat` from that remote ref, then fast-forward. This is last resort because the launcher itself is the blocker.
3. Immediately return to normal `UPDATE.bat`. It must display a canonical repository path and real local/remote/final HEAD values.
4. Once updater validation succeeds, run `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
5. `[0/3]` must pass completely before any preflight or hardware work.
6. For recognized stale Page 2, use existing `PAGE2_AUTO`; let read-only preflight + Page 2 re-audit finish.
7. Continue to `MIX_FEEDBACK` / `ALL_ISOLATED` only under launcher safety conditions and capture the targeted hardware result.
8. Do not substitute FULL/Core/SAFE/broad meter/direct probes/package install.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
