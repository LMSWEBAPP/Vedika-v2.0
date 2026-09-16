'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Calculator, Atom, FlaskConical, Dna, ChevronLeft, ChevronRight, Sparkles, Compass, Flame, Orbit } from 'lucide-react';
import VedikaParticleBot from '@/components/VedikaParticleBot';
import './vedika-labs.css';

const LAB_CARDS = [
  {
    id: 'math',
    title: 'Math Lab',
    badge: '3D GEOMETRY & CAS SIMULATOR',
    tagline: 'Calculus, Fractals & Dynamic Proofs',
    description: 'Explore interactive 2D/3D graphing, parametric Lorenz strange attractors, Fourier harmonic transformations, and AI LaTeX equation visual solvers.',
    btnText: 'Enter Math Lab',
    Icon: Calculator,
    url: '/vedika-labs/math',
    accent: '#60A5FA',
    accentRgb: '96, 165, 250',
    accentGlow: 'rgba(96, 165, 250, 0.45)',
    accentGlowSoft: 'rgba(96, 165, 250, 0.22)',
    botImage: '/vedika-bot-math.png',
    tags: ['Algebra & Calculus', '3D Geometry', 'Integral Calculus', 'Statistical Dynamics'],
    quotes: [
      { text: '∫ x² dx & y = mx + b <3', top: '12%', right: '8%' },
      { text: 'ALGEBRA • CALCULUS • GEOMETRY <3', bottom: '14%', right: '12%' }
    ]
  },
  {
    id: 'physics',
    title: 'Physics Lab',
    badge: 'QUANTUM & CLASSICAL SIMULATIONS',
    tagline: 'PhET Simulators, Vectors & Waves',
    description: 'Simulate forces, gravity pendulum vectors, spring oscillations, projectile trajectories, wave optics interference, and Ohm\'s Law electrical circuits.',
    btnText: 'Enter Physics Lab',
    Icon: Atom,
    url: '/vedika-labs/physics',
    accent: '#38BDF8',
    accentRgb: '56, 189, 248',
    accentGlow: 'rgba(56, 189, 248, 0.45)',
    accentGlowSoft: 'rgba(56, 189, 248, 0.22)',
    botImage: '/vedika-bot-physics.png',
    tags: ['Newtonian Mechanics', 'Thermodynamics & Waves', 'F = ma Dynamics', "Newton's Cradle & Planets"],
    quotes: [
      { text: 'F = ma & ORBITAL PHYSICS <3', top: '12%', right: '8%' },
      { text: "NEWTON'S CRADLE & FORCES <3", bottom: '14%', right: '12%' }
    ]
  },
  {
    id: 'chemistry',
    title: 'Chemistry Lab',
    badge: 'MOLECULAR DYNAMICS & KINETICS',
    tagline: 'Atomic Orbitals & Chemical Reactions',
    description: 'Build 3D Bohr atomic structures, simulate kinetic gas chambers, run acid-base titrations, observe chemical diffusion, and balance reaction equations.',
    btnText: 'Enter Chemistry Lab',
    Icon: FlaskConical,
    url: '/vedika-labs/chemistry',
    accent: '#C084FC',
    accentRgb: '192, 132, 252',
    accentGlow: 'rgba(192, 132, 252, 0.45)',
    accentGlowSoft: 'rgba(192, 132, 252, 0.22)',
    botImage: '/vedika-bot-chemistry.png',
    tags: ['Organic Synthesis', 'Inorganic Chemistry', 'Physical Reactions', 'Molecular Dynamics'],
    quotes: [
      { text: 'MOLECULAR SYNTHESIS & REACTION <3', top: '12%', right: '8%' },
      { text: 'ORGANIC & PHYSICAL CHEMISTRY <3', bottom: '14%', right: '12%' }
    ]
  },
  {
    id: 'biology',
    title: 'Biology Lab',
    badge: 'GENETICS & CELLULAR BIOLOGY',
    tagline: '3D Organelles & DNA Double Helices',
    description: 'Interact with 3D animal and plant cell organelles, manipulate nucleotide base-pairs on rotating DNA double-helices, and track ecological food webs.',
    btnText: 'Enter Biology Lab',
    Icon: Dna,
    url: '/vedika-labs/biology',
    accent: '#34D399',
    accentRgb: '52, 211, 153',
    accentGlow: 'rgba(52, 211, 153, 0.45)',
    accentGlowSoft: 'rgba(52, 211, 153, 0.22)',
    botImage: '/vedika-bot-biology.png',
    tags: ['Genetics & DNA Helix', 'Cell Biology & Organelles', 'Plant Sprout Ecology', 'Microscopic Analysis'],
    quotes: [
      { text: 'DNA HELIX & GENETIC CODE <3', top: '12%', right: '8%' },
      { text: 'CELL BIOLOGY & ECOLOGY <3', bottom: '14%', right: '12%' }
    ]
  }
];

