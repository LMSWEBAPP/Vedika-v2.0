'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { T } from '@/lib/lms-data';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('superadmin@vedika.ai');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      if (data.token) {
        localStorage.setItem('super_admin_jwt', data.token);
        localStorage.setItem('super_admin_user', JSON.stringify(data.user));
      }

      router.replace('/super-admin');
    } catch (err) {
      setError(err.message || 'Invalid Super Administrator credentials.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 20%, #1e1136 0%, #080c16 70%, #03060c 100%)',
      fontFamily: 'var(--font-outfit), "Segoe UI", sans-serif',
      color: '#F8FAFC',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: 380,
        height: 380,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      {/* Main card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        borderRadius: 24,
        padding: '36px 32px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(168, 85, 247, 0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
          }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#C084FC',
              textTransform: 'uppercase',
              background: 'rgba(168, 85, 247, 0.15)',
              padding: '2px 8px',
              borderRadius: 6,
              marginBottom: 2
            }}>
              <Sparkles size={11} /> PLATFORM GOVERNANCE
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
              Super Admin Console
            </h1>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 24px', lineHeight: 1.5 }}>
          Centralized SaaS administration, multi-tenant organization provisioning, and AI metering gateway.
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            fontSize: 12.5,
            marginBottom: 20
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, letterSpacing: '0.04em' }}>
              ADMINISTRATOR EMAIL
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 12,
              padding: '10px 14px'
            }}>
              <Mail size={16} color="#64748B" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="superadmin@vedika.ai"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#F8FAFC',
                  fontSize: 13.5,
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 6, letterSpacing: '0.04em' }}>
              MASTER SECURITY KEY / PASSWORD
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(2, 6, 23, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 12,
              padding: '10px 14px'
            }}>
              <Lock size={16} color="#64748B" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter Super Admin password"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#F8FAFC',
                  fontSize: 13.5,
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: 2
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Quick Demo Credential Helper Chip */}
          <div
            onClick={() => {
              setEmail('superadmin@vedika.ai');
              setPassword('VedikaSuperAdmin2026!');
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px dashed rgba(168, 85, 247, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s'
            }}
            title="Click to fill default development credentials"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#C084FC' }}>
              <KeyRound size={13} />
              <span>Use Default Credentials</span>
            </div>
            <span style={{ fontSize: 10, color: '#94A3B8' }}>VedikaSuperAdmin2026!</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: '12px',
              borderRadius: 12,
              background: loading ? '#64748B' : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 18px rgba(168, 85, 247, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Enter Super Admin Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            &larr; Return to Student Portal
          </button>
        </div>
      </div>
    </div>
  );
}
