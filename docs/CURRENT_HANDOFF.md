# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 11:38+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_UNKNOWN_TOPOLOGY_ROUTING_AND_DIRECT_CLOSURE_FIX_PRETTIER_APPLIED_FULL_GATE_PENDING`
Canonical production candidate: audited **0.1.16**
Research 0.1.17: software validated, packaged, real hardware exercised.
Research 0.1.18 module/package checkpoint: **SOFTWARE VALIDATED / PACKAGED / LOADED ON EXISTING AUTHORISED CONNECTION** at `d6df45c59ab825e1ebccae90d98212b561449feb`.
Last fully green TestBench checkpoint: `e06b7f38542fce61b3c7679b3f00e82f57aae1a2` with **239/239 tests + package build PASS**.
Current changes after that checkpoint: **TESTBENCH/TESTS/DOCS ONLY / SOURCE_IMPLEMENTED / PRETTIER FIX APPLIED / FULL USER-HOST SOFTWARE-GATE PENDING / HARDWARE PENDING**.

## MANDATORY STARTUP FRESHNESS GATE — REPO-WIDE RECENCY FIRST

When the user says `HANDOFF`, inspect remote branch movement across the repository, not only `main`. Identify the newest MATERIAL movements by commit time, choose the objective-owning branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, then read live root `HANDOFF`, this file, `AI_PROJECT_RULES.md`, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence. Reconcile any newer completed user/hardware result before choosing work.

A document timestamp or embedded SHA is a checkpoint only. It never replaces live Git verification.

Keep evidence levels separate: OFFICIAL PRODUCT BEHAVIOUR / SCHEMA_PRESENT / SESSION_STATE_OBSERVED / IMPLEMENTED / HARDWARE_WRITE_CONFIRMED / HARDWARE_DYNAMIC_CLOSED. `UNKNOWN`, `BASELINE_UNKNOWN`, sparse cache or `neverObserved` is never unsupported by itself.

## PROJECT LAUNCHERS FIRST

- `UPDATE.bat` for normal sync.
- `UPDATE_AND_RUN.bat` for update + normal software gate.
- `RUN.bat` when already current.
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Manual Git/PowerShell/Node is last resort only when a normal launcher is itself blocked or cannot expose the required diagnostic.
- Do NOT make the user type ad-hoc PowerShell, raw Git commands, Node commands when the normal launcher workflow can do the work.

## Objective continuity

Closing a sub-question never closes its parent validation objective. Parent objective remains explicit hardware feedback closure while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised or otherwise open rows remain. Publication is not the current objective.

Tooling/documentation work may interrupt hardware only for a direct blocker. Once that direct blocker is removed, return to the parent hardware objective. Before changing objectives, account for remaining open matrix rows; objective change is forbidden while relevant open rows remain unless the user explicitly changes the objective.

## Remote Devices authorization — mandatory before any write

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- Missing approval is `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware-control failure.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.
- See `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

## Last fully green software gate retained

User-host `UPDATE_AND_RUN.bat` at checkpoint `e06b7f38542fce61b3c7679b3f00e82f57aae1a2` completed dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, Node tests **239/239 PASS / 0 FAIL**, and package build PASS (`focusrite-scarlett-18i20-0.1.18.tgz`). No hardware write occurred during that gate.

That checkpoint is still the last complete software validation. The latest TestBench-only source changes below are newer and therefore require one fresh full gate before any further hardware write.

## Latest user-host gate attempt — Prettier blocker fixed / full gate pending

The user synced the branch exactly to `a0fb3443a5eb9bcc76fea4aef6b9fc853dcbef05` and ran `UPDATE_AND_RUN.bat`.

Observed result:

- portable Node **22.23.2** and Yarn **4.17.0** started correctly;
- dependencies PASS;
- Prettier **3.9.6** failed on exactly two files:
  - `testbench/MixFeedbackClosureRunner.js`;
  - `testbench/MixOutputRoutingMaterialize.js`;
- the built-in diagnostic produced the exact expected Prettier diff and explicitly modified no source;
- the gate stopped before ESLint, source manifest, Node tests and package build;
- no hardware write occurred and the launcher performed no Git promotion.

