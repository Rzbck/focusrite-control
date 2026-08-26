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

Physical testing did not produce useful physical Monitor-level control. Item `1677` is therefore **read-only** and excluded from normal actions, presets and raw writes.

## Manual feedback campaign — 2026-08-25 to 2026-08-26

The read-only manual recorder observes the public feedback surface while the user operates Focusrite Control normally.

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
- visible **Stereo/Mono** changes in Focusrite Control were observed through server-confirmed source/stereo state;
- broad Custom Mix Mute/Solo readback;
- fader/pan semantic movement;
- representative analogue/digital Output Mute/Stereo/Source readback;
- direct output gain confirmed present only on Outputs 1-10, not digital Outputs 11-26;
- `assign-mix` remained schema-present but unmaterialised through active routing.

This broad REC ended with some user UI state different from the REC baseline. It was not an exact-restored campaign.

The Stereo/Mono evidence is real **readback/dynamic hardware evidence**. It does not by itself prove a separate Companion `output_stereo`, `mixer_slot_stereo`, or two-member `output_pair_source` write transaction.

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

Human Output 3 availability changed with Speaker Switching enable, providing strong runtime ownership/availability evidence. This remains UI/readback proof; Companion ALT writes remain withheld for v1.

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

Therefore all meter paths that are currently available are closed. Do not alter Sample Rate or Digital I/O merely to force Outputs 21-24 available.

### Custom Mix navigation observation

Simply viewing another Output/Custom Mix did not need to generate server traffic. That is application UI state, not a missing hardware feature.

The REC did observe real routing changes when several Outputs were actually routed to **Custom Mix**, which is the useful protocol state.

### End-of-session drift

The read-only REC did not restore user operations. At stop Speaker Switching remained enabled, MAIN was selected, several Outputs were left routed to Custom Mix, and opaque Output 1/2 gain classes had changed. Numeric raw gain values are intentionally not stored.

## Output-definition lifecycle regression and repair

A later public-surface release smoke initially produced 39 Output-only `NO_TRANSITION` failures while non-Output writes worked. Source inspection found that Output action definitions could be built while server-confirmed availability was still unknown during cold start and never rebuilt when availability later materialised.

The runtime lifecycle was repaired in `src/main.js` so filtered action/preset definitions refresh on ready and on Output availability materialisation/change. Callback-time availability checks remain fail-closed.

This was a runtime defect, not hardware evidence that all direct Output writes were ineffective.

## Latest exact public-surface smoke — V4, 2026-08-26

After the lifecycle repair, the exact public-surface V4 smoke used reciprocal parser/schema source-pair metadata and the current arbitrary live Focusrite configuration as a stable baseline.

Result:

- module **0.1.20**;
- SAFE Core **PASS 3 / FAIL 0 / SKIP 18**;
- 52 release tests;
- **42 PASS / 10 FAIL**;
- hard abort: **false**;
- reconnect: **PASS**;
- global restore audit: **PASS**.

Write-confirmed in this run where runnable:

- Input 1-8 nickname;
- Input 1/2 mode cycle;
- Output 1 nickname;
- Output 3/5/7/9 Gain Set/Adjust, Source and Nickname;
- Output 11/13/15/17/19/25 Source and Nickname;
- Device nickname;
- Phantom Persistence;
- Monitor preset;
- reconnect returned authorised.

`output_mute` and `talkback_source` were not runnable from the current exact-restorable baseline in that run; they retain prior evidence rather than being falsely marked failed.

### Ten `output_pair_source` failures

Every runnable dedicated pair-routing test failed `NO_TRANSITION`:

- Outputs 3-4;
- 5-6;
- 7-8;
- 9-10;
- 11-12;
- 13-14;
- 15-16;
- 17-18;
- 19-20;
- 25-26.

V4 required both Output members to reach the requested reciprocal source pair. No pair closed that two-member transition, but exact target restoration succeeded and there was no collateral/global drift.

## Re-reading V8 pair evidence

The older completed V8 hardware campaign remains important, but its pair-routing conclusion was too broad for the later public action contract.

The historical V8 pair oracle could accept a routing result when the requested **left** source changed while the **right** Output remained on its original source. That proves useful topology/ownership behavior and restore handling, but not a generic two-member `output_pair_source` transaction.

Therefore the project no longer treats V8 pair topology as `HARDWARE_WRITE_CONFIRMED` for the public `output_pair_source` action.

This reclassification does **not** erase the independently observed Stereo/Mono readback evidence from the broad REC.

## v1 decision after V4

The safest current interpretation is:

- direct `output_source` remains hardware-supported on the validated direct targets/families;
- `output_pair_source` is **WITHHELD for v1**;
- Output Stereo readback remains truthful and physically observed, while `output_stereo` write stays withheld;
- mixer-slot/source-stereo and generic Custom Mix writes stay withheld despite strong readback because generic write closure is not uniform;
- no hardware oracle is weakened merely to turn a repeated `NO_TRANSITION` into PASS.

The corrective packaged build is **0.1.21**. Its V5 final smoke does not create or press `output_pair_source`.

## Result retention policy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics, screenshots and arbitrary generated reports are not directly committed.

For traceability, material sanitized results are preserved in tracked documentation with timestamps and sanitized fingerprints where appropriate.

Never publish serials, private hostnames, client keys, endpoints, private IDs, raw private XML/captures, private diagnostics, or user-specific paths.

## Current interpretation / next hardware work

Hardware feedback/readback validation is substantially closed for the current configuration, including strong Stereo/Mono and Custom Mix state evidence.

The current 0.1.21 release work is **not** another broad exploratory campaign. First the complete user-host software/package gate must pass. Then one final `RUN_FINAL_HARDWARE_AUDIT.bat` run should:

1. validate only the retained public v1 writes through V5 with exact restore;
2. continue to the cumulative **read-only** Custom Mix recorder if Phase A is clean;
3. reuse prior closed evidence where the cumulative collector supports it and report only remaining gaps.

`assign-mix`, currently unavailable Outputs 21-24, Monitor gain 1677, firmware/reset/restore/snapshot, and forbidden non-features are not validation targets.
