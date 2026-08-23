# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 11:29 Europe/Paris

Read `AI_PROJECT_RULES.md` and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current checked-in code override older assumptions.

Also read `docs/REMOTE_DEVICES_AUTHORIZATION.md` before diagnosing any write failure or launching a hardware campaign.

## Scope / publication

- Hardware support actually validated remains **Focusrite Scarlett 18i20 (3rd Gen) only**.
- Module/package development version remains **0.1.13**.
- Working branch: `testbench/v0.2-hardware-validation`.
- Official Bitfocus repository/name remains pending; Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Capability/profile-driven architecture is not a broader hardware-support claim.
- Unknown/unvalidated Focusrite models remain read-only discovery/research only; writes require explicit hardware-tested/write-enabled profile evidence.
- Stable public release target remains v1.0.0 after official repository/naming, CI and hardware/action audit.

## Current live hardware state

The user explicitly restored the normal saved Focusrite configuration after the V6 campaign. Therefore V5/V6 Source=None and restore quarantines are **historical campaign evidence**, not the current live device state.

No hardware write was performed during the V7 software work, Remote Devices documentation/preflight work, Prettier diagnosis, the successful software gate, or the latest V7 PREP-only harness-refresh pass described below.

## Remote Devices authorization — mandatory preflight

Before any SAFE, FULL, targeted or manual phase that may write:

1. **Reuse the existing Companion Focusrite connection. Do not delete/recreate it between builds or tests unless a new identity is intentionally required.**
2. Open **Focusrite Control → Device Settings → Remote Devices**.
3. Find the existing Companion client, normally shown as **`Companion Scarlett 18i20`**.
4. Click **Approve** if needed. If the UI shows **Reject**, that client is already approved.
5. Run the read-only preflight and require this module's own authorization state to be confirmed before any write phase.

If authorization is missing, stop and classify the run as **AUTHORIZATION/PREFLIGHT BLOCKED**, not as a hardware/control failure.

Current production code persists the private client identity in the Companion connection and matches approval only to the module's own server-assigned client ID. Never publish, print or log the private `clientId` / `client-key`.

Historical `Focusrite ReadOnly State Probe` clients came from the isolated `debug/cold-start-readback` research work. They do **not** need approval for normal SAFE/FULL work.

**Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE/FULL/write-capable TestBench campaign.**

Canonical normal path:

`TestBench → Companion HTTP/API/buttons → existing approved Companion Scarlett 18i20 connection → Focusrite Control Server → Scarlett`

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd` now runs `Focusrite_18i20_Preflight.ps1` before any `--allow-hardware-writes` command and blocks SAFE/FULL if the read-only preflight fails.

## Permanent safety / privacy rules

Never invent or expose analogue input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, physical Monitor level control, arbitrary raw writes, firmware/reset/restore/snapshot commands, or writes to read-only status/meter items.

Monitor gain item **1677 remains read-only**. Physical movement may be observed; there must be no Monitor set/adjust action, preset, or raw-write path without new hardware proof.

Also preserve:

- dynamic Focusrite Control Server port/device ID; never hardcode active runtime values;
- writes blocked until Remote Devices authorization matches this module's own server-assigned client ID;
- feedback/state only from server-confirmed state, never optimistic success;
- availability `UNKNOWN` = no write;
- no public serial/hostname/client key/client or device IDs/raw XML/private captures/private Companion export/local diagnostics/user paths;
- relevant MIT/third-party attribution;
- public Bitfocus source clean; local Windows/TestBench tooling remains separate from production behavior.

## Canonical TestBench surfaces

### Page 1 — live r9

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

- 46×26 / 1196 controls;
- 42 SAFE setters;
- 829 logical feedback probes / 31 definitions;
- normal T + inverted F pairs;
- feedback cells contain zero actions.

Never publish the live page.

### Page 2 — private generated capability harness

`testbench/generated/FULL_EXTENDED.companionconfig`

Snapshot-specific and Git-ignored/private. If the current snapshot/harness signature no longer matches, FULL must request a new page-2 import before hardware writes.

Latest PREP-only V7 pass generated the current Page 2 for harness signature `5cb79a9479127bdd` with 768 batches. Replace **only Page 2** and remap `FOCUSRITE TESTBENCH TARGET` to the existing approved Focusrite Companion connection. Do not replace the live r9 Page 1 and do not create a new Focusrite connection/client identity.

## Cold-start / SAFE evidence

Core cold-start remains 3/21 present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim remain absent at cold start. Latest automated SAFE evidence remains 3 PASS / 0 FAIL / 18 SKIP. Earlier guarded work separately validated all 21 Core write paths.

Never warm state by writing or invent missing state merely to make SAFE complete.

## Latest completed hardware campaign — FULL V6 — 2026-08-22

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V6.md`.

