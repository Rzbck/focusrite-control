@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Run from a temporary copy because UPDATE.bat may switch branches and replace
rem this tracked file while the process is waiting.
if /I "%~1"=="--worker" goto :worker

set "REPO_DIR=%~dp0"
set "LOG_DIR=%REPO_DIR%.local-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "LOG_FILE=%LOG_DIR%\UPDATE_AND_RUN_latest.txt"
>"%LOG_FILE%" echo Focusrite Control UPDATE_AND_RUN bootstrap
>>"%LOG_FILE%" echo Started: %DATE% %TIME%
>>"%LOG_FILE%" echo Repo: %REPO_DIR%

set "TMP_SCRIPT=%TEMP%\FOCUSRITE_CONTROL_UPDATE_RUN_%RANDOM%_%RANDOM%.bat"
copy /Y "%~f0" "!TMP_SCRIPT!" >nul
if errorlevel 1 (
    echo ERREUR : impossible de creer le worker temporaire UPDATE_AND_RUN.
    >>"%LOG_FILE%" echo ERROR: temporary worker copy failed.
    echo Log : "%LOG_FILE%"
    pause
    endlocal & exit /b 1
)

>>"%LOG_FILE%" echo Temporary worker: !TMP_SCRIPT!
call "!TMP_SCRIPT!" --worker "!REPO_DIR!" "!LOG_FILE!"
set "BOOT_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Worker exit code: !BOOT_RC!
del /Q "!TMP_SCRIPT!" >nul 2>&1

if not "!BOOT_RC!"=="0" (
    echo.
    echo ==============================================================
    echo UPDATE_AND_RUN FAILED - code !BOOT_RC!
    echo Log persistant : "!LOG_FILE!"
    echo ==============================================================
    echo Appuyez sur une touche pour fermer.
    pause >nul
)

endlocal & exit /b %BOOT_RC%

:worker
set "REPO_DIR=%~2"
set "LOG_FILE=%~3"
if not defined REPO_DIR (
    if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: worker repository path missing.
    echo ERREUR : chemin du depot absent.
    endlocal & exit /b 1
)

cd /d "!REPO_DIR!"
if errorlevel 1 (
    if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: cannot cd to repository.
    echo ERREUR : impossible d'ouvrir le dossier du depot.
    echo Dossier : !REPO_DIR!
    if defined LOG_FILE echo Log : "!LOG_FILE!"
    endlocal & exit /b 1
)

if defined LOG_FILE >>"!LOG_FILE!" echo Worker entered repository successfully.

title Focusrite Control - Update Branch and Run
cls
echo ==============================================================
echo       FOCUSRITE CONTROL - UPDATE / BRANCH / RUN
echo ==============================================================
echo.
echo Log local : .local-logs\UPDATE_AND_RUN_latest.txt
echo.
echo [1/2] Selection de branche + mise a jour...
if defined LOG_FILE >>"!LOG_FILE!" echo Starting UPDATE.bat
call "!REPO_DIR!UPDATE.bat" --no-pause
set "UPDATE_RC=!ERRORLEVEL!"
if defined LOG_FILE >>"!LOG_FILE!" echo UPDATE.bat exit code: !UPDATE_RC!
if not "!UPDATE_RC!"=="0" (
    echo.
    echo UPDATE FAILED - RUN annule.
    if defined LOG_FILE echo Log : "!LOG_FILE!"
    endlocal & exit /b !UPDATE_RC!
)

echo.
echo [2/2] Lancement de la branche courante...
echo.
if defined LOG_FILE >>"!LOG_FILE!" echo Starting RUN.bat
call "!REPO_DIR!RUN.bat"
set "RUN_CODE=!ERRORLEVEL!"
if defined LOG_FILE >>"!LOG_FILE!" echo RUN.bat exit code: !RUN_CODE!
if not "!RUN_CODE!"=="0" (
    echo.
    echo RUN termine avec le code !RUN_CODE!.
    if defined LOG_FILE echo Log : "!LOG_FILE!"
)
endlocal & exit /b %RUN_CODE%
