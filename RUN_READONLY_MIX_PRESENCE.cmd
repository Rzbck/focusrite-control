@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ==================================================================
echo  FOCUSRITE CONTROL - DIRECT READ-ONLY MIX STATE PRESENCE PROBE
echo ==================================================================
echo RESEARCH-ONLY / aucun write hardware.
echo.
echo AVANT DE CONTINUER :
echo  - DESACTIVE temporairement la connexion Focusrite normale dans Companion.
echo  - Ne la supprime PAS et ne la recree PAS.
echo  - Garde Focusrite Control ouvert.
echo  - Si Remote Devices affiche Focusrite ReadOnly Mix Probe, APPROUVE ce client de recherche dedie.
echo  - Ne lance aucun SAFE/FULL/TestBench write-capable en parallele.
echo.
echo Le probe autorise uniquement client-details, device-subscribe et keep-alive.
echo Aucun XML brut, valeur de baseline, item ID, serial, endpoint ou client key n est affiche.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo PROBE BLOQUE - Node.js introuvable.
    echo Lance UPDATE_AND_RUN.bat sur la branche debug/cold-start-readback d abord.
    pause
    exit /b 2
)

set "CONFIRM="
set /p "CONFIRM=Tape READ_ONLY_DIRECT pour confirmer que la connexion Companion Focusrite normale est DESACTIVEE : "
if /I not "%CONFIRM%"=="READ_ONLY_DIRECT" (
    echo PROBE ANNULE - aucune session directe lancee.
    pause
    exit /b 2
)

"%NODE_EXE%" "tools\readonly-mix-presence-probe.js"
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
    echo READ-ONLY MIX PRESENCE PROBE TERMINE.
) else (
    echo READ-ONLY MIX PRESENCE PROBE TERMINE AVEC CODE %EXITCODE%.
)
echo.
echo APRES LE PROBE : reactive la MEME connexion Focusrite existante dans Companion.
echo Ne supprime/recree pas la connexion.
echo.
pause
exit /b %EXITCODE%
