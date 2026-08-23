# Validation closure and future hardware protocol

This document is the durable validation checklist for the Focusrite Control / Bitfocus Companion project.

It has two purposes:

1. finish the Scarlett 18i20 (3rd Gen) campaign without losing known residual work;
2. provide a reusable fail-closed validation method for any future Focusrite hardware profile.

It does **not** expand public hardware support. The only validated/public hardware remains **Scarlett 18i20 (3rd Gen)** until another model completes its own real-hardware evidence campaign.

## Evidence vocabulary

Every conclusion must be labelled by evidence level. Do not collapse these categories:

- **schema-observed** — present in Focusrite Control Server schema/state but not functionally exercised;
- **read-only confirmed** — server state/readback behavior observed without a write;
- **implemented** — production module exposes the feature, but this alone is not hardware proof;
- **hardware-tested** — real hardware behavior was exercised and independently observed;
- **research-only** — useful protocol/research evidence that is not a production support claim;
- **unsupported** — the validated hardware does not expose/provide the claimed function;
- **forbidden/withheld** — deliberately not writable because unsafe, read-only, no-effect, mismatched, unrestorable, availability-unknown, or otherwise unproven.

A future device never inherits Scarlett hardware-tested conclusions merely because names, item shapes, or protocol families look similar.

## Current Scarlett closure state

Canonical hardware evidence is the completed V8 FULL-from-zero report generated on exact package 0.1.15.

Current post-FULL production candidate 0.1.16 adds no new write capability. It passed:

- canonical Windows software gate: 152/152 tests;
- exact package/archive audit;
- live Companion startup on the existing connection;
- dynamic Control Server discovery;
- exact Scarlett 18i20 (3rd Gen) detection;
- server-confirmed state subscription;
- own-client Remote Devices authorization;
- read-only preflight.

Do not rerun FULL merely because 0.1.16 blocks additional writes.

## Remaining Scarlett validation work

### 1. Targeted meter feedback closure

The completed V8 report deliberately leaves `manual:feedback-meter-dynamics` as `MANUAL_PENDING`.

There are 46 meter feedback paths:

- 8 input meters;
- 26 output meters;
- 12 mix-lane meters.

Final V8 manual meter evidence:

- both feedback states observed: 0/46;
- one state observed: 41/46;
- never observed: 5/46;
- no optimistic PASS is allowed.

This must be handled as a **separate read-only meter campaign**, not another FULL.

Requirements for the meter campaign:

- no Focusrite Control Server `<set>` path;
- no Companion button press that writes hardware;
- no routing changes performed by the harness;
- use the existing Companion connection and server-confirmed module variables;
- compare rendered Companion feedback state against the independent numeric meter variable/threshold oracle;
- capture an explicit low/silent phase and an explicit real-signal phase;
- preserve per-path evidence rather than only an aggregate count;
- record numeric min/max observed values and whether the feedback crossed its configured threshold;
- classify each path separately as both-states observed, one-state observed, never observed, or mismatch;
- a mismatch is a real failure and must not be hidden by later matching samples;
- inaccessible physical/routing paths remain manual pending instead of being forced through disruptive routing changes;
- public evidence must contain sanitized path classes/counts only, not private routes, serials, hostnames, client IDs or local paths.

The goal is not to make every counter green at any cost. The goal is to know exactly which meter paths were physically exercised and which were not.

### 2. Disruptive actions intentionally excluded

These remain separate from normal automatic validation:

- Device Preset;
- Clock Source;
- Sample Rate;
- S/PDIF Mode.

They are implemented/schema-observed but are not automatically hardware-certified by FULL because they can overwrite routing, alter clocking, interrupt audio, or change digital I/O mode.

Do not exercise them solely to eliminate `MANUAL_PENDING` rows. If they are ever tested, create a dedicated campaign with explicit user approval, known restore plan, and evidence specific to each action.

### 3. Public repository and history audit

Before final transfer/publication:

