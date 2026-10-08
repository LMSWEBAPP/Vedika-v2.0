'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Maximize2, RotateCcw, BookOpen, HelpCircle, 
  ExternalLink, Layers, CheckCircle2, ChevronDown, ChevronUp, Award, Send, Bot, RefreshCw,
  Sparkles, Smartphone, X, Check, Compass
} from 'lucide-react';
import { PHET_SIMULATIONS, LAB_SUBJECT_METADATA } from '@/lib/phet-simulations';
import { T } from '@/lib/lms-data';
import MathEquationRenderer from '@/components/labs/MathEquationRenderer';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';

export const LAB_FEATURE_OPTIONS = [
  {
    id: 'sim',
    label: 'Interactive Canvas',
    icon: Layers,
    badge: 'PhET Sim',
    subtitle: 'Interactive HTML5 STEM Simulation Engine'
  },
  {
    id: 'objectives',
    label: 'Objectives & Steps',
    icon: BookOpen,
    badge: 'Procedure',
    subtitle: 'Core Learning Objectives & Guided Lab Protocol'
  },
  {
    id: 'formulas',
    label: 'Formulas & Principles',
    icon: Award,
    badge: 'Theory',
    subtitle: 'Fundamental Equations & Scientific Principles'
  },
  {
    id: 'questions',
    label: 'Viva & Self Test',
    icon: HelpCircle,
    badge: 'Oral Exam',
    subtitle: 'Interactive Viva Voce Questions & Practice Quiz'
  },
  {
    id: 'ai',
    label: 'Vedika AI Science Tutor',
    icon: Bot,
    badge: 'AI Mentor',
    subtitle: 'Real-time STEM Dialogue & Step-by-Step Solutions'
  }
];

