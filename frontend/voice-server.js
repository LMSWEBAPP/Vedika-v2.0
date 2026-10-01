const http = require('http');
const { WebSocketServer } = require('ws');
const { GoogleGenAI, Modality } = require('@google/genai');
const { Redis } = require('@upstash/redis');
require('dotenv').config();

const PORT = parseInt(process.env.VOICE_PORT || process.env.PORT || '5001', 10);

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4
].filter(Boolean);

let connectionCount = 0;

function getGeminiClient() {
  if (GEMINI_KEYS.length === 0) {
    throw new Error('GEMINI_API_KEY environment variable is required.');
  }
  // Rotate key round-robin based on incoming connection count to distribute concurrent free-tier session load
  const apiKey = GEMINI_KEYS[connectionCount % GEMINI_KEYS.length];
  connectionCount++;
  console.log(`[VoiceWS] Routing connection using Gemini Key index ${(connectionCount - 1) % GEMINI_KEYS.length}`);
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
let redis = null;
if (redisUrl && redisToken) {
  redis = new Redis({ url: redisUrl, token: redisToken });
}

async function loadMemoryContext(sessionId, userId) {
  if (!redis) return '';
  try {
    const [history, memories] = await Promise.all([
      redis.get(`chat:${sessionId}`).then(d => Array.isArray(d) ? d : []).catch(() => []),
      redis.get(`memories:${userId}`).then(d => Array.isArray(d) ? d : []).catch(() => []),
    ]);
    let ctx = '';
    if (history.length > 0) {
      ctx += '\n\nConversation history from this session:\n';
      ctx += history.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
    }
    if (memories.length > 0) {
      ctx += '\n\nRelevant memories about this student (from past sessions):\n';
      ctx += memories.map(f => `- ${f}`).join('\n');
    }
    return ctx;
  } catch { return ''; }
}

function analyzeSentiment(text) {
  const lowercase = text.toLowerCase();
  const confusedWords = ["don't understand","do not understand","dont understand","not sure","confused","cannot get","cant get","difficult","hard","stuck","doubt","explain again","unclear","lost","struggling","help","confusing","అర్థం కాలేదు","కష్టంగా ఉంది","సందేహం","తెలియదు","మళ్ళీ చెప్పండి","కన్ఫ్యూజ్","ardham raledu","artham kaledu","kashtanga undi","malli cheppandi","samajh nahi","mushkil","kathin","shanka","phirse","phir se","pareshani","confuse","sandeha"];
  const positiveWords = ["understand","got it","easy","awesome","perfect","clear","great","wow","fantastic","amazing","makes sense","thank you","thanks","excellent","brilliant","అర్థమైంది","సులభంగా ఉంది","చాలా బాగుంది","థాంక్స్","సూపర్","అవును","ardhamaindi","sulabhanga undi","chala bagundi","samajh gaya","samajh gya","aasan","saral","badhiya","bahut achha","clear hai","dhanyawad","shukriya"];
  const curiousWords = ["what is","how do","tell me about","why is","curious","interested","learn","know","question","ఏమిటి","ఎలా","ఎందుకు","తెలుసుకోవాలి","emiti","ela","enduku","telusukovali","kya hai","kaise","kyun","jaan na"];
  let confusedCount = 0, positiveCount = 0, curiousCount = 0;
  for (const w of confusedWords) { if (lowercase.includes(w)) confusedCount++; }
  for (const w of positiveWords) { if (lowercase.includes(w)) positiveCount++; }
  for (const w of curiousWords) { if (lowercase.includes(w)) curiousCount++; }
  if (confusedCount > positiveCount && confusedCount >= curiousCount)
    return { label: 'Struggling / Confused', score: -0.6, emoji: '\uD83D\uDE1F' };
  if (positiveCount > confusedCount && positiveCount >= curiousCount)
    return { label: 'Happy / Confident', score: 0.8, emoji: '\uD83D\uDE0A' };
  if (curiousCount > confusedCount && curiousCount > positiveCount)
    return { label: 'Curious / Inquisitive', score: 0.4, emoji: '\uD83E\uDD14' };
  return { label: 'Calm / Conversational', score: 0.0, emoji: '\uD83D\uDE10' };
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', geminiConfigured: !!process.env.GEMINI_API_KEY }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Voice Tutor WebSocket Server');
  }
});

const wss = new WebSocketServer({ server, path: '/api/ws' });

const crypto = require('crypto');

