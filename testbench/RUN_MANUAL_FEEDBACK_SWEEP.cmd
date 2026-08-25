@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 FREE MANUAL FEEDBACK RECORDER - READ ONLY
echo ==================================================================
echo Meme recorder large existant : aucun second workflow.
echo Aucun write Focusrite. Aucun bouton Companion presse par le harness.
echo Les 783 feedbacks publics hors meters sont scannes pendant REC ON.
echo Les 46 meters sont observes en continu en parallele.
echo Les variables semantiques safe exposees sont observees en parallele.
echo Les noms de source reconnus sont conserves; gains/pans restent des classes opaques V1/V2/...
echo Aucun raw source/control value, nickname ou identite privee n est enregistre.
echo.
echo IMPORTANT : tes clics dans Focusrite Control changent le hardware.
echo Coupe/isole enceintes, casque et sorties sensibles AVANT REC ON.
echo Pendant REC ON, explore librement les controles RESTANTS ET SURS et laisse chaque etat ~2 secondes.
echo Quelques secondes de silence peuvent aussi fermer les Mix meters encore en attente du floor.
echo.
echo NE CLIQUE PAS uniquement pour cette campagne :
echo   - Device Preset, Clock Source, Sample Rate ou S/PDIF mode;
echo   - firmware, reset, restore ou snapshot;
echo   - Monitor gain 1677;
echo   - une sortie indiquee indisponible.
echo Les nicknames sont volontairement ignores.
echo Reviens dans cette fenetre et appuie seulement sur ENTREE pour arreter REC.
echo L evidence meter precedente est reprise automatiquement.
echo Les allers-retours trop rapides sont reconcilies en TRANSIENT_RACE apres REC.
echo.

set "NODE_EXE="
if exist ".build-tools\node22\node.exe" set "NODE_EXE=.build-tools\node22\node.exe"
if not defined NODE_EXE (
    where node >nul 2>&1
    if not errorlevel 1 set "NODE_EXE=node"
)

if not defined NODE_EXE (
    echo MANUAL FEEDBACK RECORDER FAILED - Node.js introuvable.
    echo Lance d abord UPDATE_AND_RUN.bat pour preparer le Node portable.
    exit /b 2
)

if /I "%~1"=="RECONCILE_ONLY" goto RECONCILE_ONLY

"%NODE_EXE%" "testbench\ManualFeedbackSweep.js"
set "RECORDER_EXITCODE=%ERRORLEVEL%"

if "%RECORDER_EXITCODE%"=="2" goto RECORDER_FATAL

"%NODE_EXE%" "testbench\ManualFeedbackSweepReconcile.js"
set "RECONCILE_EXITCODE=%ERRORLEVEL%"

echo.
if "%RECONCILE_EXITCODE%"=="0" (
    echo MANUAL FEEDBACK RECORDER TERMINE ET RECONCILIE.
) else (
    echo MANUAL FEEDBACK RECORDER RECONCILIE AVEC CODE %RECONCILE_EXITCODE%.
)
echo Rapport local: testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json
exit /b %RECONCILE_EXITCODE%

:RECONCILE_ONLY
echo RECONCILE_ONLY - aucune nouvelle capture hardware.
"%NODE_EXE%" "testbench\ManualFeedbackSweepReconcile.js"
set "RECONCILE_EXITCODE=%ERRORLEVEL%"
echo Rapport local: testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json
exit /b %RECONCILE_EXITCODE%

:RECORDER_FATAL
echo.
echo MANUAL FEEDBACK RECORDER FATAL - reconciliation non lancee pour eviter de retraiter un rapport ancien.
echo Rapport local precedent conserve: testbench\results\LATEST_MANUAL_FEEDBACK_SWEEP.json
exit /b %RECORDER_EXITCODE%
