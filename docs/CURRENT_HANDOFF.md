# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 — V8 generic evidence/profile architecture implemented; **new Windows software gate still required before any further hardware run**.

Read `AI_PROJECT_RULES.md`, `docs/REMOTE_DEVICES_AUTHORIZATION.md`, and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current checked-in code override older assumptions.

## Immediate checkpoint — read this first

- Working branch: `testbench/v0.2-hardware-validation`.
- Current development package version: **0.1.14**.
- Current TestBench revision: **`full-v8-generic-evidence-profile-20260823`**.
- Hardware support actually validated/publicly in scope remains **Scarlett 18i20 (3rd Gen) only**.
- The TestBench architecture is being made reusable for future Focusrite Control devices, but this is **not** a support claim for any other model.
- Unknown/unvalidated Focusrite models must fail closed for writes. Discovery/inventory may be read-only; writes require a dedicated hardware-tested/write-enabled profile.
- **Do not run SAFE/RESUME/FULL hardware yet.** V8/0.1.14 has not yet passed the canonical Windows `UPDATE_AND_RUN.bat` gate after the latest refactor.
- The last fully green software checkpoint before V8 was the resilient V7/0.1.13 gate: Prettier PASS, ESLint PASS, manifest PASS, **133/133 tests PASS**, package build PASS.
- V6 remains the latest completed/publishable hardware campaign. The newer RESUME run is diagnostic-only and must not replace final FULL evidence.

## Project / publication state

- Personal repository: `Rzbck/focusrite-control`.
- Default branch: `main`.
- Active validation branch: `testbench/v0.2-hardware-validation`.
- No GitHub Actions are used on this personal development repository; root `UPDATE_AND_RUN.bat` is the canonical local software gate.
- Official Bitfocus repository/name remains pending. Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Keep public support scope at **Scarlett 18i20 (3rd Gen)** until another device has real hardware validation.
- Stable public release target remains **v1.0.0** after the official repository/naming decision, expected Bitfocus branch/PR flow, CI, hardware/action audit and privacy/attribution checks.

When the official Bitfocus repository exists:

1. inspect exact repository name, default branch, seed files and permissions;
2. compare them with the cleaned current RC;
3. use the expected branch/PR workflow instead of overwriting blindly;
4. run Bitfocus CI plus local tests;
5. keep stable public release target at v1.0.0 unless maintainers direct otherwise;
6. submit a Developer Portal tag only after hardware/action audit and CI are clean.

## Permanent safety / protocol rules

Never invent or re-add:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level control;
- Monitor gain item 1677 writes;
- Monitor +/- presets;
- unknown/unsafe arbitrary raw writes;
- firmware/reset/restore/snapshot write commands;
- writes to read-only meter/status items.

Monitor gain item **1677 remains read-only**. Physical Monitor movement may be observed; there must be no set/adjust action, preset or raw-write access unless new hardware testing proves a useful write path.

Transport/session rules:

- Focusrite Control Server TCP port is dynamic; never hardcode it.
- Focusrite device ID is dynamic; never hardcode it.
- Preserve the module's stable private `client-key`/identity through the existing Companion connection.
- Writes require Focusrite Control **Remote Devices** authorization.
- Only approval that matches this module's own server-assigned client ID counts.
- Block writes until authorised.
- Feedback/state must be server-confirmed; never fake success with optimistic updates.
- Availability `UNKNOWN` receives no write.

Privacy/publication rules:

- never publish a real serial, private hostname, client key, client/device/connection IDs, raw private XML, private Companion export, diagnostics, private captures or user-specific paths;
- preserve relevant MIT/third-party attribution;
- do not claim all protocol knowledge was independently discovered;
- public Bitfocus source stays clean; autonomous Windows builder/debug/TestBench scripts remain separate unless explicitly requested.

Canonical hardware path:

`TestBench → Companion local API/buttons → existing approved Companion Focusrite connection → Focusrite Control Server → Scarlett`

Never run a direct Focusrite Control Server research probe concurrently with SAFE/FULL/RESUME.

## Remote Devices authorization — mandatory before any write

Before SAFE, RESUME, FULL, targeted or manual write-capable phases:

1. reuse the existing Companion Focusrite connection; do not delete/recreate it;
2. open Focusrite Control → Device Settings → Remote Devices;
3. find the existing Companion client, normally displayed as `Companion Scarlett 18i20`;
4. approve it if needed (`Reject` shown in the Focusrite UI means it is already approved);
5. run the read-only preflight and require the module's own authorization state to be confirmed.

