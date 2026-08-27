# Changelog

## 0.1.21 — exact pair-routing evidence correction

- Record the newest V4 public-surface hardware smoke: **42 PASS / 10 FAIL**, no hard abort, reconnect PASS and clean global exact restore; all ten failures were `output_pair_source` `NO_TRANSITION` results.
- Re-read the completed V8 pair-topology evidence instead of treating its historical PASS as a stronger claim than it actually proved. The old oracle could accept a route where the requested left member changed while the right member remained on its original source.
- Reclassify `output_pair_source` as **withheld for public v1** rather than weakening the newer two-member hardware oracle. The internal implementation/research history remains available for future investigation.
- Keep direct `output_source` on its validated targets/families; the V4 smoke hardware-confirmed those direct Output routing paths where runnable after the cold-start definition-lifecycle repair.
- Preserve the physical **Stereo/Mono** evidence from the broad read-only REC. Custom Mix fader/pan/Mute/Solo/source-stereo/Talkback readback and all 12/12 Custom Mix meters remain valid server-confirmed hardware evidence even though generic Stereo/Custom Mix write actions stay withheld.
- Add V5 of the release smoke for the 0.1.21 public surface. V5 filters inherited pair tests, never generates or presses `output_pair_source`, and preserves stable-live-baseline, exact-restore and collateral-state safety behavior.
- Update the canonical release/final-audit launchers, public help, README, action-surface audit, hardware history, feedback matrix and handoffs for the corrected 0.1.21 policy.
- Bump the development package to **0.1.21** because packaged production policy/help bytes changed; do not distribute different package bytes again under 0.1.20.
- **Validation status:** 0.1.21 is **SOFTWARE-GATE-PENDING** until the complete user-host `UPDATE_AND_RUN.bat` pipeline passes immutable dependencies, Prettier, ESLint, source manifest, all Node tests and Companion package build.

## 0.1.20 — v1 public write-surface freeze

- Reconcile the completed V8 direct-write evidence with the two newest read-only hardware REC reports instead of turning strong UI/readback evidence into unproven Companion write claims.
- Freeze the public v1 action surface to retained hardware-supported write families; readable feedback/variables remain available where write actions are withheld.
- Withhold public **ALT / ALT Enable** writes and the ALT preset. The newest physical REC dynamically closed their server-confirmed feedback/readback, but did not separately prove the Companion write transaction.
- Withhold the generic **Output Stereo-link** action while retaining Output Stereo feedback/readback.
- Withhold generic **Custom Mix** fader/pan/Mute/Solo writes and their presets. Physical UI readback is strong and all 12/12 Custom Mix meters are closed, but direct-write evidence is not uniform across every internal lane/side/slot and the internal mix IDs do not map cleanly to what Focusrite Control shows the user.
- Remove internal Custom Mix source IDs from public Output source/pair-routing choices, and re-check stale callbacks so an old saved action cannot bypass that restriction.
- Withhold disruptive Device Preset, Clock Source, Sample Rate and Digital I/O/S/PDIF Mode writes for v1 instead of altering real clocking/routing merely for coverage.
- Remove the public Advanced Raw configuration surface; the release definition policy also removes `advanced_raw_set`, so raw writes cannot bypass the v1 action policy.
- Keep human Outputs 21–24 write-blocked even if a future configuration reports them available, until that available configuration receives explicit real-hardware validation.
- Extend direct Output Mute withholding to every right/pair-owned member; retain validated direct leaders and server-confirmed readback.
- Retain already hardware-supported nickname writes, direct/pair Output Source paths, eligible analogue Output Gain paths, Core Monitor/Input controls, Phantom Persistence and Talkback Source.
- Add production-policy regressions for the v1 withheld action set, blocked presets, future availability of Outputs 21–24, pair-owned Mute filtering, Custom Mix source-choice filtering and stale-callback fail-closed behavior.
- **Validation status:** targeted isolated policy/syntax checks pass; the complete user-host `UPDATE_AND_RUN.bat` format/lint/manifest/all-tests/package gate is still required before 0.1.20 becomes a green checkpoint.

## 0.1.19 — output assign-mix read-only characterisation

