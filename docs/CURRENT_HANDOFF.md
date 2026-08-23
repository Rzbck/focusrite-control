# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 10:35 Europe/Paris

Read `AI_PROJECT_RULES.md` and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current checked-in code override older assumptions.

Also read `docs/REMOTE_DEVICES_AUTHORIZATION.md` before diagnosing any write failure or launching a hardware campaign.

## Scope / publication

- Hardware support actually validated remains **Focusrite Scarlett 18i20 (3rd Gen) only**.
- Module/package development version remains **0.1.13**.
- Working branch: `testbench/v0.2-hardware-validation`.
- Official Bitfocus repository/name remains pending; Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Capability/profile-driven architecture is not a broader hardware-support claim.
- Unknown/unvalidated Focusrite models remain read-only discovery/research only; writes require explicit hardware-tested/write-enabled profile evidence.
- Stable public release target remains v1.0.0 after official repository/naming, CI and hardware/action audit.

## Current live hardware state

The user explicitly restored the normal saved Focusrite configuration after the V6 campaign. The downstream speakers remained powered off during that reset.

Therefore all V5/V6 Source=None and restore quarantines are **historical evidence**, not the current live device state.

Do not tell a future user/AI that a V6 quarantine is still active now.

## Remote Devices authorization — mandatory preflight

This is a first-class operational rule because missing Focusrite Control **Remote Devices** approval can make otherwise valid writes appear to fail.

Before any SAFE, FULL, targeted or manual phase that may write:

1. **Reuse the existing Companion Focusrite connection. Do not delete/recreate it between builds or tests unless a new identity is intentionally required.**
2. Open **Focusrite Control → Device Settings → Remote Devices**.
3. Find the existing Companion client, normally shown as **`Companion Scarlett 18i20`**.
4. Click **Approve** if it is not already approved. If the UI shows **Reject**, that client is already approved.
5. Run the read-only preflight and require this module's own authorization state to be confirmed before any write phase.

If authorization is missing, stop. Classify it as **AUTHORIZATION/PREFLIGHT BLOCKED**, not as a hardware/control failure. Do not diagnose Air/Pad/Mute/Dim/routing/mixer/etc. from a run that never had write authorization.

### Stable client identity

Current production code already implements the correct persistence model:

- `src/main.js` generates a private UUID only when the Companion connection has no saved `clientId`;
- the UUID is saved into that Companion connection configuration;
- later config updates preserve the existing `clientId`;
- `src/focusrite-client.js` sends the persisted value as the Focusrite Control Server `client-key`;
- authorization is applied only when the server approval event matches this module's own server-assigned client ID.

The critical thing to preserve is the private client identity/client-key stored with the existing Companion connection. A newly created Companion connection receives a new identity and must be approved again.

Keep the visible name stable as `Companion Scarlett 18i20` for operator clarity. Never publish, print or log the private `clientId` / `client-key`.

### Historical direct read-only probes

The two historical Remote Devices shown as `Focusrite ReadOnly State Probe` came from the dedicated `debug/cold-start-readback` research work. Those tools opened a separate direct TCP session to Focusrite Control Server. They were read-only because `<set>` was forbidden, but they were still independent Remote Devices with their own client identities.

They do **not** need to be approved for normal SAFE/FULL work.

**Never run a direct Focusrite Control Server research probe at the same time as a normal SAFE/FULL/write-capable TestBench campaign.**

Normal validation path:

`TestBench → Companion HTTP/API/buttons → existing approved Companion Scarlett 18i20 connection → Focusrite Control Server → Scarlett`

The current `RUN_SAFE_HARDWARE_TESTS.cmd` now invokes `Focusrite_18i20_Preflight.ps1` before any `--allow-hardware-writes` command and blocks the campaign if that read-only preflight fails.

## Permanent safety / privacy rules

Never invent or expose analogue input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, physical Monitor level control, arbitrary raw writes, firmware/reset/restore/snapshot commands or writes to read-only status/meter items.

Monitor gain item **1677 remains read-only**. Physical movement may be observed; there must be no Monitor set/adjust action, preset or raw-write path without new hardware proof.

Also preserve:

- dynamic Focusrite Control Server port/device ID; never hardcode active runtime values;
- writes blocked until Remote Devices authorization matches this module's own server-assigned client ID;
- feedback/state only from server-confirmed state, never optimistic success;
- availability `UNKNOWN` = no write;
- no public serial/hostname/client key/client or device IDs/raw XML/private captures/private Companion export/local diagnostics/user paths;
- relevant MIT/third-party attribution;
- public Bitfocus source clean; local Windows/TestBench tooling remains separate from production behavior.

## Canonical TestBench surfaces

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

Snapshot-specific and Git-ignored/private. If the current snapshot/harness signature no longer matches, FULL must request a new page-2 import before hardware writes.

## Cold-start / SAFE evidence

Core cold-start remains 3/21 present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim remain absent at cold start. Latest automated SAFE evidence remains 3 PASS / 0 FAIL / 18 SKIP. Earlier guarded work separately validated all 21 Core write paths.

Never warm state by writing or invent missing state merely to make SAFE complete.

