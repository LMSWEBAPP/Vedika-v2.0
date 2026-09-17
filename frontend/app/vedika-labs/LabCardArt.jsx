'use client';

import React, { memo, useRef, useEffect } from 'react';

/**
 * SHARED CYBERNETIC ILLUMINATED PEDESTAL
 * Option 9 Cyber-Pedestal with multi-tiered metallic discs, glowing neon rim,
 * inner light emitter well, and upward volumetric projector light cone.
 */
function HoloPedestal({ accentColor, accentRgb, filterId = 'pedestalGlow' }) {
  return (
    <g className="holo-pedestal-group" transform="translate(87.5, 178)">
      {/* Upward Volumetric Holographic Projection Cone */}
      <polygon
        points="-42,-6 42,-6 58,-120 -58,-120"
        fill={`url(#holoConeGrad-${accentRgb.replace(/[\s,]+/g, '_')})`}
        opacity="0.32"
        style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}
      />

      {/* Upward Central Vertical Laser Beam */}
      <line
        x1="0"
        y1="-6"
        x2="0"
        y2="-130"
        stroke={`rgba(${accentRgb}, 0.65)`}
        strokeWidth="1.5"
        strokeDasharray="4 4"
        style={{ pointerEvents: 'none' }}
      />

      {/* Base Lower Metallic Tier */}
      <ellipse
        cx="0"
        cy="10"
        rx="52"
        ry="14"
        fill="#0B0F19"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1"
      />
      <path
        d="M -52 10 C -52 18, 52 18, 52 10 L 52 18 C 52 26, -52 26, -52 18 Z"
        fill="url(#pedestalMetalDark)"
      />

      {/* Mid Platform Cylinder */}
      <path
        d="M -46 2 C -46 11, 46 11, 46 2 L 46 10 C 46 19, -46 19, -46 10 Z"
        fill="url(#pedestalMetalLight)"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="0.8"
      />

      {/* Outer Glowing Neon Rim Ring */}
      <ellipse
        cx="0"
        cy="2"
        rx="46"
        ry="12"
        fill="#0F172A"
        stroke={accentColor}
        strokeWidth="2.2"
        filter={`url(#${filterId})`}
      />

      {/* Secondary Inner Bevel Ring */}
      <ellipse
        cx="0"
        cy="1"
        rx="36"
        ry="9.5"
        fill="#090D16"
        stroke={`rgba(${accentRgb}, 0.5)`}
        strokeWidth="1.2"
      />

      {/* Emitter Core Disc (Intense Luminous Well) */}
      <ellipse
        cx="0"
        cy="0"
        rx="26"
        ry="7"
        fill={`url(#emitterCoreGrad-${accentRgb.replace(/[\s,]+/g, '_')})`}
      />

      {/* Concentric Projection Emitter Rings */}
      <ellipse
        cx="0"
        cy="0"
        rx="16"
        ry="4.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        opacity="0.85"
      />
      <circle cx="0" cy="0" r="2.2" fill="#FFFFFF" filter={`url(#${filterId})`} />

      {/* Floating Emitter Sparks */}
      <circle cx="-14" cy="-18" r="1" fill="#FFFFFF" opacity="0.75" className="spark-drift-1" />
      <circle cx="12" cy="-26" r="1.2" fill={accentColor} opacity="0.8" className="spark-drift-2" />
      <circle cx="-6" cy="-38" r="0.9" fill="#FFFFFF" opacity="0.6" className="spark-drift-3" />
      <circle cx="18" cy="-48" r="1.1" fill={accentColor} opacity="0.7" className="spark-drift-1" />
    </g>
  );
}

/**
 * 1. MATH LAB ART - OPTION 9 HOLOGRAPHIC 3D OCTAHEDRON
 * - Grand hovering crystalline 3D Octahedron with refractive volumetric facets
 * - Continuous 3D axial rotation & levitation above the illuminated purple pedestal
 * - Crystalline vertex flares and floating secondary mini-polyhedra
 */
