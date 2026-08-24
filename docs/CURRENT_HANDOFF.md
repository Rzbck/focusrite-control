# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 21:23+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_A_RIGHT_STEREO_PAIR_SEMANTICS_DIAGNOSTIC_PENDING`
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

## Retained Mix mapping/materialisation

0.1.17 is loaded on the existing authorised Companion connection. Read-only preflight confirms exact Scarlett 18i20 (3rd Gen), 8 inputs / 26 outputs / 24 mixer slots / 12 lanes, and Playback slot 3 / Playback 1 / stereo.

A sanitized server-confirmed routing snapshot showed:
- `Monitor Output 1 :: source=Mix A L stereo=true`;
- `Monitor Output 2 :: source=UNKNOWN stereo=true`;
- other observed destinations were direct Playback sources.

This maps the current Monitor 1-2 Custom Mix to Mix A on the observed left member for this session only; do not generalise a fixed mapping.

Manual official-UI Mute/Solo activity materialised both Mix A members. Before the automated closure run both lanes were complete:
- Mix A Left: `gain=KNOWN[set] mute=KNOWN[set] solo=KNOWN[set] exact=YES`;
- Mix A Right: `gain=KNOWN[set] mute=KNOWN[set] solo=KNOWN[set] exact=YES`;
- Mix B-F remained incomplete.

## Latest automated Mix feedback hardware result — completed

Command: `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.

Pre-hardware:
- targeted self-check **35/35 PASS**;
- exact Scarlett 18i20 (3rd Gen) / module 0.1.17 / authorised existing Companion client PASS;
- recognised stale Page 2 replaced through existing `PAGE2_AUTO`, connection preserved, no hardware write during preparation;
- final Capability Lab Page 2 audited at 771 controls;
- explicit `MIX_FEEDBACK` + `ALL_ISOLATED` confirmations completed.

Hardware phase:
- Playback = slot 3 / Playback 1 / stereo;
- exact baseline lanes = **2/12**: Mix A Left + Right;
- Mix B-F = **20 SKIP_BASELINE_UNKNOWN**, zero writes;
- four Mix A direct targets executed.

Results:
- **Mix A Left Mute — HARDWARE_DYNAMIC_CLOSED**: server variable + rendered feedback confirmed `false -> true -> false`, exact restore;
- **Mix A Left Solo — HARDWARE_DYNAMIC_CLOSED**: server variable + rendered feedback confirmed `false -> true -> false`, exact restore;
- **Mix A Right Mute — direct transition failed**: expected true, right server variable stayed false; exact baseline restored;
- **Mix A Right Solo — direct transition failed**: expected true, right server variable stayed false; exact baseline restored.

Summary:
- DYNAMIC_CLOSED 2;
- SKIP_BASELINE_UNKNOWN 20;
- FAIL 2;
- RESTORE_QUARANTINE 0;
- hardware restore YES;
- Page 2 base restore YES;
- exit code 2 due only to the two unconfirmed right transitions.

This is not a restore incident. Do not rerun the same direct-right test unchanged.

## Current interpretation — stereo pair semantics research

Current schema/parser still exposes distinct Left/Right gain, pan, mute and solo IDs, and feedbacks read explicit per-member server state.

Current action implementation selects `left`, `right`, or `both`, then sends one normal write per selected lane item. The Focusrite client sends one `<item>` per `<set>` call.

The tested mixer source slot is stereo. Focusrite Control exposes it as one `Playback 1-2` strip. Official-UI Mute/Solo interaction materialised both L/R states, while Companion direct Left writes succeeded and direct Right writes did not transition.

Strong hypothesis only, not yet hardware proof:
- Left may own the stereo strip control and Right may be a state-bearing pair member/alias; OR
- the official client may use another grouped write semantic.

Never fake/mirror right feedback. Server-confirmed Right state remains the oracle.

## Pair-aware TestBench diagnostic — source implemented, validation pending

No production/module source has changed.

TestBench-only source commits:
- `b291083a182227eb9d4f665c880b95c198c25a9f` — pair-aware runner;
- `c71a6aa710430f6b3fafee094baf281bda61f3b7` — regression coverage.

The pair-aware path reuses the existing `RUN_MIX_FEEDBACK_CLOSURE.cmd` workflow. For detected stereo Playback and a complete L/R pair with the same known property baseline it:
- suppresses the separate direct L/R target for that paired property;
- issues one normal Companion `mix_mute` or `mix_solo` action with `side=both`;
- observes Left and Right server variables independently;
- observes Left and Right rendered feedback independently;
- restores with `side=both`;
- confirms Left and Right server restoration independently;
- confirms Left and Right feedback restoration independently;
- hard-aborts/quarantines on unconfirmed hardware restore.

Fail-closed:
- no pair operation for mono Playback;
- no pair operation if either member is missing;
- no pair operation for a property whose L/R baselines differ;
- no mirrored success: one member may PASS while the other FAILS.

Validation status:
- pair-aware TestBench source: **IMPLEMENTED**;
- targeted launcher self-check after these commits: **PENDING USER RUN**;
- pair-aware hardware test: **PENDING**;
- do not claim PASS yet.

## Exact immediate next action

No more manual Mix clicks.

1. Run **`UPDATE.bat` only** and stay on `testbench/meter-routing-exact-restore`.
2. Do not rebuild/reimport module 0.1.17; module source is unchanged.
3. Keep the existing authorised Companion Focusrite connection.
4. Physically keep Monitor/speakers/headphones safe.
5. Run the existing **`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`**.
6. The first stage must pass its targeted software self-check. If it fails, stop; no hardware confirmation/run.
7. Use `PAGE2_AUTO` only if the launcher positively identifies a recognised stale TestBench Page 2.
8. If software/preflight are clean, confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`.
9. During hardware stage touch nothing in Focusrite Control.

