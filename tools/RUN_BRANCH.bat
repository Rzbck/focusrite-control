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
echo Un statut sanitise stage/code est publie meme si le harness echoue.
echo.

echo [1/5] Syntaxe...
for %%F in (
    tools\passive-session-observer-lib.js
    tools\passive-session-official-filter.js
    tools\passive-session-status-lib.js
    tools\parse-passive-session.js
    tools\publish-sanitized-passive-session.js
    tools\publish-sanitized-passive-status.js
) do (
    "%NODE_EXE%" --check "%%F" >>"%LOG_FILE%" 2>&1
    if errorlevel 1 goto :fail
)
powershell.exe -NoLogo -NoProfile -Command "[void][scriptblock]::Create((Get-Content -LiteralPath 'tools\CAPTURE_OFFICIAL_SESSION.ps1' -Raw))" >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [2/5] Tests parser / isolation Companion / privacy / publisher...
"%NODE_EXE%" --test test\passive-session-observer.test.js test\passive-session-official-filter.test.js test\passive-session-status.test.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [3/5] Capture passive officielle...
echo Une demande UAC Windows peut apparaitre pour pktmon.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0CAPTURE_OFFICIAL_SESSION.ps1" -NodeExe "%NODE_EXE%" -CaptureSeconds 25
set "CAPTURE_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Capture exit code: !CAPTURE_RC!

echo [4/5] Publication du statut sanitise du harness...
set "STATUS_OUTPUT=%TEMP%\FOCUSRITE_SESSION_STATUS_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" tools\publish-sanitized-passive-status.js >"!STATUS_OUTPUT!" 2>&1
set "STATUS_RC=!ERRORLEVEL!"
type "!STATUS_OUTPUT!"
type "!STATUS_OUTPUT!" >>"%LOG_FILE%"
del /Q "!STATUS_OUTPUT!" >nul 2>&1
>>"%LOG_FILE%" echo Status publish exit code: !STATUS_RC!
if not "!STATUS_RC!"=="0" goto :statusfail
if not "!CAPTURE_RC!"=="0" goto :capturefail

echo [5/5] Publication du resume sanitise + verification distante...
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
echo Resultat : diagnostics/runtime/latest-official-session-observer.md
echo Statut   : diagnostics/runtime/latest-official-session-observer-status.md
echo ==============================================================
>>"%LOG_FILE%" echo SUCCESS: passive session observer and remote verification completed.
endlocal & exit /b 0

:capturefail
echo.
echo CAPTURE PASSIVE EN ECHEC - code !CAPTURE_RC!.
echo Le stage/code sanitise est deja publie sur GitHub.
echo Aucun fichier brut n'a ete publie.
>>"%LOG_FILE%" echo CAPTURE FAILED with sanitized status remotely published.
endlocal & exit /b !CAPTURE_RC!

:statusfail
echo.
echo ERREUR : impossible de publier le statut sanitise du harness.
echo Aucun log brut n'a ete publie. Log local : "%LOG_FILE%"
>>"%LOG_FILE%" echo STATUS PUBLICATION FAILED.
endlocal & exit /b 3

:publishfail
echo.
echo CAPTURE OK, MAIS PUBLICATION DU RESULTAT GITHUB EN ECHEC.
echo Le rapport sanitise reste local dans probe-results.
echo Les captures ETL/PCAPNG brutes ont deja ete supprimees.
>>"%LOG_FILE%" echo RESULT PUBLICATION FAILED after successful passive capture.
endlocal & exit /b 2

:fail
echo.
echo PASSIVE SESSION RUN FAILED AVANT CAPTURE.
echo Aucun fallback d'ecriture Focusrite n'est execute.
echo Aucun fichier brut n'est publie.
echo Log : "%LOG_FILE%"
>>"%LOG_FILE%" echo FAILED: passive-session runner aborted before capture.
endlocal & exit /b 1
