'use client';

import React, { useRef, useEffect } from 'react';

/**
 * FeralUIFlowCanvas - Official FeralUI "Flow" WebGL & Canvas Engine
 * 
 * Recreates the exact shader & math of FeralUI's "Fluid. ALWAYS IN MOTION":
 * - Supports presets:
 *   - 'aurora': FeralUI Aurora Palette (Frost Mint #EAFFF4, Emerald #4BE8A0, Teal #2E7A6A, Cyan #2E6E80, Midnight #16224D)
 *   - 'glacier': FeralUI Glacier Palette (Deep Hanada #183F60, Inked Lapis #277EA3, Clear Hanada #65BED0, Sky Haze #B9E3DF, Pale Matcha #EAF4E6)
 *   - 'pastel': FeralUI Opal Palette (Pearl White #F6F9FF, Ice Cyan #9BE0E8, Wisteria Lavender #C4B5F7, Sakura Pink #F8B8D9, Soft Lilac #FAF7FD)
 * - 60 FPS active real-time fluid flow with continuous wave distortion & vortex swirl.
 * - 100% bright and radiant, zero black fade/vignette.
 */

export const PRESETS = {
  aurora: {
    name: 'Aurora Flow (Ghost light)',
    baseColor: '#232E4A',
    stops: [
      [244 / 255, 248 / 255, 255 / 255], // #F4F8FF Lightest burning lower border
      [191 / 255, 212 / 255, 238 / 255], // #BFD4EE Ray glow soft ice blue
      [92 / 255, 116 / 255, 154 / 255],  // #5C749A Horizon pool / border fringe
      [35 / 255, 46 / 255, 74 / 255],    // #232E4A Darkest night navy flood
      [22 / 255, 30 / 255, 52 / 255]     // #161E34 Deep midnight
    ],
    rgbStops: [
      [244, 248, 255],
      [191, 212, 238],
      [92, 116, 154],
      [35, 46, 74],
      [22, 30, 52]
    ]
  },
  glacier: {
    name: 'Glacier Flow',
    baseColor: '#183F60',
    stops: [
      [24 / 255, 63 / 255, 96 / 255],     // #183F60 Deep Hanada
      [39 / 255, 126 / 255, 163 / 255],  // #277EA3 Inked Lapis
      [101 / 255, 190 / 255, 208 / 255], // #65BED0 Clear Hanada
      [185 / 255, 227 / 255, 223 / 255], // #B9E3DF Sky Haze
      [234 / 255, 244 / 255, 230 / 255]  // #EAF4E6 Pale Matcha
    ],
    rgbStops: [
      [24, 63, 96],
      [39, 126, 163],
      [101, 190, 208],
      [185, 227, 223],
      [234, 244, 230]
    ]
  },
  pastel: {
    name: 'Pastel Flow',
    baseColor: '#FAF7FD',
    speed: 0.28,
    stops: [
      [248 / 255, 250 / 255, 252 / 255], // #F8FAFC Luminous Pearl White
      [56 / 255, 189 / 255, 248 / 255],  // #38BDF8 Radiant Ice Aqua
      [168 / 255, 85 / 255, 247 / 255],  // #A855F7 Velvet Wisteria Lavender
      [251 / 255, 113 / 255, 133 / 255], // #FB7185 Vibrant Sakura Coral
      [237 / 255, 233 / 255, 254 / 255]  // #EDE9FE Soft Lilac Mist
    ],
    rgbStops: [
      [248, 250, 252],
      [56, 189, 248],
      [168, 85, 247],
      [251, 113, 133],
      [237, 233, 254]
    ]
  }
};

