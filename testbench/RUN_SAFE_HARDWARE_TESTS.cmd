@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Focusrite 18i20 TestBench v0.2 - SAFE Hardware Test

echo ==================================================================
echo  FOCUSRITE 18i20 TESTBENCH v0.2 - SAFE HARDWARE TEST
echo ==================================================================
echo.
echo Cette version reutilise la page r9 FULL MATRIX deja presente dans Companion.
echo Aucune nouvelle page Companion n'est necessaire.
echo.
echo ATTENTION:
echo - Ce test modifie temporairement Air, Pad, Mode Input 1/2, Mute, Dim et Talkback.
echo - Les valeurs initiales inconnues sont ignorees sans write.
echo - Chaque test execute restaure explicitement sa valeur initiale.
echo - Un echec de restauration arrete immediatement toute la suite.
echo - Ne pas lancer pendant un live ou un enregistrement critique.
echo.
echo AVANT DE CONTINUER:
echo - baisse le bouton PHYSIQUE Monitor;
echo - coupe/mute les enceintes actives si possible;
echo - baisse le volume casque ou retire le casque.
echo.
echo Le runner verifiera d'abord en lecture seule les 42 boutons SAFE de la page r9
echo et le mapping vers la connexion Focusrite active. En cas de doute: ABORT avant write.
echo.
set "CONFIRM="
set /p "CONFIRM=Tape SAFE puis Entree pour autoriser ce run hardware : "
if /I not "%CONFIRM%"=="SAFE" (
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
"%NODE_EXE%" "%~dp0Focusrite_18i20_SafeHardwareTest.js" --allow-hardware-writes
set "EXITCODE=%ERRORLEVEL%"

echo.
echo Exit code: %EXITCODE%
if "%EXITCODE%"=="0" (
    echo SAFE HARDWARE TEST TERMINE SANS FAIL.
) else if "%EXITCODE%"=="3" (
    echo AUCUN TEST HARDWARE EXECUTE : etats initiaux inconnus.
) else if "%EXITCODE%"=="4" (
    echo HARD ABORT : restauration non confirmee ou precondition de securite perdue.
) else (
    echo SAFE HARDWARE TEST TERMINE AVEC FAIL.
)
echo.
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b %EXITCODE%
