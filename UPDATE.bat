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
set "CURRENT_HEAD=UNKNOWN"
for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
if not defined CURRENT_BRANCH set "CURRENT_BRANCH=main"
for /f "delims=" %%H in ('git rev-parse --short=12 HEAD 2^>nul') do set "CURRENT_HEAD=%%H"

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

set "REMOTE_HEAD=UNKNOWN"
for /f "delims=" %%H in ('git rev-parse --short=12 "refs/remotes/origin/!TARGET_BRANCH!" 2^>nul') do set "REMOTE_HEAD=%%H"
echo HEAD distant  : !REMOTE_HEAD!

rem A local branch can belong to another linked worktree. Git correctly refuses
rem to check out the same branch twice. Detect that ownership before switch and
rem continue the update inside the worktree that already owns the selected branch.
set "TARGET_WORKTREE="
set "WT_PATH="
for /f "usebackq tokens=1,*" %%A in (`git worktree list --porcelain`) do (
    if /I "%%A"=="worktree" set "WT_PATH=%%B"
    if /I "%%A"=="branch" if /I "%%B"=="refs/heads/!TARGET_BRANCH!" set "TARGET_WORKTREE=!WT_PATH!"
)

if defined TARGET_WORKTREE (
    for %%I in ("!REPO_DIR!") do set "CURRENT_WORKTREE=%%~fI"
    for %%I in ("!TARGET_WORKTREE!") do set "TARGET_WORKTREE_NORM=%%~fI"
    if /I not "!CURRENT_WORKTREE!"=="!TARGET_WORKTREE_NORM!" (
        echo.
        echo [WORKTREE] La branche cible est deja active dans un autre worktree.
        echo [WORKTREE] Bascule automatique vers : !TARGET_WORKTREE_NORM!
        set "REPO_DIR=!TARGET_WORKTREE_NORM!\"
        cd /d "!REPO_DIR!"
        if errorlevel 1 (
            echo ERREUR : impossible d'ouvrir le worktree qui possede !TARGET_BRANCH!.
            goto :fail
        )
        git rev-parse --is-inside-work-tree >nul 2>&1
        if errorlevel 1 (
            echo ERREUR : le worktree detecte n'est plus valide.
            goto :fail
        )
        set "CURRENT_BRANCH="
        set "CURRENT_HEAD=UNKNOWN"
        for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
        for /f "delims=" %%H in ('git rev-parse --short=12 HEAD 2^>nul') do set "CURRENT_HEAD=%%H"
        if /I not "!CURRENT_BRANCH!"=="!TARGET_BRANCH!" (
            echo ERREUR : le worktree detecte ne possede plus la branche cible.
            goto :fail
        )
        echo [WORKTREE] Branche : !CURRENT_BRANCH!
        echo [WORKTREE] HEAD    : !CURRENT_HEAD!
    )
)

rem Do not rely only on `git status` here. A stale cached index entry can hide a
rem tracked-file edit until checkout/merge notices it. Force-refresh tracked
rem metadata first, then check tracked and untracked changes independently.
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
    echo Etat local detecte dans le worktree cible. Creation d'un stash de securite...
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
        echo La branche courante est conservee.
        goto :fail
    )
)

if /I not "!CURRENT_BRANCH!"=="!TARGET_BRANCH!" (
    git show-ref --verify --quiet "refs/heads/!TARGET_BRANCH!"
    if errorlevel 1 (
        rem Do not use --track here: a narrow remote.fetch refspec can make a
        rem materialised refs/remotes/origin/<branch> ineligible for upstream
        rem tracking even though the ref exists. Create from the exact ref;
        rem pull --ff-only below remains explicit and does not need upstream config.
        git switch -c "!TARGET_BRANCH!" "refs/remotes/origin/!TARGET_BRANCH!"
    ) else (
        git switch "!TARGET_BRANCH!"
    )
    if errorlevel 1 goto :fail
)

git pull --ff-only origin "!TARGET_BRANCH!"
if errorlevel 1 goto :fail

set "FINAL_HEAD=UNKNOWN"
for /f "delims=" %%H in ('git rev-parse --short=12 HEAD 2^>nul') do set "FINAL_HEAD=%%H"
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
