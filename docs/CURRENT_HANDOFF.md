# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback/protocol closure before release**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live repository and newest material branch movement. Resolve the current remote HEAD of the objective branch, inspect newer commits/diff, then read root `HANDOFF`, this file, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → current code/tests → current handoff → matrix/docs → older captures/assumptions.

Never collapse `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED` into one category.

## Latest fully green software checkpoint

Exact user-host HEAD `e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7` passed the complete local gate on 2026-08-26:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **279/279 Node tests PASS**;
- Companion package PASS;
- `focusrite-scarlett-18i20-0.1.19.tgz`.

No hardware write from that software gate.

## Newest hardware result — ALT / Speaker Switching and meter closure

Sanitized `LATEST_MANUAL_FEEDBACK_SWEEP` reportVersion 6 updated `2026-08-26T06:29:16.831Z`, module `0.1.19`.

Exact supplied report:

- size: 606632 bytes;
- SHA-256: `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`.

Recorder contract/result:

- `readOnlyHarness=true`;
- `hardwareWritesByHarness=false`;
- `companionButtonPressesByHarness=false`;
- 829 feedback probes;
- 31 public feedback definitions;
- 783 non-meter probes;
- 46 meters;
- duration 165060 ms;
- 477 scan cycles;
- 11 feedback transitions;
- **11 confirmed PASS**;
- **0 transient race**;
- **0 confirmed mismatch**.

Tracked exact evidence summary: `docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md`.

## ALT / Speaker Switching — feedback/readback closed

The new REC observed:

- `monitor_alt_enable`: three clean PASS transitions and both boolean states;
- `monitor_alt`: four clean PASS transitions and both boolean states;
- zero race;
- zero mismatch.

Classification for feedback/readback:

- `monitor_alt`: **HARDWARE_DYNAMIC_CLOSED**;
- `monitor_alt_enable`: **HARDWARE_DYNAMIC_CLOSED**.

Human Output 3 availability changed with Speaker Switching enable in the same session:

- `true -> false` when ALT Enable became true;
- `false -> true` when ALT Enable became false;
- `true -> false` when ALT Enable became true again.

Interpret this as server-confirmed runtime ownership/availability behavior. Never hardcode it. This read-only REC proves the official UI path is reflected correctly; it does not by itself prove the Companion write transaction, so ALT actions remain part of the final action-surface audit.

## Meters — all currently available paths closed

Newest aggregate:

- total meters: **46**;
- floor + movement closed: **42**;
- floor-only: **4**;
- movement-only: **0**;
- never observed: **0**;
- persistent mismatch: **0**.

Breakdown:

- analogue Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- **Custom Mix meters: 12/12 closed**;
- human Outputs 21-24 remain floor-only because server-confirmed `available=false` in the current configuration.

There are therefore **no remaining Custom Mix meter gaps**. Outputs 21-24 remain **CONFIGURATION_UNAVAILABLE**, not unsupported. Do not change sample rate or Digital I/O mode merely to make them available for meter coverage.

## Custom Mix view navigation — no missing protocol feature

The user observed that simply clicking from one Output/Custom Mix view to another in Focusrite Control did not produce a new server transition.

This is not a blocker. The active page/view is application UI state and does not need to be device state.

The same REC did observe real routing changes when several Outputs were actually changed from Playback/digital sources to **Custom Mix**. Therefore the useful state is available: actual routing to Custom Mix is server-observable.

Do not invent or chase a "currently viewed Custom Mix" item.

## User-facing terminology

Do not instruct the user with internal TestBench `Mix A-F` labels. Use the Focusrite Control terms visible to the user:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Internal labels may remain in protocol/TestBench evidence only when necessary to identify stored paths.

## `assign-mix` — not remaining v1 work

`assign-mix` remains:

- **26/26 SCHEMA_PRESENT**;
- **0/26 materialised values**;
- unobserved through active Playback / Analogue / Custom Mix / digital routing changes;
- raw semantics `UNKNOWN`;
- official write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no Advanced Raw write.

Do not rerun `NAVIGATE_MIXES`. Do not write `assign-mix`. The normal Output source/Custom Mix routing path is the useful user-facing behavior and is server-observable.

## Previous broad REC retained

The preceding sanitized reportVersion 6 at `2026-08-26T05:59:47.636Z` remains valid stronger evidence for the controls exercised there:

