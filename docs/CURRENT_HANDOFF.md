# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 — **Scarlett 18i20 (3rd Gen) V8 FULL-from-zero remains the canonical write-capable hardware evidence on exact package 0.1.15. Post-FULL safety hardening 0.1.16 has passed the canonical Windows gate (152/152), exact archive audit, live Companion startup on the existing connection, and read-only authorization preflight. The next hardware-facing work is a dedicated read-only meter-feedback closure campaign, not another FULL.**

Read `AI_PROJECT_RULES.md`, `docs/REMOTE_DEVICES_AUTHORIZATION.md`, `docs/VALIDATION_CLOSURE_AND_FUTURE_HARDWARE_PROTOCOL.md`, and this file before proposing code, tests, hardware work, branch changes or publication changes. New explicit hardware evidence and current checked-in code override older assumptions.

## Immediate checkpoint

- Repository: `Rzbck/focusrite-control`.
- Active integration/validation branch: `testbench/v0.2-hardware-validation`.
- Official Bitfocus repository/name: still pending maintainer decision.
- Validated public hardware scope: **Scarlett 18i20 (3rd Gen) only**.
- Canonical TestBench revision: `full-v8-generic-evidence-profile-20260823`.
- Canonical completed write-capable hardware package: **0.1.15**, exact archive SHA-256 `1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`.
- Current post-FULL candidate: **0.1.16**.
- Canonical Windows gate for 0.1.16: immutable dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, **152/152 Node tests PASS**, Companion package build PASS.
- Exact audited 0.1.16 archive: `focusrite-scarlett-18i20-0.1.16.tgz`.
- Exact 0.1.16 SHA-256: `d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`.
- 0.1.16 live startup/read-only validation: **PASS** on the existing Companion connection; dynamic Control Server discovery, exact model detection, server-confirmed state subscription, own-client Remote Devices authorization and read-only preflight all passed.
- 0.1.16 adds no new write capability; it only blocks additional output writes when server-confirmed availability is false/unknown and improves attribution/docs/tests.
- The completed V8 write-capable hardware evidence still belongs to exact package 0.1.15. Do **not** relabel the 0.1.16 archive as the package that ran FULL.
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
- dynamic non-meter tracked: 742;
- both states observed: 20;
- single state observed: 12;
- never observed in the dynamic transition observer: 710;
- dynamic mismatches/failures: 0.

The 710 never-observed dynamic rows are **not** equivalent to 710 broken/unvalidated definitions. They include stateful feedbacks that simply did not transition during the campaign and families intentionally not written. The authoritative before/after sweeps still covered all 829 logical probes with zero FAIL.

### Remaining meter evidence

The V8 manual meter row remains intentionally `MANUAL_PENDING`.

There are **46 meter feedback paths**:

- 8 input meters;
- 26 output meters;
- 12 mix-lane meters.

Final V8 manual meter evidence:

- both states observed: **0/46**;
- single state observed: **41/46**;
- never observed: **5/46**;
- no mismatch was promoted to PASS;
- remaining paths require real targeted signal and must not be forced through optimistic or disruptive routing changes.

The next hardware-facing task is therefore a **dedicated read-only meter campaign**. It must record path-specific min/max/threshold-crossing evidence and must not contain a Focusrite write path.

### Remaining disruptive manual exclusions

Four actions remain intentionally outside normal FULL functional writes:

- Device Preset — can overwrite routing;
- Clock Source — can alter clocking;
- Sample Rate — can interrupt audio;
- S/PDIF Mode — can alter digital I/O mode.

They are implemented/schema-observed, not hardware-certified by FULL. Do not exercise them merely to remove `MANUAL_PENDING`. Any future validation requires a separate explicitly approved campaign with its own restore plan.

The manual physical Monitor gain readback was completed successfully: physical movement changed read-only item 1677 and the original server value was observed again after manual return. **No software write to 1677 exists or is allowed.**

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

Live Companion startup on the existing authorised connection passed for this exact 0.1.15 package, and this exact package produced canonical V8 FULL hardware evidence.

