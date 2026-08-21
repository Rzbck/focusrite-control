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
- `debug/cold-start-readback` — readback/protocol research tooling;
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

A purpose-built **read-only** Node probe ran successfully on the physical Scarlett 18i20 (3rd Gen). The sanitized result was automatically published to:

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

Results:

- Phase A — cold connect + one `subscribe=true`: **3/21** guarded Core values;
- Phase B — `subscribe=false` → `subscribe=true`: **3/21**;
- Phase C — clean TCP reconnect + one `subscribe=true`: **3/21**.

Present in all phases:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing in all phases:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

Phase B received a single server state packet with **404 items** and still did not include the missing 18 values. A/C also converged on the same 381 unique state IDs outside those missing controls.

### Conclusion

This is no longer a timing hypothesis.

**Do not continue delay/re-subscribe/reconnect experiments.** The standard Control Server subscription lifecycle has been physically tested and does not cold-read those 18 current values.

## Current research objective

Find a **separate read primitive or state source** for the missing controls.

Research order:

1. inspect public Control Server clients/research for additional session/read commands;
2. determine whether the official Focusrite Control application obtains these values through another server message/source;
3. if needed, create a sanitized read-only observer of the official client session;
4. keep direct raw USB secondary unless the Control Server is proven unable to expose the state.

Never invent an unobserved `<get>` command and send it to the real server.

## Automated diagnostics / privacy

The debug runner publishes only a validated sanitized report to `diagnostics/readback-results`.

Raw local logs remain gitignored. The publisher rejects private paths, endpoints, raw Focusrite XML, serials, hostnames, client/device IDs and related private data. After push it re-fetches the remote branch and verifies the exact published file.

Public-repo searches performed after the first successful auto-publication found no known user-specific path/username/client-ID markers in the repository.

## Runner UX

No intermediate Enter prompts are required during debug syntax/tests/probe/publication.

The debug path keeps **one final human pause** in root `RUN.bat` so the final result can be read before pressing a key to close.

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
