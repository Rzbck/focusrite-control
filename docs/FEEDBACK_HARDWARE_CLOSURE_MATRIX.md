# Feedback hardware closure matrix — Scarlett 18i20 (3rd Gen)

Updated: 2026-08-26

This is the parent hardware-validation checklist for the **31 public Companion feedback definitions**. It separates product/schema evidence, server/session readback, implementation, real hardware write confirmation, and full dynamic closure.

The current hardware scope remains **Scarlett 18i20 (3rd Gen) only**.

A software test, static render match, one sparse session, or one successful representative path is not automatically equivalent to generic hardware write support. Conversely, `UNKNOWN`, blank, `neverObserved`, or a configuration-unavailable path is not proof that a capability does not exist.

## Evidence / classification rule

Keep these levels separate:

1. **OFFICIAL PRODUCT BEHAVIOUR**;
2. **SCHEMA_PRESENT**;
3. **SESSION_STATE_OBSERVED**;
4. **IMPLEMENTED**;
5. **HARDWARE_WRITE_CONFIRMED**;
6. **HARDWARE_DYNAMIC_CLOSED**.

Additional current classes:

- **READ_ONLY_STATUS** — passive observation is the correct validation model;
- **HARDWARE_STATIC_CONFIRMED** — current state/rendering is corroborated but dynamic closure is incomplete or intentionally not attempted;
- **EVAL_ONLY_SAFE_ACTIONABLE** — a reversible test may run only from an exact server-confirmed baseline and, where audio is involved, physical isolation;
- **RESEARCH_OPEN / EVAL_ONLY** — capability exists, but exact write/group/ownership semantics remain unresolved;
- **CONFIGURATION_UNAVAILABLE** — current server-confirmed configuration says unavailable; this is not a permanent unsupported claim;
- **UNSUPPORTED/BLOCKED** — deliberately excluded from write-driven validation under the current safety/product contract;
- **PARTIAL** — instances within the public definition have different evidence levels.

`UNKNOWN`, blank state, missing cache, `BASELINE_UNKNOWN`, `SKIP_BASELINE_UNKNOWN`, or `neverObserved` means **not observed in that client/session** unless stronger evidence proves otherwise.

## Current strongest aggregate evidence

Latest completed physical-user observation is sanitized manual feedback sweep **reportVersion 6**, updated `2026-08-26T05:59:47.636Z`, module `0.1.19`:

- read-only harness: `true`;
- hardware writes by harness: `false`;
- Companion button presses by harness: `false`;
- feedback definitions: **31**;
- feedback instances/probes: **829**;
- non-meter feedback probes: **783**;
- meter probes: **46**;
- recorded feedback transitions: **193**;
- confirmed PASS transitions: **193**;
- transient races: **0**;
- confirmed persistent mismatches: **0**;
- non-meter paths observed in both rendered states: **92**;
- semantic safe paths exposed: **810**;
- semantic paths changed: **94**;
- semantic transitions: **367**.

The report is feedback/session evidence. It proves server-confirmed state materialisation for the user operations that occurred in Focusrite Control; it does **not** automatically prove the corresponding generic Companion write transaction.

### Meter aggregate after reportVersion 6

- total meters: **46**;
- fully closed floor + movement: **37**;
- floor-only: **4**;
- movement-only / missing floor: **5**;
- never observed: **0**;
- persistent mismatch: **0**.

Breakdown:

- Inputs: **8/8 HARDWARE_DYNAMIC_CLOSED**;
- Outputs 1-20 and 25-26: **22 HARDWARE_DYNAMIC_CLOSED**;
- Outputs 21-24 / ADAT 2.1-2.4: **4 CONFIGURATION_UNAVAILABLE** in the current configuration;
- Custom Mix lanes: **7/12 closed**;
- remaining Custom Mix meter floor gaps: **Mix B L/R, Mix C L/R, Mix E R**.

Internal `Mix A-F` names are protocol/TestBench labels. User-facing instructions should use Focusrite Control terminology: **Custom Mix**, **Hardware Inputs**, **Software (DAW) Playback**, **Outputs**, **Stereo**, and **Mute**.

## 31-definition matrix

