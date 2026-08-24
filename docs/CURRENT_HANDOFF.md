# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T12:35+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_GREEN_DIRECT_READONLY_DEBUG_GATE_PENDING
Validated executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Latest Companion-path research result: same existing connection reconnected; read-only baseline matrix unchanged; hardware writes NO
Prepared direct research branch: debug/cold-start-readback @ da52836faeef28f596d1eeef3536e7e89928b1a0

## Canonical freshness rule

This file is the canonical living resume point for the active validation branch.

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

Keep Companion on this exact already audited/live-validated 0.1.16 package. Do NOT install a `.tgz` rebuilt by either the validation TestBench branch or the older debug branch.

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

There are 46 meter paths:

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

The Playback slot is detected dynamically. In the current hardware session it has been slot 3 / Playback 1 stereo, but slot 3 must never be hardcoded.

## Validated software/actionability checkpoint

Exact validated executable checkout:

`3e35ac16812f3187fa23bad3542393be638f566b`

Observed full gate:

- Node 22.23.2;
- Yarn 4.17.0;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- tests 186/186 PASS;
- Companion package build PASS;
- RUN OK.

The rebuilt 0.1.16 package was not installed or activated.

The focused actionability gate then proved:

- `ACTIONABLE=0`;
- `ALREADY_CLOSED=2`;
- `BASELINE_UNKNOWN=10`;
- `NO_TRACK=0`;
- Mix A left/right => `SKIP_ALREADY_CLOSED`;
- Mix B-F left/right => `SKIP_BASELINE_UNKNOWN`;
- `MIX METER NO-OP SAFE` before any write permission;
- hardware writes NO.

Do not bypass this fail-closed gate.

## Stable read-only baseline matrix through Companion

The validated read-only baseline probe shows:

- Mix A left: gain KNOWN, mute KNOWN, solo KNOWN, exact YES;
- Mix A right: gain KNOWN, mute KNOWN, solo KNOWN, exact YES;
- Mix B-F left: gain KNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix B-F right: gain UNKNOWN, mute UNKNOWN, solo UNKNOWN, exact NO.

Two read-only experiments produced the same matrix:

1. navigating only among Focusrite Control Mix A-F tabs for 30 seconds;
2. disabling/re-enabling the **same existing Companion Focusrite connection**, preserving its configuration/private client identity, then rereading `ETAT INITIAL` before any UI navigation.

Therefore neither UI tab navigation nor a normal same-identity Companion reconnect recovers the missing Mix B-F Playback-strip state.

This is hardware/session-observed read-only evidence. It does NOT make Mix B-F writable.

Do not infer right-lane state from left-lane state. Do not invent mute/solo defaults. Do not write Mix B-F while exact restoration is impossible.

## Prepared isolated direct read-only research probe

The normal Companion-path experiments are exhausted. The next justified question is whether Focusrite Control Server itself publishes a different state set to a deliberately isolated direct read-only client.

Research remains separate on:

`debug/cold-start-readback`

Current prepared debug HEAD:

`da52836faeef28f596d1eeef3536e7e89928b1a0`

Compared with the prior debug checkpoint `c35f67ea5a42eb120547563fb2e787af21a86db2`, only four files are added:

- `tools/mix-presence-probe-lib.js`;
- `tools/readonly-mix-presence-probe.js`;
- `test/mix-presence-probe.test.js`;
- `RUN_READONLY_MIX_PRESENCE.cmd`.

No production `src/` file was modified on the debug branch for this research step.

The new probe reuses the historical readback-probe safety layer:

- dynamic UDP Control Server discovery;
- dynamic device ID from device-arrival;
- outgoing TCP allowlist limited to `client-details`, `device-subscribe`, `keep-alive`;
- every outgoing XML frame passes `assertAllowedTcpXml()`;
- hardware `<set>` is forbidden;
- no `setValue()` path;
- no raw USB;
- no raw XML logging;
- no baseline values or raw item IDs in the sanitized report.

The new direct probe additionally:

- stores one private persistent research client key only under ignored local `probe-results/`, preventing a fresh Remote Device identity on every rerun;
- matches approval only to its own server-assigned client ID;
- refuses to subscribe unless the dedicated research client is approved;
- detects the existing Playback slot dynamically from server-confirmed mixer-slot state;
- reports only `ARRIVAL`, `SET` or `MISSING` for gain/mute/solo presence across the 12 lanes;
- reports no gain/mute/solo values;
- stores a sanitized local JSON result under ignored `probe-results/`.

This debug HEAD has **not yet passed the user's local Windows software gate**. Do not run the direct probe before that gate is green.

## Exact next action - software gate on debug branch

From the normal repository checkout, run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[4] DEBUG - debug/cold-start-readback
```

Expected synchronized debug HEAD:

`da52836faeef...`

Require the complete branch gate to pass:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- all reported tests PASS / fail 0;
- package build PASS;
- RUN OK.

The debug branch package version is historical and may build a 0.1.12 `.tgz`. **Do not import/install/activate that debug package in Companion.** Keep Companion running the exact audited 0.1.16 package.

If any software step fails, do not run the direct probe. Diagnose the complete failure first.

## Direct probe operator flow after a green debug gate

This is research-only and intentionally leaves the normal Companion control path temporarily.

1. Keep Focusrite Control open.
2. In Companion, **disable the existing Focusrite connection** temporarily. Do not delete/recreate it and do not edit its configuration.
3. Open **Focusrite Control → Device Settings → Remote Devices** and keep that panel visible.
4. Run:

```bat
RUN_READONLY_MIX_PRESENCE.cmd
```

5. Type `READ_ONLY_DIRECT` only after the normal Companion Focusrite connection is disabled.
6. If a dedicated **Focusrite ReadOnly Mix Probe** entry appears in Remote Devices, approve it. Its private key persists locally under ignored `probe-results/`, so future runs reuse the same research identity.
7. The probe then performs one read-only `subscribe=true` observation and prints only state-presence classes.
8. Copy the full console result, especially `DIRECT SERVER PRESENCE` and `SUMMARY`.
9. After the probe closes, re-enable the **same existing Companion Focusrite connection**. Do not recreate it.

No SAFE/FULL/write-capable TestBench campaign may run concurrently with the direct probe.

Research interpretation:

- if direct presence is the same as Companion, the server subscription itself is withholding those Mix B-F fields;
- if direct presence exposes additional fields, investigate the Companion session/bootstrap path before any new write attempt;
- either result remains research-only and does not immediately authorize Mix B-F writes.

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

Official Bitfocus repository/name remains pending maintainer decision. A broad repository/module name does not expand validated hardware support beyond Scarlett 18i20 (3rd Gen).

Stable public target remains v1.0.0 unless Bitfocus maintainers direct otherwise.

Always distinguish hardware-tested, implemented, schema-observed, research-only and unsupported.
