# AI / contributor handoff

Updated: 2026-08-21

## Read first

1. `README.md`
2. `AI_PROJECT_RULES.md`
3. `docs/PROJECT_STATE.md`
4. `docs/STATE_CONTRACT.md`
5. `docs/BITFOCUS_SLACK_AND_RELEASE.md`
6. `docs/GITHUB_WORKFLOW.md`
7. `docs/AUTOMATED_DIAGNOSTICS.md`
8. branch-specific research document only when revisiting completed research
9. current code/tests

Do not restart from chat assumptions when repository evidence exists.

## Project goal

Build and publish a safe Bitfocus Companion module for **Scarlett 18i20 (3rd Gen)** over the local Focusrite Control Server protocol. Only that hardware is supported today.

Official Bitfocus repository/module naming is still pending after the discussion in Companion Slack `#module-development`; Bryce Seifert suggested the eventual scope/name may be `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.

Stable official target remains `v1.0.0` unless Bitfocus maintainers direct otherwise.

## Current development version

Development candidate: **v0.1.13**.

Immutable checkpoint: `backup/v0.1.12-user-loaded-20260820`.

The v0.1.13 state-contract RC passed the Windows validation gate on Node 22.23.2:

- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- Node tests: **31/31 PASS**;
- `companion-module-build`: PASS;
- automated RC hardware writes: none.

Public sanitized status:

`diagnostics/readback-results:diagnostics/runtime/latest-rc-state-contract-validation.md`

Hardware/runtime evidence already confirms:

- dynamic discovery + dynamic TCP port;
- exact Scarlett 18i20 (3rd Gen) detection;
- module's own server-assigned client ID matched to Remote Devices authorization;
- writes blocked until authorized;
- server-confirmed state only;
- final Companion status `OK`.

Guarded reversible hardware testing previously passed for Air 1–8, Pad 1–8, Input 1/2 Line↔Inst, Monitor Mute, Monitor Dim and Talkback. These mappings/write paths remain valid evidence.

Monitor gain item `1677` is read-only. Do not re-add Monitor set/adjust actions/presets/raw write access.

## Cold-start readback result — definitive

Public sanitized evidence:

`diagnostics/readback-results:diagnostics/runtime/latest-readback.md`

- Phase A cold connect + one subscribe: **3/21**;
- Phase B unsubscribe → subscribe: **3/21**;
- Phase C clean reconnect + subscribe: **3/21**.

Present: Input 1 Mode, Input 2 Mode, Talkback.

Missing in all phases: Air 1–8, Pad 1–8, Monitor Mute, Monitor Dim.

Phase B received a **404-item** state packet and still omitted those 18 values. Timing/re-subscribe/reconnect research is closed. Do not add delays/loops, write-to-warm behavior, stale persistence-as-current, or an invented `get` request.

## Supported state contract

The missing cold-start values are no longer treated as an absolute blocker for the already hardware-tested controls.

Production safety contract:

- explicit target actions (`On`, `Off`, explicit mode/value) may write without knowing the previous value, but only when connected, verified writable and this module's own client is authorised;
- state-derived actions (`Toggle`, cycle, relative adjustment) require current server-confirmed state and are blocked when it is missing/invalid;
- `setItem()` never performs optimistic state updates; feedback/variables change only from server-confirmed values;
- raw variables remain blank while state is unknown;
- no write is performed merely to warm/discover current state.

The RC added `docs/STATE_CONTRACT.md` plus regression tests that lock this behavior. Production control logic was already correct; the release-hardening work adds tests/docs/validation tooling and repository formatting, not a new hardware write path.

Do not repeat broad hardware cycling merely because of version churn when source behavior is unchanged. A changed hardware-relevant path still requires explicit real-device confirmation.

## Public/static protocol research — completed

Public Control Server clients inspected include Mathieu2301, raduvarga, sserolf, tally-server, enum-labs, dounix and `sebastianrau/focusrite-mackie-control` (18i20-specific schema/client). All inspected clients use the device-arrival + subscribe + set/event model. None demonstrates a separate read request.

Static result:

`diagnostics/readback-results:diagnostics/runtime/latest-static-protocol-scan.md`

Real host: 2 Focusrite processes / 4 EXE-DLL files scanned read-only; known protocol tokens/roots included `device-subscribe`, `keep-alive`, `server-announcement`, `set`; no additional concrete XML root was found. Do not rerun unchanged static scanning.

## Passive Pktmon research — completed/inconclusive

Branch: `debug/official-client-passive-session`.

Result:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer.md`

