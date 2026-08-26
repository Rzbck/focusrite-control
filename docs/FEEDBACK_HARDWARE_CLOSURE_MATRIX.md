# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-26

This is the parent hardware-validation checklist for the **31 public Companion feedback definitions**.

Supported hardware remains **Scarlett 18i20 (3rd Gen) only**.

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

Internal TestBench `Mix A-F` labels are not user-facing Focusrite Control names. User instructions must use **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, and **Mute**.

## Newest physical-user result — manual REC reportVersion 6 at 06:29 UTC

Sanitized manual feedback sweep updated `2026-08-26T06:29:16.831Z`, module `0.1.19`.

Exact uploaded report SHA-256:

`308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`

Recorder contract:

- read-only harness: `true`;
- hardware writes by harness: `false`;
- Companion button presses by harness: `false`;
- feedback probes: **829**;
- public feedback definitions: **31**;
- non-meter probes: **783**;
- meter probes: **46**;
- duration: **165060 ms**;
- scan cycles: **477**;
- feedback transitions: **11**;
- confirmed PASS transitions: **11**;
- transient races: **0**;
- confirmed mismatches: **0**.

This run targeted the remaining ALT/Speaker Switching and passive meter gaps rather than repeating the previous broad control sweep.

### ALT / Speaker Switching — dynamically closed for feedback/readback

`monitor_alt_enable` produced three clean server-confirmed transitions and both boolean states were observed.

`monitor_alt` produced four clean server-confirmed transitions and both boolean states were observed.

No mismatch or race occurred.

Enabling Speaker Switching also changed the server-confirmed availability of human **Output 3** in the same session. This is consistent with the ALT pair becoming monitor-owned rather than a normal independently routable output while Speaker Switching is active. Availability remains runtime state and must never be hardcoded.

Classification:

- `monitor_alt`: **HARDWARE_DYNAMIC_CLOSED** for feedback/readback;
- `monitor_alt_enable`: **HARDWARE_DYNAMIC_CLOSED** for feedback/readback.

This REC is UI-driven readback evidence, not Companion-write proof. The final `0.1.20` public action audit therefore keeps both feedbacks but **withholds both Companion write actions for v1**.

### Meter campaign — all currently available paths closed

Newest aggregate:

- total meters: **46**;
- floor + movement closed: **42**;
- floor-only: **4**;
- movement-only: **0**;
- never observed: **0**;
- persistent mismatch: **0**.

Breakdown:

- Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- Custom Mix meter lanes: **12/12 closed**;
- human Outputs **21-24** remain floor-only because they are currently `available=false` / **CONFIGURATION_UNAVAILABLE**.

There are therefore **no remaining Custom Mix meter gaps**. Do not change sample rate or Digital I/O mode merely to force currently unavailable Outputs 21-24 into movement.

### Custom Mix navigation / routing interpretation

Simply selecting another Output or viewing another Custom Mix does not need to produce device-state traffic. The active Focusrite Control view is application UI state, not necessarily hardware state.

During this REC, the server did observe real routing changes when several Outputs were actually changed from Playback/digital sources to **Custom Mix**. This confirms the useful part: routing to Custom Mix is represented in server state even though changing only the visible UI page is not.

No new requirement exists to discover or expose a separate "currently viewed Custom Mix" state.

### Current session drift

The read-only recorder does not restore user UI operations. At the end of this REC:

- Speaker Switching / ALT Enable was still `true`;
- ALT selection itself ended `false` (MAIN selected);
- human Output 3 availability ended `false` while Speaker Switching remained enabled;
- several Outputs had been changed from Playback/digital sources to Custom Mix;
- the prior Custom Mix Talkback state that had been left `true` in the earlier REC was observed returning to `false`;
- opaque Output 1/2 gain classes changed during the session, but raw numeric values are intentionally not stored.

Do not claim exact restoration for this recorder. A passive/read-only REC does not require restoring the user's UI state merely because the session ended differently.

## 31-definition matrix

