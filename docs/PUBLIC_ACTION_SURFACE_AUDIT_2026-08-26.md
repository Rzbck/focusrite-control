# Public action-surface audit — Scarlett 18i20 (3rd Gen)

Date: 2026-08-26  
Development build: `0.1.21`  
Hardware scope: **Scarlett 18i20 (3rd Gen) only**

## Purpose

Freeze a defensible v1 write surface from the strongest available evidence instead of treating schema presence, UI readback or an older permissive oracle as generic write proof.

Evidence order:

1. newest explicit physical-hardware/user-host result;
2. completed direct-write evidence after re-reading its exact oracle;
3. current production code/tests;
4. current handoff/matrix/docs;
5. older captures/assumptions.

`SESSION_STATE_OBSERVED` and `HARDWARE_DYNAMIC_CLOSED` are not automatically `HARDWARE_WRITE_CONFIRMED`.

## Newest physical public-surface result

The latest V4 public-surface hardware smoke on development build 0.1.20 completed with:

- **42 PASS / 10 FAIL**;
- no hard abort;
- reconnect PASS;
- clean global exact-restore audit;
- all ten FAIL results exclusively on `output_pair_source`, classified `NO_TRANSITION`.

Where runnable, direct Output Source/Gain/Nickname, Input nickname/mode-cycle, Device nickname, Phantom Persistence and Monitor preset writes produced server-confirmed transitions and exact target restoration.

The ten `output_pair_source` tests used reciprocal parser/schema pair metadata rather than display-name adjacency and required **both Output members** to reach the requested source pair. None of the ten runnable pairs closed that two-member transition.

## Stereo/Mono and Custom Mix readback evidence retained

The broad read-only REC work remains valid and important. Physical Focusrite Control operation dynamically exercised visible Stereo/Mono topology and Custom Mix controls. The retained readback evidence is strong for:

- faders;
- pan;
- Mute;
- Solo;
- source/stereo topology, including visible Stereo/Mono changes;
- Talkback state;
- all **12/12 Custom Mix meters**;
- all currently available Output meter paths.

The recorder itself performed zero Focusrite writes and pressed zero Companion buttons. These observations are therefore **hardware readback/dynamic evidence**, not proof of a separate Companion write transaction.

## Re-reading the completed V8 evidence

V8 remains valuable direct-write evidence, but its old pair-routing conclusion must be narrowed.

Retained V8 write-confirmed examples include:

- input Air/Pad/Mode and nickname writes;
- Monitor Mute/Dim/Talkback and Monitor output-control preset paths;
- validated direct Output Source writes on supported leaders;
- validated direct Output nickname paths on supported members;
- validated analogue Output Gain paths on supported members;
- device nickname;
- Phantom Persistence;
- Talkback Source;
- selected Custom Mix gain writes on one internal left lane, without uniform generic lane/side/slot proof.

The historical V8 pair-topology oracle was more permissive than the newer V4 oracle. It could record a successful topology/restore path when the requested **left** member changed while the **right** member remained on its original source. That is useful topology/ownership evidence, but it does **not** prove the public `output_pair_source` contract of routing both members to the requested stereo pair.

Therefore `output_pair_source` is no longer classified as retained public hardware-write evidence.

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
- human Outputs 21–24 are hard-blocked for writes until an **available** configuration receives explicit hardware validation;
- internal Custom Mix source IDs are removed from public Output Source choices;
- callbacks re-check the same restrictions so stale saved actions fail closed.

### Device/settings

- `device_nickname`
- `phantom_persistence`
- `talkback_source`
- `reconnect`

## Public v1 actions withheld

These remain readable where supported, but are not normal v1 write actions:

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

### Why `output_pair_source` is withheld

The newest exact hardware test is stronger than the old topology oracle: it requires both source variables to transition to the requested reciprocal source pair. All ten runnable pairs returned `NO_TRANSITION` while exact target restoration remained clean.

This does not justify declaring stereo pairing unsupported. It means the current **Companion two-member routing action is not hardware-write closed**. v1 therefore removes it from normal public actions/presets while retaining truthful Output Source/Stereo readback and research history.

### Why Output Stereo writes are withheld despite real Stereo/Mono UI evidence

