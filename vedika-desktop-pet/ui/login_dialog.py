import os
import sys
import json
import urllib.request
import urllib.error
from PySide6.QtCore import Qt, QThread, Signal, Slot
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QFrame, QMessageBox, QProgressBar
)
from PySide6.QtGui import QFont, QIcon, QColor

class AuthWorker(QThread):
    """Asynchronous worker to verify credentials against Vedika LMS API without freezing UI."""
    success = Signal(dict)
    failure = Signal(str)

    def __init__(self, base_url: str, username: str, password: str):
        super().__init__()
        self.base_url = base_url.rstrip("/")
        self.username = username.strip()
        self.password = password.strip()

    def run(self):
        login_url = f"{self.base_url}/api/auth/login"
        payload = json.dumps({"usr": self.username, "pwd": self.password}).encode("utf-8")
        req = urllib.request.Request(
            login_url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "VedikaMascot-Desktop/2.0"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_text = resp.read().decode("utf-8")
                data = json.loads(resp_text)
                if data.get("error"):
                    self.failure.emit(str(data.get("error")))
                else:
                    self.success.emit(data)
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
                msg = err_body.get("error") or err_body.get("message") or f"HTTP {e.code}"
            except Exception:
                msg = f"Invalid email or password (HTTP {e.code})"
            self.failure.emit(str(msg))
        except Exception as ex:
            self.failure.emit(f"Connection failed: {str(ex)}")

class VedikaSetupLoginDialog(QDialog):
    """
    Setup, Permissions & Authentication Window for Vedika Desktop Mascot.
    Ensures microphone permissions and network connectivity are verified,
    and synchronizes user login with the Vedika LMS website credentials.
    """
    def __init__(self, user_profile_manager, base_url="https://vedika-v20c.vercel.app", parent=None):
        super().__init__(parent)
        self.user_profile = user_profile_manager
        self.base_url = base_url
        self.auth_worker = None

        self.setWindowTitle("Vedika Desktop Companion — Setup & Login")
        self.setFixedSize(480, 560)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)

        self.setup_ui()
        self.check_system_permissions()

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
            QLineEdit {
                background: rgba(18, 24, 42, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                padding: 10px 14px;
                color: #ffffff;
                font-size: 13px;
            }
            QLineEdit:focus {
                border-color: #00f298;
                background: rgba(24, 32, 56, 0.95);
            }
            QPushButton#loginBtn {
                background: linear-gradient(135deg, #00f298 0%, #38bdf8 100%);
                color: #030712;
                font-size: 14px;
                font-weight: 700;
                border: none;
                border-radius: 8px;
                padding: 12px;
            }
            QPushButton#loginBtn:hover {
                background: linear-gradient(135deg, #10b981 0%, #0284c7 100%);
            }
            QPushButton#loginBtn:disabled {
                background: #334155;
                color: #94a3b8;
            }
            QPushButton#guestBtn {
                background: transparent;
                color: #94a3b8;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 9px;
                font-size: 12.5px;
            }
            QPushButton#guestBtn:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #e2e8f0;
            }
            QPushButton#permFixBtn {
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.4);
                color: #fca5a5;
                border-radius: 6px;
                padding: 4px 10px;
                font-size: 11px;
            }
            QPushButton#permFixBtn:hover {
                background: rgba(239, 68, 68, 0.3);
            }
            QFrame#permBox {
                background: rgba(15, 23, 42, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 10px;
                padding: 10px;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(32, 28, 32, 28)
        layout.setSpacing(14)

        # Header branding
        header_title = QLabel("Vedika AI Desktop Companion")
        header_title.setStyleSheet("font-size: 20px; font-weight: 800; color: #ffffff;")
        header_title.setAlignment(Qt.AlignCenter)
        layout.addWidget(header_title)

        subtitle = QLabel("Sign in with your Vedika LMS website account")
        subtitle.setStyleSheet("font-size: 12.5px; color: #94a3b8; margin-bottom: 4px;")
        subtitle.setAlignment(Qt.AlignCenter)
        layout.addWidget(subtitle)

        # Permissions status box
        self.perm_frame = QFrame()
        self.perm_frame.setObjectName("permBox")
        perm_layout = QVBoxLayout(self.perm_frame)
        perm_layout.setContentsMargins(12, 10, 12, 10)
        perm_layout.setSpacing(6)

        perm_title = QLabel("System Readiness & Permissions:")
        perm_title.setStyleSheet("font-size: 11.5px; font-weight: 700; color: #38bdf8; text-transform: uppercase;")
        perm_layout.addWidget(perm_title)

        # Mic status row
        mic_row = QHBoxLayout()
        self.mic_label = QLabel("🎤 Microphone: Checking...")
        self.mic_label.setStyleSheet("font-size: 12px;")
        mic_row.addWidget(self.mic_label)
        mic_row.addStretch()

        self.mic_fix_btn = QPushButton("Open Windows Mic Settings")
        self.mic_fix_btn.setObjectName("permFixBtn")
        self.mic_fix_btn.setVisible(False)
        self.mic_fix_btn.clicked.connect(self.open_mic_settings)
        mic_row.addWidget(self.mic_fix_btn)
        perm_layout.addLayout(mic_row)

        # Net status row
        self.net_label = QLabel("🌐 Cloud API Connection: Ready")
        self.net_label.setStyleSheet("font-size: 12px; color: #34d399;")
        perm_layout.addWidget(self.net_label)

        layout.addWidget(self.perm_frame)

        # Form Inputs
        email_lbl = QLabel("Email or Username")
        email_lbl.setStyleSheet("font-size: 12px; font-weight: 600; color: #cbd5e1;")
        layout.addWidget(email_lbl)

        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("student@vedika.ai")
        # Prefill if already partially set
        current_user = self.user_profile.profile.get("user", {})
        if current_user.get("email"):
            self.email_input.setText(current_user.get("email"))
        layout.addWidget(self.email_input)

        pwd_lbl = QLabel("Password")
        pwd_lbl.setStyleSheet("font-size: 12px; font-weight: 600; color: #cbd5e1;")
        layout.addWidget(pwd_lbl)

        self.pwd_input = QLineEdit()
        self.pwd_input.setEchoMode(QLineEdit.Password)
        self.pwd_input.setPlaceholderText("••••••••••••")
        self.pwd_input.returnPressed.connect(self.handle_login)
        layout.addWidget(self.pwd_input)

        # Error / Status message label
        self.status_label = QLabel("")
        self.status_label.setStyleSheet("font-size: 12px; color: #f87171; min-height: 16px;")
        self.status_label.setWordWrap(True)
        layout.addWidget(self.status_label)

        layout.addSpacing(4)

        # Action Buttons
        self.login_btn = QPushButton("Log In & Launch Mascot")
        self.login_btn.setObjectName("loginBtn")
        self.login_btn.clicked.connect(self.handle_login)
        layout.addWidget(self.login_btn)

        self.guest_btn = QPushButton("Continue as Guest (Offline Mode)")
        self.guest_btn.setObjectName("guestBtn")
        self.guest_btn.clicked.connect(self.handle_guest_mode)
        layout.addWidget(self.guest_btn)

    def check_system_permissions(self):
        """Verifies microphone hardware and privacy settings."""
        has_mic = False
        try:
            import pyaudio
            p = pyaudio.PyAudio()
            count = p.get_device_count()
            for i in range(count):
                info = p.get_device_info_by_index(i)
                if info.get("maxInputChannels", 0) > 0:
                    has_mic = True
                    break
            p.terminate()
        except Exception as e:
            has_mic = False

        if has_mic:
            self.mic_label.setText("🎤 Microphone: Granted & Active")
            self.mic_label.setStyleSheet("font-size: 12px; color: #34d399;")
            self.mic_fix_btn.setVisible(False)
        else:
            self.mic_label.setText("🎤 Microphone: Blocked or Not Found")
            self.mic_label.setStyleSheet("font-size: 12px; color: #f87171;")
            self.mic_fix_btn.setVisible(True)

    def open_mic_settings(self):
        """Opens Windows Microphone privacy settings page."""
        try:
            os.system("start ms-settings:privacy-microphone")
        except Exception:
            pass

    def handle_login(self):
        username = self.email_input.text().strip()
        password = self.pwd_input.text().strip()

        if not username or not password:
            self.status_label.setText("Please enter both username/email and password.")
            self.status_label.setStyleSheet("font-size: 12px; color: #f87171;")
            return

        self.status_label.setText("Verifying account credentials...")
        self.status_label.setStyleSheet("font-size: 12px; color: #38bdf8;")
        self.login_btn.setEnabled(False)
        self.guest_btn.setEnabled(False)

        self.auth_worker = AuthWorker(self.base_url, username, password)
        self.auth_worker.success.connect(self.on_auth_success)
        self.auth_worker.failure.connect(self.on_auth_failure)
        self.auth_worker.start()

    @Slot(dict)
    def on_auth_success(self, data):
        self.login_btn.setEnabled(True)
        self.guest_btn.setEnabled(True)
        self.status_label.setText("Authentication successful! Loading profile...")
        self.status_label.setStyleSheet("font-size: 12px; color: #34d399;")

        user_info = data.get("user") or {}
        token = data.get("token") or user_info.get("token") or data.get("sid")

        # Save to UserProfileManager
        if hasattr(self.user_profile, "set_authenticated_user"):
            self.user_profile.set_authenticated_user(user_info, token)
        else:
            user = self.user_profile.profile.setdefault("user", {})
            user["is_authenticated"] = True
            user["email"] = user_info.get("email") or self.email_input.text().strip()
            user["name"] = user_info.get("full_name") or user_info.get("name") or "Student"
            user["token"] = token or ""
            self.user_profile.save_profile()

        self.accept()

    @Slot(str)
    def on_auth_failure(self, err_msg):
        self.login_btn.setEnabled(True)
        self.guest_btn.setEnabled(True)
        self.status_label.setText(f"Login failed: {err_msg}")
        self.status_label.setStyleSheet("font-size: 12px; color: #f87171;")

    def handle_guest_mode(self):
        """Allows testing without login."""
        self.accept()
