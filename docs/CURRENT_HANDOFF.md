# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 07:51+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `RESEARCH_0_1_18_SOFTWARE_VALIDATED_PACKAGED_HARDWARE_PENDING`
Canonical production candidate: exact audited **0.1.16**
Prior research build: **0.1.17 — SOFTWARE VALIDATED, PACKAGED, LOADED ON EXISTING AUTHORISED COMPANION CONNECTION, REAL HARDWARE EXERCISED**
Current research build: **0.1.18 — SOURCE_IMPLEMENTED / SOFTWARE VALIDATED / PACKAGED / NOT YET LOADED / HARDWARE PENDING**
Validated code/package checkpoint: `d6df45c59ab825e1ebccae90d98212b561449feb`.

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, identify the newest MATERIAL movements by commit time, choose the objective-owning branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, then read root `HANDOFF`, `AI_PROJECT_RULES.md`, this file, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence. Reconcile any newer completed user/hardware result before choosing work.

A document timestamp or embedded SHA is a checkpoint only. Later documentation-only commits do not invalidate a previously identified software/package checkpoint, but code changes do.

## MANDATORY EVIDENCE / INFERENCE GATE

Keep separate:

1. **OFFICIAL PRODUCT BEHAVIOUR**;
2. **SCHEMA_PRESENT**;
3. **SESSION_STATE_OBSERVED**;
4. **IMPLEMENTED**;
5. **HARDWARE_WRITE_CONFIRMED**;
6. **HARDWARE_DYNAMIC_CLOSED**.

`UNKNOWN`, blank, missing cache, `BASELINE_UNKNOWN`, `SKIP_BASELINE_UNKNOWN`, or sparse initial state means only not observed in this client session unless stronger evidence proves more. It is not proof of absence, `false`, unsupported hardware, or permanent non-actionability.

If older physical/session evidence conflicts with a newer completed user/hardware result, narrow the old interpretation rather than silently retaining it. Exact restoration requires only server-confirmed state genuinely needed for the property/topology changed; never guess a missing baseline.

## PROJECT LAUNCHERS FIRST

- `UPDATE.bat` for normal sync.
- `UPDATE_AND_RUN.bat` for update + normal software gate.
- `RUN.bat` when current.
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Manual Git/PowerShell/Node is last resort only when the project launcher itself is broken or cannot expose the required diagnostic.
- Extend the existing Mix runner; do not create a duplicate user workflow.

## Remote Devices authorization — mandatory before any write

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Always reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- Missing approval is `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware-control failure.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.
- See `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

## Objective continuity

Closing a sub-question never closes its parent validation objective. Parent objective remains **explicit hardware feedback closure** across all 31 public feedback definitions/instances while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised, or otherwise open rows remain. Before objective change, account for all remaining open matrix rows. **objective change is forbidden while relevant remaining open matrix rows exist, unless the user explicitly changes the project objective.** Tooling/documentation may interrupt only as a direct blocker for the next safe validation step; when removed, return to the parent hardware objective.

## Retained 0.1.17 software gate

User-host source HEAD `515e9cf2f3e9`:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **216/216 PASS**;
- package build PASS: `focusrite-scarlett-18i20-0.1.17.tgz`.

## 0.1.18 user-host software gate — PASS

Completed 2026-08-25 on source HEAD `d6df45c59ab8` with the normal `UPDATE_AND_RUN.bat` workflow:

- portable Node **22.23.2** and Yarn **4.17.0** started correctly;
- immutable dependencies **PASS**;
- Prettier **PASS**;
- ESLint **PASS**;
- source manifest **PASS**;
- Node tests **225/225 PASS**, fail 0, skipped 0;
- Companion package build **PASS**;
- package created: `focusrite-scarlett-18i20-0.1.18.tgz`;
- launcher explicitly did **not** install or activate the package;
- no hardware command/write was run and no automatic Git promotion occurred.

This validates/packages research build 0.1.18 at code checkpoint `d6df45c59ab8`. It does **not** constitute hardware validation of the new mixer-slot topology path.

Historical gate blockers before this green checkpoint were five Prettier-only diffs on `986da507e19d`, followed by one ESLint `no-useless-assignment` blocker on `87f3e0bd4458`; both were corrected before the successful gate. Do not repeat those fixes.

## Latest confirmed automated Mix hardware result

Completed 2026-08-24 using 0.1.17, the existing authorised Companion client, and Playback slot 3 / Playback 1 **stereo**:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, server variable + rendered feedback `false -> true -> false`, exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same full closure;
- Mix A Right Mute direct write: no transition under the tested stereo topology; exact baseline restored;
- Mix A Right Solo direct write: same direct-right no-transition; exact baseline restored;
- Mix B-F: 20 `SKIP_BASELINE_UNKNOWN` in that campaign;
- RESTORE_QUARANTINE 0;
- hardware restore YES;
- Companion Page 2 restore YES.

This was not a restore incident. Do not rerun the same direct-right stereo test unchanged and do not infer a global Right-lane unsupported/ownership rule from it.

## Runtime mono/stereo evidence — old belief corrected

Operator screenshots from the physical 18i20 show Focusrite Control can present/select individual mono channels or linked stereo pairs at runtime for Software Playback, Analogue inputs, S/PDIF, and ADAT families where available.

The operator manually changed the previously tested linked `Playback 1-2` presentation to separate mono `Playback 1` and `Playback 2` strips. Latest known starting state is therefore **Playback 1 + Playback 2 mono**. Preserve this unless a newer live read says otherwise.

Classification: **UI_OBSERVED / product behaviour**, not Control Server write-contract proof.

Corrected repository interpretation:

