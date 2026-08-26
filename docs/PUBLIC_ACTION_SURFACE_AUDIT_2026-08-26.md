# Public action-surface audit — Scarlett 18i20 (3rd Gen)

Date: 2026-08-26  
Development build: `0.1.21`  
Hardware scope: **Scarlett 18i20 (3rd Gen) only**

## Purpose

Freeze a defensible v1 write surface from the strongest available evidence instead of treating schema presence, UI readback, or older permissive oracles as generic write proof.

Evidence order:

1. newest explicit physical-hardware/user-host result;
2. completed direct-write evidence after re-reading its exact oracle;
3. current production code/tests;
4. current handoff/matrix/docs;
5. older captures/assumptions.

`SESSION_STATE_OBSERVED` and `HARDWARE_DYNAMIC_CLOSED` are not automatically `HARDWARE_WRITE_CONFIRMED`.

## Final 0.1.21 validation status

The corrective 0.1.21 build is **SOFTWARE-GREEN** on the user host:

- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **306/306 Node tests PASS**;
- Companion package build PASS.

The final V5 retained-public-write hardware result is clean:

- **42/42 PASS**;
- hard abort false;
- exact restoration/global safety clean;
- reconnect PASS;
- `output_pair_source` absent by policy, not silently skipped as an expected public write.

The final cumulative read-only Custom Mix closure is also **COMPLETE**:

- Mute/Solo/Talkback representative paths closed with mismatch 0;
- fader movement captured on 7 paths;
- pan movement captured on 4 paths;
- Stereo/Mono changes captured on 2 paths;
- Custom Mix routing observed on 7 Output pairs;
- Custom Mix meters **12/12 closed, mismatch 0**.

No additional broad REC was needed after cumulative closure was recalculated.

## `output_pair_source` reclassification

Older V8 pair-topology evidence remains useful topology/ownership evidence, but its historical oracle could pass when the requested left member changed while the right member remained on its original source. That does not prove the current public contract of routing both members to the requested reciprocal source pair.

V3/V4 then repeatedly failed strict two-member closure. V4 used reciprocal parser/schema source-pair metadata rather than display-name adjacency and still produced ten `NO_TRANSITION` results while restoration remained clean.

Therefore `output_pair_source` is not retained as public hardware-write evidence and is **WITHHELD for v1**. The project does not weaken the newer oracle merely to obtain a PASS.

This does not mean Stereo/Mono is unsupported.

## Stereo/Mono and Custom Mix readback evidence retained

Physical Focusrite Control operation dynamically exercised visible Stereo/Mono topology and Custom Mix controls. Strong server-confirmed readback evidence exists for:

- faders;
- pan;
- Mute;
- Solo;
- source/stereo topology, including visible Stereo/Mono changes;
- Talkback state;
- all **12/12 Custom Mix meters**;
- all currently available Output meter paths.

The recorder itself performed zero Focusrite writes and pressed zero Companion buttons. These are hardware readback/dynamic observations, not proof of a separate Companion write transaction.

## Public v1 actions kept

### Monitor

- `monitor_mute`
- `monitor_dim`
- `monitor_talkback`
- `monitor_preset`

### Hardware Inputs

- `input_air`
- `input_pad`
- `input_mode`
- `input_mode_cycle`
- `input_nickname`

### Outputs

- `output_mute` — filtered to validated direct members, forced single-output scope;
- `output_gain_set` — filtered to validated analogue gain targets;
- `output_gain_adjust` — same eligible gain targets and server-confirmed numeric baseline requirement;
- `output_source` — filtered direct targets and direct source families only;
- `output_nickname` — filtered validated direct targets.

Additional Output restrictions:

- every right/pair-owned direct Mute member is withheld;
- pair-owned right Source is withheld from direct routing;
- dedicated `output_pair_source` stereo-pair routing is withheld;
- Monitor Outputs 1–2 direct Gain remains withheld;
- known no-effect direct Gain/Nickname members remain withheld;
- human Outputs 21–24 are hard-blocked for writes until an available configuration receives explicit hardware validation;
- internal Custom Mix source IDs are removed from public Output Source choices;
- callbacks re-check the same restrictions so stale saved actions fail closed.

