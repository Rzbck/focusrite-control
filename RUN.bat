@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem One-shot RC formatter bootstrap.
rem It runs from a temporary copy so it can safely restore RUN.bat before final validation.
if /I "%~1"=="--format-worker" goto :format_worker

set "REPO_DIR=%~dp0"
set "TMP_SCRIPT=%TEMP%\FOCUSRITE_RC_FORMAT_%RANDOM%_%RANDOM%.bat"
copy /Y "%~f0" "!TMP_SCRIPT!" >nul
if errorlevel 1 (
    echo ERREUR : impossible de creer le worker temporaire de formatage.
    endlocal & exit /b 1
)

call "!TMP_SCRIPT!" --format-worker "!REPO_DIR!"
set "BOOT_RC=!ERRORLEVEL!"
del /Q "!TMP_SCRIPT!" >nul 2>&1
endlocal & exit /b %BOOT_RC%

:format_worker
set "REPO_DIR=%~2"
if not defined REPO_DIR (
    echo ERREUR : chemin du depot absent.
    endlocal & exit /b 1
)
cd /d "!REPO_DIR!"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir le depot.
    endlocal & exit /b 1
)

title Focusrite Control - RC automatic format repair
set "REQUIRED_BRANCH=rc/v0.1.13-state-contract"
set "BASE_COMMIT=4fcf95fa32c0970de1889282162eb91b9f61cb8f"
set "CURRENT_BRANCH="
for /f "delims=" %%B in ('git branch --show-current') do set "CURRENT_BRANCH=%%B"
if /I not "!CURRENT_BRANCH!"=="!REQUIRED_BRANCH!" (
    echo ERREUR : ce reparateur ne fonctionne que sur !REQUIRED_BRANCH!.
    endlocal & exit /b 1
)

set "PARENT_COMMIT="
for /f "delims=" %%C in ('git rev-parse HEAD^^') do set "PARENT_COMMIT=%%C"
if /I not "!PARENT_COMMIT!"=="!BASE_COMMIT!" (
    echo ERREUR : la branche a change depuis le diagnostic de formatage.
    echo Aucun fichier source n'a ete modifie.
    endlocal & exit /b 1
)

set "DIRTY_TRACKED=0"
for /f "delims=" %%A in ('git status --porcelain --untracked-files=no') do set "DIRTY_TRACKED=1"
if "!DIRTY_TRACKED!"=="1" (
    echo ERREUR : des modifications suivies sont deja presentes. Abandon securise.
    git status --short
    endlocal & exit /b 1
)

set "NODE_SOURCE="
set "PORTABLE_NODE_DIR=%REPO_DIR%.build-tools\node22"
if exist "!PORTABLE_NODE_DIR!\node.exe" (
    "!PORTABLE_NODE_DIR!\node.exe" -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>&1
    if not errorlevel 1 (
        set "PATH=!PORTABLE_NODE_DIR!;!PATH!"
        set "NODE_SOURCE=portable-existing"
    )
)
if not defined NODE_SOURCE (
    where node >nul 2>&1
    if errorlevel 1 (
        echo ERREUR : Node 22.20+ introuvable.
        endlocal & exit /b 1
    )
    node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a===22 && b>=20 ? 0 : 1)" >nul 2>&1
    if errorlevel 1 (
        echo ERREUR : Node du PATH incompatible. Il faut Node 22.20+.
        endlocal & exit /b 1
    )
    set "NODE_SOURCE=PATH"
)

where corepack >nul 2>&1
if errorlevel 1 (
    echo ERREUR : Corepack introuvable.
    endlocal & exit /b 1
)
call corepack enable >nul 2>&1
if errorlevel 1 (
    echo ERREUR : impossible d'activer Corepack.
    endlocal & exit /b 1
)

echo ==============================================================
echo  FOCUSRITE CONTROL - REPARATION FORMAT RC
 echo ==============================================================
echo Cette etape ne contient AUCUN write hardware.
echo Elle applique uniquement le format Prettier deja configure.
echo.

if exist "%REPO_DIR%yarn.lock" (
    call yarn install --immutable
) else (
    call yarn install
)
if errorlevel 1 (
    echo ERREUR : installation des dependances impossible.
    endlocal & exit /b 1
)

echo [1/5] Application de Prettier...
call yarn format
if errorlevel 1 (
    echo ERREUR : Prettier a echoue.
    endlocal & exit /b 1
)

