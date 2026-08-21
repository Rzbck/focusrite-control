@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    endlocal & exit /b 1
)

title Focusrite Control - DEBUG passive official client session

set "LOG_DIR=%CD%\.local-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "LOG_FILE=%LOG_DIR%\PASSIVE_SESSION_RUN_latest.txt"
>"%LOG_FILE%" echo Focusrite Control DEBUG passive official-client session
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
    echo [INFO] Preparation du Node 22 portable officiel...
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0ENSURE_NODE22.ps1"
    if errorlevel 1 goto :fail
    if exist "%PORTABLE_NODE%" set "NODE_EXE=%PORTABLE_NODE%"
    set "NODE_SOURCE=portable-bootstrap"
)
if not defined NODE_EXE goto :fail

set "NODE_VERSION_FILE=%TEMP%\FOCUSRITE_NODE_VERSION_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" -p "process.versions.node" >"!NODE_VERSION_FILE!" 2>>"%LOG_FILE%"
if errorlevel 1 goto :fail
set "NODE_VERSION="
set /p "NODE_VERSION=" <"!NODE_VERSION_FILE!"
del /Q "!NODE_VERSION_FILE!" >nul 2>&1
if not defined NODE_VERSION goto :fail

echo ==============================================================
echo  FOCUSRITE CONTROL - PASSIVE OFFICIAL CLIENT SESSION
echo ==============================================================
echo Node : !NODE_VERSION! ^(!NODE_SOURCE!^)
echo Branche : debug/official-client-passive-session
echo Log prive : .local-logs\PASSIVE_SESSION_RUN_latest.txt
echo.
echo Cette branche N'ENVOIE AUCUN message au protocole Focusrite.
echo La capture brute reste locale et est supprimee apres parsing.
echo La session Companion est exclue localement de l'analyse officielle.
echo Seul un resume sanitise est publie sur GitHub.
echo.

echo [1/4] Syntaxe...
"%NODE_EXE%" --check tools\passive-session-observer-lib.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\passive-session-official-filter.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\parse-passive-session.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\publish-sanitized-passive-session.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
powershell.exe -NoLogo -NoProfile -Command "[void][scriptblock]::Create((Get-Content -LiteralPath 'tools\CAPTURE_OFFICIAL_SESSION.ps1' -Raw))" >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [2/4] Tests parser / isolation Companion / privacy / publisher...
"%NODE_EXE%" --test test\passive-session-observer.test.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [3/4] Capture passive officielle...
echo Une demande UAC Windows peut apparaitre pour pktmon.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CAPTURE_OFFICIAL_SESSION.ps1" -NodeExe "%NODE_EXE%" -CaptureSeconds 25
set "CAPTURE_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Capture exit code: !CAPTURE_RC!
if not "!CAPTURE_RC!"=="0" goto :fail

echo [4/4] Publication du resume sanitise + verification distante...
set "PUBLISH_OUTPUT=%TEMP%\FOCUSRITE_SESSION_PUBLISH_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" tools\publish-sanitized-passive-session.js >"!PUBLISH_OUTPUT!" 2>&1
set "PUBLISH_RC=!ERRORLEVEL!"
type "!PUBLISH_OUTPUT!"
type "!PUBLISH_OUTPUT!" >>"%LOG_FILE%"
del /Q "!PUBLISH_OUTPUT!" >nul 2>&1
if not "!PUBLISH_RC!"=="0" goto :publishfail

echo.
echo ==============================================================
echo CAPTURE PASSIVE + PUBLICATION VERIFIEE TERMINEES
echo Fichier public : diagnostics/runtime/latest-official-session-observer.md
echo ==============================================================
>>"%LOG_FILE%" echo SUCCESS: passive session observer and remote verification completed.
endlocal & exit /b 0

:publishfail
echo.
echo CAPTURE OK, MAIS PUBLICATION GITHUB EN ECHEC.
echo Le rapport sanitise reste local dans probe-results.
echo Les captures ETL/PCAPNG brutes ont deja ete supprimees.
>>"%LOG_FILE%" echo PUBLISH FAILED after successful passive capture.
endlocal & exit /b 2

:fail
echo.
echo PASSIVE SESSION RUN FAILED.
echo Aucun fallback d'ecriture Focusrite n'est execute.
echo Aucun fichier brut n'est publie.
echo Log : "%LOG_FILE%"
>>"%LOG_FILE%" echo FAILED: passive-session runner aborted safely.
endlocal & exit /b 1
