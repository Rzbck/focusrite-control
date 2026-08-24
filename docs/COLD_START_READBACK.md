# Cold-start readback investigation

Updated: 2026-08-24

## Mandatory inference rule

A missing current value is **not** a capability verdict.

Keep these evidence levels separate:

1. OFFICIAL PRODUCT BEHAVIOUR;
2. SCHEMA_PRESENT;
3. SESSION_STATE_OBSERVED;
4. IMPLEMENTED;
5. HARDWARE_WRITE_CONFIRMED;
6. HARDWARE_DYNAMIC_CLOSED.

`UNKNOWN`, blank state, missing cache, `BASELINE_UNKNOWN`, or `SKIP_BASELINE_UNKNOWN` means only **not observed in this client session** unless stronger evidence proves more. It does not mean `false`, schema absent, unsupported hardware, or permanently non-actionable.

A reversible hardware test may require only the server-confirmed state genuinely needed to restore the property/topology being changed. Do not manufacture a baseline by guessing and do not impose unrelated tuple prerequisites merely because an older harness grouped properties together.

## Problem statement

The Focusrite Control Server exposes a stable schema for many useful controls, but the current value stream is sparse and session-dependent. After a fresh module process, some values that are known in another normal session may be absent from the Companion client's cache.

This has been observed for guarded Core state such as Air/Pad/Monitor Mute/Dim and for Custom Mix strip state such as gain/mute/solo.

The production client intentionally exposes only server-confirmed current values. Therefore a sparse bootstrap can make an otherwise reversible test temporarily non-actionable without saying anything about the existence of the underlying hardware/product function.

## Observed readback pattern

Across completed physical sessions:

- one warm-cache session had all guarded Core values;
- later fresh module sessions lost Air/Pad/Monitor Mute/Dim while other values remained known;
- a real `true` Pad value later appeared in one session, proving missing booleans cannot be treated as implicit `false`;
- an earlier normal Companion Mix observation had Mix A Left and Right Playback-strip gain/mute/solo all KNOWN;
- a later targeted Mix campaign had 0/12 complete gain+mute+solo tuples and therefore made zero writes;
- the 0.1.17 provenance build was then loaded on the existing authorised Companion connection and distinguished `device-arrival`, later `<set>`, and never-observed state without changing `getValue()` semantics;
- repeated read-only 0.1.17 observations showed A-F left Playback-slot gain arriving from later `<set>` state while right gain and all mute/solo states were initially sparse;
- simply navigating Output Routing did not materialise the missing Mix booleans;
- an official Focusrite Control Mute interaction on the active Mix A Playback strip materialised Mix A Left and Right mute state and the previously missing right gain state;
- a later official UI interaction also materialised the remaining Mix A state needed for the dedicated automated closure campaign.

The important conclusion is **state materialisation is conditional/session-dependent**. Missing cache state is not absence of the schema item or product feature.

## Stronger Mix hardware result that supersedes the old manual-materialisation objective

A completed automated `RUN_MIX_FEEDBACK_CLOSURE.cmd` run on 2026-08-24 used the existing authorised Companion client while the selected Playback target was slot 3 / Playback 1 in a stereo topology.

Result:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED** — server variable + rendered Companion feedback confirmed `false -> true -> false`; exact restore confirmed;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED** — same full action/server/feedback/restore closure;
- Mix A Right Mute: the direct-right write did not transition the right server variable in that tested stereo topology; exact baseline restored;
- Mix A Right Solo: same direct-right no-transition result; exact baseline restored;
- Mix B-F remained open because their required current state was not materialised in that session;
- restore quarantine: 0;
- hardware restore: YES;
- Companion Page 2 restore: YES.

This result **supersedes the old instruction in earlier revisions of this document to perform another manual Solo materialisation**. Do not repeat that obsolete step.

The right-side no-transition result is evidence only for the tested direct-right write under that stereo topology. It is not proof that the right strip is globally unwritable or unsupported.

## Runtime mono/stereo topology correction

Later operator screenshots from the same physical Scarlett 18i20 (3rd Gen) showed that Focusrite Control can present/select individual mono channels or linked stereo pairs at runtime for Software Playback, Analogue hardware inputs, S/PDIF, and ADAT families where available.

The operator then changed the previously tested linked `Playback 1-2` presentation to separate mono `Playback 1` and `Playback 2` strips.

