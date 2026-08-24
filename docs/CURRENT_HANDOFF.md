# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 21:05+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_A_MUTE_MATERIALISED_SOLO_BASELINE_PENDING`
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

## Software gate — COMPLETE PASS

User-host source HEAD `515e9cf2f3e9`:
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **216/216 PASS / 0 FAIL**;
- package build PASS: `focusrite-scarlett-18i20-0.1.17.tgz`.

Later branch commits are TestBench/docs-only and do not alter that validated 0.1.17 package.

## Current real-session Mix mapping

0.1.17 is loaded and selected on the existing authorised Companion Focusrite connection.

Read-only preflight still confirms:
- exact Scarlett 18i20 (3rd Gen);
- module 0.1.17;
- module client authorised;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- evidence coverage 1436/1436;
- Playback source existing mixer slot 3 / Playback 1 / stereo.

Stable cold/readback pattern before manual Mix activity:
- Mix A-F Left gain KNOWN `[set]`;
- every Right gain UNKNOWN `[never-observed]`;
- every Mute UNKNOWN `[never-observed]`;
- every Solo UNKNOWN `[never-observed]`.

A sanitized server-confirmed output-routing snapshot then resolved:
- `Monitor Output 1 :: source=Mix A L stereo=true`;
- `Monitor Output 2 :: source=UNKNOWN stereo=true`;
- other currently observed destinations were direct Playback sources.

Current safe conclusion: the active Monitor 1-2 Custom Mix is represented by **Mix A on the observed left member in this session**. Do not generalise this into a universal fixed mapping. The right-member source omission is compatible with sparse/pair-owned behavior but is not independently proven as a universal rule.

## Latest manual Mute materialisation — COMPLETED

During a read-only provenance window, the operator manually clicked the Focusrite Control `Monitor Outputs 1-2 -> Custom Mix -> Playback 1-2` Mute button and immediately clicked it again, visually returning it to the starting state.

Before:
- Mix A Left: gain KNOWN `[set]`, mute UNKNOWN `[never-observed]`, solo UNKNOWN `[never-observed]`;
- Mix A Right: gain UNKNOWN `[never-observed]`, mute UNKNOWN `[never-observed]`, solo UNKNOWN `[never-observed]`.

After:
- Mix A Left: gain KNOWN `[set]`, mute KNOWN `[set]`, solo UNKNOWN `[never-observed]`;
- Mix A Right: gain KNOWN `[set]`, mute KNOWN `[set]`, solo UNKNOWN `[never-observed]`;
- Mix B-F unchanged.

This proves **Mute materialisation**, not dynamic closure. The provenance probe merges whether values were seen; it did not record and independently assert the exact intermediate Mute boolean transition or Companion rendered feedback. Do not promote `mix_mute` yet.

Important deductions:
- active Custom Mix assignment alone was not enough to materialise Mute/Solo;
- actual official-UI Mute activity did materialise both Mix A L/R Mute values;
- the same activity also materialised the previously missing Mix A Right gain;
- Mix B-F Left gains were already KNOWN despite not being the current active visible Custom Mix, so the left-gain sparse pattern is not simply caused by active routing.

## Why this was manual once, not the future test strategy

The module's `Toggle` action intentionally refuses to write when current server state is unknown. That is correct fail-closed behavior. Forcing explicit ON/OFF from an unknown baseline would make exact restoration unknowable.

Now that Mix A Mute is KNOWN, Companion can safely automate Mute. Mix A Solo is still UNKNOWN. One final official-UI Solo round-trip is needed only to bootstrap that missing baseline without guessing. This is **not** a plan to manually test every lane or every feedback.

The existing targeted Mix runner already performs the solid automated closure once the tuple is available:
- self-check before hardware;
- exact current baseline recheck;
- Companion `mix_mute` / `mix_solo` action only;
- server variable confirmation at alternate state;
- rendered feedback confirmation;
- explicit restore action;
- server-confirmed exact baseline restoration;
- restored feedback confirmation;
- restore failure => hard abort/quarantine;
- Page 2 restored/audited before completion.

Only that automated sequence may promote an instance to `HARDWARE_DYNAMIC_CLOSED`.

## Exact immediate next action — no UPDATE / no code change

Keep the current Companion and Focusrite Control session alive. Do not reload/restart the module before this step.

1. In Focusrite Control select **Monitor Outputs 1-2** and keep routing on **Custom Mix**.
2. Locate the **Playback 1-2** strip.
3. Look at the visual state of its **S** button and remember it.
4. Click **S once**.
5. Wait **2-3 seconds**.
6. Click the **same S again** so it is visibly back exactly as it started.
7. Touch nothing else.
8. Then run `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`.
9. At `DONE / NAVIGATE_MIXES`, type **DONE immediately**. Do not use the 30-second observation window.
10. Check whether **Mix A Left and Mix A Right `solo=KNOWN[set]`** while Mute/gain remain KNOWN.

If Mix A L/R Solo is KNOWN, the next action is the existing automated:

`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`

No runner redesign first. Its old full-tuple requirement becomes satisfiable for Mix A L/R only; other lanes remain safe SKIP. Follow its normal preflight/PAGE2_AUTO if offered, then explicit `MIX_FEEDBACK` / `ALL_ISOLATED` confirmations.

Do not run this automated campaign if Solo remains UNKNOWN; diagnose instead.

## Mix Mute/Solo status

- `mix_mute`: **RESEARCH_OPEN / EVAL_ONLY** — Mix A L/R Mute baseline now materialised in the current session; automated dynamic closure pending.
- `mix_solo`: **RESEARCH_OPEN / EVAL_ONLY** — Mix A L/R Solo baseline still unobserved; one official-UI round-trip pending.

Do not rerun the old 0/12 campaign before Solo materialises, and do not call Mute closed from the manual click.

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
- Static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.
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
