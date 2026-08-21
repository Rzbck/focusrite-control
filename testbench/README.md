# Scarlett 18i20 Companion TestBench v0.2

This folder is the public, sanitized test harness for validating the **Scarlett 18i20 (3rd Gen)** Companion module through Companion's local HTTP API.

The intended end-to-end path is:

`PowerShell -> Companion HTTP API -> Companion button -> module -> Focusrite Control Server -> server-confirmed module variable -> PASS/FAIL -> restore`

## Current stage: read-only preflight

`RUN_PREFLIGHT.cmd` runs no Companion button press and sends no Focusrite hardware write. It checks only:

1. a local Bitfocus Companion web service is detected dynamically;
2. Companion's HTTP API is reachable;
3. the `focusrite-scarlett-18i20` connection exists and is enabled;
4. `device_model` is exactly `Scarlett 18i20 (3rd Gen)`;
5. `client_authorised` confirms approval for this module's own Control Server client;
6. `connection_status` is authorised.

The preflight does **not** assume that Companion is listening on TCP port 8000. It enumerates local listening TCP ports, probes only loopback, and accepts an endpoint only when the HTTP response identifies itself with `X-App: Bitfocus Companion`. The local HTTP client disables proxy use explicitly.

The next stage on this branch is the SAFE hardware-validation runner for the already guarded controls: Air 1-8, Pad 1-8, Input 1/2 Line/Instrument, Monitor Mute, Monitor Dim and Talkback. Each executable hardware test must use server-confirmed state and restore the original state when restoration is safely possible.

## Public-repository privacy rules

Do **not** commit test output, Companion exports containing user configuration, raw Control Server XML/captures, device serials, hostnames, client keys/IDs, dynamic ports, user-specific paths, or private diagnostics.

Generated/local test output belongs under `testbench/results/` and is git-ignored. Only fixed-schema sanitized summaries may be deliberately promoted later after privacy review.

## Safety rules

- Scarlett 18i20 (3rd Gen) only.
- No physical input preamp gain control.
- No direct per-input hardware mute claim.
- No per-channel phantom-power control.
- No Mic Kill.
- Monitor gain item `1677` is read-only and must never be written by the TestBench.
- No arbitrary/unknown raw item writes.
- No firmware/reset/restore/snapshot commands.
- Writes, when SAFE tests are added, must require the module's own Control Server client to be authorised.
- PASS/FAIL must be based on server-confirmed state, never optimistic state.

## Run

Keep Companion open and enable its local HTTP API, then double-click:

`RUN_PREFLIGHT.cmd`

No Companion web port needs to be configured for the normal local preflight. An explicit `-CompanionBaseUrl` remains available only for controlled debugging.

This TestBench is development tooling in the personal public repository; it is not a claim of broader Focusrite device support and is not part of the future official module runtime surface unless Bitfocus maintainers explicitly want it.
