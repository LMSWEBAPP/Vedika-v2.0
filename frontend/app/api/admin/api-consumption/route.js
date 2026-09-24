import { NextResponse } from 'next/server';
import { getApiConsumptionStats } from '@/lib/memory';
import { authenticateRequest } from '@/lib/serverAuth';

export async function GET(request) {
  const auth = await authenticateRequest(request, { requireAdmin: true });
  if (auth.response) return auth.response;

  try {
    const stats = await getApiConsumptionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API Consumption Error]:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
