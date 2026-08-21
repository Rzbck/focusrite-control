# Build audit for development candidate v0.1.13

Generated against the sanitized synthetic Scarlett 18i20 (3rd Gen) schema fixture used by the public test suite.

- JavaScript syntax checks: PASS
- Node built-in unit tests: PASS
- Exact-schema action/feedback/variable/preset audit: PASS
- JSON parse validation: PASS
- Unsupported raw-input Gain/Mute/48V guard audit: PASS
- Server-truth / unknown-state feedback/action regression tests: PASS
- Explicit-vs-state-derived cold-start contract regression tests: PASS
- Monitor gain item 1677 read-only/write-surface regression audit: PASS
- Sanitized RC status privacy/rejection tests: PASS

The exact hardware-schema audit is performed against sanitized fixtures. No private device serial number, hostname, client key, raw private XML or packet capture is included in this source package.

## Packaging status

The v0.1.13 RC completed the full Windows validation pipeline on the real development host using Node 22.23.2:

- Prettier check: PASS
- ESLint: PASS
- source manifest validation: PASS
- Node tests: **31/31 PASS**
- `companion-module-build`: PASS
- hardware writes during the automated RC validation: none

The production control behavior for the state-contract promotion was already present before the RC. The release-hardening branch adds tests/documentation/validation tooling and applies the repository's configured Prettier style; it does not introduce a new hardware write path.

The previously hardware-tested reversible mappings remain Air 1–8, Pad 1–8, Input 1/2 Line/Instrument, Monitor Mute, Monitor Dim and Talkback. Broad hardware cycling is not repeated merely for version churn when production behavior is unchanged.

This public development mirror uses the standard Node 22 / Yarn 4 workflow. Local autonomous build tooling is intentionally kept separate from the public tree.

## Companion 5.0.3 API compatibility

Companion 5.0.3 uses `@companion-module/host 1.1.1`, whose supported module API range is `2.0.0-0` through `2.0.0`.

This source pins `@companion-module/base` to **2.0.0**. The validated Windows packaging path confirmed the generated package manifest used `runtime.apiVersion` **2.0.0** on Companion 5.0.3.
