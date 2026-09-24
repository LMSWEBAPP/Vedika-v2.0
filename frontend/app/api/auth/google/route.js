import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'https://vedika-v20c.vercel.app';
    const parsedOrigin = new URL(origin, 'https://vedika-v20c.vercel.app').origin;
    const redirectTo = searchParams.get('redirect_to') || `${parsedOrigin}/auth/callback`;

    let backendUrl = (process.env.FRAPPE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || 'https://vedika-v2-0.onrender.com').replace(/\/$/, '');
    if (backendUrl.includes('vyomanta.onrender.com')) {
      backendUrl = 'https://vedika-v2-0.onrender.com';
    }

    // 1. Attempt to fetch authorize URL directly from Frappe backend
    try {
      const frappeRes = await fetch(
        `${backendUrl}/api/method/lms.lms.api.get_google_auth_url?redirect_to=${encodeURIComponent(redirectTo)}`,
        { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }
      );
      if (frappeRes.ok) {
        const data = await frappeRes.json();
        if (data.message && typeof data.message === 'string' && data.message.startsWith('https://')) {
          return NextResponse.json({ url: data.message });
        }
      }
    } catch (e) {
      console.warn('[API/Auth/Google] Frappe get_google_auth_url request failed:', e.message);
    }

    // 2. Resilient fallback using environment credentials if Frappe is cold-starting
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      const frappeRedirectUri = `${backendUrl}/api/method/frappe.integrations.oauth2_logins.login_via_google`;
      const stateObj = {
        site: backendUrl,
        token: crypto.randomBytes(16).toString('hex'),
        redirect_to: redirectTo
      };
      const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(frappeRedirectUri)}&response_type=code&scope=${encodeURIComponent('openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')}&state=${encodeURIComponent(state)}`;
      
      return NextResponse.json({ url: googleAuthUrl });
    }

    return NextResponse.json({ 
      error: 'Google OAuth configuration is currently unavailable. Please verify backend connectivity.' 
    }, { status: 503 });

  } catch (err) {
    console.error('[API/Auth/Google] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
