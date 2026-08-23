# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 11:52 Europe/Paris

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

Before any SAFE, FULL, targeted or manual phase that may write:

1. Reuse the existing Companion Focusrite connection. Do not delete/recreate it between builds or tests unless a new identity is intentionally required.
2. Open **Focusrite Control → Device Settings → Remote Devices**.
3. Find the existing Companion client, normally shown as **`Companion Scarlett 18i20`**.
4. Click **Approve** if needed. If the UI shows **Reject**, that client is already approved.
5. Run the read-only preflight and require this module's own authorization state to be confirmed before any write phase.

If authorization is missing, stop and classify the run as **AUTHORIZATION/PREFLIGHT BLOCKED**, not as a hardware/control failure.

Current production code persists the private client identity in the Companion connection and matches approval only to the module's own server-assigned client ID. Never publish, print or log the private `clientId` / `client-key`.

Historical `Focusrite ReadOnly State Probe` clients came from isolated research work. They do not need approval for normal SAFE/FULL work.

**Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE/FULL/write-capable TestBench campaign.**

Canonical normal path:

`TestBench → Companion HTTP/API/buttons → existing approved Companion Scarlett 18i20 connection → Focusrite Control Server → Scarlett`

Root user launcher: `RUN_TESTBENCH.bat`, which delegates to `testbench/RUN_SAFE_HARDWARE_TESTS.cmd`. The canonical launcher runs `Focusrite_18i20_Preflight.ps1` before any `--allow-hardware-writes` command.

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

Snapshot-specific and Git-ignored/private. If the current snapshot/harness signature no longer matches, FULL must request a new Page 2 import before hardware writes.

Latest successful V7 write-capable launch reported Page 2 signature `56937659fcc0dc35` with 768 audited controls/batches.

### Requested Page 2 workflow improvement — not implemented yet

The user explicitly requested that stale Page 2 replacement/remapping be automated to avoid repeated manual imports.

Desired design:

- when FULL detects `PREP REQUIRED`, generate the private Page 2 as today;
- offer an explicit local confirmation such as `Replace Page 2 automatically? O/N` before changing Companion;
- replace **only Page 2** through Companion's local API;
- preserve the live r9 Page 1;
- remap `FOCUSRITE TESTBENCH TARGET` to the **existing approved Focusrite connection**, never create/recreate the connection/client identity;
- perform no Focusrite hardware write during the Page 2 operation;
- audit the resulting Page 2/signature after replacement and fail closed if the API/target mapping is ambiguous;
- keep private Companion exports/IDs out of public reports.

Do not implement this by guessing an undocumented API endpoint. First confirm the supported local Companion import/replace path from actual Companion behavior/source or a controlled local test. Add regression coverage before making it the default launcher workflow.

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

## Current TestBench revision — FULL V7

Current revision in `FullTestBenchRunnerV4.js`:

`full-v7-runtime-ownership-isolated-feedback-20260822`

V7 is implemented but the complete write-capable V7 campaign has **not completed on hardware**.

Implemented V7 behavior includes:

- runtime pair topology is the source/stereo ownership oracle;
- a right member is marked pair-owned only from restored runtime topology evidence;
- direct right-member source/stereo writes are skipped when runtime evidence proves pair ownership;
- pair safety does not retry an impossible both-member None guard after ownership proof;
- explicit `ALL_ISOLATED` allows reversible families despite incomplete global server-side safety;
- known-state restore failure remains a HARD ABORT;
- unknown/unrestorable targets should be non-writing `EVAL_ONLY`, not synthetic baselines;
- `QUARANTINED_RESTORE` cannot be overwritten later;
- dynamic feedback observation is coupled to exercised transitions;
- manual meters use `SILENT` then `SIGNAL`;
- Monitor gain 1677 remains read-only;
- no direct Focusrite TCP write path exists in the normal TestBench.

## Software gates

### Gate after first abort fix — PASS

After the first V7 abort fix, the user ran root `UPDATE_AND_RUN.bat` and obtained:

- Node 22.23.2;
- Yarn 4.17.0 via Corepack;
- dependencies / immutable lockfile PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **117 tests / 117 PASS / 0 FAIL / 0 skipped**;
- Companion package build PASS;
- local package `focusrite-scarlett-18i20-0.1.13.tgz`;
- final `UPDATE_AND_RUN TERMINE AVEC SUCCES`.

