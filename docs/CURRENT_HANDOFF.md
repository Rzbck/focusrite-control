# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Current development build: **0.1.21**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live repository and newer material branch movement. Resolve the current remote HEAD of the objective branch, inspect newer commits/diff, then read root `HANDOFF`, this file, `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

Normal project launchers remain the canonical user workflow. Run the checked-in:

`UPDATE_AND_RUN.bat`

for synchronization plus the full local software gate before any newly changed hardware workflow. Manual Git/PowerShell/Node remains last resort.

## Development versioning

Do not publish different Companion package bytes repeatedly under the same development version. Packaged production policy changed after `0.1.20`, so the current development package is **0.1.21**. The next packaged change after 0.1.21 must bump again. TestBench/docs-only changes do not require another package-version bump. Stable public target remains `v1.0.0` unless Bitfocus maintainers direct otherwise.

## Current objective

The broad hardware feedback/protocol investigation remains **closed for the v1 public scope by explicit evidence or deliberate write withholding**.

The final workflow combines two separate evidence classes without broadening the production write surface:

1. retained public v1 writes through Companion, with server-confirmed baseline, transition, exact target restore and collateral-state audit;
2. a **read-only** broad recorder while the operator deliberately traverses visible **Custom Mix** controls in Focusrite Control.

Do **not** run another broad hardware REC as a standalone exploratory campaign. The only intended broad REC now is controlled Phase B inside `RUN_FINAL_HARDWARE_AUDIT.bat`, after Phase A completes without a hard safety abort.

## Newest public-surface hardware result

The newest explicit physical hardware/user-host release result is the V4 exact-pair smoke on module 0.1.20:

- SAFE Core: PASS 3 / FAIL 0 / SKIP 18;
- release tests: 52;
- **PASS 42 / FAIL 10**;
- hard abort: false;
- reconnect: PASS;
- global exact-restore audit: PASS;
- all ten failures were `output_pair_source` with classification `NO_TRANSITION`;
- all runnable direct Output Source/Gain/Nickname tests passed with server-confirmed transition and exact restore;
- Input nickname/mode-cycle, Device nickname, Phantom Persistence and Monitor preset also passed where runnable.

V4 used reciprocal parser/schema source-pair metadata instead of display-name adjacency and required **both Output members** to reach the requested reciprocal pair.

## `output_pair_source` decision

Older V8 pair-topology evidence was re-read. V8 remains useful topology/ownership evidence, but its historical oracle could accept a route where the requested left member changed while the right member remained on its original source. That did not prove the stronger modern public contract of routing both members to the requested pair.

With V3/V4 repeatedly failing full two-member closure, v1 now deliberately **withholds `output_pair_source`** rather than weakening the newer exact hardware oracle.

Current consequences:

- `output_pair_source` is in `V1_WITHHELD_ACTIONS`;
- installed public actions do not expose it;
- presets using it are removed by the same release policy;
- its internal implementation/research history may remain;
- V4 remains historical evidence;
- V5 is the final public-surface smoke and never creates or presses `output_pair_source`.

This is a write-surface decision, not a claim that Stereo or paired topology is unsupported.

## Stereo/Mono and Custom Mix evidence retained

The user's physical Focusrite Control REC work **did exercise visible Stereo/Mono changes**, including source/stereo topology inside Custom Mix. The previous broad REC plus latest retained evidence strongly validate server-confirmed readback for:

- faders;
- pan;
- Mute;
- Solo;
- source/stereo topology, including visible Stereo/Mono changes;
- Talkback state;
- all **12/12 Custom Mix meters**;
- currently available Output meters.

This evidence is `HARDWARE_DYNAMIC_CLOSED`/readback evidence for the observed UI/state paths. It is not the same transaction as `output_pair_source`, and it does not automatically create generic Companion write proof for `output_stereo` or `mixer_slot_stereo`. Their readback can remain while writes stay withheld.

## Runtime lifecycle repair retained

A previous release smoke exposed a cold-start Output definition defect: Output actions could be filtered while server-confirmed availability was unknown and remain stale after availability materialised.

The repair in `src/main.js` remains regression-covered by `test/output-definition-refresh.test.js`:

- actions/presets refresh in a debounced way on ready;
- Output availability materialisation/change refreshes filtered actions/presets;
- ordinary state packets do not rebuild definitions;
- callback-time availability checks remain fail-closed;
- no withheld action or raw bypass is restored.

## Current 0.1.21 package change

This is a real packaged change:

- `package.json` version = `0.1.21`;
- `src/definition-policy.js` withholds `output_pair_source`;
- packaged `companion/HELP.md` documents the corrected public surface;
- public readback remains server-confirmed;
- no hardware policy is loosened;
- no new write family is added.

Because packaged bytes changed, the older 0.1.20 archive and its historical hashes are **not** the 0.1.21 artifact.

## Current final TestBench

`FullTestBenchV1ReleaseV4.js` remains the historical exact-pair diagnostic that produced the ten `NO_TRANSITION` results.

`FullTestBenchV1ReleaseV5.js` is the final public-surface runner for 0.1.21:

- retained public write families only;
- no `output_pair_source` expected action;
- no `output_pair_source` button generated or pressed;
- live Focusrite configuration is accepted as the baseline once stable;
- exact target restore and collateral audit remain mandatory;
- Monitor preset remains ordered last;
- baseline/restore/collateral failure remains a hard safety abort.

`RUN_V1_RELEASE_SMOKE.cmd` and `RUN_FINAL_HARDWARE_AUDIT.cmd` now target V5 / 0.1.21.

## Current software status

**0.1.21 is SOFTWARE-GATE-PENDING.**

The latest fully green packaged checkpoint belongs to 0.1.20. Do not infer a green 0.1.21 gate from static repository changes.

Do not import 0.1.21 into Companion and do not run hardware until the full user-host gate is green.

## Exact next action

1. Run the checked-in:

`UPDATE_AND_RUN.bat`

2. Continue on `testbench/meter-routing-exact-restore` and require the complete gate: immutable dependencies, Prettier, ESLint, source manifest, all Node tests, Companion package build.
3. Send the complete gate log before any hardware run.
4. If the whole gate is green, import the freshly generated `focusrite-scarlett-18i20-0.1.21.tgz` into Companion.
5. Keep the existing Focusrite Companion connection and its Remote Devices identity/approval; do **not** delete/recreate it.
6. Keep Focusrite Control open and leave the current routing/configuration as-is.
7. If the final-audit preflight requests it, enable only **Expose mixer diagnostic variables (read-only)**.
8. Physically isolate/mute downstream Outputs and lower the physical Monitor/headphone levels before Phase A.
9. Run root `RUN_FINAL_HARDWARE_AUDIT.bat`.
10. Phase A uses V5 and contains no `output_pair_source` write. Any hard baseline/restore/collateral abort stops the workflow.
11. Phase B runs the existing recorder **READ-ONLY** while the operator traverses visible **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, **Mute**, **MAIN**, **ALT** controls as requested by the workflow.
12. Phase C accumulates sanitized Custom Mix coverage, including prior evidence where supported by the collector.
13. After hardware validation is clean, perform a fresh exact package/privacy/forbidden-feature audit on the exact 0.1.21 archive used.

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

Outputs:

- `output_mute` on validated direct members only;
- `output_gain_set` / `output_gain_adjust` on validated analogue gain targets;
- `output_source` on validated direct targets/direct source families;
- `output_nickname` on validated direct targets.

Device/settings:

- `device_nickname`;
- `phantom_persistence`;
- `talkback_source`;
- `reconnect`.

### Withheld public writes for v1

Readable state may remain where supported, but normal v1 write actions/presets are removed:

- `monitor_alt_enable`;
- `monitor_alt`;
- `output_stereo`;
- `output_pair_source`;
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

Withholding is deliberate v1 scope control, not an unsupported-hardware claim.

## Output policy

- Direct Mute stays withheld on right/pair-owned members.
- Pair-owned right Source stays withheld from direct routing.
- `output_pair_source` stays withheld from public v1.
- Monitor Outputs 1–2 direct Gain stays withheld.
- Known no-effect Gain/Nickname paths stay withheld.
- Output Stereo write stays withheld globally while readback remains truthful.
- Outputs 21–24 stay write-blocked even if a future configuration reports them available until that available configuration is explicitly hardware-tested.
- Explicit `available=false` or unknown availability blocks writes wherever an availability descriptor exists.
- Definitions refresh when Output availability materialises/changes, while callbacks continue to re-check live availability.

## Custom Mix / `assign-mix`

Focusrite Control presents simply **Custom Mix**. Internal server mix IDs do not have a reliable user-visible mapping.

`assign-mix` remains:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised in active tested sessions;
- raw semantics `UNKNOWN`;
- write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no raw write.

Do not rerun `NAVIGATE_MIXES`; do not write `assign-mix`; it is not a v1 blocker.

## Passive REC state rule

A read-only/passive recorder does **not** require the user to restore Focusrite Control to its starting state merely because the final snapshot differs.

Exact baseline/restoration remains mandatory for write-capable reversible hardware tests where safe rollback is part of the test contract.

## Remote Devices / control-path safety

Writes only after Remote Devices authorisation matched to this module's own server-assigned client ID. Approval for another client does not authorize this module.

Use server-confirmed feedback/state only, never optimistic updates.

Dedicated research/TestBench workflows stay separate from the normal approved Companion control path. Do not create or reuse extra direct clients casually.

## Permanent safety boundaries

- Scarlett 18i20 (3rd Gen) only.
- Focusrite Control Server TCP port and device ID are dynamic.
- Monitor gain item `1677` is read-only.
- No physical analogue input preamp Gain action.
- No direct per-input hardware Mute.
- No per-channel phantom switching.
- No Mic Kill.
- No unknown/unsafe raw writes.
- No firmware/reset/restore/snapshot or meter/status writes.
- No write to UNKNOWN or explicit `available=false`.
- Do not update Focusrite software/firmware without explicit agreement.
- Preserve privacy and required MIT/third-party attribution; do not claim all protocol knowledge was independently discovered.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better repository/module scope and offered hardware for future testing.

Keep supported hardware at **Scarlett 18i20 (3rd Gen) only**. Wait for the official repository/naming decision before changing public scope.
