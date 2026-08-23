@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Focusrite TestBench - SAFE / FULL / RESUME

echo ==================================================================
echo  FOCUSRITE TESTBENCH - SAFE / FULL / RESUME
echo ==================================================================
echo.
echo La page r9 FULL MATRIX existante reste la base du banc de test 18i20.
echo Le moteur FULL est capability/profile-driven; les writes restent bloques
echo pour tout modele sans profil hardware explicitement valide.
echo.
echo   SAFE   = Core 21 controles, restauration stricte de l'etat connu.
echo   FULL   = campagne complete depuis zero : 829 feedbacks + Core + entrees
echo            + sorties + paires + mixer + monitoring + phases manuelles.
echo   RESUME = diagnostic de developpement : refait les gardes obligatoires
echo            puis reprend pres du dernier restore en echec. JAMAIS une
echo            validation finale ni un rapport FULL publiable.
echo.
echo FULL V7 observe la topologie de chaque paire AVAILABLE puis utilise le
echo resultat runtime pour eviter les writes directs sur les membres pair-owned.
echo Les vecteurs Stereo non prouves restaurables restent EVAL_ONLY sans write.
echo Mute reste une capacite testee mais n'est plus l'oracle d'ownership.
echo Les availability UNKNOWN ne recoivent aucun write.
echo.
echo ALL_ISOLATED et la securite serveur sont deux gardes distincts :
echo - la securite serveur reste reportee telle quelle ;
echo - ALL_ISOLATED autorise les tests reversibles meme si un garde serveur

echo   global manque, avec restauration exacte locale obligatoire ;
echo - toute restauration d'un etat initial connu non confirmee provoque un

