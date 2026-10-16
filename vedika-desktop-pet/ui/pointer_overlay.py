import sys
import time
from PySide6.QtWidgets import QWidget, QApplication
from PySide6.QtCore import Qt, QTimer, QRectF, QPointF
from PySide6.QtGui import QPainter, QColor, QPen, QBrush, QFont

class PointerOverlay(QWidget):
    """
    Transparent Top-Most Laser Pointer & Sonar Ripple Overlay Window.
    Renders an animated glowing laser dot, sonar ripple ring, and floating text callout label
    at normalized screen coordinates (x, y) without blocking user clicks or input.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        # Configure window flags: frameless, transparent input, stays on top, tool window
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint |
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.WindowTransparentForInput |
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating, True)
        
        # Position overlay across the entire primary screen geometry
        screen = QApplication.primaryScreen()
        if screen:
            self.setGeometry(screen.geometry())
        else:
            self.setGeometry(0, 0, 1920, 1080)

        # Pointing state variables
        self.target_x = 0.0
        self.target_y = 0.0
        self.label_text = ""
        self.animation_start_time = 0.0
        self.pulse_radius = 20.0
        self.is_active = False

        # Screen Scanning state variables
        self.is_scanning = False
        self.scan_start_time = 0.0
        self.scan_duration = 1.4

        # Animation timer (60 FPS refresh rate = ~16ms)
        self.anim_timer = QTimer(self)
        self.anim_timer.setInterval(16)
        self.anim_timer.timeout.connect(self._on_anim_step)

        # Auto-hide timer
        self.hide_timer = QTimer(self)
        self.hide_timer.setSingleShot(True)
        self.hide_timer.timeout.connect(self.stop_pointing)

    def start_screen_scan(self, duration: float = 1.4):
        """
        Triggers a sleek, neat holographic laser scan animation across the desktop screen.
        Displays an animated scanline beam, futuristic HUD corner brackets, and top status capsule.
        """
        screen = QApplication.primaryScreen()
        if screen:
            geom = screen.geometry()
            self.setGeometry(geom)

        self.is_scanning = True
        self.scan_start_time = time.time()
        self.scan_duration = max(0.8, float(duration))

        print(f"[PointerOverlay] Neat Screen Scan initiated ({self.scan_duration:.1f}s)...")
        self.show()
        self.raise_()
        self.update()

        if not self.anim_timer.isActive():
            self.anim_timer.start()

    def point_at(self, x_norm: float, y_norm: float, label: str = "", duration: float = 3.5):
        """
        Triggers laser pointer and sonar pulse at normalized coordinates (0.0 to 1.0).
        x_norm: horizontal position (0.0 = left, 1.0 = right)
        y_norm: vertical position (0.0 = top, 1.0 = bottom)
        label: text callout label to display
        duration: visible duration in seconds before auto-fading
        """
        screen = QApplication.primaryScreen()
        if screen:
            geom = screen.geometry()
            self.setGeometry(geom)
            screen_w = geom.width()
            screen_h = geom.height()
        else:
            screen_w, screen_h = 1920, 1080

        # Map normalized coordinates to screen pixel positions
        self.target_x = max(0.0, min(1.0, float(x_norm))) * screen_w
        self.target_y = max(0.0, min(1.0, float(y_norm))) * screen_h
        self.label_text = label or "Notice this line"
        self.animation_start_time = time.time()
        self.pulse_radius = 15.0
        self.is_active = True

        print(f"[PointerOverlay] Pointing at screen pixel: ({int(self.target_x)}, {int(self.target_y)}) - Label: '{self.label_text}'")

        self.show()
        self.raise_()
        self.update()

        if not self.anim_timer.isActive():
            self.anim_timer.start()

        self.hide_timer.start(int(duration * 1000))

    def stop_pointing(self):
        """Stops animation and hides the overlay if no scan is active."""
        self.is_active = False
        if not self.is_scanning:
            self.anim_timer.stop()
            self.hide()
        self.update()

    def _on_anim_step(self):
        if not self.is_active and not self.is_scanning:
            self.anim_timer.stop()
            self.hide()
            return
        
        now = time.time()
        # Handle screen scan progress
        if self.is_scanning:
            elapsed_scan = now - self.scan_start_time
            if elapsed_scan >= self.scan_duration:
                self.is_scanning = False
                if not self.is_active:
                    self.anim_timer.stop()
                    self.hide()
                    return

        # Handle pointer pulse radius
        if self.is_active:
            elapsed = now - self.animation_start_time
            cycle = (elapsed * 3.0) % 1.0  # 3 pulses per second
            self.pulse_radius = 15.0 + (cycle * 40.0)

        self.update()

    def paintEvent(self, event):
        if not self.is_active and not self.is_scanning:
            return

        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)
        screen_w = self.width()
        screen_h = self.height()

        # -------------------------------------------------------------
        # 1. RENDER NEAT HOLOGRAPHIC SCREEN SCANNER
        # -------------------------------------------------------------
        if self.is_scanning:
            now = time.time()
            scan_elapsed = now - self.scan_start_time
            progress = min(1.0, max(0.0, scan_elapsed / self.scan_duration))
            
            # Fade in quickly at start (first 15%), fade out at end (last 20%)
            scan_alpha = 255
            if progress < 0.15:
                scan_alpha = int((progress / 0.15) * 255)
            elif progress > 0.80:
                scan_alpha = int(((1.0 - progress) / 0.20) * 255)

            scan_y = progress * screen_h
            trail_height = min(140.0, scan_y)

            # (a) Soft holographic trailing gradient sweep
            from PySide6.QtGui import QLinearGradient
            if trail_height > 2:
                grad = QLinearGradient(0, scan_y - trail_height, 0, scan_y)
                grad.setColorAt(0.0, QColor(56, 189, 248, 0))
                grad.setColorAt(0.7, QColor(56, 189, 248, int(scan_alpha * 0.12)))
                grad.setColorAt(1.0, QColor(129, 140, 248, int(scan_alpha * 0.28)))
                painter.fillRect(QRectF(0, scan_y - trail_height, screen_w, trail_height), QBrush(grad))

            # (b) Sharp, glowing laser beam across the screen
            beam_pen = QPen(QColor(56, 189, 248, int(scan_alpha * 0.45)), 5)
            painter.setPen(beam_pen)
            painter.drawLine(0, int(scan_y), screen_w, int(scan_y))

            core_pen = QPen(QColor(255, 255, 255, scan_alpha), 2)
            painter.setPen(core_pen)
            painter.drawLine(0, int(scan_y), screen_w, int(scan_y))

            # (c) High-tech HUD Corner Brackets
            bracket_len = 36
            bracket_pen = QPen(QColor(56, 189, 248, int(scan_alpha * 0.85)), 3)
            bracket_pen.setCapStyle(Qt.PenCapStyle.RoundCap)
            painter.setPen(bracket_pen)
            m = 24  # screen margin

            # Top-Left Bracket
            painter.drawLine(m, m, m + bracket_len, m)
            painter.drawLine(m, m, m, m + bracket_len)
            # Top-Right Bracket
            painter.drawLine(screen_w - m, m, screen_w - m - bracket_len, m)
            painter.drawLine(screen_w - m, m, screen_w - m, m + bracket_len)
            # Bottom-Left Bracket
            painter.drawLine(m, screen_h - m, m + bracket_len, screen_h - m)
            painter.drawLine(m, screen_h - m, m, screen_h - m - bracket_len)
            # Bottom-Right Bracket
            painter.drawLine(screen_w - m, screen_h - m, screen_w - m - bracket_len, screen_h - m)
            painter.drawLine(screen_w - m, screen_h - m, screen_w - m, screen_h - m - bracket_len)

            # (d) Floating Top Status Capsule [ 🔍 VEDIKA SCREEN SCAN • ACTIVE ]
            badge_w = 260
            badge_h = 32
            badge_x = (screen_w - badge_w) / 2.0
            badge_y = 20.0
            badge_rect = QRectF(badge_x, badge_y, badge_w, badge_h)

            painter.setPen(QPen(QColor(56, 189, 248, int(scan_alpha * 0.9)), 1.5))
            painter.setBrush(QBrush(QColor(15, 23, 42, int(scan_alpha * 0.92))))
            painter.drawRoundedRect(badge_rect, 16.0, 16.0)

            # Status pulsing dot
            dot_color = QColor(56, 189, 248, scan_alpha)
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(dot_color))
            painter.drawEllipse(QPointF(badge_x + 18, badge_y + 16), 4.5, 4.5)

            # Badge Text
            painter.setFont(QFont("Segoe UI", 9, QFont.Weight.DemiBold))
            painter.setPen(QColor(241, 245, 249, scan_alpha))
            painter.drawText(QRectF(badge_x + 28, badge_y, badge_w - 32, badge_h), Qt.AlignmentFlag.AlignCenter, "VEDIKA SCANNING SCREEN • 🔍")

        # -------------------------------------------------------------
        # 2. RENDER LASER POINTER & SONAR OVERLAY
        # -------------------------------------------------------------
        if self.is_active:
            tx = self.target_x
            ty = self.target_y

            # Calculate fade opacity based on remaining auto-hide time
            remaining_ms = self.hide_timer.remainingTime()
            alpha = 255
            if remaining_ms > 0 and remaining_ms < 500:
                alpha = int((remaining_ms / 500.0) * 255)

            # 1. Draw expanding sonar ripple ring (cyan/blue glow)
            ripple_alpha = int((1.0 - ((self.pulse_radius - 15.0) / 40.0)) * alpha * 0.7)
            ripple_pen = QPen(QColor(0, 220, 255, max(0, ripple_alpha)), 3, Qt.PenStyle.SolidLine)
            painter.setPen(ripple_pen)
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.drawEllipse(QPointF(tx, ty), self.pulse_radius, self.pulse_radius)

            # 2. Draw outer laser glow halo
            halo_pen = QPen(QColor(255, 50, 50, int(alpha * 0.3)), 1)
            painter.setPen(halo_pen)
            painter.setBrush(QBrush(QColor(255, 50, 50, int(alpha * 0.45))))
            painter.drawEllipse(QPointF(tx, ty), 12, 12)

            # 3. Draw core laser dot (bright magenta/red center)
            core_pen = QPen(QColor(255, 255, 255, alpha), 2)
            painter.setPen(core_pen)
            painter.setBrush(QBrush(QColor(255, 30, 80, alpha)))
            painter.drawEllipse(QPointF(tx, ty), 6, 6)

            # 4. Draw callout text tooltip box
            if self.label_text:
                painter.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                text_str = f"  🔍  {self.label_text}  "
                metrics = painter.fontMetrics()
                text_w = metrics.horizontalAdvance(text_str) + 16
                text_h = metrics.height() + 10

                # Position callout box slightly offset from target point
                box_x = tx + 18
                box_y = ty - text_h / 2
                
                # Clamp callout box to remain on-screen
                if box_x + text_w > self.width() - 10:
                    box_x = tx - text_w - 18
                if box_y < 10:
                    box_y = 10
                if box_y + text_h > self.height() - 10:
                    box_y = self.height() - text_h - 10

                # Draw rounded background tooltip rectangle
                box_rect = QRectF(box_x, box_y, text_w, text_h)
                bg_brush = QBrush(QColor(20, 24, 38, int(alpha * 0.92)))
                border_pen = QPen(QColor(0, 220, 255, alpha), 2)
                painter.setPen(border_pen)
                painter.setBrush(bg_brush)
                painter.drawRoundedRect(box_rect, 8.0, 8.0)

                # Draw tooltip text
                text_pen = QPen(QColor(255, 255, 255, alpha))
                painter.setPen(text_pen)
                painter.drawText(box_rect, Qt.AlignmentFlag.AlignCenter, text_str)

        painter.end()
