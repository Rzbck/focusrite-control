# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T15:12+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `WAITING_FOR_OFFICIAL_BITFOCUS_REPOSITORY_NAMING_DECISION`
Exact fully validated final software-audit checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840`
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

## Current state — software audit COMPLETE

The final clean Windows software audit completed successfully on exact checkpoint:

`fba6d977a59b6381ae11c736a68fc809afb55840`

Observed on the real Windows host from the clean audit worktree:

- local-only branch: `local/focusrite-final-audit-20260824`;
- canonical RUN HEAD: `fba6d977a59b`;
- `git status --short` before run: empty;
- Node 22.23.2: PASS;
- Yarn 4.17.0 via Corepack: PASS;
- immutable dependency install: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS (`Source manifest validation: OK`);
- Node tests: **192/192 PASS**, fail 0;
- Companion package build: PASS;
- package produced: `focusrite-scarlett-18i20-0.1.16.tgz`;
- `RUN OK - branche courante validee et packagee` observed;
- hardware writes: **NO**;
- SAFE/FULL/direct probe: **NO**;
- newly built audit package installed/activated in Companion: **NO**.

The final failing documentation regression from the previous run was only a Markdown-sensitive regex (`Do **not** create...` versus literal `Do not create...`). The regex was fixed without weakening the safety rule; the following clean rerun passed all 192 tests.

This handoff update is bookkeeping after the green gate. If the live branch HEAD is newer than `fba6d977...`, inspect the diff first; do not assume any newer commit is itself software-validated unless it is handoff/docs-only or has its own completed gate evidence.

## Current objective

The current local development/validation work is complete. The next external blocker is the official Bitfocus repository/naming decision.

**Do not rerun FULL.**

Do not rerun the direct Mix probe. Do not manufacture Mix B-F baselines. Do not run another hardware campaign merely because some meter paths remain safely unexercised.

Do not install audit/debug `.tgz` builds over the exact audited 0.1.16 currently in Companion.

## Production package checkpoints

Keep Companion on the exact audited/live-validated package already installed:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do **not** replace it with the `.tgz` produced by the final audit worktree solely because that build passed the software gate.

Canonical V8 FULL package remains:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

0.1.15 is the exact package used for the completed V8 FULL-from-zero hardware campaign. 0.1.16 is the later restrictive output-availability safety hardening and adds no hardware write capability.

## Production / RC safety audit

Confirmed from current source/tests and preserved by the final 192/192 gate:

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

## Validation tooling status

Historical validation-launcher failures are resolved and regression-covered:

- temporary UPDATE path now receives the real repository path;
- historical malformed CRLF launcher blob is guarded by Git-blob LF tests;
- updater refreshes tracked state before deciding the worktree is clean;
- virgin-worktree Node bootstrap works on the user's older Windows PowerShell without requiring `Get-FileHash` or `Expand-Archive`;
- final bootstrap path was physically exercised and the final full gate passed.

The original `E:\_Project\focusrite-control` checkout still contains a safety stash created during recovery. The clean audit worktree was used for final validation. Do not pop/delete that stash or clean the original checkout casually; cleanup can be done deliberately as a separate software-only housekeeping step.

## Privacy / attribution

Never publish real serials, private hostnames, server client IDs, client keys, raw private XML/captures, live Companion exports containing private connection data, private diagnostics/logs or user-specific paths.

Preserve MIT/third-party notices and do not claim all protocol knowledge was independently discovered.

## Publication state

This remains a personal development mirror, not the official Bitfocus repository.

Bitfocus Slack `#module-development` repository/name decision is still pending. Bryce Seifert suggested `focusrite-control` may be the better transport-level scope and offered future hardware; validated hardware scope remains only Scarlett 18i20 (3rd Gen).

Do not rename public IDs/packages or broaden support until maintainers decide.

When the official repository exists:

1. inspect exact repo/default branch/seed files/permissions;
2. compare against the cleaned current RC / validated checkpoint `fba6d977...`;
3. follow maintainer PR/CI workflow rather than overwriting blindly;
4. run official CI plus local tests;
5. keep stable target v1.0.0 unless maintainers direct otherwise;
6. submit a Developer Portal tag only after clean CI plus hardware/action audit.

## Exact immediate next step

**Wait for the official Bitfocus repository/naming decision.**

Do not invent more hardware tests while waiting.

If a future conversation resumes this project, first execute the MANDATORY STARTUP FRESHNESS GATE at the top of this file. If the official Bitfocus repository now exists, inspect that repository before changing public naming/scope or attempting publication.
