# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24 18:17+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_MUTE_SOLO_BASELINE_NONACTIONABLE_RECORDED_REASSESS_REMAINING_MATRIX`
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

## Latest completed user TestBench result — Mix mute/solo actionability
User ran `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd` through the normal guarded path.

Validated before targeted hardware evaluation:
- targeted software self-check **34/34 PASS**;
- Companion/Remote Devices preflight PASS;
- exact model `Scarlett 18i20 (3rd Gen)`;
- existing `Companion Scarlett 18i20` client authorised;
- recognized stale TestBench Page 2 was refreshed using existing `PAGE2_AUTO`;
- `PAGE2_AUTO` PASS;
- existing Focusrite connection preserved; no new connection;
- final read-only capability-lab audit PASS;
- user explicitly entered `MIX_FEEDBACK` and `ALL_ISOLATED` under launcher safety conditions.

Targeted hardware/actionability outcome:
- runner reached `[3/3]` successfully;
- Playback source detected dynamically: **mixer slot 3 — Playback 1 / stereo**;
- exact server-confirmed gain/mute/solo baseline tuple available on **0/12 lanes**;
- `mix_mute` targets SKIP_BASELINE_UNKNOWN: **12**;
- `mix_solo` targets SKIP_BASELINE_UNKNOWN: **12**;
- total skipped targets: **24**;
- `HARDWARE_DYNAMIC_CLOSED`: **0**;
- feedback/hardware FAIL: **0**;
- restore quarantine: **0**;
- hardware writes: **0**;
- hardware restore required: **NO**;
- result: `MIX FEEDBACK NO-OP SAFE`.

Interpretation: this is no longer a tooling blocker. It is a valid hardware/actionability result. The current normal Companion bootstrap does not expose a complete exact Playback-strip gain/mute/solo tuple for any lane, so fail-closed `mix_mute`/`mix_solo` writes are **non-actionable in the current bootstrap state**.

Do **not** rerun this campaign unchanged. Reopen it only if a future normal Companion session naturally exposes the missing exact tuple for an individual lane.

## Parent matrix update
`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md` now records:
- `mix_mute` => EVAL_ONLY_NONACTIONABLE in current bootstrap state;
- `mix_solo` => EVAL_ONLY_NONACTIONABLE in current bootstrap state;
- runtime Playback slot 3 was detected, but runtime decides and is never hardcoded as protocol truth;
- 0/12 eligible lanes, 24 baseline skips, zero write, zero FAIL.

The parent hardware objective remains open because other matrix rows remain partial/open, but this Mix mute/solo sub-question is closed as an actionability result.

## Retained parent evidence
- 31 public feedback definitions / 829 instances.
- Static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL.
- Dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL.
- Meter closure 14/46; inputs 8/8, outputs 4/26, mixes 2/12, mismatch 0; hardware restore YES; Page 2 restore YES.
- Mix A L/R meter movement remains closed.
- Mix B-F meter write-driven closure remains nonactionable because exact Playback-strip baselines are unavailable.
- Targeted Core feedback: 18/18 SKIP_BASELINE_UNKNOWN, zero writes/FAIL/restore quarantine; nonactionable in current bootstrap state.

## Remaining matrix guidance
Do not choose the next campaign by score.

Potentially open safe-actionable rows must first have a genuine current exact baseline. `monitor_alt` / `monitor_alt_enable` remain candidates only if the existing Companion session already exposes their exact server-confirmed baseline. Do not assume one and do not create a write merely to discover it.

Remaining `output_meter` gaps should use passive/natural signal evidence or already-proven exact-restore routing only. Do not invent new routing changes merely to increase dynamic counts. Output/mixer-slot families already withheld by the evidence profile remain blocked.

If the current evidence shows no remaining row with an exact reversible baseline, record that state rather than constructing another TestBench campaign.

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
2. Do **not** rerun Mix mute/solo, Core, FULL, SAFE, broad meter routing or direct Mix probes.
3. Re-read the parent feedback matrix and inspect current existing evidence for the remaining open rows.
4. Select another hardware test only if a row is both still open and already has an exact server-confirmed reversible baseline under the current evidence profile.
5. Prefer no-write/passive evidence for remaining meter/status gaps.
6. If no such safe actionable row exists, record that result and reassess parent-objective completion/classification rather than creating new tooling.

After every material user/software/hardware result or blocker, update both root `HANDOFF` and this file. Do not claim pending work passed.
