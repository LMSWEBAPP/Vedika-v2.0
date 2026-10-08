'use client';

import React, { useState, useEffect } from 'react';
import {
  Riffle,
  Cabinet,
  Drawer,
  Branches,
  Query,
  Terminal,
  Exploded,
  Dish,
  Keyboard,
  Terrain,
  Hub
} from '@/lib/hairline/react';

const SHOWCASE_MAP = {
  riffle: Riffle,
  cabinet: Cabinet,
  drawer: Drawer,
  branches: Branches,
  query: Query,
  terminal: Terminal,
  exploded: Exploded,
  dish: Dish,
  keyboard: Keyboard,
  terrain: Terrain,
  hub: Hub
};

/**
 * HairlineShowcase - Tier 2: Interactive 3D Showcase Centerpiece Solid
 * 
 * Used for prominent interactive cards in Hubs (e.g. /resources, /vedika-ai)
 */
export default function HairlineShowcase({
  figure = 'riffle',
  width = 64,
  height = 56,
  accentColor = '#38BDF8',
  intensity = 0.8,
  className = '',
  style = {}
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Component = SHOWCASE_MAP[figure] || Riffle;

  if (!mounted) {
    return (
      <div
        className={`hairline-showcase-placeholder ${className}`}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      />
    );
  }

  return (
    <div
      className={`hairline-showcase-box ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        pointerEvents: 'auto',
        '--hairline-plate': 'rgba(15, 23, 42, 0.4)',
        '--hairline-edge': '#94A3B8',
        '--hairline-hi': accentColor,
        '--hairline-mid': 'rgba(148, 163, 184, 0.55)',
        '--hairline-lo': 'rgba(148, 163, 184, 0.22)',
        '--hairline-stroke': 1.15,
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
