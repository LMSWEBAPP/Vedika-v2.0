# Dual-Mode Viva & Technical Interview Panel + Kid Particle Animation System

A modular, production-ready UI package extracted from the Vedika AI ecosystem. This package contains the complete **Dual-Mode Split-Screen Panel Design** (Academic Viva & Technical Interview) and the **Interactive Kid Particle Animation System** (Bruno Imbrizi particle physics + video-extracted lip-syncing frames).

---

## 📁 Package Directory Structure

```text
viva-interview-panel-template/
├── README.md                               # Complete architectural specification & usage guide
├── assets/                                 # Character avatars, frames, audio & spritesheets
│   ├── vedika-bot-school.png               # Kid avatar in school uniform (Academic Viva)
│   ├── vedika-bot-suit.png                 # Kid avatar in engineering suit (Technical Interview)
│   ├── vedika-bot.png                      # Standard kid avatar
│   ├── vedika-human-clean.png              # High-res static resting pose
│   ├── vedika-kid-talking-frames.webp      # 240-frame talking sprite sheet
│   ├── vedika-kid-voice.mp3                # Synchronized natural voice sample
│   ├── spritesheet-ironman.png             # Step progress hero sprite
│   ├── spritesheet-batman.png              # Step progress hero sprite
│   ├── spritesheet-superman.png            # Step progress hero sprite
│   └── spritesheet-doctorstrange.png       # Step progress hero sprite
├── components/
│   ├── VivaInterviewPanelLayout.jsx        # Dual-mode sliding 74%/26% split panel template
│   ├── VedikaParticleBot.jsx               # Interactive kid particle canvas (physics & touch trails)
│   └── KidTalkingCanvas.jsx                # Video-extracted lip-syncing talking kid animation
└── styles/
    └── viva-panel.css                      # Standalone styling, transitions, glow rings & breakpoints
```

---

## 🎨 Part 1: The Panel Design Architecture

### 1. Dual-Mode Sliding Split Screen (74% / 26%)

The panel employs an asymmetric, fluidly sliding dual-state container (`.box-container`):

| Mode | Left Area (74% Flex 7) | Right Area (26% Flex 3) | Primary Color | Theme |
| :--- | :--- | :--- | :--- | :--- |
| **Academic Viva** | **`box1-content`**: Oral defense question, candidate speech input, turn indicators | **`box1-side`**: Academic examiner persona, School Kid Particle Bot, mode toggle | `#7C3AED` / `#A855F7` | Neon Violet / Deep Purple |
| **Technical Interview** | **`box2-side`**: Technical interviewer persona, Suit Kid Particle Bot, mode toggle | **`box2-content`**: System architecture prompt, live code scratchpad, trade-off explanation | `#0EA5E9` / `#38BDF8` | Electric Cyan / Sky Blue |

### 2. Smooth State Transition Animation

Switching modes does **not** unmount or destroy DOM elements; instead, it uses hardware-accelerated CSS flex and opacity transitions with a custom cubic bezier curve:

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

