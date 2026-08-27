# Current handoff — Focusrite Control / Companion

## POST-ABORT OVERRIDE — 2026-08-27

**This section supersedes the older “Exact next action — write-promotion campaign” text lower in this file.**

Newest completed research code checkpoint before this documentation update:

`682441a1b82efa682cecec7cb4147595b579d300`

Post-quarantine user-host software gate:

- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **315/315 tests PASS**;
- Companion package build PASS;
- rebuilt 0.1.21 package was not installed.

Newest physical write evidence is the Output Stereo `FAIL_COLLATERAL_DRIFT` / `HARD ABORT` recorded in `docs/WRITE_PROMOTION_ABORT_2026-08-27.md`.

Current write-promotion classifications:

- Custom Mix: limited individual direct targets `HARDWARE_WRITE_CONFIRMED`; generic write families remain `WITHHELD`;
- Mixer Slot Source/Stereo: direct attempts `FAIL_NO_TRANSITION`; remain `WITHHELD`;
- ALT readback: `HARDWARE_DYNAMIC_CLOSED`; direct write remains `UNKNOWN` / `WITHHELD`;
- Output Stereo readback: `HARDWARE_DYNAMIC_CLOSED`;
- Output Stereo direct write: `WITHHELD` after collateral-drift hard abort;
- `output_pair_source`: remains independently `WITHHELD`.

Output Stereo and broad `all-nondisruptive` reruns are now quarantined in TestBench.

**Current next action is software/research analysis only. No further hardware write is authorised merely to diagnose the abort.** A future Stereo write requires a redesigned pair-aware safe oracle first.

Public `main`, public v1 write claims and package version 0.1.21 are unchanged.

Updated: 2026-08-27
Research branch: `testbench/meter-routing-exact-restore`  
Public mirror: `main`  
Current development build: **0.1.21**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the current remote HEAD of the objective-owning branch and `main`, inspect repository-wide branch movement across meaningful research/development branches, recent merges, and newer commits/diff, then determine which branch currently owns the canonical internal handoff. Read root `HANDOFF`, this file, newer referenced audit/history/decision docs, and compare them with current source/tests and newer hardware evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → newest Git movement → current handoff → audits/history → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, `WITHHELD`, and `UNSUPPORTED`.

## Public `main` — clean RC promoted

Current public `main` HEAD:

`57af699632c5f78890fb1464e60815d4dc096f21`

Current public tree:

`b1a2d14342ae8d80babad720c15011c3d4c2fedc`

PR #3 promoted the minimal public 0.1.21 RC/source tree. PR #4 later changed **README.md only** to clarify validation categories for Bitfocus review. No `src/`, `companion/`, `package.json`, `manifest`, `yarn.lock`, action/preset surface, or packaged 0.1.21 bytes changed in PR #4.

The public tree intentionally excludes all internal continuity/research material:

- no `testbench/`;
- no root `HANDOFF`;
- no research `docs/` handoff tree;
- no AI/project instruction files;
- no local `RUN*.bat` / `UPDATE*.bat` project launchers;
- no hardware campaign results, private diagnostics, raw captures, or generated test pages.

The README now clearly distinguishes:

1. hardware-write validated public controls;
2. hardware-observed/read-only state;
3. strict-write failures/withheld paths such as `output_pair_source`;
4. disruptive settings deliberately excluded from the v1 write campaign;
5. explicit non-features such as analogue preamp Gain, direct input Mute, per-channel phantom, Mic Kill, and physical Monitor-level control.

## Bitfocus repository / CI naming requirement

Current Bitfocus docs/template use the shared workflow:

`bitfocus/actions/.github/workflows/module-checks.yaml@main`

A live trial on the personal mirror confirmed that the shared workflow rejects the repository **before code/package checks** because `Rzbck/focusrite-control` does not start with `companion-module-` or `companion-surface-`. The same workflow also validates `manifest.id` against the repository name after removing the `companion-module-` prefix.

Therefore:

- do not add that shared workflow to the current personal mirror;
- do not rename the mirror or change `manifest.id` merely to make the workflow pass;
- wait for the official Bitfocus repository/name decision;
- once the official `companion-module-*` repository exists, align repo name, `manifest.id`, package/repository URLs and public naming coherently, then run the shared Bitfocus CI there.

This confirms why the pending `focusrite-scarlett-18i20` versus `focusrite-control` naming decision must be resolved before final repository identity changes.

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

PR #4 is README-only, so this gate remains applicable to the packaged 0.1.21 source/runtime bytes.

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

## Exact 0.1.21 archive audit

The exact user-host RC archive was audited before public cleanup.

SHA-256:

`c8b948a06d1164caf27f3790236e75d4d6e6e0a77aaff0ad4b52840ec199dfd4`

Result: **PASS**.

The exact package contained only the expected Companion package payload and passed package/manifest coherence, public-surface/forbidden-feature checks, privacy scan, and attribution/help audit.

Do not claim another rebuilt archive is this exact audited artifact unless its bytes/hash are verified.

## Final hardware status

The v1 hardware/protocol investigation is **closed for the frozen public scope by explicit evidence or deliberate write withholding**.

