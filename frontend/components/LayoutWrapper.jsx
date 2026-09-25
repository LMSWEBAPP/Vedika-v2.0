'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import { T } from '@/lib/lms-data';

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
  const isFixedPage = pathname?.startsWith('/lesson/') || pathname?.startsWith('/vedika-ai') || pathname?.startsWith('/vedika-labs') || pathname === '/general-tutor' || pathname === '/coding-tutor' || pathname === '/code-puzzle' || pathname === '/viva-interview' || pathname === '/quizzes' || pathname === '/assignments' || pathname === '/courses';

  useEffect(() => {
    // Configure layout background dynamically matching theme
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = isHomePage ? '#02050c' : (theme === 'dark' ? '#090B14' : '#F4F7FB');
  }, [isHomePage]);

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isFixedPage && !isHomePage ? '100vh' : 'auto',
      minHeight: '100vh',
      maxHeight: isFixedPage && !isHomePage ? '100vh' : 'none',
      background: isHomePage ? '#02050c' : 'var(--bg)',
      color: isHomePage ? '#f8fafc' : 'var(--text)',
      width: '100%',
      position: 'relative',
      overflow: isFixedPage && !isHomePage ? 'hidden' : 'visible'
    }}>
      {/* Present Navbar displayed consistently on every page */}
      <Header />
      <main style={{
        position: isFixedPage && !isHomePage ? 'fixed' : 'relative',
        top: isFixedPage && !isHomePage ? 72 : 'auto',
        bottom: isFixedPage && !isHomePage ? 0 : 'auto',
        left: isFixedPage && !isHomePage ? 0 : 'auto',
        right: isFixedPage && !isHomePage ? 0 : 'auto',
        width: '100%',
        boxSizing: 'border-box',
        overflowY: isFixedPage && !isHomePage ? 'hidden' : 'auto',
        overflowX: 'hidden',
        height: isFixedPage && !isHomePage ? 'calc(100vh - 72px)' : 'auto',
        maxHeight: isFixedPage && !isHomePage ? 'calc(100vh - 72px)' : 'none',
        minHeight: !isFixedPage ? 'calc(100vh - 72px)' : 'auto',
        paddingTop: isHomePage ? 0 : (isFixedPage ? 0 : '72px'),
        background: isHomePage ? '#02050c' : 'var(--bg)'
      }}>
        {children}
      </main>
    </div>
  );
}

