# Hardware test history

Physical device: **Scarlett 18i20 (3rd Gen)**.

This file records material completed physical/user-host results. For current state and next action, prefer root `HANDOFF`, `docs/CURRENT_HANDOFF.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`.

## Historical guarded reversible Core test

Earlier guarded Companion / Focusrite Control Server work validated with server-confirmed change + restoration:

- Air Inputs 1–8;
- Pad Inputs 1–8;
- Inputs 1–2 Line/Instrument;
- Monitor Mute;
- Monitor Dim;
- Monitor Talkback.

Historical guarded result: **21 passed, 0 failed, 0 restore failures**.

## v0.1.13 SAFE run — 2026-08-21

Pre-write audit verified the existing r9 page, 42/42 explicit SAFE setters, exact model, and Remote Devices authorization.

Automated result:

- **3 PASS**;
- **18 SKIP** because exact initial server state was unknown;
- **0 FAIL**.

Executed/restored: Monitor Talkback and Input 1/2 Line/Instrument. The skips were deliberate fail-closed behavior.

## Cold-start state limitation

A fresh Control Server session may omit current values. Missing values remain unknown; do not add subscribe loops, reconnect delays, write-to-warm behavior, stale persistence, or invented read/get commands merely to eliminate safe skips.

## Monitor gain 1677

Physical testing did not establish a useful software write path for the physical Monitor level. Item `1677` remains **read-only** and is excluded from normal actions, presets, and raw writes.

## Broad manual REC — 2026-08-25 to 2026-08-26

The manual recorder is read-only:

- no Focusrite write by harness;
- no Companion button press by harness;
- server-confirmed feedback/readback observation;
- sanitized reports exclude private identities, raw XML, raw private item values, and user paths.

A broad reportVersion 6 session on module 0.1.19 recorded:

- duration 425041 ms;
- 829 probes / 31 feedback definitions / 46 meters;
- **193 feedback transitions**;
- **193 PASS**;
- **0 transient race**;
- **0 confirmed mismatch**;
- 367 safe semantic transitions.

Material evidence included visible Stereo/Mono changes, Custom Mix source/stereo topology, Mute/Solo readback, fader/pan movement, representative Output state changes, and `assign-mix` remaining schema-present but unmaterialised.

This was readback evidence, not a generic Companion write proof.

## ALT / Speaker Switching + meters REC — 2026-08-26

The later dedicated read-only REC produced:

- 11 transitions / 11 PASS;
- 0 race;
- 0 mismatch;
- `monitor_alt_enable` both states observed;
- `monitor_alt` both states observed;
- human Output 3 availability changed with Speaker Switching ownership.

Classification for ALT feedback/readback: **HARDWARE_DYNAMIC_CLOSED**. Companion ALT writes remain withheld for v1.

Meter aggregate:

- Inputs **8/8 closed**;
- currently available Outputs **22/22 closed**;
- Custom Mix meters **12/12 closed**;
- human Outputs 21–24 remain `CONFIGURATION_UNAVAILABLE` in the tested configuration.

Do not alter Sample Rate or Digital I/O merely to force Outputs 21–24 available.

## Output-definition lifecycle regression and repair

A public-surface smoke initially produced widespread Output `NO_TRANSITION` failures while non-Output writes worked. Source inspection found that filtered Output actions could be built while server-confirmed availability was still unknown and not rebuilt later.

`src/main.js` was repaired so filtered action/preset definitions refresh when availability materialises/changes. Callback-time availability checks remain fail-closed. Later hardware runs confirmed direct Output writes recovered.

## Strict pair-routing evidence — V3/V4, 2026-08-26

V4 used reciprocal parser/schema source-pair metadata and the current live Focusrite configuration as a stable baseline.

Result on module 0.1.20:

- SAFE Core **PASS 3 / FAIL 0 / SKIP 18**;
- 52 release tests;
- **42 PASS / 10 FAIL**;
- hard abort false;
- reconnect PASS;
- global exact restore PASS.

All ten failures were `output_pair_source` with classification `NO_TRANSITION`. Direct Output Source/Gain/Nickname paths closed where runnable.

The historical V8 pair oracle was then re-read and found too permissive for the modern two-member routing contract. It could accept a result where the requested left member changed while the right member remained original.

Decision: `output_pair_source` is **WITHHELD for v1**. The project does not weaken the newer exact oracle.

This reclassification does not erase the independently observed Stereo/Mono readback evidence.

## Final V5 public-surface smoke — 0.1.21

The final V5 smoke removed `output_pair_source` from the expected installed public write surface and retained the exact-restore/collateral safety machinery.