- Research build only; canonical production candidate remains the audited 0.1.16 and no public `assign-mix` write capability is claimed.
- Add diagnostic-only output `assign-mix` readback behind the existing `Expose all mixer slot variables` option.
- Expose only opaque equality classes `V1`, `V2`, ... plus arrival/set provenance; raw `assign-mix` values are not exposed by the research variables or stored by the sanitized probe.
- Extend the existing `MeterMixPlaybackBaselineReadOnlyProbe.js` / `RUN_METER_MIX_BASELINE_READONLY.cmd` workflow instead of creating a duplicate tool.
- Keep `assign-mix` excluded from writable IDs, actions, presets, public feedbacks, Advanced Raw and hardware-policy write surfaces.
- Add regressions for diagnostic gating, opaque class equality, provenance, schema parsing, writable-ID exclusion, report privacy and the no-write launcher/probe contract.
- Record the latest 0.1.18 hardware result narrowly: a guarded Line 3-4 `output_pair_source` attempt toward Mix A produced no server-confirmed route transition, then exact Playback 3/4 routing and Page 2 restoration succeeded. Do not generalize this into a global `output_pair_source` failure.
- **Validation status:** source/tests/docs implemented; complete 0.1.19 user-host format/lint/manifest/test/package gate and physical read-only observation are pending.

## 0.1.18 — autonomous mixer-topology research build

- Research build only; canonical production candidate remains the audited 0.1.16 and no public mixer-slot stereo/source support is claimed.
- Narrow the old mixer-slot no-effect interpretation: prior hardware evidence proves only direct **single-item** source/stereo writes had no useful transition on the tested slots; newer Focusrite Control UI evidence proves runtime mono/stereo topology is a real product capability.
- Keep generic/public `mixer_slot_source`, generic/public mixer-slot stereo support, and Advanced Raw mixer-slot writes withheld by the validated 18i20 policy.
- Expose `mixer_slot_stereo` only when the existing diagnostic `Expose all mixer slot variables` option is enabled; the research action accepts explicit On/Off only, refuses unknown/invalid current server state, and remains Scarlett 18i20 (3rd Gen) only.
- Extend the existing Mix feedback runner rather than creating a second workflow: detect live Playback identity/topology, use guarded paired topology actions only from exact original state, preserve server-confirmed source state, and restore exactly.
- Keep the topology phase on the existing authorised Companion client only: no direct TCP helper, no raw write, no mixer-slot source write, no Monitor gain write.
- Any unconfirmed topology/routing restore hard-aborts/quarantines. No-transition paths restore and stop; they do not escalate to raw writes.
- Correct the TestBench so Playback channel pairing is based on runtime `Playback N` identity rather than slot adjacency, and so the non-Monitor output-pair materialisation fallback does not require unrelated mixer topology state.
- User-host gate completed with dependencies, Prettier, ESLint, source manifest, **244/244 Node tests**, and Companion package build PASS.
- Latest physical run correctly withheld Playback 1/2 topology writes because the original stereo flags were not server-observed. The fallback then attempted one guarded Line 3-4 route toward Mix A, observed no server-confirmed Mix A transition, restored Playback 3/4 exactly, restored Page 2, and stopped with no new Mix Mute/Solo write.

## 0.1.17 — server-state provenance research build

- Add per-item provenance tracking that distinguishes values observed in `device-arrival`, later `<set>` traffic, both, or never observed, without changing the production `getValue()` server-truth contract.
- Expose sanitized Mix gain/mute/solo provenance variables only under the existing diagnostic mixer-variable option.
- Extend the existing read-only Mix Playback baseline probe to report schema presence, observed value coverage and provenance without hardware writes or private raw identifiers.
- Use the physical 18i20 session to prove that Mix current-state materialisation can differ between sessions; missing cache values remain readback evidence, not capability absence.
- Complete a dedicated automated Mix Mute/Solo run after state materialisation: Mix A Left Mute and Solo dynamically closed with exact restore; direct Mix A Right writes did not transition under the tested stereo topology but restored exactly.
- Preserve generic/public mixer-slot source/stereo withholding in this build.
- User-host software gate completed for 0.1.17: dependencies, Prettier, ESLint, source manifest, 216/216 Node tests, and Companion package build PASS.

## 0.1.16 — post-FULL availability safety hardening

- Keep the completed 0.1.15 V8 FULL-from-zero as the canonical hardware campaign; this release adds no new hardware write capability.
- Make the production action policy honor server-confirmed output availability: an output with an explicit availability descriptor receives no write while availability is false or unknown.
- Preserve the separately tested V3 no-availability-flag case: outputs whose schema has no availability descriptor are not falsely blocked by this guard.
- Apply the same availability rule to direct output actions, the dedicated stereo-pair Source action, output-mute presets and Advanced Raw output writes.
- Re-check availability inside action callbacks so a stale visible action still fails closed if availability changes after definitions were built.
- Add regression coverage for true/false/unknown/no-flag availability, pair availability, stale callbacks, presets and Advanced Raw.
- Preserve all V8 hardware evidence restrictions: Monitor Output 1–2 direct Gain remains withheld; direct Mute 2/4/6/8/10 remains withheld; pair-owned right-member Source, known no-effect direct controls, Mixer Slot Source/Stereo and per-lane Mix Talkback remain non-writing.
- Preserve Monitor gain item 1677 as read-only and keep unknown/unsafe raw writes, firmware/reset/restore/snapshot commands and unsupported input controls absent.
- Expand `THIRD_PARTY_NOTICES.md` to preserve the complete upstream Bitfocus MIT notice.
- This is a restrictive post-FULL release candidate. It requires the normal software/package/privacy audit and a live read-only startup/preflight before promotion; it does not require another FULL merely to prove that newly blocked writes stay blocked.

