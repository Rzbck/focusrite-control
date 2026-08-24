# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 21:49+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `AUTONOMOUS_MIXER_TOPOLOGY_DIAGNOSTIC_SOURCE_PENDING`
Canonical production candidate: exact audited **0.1.16**
Research/readback build: **0.1.17 — SOFTWARE VALIDATED, PACKAGED, LOADED ON EXISTING AUTHORISED COMPANION CONNECTION, REAL HARDWARE EXERCISED**

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, identify newest MATERIAL movement, choose the objective branch using recency + relevance, resolve current remote HEAD, inspect newer commits/diff, then read root `HANDOFF`, `AI_PROJECT_RULES.md`, this file, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, the feedback matrix and relevant current source/tests. Reconcile any newer completed user/hardware result before choosing work.

A document timestamp or SHA is a checkpoint only.

## MANDATORY EVIDENCE / INFERENCE GATE

Keep separate:
1. **OFFICIAL PRODUCT BEHAVIOUR**;
2. **SCHEMA_PRESENT**;
3. **SESSION_STATE_OBSERVED**;
4. **IMPLEMENTED**;
5. **HARDWARE_WRITE_CONFIRMED**;
6. **HARDWARE_DYNAMIC_CLOSED**.

`UNKNOWN`, blank, missing cache, `BASELINE_UNKNOWN`, or `SKIP_BASELINE_UNKNOWN` means only not observed in this client session unless stronger evidence proves more. It is not proof of absence, `false`, unsupported hardware or permanent non-actionability.

If older physical/session evidence conflicts with newer completed user/hardware result, newer evidence wins and the old interpretation must be narrowed rather than silently retained.

Exact restore requires server-confirmed baselines only for properties/topology actually changed. Never guess a missing value.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST

- `UPDATE.bat` normal sync.
- `UPDATE_AND_RUN.bat` update + normal software gate.
- `RUN.bat` when current.
- exact `testbench\RUN_*.cmd` for targeted hardware/TestBench work.
- Manual shell/Git/PowerShell only if launcher itself is broken.
- Extend the existing Mix runner; do not create a duplicate user workflow.

## Remote Devices authorization — mandatory before any write

- Focusrite Control -> Device Settings -> Remote Devices must show existing `Companion Scarlett 18i20` approved.
- Reuse the existing Companion Focusrite connection.
- Missing approval => `AUTHORIZATION/PREFLIGHT BLOCKED`.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.

## Objective continuity

Parent objective remains **explicit hardware feedback closure** across all 31 public feedback definitions/instances. Closing Mix A does not close Mix B-F, output feedbacks/meters, Core readback gaps or other open rows. **objective change is forbidden while relevant remaining open matrix rows exist, unless the user explicitly changes the project objective.**

## Software gate retained

Module 0.1.17 user-host gate at source HEAD `515e9cf2f3e9`:
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **216/216 PASS**;
- package build PASS: `focusrite-scarlett-18i20-0.1.17.tgz`.

Later changes described here are TestBench/docs-only unless a newer handoff says otherwise. Do not rebuild/reimport 0.1.17 merely for those changes.

## Latest confirmed automated Mix hardware result

Completed 2026-08-24 with Playback slot 3 / Playback 1 **stereo**:
- Mix A Left + Right exact baselines;
- Mix B-F 20 `SKIP_BASELINE_UNKNOWN`, zero writes;
- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, `false -> true -> false`, server + rendered feedback + exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same full closure;
- Mix A Right Mute direct write: no transition under tested stereo topology; exact baseline restored;
- Mix A Right Solo direct write: no transition under tested stereo topology; exact baseline restored;
- restore quarantine 0;
- hardware restore YES;
- Page 2 restore YES.

This is not a restore incident. Do not rerun the same direct-right stereo test unchanged.

## Critical runtime mono/stereo correction

New user screenshots show Focusrite Control can present/select individual mono channels or linked stereo pairs at runtime for Software Playback, Analogue, S/PDIF and ADAT families.

The user manually changed the tested Software Playback presentation from linked `Playback 1-2` to separate mono `Playback 1` and `Playback 2` strips.

Classification: **UI_OBSERVED / PRODUCT_BEHAVIOUR**. This proves runtime topology is configurable, but not which Control Server item sequence the official client uses.

Therefore the old broad interpretation that mixer-slot source/stereo is unsupported or permanently non-actionable is RETRACTED.

Older V8 hardware evidence is narrower:
- single-item mixer-slot source writes on tested slots 1-4 produced no useful transition;
- single-item mixer-slot stereo writes on tested slots 3-4 produced no useful transition.

Newer UI evidence proves capability exists through the official client, so correct classification is now:
- `mixer_slot_stereo`: **RESEARCH_OPEN — pair/group/transaction semantics**; generic/public write campaign still withheld;
- `mixer_slot_source`: **RESEARCH_OPEN — pair/group/transaction semantics where needed**; generic/public write campaign still withheld.

`testbench/FullTestBenchProfilesV8.js` still blocks generic source/stereo writes but commit `873353e87832d0991c25c25e1101e35b3a0c916e` corrects its comments so `noEffect*` means **single-item no-effect evidence only**, not feature absence.

Do not remove that profile guard before dedicated exact-restore proof.

## Current user state

Latest known Focusrite Control configuration: Playback 1 and Playback 2 are separate **mono** strips. Preserve this as starting state unless a newer live read says otherwise.

## User authorization for autonomous topology test