Exact format-only fixes were applied to the remote branch:

- `MixFeedbackClosureRunner.js`: commit `d75ed24a1ec1d285daeeb7dc160b9fb42b699533`, blob `a0dfd07de8f9de5e2efcf33d994e986fcf6d80a3`;
- `MixOutputRoutingMaterialize.js`: commit `fd090d18e961adb6e3b7231765c523c34ab02dd6`, blob `3784866a353a0d3a4decce7325403f338687abb0`.

GitHub compare from `a0fb344...` through those two fixes shows only the two expected TestBench files changed: 9 lines in the Mix runner and 4 lines in the output-routing materializer, all formatting. Therefore the source fix is applied, but **current Prettier PASS is not yet proven** until the user reruns the launcher. ESLint, source manifest, tests and package build are also still pending.

## Latest completed hardware attempt — two-path NO-OP SAFE / zero write

`RUN_MIX_FEEDBACK_CLOSURE.cmd` was run after the green checkpoint with the existing 0.1.18 authorised Companion connection.

Passed before hardware stage:

- targeted self-check **72/72 PASS**;
- exact Scarlett 18i20 (3rd Gen) model PASS;
- existing Companion Focusrite connection PASS;
- Remote Devices authorization PASS;
- Page 2 exact/current, 768 controls;
- user confirmations `MIX_FEEDBACK` and `ALL_ISOLATED`.

New SESSION_STATE_OBSERVED Playback evidence:

- slot 3 :: `Playback 1` :: topology **unknown**;
- slot 4 :: `Playback 2` :: topology **unknown**;
- slot 5 :: `Playback 3` :: stereo;
- slot 7 :: `Playback 5` :: stereo;
- slot 9 :: `Playback 7` :: stereo;
- slot 11 :: `Playback 9` :: stereo;
- slot 13 :: `Playback 11` :: stereo;
- slot 15 :: `Playback 13` :: stereo;
- slot 17 :: `Playback 15` :: stereo.

Path A topology bootstrap stopped safely: Playback 1/2 source/name was known but the original `mixer_slot_stereo` values were not observed, so an exact topology restore could not be guaranteed. Hardware writes: **0**.

Path B output-pair routing fallback also stopped safely before write because its target selection still reused Path A's `chooseTopologyBootstrapPlayback()` and therefore unnecessarily required known Playback topology. Hardware writes: **0**.

Final result: `MATERIALISATION NO-OP SAFE APRES DEUX CHEMINS`; no mixer topology, output routing, Mute/Solo or other hardware write occurred and no restore was required.

## Correct inference from latest run

Do not call Playback 1/2 mono, stereo, unsupported or unwritable. The server-confirmed source/name exists at slots 3/4; only the current `mixer_slot_stereo` values are missing from this client session.

Path A is correct to stop because it changes topology and needs the original topology to restore. Path B changes only output-pair source state and already has a separate exact-output-restore contract. Requiring mixer topology for Path B was an unrelated tuple prerequisite and is now removed.

## Source fix 1 — output routing fallback no longer depends on mixer topology

`testbench/MixOutputRoutingMaterialize.js` now has its own source/name-only Playback coverage selector:

- requires canonical `Playback N` names and non-zero server-confirmed source IDs;
- duplicate/ambiguous Playback channel identities fail closed;
- previous source/name target may be reused when still valid;
- otherwise Playback 1/2 is the campaign anchor when both exist;
- otherwise exactly one complete canonical Playback pair may be used;
- `stereoKnown` is diagnostic only for this path and may be false/unknown;
- the helper is separate from `chooseTopologyBootstrapPlayback()`.

All output safety remains unchanged:

- Monitor Outputs 1-2 excluded automatically;
- Line Outputs 3-4 preferred only when both members are writable and their original source values are exact;
- explicit UNKNOWN/UNAVAILABLE output availability receives no write;
- one temporary `output_pair_source` action to Mix A only;
- server-confirmed route required;
- existing V8 exact left/right source restore always runs after an attempted route;
- restore not confirmed = HARD ABORT;
- no mixer-slot source, Mix gain/Mute/Solo during materialisation, direct `output_source`, raw, Monitor gain or direct TCP write.

