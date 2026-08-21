# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 20:35 Europe/Paris

This is the living resume point. Read it before proposing code, tests, branch changes or publication work and update it after every material hardware result.

## Scope / publication

- Supported hardware remains **Scarlett 18i20 (3rd Gen) only**.
- Module/package development version remains **0.1.13**.
- Working branch: **`testbench/v0.2-hardware-validation`**.
- Official Bitfocus repository/name is still pending. Bryce Seifert suggested `focusrite-control`; do not expand scope until maintainers decide and real hardware evidence exists.
- Monitor gain item **1677 remains read-only**.

## Latest complete Windows gate

Last complete user-shown gate before the current availability patch:

- Node 22.23.2 / Yarn 4.17.0;
- dependencies immutable: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **43/43 PASS**;
- package: PASS — `focusrite-scarlett-18i20-0.1.13.tgz`;
- `UPDATE_AND_RUN`: SUCCESS.

TestBench development since then changes tooling/tests/docs only, not `src/`; do not re-import the module `.tgz` for these TestBench-only fixes. A fresh Windows gate is required before the next hardware run; do not claim its exact test count until the user shows it.

## Canonical Companion pages

Page 1 remains the user's existing live r9 matrix:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified:

- 46 × 26 grid;
- inspected live export: 1196 controls;
- **42/42** SAFE Core setters;
- **829 logical feedback probes / 31 definitions**;
- each probe is one normal `T` feedback + one inverted `F` feedback;
- feedback probe cells contain zero actions.

Never publish the user's live r9 `.companionconfig`.

Page 2 is temporary/generated:

`testbench/generated/FULL_EXTENDED.companionconfig`

It is snapshot-specific, Git-ignored, and must never be published. Old A/B local pages are obsolete leftovers from earlier development and are not active Git branch content.

## Cold-start / SAFE evidence

Core cold-start acquisition remains **3/21 present**:

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

Latest automated SAFE hardware result remains **3 PASS / 0 FAIL / 18 SKIP**. Earlier guarded work had already validated all 21 Core write paths. Never invent missing state or add write-to-warm behavior to production feedback/state.

## FULL hardware evidence — confirmed so far

### r9 / feedback / preflight

Real Scarlett 18i20 runs have confirmed:

- r9 audit: PASS — 42 Core setters + 829 logical probes + 31 feedback definitions;
- module version: PASS 0.1.13;
- exact model + own client authorization: PASS;
- live shape: PASS — 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- generated Extended page audit: PASS;
- first complete read-only feedback sweep: **PASS 111 / EVAL_ONLY 718 / FAIL 0** across all 829 logical probes.

The 718 EVAL_ONLY results are not false passes: those probes lacked an independent server-confirmed value at that cold-start point.

### First hardware failure — Air 5 no-op

An earlier FULL hardware run stopped on:

`Could not establish FULL baseline for Air input 5.`

This was diagnosed as a TestBench no-op-confirmation bug, not evidence that Air 5 mapping was wrong. If a blank state is already physically at the requested baseline, Focusrite can stay silent on a same-value write. v0.2.1 added alternate-value → baseline confirmation and moved Monitor Mute protection before Core/output work.

### Latest hardware run — output mute HARD ABORT

User then ran v0.2.1 with generated page signature `f58b863d9ab91caf`.

Before hardware:

- r9 audit PASS;
- 0.1.13 PASS;
- exact model/auth PASS;
- shape 8/26/24/12 PASS;
- Extended page PASS — **274 audited batch controls**;
- feedback sweep again **111 PASS / 718 EVAL_ONLY / 0 FAIL**.

Hardware phase started with Monitor Mute first, then output guard. Fatal result:

`HARD ABORT: one or more output mutes could not return to protective ON after recovery.`

Exit code: **4**.

Do not describe output mute as hardware-tested from this result. The runner correctly stopped because protective output state was not fully server-confirmed.

### Diagnosis of latest HARD ABORT

Two TestBench design defects were identified; both must be fixed before rerun:

1. The runner treated all **26 schema outputs** as currently usable. But output capability and output **availability** are different. The module exposes `output_N_available` when the schema provides an availability control. Digital outputs can be unavailable depending on current device mode/configuration. A normal FULL run must not require writes/confirmation from `available=false` outputs.
2. The protective output guard used large all-output batches during no-op recovery. Even for eligible outputs, protection should be established one output at a time so each transition is attributable and a failure names the exact output.

Project design already required unavailable outputs to be `SKIP_UNAVAILABLE`; the V2 runner failed to implement that rule.