- 193 transitions;
- 193 PASS;
- 0 race;
- 0 mismatch;
- strong official-UI `SESSION_STATE_OBSERVED` evidence for mixer-slot Stereo/Source topology across multiple pairs;
- broad Custom Mix Mute/Solo/fader/pan readback;
- representative analogue/digital Output Mute/Stereo/Source readback;
- direct output gain present only on Outputs 1-10;
- no digital-output direct gain on Outputs 11-26.

Do not retest those merely for coverage.

## Public action-surface audit — remaining material work

Feedback/meter closure is no longer the main blocker. The remaining release work is to audit **writes actually exposed to Companion users**.

Current production policy already withholds important unresolved paths:

- `mixer_slot_source` removed from normal public actions;
- `mixer_slot_stereo` absent from normal connections and diagnostic-gated for research;
- `mix_talkback` removed from normal public actions;
- Monitor pair gain writes withheld;
- Monitor gain item `1677` read-only;
- output writes filtered by exact model, server-confirmed availability and control-specific hardware policy;
- Advanced Raw restricted by hardware policy.

Remaining decisions/tests:

1. **ALT / ALT Enable Companion writes** — audit the actions against the newly proven UI/readback behavior. If needed, one targeted exact-restorable Companion write test is sufficient; do not rerun the broad REC.
2. **Custom Mix public writes** — audit `mix_mute`, `mix_solo`, `mix_gain_set`, `mix_gain_adjust`, and `mix_pan`. Use representative exact-restorable proof or constrain/withhold unproven combinations.
3. **Disruptive settings** — `device_preset`, `clock_source`, `sample_rate`, `spdif_mode` are still defined as actions. Safest v1 default is **withhold** unless a deliberate approved hardware campaign is requested. Do not change them merely for coverage.
4. **Nickname actions** — input/output/device nickname writes are low-risk but not equivalently hardware-tested. Either run a temporary synthetic nickname exact-restore test or label them implemented/schema-observed only.
5. **Allowed Output writes** — audit every option still visible after `hardware-policy.js` filtering against retained direct-write evidence. UI readback is not direct-write proof.

## End-of-session state drift

The newest read-only REC does not restore user operations. At stop:

- Speaker Switching / ALT Enable remained `true`;
- ALT select ended `false` (MAIN selected);
- human Output 3 availability ended `false` while Speaker Switching remained active;
- several Outputs were left routed to Custom Mix;
- a previously active Custom Mix Talkback state returned to `false`;
- opaque Output 1/2 gain classes changed, but numeric raw values are intentionally not stored.

Do not claim exact restoration.

## Result retention / privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics, screenshots and arbitrary generated reports are not automatically uploaded.

Material sanitized evidence is preserved in tracked documentation with timestamp + SHA-256. This protects traceability without violating the repository's diagnostic-publication/privacy contract.

Never publish serial, private hostname, client key, endpoints, private IDs, raw XML/private captures, diagnostics containing private values, or user-specific paths.

## Remote Devices authorization — mandatory before writes

Before any write-capable hardware campaign, Focusrite Control → Device Settings → Remote Devices must show the existing **Companion Scarlett 18i20** client approved. Reuse the existing Companion Focusrite connection.

Missing approval = **AUTHORIZATION/PREFLIGHT BLOCKED**, not hardware failure. Approval must match this module's own server-assigned client ID. No extra direct clients by default.

## Permanent boundaries

- Scarlett 18i20 (3rd Gen) only;
- Monitor gain `1677` remains read-only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom;
- no Mic Kill;
- dynamic Control Server TCP port and device ID;
- server-confirmed state only;
- no optimistic feedback;
- no write to UNKNOWN or `available=false`;
- no arbitrary raw writes;
- no firmware/reset/restore/snapshot;
- no meter/status writes;
- no Focusrite software/firmware update without explicit agreement;
- no sample-rate/clock/Digital-I/O/unrelated-routing change merely for coverage;
- exact baseline/restoration required for reversible hardware tests;
- preserve privacy and attribution.

## Immediate next action

Do **not** rerun the broad manual REC for ALT or meters. Those objectives are closed for the current configuration.

Proceed to the public action write-surface audit, starting with the exact actions currently exposed by `src/actions.js` + `src/definition-policy.js` + `src/hardware-policy.js`. For each unproven public write choose:

- targeted exact-restorable hardware proof; or
- constrain/withhold for v1.

No further work should target `assign-mix`, currently unavailable Outputs 21-24, Monitor gain `1677`, firmware/reset/restore/snapshot, or forbidden non-features.

After every material software/hardware/user result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
