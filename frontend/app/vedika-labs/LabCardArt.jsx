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

          {/* 3D Metallic Pi Gradient */}
          <linearGradient id="piMetal3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E9D5FF" />
            <stop offset="70%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#581C87" />
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

        {/* 1. 3D SCULPTED METALLIC PI (Top-Left Flank, Zero Overlap) */}
        <g className="live-math-pi-3d" transform="translate(16, 44)" filter="url(#purplePedestalGlow)">
          <path
            d="M 3 6 Q 13 5 24 6 C 24 8 22 9 19 9 L 8 9 L 8 22 C 8 25 5 26 5 22 L 6 9 L 3 9 Z M 15 9 L 15 22 C 15 25 19 25 21 21 L 21 19 C 19 21 17 21 17 19 L 17 9 Z"
            fill="#3B0764"
            transform="translate(1, 1)"
          />
          <path
            d="M 3 6 Q 13 5 24 6 C 24 8 22 9 19 9 L 8 9 L 8 22 C 8 25 5 26 5 22 L 6 9 L 3 9 Z M 15 9 L 15 22 C 15 25 19 25 21 21 L 21 19 C 19 21 17 21 17 19 L 17 9 Z"
            fill="url(#piMetal3D)"
            stroke="#FAF5FF"
            strokeWidth="0.7"
          />
          <circle cx="19" cy="9" r="1.2" fill="#FFFFFF" />
        </g>

        {/* 2. 3D TRANSLUCENT ISOMETRIC CUBE (Top-Right Flank, Zero Overlap) */}
        <g className="live-math-cube-3d" transform="translate(136, 44)">
          <polygon points="11,0 22,6 11,12 0,6" fill="rgba(233, 213, 255, 0.45)" stroke="#FFFFFF" strokeWidth="0.9" />
          <polygon points="0,6 11,12 11,23 0,17" fill="rgba(168, 85, 247, 0.5)" stroke="#C084FC" strokeWidth="0.9" />
          <polygon points="11,12 22,6 22,17 11,23" fill="rgba(126, 34, 206, 0.4)" stroke="#C084FC" strokeWidth="0.9" />
          <circle cx="11" cy="0" r="1.5" fill="#FFFFFF" />
          <circle cx="22" cy="6" r="1.3" fill="#E9D5FF" />
          <circle cx="0" cy="6" r="1.3" fill="#E9D5FF" />
          <circle cx="11" cy="12" r="1.6" fill="#FFFFFF" />
          <circle cx="11" cy="23" r="1.4" fill="#C084FC" />
        </g>

        {/* 3. 3D WIREFRAME TETRAHEDRON PYRAMID (Bottom-Left Flank, Zero Overlap) */}
        <g className="live-math-tetra-3d" transform="translate(18, 134)">
          <polygon points="10,0 20,16 0,16" fill="rgba(168, 85, 247, 0.25)" stroke="#C084FC" strokeWidth="0.9" />
          <polygon points="10,0 10,16 0,16" fill="rgba(233, 213, 255, 0.35)" stroke="#FFFFFF" strokeWidth="0.8" />
          <line x1="10" y1="0" x2="10" y2="16" stroke="#FFFFFF" strokeWidth="0.9" />
          <circle cx="10" cy="0" r="1.6" fill="#FFFFFF" />
          <circle cx="20" cy="16" r="1.3" fill="#C084FC" />
          <circle cx="0" cy="16" r="1.3" fill="#C084FC" />
        </g>

        {/* GRAND 3D HOLOGRAPHIC OCTAHEDRON (Option 9 Central Focal Subject) */}
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
  const canvasRef = useRef(null);
  const accentRgb = '0, 212, 255';
  const gradKey = '0_212_255';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const width = 175;
    const height = 235;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. High-Intensity Quantum Photons Orbiting in 3D-angled planes
    const quantumParticles = Array.from({ length: 48 }, (_, i) => {
      const ring = i % 3;
      const tilt = ring === 0 ? -28 * (Math.PI / 180) : ring === 1 ? 38 * (Math.PI / 180) : 75 * (Math.PI / 180);
      return {
        a: 38 + (i % 6) * 4,
        b: 14 + (i % 4) * 2.4,
        tilt,
        angle: Math.random() * Math.PI * 2,
        speed: (0.018 + Math.random() * 0.024) * (i % 2 === 0 ? 1 : -1),
        size: 0.9 + Math.random() * 1.8,
        alpha: 0.55 + Math.random() * 0.45,
        pulseSpeed: 3.5 + Math.random() * 4.5,
        pulsePhase: Math.random() * Math.PI * 2
      };
    });

    // 2. High-Energy Vertical Quantum Flux Emitter Sparks (Surging from pedestal to core)
    const emitterSparks = Array.from({ length: 22 }, () => ({
      x: 87.5 + (Math.random() - 0.5) * 28,
      y: 175 + Math.random() * 15,
      vy: 1.3 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 0.45,
      size: 0.8 + Math.random() * 1.5,
      alpha: 0.5 + Math.random() * 0.5
    }));

    let t = 0;
    function render() {
      ctx.clearRect(0, 0, width, height);
      t += 0.03;

      // Draw Pedestal Emitter Vertical Quantum Sparks
      for (let s of emitterSparks) {
        s.y -= s.vy;
        s.x += s.vx;
        if (s.y < 86) {
          s.y = 175 + Math.random() * 8;
          s.x = 87.5 + (Math.random() - 0.5) * 26;
          s.vy = 1.3 + Math.random() * 1.9;
          s.alpha = 0.5 + Math.random() * 0.5;
        }

        const sparkAlpha = Math.min(1.0, s.alpha * ((s.y - 86) / 80));
        ctx.fillStyle = `rgba(0, 212, 255, ${sparkAlpha * 0.65})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Orbiting Quantum Photons with High-Intensity Cyan Corona & Specular Centers
      const cx = 87.5;
      const cy = 96;

      for (let p of quantumParticles) {
        p.angle += p.speed;
        const rawX = Math.cos(p.angle) * p.a;
        const rawY = Math.sin(p.angle) * p.b;

        const cosT = Math.cos(p.tilt);
        const sinT = Math.sin(p.tilt);
        const px = cx + rawX * cosT - rawY * sinT;
        const py = cy + rawX * sinT + rawY * cosT;

        const pulse = 0.7 + Math.sin(t * p.pulseSpeed + p.pulsePhase) * 0.3;
        const currentAlpha = p.alpha * pulse;

        // Luminous Cyan Aura
        ctx.fillStyle = `rgba(0, 212, 255, ${currentAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Hot Electric Blue Inner Ring
        ctx.fillStyle = `rgba(186, 230, 253, ${currentAlpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // White Specular Photon Center
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    const handleVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  return (
    <div className="art-physics-detailed" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* High-Intensity Live Quantum Photon Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 1 }}>
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

        {/* 1. 3D QUANTUM GYROSCOPE RINGS (Top-Left Flank, Zero Overlap) */}
        <g className="live-phys-gyro-3d" transform="translate(24, 46)" filter="url(#cyanPedestalGlow)">
          <ellipse cx="0" cy="0" rx="13" ry="4.5" transform="rotate(-30)" fill="none" stroke="#38BDF8" strokeWidth="1.1" strokeDasharray="3 2" />
          <ellipse cx="0" cy="0" rx="13" ry="4.5" transform="rotate(45)" fill="none" stroke="#BAE6FD" strokeWidth="1.1" />
          <circle cx="0" cy="0" r="3.2" fill="#FFFFFF" />
          <circle cx="8" cy="-4" r="1.6" fill="#00D4FF" />
          <circle cx="-7" cy="5" r="1.3" fill="#FFFFFF" />
        </g>

        {/* 2. 3D MAGNETIC DIPOLE NODE (Top-Right Flank, Zero Overlap) */}
        <g className="live-phys-dipole-3d" transform="translate(144, 48)">
          <ellipse cx="0" cy="0" rx="11" ry="4" transform="rotate(20)" fill="none" stroke="rgba(0, 212, 255, 0.6)" strokeWidth="0.9" />
          <circle cx="0" cy="0" r="4.2" fill="url(#satelliteGrad)" />
          <circle cx="-1.2" cy="-1.2" r="1.2" fill="#FFFFFF" />
          <circle cx="9" cy="3" r="1.5" fill="#FFFFFF" />
        </g>

        {/* 3. 3D ORBITAL SENSOR PROBE (Bottom-Left Flank, Zero Overlap) */}
        <g className="live-phys-probe-3d" transform="translate(22, 142)">
          <circle cx="0" cy="0" r="8" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="0" cy="0" r="4" fill="url(#physSphereGrad)" stroke="#FFFFFF" strokeWidth="0.6" />
          <circle cx="-1" cy="-1" r="1" fill="#FFFFFF" />
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
 * 3. CHEMISTRY LAB ART - OPTION 9 VOLUMETRIC GLOWING FLASK WITH LIVE RISING FIZZ & EVAPORATING VAPOR
 * - Grand 3D glass Erlenmeyer flask hovering over emerald pedestal
 * - Volumetric glowing emerald liquid with curved meniscus
 * - High-speed effervescent fizzy bubbles rising rapidly to the surface
 * - Bubbles burst at meniscus and EVAPORATE upward through the neck and billow into the air
 * - Floating molecular satellite nodes
 */
export const ChemistryLabArt = memo(function ChemistryLabArt() {
  const canvasRef = useRef(null);
  const accentRgb = '16, 185, 129';
  const gradKey = '16_185_129';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const width = 175;
    const height = 235;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. High-Intensity Rapid Effervescent Fizz Bubbles (increased density & vigor)
    const bubbles = Array.from({ length: 60 }, () => ({
      x: 70 + Math.random() * 35,
      y: 105 + Math.random() * 42,
      r: 0.7 + Math.random() * 2.0,
      vy: 1.5 + Math.random() * 2.2, // Rapid upward effervescence
      wobbleSpeed: 4.5 + Math.random() * 7,
      phase: Math.random() * Math.PI * 2,
      popped: false
    }));

    // 2. High-Density Rising Evaporating Vapor Plumes (billowing out of the neck)
    const vapors = Array.from({ length: 40 }, () => ({
      x: 85 + (Math.random() - 0.5) * 8,
      y: 30 + Math.random() * 70,
      r: 2.2 + Math.random() * 4.8,
      vy: 0.75 + Math.random() * 1.25, // Rising upward
      vx: (Math.random() - 0.5) * 0.7,
      alpha: 0.15 + Math.random() * 0.75,
      maxR: 9.5 + Math.random() * 7.5
    }));

    // 3. High-Intensity Reaction Sparkles (Twinkling within the liquid)
    const chemSparkles = Array.from({ length: 28 }, () => ({
      x: 72 + Math.random() * 31,
      y: 108 + Math.random() * 38,
      size: 0.7 + Math.random() * 1.3,
      speed: 4 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2
    }));

    // Conical boundary check for flask body
    function getFlaskWidth(y) {
      if (y >= 100 && y <= 152) {
        const t = (y - 100) / 52;
        return 20 + t * 18;
      }
      return 10; // In neck
    }

    let t = 0;
    function render() {
      ctx.clearRect(0, 0, width, height);
      t += 0.03;

      // A. RENDER EVAPORATING VAPOR (Floating Upward & Expanding into Air with Emerald Glow)
      for (let v of vapors) {
        v.y -= v.vy;
        v.x += v.vx;

        if (v.y < 46) {
          v.r = Math.min(v.maxR, v.r + 0.14);
          v.alpha -= 0.012;
          v.vx += (Math.random() - 0.5) * 0.12;
        } else {
          v.x += (87.5 - v.x) * 0.06;
        }

        if (v.y < 8 || v.alpha <= 0) {
          v.y = 96 + Math.random() * 6;
          v.x = 87.5 + (Math.random() - 0.5) * 10;
          v.r = 2.0 + Math.random() * 2.5;
          v.alpha = 0.65 + Math.random() * 0.35;
          v.vx = (Math.random() - 0.5) * 0.45;
        }

        const grad = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, v.r);
        grad.addColorStop(0, `rgba(255, 255, 255, ${v.alpha * 0.95})`);
        grad.addColorStop(0.35, `rgba(167, 243, 208, ${v.alpha * 0.85})`);
        grad.addColorStop(0.75, `rgba(52, 211, 153, ${v.alpha * 0.45})`);
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // B. RENDER HIGH-INTENSITY REACTION SPARKLES (Glistening in Fluid)
      for (let s of chemSparkles) {
        const pulse = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        ctx.fillStyle = `rgba(52, 211, 153, ${pulse * 0.85})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // C. RENDER LIVE RISING EFFERVESCENT FIZZ BUBBLES
      for (let b of bubbles) {
        b.y -= b.vy;
        b.x += Math.sin(t * b.wobbleSpeed + b.phase) * 0.5;

        const halfW = getFlaskWidth(b.y);
        if (b.x < 87.5 - halfW) b.x = 87.5 - halfW + 1;
        if (b.x > 87.5 + halfW) b.x = 87.5 + halfW - 1;

        // When bubble hits the liquid surface (meniscus at y = 100), burst!
        if (b.y <= 100) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(b.x, 100, b.r * 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(167, 243, 208, 0.9)';
          ctx.beginPath();
          ctx.arc(b.x, 100, b.r * 2.6, 0, Math.PI * 2);
          ctx.fill();

          // Respawn bubble at bottom of flask
          b.y = 142 + Math.random() * 8;
          b.x = 87.5 + (Math.random() - 0.5) * (getFlaskWidth(b.y) * 1.6);
          b.r = 0.7 + Math.random() * 2.0;
          b.vy = 1.5 + Math.random() * 2.2;
        } else {
          const bubbleAlpha = Math.min(1.0, 0.45 + (150 - b.y) / 45);

          // Outer Glow
          ctx.fillStyle = `rgba(167, 243, 208, ${bubbleAlpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Core Solid Pearl
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();

          // Specular Dot
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    const handleVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  return (
    <div className="art-chem-detailed" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 1. Canvas Layer for Live Rising Fizz & Evaporating Vapor */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3
        }}
      />

      {/* 2. SVG Layer for Flask Structure, Pedestal, Liquid Body & Reflections */}
      <svg className="art-svg-scene" viewBox="0 0 175 235" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 1 }}>
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
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="15%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="85%" stopColor="rgba(16, 185, 129, 0.15)" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.75" />
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

        {/* 1. 3D HEXAGONAL BENZENE LATTICE (Top-Left Flank, Zero Overlap) */}
        <g className="live-chem-benzene-3d" transform="translate(20, 64)" filter="url(#emeraldPedestalGlow)">
          <polygon
            points="11,0 22,6 22,19 11,25 0,19 0,6"
            fill="rgba(16, 185, 129, 0.15)"
            stroke="#34D399"
            strokeWidth="1.2"
          />
          <circle cx="11" cy="12.5" r="6" fill="none" stroke="rgba(167, 243, 208, 0.7)" strokeWidth="0.9" strokeDasharray="3 2" />
          <circle cx="11" cy="0" r="1.8" fill="#FFFFFF" />
          <circle cx="22" cy="6" r="1.6" fill="#6EE7B7" />
          <circle cx="22" cy="19" r="1.6" fill="#10B981" />
          <circle cx="11" cy="25" r="1.8" fill="#FFFFFF" />
          <circle cx="0" cy="19" r="1.6" fill="#10B981" />
          <circle cx="0" cy="6" r="1.6" fill="#6EE7B7" />
        </g>

        {/* 2. 3D MINIATURE REACTION BULB (Bottom-Left Flank, Zero Overlap) */}
        <g className="live-chem-bulb-3d" transform="translate(20, 142)">
          <circle cx="0" cy="0" r="8" fill="url(#molSphereGrad)" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.9" />
          <ellipse cx="0" cy="2" rx="5.5" ry="2" fill="#34D399" opacity="0.8" />
          <circle cx="-2.5" cy="-2.5" r="2" fill="#FFFFFF" opacity="0.85" />
        </g>

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
        </g>

        {/* 3. Floating Molecular Satellite Cluster (Option 9 Style, Mid-Right) */}
        <g className="live-chem-molecules" transform="translate(144, 68)">
          <line x1="0" y1="0" x2="14" y2="10" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="-6" y2="12" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.3" />
          <circle cx="0" cy="0" r="5" fill="url(#molSphereGrad)" filter="url(#emeraldPedestalGlow)" />
          <circle cx="14" cy="10" r="3.8" fill="url(#molSphereGrad)" />
          <circle cx="-6" cy="12" r="3" fill="url(#molSphereGrad)" />
        </g>
      </svg>
    </div>
  );
});

/**
 * 4. BIOLOGY LAB ART - ICONIC 3D DNA DOUBLE HELIX (DIAGONAL ORIENTATION)
 * - Tilted dynamically along a diagonal axis across the card (Option 10 aesthetic)
 * - 2 continuous twisting golden ribbons with smooth 3D depth sorting
 * - Distinct base-pair horizontal ladder rungs with dual nucleobase colors & central H-bond
 * - Glowing nucleotide bead nodes and shimmering ambient bioluminescent genetic dust
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
    const spores = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: 20 + Math.random() * 160,
      r: 0.7 + Math.random() * 1.3,
      vy: 0.25 + Math.random() * 0.45,
      alpha: 0.3 + Math.random() * 0.65,
      color: Math.random() > 0.4 ? '#FDE047' : '#34D399'
    }));

    // Double Helix Geometry Constants
    const centerX = 87.5;
    const centerY = 96;
    const diagonalTilt = 40 * (Math.PI / 180); // Dynamic opposite diagonal (+40 deg: lower-left to upper-right)
    const topY = 32;      // Reaches towards upper-right
    const bottomY = 160;  // Starts from lower-left near pedestal
    const helixHeight = bottomY - topY; // 128px tall
    const helixRadius = 21; // Slender, perfectly proportioned
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
        if (s.y < 15) {
          s.y = 175;
          s.x = Math.random() * width;
        }
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * 0.75;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      angle += 0.016; // Smooth continuous 3D rotation speed

      // Apply Diagonal Orientation Matrix
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(diagonalTilt);
      ctx.translate(-centerX, -centerY);

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
        const tRung = (j + 0.5) / numRungs;
        const y = topY + tRung * helixHeight;
        const theta = angle + tRung * Math.PI * 2 * totalTurns;

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
          z: 0,
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
        const depthFactor = (item.z + helixRadius) / (helixRadius * 2);
        const isFront = item.z > 0;

        if (item.type === 'ribbonSegment') {
          ctx.beginPath();
          ctx.moveTo(item.x1, item.y1);
          ctx.lineTo(item.x2, item.y2);

          if (isFront) {
            // Front Ribbon: Bold, intense golden-neon with radiant glow
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
          const radius = 1.8 + depthFactor * 1.6;

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

      ctx.restore();

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    const handleVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  return (
    <div className="art-bio-detailed" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Particle Canvas for Diagonal DNA Sequence */}
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

          {/* Volumetric Cell Vesicle Radial Gradient */}
          <radialGradient id="cellGrad3D" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="rgba(254, 243, 199, 0.95)" />
            <stop offset="35%" stopColor="rgba(245, 158, 11, 0.65)" />
            <stop offset="70%" stopColor="rgba(16, 185, 129, 0.7)" />
            <stop offset="100%" stopColor="rgba(5, 150, 105, 0.95)" />
          </radialGradient>

          <filter id="amberPedestalGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.9" />
          </filter>
        </defs>

        {/* Cyber Grid */}
        <rect x="0" y="0" width="175" height="235" fill="url(#bioGrid)" />

        {/* Cybernetic Pedestal Base */}
        <HoloPedestal accentColor="#F59E0B" accentRgb={accentRgb} filterId="amberPedestalGlow" />

        {/* 1. 3D VOLUMETRIC LIVING CELL VESICLE (Bottom-Right, Clear of Diagonal DNA) */}
        <g className="live-bio-cell-3d" transform="translate(136, 150)" filter="url(#amberPedestalGlow)">
          <circle cx="0" cy="0" r="16" fill="url(#cellGrad3D)" stroke="#F59E0B" strokeWidth="1.4" />
          <circle cx="0" cy="0" r="6.5" fill="#10B981" stroke="#34D399" strokeWidth="1" />
          <circle cx="-2" cy="-2" r="2" fill="#ECFDF5" />
          <ellipse cx="-6" cy="4" rx="3" ry="1.5" fill="#F59E0B" transform="rotate(-20 -6 4)" />
          <ellipse cx="6" cy="-4" rx="2.5" ry="1.3" fill="#F59E0B" transform="rotate(30 6 -4)" />
          <circle cx="-5" cy="-5" r="2.5" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* 2. 3D MICROSCOPIC CHLOROPLAST POD (Top-Left, Clear of Diagonal DNA) */}
        <g className="live-bio-chloroplast-3d" transform="translate(28, 44)" filter="url(#amberPedestalGlow)">
          <ellipse cx="0" cy="0" rx="9" ry="5.5" transform="rotate(-30)" fill="url(#bioLeafGrad)" stroke="#ECFDF5" strokeWidth="0.8" />
          <line x1="-5" y1="0" x2="5" y2="0" transform="rotate(-30)" stroke="#FFFFFF" strokeWidth="0.8" />
          <circle cx="-2" cy="-1.5" r="1.2" fill="#FFFFFF" />
        </g>

        {/* 3D Glossy Botanical Leaves Framing the Diagonal DNA Helix */}
        <g className="live-bio-leaf-left" transform="translate(18, 52) rotate(-24)" filter="url(#amberPedestalGlow)">
          <path d="M 0 0 C 14 3, 24 16, 26 28 C 14 28, 4 20, 0 0 Z" fill="url(#bioLeafGrad)" />
          <path d="M 0 0 C 10 12, 18 20, 26 28" stroke="#ECFDF5" strokeWidth="0.8" />
        </g>

        <g className="live-bio-leaf-right" transform="translate(136, 118) rotate(32)" filter="url(#amberPedestalGlow)">
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
