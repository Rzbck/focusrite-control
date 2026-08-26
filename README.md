# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module controlling the **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here

Do not resume this project from an old chat, copied handoff, uploaded historical file, `main` alone, or an embedded SHA.

First resolve the live repository state and newest material branch movement, then read:

1. [`HANDOFF`](HANDOFF)
2. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
3. [`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`](docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md)
4. [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md)
5. [`docs/HARDWARE_TEST_HISTORY.md`](docs/HARDWARE_TEST_HISTORY.md)
6. [`docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md`](docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md)
7. [`AI_PROJECT_RULES.md`](AI_PROJECT_RULES.md)
8. relevant current source/tests/evidence

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

## Current objective

The broad hardware feedback/protocol investigation is **closed for the v1 scope by evidence or deliberate write withholding**.

The current objective is now:

**validate the restrictive 0.1.20 v1 public write surface end-to-end in software, then perform the final package/privacy/forbidden-feature release audit.**

No new broad hardware REC is required for the current v1 scope.

## Current branch and package

Objective branch:

`testbench/meter-routing-exact-restore`

Current development package version:

`0.1.20`

Latest fully green user-host software checkpoint remains the previous **0.1.19** build at:

`e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7`

That checkpoint passed:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies;
- Prettier;
- ESLint;
- source manifest validation;
- **279/279 Node tests**;
- Companion package build;
- package `focusrite-scarlett-18i20-0.1.19.tgz`.

The first full **0.1.20** user-host gate reached dependency installation successfully and then stopped at Prettier on two formatting-only files. Those two format blockers were corrected on the objective branch. ESLint, manifest, the complete Node test suite, and package build were not reached in that attempt, so 0.1.20 remains **SOFTWARE-GATE-PENDING** until the full gate passes.

## Final v1 public write surface

Authoritative decision: [`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`](docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md).

### Kept public writes

Monitor:

- Mute;
- Dim;
- Talkback;
- Monitor output-control preset.

Hardware Inputs:

- Air 1–8;
- Pad 1–8;
- Line/Instrument on Inputs 1–2;
- Input nickname.

Outputs, filtered by exact model, retained hardware evidence, and current server-confirmed availability:

- direct Mute on validated members only;
- analogue output gain Set/Adjust on validated direct targets;
- direct source routing on validated targets and direct source families;
- validated stereo-pair source routing;
- Output nickname on validated direct targets.

Device/settings:

- Device nickname;
- Phantom Persistence;
- Talkback Source;
- Reconnect.

### Withheld public writes for v1

These capabilities may remain readable where supported, but normal v1 write actions/presets are intentionally removed:

- ALT / Speaker Switching writes;
- Output Stereo writes;
- Mixer Slot Source/Stereo writes;
- generic Custom Mix Mute/Solo/fader/pan writes;
- per-lane Custom Mix Talkback write;
- Device Preset recall;
- Clock Source;
- Sample Rate;
- Digital I/O / S/PDIF Mode;
- Advanced Raw write action.

Withholding is deliberate scope control, not a claim that the readable capability does not exist.

## Custom Mix routing

Focusrite Control presents simply **Custom Mix** to the user, while the private server exposes multiple internal mix IDs.

`assign-mix` remains:

- present in the schema on 26/26 Outputs;
- materialised on 0/26 tested Outputs;
- unobserved through active Playback, Hardware Input, Custom Mix, and digital routing changes;
- raw semantics unknown;
- write transaction unknown.

Therefore v1 does **not** guess which internal mix ID represents the user's visible Custom Mix selection. Output Source actions do not offer those internal Custom Mix IDs, and stale saved actions attempting one are blocked.

Direct Hardware Input / Software (DAW) Playback / digital routing remains available where hardware-tested.

## Latest hardware evidence

Newest sanitized read-only REC: `2026-08-26T06:29:16.831Z`, module `0.1.19`.

Result:

