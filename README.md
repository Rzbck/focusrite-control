# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module controlling the **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here

Do not resume this project from an old chat, copied handoff, uploaded historical file, `main` alone, or an embedded SHA.

First resolve the live repository state and newest material branch movement, then read:

1. [`HANDOFF`](HANDOFF)
2. [`AI_PROJECT_RULES.md`](AI_PROJECT_RULES.md)
3. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
4. [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md)
5. [`docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md`](docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md)
6. [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md)
7. [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md)
8. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
9. relevant current source/tests/evidence

Evidence priority: newest explicit hardware/user-host result → current code/tests → current handoff → current matrix/docs → older captures/assumptions.

## Current objective

The final deliverable is a clean, safe, maintainable **Bitfocus Companion module** using Focusrite Control Server as transport.

The current parent objective remains **explicit hardware feedback/protocol closure before release**. Feedback/meter coverage is now largely closed for the current configuration; the remaining material work is the **public Companion action write-surface audit**.

Future Focusrite models may be added only after real hardware testing. A possible wider repository name such as `focusrite-control` is not a claim of universal Focusrite support.

## Current branch and package

Objective branch:

`testbench/meter-routing-exact-restore`

Current package version:

`0.1.19`

Latest fully green user-host software checkpoint:

`e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7`

Passed:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies;
- Prettier;
- ESLint;
- source manifest validation;
- **279/279 Node tests**;
- Companion package build;
- package `focusrite-scarlett-18i20-0.1.19.tgz`.

No hardware write was performed by that software gate.

## Latest hardware evidence — ALT / Speaker Switching and meters

Newest sanitized manual feedback sweep reportVersion 6:

- updated `2026-08-26T06:29:16.831Z`;
- exact report SHA-256 `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`;
- read-only harness;
- zero harness Focusrite writes;
- zero harness Companion button presses;
- 829 feedback probes across 31 public feedback definitions;
- 11 recorded feedback transitions;
- **11 PASS**;
- **0 transient race**;
- **0 confirmed mismatch**.

### ALT / Speaker Switching

The newest REC dynamically closed feedback/readback for both:

- `monitor_alt_enable`: three PASS transitions, both states;
- `monitor_alt`: four PASS transitions, both states.

Human Output 3 availability also changed with Speaker Switching enable, confirming runtime ownership/availability behavior. Availability must remain server-confirmed and dynamic.

This is official-UI readback proof. Companion ALT writes still belong in the final action audit.

### Meters

Newest aggregate:

- **42/46** meters closed with floor + movement;
- Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- **Custom Mix meters: 12/12 closed**;
- human Outputs 21-24 remain floor-only because `available=false` in the current configuration;
- movement-only: **0**;
- never observed: **0**;
- persistent mismatch: **0**.

There are **no remaining Custom Mix meter gaps**. Outputs 21-24 are **CONFIGURATION_UNAVAILABLE**, not unsupported. Do not change sample rate or Digital I/O mode merely for meter coverage.

## Custom Mix navigation

Simply selecting another Output/Custom Mix view in Focusrite Control does not need to emit hardware/server state. The active page is application UI state.

The recorder does observe real state when an Output is actually routed to **Custom Mix**. That is the useful protocol behavior. Do not invent or chase a separate "currently viewed Custom Mix" item.

## User-facing terminology

When guiding hardware tests, use the terms visible in Focusrite Control:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Internal TestBench labels may remain in code/diagnostics only when necessary to identify stored paths.

## Output `assign-mix`

Current evidence:

- descriptor present on **26/26 outputs**;
- materialised server value on **0/26**;
- still unobserved during active Playback / Analogue / Custom Mix / digital routing;
- raw semantics: **UNKNOWN**;
- write transaction: **UNKNOWN**;
- public action/preset/feedback: **none**;
- Advanced Raw write: **none**.

Do not rerun `NAVIGATE_MIXES` and do not chase `assign-mix` with blind/raw writes. It is not a v1 blocker.

## Retained broad readback evidence

The preceding broad reportVersion 6 at `2026-08-26T05:59:47.636Z` remains the stronger readback sweep for the controls it exercised:

- **193/193 PASS**, zero mismatch;
- real Custom Mix mono/stereo source materialisation across multiple mixer-slot pairs;
- broad Custom Mix Mute/Solo readback plus fader/pan semantic movement;
- representative analogue and digital Output Mute/Stereo/Source behavior;
- direct output gain exists only on **Outputs 1-10**, not S/PDIF/ADAT/digital Outputs 11-26.

Do not repeat those tests merely for coverage.

## Remaining material work

The remaining release work is narrower and action-focused:

1. **ALT / Speaker Switching Companion writes** — audit `monitor_alt` and `monitor_alt_enable` against the newly proven UI behavior; if needed use one targeted exact-restorable Companion write test.
2. **Custom Mix public writes** — audit Mute, Solo, fader set/adjust and pan. Broad UI/readback is strong, but arbitrary write combinations still need representative exact-restore proof or tighter policy/withholding.
3. **Disruptive settings actions** — Device Preset, Clock Source, Sample Rate and Digital I/O mode are still defined as actions. Safest v1 default is **withhold** unless a deliberate approved hardware campaign is requested. Do not change them merely for coverage.
4. **Nickname writes** — low-risk but not equivalently hardware-tested; either use a temporary synthetic exact-restore test or keep them labelled implemented/schema-observed.
5. **Allowed Output writes** — audit every option still visible after `hardware-policy.js` filtering against retained direct-write evidence. Do not loosen policy based on feedback-only UI observation.

## Result retention and privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics, screenshots and arbitrary generated reports are not automatically uploaded to the development repository.

Material sanitized evidence is preserved in tracked docs with timestamp + SHA-256, including [`docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md`](docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md).

Never publish serials, private hostnames, client keys, endpoints, private IDs, raw XML/private captures, private diagnostics, or user-specific paths.

## Safety / feature boundaries

Keep these permanent unless new real hardware testing explicitly changes them:

- supported hardware: **Scarlett 18i20 (3rd Gen) only**;
- dynamic Focusrite Control Server TCP port and device ID;
- writes only after Remote Devices authorization for this module's own server-assigned client ID;
- server-confirmed feedback/state only, never optimistic;
- no physical input preamp gain action;
- no direct per-input hardware mute claim;
- no per-channel phantom action;
- no Mic Kill;
- Monitor gain item `1677` remains read-only;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no meter/status writes;
- no write to explicit UNKNOWN or `available=false`;
- no Focusrite software/firmware update without explicit agreement;
- preserve privacy and required third-party attribution.

## Remote Devices authorization

Before any write-capable hardware campaign, Focusrite Control → Device Settings → Remote Devices must show the existing **Companion Scarlett 18i20** client approved.

Approval must match this module's own server-assigned client ID. Reuse the existing Companion connection; do not copy its private client key into another process.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested that `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing.

The project response remains:

- only Scarlett 18i20 (3rd Gen) is validated today;
- broader naming is acceptable if Bitfocus prefers it;
- broader device support must not be claimed before real testing.

Wait for the official repository/naming decision before changing public scope. Stable public release target remains `v1.0.0` unless maintainers direct otherwise.
