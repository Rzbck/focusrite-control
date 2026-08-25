@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 MANUAL FEEDBACK SWEEP - READ ONLY
echo ==================================================================
echo Aucun write Focusrite. Aucun bouton Companion presse par le harness.
echo Tu modifies toi-meme UN controle a la fois sur la Scarlett ou Focusrite Control.
echo Les 46 meters sont observes en continu et separes des changements de controle.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo MANUAL FEEDBACK SWEEP FAILED - Node.js introuvable.
    echo Lance d abord UPDATE_AND_RUN.bat pour preparer le Node portable.
    exit /b 2
)

"%NODE_EXE%" "testbench\ManualFeedbackSweep.js"
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
    echo MANUAL FEEDBACK SWEEP TERMINE.
) else (
    echo MANUAL FEEDBACK SWEEP TERMINE AVEC CODE %EXITCODE%.
)
echo Rapport local: testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json
exit /b %EXITCODE%
