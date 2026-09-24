import { NextResponse } from 'next/server';
import { cacheGet, cacheSet, makeCacheKey } from '@/lib/cache';
import { callGemini } from '@/lib/gemini';
import { loadHistory, saveHistory, recall, buildMemoryContext, trackApiConsumption } from '@/lib/memory';

const MAX_USER_INPUT_CHARS = 12000;
const MAX_SYSTEM_CHARS = 12000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

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

    const userParts = [];
    if (image && typeof image === 'string') {
      if (image.length > MAX_IMAGE_BYTES * 1.37) { // Base64 encoding overhead
        return NextResponse.json({ error: 'Image exceeds maximum allowed size of 5MB.' }, { status: 400 });
      }
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      userParts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }
    userParts.push({ text: user });

    const { text: textResult } = await callGemini({
      contents: [{ role: 'user', parts: userParts }],
      systemInstruction: fullSystem,
      generationConfig: { temperature: 0.4, maxOutputTokens: clampedTokens }
    });

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

    return NextResponse.json(
      { error: 'AI generation service is temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  } catch (error) {
    console.error('[Gemini Route Error]:', error.message);
    return NextResponse.json({ error: 'Failed to generate AI response.' }, { status: 500 });
  }
}
