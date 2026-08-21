# Automated sanitized diagnostics

Updated: 2026-08-21

## Goal

Avoid manually attaching the same diagnostic files after every Windows test while keeping the public repository free of private machine/device data.

This is **not** raw-log upload.

## Current readback pipeline

For `debug/cold-start-readback`, a successful local run publishes only the already-sanitized probe report to:

- branch: `diagnostics/readback-results`
- file: `diagnostics/runtime/latest-readback.md`

The debug code branch remains separate. The publisher uses a temporary Git worktree and pushes the diagnostic branch without switching or committing on `debug/cold-start-readback`.

The publisher does **not** trust a successful `git push` alone. After push it fetches the remote diagnostics branch again, reads `latest-readback.md` back through Git, and requires the remote content to exactly match the locally sanitized document before returning success.

The debug runner is non-interactive after branch selection: no success/failure `pause` remains in the debug execution/publication path. Persistent local logs are still written for failures.

## Current validation state

The sanitizer/publisher validation currently includes:

- sanitized report shape validation;
- rejection of Windows/UNC paths, IPv4 endpoints and raw Focusrite protocol payloads;
- source branch/commit/result metadata validation;
- newest-result selection;
- **real Git integration test** using a temporary working repository plus bare remote;
- real `fetch -> worktree -> commit -> push -> fetch -> remote content verification`;
- second identical publication verified as idempotent (no extra commit).

Publisher test result after the remote-verification hardening: **6/6 pass**.

The first attempted automatic real-host publication did not create `latest-readback.md`; only the diagnostics README was present remotely. No raw/private runtime file was published. This is why remote read-back verification was added before asking for another physical probe run.

## Never publish raw local logs

These remain local/gitignored and must not be automatically uploaded:

- `.local-logs/UPDATE_AND_RUN_latest.txt`
- `.local-logs/UPDATE_latest.txt`
- `.local-logs/DEBUG_READBACK_latest.txt`
- raw TestBench session logs
- raw Focusrite XML/captures
- private USB captures

They can contain user paths, hostnames, endpoints or other private diagnostics.

## Sanitizer gate

Before Git publication, the readback publisher validates the report and rejects content containing, among other things:

- Windows absolute/UNC paths;
- IPv4 endpoints;
- raw Focusrite frame/XML messages;
- hostname/port/client-key/device-id attributes;
- serial-value fields.

The source must have the exact read-only probe markers, all three A/B/C phases, a decision, and it may only be published from `debug/cold-start-readback`.

## What future AI/contributors should do

When continuing the cold-start investigation:

1. read the normal project handoff/state first;
2. fetch `diagnostics/runtime/latest-readback.md` from branch `diagnostics/readback-results` if it exists;
3. use that sanitized hardware result as the newest readback evidence;
4. only ask the user for a local file if automatic publication failed or the sanitized result is insufficient;
5. never ask the user to publish raw private logs to the public repository.

## Failure behavior

If the physical read-only probe succeeds but Git publication fails:

- the local sanitized `probe-results/readonly_state_probe_*.txt` remains available;
- no raw log is uploaded;
- publisher stdout/stderr is copied into local `.local-logs/DEBUG_READBACK_latest.txt`;
- the runner reports publication failure separately from probe failure;
- code/hardware state is not changed to work around the upload failure.

## Scope

Do not automatically upload arbitrary new logs merely because this pipeline exists.

Any future automatic diagnostic publication must first define:

- a sanitized public schema;
- explicit privacy rejection rules;
- tests for those rules;
- a stable diagnostics branch/path;
- failure behavior that never leaks raw logs.

This repository still uses **no GitHub Actions**. Publication is initiated locally by the explicit Windows debug runner.
