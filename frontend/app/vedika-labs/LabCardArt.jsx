'use client';

import React, { memo } from 'react';

/**
 * MATH LAB ART
 * Live Features:
 * - Seamless continuous oscillating mathematical sine wave propagation
 * - Secondary harmonic wave stream
 * - Floating/tilting 3D isometric wireframe cube
 * - Ambient levitating metallic Pi (π) with specular gleam
 * - Wireframe pyramid depth geometry
 */
export const MathLabArt = memo(function MathLabArt() {
  return (
    <div className="art-math-detailed">
      <svg className="art-svg-scene" viewBox="0 0 170 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mathGrid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(168, 85, 247, 0.16)" strokeWidth="0.8"/>
          </pattern>
          <linearGradient id="piGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAF5FF" />
            <stop offset="35%" stopColor="#D8B4FE" />
            <stop offset="70%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6B21A8" />
          </linearGradient>
          <filter id="piGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#A855F7" floodOpacity="0.85" />
          </filter>
          <filter id="neonPurpleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#C084FC" floodOpacity="0.9" />
          </filter>
          <clipPath id="mathWaveClip">
            <rect x="0" y="80" width="170" height="130" />
          </clipPath>
        </defs>
        
        {/* Background Math Coordinate Grid */}
        <rect x="0" y="0" width="170" height="240" fill="url(#mathGrid)" />
        
        {/* Circular tech ring behind Pi */}
        <circle cx="50" cy="115" r="42" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="50" cy="115" r="54" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="0.8" />

        {/* 3D Wireframe Cube (Isometric Top-Right) with Floating Live Animation */}
        <g className="live-math-cube" transform="translate(108, 24)" filter="url(#neonPurpleGlow)">
          <polygon points="24,0 48,12 24,24 0,12" fill="rgba(168, 85, 247, 0.18)" stroke="#C084FC" strokeWidth="1.4" />
          <polygon points="0,12 24,24 24,50 0,38" fill="rgba(168, 85, 247, 0.24)" stroke="#C084FC" strokeWidth="1.4" />
          <polygon points="24,24 48,12 48,38 24,50" fill="rgba(168, 85, 247, 0.12)" stroke="#C084FC" strokeWidth="1.4" />
          <line x1="24" y1="0" x2="24" y2="24" stroke="rgba(192, 132, 252, 0.6)" strokeWidth="0.8" />
          <line x1="0" y1="25" x2="48" y2="25" stroke="rgba(192, 132, 252, 0.4)" strokeWidth="0.8" />
        </g>

        {/* LIVE SINE WAVE OSCILLATION (Continuous Seamless Propagation) */}
        <g clipPath="url(#mathWaveClip)">
          {/* Background Ambient Sine Flow */}
          <g className="live-math-sine-ambient">
            <path
              d="M -70 152 C -52.5 125, -35 178, -17.5 152 C 0 125, 17.5 178, 35 152 C 52.5 125, 70 178, 87.5 152 C 105 125, 122.5 178, 140 152 C 157.5 125, 175 178, 192.5 152 C 210 125, 227.5 178, 245 152 C 262.5 125, 280 178, 297.5 152 C 315 125, 332.5 178, 350 152"
              fill="none"
              stroke="#A855F7"
              strokeWidth="6"
              strokeOpacity="0.32"
              strokeLinecap="round"
            />
          </g>

          {/* Primary High-Voltage Neon Sine Wave */}
          <g className="live-math-sine-primary" filter="url(#neonPurpleGlow)">
            <path
              d="M -70 152 C -52.5 125, -35 178, -17.5 152 C 0 125, 17.5 178, 35 152 C 52.5 125, 70 178, 87.5 152 C 105 125, 122.5 178, 140 152 C 157.5 125, 175 178, 192.5 152 C 210 125, 227.5 178, 245 152 C 262.5 125, 280 178, 297.5 152 C 315 125, 332.5 178, 350 152"
              fill="none"
              stroke="#E9D5FF"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </g>

          {/* Fast Micro-Harmonic Sine Tracer */}
          <g className="live-math-sine-secondary">
            <path
              d="M -35 152 C -26.25 138, -17.5 166, -8.75 152 C 0 138, 8.75 166, 17.5 152 C 26.25 138, 35 166, 43.75 152 C 52.5 138, 61.25 166, 70 152 C 78.75 138, 87.5 166, 96.25 152 C 105 138, 113.75 166, 122.5 152 C 131.25 138, 140 166, 148.75 152 C 157.5 138, 166.25 166, 175 152 C 183.75 138, 192.5 166, 201.25 152 C 210 138, 218.75 166, 227.5 152"
              fill="none"
              stroke="#C084FC"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.75"
            />
          </g>
        </g>

        {/* 3D Metallic Pi (π) Symbol with Gentle Live Floating */}
        <g className="live-math-pi" filter="url(#piGlow)">
          <text
            x="34"
            y="136"
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
        <g transform="translate(14, 154)" filter="url(#neonPurpleGlow)">
          <polygon points="26,0 0,42 26,52" fill="rgba(168, 85, 247, 0.22)" stroke="#C084FC" strokeWidth="1.4" />
          <polygon points="26,0 52,42 26,52" fill="rgba(168, 85, 247, 0.14)" stroke="#C084FC" strokeWidth="1.4" />
          <line x1="0" y1="42" x2="52" y2="42" stroke="#E9D5FF" strokeWidth="1.2" strokeDasharray="2 2" />
        </g>
      </svg>
    </div>
  );
});

