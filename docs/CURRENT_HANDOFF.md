# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 08:31 Europe/Paris

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

## Last complete Windows gate

User ran root `UPDATE_AND_RUN.bat` on 2026-08-22, syncing the hardware TestBench hardening through `dfd3687` before the gate.

Result:

- Node 22.23.2 / Yarn 4.17.0
- immutable dependencies: PASS
- Prettier: PASS
- ESLint: PASS
- source manifest: PASS
- tests: **68/68 PASS**
- package: PASS — `focusrite-scarlett-18i20-0.1.13.tgz`
- `UPDATE_AND_RUN`: SUCCESS

This validates the revised V4 TestBench statically/on Windows. Production module `src/` did not change, so no `.tgz` re-import is required for these TestBench-only changes.

After that gate, two root-wrapper/tooling changes were added on GitHub only:

- root `RUN_TESTBENCH.bat`, which delegates to the canonical `testbench/RUN_SAFE_HARDWARE_TESTS.cmd`;
- a regression test asserting the root launcher stays a wrapper rather than duplicating hardware logic.

Those wrapper/test changes do not alter hardware campaign logic and have not yet been through the user's next Windows update/gate.

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

## V3 historical stop

V3 / `full-v3-output-availability-20260821` found:

- 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN outputs
- 1065 blank executable states
- 829-feedback sweep: 130 PASS / 699 EVAL_ONLY / 0 FAIL

It stopped with:

`HARD ABORT: Output 12 could not return to protective Mute ON after no-op recovery.`

Do not treat Output 12 as proven defective. V3 incorrectly assumed independent per-output mute semantics.

## First complete V4 hardware run — 2026-08-21

Sanitized record:

`docs/HARDWARE_VALIDATION_2026-08-21_V4.md`

PREP:

- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN
- 742 page-2 batches
- snapshot `633db9a04dac677c`
- exit 6 PREP REQUIRED
- zero hardware writes

Campaign:

- feedback-before: 113 PASS / 716 EVAL_ONLY / 0 FAIL
- feedback-after: 124 PASS / 705 EVAL_ONLY / 0 FAIL
- no global HARD ABORT
- exit 2

Summary:

- BLOCKED_BY_SAFETY 1280
- FAIL_MISMATCH 1
- FAIL_NO_EFFECT 13
- PASS 39
- PASS_INDEPENDENT 11
- QUARANTINED_RESTORE 12
- SKIP_AVAILABILITY_UNKNOWN 18
- SKIP_NO_CAPABILITY 16
- plus expected forbidden/manual/unsupported rows

Main findings:

1. strong odd/even pair pattern suggested linked leader/follower or alias semantics rather than random broken outputs;
2. four `availability=UNKNOWN` outputs were no-write as required, but V4 also prevented their already-confirmed mute from helping establish global safety, creating a false safety deadlock;
3. raw JSON privacy wording was wrong because raw capability state could include nickname/serial-like data.

## V4 post-run hardening implemented and Windows-gated

Hardware campaign code through `dfd3687` includes:

- model profile registry distinguishing hardware-tested/write-enabled from unvalidated read-only discovery;
- profile-based write preflight instead of a second exact-model hardcode;
- improved target/mate pair-alias mute classification;
- documented protective Mute ON baseline when original mute state is unknown;
- `availability=UNKNOWN`: still **no write**, but fresh server-confirmed Mute ON may count as passive safety;
- paired/alias follower source/gain/stereo/nickname handling avoids automatically scoring every right member as an independent feature failure;
- compact terminal phase/progress output;
- raw JSON explicitly marked private;
- separate sanitized `.shareable.json` and `results/LATEST_SHAREABLE.json`;
- privacy tests that strip live state, nickname content, nickname failure detail, and diagnostic paths from shareable output.

## Latest real V4 rerun — 2026-08-22

Sanitized console record:

