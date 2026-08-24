# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T13:56+02:00
Branch: testbench/meter-routing-exact-restore
Gate: DIRECT_READONLY_MIX_PRESENCE_COMPLETE_SERVER_WITHHOLDS_B_TO_F_BASELINES
Validated production executable checkout: 3e35ac16812f3187fa23bad3542393be638f566b
Validated production software gate: dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, tests 186/186 PASS, Companion package build PASS, RUN OK
Validated direct research branch: debug/cold-start-readback @ 9bf133f72c29ecdae2b54c88afb99c8ecd6ee12a

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
- read-only device subscription does not require Remote Devices approval.

The existing normal Companion client `Companion Scarlett 18i20` remains the canonical approved write-capable client. Do not delete/recreate it or rotate its private client identity.

## Meter closure / baseline state

46 meter paths: input 8/8 closed, output 4/26, mix 2/12, total 14/46, mismatch 0.

Mix A left/right are already closed from prior exact-restore hardware evidence. Mix B-F remain non-actionable because exact baseline restoration is unavailable.

Stable read-only Companion matrix before the direct probe:

- Mix A L/R: gain/mute/solo KNOWN, exact YES;
- Mix B-F left: gain KNOWN, mute/solo UNKNOWN;
- Mix B-F right: gain/mute/solo UNKNOWN.

Neither 30 seconds of Focusrite Control Mix A-F tab navigation nor disabling/re-enabling the same existing Companion Focusrite connection changed this matrix.

The read-only actionability proof remains:

- ACTIONABLE=0;
- ALREADY_CLOSED=2;
- BASELINE_UNKNOWN=10;
- Mix A L/R => SKIP_ALREADY_CLOSED;
- Mix B-F L/R => SKIP_BASELINE_UNKNOWN;
- no hardware write is attempted when exact restoration is unavailable.

## Direct read-only Mix presence research - COMPLETE

Research branch:

`debug/cold-start-readback`

Exact completed hardware run HEAD:

`9bf133f72c29ecdae2b54c88afb99c8ecd6ee12a`

The direct probe was intentionally isolated from Companion and used only:

- dynamic Focusrite Control Server discovery;
- dynamic device ID from exact device-arrival;
- `client-details`;
- one `device-subscribe subscribe="true"`;
- `keep-alive`.

Hardware `<set>` was structurally forbidden by the transmit allowlist. No raw USB, raw XML, private identity, item IDs, baseline values, serial, hostname or endpoint were logged.

Observed hardware/session result:

- Control Server discovery PASS;
- exact model `Scarlett 18i20 (3rd Gen)` PASS;
- one read-only device subscription PASS;
- Playback source detected dynamically as slot 3 / Playback 1 / stereo in this session; slot 3 must never be hardcoded;
- observation window 10 seconds;
- hardware writes NO.

Direct server presence matrix:

- Mix A left: gain SET, mute MISSING, solo MISSING, exact NO;
- Mix A right: gain MISSING, mute MISSING, solo MISSING, exact NO;
- Mix B left: gain SET, mute MISSING, solo MISSING, exact NO;
- Mix B right: gain MISSING, mute MISSING, solo MISSING, exact NO;
- Mix C left: gain SET, mute MISSING, solo MISSING, exact NO;
- Mix C right: gain MISSING, mute MISSING, solo MISSING, exact NO;
- Mix D left: gain SET, mute MISSING, solo MISSING, exact NO;
- Mix D right: gain MISSING, mute MISSING, solo MISSING, exact NO;
- Mix E left: gain SET, mute MISSING, solo MISSING, exact NO;
- Mix E right: gain MISSING, mute MISSING, solo MISSING, exact NO;
- Mix F left: gain SET, mute MISSING, solo MISSING, exact NO;
- Mix F right: gain MISSING, mute MISSING, solo MISSING, exact NO.

Summary:

`exact-presence=0/12; missing-any=12`

Sanitized local result was written under ignored `probe-results/`; do not publish private/local raw artifacts.

## Interpretation / decision

This direct hardware evidence answers the open bootstrap question.

For Mix B-F, the fresh direct Control Server subscription reproduces the same missing-field pattern already seen through Companion:

- left gain is present;
- left mute/solo are absent;
- right gain/mute/solo are absent.

Therefore the missing Mix B-F baseline fields are **not shown to be a Companion bootstrap bug**. A fresh direct subscription also does not supply them.

The direct session was even sparser for Mix A than the existing Companion state. Do not use that to invalidate the earlier closed Mix A hardware evidence; it only shows that fresh subscription presence is not a complete state snapshot.

Decision:

- stop attempts to manufacture or guess Mix B-F baselines;
- do not infer right-lane state from left-lane state;
- do not assume mute/solo defaults;
- do not write Mix B-F merely to close meter evidence because exact restore cannot be guaranteed;
- retain Mix A L/R as already closed from earlier exact-baseline hardware tests;
- retain Mix B-F as baseline-unknown / safely non-actionable;
- no further direct subscription/reconnect/tab-navigation guessing is justified for this question;
- do not rerun FULL.

This is **hardware-tested read-only research evidence**, not a new production capability and not a reason to modify the exact audited 0.1.16 package.

## Authorization history clarification

Two earlier direct-probe attempts on HEAD 7167f1d stopped before subscription because the probe incorrectly required a dedicated read-only Remote Devices approval. No device subscription or hardware write occurred in those attempts.

The project then reconciled this with current production code and historical read-only probe behavior:

- writes require own-ID Remote Devices authorization;
- read-only `device-subscribe` does not.

The corrected probe at 9bf133f removed that unnecessary read gate while retaining structural `<set>` prohibition.

## Immediate operator state after completed probe

After the completed direct run:

1. re-enable the same existing Focusrite Companion connection if it is still disabled;
2. do not delete/recreate/edit it;
3. leave the existing Remote Devices approval intact;
4. no further hardware test is required for the Mix B-F baseline-source question.

## Publication/privacy

Never publish serials, private hostnames, client IDs/keys, raw XML/captures/logs, user paths or private diagnostics. Preserve relevant MIT/third-party attribution. Do not claim all protocol knowledge was independently discovered.

Official Bitfocus repository/name remains pending maintainer decision. A broader repository name does not expand validated hardware support beyond Scarlett 18i20 (3rd Gen). Stable public target remains v1.0.0 unless Bitfocus maintainers direct otherwise.

Always distinguish hardware-tested, implemented, schema-observed, research-only and unsupported.
