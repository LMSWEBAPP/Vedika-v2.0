'use client';

import React, { useRef, useEffect } from 'react';

/**
 * FeralUIFlowCanvas - Official FeralUI "Flow" (Opal Preset) WebGL & Canvas Engine
 * 
 * Recreates the exact shader & math of FeralUI's "Fluid. ALWAYS IN MOTION":
 * - Stops: ["#F6F9FF", "#9BE0E8", "#C4B5F7", "#F8B8D9"]
 * - Parameters: scale: 52, distortion: 46, swirl: 8
 * - Real-time 60 FPS GPU-accelerated fluid flow
 * - 100% bright and radiant - zero black fade or dark shading.
 */

// Preset RGB color stops (normalized 0..1 for WebGL shader)
const STOPS = [
  [0.965, 0.976, 1.0],    // #F6F9FF Pearl White
  [0.608, 0.878, 0.910],  // #9BE0E8 Ice Aqua Cyan
  [0.769, 0.710, 0.969],  // #C4B5F7 Wisteria Lavender
  [0.973, 0.722, 0.851]   // #F8B8D9 Sakura Blush Pink
];

const VS_SOURCE = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FS_SOURCE = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;

  uniform vec3 u_c0;
  uniform vec3 u_c1;
  uniform vec3 u_c2;
  uniform vec3 u_c3;

  float smoothG1(float e) {
    float t = clamp(e, 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  vec2 getPos(float idx, float t) {
    float n = idx * 0.37;
    float n2_1 = fract(idx / 3.0);
    float o = 0.6 + n2_1 * 0.9;
    float n2_2 = fract((idx + 1.0) / 4.0);
    float i = 0.8 + n2_2;
    return vec2(
      0.5 + 0.5 * sin(t * o + n),
      0.5 + 0.5 * cos(t * i + n * 1.5)
    );
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.y = 1.0 - st.y;

    float scale = 0.4 + (52.0 / 100.0) * 1.2;
    float distortion = 46.0 / 100.0;
    float swirl = 8.0 / 100.0;
    float t_clock = u_time * 0.45 + 20.75;

    vec2 p = (st - 0.5) / scale + 0.5;
    float distToCenter = length(p - 0.5);
    float j = smoothG1(distToCenter);
    float b = 1.0 - j;

    // Dual-frequency wave distortion
    p.x += (distortion * b) * sin(t_clock + 0.4 * smoothG1(p.y)) * cos(0.2 * t_clock + 2.4 * smoothG1(p.y));
    p.y += (distortion * b) * cos(t_clock + 2.0 * smoothG1(p.x));
    
    p.x += (distortion * b * 0.5) * sin(t_clock + 0.8 * smoothG1(p.y)) * cos(0.2 * t_clock + 4.8 * smoothG1(p.y));
    p.y += (distortion * b * 0.5) * cos(t_clock + 4.0 * smoothG1(p.x));

    // Vortex Swirl
    float L = 3.0 * swirl * j;
    float cosL = cos(-L);
    float sinL = sin(-L);
    vec2 centered = p - 0.5;
    p = vec2(
      cosL * centered.x - sinL * centered.y,
      sinL * centered.x + cosL * centered.y
    ) + 0.5;

    // Orbital spot positions
    vec2 f0 = getPos(0.0, t_clock);
    vec2 f1 = getPos(1.0, t_clock);
    vec2 f2 = getPos(2.0, t_clock);
    vec2 f3 = getPos(3.0, t_clock);

    float k0 = dot(p - f0, p - f0);
    float k1 = dot(p - f1, p - f1);
    float k2 = dot(p - f2, p - f2);
    float k3 = dot(p - f3, p - f3);

    float w0 = 1.0 / (pow(k0, 1.75) + 0.0001);
    float w1 = 1.0 / (pow(k1, 1.75) + 0.0001);
    float w2 = 1.0 / (pow(k2, 1.75) + 0.0001);
    float w3 = 1.0 / (pow(k3, 1.75) + 0.0001);

    float totalW = w0 + w1 + w2 + w3;
    vec3 color = (u_c0 * w0 + u_c1 * w1 + u_c2 * w2 + u_c3 * w3) / max(0.0001, totalW);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function FeralUIFlowCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl = canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'high-performance' });
    let isWebGL = !!gl;

    let animId;
    let startTime = performance.now();

    if (isWebGL) {
      // Compile WebGL
      const createShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.warn(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, VS_SOURCE);
      const fs = createShader(gl.FRAGMENT_SHADER, FS_SOURCE);
      if (!vs || !fs) {
        isWebGL = false;
      } else {
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          isWebGL = false;
        } else {
          gl.useProgram(program);

          // Fullscreen quad
          const posBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
          ]), gl.STATIC_DRAW);

          const aPos = gl.getAttribLocation(program, 'a_position');
          gl.enableVertexAttribArray(aPos);
          gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

          const uRes = gl.getUniformLocation(program, 'u_resolution');
          const uTime = gl.getUniformLocation(program, 'u_time');
          const uC0 = gl.getUniformLocation(program, 'u_c0');
          const uC1 = gl.getUniformLocation(program, 'u_c1');
          const uC2 = gl.getUniformLocation(program, 'u_c2');
          const uC3 = gl.getUniformLocation(program, 'u_c3');

          gl.uniform3fv(uC0, STOPS[0]);
          gl.uniform3fv(uC1, STOPS[1]);
          gl.uniform3fv(uC2, STOPS[2]);
          gl.uniform3fv(uC3, STOPS[3]);

          const render = (now) => {
            const width = canvas.width;
            const height = canvas.height;
            if (width > 0 && height > 0) {
              gl.viewport(0, 0, width, height);
              gl.uniform2f(uRes, width, height);
              gl.uniform1f(uTime, (now - startTime) / 1000);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            animId = requestAnimationFrame(render);
          };

          animId = requestAnimationFrame(render);
        }
      }
    }

    // 2D Canvas Fallback if WebGL fails
    if (!isWebGL) {
      const ctx = canvas.getContext('2d');
      const offscreen = document.createElement('canvas');
      offscreen.width = 160;
      offscreen.height = 90;
      const offCtx = offscreen.getContext('2d');

      const render2D = (now) => {
        const t_clock = ((now - startTime) / 1000) * 0.45 + 20.75;
        const imgData = offCtx.createImageData(160, 90);
        const data = imgData.data;

        const getPos = (idx) => {
          const n = idx * 0.37;
          const n2_1 = (idx / 3.0) - Math.floor(idx / 3.0);
          const o = 0.6 + n2_1 * 0.9;
          const n2_2 = ((idx + 1.0) / 4.0) - Math.floor((idx + 1.0) / 4.0);
          const i = 0.8 + n2_2;
          return [
            0.5 + 0.5 * Math.sin(t_clock * o + n),
            0.5 + 0.5 * Math.cos(t_clock * i + n * 1.5)
          ];
        };

        const f0 = getPos(0);
        const f1 = getPos(1);
        const f2 = getPos(2);
        const f3 = getPos(3);

        const colors = [
          [246, 249, 255],
          [155, 224, 232],
          [196, 181, 247],
          [248, 184, 217]
        ];

        let ptr = 0;
        for (let y = 0; y < 90; y++) {
          const py = (y + 0.5) / 90;
          for (let x = 0; x < 160; x++) {
            const px = (x + 0.5) / 160;
            const k0 = (px - f0[0]) ** 2 + (py - f0[1]) ** 2;
            const k1 = (px - f1[0]) ** 2 + (py - f1[1]) ** 2;
            const k2 = (px - f2[0]) ** 2 + (py - f2[1]) ** 2;
            const k3 = (px - f3[0]) ** 2 + (py - f3[1]) ** 2;

            const w0 = 1 / ((k0 ** 1.75) + 0.0001);
            const w1 = 1 / ((k1 ** 1.75) + 0.0001);
            const w2 = 1 / ((k2 ** 1.75) + 0.0001);
            const w3 = 1 / ((k3 ** 1.75) + 0.0001);
            const sumW = w0 + w1 + w2 + w3;

            data[ptr++] = Math.round((colors[0][0] * w0 + colors[1][0] * w1 + colors[2][0] * w2 + colors[3][0] * w3) / sumW);
            data[ptr++] = Math.round((colors[0][1] * w0 + colors[1][1] * w1 + colors[2][1] * w2 + colors[3][1] * w3) / sumW);
            data[ptr++] = Math.round((colors[0][2] * w0 + colors[1][2] * w1 + colors[2][2] * w2 + colors[3][2] * w3) / sumW);
            data[ptr++] = 255;
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

    // Resize Handler: Keep internal buffer matched to container
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
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
  );
}
