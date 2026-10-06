'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import { T } from '@/lib/lms-data';
import { getMascotBridge } from '@/lib/mascotBridge';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar_collapsed') === 'true';
      setSidebarCollapsed(stored);
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', String(newState));
    }
  };

  useEffect(() => {
    // Read the user object synchronously from localStorage
    const storedUser = localStorage.getItem('frappe_user');
    let currentUser = null;
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (e) {
        localStorage.removeItem('frappe_user');
      }
    }

    const isAuthPage = pathname === '/login' || pathname === '/users' || pathname === '/admin/login' || pathname.startsWith('/auth');
    const isPublicPage = pathname === '/' || isAuthPage;

    const isAdmin = currentUser && (
      (currentUser.role || '').toLowerCase() === 'administrator' ||
      (currentUser.role || '').toLowerCase() === 'admin' ||
      (currentUser.role || '').toLowerCase() === 'system manager' ||
      (currentUser.email || '').toLowerCase() === 'admin@lms.com' ||
      (currentUser.username || '').toLowerCase() === 'administrator' ||
      (currentUser.username || '').toLowerCase() === 'admin'
    );

    if (currentUser && isAdmin && currentUser.role !== 'Administrator') {
      currentUser.role = 'Administrator';
      try {
        localStorage.setItem('frappe_user', JSON.stringify(currentUser));
      } catch (e) {}
    }

    if (!currentUser) {
      if (!isPublicPage) {
        // Redirect to unified login page if not logged in
        setUser(null);
        setLoading(true);
        router.replace('/login');
        return;
      }
    } else {
      // User is logged in
      if (pathname === '/users' || pathname === '/admin/login' || pathname === '/login') {
        // Redirect logged-in users away from auth pages
        setLoading(true);
        if (isAdmin) {
          router.replace('/admin');
        } else {
          router.replace('/prev-home-page');
        }
        return;
      } else {
        // Logged-in page validation
        if (isAdmin) {
          if (!pathname.startsWith('/admin') && pathname !== '/') {
            setLoading(true);
            router.replace('/admin');
            return;
          }
        } else {
          if (pathname.startsWith('/admin')) {
            setLoading(true);
            router.replace('/');
            return;
          }
        }
      }
    }

    // If no redirect is needed, set the local state and stop loading
    setUser(currentUser);
    setLoading(false);
  }, [pathname, router]);

  const isHomePage = pathname === '/';
  const isLabPage = pathname?.startsWith('/vedika-labs/') || pathname?.startsWith('/labs/');
  const isFixedPage = !isLabPage && (
    pathname?.startsWith('/lesson/') ||
    pathname?.startsWith('/vedika-ai') ||
    pathname?.startsWith('/general-tutor') ||
    pathname?.startsWith('/coding-tutor') ||
    pathname?.startsWith('/code-puzzle') ||
    pathname?.startsWith('/viva-interview') ||
    pathname?.startsWith('/quizzes') ||
    pathname?.startsWith('/assignments') ||
    pathname?.startsWith('/courses') ||
    pathname === '/vedika-labs'
  );

  useEffect(() => {
    // Configure layout background dynamically matching theme
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = isHomePage ? '#02050c' : (theme === 'dark' ? '#090B14' : '#F4F7FB');
  }, [isHomePage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bridge = getMascotBridge();

    // Listen for mascot-commanded navigation (e.g. "open math lab", "open titration")
    const unsubscribeNav = bridge.onNavigate((targetRoute) => {
      if (!targetRoute) return;
      const currentFull = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : pathname;
      if (targetRoute !== currentFull) {
        console.log('[LayoutWrapper] Desktop Mascot navigating to:', targetRoute);
        try {
          router.push(targetRoute);
        } catch (err) {
          console.warn('[LayoutWrapper] router.push threw error, fallback to window.location.href:', err);
          if (typeof window !== 'undefined') {
            window.location.href = targetRoute;
          }
        }
      }

      if (targetRoute.includes('/courses') && targetRoute.includes('category=')) {
        const match = targetRoute.match(/category=([^&]+)/);
        if (match && match[1]) {
          const cat = decodeURIComponent(match[1]);
          window.dispatchEvent(new CustomEvent('change_course_category', { detail: { category: cat } }));
        }
      }
    });

    // Notify mascot of page changes
    let activity = 'browsing';
    if (pathname?.startsWith('/vedika-labs/math') || pathname?.startsWith('/labs/math')) activity = 'math_tutor';
    else if (pathname?.startsWith('/vedika-labs/chemistry') || pathname?.startsWith('/labs/chemistry')) activity = 'chemistry_lab';
    else if (pathname?.startsWith('/vedika-labs/physics') || pathname?.startsWith('/labs/physics')) activity = 'physics_lab';
    else if (pathname?.startsWith('/code-puzzle')) activity = 'dsa_puzzle';
    else if (pathname?.startsWith('/lesson/')) activity = 'video_lesson';
    else if (pathname?.startsWith('/courses')) activity = 'courses';

    bridge.sendActivityUpdate(activity, { page: pathname });

    return () => {
      unsubscribeNav();
    };
  }, [pathname, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        width: '100vw',
        minWidth: '100vw',
        minHeight: '100vh',
        background: 'var(--bg)',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text)',
        fontFamily: 'var(--font-outfit), sans-serif',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading AI TUTOR Portal...</div>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/users' || pathname === '/admin/login' || pathname.startsWith('/auth');

  // Auth pages (like /login) render directly without a navbar
  if (isAuthPage) {
    return <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>{children}</div>;
  }

  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', width: '100%' }}>
        <AdminSidebar isCollapsed={sidebarCollapsed} onToggleCollapse={handleToggleCollapse} />
        <div className="sidebar-content-area" style={{ flex: 1, overflowY: 'auto', maxHeight: '100vh' }}>
          {children}
        </div>
      </div>
    );
  }

  const isAskVedika = pathname === '/general-tutor' || pathname?.startsWith('/vedika-ai/ask') || pathname === '/coding-tutor' || pathname?.startsWith('/vedika-ai/code');
  const isViewportLocked = isFixedPage || isHomePage;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: (isViewportLocked || isLabPage) ? '100vh' : 'auto',
      minHeight: '100vh',
      maxHeight: (isViewportLocked || isLabPage) ? '100vh' : 'none',
      background: isHomePage ? '#02050c' : 'var(--bg)',
      color: isHomePage ? '#f8fafc' : 'var(--text)',
      width: '100%',
      position: 'relative',
      overflow: (isViewportLocked || isLabPage) ? 'hidden' : 'visible'
    }}>
      {/* Present Navbar displayed consistently on every page */}
      <Header />
      <main style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        overflowY: isLabPage ? 'auto' : (isViewportLocked ? 'hidden' : 'auto'),
        overflowX: 'hidden',
        height: isAskVedika ? '100vh' : 'calc(100vh - 54px)',
        maxHeight: isAskVedika ? '100vh' : 'calc(100vh - 54px)',
        minHeight: 'calc(100vh - 54px)',
        marginTop: isAskVedika ? 0 : '54px',
        paddingTop: 0,
        background: isHomePage ? '#02050c' : 'var(--bg)'
      }}>
        {children}
      </main>
    </div>
  );
}

