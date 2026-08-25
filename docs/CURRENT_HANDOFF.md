# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 16:01+02:00  
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

Latest fully validated executable code/test HEAD on the user host:

`8cc803b714e14cd50c88e2d702470c1d9f313d06`

That exact checkout completed the full software gate after the narrow meter-routing operator cleanup.

Material movement since the previous executable checkpoint `4915b9e64d712fcf03f2d7d2e52fcda8f886de88` was limited to the meter-routing launcher/guide version cleanup, its regression, and documentation/matrix reconciliation. `MeterRoutingClosure.js`, production `src/`, protocol logic, Focusrite write definitions, and the read-only meter harness were not changed by that cleanup.

Subsequent handoff-only commits that record the latest results do not change executable hardware behavior and do not require replacing local `8cc803b` merely to read them.

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

## Latest fully green user-host software gate

On exact local HEAD `8cc803b714e14cd50c88e2d702470c1d9f313d06`:

- portable Node **22.23.2**: PASS;
- Yarn **4.17.0** via Corepack: PASS;
- immutable dependencies: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **250/250 PASS / 0 FAIL**;
- Companion package build: PASS;
- package: `focusrite-scarlett-18i20-0.1.19.tgz`;
- package was built only, not installed or activated by the gate;
- hardware writes: **none**.

This closes the software blocker for the corrected meter-routing operator surfaces. It does not by itself close any hardware row or grant hardware-write permission.

## Latest hardware result — read-only meter closure v2

The read-only meter harness passed preflight with exact Scarlett 18i20 (3rd Gen), module **0.1.19**, the existing authorised Companion Focusrite connection, exactly **46** meter paths, and rendered feedback compared against an independent numeric oracle.

Original v2 result:

- Focusrite writes: **0**;
- Companion button presses: **0**;
- routing changes by harness: **0**;
- persistent feedback/oracle mismatch: **0**;
- total closed: **21/46**;
- floor-only: **17**;
- movement-only: **8**;
- never-observed: **0**.

Per-family session result:

- `input_meter`: **1/8 closed**, 7 floor-only;
- `output_meter`: **16/26 closed**, 10 floor-only;
- `mix_meter`: **4/12 closed**, 8 movement-only.

This session does not downgrade stronger retained input evidence. Parent aggregate meter status remains:

- `input_meter`: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- `output_meter`: **16/26 HARDWARE_DYNAMIC_CLOSED / 10 open**;
- `mix_meter`: **4/12 HARDWARE_DYNAMIC_CLOSED / 8 open**.

Exact output residuals requiring movement are Outputs **14, 16, 17, 18, 19, 20, 21, 22, 23, 24**. Outputs 21-24 remain no-write while availability is UNKNOWN.

Exact Mix residuals are movement-only: Mix B L/R, Mix C L/R, Mix D L/R, Mix E right, Mix F right.

## Second SILENT retry — zero progress / read-only path exhausted

On the validated local `8cc803b` checkout, the user then ran `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd` again after stopping/disconnecting external audio, entered `SILENT`, left audio stopped, then entered `DONE`.

The accumulator loaded correctly and the result remained exactly unchanged:

- total closed: **21/46**;
- floor-only: **17**;
- movement-only: **8**;
- never-observed: **0**;
- mismatch: **0**;
- `input_meter`: 1/8 session-closed;
- `output_meter`: 16/26 closed;
- `mix_meter`: 4/12 closed;
- no Focusrite write;
- no Companion button press;
- no routing change.

The eight Mix lanes still did not reach the required numeric floor `-128 dBFS`. This is now evidence that another identical read-only `SILENT`/`SIGNAL` loop under the same routing/source conditions is not useful.

**Do not rerun `RUN_METER_FEEDBACK_CLOSURE.cmd` again under unchanged conditions.** The read-only meter path is exhausted for the current routing/source state. The eight Mix residuals remain `MANUAL_PENDING_MOVEMENT_ONLY`; that is an acceptable honest result, not a reason to force repeated observation.

Sanitized local accumulator remains:

`testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json`

Do not publish automatically.

## Parent objective status

The parent objective remains **explicit hardware feedback closure across 31 public feedback definitions / 829 instances**.

