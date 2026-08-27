# Final RC artifact audit — 0.1.21

Date: 2026-08-26  
Hardware scope: **Scarlett 18i20 (3rd Gen) only**

## Exact audited archive

Artifact:

`focusrite-scarlett-18i20-0.1.21.tgz`

Exact uploaded archive:

- size: **30,539 bytes**;
- SHA-256: **`c8b948a06d1164caf27f3790236e75d4d6e6e0a77aaff0ad4b52840ec199dfd4`**.

This audit was performed on the exact archive supplied after the completed 0.1.21 user-host software and hardware gates. The archive was not rebuilt for this audit.

## User-host software gate

The final checked-in 0.1.21 source completed the normal Windows gate:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependency install PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest validation PASS;
- **306/306 Node tests PASS**;
- Companion package build PASS;
- generated package `focusrite-scarlett-18i20-0.1.21.tgz`.

No Focusrite hardware write is performed by this software gate.

## Final hardware closure retained

The final 0.1.21 hardware evidence is separate from the archive inspection:

- V5 retained-public-write Phase A: **42/42 PASS**;
- hard abort: false;
- global exact-restore audit: PASS;
- reconnect: PASS;
- `output_pair_source` absent from the V5 write campaign and withheld from public v1;
- cumulative read-only Custom Mix coverage: **COMPLETE**;
- representative Mute, Solo, Talkback, fader, pan, Stereo/Mono and Custom Mix routing evidence closed with no retained control mismatch;
- Custom Mix meters: **12/12 closed** from the dedicated clean meter evidence.

This does not promote any withheld write family. Readback evidence and Companion write evidence remain separate classifications.

## Exact archive contents

The `.tgz` contains only the package root plus:

- `main.js` — bundled module runtime;
- `package.json`;
- `companion/HELP.md`;
- `companion/manifest.json`.

No TestBench, local Windows launcher, result JSON, diagnostic log, capture, source research file, generated Companion page, local builder tool or other development artifact is packaged.

## Package and manifest coherence

Packaged `package.json`:

- name: `focusrite-scarlett-18i20`;
- version: **0.1.21**;
- license: MIT;
- bundled package has no external runtime dependency entry.

Packaged `companion/manifest.json`:

- id/name: `focusrite-scarlett-18i20`;
- version: **0.1.21**;
- runtime: `node22`;
- module API: **2.0.0**;
- entrypoint: `../main.js`;
- manufacturer: Focusrite;
- products: **Scarlett 18i20 (3rd Gen)** only;
- license: MIT.

The bundled `main.js` imports successfully as the package default module export.

## Installed public action-surface smoke

A synthetic exact-model Companion instance audit was run directly against the bundled `main.js`. The synthetic context deliberately enabled stale diagnostic/raw configuration flags so the installed release policy was exercised fail-closed.

Observed installed public action IDs:

- `device_nickname`;
- `input_air`;
- `input_mode`;
- `input_mode_cycle`;
- `input_nickname`;
- `input_pad`;
- `monitor_dim`;
- `monitor_mute`;
- `monitor_preset`;
- `monitor_talkback`;
- `output_gain_adjust`;
- `output_gain_set`;
- `output_mute`;
- `output_nickname`;
- `output_source`;
- `phantom_persistence`;
- `reconnect`;
- `talkback_source`.

Observed preset action IDs were limited to retained families:

- `input_air`;
- `input_mode_cycle`;
- `input_pad`;
- `monitor_dim`;
- `monitor_mute`;
- `monitor_talkback`;
- `output_mute`.

The following withheld write families were absent from the installed public action surface:

- `monitor_alt_enable`;
- `monitor_alt`;
- `output_stereo`;
- `output_pair_source`;
- `mixer_slot_source`;
- `mixer_slot_stereo`;
- `mix_mute`;
- `mix_solo`;
- `mix_gain_set` / `mix_gain_adjust`;
- `mix_pan`;
- `mix_talkback`;
- `device_preset`;
- `clock_source`;
- `sample_rate`;
- `spdif_mode`;
- `advanced_raw_set`.

Internal implementation/research helpers can still exist in the bundled source. Their presence is not equivalent to an installed Companion action; the release definition policy removes them from the public surface.

## Forbidden-feature regression audit

The installed public action surface contains no:

- physical analogue input preamp Gain action;
- direct per-input hardware Mute action;
- per-channel phantom-power action;
- Mic Kill;
- Monitor Gain Set/Adjust action;
- generic Output Stereo or stereo-pair routing write;
- generic Custom Mix write action;
- public raw-write action;
- firmware/reset/restore/snapshot command surface.

Monitor gain item `1677` remains documented and enforced as read-only. Unknown/unsafe raw items, meter/status writes and unvalidated Output configurations remain outside the public write surface.

## Dynamic Control Server and authorization audit

The exact archive retains:

- dynamic Focusrite Control Server discovery through UDP 30096–30098;
- no hardcoded fallback TCP server port;
- no hardcoded device ID;
- persistent local client identity generated at runtime;
- write blocking until Focusrite Control authorises this module's own server-assigned client ID;
- server-confirmed state for feedbacks/variables instead of optimistic local success.

## Privacy scan

All text files in the exact archive were scanned for common private/local-data patterns.

No user-specific Windows path, development project path, email address, UUID/client-key value, private IPv4 address or private captured endpoint was found.

The bundle necessarily contains generic protocol field names and templates such as `serial`, `client-key`, `<device>`, `<set>` and `<item>` because it implements the Focusrite Control Server protocol. No real device serial, private hostname, raw private XML capture or user-specific identity is embedded in the archive.

## Attribution audit

The packaged `companion/HELP.md` retains:

- the Bitfocus MIT notice;
- the required MIT permission/disclaimer text;
- an explicit statement that the project combines original Scarlett 18i20 hardware testing with public prior Focusrite protocol research;
- no claim that every protocol detail was independently discovered.

## Result

**0.1.21 technical RC artifact audit: PASS.**

The current technical RC is closed for the validated Scarlett 18i20 (3rd Gen) v1 scope by software gate, exact archive audit, explicit hardware evidence, or deliberate write withholding.

This result does **not** broaden device support and does **not** decide the final Bitfocus repository/module name. The official repository/naming decision is still awaited.

Before moving the cleaned public candidate to `main`, remove or keep separate local research/TestBench/Windows automation material so `main` represents a normal minimal Companion module repository. Do not rename or broaden the module solely for cleanup; wait for Bitfocus maintainer direction on final repository/module naming.
