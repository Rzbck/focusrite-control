@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 METER ROUTING - EXACT RESTORE
echo ==================================================================
echo WRITE-CAPABLE TESTBENCH: routing/mix changes are temporary but real.
echo.
echo REQUIREMENTS:
echo  - Companion reste sur le package 0.1.16 exact deja audite/valide.
echo  - Ne PAS importer le .tgz reconstruit par cette branche TestBench.
echo  - Baisse le bouton PHYSIQUE Monitor.
echo  - Mute/deconnecte les enceintes actives si possible.
echo  - Retire le casque ou mets-le au minimum.
echo  - Ne lance pas pendant un live ou un enregistrement critique.
echo.
echo Le moteur n'ecrit jamais directement le protocole Focusrite.
echo Il utilise uniquement les actions Companion deja auditees et exige une restauration serveur exacte.
echo Les sorties availability UNKNOWN ne recoivent aucun write.
echo Mixer Slot Source, Monitor gain 1677, Advanced Raw et commandes firmware/reset/snapshot restent interdits.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo.
    echo METER ROUTING FAILED - Node.js introuvable.
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
    echo Le harness V8 vient d etre genere depuis le snapshot serveur actuel.
    echo PAGE2_AUTO modifie UNIQUEMENT la configuration Companion Page 2 :
    echo  - aucun bouton Companion n est presse ;
    echo  - aucun write Focusrite n est envoye ;
    echo  - Page 1 r9 et les autres pages restent inchangees ;
    echo  - la connexion Focusrite existante est reutilisee ;
    echo  - aucune connexion n est creee ;
    echo  - le contenu actuel de Page 2 sera remplace par le harness V8.
    echo.
    set "PAGE2_CONFIRM="
    set /p "PAGE2_CONFIRM=Tape PAGE2_AUTO pour remplacer Page 2, ou autre chose pour annuler : "
    if /I not "!PAGE2_CONFIRM!"=="PAGE2_AUTO" (
        echo.
        echo METER ROUTING PREP ANNULE - aucun write hardware n a ete lance.
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
    echo Reaudit read-only obligatoire de Page 2 avant toute permission hardware...
    "%NODE_EXE%" "testbench\MeterRoutingPrepare.js"
    set "PREP_CODE=!ERRORLEVEL!"
    if not "!PREP_CODE!"=="0" (
        echo.
        echo METER ROUTING PREP BLOQUE APRES PAGE2_AUTO - aucun test hardware n est lance.
        echo.
        pause
        exit /b 7
    )
) else if not "!PREP_CODE!"=="0" (
    echo.
    echo METER ROUTING PREP BLOQUE - aucun test hardware n est lance.
    echo.
    pause
    exit /b !PREP_CODE!
)

echo.
echo Preparation read-only : PASS
echo Aucun write hardware n a encore ete effectue.
echo.

set "CONFIRM="
set /p "CONFIRM=Tape ROUTE_METERS puis Entree pour autoriser les changements temporaires : "
if /I not "!CONFIRM!"=="ROUTE_METERS" (
    echo.
    echo METER ROUTING ANNULE - aucune permission de write accordee.
    echo.
    pause
    exit /b 2
)

set "ISOLATED="
set /p "ISOLATED=Tape ALL_ISOLATED pour confirmer la securite physique de TOUTES les sorties : "
if /I not "!ISOLATED!"=="ALL_ISOLATED" (
    echo.
    echo METER ROUTING ANNULE - isolation physique non confirmee.
    echo.
    pause
    exit /b 2
)

echo.
echo Permission routing : CONFIRMEE
echo Isolation physique : CONFIRMEE
echo Demarrage de la campagne exact-restore...
echo.

"%NODE_EXE%" "testbench\MeterRoutingClosure.js" --allow-routing-writes --confirm-all-output-routing-isolated
set "EXITCODE=!ERRORLEVEL!"

echo.
if "!EXITCODE!"=="0" (
    echo METER ROUTING TERMINE SANS HARD ABORT.
) else (
    echo METER ROUTING TERMINE AVEC CODE !EXITCODE!.
)
if "!EXITCODE!"=="4" (
    echo IMPORTANT : ne lance aucune autre campagne avant verification du rapport de restauration.
)
echo Aucun package module n a ete installe ou active par ce lanceur.
echo.
echo La fenetre reste ouverte pour permettre la lecture/copie du resultat.
pause
exit /b !EXITCODE!
