'use client';

import { useReducer, useState, useRef, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Compass,
  Layers,
  FlaskConical,
  Atom,
  Eye,
  BookOpen,
  RotateCcw,
  ChevronDown,
  Check,
  Sparkles,
  Award,
  HelpCircle,
  Bot
} from 'lucide-react';
import VedikaParticleBot from '@/components/VedikaParticleBot';
import { useMediaQuery, isMobileMQ, isTabletMQ } from '@/lib/useMediaQuery';
import { LabThematicArt } from './LabCardArt';
import './vedika-labs.css';

export const VEDIKA_HUB_FEATURES = [
  {
    id: 'sim',
    label: 'Interactive Canvas',
    icon: Layers,
    badge: 'PhET Sim',
    desc: 'Interactive HTML5 STEM simulation and 3D WebGL workbenches'
  },
  {
    id: 'objectives',
    label: 'Objectives & Steps',
    icon: BookOpen,
    badge: 'Procedure',
    desc: 'Guided step-by-step scientific methods and curriculum goals'
  },
  {
    id: 'formulas',
    label: 'Formulas & Principles',
    icon: Award,
    badge: 'Theory',
    desc: 'Mathematical equations and underlying physical laws'
  },
  {
    id: 'questions',
    label: 'Viva & Self Test',
    icon: HelpCircle,
    badge: 'Oral Exam',
    desc: 'Interactive oral examination questions and self-tests'
  },
  {
    id: 'ai',
    label: 'Vedika AI Science Tutor',
    icon: Bot,
    badge: 'AI Mentor',
    desc: 'Multimodal AI tutor providing live explanations and answers'
  }
];

const LABS_DATA = [
  {
    id: 'math',
    title: 'Math Lab',
    headline: 'Math Lab',
    subtitle: 'Graphs, equations and 3D visualization',
    symbol: 'Σ',
    secondarySymbol: 'π',
    iconType: 'calculator',
    color: '#A855F7',
    colorRgb: '168, 85, 247',
    glowColor: 'rgba(168, 85, 247, 0.65)',
    botImage: '/vedika-bot-math.png?v=3',
    url: '/vedika-labs/math',
    badge: '3D CALCULUS & DYNAMICS',
    tags: ['Graphing 2D/3D', 'Lorenz Attractor', 'Calculus', 'Fourier Analysis'],
    quote: 'Mathematics reveals the hidden symmetries of reality.'
  },
  {
    id: 'physics',
    title: 'Physics Lab',
    headline: 'Physics Lab',
    subtitle: 'Explore laws of nature through simulation',
    symbol: '⚛',
    secondarySymbol: '⚡',
    iconType: 'atom',
    color: '#00D4FF',
    colorRgb: '0, 212, 255',
    glowColor: 'rgba(0, 212, 255, 0.75)',
    botImage: '/vedika-bot-physics.png?v=3',
    url: '/vedika-labs/physics',
    badge: 'NEWTONIAN & QUANTUM',
    tags: ["Newton's Cradle", 'Pendulum Waves', 'Gravity', 'Ohm\'s Circuit'],
    quote: 'Forces and fields govern every motion across the cosmos.'
  },
  {
    id: 'chemistry',
    title: 'Chemistry Lab',
    headline: 'Chemistry Lab',
    subtitle: 'Molecules, reactions and structures',
    symbol: '⚗',
    secondarySymbol: '🧪',
    iconType: 'flask',
    color: '#00E5A3',
    colorRgb: '0, 229, 163',
    glowColor: 'rgba(0, 229, 163, 0.75)',
    botImage: '/vedika-bot-chemistry.png?v=3',
    url: '/vedika-labs/chemistry',
    badge: 'MOLECULES & REACTION DYNAMICS',
    tags: ['Atomic Orbitals', 'Reaction Kinetics', 'Titration', 'Gas Diffusion'],
    quote: 'Matter transforms through atomic bonds and chemical reactions.'
  },
  {
    id: 'biology',
    title: 'Biology Lab',
    headline: 'Biology Lab',
    subtitle: 'Cells, DNA and ecosystems',
    symbol: '🍃',
    secondarySymbol: '🧬',
    iconType: 'dna',
    color: '#F59E0B',
    colorRgb: '245, 158, 11',
    glowColor: 'rgba(245, 158, 11, 0.75)',
    botImage: '/vedika-bot-biology.png?v=3',
    url: '/vedika-labs/biology',
    badge: 'GENETICS & CELLULAR WORLDS',
    tags: ['DNA Double Helix', 'Animal & Plant Cells', 'Microbiology', 'Ecosystems'],
    quote: 'Life unfolds from molecular codes into living organisms.'
  }
];

