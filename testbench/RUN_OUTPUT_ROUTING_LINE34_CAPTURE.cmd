@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 LINE 3-4 ROUTING CAPTURE - MANUAL / READ ONLY
echo ==================================================================
echo Le harness ne fait AUCUN write Focusrite et ne presse AUCUN bouton Companion.
echo Tu feras uniquement les changements demandes dans Focusrite Control.
echo Source, stereo et assign-mix sont captures avant/apres chaque geste.
echo Chaque restauration est verifiee avant de continuer.
echo Si assign-mix reste UNKNOWN apres la phase Source, Custom Mix est bloque.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo LINE 3-4 ROUTING CAPTURE FAILED - Node.js introuvable.
    echo Lance d abord UPDATE_AND_RUN.bat pour preparer le Node portable.
    exit /b 2
)

"%NODE_EXE%" "testbench\OutputRoutingLine34Capture.js"
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
    echo LINE 3-4 ROUTING CAPTURE TERMINE AVEC RESTAURATION CONFIRMEE.
) else if "%EXITCODE%"=="3" (
    echo LINE 3-4 ROUTING CAPTURE STOP SAFE - assign-mix baseline encore inconnue.
) else (
    echo LINE 3-4 ROUTING CAPTURE TERMINE AVEC CODE %EXITCODE%.
)
echo Rapport local: testbench\results\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json
exit /b %EXITCODE%
