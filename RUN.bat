@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)
title Focusrite Control - Run current branch

rem A debug branch may provide its own task without changing the updater.
if exist "%~dp0tools\RUN_BRANCH.bat" (
    call "%~dp0tools\RUN_BRANCH.bat"
    set "RUN_CODE=!ERRORLEVEL!"
    endlocal & exit /b !RUN_CODE!
)

set "NODE_READY=0"
where node >nul 2>&1
if not errorlevel 1 (
    node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major === 22 && minor >= 20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 (
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
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node22.ps1"
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
    echo [1/6] Dependances ^(premier install, yarn.lock sera cree localement^)...
    call corepack yarn install
)
if errorlevel 1 goto :fail

echo [2/6] Format...
call corepack yarn check-format
if errorlevel 1 goto :fail

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

echo.
echo ==============================================================
echo RUN OK - branche courante validee et packagee
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do echo Branche : %%B
echo ==============================================================
echo.
endlocal & exit /b 0

:fail
echo.
echo RUN FAILED - aucune promotion Git automatique n'a ete effectuee.
pause
endlocal & exit /b 1