That gate validated the first unknown-output-mute fix only. New resilience commits listed below were added after it, so the branch is **software-gate pending again** before another hardware run.

## First write-capable FULL V7 attempt — HARD ABORT 1 — Output 12 mute

Sequence:

- r9 audit PASS;
- module 0.1.13 PASS;
- exact hardware profile/authorization PASS;
- shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes PASS;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- feedback-before 161 PASS / 668 EVAL_ONLY / 0 FAIL;
- protective Monitor Mute phase ran;
- 11 pair topology probes completed with immediate exact restore;
- HARD ABORT at Output 12 mute because the initial mute state had been blank/unknown but old logic had fabricated a protective `true` baseline and then demanded `restore=true`.

Abort text:

`RESTORE FAILED: output:12:mute; target output 12 produced no independently observable mute cycle; target mute restore expected=true observed=unknown`

Output 12 is S/PDIF 2 in the 18i20 schema.

Fix:

- commit `66a3747a001f24ed4bcbf3f3c9526f003ea9168d` — under exact-restore/`ALL_ISOLATED`, unknown output-mute baseline = `EVAL_ONLY`, no mute write;
- commit `d907880f0685d1cc5ad0396a930b1eae66ecccc4` — regression coverage.

The 117/117 software gate above validated this fix.

## Second write-capable FULL V7 attempt — HARD ABORT 2 — Output 3 stereo

Before this second attempt, the user restored a known saved Focusrite configuration and kept physical isolation. The root FULL launcher again passed the read-only authorization preflight and accepted `ALL_ISOLATED`.

Observed sequence:

- r9 audit PASS: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module version 0.1.13 PASS;
- exact Scarlett 18i20 (3rd Gen) profile + module authorization PASS;
- shape 8 / 26 / 24 / 12 PASS;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- Page 2 signature `56937659fcc0dc35` PASS;
- feedback-before **164 PASS / 665 EVAL_ONLY / 0 FAIL**;
- protective Monitor Mute phase ran;
- pair topology **11 pairs**, immediate exact restore, ownership derived for 11 right members;
- output mute phase traversed **all 26 outputs without HARD ABORT**, confirming the first fix worked on hardware;
- output safety phase traversed all 26 outputs;
- global server-side safety remained incomplete only on runtime pair-owned right members; explicit physical isolation gate PASS;
- input/output metadata traversed all 34 targets;
- Core phase completed far enough to enter output families;
- output families completed Out 1 and Out 2 and reached Out 3;
- HARD ABORT at `output:3:stereo` because original stereo restoration was not confirmed;
- safe fallback was attempted by `isolatedCycle`;
- later output/mixer/monitor/manual/final-restore phases did not run;
- publisher skipped the incomplete/fatal report;
- exit code **4**.

Abort text:

`RESTORE FAILED: output:3:stereo; Functional probe original restore was not confirmed; safe fallback attempted.`

This is **not** a completed V7 hardware campaign.

### Diagnosis of HARD ABORT 2

The second abort exposed the same broader modeling class beyond output mute: several reversible V7 families still used synthetic fallback restore values when the captured original was blank/unknown, for example `false`, `0`, `-128`, or another baseline. That is incompatible with the `ALL_ISOLATED` contract: if exact original restoration cannot be proven, the target must receive no reversible write rather than inventing an original.

The audit covered the current V7 write path, not just Out 3:

- output source/gain/stereo;
- individual Source=None safety guards;
- output pair-source path;
- mixer slot source/stereo;
- grouped mixer-lane mute/solo/gain/pan;
- mixer-lane talkback;
- phantom persistence;
- Monitor Alt / Alt Enable;
- Monitor preset;
- talkback source.

Core already has `requireKnownOriginal` under physical isolation. Pair topology already refuses unknown exact source state. Output mute already has the first-abort fix.

### Global V7 exact-restore prefilter — implemented, gate pending

New TestBench-only implementation:

