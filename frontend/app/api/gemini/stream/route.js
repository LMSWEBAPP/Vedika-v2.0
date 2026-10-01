import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { cacheGet, cacheSet, makeCacheKey } from '@/lib/cache';
import { getRotatedKey } from '@/lib/keys';
import { loadHistory, saveHistory, recall, buildMemoryContext, trackApiConsumption } from '@/lib/memory';

const MAX_USER_INPUT_CHARS = 12000;
const MAX_SYSTEM_CHARS = 12000;

export async function POST(request) {
  try {
    const body = await request.json();
    const { system, user, maxOutputTokens, sessionId, userId } = body || {};
    const apiKey = getRotatedKey();

    if (!apiKey) {
      return NextResponse.json({ error: 'AI processing service is not currently configured.' }, { status: 503 });
    }
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

    // Load memory context safely
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
      console.warn('[GeminiStream] Memory retrieval notice:', memErr.message);
    }

    const fullSystem = sanitizedSystem ? sanitizedSystem + memoryCtx : memoryCtx;

    const cacheKey = makeCacheKey('stream', fullSystem, user, clampedTokens);
    const cached = cacheGet(cacheKey);
    if (cached) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(cached));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
      });
    }

    const provider = createGoogleGenerativeAI({ apiKey });
    const model = provider.languageModel('gemini-2.5-flash');

    let history = [];
    if (sessionId) {
      try {
        history = (await loadHistory(sessionId)) || [];
      } catch (_) {}
    }

    const fullMessages = [
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: user },
    ];

    const result = streamText({
      model,
      system: fullSystem,
      messages: fullMessages,
      temperature: 0.4,
      maxTokens: clampedTokens,
      onFinish({ text }) {
        if (text) {
          cacheSet(cacheKey, text);
          trackApiConsumption(userId, user, text);
        }
        if (sessionId && text) {
          const updated = [
            ...history,
            { role: 'user', content: user },
            { role: 'assistant', content: text },
          ];
          saveHistory(sessionId, updated).catch(e => console.warn('[GeminiStream] History save notice:', e.message));
        }
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (e) {
          console.error('[GeminiStream] Stream error:', e.message);
          controller.enqueue(encoder.encode(`\n[AI generation interrupted]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('[Gemini Stream Error]:', error.message);
    return NextResponse.json({ error: 'Failed to process AI stream request.' }, { status: 500 });
  }
}
