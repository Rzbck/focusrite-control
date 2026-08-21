@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    goto :fail
)
title Focusrite Control - RC full validation

rem A debug/RC branch may provide its own task without changing the updater.
if exist "%~dp0tools\RUN_BRANCH.bat" (
    call "%~dp0tools\RUN_BRANCH.bat"
    set "RUN_CODE=!ERRORLEVEL!"
    goto :finish
)

set "NODE_SOURCE="
set "PORTABLE_NODE_DIR=%~dp0.build-tools\node22"
if exist "%PORTABLE_NODE_DIR%\node.exe" (
    "%PORTABLE_NODE_DIR%\node.exe" -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 (
        set "PATH=%PORTABLE_NODE_DIR%;!PATH!"
        set "NODE_SOURCE=portable-existing"
    )
)

if not defined NODE_SOURCE (
    where node >nul 2>&1
    if errorlevel 1 (
        echo ERREUR : Node 22.20+ introuvable.
        echo Le RC peut reutiliser .build-tools\node22 prepare par les branches debug.
        goto :fail
    )
    node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>&1
    if errorlevel 1 (
        echo ERREUR : Node du PATH incompatible. Il faut Node 22.20+.
        goto :fail
    )
    set "NODE_SOURCE=PATH"
)

set "NODE_VERSION_FILE=%TEMP%\FOCUSRITE_RC_NODE_%RANDOM%_%RANDOM%.txt"
node -p "process.versions.node" >"!NODE_VERSION_FILE!" 2>nul
if errorlevel 1 goto :fail
set "NODE_VERSION="
set /p "NODE_VERSION=" <"!NODE_VERSION_FILE!"
del /Q "!NODE_VERSION_FILE!" >nul 2>&1
if not defined NODE_VERSION goto :fail

echo ==============================================================
echo  FOCUSRITE CONTROL - RC FULL VALIDATION
echo ==============================================================
echo Node : !NODE_VERSION! ^(!NODE_SOURCE!^)
echo Branche : rc/v0.1.13-state-contract
echo Aucun test hardware/write n'est lance par ce runner.
echo.

where corepack >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Corepack est introuvable dans le Node selectionne.
    goto :fail
)

call corepack enable >nul 2>&1
if errorlevel 1 (
    echo ERREUR : impossible d'activer Corepack.
    goto :fail
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

set "RUN_CODE=0"
echo.
echo ==============================================================
echo RC VALIDATION OK - format/lint/manifest/tests/build passes
echo Aucun hardware write n'a ete effectue.
echo ==============================================================
goto :finish

:fail
set "RUN_CODE=1"
echo.
echo ==============================================================
echo RC VALIDATION FAILED - aucune promotion automatique effectuee
echo Aucun hardware write n'a ete effectue.
echo ==============================================================

:finish
echo.
echo Appuyez sur une touche pour fermer.
pause >nul
endlocal & exit /b %RUN_CODE%
