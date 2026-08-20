@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title Focusrite Control - DEBUG cold-start readback

set "NODE_EXE="
where node >nul 2>&1
if not errorlevel 1 set "NODE_EXE=node"
if not defined NODE_EXE if exist "%~dp0..\.build-tools\node22\node.exe" set "NODE_EXE=%~dp0..\.build-tools\node22\node.exe"

if not defined NODE_EXE (
    echo [INFO] Node 22 absent du PATH. Preparation du Node portable officiel...
    powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0ENSURE_NODE22.ps1"
    if errorlevel 1 (
        echo ERREUR : impossible de preparer Node 22 portable.
        echo Aucun probe n'a ete lance et aucun write hardware n'a eu lieu.
        pause
        endlocal & exit /b 1
    )
    if exist "%~dp0..\.build-tools\node22\node.exe" set "NODE_EXE=%~dp0..\.build-tools\node22\node.exe"
)

if not defined NODE_EXE (
    echo ERREUR : Node 22 reste introuvable apres bootstrap.
    echo Aucun probe n'a ete lance et aucun write hardware n'a eu lieu.
    pause
    endlocal & exit /b 1
)

for /f "tokens=*" %%V in ('"%NODE_EXE%" -p "process.versions.node"') do set "NODE_VERSION=%%V"
"%NODE_EXE%" -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)"
if errorlevel 1 (
    echo ERREUR : Node %NODE_VERSION% incompatible. Il faut Node 22.20+.
    pause
    endlocal & exit /b 1
)

echo ==============================================================
echo  FOCUSRITE CONTROL - DEBUG COLD-START READBACK
echo ==============================================================
echo Node : %NODE_VERSION%
echo Branche : debug/cold-start-readback
echo.
echo Ce runner lance d'abord les tests du probe READ-ONLY.
echo Le probe n'autorise aucun message TCP ^<set^>.
echo.

echo [1/3] Syntaxe...
"%NODE_EXE%" --check tools\readback-probe-lib.js
if errorlevel 1 goto :fail
"%NODE_EXE%" --check tools\readonly-state-probe.js
if errorlevel 1 goto :fail

echo [2/3] Tests securite/protocole du probe...
"%NODE_EXE%" --test test\readback-probe.test.js
if errorlevel 1 goto :fail

echo [3/3] Probe read-only reel...
"%NODE_EXE%" tools\readonly-state-probe.js
if errorlevel 1 goto :fail

echo.
echo PROBE TERMINE. Le resultat sanitise est dans probe-results.
echo.
pause
endlocal & exit /b 0

:fail
echo.
echo DEBUG RUN FAILED.
echo Aucun fallback d'ecriture hardware n'est execute.
echo.
pause
endlocal & exit /b 1
