# Vedika 2.0 - Complete Architecture & Codebase Index Map
*Auto-generated & verified knowledge base for low-token, instant code navigation.*

---

## 🚀 Quick Navigation: "Where Do I Make My Change?"

Use this index to make sudden changes without scanning the entire repository or exhausting LLM token limits:

| Requirement / Change Needed | Exact File(s) to Modify | Key Functions / Components |
|---|---|---|
| **Voice AI WebSocket server / logic** | `frontend/voice-server.js`<br>`frontend/server-with-ws.js` | `WebSocketServer`, `getGeminiClient()`, `analyzeSentiment()` |
| **Voice AI client UI / Audio playback** | `frontend/components/voice-tutor/VoiceAgentView.jsx`<br>`frontend/components/voice-tutor/VoiceChatMessages.jsx` | `playPcmAudioChunk()`, `stopAllAudioPlaybacks()`, `nextPlayTimeRef` |
| **Gemini Live Client API wrapper** | `frontend/lib/gemini-live.js`<br>`frontend/lib/keys.js` | `GeminiLiveClient`, `getAllKeys()` (Key rotation) |
| **AI Tutor Chat (General Tutor)** | `frontend/components/GeneralTutor.jsx`<br>`frontend/app/api/tutor/chat/route.js` | `GeneralTutor()`, streaming response handler |
| **Coding Tutor & Python Sandbox** | `frontend/components/CodingTutor.jsx`<br>`frontend/components/Playground.jsx` | `CodingTutor()`, `Playground()`, CodeMirror |
| **Python Execution Trace / Pyodide** | `frontend/public/pyodide.worker.js`<br>`frontend/components/usePyodide.js` | `sys.settrace()` tracing hook, `ArrayVisualizer.jsx` |
| **Infographic & Spatial Generator** | `frontend/lib/infographicEngine.js`<br>`frontend/lib/infographic/spatialEngine.js`<br>`frontend/lib/infographic/geminiPlanner.js` | `generateInfographic()`, layout engines |
| **Mermaid Diagram Renderer** | `frontend/components/MermaidRenderer.jsx`<br>`frontend/components/CodeFlowchartVisualizer.jsx` | `mermaid.render()`, SVG sanitizer |
| **LMS Headless Frappe REST Client** | `frontend/lib/frappe.js`<br>`frontend/lib/frappe-db.js` | `getCourses()`, `getCourseSyllabus()`, `saveCourseSyllabus()` |
| **LMS Backend Proxy Route** | `frontend/app/api/frappe/proxy/route.js` | REST proxy to Frappe port `8080` / `8000` |
| **Admin Course & Syllabus Outlines** | `frontend/app/admin/courses/[id]/page.jsx`<br>`frontend/components/AdminSidebar.jsx` | `CourseOutlinePage()`, syllabus tree sync |
| **User Authentication / JWT / Sessions** | `frontend/lib/auth.js`<br>`frontend/lib/jwtCache.js`<br>`frontend/app/api/auth/login/route.js` | `authenticateRequest()`, `getJwtToken()` |
| **Desktop Mascot GUI & Window** | `vedika-desktop-pet/main.py`<br>`vedika-desktop-pet/ui/transparent_window.py` | `DesktopPetApp`, `TransparentWindow`, drag/drop |
| **Desktop Mascot State & Animations** | `vedika-desktop-pet/engine/state_machine.py`<br>`vedika-desktop-pet/engine/pet.py` | `IdleState`, `DangerState`, `KnockoutState` |
| **Desktop Mascot Speech / Gemini Live**| `vedika-desktop-pet/engine/gemini_live.py`<br>`vedika-desktop-pet/engine/memory.py` | `GeminiLiveWorker`, SQLite memory manager |
| **Frappe Backend Setup / Docker** | `backend/docker-compose.yml`<br>`backend/lms_backend_architecture.md` | MariaDB (`3306`), Redis (`6379`), Frappe Bench (`8080`) |

---

## 🧠 Graphify Knowledge Graph Quick Queries

The codebase is fully mapped in `graphify-out/graph.json` (1,932 nodes, 4,470 edges).
To find anything instantly without LLM tokens, run this command from the repository root:

```powershell
# Query any keyword, symbol, or concept (BFS 2-hop search)
& (Get-Content graphify-out\.graphify_python) -m graphify query "<keyword>"

# Examples:
& (Get-Content graphify-out\.graphify_python) -m graphify query "voice streaming"
& (Get-Content graphify-out\.graphify_python) -m graphify query "pyodide"
& (Get-Content graphify-out\.graphify_python) -m graphify query "frappe proxy"
& (Get-Content graphify-out\.graphify_python) -m graphify query "infographic planner"
```

To view the full interactive 2D graph in your browser:
Open `graphify-out/graph.html` directly in any web browser.

---

## 🏛️ System Architecture & Subsystem Blueprint

```
v0.2/
├── frontend/             # Next.js 14 App Router, Web Audio, Pyodide WASM, Gemini Live
├── backend/              # Frappe LMS Docker setup, MariaDB, Python schema/worker scripts
├── vedika-desktop-pet/   # Standalone Python/PyQt Desktop Companion Mascot
├── graphify-out/         # Persistent Knowledge Graph (graph.json, graph.html, GRAPH_REPORT.md)
└── vedika-2.0/           # [ARCHIVE / BACKUP ONLY] (Excluded from active builds)
```

### 1. Frontend (`frontend/`)
- **Framework:** Next.js 14.2.5 (React 18.3.1, Tailwind CSS).
- **Core Entrypoints:**
  - `voice-server.js`: Dedicated WebSocket server (port `5001`) connecting directly to Gemini Multimodal Live API. Handles 16kHz PCM audio streaming, barge-in interruptions, and live sentiment analysis.
  - `server-with-ws.js`: Next.js HTTP server bundled with raw WebSocket server (port `3000`) for dual-port resilience.
