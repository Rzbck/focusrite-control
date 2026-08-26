# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-26

This is the parent hardware-validation checklist for the **31 public Companion feedback definitions**. Supported hardware remains **Scarlett 18i20 (3rd Gen) only**.

## Evidence classes

Keep these separate:

1. **OFFICIAL PRODUCT BEHAVIOUR**
2. **SCHEMA_PRESENT**
3. **SESSION_STATE_OBSERVED**
4. **IMPLEMENTED**
5. **HARDWARE_WRITE_CONFIRMED**
6. **HARDWARE_DYNAMIC_CLOSED**

Additional classes:

- **READ_ONLY_STATUS** — passive observation is the correct validation model.
- **HARDWARE_STATIC_CONFIRMED** — state/schema is corroborated but dynamic closure is not appropriate.
- **EVAL_ONLY_SAFE_ACTIONABLE** — reversible test only from exact server-confirmed baseline and physical isolation where audio can change.
- **RESEARCH_OPEN / EVAL_ONLY** — capability exists but exact transaction/ownership semantics remain unresolved.
- **CONFIGURATION_UNAVAILABLE** — current server state says unavailable; never reinterpret as permanently unsupported.
- **UNSUPPORTED/BLOCKED** — deliberately excluded from write-driven validation.
- **PARTIAL** — instances have different evidence levels.

`UNKNOWN`, blank, missing cache, `BASELINE_UNKNOWN`, `neverObserved`, or a single-state observation never proves absence.

User instructions must use **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, **Mute**, **MAIN**, and **ALT**, not internal TestBench Mix A-F names.

## Broad read-only hardware evidence

The read-only manual recorder performed no Focusrite writes and pressed no Companion buttons. Across the broad sessions it established strong server-confirmed UI/readback evidence for:

- Custom Mix faders;
- pan;
- Mute;
- Solo;
- source/stereo topology, including visible **Stereo/Mono** changes made in Focusrite Control;
- Talkback state;
- all **12/12 Custom Mix meters**;
- all currently available Output meter paths.

This evidence is valid `SESSION_STATE_OBSERVED` / `HARDWARE_DYNAMIC_CLOSED` readback evidence. It does not automatically prove a separate Companion write transaction.

The latest tracked ALT/meter REC updated `2026-08-26T06:29:16.831Z`, module 0.1.19:

- read-only harness: true;
- hardware writes by harness: false;
- Companion button presses by harness: false;
- 829 probes / 31 feedback definitions / 46 meters;
- **11 transitions / 11 PASS / 0 race / 0 mismatch**.

ALT / Speaker Switching readback is `HARDWARE_DYNAMIC_CLOSED`; human Output 3 availability also changed with Speaker Switching ownership.

Meter aggregate:

- Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- Custom Mix: **12/12 closed**;
- total floor + movement: **42/46**;
- human Outputs 21–24: `CONFIGURATION_UNAVAILABLE` in the current setup.

Do not change Sample Rate or Digital I/O merely to expose Outputs 21–24.

## Newest public-write hardware evidence

The later V4 exact public-surface smoke on 0.1.20 produced:

- SAFE Core PASS 3 / FAIL 0 / SKIP 18;
- 52 release tests;
- **42 PASS / 10 FAIL**;
- hard abort false;
- reconnect PASS;
- global exact restore PASS.

All ten FAIL results were the dedicated `output_pair_source` action, classified `NO_TRANSITION`. Direct Output Source/Gain/Nickname paths closed where runnable.

V4 used reciprocal parser/schema source-pair metadata and required **both Output members** to reach the requested source pair.

Re-reading old V8 evidence showed that its pair topology oracle could pass with the requested left member changed while the right member remained original. V8 therefore remains useful topology/ownership evidence but is not sufficient `HARDWARE_WRITE_CONFIRMED` proof for the modern two-member `output_pair_source` public action.

The 0.1.21 v1 policy consequently withholds `output_pair_source` while retaining truthful Output Source/Stereo readback.

## 31-definition matrix

