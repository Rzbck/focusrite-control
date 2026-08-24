# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T13:39+02:00
Branch: testbench/meter-routing-exact-restore
Gate: DEBUG_TARGETED_READONLY_RESEARCH_GATE_GREEN_DIRECT_PROBE_READY
Validated production executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated production software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Validated direct research branch: debug/cold-start-readback @ 7167f1df039efb200f1dceaf0667028080dacd3f

## Canonical freshness rule

Before proposing code, hardware work, branch changes or publication work:

1. fetch the current remote branch/HEAD;
2. read this handoff from the validation branch;
3. reconcile the newest user-pasted hardware/software output;
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

Validated Windows gate HEAD:

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

## Targeted research gate - GREEN on user Windows

User synchronized from `06ea5c0...` to exact debug HEAD `7167f1df039e...` with only:

- `RUN.bat`;
- `test/mix-presence-probe.test.js`

changed. No `src/` file and no direct-probe runtime file changed.

Observed targeted gate on Windows:

- exact branch/head fingerprint PASS;
- detached temporary worktree PASS;
- syntax checks for `readback-probe-lib.js`, `mix-presence-probe-lib.js`, and `readonly-mix-presence-probe.js` PASS;
- readback protocol/allowlist suite: 6/6 PASS;
- Mix presence/non-write/launcher suite: 6/6 PASS;
- total targeted tests: 12/12 PASS, fail 0;
- `READ-ONLY RESEARCH GATE OK`;
- no Focusrite probe launched;
- no Companion package built/installed;
- no hardware write/routing change.

One cosmetic launcher issue was observed before the gate body:

`'...node.exe" -p "process.versions.node' n’est pas reconnu...`

and the displayed `Node :` version was blank. This is caused by the `for /f` quoting used only to print the Node version. It did **not** block the actual Node executable: the subsequent syntax checks and both test suites executed successfully with that same `NODE_EXE`. Do not move the validated debug branch just to fix this cosmetic display before the direct probe; doing so would create a new unvalidated HEAD.

## Exact next action - direct read-only probe

The targeted research gate is green. The next step is the one-time direct read-only Control Server presence observation.

1. Keep Focusrite Control open.
2. In Companion, temporarily disable the **same existing Focusrite connection**. Do not delete/recreate it and do not edit its configuration/client identity.
3. Open **Focusrite Control → Device Settings → Remote Devices** and keep that panel visible.
4. Run `RUN_READONLY_MIX_PRESENCE.cmd` from the repository root.
5. Type `READ_ONLY_DIRECT` only after the normal Companion Focusrite connection is disabled.
6. If **Focusrite ReadOnly Mix Probe** appears in Remote Devices, approve that dedicated research client.
7. Allow the probe to make its single observation and exit.
8. Copy the full console output, especially the `DIRECT SERVER PRESENCE` block and `SUMMARY`.
9. After the probe closes, re-enable the **same existing Companion Focusrite connection**.

No SAFE/FULL/write-capable campaign may run concurrently with the direct probe.

Interpretation after the run:

- if direct presence matches the Companion pattern (Mix A complete; Mix B-F missing the same fields), the Control Server subscription itself is withholding those fields and baseline manufacture attempts stop;
- if direct presence contains additional fields, investigate the normal Companion bootstrap/session path next, but do not write Mix B-F yet;
- if approval/preflight blocks, no hardware write occurred; diagnose safely.

## Publication/privacy

Never publish serials, private hostnames, client IDs/keys, raw XML/captures/logs, user paths or private diagnostics. Preserve relevant MIT/third-party attribution. Official Bitfocus repository/name remains pending maintainer decision; validated hardware scope remains Scarlett 18i20 (3rd Gen) only.