Missing approval is **AUTHORIZATION/PREFLIGHT BLOCKED**, not a hardware/control failure.

Historical `Focusrite ReadOnly State Probe` clients are separate research clients and are irrelevant to normal FULL/RESUME work.

## Canonical TestBench surfaces

### Page 1 — live r9

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

- 46×26 / 1196 controls;
- 42 SAFE setters;
- 829 logical feedback probes / 31 definitions;
- normal T + inverted F pairs;
- feedback cells contain zero actions.

Never publish the live page/export.

### Page 2 — private generated capability harness

`testbench/generated/FULL_EXTENDED.companionconfig`

- snapshot-specific;
- Git-ignored/private;
- regenerated when the current harness signature changes;
- must be mapped to the **existing approved Focusrite connection**;
- may be replaced automatically only after explicit user confirmation.

## Page 2 automatic replacement — **live-tested PASS**

`PAGE2_AUTO` is no longer research-only. It has been exercised successfully against the user's live Companion instance.

Implementation uses the real Companion 5 single-page import flow through local tRPC WebSocket `/trpc`:

- `importExport.prepareImport.start`;
- `importExport.prepareImport.uploadChunk`;
- `importExport.prepareImport.complete`;
- `importExport.importSinglePage` with `sourcePage`, `targetPage` and `connectionIdRemapping`.

Live-tested behavior:

- explicit `PAGE2_AUTO` confirmation required;
- replaces **only Page 2**;
- preserves Page 1 r9;
- remaps generated `FOCUSRITE TESTBENCH TARGET` to the **existing Focusrite connection**;
- does not create/recreate the Focusrite connection/client identity;
- connection set is audited before/after;
- all pages except Page 2 are audited unchanged;
- generated harness is re-audited after import;
- read-only Remote Devices preflight runs again before hardware resumes;
- Page 2 replacement itself performs **no Focusrite hardware write**;
- failure/ambiguity is fail-closed.

An early live test correctly failed before modification because the importer redundantly required the exact r9 display name. That defect was fixed to reuse the already-audited Page 1/name-or-marker contract. A subsequent live run passed Page2 Auto end to end.

Upstream Companion MIT-licensed behavior informed this integration; preserve the third-party notice.

## Diagnostic RESUME — **live-tested PASS as a development mechanism**

RESUME exists to avoid repeating the whole matrix after every TestBench defect. It is never final evidence.

Live-tested properties:

- read-only authorization preflight PASS;
- fresh live snapshot/availability captured;
- `ALL_ISOLATED` remains mandatory for the write-capable diagnostic path;
- mandatory protective/safety/topology work is rerun;
- Page2 Auto can prepare the generated harness and then preflight/rerun automatically once;
- diagnostic resume can continue near the previous failing phase;
- exact known-state restore failure still HARD ABORTS;
- successful diagnostic run remains `meta.completed=false` and is never published as final FULL evidence.

The most recent RESUME traversed to the final reconnect **without a HARD ABORT**. Dynamic feedback observation reported **0 mismatches** for the transitions observed during that run.

Its process exit code was still 2 because the diagnostic summary contained hardware-behavior FAIL classifications; this was not a restore/safety abort. Those results were then analysed and are the evidence feeding V8.

## Latest diagnostic hardware evidence — 27 results now understood by families

Private raw diagnostic data stays local/private. The following sanitized conclusions are safe to retain in this handoff.

The most recent RESUME produced exactly:

- **5 `FAIL_MISMATCH`**;
- **22 `FAIL_NO_EFFECT`**;
- no restore quarantine/HARD ABORT;
- dynamic feedback mismatches = 0.

The 27 rows group into coherent hardware behavior rather than 27 independent defects.

### Output direct controls

Hardware-observed direct behavior on this 18i20 Gen3 includes:

- Mute direct behavior mismatch on **Out 2/4/6/8/10**. These must not be relabelled as `NO_EFFECT`; V8 keeps the distinction `WRITE_BEHAVIOR_MISMATCH`.
- Direct Source on **Out 2/4/6** produced no useful independent transition in that RESUME; broader source-pair evidence from earlier topology work also shows right-member source ownership for the AVAILABLE/observable pairs listed in the 18i20 profile.
- Direct Stereo on **Out 2/4/6** produced no useful transition in the diagnostic evidence. Do **not** infer the same result for every other right member.
- Direct Gain produced no useful transition on **Line Out 4/6/8/10**. Monitor Out 2 Gain had separate earlier positive evidence and must not be generalized into this no-effect group.

