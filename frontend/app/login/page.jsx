'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, ArrowLeft, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { login } from '@/lib/frappe';
import './login.css';

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

  // Active focused input for glowing gradient animation
  const [focusedField, setFocusedField] = useState('');

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

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setFocusedField('');
  };

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
      const isSuperAdmin = Boolean(
        (user.role || '').toLowerCase() === 'super_admin' ||
        (user.role || '').toLowerCase() === 'superadmin' ||
        Boolean(user.is_super_admin) ||
        (user.email || '').toLowerCase() === 'superadmin@vedika.ai'
      );
      const isAdmin = Boolean(
        isSuperAdmin ||
        (user.role || '').toLowerCase() === 'administrator' ||
        (user.role || '').toLowerCase() === 'admin' ||
        (user.role || '').toLowerCase() === 'system manager' ||
        (user.email || '').toLowerCase() === 'admin@lms.com' ||
        (user.username || '').toLowerCase() === 'administrator' ||
        (user.username || '').toLowerCase() === 'admin' ||
        (user.email || '').toLowerCase().startsWith('admin@')
      );

      if (isSuperAdmin) {
        user.role = 'super_admin';
        user.is_super_admin = true;
      } else if (isAdmin) {
        user.role = 'Administrator';
      }

      localStorage.setItem('frappe_user', JSON.stringify(user));
      if (user.token) {
        localStorage.setItem('token', user.token);
        localStorage.setItem('jwt', user.token);
      }

      if (isSuperAdmin) {
        router.replace('/super-admin');
      } else if (isAdmin) {
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
    <div className="login-page-root">
      {/* Background ambient lighting */}
      <div className="login-bg-glow-1" />
      <div className="login-bg-glow-2" />

      {/* Header with Brand Badge & Switchers */}
      <header className="login-header-section">
        <div className="brand-badge">
          <div className="brand-icon-box">
            <GraduationCap size={15} />
          </div>
          <span>VEDIKA AI TUTOR</span>
        </div>

        {mode !== 'forgot' && (
          <nav className="switchers-container" aria-label="Authentication mode selection">
            <button
              type="button"
              className={`switcher-btn ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Login
              <span className="switcher-underline" />
            </button>
            <button
              type="button"
              className={`switcher-btn ${mode === 'signup' ? 'is-active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
              <span className="switcher-underline" />
            </button>
          </nav>
        )}
      </header>

      {/* Overlapping Cards Container (Codepen 1 structure + Codepen 2 content) */}
      <main className="cards-deck-container">
        {mode !== 'forgot' ? (
          <>
            {/* LOGIN CARD */}
            <article
              className={`split-card ${mode === 'login' ? 'active-card' : 'inactive-login'}`}
              onClick={() => {
                if (mode !== 'login') switchMode('login');
              }}
            >
              {/* Left Pane (Codepen 2 clean high-contrast block) */}
              <div className="card-left-pane">
                <div>
                  <h1 className="card-title">Login</h1>
                  <p className="card-eula">
                    Sign in to access your interactive AI tutor, adaptive courses, and personalized code execution workspace.
                  </p>
                </div>
                <div className="card-left-footer">
                  Don't have an account?
                  <button
                    type="button"
                    className="card-left-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      switchMode('signup');
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Right Pane (Codepen 2 dark slate block with neon line animations) */}
              <div className="card-right-pane">
                {mode === 'login' && error && (
                  <div className="card-alert-error" role="alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                {mode === 'login' && successMsg && (
                  <div className="card-alert-success" role="status">
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} noValidate>
                  {/* Email or Username */}
                  <div className={`input-group ${focusedField === 'login-email' ? 'is-focused' : ''}`}>
                    <div className="input-label-row">
                      <label htmlFor="login-email" className="input-label">Email or Username</label>
                    </div>
                    <div className="input-wrapper">
                      <input
                        id="login-email"
                        name="email"
                        type="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="card-input"
                        placeholder="Enter your email or username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('login-email')}
                        onBlur={() => setFocusedField('')}
                        required
                        disabled={mode !== 'login'}
                      />
                      <span className="input-base-line" />
                      <span className="input-focus-line" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className={`input-group ${focusedField === 'login-password' ? 'is-focused' : ''}`}>
                    <div className="input-label-row">
                      <label htmlFor="login-password" className="input-label">Password</label>
                      <button
                        type="button"
                        className="forgot-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          switchMode('forgot');
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="input-wrapper">
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className="card-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('login-password')}
                        onBlur={() => setFocusedField('')}
                        required
                        disabled={mode !== 'login'}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="pwd-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPassword(!showPassword);
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <span className="input-base-line" />
                      <span className="input-focus-line" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-submit-action"
                    disabled={loading || mode !== 'login'}
                  >
                    {loading && mode === 'login' ? (
                      <>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff', animation: 'spin 1s linear infinite'
                        }} />
                        Signing In...
                      </>
                    ) : 'Sign In'}
                  </button>

                  {/* Divider */}
                  <div className="auth-divider">
                    <span className="divider-line" />
                    <span className="divider-text">or</span>
                    <span className="divider-line" />
                  </div>

                  {/* Google Login */}
                  <button
                    type="button"
                    className="btn-google-auth"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoogleLogin();
                    }}
                    disabled={mode !== 'login'}
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
              </div>
            </article>

            {/* SIGN UP CARD */}
            <article
              className={`split-card ${mode === 'signup' ? 'active-card' : 'inactive-signup'}`}
              onClick={() => {
                if (mode !== 'signup') switchMode('signup');
              }}
            >
              {/* Left Pane (Codepen 2 clean high-contrast block) */}
              <div className="card-left-pane">
                <div>
                  <h1 className="card-title">Sign Up</h1>
                  <p className="card-eula">
                    Create your student account to unlock real-time AI reasoning, interactive coding labs, and adaptive concept mastery.
                  </p>
                </div>
                <div className="card-left-footer">
                  Already have an account?
                  <button
                    type="button"
                    className="card-left-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      switchMode('login');
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Right Pane (Codepen 2 dark slate block with neon line animations) */}
              <div className="card-right-pane">
                {mode === 'signup' && error && (
                  <div className="card-alert-error" role="alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                {mode === 'signup' && successMsg && (
                  <div className="card-alert-success" role="status">
                    <CheckCircle2 size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSignup} noValidate>
                  {/* Full Name */}
                  <div className={`input-group ${focusedField === 'signup-name' ? 'is-focused' : ''}`}>
                    <div className="input-label-row">
                      <label htmlFor="signup-name" className="input-label">Full Name</label>
                    </div>
                    <div className="input-wrapper">
                      <input
                        id="signup-name"
                        name="name"
                        type="text"
                        className="card-input"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onFocus={() => setFocusedField('signup-name')}
                        onBlur={() => setFocusedField('')}
                        required
                        disabled={mode !== 'signup'}
                      />
                      <span className="input-base-line" />
                      <span className="input-focus-line" />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className={`input-group ${focusedField === 'signup-email' ? 'is-focused' : ''}`}>
                    <div className="input-label-row">
                      <label htmlFor="signup-email" className="input-label">Email Address</label>
                    </div>
                    <div className="input-wrapper">
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        autoCapitalize="none"
                        className="card-input"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('signup-email')}
                        onBlur={() => setFocusedField('')}
                        required
                        disabled={mode !== 'signup'}
                      />
                      <span className="input-base-line" />
                      <span className="input-focus-line" />
                    </div>
                  </div>

                  {/* Create Password */}
                  <div className={`input-group ${focusedField === 'signup-password' ? 'is-focused' : ''}`}>
                    <div className="input-label-row">
                      <label htmlFor="signup-password" className="input-label">Create Password</label>
                    </div>
                    <div className="input-wrapper">
                      <input
                        id="signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className="card-input"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('signup-password')}
                        onBlur={() => setFocusedField('')}
                        required
                        disabled={mode !== 'signup'}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="pwd-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPassword(!showPassword);
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <span className="input-base-line" />
                      <span className="input-focus-line" />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className={`input-group ${focusedField === 'signup-confirm' ? 'is-focused' : ''}`}>
                    <div className="input-label-row">
                      <label htmlFor="signup-confirm" className="input-label">Confirm Password</label>
                    </div>
                    <div className="input-wrapper">
                      <input
                        id="signup-confirm"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="card-input"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('signup-confirm')}
                        onBlur={() => setFocusedField('')}
                        required
                        disabled={mode !== 'signup'}
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="pwd-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <span className="input-base-line" />
                      <span className="input-focus-line" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-submit-action"
                    disabled={loading || mode !== 'signup'}
                  >
                    {loading && mode === 'signup' ? (
                      <>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff', animation: 'spin 1s linear infinite'
                        }} />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Create Account
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="auth-divider">
                    <span className="divider-line" />
                    <span className="divider-text">or</span>
                    <span className="divider-line" />
                  </div>

                  {/* Google Sign Up */}
                  <button
                    type="button"
                    className="btn-google-auth"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoogleLogin();
                    }}
                    disabled={mode !== 'signup'}
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
              </div>
            </article>
          </>
        ) : (
          /* FORGOT PASSWORD CARD */
          <article className="split-card active-card">
            <div className="card-left-pane">
              <div>
                <h1 className="card-title">Reset Password</h1>
                <p className="card-eula">
                  Enter your registered email address and we'll send you recovery instructions to regain access to your student account.
                </p>
              </div>
              <div className="card-left-footer">
                <button
                  type="button"
                  className="card-left-link"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}
                  onClick={() => switchMode('login')}
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>
              </div>
            </div>

            <div className="card-right-pane">
              {error && (
                <div className="card-alert-error" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="card-alert-success" role="status">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} noValidate>
                <div className={`input-group ${focusedField === 'forgot-email' ? 'is-focused' : ''}`}>
                  <div className="input-label-row">
                    <label htmlFor="forgot-email" className="input-label">Registered Email</label>
                  </div>
                  <div className="input-wrapper">
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      className="card-input"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('forgot-email')}
                      onBlur={() => setFocusedField('')}
                      required
                    />
                    <span className="input-base-line" />
                    <span className="input-focus-line" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-submit-action"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </button>

                <button
                  type="button"
                  className="btn-google-auth"
                  style={{ marginTop: 14 }}
                  onClick={() => switchMode('login')}
                >
                  <ArrowLeft size={15} />
                  <span>Return to Sign In</span>
                </button>
              </form>
            </div>
          </article>
        )}
      </main>

      {/* Footer copyright */}
      <footer style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', zIndex: 10 }}>
        © 2026 Vedika AI TUTOR Platform. All rights reserved.
      </footer>
    </div>
  );
}
