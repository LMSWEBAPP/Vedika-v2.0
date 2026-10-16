import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { signJwt } from '@/lib/auth';
import { logAuditEvent } from '@/lib/organizations';

import { getFrappeDb } from '@/lib/frappe-db';
import { verifyPassword } from '@/lib/auth-passlib';

const DEFAULT_EMAIL = 'superadmin@vedika.ai';

// Rate limiting map for super-admin login
const superAdminLoginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkSuperAdminRateLimit(ip) {
  const now = Date.now();
  const record = superAdminLoginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    superAdminLoginAttempts.set(ip, { attempts: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return false;
  }
  record.attempts += 1;
  return true;
}

function clearSuperAdminRateLimit(ip) {
  superAdminLoginAttempts.delete(ip);
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
    
    if (!checkSuperAdminRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many failed Super Admin login attempts. Locked for 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const expectedEmail = (process.env.SUPER_ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
    const inputEmail = String(email).trim().toLowerCase();
    const inputPassword = String(password).trim();

    if (inputEmail !== expectedEmail) {
      return NextResponse.json(
        { error: 'Invalid Super Administrator credentials.' },
        { status: 401 }
      );
    }

    let authenticated = false;

    // 1. Check TiDB database __Auth hash for Super Admin
    try {
      const db = getFrappeDb();
      const [authRows] = await db.query(
        'SELECT password FROM `__Auth` WHERE doctype = "User" AND name = ? AND fieldname = "password" LIMIT 1',
        [expectedEmail]
      );
      if (authRows && authRows.length > 0 && authRows[0].password) {
        authenticated = verifyPassword(inputPassword, authRows[0].password);
      }
    } catch (dbErr) {
      console.warn('[SuperAdminLogin] Database check notice:', dbErr.message);
    }

    // 2. Check environment variable SUPER_ADMIN_PASSWORD
    if (!authenticated && process.env.SUPER_ADMIN_PASSWORD) {
      authenticated = timingSafeMatch(inputPassword, process.env.SUPER_ADMIN_PASSWORD.trim());
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: 'Invalid Super Administrator credentials.' },
        { status: 401 }
      );
    }

    clearSuperAdminRateLimit(clientIp);

    // Sign high-privilege Super Admin JWT with 12-hour expiry
    const token = signJwt({
      user_id: 'superadmin',
      email: expectedEmail,
      role: 'super_admin',
      is_super_admin: true,
      organization_id: 'global'
    }, { expiresIn: 43200 });

    await logAuditEvent('SUPER_ADMIN_LOGIN', 'System', `Super Admin logged in from ${request.headers.get('x-forwarded-for') || 'local'}`);

    const response = NextResponse.json({
      success: true,
      message: 'Super Administrator authenticated successfully.',
      token,
      user: {
        email: expectedEmail,
        role: 'super_admin',
        is_super_admin: true
      }
    });

    // Set secure HTTP-only cookie
    response.cookies.set('super_admin_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 43200
    });

    return response;
  } catch (error) {
    console.error('[SuperAdminLogin] Error:', error);
    return NextResponse.json(
      { error: 'Internal error processing Super Admin login.' },
      { status: 500 }
    );
  }
}
