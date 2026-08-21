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
- `debug/official-client-read-source` — completed public/static read-source research tooling;
- `debug/official-client-passive-session` — current passive official-client session observer;
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

Public implementations inspected include:

- `Mathieu2301/Focusrite-Control-API`;
- `raduvarga/Focusrite-Midi-Control`;
- `sserolf/focusrite-midi-mapper-js`;
- `daveyijzermans/tally-server`;
- `enum-labs/focusrite-volume-control`;
- `dounix/focusrite-autoclock`;
- `sebastianrau/focusrite-mackie-control`.

All inspected clients rely on device arrival + subscription + server `set` events. None provides evidence for a separate read primitive.

`sebastianrau/focusrite-mackie-control` is especially relevant because it includes an 18i20 (3rd Gen) device-arrival schema plus a typed parser/client and still exposes no separate read request.

## Static official-client scan — completed on real Windows host

Sanitized result:

`diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md`

Observed:

- 2 running Focusrite processes;
- 4 relevant Focusrite EXE/DLL files scanned read-only;
- known protocol roots: `device-subscribe`, `keep-alive`, `server-announcement`, `set`;
- **no additional protocol-like XML root**.

Generic lexical strings such as `current-layer`, `read-only`, `save-snapshot` and Windows `ext-ms-*current*` are not protocol read commands. The scanner was hardened so only an actual unknown XML root can be promoted as a protocol candidate.

Do not rerun the same static scan unless installed Focusrite software or scanner coverage changes materially.

## Current technical objective — passive official client session

Branch:

`debug/official-client-passive-session`

The branch now contains a Windows Pktmon-based observer designed to answer what the **official Focusrite Control GUI itself** sends/receives during a fresh GUI connection.

Important design points:

- observer sends **zero Focusrite protocol messages**;
- server port is identified passively from the running Focusrite process/listener set;
- Pktmon captures only that TCP port;
- existing Pktmon filters cause a safe abort instead of being overwritten;
- raw ETL/PCAPNG are stored only under gitignored `.local-captures/`;
- global cleanup removes ETL/PCAPNG + the temporary filter even after errors;
- no Focusrite process is automatically killed/restarted;
- parser reconstructs Focusrite framed TCP messages locally;
- public output contains only message direction, XML root, root attribute names, counts and known 21-Core-ID coverage;
- public report forbids endpoints, port values, local paths, hostname, serial, client key/device ID, raw XML and state values;
- sanitized publication is remotely re-fetched and byte-verified.

Expected public result:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

The real capture requires the user to close only the Focusrite Control GUI window and reopen it during the short capture window, without touching Air/Pad/Mute/Dim/Talkback.

### Decision rules after the passive capture

- unknown official XML root observed → inspect its exact observed direction/schema; never transmit a guessed form;
- no unknown root but missing 18 Core IDs appear in official server→client `set` traffic → investigate why official session identity/subscription receives a different snapshot;
- no unknown root and missing 18 remain absent → normal Control Server TCP state path likely cannot cold-read those values, so make a deliberate product/state-source decision instead of more timing experiments.

Direct raw USB remains separate/secondary and must not silently enter the public Companion module.

## Automated diagnostics / privacy

Raw `.local-logs`, `.local-captures`, ETL/PCAPNG, raw XML/captures, private paths, endpoints, ports, hostnames, serials and client/device IDs stay local and gitignored.

Future AI/contributors should fetch the applicable sanitized result from `diagnostics/readback-results` before asking the user for logs.

Public-repo searches after successful readback/static publications found no known user-specific path/username/client-ID markers.

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
- scope expansion beyond Scarlett 18i20 (3rd Gen) without physical testing;
- GitHub Actions in this personal repo.

## Publication / Slack state

A repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better future repository/module scope because the transport is Focusrite Control Server, and offered hardware for future testing.

Only Scarlett 18i20 (3rd Gen) is validated today. The official Bitfocus repository/naming decision is still pending. Stable public target remains `v1.0.0` unless maintainers direct otherwise.
