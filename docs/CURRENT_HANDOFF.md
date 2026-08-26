# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Current development build: **0.1.20**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live repository and newer material branch movement. Resolve the current remote HEAD of the objective branch, inspect newer commits/diff, then read root `HANDOFF`, this file, `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

Normal project launchers remain the canonical user workflow. Run the checked-in:

`UPDATE_AND_RUN.bat`

for synchronization plus the full local software gate before any newly changed hardware workflow. Manual Git/PowerShell/Node remains last resort.

## Current objective — final hardware audit validation

The broad hardware feedback/protocol investigation remains **closed for the v1 public scope by explicit evidence or deliberate write withholding**.

The user requested a stronger final validation than the narrow retained-action smoke alone. The current final workflow therefore combines two evidence classes without broadening the production write surface:

1. retained public v1 writes through Companion with server-confirmed baseline, server-confirmed transition, exact target restore, and collateral-state audit;
2. a **read-only** broad recorder while the operator deliberately traverses visible **Custom Mix** controls in Focusrite Control.

All remaining materially unproven/disruptive write families remain withheld from the public v1 write surface. The final Custom Mix phase can improve readback/hardware evidence but does not automatically restore any withheld production action.

Do **not** run another broad hardware REC as a standalone exploratory campaign. The only intended broad REC now is the controlled read-only Phase B inside `RUN_FINAL_HARDWARE_AUDIT.bat`, after the public-write phase has completed without a hard safety abort.

## Why V4 exists

The earlier V1 release smoke used display-name adjacency to reconstruct stereo source pairs, for example Playback 1/2. That was not a valid protocol-level pair oracle.

The current V4 TestBench now uses reciprocal parser/schema source-pair metadata. `src/variables.js` exposes only the read-only pair metadata needed by the TestBench. Production write policy remains unchanged.

The final Custom Mix coverage audit also accumulates prior and current passive evidence, so a long manual traversal may be split across sessions without losing already closed paths.

## Latest user-host software gate

The user ran `UPDATE_AND_RUN.bat` after synchronizing to:

`087f263c91ca5237e20f777fe0b65a1fb5239725`

Result:

- Node 22.23.2: PASS;
- Yarn 4.17.0: PASS;
- immutable dependency install: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- 302 tests discovered;
- **298 PASS / 4 FAIL**;
- Companion package build was not reached because the test phase failed first;
- no Focusrite hardware write was performed by the software gate.

The four failures were all living-handoff/continuity contract assertions. No runtime, parser, V4 pair-oracle, final-audit, Custom Mix coverage, privacy, raw-write, Monitor-gain, availability, or package-source behavior test failed.

The four stale/missing handoff contracts were:

- explicit continuity wording for the already-closed v1 public scope;
- the Remote Devices own-client authorization gate;
- the separation of dedicated research/TestBench workflows;
- the canonical checked-in `UPDATE_AND_RUN.bat` resume instruction.

Those contracts are now restored in the living handoffs. A fresh full gate is required before any new hardware run.

## Runtime lifecycle repair retained

The earlier real V1 RELEASE SMOKE exposed a separate runtime defect before the V4 work: Output actions could be filtered while server-confirmed availability was still unknown during cold start and were not rebuilt when availability later materialised.

That lifecycle repair remains implemented in `src/main.js` and regression-covered by `test/output-definition-refresh.test.js`:

- action/preset definitions refresh in a debounced way when the client becomes ready;
- Output availability materialisation/change refreshes the filtered action/preset surface;
- ordinary non-meter state does not rebuild definitions;
- callback-time availability checks remain fail-closed;
- no withheld action is restored;
- no raw/unknown write path is added.

The prior `05a6c180...` checkpoint passed 295/295 plus package build. The current final-audit branch has advanced beyond that checkpoint, so its package must not be treated as the final exact artifact.

## Exact next action

1. Run the checked-in:

`UPDATE_AND_RUN.bat`

