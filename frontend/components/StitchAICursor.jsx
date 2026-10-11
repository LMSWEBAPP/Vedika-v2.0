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
  accentColor = '#A855F7',
  isTracing = false
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

  const isWriting = status.includes('Writing') || status.includes('Drafting') || status.includes('Connecting') || status.includes('Drawing') || status.includes('Linking') || isTracing;

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
        transition: isTracing ? 'none' : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
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

      {/* Modern Minimalist White Hairline Vector Stylus (Tip points exactly at (x, y)) */}
      <div
        className={`stitch-pen-wrapper ${isWriting ? 'writing-active' : ''}`}
        style={{
          position: 'absolute',
          left: -2,
          top: -38,
          width: 40,
          height: 40,
          transformOrigin: '2px 38px',
          animation: isWriting ? 'penWritingMicro 0.24s ease-in-out infinite alternate' : 'none'
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))',
            display: 'block'
          }}
        >
          {/* Slender Stylus Body Barrel - Hairline White Stroke */}
          <polygon
            points="6,28 24,10 29,15 11,33"
            fill="rgba(255, 255, 255, 0.08)"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Central Specular Hairline Shading */}
          <line
            x1="8"
            y1="30"
            x2="26"
            y2="12"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.75"
            strokeLinecap="round"
          />

          {/* Stylus Top End Cap - Hairline Contour */}
          <path
            d="M 24 10 L 27 7 C 28.5 5.5 31 5.5 32.5 7 C 34 8.5 34 11 32.5 12.5 L 29 15 Z"
            fill="rgba(255, 255, 255, 0.16)"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Sleek Hairline Stylus Clip */}
          <line
            x1="26"
            y1="8"
            x2="18"
            y2="16"
            stroke="#FFFFFF"
            strokeWidth="0.9"
            strokeLinecap="round"
          />

          {/* Tapered Fine Ceramic Nib Cone */}
          <polygon
            points="2,38 6,28 11,33"
            fill="rgba(255, 255, 255, 0.22)"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Precision Needle Point Tip */}
          <line
            x1="2"
            y1="38"
            x2="5"
            y2="33"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="0.8"
            strokeLinecap="round"
          />

          {/* Radiant Ink Contact Point at Nib Tip */}
          <circle
            cx="2"
            cy="38"
            r="1.6"
            fill="#FFFFFF"
            stroke={accentColor || '#38BDF8'}
            strokeWidth="0.8"
          />
        </svg>
      </div>

      {/* Floating Hairline AI Label & Micro-Status Pill */}
      <div
        className="stitch-cursor-badge"
        style={{
          position: 'absolute',
          left: 12,
          top: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(8, 12, 24, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: 20,
          padding: '3px 9px',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.8), 0 0 12px rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <Sparkles size={8} color="#FFFFFF" />
        </span>

        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.02em'
          }}
        >
          Vedika AI
        </span>

        {status && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 500,
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
              fontWeight: 600,
              color: accentColor || '#38BDF8',
              maxWidth: 130,
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
