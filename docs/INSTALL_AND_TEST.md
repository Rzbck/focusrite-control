# Install, build and test on Windows

## Option A — developer module

1. Install Node.js 22.20+ and enable Corepack.
2. Open a terminal in this module directory.
3. Run:

```bat
corepack enable
yarn
yarn test
```

4. Create a parent folder such as:

```text
C:\Companion-Modules\
```

5. Put this repository inside it, for example:

```text
C:\Companion-Modules\companion-module-focusrite-scarlett-18i20\
```

6. Open Companion Launcher.
7. Open Settings / Advanced settings.
8. Select the parent developer-modules folder.
9. Enable Developer Modules.
10. Launch Companion and add the Focusrite Scarlett 18i20 connection.

The developer folder is the **parent**, not the module repository itself.

## Option B — branch-safe one-click developer workflow

At repository root:

- `UPDATE_AND_RUN.bat`: fetch/prune, choose a remote branch, fast-forward update, then run validation/package;
- `UPDATE.bat`: update/switch branch only;
- `RUN.bat`: validate/package the current branch only.

The update launchers use a temporary worker copy so a `git switch` cannot replace the batch file currently being executed. `RUN.bat` uses the standard Node 22 / Yarn 4 toolchain; it does not install or update Focusrite software, firmware or drivers.

The v0.1.13 state-contract RC passed Prettier, ESLint, source manifest validation, **31/31 Node tests** and `companion-module-build` on the real Windows development host.

## First connection

Use Auto-discovery.

If Focusrite Control asks for approval, approve the Companion remote-device client shown by Focusrite Control.

Before any hardware-changing test:

1. confirm the module reaches `OK`;
2. confirm the exact model is `Scarlett 18i20 (3rd Gen)`;
3. confirm this module's own server-assigned client ID is authorised;
4. use only a hardware-tested or explicitly audited action;
5. if the test depends on restoring the previous value, require that previous value to be server-confirmed before changing it.

The hardware-tested reversible Core subset is Air 1–8, Pad 1–8, Input 1/2 Line/Instrument, Monitor Mute, Monitor Dim and Talkback.

## Cold-start state contract

A fresh Control Server subscription may omit Air 1–8, Pad 1–8, Monitor Mute and Monitor Dim. Missing values remain **unknown**.

This does not block an explicit target action such as `On` or `Off` when the action is verified writable, the module is connected and its own client is authorised. It **does** block actions that derive a new value from the old one, including Toggle, mode Cycle and relative adjustments.

Feedbacks and variables change only from server-confirmed state. The module never writes merely to discover/warm the current state.

See `STATE_CONTRACT.md` for the supported contract.

Do not use routing, sample-rate or other extended actions as a first hardware test merely because they are implemented. They require their own hardware/action audit before being described as hardware-tested.

## Community QA checklist

- Auto discovery works after a Windows reboot
- Manual mode works when intentionally configured
- Stable approval survives a Companion restart
- Dynamic device ID changes do not break the module
- Monitor feedback follows server-confirmed state
- Air/Pad feedback follows server-confirmed state
- Cold-start missing state remains unknown rather than being guessed
- Explicit target writes remain guarded by connection + verified writable item + this client's authorization
- Toggle/cycle/relative actions do not write from unknown state
- No meter flood in Companion logs
- Extended output/mixer/routing/settings features remain labelled implemented/schema-observed until separately hardware-audited
- No action claims to mute raw analogue input directly
- No per-input 48 V action is present
- Monitor gain item `1677` remains read-only
