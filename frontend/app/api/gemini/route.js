import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cacheGet, cacheSet, makeCacheKey } from '@/lib/cache';
import { loadHistory, saveHistory, recall, buildMemoryContext, trackApiConsumption } from '@/lib/memory';

const MAX_USER_INPUT_CHARS = 12000;
const MAX_SYSTEM_CHARS = 12000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// Vertex AI key rotation (same as Voice Server)
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
  const apiKey = GEMINI_KEYS[connectionCount % GEMINI_KEYS.length];
  connectionCount++;
  console.log(`[Gemini Vertex] Using key index ${(connectionCount - 1) % GEMINI_KEYS.length}`);
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

// Vertex AI model names for GenerateContent (use latest available in project)
const TEXT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash',
  'gemini-2.0-flash',
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { system, user, image, maxOutputTokens, sessionId, userId } = body || {};

    if (!user || typeof user !== 'string' || !user.trim()) {
      return NextResponse.json({ error: 'User message is required.' }, { status: 400 });
    }

    if (user.length > MAX_USER_INPUT_CHARS) {
      return NextResponse.json(
        { error: `User message exceeds the maximum allowed limit of ${MAX_USER_INPUT_CHARS} characters.` },
        { status: 400 }
      );
    }

    const clampedTokens = Math.min(Math.max(parseInt(maxOutputTokens, 10) || 4096, 50), 8192);
    const sanitizedSystem = typeof system === 'string' ? system.slice(0, MAX_SYSTEM_CHARS) : '';

    let memoryCtx = '';
    try {
      if (sessionId || userId) {
        const [history, memories] = await Promise.all([
          loadHistory(sessionId),
          recall(userId),
        ]);
        memoryCtx = buildMemoryContext(history, memories);
      }
    } catch (memErr) {
      console.warn('[Gemini] Memory context notice:', memErr.message);
    }

    const fullSystem = sanitizedSystem ? sanitizedSystem + memoryCtx : memoryCtx;

    const cacheKey = makeCacheKey('generate', fullSystem, user + (image ? image.slice(0, 100) : ''), clampedTokens);
    const cached = cacheGet(cacheKey);
    if (cached) return NextResponse.json({ text: cached });

    // Prepare content parts
    const parts = [];
    if (image && typeof image === 'string') {
      if (image.length > MAX_IMAGE_BYTES * 1.37) {
        return NextResponse.json({ error: 'Image exceeds maximum allowed size of 5MB.' }, { status: 400 });
      }
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }
    parts.push({ text: user });

    // Try each model with key rotation
    let textResult = null;
    let lastError = null;

    for (let attempt = 0; attempt < Math.min(3, GEMINI_KEYS.length); attempt++) {
      const ai = getGeminiClient();
      
      for (const modelName of TEXT_MODELS) {
        try {
          console.log(`[Gemini Vertex] Trying ${modelName} with key index ${attempt}`);
          
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction: fullSystem || undefined,
              temperature: 0.4,
              maxOutputTokens: clampedTokens,
            },
          });

          textResult = response.text;
          
          if (textResult) {
            console.log(`[Gemini Vertex] Success with ${modelName}`);
            break;
          }
        } catch (modelErr) {
          lastError = modelErr.message;
          console.warn(`[Gemini Vertex] ${modelName} failed:`, modelErr.message);
          
          // If model not found, try next model
          if (modelErr.message?.includes('not found') || modelErr.message?.includes('404')) {
            continue;
          }
          // If quota/rate limit, try next key
          if (modelErr.message?.includes('429') || modelErr.message?.includes('quota') || modelErr.message?.includes('rate limit')) {
            break;
          }
          continue;
        }
      }
      
      if (textResult) break;
    }

    if (textResult) {
      cacheSet(cacheKey, textResult);

      if (sessionId && textResult) {
        try {
          const history = await loadHistory(sessionId);
          const updated = [
            ...(history || []),
            { role: 'user', content: user },
            { role: 'assistant', content: textResult },
          ];
          saveHistory(sessionId, updated);
          trackApiConsumption(userId, user, textResult);
        } catch (e) {
          console.warn('[Gemini] History save notice:', e.message);
        }
      }

      return NextResponse.json({ text: textResult });
    }

    console.error('[Gemini Route Error]:', lastError || 'All models and keys exhausted');
    return NextResponse.json(
      { error: 'AI generation service is temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('[Gemini Route Error]:', error.message);
    return NextResponse.json({ error: 'Failed to generate AI response.' }, { status: 500 });
  }
}