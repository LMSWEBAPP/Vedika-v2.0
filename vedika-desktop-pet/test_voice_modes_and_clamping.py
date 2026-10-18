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

def test_worker_exit_deduplication_and_multilingual_detection():
    print("\nTesting Worker Exit Deduplication, Fast AEC, & Per-Turn Language Detection...")
    from engine.gemini_live import detect_user_language, BlockNLMSEchoCanceller, GeminiLiveWorker
    import numpy as np

    # 1. Per-turn language detection across English, Telugu, Teluglish, Hindi, Hinglish
    assert detect_user_language("Hello Vedika, open the website") == "english"
    assert detect_user_language("ఈ కాన్సెప్ట్ ఏంటి?") == "telugu"
    assert detect_user_language("naku artham kaledu cheppu") == "teluglish"
    assert detect_user_language("मुझे समझ नहीं आया") == "hindi"
    assert detect_user_language("ye kya hai samjhao") == "hinglish"
    assert detect_user_language("What is titration?") == "english"
    print("[PASS] Per-turn language switching detection verified across English, Telugu, Teluglish, Hindi, and Hinglish.")

    # 2. Fast-path AEC when speaker is idle
    aec = BlockNLMSEchoCanceller()
    dummy_mic = (np.ones(800, dtype=np.int16) * 500).tobytes()
    aec.push_reference((np.ones(1200, dtype=np.int16) * 200).tobytes())
    res_idle, rms_idle = aec.process(dummy_mic, active_speaker=False)
    assert abs(rms_idle - 500.0) < 1.0, f"Expected fast-path RMS ~500.0, got {rms_idle}"
    print("[PASS] Fast-path AEC bypass during speaker idle verified.")

    # 3. Worker exit deduplication (no duplicate "I ran into a small surprise..." when _failure_notified=True)
    mock_pet = MagicMock()
    mock_app = MagicMock()
    client = GeminiLiveClient(mock_pet, mock_app)
    client.is_active = True
    worker = GeminiLiveWorker(client)
    worker._failure_notified = True
    client._last_active_worker = worker
    client.worker_thread = worker

    error_signals = []
    client.error_occurred.connect(lambda g, t: error_signals.append((g, t)))
    client._on_worker_thread_finished(worker)
    assert len(error_signals) == 0, f"Expected 0 duplicate errors when worker already notified failure, got {error_signals}"
    client.is_active = False
    print("[PASS] Duplicate 'I ran into a small surprise...' error suppression verified.")


def test_numbered_study_notes_creation_and_targeting():
    print("\n--- Testing Numbered Study Notes (Default New Note, Same Note, & Target Note #N) ---")
    from engine.memory import MemoryManager
    from engine.gemini_live import GeminiLiveClient, GeminiLiveWorker

    mm = MemoryManager()
    test_lesson = f"test_lesson_{int(time.time())}"

    mock_pet = MagicMock()
    mock_app = MagicMock()
    client = GeminiLiveClient(mock_pet, mock_app)
    client.active_webapp_context = {
        "courseId": "bio_test",
        "courseTitle": "Biology Test",
        "lessonId": test_lesson,
        "lessonTitle": "Cell Organelles",
        "timestampSeconds": 310,
        "timestampFormatted": "05:10"
    }
    worker = GeminiLiveWorker(client)

    broadcasts = []
    client.broadcast_webapp_requested.connect(lambda d: broadcasts.append(d))

    # 1. Default behavior: Every note request without specifying where creates a BRAND NEW note
    worker.current_turn_user_transcription = "Add a note that mitochondria generate ATP"
    res1 = worker.execute_add_study_note("Mitochondria generate ATP", create_new=False)  # Even if model passes False, user didn't say 'same note'!
    assert res1["status"] == "success"
    assert res1["is_updated"] is False, f"Expected brand new note (is_updated=False), got {res1}"
    assert res1["note_number"] == 1, f"Expected Note #1, got {res1}"

    worker.current_turn_user_transcription = "Add a note that ribosomes synthesize proteins"
    res2 = worker.execute_add_study_note("Ribosomes synthesize proteins", create_new=False)
    assert res2["status"] == "success"
    assert res2["is_updated"] is False, f"Expected second brand new note (is_updated=False), got {res2}"
    assert res2["note_number"] == 2, f"Expected Note #2, got {res2}"

    # 2. Explicit 'same note' appends to the latest note (Note #2)
    worker.current_turn_user_transcription = "Add this in the same note: Rough ER has attached ribosomes"
    res3 = worker.execute_add_study_note("Rough ER has attached ribosomes", create_new=False)
    assert res3["status"] == "success"
    assert res3["is_updated"] is True, f"Expected update to same note (is_updated=True), got {res3}"
    assert res3["note_number"] == 2, f"Expected Note #2 to be updated, got {res3}"
    assert "Ribosomes synthesize proteins" in res3["saved_note"] and "Rough ER has attached ribosomes" in res3["saved_note"]

    # 3. Targeting a specific note number by voice ("add this point in note 1")
    worker.current_turn_user_transcription = "Add this point in note 1 that inner membrane has cristae folds"
    res4 = worker.execute_add_study_note("Inner membrane has cristae folds")
    assert res4["status"] == "success"
    assert res4["is_updated"] is True, f"Expected update to Note #1, got {res4}"
    assert res4["note_number"] == 1, f"Expected Note #1 to be updated, got {res4}"
    assert "Mitochondria generate ATP" in res4["saved_note"] and "Inner membrane has cristae folds" in res4["saved_note"]

    # Clean up test notes
    for n in mm.get_notebook_notes(lesson_id=test_lesson):
        mm.delete_notebook_note(int(n["id"]))

    print("[PASS] Numbered study notes (Note #1, Note #2, same-note append, and Note #N targeting) verified.")


if __name__ == "__main__":
    test_screen_boundary_clamping()
    test_voice_mode_separation()
    test_diagnostic_error_txt_file()
    test_worker_exit_deduplication_and_multilingual_detection()
    test_numbered_study_notes_creation_and_targeting()
    print("\n========================================================")
    print("=== ALL VOICE & SCREEN CLAMPING TESTS PASSED PERFECTLY ===")
    print("========================================================")
