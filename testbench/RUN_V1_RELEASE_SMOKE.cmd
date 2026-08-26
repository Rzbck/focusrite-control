@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Focusrite 18i20 - V1 Release Smoke

echo ==================================================================
echo  FOCUSRITE 18i20 - V1 RELEASE SMOKE 0.1.20

echo ==================================================================
echo.
echo Ce test final ne couvre QUE la surface d'ecriture publique retenue pour v1.
echo Il lance d'abord le SAFE Core existant, puis les actions release restantes.
echo Chaque write utilise un etat serveur connu et une restauration exacte.
echo Un etat initial inconnu est SKIP/NOT-RUNNABLE: aucun write n'est invente.
echo Toute restauration non confirmee provoque un HARD ABORT immediat.
echo.
echo JAMAIS TESTE / JAMAIS ECRIT ICI:
echo - Monitor gain item 1677;
echo - ALT / Speaker Switching writes;
echo - Output Stereo write;
echo - Custom Mix / Mixer Slot writes;
echo - Device Preset / Clock Source / Sample Rate / Digital I/O mode;
echo - Advanced Raw;
echo - firmware/reset/restore/snapshot;
echo - faux input gain/mute/phantom par canal/Mic Kill.
echo.
echo AVANT DE CONTINUER:
echo - importe focusrite-scarlett-18i20-0.1.20.tgz dans Companion si 0.1.20 n'est pas deja charge;
echo - garde la connexion Companion Focusrite existante;
echo - Focusrite Control ^> Device Settings ^> Remote Devices: Companion Scarlett 18i20 APPROUVE;
echo - restaure ta configuration Focusrite normale avant le test;
echo - deconnecte ou mute/isole en aval TOUTES les sorties physiques susceptibles de porter de l'audio;
echo - baisse le bouton PHYSIQUE Monitor et le niveau casque;
echo - ne lance pas pendant un live ou un enregistrement critique.
echo.

set "NODE_EXE="
if exist "%~dp0..\.build-tools\node22\node.exe" set "NODE_EXE=%~dp0..\.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)
if not defined NODE_EXE (
    echo ERREUR : Node.js introuvable. Lance UPDATE_AND_RUN.bat d'abord.
    pause
    exit /b 1
)

where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo ERREUR : PowerShell introuvable. AUCUN write hardware lance.
    pause
    exit /b 3
)

echo ==================================================================
echo  PREFLIGHT READ-ONLY - REMOTE DEVICES / CONNEXION

echo ==================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Focusrite_18i20_Preflight.ps1"
if errorlevel 1 (
    echo.
    echo PREFLIGHT BLOQUE - AUCUN write hardware lance.
    pause
    exit /b 3
)

echo.
echo ==================================================================
echo  PREPARATION PAGE 2 RELEASE - READ-ONLY HARDWARE

echo ==================================================================
echo Page 1 r9 reste intacte.
echo Page 2 est remplacee automatiquement UNIQUEMENT si elle est deja un TestBench Focusrite verifie.
echo Aucun bouton n'est presse et aucun write Focusrite n'est envoye pendant cette preparation.
"%NODE_EXE%" "%~dp0FullTestBenchV1ReleaseV2.js" --prepare-only
set "PREP_CODE=!ERRORLEVEL!"
if not "!PREP_CODE!"=="0" (
    echo.
    echo PREPARATION BLOQUEE - AUCUN write hardware lance.
    pause
    exit /b !PREP_CODE!
)

set "RELEASE_CONFIRM="
set /p "RELEASE_CONFIRM=Tape V1_RELEASE puis Entree pour continuer : "
if /I not "!RELEASE_CONFIRM!"=="V1_RELEASE" (
    echo ANNULE - aucun write hardware lance.
    pause
    exit /b 1
)

set "ISOLATION_CONFIRM="
set /p "ISOLATION_CONFIRM=Tape ALL_ISOLATED puis Entree pour confirmer l'isolation audio : "
if /I not "!ISOLATION_CONFIRM!"=="ALL_ISOLATED" (
    echo ANNULE - aucun write hardware lance.
    pause
    exit /b 1
)

echo.
echo ==================================================================
echo  PHASE 1/2 - SAFE CORE 21 CONTROLES

echo ==================================================================
"%NODE_EXE%" "%~dp0Focusrite_18i20_SafeHardwareTest.js" --allow-hardware-writes
set "SAFE_CODE=!ERRORLEVEL!"
if not "!SAFE_CODE!"=="0" (
    echo.
    echo V1 RELEASE BLOQUE - SAFE CORE a echoue ^(code !SAFE_CODE!^).
    echo Aucun test release supplementaire ne sera lance.
    pause
    exit /b !SAFE_CODE!
)

echo.
echo ==================================================================
echo  PHASE 2/2 - SURFACE PUBLIQUE V1 RESTANTE

echo ==================================================================
"%NODE_EXE%" "%~dp0FullTestBenchV1ReleaseV2.js" --allow-hardware-writes --confirm-all-output-routing-isolated
set "RELEASE_CODE=!ERRORLEVEL!"

echo.
if "!RELEASE_CODE!"=="0" (
    echo ==================================================================
    echo  V1 RELEASE SMOKE FULL LIVE COVERAGE PASS
    echo ==================================================================
) else if "!RELEASE_CODE!"=="5" (
    echo ==================================================================
    echo  V1 RELEASE SMOKE PASS - COUVERTURE LIVE PARTIELLE / SKIPS SURS
    echo ==================================================================
    echo Aucun FAIL fonctionnel ni echec de restauration.
    echo Les actions non-runnable restent NON PROUVEES PAR CE RUN et conservent leur evidence anterieure.
) else if "!RELEASE_CODE!"=="4" (
    echo ==================================================================
    echo  HARD ABORT - RESTAURATION EXACTE NON CONFIRMEE
    echo ==================================================================
    echo Ne relance pas avant diagnostic du resultat local.
) else (
    echo ==================================================================
    echo  V1 RELEASE SMOKE FAIL - DIAGNOSTIC REQUIS
    echo ==================================================================
)
echo.
echo Resultat local: testbench\results\latest-v1-release-smoke.json
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b !RELEASE_CODE!
