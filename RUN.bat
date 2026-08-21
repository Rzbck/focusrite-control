@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if errorlevel 1 (
    echo ERREUR : impossible d'ouvrir la racine du depot.
    pause
    endlocal & exit /b 1
)

title Focusrite Control - RC repair and validation

where powershell.exe >nul 2>&1
if errorlevel 1 (
    echo ERREUR : PowerShell est introuvable.
    pause
    endlocal & exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\rc-repair-and-validate.ps1"
set "RUN_CODE=%ERRORLEVEL%"

echo.
echo ==============================================================
if "%RUN_CODE%"=="0" (
    echo RC TERMINE AVEC SUCCES
) else (
    echo RC TERMINE AVEC CODE %RUN_CODE%
)
echo Appuyez sur une touche pour fermer.
echo ==============================================================
pause >nul

endlocal & exit /b %RUN_CODE%
