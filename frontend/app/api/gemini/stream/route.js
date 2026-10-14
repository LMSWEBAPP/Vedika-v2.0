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

    const STREAM_MODELS = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
    ];

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

    const provider = createGoogleGenerativeAI({ apiKey });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let streamedChars = 0;
        let generatedFullText = '';

        for (const modelName of STREAM_MODELS) {
          try {
            const model = provider.languageModel(modelName);
            const result = streamText({
              model,
              system: fullSystem,
              messages: fullMessages,
              temperature: 0.4,
              maxTokens: clampedTokens,
            });

            for await (const chunk of result.textStream) {
              if (chunk) {
                streamedChars += chunk.length;
                generatedFullText += chunk;
                controller.enqueue(encoder.encode(chunk));
              }
            }

            if (streamedChars > 0) {
              if (generatedFullText) {
                cacheSet(cacheKey, generatedFullText);
                trackApiConsumption(userId, user, generatedFullText);
                if (sessionId) {
                  const updated = [
                    ...history,
                    { role: 'user', content: user },
                    { role: 'assistant', content: generatedFullText },
                  ];
                  saveHistory(sessionId, updated).catch(e => console.warn('[GeminiStream] History save notice:', e.message));
                }
              }
              break;
            }
          } catch (modelErr) {
            console.warn(`[GeminiStream] Model ${modelName} notice:`, modelErr.message?.slice(0, 100));
            if (streamedChars > 0) {
              break; // already partially delivered to client
            }
          }
        }

        if (streamedChars === 0) {
          controller.enqueue(encoder.encode('I am currently processing your request. Please try asking again.'));
        }
        controller.close();
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
