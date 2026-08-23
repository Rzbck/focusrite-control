# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 — **Scarlett 18i20 (3rd Gen) V8 FULL-from-zero remains the canonical hardware evidence on exact package 0.1.15. Post-FULL safety hardening 0.1.16 has now passed the canonical Windows gate (152/152), exact archive audit, live Companion startup on the existing connection, and the read-only authorization preflight. Do not rerun FULL for this restrictive change.**

Read `AI_PROJECT_RULES.md`, `docs/REMOTE_DEVICES_AUTHORIZATION.md`, and this file before proposing code, tests, hardware work, branch changes or publication changes. New explicit hardware evidence and current checked-in code override older assumptions.

## Immediate checkpoint

- Repository: `Rzbck/focusrite-control`.
- Active branch: `testbench/v0.2-hardware-validation`.
- Official Bitfocus repository/name: still pending maintainer decision.
- Validated public hardware scope: **Scarlett 18i20 (3rd Gen) only**.
- Canonical TestBench revision: `full-v8-generic-evidence-profile-20260823`.
- Canonical completed hardware package: **0.1.15**, exact archive SHA-256 `1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`.
- Current post-FULL candidate: **0.1.16**.
- Canonical Windows gate for 0.1.16: immutable dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, **152/152 Node tests PASS**, Companion package build PASS.
- Exact audited 0.1.16 archive: `focusrite-scarlett-18i20-0.1.16.tgz`.
- Exact 0.1.16 SHA-256: `d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`.
- 0.1.16 live startup/read-only validation: **PASS** on the existing Companion connection; dynamic Control Server discovery, exact model detection, server-confirmed state subscription, own-client Remote Devices authorization and read-only preflight all passed.
- 0.1.16 adds no new write capability; it only blocks additional output writes when server-confirmed availability is false/unknown and improves attribution/docs/tests.
- The completed V8 hardware evidence still belongs to exact package 0.1.15. Do **not** relabel the 0.1.16 archive as the package that ran FULL.
- Do **not** rerun FULL merely to prove that newly blocked writes remain blocked.

## Canonical V8 FULL hardware result

Published sanitized report:

`docs/hardware-results/LATEST_SHAREABLE.json`

Identity:

- generated `2026-08-23T18:53:59.160Z`;
- `meta.completed=true`;
- `meta.hardwareWrites=true`;
- revision `full-v8-generic-evidence-profile-20260823`;
- signature `fb915f311956ac65`;
- model `Scarlett 18i20 (3rd Gen)`;
- physical isolation confirmed;
- diagnostic resume phase `null`.

Coverage:

- inventory rows **1436 / 1436 classified**;
- snapshot variables **1340 / 1340 mapped**;
- Core variables **21 / 21 mapped**;
- feedback probes/definitions **829 / 31**;
- unclassified rows **0**;
- evidence audit complete.

Final capability summary:

- PASS 198;
- PASS_BASELINE 22;
- PASS_MANUAL 1;
- EVAL_ONLY 1154;
- SKIP_NO_CAPABILITY 16;
- SKIP_AVAILABILITY_UNKNOWN 22;
- BLOCKED_BY_SAFETY 11;
- MANUAL_PENDING 5;
- BLOCKED_FORBIDDEN 3;
- UNSUPPORTED 4;
- **no FAIL, FAIL_MISMATCH, FAIL_NO_EFFECT or QUARANTINED_RESTORE in the completed V8 summary**.

Feedback evidence:

- before: 829 total / 188 PASS / 641 EVAL_ONLY / 0 FAIL;
- after: 829 total / 190 PASS / 639 EVAL_ONLY / 0 FAIL;
- dynamic tracked: 742;
- both states observed: 20;
- single state observed: 12;
- dynamic mismatches/failures: 0.

The manual phase observed physical Monitor gain readback successfully. Device Preset, Clock Source, Sample Rate and S/PDIF Mode remain disruptive/manual-excluded from automatic FULL functional writes. Targeted meter validation requires real signal only when explicitly guided.

V8 supersedes V6 as canonical hardware evidence. V6 is historical only.

