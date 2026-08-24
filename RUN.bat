@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)
title Focusrite Control - DEBUG software gate

set "CURRENT_CONTEXT_BRANCH=UNKNOWN"
set "CURRENT_CONTEXT_HEAD=UNKNOWN"
set "CURRENT_CONTEXT_HANDOFF=ABSENT"
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_CONTEXT_BRANCH=%%B"
for /f "delims=" %%H in ('git rev-parse --verify HEAD 2^>nul') do set "CURRENT_CONTEXT_HEAD=%%H"
if not "!CURRENT_CONTEXT_HEAD!"=="UNKNOWN" set "CURRENT_CONTEXT_HEAD=!CURRENT_CONTEXT_HEAD:~0,12!"
for /f "delims=" %%H in ('git rev-parse --verify HEAD:docs/CURRENT_HANDOFF.md 2^>nul') do set "CURRENT_CONTEXT_HANDOFF=%%H"
if not "!CURRENT_CONTEXT_HANDOFF!"=="ABSENT" set "CURRENT_CONTEXT_HANDOFF=!CURRENT_CONTEXT_HANDOFF:~0,12!"

echo ==============================================================
echo       CONTEXTE CANONIQUE DU RUN DEBUG
echo ==============================================================
echo Branche      : !CURRENT_CONTEXT_BRANCH!
echo HEAD         : !CURRENT_CONTEXT_HEAD!
echo Handoff blob : !CURRENT_CONTEXT_HANDOFF!
echo ==============================================================
echo SOFTWARE GATE ONLY - aucun probe Focusrite n'est lance par RUN.bat.
echo Le probe direct read-only possede son launcher explicite separe.
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

if "!NODE_READY!"=="0" if exist "%~dp0.build-tools\node22\node.exe" (
    "%~dp0.build-tools\node22\node.exe" -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major === 22 && minor >= 20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 (
        set "PATH=%~dp0.build-tools\node22;!PATH!"
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
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\ENSURE_NODE22.ps1"
    if errorlevel 1 (
        echo ERREUR : impossible de preparer le Node portable 22.20+.
        pause
        endlocal & exit /b 1
    )
    set "PATH=%~dp0.build-tools\node22;!PATH!"
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
set "COREPACK_HOME=%~dp0.build-tools\corepack"
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

if exist "%~dp0yarn.lock" (
    echo [1/6] Dependances ^(lockfile immutable^)...
    call corepack yarn install --immutable
) else (
    echo [1/6] Dependances ^(premier install^)...
    call corepack yarn install
)
if errorlevel 1 goto :fail

echo [2/6] Format...
call corepack yarn check-format
if errorlevel 1 (
    echo.
    echo ==============================================================
    echo PRETTIER DIAGNOSTIC - DIFF EXACT, AUCUN FICHIER SOURCE MODIFIE
    echo ==============================================================
    for /f "tokens=*" %%P in ('corepack yarn prettier --version 2^>nul') do echo Prettier : %%P
    set "FORMAT_FOUND=0"
    for /f "usebackq delims=" %%F in (`corepack yarn prettier --list-different . 2^>nul`) do (
        set "FORMAT_FOUND=1"
        set "FORMAT_TARGET=%%F"
        set "FORMAT_TMP=%TEMP%\FOCUSRITE_PRETTIER_EXPECTED_!RANDOM!_!RANDOM!.tmp"
        echo.
        echo --- !FORMAT_TARGET! ---
        call corepack yarn prettier "!FORMAT_TARGET!" > "!FORMAT_TMP!"
        if not errorlevel 1 (
            git --no-pager diff --no-index -- "!FORMAT_TARGET!" "!FORMAT_TMP!"
        ) else (
            echo ERREUR : impossible de produire la sortie Prettier pour !FORMAT_TARGET!.
        )
        del /Q "!FORMAT_TMP!" >nul 2>&1
    )
    echo.
    echo ==============================================================
    echo FIN PRETTIER DIAGNOSTIC
    echo Copie tout le bloc ci-dessus; aucun probe/hardware n'a ete lance.
    echo ==============================================================
    goto :fail
)

echo [3/6] ESLint...
call corepack yarn lint
if errorlevel 1 goto :fail

echo [4/6] Manifest...
call corepack yarn check
if errorlevel 1 goto :fail

echo [5/6] Tests...
call corepack yarn test
if errorlevel 1 goto :fail

echo [6/6] Companion package...
call corepack yarn companion-module-build
if errorlevel 1 goto :fail

for /f "delims=" %%V in ('node -p "require('./package.json').version"') do set "MODULE_VERSION=%%V"
for /f "delims=" %%P in ('node -p "const p=require('./package.json'); p.name+'-'+p.version+'.tgz'"') do set "PACKAGE_FILE=%%P"

echo.
echo ==============================================================
echo RUN OK - branche debug validee logiciellement et packagee
echo Branche : !CURRENT_CONTEXT_BRANCH!
echo Package : !PACKAGE_FILE!
echo ==============================================================
echo IMPORTANT : NE PAS installer ni activer ce package debug historique.
echo Companion doit rester sur le package 0.1.16 exact deja audite.
echo Aucun probe Focusrite n'a ete lance par ce RUN.
echo ==============================================================
endlocal & exit /b 0

:fail
echo.
echo RUN FAILED - gate logiciel uniquement; aucun probe Focusrite n'a ete lance.
pause
endlocal & exit /b 1
