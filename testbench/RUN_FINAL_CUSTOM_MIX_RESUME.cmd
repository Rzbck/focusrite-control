@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_DIR=%%~fI"
cd /d "%REPO_DIR%"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    exit /b 1
)
title Focusrite 18i20 - FINAL Custom Mix RESUME

echo ==================================================================
echo  FOCUSRITE 18i20 - FINAL CUSTOM MIX RESUME ^(PHASE B/C ONLY^)
echo ==================================================================
echo.
echo Ce lanceur NE REFAIT PAS la Phase A.
echo Il accepte seulement un latest-v1-release-smoke.json recent et propre 0.1.21,
echo puis attend la rematerialisation Remote Devices avant le REC read-only.
echo Aucun write hardware n existe dans ce resume.
echo.

set "NODE_EXE="
if exist "%REPO_DIR%\.build-tools\node22\node.exe" set "NODE_EXE=%REPO_DIR%\.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)
if not defined NODE_EXE (
    echo ERREUR : Node.js introuvable. Lance UPDATE_AND_RUN.bat d'abord.
    pause
    exit /b 1
)

set "MISSING_COMPONENT="
for %%F in (
    "%SCRIPT_DIR%FinalCustomMixResumeGate.js"
    "%SCRIPT_DIR%FinalCustomMixRecorderReady.js"
    "%SCRIPT_DIR%FullTestBenchFinalCustomMixCoverage.js"
    "%SCRIPT_DIR%RUN_MANUAL_FEEDBACK_SWEEP.cmd"
) do if not exist "%%~fF" set "MISSING_COMPONENT=%%~fF"
if defined MISSING_COMPONENT (
    echo RESUME SELF-CHECK FAILED - composant introuvable :
    echo   !MISSING_COMPONENT!
    echo Aucun write hardware lance.
    pause
    exit /b 3
)

echo ==================================================================
echo  RESUME GATE - READ ONLY

echo ==================================================================
"%NODE_EXE%" "%SCRIPT_DIR%FinalCustomMixResumeGate.js"
set "RESUME_CODE=!ERRORLEVEL!"
if not "!RESUME_CODE!"=="0" (
    echo.
    echo RESUME BLOQUE. Ne relance pas la Phase A automatiquement.
    pause
    exit /b !RESUME_CODE!
)

echo.
echo ==================================================================
echo  CE QUI MANQUE AVANT LE NOUVEAU REC - READ ONLY

echo ==================================================================
"%NODE_EXE%" "%SCRIPT_DIR%FullTestBenchFinalCustomMixCoverage.js" --status
set "STATUS_CODE=!ERRORLEVEL!"
if "!STATUS_CODE!"=="2" (
    echo STATUS FINAL illisible - diagnostic requis.
    pause
    exit /b 2
)
if "!STATUS_CODE!"=="0" (
    echo.
    echo PREUVE REPRESENTATIVE DEJA COMPLETE - aucun nouveau REC necessaire.
    set "REC_CODE=0"
    goto :PHASE_C
)

echo.
echo ==================================================================
echo  PHASE B - REC REPRESENTATIF CUSTOM MIX / READ ONLY

echo ==================================================================
echo Le bilan juste au-dessus affiche exactement A FAIRE PENDANT LE REC.
echo.
echo SI toutes les familles manquent, le maximum utile est seulement :
echo   1. router UNE paire d Outputs disponible vers Custom Mix et attendre ~2 s;
echo   2. ouvrir ce Custom Mix;
echo   3. sur UNE tranche visible: Mute ON/OFF, Solo ON/OFF,
echo      fader 2 positions et pan 2 positions ^(~2 s par etat^);
echo   4. faire UNE bascule Stereo/Mono visible;
echo   5. Talkback ON/OFF uniquement si la ligne A FAIRE le demande et si c est sur.
echo.
echo AUCUN BESOIN de parcourir tous les Custom Mix ni les 24 tranches.
echo Les 12 meters deja fermes sont reutilises automatiquement.
echo Attends imperativement ^>^>^> REC ON ^<^<^< avant de bouger quoi que ce soit.
echo.
set "CUSTOM_CONFIRM="
set /p "CUSTOM_CONFIRM=Tape CUSTOM_MIX_READY puis Entree : "
if /I not "!CUSTOM_CONFIRM!"=="CUSTOM_MIX_READY" (
    echo ANNULE - aucune nouvelle capture.
    pause
    exit /b 1
)

if exist "%SCRIPT_DIR%results\LATEST_MANUAL_FEEDBACK_SWEEP.json" if not exist "%SCRIPT_DIR%results\FINAL_PREVIOUS_MANUAL_FEEDBACK_SWEEP.json" (
    copy /y "%SCRIPT_DIR%results\LATEST_MANUAL_FEEDBACK_SWEEP.json" "%SCRIPT_DIR%results\FINAL_PREVIOUS_MANUAL_FEEDBACK_SWEEP.json" >nul
)

call "%SCRIPT_DIR%RUN_MANUAL_FEEDBACK_SWEEP.cmd"
set "REC_CODE=!ERRORLEVEL!"
if "!REC_CODE!"=="2" (
    echo.
    echo FINAL CUSTOM MIX RECORDER FATAL - aucun bilan nouveau n est fabrique.
    pause
    exit /b 2
)

:PHASE_C
echo.
echo ==================================================================
echo  PHASE C - BILAN REPRESENTATIF CUMULATIF

echo ==================================================================
"%NODE_EXE%" "%SCRIPT_DIR%FullTestBenchFinalCustomMixCoverage.js"
set "COVERAGE_CODE=!ERRORLEVEL!"

echo.
echo Feedback REC       : testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json
echo Custom Mix evidence: testbench\results\FINAL_CUSTOM_MIX_EVIDENCE.json
echo Custom Mix coverage: testbench\results\FINAL_CUSTOM_MIX_COVERAGE.json
echo.
if "!COVERAGE_CODE!"=="0" (
    echo FINAL CUSTOM MIX RESUME: COMPLETE.
    pause
    exit /b 0
)
if "!COVERAGE_CODE!"=="4" (
    echo FINAL CUSTOM MIX RESUME: MISMATCH - diagnostic requis.
    pause
    exit /b 4
)
if "!REC_CODE!"=="4" (
    echo FINAL RESUME: FEEDBACK MISMATCH DETECTE - diagnostic requis.
    pause
    exit /b 4
)
if "!COVERAGE_CODE!"=="5" (
    echo FINAL CUSTOM MIX RESUME: PARTIAL SAFE - la ligne A FAIRE indique le reliquat exact.
    pause
    exit /b 5
)
echo FINAL CUSTOM MIX RESUME: echec bilan code !COVERAGE_CODE!.
pause
exit /b !COVERAGE_CODE!
