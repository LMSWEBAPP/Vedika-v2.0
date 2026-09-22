# 🌟 Vedika 2.0 (Vyomanta LMS & AI Platform) — Complete Features Catalog

> **Version:** 2.0  
> **Architecture:** Headless Next.js 14 App Router + Frappe LMS REST Backend + Multi-Engine AI (Gemini 2.5 Flash, Gemini Live, TiDB Cloud Vector RAG, Pyodide WASM, Three.js WebGL)  
> **Target Audience:** Engineering Students, STEM Learners, Instructors, Academic Institutions & Enterprise Cohorts  

---

## 📑 Table of Contents

1. [Executive Summary & Platform Vision](#-1-executive-summary--platform-vision)
2. [System Architecture & Technology Topology](#-2-system-architecture--technology-topology)
3. [Student Dashboard & Learning Command Center](#-3-student-dashboard--learning-command-center)
4. [Course Curriculum & Interactive Lesson Experience](#-4-course-curriculum--interactive-lesson-experience)
5. [The Vedika AI Ecosystem (The 4 Pillars)](#-5-the-vedika-ai-ecosystem-the-4-pillars)
   - [5.1 Ask Vedika — General AI Tutor](#51-ask-vedika--general-ai-tutor)
   - [5.2 Code with Vedika — AI Coding Companion](#52-code-with-vedika--ai-coding-companion)
   - [5.3 Code Puzzles — 3D Algorithmic Challenges & Sandbox](#53-code-puzzles--3d-algorithmic-challenges--sandbox)
   - [5.4 Viva Voce & Technical Mock Interview Suite](#54-viva-voce--technical-mock-interview-suite)
6. [Vedika Virtual 3D Science Labs Simulator](#-6-vedika-virtual-3d-science-labs-simulator)
   - [6.1 3D Math Lab & AI OCR Tutor](#61-3d-math-lab--ai-ocr-tutor)
   - [6.2 3D Physics Lab & PhET Interactive Sims](#62-3d-physics-lab--phet-interactive-sims)
   - [6.3 3D Chemistry Lab & Molecular Simulations](#63-3d-chemistry-lab--molecular-simulations)
   - [6.4 3D Biology Lab & Ecosystem Simulator](#64-3d-biology-lab--ecosystem-simulator)
7. [Client-Side WebAssembly Python Playground & 3D Visualizer](#-7-client-side-webassembly-python-playground--3d-visualizer)
8. [Real-Time Bidirectional Voice AI Agent](#-8-real-time-bidirectional-voice-ai-agent)
9. [Quizzes, Evaluations & Assignment Workspace](#-9-quizzes-evaluations--assignment-workspace)
10. [Resource Hub & Digital Academic Library](#-10-resource-hub--digital-academic-library)
11. [Career Opportunities & Placement Job Board](#-11-career-opportunities--placement-job-board)
12. [Student Progress, Metrics & Historical Analytics](#-12-student-progress-metrics--historical-analytics)
13. [Enterprise Administration & Institution Portal](#-13-enterprise-administration--institution-portal)
14. [Security, Ingestion Pipeline & Multi-Tenant RAG Engine](#-14-security-ingestion-pipeline--multi-tenant-rag-engine)
15. [Navigation, Theming & Accessibility Features](#-15-navigation-theming--accessibility-features)
16. [Comprehensive Feature Matrix & Route Directory](#-16-comprehensive-feature-matrix--route-directory)

---

## 🚀 1. Executive Summary & Platform Vision

**Vedika 2.0 (Vyomanta LMS)** is an AI-native, high-performance, immersive Learning Management and Engineering Education platform. Unlike traditional static LMS platforms that only display text and pre-recorded videos, Vedika 2.0 fuses:

- **Client-Side Isolated Execution**: In-browser Python WebAssembly (WASM via Pyodide) with real-time interactive terminals and bidirectional standard input (`input()`).
- **Interactive 3D WebGL Scientific Labs**: Parametric mathematical solvers running inside Three.js rendering loops for Physics, Chemistry, Biology, and Mathematics.
- **Multimodal AI Tutoring**: Context-aware tutoring with multi-turn memory, real-time Big-O complexity analysis, Socratic code guidance, and LaTeX step-by-step math derivations.
- **Real-Time Voice Agent**: Zero-latency speech-to-speech interaction powered by WebSockets and Gemini Live with dynamic student sentiment adjustment.
- **Realistic Viva & Technical Interview Simulation**: Live speech-driven academic viva examination, placement aptitude tests (with a 4.7MB question pool across 5 domains), and technical mock interview scorecards.
- **Decoupled Headless Foundation**: A modern Next.js 14 frontend paired with a containerized Frappe LMS MariaDB backend, Redis caching, and TiDB Cloud HNSW vector indexing.

---

## 🏗️ 2. System Architecture & Technology Topology

Vedika 2.0 is built on a resilient, decoupled headless architecture designed to scale seamlessly across thousands of concurrent learners:

```
+-----------------------------------------------------------------------------------+
|                            NEXT.JS 14 FRONTEND (CLIENT)                           |
|  * Student Dashboard           * Courses & Lessons Viewer      * Voice Agent      |
|  * 4D Vedika Particle Mascot   * Three.js 3D Virtual Labs      * WASM Playground  |
|  * 3D Code Visualizer (AST)    * Placement Viva & Interviews   * Resource Library |
+----------------------------------------+------------------------------------------+
                                         | REST / WebSockets / SSE
                                         v
+-----------------------------------------------------------------------------------+
|                        API GATEWAY & MIDDLEWARE (NEXT.JS / NODE)                  |
|  * /api/tutor (RAG Text Query)         * /api/ws (Live Audio WebSocket Proxy)     |
|  * /api/auth (JWT Proxy & Role Auth)   * /api/resources (Digital Library API)     |
|  * /api/evaluate-assignment (AI Grader)* /api/gemini (Dynamic Math & OCR Solvers) |
+-------------------+--------------------+--------------------+---------------------+
                    |                    |                    |
                    v                    v                    v
+------------------------+ +------------------------+ +----------------------------+
|  FRAPPE LMS BACKEND    | |  VECTOR & RAG TIER     | |   CLOUD AI RUNTIMES        |
|  * MariaDB Database    | |  * TiDB Cloud (HNSW)   | |  * Gemini 2.5 Flash (RAG)  |
|  * Redis Cache Layer   | |  * Gemini Embeddings   | |  * Gemini Live (WebRTC/WS) |
|  * Course/Batch DocType| |  * Upstash Redis Cache | |  * Cloudflare R2 / B2 (S3) |
|  * Quiz & Grade Engine | |  * Python Queue Worker | |  * Pyodide WebAssembly     |
+------------------------+ +------------------------+ +----------------------------+
```

### Core Technologies
- **Frontend Framework**: Next.js 14 (App Router), React 18, Framer Motion animations.
- **Interactive 3D Engine**: Three.js (WebGL canvas, OrbitControls, raycasters, parametric geometries, dynamic tube/wireframe meshes).
- **Code Execution & Terminal**: Pyodide (WASM) in dedicated Web Workers (`pyodide.worker.js`), CodeMirror 6, `xterm.js` with `xterm-addon-fit`.
- **Backend CMS & Storage**: Frappe LMS framework, MariaDB relational database, Docker containerization.
- **Vector Search & Memory**: TiDB Cloud (768-dimensional HNSW vector index `idx_embedding`), Upstash Redis for sliding-window multi-turn conversation memory.
- **Cloud Object Storage**: Cloudflare R2 / Backblaze B2 (S3-compatible, secured via short-lived pre-signed URLs).

---

## 📊 3. Student Dashboard & Learning Command Center

**Route:** `/` (`frontend/components/Dashboard.jsx`)

The student dashboard serves as the central mission control for every learner, combining actionable progress metrics, personalized study streaks, and interactive micro-learning tools:

- **Time-Aware Dynamic Greeting**: Greets learners with dynamic greetings ("Good morning", "Good afternoon", "Good evening") alongside their verified student profile name.
- **Daily Learning Streak Counter**: Visual fire indicator (`Flame`) tracking consecutive study days, persisted in local storage and synced with LMS login timestamps.
- **Interactive Vedika Particle Mascot (`VedikaParticleBot`)**:
  - A real-time Three.js/HTML5 Canvas particle simulation of the Vedika mascot.
  - Implements **Bruno Imbrizi touch-texture physics**: particles scatter based on mouse velocity and touch force, dynamically reforming with `easeOutSine` relaxation curves.
  - Displays playful speech bubbles, motivational quotes, and micro-interactions on hover/click.
- **Interactive Daily Concept Flashcard**:
  - Renders dual-sided micro-concept flashcards covering STEM and CS topics.
  - 3D flipping animation on click/hover with complete concept summaries, formulas, and diagrams.
- **Daily Skill Check (Live MCQ)**:
  - Real-time mini-quiz displayed directly on the dashboard.
  - Interactive radio selection, instant answer verification, immediate feedback explanations, and state persistence.
- **Dynamic Learning Checklist**:
  - Interactive daily task manager ("Resume active syllabus", "Ask a question in AI Tutor", "Review Daily Concept Card", "Complete Daily Skill Check").
  - Auto-updates completion statuses when corresponding activities are performed.
- **Enrolled Courses Grid & Progress Indicators**:
  - Real-time progress bars calculating completed lessons vs. total syllabus lessons.
  - "Next Up" quick-action launcher that automatically identifies the first uncompleted lesson in the student's active course and provides a one-click resume link.
- **Quick Ask AI Bar**:
  - Embedded direct input field allowing students to ask questions from the dashboard and jump straight into the AI tutor with their prompt pre-loaded.

---

## 📚 4. Course Curriculum & Interactive Lesson Experience

**Routes:** `/courses` (`frontend/components/CoursePage.jsx`), `/lesson/[id]` (`frontend/components/LessonPage.jsx`)

### 4.1 Course Catalog & Discovery Experience
- **Zim Carousel 3D Showcase**: An interactive Three.js cylindrical carousel that rotates enrolled and recommended courses in 3D space with depth-scaled card transformations.
- **Course Emotions Slider (`CourseEmotionsSlider`)**: A novel discovery interface allowing students to filter and explore courses based on their emotional goals and learning mindsets (e.g., "Curious & Analytical", "Career Transition", "Deep Master", "Exam Prep").
- **Retro Pacman Pagination (`PacmanPagination`)**: Custom animated pagination where an interactive Pacman avatar chomps through dots representing course catalog pages.
- **Dynamic Interactive Particle Background**: Canvas-rendered floating network particles that gravitationally react to student cursor movements.
- **Course Syllabus Tree**: Interactive accordion displaying Chapters, Lessons, estimated read/watch durations, lesson types (Video, Article, Quiz, Assignment), and completion checks.
- **One-Click Cohort Enrollment**: Instant student enrollment syncing with Frappe LMS tables and Redis cache.

### 4.2 Next-Generation Lesson Viewer (`LessonPage`)
- **AI-Synchronized YouTube Player (`VideoPlayerWithAI`)**:
  - Embedded custom video player playing YouTube course lectures.
  - Displays synchronized AI transcripts with clickable timestamp milestones.
  - **Timestamp-Linked Seeking**: Clicking on any timestamp referenced in AI explanations instantly seeks the YouTube video to the exact second.
- **Video AI Explainer Card (`VideoAIExplainerCard`)**:
  - A contextual card overlay that extracts key concepts taught at the current timestamp, offering instant bulleted definitions, formulas, and diagrams.
- **Comprehensive Companion Tabs System (`CompanionTabs`)**:
  1. **Ask Vedika (AI Lesson Companion)**: An integrated AI tutor scoped specifically to the current lesson's video transcript and reading material.
  2. **Personal Voice Dictation Notes**:
     - Built-in note-taking workspace with Markdown support.
     - **Web Speech API Dictation**: Real-time microphone dictation allowing students to speak their notes aloud while watching videos.
     - Auto-tags notes with the current video playback timestamp for instant replay.
     - Filter notes by current lesson or view all notes across the entire course.
  3. **Lesson Q&A Forum**: Discussion thread for student queries, peer responses, and instructor announcements.
  4. **AI Practice Quiz & Knowledge Check**: Generates custom practice quizzes on demand based on the lesson's exact transcript.
  5. **Course Announcements & Updates**: Broadcast messages and alert banners sent by instructors.
- **Embedded PDF Viewer Modal (`PDFViewerModal`)**: In-app document viewer for course syllabus documents, slides, and academic textbooks with zoom, full-screen, and pagination controls.
- **Practice Playground Slide-out Modal (`PracticePlaygroundModal`)**: Allows students to instantly slide open a Python WASM coding environment from within the lesson to test algorithms discussed in the video without leaving the page.
- **Two-Way Progress Synchronization**: Marks lessons as completed and synchronizes with MariaDB via Frappe REST APIs and Upstash Redis.

---

## 🤖 5. The Vedika AI Ecosystem (The 4 Pillars)

**Hub Route:** `/vedika-ai` (`frontend/app/vedika-ai/page.jsx`)

The Vedika AI ecosystem provides a comprehensive suite of four specialized AI companions, accessible through a 3D animated hub:

```
                              VEDIKA AI ECOSYSTEM
                                       |
    +------------------+---------------+----------------+------------------+
    |                  |                                |                  |
    v                  v                                v                  v
5.1 ASK VEDIKA    5.2 CODE WITH VEDIKA            5.3 CODE PUZZLES    5.4 VIVA & MOCK
(General Tutor)   (Coding Companion)              (3D Visualizer)     (Interviews & Aptitude)
* 4 Pedagogy Modes * @analyze, @tips, @fix        * Multi-file IDE    * Oral Viva Voce
* Slider Detail    * Big-O Complexity Cards       * Live Web Preview  * Tech Job Interviews
* Auto Flashcards  * Socratic Interactive Guide   * 3D Memory Maps    * 5-Category Aptitude
* Mermaid Visuals  * In-browser Pyodide WASM     * Error Line Badges * Rubric Scorecards
```

### 5.1 Ask Vedika — General AI Tutor
**Route:** `/vedika-ai/ask` or `/general-tutor` (`frontend/components/GeneralTutor.jsx`)

A versatile conversational AI tutor designed for conceptual mastery across all subjects:
- **4 Pedagogical Scaffolding Modes**:
  - **Beginner**: Uses simple everyday analogies, intuitive breakdowns, and step-by-step scaffolding.
  - **Exam**: Targets academic syllabus rubrics, mark distribution, key definitions, and scoring keywords.
  - **Interview**: Focuses on high-level executive summaries, system trade-offs, and common interviewer probe questions.
  - **Revision**: Produces ultra-compact bullet points, formula cheat-sheets, and rapid-fire review summaries.
- **Detail Depth Slider**: Allows students to select answer depth (**Short** ~100 words, **Medium** ~250 words, **Deep** comprehensive guide).
- **Instant Study Scaffolding Shortcuts**:
  - **Coding / Concept Quiz**: Triggers the AI to create an interactive 3-question MCQ quiz on the active topic.
  - **Flashcards Deck**: Automatically builds an interactive study flashcard set that flips on hover.
  - **Visual Summary**: Groups key concepts into formatted comparison tables and Markdown diagrams.
  - **Explain Simpler**: ELI5 mode translating complex academic jargon into intuitive metaphors.
- **Mermaid.js Diagram Rendering**: Automatically compiles Mermaid flowcharts, sequence diagrams, and architecture graphs directly in the chat stream.
- **Multi-Turn Session History**: Sessions are grouped by date ("Today", "Yesterday", "This Week", "Older") in the sidebar with renaming and deletion capabilities.

---

### 5.2 Code with Vedika — AI Coding Companion
**Route:** `/vedika-ai/code` or `/coding-tutor` (`frontend/components/CodingTutor.jsx`)

An intelligent pair-programming assistant integrated with a live Python code playground:
- **Split-Pane IDE & Chat Interface**: Write code on one side and ask the AI coding tutor questions on the other.
- **Intelligent `@` Mention Triggers**:
  - `@analyze`: Scans student code and generates a structured **Analytics Card** detailing:
    - **Time Complexity** ($O(1)$, $O(n)$, $O(n \log n)$, $O(n^2)$, etc.)
    - **Space Complexity** (Auxiliary memory usage)
    - **Bug Severity Badge** (Low, Medium, High, Critical)
    - **DSA Concepts Identified** (e.g., Two Pointers, Dynamic Programming, Sliding Window)
    - **Optimization Scope & Suggestions**
  - `@tips`: Provides Socratic hints and nudges without revealing direct solutions.
  - `@fix`: Proposes concrete algorithmic fixing strategies and code patches.
  - `@explain`: Delivers a deep theoretical explanation of why the bug occurred and how the fix works.
  - `@help`: Step-by-step interactive Socratic guide walking the student through fixing their own code.
- **Prompt Injection Defense**: Sanitizes student prompts against jailbreaking and prompt leakage (`detectPromptInjection`).
- **One-Click Code Transfer**: Transfer code blocks generated by the AI directly into the live playground editor with a single click.

---

### 5.3 Code Puzzles — 3D Algorithmic Challenges & Sandbox
**Route:** `/vedika-ai/puzzle` or `/code-puzzle` (`frontend/components/CodePuzzle.jsx`)

A gamified, multi-language coding environment with integrated 3D visualizers:
- **Dual Problem Domains**:
  - **Faculty Python Challenges**: Algorithmic puzzles ranging from array manipulations to tree traversals.
  - **Web Development Puzzles**: Interactive HTML5, CSS3, and JavaScript challenges.
- **Multi-File Virtual Workspace**:
  - Supports multi-file tabs: `main.py`, `input.txt`, `output.txt`, `index.html`, `style.css`, `script.js`, plus custom user-created files.
  - File creation, file renaming, and deletion in a virtual file tree.
- **Live Responsive Web Preview**:
  - Real-time sandboxed iframe preview of HTML/CSS/JS web projects.
  - Device viewport toggling: **Desktop** ($100\%$), **Tablet** ($768\text{px}$), and **Mobile** ($375\text{px}$).
- **Custom CodeMirror Error Line Widgets**:
  - Custom line-level error widgets (`cm-error-line-widget`) rendered directly beneath the line containing a syntax or runtime error.
  - Displays instant inline error hints and suggestions without cluttering the console.
- **Automated Test Runner & Assertion Engine**:
  - Executes student code against hidden and visible test suites.
  - Displays passing test counts, input/output diffs, and execution execution times.
- **AI Solution Hints Drawer**: Sliding drawer offering tiered hints (Level 1 Hint, Level 2 Logic, Level 3 Full Explanation).

---

### 5.4 Viva Voce & Technical Mock Interview Suite
**Route:** `/viva-interview` (`frontend/app/viva-interview/page.jsx`)

A massive, multi-mode oral evaluation engine supporting academic exams, industry job interviews, and campus placement tests:

```
                            VIVA & MOCK INTERVIEW SUITE
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
     v                                   v                                   v
MODE 1: ACADEMIC VIVA              MODE 2: TECHNICAL INTERVIEWS        MODE 3: PLACEMENT APTITUDE
* School / College / PG            * Frontend, Backend, AI/ML, DevOps  * 4.7MB Question Database
* Comprehensive Oral Voce          * Junior, Mid-Level, Senior Tiers   * Quantitative (22 Topics)
* Real-time Speech-to-Speech       * STAR Behavioral & System Design   * Logical Reasoning (16 Topics)
* Dynamic Socratic Probing         * In-interview Code Editor          * Verbal & Non-Verbal
* Professor Personality Selector   * Comprehensive Rubric Scorecard    * LaTeX KaTeX Formulas
```

#### A. Mode 1: Academic Viva Voce
- **Education Tiers**: Configurable for **School**, **College**, and **Postgraduate (PG)** levels.
- **Viva Focus Scopes**:
  - *Comprehensive Oral Voce*: Covers the entire subject curriculum.
  - *Theory Deep Dive*: Probes foundational proofs, definitions, and derivations.
  - *Practical Experiment Viva*: Focuses on laboratory apparatus, error analysis, and procedures.
  - *Rapid Fire Cross-Exam*: High-tempo interrogation testing quick recall.
- **Examiner Persona Selector**: Select between *Encouraging Mentor*, *Balanced Professor*, and *Strict External Examiner*.
- **Speech-to-Speech Interaction**: Real-time microphone capture via Web Speech API and voice synthesis via Text-to-Speech (TTS).
- **Adaptive Cross-Examination**: AI listens to the student's answer, identifies logical flaws or knowledge gaps, and dynamically asks follow-up probe questions.

#### B. Mode 2: Technical Job Interviews
- **Industry Role Profiles**: Specialized tracks for **Frontend Engineer**, **Backend Engineer**, **Fullstack Developer**, **AI/ML Engineer**, **DevOps & Cloud Specialist**, **Data Engineer**, and **System Design Architect**.
- **Seniority Calibrations**: Tailored question banks for **Junior**, **Mid-Level**, and **Senior** candidates.
- **Interview Formats**:
  - *Interactive Live Screen*: Conversational technical screening.
  - *Live Code Challenge*: Split-screen coding workspace where the interviewer evaluates live algorithmic problem-solving.
  - *Behavioral & Leadership*: STAR (Situation, Task, Action, Result) methodology evaluation.
  - *Architectural System Design*: High-level scalability, caching, load balancing, and database schema probing.
- **Comprehensive Rubric Scorecard**:
  - Evaluates candidates across 4 core dimensions: **Technical Depth**, **Problem Solving**, **Communication Clarity**, and **Code Quality**.
  - Generates detailed constructive feedback, identified strengths, critical red flags, and a printable PDF/paper evaluation report.

#### C. Mode 3: Placement Aptitude Examination
- **Massive 4.7MB Question Bank** (`lib/aptitudeQuestions.json`):
  - **Quantitative Aptitude (22 Topics)**: Number System, Percentages, Profit & Loss, Simple & Compound Interest, Ratio & Proportion, Time & Work, Pipes & Cisterns, Speed Distance & Time, Permutations & Combinations, Probability, Mensuration 2D/3D, Geometry, Progressions (AP/GP), Data Interpretation, etc.
  - **Logical Reasoning (16 Topics)**: Coding-Decoding, Blood Relations, Seating Arrangement, Syllogisms, Statement & Assumptions, Clocks & Calendars, Cubes & Dice, Venn Diagrams, Analogies, etc.
  - **Verbal Ability (13 Topics)**: Reading Comprehension, Synonyms & Antonyms, Error Detection, Sentence Correction, Para Jumbles, Active/Passive Voice, Direct/Indirect Speech, Idioms & Phrases.
  - **Non-Verbal Reasoning (6 Topics)**: Mirror Images, Paper Folding, Figure Series, Pattern Completion, Embedded Figures.
  - **CS & Technical Fundamentals**: Computer Fundamentals, Pseudocode, C, C++, Java, Python, SQL, OS, DBMS, Computer Networks, OOPs.
- **Real-Time Exam Simulator**:
  - Timed countdown timer with auto-submit.
  - Question navigation palette with color-coded statuses (Answered, Unanswered, Marked for Review).
  - Step-by-step hint reveals and full solution derivations.
  - Mathematical formulas rendered cleanly with KaTeX LaTeX typesetting (`MathEquationRenderer`).
  - Detailed post-exam performance analytics breakdown.

---

## 🔬 6. Vedika Virtual 3D Science Labs Simulator

**Hub Route:** `/vedika-labs` (`frontend/app/vedika-labs/page.jsx`)

The Virtual Science Labs represent an advanced client-side WebGL scientific laboratory. Running on Three.js with zero server simulation delay, each lab provides custom 3D parametric simulations, real-world differential equation solvers, and fully integrated PhET HTML5 interactive experiments.

```
                              VEDIKA VIRTUAL 3D LABS
                                        |
     +-------------------+--------------+---------------+-------------------+
     |                   |                              |                   |
     v                   v                              v                   v
6.1 MATH LAB        6.2 PHYSICS LAB                6.3 CHEMISTRY LAB   6.4 BIOLOGY LAB
* 2D/3D Plotter     * Simple Pendulum ($ODE$)      * Bohr Atom Builder * 3D Animal Cell
* AI OCR & Voice    * Projectile Kinematics        * Gas Laws (PV=nRT) * Ecosystem Web
* Pythagoras 3D     * Snell's Law & TIR            * Acid-Base Titrate * Natural Selection
* Unit Circle Trig  * Spring-Mass Harmonic         * Gas RMS Diffusion * Action Potential
* Calculus Tangents * Ohm's Law Circuit (3D)       * Periodic Trends   * Membrane Channels
```

---

### 6.1 3D Math Lab & AI OCR Tutor
**Route:** `/vedika-labs/math` (`frontend/components/labs/MathLab.jsx`)

- **Interactive Whiteboard & Function Plotter**:
  - Dynamic 2D/3D Cartesian graphing canvas.
  - Real-time curve plotting for linear ($y = mx + c$), quadratic ($y = ax^2 + bx + c$), cubic, exponential, and trigonometric equations.
  - Slider controls dynamically redraw roots, vertices, and intercepts.
- **AI Math OCR & Voice Tutor**:
  - **Handwriting & Photo Upload**: Upload an image of a handwritten math problem; the AI extracts LaTeX formulas via Gemini OCR.
  - **Speech Recognition**: Dictate math questions using the microphone.
  - **Step-by-Step LaTeX Derivation**: Step-by-step solutions rendered via KaTeX with intermediate algebraic proofs.
- **Interactive Visual Concept Demonstrators**:
  1. **Pythagoras Theorem**: Visual geometric proof with dynamically expanding square areas ($a^2 + b^2 = c^2$).
  2. **Circle Sector & Windshield Wiper**: Real-world wiper and clock simulation computing arc length ($l = r\theta$) and sector area ($A = \frac{1}{2}r^2\theta$).
  3. **3D Solid Surface Area & Volume**: Interactive 3D Cylinders, Cones, Spheres, and Cuboids with dynamic height, radius, and volume calculations.
  4. **Unit Circle & Trigonometry**: Interactive angle scrubber displaying real-time $\sin\theta$, $\cos\theta$, and $\tan\theta$ projections on the unit circle.
  5. **Calculus Tangents & Derivatives**: Secant-to-tangent transition visualizer demonstrating the limit definition of the derivative:
     $$\lim_{\Delta x \to 0} \frac{f(x + \Delta x) - f(x)}{\Delta x} = \frac{dy}{dx}$$

---

### 6.2 3D Physics Lab & PhET Interactive Sims
**Route:** `/vedika-labs/physics` (`frontend/components/labs/PhysicsLab.jsx`, `PhetSimViewer.jsx`)

- **Custom Three.js 3D Physics Solvers**:
  1. **Simple Pendulum Lab**:
     - Solves the non-linear damped pendulum differential equation via numerical Euler integration on every frame:
       $$\frac{d^2\theta}{dt^2} + \frac{g}{L}\sin\theta + c\frac{d\theta}{dt} = 0$$
     - Renders metallic sphere bob, tension line, and real-time `THREE.ArrowHelper` vectors showing instantaneous **Velocity (Green)** and **Acceleration (Red)**.
     - Controls: String length ($L$), Bob mass ($M$), Gravity ($g$ — Earth, Moon, Jupiter), and Air Damping ($c$).
  2. **Projectile Motion Lab**:
     - Solves 2D kinematic trajectory equations:
       $$x(t) = v \cos\theta \cdot t, \quad y(t) = y_0 + v \sin\theta \cdot t - \frac{1}{2}gt^2$$
     - Dynamic 3D cannon barrel with rotating elevation angle, fired projectile sphere, and parabolic line trails (`THREE.Line`).
  3. **Reflection & Snell's Law Refraction**:
     - Evaluates Snell's law:
       $$n_1 \sin\theta_1 = n_2 \sin\theta_2$$
     - Computes light paths, refracted ray bending, and automatically simulates **Total Internal Reflection (TIR)** when incident angle exceeds the critical angle ($\theta_c = \arcsin(n_2/n_1)$).
  4. **Spring-Mass Damped Harmonic Oscillator**:
     - Solves second-order harmonic motion:
       $$\frac{d^2y}{dt^2} + \frac{c}{M}\frac{dy}{dt} + \frac{k}{M}y = 0$$
     - Renders a 3D helical spring using dynamically scaled `THREE.TubeGeometry`.
  5. **Ohm's Law 3D Circuit**:
     - Computes current $I = V/R$.
     - Visualizes circuit components (battery, resistor, switch) and animates glowing electrons traversing wires at drift velocities proportional to current $I$.
- **PhET Interactive Physics Catalog**:
  - Fully embedded HTML5 simulations: *Circuit Construction Kit DC*, *Forces & Motion Basics*, *Simple & Double Pendulum Lab*, *Projectile Motion*, *Energy Skate Park*, *Wave Interference & Young's Double Slit*, *Gravity & Planetary Orbits*, and *Ohm's Law Visualizer*.
- **Integrated Lab Tutor Drawer (`LabTutorDrawer`)**:
  - Context-primed AI tutor briefing students on experiment objectives, key formulas, and interactive Viva voce self-tests.

---

### 6.3 3D Chemistry Lab & Molecular Simulations
**Route:** `/vedika-labs/chemistry` (`frontend/components/labs/ChemistryLab.jsx`)

- **Custom Three.js 3D Chemistry Solvers**:
  1. **Atomic Structure Bohr Builder**:
     - Clusters red protons and blue neutrons in the nucleus.
     - Animates electrons revolving in concentric Bohr orbital shells ($K, L, M, N$) at velocities inversely proportional to orbit radius.
     - Dynamically calculates atomic number ($Z$), mass number ($A$), and net ionic charge.
  2. **Gas Laws (PV = nRT) Chamber**:
     - Solves ideal gas equations:
       $$P = \frac{nRT}{V}$$
     - Glass chamber populated with bouncing molecular spheres whose kinetic speeds scale with temperature ($T$).
     - Moveable piston lid translating vertically to change volume ($V$).
  3. **Acid-Base Titration Reaction**:
     - Solves titration neutralization and pH curves:
       $$\text{pH} = -\log_{10}[\text{H}^+]$$
     - Buret drips NaOH base drops into an Erlenmeyer flask containing HCl acid.
     - Dynamically transitions flask liquid color from transparent to vibrant magenta pink when phenolphthalein passes $\text{pH} > 8.2$.
  4. **Molecular Gas Diffusion**:
     - Dual-chamber box separated by a sliding partition.
     - Simulates Graham's law of effusion and Root-Mean-Square molecular diffusion velocities:
       $$v_{\text{rms}} = \sqrt{\frac{3RT}{M_w}}$$
  5. **Periodic Table 3D Trends**:
     - Visualizes atomic radius and electronegativity trends across elements $Z=1$ through $Z=10$.
     - Scales 3D atomic radii and color-codes electronegativity on a gradient from blue to bright red.
- **PhET Chemistry Catalog**:
  - Embedded simulations: *Build an Atom*, *pH Scale: Acids & Bases*, *Solution Concentration & Molarity*, *States of Matter & Phase Changes*, *Gas Properties*, *Molecule Shapes (VSEPR Theory)*, *Reactants Products & Leftovers (Limiting Reagents)*, and *Balancing Chemical Equations*.

---

### 6.4 3D Biology Lab & Ecosystem Simulator
**Route:** `/vedika-labs/biology` (`frontend/components/labs/BiologyLab.jsx`)

- **Custom Three.js 3D Biology Solvers**:
  1. **3D Animal Cell Organelles Explorer**:
     - High-fidelity 3D meshes for **Nucleus**, **Mitochondria**, **Endoplasmic Reticulum (ER)**, **Golgi Apparatus**, and **Lysosomes**.
     - Implements `THREE.Raycaster` to detect student cursor clicks on individual organelles.
     - Selected organelles pulse with scaling animations while detailed physiological cards appear in the sidebar.
  2. **Ecosystem Food Web (Predator-Prey Simulator)**:
     - Implements numerical integration of **Lotka-Volterra differential equations**:
       $$\frac{dP}{dt} = \alpha P - \beta P R$$
       $$\frac{dR}{dt} = \delta P R - \gamma R - \epsilon R F$$
       $$\frac{dF}{dt} = \eta R F - \theta F$$
     - Renders a living 3D landscape with green plants ($P$), hopping white rabbits ($R$), and running orange foxes ($F$).
     - Accompanied by a synchronized real-time SVG line chart plotting species population fluctuations over time.
- **PhET Biology Catalog**:
  - Embedded simulations: *Natural Selection & Bunny Evolution*, *Gene Expression Essentials (Transcription & Translation)*, *Neuron Action Potential & Voltage-Gated Channels*, *Color Vision & Retinal Cone Photoreceptors*, and *Cell Membrane Transport & Passive/Active Channels*.

---

## 💻 7. Client-Side WebAssembly Python Playground & 3D Visualizer

**Component:** `frontend/components/Playground.jsx`

The Vedika Python Playground eliminates server-side sandbox bottlenecks by executing Python directly in the user's browser using WebAssembly:

- **Isolated Pyodide WASM Worker**:
  - Python scripts compile and execute inside a dedicated browser Web Worker (`pyodide.worker.js`).
  - Completely immune to server downtime, network latency, and malicious host exploits.
- **Full-Featured Interactive Terminal (`xterm.js`)**:
  - Integrated terminal with `FitAddon` for responsive resizing.
  - Supports ANSI color codes, clear screen sequences, and backspaces.
  - **Bidirectional STDIN Support**: Real-time handling of Python's `input()` prompts, pausing execution until the student types into the terminal.
- **Dual Visualizer System**:
  1. **2D Code Flowchart Visualizer (`CodeFlowchartVisualizer`)**:
     - Parses code into an Abstract Syntax Tree (AST) and generates a visual flowchart.
     - As code executes, the active branch, loop, or condition node illuminates in real time.
  2. **3D Memory & Execution Flow Visualizer (`CodeVisualizer3D`)**:
     - Renders call stack frames, local variables, and heap objects in Three.js 3D space.
     - Visualizes pointer assignments, list sorting, and array swapping animations.
- **Execution Step-Through Tracing**:
  - Trace code execution step-by-step with **Play**, **Pause**, **Step Forward**, and **Step Backward** controls.
  - Variable playback speed ($1\times$, $1.5\times$, $2\times$).
- **Draggable Multi-Pane Layout**: Horizontal and vertical drag splitters allowing students to customize the ratio between Editor, Visualizer, Terminal, and Instructions.

---

## 🎙️ 8. Real-Time Bidirectional Voice AI Agent

**Components:** `frontend/components/voice-tutor/VoiceAgentView.jsx`, `voice-server.js`

Vedika 2.0 incorporates a low-latency, voice-first AI companion:

- **WebSocket Audio Pipeline**:
  - Captures raw PCM audio from the student's microphone via the Web Audio API.
  - Encodes audio into base64 JSON chunks and streams it over WebSockets to `voice-server.js`.
  - Bridges directly into **Gemini 3.1 Flash Live** for real-time speech-to-speech interaction without intermediate speech-to-text delays.
- **Interactive Robot Audio Visualizer (`VoiceRobotVisualizer`)**:
  - A real-time Canvas audio visualizer that pulses, changes facial expressions, and animates its audio equalizer rings in response to voice volume and frequency.
- **Real-Time Sentiment & Pace Adaptation**:
  - Analyzes the student's vocal cadence and transcript sentiment.
  - If hesitation, frustration, or confusion is detected, the agent dynamically adjusts its system instructions to speak slower, simplify vocabulary, and introduce intuitive analogies.
- **Synchronized Live Transcript**: Displays real-time dual transcription of both the student's speech and the AI agent's responses.

---

## 📝 9. Quizzes, Evaluations & Assignment Workspace

**Routes:** `/quizzes`, `/assignments` (`frontend/components/QuizzesAssignmentsWorkspace.jsx`)

A unified assessment workspace managing automated testing and long-form assignments:

### 9.1 Interactive Domain Quizzes
- **Categorized Quiz Catalog**: Quizzes categorized by course, module, and difficulty.
- **Timed Testing Engine**: Time-limited quiz sessions with live progress indicators.
- **Immediate Evaluation**: Auto-grades multiple-choice questions, calculates percentage scores, compares against passing thresholds, and records attempts in Frappe MariaDB.
- **Post-Quiz Question Review**: Review correct answers, selected options, and detailed pedagogical rationales.

### 9.2 Project & Assignment Workspace
- **Multi-Question Prompts**: Structured assignments featuring essay prompts, coding tasks, and project submissions.
- **Draft Persistence**: Auto-saves student submission drafts locally and remotely.
- **AI Automated Assignment Evaluator (`/api/evaluate-assignment`)**:
  - Evaluates student code and long-form written submissions against grading rubrics.
  - Generates instant preliminary scores and qualitative feedback before instructor review.

---

## 📖 10. Resource Hub & Digital Academic Library

**Route:** `/resources` (`frontend/app/resources/page.jsx`, `ResourcesHub.jsx`)

A comprehensive academic library and competitive programming repository:

- **Centralized Digital PDF Library (`ResourcesLibrary`)**:
  - Backed by extensive categorized academic repositories (`pdf_categories_rows.csv`, `pdf_resources_rows.csv`).
  - Searchable by title, subject category, and subcategory.
  - Grid and List views with built-in PDF viewer integration.
- **Interactive Cheat Sheet Collection (`ResourcesCheatSheets`)**:
  - Complete syntax and command lookup guides for **Python**, **JavaScript**, **HTML5**, **CSS3**, **SQL**, **Git**, and **Markdown**.
  - Dual-pane Markdown Cheat Sheet editor with live side-by-side rendering.
- **Data Structures & Algorithms (DSA) Sheet (`ResourcesDSA`)**:
  - Curated topic-wise DSA tracks (Blind 75, Striver-style problem sheets).
  - Status tracking (Completed, In Progress, Unvisited).
- **Company-Wise Tech Interview Question Bank (`ResourcesDSACompanyWise`)**:
  - Curated interview problem banks organized by major tech companies (**Google**, **Amazon**, **Microsoft**, **Meta**, **Apple**, etc.).
  - Searchable problem directory with difficulty badges (Easy, Medium, Hard) and direct links to LeetCode problems.

---

## 💼 11. Career Opportunities & Placement Job Board

**Route:** `/jobs` (`frontend/app/jobs/page.jsx`)

A dedicated recruitment and placement portal connecting learners with hiring partners:

- **Partner Job Listings**: Displays verified career opportunities posted by partner organizations and institutions.
- **Multi-Parameter Filtering**:
  - **Work Mode**: Filter by *Remote*, *Hybrid*, or *On-Site*.
  - **Employment Type**: Filter by *Full-Time*, *Part-Time*, or *Internship*.
  - **Search Query**: Real-time filtering across job titles, company names, and required technical skill sets.
- **Detailed Job Modal**: Comprehensive job descriptions, eligibility criteria, compensation bands, and direct external application links.

---

## 📈 12. Student Progress, Metrics & Historical Analytics

**Route:** `/progress` (`frontend/components/ProgressPage.jsx`)

An analytics dashboard offering students transparent visibility into their academic journey:

- **Core Performance Metrics**:
  - **Lessons Completed**: Progress fraction and percentage completed across all enrolled courses.
  - **Quizzes Passed**: Total quizzes passed vs. total quizzes attempted.
  - **Assignments Submitted**: Completed project submissions count.
  - **Enrolled Courses**: Total active cohort enrollments.
- **Course-by-Course Drilldown**:
  - Select any enrolled course to inspect its full chapter syllabus.
  - Visual lesson-by-lesson completion matrix showing completed (green check) vs. pending (empty circle) lessons.
- **Submission History**: Detailed log of past quiz scores, assignment submission timestamps, and grading feedback.

---

## 🛡️ 13. Enterprise Administration & Institution Portal

**Route:** `/admin` (`frontend/app/admin/page.jsx`)

An administrative suite empowering educators and institution managers:

- **Curriculum & Course Outline Editor (`/admin/courses`)**:
  - Visual outline tree editor for building courses, chapters, and lessons.
  - Bulk CSV syllabus importer for rapid course onboarding.
- **Cohort & Batch Management (`/admin/batches`)**:
  - Group students into cohort batches, schedule course release dates, and monitor batch-level performance.
- **Certification Authority (`/admin/certs`)**:
  - Configure course completion criteria and issue verifiable digital certificates of completion.
- **Assessment Management (`/admin/quizzes`, `/admin/assignments`)**:
  - Author quiz questions, configure answer keys, set time limits, and assign passing marks.
- **System Analytics & Platform Statistics (`/admin/statistics`)**:
  - Real-time platform metrics: student enrollment numbers, daily active learners, quiz pass rates, and lesson completion trends.
- **Broadcast Alerts & Cohort Notifications (`/admin/alerts`)**:
  - Publish system-wide and batch-specific announcements, exam reminders, and course updates.
- **Job Board Administrator (`/admin/jobs`)**:
  - Create, publish, update, and close job postings.

---

## 🔒 14. Security, Ingestion Pipeline & Multi-Tenant RAG Engine

### 14.1 Document Ingestion Pipeline
```
[User Browser] --(1. PDF File + JWT)--> [Next.js API Gateway]
                                                |
                                    (Validate Limits & File Size)
                                                |
                              +-----------------+-----------------+
                              |                                   |
            (2. Push File to Private Bucket)       (3. Register Task in Queue)
                              v                                   v
                    [Cloudflare R2 Bucket]               [TiDB Queue Table]
                                                                  |
                                                      (4. Worker Lock Task)
                                                                  v
                                                        [Render Queue Worker]
                                                                  |
                                                      (5. Extract PDF Text)
                                                                  |
                                                      (6. Chunk: 1000ch, 200 overlap)
                                                                  |
                                                      (7. Generate 768-dim Vectors)
                                                                  v
                                                        [Gemini Embeddings API]
                                                                  |
                                                      (8. Bulk Insert into TiDB)
                                                                  v
                                                        [TiDB Vector Table]
                                                                  |
                                                      (9. Publish SSE Event)
                                                                  v
[User Browser] <--(10. SSE Status Push)-- [Next.js SSE Stream] <-- [Upstash Redis Pub/Sub]
```

### 14.2 Multi-Tenant RAG with Row-Level Security (RLS)
- **TiDB Cloud HNSW Vector Index**: Stores 768-dimensional vector embeddings generated by Gemini `text-embedding-004`.
- **Tenant & Course Permission Enforcer**: RAG queries first validate the student's JWT token and course enrollment in Redis before executing vector similarity searches. Students can never access chunks outside their authorized course enrollments.
- **Cloudflare R2 / Backblaze B2 Private Storage**: Educational assets and course PDFs are stored in private buckets and served exclusively through short-lived (5-minute expiration) pre-signed URLs.

---

## 🎨 15. Navigation, Theming & Accessibility Features

- **Global Navigation Bar (`TopNavbar`)**:
  - Multi-level dropdown menus for Courses, Quizzes, Assignments, and Resource Hub.
  - Profile status badge, active user initials avatar, and quick logout.
- **Collapsible Sidebar (`Sidebar`)**:
  - Expandable/collapsible drawer mode with persistent user preference.
  - Integrated chat history session manager for AI Tutor rooms.
- **Dark & Light Mode Theming**:
  - Global CSS token system (`--bg`, `--s1`, `--s2`, `--text`, `--muted`, `--accent`, `--border`).
  - Seamless theme toggle persisted across sessions.
- **Fully Responsive Mobile Experience (`MobileNav`, `useMediaQuery`)**:
  - Custom mobile bottom navigation bar and touch-friendly slideout drawers.
  - Desktop-grade layouts adapted cleanly to tablets and smartphones.

---

## 🗺️ 16. Comprehensive Feature Matrix & Route Directory

| Feature Module | Primary Route | Key Components | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Student Dashboard** | `/` | `Dashboard.jsx`, `VedikaParticleBot.jsx` | Dynamic greeting, streak tracker, interactive particle bot, concept cards, daily quiz, task checklist. |
| **Course Explorer** | `/courses` | `CoursePage.jsx`, `ZimCarousel3D.jsx`, `CourseEmotionsSlider.jsx` | 3D course carousel, emotion-based course filter, Pacman pagination, course syllabus, instant enrollment. |
| **Lesson Viewer** | `/lesson/[id]` | `LessonPage.jsx`, `VideoPlayerWithAI.jsx`, `CompanionTabs.jsx` | Synced YouTube video with AI milestones, timestamp-linked seeking, voice dictation notes, PDF viewer. |
| **Ask Vedika (General)** | `/vedika-ai/ask` | `GeneralTutor.jsx` | 4 pedagogy modes, depth slider, instant quiz/flashcard generator, Mermaid diagrams, multi-turn memory. |
| **Code with Vedika** | `/vedika-ai/code` | `CodingTutor.jsx` | `@analyze`, `@tips`, `@fix`, `@explain`, `@help`, Big-O complexity cards, live Pyodide WASM code runner. |
| **Code Puzzles** | `/vedika-ai/puzzle` | `CodePuzzle.jsx` | Python & Web (HTML/CSS/JS) puzzles, responsive device preview, inline error widgets, test assertions. |
| **Viva & Mock Interview** | `/viva-interview` | `app/viva-interview/page.jsx` | Oral viva voce, speech-to-speech interaction, technical mock interviews, 4.7MB 5-category aptitude tests. |
| **Math Lab** | `/vedika-labs/math` | `MathLab.jsx`, `MathEquationRenderer.jsx` | 2D/3D function plotter, AI handwriting OCR, Pythagoras, Wiper sector, 3D solids, unit circle, derivatives. |
| **Physics Lab** | `/vedika-labs/physics` | `PhysicsLab.jsx`, `PhetSimViewer.jsx` | Pendulum, projectile kinematics, Snell's law TIR, spring-mass, Ohm's law 3D circuit, 8 PhET simulations. |
| **Chemistry Lab** | `/vedika-labs/chemistry`| `ChemistryLab.jsx` | Bohr atom builder, PV=nRT chamber, acid-base titration, gas RMS diffusion, periodic table, 8 PhET sims. |
| **Biology Lab** | `/vedika-labs/biology` | `BiologyLab.jsx` | 3D animal cell raycaster, Lotka-Volterra ecosystem food web, population SVG charts, 5 PhET simulations. |
| **WASM Playground** | Embedded / Labs | `Playground.jsx`, `CodeVisualizer3D.jsx` | Pyodide in Web Worker, `xterm.js` terminal with STDIN, 2D AST flowchart, 3D memory maps, trace stepper. |
| **Voice Agent** | Floating / Modal | `VoiceAgentView.jsx`, `voice-server.js` | WebSockets live audio loop, Gemini Live integration, pulsing robot visualizer, real-time sentiment tuning. |
| **Quizzes & Assignments** | `/quizzes`, `/assignments` | `QuizzesAssignmentsWorkspace.jsx` | Domain quiz evaluations, scorecards, long-form assignments, AI auto-evaluator (`/api/evaluate-assignment`). |
| **Resource Hub** | `/resources` | `ResourcesHub.jsx`, `ResourcesLibrary.jsx` | Digital PDF textbook library, interactive cheat sheets, DSA sheets, company-wise FAANG problem banks. |
| **Career Opportunities** | `/jobs` | `app/jobs/page.jsx` | Partner job listings, remote/hybrid/onsite filters, full-time/internship filters, direct application modal. |
| **Progress & Analytics** | `/progress` | `ProgressPage.jsx` | Lessons completed %, quiz passing rates, assignment submissions, course syllabus matrices, historical logs. |
| **Admin Console** | `/admin` | `app/admin/page.jsx` | Course outline editor, batch management, certificate issuance, quiz/assignment builder, platform analytics. |

---

*Document compiled and maintained for **Vedika 2.0 / Vyomanta LMS Platform**.*