/**
 * PHYSICS LAB ART
 * Live Features:
 * - True classic Newton's Cradle pendulum with momentum conservation:
 *   Left ball swings out, swings down, impacts stationary middle balls;
 *   Right ball swings out with kinetic momentum, returns, and impacts;
 * - Rotating orbital electron rings
 * - Floating space spheres with specular highlights
 */
export const PhysicsLabArt = memo(function PhysicsLabArt() {
  return (
    <div className="art-physics-detailed">
      <svg className="art-svg-scene" viewBox="0 0 170 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="chromeBar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="30%" stopColor="#F0F9FF" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <radialGradient id="sphereGrad" cx="30%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#BAE6FD" />
            <stop offset="55%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#082F49" />
          </radialGradient>
          <radialGradient id="sphereGradActive" cx="32%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#7DD3FC" />
            <stop offset="65%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#03254C" />
          </radialGradient>
          <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00D4FF" floodOpacity="0.85" />
          </filter>
          <filter id="impactShockGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#38BDF8" floodOpacity="1" />
          </filter>
        </defs>

        {/* Live Rotating Orbital Electron / Planetary Rings */}
        <g className="live-physics-orbit" transform="translate(85, 120)">
          <ellipse cx="0" cy="0" rx="74" ry="34" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" fill="none" />
          <ellipse cx="0" cy="0" rx="86" ry="46" stroke="rgba(56, 189, 248, 0.20)" strokeWidth="0.8" strokeDasharray="3 3" fill="none" />
          <circle cx="70" cy="10" r="2.5" fill="#38BDF8" />
          <circle cx="-65" cy="-12" r="2" fill="#E0F2FE" />
        </g>

        {/* Floating Glossy Blue Spheres in Space */}
        <g className="live-physics-float-sphere" transform="translate(18, 160)" filter="url(#blueGlow)">
          <circle cx="16" cy="16" r="16" fill="url(#sphereGrad)" />
          <ellipse cx="12" cy="11" rx="5" ry="3" fill="rgba(255,255,255,0.75)" />
        </g>
        <g className="live-physics-float-sphere-small" transform="translate(136, 28)">
          <circle cx="8" cy="8" r="8" fill="url(#sphereGrad)" />
        </g>
        <circle cx="124" cy="175" r="4.5" fill="url(#sphereGrad)" />

        {/* NEWTON'S CRADLE (Authentic Real Pendulum Mechanics) */}
        <g transform="translate(16, 40)" filter="url(#blueGlow)">
          {/* Top Horizontal Chrome Suspension Bar */}
          <rect x="8" y="0" width="124" height="6" rx="3" fill="url(#chromeBar)" />
          <rect x="12" y="1" width="116" height="1.5" fill="rgba(255,255,255,0.8)" />

          {/* Impact kinetic shock flash (pulsing on collisions) */}
          <circle className="live-newton-impact-flash-left" cx="39" cy="68" r="7" fill="rgba(56, 189, 248, 0.9)" filter="url(#impactShockGlow)" opacity="0" />
          <circle className="live-newton-impact-flash-right" cx="95" cy="68" r="7" fill="rgba(56, 189, 248, 0.9)" filter="url(#impactShockGlow)" opacity="0" />

          {/* BALL 1 (Left Active Pendulum: Swings out left, impacts Ball 2) */}
          <g className="live-newton-arm-left">
            <line x1="28" y1="6" x2="28" y2="60" stroke="#7DD3FC" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="28" cy="68" r="10" fill="url(#sphereGradActive)" />
            <ellipse cx="25" cy="64" rx="3.5" ry="2" fill="rgba(255,255,255,0.8)" />
          </g>

          {/* BALL 2 (Middle Stationary Ball) */}
          <g>
            <line x1="47" y1="6" x2="47" y2="60" stroke="#7DD3FC" strokeWidth="1" />
            <circle cx="47" cy="68" r="10" fill="url(#sphereGrad)" />
            <ellipse cx="44" cy="64" rx="3.5" ry="2" fill="rgba(255,255,255,0.7)" />
          </g>

          {/* BALL 3 (Middle Stationary Ball) */}
          <g>
            <line x1="66" y1="6" x2="66" y2="60" stroke="#7DD3FC" strokeWidth="1" />
            <circle cx="66" cy="68" r="10" fill="url(#sphereGrad)" />
            <ellipse cx="63" cy="64" rx="3.5" ry="2" fill="rgba(255,255,255,0.7)" />
          </g>

          {/* BALL 4 (Middle Stationary Ball) */}
          <g>
            <line x1="85" y1="6" x2="85" y2="60" stroke="#7DD3FC" strokeWidth="1" />
            <circle cx="85" cy="68" r="10" fill="url(#sphereGrad)" />
            <ellipse cx="82" cy="64" rx="3.5" ry="2" fill="rgba(255,255,255,0.7)" />
          </g>

          {/* BALL 5 (Right Active Pendulum: Swings out right upon impact from Ball 1) */}
          <g className="live-newton-arm-right">
            <line x1="104" y1="6" x2="104" y2="60" stroke="#7DD3FC" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="104" cy="68" r="10" fill="url(#sphereGradActive)" />
            <ellipse cx="101" cy="64" rx="3.5" ry="2" fill="rgba(255,255,255,0.8)" />
          </g>
        </g>

        {/* Sci-Fi Diagonal Tick Marks */}
        <g transform="translate(122, 192)" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1.2">
          <line x1="0" y1="18" x2="18" y2="0" />
          <line x1="8" y1="20" x2="24" y2="4" />
          <line x1="16" y1="22" x2="30" y2="8" />
        </g>
      </svg>
    </div>
  );
});

