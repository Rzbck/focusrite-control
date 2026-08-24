# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 21:14+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_A_LR_BASELINE_MATERIALISED_AUTOMATED_CLOSURE_READY`
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

Later branch changes through this handoff are TestBench/docs-only and do not alter that validated 0.1.17 module package.

## Real-session Mix mapping and readback findings

0.1.17 is loaded on the existing authorised Companion connection. Read-only preflight confirms exact Scarlett 18i20 (3rd Gen), module 0.1.17, 8 inputs / 26 outputs / 24 mixer slots / 12 lanes, and Playback slot 3 / Playback 1 / stereo.

Before manual Mix activity the repeated provenance pattern was:
- Mix A-F Left gain KNOWN `[set]`;
- every Right gain UNKNOWN `[never-observed]`;
- every Mute UNKNOWN `[never-observed]`;
- every Solo UNKNOWN `[never-observed]`.

Output-selection/navigation alone did not materialise missing Mute/Solo.

A sanitized server-confirmed routing snapshot then showed:
- `Monitor Output 1 :: source=Mix A L stereo=true`;
- `Monitor Output 2 :: source=UNKNOWN stereo=true`;
- the other observed destinations were direct Playback sources.

Supported conclusion: the current Monitor 1-2 Custom Mix is represented by Mix A on the observed left member in this session. This is SESSION_STATE_OBSERVED, not a universal fixed mapping rule.

## Latest manual materialisation — Mix A L/R COMPLETE BASELINE

The operator subsequently exercised the Focusrite Control `Monitor Outputs 1-2 -> Custom Mix -> Playback 1-2` controls manually, including Mute, Solo and level/fader activity on the stereo strip.

The next read-only provenance probe began with the following **server-confirmed state already materialised**:
- Mix A Left: `gain=KNOWN[set] mute=KNOWN[set] solo=KNOWN[set] exact=YES`;
- Mix A Right: `gain=KNOWN[set] mute=KNOWN[set] solo=KNOWN[set] exact=YES`;
- Mix B-F remained incomplete: Left gain known, Right gain never-observed, Mute/Solo never-observed.

The 30-second observation that followed did not add further coverage.

What this proves:
- official Focusrite Control interaction can materialise the full Playback-strip gain/mute/solo state for both Mix A lanes in the existing Companion session;
- Mix A L/R now provide a complete current server baseline for the existing targeted automated runner;
- manual Mute/Solo interaction is **materialisation evidence only**, not action-feedback-restore closure.

Do NOT classify Mix A Mute/Solo as `HARDWARE_DYNAMIC_CLOSED` yet. The read-only provenance probe does not prove the exact intermediate boolean sequence or rendered Companion feedback.

### Manual fader caution

The operator also touched level/fader during manual exploration. Unless an exact pre-manual fader value was independently recorded, do **not** attempt to reconstruct an older fader position from memory. The upcoming Mix feedback closure runner does not write Mix gain; it tests only Mute/Solo and restores those properties to their current server-confirmed baselines. Keep the audio path physically isolated.

## Exact immediate next action — existing automated runner

No more manual Mix control activity is needed now.

The current local checkout already contains the same Mix feedback runner code; the latest remote changes before this handoff were documentation-only, so an `UPDATE` is not required merely to perform this next hardware test.

Keep Companion/Focusrite Control running so the materialised Mix A state remains cached. Physically lower the Monitor control, mute/cut active speakers if possible, and keep headphones at a safe level or disconnected.

Run:

`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`

Expected safe selection logic from the current state:
- Mix A Left and Mix A Right should be the only lanes with complete gain+mute+solo tuples;
- therefore the runner should expose **4 runnable targets**: A Left Mute, A Left Solo, A Right Mute, A Right Solo;
- Mix B-F should remain `SKIP_BASELINE_UNKNOWN` with zero writes;
- do not treat a different count as automatically valid; inspect before hardware if the preflight output differs materially.

Normal launcher flow may report stale Page 2 and offer the existing `PAGE2_AUTO` path. That path is already the approved preparation workflow: it replaces only the recognised TestBench Page 2, preserves Page 1 and the existing Focusrite connection, reaudits, and performs no hardware write during preparation.

After preparation, the launcher requires explicit `MIX_FEEDBACK` and `ALL_ISOLATED` confirmations before any hardware write.

For every runnable target the runner must perform:
- exact current server baseline recheck immediately before write;
- Companion `mix_mute` or `mix_solo` action only;
- server variable confirmation at alternate state;
- independent rendered feedback confirmation;
- explicit restore action;
- server-confirmed return to exact baseline;
- restored feedback confirmation;
- restore failure => hard abort/quarantine;
- Page 2 restored/audited before completion.

Only successful targets from this automated sequence may be promoted to `HARDWARE_DYNAMIC_CLOSED`.

## Mix Mute/Solo status

- `mix_mute`: **RESEARCH_OPEN / EVAL_ONLY** — Mix A L/R baseline now complete; automated dynamic closure ready.
- `mix_solo`: **RESEARCH_OPEN / EVAL_ONLY** — Mix A L/R baseline now complete; automated dynamic closure ready.

Mix B-F remain open and are not forgotten. The parent matrix also retains open output/meter/Core rows. Completion of Mix A does not close the parent objective.

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
