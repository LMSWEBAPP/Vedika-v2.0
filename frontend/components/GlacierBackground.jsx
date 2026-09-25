'use client';

import React from 'react';
import FeralUIFlowCanvas, { PRESETS } from './FeralUIFlowCanvas';
import WavyLinesBackground from './WavyLinesBackground';

/**
 * GlacierBackground - FeralUI Gradient Flow & Wavy Lines Background for Ask Vedika & Code with Vedika
 * 
 * Supports:
 * - 'aurora': FeralUI Aurora Palette
 * - 'glacier': FeralUI Glacier Palette
 * - 'pastel': FeralUI Opal Palette
 * - 'waves': Cybernetic Slow Flowing Neon Wavy Lines Animation
 */
const GlacierBackground = React.memo(function GlacierBackground({
  variant = 'aurora',
  opacity = 1.0,
  style = {},
  className = ''
}) {
  if (variant === 'waves') {
    return <WavyLinesBackground opacity={opacity} className={className} />;
  }

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
