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
echo contient exactement le harness V8 attendu.
echo Si Page 2 est un ancien harness Focusrite TestBench reconnu, ce launcher
echo reutilise le chemin PAGE2_AUTO V8 deja existant pour generer/importer la
echo page courante, reaudit les pages/connexions, refait le preflight puis reprend.
echo Une page utilisateur/inconnue n'est jamais remplacee automatiquement.
echo.
echo Le runner hardware refait ensuite la meme garde : une derive entre les deux
echo checks ressort PREP_REQUIRED, jamais un faux echec de restauration.
echo.
echo Pendant la campagne cible, Page 2 est remplacee temporairement par le harness
echo Mix puis la capability-lab courante est restauree et auditee avant la fin.
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
"%NODE_EXE%" --check "%~dp0MixFeedbackClosureRunner.js"
if errorlevel 1 (
    echo FAIL - syntaxe MixFeedbackClosureRunner.js.
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
"%NODE_EXE%" --check "%~dp0FullTestBenchCompanionImportV7.js"
if errorlevel 1 (
    echo FAIL - syntaxe FullTestBenchCompanionImportV7.js.
    echo AUCUN preflight/write hardware n'a ete lance.
    pause
    exit /b 2
)
"%NODE_EXE%" --test "%~dp0..\test\mix-feedback-closure.test.js" "%~dp0..\test\mix-feedback-preparation.test.js" "%~dp0..\test\full-testbench-v6-device-wide.test.js" "%~dp0..\test\full-testbench-v7-resume-autopage.test.js"
if errorlevel 1 (
    echo FAIL - contrat Mix feedback / preparation Page 2 / PAGE2_AUTO / regle anti-derive.
    echo AUCUN preflight/write hardware n'a ete lance.
    pause
    exit /b 2
)
echo PASS - syntaxe + contrat Mix feedback + preparation Page 2 + PAGE2_AUTO + regle anti-derive.
echo.

echo ==================================================================
echo  [1/3] PREFLIGHT READ-ONLY - CONNEXION / REMOTE DEVICES
echo ==================================================================
call :RUN_PREFLIGHT
if not "!PREFLIGHT_CODE!"=="0" (
    pause
    exit /b !PREFLIGHT_CODE!
)

echo.
echo ==================================================================
echo  [2/3] PREPARATION PAGE 2 READ-ONLY - ZERO WRITE / ZERO MUTATION
echo ==================================================================
call :RUN_PREP_CHECK

if "!PREP_CODE!"=="10" (
    echo.
    echo ==================================================================
    echo  PAGE 2 TESTBENCH OBSOLETE - CHEMIN PAGE2_AUTO EXISTANT
    echo ==================================================================
    echo Le check a confirme que Page 2 est un ancien harness Focusrite TestBench.
    echo Le harness V8 courant est deja genere localement.
    echo PAGE2_AUTO reutilise FullTestBenchCompanionImportV7.js :
    echo - remplace uniquement Page 2 ;
    echo - conserve Page 1 r9 ;
    echo - remappe vers la connexion Focusrite EXISTANTE ;
    echo - reaudit Page 2, les autres pages et les connexions ;
    echo - n'appuie sur aucun bouton Focusrite et n'envoie aucun write hardware.
    echo.
    set "PAGE2_CONFIRM="
    set /p "PAGE2_CONFIRM=Tape PAGE2_AUTO puis Entree pour remettre le harness V8 courant sur Page 2 : "
    if /I not "!PAGE2_CONFIRM!"=="PAGE2_AUTO" (
        echo.
        echo PREP reste en attente - aucun write hardware lance.
        pause
        exit /b 9
    )

    "%NODE_EXE%" "%~dp0FullTestBenchCompanionImportV7.js" --replace-page-2
    set "PAGE2_CODE=!ERRORLEVEL!"
    if not "!PAGE2_CODE!"=="0" (
        echo.
        echo PAGE2_AUTO BLOQUE - aucun test hardware n'est lance.
        echo Code !PAGE2_CODE! : l'import/audit existant n'a pas confirme la preparation.
        pause
        exit /b 7
    )

    echo.
    echo PAGE2_AUTO PASS - nouveau preflight read-only obligatoire.
    call :RUN_PREFLIGHT
    if not "!PREFLIGHT_CODE!"=="0" (
        pause
        exit /b !PREFLIGHT_CODE!
    )

    echo.
    echo Verification finale du harness V8 apres PAGE2_AUTO...
    call :RUN_PREP_CHECK
    if not "!PREP_CODE!"=="0" (
        echo.
        echo PREP AUTO BLOQUE - Page 2 n'est toujours pas le harness exact attendu.
        echo Aucun cycle automatique supplementaire ne sera tente.
        pause
        exit /b !PREP_CODE!
    )
)

if "!PREP_CODE!"=="9" (
    echo.
    echo PREP_REQUIRED - la campagne hardware NE DEMARRE PAS.
    echo Page 2 n'est pas eligible au PAGE2_AUTO existant ou une autre preparation est requise.
    echo Hardware writes: 0.
    echo Companion Page 2 mutations par cette passe: 0.
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
"%NODE_EXE%" "%~dp0MixFeedbackClosureRunner.js" --allow-mix-feedback-writes --confirm-all-output-routing-isolated
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

:RUN_PREFLIGHT
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Focusrite_18i20_Preflight.ps1"
set "PREFLIGHT_CODE=!ERRORLEVEL!"
if not "!PREFLIGHT_CODE!"=="0" (
    echo.
    echo PREFLIGHT BLOQUE - AUCUN write Mix feedback ne sera lance.
    echo Approuve la connexion Companion Scarlett 18i20 EXISTANTE puis relance.
)
exit /b !PREFLIGHT_CODE!

:RUN_PREP_CHECK
"%NODE_EXE%" "%~dp0MixFeedbackPreparationCheck.js"
set "PREP_CODE=!ERRORLEVEL!"
exit /b !PREP_CODE!
