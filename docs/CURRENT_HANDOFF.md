# Current handoff — Focusrite Control / Companion

Updated: 2026-08-23 — **0.1.15 is software-gated, exact-package audited, and loaded successfully on the existing authorised Companion connection. The next hardware step is read-only preflight, then a development RESUME. Do not run final FULL yet.**

Read `AI_PROJECT_RULES.md`, `docs/REMOTE_DEVICES_AUTHORIZATION.md`, and this file before proposing code, tests, hardware work, branch changes or publication changes. Newest explicit hardware evidence and current checked-in code override older assumptions.

## Immediate checkpoint — read this first

- Working branch: `testbench/v0.2-hardware-validation`.
- Current development package version: **0.1.15**.
- Current TestBench revision: **`full-v8-generic-evidence-profile-20260823`**.
- Current software/package checkpoint commit: **`b80ef5d90effd383c2f001554b243d79bde4dc58`**.
- Validated package: **`focusrite-scarlett-18i20-0.1.15.tgz`**.
- Exact audited package SHA-256: **`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`**.
- Canonical Windows gate environment: Node **22.23.2**, Yarn **4.17.0** via Corepack.
- Canonical Windows gate result: immutable dependencies PASS, Prettier PASS, ESLint PASS, source manifest PASS, **146/146 tests PASS**, Companion package build PASS.
- Exact uploaded `.tgz` audit PASS: 6 expected archive entries only, package/manifest 0.1.15, runtime API 2.0.0, exact product scope Scarlett 18i20 (3rd Gen), no private capture/path/serial/client key, no hardcoded Control Server TCP fallback, V8 safety policy present in the compiled bundle.
- Live Companion install PASS on the **existing** Focusrite connection: 0.1.15 runtime loaded, dynamic Control Server discovery succeeded, exact Scarlett 18i20 (3rd Gen) detected, server-confirmed state subscription became active, and the existing Companion client was authorised by Focusrite Control.
- The exact count of initial server-confirmed values can vary between cold starts; that count alone is not a failure. Never invent missing state or warm it by writing.
- Hardware support actually validated/publicly in scope remains **Scarlett 18i20 (3rd Gen) only**.
- Unknown/unvalidated Focusrite models fail closed for writes.
- **Do not run final FULL yet.** Next: read-only preflight → development RESUME → inspect diagnostic → reload known saved configuration → only then FULL-from-zero if RESUME is clean enough.
- V6 remains the latest completed/publishable hardware campaign until a later FULL-from-zero completes.

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

Monitor gain item **1677 remains read-only**. Physical Monitor movement may be observed; there must be no set/adjust action, preset or raw-write access unless new hardware testing proves a useful write path.

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

## Remote Devices authorization — mandatory before any write

Before SAFE, RESUME, FULL, targeted or manual write-capable phases:

1. reuse the existing Companion Focusrite connection; do not delete/recreate it;
2. open Focusrite Control → Device Settings → Remote Devices;
3. find the existing Companion client, normally displayed as `Companion Scarlett 18i20`;
4. approve it if needed;
5. run the read-only preflight and require this module's own authorization state to be confirmed.

Missing approval is **AUTHORIZATION/PREFLIGHT BLOCKED**, not a hardware/control failure.

Historical read-only research-probe clients are separate clients and irrelevant to normal FULL/RESUME work.

## Production 0.1.15 — current write policy

Production remains specific to Scarlett 18i20 (3rd Gen) and fail-closed for unknown models.

Current direct-output policy is control-specific:

