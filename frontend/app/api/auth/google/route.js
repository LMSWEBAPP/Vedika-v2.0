import { NextResponse } from 'next/server';
import { getGoogleOAuthConfig } from '@/lib/google-auth-config';

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

    // Dynamic Google OAuth configuration loader
    const { clientId } = await getGoogleOAuthConfig();
    if (clientId) {
      const callbackRedirectUri = `${parsedOrigin}/auth/callback`;
      const stateObj = {
        site: parsedOrigin,
        redirect_to: redirectTo
      };
      const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(callbackRedirectUri)}&response_type=code&scope=${encodeURIComponent('openid profile email')}&state=${encodeURIComponent(state)}&prompt=select_account`;
      
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
