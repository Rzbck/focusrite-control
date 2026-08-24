# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module that controls the **Focusrite Scarlett 18i20 (3rd Gen)** through the local Focusrite Control Server protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here if you are a new AI/contributor

Before relying on any embedded branch/SHA/status in documentation, resolve the **current remote branch HEAD and latest relevant commits**. Then read, in order:

1. [`AI_PROJECT_RULES.md`](AI_PROJECT_RULES.md)
2. [`docs/CURRENT_HANDOFF.md`](docs/CURRENT_HANDOFF.md)
3. [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md)
4. [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md)
5. [`docs/BITFOCUS_SLACK_AND_RELEASE.md`](docs/BITFOCUS_SLACK_AND_RELEASE.md)
6. [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md)
7. [`docs/DEVICE_SUPPORT.md`](docs/DEVICE_SUPPORT.md)
8. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
9. [`docs/COLD_START_READBACK.md`](docs/COLD_START_READBACK.md)

Do not reconstruct the project from old chats before reconciling the live repository state with the current handoff and newest completed user-validated result.

## Final objective

The final deliverable is a clean, safe, maintainable **Bitfocus Companion module** using Focusrite Control Server as transport.

Today this means Scarlett 18i20 (3rd Gen) only. Future models may be added through capability detection **only after real testing**. The wider repository name `focusrite-control` follows the naming direction discussed with Bitfocus and is not a claim of universal Focusrite support.

## Current development version

Current post-FULL release candidate: **v0.1.16**.

The exact package that completed the canonical V8 hardware campaign remains **v0.1.15**. That package is retained as the hardware-tested checkpoint. The V8 FULL-from-zero completed successfully on a physical Scarlett 18i20 (3rd Gen), classified all 1436 inventory rows, mapped all 1340 observed snapshot variables and all 21 Core variables, covered 829 logical feedback probes across 31 definitions, and finished with no FAIL-class result.

v0.1.16 is a **restrictive safety hardening** found during the post-FULL action audit: production output writes fail closed when the schema exposes an availability item whose server-confirmed value is false or still unknown. The same rule applies to direct output actions, the dedicated stereo-pair Source action, output-mute presets and Advanced Raw output writes. No new hardware write path is added.

The exact audited/live-validated v0.1.16 package currently retained in Companion has SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

The last full local production software gate checkpoint is `3e35ac16812f3187fa23bad3542393be638f566b`: dependencies, Prettier, ESLint, source manifest, **186/186 tests**, Companion package build and RUN all passed. Subsequent work on the current validation branch did not change production `src/`; it has been TestBench/launcher/documentation/research-state maintenance. Any new repository changes must still receive a fresh local gate before the branch is called green again.

The personal repository uses the Windows local gate (`UPDATE_AND_RUN.bat`) rather than GitHub Actions.

Confirmed on the real Windows / Companion 5.0.3 host across the current development history:

- Companion packages build and import successfully;
- Module API `2.0.0` loads successfully;
- dynamic Focusrite Control Server UDP discovery works;
- dynamic TCP server port works;
- exact device model detection works;
- Remote Devices authorization is matched to this module's own server-assigned client ID;
- the module reaches Companion status `OK`;
- server-confirmed state drives variables/feedbacks;
- writes remain blocked until authorization.

This personal repository deliberately does **not** use GitHub Actions.

### Hardware evidence

The guarded Core controls Air 1–8, Pad 1–8, Input 1/2 Line/Instrument, Monitor Mute, Monitor Dim and global Talkback have direct real-hardware history. The completed V8 campaign additionally audited the wider output, pair, mixer, monitoring and feedback surfaces and records per-control classifications rather than treating every schema item as equivalent.

Important current restrictions include:

- direct output Mute withheld on Outputs 2/4/6/8/10 because behavior was not independent/useful;
- direct right-member Source withheld where runtime topology proves pair ownership; the dedicated pair Source path is separate;
- direct Stereo/Nickname/Gain targets with no-effect evidence are withheld;
- Monitor Output 1–2 direct Gain is withheld because independent exact-restoration semantics remain unproven;
- outputs with an explicit availability item receive no production write while availability is false or unknown;
- Mixer Slot Source/Stereo and per-lane Mix Talkback write families are withheld while their readback remains available;
- Monitor gain item 1677 remains read-only.

See the current handoff and the sanitized V8 result under `docs/hardware-results/LATEST_SHAREABLE.json` for the exact evidence classes.

### Mix meter closure research

The focused meter work is complete for the current question. Mix A L/R retain their earlier exact-baseline hardware closure. Mix B-F remain baseline-unknown/non-actionable.

