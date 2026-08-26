# Focusrite Scarlett 18i20 (3rd Gen) — Bitfocus Companion module

Development mirror for a Bitfocus Companion module that controls a **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** installed with Focusrite Control.

> This is not yet the official Bitfocus module repository. The final repository/module naming is awaiting maintainer direction. Hardware support is intentionally limited to **Scarlett 18i20 (3rd Gen)** until other models receive real hardware validation.

## Status

Development build: **0.1.21**.

The 0.1.21 technical RC has completed the local software gate and final Scarlett 18i20 (3rd Gen) hardware validation for the retained v1 public write surface. Publication remains pending the official Bitfocus repository/naming decision.

## Public control surface

The v1 module exposes hardware-validated writes for:

- Monitor Mute, Dim, Talkback and monitor output-control preset
- Air on Inputs 1–8
- Pad on Inputs 1–8
- Line/Instrument mode on Inputs 1–2
- input nicknames
- policy-filtered direct Output Mute, analogue Output level, Output Source and Output nickname
- device nickname
- Phantom Persistence
- Talkback Source
- reconnect / rediscovery

Readable server-confirmed state remains available for additional controls where supported.

## Deliberately withheld writes

The following are not part of the public v1 write surface:

- ALT / Speaker Switching writes
- Output Stereo writes
- stereo-pair Output routing (`output_pair_source`)
- generic Custom Mix fader, pan, Mute, Solo or per-lane Talkback writes
- Mixer Slot Source/Stereo writes
- Device Preset recall
- Clock Source
- Sample Rate
- Digital I/O / S/PDIF mode
- Advanced Raw writes

The module also does not invent analogue input preamp Gain, direct per-input hardware Mute, per-channel phantom switching, Mic Kill or physical Monitor-level control.

## Safety model

- Focusrite Control Server TCP port and device ID are discovered dynamically; no fixed endpoint is assumed.
- Writes remain blocked until Focusrite Control authorises this module's **own server-assigned client ID** in Remote Devices.
- Feedbacks and variables use server-confirmed state; writes are never reported as successful through optimistic local updates.
- Unknown or explicitly unavailable targets fail closed.
- Monitor gain item `1677` remains read-only.
- Firmware/reset/restore/snapshot and meter/status write paths are not exposed.

See `companion/HELP.md` for the complete user-facing behaviour and limitations.

## Repository layout

- `src/` — module runtime
- `companion/` — Companion manifest and packaged help
- `test/` — focused production regression tests
- `test-support/` — synthetic Scarlett schema used by tests
- `scripts/validate-source-manifest.cjs` — manifest validation

Hardware research, autonomous TestBench tooling, private/local launchers and historical validation material are intentionally kept outside this public RC branch.

## Build and verify

Requires Node.js 22.20+ and Yarn 4.

```sh
corepack enable
yarn install --immutable
yarn check-format
yarn lint
yarn check
yarn test
yarn companion-module-build
```

The Companion package builder produces a `.tgz` suitable for local module-package import during development.

## Attribution

The project combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol research. It does not claim that every protocol detail was independently discovered.

Relevant third-party notices are preserved in `THIRD_PARTY_NOTICES.md` and the packaged `companion/HELP.md`.

Focusrite is a trademark of its respective owner. This project is not affiliated with or endorsed by Focusrite.

## License

MIT. See `LICENSE`.
