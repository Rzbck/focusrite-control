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

5. Put this repository inside it:

```text
C:\Companion-Modules\companion-module-focusrite-scarlett-18i20\
```

6. Open Companion Launcher.
7. Open Settings / Advanced settings.
8. Select `C:\Companion-Modules\` as the developer modules folder.
9. Enable Developer Modules.
10. Launch Companion and add the Focusrite Scarlett 18i20 connection.

The developer folder is the **parent**, not the module repository itself.

## Option B — branch-safe one-click developer workflow

At repository root:

- `UPDATE_AND_RUN.bat`: fetch/prune, choose a remote branch, fast-forward update, then run validation/package;
- `UPDATE.bat`: update/switch branch only;
- `RUN.bat`: validate/package the current branch only.

The launchers use a temporary worker copy so a `git switch` cannot replace the batch file currently being executed. `RUN.bat` uses the standard Node 22 / Yarn 4 toolchain; it does not install or update Focusrite software, firmware or drivers.

## First connection

Use Auto-discovery.

If Focusrite Control asks for approval, approve `Companion Scarlett 18i20`.

Before any hardware-changing test:

1. confirm the module reaches `OK`;
2. confirm the exact model is `Scarlett 18i20 (3rd Gen)`;
3. confirm this module client is authorised;
4. confirm required initial state is server-known and safely restorable;
5. only then use a guarded reversible test.

The currently hardware-tested reversible Core subset is Air 1–8, Pad 1–8, Input 1/2 Line/Instrument, Monitor Mute, Monitor Dim and Talkback. The cold-start readback blocker must be resolved before rerunning the full guarded sequence on v0.1.12.

Do not use routing, sample-rate or other extended actions as a first test merely because they are implemented. They require their own hardware/action audit.

## Community QA checklist

- Auto discovery works after a Windows reboot
- Manual mode works
- Stable approval survives a Companion restart
- Device ID changes do not break the module
- Monitor feedback follows server-confirmed state
- Air/Pad feedback follows server-confirmed state
- Cold-start missing state remains unknown rather than being guessed
- No meter flood in Companion logs
- Extended output/mixer/routing/settings features remain labelled implemented/schema-observed until separately hardware-audited
- No action claims to mute raw analogue input
- No per-input 48 V action is present
