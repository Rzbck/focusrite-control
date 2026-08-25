# Current handoff — Focusrite Control / Companion

Updated: 2026-08-25 14:23+02:00  
Branch: `testbench/meter-routing-exact-restore`  
Parent objective: **explicit hardware feedback closure**  
Canonical production candidate: audited **0.1.16**  
Current research package: **0.1.19**  
Supported hardware scope: **Scarlett 18i20 (3rd Gen) only**

## Current exact branch state

Before this documentation-only reconciliation, the objective branch remote HEAD was:

`f5d9e038761c86fe2de85aadf58d3c2f294c308a`

The user also confirmed a clean local checkout at short HEAD `f5d9e038761c`.

The latest two commits on that exact branch are updater-only:

- `b37d588a1d1614f494b168d3da463944a9d32397` — `fix: make direct branch updater switch-safe`
- `f5d9e038761c86fe2de85aadf58d3c2f294c308a` — `test: guard switch-safe updater bootstrap`

Their delta changes only:

- `UPDATE.bat`
- `test/update-branch-fetch.test.js`

No `src/` module behavior, protocol logic, hardware action, TestBench hardware path, package version or hardware-safety rule changed in those commits.

## Why the updater fix was necessary

Direct `UPDATE.bat` branch switching had a real cmd.exe self-replacement failure mode.

The tracked `UPDATE.bat` remained the file cmd.exe was reading while a temporary worker switched branches. That switch could replace the tracked batch file. When the worker returned, cmd.exe could resume reading the now-replaced tracked file, producing a second bogus bootstrap attempt/error after the branch switch had already succeeded.

The fix keeps the direct bootstrap continuation inside one already-parsed parenthesized block before the worker may replace the tracked file. HEAD resolution was also hardened to resolve full SHAs first, then shorten them.

This was a tooling blocker only. It did not change Focusrite hardware state.

## Recovered local TestBench artifacts

During recovery from the accidental old debug-branch detour, the local TestBench directory was moved outside the repository before switching back.

Comparison proved:

- current tracked TestBench source tree: **72 files**;
- rescue tree: **135 files**;
- overlap: **none**;
- rescue content: **127 files under `results/` + 8 files under `generated/`**;
- no source file from the rescue required merging.

Those 127 results and 8 generated artifacts were copied back into the current TestBench ignored directories. Final `git status --short` remained empty.

The old `debug/official-client-passive-session` branch must **not** be merged or used as the active hardware-validation base. It is an old divergent research line.

## Mandatory evidence ordering

When information conflicts, use:

1. newest explicit physical-hardware / completed user-host result;
2. current checked-in code and tests;
3. this handoff;
4. broader project/history documents;
5. older captures and assumptions.

Always distinguish:

- `OFFICIAL PRODUCT BEHAVIOUR`
- `SCHEMA_PRESENT`
- `SESSION_STATE_OBSERVED`
- `IMPLEMENTED`
- `HARDWARE_WRITE_CONFIRMED`
- `HARDWARE_DYNAMIC_CLOSED`

`UNKNOWN`, blank, `BASELINE_UNKNOWN`, `SKIP_BASELINE_UNKNOWN`, sparse state, or `never-observed` means only **not observed in this client session** absent stronger evidence. It is never proof that a capability is absent, false, unsupported or impossible.

## Latest completed 0.1.19 user-host software gate

A complete Windows gate for the 0.1.19 module/TestBench lineage completed GREEN before the later updater-only commits:

- dependencies: PASS
- Prettier: PASS
- ESLint: PASS
- source manifest: PASS
- Node tests: **247/247 PASS / 0 FAIL**
- Companion package build: PASS
- package: `focusrite-scarlett-18i20-0.1.19.tgz`
- hardware writes from the gate: **none**

Important precision: current exact HEAD `f5d9e038761c` contains the later updater fix + updater regression tests after that 247/247 gate. Therefore do **not** state that exact current HEAD has completed a fresh full user-host gate until the normal current-HEAD gate is rerun. The actual module package source and hardware TestBench logic were not changed by those updater-only commits.

