@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Focusrite 18i20 - Mix Mute Solo Feedback Closure

echo ==================================================================
echo  FOCUSRITE 18i20 - MIX MUTE/SOLO FEEDBACK CLOSURE
echo ==================================================================
echo.
echo Ce test NE RELANCE PAS FULL.
echo Il utilise uniquement le slot Playback deja present et detecte au runtime.
echo Il teste seulement les feedbacks mix_mute / mix_solo des lanes dont la
echo baseline gain/mute/solo est deja entierement connue cote serveur.
echo.
echo Baseline inconnue = SKIP sans write.
echo Aucun gain n'est modifie par cette campagne.
echo Aucun Output Source, Mixer Slot Source/Stereo ou routing de sortie n'est modifie.
echo Chaque changement mute/solo est restaure exactement avant la cible suivante.
echo Restore hardware non confirme = HARD ABORT immediat.
echo.
echo AVANT toute confirmation hardware, un check READ-ONLY verifie que la Page 2
echo contient exactement le harness V8 attendu. Si elle est absente/obsolete,
echo le launcher sort PREP_REQUIRED sans write et sans mutation de Page 2.
echo.
echo La Page 2 peut ensuite etre remplacee temporairement par un harness cible puis la page
echo capability-lab d'origine est restauree et auditee avant la fin.
echo Page 1 r9 et la connexion Focusrite existante sont preservees.
echo Aucun client TCP direct supplementaire n'est cree.
echo Aucun package Companion n'est construit ou installe.
echo.
echo AVANT DE CONTINUER :
echo - Focusrite Control ^> Device Settings ^> Remote Devices :
echo   Companion Scarlett 18i20 doit etre APPROUVE ;
echo - garde cette connexion existante ;
echo - aucun probe direct en parallele ;
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
    echo AUCUN write hardware n'a ete lance.
    pause
    exit /b 1
)

where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo ERREUR : PowerShell est introuvable; preflight impossible.
    echo AUCUN write hardware n'a ete lance.
    pause
    exit /b 3
)

echo ==================================================================
echo  [0/3] AUTOCONTROLE LOGICIEL CIBLE - AUCUN HARDWARE
echo ==================================================================
"%NODE_EXE%" --check "%~dp0MixFeedbackClosure.js"
if errorlevel 1 (
    echo FAIL - syntaxe MixFeedbackClosure.js.
    echo AUCUN preflight/write hardware n'a ete lance.
    pause
    exit /b 2
)
"%NODE_EXE%" --check "%~dp0MixFeedbackPreparationCheck.js"
if errorlevel 1 (
    echo FAIL - syntaxe MixFeedbackPreparationCheck.js.
    echo AUCUN preflight/write hardware n'a ete lance.
    pause
    exit /b 2
)
"%NODE_EXE%" --test "%~dp0..\test\mix-feedback-closure.test.js" "%~dp0..\test\mix-feedback-preparation.test.js" "%~dp0..\test\full-testbench-v6-device-wide.test.js"
if errorlevel 1 (
    echo FAIL - contrat Mix feedback / preparation Page 2 / regle anti-derive.
    echo AUCUN preflight/write hardware n'a ete lance.
    pause
    exit /b 2
)
echo PASS - syntaxe + contrat Mix feedback + preparation Page 2 + regle anti-derive.
echo.

echo ==================================================================
echo  [1/3] PREFLIGHT READ-ONLY - CONNEXION / REMOTE DEVICES
echo ==================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Focusrite_18i20_Preflight.ps1"
set "PREFLIGHT_CODE=!ERRORLEVEL!"
if not "!PREFLIGHT_CODE!"=="0" (
    echo.
    echo PREFLIGHT BLOQUE - AUCUN write Mix feedback ne sera lance.
    echo Approuve la connexion Companion Scarlett 18i20 EXISTANTE puis relance.
    pause
    exit /b !PREFLIGHT_CODE!
)

echo.
echo ==================================================================
echo  [2/3] PREPARATION PAGE 2 READ-ONLY - ZERO WRITE / ZERO MUTATION
echo ==================================================================
"%NODE_EXE%" "%~dp0MixFeedbackPreparationCheck.js"
set "PREP_CODE=!ERRORLEVEL!"
if "!PREP_CODE!"=="9" (
    echo.
    echo PREP_REQUIRED - la campagne hardware NE DEMARRE PAS.
    echo Hardware writes: 0.
    echo Companion Page 2 mutations: 0.
    echo Aucune restauration hardware/Page 2 n'est requise par ce check.
    echo Ne relance pas en boucle : utilise le diagnostic Page 2 affiche ci-dessus.
    pause
    exit /b 9
)
if not "!PREP_CODE!"=="0" (
    echo.
    echo PREPARATION READ-ONLY EN ECHEC - AUCUN write hardware ne sera lance.
    echo Code !PREP_CODE! : diagnostic requis avant la campagne Mix feedback.
    pause
    exit /b !PREP_CODE!
)

echo.
set "CONFIRM_SCOPE="
set /p "CONFIRM_SCOPE=Tape MIX_FEEDBACK puis Entree pour confirmer ce lot cible : "
if /I not "!CONFIRM_SCOPE!"=="MIX_FEEDBACK" (
    echo ANNULE - aucun write hardware lance.
    pause
    exit /b 1
)

echo.
echo En tapant ALL_ISOLATED tu confirmes que les sorties/monitoring sont a un niveau sur,
echo qu'aucun live/enregistrement critique n'est en cours et que les changements
echo mute/solo internes temporaires peuvent etre effectues puis restaures exactement.
echo Aucun signal de test particulier n'est requis pour cette campagne feedback.
set "CONFIRM_ISOLATION="
set /p "CONFIRM_ISOLATION=Tape ALL_ISOLATED puis Entree : "
if /I not "!CONFIRM_ISOLATION!"=="ALL_ISOLATED" (
    echo ANNULE - aucun write hardware lance.
    pause
    exit /b 1
)

echo.
echo ==================================================================
echo  [3/3] HARDWARE CIBLE - MIX MUTE/SOLO BASELINE-CONNU UNIQUEMENT
echo ==================================================================
"%NODE_EXE%" "%~dp0MixFeedbackClosure.js" --allow-mix-feedback-writes --confirm-all-output-routing-isolated
set "EXITCODE=!ERRORLEVEL!"

echo.
echo ==================================================================
if "!EXITCODE!"=="0" (
    echo MIX FEEDBACK TERMINE SANS FAIL / RESTORE QUARANTINE.
) else if "!EXITCODE!"=="8" (
    echo MIX FEEDBACK NO-OP SAFE - aucune cible avec baseline exacte; aucun write utile.
) else if "!EXITCODE!"=="9" (
    echo PREP_REQUIRED - aucun write hardware ne doit etre deduit de ce code.
) else if "!EXITCODE!"=="4" (
    echo HARD ABORT : restauration hardware non confirmee. NE RELANCE PAS avant diagnostic.
) else if "!EXITCODE!"=="6" (
    echo HARDWARE RESTAURE MAIS PAGE 2 NON CONFIRMEE. NE LANCE AUCUNE AUTRE CAMPAGNE avant diagnostic.
) else (
    echo MIX FEEDBACK TERMINE AVEC CODE !EXITCODE! - diagnostic du resultat requis.
)
echo ==================================================================
echo Aucun package Companion n'a ete construit ou installe par ce launcher.
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b !EXITCODE!