A software PASS, inventory PASS, completed research sub-question, one meter session, or fixed launcher does not close the parent objective while material rows remain `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised, or otherwise not dynamically closed.

Current open families still include monitor readback, input Air/Pad readback, output mute/stereo/source partials, output meter 10 residuals, mixer-slot source/stereo research, Mix mute/solo partials, Mix talkback policy-limited evidence, Mix meter 8 residuals, and read-only `assign-mix` research.

See `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md` for the 31-definition classification.

## New direct blocker before write-capable meter routing — residual targeting

The write-capable campaign is `testbench\RUN_METER_ROUTING_EXACT_RESTORE.cmd`. Its package/version operator mismatch is closed and the full 8cc803b software gate is green.

A fresh source audit after the zero-progress SILENT retry identified a separate workflow issue: current `MeterRoutingClosure.js` still does:

- `for (const lane of ctx.snapshot.shape.lanes)` — it attempts every snapshot Mix lane;
- `driveOutputPairs(... augmented.pairBatches ...)` — it attempts every eligible generated output pair.

That means the broad campaign would re-exercise already-closed meter paths. Given the user's repeated-test feedback and the project rule not to rerun useless work, **do not launch the current broad campaign as-is**.

The next direct software change must make the write-capable campaign residual-driven from the existing meter accumulator after its read-only baseline:

- generate/execute Mix drive only for unresolved Mix meter sources: Mix B L/R, Mix C L/R, Mix D L/R, Mix E right, Mix F right;
- generate/execute output-pair drive only when the pair contains an unresolved output meter and remains AVAILABLE + exact-restorable;
- current useful output residuals are Outputs 14 and 16-20;
- Outputs 21-24 remain excluded while availability is UNKNOWN;
- already-closed lanes/pairs receive no new drive batch and no write merely for coverage score;
- if a residual closes during the campaign's initial read-only baseline, it must be removed before any write batch is generated/executed.

This residual-targeting implementation is **PENDING**. Pending is not PASS. After implementation, add regression coverage and run the full local gate before any hardware write.

## Write-capable meter-routing safety contract

Any future residual-targeted campaign may temporarily use only already-audited Companion actions:

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

Its preparation remains read-only. Hardware permission remains gated behind exact preflight plus explicit `ROUTE_METERS` and `ALL_ISOLATED` confirmations. Every property changed requires an exact server-confirmed baseline and exact server-confirmed restoration. Failed hardware restore or failed Page 2 restore remains a hard abort/quarantine.

## Latest completed assign-mix read-only observation

`testbench\RUN_METER_MIX_BASELINE_READONLY.cmd` completed on research 0.1.19:

- output `assign-mix` schema: **26/26 present**;
- non-empty/current value observed: **0/26**;
- all 26: `UNKNOWN[never-observed]` in that session;
- no Focusrite write;
- no Companion button press;
- no Page 2 replacement;
- no manual routing change.

Correct classification:

- `assign-mix`: **SCHEMA_PRESENT**;
- instrumentation: **IMPLEMENTED** read-only;
- exact value semantics: **UNKNOWN**;
- official write transaction semantics: **UNKNOWN**;
- public action/preset/feedback write surface: **ABSENT**;
- writable IDs / Advanced Raw write surface: **ABSENT**.

Do not convert 0/26 observed into unsupported/false/empty-by-definition. Do not rerun `NAVIGATE_MIXES`.

## Latest guarded output-routing evidence

The latest Mix materialisation fallback exercised one guarded `output_pair_source` attempt on non-Monitor Line Outputs 3-4:

- exact original source baseline: Playback 3 + Playback 4;
- one real pair-aware write attempted toward Mix A;
- server did **not** confirm Mix A L/R;
- exact Playback 3/4 source state restored and server-confirmed;
- Page 2 restored;
- no speculative Mix Mute/Solo continuation.

Classification for that operation only:

`WRITE_ATTEMPTED / NO_CONFIRMED_TRANSITION / EXACT_RESTORE_CONFIRMED`

Do not generalize this to a global `output_pair_source` failure and do not repeat the same Mix-A-via-`source` attempt blindly.

## assign-mix write status

A direct `assign-mix` write remains **blocked by restoration evidence**, not declared unsupported. Its changed property has never been server-observed on the proposed target, so there is no exact baseline/restoration oracle.

Therefore no direct `assign-mix` write, no Advanced Raw shortcut, no action/preset addition, and no speculative write from schema presence.

## Retained strong Mix evidence

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false with exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same;
- Mix A Right direct Mute/Solo under tested stereo topology: no transition, exact restore;
- Mix B-F remain open where exact baselines were not observed;
- restore quarantine: 0.

Do not infer a global left/right ownership rule from that topology-specific result.

## PROJECT LAUNCHERS FIRST

Use launchers first:

- `UPDATE.bat` — normal sync;
- `UPDATE_AND_RUN.bat` — sync + full software gate;
- `RUN.bat` — software gate when already current;
- exact `testbench\RUN_*.cmd` launcher — targeted TestBench/hardware work.

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

1. Do **not** rerun `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd` under the same conditions; the second SILENT retry produced zero progress.
2. Do **not** run the broad current `testbench\RUN_METER_ROUTING_EXACT_RESTORE.cmd` as-is; it still sweeps already-closed Mix lanes/output pairs.
3. Implement residual-targeting from the meter accumulator after the campaign's initial read-only baseline.
4. Add regression tests proving already-closed meter paths do not receive drive batches/writes and `UNKNOWN` Outputs 21-24 remain excluded.
5. Run `UPDATE_AND_RUN.bat` and require dependencies, Prettier, ESLint, source manifest, all Node tests, and package build PASS on the resulting exact HEAD.
6. Only after that green gate and **explicit user agreement** to temporary routing/mix changes may the residual-targeted hardware campaign run.
7. Any hardware restore or Page 2 restore failure remains a hard abort/quarantine.
8. Do not rerun `NAVIGATE_MIXES`, do not write `assign-mix`, and do not repeat Mix-A-via-`source` blindly.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`;
- `docs/CURRENT_HANDOFF.md`.

Pending work is never PASS.
