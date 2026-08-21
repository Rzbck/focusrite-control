# AI / contributor handoff

Updated: 2026-08-21

## Read first

1. `README.md`
2. `AI_PROJECT_RULES.md`
3. `docs/PROJECT_STATE.md`
4. `docs/BITFOCUS_SLACK_AND_RELEASE.md`
5. `docs/GITHUB_WORKFLOW.md`
6. `docs/AUTOMATED_DIAGNOSTICS.md`
7. `docs/COLD_START_READBACK.md` on the debug branch for protocol details
8. current code/tests

Do not start from old chat assumptions when these files exist.

## Project in one sentence

Build a safe Bitfocus Companion module for **Scarlett 18i20 (3rd Gen)** over local Focusrite Control Server, then publish through the official Bitfocus workflow once repository/naming is decided.

No broader hardware support may be claimed without physical testing.

## Current baseline

Integration baseline: **v0.1.12**.

The Windows build passed format/lint/manifest/tests/package validation and loaded in Companion 5.0.3. Dynamic discovery, TCP, exact-model detection, Remote Devices authorization and final status `OK` are hardware-confirmed.

The guarded control mappings for Air 1–8, Pad 1–8, Input 1/2 mode, Monitor Mute, Monitor Dim and Talkback were previously hardware-tested with server confirmation + restoration when initial state was known.

## Critical new hardware result — 2026-08-21

The read-only cold-start probe has now run successfully on the physical Scarlett and auto-published a sanitized result to:

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

Result:

- Phase A cold connect + one subscribe: **3/21**;
- Phase B unsubscribe → subscribe: **3/21**;
- Phase C clean reconnect + subscribe: **3/21**.

Only Input 1 Mode, Input 2 Mode and Talkback were present.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim were absent in every phase.

Phase B received a **404-item** state packet and still omitted those 18 values.

### Therefore

**The timing/re-subscribe hypothesis is closed.**

Do not add more delays, repeated subscriptions or reconnect loops. Do not write hardware merely to warm the cache. Do not invent a `<get>` request.

## Immediate next technical objective

Research a **separate read primitive/state source** for those 18 values.

Priority:

1. public Focusrite Control Server clients/research for additional commands/state sources;
2. official Focusrite Control client behavior;
3. if needed, a sanitized read-only observer of the official client/session;
4. direct raw USB remains secondary unless Control Server capability is proven insufficient.

No module version bump should occur until a real read mechanism is proven or a deliberate product decision is made about unavailable cold-start state.

## Repository / validation policy

This personal development repository uses **no GitHub Actions**.

Use local `RUN.bat` / Node / Yarn validation. Future official Bitfocus CI rules apply only to the future official repo.

Branches:

- `main` — integration baseline + current docs;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `debug/cold-start-readback` — current protocol research tooling;
- `diagnostics/readback-results` — sanitized machine-generated results.

## Automated diagnostics/privacy

Future AI/contributors should read `diagnostics/runtime/latest-readback.md` from `diagnostics/readback-results` before asking the user for logs.

Never auto-upload `.local-logs`, raw XML/captures, private paths, hostname, endpoint, serial or client/device IDs.

The diagnostics publisher validates the report, pushes through a temporary worktree, then re-fetches the remote branch and verifies exact content.

Public repo searches after the successful publication found no known user-specific path/username/client-ID markers.

## Runner UX

The debug workflow has no intermediate Enter prompts. Root `RUN.bat` keeps **one final human pause only** so the user can read the final result and press a key to close.

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
