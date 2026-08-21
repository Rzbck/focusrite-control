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
- `debug/official-client-memory-observer` — completed read-only official-client memory experiment/tooling;
- `rc/v0.1.13-state-contract` — current release-hardening branch for explicit-vs-state-derived action behavior;
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

## Public/static Control Server research — closed

Public implementations inspected include Mathieu2301, raduvarga, sserolf, tally-server, enum-labs, dounix and Sebastian Rau's 18i20-specific project. All observed clients use device-arrival + subscribe + server `set`/event state. None demonstrates a separate read primitive.

Static official-client result:

`diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md`

Real Windows scan: 2 Focusrite processes / 4 relevant EXE-DLL files; known roots/tokens included `device-subscribe`, `keep-alive`, `server-announcement`, `set`; no additional concrete XML root found. Do not rerun unchanged static scanning.

## Passive Pktmon experiment — closed/inconclusive

Result:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

Status:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md`

The successful run reached the 25-second window and the user closed/reopened Focusrite Control. Harness status: `SUCCESS / complete / ok`.

The sanitized capture nevertheless contained **0 packet snapshots / 0 TCP stream chunks / 0 complete Focusrite frames**. Pktmon supplied no usable protocol evidence on this host/session. Do not repeat the same experiment.

Historical correction: an earlier attempt also reached the timer according to the user's direct observation. Its later status/report handling failed. Record it as a harness/reporting failure, not as a pre-capture failure and not as protocol evidence.

## Official-client memory experiment — completed/inconclusive

Sanitized result:

`diagnostics/readback-results:diagnostics/runtime/latest-official-client-memory-observer.md`

Status:

`diagnostics/readback-results:diagnostics/runtime/latest-official-client-memory-observer-status.md`

Real Windows result:

- observer status: `SUCCESS / complete / ok`;
- one official process attempted/scanned;
- fresh GUI restart detected: **YES**;
- scan safety limit: not reached;
- concrete framed roots found: `client-discovery`, `server-announcement`;
- no concrete `client-details`, `device-subscribe` or `set` frame survived in the sampled client memory;
- no guarded Core ID appeared in a concrete `set` frame.

`client-discovery` and `server-announcement` are already-known protocol roots. The first report incorrectly labeled them unknown because the memory observer's `KNOWN_ROOTS` set omitted them. That classifier bug is fixed on `debug/official-client-memory-observer` and regression-tested. Do not treat the original `UNKNOWN` decision text as evidence of a new command.

The memory experiment is **inconclusive for cold-state readback**, not evidence that the protocol lacks another internal mechanism. Do not continue escalating capture/memory techniques unless a concrete publication requirement makes it necessary.

## Current objective — RC state contract

Branch:

`rc/v0.1.13-state-contract`

The project is no longer treating the missing cold-start values as an absolute blocker for the already validated controls.

Current production behavior already separates:

- **explicit target writes** (`On`, `Off`, explicit enum/set value): may be requested without knowing the previous value, but only when connected, item is verified writable and this module's own client is authorised;
- **state-derived writes** (`Toggle`, cycle, relative adjust): blocked when current server state is unknown/invalid;
- feedback/state updates: server-confirmed only, never optimistic;
- raw state variables: blank while the server has not confirmed the value.

The RC branch adds tests/documentation that lock this behavior as the supported cold-start contract. Production source should only change if validation reveals a real gap.

RC contract document:

`docs/STATE_CONTRACT.md`

## Privacy / diagnostics

Never auto-upload raw `.local-logs`, `.local-captures`, ETL/PCAPNG, raw XML, process memory, private paths, hostnames/endpoints/ports, serials, client keys/client IDs/device IDs or private device diagnostics.

Future AI/contributors must fetch applicable sanitized diagnostics from `diagnostics/readback-results` before asking the user for local files.

Latest memory-observer public result was checked and contains no raw process memory, local path, endpoint, port value, serial, client key, device/client ID or item value.

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
