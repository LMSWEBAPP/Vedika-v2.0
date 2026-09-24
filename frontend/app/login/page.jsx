'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react';
import { T } from '@/lib/lms-data';
import { login } from '@/lib/frappe';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear any existing session on mount and parse query errors
  useEffect(() => {
    localStorage.removeItem('frappe_user');
    localStorage.removeItem('frappe_sid');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'oauth_failed') {
        setError('Google sign-in was unsuccessful. Please try again.');
      } else if (err === 'invalid_token') {
        setError('Invalid login token. Please sign in again.');
      } else if (err === 'server_error') {
        setError('Internal server error during authentication.');
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const res = await fetch(`/api/auth/google?redirect_to=${encodeURIComponent(redirectUrl)}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to initialize Google Sign-in.');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Could not initiate Google Sign-in. Please try again.');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      const isAdmin = Boolean(
        (user.role || '').toLowerCase() === 'administrator' ||
        (user.role || '').toLowerCase() === 'admin' ||
        (user.role || '').toLowerCase() === 'system manager' ||
        (user.email || '').toLowerCase() === 'admin@lms.com' ||
        (user.username || '').toLowerCase() === 'administrator' ||
        (user.username || '').toLowerCase() === 'admin'
      );
      if (isAdmin) {
        user.role = 'Administrator';
      }
      localStorage.setItem('frappe_user', JSON.stringify(user));
      if (isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0F132A 0%, #07080F 100%)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'var(--font-outfit), sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: 450, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Main login card */}
        <div style={{
          background: T.s1,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: '40px 32px 32px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative subtle ambient lights */}
          <div style={{
            position: 'absolute', top: -100, left: -100, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(91, 140, 248, 0.1)', filter: 'blur(50px)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', bottom: -100, right: -100, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(155, 110, 248, 0.1)', filter: 'blur(50px)', pointerEvents: 'none'
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${T.accent} 0%, ${T.purple} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(91, 140, 248, 0.2)'
            }}>
              <GraduationCap size={28} color="#fff" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: T.text, fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>AI TUTOR Portal</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <h2 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Welcome Back</h2>
              <p style={{ color: T.muted, fontSize: 13, margin: '6px 0 0' }}>Sign in to continue</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(245, 91, 107, 0.1)',
              border: `1px solid rgba(245, 91, 107, 0.25)`,
              color: T.red,
              padding: '12px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>Email or Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} color={T.muted} />
                </span>
                <input
                  id="email"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: T.s2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: '11px 12px 11px 38px',
                    color: T.text,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.accent}
                  onBlur={(e) => e.target.style.borderColor = T.border}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>Password</label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset is not configured for this demo.'); }} style={{ color: T.accent, fontSize: 11.5, textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} color={T.muted} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: T.s2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: '11px 38px 11px 38px',
                    color: T.text,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.accent}
                  onBlur={(e) => e.target.style.borderColor = T.border}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.muted,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? T.dim : `linear-gradient(135deg, ${T.accent} 0%, rgba(91, 140, 248, 0.8) 100%)`,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 0',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(91, 140, 248, 0.15)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#fff', animation: 'spin 1s linear infinite'
                  }} />
                  Signing In...
                </>
              ) : 'Sign In'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.04)',
                color: T.text,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '11px 0',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = T.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Footer links */}
          <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12.5, color: T.muted }}>
            Don't have an account?{' '}
            <a href="#signup" onClick={(e) => { e.preventDefault(); alert('Registration is not configured for this demo.'); }} style={{ color: T.accent, textDecoration: 'none', fontWeight: 500 }}>
              Sign Up
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', fontSize: 11.5, color: T.dim }}>
          © 2026 AI TUTOR Platform. All rights reserved.
        </div>

      </div>
    </div>
  );
}
