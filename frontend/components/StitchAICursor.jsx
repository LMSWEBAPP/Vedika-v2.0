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

      {/* Writing Stylus / Fountain Pen Symbol (Tip points exactly at (x, y)) */}
      <div
        className={`stitch-pen-wrapper ${isWriting ? 'writing-active' : ''}`}
        style={{
          position: 'absolute',
          left: -2,
          top: -34,
          width: 36,
          height: 36,
          transformOrigin: '2px 34px',
          animation: isWriting ? 'penWritingMicro 0.28s ease-in-out infinite alternate' : 'none'
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.65))',
            display: 'block'
          }}
        >
          <defs>
            <linearGradient id="penBarrelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#1E1B4B" />
            </linearGradient>
            <linearGradient id="penNibGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="40%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <linearGradient id="penGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>

          {/* Pen Barrel */}
          <polygon
            points="7,25 22,10 28,16 13,31"
            fill="url(#penBarrelGrad)"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="0.75"
          />

          {/* Pen Top Cap Finial */}
          <path
            d="M 22 10 L 25 7 C 27 5 30 5 32 7 C 34 9 34 12 32 14 L 28 16 Z"
            fill="#1E293B"
            stroke="url(#penGoldGrad)"
            strokeWidth="0.75"
          />

          {/* Metallic Gold Ring / Grip */}
          <polygon
            points="5,27 7,25 13,31 11,33"
            fill="url(#penGoldGrad)"
            stroke="#FEF08A"
            strokeWidth="0.5"
          />

          {/* Fountain Pen Nib Base */}
          <polygon
            points="2,34 5,27 11,33"
            fill="url(#penNibGrad)"
            stroke="#CBD5E1"
            strokeWidth="0.75"
          />

          {/* Nib Slit & Ink Breather Hole */}
          <line
            x1="2"
            y1="34"
            x2="8"
            y2="28"
            stroke="#1E293B"
            strokeWidth="0.75"
            strokeLinecap="round"
          />
          <circle
            cx="8"
            cy="28"
            r="1"
            fill="#1E293B"
          />

          {/* Active Ink Point at Nib Tip */}
          <circle
            cx="2"
            cy="34"
            r="1.75"
            fill={accentColor}
            stroke="#FFFFFF"
            strokeWidth="0.5"
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
