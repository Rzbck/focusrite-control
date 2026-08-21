# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 19:30 Europe/Paris

This is the **living resume point** for the project. Future AI/contributors must read it before proposing code, tests, branch changes or publication work and update it after every material validation/hardware result or change of objective.

## Project objective and scope

Develop, validate, document and eventually publish a Bitfocus Companion module controlling Focusrite hardware through the local Focusrite Control Server protocol.

Current supported hardware is **ONLY Scarlett 18i20 (3rd Gen)**.

Current repository/module development version: **0.1.13**.

Current working branch: **`testbench/v0.2-hardware-validation`**.

Official Bitfocus repository/module naming is still pending. Bryce Seifert suggested `focusrite-control` may be the eventual scope/name because the transport is Focusrite Control Server. Do not expand supported hardware or change public scope until Bitfocus decides and real hardware testing supports it.

## Latest software gate

Latest complete Windows gate shown by the user:

- Node portable 22.23.2;
- Yarn 4.17.0;
- dependencies immutable: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **43/43 PASS**;
- fail/skipped: 0;
- Companion package: PASS;
- artifact: `focusrite-scarlett-18i20-0.1.13.tgz`;
- `UPDATE_AND_RUN`: SUCCESS.

The module source did not change during the FULL TestBench work. Companion is already proven to be running module **0.1.13**; no `.tgz` re-import is required for TestBench-only fixes.

## Existing r9 page — canonical Core + feedback surface

Existing Companion page:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified facts:

- grid 46 × 26;
- inspected live export: 1196 controls;
- Core explicit setters: **42/42 match** historical r9.6 action/options signatures;
- logical feedback probes: **829**;
- normal feedback definitions represented: **31**;
- each logical r9 probe is encoded as one normal `T` feedback plus one inverted `F` feedback;
- corrected FULL collector strictly validates the pair then counts one logical probe;
- the 829 probe controls contain zero actions.

Never commit or publish the user's live `.companionconfig` export.

## Latest FULL real-device checkpoint — PREP stage

The corrected FULL runner has now run against the physical Scarlett 18i20 (3rd Gen) and reached its intended snapshot/preparation checkpoint **without any hardware write**.

Console result:

- r9 page audit: **PASS** — 42 SAFE setters + 829 logical feedback probes + 31 feedback definitions;
- module version: **PASS 0.1.13**;
- exact model + module client authorisation: **PASS**;
- live TestBench shape: **PASS — 8 inputs / 26 outputs / 24 mixer slots / 12 mix lanes**;
- restorable-state snapshot: captured before first write;
- blank states detected: **1085**; these will use documented safe baselines where the original server state is unavailable rather than fabricated values;
- generated local Extended page: `testbench/generated/FULL_EXTENDED.companionconfig`;
- snapshot signature: **`b591017a2f2c61d9`**;
- exit code: **6 PREP REQUIRED**;
- hardware writes in this run: **0**.

The runner explicitly instructs the user to import the generated page as **one new Companion page**, remap `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection, and rerun FULL **without changing Focusrite state** so the snapshot signature remains valid.

`testbench/generated/` is Git-ignored and the generated page/manifest may contain local restoration values. Never commit or share them.

## FULL lab contract

Single launcher:

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd`

Modes:

- `SAFE` — conservative Core validation; unknown initial state is skipped without write;
- `FULL` — opt-in lab validation using safe documented baselines when original state is unavailable.

Normal FULL is designed to cover:

1. r9 audit + module version + exact model/authorisation;
2. first 829-feedback sweep;
3. Core 21 controls;
4. input nicknames;
5. all applicable output mute/gain set/gain adjust/source/stereo/nickname paths;
6. `output_pair_source` safe None branch on schema-observed output pairs;
7. mixer slot source + stereo for all 24 slots;
8. 12 lanes × 24 strips = 288 strips for mute, solo, gain set, gain adjust and pan;
9. mix talkback on all 12 lanes;
10. Monitor Alt enable/select, Monitor preset, phantom persistence, talkback source and device nickname;
11. immediate server-confirmed restores/baselines;
12. second 829-feedback sweep;
13. module reconnect;
14. detailed local TXT/JSON/CSV reports.

During routing/mixer/gain phases, protective Monitor Mute and applicable output mutes remain engaged. A restoration failure causes **HARD ABORT**.

### Baseline policy

Blank server state is never treated as false. When FULL has explicit user consent and original state is unavailable, safe baselines are established and reported as baseline events rather than fake restores. Examples:

- Air/Pad -> OFF;
- Monitor Mute -> ON;
- Monitor Dim/Talkback -> OFF;
- unknown output mute -> ON;
- unknown output gain -> -128 dB;
- unknown output source -> None;
- unknown output stereo -> OFF;
- unknown mix mute -> ON;
- unknown mix solo/talkback -> OFF;
- unknown mix gain -> -128 dB;
- unknown mix pan -> centre.

## Cold-start limitation — preserve

Core cold-start state acquisition remains **3/21 present**.

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

A 404-item server state packet still omitted the missing 18. Do not add subscribe loops, reconnect delays, write-to-warm, stale state presented as current or an invented read/get command.

Latest SAFE automated result remains **3 PASS / 0 FAIL / 18 SKIP** with Talkback + Input 1/2 Mode server-confirmed and explicitly restored. Earlier guarded work had already validated all 21 Core write paths.

## Disruptive actions deliberately excluded from normal FULL

Normal FULL records these as `MANUAL_PENDING` and does not execute them:

- `device_preset` — can overwrite custom routing;
- `clock_source`;
- `sample_rate` — can interrupt audio;
- `spdif_mode` — can require device restart.

They require a separate explicit disruptive-test decision.

## Always forbidden / unsupported

Never reintroduce or exercise as a TestBench shortcut:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level write;
- Monitor gain item `1677` write/action/preset/raw-write access;
- arbitrary/unknown Advanced Raw writes;
- firmware/reset/restore/snapshot commands;
- optimistic fake state;
- hardcoded Focusrite Control Server port/device ID;
- writes before this module's own client authorisation.

Monitor gain item `1677` remains **read-only**.

## Immediate next sequence

1. In Companion, import local `testbench/generated/FULL_EXTENDED.companionconfig` as **one new page**.
2. During import/remap, map `FOCUSRITE TESTBENCH TARGET` to the already existing Focusrite 18i20 connection. Do not create a second Focusrite connection.
3. Keep the historical r9 page unchanged.
4. Do not change Focusrite Control/routing/settings between snapshot and rerun unless necessary; current snapshot signature is `b591017a2f2c61d9`.
5. Rerun `testbench/RUN_SAFE_HARDWARE_TESTS.cmd` and type `FULL`.
6. If the runner reports the snapshot/page stale or a preparation mismatch, do not force it; follow the newly generated PREP instruction before any hardware write.
7. Capture the complete console output and sanitized report summary. Do not publish the generated page or private report files.
8. Update this handoff with exact PASS/FAIL/EVAL_ONLY/BASELINE/RESTORE results before any separate disruptive-test phase.

## Privacy

Never publish live Companion exports, generated snapshot pages, device serial, hostname, client key, server/client/device IDs, dynamic Control Server port, raw private XML/captures, private diagnostics or user-specific paths.

FULL local reports intentionally omit endpoint, live connection IDs, serial, live nickname contents, client key, device ID/port, raw XML and raw page export.

## Publication state

Do not change public module scope/name while Bitfocus's official repository/naming decision is pending. When the official repository exists, inspect its exact name/default branch/seed/permissions and follow the expected PR/CI workflow. Stable target remains v1.0.0 unless maintainers direct otherwise.
