# 🚀 Vedika 2.0 (Vyomanta LMS & AI Platform) — Complete Implementation Catalog

> **Status:** Production-Grade Multi-Tenant SaaS Platform  
> **Repository:** `LMSWEBAPP/Vedika-v2.0`  
> **Last Updated:** September 2026  
> **Architecture:** Decoupled Headless Next.js 14 (App Router) + Upstash Redis Distributed Store + Gemini 2.5 Flash / Gemini Multimodal Live Voice + Pyodide WASM + Three.js 3D WebGL Labs  

---

## 📑 Table of Contents

1. [Platform Architecture & Vision](#1-platform-architecture--vision)
2. [Multi-Tenant Hierarchy & Role-Based Access Control (RBAC)](#2-multi-tenant-hierarchy--role-based-access-control-rbac)
3. [Module 1: Super Admin Console & SaaS Management](#module-1-super-admin-console--saas-management)
4. [Module 2: The Vedika AI Ecosystem (The 4 Pillars)](#module-2-the-vedika-ai-ecosystem-the-4-pillars)
   - [2.1 Ask Vedika — General AI Tutor](#21-ask-vedika--general-ai-tutor)
   - [2.2 Code with Vedika — AI Coding Companion](#22-code-with-vedika--ai-coding-companion)
   - [2.3 Code Puzzles — 3D Algorithmic Sandbox](#23-code-puzzles--3d-algorithmic-sandbox)
   - [2.4 Viva Voce & Technical Mock Interview Suite](#24-viva-voce--technical-mock-interview-suite)
5. [Module 3: Full-Duplex Real-Time Voice AI (Gemini Live Engine)](#module-3-full-duplex-real-time-voice-ai-gemini-live-engine)
6. [Module 4: 3D Virtual Science Labs Simulator](#module-4-3d-virtual-science-labs-simulator)
   - [4.1 3D Math Lab & AI OCR Math Solver](#41-3d-math-lab--ai-ocr-math-solver)
   - [4.2 3D Physics Lab & PhET Simulation Viewer](#42-3d-physics-lab--phet-simulation-viewer)
   - [4.3 3D Chemistry Lab & Atomic/Molecular Builder](#43-3d-chemistry-lab--atomicmolecular-builder)
   - [4.4 3D Biology Lab & Ecosystem Simulator](#44-3d-biology-lab--ecosystem-simulator)
7. [Module 5: In-Browser WebAssembly Python Playground & 3D AST Visualizer](#module-5-in-browser-webassembly-python-playground--3d-ast-visualizer)
8. [Module 6: 4D/3D Particle Mascot & Canvas Shaders](#module-6-4d3d-particle-mascot--canvas-shaders)
9. [Module 7: Course Curriculum & 3D Interactive Carousel](#module-7-course-curriculum--3d-interactive-carousel)
10. [Module 8: Quizzes, Assessments & Assignment Workspaces](#module-8-quizzes-assessments--assignment-workspaces)
11. [Module 9: Digital Resource Library & Placement Board](#module-9-digital-resource-library--placement-board)
12. [Module 10: Security, Authentication & Data Layer](#module-10-security-authentication--data-layer)
13. [Complete Directory of Routes & API Endpoints](#complete-directory-of-routes--api-endpoints)
14. [Technology Stack & Dependency Inventory](#technology-stack--dependency-inventory)
15. [Verification & Operational Readiness](#verification--operational-readiness)

---

## 1. Platform Architecture & Vision

Vedika 2.0 is an AI-native, multi-tenant engineering education and Learning Management System (LMS). It is engineered as a centrally hosted SaaS where all intellectual property, source code, AI prompts, and Voice WebSockets remain completely secured on the platform owner's infrastructure, while serving multiple client institutions (colleges, universities, training cohorts).

```
+---------------------------------------------------------------------------------------+
|                                    PLATFORM CLIENTS                                   |
|   [ Super Admin Console ]       [ Institution Admin Portal ]      [ Student Workspace ]|
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                             NEXT.JS 14 APP ROUTER GATEWAY                             |
|  * RBAC Authentication & Session Guard    * In-Memory / Distributed Redis Cache        |
|  * Serverless API Endpoints              * Timing-Safe Token Validation & Cookies     |
+---------------------+---------------------+---------------------+---------------------+
                      |                     |                     |
                      v                     v                     v
+---------------------------+ +---------------------------+ +---------------------------+
|    AI & VOICE SERVICES    | |     DATA ACCESS LAYER     | |    CLIENT RUNTIME (WASM)  |
| * Gemini 2.5 Flash API    | | * Upstash Distributed     | | * Pyodide WebAssembly     |
| * Gemini Live WebSocket   | |   Redis Store             | |   Python 3 Runtime        |
| * PCM16 Real-Time Audio   | | * TiDB Cloud Relational   | | * Three.js WebGL Engine   |
| * Emotion & Sentiment Ana.| | * Local JSON Persistence  | | * 3D AST Code Graph       |
+---------------------------+ +---------------------------+ +---------------------------+
```

---

## 2. Multi-Tenant Hierarchy & Role-Based Access Control (RBAC)

The application implements a strict 3-tier Role-Based Access Control system:

```
                  👑 PLATFORM SUPER ADMIN (Owner)
                   │  - Global SaaS KPIs & Telemetry
                   │  - Client College Provisioning & Deletion
                   │  - AI & Voice Minutes Quota Allocation
                   │  - Instant Organization Kill Switch (Suspend)
                   │  - Zero-Credential Support Impersonation
                   ▼
       🏛️ INSTITUTION ADMINISTRATORS (Colleges / Orgs)
        │  - Scoped strictly to their own organization (`org_id`)
        │  - Manage student enrollments & batch assignments
        │  - View cohort analytics, quiz performance & grades
        ▼
          🎓 INDIVIDUAL LEARNERS / STUDENTS
             - Scoped to their own enrolled courses and submissions
             - Interactive 3D Labs, AI Tutors, Voice Sessions & Coding
```

---

## 3. Module 1: Super Admin Console & SaaS Management

*Recently implemented with zero tech debt and full production-grade security.*

### Key Features:
1. **Master Control Center (`/super-admin`)**:
   - Tabbed layout covering **Client Organisations**, **AI & Voice Metering**, **Institution Admins**, and **Platform Health & Audit Trail**.
   - Instant search across college names, slugs, domains, and administrator emails.
   - Filtering by subscription tiers (`starter`, `pro`, `enterprise`) and statuses (`active`, `suspended`).
2. **Organization Lifecycle Management**:
   - Modal-based creation: auto-provisions college record, unique slug, seat quota, and default institution admin account.
   - Dynamic Quota Modification: Live adjustment of max student seats, Gemini Live Voice minutes, and LLM token budgets.
   - **Emergency Kill Switch**: One-click toggle between `active` and `suspended`. Suspended organizations immediately lock out all affiliated students and admins upon API access.
   - Safe Organization Deletion with cascade removal.
3. **AI & Voice Usage Telemetry**:
   - Per-tenant tracking of consumed Gemini Live voice minutes vs. contract quota.
   - Per-tenant tracking of token consumption for Ask Vedika, Viva, and Lab Tutors.
   - Color-coded capacity indicators: Green (<70%), Yellow (70-90%), Red (>90% threshold).
4. **Zero-Credential Support Impersonation ("View as Org Admin")**:
   - Minting of short-lived (1-hour) scoped JWT tokens for customer support.
   - Allows platform owners to debug student/course issues inside `/admin` without requiring the client's actual password.
   - Creates an immutable audit log entry for every impersonation session.
5. **Real-Time Platform Health & Audit Logs**:
   - Automated heartbeat monitoring for Upstash Redis (`PONG` latency in ms), Core Next.js API Gateway, and Voice WebSocket server.
   - Chronological audit log of all administrative actions with actor identity and UTC timestamps.
6. **Authentication Security (`/super-admin/login`)**:
   - Protected by `crypto.timingSafeEqual` preventing timing attacks on master credentials.
   - Encrypted 12-hour session stored in an HTTP-only, secure, `SameSite=Lax` cookie (`super_admin_jwt`).

---

## 4. Module 2: The Vedika AI Ecosystem (The 4 Pillars)

### 2.1 Ask Vedika — General AI Tutor (`/vedika-ai`)
- **Multi-Turn Contextual Conversation**: Powered by Google Gemini with session memory maintained in Upstash Redis.
- **LaTeX Math Derivations**: Formatted step-by-step mathematical proofs rendered via KaTeX.
- **Socratic Guidance**: Guides students with conceptual clues and reflective questioning rather than raw answers.
- **Document & Syllabus Upload**: File drag-and-drop supporting PDF notes and syllabus files with real-time text extraction for targeted querying.
- **Interactive Markdown Viewer**: Code blocks with syntax highlighting, copy-to-clipboard, and formatted diagrams.

### 2.2 Code with Vedika — AI Coding Companion
- **Dual-Pane IDE & Companion**: Integrated Monaco-style code editor with syntax highlighting for Python, JavaScript, C++, and Java.
- **Side-by-Side Execution Terminal**: Real-time code execution with output capture and error formatting.
- **Big-O Complexity Analysis**: Real-time algorithmic analysis displaying Time and Space complexity badges.
- **3D Code Visualizer**: WebGL 3D Abstract Syntax Tree (AST) visualizing control flow, function calls, and loop nesting.
- **Error Diagnostics & Explanations**: Instant pinpointing of syntax errors, index out-of-bounds, and runtime exceptions.

### 2.3 Code Puzzles — 3D Algorithmic Sandbox
- **Curated Problem Bank**: Algorithmic puzzles ranging from basic arrays to dynamic programming and graph traversals.
- **Interactive Test Runner**: Automated test case execution against hidden inputs.
- **3D Problem Sandbox**: Interactive visual representations of data structures (arrays, binary trees, linked lists).

### 2.4 Viva Voce & Technical Mock Interview Suite (`/viva-interview`)
- **Two Distinct Assessment Modes**:
  1. *Academic Viva Mode*: Rigorous conceptual Q&A tailored to enrolled engineering coursework.
  2. *Placement Mock Interview Mode*: Industry-grade behavioral and technical interview simulations.
- **4.7MB Question Bank**: Multi-domain question pool covering Python, DSA, System Design, SQL, and Aptitude.
- **Voice-Driven Live Evaluation**: Real-time speech input with voice response and dynamic follow-up questioning.
- **Solid White Particle Avatar**: Specialized 3D particle bot reflecting student speaking state and examiner reactions.
- **Comprehensive Scorecard Generation**: Detailed evaluation reporting Technical Depth, Communication Clarity, Problem Solving, and Final Grade.

---

## 5. Module 3: Full-Duplex Real-Time Voice AI (Gemini Live Engine)

- **WebSocket Audio Gateway**: Dedicated full-duplex WebSocket connection (`ws://localhost:5001/ws/voice-live` and combined Next.js fallback).
- **PCM16 Real-Time Streaming**:
  - Captures microphone audio at 16,000Hz PCM16 directly from client Web Audio API.
  - Receives and plays synthesized tutor voice at 24,000Hz with zero round-trip latency.
- **Interruptibility (Barge-in Support)**: Immediate audio playback interruption when the student begins speaking.
- **Dynamic Sentiment & Emotion Sync**: Live sentiment classification adjusts the particle mascot aura and pacing in real time.

---

## 6. Module 4: 3D Virtual Science Labs Simulator (`/vedika-labs`)

Immersive, browser-based 3D laboratory simulations running entirely client-side using Three.js and WebGL.

### 6.1 3D Math Lab & AI OCR Math Solver
- **Interactive 3D Function Grapher**: Real-time parametric surface and 3D curve rendering (`z = f(x, y)`).
- **Canvas Math Handwriting OCR**: Canvas drawing pad where students write equations; AI OCR extracts and graphs the expression with step-by-step derivation.

### 6.2 3D Physics Lab & PhET Interactive Sims
- **3D Projectile Motion & Kinematics**: Adjustable angle, launch velocity, and planet gravity presets (Earth, Moon, Mars, Jupiter) with real-time trajectory curves.
- **Planetary Orbit Simulator**: Multi-body gravitational physics with orbital trails and velocity vectors.
- **Integrated PhET Viewer**: Embedded HTML5 interactive STEM physics simulations with full-screen support.

### 6.3 3D Chemistry Lab & Molecular Builder
- **3D Subatomic Particle Builder**: Interactive nucleus assembler allowing learners to add protons, neutrons, and electrons to observe atomic orbitals and stability.
- **Interactive Periodic Table**: Element property cards with electron configurations and ionization energies.
- **3D Molecular Viewer**: Ball-and-stick molecular models with real-time rotation and bonding angles.

### 6.4 3D Biology Lab & Ecosystem Simulator
- **Microscopic Cell Exploration**: Zoomable 3D plant and animal cell models highlighting organelles (nucleus, mitochondria, ribosomes).
- **Ecosystem Dynamics**: Predator-prey population simulation visualizing ecological equilibrium.

---

## 7. Module 5: In-Browser WebAssembly Python Playground & 3D AST Visualizer (`/playground`)

- **Zero-Server Client Python Execution**: Integrated **Pyodide WebAssembly** runtime running full Python 3.11 in the browser.
- **Interactive `input()` Support**: Custom async stdin generator enables interactive console prompts without blocking the browser thread.
- **3D Code Structure Visualizer**: Generates an interactive Three.js 3D node-link graph from Python AST code to understand execution hierarchy.
- **Preloaded Code Templates**: Algorithms, data structures, scientific math scripts, and graphic demos ready for instant execution.

---

## 8. Module 6: 4D/3D Particle Mascot & Canvas Shaders

- **Interactive Canvas Engine (`VedikaParticleBot.jsx`)**: 
  - Thousands of procedural particles forming the Vedika mascot face and dynamic expressive emotions.
  - Interactive mouse tracking, particle dispersion, and gravity recoil on pointer hover.
- **Page-Specific Aesthetic Themes**:
  - *Quizzes*: Crisp Gold & Solid White particles on deep luxury black canvas.
  - *Assignments*: Electric Purple and pure white contrast with softened particle aura.
  - *Viva & Interviews*: High-contrast pure solid white particle formulation without muddy glow effects.
  - *Hero Section*: Parametric harmonic wave backgrounds and particle rings with customizable density controls.

---

## 9. Module 7: Course Curriculum & 3D Interactive Carousel (`/courses`)

- **3D Course Carousel (`CourseEmotionsSlider.jsx`)**: Physics-based interactive 3D card carousel for selecting courses without vertical scroll clipping.
- **Curriculum & Lesson Workspace (`/courses/[courseId]/lesson/[lessonId]`)**:
  - Markdown lesson notes with KaTeX equations.
  - Embedded video player with playback speed and progress bookmarks.
  - Integrated course announcement feed.
  - Persistent AI learning companion sidebar for immediate lesson Q&A.

---

## 10. Module 8: Quizzes, Assessments & Assignment Workspaces (`/quizzes`, `/assignments`)

- **Quizzes Workspace**:
  - Timed multiple-choice evaluations with instant answer validation.
  - Category filters matching engineering subjects.
  - Real-time score calculation and answer breakdown.
- **Assignment Submissions**:
  - Rich text and markdown assignment editor.
  - Embedded code snippet attachment.
  - Submission status tracking (`Draft`, `Submitted`, `Graded`).

---

## 11. Module 9: Digital Resource Library & Placement Board (`/resources`, `/jobs`)

- **Resource Hub**:
  - Comprehensive collection of engineering cheat sheets and downloadable PDF guides.
  - Instant client-side search across subjects and tags.
- **Career & Placement Board**:
  - Active tech job and internship directory for engineering students.
  - Curved border-beam highlight animations on featured opportunities.
  - Direct apply links and skill requirement tags.

---

## 12. Module 10: Security, Authentication & Data Layer

- **Timing-Safe Auth**: `crypto.timingSafeEqual` applied on all critical administrative authentication flows.
- **Distributed Dual-Tier State Engine (`organizations.js`)**:
  - Tier 1: **Upstash Redis** REST API for ultra-low latency distributed read/writes.
  - Tier 2: Automated JSON file persistence fallback ([`organizations_data.json`](file:///c:/Users/25002/Desktop/v0.2/vedika-2.0/frontend/lib/organizations_data.json)), guaranteeing continuous operation during external database quota exhaustion.
- **JWT Cryptographic Utilities (`auth.js`)**:
  - HMAC-SHA256 token signing and verification with automated ephemeral keys for development safety.
  - Centralized server authentication wrapper ([`serverAuth.js`](file:///c:/Users/25002/Desktop/v0.2/vedika-2.0/frontend/lib/serverAuth.js)).

---

## Complete Directory of Routes & API Endpoints

### Frontend Application Routes

| Path | Access Level | Description |
| :--- | :--- | :--- |
| `/` | Public | Landing page with 3D particle hero, features showcase, and course previews |
| `/super-admin/login` | Public | Master administrator login portal with timing-safe validation |
| `/super-admin` | **Super Admin** | Multi-tenant SaaS command center (orgs, telemetry, impersonation, audit) |
| `/admin` | **Org Admin** | Institution-scoped portal for managing students, batches, and course analytics |
| `/dashboard` | Student / User | Personalized student hub displaying enrolled courses, stats, and tasks |
| `/courses` | Student / User | 3D carousel course directory |
| `/courses/[id]` | Student / User | Course syllabus and lesson list |
| `/courses/[id]/lesson/[id]`| Student / User | Interactive lesson viewer with video and AI tutor drawer |
| `/vedika-ai` | Student / User | Ask Vedika General AI Tutor with LaTeX & document upload |
| `/vedika-labs` | Student / User | 3D Virtual Science Labs (Math, Physics, Chemistry, Biology) |
| `/viva-interview` | Student / User | Real-time voice-driven Viva Voce & Technical Mock Interview engine |
| `/playground` | Student / User | In-browser WebAssembly Python IDE with 3D AST code visualizer |
| `/quizzes` | Student / User | Interactive engineering MCQ quizzes with gold particle mascot |
| `/assignments` | Student / User | Assignment workspace with purple particle theme and code submissions |
| `/resources` | Student / User | Engineering cheatsheets and digital academic resource library |
| `/jobs` | Student / User | Placement job and internship portal |

### Backend API Routes

| Endpoint | Method | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/super-admin/login` | `POST` | Master Credentials | Authenticates Super Admin and issues 12h secure HTTP-only cookie |
| `/api/super-admin/auth/me` | `GET`, `POST` | **Super Admin** | Session verification and logout endpoint |
| `/api/super-admin/orgs` | `GET`, `POST` | **Super Admin** | List/search organizations or provision a new client organization |
| `/api/super-admin/orgs/[id]`| `GET`, `PATCH`, `DELETE`| **Super Admin** | Retrieve details, update quotas/status, or delete an organization |
| `/api/super-admin/orgs/[id]/impersonate`| `POST` | **Super Admin** | Generates 1-hour scoped token to view `/admin` as that organization |
| `/api/super-admin/metrics` | `GET` | **Super Admin** | Aggregates global SaaS KPIs, telemetry, and pings service health |
| `/api/gemini` | `POST` | Authenticated | Gemini 2.5 Flash chat completions for Ask Vedika & Code Companion |
| `/api/tutor/chat` | `POST` | Authenticated | Multi-turn AI tutoring endpoint with Redis conversation memory |
| `/api/voice/session` | `POST` | Authenticated | Generates ephemeral session tokens for Gemini Multimodal Live Voice |
| `/api/health` | `GET` | Public | System status and service health check |

---

## Technology Stack & Dependency Inventory

### Frontend & Core
- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 20+ & Browser WebAssembly (Pyodide 0.25+)
- **Styling**: Vanilla CSS Modules + Tailwind CSS
- **3D Graphics & Visualizations**: Three.js, Lucide Icons, KaTeX, Canvas 2D Particles

### AI & Voice Services
- **LLM Engine**: Google Gemini 2.5 Flash via `@google/genai`
- **Voice Engine**: Gemini Multimodal Live API over WebSockets
- **Audio Processing**: Web Audio API (PCM16 16kHz capture, 24kHz synthesis)

### Data & State Architecture
- **Distributed Cache**: Upstash Redis (`@upstash/redis`)
- **Relational / Vector Database**: TiDB Cloud MySQL 8.0 Protocol
- **Fallback Store**: Atomic Local JSON State Store (`organizations_data.json`)
- **Authentication**: HMAC-SHA256 Signed JSON Web Tokens (JWT)

---

## Verification & Operational Readiness

- **Linter Status**: `next lint` executes with **0 errors**.
- **Data Engine**: Redis reads/writes verified, dual-tier fallback active and verified.
- **Git Synchronization**: Clean working tree on `main` (`dc5d5b9`).
- **All Core Features**: Fully integrated and available across student, institution admin, and super admin tiers.
