# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 17:59+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_FEEDBACK_SNAPSHOT_SIGNATURE_DRIFT_FIX_PREPARED_PENDING_USER_LOCAL_VALIDATION`
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
User ran `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd` from checkout `9c12a4eb27fe`.

Validated before hardware runner:
- targeted software self-check **34/34 PASS**;
- Companion/Remote Devices preflight PASS;
- exact model Scarlett 18i20 (3rd Gen);
- existing `Companion Scarlett 18i20` client authorised;
- initial Page 2 `STALE_FOCUSRITE_TESTBENCH_HARNESS`, 769 controls, replacement-candidate YES;
- `PAGE2_AUTO` PASS using the existing importer;
- connection preservation PASS; no new Focusrite connection;
- no Focusrite hardware write during Page 2 replacement;
- post-import preflight PASS;
- final preparation checker saw `CURRENT_EXACT_NAME`, 768 controls, snapshot `5a4f6d39578ea335`, `PREP_READY`;
- user explicitly entered `MIX_FEEDBACK` and `ALL_ISOLATED` under launcher safety conditions.

Hardware-runner outcome:
- `MixFeedbackClosureRunner.js` recaptured a fresh capability snapshot before any write;
- the same 768-control Page 2 then classified `STALE_FOCUSRITE_TESTBENCH_HARNESS`, replacement-candidate YES;
- runner returned **PREP_REQUIRED** before Playback detection/writes;
- hardware writes **0**;
- runner Page 2 mutations **0**;
- hardware restore required **NO**;
- no Scarlett hardware failure occurred.

## Root cause: runtime snapshot-signature drift
`FullTestBenchPageV4.computeHarnessSignature()` includes the public runtime snapshot, test sources and generated batches. `buildExtendedPageV4()` embeds that signature in the capability-lab page name. `prepareLab()` requires the newly generated page name to match for an exact current harness.

Therefore the final checker can see the freshly imported page as exact, while the runner seconds later recaptures a changed server-confirmed runtime value and rebuilds a new signature. That makes the safe just-audited V8 page look stale even though neither hardware nor unsafe Companion content changed.

## Source fix prepared — NOT YET USER-VALIDATED
`MixFeedbackClosureRunner.js` now retains its fresh server snapshot and fail-closed guard, but can accept the immediately previous V8 snapshot signature only after a strict additional read-only compatibility audit.

Acceptance requires all of the following:
- Page 2 already classifies `STALE_FOCUSRITE_TESTBENCH_HARNESS`;
- `safeReplacementCandidate=true`;
- current Page 2 control count equals the freshly built V8 batch count;
- every expected V8 location exists;
- every control has exactly the expected action count;
- action definition families match at each location;
- exactly one Focusrite instance is referenced;
- exact module ID `focusrite-scarlett-18i20`;
- exact module version 0.1.16;
- resolved live Focusrite connection corresponds to the audited r9 connection.

Fail-closed cases remain PREP_REQUIRED before Playback detection/write:
- user/other page;
- unverified TestBench marker;
- action family mismatch;
- extra/missing control;
- wrong module/version;
- ambiguous/wrong Focusrite connection.

If compatibility passes, runner logs `PASS Capability Lab Page 2 compatibility` with `snapshot-signature drift only`, then uses the new server snapshot for Playback detection and exact lane baselines. It still generates a temporary page containing only targeted `mix_mute` / `mix_solo` actions. On completion it restores a fresh audited capability-lab page generated from the current snapshot.

Regression changes:
- `test/mix-feedback-preparation.test.js` now reproduces the compatible signature-drift case and rejects wrong action family, extra control, wrong module and user page;
- `test/mix-feedback-closure.test.js` verifies the compatibility audit occurs before Playback detection and preserves PREP_REQUIRED vs restoration-failure semantics.

No CI/status checks are attached to the current GitHub commit, so this is **implemented/source-reviewed**, not software-tested PASS until the user's local `[0/3]` completes.

## Update launcher state
The user's checkout `9c12a4e` predates the simplified updater correction now on the remote objective branch. The old local updater may still self-dirty or mangle paths. If it is still the blocker, one minimal bootstrap is permitted once; immediately return to normal launchers afterward.

The remote updater correction:
- stores `UPDATE.bat` canonically as LF in Git;
- derives the actual root using `git rev-parse --show-toplevel`;
- keeps explicit fetch, stale-index refresh, safety stash and `pull --ff-only`;
- does not auto-jump linked worktrees;
- reports another owning worktree and stops safely when appropriate.

## Parent hardware objective remains open
- 31 public feedback definitions / 829 instances.
- Static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Meter closure 14/46; inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0; hardware restore YES; Page 2 restore YES.
- Mix A L/R meters remain closed.
- Mix B-F meter write path remains nonactionable because exact Playback-strip baselines are unavailable.
- Targeted Core feedback 18/18 SKIP_BASELINE_UNKNOWN, zero writes/FAIL/restore quarantine; currently nonactionable.

Do not rerun FULL just to improve counts. Return directly to targeted `mix_mute` / `mix_solo` closure after this blocker is removed.

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
2. Get the current objective branch into `E:\_Project\focusrite-control`; if the old updater still self-blocks, use only the already-established minimal bootstrap, then return to launchers.
3. Run `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd` again.
4. `[0/3]` must pass completely; expected test count is higher than 34 because the strict compatibility regression was added.
5. Use existing `PAGE2_AUTO` only if the checker again reports the recognized stale replacement candidate.
6. Continue through `MIX_FEEDBACK` / `ALL_ISOLATED` only under launcher safety conditions.
7. In `[3/3]`, valid paths are exact current Page 2 or `PASS Capability Lab Page 2 compatibility` before Playback detection. Any other mismatch stays PREP_REQUIRED with zero writes.
8. Capture the full final `SUMMARY`, hardware restore status and Page 2 restore status before updating the parent feedback matrix.
9. Do not substitute FULL/Core/SAFE/broad meter/direct probes/package install.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