| # | Feedback definition | Strongest current class | Current evidence / remaining work |
|---:|---|---|---|
| 1 | `connected` | **READ_ONLY_STATUS** | Connection lifecycle is server status. No forced disconnect is required for coverage. |
| 2 | `authorised` | **READ_ONLY_STATUS** | Canonical Remote Devices approval has matched the module's own server-assigned client ID. Do not revoke/reapprove merely for coverage. |
| 3 | `monitor_mute` | **HARDWARE_DYNAMIC_CLOSED** | Prior guarded writes plus later both-edge server-confirmed feedback evidence. No retest needed. |
| 4 | `monitor_dim` | **HARDWARE_DYNAMIC_CLOSED** | Prior guarded writes plus later both-edge server-confirmed feedback evidence. No retest needed. |
| 5 | `monitor_talkback` | **HARDWARE_DYNAMIC_CLOSED** | Stronger prior closure retained; no current persistent mismatch. No retest needed. |
| 6 | `monitor_alt` | **EVAL_ONLY_SAFE_ACTIONABLE** | Product/UI/schema support are real, but reportVersion 6 captured no transition. One physically isolated exact-restorable test remains justified if the action is to stay public. |
| 7 | `monitor_alt_enable` | **EVAL_ONLY_SAFE_ACTIONABLE** | Same as `monitor_alt`. Speaker Switching changes the active monitor pair and can mute outputs; test only with isolated speakers/headphones and known baseline. |
| 8 | `monitor_preset` | **HARDWARE_DYNAMIC_CLOSED** | Prior hardware run observed both states. Do not retest merely for coverage because changing Monitor Controls can cause abrupt output-level changes. |
| 9 | `input_air` | **HARDWARE_DYNAMIC_CLOSED — 8/8** | All eight analogue inputs have retained write evidence and reportVersion 5 both-edge feedback closure. |
| 10 | `input_pad` | **HARDWARE_DYNAMIC_CLOSED — 8/8** | All eight analogue inputs have retained write evidence and reportVersion 5 both-edge feedback closure. |
| 11 | `input_available` | **READ_ONLY_STATUS** | Server/schema availability state only. Passive validation is correct. |
| 12 | `input_mode` | **HARDWARE_DYNAMIC_CLOSED** | Inputs 1-2 Line/Instrument have guarded write/restoration and complementary feedback evidence. |
| 13 | `input_meter` | **HARDWARE_DYNAMIC_CLOSED — 8/8** | Floor + real movement for every analogue input meter, zero persistent mismatch. |
| 14 | `output_mute` | **PARTIAL — control-specific hardware evidence + representative SESSION_STATE_OBSERVED** | ReportVersion 6 added both-state UI/readback evidence on representative analogue/digital paths including Outputs 3, 13, 15, 17, 19 and 25. Existing production policy still blocks historically mismatched/pair-owned or unavailable direct paths. Do not relax write policy from UI readback alone. |
| 15 | `output_stereo` | **PARTIAL — representative SESSION_STATE_OBSERVED** | ReportVersion 6 captured real Stereo changes on analogue, digital and Loopback-family representatives including Outputs 3, 11 and 25/26. Existing control-specific no-effect history still matters for direct writes. No blanket single-item write conclusion. |
| 16 | `output_source` | **PARTIAL — representative SESSION_STATE_OBSERVED + retained write evidence** | UI-driven source changes now span Playback, Analogue, Custom Mix, S/PDIF and other digital families. Pair followers materialise `None / Unassigned` or their own source when topology changes. Dedicated direct/pair write policy remains control-specific; do not infer a generic transaction from feedback-only observation. |
| 17 | `output_available` | **READ_ONLY_STATUS** | Outputs 21-24 are currently server-confirmed `available=false`; all availability must remain dynamic. |
| 18 | `output_meter` | **22 HARDWARE_DYNAMIC_CLOSED / 4 CONFIGURATION_UNAVAILABLE** | Outputs 1-20 and 25-26 have floor + movement. Outputs 21-24 receive no write-driven closure while unavailable. |
| 19 | `mixer_slot_stereo` | **SESSION_STATE_OBSERVED — strong multi-pair / generic write RESEARCH_OPEN** | ReportVersion 6 observed official-UI stereo transitions on slots 1-6 and 13-18. Example slots 3/4 split and relinked with the follower source materialising and disappearing. Generic/public single-item write remains withheld; research-only explicit stereo action is diagnostic-gated. |
| 20 | `mixer_slot_source` | **SESSION_STATE_OBSERVED — strong multi-pair / generic write RESEARCH_OPEN** | Source names changed across multiple slot pairs and source families during normal UI use. Public `mixer_slot_source` action remains withheld because exact grouped transaction semantics are not proven. |
| 21 | `mix_mute` | **PARTIAL — broad SESSION_STATE_OBSERVED + selected HARDWARE_DYNAMIC_CLOSED write path** | ReportVersion 6 captured clean both-edge feedback on many Custom Mix strips across Mix A L/R and Mix D L. Prior exact-restored Companion write closure exists on a selected Mix A left path; arbitrary lane/side/slot write semantics are not thereby globally closed. |
| 22 | `mix_solo` | **PARTIAL — broad SESSION_STATE_OBSERVED + selected HARDWARE_DYNAMIC_CLOSED write path** | Same current evidence pattern as `mix_mute`: extensive UI/readback evidence, but generic action writes across all lane/side/slot combinations still require an explicit release decision or representative exact-restore proof. |
| 23 | `mix_talkback` | **SESSION_STATE_OBSERVED / public write WITHHELD** | ReportVersion 6 observed Talkback state changes on Mix A L/R and Mix D L through normal UI. Earlier direct lane writes did not establish useful generic semantics. Public action remains removed; do not re-add from readback evidence. |
| 24 | `mix_meter` | **PARTIAL — 7/12 HARDWARE_DYNAMIC_CLOSED / 5 MANUAL_PENDING floor-only** | Remaining floor-only gaps are Mix B L/R, Mix C L/R and Mix E R. Prefer passive silence capture from existing routing; do not change routing merely to improve the score. |
| 25 | `device_preset` | **UNSUPPORTED/BLOCKED for dynamic closure** | Preset recall changes routing broadly. Do not recall presets merely for feedback coverage. Public action-surface decision is separate and must be audited before release. |
| 26 | `clock_source` | **HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically** | Changing clock source can affect sync/audio and external digital dependencies. Do not change merely for feedback coverage. |
| 27 | `sample_rate` | **HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically** | Sample-rate changes interrupt audio and change channel/Custom Mix availability. Do not change merely for feedback coverage. |
| 28 | `spdif_mode` | **HARDWARE_STATIC_CONFIRMED / UNSUPPORTED-BLOCKED dynamically** | Digital I/O mode changes optical/S/PDIF topology and requires device restart for the setting to take effect. Do not change merely for feedback coverage. |
| 29 | `clock_locked` | **READ_ONLY_STATUS** | Passive server status only. |
| 30 | `talkback_source` | **HARDWARE_DYNAMIC_CLOSED** | Prior hardware run observed both states. No retest needed. |
| 31 | `phantom_persistence` | **HARDWARE_DYNAMIC_CLOSED** | Prior hardware run observed both states. This is **Retain 48V / persistence**, never per-channel phantom switching. |

