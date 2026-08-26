# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Current development build: **0.1.20**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live repository and newest material branch movement. Resolve the current remote HEAD of the objective branch, inspect newer commits/diff, then read root `HANDOFF`, this file, `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

## Current objective

The broad hardware feedback/protocol investigation is **closed for the v1 scope by evidence or deliberate write withholding**. There is no remaining broad hardware campaign required before the next software gate.

Current objective is now:

**validate the restrictive 0.1.20 v1 public write surface end-to-end in software, then perform the normal package/privacy/forbidden-feature release audit.**

This objective change is justified because all remaining unproven/disruptive write families have been withheld rather than promoted from readback evidence.

## Latest fully green software checkpoint

Exact user-host HEAD `e8d7e72ec5e50e42903cf8057acbeb63aaca4ba7` passed the complete local gate on 2026-08-26 for **0.1.19**:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **279/279 Node tests PASS**;
- Companion package PASS;
- `focusrite-scarlett-18i20-0.1.19.tgz`.

No hardware write from that gate.

## Current 0.1.20 software state — GATE PENDING

The public action-surface audit changed production policy and bumped `package.json` to **0.1.20**.

Material code changes:

- `src/hardware-policy.js` tightens direct Output policy;
- `src/definition-policy.js` freezes the v1 public action/preset surface;
- `src/main.js` removes the public Advanced Raw configuration checkbox and keeps mixer diagnostics read-only;
- `test/production-output-availability-policy.test.js` adds v1 release-policy regressions;
- public HELP/Quickstart/docs are reconciled with the new surface.

Targeted isolated validation performed during the audit:

- policy JavaScript syntax subset: PASS;
- targeted production-policy tests: **6/6 PASS**;
- no physical hardware write.

This is **not** the repository-wide green gate. 0.1.20 remains **SOFTWARE-GATE-PENDING** until `UPDATE_AND_RUN.bat` passes the complete user-host pipeline.

Pending is never PASS.

## Newest physical hardware result

Latest sanitized read-only REC: `2026-08-26T06:29:16.831Z`, module 0.1.19.

Exact report fingerprint:

- size 606632 bytes;
- SHA-256 `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`.

Result:

- read-only harness;
- zero harness hardware writes;
- zero Companion button presses;
- 829 probes / 31 feedback definitions / 46 meters;
- duration 165060 ms;
- **11 transitions / 11 PASS / 0 race / 0 mismatch**.

Tracked summary: `docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md`.

## Hardware feedback/readback closure

### ALT / Speaker Switching

Server-confirmed physical UI observation:

- `monitor_alt_enable`: both states, 3 PASS transitions;
- `monitor_alt`: both states, 4 PASS transitions;
- human Output 3 availability changed with Speaker Switching ownership;
- 0 race / 0 mismatch.

Feedback/readback classification: **HARDWARE_DYNAMIC_CLOSED**.

The public **write actions are withheld in v1** because the REC did not execute the Companion write transaction and completed V8 direct-write evidence did not close those writes.

### Meters

Current configuration:

- Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- Custom Mix: **12/12 closed**;
- total: **42/46 floor + movement closed**;
- remaining human Outputs 21–24 are server-confirmed `available=false` and therefore **CONFIGURATION_UNAVAILABLE**, not unsupported.

No remaining meter test is required. Do not change sample rate or Digital I/O merely to expose Outputs 21–24.

### Custom Mix readback

The previous broad REC plus the latest REC establish strong server-confirmed UI/readback evidence for:

- faders;
- pan;
- Mute;
- Solo;
- source/stereo topology;
- Talkback state;
- 12/12 meters.

Simply changing which Output/Custom Mix page is viewed in Focusrite Control does not need to create device/server state. Do not chase a "currently viewed Custom Mix" protocol field.

## Passive REC state rule

A **read-only/passive recorder does not require the user to restore the Focusrite Control UI to its starting state merely because the final snapshot differs**. The purpose of that recorder is observation.

Do not ask for passive-REC restoration unless the specific research question explicitly depends on comparing a known start/end state.

Exact baseline/restoration remains mandatory for **write-capable reversible hardware tests** where safe rollback is part of the test contract.

## User-facing terminology

For instructions to the user, use the terms visible in Focusrite Control:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Do not ask the user to manipulate internal protocol/TestBench `Mix A-F` names.

## Final v1 public action-surface decision

Authoritative audit: `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`.

### Kept public writes

Monitor:

- `monitor_mute`;
- `monitor_dim`;
- `monitor_talkback`;
- `monitor_preset`.

Hardware Inputs:

- `input_air`;
- `input_pad`;
- `input_mode`;
- `input_mode_cycle`;
- `input_nickname`.

Outputs, filtered by model/evidence/server availability:

- `output_mute` on validated direct members only;
- `output_gain_set` / `output_gain_adjust` on validated analogue gain targets;
- `output_source` on validated direct targets and direct source families;
- `output_pair_source` on validated pairs/direct stereo source families;
- `output_nickname` on validated direct targets.

