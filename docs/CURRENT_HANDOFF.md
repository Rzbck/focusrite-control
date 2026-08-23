# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 10:15 Europe/Paris

Read `AI_PROJECT_RULES.md` and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current code override older assumptions.

Also read `docs/REMOTE_DEVICES_AUTHORIZATION.md` before diagnosing any write failure or launching a hardware campaign.

## Scope / publication

- Hardware support actually validated remains **Focusrite Scarlett 18i20 (3rd Gen) only**.
- Module/package development version remains **0.1.13**.
- Working branch: `testbench/v0.2-hardware-validation`.
- Official Bitfocus repository/name remains pending; Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Capability/profile-driven architecture is not a broader hardware-support claim.
- Unknown/unvalidated Focusrite models remain read-only discovery/research only; writes require explicit hardware-tested/write-enabled profile evidence.
- Stable public release target remains v1.0.0 after official repository/naming, CI and hardware/action audit.

## Remote Devices authorization — mandatory preflight

This is now a first-class operational rule because repeated hardware testing showed that missing Focusrite Control **Remote Devices** approval can make otherwise valid writes appear to fail.

Before any SAFE, FULL, targeted or manual phase that may write:

1. **Reuse the existing Companion Focusrite connection. Do not delete/recreate it between builds or tests unless a new identity is intentionally required.**
2. Open **Focusrite Control → Device Settings → Remote Devices**.
3. Find the existing Companion client, normally shown as **`Companion Scarlett 18i20`**.
4. Click **Approve** if it is not already approved.
5. Run the read-only preflight and require this module's own authorization state to be confirmed before any write phase.

If authorization is missing, stop. Classify it as **AUTHORIZATION/PREFLIGHT BLOCKED**, not as a hardware/control failure. Do not diagnose Air/Pad/Mute/Dim/routing/mixer/etc. from a run that never had write authorization.

### Stable client identity

Current code already implements the correct persistence model:

- `src/main.js` generates a private UUID only when the Companion connection has no saved `clientId`;
- the UUID is saved into that Companion connection configuration;
- later config updates preserve the existing `clientId`;
- `src/focusrite-client.js` sends the persisted value as the Focusrite Control Server `client-key`;
- authorization is still applied only when the server approval event matches this module's own server-assigned client ID.

Public Focusrite Control protocol research explicitly notes that changing the client key requires re-approval. Focusrite's own Remote Devices documentation also describes approval as persistent until the user rejects the device.

Operational consequence:

**The critical thing to preserve is the private client identity/client-key stored with the existing Companion connection.** A newly created Companion connection has no saved identity, receives a new UUID, appears as a new Remote Device and must be approved again.

Keep the visible client name stable as well, preferably `Companion Scarlett 18i20`, so the user can recognize it immediately. The visible name is not the proven identity key, but future AI/tools must not gratuitously rename clients or create differently named throwaway write clients for each test.

Never publish, print or log the private `clientId` / `client-key` merely to help with approval.

The TestBench preflight has been updated to show the Remote Devices instructions before testing and to give the exact approval/remediation steps when authorization is absent.

## Permanent safety / privacy rules

Never invent or expose analogue input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, physical Monitor level control, arbitrary raw writes, firmware/reset/restore/snapshot commands or writes to read-only status/meter items.

Monitor gain item **1677 remains read-only**. It may be observed while the user physically moves the Monitor knob; there must be no Monitor set/adjust action, preset or raw-write path without new hardware proof.

Also preserve:

- dynamic Focusrite Control Server port/device ID; never hardcode active runtime values;
- writes blocked until Remote Devices authorization matches this module's own server-assigned client ID;
- feedback/state only from server-confirmed state, never optimistic success;
- availability `UNKNOWN` = no write;
- no public serial/hostname/client key/client or device IDs/raw XML/private captures/private Companion export/local diagnostics/user paths;
- relevant MIT/third-party attribution;
- public Bitfocus source clean; local Windows/TestBench tooling remains separate from production behavior.

## TestBench doctrine

Canonical FULL is a **device-wide capability campaign**, not a collection of permanent one-off probes.

- Targeted probes are temporary research tools only.
- Useful targeted evidence must be generalized across all applicable targets before the next broad campaign.
- Report behavior per target/pair; do not infer a generic odd/even/follower rule from a single sample.
- Every public feedback instance needs an explicit validation status.
- Current r9 scope is **829 logical feedback probes / 31 definitions**.
- Reversible feedbacks should be validated during the transitions that exercise them, not only in static before/after sweeps.
- Physical/manual controls require guided manual phases and remain `MANUAL_PENDING` if not actually exercised.
- Meter feedbacks use numeric server meter state + configured threshold; real two-state signal exercise is separate evidence.
- **Authorization preflight happens before hardware behavior is judged.** Missing approval is not a feature failure.

## Production module state