- direct Mute withheld on Out 2/4/6/8/10 because hardware behavior was mismatched/non-independent;
- direct right-member Source withheld according to proven Source-specific pair ownership evidence;
- direct Stereo withheld only on the specific right members with direct no-effect evidence; do not infer all Stereo behavior from Source topology;
- right-member Nickname withheld where hardware testing demonstrated no useful effect;
- Gain on Line Out 4/6/8/10 remains hardware-tested no-effect and withheld;
- **Gain on Monitor Out 1/2 is now withheld by safety/restoration policy, not labelled no-effect.** A development RESUME exposed cross-output/restoration uncertainty on the Monitor pair. Readback remains useful, but an independently restorable direct write path is not proven;
- public Mixer Slot Source/Stereo writes remain withheld while readback/feedback is preserved;
- public per-lane Mix Talkback writes remain withheld while readback/feedback is preserved;
- global Monitor Talkback remains valid;
- Advanced Raw uses the same hardware policy and cannot bypass withheld/read-only/no-effect targets;
- Monitor gain item 1677 remains read-only;
- `output_pair_source` remains intentionally unchanged pending completed FULL review.

The exact 0.1.15 package was audited after build and the live module startup was confirmed. This is still **not** a completed hardware campaign; RESUME then FULL-from-zero remain required before 0.1.15 can supersede V6 hardware evidence.

## Latest development RESUME evidence

### Earlier V8 diagnostic family evidence

A prior RESUME reached final reconnect without HARD ABORT and dynamic feedback observation reported 0 mismatches. Its hardware-behavior findings grouped coherently:

- Mute behavior mismatch: Out 2/4/6/8/10;
- direct Source no useful independent transition on tested right members, consistent with Source-specific pair ownership evidence;
- direct Stereo no useful transition on tested Out 2/4/6;
- direct Gain no useful transition on Line Out 4/6/8/10;
- tested right-member Nickname writes previously no-effect;
- Mixer Slot Source tested slots 1–4 no-effect;
- Mixer Slot Stereo tested slots 3–4 no-effect;
- per-lane Mix Talkback tested left lanes A–F no-effect;
- global Monitor Talkback remains separate and valid.

Untested members of a withheld family are **WITHHELD_BY_PROFILE**, not falsely labelled hardware-tested no-effect.

### Latest Monitor-pair abort that led to 0.1.15

The next RESUME exposed a different safety issue around direct Monitor output gain:

- the captured baseline used for `output_2_gain` no longer matched the live server-confirmed value when the Out 2 gain probe was reached;
- exact restoration and fallback to the captured baseline could not be confirmed;
- the TestBench correctly **HARD ABORTED** instead of continuing;
- this does not prove that simple audio playback changes the gain control, and it does not prove a specific Out 1→Out 2 coupling mechanism;
- it does prove that independent exact-restoration semantics for Monitor Out 1/2 Gain are not currently established well enough for public writes.

Resulting 0.1.15 safeguards:

- Monitor Out 1/2 direct Gain Set/Adjust withheld in production;
- Advanced Raw cannot target those gains;
- TestBench profile classifies them `WITHHELD_BY_PROFILE`, not `NO_EFFECT_CONFIRMED`;
- gain probes that remain eligible now watch the captured pair-mate gain during transitions/restoration so cross-member drift cannot silently pass;
- output gain probe uses interior values rather than relying on the `-128` boundary as an exact oracle.

Do not manually reconstruct an old Monitor-pair baseline merely to make a test pass. Start future runs from the user's known saved Focusrite configuration.

## Audio-source discipline during hardware tests

During all automatic SAFE/RESUME/FULL phases:

- no video/music playback;
- no DAW playback;
- no other intentional audio source through the interface;
- keep downstream speakers/headphones physically safe/isolated as instructed by the launcher.

Audio playback normally changes meters, not a gain control, so it is not accepted as a complete explanation for the Monitor-pair restore abort. Nevertheless, eliminating playback removes meter noise and acoustic risk and makes the campaign easier to interpret.

The only intentional audio signal should be during the explicit guided manual `SILENT` / `SIGNAL` meter phase.

## Runtime pair-source topology — interpretation

Source-pair topology is a **Source-specific** ownership oracle only.

Observed restored patterns include:

- `REQUESTED_ORIGINAL / ZERO_ORIGINAL`;
- `REQUESTED_ZERO / ZERO_ZERO`.

Both can indicate pair-owned Source behavior, but this conclusion applies only to Source.

Critical rule:

> Source ownership must never automatically become Mute ownership, Stereo ownership, Gain ownership or Nickname ownership.

Each control family requires its own evidence.

