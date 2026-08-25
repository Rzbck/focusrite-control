# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 19:45+02:00  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback closure**  
Canonical production candidate: audited **0.1.16**  
Current research package: **0.1.19**  
Supported hardware scope: **Scarlett 18i20 (3rd Gen) only**

## MANDATORY STARTUP FRESHNESS GATE

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything, verify the live repository state.

1. establish current date/time;
2. inspect repo-wide remote branch movement;
3. identify newest MATERIAL movements by commit time and relevance;
4. resolve the objective-owning branch current remote HEAD;
5. inspect newer commits/diff since the last validated checkpoint;
6. read live `HANDOFF`, `AI_PROJECT_RULES.md`, this file, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence;
7. reconcile any newer completed user/hardware result before choosing the next action;
8. only then continue.

A document timestamp or embedded SHA is a checkpoint only; it is not permission to skip live Git verification.

## Current executable checkpoint

Latest fully validated executable code/test HEAD on the user host:

`63caf496cbf614c1076b5d340905a14034f04177`

That exact checkout passed the full local software gate:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **262/262 PASS / 0 FAIL**;
- Companion package build PASS;
- package `focusrite-scarlett-18i20-0.1.19.tgz` built only, not installed/activated by the gate;
- no hardware test and no hardware write occurred during the gate.

This is the latest fully validated executable checkpoint.

## Latest user-host software gate attempt

The user synced exact HEAD:

`6634a7fd0146bb54921519164b260f1f8cb03f81`

and ran `UPDATE_AND_RUN.bat`.

Observed:

- dependencies PASS;
- Prettier FAILED only on `test/manual-feedback-sweep-reconcile.test.js` and `testbench/ManualFeedbackSweepReconcile.js`;
- ESLint, source manifest, Node tests and package build were not reached;
- no hardware test and no hardware write occurred.

The diagnostic contained exactly two formatting-only differences. Its exact expected blobs were:

- `test/manual-feedback-sweep-reconcile.test.js` → `6fa4d560e14a563665b190a49ea808d1fecfe8e2`;
- `testbench/ManualFeedbackSweepReconcile.js` → `6e54a37552fc09a96ebcc2c8be4c8d3a50bde2a6`.

Formatting-only commits `d3a3c5ea3011e49656e296c25253533f7c3a2767` and `0f34b61e0c7b0964d531ae155f39703bc005206a` now produce those exact expected blobs. No reconciliation semantics, recorder behavior, `src` logic, protocol logic or hardware-write path changed.

Classification: **SOFTWARE FORMAT BLOCKER ONLY** on `6634a7f`. The corrected branch remains **SOFTWARE-GATE-PENDING** until a fresh full user-host gate passes. Pending work is never PASS.

## Mandatory evidence ordering

When information conflicts, prioritize:

1. newest explicit physical-hardware / completed user-host result;
2. current checked-in code/tests;
3. this handoff;
4. broader project/history documents;
5. older captures/assumptions.

Always distinguish:

- `OFFICIAL PRODUCT BEHAVIOUR`;
- `SCHEMA_PRESENT`;
- `SESSION_STATE_OBSERVED`;
- `IMPLEMENTED`;
- `HARDWARE_WRITE_CONFIRMED`;
- `HARDWARE_DYNAMIC_CLOSED`.

`UNKNOWN`, blank, `BASELINE_UNKNOWN`, `SKIP_BASELINE_UNKNOWN`, sparse state, or `never-observed` means only **not observed in this client session** absent stronger evidence. It is never proof that a capability is absent, false, unsupported, or impossible.

## Latest hardware result — full free-running feedback recorder

After the fully green `63caf496` software gate, the user ran the free recorder and moved broadly through Focusrite Control and physical Scarlett controls.

The uploaded sanitized `LATEST_MANUAL_FEEDBACK_SWEEP.json` reports:

- reportVersion: 4;
- model: Scarlett 18i20 (3rd Gen);
- module: 0.1.19;
- `readOnlyHarness: true`;
- `hardwareWritesByHarness: false`;
- `companionButtonPressesByHarness: false`;
- 829 feedback probes / 31 definitions;
- 783 non-meter probes + 46 meter probes;
- duration: about 170 seconds;
- rendered feedback transitions captured: **183**;
- scan cycles: **649**;
- average scan cycle: **262 ms**;
- maximum scan cycle: **1520 ms**;
- raw summary: 79 both-state, 704 single-state, 0 unresolved;
- raw recorder marked 27 paths `FAIL_MISMATCH`.

