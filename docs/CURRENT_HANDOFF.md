# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 — V7 resilience / RESUME / Page 2 automation chantier

Read `AI_PROJECT_RULES.md`, `docs/REMOTE_DEVICES_AUTHORIZATION.md`, and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current checked-in code override older assumptions.

## Scope / publication

- Hardware support actually validated remains **Focusrite Scarlett 18i20 (3rd Gen) only**.
- Module/package development version remains **0.1.13**.
- Working branch: `testbench/v0.2-hardware-validation`.
- Official Bitfocus repository/name remains pending; Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Capability/profile-driven architecture is not a broader hardware-support claim.
- Unknown/unvalidated Focusrite models remain read-only discovery/research only; writes require explicit hardware-tested/write-enabled profile evidence.
- Stable public release target remains v1.0.0 after official repository/naming, CI and hardware/action audit.

## Remote Devices authorization — mandatory preflight

Before any SAFE, FULL, RESUME, targeted or manual phase that may write:

1. **Reuse the existing Companion Focusrite connection.** Do not delete/recreate it between builds or tests unless a new identity is intentionally required.
2. Open **Focusrite Control → Device Settings → Remote Devices**.
3. Find the existing Companion client, normally shown as **`Companion Scarlett 18i20`**.
4. Click **Approve** if needed. If the UI shows **Reject**, that client is already approved.
5. Run the read-only preflight and require this module's own authorization state to be confirmed before any write phase.

If authorization is missing, stop and classify the run as **AUTHORIZATION/PREFLIGHT BLOCKED**, not as a hardware/control failure.

Current production code persists the private client identity in the Companion connection and matches approval only to the module's own server-assigned client ID. Never publish, print or log the private `clientId` / `client-key`.

Historical `Focusrite ReadOnly State Probe` clients came from isolated research work. They do not need approval for normal SAFE/FULL/RESUME work.

**Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE/FULL/RESUME/write-capable TestBench campaign.**

Canonical normal path:

`TestBench → Companion HTTP/API/buttons → existing approved Companion Scarlett 18i20 connection → Focusrite Control Server → Scarlett`

Root user launcher: `RUN_TESTBENCH.bat`, which delegates to `testbench/RUN_SAFE_HARDWARE_TESTS.cmd`. The launcher runs `Focusrite_18i20_Preflight.ps1` before any `--allow-hardware-writes` command and again after an automatic Page 2 replacement before hardware resumes.

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

Snapshot-specific and Git-ignored/private. If the current snapshot/harness signature no longer matches, FULL/RESUME must prepare a new Page 2 before hardware writes continue.

Latest hardware attempt used Page 2 signature `e2e9e5352478db39` with 768 audited controls/batches.

## Page 2 automatic replacement — implemented, software/live validation pending

The user requested eliminating repeated manual Page 2 import/remap work. The implementation now follows the actual Bitfocus Companion 5.0.3 import workflow rather than guessing an endpoint.

Reference behavior verified from upstream Companion source:

- Web UI uses local tRPC WebSocket `/trpc`;
- upload preparation uses `importExport.prepareImport.start`, `uploadChunk`, and `complete`;
- page replacement uses `importExport.importSinglePage` with `sourcePage`, `targetPage`, and `connectionIdRemapping`;
- the generated Focusrite reference can therefore be explicitly mapped to the existing approved Companion Focusrite connection.

Implemented in `testbench/FullTestBenchCompanionImportV7.js` and launcher integration:

- a normal `PREP REQUIRED` still occurs before any hardware write;
- launcher asks for the explicit token **`PAGE2_AUTO`** before changing Companion;
- only existing **Page 2** may be replaced; the helper refuses to create/reorder pages;
- Page 1 r9 must remain unchanged;
- generated `FOCUSRITE TESTBENCH TARGET` is remapped to the **existing Focusrite connection**;
- no Focusrite button is pressed and no Focusrite hardware write is sent by Page 2 replacement;
- all pages except Page 2 are hashed before/after and must remain unchanged;
- Companion connection ID set must remain unchanged, preventing silent connection creation/deletion;
- `auditExtendedPageV4` must find the exact generated harness on Page 2 and mapped to the same existing Focusrite connection;
- after successful replacement, the read-only authorization preflight is run again;
- the hardware runner is retried automatically **once**; a second `PREP REQUIRED` fails closed rather than looping.

The import sequence is informed by Bitfocus Companion MIT-licensed source; `THIRD_PARTY_NOTICES.md` records that reference.

