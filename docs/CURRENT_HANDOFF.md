# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 — **Scarlett 18i20 (3rd Gen) V8 FULL-from-zero completed successfully on module 0.1.15 and the sanitized result is published. V8 now supersedes V6 as the canonical hardware checkpoint. No further hardware rerun is required for this checkpoint.**

Read `AI_PROJECT_RULES.md`, `docs/REMOTE_DEVICES_AUTHORIZATION.md`, and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current checked-in code override older assumptions.

## Immediate checkpoint — read this first

- Working branch: `testbench/v0.2-hardware-validation`.
- Current production/development package version: **0.1.15**.
- Current TestBench revision: **`full-v8-generic-evidence-profile-20260823`**.
- Latest TestBench/publication source checkpoint: **`e80956c25fa5a087030901e945c6e737f0246169`** before the publisher-created report commit and this docs-only handoff update.
- Exact installed/audited module package remains **`focusrite-scarlett-18i20-0.1.15.tgz`** with SHA-256 **`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`**.
- Canonical Windows gate environment: Node **22.23.2**, Yarn **4.17.0** via Corepack.
- Latest whole-repository software gate after the V8 publisher fix: immutable dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, **148/148 tests PASS**, Companion package build PASS.
- The package rebuilt by that later software gate was **not** needed for hardware validation and is not the exact package checkpoint; do not replace the audited SHA above merely because the same 0.1.15 version was rebuilt after TestBench-only changes.
- Exact audited package archive: 6 expected entries only, package/manifest 0.1.15, runtime API 2.0.0, exact product scope Scarlett 18i20 (3rd Gen), privacy clean, no hardcoded Control Server TCP fallback, V8 production safety policy present in the compiled bundle.
- Live Companion 0.1.15 install PASS on the **existing** Focusrite connection: dynamic Control Server discovery, exact supported model detection, server-confirmed subscription, and existing Remote Devices authorization all confirmed.
- Hardware support actually validated/publicly in scope remains **Scarlett 18i20 (3rd Gen) only**.
- Unknown/unvalidated Focusrite models fail closed for writes.
- **V8 FULL-from-zero is now the canonical completed hardware campaign. V6 is historical only.**

## Canonical V8 FULL hardware result — 2026-08-23

Published sanitized result:

`docs/hardware-results/LATEST_SHAREABLE.json`

Canonical public report identity:

- `schemaVersion`: 4;
- `reportClass`: `shareable-sanitized`;
- `generatedAt`: `2026-08-23T18:53:59.160Z`;
- `meta.completed`: `true`;
- `meta.hardwareWrites`: `true`;
- revision: `full-v8-generic-evidence-profile-20260823`;
- signature: `fb915f311956ac65`;
- model: `Scarlett 18i20 (3rd Gen)`;
- r9 logical feedback probes: **829**;
- r9 feedback definitions: **31**;
- `physicalIsolationConfirmed`: **true**;
- `diagnosticResumePhase`: `null`.

Evidence coverage audit:

- inventory rows: **1436**;
- classified rows: **1436**;
- snapshot variables observed/mapped: **1340 / 1340**;
- Core variables observed/mapped: **21 / 21**;
- feedback probes/definitions: **829 / 31**;
- unclassified rows: **0**;
- audit complete: **true**.

Final capability summary:

- `PASS`: **198**;
- `PASS_BASELINE`: **22**;
- `PASS_MANUAL`: **1**;
- `EVAL_ONLY`: **1154**;
- `SKIP_NO_CAPABILITY`: **16**;
- `SKIP_AVAILABILITY_UNKNOWN`: **22**;
- `BLOCKED_BY_SAFETY`: **11**;
- `MANUAL_PENDING`: **5**;
- `BLOCKED_FORBIDDEN`: **3**;
- `UNSUPPORTED`: **4**.

There are **no FAIL / FAIL_MISMATCH / FAIL_NO_EFFECT / QUARANTINED_RESTORE classes in the completed V8 FULL summary**. Non-PASS rows are intentional fail-closed classifications, not hidden successful writes.

