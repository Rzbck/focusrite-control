# Current handoff — Focusrite Control / Companion

Updated: 2026-08-24 — **Scarlett 18i20 (3rd Gen) only. V8 FULL-from-zero remains the canonical broad write-capable hardware evidence on exact package 0.1.15. Exact package 0.1.16 remains the software/package/live-read-only validated production candidate. Meter closure has progressed to 14/46 paths with zero mismatch and exact hardware/Page-2 restoration. The next task is NOT another FULL and NOT the old broad meter-routing runner: first re-run the Windows software gate for the new focused existing-Playback-slot mix campaign, then run that focused campaign only if the gate is fully green.**

Read `AI_PROJECT_RULES.md`, `docs/REMOTE_DEVICES_AUTHORIZATION.md`, `docs/VALIDATION_CLOSURE_AND_FUTURE_HARDWARE_PROTOCOL.md`, `docs/METER_CLOSURE_CHECKPOINT_2026-08-24.md`, and this file before proposing code, tests, hardware work, branch changes or publication changes. New explicit hardware evidence and current checked-in code override older assumptions.

## Immediate resume point

Repository:

- `Rzbck/focusrite-control`

Branches / PRs:

- integration/validation base: `testbench/v0.2-hardware-validation`
- read-only meter closure branch: `testbench/meter-feedback-closure`
- focused/write-capable meter branch: `testbench/meter-routing-exact-restore`
- PR #1: read-only meter closure, draft/open
- PR #2: write-capable TestBench meter closure, draft/open/mergeable, stacked on PR #1
- official Bitfocus repository/name: still pending maintainer decision

Current public hardware scope:

- **Scarlett 18i20 (3rd Gen) only**
- do not generalize current write evidence to another Focusrite model

Current PR #2 remote state immediately before this handoff commit:

- head `da7308dc4ea09b2cc7933be059be3eda841c377e`
- the two Prettier-only corrections from the latest failed local gate are committed remotely
- this handoff commit moves HEAD again; the next local gate must therefore run on the new branch HEAD before any further hardware campaign

## Exact package checkpoints

### 0.1.15 — canonical broad write-capable hardware package

Archive:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

This exact package produced canonical V8 FULL-from-zero hardware evidence.

### 0.1.16 — current production candidate

Archive:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Validated facts for this exact archive:

- canonical production software gate PASS at the production checkpoint
- exact archive/package audit PASS
- live startup on the existing Companion connection PASS
- dynamic Focusrite Control Server discovery PASS
- exact Scarlett 18i20 (3rd Gen) detection PASS
- own-client Remote Devices authorization PASS
- read-only preflight PASS
- no new write capability; 0.1.16 is restrictive availability hardening

**Do not install any `.tgz` rebuilt from the TestBench meter branches. Companion must stay on the exact already audited/live-validated 0.1.16 package.**

## Canonical V8 FULL hardware evidence

Published sanitized result:

`docs/hardware-results/LATEST_SHAREABLE.json`

Identity:

- revision `full-v8-generic-evidence-profile-20260823`
- signature `fb915f311956ac65`
- exact model Scarlett 18i20 (3rd Gen)
- physical isolation confirmed
- inventory 1436/1436 classified
- snapshot 1340/1340 mapped
- core 21/21 mapped
- feedback 829 probes / 31 definitions
- zero unclassified rows
- no FAIL-class final summary

Important hardware policy remains:

- Outputs 21–24 availability UNKNOWN => no production/TestBench writes
- direct Mute withheld on Outputs 2/4/6/8/10
- right-member direct Source is pair-owned/withheld on proven members
- known no-effect Stereo/Nickname/Gain members remain withheld
- Monitor Out1/2 direct Gain remains withheld
- Monitor gain item 1677 remains read-only
- Mixer Slot Source/Stereo writes remain withheld
- per-lane Mix Talkback writes remain withheld
- global Monitor Talkback is separate and valid
- Advanced Raw cannot bypass hardware/availability policy

Do not rerun FULL merely for meter closure or 0.1.16 availability hardening.

## Meter closure evidence model

There are exactly 46 meter paths:

- 8 input meters
- 26 output meters
- 12 mix-lane meters

The original r9 feedback threshold is `-128 dBFS`, equal to the observed meter floor. Therefore closure is **not** “feedback FALSE then TRUE”. The correct hardware evidence is:

- numeric floor observed at `-128 dBFS`
- real numeric movement observed strictly above the floor
- rendered Companion feedback remains coherent with the production oracle `meter >= threshold`
- persistent mismatch is sticky FAIL

