# Scarlett 18i20 Companion TestBench v0.2

This folder is the public, sanitized hardware-validation harness for the **Scarlett 18i20 (3rd Gen)** Companion module through Companion's local HTTP API.

The live validation path is:

`TestBench -> Companion local API/button -> module -> Focusrite Control Server -> server-confirmed module variable -> restore/baseline -> PASS/FAIL`

## Two modes, one launcher

Use only:

`RUN_SAFE_HARDWARE_TESTS.cmd`

It now offers:

- `SAFE` — conservative Core validation. Unknown initial Core state is skipped without write. This preserves the original restore-safe contract.
- `FULL` — opt-in lab validation. It reuses the existing r9 feedback/Core page, establishes documented safe baselines for unknown states, exercises all currently reversible Extended families, and creates detailed local JSON/CSV/TXT reports.

`SAFE` behavior is intentionally unchanged by the addition of `FULL`.

## Existing r9 Companion page

Both modes reuse the historical page already present in Companion:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

The FULL runner audits this page before any hardware write and requires:

- exact 46x26 grid;
- exact **42 SAFE Core setters**;
- exactly **829 read-only feedback probes**;
- exactly **31 normal feedback definitions**;
- one Focusrite module instance;
- loaded module version equal to `package.json.version`;
- no actions on the 829 detailed feedback-probe controls.

The r9 page remains the canonical Core + feedback matrix. Do not replace it with the old temporary v0.2 A/B pages.

## Read-only preflight

`RUN_PREFLIGHT.cmd` performs no hardware write. It dynamically detects Companion and verifies:

1. Companion HTTP API is reachable;
2. the `focusrite-scarlett-18i20` connection exists and is enabled;
3. `device_model` is exactly `Scarlett 18i20 (3rd Gen)`;
4. this module's own Focusrite Control Server client is authorised;
5. connection status is authorised.

## SAFE mode

SAFE covers:

- Air 1-8;
- Pad 1-8;
- Input 1/2 Line/Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

SAFE uses only explicit setters. It does not use Toggle or Cycle. Known state is changed, server-confirmed, explicitly restored and server-confirmed again. Unknown initial state is `SKIP` with no write. Restoration failure is a hard abort.

## FULL mode

FULL is a separate, explicitly selected lab contract for exhaustive testing after the user has saved the Focusrite/Companion configuration.

### Phase 1 — read-only r9 audit and 829 feedback sweep

Before the first hardware write FULL:

- audits the existing r9 page and module version;
- confirms exact model and authorisation;
- confirms live shape: **8 inputs / 26 outputs / 24 mixer slots / 12 mix lanes**;
- evaluates all **829 feedback probes**;
- compares rendered `T/F` feedback results with independent server-confirmed variables when an independent variable exists;
- labels meters or unavailable independent state as `EVAL_ONLY` rather than inventing a PASS.

A rendered feedback mismatch is a real `FAIL`. Cold-start blank state is not treated as a false value.

### Phase 2 — mixer-variable prerequisite

To restore all 12 lanes x 24 strips exactly, the Companion connection must enable:

`Expose all mixer slot variables`

If this is disabled, FULL exits with code `6` and `PREP REQUIRED` **before any hardware write**. Enable it on the existing Focusrite connection, Apply, then rerun the same launcher.

### Phase 3 — generated local Extended page

The historical r9 page contains Core actions and feedback probes, but not the 22 Extended action families. FULL therefore generates one local snapshot-specific page:

`testbench/generated/FULL_EXTENDED.companionconfig`

This file is Git-ignored and may contain local restoration values. Never commit or share it.

On the first prepared FULL run:

