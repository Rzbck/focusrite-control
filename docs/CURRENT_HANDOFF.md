# Current handoff — Focusrite Control / Companion

Updated: 2026-08-26  
Branch: `testbench/meter-routing-exact-restore`  
Current development build: **0.1.20**  
Supported hardware: **Scarlett 18i20 (3rd Gen) only**

## Startup freshness gate

Before resuming, verify the live repository and newer material branch movement. Resolve the current remote HEAD of the objective branch, inspect newer commits/diff, then read root `HANDOFF`, this file, `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`, `docs/FEEDBACK_HARDWARE_CLOSURE_MATRIX.md`, and relevant current source/tests/evidence.

Evidence priority: newest explicit physical hardware/user-host result → completed direct-write evidence/current code/tests → current handoff → matrix/docs → older captures/assumptions.

Always distinguish `HARDWARE_DYNAMIC_CLOSED`, `HARDWARE_WRITE_CONFIRMED`, `SESSION_STATE_OBSERVED`, `SCHEMA_PRESENT`, `IMPLEMENTED`, `RESEARCH_ONLY`, `CONFIGURATION_UNAVAILABLE`, `UNKNOWN`, and `UNSUPPORTED`.

## Current objective — repaired RC validation

The broad hardware feedback/protocol investigation remains **closed for the v1 scope by explicit evidence or deliberate write withholding**.

However, the previous technical-RC closure was superseded by a real V1 RELEASE SMOKE result: the smoke produced **39 Output `NO_TRANSITION` results** while Input/Device/Monitor actions worked and the global exact-restore audit passed.

This was diagnosed as a runtime lifecycle regression, not as a hardware capability regression. During cold start, the restrictive output policy could build action definitions before server-confirmed Output availability had materialised. Later state packets updated variables/feedbacks but did not rebuild the filtered Output action surface.

The repair is now implemented and software-gated. One targeted V1 RELEASE SMOKE with the repaired package is still required, followed by a fresh exact package/privacy/forbidden-feature audit.

Do **not** run another broad REC/FULL campaign.

## Green software/package checkpoint for the repair

Exact tested runtime/package checkpoint:

`05a6c1801d75012fef864358c2f80c3758934ad7`

The user-host `UPDATE_AND_RUN.bat` gate completed successfully on 2026-08-26:

- Node 22.23.2: PASS;
- Yarn 4.17.0: PASS;
- immutable dependency install: PASS;
- Prettier: PASS;
- ESLint: PASS;
- source manifest: PASS;
- **295/295 Node tests: PASS**;
- Companion package build: PASS;
- generated package: `focusrite-scarlett-18i20-0.1.20.tgz`.

The newly added lifecycle regressions passed explicitly:

- `ready plus initial Output availability materialisation refreshes the filtered write surface once`;
- `ordinary state does not rebuild definitions but later Output availability changes do`.

No Focusrite hardware write was performed by the software gate.

## Runtime repair

Changed runtime file:

- `src/main.js`

Regression coverage:

- `test/output-definition-refresh.test.js`

Behavior:

- action/preset definitions refresh in a debounced way when the client becomes ready;
- Output availability materialisation/change refreshes the filtered action/preset surface;
- ordinary non-meter state does not rebuild definitions;
- callback-time availability checks remain in place and still fail closed;
- no withheld action is restored;
- no raw/unknown write path is added.

## Artifact audit status

The earlier exact `.tgz` audit and SHA-256

`cfa4ba62c11e2a91780122eb38a0a0570d6122e0c5fc7d91652008a6838a5716`

belong to the older `fd76b4e6...` package and are now **historical for the repaired runtime**.

Because `src/main.js` changed after that audit, the new `05a6c180...` archive must be audited again before final RC closure. Do not reuse the old SHA/audit as proof for the repaired package.

## 0.1.20 gate history

1. First attempt: dependencies PASS, Prettier blocked on two formatting-only files.
2. Second attempt: Prettier/ESLint/manifest PASS, **273/282 tests PASS**, 9 stale policy/history regressions diagnosed and repaired.
3. Third attempt: one Prettier-only blocker in `src/definition-policy.js`; repaired.
4. Fourth attempt: **282/283 tests PASS**, one brittle HANDOFF wording assertion; repaired.
5. `fd76b4e6...`: **283/283 tests PASS + package PASS**; exact archive audit also passed.
6. Subsequent real V1 RELEASE SMOKE exposed the cold-start Output-definition lifecycle defect despite the synthetic package audit.
7. `05a6c180...`: lifecycle repair; **295/295 tests PASS + package PASS**.
8. Remaining: one targeted V1 RELEASE SMOKE on the repaired package, then fresh exact artifact audit.

## Exact next action

Use the package that was just generated from `05a6c1801d75012fef864358c2f80c3758934ad7`.

1. In Companion: **Modules → Import module package** → `focusrite-scarlett-18i20-0.1.20.tgz`.
2. Keep the existing Focusrite connection and set its **Module Version** to `0.1.20`.
3. Run the canonical read-only preflight first so the existing module client and Remote Devices authorization are confirmed.
4. Run the canonical **V1 RELEASE SMOKE V3** only.
5. Preserve the smoke's exact-restoration contract. Do not manually reset routing/settings merely because the previous smoke already restored successfully.
6. If the smoke is clean, perform a fresh exact `.tgz` package/privacy/forbidden-feature audit and then close the repaired RC.

No additional broad hardware manipulation, REC, sample-rate change, Digital I/O change, Focusrite software/firmware update, or exploratory raw write is needed.

## Final v1 public write surface

Authoritative policy audit: `docs/PUBLIC_ACTION_SURFACE_AUDIT_2026-08-26.md`.

### Kept public writes

Monitor:

