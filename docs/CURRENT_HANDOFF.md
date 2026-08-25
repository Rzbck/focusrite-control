# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 18:46+02:00  
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

`41e6afdf3e816074e807b1ca4a1c2ec0a717e4a4`

That exact checkout passed the full local software gate:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **256/256 PASS / 0 FAIL**;
- Companion package build PASS;
- package `focusrite-scarlett-18i20-0.1.19.tgz` built only, not installed/activated by the gate;
- no hardware test and no hardware write occurred.

This remains the latest fully validated executable checkpoint.

## Latest user-host gate attempt

The user synced exact HEAD:

`962547569b83763c2eeca07afa09e3e678c89173`

and ran `UPDATE_AND_RUN.bat`.

Observed:

- dependencies PASS;
- Prettier FAILED on `testbench/ManualFeedbackSweep.js` only;
- the generated diagnostic showed exactly four formatting-only differences;
- ESLint, manifest, Node tests and package build were not reached;
- no hardware test and no hardware write occurred.

This is a **software format blocker only** on that exact HEAD. The diagnostic's exact expected Prettier 3.9.6 blob was `8dd8214cb38214febbe7998122aca01a8a2918ed`. Commit `5581f8749addcc7fcad6c90054753f36de68bcfb` applied only those formatting changes and produced exactly that blob SHA. Recorder behavior remains the full 783-non-meter + 46-meter read-only design. The corrected branch state is **SOFTWARE-GATE-PENDING** until a fresh full user-host gate passes. Pending is not PASS.

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

## Latest hardware result — free manual sweep / meter evidence

The user completed the first manual sweep while freely moving Scarlett and Focusrite Control controls and using VB-Audio Matrix. The uploaded sanitized `LATEST_MANUAL_FEEDBACK_SWEEP.json` reports:

- model: Scarlett 18i20 (3rd Gen);
- module: 0.1.19;
- `readOnlyHarness: true`;
- `hardwareWritesByHarness: false`;
- `companionButtonPressesByHarness: false`;
- 829 feedback probes / 31 definitions;
- 783 non-meter probes + 46 meter probes;
- prior meter evidence loaded for all 46 paths;
- `steps: []`;
- meter total 46, closed 35, floor-only 4, movement-only 7, never 0, mismatch 0.

The `steps: []` result means the old prompt-driven logger did **not** attribute non-meter Air/Pad/Mute/etc. transitions from that free session. That is a harness workflow mismatch, not evidence that those feedbacks failed. Do not ask the user to repeat that exact failed workflow.

### Retained meter closure after this run

- `input_meter`: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- `output_meter`: **22/26 HARDWARE_DYNAMIC_CLOSED**;
- `mix_meter`: **5/12 HARDWARE_DYNAMIC_CLOSED**;
- persistent meter feedback/oracle mismatch: **0**.

Outputs closed:

- Outputs 1-20;
- Outputs 25-26.

Outputs still open:

- Outputs 21-24 are floor-only (`min=-128`, `max=-128`) and remain **no-write** while availability is UNKNOWN.

The former useful write-capable output meter targets — Output 14 and Outputs 16-20 — are closed by passive hardware evidence. There is currently **no justified output-meter routing write target left**.

Mix meters closed:

- Mix A left/right;
- Mix D right;
- Mix E left;
- Mix F left.

Mix meters still movement-only / missing floor:

- Mix B left/right;
- Mix C left/right;
- Mix D left;
- Mix E right;
- Mix F right.

Do **not** rerun `RUN_METER_FEEDBACK_CLOSURE.cmd` under unchanged conditions. Any future meter work must be justified only by these seven residual Mix paths.

## Full free-running public feedback recorder — implemented / gate pending

The temporary 20-target catch-up design is superseded. The user intends to move broadly through Focusrite Control and physical Scarlett controls, so the recorder now observes the entire public feedback surface during one explicit recording window.

Same files/launcher are reused:

- `testbench/ManualFeedbackSweep.js`;
- `testbench/RUN_MANUAL_FEEDBACK_SWEEP.cmd`;
- `test/manual-feedback-sweep.test.js`.

Current recorder contract:

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
- previous `LATEST_MANUAL_FEEDBACK_SWEEP.json` is preferred for meter seeding, preserving the existing **35/46** meter evidence;
- local sanitized result remains `testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json`.

This design intentionally avoids blindly polling hundreds of Focusrite server variables at high frequency. Instead it scans the existing Companion-rendered feedback markers and only performs server-variable reads for changed feedbacks. `averageScanCycleMs` and `maxScanCycleMs` are stored so the completed report can prove whether the scan cadence was fast enough for the user's gestures.

Operator timing for the next REC: leave each changed state about **two seconds** before moving again. If the measured scan latency is unexpectedly high, the report will show it and no unsupported coverage claim should be made.

Scope note: the recorder covers the complete **public feedback** surface: 783 non-meter probes + 46 meter probes. Monitor gain item `1677` remains read-only and is **not a public feedback**, so turning the physical Monitor knob does not validate a Companion feedback. Device Preset, Clock Source, Sample Rate and S/PDIF feedbacks can be observed passively if their state changes, but they should not be deliberately changed merely for coverage because they are disruptive.

The full recorder is **IMPLEMENTED / SOFTWARE-GATE-PENDING**. Do not ask for another hardware REC until a fresh full software gate passes on the exact new HEAD.

## Future write-capable meter routing — residuals materially reduced

The current broad `RUN_METER_ROUTING_EXACT_RESTORE.cmd` remains unsuitable as-is because `MeterRoutingClosure.js` can sweep every Mix lane and eligible output pair.

After the free manual sweep:

- Output 14 and Outputs 16-20 are CLOSED;
- Outputs 21-24 stay excluded because availability is UNKNOWN;
- only seven Mix meter residuals remain: Mix B L/R, Mix C L/R, Mix D left, Mix E right, Mix F right;
- already-closed lanes/pairs must not receive another drive batch merely for coverage score.

Do **not** run the broad current `RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is. Reevaluate whether a write-capable meter campaign is worth doing at all after the full passive REC.

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
- Mix B-F remain open where exact non-meter baselines were not observed.

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
3. Retain meter evidence from the uploaded free sweep: inputs 8/8, outputs 22/26, mixes 5/12, mismatch 0.
4. The latest user-host gate on `962547569b83` failed only at Prettier; exact formatting correction commit `5581f8749add` produced the diagnostic's expected blob `8dd8214cb382`. Run **one fresh `UPDATE_AND_RUN.bat`** on `testbench/meter-routing-exact-restore` and require dependencies, Prettier, ESLint, source manifest, all Node tests and package build PASS.
5. If that gate fails, diagnose the complete software failure before asking for hardware work. Do not run the recorder on a partial gate.
6. If the gate is fully green, run `testbench\RUN_MANUAL_FEEDBACK_SWEEP.cmd`. Wait for the explicit `>>> REC ON <<<` banner before touching anything.
7. During `REC ON`, the logger scans all 783 public non-meter feedbacks while all 46 meters continue in parallel. The user may move broadly through normal Focusrite Control / Scarlett controls and should leave each changed state about two seconds before changing again.
8. After `REC OFF`, review `averageScanCycleMs`, `maxScanCycleMs`, captured feedback transitions, mismatch count, and the meter summary before making any coverage claim.
9. Do not deliberately change Device Preset, Clock Source, Sample Rate or S/PDIF merely for coverage. Monitor gain 1677 is not a public feedback and remains read-only.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`;
- `docs/CURRENT_HANDOFF.md`.

Pending work is never PASS.