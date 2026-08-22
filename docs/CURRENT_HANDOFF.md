# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 11:49 Europe/Paris

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

## Last complete Windows gate — current publisher/lockfile state

User ran root `UPDATE_AND_RUN.bat` on 2026-08-22 after the isolated-worktree publisher hardening, CRLF blob normalization and dependency-lockfile cleanup.

Result:

- Node **22.23.2** / Yarn **4.17.0**
- dependencies: **PASS with versioned immutable `yarn.lock`**
- Prettier: **PASS**
- ESLint: **PASS**
- source manifest: **PASS**
- tests: **83/83 PASS**
- Companion package: **PASS** — `focusrite-scarlett-18i20-0.1.13.tgz`
- `UPDATE_AND_RUN`: **SUCCESS**

The 83-test gate includes the synthetic Git regression that deliberately uses a dirty/behind validation checkout and a separately advanced remote, then proves that the publisher can publish from an isolated remote-based worktree without changing the local HEAD or local dirty status.

Dependency reproducibility is now explicit:

- root `yarn.lock` is versioned;
- `UPDATE_AND_RUN` uses `yarn install --immutable` when the lockfile exists;
- `/.yarn/` is ignored;
- `Desktop.ini` is ignored;
- current locked graph includes `@companion-module/base 2.0.0`, `@companion-module/tools 3.0.2`, ESLint 10.8.1 and Prettier 3.9.6.

Windows launcher line endings are also normalized correctly:

- Git index stores `RUN_TESTBENCH.bat` and `testbench/RUN_SAFE_HARDWARE_TESTS.cmd` as LF;
- `.gitattributes` checks them out as CRLF on Windows;
- clean checkout now remains clean instead of reporting false modified launchers.

Production module `src/` has not changed during the TestBench/publisher work, so no `.tgz` re-import is required for this infrastructure-only validation.

## Convenience launcher

Root `RUN_TESTBENCH.bat` remains only a wrapper around:

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

Current V5 hardware-run snapshot:

- revision `full-v5-pair-aware-safety-20260822`
- signature **`c4ca20cc1b45425b`**
- 768 audited controls

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

## Historical V3 / V4 evidence

V3 incorrectly assumed independent output mute semantics and hard-aborted on Output 12 restore. Do not treat Output 12 as defective.

First complete V4 run, 2026-08-21:

- signature `633db9a04dac677c`
- 742 batches
- feedback 113/716/0 before, 124/705/0 after
- BLOCKED_BY_SAFETY 1280
- PASS_INDEPENDENT 11
- QUARANTINED_RESTORE 12

Latest V4 rerun before V5, 2026-08-22:

- signature `75372604984cf6f4`
- 742 batches
- 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN
- feedback 134/695/0 before, 135/694/0 after
- BLOCKED_BY_SAFETY 1256
- FAIL_MISMATCH 12
- FAIL_NO_EFFECT 19
- PASS 46
- PASS_INDEPENDENT 10
- QUARANTINED_RESTORE 14
- exit 2, no global HARD ABORT

Detailed V4 record:

`docs/HARDWARE_VALIDATION_2026-08-22_V4_RERUN.md`

### Proven V4 TestBench defect

Production `output_pair_source` writes the selected left source ID to the left output and that source's distinct `pairId` to the right output. Old V4 incorrectly expected the same source ID on both members, so those old pair-source failures were false-negative TestBench evidence.

## Latest real hardware campaign — V5 pair-aware — 2026-08-22

Detailed record:

`docs/HARDWARE_VALIDATION_2026-08-22_V5.md`

Canonical sanitized machine-readable result:

`docs/hardware-results/LATEST_SHAREABLE.json`

Revision:

`full-v5-pair-aware-safety-20260822`

PREP:

- r9 audit PASS
- module 0.1.13 PASS
- exact hardware-tested profile + own authorization PASS
- shape 8 inputs / 26 outputs / 24 slots / 12 lanes
- 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN
- **768 batches**
- signature **`c4ca20cc1b45425b`**
- exit 6 PREP REQUIRED
- zero PREP hardware writes

Hardware run:

- feedback-before **113 PASS / 716 EVAL_ONLY / 0 FAIL**
- feedback-after **123 PASS / 706 EVAL_ONLY / 0 FAIL**
- no global HARD ABORT
- globalSignalPathSafety **false**
- BLOCKED_BY_SAFETY 1280
- FAIL_MISMATCH 5
- FAIL_NO_EFFECT 18
- PASS 41
- PASS_BASELINE 1
- PASS_INDEPENDENT 11
- QUARANTINED_RESTORE **1**
- SKIP_AVAILABILITY_UNKNOWN 18
- exit 2

The sanitized result passed the publisher whitelist/key/content privacy checks and is now present on GitHub with exact signature `c4ca20cc1b45425b`. Future analysis should read this GitHub file directly; do not request or publish raw private `capability-lab_*.json` files.

### V5 signal-path safety

Server-confirmed safe at the global checkpoint:

- Mute-confirmed: **1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25**
- availability UNKNOWN but passive Mute ON confirmed, no writes: **21, 22, 23, 24**

Remaining blockers, all `source-none-unconfirmed`:

**4, 6, 8, 10, 12, 14, 16, 18, 20, 26**

Do not loosen this safety rule without new server-confirmed hardware evidence. The pair-aware Source=None phase did not prove those ten members safe.

