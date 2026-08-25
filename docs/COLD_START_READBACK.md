# Cold-start readback investigation

Updated: 2026-08-25

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

The Focusrite Control Server exposes a stable schema for many useful controls, but the current value stream is sparse and session-dependent. After a fresh module process, some values known in another normal session may be absent from the Companion client's cache.

This has been observed for guarded Core state such as Air/Pad/Monitor Mute/Dim and for Custom Mix strip gain/mute/solo. The production client intentionally exposes only server-confirmed current values. Therefore a sparse bootstrap can make an otherwise reversible test temporarily non-actionable without saying anything about the existence of the underlying hardware/product function.

## Observed readback pattern

Across completed physical sessions:

- one warm-cache session had all guarded Core values;
- later fresh module sessions lost Air/Pad/Monitor Mute/Dim while other values remained known;
- a real `true` Pad value later appeared in one session, proving missing booleans cannot be treated as implicit `false`;
- an earlier normal Companion Mix observation had Mix A Left and Right Playback-strip gain/mute/solo all KNOWN;
- a later targeted Mix campaign had 0/12 complete gain+mute+solo tuples and therefore made zero writes;
- 0.1.17 provenance instrumentation distinguished `device-arrival`, later `<set>`, and never-observed state without changing `getValue()` semantics;
- repeated read-only observations showed A-F left Playback-slot gain arriving from later `<set>` state while right gain and all mute/solo states were initially sparse;
- simply navigating Output Routing did not materialise missing Mix booleans;
- official Focusrite Control interactions on the active Mix A Playback strip later materialised enough Mix A state for the dedicated automated closure campaign.

The important conclusion is **state materialisation is conditional/session-dependent**. Missing cache state is not absence of the schema item or product feature.

## Strong Mix hardware result retained

A completed automated `RUN_MIX_FEEDBACK_CLOSURE.cmd` run on 2026-08-24 used the existing authorised Companion client while the selected Playback target was slot 3 / Playback 1 under the then-tested stereo topology.

Result:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED** — server variable + rendered Companion feedback confirmed `false -> true -> false`; exact restore confirmed;
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED** — same full action/server/feedback/restore closure;
- Mix A Right Mute: direct-right write did not transition the right server variable in that tested stereo topology; exact baseline restored;
- Mix A Right Solo: same direct-right no-transition result; exact baseline restored;
- Mix B-F remained open because their required current state was not materialised in that session;
- restore quarantine: 0;
- hardware restore: YES;
- Companion Page 2 restore: YES.

This supersedes obsolete instructions to manually materialise Solo/Mute again. The right-side no-transition result is evidence only for the tested direct-right write under that stereo topology. It is not proof that the right strip is globally unwritable or unsupported.

## Runtime mono/stereo topology correction

Operator screenshots from the same Scarlett 18i20 (3rd Gen) showed that Focusrite Control can present/select individual mono channels or linked stereo pairs at runtime for Software Playback and other source families where available. The operator changed the previously tested linked `Playback 1-2` presentation to separate mono `Playback 1` and `Playback 2` strips.

Classification: **UI_OBSERVED / OFFICIAL-PRODUCT-CONSISTENT BEHAVIOUR**, not yet exact Control Server transaction proof.

This corrects older repository interpretations:

- old direct single-item mixer-slot source writes on tested slots produced no useful transition;
- old direct single-item mixer-slot stereo writes on tested slots produced no useful transition;
- those results prove only **those direct single-item attempts had no useful effect**;
- they do **not** prove mixer-slot source/stereo capability is absent;
- official UI proves runtime mono/stereo topology is a real product capability;
- the unresolved question is the Control Server pair/group/transaction semantics used to reproduce it safely.

Generic/public mixer-slot source/stereo writes remain withheld by the normal 18i20 evidence policy. Advanced Raw remains blocked.

## Latest 0.1.18 bootstrap attempt — important no-write correction

The first hardware run of the 0.1.18 autonomous materialisation workflow stopped before its first write with:

`No unique adjacent confirmed-mono Playback pair is available for autonomous materialisation.`

The targeted self-check, model/connection/authorization and Page 2 preflight were green, but hardware writes were **0**.

The correct interpretation is not “mono/stereo failed” and not “several pairs were ambiguous”. The TestBench itself still assumed paired Playback channels must occupy adjacent **mixer-slot numbers**. In that live session, zero candidates satisfied this obsolete adjacency rule.

That assumption is now removed.

