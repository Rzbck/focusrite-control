# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 10:16 Europe/Paris

This is the living resume point. Read it before proposing code, tests, branch changes, hardware work, or publication changes. Newer explicit hardware evidence and current code override older assumptions.

## Scope / publication

- **Hardware support actually validated remains Scarlett 18i20 (3rd Gen) only.**
- Module/package development version remains **0.1.13**.
- Working branch: **`testbench/v0.2-hardware-validation`**.
- Official Bitfocus repository/name is still pending. Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and broader Focusrite coverage may be appropriate later.
- Architecture is intentionally capability/profile-driven so other Focusrite Control devices can be onboarded later without rewriting the engine around the 18i20.
- Broader architecture is **not** a claim of broad hardware support. Unknown/unvalidated models remain read-only discovery/research only; hardware writes require an explicit hardware-tested/write-enabled profile.
- Monitor gain item **1677 remains read-only**. Do not add Monitor set/adjust actions, presets, or raw-write access without new hardware proof.

## Permanent safety rules

Never invent or expose:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level control;
- arbitrary/unknown raw item writes;
- firmware/reset/restore/snapshot commands.

Also preserve:

- dynamic Focusrite Control Server port and device ID; never hardcode them;
- writes blocked until Focusrite Control Remote Devices authorization matches this module's own server-assigned client ID;
- feedback/state only from server-confirmed state; no optimistic fake success;
- unknown output availability gets **no write**;
- private serial/hostname/client key/raw captures/private XML/diagnostics/user paths never go public;
- generated Companion harness pages and the user's live r9 page remain private;
- public source should stay standard for Bitfocus; local autonomous Windows tooling remains separate unless explicitly requested.

## Last complete Windows gate — V5 clean

User ran root `UPDATE_AND_RUN.bat` on 2026-08-22 after syncing through the current V5/publisher fixes on branch `testbench/v0.2-hardware-validation`.

Result:

- Node **22.23.2** / Yarn **4.17.0**
- immutable dependencies: **PASS**
- Prettier: **PASS**
- ESLint: **PASS**
- source manifest: **PASS**
- tests: **82/82 PASS**
- Companion package: **PASS** — `focusrite-scarlett-18i20-0.1.13.tgz`
- `UPDATE_AND_RUN`: **SUCCESS**

This Windows-gates the current V5 pair-aware TestBench, the root TestBench shortcut, the sanitized-report publisher/privacy checks, and all existing module tests.

Production module `src/` did **not** change during these TestBench/publisher revisions, so no `.tgz` re-import is required for the next TestBench campaign. The generic package-import reminder printed by the launcher does not override this source-change rule.

V5 is now **Windows-gated but not yet hardware-validated**.

## Convenience launcher

