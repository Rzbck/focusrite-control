# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 11:07+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `MIX_RUNTIME_PAIRING_PLUS_OUTPUT_ROUTING_FALLBACK_SOFTWARE_VALIDATED_HARDWARE_READY`
Canonical production candidate: audited **0.1.16**
Research 0.1.17: software validated, packaged, real hardware exercised.
Research 0.1.18 module/package checkpoint: **SOFTWARE VALIDATED / PACKAGED / LOADED ON EXISTING AUTHORISED CONNECTION** at `d6df45c59ab825e1ebccae90d98212b561449feb`.
Current TestBench checkpoint `e06b7f38542fce61b3c7679b3f00e82f57aae1a2`: **SOFTWARE VALIDATED / HARDWARE READY**.

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

User-host `UPDATE_AND_RUN.bat` at checkpoint `e06b7f38542fce61b3c7679b3f00e82f57aae1a2` completed:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **239/239 PASS / 0 FAIL**;
- Companion package build PASS: `focusrite-scarlett-18i20-0.1.18.tgz`.

No hardware write occurred during the gate. The build step did not install or activate the package. For this campaign, no module `src/` change exists after the already loaded/validated 0.1.18 module checkpoint; the new work is TestBench/tests/docs only. Treat `e06b7f38542f...` as the validated software/TestBench checkpoint even if later documentation-only commits advance the branch HEAD.

## Retained latest Mix hardware attempt — safe pre-write stop

The earlier 0.1.18 `RUN_MIX_FEEDBACK_CLOSURE.cmd` attempt passed targeted self-check, exact Scarlett 18i20 Gen3 preflight, existing Companion connection, Remote Devices authorization and Page 2 preparation, then stopped before hardware write because the old TestBench assumed paired Playback channels must occupy adjacent mixer-slot numbers.

- hardware writes **0**;
- no topology write;
- no Mix Mute/Solo write;
- no restore incident.

That result did **not** prove mono/stereo writes fail. It exposed an obsolete TestBench selection assumption.

## Runtime Playback-channel pairing — software validated

The TestBench now pairs Playback channels by canonical runtime names even when their mixer-slot numbers are nonadjacent.

Safety contract:

- source/name/stereo is read live for each mixer slot;
- partner is canonical runtime channel identity (`Playback 1` ↔ `Playback 2`, etc.), independent of slot number;
- both members require distinct slots, non-zero source IDs and server-confirmed topology state;
- duplicate usable `Playback N` identities fail closed before prior-hint reuse or generic fallback;
- diagnostics are sanitized to slot/name/mono|stereo and never print raw source IDs;
- paired topology actions remain only `mixer_slot_stereo` explicit ON/OFF through the existing authorised Companion connection;
- source/name is collateral state only and is never written;
- exact original source/topology restore remains mandatory;
- no raw/direct TCP helper exists.

These paths are covered by the green 239-test gate at `e06b7f38542f...`.

## Existing Companion output-pair routing path reused as fallback

The module already contains `output_pair_source` (`Output: Route stereo pair`). The V8 TestBench already contains pair source tests and exact pair restoration. This is existing project capability, not a new raw protocol write.

`testbench/MixOutputRoutingMaterialize.js` is called by the same `RUN_MIX_FEEDBACK_CLOSURE.cmd` only when topology materialisation returns `NO-OP SAFE`.

Safety contract:

- finds one unique server-observed `Mix A L` source; raw source ID is not persisted in the sanitized report;
- excludes Monitor Outputs **1-2** from automatic routing fallback;
- prioritizes Line Outputs **3-4** only if both members are server-confirmed writable, both original source values are exact, and the V8 exact-restore path exists;
- otherwise searches another eligible non-Monitor pair;
- explicit `UNKNOWN` or `UNAVAILABLE` availability receives no write;
- writes one temporary `output_pair_source` Companion action to route the selected pair to Mix A;
- requires server-confirmed Mix A L/R on that pair;
- ALWAYS restores the exact original left/right source values before a fresh snapshot or closure continuation;
- unconfirmed hardware restore = HARD ABORT;
- Page 2 restore not confirmed = stop;
- exact Mix baseline appears after restore → continue to Mix Mute/Solo closure;
- no baseline → `NO-OP SAFE`; do not repeat blindly.

The fallback does not write mixer-slot source, Mix gain/Mute/Solo during materialisation, direct single-channel `output_source`, raw items, Monitor gain, firmware/reset/restore/snapshot, and does not create a direct TCP client.

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
- `mixer_slot_stereo`: RESEARCH_OPEN, runtime channel-pair/group semantics hardware pending.
- `mixer_slot_source`: RESEARCH_OPEN, no source write exposed/attempted.
- `output_pair_source`: existing pair-aware path; current Mix-state materialisation fallback is SOFTWARE VALIDATED / HARDWARE PENDING.
- parent matrix remains 31 definitions / 829 instances; publication is not the current objective.

## Exact next action — hardware now

1. Do **not** rerun `UPDATE_AND_RUN.bat` merely because documentation-only commits may follow the validated `e06b7f38542f...` checkpoint.
2. Keep existing 0.1.18 selected on the existing authorised Companion connection. Do not recreate it and do not manually change mono/stereo/Mute/Solo/faders/routing.
3. Pause YouTube/DAW playback; keep physical Monitor low, speakers muted/off if possible and headphones safe/removed.
4. Run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`.
5. Use `PAGE2_AUTO` only when positively recognized.
6. Confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`; touch nothing in Focusrite Control afterward.
7. Capture the complete output including Playback candidates, topology materialisation, exact restore, possible output-routing fallback/restore and Mix closure summary.
8. Any restore quarantine/HARD ABORT means stop all further hardware testing until diagnosed. A final two-path `NO-OP SAFE` is useful research evidence and must not be repeated blindly.

## Permanent safety

Scarlett 18i20 (3rd Gen) only. Monitor gain item 1677 read-only. No invented input preamp gain, direct per-input mute, per-channel phantom, Mic Kill or physical Monitor level write. Dynamic server port/device ID only. Feedback/state server-confirmed only. No unsafe raw writes, firmware/reset/restore/snapshot commands, or meter/status writes. No write to explicit UNKNOWN output availability. No Focusrite software/firmware update or unrelated routing change without explicit agreement. Preserve privacy and attribution.
