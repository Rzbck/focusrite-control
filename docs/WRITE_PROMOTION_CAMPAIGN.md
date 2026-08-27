# Write Promotion Campaign — withheld non-disruptive controls

## CURRENT STATUS — HARD ABORT / QUARANTINE

**This section supersedes the older executable Output Stereo and “All non-disruptive” mode descriptions lower in this document.**

The physical campaign has already progressed beyond inventory and the initial targeted modes.

Material results are preserved in:

`docs/WRITE_PROMOTION_ABORT_2026-08-27.md`

Current safety state:

- completed Custom Mix and Mixer Slot campaigns are not rerun merely for repetition;
- Output Stereo produced `FAIL_COLLATERAL_DRIFT` on the first target and HARD ABORTed;
- Output Stereo writes are quarantined;
- broad `all-nondisruptive` execution is quarantined and removed from accepted CLI modes;
- ALT direct-write testing is not resumed merely because readback is closed;
- no hardware write is currently the next action.

The next step is software-only pair-aware safety analysis/design. A future Output Stereo attempt requires a new proven restoration oracle before hardware execution.


Date started: 2026-08-27

Hardware scope: **Scarlett 18i20 (3rd Gen) only**.

## Why this campaign exists

The final 0.1.21 public surface deliberately withheld several write families because the strongest retained evidence proved readback/dynamic state but did not uniformly prove a safe write transaction for the generic public action.

The user has explicitly chosen to continue validation rather than freeze those controls indefinitely.

This campaign does **not** assume that schema presence or readback proves writability. It creates new direct hardware-write evidence with exact restoration.

## Existing evidence reused

Do not rerun the completed broad REC, meter closure, retained-public V5 smoke, or failed strict `output_pair_source` campaign merely for repetition.

Existing retained evidence already establishes:

- Custom Mix readback closure for Mute, Solo, Talkback, fader, pan, Stereo/Mono, routing observation and 12/12 meters;
- ALT / Speaker Switching readback closure;
- exact public 0.1.21 retained-write smoke 42/42 PASS;
- `output_pair_source` strict two-member failure and deliberate withholding;
- Monitor gain 1677 read-only decision;
- dynamic Control Server discovery, exact-model gating, own-client authorisation and server-confirmed state contract.

## Probe architecture

`testbench/FullTestBenchWritePromotion.js` is research/TestBench-only and is not part of public `main`.

It connects directly through the same Focusrite Control Server client implementation used by the module, but with a **separate local persistent Remote Device identity** stored under gitignored `testbench/private/`.

This avoids weakening the installed public definition policy before hardware evidence exists.

The probe:

1. dynamically discovers Focusrite Control Server;
2. requires exact model `Scarlett 18i20 (3rd Gen)`;
3. requires its own Remote Devices approval before any write mode (inventory remains read-only and does not require approval);
4. uses only parser-known writable IDs;
5. refuses every target with unknown baseline;
6. sends one reversible probe value;
7. requires the requested value to be server-confirmed;
8. writes the exact original baseline back;
9. requires exact restoration;
10. compares all other known writable state after restore and HARD ABORTs on collateral drift.

A transmitted probe is followed by an explicit restore attempt even if the requested target transition is not observed. A no-transition write is never treated as harmless by assumption.

No optimistic state is used.

## Modes

### Inventory — read-only

`--mode=inventory`

Zero Focusrite writes. It reports how many candidate paths currently have a materialised exact baseline and writes a sanitized local inventory to `testbench/results/latest-write-promotion.json`.

This should always be run first.

### Custom Mix

`--mode=custom-mix`

Candidates:

- `mix_mute`;
- `mix_solo`;
- `mix_gain`;
- `mix_pan`;
- `mix_talkback`.

Coverage design intentionally avoids a thousand-write brute-force sweep while still crossing the whole structural matrix:

- all **12 lanes** are represented;
- each lane tests two strips;
- across the 12 lanes, slot numbers **1 through 24 are each exercised once per strip-property family**;
- both sides of every visible Custom Mix pair are represented;
- Talkback is targeted once on every lane.

With fully materialised baselines this produces:

- 24 Mute transactions;
- 24 Solo transactions;
- 24 Gain transactions;
- 24 Pan transactions;
- 12 Talkback transactions;
- total: **108 exact-restore transactions**.

Gain probes prefer a 1 dB downward move when possible, minimizing signal-level increase while still proving a reversible transaction.

This is intended as promotion evidence for the existing generic Custom Mix action implementation when combined with the already-complete readback evidence and structural parser tests.

### Mixer Slots

`--mode=mixer-slots`

Exhaustive slot-index coverage:

- Source on all 24 slots where an exact baseline and alternate visible source are available;
- Stereo on all 24 slots where the current boolean state is known.

### ALT

`--mode=alt`

Tests:

- ALT enable;
- ALT select.

Audio/monitor outputs must be physically isolated before the write run.

### Output Stereo

`--mode=output-stereo`

Tests only schema left members of output pairs whose server-confirmed `available` state is explicitly true.

`available=false` and unknown availability are SKIP and receive no write.

This mode is separate because output pair ownership semantics have historically been subtle. A PASS here must not be used to resurrect `output_pair_source`.

### All non-disruptive

`--mode=all-nondisruptive`

Runs the four write modes above in one guarded sequence.

## Permanently outside this campaign

This probe contains no write path for:

- Monitor gain item 1677;
- `assign-mix`;
- `output_pair_source`;
- Advanced Raw / arbitrary item IDs;
- meters/status items;
- firmware/update/reset/restore/snapshot;
- Device Preset;
- Clock Source;
- Sample Rate;
- S/PDIF / Digital I/O mode;
- unavailable or unknown-availability output targets;
- invented analogue input preamp Gain;
- direct per-input hardware Mute;
- per-channel phantom;
- Mic Kill.

The four disruptive settings remain separate and require explicit user agreement plus a dedicated restoration plan if they are ever tested.

## Promotion rule

A family is **not** promoted merely because the script executes.

Promotion requires review of the actual local result and classification with:

- requested transition confirmed;
- exact target restoration confirmed;
- no collateral drift;
- adequate structural coverage for the generic action contract;
- no contradiction with newer physical observations.

A direct-probe PASS proves the Focusrite Control Server item transaction on real hardware; it does **not** by itself prove the installed Companion action wrapper. After a family is promoted into a new development build, run a focused installed-Companion action smoke with the same server-confirmed transition and exact-restore oracle before calling the public action `HARDWARE_WRITE_CONFIRMED`.

Only after direct hardware evidence is clean should production `definition-policy.js`, presets/help and development package version be changed.

The next packaged production/runtime change after 0.1.21 must use a newer development version.
