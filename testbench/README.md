# Scarlett 18i20 Companion TestBench v0.2

This folder is the public, sanitized test harness for validating the **Scarlett 18i20 (3rd Gen)** Companion module through Companion's local HTTP API.

The end-to-end path is:

`Node/PowerShell -> Companion local APIs -> existing r9 TestBench button -> module -> Focusrite Control Server -> server-confirmed module variable -> explicit restore -> PASS/FAIL`

## Existing Companion TestBench page

The current v0.2 SAFE hardware runner **reuses the existing r9 FULL MATRIX page**:

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

No new Companion page is generated or required.

The r9 page remains the broader historical validation surface: it contains the Core hardware-action region plus the large read-only feedback matrix. The current v0.2 SAFE runner presses only the 42 explicit Core setters required for the 21 approved reversible hardware tests. It does **not** press the legacy mode-cycle, reconnect, PTT, or any feedback-only control.

The existing r9 page may contain many more feedback probes than the current SAFE hardware runner exercises. Re-integrating the full legacy feedback sweep is a separate validation task; it is not required for the SAFE hardware-action audit.

## 1. Read-only preflight

`RUN_PREFLIGHT.cmd` sends no hardware write. It dynamically detects the local Companion web service and checks:

1. Companion HTTP API is reachable;
2. the `focusrite-scarlett-18i20` connection exists and is enabled;
3. `device_model` is exactly `Scarlett 18i20 (3rd Gen)`;
4. `client_authorised` confirms approval for this module's own Control Server client;
5. `connection_status` is authorised.

## 2. SAFE hardware validation

The SAFE runner is limited to:

- Air 1-8;
- Pad 1-8;
- Input 1/2 Line/Instrument mode;
- Monitor Mute;
- Monitor Dim;
- Talkback.

These controls are represented by explicit setters on the existing r9 Core region. The runner **does not use Toggle or Cycle actions**. Every executable test uses an explicit setter (`On`/`Off`, `Line`/`Inst`), waits for server-confirmed state, then explicitly restores the original server-confirmed value.

If an initial value is blank/unknown, that test is skipped **without a write**. If a restoration cannot be server-confirmed, the whole run hard-aborts immediately.

## Page and connection audit before writes

Before the first hardware write, the runner performs a read-only Companion buttons-only custom export through the loopback-only `/int` API with `connections=false` and `includeSecrets=false`.

It requires exactly one r9 FULL MATRIX page identified by its exact page name or embedded `TB-R9-ALL` marker, verifies the 46x26 grid, then verifies all 42 SAFE Core button locations, action definitions, literal options, and that those buttons reference exactly one `focusrite-scarlett-18i20` instance.

Connection mapping follows the hardware-tested r9.4+ rule: raw Companion connection IDs are **not** assumed to match. If there is exactly one enabled Focusrite connection it is used. If multiple exist, the exported page label must uniquely match one live connection. Otherwise the run blocks before writes.

## Running

Do not run during a live show, stream, recording, or other critical audio session.

1. Run the normal root `UPDATE_AND_RUN.bat` and ensure it finishes with `RUN OK`.
2. Keep Companion open and its HTTP API enabled.
3. Keep the existing r9 FULL MATRIX page in Companion. No page re-import is required when it already exists.
4. Run `RUN_PREFLIGHT.cmd` if Companion or the Focusrite connection was restarted.
5. Before the hardware run, turn the physical Monitor knob down, mute/power down active speakers where practical, and lower/remove headphones.
6. Double-click `RUN_SAFE_HARDWARE_TESTS.cmd` and type `SAFE` when prompted.

## Local results

The SAFE runner writes only a local fixed-shape result file:

`testbench/results/latest-safe-hardware-result.json`

`testbench/results/` is Git-ignored. The report contains test names/status/state values only; it does not store the Companion endpoint, connection ID/label, Focusrite serial, hostname, client key, device ID, dynamic Control Server port, raw XML, or Companion export.

## Public-repository privacy rules

Do **not** commit test output, Companion exports containing user configuration, raw Control Server XML/captures, device serials, hostnames, client keys/IDs, dynamic Control Server ports, user-specific paths, or private diagnostics.

Only fixed-schema sanitized summaries may be deliberately promoted later after privacy review.

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
- A missing/wrong r9 page or ambiguous connection mapping aborts before writes.
- A restoration failure stops all remaining hardware tests immediately.

This TestBench is development tooling in the personal public repository. It does not expand hardware support beyond Scarlett 18i20 (3rd Gen), and it is not part of the future official module runtime surface unless Bitfocus maintainers explicitly want it.
