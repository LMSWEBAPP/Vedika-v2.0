import os
import sys
from unittest.mock import MagicMock, patch
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import Qt, QPoint, QPointF, QRectF
from PySide6.QtGui import QMouseEvent

# Ensure path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ui.transparent_window import TransparentWindow

def create_mock_pet():
    pet = MagicMock()
    pet.width = 115
    pet.height = 163
    pet.physics = MagicMock()
    pet.physics.width = 115
    pet.physics.height = 163
    pet.physics.is_dragging = False
    pet.interaction = MagicMock()
    pet.renderer = MagicMock()
    # Bottom PTT button rect placed below mascot
    pet.renderer.ptt_button_rect = QRectF(120, 225, 40, 26)
    return pet

def test_window_initialization_and_sizing():
    app = QApplication.instance() or QApplication(sys.argv)
    pet = create_mock_pet()
    main_app = MagicMock()

    win = TransparentWindow(pet, main_app, scale_factor=1.0)
    
    # Check window flags
    flags = win.windowFlags()
    assert bool(flags & Qt.WindowType.FramelessWindowHint), "Window must be frameless"
    assert bool(flags & Qt.WindowType.WindowStaysOnTopHint), "Window must stay on top"

    # Check sizing
    expected_w = max(pet.width + 60, 290)
    assert win.width() == expected_w, f"Expected width {expected_w}, got {win.width()}"
    assert win.height() == int(pet.height + win.bubble_offset + 38), f"Unexpected height: {win.height()}"
    print("[PASS] Window initialization and sizing verified.")

def test_window_ptt_mouse_press_and_release():
    app = QApplication.instance() or QApplication(sys.argv)
    pet = create_mock_pet()
    main_app = MagicMock()

    win = TransparentWindow(pet, main_app, scale_factor=1.0)

    # 1. Click directly inside PTT button
    press_event = MagicMock()
    press_event.button.return_value = Qt.MouseButton.LeftButton
    press_event.position.return_value = QPointF(140.0, 235.0) # Inside QRectF(120, 225, 40, 26)

    win.mousePressEvent(press_event)
    assert win.is_holding_ptt is True, "is_holding_ptt should be True on PTT click"
    pet.renderer.set_ptt_pressed.assert_called_with(True)
    main_app.start_push_to_talk.assert_called_once()
    print("[PASS] PTT mouse press triggered correctly.")

    # 2. Release mouse button
    release_event = MagicMock()
    release_event.button.return_value = Qt.MouseButton.LeftButton
    win.mouseReleaseEvent(release_event)
    assert win.is_holding_ptt is False, "is_holding_ptt should be False on release"
    pet.renderer.set_ptt_pressed.assert_called_with(False)
    pet.renderer.set_listening.assert_called_with(False)
    main_app.stop_push_to_talk.assert_called_once()
    print("[PASS] PTT mouse release triggered correctly.")

def test_window_drag_mouse_events():
    app = QApplication.instance() or QApplication(sys.argv)
    pet = create_mock_pet()
    main_app = MagicMock()

    win = TransparentWindow(pet, main_app, scale_factor=1.0)

    # Click on the mascot body (outside PTT button)
    press_event = MagicMock()
    press_event.button.return_value = Qt.MouseButton.LeftButton
    press_event.position.return_value = QPointF(50.0, 50.0) # Outside PTT button
    press_event.globalPosition.return_value = QPointF(500.0, 500.0)

    win.mousePressEvent(press_event)
    assert win.is_holding_ptt is False, "is_holding_ptt must be False when clicking mascot body"
    pet.interaction.handle_press.assert_called_with(500, 500)
    print("[PASS] Mascot body click initiated drag handler.")

    # Release drag
    pet.physics.is_dragging = True
    release_event = MagicMock()
    release_event.button.return_value = Qt.MouseButton.LeftButton
    win.mouseReleaseEvent(release_event)
    pet.interaction.handle_release.assert_called_once()
    print("[PASS] Mascot drag release handler verified.")

def test_window_mouse_move_without_left_held():
    app = QApplication.instance() or QApplication(sys.argv)
    pet = create_mock_pet()
    main_app = MagicMock()

    win = TransparentWindow(pet, main_app, scale_factor=1.0)
    win.is_holding_ptt = True
    pet.physics.is_dragging = True

    # Mouse move event without LeftButton held
    move_event = MagicMock()
    move_event.buttons.return_value = Qt.MouseButton.NoButton
    move_event.globalPosition.return_value = QPointF(100.0, 100.0)

    win.mouseMoveEvent(move_event)
    assert win.is_holding_ptt is False, "Failsafe should have cleared is_holding_ptt"
    main_app.stop_push_to_talk.assert_called_once()
    pet.interaction.handle_release.assert_called_once()
    print("[PASS] Mouse move failsafe without left-button held verified.")

if __name__ == "__main__":
    test_window_initialization_and_sizing()
    test_window_ptt_mouse_press_and_release()
    test_window_drag_mouse_events()
    test_window_mouse_move_without_left_held()
    print("\n=== ALL TRANSPARENT WINDOW TESTS PASSED ===")
