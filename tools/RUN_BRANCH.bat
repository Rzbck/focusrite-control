@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    endlocal & exit /b 1
)

title Focusrite Control - DEBUG official client read source

set "LOG_DIR=%CD%\.local-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "LOG_FILE=%LOG_DIR%\STATIC_PROTOCOL_SCAN_latest.txt"
>"%LOG_FILE%" echo Focusrite Control DEBUG official-client static protocol scan
>>"%LOG_FILE%" echo Started: %DATE% %TIME%
>>"%LOG_FILE%" echo Branch runner entered repository successfully.

set "PORTABLE_NODE=%~dp0..\.build-tools\node22\node.exe"
set "NODE_EXE="
set "NODE_SOURCE="

where node >nul 2>&1
if not errorlevel 1 (
    node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>>"%LOG_FILE%"
    if not errorlevel 1 (
        set "NODE_EXE=node"
        set "NODE_SOURCE=PATH"
    ) else (
        >>"%LOG_FILE%" echo PATH Node exists but is incompatible with required Node 22.20+.
    )
)

if not defined NODE_EXE if exist "%PORTABLE_NODE%" (
    "%PORTABLE_NODE%" -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>>"%LOG_FILE%"
    if not errorlevel 1 (
        set "NODE_EXE=%PORTABLE_NODE%"
        set "NODE_SOURCE=portable-existing"
    )
)

if not defined NODE_EXE (
    echo [INFO] Node 22.20+ compatible absent. Preparation du Node portable officiel...
    >>"%LOG_FILE%" echo Starting portable Node bootstrap.
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0ENSURE_NODE22.ps1"
    set "NODE_BOOT_RC=!ERRORLEVEL!"
    >>"%LOG_FILE%" echo Node bootstrap exit code: !NODE_BOOT_RC!
    if not "!NODE_BOOT_RC!"=="0" (
        echo ERREUR : impossible de preparer Node 22 portable.
        echo Aucun scan n'a ete lance et aucun write Focusrite n'a eu lieu.
        echo Log : "%LOG_FILE%"
        endlocal & exit /b 1
    )
    if exist "%PORTABLE_NODE%" (
        "%PORTABLE_NODE%" -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>>"%LOG_FILE%"
        if not errorlevel 1 (
            set "NODE_EXE=%PORTABLE_NODE%"
            set "NODE_SOURCE=portable-bootstrap"
        )
    )
)

if not defined NODE_EXE (
    echo ERREUR : Node 22.20+ reste introuvable apres bootstrap.
    echo Log : "%LOG_FILE%"
    endlocal & exit /b 1
)

set "NODE_VERSION_FILE=%TEMP%\FOCUSRITE_NODE_VERSION_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" -p "process.versions.node" >"!NODE_VERSION_FILE!" 2>>"%LOG_FILE%"
if errorlevel 1 (
    del /Q "!NODE_VERSION_FILE!" >nul 2>&1
    echo ERREUR : impossible d'interroger la version Node.
    echo Log : "%LOG_FILE%"
    endlocal & exit /b 1
)
set "NODE_VERSION="
set /p "NODE_VERSION=" <"!NODE_VERSION_FILE!"
del /Q "!NODE_VERSION_FILE!" >nul 2>&1
if not defined NODE_VERSION (
    echo ERREUR : version Node vide.
    echo Log : "%LOG_FILE%"
    endlocal & exit /b 1
)
>>"%LOG_FILE%" echo Node source: !NODE_SOURCE!
>>"%LOG_FILE%" echo Node version: !NODE_VERSION!

echo ==============================================================
echo  FOCUSRITE CONTROL - OFFICIAL CLIENT STATIC READ SOURCE
echo ==============================================================
echo Node : !NODE_VERSION! ^(!NODE_SOURCE!^)
echo Branche : debug/official-client-read-source
echo Log local prive : .local-logs\STATIC_PROTOCOL_SCAN_latest.txt
echo Resultat public sanitise : diagnostics/readback-results
echo.
echo READ-ONLY : aucun message protocole Focusrite n'est transmis.
echo Le scan lit uniquement les binaires Focusrite deja installes/en cours d'execution.
echo Les chemins locaux et strings binaires brutes ne sont jamais publies.
echo.

echo [1/4] Syntaxe...
>>"%LOG_FILE%" echo STEP 1: syntax checks
"%NODE_EXE%" --check tools\static-protocol-scan-lib.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\scan-official-focusrite-static.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\publish-sanitized-static-scan.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [2/4] Tests securite + Git publisher...
>>"%LOG_FILE%" echo STEP 2: static scan tests
"%NODE_EXE%" --test test\static-protocol-scan.test.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [3/4] Scan statique READ-ONLY du client Focusrite officiel...
>>"%LOG_FILE%" echo STEP 3: real static binary scan
"%NODE_EXE%" tools\scan-official-focusrite-static.js
set "SCAN_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Static scan exit code: !SCAN_RC!
if not "!SCAN_RC!"=="0" goto :fail

echo [4/4] Publication GitHub du resultat sanitise uniquement...
>>"%LOG_FILE%" echo STEP 4: sanitized GitHub publication
set "PUBLISH_OUTPUT=%TEMP%\FOCUSRITE_STATIC_PUBLISH_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" tools\publish-sanitized-static-scan.js >"!PUBLISH_OUTPUT!" 2>&1
set "PUBLISH_RC=!ERRORLEVEL!"
type "!PUBLISH_OUTPUT!"
type "!PUBLISH_OUTPUT!" >>"%LOG_FILE%"
del /Q "!PUBLISH_OUTPUT!" >nul 2>&1
>>"%LOG_FILE%" echo Publish exit code: !PUBLISH_RC!
if not "!PUBLISH_RC!"=="0" goto :publishfail

echo.
echo ==============================================================
echo SCAN + PUBLICATION VERIFIEE TERMINEES
echo GitHub : diagnostics/readback-results
echo Fichier : diagnostics/runtime/latest-static-protocol-scan.md
echo ==============================================================
>>"%LOG_FILE%" echo SUCCESS: static scan and remote verification completed.
endlocal & exit /b 0

:publishfail
>>"%LOG_FILE%" echo PUBLISH FAILED: static scan itself completed successfully.
echo.
echo SCAN OK, MAIS PUBLICATION GITHUB EN ECHEC.
echo Le resultat local sanitise reste dans probe-results.
echo Aucun chemin/string brut n'a ete pousse.
echo Log local : "%LOG_FILE%"
endlocal & exit /b 2

:fail
>>"%LOG_FILE%" echo FAILED: static scan runner aborted safely.
echo.
echo STATIC SCAN RUN FAILED.
echo Aucun message protocole Focusrite n'est envoye en fallback.
echo Aucun log brut/prive n'est pousse sur GitHub.
echo Log : "%LOG_FILE%"
endlocal & exit /b 1
