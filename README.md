# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module controlling the **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here

Do not resume this project from an old chat, copied handoff, historical upload, `main` alone, or an embedded SHA.

Resolve the live repository state first, then read:

1. [`HANDOFF`](HANDOFF)
2. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
3. [`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`](docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md)
4. [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md)
5. relevant current source/tests/evidence

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

## Current objective

The broad hardware feedback/protocol investigation is **closed for the v1 scope by evidence or deliberate write withholding**.

The latest public-surface hardware smoke closed the retained direct Output actions after the cold-start definition-lifecycle repair, but the dedicated `output_pair_source` action failed to produce a server-confirmed two-member route transition on every runnable tested pair while exact restoration remained clean.

Older V8 topology evidence was re-read and does not justify treating that action as `HARDWARE_WRITE_CONFIRMED`: the historical pair oracle could pass when the requested left member changed while the right member remained on its original source. Therefore `output_pair_source` is now deliberately **withheld from the v1 public write surface** rather than weakening the newer exact two-member oracle.

The next development package is **0.1.21**. Its final hardware workflow validates only the retained public writes, then continues to the cumulative read-only **Custom Mix** recorder requested for final closure.

## Current branch and package

Objective branch:

`testbench/meter-routing-exact-restore`

Development package version:

`0.1.21`

The most recent fully green user-host packaged checkpoint remains the earlier 0.1.20 build. The 0.1.21 package has changed production bytes and is therefore **SOFTWARE-GATE-PENDING** until the checked-in `UPDATE_AND_RUN.bat` completes dependencies, formatting, lint, manifest validation, all tests, and Companion package build on the user host.

Do not install or hardware-test 0.1.21 until that complete gate is green.

## Final v1 public write surface

Authoritative decision: [`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`](docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md).

### Kept public writes

Monitor:

- Mute;
- Dim;
- Talkback;
- Monitor output-control preset.

Hardware Inputs:

- Air 1–8;
- Pad 1–8;
- Line/Instrument on Inputs 1–2;
- Input nickname.

Outputs, filtered by exact model, retained hardware evidence, and current server-confirmed availability:

- direct Mute on validated members only;
- analogue output Gain Set/Adjust on validated direct targets;
- direct source routing on validated targets/direct source families;
- Output nickname on validated direct targets.

Device/settings:

- Device nickname;
- Phantom Persistence;
- Talkback Source;
- Reconnect.

### Withheld public writes for v1

Readable state may remain where supported, but normal v1 write actions/presets are intentionally removed:

- ALT / Speaker Switching writes;
- Output Stereo writes;
- `output_pair_source` stereo-pair routing;
- Mixer Slot Source/Stereo writes;
- generic Custom Mix Mute/Solo/fader/pan writes;
- per-lane Custom Mix Talkback write;
- Device Preset recall;
- Clock Source;
- Sample Rate;
- Digital I/O / S/PDIF Mode;
- Advanced Raw write action.

Withholding is deliberate scope control, not a claim that readable capability does not exist.

## Why Stereo/Mono evidence is still valid

Physical Focusrite Control operation and the broad read-only REC evidence strongly validate **server-confirmed Stereo/Mono topology readback**. The retained evidence covers Custom Mix faders, pan, Mute, Solo, source/stereo topology, Talkback state and all 12/12 Custom Mix meters.

That evidence is `HARDWARE_DYNAMIC_CLOSED` for the observed UI/readback paths. It is not the same transaction as the dedicated `output_pair_source` Companion action. The latter promises to route two Output members as one stereo source-pair operation and is withheld because the newer exact two-member hardware smoke did not close that behavior.

Output Stereo feedback/readback and mixer-slot/source-stereo diagnostics can therefore remain truthful and server-confirmed even though their public write actions are withheld.

## Output lifecycle and safety policy

The repaired policy rebuilds filtered Output actions/presets when server-confirmed Output availability materialises or changes. Callback-time availability checks remain in place, so stale actions still fail closed.

The v1 policy continues to enforce:

- direct Mute withheld on right/pair-owned members;
- pair-owned right Source withheld from direct routing;
- dedicated `output_pair_source` withheld from public v1;
- Monitor Outputs 1–2 direct Gain withheld;
- known no-effect Gain/Nickname paths withheld;
- Output Stereo write withheld globally;
- human Outputs 21–24 write-blocked even if a future configuration later reports them available, until that available configuration is explicitly hardware-tested;
- explicit `available=false` or unknown availability blocks writes wherever an availability descriptor exists.

