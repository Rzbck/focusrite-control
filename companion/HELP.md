# Focusrite Scarlett 18i20 (3rd Gen)

This module controls a **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** installed with Focusrite Control.

It does **not** replace the Focusrite USB/audio driver. Keep Focusrite Control and its driver installed normally.

## Connection

Use **Auto-discover** unless you have a specific troubleshooting reason not to.

Focusrite Control Server may choose a dynamic TCP port. Auto-discovery uses the proven Focusrite discovery request on UDP ports **30096–30098**, learns the current TCP endpoint, then opens the framed XML session. The module does not assume a fixed TCP port or device ID.

Writes remain blocked until Focusrite Control authorises this module's **own server-assigned client ID** in Remote Devices. Approval for another client is not accepted as approval for this Companion connection.

## Supported hardware

Current hardware-tested write target:

- **Scarlett 18i20 (3rd Gen) only**

Other Focusrite models are deliberately rejected for writes until separate real-hardware validation exists.

## v1 public write policy

A readable or schema-present control is **not automatically a writable public action**. The v1 surface keeps only write families backed by the retained hardware evidence and current fail-closed policy.

Feedbacks and variables use server-confirmed state only. The module never fakes a successful write through optimistic local state.

### Monitor

Public writes:

- Monitor Mute
- Monitor Dim
- Monitor Talkback
- Monitor output-control preset (`1-2`, `1-4`, `1-6`, `1-8`, `All`, `None`)

Readback-only / withheld writes in v1:

- ALT / Speaker Switching enable
- MAIN / ALT selection
- physical Monitor level / Monitor gain item `1677`

ALT and ALT Enable have been dynamically observed on the physical 18i20 through normal Focusrite Control operation, including Output ownership/availability changes. That closes their readback behavior, not a separate Companion write transaction.

### Hardware Inputs

Public writes:

- Air, Inputs 1–8
- Pad, Inputs 1–8
- Line/Instrument mode, Inputs 1–2 only
- Input nickname

There is no fake physical preamp Gain, direct per-input hardware Mute, Mic Kill or per-channel phantom-power action.

### Outputs

Public writes are filtered by the exact hardware profile and current server-confirmed availability:

- Mute on independently validated direct members only
- Set/adjust analogue Output level on validated gain-capable targets only
- Route a validated individual Output to a direct Hardware Input / Software (DAW) Playback / digital source
- Output nickname on validated direct targets

Important restrictions:

- direct Mute is withheld on right/pair-owned Output members;
- pair-owned right Source is withheld from direct routing;
- **dedicated stereo-pair routing (`output_pair_source`) is withheld for v1**;
- Monitor Outputs 1–2 direct Gain remains withheld;
- known no-effect/right-owned gain and nickname paths remain withheld;
- **Output Stereo-link writes are withheld for v1**; Stereo state remains readable;
- internal Custom Mix source IDs are not offered as Output routing writes;
- human Outputs **21–24** remain write-blocked until an available configuration receives explicit real-hardware validation.

When an Output has an `available` item, writes require its **server-confirmed value to be true**. `false`, blank or unknown availability receives no write.

#### Why stereo-pair routing is withheld

The latest exact public-surface hardware smoke required both Output members to reach the requested source pair. All ten runnable `output_pair_source` tests returned `NO_TRANSITION`, while the original target state restored exactly and the other retained direct Output write families passed.

Older V8 topology evidence was re-read and did not prove the stronger two-member contract: its historical oracle could accept a route where the requested left member changed while the right member remained on its original source. v1 therefore withholds the action rather than weakening the newer hardware oracle.

This does **not** invalidate Output Stereo readback or the physical Stereo/Mono behavior observed in Focusrite Control.

### Custom Mix — readback/feedback

Focusrite Control presents **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Stereo**, **Mute** and related visible controls. The server internally exposes twelve mono lanes / six stereo Custom Mix pairs and 24 mixer source slots.

Physical UI testing and broad read-only recording strongly validate server-confirmed readback for:

- Custom Mix faders
- pan
- Mute
- Solo
- source/stereo topology, including Stereo/Mono changes made in Focusrite Control
- Talkback state
- all **12/12 Custom Mix meters**

