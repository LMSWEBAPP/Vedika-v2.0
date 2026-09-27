import { NextResponse } from 'next/server';
import { getRotatedKey } from '@/lib/keys';

export async function GET() {
  const key = getRotatedKey();
  if (!key) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
  }

  const model = process.env.GEMINI_LIVE_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

  return NextResponse.json({
    key,
    model,
    wsServerConfigured: !!process.env.NEXT_PUBLIC_VOICE_WS_URL
  });
}