- scan the current tree for real serials, private hostnames, client keys, client IDs, MAC addresses, private LAN endpoints, raw private XML/captures, diagnostics and user-specific filesystem paths;
- scan **Git history/blobs**, not only HEAD;
- distinguish harmless synthetic examples from real private values;
- if a real private secret/value exists in public history, deleting it from HEAD is insufficient — history remediation must be considered explicitly;
- review `.gitignore`, generated-results policy and package contents so future captures cannot be accidentally committed;
- keep sanitized hardware evidence separate from private local diagnostics.

### 4. Provenance / attribution audit

Before official Bitfocus transfer:

- compare current source with public prior work actually credited by the project;
- inspect early project commits where practical, not only the final divergent implementation;
- distinguish shared protocol facts from copied/adapted expression or implementation;
- retain MIT notices wherever substantial MIT-licensed Bitfocus code/patterns were adapted;
- do not claim all protocol knowledge was independently discovered;
- do not imply code copying where evidence only shows common protocol behavior;
- keep the attribution conclusion factual and conservative rather than rewriting history for appearance.

The current full Bitfocus MIT notice is deliberately retained in `THIRD_PARTY_NOTICES.md` and packaged `companion/HELP.md` unless a future maintainer-approved location supersedes it.

### 5. Official Bitfocus repository extraction

The personal repository may remain a development/research/source-of-truth repository. Do not create a second repository merely for cosmetic cleanup.

When Bitfocus creates the official repository:

1. inspect exact repository name, default branch, seed files and permissions;
2. inspect Bitfocus module conventions at that time;
3. compare the official seed with the current cleaned RC;
4. copy/port only files appropriate for the official module repository;
5. keep private/autonomous Windows research builders and local diagnostics out unless maintainers explicitly want them;
6. decide deliberately whether detailed TestBench/research documents belong in the official repository or remain in the personal development repository;
7. use the expected branch/PR workflow — never blindly overwrite the official seed;
8. run Bitfocus CI and the local canonical gate;
9. keep stable public release target at v1.0.0 unless maintainers direct otherwise;
10. submit a Developer Portal tag only after hardware/action/privacy/attribution audit and CI are clean.

## Reusable validation protocol for a future Focusrite device

The following sequence is mandatory conceptually even if implementation details evolve.

### Stage A — intake and isolation

- Identify exact model, generation and Focusrite software version context.
- Do not assume protocol/device parity from marketing family names.
- Preserve existing Focusrite Control settings; no software/firmware update without explicit agreement.
- Use safe monitoring levels and physical output isolation before any write-capable campaign.
- Do not run direct research probes concurrently with normal SAFE/FULL campaigns.

### Stage B — read-only discovery and session validation

Prove before writes:

- dynamic Control Server discovery or an explicit manual endpoint — never a hardcoded TCP fallback;
- dynamic device ID;
- exact model identity;
- device topology counts;
- server-confirmed initial state/subscription behavior;
- module's own server-assigned client ID;
- Remote Devices authorization matched only to that client;
- writes remain blocked until authorized.

Unknown model/profile = read-only discovery only; no production write profile.

### Stage C — complete schema inventory

Create an inventory of every observed controllable/status/meter item and map it to:

- device owner/family;
- readable state variable;
- possible action family;
- feedback family/oracle;
- availability state;
- read-only/status classification;
- known restore baseline or lack of one.

Require explicit evidence coverage: observed rows, mapped rows, unmapped rows and unclassified rows.

### Stage D — feedback oracle audit before functional writes

For every public feedback definition:

- identify an independent server-confirmed variable/oracle;
- reject unknown/missing state instead of inventing defaults;
- verify normal/inverted feedback pairs collapse to one logical probe where appropriate;
- meter feedbacks use real numeric state plus threshold, never visual self-confirmation;
- record feedback count and definition count separately.

A rendered feedback must never be considered correct merely because an action was just requested.

### Stage E — write candidate classification

Before any write, classify each candidate as:

- reversible with known baseline;
- availability true/false/unknown/no-flag;
- read-only;
- disruptive/manual-only;
- forbidden;
- unsupported;
- unknown/unrestorable.

Unknown baseline or unknown availability must fail closed when exact restoration is required.

