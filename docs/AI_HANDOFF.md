# AI / contributor handoff

Updated: 2026-08-21

## Read first

1. `README.md`
2. `AI_PROJECT_RULES.md`
3. `docs/PROJECT_STATE.md`
4. `docs/BITFOCUS_SLACK_AND_RELEASE.md`
5. `docs/GITHUB_WORKFLOW.md`
6. `docs/AUTOMATED_DIAGNOSTICS.md`
7. `docs/COLD_START_READBACK.md` on `debug/cold-start-readback`
8. `docs/OFFICIAL_CLIENT_READ_SOURCE.md` on `debug/official-client-read-source`
9. `docs/OFFICIAL_CLIENT_PASSIVE_SESSION.md` on `debug/official-client-passive-session`
10. current code/tests

Do not start from old chat assumptions when these files exist.

## Project in one sentence

Build a safe Bitfocus Companion module for **Scarlett 18i20 (3rd Gen)** over local Focusrite Control Server, then publish through the official Bitfocus workflow once repository/naming is decided.

No broader hardware support may be claimed without physical testing.

## Current baseline

Integration baseline: **v0.1.12**.

The Windows build passed format/lint/manifest/tests/package validation and loaded in Companion 5.0.3. Dynamic discovery, TCP, exact-model detection, Remote Devices authorization and final status `OK` are hardware-confirmed.

The guarded control mappings for Air 1–8, Pad 1–8, Input 1/2 mode, Monitor Mute, Monitor Dim and Talkback were previously hardware-tested with server confirmation + restoration when initial state was known.

## Definitive cold-start hardware result — 2026-08-21

Sanitized result:

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

- Phase A cold connect + one subscribe: **3/21**;
- Phase B unsubscribe → subscribe: **3/21**;
- Phase C clean reconnect + subscribe: **3/21**.

Only Input 1 Mode, Input 2 Mode and Talkback were present. Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim were absent in every phase.

Phase B received a **404-item** state packet and still omitted those 18 values.

**The timing/re-subscribe hypothesis is closed.** Do not add delays, repeated subscriptions/reconnect loops, write-to-warm behavior or an invented `get` request.

## Public protocol research after that result

Public clients/research inspected include:

- `Mathieu2301/Focusrite-Control-API`;
- `raduvarga/Focusrite-Midi-Control`;
- `sserolf/focusrite-midi-mapper-js`;
- `daveyijzermans/tally-server`;
- `enum-labs/focusrite-volume-control`;
- `dounix/focusrite-autoclock`;
- `sebastianrau/focusrite-mackie-control`.

All inspected clients use the same subscription/event state model. None provides evidence for a separate read command.

`sebastianrau/focusrite-mackie-control` is especially relevant because it contains an 18i20 (3rd Gen) device-arrival schema and typed parser/client. Its parser recognizes only `client-details`, `set`, `device-arrival`, `device-removal`, `keep-alive` and `approval`; its client likewise exposes no separate read request.

## Static official-client scan — completed

Sanitized result:

`diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md`

Real Windows result:

- 2 Focusrite processes discovered;
- 4 relevant EXE/DLL files scanned read-only;
- known protocol roots found: `device-subscribe`, `keep-alive`, `server-announcement`, `set`;
- **no additional protocol-like XML root found**.

The first scanner report surfaced generic lexical strings (`current-layer`, `read-only`, `save-snapshot`, Windows `ext-ms-*current*`). These are not readback commands. The scanner was hardened so only a previously unknown actual XML root can trigger a read-protocol candidate decision.

Do not rerun the same static scan unless installed Focusrite software or scanner coverage changes materially.

## Current research branch — passive official-client session

Branch:

`debug/official-client-passive-session`

Purpose: observe what the **official Focusrite Control client actually sends/receives** during a fresh GUI connection without sending any Focusrite protocol traffic from the observer.

Checked-in tooling:

- `tools/CAPTURE_OFFICIAL_SESSION.ps1` — Windows Pktmon capture harness;
- `tools/passive-session-observer-lib.js` — PCAPNG/TCP/Focusrite frame parser + sanitizer;
- `tools/parse-passive-session.js` — local sanitized report generator;
- `tools/publish-sanitized-passive-session.js` — diagnostics publisher with remote verification;
- `tools/passive-session-status-lib.js` + `tools/publish-sanitized-passive-status.js` — fixed-schema sanitized stage/code status path;
- dedicated parser/privacy/publisher/status tests;
- branch-specific `tools/RUN_BRANCH.bat`.

