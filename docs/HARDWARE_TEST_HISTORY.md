# Hardware test history

Physical device: **Scarlett 18i20 (3rd Gen)**.

This file records material completed physical/user-host results. For the current state and next action, prefer root `HANDOFF`, `docs/CURRENT_HANDOFF.md`, and `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`.

## Historical guarded reversible Core test

Earlier guarded Companion / Focusrite Control Server work validated with server-confirmed change + restoration:

- Air Inputs 1-8;
- Pad Inputs 1-8;
- Inputs 1-2 Line/Instrument;
- Monitor Mute;
- Monitor Dim;
- Monitor Talkback.

Historical guarded-sequence result: **21 passed, 0 failed, 0 restore failures**.

This proves those tested paths only; it never meant every output/mixer/settings action was hardware-tested.

## v0.1.13 SAFE run — 2026-08-21

Pre-write audit:

- existing r9 page PASS;
- 42/42 explicit SAFE setters verified;
- exact hardware model PASS;
- module Remote Devices authorization PASS.

Automated result:

- **3 PASS**;
- **18 SKIP** because exact initial server state was unknown;
- **0 FAIL**.

Executed/restored:

- Monitor Talkback;
- Input 1 Line/Instrument;
- Input 2 Line/Instrument.

The skips were deliberate safety behavior, not failures. Earlier guarded evidence for Air/Pad/Mute/Dim remained retained.

## Cold-start state limitation

A fresh Control Server session may omit current values. During the cold-start campaign only Input 1 Mode, Input 2 Mode, and Talkback materialised for the 21-control Core set; Air/Pad/Monitor Mute/Dim could remain missing.

Do not add subscribe loops, reconnect delays, write-to-warm behavior, stale persisted state or invented read/get commands merely to eliminate those safe skips.

## Monitor gain 1677

Physical testing did not produce useful physical Monitor-level control. Item `1677` is therefore **read-only** and excluded from normal actions, presets and Advanced Raw writes.

## Manual feedback campaign — 2026-08-25 to 2026-08-26

The read-only manual recorder observes the full public feedback surface while the user operates Focusrite Control normally.

Recorder contract:

- no Focusrite write by harness;
- no Companion button press by harness;
- server-confirmed feedback/readback observation;
- sanitized reports exclude private identities, raw XML, raw private item values and user paths.

An earlier report required timing-race reconciliation. The later reportVersion 5 produced **50 PASS + 1 transient race / 0 persistent mismatch** and materially closed Air/Pad/Monitor plus meter paths.

## Broad manual REC reportVersion 6 — 2026-08-26 05:59 UTC

Sanitized result:

- module **0.1.19**;
- duration 425041 ms;
- 829 probes / 31 public feedback definitions / 46 meters;
- **193 feedback transitions**;
- **193 PASS**;
- **0 transient race**;
- **0 confirmed mismatch**;
- 367 safe semantic transitions.

Material evidence:

- strong multi-pair official-UI `SESSION_STATE_OBSERVED` for Custom Mix source/stereo topology;
- broad Custom Mix Mute/Solo readback;
- fader/pan semantic movement;
- representative analogue/digital Output Mute/Stereo/Source readback;
- direct output gain confirmed present only on Outputs 1-10, not digital Outputs 11-26;
- `assign-mix` remained schema-present but unmaterialised through active routing.

This broad REC ended with some user UI state different from the REC baseline. It was not an exact-restored campaign.

## ALT / Speaker Switching + remaining meters REC — 2026-08-26 06:29 UTC

Dedicated tracked evidence:

`docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md`

Exact supplied sanitized report:

- updated `2026-08-26T06:29:16.831Z`;
- size 606632 bytes;
- SHA-256 `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`.

Recorder result:

- read-only harness;
- zero harness writes;
- zero Companion button presses;
- duration 165060 ms;
- 477 scan cycles;
- **11 feedback transitions**;
- **11 PASS**;
- **0 transient race**;
- **0 confirmed mismatch**.

### ALT / Speaker Switching

`monitor_alt_enable` produced three clean PASS transitions and both boolean states.

`monitor_alt` produced four clean PASS transitions and both boolean states.

Classification for feedback/readback: **HARDWARE_DYNAMIC_CLOSED** for both.

Human Output 3 availability changed in lock-step with Speaker Switching enable, providing strong runtime ownership/availability evidence. This remains UI/readback proof; Companion ALT writes still belong in the final action-surface audit.

### Meters

Newest aggregate:

- **42/46** fully closed with floor + movement;
- Inputs **8/8 closed**;
- currently available Outputs **22/22 closed**;
- **Custom Mix meters 12/12 closed**;
- human Outputs 21-24 remain floor-only because `available=false` in the current configuration;
- 0 movement-only;
- 0 never observed;
- 0 persistent mismatch.

Therefore all meter paths that are currently available are closed. Do not alter sample rate or Digital I/O mode merely to force Outputs 21-24 available.

### Custom Mix navigation observation

Simply viewing another Output/Custom Mix did not need to generate server traffic. That is application UI state, not a missing hardware feature.

The REC did observe real routing changes when several Outputs were actually routed to **Custom Mix**, which is the useful protocol state.

### End-of-session drift

The read-only REC did not restore user operations. At stop Speaker Switching remained enabled, MAIN was selected, several Outputs were left routed to Custom Mix, and opaque Output 1/2 gain classes had changed. Numeric raw gain values are intentionally not stored.

## Result retention policy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics, screenshots and arbitrary generated reports are not directly committed.

For traceability, material sanitized results are preserved in tracked documentation with timestamp + SHA-256, and dedicated validation documents are created when a result materially changes the project state.

Never publish serials, private hostnames, client keys, endpoints, private IDs, raw private XML/captures, private diagnostics, or user-specific paths.

## Current interpretation

Hardware feedback/meter validation is now substantially closed for the current configuration. The remaining release work is no longer another broad click-everything REC.

Remaining material work is the **public action write-surface audit**:

- audit ALT / ALT Enable Companion writes;
- audit public Custom Mix Mute/Solo/fader/pan writes with representative exact restoration or constrain/withhold unproven combinations;
- decide v1 policy for disruptive Device Preset / Clock Source / Sample Rate / Digital I/O actions, with safest default = withhold unless deliberately approved;
- decide whether nickname actions need a low-risk synthetic exact-restore test;
- audit every output action still visible after `hardware-policy.js` filtering against retained direct-write evidence.

`assign-mix`, currently unavailable Outputs 21-24, Monitor gain 1677, firmware/reset/restore/snapshot, and forbidden non-features are not remaining validation targets.
