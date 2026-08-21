@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Never switch/pull while cmd.exe is reading the tracked UPDATE.bat itself.
if /I "%~1"=="--worker" goto :worker

set "REPO_DIR=%~dp0"
set "LOG_DIR=%REPO_DIR%.local-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1
set "LOG_FILE=%LOG_DIR%\UPDATE_latest.txt"
>"%LOG_FILE%" echo Focusrite Control UPDATE bootstrap
>>"%LOG_FILE%" echo Started: %DATE% %TIME%
>>"%LOG_FILE%" echo Repo: %REPO_DIR%

set "TMP_SCRIPT=%TEMP%\FOCUSRITE_CONTROL_UPDATE_%RANDOM%_%RANDOM%.bat"
copy /Y "%~f0" "!TMP_SCRIPT!" >nul
if errorlevel 1 (
    echo ERREUR : impossible de creer le worker temporaire UPDATE.
    >>"%LOG_FILE%" echo ERROR: temporary worker copy failed.
    echo Log : "%LOG_FILE%"
    pause
    endlocal & exit /b 1
)

if /I "%~1"=="--no-pause" (
    call "!TMP_SCRIPT!" --worker "!REPO_DIR!" --no-pause "!LOG_FILE!"
) else (
    call "!TMP_SCRIPT!" --worker "!REPO_DIR!" --pause "!LOG_FILE!"
)
set "BOOT_RC=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Worker exit code: !BOOT_RC!
del /Q "!TMP_SCRIPT!" >nul 2>&1

if not "!BOOT_RC!"=="0" if /I not "%~1"=="--no-pause" (
    echo.
    echo UPDATE FAILED - code !BOOT_RC!
    echo Log persistant : "%LOG_FILE%"
    pause
)

endlocal & exit /b %BOOT_RC%

:worker
set "REPO_DIR=%~2"
set "PAUSE_MODE=%~3"
set "LOG_FILE=%~4"
if not defined REPO_DIR (
    if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: worker repository path missing.
    echo ERREUR : chemin du depot absent pour le worker UPDATE.
    endlocal & exit /b 1
)

cd /d "!REPO_DIR!"
if errorlevel 1 (
    if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: cannot cd to repository.
    echo ERREUR : impossible d'ouvrir le dossier du depot.
    if /I not "!PAUSE_MODE!"=="--no-pause" pause
    endlocal & exit /b 1
)

if defined LOG_FILE >>"!LOG_FILE!" echo Worker entered repository successfully.

title Focusrite Control - Update / Branch
set "NO_PAUSE=0"
if /I "!PAUSE_MODE!"=="--no-pause" set "NO_PAUSE=1"
set "STASHED=0"

cls
echo ==============================================================
echo        FOCUSRITE CONTROL - UPDATE / BRANCH
echo ==============================================================
echo.
echo Log local : .local-logs\UPDATE_latest.txt
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Git n'est pas installe ou absent du PATH.
    if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: git not found in PATH.
    goto :fail
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERREUR : ce dossier n'est pas un depot Git clone.
    if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: not inside a Git work tree.
    goto :fail
)

set "CURRENT_BRANCH="
for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
if not defined CURRENT_BRANCH set "CURRENT_BRANCH=main"
if defined LOG_FILE >>"!LOG_FILE!" echo Current branch: !CURRENT_BRANCH!

echo Synchronisation GitHub...
git fetch origin --prune
set "FETCH_RC=!ERRORLEVEL!"
if defined LOG_FILE >>"!LOG_FILE!" echo git fetch exit code: !FETCH_RC!
if not "!FETCH_RC!"=="0" goto :fail

:branch_menu
echo.
echo Branche actuelle : !CURRENT_BRANCH!
echo.
echo   [1] Continuer sur !CURRENT_BRANCH!
echo   [2] MAIN - latest testable integration
echo   [3] CHECKPOINT - backup/v0.1.12-user-loaded-20260820
echo   [4] DEBUG READBACK - debug/cold-start-readback
echo   [5] DEBUG STATIC CLIENT - debug/official-client-read-source
echo   [6] DEBUG PASSIVE SESSION - debug/official-client-passive-session
echo   [7] DEBUG MEMORY OBSERVER - debug/official-client-memory-observer
echo   [8] Autre branche...
echo.
set "BRANCH_CHOICE="
set /p "BRANCH_CHOICE=Choix [1] : "
if not defined BRANCH_CHOICE set "BRANCH_CHOICE=1"

