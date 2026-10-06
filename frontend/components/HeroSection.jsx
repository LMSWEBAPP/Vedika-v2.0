'use client';

import React, { useRef, useEffect, useState, useReducer, useCallback } from 'react';
import Image from 'next/image';
import styles from './HeroSection.module.css';
import ParticlesBackground from './ParticlesBackground';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

// High-Fidelity 3D Video Kid Talking Constants (Extracted from reference video)
const TOTAL_TALKING_FRAMES = 80;
const FRAME_COLS = 8;
const FRAME_W = 448;
const FRAME_H = 600;
const SPEECH_DURATION = 4.87;

const initialHeroState = {
  mounted: false,
  imagesLoaded: false,
  cursorInStage: false,
  stageCursorPos: { x: 0, y: 0 },
  revealUnlocked: false,
};

function heroReducer(state, action) {
  switch (action.type) {
    case 'MOUNT':
      return { ...state, mounted: true };
    case 'IMAGES_LOADED':
      return { ...state, imagesLoaded: true };
    case 'SET_CURSOR_POS':
      return { ...state, stageCursorPos: action.payload };
    case 'CURSOR_ENTER':
      return { ...state, cursorInStage: true };
    case 'CURSOR_LEAVE':
      return { ...state, cursorInStage: false };
    case 'UNLOCK_REVEAL':
      return { ...state, revealUnlocked: true };
    case 'RESTART_SPEECH':
      return { ...state, revealUnlocked: false };
    default:
      return state;
  }
}