## 0.1.15 — Monitor-pair safety + completed V8 hardware validation

- Withhold direct Gain Set/Adjust for Monitor Outputs 1–2 after a diagnostic run exposed unresolved cross-output/exact-restoration semantics on the Monitor pair.
- Apply the same Monitor Output 1–2 gain restriction to Advanced Raw; readable gain state remains available.
- Keep Line Output 4/6/8/10 direct gain classified separately as hardware-tested no-effect.
- Make eligible output-gain TestBench probes watch the captured pair-mate gain during transition, restoration and fallback so cross-member drift cannot silently pass.
- Use interior output-gain probe values instead of treating the `-128` boundary as the sole exact oracle.
- Complete the V8 FULL-from-zero on a physical Scarlett 18i20 (3rd Gen): 1436/1436 inventory rows classified, 1340/1340 snapshot variables mapped, 21/21 Core variables mapped, 829 logical feedback probes across 31 definitions, and zero final FAIL classes.
- Publish the sanitized completed V8 hardware report after repairing a TestBench-only publisher schema mismatch; hardware did not need to be rerun.
- Keep the exact hardware-tested package checkpoint distinct from later TestBench-only rebuilds.

## 0.1.14 — hardware evidence policy + generic TestBench classification

- Separate the generic TestBench inventory/classification engine from Scarlett 18i20 (3rd Gen)-specific hardware evidence.
- Keep unvalidated Focusrite models discoverable/read-only in the capability engine while failing closed for all hardware writes until a dedicated hardware-tested profile exists.
- Add semantic capability classifications alongside per-run status, including write-confirmed, no-effect-confirmed, pair-owned/alias, read-only, withheld-by-profile, safety-blocked, unrestorable and unknown states.
- Add a pre-write evidence coverage invariant: every observed snapshot/Core variable must map to a classified inventory row; new/unmapped observations block the write campaign instead of disappearing silently.
- Treat output evidence per control: source-pair topology is not promoted into mute/stereo conclusions.
- Withhold direct output targets only where current hardware evidence supports it; retain readable server state and feedbacks.
- Withhold Mixer Slot Source/Stereo and per-lane Mix Talkback writes on the validated 18i20 profile because the current hardware campaign demonstrated no useful write path on the known tested baselines; keep their readback state.
- Preserve global Monitor Talkback, Monitor Mute/Dim, pair-source research, Monitor gain item 1677 read-only, Remote Devices authorization and server-confirmed feedback behavior.
- Add generic evidence/profile and public write-surface regression coverage.
- This development build still supports only Scarlett 18i20 (3rd Gen); broader Focusrite support requires separate real-hardware FULL validation.

## 0.1.13 — cold-start state contract + validation hardening

- Formalize the supported cold-start contract: explicit target actions may request a verified writable value without knowing the previous value, but only while connected and after this module's own Focusrite Control client is authorised.
- Keep state-derived actions such as Toggle, mode Cycle and relative adjustments blocked until the current value is server-confirmed and valid.
- Keep feedbacks and variables server-truth only; unknown state stays unknown/blank and is never optimistically invented.
- Add regression coverage for explicit-vs-state-derived behavior, unknown-state safety, sanitized RC validation status and Monitor gain item 1677 remaining read-only.
- Add `docs/STATE_CONTRACT.md` and a checked-in local RC validation path covering Prettier, ESLint, source manifest, Node tests and `companion-module-build` without GitHub Actions.
- Full Windows RC validation on Node 22.23.2 passed format, lint, source manifest, **31/31 Node tests** and Companion package build.
- Preserve the already hardware-tested Air 1–8, Pad 1–8, Input 1/2 Line/Instrument, Monitor Mute, Monitor Dim and Talkback mappings; no production control logic changed for this contract release-hardening step.
- Keep Monitor gain item 1677 read-only and excluded from actions, presets and Advanced Raw writes.

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
- Add a regression test for the real single-quoted announcement format

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
- Keep CommonJS API 2.0 module export style verified on the tested Companion host

## 0.1.3

- Encountered and documented the Windows `companion-module-check` file-URL issue.

## 0.1.2

- Fix mixer-loop implementation issue.

## 0.1.1

- ESLint fixes.

## 0.1.0

- Initial private Focusrite Control Server implementation.