Canonical sanitized result: `docs/hardware-results/LATEST_SHAREABLE.json`.

V6 revision: `full-v6-device-wide-topology-feedback-20260822`.

Preflight was valid for V6: r9 audit PASS, module 0.1.13 PASS, exact 18i20 Gen 3 profile + own authorization PASS, shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes, output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN, and explicit `ALL_ISOLATED` confirmation.

Eleven AVAILABLE/observable output pairs were exercised. Every exercised pair showed server-confirmed `REQUESTED_ORIGINAL` for route and `ZERO_ORIGINAL` for Pair Source=None, with exact original pair restoration confirmed through the pair action path. Pairs 21–22 and 23–24 were availability UNKNOWN and received no topology write.

Hardware-tested interpretation for this Scarlett 18i20 (3rd Gen) state/configuration: the exercised pair operations did not behave like two independently writable source controls; the left member changed while the right member remained on its original server-reported source. Do not generalize this result to other Focusrite models.

V6 still had `globalSignalPathSafety = false` with Source=None blockers on Outputs 4, 6, 8 and 10. Later V6 logic also produced 13 restore quarantines on pair-owned/right-member source/stereo rows even though topology restoration had succeeded earlier. Output mute behavior proved unsuitable as an ownership oracle.

V6 feedback static sweeps showed no rendered/server mismatch but did not dynamically exercise all 829 probes. The old generic manual meter observer reported 0/46 both-state coverage. Monitor gain 1677 movement was observable read-only but exact physical return to the identical starting value was not confirmed; it remains `MANUAL_PENDING`.

## Current TestBench revision — FULL V7

Current revision in `FullTestBenchRunnerV4.js`:

`full-v7-runtime-ownership-isolated-feedback-20260822`

V7 is **implemented and software-gate validated**, but the full write-capable V7 campaign is **not yet completed on hardware**.

Implemented V7 changes include:

- runtime pair topology is the ownership oracle;
- a right member is marked pair-owned only from restored runtime topology evidence (`REQUESTED_ORIGINAL` + `ZERO_ORIGINAL` + exact restore);
- direct right-member source/stereo writes are skipped when runtime evidence proves pair ownership;
- pair safety does not retry an impossible both-member None guard after ownership proof;
- explicit `ALL_ISOLATED` allows reversible Core/mixer/lane/monitoring tests even when server-side global safety is incomplete;
- any unconfirmed restore under that isolated campaign is a HARD ABORT;
- `QUARANTINED_RESTORE` cannot be overwritten later by PASS/FAIL bookkeeping;
- reversible feedbacks are sampled during the corresponding action transitions, including `mix_mute` and `mix_solo`;
- manual meter validation uses explicit `SILENT` then `SIGNAL` phases;
- Monitor gain 1677 remains read-only;
- no direct Focusrite TCP write path was added by V7.

## Completed whole-repository Windows software gate — PASS — 2026-08-23

The user ran `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation` after the V7, Remote Devices, launcher-preflight, and formatting fixes.

Validated result:

