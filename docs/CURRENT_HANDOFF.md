# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T13:26+02:00
Branch: testbench/meter-routing-exact-restore
Gate: DEBUG_TARGETED_READONLY_RESEARCH_GATE_PENDING_USER_RUN
Validated production executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated production software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Prepared direct research branch: debug/cold-start-readback @ 7167f1df039efb200f1dceaf0667028080dacd3f

## Canonical freshness rule

Before proposing code, hardware work, branch changes or publication work:

1. fetch the current remote branch/HEAD;
2. read this handoff from the same validation branch when applicable;
3. reconcile the newest user-pasted run output;
4. prefer newer explicit hardware evidence and current code over older captures/assumptions.

Supported hardware remains exactly **Scarlett 18i20 (3rd Gen)**. Do NOT rerun FULL for the current meter issue.

## Production package / permanent safety

Keep Companion on the exact audited/live-validated 0.1.16 package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do NOT install a package rebuilt by TestBench or debug branches.

Permanent restrictions:

- Monitor gain item 1677 remains read-only;
- no input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no unsafe/unknown raw writes;
- no firmware/reset/restore/snapshot commands;
- no writes to availability UNKNOWN outputs;
- feedback/state must be server-confirmed;
- Control Server port and device ID remain dynamic.

## Meter closure / baseline state

46 meter paths: input 8/8 closed, output 4/26, mix 2/12, total 14/46, mismatch 0.

Mix A left/right are already closed. Mix B-F remain pending.

Stable read-only Companion matrix:

- Mix A L/R: gain/mute/solo KNOWN, exact YES;
- Mix B-F left: gain KNOWN, mute/solo UNKNOWN;
- Mix B-F right: gain/mute/solo UNKNOWN.

Neither 30 seconds of Focusrite Control Mix A-F tab navigation nor disabling/re-enabling the same existing Companion Focusrite connection changed this matrix. Mix B-F therefore remain non-writable because exact restoration is impossible.

## Direct read-only research probe

Research branch:

`debug/cold-start-readback`

Current prepared HEAD:

`7167f1df039efb200f1dceaf0667028080dacd3f`

Research files:

- `tools/mix-presence-probe-lib.js`;
- `tools/readonly-mix-presence-probe.js`;
- `test/mix-presence-probe.test.js`;
- `RUN_READONLY_MIX_PRESENCE.cmd`.

Probe safety properties:

- dynamic UDP Control Server discovery;
- dynamic device ID from device-arrival;
- outgoing TCP allowlist only `client-details`, `device-subscribe`, `keep-alive`;
- every outgoing frame passes `assertAllowedTcpXml()`;
- hardware `<set>` forbidden;
- no `setValue()` path;
- no raw USB;
- no raw XML/value/item-ID/private identity logging;
- private persistent research client key only under ignored local `probe-results/`;
- approval matched only to its own server-assigned client ID;
- no subscription until that dedicated research client is approved;
- Playback slot detected dynamically;
- output classes only `ARRIVAL`, `SET`, `MISSING`.

## Latest user gate result and root cause

At user checkout `06ea5c0a0777...`:

- isolated temporary worktree PASS;
- Node 22.23.2 PASS;
- Yarn dependency installation PASS;
- scoped Mix-research Prettier PASS;
- ESLint then failed with 78 errors;
- all 78 errors were rule `prettier/prettier` against legacy historical debug-branch files;
- manifest/tests/package were not reached;
- no Focusrite probe, hardware write, routing change or package activation occurred;
- the user's primary checkout was not used as the Yarn/build workspace.

Root cause: the gate strategy was wrong. A standalone dependency-free read-only Node probe was being gated by the entire historical Companion 0.1.12 module toolchain. That caused irrelevant legacy formatting failures to surface sequentially through Prettier and ESLint.

## Strategy pivot - targeted research gate only

Do not continue patching legacy module formatting/lint/package on this debug branch.

Debug `RUN.bat` now validates only what will actually be executed for the direct read-only research probe. It no longer runs Yarn, Prettier, ESLint, manifest validation or Companion package build.

Current targeted gate:

1. creates a detached temporary git worktree at exact HEAD;
2. runs Node syntax checks on:
   - `tools/readback-probe-lib.js`;
   - `tools/mix-presence-probe-lib.js`;
   - `tools/readonly-mix-presence-probe.js`;
3. runs `test/readback-probe.test.js`;
4. runs `test/mix-presence-probe.test.js`;
5. removes/prunes the temporary worktree on success or failure;
6. never launches the Focusrite probe itself;
7. never builds/installs a Companion package.

The current test additionally requires that the only reference to `readonly-mix-presence-probe.js` inside `RUN.bat` is its `node --check` syntax-check line.

Since the user's last tested `06ea5c0a0777...`, the final branch diff contains only `RUN.bat` and `test/mix-presence-probe.test.js`. No `src/` production file and no direct-probe runtime file changed.

## Exact next action

The user's local checkout is already on `debug/cold-start-readback`.

Run:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur debug/cold-start-readback
```

Expected synchronized debug HEAD:

`7167f1df039e...`

Expected gate shape only:

- `[0/3] Worktree temporaire exact HEAD...`;
- `[1/3] Syntaxe du chemin read-only...`;
- `[2/3] Tests protocole / allowlist read-only...`;
- `[3/3] Tests Mix presence / non-ecriture / launcher...`;
- `READ-ONLY RESEARCH GATE OK`.

There must be no Yarn install, Prettier, ESLint, manifest check or Companion package build in this run.

Do not run `RUN_READONLY_MIX_PRESENCE.cmd` until this targeted gate is green.

## Direct probe operator flow after green targeted gate

1. Keep Focusrite Control open.
2. In Companion, disable the existing Focusrite connection temporarily; do not delete/recreate/edit it.
3. Open **Focusrite Control → Device Settings → Remote Devices**.
4. Run `RUN_READONLY_MIX_PRESENCE.cmd`.
5. Type `READ_ONLY_DIRECT` only after the normal Companion Focusrite connection is disabled.
6. If **Focusrite ReadOnly Mix Probe** appears, approve that dedicated research client.
7. Copy the full console output, especially `DIRECT SERVER PRESENCE` and `SUMMARY`.
8. After the probe closes, re-enable the same existing Companion Focusrite connection.

No SAFE/FULL/write-capable campaign may run concurrently with the direct probe.

## Publication/privacy

Never publish serials, private hostnames, client IDs/keys, raw XML/captures/logs, user paths or private diagnostics. Preserve relevant MIT/third-party attribution. Official Bitfocus repository/name remains pending maintainer decision; validated hardware scope remains Scarlett 18i20 (3rd Gen) only.