const METRICS_BAR = [
  { icon: FlaskConical, value: '4', title: 'Interactive Labs', accent: '#00D4FF' },
  { icon: Layers, value: '100+', title: 'Simulations', accent: '#818CF8' },
  { icon: Atom, value: 'Real', title: 'Concepts', accent: '#A855F7' },
  { icon: Compass, value: 'Learn', title: 'by Doing', accent: '#F59E0B' }
];

const initialState = {
  activeIdx: 1, // Default to Physics Lab (center)
  isNavigating: false
};

function vedikaLabsReducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_LAB':
      if (state.isNavigating || state.activeIdx === action.payload) return state;
      return { ...state, activeIdx: action.payload };
    case 'PREV_LAB': {
      if (state.isNavigating) return state;
      const count = action.payload || LABS_DATA.length;
      return {
        ...state,
        activeIdx: state.activeIdx > 0 ? state.activeIdx - 1 : count - 1
      };
    }
    case 'NEXT_LAB': {
      if (state.isNavigating) return state;
      const count = action.payload || LABS_DATA.length;
      return {
        ...state,
        activeIdx: state.activeIdx < count - 1 ? state.activeIdx + 1 : 0
      };
    }
    case 'START_NAVIGATE':
      return { ...state, isNavigating: true };
    default:
      return state;
  }
}

/**
 * Memoized Carousel Hologram Card Component
 * Dynamically computes offset relative to activeIdx (-1: left peek, 0: center active, 1: right peek)
 */
