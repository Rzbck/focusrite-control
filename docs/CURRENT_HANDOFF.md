# Current handoff — Focusrite Control / Companion

Updated: 2026-08-21 19:58 Europe/Paris

This is the living resume point. Read it before proposing code, tests, branch changes or publication work and update it after every material hardware result.

## Scope / publication

- Current supported hardware: **Scarlett 18i20 (3rd Gen) only**.
- Module/package development version: **0.1.13**.
- Working branch: **`testbench/v0.2-hardware-validation`**.
- Official Bitfocus repository/name is still pending. Bryce Seifert suggested `focusrite-control`; do not expand scope until Bitfocus decides and real hardware evidence exists.
- Monitor gain item **1677 remains read-only**.

## Latest complete Windows gate

Last complete user-shown gate before the no-op recovery patch:

- Node 22.23.2 / Yarn 4.17.0;
- dependencies immutable: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **43/43 PASS**;
- package: PASS — `focusrite-scarlett-18i20-0.1.13.tgz`;
- `UPDATE_AND_RUN`: SUCCESS.

The FULL/no-op recovery work changes TestBench tooling only, not `src/`. Companion is already proven to be running module **0.1.13**; do not re-import the `.tgz` for these TestBench-only changes.

A fresh full Windows gate is required after the current v0.2.1 recovery patch before any further hardware run. Do not claim a new exact test count until the user shows that gate.

## Canonical r9 page

User keeps the existing Companion page as page 1:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

Verified facts:

- 46 × 26 grid;
- inspected live export: 1196 controls;
- **42/42** SAFE Core setters match historical r9.6 action/options signatures;
- **829 logical feedback probes / 31 feedback definitions**;
- each logical probe is represented by one normal `T` feedback plus one inverted `F` feedback;
- probe cells contain zero actions.

Never commit or publish the user's live r9 `.companionconfig`; it can contain private/local connection data. Public GitHub stores only sanitized structural facts/mappings/tests.

Old local v0.2 A/B `.companionconfig` files are obsolete. They may remain on the user's disk because UPDATE is intentionally non-destructive and does not `git clean`; they are not part of the active TestBench branch.

## SAFE evidence / cold-start limitation

Core cold-start acquisition remains **3/21 present**:

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

A 404-item state packet still omitted the missing 18. Never add subscribe loops, write-to-warm, stale state presented as current or an invented get primitive.

Latest automated SAFE result on real 0.1.13 hardware: **3 PASS / 0 FAIL / 18 SKIP**, with Talkback + Input 1/2 mode changed, server-confirmed and explicitly restored. Earlier guarded work had validated all 21 Core write paths.

## FULL real-device evidence so far

### Preparation pass

The corrected FULL runner previously reached PREP safely:

- r9 audit: PASS 42 setters + 829 probes + 31 definitions;
- module 0.1.13: PASS;
- exact model + own client authorization: PASS;
- live shape: PASS — 8 inputs / 26 outputs / 24 mixer slots / 12 mix lanes;
- snapshot captured before writes;
- **1085 blank states** identified for documented safe baselines;
- generated local `testbench/generated/FULL_EXTENDED.companionconfig`;
- old snapshot signature: `b591017a2f2c61d9`;
- exit 6 PREP REQUIRED;
- hardware writes: 0.

