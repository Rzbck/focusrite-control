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
title Focusrite 18i20 - WRITE PROMOTION

echo ==================================================================
echo  FOCUSRITE 18i20 - WRITE PROMOTION / PREUVE DES CONTROLES RETENUS
echo ==================================================================
echo.
echo Ce banc est RESEARCH/TestBench uniquement.
echo Il ne modifie pas la surface publique v1 et ne touche pas main.
echo.
echo Toujours exclus de ce banc :
echo   - Monitor gain 1677 ;
echo   - assign-mix ;
echo   - output_pair_source ;
echo   - Advanced Raw / inconnus ;
echo   - firmware/reset/restore/snapshot ;
echo   - Device Preset / Clock Source / Sample Rate / S/PDIF Mode.
echo.
echo Le probe utilise sa PROPRE identite Remote Device locale et persistante.
echo Si Focusrite Control affiche "Companion Write Promotion Probe", approuve CETTE entree seulement.
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

if not exist "%SCRIPT_DIR%FullTestBenchWritePromotion.js" (
    echo ERREUR : FullTestBenchWritePromotion.js introuvable.
    pause
    exit /b 3
)

:MENU
echo.
echo [1] INVENTAIRE READ-ONLY ^(ZERO write^) - A FAIRE EN PREMIER
echo [2] CUSTOM MIX - Mute/Solo/Fader/Pan/Talkback
echo [3] MIXER SLOTS - Source + Stereo, 24 slots
echo [4] ALT / Speaker Switching
echo [5] OUTPUT STEREO - QUARANTINED apres HARD ABORT ^(aucun write^)
echo [6] TOUT NON-DISRUPTIF - QUARANTINED ^(broad rerun bloque^)
echo [Q] Quitter
echo.
set "CHOICE="
set /p "CHOICE=Choix [1] : "
if not defined CHOICE set "CHOICE=1"
if /I "!CHOICE!"=="Q" exit /b 0

if "!CHOICE!"=="5" (
    echo.
    echo OUTPUT STEREO EST QUARANTINED apres le HARD ABORT collateral du 27/08/2026.
    echo Aucun write Output Stereo ne sera lance depuis ce launcher.
    echo La famille reste WITHHELD tant qu'un nouvel oracle pair-aware n'est pas prouve.
    pause
    goto :MENU
)

if "!CHOICE!"=="6" (
    echo.
    echo TOUT NON-DISRUPTIF EST BLOQUE : les campagnes deja closes ne sont pas rejouees par repetition.
    echo Utilise uniquement un mode cible explicitement demande apres revue des preuves.
    pause
    goto :MENU
)

if "!CHOICE!"=="1" (
    "%NODE_EXE%" "%SCRIPT_DIR%FullTestBenchWritePromotion.js" --mode=inventory
    set "CODE=!ERRORLEVEL!"
    echo.
    echo INVENTAIRE termine code !CODE!.
    echo Resultat local : testbench\results\latest-write-promotion.json
    pause
    goto :MENU
)

set "MODE="
if "!CHOICE!"=="2" set "MODE=custom-mix"
if "!CHOICE!"=="3" set "MODE=mixer-slots"
if "!CHOICE!"=="4" set "MODE=alt"
if "!CHOICE!"=="5" set "MODE=output-stereo"
if "!CHOICE!"=="6" set "MODE=all-nondisruptive"
if not defined MODE (
    echo Choix invalide.
    goto :MENU
)

echo.
echo ==================================================================
echo  WRITE MODE : !MODE!
echo ==================================================================
echo IMPORTANT :
echo   - baisse le bouton PHYSIQUE Monitor ;
echo   - coupe/mute les enceintes actives ;
echo   - baisse ou retire le casque ;
echo   - ne fais pas ce test pendant un live/enregistrement important ;
echo   - ne touche PAS Focusrite Control pendant la phase automatique ;
echo   - chaque cible inconnue est SKIP, jamais inventee ;
echo   - tout restore non confirme ou drift collateral = HARD ABORT.
echo.
set "CONFIRM="
set /p "CONFIRM=Tape ALL_AUDIO_ISOLATED puis Entree : "
if /I not "!CONFIRM!"=="ALL_AUDIO_ISOLATED" (
    echo ANNULE - aucun write lance.
    pause
    goto :MENU
)

echo.
"%NODE_EXE%" "%SCRIPT_DIR%FullTestBenchWritePromotion.js" --mode=!MODE! --allow-hardware-writes --confirm-audio-isolated
set "CODE=!ERRORLEVEL!"
echo.
echo Resultat local : testbench\results\latest-write-promotion.json
echo Code sortie    : !CODE!
echo.
if "!CODE!"=="0" echo PASS COMPLET pour les cibles materialisees de ce mode.
if "!CODE!"=="5" echo PARTIAL SAFE : certaines baselines/availabilities restent inconnues ou indisponibles.
if "!CODE!"=="4" echo HARD ABORT : restauration/collateral a diagnostiquer AVANT toute suite.
if "!CODE!"=="2" echo FAIL : au moins une transition n'a pas ete confirmee.
pause
goto :MENU
