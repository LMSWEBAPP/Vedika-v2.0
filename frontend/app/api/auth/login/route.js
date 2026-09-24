import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { signJwt } from '@/lib/auth';
import { getFrappeDb } from '@/lib/frappe-db';
import { verifyPassword } from '@/lib/auth-passlib';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userIdentifier = (body.usr || body.email || '').trim();
    const userPassword = (body.pwd || body.password || '').trim();

    if (!userIdentifier || !userPassword) {
      return NextResponse.json({ error: 'Username/email and password are required.' }, { status: 400 });
    }

    let frappeUrl = (process.env.FRAPPE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || 'https://vedika-v2-0.onrender.com').replace(/\/$/, '');
    if (frappeUrl.includes('vyomanta.onrender.com')) {
      frappeUrl = 'https://vedika-v2-0.onrender.com';
    }
    
    // 1. First attempt: Call Frappe backend login endpoint server-to-server
    let frappeLoggedIn = false;
    let loggedUser = userIdentifier;
    let fullName = userIdentifier;
    let sid = null;

    try {
      const frappeRes = await fetch(`${frappeUrl}/api/method/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usr: userIdentifier, pwd: userPassword }),
        signal: AbortSignal.timeout(5000)
      });

      const rawText = await frappeRes.text();
      let data = null;
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        // Non-JSON response, Frappe may be initializing or cold-starting
      }

      if (frappeRes.ok && data && (data.message === 'Logged In' || data.message === 'No App')) {
        frappeLoggedIn = true;
        loggedUser = data.user_id || userIdentifier;
        fullName = data.full_name || loggedUser;
        const setCookie = frappeRes.headers.get('set-cookie') || '';
        const sidMatch = setCookie.match(/sid=([^;]+)/);
        sid = sidMatch ? sidMatch[1] : (data.sid || null);
      } else if (frappeRes.status === 401 && data && data.message) {
        // Explicit 401 from live Frappe backend
        return NextResponse.json({ error: data.message || 'Invalid email or password.' }, { status: 401 });
      }
    } catch (netErr) {
      console.warn('[API/Auth/Login] Frappe backend unavailable, attempting direct database auth:', netErr.message);
    }

    // 2. Fallback to direct TiDB database verification if Frappe is waking up or cold-starting
    if (!frappeLoggedIn) {
      try {
        const db = getFrappeDb();
        const [users] = await db.query(
          'SELECT name, email, first_name, last_name, full_name, enabled, user_type FROM `tabUser` WHERE (name = ? OR email = ?) AND enabled = 1 LIMIT 1',
          [userIdentifier, userIdentifier]
        );

        if (!users || users.length === 0) {
          return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const userRow = users[0];
        const [authRows] = await db.query(
          'SELECT password FROM `__Auth` WHERE doctype = "User" AND name = ? AND fieldname = "password" LIMIT 1',
          [userRow.name]
        );

        if (!authRows || authRows.length === 0 || !authRows[0].password) {
          return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        const isPasswordValid = verifyPassword(userPassword, authRows[0].password);
        if (!isPasswordValid) {
          return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
        }

        frappeLoggedIn = true;
        loggedUser = userRow.email || userRow.name;
        fullName = userRow.full_name || `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim() || loggedUser;
        sid = crypto.randomBytes(16).toString('hex');
      } catch (dbErr) {
        console.error('[API/Auth/Login] TiDB direct auth error:', dbErr);
        return NextResponse.json({ 
          error: 'Unable to reach backend services. Please retry in a few moments.' 
        }, { status: 503 });
      }
    }

    if (!frappeLoggedIn) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Determine user role
    let role = 'Student';
    const isAdmin = loggedUser === 'Administrator' || 
                    loggedUser === 'admin@lms.com' || 
                    loggedUser.toLowerCase().includes('admin');
    
    if (isAdmin) {
      role = 'Administrator';
    } else {
      try {
        const db = getFrappeDb();
        const [userRoles] = await db.query(
          'SELECT role FROM `tabHas Role` WHERE parent = ?',
          [loggedUser]
        );
        if (userRoles && userRoles.some(r => r.role === 'System Manager' || r.role === 'Administrator')) {
          role = 'Administrator';
        }
      } catch (roleErr) {
        // Default to Student on error
      }
    }

    // Issue signed JWT token
    const token = signJwt({
      user_id: loggedUser,
      email: loggedUser.includes('@') ? loggedUser : 'admin@lms.com',
      role,
      tenant_id: 'default'
    }, { expiresIn: 86400 * 7 });

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
