# Hardware test history

## Guarded reversible Core test

Physical device: Scarlett 18i20 (3rd Gen).

Validated through Companion / Focusrite Control Server with server-confirmed state and restoration:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line/Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

Result of the guarded sequence: **21 passed, 0 failed, 0 restore failures**.

This result proves those control mappings/path behaviors for the tested hardware. It does not imply that every implemented output/mixer/settings action is hardware-tested.

## Monitor gain 1677

Physical testing did not produce useful physical Monitor-level control. Therefore item `1677` is read-only and intentionally excluded from normal actions, presets and Advanced Raw writes.

## Cold-start readback regression

Later test sessions exposed a separate state-acquisition issue: after a fresh module process, Air/Pad/Mute/Dim initial values may be absent. The hardware test harness correctly refuses writes when those values cannot be safely restored.