A final isolated direct read-only Control Server observation reproduced the missing B-F baseline pattern already seen through Companion: left-lane gain was present while mute/solo and right-lane state were missing. This is evidence that a fresh normal Control Server subscription is not a complete mixer-state snapshot; it is **not** evidence to manufacture or guess missing baselines.

Do not rerun FULL, repeated reconnect/subscription guessing, or the retired direct Mix probe merely to close Mix B-F evidence. Normal diagnostics and all write-capable validation should use the existing approved **Companion Scarlett 18i20** connection as the canonical Focusrite client. See [`docs/REMOTE_DEVICES_AUTHORIZATION.md`](docs/REMOTE_DEVICES_AUTHORIZATION.md).

## Cold-start state contract

Real hardware testing proved that a fresh Control Server subscription does not provide every current value. Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim may remain unknown after cold connect, re-subscribe and reconnect.

This is no longer treated as a blocker for already validated **explicit target writes**.

Supported behavior:

- explicit target actions such as `On`, `Off` or an explicit enum/value may request a known target while the current value is unknown, but only when connected, the item is verified writable and this module's own Control Server client is authorised;
- state-derived actions such as Toggle, mode Cycle or relative adjustment require a server-confirmed current value and are blocked while it is unknown/invalid;
- output writes with an explicit availability descriptor additionally require server-confirmed availability=true;
- state feedbacks and variables never invent state optimistically;
- raw state variables stay blank until the server confirms a value;
- no write is performed merely to warm/discover state.

See [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md) and [`docs/COLD_START_READBACK.md`](docs/COLD_START_READBACK.md).

## Safety / deliberately unsupported

Do **not** add or claim:

- analogue preamp gain control;
- direct per-input hardware mute;
- per-channel phantom-power switching;
- Mic Kill;
- physical Monitor level control;
- Monitor gain item `1677` writes;
- arbitrary unknown/raw item writes;
- firmware/reset/restore/snapshot commands.

Monitor gain item `1677` remains **read-only**.

## Bitfocus / Slack publication state

A repository request was posted in Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be a better scope because the transport is Focusrite Control Server and offered hardware for future testing.

The response from this project was intentionally conservative: only Scarlett 18i20 (3rd Gen) is validated now; broader naming is acceptable if maintainers prefer it; no other devices should be claimed until tested.

We are waiting for the official Bitfocus repository/naming decision. The stable public target remains **v1.0.0** once the official repository exists and the hardware/action audit is clean.

See [`docs/BITFOCUS_SLACK_AND_RELEASE.md`](docs/BITFOCUS_SLACK_AND_RELEASE.md).

## Local workflow — no GitHub Actions here

This personal development repository **does not use GitHub Actions**. Future AI/contributors must not add or wait on GitHub Actions in this repo unless the user explicitly changes that policy.

Validation is local and branch-aware:

- `UPDATE_AND_RUN.bat` — fetch, choose branch, fast-forward update, then run;
- `UPDATE.bat` — branch selection/update only;
- `RUN.bat` — validate/package the current branch only.

The update launchers execute from a temporary copy before `git switch` / `git pull`, preventing the running batch file from being replaced mid-execution.

On integration/RC branches, `RUN.bat` runs the standard Node/Yarn validation/package pipeline. TestBench hardware/result publication is a separate guarded workflow. Debug branches may use branch-specific diagnostic runners.

The portable autonomous Windows builder used during earlier local validation is intentionally **not** part of this public development mirror.

## Branch model

- `main` — latest testable integration baseline, not an official release;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `testbench/meter-routing-exact-restore` — current validation/release-audit branch;
- `debug/*` — completed or bounded protocol diagnostics/research; direct Mix presence research is retired for the current question;
- `diagnostics/readback-results` — sanitized machine-generated diagnostic/status results only.

No force-push/reset workflow is intended. Promotion back to `main` must be reviewable, locally validated and supported by the right evidence.

## Build / local validation

Requirements:

- Companion 5.0.3 compatibility target for the currently validated host;
- Node.js 22.20+;
- Yarn 4.

`RUN.bat` performs the standard commands. They can also be run manually:

```sh
corepack enable
yarn install
yarn check-format
yarn lint
yarn check
yarn test
yarn companion-module-build
```

For hardware-relevant behavior changes, local automated tests are necessary but not sufficient. Restrictive post-validation changes that only block previously eligible writes still require package and live startup/read-only validation, but do not automatically require another destructive/repetitive FULL.

Documentation/test/launcher-only changes do **not** justify another hardware campaign; they require the appropriate local software gate before their branch status is called green.

## Attribution

Protocol understanding combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol work and MIT-licensed Bitfocus module/core patterns. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md), which preserves the relevant upstream Bitfocus MIT notice.

This is an unofficial community integration and is not affiliated with or endorsed by Focusrite.

## License

MIT.