Safety/privacy design:

- observer sends **zero Focusrite protocol messages**;
- server port is identified passively from running Focusrite processes/listeners;
- Pktmon is filtered to that TCP port only;
- existing Pktmon filters cause a safe abort rather than being overwritten;
- raw ETL/PCAPNG live only under gitignored `.local-captures/`;
- a global cleanup path removes raw captures and the temporary Pktmon filter even after failures;
- no Focusrite process is killed/restarted automatically;
- Companion traffic is excluded locally from the official-client analysis;
- only direction + XML root + root attribute names + known Core ID coverage are eligible for publication;
- ports, endpoints, paths, hostname, serial, client keys/device IDs, raw XML and values are forbidden from the public report.

### Passive harness attempts so far

Two Windows attempts reached the UAC/elevation boundary but **did not reach the visible `CAPTURE PASSIVE OFFICIELLE FOCUSRITE EN COURS` capture window**. Therefore they are **not protocol evidence** and must not be interpreted as a Focusrite readback result.

The second attempt exposed a status serialization/decoding failure (`Invalid passive-session status outcome`). The branch was hardened afterward:

- status is written using explicit .NET ASCII bytes;
- Node accepts ASCII/UTF-8 BOM/UTF-16LE status files;
- an unreadable/missing status maps to a fixed sanitized `status-file-invalid` / `status-file-missing` fallback instead of breaking publication;
- no raw status/log content is ever uploaded.

Next real evidence still requires a successful passive capture window.

Human action during the real capture: close only the Focusrite Control GUI window, reopen it normally, leave Air/Pad/Mute/Dim/Talkback untouched, then wait for the automatic timeout. No intermediate Enter prompt; root `RUN.bat` retains one final human pause only.

Expected public result after successful run:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

Sanitized harness status path (success or controlled failure):

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md`

### Decision from that capture

- unknown client/server XML root observed → research its exact official shape/direction, **do not transmit a guess**;
- no unknown root, but missing 18 Core IDs appear server→client → investigate why official session identity/subscription receives a different snapshot;
- no unknown root and missing 18 still absent → normal Control Server TCP state path likely cannot cold-read those values; make a deliberate product/state-source decision rather than more timing experiments.

Direct raw USB remains separate/secondary and must not silently enter the public Companion module.

## Repository / validation policy

This personal development repository uses **no GitHub Actions**. Use local `RUN.bat` / Node / Yarn validation. Future official Bitfocus CI rules apply only to the future official repo.

Branches:

- `main` — integration baseline + current docs;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `debug/cold-start-readback` — completed cold-start readback experiment/evidence;
- `debug/official-client-read-source` — completed static/public read-source research tooling;
- `debug/official-client-passive-session` — current passive official-session observer;
- `diagnostics/readback-results` — sanitized machine-generated results.

## Automated diagnostics/privacy

Future AI/contributors should fetch the latest applicable file from `diagnostics/readback-results` before asking the user for logs.

Never auto-upload `.local-logs`, `.local-captures`, ETL/PCAPNG, raw XML/captures, private paths, hostname, endpoint, port, serial or client/device IDs.

Public repo searches after successful readback/static publications found no known user-specific path/username/client-ID markers.

## Runner UX

No intermediate Enter prompts. Root `RUN.bat` keeps **one final human pause only** so the user can read the status and press a key to close.

## Slack / official publication

The first repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better eventual scope because the transport is Focusrite Control Server and offered hardware for future testing.

Only Scarlett 18i20 (3rd Gen) is validated today. Official Bitfocus repository/naming decision remains pending. Stable target remains `v1.0.0` unless maintainers direct otherwise.

## Do not do

- do not guess missing current values;
- do not fake feedback through optimistic state;
- do not re-add Monitor gain 1677 writes/actions/presets/raw writes;
- do not expose unsafe/unknown raw writes;
- do not expand supported hardware without testing;
- do not publish private diagnostics/captures;
- do not add GitHub Actions to this personal repo;
- do not update Focusrite software/firmware/settings without explicit agreement.
