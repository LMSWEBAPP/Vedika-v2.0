import { NextResponse } from 'next/server';
import { signJwt } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Retrieve the Frappe sid from cookies or query params
    const cookieHeader = request.headers.get('cookie') || '';
    let sid = searchParams.get('sid');
    
    if (!sid && cookieHeader) {
      const match = cookieHeader.match(/sid=([^;]+)/);
      if (match) sid = match[1];
    }
    
    const isDev = process.env.NODE_ENV === 'development';

    if (!sid) {
      if (isDev) {
        console.warn("[JWT Proxy] Dev mode fallback: No session found. Generating dev JWT token...");
        const mockPayload = {
          user_id: 'student@lms.com',
          tenant_id: 'default_tenant',
          role: 'Student'
        };
        const token = signJwt(mockPayload, { expiresIn: 3600 });
        return NextResponse.json({ token });
      }
      return NextResponse.json({ error: 'No active session identifier found.' }, { status: 401 });
    }
    
    const frappeUrl = process.env.FRAPPE_URL || 'https://vyomanta.onrender.com';
    const exchangeUrl = `${frappeUrl}/api/method/lms.lms.api.get_jwt`;
    
    try {
      const response = await fetch(exchangeUrl, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `sid=${sid}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const token = data.message?.token;
        if (token) {
          return NextResponse.json({ token });
        }
      }
      console.warn(`[JWT Proxy] Frappe token exchange response status: ${response.status}`);

      // Authoritative fallback: verify session via get_logged_user
      const verifyRes = await fetch(`${frappeUrl}/api/method/frappe.auth.get_logged_user`, {
        headers: { 'Cookie': `sid=${sid}` }
      });
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        const loggedUser = verifyData.message;
        if (loggedUser && loggedUser !== 'Guest') {
          const isAdmin = loggedUser === 'Administrator' || loggedUser === 'admin@lms.com';
          const token = signJwt({
            user_id: loggedUser,
            email: loggedUser.includes('@') ? loggedUser : 'admin@lms.com',
            role: isAdmin ? 'Administrator' : 'Student',
            tenant_id: 'default'
          }, { expiresIn: 3600 });
          return NextResponse.json({ token });
        }
      }
    } catch (err) {
      console.error("[JWT Proxy] Connection to Frappe backend failed:", err.message);
    }

    return NextResponse.json({ error: 'Failed to authenticate session with authentication server.' }, { status: 401 });
  } catch (error) {
    console.error("[JWT Proxy API] Server exception:", error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
