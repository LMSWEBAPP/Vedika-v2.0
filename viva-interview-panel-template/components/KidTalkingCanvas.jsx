'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * KidTalkingCanvas
 * 
 * Synchronized Video-Extracted Talking Sprite Animation & Interactive Cursor Reveal:
 * - Reads a sequential sprite sheet of extracted video frames (e.g., 240 frames)
 * - Plays back lip-syncing frames synchronized to an audio voice track
 * - Automatically falls back to high-res static resting pose when speech finishes
 * - Optional cursor-following circular aperture reveal (reveals underneath background)
 * 
 * Props:
 * @param {string} spriteSheetSrc - Path to the talking frames sprite sheet (e.g. '/assets/vedika-kid-talking-frames.webp')
 * @param {string} staticImgSrc - Path to the high-res resting frame (e.g. '/assets/vedika-human-clean.png')
 * @param {string} audioSrc - Path to speech audio (e.g. '/assets/vedika-kid-voice.mp3')
 * @param {number} totalFrames - Total number of animation frames in the sprite sheet (default: 240)
 * @param {number} frameCols - Number of columns in sprite sheet (default: 16)
 * @param {number} frameWidth - Pixel width of single frame (default: 140)
 * @param {number} frameHeight - Pixel height of single frame (default: 180)
 * @param {number} speechDuration - Expected speech length in seconds (default: 8.0)
 * @param {boolean} enableReveal - Enable cursor flashlight reveal after speech ends
 */
export default function KidTalkingCanvas({
  spriteSheetSrc = '/assets/vedika-kid-talking-frames.webp',
  staticImgSrc = '/assets/vedika-human-clean.png',
  audioSrc = '/assets/vedika-kid-voice.mp3',
  totalFrames = 240,
  frameCols = 16,
  frameWidth = 140,
  frameHeight = 180,
  speechDuration = 8.0,
  enableReveal = true,
  className = '',
  style = {}
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const spriteSheetRef = useRef(null);
  const staticImgRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeechDone, setIsSpeechDone] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const speechStartTimeRef = useRef(null);
  const cursorRef = useRef({ x: -9999, y: -9999, isHovered: false });

  // Preload Images & Audio
  useEffect(() => {
    let loadedCount = 0;
    const checkReady = () => {
      loadedCount++;
      if (loadedCount >= 2) setIsLoaded(true);
    };

    const staticImg = new Image();
    staticImg.crossOrigin = 'anonymous';
    staticImg.src = staticImgSrc;
    staticImg.onload = () => {
      staticImgRef.current = staticImg;
      checkReady();
    };

    const sprite = new Image();
    sprite.crossOrigin = 'anonymous';
    sprite.src = spriteSheetSrc;
    sprite.onload = () => {
      spriteSheetRef.current = sprite;
      checkReady();
    };

    return () => {
      staticImgRef.current = null;
      spriteSheetRef.current = null;
    };
  }, [staticImgSrc, spriteSheetSrc]);

  // Handle Play Voice
  const handlePlayVoice = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsSpeechDone(true);
      };
    }
    speechStartTimeRef.current = performance.now();
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setIsSpeechDone(false);
    }).catch((e) => console.warn('Audio play restricted by browser policy:', e));
  }, [audioSrc]);

  // Main Canvas Render Loop
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animId;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (timestamp) => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      let elapsedSec = 0;
      if (speechStartTimeRef.current) {
        elapsedSec = (timestamp - speechStartTimeRef.current) / 1000;
        if (audioRef.current && !audioRef.current.paused && audioRef.current.currentTime > 0) {
          elapsedSec = audioRef.current.currentTime;
        }
      }

      const activeTalking = isPlaying && elapsedSec < speechDuration;

      // 1. Draw Kid Frame
      if (activeTalking && spriteSheetRef.current) {
        const progress = Math.min(1, Math.max(0, elapsedSec / speechDuration));
        const frameIndex = Math.min(totalFrames - 1, Math.floor(progress * totalFrames));
        const col = frameIndex % frameCols;
        const row = Math.floor(frameIndex / frameCols);

        ctx.drawImage(
          spriteSheetRef.current,
          col * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight,
          0,
          0,
          w,
          h
        );
      } else if (staticImgRef.current) {
        // High-res static resting pose
        ctx.drawImage(staticImgRef.current, 0, 0, w, h);
      }

      // 2. Interactive Cursor Aperture Reveal (destination-out)
      if (enableReveal && isSpeechDone && cursorRef.current.isHovered) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        const mx = cursorRef.current.x;
        const my = cursorRef.current.y;
        const radius = Math.min(w, h) * 0.28;

        const grad = ctx.createRadialGradient(mx, my, radius * 0.1, mx, my, radius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoaded, isPlaying, isSpeechDone, speechDuration, totalFrames, frameCols, frameWidth, frameHeight, enableReveal]);

  return (
    <div
      ref={containerRef}
      className={`kid-talking-container ${className}`}
      onMouseMove={(e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        cursorRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          isHovered: true
        };
      }}
      onMouseLeave={() => {
        cursorRef.current.isHovered = false;
      }}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 380,
        aspectRatio: `${frameWidth} / ${frameHeight}`,
        margin: '0 auto',
        userSelect: 'none',
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isSpeechDone && enableReveal ? 'crosshair' : 'default'
        }}
      />

      {/* Floating Audio Play / Replay Pill */}
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <button
          type="button"
          onClick={handlePlayVoice}
          style={{
            padding: '7px 16px',
            borderRadius: 20,
            background: isPlaying ? 'rgba(239, 68, 68, 0.85)' : 'rgba(124, 58, 237, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <span>{isPlaying ? '🎙️ Speaking...' : '🔊 Play Kid Voice'}</span>
        </button>
      </div>
    </div>
  );
}
