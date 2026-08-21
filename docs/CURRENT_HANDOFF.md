# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 16:37 Europe/Paris

This is the **living resume point** for the project. Future AI/contributors must read this file before proposing code, tests, branch changes or publication work, and must update it after every material validation/hardware result or change of objective.

## Project objective

Develop, validate, document and eventually publish a Bitfocus Companion module controlling Focusrite hardware through the local Focusrite Control Server protocol.

Current supported hardware is **ONLY Scarlett 18i20 (3rd Gen)**.

Current repository/module development version: **0.1.13**.

Current working branch: **`testbench/v0.2-hardware-validation`**.

Official Bitfocus repository/module naming is still pending. Bryce Seifert suggested `focusrite-control` may be the eventual scope/name because the transport is Focusrite Control Server. Do not expand supported hardware or change public module scope until Bitfocus decides and real hardware testing supports it.

## Immediate state — read this first

The user has now completed the Companion module-loading/version-selection step and rerun the read-only preflight.

Latest user-shown preflight result:

- Companion local web service: **PASS**;
- Companion HTTP API: **PASS**;
- Focusrite module connection found: **PASS**, `moduleId=focusrite-scarlett-18i20`;
- exact hardware model: **PASS**, `Scarlett 18i20 (3rd Gen)`;
- Focusrite client authorization: **PASS**;
- module connection status: **PASS**, `Connected / authorised`;
- exit code: **0**;
- hardware writes during preflight: **none**.

Important: this preflight intentionally does **not** expose or validate `moduleVersionId`. Therefore do **not** claim that Companion is confirmed on 0.1.13 from the preflight alone. The next SAFE runner must still verify that the exact audited r9 instance reports **0.1.13** before the first hardware write.

### Immediate next action

Run:

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd`

Type `SAFE` when prompted.

Expected pre-write sequence:

1. existing r9 page audit must PASS with **42/42 explicit SAFE setters**;
2. audited r9 Focusrite instance must report **module version 0.1.13**;
3. client/model/authorization safety checks must remain clean;
4. only then may the 21 reversible SAFE hardware tests begin.

If the version guard still reports 0.1.12, stop and diagnose Companion module activation; do not weaken the guard and do not perform manual bypass writes.

## Build/package versus Companion activation

`UPDATE_AND_RUN.bat` / `RUN.bat` validate the repository and run `companion-module-build`. They produce:

`focusrite-scarlett-18i20-0.1.13.tgz`

They do **not** automatically install that package into Companion and do **not** automatically switch an existing connection to that version.

The supported local workflow is:

1. Companion → **Modules** → **Import module package**;
2. select `focusrite-scarlett-18i20-0.1.13.tgz`;
3. Companion → **Connections** → edit the existing Focusrite connection;
4. set **Module Version** to `0.1.13` and apply;
5. re-confirm Focusrite Remote Devices authorization only if Focusrite requests it;
6. rerun `RUN_PREFLIGHT.cmd`;
7. then run the SAFE hardware runner.

Do not automate module import through undocumented/internal Companion APIs merely to avoid the supported UI step. Do not update Focusrite Control software, firmware, routing or hardware settings as part of this version change.

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
- package artifact: `focusrite-scarlett-18i20-0.1.13.tgz`;
- hardware writes during this software gate: none.

Do not claim a newer exact test count until a complete newer `UPDATE_AND_RUN.bat` output is observed.

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

### Attempt 3 — real 0.1.12 versus 0.1.13 mismatch

Observed:

- `PASS Existing r9 TestBench page :: 42 explicit SAFE setters verified; no page import required.`
- `FAIL SAFE hardware runner :: Loaded Focusrite Companion module version mismatch: expected 0.1.13, got 0.1.12.`
- exit code: `2`.

This proved the version guard was working. The user then imported/selected the 0.1.13 build in Companion and obtained the latest read-only preflight PASS recorded above. The SAFE runner has **not yet** reconfirmed the exact audited r9 instance version after that change.

**Hardware writes in attempt 3: none.**

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

The current **v0.1.13 automated end-to-end SAFE run is not yet complete**. Do not claim it passed until the SAFE runner confirms 0.1.13 and completes change + restoration on the physical device.

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

## Publication state

Do not change public module scope/name while Bitfocus's official repository/naming decision is pending. When the official repository exists, inspect its exact name/default branch/seed/permissions and follow its expected PR/CI workflow. Stable target remains v1.0.0 unless maintainers direct otherwise.