async function validateWsAuth(searchParams, cookieHeader) {
  const ticket = searchParams.get('ticket');
  if (ticket && redis) {
    try {
      const raw = await redis.get(`ws_ticket:${ticket}`);
      if (raw) {
        await redis.del(`ws_ticket:${ticket}`);
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return { valid: true, user: parsed.user_id, sessionId: parsed.session_id };
      }
    } catch (e) {
      console.warn('[VoiceWS Auth] Ticket verification failed:', e.message);
    }
  }

  let token = searchParams.get('token');
  if (!token && cookieHeader) {
    const match = cookieHeader.match(/(?:jwt|token)=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY;
      if (secret) {
        const parts = token.replace(/^Bearer\s+/i, '').split('.');
        if (parts.length === 3) {
          const expectedSig = crypto.createHmac('sha256', secret)
            .update(`${parts[0]}.${parts[1]}`, 'utf8')
            .digest('base64url');
          if (parts[2].length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expectedSig))) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
            const now = Math.floor(Date.now() / 1000);
            if (!payload.exp || payload.exp >= now) {
              return { valid: true, user: payload.user_id || payload.email, sessionId: null };
            }
          }
        }
      }
    } catch (e) {
      console.warn('[VoiceWS Auth] Token verification failed:', e.message);
    }
  }

  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');
  if (sessionId) {
    return { valid: true, user: userId || 'student', sessionId };
  }

  return { valid: false };
}

