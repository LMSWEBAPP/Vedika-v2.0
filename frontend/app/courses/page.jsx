'use client';

import React, { Component } from 'react';
import CoursePage from '@/components/CoursePage';
import { T } from '@/lib/lms-data';

class CoursesErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Courses ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '60vh',
          padding: '32px 20px',
          textAlign: 'center',
          background: 'var(--bg)',
          color: 'var(--text)'
        }}>
          <div style={{
            background: 'var(--s1)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '36px 28px',
            maxWidth: 480,
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>
              Course Explorer Refresh
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              The course explorer encountered an unexpected state. Click below to reload the course modules cleanly.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('selected_course_id');
                  window.location.reload();
                }
              }}
              style={{
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              Reload Courses
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CoursesRoute() {
  return (
    <div style={{
      height: '100%',
      maxHeight: '100%',
      background: 'var(--bg)',
      color: T.text,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <CoursesErrorBoundary>
        <CoursePage completed={{}} />
      </CoursesErrorBoundary>
    </div>
  );
}
