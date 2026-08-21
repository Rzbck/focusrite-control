# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 16:21 Europe/Paris

This is the **living resume point** for the project. Future AI/contributors must read this file before proposing code, tests, branch changes or publication work, and must update it after every material validation/hardware result or change of objective.

## Project objective

Develop, validate, document and eventually publish a Bitfocus Companion module controlling Focusrite hardware through the local Focusrite Control Server protocol.

Current supported hardware is **ONLY Scarlett 18i20 (3rd Gen)**.

Current repository/module development version: **0.1.13**.

Current working branch: **`testbench/v0.2-hardware-validation`**.

Official Bitfocus repository/module naming is still pending. Bryce Seifert suggested `focusrite-control` may be the eventual scope/name because the transport is Focusrite Control Server. Do not expand supported hardware or change public module scope until Bitfocus decides and real hardware testing supports it.

## Immediate state — read this first

The TestBench infrastructure is now correctly identifying the real blocker:

- existing Companion r9 page audit: **PASS, 42/42 explicit SAFE setters verified**;
- exact r9 page: `Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`;
- repository/package version expected by the runner: **0.1.13**;
- module version actually referenced by the live r9 Focusrite instance: **0.1.12**;
- latest SAFE run stopped **before the first hardware write**;
- latest exit code: `2`;
- current blocker is therefore **Companion module activation/version selection**, not Focusrite hardware and not the r9 button map.

Do **not** rerun the same hardware test expecting a different result until Companion is actually using 0.1.13.

## Build/package is not activation

`UPDATE_AND_RUN.bat` / `RUN.bat` validate the repository and run `companion-module-build`. They produce the package:

`focusrite-scarlett-18i20-0.1.13.tgz`

They do **not** automatically install that package into Companion and do **not** switch an existing Companion connection from 0.1.12 to 0.1.13.

For the current blocker, use Companion's normal local module workflow:

1. Companion → **Modules** → **Import module package**;
2. select `focusrite-scarlett-18i20-0.1.13.tgz` from the repository root;
3. Companion → **Connections** → edit the existing Focusrite connection;
4. change **Module Version** to `0.1.13` and apply;
5. if the module/client restarts, re-confirm Focusrite Remote Devices authorization if Focusrite asks;
6. rerun `testbench/RUN_PREFLIGHT.cmd`;
7. only after preflight PASS, rerun `testbench/RUN_SAFE_HARDWARE_TESTS.cmd` and type `SAFE`.

Do not automate this through undocumented/internal Companion APIs merely to avoid the supported UI step. Do not update Focusrite Control software, firmware, routing or hardware settings as part of this version change.

## Current validated software gate

Most recent user-shown complete Windows gate before the newest TestBench/documentation changes:

- branch: `testbench/v0.2-hardware-validation`;
- Node portable: 22.23.2;
- Yarn: 4.17.0;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **35/35 PASS**;
- Companion package: PASS;
- package artifact: `focusrite-scarlett-18i20-0.1.13.tgz`;
- hardware writes during this software gate: none.

The TestBench safety suite changed after that run. Do not claim a newer exact test count until a complete `UPDATE_AND_RUN.bat` output is observed.

## Existing Companion TestBench page — reuse it

The user already has the historical r9 full-matrix page in Companion:

- name: `Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`;
- marker: `TB-R9-ALL`;
- grid: 46 columns × 26 rows;
- inspected live export contained 1196 controls;
- historical r9.6 plan contained 829 feedback probes plus the Core hardware-control region.

The current live page was compared with the historical r9.6 page for the **42 SAFE Core setters** used by v0.2. Result: **42/42 action/option signatures match, 0 functional differences** when runtime IDs are ignored.

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

The temporary v0.2 A/B page generator was removed because it duplicated this existing r9 Core page. Do not recreate or re-import those A/B pages without new evidence.

**Never commit the user's live `.companionconfig` export.** It contains user-specific/private connection configuration. Keep only sanitized structural facts in GitHub.

## SAFE attempt history

### Attempt 1 — read-only r9 action-set audit bug

Observed:

