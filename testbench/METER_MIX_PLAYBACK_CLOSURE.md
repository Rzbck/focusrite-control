# Focused Mix Meter Closure — existing Playback slot only

Scope: Scarlett 18i20 (3rd Gen), TestBench only.

This follow-up exists because the first exact-restore meter-routing hardware run completed safely but only closed 14/46 meter paths. The run proved 8/8 input meters, 4/26 output meters and 2/12 mix meters, with zero feedback/oracle mismatch, exact hardware restore confirmed, and Companion Page 2 restored.

The broad lane driver skipped all 12 lanes because it required exact gain/mute/solo baselines for every exposed strip in a lane. The live run also re-tried Pair Source=None guards that V8 topology had already shown cannot hold both members at None on pair-owned right outputs. This focused campaign avoids both problems.

## What this campaign writes

Only the already-detected existing Playback mixer strip is touched, lane by lane:

- `mix_gain_set`;
- `mix_mute`;
- `mix_solo`.

For each lane, the selected Playback strip must have exact server-confirmed gain/mute/solo baselines before any write. The sequence is:

1. floor: gain `-128`, solo OFF, mute ON;
2. capture meter evidence;
3. movement: gain `-20`, solo OFF, mute OFF;
4. capture meter evidence;
5. exact restore of original gain/solo/mute;
6. server confirmation before the next lane.

A write attempt is tracked before the Companion press. A restore failure remains active and hard-aborts the campaign.

## What this campaign never writes

- Output Source or `output_pair_source`;
- Pair Source=None guards;
- Mixer Slot Source/Stereo;
- Monitor gain 1677;
- Advanced Raw;
- input preamp gain / input hardware mute / per-channel phantom / Mic Kill;
- firmware/reset/restore/snapshot;
- meter/status values.

Outputs may show meter movement only through their **existing** routing while mixes are exercised. Outputs with availability UNKNOWN receive no direct write because this campaign performs no output write at all.

## Before running

Keep Companion on the exact previously audited/live-validated 0.1.16 package. Do not install the `.tgz` rebuilt by the TestBench branch.

Run the canonical software gate first:

```bat
UPDATE_AND_RUN.bat
```

Then run:

```bat
testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd
```

The launcher performs read-only Page 2 preparation first. If the V8 capability-lab Page 2 is missing, `PAGE2_AUTO` remains an explicit opt-in and performs no Focusrite hardware write.

Hardware writes are enabled only after both typed confirmations:

- `MIX_METERS`
- `ALL_ISOLATED`

Keep the physical Monitor level low and outputs physically safe/isolated. At `SIGNAL_READY`, play a continuous reasonable-level PC signal on the already detected Playback source and leave Focusrite routing untouched.

## Reports

The existing accumulated meter evidence remains in:

`testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json`

The focused campaign writes a separate sanitized local result:

`testbench\results\LATEST_METER_MIX_PLAYBACK_CLOSURE.json`

Neither report should contain serial, hostname, Control Server endpoint, client identity, raw XML, Companion connection ID, raw source ID, or user-specific path.
