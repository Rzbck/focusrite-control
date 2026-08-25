# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 15:27+02:00  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback closure**  
Canonical production candidate: audited **0.1.16**  
Current research package: **0.1.19**  
Supported hardware scope: **Scarlett 18i20 (3rd Gen) only**

## MANDATORY STARTUP FRESHNESS GATE

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything, verify the live repository state.

1. establish current date/time;
2. inspect repo-wide remote branch movement;
3. identify the newest MATERIAL movements by commit time and relevance;
4. resolve the objective-owning branch current remote HEAD;
5. inspect newer commits/diff since the last validated checkpoint;
6. read live `HANDOFF`, `AI_PROJECT_RULES.md`, this file, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence;
7. reconcile any newer completed user/hardware result before choosing the next action;
8. only then continue.

A document timestamp or embedded SHA is a checkpoint only; it is not permission to skip live Git verification.

## Current live branch state

Exact code/test HEAD validated on the user host:

`4915b9e64d712fcf03f2d7d2e52fcda8f886de88`

Latest relevant sequence:

- `7b0687f1477a814113f597b7d9dabf49a9a94be4` — align meter launcher text with package-backed module version;
- `b6badeac245f87761553b41d28dc5f9f950827c5` — align meter operator guide;
- `3b7bfbe9d99d19f0b8f5871914bc2f14673bc57d` — regression preventing stale 0.1.16 meter launcher pin;
- `9ca0ac02349ae7810086647acaddce293305773e` — exact Prettier reflow for that regression;
- `5d259dc841632096061d7e8062edb6ab6c248ccf` — normalize updater line endings before structural assertions; `UPDATE.bat` itself unchanged;
- `110aa15a3d94c3f6967f176494813c28c62f2dce` and `4915b9e64d712fcf03f2d7d2e52fcda8f886de88` — restore canonical living-handoff execution contracts.

No `src/` module behavior, protocol logic, Focusrite write action, or `MeterFeedbackClosure.js` hardware behavior changed in those commits.

Subsequent commits that only record the green gate in the two handoffs are documentation-only and must not force replacement of the already validated local executable checkout before the targeted read-only meter run.

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

## Latest user-host software gate — FULL GREEN

The user ran `UPDATE_AND_RUN.bat` on exact local HEAD:

`4915b9e64d712fcf03f2d7d2e52fcda8f886de88`

Observed:

- portable Node **22.23.2** prepared successfully;
- Yarn **4.17.0** via Corepack;
- dependencies: **PASS**;
- Prettier: **PASS**;
- ESLint: **PASS**;
- source manifest: **PASS**;
- Node tests: **250/250 PASS / 0 FAIL**;
- Companion package build: **PASS**;
- package: `focusrite-scarlett-18i20-0.1.19.tgz`;
- the gate built the package but did not install or activate it in Companion;
- hardware writes from the gate: **none**.

This is the current fully green 0.1.19 software checkpoint for the executable code/test state. It closes the software blocker for the dedicated read-only meter campaign.

The immediately preceding run on `f3544d9d3fdc5d5cebb9464bff710df3efea6a92` had **243/250 PASS / 7 FAIL**. Those seven tooling/documentation-contract failures are now closed: six canonical handoff phrases were restored, and the updater structure test now normalizes Windows CRLF before LF-based structural checks. `UPDATE.bat` itself was not changed for that test fix.

## Updater blocker — closed by real Windows execution

The direct `UPDATE.bat` branch-switch bug is closed by user-host execution.

The fixed launcher:

- stayed on `testbench/meter-routing-exact-restore`;
- fetched the explicit remote branch;
- fast-forwarded cleanly;
- reported local and remote HEAD correctly;
- terminated normally without the former second-bootstrap error.

The old failure came from cmd.exe resuming a tracked `UPDATE.bat` after that file had been replaced by a branch switch. The batch fix keeps the bootstrap continuation in an already-parsed block and hardens SHA reporting.

The accidental `debug/official-client-passive-session` detour is closed as a workflow mistake. That branch is old/divergent and must **not** be merged or used as the current hardware-validation base.

## Recovered local TestBench artifacts

The local rescue comparison established:

- current tracked TestBench source tree: 72 files;
- rescue tree: 135 files;
- rescue content: **127 result files + 8 generated files**;
- no tracked source file required recovery.

The 127 result files and 8 generated artifacts were restored under ignored `testbench/results` and `testbench/generated`; final `git status --short` remained empty.

## Parent objective status

The parent objective remains **explicit hardware feedback closure across 31 public feedback definitions / 829 instances**.

