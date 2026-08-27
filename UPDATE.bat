@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem A tracked batch file must never resume reading from disk after a worker
rem switches branches and replaces that same file. Keep the whole bootstrap
rem continuation inside one parsed block so cmd.exe has already read it before
rem the temporary worker is allowed to switch/pull.
if /I not "%~1"=="--worker" (
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
    endlocal & exit /b !BOOT_RC!
)

goto :worker

:worker
set "SOURCE_REPO=%~2"
if not defined SOURCE_REPO (
    echo ERREUR : chemin du depot absent pour le worker UPDATE.
    if /I not "%~3"=="--no-pause" pause
    endlocal & exit /b 1
)

cd /d "%SOURCE_REPO%"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir le dossier du depot.
    if /I not "%~3"=="--no-pause" pause
    endlocal & exit /b 1
)

set "REPO_DIR="
for /f "delims=" %%R in ('git rev-parse --show-toplevel 2^>nul') do set "REPO_DIR=%%R"
if not defined REPO_DIR (
    echo ERREUR : ce dossier n'est pas un depot Git clone.
    if /I not "%~3"=="--no-pause" pause
    endlocal & exit /b 1
)
cd /d "!REPO_DIR!"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine Git detectee.
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

set "CURRENT_BRANCH="
set "CURRENT_HEAD=UNKNOWN"
for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
if not defined CURRENT_BRANCH set "CURRENT_BRANCH=main"
for /f "delims=" %%H in ('git rev-parse --verify HEAD 2^>nul') do set "CURRENT_HEAD=%%H"
if not "!CURRENT_HEAD!"=="UNKNOWN" set "CURRENT_HEAD=!CURRENT_HEAD:~0,12!"

echo Dossier depot : !REPO_DIR!
echo HEAD local    : !CURRENT_HEAD!
echo.
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

echo Synchronisation explicite de origin/!TARGET_BRANCH!...
git fetch origin "+refs/heads/!TARGET_BRANCH!:refs/remotes/origin/!TARGET_BRANCH!"
if errorlevel 1 (
    echo ERREUR : impossible de materialiser origin/!TARGET_BRANCH! localement.
    goto :fail
)

set "REMOTE_HEAD=UNKNOWN"
for /f "delims=" %%H in ('git rev-parse --verify "refs/remotes/origin/!TARGET_BRANCH!" 2^>nul') do set "REMOTE_HEAD=%%H"
if not "!REMOTE_HEAD!"=="UNKNOWN" set "REMOTE_HEAD=!REMOTE_HEAD:~0,12!"
echo HEAD distant  : !REMOTE_HEAD!

rem If another linked worktree already owns a different selected branch, do not
rem try to jump directories automatically. Report the owner and stop safely.
if /I not "!CURRENT_BRANCH!"=="!TARGET_BRANCH!" (
    set "TARGET_WORKTREE="
    set "WT_PATH="
    for /f "tokens=1,*" %%A in ('git worktree list --porcelain') do (
        if /I "%%A"=="worktree" set "WT_PATH=%%B"
        if /I "%%A"=="branch" if /I "%%B"=="refs/heads/!TARGET_BRANCH!" set "TARGET_WORKTREE=!WT_PATH!"
    )
    if defined TARGET_WORKTREE (
        echo.
        echo ERREUR : la branche !TARGET_BRANCH! est deja active dans un autre worktree.
        echo Worktree proprietaire : !TARGET_WORKTREE!
        echo Lance UPDATE.bat depuis ce worktree au lieu de rattacher la branche une seconde fois.
        goto :fail
    )
)

rem Force-refresh tracked metadata before deciding whether a safety stash is needed.
git update-index --really-refresh >nul 2>&1
set "DIRTY=0"
git diff-files --quiet --
if errorlevel 1 set "DIRTY=1"
for /f "delims=" %%A in ('git ls-files --others --exclude-standard') do set "DIRTY=1"
if "!DIRTY!"=="0" (
    for /f "delims=" %%A in ('git status --porcelain --untracked-files=all') do set "DIRTY=1"
)

if "!DIRTY!"=="1" (
    echo.
    echo Etat local detecte. Creation d'un stash de securite...
    git status --short
    git stash push --include-untracked -m "FOCUSRITE AUTO SAFETY - !CURRENT_BRANCH! - before !TARGET_BRANCH!"
    if errorlevel 1 goto :fail
    set "STASHED=1"

    git update-index --really-refresh >nul 2>&1
    set "DIRTY_AFTER_STASH=0"
    git diff-files --quiet --
    if errorlevel 1 set "DIRTY_AFTER_STASH=1"
    for /f "delims=" %%A in ('git ls-files --others --exclude-standard') do set "DIRTY_AFTER_STASH=1"
    if "!DIRTY_AFTER_STASH!"=="0" (
        for /f "delims=" %%A in ('git status --porcelain --untracked-files=all') do set "DIRTY_AFTER_STASH=1"
    )
    if "!DIRTY_AFTER_STASH!"=="1" (
        echo ERREUR : des modifications locales restent presentes apres le stash.
        git status --short
        echo La branche courante est conservee.
        goto :fail
    )
)

if /I not "!CURRENT_BRANCH!"=="!TARGET_BRANCH!" (
    git show-ref --verify --quiet "refs/heads/!TARGET_BRANCH!"
    if errorlevel 1 (
        git switch -c "!TARGET_BRANCH!" "refs/remotes/origin/!TARGET_BRANCH!"
    ) else (
        git switch "!TARGET_BRANCH!"
    )
    if errorlevel 1 goto :fail
)

git pull --ff-only origin "!TARGET_BRANCH!"
if errorlevel 1 goto :fail

set "FINAL_HEAD=UNKNOWN"
for /f "delims=" %%H in ('git rev-parse --verify HEAD 2^>nul') do set "FINAL_HEAD=%%H"
if not "!FINAL_HEAD!"=="UNKNOWN" set "FINAL_HEAD=!FINAL_HEAD:~0,12!"
echo.
echo ==============================================================
echo PROJET A JOUR
echo Dossier  : !REPO_DIR!
echo Branche  : !TARGET_BRANCH!
echo HEAD     : !FINAL_HEAD!
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