echo   HARD ABORT immediat avec variable/expected/observed dans le diagnostic.
echo.
echo La phase manuelle meters du FULL utilise deux phases explicites :
echo - SILENT : capture stable au silence ;
echo - SIGNAL : capture stable avec signal reel sur les chemins disponibles.
echo RESUME n'impose pas ces prompts manuels; le FULL final les refera.
echo.
echo Le bouton Monitor 1677 reste une observation physique READ-ONLY.
echo Aucun write Monitor gain n'existe.
echo.
echo Les fonctions vraiment disruptives restent EXCLUES du FULL/RESUME:
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
set /p "MODE=Tape SAFE, FULL ou RESUME puis Entree : "
if /I not "%MODE%"=="SAFE" if /I not "%MODE%"=="FULL" if /I not "%MODE%"=="RESUME" (
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

call :RUN_PREFLIGHT
if not "!PREFLIGHT_CODE!"=="0" (
    pause
    exit /b !PREFLIGHT_CODE!
)

if /I "%MODE%"=="SAFE" (
    "%NODE_EXE%" "%~dp0Focusrite_18i20_SafeHardwareTest.js" --allow-hardware-writes
    set "EXITCODE=!ERRORLEVEL!"
    goto :AFTER_TEST
)

if /I "%MODE%"=="RESUME" (
    echo.
    echo RESUME V7 est DIAGNOSTIC UNIQUEMENT.
    echo Il relit le dernier rapport prive local pour choisir la phase de reprise,
    echo mais refait TOUJOURS preflight, snapshot, topologie, mutes et gardes de securite.
    echo Le resultat RESUME reste meta.completed=false et ne remplace jamais un FULL.
)

echo.
echo %MODE% V7 va tester temporairement la topologie et les familles reversibles
echo puis verifier la restauration exacte apres CHAQUE cible/famille ecrite.
echo.
echo En tapant ALL_ISOLATED tu confirmes explicitement que :
echo - la configuration normale/sauvegardee est restauree avant le test ;
echo - toutes les sorties physiques susceptibles de porter de l'audio sont
echo   deconnectees ou mutees/isolees en aval pendant les probes ;
echo - casque/monitoring sont a un niveau sur ;
echo - tu autorises ces changements temporaires.
echo.
set "FULL_CONFIRM="
set /p "FULL_CONFIRM=Tape ALL_ISOLATED puis Entree pour autoriser %MODE% V7 : "
if /I not "!FULL_CONFIRM!"=="ALL_ISOLATED" (
    echo.
    echo ANNULE - aucun write %MODE% lance.
    pause
    exit /b 1
)

call :RUN_V7
set "EXITCODE=!ERRORLEVEL!"

if "!EXITCODE!"=="6" (
    echo.
    echo ==================================================================
    echo  PAGE 2 OBSOLETE - REMPLACEMENT AUTOMATIQUE OPTIONNEL
    echo ==================================================================
    echo Le harness prive vient d'etre genere sans write hardware.
    echo Le mode auto utilise le chemin officiel d'import de page Companion :
    echo - remplace UNIQUEMENT Page 2 ;
    echo - conserve Page 1 r9 ;
    echo - remappe vers la connexion Focusrite EXISTANTE ;
    echo - refuse toute creation/recreation de connexion ;
    echo - reaudit Page 2 et les connexions avant de reprendre ;
    echo - n'appuie sur aucun bouton et n'envoie aucun write Focusrite.
    echo.
    set "PAGE2_CONFIRM="
    set /p "PAGE2_CONFIRM=Tape PAGE2_AUTO puis Entree pour remplacer Page 2 automatiquement, ou autre chose pour rester en manuel : "
    if /I "!PAGE2_CONFIRM!"=="PAGE2_AUTO" (
        "%NODE_EXE%" "%~dp0FullTestBenchCompanionImportV7.js" --replace-page-2
        set "PAGE2_CODE=!ERRORLEVEL!"
        if not "!PAGE2_CODE!"=="0" (
            echo.
            echo PAGE 2 AUTO BLOQUE - aucun nouveau test hardware n'est lance.
            echo Le remplacement automatique a echoue ou son audit n'est pas certain.
            set "EXITCODE=7"
            goto :AFTER_TEST
        )

        echo.
        echo Page 2 remplacee/auditee. Nouveau preflight read-only obligatoire avant reprise.
        call :RUN_PREFLIGHT
        if not "!PREFLIGHT_CODE!"=="0" (
            set "EXITCODE=!PREFLIGHT_CODE!"
            goto :AFTER_TEST
        )

        echo.
        echo PREP AUTO PASS - relance unique de %MODE% V7 avec le meme ALL_ISOLATED.
        call :RUN_V7
        set "EXITCODE=!ERRORLEVEL!"
        if "!EXITCODE!"=="6" (
            echo.
            echo PREP AUTO BLOQUE - le snapshot/harness a encore change apres l'import.
            echo Aucun cycle automatique supplementaire ne sera tente. Diagnostic requis.
        )
    ) else (
        echo.
        echo PREP reste manuel - aucun write hardware n'a ete lance sur cette passe.
    )
)

:AFTER_TEST
if /I "%MODE%"=="FULL" (
    echo.
    echo [AUTO] Privacy gate + publication du dernier rapport FULL termine...
    "%NODE_EXE%" "%~dp0PublishLatestShareable.js"
    if errorlevel 1 (
        echo ATTENTION : le rapport shareable n'a pas ete publie automatiquement.
        echo Le resultat hardware reste conserve localement; aucun force-push n'est utilise.
    )
) else if /I "%MODE%"=="RESUME" (
    echo.
    echo [DIAG] Aucun publisher n'est lance pour RESUME.
    echo Un RESUME reste volontairement non-publiable meme s'il termine sans erreur.
)

echo.
echo Exit code: %EXITCODE%
if "%EXITCODE%"=="0" (
    if /I "%MODE%"=="RESUME" (
        echo TESTBENCH RESUME TERMINE SANS FAIL - DIAGNOSTIC UNIQUEMENT.
        echo Un FULL depuis zero reste obligatoire pour la validation finale.
    ) else (
        echo TESTBENCH %MODE% TERMINE SANS FAIL.
    )
) else if "%EXITCODE%"=="6" (
    echo PREPARATION REQUISE - AUCUN WRITE HARDWARE SUR CETTE PASSE DE PREP.
    echo Utilise PAGE2_AUTO si propose, sinon suis l'instruction PREP REQUIRED puis relance.
) else if "%EXITCODE%"=="4" (
    echo HARD ABORT : restauration/securite non confirmee. Ne relance pas avant diagnostic.
) else if "%EXITCODE%"=="7" (
    echo PAGE 2 AUTO/AUDIT BLOQUE - aucun nouveau test hardware ne doit etre lance.
) else (
    echo TESTBENCH %MODE% TERMINE AVEC FAIL.
)
echo.
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b %EXITCODE%

:RUN_PREFLIGHT
echo.
echo ==================================================================
echo  PREFLIGHT READ-ONLY OBLIGATOIRE - REMOTE DEVICES / CONNEXION
echo ==================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Focusrite_18i20_Preflight.ps1"
set "PREFLIGHT_CODE=!ERRORLEVEL!"
if not "!PREFLIGHT_CODE!"=="0" (
    echo.
    echo PREFLIGHT BLOQUE - AUCUN write SAFE/FULL/RESUME ne sera lance.
    echo Verifie Focusrite Control ^> Device Settings ^> Remote Devices,
    echo approuve Companion Scarlett 18i20, puis relance CE MEME CMD.
    echo Ne recree pas la connexion Companion et n'approuve pas les anciens probes read-only.
) else (
    echo.
    echo PREFLIGHT PASS - le client Companion existant est autorise.
)
exit /b !PREFLIGHT_CODE!

:RUN_V7
if /I "%MODE%"=="RESUME" (
    "%NODE_EXE%" "%~dp0Focusrite_18i20_FullTestBench.js" --allow-hardware-writes --confirm-all-output-routing-isolated --diagnostic-resume=auto
) else (
    "%NODE_EXE%" "%~dp0Focusrite_18i20_FullTestBench.js" --allow-hardware-writes --confirm-all-output-routing-isolated --manual-feedback
)
exit /b !ERRORLEVEL!