## Exact 0.1.15 hardware-tested package

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

Audited facts:

- six expected archive entries only;
- package/manifest 0.1.15;
- runtime API 2.0.0;
- exact product scope Scarlett 18i20 (3rd Gen);
- no hardcoded Control Server TCP fallback;
- dynamic server discovery/device ID;
- own-client Remote Devices authorization required before writes;
- server-confirmed/non-optimistic state;
- Monitor 1677 read-only;
- Monitor Output 1–2 direct Gain withheld;
- Mixer Slot Source/Stereo and per-lane Mix Talkback writes withheld;
- Advanced Raw behind the same hardware policy;
- privacy scan clean.

Live Companion startup on the existing authorised connection passed for this exact 0.1.15 package.

## Exact 0.1.16 software/package-audited candidate

Archive:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Software gate:

- Node 22.23.2 / Yarn 4.17.0;
- immutable dependency install PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest validation PASS;
- **152 / 152 tests PASS**;
- Companion package build PASS.

Exact archive audit:

- gzip/tar parses cleanly;
- exactly six expected entries: root directory, `companion/`, `main.js`, `package.json`, `companion/manifest.json`, `companion/HELP.md`;
- no symlink, hardlink, absolute path or `..` traversal entry;
- bundled `main.js` syntax PASS under `node --check`;
- package and manifest version exactly 0.1.16;
- runtime API 2.0.0;
- manifest product exactly `Scarlett 18i20 (3rd Gen)`;
- no hardcoded TCP fallback `49152` and no `DEFAULT_PORT` token;
- proven discovery ports 30096/30097/30098 and proven discovery XML remain compiled in;
- Manual mode still requires an explicit TCP port;
- write path remains blocked until this module's own server-assigned client is authorised;
- approval for another client ID is ignored;
- state changes remain driven by device-arrival / server `<set>` messages, not optimistic local write success;
- compiled output availability guard allows explicit `true/1`, blocks false/blank/unknown, and preserves the separately tested no-availability-item case;
- compiled hardware policy preserves direct Mute mismatch outputs 2/4/6/8/10, right-member Source ownership, no-effect Stereo/Nickname/Gain sets, and Monitor Output 1/2 Gain withholding;
- Mixer Slot Source/Stereo and per-lane Mix Talkback write actions are removed by the production definition policy while feedback/readback remains;
- Advanced Raw is re-filtered through the same production hardware/availability policy and re-checks on callback;
- no Monitor gain Set/Adjust action, fake input Gain, input hardware Mute, Mic Kill, firmware-reset action or snapshot action is present in the compiled public surface;
- packaged HELP carries the complete Bitfocus MIT notice;
- privacy scan found no real device serial, private hostname, private IPv4, user Windows path, private UUID/client ID, MAC address or private user-specific string.

### 0.1.16 live startup / read-only validation

The exact audited 0.1.16 package was imported and the **existing** Companion Focusrite connection was switched to Module Version 0.1.16 without recreating the connection.

Observed live startup facts:

- Companion launched the module from the 0.1.16 package;
- Focusrite Control Server discovery used the dynamic UDP/TCP discovery path; no hardcoded TCP fallback was involved;
- exact model `Scarlett 18i20 (3rd Gen)` was detected with 8 analogue inputs, 26 outputs and 12 mix lanes;
- state subscription became active with hundreds of server-confirmed values observed;
- existing own-client Remote Devices authorization was confirmed;
- no Focusrite hardware write was required for this validation.

Read-only preflight result:

- Companion local web service PASS;
- Companion HTTP API PASS;
- existing Focusrite module connection PASS;
- exact hardware model PASS;
- Focusrite client authorization PASS;
- module status `Connected / authorised` PASS;
- final result **PREFLIGHT PASS**;
- no hardware setting changed.

During the version-switch restart Companion emitted one transient stale child/callback cancellation warning followed by one feedback-update timeout. There was no second process-stop line, no repeating error loop and the subsequent read-only preflight passed. Treat this as a **non-blocking Companion restart/teardown artifact unless it reproduces during normal steady-state operation**; do not classify it as a Focusrite hardware/control failure from this evidence alone.

