'use client';

import React, { useState, useEffect } from 'react';
import {
  Query,
  Terminal,
  Riffle,
  Drawer,
  Cabinet,
  Branches,
  Exploded,
  Dish,
  Hub,
  Turntable,
  Keyboard,
  Laptop
} from '@/lib/hairline/react';

const ICON_MAP = {
  dashboard: Hub,
  courses: Cabinet,
  quizzes: Turntable,
  assignments: Riffle,
  resources: Drawer,
  'ask-vedika': Query,
  'coding-tutor': Terminal,
  puzzles: Exploded,
  viva: Dish,
  branches: Branches,
  keyboard: Keyboard,
  laptop: Laptop
};

/**
 * HairlineNavIcon - Tier 1: Micro-Scale Interactive 3D Isometric Navigation Solid
 * 
 * @param {string} name - Identifier for the icon ('dashboard', 'courses', 'resources', etc.)
 * @param {number} size - Width/height in pixels (default: 26)
 * @param {string} themeColor - Accent highlight color override (e.g. '#A855F7', '#38BDF8')
 * @param {React.ReactNode} fallback - Fallback icon (e.g. Lucide icon) for SSR / no-script
 */
export default function HairlineNavIcon({
  name,
  size = 26,
  themeColor = '#C084FC',
  className = '',
  fallback = null,
  style = {}
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const FigureComponent = ICON_MAP[name];

  if (!mounted || !FigureComponent) {
    return (
      <span
        className={`hairline-icon-fallback ${className}`}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
      >
        {fallback}
      </span>
    );
  }

  return (
    <div
      className={`hairline-nav-icon-wrap ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        cursor: 'pointer',
        '--hairline-plate': 'transparent',
        '--hairline-edge': '#94A3B8',
        '--hairline-hi': themeColor,
        '--hairline-mid': 'rgba(148, 163, 184, 0.45)',
        '--hairline-lo': 'rgba(148, 163, 184, 0.2)',
        '--hairline-stroke': 1.1,
        ...style
      }}
    >
      <FigureComponent
        intensity={0.65}
        theme="dark"
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '1 / 1'
        }}
      />
    </div>
  );
}
