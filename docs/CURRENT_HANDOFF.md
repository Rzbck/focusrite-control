# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T16:18+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `MIX_FEEDBACK_BLOCKED_BY_MISSING_PAGE2_HARNESS_READONLY_RECOVERY_REQUIRED`
Latest user-run checkpoint: `bd2a0ccfc2e2525b6c56f56599285865d64fe54a`
Exact fully validated broad software-audit checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840`
Canonical production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — ALWAYS FIRST

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. identify the branch that owns the current objective;
2. fetch the remote branch and resolve its current HEAD;
3. inspect latest relevant commits/diff since the last validated checkpoint;
4. read this file from that live ref;
5. inspect current code/tests and newest sanitized hardware evidence;
6. reconcile any newer result validated by the human user;
7. only then choose the next action.

An embedded SHA is a checkpoint, not permission to skip the live remote check.

Evidence priority: newest completed physical/human hardware result > completed software gate > current code/tests > this handoff > older docs/captures.

Always distinguish **hardware-tested**, **software-tested**, **implemented**, **schema-observed**, **research-only**, **pending**, and **unsupported**.

## IMMUTABLE objective continuity — no premature closure

Permanent rule exists in `AI_PROJECT_RULES.md` + root `HANDOFF` and is regression-tested.

A completed sub-question does **not** close the parent hardware-validation objective. Green software, complete inventory, zero FAIL or static PASS cannot replace unresolved `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved` or otherwise open hardware evidence.

Tooling/release work may interrupt only when it directly blocks the next safe hardware step, then work must immediately return to the parent objective.

Current parent objective remains **explicit hardware feedback closure using `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`**.

## Latest user run — Mix mute/solo feedback launcher at `bd2a0ccfc2e2`

User clean audit worktree:

- path used locally: clean audit worktree;
- HEAD: `bd2a0ccfc2e2`;
- `git status --short`: empty before launch.

Launcher:

`testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`

### Targeted self-check

**15/15 PASS**.

Validated by the user-run output:

- Mix feedback harness only targets runtime Playback-slot `mix_mute` / `mix_solo`;
- exact-baseline logic tests pass;
- no forbidden broader write family in the runner;
- no-runnable feedback-mismatch path is fail-closed;
- Page 2 reporting guard test passes;
- launcher confirmation ordering passes;
- immutable no-premature-closure rule test passes.

No hardware was touched during self-check.

### Read-only Remote Devices / connection preflight

PASS:

- local Companion detected;
- Focusrite module connection found;
- exact model `Scarlett 18i20 (3rd Gen)`;
- existing canonical `Companion Scarlett 18i20` client authorised;
- connection `Connected / authorised`.

No hardware changed by this preflight.

### Hardware-stage preparation actually reached

The user explicitly entered:

- `MIX_FEEDBACK`;
- `ALL_ISOLATED`.

The runner then performed only its **read-only `prepareLab()` discovery/snapshot stage**:

- r9 page audit PASS: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module version PASS: 0.1.16;
- hardware-tested write profile + authorised module client PASS;
- live shape PASS: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- evidence coverage PASS: 1436/1436 inventory rows, snapshot 1340/1340, core 21/21, feedback 829 / 31;
- output capability observed: AVAILABLE=22, UNKNOWN=4.

It then stopped with:

`MIX FEEDBACK FATAL - Mix feedback closure requires the current audited V8 capability-lab harness on Companion Page 2.`

## CRITICAL interpretation of that failure

This failure happened **before any Mix feedback hardware write and before any Page 2 mutation/import**.

`prepareLab()` is read-only through this point. When the current V8 capability-lab page is not found, it only generates the expected harness file locally and returns `prep: 'harness'`; it does **not** import/replace Page 2 and does not send a Focusrite write.

Therefore for this user run:

- Focusrite hardware writes: **0**;
- `mix_mute` writes: **0**;
- `mix_solo` writes: **0**;
- output/routing writes: **0**;
- Companion Page 2 mutation by this run: **0**;
- hardware restoration required: **NO**, because hardware was never changed;
- Page 2 restoration required from this run: **NO**, because Page 2 was never changed;
- package build/install: **0**;
- direct Control Server client: **0**.

The launcher subsequently printed:

`HARD ABORT : restauration hardware non confirmee.`

That message is **misleading for this specific failure**. The top-level runner fatal path currently returns code 4 even for a pre-write missing-harness condition. Do **not** interpret this output as evidence that hardware restoration failed or that the Scarlett is left in an altered state.

This is now a **TestBench/preparation/reporting blocker**, not a hardware restore incident.

## Exact blocker to solve next

The Mix feedback runner currently requires the audited V8 capability-lab harness to already occupy Companion Page 2.

In this session it did not find that exact page and `prepareLab()` returned `prep: 'harness'`.

Do **not** rerun `RUN_MIX_FEEDBACK_CLOSURE.cmd` unchanged yet.

The next discussion must first:

1. perform the mandatory live HEAD/handoff freshness check;
2. inspect the current Page 2 identity/configuration **read-only** and reconcile why the V8 capability-lab harness is absent;
3. inspect the locally generated expected V8 harness and the existing Page 2 preservation/restore tooling;
4. fix the Mix feedback launcher/runner semantics so `prep: 'harness'` is reported as a safe **PREP_REQUIRED / zero-write** condition instead of false code-4 hardware restore quarantine;
5. decide the safest Page 2 preparation path without overwriting user content blindly;
6. only if a Page 2 import/replacement is needed, preserve/audit the existing Page 2 and obtain/retain explicit user agreement before changing Companion configuration;
7. after Page 2 is confirmed as the audited V8 capability-lab harness, resume the same targeted Mix mute/solo closure — not FULL.

No hardware test should run while the Page 2 precondition is unresolved.

## Previous targeted Core feedback result — CLOSED AS NONACTIONABLE

User-run checkpoint: `0b9b87da582b690b6d22c19a791816b3d584b7d1`.

`RUN_FEEDBACK_CORE_CLOSURE.cmd`:

- targeted self-check 13/13 PASS;
- exact model + canonical authorised client PASS;
- Air 1–8 baseline missing: 8 SKIP;
- Pad 1–8 baseline missing: 8 SKIP;
- Monitor Mute baseline missing: 1 SKIP;
- Monitor Dim baseline missing: 1 SKIP;
- `DYNAMIC_CLOSED=0`;
- `SKIP_BASELINE_UNKNOWN=18`;
- FAIL=0;
- restore quarantine=0;
- hardware writes=0.

These 18 targets are **EVAL_ONLY_NONACTIONABLE in the current bootstrap state**. Do not assume false, manufacture a baseline, repeatedly reconnect/resubscribe, rerun Core unchanged, or create another direct client.

## 31-definition feedback parent matrix

Canonical checklist:

`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`

Retained V8 facts:

- public feedback definitions: **31**;
- feedback instances: **829**;
- V8 static/oracle: **190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- dynamic tracker: **20 both-state / 12 single-state / 710 neverObserved / 0 FAIL**.

Do **not** rerun FULL just to improve these counts.

Current matrix corrections already established:

- `input_air`, `input_pad`, `monitor_mute`, `monitor_dim`: currently nonactionable because exact initial server state is absent;
- `mixer_slot_source` / `mixer_slot_stereo`: withheld by current 18i20 hardware evidence profile;
- `mix_talkback`: withheld; do not target next;
- `output_mute`: many baselines unknown and several right-member behavior mismatches;
- outputs 21–24 availability remains UNKNOWN => no write;
- `output_stereo`: many pair vectors lack proven exact reconstruction;
- `output_source`: available left paths largely already WRITE_CONFIRMED; right members are pair-owned aliases.

The existing Playback-strip path remains the intended next actionable island **after Page 2 preparation is fixed**.

## Meter evidence retained

46 meter paths:

- inputs 8/8 dynamically closed;
- outputs 4/26 dynamically closed;
- mixes 2/12 dynamically closed;
- total 14/46;
- mismatch 0.

Mix A L/R meter closure remains valid.

Mix B–F write-driven meter closure remains nonactionable because exact Playback-strip baselines are missing (`ACTIONABLE=0 ALREADY_CLOSED=2 BASELINE_UNKNOWN=10`). Do not infer defaults or rerun direct baseline research.

## Remote Devices authorization — mandatory before any write

Canonical normal client is the existing approved **Companion Scarlett 18i20** connection.

Reuse it. Do not delete/recreate it merely for testing.

Writes require authorisation for this module's own current server-assigned client ID.

Do **not** create a new direct Control Server client merely to inspect state Companion can already expose. A direct research client is exceptional and requires explicit warning/agreement before launch.

Never reuse/copy the Companion private client key into another process.

## Production package / permanent safety

Keep exact audited installed package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

No TestBench/debug package installation.

Permanent restrictions:

- supported hardware only Scarlett 18i20 (3rd Gen);
- Monitor gain item 1677 read-only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no physical Monitor-level write;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no write to explicit UNKNOWN output availability;
- server-confirmed feedback/state only;
- dynamic Control Server TCP port and device ID;
- no Focusrite software/firmware/routing/hardware setting changes outside an explicitly agreed test.

## Software/tooling checkpoints

Last broad software audit remains:

`fba6d977a59b6381ae11c736a68fc809afb55840`

Result: 192/192 tests PASS, package build PASS, RUN OK, no hardware validation.

The Mix targeted launcher at `bd2a0cc...` passed its **15/15 targeted self-check**, but its actual Mix feedback hardware campaign did not start because Page 2 precondition failed.

Production `src/` behavior and installed exact 0.1.16 are unchanged by this targeted feedback work.

Do not divert into another broad release/tooling audit.

## Publication

Official Bitfocus repository/name decision remains pending. Publication is not the current parent objective while feedback hardware closure remains open.

Do not rename public IDs/packages or broaden hardware support.

## EXACT IMMEDIATE NEXT STEP FOR THE NEXT DISCUSSION

**Do not ask the user to rerun anything first.**

After the mandatory live repository freshness check, diagnose the missing V8 capability-lab Page 2 and the false code-4/HARD-ABORT reporting path.

The first work should be read-only/source-side:

- inspect current Page 2 state/identity safely;
- inspect `prepareLab()` `prep: 'harness'` behavior;
- inspect Page 2 import/restore helpers;
- correct the runner/launcher status handling for a pre-write PREP_REQUIRED condition;
- preserve current Companion Page 2 before any proposed import.

Only then resume `RUN_MIX_FEEDBACK_CLOSURE.cmd` once the audited V8 Page 2 precondition is deliberately satisfied.

Do not run FULL, Core, SAFE, direct probes, broad output tests or package installation as a substitute.
