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

### ALT / Speaker Switching — now dynamically closed

`monitor_alt_enable` produced three clean server-confirmed transitions and both boolean states were observed.

`monitor_alt` produced four clean server-confirmed transitions and both boolean states were observed.

No mismatch or race occurred.

Enabling Speaker Switching also changed the server-confirmed availability of human **Output 3** in the same session. This is consistent with the ALT pair becoming monitor-owned rather than a normal independently routable output while Speaker Switching is active. Availability remains runtime state and must never be hardcoded.

Classification:

- `monitor_alt`: **HARDWARE_DYNAMIC_CLOSED** for feedback/readback;
- `monitor_alt_enable`: **HARDWARE_DYNAMIC_CLOSED** for feedback/readback.

This REC is UI-driven readback evidence, not by itself Companion-write proof. The public ALT actions still belong in the final action-surface write audit.

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

Do not claim exact restoration for this recorder.

## 31-definition matrix

| # | Feedback definition | Strongest current class | Evidence / remaining work |
|---:|---|---|---|
| 1 | `connected` | **READ_ONLY_STATUS** | Server connection lifecycle. No forced disconnect needed. |
| 2 | `authorised` | **READ_ONLY_STATUS** | Canonical Remote Devices approval matched the module client. |
| 3 | `monitor_mute` | **HARDWARE_DYNAMIC_CLOSED** | Prior guarded write plus later both-edge server-confirmed feedback. |
| 4 | `monitor_dim` | **HARDWARE_DYNAMIC_CLOSED** | Prior guarded write plus later both-edge server-confirmed feedback. |
| 5 | `monitor_talkback` | **HARDWARE_DYNAMIC_CLOSED** | Retained stronger prior closure. |
| 6 | `monitor_alt` | **HARDWARE_DYNAMIC_CLOSED** | New 06:29 REC: four PASS transitions, both states, zero mismatch. Companion action still needs final write-surface audit. |
| 7 | `monitor_alt_enable` | **HARDWARE_DYNAMIC_CLOSED** | New 06:29 REC: three PASS transitions, both states, zero mismatch. Output 3 availability followed the Speaker Switching ownership state. |
| 8 | `monitor_preset` | **HARDWARE_DYNAMIC_CLOSED** | Prior hardware closure retained. |
| 9 | `input_air` | **HARDWARE_DYNAMIC_CLOSED — 8/8** | Retained guarded/write and feedback evidence. |
| 10 | `input_pad` | **HARDWARE_DYNAMIC_CLOSED — 8/8** | Retained guarded/write and feedback evidence. |
| 11 | `input_available` | **READ_ONLY_STATUS** | Runtime server availability only. |
| 12 | `input_mode` | **HARDWARE_DYNAMIC_CLOSED** | Inputs 1-2 Line/Instrument closed. |
| 13 | `input_meter` | **HARDWARE_DYNAMIC_CLOSED — 8/8** | Floor + real movement, zero mismatch. |
| 14 | `output_mute` | **PARTIAL** | Strong representative readback plus control-specific direct-write history. Keep policy conservative. |
| 15 | `output_stereo` | **PARTIAL / SESSION_STATE_OBSERVED** | Real UI-driven topology changes across representative analogue/digital paths. Generic direct write not inferred. |
| 16 | `output_source` | **PARTIAL / SESSION_STATE_OBSERVED + retained write evidence** | Playback, Analogue, Custom Mix and digital source changes observed. Direct/pair write policy remains control-specific. |
| 17 | `output_available` | **READ_ONLY_STATUS** | Dynamic runtime availability. Outputs 21-24 currently false. ALT Enable also changed Output 3 availability. |
| 18 | `output_meter` | **22 HARDWARE_DYNAMIC_CLOSED / 4 CONFIGURATION_UNAVAILABLE** | All currently available output meters closed; Outputs 21-24 unavailable. |
| 19 | `mixer_slot_stereo` | **SESSION_STATE_OBSERVED / generic write RESEARCH_OPEN** | Strong multi-pair UI readback from previous broad REC. Public write remains research-gated. |
| 20 | `mixer_slot_source` | **SESSION_STATE_OBSERVED / generic write RESEARCH_OPEN** | Strong multi-pair UI readback. Public action remains withheld. |
| 21 | `mix_mute` | **PARTIAL** | Broad UI/readback plus selected exact-restored Companion write evidence. Arbitrary combination write audit remains. |
| 22 | `mix_solo` | **PARTIAL** | Same pattern as `mix_mute`. |
| 23 | `mix_talkback` | **SESSION_STATE_OBSERVED / public write WITHHELD** | Readback observed; public generic write remains removed. |
| 24 | `mix_meter` | **HARDWARE_DYNAMIC_CLOSED — 12/12** | New 06:29 REC closed every Custom Mix meter lane with floor + movement. |
| 25 | `device_preset` | **UNSUPPORTED/BLOCKED dynamically** | Preset recall is disruptive. Public action decision remains separate. |
| 26 | `clock_source` | **HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically** | Do not change merely for coverage. |
| 27 | `sample_rate` | **HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically** | Audio/channel topology changes; do not change merely for coverage. |
| 28 | `spdif_mode` | **HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically** | Digital topology change/restart; do not change merely for coverage. |
| 29 | `clock_locked` | **READ_ONLY_STATUS** | Passive status only. |
| 30 | `talkback_source` | **HARDWARE_DYNAMIC_CLOSED** | Prior hardware closure retained. |
| 31 | `phantom_persistence` | **HARDWARE_DYNAMIC_CLOSED** | Retain 48V setting only; never per-channel phantom. |

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

Outputs 21-24 remain `available=false` in the current configuration. Availability is dynamic and must never be hardcoded.

## Remaining release audit — actions, not feedback meters

The feedback matrix is now substantially closed for the current configuration. Remaining material work is the **public action write surface**:

1. Audit Companion writes for `monitor_alt` / `monitor_alt_enable` against the newly proven UI/readback behavior.
2. Audit public Custom Mix writes: `mix_mute`, `mix_solo`, `mix_gain_set`, `mix_gain_adjust`, `mix_pan`. Use representative exact-restorable proof or constrain/withhold unproven combinations.
3. Decide v1 policy for disruptive actions: `device_preset`, `clock_source`, `sample_rate`, `spdif_mode`. Safest default is withhold unless deliberately approved for testing.
4. Decide whether low-risk nickname actions need a temporary synthetic-name exact-restore test or remain merely implemented/schema-observed.
5. Audit every output action option still visible after `hardware-policy.js` filtering against retained direct-write evidence. Do not loosen policy from UI feedback alone.

No further broad REC is justified merely for meter coverage.

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
