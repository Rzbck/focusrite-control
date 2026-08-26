# Public action-surface audit — Scarlett 18i20 (3rd Gen)

Date: 2026-08-26  
Development build: `0.1.20`  
Hardware scope: **Scarlett 18i20 (3rd Gen) only**

## Purpose

Freeze a defensible v1 write surface from the strongest available evidence instead of treating schema presence or successful readback as generic write proof.

Evidence order used here:

1. newest explicit physical-hardware/user-host result;
2. completed V8 direct-write evidence;
3. current production code/tests;
4. current handoff/matrix/docs;
5. older captures/assumptions.

`SESSION_STATE_OBSERVED` is not automatically `HARDWARE_WRITE_CONFIRMED`.

## Newest physical readback result retained

The 2026-08-26 06:29 UTC read-only REC closed:

- `monitor_alt_enable` feedback/readback — both states, three PASS transitions;
- `monitor_alt` feedback/readback — both states, four PASS transitions;
- all **12/12 Custom Mix meters**;
- all currently available Output meter paths.

No harness Focusrite write and no Companion button press occurred in that REC.

This result strengthens readback; it does not create a Companion write transaction that was not actually exercised.

## Completed V8 direct-write evidence retained

The completed V8 FULL evidence remains the primary generic direct-write audit source.

Retained examples include:

- input Air/Pad/Mode and nickname writes;
- Monitor Mute/Dim/Talkback and Monitor output-control preset paths;
- validated direct Output Source writes on pair leaders;
- validated pair Source topology/restore paths;
- validated direct Output nickname paths on supported members;
- validated analogue Output Gain paths on supported members;
- device nickname;
- Phantom Persistence;
- Talkback Source;
- selected Custom Mix gain writes on one internal left lane, but not uniform generic lane/side/slot proof;
- disruptive Device Preset / Clock Source / Sample Rate / Digital I/O actions remained manual-pending/excluded.

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
- `output_pair_source` — filtered eligible pairs/direct stereo sources only;
- `output_nickname` — filtered validated direct targets.

Additional v1 Output restrictions:

- every right/pair-owned direct Mute member is withheld;
- Monitor Outputs 1–2 direct Gain remains withheld;
- known no-effect direct Gain/Nickname members remain withheld;
- human Outputs 21–24 are hard-blocked for writes until an **available** configuration receives explicit hardware validation;
- Custom Mix internal source IDs are removed from Output source/pair-routing write choices;
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

### Why ALT is withheld despite the successful latest REC

The physical REC dynamically proves ALT / Speaker Switching **feedback/readback** and runtime ownership/availability behaviour. It did not press the Companion ALT actions. The V8 campaign classified ALT writes as candidates rather than completed generic write proof. Therefore v1 keeps ALT feedbacks but withholds the actions/preset.

### Why Output Stereo writes are withheld

V8 retained candidate/no-effect/pair-topology distinctions rather than proving a single generic direct Stereo transaction across the Output surface. Newer manual UI testing proves Stereo is a real product capability and provides strong readback evidence, but not a generic Companion write transaction. Feedback remains public; direct write is withheld.

### Why generic Custom Mix writes are withheld

The newest manual hardware sessions strongly validate readback for fader, pan, Mute, Solo, source/stereo topology and meters. V8 direct-write evidence, however, is not uniform across every internal lane/side/slot. In addition, Focusrite Control presents **Custom Mix** to the user while the private server exposes internal mix IDs/names that are not reliably mapped in the UI.

Therefore v1 does not expose generic actions/presets that ask the user to choose those internal mix identities. This is a write/UX withholding decision, not a claim that Custom Mix is unsupported.

### Why Custom Mix sources are removed from Output routing writes

The normal Focusrite Control UI presents `Custom Mix` rather than an explicit user-visible mapping to the six internal server mix pairs. Output `assign-mix` remains schema-present but has never materialised a value on the tested 18i20 sessions.

The module therefore does not guess which internal mix source should represent a user's `Custom Mix` selection. Direct Hardware Input / Software (DAW) Playback / digital routing remains available where hardware-tested.

### Why disruptive settings are withheld

- Device Preset can replace routing broadly;
- Clock Source can affect sync/audio;
- Sample Rate interrupts audio and changes channel/Custom Mix availability;
- Digital I/O mode changes S/PDIF/ADAT topology and may require a device restart.

The completed direct-write campaign left these manual-pending rather than hardware-certified. v1 chooses **withhold** instead of changing a real production interface merely for test coverage.

### Why Advanced Raw is withheld

A normal public v1 does not need a raw-write escape hatch when named validated actions already exist. The connection configuration no longer presents the Advanced Raw checkbox, the definition policy removes `advanced_raw_set`, and hardware policy also fails closed for withheld mix/settings/ALT/Stereo raw paths.

Dedicated research/TestBench workflows remain separate from the public action surface.

## Feedback/readback retained

Withholding a write action does not remove truthful server-confirmed readback. Current feedback surface can still report:

- ALT / ALT Enable;
- Output Stereo and Output Source state;
- Custom Mix Mute/Solo/Talkback/source/stereo/meters;
- Device Preset / Clock Source / Sample Rate / Digital I/O state;
- availability/status and meters.

All feedback remains server-confirmed; no optimistic state is introduced.

## Preset policy

The same definition policy removes presets using a withheld v1 action. It also removes Output Mute presets whose target is blocked by hardware/availability policy.

Therefore v1 does not expose ALT or generic Custom Mix write presets.

## Outputs 21–24

Current server state reports human Outputs 21–24 `available=false` in the tested configuration. Official product behaviour allows digital channel availability to vary by sample-rate/Digital-I/O configuration.

They are therefore **CONFIGURATION_UNAVAILABLE**, not unsupported. However, because no available configuration has received real write validation, production writes remain hard-blocked even if a future session reports them `available=true`.

A future hardware campaign may remove that block only after explicit available-configuration validation.

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

## Software validation status

Targeted isolated policy validation performed during the audit:

- JavaScript syntax for the policy subset: PASS;
- production-policy regression subset: **6/6 PASS** in the isolated local Node harness;
- no physical hardware write was performed by this software audit.

The repository-wide user-host gate is still **PENDING** after the `0.1.20` production policy changes. The next required workflow is the checked-in:

`UPDATE_AND_RUN.bat`

It must pass dependencies, Prettier, ESLint, source manifest, **all Node tests** and Companion package build before `0.1.20` becomes the new green software checkpoint.

Pending is never PASS.
