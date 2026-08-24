# Cold-start readback investigation

Updated: 2026-08-24

## Problem statement

The protocol mapping for Air, Pad, Monitor Mute and Monitor Dim is proven useful on real hardware, but after a fresh module process their **initial current values** are not consistently received.

The same class of problem is now visible on Mix strip state: schema controls can be present while current values materialise inconsistently between sessions.

This prevents some safe reversible tests because restoration requires a known pre-test state. It does **not** prove the underlying function is unsupported.

## Evidence pattern

Across real sessions:

1. one warm-cache session had all guarded Core values;
2. after module reload, Air/Pad/Mute/Dim were missing while Talkback and Input 1/2 mode remained known;
3. later, some missing values reappeared partially (including a real `true` Pad value);
4. a later fresh reload again lost those values;
5. an earlier normal Companion Mix observation had Mix A Left and Mix A Right Playback-strip `gain`, `mute`, and `solo` all KNOWN / exact;
6. the later targeted Mix campaign had 0/12 complete `gain + mute + solo` tuples and therefore made zero Mix writes.

This is consistent with state being learned from values explicitly supplied by Focusrite Control Server rather than from a guaranteed complete snapshot for every declared control at subscription time.

## Protocol/cache mechanism already visible in current code

`src/device-parser.js` distinguishes schema declaration from current value:

- every numeric ID declared in `device-arrival` can become a descriptor;
- `device.initialState` receives a value only when that tag explicitly contains `value=`.

`src/focusrite-client.js` then:

- clears the state cache on device arrival;
- seeds only those explicitly supplied initial values;
- subscribes to the dynamic device ID;
- adds/updates state from later `<set>` messages;
- exposes `getValue()` from that observed cache only.

There is currently no per-item read/query command in the production module.

Therefore:

`SCHEMA_PRESENT + CACHE_MISSING` is a valid state and must not be reclassified as `UNSUPPORTED`.

## Independent protocol-family corroboration

Historical third-party FocusriteControlServer research shows the same architectural separation: a `device-arrival` document can declare mixer-strip `gain`, `pan`, `mute`, and `solo` item IDs without values, while a later `<set>` contains only a subset of the declared IDs.

That evidence is useful corroboration of sparse/partial state materialisation in the Control Server family, but it targets older Scarlett hardware and is **research-only**, not Scarlett 18i20 (3rd Gen) hardware proof.

Do not infer that every omitted boolean is `false`; the protocol examples also contain explicitly transmitted `false` values for some items. The omission rule itself remains unresolved.

## Official Focusrite evidence that must be checked before capability conclusions

Focusrite's current Scarlett 18i20 3rd Gen specifications list:

- a Focusrite Control software mixer;
- 12 mono Custom Mixes;
- up to 24 mono custom-mix inputs.

Focusrite's Custom Mix documentation explicitly applies to Scarlett 18i20 3rd Gen and documents independent channel mute/solo behaviour within a Custom Mix.

Sources:

- https://userguides.focusrite.com/hc/en-gb/articles/23031286748306-Scarlett-18i20-3rd-Gen-specifications
- https://support.focusrite.com/hc/en-gb/articles/115004431245-Focusrite-Control-Tutorial-2-Setting-Custom-Mixes
- https://support.focusrite.com/hc/en-gb/articles/360014293199-How-many-Custom-Mixes-can-I-use-on-my-interface

These sources confirm product behaviour; they do not replace exact Control Server or physical hardware validation.

## What is already proven

- IDs/mappings for the guarded Core controls;
- approved writes can change the real hardware for previously tested paths;
- server `<set>` responses can confirm those changes;
- values can be restored after a guarded test when the required initial state is known;
- current 18i20 schema contains distinct Mix-strip `gain`, `pan`, `mute`, and `solo` controls;
- Mix Mute/Solo are documented product functions;
- session readback coverage can differ between otherwise normal Companion sessions.

## What is not proven

- a read-only request that returns every current value at cold start;
- the exact rule deciding which values are omitted from the initial/current server stream;
- whether Focusrite Control's official client uses another state source or command;
- a safe production per-item read/query command;
- why Mix A L/R mute/solo values were available in one observed session but absent from the later targeted campaign;
- full dynamic Scarlett 18i20 (3rd Gen) `mix_mute` / `mix_solo` action-feedback-restore closure.

## Mandatory inference rule

Never turn a readback gap into a capability verdict without additional evidence.

In particular:

- `BASELINE_UNKNOWN` = not observed in this client session;
- it does not mean `false`;
- it does not mean schema absent;
- it does not mean hardware unsupported;
- it does not by itself justify `EVAL_ONLY_NONACTIONABLE` or closing the feedback row.

Before closing a feature, check official product docs, current schema, older contradictory physical/session observations, current implementation, and hardware test evidence separately.

## Rules for investigation

- no hardware `<set>` writes merely to discover current state;
- no guessed defaults;
- use the existing authorised Companion connection by default;
- do not create a second direct TCP client merely to inspect state already available through Companion;
- never copy/reuse the Companion private client key in another process;
- no private raw captures committed to this public repository;
- diagnostic code must log only sanitized state coverage/provenance/results;
- distinguish value provenance as at least `device-arrival`, later `<set>`, or not observed;
- do not build a new helper if an existing diagnostic/TestBench path can expose the required evidence.

## Next research objective

The next useful step is **read-only state-provenance instrumentation through the existing authorised Companion client**.

The instrument must answer, for selected schema items such as Mix Playback-strip `mute`/`solo`:

1. is the schema item present?;
2. did `device-arrival` include a `value=`?;
3. did a later subscription `<set>` provide the value?;
4. when did the first value appear relative to session/device arrival?;
5. does normal Focusrite Control / Companion activity cause materialisation without any hardware write?;
6. can the discrepancy between earlier Mix A L/R KNOWN and later 0/12 tuples be reproduced and explained?

Only after that mechanism is understood should the Mix hardware closure harness be redesigned.

A later property-specific test must require only the state genuinely necessary for exact restoration of the property being changed. For example, a Mute test should not require Gain and Solo merely because an older harness grouped all three, unless new evidence proves those states are actually coupled for safe restore.

## Exit criteria

Promote a bootstrap/readback change only when a read-only mechanism consistently yields the required current values on the physical Scarlett after a fresh process start, or when the project has a clearly documented reason why a value cannot be obtained and a safe product contract for that limitation.

Do not close a hardware capability merely because this exit criterion has not yet been met.
