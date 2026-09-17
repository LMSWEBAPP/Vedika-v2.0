'use client';

import { useState, useReducer, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Compass,
  CheckCircle2,
  Eye,
  BookOpen,
  RotateCcw,
  Sparkles,
  Layers,
  FlaskConical,
  Atom,
  Calculator,
  Dna
} from 'lucide-react';
import VedikaParticleBot from '@/components/VedikaParticleBot';
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
    wireframeShape: 'cube',
    quote: 'Mathematics reveals the hidden symmetries of reality.',
    features: [
      { id: 'simulate', title: 'Plot & Calculate', desc: 'Real-time 2D & 3D parametric graphing', Icon: Layers },
      { id: 'visualize', title: 'Visualize', desc: 'Lorenz chaotic attractors in WebGL', Icon: Eye },
      { id: 'learn', title: 'Calculus AI', desc: 'Step-by-step LaTeX formula derivations', Icon: BookOpen },
      { id: 'repeat', title: 'Master', desc: 'Explore Fourier harmonics iteratively', Icon: RotateCcw }
    ]
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
    wireframeShape: 'cradle',
    quote: 'Forces and fields govern every motion across the cosmos.',
    features: [
      { id: 'simulate', title: 'Simulate', desc: 'Newtonian collisions and cradle momentum', Icon: Layers },
      { id: 'visualize', title: 'Visualize', desc: 'Electromagnetic field vectors in 3D', Icon: Eye },
      { id: 'learn', title: 'Wave Optics', desc: 'Interference patterns and laser diffraction', Icon: BookOpen },
      { id: 'repeat', title: 'Practice', desc: 'Tune Ohm\'s Law breadboard circuits', Icon: RotateCcw }
    ]
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
    wireframeShape: 'flask',
    quote: 'Matter transforms through atomic bonds and chemical reactions.',
    features: [
      { id: 'simulate', title: 'Synthesize', desc: 'Molecular collisions and reaction kinetics', Icon: Layers },
      { id: 'visualize', title: 'Visualize', desc: '3D atomic Bohr models and electron shells', Icon: Eye },
      { id: 'learn', title: 'Titration', desc: 'Interactive acid-base pH color indicators', Icon: BookOpen },
      { id: 'repeat', title: 'Balance', desc: 'Chemical equation stoichiometry puzzles', Icon: RotateCcw }
    ]
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
    wireframeShape: 'helix',
    quote: 'Life unfolds from molecular codes into living organisms.',
    features: [
      { id: 'simulate', title: 'Sequencing', desc: 'Adenine-Thymine & Cytosine-Guanine pairs', Icon: Layers },
      { id: 'visualize', title: 'Visualize', desc: 'Rotating 3D DNA double-helix spiral', Icon: Eye },
      { id: 'learn', title: 'Cell Anatomy', desc: 'Mitochondria, nucleus and ribosomes in 3D', Icon: BookOpen },
      { id: 'repeat', title: 'Explore', desc: 'Dynamic trophic food chains and biomes', Icon: RotateCcw }
    ]
  }
];

const FEATURES_LIST = [
  { id: 'simulate', label: 'Simulate', desc: 'Real world experiments', icon: Layers },
  { id: 'visualize', label: 'Visualize', desc: 'Complex concepts in 3D', icon: Eye },
  { id: 'learn', label: 'Learn', desc: 'Step by step guidance', icon: BookOpen },
  { id: 'repeat', label: 'Repeat', desc: 'Practice until you master', icon: RotateCcw }
];

const METRICS_BAR = [
  { icon: FlaskConical, value: '4', title: 'Interactive Labs', accent: '#38BDF8' },
  { icon: Layers, value: '100+', title: 'Simulations', accent: '#818CF8' },
  { icon: Atom, value: 'Real Concepts', title: 'Made Simple', accent: '#A855F7' },
  { icon: Compass, value: 'Learn by Doing', title: 'At Your Own Pace', accent: '#F59E0B' }
];

