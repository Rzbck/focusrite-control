# Cold-start readback investigation

Updated: 2026-08-21

## Problem statement

The protocol mapping for Air, Pad, Monitor Mute and Monitor Dim is proven useful on real hardware, but after a fresh client process their **initial current values** are not provided by the standard Control Server subscription snapshot.

This prevents safe reversible testing because restoration requires a known pre-test state.

## What is already proven

- IDs/mappings for the guarded controls;
- approved writes can change the real hardware;
- server `<set>` responses confirm those changes;
- values can be restored after a guarded test when the initial state is known;
- dynamic discovery/session/authentication work correctly.

## Definitive read-only hardware probe — 2026-08-21

The checked-in Node probe ran successfully on the physical Scarlett 18i20 (3rd Gen) and automatically published its sanitized report to:

- branch: `diagnostics/readback-results`;
- file: `diagnostics/runtime/latest-readback.md`.

All three read-only subscription lifecycle phases produced exactly the same guarded-Core coverage:

- **Phase A — cold connect + one `subscribe=true`: 3/21**;
- **Phase B — `subscribe=false` then `subscribe=true`: 3/21**;
- **Phase C — clean TCP reconnect + one `subscribe=true`: 3/21**.

The three values present were:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

The 18 values absent in every phase were:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

Important detail: Phase B received a single server state packet containing **404 items** while still producing only 3/21 guarded Core values. Phase A/C also observed the same 381 unique non-Core/current-state IDs. This is strong hardware evidence that the missing 18 values are not being lost because the module stopped listening too early.

## Decision from the probe

**Stop timing/re-subscribe experiments.**

Do not add:

- longer startup delays;
- repeated `subscribe=true` loops;
- reconnect loops intended only to warm state;
- guessed boolean defaults;
- hardware writes merely to provoke a readback event.

The standard subscription lifecycle has now been explicitly tested and does not provide these 18 cold-start values.

## Next research target

Research a **separate read primitive or state source** used by Focusrite Control for these controls.

Priority order:

1. inspect public Focusrite Control Server clients/research for any command beyond `client-details`, `device-subscribe`, `keep-alive` and `set`;
2. determine whether the official Focusrite Control application obtains these values through another Control Server message/state source;
3. if public research is insufficient, build a sanitized read-only observer for the official client/session rather than inventing a request;
4. keep raw USB research secondary unless Control Server is proven incapable of exposing the required current state.

No unproven `<get>` or other XML request may be invented and sent to the real device/server.

## Probe safety model

The current diagnostic transmit path hard-allowlists only:

- `client-details`;
- `device-subscribe` (`true` or `false`);
- `keep-alive`.

Any other outgoing TCP XML root is rejected. Hardware `<set>` is explicitly rejected.

UDP discovery uses only the exact proven packet:

`<client-discovery app="SAFFIRE-CONTROL" version="4"/>`

The public diagnostic report excludes raw XML, serial, hostname, endpoint, client ID, device ID and local paths.

## Automated diagnostics

A successful debug run publishes only the sanitized report to `diagnostics/readback-results`. Raw `.local-logs` stay local and gitignored.

The publisher now:

- validates the sanitized schema/privacy rules;
- writes through a temporary Git worktree;
- pushes only `diagnostics/runtime/latest-readback.md`;
- fetches the remote branch again;
- verifies that the remote file exactly matches the sanitized local report;
- has a Git integration test using a temporary repository + bare remote + push/fetch/readback.

## Human runner behavior

There are no intermediate `pause` prompts during syntax/tests/probe/publication. Root `RUN.bat` keeps **one final pause only** so the human can read the final status and press a key to close.

## Exit criteria for module change

Do not change module startup readback semantics until a read-only mechanism is demonstrated on the physical Scarlett that provides the missing current values, or until a deliberate product decision accepts those values as unavailable-at-cold-start and adjusts exposed feedback/action behavior accordingly.
