# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T10:41+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_BLOCKED_PENDING_RERUN
Last user checkout: 66bf44bd0fd524ef6014b332f528005da79a453d
Last user gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 181/182 PASS, package step NOT reached
Hardware writes in last user gate: NO

## Read this first

This file is the canonical living resume point for the active branch.

For any AI/contributor with GitHub access, do not treat an uploaded Project handoff, old chat summary, copied log, or older branch document as current until it is reconciled with the current remote branch and this file from the same checkout.

Before proposing code, a hardware run, a branch change, or publication work:

1. identify the active branch;
2. fetch the current remote branch state;
3. read this file from that same branch;
4. reconcile the newest user-pasted `UPDATE_AND_RUN.bat` output;
5. prefer newer explicit hardware evidence and current checked-in code over older assumptions.

Read also when relevant:

- `AI_PROJECT_RULES.md`
- `docs/REMOTE_DEVICES_AUTHORIZATION.md`
- `docs/VALIDATION_CLOSURE_AND_FUTURE_HARDWARE_PROTOCOL.md`
- `docs/METER_CLOSURE_CHECKPOINT_2026-08-24.md`

## Exact current objective

Do NOT rerun FULL.

Finish the software gate for the focused existing-Playback-slot mix meter closure campaign. Only after the software gate is fully green may the focused hardware launcher run.

Current hardware scope remains exactly:

- Focusrite Scarlett 18i20 (3rd Gen) only

Do not generalize current write evidence to another Focusrite model.

## Canonical package checkpoints

### 0.1.15 - canonical broad write-capable hardware evidence

Archive:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

This exact package produced the canonical V8 FULL-from-zero hardware evidence.

### 0.1.16 - current production candidate

Archive:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Validated for this exact archive:

- production software gate PASS at its checkpoint;
- package/archive audit PASS;
- live Companion startup PASS;
- dynamic Focusrite Control Server discovery PASS;
- exact Scarlett 18i20 (3rd Gen) detection PASS;
- own-client Remote Devices authorization PASS;
- read-only preflight PASS;
- availability hardening only; no new write capability.

Do NOT install a `.tgz` rebuilt by the meter TestBench branch. Companion must remain on the exact already audited/live-validated 0.1.16 package during this closure work.

## Canonical V8 hardware evidence

Published sanitized result:

`docs/hardware-results/LATEST_SHAREABLE.json`

Key facts:

- revision `full-v8-generic-evidence-profile-20260823`;
- signature `fb915f311956ac65`;
- exact model Scarlett 18i20 (3rd Gen);
- physical isolation confirmed;
- inventory 1436/1436 classified;
- snapshot 1340/1340 mapped;
- core 21/21 mapped;
- feedback 829 probes / 31 definitions;
- zero unclassified rows;
- no FAIL-class final summary.

Important hardware policy remains:

- Outputs 21-24 availability UNKNOWN => no writes;
- direct Mute withheld on Outputs 2/4/6/8/10;
- right-member direct Source is pair-owned/withheld on proven members;
- known no-effect Stereo/Nickname/Gain members remain withheld;
- Monitor Out1/2 direct Gain remains withheld;
- Monitor gain item 1677 remains read-only;
- Mixer Slot Source/Stereo writes remain withheld;
- per-lane Mix Talkback writes remain withheld;
- global Monitor Talkback is separate and valid;
- Advanced Raw cannot bypass hardware/availability policy.

## Meter closure checkpoint

There are exactly 46 meter paths:

- 8 input meters;
- 26 output meters;
- 12 mix-lane meters.

The correct meter evidence is numeric floor at `-128 dBFS` plus real movement strictly above floor, while rendered Companion feedback remains coherent with the production threshold oracle.

The completed broad routing exact-restore meter campaign produced:

- 14/46 paths closed;
- 32 floor-only;
- 0 mismatch;
- inputs 8/8 closed;
- outputs 4/26 closed;
- mixes 2/12 closed;
- hardware restore YES;
- Companion Page 2 base restore YES.

The existing Playback source was detected dynamically. In that completed run it happened to be mixer slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded for future runs.

## Focused mix meter campaign

Purpose:

- detect the existing Playback mixer slot dynamically;
- touch only that Playback strip in each Mix A-F L/R lane;
- create floor and movement states;
- restore exact original gain/mute/solo before moving to the next lane;
- observe all 46 meters while lanes are exercised.

Allowed focused write scope only:

- `mix_gain_set`;
- `mix_mute`;
- `mix_solo`;
- only on the dynamically detected existing Playback slot.

Explicitly absent:

- direct Focusrite protocol `<set>`;
- `output_source`;
- `output_pair_source`;
- Pair Source=None guards;
- Mixer Slot Source/Stereo writes;
- Advanced Raw;
- Monitor gain 1677 writes;
- firmware/reset/restore/snapshot;
- Device Preset / Clock Source / Sample Rate / S/PDIF Mode.

Per-lane sequence:

1. require exact server-confirmed gain/mute/solo baseline for the detected Playback strip;
2. mark the lane change active before the first Companion press;
3. floor: gain `-128`, solo OFF, mute ON;
4. capture meter evidence;
5. movement: gain `-20`, solo OFF, mute OFF;
6. capture meter evidence;
7. restore exact original gain/mute/solo;
8. server-confirm restore before the next lane;
9. any unconfirmed restore => HARD ABORT and no further campaign.

