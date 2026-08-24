# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T12:35+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_GREEN_DIRECT_READONLY_PROTOCOL_RESEARCH_NEXT
Validated executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Latest research result: same existing Companion connection reconnected; read-only baseline matrix unchanged; hardware writes NO

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

Current production candidate installed in Companion during meter research:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Keep Companion on this exact already audited/live-validated 0.1.16 package. Do NOT install a `.tgz` rebuilt by the TestBench branch.

## Permanent safety policy

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

Mix A left/right are already closed. Mix B-F remain pending.

The existing Playback source is detected dynamically. In the current hardware session it has been mixer slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded.

## Validated software checkpoint

Exact validated executable checkout:

`3e35ac16812f3187fa23bad3542393be638f566b`

Observed gate:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- tests 186/186 PASS;
- Companion package build PASS;
- RUN OK.

The rebuilt 0.1.16 `.tgz` was not installed or activated.

A later remote commit may update only this handoff. A documentation-only handoff update does not invalidate the validated executable checkout.

## Validated actionability proof

The focused launcher proved, read-only before write permission:

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

## Read-only baseline evidence

The validated `RUN_METER_MIX_BASELINE_READONLY.cmd` probe uses the existing Companion connection only and performs no Companion button press, Focusrite write, routing change or Page 2 replacement.

### Stable baseline matrix

Across the latest observations:

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

### UI-navigation experiment

The user navigated only among Focusrite Control Mix A-F tabs for the full 30-second read-only observation window.

Result: the KNOWN/UNKNOWN matrix was identical before and after navigation.

Conclusion: simple Focusrite Control Mix-tab navigation does not cause the existing Companion client to receive the missing Playback-strip state.

### Same-connection reconnect experiment - latest result

The user then disabled/re-enabled the **same existing Companion Focusrite connection**, preserving its configuration and private client identity, waited for connected/authorised state, and reran the validated read-only baseline probe.

The new `ETAT INITIAL` was again exactly the same matrix listed above.

At the `NAVIGATE_MIXES` prompt the user typed `DONE`, so this result isolates the reconnect/session effect.

Observed safety/result:

- exact model/preflight PASS;
- existing approved Companion connection reused;
- no new client key intentionally created;
- no Companion button press;
- no Focusrite write;
- no routing change;
- no Page 2 replacement;
- hardware writes NO;
- baseline matrix unchanged.

Conclusion: a normal fresh Companion TCP/device-subscription session does **not** recover the missing Mix B-F Playback-strip baselines.

This is hardware/session-observed read-only evidence. It does NOT make Mix B-F writable.

## Interpretation

The module variable layer does not synthesize baselines. Mixer variables reflect only `client.getValue(itemId)` values already confirmed by Focusrite Control Server.

The client state is populated only from values explicitly present in `device-arrival` or later server `<set>` updates. Missing values intentionally remain unknown.

The current evidence therefore shows a stable publication asymmetry through the normal Companion path:

- Mix B-F left Playback gain is published;
- Mix B-F left mute/solo are not published;
- Mix B-F right gain/mute/solo are not published;
- neither UI tab navigation nor a normal same-identity reconnect fills those gaps.

Do not infer right-lane state from left-lane state. Do not invent mute/solo defaults. Do not write Mix B-F while exact restoration is impossible.

## Next research direction - direct read-only protocol observation

The same Companion-path experiments are now exhausted; repeating them adds no evidence.

The next justified research question is whether a deliberately isolated **direct Focusrite Control Server read-only client** sees the same partial initial/subscription state.

This is research-only and must remain separate from normal Companion hardware validation.

Before running such a probe:

- inspect/reuse the historical `debug/cold-start-readback` research pattern where appropriate;
- transmit only `client-details`, `device-subscribe` and `keep-alive`;
- forbid `<set>` entirely;
- dynamically discover the Control Server port and device ID;
- never hardcode a live port or device ID;
- do not log or publish raw XML, serial, hostname, endpoint, client key/client ID or private diagnostics;
- report only sanitized state-presence classes needed to answer the Mix B-F baseline question;
- do not run the direct probe concurrently with SAFE/FULL or any write-capable TestBench campaign;
- label the result research-only.

Do not create a write-capable direct client. Do not use raw USB for this question.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware test:

1. **reuse the existing Companion Focusrite connection**;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm **Companion Scarlett 18i20** is approved if required;
4. require the read-only preflight to confirm exact supported model, dynamic discovery and own-client authorization;
5. if approval/preflight is missing, classify the result as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md` for the stable private client identity rules.

Never create a fresh throwaway write client or new client key for normal validation. Never run a direct Focusrite Control Server research probe concurrently with a normal SAFE/FULL/write-capable TestBench campaign.

## Publication/privacy state

Never publish real serials, private hostnames, client IDs/keys, raw private XML/captures/logs, user paths or private diagnostics.

Preserve relevant MIT/third-party attribution. Do not claim all protocol knowledge was independently discovered.

Official Bitfocus repository/name remains pending maintainer decision. The repository/module name may eventually be `focusrite-control`, but validated hardware support remains Scarlett 18i20 (3rd Gen) only until real testing proves otherwise.

Stable public target remains v1.0.0 unless Bitfocus maintainers direct otherwise.

Always distinguish hardware-tested, implemented, schema-observed, research-only and unsupported.
