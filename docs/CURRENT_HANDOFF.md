# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 14:40+02:00  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback closure**  
Canonical production candidate: audited **0.1.16**  
Current research package: **0.1.19**  
Supported hardware scope: **Scarlett 18i20 (3rd Gen) only**

## Current live branch state

Latest code/test HEAD before this handoff update:

`9ca0ac02349ae7810086647acaddce293305773e`

Latest relevant sequence:

- `7b0687f1477a814113f597b7d9dabf49a9a94be4` — align meter launcher text with package-backed module version;
- `b6badeac245f87761553b41d28dc5f9f950827c5` — align meter operator guide;
- `3b7bfbe9d99d19f0b8f5871914bc2f14673bc57d` — regression preventing stale 0.1.16 meter launcher pin;
- `9ca0ac02349ae7810086647acaddce293305773e` — exact Prettier reflow for that regression.

No `src/` module behavior, protocol logic, Focusrite write action, or `MeterFeedbackClosure.js` hardware behavior changed in those commits.

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

## Latest user-host software gate — current HEAD lineage not green yet

The user ran `UPDATE_AND_RUN.bat` on exact local HEAD:

`96dcd4701d042f7dde1d927e98f3f02d0d3615ca`

Observed:

- portable Node **22.23.2** prepared successfully;
- Yarn **4.17.0** via Corepack;
- dependencies: **PASS**;
- Prettier **3.9.6**: **FAIL** on exactly `test/meter-feedback-closure.test.js`;
- ESLint: **NOT RUN**;
- source manifest: **NOT RUN**;
- Node tests: **NOT RUN**;
- package build: **NOT RUN**;
- hardware writes: **none**.

The Prettier diagnostic showed one formatting-only reflow in the newly added meter-launcher regression. No source file was modified by the diagnostic itself.

That exact formatting output was then applied with no logic change:

- fix commit: `9ca0ac02349ae7810086647acaddce293305773e`;
- resulting test blob: `536c883d57d1c0f9fa6d3d47d668106440b9e9e8`.

**Current status:** source/fix ready, full current-HEAD gate **PENDING**. Pending is not PASS.

Immediate software action is to sync and rerun `UPDATE_AND_RUN.bat`. Do not start hardware work from this state until dependencies, Prettier, ESLint, source manifest, all Node tests, and Companion package build are all green.

## Last fully green 0.1.19 software checkpoint

Before the later updater/meter-launcher-only changes, a complete 0.1.19 Windows gate completed:

- dependencies: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **247/247 PASS / 0 FAIL**;
- Companion package build: PASS;
- package: `focusrite-scarlett-18i20-0.1.19.tgz`;
- hardware writes from the gate: **none**.

Do not extend that green claim to the newer exact HEAD until the new full gate completes.

## Updater blocker — closed by real Windows execution

The direct `UPDATE.bat` branch-switch bug is now closed by user-host execution.

The fixed launcher:

- stayed on `testbench/meter-routing-exact-restore`;
- fetched the explicit remote branch;
- fast-forwarded cleanly;
- reported local and remote HEAD correctly;
- terminated normally without the former second-bootstrap error.

The old failure came from cmd.exe resuming a tracked `UPDATE.bat` after that file had been replaced by a branch switch. The fix keeps the bootstrap continuation in an already-parsed block and hardens SHA reporting.

The accidental `debug/official-client-passive-session` detour is also closed as a workflow mistake. That branch is old/divergent and must **not** be merged or used as the current hardware-validation base.

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

Before asking the user to run this harness, a stale user-facing module 0.1.16 pin was found in the launcher/guide. The executable preflight already derives `EXPECTED_MODULE_VERSION` from root `package.json`, currently 0.1.19. The stale text was corrected and regression-covered.

After a fully green current-HEAD software gate, the next hardware observation should be only:

`testbench\RUN_METER_FEEDBACK_CLOSURE.cmd`

Do **not** run a write-capable Mix/routing campaign first.

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

## Project launcher policy

Use launchers first:

- `UPDATE.bat` — normal sync;
- `UPDATE_AND_RUN.bat` — sync + full software gate;
- `RUN.bat` — software gate when already current;
- exact `testbench\RUN_*.cmd` — targeted TestBench/hardware work.

Manual Git/PowerShell/Node is last resort only when a normal launcher is itself broken or cannot expose the required diagnostic.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware campaign:

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved;
- reuse the existing Companion Focusrite connection;
- do not delete/recreate it for testing;
- authorization must match this module's own server-assigned client ID;
- missing approval = `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware failure;
- no extra direct write clients by default;
- never reuse/copy the Companion private client key into another process.

Direct Control Server research clients must never run concurrently with a normal Companion write-capable campaign.

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

1. Sync `testbench/meter-routing-exact-restore`.
2. Rerun `UPDATE_AND_RUN.bat`.
3. Require dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, all Node tests PASS, and Companion package build PASS.
4. If any stage fails, stop; do not continue to hardware from a partial gate.
5. Only after the full current-HEAD gate is green, run `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd`.
6. Do not rerun `NAVIGATE_MIXES`.
7. Do not write `assign-mix`.
8. Do not repeat Mix-A-via-`source` blindly on more output pairs.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`;
- `docs/CURRENT_HANDOFF.md`.

Pending work is never PASS.
