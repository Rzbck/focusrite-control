# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 21:38+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_A_RIGHT_RUNTIME_MONO_DIFFERENTIAL_PENDING`
Canonical production candidate: exact audited **0.1.16**
Research/readback build: **0.1.17 — SOFTWARE VALIDATED, PACKAGED, LOADED ON EXISTING AUTHORISED COMPANION CONNECTION, REAL-SESSION PROVENANCE OBSERVED**

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, identify the newest MATERIAL movements by commit time, choose the objective branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, read root `HANDOFF`, `AI_PROJECT_RULES.md`, this file, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, and the feedback matrix, reconcile any newer completed user/hardware result, then choose the next action.

A document timestamp or embedded SHA is a checkpoint only.

## MANDATORY EVIDENCE / INFERENCE GATE

Keep separate:
1. **OFFICIAL PRODUCT BEHAVIOUR**;
2. **SCHEMA_PRESENT**;
3. **SESSION_STATE_OBSERVED**;
4. **IMPLEMENTED**;
5. **HARDWARE_WRITE_CONFIRMED**;
6. **HARDWARE_DYNAMIC_CLOSED**.

`UNKNOWN`, blank, missing cache state, `BASELINE_UNKNOWN` or `SKIP_BASELINE_UNKNOWN` means only **not observed in this client session** unless stronger evidence proves more. It is not proof of schema absence, `false`, unsupported hardware or permanent non-actionability.

If older physical/session evidence contradicts current cache coverage, keep the question **READBACK/MATERIALISATION RESEARCH OPEN** until reconciled.

A reversible hardware test must require only state genuinely necessary for exact restoration of the property being changed. Do not impose unrelated prerequisite tuples merely because an older harness grouped them.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST

- `UPDATE.bat` for normal sync.
- `UPDATE_AND_RUN.bat` for update + normal software validation.
- `RUN.bat` when already current.
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Manual shell/Git/PowerShell is last resort only when the launcher itself is broken or cannot expose the required diagnostic.
- Never build a second helper/workflow for behavior already implemented.

## Remote Devices authorization — mandatory before any write

- Focusrite Control -> Device Settings -> Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Always reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- If the existing module client is not approved, classify the run as `AUTHORIZATION/PREFLIGHT BLOCKED`; this is not a hardware-control failure.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.

## Objective continuity

Closing a sub-question does not close the parent hardware-validation objective. Parent objective remains **explicit hardware feedback closure** across all 31 public feedback definitions/instances while material EVAL_ONLY, MANUAL_PENDING, BASELINE_UNKNOWN, neverObserved, unexercised or otherwise open rows remain. Before objective change, account for remaining open matrix rows. Tooling/documentation may interrupt only as a direct blocker; once removed, return to the parent hardware objective. **objective change is forbidden while relevant remaining open matrix rows exist, unless the user explicitly changes the project objective.**

## Software gate — COMPLETE PASS for module 0.1.17

User-host source HEAD `515e9cf2f3e9`:
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **216/216 PASS / 0 FAIL**;
- package build PASS: `focusrite-scarlett-18i20-0.1.17.tgz`.

Later branch changes are TestBench/docs-only and do not alter that validated 0.1.17 module package.

## Latest confirmed Mix hardware result

Completed automated run on 2026-08-24 using the existing authorised Companion client:
- Playback target: slot 3 / Playback 1 / **stereo**;
- exact baseline lanes 2/12: Mix A Left + Right;
- Mix B-F: 20 `SKIP_BASELINE_UNKNOWN`, zero writes;
- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED** (`false -> true -> false`, server + rendered feedback + exact restore);
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED** (`false -> true -> false`, server + rendered feedback + exact restore);
- Mix A Right Mute: direct-right write did not transition the right server variable; exact baseline restored;
- Mix A Right Solo: same direct-right no-transition result; exact baseline restored;
- RESTORE_QUARANTINE 0, hardware restore YES, Page 2 restore YES.

Do not rerun that exact stereo direct-right test unchanged.

## New runtime mono/stereo UI evidence — correction to the hypothesis

After that run the operator supplied new Focusrite Control screenshots and manually changed the tested Software Playback 1-2 presentation from the linked `Playback 1-2` stereo strip to separate mono `Playback 1` and `Playback 2` strips.

The source-selection UI visibly offers individual mono channels and linked stereo pairs for:
- Software Playback;
- Analogue hardware inputs;
- S/PDIF;
- ADAT / ADAT 2 where present.

Classification: **UI_OBSERVED / PRODUCT_BEHAVIOUR**, not Control Server write proof.

Required inference correction:
- previous Right no-transition is proven only under the tested **stereo Playback topology**;
- do not classify Right globally pair-owned, globally aliased or unsupported;
- mono/stereo topology is runtime/configurable and must be read live;
- current schema/parser contains a mixer-slot `stereo` control, and module code has a `mixer_slot_stereo` action, but the current 18i20 evidence profile still withholds automated mixer-slot source/stereo writes. These screenshots do not prove whether the official UI changes source, stereo, or multiple items together.

The operator's current state for the next differential test is intentionally **Playback 1 and Playback 2 mono**. Leave it that way until this test completes.

## Topology-aware TestBench correction — implemented, not yet user-validated

No module 0.1.17 source changed.

