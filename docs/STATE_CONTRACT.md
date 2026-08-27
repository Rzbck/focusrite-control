# Cold-start state contract

Updated: 2026-08-24

Introduced and validated on branch: `rc/v0.1.13-state-contract`

Research interpretation corrected on branch: `testbench/meter-routing-exact-restore`

## Why this exists

Real Scarlett 18i20 (3rd Gen) testing proved that a fresh Control Server subscription does not include all current values for Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. Re-subscribe/reconnect did not improve that result in the tested campaign.

Later Mix research exposed the same class of problem more broadly: a control can be present in the Control Server schema while its current value is absent from the module's observed state cache in one session and present in another.

This limitation does **not** invalidate already hardware-tested control mappings or the authorised write path, and it must not be promoted into a capability verdict.

## Mandatory interpretation rule

`UNKNOWN`, blank state, `BASELINE_UNKNOWN`, or a missing cached value means only:

> the current value was not observed by this client in this session.

It does **not** mean:

- the schema control is absent;
- the hardware function is unsupported;
- the value is `false`;
- an implemented write is invalid;
- a feedback family is permanently non-actionable.

Before making a capability or closure decision, separate:

1. official Focusrite product documentation;
2. current 18i20 schema presence;
3. session readback provenance;
4. implemented action/feedback behaviour;
5. physical hardware write confirmation;
6. full dynamic action/feedback/restore closure.

If older physical/session evidence contradicts the current cache coverage, the issue remains **readback/materialisation research**, not unsupported capability.

## Product behavior

The module separates **explicit writes** from **state-derived writes**.

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

Blank means **unknown / not yet server-confirmed**, not `false` and not unsupported.

## Exact-restore testing rule

Fail-closed testing still requires exact restoration, but a target must not be rejected merely because unrelated properties are unknown.

For each proposed hardware test:

1. identify the single property that will be changed;
2. require a server-confirmed baseline for every property that must actually be restored;
3. observe related properties before/after when useful for detecting collateral changes;
4. do not require an arbitrary multi-property tuple unless the hardware semantics genuinely make that tuple necessary for safe restoration;
5. if the required baseline is absent, record a session/readback limitation and do not manufacture it with a write.

This rule directly applies to the reopened `mix_mute` / `mix_solo` research: the previous full `gain + mute + solo` tuple requirement proved only that the old harness had no runnable target in that session. It did not prove that Mute or Solo were inherently non-actionable.

## Hardware evidence

Previously hardware-tested reversible paths include:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

The cold-start readback experiment separately proved only 3/21 guarded values were present after fresh subscribe/re-subscribe/reconnect. These are different questions: write/control validity versus initial-state completeness.

For Mix Mute/Solo, current evidence is intentionally split:

- Focusrite official documentation confirms per-Custom-Mix channel mute/solo product behaviour on Scarlett 18i20 3rd Gen;
- the current 18i20 Control Server schema exposes distinct per-strip `mute` and `solo` IDs;
- an earlier normal Companion observation had Mix A L/R Playback-strip `gain`, `mute`, and `solo` all known;
- the later targeted campaign had 0/12 complete three-value tuples and therefore performed zero writes.

Current classification is **RESEARCH_OPEN / EVAL_ONLY**, not closed/non-actionable.

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

The original RC gate was completed on 2026-08-21 on the real Windows development host using Node 22.23.2:

1. format: PASS;
2. ESLint: PASS;
3. source manifest validation: PASS;
4. Node tests: **31/31 PASS**;
5. `companion-module-build`: PASS;
6. Monitor gain item 1677 regression guard: PASS;
7. automated hardware writes: none.

Public sanitized result:

`diagnostics/readback-results:diagnostics/runtime/latest-rc-state-contract-validation.md`

The 2026-08-24 interpretation correction is documentation/research only. It has not yet changed production state handling or introduced a new write path, so no new software or hardware PASS is claimed from the documentation change itself.
