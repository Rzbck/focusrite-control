# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 17:52 Europe/Paris

This is the **living resume point** for the project. Future AI/contributors must read it before proposing code, tests, branch changes or publication work and update it after every material validation/hardware result or change of objective.

## Project objective and scope

Develop, validate, document and eventually publish a Bitfocus Companion module controlling Focusrite hardware through the local Focusrite Control Server protocol.

Current supported hardware is **ONLY Scarlett 18i20 (3rd Gen)**.

Current repository/module development version: **0.1.13**.

Current working branch: **`testbench/v0.2-hardware-validation`**.

Official Bitfocus repository/module naming is still pending. Bryce Seifert suggested `focusrite-control` may be the eventual scope/name because the transport is Focusrite Control Server. Do not expand supported hardware or change public scope until Bitfocus decides and real hardware testing supports it.

## Latest real hardware evidence

The v0.1.13 SAFE automated runner has executed successfully on the physical Scarlett 18i20 (3rd Gen).

Pre-write guards passed:

- existing r9 page audit: **PASS**;
- **42/42 explicit SAFE setters verified**;
- audited module version: **0.1.13**;
- exact model: **PASS**;
- this module client's Remote Devices authorisation: **PASS**.

Latest SAFE result:

- **PASS 3**;
- **FAIL 0**;
- **SKIP 18**;
- exit code: **0**.

Executed + server-confirmed + explicitly restored:

- Talkback;
- Input 1 Line/Instrument;
- Input 2 Line/Instrument.

Skipped without write because cold-start server state was unknown:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

Earlier guarded hardware work had already validated all 21 Core write paths. Do not describe the latest v0.1.13 SAFE run itself as 21/21; its exact automated result is 3 PASS / 18 SKIP / 0 FAIL.

## Cold-start limitation — definitive

Fresh state acquisition remains **3/21 present**.

Present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

A 404-item state packet still omitted those 18 values. Do not add subscribe loops, reconnect delays, write-to-warm, stale persisted state presented as current or an invented read/get command.

Production state contract remains strict: explicit target writes can be used only when connected/writable/authorised; state-derived Toggle/Cycle/relative actions need confirmed current state; feedbacks/variables are server-confirmed only; no optimistic updates.

## Existing r9 page — canonical Core + feedback surface

The user already has:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified facts:

- grid: 46 × 26;
- inspected live export: 1196 controls;
- Core explicit setters: **42/42 match** the historical r9.6 action/options signatures;
- detailed read-only feedback probes: **829**;
- normal feedback definitions represented: **31**;
- the 829 feedback-probe controls contain zero actions.

Do not commit the user's live `.companionconfig` export. It contains private/local connection configuration.

## NEW: FULL lab TestBench implementation

The user explicitly requested a real general TestBench instead of continuing isolated micro-tests, and confirmed they saved their configuration before the broader campaign.

A new opt-in **FULL** mode has been implemented in development tooling while preserving the existing SAFE contract.

Single launcher remains:

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd`

It offers:

- `SAFE` — existing conservative Core behavior;
- `FULL` — general hardware/feedback lab campaign.

### FULL phase plan

Normal FULL is designed to:

1. audit r9 + module version + exact hardware/authorisation;
2. audit **829 feedback probes / 31 definitions**;
3. verify live shape **8 inputs / 26 outputs / 24 mixer slots / 12 mix lanes**;
4. run the full read-only feedback sweep before writes;
5. establish documented safe baselines for unknown states instead of skipping them;
6. exercise Core 21 controls;
7. exercise input nicknames;
8. exercise all applicable output mute/gain set/gain adjust/source/stereo/nickname paths;
9. exercise `output_pair_source` through its safe `source=None` branch on schema-observed left pair members `[0,2,...,24]`;
10. exercise mixer slot source + stereo for all 24 slots;
11. exercise all **12 lanes × 24 strips = 288 strips** for mute, solo, gain set, gain adjust and pan;
12. exercise mix talkback on all 12 lanes;
13. exercise Monitor Alt enable/select, Monitor preset, phantom persistence, talkback source and device nickname;
14. restore/baseline all changed families with server confirmation;
15. run a second 829-feedback sweep;
16. test module reconnect;
17. write local detailed TXT/JSON/CSV reports.

### FULL preparation contract

To restore mixer gain/pan/mute/solo state exactly, the Focusrite Companion connection must have:

`Expose all mixer slot variables`

enabled. If not, FULL exits `PREP REQUIRED` (code 6) before hardware writes.

The historical r9 page does not contain the 22 Extended action families. FULL therefore generates **one local snapshot-specific Extended page**:

`testbench/generated/FULL_EXTENDED.companionconfig`

plus a local manifest. `testbench/generated/` is Git-ignored. The generated page can contain local restore values and must never be committed/shared.

On first prepared FULL run the runner captures state read-only, generates the page, exits code 6 before writes and tells the user to import it as one new Companion page and remap `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection. The same launcher is then rerun with `FULL`.

