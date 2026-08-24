# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 17:07+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_FEEDBACK_PAGE2_STALE_HARNESS_RECOGNIZED_EXISTING_PAGE2_AUTO_REUSE_PENDING_LOCAL_UPDATE`
Canonical production candidate in Companion: exact audited **0.1.16**
Last fully validated broad software checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840` — 192/192 tests PASS + package build PASS, no hardware validation.

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default.

Before proposing code or asking for a run:

1. inspect recent remote branch movement repo-wide;
2. identify the newest material movement by time;
3. choose the objective branch using recency + relevance;
4. resolve its current remote HEAD;
5. compare with the last validated/user-run checkpoint and inspect newer commits/diff;
6. read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref;
7. reconcile newer completed user/hardware evidence;
8. only then choose the next action.

A default-branch commit search can miss newer work on another branch. A document timestamp or embedded SHA is a checkpoint only.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST

Permanent usability rule:

- Use `UPDATE.bat` for normal branch update/sync.
- Use `UPDATE_AND_RUN.bat` for normal update + validation workflow.
- Use `RUN.bat` when the checkout is already current and the normal software gate is required.
- Use the exact `testbench\\RUN_*.cmd` launcher for targeted hardware/TestBench work.
- Prefer these launchers over raw `git`, PowerShell, Node, or one-off shell commands.
- Manual Git/PowerShell/shell commands are **last resort only** when the launcher itself is blocked/broken or cannot expose the needed diagnostic. Explain why before using them.
- Once a launcher problem is fixed, return to the launcher workflow.
- Never build a second helper/tool for behavior already implemented in the repository. Inspect and reuse the existing path first.

## Latest completed user result — 2026-08-24

User ran:

`testbench\\RUN_MIX_FEEDBACK_CLOSURE.cmd`

Checkout during that completed run:

`804d977809ff`

### Targeted software gate

**20/20 PASS**.

Validated locally by the user's run:

- V6 pair-generic topology helpers/inventory/sweep tests PASS;
- meter feedback oracle tests PASS;
- all 31 public feedback definitions have independent V6 oracle mapping test PASS;
- manual Monitor-gain read-only safety test PASS;
- parent-objective continuity rule PASS;
- Mix mute/solo exact-baseline harness tests PASS;
- fail-safe Mix runner PREP_REQUIRED-vs-restore semantics PASS;
- Page 2 classification tests PASS;
- preparation checker strict read-only test PASS;
- launcher ordering/PREP_REQUIRED mapping test PASS.

No hardware was touched during the software gate.

### Read-only Remote Devices / connection preflight

PASS:

- local Companion detected;
- Focusrite module connection found;
- exact hardware model `Scarlett 18i20 (3rd Gen)`;
- existing canonical `Companion Scarlett 18i20` client authorised;
- connection `Connected / authorised`.

No hardware setting changed.

### Read-only Page 2 preparation result

Observed:

- r9 page audit: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module version: 0.1.16;
- live shape: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- evidence coverage: 1436/1436 inventory, snapshot 1340/1340, core 21/21, feedback 829/31;
- output capability: AVAILABLE=22, UNKNOWN=4;
- Page 2 classification: **`STALE_FOCUSRITE_TESTBENCH_HARNESS`**;
- Page 2 controls: **769**;
- `replacement-candidate=YES`;
- Focusrite hardware writes: **0**;
- Companion Page 2 mutations: **0**;
- hardware restore required: **NO**.

This closes the Page 2 identity question: Page 2 is a recognized older Focusrite TestBench harness, not arbitrary user content.

## Existing Page 2 workflow — reuse, do not reinvent

The repository already contains the established V8 automatic Page 2 preparation path:

`testbench/FullTestBenchCompanionImportV7.js`

It:

- uses Companion's local import path;
- replaces only Page 2;
- keeps Page 1 r9 unchanged;
- remaps to the existing Focusrite Companion connection;
- refuses connection recreation;
- audits that other pages and connection set did not change;
- audits the expected generated capability-lab harness after import;
- presses no Focusrite button and sends no Focusrite hardware write.

Historical launcher integration already exists in:

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd`

