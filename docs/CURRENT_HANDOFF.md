# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T15:10+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `REMOTE_DEVICES_MARKDOWN_REGEX_FIXED_RERUN_REQUIRED`
Last fully validated production software checkpoint: `3e35ac16812f3187fa23bad3542393be638f566b`
Latest clean audit worktree run attempted at: `27358ec4ebcefab7e9924bab7399dfe82288a08c`
Prepared Remote Devices regex fix checkpoint: `3a6616bc34f2615481d2a4bef27fe4012236cc6b`
Canonical production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — ALWAYS DO THIS FIRST

Future AI/contributors must never resume from an embedded SHA, old chat summary, copied handoff, uploaded handoff or remembered branch without first checking the live repository.

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. identify the branch that actually owns the current objective;
2. fetch that remote branch and resolve its **current HEAD**;
3. inspect the **latest relevant commits/diff** since the last validated checkpoint;
4. read `docs/CURRENT_HANDOFF.md` from that live branch/ref;
5. inspect the current code/tests affected by the objective;
6. inspect the newest sanitized validation/hardware result when relevant;
7. reconcile any **newer result validated by the human user**;
8. only then state where the project is and choose the next action.

**An SHA written inside this file is a checkpoint, not permission to skip fetching the live branch.**

Evidence priority:

1. newest explicit physical-hardware evidence / completed human-validated run;
2. newest completed software gate evidence;
3. current checked-in code/tests and latest relevant commits;
4. this living handoff;
5. broader project/history documents;
6. older captures/assumptions.

Always distinguish **hardware-tested**, **software-tested**, **implemented**, **schema-observed**, **research-only**, **pending**, and **unsupported**.

## Current objective

The hardware investigation for the current meter issue is complete.

- **Do not rerun FULL**.
- Do not rerun the direct Mix probe.
- Do not manufacture Mix B-F baselines.
- Do not install audit/debug `.tgz` builds over the exact audited 0.1.16 currently in Companion.

Current work is only the final local software/release-documentation audit while waiting for the official Bitfocus repository/name decision.

No current audit commit changes production `src/` hardware behavior.

## Latest clean Windows audit run

The existing clean audit worktree was fast-forwarded to exact HEAD:

`27358ec4ebcefab7e9924bab7399dfe82288a08c`

Observed on the real Windows host:

- local-only branch: `local/focusrite-final-audit-20260824`;
- `git status --short` before run: empty;
- canonical RUN HEAD: `27358ec4ebce`;
- portable Node 22.23.2 already present and reused successfully;
- Yarn 4.17.0 via Corepack: **PASS**;
- immutable dependency install: **PASS**;
- Prettier: **PASS**;
- ESLint: **PASS**;
- source manifest: **PASS**;
- Node tests: **191 PASS / 1 FAIL / 192 total**;
- Companion package build: **not reached** because the test phase failed;
- hardware writes: **NO**;
- SAFE/FULL/direct probe: **NO**;
- Companion package installed/replaced: **NO**.

The single failing test was:

`direct research does not create extra Remote Devices clients without an explicit reason and warning`

Root cause is a brittle documentation regex, not a missing safety rule:

- `docs/REMOTE_DEVICES_AUTHORIZATION.md` correctly says `Do **not** create a second direct TCP client...`;
- the test searched only the literal unformatted text `Do not create a second direct TCP client...`;
- Markdown emphasis around `not` therefore caused the assertion to fail even though the rule was present.

Fix prepared in `3a6616bc34f2615481d2a4bef27fe4012236cc6b`:

- the test now accepts `not` with or without Markdown bold markers;
- the actual Remote Devices safety documentation is unchanged;
- no production code or hardware behavior changed.

Do not call the current branch software-green until one complete rerun reaches package build and `RUN OK`.

## Prior audit failures already diagnosed and fixed

These are historical only; do not repeat their old recovery experiments.

1. A Prettier-only assertion formatting issue was fixed.
2. `UPDATE_AND_RUN.bat` once launched a temporary `UPDATE.bat` that derived `%TEMP%` as the repo; the real `REPO_DIR` is now passed explicitly.
3. Historical HEAD `89d0b616...` contained a malformed CRLF `.bat` Git blob. The original checkout is intentionally left untouched with its safety stash; the clean audit worktree bypasses it.
4. A virgin worktree exposed that `ensure-node22.ps1` depended on `Get-FileHash` / potentially `Expand-Archive`. The bootstrap now uses .NET SHA-256 and has a .NET ZIP fallback. This path was physically exercised on the user's Windows host and successfully installed/validated Node 22.23.2.
5. Launcher Git blobs are regression-tested to remain canonical LF while `.gitattributes` provides CRLF at Windows checkout time.

Do not go back to the poisoned original checkout for validation. Continue in the existing clean audit worktree.

## Clean audit worktree rule

Keep the original checkout and its safety stash untouched until the final audit is green.

Use:

`E:\_Project\focusrite-control-audit`

The local audit branch is local-only and must not be pushed.

Update it only by fetching the live validation ref and fast-forwarding to that exact remote HEAD.

## Production package checkpoint

Keep Companion on the exact audited/live-validated package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do **not** install a `.tgz` rebuilt by TestBench/debug/audit branches over that package.

Canonical V8 FULL package remains 0.1.15:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

