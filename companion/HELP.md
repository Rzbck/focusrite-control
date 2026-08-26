# Focusrite Scarlett 18i20 (3rd Gen)

This module controls a **Focusrite Scarlett 18i20 (3rd Gen)** through the **Focusrite Control Server** installed with Focusrite Control.

It does **not** replace the Focusrite USB/audio driver. Keep Focusrite Control and its driver installed normally.

## Connection

Use **Auto-discover** unless you have a specific reason not to.

Focusrite Control Server may choose a dynamic TCP port. Auto-discovery sends the Focusrite discovery request to UDP ports **30096–30098**, learns the current TCP port, then opens the normal framed XML session.

If Focusrite Control asks whether to approve a new client, approve the Companion client once. Writes are blocked until Focusrite Control authorises this module's own server-assigned client ID.

Manual mode is available only for troubleshooting when you already know the current Focusrite Control Server host and TCP port. The module does not assume a default TCP port or device ID.

## Supported hardware

Current hardware-tested target:

- **Scarlett 18i20 (3rd Gen) only**
- Focusrite Control generation using FocusriteControlServer

Other Focusrite models are deliberately rejected for writes until they receive separate real-hardware validation.

## v1 public write policy

The v1 surface is intentionally restrictive. A readable or schema-present control is **not** automatically exposed as a write action. Public actions are kept only where retained hardware evidence and the current hardware policy justify them.

Feedbacks and variables remain server-confirmed only. The module never fakes a successful write by optimistically changing state.

### Monitor actions

Public:

- Monitor Mute
- Monitor Dim
- Monitor Talkback
- Select which output group follows Monitor/Dim/Mute (`1-2`, `1-4`, `1-6`, `1-8`, `All`, `None`)

Readback-only in v1:

- ALT / Speaker Switching enable
- MAIN / ALT selection
- physical Monitor level / Monitor gain item `1677`

ALT and ALT Enable have now been dynamically observed on the physical 18i20 through normal Focusrite Control operation, including the expected Output 3 availability/ownership change. Their **Companion write transaction**, however, was not separately hardware-write confirmed, so v1 keeps the feedbacks but withholds the actions and ALT preset.

### Analogue input actions

Public:

- Air, Inputs 1–8
- Pad, Inputs 1–8
- Line/Instrument mode, Inputs 1–2 only
- Input nickname

There is no fake physical preamp gain, direct per-input hardware mute, Mic Kill or per-channel phantom-power action.

### Output actions — hardware-policy filtered

The server exposes Monitor, Line, S/PDIF, ADAT and Loopback output state. Public choices are filtered by the Scarlett 18i20 (3rd Gen) hardware evidence profile and current server-confirmed availability.

Public write actions are:

- Mute on independently validated direct targets only
- Set/adjust analogue output level on validated gain-capable targets only
- Route a validated individual output to a direct Hardware Input / Software (DAW) Playback / digital source
- Route an eligible stereo output pair to a validated direct stereo source pair
- Output nickname on validated direct targets

Important restrictions:

- direct Mute is withheld on right/pair-owned output members;
- Monitor Outputs 1–2 direct gain remains withheld;
- known no-effect/right-owned gain and nickname paths remain withheld;
- **Output Stereo-link writes are withheld for v1**; Stereo state remains readable;
- **Custom Mix source IDs are not offered as Output routing writes in v1** because Focusrite Control presents only `Custom Mix`, while the private server exposes internal mix IDs without a reliably user-visible mapping;
- human Outputs **21–24** remain write-blocked even if a future configuration reports them available, until that available configuration receives explicit real-hardware validation.

When an output has an `available` item, writes require its **server-confirmed value to be true**. `false`, blank or unknown availability receives no write. A separately proven schema case with no availability descriptor is treated separately and is not automatically equivalent to `UNKNOWN`.

### Custom Mix — readback/feedback in v1

The server exposes six internal stereo Custom Mix pairs / twelve lanes and 24 mixer input slots. Focusrite Control presents these to the user as **Custom Mix**, **Hardware Inputs** and **Software (DAW) Playback** rather than the internal protocol pair names.

Physical UI testing has strongly validated readback for:

- Custom Mix faders
- pan
- Mute
- Solo
- source/stereo topology
- Talkback state
- all **12/12 Custom Mix meters**

The current generic write actions for Custom Mix fader/pan/Mute/Solo are nevertheless **withheld for v1**. Earlier write evidence is not uniform across every internal lane/side/slot, and the internal mix labels do not map cleanly to what the user sees in Focusrite Control. Mixer Slot Source/Stereo and per-lane Mix Talkback writes also remain withheld.

