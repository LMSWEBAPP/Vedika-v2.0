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
    subtitle: 'Forces, motion, circuits and more',
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

const FIXED_SLOTS = [
  { x: -455, y: -8, z: 16, rotX: 1.2, rotY: 15.5, rotZ: -0.8 }, // 0: Math Lab (Left curved bank)
  { x: -262, y: 2,  z: -6, rotX: 0,   rotY: 5,    rotZ: 0 },    // 1: Physics Lab (Center-Left)
  { x: 262,  y: 2,  z: -6, rotX: 0,   rotY: -5,   rotZ: 0 },   // 2: Chemistry Lab (Center-Right)
  { x: 455,  y: -8, z: 16, rotX: 1.2, rotY: -15.5, rotZ: 0.8 }  // 3: Biology Lab (Right curved bank)
];

const METRICS_BAR = [
  { icon: FlaskConical, value: '4', title: 'Interactive Labs', accent: '#38BDF8' },
  { icon: Layers, value: '100+', title: 'Simulations', accent: '#818CF8' },
  { icon: Atom, value: 'Real Concepts', title: 'Made Simple', accent: '#A855F7' },
  { icon: Compass, value: 'Learn by Doing', title: 'At Your Own Pace', accent: '#F59E0B' }
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
 * Memoized Hologram Card Component
 * Only re-renders when its own `isSelected` or `slot` changes
 */
const HologramCard = memo(function HologramCard({ lab, idx, isSelected, slot, slotScale = 1, onSelect, onLaunch }) {
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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (isSelected) {
            onLaunch(lab.url);
          } else {
            onSelect(idx);
          }
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
 * Static Memoized Metrics Banner
 * Prevents unnecessary re-renders on active lab state changes
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
                style={{
                  color: item.accent,
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
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

export default function VedikaLabsHub() {
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);
  const isTablet = useMediaQuery(isTabletMQ);
  const slotScale = isMobile ? 0.38 : (isTablet ? 0.68 : 1);
  const [state, dispatch] = useReducer(vedikaLabsReducer, initialState);
  const { activeIdx, isNavigating } = state;
  const activeLab = LABS_DATA[activeIdx] || LABS_DATA[0];

  const [isMobileLabDropdownOpen, setIsMobileLabDropdownOpen] = useState(false);
  const [isFeaturesDropdownOpen, setIsFeaturesDropdownOpen] = useState(false);
  const labDropdownRef = useRef(null);
  const featureDropdownRef = useRef(null);

  // Close dropdowns on outside click or touch
  useEffect(() => {
    const handleOutside = (e) => {
      if (labDropdownRef.current && !labDropdownRef.current.contains(e.target)) {
        setIsMobileLabDropdownOpen(false);
      }
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

      {/* Main Centered Container */}
      <div className="vedika-labs-main-grid">

        {/* Top Dropdowns Bar (Lab Switcher & 5-Feature Options Dropdown) */}
        <div style={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 6,
          zIndex: 35,
          flexWrap: 'wrap'
        }}>
          {/* Mobile Lab Selector Dropdown */}
          {isMobile && (
            <div ref={labDropdownRef} style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <button
                type="button"
                onClick={() => {
                  setIsMobileLabDropdownOpen(prev => !prev);
                  setIsFeaturesDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(16px)',
                  border: `1px solid ${isMobileLabDropdownOpen ? activeLab.color : 'rgba(255, 255, 255, 0.14)'}`,
                  borderRadius: 12,
                  padding: '9px 14px',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px ${activeLab.color}33`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{activeLab.symbol}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 9.5, color: '#8892B0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Select Virtual Lab
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
                      {activeLab.title}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  color={activeLab.color}
                  style={{
                    transform: isMobileLabDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </button>

              {isMobileLabDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: '#0B0F19',
                  border: `1px solid ${activeLab.color}66`,
                  borderRadius: 12,
                  padding: 6,
                  boxShadow: '0 20px 48px rgba(0,0,0,0.85)',
                  zIndex: 50,
                  backdropFilter: 'blur(20px)'
                }}>
                  {LABS_DATA.map((lab, idx) => {
                    const isSelected = idx === activeIdx;
                    return (
                      <button
                        key={lab.id}
                        onClick={() => {
                          handleSelectLab(idx);
                          setIsMobileLabDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: isSelected ? `1px solid ${lab.color}55` : '1px solid transparent',
                          background: isSelected ? `linear-gradient(90deg, ${lab.color}22, rgba(255,255,255,0.02))` : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{lab.symbol}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? lab.color : '#fff' }}>
                              {lab.title}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#8892B0' }}>
                              {lab.badge}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={16} color={lab.color} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5-Feature Options Dropdown on Vedika Labs Hub Page */}
          <div ref={featureDropdownRef} style={{ position: 'relative', width: isMobile ? '100%' : 'auto', maxWidth: 360 }}>
            <button
              type="button"
              onClick={() => {
                setIsFeaturesDropdownOpen(prev => !prev);
                setIsMobileLabDropdownOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isFeaturesDropdownOpen ? activeLab.color : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: 10,
                padding: '8px 14px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} color={activeLab.color} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#E2E8F0' }}>
                  Explore Lab Features (5 Options)
                </span>
              </div>
              <ChevronDown
                size={15}
                color={activeLab.color}
                style={{
                  transform: isFeaturesDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </button>

            {isFeaturesDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                minWidth: 290,
                background: '#0B0F19',
                border: `1px solid ${activeLab.color}66`,
                borderRadius: 12,
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
                  <HologramCard
                    key={lab.id}
                    lab={lab}
                    idx={idx}
                    isSelected={idx === activeIdx}
                    slot={FIXED_SLOTS[idx]}
                    slotScale={slotScale}
                    onSelect={handleSelectLab}
                    onLaunch={handleLaunchLab}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* FOREGROUND BOT CHARACTER: Brought to front, enlarged, with physics & chemistry particle intensity */}
          <div className="vedika-labs-pedestal-stage" style={{ pointerEvents: 'none' }}>
            <div className="vedika-labs-bot-foreground" style={{ pointerEvents: 'none' }}>
              <div className="bot-pedestal-shadow" style={{ pointerEvents: 'none' }} />
              <div style={{ width: isMobile ? 220 : 345, height: isMobile ? 220 : 345, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <VedikaParticleBot
                  src={activeLab.botImage || '/vedika-bot-physics.png?v=3'}
                  width={isMobile ? 220 : 345}
                  height={isMobile ? 220 : 345}
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
      </div>

      {/* Static Memoized Bottom Floating Metrics Banner */}
      <MetricsBanner />
    </div>
  );
}
