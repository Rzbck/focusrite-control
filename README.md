# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module that controls the **Focusrite Scarlett 18i20 (3rd Gen)** through the local Focusrite Control Server protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. Current validated hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

## Start here if you are a new AI/contributor

Read, in order:

1. [`AI_PROJECT_RULES.md`](AI_PROJECT_RULES.md)
2. [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md)
3. [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md)
4. [`docs/BITFOCUS_SLACK_AND_RELEASE.md`](docs/BITFOCUS_SLACK_AND_RELEASE.md)
5. [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md)
6. [`docs/DEVICE_SUPPORT.md`](docs/DEVICE_SUPPORT.md)
7. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
8. [`docs/COLD_START_READBACK.md`](docs/COLD_START_READBACK.md)

Do not reconstruct the project from old chats before reading these files.

## Final objective

The final deliverable is a clean, safe, maintainable **Bitfocus Companion module** using Focusrite Control Server as transport.

Today this means Scarlett 18i20 (3rd Gen) only. Future models may be added through capability detection **only after real testing**. The wider repository name `focusrite-control` follows the naming direction discussed with Bitfocus and is not a claim of universal Focusrite support.

## Current baseline

Current integration baseline: **v0.1.12**.

Confirmed on the real Windows / Companion 5.0.3 host:

- Companion package builds and imports successfully;
- Module API `2.0.0` loads successfully;
- dynamic Focusrite Control Server UDP discovery works;
- dynamic TCP server port works;
- exact device model detection works;
- Remote Devices authorization is matched to this module's own server-assigned client ID;
- the module reaches Companion status `OK`;
- server-confirmed state drives variables/feedbacks;
- writes remain blocked until authorization.

Local validation for the published v0.1.12 checkpoint included syntax/format/lint/manifest/package checks and **23/23 Node tests**. This development repository deliberately does **not** use GitHub Actions; see the workflow section below.

### Hardware-tested control path

The following reversible controls have been exercised through Companion / Focusrite Control Server on a physical Scarlett 18i20 (3rd Gen), with server-confirmed change and restoration during the guarded hardware test sequence:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

These hardware tests were performed during the v0.1.9-era guarded sequence. Later versions retain the same protocol mappings plus additional safety fixes, but the complete hardware sequence has not yet been rerun on v0.1.12 because of the cold-start readback issue below.

## Current blocking issue: cold-start readback

After a fresh module process starts, Focusrite Control Server does **not consistently provide initial values** for Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. Other state is present.

This is distinct from the control mappings themselves: those controls have already produced real hardware changes and server-confirmed `<set>` responses. The unresolved problem is obtaining their current value safely at cold start before a reversible hardware test.

The TestBench intentionally blocks all hardware writes if any required initial value is unknown, because an unknown value cannot be restored safely.

Current research branch: `debug/cold-start-readback`.

See [`docs/COLD_START_READBACK.md`](docs/COLD_START_READBACK.md).

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
- `RUN.bat` — run the current branch task only.

The update launchers execute from a temporary copy before `git switch` / `git pull`, preventing the running batch file from being replaced mid-execution.

On `main`, `RUN.bat` runs the standard Yarn validation/package pipeline. A debug branch may provide `tools/RUN_BRANCH.bat` to launch a branch-specific diagnostic instead.

The portable autonomous Windows builder used during earlier local validation is intentionally **not** part of this public development mirror.

## Branch model

- `main` — latest testable integration baseline, not an official release;
- `backup/v0.1.12-user-loaded-20260820` — immutable checkpoint of the v0.1.12 baseline confirmed to load and reach `OK`;
- `debug/cold-start-readback` — isolated protocol/readback investigation.

No force-push/reset workflow is intended. Promotion back to `main` must be reviewable, locally validated and supported by the right evidence.

## Build / local validation

Requirements:

- Companion 5.0.3 target;
- Node.js 22.20+;
- Yarn 4.

`RUN.bat` performs the standard commands on `main`. You can also run them manually:

```sh
corepack enable
yarn install
# once yarn.lock is committed/available: yarn install --immutable
yarn check-format
yarn lint
yarn check
yarn test
yarn companion-module-build
```

For hardware-relevant changes, local automated tests are necessary but not sufficient: real hardware evidence is required.

## Attribution

Protocol understanding combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol work and MIT-licensed Bitfocus module patterns. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

This is an unofficial community integration and is not affiliated with or endorsed by Focusrite.

## License

MIT.
