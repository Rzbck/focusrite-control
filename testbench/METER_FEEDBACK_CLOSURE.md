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

A path is complete only after a valid below-threshold sample and a valid at/above-threshold sample have both been observed with matching feedback state.

## Safety contract

The meter closure harness:

- sends no Focusrite Control Server `<set>`;
- imports no write-capable page;
- presses no Companion buttons;
- changes no routing;
- changes no device setting;
- does not use Advanced Raw;
- does not write Monitor gain 1677;
- does not invoke SAFE/FULL/RESUME;
- never converts missing evidence into PASS.

The operator may start/stop a source that is already routed or physically feed a safe input. Do not change Focusrite routing merely to make the report green. Paths that cannot be exercised safely remain `MANUAL_PENDING`.

## Preparation

Keep Companion on the exact audited 0.1.16 module already installed on the **existing** Focusrite connection.

Do not import a newly rebuilt 0.1.16 package from this TestBench-only branch.

Before running the meter harness, update/validate this branch with the normal local gate:

1. run root `UPDATE_AND_RUN.bat`;
2. choose `Autre branche...` if the branch is not already listed;
3. enter `testbench/meter-feedback-closure`;
4. require formatter/lint/manifest/tests/package build PASS.

The package build is only a software gate here. Do not install the generated archive because production source is unchanged from the exact audited 0.1.16 package already running in Companion.

## Run

From the repository root:

`testbench\RUN_METER_FEEDBACK_CLOSURE.cmd`

The harness first verifies read-only prerequisites:

- existing r9 46x26 matrix;
- expected module version 0.1.16;
- exact Scarlett 18i20 (3rd Gen);
- existing module connection;
- existing own-client authorization;
- exactly 46 meter probes;
- numeric threshold oracle for every meter path.

## Phase 1 — SILENT / low level

Stop or mute signal sources you can safely stop **without changing Focusrite routing**.

When levels are stable, type:

`SILENT`

The harness samples all 46 meter paths several times. A path whose numeric value is below its configured threshold should render feedback false. Any disagreement is retained as `FAIL_MISMATCH`.

## Phase 2 — real signal

Create real signal only on paths you can safely exercise with existing routing or physical input signal.

When the current set of signals is stable, type:

`SIGNAL`

The harness samples all 46 paths again and prints the remaining incomplete paths.

You may make several `SIGNAL` passes. For example, stop one already-routed source and start another, or feed another physical input. Evidence accumulates across passes and across later runs when the meter inventory signature is unchanged.

When no further safe progress is possible, type:

`DONE`

## Result meaning

- `PASS_BOTH_STATES` — below and at/above threshold both observed with matching rendered feedback;
- `MANUAL_PENDING_LOW_ONLY` — only below-threshold state observed;
- `MANUAL_PENDING_HIGH_ONLY` — only at/above-threshold state observed;
- `MANUAL_PENDING_NEVER_OBSERVED` — no evaluable marker/value pair was captured;
- `FAIL_MISMATCH` — rendered Companion feedback disagreed with numeric server state/threshold at least once.

Mismatch is sticky: later good samples cannot erase the fact that a mismatch was observed.

## Local evidence

The accumulator is written to:

`testbench\results\LATEST_METER_FEEDBACK_CLOSURE.json`

The report contains only sanitized generic evidence:

- model;
- module version;
- meter path labels;
- generic module variable names;
- thresholds;
- min/max numeric values;
- state-crossing flags;
- mismatch/missing counts;
- summary counts.

It does not store the Companion URL, connection label, private client identity, Focusrite serial/hostname, Control Server endpoint, raw XML or user filesystem path.

Do not publish the report automatically. Review it first, then decide whether a separate strict publisher/schema is useful.

## Completion rule

The meter campaign is fully complete only when all 46 paths have `PASS_BOTH_STATES` and mismatch count is zero.

It is acceptable to finish with explicit manual-pending residuals if some paths cannot be safely exercised without changing routing. That is more trustworthy than manufacturing complete coverage.

A nonzero mismatch count is a real feedback defect candidate and must be investigated before release.
