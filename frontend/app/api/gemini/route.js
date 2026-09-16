import { NextResponse } from 'next/server';
import { cacheGet, cacheSet, makeCacheKey } from '@/lib/cache';
import { callGemini } from '@/lib/gemini';
import { loadHistory, saveHistory, recall, buildMemoryContext, trackApiConsumption } from '@/lib/memory';

export async function POST(request) {
  try {
    const { system, user, image, maxOutputTokens, sessionId, userId } = await request.json();
    if (!user) {
      return NextResponse.json({ error: 'User message is required.' });
    }

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
      console.warn('[Gemini] Memory context notice:', memErr);
    }

    const fullSystem = system ? system + memoryCtx : memoryCtx;

    const cacheKey = makeCacheKey('generate', fullSystem, user + (image ? image.slice(0, 100) : ''), maxOutputTokens);
    const cached = cacheGet(cacheKey);
    if (cached) return NextResponse.json({ text: cached });

    const userParts = [];
    if (image) {
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
      generationConfig: { temperature: 0.4, maxOutputTokens: maxOutputTokens || 8192 }
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
          console.warn('[Gemini] History save notice:', e);
        }
      }

      return NextResponse.json({ text: textResult });
    }

    return NextResponse.json({ error: lastError || 'All Gemini API keys in .env were tried but unavailable.' });
  } catch (error) {
    console.error('[Gemini Route Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' });
  }
}