- `testbench/FullTestBenchRestorableV7.js` builds a non-mutating runtime view of the snapshot/harness for exact-restore mode;
- unknown boolean/numeric/exact baselines are masked out from reversible extended families;
- if either member of a source pair has unknown original source, the pair is excluded from later source-pair writes;
- if either member of an output stereo pair has unknown stereo baseline, both stereo targets are excluded from direct stereo testing;
- grouped mixer-lane batches are stricter: if any strip baseline in a lane/property batch is unknown, the **whole grouped family for that lane** is excluded so one hidden strip cannot be changed without an exact restore path;
- excluded targets receive no write and remain `EVAL_ONLY`/unexercised rather than being claimed PASS;
- known original state still gets normal transition testing and exact restore; a failed known-state restore still HARD ABORTS.

Commits:

- `2fa513936bcf9e3e10232379b32f8b0140b9021e` — add exact-restore prefilter helper;
- `fa4317d0ded535719035009c06e0f18d33ae1a4c` — apply the prefilter across reversible V7 families;
- `188b0ed3b6a04612efb841708933c7af5887f806` — regression tests for masking, grouped lane behavior, and campaign wiring.

Local reasoning checks performed before handoff update:

- new helper parses with Node `--check`;
- its synthetic masking scenario was exercised locally with stubs and passed;
- new regression test file parses with Node `--check`;
- helper/test files contain no >120-character lines in that local syntax check.

**These three commits have not yet passed the repository's canonical Windows `UPDATE_AND_RUN.bat` gate. Do not run hardware again until that full gate is green.**

## Current live hardware state after HARD ABORT 2

Do not assume the live device is fully restored after the second abort.

Known evidence:

- pair-topology changes were immediately restored before later phases;
- all output mute probes completed without a reported restore abort;
- the abort occurred specifically while restoring Output 3 Stereo;
- `isolatedCycle` attempted the configured safe fallback for that stereo target;
- protective Monitor Mute had run and the abort happened before the normal end-of-campaign Monitor Mute restore, so Monitor Mute may still be ON;
- Output 3 Stereo original state is not confirmed after the abort.

The user has a known saved Focusrite configuration and explicitly accepts reloading it to return to a clean baseline between failed campaigns. Prefer that deliberate known-config reload over manual piecemeal repair after a HARD ABORT.

Keep downstream outputs physically isolated until the saved configuration has been reloaded/confirmed.

## Production module state

Production `src/` has not changed during the V5/V6/V7 TestBench work or the 2026-08-23 Remote Devices/launcher/abort/resilience work.

Current package version remains **0.1.13**.

Current production `output_pair_source` still requests source `0` on both pair members for Pair Source=None. Do not translate TestBench evidence into production semantics until a completed V7 hardware campaign is reviewed intentionally.

The production authorization path remains stable persisted private identity, own server-client-ID approval matching, writes blocked until authorised, and server-confirmed feedback/state only.

## Required next sequence

1. **Do not rerun FULL yet.** The branch changed after HARD ABORT 2 and requires a new whole-repository software gate.
2. The user may deliberately reload the known saved Focusrite configuration to recover from the abort. Keep downstream outputs isolated while doing so.
3. Run root `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation` and require the full chain: dependencies → Prettier → ESLint → manifest → all tests → Companion package.
4. If the gate fails, diagnose the complete software failure chain before another user hardware run; do not send repeated speculative patches.
5. If the gate is green, update this handoff with the exact test count and commit state.
6. Before another hardware run, reconfirm the saved Focusrite configuration is loaded, the existing `Companion Scarlett 18i20` Remote Devices client is approved, the same Companion connection is reused, and no direct research probe is running.
7. Renew physical isolation and enter local `ALL_ISOLATED` only while isolation is actually true.
8. Rerun root `RUN_TESTBENCH.bat` → FULL. Unknown/unrestorable reversible targets should now be skipped without write; known-state restore failures must still HARD ABORT.
9. If a new HARD ABORT occurs, do not blind-rerun. Diagnose whether the original was genuinely known and whether the restore path is a real hardware/action failure.
10. Preserve V6 as the latest completed hardware campaign until V7 finishes.
11. After a completed V7 campaign, review what should actually change in production `src/`; do not automatically copy TestBench assumptions into the public module.
12. Implement the Page 2 auto-replace/remap workflow only after the current V7 campaign path is stable and after the actual Companion local import API is verified. It must remain explicit-confirmation, Page-2-only, same-existing-connection, and hardware-write-free.
13. Keep public support scope at Scarlett 18i20 (3rd Gen) until other devices are physically validated and the official Bitfocus repository/name decision is made.
