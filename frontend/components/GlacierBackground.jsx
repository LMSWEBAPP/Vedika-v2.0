'use client';

import React from 'react';
import FeralUIFlowCanvas from './FeralUIFlowCanvas';

/**
 * GlacierBackground - FeralUI Gradient Flow Background for Ask Vedika
 * 
 * Supports:
 * - 'pastel': The official FeralUI "Opal" Flow preset (Fluid. ALWAYS IN MOTION).
 *             Real-time 60 FPS GPU fluid shader with Wisteria Lavender, Ice Cyan, Sakura Pink, and Pearl White.
 *             Overlayed with authentic FeralUI grain (#grainp). 100% bright, zero black fade/vignette.
 * - 'glacier': FeralUI 4K Vector Flow (Deep Hanada #183F60, Inked Lapis #277EA3, Clear Hanada #65BED0, Sky Haze #B9E3DF).
 */
export default function GlacierBackground({
  variant = 'pastel',
  opacity = 1.0,
  showVignette = false,
  style = {},
  className = ''
}) {
  const isPastel = variant === 'pastel';

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
        backgroundColor: isPastel ? '#FAF7FD' : '#183F60',
        ...style
      }}
      aria-hidden="true"
    >
      {isPastel ? (
        /* ── FERALUI "OPAL" REAL-TIME FLUID FLOW (ALWAYS IN MOTION - NO BLACK FADE) ── */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: opacity,
            overflow: 'hidden'
          }}
        >
          {/* Base luminous background */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#FAF7FD' }} />

          {/* Real-time 60fps GPU WebGL / 2D Fluid Shader */}
          <FeralUIFlowCanvas />

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
      ) : (
        /* ── GLACIER 4K VECTOR FLOW ── */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: opacity,
            transition: 'opacity 0.4s ease'
          }}
        >
          <img
            src="/glacier-flow.svg"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block'
            }}
          />
        </div>
      )}

      {/* Optional subtle edge vignette ONLY when explicitly enabled for Glacier */}
      {showVignette && !isPastel && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(11, 15, 25, 0.25) 0%, rgba(10, 18, 32, 0.65) 100%), linear-gradient(180deg, rgba(10, 18, 32, 0.4) 0%, transparent 20%, transparent 80%, rgba(10, 18, 32, 0.7) 100%)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
}
