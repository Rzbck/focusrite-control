# Focusrite Control / Companion development

Development repository for a Bitfocus Companion module that controls the **Focusrite Scarlett 18i20 (3rd Gen)** through the local Focusrite Control Server protocol.

> **Development mirror — not the official Bitfocus module repository.** The final Bitfocus repository/module naming is still awaiting maintainer direction. The current hardware scope remains exactly **Scarlett 18i20 (3rd Gen)**.

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

### Hardware-tested control path

The following reversible controls have been exercised through Companion / Focusrite Control Server on a physical Scarlett 18i20 (3rd Gen), with server-confirmed change and restoration during the guarded hardware test sequence:

- Air 1–8;
- Pad 1–8;
- Input 1/2 Line ↔ Instrument;
- Monitor Mute;
- Monitor Dim;
- Talkback.

These hardware tests were performed during the v0.1.9-era guarded test sequence. Later versions retain the same protocol mappings plus additional safety fixes, but the complete hardware sequence has not yet been rerun on v0.1.12 because of the cold-start readback issue below.

## Current blocking issue: cold-start readback

After a fresh module process starts, Focusrite Control Server does **not consistently provide initial values** for Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. Other state is present.

This is distinct from the control mappings themselves: those controls have already produced real hardware changes and server-confirmed `<set>` responses. The unresolved problem is obtaining their current value safely at cold start before a reversible hardware test.

The TestBench intentionally blocks all hardware writes if any required initial value is unknown, because an unknown value cannot be restored safely.

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

## Local workflow

This repo mirrors the branch-safe launcher pattern used by the ContAIners Signal project:

- `UPDATE_AND_RUN.bat` — fetch, choose branch, fast-forward update, then run;
- `UPDATE.bat` — branch selection/update only;
- `RUN.bat` — run the current branch task only.

The update launchers execute from a temporary copy before `git switch` / `git pull`, preventing the running batch file from being replaced mid-execution.

On `main`, `RUN.bat` runs the standard Yarn validation/package pipeline. A debug branch may provide `tools/RUN_BRANCH.bat` to launch a branch-specific diagnostic instead.

The portable autonomous Windows builder used during earlier local validation is intentionally **not** part of this public development mirror.

## Branch model

- `main` — latest testable integration baseline, not an official release;
- `backup/v0.1.12-user-loaded-20260820` — frozen checkpoint of the first v0.1.12 baseline confirmed to load and reach `OK`;
- `debug/cold-start-readback` — isolated protocol/readback investigation.

No force-push/reset workflow is intended. Promotion back to `main` should be reviewable and fast-forwardable.

## Build

Requirements:

- Companion 5.0.3 target;
- Node.js 22.20+;
- Yarn 4.

`RUN.bat` performs the standard commands below on the current branch. You can also run them manually:

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

## Source truth

Read these before changing behavior:

1. `AI_PROJECT_RULES.md`
2. `docs/AI_HANDOFF.md`
3. `docs/PROJECT_STATE.md`
4. `docs/GITHUB_WORKFLOW.md`
5. `docs/DEVICE_SUPPORT.md`
6. `docs/PROTOCOL.md`
7. `docs/COLD_START_READBACK.md`

Information not proven by current code or hardware tests remains unknown, not assumed.

## Attribution

Protocol understanding combines original Scarlett 18i20 (3rd Gen) hardware testing with public prior Focusrite protocol work and MIT-licensed Bitfocus module patterns. See `THIRD_PARTY_NOTICES.md`.

This is an unofficial community integration and is not affiliated with or endorsed by Focusrite.

## License

MIT.
