'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * StitchAICursor - Google Stitch & Figma AI-inspired generative cursor.
 * Features:
 * - Electric gradient pointer arrow with neon drop shadow
 * - Floating "Vedika AI ✨" glassmorphic pill badge
 * - Real-time animated status chip ("Drafting...", "Synthesizing...", etc.)
 * - Dynamic sparkle particle trail
 * - Neon bloom shockwave on node solidification
 */
export default function StitchAICursor({
  x = 0,
  y = 0,
  visible = false,
  status = 'Generating...',
  label = '',
  isClicking = false
}) {
  const [particles, setParticles] = useState([]);

  // Spawn sparkles as cursor glides to new coordinates
  useEffect(() => {
    if (!visible) return;

    const id = Math.random().toString(36).substring(2, 7);
    const angle = Math.random() * Math.PI * 2;
    const distance = 10 + Math.random() * 20;
    const newParticle = {
      id,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      size: 3 + Math.random() * 4,
      color: ['#38BDF8', '#818CF8', '#C084FC', '#F472B6'][Math.floor(Math.random() * 4)]
    };

    setParticles((prev) => [...prev.slice(-12), newParticle]);

    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 650);

    return () => clearTimeout(timer);
  }, [x, y, visible]);

  if (!visible) return null;

  return (
    <div
      className="stitch-ai-cursor-root"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform'
      }}
    >
      {/* Shockwave Ripple on Node Solidify Click */}
      {isClicking && <div className="stitch-cursor-ripple" />}

      {/* Floating Sparkle Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="stitch-particle"
          style={{
            position: 'absolute',
            left: p.x - x,
            top: p.y - y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '50%',
            boxShadow: `0 0 8px ${p.color}`
          }}
        />
      ))}

      {/* SVG Cursor Pointer (Google Stitch / Figma AI Style) */}
      <svg
        className="stitch-cursor-pointer"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.85)) drop-shadow(0 2px 5px rgba(0,0,0,0.9))',
          transform: isClicking ? 'scale(0.88) rotate(-8deg)' : 'rotate(-4deg)',
          transition: 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'block'
        }}
      >
        <defs>
          <linearGradient id="stitchCursorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>
        {/* Cursor Body */}
        <path
          d="M3 2L9 22L13 14L21 11L3 2Z"
          fill="url(#stitchCursorGrad)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Floating AI Label & Status Pill */}
      <div
        className="stitch-cursor-badge"
        style={{
          position: 'absolute',
          left: 18,
          top: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          borderRadius: 20,
          padding: '4px 10px',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.35)',
          backdropFilter: 'blur(10px)',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38BDF8, #A855F7)'
          }}
        >
          <Sparkles size={9} color="#FFFFFF" />
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #38BDF8, #C084FC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.02em'
          }}
        >
          Vedika AI
        </span>

        {status && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#94A3B8',
              paddingLeft: 4,
              borderLeft: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {status}
          </span>
        )}

        {label && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 500,
              color: '#38BDF8',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            &ldquo;{label}&rdquo;
          </span>
        )}
      </div>
    </div>
  );
}
