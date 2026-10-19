@echo off
cd /d "%~dp0"
if exist "Vedika-Mascot.exe" (
    start "" "Vedika-Mascot.exe"
) else (
    start "" pythonw.exe main.py
)
