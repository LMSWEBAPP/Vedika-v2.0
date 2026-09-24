import { NextResponse } from 'next/server';
import { verifyJwt, isAdminUser } from '@/lib/auth';

/**
 * Centralized server-side authentication and authorization helper.
 * Validates JWT bearer tokens, session cookies, and role permissions.
 *
 * @param {Request} request Next.js request
 * @param {Object} options
 * @param {boolean} options.requireAuth Fail with 401 if unauthenticated (default: true)
 * @param {boolean} options.requireAdmin Fail with 403 if user is not Administrator (default: false)
 * @returns {Promise<{ authenticated: boolean, isAdmin: boolean, user: Object|null, response: NextResponse|null }>}
 */
export async function authenticateRequest(request, { requireAuth = true, requireAdmin = false } = {}) {
  try {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }

    // 2. Check cookies if token not provided in header
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const jwtMatch = cookieHeader.match(/(?:jwt|token)=([^;]+)/);
      if (jwtMatch) {
        token = jwtMatch[1];
      }
    }

    let payload = null;
    if (token) {
      payload = verifyJwt(token);
    }

    // 3. Check for active Frappe session cookie if JWT was absent
    if (!payload) {
      const cookieHeader = request.headers.get('cookie') || '';
      const sidMatch = cookieHeader.match(/sid=([^;]+)/);
      if (sidMatch && sidMatch[1] && sidMatch[1] !== 'Guest') {
        const sid = sidMatch[1];
        try {
          let frappeUrl = (process.env.FRAPPE_URL || process.env.NEXT_PUBLIC_FRAPPE_URL || 'https://vedika-v2-0.onrender.com').replace(/\/$/, '');
          if (frappeUrl.includes('vyomanta.onrender.com')) {
            frappeUrl = 'https://vedika-v2-0.onrender.com';
          }
          const verifyRes = await fetch(`${frappeUrl}/api/method/frappe.auth.get_logged_user`, {
            headers: { 'Cookie': `sid=${sid}` }
          });
          if (verifyRes.ok) {
            const data = await verifyRes.json();
            const loggedUser = data.message;
            if (loggedUser && loggedUser !== 'Guest') {
              const isAdmin = loggedUser === 'Administrator' || loggedUser === 'admin@lms.com';
              payload = {
                user_id: loggedUser,
                email: loggedUser.includes('@') ? loggedUser : 'admin@lms.com',
                role: isAdmin ? 'Administrator' : 'Student',
                tenant_id: 'default'
              };
            }
          }
        } catch (e) {
          console.warn('[ServerAuth] Could not verify sid with auth backend:', e.message);
        }
      }
    }

    // If no valid auth found
    if (!payload) {
      if (requireAuth) {
        return {
          authenticated: false,
          isAdmin: false,
          user: null,
          response: NextResponse.json(
            { error: 'Unauthorized: Authentication required to perform this action.' },
            { status: 401 }
          )
        };
      }
      return {
        authenticated: false,
        isAdmin: false,
        user: null,
        response: null
      };
    }

    const isAdmin = isAdminUser(payload);
    const user = {
      user_id: payload.user_id || payload.email || 'user',
      email: payload.email || payload.user_id || '',
      role: payload.role || (isAdmin ? 'Administrator' : 'Student'),
      tenant_id: payload.tenant_id || 'default'
    };

    if (requireAdmin && !isAdmin) {
      return {
        authenticated: true,
        isAdmin: false,
        user,
        response: NextResponse.json(
          { error: 'Forbidden: Administrator privileges required.' },
          { status: 403 }
        )
      };
    }

    return {
      authenticated: true,
      isAdmin,
      user,
      response: null
    };
  } catch (error) {
    console.error('[ServerAuth] Exception during authentication:', error.message);
    return {
      authenticated: false,
      isAdmin: false,
      user: null,
      response: NextResponse.json(
        { error: 'Internal authentication validation failure.' },
        { status: 500 }
      )
    };
  }
}
