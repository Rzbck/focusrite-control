# Current handoff — Focusrite Control / Companion

Updated: 2026-08-22 14:30 Europe/Paris

Read `AI_PROJECT_RULES.md` and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current code override older assumptions.

## Scope / publication

- Hardware support actually validated remains **Focusrite Scarlett 18i20 (3rd Gen) only**.
- Module/package development version remains **0.1.13**.
- Working branch: `testbench/v0.2-hardware-validation`.
- Official Bitfocus repository/name remains pending; Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Capability/profile-driven architecture is not a broader hardware-support claim.
- Unknown/unvalidated Focusrite models remain read-only discovery/research only; writes require explicit hardware-tested/write-enabled profile evidence.
- Stable public release target remains v1.0.0 after official repository/naming, CI and hardware/action audit.

## Permanent safety / privacy rules

Never invent or expose analogue input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, physical Monitor level control, arbitrary raw writes, firmware/reset/restore/snapshot commands or writes to read-only status/meter items.

Monitor gain item **1677 remains read-only**. It may be observed while the user physically moves the Monitor knob; there must be no Monitor set/adjust action, preset or raw-write path without new hardware proof.

Also preserve:

- dynamic Focusrite Control Server port/device ID; never hardcode them;
- writes blocked until Remote Devices authorization matches this module's own server-assigned client ID;
- feedback/state only from server-confirmed state, never optimistic success;
- availability `UNKNOWN` = no write;
- no public serial/hostname/client key/client or device IDs/raw XML/private captures/private Companion export/local diagnostics/user paths;
- relevant MIT/third-party attribution;
- public Bitfocus source clean; local Windows/TestBench tooling remains separate from production behavior.

## TestBench doctrine

Canonical FULL is a **device-wide capability campaign**, not a collection of permanent one-off probes.

- Targeted probes are temporary research tools only.
- Useful targeted evidence must be generalized across all applicable targets before the next broad campaign.
- Report behavior per target/pair; do not infer a generic odd/even/follower rule from a single sample.
- Every public feedback instance needs an explicit validation status.
- Current r9 scope is **829 logical feedback probes / 31 definitions**.
- Reversible feedbacks should be validated during the transitions that exercise them, not only in static before/after sweeps.
- Physical/manual controls require guided manual phases and remain `MANUAL_PENDING` if not actually exercised.
- Meter feedbacks use numeric server meter state + configured threshold; real two-state signal exercise is separate evidence.

## Production module state

Production `src/` has **not changed** during V5, publisher work, pair3–4 research or the V6 TestBench work.

Current package version remains 0.1.13. No `.tgz` re-import is required for current TestBench-only work.

Current production `output_pair_source` still requests source `0` on both pair members for Pair Source=None. Do not change production semantics until the device-wide evidence is intentionally translated into a reviewed production model.

## Canonical validation surfaces

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

Snapshot-specific and Git-ignored/private.

Latest V6 hardware campaign used:

- 768 audited controls;
- snapshot signature `0952a7b921b71e89`.

## Cold-start / SAFE evidence

Core cold-start remains 3/21 present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim remain absent at cold start. Latest automated SAFE remains 3 PASS / 0 FAIL / 18 SKIP. Earlier guarded work separately validated all 21 Core write paths. Never warm state by writing or invent missing state.

## Historical V5 result

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V5.md`.

V5 established the earlier safety/mute patterns and one Output2 source quarantine. After V5, the user explicitly restored the saved normal Focusrite configuration. Treat that V5 quarantine as historical evidence, not current live state.

## Historical targeted pair3–4 result

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_PAIR34.md`.

Pair3–4 showed `ZERO_ORIGINAL` after Pair Source=None for at least four seconds and restored exactly. This closed the timing hypothesis but was not the final architecture direction.

