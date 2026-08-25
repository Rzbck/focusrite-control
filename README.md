# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module controlling the **Focusrite Scarlett 18i20 (3rd Gen)** through the local **Focusrite Control Server** protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here

Do not resume this project from an old chat, copied handoff, uploaded historical file, `main` alone, or an embedded SHA.

First resolve the live repository state and newest material branch movement, then read:

1. [`HANDOFF`](HANDOFF)
2. [`AI_PROJECT_RULES.md`](AI_PROJECT_RULES.md)
3. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
4. [`docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`](docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md)
5. [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md)
6. [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md)
7. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
8. relevant current source/tests/evidence

Evidence priority is: newest explicit hardware/user-host result → current code/tests → current handoff → current matrix/docs → older captures/assumptions.

## Current objective

The final deliverable is a clean, safe, maintainable **Bitfocus Companion module** using Focusrite Control Server as transport.

The current parent objective is still **explicit hardware feedback/protocol closure before release**. Publication work must not replace that objective while material safe/actionable feedback or routing questions remain open.

Future Focusrite models may be added only after real hardware testing. A possible wider repository name such as `focusrite-control` is not a claim of universal Focusrite support.

## Current branch and package

Objective branch:

`testbench/meter-routing-exact-restore`

Current package version:

`0.1.19`

Latest fully green user-host software checkpoint:

`9127b0634a0999a5409be38afb393c1ab14783b4`

That checkpoint passed:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies;
- Prettier;
- ESLint;
- source manifest validation;
- **272/272 Node tests**;
- Companion package build;
- package `focusrite-scarlett-18i20-0.1.19.tgz`.

No hardware write was performed by that software gate.

After that green checkpoint, the branch advanced through documentation-only reconciliation commits; no `src/` or production write path change has been introduced by those documentation updates.

## Latest hardware feedback result

The latest reconciled manual feedback sweep reportVersion 5 on the physical Scarlett 18i20 (3rd Gen) recorded:

- read-only harness;
- zero harness Focusrite writes;
- zero harness Companion button presses;
- about **207.3 s** of capture;
- **820** scan cycles;
- **51** feedback transitions;
- **50 confirmed PASS**;
- **1 TRANSIENT_RACE** on a fast Monitor Talkback reversal;
- **0 confirmed persistent feedback mismatch**.

Current retained closure includes:

- Input Air: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- Input Pad: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- Input Mode on Inputs 1-2: closed;
- Monitor Mute: closed;
- Monitor Dim: closed;
- Monitor Talkback: retain stronger prior closure;
- Input meters: **8/8 closed**;
- Output meters: **22 closed paths in the current configuration**;
- Mix meters: **6/12 closed**.

The six remaining Mix meter paths need only floor evidence:

- Mix B L/R;
- Mix C L/R;
- Mix E R;
- Mix F R.

Do not restart a broad click-everything meter sweep for those gaps.

## Outputs 21-24 are configuration-unavailable, not unsupported

The latest server-confirmed state reports human Outputs **21-24 / ADAT 2.1-2.4** as `available=false` in the current configuration.

Therefore:

- they receive no write in this configuration;
- they must **not** be hardcoded as permanently unavailable;
- the module follows server-confirmed availability dynamically;
- another valid configuration may expose them later;
- real hardware testing would then be required before that configuration is called hardware-tested.

Do not change sample rate or digital I/O mode merely to force coverage.

## Output `assign-mix` — current research truth

The output schema contains `assign-mix` separately from the normal output `source` control.

Latest explicit read-only user-host observation:

- schema/descriptor present on **26/26 outputs**;
- server-observed assign-mix value on **0/26 outputs**;
- every output remained `UNKNOWN[never-observed]`;
- this includes **Monitor Outputs 1-2 while Focusrite Control visibly showed Mix A L/R routing**.

That means visible routing must **not** be translated into an inferred assign-mix value.

Current classification:

- schema: **SCHEMA_PRESENT**;
- session value: **UNOBSERVED / UNKNOWN**;
- raw value semantics: **UNKNOWN**;
- official write transaction: **UNKNOWN**;
- public action/preset/feedback: **none**;
- Advanced Raw write: **none**.

0.1.19 exposes only opaque read-only equality-class/provenance diagnostics behind the existing diagnostic variable gate. No raw assign-mix value or private item ID is published by the sanitized research path.

### About `NAVIGATE_MIXES`

`NAVIGATE_MIXES` was a passive historical observation mode with a 30-second countdown. It did not require fader, Mute, Solo, or routing changes. Doing nothing during that countdown missed nothing and changed nothing.

It does **not** need to be rerun for the current objective.

## Current targeted research — Line Outputs 3-4

The next targeted harness is already implemented and software-gate validated:

- `testbench/OutputRoutingLine34Capture.js`
- `testbench/RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd`
- `test/output-routing-line34-capture.test.js`

Purpose: determine whether ordinary **Stereo** and direct **Source** changes in Focusrite Control on Line Outputs 3-4 cause assign-mix state to materialise.

This remains useful even after the passive 0/26 result because the passive result only proves that no assign-mix value was emitted during that observation session.

Safety contract:

- harness performs **zero Focusrite writes**;
- harness presses **zero Companion buttons**;
- the user performs only the UI changes explicitly requested by the launcher;
- source/stereo restoration is verified after each phase;
- no raw assign-mix write exists;
- if assign-mix is still unknown after Source restoration, the harness stops safely with `CUSTOM_MIX_BLOCKED_ASSIGN_MIX_BASELINE_UNKNOWN` and **does not ask for Custom Mix**;
- Custom Mix is allowed only if an assign-mix baseline becomes known;
- any restoration failure is a hard abort/quarantine.

An older guarded Line 3-4 pair route toward Mix A through the normal source path produced **NO_CONFIRMED_TRANSITION** and restored Playback 3/4 exactly. Do not repeat that old write blindly.

## Exact next workflow

If the local checkout is not current, use:

`UPDATE.bat`

Then run only:

`testbench\RUN_OUTPUT_ROUTING_LINE34_CAPTURE.cmd`

Follow only its Line 3-4 prompts. Do not improvise additional routing changes.

If it safe-stops because assign-mix remains unknown, preserve/send the console output or `testbench\results\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json` and do **not** force Custom Mix manually.

After that result is reconciled, return to the remaining Mixer topology questions and six Mix meter floor-only paths. No new broad sweep and no `NAVIGATE_MIXES` rerun.

## Runtime mono/stereo and routing interpretation

Physical Focusrite Control UI evidence shows that source presentation can switch at runtime between individual mono channels and linked stereo pairs for relevant Software Playback, Analogue, S/PDIF, and ADAT families.

Important retained interpretation:

- older direct **single-item** mixer-slot source/stereo writes that produced no useful transition do not prove topology support is absent;
- the unresolved issue is grouped/pair/transaction semantics used by the official client;
- generic/public mixer-slot Source/Stereo and unsafe raw writes remain withheld while those semantics are unresolved;
- `source=0` has been observed in mixer-slot state around stereo split/rejoin, but its universal meaning is not proven;
- observed adjacent/pair behavior is topology evidence, not permission to generalize blindly.

## Cold-start / server-state contract

A fresh Focusrite Control Server session can omit current values that are available in another normal session.

Missing state is not capability absence.

Rules:

- explicit actions may write only where the current policy permits and the exact required baseline/authorization conditions are satisfied;
- Toggle/cycle/relative/state-derived actions require valid server-confirmed current state;
- output writes with an availability descriptor require server-confirmed `available=true`;
- feedbacks and variables never invent optimistic state;
- no write is performed merely to warm or discover state.

See [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md).

## Remote Devices / canonical control path

Normal diagnostics and write-capable TestBench work use:

**TestBench → Companion HTTP/API/buttons → existing approved `Companion Scarlett 18i20` connection → Focusrite Control Server → Scarlett**

Writes remain blocked until authorization is confirmed for **this module's own server-assigned client ID**.

Do not create another direct TCP client by default and never copy/reuse the Companion connection's private client key in another process.

See [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md).

## Permanent safety / deliberately unsupported

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

Focusrite Control Server TCP port and device ID are dynamic and must never be hardcoded. Feedback/state is server-confirmed; no optimistic success is allowed.

## Local workflow

This personal development repository deliberately does **not** use GitHub Actions.

Use checked-in launchers:

- `UPDATE.bat` — branch-aware sync;
- `UPDATE_AND_RUN.bat` — sync + complete local software/package gate;
- `RUN.bat` — complete gate for the current checkout;
- `testbench\RUN_*.cmd` — targeted guarded hardware/research workflows.

Manual Git/PowerShell/Node commands are recovery tools only when the repository launcher is genuinely insufficient or broken.

## Branch model

- `main` — integration baseline, not necessarily the newest material work;
- `backup/v0.1.12-user-loaded-20260820` — known-good checkpoint;
- `testbench/meter-routing-exact-restore` — current objective-owning hardware-validation/research branch;
- other `testbench/*` / `debug/*` branches — bounded historical or specialist work;
- `diagnostics/readback-results` — sanitized machine-generated diagnostics/status only.

Never assume `main` is the current project truth without checking branch recency and relevance.

## Bitfocus / publication state

A repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be a better eventual repository/module scope because the transport is Focusrite Control Server, and offered hardware for future testing.

Current project position remains conservative:

- only **Scarlett 18i20 (3rd Gen)** is validated today;
- broader naming is acceptable if Bitfocus maintainers prefer it;
- no additional device support is claimed without real testing;
- wait for the official repository/naming decision before changing public scope;
- stable public target remains **v1.0.0** unless maintainers direct otherwise.

When the official Bitfocus repository exists, inspect its exact name/default branch/seed files/permissions before pushing, then use the expected branch/PR workflow and official Bitfocus CI.

## Build requirements

- Companion 5.0.3 compatibility target for the currently validated host;
- Node.js 22.20+;
- Yarn 4.

Local automated tests are necessary but not sufficient for hardware-relevant behavior changes; real-device confirmation is still required.

## Privacy and attribution

Never publish a real device serial, private hostname, client key, raw private captures/XML/diagnostics, private IDs, or user-specific paths.

Protocol understanding combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol work and MIT-licensed Bitfocus module/core patterns. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Do not claim all protocol knowledge was independently discovered.

This is an unofficial community integration and is not affiliated with or endorsed by Focusrite.

## License

MIT.
