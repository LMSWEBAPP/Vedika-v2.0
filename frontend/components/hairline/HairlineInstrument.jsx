'use client';

import React, { useState, useEffect } from 'react';
import {
  Dish,
  Terrain,
  Phosphor,
  Turntable,
  Vault,
  Branches,
  Patch,
  Sieve
} from '@/lib/hairline/react';

const INSTRUMENT_MAP = {
  dish: Dish,
  terrain: Terrain,
  phosphor: Phosphor,
  turntable: Turntable,
  vault: Vault,
  branches: Branches,
  patch: Patch,
  sieve: Sieve
};

/**
 * HairlineInstrument - Tier 3: Interactive 3D Scientific & Educational Solid
 * 
 * Used for Lab instruments, math surfaces, physics gimbals, and scientific concepts
 */
export default function HairlineInstrument({
  instrument = 'dish',
  width = 180,
  height = 145,
  glowColor = '#38BDF8',
  intensity = 0.9,
  className = '',
  style = {}
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Component = INSTRUMENT_MAP[instrument] || Dish;

  if (!mounted) {
    return (
      <div
        className={`hairline-instrument-placeholder ${className}`}
        style={{ width, height, ...style }}
      />
    );
  }

  return (
    <div
      className={`hairline-instrument-stage ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: `drop-shadow(0 8px 24px ${glowColor}33)`,
        '--hairline-plate': 'rgba(3, 7, 18, 0.75)',
        '--hairline-edge': '#94A3B8',
        '--hairline-hi': glowColor,
        '--hairline-mid': 'rgba(148, 163, 184, 0.65)',
        '--hairline-lo': 'rgba(148, 163, 184, 0.25)',
        '--hairline-stroke': 1.25,
        ...style
      }}
    >
      <Component
        intensity={intensity}
        theme="dark"
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '5 / 4'
        }}
      />
    </div>
  );
}