2. Continue on `testbench/meter-routing-exact-restore`.
3. Require the whole gate to finish green, including Companion package build. Do not hardware-test the new branch while the software gate is red.
4. After a green gate, import the newly generated `focusrite-scarlett-18i20-0.1.20.tgz` into Companion.
5. Keep the existing Focusrite connection; do **not** delete/recreate it. Select Module Version `0.1.20` on that existing connection.
6. In Focusrite Control → Device Settings → Remote Devices, confirm `Companion Scarlett 18i20` is approved for that same existing module identity.
7. Run root `RUN_FINAL_HARDWARE_AUDIT.bat`.
8. If its read-only Custom Mix preflight requests it, enable only Companion's **Expose mixer diagnostic variables (read-only)** option. That option is read-only and does not change Focusrite routing.
9. Before the write-capable Phase A, physically isolate/mute downstream audio paths and lower the physical Monitor/headphone levels.
10. A hard restore/baseline/collateral abort stops the workflow before the passive Custom Mix phase. Do not retry blindly.
11. During the read-only Custom Mix phase, use only the visible Focusrite Control terms and controls: **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, **Mute**, **MAIN**, **ALT**. Do not manipulate internal protocol/TestBench Mix A-F names.
12. After the final hardware results are clean, perform a fresh exact `.tgz` package/privacy/forbidden-feature audit on the exact archive used, then close the repaired RC and return to the Bitfocus repository/naming wait state.

## Remote Devices / control-path safety

Writes only after Remote Devices authorisation matched to this module's own server-assigned client ID. The module must ignore approval for unrelated server clients and must block writes until its own assigned identity is authorised.

Use server-confirmed feedback/state only, never optimistic updates.

Dedicated research/TestBench workflows stay separate from the normal approved Companion control path. Never run a direct Focusrite Control Server research client concurrently with a normal SAFE/FULL/write-capable Companion TestBench campaign, and never create an extra Remote Devices client without an explicit research reason and user warning.

