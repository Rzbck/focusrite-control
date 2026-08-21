# AI / contributor handoff

Updated: 2026-08-21

## Read first

1. `README.md`
2. `AI_PROJECT_RULES.md`
3. `docs/PROJECT_STATE.md`
4. `docs/BITFOCUS_SLACK_AND_RELEASE.md`
5. `docs/GITHUB_WORKFLOW.md`
6. `docs/AUTOMATED_DIAGNOSTICS.md`
7. branch-specific research document for the branch you are working on
8. current code/tests

Do not restart from chat assumptions when repository evidence exists.

## Project goal

Build and publish a safe Bitfocus Companion module for **Scarlett 18i20 (3rd Gen)** over the local Focusrite Control Server protocol. Only that hardware is supported today. Official Bitfocus repository/module naming is still pending after the discussion in Companion Slack `#module-development`; Bryce Seifert suggested the eventual scope/name may be `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.

Stable official target remains `v1.0.0` unless Bitfocus maintainers direct otherwise.

## Current production baseline

Integration baseline: **v0.1.12**.

Hardware/runtime confirmed:

- dynamic discovery + dynamic TCP port;
- exact Scarlett 18i20 (3rd Gen) detection;
- module's own server-assigned client ID matched to Remote Devices authorization;
- writes blocked until authorized;
- server-confirmed state only;
- final Companion status `OK`.

Guarded reversible hardware testing previously passed for Air 1–8, Pad 1–8, Input 1/2 Line↔Inst, Monitor Mute, Monitor Dim and Talkback. These mappings/write paths remain valid evidence.

Monitor gain item `1677` is read-only. Do not re-add Monitor set/adjust actions/presets/raw write access.

## Cold-start readback result — definitive

Public sanitized evidence:

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

- Phase A cold connect + one subscribe: **3/21**;
- Phase B unsubscribe → subscribe: **3/21**;
- Phase C clean reconnect + subscribe: **3/21**.

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing in all phases: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

Phase B received a **404-item** state packet and still omitted those 18 values. Timing/re-subscribe/reconnect research is closed. Do not add delays/loops, write-to-warm behavior, stale persistence-as-current, or an invented `get` request.

## Public/static protocol research — completed

Public Control Server clients inspected include:

- `Mathieu2301/Focusrite-Control-API`;
- `raduvarga/Focusrite-Midi-Control`;
- `sserolf/focusrite-midi-mapper-js`;
- `daveyijzermans/tally-server`;
- `enum-labs/focusrite-volume-control`;
- `dounix/focusrite-autoclock`;
- `sebastianrau/focusrite-mackie-control`.

All inspected clients use the device-arrival + subscribe + set/event model. None demonstrates a separate read request. The Sebastian Rau repository is especially relevant because it contains an 18i20 (3rd Gen) device-arrival schema/client.

Static scan evidence:

`diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md`

Real host result: 2 Focusrite processes / 4 EXE-DLL files scanned read-only; concrete known tokens included `device-subscribe`, `keep-alive`, `server-announcement`, `set`; no additional XML root was found. Do not rerun this unchanged static scan.

## Passive Pktmon session — completed but inconclusive

Branch: `debug/official-client-passive-session`.

Latest sanitized result:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

Status:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md`

The successful 2026-08-21 run reached the 25-second capture window. The user closed and reopened Focusrite Control during the timer. Harness status was `SUCCESS / complete / ok`.

However the resulting capture contained:

- captured packet snapshots parsed: **0**;
- TCP stream chunks: **0**;
- complete Focusrite frames: **0**.

Decision: **Pktmon produced no usable protocol evidence on this host/session. Do not repeat the same experiment.**

Important historical correction: an earlier attempt was incorrectly described as not reaching capture. The user confirmed it had also reached the timer and Focusrite Control had been closed/reopened; its later status/report path failed, so no usable evidence survived. Record it as a harness/reporting failure, not as a pre-capture failure and not as protocol evidence.

## Current research branch

`debug/official-client-memory-observer`

Purpose: inspect the freshly reopened official Focusrite Control process in **read-only process memory** for concrete already-framed Control Server buffers.

Branch document:

`docs/OFFICIAL_CLIENT_MEMORY_OBSERVER.md`

The scanner counts evidence only when memory contains the actual framing pattern:

`Length=` + six hex digits + space + XML root/payload.

This avoids treating static XML-looking strings as protocol evidence.

Allowed Windows process APIs are restricted to:

- `OpenProcess` query + VM-read;
- `VirtualQueryEx`;
- `ReadProcessMemory`;
- `CloseHandle`.

Forbidden and test-blocked:

- `WriteProcessMemory`;
- `VirtualAllocEx`;
- `CreateRemoteThread` / `NtCreateThreadEx`;
- APC/thread-context injection;
- process termination;
- memory dumps;
- Focusrite protocol transmission.

Raw memory is never written to disk. Only normalized roots, opening attribute names, guarded Core IDs, process counts and restart-detection state may be published.

Expected public files after a run:

- `diagnostics/runtime/latest-official-client-memory-observer.md`
- `diagnostics/runtime/latest-official-client-memory-observer-status.md`

Human action: when the memory-observer window asks, close only Focusrite Control, reopen it normally, leave Air/Pad/Mute/Dim/Talkback untouched, then wait. Companion may remain open.

## Repository workflow

Personal development repository: `Rzbck/focusrite-control`.

**Do not use GitHub Actions in this personal repository.** Validation is local through checked-in Node/Yarn/Windows runners. The future official Bitfocus repository may use maintainer-required CI.

Branches:

- `main` — integration baseline + current handoff/docs;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `debug/cold-start-readback` — completed readback evidence;
- `debug/official-client-read-source` — completed public/static read-source research;
- `debug/official-client-passive-session` — completed Pktmon experiment, 0 packet evidence;
- `debug/official-client-memory-observer` — current research branch;
- `diagnostics/readback-results` — sanitized machine-generated results only.

Use `UPDATE_AND_RUN.bat`. Debug runners have no intermediate Enter prompts. Root `RUN.bat` keeps one final pause so the human can read the final status and press a key to close.

## Privacy / automatic diagnostics

Before asking the user for a local log, fetch the applicable file from `diagnostics/readback-results`.

Never auto-upload:

- `.local-logs`;
- `.local-captures`;
- ETL/PCAPNG;
- raw XML/protocol captures;
- raw/private process memory;
- private paths;
- hostname/endpoints/ports;
- serial/client keys/client IDs/device IDs;
- private device XML/diagnostics.

Every automatic diagnostic path must have a fixed sanitized schema, rejection tests and remote content verification.

## Never do

- do not guess missing values as `false`;
- do not use optimistic feedback/state;
- do not write merely to discover current state;
- do not re-add Monitor gain `1677` writes;
- do not expose unknown raw writes, firmware/reset/restore/snapshot commands or read-only status/meter writes;
- do not expand hardware support without physical testing;
- do not update Focusrite software/firmware/routing/settings without explicit user agreement;
- do not publish private captures/identifiers;
- do not add GitHub Actions to this personal repo.
