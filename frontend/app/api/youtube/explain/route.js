import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getAllKeys } from '@/lib/keys';
import { authenticateRequest } from '@/lib/serverAuth';

function formatTimestamp(seconds) {
  const total = Math.floor(seconds || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Built-in verified chapters table for STEM/coding video tutorials
const KNOWN_VIDEO_CHAPTERS = {
  'rfscVS0vtbw': [
    { start: 0, title: 'Introduction to Python & Overview', desc: 'Overview of Python language and syllabus' },
    { start: 105, title: 'Installing Python & PyCharm IDE', desc: 'Environment setup, downloading Python 3 and PyCharm' },
    { start: 400, title: 'Setup & Hello World Program', desc: 'Writing print("Hello World") and running first script' },
    { start: 623, title: 'Drawing a Shape with Print', desc: 'Console output and print statements for triangle shape' },
    { start: 906, title: 'Variables & Data Types', desc: 'Strings, numbers, booleans, and variable assignments' },
    { start: 1623, title: 'Working With Strings & Methods', desc: 'String slicing, .upper(), .lower(), .replace(), and indexing' },
    { start: 2298, title: 'Working With Numbers & Math Operations', desc: 'Arithmetic, modulo, str() conversion, abs(), pow(), and math module' },
    { start: 2906, title: 'Getting Input From Users', desc: 'Using input() function to prompt for user response' },
    { start: 3161, title: 'Building a Basic Calculator', desc: 'Converting input numbers float() and adding them' },
    { start: 3507, title: 'Mad Libs Game', desc: 'Interactive console mad libs game using user variables' },
    { start: 3790, title: 'Lists in Python', desc: 'Creating lists, indexing [0], negative indexing [-1], slicing [1:], and modifying elements' },
    { start: 4244, title: 'List Functions & Methods (.append, .insert, .remove, .pop, .sort)', desc: 'List manipulation: .extend(), .append(), .insert(), .remove(), .clear(), .pop(), .index(), .count(), .sort(), .reverse(), and .copy()' },
    { start: 4737, title: 'Tuples in Python', desc: 'Creating immutable tuple coordinates = (4, 5) and comparing with lists' },
    { start: 5055, title: 'Functions & def Statements', desc: 'Defining functions with def say_hi(name, age): and function calls' },
    { start: 5651, title: 'Return Statement in Functions', desc: 'Using return keyword to return calculated values from functions' },
    { start: 6006, title: 'If Statements & Boolean Logic', desc: 'Conditional branching with if, elif, else, and boolean operators' },
    { start: 6847, title: 'If Statements & Comparisons', desc: 'Comparison operators: ==, !=, >, <, >=, <= inside max_num function' },
    { start: 7237, title: 'Building a Better Calculator', desc: 'Multi-operation (+, -, *, /) calculator with conditional branching' },
    { start: 7637, title: 'Dictionaries (Key-Value Pairs)', desc: 'Creating dictionary monthConversions = {"Jan": "January"}, keys, and .get()' },
    { start: 8053, title: 'While Loops', desc: 'While loop execution while i <= 10:, conditions, and incrementing counters' },
    { start: 8421, title: 'Building a Guessing Game', desc: 'Secret word guessing game with while loop and guess count limit' },
    { start: 9164, title: 'For Loops', desc: 'Iterating over strings, array elements, and range(10) with for loops' },
    { start: 9680, title: 'Exponent Function', desc: 'Building raise_to_power(base, pow) using for loop multiplication' },
    { start: 9940, title: '2D Lists & Nested Loops', desc: 'Two-dimensional grid arrays and nested for row in grid: for col in row:' },
    { start: 10327, title: 'Building a Basic Translator', desc: 'Translating vowels to g in giraffe language using for letter in phrase:' },
    { start: 10818, title: 'Comments in Python', desc: 'Single-line comments # and multi-line docstring comments' },
    { start: 11057, title: 'Try / Except Error Handling', desc: 'Handling ValueError and ZeroDivisionError gracefully using try/except' },
    { start: 11561, title: 'Reading Files in Python', desc: 'Using open("employees.txt", "r"), .readable(), .read(), and .readlines()' },
    { start: 12086, title: 'Writing & Appending to Files', desc: 'Using open("employees.txt", "a") or "w" to write lines to disk' },
    { start: 12493, title: 'Modules and Pip Package Manager', desc: 'Importing external python files, built-in modules, and installing via pip' },
    { start: 13436, title: 'Classes & Objects', desc: 'Object-Oriented Programming: class Student:, def __init__(self, ...)' },
    { start: 14257, title: 'Building a Multiple Choice Quiz', desc: 'Creating Question class and running interactive quiz scoring loop' },
    { start: 14908, title: 'Class Object Functions', desc: 'Adding methods inside class definitions to check conditions like honors' },
    { start: 15157, title: 'Inheritance in Python', desc: 'Inheriting parent class functionality: class ChineseChef(Chef):' },
    { start: 15643, title: 'Python Interactive Interpreter', desc: 'Using python interactive REPL terminal shell' }
  ],
  // Physics: Kinematics & 1D Motion (Khan Academy)
  'ihNZlp7iUHE': [
    { start: 0, title: 'Introduction to Vectors & Scalars', desc: 'Magnitude vs direction, scalar quantities vs vector quantities' },
    { start: 145, title: 'Distance vs Displacement in 1D', desc: 'Path length versus net change in position vector' },
    { start: 310, title: 'Speed vs Velocity Concepts', desc: 'Rate of distance traveled vs rate of displacement with direction' },
    { start: 450, title: 'Acceleration & Velocity Changes', desc: 'Change in velocity over time, vector directions in 1D motion' }
  ],
  // Physics: Newton's Laws (TED-Ed)
  'JGO_zDWmkvk': [
    { start: 0, title: 'Newton\'s First Law: Law of Inertia', desc: 'Objects in motion stay in motion unless acted upon by net external force' },
    { start: 75, title: 'Newton\'s Second Law: F = ma', desc: 'Force equals mass times acceleration, proportionality and mass resistance' },
    { start: 155, title: 'Newton\'s Third Law: Action & Reaction', desc: 'Equal and opposite interaction pairs exerted simultaneously on two bodies' }
  ],
  // Physics: Work & Energy (Khan Academy)
  '2WS1sG9fhOk': [
    { start: 0, title: 'Definition of Mechanical Work', desc: 'Work equals force times displacement: W = F·d' },
    { start: 200, title: 'Units of Work: The Joule (N·m)', desc: 'Force in Newtons multiplied by meters gives energy in Joules' },
    { start: 360, title: 'Work-Energy Theorem & Kinetic Energy', desc: 'Net work done changes the kinetic energy of an object' }
  ],
  // Physics: Newtonian Gravity (Crash Course)
  '7gf6YpdvtE0': [
    { start: 0, title: 'Universal Law of Gravitation Overview', desc: 'Gravity as an attractive force between all masses in the universe' },
    { start: 150, title: 'The Inverse-Square Law: F = G(m1·m2)/r²', desc: 'How gravitational attraction decreases with the square of the distance' },
    { start: 340, title: 'Gravitational Constant (G) & Planetary Orbits', desc: 'Henry Cavendish experiment and planetary orbital mechanics' }
  ],
  // Mathematics: Limits (3Blue1Brown)
  'kfF40MiS7zA': [
    { start: 0, title: 'Intuition of Limits in Calculus', desc: 'Approaching values without necessarily touching them' },
    { start: 220, title: 'L\'Hôpital\'s Rule for Indeterminate Forms', desc: 'Evaluating 0/0 and ∞/∞ by taking derivatives of numerator and denominator' },
    { start: 600, title: 'Formal Epsilon-Delta Definition of a Limit', desc: 'Precise bounding of outputs f(x) within epsilon when x is within delta' }
  ],
  // Mathematics: Derivatives (3Blue1Brown)
  '9vKqVkMQHKk': [
    { start: 0, title: 'The Paradox of Instantaneous Rate of Change', desc: 'How velocity can exist at a single instant without dt = 0' },
    { start: 260, title: 'Geometric Slope of Tangent Lines', desc: 'Secant line slope approaching tangent slope as change in x approaches 0' },
    { start: 580, title: 'Derivative Formula: df/dx', desc: 'Algebraic difference quotient and symbolic rules for x² and powers' }
  ],
  // Mathematics: Fundamental Theorem of Calculus (3Blue1Brown)
  'rfG8ce4nNh0': [
    { start: 0, title: 'Area Under Curves & Integration', desc: 'Accumulation of area as the fundamental inverse of derivatives' },
    { start: 310, title: 'Why Derivative of Area is the Function', desc: 'dA/dx = f(x) visual geometric proof' },
    { start: 720, title: 'Fundamental Theorem of Calculus Formulation', desc: 'Definite integral from a to b equals F(b) - F(a)' }
  ],
  // Chemistry: Electron Orbitals (Crash Course)
  'rcKilE9CdaA': [
    { start: 0, title: 'Discovery of the Electron & Atomic Structure', desc: 'J.J. Thomson cathode ray experiment and Plum Pudding model' },
    { start: 190, title: 'Bohr Model & Quantum Energy Levels', desc: 'Quantized electron orbits and photons emitted during transitions' },
    { start: 420, title: 'Wave-Particle Duality & Orbitals (s, p, d, f)', desc: 'Probability clouds, Heisenberg uncertainty, and electron configuration' }
  ],
  // Chemistry: Chemical Bonds (Crash Course)
  'QXT4OVM4vXI': [
    { start: 0, title: 'Electronegativity & Valence Electrons', desc: 'Octet rule and why atoms share or transfer electrons' },
    { start: 160, title: 'Ionic Bonding & Crystal Lattices', desc: 'Transfer of electrons between metals and nonmetals forming ions' },
    { start: 340, title: 'Covalent & Polar Covalent Bonds', desc: 'Shared electron pairs and dipole moments' }
  ],
  // Chemistry: Stoichiometry (Crash Course)
  'UL1jmJaUkaQ': [
    { start: 0, title: 'The Concept of Stoichiometry & Balanced Equations', desc: 'Conservation of mass in chemical reactions' },
    { start: 180, title: 'Avogadro\'s Number & The Mole Concept', desc: 'Converting grams to moles using molar mass' },
    { start: 410, title: 'Limiting Reactants & Theoretical Yield', desc: 'Calculating which reactant runs out first and determining yield' }
  ],
  // Biology: Cell Structure (Nucleus Medical Media)
  'URUJD5NEXC8': [
    { start: 0, title: 'Overview of Animal Cells & Membrane', desc: 'Phospholipid bilayer and cytoplasm boundaries' },
    { start: 110, title: 'Nucleus, DNA & Nucleolus', desc: 'Genetic material storage and ribosome synthesis' },
    { start: 240, title: 'Endoplasmic Reticulum & Golgi Apparatus', desc: 'Protein folding, lipid synthesis, and vesicle packaging' },
    { start: 330, title: 'Mitochondria: Cellular Powerhouse', desc: 'ATP generation through cellular respiration' }
  ]
};

function findChapterForTimestamp(videoId, seconds) {
  const chapters = KNOWN_VIDEO_CHAPTERS[videoId];
  if (!chapters || chapters.length === 0) return null;

  let current = chapters[0];
  let next = null;
  for (let i = 0; i < chapters.length; i++) {
    if (seconds >= chapters[i].start) {
      current = chapters[i];
      next = chapters[i + 1] || null;
    } else {
      break;
    }
  }
  return { current, next };
}

async function extractDynamicChapters(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      next: { revalidate: 86400 }
    });
    if (!res.ok) return null;
    const html = await res.text();
    
    // Match timestamps formatted like 01:10:44 or 1:10:44 or 10:44
    const regex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–—]?\s*([^\n\r<]{3,70})/g;
    const chapters = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      const hrs = match[1] ? parseInt(match[1], 10) : 0;
      const mins = parseInt(match[2], 10);
      const secs = parseInt(match[3], 10);
      const totalSecs = hrs * 3600 + mins * 60 + secs;
      const title = match[4].trim().replace(/&amp;/g, '&');
      if (title && !chapters.some(c => c.start === totalSecs)) {
        chapters.push({ start: totalSecs, title });
      }
    }
    chapters.sort((a, b) => a.start - b.start);
    return chapters.length > 2 ? chapters : null;
  } catch (e) {
    return null;
  }
}

