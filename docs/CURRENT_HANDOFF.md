# Current handoff - Focusrite Control / Companion

Updated: 2026-08-25 12:24+02:00
Branch: `testbench/meter-routing-exact-restore`
Parent objective: **explicit hardware feedback closure**
Gate: `ASSIGN_MIX_READONLY_0_1_19_SOURCE_IMPLEMENTED_FULL_GATE_PENDING`
Canonical production candidate: audited **0.1.16**.
Research 0.1.17: software validated, packaged and real-hardware exercised.
Research 0.1.18: software validated and exercised through the latest Mix materialisation campaign.
Research 0.1.19: **READ-ONLY assign-mix characterisation build; source implemented, user-host full gate pending, hardware readback pending**.

## MANDATORY STARTUP FRESHNESS GATE — REPO-WIDE RECENCY FIRST

When the user says `HANDOFF`, inspect remote branch movement across the repository, not only `main`. Identify the newest MATERIAL movements by commit time, choose the objective-owning branch using BOTH recency and relevance, resolve its current remote HEAD, inspect newer commits/diff, then read live root `HANDOFF`, this file, `AI_PROJECT_RULES.md`, `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence. Reconcile any newer completed user/hardware result before choosing work.

A document timestamp or embedded SHA is a checkpoint only. It never replaces live Git verification.

Keep evidence levels separate: OFFICIAL PRODUCT BEHAVIOUR / SCHEMA_PRESENT / SESSION_STATE_OBSERVED / IMPLEMENTED / HARDWARE_WRITE_CONFIRMED / HARDWARE_DYNAMIC_CLOSED. `UNKNOWN`, `BASELINE_UNKNOWN`, sparse cache or `neverObserved` is never unsupported by itself.

## PROJECT LAUNCHERS FIRST

- `UPDATE.bat` for normal sync.
- `UPDATE_AND_RUN.bat` for update + normal software gate.
- `RUN.bat` when already current.
- exact `testbench\RUN_*.cmd` launcher for targeted TestBench/hardware work.
- Manual Git/PowerShell/Node is last resort only when a normal launcher is itself blocked or cannot expose the required diagnostic.
- Do NOT make the user type ad-hoc PowerShell, raw Git commands, Node commands when the normal launcher workflow can do the work.
- Do not create a duplicate TestBench workflow when an existing launcher/probe can be safely extended.

## Objective continuity

Closing a sub-question never closes its parent validation objective. Parent objective remains explicit hardware feedback closure while material `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved`, unexercised or otherwise open rows remain. Publication is not the current objective.

Tooling/documentation work may interrupt hardware only for a direct blocker. Once that direct blocker is removed, return to the parent hardware objective. Before changing objectives, account for remaining open matrix rows; objective change is forbidden while relevant open rows remain unless the user explicitly changes the objective.

## Remote Devices authorization — mandatory before any write

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved before any write-capable hardware test.
- Reuse the existing Companion Focusrite connection; do not delete/recreate it merely to obtain another client identity.
- Missing approval is `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware-control failure.
- No extra direct clients by default.
- Never reuse/copy the Companion private client key into another process.
- See `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

The immediate 0.1.19 probe is strictly read-only, but this authorization contract remains mandatory for any later write-capable continuation.

## Last fully green user-host software checkpoint

`UPDATE_AND_RUN.bat` at exact source/TestBench checkpoint `7486e7200d05a517e2c38e70991e1df72a50d8e8` completed:

- portable Node **22.23.2** / Yarn **4.17.0** PASS;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- Node tests **244/244 PASS / 0 FAIL**;
- Companion package build PASS: `focusrite-scarlett-18i20-0.1.18.tgz`.

That gate did not install/activate the package and performed no hardware write. It validates 0.1.18 only. **Do not call 0.1.19 green until a fresh complete user-host gate proves it.**

## Latest completed hardware result — Path B really attempted a write

The latest `RUN_MIX_FEEDBACK_CLOSURE.cmd` run used the existing authorised 0.1.18 Companion connection and completed targeted self-check **77/77 PASS**, exact Scarlett 18i20 (3rd Gen) preflight, authorization and Page 2 preparation.

### Path A — Playback topology materialisation

SESSION_STATE_OBSERVED:

- `slot 3 :: Playback 1 :: topology unknown`;
- `slot 4 :: Playback 2 :: topology unknown`;
- later Playback anchors had materialised stereo flags where observed.

Because the original Playback 1/2 `mixer_slot_stereo` values were not server-observed, the topology-changing path correctly made **0 topology writes**. UNKNOWN remains only not observed in this client session.

### Path B — existing `output_pair_source` fallback

This path did execute a real guarded Companion write attempt:

- selected non-Monitor **Line Outputs 3-4**;
- exact original source baseline was `Playback 3 + Playback 4`;
- imported one temporary `output_pair_source` button targeting Mix A;
- a real pair route write was attempted through the existing `source`-item path;
- server state did **not** confirm Mix A L/R on outputs 3-4;
- exact original Playback 3/4 source state was then server-confirmed restored;
- temporary Page 2 was restored;
- fresh Mix exact-baseline coverage remained zero for the target slots;
- no Mix Mute/Solo continuation ran.

Classification: **WRITE_ATTEMPTED / NO_CONFIRMED_TRANSITION / EXACT_RESTORE_CONFIRMED** for the tested Mix-A-via-`source` operation on Line 3-4.

Do **not** generalize this into “`output_pair_source` is broken”. Existing normal paired Playback-source routing evidence is separate. Do not repeat the same Mix-A-via-`source` attempt blindly on 5-6, 7-8, etc.

## Why output `assign-mix` is now the next research question

The output schema contains a distinct `assign-mix` control per output, separate from `source`, and also `assign-talkback-mix` where present. The parser already records `output.assignMix`, but the current writable-ID builder deliberately excludes it.

Evidence level today:

- `assign-mix`: **SCHEMA_PRESENT**;
- exact value semantics: **UNKNOWN**;
- official write transaction semantics: **UNKNOWN**;
- production/public action: **ABSENT**;
- writable IDs / Advanced Raw: **ABSENT**.

The latest source-item no-transition makes `assign-mix` a material hypothesis for Custom Mix routing. It is not yet proof that `assign-mix` is the correct write path.

## 0.1.19 read-only assign-mix characterisation — implemented, not yet validated

`package.json` is now 0.1.19 so this instrumentation is traceable separately from 0.1.18.

`src/variables.js`, only while the existing diagnostic **Expose all mixer slot variables** option is enabled:

- exposes `output_N_assign_mix_class` when that output has an `assignMix` schema item;
- exposes `output_N_assign_mix_provenance`;
- converts raw server values in memory to opaque equality classes `V1`, `V2`, ...;
- same token means same currently observed raw value during that refresh;
- token numbers carry **no semantic meaning**;
- raw assign-mix values are not exposed by these research variables.

Safety remains unchanged:

- no `assign-mix` action or preset exists;
- no public feedback was added;
- `assign-mix` remains excluded from `device.writableIds`;
- no Advanced Raw path was added;
- no hardware-policy write surface was broadened;
- no direct TCP client or raw `<set>` path was added.

The existing `testbench/MeterMixPlaybackBaselineReadOnlyProbe.js` and existing `RUN_METER_MIX_BASELINE_READONLY.cmd` were extended instead of creating a second workflow. The probe now reports output source/stereo plus sanitized assign-mix schema-present/known/class/provenance state. It stores no raw assign-mix value or item ID and performs no Companion button press, Page 2 replacement or Focusrite write.

New tests cover diagnostic gating, opaque equality classes, provenance, parsed schema presence, exclusion from writable IDs, report privacy and the no-write launcher/probe contract. These tests are **implemented but not yet user-host PASS**.

## Retained strong Mix evidence

From the earlier dedicated 0.1.17 hardware run under the then-tested stereo topology:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, server variable + rendered feedback `false → true → false`, exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same;
- Mix A Right direct Mute: no transition under that tested stereo topology, exact restore;
- Mix A Right direct Solo: same;
- Mix B-F: 20 `SKIP_BASELINE_UNKNOWN`;
- restore quarantine 0; hardware restore YES; Page 2 restore YES.

Do not infer a global Right-lane ownership/unwritable/unsupported rule from that topology-specific result.

## Current status

- `mix_mute`: PARTIAL.
- `mix_solo`: PARTIAL.
- `mixer_slot_stereo`: RESEARCH_OPEN; latest Playback 1/2 topology is SESSION_STATE_OBSERVED as UNKNOWN, so topology writes remain withheld while original state is unknown.
- `mixer_slot_source`: RESEARCH_OPEN; no source write is exposed in current research.
- `output_pair_source`: PARTIAL evidence; normal pair-aware routing exists, while the tested Mix-A-via-source attempt on Line 3-4 had no confirmed transition and exact restore.
- output `assign-mix`: SCHEMA_PRESENT / READ-ONLY CHARACTERISATION IMPLEMENTED / SEMANTICS UNKNOWN / NO WRITE PATH.
- parent matrix remains 31 definitions / 829 instances; publication is not the current objective.

## Exact immediate next action — complete 0.1.19 gate, then read-only observation

1. **Do not run another write-capable Mix/routing campaign yet.**
2. Run only `UPDATE_AND_RUN.bat` and stay on `testbench/meter-routing-exact-restore`.
3. Require dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, all Node tests PASS and Companion package build PASS for **0.1.19**.
4. Preserve the complete output. Any failed stage is a blocker; do not continue to hardware from a partial gate.
5. After a fully green gate, import `focusrite-scarlett-18i20-0.1.19.tgz` and select it on the **existing** Companion Focusrite connection. Do not recreate the connection.
6. Keep **Expose all mixer slot variables** enabled.
7. Keep the same `Companion Scarlett 18i20` Remote Devices entry; do not create another client.
8. Run only `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`.
9. Type `DONE` when prompted. Do not manually change routing, Mute/Solo, mono/stereo or faders for this observation.
10. Preserve the complete output, especially `Assign-mix readback coverage` and each output row showing `assignMix=...` class/provenance.

The read-only result should tell us whether current Custom Mix destinations and direct Playback destinations expose distinct server-observed assign-mix state classes. Only after that evidence may we design any possible write test, and only with positive semantics plus exact baseline/restore proof.

## Permanent safety

Scarlett 18i20 (3rd Gen) only. Monitor gain item 1677 remains read-only. Never invent analogue input preamp gain, direct per-input hardware mute, per-channel phantom, Mic Kill or physical Monitor level control. Focusrite Control Server port and device ID remain dynamic. Feedbacks/state remain server-confirmed only. No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands or meter/status writes. No write to an output with explicit availability UNKNOWN/false. No Focusrite software/firmware update or unrelated routing change without explicit agreement. Preserve privacy and attribution.

Living-state rule: after every material software/hardware/user result or blocker, update both root `HANDOFF` and `docs/CURRENT_HANDOFF.md`. Pending work is never PASS.
