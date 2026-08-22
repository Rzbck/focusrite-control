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

The restored normal Focusrite configuration produced a fresh V4 harness:

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

The compact terminal progress output was exercised successfully across output mute, output safety, metadata, output families and mixer-slot phases.

## Global safety result

`Global output safety` remained **incomplete**, so signal-path-dependent Core/mixer/monitor probes were blocked by design.

Compared with the previous V4 run:

- previous `BLOCKED_BY_SAFETY`: 1280
- this run: **1256**

The passive-safety treatment for `availability=UNKNOWN` therefore improved coverage but did **not** resolve the main output-pair safety blocker. The 1256 blocked rows are dependency blocks, not 1256 hardware failures.

## Target-level output evidence from the sanitized report

### Independently observable mute leaders

The following outputs completed an independently observable Mute ON -> OFF cycle with server-confirmed restoration in this run:

**1, 3, 5, 9, 11, 13, 15, 17, 19, 25**.

Their source/nickname and applicable gain/stereo probes were generally functional when safety dependencies allowed them to run.

### Strong paired/follower pattern

Available outputs **2, 4, 6, 8, 10, 12, 14, 16, 18, 20 and 26** did not produce the expected independent mute cycle. Their direct nickname control also consistently produced no independent observable effect. Several source/stereo rows were blocked or quarantined rather than proven independently writable.

This is strong evidence of linked leader/follower or non-owner semantics on those pair members in the tested configuration. It is **not** evidence that those physical outputs are defective, and it must not be generalized to other Focusrite models without hardware evidence.

Output **7** was the main odd-member exception in this run: its mute cycle was `FAIL_MISMATCH`, although protective Mute ON was later confirmed and its other exercised output families remained functional. Treat this as an unresolved observation, not a model rule.

### Availability-unknown outputs

Outputs **21–24** remained `availability=UNKNOWN`. V4 correctly attempted **no writes** on them. Their already server-confirmed Mute ON state was accepted only as a passive safety guard.

## TestBench defect discovered: stereo pair source verifier

The sanitized report showed repeated `output_pair_source` `FAIL_NO_EFFECT` results. Source inspection then found a TestBench verifier defect:

- production `Output: Route stereo pair` intentionally writes the selected **left** source ID to the left output and that source's distinct **right pair ID** to the right output;
- V4 incorrectly expected the right output to report the same left source ID.

Therefore the V4 pair-source failures are not valid evidence that the production pair-routing action failed. The next TestBench revision corrects the verifier and adds explicit pair-aware `test`, `None`, and `restore` actions.

## Monitor Mute restoration observation

The final `monitor:mute` row was `QUARANTINED_RESTORE`: the original Monitor Mute state was not confirmed after the campaign and the protective state could remain ON.

In V4, reconnect validation occurred before the final Monitor Mute restoration. Because cold-start Monitor Mute readback is known to be unreliable/blank until server events occur, the next revision moves original Monitor Mute restoration **before** reconnect and makes reconnect the final no-write/session validation step. This is a TestBench hypothesis to be hardware-validated, not yet a proven protocol conclusion.

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

## Resulting V5 design

The next campaign revision is `full-v5-pair-aware-safety-20260822` and is implemented but not yet Windows-gated or hardware-tested.

V5 adds:

- correct pair-source validation without assuming identical left/right source IDs;
- an explicit pair-source restore action in the generated harness;
- pair-aware `Source=None` safety: when individual mute safety is incomplete, a known hardware-profile pair may be set to None and both server states must confirm 0 before the pair counts as guarded;
- `availability=UNKNOWN` remains strictly no-write;
- per-output sanitized signal-path safety reasons in the shareable report;
- Monitor Mute original-state restore before final reconnect;
- reconnect as a final no-write validation step;
- privacy-gated automatic publication of **completed sanitized shareable reports only** to `docs/hardware-results/LATEST_SHAREABLE.json`.

Raw capability JSON, generated Companion pages and private diagnostics remain local and must never be auto-published.

## Safety / next action

1. Restore/use the saved normal Focusrite configuration after this V4 run because it reported quarantined restore rows.
2. Do **not** run V5 hardware yet.
3. First run a fresh root `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation` and require the complete Windows gate to pass.
4. V5 changes the campaign revision and pair harness, so the next FULL must produce a fresh PREP/page-2 signature; the old `75372604984cf6f4` harness must not be reused.
5. Only after a clean gate and fresh PREP/import should the V5 hardware campaign run.
6. Public hardware support remains Scarlett 18i20 (3rd Gen) only; broader Focusrite architecture remains profile/capability-driven with writes blocked for unvalidated models.
