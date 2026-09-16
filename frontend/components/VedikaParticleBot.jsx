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
  className = ''
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const isEnteringRef = useRef(isEntering);
  isEnteringRef.current = isEntering;

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

    let canvasWidth = window.innerWidth || 1920;
    let canvasHeight = window.innerHeight || 1080;
    let dpr = 1;

    const updateCanvasSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = window.innerWidth || 1920;
      canvasHeight = window.innerHeight || 1080;

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
      const naturalW = sourceImg.naturalWidth || sourceImg.width;
      const naturalH = sourceImg.naturalHeight || sourceImg.height;
      if (!naturalW || !naturalH) return null;

      updateCanvasSize();
      const rect = container.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      const topOffset = Math.max(rect.top > 0 ? rect.top : 70, 64);
      const viewportAvailableHeight = window.innerHeight - topOffset - 24;
      const safeContainerHeight = isMobile
        ? 380
        : Math.min(viewportAvailableHeight > 320 ? viewportAvailableHeight : 560, 560);

      const aspect = naturalW / naturalH;
      const maxAvailableW = isMobile ? window.innerWidth - 32 : (rect.width > 200 ? rect.width - 24 : 560);
      targetHeight = Math.max(10, Math.floor(safeContainerHeight));
      targetWidth = Math.max(10, Math.floor(targetHeight * aspect));

      if (targetWidth > maxAvailableW) {
        targetWidth = Math.max(10, Math.floor(maxAvailableW));
        targetHeight = Math.max(10, Math.floor(targetWidth / aspect));
      }

      const offscreen = document.createElement('canvas');
      offscreen.width = naturalW;
      offscreen.height = naturalH;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return null;

      offCtx.drawImage(sourceImg, 0, 0, naturalW, naturalH);

      let imgData;
      try {
        imgData = offCtx.getImageData(0, 0, naturalW, naturalH);
      } catch (err) {
        console.warn('VedikaParticleBot: getImageData skipped', err);
        return null;
      }

      if (!imgData || !imgData.data) return null;
      const data = imgData.data;

      const scaleX = targetWidth / naturalW;
      const scaleY = targetHeight / naturalH;
      const step = isMobile ? 4 : 3;
      const targets = [];

      for (let y = 0; y < naturalH; y += step) {
        for (let x = 0; x < naturalW; x += step) {
          const idx = (y * naturalW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 36) continue;

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

            if (saturation > 0.18 && maxC > 45) {
              const boost = 1.25;
              baseR = Math.min(255, Math.round(r * boost));
              baseG = Math.min(255, Math.round(g * boost));
              baseB = Math.min(255, Math.round(b * boost));
              baseAlpha = Math.min(1, Math.max(0.78, alphaNorm) * 1.05);
              pSize = 1.60 + Math.random() * 0.35;
            } else if (luminance > 165) {
              baseR = 255;
              baseG = 255;
              baseB = 255;
              baseAlpha = (0.92 + ((luminance - 165) / 90) * 0.08) * alphaNorm;
              pSize = 1.65 + Math.random() * 0.30;
            } else if (luminance > 80) {
              baseR = Math.min(255, Math.round(r * 1.06));
              baseG = Math.min(255, Math.round(g * 1.06));
              baseB = Math.min(255, Math.round(b * 1.12));
              baseAlpha = 0.85 * alphaNorm;
              pSize = 1.40 + Math.random() * 0.25;
            } else {
              baseR = Math.round(r * 1.0);
              baseG = Math.round(g * 1.0);
              baseB = Math.round(b * 1.05);
              baseAlpha = 0.70 * alphaNorm;
              pSize = 1.10 + Math.random() * 0.25;
            }
          } else {
            if (luminance > 165) {
              pSize = 1.60 + Math.random() * 0.30;
              baseR = 255;
              baseG = 255;
              baseB = 255;
              baseAlpha = (0.90 + ((luminance - 165) / 90) * 0.10) * alphaNorm;
            } else if (luminance > 85) {
              pSize = 1.40 + Math.random() * 0.25;
              baseR = 224;
              baseG = 234;
              baseB = 250;
              baseAlpha = 0.82 * alphaNorm;
            } else {
              pSize = 1.05 + Math.random() * 0.25;
              baseR = 130;
              baseG = 145;
              baseB = 172;
              baseAlpha = 0.68 * alphaNorm;
            }
          }

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
            baseAlpha
          });
        }
      }
      return targets;
    }

    function initParticles() {
      const targets = sampleFromImage(img);
      if (!targets || targets.length === 0) return;

      const rect = container.getBoundingClientRect();
      const robotX = rect.left + (rect.width - targetWidth) / 2;
      const robotY = rect.top + (rect.height - targetHeight) / 2;

      const newParticles = [];
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        let spawnX, spawnY, spawnZ;
        const isFrontEntrance = Math.random() < 0.24;

        if (isFrontEntrance) {
          spawnZ = -280 - Math.random() * 200;
          spawnX = robotX + t.relX + (Math.random() - 0.5) * 50;
          spawnY = robotY + t.relY + (Math.random() - 0.5) * 50;
        } else {
          spawnX = canvasWidth + 40 + Math.random() * 280;
          spawnY = robotY + t.relY + (Math.random() - 0.5) * (canvasHeight * 0.55);
          spawnZ = (Math.random() - 0.5) * 60;
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
          baseAlpha: t.baseAlpha,
          entryDelay: Math.floor(Math.random() * 3),
          hasEntered: false,
          introSpeed: 0.18 + Math.random() * 0.05,
          spring: 0.085 + Math.random() * 0.02,
          friction: 0.80 + Math.random() * 0.03,
          floatPower: 15.0 + Math.random() * 7.0,
          seed: Math.random() * 1000
        });
      }

      particles = newParticles;
      isInitialized = true;
    }

    const handlePointerMove = (e) => {
      const newX = e.clientX;
      const newY = e.clientY;

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
      const robotX = rect.left + (rect.width - targetWidth) / 2;
      const robotY = rect.top + (rect.height - targetHeight) / 2;
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
      const cx = e.clientX;
      const cy = e.clientY;

      // Click shockwave ripple: lifts and scatters particles outward along their intrinsic angles
      const shockwaveRadius = 110;
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
      const rect = container.getBoundingClientRect();
      const robotX = rect.left + (rect.width - targetWidth) / 2;
      const robotY = rect.top + (rect.height - targetHeight) / 2;
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

      // Pause rendering if scrolled completely off screen
      if (rect.bottom < -120 || rect.top > window.innerHeight + 120) {
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

      // Current anchor position of robot on screen
      const robotX = rect.left + (rect.width - targetWidth) / 2;
      const robotY = rect.top + (rect.height - targetHeight) / 2;
      const centerX = robotX + targetWidth / 2;
      const centerY = robotY + targetHeight / 2;

      // Update Bruno Imbrizi TouchTexture
      touchTexture.update();
      const touchData = touchTexture.getImageData();

      // If mouse is hovered and stationary, continue adding steady touch point
      if (mouse.isHovered && mouse.x > 0) {
        const uvX = (mouse.x - robotX) / targetWidth;
        const uvY = (mouse.y - robotY) / targetHeight;
        if (uvX >= -0.05 && uvX <= 1.05 && uvY >= -0.05 && uvY <= 1.05) {
          touchTexture.addTouch({ x: uvX, y: uvY });
        }
      }

      let activeUnsettled = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

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
          const noise = Math.sin(time * 1.5 + p.pindex * 0.12) * Math.cos(time * 0.9 + p.seed * 0.1);
          const rndz = p.rnd + noise * 0.55;

          let dispX = 0;
          let dispY = 0;
          let dispZ = 0;

          if (t > 0.005) {
            const floatAmount = t * p.floatPower * rndz;
            dispX = Math.cos(p.angle) * floatAmount;
            dispY = Math.sin(p.angle) * floatAmount;
            dispZ = -t * 36.0 * Math.abs(rndz);
          }

          // Subtle ambient shimmer when idle
          const ambientZ = rndz * 1.8;
          const ambientX = Math.sin(time * 0.9 + p.seed) * 0.22;
          const ambientY = Math.cos(time * 0.7 + p.seed * 1.2) * 0.22;

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
        const renderSize = Math.max(0.4, Math.min(3.2, p.size * scale));

        // Clip out of screen
        if (renderX < -30 || renderX > canvasWidth + 30 || renderY < -30 || renderY > canvasHeight + 30) {
          continue;
        }

        // Apply globalFade so particles dissolve to 0 alpha as they disperse!
        const finalAlpha = Math.max(0, p.baseAlpha * globalFade);
        if (finalAlpha <= 0.01) continue;

        // Highlight particle when lifted forward in Z
        if (p.z < -4) {
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

    img.src = src;
    if (img.complete && (img.naturalWidth || img.width)) {
      onImageReady();
    } else {
      img.onload = onImageReady;
    }

    // In-place particle morphing when src updates without unmounting canvas
    morphToImageRef.current = (newSrc) => {
      const morphImg = new Image();
      morphImg.crossOrigin = 'anonymous';
      morphImg.onload = () => {
        if (!isMounted) return;
        const targets = sampleFromImage(morphImg);
        if (!targets || targets.length === 0) return;

        const rect = container.getBoundingClientRect();
        const robotX = rect.left + (rect.width - targetWidth) / 2;
        const robotY = rect.top + (rect.height - targetHeight) / 2;

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
            p.baseAlpha = t.baseAlpha;
            p.hasEntered = true;
            // Soft morphing impulse
            p.vx += (Math.random() - 0.5) * 3.5;
            p.vy += (Math.random() - 0.5) * 3.5;
            p.vz += (Math.random() - 0.5) * 20;
          } else {
            const donor = particles[Math.floor(Math.random() * existingCount)] || { x: robotX + t.relX, y: robotY + t.relY, z: 0 };
            particles.push({
              pindex: particles.length,
              relX: t.relX,
              relY: t.relY,
              angle: Math.random() * Math.PI * 2,
              rnd: 0.6 + Math.random() * 1.4,
              x: donor.x + (Math.random() - 0.5) * 15,
              y: donor.y + (Math.random() - 0.5) * 15,
              z: donor.z || 0,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              vz: 0,
              size: t.size,
              color: t.color,
              baseR: t.baseR,
              baseG: t.baseG,
              baseB: t.baseB,
              baseAlpha: t.baseAlpha,
              entryDelay: 0,
              hasEntered: true,
              introSpeed: 0.18 + Math.random() * 0.05,
              spring: 0.085 + Math.random() * 0.02,
              friction: 0.80 + Math.random() * 0.03,
              floatPower: 15.0 + Math.random() * 7.0,
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
          }
        }
        hasNotifiedSettled = false;
      };
      morphImg.src = newSrc;
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
        width: '100%',
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
        style={{
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

      {!isLoaded && (
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
    </div>
  );
}