Production `src/` has **not changed** during V5, publisher work, pair3–4 research or the V6 TestBench work.

Current package version remains 0.1.13. No `.tgz` re-import is required for current TestBench-only work.

Current production `output_pair_source` still requests source `0` on both pair members for Pair Source=None. Do not change production semantics until the device-wide evidence is intentionally translated into a reviewed production model.

The production authorization path itself is already correct in principle: stable persisted private client identity, own server-client-ID approval matching, write blocking until authorised, and server-confirmed feedback/state.

## Canonical validation surfaces

### Page 1 — live r9

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

- 46×26 / 1196 controls;
- 42 SAFE setters;
- 829 logical feedback probes / 31 definitions;
- normal T + inverted F pairs;
- feedback cells contain zero actions.

Never publish the live page.

### Page 2 — private generated capability harness

`testbench/generated/FULL_EXTENDED.companionconfig`

Snapshot-specific and Git-ignored/private.

Latest V6 hardware campaign used:

- 768 audited controls;
- snapshot signature `0952a7b921b71e89`.

## Cold-start / SAFE evidence

Core cold-start remains 3/21 present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim remain absent at cold start. Latest automated SAFE remains 3 PASS / 0 FAIL / 18 SKIP. Earlier guarded work separately validated all 21 Core write paths. Never warm state by writing or invent missing state.

Any future cold-start or SAFE rerun must first confirm Remote Devices approval for the existing Companion client; otherwise write-path conclusions are invalid.

## Historical V5 result

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V5.md`.

V5 established the earlier safety/mute patterns and one Output2 source quarantine. After V5, the user explicitly restored the saved normal Focusrite configuration. Treat that V5 quarantine as historical evidence, not current live state.

## Historical targeted pair3–4 result

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_PAIR34.md`.

Pair3–4 showed `ZERO_ORIGINAL` after Pair Source=None for at least four seconds and restored exactly. This closed the timing hypothesis but was not the final architecture direction.