### Device/settings

- `device_nickname`
- `phantom_persistence`
- `talkback_source`
- `reconnect`

## Public v1 actions withheld

Readable state may remain where supported, but these are not normal v1 write actions:

- `monitor_alt_enable`
- `monitor_alt`
- `output_stereo`
- `output_pair_source`
- `mixer_slot_source`
- `mixer_slot_stereo`
- `mix_mute`
- `mix_solo`
- `mix_gain_set`
- `mix_gain_adjust`
- `mix_pan`
- `mix_talkback`
- `device_preset`
- `clock_source`
- `sample_rate`
- `spdif_mode`
- `advanced_raw_set`

Withholding is deliberate v1 scope control, not an unsupported-hardware claim.

## Why Output Stereo writes remain withheld

Physical UI/REC testing proves Stereo/Mono topology is real and gives strong server-confirmed readback evidence. That evidence is `HARDWARE_DYNAMIC_CLOSED` for the observed state path, but it does not separately close a generic Companion `output_stereo` write transaction across the Output surface.

Output Stereo feedback/readback therefore remains truthful while the write action stays withheld.

## Why Mixer Slot Stereo / generic Custom Mix writes remain withheld

The physical sessions strongly validate source/stereo topology and other Custom Mix readback. Direct-write evidence is not uniform across all internal lane/side/slot combinations, and internal mix identities do not map cleanly to the user-visible Custom Mix UI.

Therefore v1 preserves readback/diagnostics but does not expose generic public Mixer Slot Source/Stereo, Mix fader/pan/Mute/Solo, or per-lane Talkback writes.

## Custom Mix source IDs / `assign-mix`

Focusrite Control presents `Custom Mix` rather than a reliable user-visible mapping to internal server mix pairs. `assign-mix` remains:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised in tested sessions;
- raw semantics `UNKNOWN`;
- write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no raw write.

The module does not guess which internal mix source represents the visible Custom Mix. Direct Hardware Input / Software (DAW) Playback / digital routing remains available through `output_source` where hardware-tested.

## ALT

Physical REC evidence dynamically closes ALT / Speaker Switching feedback/readback and runtime ownership/availability behavior. It does not equivalently close a Companion direct-write transaction, so ALT feedback remains while ALT write actions/presets stay withheld.

## Disruptive settings

Device Preset, Clock Source, Sample Rate, and Digital I/O/S/PDIF mode remain withheld because they can replace routing, interrupt audio/sync, alter topology, or require restart. v1 does not change a real interface merely for coverage.

## Advanced Raw

A public v1 does not need a raw-write escape hatch. `advanced_raw_set` is removed from the installed public surface, and hardware policy remains fail-closed for unsafe/withheld families.

## Preset policy

The release definition policy removes presets using withheld v1 actions and removes Output Mute presets whose targets are blocked by hardware/availability policy.

Therefore v1 exposes no public `output_pair_source`, Output Stereo, ALT, or generic Custom Mix write preset.

## Outputs 21–24

Current tested configuration reports human Outputs 21–24 `available=false`. They are **CONFIGURATION_UNAVAILABLE**, not unsupported.

No available configuration has received explicit write validation, so production writes remain hard-blocked even if a future session reports them `available=true`.

## Forbidden/non-features unchanged

Still absent:

- analogue input preamp Gain;
- direct per-input hardware Mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level write;
- Monitor gain item `1677` write;
- unknown raw item writes;
- firmware/reset/restore/snapshot writes;
- meter/status writes.

## Next release gate

Hardware/action validation for the frozen v1 scope is complete. The remaining technical release gate is the **exact archive audit of the exact `focusrite-scarlett-18i20-0.1.21.tgz` generated/used on the user host**.

That exact archive audit must cover SHA-256, archive contents, package/manifest coherence, bundled action/preset surface, forbidden-feature regression, privacy scan, and attribution. Source reconstruction alone is not an exact-artifact PASS.
