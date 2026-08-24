# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T14:48+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `OLD_CHECKOUT_CRLF_BLOB_POISONED_USE_CLEAN_WORKTREE_FOR_FINAL_GATE`
Last fully validated production software checkpoint: `3e35ac16812f3187fa23bad3542393be638f566b`
Canonical production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — ALWAYS DO THIS FIRST

Future AI/contributors must never resume from an embedded SHA, old chat summary, copied handoff or remembered branch without first checking the live repository.

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. identify the branch that actually owns the current objective;
2. fetch that remote branch and resolve its **current HEAD**;
3. inspect the **latest relevant commits/diff** since the last validated checkpoint;
4. read `docs/CURRENT_HANDOFF.md` from that live branch/ref;
5. inspect the current code/tests affected by the objective;
6. inspect the newest sanitized validation/hardware result when relevant;
7. reconcile any **newer completed result pasted/validated by the human user**;
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

Hardware investigation for the current meter issue is complete. **Do not rerun FULL**, do not rerun the direct Mix probe, and do not manufacture Mix B-F baselines.

Current work is only the final local software/release-documentation audit of the 0.1.16 development RC while waiting for the official Bitfocus repository/name decision.

The current audit series changes launchers/docs/tests only. No production `src/` hardware behavior has changed.

## Windows gate / launcher failure chain

### Attempt 1 — Prettier-only blocker

On real Windows, `89d0b6165325...` reached the software gate:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier FAIL on one formatting-only assertion in `test/remote-devices-authorization.test.js`;
- ESLint/manifest/tests/package not reached;
- hardware writes NO;
- SAFE/FULL/direct probe NO;
- package installation NO.

The exact Prettier output was applied in `51bfcc34176c8575edd1b337eb1d2698f357467e`.

### Attempt 2 — temporary UPDATE path bug

A later local `UPDATE_AND_RUN.bat` failed with:

`ERREUR : ce dossier n'est pas un depot Git clone.`

Root cause: a temporary copy of `UPDATE.bat` derived `%TEMP%` as the repository path. The validation branch now uses the already-proven debug pattern: the stable temporary UPDATE worker receives the real `REPO_DIR` explicitly and the launcher returns to the real repository before running the gate. Regression coverage rejects the broken invocation.

### Attempt 3 — pull refused local `UPDATE_AND_RUN.bat`

Standalone `UPDATE.bat` then fetched the remote branch but `git pull --ff-only` refused because local `UPDATE_AND_RUN.bat` would be overwritten. The old updater had not detected that tracked modification before pull. Updater hardening now force-refreshes the index and checks tracked plus untracked changes before pull.

### Attempt 4 — stash proved the old checkout is structurally dirty

The user then ran the explicit recovery commands on local HEAD `89d0b6165325`:

- `git update-index --really-refresh` reported `UPDATE_AND_RUN.bat: needs update`;
- `git status --short -- UPDATE_AND_RUN.bat` reported `M UPDATE_AND_RUN.bat`;
- a targeted safety stash succeeded and preserved the local launcher;
- the stash operation emitted many whitespace warnings;
- immediately afterward, `git pull --ff-only` still refused the same `UPDATE_AND_RUN.bat`;
- local HEAD remained `89d0b6165325`;
- `git status --short` still reported `M UPDATE_AND_RUN.bat`;
- no merge/reset occurred;
- no software gate ran;
- no package was built/installed;
- no hardware write/probe occurred.

Root cause is now confirmed from the Git objects themselves:

- `.gitattributes` requires `*.bat text eol=crlf`, meaning Git blobs should remain canonical LF and Windows checkout should provide CRLF;
- the historical `89d0b616...` blob for `UPDATE_AND_RUN.bat` was stored with literal CRLF bytes directly in the Git blob;
- Git therefore cleans the Windows worktree to LF for comparison against an index blob that itself contains CRLF and sees the file as modified again immediately;
- this explains why a successful stash could not make that old checkout clean;
- the current remote `UPDATE_AND_RUN.bat` blob is canonical LF.

This malformed historical blob came from repository/API editing, not from a user hardware action.

Regression coverage now requires `UPDATE.bat`, `UPDATE_AND_RUN.bat` and the canonical meter launcher to contain no CR byte in their **Git blobs**. Windows CRLF remains provided by `.gitattributes` at checkout time.

## Recovery decision — stop repairing the poisoned worktree in place

Do **not** run more stash/pull/reset/clean experiments on the current `E:\_Project\focusrite-control` checkout for this audit. Keep the existing safety stash untouched.

Use the same Git repository to create a **separate clean worktree** directly from the latest remote validation HEAD. This bypasses the historical malformed index/blob state without deleting or overwriting the original checkout.

From PowerShell in the existing repository:

```powershell
cd E:\_Project\focusrite-control
git fetch origin "+refs/heads/testbench/meter-routing-exact-restore:refs/remotes/origin/testbench/meter-routing-exact-restore"
git worktree add -b local/focusrite-final-audit-20260824 E:\_Project\focusrite-control-audit refs/remotes/origin/testbench/meter-routing-exact-restore
cd E:\_Project\focusrite-control-audit
git rev-parse --short=12 HEAD
git status --short
.\RUN.bat
```

The temporary `local/focusrite-final-audit-20260824` branch is local-only. Do not push it. The exact HEAD must equal the live remote branch HEAD fetched immediately before the worktree is created.

Do not pop/reapply/delete the existing `FOCUSRITE SAFETY - local UPDATE_AND_RUN recovery 20260824` stash during the audit.

After the final gate is green, the temporary worktree/local branch and the poisoned historical checkout can be cleaned up deliberately in a separate software-only step. Do not mix that cleanup into the validation gate.

## Production package checkpoint

Keep Companion on the exact audited/live-validated package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do **not** install a `.tgz` rebuilt by TestBench/debug/audit branches over that package.

Canonical V8 FULL package remains 0.1.15 with SHA-256:

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

No production `src/` file changed during the current documentation/launcher audit series.

## Current RC safety audit

Confirmed from live source/tests:

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

When the official repository exists: inspect exact repo/default branch/seed/permissions, compare against this RC, follow maintainer PR/CI workflow, keep stable target v1.0.0 unless directed otherwise, and submit a Developer Portal tag only after clean CI plus hardware/action audit.

## Exact immediate next step

1. fetch the live validation branch from the existing repository;
2. create the clean local-only audit worktree from that exact remote HEAD;
3. confirm exact HEAD and an empty `git status --short` inside the audit worktree;
4. run `RUN.bat` there;
5. require dependencies PASS, Prettier PASS, ESLint PASS, manifest PASS, all Node tests PASS/fail 0, package build PASS and RUN OK;
6. perform **no SAFE/FULL/direct probe/hardware test**;
7. do not install the audit package into Companion;
8. leave the original checkout and its safety stash untouched until the gate is green;
9. after green gate, update this handoff with exact validated HEAD/test count and move to `WAITING_FOR_OFFICIAL_BITFOCUS_REPOSITORY_NAMING_DECISION` unless a real software defect remains.