## Latest hardware campaign — FULL V6 — 2026-08-22

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V6.md`.

Canonical sanitized report: `docs/hardware-results/LATEST_SHAREABLE.json`.

Revision:

`full-v6-device-wide-topology-feedback-20260822`

Preflight was valid for that campaign:

- r9 audit PASS;
- module 0.1.13 PASS;
- exact hardware-tested profile + own authorization PASS;
- shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- Page2 768 controls / snapshot `0952a7b921b71e89`;
- user explicitly confirmed `ALL_ISOLATED`.

### Pair topology — major hardware result

Eleven AVAILABLE/observable pairs were exercised with immediate exact pair restore. Pairs 21–22 and 23–24 were availability UNKNOWN and received no topology write.

Every exercised pair showed the same server-confirmed pattern:

- route: `REQUESTED_ORIGINAL`;
- Pair Source=None: `ZERO_ORIGINAL`;
- typical timeline: `OTHER_ORIGINAL > ZERO_ORIGINAL`;
- exact original pair restore confirmed through the pair action path.

Hardware-tested interpretation for this Scarlett 18i20 (3rd Gen) state/configuration: pair operations are not behaving like two independently writable source controls. The left member changes; the right member remains on its original server-reported source.

This is device-wide evidence for the exercised 18i20 pairs, not evidence for other Focusrite models.

### Global signal-path safety

`globalSignalPathSafety = false`.

Remaining blockers:

- Out4 `source-none-unconfirmed`;
- Out6 `source-none-unconfirmed`;
- Out8 `source-none-unconfirmed`;
- Out10 `source-none-unconfirmed`.

Outputs21–24 remained availability UNKNOWN/no write and only had passive server-confirmed Mute ON guards.

### V6 summary

- BLOCKED_BY_SAFETY 1260;
- BLOCKED_FORBIDDEN 3;
- EVAL_ONLY 6;
- FAIL_MISMATCH 11;
- FAIL_NO_EFFECT 13;
- MANUAL_PENDING 6;
- PASS 63;
- PASS_BASELINE 8;
- PASS_INDEPENDENT 11;
- QUARANTINED_RESTORE 13;
- SKIP_AVAILABILITY_UNKNOWN 22;
- SKIP_NO_CAPABILITY 16;
- UNSUPPORTED 4;
- exit 2;
- no global HARD ABORT;
- sanitized report publication succeeded.

### Thirteen restore quarantines

The 13 `QUARANTINED_RESTORE` rows were:

- Out2 source;
- Out12 source + stereo;
- Out14 source + stereo;
- Out16 source + stereo;
- Out18 source + stereo;
- Out20 source + stereo;
- Out26 source + stereo.

These occurred **after** the device-wide topology phase had already confirmed exact pair restoration. Current diagnosis: a TestBench modeling defect later treated some pair-owned/right-member controls as independently writable/restorable.

**Post-run live-state reset:** after V6, the user explicitly restored the normal saved Focusrite setup while downstream speakers remained powered off. The quarantines are historical campaign results, not current live device state.

Operational rule: **do not rerun V6 unchanged.**

### Output mute evidence

`FAIL_MISMATCH` occurred on Outputs 2,4,6,8,10,12,14,16,18,20,26. Eleven other outputs were `PASS_INDEPENDENT`.

Mute behavior alone is not a reliable ownership detector and must not drive pair-side classification by itself.

### Feedback evidence

Feedback before: 177 PASS / 652 EVAL_ONLY / 0 FAIL.

Feedback after: 180 PASS / 649 EVAL_ONLY / 0 FAIL.

All 31 definitions have an independent oracle mapping, but V6 is **not** complete dynamic validation of all 829 probes because the old global-safety gate still blocked many mixer/lane transitions. In particular, the large `mix_mute`/`mix_solo` surfaces were not dynamically exercised.

Meter feedbacks did not show a rendered/server mismatch in static sweeps. Static agreement is not proof that every meter feedback crossed its threshold in both directions.

### Manual meter phase

The user intentionally performed silence → signal activity → silence. Sanitized both-state meter coverage still reported `0/46`, so the row remains `MANUAL_PENDING`; no false PASS is claimed.

Interpretation: the generic observer did not capture both threshold states for the same meter probe. It is not evidence that all meter feedbacks are broken. Replace the generic window with a targeted/grouped manual meter plan before another broad hardware run.

### Manual Monitor gain 1677

Physical Monitor movement was observed through the read-only server variable. Exact return to the identical starting server value was not confirmed, so the row remains `MANUAL_PENDING`.

This proves readback movement was observable but does **not** create any Monitor write capability.

## V6 defects that must be fixed before another broad hardware run

1. Runtime pair topology must drive ownership decisions; do not use mute alias detection alone.
2. Once a pair has demonstrated right-member pair ownership, do not run direct right-member source/stereo functional writes as if independent.
3. `ALL_ISOLATED` currently protects only the topology sweep; mixer/lanes/monitoring are still blocked by old `globalSafety`, causing 1260 blocked rows.
4. Under explicit physical isolation, reversible signal-path tests may run only with exact local snapshot/restoration and HARD ABORT on the first unconfirmed restore.
5. Core/isolated helper restore quarantine must never be overwritten by a later PASS/FAIL status.
6. Feedback validation must observe rendered feedback during the corresponding action transitions so reversible probes can demonstrate both states.
7. Manual meter testing needs a targeted/grouped silence/signal plan rather than one generic window.
8. Monitor readback capability should distinguish “movement observed” from “exact physical return value reproduced”.
9. Every future write-capable campaign must first pass the stable-client Remote Devices authorization preflight described above.

## Software validation state

Before V6 hardware, a whole-repository Windows run reached:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- 101/102 tests PASS;
- sole failure was a wording/Markdown false-positive in the new AI-rules regression test;
- package step was not reached.

After fixing that regression test, the targeted V6 suite passed **8/8** on Windows.

Therefore do **not** describe the current branch as a fully green release/package gate yet. Production `src/` is unchanged, but the next software revision must receive one clean whole-repository gate before any further hardware run.

The 2026-08-23 Remote Devices work changed documentation and the read-only preflight only; it did not change production `src/` or hardware state.

## Required next sequence

1. **Current live state is restored:** user explicitly restored the normal saved Focusrite setup after V6; V6 quarantines are historical, not current live state.
2. **No more hardware now. Do not rerun V6 unchanged.**
3. Preserve V6 as hardware evidence; do not delete or rewrite the sanitized result/history.
4. Build the next TestBench revision from runtime pair-ownership evidence plus the validated profile topology.
5. Skip/reclassify pair-owned right-member source/stereo direct writes and avoid duplicate pair-source probes already covered by topology.
6. Allow reversible Core/mixer/lane/monitoring work under explicit `ALL_ISOLATED` only with exact local restoration and immediate HARD ABORT on restore failure.
7. Add dynamic feedback observation during transitions, especially mix_mute/mix_solo and other reversible feedbacks.
8. Replace the generic meter window with targeted/grouped meter observation and improve Monitor readback reporting.
9. Run one clean `UPDATE_AND_RUN.bat` after those software changes; diagnose the full chain once if it fails.
10. Before any later hardware write campaign, explicitly tell the user to open **Focusrite Control → Device Settings → Remote Devices**, approve the existing **Companion Scarlett 18i20** client if necessary, and reuse the same Companion connection/client identity.
11. Only after a green software gate, confirmed Remote Devices authorization and renewed explicit isolation agreement should another broad hardware campaign run.
12. Keep public support scope at Scarlett 18i20 (3rd Gen) until other devices are physically validated and the official Bitfocus repository/name decision is made.
