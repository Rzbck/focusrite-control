# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Current development build: **0.1.20**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live repository and newer material branch movement. Resolve the **current remote HEAD** of the objective branch, inspect repository-wide branch movement and newer commits/diff, then read root `HANDOFF`, this file, `docs/FINAL_RC_ARTIFACT_AUDIT_2026-08-26.md`, `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

## Current objective — technical RC closed

The broad hardware feedback/protocol investigation is **closed for the v1 scope by explicit evidence or deliberate write withholding**.

The restrictive **0.1.20 v1 public write surface has now passed the complete user-host software gate and the exact generated `.tgz` has passed the final package/privacy/forbidden-feature artifact audit**.

All remaining material unproven/disruptive write families were withheld rather than promoted from readback evidence.

There is **no remaining broad hardware campaign, REC, software gate, or package audit to run for the current 0.1.20 technical RC**.

Current project state:

**WAIT FOR THE OFFICIAL BITFOCUS REPOSITORY / NAMING DECISION.**

Do not broaden the public hardware scope or rename the public module before that decision.

## Final green software/package checkpoint

Exact code/package checkpoint:

`fd76b4e6d25d479c2f0c426ac2c3b908fa42ddd4`

The user-host `UPDATE_AND_RUN.bat` gate completed successfully on 2026-08-26:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependency install: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- **283/283 Node tests: PASS**;
- Companion package build: PASS;
- generated package: `focusrite-scarlett-18i20-0.1.20.tgz`.

No Focusrite hardware write was performed by that software gate.

The historical marker **SOFTWARE-GATE-PENDING** is now superseded by this completed green checkpoint. Pending is never PASS; this checkpoint is PASS because every gate stage reached completion successfully.

## Final exact artifact audit

Tracked audit:

`docs/FINAL_RC_ARTIFACT_AUDIT_2026-08-26.md`

Exact artifact:

`focusrite-scarlett-18i20-0.1.20.tgz`

SHA-256:

`cfa4ba62c11e2a91780122eb38a0a0570d6122e0c5fc7d91652008a6838a5716`

The exact uploaded archive was opened and inspected directly.

Archive contents are only:

- bundled `main.js`;
- generated `package.json`;
- `companion/HELP.md`;
- generated `companion/manifest.json`.

Generated metadata is coherent:

- package version `0.1.20`;
- manifest version `0.1.20`;
- runtime `node22`;
- module API `2.0.0`;
- product list exactly `Scarlett 18i20 (3rd Gen)`;
- MIT license.

The bundled default module export imports successfully.

A synthetic Companion instance-context audit was run directly against the bundled `main.js`, deliberately enabling stale diagnostic/raw config values to verify fail-closed behavior. The installed public action surface contained only the retained v1 actions. No withheld action or withheld preset survived the installed definition policy, and no Advanced Raw configuration field was exposed.

Artifact classification: **PASS**.

## Final v1 public write surface

Authoritative policy audit:

`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`

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

Outputs, filtered by exact model, retained evidence and server-confirmed availability:

- `output_mute` on validated direct members only;
- `output_gain_set` / `output_gain_adjust` on validated analogue gain targets;
- `output_source` on validated direct targets and direct source families;
- `output_pair_source` on validated pairs/direct stereo source families;
- `output_nickname` on validated direct targets.

Device/settings:

- `device_nickname`;
- `phantom_persistence`;
- `talkback_source`;
- `reconnect`.

### WITHHELD PUBLIC WRITES FOR V1

Readable state may remain available, but normal v1 write actions/presets are removed:

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

No further physical test is required for v1 for these withheld families.

This is deliberate v1 scope control, not a claim that readable capabilities do not exist.

## Forbidden-feature / raw audit

The packaged public action surface contains no:

- physical analogue input preamp Gain action;
- direct per-input hardware Mute action;
- per-channel phantom-power action;
- Mic Kill;
- Monitor Gain Set/Adjust action;
- Output Stereo write;
- generic Custom Mix write;
- Advanced Raw write;
- firmware/reset/restore/snapshot command surface.

Monitor gain item `1677` remains read-only.

Internal parser/action helper code may remain bundled because the module must understand readable state and historical internal definitions, but the installed production definition policy strips the withheld public writes. Bundled helper presence is not public action exposure.

## Custom Mix / `assign-mix`

Focusrite Control presents simply **Custom Mix**. The server exposes internal mix IDs, but there is no reliable user-visible mapping.

