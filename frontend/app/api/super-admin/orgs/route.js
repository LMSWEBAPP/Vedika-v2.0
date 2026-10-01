import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { getAllOrganizations, createOrganization } from '@/lib/organizations';

export async function GET(request) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const plan = url.searchParams.get('plan');
    const status = url.searchParams.get('status');
    const query = (url.searchParams.get('q') || '').toLowerCase().trim();

    let orgs = await getAllOrganizations();

    if (plan && plan !== 'all') {
      orgs = orgs.filter(o => o.plan === plan.toLowerCase());
    }
    if (status && status !== 'all') {
      orgs = orgs.filter(o => o.status === status.toLowerCase());
    }
    if (query) {
      orgs = orgs.filter(o => 
        (o.name || '').toLowerCase().includes(query) ||
        (o.slug || '').toLowerCase().includes(query) ||
        (o.domain || '').toLowerCase().includes(query) ||
        (o.admin_email || '').toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      organizations: orgs,
      total: orgs.length
    });
  } catch (error) {
    console.error('[SuperAdmin Orgs] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve organizations.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const result = await createOrganization(body);

    return NextResponse.json({
      success: true,
      message: `Organization "${result.organization.name}" provisioned successfully.`,
      organization: result.organization,
      admin: result.admin
    }, { status: 201 });
  } catch (error) {
    console.error('[SuperAdmin Orgs] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create organization.' },
      { status: 400 }
    );
  }
}
