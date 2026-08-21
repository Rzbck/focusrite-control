# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 15:58 Europe/Paris

This is the **living resume point** for the project. Future AI/contributors must read this file before proposing code, tests, branch changes or publication work, and must update it after every material validation/hardware result or change of objective.

## Project objective

Develop, validate, document and eventually publish a Bitfocus Companion module controlling Focusrite hardware through the local Focusrite Control Server protocol.

Current supported hardware is **ONLY Scarlett 18i20 (3rd Gen)**.

Current module development version: **0.1.13**.

Current working branch: **`testbench/v0.2-hardware-validation`**.

Official Bitfocus repository/module naming is still pending. Bryce Seifert suggested `focusrite-control` may be the eventual scope/name because the transport is Focusrite Control Server. Do not expand supported hardware or change public module scope until Bitfocus decides and real hardware testing supports it.

## Current validated software gate

Most recent user-shown complete Windows gate before the latest TestBench audit fix:

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

The latest TestBench audit fix adds two safety regressions, so the next full gate is expected to contain more than 35 tests. Do not claim the new count until `UPDATE_AND_RUN.bat` is run on Windows and the user provides the result.

## Existing Companion TestBench page — reuse it, do not replace it

The user already has the historical r9 full-matrix page in Companion:

- name: `Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`;
- marker: `TB-R9-ALL`;
- grid: 46 columns x 26 rows;
- current live export inspected on 2026-08-21 contained 1196 controls;
- historical r9.6 plan contained 829 feedback probes plus the Core hardware-control region.

The current live page was compared with the historical r9.6 page for the **42 SAFE Core setters** used by v0.2. Result: **42/42 signatures match, 0 differences** when ignoring runtime connection/action IDs.

Those 42 setters are:

- Air 1–8 explicit ON/OFF (16 buttons);
- Pad 1–8 explicit ON/OFF (16 buttons);
- Input 1 Line/Inst (2 buttons);
- Input 2 Line/Inst (2 buttons);
- Monitor Mute ON/OFF (2 buttons);
- Monitor Dim ON/OFF (2 buttons);
- Talkback ON/OFF (2 buttons).

Public canonical SAFE mapping is stored in:

- `testbench/Focusrite_18i20_SafeHardwarePlan.json`;
- `testbench/Focusrite_18i20_SafeHardwareTest.js`;
- `test/testbench-safety.test.js`.

**Do not commit the user's live `.companionconfig` export.** The live export contains private/user-specific connection configuration. Keep only sanitized structural facts/mappings in GitHub.

The temporary v0.2 A/B page generator was removed after comparison proved it duplicated the existing r9 Core page. Do not recreate or re-import A/B pages unless new evidence shows the r9 page is unavailable or structurally incompatible.

## Latest hardware-test attempt — PRE-WRITE ABORT

User ran `RUN_SAFE_HARDWARE_TESTS.cmd` after authorising the run.

Observed result:

`FAIL SAFE hardware runner :: r9 SAFE action-set mismatch at 0/0.`

Exit code: 2.

**No hardware write was attempted.** The failure occurred during the read-only page audit before the first button press.

Root cause was identified from the user's current Companion 5.0.3 page export:

- all 42 SAFE Core buttons have `action_sets.down = [exactly one action]`;
- all 42 also have normal Companion `action_sets.up = []`;
- the v0.2 audit incorrectly required the action-set object to contain only one key (`down`).

This was an audit bug, not a page mismatch.

Fix implemented in the working branch:

- require exactly one `down` action;
- allow any other action-set key only when its array is empty;
- reject any non-empty unexpected action set;
- regression tests lock this compatibility.

The user's 42 current Core buttons were checked against this rule and **42/42 pass**.

## Module-version guard — important next blocker

The user's live Companion page export inspected on 2026-08-21 referenced a Focusrite connection with `moduleVersionId: 0.1.12`.

The repository/package currently builds **0.1.13**.

Therefore a hardware run must NOT be accepted as v0.1.13 evidence unless Companion is actually running the same module version as `package.json`.

The SAFE runner now checks the selected live connection's `moduleVersionId` against `package.json.version` **before any hardware write**. A mismatch aborts the run.

Do not weaken or remove this check merely to get a green result. If Companion is still running 0.1.12, use the established Companion module-loading/update workflow to load 0.1.13, then rerun the read-only checks before the SAFE hardware test.

## SAFE hardware-run contract

The v0.2 runner must preserve all of these rules:

- exactly one Scarlett 18i20 (3rd Gen) module connection selected safely;
- Remote Devices authorization confirmed for this module client;
- existing r9 page audited before writes;
- never rely on raw Companion connection-ID equality across exports/API objects;
- no Toggle or Cycle for the SAFE run;
- read all initial states before the first write;
- unknown initial state => SKIP with no write;
- explicit target setter only;
- wait for server-confirmed target state;
- explicit restore to the original confirmed value;
- wait for server-confirmed restoration;
- restoration failure => HARD ABORT all remaining tests;
- no optimistic state;
- results remain local under `testbench/results/`.

## Cold-start state limitation — do not rediscover

Definitive cold-start result remains 3/21 values present:

Present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

A 404-item packet still omitted those missing values. Do not add subscribe loops, reconnect delays, write-to-warm behavior, stale persisted state presented as current, or an invented read/get command.

Explicit target writes remain allowed by the production state contract when connected/writable/authorised. State-derived operations require confirmed current state.

## Hardware evidence labels

Already hardware-tested from guarded prior work:

- Air 1–8 write paths;
- Pad 1–8 write paths;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback;
- dynamic discovery/TCP/auth/subscription/server-confirmed state.

Current v0.2 automated end-to-end run is **not yet complete**. Do not claim a new automated hardware PASS until the current runner executes and restores successfully on the physical device.

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
- writes before this module's own Remote Devices authorization is confirmed.

Monitor gain item `1677` remains **read-only**.

## Privacy

Never publish the user's live Companion export, serial, hostname, server/client/device IDs, client key, dynamic Focusrite server port, raw private XML/captures, diagnostics, or user-specific paths.

Historical/sanitized structural facts about the r9 page are allowed. Runtime private values are not.

## Immediate next sequence

1. User runs root `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation`.
2. Record the complete software-gate result in this file.
3. If the gate passes, run `testbench/RUN_SAFE_HARDWARE_TESTS.cmd`.
4. If the runner reports module-version mismatch, do not press hardware buttons manually to bypass it; first ensure Companion is actually running 0.1.13.
5. Once the version guard passes, run the 21 SAFE reversible tests and record PASS/FAIL/SKIP + restoration outcome.
6. Only after Core SAFE is clean, consider reactivating the historical r9 **829 feedback-probe sweep** as a separate read-only/full-matrix validation stage. Reuse the existing r9 page; do not invent another page unless needed.
7. Update this handoff after every material result.

## Publication state

Do not change public module scope/name while Bitfocus's official repository/naming decision is pending. When the official repository exists, inspect its exact name/default branch/seed/permissions and follow its expected PR/CI workflow. Stable target remains v1.0.0 unless maintainers direct otherwise.
