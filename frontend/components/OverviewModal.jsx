'use client';

import React, { useEffect } from 'react';
import { X, BookOpen, Sparkles, Clock, FileText, CheckCircle } from 'lucide-react';
import { T } from '@/lib/lms-data';

export default function OverviewModal({
  isOpen,
  onClose,
  lesson,
  mod,
  onOpenPdf
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lesson) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '85vh',
          background: T.s1 || '#0C0F1C',
          border: `1px solid ${T.border || 'rgba(255,255,255,0.1)'}`,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: T.s2 || '#111827'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${mod?.accent || T.accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: mod?.accent || T.accent,
              flexShrink: 0
            }}>
              <BookOpen size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: mod?.accent || T.accent,
                  background: `${mod?.accent || T.accent}18`,
                  padding: '1px 7px',
                  borderRadius: 8
                }}>
                  {mod?.emoji} {mod?.title}
                </span>
                <span style={{ fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={11} /> {lesson.dur}
                </span>
              </div>
              <h3 style={{
                margin: '3px 0 0',
                fontSize: 15,
                fontWeight: 700,
                color: T.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {lesson.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.muted,
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#FFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = T.muted;
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div style={{
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}>
          {/* Section: Overview */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: T.text,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 8
            }}>
              <BookOpen size={14} color={T.accent} />
              <span>Overview</span>
            </div>
            <div style={{
              background: T.s2,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: '14px 16px',
              color: T.muted,
              fontSize: 13,
              lineHeight: 1.65
            }}>
              {lesson.overview || 'Welcome to this lesson. Learn core concepts and reinforce your understanding.'}
            </div>
          </div>

          {/* Section: Key Points */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: T.text,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 8
            }}>
              <Sparkles size={14} color={T.green} />
              <span>Key Points</span>
            </div>

            {lesson.pts && lesson.pts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lesson.pts.map((point, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      background: T.s2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: `${mod?.accent || T.accent}20`,
                      border: `1px solid ${mod?.accent || T.accent}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: mod?.accent || T.accent,
                      fontSize: 10,
                      fontWeight: 700,
                      marginTop: 1
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ color: T.text, fontSize: 13, lineHeight: 1.5 }}>
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                color: T.muted,
                fontSize: 12.5,
                background: T.s2,
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${T.border}`
              }}>
                No specific key points recorded for this lesson.
              </div>
            )}
          </div>

          {/* Optional PDF Study Resource */}
          {lesson.pdf && onOpenPdf && (
            <div style={{
              background: `linear-gradient(135deg, ${T.accent}12 0%, ${T.purple}12 100%)`,
              border: `1px solid ${T.accent}35`,
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color={T.accent} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>Attached Curriculum PDF</div>
                  <div style={{ fontSize: 11, color: T.muted }}>View reference document for this lesson</div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenPdf();
                }}
                style={{
                  background: T.accent,
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Open PDF
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${T.border}`,
          background: T.s2 || '#111827',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              background: T.s3 || 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: '7px 18px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
