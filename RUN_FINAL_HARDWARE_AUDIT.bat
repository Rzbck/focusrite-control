@echo off
setlocal EnableExtensions
cd /d "%~dp0"
call "testbench\RUN_FINAL_HARDWARE_AUDIT.cmd"
exit /b %ERRORLEVEL%
