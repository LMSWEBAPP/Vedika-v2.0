'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Brain, Code, Zap, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import VedikaParticleBot from '@/components/VedikaParticleBot';
import './vedika-ai.css';

const CARDS = [
  {
    id: 'ask',
    title: 'Ask Vedika',
    badge: 'GENERAL AI TUTOR',
    tagline: 'Concepts & Doubt Solving',
    description: 'Your personal AI tutor for concepts, syllabus explanations, doubt solving, and interactive study flashcards.',
    btnText: 'Start Chatting',
    Icon: Brain,
    url: '/vedika-ai/ask',
    accent: '#A855F7',
    accentRgb: '168, 85, 247',
    accentGlow: 'rgba(168, 85, 247, 0.45)',
    accentGlowSoft: 'rgba(168, 85, 247, 0.22)',
    botImage: '/vedika-bot-ask.png'
  },
  {
    id: 'code',
    title: 'Code with Vedika',
    badge: 'CODING COMPANION',
    tagline: 'Pair Programming & Debugging',
    description: 'Your dedicated programming companion to write clean code, debug tricky syntax, explain algorithms, and run unit tests.',
    btnText: 'Start Coding',
    Icon: Code,
    url: '/vedika-ai/code',
    accent: '#3B82F6',
    accentRgb: '59, 130, 246',
    accentGlow: 'rgba(59, 130, 246, 0.45)',
    accentGlowSoft: 'rgba(59, 130, 246, 0.22)',
    botImage: '/vedika-bot-code.png'
  },
  {
    id: 'puzzle',
    title: 'Code Puzzles',
    badge: '3D VISUAL CHALLENGES',
    tagline: 'Algorithmic Visualizer',
    description: 'Solve gamified algorithmic puzzles and visualize stack frames, heaps, and dynamic arrays in real-time 3D.',
    btnText: 'Play Puzzles',
    Icon: Zap,
    url: '/vedika-ai/puzzle',
    accent: '#F59E0B',
    accentRgb: '245, 158, 11',
    accentGlow: 'rgba(245, 158, 11, 0.45)',
    accentGlowSoft: 'rgba(245, 158, 11, 0.22)',
    botImage: '/vedika-bot-puzzle.png'
  },
  {
    id: 'viva',
    title: 'Viva & Interview',
    badge: 'VOICE VIVA & EXAMS',
    tagline: 'Real-time AI Mock Interviews',
    description: 'Ace engineering vivas and technical interviews with live AI speech interaction, real-time rubric feedback, and scoring.',
    btnText: 'Start Interview',
    Icon: GraduationCap,
    url: '/viva-interview',
    accent: '#10B981',
    accentRgb: '16, 185, 129',
    accentGlow: 'rgba(16, 185, 129, 0.45)',
    accentGlowSoft: 'rgba(16, 185, 129, 0.22)',
    botImage: '/vedika-bot-viva.png'
  }
];

const initialHubState = {
  activeIdx: 0,
  isSettled: false,
  isNavigating: false,
  isWarping: false
};

function hubReducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      if (state.isNavigating || state.activeIdx === action.payload) return state;
      return { ...state, activeIdx: action.payload, isSettled: false, isWarping: false };
    case 'PREV_TAB':
      if (state.isNavigating) return state;
      return {
        ...state,
        activeIdx: state.activeIdx > 0 ? state.activeIdx - 1 : action.payload - 1,
        isSettled: false,
        isWarping: false
      };
    case 'NEXT_TAB':
      if (state.isNavigating) return state;
      return {
        ...state,
        activeIdx: state.activeIdx < action.payload - 1 ? state.activeIdx + 1 : 0,
        isSettled: false,
        isWarping: false
      };
    case 'SET_SETTLED':
      return { ...state, isSettled: true };
    case 'START_NAVIGATING':
      return { ...state, isNavigating: true };
    case 'START_WARPING':
      return { ...state, isWarping: true };
    default:
      return state;
  }
}