### Timing-race analysis of the 27 raw FAILs

Every one of the 27 raw `FAIL_MISMATCH` events is followed by the exact inverse transition on the same feedback identity with status PASS only **197-265 ms later**.

This occurs across mixer-slot, Mix mute, output mute/stereo, input mode, Pad, Talkback and Air events. The pattern is therefore timing-contaminated and must **not** be claimed as 27 module defects.

Offline reconciliation of the exact uploaded report with the new deterministic algorithm gives:

- confirmed PASS transitions: **156**;
- `TRANSIENT_RACE` events: **27** on 27 paths;
- confirmed feedback mismatch events: **0**;
- confirmed mismatch paths: **0**.

`TRANSIENT_RACE` is deliberately neither PASS nor FAIL. It means the rendered feedback transition was observed, but the operator reversed it too quickly to prove a stable server-oracle state for that first edge.

A persistent mismatch without a fast inverse PASS is never hidden and remains `FAIL_MISMATCH`.

## Latest meter evidence

The same session improved retained meter closure to:

- `input_meter`: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- `output_meter`: **22/26 HARDWARE_DYNAMIC_CLOSED**;
- `mix_meter`: **6/12 HARDWARE_DYNAMIC_CLOSED**;
- total: **36/46 closed**;
- floor-only: 4;
- movement-only: 6;
- never observed: 0;
- persistent meter mismatch: **0**.

Outputs still open:

- Outputs 21-24 are floor-only (`min=-128`, `max=-128`);
- Outputs 21-24 remain **no-write** while availability is UNKNOWN.

Mix meters still movement-only / missing floor:

- Mix B left/right;
- Mix C left/right;
- Mix E right;
- Mix F right.

Mix D left closed in the latest session.

Do **not** rerun `RUN_METER_FEEDBACK_CLOSURE.cmd` under unchanged conditions. There is currently no justified output-meter routing write target left.

## Session nomenclature / topology patterns — inferred only

The latest session provides useful structural evidence but does not justify new global protocol claims by itself.

Observed patterns:

- output feedback option indices are zero-based while exposed variable names are one-based; for example option `output=2` maps to `output_3_*`;
- adjacent output stereo members behave as pairs, consistent with the existing schema/profile pair inventory;
- mixer slot numbers are one-based;
- `mixer_slot_stereo` transitions repeatedly occur on adjacent odd/even slot pairs such as 15/16 and 17/18;
- real `mixer_slot_source` `source=0` equality transitions repeatedly co-occur with stereo split/rejoin events; source value 0 is therefore `SESSION_STATE_OBSERVED`, but its universal semantic name must not be invented;
- Mix D slot 17/18 mute and solo changes were observed simultaneously across left/right feedback paths under the current runtime topology; this is evidence of topology coupling for that observed state only, not a global ownership rule;
- Line/Inst feedbacks for one input are complementary views of the same input-mode source.

Do not use these patterns to invent writes, infer unsupported global ownership, or write to UNKNOWN availability.

## Timing reconciliation — implemented / software-gate-pending

Current branch adds:

- `testbench/ManualFeedbackSweepReconcile.js`;
- `test/manual-feedback-sweep-reconcile.test.js`;
- reconciliation integration in `testbench/RUN_MANUAL_FEEDBACK_SWEEP.cmd`.

Reconciliation contract:

- zero Focusrite writes;
- zero Companion button presses;
- post-processes only the local sanitized `LATEST_MANUAL_FEEDBACK_SWEEP.json`;
- a FAIL is reclassified as `TRANSIENT_RACE` only when the same feedback identity has the exact inverse PASS within 500 ms;
- a persistent mismatch or a reverse on another target remains `FAIL_MISMATCH`;
- original captured FAIL is preserved as `captureStatus=FAIL_MISMATCH`;
- reportVersion becomes 5 and records `raceResolvedAtMs` / `raceDeltaMs` plus reconciled summary counts;
- repeated reconciliation is idempotent;
- normal `RUN_MANUAL_FEEDBACK_SWEEP.cmd` automatically reconciles after REC;
- `testbench\RUN_MANUAL_FEEDBACK_SWEEP.cmd RECONCILE_ONLY` reprocesses the existing local report without any new hardware capture.