### Stage F — safety dependency and restoration plan

For every reversible write target:

- know the exact original server-confirmed state;
- know the exact intended temporary state;
- define an independent observation of requested behavior;
- define exact restore path;
- verify restore immediately;
- hard-abort/quarantine when restore cannot be confirmed;
- never continue merely because later writes might mask the failure.

Physical isolation is a safety guard, not proof that a software guard succeeded.

### Stage G — topology and alias discovery

Do not assume pair behavior globally.

For each declared/observable pair:

- exercise topology with reversible values;
- observe both members;
- derive ownership from actual runtime behavior;
- restore immediately;
- classify pair-owned aliases separately from no-effect controls;
- keep topology evidence control-specific — Source topology must not automatically become Mute/Stereo/Nickname/Gain topology.

### Stage H — family sweeps

Exercise each eligible family independently:

- inputs;
- outputs;
- output pairs;
- mixer slots;
- mixer lanes/strips;
- monitoring;
- device metadata/settings that are safe and reversible.

For each family distinguish:

- PASS;
- PASS_BASELINE;
- no-effect confirmed;
- behavior mismatch;
- pair-owned alias;
- withheld by profile;
- availability unknown;
- blocked by safety;
- manual pending;
- unsupported;
- forbidden;
- unrestorable/quarantine.

Never turn one family's observation into another family's conclusion without direct evidence.

### Stage I — manual read-only and meter validation

Run dedicated manual phases for things writes cannot safely prove:

- physical-control readback, such as Monitor knob telemetry;
- meter low/high threshold crossing with real signal;
- signal-dependent status.

Manual evidence must remain explicit and path-specific. No optimistic completion.

### Stage J — authoritative feedback sweeps and reconnect

- run authoritative feedback sweep before and after the functional campaign;
- collect dynamic transition evidence during actual state changes;
- require zero oracle mismatches;
- restore all temporary state before reconnect;
- reconnect is session/read-state validation only, not a restoration mechanism.

### Stage K — production-policy reconciliation

After hardware evidence is complete, compare the report to the **actual production action/preset/raw surface**.

For every non-writeable classification, confirm production cannot expose or execute the write through:

- normal actions;
- pair actions;
- relative/adjust actions;
- presets;
- Advanced Raw;
- stale callbacks after state/availability changes.

This reconciliation is mandatory. It caught the 0.1.16 output-availability gap after the Scarlett V8 campaign.

### Stage L — software/package/live audit

For each release candidate that changes production source:

- syntax;
- immutable dependencies;
- formatter;
- lint;
- manifest/version;
- complete tests;
- exact archive contents;
- package syntax;
- privacy scan;
- forbidden-feature regression;
- dynamic endpoint/device policy;
- own-client authorization;
- server-confirmed state policy;
- third-party notices/attribution;
- live startup on existing connection;
- read-only preflight.

A restrictive source change does not automatically require another write-capable FULL, but it does require its own software/package/live evidence.

### Stage M — publication evidence

Only publish sanitized evidence that passes a strict schema/privacy gate.

Public evidence must not expose:

- serial number;
- private hostname;
- private TCP endpoint;
- client key/client ID;
- raw private XML/capture;
- private Companion export;
- diagnostics path;
- user-specific path or identity.

Generator and publisher schemas must have an integration test so sanitized schema growth cannot silently break publication.

## Definition of closure for the Scarlett 18i20 (3rd Gen)

The Scarlett campaign is considered technically reviewed when:

- canonical V8 FULL remains clean with no functional FAIL;
- 0.1.16 restrictive production reconciliation remains software/package/live clean;
- targeted meter campaign records the maximum honest path-specific evidence possible without disruptive routing and clearly lists anything still unreachable;
- four disruptive actions remain explicitly manual/unvalidated unless separately approved and tested;
- repository tree + history privacy audit is complete;
- provenance/attribution audit is complete;
- official-source extraction plan is ready for Bitfocus's repository decision.

"Closure" does not mean pretending every possible state was forced. It means every public capability, exclusion, unknown, residual and source-provenance question has an explicit evidence-backed disposition.
