import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { getSuperAdminMetrics } from '@/lib/organizations';
import { Redis } from '@upstash/redis';

export async function GET(request) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  try {
    const data = await getSuperAdminMetrics();

    // Check service health
    const health = {
      api: { status: 'healthy', timestamp: new Date().toISOString() },
      redis: { status: 'offline', latencyMs: null },
      voiceServer: { status: 'offline', port: 5001 }
    };

    // Redis Health Check
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const start = Date.now();
        const r = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        const pong = await r.ping();
        if (pong === 'PONG') {
          health.redis = { status: 'healthy', latencyMs: Date.now() - start };
        }
      } catch (e) {
        health.redis = { status: 'degraded', error: e.message };
      }
    }

    // Voice Server Health Check
    try {
      const voicePort = process.env.VOICE_SERVER_PORT || '5001';
      const voiceRes = await fetch(`http://localhost:${voicePort}/api/health`, {
        signal: AbortSignal.timeout(1500)
      }).catch(() => null);

      if (voiceRes && voiceRes.ok) {
        health.voiceServer = { status: 'healthy', port: voicePort };
      } else {
        health.voiceServer = { status: 'standby', port: voicePort, note: 'Next.js WS combined server fallback active' };
      }
    } catch {
      health.voiceServer = { status: 'standby', port: 5001 };
    }

    return NextResponse.json({
      success: true,
      metrics: data.kpis,
      organizations: data.organizations,
      admins: data.admins,
      auditLogs: data.auditLogs,
      health
    });
  } catch (error) {
    console.error('[SuperAdmin Metrics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve SaaS metrics.' },
      { status: 500 }
    );
  }
}