const HologramCard = memo(function HologramCard({ lab, idx, activeIdx, onSelect, onLaunch }) {
  let offset = idx - activeIdx;
  if (offset < -1 && LABS_DATA.length === 4) offset += 4;
  if (offset > 2 && LABS_DATA.length === 4) offset -= 4;
  const isCenter = offset === 0;
  const isVisible = offset >= -1 && offset <= 1;

  return (
    <div
      key={lab.id}
      className={`carousel-card-slide ${isCenter ? 'card-center-active' : ''} ${offset === -1 ? 'card-left-peek' : ''} ${offset === 1 ? 'card-right-peek' : ''}`}
      style={{
        '--card-theme': lab.color,
        '--card-theme-rgb': lab.colorRgb,
        '--card-glow': lab.glowColor,
        display: isVisible ? 'flex' : 'none',
        zIndex: isCenter ? 25 : 10
      }}
      onClick={() => {
        if (isCenter) {
          onLaunch(lab.url);
        } else {
          onSelect(idx);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (isCenter) {
            onLaunch(lab.url);
          } else {
            onSelect(idx);
          }
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${isCenter ? 'Enter' : 'Select'} ${lab.title}`}
    >
      <div className="card-glass-panel">
        <div className="card-header-titles">
          <h3 className="card-lab-headline">
            {lab.headline.replace(' Lab', '')} <span style={{ color: lab.color }}>Lab</span>
          </h3>
          <p className="card-lab-subtitle">
            {lab.subtitle}
          </p>
        </div>

        <div className="card-thematic-art">
          <LabThematicArt labId={lab.id} />
        </div>

        {isCenter && (
          <button
            type="button"
            className="card-launch-fab"
            onClick={(e) => {
              e.stopPropagation();
              onLaunch(lab.url);
            }}
            aria-label={`Enter ${lab.title}`}
            style={{
              background: `radial-gradient(circle, ${lab.color}33 0%, rgba(10, 20, 40, 0.85) 100%)`,
              borderColor: lab.color,
              boxShadow: `0 0 16px ${lab.color}66`
            }}
          >
            <ArrowRight size={17} color="#ffffff" />
          </button>
        )}

        {isCenter && <div className="card-active-glow-aura" />}
      </div>
    </div>
  );
});

/**
 * Static Memoized Metrics Banner matching the 4-column pill in the mockup
 */
const MetricsBanner = memo(function MetricsBanner() {
  return (
    <div className="vedika-labs-bottom-banner">
      <div className="metrics-banner-inner">
        {METRICS_BAR.map((item, idx) => {
          const { icon: MetricIcon } = item;
          return (
            <div key={idx} className="metric-cell">
              <div
                className="metric-icon-wrap"
                style={{ color: item.accent }}
              >
                <MetricIcon size={20} />
              </div>
              <div className="metric-text-wrap">
                <span className="metric-val">{item.value}</span>
                <span className="metric-lbl">{item.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default function VedikaLabsHub() {
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);
  const [state, dispatch] = useReducer(vedikaLabsReducer, initialState);
  const { activeIdx, isNavigating } = state;
  const activeLab = LABS_DATA[activeIdx] || LABS_DATA[0];

  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  const featureDropdownRef = useRef(null);
  const touchStartRef = useRef(null);

  // Close feature dropdown on outside click or touch
  useEffect(() => {
    const handleOutside = (e) => {
      if (featureDropdownRef.current && !featureDropdownRef.current.contains(e.target)) {
        setIsFeaturesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      [
        '/vedika-bot-math.png?v=3',
        '/vedika-bot-physics.png?v=3',
        '/vedika-bot-chemistry.png?v=3',
        '/vedika-bot-biology.png?v=3'
      ].forEach((path) => {
        const img = new Image();
        img.src = path;
        if (img.decode) {
          img.decode().catch(() => {});
        }
      });
    }
    LABS_DATA.forEach((lab) => {
      if (router?.prefetch) {
        try {
          router.prefetch(lab.url);
        } catch (e) {}
      }
    });
  }, [router]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_LAB', payload: LABS_DATA.length });
  }, []);

  const handleNext = useCallback(() => {
    dispatch({ type: 'NEXT_LAB', payload: LABS_DATA.length });
  }, []);

  const handleSelectLab = useCallback((idx) => {
    dispatch({ type: 'SET_ACTIVE_LAB', payload: idx });
  }, []);

  const handleLaunchLab = useCallback((url) => {
    if (isNavigating) return;
    dispatch({ type: 'START_NAVIGATE' });
    setTimeout(() => {
      router.push(url);
    }, 240);
  }, [isNavigating, router]);

  // Touch swipe support for smooth mobile cards carousel
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    if (e.changedTouches && e.changedTouches[0]) {
      const diff = touchStartRef.current - e.changedTouches[0].clientX;
      if (diff > 40) {
        handleNext();
      } else if (diff < -40) {
        handlePrev();
      }
    }
    touchStartRef.current = null;
  };

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div
      className="vedika-labs-cinema-view"
      style={{
        '--active-color': activeLab.color,
        '--active-color-rgb': activeLab.colorRgb,
        '--active-glow': activeLab.glowColor
      }}
    >
      {/* Hardware-Accelerated Sci-Fi Laboratory Scene Backdrop */}
      <div className="vedika-labs-scene-backdrop" />
      <div className="vedika-labs-scene-overlay" />

      {/* Top Transition Progress Bar */}
      {isNavigating && <div className="vedika-labs-top-progress" />}

      {/* Main Container matching the exact mobile layout */}
      <div className="vedika-labs-main-grid">

        {/* 1. Top Header Section: EXPLORE, Vedika Labs, Subtitle */}
        <div className="vedika-labs-header-section">
          <span className="vedika-labs-explore-badge">EXPLORE</span>
          <h1 className="vedika-labs-main-title">
            Vedika <span style={{ color: activeLab.color }}>Labs</span>
          </h1>
          <p className="vedika-labs-main-subtitle">
            Interactive science labs to learn, experiment and discover.
          </p>

          {/* Integrated 5-Feature Options Dropdown (Compact Pill, Present Element) */}
          <div ref={featureDropdownRef} style={{ position: 'relative', marginTop: 5, zIndex: 40 }}>
            <button
              type="button"
              onClick={() => setIsFeaturesDropdownOpen(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isFeaturesDropdownOpen ? activeLab.color : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: 9999,
                padding: '3px 12px',
                color: '#E2E8F0',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={12} color={activeLab.color} />
              <span>Explore Lab Features (5 Options)</span>
              <ChevronDown
                size={12}
                color={activeLab.color}
                style={{
                  transform: isFeaturesDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              />
            </button>

            {isFeaturesDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 290,
                background: '#0B0F19',
                border: `1px solid ${activeLab.color}66`,
                borderRadius: 14,
                padding: 6,
                boxShadow: '0 20px 48px rgba(0,0,0,0.85)',
                zIndex: 50,
                backdropFilter: 'blur(20px)'
              }}>
                <div style={{
                  padding: '6px 10px 8px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#8892B0',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Integrated Lab Features</span>
                  <span style={{ color: activeLab.color }}>Tap to open</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                  {VEDIKA_HUB_FEATURES.map((feat) => {
                    const FeatIcon = feat.icon;
                    return (
                      <button
                        key={feat.id}
                        onClick={() => {
                          setIsFeaturesDropdownOpen(false);
                          handleLaunchLab(`${activeLab.url}?tab=${feat.id}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 11px',
                          borderRadius: 8,
                          border: '1px solid transparent',
                          background: 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: activeLab.color,
                          flexShrink: 0
                        }}>
                          <FeatIcon size={15} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{feat.label}</span>
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 6, background: `${activeLab.color}22`, color: activeLab.color, fontWeight: 700 }}>
                              {feat.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: 10.5, color: '#7E8B9F', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {feat.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Particle Bot Section (ON TOP OF THE CARDS, with soft ambient shimmer aura) */}
        <div className="vedika-labs-bot-stage">
          <div className="vedika-labs-bot-glow-aura" />
          <div className="bot-canvas-wrap">
            <VedikaParticleBot
              src={activeLab.botImage || '/vedika-bot-physics.png?v=3'}
              width={isMobile ? 180 : 250}
              height={isMobile ? 165 : 230}
              inline={true}
              colorMode="vibrant"
              themeRgb={activeLab.colorRgb}
              intensity={1.25}
              particleStep={2}
            />
          </div>
        </div>

        {/* 3. Cards Carousel Section (BELOW THE BOT, as in mockup) */}
        <div
          className="vedika-labs-carousel-container"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="vedika-labs-carousel-track">
            {LABS_DATA.map((lab, idx) => (
              <HologramCard
                key={lab.id}
                lab={lab}
                idx={idx}
                activeIdx={activeIdx}
                onSelect={handleSelectLab}
                onLaunch={handleLaunchLab}
              />
            ))}
          </div>

          {/* Carousel Pagination Dots */}
          <div className="carousel-dots-row">
            {LABS_DATA.map((lab, idx) => (
              <button
                key={lab.id}
                type="button"
                className={`carousel-dot ${idx === activeIdx ? 'active-dot' : ''}`}
                onClick={() => handleSelectLab(idx)}
                style={{
                  background: idx === activeIdx ? activeLab.color : 'rgba(255, 255, 255, 0.25)',
                  boxShadow: idx === activeIdx ? `0 0 12px ${activeLab.color}` : 'none'
                }}
                aria-label={`Select ${lab.title}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* 4. Bottom Floating Metrics Banner (matching 4-column pill in image) */}
      <MetricsBanner />
    </div>
  );
}