Classification: **UI_OBSERVED / OFFICIAL-PRODUCT-CONSISTENT BEHAVIOUR**, not yet Control Server write-contract proof.

This newer evidence corrects an older repository interpretation:

- old single-item mixer-slot source writes on tested slots 1-4 produced no useful transition;
- old single-item mixer-slot stereo writes on tested slots 3-4 produced no useful transition;
- those results prove only **direct single-item no-effect for those tested writes**;
- they do **not** prove mixer-slot source/stereo capability is absent;
- the official UI proves runtime mono/stereo topology is a real product capability;
- the unresolved question is the Control Server **pair/group/transaction semantics** used to reproduce it safely.

Accordingly:

- generic/public mixer-slot source/stereo writes remain withheld by the 18i20 evidence policy;
- Advanced Raw remains blocked for these items;
- the dedicated research/TestBench path may test a narrowly guarded paired `mixer_slot_stereo` operation under exact restore;
- no public capability claim changes until hardware confirms a useful path.

## Current code mechanism explaining sparse state

`src/device-parser.js` separates schema declaration from current value:

- numeric item IDs declared by `device-arrival` become descriptors/schema controls;
- `device.initialState` receives a value only when the arrival tag explicitly carries a `value=` attribute.

`src/focusrite-client.js` then:

- clears the state cache on device arrival;
- seeds only explicit arrival values;
- subscribes using the dynamic server-assigned device ID;
- updates cache from later `<set>` messages;
- exposes `getValue()` only from this server-confirmed observed cache.

There is still no production per-item query/read command.

Therefore `SCHEMA_PRESENT + CACHE_MISSING` is expected to be representable and must not be collapsed into `UNSUPPORTED`.

## Independent protocol-family corroboration

Historical third-party FocusriteControlServer research shows the same broad architecture: mixer-strip gain/pan/mute/solo IDs may be declared separately from later partial `<set>` state. This is useful corroboration of sparse materialisation in the protocol family, but it targets older hardware and remains **research-only** for Scarlett 18i20 (3rd Gen).

Do not infer omitted booleans are `false`; historical examples also transmit explicit `false` values when the server chooses to send them.

## Official product evidence

Focusrite documentation for Scarlett 18i20 (3rd Gen) confirms a Focusrite Control software mixer, 12 mono Custom Mixes, up to 24 mono custom-mix inputs, and per-channel Custom Mix Mute/Solo behaviour.

Relevant product references retained by the project:

- https://userguides.focusrite.com/hc/en-gb/articles/23031286748306-Scarlett-18i20-3rd-Gen-specifications
- https://support.focusrite.com/hc/en-gb/articles/115004431245-Focusrite-Control-Tutorial-2-Setting-Custom-Mixes
- https://support.focusrite.com/hc/en-gb/articles/16571724650130-Direct-Monitoring-inputs-using-Custom-Mixes-in-Focusrite-Control
- https://support.focusrite.com/hc/en-gb/articles/360006950459-Using-the-talk-back-function-on-Scarlett-18i20-3rd-Gen
- https://userguides.focusrite.com/hc/en-gb/articles/23031280130706-Scarlett-18i20-3rd-Gen-hardware-features

These establish product behaviour, not exact Control Server transaction semantics.

## UI / routing observations retained without overgeneralising

In the observed session:

- Monitor Outputs 1-2 were assigned a Custom Mix;
- several other physical destinations were direct Playback;
- sanitized server state mapped the observed left member of Monitor Output 1 to `Mix A L` while the right member remained sparse under stereo pairing.

This is **SESSION_STATE_OBSERVED for that session**, not a universal fixed rule that `Mix A = Monitor 1-2`.

Other screenshots corroborated:

- Input Line/Instrument switching only on Analogue 1-2;
- Air/Pad on Analogue 1-8;
- Speaker Switching and Monitor Controls scope UI;
- Talkback source/level UI;
- `Retain 48V` as persistence, not per-channel phantom;
- the existing Companion Scarlett 18i20 Remote Devices client approved.

None of these screenshots justify inventing input preamp gain, direct input mute, per-channel phantom, Mic Kill, or physical Monitor level writes.

## Current 0.1.18 research implementation

Research build **0.1.18** exists solely to make the next Mix topology differential autonomous while preserving the public safety model.

