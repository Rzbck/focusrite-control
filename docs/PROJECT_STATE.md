# Project state

Updated: 2026-08-20

## Current integration baseline

`v0.1.12`

Windows build result:

- Prettier: pass;
- ESLint: pass;
- source manifest validation: pass;
- source entrypoint smoke: pass;
- Node tests: **23/23 pass**;
- official `companion-module-build`: pass;
- packaged manifest: module `0.1.12`, Module API `2.0.0`;
- packaged entrypoint smoke: pass.

Runtime after loading in Companion 5.0.3:

- dynamic discovery: pass;
- dynamic TCP connect: pass;
- exact model: pass;
- server-confirmed state received: pass (381 values observed at the successful v0.1.12 startup);
- Remote Devices authorization: pass;
- final Companion status: `OK`.

## Hardware-tested

Guarded reversible hardware test sequence completed previously through Companion / Focusrite Control Server:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

The sequence used server-confirmed values and restoration. This is control-path evidence, not proof that v0.1.12 has solved cold-start state acquisition.

## Implemented but not all individually hardware-audited

Capability-driven parsed schema support includes outputs, mixer strips/slots, monitoring alternatives, clock/sample-rate, Digital I/O settings, nicknames and restricted Advanced Raw choices.

Do not call every implemented schema feature hardware-tested.

## Blocking research issue

Fresh module startup can leave these variables unknown:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

Talkback and Input 1/2 mode have been observed available during the same cold-start failures.

A prior warm-cache session had all 21 guarded Core states available. Subsequent reloads showed zero or partial repopulation. This strongly suggests event-driven cache population for these controls rather than a reliable complete cold-start snapshot.

The TestBench correctly blocks the hardware phase when restoration state is unknown.

## Rejected approaches

- guessing absent booleans as `false`;
- repeated timed `subscribe=true` requests;
- requiring 21/21 Core state before declaring the module connected;
- writing values merely to force readback/cache population;
- persisting last-known values and presenting them as current server state.

## Next technical objective

Isolate the Focusrite Control Server cold-start read path without changing hardware state. The `debug/cold-start-readback` branch owns this investigation.
