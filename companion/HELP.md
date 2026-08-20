# Focusrite Scarlett 18i20 (3rd Gen)

This module controls a **Focusrite Scarlett 18i20 (3rd Gen)** through the **Focusrite Control Server** installed with Focusrite Control.

It does **not** replace the Focusrite USB/audio driver. Keep Focusrite Control and its driver installed normally.

## Connection

Use **Auto-discover** unless you have a specific reason not to.

Focusrite Control Server may choose a dynamic TCP port. Auto-discovery sends the Focusrite discovery request to UDP ports **30096–30098**, learns the current TCP port, then opens the normal framed XML session.

If Focusrite Control asks whether to approve a new client, approve the Companion client once. The module stores a stable client ID in the Companion connection configuration so the approval should survive module restarts.

Manual mode is available for troubleshooting. The historical/default fallback is `127.0.0.1:49152`.

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

The device exposes individual controls for Monitor, Line, S/PDIF, ADAT and Loopback outputs.

- Mute individual output or stereo pair
- Set/adjust analogue output level
- Route an individual output to a hardware input, playback channel or custom mix lane
- Route a stereo output pair to a stereo source pair
- Stereo-link flag
- Output nickname

### Custom mixer — implemented/schema-observed

The Scarlett exposes 24 assignable mixer input slots and six named stereo mixes (A–F).

- Assign source to mixer slot 1–24
- Stereo-link a mixer slot
- Mix A–F slot gain
- Mix A–F slot pan
- Mix A–F slot mute
- Mix A–F slot solo
- Talkback map for each mix
- Apply mixer actions to Left, Right or both lanes

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

They include state feedback styles for the common controls.

## Important hardware limitation: no per-input Gain or Mute action

The 18i20 3rd Gen **does not expose the physical analogue input gain potentiometers as a digital control** through Focusrite Control Server.

Extensive protocol testing on the 18i20 3rd Gen also found no host-visible per-input hardware mute. Therefore this module does **not** provide a fake "Input Gain", "Input Mute", "Mic Kill", or per-channel 48 V action.

This is intentional. A Custom Mix mute only mutes that mixer path; it is not the same as muting the raw hardware input that a DAW can open directly.

### 48 V

The Control Server schema for this unit exposes **phantom persistence**, but it does not expose a normal per-channel phantom-power item. The module therefore only exposes Phantom Persistence. It will not guess undocumented 48 V commands.

## Advanced raw writes

An optional Advanced action can be enabled in the connection configuration.

It is deliberately restricted to the module's **known writable control set**. It refuses writes to:

- meters
- availability/status items
- firmware update/reset/restore commands
- snapshot commands
- buffer size (valid values not verified)
- talkback source attenuation (range/semantics not sufficiently verified)
- Monitor gain item 1677 (read-only telemetry)
- any unknown item ID

This is intentionally safer than a totally unrestricted raw `<set>` action.

## Troubleshooting

If the connection stays on "Waiting for Scarlett 18i20":

1. Confirm the Scarlett is connected and visible in Focusrite Control.
2. Approve Companion if Focusrite Control asks.
3. Leave Auto-discovery enabled.
4. If you changed Windows firewall rules, allow local Focusrite Control Server and Companion traffic.
5. Enable **Verbose protocol logging** only while debugging.

If auto-discovery fails, try manual `127.0.0.1:49152`; newer/current installations may use another port, which is why Auto mode is preferred.

### Mixer slot removal

The schema contains separate add/remove-input command items, but their command arguments were not safely verified. The module therefore assigns known sources but does not guess a raw "remove slot" command.
