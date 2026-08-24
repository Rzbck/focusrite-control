# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T14:30+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `PRETTIER_FAIL_FIXED_RERUN_REQUIRED`
Last fully validated production software checkpoint: `3e35ac16812f3187fa23bad3542393be638f566b`
Pre-audit live validation HEAD: `f1f05732b3ca0f964681550484d18177ff5ec2d6`
Latest attempted audit-gate HEAD: `89d0b6165325e9966215f8de31e652cec445e0b3`
Prettier-only fix checkpoint: `51bfcc34176c8575edd1b337eb1d2698f357467e`
Production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — ALWAYS DO THIS FIRST

Future AI/contributors must **never** resume from an embedded SHA, old chat summary, copied handoff or remembered branch without first checking the live repository.

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. identify the branch that actually owns the current objective;
2. fetch that remote branch and resolve its **current HEAD**;
3. inspect the latest relevant commits/diff since the last validated checkpoint named in this handoff;
4. read `docs/CURRENT_HANDOFF.md` from that live branch/ref;
5. inspect the current code/tests affected by the objective;
6. inspect the newest available sanitized validation/hardware result when relevant;
7. reconcile any newer completed result pasted/validated by the human user;
8. only then state where the project is and choose the next action.

An SHA written inside this file is a checkpoint, not permission to skip fetching the live branch. If a newer completed user result or current checked-in code contradicts this handoff, use the newer validated evidence and update this file immediately.

Evidence priority:

1. newest explicit physical-hardware evidence / completed human-validated run;
2. newest completed software gate evidence;
3. current checked-in code/tests and latest relevant commits;
4. this living handoff;
5. broader project/history documents;
6. older captures/assumptions.

Do not call pending/unvalidated code green merely because it is newer. Always distinguish **hardware-tested**, **software-tested**, **implemented**, **schema-observed**, **research-only**, **pending**, and **unsupported**.

## Current objective / immediate project phase

The current hardware investigation is complete. **Do not rerun FULL** for the current meter issue and do not continue trying to manufacture Mix B-F baselines.

Current work is release/documentation/software audit of the 0.1.16 development RC while waiting for the official Bitfocus repository/name decision.

This audit series must not change production hardware behavior unless a concrete source defect is found. After the final docs/rules/tests changes, run one clean local Windows software gate. That gate is software-only and does **not** imply SAFE/FULL/direct hardware testing.

## Latest local audit-gate attempt — formatting blocker only

The user ran `UPDATE_AND_RUN.bat` on the real Windows host and selected `testbench/meter-routing-exact-restore`.

Canonical synchronized context observed by the user:

- branch: `testbench/meter-routing-exact-restore`;
- HEAD: `89d0b6165325`;
- handoff blob: `0389ca470db0`;
- Node: 22.23.2;
- Yarn: 4.17.0.

Observed gate result:

- dependencies / immutable install: **PASS**;
- Prettier: **FAIL** on exactly `test/remote-devices-authorization.test.js`;
- the diagnostic showed one formatting-only change: a three-line `assert.match(...)` around the Companion private-client-key regex must be one line;
- the Prettier diagnostic explicitly modified no source file;
- ESLint, source manifest, Node tests and Companion package build were **not reached** because the gate stopped at Prettier;
- hardware writes: **NO**;
- SAFE/FULL/direct probe: **NO**;
- Companion package installed/replaced: **NO**.

The exact Prettier output was applied without changing test behavior in commit:

`51bfcc34176c8575edd1b337eb1d2698f357467e`

Do not call the audit branch green yet. A complete software-only rerun is required after fetching the current live branch.

## Production package checkpoint

Keep Companion on the exact audited/live-validated package:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do **not** install a `.tgz` rebuilt by TestBench/debug/audit branches over that package.

Canonical V8 FULL package remains:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

The 0.1.15 package is the exact package used for the completed V8 FULL-from-zero hardware campaign. 0.1.16 is the later restrictive output-availability safety hardening; it adds no hardware write capability.

## Production software validation checkpoint

Exact fully validated production checkout:

`3e35ac16812f3187fa23bad3542393be638f566b`

Observed local Windows gate at that checkpoint:

- Node 22.23.2;
- Yarn 4.17.0;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- tests **186/186 PASS**;
- Companion package build PASS;
- RUN OK.

A compare from `3e35ac...` to pre-audit live validation HEAD `f1f057...` showed changes only in `UPDATE_AND_RUN.bat` and `docs/CURRENT_HANDOFF.md`; **no production `src/` file differed**. The current release-audit series intentionally changes only documentation/rules/tests unless a real source defect is discovered.