User imported that generated Extended page as page 2 and mapped `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite 0.1.13 connection.

### First hardware-phase FULL run

Latest real run:

- r9 audit: PASS;
- module 0.1.13: PASS;
- exact model/auth: PASS;
- live shape 8/26/24/12: PASS;
- Extended page: PASS — 199 audited batch controls on snapshot `b591017a2f2c61d9`;
- first full feedback sweep: **PASS 111 / EVAL_ONLY 718 / FAIL 0** across all 829 logical probes;
- hardware phase then started;
- fatal result: `Could not establish FULL baseline for Air input 5.`;
- exit code: 2.

Do not treat Air input 5 as a failed hardware mapping. Root cause is the TestBench's baseline-confirmation logic: if initial state is blank and the requested baseline is already physically active, Focusrite may emit no update for the same-value/no-op write, leaving the Companion variable blank. The old runner interpreted that silence as failure.

The same no-op issue could affect Air/Pad/Mute/Dim and Extended output/mixer families, so it must be fixed systemically rather than special-casing Air 5.

The old runner also started Core before proving its advertised Monitor Mute/output-mute guards. That ordering is being corrected.

## FULL v0.2.1 no-op recovery contract

Current TestBench patch introduces generator revision:

`full-v2-noop-recovery-20260821`

Key changes:

1. **Protection order:** confirm Monitor Mute ON first, then confirm output mutes ON, then begin Core/routing/mixer tests.
2. **Unknown same-value/no-op recovery:** try safe baseline; if a snapshot-blank variable remains unconfirmed, force an alternate value, server-confirm it, then return to and confirm the safe baseline.
3. Core Air/Pad/Dim/etc. use this alternate → baseline recovery instead of treating a silent baseline write as failure.
4. Output mute guard has an OFF → ON recovery under confirmed Monitor Mute; it always attempts to return all outputs to protective ON before leaving recovery. Failure to re-establish ON is a HARD ABORT.
5. Output source/stereo/gain, mixer slot source/stereo, mix mute/solo/gain/pan/talkback and monitoring/settings use equivalent controlled alternate transitions for snapshot-blank states.
6. Mixer source validation requires two distinct known hardware/playback sources so a silent primary-source no-op can be forced through a second source and back.
7. Normal test failures may be logged and continued **only if safe restoration/baseline succeeds**. Restoration failure remains HARD ABORT.
8. On HARD ABORT, protective Monitor Mute/output-mute baselines are intentionally retained where possible rather than automatically unmuting.
9. The generated Extended page signature includes the generator revision, so the old page 2 cannot silently satisfy the new runner.

The new page still contains only approved Companion module actions. It never writes Focusrite protocol directly and never generates forbidden/disruptive actions.

## Required next sequence

1. Run root **`UPDATE_AND_RUN.bat`**, choose `[1] testbench/v0.2-hardware-validation`, and require a complete clean Windows gate. Paste the whole output.
2. Do **not** re-import the module `.tgz`; `src/` is unchanged.
3. Do not run hardware until the new Windows gate is clean.
4. After the clean gate, run `testbench/RUN_SAFE_HARDWARE_TESTS.cmd` and type `FULL`.
5. Because the generator revision changed, the runner should reject/ignore the old page 2 for matching purposes, generate a **new** `testbench/generated/FULL_EXTENDED.companionconfig`, and exit PREP REQUIRED before hardware.
6. Delete/replace the old FULL Extended Companion page (keep r9 page 1 untouched), import the newly generated page as page 2, map `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection, then rerun the same launcher with `FULL`.
7. Capture the complete output and sanitized report summary. Never publish the generated page or private result files.

## Normal FULL intended coverage

- first and second 829-feedback sweeps;
- Core 21;
- input nicknames;
- all applicable output mute/gain set/gain adjust/source/stereo/nickname paths;
- safe `output_pair_source` None branch;
- 24 mixer slot source/stereo controls;
- 12 lanes × 24 strips = 288 strips for mute, solo, gain set/adjust and pan;
- mix talkback all lanes;
- Monitor Alt enable/select, Monitor preset, phantom persistence, talkback source, device nickname;
- reconnect;
- local detailed TXT/JSON/CSV reports.

Normal FULL still excludes and records as `MANUAL_PENDING`: device preset, clock source, sample rate, S/PDIF mode.

## Always forbidden / unsupported

Never reintroduce or exercise as a TestBench shortcut:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level write;
- Monitor gain 1677 write/action/preset/raw access;
- arbitrary/unknown Advanced Raw writes;
- firmware/reset/restore/snapshot commands;
- optimistic fake state;
- hardcoded Control Server port/device ID;
- writes before this module's own client authorization.

## Privacy

Never publish live Companion exports, generated Extended pages/manifests, serial, hostname, client key, server/client/device IDs, dynamic Control Server port, raw XML/captures, private diagnostics or user-specific paths. Local FULL reports intentionally omit these values.
