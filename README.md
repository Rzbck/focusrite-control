# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module that controls the **Focusrite Scarlett 18i20 (3rd Gen)** through the local Focusrite Control Server protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here if you are a new AI/contributor

Before relying on any embedded branch/SHA/status in documentation, resolve the **current remote branch HEAD and latest relevant commits**. Then read, in order:

1. [`HANDOFF`](HANDOFF)
2. [`AI_PROJECT_RULES.md`](AI_PROJECT_RULES.md)
3. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
4. [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md)
5. [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md)
6. [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md)
7. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
8. [`docs/COLD_START_READBACK.md`](docs/COLD_START_READBACK.md)
9. relevant current source/tests/evidence

Do not reconstruct the project from old chats, an uploaded handoff, `main` by default, or an embedded SHA before reconciling the live repository state and newest completed user/hardware result.

## Objective

The final deliverable is a clean, safe, maintainable **Bitfocus Companion module** using Focusrite Control Server as transport.

The current parent objective is **explicit hardware feedback closure across all 31 public feedback definitions/instances**. Publication work does not replace that objective while material safe/actionable rows remain open.

Future Focusrite models may be added only after real hardware testing. The wider repository naming discussion around `focusrite-control` is not a claim of universal Focusrite support.

## Current development versions

- **0.1.16** — canonical audited production candidate / restrictive post-FULL safety hardening.
- **0.1.17** — prior server-state provenance/readback research build; complete user-host software gate passed and real hardware was exercised.
- **0.1.18** — autonomous Mix topology/materialisation research build; complete user-host gate passed with **244/244 tests + package build**, and the corrected hardware campaign was exercised.
- **0.1.19** — current **read-only output `assign-mix` characterisation** build; source/tests implemented, **complete user-host software gate pending**, hardware readback pending.

The exact package that completed the canonical V8 hardware campaign remains **0.1.15**. The later 0.1.16 production candidate preserves/restricts that hardware surface rather than expanding it.

Do not call 0.1.19 green until `UPDATE_AND_RUN.bat` proves dependencies, Prettier, ESLint, source manifest, all Node tests, and `companion-module-build` on the user host.

The personal repository deliberately uses the checked-in Windows/local gate instead of GitHub Actions.

## Retained hardware evidence

Historical V8 evidence:

- 31 public feedback definitions / 829 instances;
- static/oracle 190 PASS / 639 EVAL_ONLY / 0 FAIL;
- dynamic tracker 20 both-state / 12 single-state / 710 neverObserved / 0 FAIL;
- later meter movement closure 14/46: inputs 8/8, outputs 4/26, mixes 2/12;
- targeted Core 18/18 `SKIP_BASELINE_UNKNOWN`, zero writes/FAIL/restore quarantine — readback evidence, not capability absence.

Stronger Mix evidence from the physical Scarlett:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, server variable + rendered Companion feedback `false -> true -> false`, exact restore;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same full closure;
- Mix A Right direct Mute/Solo writes did not transition under the tested **stereo** topology but restored exactly;
- Mix B-F remain open because required current state was sparse in that session.

The latest corrected 0.1.18 materialisation run added a separate result:

- Playback 1/2 topology writes remained withheld because their original `mixer_slot_stereo` values were not server-observed;
- the non-Monitor fallback then made one real guarded `output_pair_source` attempt on **Line 3-4** toward Mix A;
- the server did **not** confirm Mix A L/R on that pair;
- exact original Playback 3/4 routing and the temporary Page 2 were restored;
- the fresh Mix snapshot still had no exact target baseline, so no new Mute/Solo write ran.

That result is limited to the tested Mix-A-via-`source` path. It is not proof that `output_pair_source` is globally broken.

See the current feedback matrix for per-definition closure state rather than relying on historical aggregate counts alone.

## Runtime mono/stereo correction

