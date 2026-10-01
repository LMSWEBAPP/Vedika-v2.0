'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JellyBlobMascot } from 'feral-blob';

/*
 * Available poke cycle moods:
 * Idle (neutral), Curious, Happy, Surprised, Love, Shy, Sleepy, Wave, Hmm, Side eye
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

/*
 * Complete list of all distinct blob companion expressions available
 */
export const ALL_BLOB_EXPRESSIONS = [
  { mood: 'happy', label: 'Happy', desc: 'Joyful smile with smiling arc eyes', gaze: { x: 0, y: -4 }, sparkle: true, blink: true },
  { mood: 'curious', label: 'Curious', desc: 'Inquisitive arched brow looking around with oval mouth', gaze: { x: 8, y: 4 }, sparkle: false, blink: false },
  { mood: 'surprised', label: 'Surprised', desc: 'Wide round ring eyes and open mouth in wonder', gaze: { x: 0, y: -6 }, sparkle: true, blink: true },
  { mood: 'love', label: 'Love', desc: 'Heart-shaped eyes and affectionate sweet smile', gaze: { x: 0, y: 0 }, sparkle: true, blink: false },
  { mood: 'sideEye', label: 'Side Eye', desc: 'Playful side glance with a sly little smirk', gaze: { x: 12, y: -2 }, sparkle: false, blink: false },
  { mood: 'hmm', label: 'Hmm / Thinking', desc: 'Squinted thinking brow pondering thoughtfully', gaze: { x: -8, y: -6 }, sparkle: false, blink: false },
  { mood: 'shy', label: 'Shy / Blushing', desc: 'Cute pink blush cheek marks and bashful downward glance', gaze: { x: -6, y: 6 }, sparkle: false, blink: true },
  { mood: 'wave', label: 'Wave / Friendly', desc: 'Friendly waving nub hand greeting the student', gaze: { x: 4, y: -4 }, sparkle: true, blink: false },
  { mood: 'sleepy', label: 'Sleepy', desc: 'Relaxed heavy eyelids dozing in peaceful rest', gaze: { x: 0, y: 4 }, sparkle: false, blink: false },
  { mood: 'neutral', label: 'Neutral / Calm', desc: 'Calm resting face with natural soft gentle blinking', gaze: { x: 0, y: 0 }, sparkle: false, blink: true }
];

/**
 * Subtle micro-expressions for the inactivity cycle.
 */
const SUBTLE_IDLE_CYCLE = ALL_BLOB_EXPRESSIONS;

/**
 * UserBlobAvatar - Emotive Violet Jelly Blob Mascot Companion
 * 
 * Features:
 * - Prominent default size (72px - 76px) with tight spacing to the text box
 * - Reacts live to environment:
 *   - User typing: perks up with 'curious' expression, nods playfully, looks down towards text box
 *   - AI generating: observes response stream with 'hmm' and gaze directed upwards/leftwards
 *   - User sends message: waves happily with celebrate sparkle burst
 *   - User hover: cheerful smile eyes, gentle lift, violet glow
 *   - User click/poke: jelly squash physics, cycles playful emotions & reaction speech tips
 *   - Continuous expression cycle: independently changes expression every 2 seconds
 */