|   # | Feedback definition   | Strongest current class                                        | Evidence / v1 release policy                                                                                       |
| --: | --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
|   1 | `connected`           | **READ_ONLY_STATUS**                                           | Server connection lifecycle. No forced disconnect needed.                                                          |
|   2 | `authorised`          | **READ_ONLY_STATUS**                                           | Remote Devices approval matched to this module's own client ID.                                                    |
|   3 | `monitor_mute`        | **HARDWARE_DYNAMIC_CLOSED**                                    | Guarded write + both-edge server-confirmed feedback retained.                                                      |
|   4 | `monitor_dim`         | **HARDWARE_DYNAMIC_CLOSED**                                    | Guarded write + both-edge server-confirmed feedback retained.                                                      |
|   5 | `monitor_talkback`    | **HARDWARE_DYNAMIC_CLOSED**                                    | Retained stronger prior closure.                                                                                   |
|   6 | `monitor_alt`         | **HARDWARE_DYNAMIC_CLOSED / v1 write WITHHELD**                | UI-driven readback closed; direct Companion write remains withheld.                                                |
|   7 | `monitor_alt_enable`  | **HARDWARE_DYNAMIC_CLOSED / v1 write WITHHELD**                | UI-driven readback closed; Output 3 availability followed Speaker Switching.                                       |
|   8 | `monitor_preset`      | **HARDWARE_DYNAMIC_CLOSED**                                    | Prior closure plus latest V4 write-confirmed exact restore; public write kept.                                     |
|   9 | `input_air`           | **HARDWARE_DYNAMIC_CLOSED — 8/8**                              | Retained guarded/write and feedback evidence; public write kept.                                                   |
|  10 | `input_pad`           | **HARDWARE_DYNAMIC_CLOSED — 8/8**                              | Retained guarded/write and feedback evidence; public write kept.                                                   |
|  11 | `input_available`     | **READ_ONLY_STATUS**                                           | Runtime server availability only.                                                                                  |
|  12 | `input_mode`          | **HARDWARE_DYNAMIC_CLOSED**                                    | Inputs 1–2 Line/Instrument closed; public write kept.                                                              |
|  13 | `input_meter`         | **HARDWARE_DYNAMIC_CLOSED — 8/8**                              | Floor + real movement, zero mismatch.                                                                              |
|  14 | `output_mute`         | **PARTIAL / v1 filtered write**                                | Representative readback + prior direct-write evidence; only validated direct members exposed.                     |
|  15 | `output_stereo`       | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                 | Real UI-driven Stereo/Mono topology changes observed; generic Companion write withheld.                            |
|  16 | `output_source`       | **PARTIAL / retained direct write evidence**                   | Direct source routing is hardware-confirmed on validated targets; dedicated `output_pair_source` is withheld.      |
|  17 | `output_available`    | **READ_ONLY_STATUS**                                           | Dynamic runtime availability; Outputs 21–24 false; Speaker Switching also changed Output 3 availability.          |
|  18 | `output_meter`        | **22 HARDWARE_DYNAMIC_CLOSED / 4 CONFIGURATION_UNAVAILABLE**   | All currently available Output meters closed.                                                                     |
|  19 | `mixer_slot_stereo`   | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                 | Strong UI Stereo/Mono readback retained; public write removed.                                                     |
|  20 | `mixer_slot_source`   | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                 | Strong multi-pair UI source readback retained; public write removed.                                               |
|  21 | `mix_mute`            | **PARTIAL / v1 write WITHHELD**                                | Broad UI/readback + selected exact-restored evidence, but no uniform generic proof.                                |
|  22 | `mix_solo`            | **PARTIAL / v1 write WITHHELD**                                | Same evidence pattern as `mix_mute`.                                                                               |
|  23 | `mix_talkback`        | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                 | Readback observed; public generic write remains removed.                                                           |
|  24 | `mix_meter`           | **HARDWARE_DYNAMIC_CLOSED — 12/12**                            | Every Custom Mix meter lane closed with floor + movement.                                                         |
|  25 | `device_preset`       | **READBACK / v1 write WITHHELD**                               | Preset recall is disruptive.                                                                                       |
|  26 | `clock_source`        | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**              | Readback retained; do not change merely for coverage.                                                              |
|  27 | `sample_rate`         | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**              | Readback retained; audio/channel topology changes.                                                                 |
|  28 | `spdif_mode`          | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**              | Readback retained; digital topology/restart risk.                                                                  |
|  29 | `clock_locked`        | **READ_ONLY_STATUS**                                           | Passive status only.                                                                                               |
|  30 | `talkback_source`     | **HARDWARE_DYNAMIC_CLOSED**                                    | Prior hardware closure retained; public write kept, though latest V4 baseline did not rerun it.                    |
|  31 | `phantom_persistence` | **HARDWARE_DYNAMIC_CLOSED**                                    | Persistence setting only; latest V4 exact write/restore passed. Never per-channel phantom.                         |

## `assign-mix` — research note outside the 31 public feedback definitions

`assign-mix` is not a public feedback/action.

Current evidence remains:

- **26/26 SCHEMA_PRESENT**;
- **0/26 materialised values**;
- raw semantics: **UNKNOWN**;
- write transaction: **UNKNOWN**;
- public action/preset/feedback: **absent**;
- raw write: **absent**.

Do not rerun `NAVIGATE_MIXES`. Do not write `assign-mix`. It is not a v1 blocker.

## Direct Output / digital truth retained

Direct Output gain exists only for **Outputs 1–10** in the current schema. Outputs 11–26 do not expose a direct per-output gain item. Do not invent S/PDIF/ADAT/digital output volume.

Outputs 21–24 remain `available=false` in the current configuration. Availability is dynamic and must never be hardcoded. Production policy keeps human Outputs 21–24 write-blocked even if a future configuration reports them available until that available configuration receives explicit real-hardware validation.

## Final v1 action policy

Authoritative write-surface decision: `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`.

Public writes kept include:

- Monitor Mute/Dim/Talkback/preset;
- Air/Pad/Input Mode/Input nickname;
- policy-filtered direct Output Mute/Gain/Source/Nickname;
- Device nickname;
- Phantom Persistence;
- Talkback Source;
- reconnect.

Public writes withheld include:

- ALT/ALT Enable;
- Output Stereo;
- **`output_pair_source`**;
- generic Custom Mix writes;
- Mixer Slot Source/Stereo;
- per-lane Mix Talkback;
- Device Preset;
- Clock Source;
- Sample Rate;
- Digital I/O/S/PDIF Mode;
- Advanced Raw.

Strong Stereo/Mono UI/readback evidence is retained and must not be erased merely because the corresponding generic writes are withheld.

The corrective packaged build is **0.1.21** and is **SOFTWARE-GATE-PENDING** until the complete user-host `UPDATE_AND_RUN.bat` pipeline passes.

## Result-file retention / privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics and arbitrary generated reports must not be published directly to the development repository.

Never publish screenshots, raw private captures, XML, serials, hostnames, client keys, endpoints, private IDs, or user-specific paths.

## Permanent boundaries

- Scarlett 18i20 (3rd Gen) only;
- dynamic Focusrite Control Server port/device ID;
- writes require matching Remote Devices authorization;
- server-confirmed feedback/state only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom;
- no Mic Kill;
- Monitor gain item `1677` remains read-only;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot writes;
- no meter/status writes;
- no write to explicit UNKNOWN or `available=false`;
- preserve privacy and required attribution.