- Node 22.23.2;
- Yarn 4.17.0 via Corepack;
- dependencies / immutable lockfile PASS;
- Prettier PASS (`All matched files use Prettier code style!`);
- ESLint PASS;
- source manifest PASS (`Source manifest validation: OK`);
- **116 tests / 116 PASS / 0 FAIL / 0 skipped**;
- Companion package build PASS;
- package produced locally: `focusrite-scarlett-18i20-0.1.13.tgz`;
- final launcher status: `UPDATE_AND_RUN TERMINE AVEC SUCCES`.

This is the required clean software/package gate for the current V7 branch. Do not describe the branch as software-gate pending anymore.

The package was built locally by the gate; this result alone does **not** mean it was imported/activated in Companion and does not constitute hardware validation.

A temporary formatting diagnostic was added to `RUN.bat` while resolving the gate. The actual lockfile resolves `prettier@3.9.6` from the `^3.8.3` package range; the final V7 regression file now matches the formatter exactly. This diagnostic work changed no production hardware behavior.

## V7 hardware PREP-only pass — 2026-08-23

The user launched the root `RUN_TESTBENCH.bat`, selected FULL, passed the mandatory read-only Remote Devices preflight, and entered `ALL_ISOLATED` locally.

Observed pre-write state:

- r9 audit PASS: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module version PASS: 0.1.13;
- exact Scarlett 18i20 (3rd Gen) hardware profile + module-client authorization PASS;
- live shape PASS: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability: 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN / 0 NO_FLAG;
- current generated Page 2 harness signature: `5cb79a9479127bdd`;
- current generated harness batches: 768.

The runner returned `PREP REQUIRED` / exit code 6 because the current generated Page 2 must be imported/remapped before the V7 write campaign can begin. The report publisher correctly skipped publication because the PREP report was sanitized but incomplete.

**No hardware write occurred on this PREP pass.**

## Production module state

Production `src/` has not changed during the V5/V6/V7 TestBench work or the 2026-08-23 Remote Devices/launcher work.

Current package version remains **0.1.13**.

Current production `output_pair_source` still requests source `0` on both pair members for Pair Source=None. Do not translate V6/V7 TestBench findings into production semantics until the new device-wide V7 hardware evidence is complete and intentionally reviewed.

The production authorization path remains: stable persisted private identity, own server-client-ID approval matching, writes blocked until authorised, server-confirmed feedback/state only.

## Required next sequence

1. **Software gate is green. Latest completed hardware evidence remains V6. V7 PREP-only pass is complete with no hardware write.**
2. In Companion, replace/import **only Page 2** using the locally generated `testbench/generated/FULL_EXTENDED.companionconfig` from the latest PREP pass.
3. Remap `FOCUSRITE TESTBENCH TARGET` on that imported Page 2 to the **existing approved Focusrite Companion connection**. Do not delete/recreate the Focusrite connection and do not replace the live r9 Page 1.
4. Keep the same physical isolation conditions (`ALL_ISOLATED`) and ensure no direct read-only research probe is running.
5. Rerun the root **`RUN_TESTBENCH.bat`**, select FULL, require the read-only preflight to PASS again, and enter `ALL_ISOLATED` locally only while isolation remains true.
6. If another PREP-only stop occurs because the snapshot changed, stop again; do not force the campaign.
7. Once the harness signature matches, allow the current FULL V7 campaign to proceed and follow the guided manual `SILENT`, `SIGNAL`, and Monitor 1677 read-only phases.
8. HARD ABORT immediately on any unconfirmed restoration. Do not rerun after a HARD ABORT until the failure is diagnosed and live state is understood.
9. Preserve V6 as historical hardware evidence and publish only sanitized completed V7 results.
10. After V7 hardware evidence is complete, review what should actually change in production `src/`; do not automatically copy TestBench assumptions into the public module.
11. Keep public support scope at Scarlett 18i20 (3rd Gen) until other devices are physically validated and the official Bitfocus repository/name decision is made.