**Status:** implemented in code/tests, but not yet validated by the user's Windows software gate or against the live Companion instance. Do not claim it hardware/live-tested yet.

## Diagnostic RESUME — implemented, validation pending

The user requested a resilient development workflow that does not repeat every already-cleared phase after each TestBench defect.

`RUN_TESTBENCH.bat` / `RUN_SAFE_HARDWARE_TESTS.cmd` now expose a separate **RESUME** mode.

RESUME is deliberately not a substitute for FULL:

- same Scarlett 18i20 (3rd Gen) development device only;
- read-only authorization preflight remains mandatory;
- fresh live snapshot and output availability remain mandatory;
- physical `ALL_ISOLATED` confirmation remains mandatory;
- protective Monitor guard when exactly restorable, device-wide pair topology, output mute probing, output safety and pair guards are rerun before resumed functional phases;
- exact-restore filtering and HARD ABORT behavior remain active;
- the last useful private HARD ABORT/quarantine report determines the major resume phase automatically;
- newer PREP-only private reports are ignored as resume anchors;
- static 829-probe before/after sweeps and pre-target metadata/Core are skipped on RESUME to save development time;
- manual meter/Monitor prompts are not required in RESUME; final FULL will perform them;
- skipped earlier capability rows remain `EVAL_ONLY` for that diagnostic run;
- a completed RESUME report is intentionally `meta.completed=false` with reason `diagnostic-resume-completed`;
- RESUME never invokes the shareable publisher and can never replace final FULL evidence.

**Final validation and every newly tested hardware model must run FULL from zero.** A future different Focusrite interface never inherits Scarlett 18i20 results merely because the protocol/schema looks similar.

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

Key V6 evidence:

- 11 AVAILABLE/observable pairs exercised;
- each exercised pair showed `REQUESTED_ORIGINAL` routing and `ZERO_ORIGINAL` Pair Source=None behavior;
- exact original pair restoration was confirmed;
- pairs 21–22 and 23–24 were availability UNKNOWN and received no topology write;
- output mute behavior was not a reliable ownership oracle;
- global server-side signal-path safety remained incomplete;
- V6 later produced restore quarantines on pair-owned/right-member rows due the older model;
- Monitor gain 1677 remained read-only/manual-pending.

Preserve V6 as historical completed hardware evidence. Do not generalize pair behavior to other Focusrite models.

## Current TestBench revision — resilient FULL V7

Current revision in `FullTestBenchRunnerV4.js`:

`full-v7-resilient-resume-autopage2-20260823`

The complete write-capable V7 campaign has **not completed on hardware**.

Implemented current behavior includes:

- runtime restored pair topology is the source ownership oracle;
- right-member direct source/stereo writes are skipped when runtime ownership proves pair ownership;
- output mute behavior is not used as the ownership oracle;
- pair safety does not retry an impossible both-member None guard after ownership proof;
- explicit `ALL_ISOLATED` allows reversible families despite incomplete global server-side safety;
- unknown/unrestorable baselines are non-writing `EVAL_ONLY`, never synthetic restore values;
- grouped mixer-lane families are skipped as a unit if any member lacks an exact restorable baseline;
- known-state restore failure remains a HARD ABORT;
- `QUARANTINED_RESTORE` cannot be overwritten later;
- restore failures now preserve exact **variable / expected / observed** information plus safe-fallback outcome;
- fatal reports retain whether writes had started and retain already-captured feedback evidence even if `runCampaign()` throws;
- dynamic feedback observation is coupled to exercised transitions;
- normal FULL manual meters use `SILENT` then `SIGNAL`;
- Monitor gain 1677 remains read-only;
- no direct Focusrite TCP write path exists in normal FULL/RESUME.

## FULL V7 hardware attempt 1 — HARD ABORT — Output 12 mute

The first write-capable V7 attempt HARD ABORTED at Output 12/S/PDIF 2 mute because its initial mute state was blank/unknown while the older probe fabricated a protective `true` baseline and then demanded `restore=true`.

Abort:

`RESTORE FAILED: output:12:mute; target output 12 produced no independently observable mute cycle; target mute restore expected=true observed=unknown`

Fix:

- unknown output-mute baseline under exact-restore/`ALL_ISOLATED` becomes `EVAL_ONLY`, no mute write;
- regression coverage added.

Later attempts traversed all 26 output mutes without this abort, hardware-confirming the fix.