Feedback sweeps:

- before: **829 total / 188 PASS / 641 EVAL_ONLY / 0 FAIL**;
- after: **829 total / 190 PASS / 639 EVAL_ONLY / 0 FAIL**;
- dynamic tracked feedbacks: **742**;
- dynamic both states observed: **20**;
- dynamic single state observed: **12**;
- dynamic never observed during the transition window: **710**;
- dynamic failures/mismatches: **0**.

The guided manual phase successfully observed the physical Monitor gain readback and records one `PASS_MANUAL`. The remaining five `MANUAL_PENDING` rows are intentionally not converted into automatic write evidence: targeted meter coverage still requires real signal paths as appropriate, and Device Preset / Clock Source / Sample Rate / S/PDIF Mode remain disruptive/manual-excluded controls.

The 11 `BLOCKED_BY_SAFETY` rows are safety diagnostics associated with pair-aware protection semantics. Physical `ALL_ISOLATED` allowed the reversible campaign to continue without pretending that every pair-owned right member has an independent software source guard. Do not reinterpret these safety rows as failed functional controls.

### Publication repair after the FULL

The FULL itself completed successfully, but the first automatic publication attempt failed **after** hardware completion because the publisher's old allowlist did not yet accept three already-sanitized V8 fields generated by the report code:

- capability `classification`;
- meta `diagnosticResumePhase`;
- meta `evidenceAudit`.

This was a TestBench/publication schema mismatch only; it did not invalidate the hardware campaign.

The publisher was fixed without changing `src/`, the production hardware policy, module version, or hardware writes. The privacy gate now:

- accepts only known V8 classification enum values;
- validates `diagnosticResumePhase` as string/null;
- validates a strict `evidenceAudit` allowlist and numeric fields;
- retains all existing private-path/network/XML/ID rejection rules;
- has a regression test that passes the **current shareable generator directly into the publisher privacy gate**, so future schema drift is caught by the software gate before a hardware FULL.

Canonical post-fix Windows gate: **148/148 tests PASS**.

The already-generated FULL `LATEST_SHAREABLE.json` was then republished without rerunning hardware. Publisher result: **PUBLISH OK in 1 attempt**. GitHub now contains the V8 report identity listed above.

## Permanent safety / protocol rules

Never invent or re-add:

- analogue input preamp gain;
- direct per-input hardware mute;
- per-channel phantom switching;
- Mic Kill;
- physical Monitor level control;
- Monitor gain item 1677 writes;
- Monitor +/- presets;
- unknown/unsafe arbitrary raw writes;
- firmware/reset/restore/snapshot write commands;
- writes to read-only meter/status items.

Monitor gain item **1677 remains read-only**. Physical Monitor movement may be observed; there must be no set/adjust action, preset or raw-write access unless new explicit hardware testing proves a useful write path.

Transport/session rules:

- Focusrite Control Server TCP port is dynamic; never hardcode it.
- Auto mode must fail closed if discovery fails; it must never guess a TCP port.
- Manual mode may use only a TCP port explicitly supplied by the user.
- Focusrite device ID is dynamic; never hardcode it.
- Preserve the existing Companion connection and its stable private client identity.
- Writes require Focusrite Control **Remote Devices** authorization.
- Only approval matching this module's own server-assigned client ID counts.
- Block writes until authorised.
- Feedback/state must be server-confirmed; never fake success with optimistic updates.
- Availability `UNKNOWN` receives no write.

Privacy/publication rules:

- never publish a real serial, private hostname, client key, client/device/connection IDs, raw private XML, private Companion export, diagnostics, private captures or user-specific paths;
- preserve relevant MIT/third-party attribution;
- do not claim all protocol knowledge was independently discovered;
- public Bitfocus source stays clean; autonomous Windows builder/debug/TestBench scripts remain separate unless explicitly requested.

Canonical hardware path:

`TestBench → Companion local API/buttons → existing approved Companion Focusrite connection → Focusrite Control Server → Scarlett`

