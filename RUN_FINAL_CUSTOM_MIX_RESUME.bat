@echo off
setlocal EnableExtensions
set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    endlocal & exit /b 1
)
set "LAUNCHER=%ROOT_DIR%testbench\RUN_FINAL_CUSTOM_MIX_RESUME.cmd"
if not exist "%LAUNCHER%" (
    echo ERREUR : lanceur FINAL Custom Mix RESUME introuvable.
    echo Lance UPDATE_AND_RUN.bat pour resynchroniser le projet.
    endlocal & exit /b 1
)
call "%LAUNCHER%"
set "EXITCODE=%ERRORLEVEL%"
endlocal & exit /b %EXITCODE%
