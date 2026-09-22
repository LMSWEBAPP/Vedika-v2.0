'use client';

import React from 'react';
import FeralUIFlowCanvas, { PRESETS } from './FeralUIFlowCanvas';

/**
 * GlacierBackground - FeralUI Gradient Flow Background for Ask Vedika
 * 
 * Supports all 3 live flowing presets (Fluid. ALWAYS IN MOTION):
 * - 'aurora': FeralUI Aurora Palette (Frost Mint #EAFFF4, Emerald #4BE8A0, Teal #2E7A6A, Cyan #2E6E80, Midnight #16224D)
 * - 'glacier': FeralUI Glacier Palette (Deep Hanada #183F60, Inked Lapis #277EA3, Clear Hanada #65BED0, Sky Haze #B9E3DF, Pale Matcha #EAF4E6)
 * - 'pastel': FeralUI Opal Palette (Pearl White #F6F9FF, Ice Cyan #9BE0E8, Wisteria Lavender #C4B5F7, Sakura Blush Pink #F8B8D9)
 * 
 * All run the 60 FPS real-time WebGL/2D fluid engine with authentic FeralUI grain overlay.
 * Zero black fade/vignette overlays - 100% radiant and luminous.
 */
const GlacierBackground = React.memo(function GlacierBackground({
  variant = 'aurora',
  opacity = 1.0,
  style = {},
  className = ''
}) {
  const activeVariant = PRESETS[variant] ? variant : 'aurora';
  const baseBg = PRESETS[activeVariant]?.baseColor || '#232E4A';

  return (
    <div
      className={`glacier-flow-background ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        userSelect: 'none',
        backgroundColor: baseBg,
        ...style
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: opacity,
          overflow: 'hidden'
        }}
      >
        {/* Base radiant color layer */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: baseBg }} />

        {/* Real-time 60fps GPU WebGL / 2D Fluid Shader (ALWAYS IN MOTION) */}
        <FeralUIFlowCanvas variant={activeVariant} />

        {/* Authentic FeralUI Grain Overlay (from official #grainp pattern) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/grain-pattern.png')",
            backgroundSize: '256px 256px',
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay',
            opacity: 0.22,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
});

export default GlacierBackground;
