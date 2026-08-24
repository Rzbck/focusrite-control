# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24, after the Mix Page 2 PREP_REQUIRED source fix
Branch: `testbench/meter-routing-exact-restore`
Gate: `MIX_FEEDBACK_PAGE2_READONLY_CLASSIFICATION_READY_USER_LOCAL_GATE_PENDING`
Latest user-run checkpoint: `bd2a0ccfc2e2525b6c56f56599285865d64fe54a`
Latest prepared source checkpoint before this handoff update: `652af3c45c3362a29f4ca9ebe50a86ebc6b1e433`
Exact fully validated broad software-audit checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840`
Canonical production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — REPO-WIDE RECENCY FIRST

When the user says `HANDOFF`, do **not** resume from chat history, uploaded project files, an embedded SHA, the default branch, or this file alone.

The root `HANDOFF` is the canonical resume entrypoint and now requires a repository-wide live freshness check.

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. establish the current date/time;
2. inspect recent **remote branch movement across the repository**, not only `main`;
3. compare branch tips / commit timestamps and inspect newer material commits;
4. choose the objective-owning branch using **recency + relevance**, not recency alone;
5. resolve that branch's live HEAD and compare it with the checkpoint recorded here;
6. inspect divergence/merge-base if the checkpoint is not an ancestor;
7. read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref;
8. inspect current affected code/tests and newest sanitized evidence;
9. reconcile any newer completed user/hardware result;
10. only then choose the next action.

A default-branch commit search can miss newer work on another branch and must never be treated as proof that no newer work exists.

If live GitHub access is unavailable, state that live freshness could not be verified. Do not silently present an older uploaded handoff as current.

An SHA or `Updated:` timestamp here is a checkpoint/context only, never permission to skip live Git.

Evidence priority after freshness resolution:

1. newest completed physical/human hardware result;
2. newest completed software gate/result;
3. current code/tests and relevant newer commits on the live objective branch;
4. this live handoff;
5. older docs/uploads/captures/chat summaries.

Always distinguish **hardware-tested**, **software-tested**, **implemented**, **schema-observed**, **research-only**, **pending**, and **unsupported**.

## Objective continuity — still mandatory

Current parent objective remains:

**explicit hardware feedback closure using `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`.**

A completed sub-question, green software gate, complete inventory, zero FAIL, or static oracle PASS does not close the parent objective while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, or otherwise open rows remain.

Do not divert to publication/release work while a safe/actionable feedback-closure path remains.

## Last completed user run — Mix mute/solo launcher at `bd2a0ccfc2e2`

Launcher:

`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`

User-validated results:

- clean worktree at `bd2a0ccfc2e2`;
- targeted self-check: **15/15 PASS**;
- local Companion detected;
- exact model `Scarlett 18i20 (3rd Gen)`;
- canonical `Companion Scarlett 18i20` client authorised;
- connection `Connected / authorised`;
- r9 page audit PASS: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module version 0.1.16;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- evidence coverage 1436/1436 inventory rows, snapshot 1340/1340, core 21/21, feedback 829/31;
- output capability AVAILABLE=22, UNKNOWN=4.

The run then stopped because the **exact current V8 capability-lab harness was not on Companion Page 2**.

That failure happened before any hardware write and before any Page 2 import/mutation.

For that user run:

- Focusrite hardware writes: **0**;
- `mix_mute` writes: **0**;
- `mix_solo` writes: **0**;
- output/routing writes: **0**;
- Companion Page 2 mutations: **0**;
- hardware restoration required: **NO**;
- Page 2 restoration required: **NO**;
- package build/install: **0**;
- direct Control Server client: **0**.

The old launcher printed:

`HARD ABORT : restauration hardware non confirmee.`

That message was false for this pre-write condition. It was a TestBench status/reporting defect, not a Scarlett restore incident.

## Source-side fix now prepared — NOT YET USER-VALIDATED

Do not promote the following to PASS until the user's local targeted self-check runs successfully.

### Handoff freshness hardening

Root `HANDOFF` was strengthened so future `HANDOFF` resumes must inspect repository-wide remote branch movement before trusting a written branch/timestamp.

Relevant commits include:

- `60dfdfaa750e1ed9c3a6d5e6c98d032639e2a1d0` — repo-wide live recency contract;
- `3b592e7767f1621e5754ff8dc7485a2b430c76c6` — regression coverage for that contract.

### Page 2 read-only identity classification

`FullTestBenchRunnerV4Preflight.js` now classifies Companion Page 2 without mutating it:

- `MISSING`;
- `CURRENT_EXACT_NAME`;
- `STALE_FOCUSRITE_TESTBENCH_HARNESS`;
- `OTHER_OR_USER_PAGE`;
- `UNVERIFIED_TESTBENCH_MARKER`.

A stale page is considered a possible safe replacement candidate only when it:

- has the expected Focusrite TestBench capability-lab naming/marker;
- contains real actions referencing exactly one instance;
- that instance is the expected `focusrite-scarlett-18i20` module at the expected version.

A marker string alone is not trusted.

No Page 2 mutation is performed by this classification.

### Read-only preparation checker

New file:

`testbench/MixFeedbackPreparationCheck.js`

Behavior:

- calls the existing read-only `prepareLab()` path;
- prints sanitized Page 2 classification and control count;
- if the exact current harness is absent, exits **9 = PREP_REQUIRED**;
- prints hardware writes 0 / Page 2 mutations 0 / no restore required;
- never imports/replaces Page 2;
- has no Mix/Focusrite write permission flags;
- refuses to describe an unknown/user page as safe for automatic replacement.

### Fail-safe hardware runner

New launcher target:

`testbench/MixFeedbackClosureRunner.js`

It uses the existing tested Mix closure helpers but changes the runner semantics:

- re-runs `prepareLab()` immediately before any targeted hardware work;
- `prep: 'harness'` or missing exact Page 2 => **PREP_REQUIRED exit 9**, zero hardware writes, zero Page 2 mutation;
- missing mixer variables => PREP_REQUIRED 9;
- unexpected top-level pre-write exception => generic failure code 2, **not hardware restore code 4**;
- code 4 remains reserved for the tracked path where hardware restoration is actually unconfirmed after a write attempt;
- code 6 remains Page 2 restoration-unconfirmed after a real temporary Page 2 mutation;
- code 8 remains no-actionable-target safe no-op.

This second preparation guard closes the race where Page 2 could change between the read-only checker and the hardware runner.

### Launcher ordering

`RUN_MIX_FEEDBACK_CLOSURE.cmd` now does:

1. targeted syntax/tests — no hardware;
2. read-only Remote Devices/connection preflight;
3. **read-only Page 2 preparation checker**;
4. if PREP_REQUIRED => stop with code 9 before `MIX_FEEDBACK` / `ALL_ISOLATED` prompts;
5. only when Page 2 is exact/current does it ask for hardware confirmations;
6. hardware stage invokes `MixFeedbackClosureRunner.js`, which repeats the Page 2 guard.

No automatic Page 2 replacement has been added to this targeted launcher yet.

### Regression tests prepared

New/updated targeted tests cover:

- Page 2 current/stale/user/unverified classification;
- strict read-only preparation checker;
- PREP_REQUIRED exit 9 distinct from restore failure;
- preparation check occurs before hardware confirmations;
- fail-safe hardware runner is used by the launcher;
- unexpected pre-write exceptions are not mapped to code 4;
- existing Mix mute/solo scope and forbidden-family regressions remain.

These tests are **prepared but not yet reported as passing by the user's local Node run**.

An intermediate malformed import edit was corrected before this handoff. Do not use intermediate commit SHAs as a resume point; always use live branch HEAD.

## Why the Page 2 mismatch may happen

The V8 capability-lab page name/signature is calculated from the current capability snapshot and generated batches.

The snapshot does **not** include meter telemetry, so ordinary audio meter movement is not the cause.

It does include many optional/restorable current values such as output routing/gain/stereo, mixer-slot state, and mix strip gain/pan/mute/solo. Presence/value differences across bootstrap/session state can therefore produce a different expected harness signature even if an earlier hardware campaign restored safely.

Do not infer from `Page 2 restore YES` in an earlier run that the old page must forever match a later freshly generated signature.

## Page 2 preservation finding

Companion exposes a native single-page export path. The safe future preparation design should preserve Page 2 locally before any deliberate replacement, using a single-page export with secrets excluded.

The existing import tooling already verifies:

- only Page 2 changes;
- Page 1 remains the audited r9 page;
- the existing Focusrite connection set is preserved;
- the imported harness maps to the existing Focusrite connection;
- expected harness is found exactly after import.

However, the current targeted Mix launcher **does not yet automatically replace Page 2**. That is intentional until the live Page 2 classification is observed.

If Page 2 is `OTHER_OR_USER_PAGE` or `UNVERIFIED_TESTBENCH_MARKER`, do not overwrite it automatically.

If it is a recognized `STALE_FOCUSRITE_TESTBENCH_HARNESS`, the next source step may add an explicit backup + deliberate replacement flow, with local ignored backup and restore/audit protection.

## Existing retained hardware evidence

### Meter closure

Completed meter-routing exact-restore run:

- 46 total meter paths;
- inputs 8/8 dynamically closed;
- outputs 4/26 dynamically closed;
- mixes 2/12 dynamically closed;
- total 14/46;
- mismatch 0;
- hardware restore YES;
- Companion Page 2 base restore YES.

Mix A L/R meter closure remains valid.

Mix B-F write-driven meter closure remains nonactionable because exact Playback-strip baselines are missing: `ACTIONABLE=0 ALREADY_CLOSED=2 BASELINE_UNKNOWN=10`.

Do not rerun broad meter routing or direct baseline research.

### Targeted Core feedback

User-run checkpoint:

`0b9b87da582b690b6d22c19a791816b3d584b7d1`

Result:

- Air 1-8 baseline unknown: 8 SKIP;
- Pad 1-8 baseline unknown: 8 SKIP;
- Monitor Mute baseline unknown: 1 SKIP;
- Monitor Dim baseline unknown: 1 SKIP;
- `DYNAMIC_CLOSED=0`;
- `SKIP_BASELINE_UNKNOWN=18`;
- FAIL=0;
- restore quarantine=0;
- hardware writes=0.

These are currently `EVAL_ONLY_NONACTIONABLE` in this bootstrap state. Do not assume false, manufacture baselines, repeatedly reconnect/resubscribe, rerun Core unchanged, or create another direct client.

## Feedback parent matrix retained

Canonical checklist:

`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`

Retained V8 facts:

- public feedback definitions: **31**;
- feedback instances: **829**;
- static/oracle: **190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- dynamic tracker: **20 both-state / 12 single-state / 710 neverObserved / 0 FAIL**.

Do not rerun FULL just to improve these counts.

The existing Playback-strip Mix mute/solo path remains the next safe/actionable island once Page 2 preparation is resolved.

## Remote Devices and production safety

Canonical normal client is the existing approved **Companion Scarlett 18i20** connection.

Reuse it. Do not delete/recreate it for testing.

Do not create another direct Control Server client merely to inspect state Companion already exposes.

Never copy/reuse the Companion private client key in another process.

Keep exact audited installed production package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

No TestBench/debug package installation.

Permanent restrictions remain:

- hardware support claim only Scarlett 18i20 (3rd Gen);
- Monitor gain 1677 read-only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no physical Monitor-level write;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no write to explicit UNKNOWN output availability;
- feedback/state only from server-confirmed state;
- dynamic Control Server port and device ID.

## Software checkpoints

Last fully validated broad software audit remains:

`fba6d977a59b6381ae11c736a68fc809afb55840`

Result: **192/192 tests PASS**, package build PASS, RUN OK, no hardware validation.

Do not claim the new PREP_REQUIRED changes have passed until the user's local targeted self-check reports it.

Production `src/` and installed 0.1.16 are unchanged by this Page 2/TestBench fix.

## EXACT IMMEDIATE NEXT STEP

First perform the mandatory live repository freshness gate.

If the live objective branch still contains the prepared PREP_REQUIRED fix described above and no newer user result supersedes it:

1. fast-forward/update the user's clean TestBench worktree to the **live HEAD** of `testbench/meter-routing-exact-restore`;
2. run `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`;
3. let `[0/3]` targeted self-check run first;
4. let `[1/3]` Remote Devices preflight run read-only;
5. let `[2/3]` Page 2 preparation check run read-only;
6. if it exits `PREP_REQUIRED` / code 9, record the displayed Page 2 classification and stop — **zero hardware writes, zero Page 2 mutations, no restore required**;
7. do not repeatedly rerun it; use that classification to decide the preservation/preparation path;
8. if Page 2 is unexpectedly already exact/current and the launcher reaches the `MIX_FEEDBACK` confirmation, the user may stop there if the purpose of the run is only diagnosis; no hardware write occurs before that explicit confirmation.

Do not run FULL, Core, SAFE, broad meter routing, direct Control Server probes, or install any package as a substitute.

After the read-only Page 2 classification is known, update this handoff with the actual user result before proceeding to any Page 2 replacement or Mix mute/solo hardware writes.
