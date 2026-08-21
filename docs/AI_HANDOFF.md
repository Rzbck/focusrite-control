# AI / contributor handoff

Updated: 2026-08-21

## Read first

1. `README.md`
2. `AI_PROJECT_RULES.md`
3. `docs/PROJECT_STATE.md`
4. `docs/BITFOCUS_SLACK_AND_RELEASE.md`
5. `docs/GITHUB_WORKFLOW.md`
6. `docs/AUTOMATED_DIAGNOSTICS.md`
7. `docs/OFFICIAL_CLIENT_MEMORY_OBSERVER.md`
8. current code/tests

Do not restart from chat assumptions when repository evidence exists.

## Project goal

Build and publish a safe Bitfocus Companion module for **Scarlett 18i20 (3rd Gen)** over local Focusrite Control Server. Only that hardware is supported today. Official Bitfocus repository/module naming remains pending after the Companion Slack `#module-development` discussion; Bryce Seifert suggested the eventual scope/name may be `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.

Stable official target remains `v1.0.0` unless Bitfocus maintainers direct otherwise.

## Production baseline

Integration baseline: **v0.1.12**.

Confirmed on real hardware/runtime: dynamic discovery/TCP, exact model detection, module-owned server client ID + Remote Devices authorization, writes blocked until authorized, server-confirmed state and Companion status `OK`.

Guarded reversible testing previously passed for Air 1–8, Pad 1–8, Input 1/2 Line↔Inst, Monitor Mute, Monitor Dim and Talkback. Those mappings/write paths remain valid hardware evidence.

Monitor gain `1677` is read-only. Do not re-add Monitor set/adjust actions/presets/raw writes.

## Cold-start readback — definitive

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

- cold connect + subscribe: **3/21**;
- unsubscribe → subscribe: **3/21**;
- clean reconnect + subscribe: **3/21**.

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing in all phases: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

Phase B delivered a **404-item** server state packet and still omitted those 18 values. Timing/re-subscribe/reconnect research is closed. Never add delay loops, write-to-warm behavior, stale values presented as current, or an invented `get` request.

## Public/static research — completed

Public clients inspected include Mathieu2301, raduvarga, sserolf, tally-server, enum-labs, dounix and Sebastian Rau's 18i20 project. All use device-arrival + subscribe + server `set`/event state; none demonstrates a separate read primitive.

Static result:

`diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md`

Real Windows scan found known protocol roots/tokens but no additional concrete XML root. Do not rerun unchanged static scanning.

## Passive Pktmon experiment — closed/inconclusive

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md`

The successful run reached the 25-second timer; the user closed/reopened Focusrite Control. Harness status was `SUCCESS / complete / ok`, but the resulting sanitized capture had **0 packet snapshots, 0 TCP stream chunks and 0 complete Focusrite frames**. Therefore Pktmon produced no protocol evidence and the same experiment should not be repeated.

Historical correction: an earlier passive attempt was incorrectly described as not reaching capture. The user confirmed it had reached the timer and Focusrite Control had been closed/reopened; later status/report handling failed. Record it as a harness/reporting failure, not as a pre-capture failure and not as protocol evidence.

## Current branch — official-client memory observer

Branch:

`debug/official-client-memory-observer`

Document:

`docs/OFFICIAL_CLIENT_MEMORY_OBSERVER.md`

Purpose: after Focusrite Control is freshly reopened, inspect only readable non-image process memory for **concrete already-framed Control Server buffers** matching `Length=` + six hex digits + space + XML payload.

Allowed process APIs are restricted to `OpenProcess` query/VM-read, `VirtualQueryEx`, `ReadProcessMemory`, `CloseHandle`.

Tests explicitly reject `WriteProcessMemory`, `VirtualAllocEx`, remote-thread/APC/context injection and process termination primitives. No memory dump is written. No Focusrite protocol message is transmitted.

Raw frame bytes stay in RAM, are classified, deduplicated in RAM and discarded. Frame hashes are never written/published.

Only normalized evidence may be published:

- official process counts;
- fresh restart detected yes/no;
- concrete XML root names;
- opening attribute names only;
- guarded Core IDs found inside concrete `set` frames;
- bounded-scan-limit state.

Expected public files:

- `diagnostics/runtime/latest-official-client-memory-observer.md`
- `diagnostics/runtime/latest-official-client-memory-observer-status.md`

During the observation window the user closes only Focusrite Control, reopens it normally, leaves Air/Pad/Mute/Dim/Talkback untouched, then waits. Companion may remain open.

Decision rules:

- unknown concrete root -> research exact observed role/schema before transmitting anything;
- only known roots -> still no evidence for a separate read request;
- guarded Core IDs in concrete `set` buffers -> record what state the official client actually had available;
- no concrete frames -> memory method is inconclusive, not proof of absence.

## Repository workflow

Personal repo: `Rzbck/focusrite-control`.

**No GitHub Actions in this personal repository.** Validation is local through checked-in runners. Future official Bitfocus CI applies only when the official repository exists.

Branches:

- `main` — integration baseline + current docs;
- `backup/v0.1.12-user-loaded-20260820` — immutable checkpoint;
- `debug/cold-start-readback` — completed readback evidence;
- `debug/official-client-read-source` — completed public/static research;
- `debug/official-client-passive-session` — completed Pktmon experiment, no packet evidence;
- `debug/official-client-memory-observer` — current branch;
- `diagnostics/readback-results` — sanitized generated results only.

Use `UPDATE_AND_RUN.bat`. No intermediate Enter prompts; root `RUN.bat` keeps one final human pause.

## Privacy

Before asking for a local log, read the applicable sanitized diagnostics branch file.

Never auto-upload `.local-logs`, `.local-captures`, ETL/PCAPNG, raw XML, process memory, private paths, hostname/endpoints/ports, serials, client keys/client IDs/device IDs, private device XML or raw captures.

## Never do

- do not guess missing values;
- do not use optimistic feedback/state;
- do not write merely to discover state;
- do not re-add Monitor gain 1677 writes;
- do not expose unknown raw writes, firmware/reset/restore/snapshot or read-only status/meter writes;
- do not expand hardware scope without physical testing;
- do not update Focusrite software/firmware/routing/settings without explicit user agreement;
- do not publish private diagnostics;
- do not add GitHub Actions here.
