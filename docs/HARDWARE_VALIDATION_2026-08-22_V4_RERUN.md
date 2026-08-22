# Hardware validation — 2026-08-22 V4 rerun

Sanitized public-safe record of the second real-hardware V4 Capability Lab campaign on the currently supported **Scarlett 18i20 (3rd Gen)**.

## Validation status

- Hardware-tested model: Scarlett 18i20 (3rd Gen)
- Module version observed by TestBench: 0.1.13
- TestBench campaign revision: `full-v4-capability-lab-20260821`
- Windows gate before this campaign: **68/68 PASS**
- Production module `src/` was unchanged by the TestBench hardening
- This record contains no serial, hostname, client/device IDs, dynamic server port, raw XML/page export, private path, live nickname, or raw diagnostic state

## PREP pass

The current normal Focusrite configuration produced a fresh V4 harness:

- r9 audit: PASS — 42 SAFE setters + 829 feedback probes + 31 feedback definitions
- hardware-tested write profile + own module client authorization: PASS
- live shape: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes
- output availability: **22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN / 0 NO_FLAG**
- generated page-2 harness: **742 batches**
- snapshot signature: `75372604984cf6f4`
- PREP exit code: 6
- **zero hardware writes during PREP**

## Hardware campaign

The imported page 2 matched snapshot `75372604984cf6f4` and the hardware campaign ran to completion without a global HARD ABORT.

Feedback sweep before hardware:

- PASS: 134
- EVAL_ONLY: 695
- FAIL: 0
- total: 829

Feedback sweep after hardware:

- PASS: 135
- EVAL_ONLY: 694
- FAIL: 0
- total: 829

The new compact terminal progress output was exercised successfully across output mute, output safety, metadata, output families and mixer-slot phases.

## Global safety result

`Global output safety` remained **incomplete**, so signal-path-dependent Core/mixer/monitor probes were blocked by design.

Compared with the previous V4 run:

- previous `BLOCKED_BY_SAFETY`: 1280
- this run: **1256**

Therefore the revised passive-safety treatment for `availability=UNKNOWN` improved coverage, but did **not** resolve the main output-safety/pair semantics blocker.

Do not interpret the 1256 blocked rows as 1256 hardware failures.

## Final capability summary

- BLOCKED_BY_SAFETY: **1256**
- BLOCKED_FORBIDDEN: **3**
- EVAL_ONLY: **6**
- FAIL_MISMATCH: **12**
- FAIL_NO_EFFECT: **19**
- MANUAL_PENDING: **4**
- PASS: **46**
- PASS_INDEPENDENT: **10**
- QUARANTINED_RESTORE: **14**
- SKIP_AVAILABILITY_UNKNOWN: **18**
- SKIP_NO_CAPABILITY: **16**
- UNSUPPORTED: **4**

Exit code: **2**.

The console summary alone is insufficient to assign the new 12 `FAIL_MISMATCH`, 19 `FAIL_NO_EFFECT`, and 14 `QUARANTINED_RESTORE` rows to exact targets. Diagnose those only from the sanitized `LATEST_SHAREABLE.json` from this campaign before changing hardware logic.

## Safety / next action

- Do **not** immediately rerun FULL.
- Reload the user's saved normal Focusrite configuration before normal use because the campaign reported 14 quarantined restore results.
- Obtain and inspect `testbench/results/LATEST_SHAREABLE.json` from this exact run.
- Keep the private raw `capability-lab_*.json` local.
- Do not classify paired/right outputs as defective until the shareable target-level evidence is reviewed.
- Current public hardware support remains Scarlett 18i20 (3rd Gen) only; broader Focusrite architecture remains profile/capability-driven with writes blocked for unvalidated models.
