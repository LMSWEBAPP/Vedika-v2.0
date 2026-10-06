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
  status = 'Writing...',
  label = '',
  isClicking = false,
  accentColor = '#A855F7'
}) {
  const [particles, setParticles] = useState([]);

  // Spawn sparkles as pen writes and glides across canvas
  useEffect(() => {
    if (!visible) return;

    const id = Math.random().toString(36).substring(2, 7);
    const angle = Math.random() * Math.PI * 2;
    const distance = 6 + Math.random() * 16;
    const newParticle = {
      id,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      size: 2.5 + Math.random() * 3.5,
      color: [accentColor, '#A855F7', '#38BDF8', '#FBBF24', '#34D399', '#FB7185'][Math.floor(Math.random() * 6)]
    };

    setParticles((prev) => [...prev.slice(-10), newParticle]);

    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 600);

    return () => clearTimeout(timer);
  }, [x, y, visible, accentColor]);

  if (!visible) return null;

  const isWriting = status.includes('Writing') || status.includes('Drafting') || status.includes('Connecting');

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
        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform'
      }}
    >
      {/* Sparkle Particles from writing nib */}
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
            boxShadow: `0 0 6px ${p.color}`
          }}
        />
      ))}

      {/* Modern Pure White Digital Stylus / Pen (Tip points exactly at (x, y)) */}
      <div
        className={`stitch-pen-wrapper ${isWriting ? 'writing-active' : ''}`}
        style={{
          position: 'absolute',
          left: -3,
          top: -38,
          width: 42,
          height: 42,
          transformOrigin: '3px 38px',
          animation: isWriting ? 'penWritingMicro 0.28s ease-in-out infinite alternate' : 'none'
        }}
      >
        <svg
          width="42"
          height="42"
          viewBox="0 0 42 42"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.35))',
            display: 'block'
          }}
        >
          <defs>
            {/* Pure Brilliant White Pen Body Gradient */}
            <linearGradient id="whitePenBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#FFFFFF" />
              <stop offset="85%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Polished Chrome / Platinum Metal Accent */}
            <linearGradient id="chromeAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>

            {/* Precision White Ceramic Nib Cone */}
            <linearGradient id="whitePenNibGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* White Pen Barrel Body (Long sleek stylus) */}
          <polygon
            points="8,29 26,11 32,17 14,35"
            fill="url(#whitePenBodyGrad)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />

          {/* Specular White Gloss Line along pen body */}
          <line
            x1="11"
            y1="26"
            x2="28"
            y2="14"
            stroke="#FFFFFF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          {/* Stylus Top End Cap (Pure White Dome with Chrome Trim) */}
          <path
            d="M 26 11 L 30 7 C 32 5 35 5 37 7 C 39 9 39 12 37 14 L 32 17 Z"
            fill="#FFFFFF"
            stroke="url(#chromeAccentGrad)"
            strokeWidth="1"
          />

          {/* Sleek Chrome Clip Accent */}
          <line
            x1="28"
            y1="9"
            x2="19"
            y2="20"
            stroke="url(#chromeAccentGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Silver Metal Ring between body and cone */}
          <polygon
            points="6,31 8,29 14,35 12,37"
            fill="url(#chromeAccentGrad)"
            stroke="#94A3B8"
            strokeWidth="0.6"
          />

          {/* Ceramic Nib Cone tapering to drawing point */}
          <polygon
            points="3,38 6,31 12,37"
            fill="url(#whitePenNibGrad)"
            stroke="#CBD5E1"
            strokeWidth="0.8"
          />

          {/* Precision Fine Drawing Tip */}
          <line
            x1="3"
            y1="38"
            x2="8"
            y2="33"
            stroke="#64748B"
            strokeWidth="0.75"
            strokeLinecap="round"
          />

          {/* Brilliant Radiant Ink Contact Point at Tip */}
          <circle
            cx="3"
            cy="38"
            r="2.2"
            fill={accentColor || '#38BDF8'}
            stroke="#FFFFFF"
            strokeWidth="0.9"
          />
        </svg>
      </div>

      {/* Floating AI Label & Status Pill */}
      <div
        className="stitch-cursor-badge"
        style={{
          position: 'absolute',
          left: 14,
          top: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.88)',
          border: `1px solid ${accentColor}55`,
          borderRadius: 20,
          padding: '4px 10px',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
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
            background: `linear-gradient(135deg, ${accentColor}, #3B82F6)`
          }}
        >
          <Sparkles size={9} color="#FFFFFF" />
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: `linear-gradient(90deg, ${accentColor}, #93C5FD)`,
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
              color: '#CBD5E1',
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
              color: accentColor,
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
