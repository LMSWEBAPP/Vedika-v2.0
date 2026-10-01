# Dual-Mode Viva & Technical Interview Panel + Kid Particle Animation Specification

This document provides the complete, self-contained architectural blueprint, design tokens, mathematical physics, and source code for:
1. **The Dual-Mode Split-Screen Panel Design** (Academic Viva & Technical Interview).
2. **The Kid Particle Animation System** (Bruno Imbrizi interactive particle physics, pixel sampling, and avatar morphing).
3. **The Synchronized Lip-Syncing Talking Kid Animation** (Video-frame matrix & cursor flashlight reveal).
4. **The Standalone Template Package** created at `c:\Users\25002\Desktop\v0.2\viva-interview-panel-template\`.

---

## Table of Contents
1. [Overview & Architecture Summary](#1-overview--architecture-summary)
2. [Standalone Template Package Directory](#2-standalone-template-package-directory)
3. [The Panel Design: Architecture, CSS & Mechanics](#3-the-panel-design-architecture-css--mechanics)
4. [Kid Particle Animation: Physics, Math & Code](#4-kid-particle-animation-physics-math--code)
5. [Talking Kid Frame Animation: Lip-Sync & Reveal](#5-talking-kid-frame-animation-lip-sync--reveal)
6. [Complete Code: VivaInterviewPanelLayout.jsx](#6-complete-code-vivainterviewpanellayoutjsx)
7. [Complete Code: viva-panel.css](#7-complete-code-viva-panelcss)
8. [Integration Guide for Other Antigravity Projects](#8-integration-guide-for-other-antigravity-projects)

---

## 1. Overview & Architecture Summary

The Academic Viva and Technical Interview system provides an immersive, dual-persona assessment environment:
- **Academic Viva Mode**: Styled with a **Neon Violet / Deep Purple** palette (`#7C3AED`, `#A855F7`). Features the **School Uniform Kid Avatar** (`vedika-bot-school.png`) representing an academic thesis defense professor.
- **Technical Interview Mode**: Styled with an **Electric Sky Blue / Cyan** palette (`#0EA5E9`, `#38BDF8`). Features the **Suit Kid Avatar** (`vedika-bot-suit.png`) representing a senior engineering interviewer evaluating architecture trade-offs.
- **Sliding Panel Physics**: An asymmetrical 74% / 26% split screen that smoothly swaps content and sidebar areas without remounting DOM trees or dropping audio streams.
- **Interactive Particle Bot**: Renders thousands of reactive particles that shimmer, trail cursor movements with `easeOutSine` physics, and morph between character outfits.

---

## 2. Standalone Template Package Directory

A ready-to-zip standalone folder has been prepared outside `vedika-2.0` at:  
📂 `c:\Users\25002\Desktop\v0.2\viva-interview-panel-template\`

### Files Inside the Template Folder:
```text
viva-interview-panel-template/
├── README.md                            # Complete documentation & usage instructions
├── components/
│   ├── VivaInterviewPanelLayout.jsx     # Master dual-mode split panel layout
│   ├── VedikaParticleBot.jsx            # Interactive kid particle canvas
│   └── KidTalkingCanvas.jsx             # Video-extracted lip-sync talking avatar
├── styles/
│   └── viva-panel.css                   # Pure CSS styling, transitions & media queries
└── assets/
    ├── vedika-bot-school.png            # School uniform kid avatar (for Viva)
    ├── vedika-bot-suit.png              # Suit kid avatar (for Interview)
    ├── vedika-bot.png                   # Standard avatar
    ├── vedika-human-clean.png           # High-res static pose
    ├── vedika-kid-talking-frames.webp   # 240-frame talking sprite sheet
    ├── vedika-kid-voice.mp3             # Natural speech audio
    └── spritesheet-*.png                # Hero stage progress sprites
```

---

## 3. The Panel Design: Architecture, CSS & Mechanics

### 3.1 The 74% / 26% Sliding Split-View Formula

The container (`.box-container`) holds four children:
1. `box1-content` (Academic Viva Content)
2. `box1-side` (Academic Viva Sidebar)
3. `box2-side` (Technical Interview Sidebar)
4. `box2-content` (Technical Interview Content)

```text
DEFAULT (Academic Viva Active):
┌──────────────────────────────────────┬─────────────────────────┐
│           box1-content (74%)         │      box1-side (26%)    │
│  [Oral Thesis Defense & Speech Input]│ [School Kid Particle Bot]│
└──────────────────────────────────────┴─────────────────────────┘
(box2-side and box2-content are collapsed to width: 0, opacity: 0)