export default function UserBlobAvatar({
  isTyping = false,
  isAiLoading = false,
  isJustSent = false,
  size = 72,
  themeColor = 'violet',
  initialMood = 'neutral',
  mood,
  className = '',
  style = {}
}) {
  const effectiveInitialMood = mood || initialMood;
  const [baseMood, setBaseMood] = useState(effectiveInitialMood);
  const [activeMood, setActiveMood] = useState(effectiveInitialMood);
  const [activeGaze, setActiveGaze] = useState({ x: 0, y: 0 });
  const [activeSparkle, setActiveSparkle] = useState(false);
  const [activeNod, setActiveNod] = useState(false);
  const [activeMouth, setActiveMouth] = useState(undefined);

  const [isHovered, setIsHovered] = useState(false);
  const [celebrateCount, setCelebrateCount] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [isOverpoked, setIsOverpoked] = useState(false);
  const [reactionTip, setReactionTip] = useState(null);
  const [isIdle, setIsIdle] = useState(true);

  const pokeCycleIndex = useRef(0);
  const idleCycleIndex = useRef(Math.floor(Math.random() * ALL_BLOB_EXPRESSIONS.length));
  const resetTimerRef = useRef(null);
  const tipTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const idleIntervalRef = useRef(null);
  const aiReadingIntervalRef = useRef(null);

  // Sync if mood prop changes
  useEffect(() => {
    if (mood && mood !== baseMood) {
      setBaseMood(mood);
      setActiveMood(mood);
    }
  }, [mood, baseMood]);

  // Show a mini temporary reaction bubble
  const showTip = useCallback((text) => {
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current);
    setReactionTip(text);
    tipTimerRef.current = setTimeout(() => {
      setReactionTip(null);
    }, 2200);
  }, []);

  // AI response streaming: subtle gaze oscillation while generating
  useEffect(() => {
    if (isAiLoading) {
      let flip = false;
      aiReadingIntervalRef.current = setInterval(() => {
        flip = !flip;
        setActiveGaze(flip ? { x: -16, y: -14 } : { x: -8, y: -18 });
      }, 2000);
    } else {
      if (aiReadingIntervalRef.current) clearInterval(aiReadingIntervalRef.current);
    }

    return () => {
      if (aiReadingIntervalRef.current) clearInterval(aiReadingIntervalRef.current);
    };
  }, [isAiLoading]);

  // Main environment & continuous 2-second independent expression state machine
  useEffect(() => {
    // Clear any ongoing idle loop
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);

    // Active state 1: Overpoked (clicked too rapidly)
    if (isOverpoked) {
      setIsIdle(false);
      setActiveMood('angry');
      setActiveGaze({ x: 0, y: 0 });
      setActiveNod(false);
      setActiveMouth(undefined);
      setActiveSparkle(false);
      return;
    }

    // Active state 2: Hovered
    if (isHovered) {
      setIsIdle(false);
      setActiveMood('happy');
      setActiveGaze({ x: 0, y: -6 });
      setActiveNod(false);
      setActiveMouth(undefined);
      setActiveSparkle(true);
      return;
    }

    // Active state 3: Just sent message
    if (isJustSent) {
      setIsIdle(false);
      setActiveMood('wave');
      setActiveGaze({ x: 0, y: -8 });
      setActiveNod(true);
      setActiveMouth('open');
      setActiveSparkle(true);
      setCelebrateCount((c) => c + 1);
      showTip('Sent! ✨');
      return;
    }

    // Active state 4: User typing in text box
    if (isTyping) {
      setIsIdle(false);
      setActiveMood('curious');
      // Looks down and left directly into the textarea prompt
      setActiveGaze({ x: -14, y: 22 });
      setActiveNod(true);
      setActiveMouth('open');
      setActiveSparkle(true);
      return;
    }

    // Active state 5: AI Generating response
    if (isAiLoading) {
      setIsIdle(false);
      setActiveMood('hmm');
      setActiveGaze({ x: -16, y: -14 });
      setActiveNod(false);
      setActiveMouth(undefined);
      setActiveSparkle(true);
      return;
    }

    // Continuous 2-second independent expression cycle:
    // Staggered initial offset (0 to 1200ms) so multiple avatars never jump in lockstep
    setIsIdle(true);
    const initialDelay = Math.random() * 1200;

    inactivityTimerRef.current = setTimeout(() => {
      // Step to the next expression
      idleCycleIndex.current = (idleCycleIndex.current + 1) % ALL_BLOB_EXPRESSIONS.length;
      const next = ALL_BLOB_EXPRESSIONS[idleCycleIndex.current];
      setActiveMood(next.mood);
      setActiveGaze(next.gaze);
      setActiveSparkle(next.sparkle);
      if (next.blink) setBlinkCount((b) => b + 1);

      // Continuously cycle every 2 seconds independently
      idleIntervalRef.current = setInterval(() => {
        idleCycleIndex.current = (idleCycleIndex.current + 1) % ALL_BLOB_EXPRESSIONS.length;
        const current = ALL_BLOB_EXPRESSIONS[idleCycleIndex.current];
        setActiveMood(current.mood);
        setActiveGaze(current.gaze);
        setActiveSparkle(current.sparkle);
        if (current.blink) setBlinkCount((b) => b + 1);
      }, 2000);
    }, initialDelay);

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    };
  }, [isTyping, isAiLoading, isJustSent, isHovered, isOverpoked, showTip]);

  // Handle single poke (click)
  const handlePoke = useCallback(() => {
    // Reset inactivity
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
    setIsIdle(false);

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

    // Return to neutral after 4s
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setBaseMood('neutral');
    }, 4000);
  }, [showTip]);

  // Handle overpoke (poked too many times rapidly)
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
    showTip('Awake & ready! ⚡');
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
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
      if (aiReadingIntervalRef.current) clearInterval(aiReadingIntervalRef.current);
    };
  }, []);

  // Palette definition based on themeColor
  const themeVars = themeColor === 'cyan'
    ? {
        '--jelly-body-top': '#E0F2FE',
        '--jelly-body-mid': '#38BDF8',
        '--jelly-body-deep': '#0284C7',
        '--jelly-body-rim': '#BAE6FD',
        '--jelly-outline': '#0369A1',
        '--jelly-outline-light': '#0EA5E9',
        '--jelly-arm-mid': '#0EA5E9',
        '--jelly-arm-deep': '#0284C7',
        '--jelly-eye-sparkle': '#7DD3FC'
      }
    : {
        '--jelly-body-top': '#F3D5FF',
        '--jelly-body-mid': '#C084FC',
        '--jelly-body-deep': '#9333EA',
        '--jelly-body-rim': '#E9D5FF',
        '--jelly-outline': '#7E22CE',
        '--jelly-outline-light': '#A855F7',
        '--jelly-arm-mid': '#A855F7',
        '--jelly-arm-deep': '#7E22CE',
        '--jelly-eye-sparkle': '#D8B4FE'
      };

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
        width: Math.max(54, size),
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
            background: 'rgba(15, 23, 42, 0.94)',
            border: themeColor === 'cyan' ? '1px solid rgba(14, 165, 233, 0.5)' : '1px solid rgba(168, 85, 247, 0.5)',
            borderRadius: 10,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
            color: themeColor === 'cyan' ? '#E0F2FE' : '#F3E8FF',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 30,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
            animation: 'fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {reactionTip}
        </div>
      )}

      {/* Interactive Jelly Blob Mascot Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Vedika Blob Companion (Reactions: Typing, AI generating, Click to poke, Idle after 3s)"
        style={{
          width: size,
          height: Math.round(size * 0.88),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          filter: isHovered
            ? (themeColor === 'cyan'
                ? 'drop-shadow(0 6px 20px rgba(56, 189, 248, 0.8)) drop-shadow(0 0 12px rgba(14, 165, 233, 0.55))'
                : 'drop-shadow(0 6px 20px rgba(192, 132, 252, 0.8)) drop-shadow(0 0 12px rgba(168, 85, 247, 0.55))')
            : isTyping
            ? (themeColor === 'cyan'
                ? 'drop-shadow(0 4px 16px rgba(14, 165, 233, 0.6)) drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))'
                : 'drop-shadow(0 4px 16px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 8px rgba(192, 132, 252, 0.4))')
            : isAiLoading
            ? (themeColor === 'cyan'
                ? 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.5))'
                : 'drop-shadow(0 4px 14px rgba(192, 132, 252, 0.5))')
            : 'drop-shadow(0 3px 12px rgba(0, 0, 0, 0.4))',
          transition: 'filter 0.35s ease, transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)',
          transform: isHovered ? 'scale(1.08) translateY(-2px)' : isTyping ? 'scale(1.04) translateY(-1px)' : 'scale(1.0)',
          animation: isIdle ? 'blobIdleFloat 3.8s ease-in-out infinite' : isAiLoading ? 'blobIdleFloat 2.2s ease-in-out infinite' : 'none',
          ...themeVars
        }}
      >
        <JellyBlobMascot
          mood={activeMood}
          eyeStyle="v1"
          happyEyes="smile"
          gaze={activeGaze}
          nod={activeNod}
          mouth={activeMouth}
          sparkle={activeSparkle || isTyping || activeMood === 'love'}
          blink={blinkCount}
          celebrate={celebrateCount}
          onPoke={handlePoke}
          onOverpoke={handleOverpoke}
          onWake={handleWake}
        />
      </div>

      {/* 'YOU' Text Label cleanly placed below the blob (compact 10px size) */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: isHovered
            ? (themeColor === 'cyan' ? '#7DD3FC' : '#D8B4FE')
            : (themeColor === 'cyan' ? '#38BDF8' : '#A855F7'),
          textTransform: 'uppercase',
          marginTop: 2,
          textAlign: 'center',
          lineHeight: 1,
          transition: 'color 0.2s ease'
        }}
      >
        YOU
      </div>

      <style>{`
        @keyframes blobIdleFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.015);
          }
        }
      `}</style>
    </div>
  );
}

