'use client';

import React from 'react';
import { Bot, BookMarked, MessageSquare, Award, ChevronRight, Minimize2 } from 'lucide-react';
import { T } from '@/lib/lms-data';

export const TABS = [
  {
    id: 'ask_vedika',
    label: 'Ask Vedika',
    subtitle: 'AI Explanation',
    Icon: Bot,
    color: T.purple || '#8B5CF6'
  },
  {
    id: 'notes',
    label: 'Personal Notes',
    subtitle: 'Timestamped',
    Icon: BookMarked,
    color: '#EC4899'
  },
  {
    id: 'qa',
    label: 'Lesson Q&A',
    subtitle: 'Ask Video',
    Icon: MessageSquare,
    color: T.accent || '#3B82F6'
  },
  {
    id: 'quiz',
    label: 'Practice Quiz',
    subtitle: 'AI Test',
    Icon: Award,
    color: T.green || '#10B981'
  }
];

export default function CompanionTabs({
  activeTab = 'ask_vedika',
  onSelectTab,
  notesCount = 0,
  qaCount = 0,
  vertical = false,
  onCollapse
}) {
  // VERTICAL COLUMN MODE: Shown in the 10% tab bar
  if (vertical) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        height: '100%',
        justifyContent: 'center', // Vertically centered so no empty gap below
        alignItems: 'center',
        padding: '6px 2px',
        boxSizing: 'border-box'
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const { Icon } = tab;
          const count = tab.id === 'notes' ? notesCount : tab.id === 'qa' ? qaCount : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              title={`${tab.label} (${tab.subtitle})`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '12px 6px',
                borderRadius: 12,
                border: isActive ? `1px solid ${tab.color}80` : '1px solid transparent',
                background: isActive ? `${tab.color}22` : 'transparent',
                boxShadow: isActive ? `0 4px 18px ${tab.color}25` : 'none',
                color: isActive ? '#FFFFFF' : (T.muted || '#94A3B8'),
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = `${tab.color}12`;
                  e.currentTarget.style.borderColor = `${tab.color}35`;
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.color = T.muted || '#94A3B8';
                }
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} style={{ color: isActive ? tab.color : 'inherit', filter: isActive ? `drop-shadow(0 0 6px ${tab.color}80)` : 'none', transition: 'all 0.2s' }} />
                {count > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 10,
                    background: tab.color,
                    color: '#FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                  }}>
                    {count}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 500,
                textAlign: 'center',
                lineHeight: 1.2,
                color: isActive ? '#FFFFFF' : (T.text || '#E2E8F0'),
                wordBreak: 'break-word',
                maxWidth: '100%',
                transition: 'color 0.2s'
              }}>
                {tab.label}
              </span>
              <span style={{
                fontSize: 9,
                opacity: isActive ? 0.9 : 0.6,
                textAlign: 'center',
                lineHeight: 1.1,
                color: isActive ? tab.color : 'inherit'
              }}>
                {tab.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // HORIZONTAL ROW MODE: Shown when sidebar is in 50-50 expanded state
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        background: T.s2 || '#0E1322',
        padding: 5,
        borderRadius: 12,
        border: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
        flex: 1
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const { Icon } = tab;
          const count = tab.id === 'notes' ? notesCount : tab.id === 'qa' ? qaCount : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: '7px 4px',
                borderRadius: 8,
                border: isActive ? `1px solid ${tab.color}50` : '1px solid transparent',
                background: isActive ? `${tab.color}15` : 'transparent',
                color: isActive ? (T.text || '#FFF') : (T.muted || '#94A3B8'),
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={14} style={{ color: isActive ? tab.color : 'currentColor' }} />
                <span style={{
                  fontSize: 11.5,
                  fontWeight: isActive ? 700 : 600,
                  whiteSpace: 'nowrap'
                }}>
                  {tab.label}
                </span>
                {count > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 10,
                    background: isActive ? tab.color : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#FFFFFF' : T.muted
                  }}>
                    {count}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 9.5,
                opacity: isActive ? 0.9 : 0.6,
                whiteSpace: 'nowrap'
              }}>
                {tab.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          title="Minimize to 10% sidebar (90-10 view)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '7px 11px',
            borderRadius: 10,
            background: T.s2 || '#0E1322',
            border: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
            color: T.muted || '#94A3B8',
            cursor: 'pointer',
            fontSize: 11.5,
            fontWeight: 600,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            alignSelf: 'stretch'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#FFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.s2 || '#0E1322';
            e.currentTarget.style.color = T.muted || '#94A3B8';
          }}
        >
          <Minimize2 size={13} />
          <span>90:10</span>
        </button>
      )}
    </div>
  );
}
