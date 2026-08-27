# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module controlling the **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here

Do not resume from an old chat, copied handoff, historical upload, `main` alone, or an embedded SHA. Resolve the live repository state first, then read:

1. [`HANDOFF`](HANDOFF)
2. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
3. [`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`](docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md)
4. [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md)
5. [`docs/HARDWARE_TEST_HISTORY.md`](docs/HARDWARE_TEST_HISTORY.md)

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

## Current status

Objective branch:

`testbench/meter-routing-exact-restore`

Development package:

`0.1.21`

The v1 hardware/protocol investigation is now **closed for the frozen public scope by explicit evidence or deliberate write withholding**.

Latest user-host software gate is green:

- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **306/306 Node tests PASS**;
- Companion package build PASS;
- `focusrite-scarlett-18i20-0.1.21.tgz` generated.

Latest final hardware closure:

- V5 retained-public-write Phase A: **42/42 PASS**;
- exact restore/global safety clean;
- reconnect PASS;
- no `output_pair_source` write in V5;
- cumulative Custom Mix coverage: **COMPLETE**;
- representative Mute/Solo/Talkback closed with mismatch 0;
- fader 7 changed paths;
- pan 4 changed paths;
- Stereo/Mono 2 changed paths;
- routing to Custom Mix observed on 7 Output pairs;
- Custom Mix meters **12/12 closed, mismatch 0**.

The final resume skipped another broad REC because the cumulative evidence was already complete. Do not rerun hardware merely for repetition.

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
- analogue Output Gain Set/Adjust on validated direct targets;
- direct source routing on validated targets/direct source families;
- Output nickname on validated direct targets.

Device/settings:

- Device nickname;
- Phantom Persistence;
- Talkback Source;
- Reconnect.

### Withheld public writes for v1

Readable state may remain where supported, but normal v1 actions/presets are intentionally removed:

- ALT / Speaker Switching writes;
- Output Stereo writes;
- `output_pair_source` stereo-pair routing;
- Mixer Slot Source/Stereo writes;
- generic Custom Mix Mute/Solo/fader/pan writes;
- per-lane Custom Mix Talkback write;
- Device Preset recall;
- Clock Source;
- Sample Rate;
- Digital I/O / S/PDIF Mode;
- Advanced Raw write action.

Withholding is deliberate scope control, not a claim that readable capability does not exist.

## Why `output_pair_source` is withheld

Older V8 topology evidence was re-read and did not prove the stronger two-member public routing contract. V3/V4 then repeatedly failed strict two-member closure; V4 used reciprocal parser/schema pair metadata and still produced ten `NO_TRANSITION` failures while exact restoration stayed clean.

v1 therefore withholds `output_pair_source` rather than weakening the hardware oracle. This does **not** mean Stereo/Mono is unsupported.

## Stereo/Mono and Custom Mix readback

Physical Focusrite Control operation and broad read-only REC evidence strongly validate server-confirmed readback for:

- fader;
- pan;
- Mute;
- Solo;
- source/stereo topology, including visible Stereo/Mono changes;
- Talkback;
- all 12/12 Custom Mix meters;
- currently available Output meters.

That evidence is `HARDWARE_DYNAMIC_CLOSED` / `SESSION_STATE_OBSERVED`. It does not automatically prove generic Companion writes for `output_stereo`, `mixer_slot_stereo`, or `mix_*`, so those writes remain withheld.

## Output and availability policy

The module fails closed:

- direct Mute withheld on right/pair-owned members;
- pair-owned right Source withheld from direct routing;
- `output_pair_source` withheld;
- Monitor Outputs 1–2 direct Gain withheld;
- known no-effect Gain/Nickname paths withheld;
- Output Stereo write withheld globally;
- human Outputs 21–24 remain write-blocked until an available configuration receives explicit hardware validation;
- explicit `available=false` or unknown availability blocks writes;
- filtered Output actions/presets refresh when server-confirmed availability materialises/changes, while callbacks re-check live state.

## Custom Mix routing / `assign-mix`

Focusrite Control presents simply **Custom Mix**. Internal server mix IDs are not reliably mapped to the visible UI.

`assign-mix` remains:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised in tested sessions;
- raw semantics `UNKNOWN`;
- write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no raw write.

Direct Hardware Input / Software (DAW) Playback / digital routing remains available where hardware-tested. Do not rerun `NAVIGATE_MIXES` and do not write `assign-mix`.

## User-facing terminology

Use the terms visible in Focusrite Control:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Internal TestBench Mix A–F labels are protocol/research identifiers, not UI instructions.

## Permanent safety / feature boundaries

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
- no write to UNKNOWN or explicit `available=false`;
- no Focusrite software/firmware update without explicit agreement;
- preserve privacy and required third-party attribution.

## Next step

Hardware validation is complete for the current v1 scope. The next step is an **exact audit of the exact `focusrite-scarlett-18i20-0.1.21.tgz` generated/used on the user host**: SHA-256, archive contents, package/manifest coherence, bundled public action surface, forbidden-feature regression, privacy scan and attribution check.

Do not claim exact artifact PASS from a reconstructed build alone; the exact archive bytes must be inspected.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing.

Only Scarlett 18i20 (3rd Gen) is validated today. Wait for the official repository/naming decision before changing public scope. Stable public release target remains `v1.0.0` unless maintainers direct otherwise.
