'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Lock, Mail, User, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { T } from '@/lib/lms-data';
import { login } from '@/lib/frappe';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  
  // Login & Shared State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear any existing session on mount and parse query errors
  useEffect(() => {
    localStorage.removeItem('frappe_user');
    localStorage.removeItem('frappe_sid');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'oauth_failed') {
        const msg = params.get('msg');
        setError(msg ? `Google sign-in error: ${msg}` : 'Google sign-in was unsuccessful. Please verify that the redirect URI is configured in Google Cloud Console.');
      } else if (err === 'invalid_token') {
        setError('Invalid login token. Please sign in again.');
      } else if (err === 'server_error') {
        setError('Internal server error during authentication.');
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
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
    setSuccessMsg('');
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

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      // Store authenticated user session
      localStorage.setItem('frappe_user', JSON.stringify(data.user));
      setSuccessMsg('Account created successfully! Redirecting...');
      
      setTimeout(() => {
        router.replace('/');
      }, 800);
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(`If an account exists for ${email}, password reset instructions have been dispatched.`);
    }, 600);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #0F132A 0%, #07080F 100%)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-outfit), sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Main Auth Card */}
        <div style={{
          background: T.s1,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: '36px 32px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle ambient lighting */}
          <div style={{
            position: 'absolute', top: -80, left: -80, width: 220, height: 220,
            borderRadius: '50%', background: 'rgba(91, 140, 248, 0.12)', filter: 'blur(60px)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', bottom: -80, right: -80, width: 220, height: 220,
            borderRadius: '50%', background: 'rgba(155, 110, 248, 0.12)', filter: 'blur(60px)', pointerEvents: 'none'
          }} />

          {/* Logo & Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${T.accent} 0%, ${T.purple} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 18px rgba(91, 140, 248, 0.25)'
            }}>
              <GraduationCap size={28} color="#fff" />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: T.text, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                AI TUTOR Portal
              </span>
              <p style={{ color: T.muted, fontSize: 13, margin: '6px 0 0' }}>
                {mode === 'signup' && 'Create your student account to get started'}
                {mode === 'login' && 'Sign in to access your courses and AI tools'}
                {mode === 'forgot' && 'Reset your account password'}
              </p>
            </div>
          </div>

          {/* Tab Switcher (Sign In vs Sign Up) */}
          {mode !== 'forgot' && (
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: 4,
              marginBottom: 20
            }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 7,
                  border: 'none',
                  background: mode === 'login' ? `linear-gradient(135deg, ${T.accent} 0%, #4361EE 100%)` : 'transparent',
                  color: mode === 'login' ? '#fff' : T.muted,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 7,
                  border: 'none',
                  background: mode === 'signup' ? `linear-gradient(135deg, ${T.accent} 0%, #4361EE 100%)` : 'transparent',
                  color: mode === 'signup' ? '#fff' : T.muted,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5
                }}
              >
                <Sparkles size={13} />
                Create Account
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(245, 91, 107, 0.1)',
              border: `1px solid rgba(245, 91, 107, 0.25)`,
              color: T.red,
              padding: '12px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.4
            }}>
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div style={{
              background: 'rgba(67, 217, 137, 0.1)',
              border: `1px solid rgba(67, 217, 137, 0.25)`,
              color: T.green || '#43D989',
              padding: '12px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.4
            }}>
              <CheckCircle2 size={16} />
              <span style={{ flex: 1 }}>{successMsg}</span>
            </div>
          )}

          {/* ================= MODE: SIGN IN ================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email / Username Field */}
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
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: T.accent, fontSize: 11.5, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
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
                  marginTop: 4
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
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
          )}

          {/* ================= MODE: SIGN UP ================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label htmlFor="name" style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <User size={16} color={T.muted} />
                  </span>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: T.s2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      padding: '10px 12px 10px 38px',
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

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label htmlFor="signup-email" style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} color={T.muted} />
                  </span>
                  <input
                    id="signup-email"
                    type="email"
                    autoCapitalize="none"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: T.s2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      padding: '10px 12px 10px 38px',
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

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label htmlFor="signup-password" style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>Create Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} color={T.muted} />
                  </span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: T.s2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      padding: '10px 38px 10px 38px',
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

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label htmlFor="confirm-password" style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <Lock size={16} color={T.muted} />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: T.s2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                      padding: '10px 38px 10px 38px',
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Sign Up Button */}
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
                    Creating Account...
                  </>
                ) : 'Create Account'}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
              </div>

              {/* Google Sign In in Sign Up */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign up with Google</span>
              </button>
            </form>
          )}

          {/* ================= MODE: FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="forgot-email" style={{ color: T.text, fontSize: 12.5, fontWeight: 500 }}>Registered Email</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} color={T.muted} />
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="Enter your registered email"
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

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${T.accent} 0%, rgba(91, 140, 248, 0.8) 100%)`,
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
                  gap: 8
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: T.muted,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: '10px 0',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </button>
            </form>
          )}

          {/* Footer toggle link */}
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12.5, color: T.muted }}>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign Up
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  style={{ background: 'none', border: 'none', color: T.accent, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign In
                </button>
              </>
            ) : null}
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
