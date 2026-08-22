# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 13:04 Europe/Paris

This is the living resume point. Read `AI_PROJECT_RULES.md` and this file before proposing code, tests, branch changes, hardware work or publication changes. Newer explicit hardware evidence and current code override older assumptions.

## Scope / publication

- **Hardware support actually validated remains Scarlett 18i20 (3rd Gen) only.**
- Module/package development version remains **0.1.13**.
- Working branch: **`testbench/v0.2-hardware-validation`**.
- Official Bitfocus repository/name remains pending. Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Architecture/TestBench may be capability/profile-driven for future Focusrite Control devices, but that is not a support claim.
- Unknown/unvalidated models remain read-only discovery/research only; hardware writes require an explicit hardware-tested/write-enabled profile.
- Stable public release target remains **v1.0.0** after official repository/naming, CI and hardware/action audit.

## Permanent safety rules

Never invent or expose:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level control;
- arbitrary/unknown raw item writes;
- firmware/reset/restore/snapshot commands.

Monitor gain item **1677 remains read-only**. It may be observed while the user physically moves the Monitor control, but there must be no Monitor set/adjust action, preset or raw-write path without new hardware proof.

Also preserve:

- dynamic Focusrite Control Server port and device ID; never hardcode them;
- writes blocked until Remote Devices authorization matches this module's own server-assigned client ID;
- feedback/state only from server-confirmed state; no optimistic fake success;
- availability `UNKNOWN` gets **no write**;
- private serial/hostname/client key/raw captures/private XML/diagnostics/user paths never go public;
- generated Companion harness pages and the user's live r9 page remain private;
- relevant MIT/third-party attribution;
- public source standard for Bitfocus; local Windows/TestBench tooling stays separate from production behavior.

## New AI/TestBench doctrine — source of truth

`AI_PROJECT_RULES.md` was explicitly hardened on 2026-08-22 after the targeted pair 3–4 research work.

Required rule now:

- canonical FULL is a **device-wide capability campaign**;
- a one-output/one-pair probe is only a temporary hypothesis test;
- a targeted result must never become the normal launcher, hardware model, odd/even rule or generic follower assumption;
- useful targeted evidence must be generalized across **all applicable targets** before the next broad hardware campaign;
- every public feedback instance must have an explicit validation status;
- current r9 scope is **829 logical probes / 31 definitions**;
- independent server state should be used as feedback oracle wherever possible;
- controls/feedbacks requiring real physical interaction must have a guided manual phase and remain `MANUAL_PENDING` if not actually exercised;
- meter feedbacks require numeric server meter vs threshold validation plus real signal/silence dynamics where practical;
- Monitor gain 1677 is manual read-only observation only.

Do not regress this rule.

## Production module state

Production `src/` has **not changed** during V5, publisher, pair3–4 research, or the current V6 TestBench preparation.

Current package version remains **0.1.13**.

Therefore:

- no `.tgz` re-import is required for the current TestBench-only work;
- no production feature claim changes solely from TestBench infrastructure;
- `output_pair_source` currently requests source `0` on both left and right members for Pair Source=None;
- feedback remains server-confirmed only.

## Canonical validation surfaces

### Page 1 — live r9 matrix

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified:

- 46 × 26 / 1196 controls;
- 42/42 SAFE Core setters;
- 829 logical feedback probes / 31 definitions;
- normal `T` + inverted `F` feedback pairs;
- feedback probe cells contain zero actions.

Never publish this page.

### Page 2 — generated private capability harness

`testbench/generated/FULL_EXTENDED.companionconfig`

Snapshot-specific and Git-ignored/private.

V5 hardware campaign used 768 controls / signature `c4ca20cc1b45425b`.
The later pair3–4 diagnostic used 768 controls / snapshot `0952a7b921b71e89`.

V6 reuses the already-audited pair test-A/test-B/None/restore and individual restore action families. A changed live snapshot may still require Page 2 regeneration/import before hardware.

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

## Latest completed broad hardware campaign — V5 — 2026-08-22

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

Hardware result:

- feedback-before **113 PASS / 716 EVAL_ONLY / 0 FAIL**;
- feedback-after **123 PASS / 706 EVAL_ONLY / 0 FAIL**;
- `globalSignalPathSafety = false`;
- blockers Out4,6,8,10,12,14,16,18,20,26 all `source-none-unconfirmed`;
- output mute `PASS_INDEPENDENT`: 1,3,5,7,9,11,13,15,17,19,25;
- availability UNKNOWN/no write: 21–24;
- pair 1–2 pair-source path PASS;
- exactly one restore quarantine: `output:2:source`;
- exit 2; no global HARD ABORT.

After V5 the user explicitly restored the saved normal Focusrite configuration. Do not treat the old Output2 quarantine as current live state.

## Targeted hardware evidence — Outputs 3–4 — 2026-08-22

Detailed record:

`docs/HARDWARE_VALIDATION_2026-08-22_PAIR34.md`

Canonical sanitized result:

`docs/hardware-results/LATEST_PAIR34_PROBE.json`

This probe existed only to test whether Output4's V5 `source-none-unconfirmed` was a short verification delay.

Observed after Pair Source=None:

- ~2 ms: Out3 original / Out4 original;
- ~104 ms: Out3 zero / Out4 original;
- ~505 ms: zero / original;
- ~1505 ms: zero / original;
- ~4003 ms: zero / original.

Result:

- `ZERO_ORIGINAL`;
- `noneConfirmed = false`;
- exact original restore confirmed;
- no exception;
- publication succeeded.

**Hardware-tested conclusion for pair 3–4 only:** the right-member mismatch persists for at least four seconds; simple propagation delay is not a credible primary explanation. Do not generalize to every right/even output because pair 1–2 behaved differently.

The pair3–4 code remains a historical/regression research tool only. It is **not** a normal launcher mode.

## V6 device-wide TestBench — implemented, NOT hardware-run yet

Plan/documentation:

`docs/TESTBENCH_V6_DEVICE_WIDE_PLAN.md`

V6 campaign revision:

`full-v6-device-wide-topology-feedback-20260822`

### Device-wide topology

`testbench/FullTestBenchTopologyV6.js` now enumerates `profile.outputPairs`; there is no pair3–4 constant in the sweep.

For every applicable pair it:

- skips missing capability/unavailable/availability UNKNOWN;
- requires exact original source values;
- rechecks live state against the snapshot before write;
- uses audited pair source A/B actions;
- samples Pair Source=None at ~0/100/500/1500/4000 ms;
- restores in `finally`;
- first verifies pair restore;
- if needed, tries the two audited individual output-source restore actions toward the exact known originals and verifies both;
- if exact restoration still fails, attempts both-member None fallback, records quarantine and raises `TOPOLOGY RESTORE FAILED` so the broad campaign HARD ABORTS before another topology write;
- records per-pair route/None behavior without parity inference.

Availability UNKNOWN remains **no write**.

### Feedback coverage

`testbench/FullTestBenchFeedbackV6.js` provides independent oracle mappings for all **31 current public feedback definitions**.

The normal before/after sweeps now compare all 829 rendered logical probes against server-confirmed state wherever available.

Meters are no longer automatically classified `EVAL_ONLY`: expected state is computed from the real numeric server meter value and the configured threshold.

A dedicated regression test requires all 31 current definition families to have a non-`unmapped` oracle.

### Guided manual feedback phase

Normal FULL enables `--manual-feedback`.

Meter dynamics:

- user may type `READY` or `SKIP`;
- READY opens an approximately 20 s read-only signal/silence observation window;
- no routing writes occur in this manual phase;
- each meter feedback is compared with its numeric server oracle;
- both T/F threshold states are tracked;
- unexercised paths remain `MANUAL_PENDING`, never fake PASS.

Monitor gain item 1677:

- read-only `monitor_gain` observation only;
- user physically moves Monitor control and types `MOVED`;
- TestBench observes server value change;
- user is **always** prompted to return the physical knob to its start position after MOVED, even if no change was observed;
- exact starting server value is observed again where possible;
- no Monitor gain software write exists.

