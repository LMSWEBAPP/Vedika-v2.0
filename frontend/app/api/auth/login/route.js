import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { signJwt } from '@/lib/auth';
import { getFrappeDb } from '@/lib/frappe-db';
import { verifyPassword } from '@/lib/auth-passlib';

// Simple in-memory rate limiting against credential brute force
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { attempts: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return false;
  }
  record.attempts += 1;
  return true;
}

function clearRateLimit(key) {
  loginAttempts.delete(key);
}

function timingSafeMatch(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const userIdentifier = (body.usr || body.email || '').trim();
    const userPassword = (body.pwd || body.password || '').trim();

    if (!userIdentifier || !userPassword) {
      return NextResponse.json({ error: 'Username/email and password are required.' }, { status: 400 });
    }

    const rateKey = `${clientIp}:${userIdentifier.toLowerCase()}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' },
        { status: 429 }
      );
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

    // 2. Direct TiDB database verification
    if (!frappeLoggedIn) {
      try {
        const db = getFrappeDb();
        const [users] = await db.query(
          'SELECT name, email, first_name, last_name, full_name, enabled, user_type FROM `tabUser` WHERE (name = ? OR email = ?) AND enabled = 1 LIMIT 1',
          [userIdentifier, userIdentifier]
        );

        if (users && users.length > 0) {
          const userRow = users[0];
          const [authRows] = await db.query(
            'SELECT password FROM `__Auth` WHERE doctype = "User" AND name = ? AND fieldname = "password" LIMIT 1',
            [userRow.name]
          );

          if (authRows && authRows.length > 0 && authRows[0].password) {
            const isPasswordValid = verifyPassword(userPassword, authRows[0].password);
            if (isPasswordValid) {
              frappeLoggedIn = true;
              loggedUser = userRow.email || userRow.name;
              fullName = userRow.full_name || `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim() || loggedUser;
              sid = crypto.randomBytes(16).toString('hex');
            }
          }
        }
      } catch (dbErr) {
        console.warn('[API/Auth/Login] TiDB direct auth notice:', dbErr.message);
      }
    }

    // 3. Super Admin Environment Variable Check (if not in TiDB or database offline)
    let role = 'Student';
    let tenantId = 'default';
    let isSuperAdmin = false;

    const lowerId = userIdentifier.toLowerCase().trim();
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@vedika.ai').toLowerCase().trim();
    const superAdminPass = process.env.SUPER_ADMIN_PASSWORD;

    if (!frappeLoggedIn && superAdminPass && (lowerId === superAdminEmail || lowerId === 'superadmin')) {
      if (timingSafeMatch(userPassword, superAdminPass)) {
        frappeLoggedIn = true;
        loggedUser = superAdminEmail;
        fullName = 'Platform Super Administrator';
        role = 'super_admin';
        isSuperAdmin = true;
        tenantId = 'global';
        sid = crypto.randomBytes(16).toString('hex');
      }
    }

    if (!frappeLoggedIn) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Clear rate limit on success
    clearRateLimit(rateKey);

    // Determine user role and tenant isolation
    if (lowerId === superAdminEmail || lowerId === 'superadmin') {
      role = 'super_admin';
      isSuperAdmin = true;
      tenantId = 'global';
    } else {
      // Check multi-tenant organizations
      try {
        const { getAllOrganizations } = await import('@/lib/organizations');
        const orgs = await getAllOrganizations();
        const matchedOrg = (orgs || []).find(o => 
          (o.admin_email || '').toLowerCase() === lowerId
        );
        if (matchedOrg) {
          role = 'Administrator';
          tenantId = matchedOrg.id;
        } else {
          // Check student organization membership by email domain or matching org
          const studentOrg = (orgs || []).find(o => 
            (o.domain && lowerId.endsWith('@' + o.domain)) ||
            (o.domain && o.admin_email && lowerId.split('@')[1] === o.admin_email.split('@')[1])
          );
          if (studentOrg) {
            tenantId = studentOrg.id;
          }
        }
      } catch (orgErr) {
        console.warn('[API/Auth/Login] Organization lookup notice:', orgErr.message);
      }

      // Check database roles from tabHas Role
      if (role === 'Student') {
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
          // Keep current role on error
        }
      }
    }

    // Issue signed JWT token
    const token = signJwt({
      user_id: loggedUser,
      email: loggedUser.includes('@') ? loggedUser : `${loggedUser}@vedika.ai`,
      role,
      is_super_admin: isSuperAdmin,
      organization_id: tenantId,
      tenant_id: tenantId
    }, { expiresIn: 86400 * 7 });

    const response = NextResponse.json({
      success: true,
      message: 'Logged In',
      sid,
      token,
      user: {
        email: loggedUser.includes('@') ? loggedUser : `${loggedUser}@vedika.ai`,
        username: loggedUser,
        name: fullName,
        role,
        is_super_admin: isSuperAdmin,
        organization_id: tenantId,
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
    response.cookies.set('token', token, {
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400 * 7
    });

    if (isSuperAdmin) {
      response.cookies.set('super_admin_jwt', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 86400 * 7
      });
    }

    return response;
  } catch (error) {
    console.error('[API/Auth/Login] Server exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

