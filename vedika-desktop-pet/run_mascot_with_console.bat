@echo off
title Vedika Desktop Companion - Live Logs
cd /d "%~dp0"
echo ===================================================
echo   Vedika AI Desktop Companion (Live Console Mode)
echo ===================================================
echo Press Alt+V to toggle Voice Chat on / off.
echo Press Alt+S to trigger live screen analysis.
echo Logs are also being mirrored to mascot.log
echo ===================================================
echo.
python.exe main.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Vedika exited with error code %ERRORLEVEL%.
    pause
)