The dedicated authorization procedure remains `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

## Artifact audit status

The earlier exact `.tgz` audit and SHA-256

`cfa4ba62c11e2a91780122eb38a0a0570d6122e0c5fc7d91652008a6838a5716`

belong to the older `fd76b4e6...` package and are **historical**.

Package inputs changed after that audit, first for the Output lifecycle repair and now for the read-only source pair metadata. Therefore the next green `focusrite-scarlett-18i20-0.1.20.tgz` requires a fresh exact package/privacy/forbidden-feature audit. Do not reuse the old SHA as proof for the new archive.

## Final v1 public write surface

Authoritative policy audit: `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`.

### Kept public writes

Monitor:

- `monitor_mute`;
- `monitor_dim`;
- `monitor_talkback`;
- `monitor_preset`.

Hardware Inputs:

- `input_air`;
- `input_pad`;
- `input_mode`;
- `input_mode_cycle`;
- `input_nickname`.

Outputs, filtered by exact model, retained evidence, and server-confirmed availability:

- `output_mute` on validated direct members only;
- `output_gain_set` / `output_gain_adjust` on validated analogue gain targets;
- `output_source` on validated direct targets/direct source families;
- `output_pair_source` on validated pairs/direct stereo source families;
- `output_nickname` on validated direct targets.

Device/settings:

- `device_nickname`;
- `phantom_persistence`;
- `talkback_source`;
- `reconnect`.

### Withheld public writes for v1

Readable state may remain, but normal v1 write actions/presets are removed:

- `monitor_alt_enable`;
- `monitor_alt`;
- `output_stereo`;
- `mixer_slot_source`;
- `mixer_slot_stereo`;
- `mix_mute`;
- `mix_solo`;
- `mix_gain_set`;
- `mix_gain_adjust`;
- `mix_pan`;
- `mix_talkback`;
- `device_preset`;
- `clock_source`;
- `sample_rate`;
- `spdif_mode`;
- `advanced_raw_set`.

Withholding is deliberate v1 scope control, not a claim that readable capabilities do not exist. Final readback evidence may strengthen classification, but no withheld write is re-exposed automatically.

## Output policy

- Direct Mute stays withheld on right/pair-owned members.
- Pair-owned right Source stays withheld from direct routing while validated pair routing remains available.
- Monitor Outputs 1–2 direct Gain stays withheld.
- Known no-effect Gain/Nickname paths stay withheld.
- Output Stereo write stays withheld globally.
- Outputs 21–24 stay write-blocked even if a future configuration reports them available until that available configuration is explicitly hardware-tested.
- Explicit `available=false` or unknown availability blocks writes wherever an availability descriptor exists.
- Definitions refresh when Output availability materialises/changes, while callbacks continue to re-check live availability before every retained Output write.
- V4 pair testing uses reciprocal schema pair metadata; display-name adjacency is not pair proof.

## Custom Mix / `assign-mix`

Focusrite Control presents simply **Custom Mix**. Internal server mix IDs do not have a reliable user-visible mapping.

`assign-mix` remains:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised in active tested sessions;
- raw semantics `UNKNOWN`;
- write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no raw write.

Output Source/Pair Source actions do not offer internal Custom Mix source IDs, and stale attempts are callback-blocked.

Do not rerun `NAVIGATE_MIXES`; do not write `assign-mix`; it is not a v1 blocker.

The final audit's Custom Mix phase is passive observation of visible behavior. It does not write `assign-mix` and does not expose internal mix IDs to the user.

## Newest broad readback evidence before final audit

Latest sanitized read-only REC: `2026-08-26T06:29:16.831Z`, module `0.1.19`.

Fingerprint:

- size 606632 bytes;
- SHA-256 `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`.

Result:

- read-only harness;
- zero harness hardware writes;
- zero Companion button presses;
- 829 probes / 31 feedback definitions / 46 meters;
- **11 transitions / 11 PASS / 0 race / 0 mismatch**.

### ALT / Speaker Switching

Feedback/readback is `HARDWARE_DYNAMIC_CLOSED`:

- `monitor_alt_enable`: both states, 3 PASS transitions;
- `monitor_alt`: both states, 4 PASS transitions;
- Output 3 availability changed with Speaker Switching ownership;
- 0 race / 0 mismatch.

ALT writes remain withheld for v1 because Companion direct-write evidence did not equivalently close those transactions.

### Meters

Current tested configuration:

- Inputs: **8/8 closed**;
- available Outputs: **22/22 closed**;
- Custom Mix: **12/12 closed**;
- total: **42/46 floor + movement closed**;
- Outputs 21–24 are `available=false`: **CONFIGURATION_UNAVAILABLE**, not unsupported.

Do not change Sample Rate or Digital I/O merely for coverage. The final passive recorder can accumulate the existing meter evidence.

## Passive REC state rule

A read-only/passive recorder does **not** require the user to restore Focusrite Control to its starting state merely because the final snapshot differs.

Exact baseline/restoration remains mandatory for write-capable reversible hardware tests where safe rollback is part of the test contract.

## User-facing terminology

For user instructions, use the terms visible in Focusrite Control:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Do not instruct the user to manipulate internal protocol/TestBench `Mix A-F` names.

## Permanent safety boundaries

- Scarlett 18i20 (3rd Gen) only.
- Focusrite Control Server TCP port and device ID are dynamic.
- Writes only after Remote Devices authorisation for this module's own server-assigned client ID.
- Server-confirmed feedback/state only, never optimistic.
- No write to UNKNOWN or explicit `available=false`.
- Monitor gain item `1677` is read-only.
- No physical analogue input preamp Gain action.
- No direct per-input hardware Mute.
- No per-channel phantom switching.
- No Mic Kill.
- No unknown/unsafe raw writes.
- No firmware/reset/restore/snapshot or meter/status writes.
- Do not update Focusrite software/firmware without explicit agreement.
- Preserve privacy and required MIT/third-party attribution; do not claim all protocol knowledge was independently discovered.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better repository/module scope and offered hardware for future testing.

Keep supported hardware at **Scarlett 18i20 (3rd Gen) only**. Wait for the official repository/naming decision before changing public scope.

After the final hardware audit and fresh exact artifact audit are clean, return to the publication wait state rather than broadening hardware support without new real-device evidence.
