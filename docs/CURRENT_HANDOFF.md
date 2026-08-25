# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 18:07+02:00  
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

This supersedes `8cc803b714e14cd50c88e2d702470c1d9f313d06` as the latest fully validated executable checkpoint. The checked-in ManualFeedbackSweep and its continuous meter observer are **SOFTWARE-GREEN** at this exact code/test HEAD.

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

The user completed the manual sweep while freely moving Scarlett and Focusrite Control controls and using VB-Audio Matrix. The uploaded sanitized `LATEST_MANUAL_FEEDBACK_SWEEP.json` reports:

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

The `steps: []` result is important: the operator deliberately moved controls freely instead of using the old label/CAPTURE/RESTORED prompts. Therefore this report does **not** attribute or validate non-meter Air/Pad/Mute/etc. transitions from that session. This is a harness workflow mismatch, not evidence that those feedbacks failed. Do not ask the user to repeat the whole session merely to satisfy the old prompt design.

### Retained meter closure after this run

- `input_meter`: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- `output_meter`: **22/26 HARDWARE_DYNAMIC_CLOSED**;
- `mix_meter`: **5/12 HARDWARE_DYNAMIC_CLOSED**;
- persistent meter feedback/oracle mismatch: **0**.

Outputs now closed:

- Outputs 1-20;
- Outputs 25-26.

Outputs still open:

- Outputs 21-24 are floor-only (`min=-128`, `max=-128`) and remain **no-write** while availability is UNKNOWN.

This means the former useful write-capable output meter targets — Output 14 and Outputs 16-20 — are now closed by real passive hardware evidence. There is currently **no justified output-meter routing write target left**.

Mix meters now closed:

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

Do **not** rerun `RUN_METER_FEEDBACK_CLOSURE.cmd` under unchanged conditions. Do **not** ask the user to repeat the just-completed free manual sweep. Any future meter work must be justified only by these seven residual Mix paths.

## Manual feedback sweep — design limitation discovered

Implemented files remain:

- `testbench/ManualFeedbackSweep.js`;
- `testbench/RUN_MANUAL_FEEDBACK_SWEEP.cmd`;
- `test/manual-feedback-sweep.test.js`.

The current checked-in implementation is software-green but non-meter attribution still expects explicit label → CAPTURE → RESTORED interaction. That does not match the user's intended free-running workflow.

Classification of the completed run:

- meters: **HARDWARE OBSERVATION USEFUL**, 35/46 closed, 0 mismatch;
- non-meter controls: **NOT CAPTURED BY THIS REPORT** because `steps` is empty;
- do not infer unsupported, broken or false from `steps: []`.

If a future free-running control observer is implemented, it should automatically sample changed non-meter rendered feedback markers and their server-variable oracle with timestamps, without requiring a per-control prompt. Before asking for any new manual work, first decide whether existing retained hardware evidence is already sufficient.

## Future write-capable meter routing — residuals materially reduced

The current broad `RUN_METER_ROUTING_EXACT_RESTORE.cmd` remains unsuitable as-is because `MeterRoutingClosure.js` can sweep every Mix lane and eligible output pair.

After the free manual sweep:

- Output 14 and Outputs 16-20 are CLOSED;
- Outputs 21-24 stay excluded because availability is UNKNOWN;
- only seven Mix meter residuals remain: Mix B L/R, Mix C L/R, Mix D left, Mix E right, Mix F right;
- already-closed lanes/pairs must not receive another drive batch merely for coverage score.

Do **not** run the broad current `RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is. Reevaluate whether a write-capable meter campaign is worth doing at all before implementing residual targeting.

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

Tooling/release/documentation work may interrupt the hardware objective only when it is a direct blocker for the next safe validation step. Once that blocker is removed, return to the parent hardware objective.

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

1. Do **not** ask the user to repeat the completed free manual sweep.
2. Do **not** rerun `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd` under unchanged conditions.
3. Do **not** run the broad current `testbench\RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is.
4. Retain meter evidence from the uploaded free sweep: inputs 8/8, outputs 22/26, mixes 5/12, mismatch 0.
5. Output-meter write-capable targeting is no longer justified: 14 and 16-20 are closed; 21-24 stay no-write UNKNOWN availability.
6. Seven Mix meter residuals remain for missing floor: B L/R, C L/R, D left, E right, F right.
7. The free non-meter control movements were not captured because `steps: []`; do not claim PASS/FAIL from this run for Air/Pad/Mute/etc.
8. If further non-meter evidence is genuinely necessary, first redesign observation to be automatic/free-running and assess existing retained evidence before asking for another manual session.
9. Keep Device Preset, Clock Source, Sample Rate, S/PDIF, firmware/reset/restore/snapshot and Monitor gain 1677 excluded.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`;
- `docs/CURRENT_HANDOFF.md`.

Pending work is never PASS.