Device/settings:

- `device_nickname`;
- `phantom_persistence`;
- `talkback_source`;
- `reconnect`.

Nickname writes do **not** need another hardware test: completed V8 evidence already contains write-confirmed input/device nickname paths and control-specific Output nickname evidence.

### Withheld public writes for v1

Readback may remain available, but these write actions/presets are removed by release policy:

- `monitor_alt_enable`;
- `monitor_alt`;
- `output_stereo`;
- `mixer_slot_source`;
- `mixer_slot_stereo`;
- `mix_mute`;
- `mix_solo`;
- `mix_gain_set`;
- `mix_gain_adjust`;
- `mix_pan`;
- `mix_talkback`;
- `device_preset`;
- `clock_source`;
- `sample_rate`;
- `spdif_mode`;
- `advanced_raw_set`.

This is deliberate v1 scope control, not a claim that the readable capabilities do not exist.

## Custom Mix routing write decision

The Output source actions no longer offer the server's internal Custom Mix source IDs.

Reason:

- Focusrite Control presents simply **Custom Mix**;
- the private server exposes multiple internal mix IDs;
- output `assign-mix` remains 26/26 schema-present but 0/26 materialised;
- there is no reliable user-visible mapping that justifies guessing which internal source corresponds to the user's Custom Mix selection.

Direct Hardware Input / Software (DAW) Playback / digital source routing remains available where hardware-tested.

A stale saved action attempting an internal Custom Mix source is also blocked by the callback guard.

## Output policy tightened

- every right/pair-owned member is withheld for direct Mute writes;
- pair-owned right Source remains withheld from direct source writes while the dedicated validated pair route remains available;
- Monitor Outputs 1–2 direct Gain remains withheld;
- known no-effect direct Gain/Nickname paths remain withheld;
- Output Stereo write is withheld globally for v1;
- human Outputs **21–24** are write-blocked even if a future configuration later reports them `available=true`, until that available configuration receives explicit real-hardware validation;
- server-confirmed `available=false` / UNKNOWN remains a write block for every output that has an availability descriptor.

## Disruptive settings decision

No further physical test is required for v1. The write actions are withheld rather than exercised:

- Device Preset;
- Clock Source;
- Sample Rate;
- Digital I/O / S/PDIF Mode.

Their readback can remain. Do not change real routing/clocking/sample-rate/digital topology merely for coverage.

## Advanced Raw decision

The public connection configuration no longer exposes the Advanced Raw checkbox. `advanced_raw_set` is removed from the v1 action definitions/presets by policy.

Hardware policy also fails closed for withheld Custom Mix/settings/ALT/Stereo raw paths so a future accidental re-exposure cannot silently bypass the release decision.

Dedicated research/TestBench workflows remain separate.

## `assign-mix`

Final v1 classification:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised values through active routing sessions;
- raw semantics `UNKNOWN`;
- official write transaction `UNKNOWN`;
- public action/preset/feedback absent;
- raw write absent.

Do not rerun `NAVIGATE_MIXES`; do not write `assign-mix`; it is not a v1 blocker.

## Permanent boundaries

- Scarlett 18i20 (3rd Gen) only;
- Monitor gain item `1677` read-only;
- no physical analogue input preamp Gain;
- no direct per-input hardware Mute;
- no per-channel phantom switching;
- no Mic Kill;
- dynamic Focusrite Control Server TCP port and device ID;
- writes only after Remote Devices authorisation for this module's own server-assigned client ID;
- server-confirmed feedback/state only, never optimistic;
- no write to UNKNOWN / explicit `available=false`;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot;
- no meter/status writes;
- no Focusrite software/firmware update without explicit agreement;
- preserve privacy and required MIT/third-party attribution.

## Result retention / privacy

`testbench/results/` remains intentionally gitignored. Do not publish arbitrary generated reports/screenshots/raw captures.

Material sanitized results are tracked by summary + timestamp + SHA-256. Never publish real serials, private hostnames, client keys, endpoints, private IDs, raw private XML/captures, private diagnostics or user-specific paths.

## Publication state

Repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better repository scope and offered hardware for future testing.

Keep the supported hardware claim at Scarlett 18i20 (3rd Gen) only. Wait for the official repository/naming decision before changing public scope. Stable public target remains **v1.0.0** unless maintainers direct otherwise.

## Exact next action

Run the checked-in:

`UPDATE_AND_RUN.bat`

on `testbench/meter-routing-exact-restore`.

Require the complete **0.1.20** gate:

- dependency install;
- Prettier;
- ESLint;
- source manifest;
- all Node tests;
- Companion package build.

Expected package name after a clean gate:

`focusrite-scarlett-18i20-0.1.20.tgz`

Do **not** run another broad hardware REC after that gate merely for coverage. If the software gate is clean, move to the final package/privacy/forbidden-feature audit and official-repository readiness work.

After every material result or blocker, update BOTH root `HANDOFF` and this file. Pending is never PASS.
