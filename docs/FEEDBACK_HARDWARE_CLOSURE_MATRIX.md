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
- **CONFIGURATION_UNAVAILABLE** — current server state says unavailable; never reinterpret as permanently unsupported.
- **UNSUPPORTED/BLOCKED** — deliberately excluded from write-driven validation.
- **PARTIAL** — instances have different evidence levels.

`UNKNOWN`, blank, missing cache, `BASELINE_UNKNOWN`, `neverObserved`, or a single-state observation never proves absence.

User instructions must use **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, **Mute**, **MAIN**, and **ALT**, not internal TestBench Mix A–F names.

## Final read-only hardware evidence

The broad recorder performed no Focusrite writes and pressed no Companion buttons. Across the retained sessions it established server-confirmed UI/readback evidence for:

- Custom Mix faders;
- pan;
- Mute;
- Solo;
- source/stereo topology, including visible Stereo/Mono changes;
- Talkback state;
- all **12/12 Custom Mix meters**;
- all currently available Output meter paths.

The final cumulative Custom Mix evaluation is **COMPLETE**:

- `mix_mute`: representative closed, mismatch 0;
- `mix_solo`: representative closed, mismatch 0;
- `mix_talkback`: representative closed, mismatch 0;
- fader: 7 changed paths;
- pan: 4 changed paths;
- Stereo/Mono: 2 changed paths;
- routing to Custom Mix: 7 Output pairs observed;
- Custom Mix meters: **12/12 closed, mismatch 0**.

This is valid `SESSION_STATE_OBSERVED` / representative `HARDWARE_DYNAMIC_CLOSED` readback evidence. It does not automatically prove a generic Companion write transaction for every internal lane/side/slot.

Meter aggregate retained from the dedicated meter work:

- Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- Custom Mix: **12/12 closed**;
- human Outputs 21–24: `CONFIGURATION_UNAVAILABLE` in the current setup.

Do not change Sample Rate or Digital I/O merely to expose Outputs 21–24.

## Final public-write hardware evidence

The final V5 retained-public-write smoke on 0.1.21 is clean:

- **42/42 PASS**;
- hard abort false;
- exact restoration/global safety clean;
- reconnect PASS;
- `output_pair_source` absent by deliberate v1 policy.

The earlier V4 result remains the decisive strict-pair evidence for withholding `output_pair_source`: ten runnable pair-routing tests returned `NO_TRANSITION` while exact restoration remained clean. V4 used reciprocal parser/schema pair metadata and required both Output members to reach the requested reciprocal source pair.

Older V8 topology evidence remains useful but is not sufficient `HARDWARE_WRITE_CONFIRMED` proof for that stronger two-member contract.

## 31-definition matrix

