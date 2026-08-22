# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 13:00 Europe/Paris

This is the living resume point. Read it before proposing code, tests, branch changes, hardware work or publication changes. Newer explicit hardware evidence and current code override older assumptions.

## Scope / publication

- **Hardware support actually validated remains Scarlett 18i20 (3rd Gen) only.**
- Module/package development version remains **0.1.13**.
- Working branch: **`testbench/v0.2-hardware-validation`**.
- Official Bitfocus repository/name is still pending. Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and broader Focusrite coverage may be appropriate later.
- Architecture is capability/profile-driven, but broader architecture is **not** a claim of broader hardware support.
- Unknown/unvalidated models remain read-only discovery/research only; writes require an explicit hardware-tested/write-enabled profile.
- Stable public release target remains **v1.0.0** after the official repo/naming decision, CI and hardware/action audit.

## Permanent safety rules

Never invent or expose:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level control;
- arbitrary/unknown raw item writes;
- firmware/reset/restore/snapshot commands.

Monitor gain item **1677 remains read-only**. Do not add Monitor set/adjust actions, presets or raw-write access without new hardware proof.

Also preserve:

- dynamic Focusrite Control Server port and device ID; never hardcode them;
- writes blocked until Focusrite Control Remote Devices authorization matches this module's own server-assigned client ID;
- feedback/state only from server-confirmed state; no optimistic fake success;
- unknown output availability gets **no write**;
- private serial/hostname/client key/raw captures/private XML/diagnostics/user paths never go public;
- generated Companion harness pages and the user's live r9 page remain private;
- relevant MIT/third-party attribution remains preserved;
- public source stays standard for Bitfocus; local Windows/TestBench tooling remains separate from production module behavior.

## Production module state

Production `src/` has **not changed** during the V5/publisher/pair-probe work.

Current package version remains **0.1.13**.

Therefore:

- no `.tgz` re-import is required for TestBench-only changes;
- no production feature claim should be changed solely from TestBench infrastructure work;
- `output_pair_source` currently handles source `0` by requesting `0` on both left and right pair members;
- feedback remains server-confirmed only.

## Canonical validation surfaces

### Page 1 — live r9 matrix

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified:

- 46 × 26 / 1196 controls;
- 42/42 SAFE Core setters;
- 829 logical feedback probes / 31 definitions;
- normal `T` + inverted `F` pairs;
- feedback probe cells contain zero actions.

Never publish this page.

### Page 2 — generated private capability harness

`testbench/generated/FULL_EXTENDED.companionconfig`

The harness is snapshot-specific and Git-ignored/private.

V5 hardware campaign used:

- revision `full-v5-pair-aware-safety-20260822`;
- signature `c4ca20cc1b45425b`;
- 768 controls.

The later targeted pair 3–4 probe regenerated/imported Page 2 with:

- 768 audited controls;
- snapshot signature `0952a7b921b71e89`.

Do not treat either signature as permanent; a changed live snapshot can require a regenerated Page 2.

## Cold-start / SAFE evidence

Core cold-start remains **3/21 present**:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Missing at cold start:

- Air 1–8;
- Pad 1–8;
- Monitor Mute;
- Monitor Dim.

Latest automated SAFE remains **3 PASS / 0 FAIL / 18 SKIP**. Earlier guarded hardware work separately validated all 21 Core write paths. Never warm state by writing or invent missing state for production feedback.

## Latest complete FULL hardware campaign — V5 — 2026-08-22

Detailed record:

`docs/HARDWARE_VALIDATION_2026-08-22_V5.md`

Canonical sanitized report:

`docs/hardware-results/LATEST_SHAREABLE.json`

Revision/signature:

- `full-v5-pair-aware-safety-20260822`;
- `c4ca20cc1b45425b`.

Preflight:

- r9 audit PASS;
- module 0.1.13 PASS;
- exact hardware-tested profile + own authorization PASS;
- shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- 768 batches.

Hardware run:

- feedback-before **113 PASS / 716 EVAL_ONLY / 0 FAIL**;
- feedback-after **123 PASS / 706 EVAL_ONLY / 0 FAIL**;
- no global HARD ABORT;
- `globalSignalPathSafety = false`;
- BLOCKED_BY_SAFETY 1280;
- FAIL_MISMATCH 5;
- FAIL_NO_EFFECT 18;
- PASS 41;
- PASS_BASELINE 1;
- PASS_INDEPENDENT 11;
- QUARANTINED_RESTORE 1;
- SKIP_AVAILABILITY_UNKNOWN 18;
- exit 2.

### V5 signal-path safety

Server-confirmed safe at the global checkpoint:

