'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JellyBlobMascot } from 'feral-blob';

/**
 * List of available emotions:
 * Idle (neutral), Curious, Happy, Surprised, Love, Shy, Sleepy, Wave, Hmm, Side eye, Sad, Angry
 */
const POKE_MOODS = [
  'happy',
  'love',
  'surprised',
  'wave',
  'curious',
  'shy',
  'hmm',
  'sideEye'
];

/**
 * UserBlobAvatar - Emotive Violet Jelly Blob Mascot for user chat messages
 * 
 * Features:
 * - Prominent 54px mascot size with compact 'YOU' label below
 * - Hover: reacts happily with smile eyes, cheerful bounce, and bright violet glow
 * - Typing: perks up with 'curious' expression, nods playfully, looks down towards input
 * - AI Loading: gazes left towards AI tutor message with 'hmm' / 'curious'
 * - Poke/Click: squashes, cycles playful emotions, celebrates with stars/hearts burst
 * - Overpoke: shakes angrily with vein mark when poked rapidly, then calms down
 * - Autonomous idle: natural double-blinks and sleepy snooze when idle
 */
export default function UserBlobAvatar({
  isTyping = false,
  isAiLoading = false,
  isJustSent = false,
  size = 54,
  initialMood = 'neutral',
  className = '',
  style = {}
}) {
  const [baseMood, setBaseMood] = useState(initialMood);
  const [activeMood, setActiveMood] = useState(initialMood);
  const [isHovered, setIsHovered] = useState(false);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isOverpoked, setIsOverpoked] = useState(false);
  const [reactionTip, setReactionTip] = useState(null);

  const pokeCycleIndex = useRef(0);
  const resetTimerRef = useRef(null);
  const tipTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const blinkIntervalRef = useRef(null);

  // Show a mini temporary reaction bubble
  const showTip = useCallback((text) => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
    setReactionTip(text);
    tipTimerRef.current = setTimeout(() => {
      setReactionTip(null);
    }, 2000);
  }, []);

  // Periodic autonomous blink every 8-12 seconds
  useEffect(() => {
    blinkIntervalRef.current = setInterval(() => {
      if (!isHovered && !isTyping && !isOverpoked) {
        setBlinkCount((b) => b + 1);
      }
    }, 9000);

    return () => {
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    };
  }, [isHovered, isTyping, isOverpoked]);

  // Gentle sleepy snooze after 45s of total inactivity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setBaseMood('sleepy');
      setActiveMood('sleepy');
    }, 45000);
  }, []);

  // Sync mood when isTyping, isAiLoading, isJustSent, hover, or overpoke state changes
  useEffect(() => {
    resetIdleTimer();

    if (isOverpoked) {
      setActiveMood('angry');
      return;
    }

    if (isHovered) {
      setActiveMood('happy');
      return;
    }

    if (isJustSent) {
      setActiveMood('wave');
      setCelebrateCount((c) => c + 1);
      showTip('Sent! ✨');
      return;
    }

    if (isTyping) {
      setActiveMood('curious');
      return;
    }

    if (isAiLoading) {
      setActiveMood('hmm');
      return;
    }

    setActiveMood(baseMood);
  }, [isTyping, isAiLoading, isJustSent, isHovered, isOverpoked, baseMood, showTip, resetIdleTimer]);

  // Handle single poke (click)
  const handlePoke = useCallback(() => {
    resetIdleTimer();

    // Cycle to next mood on poke
    pokeCycleIndex.current = (pokeCycleIndex.current + 1) % POKE_MOODS.length;
    const nextMood = POKE_MOODS[pokeCycleIndex.current];
    setBaseMood(nextMood);
    setActiveMood(nextMood);

    // Mini celebrate burst every 3 pokes
    if (pokeCycleIndex.current % 3 === 0) {
      setCelebrateCount((c) => c + 1);
    }

    // Friendly reaction tips
    const tips = {
      happy: 'Hehe! ✨',
      love: 'Aww! 💖',
      surprised: 'Whoa! 😮',
      wave: 'Hi there! 👋',
      curious: 'Hmm? Tell me! 👀',
      shy: 'Blushing... 🌸',
      hmm: 'Thinking... 💭',
      sideEye: 'Heh! 😏'
    };
    showTip(tips[nextMood] || 'Boop! 🫧');

    // Return to neutral/curious after 5s of inactivity
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setBaseMood('neutral');
    }, 5000);
  }, [showTip, resetIdleTimer]);

  // Handle overpoke (poked too many times in a row)
  const handleOverpoke = useCallback(() => {
    setIsOverpoked(true);
    setActiveMood('angry');
    showTip("Hey, easy there! 💢");

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setIsOverpoked(false);
      setBaseMood('neutral');
      setActiveMood('neutral');
    }, 2400);
  }, [showTip]);

  // Handle waking a sleepy blob
  const handleWake = useCallback(() => {
    setActiveMood('surprised');
    showTip('Startled awake! ⚡');
    setTimeout(() => {
      setBaseMood('happy');
      setActiveMood('happy');
    }, 900);
  }, [showTip]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    };
  }, []);

  // Compute gaze coordinates based on active state
  const computedGaze = isTyping
    ? { x: 16, y: 22 } // Looking down towards input prompt
    : isAiLoading
    ? { x: -18, y: 6 } // Looking left towards AI tutor message
    : isHovered
    ? { x: 0, y: -6 }  // Looking up at cursor
    : activeMood === 'curious'
    ? { x: 12, y: 10 }
    : activeMood === 'hmm'
    ? { x: -10, y: -12 }
    : { x: 0, y: 0 };

  return (
    <div
      className={`user-blob-avatar-wrapper ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
        width: Math.max(48, size),
        ...style
      }}
    >
      {/* Mini reaction tooltip float */}
      {reactionTip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            marginBottom: 6,
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            borderRadius: 10,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
            color: '#F3E8FF',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 25,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
            animation: 'fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {reactionTip}
        </div>
      )}

      {/* Interactive Violet Jelly Blob Mascot Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Your Blob Mascot (Hover for happy, type for curious, click to poke)"
        style={{
          width: size,
          height: Math.round(size * 0.88),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          filter: isHovered
            ? 'drop-shadow(0 6px 18px rgba(192, 132, 252, 0.75)) drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))'
            : isTyping
            ? 'drop-shadow(0 4px 14px rgba(168, 85, 247, 0.55)) drop-shadow(0 0 6px rgba(192, 132, 252, 0.35))'
            : 'drop-shadow(0 2px 10px rgba(168, 85, 247, 0.38))',
          transition: 'filter 0.25s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isHovered ? 'scale(1.08)' : isTyping ? 'scale(1.04)' : 'scale(1.0)',
          // Violet theme variables explicitly anchored
          '--jelly-body-top': '#F3D5FF',
          '--jelly-body-mid': '#C084FC',
          '--jelly-body-deep': '#9333EA',
          '--jelly-body-rim': '#E9D5FF',
          '--jelly-outline': '#7E22CE',
          '--jelly-outline-light': '#A855F7',
          '--jelly-arm-mid': '#A855F7',
          '--jelly-arm-deep': '#7E22CE',
          '--jelly-eye-sparkle': '#D8B4FE'
        }}
      >
        <JellyBlobMascot
          mood={activeMood}
          eyeStyle="v1"
          happyEyes="smile"
          gaze={computedGaze}
          nod={isTyping}
          mouth={isTyping ? 'open' : undefined}
          sparkle={isTyping || activeMood === 'love'}
          blink={blinkCount}
          celebrate={celebrateCount}
          onPoke={handlePoke}
          onOverpoke={handleOverpoke}
          onWake={handleWake}
        />
      </div>

      {/* 'YOU' Text Label cleanly placed below the blob (kept at crisp, compact size) */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: isHovered ? '#D8B4FE' : '#A855F7',
          textTransform: 'uppercase',
          marginTop: 2,
          textAlign: 'center',
          lineHeight: 1,
          transition: 'color 0.2s ease'
        }}
      >
        YOU
      </div>
    </div>
  );
}