Older hardware evidence still matters where the newest RESUME skipped metadata: right-member output nickname writes had previously been observed no-effect on the tested right members. Keep those findings separate from Source/Stereo/Mute semantics.

### Mixer Slot Source / Stereo

Current hardware evidence:

- Mixer Slot Source: known tested slots **1–4** ignored the requested write transition while original baseline restoration remained confirmed.
- Mixer Slot Stereo: known tested slots **3–4** ignored the requested write transition while original baseline restoration remained confirmed.

Because no useful public write path has yet been demonstrated for these families on the 18i20 Gen3, V8/production 0.1.14 withholds the public Mixer Slot Source/Stereo write families while retaining readable state/feedback. Untested slots are **withheld by profile**, not falsely labelled hardware-tested no-effect.

### Mix Talkback

Per-lane Mix Talkback on the six tested **left lanes A–F** ignored direct writes with exact baseline restoration confirmed.

V8/production 0.1.14 withholds the per-lane Mix Talkback public write family while retaining readback/feedback.

This does **not** remove or invalidate the separately hardware-tested **global Monitor Talkback** control.

## Runtime pair-source topology — updated interpretation

Source-pair topology remains a **Source-specific** ownership oracle only.

V7 originally recognized only:

- `REQUESTED_ORIGINAL / ZERO_ORIGINAL`.

The newest hardware evidence also showed early pairs such as 1–2, 3–4 and 5–6 using:

- `REQUESTED_ZERO / ZERO_ZERO`.

Both restored patterns can indicate pair-owned source behavior, but this conclusion is **only about Source topology**.

Critical V8 rule:

> Source ownership must never automatically become Mute ownership, Stereo ownership, Gain ownership or Nickname ownership.

Each control family requires its own evidence.

## Stereo exact-restore evidence

FULL V7 attempt 3 previously HARD ABORTED at `output:5:stereo` with a captured Stereo pair vector `true/true` on Out 5/6. The current action path could not prove exact reconstruction of that captured vector.

Safe interpretation:

- known pair baseline is not automatically known-restorable;
- no synthetic fallback baseline is allowed under exact-restore/`ALL_ISOLATED`;
- `true/true` remains non-writing until an exact restoration path is hardware-proven;
- Source topology must not be reused as a Stereo ownership oracle;
- Stereo checks its own target/mate state and exact restore behavior.

Do not claim production Stereo is globally broken from this evidence.

## V8 architecture — generic engine vs model evidence profile

Current TestBench revision:

`full-v8-generic-evidence-profile-20260823`

Primary objective of V8 is to make the TestBench reusable for future Focusrite Control hardware **without baking 18i20 conclusions into the generic engine**.

### Generic engine

The generic engine should answer:

- what schema/logical capability was observed;
- whether current state exists/is known;
- whether it is safe/restorable enough to probe;
- what transition happened;
- whether restore succeeded;
- whether behavior is independent, aliased/coupled, no-effect, mismatched, unknown, blocked or manual;
- whether every observed variable/capability was accounted for.

It must not say “right outputs are followers” or “Mixer Slot Source never writes” as a universal rule.

### Model evidence profile

`testbench/FullTestBenchProfilesV8.js` holds model-specific hardware evidence.

For Scarlett 18i20 (3rd Gen), evidence is control-specific and currently records facts such as:

- source-pair-owned right members derived from source topology;
- specific direct Mute behavior mismatches;
- specific direct Stereo no-effect rows;
- specific direct Gain no-effect rows;
- specific right-member Nickname no-effect evidence;
- tested Mixer Slot Source/Stereo no-effect rows plus family-level withholding;
- tested Mix Talkback no-effect left lanes plus family-level withholding;
- Monitor gain read-only evidence.

A future Focusrite model gets its **own** profile after real hardware testing. It never inherits the 18i20 profile merely because IDs/schema look similar.

### Unknown/unvalidated model behavior

`profileForModel(model, { allowUnvalidated: true })` can produce a discovery profile, but:

- `hardwareTested = false`;
- `writeEnabled = false`;
- normal writes fail closed;
- observed variables can be inventoried/classified as withheld/unknown/read-only research evidence;
- a dedicated tested profile is required before writes can be enabled.

