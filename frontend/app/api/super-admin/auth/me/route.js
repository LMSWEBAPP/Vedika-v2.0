import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';

export async function GET(request) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  return NextResponse.json({
    authenticated: true,
    user: auth.user
  });
}

export async function POST(request) {
  // Logout endpoint for Super Admin
  const response = NextResponse.json({
    success: true,
    message: 'Super Admin logged out.'
  });

  response.cookies.delete('super_admin_jwt');
  return response;
}