## Latest user software-gate result - 2026-08-24 10:41 +02:00

The user synchronized `testbench/meter-routing-exact-restore` to:

`66bf44bd0fd524ef6014b332f528005da79a453d`

Canonical `RUN.bat` fingerprint succeeded:

- branch `testbench/meter-routing-exact-restore`;
- HEAD `66bf44bd0fd5`;
- handoff blob `593940481cc8`.

Observed gate result:

- Node 22.23.2 PASS;
- Yarn 4.17.0 PASS;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- tests 181/182 PASS;
- package step NOT reached;
- no hardware write occurred.

The previously failing blank-gain baseline regression now PASSES. The single remaining failure is documentation-contract only:

`living handoff requires Remote Devices approval before write-capable hardware tests`

Root cause:

- the handoff was intentionally shortened and converted mostly to ASCII;
- this accidentally removed the exact mandatory Remote Devices authorization contract that `test/remote-devices-authorization.test.js` requires;
- no runtime or hardware behavior failed.

This handoff revision restores that mandatory contract below. The next required action is another complete software-gate rerun; do not run hardware first.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware test:

1. reuse the existing Companion Focusrite connection;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm **Companion Scarlett 18i20** is approved if required;
4. require the read-only preflight to confirm exact supported model, dynamic discovery and own-client authorization;
5. if approval/preflight is missing, classify the result as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md` for the stable private client identity rules.

Never create a fresh throwaway write client or new client key for normal SAFE/FULL/focused hardware validation. Do not run a direct Focusrite Control Server research probe concurrently with a normal write-capable Companion TestBench campaign.

## Canonical context fingerprint

`RUN.bat` now identifies the current checkout using Git objects instead of console-decoding handoff prose:

```text
CONTEXTE CANONIQUE DU RUN
Branche      : testbench/meter-routing-exact-restore
HEAD         : <12 hex characters>
Handoff blob : <12 hex characters>
```

`HEAD` and `Handoff blob` must not be `UNKNOWN` / `ABSENT` on the normal checkout.

The latest user run proved the `RUN.bat` fingerprint path works. The older temporary `UPDATE_AND_RUN.bat` worker may still print an obsolete pre-update context block during the first self-update run; the freshly checked-out `RUN.bat` block is authoritative for that run.

## Current software-gate state

The gate is NOT green yet because the user has not rerun after this documentation-contract restoration.

Target remains:

- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- 182/182 tests PASS;
- Companion package build PASS;
- `RUN OK`.

Do not claim the focused campaign is hardware-ready before that exact gate passes.

## Exact next user action

Run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur testbench/meter-routing-exact-restore
```

Verify the canonical `RUN.bat` context block shows a real 12-character `HEAD` and a real 12-character `Handoff blob`, then let the entire software gate finish.

If any step fails, do NOT run hardware. Diagnose the full failure first.

If and only if the full gate is green, the next hardware launcher is:

```bat
testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd
```

Do NOT rerun the old broad `RUN_METER_ROUTING_EXACT_RESTORE.cmd` merely because focused meter closure is pending.

## Focused hardware launcher flow after a green gate

Only after the gate is green:

1. keep Companion on the exact audited 0.1.16 package;
2. keep the existing Focusrite Companion connection;
3. confirm `Companion Scarlett 18i20` is approved in Focusrite Control Remote Devices if required;
4. physical Monitor knob low;
5. active speakers muted/disconnected if practical;
6. headphones removed or minimum;
7. no live show / critical recording;
8. run `testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`;
9. allow read-only preparation;
10. if requested, type `PAGE2_AUTO`;
11. type `MIX_METERS` only after preparation passes;
12. type `ALL_ISOLATED` only after physical output safety is confirmed;
13. start a continuous reasonable-level PC Playback signal when prompted;
14. type `SIGNAL_READY`;
15. do not touch Focusrite routing while lanes cycle;
16. inspect hardware restore and Page 2 restore before any subsequent campaign.

If final output contains any of these, stop all further hardware work:

- `RESTORE FAILED`;
- `HARD ABORT`;
- `Hardware restore confirme: NO`;
- `Companion Page 2 base restauree: NO`.

## Permanent safety rules

Never invent or re-add:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level control;
- Monitor gain item 1677 writes or Monitor +/- presets;
- unknown/unsafe arbitrary raw writes;
- firmware/reset/restore/snapshot commands;
- writes to read-only meter/status items.

Transport/session rules:

- Focusrite Control Server TCP port is dynamic;
- device ID is dynamic;
- auto discovery fails closed;
- reuse the existing Companion connection/client identity;
- only approval for this module's own server-assigned client ID counts;
- block writes until authorized;
- feedback/state remains server-confirmed;
- explicit output availability UNKNOWN receives no write;
- unknown/unvalidated Focusrite models remain fail-closed for writes.

## Public/privacy/publication state

Never publish real serials, private hostnames, client IDs/keys, raw private XML/captures/logs, user paths, or private diagnostics.

Preserve relevant MIT/third-party attribution. Do not claim all protocol knowledge was independently discovered.

Official Bitfocus repository/name is still pending maintainer decision. The personal repository name `focusrite-control` does not expand current supported hardware beyond Scarlett 18i20 (3rd Gen).

Stable public target remains v1.0.0 unless Bitfocus maintainers direct otherwise.

Evidence labels must remain distinct:

- hardware-tested;
- implemented;
- schema-observed;
- research-only;
- unsupported.
