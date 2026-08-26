# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Research branch: `testbench/meter-routing-exact-restore`  
Public mirror: `main`  
Current development build: **0.1.21**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live remote HEAD of both the research branch and `main`, inspect newer material commits, then read root `HANDOFF`, this file, `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, `docs/HARDWARE_TEST_HISTORY.md`, and relevant source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

## Public `main` — clean RC promoted

PR #3, **Prepare minimal public Companion RC 0.1.21**, was merged into `main` on 2026-08-26.

Current public `main` HEAD:

`62ef6c1f5e1c5f5fff3e520c15ef5de9324ea9d8`

Current public tree:

`9dba5eb9f6e4697b8d4c1ff31b72cc2b8fe5a5f7`

The public tree is intentionally minimal. It contains the Companion runtime/source, Companion manifest/help, focused production regression tests, package/build configuration, license/security/contribution files, README/CHANGELOG and third-party notices.

It intentionally excludes all local/research continuity material:

- no `testbench/`;
- no root `HANDOFF`;
- no `docs/CURRENT_HANDOFF.md` or research `docs/` tree;
- no `AI_PROJECT_RULES.md` / AI handoff files;
- no `RUN*.bat` / `UPDATE*.bat` Windows project launchers;
- no hardware campaign results, private diagnostics or raw research captures.

A final public-tree search returned no tracked `ChatGPT`, `HANDOFF`, `AI_PROJECT_RULES`, or `TestBench` references on `main`.

Those continuity/research files remain intentionally on the research branch only. Do not reintroduce them into public `main`.

## Final clean public-tree software gate

The public RC was validated in an isolated clean Git worktree at exact pre-merge RC HEAD:

`f1f6764c9ff513095f0cb000a0717e5159309020`

Results:

- exact clean public tree confirmed;
- **9 test files**;
- **49/49 Node tests PASS**;
- immutable dependency install PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Companion package build PASS;
- generated `focusrite-scarlett-18i20-0.1.21.tgz`.

The dependency install emitted only the expected/non-fatal Yarn warning that esbuild build scripts were disabled.

The merge commit points to the exact same tree, so the public source/runtime bytes were not changed during merge.

## Full research-branch software status

Before public cleanup, the complete research/TestBench checkout was also software-green on the user host:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **306/306 Node tests PASS**;
- Companion package build PASS.

This larger gate is historical/internal coverage. The clean public `main` intentionally keeps only the 49 focused production regressions.

## Exact 0.1.21 archive audit

The exact user-host RC archive was audited before public cleanup.

SHA-256:

`c8b948a06d1164caf27f3790236e75d4d6e6e0a77aaff0ad4b52840ec199dfd4`

Result: **PASS**.

The exact package contained only the expected Companion package payload and passed package/manifest coherence, public-surface/forbidden-feature checks, privacy scan and attribution/help audit.

Do not claim another rebuilt archive is this exact audited artifact unless its bytes/hash are verified.

## Final hardware status

The v1 hardware/protocol investigation is **closed for the frozen public scope by explicit evidence or deliberate write withholding**.

Final retained public-write smoke on 0.1.21:

- **42/42 PASS**;
- hard abort: false;
- exact restoration/global safety: clean;
- reconnect: PASS;
- `output_pair_source` deliberately absent from the public smoke.

Final cumulative read-only Custom Mix coverage:

- `mix_mute`: representative closed, mismatch 0;
- `mix_solo`: representative closed, mismatch 0;
- `mix_talkback`: representative closed, mismatch 0;
- fader: **7 changed paths**;
- pan: **4 changed paths**;
- Stereo/Mono: **2 changed paths**;
- routing to Custom Mix: **7 Output pairs observed**;
- Custom Mix meters: **12/12 closed, mismatch 0**;
- `FINAL CUSTOM MIX COVERAGE: COMPLETE`.

Do **not** rerun the final hardware audit merely for repetition.

## `output_pair_source` decision

Older V8 pair-topology evidence does not prove the stronger modern two-member public write contract. V3/V4 repeatedly failed full two-member closure, including V4 with reciprocal schema pair metadata.

Therefore v1 deliberately **withholds `output_pair_source`** rather than weakening the exact hardware oracle.

Consequences:

- installed public actions do not expose it;
- presets using it are removed;
- V4 remains historical failure evidence;
- V5 never creates or presses it;
- internal research history may remain on the research branch;
- this is not a claim that Stereo is unsupported.

## Stereo/Mono and Custom Mix evidence retained

Physical Focusrite Control operation and broad read-only REC work exercised visible Stereo/Mono and Custom Mix behavior. Strong server-confirmed readback evidence exists for faders, pan, Mute, Solo, source/stereo topology including visible Stereo/Mono changes, Talkback state, all **12/12 Custom Mix meters**, and currently available Output meters.

This is `HARDWARE_DYNAMIC_CLOSED` / `SESSION_STATE_OBSERVED` readback evidence. It is not automatically generic Companion write proof for `output_stereo`, `mixer_slot_stereo`, `mix_*`, or `output_pair_source`. Those v1 writes remain withheld.

## Runtime lifecycle repair retained

`src/main.js` refreshes filtered Output actions/presets when server-confirmed Output availability materialises or changes. Ordinary state packets do not rebuild definitions. Callback-time availability checks remain fail-closed. This repair is regression-tested and does not re-enable withheld write families.

## Final v1 public write surface

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

Readable state may remain where supported, but normal v1 actions/presets are removed:

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

- Direct Mute withheld on right/pair-owned members.
- Pair-owned right Source withheld from direct routing.
- `output_pair_source` withheld.
- Monitor Outputs 1–2 direct Gain withheld.
- Known no-effect Gain/Nickname paths withheld.
- Output Stereo write withheld globally while readback remains truthful.
- Human Outputs 21–24 remain write-blocked until an available configuration receives explicit real-hardware validation.
- Explicit `available=false` or unknown availability blocks writes.
- Definitions refresh when availability materialises/changes; callbacks re-check live state.

## Custom Mix / `assign-mix`

User-facing instructions must use **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, **Mute**, **MAIN**, and **ALT**. Do not instruct users with internal Mix A–F labels.

`assign-mix` remains:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised in tested sessions;
- raw semantics `UNKNOWN`;
- write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no raw write.

Do not rerun `NAVIGATE_MIXES` and do not write `assign-mix`.

## Permanent safety boundaries

- Scarlett 18i20 (3rd Gen) only.
- Dynamic Focusrite Control Server TCP port and device ID.
- Writes only after Remote Devices authorization matched to this module's own server-assigned client ID.
- Server-confirmed feedback/state only; never optimistic.
- Monitor gain item `1677` is read-only.
- No analogue input preamp Gain action.
- No direct per-input hardware Mute.
- No per-channel phantom switching.
- No Mic Kill.
- No unknown/unsafe raw writes.
- No firmware/reset/restore/snapshot or meter/status writes.
- No write to UNKNOWN or explicit `available=false`.
- Do not update Focusrite software/firmware without explicit agreement.
- Preserve privacy and MIT/third-party attribution; do not claim all protocol knowledge was independently discovered.

## Development versioning

Current packaged development build is **0.1.21**. Do not publish different package bytes under the same development version. Any future packaged runtime/help/manifest change must bump the development version. Research/TestBench/docs-only changes do not require another package-version bump. Stable public target remains `v1.0.0` unless Bitfocus maintainers direct otherwise.

## Exact next action

The local/public RC work is complete. There is no pending hardware rerun, archive audit, public-tree cleanup or `main` promotion.

Next action is to **wait for the official Bitfocus repository/module naming decision**.

When the official Bitfocus repository exists:

1. inspect exact repo name, default branch, seed files and permissions;
2. compare its seed tree with the clean current `main` rather than blindly overwriting;
3. use the expected Bitfocus branch/PR workflow;
4. run Bitfocus CI plus local tests on the exact submission tree;
5. keep stable public target `v1.0.0` unless maintainers direct otherwise;
6. submit a Developer Portal tag only after Bitfocus-side CI and final hardware/action audit requirements are clean.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing. The project replied that only Scarlett 18i20 (3rd Gen) is validated and is open to Bitfocus's preferred naming.

Do **not** rename or broaden the current public module/repository until Bitfocus gives the official decision.