Never run a direct Focusrite Control Server research probe concurrently with SAFE/FULL/RESUME.

## Remote Devices authorization — mandatory before any future write-capable test

1. reuse the existing Companion Focusrite connection; do not delete/recreate it;
2. Focusrite Control → Device Settings → Remote Devices;
3. use the existing Companion client, normally displayed as `Companion Scarlett 18i20`;
4. approve it if needed;
5. require the read-only preflight to confirm this module's own authorization before writes.

Missing approval is **AUTHORIZATION/PREFLIGHT BLOCKED**, not a hardware/control failure.

Historical read-only research-probe clients are separate clients and irrelevant to normal module testing.

## Production 0.1.15 — current write policy

Production remains specific to Scarlett 18i20 (3rd Gen) and fail-closed for unknown models.

Current direct-output policy is control-specific:

- direct Mute withheld on Out 2/4/6/8/10 because prior hardware behavior was mismatched/non-independent;
- direct right-member Source withheld according to proven Source-specific pair ownership evidence;
- direct Stereo withheld only on the specific right members with direct no-effect evidence; do not infer all Stereo behavior from Source topology;
- right-member Nickname withheld where hardware testing demonstrated no useful effect;
- Gain on Line Out 4/6/8/10 remains hardware-tested no-effect and withheld;
- **Gain on Monitor Out 1/2 remains withheld by safety/restoration policy, not labelled no-effect**;
- public Mixer Slot Source/Stereo writes remain withheld while readback/feedback is preserved;
- public per-lane Mix Talkback writes remain withheld while readback/feedback is preserved;
- global Monitor Talkback remains valid;
- Advanced Raw uses the same hardware policy and cannot bypass withheld/read-only/no-effect targets;
- Monitor gain item 1677 remains read-only;
- `output_pair_source` remains intentionally separate from direct right-member Source policy.

The successful V8 FULL does **not** convert withheld families into write-confirmed controls merely because the overall campaign is green. V8 classifications deliberately preserve prior evidence and withhold unproven members.

## Monitor-pair gain history that led to 0.1.15

A development RESUME before 0.1.15 reached `output:2:gain` with a captured baseline that no longer matched the live server-confirmed value. Exact restoration/fallback could not be confirmed, so the TestBench correctly HARD ABORTED.

Safe interpretation remains:

- simple stereo audio playback normally changes meters, not output gain state;
- the run did not prove a specific Out 1→Out 2 coupling mechanism;
- it did prove that independent exact-restoration semantics for direct Monitor Out 1/2 Gain were not established strongly enough for public writes.

Resulting safeguards still in force:

- Monitor Out 1/2 direct Gain Set/Adjust withheld;
- Advanced Raw cannot target those gains;
- TestBench classifies them `WITHHELD_BY_PROFILE`, not `NO_EFFECT_CONFIRMED`;
- eligible output-gain probes watch captured pair-mate gain during transitions/restoration;
- probe values avoid relying on the `-128` boundary as an exact oracle.

Do not manually reconstruct old Monitor-pair baselines merely to make tests pass.

## Audio-source discipline during hardware tests

During automatic SAFE/RESUME/FULL phases:

- no video/music playback;
- no DAW playback;
- no other intentional audio source through the interface;
- keep downstream speakers/headphones physically safe/isolated as instructed by the launcher;
- do not touch software/system/hardware volume controls during automatic write phases.

The only intentional audio signal should be during an explicit guided `SIGNAL` meter phase. `SILENT` means silent. Monitor 1677 observation requires only physical Monitor movement/readback and should be performed without unnecessary playback.

## Runtime pair-source topology — interpretation

Source-pair topology is a **Source-specific** ownership oracle only.

Observed restored patterns include:

- `REQUESTED_ORIGINAL / ZERO_ORIGINAL`;
- `REQUESTED_ZERO / ZERO_ZERO`.

Both can indicate pair-owned Source behavior, but this conclusion applies only to Source.

Critical rule:

> Source ownership must never automatically become Mute ownership, Stereo ownership, Gain ownership or Nickname ownership.

Each control family requires its own evidence.

## Stereo exact-restore historical evidence

An earlier FULL V7 attempt HARD ABORTED at `output:5:stereo` with captured pair vector `true/true` on Out 5/6 because the then-current action path could not prove exact reconstruction.

The lesson remains valid even though V8 later completed safely:

- known baseline is not automatically known-restorable;
- no synthetic fallback baseline under exact-restore/`ALL_ISOLATED`;
- Source topology is not a Stereo ownership oracle;
- Stereo must use its own pair state and exact restore checks.

Do not claim production Stereo is globally broken from the historical V7 abort.

## Cold-start / SAFE checkpoint

Historical Core cold-start campaign observed 3/21 present:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim may be absent at cold start. Latest automated SAFE history remains 3 PASS / 0 FAIL / 18 SKIP; earlier guarded work separately validated all 21 Core write paths.

Never warm state by writing or invent missing state merely to make SAFE complete.

## Canonical TestBench surfaces

### Page 1 — live r9

`Focusrite 18i20 TB r9 - FULL MATRIX 46x26 [TB-R9-ALL]`

- 46×26 / 1196 controls;
- 42 SAFE setters;
- 829 logical feedback probes / 31 definitions;
- normal T + inverted F pairs;
- feedback cells contain zero actions.

Never publish the live page/export.

### Page 2 — private generated capability harness

`testbench/generated/FULL_EXTENDED.companionconfig`

- snapshot/action-signature-specific;
- Git-ignored/private;
- regenerated when stale;
- must map to the **existing approved Focusrite connection**;
- may be replaced automatically only after explicit user confirmation.

## Page 2 automatic replacement — live-tested PASS

`PAGE2_AUTO` uses Companion 5 single-page import through local tRPC WebSocket `/trpc` and has been exercised successfully live.

Guarantees:

- explicit `PAGE2_AUTO` confirmation required;
- replaces only Page 2;
- preserves Page 1 r9;
- remaps generated `FOCUSRITE TESTBENCH TARGET` to the existing Focusrite connection;
- does not create/recreate the Focusrite connection/client identity;
- audits connection set and unaffected pages before/after;
- re-audits the generated harness after import;
- reruns read-only authorization preflight before hardware resumes;
- Page 2 replacement itself performs no Focusrite hardware write;
- failure/ambiguity is fail-closed.

Upstream Companion MIT-licensed behavior informed this integration; preserve the third-party notice.

## Diagnostic RESUME semantics

RESUME is diagnostic convenience and is never final evidence.

- read-only authorization preflight first;
- fresh live snapshot/availability;
- `ALL_ISOLATED` for the write-capable diagnostic path;
- protective/safety/topology work reruns;
- Page2 Auto may refresh a stale harness;
- exact known-state restore failure still HARD ABORTS;
- successful RESUME stays `meta.completed=false` and is never published as completed FULL evidence.

The clean 0.1.15 RESUME that preceded the final FULL served its purpose; the later completed V8 FULL is now authoritative.

