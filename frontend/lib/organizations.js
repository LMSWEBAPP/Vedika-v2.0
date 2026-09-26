import fs from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';
import { signJwt } from './auth.js';

let redisInstance = null;
function getRedis() {
  if (!redisInstance && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (e) {
      console.warn('[Organizations] Redis init failed:', e.message);
    }
  }
  return redisInstance;
}

const DATA_FILE = path.join(process.cwd(), 'lib', 'organizations_data.json');

// In-memory runtime cache to prevent redundant disk/network I/O
let memoryCache = null;

function loadLocalFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Organizations] Error reading local data file:', e.message);
  }
  return { organizations: [], admins: [], audit_logs: [] };
}

function saveLocalFile(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    memoryCache = data;
  } catch (e) {
    console.error('[Organizations] Error writing local data file:', e.message);
  }
}

/**
 * Loads all state with Redis priority and local file backup.
 */
async function getFullState() {
  const r = getRedis();
  if (r) {
    try {
      const cached = await r.get('vedika:multi_tenant_state');
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        if (parsed.organizations && parsed.organizations.length > 0) {
          memoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Organizations] Redis read error, using local fallback:', e.message);
    }
  }

  if (!memoryCache) {
    memoryCache = loadLocalFile();
  }
  return memoryCache;
}

/**
 * Saves full state to both Redis and local backup.
 */
async function saveFullState(state) {
  memoryCache = state;
  saveLocalFile(state);

  const r = getRedis();
  if (r) {
    try {
      await r.set('vedika:multi_tenant_state', JSON.stringify(state));
    } catch (e) {
      console.warn('[Organizations] Redis save error:', e.message);
    }
  }
}

/**
 * Log an administrative audit event.
 */
export async function logAuditEvent(action, target, details, actor = 'Super Admin') {
  const state = await getFullState();
  const entry = {
    id: 'audit-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    action,
    actor,
    target: target || 'System',
    details: details || ''
  };

  state.audit_logs = [entry, ...(state.audit_logs || [])].slice(0, 100);
  await saveFullState(state);
  return entry;
}

/**
 * List all organizations.
 */
export async function getAllOrganizations() {
  const state = await getFullState();
  return state.organizations || [];
}

/**
 * Find organization by ID.
 */
export async function getOrganizationById(id) {
  const state = await getFullState();
  return (state.organizations || []).find(o => o.id === id) || null;
}

/**
 * Find organization by slug or domain.
 */
export async function getOrganizationBySlug(slugOrDomain) {
  const state = await getFullState();
  const lower = (slugOrDomain || '').toLowerCase().trim();
  return (state.organizations || []).find(o => 
    (o.slug || '').toLowerCase() === lower || 
    (o.domain || '').toLowerCase() === lower
  ) || null;
}

/**
 * Create a new organization and its initial administrator.
 */
export async function createOrganization({
  name,
  slug,
  plan = 'pro',
  max_seats = 500,
  voice_minutes_limit = 5000,
  tokens_limit = 5000000,
  admin_name,
  admin_email,
  admin_password
}) {
  if (!name || !name.trim()) throw new Error('Organization name is required.');
  const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)).replace(/^-+|-+$/g, '');
  if (!cleanSlug) throw new Error('A valid slug is required.');

  const state = await getFullState();
  const existing = (state.organizations || []).find(o => o.slug === cleanSlug);
  if (existing) throw new Error(`An organization with slug "${cleanSlug}" already exists.`);

  const orgId = `org-${cleanSlug}`;
  const now = new Date().toISOString();

  const newOrg = {
    id: orgId,
    name: name.trim(),
    slug: cleanSlug,
    domain: `${cleanSlug}.vedika.ai`,
    plan: plan.toLowerCase(),
    status: 'active',
    max_seats: parseInt(max_seats, 10) || 500,
    seats_used: 0,
    voice_minutes_limit: parseInt(voice_minutes_limit, 10) || 5000,
    voice_minutes_used: 0,
    tokens_limit: parseInt(tokens_limit, 10) || 5000000,
    tokens_used: 0,
    admin_name: admin_name?.trim() || 'Institution Administrator',
    admin_email: admin_email?.trim() || `admin@${cleanSlug}.edu`,
    created_at: now,
    updated_at: now
  };

  const newAdmin = {
    id: `adm-${cleanSlug}-01`,
    org_id: orgId,
    name: newOrg.admin_name,
    email: newOrg.admin_email,
    role: 'Primary Org Administrator',
    status: 'active',
    created_at: now,
    last_login: null
  };

  state.organizations = [newOrg, ...(state.organizations || [])];
  state.admins = [newAdmin, ...(state.admins || [])];

  await saveFullState(state);
  await logAuditEvent('ORG_CREATED', newOrg.name, `Created plan ${plan} with ${max_seats} seats`);

  return { organization: newOrg, admin: newAdmin };
}

/**
 * Update organization parameters (quotas, seats, plan, name).
 */
