# AI / contributor handoff

Updated: 2026-08-24

> **Canonical resume pointer:** this file is no longer a duplicated project-state snapshot. Use the live root `HANDOFF` first, then `docs/CURRENT_HANDOFF.md`.

The previous long-form contents of this file described the old v0.1.13/cold-start research phase and became unsafe as a resume source because newer hardware results and the current 0.1.18 research objective superseded it.

## Mandatory resume order

When resuming this project:

1. inspect live remote branch movement repo-wide;
2. choose the objective-owning branch using recency **and** relevance;
3. resolve its current remote HEAD and inspect newer commits/diff;
4. read root `HANDOFF`;
5. read `AI_PROJECT_RULES.md`;
6. read `docs/CURRENT_HANDOFF.md`;
7. read `docs/PROTOCOL.md`, `docs/STATE_CONTRACT.md`, `docs/COLD_START_READBACK.md`, and `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md` before capability/write conclusions;
8. inspect relevant current source/tests/evidence;
9. reconcile any newer completed user/hardware result before proposing the next action.

Do not resume from the historical v0.1.13 text that used to live here, an uploaded/cached handoff, or an embedded SHA without live repository verification.

## Current one-line status

- supported hardware claim: **Scarlett 18i20 (3rd Gen) only**;
- parent objective: **explicit hardware feedback closure** across all 31 public feedback definitions/instances;
- canonical production candidate: audited **0.1.16**;
- prior research build **0.1.17**: software-validated and physically exercised;
- current research build **0.1.18**: autonomous Mix mono/stereo TestBench source implemented, **complete user-host software gate pending**, hardware pending;
- latest known physical starting topology: separate mono `Playback 1` + `Playback 2`;
- user must not be asked to manually switch mono/stereo for the next targeted Mix differential;
- exact next action is defined in live `HANDOFF` / `docs/CURRENT_HANDOFF.md` and must be revalidated against current remote HEAD.

## Permanent safety reminders

- Monitor gain item 1677 remains read-only.
- Never invent input preamp gain, direct per-input hardware mute, per-channel phantom switching, Mic Kill, or physical Monitor level control.
- Dynamic Control Server port/device ID only.
- Writes require the module's own approved Remote Devices client identity.
- Feedback/state remains server-confirmed only; no optimistic success.
- No unknown/unsafe raw writes, firmware/reset/restore/snapshot commands, or meter/status writes.
- Generic/public mixer-slot source/stereo remains withheld while 0.1.18 researches pair/group/transaction semantics.
- Never publish private captures, client keys, serials, hostnames, raw device XML, diagnostics, or user-specific paths.
- Do not change Focusrite software/firmware or unrelated routing/settings without explicit user agreement.
