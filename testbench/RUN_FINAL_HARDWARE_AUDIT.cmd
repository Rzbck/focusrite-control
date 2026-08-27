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
title Focusrite 18i20 - FINAL Hardware Audit

echo ==================================================================
echo  FOCUSRITE 18i20 - FINAL HARDWARE AUDIT

echo ==================================================================
echo.
echo Ce workflow final combine DEUX preuves distinctes:
echo   1. writes publics v1 via Companion, avec baseline serveur + restauration exacte;
echo   2. validation representative Custom Mix dans Focusrite Control sous recorder READ-ONLY.
echo.
echo IMPORTANT:
echo - output_pair_source est WITHHELD en 0.1.21 apres echec repete de fermeture materielle des deux membres;
echo - la phase Custom Mix observe les familles WITHHELD sans les re-exposer automatiquement dans le module public;
echo - la couverture est cumulative et REPRESENTATIVE PAR FAMILLE;
echo - aucun parcours exhaustif 12 lanes x 24 strips n est demande pour v1.
echo.
echo TOUJOURS EXCLU DU TEST:
echo - Monitor gain item 1677 / niveau PHYSIQUE Monitor;
echo - faux input gain, input mute, phantom par canal, Mic Kill;
echo - Device Preset, Clock Source, Sample Rate, Digital I/O / S/PDIF mode;
echo - Advanced Raw, unknown raw items;
echo - firmware, reset, restore, snapshot;
echo - toute sortie explicitement indisponible.
echo.
echo AVANT DE COMMENCER:
echo - importe la build focusrite-scarlett-18i20-0.1.21.tgz dans Companion;
echo - garde la connexion Focusrite existante et son identite Remote Devices;
echo - laisse Focusrite Control ouvert;
echo - isole/mute en aval TOUTES les sorties physiques et baisse Monitor/casque;
echo - ne lance pas pendant un live ou un enregistrement critique.
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
    "%SCRIPT_DIR%FullTestBenchFinalCustomMixCoverage.js"
    "%SCRIPT_DIR%FinalCustomMixRecorderReady.js"
    "%SCRIPT_DIR%RUN_V1_RELEASE_SMOKE.cmd"
    "%SCRIPT_DIR%RUN_MANUAL_FEEDBACK_SWEEP.cmd"
) do if not exist "%%~fF" set "MISSING_COMPONENT=%%~fF"
if defined MISSING_COMPONENT (
    echo FINAL AUDIT SELF-CHECK FAILED - composant introuvable :
    echo   !MISSING_COMPONENT!
    echo AUCUN write hardware lance par ce workflow.
    pause
    exit /b 3
)

echo ==================================================================
echo  PREFLIGHT FINAL CUSTOM MIX - READ-ONLY

echo ==================================================================
"%NODE_EXE%" "%SCRIPT_DIR%FullTestBenchFinalCustomMixCoverage.js" --preflight
set "CUSTOM_PREFLIGHT=!ERRORLEVEL!"
if not "!CUSTOM_PREFLIGHT!"=="0" (
    echo.
    echo PREFLIGHT FINAL BLOQUE - aucun write hardware lance par ce workflow.
    echo Si demande, active uniquement l option Companion:
    echo   Expose mixer diagnostic variables ^(read-only^)
    echo puis relance ce workflow.
    pause
    exit /b !CUSTOM_PREFLIGHT!
)

echo.
echo ==================================================================
echo  PHASE A - WRITES PUBLICS V1 / RESTAURATION EXACTE

echo ==================================================================
call "%SCRIPT_DIR%RUN_V1_RELEASE_SMOKE.cmd"
set "RELEASE_CODE=!ERRORLEVEL!"
if "!RELEASE_CODE!"=="4" (
    echo.
    echo FINAL AUDIT STOP - HARD ABORT de restauration/baseline/collateral.
    echo Ne poursuis pas la phase Custom Mix avant diagnostic.
    pause
    exit /b 4
)
if "!RELEASE_CODE!"=="2" (
    echo.
    echo FINAL AUDIT STOP - echec fonctionnel du smoke public v1.
    echo Analyse latest-v1-release-smoke.json avant tout autre write.
    pause
    exit /b 2
)
if not "!RELEASE_CODE!"=="0" if not "!RELEASE_CODE!"=="5" (
    echo.
    echo FINAL AUDIT STOP - smoke public retourne code !RELEASE_CODE!.
    pause
    exit /b !RELEASE_CODE!
)