0.1.16 is therefore **software-gated, package-audited and live-startup/read-only validated**. The write-capable V8 hardware evidence remains attached to exact package 0.1.15.

## Post-FULL release audit — 0.1.16 safety hardening

The final action/feedback/preset audit against V8 found one real release gap:

- TestBench correctly classified Outputs 21–24 as `AVAILABILITY_UNKNOWN` and performed no writes;
- production direct-output policy previously filtered by model/hardware evidence but did not also consult the live server-confirmed `available` value;
- the dedicated `output_pair_source` action also lacked a production availability guard;
- output-mute presets and Advanced Raw inherited the same omission.

This was not a V8 hardware-campaign failure. It was a production fail-closed parity issue discovered by comparing the completed report with the public action surface.

### 0.1.16 behavior

`src/hardware-policy.js` provides one output availability rule:

- no `available` descriptor in the schema => preserve the separately tested V3 no-flag case and allow the hardware-evidence policy to decide;
- explicit availability descriptor with server-confirmed `true`/`1` => eligible for the remaining policy checks;
- explicit descriptor with `false`, blank, missing/unknown state, or no value reader => **no write**.

The rule applies to:

- direct output Mute/Gain/Source/Stereo/Nickname;
- output Gain Adjust through the same direct Gain policy;
- dedicated stereo-pair Source action, requiring both members available;
- output-mute presets;
- Advanced Raw output items.

`src/definition-policy.js` filters choices using current server state and also re-checks the rule inside callbacks. Therefore a stale visible action still fails closed if availability changes after definitions were built.

No Focusrite hardware write was used to implement this change.

## Final action/feedback/preset audit status

- V8 `WRITE_BEHAVIOR_MISMATCH` direct Mute rows are Outputs 2/4/6/8/10; production withholds them.
- V8 `PAIR_OWNED_ALIAS` direct Source rows are right members; production direct Source withholds them while the separately validated pair Source action remains distinct.
- known direct Stereo/Nickname/Gain `NO_EFFECT_CONFIRMED` targets are withheld by control-specific policy.
- Monitor Output 1/2 Gain is `WITHHELD_BY_PROFILE`, not falsely labelled no-effect, and remains absent from direct Set/Adjust and Advanced Raw.
- Mixer Slot Source/Stereo write families are removed from production actions but readback/feedback remains.
- per-lane Mix Talkback write family is removed but readback/feedback remains; global Monitor Talkback is separate and valid.
- Outputs 21–24 `AVAILABILITY_UNKNOWN` are fail-closed in production as well as TestBench.
- feedback callbacks read server-confirmed state; unknown values do not receive optimistic success.
- Monitor gain item 1677 has no write action/preset/raw path.
- unsupported Input Preamp Gain, direct Input Hardware Mute, per-channel Phantom and Mic Kill remain absent.
- firmware/reset/restore/snapshot writes remain absent.
- Device Preset, Clock Source, Sample Rate and S/PDIF Mode remain implemented/schema-observed and explicitly documented as disruptive/manual-excluded from automatic FULL functional validation; do not call them hardware-tested merely because feedback/schema exists.

## Attribution / distribution audit

Upstream Bitfocus module/core behavior informed portions of this implementation/TestBench. The project does not claim all protocol knowledge was independently discovered.

`THIRD_PARTY_NOTICES.md` preserves the full upstream Bitfocus MIT notice, including:

`Copyright (c) 2022 Bitfocus AS - Open Source`

The same complete notice is also carried in packaged `companion/HELP.md`, so it remains with distributed Companion archives.

Top-level project license remains MIT.

## Permanent safety / protocol rules

Never invent or re-add:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level control;
- Monitor gain item 1677 writes or Monitor +/- presets;
- unknown/unsafe arbitrary raw writes;
- firmware/reset/restore/snapshot commands;
- writes to read-only meter/status items.

Transport/session:

- Control Server TCP port is dynamic; never hardcode it;
- Auto discovery fails closed if discovery fails;
- Manual mode uses only an explicitly supplied TCP port;
- device ID is dynamic;
- reuse the existing Companion connection/client identity;
- only approval for this module's own server-assigned client ID counts;
- block writes until authorised;
- feedback/state remains server-confirmed;
- explicit output availability UNKNOWN receives no write in 0.1.16.

Unknown/unvalidated Focusrite models remain discoverable only where appropriate and fail closed for writes. Never inherit the 18i20 evidence profile into a future model without real hardware validation.

## Current production hardware evidence restrictions

For Scarlett 18i20 (3rd Gen):

- direct Mute withheld on Out 2/4/6/8/10;
- direct Source withheld on proven pair-owned right members;
- direct Stereo withheld on the specific no-effect members;
- right-member Nickname withheld where no-effect was demonstrated;
- Line Out 4/6/8/10 direct Gain remains no-effect/withheld;
- Monitor Out 1/2 direct Gain remains withheld for unresolved independent restoration semantics;
- Mixer Slot Source/Stereo writes withheld;
- per-lane Mix Talkback writes withheld;
- global Monitor Talkback retained;
- global Monitor gain 1677 read-only;
- Advanced Raw cannot bypass any of the above;
- 0.1.16 additionally blocks output writes with explicit false/unknown availability.

## Remote Devices authorization — mandatory before any write

Before any future write-capable hardware campaign:

1. **reuse the existing Companion Focusrite connection**; do not delete/recreate it merely to change a module version;
2. in **Focusrite Control → Device Settings → Remote Devices**, confirm that **Companion Scarlett 18i20** is approved when approval is required;
3. run the read-only preflight and require exact supported model, dynamic discovery and authorization for this module's own server-assigned client ID;
4. if approval is missing, treat the result as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no write-capable test.

Missing authorization is a preflight/auth block, not a hardware failure. Preserve the private stable client identity and follow `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

## TestBench / hardware discipline

Canonical path:

`TestBench → Companion local API/buttons → existing approved Companion connection → Focusrite Control Server → Scarlett`

Never run direct protocol research probes concurrently with SAFE/FULL/RESUME.

During automatic hardware phases: no video/music/DAW playback; keep downstream outputs physically safe. Intentional audio is only for explicit guided SILENT/SIGNAL phases.

`PAGE2_AUTO` is live-tested and may replace only private Page 2 after explicit confirmation, preserving Page 1 and the existing Focusrite connection/client identity.

RESUME is diagnostic and never completed/publishable evidence. V8 FULL is already complete; do not rerun it for 0.1.16 availability hardening.

## Canonical next sequence

The 0.1.16 validation chain is complete for its intended restrictive change. Do **not** rerun the software gate, SAFE, FULL or RESUME merely because this handoff was updated.

1. Keep the existing Companion connection on the exact audited 0.1.16 package unless a new regression appears.
2. No additional hardware-write campaign is planned for the 0.1.16 availability hardening.
3. If the transient Companion child/callback warning reproduces during normal steady-state operation, investigate it separately before public release; a one-time version-switch teardown warning is not currently a blocker.
4. Continue final public-source cleanliness/release preparation while waiting for Bitfocus's official repository/naming decision.
5. When the official Bitfocus repository exists, inspect its exact repository name, default branch, seed files and permissions before changing scope or publishing anything.

## Publication state

- Personal repository only; no GitHub Actions here.
- Root `UPDATE_AND_RUN.bat` is the canonical local gate.
- Sanitized V8 FULL result is published on the validation branch.
- Official Bitfocus repository/name remains pending.
- Bryce Seifert suggested `focusrite-control` because transport is Focusrite Control Server and offered future hardware testing.
- Project response remains conservative: only Scarlett 18i20 (3rd Gen) is validated; use Bitfocus-preferred naming without claiming untested devices.
- Stable public release target remains **v1.0.0** unless Bitfocus maintainers direct otherwise.
- When the official repo exists: inspect repo/default branch/seed/permissions, compare against cleaned RC, use expected PR/CI flow, run Bitfocus CI plus local gate, and only submit a Developer Portal tag after hardware/action/privacy/attribution audit is clean.
