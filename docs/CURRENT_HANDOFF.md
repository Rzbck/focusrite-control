# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 16:57+02:00  
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

`8cc803b714e14cd50c88e2d702470c1d9f313d06`

That exact checkout passed the full local software gate:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **250/250 PASS / 0 FAIL**;
- Companion package build PASS;
- package `focusrite-scarlett-18i20-0.1.19.tgz` built only;
- no hardware write.

Newer manual-feedback-sweep files have been added after this checkpoint and are **SOFTWARE-GATE-PENDING** until the user runs `UPDATE_AND_RUN.bat` on the current branch. Production `src/`, protocol logic and Focusrite write definitions were not changed by the manual-sweep work.

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

## Latest hardware result — read-only meter closure v2 + exhausted retry

Retained aggregate meter closure remains:

- `input_meter`: **8/8 HARDWARE_DYNAMIC_CLOSED** from stronger earlier hardware evidence;
- `output_meter`: **16/26 HARDWARE_DYNAMIC_CLOSED / 10 open**;
- `mix_meter`: **4/12 HARDWARE_DYNAMIC_CLOSED / 8 open**;
- persistent mismatch: **0**.

The latest v2 session itself reported 21/46 closed, 17 floor-only, 8 movement-only, 0 never-observed, 0 mismatch. A second explicit `SILENT` retry under unchanged routing/source conditions produced exactly the same result and therefore added no evidence.

Exact output residuals needing movement:

- Output 14;
- Outputs 16-20;
- Outputs 21-24.

Outputs 21-24 remain **no-write** while availability is UNKNOWN.

Exact Mix residuals needing floor:

- Mix B L/R;
- Mix C L/R;
- Mix D L/R;
- Mix E right;
- Mix F right.

Do **not** rerun `RUN_METER_FEEDBACK_CLOSURE.cmd` again under unchanged conditions. The old dedicated read-only meter loop is exhausted for that state.

Sanitized prior meter accumulator remains local only:

`testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json`

Do not auto-publish it.

## Manual feedback sweep — implemented / software-gate-pending

The user rejected opaque repeated campaigns and proposed one practical manual session: move real Scarlett controls and Focusrite Control controls while Companion feedback is observed.

Implemented files:

- `testbench/ManualFeedbackSweep.js`;
- `testbench/RUN_MANUAL_FEEDBACK_SWEEP.cmd`;
- `test/manual-feedback-sweep.test.js`.

Initial commits:

- `3dc8ff1` — sweep;
- `c421c1b` — launcher;
- `b803669` — read-only safety regression.

VB-Audio Matrix / continuous-meter refinements:

- `b71bb073` — continuous 46-meter observer + prior meter evidence merge;
- `f1e10eee` — regression coverage for meter separation/observation;
- `37d421b1` — launcher text for continuous meter contract.

Current design:

- exact existing r9 inventory: **829 feedback probes / 31 definitions**;
- harness makes **zero Focusrite writes**;
- harness makes **zero Companion button presses**;
- operator changes exactly one normal control manually at a time on the physical Scarlett or in Focusrite Control;
- meter feedbacks are excluded from per-control attribution so audio activity cannot make an AIR/Pad/Mute test unreadable;
- the **46 meter paths are sampled continuously in parallel** against their server-confirmed numeric oracle;
- compatible evidence from `testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json` is loaded first, so the sweep extends prior meter evidence instead of starting from zero;
- this means VB-Audio Matrix can intentionally send audio broadly during the session to provide movement evidence;
- if VB-Audio Matrix can also provide a few seconds of complete silence without altering Focusrite routing, movement-only Mix meters may acquire their missing `-128 dBFS` floor evidence;
- prior floor-only output meters may close if the VB-Audio signal actually reaches them and produces numeric movement;
- only non-meter feedbacks whose rendered marker actually changed are checked against the existing server-variable oracle;
- operator manually restores the control and the changed feedback markers must return to baseline before another control is tested;
- restore not confirmed => stop;
- local sanitized result: `testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json`;
- report stores no serial, hostname, client key, Control Server endpoint, device ID, raw XML, Companion connection ID or user path.