### V5 output mute classification

`PASS_INDEPENDENT`:

**1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25**

`FAIL_MISMATCH`:

**2, 4, 6, 8, 10**

`FAIL_NO_EFFECT` independent cycle:

**12, 14, 16, 18, 20, 26**

Availability UNKNOWN / no write:

**21, 22, 23, 24**

Output 7, previously the unresolved odd-member V4 exception, produced a clean independent mute cycle in this V5 run. Do not convert this or the broader observed pattern into a generic parity rule.

Output 2 did not produce the expected independent ON/OFF cycle but did obtain a server-confirmed protective Mute ON guard. Capability independence and protective safety are intentionally separate classifications.

### V5 pair-source result

Pair 1–2: **PASS** — known pairable source candidate, pair None, and original pair restore were server-confirmed.

Pairs 3–4 through 19–20 and 25–26: functional pair-source probe remained blocked because both members did not have confirmed mute safety.

Pairs 21–22 and 23–24: availability UNKNOWN/UNKNOWN, no pair-source write.

Production `output_pair_source` explicitly handles source `0` by writing `0` to both pair members. Therefore the ten `source-none-unconfirmed` blockers are real server-confirmation failures in the current safety test, not a missing None branch in the production action.

### V5 restoration result

V5 reduced `QUARANTINED_RESTORE` from 14 in the prior V4 rerun to exactly **1**:

- `output:2:source` — functional probe expected source 1255 but observed 0; original restore was not confirmed; safe fallback attempted.

Monitor Mute finished **PASS_BASELINE**. The previous V4 final Monitor Mute quarantine did not recur after V5 moved original Monitor Mute restoration before reconnect and made reconnect the final no-write phase. This supports the ordering change but does not prove the old reconnect order was the sole cause.

Because one output source remains quarantined, restore the user's saved normal Focusrite configuration before normal use or another hardware campaign.

### Global-test consequence

The 1280 `BLOCKED_BY_SAFETY` rows are deliberate safety skips, not hardware failures. Core signal-changing probes, mixer signal-path tests and monitor routing tests remain blocked until every potentially active output has a server-confirmed mute/source-none guard.

## Automatic sanitized report publication — validated current workflow

The first real V5 publication attempt exposed a workflow bug, not a hardware bug: the old publisher committed in the user's current checkout and then hit a remote non-fast-forward after a documentation commit advanced the branch. No force-push occurred.

The hardened publisher now uses this contract:

- `testbench/PublishLatestShareable.js` remains restricted to `testbench/v0.2-hardware-validation`;
- only a completed `shareable-sanitized` report can publish;
- strict privacy whitelists/content scans remain mandatory;
- publisher fetches the latest remote validation ref;
- publication occurs in an **isolated temporary detached Git worktree based on the latest remote branch**;
- only `docs/hardware-results/LATEST_SHAREABLE.json` is written/staged/committed there;
- the user's current checkout is never committed, rebased, stashed, reset or otherwise modified by publication;
- push is `HEAD:refs/heads/testbench/v0.2-hardware-validation`, never force-push;
- a race-condition non-fast-forward may retry once from a freshly fetched remote head;
- temporary worktree is removed/pruned after success, skip or failure;
- publication failure remains separate from the hardware campaign exit code.

Validation status as of 2026-08-22:

- full Windows gate: **83/83 PASS**;
- dirty/behind synthetic Git integration regression: **PASS**;
- privacy/schema tests: **PASS**;
- standalone publisher invocation on the user's actual V5 report: **PASS/idempotent** — reported that GitHub already matched the completed campaign;
- immediate local `git status --short` before and after standalone invocation: **clean/unchanged**;
- GitHub verification: `docs/hardware-results/LATEST_SHAREABLE.json` exists and contains revision `full-v5-pair-aware-safety-20260822`, signature `c4ca20cc1b45425b`, model Scarlett 18i20 (3rd Gen), `completed: true`.

**Future workflow rule:** after a completed FULL, the canonical launcher invokes the publisher automatically. The assistant should then read `docs/hardware-results/LATEST_SHAREABLE.json` directly from GitHub and continue analysis from it. Do not ask the user to upload the shareable report unless GitHub publication itself explicitly failed. Never ask for or publish the raw private report.

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

1. **Do not run another FULL hardware campaign now.** Existing V5 evidence is sufficient for diagnosis.
2. Restore/use the user's saved normal Focusrite configuration before normal use because `output:2:source` was the one V5 restore quarantine.
3. Treat the GitHub `docs/hardware-results/LATEST_SHAREABLE.json` as the canonical V5 machine-readable input.
4. Diagnose the ten `source-none-unconfirmed` outputs and the single `output:2:source` quarantine against the current production action semantics and V5 pair-safety code before proposing any new hardware write campaign.
5. Do **not** weaken both-member server confirmation and do not hardcode even-output follower behavior. Determine whether the remaining blocker is follower state ownership/reporting, pair action ordering, verification timing/state propagation, pair topology semantics, or another explicit profile quirk.
6. Prefer a narrow, hypothesis-driven next probe if additional hardware evidence is actually required. Do not repeat the full 768-control campaign just to gather the same evidence.
7. No `.tgz` re-import is required unless production `src/` changes.
8. Keep public support scope at Scarlett 18i20 (3rd Gen) only while the official Bitfocus repository/name decision remains pending.
