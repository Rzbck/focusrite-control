@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    endlocal & exit /b 1
)

title Focusrite Control - DEBUG official client memory observer
set "LOG_DIR=%CD%\.local-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "LOG_FILE=%LOG_DIR%\MEMORY_OBSERVER_RUN_latest.txt"
>"%LOG_FILE%" echo Focusrite Control DEBUG official-client memory observer
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
echo  FOCUSRITE CONTROL - OFFICIAL CLIENT MEMORY OBSERVER
echo ==============================================================
echo Node : !NODE_VERSION! ^(!NODE_SOURCE!^)
echo Branche : debug/official-client-memory-observer
echo Log prive : .local-logs\MEMORY_OBSERVER_RUN_latest.txt
echo.
echo READ-ONLY : OpenProcess + VirtualQueryEx + ReadProcessMemory uniquement.
echo Aucun dump memoire, aucun WriteProcessMemory, aucune injection.
echo Aucun message protocole Focusrite n'est transmis par l'observer.
echo Seuls roots/attributs/Core IDs sanitises peuvent partir sur GitHub.
echo.

echo [1/6] Syntaxe / audit statique...
for %%F in (
    tools\memory-observer-lib.js
    tools\memory-observer-status-lib.js
    tools\build-memory-observer-report.js
    tools\publish-sanitized-memory-observer.js
    tools\publish-sanitized-memory-status.js
) do (
    "%NODE_EXE%" --check "%%F" >>"%LOG_FILE%" 2>&1
    if errorlevel 1 goto :fail
)
powershell.exe -NoLogo -NoProfile -Command "[void][scriptblock]::Create((Get-Content -LiteralPath 'tools\OBSERVE_OFFICIAL_CLIENT_MEMORY.ps1' -Raw))" >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail
findstr /I /R "WriteProcessMemory VirtualAllocEx CreateRemoteThread NtCreateThreadEx QueueUserAPC SetThreadContext TerminateProcess" tools\FocusriteMemoryObserver.cs >nul 2>&1
if not errorlevel 1 (
    echo ERREUR : primitive dangereuse detectee dans le scanner memoire.
    >>"%LOG_FILE%" echo FORBIDDEN primitive detected in C# scanner.
    goto :fail
)

echo [2/6] Tests privacy / read-only / status...
"%NODE_EXE%" --test test\memory-observer.test.js >>"%LOG_FILE%" 2>&1
if errorlevel 1 goto :fail

echo [3/6] Observation memoire READ-ONLY du client officiel...
echo Une demande UAC Windows peut apparaitre.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0OBSERVE_OFFICIAL_CLIENT_MEMORY.ps1" -NodeExe "%NODE_EXE%" -ObserveSeconds 20
set "OBSERVE_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Observer exit code: !OBSERVE_RC!

echo [4/6] Publication du statut sanitise...
set "STATUS_OUTPUT=%TEMP%\FOCUSRITE_MEMORY_STATUS_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" tools\publish-sanitized-memory-status.js >"!STATUS_OUTPUT!" 2>&1
set "STATUS_RC=!ERRORLEVEL!"
type "!STATUS_OUTPUT!"
type "!STATUS_OUTPUT!" >>"%LOG_FILE%"
del /Q "!STATUS_OUTPUT!" >nul 2>&1
if not "!STATUS_RC!"=="0" goto :statusfail
if not "!OBSERVE_RC!"=="0" goto :observefail

echo [5/6] Construction du rapport sanitise...
"%NODE_EXE%" tools\build-memory-observer-report.js >>"%LOG_FILE%" 2>&1
set "REPORT_RC=!ERRORLEVEL!"
if not "!REPORT_RC!"=="0" goto :reportfail

echo [6/6] Publication GitHub + verification distante...
set "PUBLISH_OUTPUT=%TEMP%\FOCUSRITE_MEMORY_PUBLISH_%RANDOM%_%RANDOM%.txt"
"%NODE_EXE%" tools\publish-sanitized-memory-observer.js >"!PUBLISH_OUTPUT!" 2>&1
set "PUBLISH_RC=!ERRORLEVEL!"
type "!PUBLISH_OUTPUT!"
type "!PUBLISH_OUTPUT!" >>"%LOG_FILE%"
del /Q "!PUBLISH_OUTPUT!" >nul 2>&1
if not "!PUBLISH_RC!"=="0" goto :publishfail

echo.
echo ==============================================================
echo MEMORY OBSERVER + PUBLICATION VERIFIEE TERMINEES
echo Resultat : diagnostics/runtime/latest-official-client-memory-observer.md
echo Statut   : diagnostics/runtime/latest-official-client-memory-observer-status.md
echo ==============================================================
>>"%LOG_FILE%" echo SUCCESS: memory observer and remote verification completed.
endlocal & exit /b 0

:observefail
echo.
echo OBSERVATION MEMOIRE EN ECHEC - code !OBSERVE_RC!.
echo Le stage/code sanitise est deja publie sur GitHub.
echo Aucun dump memoire n'a ete cree/publie.
>>"%LOG_FILE%" echo MEMORY OBSERVER FAILED with status remotely published.
endlocal & exit /b !OBSERVE_RC!

:statusfail
echo.
echo ERREUR : publication du statut memory observer impossible.
echo Aucun log/memoire brut n'a ete publie.
>>"%LOG_FILE%" echo MEMORY STATUS PUBLICATION FAILED.
endlocal & exit /b 3

:reportfail
echo.
echo OBSERVATION OK, MAIS SANITIZATION DU RAPPORT EN ECHEC.
echo Aucun fichier brut n'est publie.
>>"%LOG_FILE%" echo MEMORY REPORT BUILD FAILED.
endlocal & exit /b 4

:publishfail
echo.
echo RAPPORT SANITISE OK, MAIS PUBLICATION GITHUB EN ECHEC.
echo Aucun dump memoire n'existe; le rapport sanitise reste local.
>>"%LOG_FILE%" echo MEMORY RESULT PUBLICATION FAILED.
endlocal & exit /b 2

:fail
echo.
echo MEMORY OBSERVER RUN FAILED AVANT OBSERVATION.
echo Aucun write/injection et aucun message Focusrite ne sont executes.
echo Log local : "%LOG_FILE%"
>>"%LOG_FILE%" echo FAILED: memory observer runner aborted before observation.
endlocal & exit /b 1
