# Contributing

Contributions are welcome for the current Scarlett 18i20 (3rd Gen) target. Research for other Focusrite models must stay explicitly unvalidated until real hardware testing exists.

## Rules for adding a device

Do not add a product to `companion/manifest.json` merely because it looks similar.

If hardware scope is deliberately expanded later, verify at minimum:

- exact `device-arrival` model string
- input control schema
- output control schema
- mixer structure
- Monitor controls
- safe writable settings
- whether any command-like IDs are reset/firmware operations

Prefer dynamic schema parsing over hard-coded item IDs.

## Safety

Never expose firmware update, factory restore or reset actions.

Do not label Custom Mix mute as "hardware input mute" or "mic kill".

Do not add per-channel phantom power unless the model's ControlServer schema actually exposes it and the write has been safely verified.

## Pull requests

Please include:

- hardware model and generation
- firmware version
- Focusrite Control version
- relevant anonymised schema/log excerpt
- what actions were tested
- whether feedback was confirmed in both directions
