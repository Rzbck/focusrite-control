@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 MIX BASELINE - READ-ONLY OBSERVATION
echo ==================================================================
echo Aucun bouton Companion presse. Aucun write Focusrite. Aucun routing modifie.
echo Companion reste sur le package 0.1.16 exact deja audite/valide.
echo.
echo Pendant la phase NAVIGATE_MIXES, clique uniquement les onglets Mix A a Mix F.
echo Ne touche a aucun fader, mute, solo, source, routing ou setting Focusrite.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo.
    echo READ-ONLY BASELINE PROBE FAILED - Node.js introuvable.
    echo Lance d abord UPDATE_AND_RUN.bat sur cette branche.
    echo.
    pause
    exit /b 2
)

"%NODE_EXE%" "testbench\MeterMixPlaybackBaselineReadOnlyProbe.js"
set "EXITCODE=!ERRORLEVEL!"

echo.
if "!EXITCODE!"=="0" (
    echo READ-ONLY BASELINE PROBE TERMINE.
) else (
    echo READ-ONLY BASELINE PROBE TERMINE AVEC CODE !EXITCODE!.
)
echo Aucun package module n a ete installe ou active par ce lanceur.
echo.
pause
exit /b !EXITCODE!
