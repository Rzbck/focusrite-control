# Changelog

## 0.1.21 — 2026-08-26

Technical v1 release candidate for **Scarlett 18i20 (3rd Gen)**.

- Withhold `output_pair_source` from the installed public action/preset surface after repeated exact two-member hardware `NO_TRANSITION` results.
- Keep direct Output Source/Gain/Nickname writes only on validated targets and fail closed on unavailable/unknown Outputs.
- Retain the Output-definition lifecycle refresh so server-confirmed availability materialisation updates filtered actions/presets.
- Keep Custom Mix, Stereo/Mono and ALT readback server-confirmed while their generic Companion write actions remain withheld.
- Preserve dynamic Control Server discovery, own-client Remote Devices authorisation and non-optimistic feedback/state.
- Final user-host gate: 306/306 tests PASS and Companion package build PASS.
- Final retained-public-write hardware smoke: 42/42 PASS with exact restore/reconnect clean.
- Final cumulative read-only Custom Mix coverage: COMPLETE, including 12/12 Custom Mix meters.

## 0.1.20 — 2026-08-26

- Introduced the restrictive v1 public-output policy and cold-start Output-definition lifecycle repair.
- Exact pair-routing hardware audit exposed the dedicated two-member routing contract as unclosed, leading to the 0.1.21 withholding decision.

## Earlier 0.1.x development

Earlier versions were hardware/protocol research and validation builds. Detailed TestBench campaigns, captures and internal handoff material remain available in repository history and the dedicated research branch rather than the public RC tree.
