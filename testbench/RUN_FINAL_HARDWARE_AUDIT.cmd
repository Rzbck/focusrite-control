@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."
title Focusrite 18i20 - FINAL Hardware Audit

echo ==================================================================
echo  FOCUSRITE 18i20 - FINAL HARDWARE AUDIT

echo ==================================================================
echo.
echo Ce workflow final combine DEUX preuves distinctes:
echo   1. writes publics v1 via Companion, avec baseline serveur + restauration exacte;
echo   2. parcours complet Custom Mix dans Focusrite Control sous recorder READ-ONLY.
echo.
echo IMPORTANT:
echo - la phase Custom Mix observe les fonctions actuellement WITHHELD sans les re-exposer automatiquement dans le module public;
echo - les preuves precedentes sont cumulees pour ne pas te faire refaire ce qui est deja ferme;
echo - une couverture PARTIAL indique exactement ce qui reste a manipuler/observer.
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
echo - importe la NOUVELLE build focusrite-scarlett-18i20-0.1.20.tgz dans Companion;
echo - garde la connexion Focusrite existante et son identite Remote Devices;
echo - laisse Focusrite Control ouvert;
echo - isole/mute en aval TOUTES les sorties physiques et baisse Monitor/casque;
echo - ne lance pas pendant un live ou un enregistrement critique.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)
if not defined NODE_EXE (
    echo ERREUR : Node.js introuvable. Lance UPDATE_AND_RUN.bat d'abord.
    pause
    exit /b 1
)

echo ==================================================================
echo  PREFLIGHT FINAL CUSTOM MIX - READ-ONLY

echo ==================================================================
"%NODE_EXE%" "testbench\FinalCustomMixCoverage.js" --preflight
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
call "testbench\RUN_V1_RELEASE_SMOKE.cmd"
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
echo  PHASE B - CUSTOM MIX COMPLET / RECORDER READ-ONLY

echo ==================================================================
echo.
echo Le HARNESS qui va tourner est 100%% READ-ONLY:
echo - aucun write Focusrite par le recorder;
echo - aucun bouton Companion presse par le recorder.
echo TES manipulations dans Focusrite Control, elles, changent le hardware.
echo.
echo Pendant >>> REC ON <<<, parcours les Custom Mix que Focusrite Control te presente.
echo Pour chaque Custom Mix / contexte d'Output disponible que tu veux fermer:
echo   1. dans Outputs, selectionne Custom Mix quand cette option est disponible et laisse ~2 s;
echo   2. ouvre ce Custom Mix;
echo   3. parcours les tranches Hardware Inputs et Software ^(DAW^) Playback visibles;
echo   4. Mute: ON puis OFF ^(ou l inverse^), ~2 s par etat;
echo   5. Solo: ON puis OFF, ~2 s par etat;
echo   6. fader: au moins deux positions nettement differentes, ~2 s chacune;
echo   7. pan: au moins deux positions nettement differentes, ~2 s chacune;
echo   8. Stereo: change l etat lorsqu un vrai controle Stereo est presente, ~2 s par etat;
echo   9. Talkback vers le Custom Mix: change l etat uniquement si ce controle est presente et sans risque.
echo.
echo Repete le parcours pour TOUS les Custom Mix / tranches que tu veux declarer fermes.
echo Les chemins deja fermes par les REC precedents seront cumules automatiquement.
echo MAIN/ALT et les meters deja fermes n ont pas besoin d etre refaits juste pour repetition.
echo.
echo NE TOUCHE PAS pendant cette phase aux fonctions EXCLUES affichees en haut.
echo Cette phase passive ne restaure pas automatiquement TES clics Focusrite Control.
echo Apres REC OFF, tu pourras recharger manuellement ta configuration habituelle si tu le souhaites.
echo.
set "CUSTOM_CONFIRM="
set /p "CUSTOM_CONFIRM=Tape CUSTOM_MIX_READY puis Entree pour lancer le recorder : "
if /I not "!CUSTOM_CONFIRM!"=="CUSTOM_MIX_READY" (
    echo ANNULE - aucune nouvelle capture Custom Mix.
    pause
    exit /b 1
)

if exist "testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json" (
    copy /y "testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json" "testbench\results\FINAL_PREVIOUS_MANUAL_FEEDBACK_SWEEP.json" >nul
) else (
    if exist "testbench\results\FINAL_PREVIOUS_MANUAL_FEEDBACK_SWEEP.json" del /q "testbench\results\FINAL_PREVIOUS_MANUAL_FEEDBACK_SWEEP.json"
)

call "testbench\RUN_MANUAL_FEEDBACK_SWEEP.cmd"
set "REC_CODE=!ERRORLEVEL!"
if "!REC_CODE!"=="2" (
    echo.
    echo FINAL CUSTOM MIX RECORDER FATAL - analyse le log avant de recommencer.
    pause
    exit /b 2
)

echo.
echo ==================================================================
echo  PHASE C - BILAN CUMULATIF CUSTOM MIX

echo ==================================================================
"%NODE_EXE%" "testbench\FinalCustomMixCoverage.js"
set "COVERAGE_CODE=!ERRORLEVEL!"

echo.
echo ==================================================================
echo  RESULTATS FINAL HARDWARE AUDIT

echo ==================================================================
echo Public write smoke : testbench\results\latest-v1-release-smoke.json
echo Feedback REC       : testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json
echo Custom Mix coverage: testbench\results\FINAL_CUSTOM_MIX_COVERAGE.json
echo.
if "!REC_CODE!"=="4" (
    echo FINAL AUDIT: FEEDBACK MISMATCH DETECTE - diagnostic requis.
    pause
    exit /b 4
)
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
if "!COVERAGE_CODE!"=="5" (
    echo FINAL HARDWARE AUDIT: PARTIAL SAFE - le rapport donne les compteurs restants.
    pause
    exit /b 5
)

echo FINAL HARDWARE AUDIT: echec bilan code !COVERAGE_CODE!.
pause
exit /b !COVERAGE_CODE!