## Latest completed 0.1.19 assign-mix read-only hardware observation

The existing `testbench\RUN_METER_MIX_BASELINE_READONLY.cmd` probe was run on the Scarlett 18i20 (3rd Gen) after the green 0.1.19 package gate.

Observed:

- output `assign-mix` schema present: **26/26 outputs**
- output `assign-mix` non-empty/current value observed: **0/26 outputs**
- all 26: `UNKNOWN[never-observed]`
- this included the currently Custom-Mix-routed Monitor 1-2 path
- no Focusrite write
- no Companion button press
- no Page 2 replacement
- no manual routing / Mute / Solo / mono-stereo / fader change requested by the probe

Correct classification:

- `assign-mix`: **SCHEMA_PRESENT**
- read-only instrumentation/probe: **IMPLEMENTED**
- hardware observation: **COMPLETED**
- session value: **NOT OBSERVED on all 26 outputs in this run**
- exact value semantics: **UNKNOWN**
- official write transaction semantics: **UNKNOWN**
- public action/preset/feedback write surface: **ABSENT**
- writable IDs / Advanced Raw write surface: **ABSENT**

Do not convert `0/26 observed` into unsupported/false/empty-by-definition. It is a readback/materialisation result only.

## Important limitation of the old NAVIGATE_MIXES observation

Do **not** ask the user to rerun the old `NAVIGATE_MIXES` 30-second countdown.

The old flow called output-routing readback only once before the prompt. During the 30-second loop it repeatedly sampled only Mix gain/mute/solo state. Therefore it could not observe output routing or assign-mix transitions caused during that countdown.

That campaign is not evidence for temporal assign-mix routing transitions and repeating it would be wasted user effort.

## Latest guarded output routing evidence

The latest `RUN_MIX_FEEDBACK_CLOSURE.cmd` write-capable campaign on the existing approved Companion connection exercised the source-item fallback on non-Monitor Line Outputs 3-4.

Exact evidence:

- original source baseline: `Playback 3 + Playback 4`
- one real guarded pair-route write attempted toward Mix A through the existing `source` path
- server did **not** confirm Mix A L/R on outputs 3-4
- exact original `Playback 3 + Playback 4` was server-confirmed restored
- Page 2 restored
- no continuation into speculative Mix Mute/Solo

Classification for this operation only:

`WRITE_ATTEMPTED / NO_CONFIRMED_TRANSITION / EXACT_RESTORE_CONFIRMED`

Do not generalize this to “`output_pair_source` is broken”. Existing normal pair-aware Playback-source routing evidence remains separate.

## assign-mix write status

A direct `assign-mix` write is currently **blocked by restoration evidence**, not declared unsupported.

For a proposed write target, the current `assign-mix` baseline is `never-observed`. Because the property that would be changed lacks an exact server-confirmed baseline, an exact restoration proof cannot currently be guaranteed.

Therefore:

- no direct `assign-mix` write;
- no Advanced Raw shortcut;
- no action/preset addition;
- no speculative write based only on schema presence.

Any future write test requires both:

1. positive evidence for value/transaction semantics;
2. exact server-confirmed baseline + exact restore contract for the changed property.

## Opaque assign-mix class caveat

`src/variables.js` currently exposes sanitized opaque `V1`, `V2`, ... classes only behind the diagnostic variable gate.

Those equality classes are recreated per `buildVariableValues(instance)` refresh. They are suitable only for **same-refresh equality comparison**. They are not stable temporal identities and must never be used across refreshes as a restoration oracle.

## Retained strong Mix evidence

From the earlier dedicated hardware run under the then-tested stereo topology:

- Mix A Left Mute: **HARDWARE_DYNAMIC_CLOSED**, false → true → false, server-confirmed state + rendered feedback + exact restore
- Mix A Left Solo: **HARDWARE_DYNAMIC_CLOSED**, same
- Mix A Right direct Mute: no transition under that tested stereo topology, exact restore
- Mix A Right direct Solo: no transition under that tested stereo topology, exact restore
- Mix B-F: remaining rows stayed baseline/readback-open where exact state was not observed
- restore quarantine: 0

Do not infer a global left/right ownership rule from that topology-specific result.

## Current parent objective status

The parent objective remains **explicit hardware feedback closure** across the current 31 public feedback definitions / 829 instances.

Known retained matrix context includes historical static/oracle coverage and substantial remaining dynamic/manual/readback-open rows. A green software gate or completion of one routing hypothesis does not close the parent objective.

Current major open research/validation families still include, at minimum:

- `mix_mute`: PARTIAL
- `mix_solo`: PARTIAL
- `mixer_slot_stereo`: RESEARCH_OPEN where exact baseline is not materialized
- `mixer_slot_source`: RESEARCH_OPEN
- `output_pair_source`: PARTIAL evidence
- output `assign-mix`: SCHEMA_PRESENT / read-only characterization complete / semantics unknown / no write path
- remaining parent feedback matrix rows that are `EVAL_ONLY`, `MANUAL_PENDING`, `BASELINE_UNKNOWN`, `neverObserved` or otherwise not dynamically closed

Before changing objectives, re-open the matrix and account for remaining safe/actionable rows.

## Immediate next work

1. **Do not run another write-capable Mix/routing campaign yet.**
2. **Do not rerun NAVIGATE_MIXES.**
3. **Do not repeat Mix-A-via-`source` blindly on more output pairs.**
4. **Do not write `assign-mix` while its exact baseline remains never-observed.**
5. Re-open the current 31-definition / 829-instance closure matrix and identify the next remaining safe/actionable gap.
6. Before asking the user for another hardware test, inspect the exact current launcher/probe and prove that it actually observes the target property over time, is not duplicative, preserves privacy, and has an exact restoration contract for every write.
7. If passive official-client observation is still useful, port only the minimal sanitized read-only logic onto this CURRENT objective branch after reviewing current architecture/tests. Do not merge or cherry-pick the old divergent debug branch wholesale.
8. Because the current branch contains updater-only changes after the last 247/247 gate, run the normal current-HEAD software gate before the next hardware campaign if exact-head validation is required.

## Project launcher policy

Use launchers first:

- `UPDATE.bat` — normal sync
- `UPDATE_AND_RUN.bat` — update + software gate
- `RUN.bat` — software gate when already current
- exact `testbench\RUN_*.cmd` — targeted TestBench/hardware work

Manual Git/PowerShell/Node is only a last resort when the launcher itself is broken or cannot expose the required diagnostic. The recent manual recovery was justified by the updater branch-switch bug and is now complete.

## Remote Devices authorization — mandatory before any write

Before any write-capable hardware campaign:

- Focusrite Control → Device Settings → Remote Devices must show the existing `Companion Scarlett 18i20` client approved
- reuse the existing Companion Focusrite connection
- do not delete/recreate it for testing
- authorization must match this module's own server-assigned client ID
- missing approval = `AUTHORIZATION/PREFLIGHT BLOCKED`, not a hardware failure
- no extra direct write clients by default
- never reuse/copy the Companion private client key into another process

Direct Control Server research clients must never run concurrently with a normal Companion SAFE/FULL write-capable campaign.

## Permanent safety contract

- supported hardware: **Scarlett 18i20 (3rd Gen) only**
- Monitor gain item `1677`: **read-only**
- never re-add Monitor set/adjust actions, presets or raw-write access without new hardware proof
- never invent analogue input preamp gain
- never invent direct per-input hardware mute
- never invent per-channel phantom power
- never invent Mic Kill
- never invent physical Monitor level control
- Control Server TCP port and device ID are dynamic; never hardcode them
- writes require Remote Devices authorization matched to this module's own server-assigned client ID
- feedbacks/state must be server-confirmed; no optimistic success
- no unknown/unsafe raw item writes
- no firmware/reset/restore/snapshot commands
- no meter/status writes
- no write to explicit UNKNOWN output availability
- no Focusrite software/firmware update or unrelated routing/hardware changes without explicit agreement
- reversible tests require exact baseline/restore for the property being changed
- restoration failure = quarantine / hard abort
- preserve privacy: no serial, private hostname, client key, raw private XML/captures, private IDs, diagnostics or user-specific paths in public source
- preserve relevant MIT / third-party attribution; do not claim all protocol knowledge was independently discovered