- mute-confirmed: **1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25**;
- availability UNKNOWN but passive Mute ON confirmed, no writes: **21, 22, 23, 24**.

Remaining blockers were all `source-none-unconfirmed`:

**4, 6, 8, 10, 12, 14, 16, 18, 20, 26**.

Do not loosen the both-member safety rule without new server-confirmed evidence.

### V5 output mute classification

`PASS_INDEPENDENT`:

**1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25**.

`FAIL_MISMATCH`:

**2, 4, 6, 8, 10**.

`FAIL_NO_EFFECT` independent cycle:

**12, 14, 16, 18, 20, 26**.

Availability UNKNOWN / no write:

**21, 22, 23, 24**.

Do not infer a generic odd/even rule from this pattern.

### V5 pair-source result

Pair 1–2: **PASS** — known pairable source candidate, pair None and original pair restore were server-confirmed.

Pairs 3–4 through 19–20 and 25–26: functional pair-source probe remained blocked because both members did not have confirmed mute safety.

Pairs 21–22 and 23–24: availability UNKNOWN/UNKNOWN, no pair-source write.

### V5 restoration result

V5 had exactly one restore quarantine:

- `output:2:source` — functional probe expected a non-zero source but observed `0`; original restore was not confirmed; safe fallback attempted.

**After V5, the user explicitly restored the saved normal Focusrite configuration before the targeted pair 3–4 probe.** Treat the old V5 Output 2 quarantine as cleared by that manual saved-configuration restore, not as the current live state.

## Targeted hardware probe — Outputs 3–4 — 2026-08-22

Detailed record:

`docs/HARDWARE_VALIDATION_2026-08-22_PAIR34.md`

Canonical sanitized result:

`docs/hardware-results/LATEST_PAIR34_PROBE.json`

Probe revision:

`pair34-source-none-observer-v1-20260822`

Purpose: determine whether V5 Output 4 `source-none-unconfirmed` was merely a verification-timing problem.

Preconditions:

- saved normal Focusrite configuration restored;
- physical Outputs 3–4 isolated;
- exact Scarlett 18i20 (3rd Gen) profile detected;
- own module client authorised;
- Outputs 3 and 4 AVAILABLE;
- exact original source state for both members server-confirmed before write;
- explicit hardware-write + physical-isolation flags required;
- Page 2 audited at 768 controls / snapshot `0952a7b921b71e89`.

Observed after one audited pair Source=None action:

- ~2 ms: Output 3 `original`, Output 4 `original`;
- ~104 ms: Output 3 `zero`, Output 4 `original`;
- ~505 ms: Output 3 `zero`, Output 4 `original`;
- ~1505 ms: Output 3 `zero`, Output 4 `original`;
- ~4003 ms: Output 3 `zero`, Output 4 `original`.

Final sanitized result:

- `outcome = ZERO_ORIGINAL`;
- `noneConfirmed = false`;
- `restoreConfirmed = true`;
- `fallbackNoneConfirmed = false`;
- `probeCompletedWithoutException = true`.

Publication to GitHub succeeded in one attempt.

### Pair 3–4 interpretation

**Hardware-tested:** for the tested Outputs 3–4 state/configuration, Pair Source=None does not produce server-confirmed `0` on both members. Output 3 becomes `0`; Output 4 remains on its original server-reported source for at least four seconds.

Therefore **verification timing is no longer a credible primary explanation** for Output 4's V5 blocker.

Current production `output_pair_source` explicitly requests `0` on both pair members, so the right-member requested write and server-confirmed state diverge on this pair.

Do **not** generalize this to every right/even output: pair 1–2 behaved differently in V5.

Do **not** assume Output 4 is physically silent merely because Output 3 reports `0`. The project safety model remains server-confirmed and Output 4 remains unsafe without its own confirmed mute/source-none guard.

The targeted probe restored the exact original Outputs 3–4 source state and server-confirmed the restore. The physical 3–4 isolation used for the probe is no longer required after the test unless another targeted write probe is run.

## TestBench pair-safety hardening after V5

Current TestBench code now:

- keeps `output-pair:X-Y:safety` separate from functional `output-pair:X-Y:source`;
- records expected/observed member values in private diagnostics;
- refuses pair Source=None safety writes when exact original sources are unknown;
- restores the original pair immediately after a failed pair-safety attempt;
- quarantines if exact restoration is not confirmed;
- never treats an unconfirmed right member as safe.

These changes were Windows-gated before the targeted probe.

## Current software validation state

Strongest fully green whole-repository Windows gate before the targeted probe additions:

- Node 22.23.2 / Yarn 4.17.0;
- immutable `yarn.lock`: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- tests: **88/88 PASS**;
- Companion package: PASS — `focusrite-scarlett-18i20-0.1.13.tgz`.

After adding the targeted pair probe, one whole-repo run reached:

- Format PASS;
- ESLint PASS;
- Manifest PASS;
- **93/94 tests PASS**;
- the sole failure was a proven false-positive test that matched the literal `<set` text inside the probe's privacy-deny regex, not a direct protocol write.

That false-positive test was corrected, then the targeted probe suite was run on Windows:

- **6/6 PASS**.

The current branch also contains post-probe documentation and a guarded `PAIR34` launcher-menu integration. A fresh whole-repository `UPDATE_AND_RUN.bat` has **not yet been run after those latest commits**.

Therefore:

- do not call the current branch fully 94/94-gated yet;
- before packaging/release/promotion, run one normal whole-repo `UPDATE_AND_RUN.bat` and require all gates clean;
- no package re-import is needed unless `src/` changes.

## Normal Windows workflow

`UPDATE_AND_RUN.bat` remains the normal non-hardware sync/build/validation entry point. It must not run hardware tests.

Root `RUN_TESTBENCH.bat` remains the single hardware-test shortcut and delegates to:

`testbench/RUN_SAFE_HARDWARE_TESTS.cmd`

The canonical launcher now offers:

- `SAFE` — approved Core hardware tests;
- `FULL` — full capability campaign;
- `PAIR34` — targeted Outputs 3–4 Source=None research probe.

`PAIR34` requires a second interactive confirmation: the user must type `ISOLATED`, explicitly confirming that the normal saved Focusrite config is restored, physical Outputs 3–4 are isolated and the temporary routing change is authorised.

The probe itself still independently requires its explicit write/isolation flags and exact restore preconditions.

Do not bypass the canonical launcher for normal future use unless diagnosing the launcher itself.

## Automatic sanitized publication

### FULL

After a completed FULL, the canonical launcher invokes `PublishLatestShareable.js` automatically.

Publisher contract:

- restricted to `testbench/v0.2-hardware-validation`;
- completed sanitized report only;
- strict privacy whitelist/content scan;
- isolated temporary detached worktree based on latest remote branch;
- only the sanitized public report is staged/committed;
- current checkout is not stashed/rebased/reset/committed;
- no force push;
- one safe retry on non-fast-forward race;
- cleanup/prune after completion.

Canonical FULL machine-readable result:

`docs/hardware-results/LATEST_SHAREABLE.json`.

### Pair 3–4 probe

The targeted probe validates its own restricted sanitized schema and publishes:

`docs/hardware-results/LATEST_PAIR34_PROBE.json`.

Future analysis should read published sanitized results directly from GitHub. Do not ask the user to upload raw private `capability-lab_*.json` data unless publication itself fails, and never publish those raw files.

## Dependency / line-ending state

- root `yarn.lock` is versioned;
- `UPDATE_AND_RUN` uses immutable dependency installation;
- `/.yarn/` and `Desktop.ini` are ignored;
- `.gitattributes` stores text as LF and checks `.bat`/`.cmd` out as CRLF on Windows;
- the prior false-modified Windows launcher problem is fixed.

## Multi-device direction

Correct architecture boundary:

- Control Server transport/session: generic where evidence supports it;
- capability discovery: generic;
- TestBench/report engine: generic/profile-driven;
- model shape, pairing, safe writes and quirks: explicit profile/evidence;
- unvalidated device: read-only discovery only, no hardware writes;
- public support list: only hardware actually tested.

## Required next sequence

1. **Do not run another FULL hardware campaign just to reproduce V5.**
2. Treat the targeted pair 3–4 result as hardware evidence that the right-member Source=None failure persists for at least four seconds and restores cleanly.
3. Keep Output 4 unsafe for global signal-path safety; do not weaken both-member confirmation.
4. Do not change production `output_pair_source` semantics from this single pair result yet.
5. Next technical hypothesis to test is **pair topology/current stereo-link semantics vs right-member write ownership/reporting**, especially because pair 1–2 behaved differently from pair 3–4.
6. Prefer another narrow reversible probe only if it distinguishes that hypothesis; do not run 768 controls again.
7. Before any new targeted write probe, require fresh explicit physical-isolation agreement and exact restoration preconditions.
8. At a convenient checkpoint before package/release work, run one normal `UPDATE_AND_RUN.bat` to prove the current post-probe branch fully clean. Do not repeatedly gate after every research observation.
9. No `.tgz` re-import unless production `src/` changes.
10. Keep public support scope at Scarlett 18i20 (3rd Gen) only while the official Bitfocus repository/name decision remains pending.