## Output `assign-mix` — research note outside the 31 public feedback definitions

`assign-mix` is **not** a public feedback/action.

Current strongest evidence after reportVersion 6:

- schema/descriptor: **26/26 SCHEMA_PRESENT**;
- observed value: **0/26 materialised**;
- active UI-driven routing was exercised on representative Outputs 1, 3, 11 and 25 using Playback, Analogue, Custom Mix and digital sources;
- `assign-mix` class/provenance still remained `UNKNOWN`;
- classification: **SCHEMA_PRESENT + ACTIVE_SESSION_STATE_UNOBSERVED** across several output families;
- raw value semantics: **UNKNOWN**;
- official write transaction: **UNKNOWN**;
- public action/preset/feedback: **absent**;
- Advanced Raw write: **absent**.

Do not rerun `NAVIGATE_MIXES`. Do not write `assign-mix` directly. Current public Focusrite documentation describes assigning **Custom Mix** through the normal output routing UI but does not document this private Control Server field or its low-level transaction semantics. There is no release justification for chasing it with blind writes.

## ReportVersion 6 topology evidence retained

Normal Focusrite Control UI operations established that the visible Custom Mix channel set is dynamically mono/stereo-linked. A representative exact observation on mixer slots 3/4 was:

- both stereo flags `true -> false`;
- follower slot 4 source `None / Unassigned -> Playback 2`;
- relink returned the stereo flags to `true` and follower source to `None / Unassigned`.

