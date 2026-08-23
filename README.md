# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module that controls the **Focusrite Scarlett 18i20 (3rd Gen)** through the local Focusrite Control Server protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here if you are a new AI/contributor

Read, in order:

1. [`AI_PROJECT_RULES.md`](AI_PROJECT_RULES.md)
2. [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md)
3. [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md)
4. [`docs/STATE_CONTRACT.md`](docs/STATE_CONTRACT.md)
5. [`docs/BITFOCUS_SLACK_AND_RELEASE.md`](docs/BITFOCUS_SLACK_AND_RELEASE.md)
6. [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md)
7. [`docs/DEVICE_SUPPORT.md`](docs/DEVICE_SUPPORT.md)
8. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
9. [`docs/COLD_START_READBACK.md`](docs/COLD_START_READBACK.md)

Do not reconstruct the project from old chats before reading these files.

## Final objective

The final deliverable is a clean, safe, maintainable **Bitfocus Companion module** using Focusrite Control Server as transport.

Today this means Scarlett 18i20 (3rd Gen) only. Future models may be added through capability detection **only after real testing**. The wider repository name `focusrite-control` follows the naming direction discussed with Bitfocus and is not a claim of universal Focusrite support.

## Current development version

Current hardware-validation candidate: **v0.1.15**.

The immutable known-good checkpoint remains `backup/v0.1.12-user-loaded-20260820`. The previously installed/audited development package was v0.1.14. A later real-hardware RESUME exposed unresolved Monitor Output 1–2 direct-gain restoration/cross-output behavior, so v0.1.15 conservatively withholds those two gain writes and requires a fresh local software/package audit before further hardware testing.

The personal repository uses the Windows local gate (`UPDATE_AND_RUN.bat`) rather than GitHub Actions. A candidate is not considered software-validated until that gate reports immutable dependencies, Prettier, ESLint, source manifest, Node tests and `companion-module-build` all passing.

Confirmed on the real Windows / Companion 5.0.3 host across the current development history:

- Companion package builds and imports successfully;
- Module API `2.0.0` loads successfully;
- dynamic Focusrite Control Server UDP discovery works;
- dynamic TCP server port works;
- exact device model detection works;
- Remote Devices authorization is matched to this module's own server-assigned client ID;
- the module reaches Companion status `OK`;
- server-confirmed state drives variables/feedbacks;
- writes remain blocked until authorization.

This personal repository deliberately does **not** use GitHub Actions.

### Hardware-tested control path

The following reversible controls have been exercised through Companion / Focusrite Control Server on a physical Scarlett 18i20 (3rd Gen), with server-confirmed change and restoration during guarded hardware testing:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

Other action families must keep their more specific hardware/schema evidence status. In particular, direct Monitor Output 1–2 gain is currently **withheld**, not claimed no-effect and not claimed independently restorable.

## Cold-start state contract

Real hardware testing proved that a fresh Control Server subscription does not provide every current value. Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim may remain unknown after cold connect, re-subscribe and reconnect.

This is no longer treated as a blocker for already validated **explicit target writes**.

Supported behavior:

- explicit target actions such as `On`, `Off` or an explicit enum/value may request a known target while the current value is unknown, but only when connected, the item is verified writable and this module's own Control Server client is authorised;
- state-derived actions such as Toggle, mode Cycle or relative adjustment require a server-confirmed current value and are blocked while it is unknown/invalid;
- feedbacks and variables never invent state optimistically;
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

On integration/RC branches, `RUN.bat` runs the standard Node/Yarn validation/package pipeline and publishes only a fixed sanitized validation status where configured. Debug branches may use branch-specific diagnostic runners.

The portable autonomous Windows builder used during earlier local validation is intentionally **not** part of this public development mirror.

## Branch model

- `main` — latest testable integration baseline, not an official release;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `testbench/v0.2-hardware-validation` — active guarded hardware-validation branch;
- `debug/*` — completed or bounded protocol diagnostics/research;
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

For hardware-relevant behavior changes, local automated tests are necessary but not sufficient: real hardware evidence is required.

## Attribution

Protocol understanding combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol work and MIT-licensed Bitfocus module patterns. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

This is an unofficial community integration and is not affiliated with or endorsed by Focusrite.

## License

MIT.
