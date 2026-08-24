# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T11:36+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_BLOCKED_PENDING_READONLY_BASELINE_PROBE_GATE
Last fully validated executable checkout: 889b9acc0ab90054b64b758966ea74be160c0d4e
Last validated software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 184/184 PASS, Companion package build PASS, RUN OK
Latest hardware-facing result: READ-ONLY NO-OP SAFE, ACTIONABLE=0, ALREADY_CLOSED=2, BASELINE_UNKNOWN=10, NO_TRACK=0, hardware writes NO

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

Accumulated evidence remains:

- closed 14/46;
- floor-only 24;
- movement-only 4;
- never observed 4;
- mismatch 0;
- input 8/8 closed;
- output 4/26 closed;
- mix 2/12 closed.

The two closed mix paths are Mix A left and Mix A right. The pending list contains Mix B-F only.

The existing Playback source is detected dynamically. In the current hardware session it is mixer slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded.

## Validated software gate and actionability proof - 2026-08-24 11:29 +02:00

User synchronized to:

`889b9acc0ab90054b64b758966ea74be160c0d4e`

Canonical branch/HEAD/handoff fingerprint PASS.

Full software gate PASS:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- tests 184/184 PASS;
- Companion package build PASS;
- RUN OK.

The rebuilt `focusrite-scarlett-18i20-0.1.16.tgz` was built only. It was not installed or activated.

The user then ran `testbench\RUN_METER_MIX_PLAYBACK_CLOSURE.cmd`.

Read-only preparation PASS and actionability result:

- exact Scarlett 18i20 (3rd Gen) profile PASS;
- own Companion client authorized PASS;
- live shape PASS;
- evidence coverage PASS;
- capability-lab Page 2 PASS;
- Playback source detected dynamically as existing slot 3 / Playback 1 stereo;
- `ACTIONABLE=0`;
- `ALREADY_CLOSED=2`;
- `BASELINE_UNKNOWN=10`;
- `NO_TRACK=0`;
- Mix A left/right => `SKIP_ALREADY_CLOSED`;
- Mix B-F left/right => `SKIP_BASELINE_UNKNOWN`;
- final result `MIX METER NO-OP SAFE`;
- no `MIX_METERS` prompt;
- no `ALL_ISOLATED` prompt;
- no Page 2 replacement;
- no `SIGNAL_READY` prompt;
- hardware writes NO.

This is the desired fail-closed behavior. Do not bypass it.

## Why Mix B-F remain unknown

The module variable layer does not synthesize baselines. Mixer variables call `client.getValue(itemId)` and return blank when the client has no server-confirmed value.

The Focusrite client state is populated only from values explicitly present in `device-arrival` or later server `<set>` updates. Missing values intentionally remain unknown. Repeated `device-subscribe subscribe=true` requests were already rejected as a state-recovery strategy by earlier real-hardware testing because they made no progress.

Therefore an unknown Mix B-F baseline must remain non-writable unless new read-only evidence provides all required gain/mute/solo state.

## New read-only baseline research probe

New research-only files on the current remote branch:

- `testbench/MeterMixPlaybackBaselineReadOnlyProbe.js`;
- `testbench/RUN_METER_MIX_BASELINE_READONLY.cmd`;
- `test/meter-mix-playback-baseline-readonly.test.js`.

Purpose:

- use the existing Companion Focusrite connection only;
- run the existing read-only V8 preflight;
- detect the existing Playback slot dynamically;
- observe gain/mute/solo availability for that Playback strip across all 12 lanes;
- ask the operator only to navigate between Focusrite Control Mix A-F tabs without changing any control;
- observe for a bounded 30-second window whether previously unknown values become server-confirmed;
- store only KNOWN/UNKNOWN booleans in a local sanitized report.

The probe explicitly has:

- no Companion button press;
- no `/api/location/.../press` route;
- no Focusrite `<set>`;
- no `setValue()`;
- no Page 2 replacement;
- no hardware-write permission flag;
- no new Focusrite client identity;
- no stored raw item IDs or actual baseline values.

This probe is research-only and has NOT yet passed the user's Windows software gate.

The new regression file adds 2 tests, so the next expected total is **186 tests**.

## Exact next action

Do not run any write-capable meter campaign.

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
- **186/186 tests PASS**;
- Companion package build PASS;
- RUN OK.

Do NOT install the rebuilt `.tgz`.

If the full gate is green, run only the research-only launcher:

```bat
testbench\RUN_METER_MIX_BASELINE_READONLY.cmd
```

During its observation phase, navigate only among Focusrite Control Mix A-F tabs. Do not change faders, mute, solo, source, routing, Monitor, clock, sample rate or any other setting.

When prompted, type:

`NAVIGATE_MIXES`

Then navigate through Mix A-F tabs during the observation window.

Expected research outcomes:

1. Mix B-F remain UNKNOWN: UI navigation does not refresh their server state through the existing Companion client. Do not write them; next research must use another read-only method.
2. Some Mix B-F become KNOWN: record which lanes become exact-baseline-capable, but do not immediately run writes. Review the evidence and software policy first.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware test:

1. reuse the existing Companion Focusrite connection;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm **Companion Scarlett 18i20** is approved if required;
4. require the read-only preflight to confirm exact supported model, dynamic discovery and own-client authorization;
5. if approval/preflight is missing, classify the result as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md` for the stable private client identity rules.

Never create a fresh throwaway write client or new client key for normal validation. Never run a direct Focusrite Control Server research probe concurrently with a normal SAFE/FULL/write-capable TestBench campaign.

## Publication/privacy state

Never publish real serials, private hostnames, client IDs/keys, raw private XML/captures/logs, user paths, or private diagnostics.

Preserve relevant MIT/third-party attribution. Do not claim all protocol knowledge was independently discovered.

Official Bitfocus repository/name remains pending maintainer decision. The personal repository name `focusrite-control` does not expand validated hardware support beyond Scarlett 18i20 (3rd Gen).

Stable public target remains v1.0.0 unless Bitfocus maintainers direct otherwise.

Always distinguish hardware-tested, implemented, schema-observed, research-only and unsupported.
