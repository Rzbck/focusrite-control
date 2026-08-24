@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "REPO_DIR=%~dp0"
cd /d "!REPO_DIR!"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)
title Focusrite Control - DEBUG isolated software gate

set "CURRENT_CONTEXT_BRANCH=UNKNOWN"
set "CURRENT_CONTEXT_HEAD=UNKNOWN"
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_CONTEXT_BRANCH=%%B"
for /f "delims=" %%H in ('git rev-parse --verify HEAD 2^>nul') do set "CURRENT_CONTEXT_HEAD=%%H"
if not "!CURRENT_CONTEXT_HEAD!"=="UNKNOWN" set "CURRENT_CONTEXT_HEAD=!CURRENT_CONTEXT_HEAD:~0,12!"

echo ==============================================================
echo       CONTEXTE CANONIQUE DU RUN DEBUG
echo ==============================================================
echo Branche      : !CURRENT_CONTEXT_BRANCH!
echo HEAD         : !CURRENT_CONTEXT_HEAD!
echo ==============================================================
echo SOFTWARE GATE ONLY - aucun probe Focusrite n'est lance par RUN.bat.
echo GATE ISOLE - dependances/tests/package dans un worktree temporaire.
echo Le checkout principal ne doit pas etre modifie par Yarn ou le build.
echo ==============================================================
echo.

set "NODE_READY=0"
where node >nul 2>&1
if not errorlevel 1 (
    node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major === 22 && minor >= 20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 (
        where corepack >nul 2>&1
        if not errorlevel 1 set "NODE_READY=1"
    )
)

if "!NODE_READY!"=="0" if exist "!REPO_DIR!.build-tools\node22\node.exe" (
    "!REPO_DIR!.build-tools\node22\node.exe" -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major === 22 && minor >= 20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 (
        set "PATH=!REPO_DIR!.build-tools\node22;!PATH!"
        where corepack >nul 2>&1
        if not errorlevel 1 set "NODE_READY=1"
    )
)

if "!NODE_READY!"=="0" (
    echo Node 22.20+ avec Corepack non disponible dans le PATH.
    echo Preparation du Node portable local ^(.build-tools\node22^)...
    where powershell.exe >nul 2>&1
    if errorlevel 1 (
        echo ERREUR : PowerShell est introuvable pour preparer le Node portable.
        pause
        endlocal & exit /b 1
    )
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "!REPO_DIR!tools\ENSURE_NODE22.ps1"
    if errorlevel 1 (
        echo ERREUR : impossible de preparer le Node portable 22.20+.
        pause
        endlocal & exit /b 1
    )
    set "PATH=!REPO_DIR!.build-tools\node22;!PATH!"
)

node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major === 22 && minor >= 20 ? 0 : 1)" >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Node 22.20+ reste indisponible.
    pause
    endlocal & exit /b 1
)
where corepack >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Corepack est introuvable avec le Node selectionne.
    pause
    endlocal & exit /b 1
)

set "COREPACK_ENABLE_DOWNLOAD_PROMPT=0"
set "COREPACK_HOME=!REPO_DIR!.build-tools\corepack"
if not exist "!COREPACK_HOME!" mkdir "!COREPACK_HOME!" >nul 2>&1
for /f "tokens=*" %%V in ('node -p "process.versions.node"') do set "NODE_VERSION=%%V"
for /f "tokens=*" %%Y in ('corepack yarn --version 2^>nul') do set "YARN_VERSION=%%Y"
if not defined YARN_VERSION (
    echo ERREUR : Corepack ne parvient pas a lancer Yarn.
    pause
    endlocal & exit /b 1
)
echo Node : !NODE_VERSION!
echo Yarn : !YARN_VERSION! ^(via Corepack^)

