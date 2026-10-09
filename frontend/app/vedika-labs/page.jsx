'use client';

import { useReducer, useState, useRef, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Compass,
  Layers,
  FlaskConical,
  Atom,
  ChevronDown,
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
    icon: BookOpenIcon,
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

function BookOpenIcon(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

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

// Exact Desktop 3D Slots (Curved 4-Wing Formation)
const FIXED_SLOTS = [
  { x: -455, y: -8, z: 16, rotX: 1.2, rotY: 15.5, rotZ: -0.8 }, // 0: Math Lab (Left curved bank)
  { x: -262, y: 2,  z: -6, rotX: 0,   rotY: 5,    rotZ: 0 },    // 1: Physics Lab (Center-Left)
  { x: 262,  y: 2,  z: -6, rotX: 0,   rotY: -5,   rotZ: 0 },    // 2: Chemistry Lab (Center-Right)
  { x: 455,  y: -8, z: 16, rotX: 1.2, rotY: -15.5, rotZ: 0.8 }  // 3: Biology Lab (Right curved bank)
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
 * ── DESKTOP: Memoized 3D Wing Hologram Card Component ──
 */
const DesktopHologramCard = memo(function DesktopHologramCard({ lab, idx, isSelected, slot, slotScale = 1, onSelect, onLaunch }) {
  const transX = Math.round(slot.x * slotScale);
  const transY = slot.y;
  const transZ = Math.round(slot.z * slotScale) + (isSelected ? 16 : 0);
  const rotX = slot.rotX;
  const rotY = Math.round(slot.rotY * (slotScale < 1 ? 0.6 : 1));
  const rotZ = slot.rotZ;
  const scaleVal = isSelected ? 1.02 : 0.98;

  return (
    <div
      key={lab.id}
      className={`vedika-hologram-card ${isSelected ? 'selected-glow' : 'ambient-card'}`}
      style={{
        '--card-theme': lab.color,
        '--card-theme-rgb': lab.colorRgb,
        '--card-glow': lab.glowColor,
        transform: `translateX(${transX}px) translateY(${transY}px) translateZ(${transZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scaleVal})`,
        zIndex: isSelected ? 15 : 12,
        opacity: isSelected ? 1 : 0.88,
        cursor: 'pointer',
        pointerEvents: 'auto',
        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease'
      }}
      onClick={() => {
        if (isSelected) {
          onLaunch(lab.url);
        } else {
          onSelect(idx);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${isSelected ? 'Enter' : 'Select'} ${lab.title}`}
    >
      <div className="card-glass-panel">
        <div className="card-header-titles">
          <div className="card-header-top-row">
            <span className="card-tech-dot" />
            <h3 className="card-lab-headline">
              {lab.id === 'math' && <>Math <span style={{ color: '#c084fc' }}>Lab</span></>}
              {lab.id === 'physics' && <>Physics <span style={{ color: '#00D4FF' }}>Lab</span></>}
              {lab.id === 'chemistry' && <>Chemistry <span style={{ color: '#00E5A3' }}>Lab</span></>}
              {lab.id === 'biology' && <>Biology <span style={{ color: '#F59E0B' }}>Lab</span></>}
            </h3>
          </div>
          <div className="card-headline-accent-bar" style={{ background: lab.color }} />
        </div>

        <div className="card-thematic-art">
          <LabThematicArt labId={lab.id} />
        </div>

        {isSelected && <div className="card-active-glow-aura" />}
      </div>
    </div>
  );
});

/**
 * ── DESKTOP: Memoized Bottom Metrics Banner ──
 */
const DesktopMetricsBanner = memo(function DesktopMetricsBanner() {
  return (
    <div className="vedika-labs-bottom-banner">
      <div className="metrics-banner-inner">
        {METRICS_BAR.map((item, idx) => {
          const { icon: MetricIcon } = item;
          return (
            <div key={idx} className="metric-cell">
              <div
                className="metric-icon-wrap"
                style={{
                  color: item.accent,
                  borderColor: `${item.accent}44`
                }}
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

/**
 * ── MOBILE: Memoized Carousel Hologram Card Component ──
 */
const MobileHologramCard = memo(function MobileHologramCard({ lab, idx, activeIdx, onSelect, onLaunch }) {
  let offset = idx - activeIdx;
  const count = LABS_DATA.length;
  if (offset > count / 2) offset -= count;
  if (offset < -count / 2) offset += count;

  const isCenter = offset === 0;
  const isLeft = offset === -1 || (activeIdx === 0 && idx === count - 1);
  const isRight = offset === 1 || (activeIdx === count - 1 && idx === 0);

  let posClass = 'card-hidden-slide';
  if (isCenter) posClass = 'card-active-slide';
  else if (isLeft) posClass = 'card-left-peek';
  else if (isRight) posClass = 'card-right-peek';

  return (
    <div
      key={lab.id}
      className={`carousel-card-slide ${posClass}`}
      style={{
        '--card-theme': lab.color,
        '--card-theme-rgb': lab.colorRgb,
        '--card-glow': lab.glowColor
      }}
      onClick={() => {
        if (isCenter) {
          onLaunch(lab.url);
        } else {
          onSelect(idx);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${isCenter ? 'Enter' : 'Select'} ${lab.title}`}
    >
      <div className="card-glass-panel">
        <div className="card-header-titles">
          <div className="card-header-top-row">
            <span className="card-tech-dot" />
            <h3 className="card-lab-headline">
              {lab.headline.split(' ')[0]} <span style={{ color: lab.color }}>Lab</span>
            </h3>
          </div>
          <p className="card-lab-subtitle">{lab.subtitle}</p>
        </div>

        <div className="card-thematic-art">
          <LabThematicArt labId={lab.id} />
        </div>

        {isCenter && (
          <button
            type="button"
            className="card-launch-fab"
            aria-label={`Enter ${lab.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onLaunch(lab.url);
            }}
          >
            <ArrowRight size={16} color="#FFFFFF" />
          </button>
        )}

        {isCenter && <div className="card-active-glow-aura" />}
      </div>
    </div>
  );
});

/**
 * ── MOBILE: Memoized Bottom Metrics Banner ──
 */
const MobileMetricsBanner = memo(function MobileMetricsBanner() {
  return (
    <div className="vedika-labs-mobile-bottom-banner">
      <div className="mobile-metrics-inner">
        {METRICS_BAR.map((item, idx) => (
          <div key={idx} className="mobile-metric-cell">
            <span className="mobile-metric-val" style={{ color: item.accent }}>{item.value}</span>
            <span className="mobile-metric-lbl">{item.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function VedikaLabsHub() {
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);
  const isTablet = useMediaQuery(isTabletMQ);
  const [state, dispatch] = useReducer(vedikaLabsReducer, initialState);
  const { activeIdx, isNavigating } = state;
  const activeLab = LABS_DATA[activeIdx] || LABS_DATA[0];

  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  const featureDropdownRef = useRef(null);
  const touchStartRef = useRef(null);

  // Close dropdown on outside click or touch
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

  // Preload mascot assets
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

  // Mobile Touch Swipe Handling
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
      {/* Sci-Fi Laboratory Scene Backdrop */}
      <div className="vedika-labs-scene-backdrop" />
      <div className="vedika-labs-scene-overlay" />

      {/* Top Transition Progress Bar */}
      {isNavigating && <div className="vedika-labs-top-progress" />}

      {/* ── CONDITIONAL RENDER: DESKTOP/LAPTOP VS MOBILE ── */}
      {!isMobile ? (
        /* ══════════════════════════════════════════════════════════════════
           ORIGINAL DESKTOP & LAPTOP CINEMA VIEW
           Curved 4-Wing Hologram Stage, Ceiling Emitter, 345px Bot, CTA
           ══════════════════════════════════════════════════════════════════ */
        <div className="vedika-labs-main-grid">
          {/* 3D Stage Viewport */}
          <div className="vedika-labs-stage-viewport">
            {/* Top Ceiling Energy Emitter Beam */}
            <div className="vedika-labs-ceiling-emitter">
              <div className="emitter-ring emitter-ring-outer" />
              <div className="emitter-ring emitter-ring-inner" />
              <div className="emitter-beam-cone" />
            </div>

            {/* Holographic Cards: Semi-Spherical Curvature Wing Formation */}
            <div className="vedika-labs-carousel-stage">
              <div className="cards-bounded-viewport">
                <div className="cards-curved-guide-track" />

                <div className="cards-stage-track">
                  {LABS_DATA.map((lab, idx) => (
                    <DesktopHologramCard
                      key={lab.id}
                      lab={lab}
                      idx={idx}
                      isSelected={idx === activeIdx}
                      slot={FIXED_SLOTS[idx]}
                      slotScale={isTablet ? 0.68 : 1}
                      onSelect={handleSelectLab}
                      onLaunch={handleLaunchLab}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* FOREGROUND BOT CHARACTER */}
            <div className="vedika-labs-pedestal-stage" style={{ pointerEvents: 'none' }}>
              <div className="vedika-labs-bot-foreground" style={{ pointerEvents: 'none' }}>
                <div className="bot-pedestal-shadow" style={{ pointerEvents: 'none' }} />
                <div style={{ width: 345, height: 345, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <VedikaParticleBot
                    src={activeLab.botImage || '/vedika-bot-physics.png?v=3'}
                    width={345}
                    height={345}
                    inline={true}
                    colorMode="vibrant"
                    intensity={activeLab.id === 'physics' || activeLab.id === 'chemistry' ? 1.65 : 1.0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Centered Primary CTA Launch Button */}
          <div className="vedika-labs-center-cta-wrap">
            <button
              type="button"
              className="vedika-labs-explore-cta-btn"
              onClick={() => handleLaunchLab(activeLab.url)}
            >
              <span>Enter {activeLab.title}</span>
              <ArrowRight size={18} className="cta-arrow" />
            </button>
          </div>

          {/* Bottom Floating Metrics Banner */}
          <DesktopMetricsBanner />
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           NEAT ZERO-SCROLL MOBILE VIEW
           Compact bot, touch swipe carousel, compact metrics
           ══════════════════════════════════════════════════════════════════ */
        <div className="vedika-labs-mobile-grid">
          {/* 1. Header Section */}
          <div className="vedika-labs-header-section">
            <span className="vedika-labs-explore-badge">EXPLORE</span>
            <h1 className="vedika-labs-main-title">
              Vedika <span style={{ color: activeLab.color }}>Labs</span>
            </h1>
            <p className="vedika-labs-main-subtitle">
              Interactive science labs to learn, experiment and discover.
            </p>

            {/* Integrated 5-Feature Options Dropdown */}
            <div ref={featureDropdownRef} style={{ position: 'relative', marginTop: 5, zIndex: 40 }}>
              <button
                type="button"
                onClick={() => setIsFeaturesDropdownOpen(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isFeaturesDropdownOpen ? activeLab.color : 'rgba(255, 255, 255, 0.12)'}`,
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={13} color={activeLab.color} />
                <span>Explore Lab Features (5 Options)</span>
                <ChevronDown
                  size={13}
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
                  backdropFilter: 'blur(20px)',
                  maxHeight: '55vh',
                  overflowY: 'auto'
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

          {/* 2. Bot Stage */}
          <div className="vedika-labs-bot-stage">
            <div className="vedika-labs-bot-glow-aura mobile-aura" />
            <div className="bot-canvas-wrap">
              <VedikaParticleBot
                src={activeLab.botImage || '/vedika-bot-physics.png?v=3'}
                width={215}
                height={190}
                inline={true}
                colorMode="vibrant"
                themeRgb={activeLab.colorRgb}
                intensity={1.25}
                particleStep={2}
              />
            </div>
          </div>

          {/* 3. Cards Carousel */}
          <div
            className="vedika-labs-carousel-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="vedika-labs-carousel-track">
              {LABS_DATA.map((lab, idx) => (
                <MobileHologramCard
                  key={lab.id}
                  lab={lab}
                  idx={idx}
                  activeIdx={activeIdx}
                  onSelect={handleSelectLab}
                  onLaunch={handleLaunchLab}
                />
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="carousel-dots-row">
              {LABS_DATA.map((lab, idx) => (
                <button
                  key={lab.id}
                  type="button"
                  className={`carousel-dot ${idx === activeIdx ? 'active-dot' : ''}`}
                  onClick={() => handleSelectLab(idx)}
                  aria-label={`Select ${lab.title}`}
                />
              ))}
            </div>
          </div>

          {/* 4. Bottom Metrics */}
          <MobileMetricsBanner />
        </div>
      )}
    </div>
  );
}