Final retained public-write smoke on 0.1.21:

- **42/42 PASS**;
- hard abort: false;
- exact restoration/global safety: clean;
- reconnect: PASS;
- `output_pair_source` deliberately absent from the public smoke.

Final cumulative read-only Custom Mix closure:

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

Older V8 pair-topology evidence does not prove the stronger modern two-member public write contract. V3/V4 repeatedly failed strict two-member closure, including V4 with reciprocal parser/schema pair metadata.

Therefore v1 deliberately **withholds `output_pair_source`** rather than weakening the exact hardware oracle. This is not a claim that Stereo is unsupported.

## Hardware-observed readback versus generic writes

Physical Focusrite Control operation and broad read-only REC work exercised visible Stereo/Mono and Custom Mix behavior. Strong server-confirmed readback evidence exists for faders, pan, Mute, Solo, source/stereo topology, Talkback, all **12/12 Custom Mix meters**, currently available Output meters, and ALT/Speaker Switching state.

This is `HARDWARE_DYNAMIC_CLOSED` / `SESSION_STATE_OBSERVED` evidence. It is not automatically generic Companion write proof for `output_stereo`, `mixer_slot_stereo`, `mix_*`, ALT writes, or `output_pair_source`.

## Final v1 public write surface

Kept public writes:

Monitor:

- `monitor_mute`
- `monitor_dim`
- `monitor_talkback`
- `monitor_preset`

Hardware Inputs:

- `input_air`
- `input_pad`
- `input_mode`
- `input_mode_cycle`
- `input_nickname`

Outputs, filtered by exact model/evidence/live availability:

- `output_mute`
- `output_gain_set`
- `output_gain_adjust`
- `output_source`
- `output_nickname`

Device/settings:

- `device_nickname`
- `phantom_persistence`
- `talkback_source`
- `reconnect`

Withheld public writes for v1:

- `monitor_alt_enable`
- `monitor_alt`
- `output_stereo`
- `output_pair_source`
- `mixer_slot_source`
- `mixer_slot_stereo`
- `mix_mute`
- `mix_solo`
- `mix_gain_set`
- `mix_gain_adjust`
- `mix_pan`
- `mix_talkback`
- `device_preset`
- `clock_source`
- `sample_rate`
- `spdif_mode`
- `advanced_raw_set`

Withholding is deliberate v1 scope control, not an unsupported-hardware claim.

## Permanent safety boundaries

- Scarlett 18i20 (3rd Gen) only.
- Dynamic Focusrite Control Server TCP port and device ID.
- Writes only after Remote Devices authorisation/authorization matched to this module's own server-assigned client ID.
- Server-confirmed feedback/state only, never optimistic.
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

Current packaged development build is **0.1.21**. Do not publish different package bytes under the same development version. Any future packaged runtime/help/manifest change must bump the development version. Research/TestBench/handoff/docs-only changes do not require another package-version bump. Stable public target remains `v1.0.0` unless Bitfocus maintainers direct otherwise.

## Exact next action — write-promotion campaign

The Bitfocus publication/naming decision is still pending, but it no longer blocks the current research validation. On 2026-08-27 the user explicitly chose to continue proving withheld non-disruptive write families.

Dedicated research/TestBench workflows stay separate from the installed Companion client and from public `main`. The Write Promotion probe is an explicit research exception that uses a separate persistent Remote Device identity for a specific reason: it must prove direct Focusrite Control Server transactions without weakening the frozen public definition policy. It does not reuse or expose the Companion connection's private client key.

Writes only after Remote Devices authorisation/authorization matched to this probe's own server-assigned client ID. Server-confirmed feedback/state only, never optimistic. Before any write mode, the operator must explicitly approve the `Companion Write Promotion Probe` Remote Devices entry and physically isolate audio as instructed.

Run the checked-in:

`UPDATE_AND_RUN.bat`

The software gate must be clean before any write mode. Do **not** run another broad hardware REC; reuse the already-closed readback, meter, V5 retained-write, and `output_pair_source` evidence.

After the software gate, run `RUN_WRITE_PROMOTION.bat` and choose `[1] INVENTAIRE READ-ONLY` first. Review the sanitized inventory before starting the smallest necessary write mode, beginning with Custom Mix.

Direct-probe PASS proves only the real-hardware Focusrite Control Server item transaction. A production action is not `HARDWARE_WRITE_CONFIRMED` until it is enabled in a newer development build and also passes a focused installed-Companion exact-restore smoke.

Monitor gain 1677, `assign-mix`, `output_pair_source`, Advanced Raw, disruptive Device Preset/Clock/Sample Rate/S/PDIF settings, unavailable/unknown Outputs, and permanent non-features remain outside this campaign.

This research/TestBench/handoff-only work does not require a package-version bump. The next packaged production/runtime/help/manifest change after 0.1.21 must bump the development version.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing. The project replied that only Scarlett 18i20 (3rd Gen) is validated and is open to Bitfocus's preferred naming.

Do **not** rename or broaden the current public module/repository until Bitfocus gives the official decision.