## Correct runtime Playback pairing model

Playback channel identity and mixer-slot position are now treated separately.

`Playback 1` pairs with `Playback 2`, `Playback 3` with `Playback 4`, etc. regardless of whether their current mixer slots are adjacent. For example, `Playback 1` may be slot 3 while `Playback 2` is slot 7; the topology research must operate on slots 3 and 7 because those are the runtime positions of the canonical channel pair.

The corrected TestBench:

- reads live `mixer_slot_N_source`, `_source_name`, `_stereo`;
- requires unique canonical Playback channel identities;
- requires distinct slots, non-zero source IDs and server-confirmed topology state;
- fails closed on duplicates/ambiguity;
- prints only sanitized slot/name/topology diagnostics;
- never persists raw source IDs in its reports;
- performs only explicit paired `mixer_slot_stereo` research actions through the existing authorised Companion connection;
- monitors source/name as collateral state and never writes `mixer_slot_source`;
- requires exact original source/topology restoration.

This correction is **IMPLEMENTED / USER-HOST SOFTWARE-GATE PENDING / HARDWARE PENDING**.

## Existing output-pair routing path as a second materialisation mechanism

The project already has a separate, existing Companion mechanism: `output_pair_source` (`Output: Route stereo pair`). It routes both members of a physical output pair using a paired source relationship and can select paired Mix lanes. The Scarlett 18i20 hardware policy has a dedicated pair-aware guard for this path, and the V8 TestBench already includes pair Test/None/Restore controls plus exact left/right source restoration.

This existing mechanism is now reused as a **fallback materialisation experiment**, not as a replacement for topology research and not as a new raw protocol path.

If the corrected Playback topology bootstrap returns `NO-OP SAFE`, the same `RUN_MIX_FEEDBACK_CLOSURE.cmd` may call `MixOutputRoutingMaterialize.js`:

1. discover one unique server-observed `Mix A L` source;
2. exclude Monitor Outputs 1-2 from automatic fallback;
3. prefer Line Outputs 3-4 only if both members are AVAILABLE/NO_FLAG, both original source values are server-confirmed exact, and the existing V8 pair restore path exists;
4. otherwise select another eligible non-Monitor output pair;
5. explicit UNKNOWN/UNAVAILABLE availability gets no write;
6. temporarily route that pair to Mix A through exactly one `output_pair_source` Companion action;
7. require server-confirmed Mix A L/R on the pair;
8. restore the exact original left/right output-source values through the existing V8 exact-restore helper;
9. unconfirmed output restore = HARD ABORT;
10. restore Page 2;
11. capture a fresh Mix snapshot and continue only if an exact Mix baseline materialised;
12. otherwise return `NO-OP SAFE` after verified restores.

The fallback does **not** write mixer-slot source, Mix gain, Mix Mute/Solo, direct single-channel output source, raw items, Monitor gain, firmware/reset/restore/snapshot or use a direct TCP client.

This fallback is **IMPLEMENTED / USER-HOST SOFTWARE-GATE PENDING / HARDWARE PENDING**. Its existence must not be promoted into a hardware success claim until the physical run proves it.

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

There is still no production per-item query/read command. Therefore `SCHEMA_PRESENT + CACHE_MISSING` is expected to be representable and must not be collapsed into `UNSUPPORTED`.

## Independent protocol-family corroboration

Historical third-party FocusriteControlServer research shows the same broad architecture: mixer-strip gain/pan/mute/solo IDs may be declared separately from later partial `<set>` state. This is useful corroboration of sparse materialisation in the protocol family, but it targets older hardware and remains **research-only** for Scarlett 18i20 (3rd Gen).

Do not infer omitted booleans are `false`; historical examples also transmit explicit `false` values when the server chooses to send them.

## Official product evidence

Focusrite documentation for Scarlett 18i20 (3rd Gen) confirms a Focusrite Control software mixer, Custom Mix behaviour, and per-channel mixer controls. These references establish product behaviour, not exact Control Server transaction semantics.

Retained project references:

- https://userguides.focusrite.com/hc/en-gb/articles/23031286748306-Scarlett-18i20-3rd-Gen-specifications
- https://support.focusrite.com/hc/en-gb/articles/115004431245-Focusrite-Control-Tutorial-2-Setting-Custom-Mixes
- https://support.focusrite.com/hc/en-gb/articles/16571724650130-Direct-Monitoring-inputs-using-Custom-Mixes-in-Focusrite-Control
- https://support.focusrite.com/hc/en-gb/articles/360006950459-Using-the-talk-back-function-on-Scarlett-18i20-3rd-Gen
- https://userguides.focusrite.com/hc/en-gb/articles/23031280130706-Scarlett-18i20-3rd-Gen-hardware-features