## Source fix 2 — direct exact Mix Mute/Solo may proceed with topology unknown

`testbench/MixFeedbackClosureRunner.js` previously also required `stereoKnown=true` merely to select a Playback slot with an exact Mix baseline. That would have created a second blocker if Path B materialised Mute/Solo while the topology flag remained sparse.

The runner now separates the changed properties from unrelated topology state:

- a Playback slot with an exact Mix gain/mute/solo baseline may be selected even when `mixer_slot_stereo` is not observed;
- direct Mute/Solo may run only from exact server-confirmed Mute/Solo baselines and still restores each changed boolean exactly;
- unknown topology is displayed/reported as **unknown**, with `stereoKnown=false` and `stereo=null`, never as false/mono;
- `side=both` stereo pair targets require `stereoKnown=true && stereo=true`;
- autonomous topology writes require `stereoKnown=true` and the exact canonical pair topology/source state;
- therefore unknown topology permits only direct exact-baseline Mute/Solo, never pair-aware/topology writes.

New regressions cover these cases plus duplicate Playback refusal and forbidden write-family preservation.

These logic changes are **SOURCE_IMPLEMENTED** and their exact Prettier output has been applied. Do not claim the current branch fully green until the user-host gate proves Prettier, ESLint, source manifest, all tests and package build.

## Retained strong hardware evidence

Latest strong automated Mix closure from 0.1.17 under the then-tested stereo topology:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false, server variable + rendered feedback + exact restore.
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same.
- Mix A Right Mute direct stereo write: no transition, exact restore.
- Mix A Right Solo direct stereo write: no transition, exact restore.
- Mix B-F: 20 `SKIP_BASELINE_UNKNOWN`.
- restore quarantine 0; hardware restore YES; Page 2 restore YES.

Do not infer Right is globally pair-owned/unwritable/unsupported from that stereo-only result.

## Current status

- `mix_mute`: PARTIAL.
- `mix_solo`: PARTIAL.
- `mixer_slot_stereo`: RESEARCH_OPEN; Playback 1/2 topology was SESSION_STATE_OBSERVED as UNKNOWN in the latest run, so no topology write is currently safe.
- `mixer_slot_source`: RESEARCH_OPEN, no source write exposed/attempted.
- `output_pair_source`: existing pair-aware path; fallback selection is now IMPLEMENTED without unrelated topology prerequisite, full user-host software gate and hardware exercise pending.
- parent matrix remains 31 definitions / 829 instances; publication is not the current objective.

## Exact next action — software gate, then hardware

1. Keep existing 0.1.18 selected on the existing authorised Companion connection. Do not recreate it and do not manually change mono/stereo/Mute/Solo/faders/routing.
2. Run `UPDATE_AND_RUN.bat`, stay on `testbench/meter-routing-exact-restore`.
3. Required: dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, **all** Node tests PASS, package build PASS.
4. If green, do not re-import 0.1.18 solely for these latest changes because no module `src/` file changed.
5. Pause YouTube/DAW playback; keep physical Monitor low, speakers muted/off if possible and headphones safe/removed.
6. Return immediately to the parent hardware objective with only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
7. Use `PAGE2_AUTO` only when positively recognized; confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`; touch nothing afterward.
8. Paste the complete output. The expected useful path is Path A safe-stop if topology is still unknown → Path B actual guarded non-Monitor output-pair route + exact restore → fresh Mix snapshot → direct Mute/Solo if exact baselines appear, with pair/topology writes still withheld while topology remains unknown.
9. Any restore quarantine/HARD ABORT means stop all further hardware testing until diagnosed. A fully restored `NO-OP SAFE` is useful research evidence and must not be repeated blindly.

## Permanent safety

Scarlett 18i20 (3rd Gen) only. Monitor gain item 1677 read-only. No invented input preamp gain, direct per-input mute, per-channel phantom, Mic Kill or physical Monitor level write. Dynamic server port/device ID only. Feedback/state server-confirmed only. No unsafe raw writes, firmware/reset/restore/snapshot commands, or meter/status writes. No write to explicit UNKNOWN output availability. No Focusrite software/firmware update or unrelated routing change without explicit agreement. Preserve privacy and attribution.