Expected diagnostic shape, not a claimed result:
- current cache should still make Mix A L/R exact if the session was preserved;
- `Stereo-pair feedback operations` should report **2** (Mute + Solo);
- paired Mix A operations should use `side=both` rather than repeating the known-failing direct-right path;
- each operation reports Left and Right separately.

Interpretation:
- both L/R PASS for Mute/Solo => pair-control semantics proven for this topology; Right instances can dynamically close through pair operation;
- Left PASS / Right FAIL => sequential `side=both` still does not drive Right; next research is official-client/grouped-set semantics, not more direct-right retries;
- any restore quarantine => stop all further hardware testing pending diagnosis.

## Current Mix status

- `mix_mute`: **PARTIAL** — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right pair semantics open; Mix B-F open.
- `mix_solo`: **PARTIAL** — Mix A Left HARDWARE_DYNAMIC_CLOSED; Mix A Right pair semantics open; Mix B-F open.

Completion of Mix A does not close the parent objective; output/meter/Core and other Mix instances remain tracked in the matrix.

## UI / product cross-checks retained

User screenshots + official Focusrite docs corroborate:
- output source choices Playback (DAW), Hardware Input, Custom Mix, Custom Mix + Talkback;
- INST only on Analogue 1-2;
- Air/Pad on Analogue 1-8;
- Speaker Switching and Monitor Controls scope exist;
- Talkback source/level exist;
- `Retain 48V` is persistence;
- existing Companion Remote Devices client is approved.

These are **UI_OBSERVED / OFFICIAL_PRODUCT_BEHAVIOUR**, not new TCP/dynamic closures. Do not infer input preamp gain, direct input mute, per-channel phantom or new public actions from screenshots.

Safety: Focusrite warns changing Monitor Controls assignment can make affected output level jump to full scale. Do not touch that selector for readback. Speaker Switching/ALT is deferred until exact baseline + physical isolation.

Existing dynamically closed `input_mode`, `monitor_preset`, `talkback_source`, `phantom_persistence`, and `monitor_talkback` do not need repetition.

## Retained parent evidence

- 31 public feedback definitions / 829 instances.
- Original V8 static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Original V8 dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Later meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.
- Latest dedicated Mix run adds two stronger Mix A Left dynamic closures; do not silently rewrite the historical V8 tracker counts.
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
