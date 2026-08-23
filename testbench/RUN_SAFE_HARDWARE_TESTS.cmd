@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Focusrite TestBench - SAFE / FULL

echo ==================================================================
echo  FOCUSRITE TESTBENCH - SAFE / FULL
echo ==================================================================
echo.
echo La page r9 FULL MATRIX existante reste la base du banc de test 18i20.
echo Le moteur FULL est capability/profile-driven; les writes restent bloques
echo pour tout modele sans profil hardware explicitement valide.
echo.
echo   SAFE = Core 21 controles, restauration stricte de l'etat connu.
echo   FULL = campagne complete : 829 feedbacks + Core + entrees + sorties
echo          + TOUTES les paires applicables + mixer slots + 12 lanes x 24
echo          strips + monitoring/settings + phase manuelle guidee.
echo.
echo FULL V7 observe la topologie de chaque paire AVAILABLE puis utilise le
echo resultat runtime pour eviter les writes directs sur les membres pair-owned.
echo Mute reste une capacite testee mais n'est plus l'oracle d'ownership.
echo Les availability UNKNOWN ne recoivent aucun write.
echo.
echo ALL_ISOLATED et la securite serveur sont deux gardes distincts :
echo - la securite serveur reste reportee telle quelle ;
echo - ALL_ISOLATED autorise les tests reversibles meme si un garde serveur

echo   global manque, avec restauration exacte locale obligatoire ;
echo - toute restauration non confirmee provoque un HARD ABORT immediat.
echo.
echo La phase manuelle meters utilise maintenant deux phases explicites :
echo - SILENT : capture stable au silence ;
echo - SIGNAL : capture stable avec signal reel sur les chemins disponibles.
echo Les chemins non exerces restent MANUAL_PENDING.
echo.
echo Le bouton Monitor 1677 reste une observation physique READ-ONLY.
echo Aucun write Monitor gain n'existe.
echo.
echo Les fonctions vraiment disruptives restent EXCLUES du FULL:
echo device preset, clock source, sample rate et S/PDIF mode.
echo.
echo TOUJOURS INTERDIT:
echo - write Monitor gain item 1677;
echo - Advanced Raw comme raccourci de test;
echo - firmware/reset/restore/snapshot;
echo - faux gain preamp / input mute / phantom par canal / Mic Kill.
echo.
echo AVANT DE CONTINUER:
echo - restaure ta configuration Focusrite normale/sauvegardee ;
echo - ouvre Focusrite Control ^> Device Settings ^> Remote Devices ;
echo - le client Companion Scarlett 18i20 doit etre APPROUVE ;
echo - reutilise la connexion Companion existante, ne la supprime/recree pas ;
echo - ne lance aucun ancien Focusrite ReadOnly State Probe en parallele ;
echo - baisse le bouton PHYSIQUE Monitor;
echo - coupe/mute les enceintes actives si possible;
echo - baisse le volume casque ou retire le casque;
echo - ne lance pas pendant un live ou un enregistrement critique.
echo.
set "MODE="
set /p "MODE=Tape SAFE ou FULL puis Entree : "
if /I not "%MODE%"=="SAFE" if /I not "%MODE%"=="FULL" (
    echo.
    echo ANNULE - aucun test hardware lance.
    pause
    exit /b 1
)

set "NODE_EXE="
if exist "%~dp0..\.build-tools\node22\node.exe" set "NODE_EXE=%~dp0..\.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)
if not defined NODE_EXE (
    echo ERREUR : Node.js est introuvable.
    echo Lance d'abord UPDATE_AND_RUN.bat a la racine du depot.
    pause
    exit /b 1
)

where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERREUR : PowerShell est introuvable; le preflight Remote Devices ne peut pas etre execute.
    echo AUCUN write hardware n'a ete lance.
    pause
    exit /b 3
)

echo.
echo ==================================================================
echo  PREFLIGHT READ-ONLY OBLIGATOIRE - REMOTE DEVICES / CONNEXION
necho ==================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Focusrite_18i20_Preflight.ps1"
set "PREFLIGHT_CODE=%ERRORLEVEL%"
if not "%PREFLIGHT_CODE%"=="0" (
    echo.
    echo PREFLIGHT BLOQUE - AUCUN write SAFE/FULL ne sera lance.
    echo Verifie Focusrite Control ^> Device Settings ^> Remote Devices,
    echo approuve Companion Scarlett 18i20, puis relance CE MEME CMD.
    echo Ne recree pas la connexion Companion et n'approuve pas les anciens probes read-only.
    pause
    exit /b %PREFLIGHT_CODE%
)

echo.
echo PREFLIGHT PASS - le client Companion existant est autorise.
echo.
if /I "%MODE%"=="SAFE" (
    "%NODE_EXE%" "%~dp0Focusrite_18i20_SafeHardwareTest.js" --allow-hardware-writes
) else (
    echo FULL V7 va tester temporairement la topologie et les familles reversibles
    echo puis verifier la restauration exacte apres CHAQUE cible/famille.
    echo.
    echo En tapant ALL_ISOLATED tu confirmes explicitement que :
    echo - la configuration normale/sauvegardee est restauree avant le test ;
    echo - toutes les sorties physiques susceptibles de porter de l'audio sont
    echo   deconnectees ou mutees/isolees en aval pendant les probes ;
    echo - casque/monitoring sont a un niveau sur ;
    echo - tu autorises ces changements temporaires et la phase manuelle guidee.
    echo.
    set "FULL_CONFIRM="
    set /p "FULL_CONFIRM=Tape ALL_ISOLATED puis Entree pour autoriser FULL V7 : "
    if /I not "!FULL_CONFIRM!"=="ALL_ISOLATED" (
        echo.
        echo ANNULE - aucun write FULL lance.
        pause
        exit /b 1
    )
    "%NODE_EXE%" "%~dp0Focusrite_18i20_FullTestBench.js" --allow-hardware-writes --confirm-all-output-routing-isolated --manual-feedback
)
set "EXITCODE=%ERRORLEVEL%"

if /I "%MODE%"=="FULL" (
    echo.
    echo [AUTO] Privacy gate + publication du dernier rapport FULL termine...
    "%NODE_EXE%" "%~dp0PublishLatestShareable.js"
    if errorlevel 1 (
        echo ATTENTION : le rapport shareable n'a pas ete publie automatiquement.
        echo Le resultat hardware reste conserve localement; aucun force-push n'est utilise.
    )
)

echo.
echo Exit code: %EXITCODE%
if "%EXITCODE%"=="0" (
    echo TESTBENCH %MODE% TERMINE SANS FAIL.
) else if "%EXITCODE%"=="6" (
    echo PREPARATION REQUISE - AUCUN WRITE HARDWARE SUR CETTE PASSE.
    echo Lis l'instruction PREP REQUIRED affichee ci-dessus puis relance CE MEME CMD.
) else if "%EXITCODE%"=="4" (
    echo HARD ABORT : restauration/securite non confirmee. Ne relance pas avant diagnostic.
) else (
    echo TESTBENCH %MODE% TERMINE AVEC FAIL.
)
echo.
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b %EXITCODE%
