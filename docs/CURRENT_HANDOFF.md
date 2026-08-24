# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T13:10+02:00
Branch: testbench/meter-routing-exact-restore
Gate: SOFTWARE_GREEN_DEBUG_GATE_RECOVERY_REQUIRED_AFTER_CROSS_BRANCH_HYGIENE_FIX
Validated executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Latest Companion-path research result: same existing connection reconnected; read-only baseline matrix unchanged; hardware writes NO
Prepared direct research branch: debug/cold-start-readback @ 10ad913ca81ab9a7f2181257ff5c42e10e3fd383

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

## Debug launcher failure chain

Three different infrastructure problems were isolated before any direct probe was allowed:

1. branch replacement could change tracked updater text while `cmd.exe` still had the old call frame;
2. a temporary UPDATE copy derived `%TEMP%` as its repository path;
3. the historical debug branch and Yarn workspace left cross-branch/generated residue in the user checkout.

The latest user local status on `debug/cold-start-readback` showed:

- modified tracked `package.json`;
- untracked `.yarn/`;
- untracked `Desktop.ini`;
- untracked `testbench/`;
- untracked `yarn.lock`.

This is treated as tooling/cross-branch workspace pollution, not hardware evidence.
No Focusrite probe, package activation, write or hardware change occurred in that failed recovery attempt.

## Durable cross-branch hygiene fix

Current prepared debug HEAD:

`10ad913ca81ab9a7f2181257ff5c42e10e3fd383`

Since `325db2fc5cb06ac00f7740734c60bf35af6362cf`, only:

- `.gitignore`;
- `RUN.bat`;
- `test/mix-presence-probe.test.js`

changed. No production `src/` file and no direct-probe runtime file changed.

The fix is structural:

- debug `.gitignore` now ignores `Desktop.ini`, `yarn.lock`, `.yarn/` and `testbench/` so residue owned by Windows/Yarn/the validation branch no longer dirties the debug checkout;
- debug `RUN.bat` no longer uses the user's checkout as the Yarn/build workspace;
- it creates a detached temporary `git worktree` at exact `HEAD`;
- dependencies, Prettier, ESLint, manifest, tests and Companion package build all execute inside that temporary worktree;
- the worktree and debug package are deleted on success or failure;
- the user's main checkout is therefore not the workspace where Yarn creates `yarn.lock`, `.yarn/`, node_modules or package output;
- regression tests require worktree creation/removal and the new ignore entries;
- debug RUN remains **SOFTWARE GATE ONLY** and never auto-launches a real Focusrite probe.

This current debug HEAD has not yet passed the user's Windows software gate.

## Exact next action - one-time reversible local recovery

The user's local checkout is already `debug/cold-start-readback` but is dirty from historical tooling residue.
Do not delete `testbench/`; it can contain local validation results.
Do not use another recurring stash cycle as the normal solution.

From PowerShell at `E:\_Project\focusrite-control`:

1. preserve the current tracked `package.json` diff under the already ignored `.local-logs` directory;
2. restore only tracked `package.json` to the current debug HEAD;
3. fetch/pull the current debug branch;
4. let the new `.gitignore` hide the known untracked cross-branch/generated residue without deleting it;
5. verify `git status --short` is clean.

Expected remote debug HEAD after pull:

`10ad913ca81a...`

Then run `UPDATE_AND_RUN.bat`, choose `[1] Continuer sur debug/cold-start-readback` and require:

- `SOFTWARE GATE ONLY`;
- `GATE ISOLE` / temporary worktree;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- manifest PASS;
- all tests PASS / fail 0;
- package build PASS;
- RUN OK;
- no Focusrite probe launched automatically.

Do not run `RUN_READONLY_MIX_PRESENCE.cmd` until this gate is green.

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
