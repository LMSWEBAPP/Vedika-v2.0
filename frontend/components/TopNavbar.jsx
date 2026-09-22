'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, BookOpen, Brain, FlaskConical, Briefcase, BarChart3,
  LogOut, Sun, Moon, Menu, X, ChevronDown, ChevronRight, Sparkles, Award, FileText, FolderOpen, Bell
} from 'lucide-react';
import { T, getTheme, setTheme } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';

const CURRICULUM_ITEMS = [
  { id: '/courses',     Icon: BookOpen,   label: 'Explore Courses', desc: 'Browse catalog, syllabus & modules' },
  { id: '/quizzes',     Icon: Award,      label: 'Quizzes',         desc: 'Test knowledge with domain quizzes' },
  { id: '/assignments', Icon: FileText,   label: 'Assignments',     desc: 'Hands-on projects & evaluations'   },
];

const RESOURCE_HUB_ITEMS = [
  { id: '/resources',                  Icon: FolderOpen, label: 'All Resources Overview', desc: 'Central digital library & study hubs' },
  { id: '/resources?view=library',     Icon: BookOpen,   label: 'PDF Library & Books',    desc: 'Textbooks, guides & handouts'         },
  { id: '/resources?view=cheatsheets', Icon: FileText,   label: 'Cheat Sheets Collection',desc: 'Quick syntax & language references'    },
  { id: '/resources?view=dsa',         Icon: Brain,      label: 'DSA Practice Sheet',     desc: 'Blind 75 & topic-wise problems'       },
  { id: '/resources?view=dsa/company', Icon: Briefcase,  label: 'Company-wise Questions', desc: 'FAANG & top tech interview banks'     },
];

const COURSE_SUBMENU = [
  ...CURRICULUM_ITEMS,
  ...RESOURCE_HUB_ITEMS
];

