import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/serverAuth';
import { getOrganizationById, updateOrganization, toggleOrganizationStatus, deleteOrganization } from '@/lib/organizations';

export async function GET(request, { params }) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  try {
    const org = await getOrganizationById(params.id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { status, ...otherUpdates } = body;

    let org;
    if (status) {
      org = await toggleOrganizationStatus(params.id, status);
    }
    if (Object.keys(otherUpdates).length > 0) {
      org = await updateOrganization(params.id, otherUpdates);
    }

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully.',
      organization: org
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await authenticateRequest(request, { requireSuperAdmin: true });
  if (auth.response) return auth.response;

  try {
    await deleteOrganization(params.id);
    return NextResponse.json({
      success: true,
      message: 'Organization removed successfully.'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