This evidence is readback/dynamic hardware closure. Generic public write actions for Custom Mix fader/pan/Mute/Solo, Mixer Slot Source/Stereo and per-lane Mix Talkback remain withheld because direct-write evidence is not uniform across all internal lanes/sides/slots and the internal mix identities do not map cleanly to the UI.

### Device/settings

Public writes:

- Device nickname
- Phantom-power persistence (`Retain 48V` behavior; not per-channel phantom switching)
- Talkback input source
- Rediscover/reconnect

Readback-only / withheld writes in v1:

- Device routing preset
- Clock source
- Sample rate
- Digital I/O / S/PDIF mode
- clock-lock status

The disruptive settings remain readable but are withheld from normal public writes rather than changing real clocking/routing merely for test coverage.

## Feedbacks

Server-confirmed feedback includes the observed state surface such as:

- connection and Remote Devices authorisation
- Monitor Mute / Dim / Talkback / ALT / ALT Enable
- Monitor output-control preset
- Air / Pad / input mode / input availability
- input meters
- Output Mute / Stereo / routed source / availability
- Output meters
- Custom Mix Mute / Solo / Talkback / source / stereo state
- Custom Mix meters
- routing preset / clock lock / clock source / sample rate / Digital I/O mode
- Phantom persistence

A feedback can remain available even when the corresponding write action is withheld. Server-confirmed readback and hardware-write evidence are intentionally treated as different evidence classes.

## Variables

Useful variables include:

- server endpoint and connection state
- device model/status
- Monitor state; Monitor gain is read-only telemetry
- input availability, meter, nickname, Air, Pad and mode
- Output availability, meter, Mute, source ID/name, Stereo, gain and hardware-control state
- mixer-slot source/source-name/stereo state
- Custom Mix meters and readable strip state
- clock/sample-rate/Digital-I/O/talkback settings

The full mixer-slot variable set is optional because it creates many **read-only diagnostic variables**. Enabling those variables does not unlock a mixer-slot write action.

## Presets

Public presets are built only from the retained v1 write surface. Presets targeting withheld actions or currently blocked Outputs are removed by the same definition policy used for actions.

There are no public ALT, Output Stereo, stereo-pair routing or generic Custom Mix write presets in v1.

## Important hardware limitations

### No physical input Gain or direct input Mute action

The tested Focusrite Control Server schema does not expose the physical analogue input gain potentiometers as normal digital controls. Hardware testing also did not establish a host-visible universal direct per-input hardware Mute.

A Custom Mix Mute affects that mixer path only; it is not equivalent to muting the raw hardware input a DAW can open directly.

### Monitor gain item 1677

Physical testing did not establish a useful hardware-effective write path for Monitor gain item `1677`. It remains **read-only telemetry** and is excluded from actions, presets and raw-write paths.

### Output `assign-mix`

The private Output schema contains an `assign-mix` descriptor, but repeated active sessions have materialised **no value on any of the 26 Outputs**, including during normal Output Routing / Custom Mix operation.

It therefore has no public action, preset, feedback or raw-write path. Its raw semantics and write transaction remain unknown and are not guessed.

## No Advanced Raw action in v1

The public v1 connection configuration does **not** expose an Advanced Raw write action. Dedicated research/TestBench tooling stays separate from the normal user-facing write surface.

Unknown item IDs, meters/status items, firmware/reset/restore/snapshot commands, Monitor gain, unvalidated Output configurations and withheld write families cannot be used as a raw bypass.

## Troubleshooting

If the connection stays on `Waiting for Scarlett 18i20`:

1. Confirm the Scarlett is connected and visible in Focusrite Control.
2. In Focusrite Control → Device Settings → Remote Devices, approve the **Companion Scarlett 18i20** client if required.
3. Leave Auto-discovery enabled.
4. If Windows firewall rules were changed, allow local Focusrite Control Server and Companion traffic.
5. Enable **Verbose protocol logging** only while debugging.

If auto-discovery fails, do not guess a TCP port. Manual mode should be used only when the current Focusrite Control Server host and TCP port are already known.

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