- read-only harness;
- zero harness Focusrite writes;
- zero Companion button presses;
- 829 probes / 31 feedback definitions / 46 meters;
- **11 transitions / 11 PASS / 0 race / 0 mismatch**.

### ALT / Speaker Switching readback

Server-confirmed UI observation dynamically closed feedback/readback for:

- ALT Enable — both states, three clean transitions;
- ALT selection — both states, four clean transitions.

Human Output 3 availability also changed with Speaker Switching ownership. This is runtime state and must never be hardcoded.

The readback is closed; the write actions are nevertheless withheld for v1 because the Companion write transaction itself was not equivalently closed.

### Meters

Current configuration:

- Hardware Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- Custom Mix meters: **12/12 closed**;
- total: **42/46 floor + movement closed**;
- remaining human Outputs 21–24 are server-confirmed `available=false` and therefore **CONFIGURATION_UNAVAILABLE**, not unsupported.

Do not alter Sample Rate or Digital I/O merely to expose Outputs 21–24 for coverage.

## Passive REC rule

A read-only/passive REC does **not** require Focusrite Control to be restored to its starting state merely because the final state differs. Its job is observation.

Exact baseline/restoration remains mandatory only for write-capable reversible hardware tests where rollback is part of the safety contract.

## User-facing terminology

When describing Focusrite Control to a user, use the terms visible in the application:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Internal TestBench `Mix A–F` labels are protocol/research identifiers only and must not be used as UI instructions.

## Output safety policy

The v1 policy deliberately fails closed:

- every pair-owned right member is withheld for direct Mute writes;
- pair-owned right Source remains withheld from direct source writes while the validated pair-routing action remains available;
- Monitor Outputs 1–2 direct Gain remains withheld;
- known no-effect Gain/Nickname paths remain withheld;
- Output Stereo write is withheld globally for v1;
- human Outputs 21–24 remain write-blocked even if a future configuration later reports them available, until that available configuration is explicitly hardware-tested;
- explicit `available=false` or unknown availability blocks writes wherever an availability descriptor exists.

## Permanent safety / feature boundaries

Keep these unless new real hardware testing explicitly changes them:

- supported hardware: **Scarlett 18i20 (3rd Gen) only**;
- dynamic Focusrite Control Server TCP port and device ID;
- writes only after Remote Devices authorization for this module's own server-assigned client ID;
- server-confirmed feedback/state only, never optimistic;
- no physical analogue input preamp Gain action;
- no direct per-input hardware Mute;
- no per-channel phantom switching;
- no Mic Kill;
- Monitor gain item `1677` remains read-only;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no meter/status writes;
- no write to explicit UNKNOWN or `available=false`;
- no Focusrite software/firmware update without explicit agreement;
- preserve privacy and required third-party attribution.

## Result retention and privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics, screenshots, and arbitrary generated reports are not published automatically.

Material sanitized evidence is preserved in tracked documentation with timestamp and SHA-256 where appropriate.

Never publish real serials, private hostnames, client keys, endpoints, private IDs, raw private XML/captures, private diagnostics, or user-specific paths.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested that `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing.

The project position remains:

- only Scarlett 18i20 (3rd Gen) is validated today;
- broader naming is acceptable if Bitfocus prefers it;
- broader device support must not be claimed before real testing.

Wait for the official repository/naming decision before changing public scope. Stable public release target remains `v1.0.0` unless maintainers direct otherwise.

## Next validation step

Run:

`UPDATE_AND_RUN.bat`

on `testbench/meter-routing-exact-restore` and require the complete **0.1.20** gate:

- dependencies;
- Prettier;
- ESLint;
- source manifest;
- all Node tests;
- Companion package build.

Expected package after a clean gate:

`focusrite-scarlett-18i20-0.1.20.tgz`

After that, move directly to the final package/privacy/forbidden-feature audit. Do not run another broad hardware REC merely for coverage.
