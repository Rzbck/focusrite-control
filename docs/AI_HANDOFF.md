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
9. current code/tests

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

Public clients inspected:

- `Mathieu2301/Focusrite-Control-API`;
- `raduvarga/Focusrite-Midi-Control`;
- `sserolf/focusrite-midi-mapper-js`;
- `daveyijzermans/tally-server`;
- `enum-labs/focusrite-volume-control`.

All inspected clients use the same subscription/event state model. None provides evidence for a separate read command. This is research evidence, not proof that the official Focusrite application has no private/constructed state source.

## Current next branch

`debug/official-client-read-source`

Purpose: inspect the already installed/running official Focusrite software **read-only** for protocol/message clues before attempting any passive session observer.

Checked-in tooling:

- `tools/static-protocol-scan-lib.js`;
- `tools/scan-official-focusrite-static.js`;
- `tools/publish-sanitized-static-scan.js`;
- `test/static-protocol-scan.test.js`;
- branch-specific `tools/RUN_BRANCH.bat`.

The static scan:

- sends no Focusrite protocol traffic;
- modifies no binaries/settings;
- reads relevant running Focusrite EXE/DLL files in bounded chunks;
- does not publish local paths or raw strings;
- publishes only normalized token names/counts;
- pushes to `diagnostics/runtime/latest-static-protocol-scan.md`;
- re-fetches and verifies exact remote content.

Local pre-push tests for the scanner/publisher: **6/6 pass**, including a temporary Git repo + bare remote + commit/push/fetch/readback + idempotent second run.

If the static scan finds no credible read-like candidate, the next safe step is passive official-client session observation. Do not install capture software or change Focusrite software without explicit user agreement.

## Repository / validation policy

This personal development repository uses **no GitHub Actions**. Use local `RUN.bat` / Node / Yarn validation. Future official Bitfocus CI rules apply only to the future official repo.

Branches:

- `main` — integration baseline + current docs;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `debug/cold-start-readback` — completed cold-start readback experiment/evidence;
- `debug/official-client-read-source` — current research branch;
- `diagnostics/readback-results` — sanitized machine-generated results.

## Automated diagnostics/privacy

Future AI/contributors should fetch the latest applicable file from `diagnostics/readback-results` before asking the user for logs.

Never auto-upload `.local-logs`, raw XML/captures, private paths, hostname, endpoint, serial or client/device IDs.

Public repo searches after the successful readback publication found no known user-specific path/username/client-ID markers.

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
- do not update Focusrite software/firmware/settings without explicit agreement.
