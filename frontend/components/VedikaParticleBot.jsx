'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * TouchTexture
 * Off-screen trail canvas implementation from Bruno Imbrizi (interactive-particles).
 * Maintains a fading history of cursor positions drawn with soft radial gradients
 * and easeOutSine easing.
 */
class TouchTexture {
  constructor(size = 64, maxAge = 80, radius = 0.20) {
    this.size = size;
    this.maxAge = maxAge;
    this.radius = radius;
    this.trail = [];

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.clear();
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.size, this.size);
  }

  addTouch(point) {
    let force = 0.4;
    const last = this.trail[this.trail.length - 1];
    if (last) {
      const dx = last.x - point.x;
      const dy = last.y - point.y;
      const dd = dx * dx + dy * dy;
      force = Math.min(Math.max(dd * 10000, 0.4), 1.0);
    }
    this.trail.push({
      x: point.x,
      y: point.y,
      age: 0,
      force
    });
  }

  update() {
    this.clear();
    if (!this.ctx) return;

    // Age points and discard points older than maxAge
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      p.age++;
      if (p.age > this.maxAge) {
        this.trail.splice(i, 1);
      }
    }

    // Draw active touch points with Bruno Imbrizi easeOutSine curve
    for (let i = 0; i < this.trail.length; i++) {
      this.drawTouch(this.trail[i]);
    }
  }

  drawTouch(point) {
    const posX = point.x * this.size;
    const posY = point.y * this.size;

    let intensity = 1;
    const ramp = this.maxAge * 0.28;
    if (point.age < ramp) {
      // Smooth fade-in
      intensity = Math.sin((point.age / ramp) * (Math.PI / 2));
    } else {
      // Smooth fade-out
      const fadeProgress = (point.age - ramp) / (this.maxAge * 0.72);
      intensity = Math.sin((1 - Math.min(1, fadeProgress)) * (Math.PI / 2));
    }

    intensity *= point.force;

    const radius = this.size * this.radius * intensity;
    if (radius <= 0.4) return;

    const grd = this.ctx.createRadialGradient(
      posX, posY, radius * 0.15,
      posX, posY, radius
    );
    grd.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

    this.ctx.beginPath();
    this.ctx.fillStyle = grd;
    this.ctx.arc(posX, posY, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  getImageData() {
    if (!this.ctx) return null;
    return this.ctx.getImageData(0, 0, this.size, this.size).data;
  }
}

// Global particle target cache: enables instant (0ms) initialization on revisit
const TARGET_CACHE = new Map();

/**
 * VedikaParticleBot
 * Implements Bruno Imbrizi's interactive-particles architecture:
 * - TouchTexture heat-trail with easeOutSine in/out
 * - Intrinsic particle angle & noise oscillation (cos(angle) * t, sin(angle) * t)
 * - Particles gently float and shimmer nearby the cursor without deforming the silhouette
 * - Outside-viewport staggered float-in on initial load
 * - Viewport-fitting responsive scale with zero bottom overflow
 */
export default function VedikaParticleBot({
  src = '/vedika-bot.png',
  width = 520,
  height = 560,
  colorMode = 'monochrome',
  isEntering = false,
  onSettled = null,
  className = '',
  inline = false,
  themeRgb = null,
  intensity = 1.0
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const intensityRef = useRef(intensity);
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const isEnteringRef = useRef(isEntering);
  isEnteringRef.current = isEntering;

  const parseThemeRgb = (val) => {
    if (!val) return null;
    if (Array.isArray(val) && val.length >= 3) return val;
    if (typeof val === 'string') {
      const parts = val.split(',').map(n => parseInt(n.trim(), 10));
      if (parts.length >= 3 && !isNaN(parts[0])) return parts;
    }
    return null;
  };

  const themeRgbRef = useRef(parseThemeRgb(themeRgb));
  useEffect(() => {
    themeRgbRef.current = parseThemeRgb(themeRgb);
  }, [themeRgb]);

  const morphToImageRef = useRef(null);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      if (morphToImageRef.current) {
        morphToImageRef.current(src);
      }
    }
  }, [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animId;
    let particles = [];
    let isInitialized = false;
    let hasNotifiedSettled = false;

    let targetWidth = 400;
    let targetHeight = 560;

    // Bruno Imbrizi TouchTexture instance (64x64 offscreen canvas)
    const touchTexture = new TouchTexture(64, 75, 0.22);

    // Viewport-wide mouse tracking
    const mouse = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      vx: 0,
      vy: 0,
      isHovered: false
    };

    let canvasWidth = inline ? (width || 220) : (window.innerWidth || 1920);
    let canvasHeight = inline ? (height || 250) : (window.innerHeight || 1080);
    let dpr = 1;

    const updateCanvasSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (inline) {
        canvasWidth = width || 220;
        canvasHeight = height || 250;
      } else {
        canvasWidth = window.innerWidth || 1920;
        canvasHeight = window.innerHeight || 1080;
      }

      canvas.width = Math.floor(canvasWidth * dpr);
      canvas.height = Math.floor(canvasHeight * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    let isMounted = true;
    let time = 0;
    const PERSPECTIVE_FOV = 420;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    function sampleFromImage(sourceImg) {
      updateCanvasSize();
      const isMobile = window.innerWidth < 768;

      const imageSrc = sourceImg?.currentSrc || sourceImg?.src || src;
      const cacheKey = `${imageSrc}_${inline ? 'inline' : 'full'}_${width}_${height}_${colorMode}_v3`;
      if (TARGET_CACHE.has(cacheKey)) {
        const cached = TARGET_CACHE.get(cacheKey);
        targetWidth = cached.targetWidth;
        targetHeight = cached.targetHeight;
        return cached.targets;
      }

      const naturalW = sourceImg?.naturalWidth || sourceImg?.width || 400;
      const naturalH = sourceImg?.naturalHeight || sourceImg?.height || 400;
      if (!naturalW || !naturalH) return null;

      const rect = container.getBoundingClientRect();
      const aspect = naturalW / naturalH;

      if (inline) {
        targetHeight = Math.max(10, Math.floor((height || 250) * 0.90));
        targetWidth = Math.max(10, Math.floor(targetHeight * aspect));
        if (targetWidth > (width || 220) * 0.95) {
          targetWidth = Math.max(10, Math.floor((width || 220) * 0.95));
          targetHeight = Math.max(10, Math.floor(targetWidth / aspect));
        }
      } else {
        const topOffset = Math.max(rect.top > 0 ? rect.top : 70, 64);
        const viewportAvailableHeight = window.innerHeight - topOffset - 24;
        const safeContainerHeight = isMobile
          ? 380
          : Math.min(viewportAvailableHeight > 320 ? viewportAvailableHeight : 560, 560);

        const maxAvailableW = isMobile ? window.innerWidth - 32 : (rect.width > 200 ? rect.width - 24 : 560);
        targetHeight = Math.max(10, Math.floor(safeContainerHeight));
        targetWidth = Math.max(10, Math.floor(targetHeight * aspect));

        if (targetWidth > maxAvailableW) {
          targetWidth = Math.max(10, Math.floor(maxAvailableW));
          targetHeight = Math.max(10, Math.floor(targetWidth / aspect));
        }
      }

      // Performance optimization: sample at targeted resolution instead of giant unscaled image
      const sampleW = inline ? targetWidth : naturalW;
      const sampleH = inline ? targetHeight : naturalH;

      const offscreen = document.createElement('canvas');
      offscreen.width = sampleW;
      offscreen.height = sampleH;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return null;

      offCtx.drawImage(sourceImg, 0, 0, sampleW, sampleH);

      let imgData;
      try {
        imgData = offCtx.getImageData(0, 0, sampleW, sampleH);
      } catch (err) {
        console.warn('VedikaParticleBot: getImageData skipped', err);
        return null;
      }

      if (!imgData || !imgData.data) return null;
      const data = imgData.data;

      const scaleX = targetWidth / sampleW;
      const scaleY = targetHeight / sampleH;
      const step = inline ? 2 : (isMobile ? 4 : 3);
      const targets = [];
      const sizeFactor = inline ? 0.96 : 1.0;

      for (let y = 0; y < sampleH; y += step) {
        for (let x = 0; x < sampleW; x += step) {
          const idx = (y * sampleW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 45) continue;

          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const alphaNorm = a / 255;

          if (luminance < 14 && maxC < 20) continue;
          if (maxC - minC <= 10 && maxC >= 195 && a < 220) continue;

          let pSize;
          let baseR, baseG, baseB, baseAlpha;

          if (colorMode === 'vibrant') {
            const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;

            if (saturation > 0.16 && maxC > 40) {
              const boost = 1.35;
              baseR = Math.min(255, Math.round(r * boost));
              baseG = Math.min(255, Math.round(g * boost));
              baseB = Math.min(255, Math.round(b * boost));
              baseAlpha = Math.min(1, Math.max(0.92, alphaNorm * 1.2));
              pSize = (1.68 + Math.random() * 0.35) * sizeFactor;
            } else if (luminance > 160) {
              baseR = 255;
              baseG = 255;
              baseB = 255;
              baseAlpha = Math.min(1, Math.max(0.96, (0.92 + ((luminance - 160) / 95) * 0.08) * alphaNorm * 1.15));
              pSize = (1.75 + Math.random() * 0.30) * sizeFactor;
            } else if (luminance > 75) {
              baseR = Math.min(255, Math.round(r * 1.10));
              baseG = Math.min(255, Math.round(g * 1.10));
              baseB = Math.min(255, Math.round(b * 1.16));
              baseAlpha = Math.min(1, Math.max(0.90, alphaNorm * 1.1));
              pSize = (1.45 + Math.random() * 0.25) * sizeFactor;
            } else {
              baseR = Math.round(r * 1.05);
              baseG = Math.round(g * 1.05);
              baseB = Math.round(b * 1.10);
              baseAlpha = Math.min(1, Math.max(0.82, alphaNorm * 1.05));
              pSize = (1.20 + Math.random() * 0.25) * sizeFactor;
            }
          } else {
            if (luminance > 165) {
              pSize = (1.70 + Math.random() * 0.30) * sizeFactor;
              baseR = 255;
              baseG = 255;
              baseB = 255;
              baseAlpha = Math.min(1, (0.92 + ((luminance - 165) / 90) * 0.08) * alphaNorm * 1.1);
            } else if (luminance > 85) {
              pSize = (1.45 + Math.random() * 0.25) * sizeFactor;
              baseR = 224;
              baseG = 234;
              baseB = 250;
              baseAlpha = Math.min(1, 0.88 * alphaNorm * 1.1);
            } else {
              pSize = (1.18 + Math.random() * 0.25) * sizeFactor;
              baseR = 130;
              baseG = 145;
              baseB = 172;
              baseAlpha = Math.min(1, 0.78 * alphaNorm * 1.05);
            }
          }

          const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;
          // In vedika-bot.png, eyes, chest core, and ear circles have cyan/blue saturation
          const isAccent = (saturation > 0.16 && maxC > 40) || (b > 115 && b > r + 15);
          const accentRatio = isAccent ? Math.min(1, Math.max(0.45, saturation * 1.4)) : 0;

          const relX = (x + (Math.random() - 0.5) * 0.35) * scaleX;
          const relY = (y + (Math.random() - 0.5) * 0.35) * scaleY;
          const pColor = `rgba(${baseR}, ${baseG}, ${baseB}, ${baseAlpha.toFixed(2)})`;

          targets.push({
            relX,
            relY,
            size: pSize,
            color: pColor,
            baseR,
            baseG,
            baseB,
            origR: baseR,
            origG: baseG,
            origB: baseB,
            accentRatio,
            baseAlpha
          });
        }
      }

      TARGET_CACHE.set(cacheKey, { targetWidth, targetHeight, targets });
      return targets;
    }

    function initParticles() {
      const targets = sampleFromImage(img);
      if (!targets || targets.length === 0) return;

      const rect = container.getBoundingClientRect();
      const robotX = inline ? (canvasWidth - targetWidth) / 2 : (rect.left + (rect.width - targetWidth) / 2);
      const robotY = inline ? (canvasHeight - targetHeight) / 2 : (rect.top + (rect.height - targetHeight) / 2);

      const newParticles = [];
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        let spawnX, spawnY, spawnZ;
        const isFrontEntrance = Math.random() < 0.24;

        if (inline) {
          spawnZ = -40 - Math.random() * 40;
          spawnX = robotX + t.relX + (Math.random() - 0.5) * 16;
          spawnY = robotY + t.relY + (Math.random() - 0.5) * 16;
        } else {
          // Non-inline (e.g. Vedika AI page): particles assemble organically from a smooth radial cloud
          // No rectangular edges, straight boundary lines, or visible box cuts
          const spawnAngle = Math.random() * Math.PI * 2;
          const spawnDist = 160 + Math.random() * 320;
          spawnX = (robotX + targetWidth / 2) + Math.cos(spawnAngle) * spawnDist;
          spawnY = (robotY + targetHeight / 2) + Math.sin(spawnAngle) * spawnDist;
          spawnZ = -20 - Math.random() * 60;
        }

        const angle = Math.random() * Math.PI * 2;
        const rnd = 0.6 + Math.random() * 1.4;

        newParticles.push({
          pindex: newParticles.length,
          relX: t.relX,
          relY: t.relY,
          angle,
          rnd,
          x: spawnX,
          y: spawnY,
          z: spawnZ,
          vx: (Math.random() - 0.5) * 1.0,
          vy: (Math.random() - 0.5) * 1.0,
          vz: 0,
          size: t.size,
          color: t.color,
          baseR: t.baseR,
          baseG: t.baseG,
          baseB: t.baseB,
          origR: t.origR,
          origG: t.origG,
          origB: t.origB,
          accentRatio: t.accentRatio,
          baseAlpha: t.baseAlpha,
          entryDelay: inline ? 0 : Math.floor(Math.random() * 3),
          hasEntered: false,
          introSpeed: inline ? (0.34 + Math.random() * 0.08) : (0.18 + Math.random() * 0.05),
          spring: inline ? 0.095 : (0.085 + Math.random() * 0.02),
          friction: inline ? 0.74 : (0.80 + Math.random() * 0.03),
          floatPower: inline ? 12.0 : (15.0 + Math.random() * 7.0),
          seed: Math.random() * 1000
        });
      }

      particles = newParticles;
      isInitialized = true;
    }

    const handlePointerMove = (e) => {
      let newX = e.clientX;
      let newY = e.clientY;

      if (inline) {
        const rect = container.getBoundingClientRect();
        newX = e.clientX - rect.left;
        newY = e.clientY - rect.top;
      }

      if (mouse.prevX > -9000) {
        mouse.vx = (newX - mouse.prevX) * 0.7;
        mouse.vy = (newY - mouse.prevY) * 0.7;
      }
      mouse.prevX = newX;
      mouse.prevY = newY;

      mouse.x = newX;
      mouse.y = newY;
      mouse.isHovered = true;

      // Pass normalized coordinates to Bruno Imbrizi TouchTexture
      const rect = container.getBoundingClientRect();
      const robotX = inline ? (canvasWidth - targetWidth) / 2 : (rect.left + (rect.width - targetWidth) / 2);
      const robotY = inline ? (canvasHeight - targetHeight) / 2 : (rect.top + (rect.height - targetHeight) / 2);
      const uvX = (newX - robotX) / targetWidth;
      const uvY = (newY - robotY) / targetHeight;

      // If cursor is within robot or close buffer zone, add touch trail point
      if (uvX >= -0.15 && uvX <= 1.15 && uvY >= -0.15 && uvY <= 1.15) {
        touchTexture.addTouch({ x: uvX, y: uvY });
      }
    };

    const handlePointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.prevX = -9999;
      mouse.prevY = -9999;
      mouse.vx = 0;
      mouse.vy = 0;
      mouse.isHovered = false;
    };

    const handleClick = (e) => {
      const rect = container.getBoundingClientRect();
      const cx = inline ? (e.clientX - rect.left) : e.clientX;
      const cy = inline ? (e.clientY - rect.top) : e.clientY;

      // Click shockwave ripple: lifts and scatters particles outward along their intrinsic angles
      const shockwaveRadius = inline ? 65 : 110;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!p.hasEntered) continue;

        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < shockwaveRadius && dist > 0.01) {
          const norm = dist / shockwaveRadius;
          const force = Math.pow(1 - norm, 2) * 38;
          p.vz -= force; // Pop forward in Z
          p.vx += Math.cos(p.angle) * force * 0.45;
          p.vy += Math.sin(p.angle) * force * 0.45;
        }
      }

      // Also trigger a strong touch point in the trail
      const robotX = inline ? (canvasWidth - targetWidth) / 2 : (rect.left + (rect.width - targetWidth) / 2);
      const robotY = inline ? (canvasHeight - targetHeight) / 2 : (rect.top + (rect.height - targetHeight) / 2);
      const uvX = (cx - robotX) / targetWidth;
      const uvY = (cy - robotY) / targetHeight;
      if (uvX >= 0 && uvX <= 1 && uvY >= 0 && uvY <= 1) {
        touchTexture.addTouch({ x: uvX, y: uvY });
      }
    };

    const handleResize = () => {
      if (img.complete && (img.naturalWidth || img.width)) {
        updateCanvasSize();
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0]);
      }
    }, { passive: true });
    window.addEventListener('touchend', handlePointerLeave);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);


    let warpProgress = 0;

    function animate() {
      time += 0.018;

      const rect = container.getBoundingClientRect();

      // Pause rendering if scrolled completely off screen (only in fixed full-screen mode)
      if (!inline && (rect.bottom < -120 || rect.top > window.innerHeight + 120)) {
        animId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Track warp transition smoothly
      if (isEnteringRef.current) {
        warpProgress = Math.min(1, warpProgress + 0.05);
      } else {
        warpProgress = 0;
      }

      // Once warp transition reaches 1, particles are fully dissolved: do not draw any debris!
      if (warpProgress >= 1) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const globalFade = Math.max(0, 1 - warpProgress);

      // Current anchor position of robot on screen (local if inline, screen if fixed)
      const robotX = inline ? (canvasWidth - targetWidth) / 2 : (rect.left + (rect.width - targetWidth) / 2);
      const robotY = inline ? (canvasHeight - targetHeight) / 2 : (rect.top + (rect.height - targetHeight) / 2);
      const centerX = robotX + targetWidth / 2;
      const centerY = robotY + targetHeight / 2;

      // Update Bruno Imbrizi TouchTexture
      touchTexture.update();
      const touchData = touchTexture.getImageData();

      // If mouse is hovered and stationary, continue adding steady touch point
      if (mouse.isHovered && mouse.x > -1000) {
        const uvX = (mouse.x - robotX) / targetWidth;
        const uvY = (mouse.y - robotY) / targetHeight;
        if (uvX >= -0.15 && uvX <= 1.15 && uvY >= -0.15 && uvY <= 1.15) {
          touchTexture.addTouch({ x: uvX, y: uvY });
        }
      }

      let activeUnsettled = 0;

      const currentTheme = themeRgbRef.current;
      const targetThemeR = currentTheme ? currentTheme[0] : null;
      const targetThemeG = currentTheme ? currentTheme[1] : null;
      const targetThemeB = currentTheme ? currentTheme[2] : null;

      const currentIntensity = intensityRef.current || 1.0;
      const isHighIntensity = currentIntensity > 1.1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Dynamic smooth color transition when active lab changes
        if (targetThemeR !== null && p.accentRatio > 0) {
          const ratio = p.accentRatio;
          const destR = targetThemeR * ratio + p.origR * (1 - ratio);
          const destG = targetThemeG * ratio + p.origG * (1 - ratio);
          const destB = targetThemeB * ratio + p.origB * (1 - ratio);

          p.baseR += (destR - p.baseR) * 0.12;
          p.baseG += (destG - p.baseG) * 0.12;
          p.baseB += (destB - p.baseB) * 0.12;
        }

        // Target equilibrium coordinates
        const targetX = robotX + p.relX;
        const targetY = robotY + p.relY;

        // 1. Initial Float-In Entrance (swift, critically damped assembly)
        if (!p.hasEntered) {
          activeUnsettled++;
          if (p.entryDelay > 0) {
            p.entryDelay--;
          } else {
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const dz = 0 - p.z;

            p.vx += dx * p.introSpeed;
            p.vy += dy * p.introSpeed;
            p.vz += dz * p.introSpeed;

            p.vx *= 0.74;
            p.vy *= 0.74;
            p.vz *= 0.74;

            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            const dist2D = Math.sqrt(dx * dx + dy * dy);
            if (dist2D < 5.5 && Math.abs(dz) < 8.0 && Math.abs(p.vx) < 1.6 && Math.abs(p.vy) < 1.6) {
              p.hasEntered = true;
              p.x = targetX;
              p.y = targetY;
              p.z = 0;
              p.vx = 0;
              p.vy = 0;
              p.vz = 0;
            }
          }
        } else {
          // =========================================================================
          // BRUNO IMBRIZI INTERACTIVE PARTICLES HOVER IMPLEMENTATION
          // Check what is done in the GitHub code:
          // 1. Sample brightness t from TouchTexture at particle UV
          // 2. Displace along particle's OWN intrinsic angle:
          //    dispX = cos(angle) * t * floatPower * rndz
          //    dispY = sin(angle) * t * floatPower * rndz
          //    dispZ = t * depth * rndz
          // 3. Image is NOT deformed into a hollow ring or dragged by mouse velocity!
          //    Particles simply float nearby to the cursor and return when trail fades.
          // =========================================================================
          let t = 0;
          if (touchData) {
            const u = p.relX / targetWidth;
            const v = p.relY / targetHeight;
            const tx = Math.max(0, Math.min(63, (u * 63) | 0));
            const ty = Math.max(0, Math.min(63, (v * 63) | 0));
            t = touchData[(ty * 64 + tx) * 4] / 255;
          }

          // Simplex/harmonic oscillation from Bruno Imbrizi shader:
          // rndz = (random(pindex) + snoise(vec2(pindex * 0.1, uTime * 0.1)))
          const noiseSpeed = isHighIntensity ? 2.2 : 1.5;
          const noise = Math.sin(time * noiseSpeed + p.pindex * 0.12) * Math.cos(time * (noiseSpeed * 0.6) + p.seed * 0.1);
          const rndz = p.rnd + noise * (isHighIntensity ? 0.85 : 0.55);

          let dispX = 0;
          let dispY = 0;
          let dispZ = 0;

          if (t > 0.005) {
            const floatMultiplier = isHighIntensity ? 1.45 : 1.0;
            const floatAmount = t * (p.floatPower * floatMultiplier) * rndz;
            dispX = Math.cos(p.angle) * floatAmount;
            dispY = Math.sin(p.angle) * floatAmount;
            dispZ = -t * (isHighIntensity ? 48.0 : 36.0) * Math.abs(rndz);
          }

          // Ambient shimmer when idle - heightened amplitude & vibration for physics & chemistry
          const shimmerAmp = isHighIntensity ? 0.65 : 0.22;
          const shimmerFreq = isHighIntensity ? 1.6 : 1.0;
          const ambientZ = rndz * (isHighIntensity ? 3.2 : 1.8);
          const ambientX = Math.sin(time * 0.9 * shimmerFreq + p.seed) * shimmerAmp;
          const ambientY = Math.cos(time * 0.7 * shimmerFreq + p.seed * 1.2) * shimmerAmp;

          const homeX = targetX + dispX + ambientX;
          const homeY = targetY + dispY + ambientY;
          const homeZ = dispZ + ambientZ;

          // Spring pull to (homeX, homeY, homeZ)
          p.vx += (homeX - p.x) * p.spring;
          p.vy += (homeY - p.y) * p.spring;
          p.vz += (homeZ - p.z) * (p.spring * 1.25);

          p.vx *= p.friction;
          p.vy *= p.friction;
          p.vz *= p.friction;

          // Gentle forward dispersal if user is entering the page
          if (isEnteringRef.current) {
            p.vz -= (8.0 + Math.random() * 8.0);
            p.vx += Math.cos(p.angle) * 4.0;
            p.vy += Math.sin(p.angle) * 4.0;
          }

          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
        }

        // 3D Perspective Projection to 2D Screen
        // Clip particles that have flown past or behind the camera
        const depth = PERSPECTIVE_FOV + p.z;
        if (depth <= 60) {
          continue;
        }

        const rawScale = PERSPECTIVE_FOV / depth;
        // Cap maximum scale so particles never explode into giant blocks!
        const scale = Math.min(1.8, Math.max(0.2, rawScale));
        const renderX = centerX + (p.x - centerX) * scale;
        const renderY = centerY + (p.y - centerY) * scale;
        const baseSize = inline ? (isHighIntensity ? 1.22 : 1.1) : 0.8;
        const maxSize = isHighIntensity ? 3.8 : 3.4;
        const renderSize = Math.max(baseSize, Math.min(maxSize, p.size * scale * (isHighIntensity ? 1.08 : 1.0)));

        // Soft edge fade near left boundary instead of sharp rectangular clipping
        let edgeFade = 1;
        const leftLimit = inline ? -30 : (rect.left > 100 ? (rect.left - 20) : 0);
        if (renderX < leftLimit) {
          edgeFade = Math.max(0, 1 - (leftLimit - renderX) / 50);
        }
        if (edgeFade <= 0 || renderX > canvasWidth + 30 || renderY < -30 || renderY > canvasHeight + 30) {
          continue;
        }

        // Smooth assembly fade-in as particles travel from spawn toward target
        let assembleFade = 1;
        if (!p.hasEntered) {
          const dx = (robotX + p.relX) - p.x;
          const dy = (robotY + p.relY) - p.y;
          const dist2D = Math.sqrt(dx * dx + dy * dy);
          assembleFade = Math.min(1, Math.max(0, 1 - dist2D / 260));
        }

        // Apply globalFade so particles dissolve to 0 alpha as they disperse!
        const finalAlpha = Math.max(0, p.baseAlpha * globalFade * edgeFade * assembleFade);
        if (finalAlpha <= 0.01) continue;

        // Highlight particle when lifted forward in Z or excited in Physics & Chemistry
        if (isHighIntensity) {
          const sparkPhase = Math.sin(time * 3.6 + p.seed * 2.4);
          const sparkBoost = sparkPhase > 0.72 ? 0.35 : 0;
          const accentExtra = p.accentRatio > 0 ? 36 : 14;
          const rGlow = Math.min(255, Math.round(p.baseR * (1 + sparkBoost) + accentExtra));
          const gGlow = Math.min(255, Math.round(p.baseG * (1 + sparkBoost) + accentExtra));
          const bGlow = Math.min(255, Math.round(p.baseB * (1 + sparkBoost) + accentExtra + (sparkBoost > 0 ? 25 : 0)));
          ctx.fillStyle = `rgba(${rGlow}, ${gGlow}, ${bGlow}, ${Math.min(1, finalAlpha * 1.18).toFixed(2)})`;
        } else if (p.z < -4) {
          const liftRatio = Math.min(1, Math.abs(p.z) / 45);
          const rGlow = Math.round(p.baseR + (255 - p.baseR) * liftRatio * 0.7);
          const gGlow = Math.round(p.baseG + (255 - p.baseG) * liftRatio * 0.7);
          const bGlow = Math.round(p.baseB + (255 - p.baseB) * liftRatio * 0.7);
          ctx.fillStyle = `rgba(${rGlow}, ${gGlow}, ${bGlow}, ${finalAlpha.toFixed(2)})`;
        } else {
          ctx.fillStyle = `rgba(${p.baseR}, ${p.baseG}, ${p.baseB}, ${finalAlpha.toFixed(2)})`;
        }

        ctx.fillRect(renderX, renderY, renderSize, renderSize);
      }

      // Notify once all particles have settled
      if (activeUnsettled === 0 && !hasNotifiedSettled && particles.length > 0) {
        hasNotifiedSettled = true;
        if (typeof onSettledRef.current === 'function') {
          onSettledRef.current();
        }
      }

      mouse.vx *= 0.8;
      mouse.vy *= 0.8;

      animId = requestAnimationFrame(animate);
    }

    // Start loading and initialization after all functions and event listeners are ready
    let hasLoaded = false;
    const onImageReady = () => {
      if (hasLoaded || !isMounted) return;
      hasLoaded = true;
      initParticles();
      setIsLoaded(true);
      if (!animId) {
        animate();
      }
    };

    const cacheKey = `${src}_${inline ? 'inline' : 'full'}_${width}_${height}_${colorMode}`;
    if (TARGET_CACHE.has(cacheKey)) {
      onImageReady();
    } else {
      img.src = src;
      if (img.complete && (img.naturalWidth || img.width)) {
        onImageReady();
      } else {
        img.onload = onImageReady;
      }
    }

    // In-place particle morphing when src updates without unmounting canvas
    morphToImageRef.current = (newSrc) => {
      const morphImg = new Image();
      morphImg.crossOrigin = 'anonymous';

      const runMorph = () => {
        if (!isMounted) return;
        const targets = sampleFromImage(morphImg);
        if (!targets || targets.length === 0) return;

        const rect = container.getBoundingClientRect();
        const robotX = inline ? (canvasWidth - targetWidth) / 2 : (rect.left + (rect.width - targetWidth) / 2);
        const robotY = inline ? (canvasHeight - targetHeight) / 2 : (rect.top + (rect.height - targetHeight) / 2);

        const existingCount = particles.length;
        const targetCount = targets.length;

        for (let i = 0; i < targetCount; i++) {
          const t = targets[i];
          if (i < existingCount) {
            const p = particles[i];
            p.relX = t.relX;
            p.relY = t.relY;
            p.size = t.size;
            p.color = t.color;
            p.baseR = t.baseR;
            p.baseG = t.baseG;
            p.baseB = t.baseB;
            p.origR = t.origR;
            p.origG = t.origG;
            p.origB = t.origB;
            p.accentRatio = t.accentRatio;
            p.baseAlpha = t.baseAlpha;
            p.hasEntered = true;
            // Soft subtle morphing impulse
            const morphPower = inline ? 1.4 : 3.0;
            p.vx += (Math.random() - 0.5) * morphPower;
            p.vy += (Math.random() - 0.5) * morphPower;
            p.vz += (Math.random() - 0.5) * (inline ? 8 : 18);
          } else {
            const donor = particles[Math.floor(Math.random() * existingCount)] || { x: robotX + t.relX, y: robotY + t.relY, z: 0 };
            particles.push({
              pindex: particles.length,
              relX: t.relX,
              relY: t.relY,
              angle: Math.random() * Math.PI * 2,
              rnd: 0.6 + Math.random() * 1.4,
              x: donor.x + (Math.random() - 0.5) * 12,
              y: donor.y + (Math.random() - 0.5) * 12,
              z: donor.z || 0,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              vz: 0,
              size: t.size,
              color: t.color,
              baseR: t.baseR,
              baseG: t.baseG,
              baseB: t.baseB,
              origR: t.origR,
              origG: t.origG,
              origB: t.origB,
              accentRatio: t.accentRatio,
              baseAlpha: t.baseAlpha,
              entryDelay: 0,
              hasEntered: true,
              introSpeed: inline ? 0.32 : (0.18 + Math.random() * 0.05),
              spring: inline ? 0.095 : (0.085 + Math.random() * 0.02),
              friction: inline ? 0.74 : (0.80 + Math.random() * 0.03),
              floatPower: inline ? 12.0 : (15.0 + Math.random() * 7.0),
              seed: Math.random() * 1000
            });
          }
        }

        if (existingCount > targetCount) {
          for (let i = targetCount; i < existingCount; i++) {
            const fallbackTarget = targets[i % targetCount];
            particles[i].relX = fallbackTarget.relX;
            particles[i].relY = fallbackTarget.relY;
            particles[i].color = fallbackTarget.color;
            particles[i].size = fallbackTarget.size * 0.8;
            particles[i].baseR = fallbackTarget.baseR;
            particles[i].baseG = fallbackTarget.baseG;
            particles[i].baseB = fallbackTarget.baseB;
            particles[i].origR = fallbackTarget.origR;
            particles[i].origG = fallbackTarget.origG;
            particles[i].origB = fallbackTarget.origB;
            particles[i].accentRatio = fallbackTarget.accentRatio;
            particles[i].baseAlpha = fallbackTarget.baseAlpha;
          }
        }
        hasNotifiedSettled = false;
      };

      const cacheKey = `${newSrc}_${inline ? 'inline' : 'full'}_${width}_${height}_${colorMode}_v3`;
      if (TARGET_CACHE.has(cacheKey)) {
        runMorph();
      } else {
        morphImg.src = newSrc;
        if (morphImg.complete && (morphImg.naturalWidth || morphImg.width)) {
          runMorph();
        } else {
          morphImg.onload = runMorph;
        }
      }
    };

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, colorMode]);

  return (
    <div
      ref={containerRef}
      className={`vedika-particle-bot-container ${className}`}
      style={{
        position: 'relative',
        width: inline ? width : '100%',
        height: height,
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={inline ? {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
          opacity: 1
        } : {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: isEntering ? 0 : 1,
          transition: 'opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        title="Vedika Particle Bot"
      />

      {!isLoaded && !inline && (
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          color: '#94A3B8',
          fontSize: 13
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.15)',
            borderTopColor: '#FFFFFF',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Generating Vedika Particles...</span>
        </div>
      )}

      {!isLoaded && inline && (
        <div style={{
          position: 'absolute',
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '2px solid rgba(56, 189, 248, 0.3)',
          borderTopColor: '#38BDF8',
          animation: 'spin 0.8s linear infinite'
        }} />
      )}
    </div>
  );
}