The read-only collector is `MeterFeedbackClosure.js` and accumulates evidence only when model/module/descriptors/signature still match.

## Latest completed hardware meter campaign — important checkpoint

The broad routing exact-restore campaign completed without hard abort.

Final measured closure:

- **14/46 paths closed**
- **32 floor-only**
- **0 mismatch**
- inputs: **8/8 closed**
- outputs: **4/26 closed**
- mixes: **2/12 closed**
- hardware restoration: **YES**
- Companion Page 2 base restoration: **YES**

The existing Playback source was detected dynamically; in that run it was mixer slot **3**, Playback 1 / stereo. Never hardcode slot 3 for future hardware; always detect the existing Playback assignment from server-confirmed variables.

No production package was installed or changed by this campaign.

### What the broad campaign revealed

Two TestBench inefficiencies were identified; do not repeat them blindly:

1. **Whole-lane baseline requirement was too broad.**
   - the old `driveLane()` required known gain/mute/solo baselines across every exposed strip in the lane
   - one blank/unknown strip caused the entire lane to return `SKIP_BASELINE_UNKNOWN`
   - this prevented useful Playback-meter exercise even though the actual Playback strip baseline was known

2. **Pair Source=None retries were unnecessary for already-known pair-owned right behavior.**
   - V8 had already shown that many right members retain their original Source during left/pair attempts
   - the broad meter run retried guards that could not become a both-member None guard, then restored the originals correctly
   - do not rerun those guards merely to make the meter report greener

The broad run also showed `NO_PAIR_MAPPING` for most output-pair drives while 25–26 behaved differently. Do **not** currently label this as a production regression. V8 evidence on many pairs was `REQUESTED_ORIGINAL` / `ZERO_ORIGINAL`, not proof that the public “Route stereo pair” action provides useful two-member stereo routing for every pair. Keep this distinction explicit.

## New focused mix campaign — current implementation

New files on `testbench/meter-routing-exact-restore`:

- `testbench/MeterMixPlaybackPage.js`
- `testbench/MeterMixPlaybackClosure.js`
- `testbench/RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`
- `testbench/METER_MIX_PLAYBACK_CLOSURE.md`
- `test/meter-mix-playback-closure.test.js`
- `docs/METER_CLOSURE_CHECKPOINT_2026-08-24.md`

Purpose:

- detect one existing Playback mixer slot dynamically
- touch **only that Playback strip** in each Mix A–F L/R lane
- create a controlled floor state for that strip
- create a controlled movement state for that strip
- restore that strip's exact original gain/mute/solo before moving to the next lane
- observe all 46 meters while doing so, so already-routed outputs may gain evidence passively

Write scope of the new focused runner:

- `mix_gain_set`
- `mix_mute`
- `mix_solo`
- only on the dynamically detected existing Playback slot

Explicitly absent from this focused runner:

- direct Focusrite protocol `<set>`
- `output_source`
- `output_pair_source`
- Pair Source=None guards
- Mixer Slot Source/Stereo writes
- Advanced Raw
- Monitor gain 1677 writes
- firmware/reset/restore/snapshot paths
- Device Preset / Clock Source / Sample Rate / S/PDIF Mode

Per-lane intended sequence:

1. require exact server-confirmed Playback-strip baseline for gain/mute/solo
2. mark lane change active before the first Companion press
3. floor state: gain `-128`, solo OFF, mute ON
4. capture meter rounds
5. movement state: gain `-20`, solo OFF, mute OFF
6. capture meter rounds
7. restore exact original gain/mute/solo
8. server-confirm restore before next lane
9. any unconfirmed restore => hard abort / no further campaign

Page 2 handling remains the same audited mechanism:

- read-only preparation first
- optional explicit `PAGE2_AUTO` if current V8 harness is missing
- preserve Page 1 / other pages / existing connection set
- temporary focused Page 2 during the run
- restore audited capability-lab Page 2 afterward

## Current software-gate status — resume here

Previous broad meter branch gate:

- Node 22.23.2 / Yarn 4.17.0
- immutable dependencies PASS
- Prettier PASS
- ESLint PASS
- manifest PASS
- **175/175 tests PASS**
- Companion package build PASS
- `RUN OK`

Focused campaign adds 5 regression tests, so the new target is:

- **180/180 tests**

Latest user-run gate on branch commit `a0f48ac...`:

- branch sync PASS
- immutable dependencies PASS
- stopped at **Prettier only**
- exactly two files were noncanonical:
  - `test/meter-mix-playback-closure.test.js`
  - `testbench/MeterMixPlaybackClosure.js`
- ESLint/tests/manifest/package were not reached in that run
- no local source was modified by the diagnostic
- no hardware write occurred