## Exact 0.1.16 software/package/live-audited candidate

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
- Mixer Slot Source/Stereo and per-lane Mix Talkback write actions are removed by production definition policy while feedback/readback remains;
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
- production direct-output policy previously filtered by model/hardware evidence but did not also consult live server-confirmed `available` state;
- dedicated `output_pair_source` also lacked a production availability guard;
- output-mute presets and Advanced Raw inherited the same omission.

This was not a V8 hardware-campaign failure. It was a production fail-closed parity issue discovered by comparing completed evidence with the public production surface.

### 0.1.16 behavior

`src/hardware-policy.js` now requires:

- no `available` descriptor => preserve the separately tested V3 no-flag case and let hardware-evidence policy decide;
- explicit descriptor with server-confirmed `true`/`1` => eligible for remaining policy checks;
- explicit descriptor with false, blank, missing/unknown state, or no value reader => **no write**.

The rule applies to direct output Mute/Gain/Source/Stereo/Nickname, Gain Adjust, stereo-pair Source, output-mute presets and Advanced Raw output items. `src/definition-policy.js` filters choices and re-checks callbacks, so stale actions fail closed if availability changes.

No Focusrite hardware write was used to implement this change.

## Final action/feedback/preset audit status

- V8 `WRITE_BEHAVIOR_MISMATCH` direct Mute rows are Outputs 2/4/6/8/10; production withholds them.
- V8 `PAIR_OWNED_ALIAS` direct Source rows are right members; production direct Source withholds them while separately validated pair Source remains distinct.
- known direct Stereo/Nickname/Gain `NO_EFFECT_CONFIRMED` targets are withheld by control-specific policy.
- Monitor Output 1/2 Gain is `WITHHELD_BY_PROFILE`, not falsely labelled no-effect, and remains absent from direct Set/Adjust and Advanced Raw.
- Mixer Slot Source/Stereo write families are removed from production actions but readback/feedback remains.
- per-lane Mix Talkback write family is removed but readback/feedback remains; global Monitor Talkback is separate and valid.
- Outputs 21–24 `AVAILABILITY_UNKNOWN` are fail-closed in production as well as TestBench.
- feedback callbacks read server-confirmed state; unknown values do not receive optimistic success.
- Monitor gain item 1677 has no write action/preset/raw path.
- unsupported Input Preamp Gain, direct Input Hardware Mute, per-channel Phantom and Mic Kill remain absent.
- firmware/reset/restore/snapshot writes remain absent.
- Device Preset, Clock Source, Sample Rate and S/PDIF Mode remain implemented/schema-observed and disruptive/manual-excluded from automatic FULL functional validation.

## Attribution / distribution status

Upstream Bitfocus module/core behavior informed portions of implementation/TestBench. The project does not claim all protocol knowledge was independently discovered.

`THIRD_PARTY_NOTICES.md` preserves the full upstream Bitfocus MIT notice, and the same complete notice is carried in packaged `companion/HELP.md` so it remains with distributed Companion archives. Top-level project license remains MIT.

A **historical provenance audit is still pending** before final official transfer. It must compare current/early code against credited prior public work and distinguish common protocol facts from substantially adapted expression/code. Do not remove conservative attribution before that audit, and do not claim copying where evidence only shows common protocol behavior.

## Privacy / public repository closure still pending

The exact 0.1.16 package and current published shareable have passed privacy checks. A final **repository-tree plus Git-history/blob audit** is still pending before official transfer.

That audit must search for real serials, private hostnames, client keys, client IDs, MACs, private LAN endpoints, raw private XML/captures, diagnostics and user-specific paths. Deleting a value only from HEAD is not sufficient if a real private value exists in public history.

Do not create a second private repository merely for cosmetic cleanup. The current personal repository may remain the research/development/source-of-truth repository; the future official Bitfocus repository should receive only the files appropriate to Bitfocus's conventions after their actual repository exists.

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

Unknown/unvalidated Focusrite models remain read-only/discoverable only where appropriate and fail closed for writes. Never inherit the 18i20 evidence profile into another device without real hardware validation.

