# TestBench V6 — device-wide topology and feedback validation plan

Status: **implemented for software validation; no V6 hardware campaign has been run yet**.

Validated hardware scope remains **Focusrite Scarlett 18i20 (3rd Gen) only**. The V6 engine is capability/profile-driven so future Focusrite Control devices can reuse the same structure, but unvalidated models remain read-only discovery/research until real hardware testing enables a model profile.

## Why V6 exists

The earlier targeted Outputs 3–4 probe answered one narrow question: the right-member `Source=None` mismatch on that pair was not merely a short server-propagation delay. It was useful research evidence, but a single pair must not become the hardware model.

V6 moves that evidence into a whole-device campaign:

- no pair number is hardcoded in the topology sweep;
- every declared pair in the hardware-tested profile is considered;
- each pair gets its own observation/result;
- no odd/even or generic leader/follower rule is inferred;
- `UNAVAILABLE`, `UNKNOWN`, missing state and missing capability stay explicit skip/refusal states;
- exact restoration is verified after each routing probe before the next pair is touched.

The historical pair 3–4 probe remains only a research/regression reference.

## Device-wide output-pair topology sweep

For every pair declared by the validated profile and present in the live device shape, V6:

1. checks both members expose source state;
2. checks availability;
3. refuses writes for availability `UNKNOWN` or `UNAVAILABLE`;
4. requires both exact original source values to be server-confirmed;
5. re-reads the pair immediately before the write and refuses if it has drifted since the snapshot;
6. uses only audited Companion Page 2 actions;
7. tries known paired source candidate A and, if necessary, candidate B;
8. records the observed left/right server behavior independently;
9. requests pair `Source=None`;
10. samples both members at approximately 0, 100, 500, 1500 and 4000 ms;
11. restores exact original state in `finally`;
12. first verifies the audited pair-restore action;
13. if needed, tries the two audited individual output-source restore actions toward the known originals and verifies both;
14. if exact restoration still fails, attempts the existing both-member `None` safe fallback, records quarantine and HARD ABORTS before another topology write.

A topology row `PASS` means the requested observation sequence completed and exact restoration was confirmed. It does **not** mean every pair accepts the same routing semantics or that `None` reached both members. The detail records each pair's observed pattern separately.

## Physical isolation requirement

FULL V6 includes real temporary routing changes across every eligible pair. The normal launcher therefore requires the user to type:

`ALL_ISOLATED`

This confirmation means:

- the normal saved Focusrite configuration has been restored before the campaign;
- all physical outputs that could carry audio are disconnected or safely muted/isolated downstream during routing probes;
- headphones/monitoring are at a safe level;
- temporary routing changes and the guided manual phase are explicitly authorised.

This is separate from Control Server Remote Devices authorization, which is still verified against the module's own server-assigned client ID.

## Feedback validation — all current public definitions

The r9 matrix currently contains **829 logical feedback probes across 31 public feedback definitions**.

V6 has an explicit independent oracle for all 31 current definition families:

- connection: `connected`, `authorised`;
- monitoring: `monitor_mute`, `monitor_dim`, `monitor_talkback`, `monitor_alt`, `monitor_alt_enable`, `monitor_preset`;
- inputs: `input_air`, `input_pad`, `input_available`, `input_mode`, `input_meter`;
- outputs: `output_mute`, `output_stereo`, `output_source`, `output_available`, `output_meter`;
- mixer slots: `mixer_slot_stereo`, `mixer_slot_source`;
- mix lanes: `mix_mute`, `mix_solo`, `mix_talkback`, `mix_meter`;
- device/settings: `device_preset`, `clock_source`, `sample_rate`, `spdif_mode`, `clock_locked`, `talkback_source`, `phantom_persistence`.

For every r9 logical probe, V6 reads the rendered T/F marker and compares it with server-confirmed state. Missing/blank/unmappable independent state is not guessed and remains `EVAL_ONLY`; a disagreement is `FAIL`.

### Meter feedbacks

Old sweeps treated meter feedbacks as `EVAL_ONLY`. V6 instead uses the actual numeric server meter variable and the feedback's configured threshold:

`expected = numeric meter value >= configured threshold`

This validates the rendered marker against the same semantics implemented by the production feedback callback.

A static state alone does not prove both threshold branches, so V6 also offers a guided manual dynamics phase.

## Guided manual phase

Normal FULL launches V6 with manual feedback enabled. The user may explicitly `SKIP` an individual manual step; skipped/uncompleted work remains `MANUAL_PENDING`, never a fake PASS.

### Meter dynamics

V6 asks the user to type `READY`, then opens an approximately 20-second observation window.

During that window the user should create **silence and signal on as many real paths as practical**. The TestBench itself does not change routing during this phase.

For each meter feedback it records whether:

- rendered feedback and numeric server threshold agreed;
- the false state was seen;
- the true state was seen;
- both states were seen during the manual window.

Paths that do not cross both states remain manual coverage pending. This is expected when a physical source/path cannot conveniently be exercised in one run.

### Physical Monitor control / item 1677

Monitor gain item `1677` remains **read-only**.

If the `monitor_gain` variable is exposed, V6 asks the user to:

1. move the physical Monitor control slightly;
2. type `MOVED`;
3. allow the TestBench to observe a server-confirmed value change;
4. physically return the control to its starting position when prompted;
5. allow the TestBench to observe the original server value again.

No software Monitor gain write, set/adjust action, preset or raw-write path exists. Even if no readback change is observed, the user is still instructed to return the physical control before the phase ends.

## What remains excluded

Normal FULL still does not automatically change:

- device routing preset;
- clock source;
- sample rate;
- S/PDIF mode;
- firmware/reset/restore/snapshot functions;
- unknown/raw items;
- Monitor gain 1677;
- invented input preamp gain, direct per-input hardware mute, per-channel phantom control or Mic Kill.

Their feedbacks may be checked against their current server-confirmed state without changing the disruptive setting itself. A dedicated state-changing hardware test for a disruptive setting requires separate explicit user agreement.

## Reporting

The FULL shareable report remains privacy-sanitized and automatically published from the validation branch after a completed campaign.

The report must distinguish:

- automatic hardware PASS/FAIL;
- per-pair topology observations;
- server-confirmed feedback PASS/FAIL/EVAL_ONLY;
- `PASS_MANUAL` / `MANUAL_PENDING` manual observations;
- availability/capability skips;
- forbidden/unsupported surfaces;
- restoration quarantine.

Raw live values, private captures, connection identifiers, serials, hostnames, local endpoints and user paths remain private.

## Required sequence before first V6 hardware run

1. run one complete normal `UPDATE_AND_RUN.bat` on `testbench/v0.2-hardware-validation`;
2. require dependency, Prettier, ESLint, manifest, all tests and package steps to pass;
3. do not start hardware if that software gate fails;
4. after a green gate, run the normal `RUN_TESTBENCH.bat` and choose `FULL`;
5. if Page 2 reports `PREP REQUIRED`, replace only Page 2 with the newly generated private `FULL_EXTENDED.companionconfig`, remap `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection, then rerun the same launcher;
6. type `ALL_ISOLATED` only after the physical safety conditions are genuinely satisfied;
7. follow the manual prompts one at a time;
8. after completion, use the automatically published sanitized GitHub result for analysis; do not publish or request the raw private report.
