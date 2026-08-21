# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 21:29 Europe/Paris

This is the living resume point. Read it before proposing code, tests, branch changes or publication work and update it after every material hardware result.

## Scope / publication

- Supported hardware remains **Scarlett 18i20 (3rd Gen) only**.
- Module/package development version remains **0.1.13**.
- Working branch: **`testbench/v0.2-hardware-validation`**.
- Official Bitfocus repository/name is still pending. Bryce Seifert suggested `focusrite-control`; do not expand supported hardware or public scope until maintainers decide and real hardware evidence exists.
- Monitor gain item **1677 remains read-only**.
- TestBench development changes tooling/tests/docs only; do not re-import the module `.tgz` for TestBench-only changes.

## Last complete Windows gate shown by user

- Node 22.23.2 / Yarn 4.17.0;
- dependencies immutable: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **43/43 PASS**;
- package: PASS — `focusrite-scarlett-18i20-0.1.13.tgz`;
- `UPDATE_AND_RUN`: SUCCESS.

A fresh Windows gate is required after the V4 Capability Lab commit. Do not claim its exact test count until the user shows it.

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
- exact model + own client authorization: PASS;
- live shape: PASS — 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- generated Extended page audits: PASS.

### Earlier Air 5 stop

An earlier FULL stopped on `Could not establish FULL baseline for Air input 5.` This was diagnosed as a TestBench no-op-confirmation defect, not evidence that Air 5 mapping was wrong. V2 introduced alternate-value -> baseline confirmation.

### Latest real V3 run

The latest user run was v0.2.2 / `full-v3-output-availability-20260821`:

- r9 audit: PASS;
- module 0.1.13: PASS;
- exact model/auth: PASS;
- shape 8/26/24/12: PASS;
- output availability: **22 available, 0 unavailable, 4 unknown skipped**;
- **1065 blank executable states** identified;
- page 2 audit: **266 controls**, snapshot `253ba9340be8e53e`;
- feedback-before: **130 PASS / 699 EVAL_ONLY / 0 FAIL** across all 829 logical probes;
- hardware phase then stopped with `HARD ABORT: Output 12 could not return to protective Mute ON after no-op recovery.`;
- exit code: **4**.

The user manually recovered/unmuted after that stop. Treat post-abort output state as tainted for campaign-baseline purposes. Before the next V4 snapshot/hardware campaign, restore the saved pre-campaign Focusrite configuration manually.

Do **not** treat Output 12 as a proven bad action. The V3 architecture still assumed each eligible output mute should behave independently. Output 12 may be independent, paired/coupled, aliased or otherwise non-observable in the expected way; V4 must classify this rather than globally abort.

## V4 Capability Lab architecture

Campaign revision:

`full-v4-capability-lab-20260821`

The V4 lab is capability-driven rather than a single pass/fail scenario. It cross-references:

1. hardware-tested model profile;
2. live schema/Companion variable capability;
3. server-confirmed availability/state;
4. r9 feedback coverage;
5. actual hardware response;
6. restoration/quarantine result.

Important result classes include:

- `PASS_INDEPENDENT`;
- `PASS_COUPLED_PAIR`;
- `PASS_BASELINE`;
- `PASS`;
- `EVAL_ONLY`;
- `SKIP_UNAVAILABLE`;
- `SKIP_AVAILABILITY_UNKNOWN`;
- `SKIP_NO_CAPABILITY`;
- `SKIP_NO_HARNESS`;
- `BLOCKED_BY_SAFETY`;
- `FAIL_NO_EFFECT`;
- `FAIL_MISMATCH`;
- `QUARANTINED_RESTORE`.

Individual failures do **not** globally stop the campaign when a safe guard or quarantine remains confirmed. Only loss of the global safety/authorization/connection contract is a true global HARD ABORT.

### V4 coverage strategy

- first + second 829-feedback sweeps;
- Core Air/Pad/Mode/Dim/Talkback individually;
- input nickname individually;
- output mute individually while observing its schema pair, classifying independent vs coupled behavior;
- output source/gain/stereo/nickname individually where safe;
- `output_pair_source` tested pair-by-pair with exact restore;
- output `available=false` gets no write;
- output availability unknown gets no write and is reported, not guessed;
- if mute cannot be confirmed, `Source=None` may be used only on non-unknown eligible outputs as a secondary safe quarantine;
- mixer slot source/stereo individually;
- 12 lanes × 24 strips: lane batches for efficiency but verdict and restore/quarantine **per strip** for mute/solo/gain/pan;
- mix talkback per lane;
- Monitor Alt enable/select, preset, phantom persistence, talkback source, device nickname;
- reconnect at campaign end;
- report TXT/JSON/CSV under `testbench/results/`.

The V4 generated page remains a pure Companion-action harness. It never writes Focusrite protocol directly.

## V4 report contract

`capability-lab_*.json/csv/txt` reports include target/family, availability, r9 coverage, state-known flag, risk/dependency, hardware result, skip/block reason and restore/quarantine result.

Reports remain private/sanitized: no serial, hostname, dynamic server port, client key, live connection IDs, raw XML/page export or live nickname contents.

## Normal FULL exclusions / forbidden paths

Normal FULL still records as manual/excluded and does not execute:

- device preset;
- clock source;
- sample rate;
- S/PDIF mode.

Always forbidden/unsupported:

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

## Required next sequence after V4 branch is published

1. Restore the user's saved pre-campaign Focusrite configuration. Keep physical Monitor low / speakers muted.
2. Run root `UPDATE_AND_RUN.bat`, choose `[1] testbench/v0.2-hardware-validation`, and require a complete clean Windows gate. Do not run hardware if the gate fails.
3. Do **not** re-import the `.tgz`; `src/` is unchanged.
4. Run `testbench/RUN_SAFE_HARDWARE_TESTS.cmd` -> `FULL`.
5. First V4 pass should be PREP-only and generate the V4 isolated page 2 with **zero hardware writes**.
6. Keep r9 as page 1. Replace only page 2 with `testbench/generated/FULL_EXTENDED.companionconfig`; map `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite 0.1.13 connection.
7. Rerun the same launcher -> `FULL` without changing Focusrite state between generation/import/rerun.
8. Capture complete console output plus sanitized capability-lab summary. Never publish the generated page or private raw reports.

## Privacy

Never publish live Companion exports, generated harness pages/manifests, serial, hostname, client key, server/client/device IDs, dynamic Control Server port, raw XML/captures, private diagnostics or user-specific paths.
