# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 08:18 Europe/Paris

This is the living resume point. Read it before proposing code, tests, branch changes or publication work and update it after every material hardware result.

## Scope / publication

- **Hardware support actually validated today remains Scarlett 18i20 (3rd Gen) only.**
- Module/package development version remains **0.1.13**.
- Working branch: **`testbench/v0.2-hardware-validation`**.
- Official Bitfocus repository/name is still pending. Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and broader Focusrite coverage may be appropriate later.
- Architecture should be capability/profile-driven so additional Focusrite Control devices can be onboarded without rewriting the lab around the 18i20.
- A broad architecture or future `focusrite-control` name is **not** a claim that untested models already work. Hardware writes remain blocked for models without an explicit hardware-tested write profile.
- Monitor gain item **1677 remains read-only**.
- TestBench development changes tooling/tests/docs only; do not re-import the module `.tgz` for TestBench-only changes.

## Last complete Windows gate shown by user

Completed **2026-08-22 after the post-campaign V4 hardening commits**:

- branch updated through `dfd3687` before the gate;
- Node 22.23.2 / Yarn 4.17.0;
- dependencies immutable: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **68/68 PASS**;
- package: PASS — `focusrite-scarlett-18i20-0.1.13.tgz`;
- `UPDATE_AND_RUN`: SUCCESS.

This validates the post-campaign code statically/on Windows, including the new unvalidated-model write gate, pair/alias classifier and shareable-report privacy tests. It does **not** yet hardware-validate the revised campaign behavior.

## Canonical Companion surfaces

Page 1 remains the user's live r9 matrix:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified:

- 46 × 26 grid / 1196 controls;
- **42/42** SAFE Core setters;
- **829 logical feedback probes / 31 definitions**;
- each logical probe is one normal `T` feedback + one inverted `F` feedback;
- feedback-probe cells contain zero actions.

Never publish the user's live r9 `.companionconfig`.

Page 2 is generated locally and temporary:

`testbench/generated/FULL_EXTENDED.companionconfig`

It is snapshot-specific, Git-ignored and must never be published. Old A/B pages are obsolete local leftovers.

## Cold-start / SAFE evidence

Core cold-start acquisition remains **3/21 present**: Input 1 Mode, Input 2 Mode, Talkback.

Missing: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

Latest automated SAFE hardware result remains **3 PASS / 0 FAIL / 18 SKIP**. Earlier guarded work separately validated all 21 Core write paths. Never invent missing state or add write-to-warm behavior to production feedback/state.

## FULL hardware evidence confirmed so far

Real Scarlett 18i20 runs have confirmed:

- r9 audit: PASS — 42 Core setters + 829 logical probes + 31 feedback definitions;
- module 0.1.13: PASS;
- own client authorization: PASS;
- live shape: PASS — 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- generated Extended page audits: PASS.

### Earlier Air 5 stop

An earlier FULL stopped on `Could not establish FULL baseline for Air input 5.` This was diagnosed as a TestBench no-op-confirmation defect, not evidence that Air 5 mapping was wrong. V2 introduced alternate-value -> baseline confirmation.

### V3 stop

V3 / `full-v3-output-availability-20260821` found 22 available / 0 unavailable / 4 unknown outputs and stopped with:

`HARD ABORT: Output 12 could not return to protective Mute ON after no-op recovery.`

Do not treat Output 12 as proven defective. V3 incorrectly required independent per-output mute semantics.

## Latest real V4 Capability Lab run — 2026-08-21

Sanitized record:

`docs/HARDWARE_VALIDATION_2026-08-21_V4.md`

Campaign revision:

`full-v4-capability-lab-20260821`

### PREP

- r9 audit: PASS;
- module 0.1.13: PASS;
- hardware-tested model profile + own authorization: PASS;
- shape: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability: **22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN**;
- page-2 harness: **742 batches**;
- snapshot signature: `633db9a04dac677c`;
- exit code 6 PREP REQUIRED;
- **zero hardware writes** during PREP.

### Hardware campaign

The imported page matched the PREP signature and the V4 campaign completed without a global HARD ABORT.

Feedback sweep before:

- **113 PASS / 716 EVAL_ONLY / 0 FAIL / 829 total**.

Feedback sweep after:

- **124 PASS / 705 EVAL_ONLY / 0 FAIL / 829 total**.

Final capability summary:

- BLOCKED_BY_SAFETY: 1280
- BLOCKED_FORBIDDEN: 3
- EVAL_ONLY: 6
- FAIL_MISMATCH: 1
- FAIL_NO_EFFECT: 13
- MANUAL_PENDING: 4
- PASS: 39
- PASS_BASELINE: 1
- PASS_INDEPENDENT: 11
- QUARANTINED_RESTORE: 12
- SKIP_AVAILABILITY_UNKNOWN: 18
- SKIP_NO_CAPABILITY: 16
- UNSUPPORTED: 4

Exit code: **2**.

The user restored the saved pre-campaign Focusrite configuration after the run before normal use.

### Main hardware finding: output pair / leader-follower behavior

The run exposed a strong pair pattern rather than random output failures:

- independently observable mute cycles were confirmed on outputs **1, 3, 5, 7, 9, 11, 13, 15, 17, 19 and 25**;
- corresponding paired/right members often had blank/unusable direct state or no independent nickname/gain/mute effect;
- output 2 produced the single mute `FAIL_MISMATCH` plus pair/follower-style source/stereo behavior;
- V4 often quarantined paired/right members because it required the target variable itself to prove restoration before considering mate/alias behavior.