1. the runner captures the restorable state without hardware writes;
2. generates the Extended page plus a local manifest;
3. exits with code `6` and `PREP REQUIRED`;
4. import that file as **one new Companion page**;
5. remap `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection;
6. rerun the same `RUN_SAFE_HARDWARE_TESTS.cmd` and type `FULL`.

The imported Extended page is audited against the captured snapshot before use. If the snapshot changed, FULL refuses the stale page and generates a new one before hardware writes.

### Phase 4 — FULL reversible hardware families

During routing/mixer/gain phases, protective Monitor Mute and applicable output mutes are kept engaged.

FULL exercises and verifies, where exposed by the 18i20 schema:

- Core Air/Pad/Mode/Mute/Dim/Talkback — **21 controls**;
- input nicknames — all applicable inputs;
- output mute, gain set, gain adjust, source, stereo link and nickname — all applicable outputs;
- `output_pair_source` through its safe `None` branch on schema-observed output pairs;
- mixer slot source + stereo — **24 slots**;
- mix mute, solo, gain set, gain adjust and pan — **12 lanes x 24 strips = 288 strips**;
- mix talkback mapping — all 12 lanes;
- Monitor Alt enable/select;
- Monitor output-control preset;
- phantom **persistence** setting;
- talkback input source;
- device nickname;
- module reconnect;
- a second 829-feedback sweep after restoration/baselines.

Each batch is checked through server-confirmed Companion variables. Reversible families restore immediately. A restore failure produces `HARD ABORT`.

### FULL safe-baseline policy

Cold-start state can legitimately be blank. FULL does not pretend that blank means false.

If an executable state is unknown but the user selected FULL, the runner establishes and records a safe baseline instead of skipping the family. Examples include:

- Air/Pad -> OFF;
- Monitor Mute -> ON;
- Monitor Dim/Talkback -> OFF;
- unknown output mute -> ON;
- unknown output gain -> -128 dB;
- unknown output source -> None;
- unknown mixer gain -> -128 dB;
- unknown mixer mute -> ON;
- unknown mixer solo/talkback -> OFF;
- unknown mixer pan -> centre.

Such cases are labelled `BASELINE_DESTRUCTIVE` / `BASELINE_ESTABLISHED` in the local report. They are not falsely called original-state restoration.

## Disruptive actions remain separate

Normal FULL deliberately does **not** execute:

- `device_preset` — recalls routing and can overwrite custom routing;
- `clock_source`;
- `sample_rate` — can interrupt audio;
- `spdif_mode` — can require device restart.

They are recorded as `MANUAL_PENDING`. They require a separate explicit disruptive-test decision and must never be silently mixed into normal FULL.

## Always forbidden

- analogue input preamp gain;
- direct per-input hardware mute claim;
- per-channel phantom-power switching;
- Mic Kill;
- Monitor gain item `1677` write/action/preset/raw-write access;
- arbitrary/unknown Advanced Raw writes as a TestBench shortcut;
- firmware/reset/restore/snapshot commands;
- optimistic fake state;
- hardcoded Focusrite Control Server TCP port or device ID.

Monitor gain item `1677` remains **read-only**.

## Running

1. Run root `UPDATE_AND_RUN.bat` and require `RUN OK`.
2. Keep Companion open with the HTTP API enabled.
3. Keep the existing r9 FULL MATRIX page.
4. Run `RUN_PREFLIGHT.cmd` after module/Companion restart if needed.
5. Turn the physical Monitor knob down and mute/power down speakers where practical.
6. Run `RUN_SAFE_HARDWARE_TESTS.cmd`.
7. Type `SAFE` or `FULL` exactly.
8. If FULL prints `PREP REQUIRED`, perform only the requested preparation and rerun the **same** launcher.

## Local reports

SAFE keeps its fixed local result under:

`testbench/results/`

FULL creates timestamped:

- `full-testbench_*.txt`;
- `full-testbench_*.json`;
- `full-testbench_*.csv`.

Reports are Git-ignored. They omit Companion endpoint, live connection IDs, device serial, hostname, client key, Control Server device ID/port, raw XML/page export and live nickname contents.

## Public-repository privacy

Do not commit live Companion exports, generated snapshot pages, test output, device XML/captures, serials, hostnames, keys/IDs, private diagnostics or user-specific paths.

This TestBench is development tooling for the personal repository. It does not expand public hardware support beyond **Scarlett 18i20 (3rd Gen)** and it is not automatically part of a future Bitfocus repository.