- old direct SINGLE-ITEM mixer-slot source writes on tested slots 1-4 produced no useful transition;
- old direct SINGLE-ITEM mixer-slot stereo writes on tested slots 3-4 produced no useful transition;
- these old results do not prove feature/capability absence because the official UI proves runtime topology is configurable;
- generic/public mixer-slot source/stereo and Advanced Raw remain withheld while pair/group/transaction semantics are researched.

Current classification:

- `mixer_slot_stereo`: **RESEARCH_OPEN / EVAL_ONLY**, software path validated but hardware pair/group semantics pending;
- `mixer_slot_source`: **RESEARCH_OPEN / EVAL_ONLY** where grouped semantics require investigation;
- no public-support promotion yet.

## User authorization for autonomous topology research

The user explicitly requested that the targeted Mix differential become autonomous so they do not manually switch mono/stereo between phases. The dedicated TestBench may temporarily change mixer-slot stereo topology provided:

- exact server-confirmed starting topology for every touched slot;
- only the existing authorised Companion connection;
- no guessed state;
- no raw/direct TCP helper;
- source IDs/names observed as collateral state, not written;
- every topology transition server-confirmed;
- exact original topology/source state restored and confirmed;
- restore failure => HARD ABORT / QUARANTINE;
- this authorization is research/TestBench-only and is not proof of a public action contract.

## 0.1.18 implementation — software validated, hardware pending

`package.json` carries **0.1.18**.

`src/definition-policy.js`:

- keeps `mixer_slot_source` hidden;
- leaves generic/public/raw mixer-slot source/stereo withheld through normal hardware policy;
- exposes `mixer_slot_stereo` only when the existing diagnostic **Expose all mixer slot variables** option is enabled;
- labels it Research/TestBench;
- removes Toggle and permits explicit `on`/`off` only;
- blocks invalid slot/state and missing/invalid current server state;
- delegates the actual write through the existing Companion module action/client.

`testbench/MixFeedbackClosureRunner.js` extends the existing workflow:

1. reads live mixer-slot source/name/stereo state;
2. preserves the previous exact sanitized Playback target only if the same slot/name remains live with exact baseline coverage, otherwise requires a unique best exact Playback target;
3. runs current-topology Mute/Solo where exact;
4. when starting from two adjacent known-mono Playback members, identifies the canonical adjacent Playback mate dynamically instead of hardcoding slots 3/4;
5. generates one Companion button step containing exactly **two `mixer_slot_stereo` ON actions**, plus one exact two-action mono restore step;
6. monitors both stereo variables plus source IDs/names;
7. requires server-confirmed stereo transition and source stability before stereo Mix testing;
8. re-reads live Mute/Solo baselines under stereo and uses existing `side=both` pair-aware feedback verification only where exact/equal;
9. restores both stereo flags in `finally` and requires exact original source/topology state;
10. any topology restore failure hard-aborts/quarantines;
11. paired no-transition restores and stops; it does not escalate to raw writes.

The 225-test green gate includes regression coverage for target continuity across stereo→mono, baseline-based target selection, ambiguity fail-closed, pair-aware `side=both`, dynamic adjacent Playback mate selection, two-action topology planning, no broader source/routing/raw path, research action hidden normally, explicit-only diagnostic mode, unknown-baseline blocking, Page 2 contracts, authorization/state safety and project handoff contracts.

## Current Mix status

- `mix_mute`: **PARTIAL** — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right direct stereo no-transition with exact restore; autonomous mono/stereo differential pending; Mix B-F open.
- `mix_solo`: **PARTIAL** — same.
- `mixer_slot_stereo`: **RESEARCH_OPEN** — 0.1.18 software validated/package built; hardware pair transition semantics pending.
- `mixer_slot_source`: **RESEARCH_OPEN**, but no 0.1.18 source write is exposed or attempted.

## Retained parent evidence

- 31 feedback definitions / 829 instances.
- Historical V8 static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Historical V8 dynamic 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Later meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.
- Targeted Core 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes/FAIL/restore quarantine — readback evidence, not capability absence.

## Exact immediate next action — load validated 0.1.18, then targeted hardware campaign

Do **not** manually switch Playback 1/2 back to stereo. Do not recreate the Focusrite Companion connection.

1. In Companion: **Modules → Import module package** → choose local `focusrite-scarlett-18i20-0.1.18.tgz` built by the green gate.
2. In **Connections → existing Focusrite connection → Module Version**, select **0.1.18**.
3. On that same existing connection, keep/enable **Expose all mixer slot variables** so the research `mixer_slot_stereo` action is available only to this diagnostic configuration.
4. In Focusrite Control → Device Settings → Remote Devices, confirm the same existing `Companion Scarlett 18i20` client remains approved.
5. Leave Playback 1 and Playback 2 in their current separate mono state.
6. Put Monitor/speakers/headphones in a physically safe state.
7. Run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
8. Follow `PAGE2_AUTO` only if the launcher positively identifies a recognised stale TestBench Page 2.
9. Confirm `MIX_FEEDBACK`, then `ALL_ISOLATED` once.
10. Touch nothing in Focusrite Control during the hardware stage; TestBench owns temporary topology and exact restoration.

Expected safe decision logic, not a claimed hardware result:

- current mono exact target => direct per-lane Mute/Solo first;
- exact adjacent mono Playback mate => paired stereo attempt;
- no server-confirmed stereo transition => exact restore, stop topology phase, no raw escalation;
- confirmed stereo + stable sources => stereo `side=both` Mute/Solo only where fresh exact baselines exist;
- any unconfirmed topology/source restore => HARD ABORT / QUARANTINE.

If paired `mixer_slot_stereo` actions produce no useful transition but restore exactly, do not repeat blindly. Preserve that evidence and research official-client grouped/atomic-set semantics next.