## Custom Mix routing and readback

Focusrite Control presents simply **Custom Mix** to the user, while the private server exposes multiple internal mix IDs.

`assign-mix` remains:

- present in the schema on 26/26 Outputs;
- materialised on 0/26 tested Outputs;
- raw semantics unknown;
- write transaction unknown;
- no public action/preset/feedback;
- no raw write.

Therefore v1 does not guess which internal mix ID represents the user's visible Custom Mix selection. Direct Output Source actions do not offer those internal Custom Mix IDs, and stale saved attempts are blocked.

Direct Hardware Input / Software (DAW) Playback / digital routing remains available where hardware-tested.

## Latest retained hardware evidence

The latest V4 public-surface smoke on 0.1.20 recorded **42 PASS / 10 FAIL**, no hard abort, reconnect PASS and a clean global restore audit. The ten failures were exclusively `output_pair_source`; direct Output Source/Gain/Nickname, input nickname/mode-cycle, device nickname, Phantom Persistence and Monitor preset paths closed with server-confirmed transition and exact restore where runnable.

The broad read-only REC evidence remains separate:

- zero recorder Focusrite writes;
- zero Companion button presses by the recorder;
- strong Custom Mix readback for fader, pan, Mute, Solo, source/stereo topology and Talkback;
- Custom Mix meters **12/12 closed**;
- currently available Output meters **22/22 closed**;
- Hardware Input meters **8/8 closed**;
- Outputs 21–24 are `CONFIGURATION_UNAVAILABLE`, not unsupported.

Do not alter Sample Rate or Digital I/O merely to expose Outputs 21–24 for coverage.

## Final hardware workflow

After a green 0.1.21 user-host software gate:

1. import the newly generated `focusrite-scarlett-18i20-0.1.21.tgz` into Companion;
2. keep the existing Focusrite connection and its Remote Devices identity/approval;
3. keep Focusrite Control open and leave the current routing/configuration as-is;
4. physically isolate/mute downstream Outputs and lower physical Monitor/headphone levels before write-capable Phase A;
5. run root `RUN_FINAL_HARDWARE_AUDIT.bat`;
6. Phase A uses the V5 public-surface smoke and never creates or presses `output_pair_source`;
7. after a clean Phase A, Phase B runs the existing read-only recorder while the operator traverses visible **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Stereo**, **Mute**, and other requested visible controls;
8. Phase C accumulates sanitized Custom Mix coverage across sessions.

Do not run older V3/V4 pair-routing smoke campaigns merely to repeat the known failure.

## Passive REC rule

A read-only/passive REC does **not** require Focusrite Control to be restored to its starting state merely because the final state differs. Exact baseline/restoration is mandatory only for write-capable reversible hardware tests where rollback is part of the safety contract.

## User-facing terminology

When describing Focusrite Control, use the terms visible in the application:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Internal TestBench `Mix A–F` labels are protocol/research identifiers only and must not be used as UI instructions.

## Permanent safety / feature boundaries

Keep these unless new real hardware testing explicitly changes them:

- supported hardware: **Scarlett 18i20 (3rd Gen) only**;
- dynamic Focusrite Control Server TCP port and device ID;
- writes only after Remote Devices authorization for this module's own server-assigned client ID;
- server-confirmed feedback/state only, never optimistic;
- no physical analogue input preamp Gain action;
- no direct per-input hardware Mute;
- no per-channel phantom switching;
- no Mic Kill;
- Monitor gain item `1677` remains read-only;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no meter/status writes;
- no write to UNKNOWN or explicit `available=false`;
- no Focusrite software/firmware update without explicit agreement;
- preserve privacy and required third-party attribution.

## Result retention and privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics, screenshots, captures and arbitrary generated reports are not published automatically.

Never publish real serials, private hostnames, client keys, endpoints, private IDs, raw private XML/captures, private diagnostics, or user-specific paths.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested that `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing.

The project position remains:

- only Scarlett 18i20 (3rd Gen) is validated today;
- broader naming is acceptable if Bitfocus prefers it;
- broader device support must not be claimed before real testing.

Wait for the official repository/naming decision before changing public scope. Stable public release target remains `v1.0.0` unless maintainers direct otherwise.

## Exact next validation step

Run the checked-in `UPDATE_AND_RUN.bat` on `testbench/meter-routing-exact-restore` and send the complete gate log. Do not import 0.1.21 or run hardware until that whole gate is green.
