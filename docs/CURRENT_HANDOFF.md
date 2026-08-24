# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T11:17+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_BLOCKED_PENDING_ACTIONABILITY_GATE_RERUN
Current remote objective: prevent any focused mix write that cannot add new meter evidence
Latest hardware result: SAFE FUNCTIONAL STOP; hardware restore YES; Companion Page 2 restore YES; mismatch 0

## Canonical freshness rule

This file is the canonical living resume point for the active branch.

Before proposing code, hardware work, branch changes or publication work:

1. identify the active branch;
2. fetch the current remote branch state;
3. read this file from that same branch;
4. reconcile the newest user-pasted run output;
5. treat older Project uploads/chat summaries as historical unless proven current;
6. prefer newer explicit hardware evidence and current checked-in code over older assumptions.

Current supported hardware remains exactly **Scarlett 18i20 (3rd Gen)**.

Do NOT rerun FULL for the current meter-closure issue.

## Package checkpoints

Canonical broad hardware package:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

This exact package produced canonical V8 FULL-from-zero hardware evidence.

Current production candidate installed in Companion during meter closure:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do NOT install a `.tgz` rebuilt by this TestBench branch. Keep Companion on the exact already audited/live-validated 0.1.16 package.

## Permanent hardware safety policy

V8 FULL-from-zero remains the broad write-capable hardware evidence.

Keep these restrictions unchanged:

- Monitor gain item 1677 is read-only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no unknown raw writes;
- no firmware/reset/restore/snapshot commands;
- no writes to availability UNKNOWN outputs;
- feedback/state must be server-confirmed;
- Focusrite Control Server port and device ID remain dynamic.

## Meter closure state before the latest focused run

There are exactly 46 meter paths:

- 8 input meters;
- 26 output meters;
- 12 mix-lane meters.

Accumulated evidence:

- closed 14/46;
- floor-only 24;
- movement-only 4;
- never observed 4;
- mismatch 0;
- input 8/8 closed;
- output 4/26 closed;
- mix 2/12 closed.

The two already-closed mix paths are Mix A left and Mix A right. The final pending list contains only Mix B-F.

The existing Playback source is detected dynamically. In the current hardware session it was mixer slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded.

## Latest focused hardware run - 2026-08-24 around 11:17 +02:00

Launcher:

`testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`

Read-only preparation PASS:

- r9 page audit PASS: 42 SAFE setters + 829 feedback probes + 31 feedback definitions;
- module version 0.1.16 PASS;
- exact Scarlett 18i20 (3rd Gen) hardware-tested write profile PASS;
- own Companion module client authorized PASS;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes PASS;
- evidence coverage 1436/1436 inventory rows classified; snapshot 1340/1340; core 21/21;
- output availability AVAILABLE=22, UNKNOWN=4;
- V8 capability-lab Page 2 audit PASS;
- no hardware write occurred during preparation.

User explicitly confirmed `MIX_METERS`, `ALL_ISOLATED` and `SIGNAL_READY`.

Focused eligibility was 2/12 lanes with exact Playback-slot gain/mute/solo baselines.

Observed result:

- temporary focused Page 2 imported successfully;
- Playback activity confirmed;
- **Mix A left EXERCISED** successfully;
- the next eligible lane then stopped the campaign before a PASS/INFO row was emitted for it;
- because lane order is sorted `Mix A/left`, `Mix A/right`, the stopped lane is Mix A right;
- Companion Page 2 restore PASS;
- hardware restore confirmed YES;
- mismatch remained 0;
- campaign exit code 2 / `CAMPAIGN_FAILED`;
- this is NOT a restore quarantine and NOT a hard abort.

Final meter evidence was unchanged:

- closed 14/46;
- floor-only 24;
- movement-only 4;
- never observed 4;
- mismatch 0.

The current runner did not print the exact Mix A right operation error, so do not invent a specific hardware no-effect mechanism from this run alone.

## Key decision from the latest hardware evidence

The focused campaign is not useful in the current state even if Mix A right were to pass.

Reason:

- only 2/12 lanes have exact Playback-slot gain/mute/solo baselines;
- those two lanes are Mix A left/right;
- Mix A left/right are already the 2/12 closed mix meters;
- every still-pending Mix B-F lane has `SKIP_BASELINE_UNKNOWN` under the exact-restore contract.

Therefore another write to Mix A cannot add new meter-closure evidence. Do not keep writing to already-closed lanes merely to obtain a green campaign status.

Do not force Mix B-F while their exact baseline is unknown.

## New read-only actionability gate

New file:

`testbench/MeterMixPlaybackActionability.js`

Purpose:

- reuse the live read-only preflight;
- detect the existing Playback slot dynamically;
- load the meter evidence with the current signature;
- classify each mix lane by both exact-restorable baseline and meter closure state;
- permit the focused write prompt only if a lane is both `READY` and still pending;
- classify exact-baseline lanes already closed as `SKIP_ALREADY_CLOSED`;
- classify unknown-baseline lanes as `SKIP_BASELINE_UNKNOWN`;
- if no pending exact-restorable lane exists, exit as `MIX METER NO-OP SAFE` before `MIX_METERS`, `ALL_ISOLATED`, Page 2 replacement, `SIGNAL_READY` or any hardware write.

The launcher now runs this actionability gate after normal read-only preparation and before hardware permission.

This is a restrictive safety change only. It adds no write capability.

Focused write scope remains unchanged when actionability genuinely exists:

- `mix_gain_set`;
- `mix_mute`;
- `mix_solo`;
- dynamically detected existing Playback slot only.

Still absent:

- direct Focusrite protocol `<set>`;
- `output_source`;
- `output_pair_source`;
- Pair Source=None guards;
- Mixer Slot Source/Stereo writes;
- Advanced Raw;
- Monitor gain 1677 writes;
- firmware/reset/restore/snapshot;
- Device Preset / Clock Source / Sample Rate / S/PDIF Mode.

## Software regression coverage

The prior boolean action fix remains required:

- canonical server `true/false` must be encoded as Companion action `on/off`;
- exact true baselines must restore using `on`, never raw `true`.

The prior test lookup bug was fixed by resolving real returned batch IDs rather than guessing `mix-a-l`/`mix-a-r` names.

The new actionability regression adds one more test. The next expected full test total is:

- **184/184 tests PASS**.

The current remote changes have not yet passed the user's Windows software gate. Do not run hardware first.

## Exact next action

Run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur testbench/meter-routing-exact-restore
```

Required full gate:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- **184/184 tests PASS**;
- Companion package build PASS;
- RUN OK.

Do NOT install the rebuilt `.tgz`.

If any software step fails, do not run hardware.

After a green gate, running:

```bat
testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd
```

is expected, with the current meter/baseline state, to stop during the new read-only actionability gate with:

`MIX METER NO-OP SAFE`

and no hardware-write permission prompt.

That no-op is the desired result. Do not try to bypass it.

The next research direction after that is **read-only**: determine whether server-confirmed exact Playback-strip baselines for pending Mix B-F can be obtained safely. Until such baselines exist, those lanes remain non-actionable and must not be written merely to chase 46/46 closure.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware test:

1. reuse the existing Companion Focusrite connection;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm **Companion Scarlett 18i20** is approved if required;
4. require the read-only preflight to confirm exact supported model, dynamic discovery and own-client authorization;
5. if approval/preflight is missing, classify the result as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md` for the stable private client identity rules.

Never create a fresh throwaway write client or new client key for normal validation. Never run a direct Focusrite Control Server research probe concurrently with a normal write-capable Companion TestBench campaign.

## Publication/privacy state

Never publish real serials, private hostnames, client IDs/keys, raw private XML/captures/logs, user paths, or private diagnostics.

Preserve relevant MIT/third-party attribution. Do not claim all protocol knowledge was independently discovered.

Official Bitfocus repository/name remains pending maintainer decision. The personal repository name `focusrite-control` does not expand validated hardware support beyond Scarlett 18i20 (3rd Gen).

Stable public target remains v1.0.0 unless Bitfocus maintainers direct otherwise.

Always distinguish hardware-tested, implemented, schema-observed, research-only and unsupported.
