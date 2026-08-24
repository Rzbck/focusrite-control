# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 18:33+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_MUTE_SOLO_READBACK_MATERIALISATION_RESEARCH_OPEN`
Canonical production candidate in Companion: exact audited **0.1.16**
Last fully validated broad software checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840` — 192/192 tests PASS + package build PASS, no hardware validation.

## MANDATORY STARTUP FRESHNESS GATE
When the user says `HANDOFF`, do not resume from old chat, uploaded handoffs, an embedded SHA, or `main` by default. Inspect live remote branch movement repo-wide, not only `main`; identify the newest MATERIAL movements by commit time; choose the objective branch using BOTH recency and relevance; resolve its current remote HEAD; inspect newer commits/diff; read root `HANDOFF`, `AI_PROJECT_RULES.md`, and this file from that live ref; reconcile any newer completed user/hardware result and newer completed physical/human result; only then choose the next action.

A default-branch search can miss newer branch work. A document timestamp or embedded SHA is a checkpoint only.

## OPERATOR WORKFLOW — PROJECT LAUNCHERS FIRST
- `UPDATE.bat` for normal branch update/sync.
- `UPDATE_AND_RUN.bat` for update + normal validation.
- `RUN.bat` when already current and a normal software gate is needed.
- Exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Prefer these launchers over raw Git, PowerShell, Node, or one-off shell commands.
- Manual shell/Git/PowerShell is last resort only when the launcher itself is blocked/broken or cannot expose the needed diagnostic; use the smallest recovery and return immediately to launchers.
- Never build a second helper/workflow for behavior already implemented in the repository.
- Worktree behavior is conservative: if a different selected branch is already owned by another linked worktree, report its owner and stop; do not auto-jump directories.

## Research correction — Mix mute/solo
The previous `EVAL_ONLY_NONACTIONABLE / closed` conclusion for `mix_mute` and `mix_solo` was too strong and is retracted.

### What the latest completed run proved
- targeted self-check **34/34 PASS**;
- exact Scarlett 18i20 (3rd Gen), module 0.1.16, canonical authorised Companion client: PASS;
- PAGE2_AUTO / final capability-lab audit: PASS;
- user confirmed `MIX_FEEDBACK` / `ALL_ISOLATED`;
- Playback detected dynamically as slot 3 / Playback 1 / stereo;
- complete gain+mute+solo baseline tuple available on **0/12 lanes in that session**;
- `mix_mute`: 12 SKIP_BASELINE_UNKNOWN;
- `mix_solo`: 12 SKIP_BASELINE_UNKNOWN;
- hardware writes 0; FAIL 0; restore quarantine 0.

This is a valid observation of the module's current server-state cache. It is NOT proof that Mix Mute/Solo are absent, unsupported or inherently non-actionable.

### Official Focusrite evidence — product behaviour confirmed
Web verification on 2026-08-24 found:
- Focusrite Control Scarlett 3rd Gen User Guide: each Custom Mix input channel has an `M` mute button and an `S` Solo button; Solo does not alter other signal routings or the DAW recording path.
- Focusrite Control Tutorial: Setting Custom Mixes explicitly applies to Scarlett 18i20 3rd Gen and demonstrates muting one input in a Custom Mix and soloing one input so it is the only source going to that output.
- Scarlett 18i20 3rd Gen specifications: 12 mono Custom Mixes and maximum 24 mono custom-mix inputs.

### This project's 18i20 schema evidence — control items confirmed
`src/device-parser.js` parses every mix strip as four distinct schema controls: `gain`, `pan`, `mute`, `solo`. The project schema records 12 mono lanes (Mix A-F L/R), 24 strips per lane.

`src/actions.js` writes `mix_mute` to the schema-provided mute item and `mix_solo` to the schema-provided solo item. These are explicit Control Server boolean items in the implemented transport; they are not invented gain aliases.

### Independent Control Server research — corroboration only
Antonio-Radu Varga's Focusrite Midi Control independently reverse-engineered FocusriteControlServer and its `MixInput` model parses `gain`, `pan`, `mute`, `solo` XML items. That project targets older Scarlett hardware and is research corroboration, not 18i20 Gen 3 hardware validation.

### Low-level USB research — do not conflate layers
Linux Scarlett2 research presents the 18i20 Gen 3 internal mixer mainly as a gain matrix. This does not disprove Control Server mute/solo items. The Control Server is a higher-level abstraction. Do not claim a TCP/XML item maps to a particular USB write unless physically demonstrated.

### Why baseline values can be missing
`src/focusrite-client.js` clears state at device arrival, seeds only server values explicitly present in the arrival payload, subscribes once, and then updates state from later `<set>` messages. `getValue()` reads only that observed cache. Missing values stay unknown by design; there is no per-item query path in the module.

Therefore `BASELINE_UNKNOWN` means `not observed in this client session`, not `schema control absent` or `unsupported`.

This is also supported by our own earlier read-only evidence: Mix A Left and Mix A Right had gain/mute/solo all KNOWN / exact=YES on Playback slot 3 in a prior normal Companion observation, whereas the later targeted run saw 0/12 complete tuples. The readback/materialisation state is therefore inconsistent across sessions and remains a real research question.

## Current classification
- `mix_mute`: **RESEARCH_OPEN / EVAL_ONLY** — official function confirmed; schema item confirmed; dynamic closure incomplete; actionability unresolved because server-state readback is session-dependent.
- `mix_solo`: **RESEARCH_OPEN / EVAL_ONLY** — same.
- Do not rerun the existing all-three-values tuple campaign unchanged.
- Do not move on as if these rows were closed.

## Next technical objective
Research state materialisation through the EXISTING authorised Companion client, preferably read-only:
1. distinguish schema-present/value-missing from value supplied in device-arrival and value supplied later by subscription `<set>`;
2. explain why Mix A L/R mute/solo were observable in one normal session but absent in the later session;
3. do not create another direct TCP client by default and do not reuse/copy the Companion private client key;
4. after the readback mechanism is understood, design the smallest property-specific reversible test. For `mix_mute`, do not require unrelated state unless it is genuinely necessary for safe restoration. For `mix_solo`, account for its wider mix semantics and observe related state for collateral changes.

This is a design/research direction only. No new write path has been validated yet.

## Retained parent evidence
- 31 public feedback definitions / 829 instances.
- Static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Meter closure 14/46; inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0; hardware restore YES; Page 2 restore YES.
- Mix A L/R meter movement remains closed.
- Targeted Core feedback 18/18 SKIP_BASELINE_UNKNOWN, zero writes/FAIL/restore quarantine. Treat this as a bootstrap/readback result, not proof the corresponding documented/schema functions are absent.

## Remote Devices / client isolation
No extra direct clients by default.
Never reuse/copy the Companion private client key into another process.
Reuse the existing approved `Companion Scarlett 18i20` client for normal validation. Direct Control Server research clients remain research-only and must not run in parallel with SAFE/FULL/write-capable TestBench campaigns.

## Permanent safety
- Hardware support claim only Scarlett 18i20 (3rd Gen).
- Monitor gain 1677 read-only.
- No input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, or physical Monitor level write.
- Dynamic Control Server port and device ID.
- Writes only after this module's own Remote Devices authorization is confirmed.
- Feedback/state from server-confirmed state only.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands, or writes to meter/status/read-only items.
- No writes to explicit UNKNOWN output availability.
- No Focusrite software/firmware/routing changes outside explicitly agreed tests.
- No TestBench/debug package install over exact audited 0.1.16.

## Exact immediate next step
1. Resolve live branch freshness first.
2. Do not ask the user to rerun the unchanged Mix campaign.
3. Continue source/internet/protocol research into Mix mute/solo state materialisation via the existing authorised Companion client.
4. Do not create new hardware writes merely to manufacture a baseline.
5. Keep `mix_mute` / `mix_solo` open in the parent matrix until the readback discrepancy is explained and a property-specific exact-restore test is justified.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
