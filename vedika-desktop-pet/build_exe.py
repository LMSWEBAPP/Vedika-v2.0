import os
import sys
import shutil
import subprocess

def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    print(f"[Build] Current working directory: {script_dir}")

    # Build command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconsole",
        "--name=Vedika-Mascot",
        "--icon=assets/vedika.ico",
        "--onefile",
        "--clean",
        "--add-data=assets;assets",
        "--add-data=pet.json;.",
        "--add-data=routes.json;.",
        "--add-data=settings.json;.",
        "--add-data=user_profile.json;.",
        "--add-data=spritesheet.webp;.",
        "--add-data=speak_listen.webp;.",
        "--add-data=astro.webp;.",
        "--collect-all=pyaudio",
        "--hidden-import=PySide6.QtCore",
        "--hidden-import=PySide6.QtGui",
        "--hidden-import=PySide6.QtWidgets",
        "--hidden-import=PySide6.QtWebSockets",
        "--hidden-import=PySide6.QtNetwork",
        "--hidden-import=PySide6.QtMultimedia",
        "--exclude-module=PySide6.QtWebEngineCore",
        "--exclude-module=PySide6.QtWebEngineWidgets",
        "--exclude-module=PySide6.QtWebEngineQuick",
        "--exclude-module=PySide6.QtQml",
        "--exclude-module=PySide6.QtQuick",
        "--exclude-module=PySide6.QtQuick3D",
        "--exclude-module=PySide6.Qt3DCore",
        "--exclude-module=PySide6.Qt3DRender",
        "--exclude-module=PySide6.QtPdf",
        "--exclude-module=PySide6.QtPdfWidgets",
        "--exclude-module=scipy",
        "--exclude-module=matplotlib",
        "--exclude-module=pandas",
        "--exclude-module=tkinter",
        "--hidden-import=engine",
        "--hidden-import=engine.gemini_live",
        "--hidden-import=engine.memory",
        "--hidden-import=engine.user_profile",
        "--hidden-import=engine.presentation_manager",
        "--hidden-import=ui",
        "--hidden-import=ui.transparent_window",
        "--hidden-import=ui.log_viewer",
        "--hidden-import=ui.login_dialog",
        "--hidden-import=google.genai",
        "--hidden-import=websockets",
        "--hidden-import=yt_dlp",
        "--hidden-import=dotenv",
        "--hidden-import=PIL",
        "main.py"
    ]
    
    print("[Build] Running PyInstaller command:")
    print(" ".join(cmd))
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"[Build Error] PyInstaller failed with exit code {res.returncode}")
        sys.exit(res.returncode)

    dist_exe = os.path.join(script_dir, "dist", "Vedika-Mascot.exe")
    if os.path.exists(dist_exe):
        size_mb = os.path.getsize(dist_exe) / (1024 * 1024)
        print(f"[Build Success] Standalone executable generated: {dist_exe} ({size_mb:.2f} MB)")
        
        # Copy to root of vedika-desktop-pet for direct accessibility
        target_root_exe = os.path.join(script_dir, "Vedika-Mascot.exe")
        shutil.copy2(dist_exe, target_root_exe)
        print(f"[Build Success] Copied executable to: {target_root_exe}")
    else:
        print("[Build Error] dist/Vedika-Mascot.exe was not found!")
        sys.exit(1)

if __name__ == "__main__":
    build()