wss.on('connection', async (clientWs, request) => {
  console.log('[VoiceWS] Client connected');
  const searchParams = new URL(request.url || '', 'http://localhost').searchParams;

  const auth = await validateWsAuth(searchParams, request.headers['cookie']);
  if (!auth.valid) {
    console.warn('[VoiceWS] Connection rejected: unauthorized WebSocket client.');
    clientWs.send(JSON.stringify({ type: 'error', message: 'Unauthorized: Valid ticket or JWT session token required.' }));
    clientWs.close(1008, 'Unauthorized');
    return;
  }

  const mode = searchParams.get('mode') || 'tutor';
  const topic = searchParams.get('topic') || '';
  const difficulty = searchParams.get('difficulty') || 'Medium';
  const level = searchParams.get('level') || 'College';
  const programmingLanguage = searchParams.get('programmingLanguage') || 'JavaScript / Python';
  const language = searchParams.get('language') || 'all';
  const subject = searchParams.get('subject') || 'all';

  let systemInstruction = '';

  if (mode === 'interview') {
    systemInstruction =
      'You are an authentic, experienced, and highly engaging Senior Technical Interviewer conducting a live oral engineering discussion. Speak with natural, warm human cadence like an engineering colleague. ' +
      'Target Engineering Track: ' + (topic || 'Full Stack Web Development') + '. ' +
      'Candidate Target Seniority: ' + level + '. ' +
      'Primary Tech Stack / Language: ' + programmingLanguage + '. ' +
      'Interview Difficulty Bar: ' + difficulty.toUpperCase() + '. ' +
      'CRITICAL INTERVIEW RULES: ' +
      '1. Greet the candidate warmly, set a relaxed and professional engineering discussion tone, and immediately ask your first practical technical question. ' +
      '2. Frame questions around real-world production scenarios, architecture trade-offs, edge cases, scalability, concurrency, and clean code principles (e.g., "Let\'s say you\'re building...", "Suppose we hit a bottleneck in...", "Walk me through how you would handle..."). ' +
      '3. Keep your spoken responses concise (strictly 1 to 2 sentences maximum) so that the candidate has the floor to speak. ' +
      '4. Listen closely to the candidate\'s answer. Pick up a specific technical concept, claim, or gap from their answer, and ask an organic, focused follow-up probe (e.g., "You mentioned X... how would that behave under Y condition?"). Keep the interview feeling like an authentic person-to-person inquiry where you drill down into their reasoning. ' +
      '5. NEVER reveal scores, grades, or correct model answers during the live interview. Keep all assessments concealed until the session finishes. ' +
      '6. AVOID robotic AI phrasing or generic textbook definition questions. Sound like a real senior engineer discussing production systems.';
  } else if (mode === 'viva') {
    systemInstruction =
      'You are a warm, encouraging, sharp, and authentic university professor conducting an oral academic viva defense. Speak with natural, engaging human conversational cadence. ' +
      'Academic Subject / Topic: ' + (topic || 'Core Subject Syllabus') + '. ' +
      'Academic Tier: ' + level + ' Level. ' +
      'Examination Rigor Tier: ' + difficulty.toUpperCase() + '. ' +
      'CRITICAL EXAMINER RULES: ' +
      '1. Greet the student warmly, announce the examination topic (' + (topic || 'Academic Syllabus') + '), and ask your first oral viva question. ' +
      '2. Frame questions around real experimental observations, parameter changes, physical thought experiments, governing principles, and practical edge cases (e.g., "Suppose in the lab we suddenly double the...", "Walk me through what happens to the readings if...", "If you had to explain the core intuition to a peer..."). ' +
      '3. Keep your spoken questions and responses concise (strictly 1 to 2 sentences maximum) so the student can explain and defend their understanding. ' +
      '4. Listen carefully to the student\'s explanation. Pick up a specific point, formula, observation, or gap from their answer, and ask an organic follow-up probe that drills deeper into that specific claim. Maintain a supportive, person-to-person conversational cadence. ' +
      '5. NEVER give away answers, scores, or evaluations during the viva defense. Keep all assessments strictly concealed until the examination concludes. ' +
      '6. AVOID dry robotic textbook recitation. Make the dialogue feel like an authentic, lively oral examination.';
  } else {
    systemInstruction =
      'Your name is Vedika. You are a warm, highly humanized, and friendly academic tutor supporting school students. ' +
      'VOICE & HUMANIZATION GUIDELINES: ' +
      'Speak in a smooth, expressive, warm, and natural human tone with a familiar, conversational Indian accent rhythm in English ' +
      '(using natural phrases like "chalo", "got it ya", "super simple", "no problem at all", "don\'t worry!"). ' +
      'Sound like an encouraging elder sibling or personal tutor: warm, relatable, dynamic, and full of natural life. ' +
      'Keep answers strictly short and fluid (usually 1 to 2 short sentences per turn) so text-to-speech voice output sounds immediate, crisp, and human. ' +
      'Never output markdown symbols, asterisks, bullet points, numbers, or complex formulas into text, as they disrupt natural voice synthesis. ';

    if (language === 'telugu') {
      systemInstruction += 'LANGUAGE MODE: You must speak in sweet, conversational Telugu only (unless referring to specific scientific/mathematical English terms). ';
    } else if (language === 'hindi') {
      systemInstruction += 'LANGUAGE MODE: You must speak in simple, warm, conversational Hindi. ';
    } else if (language === 'english') {
      systemInstruction += 'LANGUAGE MODE: Speak in clear, warm, expressive Indian English with friendly colloquial phrasing. ';
    } else {
      systemInstruction +=
        'CODE-SWITCHING & LANGUAGE MATCHING: Dynamically match and mirror the student\'s exact language mix and tone. ' +
        'If the user speaks in Teluglish (e.g., "Artham kaledu brother", "Ela cheyyali cheppu"), respond in natural, sweet Teluglish. ' +
        'If the user speaks in Hinglish (e.g., "Samajh nahi aaya, phir se batao"), respond in natural, friendly Hinglish. ' +
        'If the user speaks in English, respond in natural, warm Indian English. ';
    }

    if (subject === 'math') {
      systemInstruction += ' SUBJECT FOCUS: Currently helping with Mathematics! Explain concepts using simple physical analogies.';
    } else if (subject === 'science') {
      systemInstruction += ' SUBJECT FOCUS: Currently helping with Science! Explain concepts with fun real-world facts.';
    } else if (subject === 'languages') {
      systemInstruction += ' SUBJECT FOCUS: Currently helping with Languages & Reading! Expand vocabulary and grammar.';
    } else {
      systemInstruction += ' Ready to tutor across all academic subjects with simple, delightful real-world analogies.';
    }
  }

  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');
  const memoryCtx = await loadMemoryContext(sessionId, userId);
  if (memoryCtx) systemInstruction += memoryCtx;

  let geminiSession = null;
  try {
    clientWs.send(JSON.stringify({ type: 'status', message: 'Establishing low-latency connection to Gemini...' }));
    const ai = getGeminiClient();
    geminiSession = await ai.live.connect({
      model: process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview',
      callbacks: {
        onmessage: (message) => {
          const content = message.serverContent;
          if (!content) return;
          for (const part of content.modelTurn?.parts || []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ type: 'audio', data: part.inlineData.data }));
            }
          }
          if (content.outputTranscription?.text) {
            clientWs.send(JSON.stringify({ type: 'agent-transcription', text: content.outputTranscription.text }));
          }
          if (content.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
          if (content.inputTranscription?.text?.trim()) {
            const sentiment = analyzeSentiment(content.inputTranscription.text);
            clientWs.send(JSON.stringify({ type: 'user-transcription', text: content.inputTranscription.text, sentiment }));
          }
        },
        onclose: () => {
          clientWs.send(JSON.stringify({ type: 'status', message: 'Tutor connection closed.' }));
        },
        onerror: (error) => {
          console.error('[VoiceWS] Session error:', error);
          clientWs.send(JSON.stringify({ type: 'error', message: 'Session error occurred.' }));
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        systemInstruction,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
    });

    clientWs.send(JSON.stringify({ type: 'status', message: 'Tutor is ready! Ask your academic questions.' }));
  } catch (err) {
    console.error('[VoiceWS] Failed:', err.message);
    clientWs.send(JSON.stringify({ type: 'error', message: `Setup failed: ${err.message}` }));
    clientWs.close();
    return;
  }

  clientWs.on('message', (buffer) => {
    try {
      const msg = JSON.parse(buffer.toString());
      if (msg.type === 'audio' && msg.data && geminiSession) {
        geminiSession.sendRealtimeInput({ audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' } });
      }
    } catch (e) { console.error('[VoiceWS] Audio error:', e); }
  });

  clientWs.on('close', () => {
    if (geminiSession) { try { geminiSession.close(); } catch {} }
  });
});

server.listen(PORT, () => {
  console.log(`[VoiceWS] WebSocket server running on ws://localhost:${PORT}/api/ws`);
});
