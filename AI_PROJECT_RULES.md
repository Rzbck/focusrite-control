# Focusrite Control — AI / contributor rules

These rules are operational and apply to every branch.

## Source-of-truth order

1. newest explicit physical-hardware test;
2. current checked-in code and tests;
3. `docs/PROJECT_STATE.md`;
4. protocol/device documentation;
5. older captures or historical assumptions.

Never revive an older behavior solely because it existed in an old build.

## Current hardware scope

Only **Focusrite Scarlett 18i20 (3rd Gen)** is supported/tested.

The repository name `focusrite-control` reflects the transport/research workspace. It does **not** mean generic Focusrite hardware support.

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

## Git discipline

- `main` is the latest testable integration baseline, not necessarily release-ready.
- Create a frozen `backup/...` branch before risky protocol changes.
- Do uncertain protocol work on `debug/...` or `agent/...` branches.
- No force-push/reset of shared checkpoints.
- Inspect the current HEAD before writing.
- Keep diffs narrow and explain evidence.
- Run CI/tests before promotion.

## Delivery discipline

Before handing over or promoting a build/change:

1. inspect the whole changed tree;
2. syntax-check relevant source;
3. run tests;
4. validate manifest/version/API assumptions;
5. privacy-scan the actual tree/archive;
6. regression-check forbidden features;
7. verify package contents;
8. only then promote or hand over.

Do not send a chain of partially checked fixes. Diagnose the full failure chain first.

## Official Bitfocus publication

This personal repository is a development workspace. The official Bitfocus repository/name is still pending maintainer direction.

Do not tag/claim a stable public Bitfocus release here as a substitute for the official repository workflow. The eventual stable target remains `v1.0.0` unless maintainers direct otherwise.
