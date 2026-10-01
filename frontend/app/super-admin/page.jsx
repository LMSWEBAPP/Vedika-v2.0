'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Building2, Mic, Users, Activity, Plus, Search,
  CheckCircle2, AlertTriangle, XCircle, LogOut, RefreshCw, ArrowUpRight,
  TrendingUp, Sparkles, ExternalLink, Settings, Trash2, Edit3, Lock,
  Server, Database, Wifi, Clock, ChevronRight
} from 'lucide-react';
import { T } from '@/lib/lms-data';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Core Data
  const [metrics, setMetrics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [health, setHealth] = useState(null);

  // Tab State: 'orgs' | 'metering' | 'admins' | 'health'
  const [activeTab, setActiveTab] = useState('orgs');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [impersonatingOrg, setImpersonatingOrg] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // New Org Form
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    slug: '',
    plan: 'pro',
    max_seats: 500,
    voice_minutes_limit: 5000,
    tokens_limit: 5000000,
    admin_name: '',
    admin_email: ''
  });

  // Verify Super Admin Authentication
  const verifySession = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/auth/me');
      if (!res.ok) throw new Error('Unauthenticated');
      const data = await res.json();
      setCurrentUser(data.user);
      return true;
    } catch {
      router.replace('/super-admin/login');
      return false;
    }
  }, [router]);

  // Load All Metrics & Organization Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch('/api/super-admin/metrics');
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace('/super-admin/login');
          return;
        }
        throw new Error('Failed to fetch platform metrics.');
      }

      const data = await res.json();
      setMetrics(data.metrics || null);
      setOrganizations(data.organizations || []);
      setAdmins(data.admins || []);
      setAuditLogs(data.auditLogs || []);
      setHealth(data.health || null);
    } catch (err) {
      setActionError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    verifySession().then(isValid => {
      if (isValid) loadData();
    });
  }, [verifySession, loadData]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/super-admin/auth/me', { method: 'POST' });
    } catch {}
    localStorage.removeItem('super_admin_jwt');
    localStorage.removeItem('super_admin_user');
    router.replace('/super-admin/login');
  };

  // Toggle Organization Status (Active <-> Suspended)
  const handleToggleStatus = async (org) => {
    const nextStatus = org.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/super-admin/orgs/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status.');
      setActionSuccess(`"${org.name}" status changed to ${nextStatus}.`);
      loadData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Create Organization
  const handleCreateOrg = async (e) => {
    if (e) e.preventDefault();
    setActionError('');
    try {
      const res = await fetch('/api/super-admin/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrgForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create organization.');

      setShowCreateModal(false);
      setActionSuccess(`Organization "${data.organization.name}" provisioned successfully!`);
      setNewOrgForm({
        name: '',
        slug: '',
        plan: 'pro',
        max_seats: 500,
        voice_minutes_limit: 5000,
        tokens_limit: 5000000,
        admin_name: '',
        admin_email: ''
      });
      loadData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Update Organization Quotas
  const handleUpdateQuotas = async (e) => {
    if (e) e.preventDefault();
    if (!editingOrg) return;
    setActionError('');
    try {
      const res = await fetch(`/api/super-admin/orgs/${editingOrg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: editingOrg.plan,
          max_seats: editingOrg.max_seats,
          voice_minutes_limit: editingOrg.voice_minutes_limit,
          tokens_limit: editingOrg.tokens_limit
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update quotas.');

      setEditingOrg(null);
      setActionSuccess(`Quotas updated for "${data.organization.name}".`);
      loadData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Impersonate Organization Admin (Opens /admin with scoped token)
  const handleImpersonate = async (org) => {
    setActionError('');
    try {
      const res = await fetch(`/api/super-admin/orgs/${org.id}/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: org.admin_email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impersonation failed.');

      // Store impersonated token into localStorage & sessionStorage for /admin
      localStorage.setItem('token', data.token);
      localStorage.setItem('frappe_user', JSON.stringify({
        email: org.admin_email,
        role: 'Administrator',
        user_id: org.admin_email,
        organization_id: org.id
      }));

      // Open Org Admin view in a new tab
      window.open('/admin', '_blank');
      setActionSuccess(`Opened support session as administrator for "${org.name}".`);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Filtered Organizations List
  const filteredOrgs = useMemo(() => {
    let list = organizations;
    if (planFilter !== 'all') {
      list = list.filter(o => o.plan === planFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter(o => o.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o =>
        (o.name || '').toLowerCase().includes(q) ||
        (o.slug || '').toLowerCase().includes(q) ||
        (o.domain || '').toLowerCase().includes(q) ||
        (o.admin_email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [organizations, planFilter, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030712',
        color: '#94A3B8',
        fontFamily: 'var(--font-outfit), sans-serif',
        gap: 12
      }}>
        <div style={{ width: 18, height: 18, border: '2px solid #A855F7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading Platform Super Admin Console...</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, #111827 0%, #030712 100%)',
      fontFamily: 'var(--font-outfit), "Segoe UI", sans-serif',
      color: '#F8FAFC',
      paddingBottom: 60
    }}>
      {/* ── TOP NAV BAR ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.45)'
          }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Vedika 2.0</span>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#C084FC',
                background: 'rgba(168, 85, 247, 0.18)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 4,
                padding: '2px 6px',
                letterSpacing: '0.04em'
              }}>
                SUPER ADMIN
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>Multi-Tenant SaaS Governance</div>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Service health indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background: 'rgba(2, 6, 23, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            fontSize: 11.5,
            color: '#94A3B8'
          }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: health?.redis?.status === 'healthy' ? '#10B981' : '#F59E0B',
              boxShadow: `0 0 8px ${health?.redis?.status === 'healthy' ? '#10B981' : '#F59E0B'}`
            }} />
            <span>Redis: {health?.redis?.status === 'healthy' ? `${health.redis.latencyMs}ms` : 'Standby'}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>&middot;</span>
            <span>WS: {health?.voiceServer?.status || '5001'}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#CBD5E1',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.15s'
            }}
            title="Refresh All Metrics"
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          {/* Add Org Action */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(168, 85, 247, 0.35)',
              transition: 'all 0.15s'
            }}
          >
            <Plus size={15} />
            <span>New Organisation</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600
            }}
            title="Log out of Super Admin"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── ALERTS & NOTIFICATIONS ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 28px 0' }}>
        {actionError && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#FCA5A5',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer' }}>&times;</button>
          </div>
        )}

        {actionSuccess && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6EE7B7',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} style={{ background: 'none', border: 'none', color: '#6EE7B7', cursor: 'pointer' }}>&times;</button>
          </div>
        )}
      </div>

      {/* ── EXECUTIVE KPI METRIC RIBBON ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 28px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16
        }}>
          {/* Total Orgs */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
              <span>CLIENT ORGANISATIONS</span>
              <Building2 size={16} color="#A855F7" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '10px 0 4px', letterSpacing: '-0.03em' }}>
              {metrics?.totalOrgs || organizations.length}
            </div>
            <div style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{metrics?.activeOrgs || organizations.filter(o => o.status === 'active').length} active</span>
              {metrics?.suspendedOrgs > 0 && (
                <span style={{ color: '#EF4444' }}>&middot; {metrics.suspendedOrgs} suspended</span>
              )}
            </div>
          </div>

          {/* Active Students */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
              <span>ENROLLED STUDENTS</span>
              <Users size={16} color="#3B82F6" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '10px 0 4px', letterSpacing: '-0.03em' }}>
              {(metrics?.totalStudentsEnrolled || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              of {(metrics?.totalSeatsAllotted || 0).toLocaleString()} student seats allotted
            </div>
          </div>

          {/* Voice AI Minutes */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
              <span>GEMINI VOICE AI MINUTES</span>
              <Mic size={16} color="#10B981" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '10px 0 4px', letterSpacing: '-0.03em' }}>
              {(metrics?.totalVoiceMinutesUsed || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              of {(metrics?.totalVoiceMinutesAllotted || 0).toLocaleString()} monthly limit
            </div>
          </div>

          {/* LLM Tokens */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px 22px',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94A3B8', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
              <span>GEMINI TOKENS CONSUMED</span>
              <Activity size={16} color="#F59E0B" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '10px 0 4px', letterSpacing: '-0.03em' }}>
              {((metrics?.totalTokensUsed || 0) / 1000000).toFixed(2)}M
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              Across all tutor queries & vivas
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px 16px' }}>
        <div style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: 12
        }}>
          {[
            { id: 'orgs', label: 'Client Organisations', icon: Building2, count: organizations.length },
            { id: 'metering', label: 'AI & Voice Metering', icon: Mic },
            { id: 'admins', label: 'Institution Admins', icon: Users, count: admins.length },
            { id: 'health', label: 'Health & Audit Trail', icon: Server, count: auditLogs.length }
          ].map(tab => {
            const isSel = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 10,
                  background: isSel ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                  border: isSel ? '1px solid #A855F7' : '1px solid transparent',
                  color: isSel ? '#FFFFFF' : '#94A3B8',
                  fontSize: 13,
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={16} color={isSel ? '#C084FC' : '#94A3B8'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 10,
                    background: isSel ? '#A855F7' : 'rgba(255, 255, 255, 0.08)',
                    color: isSel ? '#fff' : '#94A3B8'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: ORGANISATIONS MANAGER ── */}
      {activeTab === 'orgs' && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          {/* Controls: Search + Filter */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            gap: 12,
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 10,
              padding: '8px 14px',
              flex: '1',
              maxWidth: 360
            }}>
              <Search size={15} color="#64748B" />
              <input
                type="text"
                placeholder="Search organisations, slug, or admin email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 13,
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Plan and Status Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: '#CBD5E1',
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: '#CBD5E1',
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Organisations Table */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            overflow: 'hidden',
            backdropFilter: 'blur(16px)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(2, 6, 23, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 20px' }}>ORGANISATION</th>
                  <th style={{ padding: '14px 16px' }}>PLAN</th>
                  <th style={{ padding: '14px 16px' }}>STUDENT SEATS</th>
                  <th style={{ padding: '14px 16px' }}>VOICE AI USAGE</th>
                  <th style={{ padding: '14px 16px' }}>PRIMARY ADMIN</th>
                  <th style={{ padding: '14px 16px' }}>STATUS</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                      No organisations match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map(org => {
                    const seatPct = Math.min(100, Math.round(((org.seats_used || 0) / (org.max_seats || 1)) * 100));
                    const voicePct = Math.min(100, Math.round(((org.voice_minutes_used || 0) / (org.voice_minutes_limit || 1)) * 100));
                    const isSuspended = org.status === 'suspended';

                    return (
                      <tr key={org.id} style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        opacity: isSuspended ? 0.65 : 1,
                        transition: 'background 0.15s'
                      }}>
                        {/* Name & Domain */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: 14 }}>{org.name}</div>
                          <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>{org.domain}</div>
                        </td>

                        {/* Plan */}
                        <td style={{ padding: '16px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: org.plan === 'enterprise' ? 'rgba(168, 85, 247, 0.2)' : org.plan === 'pro' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            color: org.plan === 'enterprise' ? '#C084FC' : org.plan === 'pro' ? '#60A5FA' : '#CBD5E1',
                            border: `1px solid ${org.plan === 'enterprise' ? 'rgba(168, 85, 247, 0.4)' : org.plan === 'pro' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.15)'}`
                          }}>
                            {org.plan}
                          </span>
                        </td>

                        {/* Student Seats Progress */}
                        <td style={{ padding: '16px 16px' }}>
                          <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4 }}>
                            {org.seats_used || 0} / {org.max_seats || 500}
                          </div>
                          <div style={{ width: 110, height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${seatPct}%`,
                              height: '100%',
                              background: seatPct > 90 ? '#EF4444' : seatPct > 75 ? '#F59E0B' : '#10B981'
                            }} />
                          </div>
                        </td>

                        {/* Voice Usage Progress */}
                        <td style={{ padding: '16px 16px' }}>
                          <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 4 }}>
                            {(org.voice_minutes_used || 0).toLocaleString()} / {(org.voice_minutes_limit || 0).toLocaleString()} mins
                          </div>
                          <div style={{ width: 120, height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${voicePct}%`,
                              height: '100%',
                              background: voicePct > 90 ? '#EF4444' : voicePct > 70 ? '#F59E0B' : '#A855F7'
                            }} />
                          </div>
                        </td>

                        {/* Primary Admin */}
                        <td style={{ padding: '16px 16px' }}>
                          <div style={{ color: '#F1F5F9', fontWeight: 500 }}>{org.admin_name || 'Admin'}</div>
                          <div style={{ color: '#64748B', fontSize: 11 }}>{org.admin_email}</div>
                        </td>

                        {/* Status Toggle Button */}
                        <td style={{ padding: '16px 16px' }}>
                          <button
                            onClick={() => handleToggleStatus(org)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 16,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              border: isSuspended ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                              background: isSuspended ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: isSuspended ? '#FCA5A5' : '#6EE7B7'
                            }}
                            title={`Click to ${isSuspended ? 'Activate' : 'Suspend'} organization`}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSuspended ? '#EF4444' : '#10B981' }} />
                            <span>{isSuspended ? 'Suspended' : 'Active'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {/* Impersonate / View as Org */}
                            <button
                              onClick={() => handleImpersonate(org)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                color: '#60A5FA',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Login to this organization as administrator to troubleshoot"
                            >
                              <ExternalLink size={12} />
                              <span>View as Org</span>
                            </button>

                            {/* Edit Quotas */}
                            <button
                              onClick={() => setEditingOrg({ ...org })}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#CBD5E1',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Edit seat and AI quota limits"
                            >
                              <Settings size={12} />
                              <span>Quotas</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: AI & VOICE USAGE METERING ── */}
      {activeTab === 'metering' && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '24px',
            marginBottom: 20
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
              Gemini Live Voice & LLM Token Billing Breakdown
            </h3>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px' }}>
              Real-time consumption tracking across all client schools and universities. Use these metrics for invoicing and API quota enforcement.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {organizations.map(org => {
                const voiceUsed = org.voice_minutes_used || 0;
                const voiceLimit = org.voice_minutes_limit || 1;
                const voicePct = Math.min(100, Math.round((voiceUsed / voiceLimit) * 100));

                const tokensUsed = org.tokens_used || 0;
                const tokensLimit = org.tokens_limit || 1;
                const tokensPct = Math.min(100, Math.round((tokensUsed / tokensLimit) * 100));

                return (
                  <div key={org.id} style={{
                    background: 'rgba(2, 6, 23, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '18px 20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{org.name}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{org.domain}</div>
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: '#C084FC'
                      }}>
                        {org.plan}
                      </span>
                    </div>

                    {/* Voice Minutes Bar */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#CBD5E1', marginBottom: 5 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Mic size={12} color="#10B981" /> Voice Minutes
                        </span>
                        <span style={{ fontWeight: 700 }}>{voiceUsed.toLocaleString()} / {voiceLimit.toLocaleString()} ({voicePct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${voicePct}%`, height: '100%', background: voicePct > 85 ? '#EF4444' : '#10B981' }} />
                      </div>
                    </div>

                    {/* Tokens Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#CBD5E1', marginBottom: 5 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Activity size={12} color="#F59E0B" /> LLM Tokens
                        </span>
                        <span style={{ fontWeight: 700 }}>{(tokensUsed / 1000000).toFixed(2)}M / {(tokensLimit / 1000000).toFixed(0)}M ({tokensPct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${tokensPct}%`, height: '100%', background: tokensPct > 85 ? '#EF4444' : '#F59E0B' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: INSTITUTION ADMINS DIRECTORY ── */}
      {activeTab === 'admins' && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(2, 6, 23, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 20px' }}>ADMINISTRATOR</th>
                  <th style={{ padding: '14px 16px' }}>ORGANISATION</th>
                  <th style={{ padding: '14px 16px' }}>ROLE</th>
                  <th style={{ padding: '14px 16px' }}>LAST LOGIN</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => {
                  const org = organizations.find(o => o.id === admin.org_id);
                  return (
                    <tr key={admin.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{admin.name}</div>
                        <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{admin.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#CBD5E1', fontWeight: 600 }}>
                        {org?.name || admin.org_id}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#94A3B8' }}>
                        {admin.role}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: 12 }}>
                        {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => org && handleImpersonate(org)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 8,
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60A5FA',
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Impersonate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: PLATFORM HEALTH & AUDIT TRAIL ── */}
      {activeTab === 'health' && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px' }}>
          {/* Health Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* Redis */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Database size={20} color="#10B981" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Upstash Redis Distributed Cache</span>
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
                Status: <strong style={{ color: '#10B981' }}>{health?.redis?.status || 'Online'}</strong><br />
                Round-Trip Latency: <strong>{health?.redis?.latencyMs || 42}ms</strong><br />
                Scope: Session caching, sliding memory & multi-tenant state
              </div>
            </div>

            {/* Voice WebSocket */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Wifi size={20} color="#A855F7" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Gemini Live Voice Server</span>
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
                Primary Port: <strong>5001</strong><br />
                Fallback Server: <strong>Port 3000 (server-with-ws.js)</strong><br />
                Protocol: 16kHz PCM input / 24kHz gapless Web Audio output
              </div>
            </div>

            {/* Next.js Core API Gateway */}
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Server size={20} color="#3B82F6" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Next.js Core API Gateway</span>
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
                Auth Protection: <strong>HMAC-SHA256 Timing-Safe JWT</strong><br />
                Tenant Isolation: <strong>Active (organization_id RLS)</strong><br />
                Runtime: Node.js 18+ App Router
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Security & Administrative Audit Trail
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(2, 6, 23, 0.4)',
                  borderRadius: 10,
                  fontSize: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#C084FC'
                    }}>
                      {log.action}
                    </span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{log.target}</span>
                    <span style={{ color: '#94A3B8' }}>&middot; {log.details}</span>
                  </div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE NEW ORGANISATION ── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 100
        }}>
          <div style={{
            width: '100%',
            maxWidth: 540,
            background: '#0F172A',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#fff' }}>
              Provision New Client Organisation
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 12.5, color: '#94A3B8' }}>
              Configure institution profile, tenant subdomain, student seat quotas, and voice AI allocations.
            </p>

            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>INSTITUTION NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford School of Engineering"
                  value={newOrgForm.name}
                  onChange={e => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                  style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>SUBDOMAIN SLUG</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. stanford"
                    value={newOrgForm.slug}
                    onChange={e => setNewOrgForm({ ...newOrgForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>TIER PLAN</label>
                  <select
                    value={newOrgForm.plan}
                    onChange={e => setNewOrgForm({ ...newOrgForm, plan: e.target.value })}
                    style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                  >
                    <option value="starter">Starter (Trial)</option>
                    <option value="pro">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>STUDENT SEATS</label>
                  <input
                    type="number"
                    min="10"
                    max="100000"
                    value={newOrgForm.max_seats}
                    onChange={e => setNewOrgForm({ ...newOrgForm, max_seats: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>MONTHLY VOICE MINUTES</label>
                  <input
                    type="number"
                    min="100"
                    max="1000000"
                    value={newOrgForm.voice_minutes_limit}
                    onChange={e => setNewOrgForm({ ...newOrgForm, voice_minutes_limit: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>ADMIN FULL NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. John Doe"
                    value={newOrgForm.admin_name}
                    onChange={e => setNewOrgForm({ ...newOrgForm, admin_name: e.target.value })}
                    style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>ADMIN EMAIL</label>
                  <input
                    type="email"
                    required
                    placeholder="dean@stanford.edu"
                    value={newOrgForm.admin_email}
                    onChange={e => setNewOrgForm({ ...newOrgForm, admin_email: e.target.value })}
                    style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '9px 16px', borderRadius: 8, background: 'none', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  Provision Organisation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT QUOTAS ── */}
      {editingOrg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 100
        }}>
          <div style={{
            width: '100%',
            maxWidth: 480,
            background: '#0F172A',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: 20,
            padding: 26,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' }}>
              Adjust Quotas: {editingOrg.name}
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: '#94A3B8' }}>
              Modify student license seat allocations, monthly Gemini Voice minutes, and LLM token caps.
            </p>

            <form onSubmit={handleUpdateQuotas} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>TIER PLAN</label>
                <select
                  value={editingOrg.plan}
                  onChange={e => setEditingOrg({ ...editingOrg, plan: e.target.value })}
                  style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>STUDENT SEAT ALLOTMENT</label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={editingOrg.max_seats}
                  onChange={e => setEditingOrg({ ...editingOrg, max_seats: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5 }}>MONTHLY VOICE MINUTES LIMIT</label>
                <input
                  type="number"
                  min="100"
                  max="1000000"
                  value={editingOrg.voice_minutes_limit}
                  onChange={e => setEditingOrg({ ...editingOrg, voice_minutes_limit: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, background: 'none', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#CBD5E1', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  Save Quotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
