# Device support and verified limitations

## Supported

### Focusrite Scarlett 18i20 (3rd Gen)

The module currently requires the exact Focusrite Control Server model string:

```text
Scarlett 18i20 (3rd Gen)
```

This conservative check prevents accidental writes to an untested model whose item map may be different.

## Implemented / schema-observed areas

These areas are implemented from the parsed 18i20 schema. They are **not all individually hardware-tested**. For the current hardware-tested subset, see `docs/HARDWARE_TEST_HISTORY.md`.

- Monitor Mute / Dim / Talkback
- Monitor output-control group
- Monitor gain telemetry (read-only; item 1677 is not writable)
- Main/Alt switching fields
- Air and Pad on analogue inputs
- Line/Instrument mode on inputs 1–2
- Input/output nicknames
- Output mutes and analogue output gains
- Output source routing and stereo flags
- 24 mixer source slots
- Mix A–F gain, pan, mute and solo
- Mix talkback mapping
- Routing preset
- Clock source
- Sample rate
- Digital I/O mode
- Phantom persistence
- Talkback source

## Not exposed as normal actions

### Physical analogue input gain

The physical gain pots on the 18i20 3rd Gen are not represented as a writable ControlServer item.

Protocol verification included:

- Focusrite Control Server schema inspection
- TCP/XML state monitoring
- USB Control + Interrupt capture
- USB Bulk/MIDI capture
- complete AppSpace A/B comparison while moving Analogue Input 3 gain

No gain-position register was found.

### Raw hardware input mute

There is no direct per-analogue-input Mute item in the schema.

The Custom Mixer has per-slot mutes, but those only mute a Custom Mix path. They must not be presented as a guaranteed DAW/raw-input kill.

### Per-channel 48 V

The ControlServer schema exposes `phantom-persistence`, not a per-channel phantom toggle. This module does not guess an undocumented 48 V item ID.

### Buffer size

A buffer-size item exists in the schema, but the valid values were not established by the protocol tests. It is exposed as a read-only variable, not a write action.

### Firmware / reset / restore

These are intentionally blocked. Companion is not a firmware-management tool.
