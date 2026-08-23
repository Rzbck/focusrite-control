@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Never switch/pull while cmd.exe is reading the tracked UPDATE.bat itself.
if /I "%~1"=="--worker" goto :worker

set "REPO_DIR=%~dp0"
set "TMP_SCRIPT=%TEMP%\FOCUSRITE_CONTROL_UPDATE_%RANDOM%_%RANDOM%.bat"
copy /Y "%~f0" "!TMP_SCRIPT!" >nul
if errorlevel 1 (
    echo ERREUR : impossible de creer le worker temporaire UPDATE.
    pause
    endlocal & exit /b 1
)

if /I "%~1"=="--no-pause" (
    call "!TMP_SCRIPT!" --worker "!REPO_DIR!" --no-pause
) else (
    call "!TMP_SCRIPT!" --worker "!REPO_DIR!"
)
set "BOOT_RC=!ERRORLEVEL!"
del /Q "!TMP_SCRIPT!" >nul 2>&1

endlocal & exit /b %BOOT_RC%

:worker
set "REPO_DIR=%~2"
if not defined REPO_DIR (
    echo ERREUR : chemin du depot absent pour le worker UPDATE.
    if /I not "%~3"=="--no-pause" pause
    endlocal & exit /b 1
)

cd /d "!REPO_DIR!"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir le dossier du depot.
    if /I not "%~3"=="--no-pause" pause
    endlocal & exit /b 1
)

title Focusrite Control - Update / Branch
set "NO_PAUSE=0"
if /I "%~3"=="--no-pause" set "NO_PAUSE=1"
set "STASHED=0"

cls
echo ==============================================================
echo        FOCUSRITE CONTROL - UPDATE / BRANCH
echo ==============================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Git n'est pas installe ou absent du PATH.
    goto :fail
)

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERREUR : ce dossier n'est pas un depot Git clone.
    goto :fail
)

set "CURRENT_BRANCH="
for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
if not defined CURRENT_BRANCH set "CURRENT_BRANCH=main"

echo Synchronisation GitHub...
git fetch origin --prune
if errorlevel 1 goto :fail

:branch_menu
echo.
echo Branche actuelle : !CURRENT_BRANCH!
echo.
echo   [1] Continuer sur !CURRENT_BRANCH!
echo   [2] MAIN - latest testable integration
echo   [3] CHECKPOINT - backup/v0.1.12-user-loaded-20260820
echo   [4] DEBUG - debug/cold-start-readback
echo   [5] Autre branche...
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
    set "TARGET_BRANCH="
    set /p "TARGET_BRANCH=Nom exact de la branche : "
    if not defined TARGET_BRANCH goto :branch_menu
) else (
    goto :branch_menu
)

git ls-remote --exit-code --heads origin "!TARGET_BRANCH!" >nul 2>&1
if errorlevel 1 (
    echo ERREUR : origin/!TARGET_BRANCH! n'existe pas.
    goto :branch_menu
)

rem A clone may have a narrow/single-branch remote.fetch refspec. In that case
rem `git fetch origin --prune` can see the repository but will not materialise a
rem newly-created branch as refs/remotes/origin/<branch>. Fetch the selected
rem remote head explicitly. The leading + only updates the remote-tracking ref;
rem the local branch is still protected below by switch + pull --ff-only.
echo Synchronisation explicite de origin/!TARGET_BRANCH!...
git fetch origin "+refs/heads/!TARGET_BRANCH!:refs/remotes/origin/!TARGET_BRANCH!"
if errorlevel 1 (
    echo ERREUR : impossible de materialiser origin/!TARGET_BRANCH! localement.
    goto :fail
)

set "DIRTY=0"
for /f "delims=" %%A in ('git status --porcelain --untracked-files=all') do set "DIRTY=1"
if "!DIRTY!"=="1" (
    echo.
    echo Etat local detecte. Creation d'un stash de securite...
    git status --short
    git stash push --include-untracked -m "FOCUSRITE AUTO SAFETY - !CURRENT_BRANCH! - before !TARGET_BRANCH!"
    if errorlevel 1 goto :fail
    set "STASHED=1"

    set "DIRTY_AFTER_STASH=0"
    for /f "delims=" %%A in ('git status --porcelain --untracked-files=all') do set "DIRTY_AFTER_STASH=1"
    if "!DIRTY_AFTER_STASH!"=="1" (
        echo ERREUR : des modifications locales restent presentes apres le stash.
        echo La branche courante est conservee.
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
    if errorlevel 1 goto :fail
)

git pull --ff-only origin "!TARGET_BRANCH!"
if errorlevel 1 goto :fail

echo.
echo ==============================================================
echo PROJET A JOUR
echo Branche : !TARGET_BRANCH!
echo ==============================================================
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
if "!NO_PAUSE!"=="0" pause
endlocal & exit /b 1
