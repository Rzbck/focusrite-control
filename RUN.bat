@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)
title Focusrite Control - Run current branch
rem .gitattributes keeps BAT/CMD files on CRLF because cmd.exe label jumps can fail on LF-only files.

set "CURRENT_CONTEXT_BRANCH=UNKNOWN"
set "CURRENT_CONTEXT_HEAD=UNKNOWN"
set "CURRENT_CONTEXT_HANDOFF=ABSENT"
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_CONTEXT_BRANCH=%%B"
for /f "delims=" %%H in ('git rev-parse --short=12 HEAD 2^>nul') do set "CURRENT_CONTEXT_HEAD=%%H"
if exist "%~dp0docs\CURRENT_HANDOFF.md" (
    for /f "usebackq delims=" %%L in (`findstr /B /C:"Updated:" "%~dp0docs\CURRENT_HANDOFF.md" 2^>nul`) do (
        if "!CURRENT_CONTEXT_HANDOFF!"=="ABSENT" set "CURRENT_CONTEXT_HANDOFF=%%L"
    )
)
echo ==============================================================
echo       CONTEXTE CANONIQUE DU RUN
necho ==============================================================
echo Branche : !CURRENT_CONTEXT_BRANCH!
echo HEAD    : !CURRENT_CONTEXT_HEAD!
echo Handoff : !CURRENT_CONTEXT_HANDOFF!
echo ==============================================================
echo Un handoff copie/uploade plus ancien est historique si son HEAD
necho ne correspond pas au checkout Git synchronise ci-dessus.
echo ==============================================================
echo.

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
    if "!FORMAT_FOUND!"=="0" (
        echo ERREUR : Prettier a echoue mais --list-different n'a retourne aucun fichier.
    )
    echo.
    echo ==============================================================
    echo FIN PRETTIER DIAGNOSTIC
    echo Copie tout le bloc ci-dessus pour diagnostic; aucun write hardware.
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
echo RUN OK - branche courante validee et packagee
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do echo Branche : %%B
echo Package : !PACKAGE_FILE!
echo ==============================================================
echo.
echo IMPORTANT : ce RUN construit le package mais ne l'installe pas
echo ni ne l'active dans Companion.
echo Pour tester cette build dans Companion :
echo   1. Modules ^> Import module package ^> !PACKAGE_FILE!
echo   2. Connections ^> connexion Focusrite ^> Module Version ^> !MODULE_VERSION!
echo Puis relance le preflight avant tout test hardware.
echo.
endlocal & exit /b 0

:fail
echo.
echo RUN FAILED - aucune promotion Git automatique n'a ete effectuee.
pause
endlocal & exit /b 1