This is a write-surface decision, not a claim that Custom Mix itself is unsupported.

### Device/settings actions

Public:

- Device nickname
- Phantom-power persistence (`Retain 48V` behaviour; not per-channel phantom switching)
- Talkback input source
- Rediscover/reconnect

Readback-only in v1:

- Device routing preset
- Clock source
- Sample rate
- Digital I/O / S/PDIF mode
- clock-lock status

Preset recall can overwrite routing, sample-rate changes interrupt audio and change channel/Custom Mix availability, and Digital I/O mode changes digital topology and may require a device restart. These settings remain readable but their write actions are intentionally withheld instead of changing a real interface merely for coverage.

## Feedbacks

Server-confirmed feedback is available for the observed state surface, including:

- connection and Remote Devices authorisation
- Monitor Mute / Dim / Talkback / ALT / ALT Enable
- Monitor output-control preset
- Air / Pad / input mode / input availability
- input meter threshold
- Output Mute / Stereo / routed source / availability
- output meter threshold
- Custom Mix Mute / Solo / Talkback / source / stereo state
- Custom Mix meter threshold
- routing preset / clock lock / clock source / sample rate / Digital I/O mode
- Phantom persistence

A feedback can remain available even when the corresponding write action is withheld. That is intentional: server-confirmed readback evidence and hardware-write evidence are different things.

Meter feedbacks are throttled to the configured meter refresh rate so high-frequency telemetry does not force Companion to re-evaluate every feedback on every packet.

## Variables

Useful variables include:

- server host/port and connection state
- device model and status information
- Monitor state; Monitor gain is read-only telemetry
- input availability, meter, nickname, Air, Pad and mode
- output availability, meter, mute, source ID/name, Stereo, gain and hardware-control state
- mixer-slot source/source-name/stereo state
- Custom Mix meters and readable strip state
- clock/sample-rate/Digital-I/O/talkback settings

The full mixer-slot variable set is optional because it creates a large number of **read-only diagnostic variables**. Enabling those variables does not unlock a mixer-slot write action.

## Presets

Public presets are built only from the retained v1 write surface. Presets that target a withheld action or a currently blocked Output are removed by the same definition policy used for actions.

There are no public ALT or generic Custom Mix write presets in v1.

## Important hardware limitations

### No physical input Gain or direct input Mute action

The 18i20 3rd Gen does not expose the physical analogue input gain potentiometers as normal digital controls through the tested Focusrite Control Server schema.

Hardware/protocol testing also did not establish a host-visible direct per-input hardware mute. The module therefore does **not** provide fake `Input Gain`, `Input Mute`, `Mic Kill` or per-channel 48 V actions.

A Custom Mix mute only affects that mixer path; it is not equivalent to muting the raw hardware input a DAW can open directly.

### Monitor gain item 1677

Physical testing did not establish a useful write path for Monitor gain item `1677`. It remains **read-only telemetry** and is excluded from actions, presets and raw-write paths.

### Output `assign-mix`

The private output schema contains an `assign-mix` descriptor, but repeated active sessions have materialised **no value on any of the 26 outputs**, including while normal Output Routing / Custom Mix operations were performed.

It therefore has no public action, preset, feedback or raw-write path. Normal Output source/readback behaviour is used instead. `assign-mix` is not a v1 blocker and is not chased with blind writes.

## No Advanced Raw action in v1

The public v1 connection configuration does **not** expose an Advanced Raw write action. Dedicated research/TestBench tooling stays separate from the normal user-facing write surface.

Unknown item IDs, meters/status items, firmware/reset/restore/snapshot commands, Monitor gain, unvalidated output configurations and withheld write families cannot be used as a raw bypass.

## Troubleshooting

If the connection stays on `Waiting for Scarlett 18i20`:

1. Confirm the Scarlett is connected and visible in Focusrite Control.
2. In Focusrite Control → Device Settings → Remote Devices, approve the **Companion Scarlett 18i20** client if required.
3. Leave Auto-discovery enabled.
4. If you changed Windows firewall rules, allow local Focusrite Control Server and Companion traffic.
5. Enable **Verbose protocol logging** only while debugging.

If auto-discovery fails, do not guess a TCP port. Manual mode should be used only when you already know the current Focusrite Control Server host and TCP port.

## Third-party attribution

This module incorporates/adapts patterns from MIT-licensed Bitfocus code. The relevant upstream notice is carried in this packaged help so it remains with distributed module archives:

> MIT License
>
> Copyright (c) 2022 Bitfocus AS - Open Source
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

The project combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol research and does not claim that every protocol detail was independently discovered. Focusrite is a trademark of its respective owner; this module is not affiliated with or endorsed by Focusrite.