if "!BRANCH_CHOICE!"=="1" (
    set "TARGET_BRANCH=!CURRENT_BRANCH!"
) else if "!BRANCH_CHOICE!"=="2" (
    set "TARGET_BRANCH=main"
) else if "!BRANCH_CHOICE!"=="3" (
    set "TARGET_BRANCH=backup/v0.1.12-user-loaded-20260820"
) else if "!BRANCH_CHOICE!"=="4" (
    set "TARGET_BRANCH=debug/cold-start-readback"
) else if "!BRANCH_CHOICE!"=="5" (
    set "TARGET_BRANCH=debug/official-client-read-source"
) else if "!BRANCH_CHOICE!"=="6" (
    set "TARGET_BRANCH=debug/official-client-passive-session"
) else if "!BRANCH_CHOICE!"=="7" (
    set "TARGET_BRANCH=debug/official-client-memory-observer"
) else if "!BRANCH_CHOICE!"=="8" (
    set "TARGET_BRANCH="
    set /p "TARGET_BRANCH=Nom exact de la branche : "
    if not defined TARGET_BRANCH goto :branch_menu
) else (
    echo Choix invalide.
    goto :branch_menu
)

if defined LOG_FILE >>"!LOG_FILE!" echo Target branch: !TARGET_BRANCH!
git ls-remote --exit-code --heads origin "!TARGET_BRANCH!" >nul 2>&1
if errorlevel 1 (
    echo ERREUR : origin/!TARGET_BRANCH! n'existe pas.
    if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: remote branch missing: !TARGET_BRANCH!
    goto :branch_menu
)

set "DIRTY=0"
for /f "delims=" %%A in ('git status --porcelain --untracked-files=all') do set "DIRTY=1"
if "!DIRTY!"=="1" (
    echo.
    echo Etat local detecte. Creation d'un stash de securite...
    git status --short
    git stash push --include-untracked -m "FOCUSRITE AUTO SAFETY - !CURRENT_BRANCH! - before !TARGET_BRANCH!"
    if errorlevel 1 (
        if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: safety stash failed.
        goto :fail
    )
    set "STASHED=1"

    set "DIRTY_AFTER_STASH=0"
    for /f "delims=" %%A in ('git status --porcelain --untracked-files=all') do set "DIRTY_AFTER_STASH=1"
    if "!DIRTY_AFTER_STASH!"=="1" (
        echo ERREUR : des modifications locales restent presentes apres le stash.
        echo La branche courante est conservee.
        if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: work tree still dirty after stash.
        goto :fail
    )
)

if /I not "!CURRENT_BRANCH!"=="!TARGET_BRANCH!" (
    git show-ref --verify --quiet "refs/heads/!TARGET_BRANCH!"
    if errorlevel 1 (
        git switch --track -c "!TARGET_BRANCH!" "origin/!TARGET_BRANCH!"
    ) else (
        git switch "!TARGET_BRANCH!"
    )
    if errorlevel 1 (
        if defined LOG_FILE >>"!LOG_FILE!" echo ERROR: git switch failed.
        goto :fail
    )
)

git pull --ff-only origin "!TARGET_BRANCH!"
set "PULL_RC=!ERRORLEVEL!"
if defined LOG_FILE >>"!LOG_FILE!" echo git pull exit code: !PULL_RC!
if not "!PULL_RC!"=="0" goto :fail

echo.
echo ==============================================================
echo PROJET A JOUR
echo Branche : !TARGET_BRANCH!
echo ==============================================================
if defined LOG_FILE >>"!LOG_FILE!" echo SUCCESS branch: !TARGET_BRANCH!
if "!STASHED!"=="1" (
    echo [SECURITE] Etat local conserve dans Git stash et non reapplique.
    git stash list -1
)
echo.
if "!NO_PAUSE!"=="0" pause
endlocal & exit /b 0

:fail
echo.
echo MISE A JOUR IMPOSSIBLE - aucun merge/reset automatique effectue.
if defined LOG_FILE echo Log persistant : "!LOG_FILE!"
if defined LOG_FILE >>"!LOG_FILE!" echo FAILED: update aborted safely.
if "!NO_PAUSE!"=="0" pause
endlocal & exit /b 1
