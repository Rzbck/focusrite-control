# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T11:07+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_BLOCKED_PENDING_RERUN_AFTER_TEST_FIX
Latest user checkout: 32bb7e7280f7727a62fe377a8744a6c4fc6b4d76
Latest user gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 182/183 PASS, package step NOT reached
Hardware writes in latest user gate: NO
Latest hardware campaign: SAFE FUNCTIONAL STOP, hardware restore YES, Companion Page 2 restore YES, mismatch 0

## Canonical freshness rule

This file is the canonical living resume point for the active branch.

Before proposing code, hardware work, branch changes or publication work:

1. identify the active branch;
2. fetch the current remote branch state;
3. read this file from that same branch;
4. reconcile the newest user-pasted run output;
5. treat older Project uploads/chat summaries as historical unless proven current;
6. prefer newer explicit hardware evidence and current checked-in code over older assumptions.

Current supported hardware remains exactly **Scarlett 18i20 (3rd Gen)**.

Do NOT rerun FULL for the current meter-closure issue.

## Package checkpoints

Canonical broad hardware package:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

This exact package produced canonical V8 FULL-from-zero hardware evidence.

Current production candidate installed in Companion during meter closure:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do NOT install a `.tgz` rebuilt by this TestBench branch. Keep Companion on the exact already audited/live-validated 0.1.16 package.

## Canonical V8 broad evidence

V8 FULL-from-zero remains the broad write-capable hardware evidence:

- exact model Scarlett 18i20 (3rd Gen);
- physical isolation confirmed;
- inventory 1436/1436 classified;
- snapshot 1340/1340 mapped;
- core 21/21 mapped;
- feedback 829 probes / 31 definitions;
- no FAIL-class final summary.

Permanent safety policy remains unchanged:

- Monitor gain item 1677 is read-only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no unknown raw writes;
- no firmware/reset/restore/snapshot commands;
- no writes to availability UNKNOWN outputs;
- feedback/state must be server-confirmed;
- Focusrite Control Server port and device ID remain dynamic.

## Meter closure checkpoint

There are exactly 46 meter paths:

- 8 input meters;
- 26 output meters;
- 12 mix-lane meters.

Accumulated evidence before the focused Playback-slot run:

- closed 14/46;
- floor-only 24;
- movement-only 4;
- never observed 4;
- mismatch 0;
- input 8/8 closed;
- output 4/26 closed;
- mix 2/12 closed.

The existing Playback source is detected dynamically. In the current hardware session it was mixer slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded.

## Latest focused hardware run

Launcher:

`testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`

Read-only preparation PASS:

- r9 page audit PASS;
- module version 0.1.16 PASS;
- exact Scarlett 18i20 (3rd Gen) write profile PASS;
- own Companion module client authorized PASS;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes PASS;
- evidence coverage PASS;
- output availability AVAILABLE=22, UNKNOWN=4;
- V8 capability-lab Page 2 audit PASS;
- no hardware write during preparation.

User explicitly confirmed `MIX_METERS`, `ALL_ISOLATED` and `SIGNAL_READY`.

Focused eligibility was 2/12 lanes with exact Playback-slot gain/mute/solo baselines.

Observed result:

- temporary focused Page 2 imported successfully;
- Playback activity confirmed;
- first eligible lane failed immediately before new meter evidence was captured;
- Companion Page 2 restore PASS;
- hardware restore confirmed YES;
- mismatch remained 0;
- exit code 2 / CAMPAIGN_FAILED;
- this is NOT a restore quarantine and NOT a hard abort.

## Hardware failure root cause

The focused harness originally emitted Companion boolean action options using canonical server strings `true` / `false`.

But the public actions in `src/actions.js` accept `on` / `off` / `toggle`.

Therefore the first FLOOR state asked for mute `true`, but the action encoded it as OFF. The following server-confirmed FLOOR check failed, then the finally/restore path restored the exact baseline successfully.

Remote runtime correction:

- `ce14fd3d3f93a763146486c2b007ff22f61c6f05` - add `actionBoolState()` and encode canonical true/false as Companion on/off for FLOOR, DRIVE and exact RESTORE.

Write scope remains unchanged:

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

## Latest software gate after runtime fix - 2026-08-24 11:07 +02:00

User synchronized to:

`32bb7e7280f7727a62fe377a8744a6c4fc6b4d76`

Observed gate:

- canonical branch/HEAD fingerprint PASS;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- tests 182/183 PASS;
- package step NOT reached;
- no hardware write occurred.

The single failing test was:

`focused mix harness emits Companion boolean action states as on/off and preserves true baselines`

Failure:

`undefined !== 'on'`

This failure was in the test lookup, not the runtime harness. The test guessed batch IDs containing `mix-a-l` / `mix-a-r`, while `laneId()` intentionally removes spaces and returns IDs containing `mixa-l` / `mixa-r`.

Remote test-only correction:

- `9c8638f8f19b5519e0c3d0d0915ba77690f8c9d2` - resolve FLOOR/RESTORE batch IDs from the returned lane objects instead of guessing their string format.

No runtime/TestBench write behavior changed in this test-only correction.

## Exact next action

Do NOT run hardware yet.

Run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur testbench/meter-routing-exact-restore
```

Required full gate:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- **183/183 tests PASS**;
- Companion package build PASS;
- RUN OK.

Do NOT install the rebuilt `.tgz`.

If any software step fails, do not run hardware. Diagnose the complete failure first.

If and only if the full gate is green, rerun only:

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

Operator flow:

1. run `testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`;
2. read-only preparation;
3. `PAGE2_AUTO` only if requested;
4. `MIX_METERS`;
5. `ALL_ISOLATED`;
6. continuous reasonable-level PC Playback signal;
7. `SIGNAL_READY`;
8. do not touch Focusrite routing while lanes cycle.

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
