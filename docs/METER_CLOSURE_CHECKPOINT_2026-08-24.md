# Meter closure checkpoint — 2026-08-24

Hardware: Scarlett 18i20 (3rd Gen) only.

Package running in Companion: exact previously audited/live-validated 0.1.16. The TestBench branch package was not installed.

## Completed meter-routing exact-restore run

The first write-capable meter-routing campaign completed without hard abort.

Measured closure after the run:

- total meter paths: 46;
- closed: 14/46;
- input meters: 8/8 closed;
- output meters: 4/26 closed;
- mix meters: 2/12 closed;
- feedback/oracle mismatch: 0;
- hardware restore confirmed: YES;
- Companion Page 2 base restore confirmed: YES.

The local sanitized reports remain the authoritative detailed artifacts for that run.

## What the run revealed

The broad mix-lane driver skipped all 12 lanes with `SKIP_BASELINE_UNKNOWN` because its exact-restore eligibility required known gain/mute/solo baselines across every exposed strip in the lane. That requirement is broader than necessary for meter closure because the live preflight already identified an existing Playback source on mixer slot 3.

The run also re-tried Pair Source=None guards on available output pairs. For pairs whose right member is already V8-classified pair-owned, those attempts failed to hold both members at None and were restored exactly. They produced no hardware failure, but they are unnecessary for the next focused mix pass because `ALL_ISOLATED` is already the explicit physical signal-path guard.

## Next focused campaign

The next hardware-facing step is **not another broad routing run**. It is a focused existing-Playback-strip mix campaign:

- detect the existing Playback mixer slot from server-confirmed state;
- require exact gain/mute/solo baseline only for that selected strip in each lane;
- floor that strip with gain -128 + mute ON;
- drive it with gain -20 + mute OFF;
- capture all 46 meter paths during both states;
- restore the selected strip exactly before advancing to the next lane;
- perform no Output Source or Pair Source=None write;
- perform no Mixer Slot Source/Stereo write;
- retain all Monitor 1677 / Advanced Raw / firmware/reset/snapshot prohibitions.

Outputs may gain meter evidence only through their existing routing while the mixes are exercised.

Before hardware use, the focused campaign must pass the canonical local Windows software gate on its exact branch HEAD.
