# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module controlling the **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here

Do not resume this project from an old chat, copied handoff, historical upload, `main` alone, or an embedded SHA.

Resolve the live repository state first, then read:

1. [`HANDOFF`](HANDOFF)
2. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
3. [`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`](docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md)
4. [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md)
5. relevant current source/tests/evidence

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

## Current objective

The broad hardware feedback/protocol investigation is **closed for the v1 scope by evidence or deliberate write withholding**.

A post-audit V1 RELEASE SMOKE exposed a real cold-start lifecycle defect in the restrictive Output action policy: Output definitions could be filtered while server-confirmed availability was still unknown and then remain stale after availability materialised.

That runtime defect is repaired. The current objective is now:

**run one targeted V1 RELEASE SMOKE with the repaired 0.1.20 package, then repeat the exact package/privacy/forbidden-feature audit.**

Do not run another broad REC/FULL campaign merely for coverage.

## Current branch and package

Objective branch:

`testbench/meter-routing-exact-restore`

Development package version:

`0.1.20`

Latest fully green user-host runtime/package checkpoint:

`05a6c1801d75012fef864358c2f80c3758934ad7`

That checkpoint passed:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies;
- Prettier;
- ESLint;
- source manifest validation;
- **295/295 Node tests**;
- Companion package build;
- generated package `focusrite-scarlett-18i20-0.1.20.tgz`.

The lifecycle regressions explicitly cover initial Output availability materialisation, later availability changes, and avoiding rebuilds for ordinary state packets.

The prior exact `.tgz` audit belongs to an older `fd76b4e6...` archive. Because `src/main.js` changed after that audit, the repaired package needs a **fresh exact artifact audit** before final RC closure.

## Final v1 public write surface

Authoritative decision: [`docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`](docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md).

### Kept public writes

Monitor:

- Mute;
- Dim;
- Talkback;
- Monitor output-control preset.

Hardware Inputs:

- Air 1–8;
- Pad 1–8;
- Line/Instrument on Inputs 1–2;
- Input nickname.

Outputs, filtered by exact model, retained hardware evidence, and current server-confirmed availability:

- direct Mute on validated members only;
- analogue output Gain Set/Adjust on validated direct targets;
- direct source routing on validated targets and direct source families;
- validated stereo-pair source routing;
- Output nickname on validated direct targets.

Device/settings:

- Device nickname;
- Phantom Persistence;
- Talkback Source;
- Reconnect.

### Withheld public writes for v1

Readable state may remain where supported, but normal v1 write actions/presets are intentionally removed:

- ALT / Speaker Switching writes;
- Output Stereo writes;
- Mixer Slot Source/Stereo writes;
- generic Custom Mix Mute/Solo/fader/pan writes;
- per-lane Custom Mix Talkback write;
- Device Preset recall;
- Clock Source;
- Sample Rate;
- Digital I/O / S/PDIF Mode;
- Advanced Raw write action.

Withholding is deliberate scope control, not a claim that readable capability does not exist.

## Output lifecycle and safety policy

The repaired policy now rebuilds filtered Output actions/presets when server-confirmed Output availability materialises or changes. Callback-time availability checks remain in place, so stale actions still fail closed.

The v1 policy continues to enforce:

- direct Mute withheld on right/pair-owned members;
- pair-owned right Source withheld from direct routing while validated pair routing remains available;
- Monitor Outputs 1–2 direct Gain withheld;
- known no-effect Gain/Nickname paths withheld;
- Output Stereo write withheld globally;
- human Outputs 21–24 write-blocked even if a future configuration later reports them available, until that available configuration is explicitly hardware-tested;
- explicit `available=false` or unknown availability blocks writes wherever an availability descriptor exists.

## Custom Mix routing

Focusrite Control presents simply **Custom Mix** to the user, while the private server exposes multiple internal mix IDs.

`assign-mix` remains:

- present in the schema on 26/26 Outputs;
- materialised on 0/26 tested Outputs;
- raw semantics unknown;
- write transaction unknown;
- no public action/preset/feedback;
- no raw write.

Therefore v1 does not guess which internal mix ID represents the user's visible Custom Mix selection. Output Source actions do not offer those internal Custom Mix IDs, and stale saved attempts are blocked.

Direct Hardware Input / Software (DAW) Playback / digital routing remains available where hardware-tested.

## Latest broad readback evidence

Newest sanitized read-only REC: `2026-08-26T06:29:16.831Z`, module `0.1.19`.

Result:

- read-only harness;
- zero harness Focusrite writes;
- zero Companion button presses;
- 829 probes / 31 feedback definitions / 46 meters;
- **11 transitions / 11 PASS / 0 race / 0 mismatch**.

ALT / Speaker Switching feedback/readback is `HARDWARE_DYNAMIC_CLOSED`; the corresponding Companion writes remain withheld for v1 because direct write evidence did not equivalently close them.

Meters in the tested configuration:

- Hardware Inputs: **8/8 closed**;
- currently available Outputs: **22/22 closed**;
- Custom Mix meters: **12/12 closed**;
- total: **42/46 floor + movement closed**;
- remaining human Outputs 21–24 are server-confirmed `available=false` and therefore **CONFIGURATION_UNAVAILABLE**, not unsupported.

Do not alter Sample Rate or Digital I/O merely to expose Outputs 21–24 for coverage.

## Passive REC rule

A read-only/passive REC does **not** require Focusrite Control to be restored to its starting state merely because the final state differs. Exact baseline/restoration is mandatory only for write-capable reversible hardware tests where rollback is part of the safety contract.

## User-facing terminology

When describing Focusrite Control, use the terms visible in the application:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Internal TestBench `Mix A–F` labels are protocol/research identifiers only and must not be used as UI instructions.

## Permanent safety / feature boundaries

Keep these unless new real hardware testing explicitly changes them:

- supported hardware: **Scarlett 18i20 (3rd Gen) only**;
- dynamic Focusrite Control Server TCP port and device ID;
- writes only after Remote Devices authorization for this module's own server-assigned client ID;
- server-confirmed feedback/state only, never optimistic;
- no physical analogue input preamp Gain action;
- no direct per-input hardware Mute;
- no per-channel phantom switching;
- no Mic Kill;
- Monitor gain item `1677` remains read-only;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no meter/status writes;
- no write to UNKNOWN or explicit `available=false`;
- no Focusrite software/firmware update without explicit agreement;
- preserve privacy and required third-party attribution.

## Result retention and privacy

`testbench/results/` is intentionally gitignored. Raw/local diagnostics, screenshots, captures and arbitrary generated reports are not published automatically.

Never publish real serials, private hostnames, client keys, endpoints, private IDs, raw private XML/captures, private diagnostics, or user-specific paths.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested that `focusrite-control` may be a better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing.

The project position remains:

- only Scarlett 18i20 (3rd Gen) is validated today;
- broader naming is acceptable if Bitfocus prefers it;
- broader device support must not be claimed before real testing.

Wait for the official repository/naming decision before changing public scope. Stable public release target remains `v1.0.0` unless maintainers direct otherwise.

## Next validation step

Using the newly generated `focusrite-scarlett-18i20-0.1.20.tgz` from checkpoint `05a6c180...`:

1. import that package into Companion;
2. keep the existing Focusrite connection and select Module Version `0.1.20`;
3. run the normal read-only preflight;
4. run the canonical **V1 RELEASE SMOKE V3** only;
5. if clean, repeat the exact package/privacy/forbidden-feature audit on this repaired archive.

Do not run another broad hardware REC merely for coverage.
