# Meter routing exact-restore — operator guide

This is a **separate write-capable TestBench campaign** for Scarlett 18i20 (3rd Gen) meter coverage.

It exists because the read-only meter baseline showed that random `SIGNAL` passes are inefficient and because the r9 meter threshold is `-128 dBFS`, equal to the server meter floor. The campaign drives real signal through already-validated routing/mixer controls, collects meter evidence, then restores every temporary state from server-confirmed baselines.

This is **not** a new FULL and it does not expand public hardware scope.

## Production/module state

Keep Companion on the **existing Focusrite connection** and on the module version matching the current branch root `package.json` (currently research **0.1.19**).

The write-capable preflight derives `EXPECTED_MODULE_VERSION` from `package.json`; do not pin an older research version in operator instructions and do not delete/recreate the existing Focusrite connection merely because the package was rebuilt.

If Companion is not already on the exact matching module version, stop and resolve that mismatch before granting any hardware-write permission.

## What this campaign may change temporarily

Only through normal Companion actions already exercised by V8:

- mixer strip gain;
- mixer strip mute;
- mixer strip solo;
- validated stereo output-pair source routing.

It never intentionally uses:

- direct Focusrite Control Server `<set>` writes;
- Mixer Slot Source writes;
- Mixer Slot Stereo writes;
- direct pair-owned right-member output Source writes;
- output writes when availability is `UNKNOWN` or `UNAVAILABLE`;
- Monitor gain item 1677;
- Advanced Raw;
- device preset, clock source, sample rate or S/PDIF mode;
- firmware/reset/restore/snapshot commands;
- any meter/status write.

## Why Mixer Slot Source is not changed

Mixer-slot Source/Stereo writes were withheld by the production policy after hardware evidence. The campaign therefore discovers an **existing** mixer slot whose server-confirmed source name is a Playback source. It prefers an existing stereo Playback slot.

If no existing Playback slot can be found, the campaign stops before hardware writes. It does not invent or force a mixer-slot assignment.

## Safety model

Before the launcher grants write permission:

1. lower the **physical Monitor knob**;
2. mute/disconnect active speakers if practical;
3. remove headphones or set them to minimum;
4. do not run during a live show or critical recording;
5. type `ROUTE_METERS`;
6. type `ALL_ISOLATED`.

These confirmations are intentionally separate from Remote Devices authorization. The module must still be the existing authorised Companion client.

The campaign also requires the current V8 capability-lab harness to already be present and audited exactly on Companion Page 2. It refuses to silently replace an unrelated/stale Page 2 as the starting point.

## Temporary Page 2

The campaign creates a temporary Page 2 superset containing only the additional meter-drive batches it needs. The Companion import path:

- preserves Page 1;
- preserves every other page;
- reuses the existing Focusrite connection;
- verifies the connection set did not change;
- performs no Focusrite hardware write merely by importing the page.

At the end, or after a recoverable campaign failure, it restores the original audited capability-lab Page 2 and verifies it.

## Meter evidence model

The rendered Companion feedback is always checked against the production rule:

`meter >= threshold`

Hardware closure is separate:

- floor observed at `-128 dBFS`;
- movement observed strictly above `-128 dBFS`.

A path becomes `PASS_FLOOR_AND_MOVEMENT` only after both numeric conditions are observed and no persistent rendered-feedback/oracle mismatch exists.

## Mix-lane drive

For each of the 12 lanes (Mix A–F left/right), the campaign first requires every mixer gain/mute/solo value it may touch to have a known server-confirmed baseline.

Then, one lane at a time:

1. set its existing strip gains to `-128` and verify them;
2. capture meter floor evidence;
3. force solos off and mutes off;
4. set existing strip gains to `-20 dB`;
5. capture real movement from the already-assigned Playback slot;
6. restore **gain, mute and solo** to the exact original values;
7. verify every restored value before moving to the next lane.

If a lane has an unknown baseline, it is skipped instead of being made destructive.

## Output-pair drive

The campaign uses the hardware-tested Scarlett pair profile. It does not infer new topology.

Before mix-lane testing it tries to hold every exact-restorable available output pair at `Source=None` as a signal-path guard. Any pair whose availability is `UNKNOWN`/`UNAVAILABLE` receives no write. If a guard cannot be established but the original pair can be restored exactly, the campaign may continue only under the explicit physical-isolation confirmation.

After mix-lane restoration, each eligible pair is exercised separately:

1. route the detected Playback source with the validated `output_pair_source` action;
2. confirm the pair mapping with server state;
3. capture output meter movement;
4. restore both original output source values;
5. verify both members before proceeding.

A failed exact restore attempts `Source=None` quarantine and causes a hard abort. No later hardware campaign should run until that state has been reviewed.

## Physical input meters

The 8 analogue input meters cannot be driven by pretending that PC Playback is a physical input.

After all temporary mixer/output routing is restored, the script can perform additional **read-only** `INPUT_SIGNAL` captures. To close all eight input meter paths, use real physical input signal. If needed later, a separate guided loop can use one safe line output and a physical cable into each input one by one, but no preamp gain, per-channel phantom, direct input hardware mute or Mic Kill capability will be invented for that purpose.

## Run order

Do not run the hardware campaign until the canonical local software gate is green on this branch.

From the repository root:

`UPDATE_AND_RUN.bat`

Select:

`testbench/meter-routing-exact-restore`

Require dependencies, Prettier, ESLint, source manifest, all Node tests and Companion package build to pass. Keep the existing Companion Focusrite connection; the routing preflight must confirm the exact module version from `package.json` before any write permission is granted.

After the gate is green, run:

`testbench\RUN_METER_ROUTING_EXACT_RESTORE.cmd`

Follow the prompts exactly.

## Local reports

Meter accumulator:

`testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json`

Routing/restore report:

`testbench\results\LATEST_METER_ROUTING_EXACT_RESTORE.json`

Both are local sanitized evidence and are not auto-published. The routing report deliberately omits raw source IDs, serial, hostname, server endpoint, client identity, raw XML, Companion connection ID and user filesystem path.

## Stop conditions

Do not continue with another hardware campaign when the final output reports either:

- `Hardware restore confirme: NO`;
- `Companion Page 2 base restauree: NO`.

Explicit residual meter paths are acceptable. A partial evidence result with exact restoration and zero mismatch is more trustworthy than forcing unsafe routing for a fake 100% score.
