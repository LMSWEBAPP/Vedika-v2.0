import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { generateImpersonationToken } from '@/lib/organizations';

export async function POST(request, { params }) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await generateImpersonationToken(params.id, body.admin_email);

    return NextResponse.json({
      success: true,
      message: `Impersonation session initialized for "${result.org.name}".`,
      token: result.token,
      redirectUrl: '/admin',
      org: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