Current remote TestBench changes now do all of the following:
- read live `mixer_slot_N_source`, source name and `mixer_slot_N_stereo`;
- no longer prefer a Playback simply because it is stereo;
- read the sanitized prior Mix closure report and reuse its slot/name target only if the same live target still exists and has exact materialised Mix baseline coverage;
- otherwise select only a unique Playback candidate with the strongest exact materialised Mix baseline coverage;
- ambiguous/zero-exact selection => stop before hardware write;
- mono selected Playback => direct per-lane diagnostic;
- stereo selected Playback => pair-aware `side=both` only for exact L/R members with equal baselines;
- verify L/R server variables and rendered feedback independently;
- restore failure still hard-aborts/quarantines;
- no gain, routing, mixer-slot source or mixer-slot stereo writes.

Relevant TestBench-only commits:
- `b291083a182227eb9d4f665c880b95c198c25a9f` — stereo pair-aware path;
- `c71a6aa710430f6b3fafee094baf281bda61f3b7` — initial pair tests;
- `e9b3239f18b9a834fbd3584273385bbed51f7601` — runtime target selection + prior-target continuity;
- `8e83149b5852bf1c67eb966c59616bc8c0e5cc93` — mono/stereo selection regression tests.

Validation status:
- TestBench source: **IMPLEMENTED**;
- targeted self-check after newest commits: **PENDING USER RUN**;
- mono differential hardware run: **PENDING**;
- stereo `side=both` hardware run: **PENDING / only if still needed**.

## Exact immediate next action

Do not switch Playback 1/2 back to stereo yet and do not manually touch Mute/Solo/faders before the next run.

1. Run **`UPDATE.bat` only** and stay on `testbench/meter-routing-exact-restore`.
2. Do not rebuild/reimport module 0.1.17.
3. Keep the existing authorised Companion Focusrite connection.
4. Leave **Playback 1 + Playback 2 mono** exactly as now.
5. Keep Monitor/speakers/headphones physically safe.
6. Run **`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`**.
7. The launcher must first pass its targeted self-check; if it fails, STOP before hardware.
8. Use `PAGE2_AUTO` only if the launcher positively identifies a recognised stale TestBench page.
9. If clean, confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`.
10. Touch nothing in Focusrite Control during the hardware stage.

Expected decision logic, not a claimed result:
- if slot 3 / Playback 1 remains live and exact, output should select it via `previous-closure-target`, now reporting **mono**;
- for a mono selected target, `Stereo-pair feedback operations` must be 0 and direct per-lane targets remain independent;
- if target selection is ambiguous or exact baseline disappeared, no write should occur.

Interpretation after mono differential:
- Right begins to transition in mono => direct-right semantics depend on runtime source topology; document and design around that evidence;
- Right still does not transition => simple stereo-link explanation weakens; investigate item ownership / official-client semantics without calling Right unsupported;
- only after this result, if still useful, ask the operator to return Playback 1-2 to stereo for the guarded `side=both` diagnostic.

## Current Mix status

- `mix_mute`: **PARTIAL** — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right stereo direct-write failed with exact restore, mono differential pending; Mix B-F open.
- `mix_solo`: **PARTIAL** — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right stereo direct-write failed with exact restore, mono differential pending; Mix B-F open.

Completion of this subtest does not close the parent objective.

## UI / product cross-checks retained

User screenshots + official Focusrite docs corroborate:
- output source choices Playback (DAW), Hardware Input, Custom Mix, Custom Mix + Talkback;
- runtime mono/stereo source choices are visible for Software Playback, Analogue, S/PDIF and ADAT families;
- INST only on Analogue 1-2;
- Air/Pad on Analogue 1-8;
- Speaker Switching and Monitor Controls scope exist;
- Talkback source/level exist;
- `Retain 48V` is persistence;
- existing Companion Remote Devices client is approved.

These are **UI_OBSERVED / OFFICIAL_PRODUCT_BEHAVIOUR**, not new TCP/dynamic closures. Do not infer input preamp gain, direct input mute, per-channel phantom or new public write semantics from screenshots.

Safety: Focusrite warns changing Monitor Controls assignment can make affected output level jump to full scale. Do not touch that selector for readback. Speaker Switching/ALT is deferred until exact baseline + physical isolation.

Existing dynamically closed `input_mode`, `monitor_preset`, `talkback_source`, `phantom_persistence`, and `monitor_talkback` do not need repetition.

## Retained parent evidence

- 31 public feedback definitions / 829 instances.
- Original V8 static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Original V8 dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Later meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.
- Latest dedicated Mix run adds two stronger Mix A Left dynamic closures; do not silently rewrite historical tracker counts.
- Targeted Core: 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes/FAIL/restore quarantine — readback evidence, not capability absence.

## Permanent safety

- Hardware support claim only Scarlett 18i20 (3rd Gen).
- Monitor gain 1677 read-only.
- No input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill or physical Monitor level write.
- Dynamic Control Server port and device ID.
- Writes only after this module's own server-assigned client ID is authorised.
- Feedback/state from server-confirmed state only.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands or writes to meter/status/read-only items.
- No writes to explicit UNKNOWN output availability.
- No Focusrite software/firmware/routing changes outside explicitly agreed tests.
- Keep audited 0.1.16 distinguishable from research build 0.1.17.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