`docs/HARDWARE_VALIDATION_2026-08-22_V4_RERUN.md`

This run used the Windows-gated revised hardware code and a fresh restored normal Focusrite configuration.

### PREP

- r9 audit: PASS
- module 0.1.13: PASS
- hardware-tested write profile + own client authorization: PASS
- shape: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes
- output availability: **22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN / 0 NO_FLAG**
- generated V4 page 2: **742 batches**
- fresh snapshot signature: **`75372604984cf6f4`**
- exit 6 PREP REQUIRED
- zero hardware writes

### Hardware campaign

The imported page matched snapshot `75372604984cf6f4` and the campaign completed without global HARD ABORT.

Feedback-before:

- **134 PASS / 695 EVAL_ONLY / 0 FAIL / 829**

Feedback-after:

- **135 PASS / 694 EVAL_ONLY / 0 FAIL / 829**

The new terminal progress output worked as intended across output mute, output safety, metadata, output families, mixer slots, reconnect, and restore phases.

Global output safety still reported:

`incomplete; signal-path-dependent probes remain blocked`

Final summary:

- BLOCKED_BY_SAFETY: **1256**
- BLOCKED_FORBIDDEN: 3
- EVAL_ONLY: 6
- FAIL_MISMATCH: **12**
- FAIL_NO_EFFECT: **19**
- MANUAL_PENDING: 4
- PASS: **46**
- PASS_INDEPENDENT: **10**
- QUARANTINED_RESTORE: **14**
- SKIP_AVAILABILITY_UNKNOWN: 18
- SKIP_NO_CAPABILITY: 16
- UNSUPPORTED: 4
- exit code: **2**

Interpretation at console-summary level only:

- passive safety for UNKNOWN availability improved coverage slightly: BLOCKED_BY_SAFETY fell from 1280 to 1256;
- the main global safety blocker remains unresolved;
- target-level failures/quarantines changed materially and must not be guessed from counts alone;
- 1256 blocked rows are not 1256 hardware failures;
- do not classify paired/right outputs as defective until exact target evidence is inspected.

### Immediate required evidence

Before any further code change or FULL rerun, inspect the exact sanitized file from this campaign:

`testbench/results/LATEST_SHAREABLE.json`

Need target-level mapping for:

- 12 FAIL_MISMATCH
- 19 FAIL_NO_EFFECT
- 14 QUARANTINED_RESTORE
- exact outputs that prevented `globalSignalPathSafety=true`

Keep the raw `capability-lab_*.json` private/local.

Because this campaign ended with 14 quarantined restore results, reload the saved normal Focusrite configuration before normal use. Do not immediately rerun FULL.

## Multi-device Focusrite direction

Correct architecture boundary:

- Control Server transport/session: generic where protocol evidence supports it;
- capability discovery: generic;
- TestBench/report engine: generic/profile-driven;
- model shape, output pairing, safe writes, quirks: explicit profile/evidence;
- unvalidated device: read-only discovery only, no hardware writes;
- public support list: only hardware actually tested.

The current r9/SAFE surfaces are 18i20-specific validation assets. Future model onboarding should generate/use a model-specific capability surface rather than pretending the 18i20 matrix applies to every Focusrite interface.

## Current next sequence

1. **Do not rerun FULL yet.**
2. Restore the saved normal Focusrite configuration because the latest run contains quarantined restore rows.
3. Upload/inspect `testbench/results/LATEST_SHAREABLE.json` from the `20260822T062831Z` campaign.
4. Diagnose exact pair/follower/global-safety failure chain from the shareable target rows.
5. Only then change TestBench logic if evidence supports it.
6. After any code change: run full Windows gate before hardware.
7. The root `RUN_TESTBENCH.bat` shortcut will appear locally on the next `UPDATE_AND_RUN`; it must remain a wrapper around the canonical SAFE/FULL launcher.
8. Never publish generated Companion pages or private raw reports.
