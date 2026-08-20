# Cold-start readback investigation

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

## Rules for investigation

- no hardware `<set>` writes merely to discover current state;
- no guessed defaults;
- no private raw captures committed to this public repository;
- diagnostic code must log only sanitized state coverage/results;
- experimental probes live on `debug/cold-start-readback` until proven.

## Exit criteria

Promote a bootstrap/readback change only when a read-only mechanism consistently yields the required current values on the physical Scarlett after a fresh process start.
