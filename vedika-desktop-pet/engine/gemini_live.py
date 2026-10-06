import os
import sys
import re
import json
import base64
import time
import datetime
import asyncio
import socket
from queue import Queue as ThreadSafeQueue

# Force IPv4 resolution for network connections to bypass ISP IPv6 blackholes (common on Windows)
_orig_getaddrinfo = socket.getaddrinfo
def _prefer_ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if family == 0 or family == socket.AF_UNSPEC:
        family = socket.AF_INET
    return _orig_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = _prefer_ipv4_getaddrinfo

from PySide6.QtCore import QObject, QUrl, Slot, Signal, QIODevice, QByteArray, QTimer, QThread
from PySide6.QtMultimedia import QAudioSource, QAudioSink, QAudioFormat, QMediaDevices, QAudio

from google import genai
from google.genai import types
import pyaudio
import numpy as np

from engine.user_profile import UserProfileManager
from engine.memory import MemoryManager

def load_routes_for_prompt() -> str:
    """Reads routes.json and formats instructions for Gemini Live model."""
    routes_path = "routes.json"
    if os.path.exists(routes_path):
        try:
            with open(routes_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                lines = []
                for item in data.get("routes", []):
                    r_id = item.get("id")
                    label = item.get("label", "")
                    aliases = ", ".join(item.get("aliases", []))
                    lines.append(f"   - '{r_id}' for {label} ({aliases}).")
                if lines:
                    return "\n".join(lines) + "\n"
        except Exception as e:
            print(f"[!] Warning: Could not parse routes.json for system prompt: {e}")

    return (
        "   - '/' for Dashboard / Main home page.\n"
        "   - '/courses' for Courses and learning modules.\n"
        "   - '/vedika-ai' for Vedika AI Tutor.\n"
        "   - '/vedika-ai/code' for Coding Tutor.\n"
        "   - '/code-puzzle' for Coding Puzzles and practice problems.\n"
        "   - '/viva-interview' for Viva & Interview prep.\n"
        "   - '/vedika-labs' for Virtual Science/Math Labs.\n"
        "   - '/jobs' for Jobs and placements.\n"
        "   - '/progress' for Student progress and stats.\n"
    )

def analyze_sentiment(text: str) -> dict:
    """Analyzes multilingual sentiment in student speech input (matching voice-server.js)."""
    lowercase = text.lower()
    confused_words = [
        "don't understand", "do not understand", "dont understand", "not sure", "confused",
        "cannot get", "cant get", "difficult", "hard", "stuck", "doubt", "explain again",
        "unclear", "lost", "struggling", "help", "confusing", "అర్థం కాలేదు", "కష్టంగా ఉంది",
        "సందేహం", "తెలియదు", "మళ్ళీ చెప్పండి", "కన్ఫ్యూజ్", "ardham raledu", "artham kaledu",
        "kashtanga undi", "malli cheppandi", "samajh nahi", "mushkil", "kathin", "shanka",
        "phirse", "phir se", "pareshani", "confuse", "sandeha"
    ]
    positive_words = [
        "understand", "got it", "easy", "awesome", "perfect", "clear", "great", "wow",
        "fantastic", "amazing", "makes sense", "thank you", "thanks", "excellent", "brilliant",
        "అర్థమైంది", "సులభంగా ఉంది", "చాలా బాగుంది", "థాంక్స్", "సూపర్", "అవును", "ardhamaindi",
        "sulabhanga undi", "chala bagundi", "samajh gaya", "samajh gya", "aasan", "saral",
        "badhiya", "bahut achha", "clear hai", "dhanyawad", "shukriya"
    ]
    curious_words = [
        "what is", "how do", "tell me about", "why is", "curious", "interested", "learn",
        "know", "question", "ఏమిటి", "ఎలా", "ఎందుకు", "తెలుసుకోవాలి", "emiti", "ela",
        "enduku", "telusukovali", "kya hai", "kaise", "kyun", "jaan na"
    ]
    confused_count = sum(1 for w in confused_words if w in lowercase)
    positive_count = sum(1 for w in positive_words if w in lowercase)
    curious_count = sum(1 for w in curious_words if w in lowercase)

    if confused_count > positive_count and confused_count >= curious_count:
        return {"label": "Struggling / Confused", "score": -0.6, "emoji": "😟"}
    if positive_count > confused_count and positive_count >= curious_count:
        return {"label": "Happy / Confident", "score": 0.8, "emoji": "😊"}
    if curious_count > confused_count and curious_count > positive_count:
        return {"label": "Curious / Inquisitive", "score": 0.4, "emoji": "🤔"}
    return {"label": "Calm / Conversational", "score": 0.0, "emoji": "😐"}

def detect_user_language(text: str) -> str:
    """Detects primary language/script in user question for immediate language mirroring (Requirement 5)."""
    if not text:
        return "english"
    # Check Telugu Unicode range (0x0C00 - 0x0C7F)
    if any(0x0C00 <= ord(c) <= 0x0C7F for c in text):
        return "telugu"
    # Check Devanagari / Hindi Unicode range (0x0900 - 0x097F)
    if any(0x0900 <= ord(c) <= 0x097F for c in text):
        return "hindi"
    # Check Tamil Unicode range (0x0B80 - 0x0BFF)
    if any(0x0B80 <= ord(c) <= 0x0BFF for c in text):
        return "tamil"
    lower = text.lower()
    teluglish_words = {"enti", "cheppandi", "cheppu", "ela", "enduku", "artham", "ardham", "kaledu", "bagundi", "avunu", "leka", "chudu", "emiti"}
    hinglish_words = {"kya", "kaise", "kyun", "batao", "samjhao", "samajh", "aaya", "nahi", "phir", "accha", "theek", "bhai", "dekho", "hai", "mujhe"}
    words = set(re.findall(r'[a-zA-Z]+', lower))
    if words & teluglish_words:
        return "teluglish"
    if words & hinglish_words:
        return "hinglish"
    return "english"

class BlockNLMSEchoCanceller:
    """
    Normalized Least Mean Squares (NLMS) Adaptive Echo Canceller in pure NumPy.
    Subtracts known speaker audio (reference signal) from microphone input in real time.
    """
    def __init__(self, filter_len=256, mu=0.1, mic_rate=16000, ref_rate=24000):
        self.filter_len = filter_len
        self.mu = mu
        self.mic_rate = mic_rate
        self.ref_rate = ref_rate
        self.w = np.zeros(filter_len, dtype=np.float32)
        self.ref_history = np.zeros(filter_len * 8, dtype=np.float32)

    def push_reference(self, ref_bytes: bytes):
        """Pushes speaker audio chunk to reference history buffer (resampled from 24kHz to 16kHz)."""
        ref = np.frombuffer(ref_bytes, dtype=np.int16).astype(np.float32)
        if len(ref) == 0:
            return
        step = self.ref_rate / self.mic_rate
        indices = np.arange(0, len(ref), step).astype(int)
        indices = np.clip(indices, 0, len(ref) - 1)
        ref_16k = ref[indices]
        self.ref_history = np.concatenate([self.ref_history, ref_16k])[-self.filter_len * 8:]

    def process(self, mic_bytes: bytes) -> tuple[np.ndarray, float]:
        """
        Calculates NLMS adaptive echo cancellation on mic chunk against reference buffer.
        Returns (residual_samples, residual_rms).
        """
        mic = np.frombuffer(mic_bytes, dtype=np.int16).astype(np.float32)
        if len(mic) == 0:
            return mic, 0.0

        if len(self.ref_history) < self.filter_len + len(mic):
            rms = float(np.sqrt(np.mean(mic**2))) if len(mic) > 0 else 0.0
            return mic, rms

        # True sample-by-sample NLMS adaptive filter over mic chunk
        ref_buf = self.ref_history
        N = len(mic)
        L = self.filter_len
        residual = np.zeros(N, dtype=np.float32)

        for n in range(N):
            idx_end = len(ref_buf) - N + n
            x_n = ref_buf[idx_end - L : idx_end]
            if len(x_n) < L:
                residual[n] = mic[n]
                continue

            y_n = np.dot(self.w, x_n)
            e_n = mic[n] - y_n
            residual[n] = e_n

            norm_x = np.dot(x_n, x_n) + 1e-4
            self.w += (self.mu / norm_x) * e_n * x_n

        residual_rms = float(np.sqrt(np.mean(residual**2)))
        return residual, residual_rms

class GeminiLiveWorker(QThread):
    def __init__(self, client):
        super().__init__()
        self.client = client
        self.loop = None
        self.session = None
        self.async_queue = None
        self.audio_out_queue = None
        self.session_send_lock = None
        self._failure_notified = False
        self.pya = None
        self.mic_stream = None
        self.speaker_stream = None
        self.hangover_counter = 0
        self.vad_active = False
        self.flush_speaker = False
        self.last_interruption_time = 0.0
        self.aec = BlockNLMSEchoCanceller()
        self._stopping_audio = False
        self.is_playing_audio = False
        self.suppress_mic_for_prompt = False
        self.current_turn_user_transcription = ""
        self.current_turn_model_text = ""
        self.in_session_history = []
        self.session_id = str(int(time.time()))
        self.last_user_sentiment = None
        self.is_tool_pending = False

    def run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.async_queue = asyncio.Queue()
        self.audio_out_queue = asyncio.Queue()
        self.session_send_lock = asyncio.Lock()
        try:
            self.loop.run_until_complete(self._main())
        except asyncio.CancelledError:
            print("[GeminiLiveWorker] Async tasks cancelled.")
        except Exception as e:
            print(f"[GeminiLiveWorker] Worker thread loop stopped with: {e}")
        finally:
            self._stopping_audio = True
            self.cleanup_pyaudio()
            self.cancel_all_pending_tasks()
            self.loop.close()

    def cancel_all_pending_tasks(self):
        """Cancels all remaining pending asyncio tasks in the worker event loop cleanly."""
        if not self.loop or self.loop.is_closed():
            return
        try:
            pending = [t for t in asyncio.all_tasks(self.loop) if not t.done()]
            if pending:
                for task in pending:
                    task.cancel()
                self.loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
        except Exception as e:
            pass

    def cleanup_pyaudio(self):
        """Safely disables speaker and mic streams FIRST to prevent PortAudio C crashes on Windows when laptop sound/media plays."""
        self._stopping_audio = True

        if self.mic_stream:
            try:
                if hasattr(self.mic_stream, 'is_active') and self.mic_stream.is_active():
                    self.mic_stream.stop_stream()
            except Exception:
                pass
            try:
                self.mic_stream.close()
            except Exception:
                pass
            self.mic_stream = None

        if self.speaker_stream:
            try:
                if hasattr(self.speaker_stream, 'is_active') and self.speaker_stream.is_active():
                    self.speaker_stream.stop_stream()
            except Exception:
                pass
            try:
                self.speaker_stream.close()
            except Exception:
                pass
            self.speaker_stream = None

        if self.pya:
            try:
                self.pya.terminate()
            except Exception:
                pass
            self.pya = None
        print("[GeminiLiveWorker] Speaker and microphone hardware disabled cleanly.")

    def stop(self):
        """Safely signals the worker thread's asyncio loop to cancel tasks and stop thread execution."""
        self._stopping_audio = True
        if self.loop and self.loop.is_running():
            def _cancel_and_stop():
                try:
                    for t in asyncio.all_tasks(self.loop):
                        t.cancel()
                except Exception:
                    pass
                try:
                    self.loop.stop()
                except Exception:
                    pass
            try:
                self.loop.call_soon_threadsafe(_cancel_and_stop)
            except Exception:
                pass

    def notify_failure(self, reason: str):
        """Thread-safe failure reporter that prevents signal flooding and duplicate reconnect storms."""
        if getattr(self, "_failure_notified", False) or getattr(self, "_stopping_audio", False):
            return
        self._failure_notified = True
        self._stopping_audio = True
        print(f"[GeminiLiveWorker] Reporting session failure ({reason}) to client bridge...")
        if self.client and getattr(self.client, "is_active", False):
            self.client.connection_failed.emit(str(reason))

    async def request_main_thread_screenshot(self) -> bytes:
        """Safely dispatches screenshot capture to Qt Main Thread and awaits result with 3.5s timeout."""
        if not self.loop or self.loop.is_closed():
            print("[GeminiLiveWorker] Error: Worker event loop is closed or missing.")
            return b""
            
        # 150ms stabilization pause allowing OS window focus transitions to complete
        await asyncio.sleep(0.15)

        fut = self.loop.create_future()
        print("[GeminiLiveWorker] Emitting screen_capture_requested signal to main thread...")
        self.client.screen_capture_requested.emit(fut, self.loop)
        
        try:
            # Await result with 3.5s timeout safeguard
            jpeg_bytes = await asyncio.wait_for(fut, timeout=3.5)
            print(f"[GeminiLiveWorker] Successfully received screenshot payload ({len(jpeg_bytes)/1024:.1f} KB) from main thread.")
            return jpeg_bytes
        except asyncio.TimeoutError:
            print("[GeminiLiveWorker] Error: Screen capture timed out after 3.5s.")
            return b""
        except Exception as e:
            print(f"[GeminiLiveWorker] Screen capture bridge error: {e}")
            return b""

    async def _reset_tool_executing_after_delay(self, delay=2.5):
        await asyncio.sleep(delay)
        if hasattr(self, "client") and self.client:
            self.client.tool_executing = False

    def execute_add_study_note(self, note_content: str, topic: str = "", timestamp: str = "", create_new: bool = False) -> dict:
        try:
            print(f"[GeminiLiveWorker] Tool execution: add_study_note(topic='{topic}', timestamp='{timestamp}', create_new={create_new}, note='{note_content}')")
            webapp_ctx = getattr(self.client, "active_webapp_context", {}) or {}

            # Resolve timestamp: if provided explicitly by user/model use it, else fallback to active video timestamp
            final_time_sec = float(webapp_ctx.get("timestampSeconds", 0.0) or 0.0)
            final_time_fmt = webapp_ctx.get("timestampFormatted", "00:00") or "00:00"

            if timestamp and timestamp.strip():
                t_str = timestamp.strip()
                try:
                    parts = [int(p) for p in t_str.split(":") if p.isdigit()]
                    if len(parts) == 2:
                        final_time_sec = float(parts[0] * 60 + parts[1])
                        final_time_fmt = f"{parts[0]:02d}:{parts[1]:02d}"
                    elif len(parts) == 3:
                        final_time_sec = float(parts[0] * 3600 + parts[1] * 60 + parts[2])
                        final_time_fmt = f"{parts[0]:02d}:{parts[1]:02d}:{parts[2]:02d}"
                    elif t_str.replace(".", "", 1).isdigit():
                        final_time_sec = float(t_str)
                        mins = int(final_time_sec) // 60
                        secs = int(final_time_sec) % 60
                        final_time_fmt = f"{mins:02d}:{secs:02d}"
                except Exception as ex:
                    print(f"[GeminiLiveWorker] Note timestamp parse warning: {ex}")

            # Check if user explicitly asked for a brand new note vs appending to the same note
            is_same_note = any(p in note_content.lower() for p in [
                "same note", "that note", "add a point", "another point", "append",
                "in this note", "to my notes", "to notes", "into notes"
            ])
            is_explicit_new = False if is_same_note else bool(
                create_new or any(p in note_content.lower() for p in [
                    "in a new note", "as a new note", "start a new note", "create a new note", "separate note"
                ])
            )

            mm = MemoryManager()
            note_id, is_updated, combined_text, note_data = mm.append_or_create_notebook_note(
                note_text=note_content,
                course_id=webapp_ctx.get("courseId", ""),
                course_title=webapp_ctx.get("courseTitle", ""),
                chapter_title=webapp_ctx.get("chapterTitle", ""),
                lesson_id=webapp_ctx.get("lessonId", ""),
                lesson_title=webapp_ctx.get("lessonTitle", ""),
                video_id=webapp_ctx.get("videoId", ""),
                timestamp_seconds=final_time_sec,
                timestamp_formatted=final_time_fmt,
                topic=topic or webapp_ctx.get("topic", "") or webapp_ctx.get("lessonTitle", ""),
                source="vedika_voice",
                create_new=is_explicit_new
            )

            msg_type = "STUDY_NOTE_UPDATED" if is_updated else "STUDY_NOTE_ADDED"
            if isinstance(note_data, dict):
                note_data["id"] = str(note_id)
            # Safely broadcast to webapp via Qt signal to Main Thread
            if hasattr(self.client, "broadcast_webapp_requested"):
                self.client.broadcast_webapp_requested.emit({
                    "type": msg_type,
                    "payload": note_data
                })
            else:
                main_app = getattr(self.client, "main_app", None) or getattr(self.client, "app", None)
                if main_app and hasattr(main_app, "broadcast_to_webapp"):
                    main_app.broadcast_to_webapp({
                        "type": msg_type,
                        "payload": note_data
                    })

            # Voice & visual confirmation on Desktop Pet
            bubble_text = f"Updated note at {final_time_fmt} with new point! 📝" if is_updated else f"Added note at {final_time_fmt} to your personal notes! 📝"
            if hasattr(self.client, "say_requested"):
                self.client.say_requested.emit(bubble_text, 3.0)

            return {
                "status": "success",
                "is_updated": is_updated,
                "note_id": str(note_id),
                "saved_note": combined_text,
                "timestamp": final_time_fmt,
                "lesson": webapp_ctx.get("lessonTitle", "")
            }
        except Exception as e:
            print(f"[GeminiLiveWorker] Error in execute_add_study_note: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def _main(self):
        if not self.client.gemini_keys:
            print("[GeminiLiveWorker] Error: No GEMINI_API_KEY found.")
            self.notify_failure("No GEMINI_API_KEY available")
            return

        key_idx = self.client.current_key_index % len(self.client.gemini_keys)
        api_key = self.client.gemini_keys[key_idx]
        client = genai.Client(api_key=api_key, http_options={"api_version": "v1alpha"})
        
        model_name = self.client.model_name
        
        # Define Python tool declarations matching user logic
        def play_animation(animation_name: str) -> dict:
            """Triggers an animation on EVE (like wave, jump, failed, waiting, review, idle, run_left, run_right)."""
            self.client.animation_requested.emit(animation_name)
            return {"status": "success"}

        def open_website(url: str = "https://vedika-v20c.vercel.app/") -> dict:
            """Opens a website URL in the default browser when requested by the user. If the user asks to open the website, open Vedika, or open the learning portal without specifying a full external URL, default to 'https://vedika-v20c.vercel.app/'."""
            if not url or url.strip().lower() in ("website", "vedika", "portal", "vedika website", "the website", "page", "the page"):
                url = "https://vedika-v20c.vercel.app/"
            self.client.open_url_requested.emit(url)
            is_homepage = url.rstrip("/").endswith("vedika-v20c.vercel.app") or "localhost" in url
            if is_homepage:
                return {
                    "status": "success",
                    "opened_url": url,
                    "instruction": "The Vedika homepage is now opening and playing its child welcome voice intro. STAY COMPLETELY SILENT. Do NOT speak, greet, or talk over the child voice narration. Remain still in idle state and wait until the student speaks to you."
                }
            return {"status": "success", "opened_url": url}

        def stop_voice_chat() -> dict:
            """Stops or pauses active voice session ONLY when student explicitly says 'bye', 'goodbye', 'stop listening', or 'close voice chat'."""
            if getattr(self.client, "tool_executing", False):
                return {"status": "ignored"}
            self.client.stop_voice_requested.emit()
            return {"status": "success", "session_ended": True}

        def play_music(query: str = "") -> dict:
            """Plays music or a requested song on YouTube in the default browser when user asks to play music or a song."""
            # Immediately mute microphone input at 0ms latency to prevent acoustic feedback!
            self.client.is_paused = True
            self.client.play_music_requested.emit(query)
            return {"status": "success", "playing_music": query or "trending music"}

        def navigate_webapp(route: str = "/") -> dict:
            """Navigates the Vedika LMS WebApp to a specific route, page, or inner lab experiment:
            - Labs Hub: '/vedika-labs'
            - Chemistry Experiments:
              * '/vedika-labs/chemistry?experiment=titration' (Acid-Base Titration)
              * '/vedika-labs/chemistry?experiment=bohr' (Bohr Model Builder)
              * '/vedika-labs/chemistry?experiment=gas' (Ideal Gas Laws & Kinetic Simulator)
              * '/vedika-labs/chemistry?experiment=diffusion' (Molecular Gas Diffusion)
              * '/vedika-labs/chemistry?experiment=trends' (Periodic Trends & Atomic Orbitals)
              * '/vedika-labs/chemistry?mode=phet' (Chemistry PhET Simulations)
            - Physics Experiments:
              * '/vedika-labs/physics?experiment=pendulum' (Simple Harmonic Motion Pendulum)
              * '/vedika-labs/physics?experiment=projectile' (Projectile Motion & Kinematics)
              * '/vedika-labs/physics?experiment=refraction' (Optics, Snell's Law & Refraction)
              * '/vedika-labs/physics?experiment=spring' (Spring-Mass Hooke's Law Oscillations)
              * '/vedika-labs/physics?experiment=circuit' (Ohm's Law & DC Electrical Circuit)
              * '/vedika-labs/physics?mode=phet' (Physics PhET Simulations)
            - Biology Experiments:
              * '/vedika-labs/biology?experiment=cell' (3D Animal Cell Organelles)
              * '/vedika-labs/biology?experiment=ecosystem' (Food Web & Predator-Prey)
              * '/vedika-labs/biology?experiment=dna' (DNA Double Helix & Genetics)
              * '/vedika-labs/biology?mode=phet' (Biology PhET Simulations)
            - Math Visualizers & Graphing:
              * '/vedika-labs/math?tab=visualizer&subtab=calculus' (Calculus Tangents & Derivatives)
              * '/vedika-labs/math?tab=visualizer&subtab=pythagoras' (Pythagoras Theorem Proof)
              * '/vedika-labs/math?tab=visualizer&subtab=sector' (Circle Sector & Clock Wiper)
              * '/vedika-labs/math?tab=visualizer&subtab=solid' (3D Solid Surface Area)
              * '/vedika-labs/math?tab=visualizer&subtab=trig' (Unit Circle & Trigonometry)
              * '/vedika-labs/math?tab=graph&mode=linear' (Linear Equations & Slope)
              * '/vedika-labs/math?tab=graph&mode=quadratic' (Quadratic Parabolas)
              * '/vedika-labs/math?tab=whiteboard' (Math AI Canvas)
            - Other Pages: '/courses', '/code-puzzle', '/viva-interview', '/resources', '/quizzes', '/assignments', '/jobs', '/progress'."""
            if hasattr(self.client, 'navigate_webapp_requested'):
                self.client.navigate_webapp_requested.emit(route)
            return {"status": "success", "navigated_route": route}

        def trigger_puzzle_hint(hint_level: int = 1) -> dict:
            """Triggers a helpful hint on the student's active coding problem or puzzle in the Vedika WebApp."""
            if hasattr(self.client, 'trigger_hint_requested'):
                self.client.trigger_hint_requested.emit(hint_level)
            return {"status": "success", "hint_level": hint_level}

        def trigger_pet_action(action: str, target: str = "") -> dict:
            """Triggers an action or switches experiments directly on the active WebApp page:
            - 'select_experiment': target can be 'titration', 'bohr', 'gas', 'diffusion', 'trends', 'pendulum', 'projectile', 'refraction', 'spring', 'circuit', 'cell', 'ecosystem', 'dna'
            - 'select_organelle': target can be 'nucleus', 'mitochondria', 'er', 'golgi', 'lysosome'
            - 'select_visualizer': target can be 'calculus', 'pythagoras', 'sector', 'solid', 'trig'
            - 'set_mode': target can be '3d' or 'phet'
            - 'start_presentation', 'show_architecture', 'clear_screen', 'start_viva'."""
            if hasattr(self.client, 'trigger_action_requested'):
                self.client.trigger_action_requested.emit(action, target)
            return {"status": "success", "action": action, "target": target}

        async def capture_user_screen() -> dict:
            """Captures and inspects the student's active computer screen in real time. MUST be called IMMEDIATELY whenever the student asks:
            - 'What is on my screen?' / 'Can you see what I am doing?' / 'What am I looking at?'
            - 'What is going on in this page?' / 'What is happening on this page?' / 'What is on this page?'
            - 'What should I do here?' / 'What do I do next?' / 'Guide me on this page'
            - 'Explain this page' / 'Help me with what is showing right now'
            - 'How to write this code in another way?' / 'Show another way to write this code' / 'Rewrite this code'
            - 'Check my code' / 'Why is my code failing?' / 'Help me solve this puzzle'
            This feeds the live desktop screenshot directly to Gemini Multimodal Live, allowing you to visually analyze the page layout, code editor, 3D visualizers, text, buttons, and student work to provide concrete, step-by-step guidance."""
            print("[GeminiLiveWorker] Tool call request received: capture_user_screen")
            self.client.tool_executing = True
            try:
                # Trigger visual pet scan animation and speech bubble immediately
                if hasattr(self.client, 'say_requested'):
                    self.client.say_requested.emit("🔍 Scanning your screen... Analyzing visual context ✨", 3.0)
                if hasattr(self.client, 'animation_requested'):
                    self.client.animation_requested.emit("searching")

                jpeg_bytes = await self.request_main_thread_screenshot()
                
                if jpeg_bytes:
                    if self.session and self.client.is_active:
                        try:
                            print(f"[GeminiLiveWorker] Transmitting screen image blob ({len(jpeg_bytes)/1024:.1f} KB) to Gemini Live session via video field...")
                            if self.session_send_lock:
                                async with self.session_send_lock:
                                    await self.session.send_realtime_input(
                                        video=types.Blob(
                                            data=jpeg_bytes,
                                            mime_type="image/jpeg"
                                        )
                                    )
                            else:
                                await self.session.send_realtime_input(
                                    video=types.Blob(
                                        data=jpeg_bytes,
                                        mime_type="image/jpeg"
                                    )
                                )
                            print("[GeminiLiveWorker] Screen image blob successfully transmitted to Gemini Live session!")
                            webapp_ctx = getattr(self.client, "active_webapp_context", {}) or {}
                            return {
                                "status": "success",
                                "image_received": True,
                                "activeRoute": webapp_ctx.get("activeRoute") or webapp_ctx.get("page") or webapp_ctx.get("route", ""),
                                "codeSnippet": webapp_ctx.get("studentCode") or webapp_ctx.get("codeSnippet", ""),
                                "puzzleTitle": webapp_ctx.get("puzzleTitle", ""),
                                "lessonTitle": webapp_ctx.get("lessonTitle", ""),
                                "message": "Screen image ingested. Visually inspect the user screen, acknowledge the active code/page, and answer the student's question."
                            }
                        except Exception as e:
                            print(f"[GeminiLiveWorker] Error transmitting screen image blob: {e}")
                            return {"status": "error", "message": f"Failed to transmit screen image to model: {e}"}
                    return {"status": "error", "message": "Gemini Live session is inactive."}
                else:
                    print("[GeminiLiveWorker] Warning: Screenshot request returned empty bytes.")
                    return {"status": "error", "message": "Failed to capture screen image."}
            finally:
                asyncio.create_task(self._reset_tool_executing_after_delay(2.5))

        def point_to_screen_location(x: float, y: float, label: str = "", action: str = "point") -> dict:
            """Points to or highlights a specific UI element, code line, error, or button on the student's screen using normalized coordinates (x: 0.0 to 1.0, y: 0.0 to 1.0)."""
            print(f"[GeminiLiveWorker] Tool call: point_to_screen_location(x={x}, y={y}, label='{label}', action='{action}')")
            self.client.point_location_requested.emit(x, y, label, action)
            return {"status": "success", "pointing_at": {"x": x, "y": y, "label": label, "action": action}}

        def save_student_memory(category: str, subject: str, topic: str, note: str) -> dict:
            """Saves or updates a key learning insight, struggle, mastered concept, or academic preference into long-term memory. STRICTLY for academic/learning facts only. Never log personal/private life details."""
            print(f"[GeminiLiveWorker] Tool call: save_student_memory(category='{category}', subject='{subject}', topic='{topic}', note='{note}')")
            mm = MemoryManager()
            res = mm.save_memory(category, subject, topic, note)
            return {"status": "success" if res else "failed", "saved": {"category": category, "subject": subject, "topic": topic}}

        def recall_previous_questions(limit: int = 3) -> dict:
            """Retrieves the exact verbatim previous questions the student asked in this session or earlier voice sessions. ALWAYS call this when the student asks 'What was my previous question?', 'What did I ask before?', or asks to review what they previously asked."""
            print(f"[GeminiLiveWorker] Tool call: recall_previous_questions(limit={limit})")
            in_session_questions = [t["text"] for t in self.in_session_history if t["role"] == "student"]
            mm = MemoryManager()
            db_questions = mm.get_previous_student_questions(limit=limit + 3)
            all_questions = []
            for q_text in reversed(in_session_questions):
                if q_text not in all_questions:
                    all_questions.append(q_text)
            for row in db_questions:
                txt = row.get("text", "")
                if txt and txt not in all_questions:
                    all_questions.append(txt)
            final_list = all_questions[:limit]
            return {
                "status": "success",
                "count": len(final_list),
                "previous_questions": final_list,
                "latest_question": final_list[0] if final_list else "No prior question recorded"
            }

        def search_learning_memory(query: str = "", category: str = "all") -> dict:
            """Searches long-term academic memory and conversation records for specific concepts, topics, struggles, or past answers."""
            print(f"[GeminiLiveWorker] Tool call: search_learning_memory(query='{query}', category='{category}')")
            mm = MemoryManager()
            mems = mm.search_memories(query=query, category=category)
            convs = mm.search_conversation_history(query=query, limit=5)
            return {
                "status": "success",
                "memories": mems,
                "dialogue_matches": convs
            }

        def update_student_profile(name: str = "", stage: str = "", field_of_study: str = "", hobbies: str = "", favorite_topics: str = "") -> dict:
            """Updates student personalization info (e.g. when student introduces themselves, tells you their name, grade level, major, hobbies, or favorite subjects)."""
            print(f"[GeminiLiveWorker] Tool call: update_student_profile(name='{name}', stage='{stage}', field='{field_of_study}')")
            upm = UserProfileManager()
            upm.update_user_info(
                name=name if name else None,
                stage=stage if stage else None,
                field_of_study=field_of_study if field_of_study else None,
                hobbies=hobbies if hobbies else None,
                favorite_topics=favorite_topics if favorite_topics else None
            )
            return {"status": "success", "message": "Student profile updated successfully."}

        def clear_student_memory() -> dict:
            """Clears all stored learning history and topic memories when student explicitly asks 'clear my memory' or 'reset my history'."""
            print("[GeminiLiveWorker] Tool call: clear_student_memory")
            mm = MemoryManager()
            mm.clear_all_memories()
            return {"status": "success", "message": "All student memories cleared."}

        def set_study_timer(duration_seconds: int, label: str = "Study Timer") -> dict:
            """Sets a visual countdown timer capsule on the desktop pet when the student asks to set a timer, reminder, or study session (e.g. 'set a timer for 10 minutes', 'remind me in 5 minutes')."""
            print(f"[GeminiLiveWorker] Tool call: set_study_timer(duration_seconds={duration_seconds}, label='{label}')")
            self.client.timer_requested.emit(int(duration_seconds), str(label))
            mins = max(1, int(duration_seconds) // 60)
            return {"status": "success", "timer_started": f"{mins} minutes for {label}"}

        def add_study_note(note_content: str, topic: str = "", timestamp: str = "", create_new: bool = False) -> dict:
            """Adds a key insight, formula, summary point, or takeaway to the student's personal study notebook with the exact video timestamp and course context.
            CRITICAL RULES:
            - When noting multiple takeaways or points, format each point clearly on its own line prefixed with a bullet (e.g. '• First takeaway\n• Second takeaway').
            - ACCUMULATE POINTS: Unless the student explicitly says 'new note', 'start a new note', or 'create another note', ALWAYS leave create_new=False so all points are compiled cleanly as bullet points into the single active note!
            - Set create_new=True ONLY when the student explicitly demands a new or separate note.
            """
            return self.execute_add_study_note(note_content=note_content, topic=topic, timestamp=timestamp, create_new=create_new)

        def search_code_graph(query: str) -> dict:
            """Searches the codebase Knowledge Graph (built by Graphify) using BFS semantic traversal.
            ALWAYS call this when the student or developer asks about the project code, functions, architecture,
            how a feature is implemented, which file contains a class, or how components connect."""
            print(f"[GeminiLiveWorker] Tool call: search_code_graph(query='{query}')")
            try:
                import graphify.serve as s
                current_dir = os.path.dirname(os.path.abspath(__file__))
                repo_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
                graph_path = os.path.join(repo_root, "graphify-out", "graph.json")
                if not os.path.exists(graph_path):
                    graph_path = os.path.join(current_dir, "..", "graphify-out", "graph.json")
                
                if os.path.exists(graph_path):
                    G = s._load_graph(graph_path)
                    res_text = s._query_graph_text(G, query, graph_path=graph_path)
                    lines = [l for l in res_text.splitlines() if l.startswith("NODE ") or l.startswith("Graph:")]
                    summary = "\n".join(lines[:16])
                    return {"status": "success", "graph_context": summary or res_text[:800]}
                else:
                    return {"status": "warning", "message": "Graphify knowledge graph not yet generated."}
            except Exception as e:
                print(f"[GeminiLiveWorker] search_code_graph error: {e}")
                return {"status": "error", "message": str(e)}

        def get_code_snippet(file_path: str, start_line: int = 1, end_line: int = 40) -> dict:
            """Safely inspects a specific file and line range in the codebase to explain code logic,
            verify syntax, or guide the user on line-by-line implementations."""
            print(f"[GeminiLiveWorker] Tool call: get_code_snippet(file='{file_path}', lines {start_line}-{end_line})")
            try:
                current_dir = os.path.dirname(os.path.abspath(__file__))
                repo_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
                clean_path = file_path.replace("\\", "/").lstrip("/")
                full_path = os.path.abspath(os.path.join(repo_root, clean_path))
                
                # Security Sandbox Check: Ensure path stays within repo root
                if not full_path.startswith(repo_root) or not os.path.exists(full_path):
                    pet_root = os.path.abspath(os.path.join(current_dir, ".."))
                    alt_path = os.path.abspath(os.path.join(pet_root, clean_path))
                    if alt_path.startswith(pet_root) and os.path.exists(alt_path):
                        full_path = alt_path
                    else:
                        return {"status": "error", "message": f"File '{file_path}' not found within project workspace."}
                
                # Check for sensitive files
                base_name = os.path.basename(full_path).lower()
                if ".env" in base_name or "key" in base_name or base_name.endswith((".db", ".pem", ".p12", ".mp4", ".zip")):
                    return {"status": "restricted", "message": f"Access to '{file_path}' is restricted for privacy/security."}
                
                start_l = max(1, int(start_line))
                end_l = max(start_l, min(start_l + 50, int(end_line))) # Cap at 50 lines max
                
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    all_lines = f.readlines()
                
                total_lines = len(all_lines)
                sliced = all_lines[start_l - 1 : end_l]
                numbered = [f"{start_l + idx}: {line}" for idx, line in enumerate(sliced)]
                
                return {
                    "status": "success",
                    "file": clean_path,
                    "total_lines": total_lines,
                    "start_line": start_l,
                    "end_line": min(end_l, total_lines),
                    "code": "".join(numbered)
                }
            except Exception as e:
                return {"status": "error", "message": f"Could not read snippet: {e}"}

        # Construct dynamic Academic Voice Tutor system instruction matching voice-server.js
        tutor_lang = getattr(self.client, "tutor_language", "all")
        tutor_subj = getattr(self.client, "tutor_subject", "all")

        sys_inst = (
            "Your name is Vedika. You are a warm, highly humanized, and friendly academic tutor supporting school students. "
            "VOICE & HUMANIZATION GUIDELINES: "
            "Speak in a smooth, expressive, warm, and natural human tone with a familiar, conversational Indian accent rhythm in English (using natural phrases like 'chalo', 'got it ya', 'super simple', 'no problem at all', 'don't worry!'). "
            "Sound like an encouraging elder sibling or personal tutor: warm, relatable, dynamic, and full of natural life. "
            "Keep answers strictly short and fluid (usually 1 to 2 short sentences per turn) so text-to-speech voice output sounds immediate, crisp, and human. "
            "Never output markdown symbols, asterisks, bullet points, numbers, or complex formulas into text, as they disrupt natural voice synthesis. "
            "\n\nTHINK BEFORE SPEAKING - ZERO REPETITION DIRECTIVE:\n"
            "- Always think before speaking to ensure you NEVER repeat a greeting or sentence twice.\n"
            "- If you have already greeted the student, NEVER greet them again ('Hi', 'Hello', 'How are you?'). Proceed directly with the topic.\n"
            "- Never duplicate your thoughts, sentences, or phrases within the same turn or across turns.\n"
            "- If the student asks a question, provide a single, coherent, crisp answer without repeating yourself.\n"
            "\n\nSOCRATIC PEDAGOGY (ACTIVE INQUIRY & CHECK-IN CYCLES):\n"
            "1. PRE-EXPLANATION INTUITION PROBE: When a student asks for help, asks a question, or brings up a topic, do NOT immediately dump the direct answer or full solution. First, ask what they already know or what their intuition is (e.g., 'What do you already know about [concept]?' or 'Before I explain, what do you think is the first step?').\n"
            "2. GUIDED DISCOVERY: Break problems into simple pieces, provide intuitive analogies or tiny hints, and ask guided questions so the student discovers the solution themselves step by step.\n"
            "3. POST-EXPLANATION COMPREHENSION CHECK: After explaining any concept, answering a question, or breaking down a solution, ALWAYS conclude with a short, friendly check-in question or micro-challenge (e.g., 'Does that make sense? What would happen if we doubled X?' or 'Can you tell me a quick real-world example of this?') to verify understanding.\n"
            "4. CELEBRATION & ENCOURAGEMENT: Celebrate and cheer when the student answers correctly or tries.\n"
            "5. SOCRATIC ESCAPE HATCH: If the student explicitly demands 'Just give me the answer', 'I am in a hurry', or after 3 unsuccessful attempts, provide the clear answer directly, followed by a 1-sentence breakdown of why it works and a quick check-in.\n"
            "\nCONTINUOUS MEMORY & CONVERSATIONAL RECALL RULES:\n"
            "1. You have continuous, persistent memory across voice sessions and real-time tracking of what the student is asking.\n"
            "2. ANTI-HALLUCINATION RECALL RULE: When the student asks 'What was my previous question?', 'What did I ask earlier?', 'What were we talking about?', or 'Do you remember me?':\n"
            "   - Immediately check the [RECENT VOICE CONVERSATION HISTORY] context below, or call the 'recall_previous_questions()' tool function to retrieve the exact previous questions verbatim!\n"
            "   - NEVER invent, hallucinate, or guess a question that the student did not ask.\n"
            "   - Answer directly and accurately (e.g., 'Your previous question was: [Exact Question]').\n"
            "3. PROACTIVE TOPIC FOLLOW-UP: When reconnecting or starting a session, if you remember past topics or previous questions, warmly ask a quick follow-up on how that topic is going!\n"
            "4. STUDENT PERSONALIZATION: When the student shares their name, grade level, school/college, field of study, or hobbies, call 'update_student_profile()' to remember it.\n"
            "5. LEARNING MEMORY: Whenever the student reveals a recurring struggle, masters a topic, or expresses a study preference, call 'save_student_memory(category, subject, topic, note)'.\n"
            "6. If the student asks to clear/forget their study history, call 'clear_student_memory()'.\n"
            "\nNAME CALLING & WAKE ATTENTION DIRECTIVE:\n"
            "When the student calls your name ('Vedika', 'Vedika, Vedika', 'Vedika, Vedika, Vedika', 'Hey Vedika', or 'Vedika are you there?'):\n"
            "Immediately respond with warm, attentive readiness like:\n"
            "'Hey! Yeah tell me?', 'Hey, I am right here! Tell me?', 'Yes, tell me! How can I help you?', or 'Hey, yeah tell me, what is on your mind?'.\n"
            "Keep it immediate, crisp, lively, and welcoming!\n"
        )

        # Instant Multilingual Language Mirroring Directive (Requirement 5)
        sys_inst += (
            "\n\nMANDATORY MULTILINGUAL QUESTION MATCHING (CRITICAL RULE):\n"
            "- You MUST ALWAYS speak the exact language of the student's question on every single turn!\n"
            "- If the student asks in Telugu (or Teluglish, e.g., 'ఈ కాన్సెప్ట్ ఏంటి?', 'నాకు అర్థం కాలేదు', 'తెలుగులో చెప్పు', 'idi enti cheppu brother'): You MUST reply in sweet, natural conversational Telugu (or Teluglish)!\n"
            "- If the student asks in Hindi (or Hinglish, e.g., 'यह क्या है?', 'मुझे समझ नहीं आया', 'हिंदी में बताओ', 'ye kya hai samjhao'): You MUST reply in simple, warm conversational Hindi (or Hinglish)!\n"
            "- If the student asks in English: You MUST reply in articulate, natural English!\n"
            "- If the student asks in Tamil, Kannada, Marathi, Spanish, etc.: Reply in that language!\n"
            "- ZERO-DELAY LANGUAGE SWITCHING: If the student switches languages from one turn to the next, switch INSTANTLY on that exact turn without delay.\n"
            "- NEVER reply in English when the student asked their question in Hindi, Telugu, or another language!\n"
            "- Keep technical, coding, and scientific keywords (e.g. Python, function, titration, Newton's law) intact while speaking naturally in their chosen language.\n"
        )

        if tutor_subj == 'math':
            sys_inst += "SUBJECT FOCUS: Currently helping with Mathematics! Explain concepts like addition, fractions, algebra, or geometry using simple physical analogies. "
        elif tutor_subj == 'science':
            sys_inst += "SUBJECT FOCUS: Currently helping with Science! Explain concepts like gravity, photosynthesis, planets, or animals with fun facts. "
        elif tutor_subj == 'languages':
            sys_inst += "SUBJECT FOCUS: Currently helping with Languages & Reading! Expand vocabulary, teach correct grammar, or guide reading comprehensions. "
        else:
            sys_inst += "SUBJECT FOCUS: You are ready to tutor on any academic school subject: math, science, history, geography, languages, or reading. "

        # Comprehensive Architecture Intelligence & Self-Awareness Module (Requirement 2)
        sys_inst += (
            "\n\nVEDIKA SYSTEM ARCHITECTURE INTELLIGENCE & SELF-AWARENESS:\n"
            "You possess complete, end-to-end intelligence about your own technical architecture, codebase, and how you were built:\n"
            "1. DESKTOP COMPANION & UI:\n"
            "   - Built in Python using PySide6 (Qt6) as a transparent, frameless, top-most desktop window ('ui/transparent_window.py').\n"
            "   - 2D Canvas rendering engine with real-time sprite physics, momentum throws, and speech capsules ('engine/renderer.py').\n"
            "   - Dynamic audio equalizer listening element ('_draw_listening_indicator') that displays real-time animated bars only when you hear the student speaking.\n"
            "   - Dedicated Push-to-Talk button ('Hold to Speak') rendered directly on the companion window for 100% controlled speech during product demos and videos.\n"
            "2. LIVE VOICE AI ENGINE:\n"
            "   - Connected directly to Google Gemini Multimodal Live API using the 'google-genai' SDK over full-duplex WebSockets ('engine/gemini_live.py').\n"
            "   - Audio Input: 16kHz 16-bit mono PCM captured via PyAudio, passed through WebRTC Block-NLMS Acoustic Echo Cancellation (AEC) and Voice Activity Detection (VAD).\n"
            "   - Audio Output: 24,000Hz Web Audio PCM buffer scheduled for gapless, zero-latency playback via PyAudio speaker streams.\n"
            "3. 3 INTERACTION MODES:\n"
            "   - Mode 1 (Alt+V Hotkey): Toggles continuous full-duplex voice conversation.\n"
            "   - Mode 2 (Double Click on Pet): Toggles continuous talking for quick, easy access.\n"
            "   - Mode 3 (Push-to-Talk / Hold-to-Speak): User holds the button or Spacebar while speaking and releases when finished, providing 100% control for recording product videos and demonstrations.\n"
            "4. SCREEN SCANNING & VISION:\n"
            "   - 'ScreenCapturer' captures primary screen downscaled to 1280x720 JPEG, sent via realtime blob input.\n"
            "   - 'PointerOverlay' displays a sleek holographic laser scanline beam and HUD corner brackets during scans, and laser sonar dots at (x,y) screen coordinates.\n"
            "5. PERSISTENT MEMORY & LMS WEBAPP INTEGRATION:\n"
            "   - Persistent SQLite database ('data/memory.db') storing turns, student profile, struggles, and masteries ('engine/memory.py').\n"
            "   - Real-time Next.js LMS WebApp bridge on port 5001 / Cloud Relay connecting live courses, lessons, and coding problems.\n"
            "AUTONOMOUS ERROR DIAGNOSTICS & SELF-HEALING:\n"
            "When any error occurs or when the student asks 'How were you built?', 'Why did you fail?', 'What is this error?', or asks you to diagnose an issue:\n"
            "- You know your architecture inside and out. Analyze and think of the root cause autonomously.\n"
            "- If an API 429 quota error happens: Explain that your Gemini API key rotated to a backup key automatically.\n"
            "- If microphone silence or device error happens: Advise checking Windows microphone privacy settings or default recording device.\n"
            "- If connection drops: Explain that the WebSocket stream blipped and auto-reconnected via your failsafe watchdog.\n"
            "- If asked to refresh or unfreeze: Advise pressing Alt+V or double-clicking you to reboot the session.\n"
        )

        # Real-time Language Adaptation Directive
        sys_inst += (
            "\n\nCRITICAL LANGUAGE RULE:\n"
            "- ALWAYS mirror the student's current spoken language instantaneously.\n"
            "- When the student changes languages from English to Telugu, Hindi, or any other language, seamlessly reply in that language on that exact turn.\n"
        )

        # Dynamic User Profile Context Injection
        student_name = "there"
        try:
            upm = UserProfileManager()
            profile_ctx = upm.get_system_instruction_context()
            sys_inst += profile_ctx
            student_name = upm.profile.get("user", {}).get("name", "there")
        except Exception as e:
            print(f"[GeminiLiveWorker] Could not attach user profile context: {e}")

        # Dynamic Recent Voice Conversation History Context Injection
        try:
            conv_ctx = MemoryManager().get_conversation_context_for_prompt(limit=6)
            if conv_ctx:
                sys_inst += conv_ctx
        except Exception as e:
            print(f"[GeminiLiveWorker] Could not attach conversation history context: {e}")

        # Dynamic Long-Term SQLite Memory Context Injection
        try:
            mem_ctx = MemoryManager().get_relevant_memories(current_subject=tutor_subj, limit=7)
            if mem_ctx:
                sys_inst += mem_ctx
        except Exception as e:
            print(f"[GeminiLiveWorker] Could not attach memory context: {e}")

        # Real-time WebApp context injection
        webapp_ctx = getattr(self.client, "active_webapp_context", {})
        if webapp_ctx:
            sys_inst += "\nREAL-TIME STUDENT VEDIKA WEBAPP CONTEXT:\n"
            if webapp_ctx.get("activeRoute"):
                sys_inst += f"- Active Page Route: {webapp_ctx.get('activeRoute')}\n"
            if webapp_ctx.get("puzzleTitle"):
                sys_inst += f"- Current Coding Problem: '{webapp_ctx.get('puzzleTitle')}'\n"
            if webapp_ctx.get("puzzleDescription"):
                sys_inst += f"- Problem Description: '{webapp_ctx.get('puzzleDescription')}'\n"
            if webapp_ctx.get("codeSnippet"):
                sys_inst += f"- Student's Current Code Attempt:\n```python\n{webapp_ctx.get('codeSnippet')[:400]}\n```\n"
            if webapp_ctx.get("labTitle"):
                sys_inst += f"- Active Virtual Lab Experiment: '{webapp_ctx.get('labTitle')}'\n"
            if webapp_ctx.get("lessonTitle") or webapp_ctx.get("videoTopic"):
                sys_inst += f"- Active Video Lesson: '{webapp_ctx.get('lessonTitle', 'Lesson')}' in Course: '{webapp_ctx.get('courseTitle', 'Course')}' (Chapter: '{webapp_ctx.get('chapterTitle', '')}')\n"
                sys_inst += f"- Paused Video Moment: at {webapp_ctx.get('timestampFormatted', '00:00')} ({webapp_ctx.get('timestampSeconds', 0)} seconds)\n"
                if webapp_ctx.get("topic"):
                    sys_inst += f"- Topic Being Taught At This Moment: '{webapp_ctx.get('topic')}'\n"
                if webapp_ctx.get("overview"):
                    sys_inst += f"- Lesson Concept Overview: {webapp_ctx.get('overview')}\n"
                if webapp_ctx.get("transcriptSnippet"):
                    sys_inst += f"- Video Audio / Transcript at this point:\n\"{webapp_ctx.get('transcriptSnippet')[:600]}\"\n"
                sys_inst += "- VIDEO EXPLAINER PROTOCOL: The student just paused the video because they need help understanding this exact moment. Initiate with a warm, encouraging diagnostic question (e.g., 'I see you paused at [time] on [topic]. What part feels tricky or confusing?'), then listen carefully to break it down simply and Socratically!\n"

        route_instructions = load_routes_for_prompt()
        sys_inst += (
            "TOOLS & IMMEDIATE ACTIONS:\n"
            "1. When the user asks to play a song, music, video, or study material: "
            "IMMEDIATELY call 'play_music' or 'open_website' tool function on your VERY FIRST turn.\n"
            "2. If the user asks to open or navigate to any page, tab, section, or specific lab experiment in Vedika LMS: call 'navigate_webapp' with the appropriate route string:\n"
            + route_instructions +
            "3. If the user asks to switch experiments or control actions on an active page (e.g. 'switch to titration', 'show gas laws', 'switch to projectile motion', 'show cell organelles', 'switch to calculus visualizer', 'start presentation', 'clear screen'): call 'trigger_pet_action(action, target)' (e.g. action='select_experiment', target='titration').\n"
            "4. If the user asks for a hint on their current puzzle, call 'trigger_puzzle_hint'.\n"
            "5. If the user asks to 'open the website', 'open Vedika', 'open portal', or open any page without specifying an external URL: IMMEDIATELY call 'open_website' with 'https://vedika-v20c.vercel.app/' or 'navigate_webapp' with the matching route. When opening or navigating to the homepage, you MUST REMAIN COMPLETELY SILENT while the page is opening and the kid welcome voice is speaking. Do NOT talk over the welcome narration. Stay still in idle state until the student speaks to you.\n"
            "6. If the user asks to stop or pause voice chat, call 'stop_voice_chat' immediately.\n"
            "7. You can also trigger pet visual animations on yourself ('wave', 'jump', 'failed', 'waiting', 'review', 'idle', 'explaining').\n"
            "8. SCREEN VISION & CODE INSPECTION: When the user asks 'What is on my screen?', 'What is going on in this page?', 'What should I do here?', 'Can you see what I am doing?', 'Explain what is on my screen', 'Check my code', 'Why is my code failing', 'Where is my error', 'Help me solve this puzzle', 'How to write this code in another way', 'Show another way to write this', or asks any question about what is displaying on their active screen, code editor, 3D visualizer, or browser: IMMEDIATELY call 'capture_user_screen' tool function on your VERY FIRST turn! NEVER guess or assume what is on the screen without calling 'capture_user_screen'. Once the image is received, visually inspect the active page or code editor. In addition, read the active code snippet and puzzle/lesson title from your context. Identify the exact line number, syntax error, or logic flaw, and explain clearly and encouragingly how to write or fix the code (e.g. 'Looking at your code on line 4, another way to write this is...'). CRITICAL: When the student is asking about an active video lesson moment, do NOT capture the desktop screen; explain the lesson concepts being taught directly!\n"
            "9. VISUAL POINTING & LASER HIGHLIGHT: When explaining code errors, UI buttons, syntax mistakes, or specific elements on the user's screen: IMMEDIATELY call 'point_to_screen_location(x, y, label)' with normalized coordinates (x: 0.0 to 1.0, y: 0.0 to 1.0) to highlight the exact position with a glowing laser pointer and sonar pulse for the student.\n"
            "10. RECALL PREVIOUS QUESTIONS & MEMORY SEARCH: Call 'recall_previous_questions(limit)' when the student asks what was previously asked, or 'search_learning_memory(query, category)' to search stored academic insights and past discussions.\n"
            "11. LEARNING MEMORY & PROFILE: Call 'save_student_memory(category, subject, topic, note)' to remember struggles/masteries, 'update_student_profile(name, stage, field_of_study, hobbies, favorite_topics)' to remember student details, or 'clear_student_memory' to clear history.\n"
            "12. STUDY TIMER: Call 'set_study_timer(duration_seconds, label)' when the student asks to set a timer, reminder, or study countdown (e.g. 'set a 10 min timer', 'remind me in 5 minutes').\n"
            "13. PERSONAL STUDY NOTEPAD & ADDING POINTS: Call 'add_study_note(note_content, topic, timestamp, create_new)' whenever the student asks to 'note this down', 'take a note', 'save this point', 'add to my notebook', 'add a few points', 'add points to my notes', 'write points in my personal notes', or in any language (Hindi: 'नोट्स में पॉइंट्स जोड़ दो', Telugu: 'నోట్స్ లో పాయింట్స్ యాడ్ చేయి'). "
            "CRITICAL NOTE-TAKING MANDATE: You have 100% active, full access to their study notebook through this tool! NEVER tell the student that this functionality is unavailable or that you cannot take notes. Always execute 'add_study_note' immediately, and warmly confirm in the student's active language that the points have been added to their personal notes!\n"
            "14. CODEBASE KNOWLEDGE GRAPH & ARCHITECTURE (GRAPHIFY):\n"
            "When the student, developer, or user asks about how any part of the project is coded, what files exist, which function handles a feature, or asks to explain the architecture (e.g. 'How does voice streaming work in code?', 'Which file handles the transparent window?', 'Show me the code for echo cancellation'):\n"
            "- IMMEDIATELY call 'search_code_graph(query)' to traverse the 3,300+ node Graphify Knowledge Graph.\n"
            "- If you need to inspect actual lines of code to quote or explain them line-by-line, call 'get_code_snippet(file_path, start_line, end_line)'.\n"
            "- Summarize the findings concisely and accurately using your natural voice, explaining the exact files and functions involved."
        )

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Zephyr"
                    )
                )
            ),
            system_instruction=types.Content(
                parts=[types.Part(text=sys_inst)]
            ),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
            tools=[
                play_animation, open_website, play_music, stop_voice_chat, navigate_webapp,
                trigger_puzzle_hint, trigger_pet_action, capture_user_screen, point_to_screen_location,
                recall_previous_questions, search_learning_memory, update_student_profile,
                save_student_memory, clear_student_memory, set_study_timer, add_study_note,
                search_code_graph, get_code_snippet
            ]
        )

        try:
            self.pya = pyaudio.PyAudio()
            mic_info = self.pya.get_default_input_device_info()
            self.mic_stream = self.pya.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                input_device_index=int(mic_info["index"]),
                frames_per_buffer=1024,
            )
            print("[GeminiLiveWorker] PyAudio microphone stream opened successfully.")
            
            # Setup Speaker Output Stream using PyAudio (with 2048 frames hardware buffer to prevent underrun)
            self.speaker_stream = self.pya.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=24000,
                output=True,
                frames_per_buffer=2048,
            )
            print("[GeminiLiveWorker] PyAudio speaker stream opened successfully.")
        except Exception as e:
            print(f"[GeminiLiveWorker] Failed to initialize PyAudio: {e}")
            self.notify_failure(f"Microphone Init Error: {e}")
            return

        try:
            print(f"[GeminiLiveWorker] Connecting to model: {model_name}")
            async with client.aio.live.connect(model=model_name, config=config) as session:
                self.session = session
                print("[GeminiLiveWorker] Connected successfully.")
                self.client.connection_established.emit()
                
                # Check for initial greeting prompt (Only sent ONCE per user session, strictly guarded against double greeting):
                now = time.time()
                last_greet = getattr(self.client, "last_greeting_timestamp", 0.0)
                is_ptt = getattr(self.client, "is_push_to_talk", False) or getattr(self.client, "is_ptt_holding", False)
                if not is_ptt and not getattr(self.client, "initial_greeting_sent", False) and (now - last_greet > 45.0):
                    self.client.initial_greeting_sent = True
                    self.client.last_greeting_timestamp = now

                    # Scenario 1: Proactive video moment prompt triggered by "Ask Vedika at [timestamp]" button
                    if getattr(self.client, "pending_initial_prompt", None):
                        greeting_text = self.client.pending_initial_prompt
                        self.client.pending_initial_prompt = None
                        print(f"[GeminiLiveWorker] Using proactive video moment prompt: {greeting_text}")
                    else:
                        # Check if student is actively inside the LMS Course/Lesson page
                        webapp_ctx = getattr(self.client, "active_webapp_context", {}) or {}
                        c_title = webapp_ctx.get("courseTitle", "")
                        l_title = webapp_ctx.get("lessonTitle", "")
                        route = str(webapp_ctx.get("route", ""))
                        is_in_course = bool(c_title or l_title or "/lesson" in route or "/courses" in route)

                        display_name = student_name if (student_name and student_name.lower() != "there") else ""
                        name_part = f" {display_name}" if display_name else ""

                        if is_in_course:
                            if l_title and c_title:
                                greeting_text = (
                                    f"Speak this exact sentence in clean, articulate English: 'Hi{name_part}! How is your day? Ready to continue {l_title} in {c_title}?' and call play_animation with 'wave'."
                                )
                            elif c_title:
                                greeting_text = (
                                    f"Speak this exact sentence in clean, articulate English: 'Hi{name_part}! How is your day? Ready to explore {c_title}?' and call play_animation with 'wave'."
                                )
                            else:
                                greeting_text = (
                                    f"Speak this exact sentence in clean, articulate English: 'Hi{name_part}! How is your day? Ready to dive into your lesson?' and call play_animation with 'wave'."
                                )
                        else:
                            # Standard clean, articulate English greeting without mixed words
                            greeting_text = (
                                f"Speak this exact sentence in clean, articulate English: 'Hi{name_part}! How is your day? What are we going to do now?' and call play_animation with 'wave'."
                            )

                    print(f"[GeminiLiveWorker] Initial greeting prompt: {greeting_text}")
                    if self.session_send_lock:
                        async with self.session_send_lock:
                            await session.send_realtime_input(text=greeting_text)
                    else:
                        await session.send_realtime_input(text=greeting_text)
                elif is_ptt:
                    self.client.initial_greeting_sent = True
                    print("[GeminiLiveWorker] Session started via Push-to-Talk: Bypassing canned greeting to respond directly to user speech.")
                else:
                    print("[GeminiLiveWorker] Session active/reconnected. Skipping greeting prompt to preserve conversation context.")

                # Run audio streaming, receiving, and playing concurrently until session is stopped
                tasks = [
                    asyncio.create_task(self.send_audio_loop()),
                    asyncio.create_task(self.receive_loop()),
                    asyncio.create_task(self.read_mic_loop()),
                    asyncio.create_task(self.play_audio_loop())
                ]
                
                while self.client.is_active and not getattr(self, "_stopping_audio", False):
                    done, pending = await asyncio.wait(
                        tasks, return_when=asyncio.FIRST_COMPLETED, timeout=1.0
                    )
                    if not self.client.is_active or getattr(self, "_stopping_audio", False):
                        break

                    # FAILSAFE: If any core streaming task (send, receive, mic) died, immediately auto-reconnect
                    if done and self.client.is_active and not getattr(self, "_stopping_audio", False):
                        core_tasks_done = [t for t in done if t in tasks[:3]]
                        if core_tasks_done:
                            for t in core_tasks_done:
                                err = t.exception()
                                print(f"[GeminiLiveWorker] Core streaming task terminated ({err or 'Stream ended'}). Triggering auto-reconnect...")
                            self.notify_failure("Worker streaming task lost connection")
                            break



                for t in tasks:
                    if not t.done():
                        t.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
        except asyncio.CancelledError:
            print("[GeminiLiveWorker] Live API session cancelled gracefully.")
        except Exception as e:
            print(f"[GeminiLiveWorker] Session error: {e}")
            self.notify_failure(str(e))

    async def send_audio_loop(self):
        n = 0
        while self.client.is_active and not getattr(self, "_stopping_audio", False):
            # Fetch audio PCM chunk from native asyncio queue (non-blocking await)
            chunk = await self.async_queue.get()
            if chunk is None:
                break
                
            # If session is still establishing connection, wait until session is ready so zero audio chunks are dropped
            while not self.session and self.client.is_active and not getattr(self, "_stopping_audio", False):
                await asyncio.sleep(0.04)
            if not self.client.is_active or getattr(self, "_stopping_audio", False):
                break
                
            if isinstance(chunk, dict):
                if "text" in chunk:
                    text_val = chunk["text"]
                    print(f"[SEND] Dispatching realtime text prompt to Gemini Live API: {text_val[:80]}...")
                    if self.session and self.client.is_active:
                        try:
                            self.suppress_mic_for_prompt = True
                            self.awaiting_turn_response = False
                            if self.session_send_lock:
                                async with self.session_send_lock:
                                    await self.session.send_realtime_input(text=text_val)
                            else:
                                await self.session.send_realtime_input(text=text_val)
                        except Exception as e:
                            print(f"[GeminiLiveWorker] Error sending realtime text prompt: {e}")
                    continue
                elif chunk.get("end_of_turn"):
                    print("[SEND] Dispatching end_of_turn (turn_complete=True) to Gemini Live API...")
                    if self.session and self.client.is_active:
                        try:
                            self.awaiting_turn_response = True
                            if self.session_send_lock:
                                async with self.session_send_lock:
                                    await self.session.send_client_content(turn_complete=True)
                            else:
                                await self.session.send_client_content(turn_complete=True)
                            print("[SEND] end_of_turn (turn_complete=True) successfully transmitted to Gemini Live!")
                        except Exception as e:
                            print(f"[GeminiLiveWorker] Error sending end_of_turn: {e}")
                    continue

            n += 1
            if n % 20 == 0:
                print(f"[SEND] Sent {n} audio chunks to Gemini Live API.")

            # CRITICAL GEMINI LIVE API PROTOCOL:
            # If a server tool call is awaiting FunctionResponse, suppress sending realtime audio chunks.
            # Interleaving audio chunks while a tool call is pending triggers Google WebSocket 1011 (Internal Error).
            if getattr(self, "is_tool_pending", False) or getattr(self.client, "tool_executing", False):
                await asyncio.sleep(0.02)
                continue
            if self.session and self.client.is_active:
                try:
                    if self.session_send_lock:
                        async with self.session_send_lock:
                            await self.session.send_realtime_input(
                                audio=types.Blob(
                                    data=chunk,
                                    mime_type="audio/pcm;rate=16000"
                                )
                            )
                    else:
                        await self.session.send_realtime_input(
                            audio=types.Blob(
                                data=chunk,
                                mime_type="audio/pcm;rate=16000"
                            )
                        )
                except Exception as e:
                    print(f"[GeminiLiveWorker] Error sending audio realtime chunk: {e}")
                    self.notify_failure(f"Audio send error: {e}")
                    break

    async def read_mic_loop(self):
        try:
            n = 0
            speaking_sustained_counter = 0
            input_audio_buffer = bytearray()
            while self.client.is_active and self.mic_stream and not getattr(self, "_stopping_audio", False):
                # Strict Voice Mode Protocol:
                # 1. Continuous Mode (Alt+V): mic streams continuously using VAD
                # 2. Push-to-Talk (Hold to Speak): mic ONLY streams while button/key is physically held down
                is_continuous = getattr(self.client, "is_continuous_mode", False)
                is_ptt = getattr(self.client, "is_push_to_talk", False)
                is_holding = getattr(self.client, "is_ptt_holding", False)

                if not is_continuous and not (is_ptt and is_holding):
                    input_audio_buffer.clear()
                    await asyncio.sleep(0.04)
                    continue

                # Mute mic audio when session is paused, audio is stopping, tool is executing,
                # proactive prompt is in flight, or tutor is actively speaking (unless barge-in is explicitly enabled)
                if (getattr(self.client, "is_paused", False) or 
                    getattr(self, "_stopping_audio", False) or 
                    getattr(self, "is_tool_pending", False) or
                    getattr(self.client, "tool_executing", False) or
                    getattr(self, "suppress_mic_for_prompt", False) or
                    (self.client.is_speaking and not getattr(self.client, "enable_barge_in", False))):
                    input_audio_buffer.clear()
                    await asyncio.sleep(0.05)
                    continue

                if not self.mic_stream:
                    break

                try:
                    # Read microphone bytes from PyAudio in a background thread to prevent loop blocking
                    data = await asyncio.to_thread(
                        self.mic_stream.read, 1024, exception_on_overflow=False
                    )
                except Exception as ex:
                    print(f"[GeminiLiveWorker] Mic stream read gracefully stopped: {ex}")
                    break

                if not data:
                    await asyncio.sleep(0.01)
                    continue

                input_audio_buffer.extend(data)
                
                # Consolidate chunks to 50ms (1600 bytes at 16kHz 16-bit mono) for ultra-low streaming latency
                chunk_size = 1600
                while len(input_audio_buffer) >= chunk_size:
                    chunk = bytes(input_audio_buffer[:chunk_size])
                    del input_audio_buffer[:chunk_size]
                    
                    # Check for absolute silence (all zeros), indicating mic permissions block or hardware issues
                    if all(v == 0 for v in chunk):
                        if not hasattr(self.client, "_logged_silence"):
                            print("[AudioInputDevice] Warning: Captured audio chunk is completely silent (all zeros).")
                            self.client._logged_silence = True
                    
                    # Process raw mic chunk through Block-NLMS Echo Canceller
                    residual, residual_rms = self.aec.process(chunk)
                    samples = np.frombuffer(chunk, dtype=np.int16)
                    raw_rms = np.sqrt(np.mean(samples.astype(np.float64)**2)) if len(samples) > 0 else 0.0

                    # Count chunks recorded while user actively holds Push-to-Talk
                    if is_holding:
                        self.client.ptt_chunks_recorded = getattr(self.client, "ptt_chunks_recorded", 0) + 1

                    # Dynamic ambient noise floor tracking (exponential moving average during ambient pauses)
                    if not self.vad_active:
                        self.ambient_floor = 0.95 * getattr(self, "ambient_floor", 120.0) + 0.05 * raw_rms

                    effective_threshold = max(self.client.noise_threshold, getattr(self, "ambient_floor", 120.0) * 1.35)

                    # Active User Interruption Handling (Tier A + B Block-NLMS AEC Residual VAD)
                    if self.client.is_speaking:
                        # If barge-in is disabled by user config (Default: Disabled for 100% smooth playback):
                        if not getattr(self.client, "enable_barge_in", False):
                            continue

                        # When barge-in is explicitly enabled by user config:
                        barge_in_residual_threshold = getattr(self.client, "barge_in_sensitivity", 380.0)
                        if residual_rms >= barge_in_residual_threshold:
                            speaking_sustained_counter += 1
                            if speaking_sustained_counter >= 6:  # ~300ms of continuous human voice
                                speaking_sustained_counter = 0
                                now = time.time()
                                if now - self.last_interruption_time > 0.8:
                                    self.last_interruption_time = now
                                    print(f"[VAD] AEC Human Voice Barge-In detected (Residual RMS={residual_rms:.1f} >= {barge_in_residual_threshold:.1f})! Cutting Gemini output.")
                                    self.client.is_speaking = False
                                    self.client.interrupted.emit()
                        else:
                            speaking_sustained_counter = 0
                            continue  # Ignore echo residual below threshold while model speaks

                    n += 1
                    if n % 40 == 0:
                        print(f"[MIC] Read {n} chunks. Active speech: {self.vad_active} (Raw RMS={raw_rms:.1f}, Ambient Floor={getattr(self, 'ambient_floor', 120.0):.1f}, Eff Threshold={effective_threshold:.1f}, AEC Residual RMS={residual_rms:.1f})")
                    
                    if raw_rms >= effective_threshold:
                        if not self.vad_active:
                            self.vad_active = True
                            print(f"[VAD] Speech detected (RMS={raw_rms:.1f} >= {effective_threshold:.1f}, Ambient Floor={getattr(self, 'ambient_floor', 120.0):.1f}), streaming audio to Gemini Live.")
                            # Strictly only emit listening UI signal if in continuous mode or actively holding PTT
                            if is_continuous or is_holding:
                                if hasattr(self.client, "user_listening_state_changed"):
                                    self.client.user_listening_state_changed.emit(True)
                        self.hangover_counter = 16  # ~800ms natural speech hangover to prevent chopping words
                    else:
                        if self.hangover_counter > 0:
                            self.hangover_counter -= 1
                        else:
                            if self.vad_active:
                                self.vad_active = False
                                print(f"[VAD] User paused speaking (Ambient Floor={getattr(self, 'ambient_floor', 120.0):.1f}). Awaiting model response...")
                                if hasattr(self.client, "user_listening_state_changed"):
                                    self.client.user_listening_state_changed.emit(False)
                                self.speech_pause_timestamp = time.time()
                                self.awaiting_turn_response = True

                                # Continuous Mode: automatically flush silence and dispatch end_of_turn to trigger immediate Gemini Live response
                                if is_continuous:
                                    silence_chunk = b'\x00\x00' * 800
                                    for _ in range(3):
                                        await self.async_queue.put(silence_chunk)
                                    await self.async_queue.put({"end_of_turn": True})
                                    print("[VAD] Continuous Mode: Speech turn completed, dispatched end_of_turn!")

                    # Continuous Mode silence gating: buffer up to 2 chunks (100ms) when quiet, flush when speech begins
                    if is_continuous:
                        if not self.vad_active:
                            if not hasattr(self, "pre_speech_buffer"):
                                self.pre_speech_buffer = []
                            self.pre_speech_buffer.append(chunk)
                            if len(self.pre_speech_buffer) > 2:
                                self.pre_speech_buffer.pop(0)
                            continue
                        else:
                            if hasattr(self, "pre_speech_buffer") and self.pre_speech_buffer:
                                for pre_chunk in self.pre_speech_buffer:
                                    await self.async_queue.put(pre_chunk)
                                self.pre_speech_buffer.clear()

                    # Keep queue lean to prevent audio latency buildup
                    if self.async_queue.qsize() > 40:
                        try:
                            self.async_queue.get_nowait()
                        except Exception:
                            pass
                    await self.async_queue.put(chunk)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"[GeminiLiveWorker] Mic read loop error: {e}")

    async def play_audio_loop(self):
        try:
            pcm_buffer = bytearray()
            prebuffering = True
            PREBUFFER_BYTES = 4800  # ~100ms jitter buffer ensures glitch-free playback on Windows
            while self.client.is_active and self.speaker_stream and not getattr(self, "_stopping_audio", False):
                # Pause audio output when session is paused or audio is stopping
                if getattr(self.client, "is_paused", False) or getattr(self, "_stopping_audio", False):
                    await asyncio.sleep(0.05)
                    continue

                try:
                    chunk = await asyncio.wait_for(self.audio_out_queue.get(), timeout=0.04)
                except asyncio.TimeoutError:
                    chunk = None

                if chunk is None and getattr(self, "_stopping_audio", False):
                    break
                
                # Check for thread-safe interruption flush request
                if self.flush_speaker:
                    self.flush_speaker = False
                    pcm_buffer.clear()
                    prebuffering = True
                    print("[GeminiLiveWorker] Flushed speaker queue on user interruption.")
                    while not self.audio_out_queue.empty():
                        try:
                            self.audio_out_queue.get_nowait()
                        except Exception:
                            break
                    continue

                if chunk:
                    pcm_buffer.extend(chunk)
                    self.is_playing_audio = True

                # Immediate low-latency playback: start as soon as ~33ms (1600 bytes) are buffered, timeout occurs, or turn completes
                if prebuffering:
                    if chunk is None or len(pcm_buffer) >= 1600 or getattr(self.client, "turn_completed_received", False):
                        prebuffering = False
                    else:
                        continue

                # Buffer PCM chunks to 1600 bytes (~33ms of 24kHz mono) for ultra-fast, gapless PyAudio playback
                min_chunk_bytes = 1600
                while len(pcm_buffer) >= min_chunk_bytes or (chunk is None and len(pcm_buffer) > 0 and self.audio_out_queue.empty()):
                    self.is_playing_audio = True
                    send_len = min_chunk_bytes if len(pcm_buffer) >= min_chunk_bytes else len(pcm_buffer)
                    play_bytes = bytes(pcm_buffer[:send_len])
                    del pcm_buffer[:send_len]

                    # Push far-end reference audio to Block-NLMS Echo Canceller
                    self.aec.push_reference(play_bytes)

                    if not self.speaker_stream:
                        break

                    try:
                        # Play audio chunk asynchronously without blocking worker event loop
                        await asyncio.to_thread(self.speaker_stream.write, play_bytes)
                    except Exception as ex:
                        print(f"[GeminiLiveWorker] Speaker stream write gracefully stopped: {ex}")
                        break
                
                # Check if we finished playing all chunks after turn completed
                if self.audio_out_queue.empty() and len(pcm_buffer) == 0:
                    self.is_playing_audio = False
                    prebuffering = True
                    if getattr(self.client, "turn_completed_received", False):
                        print("[GeminiLive] Speaker finished playing all chunks. Re-enabling mic.")
                        self.client.turn_completed_received = False
                        self.suppress_mic_for_prompt = False
                        self.client.mic_timer_trigger.emit(0)
                        if self.client.is_speaking:
                            self.client.is_speaking = False
                            self.client.speaking_stopped.emit()
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"[GeminiLiveWorker] Speaker play loop error: {e}")

    async def receive_loop(self):
        while self.client.is_active and self.session:
            try:
                async for response in self.session.receive():
                    if not self.client.is_active:
                        break
                    
                    sc = response.server_content
                    if sc:
                        self.awaiting_turn_response = False
                        has_text = bool(sc.model_turn and any(p.text for p in sc.model_turn.parts))
                        has_audio = bool(sc.model_turn and any(p.inline_data for p in sc.model_turn.parts))
                        print(f"[RECV] Got response: text={has_text} audio={has_audio}")
                        
                        if sc.interrupted:
                            if not getattr(self.client, "enable_barge_in", False) or getattr(self.client, "tool_executing", False) or getattr(self, "suppress_mic_for_prompt", False):
                                print("[GeminiLiveWorker] Suppressed false server VAD interruption signal (barge-in disabled or proactive prompt active).")
                            else:
                                print("[GeminiLiveWorker] Gemini Server VAD emitted interrupted=True! Halting local speaker.")
                                self.client.interrupted.emit()
                        
                        # Extract incoming streaming user speech transcription chunks
                        user_delta = ""
                        if hasattr(sc, "input_transcription") and sc.input_transcription and getattr(sc.input_transcription, "text", None):
                            user_delta = sc.input_transcription.text
                        elif hasattr(sc, "input_audio_transcription") and sc.input_audio_transcription and getattr(sc.input_audio_transcription, "text", None):
                            user_delta = sc.input_audio_transcription.text
                        
                        if user_delta:
                            self.current_turn_user_transcription += user_delta
                            user_text = self.current_turn_user_transcription.strip()
                            if user_text:
                                self.last_user_query = user_text
                                sentiment = analyze_sentiment(user_text)
                                self.last_user_sentiment = sentiment
                                self.client.user_dialogue_buffer = user_text
                                self.client.user_sentiment_detected.emit(user_text, sentiment)
                                
                                # Detect user input language for multilingual question matching (Requirement 5)
                                detected_lang = detect_user_language(user_text)
                                self.detected_language = detected_lang
                                self.client.current_language = detected_lang

                                clean_call = re.sub(r'[^a-zA-Z\s]', '', user_text).strip().lower()
                                is_calling_name = clean_call in ("vedika", "vedika vedika", "vedika vedika vedika", "hey vedika", "hi vedika", "vedika are you there")
                                status_preview = "Hey! Yeah tell me? 😊" if is_calling_name else "Thinking... 🤔"
                                # Live chunk by chunk user transcript preview on Line 1, status on Line 2
                                self.client.say_dialogue_requested.emit(user_text, status_preview, 6.0)
                            self.client.thinking_started.emit()
                        
                        # Extract incoming streaming AI spoken audio & transcript chunks
                        ai_delta = ""
                        if hasattr(sc, "output_transcription") and sc.output_transcription and getattr(sc.output_transcription, "text", None):
                            ai_delta = sc.output_transcription.text
                        elif hasattr(sc, "output_audio_transcription") and sc.output_audio_transcription and getattr(sc.output_audio_transcription, "text", None):
                            ai_delta = sc.output_audio_transcription.text

                        if ai_delta:
                            self.current_turn_model_text += ai_delta
                            self.client.text_received.emit(ai_delta)
                        
                        model_turn = sc.model_turn
                        if model_turn:
                            for part in model_turn.parts:
                                # Deduplicate text: only emit part.text if output_transcription wasn't already emitted (Requirement 6)
                                if not ai_delta and hasattr(part, "text") and part.text:
                                    self.current_turn_model_text += part.text
                                    self.client.text_received.emit(part.text)
                                if hasattr(part, "inline_data") and part.inline_data:
                                    audio_bytes = part.inline_data.data
                                    # Directly feed audio queue on worker thread (zero Qt GUI main-thread latency/jitter)
                                    self.audio_out_queue.put_nowait(audio_bytes)
                                    if not self.client.is_speaking:
                                        self.client.is_speaking = True
                                        self.client.speaking_started.emit()
                        
                        if sc.turn_complete:
                            self.suppress_mic_for_prompt = False
                            self.client.turn_completed.emit()
                            user_q = self.current_turn_user_transcription.strip()
                            tutor_ans = self.current_turn_model_text.strip()
                            t_subj = getattr(self.client, "tutor_subject", "general")
                            t_subj = t_subj if t_subj != "all" else "general"

                            if user_q:
                                self.in_session_history.append({"role": "student", "text": user_q})
                                try:
                                    MemoryManager().log_voice_turn(
                                        role="student",
                                        text=user_q,
                                        sentiment=self.last_user_sentiment,
                                        subject=t_subj,
                                        session_id=self.session_id
                                    )
                                except Exception as e:
                                    print(f"[GeminiLiveWorker] Error logging student voice turn: {e}")

                            if tutor_ans:
                                self.in_session_history.append({"role": "tutor", "text": tutor_ans})
                                try:
                                    MemoryManager().log_voice_turn(
                                        role="tutor",
                                        text=tutor_ans,
                                        subject=t_subj,
                                        session_id=self.session_id
                                    )
                                except Exception as e:
                                    print(f"[GeminiLiveWorker] Error logging tutor voice turn: {e}")

                            # Reset current turn buffers
                            self.current_turn_user_transcription = ""
                            self.current_turn_model_text = ""
                            self.last_user_sentiment = None
                    
                    tc = response.tool_call
                    if tc:
                        # Immediately pause mic and audio streaming to prevent race condition 1011 error
                        self.is_tool_pending = True
                        if hasattr(self.client, 'tool_executing'):
                            self.client.tool_executing = True

                        # Drain any audio chunks that were queued right before tool_call
                        if self.async_queue:
                            while not self.async_queue.empty():
                                try:
                                    self.async_queue.get_nowait()
                                except Exception:
                                    break

                        function_responses = []
                        for fc in tc.function_calls:
                            func_name = fc.name
                            args = fc.args or {}
                            print(f"[GeminiLiveWorker] Model tool call request: {func_name} args={args}")
                            
                            if func_name == "play_animation":
                                anim_name = args.get("animation_name")
                                self.client.animation_requested.emit(anim_name)
                                
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success"}
                                    )
                                )
                            elif func_name == "open_website":
                                url = args.get("url", "")
                                if not url or str(url).strip().lower() in ("website", "vedika", "portal", "vedika website", "the website", "page", "the page"):
                                    url = "https://vedika-v20c.vercel.app/"
                                self.client.open_url_requested.emit(url)
                                is_homepage = url.rstrip("/").endswith("vedika-v20c.vercel.app") or "localhost" in url
                                resp = {"status": "success", "opened_url": url}
                                if is_homepage:
                                    resp["instruction"] = "The Vedika homepage is now opening and playing its child welcome voice intro. STAY COMPLETELY SILENT. Do NOT speak, greet, or talk over the child voice narration. Remain still in idle state and wait until the student speaks to you."
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response=resp
                                    )
                                )
                            elif func_name == "play_music":
                                query = args.get("query", "")
                                self.client.play_music_requested.emit(query)
                                
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "playing_music": query or "trending music"}
                                    )
                                )
                            elif func_name == "stop_voice_chat":
                                self.client.stop_voice_requested.emit()
                                
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "session_ended": True}
                                    )
                                )
                            elif func_name == "navigate_webapp":
                                route = args.get("route", "/")
                                print(f"[GeminiLiveWorker] Executing tool navigate_webapp: route='{route}'")
                                self.client.navigate_webapp_requested.emit(route)
                                
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "navigated_route": route}
                                    )
                                )
                            elif func_name == "trigger_puzzle_hint":
                                try:
                                    hint_level = int(args.get("hint_level", 1))
                                except Exception:
                                    hint_level = 1
                                print(f"[GeminiLiveWorker] Executing tool trigger_puzzle_hint: hint_level={hint_level}")
                                self.client.trigger_hint_requested.emit(hint_level)
                                
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "hint_level": hint_level}
                                    )
                                )
                            elif func_name == "trigger_pet_action":
                                action = str(args.get("action", ""))
                                target = str(args.get("target", ""))
                                print(f"[GeminiLiveWorker] Executing tool trigger_pet_action: action='{action}', target='{target}'")
                                if hasattr(self.client, "trigger_action_requested"):
                                    self.client.trigger_action_requested.emit(action, target)
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "action": action, "target": target}
                                    )
                                )
                            elif func_name == "capture_user_screen":
                                print("[GeminiLiveWorker] Executing tool capture_user_screen via main-thread bridge...")
                                self.client.tool_executing = True
                                try:
                                    if hasattr(self.client, 'say_requested'):
                                        self.client.say_requested.emit("Scanning your screen... 🔍", 2.5)
                                    if hasattr(self.client, 'animation_requested'):
                                        self.client.animation_requested.emit("searching")

                                    jpeg_bytes = await self.request_main_thread_screenshot()
                                    if jpeg_bytes:
                                        if self.session and self.client.is_active:
                                            try:
                                                print(f"[GeminiLiveWorker] Transmitting screen image blob ({len(jpeg_bytes)/1024:.1f} KB) to Gemini Live session via video field...")
                                                if self.session_send_lock:
                                                    async with self.session_send_lock:
                                                        await self.session.send_realtime_input(
                                                            video=types.Blob(
                                                                data=jpeg_bytes,
                                                                mime_type="image/jpeg"
                                                            )
                                                        )
                                                else:
                                                    await self.session.send_realtime_input(
                                                        video=types.Blob(
                                                            data=jpeg_bytes,
                                                            mime_type="image/jpeg"
                                                        )
                                                    )
                                                print("[GeminiLiveWorker] Screen image blob successfully transmitted to Gemini Live session!")
                                                webapp_ctx = getattr(self.client, "active_webapp_context", {}) or {}
                                                function_responses.append(
                                                    types.FunctionResponse(
                                                        name=func_name,
                                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                                        response={
                                                            "status": "success",
                                                            "image_received": True,
                                                            "activeRoute": webapp_ctx.get("activeRoute") or webapp_ctx.get("page") or webapp_ctx.get("route", ""),
                                                            "codeSnippet": webapp_ctx.get("studentCode") or webapp_ctx.get("codeSnippet", ""),
                                                            "puzzleTitle": webapp_ctx.get("puzzleTitle", ""),
                                                            "lessonTitle": webapp_ctx.get("lessonTitle", ""),
                                                            "message": "Screen image ingested. Visually inspect the user screen, acknowledge the active code/page, and answer the student's question."
                                                        }
                                                    )
                                                )
                                            except Exception as e:
                                                print(f"[GeminiLiveWorker] Error transmitting screen image blob: {e}")
                                                function_responses.append(
                                                    types.FunctionResponse(
                                                        name=func_name,
                                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                                        response={"status": "error", "message": f"Failed to transmit screen image: {e}"}
                                                    )
                                                )
                                        else:
                                            function_responses.append(
                                                types.FunctionResponse(
                                                    name=func_name,
                                                    id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                                    response={"status": "error", "message": "Gemini Live session is inactive."}
                                                )
                                            )
                                    else:
                                        function_responses.append(
                                            types.FunctionResponse(
                                                name=func_name,
                                                id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                                response={"status": "error", "message": "Failed to capture screen image."}
                                            )
                                        )
                                finally:
                                    asyncio.create_task(self._reset_tool_executing_after_delay(2.5))
                            elif func_name == "point_to_screen_location":
                                try:
                                    x_val = float(args.get("x", 0.5))
                                    y_val = float(args.get("y", 0.5))
                                except Exception:
                                    x_val, y_val = 0.5, 0.5
                                label_str = str(args.get("label", ""))
                                action_str = str(args.get("action", "point"))
                                print(f"[GeminiLiveWorker] Executing tool point_to_screen_location: x={x_val}, y={y_val}, label='{label_str}', action='{action_str}'")
                                self.client.point_location_requested.emit(x_val, y_val, label_str, action_str)
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "pointing_at": {"x": x_val, "y": y_val, "label": label_str}}
                                    )
                                )
                            elif func_name == "recall_previous_questions":
                                try:
                                    limit = int(args.get("limit", 3))
                                except Exception:
                                    limit = 3
                                in_session_questions = [t["text"] for t in self.in_session_history if t["role"] == "student"]
                                mm = MemoryManager()
                                db_questions = mm.get_previous_student_questions(limit=limit + 3)
                                all_questions = []
                                for q_text in reversed(in_session_questions):
                                    if q_text not in all_questions:
                                        all_questions.append(q_text)
                                for row in db_questions:
                                    txt = row.get("text", "")
                                    if txt and txt not in all_questions:
                                        all_questions.append(txt)
                                final_list = all_questions[:limit]
                                print(f"[GeminiLiveWorker] Executing tool recall_previous_questions -> {final_list}")
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={
                                            "status": "success",
                                            "count": len(final_list),
                                            "previous_questions": final_list,
                                            "latest_question": final_list[0] if final_list else "No prior question recorded"
                                        }
                                    )
                                )
                            elif func_name == "search_learning_memory":
                                q_str = str(args.get("query", ""))
                                cat_str = str(args.get("category", "all"))
                                print(f"[GeminiLiveWorker] Executing tool search_learning_memory: query='{q_str}', category='{cat_str}'")
                                mm = MemoryManager()
                                mems = mm.search_memories(query=q_str, category=cat_str)
                                convs = mm.search_conversation_history(query=q_str, limit=5)
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "memories": mems, "dialogue_matches": convs}
                                    )
                                )
                            elif func_name == "update_student_profile":
                                n = args.get("name")
                                st = args.get("stage")
                                fld = args.get("field_of_study")
                                hb = args.get("hobbies")
                                fav = args.get("favorite_topics")
                                print(f"[GeminiLiveWorker] Executing tool update_student_profile: name={n}, stage={st}, field={fld}")
                                upm = UserProfileManager()
                                upm.update_user_info(name=n, stage=st, field_of_study=fld, hobbies=hb, favorite_topics=fav)
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "message": "Student profile updated successfully."}
                                    )
                                )
                            elif func_name == "save_student_memory":
                                cat = str(args.get("category", "struggling"))
                                subj = str(args.get("subject", "general"))
                                top = str(args.get("topic", ""))
                                note = str(args.get("note", ""))
                                print(f"[GeminiLiveWorker] Executing tool save_student_memory: [{cat} | {subj}] {top} - '{note}'")
                                mm = MemoryManager()
                                res = mm.save_memory(cat, subj, top, note)
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success" if res else "failed", "saved": {"category": cat, "subject": subj, "topic": top}}
                                    )
                                )
                            elif func_name == "clear_student_memory":
                                print("[GeminiLiveWorker] Executing tool clear_student_memory")
                                mm = MemoryManager()
                                mm.clear_all_memories()
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "message": "All student memories cleared."}
                                    )
                                )
                            elif func_name == "set_study_timer":
                                try:
                                    dur = int(args.get("duration_seconds", 300))
                                except Exception:
                                    dur = 300
                                lbl = str(args.get("label", "Study Timer"))
                                print(f"[GeminiLiveWorker] Executing tool set_study_timer: duration={dur}s, label='{lbl}'")
                                self.client.timer_requested.emit(dur, lbl)
                                mins = max(1, dur // 60)
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response={"status": "success", "timer_started": f"{mins} minutes for {lbl}"}
                                    )
                                )
                            elif func_name == "add_study_note":
                                note_content = str(args.get("note_content", "") or args.get("note", "")).strip()
                                topic = str(args.get("topic", "")).strip()
                                timestamp = str(args.get("timestamp", "")).strip()
                                create_new = bool(args.get("create_new", False))
                                print(f"[GeminiLiveWorker] Executing tool add_study_note: topic='{topic}', timestamp='{timestamp}', create_new={create_new}, note='{note_content[:60]}...'")
                                res = self.execute_add_study_note(note_content=note_content, topic=topic, timestamp=timestamp, create_new=create_new)
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=func_name,
                                        id=fc.id or f"call_{func_name}_{int(time.time()*1000)}",
                                        response=res
                                    )
                                )
                        
                        # If ANY function_call was unrecognized, add a graceful error response so the model
                        # is never left waiting for a response it will never receive (which causes session hangs).
                        recognized_ids = {fr.id for fr in function_responses}
                        for fc in tc.function_calls:
                            if fc.id not in recognized_ids:
                                ts_fallback = f"call_{fc.name}_{int(time.time()*1000)}"
                                print(f"[GeminiLiveWorker] Warning: Unrecognized tool '{fc.name}' — returning graceful error response to prevent session hang.")
                                function_responses.append(
                                    types.FunctionResponse(
                                        name=fc.name,
                                        id=fc.id or ts_fallback,
                                        response={"status": "error", "message": f"Tool '{fc.name}' is not implemented on this device."}
                                    )
                                )

                        if function_responses and self.session and self.client.is_active:
                            try:
                                if self.session_send_lock:
                                    async with self.session_send_lock:
                                        await self.session.send_tool_response(
                                            function_responses=function_responses
                                        )
                                else:
                                    await self.session.send_tool_response(
                                        function_responses=function_responses
                                    )
                            except Exception as e:
                                print(f"[GeminiLiveWorker] Error sending tool response: {e}")
                            finally:
                                # Safe grace period for model to start turn output before mic resumes
                                await asyncio.sleep(0.35)
                                self.is_tool_pending = False
                                if hasattr(self.client, 'tool_executing'):
                                    self.client.tool_executing = False
                
                if not self.client.is_active or getattr(self, "_stopping_audio", False):
                    break
                # Turn interaction completed cleanly! Continue receive loop for next turn seamlessly without restarting.
                print("[GeminiLiveWorker] Turn interaction completed; continuing receive loop for next interaction.")
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[GeminiLiveWorker] Receive loop error: {e}")
                self.notify_failure(f"WebSocket error/closure: {e}")
                break

