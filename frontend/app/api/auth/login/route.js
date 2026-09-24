import { NextResponse } from 'next/server';
import { signJwt } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userIdentifier = (body.usr || body.email || '').trim();
    const userPassword = (body.pwd || body.password || '').trim();

    if (!userIdentifier || !userPassword) {
      return NextResponse.json({ error: 'Username/email and password are required.' }, { status: 400 });
    }

    const frappeUrl = (process.env.FRAPPE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || 'https://vyomanta.onrender.com').replace(/\/$/, '');
    
    // Call Frappe backend login endpoint server-to-server (bypasses browser CORS)
    let frappeRes;
    try {
      frappeRes = await fetch(`${frappeUrl}/api/method/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usr: userIdentifier, pwd: userPassword })
      });
    } catch (netErr) {
      console.error('[API/Auth/Login] Network error connecting to Frappe backend:', netErr.message);
      return NextResponse.json({ 
        error: 'Unable to reach backend server. It may be starting up on Render, please retry in a few seconds.' 
      }, { status: 503 });
    }

    const rawText = await frappeRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('[API/Auth/Login] Non-JSON response from backend:', rawText.slice(0, 100));
      return NextResponse.json({ 
        error: 'The backend service is currently waking up. Please wait 10-15 seconds and try again.' 
      }, { status: 502 });
    }

    if (!frappeRes.ok || (data.message !== 'Logged In' && data.message !== 'No App')) {
      return NextResponse.json({ 
        error: data.message || 'Invalid email or password.' 
      }, { status: 401 });
    }

    // Extract Frappe session cookie (sid)
    const setCookie = frappeRes.headers.get('set-cookie') || '';
    const sidMatch = setCookie.match(/sid=([^;]+)/);
    const sid = sidMatch ? sidMatch[1] : (data.sid || null);

    const loggedUser = data.user_id || userIdentifier;
    const fullName = data.full_name || loggedUser;
    const isAdmin = loggedUser === 'Administrator' || loggedUser === 'admin@lms.com' || (data.user_id && data.user_id.toLowerCase().includes('admin'));
    const role = isAdmin ? 'Administrator' : 'Student';

    // Issue signed JWT token
    const token = signJwt({
      user_id: loggedUser,
      email: loggedUser.includes('@') ? loggedUser : 'admin@lms.com',
      role,
      tenant_id: 'default'
    }, { expiresIn: 86400 });

    const response = NextResponse.json({
      success: true,
      message: 'Logged In',
      sid,
      token,
      user: {
        email: loggedUser.includes('@') ? loggedUser : 'admin@lms.com',
        username: loggedUser,
        name: fullName,
        role,
        token
      }
    });

    if (sid) {
      response.cookies.set('sid', sid, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 86400 * 7
      });
    }
    response.cookies.set('jwt', token, {
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400 * 7
    });

    return response;
  } catch (error) {
    console.error('[API/Auth/Login] Server exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
