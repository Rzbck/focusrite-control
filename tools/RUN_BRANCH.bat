@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title Focusrite Control - DEBUG cold-start readback

set "NODE_EXE="
where node >nul 2>&1
if not errorlevel 1 set "NODE_EXE=node"
if not defined NODE_EXE if exist "%~dp0..\.build-tools\node22\node.exe" set "NODE_EXE=%~dp0..\.build-tools\node22\node.exe"

if not defined NODE_EXE (
    echo ERREUR : Node.js est introuvable.
    echo Cette branche debug demande Node 22.
    echo Aucun probe n'a ete lance et aucun write hardware n'a eu lieu.
    pause
    endlocal & exit /b 1
)

for /f "tokens=*" %%V in ('"%NODE_EXE%" -p "process.versions.node"') do set "NODE_VERSION=%%V"
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