## Latest completed hardware campaign — FULL V6 — 2026-08-22

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V6.md`.

Canonical sanitized result: `docs/hardware-results/LATEST_SHAREABLE.json`.

V6 revision:

`full-v6-device-wide-topology-feedback-20260822`

Preflight was valid:

- r9 audit PASS;
- module 0.1.13 PASS;
- exact hardware-tested profile + own authorization PASS;
- shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- user explicitly confirmed `ALL_ISOLATED`.

### V6 pair-topology result

Eleven AVAILABLE/observable pairs were exercised with immediate exact pair restore. Pairs 21–22 and 23–24 were availability UNKNOWN and received no topology write.

Every exercised pair showed the same server-confirmed pattern:

- route: `REQUESTED_ORIGINAL`;
- Pair Source=None: `ZERO_ORIGINAL`;
- typical timeline: `OTHER_ORIGINAL > ZERO_ORIGINAL`;
- exact original pair restore confirmed through the pair action path.

Hardware-tested interpretation for this Scarlett 18i20 (3rd Gen) state/configuration: pair operations did not behave like two independently writable source controls. The left member changed while the right member remained on its original server-reported source.

Do not generalize this result to other Focusrite models.

### V6 remaining defects / blockers

V6 still had `globalSignalPathSafety = false`, with server-side Source=None blockers on Outputs 4, 6, 8 and 10. Under the old model this caused a large number of later mixer/lane tests to be blocked.

V6 also produced 13 later restore quarantines on pair-owned/right-member source/stereo rows even though the earlier topology phase had already restored the pairs exactly. Diagnosis: later individual-output logic incorrectly treated some pair-owned right members as independent.

Output mute behavior also proved unsuitable as an ownership oracle.

Feedback static sweeps showed no rendered/server mismatch, but V6 did not dynamically exercise all 829 probes. The generic manual meter observer reported 0/46 both-state coverage; that means the old observer did not capture both threshold states for the same probes, not that all meters were broken.

Monitor gain 1677 movement was observable read-only; exact return to the identical starting value was not confirmed. This remains `MANUAL_PENDING` and does not create write capability.

## Current TestBench revision — FULL V7 implemented, not yet hardware-run

The checked-in TestBench has already advanced beyond the old handoff's “build the next revision” step.

Current revision in `FullTestBenchRunnerV4.js`:

`full-v7-runtime-ownership-isolated-feedback-20260822`

V7 is **implemented in code**, but it is **not yet hardware-tested** and the current branch has **not yet received one clean whole-repository Windows validation/package gate after the latest V7 + Remote Devices changes**.

Implemented V7 changes include:

- runtime pair topology is now the ownership oracle;
- a right member is marked pair-owned only from restored runtime topology evidence (`REQUESTED_ORIGINAL` + `ZERO_ORIGINAL` + exact restore);
- direct right-member source/stereo writes are skipped when runtime evidence proves pair ownership;
- pair safety no longer retries an impossible both-member None guard after ownership proof;
- explicit `ALL_ISOLATED` allows reversible Core/mixer/lane/monitoring tests even when server-side global safety is incomplete;
- any unconfirmed restore under that isolated campaign is a HARD ABORT;
- a `QUARANTINED_RESTORE` result cannot be overwritten later by PASS/FAIL bookkeeping;
- reversible feedbacks are sampled during the action transitions that exercise their server variables, including `mix_mute` and `mix_solo`;
- manual meter validation now uses explicit `SILENT` then `SIGNAL` phases rather than one unsynchronised window;
- Monitor gain 1677 remains read-only;
- no new direct Focusrite TCP write path was added by V7.

The V7 regression file `test/full-testbench-v7-runtime-ownership.test.js` exists and covers these contracts. Existence of the tests is not the same as a completed Windows gate.

## Production module state

Production `src/` has not changed during the V5/V6/V7 TestBench work or the 2026-08-23 Remote Devices documentation/launcher work.

Current package version remains **0.1.13**.

Current production `output_pair_source` still requests source `0` on both pair members for Pair Source=None. Do not translate V6/V7 TestBench findings into production semantics until the new device-wide hardware evidence is complete and intentionally reviewed.

The production authorization path remains: stable persisted private identity, own server-client-ID approval matching, writes blocked until authorised, server-confirmed feedback/state only.

## Software validation state

The last recorded whole-repository Windows attempt before V7 reached:

- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- 101/102 tests PASS;
- the sole failure at that time was a wording/Markdown false-positive in an AI-rules regression test;
- package step was not reached.

A later targeted V6 suite passed 8/8 after that wording fix.

Since then V7 code, Remote Devices documentation/tests and the SAFE/FULL launcher preflight integration have changed. Therefore **do not call the current branch green yet**.

No hardware write was performed by the 2026-08-23 Remote Devices/launcher changes.

## Required next sequence

1. **Do not run hardware yet.** Latest completed hardware evidence remains V6; current live Focusrite state is restored.
2. Run one clean **`UPDATE_AND_RUN.bat`** on branch `testbench/v0.2-hardware-validation` and let the full local chain run: dependencies → Prettier → ESLint → manifest → all tests → Companion package.
3. If that gate fails, diagnose the complete failure chain once and fix it before hardware. Do not send a sequence of partially checked hardware attempts.
4. If the gate is fully green, record the actual result in this handoff before the hardware campaign.
5. Before the next hardware run, open **Focusrite Control → Device Settings → Remote Devices** and confirm the existing **Companion Scarlett 18i20** client is approved. Do not approve/use the old `Focusrite ReadOnly State Probe` clients.
6. Ensure no direct Focusrite Control Server research probe is running in parallel.
7. Restore the normal saved Focusrite configuration and renew explicit physical isolation agreement (`ALL_ISOLATED`) before FULL.
8. Run the current **FULL V7**, not V6. The launcher must execute the read-only Remote Devices preflight before any hardware-write command.
9. HARD ABORT immediately on any unconfirmed restoration. Do not rerun after a HARD ABORT until the failure is diagnosed and live state is understood.
10. Preserve V6 as historical hardware evidence and publish only sanitized V7 results.
11. After V7 hardware evidence is complete, review what should actually change in production `src/`; do not automatically copy TestBench assumptions into the public module.
12. Keep public support scope at Scarlett 18i20 (3rd Gen) until other devices are physically validated and the official Bitfocus repository/name decision is made.
