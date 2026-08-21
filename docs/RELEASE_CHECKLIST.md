# Bitfocus community release checklist

Before asking Bitfocus for the first official release:

- [ ] Replace/confirm the maintainer entry in `companion/manifest.json`
- [ ] Confirm desired repository/module name with Bitfocus
- [ ] Inspect the exact official Bitfocus repository, default branch, seed files and permissions once it exists
- [ ] Test with the current stable Companion release required by Bitfocus at publication time
- [ ] Test the packaged `.tgz`, not only the developer checkout
- [ ] Run `yarn check-format`
- [ ] Run `yarn lint`
- [ ] Run `yarn check`
- [ ] Run `yarn test`
- [ ] Run `yarn companion-module-build`
- [ ] Confirm the cold-start state contract tests pass: explicit target writes allowed only under the verified authorization/write guards; state-derived actions blocked while state is unknown
- [ ] Confirm feedbacks/variables remain server-confirmed only and unknown state is never defaulted
- [ ] Confirm Monitor gain item `1677` remains read-only and absent from actions/presets/raw writes
- [ ] Confirm no unsupported analogue input gain/direct input mute/per-channel 48V/Mic Kill controls are exposed
- [ ] Confirm no raw logs/captures contain a private serial number, hostname, client key/client ID/device ID, private path or private XML
- [ ] Confirm auto discovery on a fresh Windows boot when doing the final official hardware/action audit
- [ ] Confirm Focusrite client approval survives restart
- [ ] Confirm all presets import without missing action/feedback IDs
- [ ] Confirm routing/settings actions selected for official support are hardware-audited on a non-critical setup
- [ ] Confirm CHANGELOG/version are final for the official repository
- [ ] Use the official repository's required branch/PR/CI workflow
- [ ] Only tag `v1.0.0` in the official Bitfocus workflow after CI + hardware/action audit are clean

The earlier cold-start readback research is **not an open blocker for the already validated explicit controls**. The supported behavior is defined in `STATE_CONTRACT.md`; incomplete readback remains a documented protocol limitation.
