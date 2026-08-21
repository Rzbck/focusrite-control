@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Focusrite 18i20 TestBench v0.2 - SAFE / FULL

echo ==================================================================
echo  FOCUSRITE 18i20 TESTBENCH v0.2 - SAFE / FULL
echo ==================================================================
echo.
echo La page r9 FULL MATRIX existante reste la base du banc de test.
echo.
echo   SAFE = Core 21 controles, restauration stricte de l'etat connu.
echo   FULL = vrai banc general : 829 feedbacks + Core + entrees + sorties
echo          + mixer slots + 12 lanes x 24 strips + monitoring/settings.
echo.
echo FULL peut etablir des BASELINES documentees quand un etat initial
echo est inconnu. Les fonctions vraiment disruptives restent EXCLUES du FULL:
echo device preset, clock source, sample rate et S/PDIF mode.
echo.
echo TOUJOURS INTERDIT:
echo - Monitor gain item 1677;
echo - Advanced Raw comme raccourci de test;
echo - firmware/reset/restore/snapshot;
echo - faux gain preamp / input mute / phantom par canal / Mic Kill.
echo.
echo AVANT DE CONTINUER:
echo - baisse le bouton PHYSIQUE Monitor;
echo - coupe/mute les enceintes actives si possible;
echo - baisse le volume casque ou retire le casque;
echo - ne lance pas pendant un live ou un enregistrement critique.
echo.
set "MODE="
set /p "MODE=Tape SAFE ou FULL puis Entree : "
if /I not "%MODE%"=="SAFE" if /I not "%MODE%"=="FULL" (
    echo.
    echo ANNULE - aucun test hardware lance.
    pause
    exit /b 1
)

set "NODE_EXE="
if exist "%~dp0..\.build-tools\node22\node.exe" set "NODE_EXE=%~dp0..\.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)
if not defined NODE_EXE (
    echo ERREUR : Node.js est introuvable.
    echo Lance d'abord UPDATE_AND_RUN.bat a la racine du depot.
    pause
    exit /b 1
)

echo.
if /I "%MODE%"=="SAFE" (
    "%NODE_EXE%" "%~dp0Focusrite_18i20_SafeHardwareTest.js" --allow-hardware-writes
) else (
    "%NODE_EXE%" "%~dp0Focusrite_18i20_FullTestBench.js" --allow-hardware-writes
)
set "EXITCODE=%ERRORLEVEL%"

echo.
echo Exit code: %EXITCODE%
if "%EXITCODE%"=="0" (
    echo TESTBENCH %MODE% TERMINE SANS FAIL.
) else if "%EXITCODE%"=="6" (
    echo PREPARATION REQUISE - AUCUN WRITE HARDWARE SUR CETTE PASSE.
    echo Lis l'instruction PREP REQUIRED affichee ci-dessus puis relance CE MEME CMD.
) else if "%EXITCODE%"=="4" (
    echo HARD ABORT : restauration non confirmee. Ne relance pas avant diagnostic.
) else (
    echo TESTBENCH %MODE% TERMINE AVEC FAIL.
)
echo.
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b %EXITCODE%
