# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T11:00+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_BLOCKED_PENDING_RERUN_AFTER_HW_DIAGNOSIS
Last software-green executable checkout: 4108adbae1d1c458b15a4a9da5f768b367c65b6e
Last software gate on that checkout: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 182/182 PASS, Companion package build PASS, RUN OK
Latest hardware campaign on that checkout: SAFE FUNCTIONAL STOP, exact hardware restore YES, Companion Page 2 restore YES, mismatch 0

## Read this first

This file is the canonical living resume point for the active branch.

For any AI/contributor with GitHub access, do not treat an uploaded Project handoff, old chat summary, copied log, or older branch document as current until it is reconciled with the current remote branch and this file.

Before proposing code, hardware work, branch changes or publication work:

1. identify the active branch;
2. fetch the current remote branch state;
3. read this file from that same branch;
4. reconcile the newest user-pasted run output;
5. prefer newer explicit hardware evidence and current checked-in code over older assumptions.

Current hardware scope remains exactly Scarlett 18i20 (3rd Gen) only.

Do NOT rerun FULL for this issue.

## Canonical package checkpoints

### 0.1.15

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

This exact package produced canonical V8 FULL-from-zero hardware evidence.

### 0.1.16

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

This remains the exact audited/live-validated Companion production candidate used during meter closure. Do NOT install a `.tgz` rebuilt by the TestBench branch.

## Canonical V8 broad evidence

V8 FULL-from-zero remains the broad write-capable hardware evidence:

- exact model Scarlett 18i20 (3rd Gen);
- physical isolation confirmed;
- inventory 1436/1436 classified;
- snapshot 1340/1340 mapped;
- core 21/21 mapped;
- 829 feedback probes / 31 definitions;
- no FAIL-class final summary.

Permanent withheld/unsupported policy remains unchanged, including Monitor gain item 1677 read-only, no input preamp gain, no direct per-input hardware mute, no per-channel phantom switching, no Mic Kill, no unknown raw writes, no firmware/reset/restore/snapshot commands, and no writes to availability UNKNOWN outputs.

## Meter closure checkpoint before focused run

There are exactly 46 meter paths:

- 8 input meters;
- 26 output meters;
- 12 mix-lane meters.

Accumulated evidence before the focused run:

- closed 14/46;
- floor-only 24;
- movement-only 4;
- never observed 4;
- mismatch 0;
- input 8/8 closed;
- output 4/26 closed;
- mix 2/12 closed.

The existing Playback source is detected dynamically. In the current hardware session it was mixer slot 3, Playback 1 / stereo. Never hardcode slot 3.

## Latest focused hardware run - 2026-08-24 around 11:00 +02:00

Launcher:

`testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`

The user kept Companion on the exact validated 0.1.16 package and did not install the TestBench-built `.tgz`.

Read-only preparation PASS:

- r9 page audit PASS: 42 SAFE setters + 829 feedback probes + 31 definitions;
- module version 0.1.16 PASS;
- exact Scarlett 18i20 (3rd Gen) hardware-tested write profile PASS;
- own Companion module client authorized PASS;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes PASS;
- evidence coverage 1436/1436 inventory rows classified, snapshot 1340/1340, core 21/21;
- output availability AVAILABLE=22, UNKNOWN=4;
- V8 capability-lab Page 2 audit PASS;
- no hardware write occurred during preparation.

The user then explicitly confirmed:

- `MIX_METERS`;
- `ALL_ISOLATED`;
- `SIGNAL_READY` with Playback activity confirmed.

Focused eligibility was 2/12 lanes with exact Playback-slot gain/mute/solo baselines.

Observed functional result:

- the temporary focused Page 2 imported successfully;
- Playback activity was confirmed;
- the first eligible lane operation failed immediately before any meter capture changed the accumulated evidence;
- no per-lane PASS/INFO result was emitted;
- Companion Page 2 restore PASS;
- hardware restore confirmed YES;
- final mismatch remained 0;
- campaign exit code 2 / `CAMPAIGN_FAILED`;
- this is NOT a restore quarantine and NOT a hard abort.

Final evidence remained unchanged at closed 14/46, floor-only 24, movement-only 4, never 4, mismatch 0.

## Root cause proven from current code

The failure chain is now understood; do not treat it as an unknown hardware failure.

The focused harness generated boolean Companion action options like:

