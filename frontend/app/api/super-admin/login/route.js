import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { signJwt } from '@/lib/auth';
import { logAuditEvent } from '@/lib/organizations';

// Default Super Admin credentials for initial setup
const DEFAULT_EMAIL = 'superadmin@vedika.ai';
const DEFAULT_PASSWORD = 'VedikaSuperAdmin2026!';

function timingSafeMatch(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const expectedEmail = (process.env.SUPER_ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
    const expectedPassword = (process.env.SUPER_ADMIN_PASSWORD || DEFAULT_PASSWORD).trim();

    const inputEmail = String(email).trim().toLowerCase();
    const inputPassword = String(password).trim();

    const emailMatch = timingSafeMatch(inputEmail, expectedEmail);
    const passMatch = timingSafeMatch(inputPassword, expectedPassword);

    if (!emailMatch || !passMatch) {
      return NextResponse.json(
        { error: 'Invalid Super Administrator credentials.' },
        { status: 401 }
      );
    }

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
