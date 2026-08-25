@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 LINE 3-4 ROUTING RECORDER - FREE / READ ONLY
echo ==================================================================
echo Le harness ne fait AUCUN write Focusrite et ne presse AUCUN bouton Companion.
echo Le recorder observe en continu UNIQUEMENT Line Outputs 3-4.
echo Pendant REC ON, tu peux changer librement Source / Stereo / Custom Mix.
echo Laisse chaque etat environ 2 secondes, puis restaure le BASELINE avant STOP.
echo Aucun workflow 1/6, 2/6, etc.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo LINE 3-4 ROUTING RECORDER FAILED - Node.js introuvable.
    echo Lance d abord UPDATE_AND_RUN.bat pour preparer le Node portable.
    exit /b 2
)

"%NODE_EXE%" "testbench\OutputRoutingLine34Capture.js"
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
    echo LINE 3-4 ROUTING RECORDER TERMINE - restauration confirmee.
) else if "%EXITCODE%"=="3" (
    echo LINE 3-4 ROUTING RECORDER TERMINE - aucun changement routing observe.
) else if "%EXITCODE%"=="4" (
    echo LINE 3-4 ROUTING RECORDER TERMINE - restauration NON confirmee. Verifie le rapport avant tout autre test.
) else (
    echo LINE 3-4 ROUTING RECORDER TERMINE AVEC CODE %EXITCODE%.
)
echo Rapport local: testbench\results\LATEST_OUTPUT_ROUTING_LINE34_CAPTURE.json
exit /b %EXITCODE%
