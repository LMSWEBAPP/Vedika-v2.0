import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { authenticateRequest } from '@/lib/serverAuth';

let redis = null;
function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

export async function GET(request) {
  const auth = await authenticateRequest(request, { requireAuth: true });
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const requestedEmail = searchParams.get('email');
  const r = getRedis();

  if (!r) {
    return NextResponse.json({ completed: {}, allProgress: {} });
  }

  try {
    // If a specific email is requested:
    // Non-admin users are strictly restricted to their own progress
    if (requestedEmail) {
      if (!auth.isAdmin && auth.user.email.toLowerCase() !== requestedEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access progress records of other students.' },
          { status: 403 }
        );
      }
      const data = await r.get(`completed_lessons:${requestedEmail}`);
      return NextResponse.json({ completed: data || {} });
    }

    // If no email query is provided:
    // Regular students receive their own progress records
    if (!auth.isAdmin) {
      const data = await r.get(`completed_lessons:${auth.user.email}`);
      return NextResponse.json({ completed: data || {} });
    }

    // Administrators can fetch aggregated progress
    const keys = await r.keys('completed_lessons:*');
    const result = {};
    if (keys.length > 0) {
      // Safe bounded fetch
      const boundedKeys = keys.slice(0, 100);
      const values = await Promise.all(boundedKeys.map(key => r.get(key)));
      boundedKeys.forEach((key, idx) => {
        const studentEmail = key.replace('completed_lessons:', '');
        result[studentEmail] = values[idx] || {};
      });
    }
    return NextResponse.json({ allProgress: result });
  } catch (e) {
    console.error('[API/Progress] GET error:', e.message);
    return NextResponse.json({ error: 'Failed to retrieve progress records.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await authenticateRequest(request, { requireAuth: true });
  if (auth.response) return auth.response;

  try {
    const { email, completed } = await request.json();
    const r = getRedis();

    if (!r) {
      return NextResponse.json({ error: 'Storage service unavailable.' }, { status: 500 });
    }

    if (!email || !completed) {
      return NextResponse.json({ error: 'Email and completed object are required.' }, { status: 400 });
    }

    // Prevent cross-user tampering: user can only modify their own progress unless administrator
    if (!auth.isAdmin && auth.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot update progress for other students.' },
        { status: 403 }
      );
    }

    await r.set(`completed_lessons:${email}`, completed);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API/Progress] POST error:', e.message);
    return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 });
  }
}
