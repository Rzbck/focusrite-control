# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 16:39 Europe/Paris

This is the **living resume point** for the project. Future AI/contributors must read this file before proposing code, tests, branch changes or publication work, and must update it after every material validation/hardware result or change of objective.

## Project objective

Develop, validate, document and eventually publish a Bitfocus Companion module controlling Focusrite hardware through the local Focusrite Control Server protocol.

Current supported hardware is **ONLY Scarlett 18i20 (3rd Gen)**.

Current repository/module development version: **0.1.13**.

Current working branch: **`testbench/v0.2-hardware-validation`**.

Official Bitfocus repository/module naming is still pending. Bryce Seifert suggested `focusrite-control` may be the eventual scope/name because the transport is Focusrite Control Server. Do not expand supported hardware or change public scope until Bitfocus decides and real hardware testing supports it.

## Immediate state — latest real hardware result

The current v0.1.13 SAFE automated hardware runner has now executed successfully on the physical Scarlett 18i20 (3rd Gen).

Pre-write guards all passed:

- existing r9 Companion page audit: **PASS**;
- **42/42 explicit SAFE setters verified**;
- exact audited r9 module version: **0.1.13**;
- exact hardware model: **PASS**, `Scarlett 18i20 (3rd Gen)`;
- this module client's Focusrite Remote Devices authorization: **PASS**;
- module connection state: authorised.

Automated SAFE result:

- **PASS 3**;
- **FAIL 0**;
- **SKIP 18**;
- exit code: **0**.

Executed and restored with server-confirmed state:

- Talkback: changed and explicitly restored to `false`;
- Input 1 Line/Instrument: changed and explicitly restored to `Line`;
- Input 2 Line/Instrument: changed and explicitly restored to `Line`.

Skipped without write because initial server state was unknown:

- Air inputs 1–8;
- Pad inputs 1–8;
- Monitor Mute;
- Monitor Dim.

The 18 skips are **not failures**. They are the intended safety behavior of the current runner: it refuses to change a control when the original state is unknown and therefore cannot be guaranteed restorable.

This is now the strongest current v0.1.13 automated hardware evidence: **3 reversible controls passed end-to-end, 18 controls safely skipped, 0 failures, 0 restoration failures**.

Do not claim that the current v0.1.13 automated runner has retested all 21 Core controls. The 18 skipped controls remain covered by earlier guarded hardware testing, but not by this specific v0.1.13 automated restore-safe run.

## Existing r9 TestBench page — keep and reuse

The user already has the historical full-matrix page in Companion:

- name: `Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`;
- marker: `TB-R9-ALL`;
- grid: 46 × 26;
- inspected live export contained 1196 controls;
- historical r9.6 plan contained 829 feedback probes plus the Core hardware-control region.

The live r9 Core region was compared with the historical r9.6 page. The **42 SAFE setter action/option signatures match 42/42** when runtime connection/action IDs are ignored.

Those setters are:

- Air 1–8 explicit ON/OFF — 16 buttons;
- Pad 1–8 explicit ON/OFF — 16 buttons;
- Input 1 Line/Inst — 2 buttons;
- Input 2 Line/Inst — 2 buttons;
- Monitor Mute ON/OFF — 2 buttons;
- Monitor Dim ON/OFF — 2 buttons;
- Talkback ON/OFF — 2 buttons.

Public canonical mapping is stored in:

- `testbench/Focusrite_18i20_SafeHardwarePlan.json`;
- `testbench/Focusrite_18i20_SafeHardwareTest.js`;
- `test/testbench-safety.test.js`.

The temporary v0.2 A/B page generator was removed because it duplicated the existing r9 Core page. Do not recreate or re-import those pages without new evidence.

**Never commit the user's live `.companionconfig` export.** It contains user-specific/private connection configuration. Keep only sanitized structural facts in GitHub.

## Cold-start limitation — definitive

Cold-start state acquisition remains **3/21 present**.

Present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

A 404-item server state packet still omitted those missing 18 values. Do not add subscribe loops, reconnect delays, write-to-warm behavior, stale persisted state presented as current, or invent a read/get command.

