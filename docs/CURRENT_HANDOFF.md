# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 19:52+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `READBACK_PROVENANCE_0_1_17_FORMAT_FIXED_PENDING_LOCAL_GATE_RERUN`
Canonical production candidate currently in Companion: exact audited **0.1.16**
Readback-provenance research build in source: **0.1.17 — NOT YET LOCALLY VALIDATED OR LOADED**
Last fully validated broad software checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840` — 192/192 tests PASS + package build PASS, no hardware validation.

## MANDATORY STARTUP FRESHNESS GATE

When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, identify the newest MATERIAL movements by commit time, choose the objective branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref, reconcile newer physical/user evidence, then choose the next action.

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

## Latest updater recovery — COMPLETED

The user was locally at `9c12a4e`, immediately before updater fix `efbd738bf0d9d15583012377b3fc4e1825e9cb7b`.

The stale updater showed `HEAD local: UNKNOWN`, `HEAD distant: UNKNOWN`, incorrectly auto-jumped to the same logical worktree, stashed `UPDATE.bat`, then still reported it dirty.

Because the launcher itself was the blocker, one minimal manual bootstrap was used. Final completed recovery:

- `git restore --source=origin/testbench/meter-routing-exact-restore --staged --worktree -- UPDATE.bat`;
- `git merge --ff-only origin/testbench/meter-routing-exact-restore`;
- local checkout fast-forwarded successfully from `9c12a4e` to `edb0667`;
- no forced reset;
- safety stashes remain preserved and must not be popped merely for this recovery;
- Focusrite hardware writes: **0**;
- Companion Page 2 mutations: **0**;
- Focusrite software/firmware/routing changes: **0**.

Normal launcher-first workflow is restored. Do not repeat the manual bootstrap unless a future launcher failure independently proves it necessary.

## Latest local software gate — PRETTIER ONLY FAILURE

User then ran `RUN.bat` from canonical context:

- branch: `testbench/meter-routing-exact-restore`;
- HEAD: `edb0667c2294`;
- Node portable: 22.23.2;
- Yarn: 4.17.0;
- immutable dependency install: **PASS**;
- repository Prettier actually resolved to **3.9.6**;
- formatting check: **FAIL on 11 files**;
- ESLint: **NOT RUN**;
- manifest: **NOT RUN**;
- Node tests: **NOT RUN**;
- Companion package build: **NOT RUN**;
- hardware/Companion writes: **0**.

The complete user-provided Prettier diagnostic showed formatting-only changes: wrapping, Markdown blank lines and Markdown table alignment. No semantic code delta was indicated by the formatter output.

Source-side response:

- apply exactly the formatter output reported by the user's installed Prettier 3.9.6;
- no logic change;
- no new test/campaign/helper;
- files covered: `docs/CURRENT_HANDOFF.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, the five reported test files, and the four reported TestBench JS files;
- software gate remains **PENDING** until the user's local `RUN.bat`/`UPDATE_AND_RUN.bat` proves format + lint + manifest + tests + package build.

Do not call 0.1.17 validated yet.

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
- Current 18i20 schema/parser exposes distinct `gain`, `pan`, `mute`, `solo` IDs for the mixer strips.
- `src/actions.js` writes `mix_mute` and `mix_solo` to those explicit schema IDs; they are not invented gain aliases.
- Independent older FocusriteControlServer research corroborates separate Mix `gain`, `pan`, `mute`, `solo` items and a schema/state-stream separation, but remains research-only for this hardware.
- Earlier normal Companion evidence saw Mix A Left and Mix A Right Playback-strip gain/mute/solo all KNOWN/exact, while the later targeted run saw 0/12 complete tuples.

Current classification:

- `mix_mute`: **RESEARCH_OPEN / EVAL_ONLY**;
- `mix_solo`: **RESEARCH_OPEN / EVAL_ONLY**.

Do not rerun the unchanged full-tuple campaign and do not call these rows closed.

## Current state/readback model

`src/device-parser.js` registers schema IDs separately from values. `device.initialState` receives only values explicitly present as `value=` in the arrival payload.

`src/focusrite-client.js` clears its state cache at device arrival, seeds only those explicitly supplied values, then updates state from later `<set>` messages. `getValue()` returns only this observed cache. There is no production per-item read/query command.

Therefore cache absence != capability absence.

## Readback-provenance implementation — SOURCE COMPLETE, VALIDATION PENDING

The direct blocker work reuses existing infrastructure only; no second client, new Page2 workflow or new launcher was created.

Implemented:

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
- intentionally distinct from audited 0.1.16;
- not loaded in Companion yet.

### Validation status — DO NOT OVERCLAIM

- source implementation: **IMPLEMENTED**;
- formatter corrections: **SOURCE-SIDE APPLIED, LOCAL RECHECK PENDING**;
- Prettier/ESLint/source-manifest/full Node tests/package build: **PENDING**;
- Companion import/activation of 0.1.17: **NOT DONE**;
- hardware writes from this work: **0**;
- no new hardware capability is claimed from this instrumentation.

## Exact immediate next action

Use only the normal project launcher now that the stale-updater bootstrap is resolved:

`UPDATE_AND_RUN.bat`

Target branch: `testbench/meter-routing-exact-restore`.

Purpose:

- receive the source-side Prettier corrections;
- run immutable dependency check;
- verify Prettier;
- run ESLint;
- validate source manifest;
- run all Node tests, including provenance regressions;
- build the 0.1.17 Companion package.

This launcher does **not** install/activate the package in Companion and performs no Focusrite hardware write.

Do not run Mix hardware closure or the read-only provenance probe before this gate is green.

If the gate PASSes, next step is to import/select the distinct 0.1.17 module build in Companion, rerun normal read-only preflight, then run only:

`testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`

During that probe, navigate only Mix A-F; do not change fader/mute/solo/routing state.

Use the provenance result to explain why earlier Mix A L/R were KNOWN while the later campaign had 0/12 complete tuples. Only after that evidence is understood may Mix Mute/Solo closure be redesigned property-by-property.

No write is permitted merely to manufacture an unknown baseline.

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
- No extra direct clients by default; never reuse/copy Companion private client key.
- No Focusrite software/firmware/routing changes outside explicitly agreed tests.
- Keep audited 0.1.16 distinguishable from research build 0.1.17.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