0.1.15 is the exact package used for the completed V8 FULL-from-zero hardware campaign. 0.1.16 is the later restrictive output-availability safety hardening and adds no hardware write capability.

## Production software validation checkpoint

Exact fully validated production checkout:

`3e35ac16812f3187fa23bad3542393be638f566b`

Observed local Windows gate there:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- tests **186/186 PASS**;
- Companion package build PASS;
- RUN OK.

No production `src/` file changed during the current launcher/docs/bootstrap audit series.

## Current RC safety audit

Confirmed from current production source/tests:

- package version remains 0.1.16;
- supported hardware claim remains only `Scarlett 18i20 (3rd Gen)`;
- Control Server TCP port and active device ID remain dynamic;
- no production hardcoded TCP fallback port;
- stable private Companion client identity is preserved;
- approval applies only to this module's own server-assigned client ID;
- writes remain blocked until authorised;
- feedbacks/variables remain server-confirmed only;
- unknown state never becomes optimistic success or a guessed state-derived write;
- output availability policy fails closed for false/blank/unknown explicit availability;
- Advanced Raw cannot bypass the hardware/evidence/availability policy;
- Monitor gain item **1677 remains read-only** and absent from actions/presets/raw writes;
- no analogue input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no physical Monitor level control;
- no firmware/reset/restore/snapshot write surface;
- attribution preserves upstream Bitfocus MIT notice and acknowledges public prior protocol work.

Disruptive Device Preset, Clock Source, Sample Rate and SPDIF/Digital I/O mode remain implemented/schema-known but are not claimed as fully hardware-tested by the broad automatic campaign.

## Meter closure / final classification

There are 46 meter paths:

- inputs: **8/8 closed**;
- outputs: **4/26 closed**;
- mixes: **2/12 closed**;
- total: **14/46 closed**;
- mismatch: **0**.

Mix A L/R remain closed from exact-baseline hardware evidence.

Mix B-F remain **baseline-unknown / safely non-actionable**:

- `ACTIONABLE=0`;
- `ALREADY_CLOSED=2`;
- `BASELINE_UNKNOWN=10`.

Do not infer right-lane state from left-lane state, assume mute/solo defaults, reconnect repeatedly, or write merely to manufacture a baseline.

The completed direct read-only Mix research reproduced the missing B-F state pattern through a fresh Control Server subscription. That research is complete and retired for this question.

## Remote Devices authorization — mandatory before any write

The canonical normal client is the existing approved **Companion Scarlett 18i20** connection.

Before any future write-capable hardware test:

1. **reuse the existing Companion Focusrite connection**;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm `Companion Scarlett 18i20` remains approved;
4. require authorization for this module's own current server-assigned client ID;
5. if approval/preflight is absent, classify **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

Read-only `device-subscribe` not requiring approval does not weaken the write rule.

### No extra direct clients by default

Do not create a new direct Control Server client merely to inspect state Companion can already expose. A direct research client may create another Remote Devices row and requires an explicit reason plus user warning/agreement before launch.

**Never reuse/copy the Companion private client key into another process.**

Never run a direct research client concurrently with SAFE/FULL/write-capable Companion validation.

## Permanent unsupported/safety rules

Keep unchanged:

- current hardware support only Scarlett 18i20 (3rd Gen);
- Monitor gain 1677 read-only;
- no input preamp gain, direct input mute, per-channel phantom, Mic Kill or physical Monitor level;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no write when explicit output availability is false/unknown;
- server-confirmed feedback/state only;
- dynamic Control Server port/device ID;
- no Focusrite software/firmware/routing/hardware setting changes without explicit user agreement.

## Privacy / attribution

Never publish real serials, private hostnames, server client IDs, client keys, raw private XML/captures, live Companion exports containing private connection data, private diagnostics/logs or user-specific paths.

Preserve MIT/third-party notices and do not claim all protocol knowledge was independently discovered.

## Publication state

This remains a personal development mirror, not the official Bitfocus repository.

Bitfocus Slack `#module-development` repository/name decision is still pending. Bryce Seifert suggested `focusrite-control` may be the better transport-level scope and offered future hardware; validated hardware scope remains only Scarlett 18i20 (3rd Gen).

Do not rename public IDs/packages or broaden support until maintainers decide.

When the official repository exists:

1. inspect exact repo/default branch/seed files/permissions;
2. compare against this cleaned RC;
3. follow maintainer PR/CI workflow;
4. run official CI plus local tests;
5. keep stable target v1.0.0 unless directed otherwise;
6. submit a Developer Portal tag only after clean CI plus hardware/action audit.

## Exact immediate next step

In the existing clean audit worktree:

1. fetch the live `testbench/meter-routing-exact-restore` remote ref;
2. fast-forward the local-only audit branch to that exact remote HEAD;
3. confirm exact HEAD and empty `git status --short`;
4. run `RUN.bat`;
5. require dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, all Node tests PASS/fail 0, package build PASS and RUN OK;
6. perform **no SAFE/FULL/direct probe/hardware test**;
7. do not install the audit package into Companion;
8. leave the original checkout and its safety stash untouched until the gate is green;
9. after a green gate, update this handoff with exact validated HEAD/test count and move to `WAITING_FOR_OFFICIAL_BITFOCUS_REPOSITORY_NAMING_DECISION` unless a real software defect remains.