export default function PhetSimViewer({ subject = 'physics', activeSimId, onSelectSim, onViewModeChange, currentViewMode = 'phet' }) {
  const isMobile = useMediaQuery(isMobileMQ);
  const sims = PHET_SIMULATIONS[subject] || [];
  const activeSim = sims.find(s => s.id === activeSimId) || sims[0];
  const subjectMeta = LAB_SUBJECT_METADATA[subject] || LAB_SUBJECT_METADATA.physics;

  const getInitialGreeting = (sim, subj) => {
    const title = sim?.title || 'this experiment';
    const badge = sim?.badge ? ` (${sim.badge})` : '';
    const formulas = sim?.keyFormulas?.length ? `\n\n📐 **Key Formulas:** ${sim.keyFormulas.join(', ')}` : '';
    const objectives = sim?.objectives?.length 
      ? `\n\n🎯 **Core Objectives:**\n${sim.objectives.slice(0, 2).map(o => `• ${o}`).join('\n')}`
      : '';

    return `Hello! I am Vedika, your ${subj.toUpperCase()} Science Tutor. I am fully briefed on **${title}**${badge}.${objectives}${formulas}\n\nAsk me any question about the experiment, or select a question from the **Viva & Self Test** tab for a complete guided solution!`;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sim'); // 'sim', 'objectives', 'formulas', 'questions', 'ai'
  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);
  const [showMobileTip, setShowMobileTip] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dropdownRef = useRef(null);

  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState([
    { sender: 'ai', text: getInitialGreeting(activeSim, subject) }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatBottomRef = useRef(null);

  // Sync tab with URL parameter if provided (e.g. ?tab=formulas)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && LAB_FEATURE_OPTIONS.some(o => o.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Listen for native fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Close feature dropdown on outside click or touch
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsFeatureDropdownOpen(false);
      }
    };
    if (isFeatureDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isFeatureDropdownOpen]);

  // Reset AI chat context with primed experiment briefing when switching to a different simulation
  useEffect(() => {
    setAiChat([
      { sender: 'ai', text: getInitialGreeting(activeSim, subject) }
    ]);
    setAiQuery('');
    setIsAiThinking(false);
  }, [activeSimId, subject]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'ai' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChat, isAiThinking, activeTab]);

  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleReloadIframe = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleAskAi = async (textToSend, options = {}) => {
    const q = textToSend || aiQuery;
    if (!q.trim()) return;

    const userMsg = { sender: 'user', text: q };
    setAiChat(prev => [...prev, userMsg]);
    setAiQuery(''); // Always clear input
    setIsAiThinking(true);

    let vivaQuestion = options.vivaQuestion;
    let questionIndex = options.questionIndex;

    // Parse viva question details if called with standard question prefix
    if (!vivaQuestion && q.startsWith('Answer Viva Question Q')) {
      const match = q.match(/Answer Viva Question Q(\d+):\s*(.*)/i);
      if (match) {
        questionIndex = parseInt(match[1], 10);
        vivaQuestion = match[2];
      }
    }

    try {
      // Primary: Dedicated Labs Tutor API with full experiment briefing & Gemini key rotation
      const res = await fetch('/api/labs/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          experiment: activeSim,
          userQuery: q,
          vivaQuestion: vivaQuestion || null,
          questionIndex: questionIndex || null,
          history: aiChat.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      const aiReply = data.reply || data.response;
      if (aiReply) {
        setAiChat(prev => [...prev, { sender: 'ai', text: aiReply }]);
        return;
      }
      throw new Error('No response text received');
    } catch (err) {
      console.warn('[Lab Tutor API error, attempting direct fallback]:', err);
      // Secondary fallback: Direct /api/gemini endpoint
      try {
        const directRes = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: `You are Vedika, the senior AI science tutor for ${activeSim?.title || 'Virtual Labs'}. Key Formulas: ${activeSim?.keyFormulas?.join(', ') || 'Fundamental laws'}. Provide a clear direct viva answer, theoretical explanation, and simulation verification steps.`,
            user: q
          })
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData.text) {
            setAiChat(prev => [...prev, { sender: 'ai', text: directData.text }]);
            return;
          }
        }
      } catch (fallbackErr) {
        console.warn('[Direct fallback also failed]:', fallbackErr);
      }

      // Offline synthesis fallback
      setAiChat(prev => [...prev, { 
        sender: 'ai', 
        text: `### Direct Viva Answer: ${activeSim?.title || 'Experiment'}\n\n` +
              `**Key Principle:** In this experiment, system behavior is determined by: **${activeSim?.keyFormulas?.join(', ') || 'fundamental laws'}**.\n\n` +
              `**Simulation Guidance:** Use the simulator components and meters to observe direct changes as you adjust parameters. Please ask again in a moment for full live analysis.` 
      }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const currentFeature = LAB_FEATURE_OPTIONS.find(f => f.id === activeTab) || LAB_FEATURE_OPTIONS[0];
  const CurrentFeatureIcon = currentFeature.icon;

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: isMobile ? 'auto' : 800,
        background: '#090B13',
        color: T.text,
        borderRadius: isMobile ? 12 : 16,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'var(--font-outfit), sans-serif',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)'
      }}
    >
      {/* Top Header Control Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15, 20, 32, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: isMobile ? '10px 12px 8px' : '14px 20px',
        gap: 10
      }}>
        {/* Main Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          {/* Left: Experiment Selector & Subject Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: isMobile ? 1 : 'none',
            minWidth: 0,
            maxWidth: isMobile ? '100%' : '400px'
          }}>
            <span style={{
              background: subjectMeta.gradient,
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              padding: '4px 8px',
              borderRadius: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              HTML5 {subject.toUpperCase()}
            </span>

            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <select
                value={activeSim?.id}
                onChange={(e) => {
                  setIsLoading(true);
                  onSelectSim && onSelectSim(e.target.value);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.07)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: isMobile ? '7px 28px 7px 10px' : '8px 32px 8px 12px',
                  borderRadius: 8,
                  fontSize: isMobile ? 12.5 : 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                {sims.map(sim => (
                  <option key={sim.id} value={sim.id} style={{ background: '#0F1420', color: '#fff' }}>
                    🧪 {sim.title} ({sim.badge})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} color="#aaa" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Desktop Center: Dual Mode Switcher (HTML5 vs 3D WebGL) */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: 10,
              padding: 3,
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                onClick={() => onViewModeChange && onViewModeChange('phet')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: currentViewMode === 'phet' ? subjectMeta.accentColor : 'transparent',
                  color: currentViewMode === 'phet' ? '#fff' : '#999',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.2s'
                }}
              >
                <Maximize2 size={13} />
                HTML5 Sim
              </button>
              <button
                onClick={() => onViewModeChange && onViewModeChange('3d')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: currentViewMode === '3d' ? subjectMeta.accentColor : 'transparent',
                  color: currentViewMode === '3d' ? '#fff' : '#999',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.2s'
                }}
              >
                <Layers size={13} />
                3D Canvas
              </button>
            </div>
          )}

          {/* Quick Action Controls (Reset & Fullscreen) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0
          }}>
            <button
              onClick={handleReloadIframe}
              title="Reset / Reload Simulation"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                padding: isMobile ? '6px 9px' : '8px 12px',
                borderRadius: 8,
                fontSize: isMobile ? 12 : 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <RotateCcw size={13} />
              {!isMobile && 'Reset'}
            </button>

            <button
              onClick={handleToggleFullscreen}
              title="Fullscreen Mode"
              style={{
                background: isFullscreen ? subjectMeta.accentColor : 'rgba(255, 255, 255, 0.08)',
                border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                color: isFullscreen ? '#000' : '#fff',
                padding: isMobile ? '6px 10px' : '8px 12px',
                borderRadius: 8,
                fontSize: isMobile ? 12 : 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <Maximize2 size={13} />
              {isMobile ? (isFullscreen ? 'Exit' : 'Full') : (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen')}
            </button>
          </div>
        </div>

        {/* Mobile-Only Row: Mode Switcher */}
        {isMobile && (
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.45)',
            borderRadius: 8,
            padding: 2,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            width: '100%'
          }}>
            <button
              onClick={() => onViewModeChange && onViewModeChange('phet')}
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '6px 8px',
                borderRadius: 7,
                border: 'none',
                background: currentViewMode === 'phet' ? subjectMeta.accentColor : 'transparent',
                color: currentViewMode === 'phet' ? '#fff' : '#999',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s'
              }}
            >
              <Maximize2 size={12} />
              HTML5 Sim
            </button>
            <button
              onClick={() => onViewModeChange && onViewModeChange('3d')}
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: '6px 8px',
                borderRadius: 7,
                border: 'none',
                background: currentViewMode === '3d' ? subjectMeta.accentColor : 'transparent',
                color: currentViewMode === '3d' ? '#fff' : '#999',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s'
              }}
            >
              <Layers size={12} />
              3D Canvas
            </button>
          </div>
        )}
      </div>

      {/* Hero Feature Options Bar: Custom Dropdown for the 5 Features */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0D111A',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: isMobile ? '8px 12px' : '10px 18px',
        gap: 12,
        zIndex: 40
      }}>
        {/* The 5-Feature Options Dropdown Trigger & Popover */}
        <div ref={dropdownRef} style={{ position: 'relative', width: isMobile ? '100%' : 'auto', minWidth: 260 }}>
          <button
            type="button"
            onClick={() => setIsFeatureDropdownOpen(prev => !prev)}
            aria-label="Select Lab Feature Option"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isFeatureDropdownOpen ? subjectMeta.accentColor : 'rgba(255, 255, 255, 0.12)'}`,
              borderRadius: 10,
              padding: isMobile ? '7px 11px' : '8px 14px',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: isFeatureDropdownOpen ? `0 0 16px ${subjectMeta.glowColor || 'rgba(0,212,255,0.3)'}` : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${subjectMeta.accentColor}33, ${subjectMeta.accentColor}11)`,
                border: `1px solid ${subjectMeta.accentColor}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: subjectMeta.accentColor,
                flexShrink: 0
              }}>
                <CurrentFeatureIcon size={16} />
              </div>
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 9, color: '#8892B0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Lab Feature
                </div>
                <div style={{
                  fontSize: isMobile ? 13 : 13.5,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentFeature.label}</span>
                  <span style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: `${subjectMeta.accentColor}22`,
                    color: subjectMeta.accentColor,
                    border: `1px solid ${subjectMeta.accentColor}44`,
                    flexShrink: 0
                  }}>
                    {currentFeature.badge}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8892B0', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: '#647298' }}>Menu</span>
              <ChevronDown
                size={16}
                color={isFeatureDropdownOpen ? subjectMeta.accentColor : '#8892B0'}
                style={{
                  transform: isFeatureDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
          </button>

          {/* Dropdown Menu Modal / Popover */}
          {isFeatureDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: isMobile ? '100%' : 340,
              background: '#0B0F19',
              border: `1px solid ${subjectMeta.accentColor}66`,
              borderRadius: 12,
              padding: '6px',
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0,0,0,0.5)',
              zIndex: 70,
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{
                padding: '6px 10px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#647298', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Available Features
                </span>
                <span style={{ fontSize: 10, color: subjectMeta.accentColor, fontWeight: 700 }}>
                  5 Options
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                {LAB_FEATURE_OPTIONS.map((opt) => {
                  const OptIcon = opt.icon;
                  const isSelected = activeTab === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setActiveTab(opt.id);
                        setIsFeatureDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: isSelected ? `1px solid ${subjectMeta.accentColor}55` : '1px solid transparent',
                        background: isSelected ? `linear-gradient(90deg, ${subjectMeta.accentColor}22, rgba(255,255,255,0.03))` : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#CBD5E1',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isSelected ? subjectMeta.accentColor : 'rgba(255,255,255,0.06)',
                          color: isSelected ? '#000' : '#8892B0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <OptIcon size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#fff' : '#E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{opt.label}</span>
                            <span style={{
                              fontSize: 9.5,
                              padding: '1px 5px',
                              borderRadius: 6,
                              background: isSelected ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.06)',
                              color: isSelected ? subjectMeta.accentColor : '#8892B0',
                              fontWeight: 600,
                              flexShrink: 0
                            }}>
                              {opt.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#7E8B9F', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opt.subtitle}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check size={16} color={subjectMeta.accentColor} style={{ flexShrink: 0, marginLeft: 6 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Quick-Access Tab Strip (Screens >= 768px) */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {LAB_FEATURE_OPTIONS.map(opt => {
              const OptIcon = opt.icon;
              const isSelected = activeTab === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveTab(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: isSelected ? `1px solid ${subjectMeta.accentColor}` : '1px solid rgba(255,255,255,0.06)',
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: isSelected ? subjectMeta.accentColor : '#8892B0',
                    fontSize: 12.5,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  <OptIcon size={14} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', background: '#000' }}>
        
        {/* TAB 1: PhET Simulation iFrame View */}
        {activeTab === 'sim' && (
          <div style={{
            width: '100%',
            height: isMobile ? 'clamp(440px, calc(100svh - 220px), 640px)' : 740,
            minHeight: isMobile ? 420 : 700,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Mobile Touch & Orientation Tip Pill */}
            {isMobile && showMobileTip && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                padding: '8px 12px',
                margin: '8px 10px 4px',
                color: '#DDE3F2',
                fontSize: 12,
                gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                zIndex: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <Smartphone size={16} color={subjectMeta.accentColor} style={{ flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.35 }}>
                    <strong>Tip:</strong> Rotate to <strong>Landscape</strong> or tap <strong>Fullscreen</strong> for best PhET touch experience.
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={handleToggleFullscreen}
                    style={{
                      background: subjectMeta.accentColor,
                      color: '#000',
                      fontWeight: 800,
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isFullscreen ? 'Exit' : 'Fullscreen'}
                  </button>
                  <button
                    onClick={() => setShowMobileTip(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#647298',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: '#090B13',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                zIndex: 10
              }}>
                <RefreshCw size={36} color={subjectMeta.accentColor} style={{ animation: 'spin 1.2s linear infinite' }} />
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
                    Loading {activeSim?.title}...
                  </h3>
                  <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0 0' }}>
                    Initializing Vedika Interactive STEM Engine
                  </p>
                </div>
              </div>
            )}

            <div style={{ width: '100%', height: '100%', flex: 1, overflow: 'hidden', position: 'relative' }}>
              <iframe
                ref={iframeRef}
                src={`/api/phet-proxy?sim=${activeSim?.id}&url=${encodeURIComponent(activeSim?.embedUrl || '')}`}
                title={activeSim?.title}
                onLoad={() => setIsLoading(false)}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                style={{
                  width: '100%',
                  height: isMobile ? '100%' : 'calc(100% + 44px)',
                  marginBottom: isMobile ? 0 : '-44px',
                  minHeight: isMobile ? 420 : 744,
                  border: 'none',
                  background: '#000',
                  touchAction: 'manipulation'
                }}
              />

              {/* Mobile Quick Floating Fullscreen FAB */}
              {isMobile && (
                <button
                  onClick={handleToggleFullscreen}
                  aria-label="Toggle Fullscreen"
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    zIndex: 9,
                    background: 'rgba(11, 15, 25, 0.92)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${subjectMeta.accentColor}77`,
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
                  }}
                >
                  <Maximize2 size={13} color={subjectMeta.accentColor} />
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Objectives & Guided Lab Steps */}
        {activeTab === 'objectives' && (
          <div style={{ padding: isMobile ? '16px 12px' : 28, background: '#0A0E17', overflowY: 'auto', flex: 1 }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: isMobile ? 22 : 28 }}>🔬</span>
                <div>
                  <h2 style={{ color: '#fff', fontSize: isMobile ? 18 : 22, fontWeight: 800, margin: 0 }}>
                    {activeSim?.title}
                  </h2>
                  <p style={{ color: '#aaa', fontSize: isMobile ? 13 : 14, margin: '2px 0 0 0' }}>
                    {activeSim?.description}
                  </p>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 12,
                padding: isMobile ? '14px 16px' : 20,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: 20
              }}>
                <h4 style={{ color: subjectMeta.accentColor, fontSize: isMobile ? 15 : 16, fontWeight: 700, margin: '0 0 12px 0' }}>
                  🎯 Core Learning Objectives
                </h4>
                <ul style={{ paddingLeft: 18, margin: 0, color: '#DDD', fontSize: isMobile ? 13 : 14, lineHeight: 1.7 }}>
                  {activeSim?.objectives?.map((obj, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                <button
                  onClick={() => setActiveTab('sim')}
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    background: subjectMeta.gradient,
                    color: '#fff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  Return to Interactive Canvas →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Formulas & Principles */}
        {activeTab === 'formulas' && (
          <div style={{ padding: isMobile ? '16px 12px' : 28, background: '#0A0E17', overflowY: 'auto', flex: 1 }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <h3 style={{ color: '#fff', fontSize: isMobile ? 18 : 20, fontWeight: 800, marginBottom: 16 }}>
                📐 Key Equations & Scientific Principles
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 14
              }}>
                {activeSim?.keyFormulas?.map((formula, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: `1px solid ${subjectMeta.accentColor}`,
                    borderRadius: 12,
                    padding: isMobile ? '14px 16px' : 18,
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: 11.5, color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>
                      Formula #{idx + 1}
                    </span>
                    <h4 style={{ color: '#fff', fontSize: isMobile ? 16 : 18, fontWeight: 700, margin: '8px 0 0 0', fontFamily: 'monospace' }}>
                      {formula}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Viva & Self-Test Questions */}
        {activeTab === 'questions' && (
          <div style={{ padding: isMobile ? '16px 12px' : 28, background: '#0A0E17', overflowY: 'auto', flex: 1 }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <h3 style={{ color: '#fff', fontSize: isMobile ? 18 : 20, fontWeight: 800, marginBottom: 16 }}>
                ❓ Interactive Viva Questions for {activeSim?.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeSim?.guidedQuestions?.map((q, i) => (
                  <div key={i} style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: isMobile ? '14px 16px' : 18
                  }}>
                    <h4 style={{ color: subjectMeta.accentColor, fontSize: isMobile ? 14 : 15, fontWeight: 700, margin: '0 0 10px 0' }}>
                      Q{i + 1}: {q}
                    </h4>
                    <button
                      onClick={() => {
                        setActiveTab('ai');
                        handleAskAi(`Answer Viva Question Q${i+1}: ${q}`, {
                          vivaQuestion: q,
                          questionIndex: i + 1
                        });
                      }}
                      style={{
                        width: isMobile ? '100%' : 'auto',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        padding: '8px 14px',
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <Bot size={14} color={subjectMeta.accentColor} />
                      Ask Vedika AI Tutor for Guided Solution
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Integrated Vedika AI Tutor Assistant */}
        {activeTab === 'ai' && (
          <div style={{ padding: isMobile ? '14px 10px' : 24, background: '#0A0E17', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 450 }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aiChat.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: isMobile ? '94%' : '85%',
                    background: msg.sender === 'user' ? subjectMeta.accentColor : 'rgba(255, 255, 255, 0.07)',
                    color: '#fff',
                    padding: isMobile ? '11px 14px' : '14px 18px',
                    borderRadius: 12,
                    fontSize: isMobile ? 13 : 14,
                    lineHeight: 1.6,
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12.5, opacity: 0.9, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {msg.sender === 'user' ? 'You' : (
                      <>
                        <Bot size={15} style={{ color: subjectMeta.accentColor }} />
                        <span>Vedika AI Science Tutor</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: isMobile ? 13 : 13.5, lineHeight: 1.6 }}>
                    {msg.sender === 'ai' ? (
                      <MathEquationRenderer content={msg.text} />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    )}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div style={{ alignSelf: 'flex-start', color: subjectMeta.accentColor, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                  Vedika AI Tutor is analyzing experiment principles and preparing guidance...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                placeholder={`Ask Vedika AI about ${activeSim?.title}...`}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: isMobile ? '10px 12px' : '12px 16px',
                  borderRadius: 8,
                  fontSize: isMobile ? 13 : 14,
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleAskAi()}
                style={{
                  background: subjectMeta.gradient,
                  color: '#fff',
                  border: 'none',
                  padding: isMobile ? '0 16px' : '0 20px',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0
                }}
              >
                <Send size={15} />
                {!isMobile && 'Ask AI'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