echo.
echo ==================================================================
echo  TRANSITION A VERS B - RECORDER READY / READ-ONLY

echo ==================================================================
"%NODE_EXE%" "%SCRIPT_DIR%FinalCustomMixRecorderReady.js"
set "READY_CODE=!ERRORLEVEL!"
if not "!READY_CODE!"=="0" (
    echo.
    echo PHASE B BLOQUEE AVANT REC ON - la rematerialisation Remote Devices n est pas encore stable.
    echo La Phase A precedente reste valide; utilise RUN_FINAL_CUSTOM_MIX_RESUME.bat apres synchronisation.
    pause
    exit /b !READY_CODE!
)

echo.
echo ==================================================================
echo  CE QUI MANQUE AVANT LE REC - READ-ONLY

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
echo  PHASE B - CUSTOM MIX REPRESENTATIF / RECORDER READ-ONLY

echo ==================================================================
echo.
echo Le HARNESS est 100%% READ-ONLY. TES clics Focusrite Control changent le hardware.
echo La ligne A FAIRE ci-dessus est la reference exacte.
echo.
echo SI tout manque, le maximum utile est seulement:
echo   1. router UNE paire d Outputs disponible vers Custom Mix et attendre ~2 s;
echo   2. ouvrir ce Custom Mix;
echo   3. sur UNE tranche visible: Mute ON/OFF, Solo ON/OFF,
echo      fader 2 positions et pan 2 positions ^(~2 s par etat^);
echo   4. faire UNE bascule Stereo/Mono visible;
echo   5. Talkback ON/OFF seulement si A FAIRE le demande et si c est sur.
echo.
echo AUCUN BESOIN de parcourir tous les Custom Mix ni les 24 tranches.
echo MAIN/ALT et les meters deja fermes ne sont pas a refaire pour repetition.
echo NE BOUGE RIEN avant l affichage clair ^>^>^> REC ON ^<^<^<.
echo Cette phase passive ne restaure pas automatiquement TES clics Focusrite Control.
echo.
set "CUSTOM_CONFIRM="
set /p "CUSTOM_CONFIRM=Tape CUSTOM_MIX_READY puis Entree pour lancer le recorder : "
if /I not "!CUSTOM_CONFIRM!"=="CUSTOM_MIX_READY" (
    echo ANNULE - aucune nouvelle capture Custom Mix.
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
    echo FINAL CUSTOM MIX RECORDER FATAL - analyse le log avant de recommencer.
    pause
    exit /b 2
)

:PHASE_C
echo.
echo ==================================================================
echo  PHASE C - BILAN CUMULATIF CUSTOM MIX

echo ==================================================================
"%NODE_EXE%" "%SCRIPT_DIR%FullTestBenchFinalCustomMixCoverage.js"
set "COVERAGE_CODE=!ERRORLEVEL!"

echo.
echo ==================================================================
echo  RESULTATS FINAL HARDWARE AUDIT

echo ==================================================================
echo Public write smoke : testbench\results\latest-v1-release-smoke.json
echo Feedback REC       : testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json
echo Custom Mix evidence: testbench\results\FINAL_CUSTOM_MIX_EVIDENCE.json
echo Custom Mix coverage: testbench\results\FINAL_CUSTOM_MIX_COVERAGE.json
echo.
if "!COVERAGE_CODE!"=="4" (
    echo FINAL AUDIT: CUSTOM MIX MISMATCH DETECTE - diagnostic requis.
    pause
    exit /b 4
)
if "!COVERAGE_CODE!"=="0" (
    if "!RELEASE_CODE!"=="0" (
        echo FINAL HARDWARE AUDIT: COMPLETE / FULL LIVE COVERAGE.
        pause
        exit /b 0
    ) else (
        echo FINAL HARDWARE AUDIT: CUSTOM MIX COMPLETE, PUBLIC SMOKE AVEC SKIPS SURS.
        pause
        exit /b 5
    )
)
if "!REC_CODE!"=="4" (
    echo FINAL AUDIT: FEEDBACK MISMATCH DETECTE - diagnostic requis.
    pause
    exit /b 4
)
if "!COVERAGE_CODE!"=="5" (
    echo FINAL HARDWARE AUDIT: PARTIAL SAFE - la ligne A FAIRE donne le reliquat exact.
    pause
    exit /b 5
)

echo FINAL HARDWARE AUDIT: echec bilan code !COVERAGE_CODE!.
pause
exit /b !COVERAGE_CODE!
