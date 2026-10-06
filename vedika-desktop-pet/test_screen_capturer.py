import os
import sys
import asyncio
from unittest.mock import MagicMock, patch
from PySide6.QtWidgets import QApplication
from PySide6.QtGui import QPixmap, QImage, QColor
from PySide6.QtCore import Qt

# Ensure path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.screen_capturer import ScreenCapturer

def test_screen_capturer_normal_capture():
    app = QApplication.instance() or QApplication(sys.argv)
    capturer = ScreenCapturer()

    mock_screen = MagicMock()
    # Create a 1920x1080 test image
    img = QImage(1920, 1080, QImage.Format.Format_RGB32)
    img.fill(QColor(100, 150, 200))
    pixmap = QPixmap.fromImage(img)
    mock_screen.grabWindow.return_value = pixmap

    loop = asyncio.new_event_loop()
    future = loop.create_future()

    with patch.object(QApplication, 'primaryScreen', return_value=mock_screen):
        capturer.grab_screen_slot(future, loop)

    # Run loop tasks
    loop.run_until_complete(asyncio.sleep(0.01))

    assert future.done(), "Future should be resolved by grab_screen_slot"
    result_bytes = future.result()
    assert isinstance(result_bytes, bytes), "Result should be bytes"
    assert len(result_bytes) > 0, "Captured image bytes should not be empty"
    # JPEG magic header: FF D8 FF
    assert result_bytes[:3] == b'\xff\xd8\xff', "Captured image must be valid JPEG"

    # Verify downscaled image dimensions do not exceed 1280x720
    loaded_img = QImage()
    loaded_img.loadFromData(result_bytes, "JPEG")
    assert loaded_img.width() <= 1280, f"Width exceeded 1280: {loaded_img.width()}"
    assert loaded_img.height() <= 720, f"Height exceeded 720: {loaded_img.height()}"

    loop.close()
    print("[PASS] ScreenCapturer normal capture and JPEG downsampling verified.")

def test_screen_capturer_no_screen_failure_path():
    app = QApplication.instance() or QApplication(sys.argv)
    capturer = ScreenCapturer()

    loop = asyncio.new_event_loop()
    future = loop.create_future()

    with patch.object(QApplication, 'primaryScreen', return_value=None):
        capturer.grab_screen_slot(future, loop)

    loop.run_until_complete(asyncio.sleep(0.01))
    assert future.done(), "Future should be resolved even when screen is missing"
    assert future.result() == b"", "Result should be empty bytes when primary screen is None"

    loop.close()
    print("[PASS] ScreenCapturer no-screen fallback verified.")

def test_screen_capturer_exception_handling():
    app = QApplication.instance() or QApplication(sys.argv)
    capturer = ScreenCapturer()

    loop = asyncio.new_event_loop()
    future = loop.create_future()

    with patch.object(QApplication, 'primaryScreen', side_effect=RuntimeError("GPU context lost")):
        capturer.grab_screen_slot(future, loop)

    loop.run_until_complete(asyncio.sleep(0.01))
    assert future.done(), "Future should be resolved even on exception"
    assert future.result() == b"", "Result should be empty bytes on exception"

    loop.close()
    print("[PASS] ScreenCapturer exception safety verified.")

if __name__ == "__main__":
    test_screen_capturer_normal_capture()
    test_screen_capturer_no_screen_failure_path()
    test_screen_capturer_exception_handling()
    print("\n=== ALL SCREEN CAPTURER TESTS PASSED ===")