## Current production hardware evidence restrictions

For Scarlett 18i20 (3rd Gen):

- direct Mute withheld on Out 2/4/6/8/10;
- direct Source withheld on proven pair-owned right members;
- direct Stereo withheld on specific no-effect members;
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

1. **reuse the existing Companion Focusrite connection**; do not delete/recreate it merely to change module version;
2. in **Focusrite Control → Device Settings → Remote Devices**, confirm that **Companion Scarlett 18i20** is approved when required;
3. run read-only preflight and require exact supported model, dynamic discovery and authorization for this module's own server-assigned client ID;
4. if approval is missing, treat result as **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no write-capable test.

Missing authorization is a preflight/auth block, not a hardware failure. Preserve the private stable client identity and follow `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

## TestBench / hardware discipline

Canonical path:

`TestBench → Companion local API/buttons → existing approved Companion connection → Focusrite Control Server → Scarlett`

Never run direct protocol research probes concurrently with SAFE/FULL/RESUME.

During automatic hardware phases: no video/music/DAW playback; keep downstream outputs physically safe. Intentional audio is only for explicit guided SILENT/SIGNAL or targeted meter phases.

`PAGE2_AUTO` is live-tested and may replace only private Page 2 after explicit confirmation, preserving Page 1 and existing Focusrite connection/client identity.

RESUME is diagnostic and never completed/publishable evidence. V8 FULL is already complete; do not rerun it for 0.1.16 availability hardening or for meter closure.

## Durable validation protocol

The complete reusable closure/future-device method is documented in:

`docs/VALIDATION_CLOSURE_AND_FUTURE_HARDWARE_PROTOCOL.md`

Treat it as the checklist for both the Scarlett final review and future Focusrite profiles. It explicitly covers evidence vocabulary, read-only discovery, complete schema inventory, feedback oracles, availability, restoration, pair topology, family sweeps, manual meters/readback, production-policy reconciliation, software/package/live audit, privacy/provenance and publication extraction.

## Canonical next sequence

The 0.1.16 validation chain is complete for its intended restrictive production change. Do **not** rerun the software gate, SAFE, FULL or RESUME merely because docs change.

1. Create/use a dedicated meter-validation branch from this checkpoint; do not modify production `src/` unless the meter campaign reveals a real module bug.
2. Build a **read-only targeted meter closure harness** for all 46 input/output/mix meter feedback paths. It must record per-path numeric min/max, threshold, rendered feedback state, low/high observation and mismatch state; no Focusrite write path and no automatic routing changes.
3. Run that campaign with explicit guided SILENT/real-SIGNAL phases. Keep unreachable paths explicit rather than forcing routing.
4. Merge only evidence/testbench/docs changes that are clean and useful. A real production bug discovered by the campaign gets a separate source-change audit/version decision.
5. After meter closure, perform the separate **repository tree + Git history privacy audit**.
6. Then perform the separate **historical provenance/attribution audit** against credited public prior work, including early project commits where practical.
7. Review final public-source extraction: decide which TestBench/research/handoff files remain only in the personal development repository versus the future official Bitfocus module repository.
8. Wait for Bitfocus's official repository/naming decision before changing public scope/name or performing final transfer.

## Publication state

- Personal repository only; no GitHub Actions here.
- Root `UPDATE_AND_RUN.bat` remains the canonical local software gate.
- Sanitized V8 FULL result is published on the validation branch.
- Official Bitfocus repository/name remains pending.
- Bryce Seifert suggested `focusrite-control` because transport is Focusrite Control Server and offered future hardware testing.
- Project response remains conservative: only Scarlett 18i20 (3rd Gen) is validated; use Bitfocus-preferred naming without claiming untested devices.
- Stable public release target remains **v1.0.0** unless Bitfocus maintainers direct otherwise.
- When the official repo exists: inspect repo/default branch/seed/permissions, compare against cleaned RC, use expected PR/CI flow, run Bitfocus CI plus local gate, and only submit a Developer Portal tag after hardware/action/privacy/attribution audit is clean.
