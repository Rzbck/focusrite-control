@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 MIX METER - PLAYBACK SLOT EXACT RESTORE
echo ==================================================================
echo WRITE-CAPABLE TESTBENCH: uniquement le strip Playback detecte de chaque lane.
echo.
echo REQUIREMENTS:
echo  - Companion reste sur le package 0.1.16 exact deja audite/valide.
echo  - Ne PAS importer le .tgz reconstruit par cette branche TestBench.
echo  - Baisse le bouton PHYSIQUE Monitor.
echo  - Mute/deconnecte les enceintes actives si possible.
echo  - Retire le casque ou mets-le au minimum.
echo  - Ne lance pas pendant un live ou un enregistrement critique.
echo.
echo Le moteur ne touche PAS aux Output Source et ne tente aucun Pair Source=None.
echo Il modifie seulement gain/mute/solo du strip Playback existant, lane par lane.
echo Chaque lane exige une baseline serveur exacte, un meter encore non clos et une restauration confirmee.
echo Mixer Slot Source, Monitor gain 1677, Advanced Raw et firmware/reset/snapshot restent interdits.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo.
    echo MIX METER FAILED - Node.js introuvable.
    echo Lance d abord UPDATE_AND_RUN.bat sur cette branche pour preparer le Node portable.
    echo.
    pause
    exit /b 2
)

echo ==================================================================
echo  PREPARATION READ-ONLY - PAGE 2 / SNAPSHOT
echo ==================================================================
"%NODE_EXE%" "testbench\MeterRoutingPrepare.js"
set "PREP_CODE=!ERRORLEVEL!"

if "!PREP_CODE!"=="6" (
    echo.
    echo ==================================================================
    echo  PAGE 2 V8 REQUISE - REMPLACEMENT AUTOMATIQUE OPTIONNEL
    echo ==================================================================
    echo PAGE2_AUTO remplace uniquement Companion Page 2 par le harness V8 courant.
    echo Aucun bouton Companion n est presse et aucun write Focusrite n est envoye par cette preparation.
    echo Page 1, les autres pages et la connexion Focusrite existante restent preservees.
    echo.
    set "PAGE2_CONFIRM="
    set /p "PAGE2_CONFIRM=Tape PAGE2_AUTO pour remplacer Page 2, ou autre chose pour annuler : "
    if /I not "!PAGE2_CONFIRM!"=="PAGE2_AUTO" (
        echo.
        echo MIX METER PREP ANNULE - aucun write hardware n a ete lance.
        echo.
        pause
        exit /b 6
    )

    "%NODE_EXE%" "testbench\FullTestBenchCompanionImportV7.js" --replace-page-2
    set "PAGE2_CODE=!ERRORLEVEL!"
    if not "!PAGE2_CODE!"=="0" (
        echo.
        echo PAGE 2 AUTO BLOQUE - aucun test hardware n est lance.
        echo.
        pause
        exit /b 7
    )

    echo.
    echo Reaudit read-only obligatoire avant toute permission hardware...
    "%NODE_EXE%" "testbench\MeterRoutingPrepare.js"
    set "PREP_CODE=!ERRORLEVEL!"
    if not "!PREP_CODE!"=="0" (
        echo.
        echo MIX METER PREP BLOQUE APRES PAGE2_AUTO - aucun test hardware n est lance.
        echo.
        pause
        exit /b 7
    )
) else if not "!PREP_CODE!"=="0" (
    echo.
    echo MIX METER PREP BLOQUE - aucun test hardware n est lance.
    echo.
    pause
    exit /b !PREP_CODE!
)

echo.
echo Preparation read-only : PASS
echo Aucun write hardware n a encore ete effectue.
echo.
echo ==================================================================
echo  ACTIONABILITY READ-ONLY - BASELINE EXACTE + METER ENCORE NON CLOS
echo ==================================================================
"%NODE_EXE%" "testbench\MeterMixPlaybackActionability.js"
set "ACTION_CODE=!ERRORLEVEL!"
if "!ACTION_CODE!"=="8" (
    echo.
    echo MIX METER NO-OP SAFE - aucune lane actionnable ne peut ajouter de nouvelle preuve.
    echo Aucun write hardware n a ete lance. Ne force pas les lanes a baseline inconnue.
    echo.
    pause
    exit /b 0
)
if not "!ACTION_CODE!"=="0" (
    echo.
    echo MIX METER ACTIONABILITY BLOQUE - aucun test hardware n est lance.
    echo.
    pause
    exit /b !ACTION_CODE!
)

echo.
echo Actionability read-only : PASS
echo Au moins une lane encore non close dispose d une baseline exacte.
echo Aucun write hardware n a encore ete effectue.
echo.

set "CONFIRM="
set /p "CONFIRM=Tape MIX_METERS pour autoriser les changements temporaires du strip Playback : "
if /I not "!CONFIRM!"=="MIX_METERS" (
    echo.
    echo MIX METER ANNULE - aucune permission de write accordee.
    echo.
    pause
    exit /b 2
)

set "ISOLATED="
set /p "ISOLATED=Tape ALL_ISOLATED pour confirmer la securite physique de TOUTES les sorties : "
if /I not "!ISOLATED!"=="ALL_ISOLATED" (
    echo.
    echo MIX METER ANNULE - isolation physique non confirmee.
    echo.
    pause
    exit /b 2
)

echo.
echo Permission mix meter : CONFIRMEE
echo Isolation physique : CONFIRMEE
echo Demarrage de la campagne Playback-slot exact-restore...
echo.

"%NODE_EXE%" "testbench\MeterMixPlaybackClosure.js" --allow-mix-meter-writes --confirm-all-output-routing-isolated
set "EXITCODE=!ERRORLEVEL!"

echo.
if "!EXITCODE!"=="0" (
    echo MIX METER TERMINE SANS HARD ABORT.
) else (
    echo MIX METER TERMINE AVEC CODE !EXITCODE!.
)
if "!EXITCODE!"=="4" (
    echo IMPORTANT : ne lance aucune autre campagne avant verification du rapport de restauration.
)
echo Aucun package module n a ete installe ou active par ce lanceur.
echo.
echo La fenetre reste ouverte pour permettre la lecture/copie du resultat.
pause
exit /b !EXITCODE!