## UI / routing observations retained without overgeneralising

In the observed session:

- Monitor Outputs 1-2 were assigned a Custom Mix;
- several other physical destinations were direct Playback;
- sanitized server state mapped the observed left member of Monitor Output 1 to `Mix A L` while the right member could remain sparse under pairing.

This is SESSION_STATE_OBSERVED for that session, not a universal fixed rule that `Mix A = Monitor 1-2`.

Other screenshots corroborated Input Line/Instrument on Analogue 1-2, Air/Pad on Analogue 1-8, Speaker Switching and Monitor Controls scope, Talkback source/level, `Retain 48V` persistence, and the existing Companion client approval. None justify inventing input preamp gain, direct input mute, per-channel phantom, Mic Kill, or physical Monitor level writes.

## What is proven

- guarded Core and Mix schema IDs are real and usable where observed;
- approved Companion writes can change real 18i20 hardware for previously closed paths;
- server `<set>` state can confirm transitions and exact restoration;
- Mix A Left Mute and Solo are dynamically closed;
- Mix A Right direct writes failed to transition only under the tested stereo topology and restored safely;
- runtime mono/stereo source presentation is configurable through official Focusrite Control UI;
- sparse current-state coverage varies between sessions;
- 0.1.17 provenance instrumentation distinguishes later `<set>` from never-observed state;
- the previous 0.1.18 bootstrap safe stop was caused by a TestBench slot-adjacency assumption and involved zero hardware writes;
- generic/public mixer-slot source/stereo writes remain withheld while grouped semantics are researched;
- an existing pair-aware `output_pair_source` Companion path and exact V8 pair restore infrastructure are available for one guarded non-Monitor materialisation fallback.

## What is not yet proven

- a read-only command that returns every current value at cold start;
- the exact rule deciding which values are omitted from bootstrap/current streams;
- the official client's exact mono/stereo Control Server transaction sequence;
- whether paired normal Companion `mixer_slot_stereo` actions over the corrected runtime Playback channel pair produce a useful topology transition;
- whether temporary non-Monitor `output_pair_source` routing to Mix A materialises the missing Mix gain/mute/solo baseline;
- whether Mix A Right direct Mute/Solo begins working in mono;
- whether the stereo `side=both` path closes both L/R feedbacks after an autonomous topology transition;
- Mix B-F dynamic Mute/Solo closure;
- a safe public/general mixer-slot source/stereo action contract.

## Exact next step

Do not ask the operator to manually switch mono/stereo, Mute/Solo, faders or routing again.

1. keep research 0.1.18 selected on the existing authorised Companion connection;
2. run `UPDATE_AND_RUN.bat` on `testbench/meter-routing-exact-restore`;
3. require dependencies, Prettier, ESLint, source manifest, **all Node tests**, and package build PASS;
4. no package re-import is required solely for the newest TestBench/tests/docs changes if that gate is green;
5. pause YouTube/DAW playback and physically safeguard Monitor/speakers/headphones;
6. run only `testbench\RUN_MIX_FEEDBACK_CLOSURE.cmd`;
7. use PAGE2_AUTO only if positively recognized;
8. confirm `MIX_FEEDBACK`, then `ALL_ISOLATED`;
9. touch nothing in Focusrite Control during the hardware chain;
10. preserve/paste complete output from topology materialisation, possible output-routing fallback, exact restore and Mix closure.

Any restore HARD ABORT means stop further hardware work until diagnosed. If both materialisation paths finish with `NO-OP SAFE`, preserve that as useful research evidence and do not repeat blindly or escalate to raw writes.

## Permanent safety

- supported hardware claim remains Scarlett 18i20 (3rd Gen) only;
- Monitor gain item 1677 remains read-only;
- dynamic Control Server port and device ID only;
- writes only through the module's own authorised server-assigned client identity;
- server-confirmed feedback/state only, never optimistic success;
- no unknown/unsafe raw writes, firmware/reset/restore/snapshot commands, or writes to meter/status/read-only items;
- no Focusrite software/firmware changes or unrelated routing changes without explicit agreement;
- private screenshots/raw captures/client keys/serials/hostnames stay out of the public repository.
