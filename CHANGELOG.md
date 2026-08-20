# Changelog

## 0.1.12

- Fix v0.1.11 connection regression that could leave the module permanently on `Synchronising device state...`.
- Remove repeated `device-subscribe subscribe="true"` refresh timers after real-hardware testing showed no progress from repeated subscriptions.
- Restore one subscription per device arrival.
- Mark the state subscription ready after any server-confirmed value is observed instead of requiring all 21 Core values.
- Keep missing values unknown; variables/feedbacks/actions still do not invent defaults.
- Retain server-confirmed values embedded in `device-arrival`.

## 0.1.11

- Fix incomplete initial Focusrite Control Server state after module reload.
- Preserve server-confirmed values included in `device-arrival` when present.
- Do not mark the client ready after only the first partial `<set>` packet.
- Require parsed Core Air/Pad/Input Mode/Monitor Mute/Dim/Talkback state coverage before reporting ready.
- Retry the read-only `device-subscribe` operation a bounded number of times while Core state remains incomplete.
- Keep missing state unknown; no optimistic defaults are introduced.

## 0.1.10 — feedback truth + unknown-state safety

- Fixed `mixer_slot_source` feedback so missing server state never masquerades as `None / Unassigned`.
- Meter feedbacks now return false until the server confirms a numeric meter value; unknown state is never coerced to `-128 dBFS`.
- Source-name variables stay empty until the server confirms a source; `None / Unassigned` is shown only for an explicit source value of `0`.
- Toggle actions now refuse to derive a write from missing/invalid current state.
- Input mode cycle and relative gain adjustments now refuse to derive writes from unknown state.
- Removed Monitor gain set/adjust actions and Monitor +/-1 dB presets.
- Removed Monitor gain item 1677 from all writable/Advanced Raw IDs; telemetry remains read-only.
- Added regression tests for all of the above.

## 0.1.9 — Focusrite client authorisation fix

- Parse the Control Server-assigned client ID from `<client-details ... id="..."/>`
- Apply `<approval>` only when its ID matches this Companion client and honour `authorised="true|false"`
- Subscribe with `subscribe="true"` so the client participates in the Focusrite remote-device approval flow
- Block hardware writes until this exact Companion client is authorised
- Remove optimistic local write state; feedbacks now change only after Control Server echoes the real state
- Add client authorisation variables/feedback and regression tests

## 0.1.8 — Discovery diagnostics

- Emit UDP discovery diagnostics at INFO level so Companion's normal log view shows them
- Log UDP socket bind address, each discovery send, each received UDP datagram, parsed announcement, fallback selection and final TCP target
- No Scarlett routing/control behavior changed

## 0.1.7 — Focusrite server-announcement parser fix

- Accept both double-quoted and single-quoted XML attributes
- Fix parsing of the actual Focusrite Control Server response format such as `<server-announcement app='SAFFIRE-CONTROL' port='49678' hostname='PC'/>`
- Prevent valid UDP discovery responses from being discarded and falling back to TCP port 49152
- Add regression coverage for the real single-quoted announcement format

## 0.1.6 — Focusrite Control Server discovery fix

- Use the exact proven Focusrite discovery XML: `<client-discovery app="SAFFIRE-CONTROL" version="4"/>`
- Remove the unverified `device="Companion"` attribute that prevented local Control Server discovery
- Keep the Scarlett connection architecture local: Companion -> TCP localhost -> Focusrite Control Server -> USB -> Scarlett
- Add a regression test for the exact framed discovery request

## 0.1.5 — Windows lint fix

- Replace `validate-source-manifest.mjs` with CommonJS `validate-source-manifest.cjs`
- Fix the unused action-loop `id` binding in the full schema integration test
- Establish a corrected autonomous Windows build path during private/local development

## 0.1.4 — Windows validation and API 2.0 entrypoint hardening

- Replace the Windows-broken `companion-module-check` CLI with a direct source-manifest validator using `@companion-module/base/manifest`
- Keep `companion-module-build` as the authoritative packaging validator; tools 3.0.2 validates the generated manifest during build
- Export the CommonJS module class directly for API 2.0 instead of calling `runEntrypoint`
- Add a sanitized full 18i20 Gen3 device-schema fixture based on the captured hardware schema
- Add full integration tests for all actions, feedback callbacks, variables and preset references
- Add safety assertions for Analogue 3 meter and reset/snapshot command IDs
- Keep Companion 5.0.3 package API pinned to `2.0.0`

## 0.1.3 — Mixer variable loop fix

- Restore the `slot` binding in the mixer-slot variable-value loop
- Keep the definition loop free of the unused `slot` binding
- Add a regression assertion for both mixer-slot loops
- Keep Companion 5.0.3 module API pinned to `2.0.0`

## 0.1.2 — Build/lint hardening

- Exclude `.build-tools`, `node_modules`, `pkg` and `READY_TO_SHARE` from ESLint
- Exclude portable Node/Yarn tooling from Prettier
- Use ESLint `^10.2.0`, matching current Companion tools peer requirements
- Remove unused parser helper and unused mixer binding
- Replace empty catch blocks with documented intentional handling
- Add `companion-module-check` to the local development build validation
- Keep Companion 5.0.3 module API pinned to `2.0.0`

## 0.1.1 — Companion 5.0.3 compatibility hotfix

- Pin `@companion-module/base` to exactly `2.0.0`
- Ensure the packaged manifest declares `runtime.apiVersion: 2.0.0`
- Add a build-time API-version assertion for Companion 5.0.3
- Add ESLint 9 and lint validation to the local Windows build validation
- Preserve all Scarlett 18i20 actions, feedbacks, variables and presets from v0.1.0

## 0.1.0 — Initial community test release

- Focusrite Control Server UDP auto-discovery
- Dynamic TCP-port handling and reconnect
- Persistent Focusrite client approval key
- Exact Scarlett 18i20 (3rd Gen) model matching
- Monitor Mute, Dim, Talkback and Alt controls
- Monitor output-group preset
- Air/Pad on analogue inputs 1–8
- Line/Instrument mode on inputs 1–2
- Input/output nickname controls
- Individual and stereo-pair output routing
- Output mute, stereo and analogue gain controls
- 24 mixer source slots and stereo flags
- Mix A–F gain, pan, mute, solo and talkback controls
- Device routing preset, clock, sample-rate and Digital I/O settings
- Phantom persistence and talkback source
- State feedbacks, meter threshold feedbacks and variables
- Throttled meter updates
- Companion API 2.x preset structure
- Restricted advanced raw-write action
- Documented verified lack of digital input gain, direct input mute and per-channel 48 V