/**
 * CHEMISTRY LAB ART
 * Live Features:
 * - Real effervescent fizzing bubbles rising and popping inside the conical Erlenmeyer flask
 * - Rising vapor fizz mist wafting from flask neck
 * - Subtle liquid surface meniscus sloshing
 * - 3D Ball-and-Stick molecule floating & rotating in isometric space
 */
export const ChemistryLabArt = memo(function ChemistryLabArt() {
  return (
    <div className="art-chem-detailed">
      <svg className="art-svg-scene" viewBox="0 0 170 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexGrid" width="24" height="41.56" patternUnits="userSpaceOnUse">
            <path d="M12 0 L24 6.93 L24 20.78 L12 27.71 L0 20.78 L0 6.93 Z" fill="none" stroke="rgba(0, 229, 163, 0.16)" strokeWidth="0.8"/>
            <path d="M12 41.56 L24 34.63 L24 20.78 L12 27.71 L0 20.78 L0 34.63 Z" fill="none" stroke="rgba(0, 229, 163, 0.16)" strokeWidth="0.8"/>
          </pattern>
          <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.88" />
            <stop offset="60%" stopColor="#00E5A3" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <radialGradient id="atomGrad" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#34D399" />
            <stop offset="80%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </radialGradient>
          <filter id="chemGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00E5A3" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Background Hexagonal Carbon Lattice Grid */}
        <rect x="0" y="0" width="170" height="240" fill="url(#hexGrid)" />

        {/* 3D Ball-and-Stick Molecular Model (Top-Right) with Floating Live Drift */}
        <g className="live-chem-molecule" transform="translate(94, 22)" filter="url(#chemGlow)">
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

        {/* Conical Erlenmeyer Flask (Center-Left) with Active Fizz & Rising Bubbles */}
        <g transform="translate(14, 88)" filter="url(#chemGlow)">
          {/* Flask Liquid Fill */}
          <path
            d="M 28 54 L 46 54 L 66 98 C 68 102, 65 106, 60 106 L 14 106 C 9 106, 6 102, 8 98 Z"
            fill="url(#liquidGrad)"
          />

          {/* Liquid Meniscus with Gentle Wavy Surface */}
          <ellipse className="live-chem-meniscus" cx="37" cy="54" rx="9" ry="2.5" fill="#6EE7B7" />

          {/* LIVE EFFERVESCENT BUBBLE FIZZ STREAM */}
          <g className="live-chem-fizz-layer">
            <circle className="chem-fizz-b1" cx="24" cy="100" r="2.2" fill="#FFFFFF" />
            <circle className="chem-fizz-b2" cx="33" cy="104" r="3.2" fill="#ECFDF5" />
            <circle className="chem-fizz-b3" cx="42" cy="98"  r="2.5" fill="#A7F3D0" />
            <circle className="chem-fizz-b4" cx="49" cy="102" r="1.8" fill="#FFFFFF" />
            <circle className="chem-fizz-b5" cx="28" cy="95"  r="2.8" fill="#ECFDF5" />
            <circle className="chem-fizz-b6" cx="38" cy="92"  r="2.0" fill="#FFFFFF" />
            <circle className="chem-fizz-b7" cx="45" cy="88"  r="1.6" fill="#A7F3D0" />
          </g>

          {/* Rising Vapor Mist Puffs from Neck */}
          <g className="live-chem-vapor-stream">
            <circle className="chem-vapor-p1" cx="37" cy="14" r="3.5" fill="rgba(110, 231, 183, 0.7)" />
            <circle className="chem-vapor-p2" cx="35" cy="6"  r="4.2" fill="rgba(52, 211, 153, 0.5)" />
            <circle className="chem-vapor-p3" cx="39" cy="-2" r="5.0" fill="rgba(167, 243, 208, 0.3)" />
          </g>

          {/* Glass Contour & Neck */}
          <path
            d="M 31 16 L 31 38 L 8 98 C 5 104, 9 110, 16 110 L 58 110 C 65 110, 69 104, 66 98 L 43 38 L 43 16 M 28 16 L 46 16"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glass Highlight Reflection */}
          <path d="M 16 94 L 34 46" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Round-Bottom Boiling Flask (Center-Right) with Secondary Bubbles */}
        <g transform="translate(86, 120)" filter="url(#chemGlow)">
          <path
            d="M 18 36 A 24 24 0 0 0 54 36 Z"
            fill="url(#liquidGrad)"
          />
          <ellipse cx="36" cy="36" rx="18" ry="4" fill="#6EE7B7" />

          {/* Micro-bubbling in boiling flask */}
          <circle className="chem-fizz-b3" cx="30" cy="50" r="2.2" fill="#FFFFFF" />
          <circle className="chem-fizz-b1" cx="42" cy="46" r="1.8" fill="#ECFDF5" />

          <path
            d="M 32 6 L 32 18 C 22 22, 12 32, 12 42 C 12 55, 23 66, 36 66 C 49 66, 60 55, 60 42 C 60 32, 50 22, 40 18 L 40 6 M 29 6 L 43 6"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 18 44 A 18 18 0 0 0 30 58" stroke="rgba(255,255,255,0.65)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  );
});

