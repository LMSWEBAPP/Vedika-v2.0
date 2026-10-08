'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.css';
import {
  ArrowRight, ChevronDown, BookOpen, Award, FileText,
  FolderOpen, Menu, X, Brain, FlaskConical, Briefcase, BarChart3,
  Home as HomeIcon, LayoutDashboard, LogOut, User as UserIcon, Sparkles, ShieldCheck
} from 'lucide-react';
import { HairlineNavIcon } from '@/components/hairline';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const [user, setUser] = useState(null);

  const coursesDropdownTimer = useRef(null);
  const profileRef = useRef(null);

  const isAskVedika = pathname === '/general-tutor' || pathname === '/vedika-ai/ask' || pathname === '/coding-tutor' || pathname === '/vedika-ai/code';
  const [isTopNavVisible, setIsTopNavVisible] = useState(false);
  const hideTimerRef = useRef(null);

  const handleShowTopNav = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsTopNavVisible(true);
  }, []);

  const handleScheduleHideTopNav = useCallback(() => {
    if (coursesDropdownOpen || profileDropdownOpen || mobileMenuOpen) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsTopNavVisible(false);
    }, 850);
  }, [coursesDropdownOpen, profileDropdownOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!isAskVedika) return;
    const handleMouseMove = (e) => {
      if (e.clientY <= 55) {
        handleShowTopNav();
      } else if (e.clientY > 135 && !coursesDropdownOpen && !profileDropdownOpen && !mobileMenuOpen) {
        handleScheduleHideTopNav();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAskVedika, coursesDropdownOpen, profileDropdownOpen, mobileMenuOpen, handleShowTopNav, handleScheduleHideTopNav]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('frappe_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  // Close menus on route change or outside click
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileCoursesOpen(false);
    setCoursesDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCoursesMouseEnter = () => {
    if (coursesDropdownTimer.current) clearTimeout(coursesDropdownTimer.current);
    setCoursesDropdownOpen(true);
  };
  const handleCoursesMouseLeave = () => {
    if (coursesDropdownTimer.current) clearTimeout(coursesDropdownTimer.current);
    coursesDropdownTimer.current = setTimeout(() => {
      setCoursesDropdownOpen(false);
    }, 200);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_sid');
      setUser(null);
      setMobileMenuOpen(false);
      router.push('/login');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'V';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const courseSublinks = [
    { label: 'Explore Courses', desc: 'Browse catalog, syllabus & modules', path: '/courses', Icon: BookOpen, hairline: 'courses', color: '#38bdf8' },
    { label: 'Quizzes', desc: 'Test knowledge with domain quizzes', path: '/quizzes', Icon: Award, hairline: 'quizzes', color: '#a855f7' },
    { label: 'Assignments', desc: 'Hands-on projects & evaluations', path: '/assignments', Icon: FileText, hairline: 'assignments', color: '#00f298' },
    { label: 'Resource Hub', desc: 'Library, cheat sheets & DSA sheets', path: '/resources', Icon: FolderOpen, hairline: 'resources', color: '#ff9900' },
  ];

  const isCoursesActive = pathname.startsWith('/courses') || pathname.startsWith('/quizzes') || pathname.startsWith('/assignments') || pathname.startsWith('/resources') || pathname.startsWith('/lesson');
  const isAiActive = pathname.startsWith('/vedika-ai') || pathname === '/general-tutor' || pathname === '/coding-tutor' || pathname === '/code-puzzle' || pathname === '/viva-interview';
  const isLabsActive = pathname.startsWith('/vedika-labs') || pathname.startsWith('/labs');

  const navContent = (
    <div className={styles.container}>
      {/* Left Logo */}
        <button
          type="button"
          className={styles.logoWrap}
          onClick={() => { setMobileMenuOpen(false); router.push('/'); }}
          aria-label="Vedika AI Tutor Home"
        >
          <div className={styles.starIcon}>
            {/* 4-pointed glowing blue star matching the design */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z"
                fill="url(#starGradient)"
              />
              <defs>
                <linearGradient id="starGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa" />
                  <stop offset="0.5" stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className={isAskVedika ? styles.brandTextsOneLine : styles.brandTexts}>
            {isAskVedika ? (
              <span className={styles.brandTitleOneLine}>VEDIKA AI</span>
            ) : (
              <>
                <span className={styles.brandTitle}>VEDIKA</span>
                <span className={styles.brandSubtitle}>AI TUTOR</span>
              </>
            )}
          </div>
        </button>

        {/* Center Desktop Navigation Links */}
        <nav className={styles.navMenu} aria-label="Main navigation">
          {/* Courses (with Submenu) */}
          <div
            className={styles.navItemWrapper}
            onMouseEnter={handleCoursesMouseEnter}
            onMouseLeave={handleCoursesMouseLeave}
          >
            <button
              type="button"
              className={`${styles.navLink} ${isCoursesActive ? styles.activeNavLink : ''}`}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('selected_course_id');
                  window.dispatchEvent(new CustomEvent('reset_courses_view'));
                }
                router.push('/courses');
              }}
            >
              <span>Courses</span>
              <ChevronDown size={13} style={{ opacity: 0.7, transform: coursesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {coursesDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeading}>Curriculum & Resources</div>
                {courseSublinks.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setCoursesDropdownOpen(false);
                      if (item.path === '/courses' && typeof window !== 'undefined') {
                        localStorage.removeItem('selected_course_id');
                        window.dispatchEvent(new CustomEvent('reset_courses_view'));
                      }
                      router.push(item.path);
                    }}
                  >
                    <HairlineNavIcon
                      name={item.hairline}
                      size={18}
                      themeColor={item.color}
                      fallback={<item.Icon size={16} color={item.color} />}
                    />
                    <div className={styles.dropdownItemContent}>
                      <span className={styles.dropdownItemLabel}>{item.label}</span>
                      <span className={styles.dropdownItemDesc}>{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Vedika AI (Direct Link, No Dropdown) */}
          <button
            type="button"
            className={`${styles.navLink} ${isAiActive ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/vedika-ai')}
          >
            <span>Vedika AI</span>
          </button>

          {/* 5. Vedika Labs (Direct Link, No Dropdown) */}
          <button
            type="button"
            className={`${styles.navLink} ${isLabsActive ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/vedika-labs')}
          >
            <span>Vedika Labs</span>
          </button>

          {/* 6. Jobs */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname.startsWith('/jobs') ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/jobs')}
          >
            <span>Jobs</span>
          </button>

          {/* 7. Progress */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname.startsWith('/progress') ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/progress')}
          >
            <span>Progress</span>
          </button>
        </nav>

        {/* Right Action Items */}
        <div className={styles.rightActions}>

          {/* User state toggle: Logged In Capsule vs Guest "Get Started" */}
          {user ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={styles.profileCapsule}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                title="Account menu"
              >
                <div className={styles.userAvatar}>
                  {getInitials(user?.name || user?.full_name || 'User')}
                </div>
                <span className={styles.userName}>
                  {user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Student'}
                </span>
                <ChevronDown size={12} color="#94a3b8" />
              </button>

              {profileDropdownOpen && (
                <div className={styles.dropdownMenu} style={{ right: 0, left: 'auto', transform: 'none', width: 220 }}>
                  <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500, wordBreak: 'break-all' }}>
                      {user?.email || 'student@vedika.ai'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      router.push('/profile');
                    }}
                  >
                    <UserIcon size={15} color="#818cf8" />
                    <span className={styles.dropdownItemLabel}>My Profile</span>
                  </button>

                  {(user?.role === 'Administrator' || user?.role === 'super_admin' || user?.is_super_admin) && (
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        router.push('/admin');
                      }}
                    >
                      <LayoutDashboard size={15} color="#38bdf8" />
                      <span className={styles.dropdownItemLabel}>Admin Portal</span>
                    </button>
                  )}

                  {(user?.role === 'super_admin' || user?.is_super_admin) && (
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        router.push('/super-admin');
                      }}
                    >
                      <ShieldCheck size={15} color="#a855f7" />
                      <span className={styles.dropdownItemLabel}>Super Admin Console</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                    style={{ color: '#f87171' }}
                  >
                    <LogOut size={15} color="#f87171" />
                    <span className={styles.dropdownItemLabel} style={{ color: '#f87171' }}>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className={styles.getStartedBtn}
              onClick={() => router.push('/login')}
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </button>
          )}

          {/* Mobile menu toggle button */}
          <button
            type="button"
            className={styles.mobileToggleBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
  );

  const mobileDrawerContent = mobileMenuOpen && (
    <>
      {/* Semi-transparent backdrop - tap outside to close */}
      <div
        className={styles.mobileBackdrop}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Mobile Navigation">
        {/* 1. Courses with Dropdown Submenu (Same as Laptop View) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${isCoursesActive ? styles.mobileNavActive : ''}`}
            onClick={() => setMobileCoursesOpen(!mobileCoursesOpen)}
            style={{ justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={16} color="#38bdf8" />
              <span>Courses</span>
            </div>
            <ChevronDown
              size={15}
              style={{
                transform: mobileCoursesOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                color: '#94a3b8'
              }}
            />
          </button>

          {/* Collapsible Curriculum & Resources submenu */}
          {mobileCoursesOpen && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              padding: '6px 0 6px 10px',
              borderLeft: '2px solid rgba(56, 189, 248, 0.35)',
              marginLeft: 12,
              marginTop: 4,
              marginBottom: 4
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '2px 8px 4px'
              }}>
                Curriculum & Resources
              </div>
              {courseSublinks.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.path === '/courses' && typeof window !== 'undefined') {
                      localStorage.removeItem('selected_course_id');
                      window.dispatchEvent(new CustomEvent('reset_courses_view'));
                    }
                    router.push(item.path);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: pathname === item.path ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                    border: pathname === item.path ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: pathname === item.path ? '#38bdf8' : '#e2e8f0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <HairlineNavIcon
                    name={item.hairline}
                    size={17}
                    themeColor={item.color}
                    fallback={<item.Icon size={15} color={item.color} style={{ flexShrink: 0 }} />}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: 9.5, color: '#94a3b8' }}>{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Vedika AI */}
        <button
          type="button"
          className={`${styles.mobileNavLink} ${isAiActive ? styles.mobileNavActive : ''}`}
          onClick={() => { setMobileMenuOpen(false); router.push('/vedika-ai'); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Brain size={16} color="#c084fc" />
            <span>Vedika AI</span>
          </div>
        </button>

        {/* 3. Vedika Labs */}
        <button
          type="button"
          className={`${styles.mobileNavLink} ${isLabsActive ? styles.mobileNavActive : ''}`}
          onClick={() => { setMobileMenuOpen(false); router.push('/vedika-labs'); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FlaskConical size={16} color="#38bdf8" />
            <span>Vedika Labs</span>
          </div>
        </button>

        {/* 4. Jobs */}
        <button
          type="button"
          className={`${styles.mobileNavLink} ${pathname.startsWith('/jobs') ? styles.mobileNavActive : ''}`}
          onClick={() => { setMobileMenuOpen(false); router.push('/jobs'); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Briefcase size={16} color="#34d399" />
            <span>Jobs</span>
          </div>
        </button>

        {/* 5. Progress */}
        <button
          type="button"
          className={`${styles.mobileNavLink} ${pathname.startsWith('/progress') ? styles.mobileNavActive : ''}`}
          onClick={() => { setMobileMenuOpen(false); router.push('/progress'); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={16} color="#f59e0b" />
            <span>Progress</span>
          </div>
        </button>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ padding: '2px 8px', fontSize: 11.5, color: '#94a3b8' }}>
              Signed in as <strong style={{ color: '#ffffff' }}>{user?.name || user?.email}</strong>
            </div>
            <button
              type="button"
              className={styles.mobileNavLink}
              onClick={() => { setMobileMenuOpen(false); router.push('/profile'); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserIcon size={15} color="#818cf8" />
                <span>My Profile</span>
              </div>
            </button>
            {(user?.role === 'Administrator' || user?.role === 'super_admin' || user?.is_super_admin) && (
              <button
                type="button"
                className={styles.mobileNavLink}
                onClick={() => { setMobileMenuOpen(false); router.push('/admin'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <LayoutDashboard size={15} color="#38bdf8" />
                  <span>Admin Portal</span>
                </div>
              </button>
            )}
            {(user?.role === 'super_admin' || user?.is_super_admin) && (
              <button
                type="button"
                className={styles.mobileNavLink}
                onClick={() => { setMobileMenuOpen(false); router.push('/super-admin'); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={15} color="#a855f7" />
                  <span>Super Admin Console</span>
                </div>
              </button>
            )}
            <button
              type="button"
              className={styles.mobileNavLink}
              onClick={handleLogout}
              style={{ color: '#f87171' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LogOut size={15} color="#f87171" />
                <span style={{ color: '#f87171' }}>Sign Out</span>
              </div>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.getStartedBtn}
            style={{ justifyContent: 'center', width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}
            onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
          >
            <span>Get Started / Log In</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </>
  );

  if (isAskVedika) {
    return (
      <>
        {/* Top hover detection strip */}
        <div
          onMouseEnter={handleShowTopNav}
          className={styles.topDetectionStrip}
          style={{ pointerEvents: (isTopNavVisible || mobileMenuOpen) ? 'none' : 'auto' }}
        />

        {/* Discreet floating handle when hidden to show navigation is available on hover */}
        {!isTopNavVisible && !mobileMenuOpen && (
          <div
            onMouseEnter={handleShowTopNav}
            onClick={handleShowTopNav}
            className={styles.revealHandle}
            title="Hover top to reveal navigation"
          >
            <div className={styles.revealHandleBar} />
          </div>
        )}

        {/* Floating collapsible header */}
        <header
          className={`${styles.headerCollapsible} ${(isTopNavVisible || mobileMenuOpen) ? styles.headerCollapsibleVisible : ''}`}
          onMouseEnter={handleShowTopNav}
          onMouseLeave={handleScheduleHideTopNav}
        >
          {navContent}
        </header>

        {mobileDrawerContent}
      </>
    );
  }

  return (
    <>
      <header className={styles.header}>
        {navContent}
      </header>
      {mobileDrawerContent}
    </>
  );
}

