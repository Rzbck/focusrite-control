# Hardware validation — ALT / Speaker Switching and remaining meters

Date: 2026-08-26  
Hardware: **Scarlett 18i20 (3rd Gen) only**  
Module: **0.1.19**  
Source: sanitized `LATEST_MANUAL_FEEDBACK_SWEEP` reportVersion 6

Exact supplied report:

- updated: `2026-08-26T06:29:16.831Z`;
- size: 606632 bytes;
- SHA-256: `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`.

The report itself remains local under the gitignored `testbench/results/` policy. This document preserves the material sanitized evidence without publishing arbitrary generated diagnostics.

## Recorder contract

- `readOnlyHarness=true`;
- `hardwareWritesByHarness=false`;
- `companionButtonPressesByHarness=false`;
- 829 feedback probes;
- 31 public feedback definitions;
- 783 non-meter probes;
- 46 meter probes;
- duration 165060 ms;
- 477 scan cycles;
- 11 feedback transitions;
- 11 confirmed PASS;
- 0 transient race;
- 0 confirmed mismatch.

## ALT / Speaker Switching result

`monitor_alt_enable`:

- `false -> true` PASS;
- `true -> false` PASS;
- `false -> true` PASS;
- both boolean states observed;
- zero mismatch.

`monitor_alt`:

- `false -> true` PASS;
- `true -> false` PASS;
- `false -> true` PASS;
- `true -> false` PASS;
- both boolean states observed;
- zero mismatch.

Classification for feedback/readback: **HARDWARE_DYNAMIC_CLOSED** for both ALT selection and Speaker Switching enable.

This was UI-driven observation, not a Companion-write transaction test. Public ALT actions still require the final write-surface audit.

## Output availability coupling observed with Speaker Switching

Human Output 3 changed availability in the same session as Speaker Switching enable:

- available `true -> false` when ALT Enable became true;
- available `false -> true` when ALT Enable became false;
- available `true -> false` when ALT Enable became true again.

This is strong evidence that Speaker Switching changes ownership/availability of the ALT output pair. Availability must remain runtime/server-confirmed and must never be hardcoded.

## Meter result

Aggregate after this REC:

- total: **46**;
- floor + movement closed: **42**;
- floor-only: **4**;
- movement-only: **0**;
- never observed: **0**;
- persistent mismatch: **0**.

Breakdown:

- analogue input meters: **8/8 closed**;
- currently available output meters: **22/22 closed**;
- Custom Mix meters: **12/12 closed**;
- human Outputs 21-24: floor-only because they remain `available=false` in the current configuration.

Therefore there are **no remaining Custom Mix meter gaps**. Outputs 21-24 remain **CONFIGURATION_UNAVAILABLE**, not unsupported. Do not alter sample rate or Digital I/O mode merely to force meter movement.

## Custom Mix navigation / routing

Changing only which Output/Custom Mix is being viewed in Focusrite Control did not need to produce server state traffic. That view selection is UI state and is not a required hardware/protocol feature.

The REC did observe real routing state when several Outputs were actually changed from Playback/digital sources to **Custom Mix**. Therefore the useful protocol fact is present: routing to Custom Mix is server-observable. A separate "currently viewed Custom Mix" state is unnecessary.

No additional `assign-mix` conclusion follows from this. `assign-mix` remains schema-present but unmaterialised and is not a v1 blocker.

## End-of-session state

The recorder is read-only and does not restore user operations.

At REC stop:

- Speaker Switching / ALT Enable was `true`;
- ALT select was `false` (MAIN selected);
- human Output 3 availability was `false` while Speaker Switching remained enabled;
- several Outputs were left routed to Custom Mix;
- a previously active Custom Mix Talkback state was observed returning to `false`;
- opaque Output 1/2 gain classes changed, but numeric values are deliberately not stored.

Do not describe this REC as exact-restored.

## User-facing terminology

Do not instruct the user with internal TestBench `Mix A-F` labels. Use the Focusrite Control terms the user sees: **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, **Mute**, **MAIN**, and **ALT**.

## Remaining material validation work

The remaining work is no longer meter coverage or ALT readback. It is the final **public action write-surface audit**:

1. verify/decide Companion ALT / ALT Enable write behavior;
2. audit public Custom Mix writes (`Mute`, `Solo`, fader, pan) with representative exact restoration or constrain/withhold unproven combinations;
3. withhold or deliberately approve testing of disruptive settings (Device Preset, Clock Source, Sample Rate, Digital I/O mode);
4. decide whether nickname writes require a low-risk synthetic exact-restore test;
5. audit all output action choices still allowed by `hardware-policy.js` against retained direct-write evidence.

Do not rerun a broad REC merely for coverage.