Newest accepted final Phase A result:

- module **0.1.21**;
- retained public write smoke **42/42 PASS**;
- hard abort: **false**;
- exact restore/global safety: **clean**;
- reconnect: **PASS**;
- no `output_pair_source` button created or pressed.

The read-only Phase B/C resume gate later accepted this Phase A result as clean and recent.

Classification: retained public v1 write surface is hardware-closed for the current Scarlett 18i20 (3rd Gen) scope, subject to the explicit per-control filtering and deliberate withholdings documented elsewhere.

## Final cumulative Custom Mix closure — 2026-08-26

The final representative cumulative evaluator reused prior valid read-only evidence and the latest manual REC evidence.

Final result:

- `mix_mute`: representative closed, mismatch 0;
- `mix_solo`: representative closed, mismatch 0;
- `mix_talkback`: representative closed, mismatch 0;
- fader representative: **7 changed paths**;
- pan representative: **4 changed paths**;
- Stereo/Mono representative: **2 changed paths**;
- routing to Custom Mix: **7 Output pairs observed**;
- Custom Mix meters: **12/12 closed, mismatch 0**;
- `FINAL CUSTOM MIX COVERAGE: COMPLETE`.

The final `RUN_FINAL_CUSTOM_MIX_RESUME.bat` invocation did not start a new REC because `A FAIRE PENDANT LE REC` was empty. It performed a read-only resume gate and cumulative Phase C evaluation only. This is the intended behavior when evidence is already complete.

A preceding broad REC had re-sampled already-closed meters while the operator was exercising Mute/Solo/fader/pan/Stereo. The final cumulative logic was corrected so a prior clean dedicated meter closure is not invalidated by an unrelated later broad REC. A meter mismatch with no prior clean closure remains blocking.

No further hardware manipulation is required merely for repetition.

## Final user-host software gate after TestBench closure changes

Latest complete `UPDATE_AND_RUN.bat` result on the final TestBench-only closure checkpoint:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **306/306 Node tests PASS**;
- Companion package build PASS;
- generated `focusrite-scarlett-18i20-0.1.21.tgz`.

No production package version bump was required because the final changes after the imported 0.1.21 build were TestBench/docs-only.

## Current interpretation

Hardware feedback/readback and retained public write validation are complete for the frozen v1 scope by explicit evidence or deliberate write withholding.

Do not rerun broad REC, V3/V4 pair-routing smoke, ALT/meter work, or final public writes merely for repetition.

Still outside validation targets:

- `assign-mix` writes;
- Monitor gain 1677 writes;
- currently unavailable Outputs 21–24 writes;
- firmware/reset/restore/snapshot;
- unknown raw writes;
- invented input preamp gain/input mute/per-channel phantom/Mic Kill;
- disruptive clock/sample-rate/Digital-I/O changes.

## Next technical release gate

The remaining technical release step is an **exact audit of the exact `focusrite-scarlett-18i20-0.1.21.tgz` generated/used on the user host**:

- SHA-256;
- exact archive contents;
- package/manifest coherence;
- bundled public action/preset surface;
- forbidden-feature regression;
- privacy scan;
- attribution/help verification.

Do not infer exact-artifact PASS from source reconstruction alone.

## Result retention / privacy

`testbench/results/` remains intentionally gitignored. Raw/local diagnostics, screenshots, captures, and arbitrary generated reports are not directly committed.

Never publish serials, private hostnames, client keys, endpoints, private IDs, raw private XML/captures, private diagnostics, or user-specific paths.

## Write-promotion hard abort — 2026-08-27

A targeted research-only direct-write promotion campaign was run after the frozen public v1 hardware closure.

Material results:

- Custom Mix produced limited individual direct-write PASS paths but did not establish generic-family promotion;
- Mixer Slot Source/Stereo produced repeated `FAIL_NO_TRANSITION` with clean target restoration;
- ALT remained readback-closed but direct-write baseline remained unknown;
- Output Stereo first target produced `FAIL_COLLATERAL_DRIFT` with two other known writable items differing after target restoration;
- the Output Stereo transaction caused a HARD ABORT and no later Stereo target was attempted.

No hardware write was sent after the hard abort.

Research commit `682441a1b82efa682cecec7cb4147595b579d300` quarantined Output Stereo and broad non-disruptive reruns and added sanitized semantic collateral-drift diagnostics.

Post-quarantine user-host software gate completed with **315/315 tests PASS**, plus dependency, format, lint, manifest and package-build PASS.

See `docs/WRITE_PROMOTION_ABORT_2026-08-27.md` for the detailed evidence and classifications.
