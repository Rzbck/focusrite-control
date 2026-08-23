# Focusrite Scarlett 18i20 (3rd Gen)

This module controls a **Focusrite Scarlett 18i20 (3rd Gen)** through the **Focusrite Control Server** installed with Focusrite Control.

It does **not** replace the Focusrite USB/audio driver. Keep Focusrite Control and its driver installed normally.

## Connection

Use **Auto-discover** unless you have a specific reason not to.

Focusrite Control Server may choose a dynamic TCP port. Auto-discovery sends the Focusrite discovery request to UDP ports **30096–30098**, learns the current TCP port, then opens the normal framed XML session.

If Focusrite Control asks whether to approve a new client, approve the Companion client once. The module stores a stable client ID in the Companion connection configuration so the approval should survive module restarts.

Manual mode is available only for troubleshooting when you already know the current Focusrite Control Server host and TCP port. The module does not assume a default TCP port.

## Supported hardware

Initial community-tested target:

- Scarlett 18i20 (3rd Gen)
- Focusrite Control generation using FocusriteControlServer
- Firmware 1644 was the device used for the protocol verification

The module deliberately rejects other Focusrite models for now instead of pretending they are tested.

## Actions

The guarded reversible hardware-tested subset is Air 1–8, Pad 1–8, Input 1/2 Line/Instrument, Monitor Mute, Monitor Dim and Talkback. Other action families below are implemented/schema-observed and require their own hardware/action audit before being described as hardware-tested.

### Monitor

- Monitor Mute
- Dim
- Talkback
- Alt speakers enable
- Select Main/Alt
- Select which output group follows Monitor/Dim/Mute (`1-2`, `1-4`, `1-6`, `1-8`, `All`, `None`)

### Analogue inputs

- Air, inputs 1–8
- Pad, inputs 1–8
- Line/Instrument mode, inputs 1–2 only
- Input nickname

The choices are created from the device schema returned by Focusrite Control Server, so unsupported controls are not offered.

### Outputs — implemented/schema-observed

The device exposes individual controls for Monitor, Line, S/PDIF, ADAT and Loopback outputs. Public direct-output choices are filtered by the current Scarlett 18i20 (3rd Gen) hardware evidence profile so known no-effect or behavior-mismatched direct targets are not offered.

- Mute a supported individual output; direct output mute is intentionally single-output only
- Set/adjust analogue output level on supported direct targets
- Route an individual output on supported direct targets to a hardware input, playback channel or custom mix lane
- Route a stereo output pair to a stereo source pair
- Stereo-link flag on supported direct targets
- Output nickname on supported direct targets

### Custom mixer — implemented/schema-observed

The Scarlett exposes 24 assignable mixer input slots and six named stereo mixes (A–F).

Public write actions currently include:

- Mix A–F slot gain
- Mix A–F slot pan
- Mix A–F slot mute
- Mix A–F slot solo
- Apply those mixer actions to Left, Right or both lanes

Current Scarlett 18i20 (3rd Gen) hardware evidence has not demonstrated a useful write path for **Mixer Slot Source**, **Mixer Slot Stereo**, or **per-lane Mix Talkback**. Those public write families are therefore withheld while their readable state/feedback remains available. This does not remove the separately hardware-tested global Monitor Talkback action.

### Device settings — implemented/schema-observed

- Device nickname
- Recall the device routing preset
- Clock source
- Sample rate
- Digital I/O / S/PDIF mode
- Phantom-power persistence
- Talkback input source
- Rediscover/reconnect

**Warning:** changing sample rate interrupts audio. Changing Digital I/O mode can require a device restart. Recalling a device preset changes routing.

## Feedbacks

State feedback is available for:

- Connection and availability
- Monitor Mute / Dim / Talkback / Alt
- Monitor output-control preset
- Air / Pad / input mode
- Input meter threshold
- Output mute / stereo / routed source
- Output meter threshold
- Mixer mute / solo / talkback / source / stereo
- Mix meter threshold
- Routing preset / clock lock / clock source / sample rate / Digital I/O mode
- Phantom persistence
- Optional raw item equality feedback

Meter feedbacks are throttled to the configured meter refresh rate so high-frequency meter telemetry does not force Companion to re-evaluate every feedback on every packet.

## Variables

Useful variables include:

- server host/port, connection state
- device model, serial, device ID, firmware
- Monitor state; Monitor gain is read-only telemetry
- input availability, meter, nickname, Air, Pad and mode
- output availability, meter, mute, source ID, source name, stereo and gain
- mixer-slot source, source name and stereo flag
- mix meter and talkback state
- clock/sample-rate/Digital-I/O/talkback settings

The full set of every mixer slot's gain/pan/mute/solo variables is optional because enabling it creates a large number of variables.

## Presets

Preset buttons are organised under:

- Monitor
- Inputs
- Outputs
- Mixer

They include state feedback styles for the common controls. Presets that would target a direct output mute blocked by the hardware evidence profile are removed from the public preset set.

## Important hardware limitation: no per-input Gain or Mute action

The 18i20 3rd Gen **does not expose the physical analogue input gain potentiometers as a digital control** through Focusrite Control Server.

Extensive protocol testing on the 18i20 3rd Gen also found no host-visible per-input hardware mute. Therefore this module does **not** provide a fake "Input Gain", "Input Mute", "Mic Kill", or per-channel 48 V action.

This is intentional. A Custom Mix mute only mutes that mixer path; it is not the same as muting the raw hardware input that a DAW can open directly.

### 48 V

The Control Server schema for this unit exposes **phantom persistence**, but it does not expose a normal per-channel phantom-power item. The module therefore only exposes Phantom Persistence. It will not guess undocumented 48 V commands.

## Advanced raw writes

An optional Advanced action can be enabled in the connection configuration.

It is deliberately restricted to the module's **known writable control set** and then filtered again through the same Scarlett 18i20 (3rd Gen) hardware policy used by the public actions. It refuses writes to:

- meters
- availability/status items
- firmware update/reset/restore commands
- snapshot commands
- buffer size (valid values not verified)
- talkback source attenuation (range/semantics not sufficiently verified)
- Monitor gain item 1677 (read-only telemetry)
- direct output controls withheld by the current hardware evidence profile
- Mixer Slot Source/Stereo and per-lane Mix Talkback while those write families are withheld
- any unknown item ID

Advanced Raw therefore cannot be used as a bypass around the hardware policy.

## Troubleshooting

If the connection stays on "Waiting for Scarlett 18i20":

1. Confirm the Scarlett is connected and visible in Focusrite Control.
2. Approve Companion if Focusrite Control asks.
3. Leave Auto-discovery enabled.
4. If you changed Windows firewall rules, allow local Focusrite Control Server and Companion traffic.
5. Enable **Verbose protocol logging** only while debugging.

If auto-discovery fails, do not guess a TCP port. Manual mode should be used only when you already know the current Focusrite Control Server host and TCP port.

### Mixer slot removal

The schema contains separate add/remove-input command items, but their command arguments were not safely verified. Those command items are not exposed. Mixer Slot Source/Stereo state remains readable, while their public write families are currently withheld by the Scarlett 18i20 (3rd Gen) hardware evidence profile.