Production still supports only the exact Scarlett 18i20 (3rd Gen).

## V8 semantic classification

V8 separates **run status** from **capability classification**.

Examples:

- a RESUME may leave a row `EVAL_ONLY` for that run while prior hardware evidence classifies it `NO_EFFECT_CONFIRMED`;
- a Source right member may be `EVAL_ONLY` in the current run but classified `PAIR_OWNED_ALIAS` from source-specific hardware evidence;
- an untested row in a public write family withheld because no useful path is yet demonstrated may be `WITHHELD_BY_PROFILE`, not falsely called no-effect.

Current classifications include:

- `SCHEMA_OBSERVED`;
- `READ_ONLY_CONFIRMED`;
- `WRITE_CANDIDATE`;
- `WRITE_CONFIRMED`;
- `NO_EFFECT_CONFIRMED`;
- `WRITE_BEHAVIOR_MISMATCH`;
- `PAIR_OWNED_ALIAS`;
- `UNRESTORABLE`;
- `BLOCKED_BY_SAFETY`;
- `AVAILABILITY_UNKNOWN`;
- `NO_CAPABILITY`;
- `WITHHELD_BY_PROFILE`;
- `MANUAL_PENDING`;
- `UNSUPPORTED`;
- `FORBIDDEN`;
- `UNKNOWN`.

This classification layer is intentionally distinct from whether a row happened to be exercised in one specific run.

## V8 coverage invariant — fail closed before writes

`testbench/FullTestBenchEvidenceV8.js` adds an evidence/coverage audit.

Before hardware writes, the TestBench must be able to account for:

- observed snapshot variables;
- observed Core variables;
- inventory rows;
- semantic classification of every inventory row;
- r9 feedback-probe coverage presence.

If an observed variable has no inventory row, or a row has no meaningful classification, the audit is incomplete and the write-capable campaign must fail closed rather than silently ignore it.

This is an important step toward a future generic Focusrite capability lab.

Current limitation to remember: this invariant covers the logical variables/inventory currently captured by the TestBench and r9 feedback surface. A future enhancement should add a sanitized **raw schema/descriptors ledger/fingerprint** so that even newly appearing raw Focusrite item/descriptors cannot be silently missed.

## Production module 0.1.14 — current checked-in policy, NOT yet software-gated

Unlike the earlier V7-only TestBench work, the current V8 chantier changes production `src/` and package version.

Current `package.json` version: **0.1.14**.

Production policy remains specific to Scarlett 18i20 (3rd Gen) and fail-closed for unknown models.

Current 18i20 public-write policy being validated:

- withhold direct Mute writes on Out 2/4/6/8/10 because current hardware behavior is mismatched/non-independent;
- withhold direct right-member Source writes according to proven source-pair ownership evidence;
- withhold direct Stereo only on the specific right members with direct no-effect evidence; do not infer all right-member Stereo behavior from Source topology;
- withhold right-member Nickname writes where hardware testing previously demonstrated no effect;
- withhold Gain on Line Out 4/6/8/10 where direct writes were hardware no-effect;
- withhold public Mixer Slot Source/Stereo writes while preserving readback/feedback;
- withhold public per-lane Mix Talkback writes while preserving readback/feedback;
- preserve global Monitor Talkback;
- Advanced Raw filtering must respect the same hardware policy and must never expose read-only/no-effect/withheld items as a bypass;
- Monitor gain 1677 remains read-only;
- `output_pair_source` remains intentionally unchanged for now pending completed FULL review.

Do not call these 0.1.14 changes validated until the new whole-repository Windows gate passes and the package is then exercised on hardware.

## Historical hardware checkpoints that still matter

### Cold-start / SAFE

Core cold-start remains 3/21 present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim remain absent at cold start. Latest automated SAFE evidence remains 3 PASS / 0 FAIL / 18 SKIP. Earlier guarded work separately validated all 21 Core write paths.

Never warm state by writing or invent missing state merely to make SAFE complete.

