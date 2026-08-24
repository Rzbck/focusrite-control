# Current handoff - Focusrite Control / Companion

Updated: 2026-08-24T15:15+02:00
Branch: `testbench/meter-routing-exact-restore`
Gate: `FEEDBACK_HARDWARE_CLOSURE_AUDIT_REQUIRED`
Exact fully validated final software-audit checkpoint: `fba6d977a59b6381ae11c736a68fc809afb55840`
Canonical production candidate kept in Companion: exact audited **0.1.16**

## MANDATORY STARTUP FRESHNESS GATE — ALWAYS DO THIS FIRST

Future AI/contributors must never resume from an embedded SHA, old chat summary, copied handoff, uploaded handoff or remembered branch without first checking the live repository.

Before proposing code, hardware work, release work, branch changes, or asking the user to run anything:

1. identify the branch that actually owns the current objective;
2. fetch that remote branch and resolve its **current HEAD**;
3. inspect the **latest relevant commits/diff** since the last validated checkpoint;
4. read `docs/CURRENT_HANDOFF.md` from that live branch/ref;
5. inspect the current code/tests affected by the objective;
6. inspect the newest sanitized validation/hardware result when relevant;
7. reconcile any **newer result validated by the human user**;
8. only then state where the project is and choose the next action.

**An SHA written inside this file is a checkpoint, not permission to skip fetching the live branch.**

Evidence priority:

1. newest explicit physical-hardware evidence / completed human-validated run;
2. newest completed software gate evidence;
3. current checked-in code/tests and latest relevant commits;
4. this living handoff;
5. broader project/history documents;
6. older captures/assumptions.

Always distinguish **hardware-tested**, **software-tested**, **implemented**, **schema-observed**, **research-only**, **pending**, and **unsupported**.

## Important correction — software green does NOT mean all feedbacks hardware-tested

The final Windows software gate is genuinely green at `fba6d977...`: Node/Yarn/dependencies/Prettier/ESLint/manifest PASS, Node tests **192/192 PASS**, package build PASS and RUN OK. That gate performed **NO hardware writes, SAFE/FULL or direct probe**.

Do not confuse that software result with hardware feedback closure.

The completed V8 hardware report did cover/classify all public feedback definitions, but coverage is not equivalent to dynamic physical exercise:

- feedback definitions: **31**;
- feedback probe instances: **829**;
- `feedbackAfter.pass`: **190**;
- `feedbackAfter.evalOnly`: **639**;
- feedback FAIL: **0**;
- dynamic feedback instances: **742**;
- observed in both states: **20**;
- observed in only one state: **12**;
- never dynamically observed during the campaign: **710**;
- dynamic feedback FAIL: **0**.

Examples proving that many feedbacks were not dynamically exercised:

- `input_air`: 8/8 EVAL_ONLY; dynamic bothStates 0, neverObserved 8;
- `input_pad`: 8/8 EVAL_ONLY; dynamic bothStates 0, neverObserved 8;
- `output_mute`: 7 PASS / 19 EVAL_ONLY after V8; dynamic bothStates 0, neverObserved 26;
- `monitor_mute`, `monitor_dim`, `monitor_alt`, `monitor_alt_enable`: EVAL_ONLY in the V8 feedback result;
- `mix_mute`: 288/288 EVAL_ONLY; dynamic neverObserved 288;
- `mix_solo`: 288/288 EVAL_ONLY; dynamic neverObserved 288;
- `mixer_slot_source`: 16 PASS / 8 EVAL_ONLY, while the dynamic tracker did not observe state transitions for those 24 instances;
- several source/mode/monitor feedbacks did receive real dynamic evidence, but not the entire feedback surface.

Therefore it is incorrect to state that every feedback has been physically/dynamically tested merely because the V8 evidence audit is complete or because the software gate is green.

## Current objective — explicit feedback closure audit

Before declaring publication validation complete, audit the **31 feedback definitions** against the newest hardware evidence and classify every definition/instance as one of:

1. **HARDWARE_DYNAMIC_CLOSED** — required state transition(s) were actually observed and matched the feedback oracle;
2. **HARDWARE_STATIC_CONFIRMED** — server-confirmed value matched the oracle, but no deliberate/observed transition proves both states;
3. **EVAL_ONLY_SAFE_ACTIONABLE** — not dynamically closed yet, but a reversible hardware test may be safe if exact restoration is available;
4. **EVAL_ONLY_NONACTIONABLE** — exact baseline/availability/safety prevents a responsible write test;
5. **READ_ONLY_STATUS** — meaningful validation is passive state/server observation rather than a write cycle;
6. **UNSUPPORTED/BLOCKED** — deliberately unsupported, forbidden, or unavailable.

Do **not** rerun FULL blindly. First build this classification from the existing V8 sanitized report, the later meter-closure evidence, current production definitions and current safety rules. Only then propose a targeted hardware campaign for genuinely safe/actionable gaps.

No new hardware write should be proposed merely to turn an EVAL_ONLY row into PASS if exact restoration cannot be guaranteed.

## Meter feedback closure — newer evidence overrides V8 static meter PASS labels

The later dedicated meter-closure work is the stronger evidence for actual meter movement. There are 46 meter paths:

- inputs: **8/8 closed**;
- outputs: **4/26 closed**;
- mixes: **2/12 closed**;
- total: **14/46 closed**;
- mismatch: **0**.

So **32/46 meter paths are not dynamically closed** even though the earlier V8 feedback oracle may have reported static PASS for numeric meter values.

Mix A L/R remain closed from exact-baseline hardware evidence.

Mix B-F remain **baseline-unknown / safely non-actionable**:

- `ACTIONABLE=0`;
- `ALREADY_CLOSED=2`;
- `BASELINE_UNKNOWN=10`.

Do not infer right-lane state from left-lane state, assume mute/solo defaults, reconnect repeatedly, or write merely to manufacture a baseline. The completed direct read-only Mix research reproduced the missing B-F baseline-state pattern through a fresh Control Server subscription; that specific research is complete and retired.

## Production package checkpoints

Keep Companion on the exact audited/live-validated package already installed:

`focusrite-scarlett-18i20-0.1.16.tgz`

SHA-256:

`d839b4756ff416199423b3a06b86604fbf7c2f496ee270398d412ff17ecfb5fc`

Do **not** replace it with audit/debug/TestBench builds solely because they pass software tests.

Canonical V8 FULL package remains:

`focusrite-scarlett-18i20-0.1.15.tgz`

SHA-256:

`1e7a947fbde0ca3e408ede45260c972cd7275ee8ce8522b2cd60187cb24d8077`

0.1.15 is the exact package used for the completed V8 FULL-from-zero hardware campaign. 0.1.16 is the later restrictive output-availability safety hardening and adds no hardware write capability.

## Production / RC safety audit

Confirmed from current source/tests and preserved by the final 192/192 software gate:

- package version remains 0.1.16;
- supported hardware claim remains only `Scarlett 18i20 (3rd Gen)`;
- Control Server TCP port and active device ID remain dynamic;
- no production hardcoded TCP fallback port;
- stable private Companion client identity is preserved;
- approval applies only to this module's own server-assigned client ID;
- writes remain blocked until authorised;
- feedbacks/variables remain server-confirmed only;
- unknown state never becomes optimistic success or a guessed state-derived write;
- output availability policy fails closed for false/blank/unknown explicit availability;
- Advanced Raw cannot bypass the hardware/evidence/availability policy;
- Monitor gain item **1677 remains read-only** and absent from actions/presets/raw writes;
- no analogue input preamp gain;
- no direct per-input hardware mute;
- no per-channel phantom switching;
- no Mic Kill;
- no physical Monitor level control;
- no firmware/reset/restore/snapshot write surface;
- attribution preserves upstream Bitfocus MIT notice and acknowledges public prior protocol work.

Disruptive Device Preset, Clock Source, Sample Rate and SPDIF/Digital I/O mode remain implemented/schema-known but are not claimed as fully hardware-tested merely because their feedback can be passively evaluated.

## Remote Devices authorization — mandatory before any write

The canonical normal client is the existing approved **Companion Scarlett 18i20** connection.

Before any future write-capable hardware test:

1. **reuse the existing Companion Focusrite connection**;
2. open **Focusrite Control → Device Settings → Remote Devices**;
3. confirm `Companion Scarlett 18i20` remains approved;
4. require authorization for this module's own current server-assigned client ID;
5. if approval/preflight is absent, classify **AUTHORIZATION/PREFLIGHT BLOCKED** and perform no hardware write;
6. follow `docs/REMOTE_DEVICES_AUTHORIZATION.md`.

Read-only `device-subscribe` not requiring approval does not weaken the write rule.

### No extra direct clients by default

Do not create a new direct Control Server client merely to inspect state Companion can already expose. A direct research client may create another Remote Devices row and requires an explicit reason plus user warning/agreement before launch.

**Never reuse/copy the Companion private client key into another process.**

Never run a direct research client concurrently with SAFE/FULL/write-capable Companion validation.

## Permanent unsupported/safety rules

Keep unchanged:

- current hardware support only Scarlett 18i20 (3rd Gen);
- Monitor gain 1677 read-only;
- no input preamp gain, direct input mute, per-channel phantom, Mic Kill or physical Monitor level;
- no unknown/unsafe raw writes;
- no firmware/reset/restore/snapshot commands;
- no write when explicit output availability is false/unknown;
- server-confirmed feedback/state only;
- dynamic Control Server port/device ID;
- no Focusrite software/firmware/routing/hardware setting changes without explicit user agreement.

## Validation tooling status

The final software gate is green and the launcher/bootstrap recovery problems are resolved/regression-covered. Do not rerun the software gate merely because this handoff bookkeeping changes.

The original `E:\_Project\focusrite-control` checkout still contains a safety stash created during recovery. The clean audit worktree was used for final software validation. Do not pop/delete that stash or clean the original checkout casually; cleanup is separate housekeeping and not part of feedback validation.

## Privacy / attribution

Never publish real serials, private hostnames, server client IDs, client keys, raw private XML/captures, live Companion exports containing private connection data, private diagnostics/logs or user-specific paths.

Preserve MIT/third-party notices and do not claim all protocol knowledge was independently discovered.

## Publication state

The official Bitfocus repository/name decision is still pending, but **do not treat that as the only remaining project task** until the explicit feedback hardware-closure audit above is complete.

Bryce Seifert suggested `focusrite-control` may be the better transport-level scope and offered future hardware; validated hardware scope remains only Scarlett 18i20 (3rd Gen).

Do not rename public IDs/packages or broaden support until maintainers decide.

## Exact immediate next step

Perform a **read-only feedback closure audit** from current source + `docs/hardware-results/LATEST_SHAREABLE.json` + later meter-closure evidence.

Produce a 31-definition matrix that separates static oracle PASS from actual dynamic hardware closure, identifies all EVAL_ONLY rows, and marks which gaps are genuinely safe/actionable versus non-actionable by exact-restore/availability/safety rules.

Only after that matrix is complete decide whether any targeted hardware test is justified. Do not rerun FULL and do not invent a write path to close evidence.