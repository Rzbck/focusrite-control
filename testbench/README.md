# Scarlett 18i20 Companion TestBench v0.2

This folder is the public, sanitized test harness for validating the **Scarlett 18i20 (3rd Gen)** Companion module through Companion's local HTTP API.

The end-to-end path is:

`Node/PowerShell -> Companion local APIs -> dedicated SAFE button -> module -> Focusrite Control Server -> server-confirmed module variable -> explicit restore -> PASS/FAIL`

## 1. Read-only preflight

`RUN_PREFLIGHT.cmd` sends no hardware write. It dynamically detects the local Companion web service and checks:

1. Companion HTTP API is reachable;
2. the `focusrite-scarlett-18i20` connection exists and is enabled;
3. `device_model` is exactly `Scarlett 18i20 (3rd Gen)`;
4. `client_authorised` confirms approval for this module's own Control Server client;
5. `connection_status` is authorised.

## 2. SAFE hardware validation

The SAFE runner is limited to the approved validation surface:

- Air 1-8;
- Pad 1-8;
- Input 1/2 Line/Instrument mode;
- Monitor Mute;
- Monitor Dim;
- Talkback.

Air/Pad/Mute/Dim/Talkback were already hardware-tested in earlier guarded development. Input 1/2 mode is implemented from the parsed schema and this run is intended to establish current physical-path evidence.

The SAFE runner **does not use Toggle or Cycle actions**. Every executable test uses explicit setters (`On`/`Off`, `Line`/`Inst`), waits for server-confirmed state, then explicitly restores the original server-confirmed value.

If an initial value is blank/unknown, that test is skipped **without a write**. If a restoration cannot be server-confirmed, the whole run hard-aborts immediately.

## Preparing the SAFE pages

The public repository tracks the SAFE plan and deterministic page generator, not generated/remapped Companion pages.

1. Run the normal root `UPDATE_AND_RUN.bat` and keep the current branch clean.
2. Double-click `PREPARE_SAFE_TESTBENCH.cmd`.
3. It creates locally:
   - `generated/SAFE_PAGE_A.companionconfig`
   - `generated/SAFE_PAGE_B.companionconfig`
4. No hardware write or Companion import occurs during generation.

`testbench/generated/` is Git-ignored so a locally remapped/imported page or future private derivative cannot be accidentally published.

## Importing into Companion

Do not run this during a live show, stream, recording, or other critical audio session.

1. Keep Companion open and its HTTP API enabled.
2. Make a normal Companion backup/export before importing test pages.
3. Import `generated/SAFE_PAGE_A.companionconfig` **as a new page**.
4. When Companion asks how to map `FOCUSRITE TESTBENCH TARGET`, map it to your existing `focusrite-scarlett-18i20` connection.
5. Import `generated/SAFE_PAGE_B.companionconfig` **as another new page** and use the same connection mapping.
6. The pages may be inserted at any page numbers. The runner finds them by their exact names.
7. Run `RUN_PREFLIGHT.cmd` again if Companion or the Focusrite connection was restarted.
8. Double-click `RUN_SAFE_HARDWARE_TESTS.cmd` and type `SAFE` when prompted.

Before the first hardware write, the runner performs a read-only Companion **buttons-only custom export** through the loopback-only `/int` API with `connections=false` and `includeSecrets=false`. It verifies both imported pages, every expected button position, action definition, action option, and that every action was remapped to the currently active Focusrite connection. If anything differs, the run aborts before a write.

## Local results

The SAFE runner writes only a local fixed-shape result file:

`testbench/results/latest-safe-hardware-result.json`

`testbench/results/` is Git-ignored. The report contains test names/status/state values only; it does not store the Companion endpoint, connection ID/label, Focusrite serial, hostname, client key, device ID, dynamic Control Server port, raw XML, or Companion export.

Do not commit raw Companion exports or local test output.

## Public-repository privacy rules

Do **not** commit test output, Companion exports containing user configuration, raw Control Server XML/captures, device serials, hostnames, client keys/IDs, dynamic Control Server ports, user-specific paths, or private diagnostics.

Generated/local test output belongs under `testbench/results/` and is Git-ignored. Only fixed-schema sanitized summaries may be deliberately promoted later after privacy review.

## Safety rules

- Scarlett 18i20 (3rd Gen) only.
- No physical input preamp gain control.
- No direct per-input hardware mute claim.
- No per-channel phantom-power control.
- No Mic Kill.
- Monitor gain item `1677` is read-only and is never part of the executable TestBench.
- No arbitrary/unknown raw item writes.
- No firmware/reset/restore/snapshot commands.
- Writes require the module's own Control Server client to be authorised.
- PASS/FAIL uses server-confirmed state, never optimistic state.
- A missing/wrong TestBench page or connection remap aborts before writes.
- A restoration failure stops all remaining hardware tests immediately.

This TestBench is development tooling in the personal public repository. It does not expand hardware support beyond Scarlett 18i20 (3rd Gen), and it is not part of the future official module runtime surface unless Bitfocus maintainers explicitly want it.
