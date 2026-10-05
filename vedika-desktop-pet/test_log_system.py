import os
import sys
import time
from PySide6.QtWidgets import QApplication

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ui.log_viewer import LogViewerDialog, log_emitter

def test_log_system():
    app = QApplication.instance() or QApplication(sys.argv)
    
    logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    
    session_file = os.path.join(logs_dir, "session_test_sample.log")
    with open(session_file, "w", encoding="utf-8") as f:
        f.write("[Test] Sample log line 1\n[VAD] Speech detected\n[ERROR] Test error condition\n")
        
    crash_file = os.path.join(logs_dir, "crash_test_sample.log")
    with open(crash_file, "w", encoding="utf-8") as f:
        f.write("=== CRASH REPORT ===\nTraceback (most recent call last):\nException: Test Crash\n")
        
    print(f"Created test log files in {logs_dir}")
    
    dialog = LogViewerDialog(logs_dir=logs_dir, current_session_path=session_file)
    assert dialog.file_combo.count() >= 2, "Expected at least 2 log files in combo!"
    print(f"Loaded {dialog.file_combo.count()} files in LogViewerDialog combo box.")
    
    # Test search filter
    dialog.search_input.setText("VAD")
    text = dialog.log_text_edit.toPlainText()
    assert "Speech detected" in text, "Filter did not retain VAD line!"
    assert "Test error" not in text, "Filter did not remove non-matching line!"
    print("Filter logic verified successfully.")
    
    # Test live stream
    dialog.search_input.clear()
    log_emitter.new_log_line.emit("[Live] Incoming real-time test log line")
    app.processEvents()
    new_text = dialog.log_text_edit.toPlainText()
    assert "Incoming real-time test log line" in new_text, "Live log line was not appended!"
    print("Live log streaming verified successfully.")
    
    # Cleanup test files
    for f in (session_file, crash_file):
        if os.path.exists(f):
            os.remove(f)
            
    print("\n=== LOG SYSTEM & LOG VIEWER TESTS PASSED PERFECTLY ===")

if __name__ == "__main__":
    test_log_system()
