# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 17:18+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `UPDATER_BOOTSTRAP_BLOCKED_OLD_LOCAL_UPDATE_STALE_INDEX_FIX_READY`
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
- never build a second helper/workflow for behavior already implemented in the repository.

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

## Current blocker — old local updater cannot bootstrap itself cleanly

Latest user update attempt:
- `UPDATE.bat` fetched `origin/testbench/meter-routing-exact-restore` through `80f8e15`;
- then `git pull --ff-only` aborted because local `UPDATE_AND_RUN.bat` would be overwritten;
- output said `Updating 89d0b61..80f8e15`;
- earlier terminal work in `E:\_Project\focusrite-control-audit` had reported HEAD `804d977809ff` and clean status.

This discrepancy means the old updater is affected by stale-index visibility and/or a different checkout/copy is being launched. Do not guess silently.

Source diagnosis:
- old updater at `89d0b61` could miss a tracked edit because it relied on `git status` before pull;
- current remote updater now runs `git update-index --really-refresh`, checks `git diff-files`, and auto-stashes detected local state before pull;
- current remote updater now prints `Dossier depot`, `HEAD local`, `HEAD distant`, and final `HEAD` to expose checkout/worktree confusion directly;
- `test/update-and-run-context.test.js` locks this stale-index refresh + context output behavior.

Because the user's currently executing updater predates the fix, **one minimal manual recovery command is permitted once** under the launchers-first rule. Immediately return to `UPDATE.bat` afterward.

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
2. The current user's old updater is itself blocked; if still necessary, use exactly one minimal manual Git recovery command in `E:\_Project\focusrite-control-audit` to preserve/remove only the blocking local `UPDATE_AND_RUN.bat` edit.
3. Immediately launch that same checkout's `UPDATE.bat`. The updated version must print its exact repository path plus local/distant/final HEAD.
4. Once current, launch `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
5. For the recognized stale harness, use the existing `PAGE2_AUTO` prompt; allow read-only preflight + Page 2 re-audit to complete.
6. Continue to `MIX_FEEDBACK` / `ALL_ISOLATED` only under the launcher's normal safety conditions and capture the full targeted hardware result.
7. Do not substitute FULL/Core/SAFE/broad meter/direct probes/package install.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file before handoff. Do not claim pending work passed.