### Normal launcher

`RUN_TESTBENCH.bat` remains the root hardware shortcut and delegates to `testbench/RUN_SAFE_HARDWARE_TESTS.cmd`.

Normal menu is again only:

- `SAFE`;
- `FULL`.

`PAIR34` was removed from the normal menu.

FULL V6 requires the user to type `ALL_ISOLATED`, explicitly confirming before any device-wide routing sweep that:

- saved normal config is restored;
- all physical outputs that could carry audio are disconnected or safely muted/isolated downstream;
- headphones/monitoring are at a safe level;
- temporary routing changes and guided manual phase are authorised.

The runner independently also requires `--confirm-all-output-routing-isolated`.

## Excluded/disruptive surfaces

Normal FULL still does not automatically change:

- device routing preset;
- clock source;
- sample rate;
- S/PDIF mode;
- firmware/reset/restore/snapshot;
- unknown/raw items;
- Monitor gain 1677;
- invented input gain/input mute/per-channel phantom/Mic Kill.

Their current-state feedback may be compared against server state without changing the disruptive setting. A dedicated state-changing test requires separate explicit agreement.

## Software validation status — IMPORTANT

Last fully green whole-repository Windows gate before targeted-probe/V6 additions:

- Node 22.23.2 / Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **88/88 tests PASS**;
- package PASS `focusrite-scarlett-18i20-0.1.13.tgz`.

After pair-probe additions, one whole-repo run reached 93/94 with one proven false-positive test; that test was corrected and the targeted probe suite then passed **6/6** on Windows.

**Current V6 device-wide code has NOT yet had a whole-repository Windows `UPDATE_AND_RUN` gate.**

Therefore do not claim V6 software validation or hardware readiness yet. No V6 hardware write has occurred.

## Publication

Completed FULL sanitized report still publishes automatically via `PublishLatestShareable.js` from the validation branch using the isolated-worktree/no-force workflow.

Canonical result:

`docs/hardware-results/LATEST_SHAREABLE.json`

Future analysis should read the published sanitized report directly from GitHub. Do not ask for raw private `capability-lab_*.json` unless publication itself fails; never publish those raw files.

## Dependency / line-ending state

- root `yarn.lock` versioned;
- `UPDATE_AND_RUN` uses immutable install;
- `.gitattributes` stores normal text LF and checks `.bat`/`.cmd` out CRLF on Windows;
- prior false-modified launcher issue fixed.

## Multi-device boundary

- Control Server transport/session: generic where evidence supports it;
- capability discovery: generic;
- TestBench/report engine: generic/profile-driven;
- model shape, pairing, safe writes and quirks: explicit profile/evidence;
- unvalidated device: read-only discovery only, no hardware writes;
- public support list: only hardware actually tested.

Do not claim another Focusrite model from generic V6 architecture alone.

## Required next sequence

1. **No hardware yet.**
2. Run exactly one normal whole-repository `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation` and require dependencies, Prettier, ESLint, manifest, all tests and package to pass.
3. If that gate fails, STOP and diagnose the exact full failure chain; do not start hardware and do not ask for repeated speculative gates.
4. If it passes, update this handoff with the actual test count/result.
5. No `.tgz` re-import is required because `src/` is unchanged.
6. Then run normal `RUN_TESTBENCH.bat` → `FULL` only after the user's explicit physical `ALL_ISOLATED` conditions are genuinely true.
7. If Page2 is `PREP REQUIRED`, replace only Page2 with the newly generated private `FULL_EXTENDED.companionconfig`, remap the target to the existing Focusrite connection, then rerun the same launcher.
8. Follow the meter `READY/SKIP` and Monitor `MOVED/return` prompts one at a time.
9. After completed FULL, read the automatically published sanitized GitHub report and analyze the complete per-pair + feedback/manual matrix.
10. Keep support scope at Scarlett 18i20 (3rd Gen) while official Bitfocus repo/naming remains pending.