### FULL V6 — latest completed hardware campaign

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V6.md`.

Canonical sanitized result: `docs/hardware-results/LATEST_SHAREABLE.json`.

V6 remains the latest completed public/shareable hardware evidence until a later FULL-from-zero completes.

Important V6 facts:

- 11 AVAILABLE/observable output pairs exercised;
- exact pair source restoration confirmed;
- pairs 21–22 and 23–24 were availability UNKNOWN and received no topology write;
- mute was not a reliable ownership oracle;
- Monitor gain 1677 stayed read-only/manual-pending;
- old quarantines reflected older modeling defects and must not be reinterpreted as current live state.

### FULL V7 abort history

Attempt 1: Output 12 mute — exposed fabricated unknown baseline. Fixed: unknown exact baseline => no write / `EVAL_ONLY`.

Attempt 2: Output 3 Stereo — exposed broader synthetic restore defaults. Fixed by global exact-restore prefilter.

Attempt 3: Output 5 Stereo — exposed that a known `true/true` pair vector was not proven reconstructable by the current Stereo path. This led to pair-vector protection and later V8 separation of Source vs Stereo evidence.

These aborted runs are historical diagnostic evidence, not completed FULL validation.

## Current whole-repository software-gate state

Last fully completed Windows gate before V8:

- Node 22.23.2;
- Yarn 4.17.0 via Corepack;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **133/133 tests PASS**;
- package build PASS;
- package `focusrite-scarlett-18i20-0.1.13.tgz`;
- no hardware writes during the gate.

Since that checkpoint, V8 generic evidence/profile code, production hardware policy changes, tests, report fields and version 0.1.14 have been checked in.

**A new full Windows gate has NOT yet been run after these latest changes.**

Do not assume the new test count in advance; use the actual `UPDATE_AND_RUN.bat` result as truth.

## Immediate next sequence — canonical continuation point

1. **Do not run hardware yet.**
2. On `testbench/v0.2-hardware-validation`, run root **`UPDATE_AND_RUN.bat`** and choose the validation branch.
3. Require the complete chain to pass: immutable dependencies → Prettier → ESLint → source manifest → all Node tests → Companion package build.
4. If anything fails, diagnose the complete software failure chain first. Do not start hardware and do not send/reuse a partially checked package.
5. If the gate is fully green, verify package/version/privacy/forbidden-feature regression and package contents.
6. Because production `src/` changed and version is now **0.1.14**, install the validated 0.1.14 package in Companion **without deleting/recreating the existing Focusrite connection**. Preserve its Remote Devices identity/authorization.
7. Re-run the read-only preflight and confirm exact Scarlett 18i20 (3rd Gen), existing module client authorised, Connected/authorised.
8. Reload/confirm the known saved Focusrite configuration and keep downstream outputs physically isolated.
9. Run a **development RESUME**, not final FULL, to confirm the V8 profile actually prevents the already-understood dead/mismatched direct writes while preserving useful readback and exact restoration.
10. If Page 2 is stale, use the already live-tested `PAGE2_AUTO` path after its explicit confirmation; require its audits and second preflight PASS.
11. Inspect the resulting private diagnostic. RESUME remains `meta.completed=false` and non-publishable.
12. If V8 RESUME is clean enough and reveals no new modeling defect, reload the known saved configuration again.
13. Run a **FULL from zero** for authoritative validation: 829 feedback-before/after, Core, metadata, outputs/pairs, mixer, monitoring, dynamic feedback, manual SILENT/SIGNAL meters, read-only physical Monitor 1677 observation and exact restoration.
14. Only a completed FULL-from-zero may replace V6 as canonical hardware evidence.
15. Review remaining `UNKNOWN`, `AVAILABILITY_UNKNOWN`, `MANUAL_PENDING`, `WITHHELD_BY_PROFILE` or mismatched rows intentionally; do not force writes simply to make the report green.
16. Keep public hardware support scope at Scarlett 18i20 (3rd Gen) until another Focusrite has its own real test campaign/profile.

## Future generic Focusrite direction

The long-term TestBench objective is larger than this one card:

- enumerate what the device/schema exposes;
- preserve read-only discovery even when writes are not allowed;
- distinguish existence, state observability, writability, independence/aliasing, semantic effect, safety and exact restoration;
- classify every observed capability instead of silently dropping unknowns;
- build a separate hardware evidence profile per model;
- never inherit 18i20 conclusions into a future Focusrite automatically;
- require a FULL-from-zero campaign for each newly tested hardware model before enabling its write profile;
- eventually add a sanitized raw schema/descriptors ledger/fingerprint for stronger exhaustiveness beyond the current logical-variable/r9 surface.

The Scarlett 18i20 (3rd Gen) is the first deep reference device used to harden this reasoning engine. The goal is to understand it completely enough to make the TestBench trustworthy on the next Focusrite, not to hardcode the TestBench around this one model.
