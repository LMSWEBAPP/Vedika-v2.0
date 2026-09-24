'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.css';
import {
  Search, ArrowRight, ChevronDown, BookOpen, Award, FileText,
  FolderOpen, Menu, X, Brain, FlaskConical, Briefcase, BarChart3,
  Home as HomeIcon, LayoutDashboard, LogOut, User as UserIcon
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const coursesDropdownTimer = useRef(null);
  const profileRef = useRef(null);

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
    setCoursesDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

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
    }, 220);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_sid');
      setUser(null);
      router.push('/login');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'V';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const courseSublinks = [
    { label: 'Explore Courses', desc: 'Browse syllabus & modules', path: '/courses', Icon: BookOpen, color: '#38bdf8' },
    { label: 'Quizzes', desc: 'Test knowledge with domain quizzes', path: '/quizzes', Icon: Award, color: '#a855f7' },
    { label: 'Assignments', desc: 'Hands-on projects & evaluations', path: '/assignments', Icon: FileText, color: '#00f298' },
    { label: 'Resource Hub', desc: 'Library, cheat sheets & DSA sheets', path: '/resources', Icon: FolderOpen, color: '#ff9900' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Left Logo */}
        <button
          type="button"
          className={styles.logoWrap}
          onClick={() => router.push('/')}
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
          <div className={styles.brandTexts}>
            <span className={styles.brandTitle}>VEDIKA</span>
            <span className={styles.brandSubtitle}>AI TUTOR</span>
          </div>
        </button>

        {/* Center Desktop Navigation Links */}
        <nav className={styles.navMenu} aria-label="Main navigation">
          {/* 1. Home */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname === '/' ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/')}
          >
            <span>Home</span>
            {pathname === '/' && <span className={styles.activeGlowIndicator} />}
          </button>

          {/* 2. Dashboard (Prev Home Page) */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname === '/prev-home-page' ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/prev-home-page')}
          >
            <span>Dashboard</span>
            {pathname === '/prev-home-page' && <span className={styles.activeGlowIndicator} />}
          </button>

          {/* 3. Courses (with Submenu) */}
          <div
            className={styles.navItemWrapper}
            onMouseEnter={handleCoursesMouseEnter}
            onMouseLeave={handleCoursesMouseLeave}
          >
            <button
              type="button"
              className={`${styles.navLink} ${pathname.startsWith('/courses') || pathname.startsWith('/quizzes') || pathname.startsWith('/assignments') || pathname.startsWith('/resources') ? styles.activeNavLink : ''}`}
              onClick={() => router.push('/courses')}
            >
              <span>Courses</span>
              <ChevronDown size={13} style={{ opacity: 0.7, transform: coursesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              {(pathname.startsWith('/courses') || pathname.startsWith('/quizzes') || pathname.startsWith('/assignments') || pathname.startsWith('/resources')) && (
                <span className={styles.activeGlowIndicator} />
              )}
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
                      router.push(item.path);
                    }}
                  >
                    <item.Icon size={16} color={item.color} />
                    <div className={styles.dropdownItemContent}>
                      <span className={styles.dropdownItemLabel}>{item.label}</span>
                      <span className={styles.dropdownItemDesc}>{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Vedika AI */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname.startsWith('/vedika-ai') ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/vedika-ai')}
          >
            <span>Vedika AI</span>
            {pathname.startsWith('/vedika-ai') && <span className={styles.activeGlowIndicator} />}
          </button>

          {/* 5. Labs */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname.startsWith('/vedika-labs') ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/vedika-labs')}
          >
            <span>Labs</span>
            {pathname.startsWith('/vedika-labs') && <span className={styles.activeGlowIndicator} />}
          </button>

          {/* 6. Jobs */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname.startsWith('/jobs') ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/jobs')}
          >
            <span>Jobs</span>
            {pathname.startsWith('/jobs') && <span className={styles.activeGlowIndicator} />}
          </button>

          {/* 7. Progress */}
          <button
            type="button"
            className={`${styles.navLink} ${pathname.startsWith('/progress') ? styles.activeNavLink : ''}`}
            onClick={() => router.push('/progress')}
          >
            <span>Progress</span>
            {pathname.startsWith('/progress') && <span className={styles.activeGlowIndicator} />}
          </button>
        </nav>

        {/* Right Action Items */}
        <div className={styles.rightActions}>
          <button
            type="button"
            className={styles.searchBtn}
            aria-label="Search courses and topics"
            onClick={() => router.push('/courses')}
            title="Search Courses"
          >
            <Search size={16} className={styles.searchIcon} />
          </button>

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
                  <div style={{ padding: '6px 10px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      {user?.name || user?.full_name || 'Student'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {user?.email || 'student@vedika.ai'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      router.push('/prev-home-page');
                    }}
                  >
                    <LayoutDashboard size={15} color="#38bdf8" />
                    <span className={styles.dropdownItemLabel}>Dashboard</span>
                  </button>
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
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname === '/' ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/'); }}
          >
            <span>Home</span>
            <HomeIcon size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname === '/prev-home-page' ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/prev-home-page'); }}
          >
            <span>Dashboard</span>
            <LayoutDashboard size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/courses') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/courses'); }}
          >
            <span>Courses</span>
            <BookOpen size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/quizzes') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/quizzes'); }}
          >
            <span>Quizzes</span>
            <Award size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/assignments') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/assignments'); }}
          >
            <span>Assignments</span>
            <FileText size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/resources') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/resources'); }}
          >
            <span>Resources</span>
            <FolderOpen size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/vedika-ai') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/vedika-ai'); }}
          >
            <span>Vedika AI</span>
            <Brain size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/vedika-labs') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/vedika-labs'); }}
          >
            <span>Vedika Labs</span>
            <FlaskConical size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/jobs') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/jobs'); }}
          >
            <span>Jobs</span>
            <Briefcase size={16} />
          </button>
          <button
            type="button"
            className={`${styles.mobileNavLink} ${pathname.startsWith('/progress') ? styles.mobileNavActive : ''}`}
            onClick={() => { setMobileMenuOpen(false); router.push('/progress'); }}
          >
            <span>Progress</span>
            <BarChart3 size={16} />
          </button>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '0 14px', fontSize: 13, color: '#94a3b8' }}>
                Signed in as <strong style={{ color: '#ffffff' }}>{user?.name || user?.email}</strong>
              </div>
              <button
                type="button"
                className={styles.mobileNavLink}
                onClick={handleLogout}
                style={{ color: '#f87171' }}
              >
                <span>Sign Out</span>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.getStartedBtn}
              style={{ justifyContent: 'center', width: '100%', padding: '12px' }}
              onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
            >
              <span>Get Started / Log In</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
