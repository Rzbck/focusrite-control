# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 17:29+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `UPDATER_LINKED_WORKTREE_OWNER_CONFIRMED_FIX_READY_PENDING_USER_LOCAL_UPDATE`
Canonical production candidate in Companion: exact audited **0.1.16**
Last fully validated broad software checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840` — 192/192 tests PASS + package build PASS, no hardware validation.

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, choose the objective branch using recency + relevance, resolve its current remote HEAD, inspect newer material commits/diff, read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref, then reconcile newer completed user/hardware evidence before choosing the next action.

A default-branch search can miss newer branch work. A document timestamp or embedded SHA is a checkpoint only.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST

Permanent usability rule:
- `UPDATE.bat` for normal branch update/sync;
- `UPDATE_AND_RUN.bat` for update + normal validation;
- `RUN.bat` when already current and a normal software gate is needed;
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work;
- prefer these launchers over raw Git, PowerShell, Node, or one-off shell commands;
- manual shell/Git/PowerShell is last resort only when the launcher itself is blocked/broken or cannot expose the needed diagnostic; explain why, use the smallest possible recovery, then return immediately to launchers;
- never build a second helper/workflow for behavior already implemented in the repository;
- linked worktrees are supported: if a selected branch is already active in another worktree, update that owning worktree rather than trying to attach the branch twice.

## Latest completed user TestBench result

User ran `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd` from checkout `804d977809ff`.

Observed:
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

The targeted Mix launcher is wired to reuse this existing path only for the recognized stale TestBench classification. User/other/unverified pages remain blocked.

## Current blocker — linked worktree owns the objective branch

Latest user updater result:
- updater was launched from a local audit worktree on a local-only branch;
- user selected `testbench/meter-routing-exact-restore`;
- remote branch fetched successfully;
- Git then returned `fatal: 'testbench/meter-routing-exact-restore' is already used by worktree at '<other worktree>'`;
- no merge/reset was performed.

Interpretation:
- there are linked Git worktrees;
- the objective branch is already checked out in a different worktree;
- Git correctly forbids checking out the same local branch simultaneously in a second worktree;
- this is a launcher/worktree-routing issue, not a branch, Focusrite, Companion, or hardware failure.

Source fix now prepared on the live objective branch:
- `UPDATE.bat` inspects `git worktree list --porcelain` before `git switch`;
- if the selected branch already belongs to another worktree, updater changes context to that worktree automatically;
- dirty-state refresh/stash and `pull --ff-only` are then performed in the actual branch-owning worktree;
- updater prints worktree/branch/HEAD context;
- `test/update-and-run-context.test.js` contains regression coverage for the worktree-aware routing contract.

This change is **implemented but pending user-local validation**. Do not call it software-tested PASS yet.

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

Do not rerun FULL just to improve counts. Once updater/Page2 preparation blocker is removed, return directly to the targeted `mix_mute` / `mix_solo` closure path.

## Permanent safety

- Hardware support claim only Scarlett 18i20 (3rd Gen).
- Monitor gain 1677 read-only.
- No input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, or physical Monitor level write.
- Dynamic Control Server port and device ID.
- Writes only after this module's own Remote Devices authorization is confirmed.
- Feedback/state from server-confirmed state only.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands, or writes to meter/status/read-only items.
- No writes to explicit UNKNOWN output availability.
- Reuse existing approved `Companion Scarlett 18i20`; no extra direct Control Server client for normal validation.
- No Focusrite software/firmware/routing changes outside explicitly agreed tests.
- No TestBench/debug package install over exact audited 0.1.16.

## Exact immediate next step

1. Resolve live branch freshness first.
2. Use the worktree that already owns `testbench/meter-routing-exact-restore`; do not try to attach the branch to the audit worktree.
3. Run that owning worktree's `UPDATE.bat` and choose `[1]` to update the branch in place.
4. Once current, run `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
5. For the recognized stale harness, use existing `PAGE2_AUTO`; let read-only preflight + Page 2 re-audit finish.
6. Continue to `MIX_FEEDBACK` / `ALL_ISOLATED` only under launcher safety conditions and capture the full targeted hardware result.
7. Do not substitute FULL/Core/SAFE/broad meter/direct probes/package install.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file before handoff. Do not claim pending work passed.
