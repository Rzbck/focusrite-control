# Sanitized runtime diagnostics

This branch is reserved for machine-generated **sanitized** diagnostic summaries.

Current producer: `debug/cold-start-readback`.

Stable latest-result path:

`diagnostics/runtime/latest-readback.md`

Raw local logs, private paths, hostnames, network endpoints, serials, client/device IDs, raw Focusrite XML and private captures must never be committed here.

The publisher on the debug branch validates the report before pushing. Commit history preserves prior sanitized results.

This diagnostics branch is not a code/release branch and does not use GitHub Actions.
