@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)

title Focusrite Control - TestBench SAFE / FULL

set "TESTBENCH_LAUNCHER=%~dp0testbench\RUN_SAFE_HARDWARE_TESTS.cmd"
if not exist "%TESTBENCH_LAUNCHER%" (
    echo ERREUR : lanceur TestBench introuvable :
    echo   testbench\RUN_SAFE_HARDWARE_TESTS.cmd
    echo.
    echo Lance UPDATE_AND_RUN.bat pour resynchroniser le projet.
    pause
    endlocal & exit /b 1
)

call "%TESTBENCH_LAUNCHER%"
set "EXITCODE=%ERRORLEVEL%"
endlocal & exit /b %EXITCODE%