export const MathLabArt = memo(function MathLabArt() {
  const accentRgb = '168, 85, 247';
  const gradKey = '168_85_247';

  return (
    <div className="art-math-detailed" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mathHoloGrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="0.6" fill="rgba(168, 85, 247, 0.22)" />
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(168, 85, 247, 0.08)" strokeWidth="0.5"/>
          </pattern>

          {/* Pedestal Metallic Gradients */}
          <linearGradient id="pedestalMetalDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="pedestalMetalLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Pedestal Emitter Gradients */}
          <radialGradient id={`emitterCoreGrad-${gradKey}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#E9D5FF" />
            <stop offset="70%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#581C87" />
          </radialGradient>
          <linearGradient id={`holoConeGrad-${gradKey}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0.5)" />
            <stop offset="50%" stopColor="rgba(168, 85, 247, 0.18)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
          </linearGradient>

          {/* Octahedron Crystalline Facet Gradients */}
          {/* Top-Front-Left Facet */}
          <linearGradient id="octaFacetTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#E9D5FF" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#A855F7" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#6B21A8" stopOpacity="0.75" />
          </linearGradient>
          {/* Top-Front-Right Facet */}
          <linearGradient id="octaFacetTR" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAF5FF" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#D8B4FE" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#9333EA" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.7" />
          </linearGradient>
          {/* Bottom-Front-Left Facet */}
          <linearGradient id="octaFacetBL" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#581C87" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#7E22CE" stopOpacity="0.7" />
            <stop offset="85%" stopColor="#C084FC" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.75" />
          </linearGradient>
          {/* Bottom-Front-Right Facet */}
          <linearGradient id="octaFacetBR" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3B0764" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#6B21A8" stopOpacity="0.7" />
            <stop offset="80%" stopColor="#A855F7" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0.8" />
          </linearGradient>

          {/* Glowing Filters */}
          <filter id="purplePedestalGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#A855F7" floodOpacity="0.9" />
          </filter>
          <filter id="crystalGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#C084FC" floodOpacity="0.75" />
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FFFFFF" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Ambient Subtle Cyber Grid */}
        <rect x="0" y="0" width="175" height="235" fill="url(#mathHoloGrid)" />

        {/* Cybernetic Pedestal Base */}
        <HoloPedestal accentColor="#A855F7" accentRgb={accentRgb} filterId="purplePedestalGlow" />

        {/* GRAND 3D HOLOGRAPHIC OCTAHEDRON (Option 9 Focal Subject) */}
        <g className="live-holo-crystal" filter="url(#crystalGlow)">
          {/* Internal Back Facets (Translucent 3D Depth) */}
          <polygon points="87.5,42 42,98 87.5,88" fill="rgba(88, 28, 135, 0.45)" stroke="rgba(233, 213, 255, 0.3)" strokeWidth="0.8" />
          <polygon points="87.5,42 133,98 87.5,88" fill="rgba(126, 34, 206, 0.4)" stroke="rgba(233, 213, 255, 0.3)" strokeWidth="0.8" />
          <polygon points="87.5,152 42,98 87.5,88" fill="rgba(59, 7, 100, 0.5)" stroke="rgba(233, 213, 255, 0.25)" strokeWidth="0.8" />
          <polygon points="87.5,152 133,98 87.5,88" fill="rgba(88, 28, 135, 0.45)" stroke="rgba(233, 213, 255, 0.25)" strokeWidth="0.8" />

          {/* Internal Glowing Energy Core */}
          <circle cx="87.5" cy="98" r="14" fill="radial-gradient(circle, #FFFFFF 0%, #C084FC 45%, #7E22CE 80%, transparent 100%)" opacity="0.85" />

          {/* Primary Front 3D Facets */}
          {/* Top-Left Facet */}
          <polygon
            points="87.5,42 42,98 87.5,108"
            fill="url(#octaFacetTL)"
            stroke="#FAF5FF"
            strokeWidth="1.2"
          />
          {/* Top-Right Facet */}
          <polygon
            points="87.5,42 133,98 87.5,108"
            fill="url(#octaFacetTR)"
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />
          {/* Bottom-Left Facet */}
          <polygon
            points="87.5,152 42,98 87.5,108"
            fill="url(#octaFacetBL)"
            stroke="#E9D5FF"
            strokeWidth="1.2"
          />
          {/* Bottom-Right Facet */}
          <polygon
            points="87.5,152 133,98 87.5,108"
            fill="url(#octaFacetBR)"
            stroke="#D8B4FE"
            strokeWidth="1.2"
          />

          {/* Equatorial Bevel Center Rib */}
          <line x1="42" y1="98" x2="87.5" y2="108" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.9" />
          <line x1="87.5" y1="108" x2="133" y2="98" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.9" />
          <line x1="87.5" y1="42" x2="87.5" y2="152" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1" />

          {/* Apex Specular Glints & Star Flares */}
          <circle cx="87.5" cy="42" r="2.8" fill="#FFFFFF" />
          <circle cx="87.5" cy="152" r="2.4" fill="#FFFFFF" />
          <circle cx="42" cy="98" r="2.2" fill="#E9D5FF" />
          <circle cx="133" cy="98" r="2.2" fill="#E9D5FF" />
          <circle cx="87.5" cy="108" r="3.2" fill="#FFFFFF" filter="url(#purplePedestalGlow)" />
        </g>

        {/* Orbiting Satellite Micro-Polyhedra (Option 9 Style) */}
        <g className="live-satellite-poly-1" transform="translate(24, 62)">
          <polygon points="10,0 20,6 10,12 0,6" fill="rgba(233, 213, 255, 0.45)" stroke="#FFFFFF" strokeWidth="0.8" />
          <polygon points="0,6 10,12 10,22 0,16" fill="rgba(168, 85, 247, 0.55)" stroke="#C084FC" strokeWidth="0.8" />
          <polygon points="10,12 20,6 20,16 10,22" fill="rgba(126, 34, 206, 0.4)" stroke="#A855F7" strokeWidth="0.8" />
        </g>

        <g className="live-satellite-poly-2" transform="translate(136, 126)">
          <polygon points="8,0 16,5 8,10 0,5" fill="rgba(233, 213, 255, 0.5)" stroke="#FFFFFF" strokeWidth="0.7" />
          <polygon points="0,5 8,10 8,18 0,13" fill="rgba(168, 85, 247, 0.6)" stroke="#C084FC" strokeWidth="0.7" />
          <polygon points="8,10 16,5 16,13 8,18" fill="rgba(126, 34, 206, 0.45)" stroke="#A855F7" strokeWidth="0.7" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 2. PHYSICS LAB ART - OPTION 9 CELESTIAL CORE & ORBITING SPHERES
 * - Luminous 3D core sphere with multi-angled orbital rings
 * - Multiple 3D satellite spheres revolving with front/back depth
 * - Illuminated cybernetic cyan pedestal with upward light projection
 */
export const PhysicsLabArt = memo(function PhysicsLabArt() {
  const accentRgb = '0, 212, 255';
  const gradKey = '0_212_255';

  return (
    <div className="art-physics-detailed" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="physicsGrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="0.6" fill="rgba(0, 212, 255, 0.22)" />
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(0, 212, 255, 0.08)" strokeWidth="0.5"/>
          </pattern>

          {/* Pedestal Emitter Gradients */}
          <radialGradient id={`emitterCoreGrad-${gradKey}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#BAE6FD" />
            <stop offset="70%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#0369A1" />
          </radialGradient>
          <linearGradient id={`holoConeGrad-${gradKey}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0.5)" />
            <stop offset="50%" stopColor="rgba(0, 212, 255, 0.18)" />
            <stop offset="100%" stopColor="rgba(0, 212, 255, 0)" />
          </linearGradient>

          {/* 3D Planetary Core Radial Gradient */}
          <radialGradient id="physSphereGrad" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#E0F2FE" />
            <stop offset="45%" stopColor="#38BDF8" />
            <stop offset="75%" stopColor="#0284C7" />
            <stop offset="95%" stopColor="#075985" />
            <stop offset="100%" stopColor="#082F49" />
          </radialGradient>

          {/* 3D Satellite Sphere Gradient */}
          <radialGradient id="satelliteGrad" cx="32%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#BAE6FD" />
            <stop offset="70%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#0369A1" />
          </radialGradient>

          <filter id="cyanPedestalGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00D4FF" floodOpacity="0.9" />
          </filter>
          <filter id="physCoreGlow" x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#00D4FF" floodOpacity="0.8" />
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FFFFFF" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Cyber Grid */}
        <rect x="0" y="0" width="175" height="235" fill="url(#physicsGrid)" />

        {/* Cybernetic Pedestal Base */}
        <HoloPedestal accentColor="#00D4FF" accentRgb={accentRgb} filterId="cyanPedestalGlow" />

        {/* Back-Arc of Orbit Rings (renders behind the central sphere for true 3D) */}
        <g className="live-orbit-group" transform="translate(87.5, 96)">
          {/* Ring 1 (Tilted -28 deg) Back Arc */}
          <ellipse
            cx="0"
            cy="0"
            rx="56"
            ry="19"
            transform="rotate(-28)"
            fill="none"
            stroke="rgba(0, 212, 255, 0.45)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          {/* Ring 2 (Tilted +38 deg) Back Arc */}
          <ellipse
            cx="0"
            cy="0"
            rx="52"
            ry="18"
            transform="rotate(38)"
            fill="none"
            stroke="rgba(0, 212, 255, 0.35)"
            strokeWidth="1.2"
            strokeDasharray="5 4"
          />
          {/* Ring 3 (Steep Tilted +75 deg) */}
          <ellipse
            cx="0"
            cy="0"
            rx="46"
            ry="15"
            transform="rotate(75)"
            fill="none"
            stroke="rgba(0, 212, 255, 0.3)"
            strokeWidth="1"
          />

          {/* Rear Orbiting Satellite (Distant, Smaller, Behind Core) */}
          <g className="live-satellite-rear">
            <circle cx="-38" cy="-14" r="3.2" fill="url(#satelliteGrad)" opacity="0.75" />
          </g>
        </g>

        {/* CENTRAL 3D GLOWING PLANETARY CORE / ATOM (Option 9 Hero) */}
        <g className="live-phys-core" transform="translate(87.5, 96)" filter="url(#physCoreGlow)">
          {/* Atmospheric Glow Ring */}
          <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(0, 212, 255, 0.4)" strokeWidth="3" />
          {/* Solid 3D Volumetric Core Sphere */}
          <circle cx="0" cy="0" r="26" fill="url(#physSphereGrad)" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          {/* Hot Specular Core Highlight */}
          <ellipse cx="-8" cy="-8" rx="7" ry="5" fill="#FFFFFF" opacity="0.65" transform="rotate(-20 -8 -8)" />
          <circle cx="-10" cy="-10" r="2.2" fill="#FFFFFF" opacity="0.95" />
        </g>

        {/* Front-Arc of Orbit Rings & Foreground Orbiting Satellites */}
        <g className="live-orbit-foreground" transform="translate(87.5, 96)">
          {/* Ring 1 Front Segment Highlight */}
          <path
            d="M -48 10 C -20 28, 20 24, 48 -8"
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="1.8"
            strokeLinecap="round"
            filter="url(#cyanPedestalGlow)"
          />

          {/* Primary Foreground Satellite (Large, Glossy, In Front of Core) */}
          <g className="live-satellite-front-1">
            <circle cx="42" cy="-16" r="6.5" fill="url(#satelliteGrad)" filter="url(#cyanPedestalGlow)" />
            <circle cx="40" cy="-18" r="1.8" fill="#FFFFFF" />
          </g>

          {/* Secondary Foreground Satellite (Mid-Left) */}
          <g className="live-satellite-front-2">
            <circle cx="-36" cy="18" r="5" fill="url(#satelliteGrad)" filter="url(#cyanPedestalGlow)" />
            <circle cx="-37.5" cy="16.5" r="1.3" fill="#FFFFFF" />
          </g>

          {/* Third Micro Satellite (Bottom-Right) */}
          <g className="live-satellite-front-3">
            <circle cx="22" cy="34" r="3.6" fill="url(#satelliteGrad)" />
            <circle cx="21" cy="33" r="0.9" fill="#FFFFFF" />
          </g>
        </g>
      </svg>
    </div>
  );
});

/**
 * 3. CHEMISTRY LAB ART - OPTION 9 VOLUMETRIC GLOWING FLASK
 * - Grand 3D glass Erlenmeyer flask hovering over emerald pedestal
 * - Volumetric glowing emerald/teal liquid with curved meniscus
 * - Active effervescent bubbles rising and fizzing to the surface
 * - Floating molecular satellite nodes
 */
export const ChemistryLabArt = memo(function ChemistryLabArt() {
  const accentRgb = '16, 185, 129';
  const gradKey = '16_185_129';

  return (
    <div className="art-chem-detailed" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="chemGrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="0.6" fill="rgba(16, 185, 129, 0.22)" />
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="0.5"/>
          </pattern>

          {/* Pedestal Emitter Gradients */}
          <radialGradient id={`emitterCoreGrad-${gradKey}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#A7F3D0" />
            <stop offset="70%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#065F46" />
          </radialGradient>
          <linearGradient id={`holoConeGrad-${gradKey}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.5)" />
            <stop offset="50%" stopColor="rgba(16, 185, 129, 0.18)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </linearGradient>

          {/* Volumetric Glowing Emerald Liquid Gradient */}
          <linearGradient id="chemLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="75%" stopColor="#059669" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
          </linearGradient>

          {/* Glass Outer Wall Specular Shading */}
          <linearGradient id="glassWallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="15%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="85%" stopColor="rgba(16, 185, 129, 0.15)" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
          </linearGradient>

          {/* Molecular Node Glossy Spheres */}
          <radialGradient id="molSphereGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#6EE7B7" />
            <stop offset="75%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>

          <filter id="emeraldPedestalGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10B981" floodOpacity="0.9" />
          </filter>
          <filter id="flaskGlow" x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#10B981" floodOpacity="0.75" />
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FFFFFF" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Cyber Grid */}
        <rect x="0" y="0" width="175" height="235" fill="url(#chemGrid)" />

        {/* Cybernetic Pedestal Base */}
        <HoloPedestal accentColor="#10B981" accentRgb={accentRgb} filterId="emeraldPedestalGlow" />

        {/* GRAND 3D VOLUMETRIC GLASS FLASK (Option 9 Hero) */}
        <g className="live-holo-flask" filter="url(#flaskGlow)">
          {/* Outer Glass Flask Contour */}
          {/* Flask Lip & Neck */}
          <ellipse cx="87.5" cy="46" rx="14" ry="4" fill="rgba(255, 255, 255, 0.2)" stroke="#FFFFFF" strokeWidth="1.2" />
          <path d="M 77 47 L 77 76" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />
          <path d="M 98 47 L 98 76" stroke="#FFFFFF" strokeWidth="1.2" strokeOpacity="0.8" />

          {/* Glass Body Silhouette */}
          <path
            d="M 77 76 L 46 142 C 43 148, 47 154, 55 154 L 120 154 C 128 154, 132 148, 129 142 L 98 76 Z"
            fill="url(#glassWallGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.4"
          />

          {/* Volumetric Liquid Inside Flask */}
          <path
            d="M 68 100 L 48 143 C 46 148, 49 152, 56 152 L 119 152 C 126 152, 129 148, 127 143 L 107 100 Z"
            fill="url(#chemLiquidGrad)"
          />

          {/* Curved Liquid Meniscus */}
          <ellipse cx="87.5" cy="100" rx="19.5" ry="5" fill="#A7F3D0" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.95" />

          {/* Glass Thickness Bottom Contour */}
          <ellipse cx="87.5" cy="151" rx="36" ry="4.5" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.2" />

          {/* Left Glass Specular Light Reflection Streak */}
          <path
            d="M 52 140 L 73 88"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />

          {/* Active Effervescent Rising Bubbles */}
          <g className="live-flask-bubbles">
            <circle cx="82" cy="138" r="3.2" fill="#FFFFFF" opacity="0.9" className="bubble-float-1" />
            <circle cx="94" cy="130" r="2.4" fill="#E0F2FE" opacity="0.85" className="bubble-float-2" />
            <circle cx="76" cy="120" r="2.8" fill="#FFFFFF" opacity="0.9" className="bubble-float-3" />
            <circle cx="98" cy="115" r="2.2" fill="#BAE6FD" opacity="0.8" className="bubble-float-1" />
            <circle cx="86" cy="106" r="3.5" fill="#FFFFFF" opacity="0.95" className="bubble-float-2" />
            {/* Tiny Popping Micro-Bubbles Near Meniscus */}
            <circle cx="78" cy="98" r="1.4" fill="#FFFFFF" />
            <circle cx="92" cy="97" r="1.2" fill="#FFFFFF" />
            <circle cx="87.5" cy="95" r="1.6" fill="#FFFFFF" />
          </g>

          {/* Luminous Rising Vapor / Mist Above Neck */}
          <g className="live-flask-vapor" opacity="0.7">
            <path
              d="M 85 44 C 82 32, 93 26, 87 18"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeDasharray="3 3"
            />
            <path
              d="M 90 44 C 94 34, 86 28, 91 16"
              fill="none"
              stroke="#6EE7B7"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Floating Molecular Satellite Cluster (Option 9 Style) */}
        <g className="live-chem-molecules" transform="translate(126, 68)">
          <line x1="0" y1="0" x2="16" y2="12" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.6" />
          <line x1="0" y1="0" x2="-8" y2="14" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.4" />
          <circle cx="0" cy="0" r="5.5" fill="url(#molSphereGrad)" filter="url(#emeraldPedestalGlow)" />
          <circle cx="16" cy="12" r="4.2" fill="url(#molSphereGrad)" />
          <circle cx="-8" cy="14" r="3.4" fill="url(#molSphereGrad)" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 4. BIOLOGY LAB ART - ICONIC 3D DNA DOUBLE HELIX
 * - Authentic, slender double helix with 2 continuous twisting golden ribbons
 * - Segment-by-segment 3D depth sorting (Z-buffer) with true front/back occlusion
 * - Distinct base-pair horizontal ladder rungs with dual nucleobase colors & central H-bond
 * - Glowing nucleotide bead nodes and shimmering ambient bioluminescent genetic dust
 * - Perfectly centered and standing majestically above the cybernetic illuminated pedestal
 */
export const BiologyLabArt = memo(function BiologyLabArt() {
  const canvasRef = useRef(null);
  const accentRgb = '245, 158, 11';
  const gradKey = '245_158_11';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let angle = 0;

    const width = 175;
    const height = 235;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Floating Ambient Bioluminescent Genetic Spores
    const spores = Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: 20 + Math.random() * 150,
      r: 0.7 + Math.random() * 1.3,
      vy: 0.25 + Math.random() * 0.45,
      alpha: 0.3 + Math.random() * 0.65,
      color: Math.random() > 0.4 ? '#FDE047' : '#34D399'
    }));

    // Double Helix Geometry Constants
    const centerX = 87.5; // Directly aligned with the center of the pedestal
    const topY = 22;      // Elegant tall reach
    const bottomY = 168;  // Lands just above the pedestal emitter
    const helixHeight = bottomY - topY; // 146px tall
    const helixRadius = 22; // Slender, perfectly proportioned
    const totalTurns = 1.35; // Distinct, graceful sinusoidal figure-8 loops
    const numRungs = 16;     // Cleanly spaced nucleotide ladder rungs
    const numSteps = 70;     // Discretized ribbon segments for continuous smooth curves

    const baseColors = [
      { left: '#F59E0B', right: '#00D4FF', name: 'A-T' }, // Amber - Cyan
      { left: '#10B981', right: '#EC4899', name: 'G-C' }, // Emerald - Rose
      { left: '#00D4FF', right: '#F59E0B', name: 'T-A' },
      { left: '#EC4899', right: '#10B981', name: 'C-G' }
    ];

    function render() {
      ctx.clearRect(0, 0, width, height);

      // 1. Render Floating Ambient Bioluminescent Spores
      for (let s of spores) {
        s.y -= s.vy;
        if (s.y < topY - 10) {
          s.y = bottomY - 5;
          s.x = centerX - helixRadius * 1.6 + Math.random() * (helixRadius * 3.2);
        }
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * 0.75;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      angle += 0.016; // Smooth, majestic 3D rotation speed

      // 2. Build 3D Render Queue with Depth Ordering
      const drawQueue = [];

      // A. Compute Ribbon Segments for Strand 1 and Strand 2
      for (let i = 0; i < numSteps; i++) {
        const tA = i / numSteps;
        const tB = (i + 1) / numSteps;

        const yA = topY + tA * helixHeight;
        const yB = topY + tB * helixHeight;

        const thetaA = angle + tA * Math.PI * 2 * totalTurns;
        const thetaB = angle + tB * Math.PI * 2 * totalTurns;

        // Strand 1 (Golden Backbone)
        const x1A = centerX + Math.cos(thetaA) * helixRadius;
        const z1A = Math.sin(thetaA) * helixRadius;
        const x1B = centerX + Math.cos(thetaB) * helixRadius;
        const z1B = Math.sin(thetaB) * helixRadius;
        const midZ1 = (z1A + z1B) / 2;

        drawQueue.push({
          type: 'ribbonSegment',
          strand: 1,
          x1: x1A, y1: yA,
          x2: x1B, y2: yB,
          z: midZ1
        });

        // Strand 2 (Offset by 180 degrees)
        const x2A = centerX - Math.cos(thetaA) * helixRadius;
        const z2A = -Math.sin(thetaA) * helixRadius;
        const x2B = centerX - Math.cos(thetaB) * helixRadius;
        const z2B = -Math.sin(thetaB) * helixRadius;
        const midZ2 = (z2A + z2B) / 2;

        drawQueue.push({
          type: 'ribbonSegment',
          strand: 2,
          x1: x2A, y1: yA,
          x2: x2B, y2: yB,
          z: midZ2
        });
      }

      // B. Compute Horizontal Base-Pair Rungs & Nucleotide Junction Beads
      for (let j = 0; j < numRungs; j++) {
        const t = (j + 0.5) / numRungs;
        const y = topY + t * helixHeight;
        const theta = angle + t * Math.PI * 2 * totalTurns;

        // Strand 1 node
        const x1 = centerX + Math.cos(theta) * helixRadius;
        const z1 = Math.sin(theta) * helixRadius;

        // Strand 2 node
        const x2 = centerX - Math.cos(theta) * helixRadius;
        const z2 = -Math.sin(theta) * helixRadius;

        const pair = baseColors[j % baseColors.length];

        // Rung is centered on the axis (z = 0)
        drawQueue.push({
          type: 'rung',
          x1, y1: y,
          x2, y2: y,
          z: 0, // Axis line is at z=0
          leftColor: pair.left,
          rightColor: pair.right
        });

        // Bead Node on Strand 1
        drawQueue.push({
          type: 'node',
          x: x1,
          y,
          z: z1,
          strand: 1
        });

        // Bead Node on Strand 2
        drawQueue.push({
          type: 'node',
          x: x2,
          y,
          z: z2,
          strand: 2
        });
      }

      // 3. Sort entire queue by Z depth: Back (-Z) to Front (+Z)
      drawQueue.sort((a, b) => a.z - b.z);

      // 4. Render 3D Depth Sorted Elements
      for (let item of drawQueue) {
        // depthFactor: 0 = far back, 0.5 = middle, 1.0 = closest to viewer
        const depthFactor = (item.z + helixRadius) / (helixRadius * 2);
        const isFront = item.z > 0;

        if (item.type === 'ribbonSegment') {
          ctx.beginPath();
          ctx.moveTo(item.x1, item.y1);
          ctx.lineTo(item.x2, item.y2);

          if (isFront) {
            // Front Ribbon: Bold, intense golden-neon with radiant glow
            // Outer Glow Pass
            ctx.strokeStyle = item.strand === 1 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(251, 191, 36, 0.45)';
            ctx.lineWidth = 5.0;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Core Solid Radiant Ribbon
            ctx.strokeStyle = item.strand === 1 ? '#FDE047' : '#FBBF24';
            ctx.lineWidth = 2.8;
            ctx.stroke();

            // Specular Hotspot Line
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.0;
            ctx.stroke();
          } else {
            // Back Ribbon: Atmospheric, slightly darker/faded for realistic depth
            ctx.strokeStyle = item.strand === 1 ? 'rgba(180, 83, 9, 0.4)' : 'rgba(217, 119, 6, 0.35)';
            ctx.lineWidth = 2.0;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        } else if (item.type === 'rung') {
          const midX = (item.x1 + item.x2) / 2;

          // Left Base Segment
          ctx.beginPath();
          ctx.moveTo(item.x1, item.y1);
          ctx.lineTo(midX, item.y1);
          ctx.strokeStyle = item.leftColor;
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Right Base Segment
          ctx.beginPath();
          ctx.moveTo(midX, item.y1);
          ctx.lineTo(item.x2, item.y2);
          ctx.strokeStyle = item.rightColor;
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Central Hydrogen Bond Sparkle Node
          ctx.beginPath();
          ctx.arc(midX, item.y1, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        } else if (item.type === 'node') {
          const radius = 1.8 + depthFactor * 1.6; // 1.8px (back) to 3.4px (front)

          // Outer Glow for front nodes
          if (isFront) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
            ctx.beginPath();
            ctx.arc(item.x, item.y, radius * 1.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Node Solid Bead
          ctx.fillStyle = isFront ? '#FEF08A' : 'rgba(217, 119, 6, 0.55)';
          ctx.beginPath();
          ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
          ctx.fill();

          // Specular White Glint on front nodes
          if (depthFactor > 0.6) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(item.x - radius * 0.3, item.y - radius * 0.3, radius * 0.45, 0, Math.PI * 2);
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
      {/* 3D Particle Canvas for Authentic DNA Sequence */}
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

      {/* SVG Layer for Cybernetic Pedestal Base and Botanical Accents */}
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 1 }}>
        <defs>
          <pattern id="bioGrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="0.6" fill="rgba(245, 158, 11, 0.22)" />
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="0.5"/>
          </pattern>

          {/* Pedestal Emitter Gradients */}
          <radialGradient id={`emitterCoreGrad-${gradKey}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FEF3C7" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#78350F" />
          </radialGradient>
          <linearGradient id={`holoConeGrad-${gradKey}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="rgba(245, 158, 11, 0.5)" />
            <stop offset="50%" stopColor="rgba(245, 158, 11, 0.18)" />
            <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
          </linearGradient>

          {/* Botanical 3D Leaf Gradients */}
          <linearGradient id="bioLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="35%" stopColor="#34D399" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>

          <filter id="amberPedestalGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Cyber Grid */}
        <rect x="0" y="0" width="175" height="235" fill="url(#bioGrid)" />

        {/* Cybernetic Pedestal Base */}
        <HoloPedestal accentColor="#F59E0B" accentRgb={accentRgb} filterId="amberPedestalGlow" />

        {/* 3D Glossy Botanical Leaves Framing the DNA Helix */}
        <g className="live-bio-leaf-left" transform="translate(14, 42) rotate(-22)" filter="url(#amberPedestalGlow)">
          <path d="M 0 0 C 14 3, 24 16, 26 28 C 14 28, 4 20, 0 0 Z" fill="url(#bioLeafGrad)" />
          <path d="M 0 0 C 10 12, 18 20, 26 28" stroke="#ECFDF5" strokeWidth="0.8" />
        </g>

        <g className="live-bio-leaf-right" transform="translate(132, 70) rotate(32)" filter="url(#amberPedestalGlow)">
          <path d="M 0 0 C 16 4, 28 18, 30 32 C 16 32, 4 22, 0 0 Z" fill="url(#bioLeafGrad)" />
          <path d="M 0 0 C 12 14, 22 22, 30 32" stroke="#ECFDF5" strokeWidth="0.8" />
        </g>
      </svg>
    </div>
  );
});

/**
 * LAB THEMATIC ART ROUTER
 */
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