/**
 * BIOLOGY LAB ART
 * Live Features:
 * - Live diagonal movement of the DNA sequence (traveling helical flow across the diagonal axis)
 * - Organic swaying botanical leaves
 * - Pulsing cellular vesicle with cytoplasmic respiration
 */
export const BiologyLabArt = memo(function BiologyLabArt() {
  return (
    <div className="art-bio-detailed">
      <svg className="art-svg-scene" viewBox="0 0 170 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="bioGrid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1" fill="rgba(245, 158, 11, 0.2)" />
          </pattern>
          <linearGradient id="dnaStrandGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="dnaStrandGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="40%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <radialGradient id="cellGrad" cx="38%" cy="36%" r="64%">
            <stop offset="0%" stopColor="rgba(254, 243, 199, 0.45)" />
            <stop offset="40%" stopColor="rgba(245, 158, 11, 0.25)" />
            <stop offset="85%" stopColor="rgba(16, 185, 129, 0.45)" />
            <stop offset="100%" stopColor="rgba(5, 150, 105, 0.65)" />
          </radialGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.85" />
          </filter>
          <filter id="leafGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.8" />
          </filter>
          <clipPath id="bioDnaClip">
            <rect x="0" y="0" width="170" height="240" />
          </clipPath>
        </defs>

        {/* Background Organic Dot Matrix */}
        <rect x="0" y="0" width="170" height="240" fill="url(#bioGrid)" />

        {/* LIVE DIAGONAL DNA SEQUENCE (Moving smoothly along diagonal trajectory) */}
        <g clipPath="url(#bioDnaClip)">
          <g className="live-bio-dna-diagonal-container" transform="translate(68, 118) rotate(-34)" filter="url(#goldGlow)">
            <g className="live-bio-dna-track">
              {/* Repeating Base Pair Rungs along the diagonal helix */}
              {[-120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map((pos, i) => {
                const isEven = i % 2 === 0;
                return (
                  <g key={i} transform={`translate(${pos}, 0)`}>
                    <line x1="0" y1="-14" x2="0" y2="14" stroke={isEven ? '#FDE68A' : '#6EE7B7'} strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="0" cy="-14" r="2.8" fill={isEven ? '#F59E0B' : '#10B981'} />
                    <circle cx="0" cy="14"  r="2.8" fill={isEven ? '#38BDF8' : '#F43F5E'} />
                    <circle cx="0" cy="0"   r="1.8" fill="#FFFFFF" />
                  </g>
                );
              })}

              {/* Helix Strand A (Sinusoidal ribbon) */}
              <path
                d="M -150 0 C -135 -20, -105 -20, -90 0 C -75 20, -45 20, -30 0 C -15 -20, 15 -20, 30 0 C 45 20, 75 20, 90 0 C 105 -20, 135 -20, 150 0 C 165 20, 195 20, 210 0"
                fill="none"
                stroke="url(#dnaStrandGrad1)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />

              {/* Helix Strand B (Intertwined complementary ribbon) */}
              <path
                d="M -150 0 C -135 20, -105 20, -90 0 C -75 -20, -45 -20, -30 0 C -15 20, 15 20, 30 0 C 45 -20, 75 -20, 90 0 C 105 20, 135 20, 150 0 C 165 -20, 195 -20, 210 0"
                fill="none"
                stroke="url(#dnaStrandGrad2)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>

        {/* LUSH GREEN BOTANICAL LEAVES (Gentle Organic Breathing Sway) */}
        <g className="live-bio-leaf-left" transform="translate(18, 36) rotate(-22)" filter="url(#leafGlow)">
          <path d="M 0 0 C 14 3, 24 16, 26 28 C 14 28, 4 20, 0 0 Z" fill="url(#leafGrad)" />
          <path d="M 0 0 C 10 12, 18 20, 26 28" stroke="#ECFDF5" strokeWidth="0.8" />
        </g>

        <g className="live-bio-leaf-right" transform="translate(112, 98) rotate(34)" filter="url(#leafGlow)">
          <path d="M 0 0 C 16 4, 28 18, 30 32 C 16 32, 4 22, 0 0 Z" fill="url(#leafGrad)" />
          <path d="M 0 0 C 12 14, 22 22, 30 32" stroke="#ECFDF5" strokeWidth="0.8" />
        </g>

        {/* CELL VESICLE / SPHERE (Pulsing Rhythmic Cytoplasmic Respiration) */}
        <g className="live-bio-cell" transform="translate(104, 152)" filter="url(#goldGlow)">
          <circle cx="28" cy="28" r="26" fill="url(#cellGrad)" stroke="#F59E0B" strokeWidth="1.8" />
          <circle cx="28" cy="28" r="10" fill="#10B981" stroke="#34D399" strokeWidth="1.2" />
          <circle cx="26" cy="26" r="3" fill="#ECFDF5" />
          <ellipse className="live-bio-organelle" cx="18" cy="22" rx="4" ry="2.2" fill="#F59E0B" opacity="0.85" transform="rotate(-30 18 22)" />
          <ellipse className="live-bio-organelle" cx="38" cy="20" rx="3.5" ry="2" fill="#F59E0B" opacity="0.85" transform="rotate(25 38 20)" />
          <ellipse className="live-bio-organelle" cx="32" cy="40" rx="4" ry="2" fill="#F59E0B" opacity="0.85" transform="rotate(-15 32 40)" />
        </g>
      </svg>
    </div>
  );
});

export const LabThematicArt = memo(function LabThematicArt({ labId }) {
  switch (labId) {
    case 'math':
      return <MathLabArt />;
    case 'physics':
      return <PhysicsLabArt />;
    case 'chemistry':
      return <ChemistryLabArt />;
    case 'biology':
      return <BiologyLabArt />;
    default:
      return null;
  }
});