The normal 18i20 policy still hides generic mixer-slot source/stereo writes. In 0.1.18 only, `mixer_slot_stereo` can appear when the existing diagnostic mixer-variable option is explicitly enabled. That research action:

- remains Scarlett 18i20 (3rd Gen) only;
- permits explicit `on`/`off` only, no Toggle;
- refuses to write when the current server state is unknown/invalid;
- does not expose `mixer_slot_source`;
- does not open Advanced Raw;
- is intended only for the existing exact-restore TestBench.

The existing `MixFeedbackClosureRunner` now implements an autonomous topology phase:

1. select the previous exact Playback target if it is still live, otherwise a unique best exact Playback target;
2. read runtime source/name/stereo state;
3. when starting from two adjacent known-mono Playback members, generate one Companion button step containing exactly two `mixer_slot_stereo` actions;
4. run the current-topology Mix Mute/Solo diagnostic first where exact baselines exist;
5. attempt the paired stereo transition through the existing authorised Companion connection;
6. require server-confirmed topology before any stereo `side=both` Mix phase;
7. monitor source state as collateral state and never write source;
8. restore both stereo flags and confirm the original source/topology state;
9. any unconfirmed restore hard-aborts/quarantines;
10. if paired normal Companion actions still produce no useful transition, stop safely and move research to official-client grouped/atomic-set semantics rather than raw writes.

This implementation is **SOURCE_IMPLEMENTED / HARDWARE_PENDING** until the user-host software gate and physical run complete.

## What is proven

- guarded Core and Mix schema IDs are real and usable where observed;
- approved Companion writes can change real 18i20 hardware for previously closed paths;
- server `<set>` state can confirm transitions and exact restoration;
- Mix A Left Mute and Solo are dynamically closed;
- Mix A Right direct writes failed to transition only under the tested stereo topology and restored safely;
- runtime mono/stereo source presentation is configurable through official Focusrite Control UI;
- sparse current-state coverage varies between sessions;
- 0.1.17 provenance instrumentation correctly distinguishes later `<set>` from never-observed state;
- generic/public mixer-slot source/stereo writes remain responsibly withheld while grouped semantics are researched.

## What is not yet proven

- a read-only command that returns every current value at cold start;
- the exact rule deciding which values are omitted from bootstrap/current streams;
- the official client's exact mono/stereo Control Server transaction sequence;
- whether two normal Companion `mixer_slot_stereo` actions in one button step produce the same useful topology transition as Focusrite Control;
- whether Mix A Right direct Mute/Solo begins working in mono;
- whether the stereo `side=both` path closes both L/R feedbacks after an autonomous topology transition;
- Mix B-F dynamic Mute/Solo closure;
- a safe public/general mixer-slot source/stereo action contract.

## Exact next step

Do not ask the operator to manually switch mono/stereo again.

Before hardware:

1. sync the objective branch with `UPDATE_AND_RUN.bat`;
2. validate dependencies, Prettier, ESLint, source manifest, all Node tests, and package build for 0.1.18;
3. only after a fully green user-host gate, load/select `focusrite-scarlett-18i20-0.1.18.tgz` on the **existing** authorised Companion Focusrite connection;
4. keep the diagnostic mixer-variable option enabled for this research build;
5. run the existing `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd` once;
6. confirm `MIX_FEEDBACK` and `ALL_ISOLATED` once;
7. touch nothing in Focusrite Control during the hardware phase; TestBench owns the temporary mono/stereo transition and exact restore.

If 0.1.18 paired stereo actions do not produce a useful transition, do not repeat blindly and do not escalate to raw writes. Preserve the result as grouped-semantics evidence and investigate the official client's atomic/multi-item `<set>` behaviour next.

## Permanent safety

- supported hardware claim remains Scarlett 18i20 (3rd Gen) only;
- Monitor gain item 1677 remains read-only;
- dynamic Control Server port and device ID only;
- writes only through the module's own authorised server-assigned client identity;
- server-confirmed feedback/state only, never optimistic success;
- no unknown/unsafe raw writes, firmware/reset/restore/snapshot commands, or writes to meter/status/read-only items;
- no Focusrite software/firmware changes or unrelated routing changes without explicit agreement;
- private screenshots/raw captures/client keys/serials/hostnames stay out of the public repository.