|   # | Feedback definition   | Strongest current class                                          | Evidence / v1 release policy                                                                  |
| --: | --------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
|   1 | `connected`           | **READ_ONLY_STATUS**                                             | Server connection lifecycle.                                                                  |
|   2 | `authorised`          | **READ_ONLY_STATUS**                                             | Remote Devices approval matched to this module's own client ID.                               |
|   3 | `monitor_mute`        | **HARDWARE_DYNAMIC_CLOSED**                                      | Guarded write + both-edge server-confirmed feedback retained.                                 |
|   4 | `monitor_dim`         | **HARDWARE_DYNAMIC_CLOSED**                                      | Guarded write + both-edge server-confirmed feedback retained.                                 |
|   5 | `monitor_talkback`    | **HARDWARE_DYNAMIC_CLOSED**                                      | Retained stronger prior closure.                                                              |
|   6 | `monitor_alt`         | **HARDWARE_DYNAMIC_CLOSED / v1 write WITHHELD**                  | UI-driven readback closed; direct Companion write withheld.                                   |
|   7 | `monitor_alt_enable`  | **HARDWARE_DYNAMIC_CLOSED / v1 write WITHHELD**                  | UI-driven readback closed; availability coupling observed.                                    |
|   8 | `monitor_preset`      | **HARDWARE_DYNAMIC_CLOSED**                                      | Exact-restored write evidence; public write kept.                                             |
|   9 | `input_air`           | **HARDWARE_DYNAMIC_CLOSED — 8/8**                                | Guarded/write + feedback evidence retained.                                                   |
|  10 | `input_pad`           | **HARDWARE_DYNAMIC_CLOSED — 8/8**                                | Guarded/write + feedback evidence retained.                                                   |
|  11 | `input_available`     | **READ_ONLY_STATUS**                                             | Runtime server availability only.                                                             |
|  12 | `input_mode`          | **HARDWARE_DYNAMIC_CLOSED**                                      | Inputs 1–2 Line/Instrument closed.                                                            |
|  13 | `input_meter`         | **HARDWARE_DYNAMIC_CLOSED — 8/8**                                | Floor + movement, zero mismatch.                                                              |
|  14 | `output_mute`         | **PARTIAL / v1 filtered write**                                  | Representative readback + prior direct-write evidence; only validated direct members exposed. |
|  15 | `output_stereo`       | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                   | Real UI-driven Stereo/Mono changes observed; generic Companion write withheld.                |
|  16 | `output_source`       | **PARTIAL / retained direct write evidence**                     | Direct routing confirmed on validated targets; pair action withheld.                          |
|  17 | `output_available`    | **READ_ONLY_STATUS**                                             | Dynamic runtime availability; Outputs 21–24 false in current config.                          |
|  18 | `output_meter`        | **22 HARDWARE_DYNAMIC_CLOSED / 4 CONFIGURATION_UNAVAILABLE**     | All currently available Output meters closed.                                                 |
|  19 | `mixer_slot_stereo`   | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                   | Stereo/Mono readback retained; public write removed.                                          |
|  20 | `mixer_slot_source`   | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                   | Multi-pair source readback retained; public write removed.                                    |
|  21 | `mix_mute`            | **HARDWARE_DYNAMIC_CLOSED (representative) / v1 write WITHHELD** | Representative ON/OFF readback closed with mismatch 0; no generic write claim.                |
|  22 | `mix_solo`            | **HARDWARE_DYNAMIC_CLOSED (representative) / v1 write WITHHELD** | Representative ON/OFF readback closed with mismatch 0; no generic write claim.                |
|  23 | `mix_talkback`        | **HARDWARE_DYNAMIC_CLOSED (representative) / v1 write WITHHELD** | Representative ON/OFF readback closed with mismatch 0; public write removed.                  |
|  24 | `mix_meter`           | **HARDWARE_DYNAMIC_CLOSED — 12/12**                              | Every Custom Mix meter closed with floor + movement.                                          |
|  25 | `device_preset`       | **READBACK / v1 write WITHHELD**                                 | Preset recall disruptive.                                                                     |
|  26 | `clock_source`        | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**                | Readback retained; do not change merely for coverage.                                         |
|  27 | `sample_rate`         | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**                | Readback retained; audio/topology changes.                                                    |
|  28 | `spdif_mode`          | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**                | Readback retained; digital topology/restart risk.                                             |
|  29 | `clock_locked`        | **READ_ONLY_STATUS**                                             | Passive status only.                                                                          |
|  30 | `talkback_source`     | **HARDWARE_DYNAMIC_CLOSED**                                      | Prior hardware closure retained; public write kept.                                           |
|  31 | `phantom_persistence` | **HARDWARE_DYNAMIC_CLOSED**                                      | Exact write/restore evidence. Never per-channel phantom.                                      |

## `assign-mix` — research note outside the 31 public feedback definitions

`assign-mix` is not a public feedback/action.

Current evidence:

- **26/26 SCHEMA_PRESENT**;
- **0/26 materialised values**;
- raw semantics: **UNKNOWN**;
- write transaction: **UNKNOWN**;
- public action/preset/feedback: absent;
- raw write: absent.

Do not rerun `NAVIGATE_MIXES`. Do not write `assign-mix`. It is not a v1 blocker.

## Direct Output / digital truth retained

Direct Output gain exists only for **Outputs 1–10** in the current schema. Outputs 11–26 do not expose a direct per-output gain item. Do not invent S/PDIF/ADAT/digital output volume.

Outputs 21–24 remain `available=false` in the current configuration. Availability is dynamic and must never be hardcoded. Production policy keeps human Outputs 21–24 write-blocked even if a future configuration reports available until that available configuration receives explicit real-hardware validation.

## Final v1 action policy

Public writes kept include Monitor Mute/Dim/Talkback/preset; Air/Pad/Input Mode/Input nickname; policy-filtered direct Output Mute/Gain/Source/Nickname; Device nickname; Phantom Persistence; Talkback Source; reconnect.

Public writes withheld include ALT/ALT Enable; Output Stereo; **`output_pair_source`**; generic Custom Mix writes; Mixer Slot Source/Stereo; per-lane Mix Talkback; Device Preset; Clock Source; Sample Rate; Digital I/O/S/PDIF Mode; Advanced Raw.

Strong Stereo/Mono UI/readback evidence remains valid even though generic writes stay withheld.

## Software / artifact status

0.1.21 is **SOFTWARE-GREEN** on the user host: 306/306 Node tests PASS and package build PASS.

Hardware validation for the frozen v1 scope is complete. The remaining technical release gate is the exact audit of the exact `focusrite-scarlett-18i20-0.1.21.tgz` generated/used on the user host.

## Result-file retention / privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics and arbitrary generated reports must not be published directly.

Never publish screenshots, raw private captures/XML, serials, hostnames, client keys, endpoints, private IDs, or user-specific paths.

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
- no write to UNKNOWN or `available=false`;
- preserve privacy and required attribution.
