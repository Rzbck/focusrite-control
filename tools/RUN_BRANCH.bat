@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)

title Focusrite Control - DEBUG cold-start readback

set "LOG_DIR=%CD%\.local-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "LOG_FILE=%LOG_DIR%\DEBUG_READBACK_latest.txt"
>"%LOG_FILE%" echo Focusrite Control DEBUG cold-start readback
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
        echo Aucun probe n'a ete lance et aucun write hardware n'a eu lieu.
        echo Log : "%LOG_FILE%"
        pause
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
    >>"%LOG_FILE%" echo ERROR: compatible Node remains unavailable after bootstrap.
    echo ERREUR : Node 22.20+ reste introuvable apres bootstrap.
    echo Aucun probe n'a ete lance et aucun write hardware n'a eu lieu.
    echo Log : "%LOG_FILE%"
    pause
    endlocal & exit /b 1
)

rem Avoid FOR /F command substitution: cmd.exe may misparse quoted executable
rem paths inside IN ('...'). Capture stdout to a temporary file instead.
set "NODE_VERSION_FILE=%TEMP%\FOCUSRITE_NODE_VERSION_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" -p "process.versions.node" >"!NODE_VERSION_FILE!" 2>>"%LOG_FILE%"
set "NODE_VERSION_RC=!ERRORLEVEL!"
if not "!NODE_VERSION_RC!"=="0" (
    >>"%LOG_FILE%" echo ERROR: Node version command failed with !NODE_VERSION_RC!.
    del /Q "!NODE_VERSION_FILE!" >nul 2>&1
    echo ERREUR : impossible d'interroger la version Node.
    echo Log : "%LOG_FILE%"
    pause
    endlocal & exit /b 1
)

set "NODE_VERSION="
set /p "NODE_VERSION=" <"!NODE_VERSION_FILE!"
del /Q "!NODE_VERSION_FILE!" >nul 2>&1
if not defined NODE_VERSION (
    >>"%LOG_FILE%" echo ERROR: Node version output was empty.
    echo ERREUR : version Node vide.
    echo Log : "%LOG_FILE%"
    pause
    endlocal & exit /b 1
)

>>"%LOG_FILE%" echo Node source: !NODE_SOURCE!
>>"%LOG_FILE%" echo Node version: !NODE_VERSION!

echo ==============================================================
echo  FOCUSRITE CONTROL - DEBUG COLD-START READBACK
echo ==============================================================
echo Node : !NODE_VERSION! ^(!NODE_SOURCE!^)
echo Branche : debug/cold-start-readback
echo Log local prive : .local-logs\DEBUG_READBACK_latest.txt
echo Resultat public sanitise : diagnostics/readback-results
echo.
echo Le probe est READ-ONLY et n'autorise aucun message TCP ^<set^>.
echo Apres succes, seul le rapport sanitise est pousse automatiquement sur GitHub.
echo Les logs locaux bruts ne sont jamais pousses.
echo.

echo [1/4] Syntaxe...
>>"%LOG_FILE%" echo STEP 1: syntax checks
"%NODE_EXE%" --check tools\readback-probe-lib.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\readonly-state-probe.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\publish-diagnostic-lib.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\publish-sanitized-readback.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [2/4] Tests securite/protocole + publication sanitisee...
>>"%LOG_FILE%" echo STEP 2: readback and publisher tests
"%NODE_EXE%" --test test\readback-probe.test.js test\publish-diagnostic.test.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [3/4] Probe read-only reel...
>>"%LOG_FILE%" echo STEP 3: real read-only probe
"%NODE_EXE%" tools\readonly-state-probe.js
set "PROBE_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Probe exit code: !PROBE_RC!
if not "!PROBE_RC!"=="0" goto :fail

echo [4/4] Publication GitHub du resultat sanitise uniquement...
>>"%LOG_FILE%" echo STEP 4: sanitized GitHub publication
"%NODE_EXE%" tools\publish-sanitized-readback.js
set "PUBLISH_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Publish exit code: !PUBLISH_RC!
if not "!PUBLISH_RC!"=="0" goto :publishfail

echo.
echo ==============================================================
echo PROBE + PUBLICATION TERMINEES
echo GitHub : diagnostics/readback-results
echo Fichier : diagnostics/runtime/latest-readback.md
echo ==============================================================
>>"%LOG_FILE%" echo SUCCESS: debug readback runner and sanitized publication completed.
echo.
pause
endlocal & exit /b 0

:publishfail
>>"%LOG_FILE%" echo PUBLISH FAILED: probe itself completed successfully.
echo.
echo PROBE OK, MAIS PUBLICATION GITHUB EN ECHEC.
echo Le resultat local reste dans probe-results.
echo Aucun log brut/prive n'a ete pousse.
echo Log local : "%LOG_FILE%"
echo.
pause
endlocal & exit /b 2

:fail
>>"%LOG_FILE%" echo FAILED: debug runner aborted safely.
echo.
echo DEBUG RUN FAILED.
echo Aucun fallback d'ecriture hardware n'est execute.
echo Aucun log brut/prive n'est pousse sur GitHub.
echo Log : "%LOG_FILE%"
echo.
pause
endlocal & exit /b 1