Targeted local verification completed before user-host gate:

- JavaScript syntax PASS;
- **6/6** new reconciliation tests PASS;
- exact uploaded user report processed successfully: 27 transient races / 0 confirmed feedback mismatches / 156 confirmed PASS transitions / 36 of 46 meters closed / 0 meter mismatches.

The reconciliation code/tests/launcher are **IMPLEMENTED / SOFTWARE-GATE-PENDING** until a fresh full user-host `UPDATE_AND_RUN.bat` passes. Pending work is never PASS.

## Free-running recorder contract

The existing main recorder remains:

- `testbench/ManualFeedbackSweep.js`;
- `testbench/RUN_MANUAL_FEEDBACK_SWEEP.cmd`;
- `test/manual-feedback-sweep.test.js`.

Its read-only contract remains:

- **zero Focusrite writes**;
- **zero Companion button presses**;
- no control names to type;
- no `CAPTURE` or `RESTORED` prompts;
- baseline captured first with explicit `NE BOUGE RIEN` instruction;
- one Enter starts the session;
- a large `>>> REC ON <<<` banner marks the actual start;
- one Enter stops the session;
- a large `>>> REC OFF <<<` banner marks the end;
- all **783 public non-meter feedback probes** with mapped independent oracles are scanned continuously through their rendered Companion markers;
- only markers that actually change trigger a server-oracle validation read;
- all **46 meters** continue in the independent continuous meter observer;
- heartbeat prints `REC ON`, captured feedback change count, and scan average/max latency every few seconds;
- report stores sanitized timestamped feedback transitions, oracle source and oracle class, but no raw server value;
- previous `LATEST_MANUAL_FEEDBACK_SWEEP.json` is preferred for meter seeding;
- local sanitized result remains `testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json`.

Monitor gain item `1677` remains read-only and is not a public feedback. Device Preset, Clock Source, Sample Rate and S/PDIF feedbacks may be observed passively if their state changes, but they should not be deliberately changed merely for coverage.

## Future write-capable meter routing — residuals reduced

The current broad `RUN_METER_ROUTING_EXACT_RESTORE.cmd` remains unsuitable as-is because `MeterRoutingClosure.js` can sweep every Mix lane and eligible output pair.

Current residuals:

- all previously useful output targets 14 and 16-20 are CLOSED;
- Outputs 21-24 stay excluded because availability is UNKNOWN;
- only six Mix meter residuals remain: Mix B L/R, Mix C L/R, Mix E right, Mix F right;
- already-closed lanes/pairs must not receive another drive batch merely for coverage score.

Do **not** run the broad current `RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is.

## assign-mix status

Latest completed read-only observation:

- `assign-mix` schema present 26/26 outputs;
- current/non-empty value observed 0/26 in that session;
- all 26 remain `UNKNOWN[never-observed]` for that observation;
- no hardware write;
- no Companion button press;
- no Page 2 replacement;
- no manual routing change.

Classification:

- `assign-mix`: **SCHEMA_PRESENT**;
- read-only instrumentation: **IMPLEMENTED**;
- exact value semantics: **UNKNOWN**;
- official write transaction semantics: **UNKNOWN**;
- public/raw write surface: **ABSENT**.

Do not interpret 0/26 as unsupported/false. Do not rerun `NAVIGATE_MIXES`. Do not write `assign-mix`.

## Retained routing / Mix evidence

Latest guarded Mix-A-via-source test on Line Outputs 3-4:

- exact original baseline Playback 3 + Playback 4;
- one pair-aware write attempted toward Mix A;
- no server-confirmed Mix A transition;
- exact Playback 3/4 state restored;
- classification `WRITE_ATTEMPTED / NO_CONFIRMED_TRANSITION / EXACT_RESTORE_CONFIRMED` for that operation only.

Do not generalize it globally and do not repeat Mix-A-via-source blindly.

Retained strong non-meter Mix evidence:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false with exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same;
- Mix A Right direct Mute/Solo under tested stereo topology: no transition, exact restore;
- latest free session adds broad observed Mix D activity, but timing/topology coupling must be reconciled conservatively rather than generalized.

## Remote Devices authorization — mandatory before any write

Read `docs/REMOTE_DEVICES_AUTHORIZATION.md` before any write-capable hardware campaign.

Before any write-capable hardware campaign:

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved;
- reuse the existing Companion Focusrite connection;
- do not delete/recreate it for testing;
- authorization must match this module's own server-assigned client ID;
- missing approval = `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware failure;
- No extra direct clients by default;
- Never reuse/copy the Companion private client key into another process.

