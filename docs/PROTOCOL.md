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

## Safety

Device-arrival contains command-like items such as firmware update, reset and factory restore. They are never placed in the writable set.

The optional Advanced Raw action can only target IDs already classified by the parser as a normal writable audio/routing control.