## Latest hardware campaign — FULL V6 — 2026-08-22

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V6.md`.

Canonical sanitized report: `docs/hardware-results/LATEST_SHAREABLE.json`.

Revision:

`full-v6-device-wide-topology-feedback-20260822`

Preflight:

- r9 audit PASS;
- module 0.1.13 PASS;
- exact hardware-tested profile + own authorization PASS;
- shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- Page2 768 controls / snapshot `0952a7b921b71e89`;
- user explicitly confirmed `ALL_ISOLATED`.

### Pair topology — major hardware result

Eleven AVAILABLE/observable pairs were exercised with immediate exact pair restore. Pairs 21–22 and 23–24 were availability UNKNOWN and received no topology write.

Every exercised pair showed the same server-confirmed pattern:

- route: `REQUESTED_ORIGINAL`;
- Pair Source=None: `ZERO_ORIGINAL`;
- typical timeline: `OTHER_ORIGINAL > ZERO_ORIGINAL`;
- exact original pair restore confirmed through the pair action path.

Hardware-tested interpretation for this Scarlett 18i20 (3rd Gen) state/configuration: pair operations are not behaving like two independently writable source controls. The left member changes; the right member remains on its original server-reported source.

This is now device-wide evidence for the exercised 18i20 pairs, not merely a pair3–4 observation. Do **not** generalize it to other Focusrite models without hardware evidence.

### Global signal-path safety

`globalSignalPathSafety = false`.

Remaining blockers:

- Out4 `source-none-unconfirmed`;
- Out6 `source-none-unconfirmed`;
- Out8 `source-none-unconfirmed`;
- Out10 `source-none-unconfirmed`.

Outputs21–24 remained availability UNKNOWN/no write and only had passive server-confirmed Mute ON guards.

### V6 summary

- BLOCKED_BY_SAFETY 1260;
- BLOCKED_FORBIDDEN 3;
- EVAL_ONLY 6;
- FAIL_MISMATCH 11;
- FAIL_NO_EFFECT 13;
- MANUAL_PENDING 6;
- PASS 63;
- PASS_BASELINE 8;
- PASS_INDEPENDENT 11;
- QUARANTINED_RESTORE 13;
- SKIP_AVAILABILITY_UNKNOWN 22;
- SKIP_NO_CAPABILITY 16;
- UNSUPPORTED 4;
- exit 2;
- no global HARD ABORT;
- sanitized report publication succeeded.

### Thirteen restore quarantines

The 13 `QUARANTINED_RESTORE` rows were:

- Out2 source;
- Out12 source + stereo;
- Out14 source + stereo;
- Out16 source + stereo;
- Out18 source + stereo;
- Out20 source + stereo;
- Out26 source + stereo.

These occurred **after** the device-wide topology phase had already confirmed exact pair restoration. The current diagnosis is a TestBench modeling defect: later individual-output tests still used mute alias detection to decide ownership and therefore treated some pair-owned/right-member controls as independently writable/restorable.

Operational rule after this V6 run: **restore the saved normal Focusrite configuration before reconnecting downstream outputs. Do not rerun V6 unchanged.**

### Output mute evidence

`FAIL_MISMATCH` occurred on Outputs 2,4,6,8,10,12,14,16,18,20,26. Eleven other outputs were `PASS_INDEPENDENT`.

Mute behavior alone is not a reliable ownership detector and must not drive pair-side classification by itself.

### Feedback evidence

Feedback before: 177 PASS / 652 EVAL_ONLY / 0 FAIL.

Feedback after: 180 PASS / 649 EVAL_ONLY / 0 FAIL.

All 31 definitions have an independent oracle mapping, but V6 is **not** complete dynamic validation of all 829 probes because the old global-safety gate still blocked many mixer/lane transitions. In particular, the large `mix_mute`/`mix_solo` surfaces were not dynamically exercised.

### Manual meter phase

The user performed READY with real silence → signal activity → silence. Sanitized both-state meter coverage still reported `0/46`, so the row remains `MANUAL_PENDING`; no false PASS is claimed. A more targeted meter exercise is required.

### Manual Monitor gain 1677

Physical Monitor movement was observed through the read-only server variable. Exact return to the identical starting server value was not confirmed, so the row remains `MANUAL_PENDING`.

This proves readback movement was observable but does **not** create any Monitor write capability.

## V6 defects that must be fixed before another broad hardware run

1. Runtime pair topology must drive ownership decisions; do not use mute alias detection alone.
2. Once a pair has demonstrated right-member pair ownership, do not run direct right-member source/stereo functional writes as if independent.
3. `ALL_ISOLATED` currently protects only the topology sweep; mixer/lanes/monitoring are still blocked by old `globalSafety`, causing 1260 blocked rows.
4. Under explicit physical isolation, reversible signal-path tests may run only with exact local snapshot/restoration and HARD ABORT on the first unconfirmed restore.
5. Core/isolated helper restore quarantine must never be overwritten by a later PASS/FAIL status.
6. Feedback validation must observe rendered feedback during the corresponding action transitions so reversible probes can demonstrate both states.
7. Manual meter testing needs a targeted signal plan rather than one generic 20-second window.
8. Monitor readback capability should distinguish “movement observed” from “exact physical return value reproduced”; the return prompt remains required for user safety.

## Software validation state

Before V6 hardware, a whole-repository Windows run reached:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- 101/102 tests PASS;
- sole failure was a wording/Markdown false-positive in the new AI-rules regression test;
- package step was not reached.

After fixing that regression test, the targeted V6 suite passed **8/8** on Windows.

Therefore do **not** describe the current branch as a fully green release/package gate yet. Production `src/` is unchanged, but the next software revision must receive one clean whole-repository gate before any further hardware run.

## Required next sequence

1. User restores the saved normal Focusrite configuration while outputs remain isolated; only then reconnect downstream equipment.
2. **No more hardware now. Do not rerun V6 unchanged.**
3. Preserve V6 as hardware evidence; do not delete or rewrite the sanitized result/history.
4. Build the next TestBench revision from runtime pair-ownership evidence plus the validated profile topology.
5. Skip/reclassify pair-owned right-member source/stereo direct writes and avoid duplicate pair-source probes already covered by topology.
6. Allow reversible Core/mixer/lane/monitoring work under explicit `ALL_ISOLATED` only with exact local restoration and immediate HARD ABORT on restore failure.
7. Add dynamic feedback observation during transitions, especially mix_mute/mix_solo and other reversible feedbacks.
8. Improve manual meter and Monitor readback reporting.
9. Run one clean `UPDATE_AND_RUN.bat` after those software changes; diagnose the full chain once if it fails.
10. Only after a green software gate and renewed explicit isolation agreement should another broad hardware campaign run.
11. Keep public support scope at Scarlett 18i20 (3rd Gen) until other devices are physically validated and the official Bitfocus repository/name decision is made.