## Stereo exact-restore evidence

FULL V7 attempt 3 HARD ABORTED at `output:5:stereo` with a captured Stereo pair vector `true/true` on Out 5/6. The current action path could not prove exact reconstruction of that captured vector.

Safe interpretation:

- known pair baseline is not automatically known-restorable;
- no synthetic fallback baseline is allowed under exact-restore/`ALL_ISOLATED`;
- `true/true` remains non-writing until an exact restoration path is hardware-proven;
- Source topology must not be reused as a Stereo ownership oracle;
- Stereo checks its own target/mate state and exact restore behavior.

Do not claim production Stereo is globally broken from this evidence.

## Cold-start / SAFE checkpoint

Core cold-start remains 3/21 present in the known campaign history:

- Input 1 Mode;
- Input 2 Mode;
- Talkback.

Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim may remain absent at cold start. Latest automated SAFE evidence remains 3 PASS / 0 FAIL / 18 SKIP; earlier guarded work separately validated all 21 Core write paths.

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

- snapshot-specific;
- Git-ignored/private;
- regenerated when the current harness/action signature changes;
- must map to the **existing approved Focusrite connection**;
- may be replaced automatically only after explicit user confirmation.

## Page 2 automatic replacement — live-tested PASS

`PAGE2_AUTO` uses the real Companion 5 single-page import flow through local tRPC WebSocket `/trpc` and has been exercised successfully on the live Companion instance.

Live-tested guarantees:

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

RESUME exists to avoid repeating the entire matrix after every TestBench defect. It is never final evidence.

- read-only authorization preflight first;
- fresh live snapshot/availability captured;
- `ALL_ISOLATED` required for write-capable diagnostic path;
- mandatory protective/safety/topology work reruns;
- Page2 Auto may prepare a stale harness then rerun preflight;
- exact known-state restore failure still HARD ABORTS;
- successful RESUME remains `meta.completed=false` and is never published as final FULL evidence.

## FULL V6 — latest completed hardware campaign

Detailed record: `docs/HARDWARE_VALIDATION_2026-08-22_V6.md`.

Canonical sanitized result: `docs/hardware-results/LATEST_SHAREABLE.json`.

V6 remains the latest completed public/shareable hardware evidence until a later FULL-from-zero completes.

Important V6 facts:

- 11 AVAILABLE/observable output pairs exercised;
- exact pair Source restoration confirmed;
- pairs 21–22 and 23–24 were availability UNKNOWN and received no topology write;
- Mute was not a reliable ownership oracle;
- Monitor gain 1677 stayed read-only/manual-pending;
- old quarantines reflect older modeling defects and must not be reinterpreted as current live state.

## Current whole-repository software/package state

Canonical 0.1.15 Windows gate on commit `b80ef5d90effd383c2f001554b243d79bde4dc58`:

- Node 22.23.2;
- Yarn 4.17.0 via Corepack;
- immutable dependencies PASS;
- Prettier PASS;
- ESLint PASS;
- source manifest PASS;
- **146/146 tests PASS**;
- Companion package build PASS;
- package `focusrite-scarlett-18i20-0.1.15.tgz`;
- no hardware writes during the software gate.

Exact package audit:

- SHA-256 `1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`;
- 6 expected archive entries only;
- package/manifest version 0.1.15;
- Companion runtime API 2.0.0;
- exact product scope `Scarlett 18i20 (3rd Gen)`;
- no hardcoded `49152`/TCP fallback;
- Auto mode fails closed when discovery fails;
- Manual mode requires an explicit TCP port;
- Remote Devices authorization/write blocking remains in the compiled bundle;
- state remains server-confirmed rather than optimistic;
- Advanced Raw remains behind the hardware policy;
- Monitor Out 1/2 gain writes are withheld;
- Mixer Slot Source/Stereo and per-lane Mix Talkback writes are withheld;
- Monitor gain 1677 remains read-only with no write path;
- no user-specific Windows path, private LAN address, real device serial, raw private capture or embedded private client key.

