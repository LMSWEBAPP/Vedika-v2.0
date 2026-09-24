import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import { getRotatedKey } from '@/lib/keys';
import pool from '@/lib/db';
import { loadHistory, saveHistory, recall, buildMemoryContext, trackApiConsumption } from '@/lib/memory';

async function fetchEmbeddings(text, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] },
        outputDimensionality: 768
      })
    }
  );
  if (!response.ok) {
    throw new Error(`Embedding API failed: ${response.statusText}`);
  }
  const data = await response.json();
  return data.embedding?.values;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const payload = verifyJwt(authHeader);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized JWT token.' }, { status: 401 });
    }

    const { system, user, maxOutputTokens, sessionId, userId: requestedUserId, courseId: bodyCourseId } = await request.json();
    if (!user || typeof user !== 'string' || !user.trim() || !sessionId) {
      return NextResponse.json({ error: 'User message and sessionId are required.' }, { status: 400 });
    }

    if (user.length > 12000) {
      return NextResponse.json({ error: 'Message exceeds maximum length of 12,000 characters.' }, { status: 400 });
    }

    // Bind identity to verified JWT to prevent cross-user access
    const authenticatedUserId = payload.user_id || payload.email;
    const isAdmin = isAdminUser(payload);
    if (requestedUserId && requestedUserId !== authenticatedUserId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Cannot invoke tutor on behalf of another student.' }, { status: 403 });
    }
    const userId = (isAdmin && requestedUserId) ? requestedUserId : authenticatedUserId;

    let courseId = bodyCourseId;
    if (!courseId || courseId === 'general' || courseId === 'null') {
      const [enrollments] = await pool.query(
        'SELECT course FROM test.`tabLMS Enrollment` WHERE member = ? LIMIT 1',
        [userId]
      );
      if (enrollments.length > 0) {
        courseId = enrollments[0].course;
      } else {
        courseId = 'a-guide-to-frappe-learning';
      }
    }

    const apiKey = getRotatedKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    let ragContext = '';

    try {
      // 1. Generate Query Embedding
      console.warn(`[TutorChat] Generating embedding for query: "${user.slice(0, 30)}..."`);
      const embedding = await fetchEmbeddings(user, apiKey);
      
      if (embedding) {
        // 2. Fetch secure chunks directly from TiDB Vector Database with RLS
        console.warn(`[TutorChat] Querying TiDB Vector directly for session: ${sessionId}, user: ${userId}`);
        const queryVectorStr = JSON.stringify(embedding);
        
        let chunks = [];
        try {
          // Check if instructor or student
          const [instructorCheck] = await pool.query(
            'SELECT name FROM test.`tabCourse Instructor` WHERE parent = ? AND instructor = ? LIMIT 1',
            [courseId, userId]
          );
          const isInstructor = instructorCheck && instructorCheck.length > 0;
          
          let vectorSql = `
            SELECT id, document_id, content, page_number, 1 - VEC_COSINE_DISTANCE(embedding, ?) AS similarity
            FROM test.\`LMS Document Chunk\`
            WHERE tenant_id = ? AND session_id = ?
          `;
          const params = [queryVectorStr, payload.tenant_id || 'default', sessionId];
          
          if (!isInstructor && userId) {
            vectorSql += ' AND (user_id = ? OR user_id = "Administrator" OR user_id IS NULL)';
            params.push(userId);
          }
          
          vectorSql += `
            HAVING similarity >= 0.2
            ORDER BY similarity DESC
            LIMIT 4
          `;
          
          const [rows] = await pool.query(vectorSql, params);
          chunks = rows || [];
          console.warn(`[TutorChat] Retrieved ${chunks.length} secure chunks from TiDB Vector.`);
        } catch (dbErr) {
          console.warn('[TutorChat] Vector query exception:', dbErr.message);
        }

        if (chunks.length > 0) {
          // Deduplicate chunks by content
          const uniqueChunks = [];
          const seenContents = new Set();
          for (const chunk of chunks) {
            const cleanContent = chunk.content.trim();
            if (!seenContents.has(cleanContent)) {
              seenContents.add(cleanContent);
              uniqueChunks.push(chunk);
            }
          }

          if (uniqueChunks.length > 0) {
            ragContext = '\n\nUse the following document segments as your knowledge context to answer the student\'s question:\n';
            uniqueChunks.forEach(chunk => {
              ragContext += `[Source: Page ${chunk.page_number}] ${chunk.content}\n`;
            });
            ragContext += '\nUse the provided context to answer the question when relevant and cite page numbers. If the student\'s question is unrelated to the context or cannot be answered using it, use your own general knowledge to answer directly, but clarify that it is from general knowledge rather than the document.';
          }
        }
      }
    } catch (e) {
      console.error("[TutorChat] RAG retrieval failed, falling back to plain chat:", e);
    }

    // 3. Load conversation history and facts
    const [history, memories] = await Promise.all([
      loadHistory(sessionId),
      recall(userId),
    ]);
    const memoryCtx = buildMemoryContext(history, memories);
    
    // Construct final system instructions incorporating RAG context
    const fullSystem = (system || '') + memoryCtx + ragContext;

    // 4. Call Gemini 3.6 Flash
    const historyContents = (history || []).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            ...historyContents,
            { role: 'user', parts: [{ text: user }] },
          ],
          ...(fullSystem ? { systemInstruction: { parts: [{ text: fullSystem }] } } : {}),
          generationConfig: { temperature: 0.4, maxOutputTokens: maxOutputTokens || 8192 },
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Save conversation to Redis history cache
    if (sessionId && text) {
      const updated = [
        ...(history || []),
        { role: 'user', content: user },
        { role: 'assistant', content: text },
      ];
      await saveHistory(sessionId, updated);
      await trackApiConsumption(userId, user, text);
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("[TutorChat API] Server exception:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