The imported page is audited against a snapshot signature before any hardware write. A stale/mismatched page blocks and regenerates rather than guessing.

### FULL baseline contract

FULL is deliberately different from SAFE. It never pretends blank state is false, but the user's explicit FULL consent allows a documented safe baseline when the original state is unavailable.

Examples:

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

These cases are reported as `BASELINE_ESTABLISHED` / `BASELINE_DESTRUCTIVE`, not falsely called original-state restoration.

Protective Monitor Mute and output mutes remain engaged while routing/mixer/gain tests run. Each reversible family restores immediately. Restoration failure => **HARD ABORT**.

### FULL feedback contract

Feedback rendered state is read through Companion's internal button-text variables (`b_text_*`) from the already imported r9 matrix.

- rendered `T/F` is compared to an independent server-confirmed module variable where possible;
- meters or feedbacks without an independent observable variable are `EVAL_ONLY`;
- cold-start blank independent state is `EVAL_ONLY`, not fake false and not an automatic FAIL;
- unresolved rendered marker or a real observable mismatch is FAIL;
- feedback-probe cells are audited to contain zero actions before fallback redraw presses are allowed.

### FULL generated surface validation

The new runner has a local non-hardware self-test. Current local result before Windows repo validation:

- **SELFTEST PASS**;
- generated batches: **217**;
- no disruptive/forbidden action definition generated.

A new Node safety test file contains **6** TestBench-specific tests and passed locally in isolation. Do not claim a new whole-repository Windows test count until the user runs a fresh `UPDATE_AND_RUN.bat` and shows the output.

## Disruptive actions deliberately NOT executed by normal FULL

Normal FULL records these as `MANUAL_PENDING`:

- `device_preset` — can overwrite custom routing;
- `clock_source`;
- `sample_rate` — interrupts audio;
- `spdif_mode` — can require a device restart.

They require a separate explicit disruptive-test decision. Do not silently mix them into normal FULL just because the user wants broad coverage.

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
- optimistic state;
- hardcoded Focusrite Control Server port/device ID;
- writes before this module's own client authorisation.

Monitor gain item `1677` remains **read-only**.

## Current software gate

Most recent complete Windows gate actually shown by the user, before the new FULL implementation:

- Node portable: 22.23.2;
- Yarn: 4.17.0;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **35/35 PASS**;
- package: PASS;
- artifact: `focusrite-scarlett-18i20-0.1.13.tgz`.

The FULL runner/test/docs changes are newer than that gate. **Next required action is a fresh `UPDATE_AND_RUN.bat` validation.** Do not claim the FULL code is repo-gate clean until that run passes.

## Immediate next sequence

1. User runs root `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation` and shows complete output.
2. If `RUN OK`, keep Companion on module 0.1.13.
3. Run `testbench/RUN_PREFLIGHT.cmd` if connection/Companion restarted.
4. Run `testbench/RUN_SAFE_HARDWARE_TESTS.cmd`, type `FULL`.
5. If `PREP REQUIRED` says mixer variables are disabled, enable **Expose all mixer slot variables**, Apply, then rerun the same launcher.
6. If `PREP REQUIRED` generates `testbench/generated/FULL_EXTENDED.companionconfig`, import it as one new page, remap `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection, then rerun the same launcher with `FULL` without changing Focusrite state.
7. Capture the complete FULL console output and local report summary. Do not publish raw generated page or private reports.
8. Update this handoff with exact PASS/FAIL/EVAL_ONLY/BASELINE/RESTORE results before attempting disruptive actions.

## Privacy

Never publish live Companion exports, generated snapshot pages, device serial, hostname, client key, server/client/device IDs, dynamic Control Server port, raw private XML/captures, private diagnostics or user-specific paths.

FULL local reports intentionally omit endpoint, connection IDs, serial, live nickname contents, client key, device ID/port, raw XML and raw page export.

## Publication state

Do not change public module scope/name while Bitfocus's official repository/naming decision is pending. When the official repository exists, inspect its exact name/default branch/seed/permissions and follow its expected PR/CI workflow. Stable target remains v1.0.0 unless maintainers direct otherwise.