const VS_SRC = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FS_SRC = `
  precision highp float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform float u_is_aurora;
  uniform float u_preset;
  uniform float u_speed;

  uniform vec3 u_c0;
  uniform vec3 u_c1;
  uniform vec3 u_c2;
  uniform vec3 u_c3;
  uniform vec3 u_c4;

  float smoothG1(float val) {
    float clamped = clamp(val, 0.0, 1.0);
    return clamped * clamped * (3.0 - 2.0 * clamped);
  }

  vec2 getOrbitalPos(float idx, float t, float isPastel) {
    float n = idx * 0.37;
    float n2_1 = fract(idx / 3.0);
    float o = isPastel > 0.5 ? (0.32 + n2_1 * 0.32) : (0.22 + n2_1 * 0.25);
    float n2_2 = fract((idx + 1.0) / 4.0);
    float i = isPastel > 0.5 ? (0.35 + n2_2 * 0.35) : (0.26 + n2_2 * 0.28);
    return vec2(
      0.5 + 0.5 * sin(t * o + n),
      0.5 + 0.5 * cos(t * i + n * 1.5)
    );
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_res.xy;
    st.y = 1.0 - st.y;

    if (u_is_aurora > 0.5) {
      // FeralUI Aurora "Ghost light" curtain & ray engine
      // Scale: 51%, Fold (distortion): 45%, Swirl: 18%, Dir: 2 (vertical curtain)
      // Tuned to calm, silky, slower ambient flow
      float t = u_time * 0.12 + 20.75;
      
      // Undulating arch trajectory across the sky
      float w1 = sin(st.x * 2.2 + t * 0.22) * 0.10;
      float w2 = cos(st.x * 4.2 - t * 0.14) * 0.05;
      float w3 = sin(st.x * 6.8 + t * 0.28) * 0.02;
      float archY = 0.38 + w1 + w2 + w3;
      
      // Vertical curtain ray streaks (aurora rays cascading downwards gently)
      float ray1 = sin(st.x * 24.0 + sin(st.y * 9.0 + t * 0.35) * 1.8 + t * 0.38);
      float ray2 = cos(st.x * 48.0 - t * 0.45);
      float rayInt = pow(clamp(ray1 * 0.5 + 0.5, 0.0, 1.0), 2.2) * 0.65 + 
                     pow(clamp(ray2 * 0.5 + 0.5, 0.0, 1.0), 2.8) * 0.35;
                     
      // Distance from the arch's burning lower border
      float dY = st.y - archY;
      
      // Curtain envelope cascading downwards from arch
      float curtainDown = smoothstep(0.48, -0.02, dY);
      float curtainUp = smoothstep(-0.22, 0.02, dY);
      float curtain = curtainDown * curtainUp;
      
      // The burning lower rim (lightest crisp white #F4F8FF)
      float rimGlow = exp(-abs(dY) * 36.0);
      
      // Soft ray glow trailing vertically (#BFD4EE)
      float rayGlow = curtain * (0.35 + 0.65 * rayInt);
      
      // Horizon pooling in the middle/lower sky (#5C749A)
      float horizonPool = smoothstep(-0.05, 0.45, st.y) * smoothstep(0.88, 0.35, st.y) * 0.55;
      
      // Stage the four Ghost light tones:
      vec3 col = u_c3;
      col = mix(col, u_c2, clamp(horizonPool + rayGlow * 0.35, 0.0, 1.0));
      col = mix(col, u_c1, clamp(rayGlow * 0.85, 0.0, 1.0));
      col = mix(col, u_c0, clamp(rimGlow * 1.25 + rayGlow * rayInt * 0.3, 0.0, 1.0));

      gl_FragColor = vec4(col, 1.0);
      return;
    }

    // FeralUI Flow (Glacier / Pastel) parameters
    float isPastel = (u_preset > 0.5 && u_preset < 1.5) ? 1.0 : 0.0;
    float scale = 0.4 + (52.0 / 100.0) * 1.2;
    float distortion = isPastel > 0.5 ? (45.0 / 100.0) : (38.0 / 100.0);
    float swirl = isPastel > 0.5 ? (9.0 / 100.0) : (6.0 / 100.0);
    
    // Dynamic time clock with preset speed: Pastel flows at 0.38 (calm, silky, smooth), Glacier at 0.30
    float speed = u_speed > 0.0 ? u_speed : (isPastel > 0.5 ? 0.38 : 0.30);
    float t_clock = u_time * speed + 20.75;

    vec2 p = (st - 0.5) / scale + 0.5;
    float dist = length(p - 0.5);
    float j = smoothG1(dist);
    float b = 1.0 - j;

    // Dual-wave fluid undulation (FeralUI exact math)
    for (float z = 1.0; z <= 2.0; z += 1.0) {
      p.x += (distortion * b / z) * sin(t_clock + z * 0.4 * smoothG1(p.y)) * cos(0.2 * t_clock + z * 2.4 * smoothG1(p.y));
      p.y += (distortion * b / z) * cos(t_clock + z * 2.0 * smoothG1(p.x));
    }

    // Pastel ripple harmonics: adds gentle, silky fluid folds
    if (isPastel > 0.5) {
      p.x += sin(p.y * 3.0 + t_clock * 0.45) * 0.04 + cos(p.x * 2.2 - t_clock * 0.3) * 0.03;
      p.y += cos(p.x * 2.6 + t_clock * 0.4) * 0.04 + sin(p.y * 2.2 - t_clock * 0.35) * 0.03;
    }

    // Vortex swirl transform around core
    float L = 3.0 * swirl * j;
    float cosL = cos(-L);
    float sinL = sin(-L);
    vec2 c_pos = p - 0.5;
    p = vec2(
      cosL * c_pos.x - sinL * c_pos.y,
      sinL * c_pos.x + cosL * c_pos.y
    ) + 0.5;

    // 5 orbital spot positions
    vec2 f0 = getOrbitalPos(0.0, t_clock, isPastel);
    vec2 f1 = getOrbitalPos(1.0, t_clock, isPastel);
    vec2 f2 = getOrbitalPos(2.0, t_clock, isPastel);
    vec2 f3 = getOrbitalPos(3.0, t_clock, isPastel);
    vec2 f4 = getOrbitalPos(4.0, t_clock, isPastel);

    // Inverse distance weighting (FeralUI xd=3.5)
    float d0 = dot(p - f0, p - f0);
    float d1 = dot(p - f1, p - f1);
    float d2 = dot(p - f2, p - f2);
    float d3 = dot(p - f3, p - f3);
    float d4 = dot(p - f4, p - f4);

    float w0 = 1.0 / (pow(d0, 1.75) + 0.0001);
    float w1 = 1.0 / (pow(d1, 1.75) + 0.0001);
    float w2 = 1.0 / (pow(d2, 1.75) + 0.0001);
    float w3 = 1.0 / (pow(d3, 1.75) + 0.0001);
    float w4 = 1.0 / (pow(d4, 1.75) + 0.0001);

    float totalWeight = w0 + w1 + w2 + w3 + w4;
    vec3 color = (u_c0 * w0 + u_c1 * w1 + u_c2 * w2 + u_c3 * w3 + u_c4 * w4) / max(0.0001, totalWeight);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const FeralUIFlowCanvas = React.memo(function FeralUIFlowCanvas({ variant = 'aurora' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const variantRef = useRef(variant);

  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = null;
    let startTime = performance.now();

    // Check WebGL support on a disposable test canvas
    const testCanvas = document.createElement('canvas');
    let hasWebGL = false;
    let gl = null;

    try {
      const testGl = testCanvas.getContext('webgl', { powerPreference: 'high-performance' });
      if (testGl) {
        hasWebGL = true;
      }
    } catch {
      hasWebGL = false;
    }

    if (hasWebGL) {
      gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance'
      });
      if (!gl) hasWebGL = false;
    }

    // Resize canvas buffer
    const updateSize = () => {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      // Use 1x DPR or max 1.25x for fluid 60fps
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const bufferW = Math.round(w * dpr);
      const bufferH = Math.round(h * dpr);

      if (canvas.width !== bufferW || canvas.height !== bufferH) {
        canvas.width = bufferW;
        canvas.height = bufferH;
        if (gl) {
          gl.viewport(0, 0, bufferW, bufferH);
        }
      }
    };

    updateSize();

    if (hasWebGL && gl) {
      // Setup WebGL Shader Program
      const createShader = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.warn('[FeralUIFlow] Shader error:', gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      };

      const vs = createShader(gl.VERTEX_SHADER, VS_SRC);
      const fs = createShader(gl.FRAGMENT_SHADER, FS_SRC);

      if (vs && fs) {
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);

        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          gl.useProgram(prog);

          // Geometry quad
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
              -1, -1,
               1, -1,
              -1,  1,
              -1,  1,
               1, -1,
               1,  1
            ]),
            gl.STATIC_DRAW
          );

          const aPos = gl.getAttribLocation(prog, 'a_pos');
          gl.enableVertexAttribArray(aPos);
          gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

          const uRes = gl.getUniformLocation(prog, 'u_res');
          const uTime = gl.getUniformLocation(prog, 'u_time');
          const uIsAurora = gl.getUniformLocation(prog, 'u_is_aurora');
          const uPreset = gl.getUniformLocation(prog, 'u_preset');
          const uSpeed = gl.getUniformLocation(prog, 'u_speed');
          const uC0 = gl.getUniformLocation(prog, 'u_c0');
          const uC1 = gl.getUniformLocation(prog, 'u_c1');
          const uC2 = gl.getUniformLocation(prog, 'u_c2');
          const uC3 = gl.getUniformLocation(prog, 'u_c3');
          const uC4 = gl.getUniformLocation(prog, 'u_c4');

          let lastAppliedPreset = null;

          const applyColors = (activePreset) => {
            const config = PRESETS[activePreset] || PRESETS.aurora;
            const isAurora = activePreset === 'aurora' ? 1.0 : 0.0;
            const presetId = activePreset === 'pastel' ? 1.0 : (activePreset === 'glacier' ? 0.0 : 2.0);
            const speed = config.speed || (activePreset === 'pastel' ? 0.28 : (activePreset === 'glacier' ? 0.22 : 0.12));
            gl.uniform1f(uIsAurora, isAurora);
            if (uPreset) gl.uniform1f(uPreset, presetId);
            if (uSpeed) gl.uniform1f(uSpeed, speed);
            gl.uniform3fv(uC0, config.stops[0]);
            gl.uniform3fv(uC1, config.stops[1]);
            gl.uniform3fv(uC2, config.stops[2]);
            gl.uniform3fv(uC3, config.stops[3]);
            gl.uniform3fv(uC4, config.stops[4]);
            lastAppliedPreset = activePreset;
          };

          const renderGL = (now) => {
            const currentPreset = PRESETS[variantRef.current] ? variantRef.current : 'aurora';
            if (currentPreset !== lastAppliedPreset) {
              applyColors(currentPreset);
            }

            const w = canvas.width;
            const h = canvas.height;
            if (w > 0 && h > 0) {
              gl.viewport(0, 0, w, h);
              gl.uniform2f(uRes, w, h);
              gl.uniform1f(uTime, (now - startTime) / 1000);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            animId = requestAnimationFrame(renderGL);
          };

          animId = requestAnimationFrame(renderGL);
        }
      }
    } else {
      // 2D Canvas Fallback
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const offscreen = document.createElement('canvas');
        const offW = 160;
        const offH = 90;
        offscreen.width = offW;
        offscreen.height = offH;
        const offCtx = offscreen.getContext('2d');

        const render2D = (now) => {
          const currentPreset = PRESETS[variantRef.current] ? variantRef.current : 'aurora';
          const config = PRESETS[currentPreset] || PRESETS.aurora;
          const rgbStops = config.rgbStops;

          const imgData = offCtx.createImageData(offW, offH);
          const pixels = imgData.data;

          if (currentPreset === 'aurora') {
            const t = ((now - startTime) / 1000) * 0.12 + 20.75;
            let ptr = 0;
            for (let y = 0; y < offH; y++) {
              const py = (y + 0.5) / offH;
              for (let x = 0; x < offW; x++) {
                const px = (x + 0.5) / offW;
                const archY = 0.38 + Math.sin(px * 2.2 + t * 0.22) * 0.10 + Math.cos(px * 4.2 - t * 0.14) * 0.05;
                const dY = py - archY;
                const ray1 = Math.sin(px * 24.0 + Math.sin(py * 9.0 + t * 0.35) * 1.8 + t * 0.38);
                const rayInt = Math.pow(Math.max(0, ray1 * 0.5 + 0.5), 2.2);
                const curtain = Math.max(0, Math.min(1, (0.48 - dY) / 0.5)) * Math.max(0, Math.min(1, (dY + 0.22) / 0.24));
                const rim = Math.exp(-Math.abs(dY) * 36.0);
                const rayGlow = curtain * (0.35 + 0.65 * rayInt);
                const pool = Math.max(0, Math.min(1, (py + 0.05) / 0.5)) * Math.max(0, Math.min(1, (0.88 - py) / 0.53)) * 0.55;

                const c0 = rgbStops[0], c1 = rgbStops[1], c2 = rgbStops[2], c3 = rgbStops[3];
                let r = c3[0], g = c3[1], b = c3[2];
                const m2 = Math.min(1, pool + rayGlow * 0.35);
                r = r * (1 - m2) + c2[0] * m2;
                g = g * (1 - m2) + c2[0] * m2;
                b = b * (1 - m2) + c2[2] * m2;
                const m1 = Math.min(1, rayGlow * 0.85);
                r = r * (1 - m1) + c1[0] * m1;
                g = g * (1 - m1) + c1[1] * m1;
                b = b * (1 - m1) + c1[2] * m1;
                const m0 = Math.min(1, rim * 1.25 + rayGlow * rayInt * 0.3);
                r = r * (1 - m0) + c0[0] * m0;
                g = g * (1 - m0) + c0[1] * m0;
                b = b * (1 - m0) + c0[2] * m0;

                pixels[ptr++] = Math.round(r);
                pixels[ptr++] = Math.round(g);
                pixels[ptr++] = Math.round(b);
                pixels[ptr++] = 255;
              }
            }
          } else {
            const isPastel = currentPreset === 'pastel';
            const speed = config.speed || (isPastel ? 0.28 : 0.22);
            const t_clock = ((now - startTime) / 1000) * speed + 20.75;
            const getOrbital = (idx) => {
              const n = idx * 0.37;
              const o = isPastel ? (0.32 + ((idx / 3.0) % 1) * 0.32) : (0.22 + ((idx / 3.0) % 1) * 0.25);
              const i = isPastel ? (0.35 + (((idx + 1.0) / 4.0) % 1) * 0.35) : (0.26 + (((idx + 1.0) / 4.0) % 1) * 0.28);
              return [
                0.5 + 0.5 * Math.sin(t_clock * o + n),
                0.5 + 0.5 * Math.cos(t_clock * i + n * 1.5)
              ];
            };

            const f0 = getOrbital(0);
            const f1 = getOrbital(1);
            const f2 = getOrbital(2);
            const f3 = getOrbital(3);
            const f4 = getOrbital(4);

            let ptr = 0;
            for (let y = 0; y < offH; y++) {
              const py = (y + 0.5) / offH;
              for (let x = 0; x < offW; x++) {
                let px = (x + 0.5) / offW;
                let pyAdj = py;
                if (isPastel) {
                  px += Math.sin(py * 3.6 + t_clock * 0.85) * 0.04;
                  pyAdj += Math.cos(px * 3.2 + t_clock * 0.75) * 0.04;
                }
                const d0 = (px - f0[0]) ** 2 + (pyAdj - f0[1]) ** 2;
                const d1 = (px - f1[0]) ** 2 + (pyAdj - f1[1]) ** 2;
                const d2 = (px - f2[0]) ** 2 + (pyAdj - f2[1]) ** 2;
                const d3 = (px - f3[0]) ** 2 + (pyAdj - f3[1]) ** 2;
                const d4 = (px - f4[0]) ** 2 + (pyAdj - f4[1]) ** 2;

                const w0 = 1 / ((d0 ** 1.75) + 0.0001);
                const w1 = 1 / ((d1 ** 1.75) + 0.0001);
                const w2 = 1 / ((d2 ** 1.75) + 0.0001);
                const w3 = 1 / ((d3 ** 1.75) + 0.0001);
                const w4 = 1 / ((d4 ** 1.75) + 0.0001);
                const sum = w0 + w1 + w2 + w3 + w4;

                pixels[ptr++] = Math.round((rgbStops[0][0] * w0 + rgbStops[1][0] * w1 + rgbStops[2][0] * w2 + rgbStops[3][0] * w3 + rgbStops[4][0] * w4) / sum);
                pixels[ptr++] = Math.round((rgbStops[0][1] * w0 + rgbStops[1][1] * w1 + rgbStops[2][1] * w2 + rgbStops[3][1] * w3 + rgbStops[4][1] * w4) / sum);
                pixels[ptr++] = Math.round((rgbStops[0][2] * w0 + rgbStops[1][2] * w1 + rgbStops[2][2] * w2 + rgbStops[3][2] * w3 + rgbStops[4][2] * w4) / sum);
                pixels[ptr++] = 255;
              }
            }
          }

          offCtx.putImageData(imgData, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);

          animId = requestAnimationFrame(render2D);
        };

        animId = requestAnimationFrame(render2D);
      }
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
});

export default FeralUIFlowCanvas;