## Current TestBench patch — v0.2.2 availability-aware FULL

Current branch work adds campaign revision:

`full-v3-output-availability-20260821`

Planned/implemented behavior:

- capture `output_N_available` read-only before generating output write surfaces;
- `available=true` -> eligible for normal FULL;
- `available=false` -> `SKIP_UNAVAILABLE`, no output action generated/executed;
- availability control exists but server state is blank/unknown -> `SKIP_AVAILABILITY_UNKNOWN`, no output write;
- no availability control in schema -> output remains eligible if the relevant normal action capability exists;
- output mute/source/stereo/nickname/gain and pair-source generation all use the filtered eligible output set;
- Monitor Mute is confirmed before any output operation;
- protective output mutes are established **sequentially per eligible output**, never through a 26-write burst;
- blank/no-op mute state uses per-output OFF -> ON recovery under confirmed Monitor Mute;
- a failure to return a specific eligible output to Mute ON is a HARD ABORT naming that output;
- individual output mute functional tests and final output-mute restoration/baseline are also sequential;
- unavailable/unknown outputs remain visible in the 829 feedback matrix but are not silently called hardware-write PASS;
- all existing no-op recovery for Core/mixer/other Extended families remains;
- no direct Focusrite protocol writes are added; TestBench still acts only through audited Companion actions;
- normal FULL still excludes device preset, clock source, sample rate and S/PDIF mode;
- 1677, Advanced Raw, firmware/reset/restore/snapshot remain forbidden.

New automated coverage checks output availability classification, removal of unavailable/unknown output write surfaces, sequential output guard ordering and global forbidden-write rules.

## State after the latest HARD ABORT — important

The latest failed run performed hardware writes before aborting.

- Protective Monitor Mute was engaged first and was intentionally retained on HARD ABORT.
- Individual output mute state must be treated as **tainted/unknown for campaign-baseline purposes** because the failed OFF -> ON recovery may have warmed or changed some output mute states.
- Do not take the current post-abort state as the user's original configuration snapshot.

The user stated before the FULL campaign that they saved their Focusrite configuration. Before the next FULL snapshot/hardware campaign, restore that saved pre-campaign Focusrite configuration manually, then leave Focusrite state unchanged while the runner generates/audits the new page 2. Keep the physical Monitor low / speakers muted during this recovery and subsequent testing.

## Required next sequence

1. Pull the availability-aware patch using root `UPDATE_AND_RUN.bat`, choose `[1] testbench/v0.2-hardware-validation`, and require a fully clean Windows gate. Do not run hardware if it fails.
2. Do not re-import the `.tgz`; module source is unchanged.
3. Before the next FULL snapshot, restore the user's saved pre-campaign Focusrite configuration so the current post-HARD-ABORT output state is not mistaken for original state.
4. Run `testbench/RUN_SAFE_HARDWARE_TESTS.cmd` -> `FULL` with physical Monitor/speakers safe.
5. The first v0.2.2 pass should remain pre-write, report output availability counts, generate a new signature/page 2 and exit PREP REQUIRED.
6. Keep r9 as page 1. Replace only page 2 with the newly generated `testbench/generated/FULL_EXTENDED.companionconfig`, mapping `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite 0.1.13 connection.
7. Rerun the same launcher -> `FULL` without changing Focusrite state between snapshot/page generation and rerun.
8. Capture the entire console output. On any HARD ABORT, do not rerun before diagnosis.

## Intended normal FULL coverage

- first + second 829-feedback sweeps;
- Core 21;
- input nicknames;
- every currently eligible output mute/gain set/gain adjust/source/stereo/nickname path;
- safe output pair-source None branch only where both channels are eligible;
- 24 mixer slot source/stereo controls;
- 12 lanes × 24 = 288 strips for mute, solo, gain set/adjust and pan;
- mix talkback all lanes;
- Monitor Alt enable/select, Monitor preset, phantom persistence, talkback source, device nickname;
- reconnect;
- detailed local TXT/JSON/CSV reports.

Normal FULL records device preset, clock source, sample rate and S/PDIF mode as `MANUAL_PENDING` rather than executing them.

## Always forbidden / unsupported

Never reintroduce or exercise as a TestBench shortcut:

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

## Privacy

Never publish live Companion exports, generated Extended pages/manifests, serial, hostname, client key, server/client/device IDs, dynamic Control Server port, raw XML/captures, private diagnostics or user-specific paths. Local FULL reports must remain sanitized and private.