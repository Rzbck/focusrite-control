# Hardware validation — targeted Output 3–4 pair Source=None probe

Date: 2026-08-22

Model: **Focusrite Scarlett 18i20 (3rd Gen)** only.

Module version under test: **0.1.13**.

Probe revision: `pair34-source-none-observer-v1-20260822`.

Canonical sanitized machine-readable result:

`docs/hardware-results/LATEST_PAIR34_PROBE.json`

## Purpose

This probe was created after the V5 FULL campaign showed that Output 4 could not obtain a server-confirmed mute or Source=None safety guard. The goal was to distinguish a true right-member Source=None failure from a simple verification-timing problem.

It was deliberately limited to Outputs 3–4. It did not run the full hardware matrix.

## Preconditions and safety

Before the hardware run:

- the user's saved normal Focusrite configuration was restored;
- physical Outputs 3–4 were isolated;
- the module client was server-authorised;
- the exact hardware-tested Scarlett 18i20 (3rd Gen) profile was detected;
- the live shape was 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability was 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- the audited Page 2 harness contained 768 controls;
- the probe required explicit `--allow-hardware-writes` and physical-isolation acknowledgement;
- exact original source values for both Outputs 3 and 4 had to be server-confirmed before the first write;
- restoration ran in a `finally` path and required exact server confirmation.

No raw protocol write path exists in the probe. It presses only audited Companion Page 2 actions.

## Hardware result

The pair Source=None action was pressed once and both output source variables were sampled over four seconds.

Sanitized observations:

- ~2 ms: Output 3 `original`; Output 4 `original`.
- ~104 ms: Output 3 `zero`; Output 4 `original`.
- ~505 ms: Output 3 `zero`; Output 4 `original`.
- ~1505 ms: Output 3 `zero`; Output 4 `original`.
- ~4003 ms: Output 3 `zero`; Output 4 `original`.

Final classification:

- `outcome = ZERO_ORIGINAL`
- `noneConfirmed = false`
- `restoreConfirmed = true`
- `fallbackNoneConfirmed = false`
- `probeCompletedWithoutException = true`

The sanitized result was automatically published to GitHub in one attempt.

## Interpretation

### Hardware-tested

For the tested Outputs 3–4 state/configuration, requesting pair Source=None does **not** produce server-confirmed Source=None on both members.

Output 3 transitions to Source=None quickly and remains there. Output 4 remains on its original server-reported source for the full four-second observation window.

Therefore the V5 `source-none-unconfirmed` blocker for Output 4 is **not explained by a short propagation delay**.

The exact original pair source state was restored and server-confirmed after the probe.

### Implemented production behavior

Current production `output_pair_source` code explicitly requests source `0` on both the left and right output when Pair Source=None is selected.

This targeted hardware result therefore shows a mismatch between the requested right-member `0` write and the server-confirmed right-member state for Outputs 3–4.

### Not yet proven

This result does **not** prove that every right/even output has the same semantics. V5 previously produced a successful pair-source test on Outputs 1–2, so no generic parity/follower rule may be hardcoded from this one probe.

This result also does not prove the physical audio-path state of Output 4 while its source variable remains original. The project safety model continues to require server-confirmed state and must not assume silence from the left-member state alone.

## Current decision

- Keep Output 4 unsafe for global signal-path purposes when neither mute nor Source=None is server-confirmed.
- Keep the V5 both-member safety rule intact.
- Do not weaken feedback/state authority.
- Do not change production `output_pair_source` semantics solely from this one pair result.
- Eliminate verification timing as the primary explanation for the 3–4 failure.
- Treat this probe as historical targeted evidence only; the normal FULL strategy is the device-wide capability/topology campaign.

## Privacy

Only sanitized state classes (`original`, `zero`, `other`, `unknown`) and non-private campaign metadata are recorded publicly. No serial, hostname, client key, server port, client/device/connection IDs, raw XML, private captures, local paths or raw source IDs are published here.