where `PAGE2_AUTO` handles the PREP-required V8 harness update, reruns preflight, then resumes once.

Do **not** create another Page 2 backup/import/preparation tool unless new evidence proves the existing importer cannot safely perform the required operation.

## Current prepared source change — pending user pull/local test

After the user's `STALE_FOCUSRITE_TESTBENCH_HARNESS` result, the targeted Mix launcher was changed only to reuse the existing PAGE2_AUTO mechanism.

Prepared behavior:

- `MixFeedbackPreparationCheck.js` returns a distinct recognized-stale-harness status when `safeReplacementCandidate=YES`;
- `RUN_MIX_FEEDBACK_CLOSURE.cmd` offers the existing `PAGE2_AUTO` path for that state;
- it invokes `FullTestBenchCompanionImportV7.js --replace-page-2`;
- then reruns read-only Remote Devices preflight;
- then reruns exact Page 2 preparation check;
- only if Page 2 is exact/current can it reach `MIX_FEEDBACK` / `ALL_ISOLATED` hardware confirmations;
- unknown/user/unverified Page 2 remains blocked from automatic replacement;
- no new parallel Page 2 tool was added;
- no production `src/` behavior was changed.

This prepared PAGE2_AUTO integration is **not yet user-validated locally**. Do not call it PASS until the user updates and runs the targeted launcher.

## Objective continuity

The parent objective remains explicit hardware feedback closure using `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`.

Do not rerun FULL merely to improve counts.

Retained matrix facts:

- 31 public feedback definitions;
- 829 feedback instances;
- static/oracle: 190 PASS / 639 EVAL_ONLY / 0 FAIL;
- dynamic tracker: 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.

Retained hardware evidence:

- meter closure: 14/46 total; inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0;
- completed meter-routing exact-restore: hardware restore YES, Page 2 restore YES;
- Mix A L/R meter closure remains valid;
- Mix B-F exact Playback-strip meter baselines remain unavailable/nonactionable;
- targeted Core feedback: 18/18 SKIP_BASELINE_UNKNOWN, zero writes, zero FAIL, zero restore quarantine; currently nonactionable in this bootstrap state.

The existing Playback-strip `mix_mute` / `mix_solo` feedback path remains the next safe/actionable island after Page 2 is updated through the existing PAGE2_AUTO path.

## Remote Devices / production safety

Use only the existing approved **Companion Scarlett 18i20** connection for normal validation.

Do not create another direct Control Server client merely to inspect state Companion already exposes.

Keep exact audited production package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

No TestBench/debug package installation.

Permanent restrictions:

- supported hardware claim only Scarlett 18i20 (3rd Gen);
- Monitor gain item 1677 read-only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no physical Monitor-level write;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no write to explicit UNKNOWN output availability;
- feedback/state only from server-confirmed state;
- dynamic Control Server TCP port and device ID;
- writes only after Remote Devices authorization matched to this module's own client identity.

## EXACT IMMEDIATE NEXT STEP

After mandatory live freshness verification:

1. Use **`UPDATE.bat`** on the user's Windows checkout; do not default to raw Git/PowerShell commands.
2. Select/keep `testbench/meter-routing-exact-restore` and let the normal updater synchronize it.
3. Then run **`testbench\\RUN_MIX_FEEDBACK_CLOSURE.cmd`** directly.
4. Let the targeted software gate and read-only preflight complete.
5. The stale recognized TestBench Page 2 should cause the launcher to offer **`PAGE2_AUTO`** through the existing V8 importer.
6. The user may type `PAGE2_AUTO`; this changes Companion Page 2 only and sends no Focusrite hardware write.
7. The launcher must re-run read-only preflight + exact Page 2 audit.
8. If Page 2 becomes exact/current, continue to the existing targeted Mix feedback confirmation stage.
9. Resume targeted `mix_mute` / `mix_solo` closure; do not divert into FULL/Core/SAFE/broad meter routing or package installation.

After the next material user result, update this file and root `HANDOFF` again.