set "UNEXPECTED="
for /f "delims=" %%F in ('git diff --name-only') do (
    set "MATCH=0"
    for %%A in (
        ".yarnrc.yml"
        "AI_PROJECT_RULES.md"
        "companion/manifest.json"
        "package.json"
        "src/actions.js"
        "src/device-parser.js"
        "src/feedbacks.js"
        "src/main.js"
        "src/presets.js"
        "src/variables.js"
        "test-support/synthetic-18i20.js"
        "test/cold-start-contract.test.js"
        "test/full-schema.test.js"
        "test/protocol.test.js"
        "test/rc-validation-status.test.js"
        "test/state-safety.test.js"
        "tools/publish-sanitized-rc-validation.js"
        "tools/rc-validation-status-lib.js"
    ) do if /I "%%~A"=="%%F" set "MATCH=1"
    if "!MATCH!"=="0" set "UNEXPECTED=%%F"
)
if defined UNEXPECTED (
    echo ERREUR : Prettier a modifie un fichier hors de la liste attendue : !UNEXPECTED!
    git checkout -- .
    endlocal & exit /b 1
)

set "HAS_DIFF=0"
for /f "delims=" %%F in ('git diff --name-only') do set "HAS_DIFF=1"
if "!HAS_DIFF!"=="0" (
    echo ERREUR : aucun correctif de formatage detecte alors que le gate avait echoue.
    endlocal & exit /b 1
)

git diff --check
if errorlevel 1 (
    echo ERREUR : le diff formate contient une erreur whitespace.
    git checkout -- .
    endlocal & exit /b 1
)

echo [2/5] Enregistrement du formatage...
git add -- ".yarnrc.yml" "AI_PROJECT_RULES.md" "companion/manifest.json" "package.json" "src/actions.js" "src/device-parser.js" "src/feedbacks.js" "src/main.js" "src/presets.js" "src/variables.js" "test-support/synthetic-18i20.js" "test/cold-start-contract.test.js" "test/full-schema.test.js" "test/protocol.test.js" "test/rc-validation-status.test.js" "test/state-safety.test.js" "tools/publish-sanitized-rc-validation.js" "tools/rc-validation-status-lib.js"
if errorlevel 1 (
    echo ERREUR : git add formatage impossible.
    git reset >nul 2>&1
    git checkout -- .
    endlocal & exit /b 1
)
git diff --cached --check
if errorlevel 1 (
    echo ERREUR : le correctif indexe contient une erreur whitespace.
    git reset >nul 2>&1
    git checkout -- .
    endlocal & exit /b 1
)

git -c user.name="Focusrite RC Formatter" -c user.email="focusrite-rc@users.noreply.github.com" commit -m "style: apply Bitfocus Prettier formatting"
if errorlevel 1 (
    echo ERREUR : commit du formatage impossible.
    git reset >nul 2>&1
    endlocal & exit /b 1
)
git push origin HEAD:refs/heads/rc/v0.1.13-state-contract
if errorlevel 1 (
    echo ERREUR : push du formatage impossible. Aucun reset automatique.
    endlocal & exit /b 1
)

set "FORMAT_COMMIT="
for /f "delims=" %%C in ('git rev-parse HEAD') do set "FORMAT_COMMIT=%%C"
echo Formatage publie : !FORMAT_COMMIT!

echo [3/5] Restauration du runner RC normal...
git show !BASE_COMMIT!:RUN.bat > "%REPO_DIR%RUN.bat"
if errorlevel 1 (
    echo ERREUR : restauration de RUN.bat impossible.
    endlocal & exit /b 1
)
git add -- RUN.bat
if errorlevel 1 (
    echo ERREUR : indexation du runner restaure impossible.
    endlocal & exit /b 1
)
git diff --cached --check
if errorlevel 1 (
    echo ERREUR : runner restaure invalide.
    endlocal & exit /b 1
)
git -c user.name="Focusrite RC Formatter" -c user.email="focusrite-rc@users.noreply.github.com" commit -m "chore: restore RC validation runner after format repair"
if errorlevel 1 (
    echo ERREUR : commit de restauration impossible.
    endlocal & exit /b 1
)
git push origin HEAD:refs/heads/rc/v0.1.13-state-contract
if errorlevel 1 (
    echo ERREUR : push du runner restaure impossible.
    endlocal & exit /b 1
)

echo [4/5] Verification que le depot final est propre...
set "DIRTY_FINAL=0"
for /f "delims=" %%A in ('git status --porcelain --untracked-files=no') do set "DIRTY_FINAL=1"
if "!DIRTY_FINAL!"=="1" (
    echo ERREUR : des modifications suivies restent presentes.
    git status --short
    endlocal & exit /b 1
)

echo [5/5] Lancement de la validation RC complete...
echo.
call "%REPO_DIR%RUN.bat"
set "FINAL_RC=!ERRORLEVEL!"
endlocal & exit /b %FINAL_RC%
