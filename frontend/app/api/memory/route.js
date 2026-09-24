import { NextResponse } from 'next/server';
import { saveHistory, loadHistory, recall } from '@/lib/memory';
import { authenticateRequest } from '@/lib/serverAuth';

export async function POST(request) {
  try {
    const auth = await authenticateRequest(request, { requireAuth: false });
    const { action, sessionId, userId, messages } = await request.json();

    // Verify user authorization: caller cannot inspect another user's recall memories
    const effectiveUserId = auth.authenticated && auth.user?.user_id
      ? auth.user.user_id
      : (userId || 'anonymous');

    // If caller explicitly tries to access another user's memories without admin rights
    if (auth.authenticated && !auth.isAdmin && userId && userId !== auth.user?.user_id && userId !== auth.user?.email) {
      return NextResponse.json({ error: 'Forbidden: Cannot access other users conversation memory.' }, { status: 403 });
    }

    if (action === 'save' && sessionId && messages?.length > 0) {
      await saveHistory(sessionId, messages);
      return NextResponse.json({ ok: true });
    }

    if (action === 'load' && sessionId) {
      const [history, memories] = await Promise.all([
        loadHistory(sessionId),
        recall(effectiveUserId),
      ]);
      return NextResponse.json({ history, memories });
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  } catch (error) {
    console.error('[API/Memory] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
