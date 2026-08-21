@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Focusrite 18i20 TestBench v0.2 - Prepare SAFE Pages

echo ==================================================================
echo  FOCUSRITE 18i20 TESTBENCH v0.2 - PREPARE SAFE PAGES
echo ==================================================================
echo.
echo Cette etape genere uniquement deux fichiers .companionconfig locaux.
echo Aucun write hardware. Aucun import automatique dans Companion.
echo.

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

"%NODE_EXE%" "%~dp0generate-safe-pages.js"
set "EXITCODE=%ERRORLEVEL%"
echo.
if not "%EXITCODE%"=="0" (
    echo ECHEC de generation des pages SAFE.
    pause
    exit /b %EXITCODE%
)

echo Pages pretes dans :
echo   generated\SAFE_PAGE_A.companionconfig
echo   generated\SAFE_PAGE_B.companionconfig
echo.
echo Importe-les comme DEUX NOUVELLES PAGES dans Companion.
echo Remappe FOCUSRITE TESTBENCH TARGET vers ta connexion Focusrite actuelle.
echo.
pause
exit /b 0