const initialState = {
  activeIdx: 1, // Default to Physics Lab (center)
  isNavigating: false,
  isLoaded: false,
  cardHoverIdx: null
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
    case 'SET_HOVER_CARD':
      return { ...state, cardHoverIdx: action.payload };
    case 'START_NAVIGATE':
      return { ...state, isNavigating: true };
    case 'SET_LOADED':
      return { ...state, isLoaded: true };
    default:
      return state;
  }
}

export default function VedikaLabsHub() {
  const router = useRouter();
  const [state, dispatch] = useReducer(vedikaLabsReducer, initialState);
  const { activeIdx, isNavigating, isLoaded } = state;
  const activeLab = LABS_DATA[activeIdx] || LABS_DATA[0];

  useEffect(() => {
    dispatch({ type: 'SET_LOADED' });
    if (typeof window !== 'undefined') {
      [
        '/vedika-bot-math.png?v=3',
        '/vedika-bot-physics.png?v=3',
        '/vedika-bot-chemistry.png?v=3',
        '/vedika-bot-biology.png?v=3'
      ].forEach((path) => {
        const pre = new Image();
        pre.src = path;
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const handleLaunchLab = (url) => {
    if (isNavigating) return;
    dispatch({ type: 'START_NAVIGATE' });
    setTimeout(() => {
      router.push(url);
    }, 240);
  };

  return (
    <div
      className="vedika-labs-cinema-view"
      style={{
        '--active-color': activeLab.color,
        '--active-color-rgb': activeLab.colorRgb,
        '--active-glow': activeLab.glowColor
      }}
    >
      {/* Background High-Detail Sci-Fi Laboratory Scene */}
      <div className="vedika-labs-scene-backdrop" />
      <div className="vedika-labs-scene-overlay" />

      {/* Top Transition Progress Bar */}
      {isNavigating && <div className="vedika-labs-top-progress" />}

      {/* Main Container */}
      {/* Main Centered Container */}
      <div className="vedika-labs-main-grid">

        {/* =========================================================================
            CENTER & RIGHT: Pedestal Stage, Holographic Carousel Behind Bot & Foreground Bot
            ========================================================================= */}
        <div className="vedika-labs-stage-viewport">
          
          {/* Top Ceiling Energy Emitter Beam */}
          <div className="vedika-labs-ceiling-emitter">
            <div className="emitter-ring emitter-ring-outer" />
            <div className="emitter-ring emitter-ring-inner" />
            <div className="emitter-beam-cone" />
          </div>

          {/* Holographic Cards: 2 on the Left, 2 on the Right, Widened around Center Bot */}
          <div className="vedika-labs-carousel-stage">
            {/* Bounded Viewport */}
            <div className="cards-bounded-viewport">
              {/* Classy Curved Guide Track */}
              <div className="cards-curved-guide-track" />

              <div className="cards-stage-track">
                {LABS_DATA.map((lab, idx) => {
                  const isSelected = idx === activeIdx;
                  
                  // Semi-Spherical Curved Formation (Dome arc cupping around the focal center):
                  // 0: Math Lab (Far Left) | 1: Physics Lab (Inner Left) | BOT (Center) | 2: Chem Lab (Inner Right) | 3: Bio Lab (Far Right)
                  const FIXED_SLOTS = [
                    { x: -420, y: -12, z: 46,  rotX: 7, rotY: 34,  rotZ: -3.5 }, // 0: Math Lab (Far Left spherical bank)
                    { x: -230, y: 4,   z: -22, rotX: 3, rotY: 15,  rotZ: -1.2 }, // 1: Physics Lab (Inner Left)
                    { x: 230,  y: 4,   z: -22, rotX: 3, rotY: -15, rotZ: 1.2 },  // 2: Chemistry Lab (Inner Right)
                    { x: 420,  y: -12, z: 46,  rotX: 7, rotY: -34, rotZ: 3.5 }   // 3: Biology Lab (Far Right spherical bank)
                  ];

                  const slot = FIXED_SLOTS[idx];
                  const transX = slot.x;
                  const transY = slot.y;
                  const transZ = slot.z + (isSelected ? 26 : 0);
                  const rotX = slot.rotX;
                  const rotY = slot.rotY;
                  const rotZ = slot.rotZ;
                  const scaleVal = isSelected ? 1.05 : 0.95;

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
                        opacity: isSelected ? 1 : 0.82,
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        transition: 'transform 0.4s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.35s ease, filter 0.35s ease'
                      }}
                      onClick={() => {
                        if (isSelected) {
                          handleLaunchLab(lab.url);
                        } else {
                          dispatch({ type: 'SET_ACTIVE_LAB', payload: idx });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (isSelected) {
                            handleLaunchLab(lab.url);
                          } else {
                            dispatch({ type: 'SET_ACTIVE_LAB', payload: idx });
                          }
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${isSelected ? 'Enter' : 'Select'} ${lab.title}`}
                    >
                    {/* Glowing Card Neon Border & Inner Holographic Light */}
                    <div className="card-glass-panel">
                      {/* Header Titles matching Image 1 */}
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

                      {/* Detailed Classic Holographic Artwork matching Image 1 */}
                      <div className="card-thematic-art">
                        {lab.id === 'math' && (
                          <div className="art-math-detailed">
                            <svg className="art-svg-scene" viewBox="0 0 170 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="mathGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(168, 85, 247, 0.18)" strokeWidth="0.8"/>
                                </pattern>
                                <linearGradient id="piGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#E9D5FF" />
                                  <stop offset="40%" stopColor="#C084FC" />
                                  <stop offset="100%" stopColor="#7E22CE" />
                                </linearGradient>
                                <filter id="piGlow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#A855F7" floodOpacity="0.8" />
                                </filter>
                                <filter id="neonPurpleGlow">
                                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#C084FC" floodOpacity="0.9" />
                                </filter>
                              </defs>
                              
                              {/* Background Math Grid */}
                              <rect x="0" y="0" width="170" height="230" fill="url(#mathGrid)" />
                              
                              {/* Circular tech ring behind Pi */}
                              <circle cx="50" cy="115" r="42" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
                              <circle cx="50" cy="115" r="54" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="0.8" />

                              {/* 3D Wireframe Cube (Isometric Top-Right) */}
                              <g transform="translate(108, 26)" filter="url(#neonPurpleGlow)">
                                <polygon points="24,0 48,12 24,24 0,12" fill="rgba(168, 85, 247, 0.14)" stroke="#C084FC" strokeWidth="1.4" />
                                <polygon points="0,12 24,24 24,50 0,38" fill="rgba(168, 85, 247, 0.20)" stroke="#C084FC" strokeWidth="1.4" />
                                <polygon points="24,24 48,12 48,38 24,50" fill="rgba(168, 85, 247, 0.10)" stroke="#C084FC" strokeWidth="1.4" />
                                <line x1="24" y1="0" x2="24" y2="24" stroke="rgba(192, 132, 252, 0.5)" strokeWidth="0.8" />
                                <line x1="0" y1="25" x2="48" y2="25" stroke="rgba(192, 132, 252, 0.3)" strokeWidth="0.8" />
                              </g>

                              {/* Glowing Sine Wave Curve */}
                              <path
                                d="M 0 145 C 25 105, 50 185, 80 145 C 110 105, 135 185, 170 145"
                                fill="none"
                                stroke="#D8B4FE"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                filter="url(#neonPurpleGlow)"
                              />
                              <path
                                d="M 0 145 C 25 105, 50 185, 80 145 C 110 105, 135 185, 170 145"
                                fill="none"
                                stroke="#A855F7"
                                strokeWidth="6"
                                strokeOpacity="0.4"
                                strokeLinecap="round"
                              />

                              {/* 3D Metallic Pi (π) Symbol */}
                              <g filter="url(#piGlow)">
                                <text
                                  x="34"
                                  y="135"
                                  fill="url(#piGrad)"
                                  fontSize="66"
                                  fontWeight="900"
                                  fontFamily="system-ui, serif"
                                  stroke="#581C87"
                                  strokeWidth="1.5"
                                  letterSpacing="-2"
                                >
                                  π
                                </text>
                              </g>

                              {/* 3D Wireframe Pyramid / Tetrahedron (Bottom-Left) */}
                              <g transform="translate(14, 142)" filter="url(#neonPurpleGlow)">
                                <polygon points="26,0 0,42 26,52" fill="rgba(168, 85, 247, 0.20)" stroke="#C084FC" strokeWidth="1.4" />
                                <polygon points="26,0 52,42 26,52" fill="rgba(168, 85, 247, 0.12)" stroke="#C084FC" strokeWidth="1.4" />
                                <line x1="0" y1="42" x2="52" y2="42" stroke="#E9D5FF" strokeWidth="1.2" strokeDasharray="2 2" />
                              </g>
                            </svg>
                          </div>
                        )}

                        {lab.id === 'physics' && (
                          <div className="art-physics-detailed">
                            <svg className="art-svg-scene" viewBox="0 0 170 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <linearGradient id="chromeBar" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#38BDF8" />
                                  <stop offset="30%" stopColor="#E0F2FE" />
                                  <stop offset="60%" stopColor="#0284C7" />
                                  <stop offset="100%" stopColor="#38BDF8" />
                                </linearGradient>
                                <radialGradient id="sphereGrad" cx="32%" cy="30%" r="68%">
                                  <stop offset="0%" stopColor="#FFFFFF" />
                                  <stop offset="25%" stopColor="#7DD3FC" />
                                  <stop offset="65%" stopColor="#0284C7" />
                                  <stop offset="100%" stopColor="#03254C" />
                                </radialGradient>
                                <filter id="blueGlow">
                                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00D4FF" floodOpacity="0.8" />
                                </filter>
                              </defs>

                              {/* Orbital Electron / Planetary Ellipses in Background */}
                              <g transform="translate(85, 115) rotate(-32)">
                                <ellipse cx="0" cy="0" rx="72" ry="34" stroke="rgba(56, 189, 248, 0.32)" strokeWidth="1" fill="none" />
                                <ellipse cx="0" cy="0" rx="84" ry="46" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="0.8" strokeDasharray="3 3" fill="none" />
                              </g>

                              {/* Floating Glossy Blue Spheres in Space */}
                              {/* Large Sphere Bottom-Left */}
                              <g transform="translate(18, 148)" filter="url(#blueGlow)">
                                <circle cx="16" cy="16" r="16" fill="url(#sphereGrad)" />
                                <ellipse cx="12" cy="11" rx="5" ry="3" fill="rgba(255,255,255,0.7)" />
                              </g>
                              {/* Medium Sphere Top-Right */}
                              <g transform="translate(132, 28)">
                                <circle cx="9" cy="9" r="9" fill="url(#sphereGrad)" />
                              </g>
                              {/* Small satellite */}
                              <circle cx="122" cy="162" r="4.5" fill="url(#sphereGrad)" />

                              {/* NEWTON'S CRADLE (Centerpiece) */}
                              <g transform="translate(16, 42)" filter="url(#blueGlow)">
                                {/* Top Horizontal Chrome Bar */}
                                <rect x="8" y="0" width="124" height="6" rx="3" fill="url(#chromeBar)" />

                                {/* Suspension Strings & Spheres */}
                                {/* Sphere 1 */}
                                <line x1="28" y1="6" x2="28" y2="60" stroke="#7DD3FC" strokeWidth="1" />
                                <circle cx="28" cy="67" r="10" fill="url(#sphereGrad)" />

                                {/* Sphere 2 */}
                                <line x1="47" y1="6" x2="47" y2="60" stroke="#7DD3FC" strokeWidth="1" />
                                <circle cx="47" cy="67" r="10" fill="url(#sphereGrad)" />

                                {/* Sphere 3 */}
                                <line x1="66" y1="6" x2="66" y2="60" stroke="#7DD3FC" strokeWidth="1" />
                                <circle cx="66" cy="67" r="10" fill="url(#sphereGrad)" />

                                {/* Sphere 4 */}
                                <line x1="85" y1="6" x2="85" y2="60" stroke="#7DD3FC" strokeWidth="1" />
                                <circle cx="85" cy="67" r="10" fill="url(#sphereGrad)" />

                                {/* Sphere 5: Swung Out to the Right in Kinetic Momentum! */}
                                <g className="newton-ball-active">
                                  <line x1="104" y1="6" x2="128" y2="48" stroke="#7DD3FC" strokeWidth="1.2" />
                                  <circle cx="132" cy="54" r="10.5" fill="url(#sphereGrad)" />
                                  {/* Motion dash trails */}
                                  <path d="M 112 66 C 122 64, 128 59, 131 55" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 2" opacity="0.75" />
                                </g>
                              </g>

                              {/* Sci-Fi Etched Diagonal Tick Marks in Bottom Right */}
                              <g transform="translate(122, 178)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1.2">
                                <line x1="0" y1="18" x2="18" y2="0" />
                                <line x1="8" y1="20" x2="24" y2="4" />
                                <line x1="16" y1="22" x2="30" y2="8" />
                              </g>
                            </svg>
                          </div>
                        )}

                        {lab.id === 'chemistry' && (
                          <div className="art-chem-detailed">
                            <svg className="art-svg-scene" viewBox="0 0 170 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="hexGrid" width="24" height="41.56" patternUnits="userSpaceOnUse">
                                  <path d="M12 0 L24 6.93 L24 20.78 L12 27.71 L0 20.78 L0 6.93 Z" fill="none" stroke="rgba(0, 229, 163, 0.16)" strokeWidth="0.8"/>
                                  <path d="M12 41.56 L24 34.63 L24 20.78 L12 27.71 L0 20.78 L0 34.63 Z" fill="none" stroke="rgba(0, 229, 163, 0.16)" strokeWidth="0.8"/>
                                </pattern>
                                <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.85" />
                                  <stop offset="60%" stopColor="#00E5A3" stopOpacity="0.95" />
                                  <stop offset="100%" stopColor="#047857" />
                                </linearGradient>
                                <radialGradient id="atomGrad" cx="35%" cy="32%" r="65%">
                                  <stop offset="0%" stopColor="#FFFFFF" />
                                  <stop offset="35%" stopColor="#34D399" />
                                  <stop offset="80%" stopColor="#059669" />
                                  <stop offset="100%" stopColor="#064E3B" />
                                </radialGradient>
                                <filter id="chemGlow">
                                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00E5A3" floodOpacity="0.85" />
                                </filter>
                              </defs>

                              {/* Background Hexagonal Carbon Lattice Grid */}
                              <rect x="0" y="0" width="170" height="230" fill="url(#hexGrid)" />

                              {/* 3D Ball-and-Stick Molecular Model (Top-Right) */}
                              <g transform="translate(92, 22)" filter="url(#chemGlow)">
                                <line x1="28" y1="12" x2="52" y2="28" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
                                <line x1="28" y1="12" x2="8" y2="34" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
                                <line x1="52" y1="28" x2="44" y2="54" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
                                <line x1="8" y1="34" x2="22" y2="58" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />

                                <circle cx="28" cy="12" r="10" fill="url(#atomGrad)" />
                                <circle cx="52" cy="28" r="9" fill="url(#atomGrad)" />
                                <circle cx="8" cy="34" r="8" fill="url(#atomGrad)" />
                                <circle cx="44" cy="54" r="7.5" fill="url(#atomGrad)" />
                                <circle cx="22" cy="58" r="6" fill="url(#atomGrad)" />
                              </g>

                              {/* Conical Erlenmeyer Flask (Center-Left) */}
                              <g transform="translate(14, 82)" filter="url(#chemGlow)">
                                <path
                                  d="M 28 54 L 46 54 L 66 98 C 68 102, 65 106, 60 106 L 14 106 C 9 106, 6 102, 8 98 Z"
                                  fill="url(#liquidGrad)"
                                />
                                <ellipse cx="37" cy="54" rx="9" ry="2.5" fill="#6EE7B7" />

                                <path
                                  d="M 31 16 L 31 38 L 8 98 C 5 104, 9 110, 16 110 L 58 110 C 65 110, 69 104, 66 98 L 43 38 L 43 16 M 28 16 L 46 16"
                                  fill="none"
                                  stroke="#A7F3D0"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                <path d="M 16 94 L 34 46" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />

                                <circle cx="34" cy="88" r="2.5" fill="#FFFFFF" opacity="0.8" />
                                <circle cx="42" cy="74" r="2.0" fill="#FFFFFF" opacity="0.8" />
                                <circle cx="30" cy="62" r="1.8" fill="#FFFFFF" opacity="0.7" />
                                <circle cx="37" cy="44" r="1.5" fill="#6EE7B7" opacity="0.6" />
                              </g>

                              {/* Round-Bottom Boiling Flask (Center-Right) */}
                              <g transform="translate(86, 114)" filter="url(#chemGlow)">
                                <path
                                  d="M 18 36 A 24 24 0 0 0 54 36 Z"
                                  fill="url(#liquidGrad)"
                                />
                                <ellipse cx="36" cy="36" rx="18" ry="4" fill="#6EE7B7" />

                                <path
                                  d="M 32 6 L 32 18 C 22 22, 12 32, 12 42 C 12 55, 23 66, 36 66 C 49 66, 60 55, 60 42 C 60 32, 50 22, 40 18 L 40 6 M 29 6 L 43 6"
                                  fill="none"
                                  stroke="#A7F3D0"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path d="M 18 44 A 18 18 0 0 0 30 58" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                                <circle cx="36" cy="50" r="2.2" fill="#FFFFFF" opacity="0.8" />
                                <circle cx="42" cy="42" r="1.6" fill="#FFFFFF" opacity="0.7" />
                              </g>

                              {/* Floating Droplets */}
                              <circle cx="30" cy="55" r="3" fill="#2DD4BF" opacity="0.65" />
                              <circle cx="145" cy="180" r="2.5" fill="#2DD4BF" opacity="0.5" />
                            </svg>
                          </div>
                        )}

                        {lab.id === 'biology' && (
                          <div className="art-bio-detailed">
                            <svg className="art-svg-scene" viewBox="0 0 170 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <pattern id="bioGrid" width="22" height="22" patternUnits="userSpaceOnUse">
                                  <circle cx="11" cy="11" r="1" fill="rgba(245, 158, 11, 0.22)" />
                                </pattern>
                                <linearGradient id="dnaStrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#FEF3C7" />
                                  <stop offset="50%" stopColor="#F59E0B" />
                                  <stop offset="100%" stopColor="#D97706" />
                                </linearGradient>
                                <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#A7F3D0" />
                                  <stop offset="40%" stopColor="#34D399" />
                                  <stop offset="100%" stopColor="#059669" />
                                </linearGradient>
                                <radialGradient id="cellGrad" cx="38%" cy="36%" r="64%">
                                  <stop offset="0%" stopColor="rgba(254, 243, 199, 0.4)" />
                                  <stop offset="40%" stopColor="rgba(245, 158, 11, 0.25)" />
                                  <stop offset="85%" stopColor="rgba(16, 185, 129, 0.45)" />
                                  <stop offset="100%" stopColor="rgba(5, 150, 105, 0.65)" />
                                </radialGradient>
                                <filter id="goldGlow">
                                  <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.85" />
                                </filter>
                                <filter id="leafGlow">
                                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.8" />
                                </filter>
                              </defs>

                              {/* Background Organic Dot/Cellular Matrix */}
                              <rect x="0" y="0" width="170" height="230" fill="url(#bioGrid)" />

                              {/* GLOWING DNA DOUBLE HELIX (Main Spine) */}
                              <g transform="translate(38, 10)" filter="url(#goldGlow)">
                                <line x1="12" y1="18" x2="38" y2="18" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
                                <line x1="15" y1="36" x2="35" y2="36" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="25" cy="54" r="3.2" fill="#F59E0B" />
                                <line x1="15" y1="72" x2="35" y2="72" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="90" x2="38" y2="90" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
                                <line x1="15" y1="108" x2="35" y2="108" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="25" cy="126" r="3.2" fill="#F59E0B" />
                                <line x1="15" y1="144" x2="35" y2="144" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
                                <line x1="12" y1="162" x2="38" y2="162" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />

                                <path
                                  d="M 12 10 C 26 28, 38 42, 38 54 C 38 66, 12 80, 12 92 C 12 104, 38 116, 38 128 C 38 140, 12 154, 12 168 C 12 178, 26 190, 38 200"
                                  fill="none"
                                  stroke="url(#dnaStrandGrad)"
                                  strokeWidth="3.2"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M 38 10 C 24 28, 12 42, 12 54 C 12 66, 38 80, 38 92 C 38 104, 12 116, 12 128 C 12 140, 38 154, 38 168 C 38 178, 24 190, 12 200"
                                  fill="none"
                                  stroke="url(#dnaStrandGrad)"
                                  strokeWidth="3.2"
                                  strokeLinecap="round"
                                />
                              </g>

                              {/* LUSH GREEN BOTANICAL LEAVES */}
                              <g transform="translate(18, 32) rotate(-22)" filter="url(#leafGlow)">
                                <path d="M 0 0 C 14 3, 24 16, 26 28 C 14 28, 4 20, 0 0 Z" fill="url(#leafGrad)" />
                                <path d="M 0 0 C 10 12, 18 20, 26 28" stroke="#ECFDF5" strokeWidth="0.8" />
                              </g>

                              <g transform="translate(108, 92) rotate(34)" filter="url(#leafGlow)">
                                <path d="M 0 0 C 16 4, 28 18, 30 32 C 16 32, 4 22, 0 0 Z" fill="url(#leafGrad)" />
                                <path d="M 0 0 C 12 14, 22 22, 30 32" stroke="#ECFDF5" strokeWidth="0.8" />
                              </g>

                              <g transform="translate(12, 128) rotate(-16)" filter="url(#leafGlow)">
                                <path d="M 0 0 C 14 3, 22 14, 24 25 C 12 25, 4 18, 0 0 Z" fill="url(#leafGrad)" />
                                <path d="M 0 0 C 9 10, 16 18, 24 25" stroke="#ECFDF5" strokeWidth="0.7" />
                              </g>

                              {/* CELL VESICLE / SPHERE */}
                              <g transform="translate(102, 142)" filter="url(#goldGlow)">
                                <circle cx="28" cy="28" r="26" fill="url(#cellGrad)" stroke="#F59E0B" strokeWidth="1.8" />
                                <circle cx="28" cy="28" r="10" fill="#10B981" stroke="#34D399" strokeWidth="1.2" />
                                <circle cx="26" cy="26" r="3" fill="#ECFDF5" />
                                <ellipse cx="18" cy="22" rx="4" ry="2.2" fill="#F59E0B" opacity="0.85" transform="rotate(-30 18 22)" />
                                <ellipse cx="38" cy="20" rx="3.5" ry="2" fill="#F59E0B" opacity="0.85" transform="rotate(25 38 20)" />
                                <ellipse cx="32" cy="40" rx="4" ry="2" fill="#F59E0B" opacity="0.85" transform="rotate(-15 32 40)" />
                              </g>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Card Selection Glow Indicator */}
                      {isSelected && (
                        <div className="card-active-glow-aura" />
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* FOREGROUND BOT CHARACTER */}
          <div className="vedika-labs-pedestal-stage" style={{ pointerEvents: 'none' }}>
            {/* Middle Bot from Home Page (VedikaParticleBot with natural vibrant colors & crisp particles) */}
            <div className="vedika-labs-bot-foreground" style={{ pointerEvents: 'none' }}>
              {/* Floating ambient glow under bot feet */}
              <div className="bot-pedestal-shadow" style={{ pointerEvents: 'none' }} />
              <div style={{ width: 320, height: 320, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <VedikaParticleBot
                  src={activeLab.botImage || '/vedika-bot-physics.png?v=3'}
                  width={320}
                  height={320}
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

      {/* =========================================================================
          BOTTOM FLOATING METRICS BANNER
          ========================================================================= */}
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
                    background: `rgba(255, 255, 255, 0.04)`,
                    borderColor: `rgba(255, 255, 255, 0.1)`
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

    </div>
  );
}
