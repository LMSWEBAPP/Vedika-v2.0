import { NextResponse } from 'next/server';
import { getRotatedKey } from '@/lib/keys';

const VALID_LIVE_MODELS = [
  'gemini-3.1-flash-live-preview',
  'gemini-2.5-flash-native-audio-latest',
  'gemini-3.8-live'
];

export async function GET() {
  const key = getRotatedKey();
  if (!key) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
  }

  let model = process.env.GEMINI_LIVE_MODEL;
  if (!model || !VALID_LIVE_MODELS.includes(model)) {
    if (process.env.GEMINI_MODEL && VALID_LIVE_MODELS.includes(process.env.GEMINI_MODEL)) {
      model = process.env.GEMINI_MODEL;
    } else {
      model = 'gemini-3.1-flash-live-preview';
    }
  }

  return NextResponse.json({
    key,
    model,
    wsServerConfigured: !!process.env.NEXT_PUBLIC_VOICE_WS_URL
  });
}
