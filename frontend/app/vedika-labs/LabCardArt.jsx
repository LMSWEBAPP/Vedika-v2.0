'use client';

import React, { memo, useRef, useEffect } from 'react';

/**
 * 1. MATH LAB ART - 3D Sci-Fi Implementation
 * - 3D Sculpted Metallic Pi (π) with Bevel Highlight & Extruded Depth
 * - 3D Volumetric Rotating Wireframe Cube with Glowing Vertex Nodes
 * - Continuous 3D Parametric Wave Surface with Laser Harmonic Flow
 * - 3D Wireframe Tetrahedron Pyramid
 */
export const MathLabArt = memo(function MathLabArt() {
  return (
    <div className="art-math-detailed">
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="math3DGrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(168, 85, 247, 0.18)" strokeWidth="0.8"/>
            <circle cx="18" cy="18" r="0.8" fill="rgba(192, 132, 252, 0.4)" />
          </pattern>
          {/* Metallic 3D Pi Gradients */}
          <linearGradient id="pi3DMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#E9D5FF" />
            <stop offset="50%" stopColor="#C084FC" />
            <stop offset="75%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#581C87" />
          </linearGradient>
          <linearGradient id="pi3DEdge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAF5FF" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7E22CE" />
          </radialGradient>
          <filter id="purple3DGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#A855F7" floodOpacity="0.8" />
          </filter>
          <filter id="laserBeamGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#E9D5FF" floodOpacity="1" />
          </filter>
          <clipPath id="mathSurfaceClip">
            <rect x="0" y="85" width="175" height="125" />
          </clipPath>
        </defs>
        
        {/* Background Coordinate Perspective Grid */}
        <rect x="0" y="0" width="175" height="235" fill="url(#math3DGrid)" />
        
        {/* 3D Circular Polar Rings */}
        <ellipse cx="50" cy="115" rx="46" ry="24" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
        <ellipse cx="50" cy="115" rx="60" ry="32" stroke="rgba(168, 85, 247, 0.18)" strokeWidth="0.8" />

        {/* 3D VOLUMETRIC ISOMETRIC ROTATING CUBE */}
        <g className="live-math-cube-3d" transform="translate(112, 26)" filter="url(#purple3DGlow)">
          {/* Top Facet */}
          <polygon points="26,0 52,13 26,26 0,13" fill="rgba(192, 132, 252, 0.28)" stroke="#E9D5FF" strokeWidth="1.2" />
          {/* Left Facet */}
          <polygon points="0,13 26,26 26,54 0,41" fill="rgba(168, 85, 247, 0.38)" stroke="#C084FC" strokeWidth="1.2" />
          {/* Right Facet */}
          <polygon points="26,26 52,13 52,41 26,54" fill="rgba(126, 34, 206, 0.22)" stroke="#C084FC" strokeWidth="1.2" />
          {/* 3D Internal Axis Grid Lines */}
          <line x1="26" y1="0" x2="26" y2="26" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="0.8" />
          <line x1="0" y1="27" x2="52" y2="27" stroke="rgba(233, 213, 255, 0.4)" strokeWidth="0.8" />
          {/* Glowing Vertex Spheres */}
          <circle cx="26" cy="0" r="2.2" fill="url(#nodeGlow)" />
          <circle cx="52" cy="13" r="2.2" fill="url(#nodeGlow)" />
          <circle cx="0" cy="13" r="2.2" fill="url(#nodeGlow)" />
          <circle cx="26" cy="26" r="2.8" fill="url(#nodeGlow)" />
          <circle cx="26" cy="54" r="2.2" fill="url(#nodeGlow)" />
        </g>

        {/* 3D CONTINUOUS OSCILLATING HARMONIC SINE SURFACE */}
        <g clipPath="url(#mathSurfaceClip)">
          {/* Base Volumetric Ribbon Glow */}
          <g className="live-math-sine-ambient">
            <path
              d="M -70 150 C -52.5 120, -35 180, -17.5 150 C 0 120, 17.5 180, 35 150 C 52.5 120, 70 180, 87.5 150 C 105 120, 122.5 180, 140 150 C 157.5 120, 175 180, 192.5 150 C 210 120, 227.5 180, 245 150 C 262.5 120, 280 180, 297.5 150 C 315 120, 332.5 180, 350 150"
              fill="none"
              stroke="#A855F7"
              strokeWidth="8"
              strokeOpacity="0.25"
              strokeLinecap="round"
            />
          </g>

          {/* Primary 3D Laser Beam Wave */}
          <g className="live-math-sine-primary" filter="url(#laserBeamGlow)">
            <path
              d="M -70 150 C -52.5 120, -35 180, -17.5 150 C 0 120, 17.5 180, 35 150 C 52.5 120, 70 180, 87.5 150 C 105 120, 122.5 180, 140 150 C 157.5 120, 175 180, 192.5 150 C 210 120, 227.5 180, 245 150 C 262.5 120, 280 180, 297.5 150 C 315 120, 332.5 180, 350 150"
              fill="none"
              stroke="#FAF5FF"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </g>

          {/* Secondary Fast Harmonic Wave Tracer */}
          <g className="live-math-sine-secondary">
            <path
              d="M -35 150 C -26.25 135, -17.5 165, -8.75 150 C 0 135, 8.75 165, 17.5 150 C 26.25 135, 35 165, 43.75 150 C 52.5 135, 61.25 165, 70 150 C 78.75 135, 87.5 165, 96.25 150 C 105 135, 113.75 165, 122.5 150 C 131.25 135, 140 165, 148.75 150 C 157.5 135, 166.25 165, 175 150 C 183.75 135, 192.5 165, 201.25 150 C 210 135, 218.75 165, 227.5 150"
              fill="none"
              stroke="#D8B4FE"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.8"
            />
          </g>
        </g>

        {/* 3D SCULPTED METALLIC Pi (π) SYMBOL */}
        <g className="live-math-pi-3d" filter="url(#purple3DGlow)">
          {/* 3D Extruded Shadow Layer */}
          <text x="35" y="137" fill="#3B0764" fontSize="68" fontWeight="900" fontFamily="serif" opacity="0.9">π</text>
          {/* Main Metallic Body */}
          <text x="33" y="135" fill="url(#pi3DMetal)" stroke="url(#pi3DEdge)" strokeWidth="1.5" fontSize="68" fontWeight="900" fontFamily="serif">π</text>
        </g>

        {/* 3D Isometric Tetrahedron Pyramid (Bottom-Left) */}
        <g transform="translate(14, 150)" filter="url(#purple3DGlow)">
          <polygon points="28,0 0,44 28,54" fill="rgba(192, 132, 252, 0.25)" stroke="#E9D5FF" strokeWidth="1.2" />
          <polygon points="28,0 56,44 28,54" fill="rgba(147, 51, 234, 0.16)" stroke="#C084FC" strokeWidth="1.2" />
          <line x1="0" y1="44" x2="56" y2="44" stroke="#FAF5FF" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="28" cy="0" r="2" fill="url(#nodeGlow)" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 2. PHYSICS LAB ART - 3D Sci-Fi Implementation
 * - Real 3D Chrome Spheres with Multi-Source Specular Highlights & Ambient Occlusion
 * - 3D Chrome Suspension Frame with Cylindrical Crossbar & Tensile Cables
 * - True Real-Time Momentum Conservation Newton's Cradle Pendulum Physics
 * - 3D Orbital Electron System with 3D Rotating Spheres
 */
export const PhysicsLabArt = memo(function PhysicsLabArt() {
  return (
    <div className="art-physics-detailed">
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* 3D Chrome Cylindrical Bar Gradient */}
          <linearGradient id="chromeBar3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F0F9FF" />
            <stop offset="25%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="85%" stopColor="#075985" />
            <stop offset="100%" stopColor="#0C4A6E" />
          </linearGradient>
          {/* Realistic 3D Chrome Sphere Gradient (Dual Specular Keylight + Blue Rim) */}
          <radialGradient id="chromeSphere3D" cx="28%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#E0F2FE" />
            <stop offset="42%" stopColor="#38BDF8" />
            <stop offset="70%" stopColor="#0284C7" />
            <stop offset="90%" stopColor="#03456C" />
            <stop offset="100%" stopColor="#022135" />
          </radialGradient>
          <radialGradient id="chromeSphereActive3D" cx="28%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="24%" stopColor="#7DD3FC" />
            <stop offset="50%" stopColor="#00D4FF" />
            <stop offset="78%" stopColor="#0284C7" />
            <stop offset="95%" stopColor="#082F49" />
            <stop offset="100%" stopColor="#021B2B" />
          </radialGradient>
          <filter id="physics3DGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00D4FF" floodOpacity="0.8" />
          </filter>
          <filter id="cradleImpactGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#38BDF8" floodOpacity="1" />
          </filter>
        </defs>

        {/* 3D Perspective Convergence Floor Grid */}
        <g stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8">
          <line x1="88" y1="130" x2="0" y2="235" />
          <line x1="88" y1="130" x2="40" y2="235" />
          <line x1="88" y1="130" x2="88" y2="235" />
          <line x1="88" y1="130" x2="135" y2="235" />
          <line x1="88" y1="130" x2="175" y2="235" />
          <ellipse cx="88" cy="200" rx="72" ry="18" fill="none" strokeDasharray="3 3" />
        </g>

        {/* 3D Rotating Orbital Rings */}
        <g className="live-physics-orbit" transform="translate(88, 120)">
          <ellipse cx="0" cy="0" rx="76" ry="34" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1" fill="none" />
          <ellipse cx="0" cy="0" rx="88" ry="46" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="0.8" strokeDasharray="3 3" fill="none" />
          <circle cx="72" cy="11" r="3" fill="url(#chromeSphere3D)" filter="url(#physics3DGlow)" />
          <circle cx="-68" cy="-14" r="2.5" fill="url(#chromeSphere3D)" />
        </g>

        {/* Floating Glossy 3D Blue Chrome Spheres in Space */}
        <g className="live-physics-float-sphere" transform="translate(18, 155)" filter="url(#physics3DGlow)">
          <circle cx="16" cy="16" r="16" fill="url(#chromeSphere3D)" />
          {/* Specular Glint */}
          <ellipse cx="11" cy="10" rx="5" ry="3" fill="rgba(255,255,255,0.85)" />
          <circle cx="10" cy="9" r="1.5" fill="#FFFFFF" />
        </g>
        <g className="live-physics-float-sphere-small" transform="translate(138, 28)">
          <circle cx="8.5" cy="8.5" r="8.5" fill="url(#chromeSphere3D)" />
          <ellipse cx="6" cy="5" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.8)" />
        </g>
        <circle cx="128" cy="170" r="4.5" fill="url(#chromeSphere3D)" />

        {/* 3D NEWTON'S CRADLE (True Mechanical Momentum Conservation) */}
        <g transform="translate(18, 38)" filter="url(#physics3DGlow)">
          {/* Top 3D Cylindrical Chrome Bar */}
          <rect x="6" y="0" width="128" height="7" rx="3.5" fill="url(#chromeBar3D)" />
          <rect x="10" y="1.2" width="120" height="1.8" fill="rgba(255,255,255,0.9)" />

          {/* Kinetic Collision Impact Shockwave Flashes */}
          <circle className="live-newton-impact-flash-left" cx="39" cy="68" r="8" fill="rgba(56, 189, 248, 0.95)" filter="url(#cradleImpactGlow)" opacity="0" />
          <circle className="live-newton-impact-flash-right" cx="95" cy="68" r="8" fill="rgba(56, 189, 248, 0.95)" filter="url(#cradleImpactGlow)" opacity="0" />

          {/* BALL 1 (Left Active Arm: Swings out, accelerates down, strikes Ball 2) */}
          <g className="live-newton-arm-left">
            <line x1="28" y1="6" x2="28" y2="58" stroke="#7DD3FC" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="28" cy="68" r="10.5" fill="url(#chromeSphereActive3D)" />
            {/* Specular Keylight Reflection */}
            <ellipse cx="25" cy="64" rx="3.5" ry="2.2" fill="rgba(255,255,255,0.85)" />
            <circle cx="24" cy="63" r="1" fill="#FFFFFF" />
          </g>

          {/* BALL 2 (Middle Stationary Sphere) */}
          <g>
            <line x1="47" y1="6" x2="47" y2="58" stroke="#7DD3FC" strokeWidth="1.2" />
            <circle cx="47" cy="68" r="10.5" fill="url(#chromeSphere3D)" />
            <ellipse cx="44" cy="64" rx="3.5" ry="2.2" fill="rgba(255,255,255,0.8)" />
            <circle cx="43" cy="63" r="1" fill="#FFFFFF" />
          </g>

          {/* BALL 3 (Middle Stationary Sphere) */}
          <g>
            <line x1="66" y1="6" x2="66" y2="58" stroke="#7DD3FC" strokeWidth="1.2" />
            <circle cx="66" cy="68" r="10.5" fill="url(#chromeSphere3D)" />
            <ellipse cx="63" cy="64" rx="3.5" ry="2.2" fill="rgba(255,255,255,0.8)" />
            <circle cx="62" cy="63" r="1" fill="#FFFFFF" />
          </g>

          {/* BALL 4 (Middle Stationary Sphere) */}
          <g>
            <line x1="85" y1="6" x2="85" y2="58" stroke="#7DD3FC" strokeWidth="1.2" />
            <circle cx="85" cy="68" r="10.5" fill="url(#chromeSphere3D)" />
            <ellipse cx="82" cy="64" rx="3.5" ry="2.2" fill="rgba(255,255,255,0.8)" />
            <circle cx="81" cy="63" r="1" fill="#FFFFFF" />
          </g>

          {/* BALL 5 (Right Active Arm: Launches out with momentum, returns, strikes Ball 4) */}
          <g className="live-newton-arm-right">
            <line x1="104" y1="6" x2="104" y2="58" stroke="#7DD3FC" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="104" cy="68" r="10.5" fill="url(#chromeSphereActive3D)" />
            <ellipse cx="101" cy="64" rx="3.5" ry="2.2" fill="rgba(255,255,255,0.85)" />
            <circle cx="100" cy="63" r="1" fill="#FFFFFF" />
          </g>
        </g>
      </svg>
    </div>
  );
});

/**
 * 3. CHEMISTRY LAB ART - 3D Sci-Fi Implementation
 * - Volumetric 3D Glass Erlenmeyer Flask with Refractive Edge Caustics
 * - Active Sparkling Effervescent Micro-Bubbles with Rising Vapor Mist
 * - 3D Glossy Molecular Lattice Structure with Specular Spheres & Cylindrical Bonds
 * - Secondary 3D Boiling Flask with Convection Solution
 */
export const ChemistryLabArt = memo(function ChemistryLabArt() {
  return (
    <div className="art-chem-detailed">
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexGrid3D" width="24" height="41.56" patternUnits="userSpaceOnUse">
            <path d="M12 0 L24 6.93 L24 20.78 L12 27.71 L0 20.78 L0 6.93 Z" fill="none" stroke="rgba(0, 229, 163, 0.16)" strokeWidth="0.8"/>
            <path d="M12 41.56 L24 34.63 L24 20.78 L12 27.71 L0 20.78 L0 34.63 Z" fill="none" stroke="rgba(0, 229, 163, 0.16)" strokeWidth="0.8"/>
          </pattern>
          {/* Volumetric Glowing Fluid Gradient */}
          <linearGradient id="liquidFluid3D" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.82" />
            <stop offset="35%" stopColor="#00E5A3" stopOpacity="0.95" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
          {/* 3D Glossy Atom Sphere Gradient */}
          <radialGradient id="atomSphere3D" cx="30%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#6EE7B7" />
            <stop offset="60%" stopColor="#00E5A3" />
            <stop offset="85%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022C22" />
          </radialGradient>
          <radialGradient id="bubbleSpec" cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#A7F3D0" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
          </radialGradient>
          <filter id="chem3DGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00E5A3" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Background Hexagonal Carbon Lattice Grid */}
        <rect x="0" y="0" width="175" height="235" fill="url(#hexGrid3D)" />

        {/* 3D FLOATING MOLECULAR STRUCTURE (Top-Right) */}
        <g className="live-chem-molecule" transform="translate(96, 20)" filter="url(#chem3DGlow)">
          {/* 3D Cylindrical Chemical Bonds */}
          <line x1="28" y1="12" x2="52" y2="28" stroke="#34D399" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="28" y1="12" x2="8" y2="34" stroke="#34D399" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="52" y1="28" x2="44" y2="54" stroke="#34D399" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="8" y1="34" x2="22" y2="58" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" />

          {/* 3D Glossy Atom Spheres */}
          <circle cx="28" cy="12" r="10.5" fill="url(#atomSphere3D)" />
          <ellipse cx="25" cy="9" rx="3.5" ry="2" fill="rgba(255,255,255,0.85)" />

          <circle cx="52" cy="28" r="9.5" fill="url(#atomSphere3D)" />
          <ellipse cx="49" cy="25" rx="3" ry="1.8" fill="rgba(255,255,255,0.85)" />

          <circle cx="8" cy="34" r="8.5" fill="url(#atomSphere3D)" />
          <ellipse cx="6" cy="32" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.85)" />

          <circle cx="44" cy="54" r="8" fill="url(#atomSphere3D)" />
          <circle cx="22" cy="58" r="6.5" fill="url(#atomSphere3D)" />
        </g>

        {/* 3D VOLUMETRIC ERLENMEYER FLASK (Center-Left) with Active Fizz Stream */}
        <g transform="translate(14, 84)" filter="url(#chem3DGlow)">
          {/* Internal Fluid Body */}
          <path
            d="M 28 54 L 46 54 L 66 98 C 68 102, 65 106, 60 106 L 14 106 C 9 106, 6 102, 8 98 Z"
            fill="url(#liquidFluid3D)"
          />

          {/* 3D Meniscus Liquid Surface with Wave Sway */}
          <ellipse className="live-chem-meniscus" cx="37" cy="54" rx="9.5" ry="2.8" fill="#6EE7B7" />

          {/* LIVE 3D SPARKLING EFFERVESCENT BUBBLES */}
          <g className="live-chem-fizz-layer">
            <circle className="chem-fizz-b1" cx="24" cy="100" r="2.8" fill="url(#bubbleSpec)" />
            <circle className="chem-fizz-b2" cx="33" cy="104" r="3.6" fill="url(#bubbleSpec)" />
            <circle className="chem-fizz-b3" cx="42" cy="98"  r="3.0" fill="url(#bubbleSpec)" />
            <circle className="chem-fizz-b4" cx="50" cy="102" r="2.2" fill="url(#bubbleSpec)" />
            <circle className="chem-fizz-b5" cx="28" cy="95"  r="3.2" fill="url(#bubbleSpec)" />
            <circle className="chem-fizz-b6" cx="38" cy="92"  r="2.5" fill="url(#bubbleSpec)" />
            <circle className="chem-fizz-b7" cx="46" cy="88"  r="2.0" fill="url(#bubbleSpec)" />
          </g>

          {/* Rising Vapor Fizz Mist Puffs */}
          <g className="live-chem-vapor-stream">
            <circle className="chem-vapor-p1" cx="37" cy="14" r="3.8" fill="rgba(110, 231, 183, 0.75)" />
            <circle className="chem-vapor-p2" cx="35" cy="6"  r="4.5" fill="rgba(52, 211, 153, 0.55)" />
            <circle className="chem-vapor-p3" cx="39" cy="-2" r="5.2" fill="rgba(167, 243, 208, 0.35)" />
          </g>

          {/* 3D Glass Outer Shell & Beveled Rim */}
          <path
            d="M 31 16 L 31 38 L 8 98 C 5 104, 9 110, 16 110 L 58 110 C 65 110, 69 104, 66 98 L 43 38 L 43 16 M 28 16 L 46 16"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3D Glass Specular Reflection Highlight */}
          <path d="M 15 96 L 33 46" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 32 44 L 32 20" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* 3D Boiling Round Flask (Center-Right) */}
        <g transform="translate(88, 118)" filter="url(#chem3DGlow)">
          <path d="M 18 36 A 24 24 0 0 0 54 36 Z" fill="url(#liquidFluid3D)" />
          <ellipse cx="36" cy="36" rx="18" ry="4.2" fill="#6EE7B7" />
          <circle className="chem-fizz-b2" cx="30" cy="50" r="2.5" fill="url(#bubbleSpec)" />
          <circle className="chem-fizz-b5" cx="42" cy="46" r="2.0" fill="url(#bubbleSpec)" />

          <path
            d="M 32 6 L 32 18 C 22 22, 12 32, 12 42 C 12 55, 23 66, 36 66 C 49 66, 60 55, 60 42 C 60 32, 50 22, 40 18 L 40 6 M 29 6 L 43 6"
            fill="none"
            stroke="#A7F3D0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 18 44 A 18 18 0 0 0 30 58" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 4. BIOLOGY LAB ART - Live Particle Animation DNA Sequence!
 * - Interactive 3D Canvas-Powered Bioluminescent Particle Double Helix
 * - Two intertwining helical particle ribbons with depth-projected 3D rotation
 * - Particle nucleobase rungs (A-T, G-C) glowing in amber, emerald, cyan, and rose
 * - Ambient floating bioluminescent spore sparks drifting in the background
 * - 3D Translucent Cell Organelle & Botanical Leaves
 */
export const BiologyLabArt = memo(function BiologyLabArt() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let t = 0;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
    const width = 175;
    const height = 235;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    // Color palette for nucleobase particle pairs
    const rungColors = [
      { c1: '#F59E0B', c2: '#38BDF8' }, // Adenine - Thymine
      { c1: '#10B981', c2: '#F43F5E' }, // Guanine - Cytosine
      { c1: '#FBBF24', c2: '#60A5FA' },
      { c1: '#34D399', c2: '#FB7185' }
    ];

    // Ambient floating spores
    const spores = Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.8 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.4,
      alpha: 0.2 + Math.random() * 0.6
    }));

    function render() {
      t += 0.038;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Ambient Floating Bioluminescent Spores
      for (let s of spores) {
        s.y += s.vy;
        s.x += s.vx;
        if (s.y < 0) s.y = height;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;

        ctx.fillStyle = `rgba(245, 158, 11, ${s.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. 3D Diagonal Particle DNA Helix Geometry
      // Center and tilt of the diagonal strand
      const originX = 88;
      const originY = 118;
      const tiltAngle = -0.62; // ~-35 degrees diagonal slope
      const cosA = Math.cos(tiltAngle);
      const sinA = Math.sin(tiltAngle);

      const radius = 24;
      const step = 6.2;
      const totalSteps = 36;
      const startDist = -(totalSteps * step) / 2;

      // Collect all 3D particle nodes to sort by depth (z)
      const particleRenderList = [];

      for (let i = 0; i < totalSteps; i++) {
        const u = startDist + i * step;
        const theta = (i * 0.38) + t;

        // 3D coordinates along helix axis
        const x1 = radius * Math.cos(theta);
        const z1 = radius * Math.sin(theta);

        const x2 = radius * Math.cos(theta + Math.PI);
        const z2 = radius * Math.sin(theta + Math.PI);

        // Project onto diagonal 2D screen coordinates
        // Strand A
        const screenX1 = originX + u * cosA - x1 * sinA;
        const screenY1 = originY + u * sinA + x1 * cosA;
        const depth1 = z1;

        // Strand B
        const screenX2 = originX + u * cosA - x2 * sinA;
        const screenY2 = originY + u * sinA + x2 * cosA;
        const depth2 = z2;

        // Connecting Base-Pair Rungs (Every other step)
        if (i % 2 === 0) {
          const colorPair = rungColors[(i / 2) % rungColors.length];
          const midDepth = (depth1 + depth2) / 2;

          particleRenderList.push({
            type: 'rung',
            x1: screenX1, y1: screenY1,
            x2: screenX2, y2: screenY2,
            z: midDepth,
            c1: colorPair.c1,
            c2: colorPair.c2
          });

          // Rung intermediate node particles
          const midX = (screenX1 + screenX2) / 2;
          const midY = (screenY1 + screenY2) / 2;
          particleRenderList.push({
            type: 'particle',
            x: midX, y: midY,
            z: midDepth + 2,
            radius: 1.8,
            color: '#FFFFFF',
            isCore: true
          });
        }

        // Particle on Strand A
        particleRenderList.push({
          type: 'particle',
          x: screenX1, y: screenY1,
          z: depth1,
          radius: 2.8 + (depth1 / radius) * 1.2,
          color: '#F59E0B',
          glowColor: 'rgba(245, 158, 11, 0.8)'
        });

        // Particle on Strand B
        particleRenderList.push({
          type: 'particle',
          x: screenX2, y: screenY2,
          z: depth2,
          radius: 2.8 + (depth2 / radius) * 1.2,
          color: '#10B981',
          glowColor: 'rgba(16, 185, 129, 0.8)'
        });
      }

      // Sort by Z (Depth sorting: back to front)
      particleRenderList.sort((a, b) => a.z - b.z);

      // Render sorted 3D particles & bonds
      for (let item of particleRenderList) {
        const depthFactor = (item.z + radius) / (radius * 2); // 0 (far) to 1 (near)
        const alpha = Math.max(0.25, Math.min(1.0, 0.35 + depthFactor * 0.65));

        if (item.type === 'rung') {
          // Draw connecting base-pair hydrogen bond
          ctx.beginPath();
          ctx.moveTo(item.x1, item.y1);
          ctx.lineTo(item.x2, item.y2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Endpoint color dots
          ctx.fillStyle = item.c1;
          ctx.beginPath();
          ctx.arc(item.x1, item.y1, 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = item.c2;
          ctx.beginPath();
          ctx.arc(item.x2, item.y2, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'particle') {
          const r = Math.max(0.8, item.radius);

          // Outer Glow
          if (depthFactor > 0.4 && item.glowColor) {
            ctx.fillStyle = item.glowColor;
            ctx.beginPath();
            ctx.arc(item.x, item.y, r * 2.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Core Particle
          ctx.fillStyle = item.isCore ? `rgba(255, 255, 255, ${alpha})` : item.color;
          ctx.beginPath();
          ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Specular Glint on front particles
          if (depthFactor > 0.6) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(item.x - r * 0.3, item.y - r * 0.3, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="art-bio-detailed" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Particle Canvas for Live DNA Sequence */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* SVG Layer for Botanical Leaves and 3D Cell Vesicle */}
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 1 }}>
        <defs>
          <pattern id="bioDotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.9" fill="rgba(245, 158, 11, 0.22)" />
          </pattern>
          <linearGradient id="leafGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="35%" stopColor="#34D399" />
            <stop offset="70%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
          <radialGradient id="cellGrad3D" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="rgba(254, 243, 199, 0.75)" />
            <stop offset="35%" stopColor="rgba(245, 158, 11, 0.45)" />
            <stop offset="70%" stopColor="rgba(16, 185, 129, 0.55)" />
            <stop offset="100%" stopColor="rgba(5, 150, 105, 0.85)" />
          </radialGradient>
          <filter id="bioGlow3D" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Background Organic Dot Matrix */}
        <rect x="0" y="0" width="175" height="235" fill="url(#bioDotGrid)" />

        {/* 3D Glossy Botanical Leaves (Top-Left & Mid-Right) */}
        <g className="live-bio-leaf-left" transform="translate(18, 32) rotate(-22)" filter="url(#bioGlow3D)">
          <path d="M 0 0 C 14 3, 24 16, 26 28 C 14 28, 4 20, 0 0 Z" fill="url(#leafGrad3D)" />
          <path d="M 0 0 C 10 12, 18 20, 26 28" stroke="#ECFDF5" strokeWidth="0.8" />
        </g>

        <g className="live-bio-leaf-right" transform="translate(118, 92) rotate(32)" filter="url(#bioGlow3D)">
          <path d="M 0 0 C 16 4, 28 18, 30 32 C 16 32, 4 22, 0 0 Z" fill="url(#leafGrad3D)" />
          <path d="M 0 0 C 12 14, 22 22, 30 32" stroke="#ECFDF5" strokeWidth="0.8" />
        </g>

        {/* 3D VOLUMETRIC CELL VESICLE SPHERE (Bottom-Right) */}
        <g className="live-bio-cell" transform="translate(106, 148)" filter="url(#bioGlow3D)">
          <circle cx="28" cy="28" r="26" fill="url(#cellGrad3D)" stroke="#F59E0B" strokeWidth="1.8" />
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
