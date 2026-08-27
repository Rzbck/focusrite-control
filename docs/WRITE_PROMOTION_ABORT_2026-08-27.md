# Write Promotion hard abort — 2026-08-27

Hardware scope: **Scarlett 18i20 (3rd Gen) only**.

This internal research record preserves the material user-host evidence from the 2026-08-27 withheld-write promotion campaign.

## Custom Mix direct-write results

The probe used its own authorised Remote Device identity, server-confirmed state, exact target restoration, and collateral audit.

- `mix_talkback`: PASS 0 / FAIL_NO_TRANSITION 6 / SKIP 6.
- `mix_mute`: PASS 1 / SKIP 23.
- `mix_solo`: 24 SKIP because direct baseline remained unknown.
- `mix_gain`: PASS 8 / FAIL_NO_TRANSITION 4 / SKIP 12.
- `mix_pan`: 24 SKIP because direct baseline remained unknown.

Only the individual PASS targets are `HARDWARE_WRITE_CONFIRMED` direct-probe paths. The generic Custom Mix write families remain withheld. Existing readback closure remains `HARDWARE_DYNAMIC_CLOSED` / `SESSION_STATE_OBSERVED`.

## Mixer Slot results

- Source: PASS 0 / FAIL_NO_TRANSITION 16 / SKIP 8.
- Stereo: PASS 0 / FAIL_NO_TRANSITION 16 / SKIP 8.
- exact target restoration/collateral audit remained clean.

Both generic Mixer Slot write families remain `WITHHELD`, not `UNSUPPORTED`.

## ALT

Physical/UI-driven readback remains `HARDWARE_DYNAMIC_CLOSED`.

The direct promotion probe still had unknown direct baselines for ALT enable/select, so direct ALT writes remain `UNKNOWN` / `WITHHELD`.

## Output Stereo HARD ABORT

The guarded Output Stereo mode was run with physical audio isolation and the probe's own Remote Devices authorisation.

First target only:

- target: `output:1:stereo`;
- status: `FAIL_COLLATERAL_DRIFT`;
- two other known writable state items differed after target restoration;
- PASS 0 / FAIL 1;
- `HARD ABORT: true`;
- exit code 4.

No later Output Stereo target was attempted.

The target's own exact baseline was restored; otherwise the oracle would have returned `FAIL_RESTORE` before collateral auditing.

The older result format retained only the collateral count, not semantic identities or immediate pre-write values. Therefore the two collateral items and their exact pre-write values cannot be reconstructed from that saved result.

Do not guess restoration values and do not weaken the hardware oracle.

Classification:

- Output Stereo readback remains `HARDWARE_DYNAMIC_CLOSED` where previously observed;
- generic direct Output Stereo write remains `WITHHELD`;
- this is not evidence that Stereo is unsupported;
- this proves nothing new for `output_pair_source`.

## Post-abort read-only observation

No Focusrite hardware write was sent after the hard abort.

A read-only live check plus visual Focusrite Control inspection showed the current Monitor Outputs 1-2 state as coherent with a previously observed valid state:

- visible source: Custom Mix;
- visible Stereo enabled.

No speculative manual restoration was justified.

## Quarantine

Research commit:

`682441a1b82efa682cecec7cb4147595b579d300`

`testbench: quarantine output stereo writes`

Changes:

- Output Stereo targets become `SKIP_HARDWARE_QUARANTINE`;
- launcher `[5] OUTPUT STEREO` is blocked;
- launcher `[6] TOUT NON-DISRUPTIF` is blocked;
- CLI `all-nondisruptive` is no longer an accepted mode;
- future collateral drift reports retain sanitized semantic paths, never raw private item IDs;
- regression tests cover the quarantine.

## Post-quarantine software gate

User-host `UPDATE_AND_RUN.bat` at synchronized HEAD `682441a1b82e`:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **315/315 Node tests PASS**;
- Companion package build PASS;
- generated `focusrite-scarlett-18i20-0.1.21.tgz`.

The rebuilt package was **not installed or activated in Companion**.

This rebuilt archive must not be confused with the previously exact-audited 0.1.21 archive unless its bytes/hash are independently verified.

## Current decision

Do not rerun Output Stereo.

Do not rerun the broad non-disruptive campaign.

Do not repeat completed Custom Mix or Mixer Slot campaigns merely for repetition.

Any future Output Stereo hardware attempt requires a redesigned pair-aware safety oracle first, with proven semantics and exact restoration.

Monitor gain 1677, `assign-mix`, `output_pair_source`, raw/unknown writes, firmware/reset/restore/snapshot, Device Preset, Clock Source, Sample Rate, S/PDIF mode and unavailable/unknown outputs remain outside this campaign.

This is research/TestBench documentation only. No production version bump is required.