## FULL V6 — historical checkpoint only

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V6.md`.

V6 was the previous completed/public checkpoint and is useful history for model evolution, but **must no longer be described as the latest canonical result**. The public `docs/hardware-results/LATEST_SHAREABLE.json` now contains V8.

## Current software/package state

### Exact package checkpoint used for hardware validation

Canonical exact installed package audit:

- package `focusrite-scarlett-18i20-0.1.15.tgz`;
- SHA-256 `1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`;
- 6 expected archive entries only;
- package/manifest 0.1.15;
- Companion runtime API 2.0.0;
- exact model scope `Scarlett 18i20 (3rd Gen)`;
- no hardcoded `49152`/TCP fallback;
- Auto fails closed when discovery fails;
- Manual mode requires explicit TCP port;
- Remote Devices write block remains compiled;
- state is server-confirmed, not optimistic;
- Advanced Raw is behind hardware policy;
- Monitor Out 1/2 gain writes withheld;
- Mixer Slot Source/Stereo and per-lane Mix Talkback writes withheld;
- Monitor 1677 read-only;
- privacy scan clean.

### Latest repository gate after publisher fix

- Node 22.23.2;
- Yarn 4.17.0 via Corepack;
- immutable install PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **148/148 tests PASS**;
- Companion package build PASS;
- no hardware write from the software gate.

The later build still names the package 0.1.15 because the changes were TestBench/publication/docs only. Do not call that later `.tgz` the exact hardware-tested package unless it receives its own archive audit and installation test; there is currently no need to do so.

Docs-only commits and the sanitized report publication do **not** change the validated package bytes.

## Canonical next sequence

Hardware validation for 0.1.15 / Scarlett 18i20 (3rd Gen) is complete enough for the current candidate. Do **not** rerun FULL merely to obtain a greener-looking report.

Next work should be release/pre-publication work, not more uncontrolled hardware writes:

1. keep exact public support scope at Scarlett 18i20 (3rd Gen);
2. review the final V8 report against the production action/feedback surface and ensure every intentionally withheld family stays withheld;
3. preserve Monitor 1677 read-only and Monitor Out 1/2 direct Gain withholding;
4. keep the exact audited 0.1.15 package checkpoint distinct from later TestBench-only rebuilds;
5. perform final privacy/attribution/source cleanliness audit before any external submission;
6. wait for Bitfocus's official repository/naming decision before changing public module scope/name;
7. when the official repository exists, inspect its exact seed/default branch/permissions and use the expected PR/CI flow rather than overwriting it;
8. stable public release target remains **v1.0.0** unless Bitfocus maintainers direct otherwise;
9. only submit a Developer Portal tag after official repo CI and hardware/action audit are clean.

## Future automation / generic direction

Future Companion automation idea from the live workflow:

- investigate whether Companion exposes a stable local API/tRPC mutation to switch an **existing connection's module version** after importing a package;
- never implement this by deleting/recreating the connection;
- preserve the same connection/client identity and Remote Devices approval;
- require explicit user confirmation before active-version change;
- audit before/after connection identity and selected version;
- research-only until the exact Companion API is identified and live-tested safely.

Broader TestBench direction:

- enumerate what each device/schema exposes;
- preserve read-only discovery even when writes are not allowed;
- distinguish existence, state observability, writability, independence/aliasing, semantic effect, safety and exact restoration;
- classify every observed capability instead of silently dropping unknowns;
- build a separate hardware evidence profile per model;
- never inherit 18i20 conclusions automatically into another Focusrite;
- require a FULL-from-zero campaign for each newly tested hardware model before enabling its write profile;
- eventually add sanitized schema/descriptors ledger/fingerprint so newly appearing descriptors cannot be silently missed.

## Publication state

- Personal repository: `Rzbck/focusrite-control`.
- Default branch: `main`.
- Active validation branch: `testbench/v0.2-hardware-validation`.
- No GitHub Actions on this personal development repository; root `UPDATE_AND_RUN.bat` is the canonical local software gate.
- Sanitized V8 FULL result is now published on the validation branch.
- Official Bitfocus repository/name remains pending.
- Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- The project replied that only Scarlett 18i20 (3rd Gen) is validated today and is open to Bitfocus's preferred naming.
- Keep public support scope at Scarlett 18i20 (3rd Gen) until another device receives real hardware validation.
- Stable public release target remains v1.0.0 after official repository/naming decision, expected Bitfocus branch/PR flow, CI, hardware/action audit, privacy and attribution checks.

When the official Bitfocus repository exists:

1. inspect exact repository name, default branch, seed files and permissions;
2. compare them with the cleaned current RC;
3. use the expected branch/PR workflow rather than overwriting blindly;
4. run Bitfocus CI plus local tests;
5. keep stable public release target at v1.0.0 unless maintainers direct otherwise;
6. submit a Developer Portal tag only after hardware/action audit and CI are clean.
