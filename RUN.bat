@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    endlocal & exit /b 1
)
title Focusrite Control - RC full validation

set "LOG_DIR=%CD%\.local-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "STATUS_FILE=%LOG_DIR%\RC_STATE_CONTRACT_STATUS.txt"
>"%STATUS_FILE%" echo outcome=FAILED
>>"%STATUS_FILE%" echo stage=preflight
>>"%STATUS_FILE%" echo code=unexpected

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
        set "FAIL_STAGE=preflight"
        set "FAIL_CODE=node-unavailable"
        goto :validation_fail
    )
    node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>&1
    if errorlevel 1 (
        echo ERREUR : Node du PATH incompatible. Il faut Node 22.20+.
        set "FAIL_STAGE=preflight"
        set "FAIL_CODE=node-unavailable"
        goto :validation_fail
    )
    set "NODE_SOURCE=PATH"
)

set "NODE_VERSION_FILE=%TEMP%\FOCUSRITE_RC_NODE_%RANDOM%_%RANDOM%.txt"
node -p "process.versions.node" >"!NODE_VERSION_FILE!" 2>nul
if errorlevel 1 (
    set "FAIL_STAGE=preflight"
    set "FAIL_CODE=node-unavailable"
    goto :validation_fail
)
set "NODE_VERSION="
set /p "NODE_VERSION=" <"!NODE_VERSION_FILE!"
del /Q "!NODE_VERSION_FILE!" >nul 2>&1
if not defined NODE_VERSION (
    set "FAIL_STAGE=preflight"
    set "FAIL_CODE=node-unavailable"
    goto :validation_fail
)

echo ==============================================================
echo  FOCUSRITE CONTROL - RC FULL VALIDATION
echo ==============================================================
echo Node : !NODE_VERSION! ^(!NODE_SOURCE!^)
echo Branche : rc/v0.1.13-state-contract
echo Aucun test hardware/write n'est lance par ce runner.
echo Le statut sanitise sera publie automatiquement sur GitHub.
echo.

node --check tools\rc-validation-status-lib.js >nul 2>&1
if errorlevel 1 (
    set "FAIL_STAGE=preflight"
    set "FAIL_CODE=unexpected"
    goto :validation_fail
)
node --check tools\publish-sanitized-rc-validation.js >nul 2>&1
if errorlevel 1 (
    set "FAIL_STAGE=preflight"
    set "FAIL_CODE=unexpected"
    goto :validation_fail
)

where corepack >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Corepack est introuvable dans le Node selectionne.
    set "FAIL_STAGE=preflight"
    set "FAIL_CODE=corepack-unavailable"
    goto :validation_fail
)

call corepack enable >nul 2>&1
if errorlevel 1 (
    echo ERREUR : impossible d'activer Corepack.
    set "FAIL_STAGE=preflight"
    set "FAIL_CODE=corepack-unavailable"
    goto :validation_fail
)

if exist "%~dp0yarn.lock" (
    echo [1/6] Dependances ^(lockfile immutable^)...
    call yarn install --immutable
) else (
    echo [1/6] Dependances ^(premier install, yarn.lock sera cree localement^)...
    call yarn install
)
if errorlevel 1 (
    set "FAIL_STAGE=dependencies"
    set "FAIL_CODE=install-failed"
    goto :validation_fail
)

echo [2/6] Format...
call yarn check-format
if errorlevel 1 (
    set "FAIL_STAGE=format"
    set "FAIL_CODE=format-failed"
    goto :validation_fail
)

echo [3/6] ESLint...
call yarn lint
if errorlevel 1 (
    set "FAIL_STAGE=lint"
    set "FAIL_CODE=lint-failed"
    goto :validation_fail
)

echo [4/6] Manifest...
call yarn check
if errorlevel 1 (
    set "FAIL_STAGE=manifest"
    set "FAIL_CODE=manifest-failed"
    goto :validation_fail
)

echo [5/6] Tests...
call yarn test
if errorlevel 1 (
    set "FAIL_STAGE=tests"
    set "FAIL_CODE=tests-failed"
    goto :validation_fail
)

echo [6/6] Companion package...
call yarn companion-module-build
if errorlevel 1 (
    set "FAIL_STAGE=build"
    set "FAIL_CODE=build-failed"
    goto :validation_fail
)

>"%STATUS_FILE%" echo outcome=SUCCESS
>>"%STATUS_FILE%" echo stage=complete
>>"%STATUS_FILE%" echo code=ok
set "RUN_CODE=0"
echo.
echo ==============================================================
echo RC VALIDATION OK - format/lint/manifest/tests/build passes
echo Aucun hardware write n'a ete effectue.
echo ==============================================================
goto :publish_status

:validation_fail
if not defined FAIL_STAGE set "FAIL_STAGE=preflight"
if not defined FAIL_CODE set "FAIL_CODE=unexpected"
>"%STATUS_FILE%" echo outcome=FAILED
>>"%STATUS_FILE%" echo stage=!FAIL_STAGE!
>>"%STATUS_FILE%" echo code=!FAIL_CODE!
set "RUN_CODE=1"
echo.
echo ==============================================================
echo RC VALIDATION FAILED - stage=!FAIL_STAGE! code=!FAIL_CODE!
echo Aucune promotion automatique et aucun hardware write.
echo ==============================================================

:publish_status
echo.
echo Publication du statut sanitise + verification distante...
set "PUBLISH_OUTPUT=%TEMP%\FOCUSRITE_RC_STATUS_%RANDOM%_%RANDOM%.txt"
node tools\publish-sanitized-rc-validation.js >"!PUBLISH_OUTPUT!" 2>&1
set "PUBLISH_RC=!ERRORLEVEL!"
type "!PUBLISH_OUTPUT!"
del /Q "!PUBLISH_OUTPUT!" >nul 2>&1
if not "!PUBLISH_RC!"=="0" (
    echo.
    echo ERREUR : validation terminee mais statut GitHub non publie.
    echo Aucun log brut n'a ete envoye.
    if "!RUN_CODE!"=="0" set "RUN_CODE=2"
)

echo.
echo ==============================================================
if "!RUN_CODE!"=="0" (
    echo RC TERMINE - validation et publication verifiees
    echo Resultat public : diagnostics/runtime/latest-rc-state-contract-validation.md
) else (
    echo RC TERMINE AVEC CODE !RUN_CODE!
    echo Consultez le statut sanitise GitHub si la publication a reussi.
)
echo Appuyez sur une touche pour fermer.
echo ==============================================================
pause >nul
endlocal & exit /b %RUN_CODE%