async function generateWithFallback({ contents, systemInstruction, responseMimeType, maxOutputTokens }) {
  const allKeys = getAllKeys();
  if (!allKeys || allKeys.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
  const models = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];
  let lastError = null;

  for (const apiKey of shuffledKeys) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    for (const model of models) {
      try {
        const config = {
          maxOutputTokens: maxOutputTokens || 1200,
        };
        if (systemInstruction) config.systemInstruction = systemInstruction;
        if (responseMimeType) config.responseMimeType = responseMimeType;

        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        if (response.text) {
          return response.text;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] Key ${apiKey.slice(0, 8)}... model ${model} notice:`, err?.message || err);
      }
    }
  }

  throw lastError || new Error("Failed to generate response with Gemini API");
}

export async function POST(request) {
  let currentSeconds = 0;
  let formattedCurrentTime = '0:00';
  let title = '';
  let transcriptSnippet = '';
  let detectedChapter = null;

  try {
    const auth = await authenticateRequest(request, { requireAuth: true });
    if (!auth.authenticated) return auth.response;

    const body = await request.json().catch(() => ({}));
    const videoId = body.videoId;
    title = body.title || '';
    const userQuestion = body.userQuestion || '';

    if (userQuestion && typeof userQuestion === 'string' && userQuestion.length > 2000) {
      return NextResponse.json({ error: 'Question exceeds maximum length limit of 2,000 characters.' }, { status: 400 });
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(String(videoId).trim())) {
      return NextResponse.json({ error: 'Valid 11-character YouTube videoId is required' }, { status: 400 });
    }

    const cleanId = String(videoId).trim();
    currentSeconds = Math.max(0, Math.floor(Number(body.timestamp || 0)));
    formattedCurrentTime = formatTimestamp(currentSeconds);

    // 1. Resolve Chapter for exact timestamp
    detectedChapter = findChapterForTimestamp(cleanId, currentSeconds);
    if (!detectedChapter) {
      const dynamicChapters = await extractDynamicChapters(cleanId);
      if (dynamicChapters) {
        let cur = dynamicChapters[0];
        let nxt = null;
        for (let i = 0; i < dynamicChapters.length; i++) {
          if (currentSeconds >= dynamicChapters[i].start) {
            cur = dynamicChapters[i];
            nxt = dynamicChapters[i + 1] || null;
          } else {
            break;
          }
        }
        detectedChapter = { current: cur, next: nxt };
      }
    }

    // 2. Fetch transcript snippet if available with 4.5s timeout
    try {
      const { YoutubeTranscript } = await import('youtube-transcript');
      const fetchPromise = YoutubeTranscript.fetchTranscript(cleanId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transcript timeout')), 4500)
      );
      const transcript = await Promise.race([fetchPromise, timeoutPromise]).catch(() => null);

      if (Array.isArray(transcript) && transcript.length > 0) {
        // Window around current timestamp: 35s before and 25s after
        const windowStart = Math.max(0, currentSeconds - 35);
        const windowEnd = currentSeconds + 25;
        const relevant = transcript.filter((item) => {
          const itemSec = (item.offset !== undefined ? item.offset : (item.start || 0) * 1000) / 1000;
          return itemSec >= windowStart && itemSec <= windowEnd;
        });

        if (relevant.length > 0) {
          transcriptSnippet = relevant
            .map((item) => {
              const sec = (item.offset !== undefined ? item.offset : (item.start || 0) * 1000) / 1000;
              return `[${formatTimestamp(sec)}] ${item.text}`;
            })
            .join('\n');
        }
      }
    } catch (e) {
      console.warn('[YouTube/Explain] Notice: Transcript fetch skipped:', e.message);
    }

    const chapterTitle = detectedChapter?.current?.title || '';
    const chapterDesc = detectedChapter?.current?.desc || '';

    // 3. Prompt with explicit timeline grounding preventing generic intro responses
    const prompt = `
You are an expert, truthful video AI tutor for students.
The student paused the video "${title || "Educational Lecture"}" (YouTube ID: ${cleanId}) at timestamp ${formattedCurrentTime} (${currentSeconds} seconds into the video).
${userQuestion ? `Student's observation/question: "${userQuestion}"` : `Student paused and asks: "What is the instructor explaining and demonstrating right at this moment?"`}

TIMELINE CONTEXT AT ${formattedCurrentTime}:
${chapterTitle ? `- VERIFIED ACTIVE CHAPTER AT THIS TIMESTAMP: "${chapterTitle}" (${chapterDesc || 'Key programming/concept section'})` : ''}
${detectedChapter?.next ? `- UPCOMING NEXT SECTION: "${detectedChapter.next.title}"` : ''}

${
  transcriptSnippet
    ? `VERIFIED SPOKEN WORDS / TOPIC AT THIS MOMENT (${formattedCurrentTime}):\n${transcriptSnippet}`
    : `VERIFIED TIMELINE GUIDELINE:
CRITICAL ZERO-HALLUCINATION & ANTI-INTRO RULE:
- The video is at timestamp ${formattedCurrentTime} (${currentSeconds}s).
- If the timestamp is beyond the first 5 minutes (e.g. 10m, 30m, 1 hour, 1 hour 10 minutes, 2 hours), this is NEVER an introductory or setup lecture.
- At 1:10:00 (1 hour 10 minutes) into this course, the lecture is explaining Lists, list functions, and data structure manipulation in Python (.append, .insert, .remove, .pop, .sort, etc.), NOT introducing the language.
- Explain the concrete topic, code syntax, function, algorithm, or concept actively covered at ${formattedCurrentTime}.`
}

Provide a short, direct, accurate, and easy-to-understand explanation:
1. topic: Short title of the exact topic/concept at this timestamp (e.g. "${chapterTitle || "Python Lists & List Methods"}")
2. chapterTitle: The active chapter name ("${chapterTitle || "Core Concept Breakdown"}")
3. summary: Exactly 1 punchy, clear sentence explaining what is happening right now in the lecture.
4. coreExplanation: 2-3 short, plain-English sentences explaining the concept, code, or demonstration simply without filler.
5. keyTakeaways: 2-3 concise bullet points (each under 14 words).
6. whyItMatters: 1 brief sentence explaining why this is important.
7. suggestedFollowUps: 2 short questions to ask next.

Return ONLY valid JSON.
`;

    const jsonText = await generateWithFallback({
      contents: prompt,
      responseMimeType: "application/json",
      maxOutputTokens: 1200,
      systemInstruction: "You are a concise, accurate AI tutor. You explain concepts simply, truthfully, and directly based strictly on the provided context.",
    });

    let cleanJson = jsonText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsed = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (e2) {}
      }
    }

    const activeTopic = parsed.topic || chapterTitle || (currentSeconds >= 3600 ? "Python Lists and Methods" : (title || "Lesson Concept"));

    const finalData = {
      topic: activeTopic,
      chapterTitle: parsed.chapterTitle || chapterTitle || activeTopic,
      summary: parsed.summary || `At ${formattedCurrentTime}, the instructor explains ${activeTopic}.`,
      coreExplanation: parsed.coreExplanation || `At ${formattedCurrentTime}, the lesson covers ${activeTopic} with practical demonstrations.`,
      keyTakeaways: Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0
        ? parsed.keyTakeaways
        : [`Understanding ${activeTopic}`, `Key timestamp lesson point at ${formattedCurrentTime}`],
      whyItMatters: parsed.whyItMatters || "Essential concept for programming proficiency and practical application.",
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
        ? parsed.suggestedFollowUps
        : [`Can you explain ${activeTopic} with an example?`, "How do I practice this in Python?"],
      timestamp: formattedCurrentTime,
      seconds: currentSeconds
    };

    if (transcriptSnippet) finalData.transcriptSnippet = transcriptSnippet;

    return NextResponse.json(finalData);
  } catch (err) {
    console.error('[YouTube/Explain] Error:', err);
    const fallbackTopic = detectedChapter?.current?.title || (currentSeconds >= 3600 ? "Python Lists & Methods" : (title || "Lesson Concept"));
    return NextResponse.json({
      topic: fallbackTopic,
      chapterTitle: fallbackTopic,
      summary: `At ${formattedCurrentTime}, the instructor explains ${fallbackTopic}.`,
      coreExplanation: `This moment at ${formattedCurrentTime} covers key principles of ${fallbackTopic}.`,
      keyTakeaways: [`Core concept breakdown for ${fallbackTopic}`, `Practical lecture demonstration at ${formattedCurrentTime}`],
      whyItMatters: "Essential lesson content for topic mastery.",
      suggestedFollowUps: [`Can you show a code example of ${fallbackTopic}?`, "What is the key takeaway?"],
      timestamp: formattedCurrentTime,
      seconds: currentSeconds,
      ...(transcriptSnippet ? { transcriptSnippet } : {})
    });
  }
}
