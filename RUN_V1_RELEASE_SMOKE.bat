@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)

title Focusrite 18i20 - V1 Release Smoke
set "LAUNCHER=%~dp0testbench\RUN_V1_RELEASE_SMOKE.cmd"
if not exist "%LAUNCHER%" (
    echo ERREUR : lanceur V1 Release Smoke introuvable.
    echo Lance UPDATE_AND_RUN.bat pour resynchroniser le projet.
    pause
    endlocal & exit /b 1
)
call "%LAUNCHER%"
set "EXITCODE=%ERRORLEVEL%"
endlocal & exit /b %EXITCODE%