This new sweep is **IMPLEMENTED / SOFTWARE-GATE-PENDING**, not PASS. The latest fully green executable checkpoint remains `8cc803b` until a current-head `UPDATE_AND_RUN.bat` passes.

## Controls suitable for the manual sweep

Prefer simple reversible controls first:

- Monitor Mute;
- Monitor Dim;
- Talkback;
- Alt / Alt Enable where runtime state is known;
- Air;
- Pad;
- Input Mode.

Routing/source/stereo may be exercised manually only when the exact original state is known and can be restored exactly.

Do not use the manual sweep to exercise:

- Device Preset;
- Clock Source;
- Sample Rate;
- S/PDIF mode;
- firmware/reset/restore/snapshot;
- physical Monitor gain item `1677`.

## Future write-capable meter routing — residual targeting still pending

The current `RUN_METER_ROUTING_EXACT_RESTORE.cmd` remains too broad because `MeterRoutingClosure.js` can sweep every Mix lane and every eligible output pair.

Before any future write-capable meter campaign, make it residual-driven:

- Mix targets only: Mix B L/R, Mix C L/R, Mix D L/R, Mix E right, Mix F right;
- output targets only where an unresolved meter belongs to an AVAILABLE exact-restorable pair; currently useful candidates are Output 14 and Outputs 16-20;
- Outputs 21-24 stay excluded while availability is UNKNOWN;
- already-closed lanes/pairs must not receive another drive batch merely for coverage score;
- if the manual read-only sweep closes enough meter gaps, reevaluate whether any write-capable meter campaign is still worth doing.

This residual-targeting implementation is **PENDING**. Pending is not PASS. Do **not** run the broad current `RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is.

## Write-capable safety contract

Any future write-capable meter campaign may temporarily use only already-audited Companion actions:

- mixer strip gain;
- mixer strip mute;
- mixer strip solo;
- validated `output_pair_source` routing.

It does not intentionally use:

- direct Focusrite Control Server `<set>`;
- Mixer Slot Source writes;
- Mixer Slot Stereo writes;
- direct pair-owned right-member output Source writes;
- output writes for `UNKNOWN` or `UNAVAILABLE` availability;
- Monitor gain item `1677`;
- Advanced Raw;
- device preset, clock source, sample rate or S/PDIF mode;
- firmware/reset/restore/snapshot commands;
- meter/status writes.

Every changed property requires exact server-confirmed baseline and exact server-confirmed restoration. Failed hardware restore or failed Page 2 restore remains a hard abort/quarantine.

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

Retained strong Mix evidence:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false with exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same;
- Mix A Right direct Mute/Solo under tested stereo topology: no transition, exact restore;
- Mix B-F remain open where exact baselines were not observed.

## Remote Devices authorization — mandatory before any write

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

1. Do **not** rerun `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd` under unchanged conditions.
2. Do **not** run the broad current `testbench\RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is.
3. Run `UPDATE_AND_RUN.bat` on `testbench/meter-routing-exact-restore` and require dependencies, Prettier, ESLint, source manifest, all Node tests and package build PASS.
4. Do not reinstall the rebuilt tgz or recreate the existing authorised Companion 0.1.19 connection merely because the gate built a package.
5. After a green gate, run `testbench\RUN_MANUAL_FEEDBACK_SWEEP.cmd`.
6. VB-Audio Matrix may send sound broadly during the session. Also allow a few seconds of full silence at some point, without changing Focusrite routing, so continuous meter observation can collect both movement and floor evidence where possible.
7. For normal controls, change exactly ONE safe control manually at a time, keep it changed, type `CAPTURE`, restore it, then type `RESTORED` only after Companion feedback has returned.
8. Start with simple reversible controls; test routing/source/stereo only when exact original state is known and manually restorable.
9. Keep Device Preset, Clock Source, Sample Rate, S/PDIF, firmware/reset/restore/snapshot and Monitor gain 1677 excluded.
10. Review `testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json` and the console meter summary before deciding whether any residual write-capable meter campaign is still worthwhile.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`;
- `docs/CURRENT_HANDOFF.md`.

Pending work is never PASS.