## GitHub Actions policy

Do not add, enable, depend on, wait for, or troubleshoot GitHub Actions in this personal development repository. Validation here is local through the checked-in launchers and Node/Yarn test workflow.

If Bitfocus later creates the official repository and maintainers require official CI/reusable workflows, follow those rules there.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`.

Bryce Seifert suggested `focusrite-control` may be the better repository/module scope because the transport is Focusrite Control Server and offered hardware for future testing. The project response explicitly kept validated scope at Scarlett 18i20 (3rd Gen) only and remained open to Bitfocus's naming preference.

Wait for the official repository/naming decision before changing public scope. Stable public release target remains **v1.0.0** unless maintainers direct otherwise.

## Latest meter next-path reconciliation — source ready / current-head gate pending

The updater fix has now been exercised successfully on the user's real Windows checkout. `UPDATE.bat` remained on `testbench/meter-routing-exact-restore`, fetched the explicit remote branch, fast-forwarded from `f5d9e038761c` to the documentation state, reported local/remote HEAD correctly, and terminated without the former second-bootstrap failure. The updater blocker is therefore **closed by user-host execution**.

The 31-definition matrix was reopened. The next safest useful hardware gap is the existing **read-only meter closure**:

- `output_meter`: **4/26 HARDWARE_DYNAMIC_CLOSED / 22 open**;
- `mix_meter`: **2/12 HARDWARE_DYNAMIC_CLOSED / 10 open**;
- `input_meter`: already **8/8 HARDWARE_DYNAMIC_CLOSED**.

`testbench/MeterFeedbackClosure.js` remains read-only: no Focusrite `<set>`, no Companion button press, no routing change, and no hardware-write path. It compares rendered feedback markers against independent server-confirmed numeric meter variables and accumulates floor + movement evidence.

A stale user-facing version pin was found before asking the user to run it: `RUN_METER_FEEDBACK_CLOSURE.cmd` and the guide still said module **0.1.16**, while `FullTestBenchBase` actually derives `EXPECTED_MODULE_VERSION` from root `package.json` (currently research **0.1.19**). The mismatch was corrected without changing the meter hardware logic:

- `7b0687f1477a814113f597b7d9dabf49a9a94be4` — launcher text aligned with package-backed version contract;
- `b6badeac245f87761553b41d28dc5f9f950827c5` — operator guide aligned with current research package workflow;
- `3b7bfbe9d99d19f0b8f5871914bc2f14673bc57d` — regression prevents stale 0.1.16 launcher pin from returning.

The delta from `e835bc570de43f8dbffb613e6b01ba4be85e0521` through `3b7bfbe9` changes only:

- `testbench/RUN_METER_FEEDBACK_CLOSURE.cmd`;
- `testbench/METER_FEEDBACK_CLOSURE.md`;
- `test/meter-feedback-closure.test.js`.

No `src/` module behavior, protocol logic, hardware write action, or `MeterFeedbackClosure.js` hardware behavior changed.

**Immediate next action:** sync this branch and run the normal **current-HEAD software gate**. Pending is not PASS. Only after a fully green gate should the next hardware observation be `testbench\RUN_METER_FEEDBACK_CLOSURE.cmd`; do not run a Mix/routing write campaign first.

## Living-state rule

After every material software/hardware/user result or blocker, update BOTH:

- root `HANDOFF`
- `docs/CURRENT_HANDOFF.md`

Pending work is never PASS.