A software PASS, inventory PASS, completed research sub-question, or fixed launcher does not close the parent objective while material rows remain `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised, or otherwise not dynamically closed.

Current major open families still include:

- `monitor_mute`: EVAL_ONLY / readback unresolved;
- `monitor_dim`: EVAL_ONLY / readback unresolved;
- `monitor_alt`: EVAL_ONLY_SAFE_ACTIONABLE only from exact baseline + physical isolation;
- `monitor_alt_enable`: same;
- `input_air`: EVAL_ONLY / readback unresolved;
- `input_pad`: EVAL_ONLY / readback unresolved;
- `output_mute`: PARTIAL;
- `output_stereo`: PARTIAL;
- `output_source`: PARTIAL;
- `output_meter`: PARTIAL;
- `mixer_slot_stereo`: RESEARCH_OPEN / EVAL_ONLY;
- `mixer_slot_source`: RESEARCH_OPEN / EVAL_ONLY;
- `mix_mute`: PARTIAL;
- `mix_solo`: PARTIAL;
- `mix_talkback`: PARTIAL / blocked for current write campaign;
- `mix_meter`: PARTIAL;
- output `assign-mix`: schema present, read-only characterization complete, semantics unknown, no write path.

See `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md` for the full 31-definition classification.

## Next safe hardware path — read-only meter closure

The parent matrix was reopened after the updater blocker closed. The safest useful remaining hardware gap is read-only meter closure:

- `input_meter`: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- `output_meter`: **4/26 HARDWARE_DYNAMIC_CLOSED / 22 open**;
- `mix_meter`: **2/12 HARDWARE_DYNAMIC_CLOSED / 10 open**.

The existing `testbench/MeterFeedbackClosure.js` is strictly read-only:

- no Focusrite Control Server `<set>`;
- no Companion button press;
- no routing change;
- no hardware-write path;
- rendered feedback marker compared against independent server-confirmed numeric meter state;
- closure requires numeric floor `-128 dBFS` plus real movement strictly above floor;
- missing paths remain `MANUAL_PENDING`; they are not promoted into fake PASS.

The executable preflight derives `EXPECTED_MODULE_VERSION` from root `package.json`, currently 0.1.19. It verifies the existing r9 46-path meter matrix, exact module version, exact Scarlett 18i20 (3rd Gen), existing module connection, existing own-client authorization, exactly 46 meter probes, and a numeric threshold oracle for every meter path.

The package build is a software gate. If the exact matching research package is already loaded on the existing Companion connection, do not recreate the connection merely because the archive was rebuilt. If the loaded version does not match, the read-only preflight must fail closed and that mismatch must be diagnosed before observation.

The next hardware observation from the already validated local checkout should be only:

`testbench\RUN_METER_FEEDBACK_CLOSURE.cmd`

Do **not** run a write-capable Mix/routing campaign first.

Operator flow:

- `SILENT` records floor evidence on paths that can safely be quieted without changing Focusrite routing;
- `SIGNAL` records real movement strictly above `-128 dBFS` on currently exercisable paths;
- multiple `SIGNAL` passes are allowed and evidence accumulates only for the matching report version/signature;
- `DONE` ends the campaign when no further safe progress is possible;
- explicit `MANUAL_PENDING` residuals are acceptable and must never be promoted into fake PASS.

The sanitized local accumulator remains:

`testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json`

Do not publish it automatically; review it first.

## Latest completed 0.1.19 assign-mix read-only observation

The existing `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd` probe completed on the Scarlett 18i20 (3rd Gen) after the earlier green 0.1.19 package gate.

Observed:

- output `assign-mix` schema present: **26/26 outputs**;
- output `assign-mix` non-empty/current value observed: **0/26**;
- all 26: `UNKNOWN[never-observed]`;
- this included the currently Custom-Mix-routed Monitor 1-2 path;
- no Focusrite write;
- no Companion button press;
- no Page 2 replacement;
- no manual routing, Mute/Solo, mono/stereo, or fader change requested.

Correct classification:

- `assign-mix`: **SCHEMA_PRESENT**;
- read-only instrumentation/probe: **IMPLEMENTED**;
- hardware observation: **COMPLETED**;
- session value: **NOT OBSERVED on all 26 outputs in this run**;
- exact value semantics: **UNKNOWN**;
- official write transaction semantics: **UNKNOWN**;
- public action/preset/feedback write surface: **ABSENT**;
- writable IDs / Advanced Raw write surface: **ABSENT**.

Do not convert `0/26 observed` into unsupported/false/empty-by-definition.

The old `NAVIGATE_MIXES` 30-second countdown must not be repeated. Its temporal loop sampled only Mix gain/mute/solo, while output routing/assign-mix was read only before the countdown. Repeating it would not answer the routing-state question.

## Latest guarded output routing evidence

The latest write-capable Mix materialization campaign exercised one guarded `output_pair_source` attempt on non-Monitor Line Outputs 3-4.

Exact evidence:

- original source baseline: `Playback 3 + Playback 4`;
- one real pair-aware source write attempted toward Mix A;
- server did **not** confirm Mix A L/R on outputs 3-4;
- exact original Playback 3/4 source state was server-confirmed restored;
- Page 2 restored;
- no speculative Mix Mute/Solo continuation.

Classification for that operation only:

`WRITE_ATTEMPTED / NO_CONFIRMED_TRANSITION / EXACT_RESTORE_CONFIRMED`

Do not generalize this to “`output_pair_source` is broken” and do not repeat the same Mix-A-via-`source` attempt blindly on more output pairs.

## assign-mix write status

A direct `assign-mix` write remains **blocked by restoration evidence**, not declared unsupported.

For a proposed target, the changed property has never been server-observed, so there is no exact baseline with which to prove exact restoration.

Therefore:

- no direct `assign-mix` write;
- no Advanced Raw shortcut;
- no action/preset addition;
- no speculative write based only on schema presence.

Any future write test requires:

1. positive evidence for value/transaction semantics;
2. exact server-confirmed baseline for the property being changed;
3. exact server-confirmed restoration of that same property.

The diagnostic opaque `V1`, `V2`, ... assign-mix classes are recreated per `buildVariableValues(instance)` refresh. They are valid for same-refresh equality only and must never be used as temporal restoration identities.

## Retained strong Mix evidence

From the earlier dedicated hardware run under the tested stereo topology:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false, server-confirmed state + rendered feedback + exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same;
- Mix A Right direct Mute: no transition under that tested stereo topology, exact restore;
- Mix A Right direct Solo: same;
- Mix B-F remain readback/baseline-open where exact state was not observed;
- restore quarantine: 0.

Do not infer a global left/right ownership rule from that topology-specific result.

## PROJECT LAUNCHERS FIRST

Use launchers first:

- `UPDATE.bat` — normal sync;
- `UPDATE_AND_RUN.bat` — sync + full software gate;
- `RUN.bat` — software gate when already current;
- exact `testbench\RUN_*.cmd` — targeted TestBench/hardware work.

Manual Git/PowerShell/Node is last resort only when a normal launcher is itself broken or cannot expose the required diagnostic.

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

## Objective-continuity / no premature closure

Closing a sub-question never closes its parent validation objective. A tooling fix, one research hypothesis, one meter family, or one software gate does not close the parent hardware-validation objective while material rows remain open.

Tooling/release/documentation work may interrupt the hardware objective only when it is a direct blocker for the next safe validation step. Once that direct blocker is removed, return to the parent hardware objective. Before any objective change, account for the remaining open matrix rows; if that cannot be done from current evidence, the objective change is forbidden.

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

Do not add, enable, depend on, wait for, or troubleshoot GitHub Actions in this personal development repository. Validation here is local through the checked-in Node/Yarn and Windows launcher workflow.

If Bitfocus later creates the official repository and maintainers require their own CI/reusable workflow, follow those rules there.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`.

Bryce Seifert suggested `focusrite-control` may be the better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing. The project response explicitly kept validated scope at Scarlett 18i20 (3rd Gen) only and remained open to Bitfocus's naming preference.

Wait for the official repository/naming decision before changing public scope. Stable public release target remains **v1.0.0** unless maintainers direct otherwise.

## Exact immediate next action

1. Keep the exact validated local checkout `4915b9e64d712fcf03f2d7d2e52fcda8f886de88` for the next targeted run; do not resync merely for handoff-only commits.
2. Run `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd`.
3. If preflight rejects module version, connection, authorization, matrix, or meter inventory, stop and diagnose; do not recreate the Companion connection by default.
4. For floor capture, stop only signals that can be safely stopped without changing Focusrite routing, then enter `SILENT`.
5. For movement capture, create signal only on already exercisable paths and enter `SIGNAL` as needed; enter `DONE` when no further safe progress is possible.
6. Do not rerun `NAVIGATE_MIXES`.
7. Do not write `assign-mix`.
8. Do not repeat Mix-A-via-`source` blindly on more output pairs.
9. Review `testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json` before any matrix promotion or publication.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`;
- `docs/CURRENT_HANDOFF.md`.

Pending work is never PASS.
