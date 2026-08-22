# Focusrite Control — AI / contributor rules

These rules are operational and apply to every branch of **Rzbck/focusrite-control**.

## Read first / source-of-truth order

Before changing behavior, read:

1. `README.md`;
2. this file;
3. **`docs/CURRENT_HANDOFF.md`** — living resume point, always read first for current objective/result;
4. `docs/AI_HANDOFF.md` — broader historical handoff;
5. `docs/PROJECT_STATE.md` — broader project state/history;
6. `docs/BITFOCUS_SLACK_AND_RELEASE.md`;
7. `docs/GITHUB_WORKFLOW.md`;
8. `docs/AUTOMATED_DIAGNOSTICS.md`;
9. `docs/COLD_START_READBACK.md` when working on startup state;
10. current code/tests.

When information conflicts, use this evidence order:

1. newest explicit physical-hardware test;
2. current checked-in code and tests;
3. `docs/CURRENT_HANDOFF.md`;
4. current project state/handoff;
5. protocol/device documentation;
6. older captures or historical assumptions.

Never revive an older behavior solely because it existed in an old build.

## Living-state maintenance

`docs/CURRENT_HANDOFF.md` is the canonical **current** resume point for future AI/contributors.

After every material event, update it before handing the project off:

- complete Windows validation gate;
- physical hardware test PASS/FAIL/SKIP/HARD ABORT;
- newly proven/rejected protocol behavior;
- branch/objective change;
- publication/naming decision;
- safety-contract change;
- newly discovered blocker.

Record what was actually observed, exact branch/version where relevant, whether hardware writes occurred, and the immediate next step. Do not leave a stale green status after a later failure, and do not claim a future/pending test passed.

Never put private runtime material into the living handoff. For Companion TestBench work, publish only sanitized page structure/mappings and results. **Do not commit the user's live `.companionconfig` export**, because live exports can contain private connection configuration and identifiers.

## Final project objective

Develop, validate, document and eventually publish a **Bitfocus Companion module** that controls Focusrite hardware through the local **Focusrite Control Server** protocol.

Current validated hardware scope is **only Focusrite Scarlett 18i20 (3rd Gen)**. The repository name `focusrite-control` reflects the transport and the naming direction discussed with Bitfocus; it does **not** mean that other Focusrite models are supported today.

Long-term capability-based support for other Focusrite Control Server devices is acceptable only after real hardware testing.

## TestBench breadth and targeted-probe rule

The canonical FULL TestBench is a **device-wide capability campaign**, not a collection of permanently hardcoded one-off probes.

- A narrow probe for one output, one pair, one control or one hypothesis is allowed only as a temporary research tool to distinguish a specific hypothesis.
- A successful or failed targeted probe must **not** become the normal launcher workflow, the general hardware model, or a parity/follower rule by itself.
- Before the next broad hardware campaign, useful targeted evidence must be generalized into a capability-driven test that enumerates **all applicable targets** exposed by the validated hardware profile/schema.
- For the Scarlett 18i20 (3rd Gen), FULL coverage must account for the complete applicable device shape: inputs, outputs, every declared output pair, mixer slots, mix lanes, monitoring/settings surfaces and all public feedback definitions/probes.
- Report behavior **per target/pair**. Never infer an odd/even, left/right, leader/follower or model-wide rule solely from one or a few samples.
- `UNKNOWN` availability remains no-write. `UNAVAILABLE` remains skipped. Missing capability remains explicit rather than guessed.
- Restoration is local and immediate after each routing/topology probe. A restore failure is a quarantine/HARD-ABORT condition according to the safety contract; do not continue speculative routing writes after an unconfirmed restore.
- Other Focusrite Control devices may use the same generic inventory/report engine, but remain **read-only discovery/research** until a model-specific profile has real hardware evidence and explicit write enablement.

The historical Outputs 3–4 probe is evidence for that pair only. Keep it as a regression/research reference; do not make `PAIR34` a normal TestBench mode or use it as a substitute for whole-device coverage.

## Feedback validation completeness and manual interaction

Presence of a feedback definition or a rendered button is **not** sufficient hardware validation. The project objective is to account for every public feedback instance and distinguish what was actually exercised.

For every FULL campaign:

- enumerate all r9 logical feedback probes and definitions (currently 829 probes / 31 definitions on the validated 18i20 matrix);
- give every probe/definition an explicit outcome such as independently validated PASS/FAIL, temporarily `EVAL_ONLY`, `MANUAL_PENDING`, unavailable/unsupported, or another documented status;
- when a server-confirmed variable can independently predict a feedback result, compare the rendered feedback with that variable instead of leaving it permanently `EVAL_ONLY`;
- meter feedbacks must use their real numeric server-confirmed meter value and configured threshold as the oracle; a static false state alone does not prove the true branch, so provide a guided manual signal/silence exercise to observe threshold crossings where practical;
- controlled automatic action cycles should be used to exercise both true/false feedback states when the action is already approved, reversible and safely isolated;
- controls that require a **physical/manual user action** must have an explicit guided manual phase. Prompt for one operation at a time, observe only server-confirmed state/feedback, allow `SKIP` when the physical control/path is not available, and record `MANUAL_PENDING` rather than pretending success;
- read-only physical observations may be included in the manual plan. In particular, Monitor gain item `1677` may only be observed while the user physically moves the Monitor control; this must never create a Monitor set/adjust action, preset, raw-write path or optimistic state;
- physical-origin monitoring controls may be observed manually when present, but any temporary audible/routing risk requires the same explicit physical-isolation agreement as the hardware campaign;
- manual phases must never silently alter Focusrite software, firmware, routing or clocking. Disruptive items remain excluded unless the user explicitly agrees to a dedicated test.

A FULL report must clearly separate **automatic feedback coverage**, **manual feedback coverage**, remaining `MANUAL_PENDING` work and unsupported/excluded surfaces. Do not describe a campaign as complete feedback validation while material probes remain merely `EVAL_ONLY` or unattempted without explaining why.

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
- Unknown current state must never be converted into a guessed state-derived hardware write.
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
- live/private Companion exports containing user connection configuration;
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
9. update `docs/CURRENT_HANDOFF.md` with the actual result and next step;
10. only then promote or hand over.

Do not send a chain of partially checked fixes. Diagnose the full failure chain first.

## Current publication / Slack state

The first Bitfocus repository request was posted in Companion Slack `#module-development` for the Scarlett 18i20 module. Bryce Seifert suggested that `focusrite-control` may be the better repository/module scope because the transport is Focusrite Control Server, and offered hardware for future testing.

The project replied that only Scarlett 18i20 (3rd Gen) is validated today and that broader naming is acceptable if Bitfocus prefers it, without claiming untested devices.

The official Bitfocus repository/name decision is still pending. See `docs/BITFOCUS_SLACK_AND_RELEASE.md`.

Do not tag/claim a stable public Bitfocus release from this personal repository as a substitute for the official workflow. The eventual stable target remains **v1.0.0** unless maintainers direct otherwise.