const NAV_ITEMS = [
  { id: '/',            Icon: Home,         label: 'Dashboard'   },
  { id: '/courses',     Icon: BookOpen,     label: 'Courses', hasDropdown: true },
  { id: '/vedika-ai',   Icon: Brain,        label: 'Vedika AI'   },
  { id: '/vedika-labs', Icon: FlaskConical, label: 'Vedika Labs' },
  { id: '/jobs',        Icon: Briefcase,    label: 'Jobs'        },
  { id: '/progress',    Icon: BarChart3,    label: 'Progress'    },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);

  const [user, setUser] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [resourcesFlyoutOpen, setResourcesFlyoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');

  const dropdownRef = useRef(null);
  const coursesDropdownRef = useRef(null);
  const resourcesHoverTimer = useRef(null);
  const coursesHoverTimer = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('frappe_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
      const t = localStorage.getItem('theme') || 'dark';
      setCurrentTheme(t);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (coursesDropdownRef.current && !coursesDropdownRef.current.contains(e.target)) {
        setCoursesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCoursesDropdownOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.body.style.backgroundColor = nextTheme === 'dark' ? '#07080F' : '#F9FAFB';
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_sid');
      router.push('/login');
    }
  };

  const isCoursesActive = () => {
    return (
      pathname.startsWith('/courses') ||
      pathname.startsWith('/quizzes') ||
      pathname.startsWith('/assignments') ||
      pathname.startsWith('/resources') ||
      pathname.startsWith('/lesson')
    );
  };

  const isActive = (navId) => {
    if (navId === '/') return pathname === '/';
    if (navId === '/courses') return isCoursesActive();
    return pathname.startsWith(navId);
  };

  const getInitials = (name) => {
    if (!name) return 'V';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleCoursesMouseEnter = () => {
    if (coursesHoverTimer.current) clearTimeout(coursesHoverTimer.current);
    setCoursesDropdownOpen(true);
  };

  const handleCoursesMouseLeave = () => {
    if (coursesHoverTimer.current) clearTimeout(coursesHoverTimer.current);
    coursesHoverTimer.current = setTimeout(() => {
      setCoursesDropdownOpen(false);
    }, 200);
  };

  const isAskVedika = pathname === '/general-tutor' || pathname === '/vedika-ai/ask';
  const [isTopNavVisible, setIsTopNavVisible] = useState(false);
  const hideTimerRef = useRef(null);

  const handleShowTopNav = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsTopNavVisible(true);
  }, []);

  const handleScheduleHideTopNav = useCallback(() => {
    if (coursesDropdownOpen || profileDropdownOpen) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsTopNavVisible(false);
    }, 850);
  }, [coursesDropdownOpen, profileDropdownOpen]);

  useEffect(() => {
    if (!isAskVedika) return;
    const handleMouseMove = (e) => {
      // Keep left sidebar interaction zone completely clear (sidebar is at left: 20px, width up to 340px)
      if (e.clientX <= 440) {
        if (!coursesDropdownOpen && !profileDropdownOpen) {
          handleScheduleHideTopNav();
        }
        return;
      }

      if (e.clientY <= 55) {
        handleShowTopNav();
      } else if (e.clientY > 120 && !coursesDropdownOpen && !profileDropdownOpen) {
        handleScheduleHideTopNav();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAskVedika, coursesDropdownOpen, profileDropdownOpen, handleShowTopNav, handleScheduleHideTopNav]);

  if (isAskVedika) {
    return (
      <>
        {/* Top hover detection strip (active only outside the left sidebar region) */}
        <div
          onMouseEnter={handleShowTopNav}
          style={{
            position: 'fixed',
            top: 0,
            left: 440,
            right: 0,
            height: 38,
            zIndex: 999,
            pointerEvents: isTopNavVisible ? 'none' : 'auto'
          }}
        />

        {/* Discreet floating handle when hidden to show navigation is available on hover */}
        {!isTopNavVisible && (
          <div
            onMouseEnter={handleShowTopNav}
            onClick={handleShowTopNav}
            title="Hover top to reveal navigation"
            style={{
              position: 'fixed',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 998,
              padding: '3px 14px 4px',
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ width: 22, height: 3, borderRadius: 2, background: 'rgba(56, 189, 248, 0.6)' }} />
          </div>
        )}

        {/* Floating Auto-Hiding Top Navbar (matching reference image) */}
        <header
          onMouseEnter={handleShowTopNav}
          onMouseLeave={handleScheduleHideTopNav}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '8px 14px' : '10px 24px',
            fontFamily: 'var(--font-outfit), sans-serif',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            transform: isTopNavVisible ? 'translateY(0)' : 'translateY(-105%)',
            opacity: isTopNavVisible ? 1 : 0,
            transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease'
          }}
        >
          {/* Left: Brand Logo Capsule (hidden on Ask Vedika so it never overlaps the left floating sidebar) */}
          <div style={{
            display: isAskVedika ? 'none' : 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 14,
            padding: '4px 10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            pointerEvents: isTopNavVisible ? 'auto' : 'none'
          }}>
            <button
              onClick={() => router.push('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
              }}>
                <Sparkles size={15} color="#FFFFFF" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF', lineHeight: 1.1 }}>
                  VEDIKA
                </span>
                <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.08em', color: '#38BDF8', textTransform: 'uppercase' }}>
                  AI TUTOR
                </span>
              </div>
            </button>
          </div>

          {/* Center: Floating Capsule with Nav Icons matching reference image */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 9999,
            padding: '4px 10px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.12)',
            pointerEvents: isTopNavVisible ? 'auto' : 'none'
          }}>
            {/* Home (active glowing purple circle badge matching reference image) */}
            <button
              onClick={() => router.push('/')}
              title="Dashboard"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: '0 0 14px rgba(139, 92, 246, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Home size={16} />
            </button>

            {/* Courses */}
            <div
              ref={coursesDropdownRef}
              style={{ position: 'relative' }}
              onMouseEnter={handleCoursesMouseEnter}
              onMouseLeave={handleCoursesMouseLeave}
            >
              <button
                onClick={() => router.push('/courses')}
                title="Courses & Resources"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: coursesDropdownOpen ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: coursesDropdownOpen ? '#FFFFFF' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                onMouseLeave={e => { if (!coursesDropdownOpen) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <BookOpen size={16} />
              </button>

              {coursesDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 290,
                    background: 'rgba(12, 16, 30, 0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
                    padding: '10px 8px',
                    zIndex: 1100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }}
                >
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: T.muted,
                    letterSpacing: '0.08em',
                    padding: '4px 10px 2px',
                    textTransform: 'uppercase'
                  }}>
                    Curriculum & Testing
                  </div>
                  {CURRICULUM_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCoursesDropdownOpen(false);
                        router.push(item.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#E2E8F0',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E2E8F0'; }}
                    >
                      <item.Icon size={16} color={T.accent} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{item.desc}</span>
                      </div>
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '4px 6px' }} />
                  <button
                    onClick={() => {
                      setCoursesDropdownOpen(false);
                      router.push('/resources');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#E2E8F0'
                    }}
                  >
                    <FolderOpen size={16} color="#38BDF8" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>All Resources</span>
                  </button>
                </div>
              )}
            </div>

            {/* Vedika AI */}
            <button
              onClick={() => router.push('/vedika-ai')}
              title="Vedika AI Hub"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.25)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E9D5FF',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#E9D5FF'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)'; }}
            >
              <Brain size={16} />
            </button>

            {/* Vedika Labs */}
            <button
              onClick={() => router.push('/vedika-labs')}
              title="Vedika Labs"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}
            >
              <FlaskConical size={16} />
            </button>

            {/* Jobs */}
            <button
              onClick={() => router.push('/jobs')}
              title="Jobs"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}
            >
              <Briefcase size={16} />
            </button>

            {/* Progress */}
            <button
              onClick={() => router.push('/progress')}
              title="Progress"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}
            >
              <BarChart3 size={16} />
            </button>
          </nav>

          {/* Right: Theme Toggle, Notifications, User Capsule */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: isTopNavVisible ? 'auto' : 'none' }}>
            {/* Sun/Moon Toggle */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#38BDF8'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
            >
              {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Bell Notification */}
            <button
              title="Notifications"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#38BDF8'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
            >
              <Bell size={16} />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 6px #38BDF8' }} />
            </button>

            {/* User Profile */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 20,
                  padding: '3px 10px 3px 3px',
                  cursor: 'pointer',
                  color: '#FFFFFF'
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#FFFFFF'
                }}>
                  {getInitials(user?.name || user?.full_name || 'Aarav')}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#F8FAFC' }}>
                  {user?.name?.split(' ')[0] || 'Aarav'}
                </span>
                <ChevronDown size={12} color="#94A3B8" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: 220,
                    background: 'rgba(12, 16, 30, 0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${T.border}`,
                    borderRadius: 14,
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
                    padding: '8px',
                    zIndex: 1100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  <div style={{ padding: '8px 10px 6px', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{user?.name || user?.full_name || 'Aarav'}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{user?.email || 'student@vedika.ai'}</div>
                  </div>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); router.push('/profile'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      color: '#E2E8F0',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: 8,
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    View Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      color: '#F87171',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: 8,
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      </>
    );
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      width: '100%',
      height: 64,
      background: 'rgba(10, 13, 24, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0 16px' : '0 32px',
      fontFamily: 'var(--font-outfit), sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Left: Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'none'
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)'
          }}>
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: T.text,
              lineHeight: 1.1
            }}>
              VEDIKA
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: T.accent,
              textTransform: 'uppercase'
            }}>
              AI TUTOR
            </span>
          </div>
        </button>
      </div>

      {/* Center: Desktop Navigation Links (Centered horizontally in the navbar) */}
      {!isMobile && (
        <nav style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          {NAV_ITEMS.map(({ id, Icon, label, hasDropdown }) => {
            const active = isActive(id);

            if (hasDropdown && id === '/courses') {
              return (
                <div
                  key={id}
                  ref={coursesDropdownRef}
                  style={{ position: 'relative' }}
                  onMouseEnter={handleCoursesMouseEnter}
                  onMouseLeave={handleCoursesMouseLeave}
                >
                  <button
                    onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 10,
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#FFFFFF' : T.muted,
                      background: active ? `${T.accent}1F` : (coursesDropdownOpen ? 'rgba(255, 255, 255, 0.06)' : 'transparent'),
                      border: active ? `1px solid ${T.accent}45` : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.color = T.text;
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active && !coursesDropdownOpen) {
                        e.currentTarget.style.color = T.muted;
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon size={16} color={active ? T.accent : 'currentColor'} />
                    <span>{label}</span>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: coursesDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        opacity: 0.7
                      }}
                    />
                  </button>

                  {/* Courses Dropdown Menu with all Resource Hub pages */}
                  {coursesDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 300,
                        background: 'rgba(12, 16, 30, 0.98)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: `1px solid ${T.border}`,
                        borderRadius: 16,
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
                        padding: '10px 8px',
                        zIndex: 1100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      {/* Section 1: Curriculum & Testing */}
                      <div style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: T.muted,
                        letterSpacing: '0.08em',
                        padding: '4px 10px 2px',
                        textTransform: 'uppercase'
                      }}>
                        Curriculum & Testing
                      </div>

                      {CURRICULUM_ITEMS.map((item) => {
                        const isSubActive = pathname === item.id || (item.id === '/courses' && pathname.startsWith('/courses'));
                        const ItemIcon = item.Icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setCoursesDropdownOpen(false);
                              router.push(item.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '8px 10px',
                              borderRadius: 10,
                              background: isSubActive ? `${T.accent}18` : 'transparent',
                              border: isSubActive ? `1px solid ${T.accent}35` : '1px solid transparent',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <div style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: isSubActive ? `${T.accent}25` : 'rgba(255, 255, 255, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSubActive ? T.accent : T.muted,
                              flexShrink: 0
                            }}>
                              <ItemIcon size={15} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{
                                fontSize: 13,
                                fontWeight: isSubActive ? 700 : 600,
                                color: isSubActive ? '#FFFFFF' : T.text
                              }}>
                                {item.label}
                              </span>
                              <span style={{ fontSize: 10.5, color: T.muted }}>
                                {item.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {/* Section Divider */}
                      <div style={{ height: 1, background: T.border, margin: '4px 6px' }} />

                      {/* Section 2: Resource Hub with > Arrow & Submenu Flyout */}
                      <div
                        style={{ position: 'relative' }}
                        onMouseEnter={() => {
                          if (resourcesHoverTimer.current) clearTimeout(resourcesHoverTimer.current);
                          setResourcesFlyoutOpen(true);
                        }}
                        onMouseLeave={() => {
                          resourcesHoverTimer.current = setTimeout(() => {
                            setResourcesFlyoutOpen(false);
                          }, 200);
                        }}
                      >
                        <button
                          onClick={() => setResourcesFlyoutOpen(!resourcesFlyoutOpen)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: resourcesFlyoutOpen ? `${T.accent}14` : 'transparent',
                            border: resourcesFlyoutOpen ? `1px solid ${T.accent}35` : '1px solid transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: 'rgba(255, 255, 255, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: T.accent,
                              flexShrink: 0
                            }}>
                              <FolderOpen size={15} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                                Resource Hub
                              </span>
                              <span style={{ fontSize: 10.5, color: T.muted }}>
                                Libraries, cheatsheets & DSA
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            size={16}
                            color={T.accent}
                            style={{
                              transform: resourcesFlyoutOpen ? 'translateX(2px)' : 'none',
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        </button>

                        {/* Resource Hub Nested Flyout Submenu */}
                        {resourcesFlyoutOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: -4,
                              left: 'calc(100% + 8px)',
                              width: 280,
                              background: 'rgba(12, 16, 30, 0.98)',
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              border: `1px solid ${T.border}`,
                              borderRadius: 14,
                              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
                              padding: '8px',
                              zIndex: 1200,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3
                            }}
                            onMouseEnter={() => {
                              if (resourcesHoverTimer.current) clearTimeout(resourcesHoverTimer.current);
                              setResourcesFlyoutOpen(true);
                            }}
                            onMouseLeave={() => {
                              resourcesHoverTimer.current = setTimeout(() => {
                                setResourcesFlyoutOpen(false);
                              }, 200);
                            }}
                          >
                            <div style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: T.muted,
                              letterSpacing: '0.08em',
                              padding: '2px 8px 4px',
                              textTransform: 'uppercase'
                            }}>
                              Resource Sub-Hubs
                            </div>

                            {RESOURCE_HUB_ITEMS.map((rItem) => {
                              const isRActive = pathname === rItem.id;
                              const RIcon = rItem.Icon;
                              return (
                                <button
                                  key={rItem.id}
                                  onClick={() => {
                                    setCoursesDropdownOpen(false);
                                    setResourcesFlyoutOpen(false);
                                    router.push(rItem.id);
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '7px 8px',
                                    borderRadius: 8,
                                    background: isRActive ? `${T.accent}18` : 'transparent',
                                    border: isRActive ? `1px solid ${T.accent}35` : '1px solid transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.12s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isRActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isRActive) e.currentTarget.style.background = 'transparent';
                                  }}
                                >
                                  <div style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 6,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: T.muted,
                                    flexShrink: 0
                                  }}>
                                    <RIcon size={13} />
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>
                                      {rItem.label}
                                    </span>
                                    <span style={{ fontSize: 10, color: T.muted }}>
                                      {rItem.desc}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={id}
                onClick={() => router.push(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#FFFFFF' : T.muted,
                  background: active ? `${T.accent}1F` : 'transparent',
                  border: active ? `1px solid ${T.accent}45` : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = T.text;
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = T.muted;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={16} color={active ? T.accent : 'currentColor'} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Right: Theme Toggle, User Profile & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: T.s2,
            border: `1px solid ${T.border}`,
            color: T.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = T.text;
            e.currentTarget.style.borderColor = T.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = T.muted;
            e.currentTarget.style.borderColor = T.border;
          }}
        >
          {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '5px 10px 5px 6px',
              borderRadius: 24,
              background: T.s2,
              border: `1px solid ${profileDropdownOpen ? T.accent : T.border}`,
              color: T.text,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800
            }}>
              {getInitials(user?.name || user?.email || 'Student')}
            </div>
            {!isMobile && (
              <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name ? user.name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'Student')}
              </span>
            )}
            <ChevronDown size={14} color={T.muted} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 220,
              background: T.s1,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
              padding: 6,
              zIndex: 1050,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {/* User Details Header */}
              <div style={{ padding: '10px 12px', borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>
                  {user?.name || 'Student'}
                </div>
                <div style={{ fontSize: 11.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'student@vedika.ai'}
                </div>
                <div style={{
                  display: 'inline-block',
                  marginTop: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: `${T.accent}18`,
                  color: T.accent
                }}>
                  {user?.role || 'Student'}
                </div>
              </div>

              {/* Action: Profile / Progress */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  router.push('/progress');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: T.text,
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = T.s2}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <BarChart3 size={15} color={T.muted} />
                <span>My Learning Progress</span>
              </button>

              {/* Action: Logout */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  color: '#EF4444',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={15} color="#EF4444" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: T.s2,
              border: `1px solid ${T.border}`,
              color: T.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: 64,
          left: 0,
          right: 0,
          background: 'rgba(10, 13, 24, 0.98)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.border}`,
          padding: '12px 16px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 1000
        }}>
          {NAV_ITEMS.map(({ id, Icon, label, hasDropdown }) => {
            const active = isActive(id);

            if (hasDropdown && id === '/courses') {
              return (
                <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => setMobileCoursesOpen(!mobileCoursesOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#FFFFFF' : T.muted,
                      background: active ? `${T.accent}1F` : 'transparent',
                      border: active ? `1px solid ${T.accent}45` : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Icon size={18} color={active ? T.accent : 'currentColor'} />
                      <span>{label}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: mobileCoursesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    />
                  </button>

                  {mobileCoursesOpen && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      paddingLeft: 24,
                      paddingTop: 4,
                      paddingBottom: 4
                    }}>
                      {COURSE_SUBMENU.map((sub) => {
                        const SubIcon = sub.Icon;
                        const subActive = pathname === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              router.push(sub.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 14px',
                              borderRadius: 10,
                              fontSize: 13,
                              fontWeight: subActive ? 700 : 500,
                              color: subActive ? '#FFFFFF' : T.muted,
                              background: subActive ? `${T.accent}18` : 'rgba(255, 255, 255, 0.03)',
                              border: subActive ? `1px solid ${T.accent}35` : '1px solid transparent',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <SubIcon size={15} color={subActive ? T.accent : 'currentColor'} />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={id}
                onClick={() => router.push(id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#FFFFFF' : T.muted,
                  background: active ? `${T.accent}1F` : 'transparent',
                  border: active ? `1px solid ${T.accent}45` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} color={active ? T.accent : 'currentColor'} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