- `mix_solo` with `state: 'false'`;
- `mix_mute` with `state: 'true'` or `state: 'false'`;
- restore states directly from canonical server values `'true'` / `'false'`.

But the public Companion actions in `src/actions.js` accept boolean choices:

- `on`;
- `off`;
- `toggle`.

`setBoolean()` maps only requested `on` to server `true`; any other explicit value that is not `toggle` becomes server `false`.

Therefore the first FLOOR batch requested `mix_mute state='true'`, but the public action interpreted that as OFF / server false. The following server-confirmed FLOOR check expected mute true and failed immediately. The finally block restored the original baseline successfully, which matches the observed hardware restore YES and unchanged meter evidence.

This also exposed a restore risk for any baseline whose canonical mute/solo value was true: passing canonical `'true'` directly to the public action would also have encoded OFF. The fix must therefore cover both test states and exact restoration states.

## Remote correction after hardware diagnosis

Committed on this branch:

- `ce14fd3d3f93a763146486c2b007ff22f61c6f05` - add `actionBoolState()` in `MeterMixPlaybackPage.js` and encode canonical true/false as Companion `on`/`off` for FLOOR, DRIVE and exact RESTORE;
- `fca6cf91474acbf697825b45463b943bcc90aee6` - add a regression test proving focused `mix_mute` / `mix_solo` specs emit only `on`/`off`, never `true`/`false`, and preserve true baselines during restore.

The focused write scope is unchanged:

- `mix_gain_set`;
- `mix_mute`;
- `mix_solo`;
- dynamically detected existing Playback slot only.

Still absent:

- direct Focusrite protocol `<set>`;
- `output_source`;
- `output_pair_source`;
- Pair Source=None guards;
- Mixer Slot Source/Stereo writes;
- Advanced Raw;
- Monitor gain 1677 writes;
- firmware/reset/restore/snapshot;
- Device Preset / Clock Source / Sample Rate / S/PDIF Mode.

The new code has NOT yet passed the user's Windows software gate. Hardware must not be rerun first.

## Next software gate

Run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur testbench/meter-routing-exact-restore
```

The new regression test raises the expected total to:

- 183/183 tests PASS.

Required complete gate:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- 183/183 tests PASS;
- Companion package build PASS;
- RUN OK.

Do NOT install the rebuilt `.tgz`.

If any software step fails, do not run hardware. Diagnose the complete failure first.

If the full gate is green, rerun only:

```bat
testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd
```

Do not rerun FULL and do not rerun the old broad `RUN_METER_ROUTING_EXACT_RESTORE.cmd` merely because focused closure is pending.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware test:

1. reuse the existing Companion Focusrite connection;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm **Companion Scarlett 18i20** is approved if required;
4. require the read-only preflight to confirm exact supported model, dynamic discovery and own-client authorization;
5. if approval/preflight is missing, classify the result as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md` for the stable private client identity rules.

Never create a fresh throwaway write client or new client key for normal validation. Never run a direct Focusrite Control Server research probe concurrently with a normal write-capable Companion TestBench campaign.

## Focused hardware rerun after a green gate

Keep:

- Companion on the exact audited 0.1.16 package;
- existing Companion Focusrite connection;
- physical Monitor knob low;
- active speakers muted/disconnected if practical;
- headphones removed or minimum;
- no live show / critical recording.

Run `testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`.

Expected operator flow:

1. read-only preparation;
2. `PAGE2_AUTO` only if requested;
3. `MIX_METERS`;
4. `ALL_ISOLATED`;
5. continuous reasonable-level PC Playback signal;
6. `SIGNAL_READY`;
7. do not touch Focusrite routing while lanes cycle.

Stop all further hardware work if final output contains:

- `RESTORE FAILED`;
- `HARD ABORT`;
- `Hardware restore confirme: NO`;
- `Companion Page 2 base restauree: NO`.

## Publication/privacy state

Never publish real serials, private hostnames, client IDs/keys, raw private XML/captures/logs, user paths, or private diagnostics.

Preserve relevant MIT/third-party attribution. Do not claim all protocol knowledge was independently discovered.

Official Bitfocus repository/name remains pending maintainer decision. The personal repository name `focusrite-control` does not expand validated hardware support beyond Scarlett 18i20 (3rd Gen).

Stable public target remains v1.0.0 unless Bitfocus maintainers direct otherwise.

Always distinguish hardware-tested, implemented, schema-observed, research-only and unsupported.
