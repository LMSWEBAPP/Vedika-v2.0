import os
import sys
import time
import urllib.request
import subprocess
from PySide6.QtCore import Qt, QThread, Signal, Slot
from PySide6.QtWidgets import (
    QApplication, QDialog, QVBoxLayout, QLabel, QProgressBar, QPushButton, QMessageBox
)

CORE_EXE_URL = "https://github.com/LMSWEBAPP/Vedika-v2.0/raw/main/vedika-desktop-pet/Vedika-Mascot.exe"
TARGET_EXE_NAME = "Vedika-Mascot.exe"

class DownloadThread(QThread):
    progress = Signal(int, float, float) # percent, downloaded_mb, total_mb
    completed = Signal(str)
    failed = Signal(str)

    def __init__(self, target_path: str):
        super().__init__()
        self.target_path = target_path
        self._is_cancelled = False

    def cancel(self):
        self._is_cancelled = True

    def run(self):
        try:
            req = urllib.request.Request(
                CORE_EXE_URL,
                headers={"User-Agent": "VedikaSetup/2.0 (Windows)"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                total_bytes = int(resp.headers.get("Content-Length") or 150072274)
                total_mb = total_bytes / (1024 * 1024)
                downloaded_bytes = 0
                temp_path = self.target_path + ".tmp"

                with open(temp_path, "wb") as f:
                    while True:
                        if self._is_cancelled:
                            return
                        chunk = resp.read(1024 * 64) # 64 KB chunks
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded_bytes += len(chunk)
                        percent = int((downloaded_bytes / total_bytes) * 100)
                        down_mb = downloaded_bytes / (1024 * 1024)
                        self.progress.emit(min(100, percent), down_mb, total_mb)

                if os.path.exists(self.target_path):
                    try:
                        os.remove(self.target_path)
                    except Exception:
                        pass
                os.replace(temp_path, self.target_path)
                self.completed.emit(self.target_path)
        except Exception as e:
            self.failed.emit(str(e))

class VedikaInstallerDialog(QDialog):
    """
    Lightweight Bootstrapper & Installer Window for Vedika Companion.
    Downloads required mascot files, verifies integrity, and launches setup.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Vedika Desktop Mascot — Setup & Downloader")
        self.setFixedSize(460, 240)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)

        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.target_exe = os.path.join(script_dir, TARGET_EXE_NAME)

        self.setup_ui()
        self.start_download()

    def setup_ui(self):
        self.setStyleSheet("""
            QDialog {
                background: #0b0f19;
                color: #e2e8f0;
                font-family: 'Segoe UI', system-ui, sans-serif;
            }
            QLabel {
                color: #cbd5e1;
            }
            QProgressBar {
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                text-align: center;
                background: #1e293b;
                color: #ffffff;
                font-weight: 700;
                height: 22px;
            }
            QProgressBar::chunk {
                background: linear-gradient(90deg, #00f298 0%, #38bdf8 100%);
                border-radius: 7px;
            }
            QPushButton {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                color: #cbd5e1;
                padding: 6px 16px;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #ffffff;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 24, 28, 24)
        layout.setSpacing(14)

        title = QLabel("Setting up Vedika Desktop Mascot")
        title.setStyleSheet("font-size: 16px; font-weight: 800; color: #ffffff;")
        layout.addWidget(title)

        self.status_lbl = QLabel("Downloading necessary mascot files and core components...")
        self.status_lbl.setStyleSheet("font-size: 12.5px; color: #94a3b8;")
        layout.addWidget(self.status_lbl)

        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        layout.addWidget(self.progress_bar)

        self.stats_lbl = QLabel("0.0 MB / ~143 MB")
        self.stats_lbl.setStyleSheet("font-size: 11.5px; color: #64748b;")
        layout.addWidget(self.stats_lbl)

        layout.addStretch()

    def start_download(self):
        # Check if already installed and valid (>10MB and starts with MZ)
        if os.path.exists(self.target_exe) and os.path.getsize(self.target_exe) > 10 * 1024 * 1024:
            try:
                with open(self.target_exe, "rb") as f:
                    if f.read(2) == b"MZ":
                        self.status_lbl.setText("Mascot files verified! Launching...")
                        self.progress_bar.setValue(100)
                        self.launch_mascot()
                        return
            except Exception:
                pass

        self.thread = DownloadThread(self.target_exe)
        self.thread.progress.connect(self.on_progress)
        self.thread.completed.connect(self.on_completed)
        self.thread.failed.connect(self.on_failed)
        self.thread.start()

    @Slot(int, float, float)
    def on_progress(self, percent, down_mb, total_mb):
        self.progress_bar.setValue(percent)
        self.stats_lbl.setText(f"{down_mb:.1f} MB / {total_mb:.1f} MB ({percent}%)")

    @Slot(str)
    def on_completed(self, path):
        self.status_lbl.setText("Download complete! Launching Vedika Mascot...")
        self.progress_bar.setValue(100)
        self.launch_mascot()

    @Slot(str)
    def on_failed(self, error):
        self.status_lbl.setText(f"Download failed: {error}")
        self.status_lbl.setStyleSheet("color: #f87171;")

    def launch_mascot(self):
        try:
            subprocess.Popen([self.target_exe])
            QApplication.quit()
        except Exception as e:
            QMessageBox.critical(self, "Launch Error", f"Could not start mascot: {e}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    installer = VedikaInstallerDialog()
    installer.show()
    sys.exit(app.exec())
