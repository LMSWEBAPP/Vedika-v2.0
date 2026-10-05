import sys
import os
import time

# Ensure import paths
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.physics import PhysicsEngine
from engine.gemini_live import GeminiLiveClient
from main import save_vedika_diagnostic_error_txt, ERRORS_SUMMARY_TXT_PATH, CURRENT_SESSION_ERRORS_PATH
from unittest.mock import MagicMock

def test_screen_boundary_clamping():
    print("Testing Physics Screen Boundary Clamping...")
    pe = PhysicsEngine(x=100.0, y=100.0, width=128, height=128)
    pe.is_static = True

    # Test out of bounds negative
    pe.x = -500.0
    pe.y = -200.0
    pe.update(0.016, 1920, 1080)
    assert pe.x >= 0.0, f"Expected pe.x >= 0, got {pe.x}"
    assert pe.y >= 0.0, f"Expected pe.y >= 0, got {pe.y}"

    # Test out of bounds positive beyond screen
    pe.x = 2500.0
    pe.y = 1500.0
    pe.update(0.016, 1920, 1080)
    max_x = 1920 - 128
    max_y = 1080 - 128
    assert pe.x <= max_x, f"Expected pe.x <= {max_x}, got {pe.x}"
    assert pe.y <= max_y, f"Expected pe.y <= {max_y}, got {pe.y}"

    # Test dragging boundary enforcement
    pe.is_static = False
    pe.is_dragging = True
    pe.x = 3000.0
    pe.y = -100.0
    pe.update(0.016, 1920, 1080)
    assert pe.x <= max_x and pe.y >= 0.0, f"Drag boundary failed: ({pe.x}, {pe.y})"
    print("[PASS] Physics screen boundary clamping verified.")

def test_voice_mode_separation():
    print("\nTesting Voice Mode Separation (Alt+V vs Hold-to-Speak)...")
    mock_pet = MagicMock()
    mock_app = MagicMock()
    client = GeminiLiveClient(mock_pet, mock_app)

    # Initially idle
    assert not client.is_continuous_mode, "Initially is_continuous_mode must be False"
    assert not client.is_push_to_talk, "Initially is_push_to_talk must be False"
    assert not client.is_ptt_holding, "Initially is_ptt_holding must be False"

    # 1. Test Push-to-Talk activation
    client.start_push_to_talk()
    assert client.is_push_to_talk, "Push-to-Talk must be True after start_push_to_talk"
    assert client.is_ptt_holding, "is_ptt_holding must be True after start_push_to_talk"
    assert not client.is_continuous_mode, "is_continuous_mode must remain False during PTT"

    # 2. Test Push-to-Talk release
    client.stop_push_to_talk()
    assert not client.is_ptt_holding, "is_ptt_holding must be False after stop_push_to_talk"
    assert not client.is_continuous_mode, "is_continuous_mode must remain False"

    # 3. Test Alt+V Continuous Mode start
    client.is_continuous_mode = True
    client.is_push_to_talk = False
    client.is_ptt_holding = False

    # When in continuous mode, start_push_to_talk should NOT override continuous mode
    client.start_push_to_talk()
    assert client.is_continuous_mode, "Continuous mode must not be overridden by PTT"

    # 4. Test Clean Stop
    client.stop()
    assert not client.is_continuous_mode, "Stop must reset is_continuous_mode"
    assert not client.is_push_to_talk, "Stop must reset is_push_to_talk"
    assert not client.is_ptt_holding, "Stop must reset is_ptt_holding"
    print("[PASS] Voice mode separation verified.")

def test_diagnostic_error_txt_file():
    print("\nTesting Diagnostic Error Report Saving to TXT file...")
    test_msg = "The cloud mind had a momentary hiccup. I am re-aligning our connection right now! ⚡"
    test_tech = "WebSocket error/closure: 1011 None. Internal error encountered."
    save_vedika_diagnostic_error_txt(test_msg, test_tech, source="Unit Test")

    assert os.path.exists(ERRORS_SUMMARY_TXT_PATH), f"File {ERRORS_SUMMARY_TXT_PATH} should exist"
    assert os.path.exists(CURRENT_SESSION_ERRORS_PATH), f"File {CURRENT_SESSION_ERRORS_PATH} should exist"

    with open(CURRENT_SESSION_ERRORS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "1011" in content, "Error report must contain 1011 error code"
    assert "WebSocket Internal Protocol" in content, "Error report must categorize WebSocket error"
    assert "Troubleshooting & Recommended Fix" in content, "Error report must include advice"
    print("[PASS] Diagnostic error logging to txt verified.")

if __name__ == "__main__":
    test_screen_boundary_clamping()
    test_voice_mode_separation()
    test_diagnostic_error_txt_file()
    print("\n========================================================")
    print("=== ALL VOICE & SCREEN CLAMPING TESTS PASSED PERFECTLY ===")
    print("========================================================")