Live Companion startup after selecting Module Version 0.1.15 also passed: the existing connection launched the 0.1.15 module, dynamically discovered the current Control Server endpoint, detected the exact supported model, subscribed to server state and retained Remote Devices authorization.

A docs-only handoff commit after this checkpoint does **not** change the validated package bytes. Do not rebuild merely because this handoff was updated.

## Immediate next sequence — canonical continuation point

1. Keep the already-loaded **0.1.15** on the existing Focusrite Companion connection. Do not delete/recreate the connection.
2. Do not change Focusrite Control software, firmware, sample rate, clock source, S/PDIF mode, routing or hardware settings as part of the validation sequence.
3. Stop all video/music/DAW playback and other intentional audio sources before automatic hardware phases.
4. Run the **read-only preflight** and require exact Scarlett 18i20 (3rd Gen), dynamic Control Server discovery, existing module client authorised, and connected/authorised status.
5. Before any write-capable phase, confirm physical downstream safety/isolation and the known saved Focusrite configuration.
6. Run a **development RESUME**, not final FULL.
7. If Page 2 is stale, use the live-tested `PAGE2_AUTO` path after explicit confirmation; require its audits and second preflight PASS.
8. Inspect the private RESUME diagnostic. RESUME remains non-publishable.
9. If RESUME is clean enough and reveals no new modeling defect, reload the known saved configuration again.
10. Run a **FULL from zero** for authoritative validation: 829 feedback-before/after, Core, metadata, outputs/pairs, mixer, monitoring, dynamic feedback, guided manual SILENT/SIGNAL meters, read-only physical Monitor 1677 observation and exact restoration.
11. Only a completed FULL-from-zero may replace V6 as canonical hardware evidence.
12. Review remaining `UNKNOWN`, `AVAILABILITY_UNKNOWN`, `MANUAL_PENDING`, `WITHHELD_BY_PROFILE` or mismatched rows intentionally; do not force writes merely to make the report green.

## Future automation / generic direction

Future Companion automation idea from live workflow:

- investigate whether Companion exposes a stable local API/tRPC mutation to switch an **existing connection's module version** after importing a package;
- do not implement this by deleting/recreating the connection;
- preserve the same connection/client identity and Remote Devices approval;
- require explicit user confirmation before changing the active module version;
- audit before/after connection identity and selected version;
- treat this as research-only until the exact Companion API is identified and live-tested safely.

The broader TestBench direction remains:

- enumerate what the device/schema exposes;
- preserve read-only discovery even when writes are not allowed;
- distinguish existence, state observability, writability, independence/aliasing, semantic effect, safety and exact restoration;
- classify every observed capability instead of silently dropping unknowns;
- build a separate hardware evidence profile per model;
- never inherit 18i20 conclusions into a future Focusrite automatically;
- require a FULL-from-zero campaign for each newly tested hardware model before enabling its write profile;
- eventually add a sanitized raw schema/descriptors ledger/fingerprint so newly appearing Focusrite descriptors cannot be silently missed.

## Publication state

- Personal repository: `Rzbck/focusrite-control`.
- Default branch: `main`.
- Active validation branch: `testbench/v0.2-hardware-validation`.
- No GitHub Actions are used on this personal development repository; root `UPDATE_AND_RUN.bat` is the canonical local software gate.
- Official Bitfocus repository/name remains pending.
- Bryce Seifert suggested `focusrite-control` because the transport is Focusrite Control Server and offered hardware for future testing.
- Keep public support scope at Scarlett 18i20 (3rd Gen) until another device has real hardware validation.
- Stable public release target remains v1.0.0 after official repository/naming decision, expected Bitfocus branch/PR flow, CI, hardware/action audit and privacy/attribution checks.

When the official Bitfocus repository exists:

1. inspect exact repository name, default branch, seed files and permissions;
2. compare them with the cleaned current RC;
3. use the expected branch/PR workflow rather than overwriting blindly;
4. run Bitfocus CI plus local tests;
5. keep stable public release target at v1.0.0 unless maintainers direct otherwise;
6. submit a Developer Portal tag only after hardware/action audit and CI are clean.
