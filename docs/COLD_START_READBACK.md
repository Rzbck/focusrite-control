# Cold-start readback investigation

Updated: 2026-08-24

## Problem statement

The protocol mapping for Air, Pad, Monitor Mute and Monitor Dim is proven useful on real hardware, but after a fresh module process their **initial current values** are not consistently received.

The same class of problem is visible on Mix strip state: schema controls can be present while current values materialise inconsistently between sessions.

This prevents some safe reversible tests because restoration requires a known pre-test state. It does **not** prove the underlying function is unsupported.

## Evidence pattern

Across real sessions:

1. one warm-cache session had all guarded Core values;
2. after module reload, Air/Pad/Mute/Dim were missing while Talkback and Input 1/2 mode remained known;
3. later, some missing values reappeared partially (including a real `true` Pad value);
4. a later fresh reload again lost those values;
5. an earlier normal Companion Mix observation had Mix A Left and Mix A Right Playback-strip `gain`, `mute`, and `solo` all KNOWN / exact;
6. the later targeted Mix campaign had 0/12 complete `gain + mute + solo` tuples and therefore made zero Mix writes;
7. the software-validated 0.1.17 provenance build was then loaded on the existing authorised Companion connection and a read-only probe was run twice;
8. both 0.1.17 observations produced the same stable pattern for Playback slot 3 / Playback 1 stereo:
   - Mix A-F left: gain KNOWN from later `set` state;
   - Mix A-F right: gain UNKNOWN / never-observed;
   - all 12 mute states: UNKNOWN / never-observed;
   - all 12 solo states: UNKNOWN / never-observed;
9. navigating the Focusrite Control Output Routing UI for 30 seconds caused no additional Mix gain/mute/solo materialisation.

This is consistent with state being learned from values explicitly supplied by Focusrite Control Server rather than from a guaranteed complete snapshot for every declared control at subscription time.

## Focusrite Control UI / output-routing correction

The 0.1.17 provenance campaign also corrected a bad UI assumption.

The six protocol mixes `Mix A` through `Mix F` are **not six visible tabs named A-F in Focusrite Control**. In the observed 18i20 3rd Gen Output Routing UI, the operator selects physical output destinations in the left column. Each destination can be routed directly from Playback or can be assigned a Custom Mix.

User-provided screenshots from the same session showed:

- Monitor Outputs 1-2: `Custom Mix`;
- Line Outputs 3-4: `Playback 3-4`;
- Line Outputs 5-6: `Playback 5-6`;
- Line Outputs 7-8: `Playback 7-8`;
- Line Outputs 9-10: `Playback 9-10`;
- S/PDIF Outputs 1-2: `Playback 11-12`.

Focusrite's official Custom Mix documentation confirms that a Custom Mix is assigned to a chosen output and that assigning it enables the mixer for that output.

Therefore the previous instruction to "navigate Mix A-F" by clicking those output destinations did **not** actually prove that six internal Mix engines were selected or activated. The read-only result now proves only that this output-selection activity does not materialise the missing Mix mute/solo state.

The exact mapping between protocol `Mix A-F` and current physical output destinations remains **RESEARCH_OPEN**. Do not assume `Mix A = Monitor 1-2` or any other fixed mapping until server-confirmed output source/assignment evidence proves it.

Current code already parses output `assignMix` and `assignTalkbackMix` item IDs, but deliberately does not expose them as public write controls because their value semantics are not validated. Prefer existing sanitized `output_N_source_name` state for the next read-only mapping step before considering raw assignment values.

## Additional user-UI evidence — observed, not protocol-validated

New screenshots from the same physical 18i20 session add useful product/UI evidence. The screenshots themselves remain private and are **not** committed to the public repository. No device serial or other private identifier is recorded here.

Observed in the output-source selector:

- top-level choices include `Playback (DAW)`, `Hardware Input`, `Custom Mix`, and `Custom Mix + Talkback`;
- Playback offers stereo DAW pairs;
- Hardware Input offers analogue and digital input pairs;
- `Custom Mix + Talkback` is a distinct routing mode from plain `Custom Mix`.

Focusrite's official 18i20 3rd Gen talkback documentation confirms that `Custom Mix + Talkback` means the normal Custom Mix plus the talkback signal for that chosen output. This confirms product behaviour only; it does not prove any particular `assign-talkback-mix` TCP value semantics.

Observed in Input Settings:

- the Line/Instrument selector is shown only for Analogue 1 and 2;
- Air and Pad controls are shown for Analogue 1 through 8.

Focusrite's official 18i20 3rd Gen hardware guide independently confirms the same product shape: INST applies to inputs 1-2, while Air and Pad exist on all eight analogue channels. This corroborates the current module's supported control families, but it does **not** turn missing Air/Pad cache values into known values and it does not justify inventing input preamp gain or any direct input mute control.

Observed in Device Settings:

- Speaker Switching has Enable/Disable UI;
- Monitor Controls offers scopes `1-2`, `1-4`, `1-6`, `1-8`, `All`, and `None`;
- Talkback exposes a source selector and a level control;
- `Retain 48V` is a persistence setting, not per-channel phantom switching;
- the existing Companion Scarlett 18i20 Remote Devices client is visibly approved in this session.

These UI observations are **not new hardware closures**. They are used only to cross-check terminology and choose safe experiments. Existing dynamic closures for `monitor_preset`, `talkback_source`, `phantom_persistence`, and `input_mode` remain closed and do not need to be repeated.

### Monitor-controls safety consequence

Focusrite's official documentation warns that changing which analogue outputs are assigned to Monitor Controls can cause affected output level to jump to full scale. Therefore the Monitor Controls scope selector must **not** be used as a casual readback/materialisation experiment. `monitor_preset` is already dynamically closed; do not retest it for curiosity.

Speaker Switching / ALT can also change which physical outputs carry the main monitor signal. Any later `monitor_alt_enable` / `monitor_alt` closure must remain isolated, baseline-known and explicitly approved. Do not use Speaker Switching merely to create missing state.

Talkback source is already dynamically closed. The visible Talkback level control may correspond to separately parsed attenuation/state, but no new public action or feedback should be inferred from the screenshot alone.

## Protocol/cache mechanism already visible in current code

`src/device-parser.js` distinguishes schema declaration from current value:

- every numeric ID declared in `device-arrival` can become a descriptor;
- `device.initialState` receives a value only when that tag explicitly contains `value=`.

`src/focusrite-client.js` then:

- clears its state cache on device arrival;
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
- https://support.focusrite.com/hc/en-gb/articles/16571724650130-Direct-Monitoring-inputs-using-Custom-Mixes-in-Focusrite-Control
- https://support.focusrite.com/hc/en-gb/articles/360006950459-Using-the-talk-back-function-on-Scarlett-18i20-3rd-Gen
- https://userguides.focusrite.com/hc/en-gb/articles/23031280130706-Scarlett-18i20-3rd-Gen-hardware-features
- https://support.focusrite.com/hc/en-gb/articles/207546805-How-do-the-headphone-outputs-work-on-the-Scarlett-18i20

These sources confirm product behaviour; they do not replace exact Control Server or physical hardware validation.

## What is already proven

- IDs/mappings for the guarded Core controls;
- approved writes can change the real hardware for previously tested paths;
- server `<set>` responses can confirm those changes;
- values can be restored after a guarded test when the required initial state is known;
- current 18i20 schema contains distinct Mix-strip `gain`, `pan`, `mute`, and `solo` controls;
- Mix Mute/Solo are documented product functions;
- session readback coverage can differ between otherwise normal Companion sessions;
- 0.1.17 provenance instrumentation correctly distinguishes later `set` state from never-observed state on the physical 18i20 session;
- Output Routing UI selection alone did not materialise the missing Mix mute/solo values in the tested session.

## What is not proven

- a read-only request that returns every current value at cold start;
- the exact rule deciding which values are omitted from the initial/current server stream;
- whether Focusrite Control's official client uses another state source or command;
- a safe production per-item read/query command;
- the exact runtime mapping of protocol Mix A-F to output destinations;
- why only the left gain member of each A-F pair was materialised in the latest session;
- why Mix A L/R mute/solo values were available in one earlier observed session but absent from the later campaigns;
- whether the visible Talkback level UI has useful/safe public-module semantics beyond current parsed research state;
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
- no private raw captures or screenshots committed to the public repository;
- diagnostic code must log only sanitized state coverage/provenance/results;
- distinguish value provenance as at least `device-arrival`, later `<set>`, or not observed;
- do not build a new helper if an existing diagnostic/TestBench path can expose the required evidence.

## Next research objective

The next useful step is now narrower than the original provenance campaign:

1. read the already-exposed `output_N_source_name` and stereo state through the existing authorised Companion connection;
2. compare those server-confirmed values with the visible Output Routing configuration;
3. determine which internal Mix A-F, if any, is currently assigned to each physical output destination;
4. do not write `assign-mix`, `assign-talkback-mix`, source or routing merely to obtain that mapping;
5. once the active Custom Mix destination is known, design one property-specific **manual guided** Mute materialisation test before any Companion write test;
6. only after Mute readback semantics are understood, repeat independently for Solo.

The existing `MeterMixPlaybackBaselineReadOnlyProbe.js` is the diagnostic surface; do not create a second probe. It now prints sanitized current output source names without changing the module build.

A later property-specific test must require only the state genuinely necessary for exact restoration of the property being changed. A Mute test must not require Gain and Solo merely because an older harness grouped all three, unless new evidence proves those states are actually coupled for safe restore.

## Exit criteria

Promote a bootstrap/readback change only when a read-only mechanism consistently yields the required current values on the physical Scarlett after a fresh process start, or when the project has a clearly documented reason why a value cannot be obtained and a safe product contract for that limitation.

Do not close a hardware capability merely because this exit criterion has not yet been met.
