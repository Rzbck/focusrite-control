# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T12:30+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_GREEN_READONLY_SESSION_RECHECK_NEXT
Validated executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Latest research result: read-only baseline observation completed; hardware writes NO; Companion button presses NO; Page 2 replacement NO

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

Canonical V8 FULL hardware package:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

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

Accumulated meter evidence remains:

- closed 14/46;
- floor-only 24;
- movement-only 4;
- never observed 4;
- mismatch 0;
- input 8/8 closed;
- output 4/26 closed;
- mix 2/12 closed.

Mix A left/right are already the 2/12 closed mix meters. Mix B-F remain pending.

The existing Playback source is detected dynamically. In the current hardware session it was mixer slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded.

## Validated actionability proof

On the prior validated checkpoint the focused launcher proved:

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

Do not bypass this fail-closed gate.

## Latest full software gate - 2026-08-24 around 12:00 +02:00

User synchronized to exact checkout:

`3e35ac16812f3187fa23bad3542393be638f566b`

Canonical branch/HEAD/handoff fingerprint PASS.

Observed full gate:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- tests **186/186 PASS**;
- Companion package build PASS;
- RUN OK.

The rebuilt `focusrite-scarlett-18i20-0.1.16.tgz` was built only. It was not installed or activated.

This is the current validated executable checkpoint.

## Latest read-only baseline observation - hardware/session evidence

The user then ran:

`testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`

The probe remained read-only throughout:

- no Companion button press;
- no Focusrite write;
- no routing change;
- no Page 2 replacement;
- existing approved Companion connection reused;
- exact model/preflight PASS;
- capability snapshot PASS;
- Playback source detected dynamically as existing slot 3 / Playback 1 stereo.

### Initial state

- Mix A left: gain KNOWN, mute KNOWN, solo KNOWN, exact YES;
- Mix A right: gain KNOWN, mute KNOWN, solo KNOWN, exact YES;
- Mix B left: gain KNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix B right: gain UNKNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix C left: gain KNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix C right: gain UNKNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix D left: gain KNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix D right: gain UNKNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix E left: gain KNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix E right: gain UNKNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix F left: gain KNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix F right: gain UNKNOWN, mute UNKNOWN, solo UNKNOWN, exact NO.

The user typed `NAVIGATE_MIXES` and navigated only among Focusrite Control Mix A-F tabs for the full 30-second observation window without changing controls.

### Observed state after navigation

The KNOWN/UNKNOWN matrix was **identical** to the initial state.

Therefore Focusrite Control Mix-tab navigation does not cause the existing Companion client to receive the missing Playback-strip state.

This is hardware/session-observed read-only evidence. It does NOT make Mix B-F writable.

## Interpretation

The module variable layer does not synthesize baselines. Mixer variables reflect only `client.getValue(itemId)` values already confirmed by Focusrite Control Server.

The client state is populated only from values explicitly present in `device-arrival` or later server `<set>` updates. Missing values intentionally remain unknown.

The latest observation shows a repeatable asymmetry:

- Mix B-F left Playback-strip gain is already server-confirmed;
- Mix B-F left mute/solo are not;
- Mix B-F right gain/mute/solo are not;
- simple Focusrite Control UI navigation does not fill those gaps.

Do not infer right-lane state from left-lane state and do not invent mute/solo defaults.

## Exact next action - read-only session recheck

No new code is required for the next experiment.

Use the exact already validated local checkout `3e35ac16812f...`. A later remote commit may update this handoff only; do not rerun `UPDATE_AND_RUN.bat` merely to pull a documentation-only handoff update.

The next experiment is a **session-only reconnect of the existing Companion Focusrite connection** followed by the already validated read-only baseline probe.

1. Keep the exact audited 0.1.16 package currently active in Companion.
2. In Companion, reuse the existing Companion Focusrite connection. Do **not** delete/recreate it.
3. Disable then re-enable that same existing connection using Companion's connection enable/disable control. Do not edit host/port/client name or any Focusrite hardware setting.
4. Wait until the same connection returns connected/authorised. If Focusrite Control asks for approval, approve the existing **Companion Scarlett 18i20** client in Remote Devices; do not create a new connection/client key.
5. Run only:

```bat
testbench\RUN_METER_MIX_BASELINE_READONLY.cmd
```

6. Inspect the new `ETAT INITIAL` immediately after reconnect.
7. At the `NAVIGATE_MIXES` prompt, type `DONE`. Do not repeat UI navigation yet; the purpose is to isolate the reconnect effect.
8. Copy the complete output for comparison.

This experiment performs no hardware write. It tests whether a fresh `device-arrival` / subscription session causes the server to publish any additional Mix B-F strip state.

If the new `ETAT INITIAL` is unchanged, a normal Companion reconnect does not recover the missing baselines and the next research step must remain read-only.

If any Mix B-F lane gains new KNOWN fields, do not run a write campaign. Review the session evidence first.

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