Interpretation: paired/right controls may be followers/aliases while linked. Do not call them bad hardware and do not assume every exposed output item is independently owned.

### Main architecture finding: global safety false-deadlock

The 4 outputs with `availability=UNKNOWN` were correctly excluded from writes, but V4 also removed them from its active safety pass while still requiring every potentially active output to be safe. Therefore global signal-path safety could not become true even when those UNKNOWN outputs already had server-confirmed Mute ON.

This accounts for most of the **1280 `BLOCKED_BY_SAFETY`** rows. They are not 1280 proven feature failures.

Revised behavior keeps the no-write rule for UNKNOWN availability but may accept an already **server-confirmed live Mute ON** as a passive safety guard. If not confirmed, dependent signal-path tests remain blocked.

## Privacy defect found in the V4 raw report

The raw V4 JSON claimed to be sanitized but contained live capability `state` values. A live device nickname could contain a serial-like identifier.

Therefore:

- the uploaded/raw `capability-lab_*.json` is private diagnostic material and must **not** be committed or published;
- do not add automatic raw-result upload to GitHub;
- post-campaign code now generates a separate `.shareable.json` and `LATEST_SHAREABLE.json` that omit live state/nickname contents and private metadata;
- only the sanitized shareable payload may be considered for a future explicit/opt-in publication mechanism after a privacy gate passes.

Never record the actual private nickname/serial-like value in GitHub docs/tests.

## Post-campaign TestBench hardening

Implemented on the branch and **Windows-gated 68/68 PASS on 2026-08-22**, but the revised hardware behavior is **not yet re-run on real hardware**:

1. model profiles distinguish `hardwareTested/writeEnabled` from an unvalidated read-only discovery profile;
2. hardware preflight gates writes through the profile registry instead of a second hardcoded exact-model condition;
3. adding another model later requires an explicit tested profile rather than weakening the write gate;
4. mute classification recognizes target-to-mate paired/alias behavior before declaring target restore failure;
5. unknown initial mute state can use the documented protective Mute ON baseline without pretending an unknown original value was restored;
6. `availability=UNKNOWN` still receives **no write**, but a fresh server-confirmed Mute ON may count as passive safety;
7. paired/alias follower nickname/source/gain/stereo semantics are not automatically scored as independent failures;
8. compact terminal phase/progress output is present for long-running phases;
9. raw JSON is explicitly marked private;
10. separate sanitized `.shareable.json` / `LATEST_SHAREABLE.json` output is generated;
11. tests cover unvalidated write blocking, pair alias classification and shareable-report privacy.

Because TestBench files changed but `src/` did not, do **not** re-import the module `.tgz` unless a later source/module change explicitly requires it.

## Multi-device Focusrite direction

The user is discussing the module scope with Bitfocus and wants the design to be suitable for broader Focusrite Control support.

Correct architecture rule:

- Focusrite Control transport/session engine: generic where protocol evidence supports it;
- capability discovery: generic;
- TestBench/report engine: generic/profile-driven;
- device shape, pair topology, safe write semantics and quirks: explicit per-model profile/evidence;
- unknown/unvalidated model: read-only discovery/research only, hardware writes blocked;
- public support list: only models with real hardware validation.

The current r9 page and SAFE plan are still 18i20-specific validation surfaces. Future model onboarding should generate/use a model-specific capability surface rather than pretending the 18i20 matrix fits every interface.

## V4 report contract going forward

Private local reports may include exact state needed for diagnosis and must stay local.

Shareable reports must omit:

- live state values;
- live nickname contents;
- serial/serial-like identifiers;
- hostname;
- dynamic server port;
- client key;
- live connection/client/device IDs;
- raw XML/page export;
- private paths/captures.

## Normal FULL exclusions / forbidden paths

Normal FULL still records as manual/excluded and does not execute:

- device preset;
- clock source;
- sample rate;
- S/PDIF mode.

Always forbidden/unsupported unless future real evidence explicitly changes the rule:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level write;
- Monitor gain 1677 write/action/preset/raw access;
- arbitrary/unknown Advanced Raw writes;
- firmware/reset/restore/snapshot commands;
- optimistic fake state;
- hardcoded Control Server port/device ID;
- writes before this module's own client authorization.

## Required next sequence

1. Start from the user's restored normal Focusrite configuration.
2. Windows gate is now clean: **68/68 PASS**, package PASS, `UPDATE_AND_RUN` SUCCESS.
3. Do **not** re-import the `.tgz`; production module source is unchanged.
4. Before a new real FULL campaign, keep physical Monitor low / speakers muted or off where practical.
5. Run `testbench/RUN_SAFE_HARDWARE_TESTS.cmd` -> `FULL`.
6. Let preflight decide page validity: if it returns **PREP REQUIRED / exit 6**, import/replace only page 2 with the newly generated `testbench/generated/FULL_EXTENDED.companionconfig`, remap `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite 0.1.13 connection, then rerun without changing Focusrite state. If the existing page audits against the current snapshot/signature, the hardware campaign may start immediately.
7. Keep r9 as page 1. Never recreate old A/B pages.
8. Capture the complete console output and **share `LATEST_SHAREABLE.json`**, not the private raw JSON.
9. Never publish generated Companion pages or private raw reports.

## Privacy

Never publish live Companion exports, generated harness pages/manifests, serial, hostname, client key, server/client/device IDs, dynamic Control Server port, raw XML/captures, private diagnostics or user-specific paths.
