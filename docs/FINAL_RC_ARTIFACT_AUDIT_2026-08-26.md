# Final RC artifact audit — 0.1.20

Date: 2026-08-26

Validated code/package checkpoint:

`fd76b4e6d25d479c2f0c426ac2c3b908fa42ddd4`

Artifact:

`focusrite-scarlett-18i20-0.1.20.tgz`

Artifact SHA-256:

`cfa4ba62c11e2a91780122eb38a0a0570d6122e0c5fc7d91652008a6838a5716`

## User-host software gate

The exact checkpoint above completed the full normal Windows gate:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependency install PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **283/283 Node tests PASS**;
- Companion package build PASS;
- generated package `focusrite-scarlett-18i20-0.1.20.tgz`.

No Focusrite hardware write was performed by this software gate.

## Exact archive contents

The uploaded `.tgz` was opened and inspected directly. It contains only:

- `main.js` — bundled module runtime;
- `package.json`;
- `companion/HELP.md`;
- `companion/manifest.json`.

There are no TestBench results, diagnostics, local logs, captures, source research files, generated Companion pages, local builder tools, or other unexpected files in the archive.

Generated package metadata is coherent:

- package name: `focusrite-scarlett-18i20`;
- package version: `0.1.20`;
- manifest version: `0.1.20`;
- runtime: `node22`;
- module API: `2.0.0`;
- product list: **Scarlett 18i20 (3rd Gen)** only;
- license: MIT.

## Packaged runtime smoke audit

The bundled `main.js` imports successfully as the package default module export.

A synthetic Companion instance-context audit was then run directly against the bundled `main.js`, with the old diagnostic/raw configuration values deliberately enabled to test fail-closed behaviour.

Observed public action IDs:

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
- `output_pair_source`;
- `output_source`;
- `phantom_persistence`;
- `reconnect`;
- `talkback_source`.

The following withheld families were absent from the installed public action surface:

- ALT / ALT Enable writes;
- Output Stereo write;
- Mixer Slot Source/Stereo writes;
- generic Custom Mix Mute/Solo/Gain/Pan/Talkback writes;
- Device Preset;
- Clock Source;
- Sample Rate;
- Digital I/O / S/PDIF Mode;
- Advanced Raw.

The installed public policy also removed all presets using withheld action IDs.

The public configuration contains no `enableAdvancedRawWrites` field. Even a stale synthetic config value did not re-expose `advanced_raw_set` because the installed definition policy strips it.

## Forbidden-feature audit

The packaged public action surface contains no:

- physical analogue input preamp Gain action;
- direct per-input hardware Mute action;
- per-channel phantom-power action;
- Mic Kill;
- Monitor Gain Set/Adjust action;
- Output Stereo write action;
- generic Custom Mix write action;
- unknown/raw write action;
- firmware/reset/restore/snapshot command surface.

Monitor gain remains read-only through the release policy. Raw policy also blocks monitor Gain / ALT / ALT Enable and all generic Mix writes even though low-level parser/action implementation code remains bundled internally.

This distinction is intentional: bundled implementation helpers are not equivalent to an installed public Companion action.

## Dynamic server and authorization audit

The package retains:

- dynamic Control Server discovery;
- no fixed TCP fallback port;
- no fixed device ID;
- persistent local client identity generated at runtime;
- write blocking until Focusrite Control authorises this module's own server-assigned client ID;
- server-confirmed state for feedbacks/variables rather than optimistic success.

## Privacy audit

The exact `.tgz` was scanned for common private/local data patterns.

No user-specific Windows path, development project path, user handle, email address, UUID/client key value, private IPv4 address, real hostname, or captured hardware value was found.

The bundle necessarily contains generic protocol field names such as `serial`, `client-key`, `<device>`, `<set>` and `<item>` because it must parse and construct the Focusrite Control Server protocol. These are implementation templates/field names only; the archive contains no real device serial, private client key, private device XML capture, or user-specific endpoint.

## Attribution audit

`companion/HELP.md` in the archive is byte-for-byte the tracked public HELP blob from the validated checkpoint.

It contains the full Bitfocus MIT notice and explicitly states that the project combines original hardware testing with public prior Focusrite protocol research and does not claim every protocol detail was independently discovered.

## Result

**0.1.20 technical RC artifact audit: PASS.**

The v1 hardware/protocol investigation is closed for the current Scarlett 18i20 (3rd Gen) scope by explicit evidence or deliberate write withholding. The software gate and exact generated artifact are both clean.

Do not broaden product support or rename the public module solely from this result.

Publication remains intentionally blocked on the official Bitfocus repository/naming decision. Once the official repository exists, inspect its exact name, default branch, seed files and permissions, compare against this cleaned RC, follow the required PR/CI workflow, and keep the stable public release target at `v1.0.0` unless maintainers direct otherwise.
