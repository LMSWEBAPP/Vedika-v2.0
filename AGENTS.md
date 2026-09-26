# Vedika 2.0 - Agent Guidelines & Architectural Rules

## 🎙️ Mandatory Voice AI Agent Architecture (Ask Vedika & Coding Tutor)

The Voice AI Agent implemented in `frontend/components/voice-tutor/VoiceAgentView.jsx`, `frontend/voice-server.js`, and `frontend/server-with-ws.js` is a zero-latency, full-duplex speech-to-speech companion directly connected to the Google Gemini Multimodal Live API.

### CRITICAL RULES - NEVER REGRESS OR REPLACE:

1. **Full-Duplex WebSocket Streaming Only**:
   - The audio pipeline **must stream raw 16kHz 16-bit mono PCM chunks** from the user's microphone (`AudioContext` + `ScriptProcessorNode`) directly over WebSockets (`ws://localhost:5001/api/ws` with dual-port fallback to port `3000`).
   - **DO NOT** replace, hijack, or wrap this with browser Web Speech API (`window.SpeechRecognition`, `window.webkitSpeechRecognition`, or `window.speechSynthesis`).
   - **DO NOT** replace live WebSocket audio streams with HTTP `/api/gemini/stream` polling or mock TTS.

2. **Incoming Audio Playback (`playPcmAudioChunk`)**:
   - Audio chunks emitted by Gemini Multimodal Live over WebSocket as `{ type: 'audio', data: base64 }` **must be decoded into 24,000Hz Web Audio buffers** and scheduled for gapless playback using `nextPlayTimeRef`.
   - Incoming audio chunks must **never** be omitted or ignored in `ws.onmessage`.

3. **Barge-In / Interruption**:
   - When Gemini Live detects student speech, it emits `{ type: 'interrupted' }`.
   - The client must immediately invoke `stopAllAudioPlaybacks()` to halt active and queued `AudioBufferSourceNode` handles and reset `nextPlayTimeRef = 0`.

4. **Synchronized Transcription & Real-Time Sentiment**:
   - The WebSocket protocol emits `agent-transcription` and `user-transcription` (with real-time sentiment: *Struggling/Confused* 😟, *Happy/Confident* 😊, *Curious* 🤔, *Calm/Conversational* 😐).
   - Display live transcript bubbles (`VoiceChatMessages.jsx`) and sentiment badges in real time.

5. **Inline Mode Navigation**:
   - In both inline mode (`GeneralTutor.jsx`, `CodingTutor.jsx`) and standalone modal mode, always provide a clear top navigation bar with a "Back to Chat" button (`onClose`) so users can transition seamlessly between text and voice modes.

6. **Dual-Port WebSocket Resilience**:
   - Always connect to dedicated voice port `5001` first, with automatic fallback to current host port `3000` (Next.js server-with-ws) to prevent connection timeouts if one server is stopped.
