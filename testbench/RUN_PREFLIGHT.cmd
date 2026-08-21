@echo off
setlocal
cd /d "%~dp0"
title Focusrite 18i20 TestBench v0.2 - Preflight
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Focusrite_18i20_Preflight.ps1"
set "EXITCODE=%ERRORLEVEL%"
echo.
echo Exit code: %EXITCODE%
echo.
echo Appuyez sur une touche pour fermer.
pause >nul
exit /b %EXITCODE%