export default function HeroSection() {
  const [state, dispatch] = useReducer(heroReducer, initialHeroState);
  const { mounted, imagesLoaded, cursorInStage, stageCursorPos, revealUnlocked } = state;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const mascotRef = useRef(null);
  const humanImgRef = useRef(null);
  const spriteSheetRef = useRef(null);

  const revealUnlockedRef = useRef(false);
  const speechTimeRef = useRef(0);
  const speechStartTimeRef = useRef(null);

  // User-tuned particle transform coordinates (centered squarely around the kid mascot)
  const DEFAULT_PARTICLES = {
    posX: 8.5,
    posY: 1.5,
    posZ: -34,
    scale: 0.9,
    rotX: 115,
    rotY: -5,
    rotZ: -26,
    ringDensity: 1.0,
    dustIntensity: 0.75,
    ringRotationSpeed: 0.1,
    speed: 0.37,
  };

  // Fluid reveal parameters
  const FIXED_RADIUS = 28;
  const DECAY_RATE = 0.055;

  const trailRef = useRef([]);
  const lastMascotPosRef = useRef(null);
  const animFrameIdRef = useRef(0);
  const timeRef = useRef(0);
  const cursorInMascotRef = useRef(false);
  const mascotPosRef = useRef({ x: 0, y: 0 });

  // High-fidelity natural child voice audio player
  const audioRef = useRef(null);
  const hasStartedAudioRef = useRef(false);

  const playKidVoice = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      const audio = new window.Audio('/vedika-kid-voice.mp3');
      audio.preload = 'auto';
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    audio.currentTime = 0;
    speechStartTimeRef.current = performance.now();
    revealUnlockedRef.current = false;
    dispatch({ type: 'RESTART_SPEECH' });

    audio.play()
      .then(() => {
        hasStartedAudioRef.current = true;
      })
      .catch((err) => {
        console.log('Audio autoplay waiting for user interaction:', err);
      });

    audio.onended = () => {
      revealUnlockedRef.current = true;
      dispatch({ type: 'UNLOCK_REVEAL' });
    };
  }, []);

  useEffect(() => {
    dispatch({ type: 'MOUNT' });
  }, []);

  // GSAP Title and Elements Animation matching the reference specification exactly
  useEffect(() => {
    if (!mounted) return;

    try {
      gsap.registerPlugin(CustomEase);
      const customEaseIn = CustomEase.create('custom-ease-in', '0.52, 0.00, 0.48, 1.00');
      const fourtyFrames = 1.3333333;
      const fiftyFrames = 1.66666;
      const twoFrames = 0.666666;
      const fourFrames = 0.133333;
      const sixFrames = 0.2;

      const titleLead = document.querySelector(`.${styles.titleLead}`);
      const titleSubline = document.querySelector(`.${styles.titleSubline}`);
      const desc = document.querySelector(`.${styles.description}`);

      const timeline = gsap.timeline();

      if (titleLead) {
        timeline.from(titleLead, { y: '-0.5rem', opacity: 0, duration: 0.8, ease: 'power2.out' }, 0);
      }
      if (titleSubline) {
        timeline.from(titleSubline, { y: '0.4rem', opacity: 0, duration: 0.8, ease: 'power2.out' }, 0.25);
      }
      if (desc) {
        timeline.from(desc, { y: '0.4rem', opacity: 0, duration: 0.8, ease: 'power2.out' }, 0.4);
      }
    } catch (err) {
      console.warn('GSAP animation error:', err);
    }
  }, [mounted]);

  // Preload top human student image & talking sprite sheet
  useEffect(() => {
    if (!mounted) return;

    let loaded = 0;
    const checkAllLoaded = () => {
      loaded++;
      if (loaded >= 2) {
        dispatch({ type: 'IMAGES_LOADED' });
      }
    };

    const humanImg = new window.Image();
    humanImg.src = '/vedika-human-clean.png';
    humanImg.onload = () => {
      humanImgRef.current = humanImg;
      checkAllLoaded();
    };

    const spriteSheet = new window.Image();
    spriteSheet.src = '/vedika-kid-talking-frames.webp';
    spriteSheet.onload = () => {
      spriteSheetRef.current = spriteSheet;
      checkAllLoaded();
    };

    return () => {
      humanImgRef.current = null;
      spriteSheetRef.current = null;
    };
  }, [mounted]);

  // Play audio when images are loaded
  useEffect(() => {
    if (!imagesLoaded) return;
    playKidVoice();
  }, [imagesLoaded, playKidVoice]);

  // Canvas animation, video-perfect lip sync, and fluid hover reveal loop
  useEffect(() => {
    if (!mounted || !imagesLoaded) return;
    const canvas = canvasRef.current;
    const mascot = mascotRef.current;
    if (!canvas || !mascot) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const handleResize = () => {
      if (!mascot || !canvas) return;
      const rect = mascot.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = (timestamp) => {
      timeRef.current += 0.04;
      if (!speechStartTimeRef.current) {
        speechStartTimeRef.current = timestamp;
      }

      // Track speech progress synchronized with natural audio playback
      let elapsedSpeechSec = (timestamp - speechStartTimeRef.current) / 1000;
      if (audioRef.current && !audioRef.current.paused && audioRef.current.currentTime > 0) {
        elapsedSpeechSec = audioRef.current.currentTime;
      }
      speechTimeRef.current = elapsedSpeechSec;

      const isAudioActive = audioRef.current && !audioRef.current.ended && !audioRef.current.paused;
      const isSpeechDone = elapsedSpeechSec >= SPEECH_DURATION || (audioRef.current && audioRef.current.ended);

      if (isSpeechDone && !revealUnlockedRef.current) {
        revealUnlockedRef.current = true;
        dispatch({ type: 'UNLOCK_REVEAL' });
      }

      if (!mascot) return;
      const rect = mascot.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw top human student layer
      // During speech, render video-extracted transparent frames synchronized with the dialogue
      const isTalking = !isSpeechDone && (isAudioActive || elapsedSpeechSec < SPEECH_DURATION);
      if (isTalking && spriteSheetRef.current) {
        const progress = Math.min(1, Math.max(0, elapsedSpeechSec / SPEECH_DURATION));
        const frameIndex = Math.min(
          TOTAL_TALKING_FRAMES - 1,
          Math.floor(progress * TOTAL_TALKING_FRAMES)
        );
        const col = frameIndex % FRAME_COLS;
        const row = Math.floor(frameIndex / FRAME_COLS);

        ctx.drawImage(
          spriteSheetRef.current,
          col * FRAME_W,
          row * FRAME_H,
          FRAME_W,
          FRAME_H,
          0,
          0,
          w,
          h
        );
      } else if (humanImgRef.current) {
        // Dialogue complete! Draw the exact resting static frame
        ctx.drawImage(humanImgRef.current, 0, 0, w, h);
      }

      // 2. Fluid reveal erasure ONLY enabled after the dialogue completes!
      if (revealUnlockedRef.current) {
        ctx.globalCompositeOperation = 'destination-out';

        // 2a. Active focus aperture directly under cursor when hovering over mascot
        if (cursorInMascotRef.current) {
          const mx = mascotPosRef.current.x;
          const my = mascotPosRef.current.y;
          const activeR = FIXED_RADIUS * 1.05;

          const activeGrad = ctx.createRadialGradient(mx, my, activeR * 0.1, mx, my, activeR * 1.15);
          activeGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
          activeGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.88)');
          activeGrad.addColorStop(0.92, 'rgba(0, 0, 0, 0.3)');
          activeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = activeGrad;
          ctx.beginPath();
          ctx.arc(mx, my, activeR * 1.15, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2b. Lingering fluid organic wave trail points
        const points = trailRef.current;
        for (let i = points.length - 1; i >= 0; i--) {
          const pt = points[i];

          ctx.beginPath();
          const steps = 18;
          const baseR = pt.radius;
          const timeOffset = timeRef.current * 1.5 + pt.wobblePhase;

          for (let j = 0; j <= steps; j++) {
            const theta = (j / steps) * Math.PI * 2;
            const wave =
              Math.sin(theta * 3 + timeOffset) * 0.14 +
              Math.cos(theta * 5 - timeOffset * 0.8) * 0.1;
            const r = baseR * (1 + wave);
            const px = pt.x + Math.cos(theta) * r;
            const py = pt.y + Math.sin(theta) * r;

            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();

          const grad = ctx.createRadialGradient(
            pt.x,
            pt.y,
            Math.max(0, baseR * 0.1),
            pt.x,
            pt.y,
            baseR * 1.2
          );
          grad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, pt.alpha)})`);
          grad.addColorStop(0.7, `rgba(0, 0, 0, ${Math.min(1, pt.alpha * 0.85)})`);
          grad.addColorStop(0.95, `rgba(0, 0, 0, ${Math.min(1, pt.alpha * 0.3)})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = grad;
          ctx.fill();

          pt.alpha -= pt.decay;
          pt.radius += 0.05;
          if (pt.alpha <= 0) {
            points.splice(i, 1);
          }
        }

        ctx.globalCompositeOperation = 'source-over';
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted, imagesLoaded]);

  // Pointer interactions with interpolated stamps and organic radius variations
  const handlePointerMove = useCallback((e) => {
    if (!stageRef.current) return;
    const sRect = stageRef.current.getBoundingClientRect();
    const sx = e.clientX - sRect.left;
    const sy = e.clientY - sRect.top;

    dispatch({ type: 'SET_CURSOR_POS', payload: { x: sx, y: sy } });

    if (!mascotRef.current) return;
    const mRect = mascotRef.current.getBoundingClientRect();
    const mx = e.clientX - mRect.left;
    const my = e.clientY - mRect.top;

    const insideMascot = mx >= 0 && mx <= mRect.width && my >= 0 && my <= mRect.height;
    cursorInMascotRef.current = insideMascot;
    mascotPosRef.current = { x: mx, y: my };

    if (!insideMascot || !revealUnlockedRef.current) {
      lastMascotPosRef.current = null;
      return;
    }

    if (!lastMascotPosRef.current) {
      lastMascotPosRef.current = { x: mx, y: my };
      trailRef.current.push({
        x: mx,
        y: my,
        radius: FIXED_RADIUS,
        alpha: 1.0,
        decay: DECAY_RATE,
        wobblePhase: Math.random() * Math.PI * 2
      });
      return;
    }

    const prev = lastMascotPosRef.current;
    const dist = Math.hypot(mx - prev.x, my - prev.y);

    const stepDist = 6;
    const steps = Math.max(1, Math.floor(dist / stepDist));

    for (let i = 1; i <= steps; i++) {
      const ix = prev.x + (mx - prev.x) * (i / steps);
      const iy = prev.y + (my - prev.y) * (i / steps);
      const rVar = FIXED_RADIUS * (0.94 + Math.sin(trailRef.current.length * 0.7) * 0.12);

      trailRef.current.push({
        x: ix,
        y: iy,
        radius: rVar,
        alpha: 1.0,
        decay: DECAY_RATE,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    if (trailRef.current.length > 250) {
      trailRef.current = trailRef.current.slice(-250);
    }

    lastMascotPosRef.current = { x: mx, y: my };
  }, [FIXED_RADIUS, DECAY_RATE]);

  const handlePointerEnter = useCallback(() => {
    dispatch({ type: 'CURSOR_ENTER' });
    if (!hasStartedAudioRef.current) {
      playKidVoice();
    }
  }, [playKidVoice]);

  const handlePointerLeave = useCallback(() => {
    dispatch({ type: 'CURSOR_LEAVE' });
    cursorInMascotRef.current = false;
    lastMascotPosRef.current = null;
  }, []);

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        {/* Left Content Column */}
        <div className={styles.contentCol}>
          {/* Headline - Paired horizontal animation: VEDIKA & AI TUTOR with converging syllables & multi-color flow */}
          <div className={styles.titleBlock}>
            <span className={styles.titleLead}>MEET YOUR PERSONAL</span>
            <h1 className={styles.titleH1}>
              {/* Line 1: VEDIKA - noticeably bigger */}
              <div className={`${styles.titleRow} ${styles.titleRowVedika}`} id="titleRow1">
                <div className={styles.titleChartsCont} id="ve"><u><span className={styles.sylVe}>VE</span></u></div>
                <div className={styles.titleChartsCont} id="di"><u><span className={styles.sylDi}>DI</span></u></div>
                <div className={styles.titleChartsCont} id="ka"><u><span className={styles.sylKa}>KA</span></u></div>
              </div>
              {/* Line 2: AI TUTOR - smaller with distinct gap between AI and TUTOR */}
              <div className={`${styles.titleRow} ${styles.titleRowAiTutor}`} id="titleRow2">
                <div className={styles.titleChartsCont} id="ai"><u><span className={styles.sylAi}>AI</span></u></div>
                <span className={styles.wordGap} aria-hidden="true">&nbsp;</span>
                <div className={styles.titleChartsCont} id="tu"><u><span className={styles.sylTu}>TU</span></u></div>
                <div className={styles.titleChartsCont} id="tor"><u><span className={styles.sylTor}>TOR</span></u></div>
              </div>
            </h1>
            <span className={styles.titleSubline}>Learn Smarter. Go Further.</span>
          </div>

          {/* Subtitle */}
          <p className={styles.description}>
            Personalized intelligence and real-time concept mastery &mdash; built for every curious mind.
          </p>
        </div>

        {/* Right Visual Stage */}
        <div className={styles.visualCol}>
          <div
            ref={stageRef}
            className={styles.stageFrame}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            {/* Space Backdrop: Clean Earth Horizon with smooth edge feathering into deep space */}
            <div className={styles.spaceBackdrop}>
              <Image
                src="/vedika_earth_backdrop.jpg"
                alt="Earth Horizon in Deep Space"
                fill
                priority
                className={styles.spaceBackdropImg}
              />
            </div>

            {/* Glowing 4-Lab Colors Aura Backplate */}
            <div className={styles.portalAuraGlow} />

            {/* Heavy Multi-Shell Particle Rings with Golden Disco Dust Effect */}
            <div className={styles.stageParticlesWrapper}>
              <ParticlesBackground
                count={9500}
                opacity={0.94}
                {...DEFAULT_PARTICLES}
                scale={isMobile ? 0.74 : DEFAULT_PARTICLES.scale}
              />
            </div>

            {/* Central Mascot Container: Perfectly aligned Human & Bot */}
            <div ref={mascotRef} className={styles.mascotContainer}>
              {/* Layer 1 (Underneath): Vedika AI Bot Companion (HIDDEN until reveal is enabled) */}
              <div className={`${styles.innerRobotLayer} ${revealUnlocked ? styles.robotLayerActive : styles.robotLayerHidden}`}>
                <Image
                  src="/vedika-bot-fitted.png"
                  alt="Vedika AI Bot Companion"
                  fill
                  priority
                  className={styles.botImage}
                />
              </div>

              {/* Base Fallback Kid Layer: ALWAYS visible on page load/reload until canvas paints */}
              <div className={`${styles.baseHumanFallback} ${imagesLoaded ? styles.baseHumanFallbackReady : ''}`}>
                <Image
                  src="/vedika-human-clean.png"
                  alt="Vedika Student"
                  fill
                  priority
                  className={styles.humanFallbackImg}
                />
              </div>

              {/* Layer 2 (On Top): Human Student Canvas with talking visemes & fluid hover reveal */}
              <canvas ref={canvasRef} className={styles.sceneCanvas} />
            </div>

            {/* Glowing Pointer Cursor */}
            <div
              className={styles.fluidPointerDot}
              style={{
                transform: `translate3d(${stageCursorPos.x}px, ${stageCursorPos.y}px, 0)`,
                opacity: cursorInStage ? 1 : 0
              }}
            >
              <div className={styles.pointerHalo}></div>
              <div className={styles.pointerCore}></div>
            </div>

            {/* Interactive Reveal Hint Badge: Smaller, clean dialogue without audio widget */}
            <div
              className={`${styles.idleHint} ${revealUnlocked ? styles.idleHintActive : ''}`}
              style={{ opacity: cursorInStage ? 0 : 1 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.idleHintIcon}>
                <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" fill="currentColor"/>
              </svg>
              <span className={styles.hintQuoteText}>
                &ldquo;Curious who’s behind my smile? Hover to reveal!&rdquo;
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