class GeminiLiveClient(QObject):
    state_changed = Signal(str)  # "disconnected", "connecting", "connected", "error"
    say_requested = Signal(str, float)  # text, duration
    animation_requested = Signal(str)  # animation name
    open_url_requested = Signal(str)  # url string
    play_music_requested = Signal(str)  # query string
    stop_voice_requested = Signal()  # stop signal
    navigate_webapp_requested = Signal(str)  # route string
    trigger_hint_requested = Signal(int)  # hint level
    trigger_action_requested = Signal(str, str)  # action, target
    screen_capture_requested = Signal(object, object)  # future, loop
    point_location_requested = Signal(float, float, str, str)  # x, y, label, action
    timer_requested = Signal(int, str)  # duration_seconds, label
    broadcast_webapp_requested = Signal(dict)  # message dictionary for webapp WebSocket broadcast
    session_activated = Signal()
    speaking_started = Signal()
    speaking_stopped = Signal()
    user_listening_state_changed = Signal(bool)
    error_occurred = Signal(str, str)

    say_dialogue_requested = Signal(str, str, float)  # user_text, ai_text, duration
    user_sentiment_detected = Signal(str, dict)  # user_text, sentiment dict

    # Communication bridge signals (Worker -> Client)
    connection_established = Signal()
    connection_failed = Signal(str)
    text_received = Signal(str)
    audio_received = Signal(bytes)
    turn_completed = Signal()
    interrupted = Signal()
    thinking_started = Signal()
    mic_timer_trigger = Signal(int)

    def __init__(self, pet, main_app, parent=None):
        super().__init__(parent)
        self.pet = pet
        self.main_app = main_app
        
        self.worker_thread = None
        self._running_threads = set()
        self.audio_source = None
        self.audio_input_device = None
        self.audio_sink = None
        self.audio_output_io = None
        
        self.is_active = False
        self.is_continuous_mode = False
        self.is_push_to_talk = False
        self.is_ptt_holding = False
        self.last_greeting_timestamp = 0.0
        self.last_spoken_sentence = ""
        self.last_spoken_sentence_time = 0.0
        self.current_language = "english"
        self.text_buffer = ""
        self.user_dialogue_buffer = ""
        self.status = "disconnected"
        self.gemini_keys = []
        self.current_key_index = 0
        self.model_name = "gemini-3.1-flash-live-preview"
        self.tutor_language = os.environ.get("TUTOR_LANGUAGE", "all")
        self.tutor_subject = os.environ.get("TUTOR_SUBJECT", "all")
        self.noise_threshold = 280.0
        
        # Configurable voice interruption (barge-in) settings (Default: Disabled for 100% smooth playback)
        enable_barge_str = os.getenv("ENABLE_BARGE_IN", "False").strip().lower()
        self.enable_barge_in = enable_barge_str in ("true", "1", "yes")
        try:
            self.barge_in_sensitivity = float(os.getenv("BARGE_IN_SENSITIVITY", "380.0"))
        except ValueError:
            self.barge_in_sensitivity = 380.0

        self.is_speaking = False
        self.is_paused = False
        self.turn_completed_received = False
        self.input_audio_buffer = bytearray()

        # Audio prebuffering layout (pyaudio handles buffering natively)
        self.playback_buffer = bytearray()
        
        # Sentence-by-Sentence Teleprompter streaming state
        self.sentence_chunks = []
        self.current_chunk_index = 0
        self.current_chunk_words_displayed = 0
        self.chunk_pause_ticks = 0
        self.word_stream_timer = QTimer(self)
        self.word_stream_timer.setInterval(80) # 80ms per word tick (~12.5 words/sec matching natural speech)
        self.word_stream_timer.timeout.connect(self._step_word_stream)

        # Dedicated timer to re-enable mic after speaking (moved thread safe)
        self.mic_enable_timer = QTimer(self)
        self.mic_enable_timer.setSingleShot(True)
        self.mic_enable_timer.timeout.connect(self.enable_mic_after_speaking)
        self.mic_timer_trigger.connect(self.handle_mic_timer_trigger)

        # Serialized, debounced reconnect timer
        self._reconnect_timer = QTimer(self)
        self._reconnect_timer.setSingleShot(True)
        self._reconnect_timer.timeout.connect(self._execute_reconnect)
        self._last_active_worker = None
        self._is_reconnecting = False
        self._greeting_was_sent = False

        # Connect bridge slots
        self.connection_established.connect(self.on_connection_established)
        self.connection_failed.connect(self.on_connection_failed)
        self.text_received.connect(self.on_text_received)
        self.audio_received.connect(self.on_audio_received)
        self.turn_completed.connect(self.on_turn_completed)
        self.interrupted.connect(self.on_interrupted)
        self.thinking_started.connect(self.on_thinking_started)

        self.load_env()

    @Slot(int)
    def handle_mic_timer_trigger(self, val):
        if val > 0:
            self.mic_enable_timer.start(val)
        else:
            self.mic_enable_timer.stop()

    def load_env(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        pet_root = os.path.abspath(os.path.join(current_dir, ".."))
        parent_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
        env_paths = [
            ".env",
            os.path.join(pet_root, ".env"),
            os.path.join(parent_dir, ".env"),
            os.path.join(parent_dir, "frontend", ".env"),
            os.path.join(parent_dir, "backend", ".env"),
            os.path.join(parent_dir, "vedika-desktop-pet", ".env"),
            os.path.join(parent_dir, "vedika-2.0", "backend", ".env"),
            os.path.join(parent_dir, "vedika-2.0", "frontend", ".env"),
            os.path.join(parent_dir, "vedika-2.0", "vedika-desktop-pet", ".env")
        ]
        for p in env_paths:
            if os.path.exists(p):
                try:
                    import dotenv
                    dotenv.load_dotenv(p, override=False)
                except Exception:
                    pass
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if not line or line.startswith("#"):
                                continue
                            if "=" in line:
                                k, v = line.split("=", 1)
                                k_clean = k.strip()
                                v_clean = v.strip().strip('"').strip("'")
                                if k_clean not in os.environ or not os.environ[k_clean]:
                                    os.environ[k_clean] = v_clean
                except Exception as e:
                    print(f"[GeminiLive] Notice reading {p}: {e}")
        
        # Dynamically scan ALL environment variables starting with GEMINI_API_KEY
        self.gemini_keys = []
        for k, v in os.environ.items():
            if (k == "GEMINI_API_KEY" or k.startswith("GEMINI_API_KEY_")) and v and v.strip():
                val = v.strip()
                if val not in self.gemini_keys:
                    self.gemini_keys.append(val)

        # Select a starting key index to distribute load across keys
        if self.gemini_keys:
            import random
            self.current_key_index = random.randint(0, len(self.gemini_keys) - 1)
            print(f"[GeminiLive] Loaded {len(self.gemini_keys)} Gemini API keys. Active key ending in ...{self.gemini_keys[self.current_key_index][-4:]}")
        else:
            self.current_key_index = 0

        self.model_name = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-live-preview")
        self.noise_threshold = float(os.environ.get("VOICE_NOISE_THRESHOLD", "280.0"))

    @Slot()
    def start(self):
        if self.is_active or getattr(self, "_is_starting", False) or getattr(self, "_is_stopping", False):
            print("[GeminiLiveClient] Start ignored: session state transition in progress.")
            return

        self._is_starting = True
        self.is_paused = False  # Reset mute state on every new start!
        self.status = "connecting"
        self.state_changed.emit("connecting")
        
        if not self.gemini_keys:
            print("[GeminiLive] Error: GEMINI_API_KEY not found in env.")
            self.say_requested.emit("Error: GEMINI_API_KEY not found in .env file", 3.0)
            self.status = "error"
            self.state_changed.emit("error")
            self._is_starting = False
            return
            
        self.is_active = True
        self.initial_greeting_sent = False
        self.user_explicitly_started_voice = True
        self.is_speaking = False
        self.turn_completed_received = False
        self.input_audio_buffer.clear()

        # Safely detach and stop any existing worker thread before creating a new one
        if self.worker_thread:
            old_worker = self.worker_thread
            self.worker_thread = None
            try:
                old_worker.finished.disconnect()
            except Exception:
                pass
            old_worker.stop()
            old_worker.quit()
            old_worker.wait(400)
            self._running_threads.discard(old_worker)

        worker = GeminiLiveWorker(self)
        self.worker_thread = worker
        self._last_active_worker = worker
        self._running_threads.add(worker)
        worker.finished.connect(lambda w=worker: self._on_worker_thread_finished(w))
        worker.start()
        self._is_starting = False

    @Slot()
    def toggle_pause(self):
        """Toggles pause/mute state of active voice chat session."""
        if not self.is_active:
            self.is_paused = False
            self.start()
            return False
        
        self.is_paused = not self.is_paused
        w = getattr(self, "worker_thread", None)
        if self.is_paused:
            self.on_interrupted()
            if self._reconnect_timer.isActive():
                self._reconnect_timer.stop()
            if self.mic_enable_timer.isActive():
                self.mic_enable_timer.stop()
            if w:
                w.suppress_mic_for_prompt = False
                w.is_tool_pending = False
                w.vad_active = False
                w.hangover_counter = 0
                if getattr(w, "async_queue", None):
                    while not w.async_queue.empty():
                        try:
                            w.async_queue.get_nowait()
                        except Exception:
                            break
            print("[GeminiLiveClient] Session paused (Muted).")
        else:
            self.turn_completed_received = False
            self.is_speaking = False
            if self.mic_enable_timer.isActive():
                self.mic_enable_timer.stop()
            if w:
                w.suppress_mic_for_prompt = False
                w.is_tool_pending = False
                w.vad_active = False
                w.hangover_counter = 0
                w.last_interruption_time = time.time()
                if getattr(w, "async_queue", None):
                    while not w.async_queue.empty():
                        try:
                            w.async_queue.get_nowait()
                        except Exception:
                            break
            print("[GeminiLiveClient] Session resumed (Unmuted).")
        return self.is_paused

    def send_realtime_text_prompt(self, prompt_text: str):
        """Dispatches a text instruction into the active Gemini Live session to speak immediately."""
        if not prompt_text:
            return
        w = self.worker_thread
        if w and getattr(w, "loop", None) and w.loop.is_running() and getattr(w, "async_queue", None) and self.status == "connected":
            w.suppress_mic_for_prompt = True
            def _enqueue():
                # Flush pending mic audio PCM chunks (bytes) from queue so prompt is processed cleanly.
                temp_text_items = []
                while not w.async_queue.empty():
                    try:
                        item = w.async_queue.get_nowait()
                        if isinstance(item, dict) and "text" in item:
                            temp_text_items.append(item)
                    except Exception:
                        break
                # Only keep latest text prompt if duplicate or related
                w.async_queue.put_nowait({"text": prompt_text})
            w.loop.call_soon_threadsafe(_enqueue)
            print(f"[GeminiLiveClient] Dispatched realtime text prompt to active session: {prompt_text[:80]}...")
        else:
            self.pending_initial_prompt = prompt_text
            print(f"[GeminiLiveClient] Queued pending initial prompt for startup: {prompt_text[:80]}...")
            if self.status in ("disconnected", "error"):
                self.start()

    @Slot()
    def stop(self):
        if getattr(self, "_is_stopping", False):
            return
        if not self.is_active and self.status == "disconnected":
            return
            
        self._is_stopping = True
        self.is_active = False
        self.is_continuous_mode = False
        self.is_push_to_talk = False
        self.is_ptt_holding = False
        self.is_paused = False  # Reset mute state on stop!
        self.user_explicitly_started_voice = False
        self.is_speaking = False
        self.turn_completed_received = False
        self._last_active_worker = None
        
        if hasattr(self, "_reconnect_timer"):
            self._reconnect_timer.stop()
        if hasattr(self, "mic_enable_timer"):
            self.mic_enable_timer.stop()
        
        if self.worker_thread:
            w_thread = self.worker_thread
            self.worker_thread = None
            try:
                w_thread.finished.disconnect()
            except Exception:
                pass
            w_thread.stop()
            w_thread.quit()
            w_thread.wait(500)
            self._running_threads.discard(w_thread)
        self._is_stopping = False
            
        self.cleanup_audio()
        self.status = "disconnected"
        self.state_changed.emit("disconnected")
        self.say_requested.emit("Voice chat stopped.", 2.5)

    @Slot()
    def _on_worker_thread_finished(self, worker=None):
        """Slot executed on Qt Main Thread when worker QThread finishes cleanly."""
        if worker is None:
            worker = self.sender()
        print(f"[GeminiLiveClient] Worker thread finished: {worker}")
        self._is_stopping = False
        if worker:
            try:
                worker.finished.disconnect()
            except Exception:
                pass
            self._running_threads.discard(worker)
            if self.worker_thread == worker:
                self.worker_thread = None

        # FAILSAFE: Only auto-heal if THIS FINISHED WORKER was the CURRENT ACTIVE worker,
        # session is still marked active, and we are not in an intentional stop or active reconnect
        if (worker and worker == self._last_active_worker and self.is_active 
                and not getattr(self, "_is_stopping", False) 
                and not getattr(self, "_is_reconnecting", False)):
            print("[GeminiLiveClient] Active worker thread exited unexpectedly. Auto-healing voice session...")
            self.on_connection_failed("Worker thread exited unexpectedly")

    def cleanup_audio(self):
        if self.audio_source:
            try:
                self.audio_source.stop()
            except Exception:
                pass
            self.audio_source = None
        
        if self.audio_input_device:
            try:
                self.audio_input_device.close()
            except Exception:
                pass
            self.audio_input_device = None

        if self.audio_sink:
            try:
                self.audio_sink.stop()
            except Exception:
                pass
            self.audio_sink = None
            self.audio_output_io = None

    def format_graceful_error(self, raw_error: str) -> tuple[str, str]:
        """Converts raw exceptions and codes into human-graceful sentences for Vedika while preserving technical context."""
        err = str(raw_error).strip()
        err_lower = err.lower()
        tech = err[:140]

        if any(k in err_lower for k in ["429", "resourceexhausted", "quota"]):
            graceful = "I'm catching my breath for a second! Our API quota is taking a quick rest. I'll be back shortly! 🌸"
        elif any(k in err_lower for k in ["403", "unauthenticated", "invalid_argument", "api_key"]):
            graceful = "My security key needs a quick check in .env. Let me re-verify my credentials! 🔑"
        elif any(k in err_lower for k in ["1011", "internal server error", "overloaded"]):
            graceful = "The cloud mind had a momentary hiccup. I am re-aligning our connection right now! ⚡"
        elif any(k in err_lower for k in ["timeout", "timed out", "deadline"]):
            graceful = "My connection timed out for just a heartbeat. Let me reconnect seamlessly! ⏳"
        elif any(k in err_lower for k in ["pyaudio", "audio device", "input stream", "wave", "microphone"]):
            graceful = "I'm having a little trouble hearing through your microphone. Please check your default audio device! 🎙️"
        elif any(k in err_lower for k in ["connection refused", "network", "getaddrinfo", "dns", "disconnect"]):
            graceful = "Our network link dropped for a second. Connecting right back to you! 🌐"
        else:
            graceful = "I ran into a small surprise, but don't worry—I'm sorting it out right now! ✨"

        return graceful, tech

    def start_push_to_talk(self):
        """Starts Push-to-Talk mode: ensures session is active, unmutes mic, and sets listening indicator."""
        # If continuous mode is actively running, user is already live; do not disrupt
        if getattr(self, "is_continuous_mode", False):
            return

        print("[GeminiLiveClient] Push-to-Talk: PRESSED")
        self.is_push_to_talk = True
        self.is_ptt_holding = True
        self.ptt_press_start_time = time.time()
        self.ptt_chunks_recorded = 0
        
        if not self.is_active or self.status != "connected":
            self.start()
        
        self.is_paused = False
        w = getattr(self, "worker_thread", None)
        if w:
            w.suppress_mic_for_prompt = False
            w.vad_active = True
        self.user_listening_state_changed.emit(True)

    def stop_push_to_talk(self):
        """Stops Push-to-Talk mode: signals end of speech turn to worker."""
        if getattr(self, "is_continuous_mode", False):
            return

        print("[GeminiLiveClient] Push-to-Talk: RELEASED")
        self.is_ptt_holding = False
        self.user_listening_state_changed.emit(False)

        # Debounce rapid micro-clicks (<150ms press duration and <2 recorded audio chunks)
        press_duration = time.time() - getattr(self, "ptt_press_start_time", 0.0)
        chunks = getattr(self, "ptt_chunks_recorded", 0)
        if press_duration < 0.15 and chunks < 2:
            print(f"[GeminiLiveClient] Push-to-Talk micro-click ignored (duration={press_duration*1000:.0f}ms, chunks={chunks}).")
            return

        w = getattr(self, "worker_thread", None)
        if w:
            w.vad_active = False
            w.hangover_counter = 0

            # Thread-safe enqueue to worker thread async_queue
            if getattr(w, "loop", None) and not w.loop.is_closed() and getattr(w, "async_queue", None):
                def _finish_ptt_turn():
                    try:
                        # 1. Flush small trailing silence burst (150ms = 3 chunks of zeros) to close audio envelope
                        silence_chunk = b'\x00\x00' * 800  # 1600 bytes at 16kHz 16-bit mono
                        for _ in range(3):
                            w.async_queue.put_nowait(silence_chunk)
                        # 2. Append end_of_turn message so send_audio_loop calls session.send_client_content(turn_complete=True)
                        w.async_queue.put_nowait({"end_of_turn": True})
                        print("[GeminiLiveClient] Successfully dispatched end_of_turn to worker queue!")
                    except Exception as e:
                        print(f"[GeminiLiveClient] Error enqueuing end_of_turn: {e}")

                w.loop.call_soon_threadsafe(_finish_ptt_turn)

    @Slot()
    def on_connection_established(self):
        print("[GeminiLive] Connected to Gemini Live API directly!")
        self.reconnect_count = 0
        self.status = "connected"
        self.state_changed.emit("connected")
        
        # Only announce connected if no pending initial prompt is already taking over speech
        has_pending = bool(getattr(self, "pending_initial_prompt", None))
        if not getattr(self, "is_paused", False) and not has_pending:
            # Let initial greeting or prompt be the only greeting (fixes duplicate speech)
            pass
        
        self.initialize_active_session()

    @Slot(str)
    def on_connection_failed(self, error_message):
        print(f"[GeminiLive] Connection dropped or failed: {error_message}")
        graceful, tech = self.format_graceful_error(error_message)
        self.error_occurred.emit(graceful, tech)
        if hasattr(self.pet, 'set_error'):
            self.pet.set_error(graceful, tech, 6.0)

        if not self.is_active and self.status == "disconnected":
            return

        is_paused = getattr(self, "is_paused", False)
        # If user intentionally paused, do NOT loop reconnect or say anything aloud
        if is_paused:
            print("[GeminiLive] Connection dropped while session paused. Reconnect deferred until unpaused.")
            return

        if self._reconnect_timer.isActive() or getattr(self, "_is_reconnecting", False):
            print("[GeminiLive] Reconnect already queued or in progress; debouncing signal.")
            return

        self.reconnect_count = getattr(self, 'reconnect_count', 0) + 1
        
        # Reset transition flags so they never lock out reconnect
        self._is_starting = False
        self._is_stopping = False
        
        # Check if error is quota, authentication, timeout, handshake, or repeated failure
        err_lower = str(error_message).lower()
        is_key_error = any(k in err_lower for k in [
            "403", "429", "quota", "resourceexhausted", "api_key",
            "unauthenticated", "invalid_argument", "permissiondenied", "1011",
            "timed out", "timeout", "handshake", "deadline"
        ]) or (self.reconnect_count >= 2)

        if is_key_error and self.gemini_keys and len(self.gemini_keys) > 1:
            self.current_key_index = (self.current_key_index + 1) % len(self.gemini_keys)
            print(f"[GeminiLive] Dynamic key rotation: Switched to next key ending in ...{self.gemini_keys[self.current_key_index][-4:]} (Key {self.current_key_index + 1}/{len(self.gemini_keys)})")

        print(f"[GeminiLive] Auto-reconnecting session (attempt {self.reconnect_count})...")
            
        self._greeting_was_sent = getattr(self, 'initial_greeting_sent', False)
        
        # Adaptive backoff delay: 1.5s for initial attempts, 3.0s if repeatedly dropping
        delay_ms = 1500 if self.reconnect_count <= 4 else 3000
        self._reconnect_timer.start(delay_ms)

    def reconnect_session(self):
        """Clean failsafe method to instantly refresh/reboot the Gemini Live voice session without re-greeting."""
        print("[GeminiLive] Session refresh requested (Failsafe triggered).")
        if self._reconnect_timer.isActive() or getattr(self, "_is_reconnecting", False):
            print("[GeminiLive] Reconnect already scheduled or running; debouncing.")
            return

        # Rotate key on manual failsafe reboot to guarantee a fresh connection
        if self.gemini_keys and len(self.gemini_keys) > 1:
            self.current_key_index = (self.current_key_index + 1) % len(self.gemini_keys)
            print(f"[GeminiLive] Failsafe key rotation: Switched to next key ending in ...{self.gemini_keys[self.current_key_index][-4:]}")

        was_paused = getattr(self, "is_paused", False)
        self.reconnect_count = 0
        if not was_paused and hasattr(self, 'say_requested'):
            self.say_requested.emit("Just give me a moment... 🔄", 2.5)

        self._greeting_was_sent = getattr(self, 'initial_greeting_sent', False)
        # Schedule reboot quickly (350ms) to allow any pending UI events to flush
        self._reconnect_timer.start(350)

    def _execute_reconnect(self):
        """Executes a single, serialized, debounced reconnection of the voice session."""
        print("[GeminiLive] Executing serialized voice session reconnect...")
        self._is_reconnecting = True
        try:
            was_paused = getattr(self, "is_paused", False)
            self._last_active_worker = None
            if self.worker_thread:
                old_worker = self.worker_thread
                self.worker_thread = None
                try:
                    old_worker.finished.disconnect()
                except Exception:
                    pass
                old_worker.stop()
                old_worker.quit()
                old_worker.wait(400)
                self._running_threads.discard(old_worker)

            self.cleanup_audio()
            self._is_starting = False
            self._is_stopping = False
            self.is_active = False

            self.start()
            if was_paused:
                self.is_paused = True
            if getattr(self, "_greeting_was_sent", False):
                self.initial_greeting_sent = True
        except Exception as e:
            print(f"[GeminiLive] Reconnect execution error: {e}")
        finally:
            self._is_reconnecting = False

    def initialize_active_session(self):
        self.session_activated.emit()
        print("[GeminiLive] Active session initialized. Mic and Speaker are managed by PyAudio in worker thread.")

    def send_audio_chunk(self, chunk):
        if self.is_active and self.worker_thread and self.worker_thread.loop and self.worker_thread.async_queue:
            try:
                if self.worker_thread.loop.is_running():
                    self.worker_thread.loop.call_soon_threadsafe(
                        self.worker_thread.async_queue.put_nowait, chunk
                    )
            except (RuntimeError, AttributeError):
                pass
            except Exception as e:
                print(f"[GeminiLive] Error queueing audio chunk threadsafe: {e}")

    # Unused on_ready_read_mic slot (mic capture migrated to read_mic_loop inside GeminiLiveWorker).

    def _group_into_sentence_chunks(self, text, max_words_per_chunk=10):
        """Groups raw streamed text into crisp, readable sentence chunks and deduplicates identical repeats."""
        import re
        if not text or not text.strip():
            return []
        
        raw_parts = [p.strip() for p in re.split(r'(?<=[.!?\n])\s+', text.strip()) if p.strip()]
        if not raw_parts:
            return [text.strip()]
            
        chunks = []
        current_chunk = ""
        for part in raw_parts:
            # Check for immediate repeat within same turn
            if current_chunk and part.lower() == current_chunk.lower():
                continue
            if not current_chunk:
                current_chunk = part
            else:
                combined_words = len((current_chunk + " " + part).split())
                if combined_words <= max_words_per_chunk:
                    current_chunk += " " + part
                else:
                    if not chunks or chunks[-1].lower() != current_chunk.lower():
                        chunks.append(current_chunk)
                    current_chunk = part
        if current_chunk:
            if not chunks or chunks[-1].lower() != current_chunk.lower():
                chunks.append(current_chunk)
        return chunks

    def _step_word_stream(self):
        """Streams AI speech bubble sentence-by-sentence in sync with voice audio playback."""
        if not self.is_active:
            self.word_stream_timer.stop()
            return
            
        self.sentence_chunks = self._group_into_sentence_chunks(self.text_buffer)
        if not self.sentence_chunks:
            return

        if self.current_chunk_index >= len(self.sentence_chunks):
            if self.turn_completed_received:
                self.word_stream_timer.stop()
            return

        active_chunk = self.sentence_chunks[self.current_chunk_index]
        chunk_words = active_chunk.split()

        # Stream words progressively within the active sentence
        if self.current_chunk_words_displayed < len(chunk_words):
            self.current_chunk_words_displayed += 1
            visible_words = chunk_words[:self.current_chunk_words_displayed]
            current_text = " ".join(visible_words)
            user_txt = getattr(self, "user_dialogue_buffer", "")
            if user_txt:
                self.say_dialogue_requested.emit(user_txt, current_text, 7.0)
            else:
                self.say_requested.emit(current_text, 7.0)
        else:
            # Current sentence is completely displayed
            # If more sentences exist from the speaker, wait a brief breathing pause (~320ms) then advance to next sentence!
            if self.current_chunk_index + 1 < len(self.sentence_chunks):
                if self.chunk_pause_ticks < 4:
                    self.chunk_pause_ticks += 1
                else:
                    self.chunk_pause_ticks = 0
                    self.current_chunk_index += 1
                    self.current_chunk_words_displayed = 0
            else:
                if self.turn_completed_received:
                    self.word_stream_timer.stop()

    @Slot(str)
    def on_text_received(self, text):
        self.text_buffer += text
        if not self.word_stream_timer.isActive():
            self.current_chunk_index = 0
            self.current_chunk_words_displayed = 0
            self.chunk_pause_ticks = 0
            self.word_stream_timer.start()

    @Slot(bytes)
    def on_audio_received(self, audio_bytes):
        if not self.is_active:
            return
            
        if not self.is_speaking:
            self.is_speaking = True
            self.speaking_started.emit()

        if self.worker_thread and self.worker_thread.loop and self.worker_thread.audio_out_queue:
            try:
                if self.worker_thread.loop.is_running():
                    self.turn_completed_received = False
                    self.worker_thread.loop.call_soon_threadsafe(
                        self.worker_thread.audio_out_queue.put_nowait, audio_bytes
                    )
            except (RuntimeError, AttributeError):
                pass
            except Exception as e:
                print(f"[GeminiLive] Error queueing audio chunk to speaker: {e}")

    @Slot()
    def on_turn_completed(self):
        # Keep the final sentence or full thought pinned for reading
        self.sentence_chunks = self._group_into_sentence_chunks(self.text_buffer)
        if self.sentence_chunks:
            final_sentence = self.sentence_chunks[-1]
            user_txt = getattr(self, "user_dialogue_buffer", "")
            if user_txt:
                self.say_dialogue_requested.emit(user_txt, final_sentence, 8.0)
            else:
                self.say_requested.emit(final_sentence, 8.0)
        self.word_stream_timer.stop()
        self.text_buffer = ""
        self.current_chunk_index = 0
        self.current_chunk_words_displayed = 0
        self.chunk_pause_ticks = 0
        self.turn_completed_received = True
        
        # Check if speaker has already finished playing all audio chunks
        is_playing = False
        if self.worker_thread:
            is_playing = getattr(self.worker_thread, "is_playing_audio", False) or (self.worker_thread.audio_out_queue and not self.worker_thread.audio_out_queue.empty())
            
        if not is_playing:
            print("[GeminiLive] Turn completed and speaker already idle. Re-enabling mic immediately.")
            self.turn_completed_received = False
            if self.worker_thread:
                self.worker_thread.suppress_mic_for_prompt = False
            if self.is_speaking:
                self.is_speaking = False
                self.speaking_stopped.emit()
        else:
            print("[GeminiLive] Turn completed; audio still playing from buffer. Waiting for playback to finish before re-enabling mic.")
            # Generous safety timer (25s) so long AI responses are never cut off by premature mic unmuting
            self.mic_enable_timer.start(25000)

    @Slot()
    def enable_mic_after_speaking(self):
        if not self.is_active or getattr(self, "is_paused", False):
            return
        w = getattr(self, "worker_thread", None)
        if w and (getattr(w, "is_playing_audio", False) or (w.audio_out_queue and not w.audio_out_queue.empty())):
            print("[GeminiLive] Speaker is still playing audio buffer. Extending mic mute by 5s...")
            self.mic_enable_timer.start(5000)
            return
        print("[GeminiLive] Microphone re-enabled after speaking (Playback complete).")
        self.turn_completed_received = False
        if w:
            w.suppress_mic_for_prompt = False
        if self.is_speaking:
            self.is_speaking = False
            self.speaking_stopped.emit()

    @Slot()
    def on_interrupted(self):
        print("[GeminiLive] Interruption detected!")
        self.turn_completed_received = False
        self.mic_enable_timer.stop()
        if self.is_speaking:
            self.is_speaking = False
            self.speaking_stopped.emit()
        
        # Thread-safely flag worker thread to flush audio queue via the flush_speaker flag.
        # The worker's play_audio_loop checks this flag and drains the queue safely from
        # its own asyncio event loop — do NOT drain asyncio.Queue directly from this Qt main thread.
        if self.worker_thread:
            self.worker_thread.flush_speaker = True
            self.worker_thread.suppress_mic_for_prompt = False

        self.word_stream_timer.stop()
        self.sentence_chunks = []
        self.current_chunk_index = 0
        self.current_chunk_words_displayed = 0
        self.chunk_pause_ticks = 0
        self.text_buffer = ""
        self.say_requested.emit("...", 1.5)

    @Slot()
    def on_thinking_started(self):
        pass