Output `assign-mix` final v1 classification:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised through active routing sessions;
- raw semantics `UNKNOWN`;
- write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no raw write.

Output Source/Pair Source actions therefore do not offer internal Custom Mix source IDs, and stale saved attempts are callback-blocked.

Do not rerun `NAVIGATE_MIXES`; do not write `assign-mix`; it is not a v1 blocker.

## Newest physical hardware result

Latest sanitized read-only REC:

`2026-08-26T06:29:16.831Z`, module `0.1.19`.

Fingerprint:

- size 606632 bytes;
- SHA-256 `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`.

Result:

- read-only harness;
- zero harness hardware writes;
- zero Companion button presses;
- 829 probes / 31 feedback definitions / 46 meters;
- **11 transitions / 11 PASS / 0 race / 0 mismatch**.

Tracked summary: `docs/HARDWARE_VALIDATION_2026-08-26_ALT_METERS.md`.

### ALT / Speaker Switching

Feedback/readback is **HARDWARE_DYNAMIC_CLOSED**:

- `monitor_alt_enable`: both states, 3 PASS transitions;
- `monitor_alt`: both states, 4 PASS transitions;
- Output 3 availability changed with Speaker Switching ownership;
- 0 race / 0 mismatch.

ALT writes remain withheld for v1 because Companion direct-write evidence did not equivalently close those transactions.

### Meters

Current configuration:

- Inputs: **8/8 closed**;
- available Outputs: **22/22 closed**;
- Custom Mix: **12/12 closed**;
- total: **42/46 floor + movement closed**;
- Outputs 21–24 are `available=false`: **CONFIGURATION_UNAVAILABLE**, not unsupported.

No remaining meter test. Do not change Sample Rate or Digital I/O merely to expose Outputs 21–24.

## Passive REC state rule

A read-only/passive recorder does **not** require the user to restore Focusrite Control to its starting state merely because the final snapshot differs.

Exact baseline/restoration remains mandatory only for write-capable reversible hardware tests where safe rollback is part of the test contract.

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

## Remote Devices / safety boundaries

Permanent rules:

- Scarlett 18i20 (3rd Gen) only;
- Focusrite Control Server TCP port and device ID are dynamic;
- writes only after Remote Devices authorisation for this module's **own server-assigned client ID**;
- server-confirmed feedback/state only, never optimistic;
- no write to UNKNOWN or explicit `available=false`;
- Monitor gain item `1677` read-only;
- no physical analogue input preamp Gain;
- no direct per-input hardware Mute;
- no per-channel phantom switching;
- no Mic Kill;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot;
- no meter/status writes;
- do not update Focusrite software/firmware without explicit agreement.

Dedicated research/TestBench workflows remain separate from the normal public module and normal write path.

## Privacy / attribution

The exact `.tgz` privacy scan found no user-specific Windows/project path, user handle, email address, UUID/client-key value, private IPv4 address, real hostname, or captured hardware value.

Generic protocol terms such as `serial`, `client-key`, `<device>`, `<set>` and `<item>` necessarily exist as parser/templates; no real private values or raw device capture are embedded.

`companion/HELP.md` in the package is byte-for-byte the tracked public HELP blob. It carries the full Bitfocus MIT notice and states that the project combines original hardware testing with public prior protocol research and does not claim every protocol detail was independently discovered.

`testbench/results/`, diagnostics, captures, local builder tools and `.tgz` artifacts remain excluded from Git as appropriate.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better repository/module scope and offered hardware for future testing.

Keep supported hardware at **Scarlett 18i20 (3rd Gen) only**. Wait for the official repository/naming decision before changing public scope.

When the official Bitfocus repository exists:

1. inspect exact repository name, default branch, seed files and permissions;
2. compare them with this cleaned RC;
3. follow the expected branch/PR workflow instead of overwriting blindly;
4. run Bitfocus CI and local tests;
5. keep the stable public target at `v1.0.0` unless maintainers direct otherwise;
6. only submit the Developer Portal tag after official-repository CI and final hardware/action audit are clean.

## Exact next action

**No action is required from the user right now. Do not run another gate or REC merely for coverage.**

For any future material code change, use the canonical launcher workflow.

Run the checked-in:

`UPDATE_AND_RUN.bat`

before treating that changed code as green.

Do **not** run another broad hardware REC unless a new concrete hardware question or official maintainer request genuinely requires one.

Current technical RC state: **COMPLETE / WAITING FOR BITFOCUS REPOSITORY-NAMING DECISION**.