- **Key Modules:**
  - `components/voice-tutor/`: Zero-latency full-duplex speech-to-speech companion. Uses raw `AudioContext` and 24,000Hz Web Audio buffer scheduling (`playPcmAudioChunk`).
  - `components/coding-tutor/`: Python code editor and interactive execution visualizer. Runs `pyodide.worker.js` with `sys.settrace()` to serialize call frames into Framer Motion animations.
  - `components/infographic/` & `lib/infographicEngine.js`: Visual infographics planner converting tutor responses into structured spatial visual scenes and Mermaid diagrams.
  - `lib/gemini.js` & `lib/keys.js`: Client rotation across multiple `GEMINI_API_KEY_*` environment tokens to prevent rate limits.
  - `lib/frappe.js`: REST integration layer communicating with Headless Frappe LMS for courses, syllabi, enrollments, and quizzes.

### 2. Backend (`backend/`)
- **Stack:** Docker Compose running Frappe Bench (`8080:8000`), Socket.io (`9000`), MariaDB (`3306`), and Redis (`6379`).
- **Automation Scripts:**
  - `queue_worker.py`: Background job worker.
  - `patch_api.py` / `patch_schemas.py`: Schema patches and DocType field alignments.
  - `create_students.py`: Automated student seeding and enrollment permissions.
  - `dummy_server.py`: Local mock server for testing when Docker containers are inactive.

### 3. Vedika Desktop Pet (`vedika-desktop-pet/`)
- **Stack:** Python 3 + PyQt / Win32 GUI.
- **Components:**
  - `main.py`: Application coordinator and loop.
  - `ui/transparent_window.py`: Transparent, click-through, draggable desktop mascot overlay.
  - `engine/state_machine.py`: Finite state machine (`Idle`, `Danger`, `Fall`, `Jump`, `Knockout`, `Music`, `Speaking`).
  - `engine/gemini_live.py`: Full-duplex speech worker connecting the mascot to Gemini Live.
  - `engine/memory.py`: Local SQLite vector/conversation memory (`data/memory.db`).
  - `engine/activity_tracker.py` & `screen_capturer.py`: On-screen activity context awareness.

---

## 📡 Complete REST API Gateway Directory (`frontend/app/api/`)

| Endpoint Route | Handler File | Description |
|---|---|---|
| `/api/auth/login` | `frontend/app/api/auth/login/route.js` | User authentication & session generation |
| `/api/auth/jwt` | `frontend/app/api/auth/jwt/route.js` | JWT verification and issuance |
| `/api/auth/ws-token` | `frontend/app/api/auth/ws-token/route.js` | Temporary auth tokens for WebSocket voice connections |
| `/api/auth/google` | `frontend/app/api/auth/google/route.js` | Google OAuth redirect initiation |
| `/api/courses` | `frontend/app/api/courses/route.js` | List active LMS courses |
| `/api/courses/[id]/syllabus` | `frontend/app/api/courses/[id]/syllabus/route.js` | Fetch syllabus outline (chapters & lessons) |
| `/api/frappe/proxy` | `frontend/app/api/frappe/proxy/route.js` | REST proxy to headless Frappe Docker container |
| `/api/gemini` | `frontend/app/api/gemini/route.js` | Rotated multi-key Gemini LLM prompt gateway |
| `/api/tutor/chat` | `frontend/app/api/tutor/chat/route.js` | Streaming tutor discussion handler |
| `/api/code-puzzle/generate` | `frontend/app/api/code-puzzle/generate/route.js` | Dynamic code problem generation |
| `/api/code-puzzle/validate` | `frontend/app/api/code-puzzle/validate/route.js` | Solution test runner & validation |
| `/api/infographic/generate` | `frontend/app/api/infographic/generate/route.js` | Generates structured layout scenes & Mermaid diagrams |
| `/api/youtube/explain` | `frontend/app/api/youtube/explain/route.js` | Analyzes YouTube transcript and generates interactive breakdown |
| `/api/mascot/bridge` | `frontend/app/api/mascot/bridge/route.js` | IPC / WebSocket communication between web app & desktop mascot |
| `/api/memory` | `frontend/app/api/memory/route.js` | Redis/database conversation memory persistence |
| `/api/super-admin/orgs` | `frontend/app/api/super-admin/orgs/route.js` | Multi-tenant organization CRUD |

---

## ⚠️ Architectural Invariants & Rules (DO NOT BREAK)

1. **Mandatory Voice AI Agent Audio Pipeline (`AGENTS.md`)**:
   - Stream raw **16kHz 16-bit mono PCM chunks** from microphone directly over WebSocket (`ws://localhost:5001/api/ws` with port `3000` fallback).
   - **NEVER** replace with browser Web Speech API (`SpeechRecognition` / `speechSynthesis`).
   - Incoming audio chunks **must** be decoded into **24,000Hz Web Audio buffers** with gapless playback using `nextPlayTimeRef`.
   - On `{ type: 'interrupted' }`, immediately halt active AudioBufferSourceNodes and reset playback time.
2. **Key Rotation (`frontend/lib/keys.js`)**:
   - Always route Gemini queries through rotated keys (`GEMINI_API_KEY`, `GEMINI_API_KEY_1`, `..._4`) to prevent HTTP 429 quota exhaustion.
3. **Archive Directory Exclusions**:
   - `vedika-2.0/` is an inactive backup repository. **Never** include it in search scripts or graph builds; it bloats scans by 54,000 files.