Remote style corrections were then applied exactly from the diagnostic:

- `0bac76619313523866444d18637dea5c27b8e795` — format focused mix test
- `da7308dc4ea09b2cc7933be059be3eda841c377e` — format focused mix runner

**The 180-test gate has NOT yet been rerun after these two style commits and this handoff update. Do not claim it is green.**

## Exact next action in the next conversation

Do not run a hardware campaign first.

Run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur testbench/meter-routing-exact-restore
```

Expected successful gate:

```text
Prettier PASS
ESLint PASS
Manifest PASS
180 / 180 tests PASS
Companion package build PASS
RUN OK
```

Do not install the rebuilt `focusrite-scarlett-18i20-0.1.16.tgz`.

If the gate is fully green, the next hardware launcher is **only**:

```bat
testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd
```

Do **not** rerun `RUN_METER_ROUTING_EXACT_RESTORE.cmd` merely because the focused run is pending.

Focused launcher expected flow:

1. read-only Page 2 preparation
2. if required, explicit `PAGE2_AUTO`
3. re-audit Page 2 read-only
4. type `MIX_METERS`
5. type `ALL_ISOLATED`
6. start a continuous reasonable-level PC Playback signal when prompted
7. type `SIGNAL_READY`
8. do not touch Focusrite routing while the runner cycles lanes
9. inspect final hardware restore and Page 2 restore results before any subsequent hardware work

Safety before `MIX_METERS` / `ALL_ISOLATED`:

- physical Monitor knob low
- active speakers muted/disconnected if practical
- headphones removed or minimum
- no live show / critical recording

If final output contains any of:

- `RESTORE FAILED`
- `HARD ABORT`
- `Hardware restore confirme: NO`
- `Companion Page 2 base restauree: NO`

stop and inspect the full log/report before doing anything else.

If restore is YES/YES and no mismatch exists, inspect the resulting meter totals. Do not force unreachable paths merely to obtain 46/46.

## Local Git/bootstrap notes

Historical branch-bootstrap/line-ending issue is resolved.

Important durable rule:

- GitHub API writes for `.cmd`/`.bat` should store canonical LF blobs; `.gitattributes` creates CRLF in the Windows worktree
- root `UPDATE_AND_RUN.bat` is the canonical software gate
- personal repo uses **no GitHub Actions**

Two historical local safety stashes existed from bootstrap recovery. Do not blindly `git stash pop`; inspect/drop only when deliberately cleaning them up.

## Permanent safety / protocol rules

Never invent or re-add:

- analogue input preamp gain
- direct per-input hardware mute
- per-channel phantom switching
- Mic Kill
- physical Monitor level control
- Monitor gain item 1677 writes or Monitor +/- presets
- unknown/unsafe arbitrary raw writes
- firmware/reset/restore/snapshot commands
- writes to read-only meter/status items

Transport/session:

- Focusrite Control Server TCP port is dynamic; never hardcode it
- Auto discovery fails closed if discovery fails
- Manual mode requires an explicitly supplied TCP port
- device ID is dynamic
- reuse the existing Companion connection/client identity
- only approval for this module's own server-assigned client ID counts
- block writes until authorised
- feedback/state remains server-confirmed
- explicit output availability UNKNOWN receives no write in 0.1.16

Unknown/unvalidated Focusrite models remain fail-closed for writes.

## Remote Devices authorization — mandatory before any write

Before any future write-capable hardware campaign:

1. **reuse the existing Companion Focusrite connection**
2. in **Focusrite Control → Device Settings → Remote Devices**, confirm **Companion Scarlett 18i20** is approved if required
3. run read-only preflight and require exact supported model, dynamic discovery and own-client authorization
4. if approval is missing, classify as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no write-capable test

## Remaining closure work after meter evidence

Once meter closure is satisfactorily dispositioned:

1. keep disruptive Device Preset / Clock Source / Sample Rate / S/PDIF Mode explicitly excluded unless separately approved
2. perform repository-tree + Git-history privacy audit
3. perform historical provenance/attribution audit against credited public prior work
4. decide public-source extraction for future official Bitfocus repo
5. wait for Bitfocus's official repository/naming decision before changing public scope/name

Official publication state remains:

- personal repository only
- no GitHub Actions
- official Bitfocus repo/name pending
- Bryce Seifert suggested `focusrite-control`; project scope remains Scarlett 18i20 (3rd Gen) only until real testing expands it
- stable public target remains v1.0.0 unless maintainers direct otherwise
- Developer Portal tag only after hardware/action/privacy/attribution audit and required CI are clean