|   # | Feedback definition   | Strongest current class                                        | Evidence / v1 release policy                                                                                       |
| --: | --------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
|   1 | `connected`           | **READ_ONLY_STATUS**                                           | Server connection lifecycle. No forced disconnect needed.                                                          |
|   2 | `authorised`          | **READ_ONLY_STATUS**                                           | Canonical Remote Devices approval matched the module client.                                                       |
|   3 | `monitor_mute`        | **HARDWARE_DYNAMIC_CLOSED**                                    | Prior guarded write plus later both-edge server-confirmed feedback.                                                |
|   4 | `monitor_dim`         | **HARDWARE_DYNAMIC_CLOSED**                                    | Prior guarded write plus later both-edge server-confirmed feedback.                                                |
|   5 | `monitor_talkback`    | **HARDWARE_DYNAMIC_CLOSED**                                    | Retained stronger prior closure.                                                                                   |
|   6 | `monitor_alt`         | **HARDWARE_DYNAMIC_CLOSED / v1 write WITHHELD**                | 06:29 REC closed readback; final public action audit withholds the Companion write for v1.                         |
|   7 | `monitor_alt_enable`  | **HARDWARE_DYNAMIC_CLOSED / v1 write WITHHELD**                | 06:29 REC closed readback; Output 3 availability followed Speaker Switching. Public write withheld for v1.         |
|   8 | `monitor_preset`      | **HARDWARE_DYNAMIC_CLOSED**                                    | Prior hardware closure retained; public write kept.                                                                |
|   9 | `input_air`           | **HARDWARE_DYNAMIC_CLOSED — 8/8**                              | Retained guarded/write and feedback evidence; public write kept.                                                   |
|  10 | `input_pad`           | **HARDWARE_DYNAMIC_CLOSED — 8/8**                              | Retained guarded/write and feedback evidence; public write kept.                                                   |
|  11 | `input_available`     | **READ_ONLY_STATUS**                                           | Runtime server availability only.                                                                                  |
|  12 | `input_mode`          | **HARDWARE_DYNAMIC_CLOSED**                                    | Inputs 1-2 Line/Instrument closed; public write kept.                                                              |
|  13 | `input_meter`         | **HARDWARE_DYNAMIC_CLOSED — 8/8**                              | Floor + real movement, zero mismatch.                                                                              |
|  14 | `output_mute`         | **PARTIAL / v1 filtered write**                                | Representative readback plus direct-write history. v1 exposes only policy-approved direct members.                 |
|  15 | `output_stereo`       | **PARTIAL / SESSION_STATE_OBSERVED / v1 write WITHHELD**       | Real UI-driven topology changes observed; generic Companion direct Stereo write is withheld.                       |
|  16 | `output_source`       | **PARTIAL / SESSION_STATE_OBSERVED + retained write evidence** | Direct/pair routing remains control-specific; internal Custom Mix source IDs are removed from v1 write choices.    |
|  17 | `output_available`    | **READ_ONLY_STATUS**                                           | Dynamic runtime availability. Outputs 21-24 currently false. ALT Enable also changed Output 3 availability.        |
|  18 | `output_meter`        | **22 HARDWARE_DYNAMIC_CLOSED / 4 CONFIGURATION_UNAVAILABLE**   | All currently available output meters closed; Outputs 21-24 unavailable.                                           |
|  19 | `mixer_slot_stereo`   | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                 | Strong multi-pair UI readback retained; public write removed for v1.                                               |
|  20 | `mixer_slot_source`   | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                 | Strong multi-pair UI readback retained; public write removed for v1.                                               |
|  21 | `mix_mute`            | **PARTIAL / v1 write WITHHELD**                                | Broad UI/readback plus selected exact-restored write evidence, but no uniform generic proof; public write removed. |
|  22 | `mix_solo`            | **PARTIAL / v1 write WITHHELD**                                | Same evidence pattern as `mix_mute`; public generic write removed.                                                 |
|  23 | `mix_talkback`        | **SESSION_STATE_OBSERVED / v1 write WITHHELD**                 | Readback observed; public generic write remains removed.                                                           |
|  24 | `mix_meter`           | **HARDWARE_DYNAMIC_CLOSED — 12/12**                            | 06:29 REC closed every Custom Mix meter lane with floor + movement.                                                |
|  25 | `device_preset`       | **READBACK / v1 write WITHHELD**                               | Preset recall is disruptive; final v1 action audit withholds the write.                                            |
|  26 | `clock_source`        | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**              | Readback retained; do not change merely for coverage.                                                              |
|  27 | `sample_rate`         | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**              | Readback retained; audio/channel topology changes, so public write is withheld.                                    |
|  28 | `spdif_mode`          | **HARDWARE_STATIC_CONFIRMED / v1 write WITHHELD**              | Readback retained; digital topology/restart risk, so public write is withheld.                                     |
|  29 | `clock_locked`        | **READ_ONLY_STATUS**                                           | Passive status only.                                                                                               |
|  30 | `talkback_source`     | **HARDWARE_DYNAMIC_CLOSED**                                    | Prior hardware closure retained; public write kept.                                                                |
|  31 | `phantom_persistence` | **HARDWARE_DYNAMIC_CLOSED**                                    | Retain the persistence setting only; never per-channel phantom. Public write kept.                                 |

