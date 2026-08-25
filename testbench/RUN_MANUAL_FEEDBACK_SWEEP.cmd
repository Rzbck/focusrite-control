@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ==================================================================
echo  FOCUSRITE 18i20 FREE MANUAL FEEDBACK RECORDER - READ ONLY
echo ==================================================================
echo Aucun write Focusrite. Aucun bouton Companion presse par le harness.
echo Aucun nom de controle, CAPTURE ou RESTORED a taper pendant le test.
echo Les 783 feedbacks publics hors meters sont scannes pendant REC ON.
echo Chaque feedback qui change est compare a son oracle serveur.
echo Les 46 meters sont observes en continu en parallele.
echo Le programme affiche clairement REC ON quand la capture commence.
echo Reviens dans cette fenetre et appuie seulement sur ENTREE pour arreter.
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