Root `RUN_TESTBENCH.bat` exists and is Windows-tested by the current gate. It is deliberately only a wrapper around:

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd`

It must not duplicate or bypass hardware safety logic.

## Canonical Companion validation surfaces

Page 1 remains the user's live r9 matrix:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified:

- 46 × 26 / 1196 controls
- 42/42 SAFE Core setters
- 829 logical feedback probes / 31 definitions
- normal `T` + inverted `F` feedback pairs
- feedback probe cells contain zero actions

Never publish this live page.

Page 2 is generated locally and snapshot-specific:

`testbench/generated/FULL_EXTENDED.companionconfig`

It is Git-ignored/private. Old SAFE_PAGE_A/B are obsolete and must not be recreated.

## Cold-start / SAFE evidence

Core cold-start remains **3/21 present**:

- Input 1 Mode
- Input 2 Mode
- Talkback

Missing at cold start:

- Air 1–8
- Pad 1–8
- Monitor Mute
- Monitor Dim

Latest automated SAFE remains **3 PASS / 0 FAIL / 18 SKIP**. Earlier guarded hardware work separately validated all 21 Core write paths. Never warm state by writing or invent missing state for production feedback.

## Historical V3 stop

V3 / `full-v3-output-availability-20260821` found 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN outputs and stopped with:

`HARD ABORT: Output 12 could not return to protective Mute ON after no-op recovery.`

Do not treat Output 12 as proven defective. V3 incorrectly assumed independent per-output mute semantics.

## First complete V4 hardware run — 2026-08-21

Sanitized record:

`docs/HARDWARE_VALIDATION_2026-08-21_V4.md`

Key result:

- PREP signature `633db9a04dac677c`, 742 batches, zero PREP writes
- feedback-before 113 PASS / 716 EVAL_ONLY / 0 FAIL
- feedback-after 124 PASS / 705 EVAL_ONLY / 0 FAIL
- no global HARD ABORT
- BLOCKED_BY_SAFETY 1280
- PASS_INDEPENDENT 11
- QUARANTINED_RESTORE 12

This exposed the initial strong pair/leader-follower pattern, an `availability=UNKNOWN` safety deadlock, and the raw-report privacy problem.

## V4 hardening after first run

Windows-gated 68/68 before the next campaign:

- hardware-tested/write-enabled model profiles vs unvalidated read-only discovery;
- server-confirmed passive Mute ON can guard availability-UNKNOWN outputs without writing them;
- improved pair/alias classification;
- compact terminal progress;
- raw JSON explicitly private;
- sanitized `.shareable.json` + `results/LATEST_SHAREABLE.json`.

## Latest real V4 rerun — 2026-08-22

Detailed sanitized record:

`docs/HARDWARE_VALIDATION_2026-08-22_V4_RERUN.md`

PREP:

- r9 audit PASS
- module 0.1.13 PASS
- hardware-tested profile + own authorization PASS
- shape 8 inputs / 26 outputs / 24 slots / 12 lanes
- 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN
- 742 batches
- signature **`75372604984cf6f4`**
- exit 6 PREP REQUIRED
- zero PREP writes

Hardware campaign:

- feedback-before **134 PASS / 695 EVAL_ONLY / 0 FAIL**
- feedback-after **135 PASS / 694 EVAL_ONLY / 0 FAIL**
- no global HARD ABORT
- globalSignalPathSafety false
- BLOCKED_BY_SAFETY 1256
- FAIL_MISMATCH 12
- FAIL_NO_EFFECT 19
- PASS 46
- PASS_INDEPENDENT 10
- QUARANTINED_RESTORE 14
- exit 2

The uploaded `LATEST_SHAREABLE.json` was inspected and is genuinely shareable-sanitized: no live state field, nickname value, private path, raw XML, or obvious identifier payload was present. Use the shareable report for diagnosis; keep raw `capability-lab_*.json` private.

### Hardware-observed output pattern

Independently observable mute leaders in the latest run:

**1, 3, 5, 9, 11, 13, 15, 17, 19, 25**.

Available paired members **2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 26** consistently failed independent mute observation and direct nickname effect. Treat this as leader/follower/non-owner evidence on this hardware/configuration, not as defective outputs and not as a universal Focusrite rule.

Output **7** was the odd-member exception: mute `FAIL_MISMATCH` despite later protective ON confirmation and otherwise functional exercised output families. Keep it unresolved.

Outputs **21–24** remained availability UNKNOWN and received no writes; their server-confirmed Mute ON state could count only as passive safety.

### Proven TestBench defect: pair-source expected value

Production `output_pair_source` deliberately writes:

- selected left source ID to the left output;
- that source's distinct `pairId` to the right output.

Old V4 TestBench incorrectly expected **the same left source ID on both outputs**, so its repeated `output_pair_source FAIL_NO_EFFECT` rows were false-negative TestBench evidence and must not be counted as production action failures.

### Monitor Mute restore observation

Latest shareable reports final `monitor:mute` as `QUARANTINED_RESTORE` because original Monitor Mute state was not confirmed after the campaign.

V4 ran reconnect before final Monitor Mute restoration. Since cold-start Monitor Mute state is known to be unreliable/blank, V5 moves the original Monitor Mute restore **before reconnect**. This remains a hardware-validation hypothesis until the next real run.

## Current campaign — V5 pair-aware safety

Current campaign revision:

`full-v5-pair-aware-safety-20260822`

Status: **implemented + Windows-gated 82/82; hardware validation pending**.

Changes include:

1. old V4 harness signatures are invalidated by the new campaign revision;
2. pair-source harness has two candidate test sources plus explicit `None` and `restore` actions;
3. pair-source validation no longer assumes identical left/right source IDs;
4. if neither candidate can be proven pairable, pair routing becomes `EVAL_ONLY` rather than a fabricated hardware failure;
5. when individual output safety is incomplete, an explicit hardware-profile pair may use **pair Source=None** as a temporary safety guard only after both output source states are server-confirmed 0;
6. pair Source=None writes are never attempted when either member availability is UNKNOWN or UNAVAILABLE;
7. an individual follower `Source=None` guard is upgraded to pair-aware safety when pair semantics require it;
8. pair guards are restored pair-aware; failed restore falls back toward pair None and records quarantine without optimistic success;
9. shareable report includes sanitized per-output `signalPathSafety` reasons so the exact remaining global-safety blocker is visible;
10. original Monitor Mute restoration occurs before reconnect;
11. reconnect is final and intended as no-write session validation;
12. tests cover the corrected pair contract, UNKNOWN no-write behavior, restore ordering, pair source candidates, and shareable safety-reason privacy.

Do not hardcode “even output = follower” into generic architecture. Pair behavior remains a per-model/profile + observed-state concern.

## Automatic sanitized report publication

User requested that future shareable reports be put on GitHub automatically so the latest result can be read directly without manual upload.

Status: **implemented + Windows-gated; first real hardware publication still pending validation**.

Current behavior:

- `testbench/PublishLatestShareable.js`
- after FULL, canonical launcher invokes the publisher;
- auto-publication is restricted to `testbench/v0.2-hardware-validation`;
- PREP/fatal/incomplete sanitized reports are cleanly skipped;
- only a **completed `shareable-sanitized`** report is eligible;
- strict meta/capability key whitelists;
- rejects live state/variable/serial/hostname/key/port/connection/client/device ID/path/raw XML/URL/local endpoint patterns;
- copies only the sanitized result to `docs/hardware-results/LATEST_SHAREABLE.json`;
- stages/commits only that public-safe file;
- pushes `origin HEAD` with **no force push**;
- raw JSON and generated page exports are never staged;
- publication failure does not replace the hardware campaign exit code and is shown separately.

Do not call the automatic publication path hardware-validated until the first completed V5 campaign proves the privacy gate and push behavior end-to-end.

## Multi-device Focusrite direction

Correct architecture boundary:

- Control Server transport/session: generic where protocol evidence supports it;
- capability discovery: generic;
- TestBench/report engine: generic/profile-driven;
- model shape, output pairing, safe writes, quirks: explicit profile/evidence;
- unvalidated device: read-only discovery only, no hardware writes;
- public support list: only hardware actually tested.

The current r9/SAFE surfaces are 18i20-specific validation assets. Future model onboarding should generate/use a model-specific capability surface rather than pretending the 18i20 matrix applies to every Focusrite interface.

## Required next sequence

1. Start from the user's restored normal Focusrite configuration and keep the physical Monitor level low / speakers muted as appropriate.
2. Use root **`RUN_TESTBENCH.bat`** and choose `FULL`.
3. Because V5 changed revision/harness, expect **PREP REQUIRED / exit 6 / zero hardware writes** and a fresh signature/batch count. Never reuse Page 2 signature `75372604984cf6f4`.
4. Send the complete PREP console output before continuing if anything differs from the expected clean PREP path.
5. Replace only Page 2 with the freshly generated `testbench/generated/FULL_EXTENDED.companionconfig` and map `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection.
6. Do not alter Focusrite state between PREP generation/import and the actual FULL rerun.
7. Rerun `RUN_TESTBENCH.bat` -> `FULL` and allow the campaign to finish unless it reports exit 4/HARD ABORT.
8. At completion, the privacy-gated publisher should either push `docs/hardware-results/LATEST_SHAREABLE.json` or clearly report a safe publication failure.
9. If publication succeeds, use the GitHub shareable as the canonical diagnostic input; never manually publish raw JSON.
10. If exit 4/HARD ABORT occurs: **do not rerun**; diagnose the complete restoration/safety chain first.
