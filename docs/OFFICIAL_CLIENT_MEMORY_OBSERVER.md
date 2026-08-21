# Official Focusrite client memory observer

Updated: 2026-08-21

## Why this branch exists

The standard Control Server cold-start subscription was hardware-tested and returned only 3/21 guarded Core values. Re-subscribe/reconnect did not improve that result. Static research found no separate public read primitive.

A passive Windows Pktmon run then completed successfully while the user closed/reopened Focusrite Control, but its sanitized result contained **0 captured packet snapshots / 0 reconstructed frames**. That run is therefore not protocol evidence. Do not repeat the same Pktmon experiment as the next step.

Branch: `debug/official-client-memory-observer`.

## Important correction to previous handoff

An earlier passive-session attempt was incorrectly described as failing before capture. The user confirmed that the timer had appeared and Focusrite Control had been closed/reopened. The failure was in later status/report handling. Because no usable sanitized packet result survived, that attempt is still not protocol evidence, but it did reach the capture window.

## Method

This branch observes the freshly reopened official Focusrite Control process **read-only**.

The scanner uses only these Windows process APIs:

- `OpenProcess` with query + VM-read rights;
- `VirtualQueryEx`;
- `ReadProcessMemory`;
- `CloseHandle`.

It does not use or permit:

- `WriteProcessMemory`;
- `VirtualAllocEx`;
- `CreateRemoteThread` / `NtCreateThreadEx`;
- APC/thread-context injection;
- process termination;
- a process dump;
- Focusrite protocol transmission.

The checked-in tests fail if prohibited process-write/injection primitives appear in the scanner source.

## What counts as evidence

The scanner does **not** treat arbitrary XML-looking strings or static binary text as protocol evidence.

A candidate must be a concrete framed buffer matching the actual Control Server framing shape:

`Length=` + six hexadecimal length digits + one space + XML root/payload.

Raw frame bytes stay only in RAM while being classified and are immediately discarded. A transient in-memory SHA-256 is used only for local deduplication and is never written or published.

## Published data

Only normalized evidence may be published:

- count of official processes attempted/scanned;
- whether a fresh GUI process restart was detected;
- normalized XML root names;
- opening-tag attribute **names** only;
- known guarded Core item IDs found inside concrete `set` frames;
- whether the bounded scan limit was reached.

Forbidden from publication:

- raw process memory;
- raw XML/frames;
- local paths;
- process names/PIDs;
- endpoints/ports;
- hostnames;
- serials/client keys/device IDs;
- item values;
- raw-frame fingerprints/hashes.

Public targets:

- `diagnostics/runtime/latest-official-client-memory-observer.md`
- `diagnostics/runtime/latest-official-client-memory-observer-status.md`

Both are written on `diagnostics/readback-results`. The result publisher re-fetches and verifies the remote content after push.

## Human action

During the observation window:

1. close only Focusrite Control;
2. reopen Focusrite Control normally;
3. do not touch Air / Pad / Mute / Dim / Talkback;
4. wait for the observer to scan the fresh official client process.

Companion may remain open. No Focusrite software, firmware, routing or hardware setting is modified.

## Decision rules

- Unknown concrete framed root found -> research its exact observed role/schema; do not transmit a guessed request.
- Only known roots found -> no evidence of a separate official read primitive in concrete client buffers.
- Guarded Core IDs found in concrete `set` buffers -> record which current states the official client actually had available at startup.
- No concrete frames found -> memory observation is inconclusive; do not infer absence of a protocol primitive.

The module baseline remains v0.1.12 until evidence justifies a controlled production-code change.