The latest SAFE run reproduces this limitation exactly: the same 18 controls were skipped because their initial server state was unknown.

Production state contract remains:

- explicit target writes may be used when connected, verified writable and this module client is authorised;
- Toggle/Cycle/relative operations require server-confirmed current state;
- feedbacks and variables use only server-confirmed state;
- unknown values stay unknown/blank;
- no optimistic updates;
- no writes merely to discover state.

## SAFE runner contract — preserve

- exact Scarlett 18i20 (3rd Gen) only;
- existing r9 page audited before writes;
- exactly 42 approved SAFE setters verified;
- audited r9 instance module version must equal `package.json.version`;
- do not rely on raw Companion connection-ID equality across API/export objects;
- this module's own Focusrite client must be authorised;
- no Toggle or Cycle in SAFE tests;
- read all initial states before first write;
- unknown initial state → SKIP with no write;
- explicit target setter only;
- wait for server-confirmed target state;
- explicit restore to original confirmed value;
- wait for server-confirmed restoration;
- restoration failure → HARD ABORT all remaining tests;
- results stay local under ignored `testbench/results/`.

## Hardware evidence labels

### Hardware-tested from earlier guarded work

- Air 1–8 write paths;
- Pad 1–8 write paths;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback;
- dynamic discovery/TCP/auth/subscription/server-confirmed state.

### Newly hardware-tested by the v0.1.13 automated SAFE runner

- Talkback — PASS + confirmed restore;
- Input 1 Line/Instrument — PASS + confirmed restore;
- Input 2 Line/Instrument — PASS + confirmed restore.

### Not executed by the latest v0.1.13 SAFE run

- Air 1–8 — SKIP due unknown initial state;
- Pad 1–8 — SKIP due unknown initial state;
- Monitor Mute — SKIP due unknown initial state;
- Monitor Dim — SKIP due unknown initial state.

Do not relabel the 18 skipped controls as v0.1.13 automated PASS until a future test can safely establish a restorable initial state without violating the state contract.

## Current validated software gate

Most recent complete Windows gate shown by the user:

- branch: `testbench/v0.2-hardware-validation`;
- Node portable: 22.23.2;
- Yarn: 4.17.0;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **35/35 PASS**;
- Companion package: PASS;
- artifact: `focusrite-scarlett-18i20-0.1.13.tgz`.

Do not claim a newer exact test count until a complete newer `UPDATE_AND_RUN.bat` output is observed.

## Build/package versus Companion activation

`UPDATE_AND_RUN.bat` / `RUN.bat` validate and package the repository. They do not automatically activate the package in Companion.

The current Companion r9 instance has now been proven by the SAFE runner to be using **0.1.13**.

## Never reintroduce

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level write;
- Monitor gain item `1677` write/action/preset/raw-write access;
- unknown/unsafe raw writes;
- firmware/reset/restore/snapshot commands;
- optimistic feedback/state;
- hardcoded Focusrite Control Server port or device ID;
- writes before this module's own authorization is confirmed.

Monitor gain item `1677` remains **read-only**.

## Privacy

Never publish live Companion exports, serial, hostname, client key, server/client/device IDs, dynamic Focusrite server port, raw private XML/captures, private diagnostics or user-specific paths.

## Recommended next technical direction

Do **not** weaken the restore-safe rule just to turn the 18 skips green.

The next useful work is to investigate whether those 18 states can become server-confirmed **without the TestBench writing them and without inventing stale state**. Any proposal must preserve the cold-start evidence and safety contract. If no safe observation path exists, keep the latest result as `PASS 3 / SKIP 18` and treat the earlier guarded hardware tests as the evidence for the remaining write mappings.

After Core SAFE evidence is settled, the historical r9 **829 feedback-probe sweep** can be reconsidered as a separate read-only/full-matrix validation stage.

## Publication state

Do not change public module scope/name while Bitfocus's official repository/naming decision is pending. When the official repository exists, inspect its exact name/default branch/seed/permissions and follow its expected PR/CI workflow. Stable target remains v1.0.0 unless maintainers direct otherwise.
