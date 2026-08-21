@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Focusrite Control - Run current branch

rem A debug branch may provide its own task without changing the updater.
if exist "%~dp0tools\RUN_BRANCH.bat" (
    call "%~dp0tools\RUN_BRANCH.bat"
    set "RUN_CODE=!ERRORLEVEL!"
    endlocal & exit /b !RUN_CODE!
)

where node >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Node.js n'est pas installe ou absent du PATH.
    echo Ce depot public utilise le workflow standard Node/Yarn.
    echo Cible : Node 22.20+ / Yarn 4.
    pause
    endlocal & exit /b 1
)

for /f "tokens=*" %%V in ('node -p "process.versions.node"') do set "NODE_VERSION=%%V"
echo Node : !NODE_VERSION!

where corepack >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Corepack est introuvable.
    pause
    endlocal & exit /b 1
)

call corepack enable >nul 2>&1
if errorlevel 1 (
    echo ERREUR : impossible d'activer Corepack.
    pause
    endlocal & exit /b 1
)

if exist "%~dp0yarn.lock" (
    echo [1/6] Dependances ^(lockfile immutable^)...
    call yarn install --immutable
) else (
    echo [1/6] Dependances ^(premier install, yarn.lock sera cree localement^)...
    call yarn install
)
if errorlevel 1 goto :fail

echo [2/6] Format...
call yarn check-format
if errorlevel 1 goto :fail

echo [3/6] ESLint...
call yarn lint
if errorlevel 1 goto :fail

echo [4/6] Manifest...
call yarn check
if errorlevel 1 goto :fail

echo [5/6] Tests...
call yarn test
if errorlevel 1 goto :fail

echo [6/6] Companion package...
call yarn companion-module-build
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
