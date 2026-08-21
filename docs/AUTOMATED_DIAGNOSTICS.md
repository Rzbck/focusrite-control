# Automated sanitized diagnostics

Updated: 2026-08-21

## Goal

Avoid manually attaching the same diagnostic files after every Windows test while keeping the public repository free of private machine/device data.

This is **not** raw-log upload.

## Sanitized diagnostic outputs

Current machine-generated public diagnostics live only on branch:

`diagnostics/readback-results`

Stable files currently used:

- `diagnostics/runtime/latest-readback.md` — cold-start subscription lifecycle result;
- `diagnostics/runtime/latest-static-protocol-scan.md` — read-only installed Focusrite binary scan;
- `diagnostics/runtime/latest-official-session-observer.md` — passive official-client session summary when that capture succeeds.

Debug code branches remain separate from the diagnostics branch.

## Publication contract

Each diagnostic type has its own sanitizer, branch restriction and tests before automatic publication is allowed.

The publisher does **not** trust a successful `git push` alone. It:

1. validates the already-sanitized local report;
2. creates a temporary Git worktree for the diagnostics branch;
3. writes only the exact stable diagnostic path for that diagnostic type;
4. refuses unexpected worktree changes;
5. commits and pushes;
6. fetches the remote diagnostics branch again;
7. reads the published file back through Git;
8. requires exact content equality before returning success.

The publisher integration tests use a temporary local Git repository plus bare remote and verify commit/push/fetch/readback plus an idempotent second run.

## Never publish raw local material

These remain local/gitignored and must not be automatically uploaded:

- `.local-logs/`;
- `.local-captures/`;
- `probe-results/` raw working files except through a diagnostic-specific sanitizer/publisher;
- raw TestBench session logs;
- raw Focusrite XML;
- ETL/PCAPNG packet captures;
- private USB captures;
- private device XML/captures.

They can contain user paths, hostnames, endpoints, ports, serials, client keys or other private diagnostics.

## Cold-start readback diagnostic

Source branch:

`debug/cold-start-readback`

Public target:

`diagnostics/runtime/latest-readback.md`

The sanitizer rejects Windows/UNC paths, IPv4 endpoints, raw Focusrite frames/XML, hostname/port/client-key/device-id attributes and serial-value fields.

The real hardware result is now definitive for the tested subscription lifecycle: A/B/C each produced 3/21 guarded Core values, so timing/re-subscribe testing is closed.

## Static official-client diagnostic

Source branch:

`debug/official-client-read-source`

Public target:

`diagnostics/runtime/latest-static-protocol-scan.md`

The scanner reads installed Focusrite EXE/DLL material locally and publishes only normalized protocol-root/token summaries. Raw binary strings and executable paths never leave the machine.

The real Windows scan found no additional protocol-like XML root. Do not rerun it merely to get a different result unless installed Focusrite software or scanner coverage has materially changed.

## Passive official-client session diagnostic

Source branch:

`debug/official-client-passive-session`

Public target:

`diagnostics/runtime/latest-official-session-observer.md`

The observer uses temporary Windows Pktmon capture only to observe the dynamically identified Focusrite Control Server TCP port. The observer itself sends **zero Focusrite protocol messages**.

Raw ETL/PCAPNG files:

- are written only to gitignored `.local-captures/`;
- are never eligible for publication;
- are removed in a global cleanup path even after errors;
- use a temporary Pktmon filter that is removed during the same cleanup;
- are not captured at all if pre-existing Pktmon filters would have to be overwritten.

Because Companion can be connected to the same TCP server simultaneously, the local parser identifies the module's public client name `Companion Scarlett 18i20` and excludes that TCP client session before producing the official-client summary. The public result never includes client keys, hostname values, endpoints or ports.

Eligible public passive-session fields are limited to:

- client→server / server→client direction;
- XML root name;
- root attribute names only;
- counts;
- number of Companion sessions excluded;
- number of non-Companion sessions analysed;
- coverage of the known 21 guarded Core item IDs in server→client `set` traffic;
- unknown-root names if actually observed.

If no non-Companion session is reconstructed, the report must explicitly mark the capture inconclusive.

## What future AI/contributors should do

1. read `docs/AI_HANDOFF.md` and `docs/PROJECT_STATE.md` first;
2. fetch the latest applicable stable diagnostic file from `diagnostics/readback-results`;
3. use that sanitized result as the newest runtime evidence;
4. only ask the user for a local log if automatic publication failed or the sanitized schema is insufficient;
5. never ask the user to publish raw private logs/captures to the public repository.

## Failure behavior

If an experiment succeeds but publication fails:

- the already-sanitized local report remains in `probe-results/`;
- no raw log/capture is uploaded;
- runner/publisher details stay under `.local-logs/`;
- publication failure is reported separately from diagnostic failure;
- no hardware/code fallback is performed to force an upload.

For the passive observer specifically, raw ETL/PCAPNG cleanup happens independently of publication success.

## Scope

Do not automatically upload arbitrary new logs merely because this pipeline exists.

Any future automatic diagnostic publication must first define:

- a sanitized public schema;
- explicit privacy rejection rules;
- dedicated tests;
- a stable diagnostics branch/path;
- failure behavior that never leaks raw material;
- remote-content verification after push.

This repository uses **no GitHub Actions**. Publication is initiated locally by the explicit Windows debug runner.
