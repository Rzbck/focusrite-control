# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T11:24+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_BLOCKED_PENDING_RERUN_AFTER_PRETTIER_FIX
Latest user checkout: f6c09c79acd5944f21aeea61db619bc055818915
Latest user gate: dependencies PASS, Prettier FAIL on MeterMixPlaybackActionability.js only; ESLint/tests/package not reached
Hardware writes in latest user gate: NO
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

## Meter closure state

There are exactly 46 meter paths:

- 8 input meters;
- 26 output meters;
- 12 mix-lane meters.

Accumulated evidence before the latest actionability work:

- closed 14/46;
- floor-only 24;
- movement-only 4;
- never observed 4;
- mismatch 0;
- input 8/8 closed;
- output 4/26 closed;
- mix 2/12 closed.

The two already-closed mix paths are Mix A left and Mix A right. The pending list contains Mix B-F only.

The existing Playback source is detected dynamically. In the current hardware session it was mixer slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded.

## Latest focused hardware evidence

The corrected on/off harness successfully exercised **Mix A left** and restored it exactly.

The next eligible lane then stopped the campaign before a PASS/INFO row was emitted. Because the runner did not print the underlying operation error, do not invent a specific hardware mechanism for that stop.

Safety result:

- hardware restore confirmed YES;
- Companion Page 2 restore YES;
- mismatch 0;
- no restore quarantine;
- no hard abort.

Key decision:

- only Mix A left/right have exact Playback-slot gain/mute/solo baselines;
- Mix A left/right are already the 2/12 closed mix meters;
- every still-pending Mix B-F lane lacks an exact-restorable baseline;
- therefore further writes to Mix A cannot add meter-closure evidence;
- Mix B-F must not be forced while their exact baseline is unknown.

## Read-only actionability gate

`testbench/MeterMixPlaybackActionability.js` is a restrictive read-only gate.

It:

- reuses the live read-only preflight;
- detects the existing Playback slot dynamically;
- loads current meter evidence;
- classifies exact-baseline lanes already closed as `SKIP_ALREADY_CLOSED`;
- classifies unknown-baseline lanes as `SKIP_BASELINE_UNKNOWN`;
- permits a focused write prompt only if a lane is both exact-restorable and still pending;
- otherwise returns `MIX METER NO-OP SAFE` before `MIX_METERS`, `ALL_ISOLATED`, Page 2 replacement, `SIGNAL_READY` or any hardware write.

This adds no write capability.

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

## Latest software gate - 2026-08-24 11:24 +02:00

User synchronized to:

`f6c09c79acd5944f21aeea61db619bc055818915`

Canonical branch/HEAD/handoff fingerprint PASS.

Observed gate:

- Node/Yarn preparation PASS;
- immutable dependencies PASS;
- Prettier FAIL only on `testbench/MeterMixPlaybackActionability.js`;
- ESLint not reached;
- manifest not reached;
- tests not reached;
- package not reached;
- no hardware write occurred.

The Prettier diagnostic required only this formatting change:

- wrap the final long `console.log()` for `ACTIONABILITY PASS` across multiple lines.

Remote formatting-only correction:

- `2d1435cc43cd0d18838adda14cd106b88f88c3a5` - apply the exact Prettier output to `MeterMixPlaybackActionability.js`.

No runtime logic or write scope changed in this formatting commit.

The expected full test total remains **184 tests**.

## Exact next action

Do NOT run hardware yet.

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

After a green gate, run only:

```bat
testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd
```

With the current evidence/baselines, the expected result is read-only `MIX METER NO-OP SAFE`, with no hardware-write permission prompt. Do not bypass that no-op.

The next research direction after that is read-only: determine whether server-confirmed exact Playback-strip baselines for pending Mix B-F can be obtained safely.

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