`FAIL SAFE hardware runner :: r9 SAFE action-set mismatch at 0/0.`

Cause: Companion 5.0.3 normally stores the button with one `down` action and an empty `up: []`. The first audit incorrectly rejected the empty `up` set.

Fix: require exactly one `down` action; allow other action sets only when empty; reject any extra non-empty action set.

Result after fix: the user's 42 Core controls satisfy the corrected rule.

**Hardware writes: none.**

### Attempt 2 — module-version source bug

Observed:

- `PASS Existing r9 TestBench page :: 42 explicit SAFE setters verified; no page import required.`
- `FAIL ... expected 0.1.13, got unknown.`

Cause: legacy `GET /api/connections` does not expose `moduleVersionId`.

Fix: obtain the version from the exact audited r9 instance referenced by the 42 SAFE controls, not from the public connections list.

**Hardware writes: none.**

### Attempt 3 — current confirmed blocker

Observed:

- `PASS Existing r9 TestBench page :: 42 explicit SAFE setters verified; no page import required.`
- `FAIL SAFE hardware runner :: Loaded Focusrite Companion module version mismatch: expected 0.1.13, got 0.1.12.`
- exit code: `2`.

This is a **real version mismatch**, not another runner bug. The version guard is working and must remain.

**Hardware writes: none.**

Do not accept 0.1.12 hardware results as v0.1.13 evidence.

## SAFE hardware-run contract

Preserve all of these rules:

- exactly Scarlett 18i20 (3rd Gen);
- existing r9 page audited before writes;
- exactly 42 approved SAFE setters verified;
- audited r9 instance module version must match `package.json.version`;
- select the live Focusrite connection without assuming raw Companion IDs are equal across export/API objects;
- module's own Focusrite Control Server client must be authorized;
- no Toggle or Cycle in the SAFE run;
- read all initial states before the first write;
- unknown initial state → SKIP, no write;
- explicit target setter only;
- wait for server-confirmed target state;
- explicit restore to original confirmed state;
- wait for server-confirmed restoration;
- restoration failure → HARD ABORT all remaining tests;
- no optimistic state;
- results stay local under ignored `testbench/results/`.

## Cold-start limitation — definitive, do not rediscover

Cold-start state result remains **3/21 present**.

Present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

A 404-item state packet still omitted the missing 18 values. Do not add subscribe loops, reconnect delays, write-to-warm behavior, stale persisted state presented as current, or an invented read/get command.

Explicit target writes remain allowed by the production state contract when connected/writable/authorized. State-derived operations require confirmed current state.

## Hardware evidence labels

Already hardware-tested from guarded prior work:

- Air 1–8 write paths;
- Pad 1–8 write paths;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback;
- dynamic discovery/TCP/auth/subscription/server-confirmed state.

The current **v0.1.13 automated end-to-end SAFE run is not yet complete**. Do not claim it passed until Companion is actually running 0.1.13 and the runner completes change + restoration on the physical device.

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

## Immediate next sequence

1. Ensure the local repository has the current `testbench/v0.2-hardware-validation` branch and a clean `UPDATE_AND_RUN.bat` result.
2. In Companion, import `focusrite-scarlett-18i20-0.1.13.tgz` from **Modules → Import module package**.
3. In **Connections**, switch the existing Focusrite connection's **Module Version** to `0.1.13`.
4. Rerun `RUN_PREFLIGHT.cmd`; if Remote Devices approval is requested again, approve only this module's own client and verify preflight PASS.
5. Rerun `RUN_SAFE_HARDWARE_TESTS.cmd` and record PASS/FAIL/SKIP/restoration outcome.
6. Update this handoff immediately with that result.
7. Only after Core SAFE is clean, consider reactivating the historical r9 **829 feedback-probe sweep** as a separate read-only validation stage.

## Publication state

Do not change public module scope/name while Bitfocus's official repository/naming decision is pending. When the official repository exists, inspect its exact name/default branch/seed/permissions and follow its expected PR/CI workflow. Stable target remains v1.0.0 unless maintainers direct otherwise.
