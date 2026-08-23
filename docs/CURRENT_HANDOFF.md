# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 11:38 Europe/Paris

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

A later V7 write-capable campaign on 2026-08-23 HARD ABORTED during Output 12 mute validation. Do **not** describe the live device as fully restored after that abort:

- the device-wide pair-topology sweep completed first and confirmed immediate exact restore for all 11 AVAILABLE/observable pairs;
- output mute probes reached Outputs 1–12; no earlier restore failure was reported before Output 12;
- Output 12 mute restore was **not confirmed** (`expected=true`, `observed=unknown`);
- the protective Monitor Mute phase had already run, and the HARD ABORT occurred before the normal end-of-campaign Monitor Mute restoration phase, so protective Monitor Mute may still be ON;
- later metadata/Core/output/mixer/manual phases did not run;
- the publisher skipped the incomplete/fatal report.

Keep downstream outputs physically isolated. **Do not rerun FULL or change Focusrite hardware/routing state until a deliberate live-state recovery/restart plan is agreed.** The TestBench fix for the unknown output-mute baseline has now passed the full software/package gate, but that does not prove the current live hardware state.

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

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd` runs `Focusrite_18i20_Preflight.ps1` before any `--allow-hardware-writes` command and blocks SAFE/FULL if the read-only preflight fails.

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

Latest PREP-only V7 pass generated Page 2 for harness signature `5cb79a9479127bdd` with 768 batches. It was imported/remapped before the first write-capable V7 attempt.

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

V7 is implemented and the post-abort TestBench safety fix is now **software-gate validated**, but the full write-capable V7 campaign is **not completed on hardware**. The first write-capable attempt HARD ABORTED as documented below.

Implemented V7 behavior includes:

- runtime pair topology is the source/stereo ownership oracle;
- a right member is marked pair-owned only from restored runtime topology evidence (`REQUESTED_ORIGINAL` + `ZERO_ORIGINAL` + exact restore);
- direct right-member source/stereo writes are skipped when runtime evidence proves pair ownership;
- pair safety does not retry an impossible both-member None guard after ownership proof;
- explicit `ALL_ISOLATED` allows reversible Core/mixer/lane/monitoring tests even when server-side global safety is incomplete;
- any unconfirmed restore under that isolated campaign is a HARD ABORT;
- `QUARANTINED_RESTORE` cannot be overwritten later by PASS/FAIL bookkeeping;
- reversible feedbacks are sampled during corresponding action transitions, including `mix_mute` and `mix_solo`;
- manual meter validation uses explicit `SILENT` then `SIGNAL` phases;
- Monitor gain 1677 remains read-only;
- no direct Focusrite TCP write path was added by V7.

### V7 unknown output-mute baseline fix after first HARD ABORT

The first write-capable V7 attempt exposed a safety/model defect in `probeOutputMutes`:

- an output mute variable could exist while its initial server value was blank/unknown;
- old code converted that unknown baseline to a protective `Mute ON` baseline;
- under `ALL_ISOLATED`, the same path then required `restore=true` as though `true` had been the exact original state;
- that violates the V7 rule that a reversible write under physical isolation requires a known exact original state.

Output 12 is S/PDIF 2 in the documented 18i20 schema. The abort occurred there with `target output 12 produced no independently observable mute cycle; target mute restore expected=true observed=unknown`.

TestBench fix checked in:

- `FullTestBenchOutputsV4.js`: under exact-restore / `ALL_ISOLATED` mode, an output mute with an unknown initial value is now `EVAL_ONLY` and receives **no mute write**;
- non-isolated legacy protective-baseline behavior remains unchanged;
- `test/full-testbench-v7-runtime-ownership.test.js` contains a regression contract for this no-write rule.

Commits:

- `66a3747a001f24ed4bcbf3f3c9526f003ea9168d` — TestBench safety fix;
- `d907880f0685d1cc5ad0396a930b1eae66ecccc4` — V7 regression coverage.

The fix is now covered by the completed 117/117 Windows software gate below.

## Completed whole-repository Windows software gate — PASS after abort fix — 2026-08-23

The user reran root `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation` after commits `66a3747a` + `d907880f` and obtained:

- Node 22.23.2;
- Yarn 4.17.0 via Corepack;
- dependencies / immutable lockfile PASS;
- Prettier PASS (`All matched files use Prettier code style!`);
- ESLint PASS;
- source manifest PASS (`Source manifest validation: OK`);
- **117 tests / 117 PASS / 0 FAIL / 0 skipped**;
- regression `V7 skips unknown output mute baselines when exact restoration is mandatory` PASS;
- Companion package build PASS;
- local package `focusrite-scarlett-18i20-0.1.13.tgz`;
- final status `UPDATE_AND_RUN TERMINE AVEC SUCCES`.

This is the current clean software/package gate for the validation branch. The TestBench-only fix does not require importing a different production module version; production `src/` remains unchanged.

## V7 hardware PREP-only pass — 2026-08-23

The user launched root `RUN_TESTBENCH.bat`, selected FULL, passed the mandatory read-only Remote Devices preflight, and entered `ALL_ISOLATED` locally.

Observed pre-write state:

- r9 audit PASS: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module version PASS: 0.1.13;
- exact Scarlett 18i20 (3rd Gen) hardware profile + module-client authorization PASS;
- live shape PASS: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability: 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN / 0 NO_FLAG;
- generated Page 2 harness signature `5cb79a9479127bdd`;
- generated harness batches: 768.

The runner returned `PREP REQUIRED` / exit code 6. No hardware write occurred on that PREP pass. The user then imported/remapped the generated Page 2 to the existing Focusrite connection.

## First write-capable FULL V7 attempt — HARD ABORT — 2026-08-23

The next root `RUN_TESTBENCH.bat` FULL run passed authorization/preflight and accepted `ALL_ISOLATED`.

Observed sequence:

- r9 audit PASS;
- module 0.1.13 PASS;
- hardware profile/authorization PASS;
- live shape 8 / 26 / 24 / 12 PASS;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- Page 2 harness signature `5cb79a9479127bdd` PASS;
- feedback-before: **161 PASS / 668 EVAL_ONLY / 0 FAIL** across 829 probes;
- protective Monitor Mute phase ran;
- device-wide topology sweep: **11 pairs exercised with immediate exact restore**, ownership derived for 11 right members;
- output mute phase progressed through Out 12;
- HARD ABORT at Out 12: `RESTORE FAILED: output:12:mute; target output 12 produced no independently observable mute cycle; target mute restore expected=true observed=unknown`;
- publisher correctly skipped because the report was incomplete/fatal;
- exit code **4**.

Do not treat this as a completed V7 hardware campaign and do not publish it as successful hardware evidence.

## Production module state

Production `src/` has not changed during the V5/V6/V7 TestBench work or the 2026-08-23 Remote Devices/launcher/abort-fix work.

Current package version remains **0.1.13**.

Current production `output_pair_source` still requests source `0` on both pair members for Pair Source=None. Do not translate V6/V7 TestBench findings into production semantics until the new device-wide V7 hardware evidence is complete and intentionally reviewed.

The production authorization path remains: stable persisted private identity, own server-client-ID approval matching, writes blocked until authorised, server-confirmed feedback/state only.

## Required next sequence

1. **Do not rerun SAFE/FULL yet. Keep physical output isolation in place.** Live Output 12 / S/PDIF 2 mute state is unconfirmed and protective Monitor Mute may still be ON after the abort.
2. The post-abort TestBench fix is now software-gate clean: **117/117 tests PASS**, package build PASS.
3. Perform a **read-only visual live-state check in Focusrite Control first**. Do not click/change anything yet: inspect whether global Monitor Mute is currently active and, if the UI exposes it, the current S/PDIF 2 mute state.
4. Restore/confirm the normal saved Focusrite configuration only with explicit user agreement. Do not assume the HARD ABORT restored Output 12 or Monitor Mute.
5. Before any later write-capable run, reconfirm the existing `Companion Scarlett 18i20` Remote Devices client is approved, reuse the same Companion connection, and ensure no direct research probe is running.
6. After live-state recovery is explicitly agreed and complete, renew physical isolation and local `ALL_ISOLATED` confirmation.
7. Rerun FULL V7 only after the live state is understood/restored. If the snapshot changes, accept a new PREP-only Page 2 refresh rather than forcing the old harness.
8. HARD ABORT immediately on any future unconfirmed restoration. Do not blind-rerun after an abort.
9. Preserve V6 as historical completed hardware evidence and publish only sanitized completed V7 results.
10. After completed V7 evidence, review what should actually change in production `src/`; do not automatically copy TestBench assumptions into the public module.
11. Keep public support scope at Scarlett 18i20 (3rd Gen) until other devices are physically validated and the official Bitfocus repository/name decision is made.
