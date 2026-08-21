# Cold-start state contract

Updated: 2026-08-21

Introduced and validated on branch: `rc/v0.1.13-state-contract`

## Why this exists

Real Scarlett 18i20 (3rd Gen) testing proved that a fresh Control Server subscription does not include all current values for Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. Re-subscribe/reconnect did not improve that result.

This limitation does **not** invalidate the already hardware-tested control mappings or the authorised write path.

## Product behavior

The module therefore separates **explicit writes** from **state-derived writes**.

### Explicit writes

These remain usable when the current value is unknown, provided the module is connected, the item is in the verified writable set, and the module's own Control Server client is authorised:

- Air On / Off;
- Pad On / Off;
- Monitor Mute On / Off;
- Monitor Dim On / Off;
- Talkback On / Off;
- other explicit set actions for schema-observed verified writable controls.

An explicit command does not need the old value in order to request a known target value.

State/feedback is **not** updated optimistically. Companion changes only after Focusrite Control Server confirms a value.

### State-derived writes

These require a server-confirmed current value and are blocked when that value is missing or invalid:

- boolean Toggle;
- mode Cycle;
- relative gain/level adjustments;
- any other action that calculates a new value from the old value.

The module must never assume a missing boolean means `false` and must never write merely to warm or discover state.

## Feedbacks and variables

Boolean feedbacks activate only from a server-confirmed matching value. An unknown value cannot create a positive feedback.

Raw state variables stay blank while the corresponding value is unknown. For example, after a cold start `input_1_air` or `monitor_mute` may be blank until the Control Server emits that value.

Blank means **unknown / not yet server-confirmed**, not `false`.

This is the supported contract unless future hardware evidence proves a complete readback path.

## Hardware evidence

Previously hardware-tested reversible paths include:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

The cold-start readback experiment separately proved only 3/21 guarded values were present after fresh subscribe/re-subscribe/reconnect. These are different questions: write/control validity versus initial-state completeness.

The v0.1.13 release-hardening work did not introduce a new production hardware-write path, so existing hardware evidence remains applicable. A future change to a hardware-relevant path still requires explicit real-device confirmation.

## Non-negotiable safety rules

- no optimistic state;
- no write-to-read/warm behavior;
- no guessed booleans;
- no unknown raw writes;
- Monitor gain item `1677` remains read-only;
- writes remain blocked until the module's own server-assigned client ID is authorised;
- supported hardware remains Scarlett 18i20 (3rd Gen) only.

## Validation status

The RC gate was completed on 2026-08-21 on the real Windows development host using Node 22.23.2:

1. format: PASS;
2. ESLint: PASS;
3. source manifest validation: PASS;
4. Node tests: **31/31 PASS**;
5. `companion-module-build`: PASS;
6. Monitor gain item 1677 regression guard: PASS;
7. automated hardware writes: none.

Public sanitized result:

`diagnostics/readback-results:diagnostics/runtime/latest-rc-state-contract-validation.md`

Because production control behavior remained unchanged, broad hardware cycling was not repeated merely for the RC version/documentation step.
