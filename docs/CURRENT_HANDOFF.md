# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 20:24+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `READBACK_PROVENANCE_0_1_17_SOFTWARE_VALIDATED_PACKAGE_BUILT_NOT_LOADED`
Canonical production candidate currently in Companion: exact audited **0.1.16**
Readback-provenance research build: **0.1.17 — SOFTWARE VALIDATED + PACKAGED, NOT YET LOADED IN COMPANION**
Last fully validated broad software checkpoint for this research build: user-host run at source HEAD `515e9cf2f3e9` — 216/216 tests PASS + package build PASS, no hardware validation.

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, identify the newest MATERIAL movements by commit time, choose the objective branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref, reconcile any newer completed user/hardware result, then choose the next action.

A document timestamp or embedded SHA is a checkpoint only.

## MANDATORY EVIDENCE / INFERENCE GATE

Before classifying a control as unsupported, non-actionable, closed, fake, absent or impossible because a value is missing, read the live versions of:

- `docs/PROTOCOL.md`;
- `docs/STATE_CONTRACT.md`;
- `docs/COLD_START_READBACK.md`;
- relevant current parser/action/feedback/client code;
- current hardware matrix/evidence.

Keep these levels separate:

1. **OFFICIAL PRODUCT BEHAVIOUR** — Focusrite documentation for the exact model/generation;
2. **SCHEMA_PRESENT** — the Control Server declares an item/control;
3. **SESSION_STATE_OBSERVED** — the current client actually received its value;
4. **IMPLEMENTED** — module code exposes/uses it;
5. **HARDWARE_WRITE_CONFIRMED** — physical write path tested;
6. **HARDWARE_DYNAMIC_CLOSED** — action + server-confirmed feedback + exact restore physically exercised.

`UNKNOWN`, blank, missing cache state, `BASELINE_UNKNOWN` or `SKIP_BASELINE_UNKNOWN` means only **not observed in this client session** unless stronger evidence proves more. It is not proof of schema absence, `false`, unsupported hardware or permanent non-actionability.

If older session/hardware evidence contradicts current cache coverage, keep the question **READBACK/MATERIALISATION RESEARCH OPEN** until reconciled.

A reversible hardware test must require only state genuinely necessary for exact restoration of the property being changed. Do not impose unrelated prerequisite tuples merely because an older harness grouped them.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST

- `UPDATE.bat` for normal branch update/sync.
- `UPDATE_AND_RUN.bat` for update + normal validation.
- `RUN.bat` when already current and a normal software gate is needed.
- Exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Prefer these over raw Git, PowerShell, Node or one-off shell commands.
- Manual shell/Git/PowerShell is last resort only when the launcher itself is broken or cannot expose the needed diagnostic.
- Never build a second helper/workflow for behavior already implemented in the repository.
- Linked-worktree behavior is conservative: if another worktree owns a different selected branch, report it and stop; do not attach the same branch twice.

## Remote Devices authorization — mandatory before any write

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Always reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- If the existing module client is not approved, classify the run as `AUTHORIZATION/PREFLIGHT BLOCKED`; this is not a hardware-control failure.
- See `docs/REMOTE_DEVICES_AUTHORIZATION.md` before any authorization recovery or direct Control Server research.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.
- A direct research client may exist only for an explicit research reason, with its own Remote Devices identity and user-visible warning; never run it in parallel with SAFE/FULL/write-capable TestBench work.

## Latest updater recovery — COMPLETED

The stale local checkout at `9c12a4e` predated updater fix `efbd738bf0d9d15583012377b3fc4e1825e9cb7b`. The old updater printed `HEAD local: UNKNOWN`, `HEAD distant: UNKNOWN`, auto-jumped to the same logical worktree and then blocked after stashing `UPDATE.bat`.

One last-resort bootstrap restored remote `UPDATE.bat` to index/worktree and fast-forwarded the already-fetched branch. Normal launcher-first workflow is restored. Safety stashes remain preserved; do not pop them merely for this recovery. No hardware, Companion Page 2, routing, Focusrite software or firmware change occurred.

The updater header still prints `HEAD local: UNKNOWN` / `HEAD distant: UNKNOWN`, while its canonical post-sync block resolves the real branch/HEAD correctly. This is currently a non-blocking diagnostic inconsistency.

## Latest local software gate — COMPLETE PASS

User ran `UPDATE_AND_RUN.bat` and synchronized to canonical source HEAD `515e9cf2f3e9`.

Observed on the user Windows project host:

- Node portable 22.23.2;
- Yarn 4.17.0;
- immutable dependencies: **PASS**;
- Prettier: **PASS**;
- ESLint: **PASS**;
- source manifest: **PASS**;
- Node tests: **216/216 PASS, 0 FAIL**;
- Companion package build: **PASS**;
- package: `focusrite-scarlett-18i20-0.1.17.tgz`;
- package installation/activation in Companion: **NOT DONE by the launcher**;
- hardware writes: **0**;
- Companion hardware/control writes: **0**.

This closes the software-gate blocker for the readback-provenance research build. It does **not** close any hardware feedback row or the parent hardware-validation objective.

## Research correction — Mix mute/solo