Physical REC/UI testing proves that Stereo/Mono topology is a real product behavior and provides strong server-confirmed readback evidence. That evidence is `HARDWARE_DYNAMIC_CLOSED` for the observed state path.

It does not separately close a generic Companion `output_stereo` write transaction across the Output surface. Output Stereo feedback/readback therefore remains public while the write action remains withheld.

### Why Mixer Slot Stereo / generic Custom Mix writes are withheld

The physical sessions strongly validate source/stereo topology and other Custom Mix readback, including Stereo/Mono changes made in Focusrite Control. Direct-write evidence is nevertheless not uniform across all internal lane/side/slot combinations, and internal mix identities do not map cleanly to what the user sees.

Therefore v1 preserves readback/feedback and diagnostics but does not expose generic public Mixer Slot Source/Stereo, Mix fader/pan/Mute/Solo or per-lane Talkback writes.

### Why Custom Mix source IDs are removed from Output routing writes

Focusrite Control presents `Custom Mix` rather than a reliable user-visible mapping to the six internal server mix pairs. Output `assign-mix` is schema-present on 26/26 outputs but has not materialised a usable value in the tested sessions.

The module therefore does not guess which internal mix source represents the user's visible `Custom Mix`. Direct Hardware Input / Software (DAW) Playback / digital routing remains available through `output_source` where hardware-tested.

### Why ALT is withheld despite successful readback

Physical REC evidence dynamically closes ALT / Speaker Switching feedback/readback and runtime ownership/availability behavior. It did not equivalently close a Companion direct-write transaction, so ALT feedback remains while its actions/preset stay withheld.

### Why disruptive settings are withheld

- Device Preset can replace routing broadly;
- Clock Source can affect sync/audio;
- Sample Rate interrupts audio and changes channel/Custom Mix availability;
- Digital I/O mode changes S/PDIF/ADAT topology and may require a device restart.

v1 withholds these writes instead of changing a real interface merely for coverage.

### Why Advanced Raw is withheld

A public v1 does not need a raw-write escape hatch. The connection configuration does not present the Advanced Raw write surface, the definition policy removes `advanced_raw_set`, and hardware policy fails closed for unsafe/withheld families.

Dedicated research/TestBench workflows remain separate from the public action surface.

## Feedback/readback retained

Withholding a write action does not remove truthful server-confirmed readback. The feedback/variable surface can still report:

- ALT / ALT Enable;
- Output Stereo and Output Source state;
- Custom Mix Mute/Solo/Talkback/source/stereo/meters;
- mixer-slot source/stereo diagnostics where enabled;
- Device Preset / Clock Source / Sample Rate / Digital I/O state;
- availability/status and meters.

All feedback remains server-confirmed; no optimistic state is introduced.

## Preset policy

The same release definition policy removes presets using a withheld v1 action. It also removes Output Mute presets whose target is blocked by hardware/availability policy.

Therefore v1 exposes no public `output_pair_source`, Output Stereo, ALT or generic Custom Mix write preset.

## Outputs 21–24

Current server state reports human Outputs 21–24 `available=false` in the tested configuration. They are therefore **CONFIGURATION_UNAVAILABLE**, not unsupported.

Because no available configuration has received explicit write validation, production writes remain hard-blocked even if a future session reports those Outputs `available=true`.

## Forbidden/non-features unchanged

Still absent:

- analogue input preamp Gain;
- direct per-input hardware Mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level write;
- Monitor gain item `1677` write;
- unknown raw items;
- firmware/reset/restore/snapshot writes;
- meter/status writes.

## Development version / validation status

The corrective public-surface change modifies packaged runtime policy, so the development package advances from `0.1.20` to **`0.1.21`**. Different package bytes must not continue to be distributed under the old development version.

Current 0.1.21 code/policy status: **SOFTWARE-GATE-PENDING**.

Before any 0.1.21 hardware run, the checked-in `UPDATE_AND_RUN.bat` must complete:

- immutable dependencies;
- Prettier;
- ESLint;
- source manifest validation;
- all Node tests;
- Companion package build.

Only after that full user-host gate is green should the generated `focusrite-scarlett-18i20-0.1.21.tgz` be imported and the final hardware audit run.

Pending is never PASS.
