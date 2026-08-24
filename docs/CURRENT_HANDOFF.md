# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T13:49+02:00
Branch: testbench/meter-routing-exact-restore
Gate: DEBUG_READONLY_SUBSCRIBE_FIX_PENDING_USER_TARGETED_GATE
Validated production executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated production software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Previously validated direct research gate: debug/cold-start-readback @ 7167f1df039efb200f1dceaf0667028080dacd3f
Prepared corrected direct research branch: debug/cold-start-readback @ 9bf133f72c29ecdae2b54c88afb99c8ecd6ee12a

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
- Control Server port and device ID remain dynamic;
- writes require this module's own server-assigned client ID to be authorised;
- read-only device subscription does **not** require Remote Devices approval.

## Meter closure / baseline state

46 meter paths: input 8/8 closed, output 4/26, mix 2/12, total 14/46, mismatch 0.

Mix A left/right are already closed. Mix B-F remain pending.

Stable read-only Companion matrix:

- Mix A L/R: gain/mute/solo KNOWN, exact YES;
- Mix B-F left: gain KNOWN, mute/solo UNKNOWN;
- Mix B-F right: gain/mute/solo UNKNOWN.

Neither 30 seconds of Focusrite Control Mix A-F tab navigation nor disabling/re-enabling the same existing Companion Focusrite connection changed this matrix. Mix B-F remain non-writable because exact restoration is impossible.

## Targeted research gate history

Exact user-validated Windows gate HEAD:

`7167f1df039efb200f1dceaf0667028080dacd3f`

Observed:

- detached temporary worktree PASS;
- syntax checks for `readback-probe-lib.js`, `mix-presence-probe-lib.js`, and `readonly-mix-presence-probe.js` PASS;
- readback protocol/allowlist suite 6/6 PASS;
- Mix presence/non-write/launcher suite 6/6 PASS;
- total targeted tests 12/12 PASS, fail 0;
- `READ-ONLY RESEARCH GATE OK`;
- no Focusrite probe launched by RUN;
- no Companion package built/installed;
- no hardware write/routing change.

The old cosmetic `Node :` display quoting failure has now been removed on the prepared corrected branch; the gate simply prints `Node 22.20+ detecte.` after the real version check.

## Direct probe attempts on 7167f1d - authorization/preflight blocked

The user then ran `RUN_READONLY_MIX_PRESENCE.cmd` twice with the normal Companion Focusrite connection disabled.

Both runs observed exactly:

- Focusrite Control Server discovery PASS;
- exact model `Scarlett 18i20 (3rd Gen)` PASS;
- probe waited for dedicated research-client approval;
- approval was not confirmed within 20 seconds;
- **no `device-subscribe` was sent**;
- no Mix presence observation occurred;
- no hardware `<set>`/write was possible or sent;
- launcher exited code 1 and told the user to re-enable the same Companion connection.

Classification: **AUTHORIZATION/PREFLIGHT BLOCKED on the probe's self-imposed read gate; no hardware write, no device subscription.**

Do not repeat the same approval-waiting probe again.

## Root cause - probe was stricter than the real protocol path

The approval prerequisite for read-only subscription was incorrect.

Current production `src/focusrite-client.js` sends one `device-subscribe subscribe="true"` after exact device arrival regardless of Remote Devices authorization. Authorization is checked only by `setValue()` before a hardware `<set>` write.

Historical `tools/readonly-state-probe.js` also sent `device-subscribe` without waiting for approval, while its transmit allowlist still structurally forbade `<set>`.

Therefore the correct policy is:

- **writes:** require own-ID Remote Devices authorization;
- **read-only subscription:** no approval prerequisite;
- direct research probe remains safe because its transmit allowlist contains only `client-details`, `device-subscribe`, `keep-alive`, and `assertAllowedTcpXml()` rejects `<set>`.

## Prepared corrected direct read-only probe

Current prepared debug HEAD:

`9bf133f72c29ecdae2b54c88afb99c8ecd6ee12a`

Changes since the last user-validated 7167f1d gate are limited to research/gate files:

- `tools/readonly-mix-presence-probe.js`;
- `RUN_READONLY_MIX_PRESENCE.cmd`;
- `test/mix-presence-probe.test.js`;
- `RUN.bat` cosmetic Node-version display only.

No production `src/` file changed. No Companion package is built or installed.

Corrected probe behavior:

1. dynamic server discovery;
2. exact 18i20 (3rd Gen) model gate;
3. persistent private research client key;
4. one `device-subscribe subscribe="true"` immediately after exact device arrival;
5. no Remote Devices approval wait for reads;
6. 10-second read-only observation;
7. Playback slot detected dynamically;
8. sanitized `ARRIVAL` / `SET` / `MISSING` result only;
9. no raw values/item IDs/device ID/serial/hostname/endpoint/client identity/raw XML in the report.

Safety remains structural:

- outgoing roots only `client-details`, `device-subscribe`, `keep-alive`;
- every outgoing frame passes `assertAllowedTcpXml()`;
- `<set>` forbidden;
- no `setValue()` path;
- no raw USB.

Regression test now fails if `waitForApproval` or the old approval-gated subscription messages return, verifies `session.subscribe()` happens before the observation, and verifies the launcher no longer tells the user to approve the read-only client.

## Exact next action

Because the direct probe runtime changed after the green 7167f1d gate, run the short targeted gate once on the corrected HEAD before hardware research:

```bat
UPDATE_AND_RUN.bat
```

Choose:

```text
[1] Continuer sur debug/cold-start-readback
```

Expected HEAD:

`9bf133f72c29...`

Require:

- `Node 22.20+ detecte.`;
- `[0/3] Worktree temporaire exact HEAD...`;
- `[1/3] Syntaxe du chemin read-only...`;
- readback tests 6/6 PASS;
- Mix tests 6/6 PASS;
- `READ-ONLY RESEARCH GATE OK`.

If that gate is green:

1. keep Focusrite Control open;
2. temporarily disable the **same existing Companion Focusrite connection**;
3. do not delete/recreate/edit it;
4. run `RUN_READONLY_MIX_PRESENCE.cmd`;
5. type `READ_ONLY_DIRECT`;
6. **do not approve or change anything in Remote Devices for this read-only run**;
7. allow the single 10-second observation to complete;
8. capture `DIRECT SERVER PRESENCE` and `SUMMARY`;
9. re-enable the same Companion Focusrite connection afterward.

No SAFE/FULL/write-capable campaign may run concurrently with the direct probe.

Interpretation:

- if direct presence matches Companion's missing-field pattern, treat that as evidence that normal Control Server subscription withholds those fields and stop manufacturing baselines;
- if direct presence contains additional Mix B-F fields, investigate Companion bootstrap/session behavior next but do not write Mix B-F yet;
- any direct-probe failure remains research-only and must not alter production 0.1.16.

## Publication/privacy

Never publish serials, private hostnames, client IDs/keys, raw XML/captures/logs, user paths or private diagnostics. Preserve relevant MIT/third-party attribution. Official Bitfocus repository/name remains pending maintainer decision; validated hardware scope remains Scarlett 18i20 (3rd Gen) only.