Because repository files have changed after the last green gate, do **not** call the current branch software-green until a fresh local gate passes on the final audit HEAD.

## Current RC source audit — reviewed against live pre-audit HEAD

The production source was reviewed directly from the live validation branch, not reconstructed from chat history.

Confirmed implemented/safety properties:

- package version is 0.1.16 and Companion API/runtime metadata remains node22/API 2.0 style;
- exact supported model gate remains `Scarlett 18i20 (3rd Gen)`;
- Control Server discovery and active device ID remain dynamic;
- auto mode has no hardcoded TCP fallback port;
- manual TCP port is only an explicit user-supplied value;
- stable private Companion client identity is preserved across reconnect/config updates;
- server approval applies only to this module's own current server-assigned client ID;
- `setValue()` blocks hardware writes unless `authorised === true`;
- `setItem()` blocks IDs outside the verified writable set;
- feedbacks/variables use server-confirmed state only;
- unknown/non-numeric state never becomes optimistic true state;
- Toggle/Cycle/relative actions refuse to derive writes from unknown state;
- output writes fail closed when explicit availability is false/blank/unknown and callbacks recheck live availability;
- output pair writes require both members to remain eligible;
- Advanced Raw is restricted by the same hardware/evidence/availability policy and cannot bypass it;
- Monitor gain item **1677 is read-only**, absent from writable IDs, Monitor set/adjust actions, +/- presets and Advanced Raw choices;
- no analogue input preamp gain action;
- no direct per-input hardware mute action;
- no per-channel phantom switching action;
- no Mic Kill;
- no firmware/reset/restore/snapshot write surface;
- third-party notice preserves the upstream Bitfocus MIT text and explicitly says protocol knowledge also used public prior work;
- private/local build/result/log paths are ignored by repository hygiene rules.

Implemented but not promoted to broad hardware-tested claims:

- disruptive Device Preset, Clock Source, Sample Rate and Digital I/O/SPDIF mode actions remain implemented/schema-known surfaces but were intentionally excluded from the broad automatic hardware campaign because they can alter routing/clocking/restart audio. Do not describe them as fully hardware-tested merely because they are implemented.

No production `src/` correction was identified during this audit pass.

## Documentation/test drift found during the audit

Two stale documentation issues were found and corrected in this audit series:

1. the shortened living handoff had lost phrases/sections required by `test/remote-devices-authorization.test.js`, so the current branch could not safely be assumed green merely because the older production checkpoint was green;
2. README still named `testbench/v0.2-hardware-validation` as the active validation branch and described 0.1.16 audit/preflight work as future work even though the production validation history is complete.

The first local audit-gate rerun then exposed one Prettier-only wrapping issue in the newly added Remote Devices regression assertion. That exact formatting diff was corrected in `51bfcc34176c...`.

This is documentation/test-state formatting drift, not a newly observed hardware or production-source failure.

## Permanent safety / deliberately unsupported

Current supported hardware remains exactly **Scarlett 18i20 (3rd Gen)**.

Keep these restrictions unchanged:

- Monitor gain item 1677 is read-only;
- no analogue input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no physical Monitor level control;
- no unsafe/unknown raw writes;
- no firmware/reset/restore/snapshot commands;
- no writes to outputs whose explicit availability is false or unknown;
- feedback/state must be server-confirmed;
- no optimistic success state;
- Control Server TCP port and device ID remain dynamic;
- do not update Focusrite software/firmware/routing/hardware settings without explicit user agreement.

## Meter closure / final current classification

There are 46 meter paths:

- inputs: **8/8 closed**;
- outputs: **4/26 closed**;
- mixes: **2/12 closed**;
- total: **14/46 closed**;
- mismatch: **0**.

Mix A left/right remain closed from earlier exact-baseline hardware evidence.

Mix B-F remain **baseline-unknown / safely non-actionable**. The read-only actionability proof remains:

- `ACTIONABLE=0`;
- `ALREADY_CLOSED=2`;
- `BASELINE_UNKNOWN=10`;
- Mix A L/R => `SKIP_ALREADY_CLOSED`;
- Mix B-F L/R => `SKIP_BASELINE_UNKNOWN`;
- no hardware write is attempted when exact restoration is unavailable.

Do not infer right-lane state from left-lane state and do not assume mute/solo defaults.

## Direct read-only Mix research — COMPLETE AND RETIRED FOR THIS QUESTION

Final completed direct research branch/checkpoint:

`debug/cold-start-readback @ 9bf133f72c29ecdae2b54c88afb99c8ecd6ee12a`

Completed physical/session observation:

- dynamic Control Server discovery PASS;
- exact model PASS;
- one read-only device subscription PASS;
- Playback dynamically detected as slot 3 / Playback 1 / stereo in that session; never hardcode slot 3;
- 10-second observation completed;
- hardware writes **NO**;
- Mix A left: gain SET, mute/solo MISSING;
- Mix A right: gain/mute/solo MISSING;
- Mix B-F left: gain SET, mute/solo MISSING;
- Mix B-F right: gain/mute/solo MISSING;
- summary `exact-presence=0/12; missing-any=12`.

For Mix B-F this reproduced the same missing-field pattern already seen through Companion. Therefore the missing B-F baselines are **not shown to be a Companion bootstrap bug**; a fresh normal Control Server subscription also does not supply them.

Decision:

- stop baseline manufacturing/guessing;
- no more repeated reconnect/tab-navigation/resubscribe guesses for this question;
- do not rerun the direct Mix probe merely to repeat this evidence;
- do not rerun FULL.

The direct session being sparser for Mix A does not invalidate the earlier exact-baseline Mix A hardware closure; it shows only that a fresh subscription is not a complete mixer-state snapshot.

## Remote Devices authorization — mandatory before any write

The canonical normal client is the existing approved **Companion Scarlett 18i20** connection.

Before any future write-capable hardware test:

1. reuse the existing Companion Focusrite connection; do not delete/recreate/edit its private identity;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm **Companion Scarlett 18i20** remains approved;
4. require preflight/module state to confirm authorization for this module's own current server-assigned client ID;
5. if approval/preflight is absent, classify **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

Read-only `device-subscribe` does not itself require Remote Devices approval. That does **not** weaken the write rule above.

### No extra direct clients by default

The completed `Focusrite ReadOnly Mix Probe` created a separate pending Remote Devices row because it used its own direct `client-details` / private research client key. It is no longer needed for this question. Do not approve/run it merely to repeat the completed observation.

Future diagnostics should use the existing Companion path whenever it can answer the question. A new direct Control Server research client is exceptional and may create another Remote Devices entry. Before creating one, tell the user explicitly and obtain agreement. Never reuse/copy the Companion private client key into another process to avoid an extra row, because duplicate sessions sharing one private identity would make client/session ownership ambiguous.

Never run a direct research client concurrently with SAFE/FULL/write-capable Companion validation.

## Privacy / attribution audit

Public-source rules remain:

- never publish real serials;
- never publish private hostnames;
- never publish server-assigned client IDs or private client keys;
- never publish raw private Control Server/device XML/captures;
- never publish live Companion exports containing private connection configuration;
- never publish private diagnostics/logs/user-specific paths;
- preserve MIT/third-party attribution;
- do not claim all protocol knowledge was independently discovered.

`THIRD_PARTY_NOTICES.md` preserves the relevant upstream Bitfocus MIT notice and acknowledges public prior Focusrite protocol research.

## Publication state

This repository remains a personal development mirror, not the official Bitfocus module repository.

Bitfocus Slack `#module-development` repository request is still awaiting the official repo/naming decision. Bryce Seifert suggested `focusrite-control` may be the better repository scope because the transport is Focusrite Control Server and offered hardware for future testing. The project explicitly kept validated hardware scope to Scarlett 18i20 (3rd Gen) only.

Do not rename public IDs/packages or broaden hardware support until Bitfocus maintainers decide the official repository/name.

When the official repository exists:

1. inspect its exact name/default branch/seed files/permissions;
2. compare it with the cleaned current RC;
3. use the maintainer-required PR workflow rather than overwriting blindly;
4. run official CI plus local tests;
5. keep stable target at **v1.0.0** unless maintainers direct otherwise;
6. submit a Developer Portal tag only after CI and hardware/action audit are clean.

## Exact immediate next step

Fetch the current live `testbench/meter-routing-exact-restore` branch, then run **one complete local software-only gate**:

`UPDATE_AND_RUN.bat`

Because the user's checkout is already on `testbench/meter-routing-exact-restore`, choose **`[1] Continuer sur testbench/meter-routing-exact-restore`** after the updater fetches the latest branch.

Requirements for calling the final audit HEAD green:

- current branch/HEAD/handoff fingerprint shown after synchronization;
- dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- all Node tests PASS / fail 0;
- Companion package build PASS;
- RUN OK.

This gate must perform **no SAFE/FULL/direct probe/hardware campaign**. Do not install the newly built audit package into Companion; keep the exact audited 0.1.16 already installed.

After that green gate, update this living handoff with the exact validated HEAD/test count and move to **WAITING_FOR_OFFICIAL_BITFOCUS_REPOSITORY_NAMING_DECISION** unless a real software audit failure remains.
