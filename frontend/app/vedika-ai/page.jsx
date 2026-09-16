'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Brain, Code, Zap, GraduationCap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
    botImage: '/vedika-bot-ask.png',
    quotes: [
      { text: 'Curious Minds GROW HERE <3', top: '12%', right: '10%' },
      { text: 'ASK EXPLORE LEARN <3', bottom: '14%', right: '14%' }
    ],
    doodles: ['lightbulb', 'book', 'sparkles']
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
    botImage: '/vedika-bot-code.png',
    quotes: [
      { text: 'BUILD DEBUG LEARN <3', top: '14%', right: '10%' }
    ],
    doodles: ['codeWindow', 'checklist', 'sparkles']
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
    botImage: '/vedika-bot-puzzle.png',
    quotes: [
      { text: 'PRACTICE SOLVE IMPROVE <3', top: '14%', right: '10%' }
    ],
    doodles: ['puzzle', 'ideaList', 'sparkles']
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
    botImage: '/vedika-bot-viva.png',
    quotes: [
      { text: 'PREPARE PRACTICE GET CONFIDENT <3', top: '14%', right: '8%' }
    ],
    doodles: ['speech', 'gradCap', 'checklist']
  }
];

export default function VedikaAIHub() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isSettled, setIsSettled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const cards = CARDS;

  const activeCard = cards[activeIdx] || cards[0];

  const handleBotSettled = useCallback(() => {
    setIsSettled(true);
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

  // ONLY switch tabs on click (never on hover!)
  const handleTabClick = (idx) => {
    if (isNavigating) return;
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      setIsSettled(false);
      setIsWarping(false);
    } else {
      // Clicking the already active tab card launches into that page
      handleEnterPage(cards[idx].url);
    }
  };

  // Navigate into destination page only after particle animation
  const handleEnterPage = (url) => {
    if (isNavigating) return;
    setIsNavigating(true);

    // Wait briefly if particles are actively in transit, then trigger warp acceleration and route
    const delay = isSettled ? 0 : 200;
    setTimeout(() => {
      setIsWarping(true);
      setTimeout(() => {
        router.push(url);
      }, 340);
    }, delay);
  };

  const handlePrev = useCallback(() => {
    if (isNavigating) return;
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : cards.length - 1));
    setIsSettled(false);
    setIsWarping(false);
  }, [cards.length, isNavigating]);

  const handleNext = useCallback(() => {
    if (isNavigating) return;
    setActiveIdx((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
    setIsSettled(false);
    setIsWarping(false);
  }, [cards.length, isNavigating]);

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

              <div className="vedika-ai-brand-pill">
                <Sparkles size={12} style={{ color: activeCard.accent }} />
                <span>VEDIKA AI TUTOR</span>
              </div>
            </div>

            <h1 className="vedika-ai-main-title">
              VEDIKA AI <span className="vedika-ai-title-gradient">ASSISTANT HUB</span>
            </h1>
            <div className="vedika-ai-subtitle-wrap">
              <p className="vedika-ai-subtitle">Learn. Build. Grow.</p>
              <div className="vedika-ai-subtitle-glow-bar" />
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

          {/* Thematic Floating Neon Quotes & Doodles */}
          <div className="vedika-ai-doodles-layer">
            {activeCard.quotes.map((q, qIdx) => (
              <div
                key={`${activeCard.id}-q-${qIdx}`}
                className="vedika-ai-quote-pill"
                style={{
                  top: q.top || 'auto',
                  bottom: q.bottom || 'auto',
                  left: q.left || 'auto',
                  right: q.right || 'auto'
                }}
              >
                <span>{q.text}</span>
              </div>
            ))}

            {/* Neon Decorative Doodles matching the mockup images */}
            {activeCard.id === 'ask' && (
              <>
                {/* Lightbulb doodle above bot */}
                <div className="vedika-neon-doodle" style={{ top: '16%', left: '26%' }}>
                  <svg width="38" height="46" viewBox="0 0 38 46" fill="none">
                    <path d="M19 6V2M6 19H2M36 19H32M8 8L5 5M30 8L33 5" stroke={activeCard.accent} strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="19" cy="22" r="11" stroke={activeCard.accent} strokeWidth="2.2"/>
                    <path d="M15 33H23M16 37H22M17 41H21" stroke={activeCard.accent} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                {/* Open book doodle */}
                <div className="vedika-neon-doodle" style={{ top: '32%', left: '12%' }}>
                  <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
                    <path d="M22 6C16 3 8 3 3 6V28C8 25 16 25 22 28C28 25 36 25 41 28V6C36 3 28 3 22 6Z" stroke={activeCard.accent} strokeWidth="2.2" strokeLinejoin="round"/>
                    <path d="M22 6V28M8 12H16M8 17H14M28 12H36M28 17H34" stroke={activeCard.accent} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                {/* Twinkle stars */}
                <div className="vedika-neon-doodle" style={{ top: '24%', right: '28%' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" fill={activeCard.accent} />
                  </svg>
                </div>
                <div className="vedika-neon-doodle" style={{ bottom: '28%', left: '16%' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" fill={activeCard.accent} />
                  </svg>
                </div>
              </>
            )}

            {activeCard.id === 'code' && (
              <>
                {/* Code window doodle */}
                <div className="vedika-neon-doodle" style={{ top: '16%', left: '20%' }}>
                  <svg width="52" height="38" viewBox="0 0 52 38" fill="none">
                    <rect x="2" y="2" width="48" height="34" rx="6" stroke={activeCard.accent} strokeWidth="2.2"/>
                    <path d="M15 15L9 20L15 25M37 15L43 20L37 25M28 12L24 27" stroke={activeCard.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Checklist doodle */}
                <div className="vedika-neon-doodle" style={{ top: '38%', left: '10%' }}>
                  <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
                    <rect x="2" y="2" width="30" height="38" rx="4" stroke={activeCard.accent} strokeWidth="2"/>
                    <path d="M7 12L10 15L15 10M18 12H27M7 22L10 25L15 20M18 22H27M7 32L10 35L15 30M18 32H27" stroke={activeCard.accent} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                {/* Star */}
                <div className="vedika-neon-doodle" style={{ top: '20%', right: '26%' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" fill={activeCard.accent} />
                  </svg>
                </div>
              </>
            )}

            {activeCard.id === 'puzzle' && (
              <>
                {/* Puzzle piece doodle */}
                <div className="vedika-neon-doodle" style={{ top: '20%', left: '14%' }}>
                  <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                    <path d="M14 6H20C21.5 3 24.5 3 26 6H32C34.2 6 36 7.8 36 10V16C39 17.5 39 20.5 36 22V28C36 30.2 34.2 32 32 32H26C24.5 35 21.5 35 20 32H14C11.8 32 10 30.2 10 28V22C7 20.5 7 17.5 10 16V10C10 7.8 11.8 6 14 6Z" stroke={activeCard.accent} strokeWidth="2.2" strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Checklist & bulb doodle */}
                <div className="vedika-neon-doodle" style={{ top: '22%', right: '22%' }}>
                  <svg width="36" height="46" viewBox="0 0 36 46" fill="none">
                    <rect x="2" y="2" width="32" height="42" rx="5" stroke={activeCard.accent} strokeWidth="2"/>
                    <circle cx="18" cy="14" r="5" stroke={activeCard.accent} strokeWidth="1.8"/>
                    <path d="M15 21H21M8 29L11 32L16 27M19 29H28M8 37L11 40L16 35M19 37H28" stroke={activeCard.accent} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="vedika-neon-doodle" style={{ bottom: '26%', left: '18%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9L12 0Z" fill={activeCard.accent} />
                  </svg>
                </div>
              </>
            )}

            {activeCard.id === 'viva' && (
              <>
                {/* Speech bubble doodle */}
                <div className="vedika-neon-doodle" style={{ top: '18%', left: '16%' }}>
                  <svg width="44" height="38" viewBox="0 0 44 38" fill="none">
                    <path d="M6 6H38C40.2 6 42 7.8 42 10V26C42 28.2 40.2 30 38 30H18L10 36V30H6C3.8 30 2 28.2 2 26V10C2 7.8 3.8 6 6 6Z" stroke={activeCard.accent} strokeWidth="2.2" strokeLinejoin="round"/>
                    <circle cx="14" cy="18" r="2.2" fill={activeCard.accent} />
                    <circle cx="22" cy="18" r="2.2" fill={activeCard.accent} />
                    <circle cx="30" cy="18" r="2.2" fill={activeCard.accent} />
                  </svg>
                </div>
                {/* Graduation cap doodle */}
                <div className="vedika-neon-doodle" style={{ top: '16%', right: '22%' }}>
                  <svg width="46" height="36" viewBox="0 0 46 36" fill="none">
                    <path d="M23 4L42 12L23 20L4 12L23 4Z" stroke={activeCard.accent} strokeWidth="2.2" strokeLinejoin="round"/>
                    <path d="M10 15V24C10 24 16 30 23 30C30 30 36 24 36 24V15" stroke={activeCard.accent} strokeWidth="2" strokeLinecap="round"/>
                    <path d="M39 13.5V26" stroke={activeCard.accent} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                {/* Checklist card doodle */}
                <div className="vedika-neon-doodle" style={{ top: '38%', right: '16%' }}>
                  <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
                    <rect x="2" y="2" width="30" height="38" rx="4" stroke={activeCard.accent} strokeWidth="2"/>
                    <path d="M7 12L10 15L15 10M18 12H27M7 22L10 25L15 20M18 22H27M7 32L10 35L15 30M18 32H27" stroke={activeCard.accent} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
              </>
            )}
          </div>

          {/* Interactive Particle Bot Canvas */}
          <div className="vedika-ai-bot-wrapper">
            <VedikaParticleBot
              key={activeCard.botImage}
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