Focusrite Control UI evidence from the physical 18i20 shows that source presentation can switch at runtime between individual mono channels and linked stereo pairs for Software Playback, Analogue inputs, S/PDIF, and ADAT families where available.

This corrects an older repository interpretation:

- prior direct **single-item** mixer-slot source writes on tested slots produced no useful transition;
- prior direct **single-item** mixer-slot stereo writes on tested slots produced no useful transition;
- those results do **not** prove the runtime topology feature is absent because the official UI proves the feature exists;
- the unresolved question is the Control Server **pair/group/transaction semantics** used by the official client.

Accordingly, generic/public mixer-slot Source/Stereo and Advanced Raw writes remain withheld while this grouped behavior is researched.

## 0.1.18 autonomous topology/materialisation research

0.1.18 added a deliberately narrow research path rather than public mixer-slot support:

- `mixer_slot_source` remains hidden;
- generic/public/raw mixer-slot source/stereo remains blocked by the validated hardware policy;
- `mixer_slot_stereo` is exposed only while the existing diagnostic **Expose all mixer slot variables** option is enabled;
- research stereo accepts explicit On/Off only, no Toggle;
- it refuses a write when the current server state is unknown/invalid;
- Playback channel pairing is based on runtime `Playback N` identity rather than hardcoded slot numbers;
- exact original topology/source restoration is mandatory;
- restore failure hard-aborts/quarantines;
- no direct Control Server client or raw write is introduced.

The latest physical run correctly withheld this topology-changing path because the original Playback 1/2 topology was UNKNOWN. Its fallback used the existing pair-aware output-source action once, observed no Mix A transition, restored exactly, and stopped. Do not repeat that same fallback blindly on more output pairs.

## 0.1.19 output assign-mix read-only characterisation

The output schema contains a distinct `assign-mix` control separate from the normal output `source` control, plus `assign-talkback-mix` where present. Exact `assign-mix` value semantics and official write transaction behavior are currently **unknown**.

0.1.19 therefore adds **readback only** behind the existing diagnostic **Expose all mixer slot variables** gate:

- `output_N_assign_mix_class` exposes an opaque equality class `V1`, `V2`, ... when the schema item has a server-observed value;
- `output_N_assign_mix_provenance` exposes arrival/set provenance;
- same class token means the same currently observed raw value during that variable refresh;
- class numbers have no semantic meaning;
- raw assign-mix values are not exposed by these research variables or stored by the sanitized probe.

Safety is intentionally unchanged:

- no `assign-mix` action, preset or public feedback was added;
- `assign-mix` remains excluded from writable IDs and Advanced Raw;
- no hardware-policy write surface was broadened;
- no direct TCP client or raw `<set>` path was added.

The existing `RUN_METER_MIX_BASELINE_READONLY.cmd` / `MeterMixPlaybackBaselineReadOnlyProbe.js` workflow was extended instead of creating another tool. The next hardware step is passive observation only.

## Current restrictions

Important restrictions include:

- direct output Mute withheld on known non-independent/no-useful paths;
- direct right-member output Source withheld where pair ownership is hardware-proven; dedicated pair Source remains separate;
- output Stereo/Nickname/Gain targets with no-effect evidence remain withheld;
- Monitor Output 1-2 direct Gain remains withheld while independent exact-restoration semantics are unresolved;
- outputs with an explicit availability item receive no production write while availability is false or unknown;
- generic/public Mixer Slot Source/Stereo remains withheld; the 0.1.18 stereo path is research/TestBench-only;
- output `assign-mix` remains read-only research in 0.1.19;
- per-lane Mix Talkback remains withheld;
- Monitor gain item **1677 remains read-only**.

## Cold-start/server-state contract

Real hardware testing proved that a fresh Control Server session can omit current values that are available in another normal session. This includes guarded Core state and Mix strip state.

Missing cache state is not capability absence.

Supported behavior:

- explicit target actions may request a known target only where the current safety/write contract permits it and this module's client is authorised;
- Toggle/cycle/relative/state-derived actions require valid server-confirmed current state;
- output writes with an explicit availability descriptor additionally require server-confirmed availability=true;
- feedbacks and variables never invent optimistic state;
- no write is performed merely to warm/discover state.

See [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md) and [`docs/COLD_START_READBACK.md`](docs/COLD_START_READBACK.md).

## Remote Devices / canonical control path

All normal diagnostics and write-capable TestBench work use:

**TestBench → Companion HTTP/API/buttons → existing approved `Companion Scarlett 18i20` connection → Focusrite Control Server → Scarlett**

Do not create a second direct TCP client by default and never copy/reuse the Companion connection's private client key in another process.

Writes remain blocked until the module's own server-assigned client identity is approved in Focusrite Control → Device Settings → Remote Devices.

See [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md).

## Exact next workflow

Run only:

`UPDATE_AND_RUN.bat`

Stay on `testbench/meter-routing-exact-restore` and require the complete **0.1.19** software/package gate to be green.

Only after that:

1. import/select `focusrite-scarlett-18i20-0.1.19.tgz` on the **existing** Companion Focusrite connection;
2. keep/enable **Expose all mixer slot variables**;
3. do not recreate the connection or make manual routing/topology/Mute/Solo/fader changes;
4. run only `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd`;
5. type `DONE` when prompted;
6. preserve the complete output, especially `Assign-mix readback coverage` and the output `assignMix=...` class/provenance rows.

That probe performs no Companion button press, no Page 2 replacement and no Focusrite write. Only after its evidence is interpreted should any future exact-baseline/exact-restore write experiment be designed.

## Safety / deliberately unsupported

Do **not** add or claim:

- analogue input preamp gain control;
- direct per-input hardware mute;
- per-channel phantom-power switching;
- Mic Kill;
- physical Monitor level control;
- Monitor gain item `1677` writes;
- arbitrary unknown/raw item writes;
- firmware/reset/restore/snapshot commands;
- support for untested Focusrite hardware.

Monitor gain item `1677` remains **read-only**.

## Bitfocus / Slack publication state

A repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be a better eventual scope because the transport is Focusrite Control Server and offered hardware for future testing.

The project response remains conservative: only Scarlett 18i20 (3rd Gen) is validated today; broader naming is acceptable if maintainers prefer it; no other device should be claimed until tested.

Wait for the official repository/naming decision before changing public scope. Stable public target remains **v1.0.0** once the official repository exists and hardware/action audit plus required CI are clean.

## Local workflow — no GitHub Actions here

This personal development repository deliberately does **not** use GitHub Actions. Validation is local and branch-aware:

- `UPDATE_AND_RUN.bat` — normal update + complete software/package gate;
- `UPDATE.bat` — branch selection/update only;
- `RUN.bat` — validate/package the current branch only;
- `testbench\RUN_*.cmd` — targeted guarded TestBench/hardware workflows.

Manual Git/PowerShell/Node commands are recovery tools, not the normal user workflow.

## Branch model

- `main` — integration baseline, not an official release;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `testbench/meter-routing-exact-restore` — current hardware-validation/research branch;
- `debug/*` — completed/bounded protocol diagnostics;
- `diagnostics/readback-results` — sanitized machine-generated diagnostic/status results only.

No force-push/reset workflow is intended. Any promotion must be reviewable, locally validated, privacy-clean, and supported by the right evidence.

## Build requirements

- Companion 5.0.3 compatibility target for the currently validated host;
- Node.js 22.20+;
- Yarn 4.

`RUN.bat` is the canonical validation/package entrypoint. For hardware-relevant behavior changes, local automated tests are necessary but not sufficient; real-device confirmation is still required.

## Attribution

Protocol understanding combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol work and MIT-licensed Bitfocus module/core patterns. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Do not claim all protocol knowledge was independently discovered.

This is an unofficial community integration and is not affiliated with or endorsed by Focusrite.

## License

MIT.
