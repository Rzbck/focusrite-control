# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Current development build: **0.1.21**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live remote HEAD of the objective branch and inspect newer material commits. Then read root `HANDOFF`, this file, `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, `docs/HARDWARE_TEST_HISTORY.md`, and relevant source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

## Development versioning

Do not publish different Companion package bytes under the same development version. Current packaged build is **0.1.21**. The next packaged runtime/help/manifest change must bump again. TestBench/docs-only changes do not require another package-version bump. Stable public target remains `v1.0.0` unless Bitfocus maintainers direct otherwise.

## Final software status

**0.1.21 is SOFTWARE-GREEN on the user host.**

Latest complete normal Windows gate:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **306/306 Node tests PASS**;
- Companion package build PASS;
- generated `focusrite-scarlett-18i20-0.1.21.tgz`.

The gate itself performed no Focusrite hardware write.

## Final hardware status

The v1 hardware/protocol investigation is **closed for the frozen public scope by explicit evidence or deliberate write withholding**.

The clean recent V5 Phase A result for 0.1.21 was accepted by the read-only resume gate:

- retained public write smoke: **42/42 PASS**;
- hard abort: false;
- exact restoration/global safety: clean;
- reconnect: PASS;
- `output_pair_source` was not part of V5 because it is deliberately WITHHELD.

The final read-only cumulative Custom Mix evaluation then reported:

- `mix_mute`: representative closed, mismatch 0;
- `mix_solo`: representative closed, mismatch 0;
- `mix_talkback`: representative closed, mismatch 0;
- fader: **7 changed paths**;
- pan: **4 changed paths**;
- Stereo/Mono: **2 changed paths**;
- routing to Custom Mix: **7 Output pairs observed**;
- Custom Mix meters: **12/12 closed, mismatch 0**;
- `FINAL CUSTOM MIX COVERAGE: COMPLETE`.

No new REC was required in the final resume because the cumulative evidence was already complete. That skip is intentional and does not mean the Custom Mix evidence was absent.

## `output_pair_source` decision

Older V8 pair-topology evidence was re-read and does not prove the stronger modern public contract. V3/V4 repeatedly failed full two-member closure, including V4 with reciprocal parser/schema pair metadata.

Therefore v1 deliberately **withholds `output_pair_source`** rather than weakening the exact hardware oracle.

Consequences:

- installed public actions do not expose it;
- presets using it are removed;
- V4 remains historical failure evidence;
- V5 never creates or presses it;
- internal research history may remain;
- this is not a claim that Stereo is unsupported.

## Stereo/Mono and Custom Mix evidence retained

Physical Focusrite Control operation and broad read-only REC work did exercise visible Stereo/Mono and Custom Mix behavior. Strong server-confirmed readback evidence exists for:

- faders;
- pan;
- Mute;
- Solo;
- source/stereo topology, including visible Stereo/Mono changes;
- Talkback state;
- all **12/12 Custom Mix meters**;
- currently available Output meters.

This is `HARDWARE_DYNAMIC_CLOSED` / `SESSION_STATE_OBSERVED` readback evidence. It is not automatically generic Companion write proof for `output_stereo`, `mixer_slot_stereo`, `mix_*`, or `output_pair_source`. Those v1 writes remain withheld.

## Runtime lifecycle repair retained

`src/main.js` refreshes filtered Output actions/presets when server-confirmed Output availability materialises or changes. Ordinary state packets do not rebuild definitions. Callback-time availability checks remain fail-closed. This repair is regression-tested and does not re-enable withheld write families.

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

## Exact next action

Hardware testing is complete for the frozen v1 public scope. Do **not** rerun the final hardware audit merely for repetition.

Next task is an **exact archive audit of the exact `focusrite-scarlett-18i20-0.1.21.tgz` generated/used on the user host**:

1. compute SHA-256 of the exact archive;
2. inspect exact package contents;
3. verify package/manifest version, runtime/API/product/license coherence;
4. inspect bundled public action/preset surface and forbidden-feature regressions;
5. run privacy scan for serials, private hostnames, client keys, local paths, raw captures/XML/diagnostics and user-specific data;
6. verify attribution/help content;
7. record only sanitized audit results in tracked docs.

Do not claim an exact artifact PASS from source reconstruction alone. The exact `.tgz` bytes or an audit run against those exact bytes are required.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing. The project replied that only Scarlett 18i20 (3rd Gen) is validated and is open to Bitfocus's preferred naming.

Wait for the official repository/naming decision before changing public scope. When the official repository exists, inspect exact name/default branch/seed files/permissions, compare with the cleaned RC, follow expected branch/PR workflow, run Bitfocus CI/local tests, keep stable target `v1.0.0` unless directed otherwise, and only submit a Developer Portal tag after hardware/action audit and CI are clean.
