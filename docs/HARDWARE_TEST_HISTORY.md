# Hardware test history

Physical device: **Scarlett 18i20 (3rd Gen)**.

## Historical guarded reversible Core test

Earlier guarded hardware work validated these write paths through Companion / Focusrite Control Server with server-confirmed state and restoration:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line/Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

Historical guarded-sequence result: **21 passed, 0 failed, 0 restore failures**.

This proves those mappings/path behaviors for the tested hardware. It does not imply every implemented output/mixer/settings action is hardware-tested.

## v0.1.13 automated SAFE run — 2026-08-21

The current TestBench reused the existing r9 full-matrix Companion page and audited the exact SAFE Core region before any hardware write.

Pre-write checks:

- existing r9 page: **PASS**;
- 42/42 explicit SAFE setters verified;
- audited module version: **0.1.13**;
- exact model: **Scarlett 18i20 (3rd Gen)**;
- module client authorization: **PASS**.

Automated result:

- **PASS 3**;
- **FAIL 0**;
- **SKIP 18**;
- exit code: **0**.

Executed with server-confirmed change and explicit restoration:

- Talkback → restored to `false`;
- Input 1 Line/Instrument → restored to `Line`;
- Input 2 Line/Instrument → restored to `Line`.

Skipped without any write because the initial server state was unknown:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

The skips are intentional safety behavior, not failures. The runner refuses to modify a control when it cannot guarantee restoration to the original state.

Do not describe the latest automated v0.1.13 run as 21/21. The accurate result is **3 PASS / 18 SKIP / 0 FAIL**, while the remaining 18 write mappings retain their earlier guarded hardware evidence.

## Cold-start readback regression

Fresh Control Server state acquisition remains 3/21 for this Core set:

Present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

A 404-item state packet still omitted those 18 missing values. The automated SAFE result above reproduced this limitation exactly.

Do not add subscribe loops, reconnect delays, write-to-warm behavior, stale persisted state presented as current, or an invented read/get command just to eliminate the skips.

## Monitor gain 1677

Physical testing did not produce useful physical Monitor-level control. Therefore item `1677` is **read-only** and intentionally excluded from normal actions, presets and Advanced Raw writes.
