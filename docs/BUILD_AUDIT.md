# Build audit for integration baseline v0.1.12

Generated against the sanitized synthetic Scarlett 18i20 (3rd Gen) schema fixture used by the public test suite.

- JavaScript syntax checks: PASS
- Node built-in unit tests: PASS
- Exact-schema action/feedback/variable/preset audit: PASS
- JSON parse validation: PASS
- Unsupported raw-input Gain/Mute/48V guard audit: PASS
- Server-truth / unknown-state feedback/action regression tests: PASS
- Monitor gain item 1677 read-only/write-surface regression audit: PASS

The exact hardware-schema audit is performed during generation only. No private device serial number or raw packet capture is included in this source package.

## Packaging status

The v0.1.12 baseline completed the full Windows validation pipeline on the real development host:

- Prettier check: PASS
- ESLint: PASS
- source manifest validation: PASS
- source entrypoint smoke: PASS
- Node tests: 23/23 PASS
- `companion-module-build`: PASS
- packaged manifest: module 0.1.12 / Module API 2.0.0
- packaged entrypoint smoke: PASS

This public development mirror uses the standard Node 22 / Yarn 4 workflow. Local autonomous build tooling is intentionally kept separate from the public tree.

## Companion 5.0.3 API compatibility

Companion 5.0.3 uses `@companion-module/host 1.1.1`, whose supported module API range is `2.0.0-0` through `2.0.0`.

This source pins `@companion-module/base` to **2.0.0**. The validated Windows packaging path confirmed the generated package manifest used `runtime.apiVersion` **2.0.0** on Companion 5.0.3.