The user explicitly requested that the final targeted Mix test become autonomous and explicitly agreed that the TestBench may temporarily change mixer-slot mono/stereo topology itself so they do not manually switch between phases.

Conditions:
- exact current topology baseline must be server-confirmed before write;
- initially touch only the necessary known `mixer_slot_stereo` controls;
- source IDs/names are observed as collateral state and must not be written unless later evidence separately proves it necessary and safe;
- no guessed values;
- no raw/direct TCP helper;
- every topology transition must be server-confirmed;
- exact original topology must be restored and confirmed;
- restore failure hard-aborts/quarantines;
- this authorization is for the dedicated research TestBench only, not proof of public support.

## Existing TestBench work already implemented

Current branch already contains:
- stereo Mix `side=both` diagnostic with independent Left/Right server + rendered feedback verification;
- runtime Playback target selection reading source/name/stereo live;
- no preference for candidates merely because they are stereo;
- sanitized prior-target continuity only if same live slot/name still has exact Mix baseline coverage;
- ambiguity or zero exact baseline => stop before write;
- mono target => direct per-lane Mix path;
- stereo target => pair-aware Mix path where members/baselines permit.

Relevant commits:
- `b291083a182227eb9d4f665c880b95c198c25a9f` pair-aware Mix runner;
- `c71a6aa710430f6b3fafee094baf281bda61f3b7` pair regression coverage;
- `e9b3239f18b9a834fbd3584273385bbed51f7601` runtime topology / target selection;
- `8e83149b5852bf1c67eb966c59616bc8c0e5cc93` target-selection regression coverage;
- `873353e87832d0991c25c25e1101e35b3a0c916e` evidence wording correction.

Newest targeted self-check after all these commits is **NOT YET USER-VALIDATED**. Do not claim PASS.

## Exact next source task before any next hardware run

Do NOT ask the user to run the previous mono-only differential.
Do NOT ask the user to manually return Playback 1-2 to stereo.

Extend the existing `RUN_MIX_FEEDBACK_CLOSURE.cmd` / `MixFeedbackClosureRunner.js` with one fail-closed autonomous topology phase:

1. Identify the selected Playback target and its adjacent Playback mate dynamically from live source/name variables; no hardcoded slot 3/4 assumption.
2. Require known `mixer_slot_N_stereo` baselines for every slot that may be changed.
3. Preserve and monitor both slot source IDs/names read-only for collateral changes.
4. Run the existing Mix Mute/Solo differential in the current mono topology if exact baselines remain.
5. Generate one Companion button step containing ONLY two `mixer_slot_stereo` actions for the adjacent Playback slots. This is deliberately different from old V8 single-item tests.
6. Attempt the temporary stereo topology and read back both stereo variables plus source variables. Do not fabricate the resulting vector; report server-confirmed values.
7. Only if a useful stereo transition is confirmed, re-read Mix Mute/Solo baselines and run existing stereo `side=both` diagnostics where exact.
8. Restore both stereo flags to their exact original values and confirm source values also remained/returned exact.
9. Any topology restore failure => HARD ABORT / QUARANTINE.
10. If the paired normal Companion actions still cause no topology transition, restore/confirm and stop. Do not escalate to raw writes or production changes. Next research is official-client grouped/atomic `<set>` semantics because current module sends one item per `<set>` call.

Regression requirements before user hardware run:
- adjacent Playback pair selected dynamically;
- both stereo baselines required;
- topology button contains exactly two `mixer_slot_stereo` actions;
- no `mixer_slot_source`, output routing, gain, raw, firmware/reset writes;
- topology server confirmation gates stereo Mix phase;
- source variables observed as collateral state;
- exact two-slot restore required;
- restore failure hard-abort;
- no manual topology change requested from user.

## User-facing next step AFTER source is ready

Only after the above source + targeted self-check is ready, tell the user to:
1. run `UPDATE.bat` and stay on objective branch;
2. do not rebuild/reimport module 0.1.17;
3. keep existing Remote Devices approval;
4. physically isolate Monitor/speakers/headphones;
5. run the same `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`;
6. confirm `MIX_FEEDBACK` and `ALL_ISOLATED` once;
7. touch nothing in Focusrite Control while TestBench automatically performs mono/stereo phases and restores original topology.

Until that source work is complete, **do not ask the user to run hardware again**.

## Current Mix status

- `mix_mute`: PARTIAL — Mix A Left HARDWARE_DYNAMIC_CLOSED; Right direct stereo write failed safely; autonomous topology differential pending; Mix B-F open.
- `mix_solo`: PARTIAL — Mix A Left HARDWARE_DYNAMIC_CLOSED; Right direct stereo write failed safely; autonomous topology differential pending; Mix B-F open.

## Retained parent evidence

- 31 feedback definitions / 829 instances.
- Historical V8 static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Historical V8 dynamic 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Later meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.
- Dedicated Mix run adds two stronger Mix A Left dynamic closures; do not rewrite historical V8 tracker counts silently.
- Targeted Core 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes/FAIL/restore quarantine — readback evidence, not capability absence.

## Permanent safety

- Scarlett 18i20 (3rd Gen) only.
- Monitor gain 1677 read-only.
- No input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill or physical Monitor level write.
- Dynamic server port/device ID.
- Writes only through existing authorised module client.
- Feedback/state only from server-confirmed state.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot, meter/status writes.
- No writes to explicit UNKNOWN output availability.
- No unrelated Focusrite software/firmware/routing changes.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Pending work is not PASS.
