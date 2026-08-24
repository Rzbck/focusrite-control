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
if not defined REPO_DIR (
    echo ERREUR : chemin du depot absent.
    pause
    endlocal & exit /b 1
)

cd /d "!REPO_DIR!"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir le dossier du depot.
    pause
    endlocal & exit /b 1
)

title Focusrite Control - Update Branch and Run
cls
echo ==============================================================
echo       FOCUSRITE CONTROL - UPDATE / BRANCH / RUN
echo ==============================================================
echo.
echo [1/2] Selection de branche + mise a jour...
call "!REPO_DIR!UPDATE.bat" --no-pause
set "UPDATE_CODE=!ERRORLEVEL!"
if not "!UPDATE_CODE!"=="0" (
    echo.
    echo ==============================================================
    echo UPDATE FAILED - RUN annule - code !UPDATE_CODE!
    echo ==============================================================
    echo Appuyez sur une touche pour fermer.
    pause >nul
    endlocal & exit /b !UPDATE_CODE!
)

set "CURRENT_BRANCH=UNKNOWN"
set "CURRENT_HEAD=UNKNOWN"
set "CURRENT_HANDOFF=ABSENT"
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%B"
for /f "delims=" %%H in ('git rev-parse --verify HEAD 2^>nul') do set "CURRENT_HEAD=%%H"
if not "!CURRENT_HEAD!"=="UNKNOWN" set "CURRENT_HEAD=!CURRENT_HEAD:~0,12!"
for /f "delims=" %%H in ('git rev-parse --verify HEAD:docs/CURRENT_HANDOFF.md 2^>nul') do set "CURRENT_HANDOFF=%%H"
if not "!CURRENT_HANDOFF!"=="ABSENT" set "CURRENT_HANDOFF=!CURRENT_HANDOFF:~0,12!"

echo.
echo ==============================================================
echo       CONTEXTE CANONIQUE APRES SYNCHRONISATION
echo ==============================================================
echo Branche      : !CURRENT_BRANCH!
echo HEAD         : !CURRENT_HEAD!
echo Handoff blob : !CURRENT_HANDOFF!
echo ==============================================================
echo IMPORTANT : toute instruction de reprise doit correspondre a cette
echo branche, ce HEAD et au docs\CURRENT_HANDOFF.md de ce meme checkout.
echo Un handoff copie/uploade plus ancien est historique et ne doit pas
echo remplacer ce contexte Git synchronise.
echo ==============================================================
echo.

echo [2/2] Lancement de la branche courante...
echo.
call "!REPO_DIR!RUN.bat"
set "RUN_CODE=!ERRORLEVEL!"

echo.
echo ==============================================================
if "!RUN_CODE!"=="0" (
    echo UPDATE_AND_RUN TERMINE AVEC SUCCES
) else (
    echo UPDATE_AND_RUN TERMINE AVEC CODE !RUN_CODE!
)
echo Appuyez sur une touche pour fermer.
echo ==============================================================
pause >nul
endlocal & exit /b !RUN_CODE!
