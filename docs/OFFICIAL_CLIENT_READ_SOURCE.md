# Official Focusrite client read-source research

Updated: 2026-08-21

## Why this branch exists

The physical Scarlett 18i20 (3rd Gen) read-only cold-start probe proved that the standard Focusrite Control Server subscription lifecycle returns only 3/21 guarded Core values at startup.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim remained absent in:

- cold connect + one subscribe;
- unsubscribe → subscribe;
- clean TCP reconnect + subscribe.

Phase B received 404 state items and still omitted those 18 values. Timing/re-subscribe research is therefore closed.

This branch investigates whether the official Focusrite software contains or uses another **read primitive/state source**.

## Public client research completed

Public Focusrite Control Server clients inspected:

- `Mathieu2301/Focusrite-Control-API`;
- `raduvarga/Focusrite-Midi-Control`;
- `sserolf/focusrite-midi-mapper-js`;
- `daveyijzermans/tally-server`;
- `enum-labs/focusrite-volume-control`.

Observed common model:

1. connect to Focusrite Control Server;
2. send `client-details`;
3. receive/parse device arrival;
4. send `device-subscribe`;
5. keep the session alive;
6. receive current/change values through server state/set events;
7. use `set` only for writes.

No inspected public client provides evidence for a separate `get`/read request.

The `enum-labs` client also attempts to extract any server-supplied value attributes directly from device arrival before subscribing, matching the safe behavior already implemented in this project.

### Interpretation

This does **not** prove that no private/constructed read primitive exists in Focusrite Control. It does prove that inventing one from public examples would be unjustified.

## Current diagnostic: static official-client scan

Branch runner now performs a read-only static scan of already installed/running Focusrite binaries.

The scanner:

- discovers running Focusrite process executable locations locally;
- never prints or publishes those paths;
- reads only relevant Focusrite/control/server executable/library files;
- extracts ASCII and UTF-16LE strings in memory;
- publishes only normalized protocol-like token names and counts;
- never publishes raw binary strings;
- sends **no Focusrite protocol traffic**;
- modifies no Focusrite file/settings/software.

Sanitized result target:

- branch: `diagnostics/readback-results`;
- file: `diagnostics/runtime/latest-static-protocol-scan.md`.

The publisher re-fetches the remote branch and verifies exact content after push.

## What a static token means

A discovered token is only **research evidence**, not permission to transmit it.

For example, finding a read-like token such as `state-request` would justify further static/passive investigation of its real message shape. It would **not** justify constructing and sending a guessed XML request.

## If static scan finds no read candidate

Next safe step is passive observation of the official Focusrite client/session, preferably using already available OS/application diagnostics before installing any new capture software.

A passive observer must:

- send no unknown protocol command;
- sanitize output before publication;
- publish only message-root/schema summaries, never raw XML/IDs/hostnames/endpoints;
- avoid changing Focusrite software, firmware, routing or hardware state.

Direct raw USB remains secondary until the Control Server/official-client path is exhausted.
