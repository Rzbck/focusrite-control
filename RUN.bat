@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "REPO_DIR=%~dp0"
cd /d "!REPO_DIR!"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)
title Focusrite Control - DEBUG read-only research gate

set "CURRENT_BRANCH=UNKNOWN"
set "CURRENT_HEAD=UNKNOWN"
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%B"
for /f "delims=" %%H in ('git rev-parse --verify HEAD 2^>nul') do set "CURRENT_HEAD=%%H"
if not "!CURRENT_HEAD!"=="UNKNOWN" set "CURRENT_HEAD=!CURRENT_HEAD:~0,12!"

echo ==============================================================
echo       FOCUSRITE DEBUG - READ-ONLY RESEARCH GATE
echo ==============================================================
echo Branche : !CURRENT_BRANCH!
echo HEAD    : !CURRENT_HEAD!
echo ==============================================================
echo GATE CIBLE UNIQUEMENT LE PROBE READ-ONLY.
echo Aucun probe Focusrite n'est lance par RUN.bat.
echo Aucun package Companion debug n'est construit ou installe.
echo Companion reste sur le 0.1.16 exact deja audite.
echo ==============================================================
echo.

set "NODE_EXE="
where node >nul 2>&1
if not errorlevel 1 (
    node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)
if not defined NODE_EXE if exist "!REPO_DIR!.build-tools\node22\node.exe" (
    "!REPO_DIR!.build-tools\node22\node.exe" -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=!REPO_DIR!.build-tools\node22\node.exe"
)
if not defined NODE_EXE (
    echo ERREUR : Node 22.20+ introuvable.
    echo Aucun probe/hardware n'a ete lance.
    pause
    endlocal & exit /b 1
)
echo Node 22.20+ detecte.

set "GATE_DIR=%TEMP%\FOCUSRITE_READONLY_GATE_!RANDOM!_!RANDOM!"
set "GATE_ACTIVE=0"
echo [0/3] Worktree temporaire exact HEAD...
git worktree add --detach "!GATE_DIR!" HEAD >nul 2>&1
if errorlevel 1 (
    echo ERREUR : impossible de creer le worktree temporaire.
    goto :fail_no_worktree
)
set "GATE_ACTIVE=1"
pushd "!GATE_DIR!"
if errorlevel 1 goto :fail

echo [1/3] Syntaxe du chemin read-only...
"!NODE_EXE!" --check tools\readback-probe-lib.js
if errorlevel 1 goto :fail_in_worktree
"!NODE_EXE!" --check tools\mix-presence-probe-lib.js
if errorlevel 1 goto :fail_in_worktree
"!NODE_EXE!" --check tools\readonly-mix-presence-probe.js
if errorlevel 1 goto :fail_in_worktree

echo [2/3] Tests protocole / allowlist read-only...
"!NODE_EXE!" --test test\readback-probe.test.js
if errorlevel 1 goto :fail_in_worktree

echo [3/3] Tests Mix presence / non-ecriture / launcher...
"!NODE_EXE!" --test test\mix-presence-probe.test.js
if errorlevel 1 goto :fail_in_worktree

popd
set "GATE_ACTIVE=0"
git worktree remove --force "!GATE_DIR!" >nul 2>&1
git worktree prune >nul 2>&1

echo.
echo ==============================================================
echo READ-ONLY RESEARCH GATE OK
echo Aucun probe Focusrite n'a ete lance.
echo Aucun package Companion n'a ete construit/installe.
echo Le launcher RUN_READONLY_MIX_PRESENCE.cmd reste une etape separee.
echo ==============================================================
endlocal & exit /b 0

:fail_in_worktree
popd
:fail
if "!GATE_ACTIVE!"=="1" (
    git worktree remove --force "!GATE_DIR!" >nul 2>&1
    git worktree prune >nul 2>&1
    set "GATE_ACTIVE=0"
)
:fail_no_worktree
echo.
echo READ-ONLY RESEARCH GATE FAILED.
echo Aucun probe Focusrite, write hardware ou package Companion n'a ete lance.
pause
endlocal & exit /b 1