export async function updateOrganization(id, updates = {}) {
  const state = await getFullState();
  const idx = (state.organizations || []).findIndex(o => o.id === id);
  if (idx === -1) throw new Error('Organization not found.');

  const existing = state.organizations[idx];
  const updated = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString()
  };

  state.organizations[idx] = updated;
  await saveFullState(state);
  await logAuditEvent('ORG_UPDATED', updated.name, `Updated parameters: ${Object.keys(updates).join(', ')}`);

  return updated;
}

/**
 * Toggle organization status between active and suspended.
 */
export async function toggleOrganizationStatus(id, newStatus) {
  const status = (newStatus || '').toLowerCase();
  if (status !== 'active' && status !== 'suspended') {
    throw new Error('Invalid status. Must be "active" or "suspended".');
  }

  const state = await getFullState();
  const org = (state.organizations || []).find(o => o.id === id);
  if (!org) throw new Error('Organization not found.');

  org.status = status;
  org.updated_at = new Date().toISOString();

  await saveFullState(state);
  await logAuditEvent(
    status === 'active' ? 'ORG_ACTIVATED' : 'ORG_SUSPENDED',
    org.name,
    `Organization status shifted to ${status}`
  );

  return org;
}

/**
 * Delete organization and its associated administrators.
 */
export async function deleteOrganization(id) {
  const state = await getFullState();
  const org = (state.organizations || []).find(o => o.id === id);
  if (!org) throw new Error('Organization not found.');

  state.organizations = state.organizations.filter(o => o.id !== id);
  state.admins = (state.admins || []).filter(a => a.org_id !== id);

  await saveFullState(state);
  await logAuditEvent('ORG_DELETED', org.name, `Removed organization and associated records`);

  return { success: true };
}

/**
 * Retrieve all administrators across all organizations or for a specific org.
 */
export async function getOrgAdmins(orgId = null) {
  const state = await getFullState();
  if (orgId) {
    return (state.admins || []).filter(a => a.org_id === orgId);
  }
  return state.admins || [];
}

/**
 * Increments voice usage minutes for an organization.
 */
export async function recordOrgVoiceUsage(orgId, minutes = 1) {
  if (!orgId) return;
  const state = await getFullState();
  const org = (state.organizations || []).find(o => o.id === orgId || o.slug === orgId);
  if (org) {
    org.voice_minutes_used = (org.voice_minutes_used || 0) + minutes;
    org.updated_at = new Date().toISOString();
    await saveFullState(state);
  }
}

/**
 * Increments LLM token usage for an organization.
 */
export async function recordOrgTokenUsage(orgId, tokens = 0) {
  if (!orgId || tokens <= 0) return;
  const state = await getFullState();
  const org = (state.organizations || []).find(o => o.id === orgId || o.slug === orgId);
  if (org) {
    org.tokens_used = (org.tokens_used || 0) + tokens;
    org.updated_at = new Date().toISOString();
    await saveFullState(state);
  }
}

/**
 * Generate a scoped, short-lived JWT for Super Admin to impersonate an Org Admin.
 */
export async function generateImpersonationToken(orgId, adminEmail) {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found.');

  const token = signJwt({
    user_id: adminEmail || org.admin_email,
    email: adminEmail || org.admin_email,
    role: 'Administrator',
    organization_id: org.id,
    organization_name: org.name,
    impersonated_by: 'super_admin'
  }, { expiresIn: 3600 }); // 1 hour valid

  await logAuditEvent('IMPERSONATION_ACCESSED', org.name, `Super Admin impersonated ${adminEmail || org.admin_email}`);

  return { token, org };
}

/**
 * Global SaaS Metrics & Aggregated Platform KPIs.
 */
export async function getSuperAdminMetrics() {
  const state = await getFullState();
  const orgs = state.organizations || [];

  const totalOrgs = orgs.length;
  const activeOrgs = orgs.filter(o => o.status === 'active').length;
  const suspendedOrgs = orgs.filter(o => o.status === 'suspended').length;

  const totalSeatsAllotted = orgs.reduce((sum, o) => sum + (o.max_seats || 0), 0);
  const totalStudentsEnrolled = orgs.reduce((sum, o) => sum + (o.seats_used || 0), 0);

  const totalVoiceMinutesAllotted = orgs.reduce((sum, o) => sum + (o.voice_minutes_limit || 0), 0);
  const totalVoiceMinutesUsed = orgs.reduce((sum, o) => sum + (o.voice_minutes_used || 0), 0);

  const totalTokensAllotted = orgs.reduce((sum, o) => sum + (o.tokens_limit || 0), 0);
  const totalTokensUsed = orgs.reduce((sum, o) => sum + (o.tokens_used || 0), 0);

  return {
    kpis: {
      totalOrgs,
      activeOrgs,
      suspendedOrgs,
      totalSeatsAllotted,
      totalStudentsEnrolled,
      totalVoiceMinutesAllotted,
      totalVoiceMinutesUsed,
      totalTokensAllotted,
      totalTokensUsed
    },
    organizations: orgs,
    admins: state.admins || [],
    auditLogs: state.audit_logs || []
  };
}