/* When .box-container has class .right-open */
.box-container.right-open .box1-content { flex: 0 0 0% !important; opacity: 0; pointer-events: none; }
.box-container.right-open .box1-side    { flex: 0 0 0% !important; opacity: 0; pointer-events: none; }
.box-container.right-open .box2-side    { flex: 3 !important; max-width: 26%; opacity: 1; pointer-events: auto; }
.box-container.right-open .box2-content { flex: 7 !important; max-width: 74%; opacity: 1; pointer-events: auto; }
```

### 3. Responsive Adaptability

- **Desktop (>=960px)**: Asymmetric 74%/26% split view with full interactive particle sidebars.
- **Mobile / Tablet (<960px)**: Sidebars smoothly collapse (`display: none !important`), and the active content panel expands to full 100% width (`flex: 1 !important`) for distraction-free mobile interaction.

---

## ⚡ Part 2: Kid Particle Animation (`VedikaParticleBot.jsx`)

The particle bot transforms any 2D character image into thousands of interactive particles governed by physics:

### 1. Pixel Sampling (`sampleFromImage`)
- Loads the avatar image onto an offscreen HTML5 canvas.
- Scans pixels on a grid determined by `particleStep` (default 2px or 3px).
- Extracts non-transparent pixel positions `(x, y)` and original RGB colors.
- Caches coordinates in a global `TARGET_CACHE` so subsequent visits load with **0ms latency**.

### 2. Bruno Imbrizi `TouchTexture` Heat Trail
- An off-screen $64 \times 64$ canvas records cursor velocity and proximity.
- Each touch point draws a soft radial gradient with an `easeOutSine` decay curve:
  $$\text{intensity} = \sin\left(\left(1 - \frac{\text{age}}{\text{maxAge}}\right) \cdot \frac{\pi}{2}\right)$$
- When the cursor sweeps over the kid avatar, particles accelerate away and float back into position without deforming the silhouette.

### 3. Angular Noise & Shimmering
- Each particle has an intrinsic angle $\theta$ and random speed.
- In the render loop, particles shimmer continuously:
  $$x = x_{\text{origin}} + \cos(\theta) \cdot \sin(t \cdot 0.8) \cdot \text{noise}$$
  $$y = y_{\text{origin}} + \sin(\theta) \cdot \cos(t \cdot 0.8) \cdot \text{noise}$$

### 4. Dynamic Character Morphing
- When the user switches between Academic Viva and Technical Interview, `VedikaParticleBot` smoothly morphs the particles from the School Uniform avatar (`vedika-bot-school.png`) into the Suit avatar (`vedika-bot-suit.png`) using particle interpolation!

---

## 🎬 Part 3: Synchronized Talking Kid Animation (`KidTalkingCanvas.jsx`)

This component delivers the video-frame talking avatar animation:

1. **Sprite Sheet Matrix**:
   - Contains a sequential grid of 240 transparent frames extracted from source video.
   - Frame calculation formula:
     $$\text{progress} = \min\left(1, \frac{\text{elapsedSec}}{\text{durationSec}}\right)$$
     $$\text{frameIndex} = \lfloor \text{progress} \cdot (\text{totalFrames} - 1) \rfloor$$
     $$\text{col} = \text{frameIndex} \pmod{\text{cols}}, \quad \text{row} = \lfloor \text{frameIndex} / \text{cols} \rfloor$$
2. **Audio-Driven Lip Sync**:
   - Tied to `audioRef.current.currentTime` so lip movement matches speech perfectly regardless of device framerate.
3. **Cursor Aperture Flashlight Reveal**:
   - Once dialogue completes, `destination-out` blending turns the cursor into a circular flashlight that cuts through the human layer to reveal underlying graphics.

---

## 🚀 Quick Start Guide (How to Use in Any Project)

### Step 1: Install Peer Dependencies

```bash
npm install lucide-react
```

### Step 2: Copy Files

Copy the `assets/`, `components/`, and `styles/` folders into your new project's `src/` or root directory.

### Step 3: Render the Panel

In any Next.js or React page:

```jsx
'use client';

import VivaInterviewPanelLayout from '@/components/VivaInterviewPanelLayout';

export default function MyExamPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <VivaInterviewPanelLayout
        initialMode="viva"
        onModeChange={(mode) => console.log('Current mode:', mode)}
        onSubmitAnswer={(data) => console.log('Submitted answer:', data)}
      />
    </div>
  );
}
```

### Step 4: Use the Particle Bot Standalone

You can also use `VedikaParticleBot` anywhere in your application:

```jsx
import VedikaParticleBot from '@/components/VedikaParticleBot';

<VedikaParticleBot
  src="/assets/vedika-bot-school.png"
  width={260}
  height={320}
  inline={true}
  colorMode="vibrant"
  particleStep={2}
/>
```
