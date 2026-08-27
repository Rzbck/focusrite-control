# Project state

Updated: 2026-08-24

This document is a high-level state summary only. The canonical resume entrypoint is live root `HANDOFF`, followed by `docs/CURRENT_HANDOFF.md` and `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`.

## Current development line

- objective branch: `testbench/meter-routing-exact-restore`;
- supported hardware claim: **Scarlett 18i20 (3rd Gen) only**;
- parent objective: **explicit hardware feedback closure** across all 31 public feedback definitions/instances;
- canonical production candidate: exact audited **0.1.16**;
- prior research/readback build **0.1.17**: complete user-host software gate passed, packaged, loaded on the existing authorised Companion connection, and physically exercised;
- current research build **0.1.18**: autonomous Mix mono/stereo source implementation complete, complete user-host software gate pending, hardware pending;
- stable eventual public release target remains `v1.0.0` unless Bitfocus maintainers direct otherwise;
- official Bitfocus repository/name decision remains pending; do not change public scope before that decision.

Publication is not the current parent objective while material hardware feedback rows remain open.

## Current hardware evidence snapshot

Historical V8 evidence remains:

- 31 public feedback definitions / 829 instances;
- static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL;
- dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL;
- later meter closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12;
- targeted Core 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes/FAIL/restore quarantine — readback evidence only.

Latest stronger Mix result using 0.1.17:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED** with server + rendered feedback `false -> true -> false` and exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED** with the same closure contract;
- Mix A Right Mute/Solo direct writes did not transition under the tested stereo topology but restored exactly;
- Mix B-F remain open because required current state was sparse in that session.

Do not infer global Right-lane ownership/unsupported behavior from that one stereo topology.

## Runtime mono/stereo correction

Newer Focusrite Control UI evidence proves that source presentation can switch at runtime between individual mono channels and linked stereo pairs for Software Playback and other relevant source families.

Latest known physical starting state is separate mono **Playback 1 + Playback 2**.

Therefore old repository language that treated mixer-slot source/stereo as broadly unsupported/non-actionable is obsolete. Older hardware tests prove only that direct **single-item** source/stereo writes produced no useful transition on the tested slots.

Current status:

- `mixer_slot_stereo`: **RESEARCH_OPEN / EVAL_ONLY** for pair/group/transaction semantics;
- `mixer_slot_source`: **RESEARCH_OPEN / EVAL_ONLY** where needed to understand grouped semantics;
- generic/public and Advanced Raw mixer-slot source/stereo writes remain withheld;
- no public support is claimed from the newer UI evidence alone.

See `docs/COLD_START_READBACK.md` and the feedback matrix for the complete evidence chain.

## 0.1.18 research scope

0.1.18 exists to make the next Mix topology differential autonomous so the operator does not manually switch mono/stereo between phases.

The research implementation:

- exposes `mixer_slot_stereo` only under the existing diagnostic mixer-variable option;
- explicit On/Off only, no Toggle;
- refuses unknown/invalid current server state;
- keeps `mixer_slot_source` and raw mixer-slot writes blocked;
- dynamically finds the adjacent Playback mate;
- generates a paired two-action stereo transition and exact paired restore through the existing Companion connection;
- monitors source IDs/names but never writes them;
- gates any stereo Mix test on server-confirmed topology/source state;
- hard-aborts/quarantines an unconfirmed restore.

Status is **SOURCE_IMPLEMENTED**, not hardware-confirmed.

## Next gate

The immediate operator step is software-only:

1. `UPDATE_AND_RUN.bat` on the objective branch;
2. require dependencies, Prettier, ESLint, source manifest, all Node tests, and Companion package build to pass for **0.1.18**;
3. do not start hardware if any stage fails.

Only after the complete 0.1.18 user-host gate is green:

1. load/select `focusrite-scarlett-18i20-0.1.18.tgz` on the **existing authorised Companion Focusrite connection**;
2. keep/enable `Expose all mixer slot variables` for the research action gate;
3. leave Playback 1/2 mono;
4. run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`;
5. confirm `MIX_FEEDBACK` and `ALL_ISOLATED` once;
6. touch nothing in Focusrite Control during the hardware phase; TestBench owns temporary topology and exact restoration.

If the paired normal Companion actions produce no useful topology transition but restore exactly, investigate official-client grouped/atomic multi-item `<set>` semantics next. Do not escalate to raw writes.

## Permanent state/safety contract

- Dynamic Focusrite Control Server port and device ID; never hardcode them.
- Writes require this module's own server-assigned Remote Devices client to be authorised.
- Feedback/state are server-confirmed only; never optimistic.
- Missing current state remains unknown; never default missing booleans to false.
- Monitor gain item 1677 remains read-only.
- No invented input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, or physical Monitor level write.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands, or writes to meter/status items.
- No write to explicit UNKNOWN output availability.
- No Focusrite software/firmware or unrelated routing/settings change without explicit user agreement.
- No private serial, hostname, endpoint, client key, raw private capture/device XML, diagnostics, or user-specific path in public source.
- Preserve relevant MIT/third-party attribution and do not claim all protocol knowledge was independently discovered.

## Publication state

A repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested the eventual scope/name may be `focusrite-control` because transport is Focusrite Control Server and offered hardware for future testing. The project stated that only Scarlett 18i20 (3rd Gen) is currently validated and is open to Bitfocus's naming decision.

When an official repository exists, inspect its exact name/default branch/seed files/permissions and follow the expected branch/PR/CI workflow rather than overwriting it. Do not submit a Developer Portal tag until hardware/action audit and required CI are clean.