The previous `EVAL_ONLY_NONACTIONABLE / closed` conclusion for `mix_mute` and `mix_solo` was too strong and is retracted.

### Latest completed targeted hardware/session run actually proved

- software self-check **34/34 PASS**;
- exact Scarlett 18i20 (3rd Gen), module 0.1.16, canonical authorised Companion client: PASS;
- PAGE2_AUTO / capability-lab audit: PASS;
- user confirmed `MIX_FEEDBACK` / `ALL_ISOLATED`;
- Playback detected dynamically as slot 3 / Playback 1 / stereo;
- complete `gain + mute + solo` tuple available on **0/12 lanes in that session**;
- 12 Mute + 12 Solo targets `SKIP_BASELINE_UNKNOWN`;
- hardware writes 0; FAIL 0; restore quarantine 0.

This is a session/cache observation, not a capability verdict.

### Evidence that keeps the question open

- Official Scarlett 18i20 3rd Gen documentation confirms Custom Mix channel Mute/Solo behavior and documents 12 mono Custom Mixes / up to 24 mono custom-mix inputs.
- Current 18i20 schema/parser exposes distinct `gain`, `pan`, `mute`, `solo` IDs for mixer strips.
- `src/actions.js` writes `mix_mute` and `mix_solo` to those explicit schema IDs; they are not invented gain aliases.
- Independent older FocusriteControlServer research corroborates separate Mix `gain`, `pan`, `mute`, `solo` items and schema/state-stream separation, but remains research-only for this hardware.
- Earlier normal Companion evidence saw Mix A Left and Mix A Right Playback-strip gain/mute/solo all KNOWN/exact, while the later targeted run saw 0/12 complete tuples.

Current classification:

- `mix_mute`: **RESEARCH_OPEN / EVAL_ONLY**;
- `mix_solo`: **RESEARCH_OPEN / EVAL_ONLY**.

Do not rerun the unchanged full-tuple campaign and do not call these rows closed.

## Current state/readback model

`src/device-parser.js` registers schema IDs separately from values. `device.initialState` receives only values explicitly present as `value=` in the arrival payload.

`src/focusrite-client.js` clears its state cache at device arrival, seeds only explicitly supplied values, then updates state from later `<set>` messages. `getValue()` returns only this observed cache. There is no production per-item read/query command.

Therefore cache absence != capability absence.

## Readback-provenance implementation — SOFTWARE VALIDATED, NOT LOADED

The blocker work reuses existing infrastructure only; no second client, new Page 2 workflow or new launcher was created.

Implemented and software-tested:

- `src/focusrite-client.js`
  - tracks per-item observation provenance separately from state values;
  - records `arrival`, `set`, `arrival+set`, or never-observed;
  - `getValue()` semantics unchanged;
  - authorization/write behavior unchanged.
- `src/variables.js`
  - exposes Mix gain/mute/solo provenance only when existing `Expose all mixer slot variables` diagnostic option is enabled.
- `testbench/MeterMixPlaybackBaselineReadOnlyProbe.js`
  - existing read-only probe extended;
  - no Companion button press;
  - no Focusrite write;
  - reports schema presence, known state and provenance classes only;
  - sanitized report stores no raw values/private item IDs/identifiers.
- regression coverage:
  - `test/state-provenance.test.js`;
  - `test/meter-mix-playback-baseline-readonly.test.js`.

Research build version:

- `package.json` = **0.1.17**;
- package successfully built as `focusrite-scarlett-18i20-0.1.17.tgz`;
- intentionally distinct from audited 0.1.16;
- **not loaded in Companion yet**.

### Validation status

- source implementation: **IMPLEMENTED**;
- Prettier: **PASS**;
- ESLint: **PASS**;
- source manifest: **PASS**;
- full Node tests: **216/216 PASS**;
- package build: **PASS**;
- Companion import/activation of 0.1.17: **NOT DONE**;
- provenance behavior against the real 18i20 session: **NOT YET OBSERVED**;
- hardware writes from this work: **0**;
- no new hardware capability is claimed from this instrumentation.

## Exact immediate next action

The software gate is complete. Do **not** rerun `UPDATE_AND_RUN.bat` merely for confidence and do not run Mix hardware closure yet.

Next, using Companion UI:

1. `Modules > Import module package > focusrite-scarlett-18i20-0.1.17.tgz`;
2. `Connections >` existing Focusrite connection `> Module Version > 0.1.17`;
3. keep/reuse the same existing Companion Focusrite connection and its existing Remote Devices identity;
4. rerun the normal read-only preflight;
5. then run only `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`;
6. during that probe navigate only Mix A-F; do not change fader/mute/solo/routing state;
7. use provenance evidence to explain earlier Mix A L/R KNOWN versus later 0/12 complete tuples;
8. only after that evidence is understood redesign Mute and Solo closure independently, with only genuinely required exact-restoration state.

The provenance probe is read-only and must not be turned into a write path merely to manufacture an unknown baseline.

## Retained parent evidence

- 31 public feedback definitions / 829 instances.
- Static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0.
- Mix A L/R meter movement remains closed.
- Targeted Core feedback: 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes/FAIL/restore quarantine; this remains a bootstrap/readback observation, not proof the documented/schema controls are absent.

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