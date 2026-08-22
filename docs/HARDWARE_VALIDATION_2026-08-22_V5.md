# Hardware validation — 2026-08-22 — V5 pair-aware campaign

## Status

This document records the first real-hardware run of campaign revision:

`full-v5-pair-aware-safety-20260822`

Validated hardware remains **Scarlett 18i20 (3rd Gen) only**. This is not evidence for other Focusrite models.

Production module version during the run: **0.1.13**.

## Preflight / harness

- r9 page audit: PASS — 42 SAFE setters, 829 logical feedback probes, 31 feedback definitions
- hardware-tested model profile + module client authorization: PASS
- live shape: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes
- output availability: 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN
- V5 harness: 768 audited controls
- snapshot signature: **`c4ca20cc1b45425b`**

The preceding PREP pass exited 6 with zero hardware writes, as designed.

## Hardware campaign result

Feedback before:

- PASS 113
- EVAL_ONLY 716
- FAIL 0

Feedback after:

- PASS 123
- EVAL_ONLY 706
- FAIL 0

Capability summary:

- BLOCKED_BY_SAFETY 1280
- BLOCKED_FORBIDDEN 3
- EVAL_ONLY 6
- FAIL_MISMATCH 5
- FAIL_NO_EFFECT 18
- MANUAL_PENDING 4
- PASS 41
- PASS_BASELINE 1
- PASS_INDEPENDENT 11
- QUARANTINED_RESTORE 1
- SKIP_AVAILABILITY_UNKNOWN 18
- SKIP_NO_CAPABILITY 16
- UNSUPPORTED 4

Campaign exit: **2**. There was no global HARD ABORT.

## Signal-path safety result

`globalSignalPathSafety` remained **false**.

Server-confirmed safe outputs at the global guard checkpoint:

- Mute-confirmed: 1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25
- Passive Mute-confirmed with availability UNKNOWN and no write: 21, 22, 23, 24

Remaining blockers, all reported as `source-none-unconfirmed`:

**4, 6, 8, 10, 12, 14, 16, 18, 20, 26**

The TestBench must continue treating these outputs as unsafe for signal-changing global tests. Do not infer safety from pair topology alone.

## Output mute observations

`PASS_INDEPENDENT`:

**1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 25**

`FAIL_MISMATCH`:

**2, 4, 6, 8, 10**

`FAIL_NO_EFFECT` for an independently observable mute cycle:

**12, 14, 16, 18, 20, 26**

Availability UNKNOWN / no write:

**21, 22, 23, 24**

Output 7, which was an unresolved odd-member exception in the prior V4 rerun, produced a clean independent mute cycle in this V5 run. Do not use that single run to invent a generic parity rule.

Output 2 did not produce the expected independent mute ON/OFF observations, but a protective Mute ON guard was nevertheless server-confirmed at the global-safety checkpoint. Capability classification and safety-guard classification remain intentionally separate.

## Pair-source observations

Pair 1–2:

- a known pairable source candidate was server-confirmed;
- pair None was server-confirmed;
- original pair restore was server-confirmed;
- final capability status: PASS.

Pairs 3–4 through 19–20 and 25–26 remained blocked from the arbitrary functional pair-source probe because both members did not have confirmed mute safety.

Pairs 21–22 and 23–24 remained availability UNKNOWN/UNKNOWN and received no pair-source write.

The pair-aware safety phase did not establish a server-confirmed pair Source=None guard for the ten blockers listed above. This is a safety result, not proof that those outputs are defective.

## Restoration result

The prior V4 rerun had 14 `QUARANTINED_RESTORE` results, including final Monitor Mute restoration.

V5 reduced this to exactly **1 quarantine**:

- `output:2:source` — functional probe expected source 1255 but observed 0; original restore was not confirmed; safe fallback was attempted.

Monitor Mute finished as `PASS_BASELINE`: protective Mute ON was server-confirmed before signal-path tests and the previous final Monitor Mute restore quarantine did not recur.

V5 deliberately restores original Monitor Mute before the final reconnect and performs no hardware writes after reconnect. This run supports that ordering change, but does not by itself prove the prior reconnect ordering was the sole cause of the old Monitor restore failure.

Because one output source remains quarantined, restore the user's saved normal Focusrite configuration before normal use or another campaign.

## Global-test consequence

Because global output safety remained incomplete, Core signal-changing probes, mixer slot/lane signal-path probes, monitor routing probes and related tests stayed blocked. The 1280 `BLOCKED_BY_SAFETY` rows are deliberate safety skips, not 1280 hardware failures.

## Publication incident

The sanitized report passed the privacy schema/content gate locally, but the old publisher created its report commit in the user's current checkout and then attempted a normal push. The remote validation branch had advanced meanwhile, so Git correctly rejected the non-fast-forward push. No force-push was attempted and the hardware result remained local.

The publisher is being hardened so future reports are committed from an isolated temporary worktree based on the latest remote validation branch. That design must be Windows-gated before it is trusted for the next hardware campaign.

## Safety / product truth retained

- Monitor gain item 1677 remains read-only.
- No input preamp gain action.
- No direct per-input hardware mute claim.
- No per-channel phantom action.
- No Mic Kill.
- No unknown raw item writes.
- No firmware/reset/restore/snapshot writes.
- Feedback/state authority remains server-confirmed only.
- Availability UNKNOWN receives no hardware write.
- Pair behavior remains model/profile + hardware evidence, not a generic even/odd rule.
