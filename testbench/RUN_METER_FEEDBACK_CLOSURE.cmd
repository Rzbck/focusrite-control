@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 METER FEEDBACK CLOSURE - READ ONLY
echo ==================================================================
echo Aucun write Focusrite. Aucun bouton Companion. Aucun routing change.
echo Companion doit rester sur la connexion existante et le module 0.1.16 audite.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo METER CLOSURE FAILED - Node.js introuvable.
    echo Lance d abord UPDATE_AND_RUN.bat sur cette branche pour preparer le Node portable.
    exit /b 2
)

"%NODE_EXE%" "testbench\MeterFeedbackClosure.js"
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
    echo METER FEEDBACK CLOSURE TERMINE SANS MISMATCH.
) else (
    echo METER FEEDBACK CLOSURE TERMINE AVEC CODE %EXITCODE%.
)
echo Aucun write hardware n a ete effectue par ce lanceur.
exit /b %EXITCODE%
