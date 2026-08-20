# Security and safety

This module communicates only with Focusrite Control Server using its local/network protocol.

Please report issues where:

- an action writes the wrong item ID
- an action can trigger reset/firmware/factory operations
- XML framing or discovery accepts malformed data unsafely
- a routing action targets the wrong output or mixer lane

Firmware/reset/restore commands are intentionally not exposed.
