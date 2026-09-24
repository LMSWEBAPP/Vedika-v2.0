import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFrappeDb } from '@/lib/frappe-db';
import { hashPassword } from '@/lib/auth-passlib';
import { signJwt } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || body.usr || '').trim().toLowerCase();
    const fullName = (body.name || body.full_name || '').trim();
    const password = (body.password || body.pwd || '').trim();

    // 1. Validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }
    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name (at least 2 characters).' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || null;

    const db = getFrappeDb();

    // 2. Check if user already exists
    const [existing] = await db.query(
      'SELECT name, email FROM `tabUser` WHERE name = ? OR email = ? LIMIT 1',
      [email, email]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        error: 'An account with this email address already exists. Please sign in instead.' 
      }, { status: 409 });
    }

    // 3. Hash password with Frappe/passlib PBKDF2-SHA256 format
    const hashedPassword = hashPassword(password);
    const now = new Date();
    const roleId = crypto.randomBytes(5).toString('hex');

    // 4. Create User in tabUser
    await db.query(
      `INSERT INTO \`tabUser\` (
        name, creation, modified, modified_by, owner, docstatus, idx,
        email, first_name, last_name, full_name, user_type, enabled, send_welcome_email
      ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, 'Website User', 1, 0)`,
      [email, now, now, email, email, email, firstName, lastName, fullName]
    );

    // 5. Store Password in __Auth
    await db.query(
      `INSERT INTO \`__Auth\` (doctype, name, fieldname, password, encrypted)
       VALUES ('User', ?, 'password', ?, 0)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [email, hashedPassword]
    );

    // 6. Assign LMS Student Role in tabHas Role
    await db.query(
      `INSERT INTO \`tabHas Role\` (
        name, creation, modified, modified_by, owner, docstatus, idx,
        role, parent, parentfield, parenttype
      ) VALUES (?, ?, ?, ?, ?, 0, 1, 'LMS Student', ?, 'roles', 'User')`,
      [roleId, now, now, email, email, email]
    );

    // 7. Generate JWT Auth Token
    const token = signJwt({
      user_id: email,
      email,
      role: 'Student',
      tenant_id: 'default'
    }, { expiresIn: 86400 * 7 });

    const simulatedSid = crypto.randomBytes(16).toString('hex');

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        email,
        username: email,
        name: fullName,
        role: 'Student',
        token
      }
    });

    response.cookies.set('jwt', token, {
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400 * 7
    });

    response.cookies.set('sid', simulatedSid, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400 * 7
    });

    return response;

  } catch (error) {
    console.error('[API/Auth/Signup] Registration error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unable to complete registration. Please try again.' 
    }, { status: 500 });
  }
}
