# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 19:17+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_MUTE_SOLO_READBACK_PROVENANCE_IMPLEMENTATION_NEXT`
Canonical production candidate in Companion: exact audited **0.1.16**
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
- Linked-worktree behavior is conservative: if another worktree owns the selected branch, report it and stop; do not attach the same branch twice.

## Research correction — Mix mute/solo
The previous `EVAL_ONLY_NONACTIONABLE / closed` conclusion for `mix_mute` and `mix_solo` was too strong and is retracted.

### Latest completed targeted run actually proved
- software self-check **34/34 PASS**;
- exact Scarlett 18i20 (3rd Gen), module 0.1.16, canonical authorised Companion client: PASS;
- PAGE2_AUTO / capability-lab audit: PASS;
- user confirmed `MIX_FEEDBACK` / `ALL_ISOLATED`;
- Playback detected dynamically as slot 3 / Playback 1 / stereo;
- complete `gain + mute + solo` tuple available on **0/12 lanes in that session**;
- 12 Mute + 12 Solo targets `SKIP_BASELINE_UNKNOWN`;
- hardware writes 0; FAIL 0; restore quarantine 0.

This is a session/cache observation, not a capability verdict.

### Official Focusrite evidence
Official Scarlett 18i20 3rd Gen documentation confirms Custom Mix channel Mute/Solo behavior. Official specs list 12 mono Custom Mixes and up to 24 mono custom-mix inputs. Canonical Focusrite source URLs are recorded in `docs/PROTOCOL.md` and `docs/COLD_START_READBACK.md`.

### Current 18i20 schema/implementation evidence
- current schema/parser exposes 12 mono lanes, 24 strips/lane, with distinct `gain`, `pan`, `mute`, `solo` IDs;
- `src/actions.js` writes `mix_mute` and `mix_solo` to their explicit schema-provided boolean IDs;
- they are not invented gain aliases.

### Independent protocol corroboration
Historical FocusriteControlServer research on older Scarlett hardware also models separate Mix `gain`, `pan`, `mute`, `solo` items and shows schema declaration separated from a later partial `<set>` state stream. Corroboration only, not 18i20 Gen3 hardware proof.

### Readback contradiction
Earlier normal Companion evidence saw Mix A Left and Mix A Right Playback-strip gain/mute/solo all KNOWN/exact. The later targeted run saw 0/12 complete tuples. Therefore state materialisation is session-dependent or otherwise conditional and remains unresolved.

Current classification:
- `mix_mute`: **RESEARCH_OPEN / EVAL_ONLY**;
- `mix_solo`: **RESEARCH_OPEN / EVAL_ONLY**.

Do not rerun the unchanged full-tuple campaign and do not call these rows closed.

## Current code mechanism behind UNKNOWN
`src/device-parser.js` registers schema IDs separately from values. `device.initialState` receives only values explicitly present as `value=` in the arrival payload.

`src/focusrite-client.js` clears its state cache at device arrival, seeds only those explicitly supplied values, then updates state from later `<set>` messages. `getValue()` returns only this observed cache. There is currently no production per-item read/query command.

Therefore cache absence != capability absence.

## Exact next technical chantier
Do **not** create a new campaign, new TCP client, new Page2 workflow or new launcher.

Reuse:
- `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`;
- `testbench/MeterMixPlaybackBaselineReadOnlyProbe.js`.

Current probe strengths:
- read-only;
- uses the existing authorised Companion connection;
- dynamically detects Playback;
- no Companion button press;
- no hardware write;
- sanitized local report.

Current limitation:
- it sees only KNOWN/UNKNOWN variable values and cannot tell whether a value came from `device-arrival` or a later `<set>`.

Next implementation:
1. minimally track per-item observation provenance in the existing `FocusriteClient` without changing state/write/feedback semantics;
2. expose Mix-strip provenance only under the already existing `Expose all mixer slot variables` diagnostic surface used by TestBench;
3. extend the existing read-only probe/report to distinguish schema-present, arrival-observed, later-set-observed, arrival+set and never-observed;
4. report only sanitized provenance booleans/classes — no raw values, item IDs, serial, hostname, endpoint, client identity, raw XML or user paths;
5. regression-lock zero hardware-write path and no second client;
6. run normal software validation;
7. then user runs only the existing read-only launcher and navigates Mix A-F;
8. explain the earlier Mix A L/R KNOWN versus later 0/12 discrepancy;
9. only afterward redesign Mix Mute/Solo property-specific closure.

Property-specific design direction, not yet validated:
- Mute eligibility should require the server-confirmed Mute state needed for restoration; Gain/Solo are not automatically prerequisites unless evidence proves coupling.
- Solo must get its own semantics/collateral-state analysis and exact restore rule.

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
- No TestBench/debug package install over exact audited 0.1.16.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
