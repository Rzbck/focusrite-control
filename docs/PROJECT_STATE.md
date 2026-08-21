# Project state

Updated: 2026-08-21

## Integration baseline

`v0.1.12`

Validated on Windows / Companion 5.0.3 with format/lint/manifest/tests/package checks clean at the baseline. Runtime hardware evidence confirms dynamic discovery, dynamic TCP, exact Scarlett 18i20 (3rd Gen) detection, Remote Devices authorization matched to this module's own server-assigned client ID, server-confirmed state and final Companion status `OK`.

The personal repository `Rzbck/focusrite-control` uses **no GitHub Actions**. Local checked-in runners are the validation path. A future official Bitfocus repository may have maintainer-required CI.

## Branches

- `main` — current integration baseline + handoff/state docs;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good v0.1.12 checkpoint;
- `debug/cold-start-readback` — completed read-only cold-start lifecycle evidence;
- `debug/official-client-read-source` — completed public/static read-source research;
- `debug/official-client-passive-session` — completed Pktmon experiment; no usable packet evidence;
- `debug/official-client-memory-observer` — current read-only official-client research branch;
- `diagnostics/readback-results` — sanitized machine-generated diagnostic results only.

Do not move the backup branch.

## Hardware-tested control mappings

Guarded reversible testing previously passed through Companion / Focusrite Control Server for:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

These mappings/write paths remain hardware-tested. This does not imply their current state is available from a cold subscription.

Monitor gain `1677` remains **read-only**.

## Cold-start readback — definitive result

Sanitized evidence:

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

- cold connect + subscribe: **3/21**;
- unsubscribe → subscribe: **3/21**;
- clean reconnect + subscribe: **3/21**.

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

Phase B delivered a **404-item** server state packet and still omitted those 18 values. Timing/re-subscribe/reconnect is closed. Do not add delay loops, write-to-warm behavior, stale persistence presented as current, or an invented `get` request.

## Public/static Control Server research

Public implementations inspected include Mathieu2301, raduvarga, sserolf, tally-server, enum-labs, dounix and Sebastian Rau's 18i20-specific project. All observed clients use device-arrival + subscribe + server `set`/event state. None demonstrates a separate read primitive.

Static official-client result:

`diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md`

Real Windows scan: 2 Focusrite processes / 4 relevant EXE-DLL files; known roots/tokens included `device-subscribe`, `keep-alive`, `server-announcement`, `set`; no additional concrete XML root found. Do not rerun unchanged static scanning.

## Passive official-client Pktmon experiment — closed

Result:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

Status:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md`

The successful run reached the 25-second window and the user closed/reopened Focusrite Control. Harness status: `SUCCESS / complete / ok`.

But the sanitized capture contained:

- packet snapshots parsed: **0**;
- TCP stream chunks: **0**;
- complete Focusrite frames: **0**.

Therefore Pktmon supplied no protocol evidence for this local session. Do not repeat the same capture as the next step.

Historical correction: an earlier attempt also reached the timer according to the user's direct observation. Its later status/report handling failed. It must be recorded as a harness/reporting failure, not as a pre-capture failure and not as protocol evidence.

## Current technical objective — read-only official-client memory observer

Branch:

`debug/official-client-memory-observer`

Purpose: after Focusrite Control is freshly reopened, scan only readable non-image process memory looking for **concrete Control Server frames** matching the real framing pattern `Length=` + six hex digits + space + XML payload.

Safety properties:

- only `OpenProcess` query/VM-read, `VirtualQueryEx`, `ReadProcessMemory`, `CloseHandle`;
- no `WriteProcessMemory`;
- no remote allocation/thread/APC/context injection;
- no process termination;
- no memory dump file;
- no Focusrite protocol transmission;
- raw frame bytes stay in RAM and are discarded after classification;
- transient frame hashes are used only in RAM for deduplication and are never published;
- tests statically reject dangerous process-write/injection API names.

Only normalized roots, opening attribute names, guarded Core IDs, process counts and restart-detection state may be published.

Expected sanitized files:

- `diagnostics/runtime/latest-official-client-memory-observer.md`
- `diagnostics/runtime/latest-official-client-memory-observer-status.md`

If an unknown concrete root is found, research its observed role before transmitting anything. If only known roots appear, there is still no evidence for a separate official read request. If no concrete frames are found, the memory method is inconclusive rather than proof of absence.

## Privacy / diagnostics

Never auto-upload raw `.local-logs`, `.local-captures`, ETL/PCAPNG, raw XML, process memory, private paths, hostnames/endpoints/ports, serials, client keys/client IDs/device IDs or private device diagnostics.

Future AI/contributors must fetch applicable sanitized diagnostics from `diagnostics/readback-results` before asking the user for local files.

## Forbidden / rejected approaches

- defaulting missing booleans to false;
- optimistic feedback/state;
- writing merely to discover state;
- repeated subscription/reconnect timing loops;
- Monitor gain `1677` writes/actions/presets/raw writes;
- unknown/unsafe raw writes, firmware/reset/restore/snapshot commands;
- scope expansion beyond Scarlett 18i20 (3rd Gen) without physical testing;
- GitHub Actions in this personal repo.

## Publication / Slack

The module repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better eventual scope/name because the transport is Focusrite Control Server and offered hardware for future testing. Only Scarlett 18i20 (3rd Gen) is validated today. Official Bitfocus naming/repository decision remains pending. Stable target remains `v1.0.0` unless maintainers direct otherwise.