This is consistent with Focusrite's public UI documentation that Hardware Inputs and Software (DAW) Playback sources can be linked as stereo pairs. It is **not** permission to infer the private write transaction or to expose arbitrary raw writes.

## Digital output / availability truth retained

Current Control Server/module schema and the user's UI observation agree that direct output gain exists only on **Outputs 1-10**. Outputs 11-26 do not expose a direct per-output gain control in the current schema. Do not invent one for S/PDIF/ADAT/digital outputs.

Outputs 21-24 / ADAT 2.1-2.4 are currently `available=false`. Official Scarlett 18i20 documentation confirms digital channel availability changes with sample rate and Digital I/O mode. Therefore their current state is **CONFIGURATION_UNAVAILABLE**, never a hardcoded permanent unsupported claim.

Do not change sample rate or Digital I/O mode merely to make those outputs available for test coverage.

## Public action surface — separate release audit

The 31-row matrix above validates feedback definitions. It does **not** by itself prove every currently defined Companion action.

Current production policy already does the right thing for several unresolved families:

- `mixer_slot_source` is removed from normal public actions;
- `mixer_slot_stereo` is absent from normal connections and only diagnostic-gated for explicit research;
- `mix_talkback` is removed from normal public actions;
- output writes are filtered by exact supported model, server-confirmed availability and control-specific hardware policy;
- Monitor pair gain writes remain withheld;
- Monitor gain item `1677` remains read-only;
- Advanced Raw is filtered by the same hardware policy and may never become an arbitrary item-ID escape hatch.

Material release-audit items still remain outside feedback closure:

1. **Monitor ALT / ALT Enable** — currently public actions but not dynamically closed. Either run one physically isolated exact-restorable test or withhold them for v1.
2. **Custom Mix public writes** — `mix_mute`, `mix_solo`, `mix_gain_set/adjust`, and `mix_pan` are public. ReportVersion 6 strongly validates UI-driven readback, but generic Companion writes across arbitrary mix/side/slot combinations are not all proven. Before v1, either complete a representative exact-restore write audit or constrain/withhold unproven combinations.
3. **Disruptive settings actions** — `device_preset`, `clock_source`, `sample_rate`, and `spdif_mode` are still defined as actions even though dynamic hardware closure is intentionally blocked for safety. Before v1, explicitly decide to withhold them or perform a deliberately approved hardware campaign; do not test them merely for coverage.
4. **Nickname actions** — input/output/device nickname writes are low-risk but are outside the sanitized broad feedback sweep and do not currently have equivalent dynamic hardware evidence. They can be validated with a synthetic temporary nickname and exact restoration, or remain documented as implemented/schema-observed rather than hardware-tested.
5. **Allowed output write policy** — reportVersion 6 must not automatically loosen existing `hardware-policy.js` blocks. Before release, audit every output action option that remains visible after policy filtering against retained write evidence, especially analogue gain and pair-routing cases.

## Smallest justified next hardware work

Do **not** rerun the broad REC.

Preferred order:

1. capture passive silence for the five remaining Custom Mix meter floors if those lanes can naturally reach floor without routing changes;
2. run one isolated exact-restorable **ALT / Speaker Switching** test if ALT actions are intended to remain public;
3. perform the release action-surface audit and choose **test vs withhold** for public Custom Mix writes and disruptive settings;
4. only build a new targeted hardware harness when that audit identifies a specific public write that still needs proof.

No work should target `assign-mix`, unavailable Outputs 21-24, Monitor gain `1677`, firmware/reset/restore/snapshot, or any forbidden non-feature.

## Permanent safety boundaries

- supported hardware claim: **Scarlett 18i20 (3rd Gen) only**;
- Focusrite Control Server TCP port and device ID are dynamic;
- writes require Remote Devices authorization matched to this module's own server-assigned client ID;
- feedback and variables use server-confirmed state only;
- no physical input preamp gain action;
- no direct per-input hardware mute claim;
- no per-channel phantom action;
- no Mic Kill;
- Monitor gain `1677` remains read-only;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot writes;
- no meter/status writes;
- explicit `available=false` or UNKNOWN output availability is never a write target;
- preserve privacy and required third-party attribution.
