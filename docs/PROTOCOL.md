# Focusrite Control Server protocol

## Transport

Focusrite Control Server messages are UTF-8 XML frames:

```text
Length=XXXXXX <xml>
```

`XXXXXX` is the payload byte length as six uppercase hexadecimal digits.

The module uses `Buffer.byteLength` semantics by framing from a UTF-8 Buffer, so non-ASCII client names do not corrupt the message length.

## Session

Typical client session:

```xml
<client-details hostname="Companion Scarlett 18i20" client-key="persistent-uuid"/>
<keep-alive/>
<device-subscribe devid="dynamic-device-id" subscribe="true"/>
```

Writes use:

```xml
<set devid="dynamic-device-id">
  <item id="item-id" value="value"/>
</set>
```

The module never assumes a fixed device ID.

## Discovery

Auto discovery sends the framed XML:

```xml
<client-discovery app="SAFFIRE-CONTROL" version="4"/>
```

to UDP ports:

- 30096
- 30097
- 30098

It accepts a `server-announcement` response and connects to the returned TCP port.

The module also sends discovery to loopback because Companion and Focusrite Control Server commonly run on the same Windows computer.

## Keepalive and reconnect

- Keepalive interval: 3 seconds
- TCP keepalive enabled
- Automatic exponential reconnect up to 30 seconds
- Auto discovery is repeated on reconnect, so a changed ControlServer port is handled

## Schema is not the same thing as current state

This distinction is mandatory when interpreting Focusrite Control Server evidence.

`device-arrival` describes the device schema and can declare a control item by ID without supplying that item's current value. The module parses those declared controls into descriptors and capability structures.

The current state cache is a separate evidence stream:

1. `src/device-parser.js` seeds `device.initialState` only from schema tags that explicitly contain a `value=` attribute;
2. `src/focusrite-client.js` clears its state cache on device arrival;
3. it copies only those explicitly supplied initial values into the cache;
4. later `<set>` messages update the cache;
5. `getValue()` returns only this observed cache.

Therefore all of the following are different facts and must remain separate:

- `SCHEMA_PRESENT` — the Control Server declared an item/control ID;
- `INITIAL_VALUE_OBSERVED` — the server supplied a current value in the arrival payload;
- `SET_VALUE_OBSERVED` — a later server `<set>` supplied a value;
- `HARDWARE_WRITE_CONFIRMED` — a deliberately tested write changed the physical device and the server confirmed it;
- `HARDWARE_DYNAMIC_CLOSED` — the full action/feedback/restore behaviour was physically exercised and matched the independent oracle.

A missing cached value means only **not observed by this client in this session**. It does not mean the schema item is absent, the function is unsupported, the hardware cannot perform it, or the value is `false`.

Do not infer a default for an omitted boolean. Historical independent Control Server examples show a complete `device-arrival` control schema followed by a `<set>` containing only a subset of those declared item IDs. That corroborates sparse/partial state materialisation as a protocol-family behaviour, but older-hardware examples remain research-only and are not Scarlett 18i20 (3rd Gen) hardware proof.

## Evidence/inference rule

Before classifying any control as unsupported, non-actionable, or closed because a value is missing:

1. check Focusrite official documentation for the exact hardware generation;
2. check whether the current 18i20 schema declares the control;
3. check current and older physical/session evidence for contradictory observations;
4. identify whether the missing value is merely absent from the current state cache;
5. distinguish implementation status from physical hardware validation;
6. only classify `EVAL_ONLY_NONACTIONABLE` when evidence positively establishes that no responsible exact-restore test path exists under the validated conditions.

`BASELINE_UNKNOWN` is a session/readback result, not a capability verdict.

A hardware test should require only the server-confirmed state that is genuinely necessary for exact restoration of the property being changed. Do not manufacture an oversized prerequisite tuple merely for convenience. Related properties may still be observed before/after to detect collateral changes.

## Scarlett 18i20 mappings used

The module does not hardcode most item IDs in actions. It parses the `device-arrival` schema returned by Focusrite Control Server.

Verified examples from a Scarlett 18i20 (3rd Gen), firmware 1644:

- Monitor gain: 1677
- Dim: 1678
- Monitor Mute: 1679
- Alt enable: 1680
- Alt: 1681
- Talkback: 1682
- Monitor output-control preset: 1683
- Clock source: 1685
- Sample rate: 1686
- Digital I/O mode: 1689
- Phantom persistence: 1690
- Talkback source: 1691

Input control IDs are also parsed from schema rather than assumed.

For mixer strips, the current 18i20 schema parser exposes distinct `gain`, `pan`, `mute`, and `solo` item IDs per strip. These are separate Control Server schema controls; do not collapse them into a single gain-matrix assumption merely because lower-level USB research uses a different abstraction.

## Official Focusrite product evidence relevant to mixer interpretation

Focusrite's Scarlett 18i20 3rd Gen specifications state:

- Focusrite Control software mixer;
- 12 mono Custom Mixes;
- maximum 24 mono custom-mix inputs.

Source:

- https://userguides.focusrite.com/hc/en-gb/articles/23031286748306-Scarlett-18i20-3rd-Gen-specifications

Focusrite's Custom Mix tutorial explicitly applies to Scarlett 18i20 3rd Gen and documents muting/soloing channels independently within Custom Mixes.

Sources:

- https://support.focusrite.com/hc/en-gb/articles/115004431245-Focusrite-Control-Tutorial-2-Setting-Custom-Mixes
- https://support.focusrite.com/hc/en-gb/articles/360014293199-How-many-Custom-Mixes-can-I-use-on-my-interface

These sources confirm product behaviour. They do not by themselves prove the exact TCP item semantics or exact low-level USB mapping; those still require schema/protocol evidence and physical testing.

## Safety

Device-arrival contains command-like items such as firmware update, reset and factory restore. They are never placed in the writable set.

The optional Advanced Raw action can only target IDs already classified by the parser as a normal writable audio/routing control.

Monitor gain item `1677` remains read-only regardless of schema presence.