- `monitor_mute`;
- `monitor_dim`;
- `monitor_talkback`;
- `monitor_preset`.

Hardware Inputs:

- `input_air`;
- `input_pad`;
- `input_mode`;
- `input_mode_cycle`;
- `input_nickname`.

Outputs, filtered by exact model, retained evidence, and server-confirmed availability:

- `output_mute` on validated direct members only;
- `output_gain_set` / `output_gain_adjust` on validated analogue gain targets;
- `output_source` on validated direct targets/direct source families;
- `output_pair_source` on validated pairs/direct stereo source families;
- `output_nickname` on validated direct targets.

Device/settings:

- `device_nickname`;
- `phantom_persistence`;
- `talkback_source`;
- `reconnect`.

### Withheld public writes for v1

Readable state may remain, but normal v1 write actions/presets are removed:

- `monitor_alt_enable`;
- `monitor_alt`;
- `output_stereo`;
- `mixer_slot_source`;
- `mixer_slot_stereo`;
- `mix_mute`;
- `mix_solo`;
- `mix_gain_set`;
- `mix_gain_adjust`;
- `mix_pan`;
- `mix_talkback`;
- `device_preset`;
- `clock_source`;
- `sample_rate`;
- `spdif_mode`;
- `advanced_raw_set`.

Withholding is deliberate v1 scope control, not a claim that readable capabilities do not exist.

## Output policy

- Direct Mute stays withheld on right/pair-owned members.
- Pair-owned right Source stays withheld from direct routing while validated pair routing remains available.
- Monitor Outputs 1–2 direct Gain stays withheld.
- Known no-effect Gain/Nickname paths stay withheld.
- Output Stereo write stays withheld globally.
- Outputs 21–24 stay write-blocked even if a future configuration reports them available until that available configuration is explicitly hardware-tested.
- Explicit `available=false` or unknown availability blocks writes wherever an availability descriptor exists.
- Definitions now refresh when Output availability materialises/changes, while callbacks continue to re-check live availability before every retained Output write.

## Custom Mix / `assign-mix`

Focusrite Control presents simply **Custom Mix**. Internal server mix IDs do not have a reliable user-visible mapping.

`assign-mix` remains:

- 26/26 `SCHEMA_PRESENT`;
- 0/26 materialised in active tested sessions;
- raw semantics `UNKNOWN`;
- write transaction `UNKNOWN`;
- no public action/preset/feedback;
- no raw write.

Output Source/Pair Source actions do not offer internal Custom Mix source IDs, and stale attempts are callback-blocked.

Do not rerun `NAVIGATE_MIXES`; do not write `assign-mix`; it is not a v1 blocker.

## Newest broad readback evidence

Latest sanitized read-only REC: `2026-08-26T06:29:16.831Z`, module `0.1.19`.

Fingerprint:

- size 606632 bytes;
- SHA-256 `308a78f3b48391dec292f634a8eb0082ee0111da42a2977c9ea61e074bfa06f9`.

Result:

- read-only harness;
- zero harness hardware writes;
- zero Companion button presses;
- 829 probes / 31 feedback definitions / 46 meters;
- **11 transitions / 11 PASS / 0 race / 0 mismatch**.

### ALT / Speaker Switching

Feedback/readback is `HARDWARE_DYNAMIC_CLOSED`:

- `monitor_alt_enable`: both states, 3 PASS transitions;
- `monitor_alt`: both states, 4 PASS transitions;
- Output 3 availability changed with Speaker Switching ownership;
- 0 race / 0 mismatch.

ALT writes remain withheld for v1 because Companion direct-write evidence did not equivalently close those transactions.

### Meters

Current configuration:

- Inputs: **8/8 closed**;
- available Outputs: **22/22 closed**;
- Custom Mix: **12/12 closed**;
- total: **42/46 floor + movement closed**;
- Outputs 21–24 are `available=false`: **CONFIGURATION_UNAVAILABLE**, not unsupported.

No remaining meter test. Do not change Sample Rate or Digital I/O merely for coverage.

## Passive REC state rule

A read-only/passive recorder does **not** require the user to restore Focusrite Control to its starting state merely because the final snapshot differs.

Exact baseline/restoration remains mandatory only for write-capable reversible hardware tests where safe rollback is part of the test contract.

## User-facing terminology

For user instructions, use the terms visible in Focusrite Control:

- **Custom Mix**;
- **Hardware Inputs**;
- **Software (DAW) Playback**;
- **Outputs**;
- **Stereo**;
- **Mute**;
- **MAIN**;
- **ALT**.

Do not instruct the user to manipulate internal protocol/TestBench `Mix A-F` names.

## Permanent safety boundaries

- Scarlett 18i20 (3rd Gen) only.
- Focusrite Control Server TCP port and device ID are dynamic.
- Writes only after Remote Devices authorization for this module's own server-assigned client ID.
- Feedback/state are server-confirmed only; never optimistic.
- No write to UNKNOWN or explicit `available=false`.
- Monitor gain item `1677` is read-only.
- No physical analogue input preamp Gain action.
- No direct per-input hardware Mute.
- No per-channel phantom switching.
- No Mic Kill.
- No unknown/unsafe raw writes.
- No firmware/reset/restore/snapshot or meter/status writes.
- Do not update Focusrite software/firmware without explicit agreement.
- Preserve privacy and required MIT/third-party attribution; do not claim all protocol knowledge was independently discovered.

## Publication state

A repository request is already posted in Bitfocus Companion Slack `#module-development`. Bryce Seifert suggested `focusrite-control` may be the better repository/module scope and offered hardware for future testing.

Keep supported hardware at **Scarlett 18i20 (3rd Gen) only**. Wait for the official repository/naming decision before changing public scope.

After the repaired runtime smoke and fresh artifact audit are clean, return to the publication wait state rather than broadening testing.
