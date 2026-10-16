import os
import re
import sys
import glob
from PySide6.QtCore import Qt, QTimer, Signal, QObject, Slot
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QComboBox,
    QLineEdit, QPushButton, QPlainTextEdit, QCheckBox, QFrame,
    QApplication, QMessageBox
)
from PySide6.QtGui import QFont, QTextCursor, QTextCharFormat, QColor, QIcon

class LogEmitter(QObject):
    """Thread-safe Qt signal emitter for real-time log streaming into the UI."""
    new_log_line = Signal(str)

log_emitter = LogEmitter()

class LogViewerDialog(QDialog):
    """
    Modern dark-mode Diagnostic & Session Log Viewer for Vedika Desktop Mascot.
    Allows viewing the live active session log, browsing previous session logs and crash logs,
    filtering log text, opening the logs folder in Windows File Explorer, and copying logs to clipboard.
    """
    def __init__(self, logs_dir: str, current_session_path: str = None, parent=None):
        super().__init__(parent)
        self.logs_dir = os.path.abspath(logs_dir)
        self.current_session_path = os.path.abspath(current_session_path) if current_session_path else None
        self.active_file_path = self.current_session_path
        self.is_viewing_active_session = True
        self.cached_file_content = ""
        self._last_file_size = 0

        self.setWindowTitle("Vedika Mascot — Diagnostic & Session Logs")
        self.resize(920, 640)
        self.setMinimumSize(700, 480)

        # Apply rich dark-mode stylesheet matching mascot aesthetics
        self.setStyleSheet("""
            QDialog {
                background-color: #12131c;
                color: #e2e8f0;
                font-family: 'Segoe UI', system-ui, sans-serif;
            }
            QFrame#headerFrame {
                background-color: #1a1c29;
                border: 1px solid #2e344e;
                border-radius: 8px;
                padding: 10px;
            }
            QLabel {
                color: #cbd5e1;
                font-size: 13px;
                font-weight: 500;
            }
            QComboBox {
                background-color: #0f111a;
                color: #f8fafc;
                border: 1px solid #3b82f6;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 13px;
                min-width: 280px;
            }
            QComboBox:hover {
                border-color: #60a5fa;
            }
            QComboBox::drop-down {
                border: none;
                width: 24px;
            }
            QComboBox QAbstractItemView {
                background-color: #161824;
                color: #f1f5f9;
                border: 1px solid #3b82f6;
                selection-background-color: #2563eb;
                selection-color: #ffffff;
                padding: 4px;
            }
            QLineEdit {
                background-color: #0f111a;
                color: #f8fafc;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 13px;
            }
            QLineEdit:focus {
                border-color: #3b82f6;
            }
            QPlainTextEdit {
                background-color: #0b0c13;
                color: #e2e8f0;
                border: 1px solid #1e2235;
                border-radius: 8px;
                padding: 10px;
                font-family: 'Consolas', 'JetBrains Mono', 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
            }
            QCheckBox {
                color: #94a3b8;
                font-size: 12px;
                spacing: 6px;
            }
            QCheckBox::indicator {
                width: 16px;
                height: 16px;
                border-radius: 4px;
                border: 1px solid #475569;
                background: #0f111a;
            }
            QCheckBox::indicator:checked {
                background-color: #3b82f6;
                border-color: #3b82f6;
            }
            QPushButton {
                background-color: #2563eb;
                color: #ffffff;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #3b82f6;
            }
            QPushButton:pressed {
                background-color: #1d4ed8;
            }
            QPushButton#secondaryBtn {
                background-color: #1e293b;
                color: #cbd5e1;
                border: 1px solid #334155;
            }
            QPushButton#secondaryBtn:hover {
                background-color: #334155;
                color: #f8fafc;
            }
            QPushButton#dangerBtn {
                background-color: #b91c1c;
            }
            QPushButton#dangerBtn:hover {
                background-color: #dc2626;
            }
        """)

        self._build_ui()
        self._populate_log_files()

        # Connect live log streaming signal
        log_emitter.new_log_line.connect(self.on_live_log_line)

        # Periodic file check timer for external updates
        self.poll_timer = QTimer(self)
        self.poll_timer.timeout.connect(self._check_active_file_update)
        self.poll_timer.start(1000)

    def _build_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(16, 16, 16, 16)
        main_layout.setSpacing(12)

        # Header Frame: Controls & Filters
        header_frame = QFrame()
        header_frame.setObjectName("headerFrame")
        h_layout = QVBoxLayout(header_frame)
        h_layout.setContentsMargins(10, 10, 10, 10)
        h_layout.setSpacing(10)

        # Row 1: File selector + auto-scroll
        row1 = QHBoxLayout()
        row1.addWidget(QLabel("Select Log File:"))

        self.file_combo = QComboBox()
        self.file_combo.currentIndexChanged.connect(self._on_log_file_selected)
        row1.addWidget(self.file_combo, 1)

        self.auto_scroll_chk = QCheckBox("Auto-scroll to latest")
        self.auto_scroll_chk.setChecked(True)
        row1.addWidget(self.auto_scroll_chk)

        self.refresh_btn = QPushButton("🔄 Refresh")
        self.refresh_btn.setObjectName("secondaryBtn")
        self.refresh_btn.clicked.connect(self._populate_log_files)
        row1.addWidget(self.refresh_btn)

        h_layout.addLayout(row1)

        # Row 2: Search filter bar
        row2 = QHBoxLayout()
        row2.addWidget(QLabel("Filter Text:"))

        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search keyword (e.g. error, 1011, VAD, GeminiLive, mic, tool)...")
        self.search_input.textChanged.connect(self._apply_filter)
        row2.addWidget(self.search_input, 1)

        self.clear_filter_btn = QPushButton("Clear")
        self.clear_filter_btn.setObjectName("secondaryBtn")
        self.clear_filter_btn.clicked.connect(lambda: self.search_input.clear())
        row2.addWidget(self.clear_filter_btn)

        h_layout.addLayout(row2)
        main_layout.addWidget(header_frame)

        # Central Log Text Display
        self.log_text_edit = QPlainTextEdit()
        self.log_text_edit.setReadOnly(True)
        main_layout.addWidget(self.log_text_edit, 1)

        # Footer Toolbar: Actions
        footer = QHBoxLayout()
        footer.setSpacing(10)

        self.status_label = QLabel(f"Logs Directory: {self.logs_dir}")
        self.status_label.setStyleSheet("color: #64748b; font-size: 11px;")
        footer.addWidget(self.status_label, 1)

        self.open_folder_btn = QPushButton("📁 Open Logs Folder")
        self.open_folder_btn.setObjectName("secondaryBtn")
        self.open_folder_btn.clicked.connect(self._open_logs_folder)
        footer.addWidget(self.open_folder_btn)

        self.copy_btn = QPushButton("📋 Copy Log Content")
        self.copy_btn.setObjectName("secondaryBtn")
        self.copy_btn.clicked.connect(self._copy_log_content)
        footer.addWidget(self.copy_btn)

        self.close_btn = QPushButton("Close")
        self.close_btn.setObjectName("secondaryBtn")
        self.close_btn.clicked.connect(self.close)
        footer.addWidget(self.close_btn)

        main_layout.addLayout(footer)

    def _populate_log_files(self):
        """Scans logs_dir for all session and crash log files and populates dropdown ordered newest first."""
        self.file_combo.blockSignals(True)
        self.file_combo.clear()

        os.makedirs(self.logs_dir, exist_ok=True)
        log_patterns = [
            os.path.join(self.logs_dir, "crash_*.log"),
            os.path.join(self.logs_dir, "session_*.log"),
            os.path.join(self.logs_dir, "mascot_session_*.log"),
            os.path.join(self.logs_dir, "latest.log"),
            os.path.join(os.path.dirname(self.logs_dir), "crash.log"),
            os.path.join(os.path.dirname(self.logs_dir), "mascot.log"),
        ]

        found_files = []
        seen_paths = set()
        for pat in log_patterns:
            for fpath in glob.glob(pat):
                norm = os.path.abspath(fpath)
                if norm not in seen_paths and os.path.isfile(norm):
                    seen_paths.add(norm)
                    mtime = os.path.getmtime(norm)
                    size = os.path.getsize(norm)
                    found_files.append((norm, mtime, size))

        # Sort newest modified first
        found_files.sort(key=lambda x: x[1], reverse=True)

        # Ensure current active session is at the very top
        active_idx = 0
        if self.current_session_path and os.path.exists(self.current_session_path):
            active_norm = os.path.abspath(self.current_session_path)
            # Find and place at index 0 if not already
            active_tuple = next((item for item in found_files if item[0] == active_norm), None)
            if active_tuple:
                found_files.remove(active_tuple)
                found_files.insert(0, active_tuple)
            else:
                found_files.insert(0, (active_norm, os.path.getmtime(active_norm), os.path.getsize(active_norm)))

        for i, (fpath, mtime, size) in enumerate(found_files):
            fname = os.path.basename(fpath)
            size_kb = size / 1024.0
            size_str = f"{size_kb:.1f} KB" if size_kb < 1024 else f"{size_kb/1024.0:.2f} MB"
            
            is_active = (fpath == self.current_session_path)
            is_crash = "crash" in fname.lower()

            if is_active:
                label = f"🟢 [ACTIVE SESSION] {fname} ({size_str})"
            elif is_crash:
                label = f"🔴 [CRASH LOG] {fname} ({size_str})"
            else:
                label = f"📄 {fname} ({size_str})"

            self.file_combo.addItem(label, fpath)

        self.file_combo.blockSignals(False)

        # Select the active session or first item
        if self.file_combo.count() > 0:
            self.file_combo.setCurrentIndex(0)
            self._load_selected_file()

    def _on_log_file_selected(self, index: int):
        self._load_selected_file()

    def _load_selected_file(self):
        fpath = self.file_combo.currentData()
        if not fpath or not os.path.exists(fpath):
            self.log_text_edit.setPlainText("Log file does not exist or has been removed.")
            return

        self.active_file_path = fpath
        self.is_viewing_active_session = (fpath == self.current_session_path)

        try:
            with open(fpath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            self.cached_file_content = content
            self._last_file_size = len(content)
            self._display_filtered_content()
        except Exception as e:
            self.log_text_edit.setPlainText(f"Error reading log file {fpath}: {e}")

    def _check_active_file_update(self):
        """Periodically checks if the currently displayed log file has grown on disk and appends new content."""
        if not self.active_file_path or not os.path.exists(self.active_file_path):
            return

        try:
            curr_size = os.path.getsize(self.active_file_path)
            if curr_size != self._last_file_size:
                with open(self.active_file_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                self._last_file_size = curr_size
                self.cached_file_content = content
                self._display_filtered_content()
        except Exception:
            pass

    @Slot(str)
    def on_live_log_line(self, line: str):
        """Slot for real-time live log lines emitted directly from MascotLogger."""
        if self.is_viewing_active_session:
            query = self.search_input.text().strip().lower()
            if not query or query in line.lower():
                self.log_text_edit.appendPlainText(line.rstrip("\r\n"))
                if self.auto_scroll_chk.isChecked():
                    self.log_text_edit.moveCursor(QTextCursor.MoveOperation.End)

    def _apply_filter(self):
        self._display_filtered_content()

    def _display_filtered_content(self):
        query = self.search_input.text().strip().lower()
        if not query:
            display_text = self.cached_file_content
        else:
            lines = self.cached_file_content.splitlines()
            matching_lines = [l for l in lines if query in l.lower()]
            display_text = "\n".join(matching_lines)

        self.log_text_edit.setPlainText(display_text)
        if self.auto_scroll_chk.isChecked():
            self.log_text_edit.moveCursor(QTextCursor.MoveOperation.End)

    def _open_logs_folder(self):
        """Opens Windows Explorer directly to the logs directory."""
        try:
            if os.path.exists(self.logs_dir):
                os.startfile(self.logs_dir)
            else:
                QMessageBox.warning(self, "Directory Not Found", f"Logs directory does not exist yet:\n{self.logs_dir}")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to open logs folder: {e}")

    def _copy_log_content(self):
        """Copies the entire current text in the log viewer to the system clipboard."""
        text = self.log_text_edit.toPlainText()
        if not text:
            return
        clipboard = QApplication.clipboard()
        clipboard.setText(text)
        original_btn_text = self.copy_btn.text()
        self.copy_btn.setText("✅ Copied to Clipboard!")
        QTimer.singleShot(2000, lambda: self.copy_btn.setText(original_btn_text))
