# Hardware validation record — 2026-08-21 — V4 Capability Lab

This record is intentionally sanitized. It contains no device serial/nickname, hostname, client key, dynamic port, connection/device/client IDs, raw XML, Companion export, generated page, user path, or private capture.

## Validation scope

Hardware-tested device for this run:

- **Focusrite Scarlett 18i20 (3rd Gen)**

This run does **not** validate or claim support for any other Focusrite model.

The TestBench architecture is being moved toward a profile/capability model so additional Focusrite Control devices can be onboarded later with their own hardware evidence. Hardware writes remain blocked for models without an explicit hardware-tested write profile.

## Windows gate before hardware

The user completed the full branch gate on `testbench/v0.2-hardware-validation`:

- Node 22.23.2
- Yarn 4.17.0
- immutable dependencies: PASS
- Prettier: PASS
- ESLint: PASS
- source manifest: PASS
- Node tests: **64/64 PASS**
- Companion package build: PASS
- development package version: **0.1.13**
- `UPDATE_AND_RUN`: SUCCESS

## V4 PREP pass

First FULL pass was PREP-only and made zero hardware writes.

- r9 audit: 42 SAFE setters + 829 logical feedback probes + 31 feedback definitions
- exact validated model / module client authorization: PASS
- live shape: 8 inputs / 26 outputs / 24 mixer slots / 12 lanes
- output availability: 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN
- generated isolated page-2 harness: 742 batches
- snapshot signature: `633db9a04dac677c`
- exit code: 6 PREP REQUIRED

The generated Companion page remains private/local and is not committed.

## V4 hardware campaign result

Campaign revision:

`full-v4-capability-lab-20260821`

The imported page matched the PREP snapshot and the hardware campaign completed without a global HARD ABORT.

Feedback sweeps:

- before: 113 PASS / 716 EVAL_ONLY / 0 FAIL / 829 total
- after: 124 PASS / 705 EVAL_ONLY / 0 FAIL / 829 total

Capability summary:

- BLOCKED_BY_SAFETY: 1280
- BLOCKED_FORBIDDEN: 3
- EVAL_ONLY: 6
- FAIL_MISMATCH: 1
- FAIL_NO_EFFECT: 13
- MANUAL_PENDING: 4
- PASS: 39
- PASS_BASELINE: 1
- PASS_INDEPENDENT: 11
- QUARANTINED_RESTORE: 12
- SKIP_AVAILABILITY_UNKNOWN: 18
- SKIP_NO_CAPABILITY: 16
- UNSUPPORTED: 4

Exit code: 2.

## Important interpretation

### Output pair pattern

The run exposed a strong pair/leader-follower pattern rather than random output failures:

- independently observable mute cycles were confirmed on outputs 1, 3, 5, 7, 9, 11, 13, 15, 17, 19 and 25;
- the corresponding paired members frequently had blank/unusable direct state and/or direct nickname/gain/mute behavior that did not act independently;
- output 2 produced the single mute `FAIL_MISMATCH` and pair/follower-style source/stereo behavior;
- several even/right pair members were reported as restore quarantine because V4 required the target variable itself to prove restoration before considering mate/alias behavior.

Do not interpret the quarantined paired members as proven defective physical outputs. The next TestBench revision must classify pair aliases before declaring restore failure and must avoid assuming every exposed per-output variable is independently owned while a pair is linked.

### Why global signal-path safety stayed false

The four outputs with `availability=UNKNOWN` were correctly protected from writes. However, V4 also required every potentially active output to have an entry in the active safety map. Because UNKNOWN outputs were removed from the write-safety pass, they could never satisfy that global test even when their existing mute state was already server-confirmed ON.

This made the global mixer/Core signal-path gate overly conservative and accounts for most of the 1280 `BLOCKED_BY_SAFETY` rows.

Next revision behavior:

- still **never write** an output whose availability is UNKNOWN;
- re-read its mute state;
- if Mute ON is already server-confirmed, accept it as a **passive safety guard**;
- otherwise leave it unsafe and keep dependent signal-path tests blocked.

This preserves the no-guess/no-write rule while avoiding a false global deadlock.

## Privacy defect found

The raw V4 JSON was described as sanitized but still included live capability `state` values. One of those values was the live device nickname and could contain a serial-like identifier.

Therefore:

- the raw JSON from this campaign is **private diagnostic material and must not be published**;
- future reports now generate a separate `.shareable.json` / `LATEST_SHAREABLE.json` payload that omits all live state values and nickname contents;
- automatic publication to GitHub is intentionally **not** enabled yet;
- only the sanitized shareable payload may be considered for a future explicit/opt-in publishing workflow after the local privacy gate passes.

No private nickname/serial-like value is recorded in this document.

## TestBench hardening started after this run

Implemented on the working branch, but **not yet Windows-gated or hardware-validated**:

1. profile registry semantics now separate hardware-tested/write-enabled profiles from unvalidated discovery profiles;
2. hardware write preflight uses the profile registry rather than an additional hardcoded exact-model condition;
3. paired mute classifier can recognize target-to-mate alias behavior before declaring target restore failure;
4. UNKNOWN-availability outputs may provide passive safety only when live Mute ON is server-confirmed, with no write;
5. paired/alias follower metadata/source/gain/stereo tests are no longer automatically treated as independent failures;
6. compact terminal phase/progress output was added;
7. raw JSON is explicitly private and a separate sanitized shareable JSON is generated;
8. privacy tests cover removal of live nickname/state/path content from the shareable report.

These changes require a fresh `UPDATE_AND_RUN.bat` gate before any new hardware run.

## Scope rule for future Focusrite devices

The project may ultimately live under a broader `focusrite-control` module/repository name if Bitfocus chooses that scope. Architecture should support adding models by detected capability plus explicit per-model validation profiles.

Until real tests exist, additional models remain **unvalidated/unsupported for hardware writes**. A broader architecture or repository name is not a claim that all Focusrite devices are already supported.