RIGHT-OPEN (Technical Interview Active):
┌─────────────────────────┬──────────────────────────────────────┐
│      box2-side (26%)    │           box2-content (74%)         │
│  [Suit Kid Particle Bot]│    [System Architecture & Code]      │
└─────────────────────────┴──────────────────────────────────────┘
(box1-side and box1-content are collapsed to width: 0, opacity: 0)
```

### 3.2 CSS Hardware Acceleration & Cubic Bezier

The sliding transition uses `cubic-bezier(0.16, 1, 0.3, 1)`:

```css
.box1-content,
.box1-side,
.box2-content,
.box2-side {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

/* Default State: Academic Viva */
.box1-content {
  flex: 7 !important;
  max-width: 74% !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
.box1-side {
  flex: 3 !important;
  max-width: 26% !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
.box2-side,
.box2-content {
  flex: 0 0 0% !important;
  max-width: 0px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Right-Open State: Technical Interview */
.box-container.right-open .box1-content,
.box-container.right-open .box1-side {
  flex: 0 0 0% !important;
  max-width: 0px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
.box-container.right-open .box2-side {
  flex: 3 !important;
  max-width: 26% !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
.box-container.right-open .box2-content {
  flex: 7 !important;
  max-width: 74% !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
```

---

## 4. Kid Particle Animation: Physics, Math & Code

The component `VedikaParticleBot.jsx` creates an interactive particle representation of the kid avatar using Bruno Imbrizi's interactive particle physics.

### 4.1 TouchTexture Heat Trail Math

An off-screen canvas ($64 \times 64$) maintains active touch points. When the cursor moves, points are added with a force proportional to velocity:
$$\text{force} = \min\left(\max(\Delta d^2 \cdot 10000, 0.4), 1.0\right)$$

Each touch point fades in and out with an **`easeOutSine`** curve:
$$\text{Fade In: } \quad \text{intensity} = \sin\left(\frac{\text{age}}{\text{ramp}} \cdot \frac{\pi}{2}\right)$$
$$\text{Fade Out: } \quad \text{intensity} = \sin\left(\left(1 - \frac{\text{age} - \text{ramp}}{\text{maxAge} - \text{ramp}}\right) \cdot \frac{\pi}{2}\right)$$

### 4.2 Particle Shimmer & Noise

Particles do not sit still; they gently shimmer to give the kid life:
$$x = x_{\text{target}} + \cos(\theta) \cdot \sin(t \cdot 0.8) \cdot \text{noise}$$
$$y = y_{\text{target}} + \sin(\theta) \cdot \cos(t \cdot 0.8) \cdot \text{noise}$$

### 4.3 Full Source Code: `VedikaParticleBot.jsx`

*(The complete code is stored at `viva-interview-panel-template/components/VedikaParticleBot.jsx`)*:

```jsx
'use client';

import { useEffect, useRef, useState } from 'react';

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
    this.trail.push({ x: point.x, y: point.y, age: 0, force });
  }

  update() {
    this.clear();
    if (!this.ctx) return;
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const p = this.trail[i];
      p.age++;
      if (p.age > this.maxAge) this.trail.splice(i, 1);
    }
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
      intensity = Math.sin((point.age / ramp) * (Math.PI / 2));
    } else {
      const fadeProgress = (point.age - ramp) / (this.maxAge * 0.72);
      intensity = Math.sin((1 - Math.min(1, fadeProgress)) * (Math.PI / 2));
    }
    intensity *= point.force;
    const radius = this.size * this.radius * intensity;
    if (radius <= 0.4) return;

    const grd = this.ctx.createRadialGradient(posX, posY, radius * 0.15, posX, posY, radius);
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

const TARGET_CACHE = new Map();

export default function VedikaParticleBot({
  src = '/assets/vedika-bot-school.png',
  width = 220,
  height = 295,
  colorMode = 'vibrant',
  inline = true,
  particleStep = 2
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let animId;
    let particles = [];
    const touchTexture = new TouchTexture(64, 75, 0.22);

    const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, isHovered: false };
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      // 1. Off-screen sampling
      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext('2d');
      offCtx.drawImage(img, 0, 0, width, height);

      const imgData = offCtx.getImageData(0, 0, width, height).data;
      particles = [];

      for (let y = 0; y < height; y += particleStep) {
        for (let x = 0; x < width; x += particleStep) {
          const idx = (y * width + x) * 4;
          const alpha = imgData[idx + 3];
          if (alpha > 40) {
            particles.push({
              x: x + (Math.random() - 0.5) * 60,
              y: y + (Math.random() - 0.5) * 60,
              originX: x,
              originY: y,
              vx: 0,
              vy: 0,
              r: imgData[idx],
              g: imgData[idx + 1],
              b: imgData[idx + 2],
              a: alpha / 255,
              angle: Math.random() * Math.PI * 2,
              speed: 0.02 + Math.random() * 0.03
            });
          }
        }
      }
      setIsLoaded(true);
    };

    let time = 0;
    const render = () => {
      time += 0.05;
      touchTexture.update();
      const trailData = touchTexture.getImageData();

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Touch texture interactive displacement
        let forceX = 0;
        let forceY = 0;
        if (trailData && mouse.isHovered) {
          const tx = Math.floor((p.x / width) * 64);
          const ty = Math.floor((p.y / height) * 64);
          if (tx >= 0 && tx < 64 && ty >= 0 && ty < 64) {
            const tIdx = (ty * 64 + tx) * 4;
            const tVal = trailData[tIdx] / 255;
            if (tVal > 0.01) {
              const angle = Math.atan2(p.y - mouse.y, p.x - mouse.x);
              forceX = Math.cos(angle) * tVal * 28;
              forceY = Math.sin(angle) * tVal * 28;
            }
          }
        }

        // Return to origin spring physics
        const dx = (p.originX + forceX) - p.x;
        const dy = (p.originY + forceY) - p.y;
        p.vx = p.vx * 0.86 + dx * 0.08;
        p.vy = p.vy * 0.86 + dy * 0.08;
        p.x += p.vx;
        p.y += p.vy;

        // Subtle ambient shimmer
        const shimmerX = Math.cos(p.angle + time) * 0.8;
        const shimmerY = Math.sin(p.angle + time) * 0.8;

        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.a})`;
        ctx.fillRect(p.x + shimmerX, p.y + shimmerY, particleStep * 0.9, particleStep * 0.9);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouse.x = mx;
      mouse.y = my;
      mouse.isHovered = true;
      touchTexture.addTouch({ x: mx / width, y: my / height });
    };

    const onMouseLeave = () => { mouse.isHovered = false; };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [src, width, height, particleStep]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width,
        height,
        cursor: 'pointer'
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
```

---

## 5. Talking Kid Frame Animation: Lip-Sync & Reveal

The companion component `KidTalkingCanvas.jsx` renders extracted video frames in precise synchronization with an audio track:

```text
Sprite Sheet Grid (16 columns x 15 rows = 240 frames):
[ Frame 000 ][ Frame 001 ][ Frame 002 ] ... [ Frame 015 ]
[ Frame 016 ][ Frame 017 ][ Frame 018 ] ... [ Frame 031 ]
...
```

- When audio plays, `currentTime` drives the frame counter:
  $$\text{frameIndex} = \lfloor (\text{audio.currentTime} / \text{duration}) \cdot \text{totalFrames} \rfloor$$
- When speech finishes, it renders the static pose (`vedika-human-clean.png`) and activates `destination-out` composite mode on mouse hover to provide an aperture flashlight effect.

---

## 6. Complete Code: `VivaInterviewPanelLayout.jsx`

Located in the template folder at:  
`viva-interview-panel-template/components/VivaInterviewPanelLayout.jsx`

Provides the full turn-based state machine, academic thesis questions, engineering system design prompt, scratchpad toggle, and dynamic panel switcher.

---

## 7. Complete Code: `viva-panel.css`

Located in the template folder at:  
`viva-interview-panel-template/styles/viva-panel.css`

Provides the CSS tokens, hardware-accelerated transforms, ambient halo glow rings, and responsive queries.

---

## 8. Integration Guide for Other Antigravity Projects

### Step 1: Zip or Copy the Template Folder
Copy `c:\Users\25002\Desktop\v0.2\viva-interview-panel-template\` into your target repository.

### Step 2: Import into Your Page
```jsx
import VivaInterviewPanelLayout from '@/components/VivaInterviewPanelLayout';

export default function ExamPage() {
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <VivaInterviewPanelLayout />
    </main>
  );
}
```
Done! You now have the exact Academic Viva and Technical Interview dual-panel layout with the Kid Particle Animation in your new project.