export default function VedikaAIHub() {
  const router = useRouter();
  const [state, dispatch] = useReducer(hubReducer, initialHubState);
  const { activeIdx, isSettled, isNavigating, isWarping } = state;
  const touchStartRef = useRef({ x: 0, y: 0 });

  const cards = CARDS;
  const activeCard = cards[activeIdx] || cards[0];

  const handleBotSettled = useCallback(() => {
    dispatch({ type: 'SET_SETTLED' });
  }, []);

  // Preload all 4 robot images and prefetch routes on mount for instantaneous transitions
  useEffect(() => {
    CARDS.forEach((c) => {
      const pre = new Image();
      pre.src = c.botImage;
      if (router?.prefetch) {
        try {
          router.prefetch(c.url);
        } catch (e) {}
      }
    });
  }, [router]);

  // Tab click selects tab and morphs the particle robot smoothly without page navigation
  const handleTabClick = (idx) => {
    if (isNavigating) return;
    dispatch({ type: 'SET_TAB', payload: idx });
  };

  // Navigate into destination page ONLY when action button is clicked
  const handleEnterPage = (url) => {
    if (isNavigating) return;
    dispatch({ type: 'START_NAVIGATING' });

    const delay = isSettled ? 0 : 180;
    setTimeout(() => {
      dispatch({ type: 'START_WARPING' });
      setTimeout(() => {
        router.push(url);
      }, 340);
    }, delay);
  };

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_TAB', payload: cards.length });
  }, [cards.length]);

  const handleNext = useCallback(() => {
    dispatch({ type: 'NEXT_TAB', payload: cards.length });
  }, [cards.length]);

  // Keyboard arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        handleNext();
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch swipe support
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    if (Math.abs(dx) > 45) {
      if (dx > 0) handlePrev();
      else handleNext();
    }
  };

  return (
    <div
      className="vedika-ai-hub-container"
      style={{
        '--active-accent': activeCard.accent,
        '--active-accent-rgb': activeCard.accentRgb,
        '--active-accent-glow': activeCard.accentGlow,
        '--active-accent-glow-soft': activeCard.accentGlowSoft
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sleek Top Neon Progress Bar when navigating / compiling */}
      {isNavigating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          zIndex: 99999,
          background: `linear-gradient(90deg, transparent, ${activeCard.accent}, #A855F7, transparent)`,
          boxShadow: `0 0 14px ${activeCard.accent}`
        }} />
      )}

      {/* Background ambient mesh */}
      <div className="vedika-ai-bg-mesh" />

      {/* Main 2-Column Hub Layout */}
      <div className="vedika-ai-hub-inner">

        {/* LEFT COLUMN: Header with Back Button, Expanding Tab Carousel & Navigation */}
        <div className="vedika-ai-left-col">
          {/* Header */}
          <header className="vedika-ai-header">
            <div className="vedika-ai-top-row">
              <button
                type="button"
                className="vedika-ai-back-btn"
                onClick={() => router.push('/dashboard')}
                aria-label="Back to Dashboard"
              >
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </button>
            </div>

            <h1 className="vedika-ai-main-title">
              <span className="vedika-ai-title-gradient">Assistant Hub</span>
            </h1>
            <div className="vedika-ai-subtitle-wrap">
              <p className="vedika-ai-subtitle">Learn. Build. Grow.</p>
            </div>
          </header>

          {/* Unified Expanding Tab Carousel */}
          <div className="vedika-ai-accordion-carousel" role="region" aria-label="AI Assistants Carousel">
            {cards.map((card, idx) => {
              const isActive = idx === activeIdx;
              const { Icon } = card;

              return (
                <div
                  key={card.id}
                  className={`vedika-ai-carousel-card ${isActive ? 'active' : 'collapsed'}`}
                  style={{
                    '--card-accent': card.accent,
                    '--card-rgb': card.accentRgb,
                    '--card-glow': card.accentGlow,
                    '--card-glow-soft': card.accentGlowSoft
                  }}
                  onClick={() => !isActive && handleTabClick(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isActive) {
                      handleTabClick(idx);
                    }
                  }}
                  aria-label={`${card.title} - ${isActive ? 'Selected' : 'Click to select'}`}
                >
                  {isActive ? (
                    <div className="vedika-ai-card-expanded-content">
                      <div className="vedika-ai-card-top-row">
                        <div className="vedika-ai-badge">
                          <Icon size={13} style={{ color: card.accent }} />
                          <span>{card.badge}</span>
                        </div>
                        <span className="vedika-ai-card-index-indicator">0{idx + 1} / 0{cards.length}</span>
                      </div>

                      <div className="vedika-ai-card-body">
                        <div className="vedika-ai-card-title-group">
                          <div className="vedika-ai-card-icon-avatar">
                            <Icon size={20} style={{ color: card.accent }} />
                          </div>
                          <div>
                            <h2 className="vedika-ai-detail-title">{card.title}</h2>
                            <span className="vedika-ai-card-tagline">{card.tagline}</span>
                          </div>
                        </div>

                        <p className="vedika-ai-detail-desc">{card.description}</p>
                      </div>

                      <div className="vedika-ai-action-row">
                        <button
                          type="button"
                          className={`vedika-ai-launch-btn ${isNavigating ? 'entering' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnterPage(card.url);
                          }}
                          disabled={isNavigating}
                        >
                          {isNavigating ? (
                            <>
                              <div className="vedika-ai-btn-spinner" />
                              <span>Entering {card.title}...</span>
                            </>
                          ) : (
                            <>
                              <span>{card.btnText}</span>
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="vedika-ai-card-collapsed-content">
                      <div className="vedika-shrunken-card-icon">
                        <Icon size={18} style={{ color: card.accent }} />
                      </div>

                      <div className="vedika-ai-collapsed-title-wrap">
                        <span className="vedika-ai-collapsed-title">{card.title}</span>
                      </div>

                      <div className="vedika-shrunken-card-arrow">
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination & Nav Controls */}
          <div className="vedika-ai-footer-controls">
            <button
              type="button"
              className="vedika-ai-nav-arrow"
              onClick={handlePrev}
              disabled={isNavigating}
              aria-label="Previous Assistant"
            >
              <ChevronLeft size={17} />
            </button>

            <div className="vedika-ai-dots-wrap">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  className={`vedika-ai-nav-dot ${idx === activeIdx ? 'active' : ''}`}
                  onClick={() => handleTabClick(idx)}
                  disabled={isNavigating}
                  aria-label={`Go to ${card.title}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="vedika-ai-nav-arrow"
              onClick={handleNext}
              disabled={isNavigating}
              aria-label="Next Assistant"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Particle Bot with Light Shimmer Glow & Neon Quotes */}
        <div className="vedika-ai-right-col">
          {/* Multi-layered Shimmer Glow Aura behind bot */}
          <div className="vedika-ai-shimmer-glow-bg" />
          <div className="vedika-ai-shimmer-glow-radial" />
          <div className="vedika-ai-shimmer-glow-pulse" />

          {/* Interactive Particle Bot Canvas */}
          <div className="vedika-ai-bot-wrapper">
            <VedikaParticleBot
              src={activeCard.botImage}
              colorMode="vibrant"
              width={520}
              height={560}
              isEntering={isWarping}
              onSettled={handleBotSettled}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
