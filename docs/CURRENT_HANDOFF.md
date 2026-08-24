# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T13:25+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_GREEN_DEBUG_GATE_RERUN_REQUIRED_AFTER_SCOPED_PRETTIER_FIX
Validated executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Latest Companion-path research result: same existing connection reconnected; read-only baseline matrix unchanged; hardware writes NO
Prepared direct research branch: debug/cold-start-readback @ 420961aea47d8b1dae6c842f6467405bdf8b7557

## Canonical freshness rule

Before proposing code, hardware work, branch changes or publication work:

1. identify the active branch;
2. fetch the current remote branch state;
3. read this file from that same branch when present;
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

Keep Companion on this exact already audited/live-validated 0.1.16 package. Do NOT install a `.tgz` rebuilt by either the validation TestBench branch or the historical debug branch.

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

There are 46 meter paths: 8 input, 26 output, 12 mix-lane.

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

The focused actionability gate proved:

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

- Mix A left/right: gain KNOWN, mute KNOWN, solo KNOWN, exact YES;
- Mix B-F left: gain KNOWN, mute UNKNOWN, solo UNKNOWN, exact NO;
- Mix B-F right: gain UNKNOWN, mute UNKNOWN, solo UNKNOWN, exact NO.

Two read-only experiments produced the same matrix:

1. navigating only among Focusrite Control Mix A-F tabs for 30 seconds;
2. disabling/re-enabling the same existing Companion Focusrite connection, preserving its configuration/private client identity, then rereading `ETAT INITIAL` before any UI navigation.

Therefore neither UI tab navigation nor a normal same-identity Companion reconnect recovers the missing Mix B-F Playback-strip state.

This is hardware/session-observed read-only evidence. It does NOT make Mix B-F writable.
Do not infer right-lane state from left-lane state. Do not invent mute/solo defaults.

## Prepared isolated direct read-only research probe

Research remains separate on `debug/cold-start-readback`.

The direct presence probe remains research-only:

- `tools/mix-presence-probe-lib.js`;
- `tools/readonly-mix-presence-probe.js`;
- `test/mix-presence-probe.test.js`;
- `RUN_READONLY_MIX_PRESENCE.cmd`.

Safety properties remain:

- dynamic UDP Control Server discovery;
- dynamic device ID from device-arrival;
- outgoing TCP allowlist limited to `client-details`, `device-subscribe`, `keep-alive`;
- every outgoing XML frame passes `assertAllowedTcpXml()`;
- hardware `<set>` forbidden;
- no `setValue()` path;
- no raw USB;
- no raw XML logging;
- no baseline values or raw item IDs in the sanitized report;
- one private persistent research client key only under ignored local `probe-results/`;
- approval matched only to its own server-assigned client ID;
- no subscription until the dedicated research client is approved;
- Playback slot detected dynamically;
- result classes only `ARRIVAL`, `SET`, `MISSING`.

## Debug launcher failure chain and durable fixes

Several infrastructure problems were isolated before any direct probe was allowed:

1. branch replacement could change tracked updater text while `cmd.exe` still had the old call frame;
2. a temporary UPDATE copy derived `%TEMP%` as its repository path;
3. the historical debug branch and Yarn workspace left cross-branch/generated residue in the user checkout;
4. after worktree isolation was fixed, the debug gate still ran `prettier --check .` across the entire historical branch, causing a style-only failure on 20 legacy files under the current Prettier 3.9.6.

No direct probe, Focusrite write, routing change or hardware change occurred in any of these failed gate attempts.

### Cross-branch/workspace isolation fix

Debug RUN now:

- is **SOFTWARE GATE ONLY**;
- creates a detached temporary `git worktree` at exact HEAD;
- runs Yarn install, formatting gate, ESLint, manifest, full tests and package build inside that worktree;
- removes/prunes the worktree on success or failure;
- never uses the user's main checkout as the Yarn/build workspace;
- leaves no debug package in the user's main checkout;
- ignores known local residue `Desktop.ini`, `yarn.lock`, `.yarn/`, `testbench/` on the historical debug branch.

### Latest user gate result - 2026-08-24 around 13:19 +02:00

User synchronized to exact debug HEAD `10ad913ca81a...` and ran the isolated software gate.

Observed:

- branch/head fingerprint PASS;
- `SOFTWARE GATE ONLY` PASS;
- `GATE ISOLE` / temporary worktree PASS;
- Node 22.23.2 / Yarn 4.17.0 PASS;
- dependency install PASS with only the expected disabled-build-script warning;
- checkout isolation held;
- Prettier then failed on 20 files because the historical branch as a whole is not formatted according to current Prettier 3.9.6;
- ESLint/manifest/tests/package were not reached;
- no Focusrite probe or hardware operation occurred.

This is a gate-design issue, not a functional code or hardware failure.

### Scoped Prettier fix

Current prepared debug HEAD:

`420961aea47d8b1dae6c842f6467405bdf8b7557`

Since the user's tested `10ad913ca81a...`, only:

- `RUN.bat`;
- `test/mix-presence-probe.test.js`;
- `tools/readonly-mix-presence-probe.js`

changed. No production `src/` file changed.

The new rule is intentional:

- do not retroactively require the entire historical debug branch to match current Prettier;
- Prettier gates only the current Mix-research JS delta:
  - `tools/mix-presence-probe-lib.js`;
  - `tools/readonly-mix-presence-probe.js`;
  - `test/mix-presence-probe.test.js`;
- ESLint, manifest validation, full tests and package build remain repository-wide;
- a regression test forbids returning to global `yarn check-format` / `prettier --check .` on this historical debug branch.

The user's Prettier diagnostic showed the expected formatted blob for `tools/readonly-mix-presence-probe.js` as `0b8103f...`; the committed corrected file now has blob `0b8103fe87715235a7a8753c6e4f6f048f9c6bd4`, matching that expected output exactly.

This current debug HEAD has **not yet passed the user's Windows software gate**.

## Exact next action

The user's local checkout is already `debug/cold-start-readback` and the prior gate did not alter the main checkout.

Run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur debug/cold-start-readback
```

Expected synchronized debug HEAD:

`420961aea47d...`

Require:

- `SOFTWARE GATE ONLY`;
- `GATE ISOLE` / temporary worktree;
- dependencies PASS;
- `Format (research delta only)` PASS;
- ESLint PASS;
- manifest PASS;
- all tests PASS / fail 0;
- package build PASS;
- RUN OK;
- no Focusrite probe launched automatically.

Do not run `RUN_READONLY_MIX_PRESENCE.cmd` until this gate is green.

## Direct probe operator flow only after a green debug gate

1. Keep Focusrite Control open.
2. In Companion, disable the existing Focusrite connection temporarily. Do not delete/recreate it and do not edit its configuration.
3. Open **Focusrite Control → Device Settings → Remote Devices** and keep that panel visible.
4. Run `RUN_READONLY_MIX_PRESENCE.cmd`.
5. Type `READ_ONLY_DIRECT` only after the normal Companion Focusrite connection is disabled.
6. If **Focusrite ReadOnly Mix Probe** appears, approve that dedicated research client.
7. Copy the full console result, especially `DIRECT SERVER PRESENCE` and `SUMMARY`.
8. After the probe closes, re-enable the same existing Companion Focusrite connection.

No SAFE/FULL/write-capable TestBench campaign may run concurrently with the direct probe.

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
