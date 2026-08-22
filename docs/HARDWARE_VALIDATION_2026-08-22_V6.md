# Hardware validation — FULL V6 device-wide campaign

Date: 2026-08-22

Model: **Focusrite Scarlett 18i20 (3rd Gen)** only.

Module version under test: **0.1.13**.

Campaign revision: `full-v6-device-wide-topology-feedback-20260822`.

Canonical sanitized result:

`docs/hardware-results/LATEST_SHAREABLE.json`

## Preconditions

- existing r9 page audit: 42 SAFE setters + 829 logical feedback probes + 31 feedback definitions;
- module client server-authorised;
- exact hardware-tested Scarlett 18i20 (3rd Gen) profile;
- live shape 8 inputs / 26 outputs / 24 mixer slots / 12 lanes;
- output availability 22 AVAILABLE / 0 UNAVAILABLE / 4 UNKNOWN;
- Page 2 private harness: 768 audited controls / snapshot `0952a7b921b71e89`;
- explicit `ALL_ISOLATED` acknowledgement before device-wide routing writes;
- normal disruptive settings excluded;
- Monitor gain item 1677 read-only.

## Campaign completion

The campaign completed and the sanitized report published successfully. There was no global HARD ABORT.

Console summary:

- `BLOCKED_BY_SAFETY`: 1260;
- `BLOCKED_FORBIDDEN`: 3;
- `EVAL_ONLY`: 6;
- `FAIL_MISMATCH`: 11;
- `FAIL_NO_EFFECT`: 13;
- `MANUAL_PENDING`: 6;
- `PASS`: 63;
- `PASS_BASELINE`: 8;
- `PASS_INDEPENDENT`: 11;
- `QUARANTINED_RESTORE`: 13;
- `SKIP_AVAILABILITY_UNKNOWN`: 22;
- `SKIP_NO_CAPABILITY`: 16;
- `UNSUPPORTED`: 4;
- exit code 2.

## Device-wide pair topology evidence

Eleven AVAILABLE/observable output pairs were exercised with immediate exact restore. Pairs 21–22 and 23–24 remained availability UNKNOWN and received no topology write.

For every exercised pair, the server-confirmed topology pattern was the same:

- routed source observation: `REQUESTED_ORIGINAL`;
- Pair Source=None observation: `ZERO_ORIGINAL`;
- typical timeline: `OTHER_ORIGINAL > ZERO_ORIGINAL`;
- exact original pair restore confirmed through the audited pair action path.

This is hardware evidence for the exercised pairs on this Scarlett 18i20 (3rd Gen) state/configuration. It is not a claim about other Focusrite models.

Interpretation: pair operations are not behaving like two independently writable source controls. The left member changes to the requested/None state while the right member remains on its original server-reported source. This generalizes the earlier pair 3–4 observation across the available pairs exercised in this campaign.

## Global signal-path safety

`globalSignalPathSafety = false`.

Remaining blockers after mute/source safety discovery:

- Output 4: `source-none-unconfirmed`;
- Output 6: `source-none-unconfirmed`;
- Output 8: `source-none-unconfirmed`;
- Output 10: `source-none-unconfirmed`.

Outputs 21–24 remained availability UNKNOWN and were never written; their existing server-confirmed Mute ON states were accepted only as passive guards.

## Restore quarantines

Thirteen individual functional rows ended `QUARANTINED_RESTORE`:

- Output 2 source;
- Output 12 source;
- Output 12 stereo;
- Output 14 source;
- Output 14 stereo;
- Output 16 source;
- Output 16 stereo;
- Output 18 source;
- Output 18 stereo;
- Output 20 source;
- Output 20 stereo;
- Output 26 source;
- Output 26 stereo.

These quarantines occurred **after** the pair-topology phase had already demonstrated exact pair restoration. The pattern is therefore consistent with a TestBench modeling defect: later individual-output tests still treated pair-owned/right-member controls as independently writable/restorable.

Do not interpret these rows as proof that the device globally failed to restore. Because the individual restore was not server-confirmed, the safe operational response remains: restore the user's saved normal Focusrite configuration before reconnecting downstream outputs.

## Output mute / follower evidence

Eleven output-mute rows were `FAIL_MISMATCH`: Outputs 2, 4, 6, 8, 10, 12, 14, 16, 18, 20 and 26. Eleven other outputs were `PASS_INDEPENDENT`.

Do not encode a generic parity rule for other devices. For this tested profile, combine the explicit profile pair topology with the runtime pair observations rather than using mute behavior alone to decide ownership.

## Feedback coverage

Before hardware writes:

- 177 PASS;
- 652 EVAL_ONLY;
- 0 FAIL.

After the campaign:

- 180 PASS;
- 649 EVAL_ONLY;
- 0 FAIL.

The V6 independent-oracle mapping covered all 31 public feedback definitions, but a large number of feedbacks remained EVAL_ONLY because the old global signal-path guard still blocked many mixer/lane functional transitions. Therefore this V6 run is **not** complete dynamic validation of all 829 feedbacks.

The next TestBench revision must validate reversible feedbacks during the transitions it performs, not only in before/after sweeps.

## Manual observations

### Meter dynamics

The user performed the guided READY phase with an initial silence period, then real signal activity, then returned to silence. The sanitized report still recorded both-state coverage `0/46`, so no meter feedback received a two-state manual PASS. This remains `MANUAL_PENDING` and requires a better targeted meter-exercise design; no false PASS is claimed.

### Monitor gain 1677

Physical Monitor movement was observed through the read-only server value. Exact return to the original server value was not confirmed after the manual return, so the row remains `MANUAL_PENDING`.

This does **not** permit any Monitor gain software write. Item 1677 remains read-only.

## TestBench defects exposed by V6

1. Pair topology was correctly observed device-wide, but later output-family tests still used mute alias detection as the main ownership decision and therefore attempted unsafe/meaningless individual right-member source/stereo tests.
2. `ALL_ISOLATED` was used for the topology sweep, but the mixer/lanes/monitoring phases still depended on the old logical `globalSafety` flag, leaving 1260 rows blocked despite explicit physical isolation.
3. Feedback validation remains too static: reversible feedbacks need to be observed during the corresponding action transitions.
4. Manual meter dynamics need a more targeted signal plan; a generic 20-second window did not produce two-state coverage.
5. Monitor readback capability was demonstrated by physical movement, but requiring exact physical return to the identical server value is too strict for the capability claim and should be separated from the user-safety return prompt.

## Required next direction

- Do not rerun the same V6 campaign.
- Restore the saved normal Focusrite configuration before reconnecting downstream outputs.
- Preserve V6 as hardware evidence.
- Build the next TestBench revision around runtime pair-ownership evidence plus the validated profile topology.
- Skip or reclassify individual right-member source/stereo writes once pair ownership has been demonstrated.
- Under explicit `ALL_ISOLATED`, allow reversible mixer/lane/monitoring tests with exact local restoration and HARD ABORT on any unconfirmed restore, instead of blocking everything on `globalSignalPathSafety`.
- Observe feedbacks during the transitions that exercise them and report two-state/static/manual/excluded coverage explicitly.
- Keep public hardware support scope at Scarlett 18i20 (3rd Gen) only.
