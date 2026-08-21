# Project state

Updated: 2026-08-21

## Current integration baseline

`v0.1.12`

The development checkpoint on `main` was built and loaded successfully on Windows / Companion 5.0.3.

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

Runtime after loading v0.1.12:

- dynamic discovery: pass;
- dynamic TCP connect: pass;
- exact model: pass;
- server-confirmed state received: pass;
- Remote Devices authorization: pass;
- final Companion status: `OK`.

## Repository policy

`Rzbck/focusrite-control` is the personal development/source-of-truth mirror.

**GitHub Actions are not used in this repository.** Validation is local through the checked-in Windows/Node/Yarn workflow. A future official Bitfocus repository may have different maintainer-required CI.

## Branches

- `main` — latest testable integration baseline + current project documentation;
- `backup/v0.1.12-user-loaded-20260820` — immutable v0.1.12 checkpoint that loaded and reached `OK`;
- `debug/cold-start-readback` — completed read-only subscription lifecycle experiment/evidence;
- `debug/official-client-read-source` — current read-only static official-client research branch;
- `diagnostics/readback-results` — machine-generated sanitized diagnostic results only.

Do not move the backup branch for convenience.

## Hardware-tested controls

A guarded reversible hardware sequence previously completed through Companion / Focusrite Control Server:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

These mappings/write paths are hardware-tested. This does **not** mean every current value is available from a cold-start subscription.

## Cold-start readback — hardware result 2026-08-21

Sanitized hardware result:

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

- Phase A — cold connect + one subscribe: **3/21**;
- Phase B — unsubscribe → subscribe: **3/21**;
- Phase C — clean reconnect + subscribe: **3/21**.

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing in all phases: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

Phase B received a single server state packet with **404 items** and still omitted the 18 controls. A/C converged on the same 381 unique state IDs.

### Conclusion

**Timing/re-subscribe/reconnect research is closed.** Do not add more delays/loops, do not write values merely to warm state, and do not invent an unobserved read request.

## Public Control Server research

Public clients inspected after the hardware result:

- `Mathieu2301/Focusrite-Control-API`;
- `raduvarga/Focusrite-Midi-Control`;
- `sserolf/focusrite-midi-mapper-js`;
- `daveyijzermans/tally-server`;
- `enum-labs/focusrite-volume-control`.

All inspected clients rely on device arrival + subscription + server state/set events. None provides evidence for a separate read primitive.

This does not prove the official Focusrite application lacks a private/constructed read source.

## Current research branch

`debug/official-client-read-source`

The branch contains a read-only static scanner for the already installed/running Focusrite software. It:

- sends no Focusrite protocol traffic;
- changes no Focusrite file/settings;
- reads relevant Focusrite/control/server EXE/DLL binaries in bounded chunks;
- keeps local executable paths private;
- never publishes raw binary strings;
- publishes only normalized token names/counts;
- targets `diagnostics/runtime/latest-static-protocol-scan.md`;
- re-fetches and verifies exact remote content after publication.

Dedicated static scanner/publisher tests: **6/6 pass**, including a real temporary Git remote commit/push/fetch/readback/idempotence test.

If no credible static read candidate is found, the next safe direction is passive official-client session observation. Installing new capture software requires explicit user agreement.

## Automated diagnostics / privacy

Raw `.local-logs`, raw XML/captures, private paths, endpoints, hostnames, serials and client/device IDs stay local and gitignored.

Public-repo searches after the first successful readback publication found no known user-specific path/username/client-ID markers.

## Runner UX

Debug tasks run without intermediate Enter prompts. Root `RUN.bat` keeps **one final human pause** so the result can be read before pressing a key to close.

## Forbidden / rejected approaches

- guessing absent booleans as `false`;
- writing values merely to warm cache/readback;
- repeated timed subscription loops;
- requiring 21/21 Core values merely to mark the whole module connected;
- last-known persistent values presented as current state;
- Monitor gain `1677` writes/actions/presets/raw writes;
- unsafe/unknown raw writes;
- scope expansion beyond Scarlett 18i20 (3rd Gen) without physical testing.

## Publication / Slack state

A repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better future repository/module scope because the transport is Focusrite Control Server, and offered hardware for future testing.

Only Scarlett 18i20 (3rd Gen) is validated today. The official Bitfocus repository/naming decision is still pending. Stable public target remains `v1.0.0` unless maintainers direct otherwise.