## `assign-mix` — research note outside the 31 public feedback definitions

`assign-mix` is not a public feedback/action.

Current evidence remains:

- **26/26 SCHEMA_PRESENT**;
- **0/26 materialised values**;
- remained unobserved through active Playback / Analogue / Custom Mix / digital routing changes;
- raw semantics: **UNKNOWN**;
- official write transaction: **UNKNOWN**;
- public action/preset/feedback: **absent**;
- Advanced Raw write: **absent**.

Do not rerun `NAVIGATE_MIXES`. Do not write `assign-mix`. It is not a v1 blocker.

## Direct output / digital truth retained

Direct output gain exists only for **Outputs 1-10** in the current schema. Outputs 11-26 do not expose a direct per-output gain item. Do not invent S/PDIF/ADAT/digital output volume.

Outputs 21-24 remain `available=false` in the current configuration. Availability is dynamic and must never be hardcoded. The `0.1.20` production policy additionally keeps human Outputs 21-24 write-blocked even if a future configuration reports them available, until that available configuration receives explicit real-hardware validation.

## Final v1 action policy — hardware audit closed

Authoritative write-surface decision: `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`.

The v1 policy is now frozen from retained hardware evidence rather than requiring another broad hardware campaign.

Public writes kept include the already defended Monitor Mute/Dim/Talkback/preset paths, Air/Pad/Input Mode, policy-filtered direct Output Mute/Gain/Source/pair Source/Nickname, device nickname, Phantom Persistence, Talkback Source, and reconnect.

Public writes withheld include ALT/ALT Enable, Output Stereo, generic Custom Mix writes, Mixer Slot Source/Stereo, per-lane Mix Talkback, Device Preset, Clock Source, Sample Rate, Digital I/O/S/PDIF Mode, and Advanced Raw.

Internal Custom Mix source IDs are also removed from public Output routing choices because the user-visible `Custom Mix` selection cannot be safely mapped to the private server's internal mix identities. Stale saved actions targeting those internal IDs fail closed.

No further broad REC or hardware-state restoration is required for the v1 release decision. The remaining checkpoint is the repository-wide **0.1.20 software/package/privacy gate**. Pending is never PASS.

## Result-file retention / privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics and arbitrary generated reports must not be published directly to the development repository.

For traceability, material sanitized results are recorded here and in `docs/HARDWARE_TEST_HISTORY.md`, `docs/CURRENT_HANDOFF.md`, and root `HANDOFF`, including timestamp and SHA-256 of the exact supplied report where available.

Do not publish screenshots, raw private captures, XML, serials, hostnames, client keys, endpoints, private IDs, or user-specific paths.

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
