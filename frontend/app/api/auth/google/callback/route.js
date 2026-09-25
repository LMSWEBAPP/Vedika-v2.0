import { NextResponse } from 'next/server';
import { signJwt } from '@/lib/auth';
import mysql from 'mysql2/promise';
import { getGoogleOAuthConfig, getGoogleClientSecretFallback } from '@/lib/google-auth-config';

export async function POST(request) {
  try {
    const { code, redirect_uri } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const { clientId, clientSecret } = await getGoogleOAuthConfig();
    const redirectUri = redirect_uri || 'https://vedika-v20c.vercel.app/auth/callback';

    // Helper to exchange authorization code for access token with Google
    async function exchangeToken(secret) {
      return await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: secret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
    }

    let tokenRes = await exchangeToken(clientSecret);
    let tokenData = await tokenRes.json();

    // Resilient auto-fallback: If configured secret is rejected by Google, query database for fallback secret
    if (!tokenRes.ok && (tokenData.error === 'invalid_client' || (tokenData.error_description || '').includes('client secret') || (tokenData.error || '').includes('client secret'))) {
      console.warn('[Google OAuth] Configured secret was rejected by Google. Retrying with database secret fallback...');
      const fallbackSecret = await getGoogleClientSecretFallback();
      if (fallbackSecret && fallbackSecret !== clientSecret) {
        tokenRes = await exchangeToken(fallbackSecret);
        tokenData = await tokenRes.json();
      }
    }

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[Google OAuth Error]', tokenData);
      return NextResponse.json({ 
        error: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google' 
      }, { status: 400 });
    }

    // Fetch user profile directly from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.email) {
      return NextResponse.json({ error: 'Failed to retrieve Google profile' }, { status: 400 });
    }

    const email = profile.email.toLowerCase();
    const name = profile.name || email.split('@')[0];
    const isAdmin = email === 'admin@lms.com';
    const role = isAdmin ? 'Administrator' : 'Student';

    // Synchronize user in TiDB if database credentials are present
    try {
      if (process.env.DB_HOST && process.env.DB_USER) {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 4000,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'test',
          ssl: { rejectUnauthorized: false }
        });

        // Check if user exists
        const [existing] = await connection.execute('SELECT name, email, enabled FROM `tabUser` WHERE email = ?', [email]);
        if (existing.length === 0) {
          await connection.execute(
            'INSERT INTO `tabUser` (name, email, first_name, full_name, enabled, user_type, docstatus) VALUES (?, ?, ?, ?, 1, ?, 0)',
            [email, email, name, name, isAdmin ? 'System User' : 'Website User']
          );
          await connection.execute(
            'INSERT IGNORE INTO `tabHas Role` (name, parent, role, parenttype, parentfield) VALUES (?, ?, ?, "User", "roles")',
            [`${email}-${role}`, email, role]
          );
        }
        await connection.end();
      }
    } catch (dbErr) {
      console.warn('[Google OAuth] TiDB user sync skipped:', dbErr.message);
    }

    // Issue standard JWT session token
    const token = signJwt({
      email,
      name,
      role,
      user_id: email,
      picture: profile.picture
    }, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days

    const userProfile = {
      email,
      username: email,
      name,
      role,
      token,
      picture: profile.picture
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      token
    });

  } catch (err) {
    console.error('[Google OAuth Callback] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