Direct Control Server research clients must never run concurrently with a normal Companion write-capable campaign.

## PROJECT LAUNCHERS FIRST

Use launchers first:

- `UPDATE.bat` — normal sync;
- `UPDATE_AND_RUN.bat` — sync + full software gate;
- `RUN.bat` — software gate when already current;
- exact `testbench\RUN_*.cmd` — targeted TestBench/hardware work.

Manual Git/PowerShell/Node is last resort only when a normal launcher is itself broken or cannot expose the required diagnostic.

## Objective continuity / no premature closure

Closing a sub-question never closes its parent validation objective. A tooling fix, one research hypothesis, one meter family, or one software gate does not close the parent hardware-validation objective while material rows remain open.

Tooling/release/documentation work may interrupt the hardware objective only when it is a direct blocker for the next safe validation step. Once that blocker is removed, return to the parent hardware objective. Before any objective change, re-open the parent matrix and account for remaining open rows.

## Permanent safety contract

- supported hardware: **Scarlett 18i20 (3rd Gen) only**;
- Monitor gain item `1677`: **read-only**;
- never re-add Monitor set/adjust actions, presets, or raw-write access without new hardware proof;
- never invent analogue input preamp gain;
- never invent direct per-input hardware mute;
- never invent per-channel phantom power;
- never invent Mic Kill;
- never invent physical Monitor level control;
- Control Server TCP port and device ID are dynamic; never hardcode them;
- writes require Remote Devices authorization matched to this module's own server-assigned client ID;
- feedback/state must be server-confirmed; no optimistic success;
- no unknown/unsafe raw item writes;
- no firmware/reset/restore/snapshot commands;
- no meter/status writes;
- no write to explicit UNKNOWN output availability;
- no Focusrite software/firmware update or unrelated routing/hardware changes without explicit agreement;
- reversible tests require exact baseline/restore for the property being changed;
- restoration failure = quarantine / hard abort;
- preserve privacy: no serial, private hostname, client key, raw private XML/captures, private IDs, diagnostics, or user-specific paths in public source;
- preserve relevant MIT / third-party attribution; do not claim all protocol knowledge was independently discovered.

## GitHub Actions policy

Do not add, enable, depend on, wait for, or troubleshoot GitHub Actions in this personal development repository. Validation here is local through checked-in Node/Yarn and Windows launchers.

## Publication state

The Bitfocus Companion Slack `#module-development` repository/naming request is already posted. Bryce Seifert suggested `focusrite-control` may be the better repository/module scope and offered hardware for future testing. Validated scope remains Scarlett 18i20 (3rd Gen) only. Wait for the official repository/naming decision before changing public scope. Stable public target remains **v1.0.0** unless maintainers direct otherwise.

## Exact immediate next action

1. Do **not** rerun `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd` under unchanged conditions.
2. Do **not** run the broad current `testbench\RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is.
3. Do **not** ask the user to repeat the full free hardware sweep now.
4. Retain latest meter evidence: inputs 8/8, outputs 22/26, mixes 6/12, total 36/46, mismatch 0.
5. Run **one fresh `UPDATE_AND_RUN.bat`** on `testbench/meter-routing-exact-restore` after the formatting-only reconciliation fixes and require dependencies, Prettier, ESLint, source manifest, all Node tests and package build PASS.
6. If that gate fails, diagnose the complete software failure before asking for hardware work.
7. If the gate is fully green, run `testbench\RUN_MANUAL_FEEDBACK_SWEEP.cmd RECONCILE_ONLY`. This performs **no new hardware capture** and only reconciles the existing local `LATEST_MANUAL_FEEDBACK_SWEEP.json`.
8. Expected from the exact uploaded report is 27 `TRANSIENT_RACE` events, 0 confirmed feedback mismatches, 156 confirmed PASS transitions, 36/46 meters closed, 0 meter mismatches. User-host output/report must confirm this before promotion.
9. Only after the reconciled report is reviewed should any tiny targeted hardware follow-up be chosen. Never ask for another broad click-everything sweep without a materially new reason.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`;
- `docs/CURRENT_HANDOFF.md`.

Pending work is never PASS.
