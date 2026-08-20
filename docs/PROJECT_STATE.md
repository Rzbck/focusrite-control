# Project state

Updated: 2026-08-21

## Current integration baseline

`v0.1.12`

Published development checkpoint on `main` was built and loaded successfully on Windows / Companion 5.0.3.

Validation evidence for the checkpoint:

- Prettier: pass;
- ESLint: pass;
- source manifest validation: pass;
- source entrypoint smoke: pass;
- Node tests: **23/23 pass**;
- official `companion-module-build`: pass;
- packaged manifest: module `0.1.12`, Module API `2.0.0`;
- packaged entrypoint smoke: pass;
- privacy / forbidden-feature scans: pass.

Runtime after loading in Companion 5.0.3:

- dynamic discovery: pass;
- dynamic TCP connect: pass;
- exact model: pass;
- server-confirmed state received: pass (381 values observed at the successful v0.1.12 startup);
- Remote Devices authorization: pass;
- final Companion status: `OK`.

## Repository policy

`Rzbck/focusrite-control` is the personal development/source-of-truth mirror.

**GitHub Actions are not used in this repository.** Local validation through `RUN.bat` / Node / Yarn is authoritative for this development workspace. Do not add or wait on GitHub Actions here.

If the future official Bitfocus repository has maintainer-required CI, that applies to the official repository only.

## Branch checkpoints

- `main` — latest testable integration baseline and current documentation.
- `backup/v0.1.12-user-loaded-20260820` — immutable checkpoint of the v0.1.12 baseline that loaded and reached `OK`.
- `debug/cold-start-readback` — current research branch for the unresolved startup-state problem.

The backup branch must not be moved for convenience.

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
- persisting last-known values and presenting them as current server state;
- shipping a new module version for each unproven timing experiment.

## Publication / Slack state

A first repository request was posted in Companion Slack `#module-development` for the Focusrite Scarlett 18i20 module.

Bryce Seifert suggested `focusrite-control` may be the better module/repository scope because the transport is Focusrite Control Server, and offered hardware for future testing. The project replied that only Scarlett 18i20 (3rd Gen) is validated today and that broader naming is acceptable if Bitfocus prefers it, without claiming untested devices.

The official Bitfocus repository/naming decision is still pending. See `docs/BITFOCUS_SLACK_AND_RELEASE.md`.

## Next technical objective

On `debug/cold-start-readback`, isolate the Focusrite Control Server cold-start read path **without changing hardware state**.

The next diagnostic should be implemented as checked-in, testable Node tooling rather than another ad-hoc PowerShell probe. It must have an explicit outgoing-message allowlist and no hardware `<set>` transmit path.

Only after the readback mechanism is proven should module startup logic change.
