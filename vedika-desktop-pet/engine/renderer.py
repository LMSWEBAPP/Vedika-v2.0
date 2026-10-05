import math
from PySide6.QtGui import QPainter, QColor, QFont, QFontMetrics, QPen, QBrush, QPolygonF
from PySide6.QtCore import Qt, QRectF, QPointF

class Renderer:
    def __init__(self, pet):
        self.pet = pet
        self.speech_text = ""
        self.user_speech_text = ""
        self.speech_timer = 0.0
        self.max_duration = 3.0
        self.bubble_height = 58  # Increased height offset for responsive 2-line dialogue bubble and graceful error card

        # Aesthetic Study Timer Capsule State
        self.timer_active = False
        self.timer_seconds = 0.0
        self.timer_total = 0.0
        self.timer_label = "Study Timer"

        # Graceful Error Notification State
        self.error_text = ""
        self.error_tech_text = ""
        self.error_timer = 0.0

        # Dynamic Voice Listening Indicator State
        self.is_listening = False
        self.listen_anim_phase = 0.0

        # Dedicated Push-to-Talk Button State
        self.is_ptt_pressed = False
        self.ptt_button_rect = QRectF()

    def set_speech(self, text, duration=3.0, user_text=None):
        """Displays a responsive speech capsule above the pet."""
        if not text and not user_text:
            self.speech_text = ""
            self.user_speech_text = ""
            self.speech_timer = 0.0
            return
            
        self.speech_text = text.strip() if text else ""
        self.user_speech_text = user_text.strip() if user_text else ""
        
        all_words = (self.speech_text + " " + self.user_speech_text).split()
        calculated_duration = max(duration, min(8.0, len(all_words) * 0.35 + 2.0))
        self.speech_timer = calculated_duration
        self.max_duration = calculated_duration

    def set_dialogue(self, user_text, ai_text, duration=5.0):
        """Sets live dual-line subtitles for User and AI dialogue."""
        if not user_text and not ai_text:
            self.speech_text = ""
            self.user_speech_text = ""
            self.speech_timer = 0.0
            return

        self.user_speech_text = user_text.strip() if user_text else ""
        self.speech_text = ai_text.strip() if ai_text else ""
        
        all_words = (self.speech_text + " " + self.user_speech_text).split()
        calculated_duration = max(duration, min(8.5, len(all_words) * 0.35 + 2.0))
        self.speech_timer = calculated_duration
        self.max_duration = calculated_duration

    def set_error(self, graceful_text, tech_text=None, duration=7.0):
        """Displays a distinct, graceful error notification block."""
        self.error_text = str(graceful_text).strip() if graceful_text else ""
        self.error_tech_text = str(tech_text).strip() if tech_text else ""
        self.error_timer = float(duration)

    def set_listening(self, is_listening: bool):
        """Controls real-time dynamic listening indicator state."""
        self.is_listening = bool(is_listening)

    def set_ptt_pressed(self, is_pressed: bool):
        """Updates Push-to-Talk visual state."""
        self.is_ptt_pressed = bool(is_pressed)

    def start_timer(self, seconds: float, label: str = "Study Timer"):
        """Starts the aesthetic timer capsule displayed below the pet."""
        self.timer_seconds = float(seconds)
        self.timer_total = float(seconds)
        self.timer_label = label.strip() or "Study Timer"
        self.timer_active = True
        print(f"[Renderer] Started study timer: {seconds}s ({self.timer_label})")

    def stop_timer(self):
        """Stops the active study timer."""
        self.timer_active = False
        self.timer_seconds = 0.0

    def update(self, dt):
        """Updates text display timers, countdown timers, and animations."""
        if self.speech_timer > 0.0:
            self.speech_timer -= dt
            if self.speech_timer <= 0.0:
                self.speech_text = ""
                self.user_speech_text = ""
                self.speech_timer = 0.0

        if self.error_timer > 0.0:
            self.error_timer -= dt
            if self.error_timer <= 0.0:
                self.error_text = ""
                self.error_tech_text = ""
                self.error_timer = 0.0

        if self.is_listening:
            self.listen_anim_phase = (self.listen_anim_phase + dt * 6.5) % (2.0 * math.pi)

        if self.timer_active:
            self.timer_seconds -= dt
            if self.timer_seconds <= 0.0:
                self.timer_active = False
                self.timer_seconds = 0.0
                self.set_speech(f"⏰ Time's up! {self.timer_label} finished! 🎉", duration=4.5)
                self.pet.play_sound("alarm") if hasattr(self.pet, "play_sound") else None

    def draw(self, painter, scale, window_w=None):
        """
        Renders the pet, compact speech capsule, dynamic listening element,
        graceful error card, and bottom timer/PTT capsules with full breathing room.
        """
        scaled_bubble_offset = int(self.bubble_height * scale)
        scaled_pet_w = int(self.pet.physics.width)
        scaled_pet_h = int(self.pet.physics.height)
        
        # Calculate horizontal position: horizontally center mascot in the window
        actual_win_w = window_w if window_w else scaled_pet_w
        pet_x = max(int(6 * scale), (actual_win_w - scaled_pet_w) // 2)
        cx = pet_x + (scaled_pet_w / 2.0)

        # 1. Draw Pet Sprite
        pixmap = self.pet.sprite.get_current_pixmap()
        if pixmap:
            painter.drawPixmap(pet_x, scaled_bubble_offset, scaled_pet_w, scaled_pet_h, pixmap)

        # 2. Draw Error Block OR Speech Capsule (Positioned above pet head)
        if self.error_text:
            self._draw_graceful_error_card(painter, cx, actual_win_w, scaled_bubble_offset, scale)
        elif self.speech_text or self.user_speech_text:
            self._draw_compact_speech_pill(painter, cx, actual_win_w, scaled_bubble_offset, scale)

        # 3. Draw Mic Icon & Equalizer Listening Bars placed BELOW Vedika Mascot (centered)
        bottom_y = scaled_bubble_offset + scaled_pet_h + int(5 * scale)
        self._draw_bottom_voice_controls(painter, cx, bottom_y, scale)

        # 4. Draw Aesthetic Timer Capsule (Positioned cleanly below the voice controls if active)
        if self.timer_active:
            self._draw_timer_capsule(painter, cx, actual_win_w, bottom_y + int(24 * scale), scale)

    def _draw_compact_speech_pill(self, painter, cx, win_w, bubble_h, scale):
        """Draws a responsive 2-line glassmorphism speech capsule with dual User & AI dialogue or wrapped text."""
        if not self.speech_text and not self.user_speech_text:
            return

        font_size = max(8, int(8.5 * scale))
        font = QFont("Segoe UI", font_size)
        font.setWeight(QFont.Weight.Medium)
        painter.setFont(font)

        fm = QFontMetrics(font)
        line_h = fm.height()
        
        # Generous width margin with safe bounds
        max_pill_w = min(win_w - 10, max(int(win_w * 0.94), int(220 * scale)))
        padding_h = max(8, int(10 * scale))
        padding_v = max(4, int(5 * scale))
        line_spacing = max(1, int(2 * scale))
        max_text_w = max_pill_w - (padding_h * 2)

        is_dual = bool(self.user_speech_text and self.speech_text)
        
        if is_dual:
            # Dual-line mode: Line 1 = User, Line 2 = Vedika
            user_display = fm.elidedText(f"👤 You: {self.user_speech_text}", Qt.TextElideMode.ElideRight, max_text_w)
            ai_display = fm.elidedText(f"🤖 Vedika: {self.speech_text}", Qt.TextElideMode.ElideRight, max_text_w)
            
            w1 = fm.horizontalAdvance(user_display)
            w2 = fm.horizontalAdvance(ai_display)
            pill_w = min(max_pill_w, max(w1, w2) + padding_h * 2)
            pill_h = (line_h * 2) + (padding_v * 2) + line_spacing
            num_lines = 2
        else:
            # Single-speaker mode: Wrap up to 2 lines if long
            raw_text = self.speech_text if self.speech_text else self.user_speech_text
            prefix = "👤 You: " if self.user_speech_text else ""
            full_text = f"{prefix}{raw_text}"
            
            if fm.horizontalAdvance(full_text) <= max_text_w:
                display_line1 = full_text
                display_line2 = ""
                pill_w = min(max_pill_w, fm.horizontalAdvance(display_line1) + padding_h * 2)
                pill_h = line_h + (padding_v * 2)
                num_lines = 1
            else:
                display_line1, display_line2 = self._wrap_two_lines(fm, full_text, max_text_w)
                if display_line2:
                    w1 = fm.horizontalAdvance(display_line1)
                    w2 = fm.horizontalAdvance(display_line2)
                    pill_w = min(max_pill_w, max(w1, w2) + padding_h * 2)
                    pill_h = (line_h * 2) + (padding_v * 2) + line_spacing
                    num_lines = 2
                else:
                    pill_w = min(max_pill_w, fm.horizontalAdvance(display_line1) + padding_h * 2)
                    pill_h = line_h + (padding_v * 2)
                    num_lines = 1

        pill_x = max(6.0, min(cx - (pill_w / 2.0), win_w - pill_w - 6.0))
        # Sits with a 2px gap right above the pet's head
        pill_y = max(2.0, bubble_h - pill_h - int(3 * scale))
        pill_rect = QRectF(pill_x, pill_y, pill_w, pill_h)

        corner_radius = min(8.0, pill_h / 3.0)

        # Soft drop shadow
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor(0, 0, 0, 110))
        painter.drawRoundedRect(pill_rect.adjusted(-1.5, 1.5, 1.5, 3.0), corner_radius, corner_radius)

        # Modern Obsidian Glass Body with glowing cyan border
        painter.setPen(QPen(QColor(56, 189, 248, 220), max(1, int(1.1 * scale))))
        painter.setBrush(QBrush(QColor(13, 16, 26, 245)))
        painter.drawRoundedRect(pill_rect, corner_radius, corner_radius)

        # Downward indicator arrow pointing toward pet head
        arrow = QPolygonF()
        by = pill_y + pill_h
        arrow_h = int(3 * scale)
        arrow.append(QPointF(cx - int(3.5 * scale), by))
        arrow.append(QPointF(cx + int(3.5 * scale), by))
        arrow.append(QPointF(cx, by + arrow_h))

        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(13, 16, 26, 245)))
        painter.drawPolygon(arrow)

        # Text Drawing with clean color accents
        if is_dual:
            # Line 1: User Question in Vibrant Cyan
            painter.setPen(QColor(56, 189, 248))
            r1 = QRectF(pill_x + padding_h, pill_y + padding_v, pill_w - padding_h * 2, line_h)
            painter.drawText(r1, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, user_display)

            # Line 2: AI / Vedika Answer in Bright Platinum White
            painter.setPen(QColor(248, 250, 252))
            r2 = QRectF(pill_x + padding_h, pill_y + padding_v + line_h + line_spacing, pill_w - padding_h * 2, line_h)
            painter.drawText(r2, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, ai_display)
        else:
            if num_lines == 1:
                painter.setPen(QColor(248, 250, 252))
                painter.drawText(pill_rect, Qt.AlignmentFlag.AlignCenter, display_line1)
            else:
                painter.setPen(QColor(248, 250, 252))
                r1 = QRectF(pill_x + padding_h, pill_y + padding_v, pill_w - padding_h * 2, line_h)
                r2 = QRectF(pill_x + padding_h, pill_y + padding_v + line_h + line_spacing, pill_w - padding_h * 2, line_h)
                painter.drawText(r1, Qt.AlignmentFlag.AlignCenter, display_line1)
                painter.drawText(r2, Qt.AlignmentFlag.AlignCenter, display_line2)

    def _wrap_two_lines(self, fm, text, max_w):
        """Splits long text across 2 balanced lines without mid-word cutting."""
        words = text.split()
        if not words:
            return "", ""
        
        line1 = ""
        idx = 0
        while idx < len(words):
            test_line = (line1 + " " + words[idx]).strip() if line1 else words[idx]
            if fm.horizontalAdvance(test_line) <= max_w:
                line1 = test_line
                idx += 1
            else:
                break
                
        if idx < len(words):
            rem = " ".join(words[idx:])
            line2 = fm.elidedText(rem, Qt.TextElideMode.ElideRight, max_w)
            return line1, line2
        return line1, ""

    def _draw_timer_capsule(self, painter, cx, win_w, top_y, scale):
        """Draws an aesthetic glowing timer capsule below the pet with safe bounds."""
        total_secs = int(max(0, self.timer_seconds))
        mins = total_secs // 60
        secs = total_secs % 60
        time_str = f"{mins:02d}:{secs:02d}"

        font_size = max(8, int(8.5 * scale))
        font = QFont("Segoe UI", font_size)
        font.setWeight(QFont.Weight.DemiBold)
        painter.setFont(font)

        fm = QFontMetrics(font)
        
        # Display: '⏱️ 14:59 Math'
        label_short = fm.elidedText(self.timer_label, Qt.TextElideMode.ElideRight, int(70 * scale))
        timer_text = f"⏱️ {time_str} {label_short}" if label_short else f"⏱️ {time_str}"
        
        text_w = fm.horizontalAdvance(timer_text)
        padding_h = max(8, int(9 * scale))
        padding_v = max(3, int(4 * scale))
        
        max_cap_w = win_w - 12
        capsule_w = min(max_cap_w, text_w + padding_h * 2)
        capsule_h = fm.height() + padding_v * 2
        
        capsule_x = max(6.0, min(cx - (capsule_w / 2.0), win_w - capsule_w - 6.0))
        capsule_y = top_y + int(4 * scale)

        capsule_rect = QRectF(capsule_x, capsule_y, capsule_w, capsule_h)

        # Soft neon ambient glow
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor(6, 182, 212, 50)) # Cyan neon glow
        painter.drawRoundedRect(capsule_rect.adjusted(-2, -1, 2, 2), int(capsule_h / 2.0), int(capsule_h / 2.0))

        # Sleek Neon Capsule Body
        painter.setPen(QPen(QColor(34, 211, 238, 220), max(1, int(1.2 * scale)))) # Bright Cyan Border
        painter.setBrush(QBrush(QColor(10, 14, 23, 245)))
        painter.drawRoundedRect(capsule_rect, int(capsule_h / 2.0), int(capsule_h / 2.0))

        # High-Contrast Glowing Cyan Text
        painter.setPen(QColor(165, 243, 252))
        painter.drawText(
            capsule_rect,
            Qt.AlignmentFlag.AlignCenter,
            timer_text
        )

    def _draw_graceful_error_card(self, painter, cx, win_w, bubble_h, scale):
        """Displays a graceful sentence text block when a sudden system error or connection drop occurs."""
        if not self.error_text:
            return

        # Requirement 2: Error warning looking very small -> enlarge font to clear, legible size!
        font_size = max(10, int(10.5 * scale))
        font = QFont("Segoe UI", font_size)
        font.setWeight(QFont.Weight.DemiBold)
        painter.setFont(font)
        fm = QFontMetrics(font)
        line_h = fm.height()

        # Generous bounds
        max_card_w = min(win_w - 12, max(int(win_w * 0.92), int(260 * scale)))
        padding_h = max(10, int(12 * scale))
        padding_v = max(5, int(6 * scale))
        line_spacing = max(2, int(3 * scale))
        max_text_w = max_card_w - (padding_h * 2)

        has_tech = bool(self.error_tech_text)
        line1 = fm.elidedText(f"⚠️ {self.error_text}", Qt.TextElideMode.ElideRight, max_text_w)
        line2 = fm.elidedText(f"ℹ️ {self.error_tech_text}", Qt.TextElideMode.ElideRight, max_text_w) if has_tech else ""

        w1 = fm.horizontalAdvance(line1)
        w2 = fm.horizontalAdvance(line2) if line2 else 0
        card_w = min(max_card_w, max(w1, w2) + padding_h * 2)
        card_h = (line_h * (2 if line2 else 1)) + (padding_v * 2) + (line_spacing if line2 else 0)

        # Requirement 1: Clamp card_x safely so it is NEVER cut on the left side!
        card_x = max(6.0, min(cx - (card_w / 2.0), win_w - card_w - 6.0))
        card_y = max(2.0, bubble_h - card_h - int(3 * scale))
        card_rect = QRectF(card_x, card_y, card_w, card_h)
        corner_radius = min(8.0, card_h / 3.0)

        # Soft amber/coral glow
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor(244, 63, 94, 75))
        painter.drawRoundedRect(card_rect.adjusted(-2, 1, 2, 3), corner_radius, corner_radius)

        # Dark ruby obsidian glass body
        painter.setPen(QPen(QColor(251, 113, 133, 240), max(1, int(1.2 * scale))))
        painter.setBrush(QBrush(QColor(18, 10, 14, 250)))
        painter.drawRoundedRect(card_rect, corner_radius, corner_radius)

        # Downward indicator arrow pointing toward pet head
        arrow = QPolygonF()
        by = card_y + card_h
        arrow_h = int(3 * scale)
        arrow.append(QPointF(cx - int(3.5 * scale), by))
        arrow.append(QPointF(cx + int(3.5 * scale), by))
        arrow.append(QPointF(cx, by + arrow_h))

        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(QColor(18, 10, 14, 250)))
        painter.drawPolygon(arrow)

        # Requirement 2: Pure bright white text for maximum clarity and contrast
        painter.setPen(QColor(255, 255, 255))
        r1 = QRectF(card_x + padding_h, card_y + padding_v, card_w - padding_h * 2, line_h)
        painter.drawText(r1, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, line1)

        if line2:
            painter.setPen(QColor(241, 245, 249))  # Clean bright platinum white
            r2 = QRectF(card_x + padding_h, card_y + padding_v + line_h + line_spacing, card_w - padding_h * 2, line_h)
            painter.drawText(r2, Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, line2)

    def _draw_bottom_voice_controls(self, painter, cx, top_y, scale):
        """
        Draws the mic icon (Hold to Speak) and dancing equalizer listening bars 
        PLACED DIRECTLY BELOW VEDIKA MASCOT, centered horizontally with ZERO backgrounds.
        """
        icon_size = max(20, int(22 * scale))
        gap = int(6 * scale)
        bar_w = max(2.0, 2.5 * scale)
        bar_spacing = max(1.5, 2.0 * scale)
        total_bars_w = (4 * bar_w) + (3 * bar_spacing)
        total_ctrl_w = icon_size + gap + total_bars_w

        # Center the voice control cluster directly underneath Vedika's body (at cx)
        start_x = cx - (total_ctrl_w / 2.0)
        center_y = top_y + (icon_size / 2.0)

        # 1. Mic Icon (Hold to Speak target - NO BACKGROUND)
        self.ptt_button_rect = QRectF(start_x, top_y, icon_size, icon_size)

        is_held = self.is_ptt_pressed
        main_app = getattr(self.pet, 'main_app', None)
        client = getattr(main_app, 'gemini_client', None) if main_app else None
        is_continuous = bool(client and getattr(client, 'is_continuous_mode', False))
        is_active = is_held or is_continuous

        # Subtle radiant glow halo when active/held (no box or pill!)
        if is_active:
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QColor(244, 63, 94, 75))  # Soft coral-crimson pulse
            painter.drawEllipse(self.ptt_button_rect.center(), icon_size * 0.65, icon_size * 0.65)

        # Draw the Mic Icon cleanly without any background
        painter.setFont(QFont("Segoe UI Emoji", max(11, int(13 * scale))))
        painter.setPen(QColor(244, 63, 94) if is_active else QColor(56, 189, 248))
        painter.drawText(self.ptt_button_rect, Qt.AlignmentFlag.AlignCenter, "🎙️")

        # 2. Equalizer Listening Bars (Right beside the mic icon below Vedika - ZERO BACKGROUND)
        bars_x = start_x + icon_size + gap
        base_y = center_y + int(6 * scale)
        phase = self.listen_anim_phase

        # 4 dynamic animated equalizer bars when listening
        if self.is_listening:
            h_vals = [
                3.0 + 6.0 * (math.sin(phase) + 1.0) / 2.0,
                3.0 + 11.0 * (math.sin(phase + 1.2) + 1.0) / 2.0,
                3.0 + 8.5 * (math.sin(phase + 2.4) + 1.0) / 2.0,
                3.0 + 5.5 * (math.sin(phase + 3.6) + 1.0) / 2.0,
            ]
            bar_color = QColor(52, 211, 153)  # Bright neon emerald
        elif is_continuous:
            # Idle gentle breath bars in continuous chat mode
            h_vals = [2.5, 4.0, 3.5, 2.5]
            bar_color = QColor(56, 189, 248, 160)  # Calm glowing cyan
        else:
            # Clean resting dots when dormant
            h_vals = [2.0, 2.0, 2.0, 2.0]
            bar_color = QColor(148, 163, 184, 110)  # Muted slate dots

        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(bar_color))
        for i, bh in enumerate(h_vals):
            bx = bars_x + i * (bar_w + bar_spacing)
            by = base_y - bh
            painter.drawRoundedRect(QRectF(bx, by, bar_w, bh), 1.0, 1.0)

    def _draw_side_by_side_voice_controls(self, painter, pet_x, pet_y, pet_w, pet_h, scale):
        """Backward compatibility helper redirecting to bottom voice controls."""
        cx = pet_x + (pet_w / 2.0)
        self._draw_bottom_voice_controls(painter, cx, pet_y + pet_h + int(5 * scale), scale)
