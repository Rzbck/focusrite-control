# Meter feedback closure — operator guide

This is a dedicated **read-only** follow-up to the completed Scarlett 18i20 (3rd Gen) V8 FULL campaign.

It exists only to improve real-signal evidence for the 46 meter feedback paths. It is **not** a new FULL and it must not modify Focusrite routing or hardware settings.

## Scope

The campaign observes:

- 8 input meter feedback paths;
- 26 output meter feedback paths;
- 12 mix-lane meter feedback paths.

For every path it compares:

1. the rendered Companion feedback marker (`T`/`F`);
2. the independent server-confirmed numeric meter variable;
3. the feedback threshold configured on the existing r9 matrix.

The rendered feedback is always checked against the production rule `meter >= threshold`.

The first real meter baseline proved that the existing r9 matrix uses `threshold=-128` while the server meter floor/silence is also `-128`. Therefore a silent meter legitimately renders `T` because `-128 >= -128`. A false/true feedback transition is **not** a valid closure requirement for this page.

Report schema v2 therefore closes a hardware meter path only after both have been observed:

- the numeric floor `-128 dBFS`;
- real numeric movement strictly above `-128 dBFS`.

Any persistent disagreement between the rendered feedback and `meter >= threshold` remains `FAIL_MISMATCH` independently of floor/movement evidence.

## Safety contract

The read-only meter closure harness:

- sends no Focusrite Control Server `<set>`;
- imports no write-capable page;
- presses no Companion buttons;
- changes no routing;
- changes no device setting;
- does not use Advanced Raw;
- does not write Monitor gain 1677;
- does not invoke SAFE/FULL/RESUME;
- never converts missing evidence into PASS.

The operator may start/stop a source that is already routed or physically feed a safe input. Do not change Focusrite routing merely to make this read-only report green. A separate exact-restore routing campaign exists for intentional temporary routing changes.

## Preparation

Keep Companion on the **existing Focusrite connection** and on the module version matching the current branch root `package.json` (currently research **0.1.19**).

`MeterFeedbackClosure.js` derives its expected module version from `package.json` through `FullTestBenchBase`; the launcher must not pin an older research version in user-facing instructions.

Before running the meter harness, update/validate the branch with the normal local gate:

1. run root `UPDATE_AND_RUN.bat` or `RUN.bat` when already synchronized;
2. stay on `testbench/meter-routing-exact-restore`;
3. require formatter/lint/manifest/tests/package build PASS.

The package build is a software gate. If the exact matching research package is already loaded on the existing Companion connection, do not recreate the connection merely because the gate rebuilt the archive.

## Run

From the repository root:

`testbench\RUN_METER_FEEDBACK_CLOSURE.cmd`

The harness first verifies:

- existing r9 46x26 matrix;
- exact module version matching current `package.json`;
- exact Scarlett 18i20 (3rd Gen);
- existing module connection;
- existing own-client authorization;
- exactly 46 meter probes;
- numeric threshold oracle for every meter path.

## Phase 1 — SILENT / floor

Stop signal sources you can safely stop **without changing Focusrite routing**.

When levels are stable, type:

`SILENT`

The harness samples all 46 paths. A numeric sample at `-128` records floor evidence. With the current r9 threshold of `-128`, the rendered feedback is expected to remain `T`; that is valid and is not mistaken for real signal.

## Phase 2 — real movement

Create real signal only on paths you can safely exercise with existing routing or physical input signal.

When the current set of signals is stable, type:

`SIGNAL`

A numeric sample strictly above `-128` records movement evidence. Several passes are allowed. Evidence accumulates only when report version, evidence mode and meter inventory signature all match.

When no further safe progress is possible, type:

`DONE`

## Result meaning

- `PASS_FLOOR_AND_MOVEMENT` — numeric floor and real movement were both observed, with no persistent feedback/oracle mismatch;
- `MANUAL_PENDING_FLOOR_ONLY` — only the numeric floor was observed;
- `MANUAL_PENDING_MOVEMENT_ONLY` — movement was observed but no floor sample was captured;
- `MANUAL_PENDING_NEVER_OBSERVED` — no evaluable marker/value pair was captured;
- `FAIL_MISMATCH` — rendered Companion feedback persistently disagreed with the numeric server state and configured threshold.

Mismatch is sticky: later good samples cannot erase confirmed mismatch evidence.

The old pre-v2 `HIGH_ONLY`/`LOW_ONLY` accumulator is intentionally not merged into v2 because the hardware baseline proved that those labels were misleading at `threshold=-128`.

## First real baseline

The first read-only hardware run, before the v2 correction, established useful diagnostics without any write:

- 46/46 meter mappings found;
- 41/46 paths returned numeric values;
- 5/46 were not observed: Mix B/C/D/E/F right lanes;
- Mix B left and Mix C left already showed real numeric activity in the existing routing;
- no persistent feedback/oracle mismatch was observed.

Those samples remain diagnostic evidence, but closure is recalculated only with the v2 floor/movement model.

## Local evidence

The accumulator is written to:

`testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json`

The report contains sanitized generic evidence only: model/module version, generic meter paths, threshold, numeric min/max, floor/movement flags, rendered feedback observations and mismatch/missing counts. It does not store the Companion URL, connection label, private client identity, Focusrite serial/hostname, Control Server endpoint, raw XML or user filesystem path.

Do not publish the report automatically. Review it first.

## Completion rule

The read-only meter campaign is fully complete only when all 46 paths have `PASS_FLOOR_AND_MOVEMENT` and mismatch count is zero.

It is acceptable to finish with explicit manual-pending residuals. A separate explicitly write-capable exact-restore routing campaign may be used to exercise mixes/outputs efficiently; physical input meters still require real physical input signal.