const initialLabsState = {
  activeIdx: 1, // Default to Physics Lab
  isSettled: false,
  isNavigating: false,
  isWarping: false
};

function labsReducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      if (state.isNavigating || state.activeIdx === action.payload) return state;
      return { ...state, activeIdx: action.payload, isSettled: false, isWarping: false, isNavigating: false };
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
      return { ...state, isNavigating: true, isWarping: true };
    default:
      return state;
  }
}

export default function VedikaLabsHub() {
  const router = useRouter();
  const [state, dispatch] = useReducer(labsReducer, initialLabsState);
  const { activeIdx, isSettled, isNavigating, isWarping } = state;
  const touchStartRef = useRef({ x: 0, y: 0 });

  const cards = LAB_CARDS;
  const activeCard = cards[activeIdx] || cards[0];

  const handleBotSettled = useCallback(() => {
    dispatch({ type: 'SET_SETTLED' });
  }, []);

  // Preload sub-lab routes on mount
  useEffect(() => {
    cards.forEach((c) => {
      if (router?.prefetch) {
        try {
          router.prefetch(c.url);
        } catch (e) {}
      }
    });
  }, [cards, router]);

  // Tab click selects the lab cleanly
  const handleTabClick = (idx) => {
    dispatch({ type: 'SET_TAB', payload: idx });
  };

  // Launch page with smooth warp dissolution
  const handleEnterPage = (url) => {
    if (isNavigating) return;
    dispatch({ type: 'START_NAVIGATING' });
    setTimeout(() => {
      router.push(url);
    }, 280);
  };

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_TAB', payload: cards.length });
  }, [cards.length]);

  const handleNext = useCallback(() => {
    dispatch({ type: 'NEXT_TAB', payload: cards.length });
  }, [cards.length]);


  // Keyboard navigation
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
      className="vedika-lab-hub-container"
      style={{
        '--active-accent': activeCard.accent,
        '--active-accent-rgb': activeCard.accentRgb,
        '--active-accent-glow': activeCard.accentGlow,
        '--active-accent-glow-soft': activeCard.accentGlowSoft
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sleek Top Neon Progress Bar when entering */}
      {isNavigating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          zIndex: 99999,
          background: `linear-gradient(90deg, transparent, ${activeCard.accent}, #FFFFFF, transparent)`,
          boxShadow: `0 0 14px ${activeCard.accent}`
        }} />
      )}

      {/* Ambient background mesh */}
      <div className="vedika-lab-bg-mesh" />

      {/* 2-Column Hub Layout */}
      <div className="vedika-lab-hub-inner">

        {/* LEFT COLUMN: Header with Back Button, Expanding Tab Carousel & Navigation */}
        <div className="vedika-lab-left-col">
          {/* Header */}
          <header className="vedika-lab-header">
            <div className="vedika-lab-top-row">
              <button
                type="button"
                className="vedika-lab-back-btn"
                onClick={() => router.push('/dashboard')}
                aria-label="Back to Dashboard"
              >
                <ArrowLeft size={15} />
                <span>Back to Dashboard</span>
              </button>

              <div className="vedika-lab-brand-pill">
                <Sparkles size={12} style={{ color: activeCard.accent }} />
                <span>VEDIKA 3D SCIENCE SIMULATORS</span>
              </div>
            </div>

            <h1 className="vedika-lab-main-title">
              VEDIKA SCIENCE <span className="vedika-lab-title-gradient">VIRTUAL LABS</span>
            </h1>
            <div className="vedika-lab-subtitle-wrap">
              <p className="vedika-lab-subtitle">Explore interactive HTML5 PhET simulations & WebGL environments with built-in AI Science Tutor.</p>
              <div className="vedika-lab-subtitle-glow-bar" />
            </div>
          </header>

          {/* Unified Expanding Tab Carousel */}
          <div className="vedika-lab-accordion-carousel" role="region" aria-label="Science Labs Carousel">
            {cards.map((card, idx) => {
              const isActive = idx === activeIdx;
              const { Icon } = card;

              return (
                <div
                  key={card.id}
                  className={`vedika-lab-carousel-card ${isActive ? 'active' : 'collapsed'}`}
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
                    <div className="vedika-lab-card-expanded-content">
                      <div className="vedika-lab-card-top-row">
                        <div className="vedika-lab-badge">
                          <Icon size={13} style={{ color: card.accent }} />
                          <span>{card.badge}</span>
                        </div>
                        <span className="vedika-lab-card-index-indicator">0{idx + 1} / 0{cards.length}</span>
                      </div>

                      <div className="vedika-lab-card-body">
                        <div className="vedika-lab-card-title-group">
                          <div className="vedika-lab-card-icon-avatar">
                            <Icon size={20} style={{ color: card.accent }} />
                          </div>
                          <div>
                            <h2 className="vedika-lab-detail-title">{card.title}</h2>
                            <span className="vedika-lab-card-tagline">{card.tagline}</span>
                          </div>
                        </div>

                        <p className="vedika-lab-detail-desc">{card.description}</p>

                        <div className="vedika-lab-tags-row">
                          {card.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="vedika-lab-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="vedika-lab-action-row">
                        <button
                          type="button"
                          className={`vedika-lab-launch-btn ${isNavigating ? 'entering' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnterPage(card.url);
                          }}
                          disabled={isNavigating}
                        >
                          {isNavigating ? (
                            <>
                              <div className="vedika-lab-btn-spinner" />
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
                    <div className="vedika-lab-card-collapsed-content">
                      <div className="vedika-lab-shrunken-card-icon">
                        <Icon size={18} style={{ color: card.accent }} />
                      </div>

                      <div className="vedika-lab-collapsed-title-wrap">
                        <span className="vedika-lab-collapsed-title">{card.title}</span>
                      </div>

                      <div className="vedika-lab-collapsed-arrow">
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination & Nav Controls */}
          <div className="vedika-lab-footer-controls">
            <button
              type="button"
              className="vedika-lab-nav-arrow"
              onClick={handlePrev}
              disabled={isNavigating}
              aria-label="Previous Lab"
            >
              <ChevronLeft size={17} />
            </button>

            <div className="vedika-lab-dots-wrap">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  className={`vedika-lab-nav-dot ${idx === activeIdx ? 'active' : ''}`}
                  onClick={() => handleTabClick(idx)}
                  disabled={isNavigating}
                  aria-label={`Go to ${card.title}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="vedika-lab-nav-arrow"
              onClick={handleNext}
              disabled={isNavigating}
              aria-label="Next Lab"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Scientific Particle Bot Canvas with Multi-layer Aura & Floating Doodles */}
        <div className="vedika-lab-right-col">
          {/* Shimmer Glow Auras */}
          <div className="vedika-lab-shimmer-glow-bg" />
          <div className="vedika-lab-shimmer-glow-radial" />
          <div className="vedika-lab-shimmer-glow-pulse" />

          {/* Thematic Floating Quotes & Neon SVG Doodles */}
          <div className="vedika-lab-doodles-layer">
            {activeCard.quotes.map((q, qIdx) => (
              <div
                key={`${activeCard.id}-q-${qIdx}`}
                className="vedika-lab-quote-pill"
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

            {/* Neon Doodles for Math Lab */}
            {activeCard.id === 'math' && (
              <>
                <div className="vedika-lab-neon-doodle" style={{ top: '16%', left: '22%' }}>
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <path d="M12 36C18 36 22 28 22 22C22 16 26 8 32 8" stroke={activeCard.accent} strokeWidth="2.4" strokeLinecap="round"/>
                    <path d="M6 22H38M22 6V38" stroke={activeCard.accent} strokeWidth="1.4" strokeDasharray="3 3"/>
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '34%', left: '10%' }}>
                  <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                    <polygon points="23,4 40,14 40,32 23,42 6,32 6,14" stroke={activeCard.accent} strokeWidth="2.2" fill="none"/>
                    <line x1="23" y1="4" x2="23" y2="42" stroke={activeCard.accent} strokeWidth="1.5" strokeDasharray="2 2"/>
                    <line x1="6" y1="14" x2="40" y2="32" stroke={activeCard.accent} strokeWidth="1.5" strokeDasharray="2 2"/>
                    <line x1="6" y1="32" x2="40" y2="14" stroke={activeCard.accent} strokeWidth="1.5" strokeDasharray="2 2"/>
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '22%', right: '24%' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 2L18 12L28 16L18 20L16 30L14 20L4 16L14 12L16 2Z" fill={activeCard.accent} />
                  </svg>
                </div>
              </>
            )}

            {/* Neon Doodles for Physics Lab */}
            {activeCard.id === 'physics' && (
              <>
                <div className="vedika-lab-neon-doodle" style={{ top: '16%', left: '20%' }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="5" fill={activeCard.accent} />
                    <ellipse cx="24" cy="24" rx="20" ry="8" stroke={activeCard.accent} strokeWidth="2" transform="rotate(-30 24 24)" />
                    <ellipse cx="24" cy="24" rx="20" ry="8" stroke={activeCard.accent} strokeWidth="2" transform="rotate(30 24 24)" />
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '36%', left: '12%' }}>
                  <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
                    <line x1="20" y1="4" x2="20" y2="34" stroke={activeCard.accent} strokeWidth="2" strokeDasharray="3 3"/>
                    <line x1="10" y1="4" x2="30" y2="4" stroke={activeCard.accent} strokeWidth="2.5"/>
                    <circle cx="20" cy="38" r="6" stroke={activeCard.accent} strokeWidth="2.2" fill="none"/>
                    <path d="M14 42C17 45 23 45 26 42" stroke={activeCard.accent} strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '20%', right: '22%' }}>
                  <svg width="52" height="32" viewBox="0 0 52 32" fill="none">
                    <path d="M4 16H14L18 8L24 24L30 8L36 24L40 16H48" stroke={activeCard.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </>
            )}

            {/* Neon Doodles for Chemistry Lab */}
            {activeCard.id === 'chemistry' && (
              <>
                <div className="vedika-lab-neon-doodle" style={{ top: '16%', left: '20%' }}>
                  <svg width="42" height="48" viewBox="0 0 42 48" fill="none">
                    <path d="M16 6H26M18 6V18L6 38C4 41 6 44 10 44H32C36 44 38 41 36 38L24 18V6" stroke={activeCard.accent} strokeWidth="2.2" strokeLinejoin="round"/>
                    <circle cx="21" cy="34" r="2.5" fill={activeCard.accent} />
                    <circle cx="16" cy="38" r="2" fill={activeCard.accent} />
                    <circle cx="26" cy="37" r="1.8" fill={activeCard.accent} />
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '36%', left: '12%' }}>
                  <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
                    <polygon points="23,6 38,15 38,31 23,40 8,31 8,15" stroke={activeCard.accent} strokeWidth="2.4" fill="none"/>
                    <circle cx="23" cy="23" r="8" stroke={activeCard.accent} strokeWidth="1.6" strokeDasharray="3 3"/>
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '22%', right: '22%' }}>
                  <svg width="24" height="42" viewBox="0 0 24 42" fill="none">
                    <rect x="5" y="4" width="14" height="32" rx="7" stroke={activeCard.accent} strokeWidth="2.2"/>
                    <path d="M5 24H19" stroke={activeCard.accent} strokeWidth="1.8"/>
                    <circle cx="12" cy="30" r="2" fill={activeCard.accent}/>
                  </svg>
                </div>
              </>
            )}

            {/* Neon Doodles for Biology Lab */}
            {activeCard.id === 'biology' && (
              <>
                <div className="vedika-lab-neon-doodle" style={{ top: '16%', left: '22%' }}>
                  <svg width="36" height="52" viewBox="0 0 36 52" fill="none">
                    <path d="M8 6C14 18 22 26 28 26C34 26 22 34 8 46" stroke={activeCard.accent} strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M28 6C22 18 14 26 8 26C2 26 14 34 28 46" stroke={activeCard.accent} strokeWidth="2.2" strokeLinecap="round"/>
                    <line x1="12" y1="12" x2="24" y2="12" stroke={activeCard.accent} strokeWidth="1.8"/>
                    <line x1="10" y1="40" x2="26" y2="40" stroke={activeCard.accent} strokeWidth="1.8"/>
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '36%', left: '12%' }}>
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <ellipse cx="22" cy="22" rx="18" ry="14" stroke={activeCard.accent} strokeWidth="2" strokeDasharray="4 3"/>
                    <circle cx="22" cy="22" r="5" fill={activeCard.accent}/>
                    <ellipse cx="14" cy="18" rx="3" ry="1.5" stroke={activeCard.accent} strokeWidth="1.2"/>
                    <ellipse cx="28" cy="26" rx="3" ry="1.5" stroke={activeCard.accent} strokeWidth="1.2"/>
                  </svg>
                </div>
                <div className="vedika-lab-neon-doodle" style={{ top: '22%', right: '22%' }}>
                  <svg width="34" height="46" viewBox="0 0 34 46" fill="none">
                    <circle cx="17" cy="12" r="6" stroke={activeCard.accent} strokeWidth="2"/>
                    <path d="M17 18V38M10 26L24 26M10 40H24" stroke={activeCard.accent} strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </div>
              </>
            )}
          </div>

          {/* Interactive Scientific Particle Bot Canvas */}
          <div className="vedika-lab-bot-wrapper">
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