set "GATE_DIR=%TEMP%\FOCUSRITE_DEBUG_GATE_!RANDOM!_!RANDOM!"
set "GATE_ACTIVE=0"
echo [0/6] Worktree temporaire isole...
git worktree add --detach "!GATE_DIR!" HEAD >nul 2>&1
if errorlevel 1 (
    echo ERREUR : impossible de creer le worktree temporaire du gate.
    goto :fail_no_worktree
)
set "GATE_ACTIVE=1"
pushd "!GATE_DIR!"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir le worktree temporaire.
    goto :fail
)

if exist "yarn.lock" (
    echo [1/6] Dependances ^(lockfile immutable^)...
    call corepack yarn install --immutable
) else (
    echo [1/6] Dependances ^(workspace debug isole, lockfile local temporaire^)...
    call corepack yarn install
)
if errorlevel 1 goto :fail_in_worktree

rem This is a historical debug branch. Do not retroactively reformat the entire
rem old branch with today's Prettier. Format-gate only the JS research delta
rem added for the current Mix-presence investigation. Semantic gates below
rem (ESLint, manifest, full tests and package build) still run repository-wide.
set "FORMAT_TARGETS=tools\mix-presence-probe-lib.js tools\readonly-mix-presence-probe.js test\mix-presence-probe.test.js"
echo [2/6] Format ^(research delta only^)...
call corepack yarn prettier --check !FORMAT_TARGETS!
if errorlevel 1 (
    echo.
    echo ==============================================================
    echo PRETTIER DIAGNOSTIC - RESEARCH DELTA ONLY, WORKTREE TEMPORAIRE
    echo ==============================================================
    for /f "tokens=*" %%P in ('corepack yarn prettier --version 2^>nul') do echo Prettier : %%P
    for /f "usebackq delims=" %%F in (`corepack yarn prettier --list-different !FORMAT_TARGETS! 2^>nul`) do (
        set "FORMAT_TARGET=%%F"
        set "FORMAT_TMP=%TEMP%\FOCUSRITE_PRETTIER_EXPECTED_!RANDOM!_!RANDOM!.tmp"
        echo.
        echo --- !FORMAT_TARGET! ---
        call corepack yarn prettier "!FORMAT_TARGET!" > "!FORMAT_TMP!"
        if not errorlevel 1 git --no-pager diff --no-index -- "!FORMAT_TARGET!" "!FORMAT_TMP!"
        del /Q "!FORMAT_TMP!" >nul 2>&1
    )
    echo ==============================================================
    goto :fail_in_worktree
)

echo [3/6] ESLint...
call corepack yarn lint
if errorlevel 1 goto :fail_in_worktree

echo [4/6] Manifest...
call corepack yarn check
if errorlevel 1 goto :fail_in_worktree

echo [5/6] Tests...
call corepack yarn test
if errorlevel 1 goto :fail_in_worktree

echo [6/6] Companion package...
call corepack yarn companion-module-build
if errorlevel 1 goto :fail_in_worktree

for /f "delims=" %%P in ('node -p "const p=require('./package.json'); p.name+'-'+p.version+'.tgz'"') do set "PACKAGE_FILE=%%P"
popd
set "GATE_ACTIVE=0"
git worktree remove --force "!GATE_DIR!" >nul 2>&1
git worktree prune >nul 2>&1

echo.
echo ==============================================================
echo RUN OK - branche debug validee dans un worktree isole
echo Branche : !CURRENT_CONTEXT_BRANCH!
echo Package debug construit puis supprime avec le worktree : !PACKAGE_FILE!
echo ==============================================================
echo IMPORTANT : aucun package debug n'est laisse dans le checkout principal.
echo Companion doit rester sur le package 0.1.16 exact deja audite.
echo Aucun probe Focusrite n'a ete lance par ce RUN.
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
echo RUN FAILED - gate logiciel isole; aucun probe Focusrite n'a ete lance.
echo Le checkout principal n'a pas ete utilise comme workspace Yarn/build.
pause
endlocal & exit /b 1