## FULL V7 hardware attempt 2 — HARD ABORT — Output 3 stereo

After restoring a saved Focusrite configuration, V7 passed authorization, r9 feedback-before, topology, all output mutes/safety, metadata and Core, then HARD ABORTED at `output:3:stereo` because the original Stereo restoration was not confirmed.

That exposed synthetic fallback restoration across reversible families. The global exact-restore prefilter was then implemented and software-gate validated.

## Global exact-restore resilience prefilter — software-gate validated

`testbench/FullTestBenchRestorableV7.js` builds a non-mutating exact-restorable runtime view.

It masks unknown output source/gain/stereo baselines, source pairs, mixer slot source/stereo, grouped lane mute/solo/gain/pan, lane talkback, phantom persistence, Monitor Alt/Alt Enable, Monitor preset and Talkback Source as appropriate.

Rules:

- exact baseline known → reversible write/test + exact restore;
- exact baseline unknown → no write, `EVAL_ONLY`/unexercised;
- grouped batch with one unknown member → skip the grouped family;
- known-state write followed by unconfirmed restore → HARD ABORT.

Latest gate covering this prefilter before the current chantier was **120 tests / 120 PASS / 0 FAIL**, plus Prettier, ESLint, manifest and package build PASS.

That 120/120 result is now historical: executable TestBench code changed after it, so a new whole-repository gate is required.

## FULL V7 hardware attempt 3 — HARD ABORT — Output 5 Stereo

Newest explicit hardware evidence before the current code chantier:

- authorization/preflight PASS;
- exact model/profile PASS: Scarlett 18i20 (3rd Gen);
- module 0.1.13;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- Page 2 signature `e2e9e5352478db39`, 768 controls/batches;
- feedback-before **165 PASS / 664 EVAL_ONLY / 0 FAIL**;
- device-wide topology: 11 available/observable pairs, immediate exact source restore; runtime pair ownership derived for 9 right members in that baseline;
- exact-restore prefilter excluded 1068 unknown-baseline variables and 42 grouped lane families; source pairs excluded=0;
- all 26 output mute rows were traversed without the old Out 12 abort;
- output safety, metadata and Core reached output families;
- Out 1–4 output-family work progressed beyond the earlier Out 3 failure;
- HARD ABORT occurred at **`output:5:stereo`**;
- publisher correctly skipped the incomplete/fatal report;
- exit code 4.

The private local diagnostic showed the important new pattern without being published:

- captured Output 5 Stereo baseline = `true`;
- captured Output 6 Stereo baseline = `true`;
- source topology for pair 5–6 still showed the previously observed source pattern and exact pair-action source restore;
- Output 5 Stereo could not be proven to reconstruct the exact captured `true/true` Stereo pair vector after the functional cycle.

Do **not** infer from this that the production Stereo action is globally broken. The evidence instead shows that **source ownership evidence is insufficient to prove every Stereo state vector is reconstructable**.

The old fatal report also incorrectly recorded `hardwareWrites:false` and lost `feedbackBefore` because `runCampaign()` threw before returning its campaign object. That was a reporting defect, not evidence that no hardware writes occurred.

## Stereo pair-vector protection — implemented after attempt 3, gate pending

`testbench/FullTestBenchOutputsV4.js` now checks the captured Stereo vector before a pair-owner-left Stereo cycle.

Current conservative rule:

- non-pair-owner target → existing behavior;
- pair-owned right member → direct Stereo write remains `EVAL_ONLY`;
- pair-owner-left with incomplete target/mate Stereo baseline → no write, `EVAL_ONLY`;
- pair-owner-left where the captured right-member Stereo baseline is `true` (for example the observed 5–6 `true/true` case) → no write, `EVAL_ONLY`, because current hardware evidence has not proven exact reconstruction of that vector;
- pair-owner-left with a captured right-member `false` baseline remains exercisable under the existing transition + exact pair-vector restore checks.

This is TestBench safety/modeling only. Production `src/` has not been changed from this evidence.

## Restore/fatal diagnostic improvements — implemented, gate pending

`isolatedCycle()` now records the exact first failed verification as:

`<batch>: <variable> expected <X>, observed <Y>`

A HARD ABORT also reports whether the configured safe fallback was server-confirmed, unconfirmed, failed, or unavailable.

Fatal runner reports now fall back to live campaign context when `runCampaign()` throws so that:

- `hardwareWrites` remains true when write-capable phases had started;
- `feedbackBefore`, `feedbackAfter`, and dynamic evidence already acquired are retained where available;
- harness signature and isolation/diagnostic context are retained.

