# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 11:51+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_UNKNOWN_TOPOLOGY_ROUTING_AND_DIRECT_CLOSURE_SOFTWARE_VALIDATED_HARDWARE_READY`
Canonical production candidate: audited **0.1.16**
Research 0.1.17: software validated, packaged, real hardware exercised.
Research 0.1.18 module/package checkpoint: **SOFTWARE VALIDATED / PACKAGED / LOADED ON EXISTING AUTHORISED CONNECTION** at `d6df45c59ab825e1ebccae90d98212b561449feb`.
Current fully validated TestBench checkpoint: `7486e7200d05a517e2c38e70991e1df72a50d8e8` with **244/244 tests + package build PASS**.
Newest changes remain **TESTBENCH/TESTS/DOCS ONLY**; no module `src/` file changed.

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

## Latest full software gate — green

User-host `UPDATE_AND_RUN.bat` at exact checkpoint `7486e7200d05a517e2c38e70991e1df72a50d8e8` completed:

- portable Node **22.23.2** / Yarn **4.17.0** PASS;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **244/244 PASS / 0 FAIL**;
- Companion package build PASS: `focusrite-scarlett-18i20-0.1.18.tgz`.

No hardware write occurred during this gate. The build step did not install or activate the package. Treat `7486e7200d05...` as the exact software/TestBench checkpoint validated by the user's PC. Later handoff-only commits do not change that code checkpoint.

## Latest completed hardware attempt — two-path NO-OP SAFE / zero write

The previous `RUN_MIX_FEEDBACK_CLOSURE.cmd` run passed targeted self-check **72/72**, exact Scarlett 18i20 (3rd Gen) preflight, existing Companion connection, Remote Devices authorization and Page 2 preparation.

SESSION_STATE_OBSERVED:

- slot 3 :: `Playback 1` :: topology **unknown**;
- slot 4 :: `Playback 2` :: topology **unknown**;
- later canonical Playback candidates had materialised stereo flags where observed.

Path A correctly stopped before write because original `mixer_slot_stereo` for Playback 1/2 was unknown and therefore could not be restored exactly.

Path B also stopped before write because it still reused Path A's known-topology selector. Final result was `NO-OP SAFE`, hardware writes **0**, no topology/routing/Mute/Solo write and no restore incident.

Do not call Playback 1/2 mono, stereo, unsupported or unwritable from that result. Source/name was known; only topology was missing from this client session.

## Corrected Path B — software validated

`testbench/MixOutputRoutingMaterialize.js` now selects its Playback coverage pair independently from mixer topology:

- canonical `Playback N` source names + non-zero server-confirmed source IDs are required;
- duplicate/ambiguous Playback identities fail closed;
- previous source/name target may be reused when valid;
- otherwise Playback 1/2 is the campaign anchor when both exist;
- otherwise exactly one complete canonical Playback source/name pair may be used;
- `mixer_slot_stereo` is diagnostic only for this output-routing path and may remain unknown;
- Monitor Outputs 1-2 remain excluded;
- Line Outputs 3-4 remain preferred only when both are writable and their original source values are exact;
- explicit UNKNOWN/UNAVAILABLE output availability receives no write;
- exactly one temporary `output_pair_source` action routes the selected non-Monitor pair to Mix A;
- server-confirmed route is required;
- existing V8 exact left/right source restore always runs after an attempted route;
- unconfirmed output restore = HARD ABORT;
- no mixer-slot source, Mix gain/Mute/Solo during materialisation, direct `output_source`, raw, Monitor gain or direct TCP write.

The green **244/244** gate includes regressions for unknown Playback topology on this path, duplicate Playback refusal, non-zero source IDs, non-Monitor pair selection and forbidden write families.

## Corrected direct Mix closure under unknown topology — software validated

`testbench/MixFeedbackClosureRunner.js` now separates direct changed-property baselines from unrelated topology state:

- an exact materialised Mix Mute/Solo baseline may be selected even when `mixer_slot_stereo` is not observed;
- direct Mute/Solo may run only from exact server-confirmed Mute/Solo baselines and restores each changed boolean exactly;
- unknown topology remains **unknown** in diagnostics/report (`stereoKnown=false`, `stereo=null`), never false/mono;
- `side=both` pair-aware operations remain withheld unless topology is server-confirmed stereo;
- all `mixer_slot_stereo` writes remain withheld unless original topology is server-confirmed and exactly restorable.

The green 244-test gate validates these software rules. Physical behavior remains hardware pending.

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
- `mixer_slot_stereo`: RESEARCH_OPEN; Playback 1/2 topology was SESSION_STATE_OBSERVED as UNKNOWN in the latest run, so topology write remains withheld while it stays unknown.
- `mixer_slot_source`: RESEARCH_OPEN, no source write exposed/attempted.
- `output_pair_source`: existing pair-aware path; corrected Mix-state materialisation fallback is **SOFTWARE VALIDATED / HARDWARE PENDING**.
- parent matrix remains 31 definitions / 829 instances; publication is not the current objective.

## Exact next action — hardware now

1. Do **not** rerun `UPDATE_AND_RUN.bat` or `UPDATE.bat` merely because handoff-only commits may follow validated checkpoint `7486e7200d05...`.
2. Keep existing 0.1.18 selected on the existing authorised Companion connection. Do not recreate it and do not manually change mono/stereo/Mute/Solo/faders/routing.
3. No package re-import is required solely for these newest TestBench/tests/docs changes because no module `src/` file changed.
4. Pause YouTube/DAW playback; keep physical Monitor low, speakers muted/off if possible and headphones safe/removed.
5. Run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
6. Use `PAGE2_AUTO` only when positively recognized.
7. Confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`; touch nothing in Focusrite Control afterward.
8. Preserve the complete output. Expected useful next path: Path A safe-stop if topology remains unknown → Path B guarded non-Monitor `output_pair_source` route + exact restore → fresh Mix snapshot → direct Mute/Solo if exact baselines appear, while pair/topology writes remain withheld if topology stays unknown.
9. Any restore quarantine/HARD ABORT means stop all further hardware testing until diagnosed. A fully restored `NO-OP SAFE` is useful evidence and must not be repeated blindly.

## Permanent safety

Scarlett 18i20 (3rd Gen) only. Monitor gain item 1677 read-only. No invented input preamp gain, direct per-input mute, per-channel phantom, Mic Kill or physical Monitor level write. Dynamic server port/device ID only. Feedback/state server-confirmed only. No unsafe raw writes, firmware/reset/restore/snapshot commands, or meter/status writes. No write to explicit UNKNOWN output availability. No Focusrite software/firmware update or unrelated routing change without explicit agreement. Preserve privacy and attribution.
