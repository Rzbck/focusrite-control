# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 11:15 Europe/Paris

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

User ran root `UPDATE_AND_RUN.bat` on 2026-08-22 before the latest isolated-worktree publisher hardening.

Result:

- Node **22.23.2** / Yarn **4.17.0**
- immutable dependencies: **PASS**
- Prettier: **PASS**
- ESLint: **PASS**
- source manifest: **PASS**
- tests: **82/82 PASS**
- Companion package: **PASS** — `focusrite-scarlett-18i20-0.1.13.tgz`
- `UPDATE_AND_RUN`: **SUCCESS**

This Windows-gated the V5 pair-aware TestBench and the first publisher/privacy implementation.

**Important:** the newer publisher fix that publishes from an isolated remote worktree, plus its dirty/behind integration regression test, was implemented after this 82/82 gate. It has passed a local synthetic Git integration test, but it still requires the next Windows `UPDATE_AND_RUN` before being trusted.

Production module `src/` has not changed during the TestBench/publisher work, so no `.tgz` re-import is required.

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

The user uploaded the generated `LATEST_SHAREABLE.json`; it passed the same whitelist/key/content privacy checks used by the publisher: no forbidden live state/variable key, private path, URL/local endpoint, raw XML, serial/hostname/client key/port/connection/client/device ID payload was detected.

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

## Automatic sanitized report publication — incident and fix

The first real V5 publication attempt exposed a workflow bug, not a hardware bug.

Old behavior:

1. privacy gate passed;
2. publisher copied only the sanitized report;
3. publisher committed that report in the user's current validation checkout;
4. the remote branch had advanced because another documentation commit was pushed after the user's last sync;
5. normal push was rejected non-fast-forward;
6. no force-push occurred and the report remained local.

This also left a local report commit/divergence that made the user's normal `git pull --ff-only` recovery awkward.

### Current hardened publisher implementation

`testbench/PublishLatestShareable.js` now:

- retains the validation-branch gate;
- retains the complete privacy schema/content gate;
- fetches the latest remote validation ref before publishing;
- creates an **isolated temporary detached Git worktree based on the latest remote branch**;
- writes/stages/commits only `docs/hardware-results/LATEST_SHAREABLE.json` inside that temporary worktree;
- never commits on, rebases, stashes, resets, or modifies the user's current checkout;
- pushes only `HEAD:refs/heads/testbench/v0.2-hardware-validation` with no force push;
- on a race-condition non-fast-forward rejection, cleans the temporary worktree, fetches the new remote head and retries once;
- removes/prunes the temporary worktree after success, skip or failure;
- still keeps publication failure separate from the hardware campaign exit code.

A new synthetic Git integration regression test reproduces the actual failure mode: the validation checkout is deliberately dirty and behind a separately advanced remote. The helper successfully publishes from the remote-based temporary worktree while preserving the local HEAD and local dirty status unchanged.

Status of this latest hardening:

- syntax check: PASS
- focused synthetic Node/Git publisher tests: PASS 6/6 in development environment
- **Windows full gate pending**
- **real GitHub publication with the user's current V5 report pending**

Do not claim the new publisher fully validated until the next Windows gate and one real standalone publication succeed.

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

1. **Do not run another hardware campaign now.** Existing V5 hardware evidence is sufficient for the current diagnosis.
2. Restore the user's saved normal Focusrite configuration because `output:2:source` remains the single quarantined restore.
3. Recover the user's local Git checkout once, using the already-created backup branch `backup/v5-report-before-rebase`, existing safety stash, and temporary copies of the two launcher files; then align the validation branch to the current remote. Do not force-push.
4. Run root `UPDATE_AND_RUN.bat` on `[1] testbench/v0.2-hardware-validation` and require a complete clean dependencies / Prettier / ESLint / manifest / tests / package gate. Use the actual new test count; do not predict it.
5. No `.tgz` re-import is required because production `src/` did not change.
6. After the clean Windows gate, **do not rerun hardware**. Invoke the new publisher standalone against the existing local `testbench/results/LATEST_SHAREABLE.json`.
7. Confirm `docs/hardware-results/LATEST_SHAREABLE.json` appears on GitHub with revision `full-v5-pair-aware-safety-20260822` and signature `c4ca20cc1b45425b`.
8. Confirm the user's current checkout HEAD/status remain unchanged by publication.
9. Only after that real publication passes should future FULL runs rely on automatic publication without manual upload.
10. Keep the old local report backup branch/stash until the current report is visible and verified on GitHub; clean them only after explicit confirmation.