## Companion Page 2 upstream reference

The automatic importer was designed against actual upstream Bitfocus Companion **5.0.3** behavior:

- `webui/src/ImportExport/Import/index.tsx` calls `trpc.importExport.importSinglePage`;
- `companion/lib/ImportExport/Controller.ts` defines `prepareImport` and `importSinglePage`;
- the Web UI uses tRPC WebSocket `/trpc`;
- Companion's UI handler allows non-browser tooling without an `Origin` header while still enforcing loopback/DNS-rebinding protections.

No new npm dependency was added; the helper uses the Node 22 WebSocket runtime already required by the project.

## Current whole-repository Windows software gate

**PENDING after the current chantier.**

The previous executable gate was 120/120 PASS, but the following files have changed since then:

- `testbench/FullTestBenchV4Common.js`;
- `testbench/FullTestBenchOutputsV4.js`;
- `testbench/FullTestBenchResumeV7.js` (new);
- `testbench/FullTestBenchRunnerV4Campaign.js`;
- `testbench/FullTestBenchRunnerV4.js`;
- `testbench/FullTestBenchCompanionImportV7.js` (new);
- `testbench/RUN_SAFE_HARDWARE_TESTS.cmd`;
- V6/V7/authorization/safety regression tests;
- `THIRD_PARTY_NOTICES.md`.

Do **not** run hardware until root `UPDATE_AND_RUN.bat` passes dependency install, Prettier, ESLint, manifest, all tests and package build for this exact branch state.

No GitHub Actions are used in this personal development repository.

## Current live hardware state

Attempt 3 ended in a HARD ABORT before normal final restoration. Do not assume the live device is in the saved user state merely because topology/mute phases had individually restored earlier.

The user has a known saved Focusrite configuration and explicitly accepts reloading it between failed campaigns. Before the next hardware run, deliberately reload that saved configuration if it has not already been reloaded. Prefer that known baseline over manual piecemeal repair.

Keep downstream outputs physically isolated throughout RESUME/FULL hardware work.

## Production module state

Production `src/` has not changed during the V5/V6/V7 TestBench work, the Remote Devices work, or the current RESUME/Page2 chantier.

Current package version remains **0.1.13**.

Current production `output_pair_source` semantics must not be changed until completed V7 hardware evidence is reviewed intentionally.

Production authorization remains stable persisted private identity, own server-client-ID approval matching, writes blocked until authorised, and server-confirmed feedback/state only.

No package reinstall in Companion is required solely because these TestBench files changed.

## Immediate next sequence

1. **Do not run hardware yet.**
2. On the user's Windows repo, run root `UPDATE_AND_RUN.bat` and choose `testbench/v0.2-hardware-validation`.
3. Require the entire new gate to pass: immutable dependencies, Prettier, ESLint, manifest, all tests, package build. Record the exact new test count; do not assume it in advance.
4. If the gate fails, fix the whole failure chain before another hardware run.
5. After a green gate, ensure the user's saved Focusrite configuration is reloaded and outputs remain physically isolated.
6. First hardware run after this chantier should be **`RUN_TESTBENCH.bat` → `RESUME`**, not FULL, because the immediate goal is to clear the post-Out5 diagnostic path efficiently.
7. RESUME must pass the read-only authorization preflight and require `ALL_ISOLATED`.
8. If Page 2 is stale and runner returns `PREP REQUIRED`, the launcher should offer `PAGE2_AUTO`. Use that only while the current Companion instance is expendable enough for this controlled Page-2-only configuration test; it performs no Focusrite write but does modify Companion Page 2. It must audit the result and rerun preflight before hardware resumes.
9. If Page 2 automatic import/audit fails, do not fall back to blind hardware execution. Capture the console result and diagnose it.
10. If RESUME reaches later families/manual/reconnect without a restore HARD ABORT, review its private/local diagnostic result. It is not publishable final evidence.
11. Then restore the known saved Focusrite configuration again and run a **FULL from zero** for authoritative V7 validation, including static feedback-before/after and guided manual phases.
12. Only a completed FULL-from-zero may update the canonical sanitized hardware result/public evidence.
13. Preserve V6 as the latest completed hardware campaign until such a FULL V7 finishes.
14. Keep public support scope at Scarlett 18i20 (3rd Gen) until other devices are physically validated and the official Bitfocus repository/name decision is made.
