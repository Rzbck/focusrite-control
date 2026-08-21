# Focusrite Control — AI / contributor rules

These rules are operational and apply to every branch of **Rzbck/focusrite-control**.

## Read first / source-of-truth order

Before changing behavior, read:

1. `README.md`;
2. this file;
3. `docs/AI_HANDOFF.md`;
4. `docs/PROJECT_STATE.md`;
5. `docs/BITFOCUS_SLACK_AND_RELEASE.md`;
6. `docs/GITHUB_WORKFLOW.md`;
7. `docs/AUTOMATED_DIAGNOSTICS.md`;
8. `docs/COLD_START_READBACK.md` when working on startup state;
9. current code/tests.

When information conflicts, use this evidence order:

1. newest explicit physical-hardware test;
2. current checked-in code and tests;
3. current project state/handoff;
4. protocol/device documentation;
5. older captures or historical assumptions.

Never revive an older behavior solely because it existed in an old build.

## Final project objective

Develop, validate, document and eventually publish a **Bitfocus Companion module** that controls Focusrite hardware through the local **Focusrite Control Server** protocol.

Current validated hardware scope is **only Focusrite Scarlett 18i20 (3rd Gen)**. The repository name `focusrite-control` reflects the transport and the naming direction discussed with Bitfocus; it does **not** mean that other Focusrite models are supported today.

Long-term capability-based support for other Focusrite Control Server devices is acceptable only after real hardware testing.

## No GitHub Actions in this development repository

**Do not use GitHub Actions in `Rzbck/focusrite-control`.**

For this personal development repository:

- do not add, enable, depend on, wait for, or troubleshoot `.github/workflows/*`;
- do not treat a missing GitHub Actions status as a blocker;
- validation is performed locally with the checked-in Node/Yarn tests and Windows branch launcher workflow;
- use `RUN.bat`, `UPDATE.bat`, `UPDATE_AND_RUN.bat` and explicit test commands;
- record the actual local validation result in the commit/handoff when material.

If Bitfocus later creates the **official** module repository and its maintainers require their own CI/reusable workflow, follow that official repository's rules there. Do not copy that requirement back into this development mirror unless the user explicitly changes this policy.

## Automated diagnostics policy

The development workflow may automatically push **sanitized diagnostic summaries only** so future AI/contributors can inspect the newest result directly from GitHub.

Current cold-start readback result location:

- branch: `diagnostics/readback-results`;
- file: `diagnostics/runtime/latest-readback.md`.

When investigating the cold-start issue, inspect that file before asking the user to upload a result.

Never automatically publish `.local-logs`, raw TestBench logs, private captures, raw Focusrite XML or arbitrary diagnostic output. Any new automatic diagnostic publisher must have an explicit public schema, privacy rejection rules and dedicated tests before it is enabled. See `docs/AUTOMATED_DIAGNOSTICS.md`.

## Hard safety rules

- Dynamic Control Server port and dynamic device ID only; never hardcode active values.
- Writes require Remote Devices authorization matched to this module's own server-assigned client ID.
- Feedbacks and variables use server-confirmed state only.
- No optimistic success state.
- Unknown current state must never be converted into a guessed hardware write.
- Monitor gain item `1677` is read-only.
- Never re-add Monitor set/adjust actions, Monitor +/- presets or raw write access for `1677` without new physical proof.
- Never invent analogue input gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill or physical Monitor level control.
- Do not expose firmware/reset/restore/snapshot or unknown raw writes.
- Do not update Focusrite software, firmware, routing or hardware settings without explicit user agreement.

## Public privacy

Never commit:

- real serial numbers;
- private hostnames;
- server-assigned client IDs;
- private client keys;
- raw private Control Server/device XML;
- TestBench session logs;
- private USB captures;
- user-specific Windows paths;
- local diagnostics containing device/network identifiers.

Use synthetic fixtures and sanitized summaries.

## Evidence labels

Always distinguish:

- **hardware-tested**;
- **implemented**;
- **schema-observed**;
- **research-only**;
- **unsupported**.

Do not call every parsed/implemented control hardware-tested.

## Git discipline

- `main` is the latest testable integration baseline, not necessarily release-ready.
- Keep `backup/...` branches immutable once they represent a validated checkpoint.
- Do uncertain protocol work on `debug/...` or `agent/...` branches.
- Keep generated sanitized results on dedicated `diagnostics/...` branches when possible; do not mix them into code history.
- No force-push/reset of shared checkpoints.
- Inspect the exact current HEAD before writing.
- Keep diffs narrow and explain evidence.
- Validate locally before promotion.
- Do not merge an experiment back to `main` because it merely "seems to work" once.

## Delivery discipline

Before handing over or promoting a build/change:

1. inspect the whole changed tree;
2. syntax-check relevant source;
3. run tests;
4. validate manifest/version/API assumptions;
5. privacy-scan the actual tree/archive;
6. regression-check forbidden features;
7. verify package contents;
8. for hardware changes, require explicit real-device evidence;
9. only then promote or hand over.

Do not send a chain of partially checked fixes. Diagnose the full failure chain first.

## Current publication / Slack state

The first Bitfocus repository request was posted in Companion Slack `#module-development` for the Scarlett 18i20 module. Bryce Seifert suggested that `focusrite-control` may be the better repository/module scope because the transport is Focusrite Control Server, and offered hardware for future testing.

The project replied that only Scarlett 18i20 (3rd Gen) is validated today and that broader naming is acceptable if Bitfocus prefers it, without claiming untested devices.

The official Bitfocus repository/name decision is still pending. See `docs/BITFOCUS_SLACK_AND_RELEASE.md`.

Do not tag/claim a stable public Bitfocus release from this personal repository as a substitute for the official workflow. The eventual stable target remains **v1.0.0** unless maintainers direct otherwise.