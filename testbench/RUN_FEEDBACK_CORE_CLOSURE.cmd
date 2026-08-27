@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Focusrite 18i20 - Targeted Core Feedback Closure

echo ==================================================================
echo  FOCUSRITE 18i20 - TARGETED CORE FEEDBACK CLOSURE

echo ==================================================================
echo.
echo Ce test NE RELANCE PAS FULL.
echo Il ferme uniquement les feedbacks encore ouverts du Core reversible :
echo - Air 1-8 ;
echo - Pad 1-8 ;
echo - Monitor Mute ;
echo - Monitor Dim.
echo.
echo Chaque cible exige une baseline serveur connue AVANT le write.
echo Baseline inconnue = SKIP sans write.
echo Le feedback r9 est verifie a la baseline, a l'etat oppose et apres restore.
echo Toute restauration non confirmee = HARD ABORT immediat.
echo.
echo Le chemin de controle reste :
echo TestBench ^> Companion ^> connexion Companion Scarlett 18i20 existante
echo ^> Focusrite Control Server ^> Scarlett.
echo Aucun client TCP direct supplementaire n'est cree.
echo.
echo AVANT DE CONTINUER :
echo - Focusrite Control ^> Device Settings ^> Remote Devices :
echo   Companion Scarlett 18i20 doit etre APPROUVE ;
echo - ne supprime/recree pas cette connexion ;
echo - aucun probe direct ne doit tourner en parallele ;
echo - baisse le bouton PHYSIQUE Monitor ;
echo - coupe/mute les enceintes actives si possible ;
echo - baisse le casque ou retire-le ;
echo - ne lance pas pendant un live ou un enregistrement critique.
echo.

set "NODE_EXE="
if exist "%~dp0..\.build-tools\node22\node.exe" set "NODE_EXE=%~dp0..\.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)
if not defined NODE_EXE (
    echo ERREUR : Node.js est introuvable.
    echo Utilise le worktree local deja valide avec Node 22.23.2.
    pause
    exit /b 1
)

echo ==================================================================
echo  [0/2] AUTOCONTROLE LOGICIEL CIBLE - AUCUN HARDWARE

echo ==================================================================
"%NODE_EXE%" --check "%~dp0FeedbackCoreClosure.js"
if errorlevel 1 (
    echo ECHEC SYNTAXE - AUCUN preflight/hardware lance.
    pause
    exit /b 10
)
"%NODE_EXE%" --test "%~dp0..\test\feedback-core-closure.test.js" "%~dp0..\test\full-testbench-v6-device-wide.test.js"
if errorlevel 1 (
    echo ECHEC TEST CIBLE - AUCUN preflight/hardware lance.
    pause
    exit /b 11
)
echo PASS - syntaxe + contrat feedback + regle anti-derive.
echo.

where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo ERREUR : PowerShell est introuvable; preflight impossible.
    echo AUCUN write hardware n'a ete lance.
    pause
    exit /b 3
)

echo ==================================================================
echo  [1/2] PREFLIGHT READ-ONLY - CONNEXION / REMOTE DEVICES

echo ==================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Focusrite_18i20_Preflight.ps1"
set "PREFLIGHT_CODE=!ERRORLEVEL!"
if not "!PREFLIGHT_CODE!"=="0" (
    echo.
    echo PREFLIGHT BLOQUE - AUCUN write feedback ne sera lance.
    echo Approuve la connexion Companion Scarlett 18i20 EXISTANTE puis relance.
    pause
    exit /b !PREFLIGHT_CODE!
)

echo.
set "CONFIRM_SCOPE="
set /p "CONFIRM_SCOPE=Tape FEEDBACK_CORE puis Entree pour confirmer ce lot cible : "
if /I not "!CONFIRM_SCOPE!"=="FEEDBACK_CORE" (
    echo ANNULE - aucun write hardware lance.
    pause
    exit /b 1
)

echo.
echo En tapant ALL_ISOLATED tu confirmes que sorties/monitoring sont a un niveau sur,
echo qu'aucun live/enregistrement critique n'est en cours et que les changements
echo Air/Pad/Mute/Dim temporaires peuvent etre effectues puis restaures exactement.
set "CONFIRM_ISOLATION="
set /p "CONFIRM_ISOLATION=Tape ALL_ISOLATED puis Entree : "
if /I not "!CONFIRM_ISOLATION!"=="ALL_ISOLATED" (
    echo ANNULE - aucun write hardware lance.
    pause
    exit /b 1
)

echo.
echo ==================================================================
echo  [2/2] HARDWARE CIBLE - 18 FEEDBACKS CORE MAXIMUM

echo ==================================================================
"%NODE_EXE%" "%~dp0FeedbackCoreClosure.js" --allow-hardware-writes --confirm-feedback-core-isolated
set "EXITCODE=!ERRORLEVEL!"

echo.
echo ==================================================================
if "!EXITCODE!"=="0" (
    echo FEEDBACK CORE TERMINE SANS FAIL / RESTORE QUARANTINE.
) else if "!EXITCODE!"=="4" (
    echo HARD ABORT : restauration non confirmee. NE RELANCE PAS avant diagnostic.
) else (
    echo FEEDBACK CORE TERMINE AVEC CODE !EXITCODE! - diagnostic du resultat requis.
)
echo ==================================================================
echo Aucun package Companion n'a ete construit ou installe par ce launcher.
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b !EXITCODE!
