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
5. [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md)
6. [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md)
7. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
8. relevant current source/tests/evidence

Evidence priority is: newest explicit hardware/user-host result → current code/tests → current handoff → current matrix/docs → older captures/assumptions.

## Current objective

The final deliverable is a clean, safe, maintainable **Bitfocus Companion module** using Focusrite Control Server as transport.

The current parent objective remains **explicit hardware feedback/protocol closure before release**. Publication work must not replace that objective while material safe/actionable feedback or public-write questions remain open.

Future Focusrite models may be added only after real hardware testing. A possible wider repository name such as `focusrite-control` is not a claim of universal Focusrite support.

## Current branch and package

Objective branch:

`testbench/meter-routing-exact-restore`

Current package version:

`0.1.19`

Latest fully green user-host software checkpoint:

`e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7`

That checkpoint passed:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies;
- Prettier 3.9.6;
- ESLint;
- source manifest validation;
- **279/279 Node tests**;
- Companion package build;
- package `focusrite-scarlett-18i20-0.1.19.tgz`.

No hardware write was performed by that software gate.

## Latest hardware evidence — reportVersion 6

The latest sanitized manual feedback sweep was completed on 2026-08-26 against the physical Scarlett 18i20 (3rd Gen), module 0.1.19.

The recorder itself was read-only and made no Companion button presses or Focusrite writes.

Result:

- **829** feedback probes across **31** public feedback definitions;
- **193** recorded feedback transitions;
- **193 PASS**;
- **0 transient race**;
- **0 confirmed persistent mismatch**;
- **367** safe semantic transitions;
- no raw/private values stored.

Major new evidence includes:

- real Custom Mix mono/stereo source materialisation across multiple mixer-slot pairs;
- broad Custom Mix Mute/Solo readback plus Gain/Pan semantic movement;
- representative analogue and digital Output Mute/Stereo/Source behavior;
- confirmation that direct per-output gain exists only on **Outputs 1-10**, not S/PDIF/ADAT/digital Outputs 11-26;
- stronger evidence that private output `assign-mix` remains unobserved even during active UI routing changes.

See [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md) for the exact retained evidence and [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md) for the reconciled 31-definition matrix.

## Meter state

After reportVersion 6:

- **37/46** meters are closed with floor + movement;
- Inputs: **8/8 closed**;
- Outputs 1-20 and 25-26: **22 closed**;
- Outputs 21-24 / ADAT 2.1-2.4: currently `available=false`, therefore **CONFIGURATION_UNAVAILABLE** rather than unsupported;
- Custom Mix lanes: **7/12 closed**;
- remaining Custom Mix floor-only gaps: **Mix B L/R, Mix C L/R, Mix E R**;
- persistent meter mismatch: **0**.

Do not change routing, sample rate or Digital I/O mode merely to improve meter coverage.

## Custom Mix terminology

User-facing test instructions should use the terms shown in Focusrite Control:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**.

Internal protocol/TestBench labels still use twelve mono lanes grouped as six stereo Mix A-F pairs where required for code and diagnostics.

## Output `assign-mix`

The schema contains an output `assign-mix` field, but the current evidence is:

- descriptor present on **26/26 outputs**;
- materialised server value on **0/26**;
- still unobserved during active representative Playback/Analogue/Custom Mix/digital source changes;
- raw semantics: **UNKNOWN**;
- write transaction: **UNKNOWN**;
- public action/preset/feedback: **none**;
- Advanced Raw write: **none**.

Do not rerun `NAVIGATE_MIXES` and do not chase `assign-mix` with blind/raw writes. It is not a v1 blocker while the normal Output Routing behavior is understood and public write surfaces remain bounded.

## Current material gaps

The feedback matrix is reconciled with reportVersion 6. Remaining work is now narrower:

1. **Five Custom Mix meter floors** — Mix B L/R, Mix C L/R, Mix E R. Prefer passive true-silence capture only.
2. **ALT / Speaker Switching** — ALT and ALT Enable are real 18i20 3rd Gen functions, but their Companion feedback/actions are not dynamically closed. If they remain public, run one physically isolated exact-restorable test; otherwise withhold for v1.
3. **Custom Mix public writes** — `mix_mute`, `mix_solo`, `mix_gain_set/adjust`, and `mix_pan` have strong UI/readback evidence, but generic arbitrary mix/side/slot Companion writes are not all hardware-proven. Audit and either prove representative semantics or constrain/withhold unproven combinations.
4. **Disruptive settings actions** — `device_preset`, `clock_source`, `sample_rate`, and `spdif_mode` are still defined as actions although deliberate dynamic coverage is blocked for safety. Before v1, explicitly choose to withhold them or run a separately approved hardware campaign. Do not change these settings merely for coverage.
5. **Nickname writes** — input/output/device nickname actions are low-risk but should remain labelled implemented/schema-observed until a temporary synthetic nickname is written and exactly restored.
6. **Allowed Output writes** — audit the options that remain visible after `hardware-policy.js` filtering against retained direct-write evidence. Do not loosen policy based on feedback-only UI observation.

## Safety / feature boundaries

Keep these boundaries permanent unless new hardware testing explicitly changes them:

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

Before any write-capable TestBench campaign, Focusrite Control → Device Settings → Remote Devices must show the existing **Companion Scarlett 18i20** client approved.

Approval must match this module's own server-assigned client ID. Reuse the existing Companion connection; do not copy its private client key into another process.

See [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md).

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested that `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing.

The project response remains:

- only Scarlett 18i20 (3rd Gen) is validated today;
- broader naming is acceptable if Bitfocus prefers it;
- broader device support must not be claimed before real testing.

Wait for the official repository/naming decision before changing public scope. Stable public release target remains `v1.0.0` unless maintainers direct otherwise.
