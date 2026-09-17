'use client';

import { useReducer, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Compass,
  Layers,
  FlaskConical,
  Atom,
  Eye,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import VedikaParticleBot from '@/components/VedikaParticleBot';
import { LabThematicArt } from './LabCardArt';
import './vedika-labs.css';

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
const HologramCard = memo(function HologramCard({ lab, idx, isSelected, slot, onSelect, onLaunch }) {
  const transX = slot.x;
  const transY = slot.y;
  const transZ = slot.z + (isSelected ? 16 : 0);
  const rotX = slot.rotX;
  const rotY = slot.rotY;
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
  const [state, dispatch] = useReducer(vedikaLabsReducer, initialState);
  const { activeIdx, isNavigating } = state;
  const activeLab = LABS_DATA[activeIdx] || LABS_DATA[0];

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
