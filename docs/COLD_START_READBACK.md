# Cold-start readback investigation

Updated: 2026-08-21

## Problem statement

The protocol mapping for Air, Pad, Monitor Mute and Monitor Dim is proven useful on real hardware, but after a fresh module process their **initial current values** are not consistently received.

This prevents safe reversible testing because restoration requires a known pre-test state.

## Evidence pattern

Across real sessions:

1. one warm-cache session had all guarded Core values;
2. after module reload, Air/Pad/Mute/Dim were missing while Talkback and Input 1/2 mode remained known;
3. later, some missing values reappeared partially (including a real `true` Pad value);
4. a later fresh reload again lost those values.

This behavior is consistent with state being learned when server `<set>` events occur rather than a guaranteed full snapshot for every control at subscription time.

## What is already proven

- IDs/mappings for the guarded controls;
- approved writes can change the real hardware;
- server `<set>` responses can confirm those changes;
- values can be restored after a guarded test when the initial state is known.

## What is not proven

- a read-only request that returns every current Core value at cold start;
- whether Focusrite Control's official client uses another state source or command;
- whether unsubscribe/resubscribe or clean reconnect can force a complete snapshot.

## Current checked-in diagnostic

Branch: `debug/cold-start-readback`.

The branch now contains a Node-based read-only probe:

- `tools/readback-probe-lib.js` — framing, dynamic Core target derivation and hard outgoing allowlist;
- `tools/readonly-state-probe.js` — real Control Server diagnostic;
- `test/readback-probe.test.js` — safety/state tests;
- `tools/RUN_BRANCH.bat` — branch runner used automatically by root `RUN.bat` / `UPDATE_AND_RUN.bat`;
- `tools/ENSURE_NODE22.ps1` — portable Node 22 bootstrap reused from the previously successful Windows builder approach.

Local pre-publication validation of this debug change:

- probe syntax: pass;
- dedicated probe tests: **6/6 pass**;
- complete repository Node test suite with probe tests: **29/29 pass**;
- static probe safety/privacy scan: pass;
- portable Node bootstrap static regression scan: pass.

No module version was bumped. The probe is research tooling, not a module behavior change.

## Probe safety model

TCP transmit roots are hard-allowlisted to:

- `client-details`;
- `device-subscribe` (`true` or `false`);
- `keep-alive`.

Any other outgoing TCP XML root is rejected. Hardware `<set>` is explicitly rejected.

UDP discovery uses only the exact proven packet:

`<client-discovery app="SAFFIRE-CONTROL" version="4"/>`

The probe does not log raw XML, serial, hostname, server port, client ID or device ID. It writes a sanitized `probe-results/readonly_state_probe_*.txt` report, and `probe-results/` is gitignored.

## Phases tested by the probe

A. cold TCP connect + one `subscribe=true`;

B. same session: `subscribe=false` then `subscribe=true`;

C. clean TCP reconnect + one `subscribe=true`.

Each phase reports which of the dynamically derived 21 guarded Core controls was actually confirmed by server data. Missing values stay missing; no default is invented.

## How to run on Windows

From a clone of this repository:

1. run `UPDATE_AND_RUN.bat`;
2. choose `DEBUG - debug/cold-start-readback`;
3. leave Focusrite Control open;
4. do not touch Air/Pad/Mute/Dim/Talkback during the ~25 second probe;
5. send back only the sanitized file created in `probe-results`.

If a compatible Node 22 is not already available, the branch runner downloads an official portable Node 22 into the gitignored `.build-tools` folder, verifies the official SHA-256, and uses it only inside this repository. If bootstrap fails, the probe does not start and there is no hardware-write fallback.

## Rules for investigation

- no hardware `<set>` writes merely to discover current state;
- no guessed defaults;
- no private raw captures committed to this public repository;
- diagnostic code must log only sanitized state coverage/results;
- experimental probes live on `debug/cold-start-readback` until proven;
- no new module release/version for a speculative timing change.

## Decision after the real probe

- If one phase consistently reaches **21/21**, reproduce that exact read-only handshake and test it before modifying module startup.
- If B/C only improve partially, inspect the exact sanitized delta before any code change.
- If none improves the cold snapshot, stop timing/resubscribe experiments and research a separate read primitive/state source used by Focusrite Control.

## Exit criteria

Promote a bootstrap/readback change only when a read-only mechanism consistently yields the required current values on the physical Scarlett after a fresh process start.
