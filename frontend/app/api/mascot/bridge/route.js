import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

let redisInstance = null;
function getRedis() {
  if (!redisInstance && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (e) {
      console.warn('[MascotBridge API] Redis init notice:', e.message);
    }
  }
  return redisInstance;
}

// In-memory fallback buffers for local dev or if Redis is offline
const inMemoryStore = {
  commandsToBrowser: [],
  eventsToMascot: [],
  lastTabSeen: 0,
  activeTabInfo: null,
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'browser'; // 'browser' | 'mascot' | 'status'
  const tabId = searchParams.get('tabId') || 'default_tab';
  const currentPath = searchParams.get('path') || '/';

  const redis = getRedis();
  const now = Date.now();

  try {
    if (role === 'browser') {
      // 1. Register active browser tab presence
      inMemoryStore.lastTabSeen = now;
      inMemoryStore.activeTabInfo = { tabId, currentPath, lastSeen: now };

      let nextCommand = null;

      if (redis) {
        try {
          await redis.set('mascot:active_tab', JSON.stringify({ tabId, currentPath, lastSeen: now }), { ex: 120 });
          // Pop any pending command for browser
          const cmdRaw = await redis.rpop('mascot:cmd:to_browser');
          if (cmdRaw) {
            nextCommand = typeof cmdRaw === 'string' ? JSON.parse(cmdRaw) : cmdRaw;
          }
        } catch (e) {
          console.warn('[MascotBridge API] Redis read error:', e.message);
        }
      }

      if (!nextCommand && inMemoryStore.commandsToBrowser.length > 0) {
        nextCommand = inMemoryStore.commandsToBrowser.shift();
      }

      return NextResponse.json({
        success: true,
        role: 'browser',
        command: nextCommand,
      }, { headers: corsHeaders() });

    } else if (role === 'mascot') {
      // Mascot polling for events emitted by the browser tab
      let hasActiveTab = false;
      let nextEvent = null;

      if (redis) {
        try {
          const tabData = await redis.get('mascot:active_tab');
          hasActiveTab = Boolean(tabData);

          const eventRaw = await redis.rpop('mascot:event:to_mascot');
          if (eventRaw) {
            nextEvent = typeof eventRaw === 'string' ? JSON.parse(eventRaw) : eventRaw;
          }
        } catch (e) {
          console.warn('[MascotBridge API] Redis mascot read error:', e.message);
        }
      }

      if (!hasActiveTab) {
        hasActiveTab = (now - inMemoryStore.lastTabSeen) < 120000;
      }
      if (!nextEvent && inMemoryStore.eventsToMascot.length > 0) {
        nextEvent = inMemoryStore.eventsToMascot.shift();
      }

      return NextResponse.json({
        success: true,
        role: 'mascot',
        hasActiveTab,
        event: nextEvent,
      }, { headers: corsHeaders() });

    } else {
      // Status check
      let hasActiveTab = (now - inMemoryStore.lastTabSeen) < 120000;
      let tabInfo = inMemoryStore.activeTabInfo;

      if (redis) {
        try {
          const tabData = await redis.get('mascot:active_tab');
          if (tabData) {
            hasActiveTab = true;
            tabInfo = typeof tabData === 'string' ? JSON.parse(tabData) : tabData;
          }
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        hasActiveTab,
        tabInfo,
      }, { headers: corsHeaders() });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request) {
  const redis = getRedis();

  try {
    const body = await request.json();
    const source = body.source || 'mascot'; // 'mascot' | 'browser'
    const payload = body.payload || body;
    const type = body.type || payload.type || 'NAVIGATE_WEBAPP';

    const message = {
      type,
      payload: payload.payload || payload,
      timestamp: Date.now(),
      id: Math.random().toString(36).substring(2, 9),
    };

    let hasActiveTab = false;

    if (source === 'mascot') {
      // Command from desktop companion destined for active browser tab
      if (redis) {
        try {
          await redis.lpush('mascot:cmd:to_browser', JSON.stringify(message));
          await redis.ltrim('mascot:cmd:to_browser', 0, 10);
          const tabData = await redis.get('mascot:active_tab');
          hasActiveTab = Boolean(tabData);
        } catch (e) {
          console.warn('[MascotBridge API] Redis push error:', e.message);
        }
      }

      inMemoryStore.commandsToBrowser.push(message);
      if (inMemoryStore.commandsToBrowser.length > 10) inMemoryStore.commandsToBrowser.shift();
      hasActiveTab = hasActiveTab || (Date.now() - inMemoryStore.lastTabSeen < 120000);

      return NextResponse.json({
        success: true,
        delivered: true,
        queued: true,
        hasActiveTab,
        messageId: message.id,
      }, { headers: corsHeaders() });

    } else {
      // Event from browser tab destined for desktop mascot
      if (redis) {
        try {
          await redis.lpush('mascot:event:to_mascot', JSON.stringify(message));
          await redis.ltrim('mascot:event:to_mascot', 0, 10);
        } catch (e) {
          console.warn('[MascotBridge API] Redis event push error:', e.message);
        }
      }

      inMemoryStore.eventsToMascot.push(message);
      if (inMemoryStore.eventsToMascot.length > 10) inMemoryStore.eventsToMascot.shift();

      return NextResponse.json({
        success: true,
        delivered: true,
        messageId: message.id,
      }, { headers: corsHeaders() });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders() });
  }
}
