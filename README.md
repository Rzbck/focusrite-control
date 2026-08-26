# Focusrite Scarlett 18i20 (3rd Gen) — Bitfocus Companion module

Development mirror for a Bitfocus Companion connection module controlling the **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** installed with Focusrite Control.

> This is not yet the official Bitfocus module repository. Final repository/module naming is awaiting maintainer direction. Hardware support is intentionally limited to **Scarlett 18i20 (3rd Gen)** until other models receive real hardware validation.

## Status

Development build: **0.1.21**.

The current RC has completed its local software gate and final hardware validation for the retained public v1 write surface. Publication is waiting for the official Bitfocus repository/naming decision.

## Requirements

- Focusrite Scarlett 18i20 (3rd Gen)
- Focusrite Control with Focusrite Control Server running locally
- Focusrite Control **Remote Devices** approval for this module's own client
- Bitfocus Companion with Node 22 module support

The Control Server TCP port and device ID are discovered dynamically; no fixed endpoint is assumed.

## Hardware-write validated public controls

The public v1 write surface is intentionally narrower than the complete device schema. It exposes the paths that have a defensible Companion write contract on the tested hardware:

- Monitor Mute, Dim, Talkback and monitor output-control preset
- Air on Inputs 1–8
- Pad on Inputs 1–8
- Line/Instrument mode on Inputs 1–2
- input nicknames
- policy-filtered direct Output Mute
- validated analogue Output level
- validated direct Output Source routing
- validated Output nicknames
- device nickname
- Phantom Persistence
- Talkback Source
- reconnect / rediscovery

Writes remain blocked until Focusrite Control authorises this module's **own server-assigned client ID**. Feedbacks and variables use server-confirmed state rather than optimistic local updates.

## Hardware-observed state kept read-only for v1

Some device behaviour was physically exercised and captured successfully through Focusrite Control Server, but that does **not** automatically prove a safe generic Companion write transaction for every target.

The project has server-confirmed hardware/readback evidence for:

- ALT / Speaker Switching state
- Output Stereo/Mono state
- Custom Mix fader and pan movement
- Custom Mix Mute, Solo and Talkback state
- Mixer source/stereo topology
- Custom Mix routing observations
- all 12 Custom Mix meter paths
- currently available Output meter paths

These states may be exposed through feedbacks/variables where useful, while the corresponding generic write actions remain outside the v1 public surface.

## Intentionally not writable in v1

These are withheld for specific validation or safety reasons, not because the project simply forgot to test them:

- **ALT / Speaker Switching writes** — readback is hardware-observed, but a direct Companion write contract was not independently closed.
- **Output Stereo writes** — Stereo/Mono transitions are hardware-observed, but a generic Output write contract was not closed across the public surface.
- **Stereo-pair Output routing (`output_pair_source`)** — strict two-member write testing did not meet the required transition contract, so the action was removed instead of weakening the test oracle.
- **Generic Custom Mix / Mixer Slot writes** — fader, pan, Mute, Solo, Talkback and source/stereo topology were hardware-observed, but the project does not generalise readback evidence into an unproven write API across every lane/slot combination.
- **Device Preset recall, Clock Source, Sample Rate and Digital I/O / S/PDIF mode** — deliberately excluded from the v1 write campaign because they can disrupt routing, clocking, audio or device state.
- **Advanced Raw writes** — intentionally absent from the public v1 surface; unknown or unsafe item writes are not exposed as an escape hatch.

## Explicit non-features

The module does not invent controls that the tested hardware/protocol does not provide safely:

- analogue input preamp Gain
- direct per-input hardware Mute
- per-channel phantom switching
- Mic Kill
- physical Monitor-level control

Monitor gain item `1677` remains read-only because hardware testing did not demonstrate useful physical Monitor-level control through that write path.

## Safety model

- Exact hardware scope: Scarlett 18i20 (3rd Gen) only.
- Dynamic Focusrite Control Server discovery and dynamic device ID.
- Own-client Remote Devices authorisation required before writes.
- Server-confirmed feedback/state only; no optimistic success reporting.
- Unknown or explicitly unavailable targets fail closed.
- Firmware/reset/restore/snapshot and meter/status write paths are not exposed.
- Output actions are filtered by validated path, pair ownership and live availability.

See `companion/HELP.md` for user-facing actions, feedbacks, variables and operating notes.

## Repository layout

- `src/` — module runtime
- `companion/` — Companion manifest and packaged help
- `test/` — focused production regression tests
- `test-support/` — synthetic Scarlett schema used by tests
- `scripts/validate-source-manifest.cjs` — manifest validation

Hardware research, TestBench tooling, private/local launchers and historical validation material are intentionally kept outside the public source tree.

## Development

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

The official Bitfocus repository will use the standard shared module-check workflow once its final repository/module name has been assigned.

## Bitfocus publication

The first-release repository request has already been posted in Bitfocus Companion Slack `#module-development`.

Bitfocus maintainer feedback suggested that a broader repository name such as `focusrite-control` may better reflect the Focusrite Control Server transport. That naming question is still open; it does **not** broaden the current hardware claim beyond Scarlett 18i20 (3rd Gen).

Once the official Bitfocus repository exists, its repository name, manifest ID, package metadata and URLs will be aligned together before the stable `v1.0.0` submission through the Bitfocus Developer Portal.

## Attribution

The project combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol research. It does not claim that every protocol detail was independently discovered.

Relevant third-party notices are preserved in `THIRD_PARTY_NOTICES.md` and the packaged `companion/HELP.md`.

Focusrite is a trademark of its respective owner. This project is not affiliated with or endorsed by Focusrite.

## License

MIT. See `LICENSE`.