Status:

`diagnostics/readback-results:diagnostics/runtime/latest-official-session-observer-status.md`

The successful run reached the 25-second window and the user closed/reopened Focusrite Control during the timer. Harness status: `SUCCESS / complete / ok`.

The sanitized result still contained **0 packet snapshots / 0 TCP stream chunks / 0 complete Focusrite frames**. Do not repeat the same Pktmon experiment.

Historical correction: an earlier attempt also reached the timer according to the user's direct observation. Its later status/report handling failed. Treat it as a harness/reporting failure, not as a pre-capture failure and not as protocol evidence.

## Official-client memory research — completed/inconclusive

Branch: `debug/official-client-memory-observer`.

Result:

`diagnostics/readback-results:diagnostics/runtime/latest-official-client-memory-observer.md`

Status:

`diagnostics/readback-results:diagnostics/runtime/latest-official-client-memory-observer-status.md`

Real Windows result:

- observer: `SUCCESS / complete / ok`;
- one official process attempted/scanned;
- fresh GUI restart detected: **YES**;
- scan safety limit not reached;
- concrete framed roots found: `client-discovery`, `server-announcement`;
- no concrete `client-details`, `device-subscribe` or `set` frame survived in the sampled process memory;
- no guarded Core IDs were seen in a concrete `set` frame.

Important correction: the first generated report labeled `client-discovery` and `server-announcement` as unknown because the observer's `KNOWN_ROOTS` list omitted them. They are already-known protocol roots. The classifier is fixed and regression-tested on the memory branch. **Do not interpret the original UNKNOWN decision text as a new read command.**

The memory result is inconclusive for cold-state readback. Do not escalate to more invasive capture/memory techniques unless a concrete release requirement makes that necessary.

## Current development objective

The v0.1.13 state-contract tree is validated. Promote it into `main` through a reviewable branch/PR without carrying temporary repair history into the integration branch.

After promotion, wait for the official Bitfocus repository/name decision before changing public module scope or claiming support beyond Scarlett 18i20 (3rd Gen).

When the official repository exists:

1. inspect exact repo name, default branch, seed files and permissions;
2. compare them with the cleaned current source;
3. follow the expected branch/PR workflow rather than overwriting;
4. run Bitfocus CI and local tests;
5. keep stable public target at v1.0.0 unless maintainers direct otherwise;
6. only submit a tag to the Bitfocus Developer Portal after hardware/action audit and CI are clean.

## Repository workflow

Personal development repository: `Rzbck/focusrite-control`.

**Do not use GitHub Actions in this personal repository.** Validation is local through checked-in Node/Yarn/Windows runners. The future official Bitfocus repository may use maintainer-required CI.

Branches:

- `main` — integration baseline + current handoff/docs;
- `backup/v0.1.12-user-loaded-20260820` — immutable known-good checkpoint;
- `rc/v0.1.13-state-contract` — validated release-hardening source branch;
- `debug/*` — completed/bounded research branches;
- `diagnostics/readback-results` — sanitized machine-generated results only.

Use `UPDATE_AND_RUN.bat`. Root `RUN.bat` keeps one final pause so the human can read the final status and press a key to close.

## Privacy / automatic diagnostics

Before asking the user for a local log, fetch the applicable file from `diagnostics/readback-results`.

Never auto-upload:

- `.local-logs`;
- `.local-captures`;
- ETL/PCAPNG;
- raw XML/protocol captures;
- raw/private process memory;
- private paths;
- hostname/endpoints/ports;
- serial/client keys/client IDs/device IDs;
- private device XML/diagnostics.

Every automatic diagnostic path must have a fixed sanitized schema, rejection tests and remote content verification.

## Never do

- do not guess missing values as `false`;
- do not use optimistic feedback/state;
- do not write merely to discover current state;
- do not re-add Monitor gain `1677` writes;
- do not expose unknown raw writes, firmware/reset/restore/snapshot commands or read-only status/meter writes;
- do not expand hardware support without physical testing;
- do not update Focusrite software/firmware/routing/settings without explicit user agreement;
- do not publish private captures/identifiers;
- do not add GitHub Actions to this personal repo.
