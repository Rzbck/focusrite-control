# Hardware test history

Physical device: **Scarlett 18i20 (3rd Gen)**.

This file records material completed physical/user-host results. For current classification and next action, prefer `HANDOFF`, `docs/CURRENT_HANDOFF.md`, and `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`.

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

The TestBench reused the existing r9 full-matrix Companion page and audited the exact SAFE Core region before any hardware write.

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

Do not describe this automated v0.1.13 run as 21/21. The accurate result is **3 PASS / 18 SKIP / 0 FAIL**, while the remaining 18 write mappings retain their earlier guarded hardware evidence.

## Cold-start readback regression

Fresh Control Server state acquisition during that campaign was 3/21 for the Core set:

Present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

A 404-item state packet still omitted those 18 missing values. Do not add subscribe loops, reconnect delays, write-to-warm behavior, stale persisted state presented as current, or an invented read/get command merely to eliminate safe skips.

## Monitor gain 1677

Physical testing did not produce useful physical Monitor-level control. Therefore item `1677` is **read-only** and intentionally excluded from normal actions, presets and Advanced Raw writes.

## Manual feedback campaign / reconciliation — 2026-08-25

The manual read-only feedback recorder was expanded to cover the full public feedback surface while the user operated Focusrite Control normally.

Important recorder contract:

- read-only harness;
- no Focusrite write by harness;
- no Companion button press by harness;
- server-confirmed feedback/readback observation;
- sanitized reports exclude serial, hostname, endpoint, client identity, raw XML, raw private item IDs/values and user paths.

A reportVersion 4 capture initially contained fast inverse mismatches caused by scan timing. `ManualFeedbackSweepReconcile.js` was then validated with a strict same-path inverse-PASS-within-500-ms rule. Persistent mismatches are never reclassified. That report reconciled to **27 transient races / 0 confirmed mismatch**.

The subsequent reportVersion 5 capture naturally produced **50 PASS + 1 transient race / 0 confirmed persistent mismatch** and materially strengthened Air/Pad/Monitor and meter evidence.

## Broad manual feedback REC reportVersion 6 — 2026-08-26

Latest completed physical-user observation:

- report class: sanitized manual feedback sweep;
- module: **0.1.19**;
- duration: **425041 ms**;
- public feedback definitions: **31**;
- total feedback probes: **829**;
- non-meter probes: **783**;
- meter probes: **46**;
- feedback transitions: **193**;
- confirmed PASS transitions: **193**;
- transient races: **0**;
- confirmed persistent mismatches: **0**;
- non-meter paths observed in both rendered states: **92**;
- semantic safe paths exposed: **810**;
- semantic paths changed: **94**;
- semantic transitions: **367**.

The harness itself performed **zero hardware writes** and **zero Companion button presses**. The user manipulated Focusrite Control UI while the recorder observed server-confirmed state.

### Custom Mix topology result

Official UI operations produced dynamic Mixer Slot Stereo/Source materialisation across multiple pairs.

Representative slots 3/4:

- both stereo flags `true -> false`;
- follower slot 4 source `None / Unassigned -> Playback 2`;
- relink returned stereo to `true` and follower source to `None / Unassigned`.

Stereo changes were observed on slots 1-6 and 13-18, with source-name movement across Playback, Analogue, ADAT and S/PDIF families.

Classification is strong **SESSION_STATE_OBSERVED** for the official UI path. It is not generic Companion/direct/raw write proof. Public mixer-slot Source remains withheld and Mixer-slot Stereo remains research-gated only.

### Custom Mix strips

The recorder captured clean Mix Mute/Solo feedback transitions across many Mix A left/right strips and Mix D left strips. Gain/Pan semantic diagnostics also moved repeatedly. Mix Talkback state changes were observed on Mix A L/R and Mix D L.

This materially validates feedback/readback. It does not automatically close arbitrary Companion writes across every mix/side/slot combination.

### Outputs

Representative output Mute/Stereo/Source evidence expanded to analogue and digital families. Notable observations included Output 11 repeated Stereo/Source changes, Output 12 follower-source materialisation, Output 25/26 Stereo/Source activity, Output 25 Mute both ways, and additional Mute both-state observations on Outputs 13, 15, 17 and 19.

Direct output gain diagnostics exist only for **Outputs 1-10**. No direct gain semantic variable exists for Outputs **11-26**. This matches the Focusrite Control UI observation that S/PDIF/ADAT/digital outputs do not provide a direct per-output level fader in the current schema.

### assign-mix

`assign-mix` remains:

- **26/26 SCHEMA_PRESENT**;
- **0/26 materialised server values**;
- still unobserved during active representative routing changes on Outputs 1, 3, 11 and 25.

Classification: **SCHEMA_PRESENT + ACTIVE_SESSION_STATE_UNOBSERVED**. Exact raw semantics/write transaction remain unknown. No public/raw write is permitted. `NAVIGATE_MIXES` does not need to be repeated.

### Meters after reportVersion 6

- total: **46**;
- floor + movement closed: **37**;
- floor-only: **4**;
- movement-only / missing floor: **5**;
- never observed: **0**;
- persistent mismatch: **0**.

Breakdown:

- Inputs: **8/8 closed**;
- Outputs 1-20 and 25-26: **22 closed**;
- Outputs 21-24 / ADAT 2.1-2.4: currently `available=false`, therefore **CONFIGURATION_UNAVAILABLE** rather than unsupported;
- Custom Mix: **7/12 closed**;
- remaining Custom Mix floor gaps: **Mix B L/R, Mix C L/R, Mix E R**.

Do not change sample rate, Digital I/O mode or routing merely to force meter closure.

### ALT not exercised

No `monitor_alt` or `monitor_alt_enable` transition occurred in reportVersion 6. Both remain open. This is absence of test evidence, not evidence that the feature is unsupported.

### End-of-REC UI drift

The recorder is read-only and does not restore the user's Focusrite Control operations. The final semantic snapshot did not match the REC baseline on several paths, including some output sources/gain classes, mixer-slot topology/source choices, Mix D Talkback and Pan classes.

Opaque numeric gain/pan values are intentionally not recorded, so the sanitized report cannot reconstruct their original numbers. This is session-state drift, not a recorder failure. Do not describe reportVersion 6 as exact-restored.

## Current interpretation

The broad feedback campaign substantially closes **readback/feedback behavior**. The remaining release work is no longer “click everything again”. It is now:

- five passive Custom Mix meter floor captures if naturally obtainable;
- one isolated ALT/ALT Enable decision/test if those actions remain public;
- audit of actual public write actions against retained direct-write evidence;
- targeted exact-restore proof or v1 withholding for any public write whose transaction remains unproven.

See the current handoff and closure matrix for the authoritative live plan.
