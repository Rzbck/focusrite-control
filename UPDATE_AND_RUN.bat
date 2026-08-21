@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Run from a temporary copy because UPDATE.bat may switch branches and replace
rem this tracked file while the process is waiting.
if /I "%~1"=="--worker" goto :worker

set "REPO_DIR=%~dp0"
set "TMP_SCRIPT=%TEMP%\FOCUSRITE_CONTROL_UPDATE_RUN_%RANDOM%_%RANDOM%.bat"
copy /Y "%~f0" "!TMP_SCRIPT!" >nul
if errorlevel 1 (
    echo ERREUR : impossible de creer le worker temporaire UPDATE_AND_RUN.
    pause
    endlocal & exit /b 1
)
call "!TMP_SCRIPT!" --worker "!REPO_DIR!"
set "BOOT_RC=!ERRORLEVEL!"
del /Q "!TMP_SCRIPT!" >nul 2>&1
endlocal & exit /b %BOOT_RC%

:worker
set "REPO_DIR=%~2"
if not defined REPO_DIR endlocal & exit /b 1
cd /d "!REPO_DIR!" || endlocal & exit /b 1

title Focusrite Control - Update Branch and Run
cls
echo ==============================================================
echo       FOCUSRITE CONTROL - UPDATE / BRANCH / RUN
echo ==============================================================
echo.
echo [1/2] Selection de branche + mise a jour...
call "!REPO_DIR!UPDATE.bat" --no-pause
if errorlevel 1 (
    echo.
    echo UPDATE FAILED - RUN annule.
    pause
    endlocal & exit /b 1
)

echo.
echo [2/2] Lancement de la branche courante...
echo.
call "!REPO_DIR!RUN.bat"
set "RUN_CODE=!ERRORLEVEL!"
if not "!RUN_CODE!"=="0" (
    echo.
    echo RUN termine avec le code !RUN_CODE!.
    pause
)
endlocal & exit /b %RUN_CODE%
