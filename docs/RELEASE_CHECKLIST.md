# Bitfocus community release checklist

Before asking Bitfocus for the first official release:

- [ ] Replace/confirm the maintainer entry in `companion/manifest.json`
- [ ] Confirm desired repository name with Bitfocus
- [ ] Test with the current stable Companion release
- [ ] Test the packaged `.tgz`, not only the developer checkout
- [ ] Run `yarn check-format`
- [ ] Run `yarn lint`
- [ ] Run `yarn check`
- [ ] Run `yarn test`
- [ ] Run `yarn companion-module-build`
- [ ] Confirm no logs contain a private serial number
- [ ] Confirm auto discovery on a fresh Windows boot
- [ ] Confirm Focusrite client approval survives restart
- [ ] Confirm all presets import without missing action/feedback IDs
- [ ] Confirm routing actions on a non-critical setup
- [ ] Resolve the cold-start readback blocker documented in `COLD_START_READBACK.md`
- [ ] Update CHANGELOG/version
- [ ] Request/confirm the official repository/name through Bitfocus' current module-development process
- [ ] Only tag `v1.0.0` in the official Bitfocus workflow after CI + hardware/action audit are clean
