'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, BookOpen, Brain, FlaskConical, Briefcase, BarChart3,
  LogOut, Sun, Moon, Menu, X, ChevronDown, Sparkles, Award, FileText, FolderOpen
} from 'lucide-react';
import { T, getTheme, setTheme } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';

const COURSE_SUBMENU = [
  { id: '/courses',     Icon: BookOpen,   label: 'Explore Courses', desc: 'Browse catalog, syllabus & modules' },
  { id: '/quizzes',     Icon: Award,      label: 'Quizzes',         desc: 'Test knowledge with domain quizzes' },
  { id: '/assignments', Icon: FileText,   label: 'Assignments',     desc: 'Hands-on projects & evaluations'   },
  { id: '/resources',   Icon: FolderOpen, label: 'Resource Hub',    desc: 'Cheat sheets, DSA guides & PDFs'   },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');

  const dropdownRef = useRef(null);
  const coursesDropdownRef = useRef(null);
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
    coursesHoverTimer.current = setTimeout(() => {
      setCoursesDropdownOpen(false);
    }, 200);
  };

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
      {/* Left: Brand Logo & Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 32 }}>
        {/* Brand Link */}
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

        {/* Desktop Navigation Links */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
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

                    {/* Courses Dropdown Menu */}
                    {coursesDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          left: 0,
                          width: 290,
                          background: 'rgba(15, 19, 34, 0.96)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: `1px solid ${T.border}`,
                          borderRadius: 16,
                          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
                          padding: '8px',
                          zIndex: 1100,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3
                        }}
                      >
                        {COURSE_SUBMENU.map((item) => {
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
                                padding: '10px 12px',
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
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubActive) {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.borderColor = 'transparent';
                                }
                              }}
                            >
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: isSubActive ? `${T.accent}25` : 'rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSubActive ? T.accent : T.muted,
                                flexShrink: 0
                              }}>
                                <ItemIcon size={16} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: isSubActive ? '#FFFFFF' : T.text,
                                  lineHeight: 1.2
                                }}>
                                  {item.label}
                                </span>
                                <span style={{
                                  fontSize: 11,
                                  color: T.muted,
                                  marginTop: 2
                                }}>
                                  {item.desc}
                                </span>
                              </div>
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
                    gap: 7,
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
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
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
      </div>

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
