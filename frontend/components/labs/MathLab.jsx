'use client';

import React, { useState, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Calculator, Edit3, Eraser, Trash2, RotateCcw, Play, Sparkles,
  Sliders, Activity, HelpCircle, Compass, Zap, Lightbulb, ChevronRight,
  TrendingUp, Circle, Triangle, Layers, ZoomIn, ZoomOut, RefreshCw, Send, Image as ImageIcon,
  Crop, Mic, MicOff, Square, CheckCircle2, Award, Box, Volume2,
  Maximize2, Minimize2, PenLine, LineChart
} from 'lucide-react';
import { T } from '@/lib/lms-data';
import { getMascotBridge } from '@/lib/mascotBridge';
import MathEquationRenderer from '@/components/labs/MathEquationRenderer';
import { useMediaQuery, isMobileMQ, isTabletMQ } from '@/lib/useMediaQuery';
import './MathLab.css';

// Preprocess LaTeX math syntax safely into clean formatted KaTeX math
function preprocessLaTeX(text) {
  if (!text) return '';
  let str = String(text).replace(/\\n/g, '\n');
  str = str
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => `\n\n$$\n${formula.trim()}\n$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => ` $${formula.trim()}$ `);
  str = str.replace(/\${3,}/g, '$$');
  return str;
}

// Helper GCD function
function calcGcd(a, b) {
  a = Math.abs(Math.round(a || 0));
  b = Math.abs(Math.round(b || 0));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

// Helper parser to dynamically extract slope, quadratic, or general expression parameters
function parseMathEquation(rawEq, modeFromAI, paramsFromAI, canonicalFromAI) {
  if (!rawEq) return { eqText: 'y = x + 1', mode: 'linear', a: 1, b: 0, c: 1, d: 0, rawEq: 'y = x + 1' };

  let clean = String(rawEq).replace(/\s+/g, '').replace(/−/g, '-');

  // If AI gave explicit parameters, prioritize them
  if (paramsFromAI && (paramsFromAI.a !== undefined || paramsFromAI.c !== undefined)) {
    const a = paramsFromAI.a !== undefined ? parseFloat(paramsFromAI.a) : 1;
    const b = paramsFromAI.b !== undefined ? parseFloat(paramsFromAI.b) : 0;
    const c = paramsFromAI.c !== undefined ? parseFloat(paramsFromAI.c) : 0;
    const d = paramsFromAI.d !== undefined ? parseFloat(paramsFromAI.d) : 0;
    const mode = modeFromAI || (clean.includes('x^2') || clean.includes('x²') ? 'quadratic' : clean.includes('sin') ? 'sine' : 'linear');
    return {
      eqText: canonicalFromAI || (mode === 'linear' ? (a === 0 ? `y = ${c}` : `y = ${a === 1 ? '' : a === -1 ? '-' : a}x ${c !== 0 ? (c > 0 ? '+ ' + c : '- ' + Math.abs(c)) : ''}`.trim()) : rawEq),
      mode,
      a: isNaN(a) ? 1 : a,
      b: isNaN(b) ? 0 : b,
      c: isNaN(c) ? 0 : c,
      d: isNaN(d) ? 0 : d,
      rawEq
    };
  }

  // 1. Check for Trigonometric Sine
  if (clean.includes('sin') || modeFromAI === 'sine') {
    const sinMatch = clean.match(/y=([+\-]?\d*\.?\d*)?\*?sin\(([+\-]?\d*\.?\d*)?x([+\-]\d+\.?\d*)?\)([+\-]\d+\.?\d*)?/i);
    let a = 1, b = 1, c = 0, d = 0;
    if (sinMatch) {
      if (sinMatch[1] === '-') a = -1;
      else if (sinMatch[1] && sinMatch[1] !== '+') a = parseFloat(sinMatch[1]);
      if (sinMatch[2] === '-') b = -1;
      else if (sinMatch[2] && sinMatch[2] !== '+') b = parseFloat(sinMatch[2]);
      if (sinMatch[3]) c = parseFloat(sinMatch[3]);
      if (sinMatch[4]) d = parseFloat(sinMatch[4]);
    }
    return {
      eqText: `y = ${a !== 1 ? (a === -1 ? '-' : a) : ''}sin(${b !== 1 ? b : ''}x)${d !== 0 ? (d > 0 ? ' + ' + d : ' - ' + Math.abs(d)) : ''}`.trim(),
      mode: 'sine',
      a: isNaN(a) ? 1 : a,
      b: isNaN(b) ? 1 : b,
      c: isNaN(c) ? 0 : c,
      d: isNaN(d) ? 0 : d,
      rawEq
    };
  }

  // 2. Check for Quadratic (x^2 or x²)
  if (clean.includes('x^2') || clean.includes('x²') || modeFromAI === 'quadratic') {
    const std = clean.replace(/x²/g, 'x^2');
    const quadMatch = std.match(/y=([+\-]?\d*\.?\d*)x\^2([+\-]?\d*\.?\d*x)?([+\-]\d+\.?\d*)?/i);
    let a = 1, b = 0, c = 0, d = 0;
    if (quadMatch) {
      if (quadMatch[1] === '-') a = -1;
      else if (quadMatch[1] && quadMatch[1] !== '+') a = parseFloat(quadMatch[1]);
      if (quadMatch[2]) {
        const bStr = quadMatch[2].replace('x', '');
        if (bStr === '+' || bStr === '') b = 1;
        else if (bStr === '-') b = -1;
        else b = parseFloat(bStr);
      }
      if (quadMatch[3]) c = parseFloat(quadMatch[3]);
    } else {
      const matchA = std.match(/([+\-]?\d*\.?\d*)x\^2/);
      if (matchA) {
        if (matchA[1] === '-') a = -1;
        else if (matchA[1] && matchA[1] !== '+') a = parseFloat(matchA[1]);
      }
    }
    return {
      eqText: `y = ${a !== 1 ? (a === -1 ? '-' : a) : ''}x² ${b !== 0 ? (b > 0 ? '+ ' + b + 'x ' : '- ' + Math.abs(b) + 'x ') : ''}${c !== 0 ? (c > 0 ? '+ ' + c : '- ' + Math.abs(c)) : ''}`.trim(),
      mode: 'quadratic',
      a: isNaN(a) ? 1 : a,
      b: isNaN(b) ? 0 : b,
      c: isNaN(c) ? 0 : c,
      d: 0,
      rawEq
    };
  }

  // 3. Algebraic Linear Solver for any linear relation with '=' (e.g. x = y + 4, 2x + 3y = 6, y = 4 - x)
  if (clean.includes('=')) {
    const [leftRaw, rightRaw] = clean.split('=');
    function extractCoeffs(str, multiplier = 1) {
      const tokens = str.match(/([+\-]?[^+\-]+)/g) || [];
      let coeffX = 0, coeffY = 0, constant = 0;
      for (let token of tokens) {
        if (!token) continue;
        if (token.includes('x')) {
          let numStr = token.replace('x', '');
          let num = 1;
          if (numStr === '' || numStr === '+') num = 1;
          else if (numStr === '-') num = -1;
          else num = parseFloat(numStr);
          if (!isNaN(num)) coeffX += num * multiplier;
        } else if (token.includes('y')) {
          let numStr = token.replace('y', '');
          let num = 1;
          if (numStr === '' || numStr === '+') num = 1;
          else if (numStr === '-') num = -1;
          else num = parseFloat(numStr);
          if (!isNaN(num)) coeffY += num * multiplier;
        } else {
          const num = parseFloat(token);
          if (!isNaN(num)) constant += num * multiplier;
        }
      }
      return { coeffX, coeffY, constant };
    }

    const left = extractCoeffs(leftRaw, 1);
    const right = extractCoeffs(rightRaw, -1);

    const totalA = left.coeffX + right.coeffX; // coeff of x
    const totalB = left.coeffY + right.coeffY; // coeff of y
    const totalC = left.constant + right.constant; // constant

    // If totalB is non-zero, solve for y: y = (-totalA / totalB) * x + (-totalC / totalB)
    if (Math.abs(totalB) > 1e-6) {
      const slope = -totalA / totalB;
      const intercept = -totalC / totalB;
      const roundClean = (v) => Math.abs(v - Math.round(v)) < 1e-4 ? Math.round(v) : parseFloat(v.toFixed(2));
      const a = roundClean(slope);
      const c = roundClean(intercept);

      let formatted = 'y = ';
      if (a === 1) formatted += 'x';
      else if (a === -1) formatted += '-x';
      else if (a !== 0) formatted += `${a}x`;

      if (c > 0) {
        formatted += (a !== 0 ? ' + ' : '') + c;
      } else if (c < 0) {
        formatted += (a !== 0 ? ' - ' : '-') + Math.abs(c);
      } else if (a === 0) {
        formatted += '0';
      }

      return {
        eqText: canonicalFromAI || formatted,
        mode: 'linear',
        a,
        b: 0,
        c,
        d: 0,
        rawEq
      };
    } else if (Math.abs(totalA) > 1e-6) {
      // Vertical line: totalA * x + totalC = 0 => x = -totalC / totalA
      const xVal = parseFloat((-totalC / totalA).toFixed(2));
      return {
        eqText: `x = ${xVal}`,
        mode: 'vertical',
        a: 0,
        b: 0,
        c: xVal,
        d: 0,
        rawEq
      };
    }
  }

  // Fallback default
  return { eqText: 'y = x + 1', mode: 'linear', a: 1, b: 0, c: 1, d: 0, rawEq };
}

// ----------------------------------------------------
// DYNAMIC TEXTBOOK MATH VISUALIZER CANVAS COMPONENT
// ----------------------------------------------------
function DynamicMathVisualizer({ spec }) {
  const [params, setParams] = useState(spec?.params || {});

  useEffect(() => {
    if (spec?.params) setParams(spec.params);
  }, [spec]);

  if (!spec || !spec.type) return null;

  const updateParam = (key, val) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  const isAngleType = ['angles', 'supplementary_angles', 'complementary_angles', 'ratio_angles'].includes(spec.type);

  return (
    <div style={{
      marginTop: 16,
      background: 'rgba(10, 15, 28, 0.92)',
      borderRadius: 16,
      border: '1px solid rgba(168, 85, 247, 0.3)',
      padding: '14px 12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Box size={18} color="#C084FC" />
          <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#FFF' }}>
            {spec.title || 'Dynamic Math Visualizer'}
          </h4>
        </div>
        <span style={{ fontSize: 11, background: 'rgba(168, 85, 247, 0.2)', color: '#E9D5FF', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
          Interactive Canvas
        </span>
      </div>

      <div className="math-visualizer-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 14,
        alignItems: 'start',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* SVG VISUALIZER CANVAS */}
        <div style={{
          background: '#070B16',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 8px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          <svg
            viewBox="0 0 380 260"
            preserveAspectRatio="xMidYMid meet"
            style={{
              width: '100%',
              maxWidth: 380,
              height: 'auto',
              background: '#050811',
              borderRadius: 8,
              display: 'block',
              margin: '0 auto'
            }}
          >
            
            {/* 1. ANGLES / SUPPLEMENTARY / COMPLEMENTARY VISUALIZER */}
            {isAngleType && (() => {
              const totalAngle = params.totalAngle || (spec.type === 'complementary_angles' ? 90 : 180);
              const angle1 = params.angle1 !== undefined ? params.angle1 : (totalAngle === 180 ? 36 : 30);
              const angle2 = params.angle2 !== undefined ? (totalAngle - angle1) : (totalAngle - angle1);
              
              const cx = 190, cy = 190, r = 110;
              const rad1 = (angle1 * Math.PI) / 180;
              const radTotal = (totalAngle * Math.PI) / 180;

              const xBaseline = cx + r;
              const yBaseline = cy;

              const xRay1 = cx + r * Math.cos(rad1);
              const yRay1 = cy - r * Math.sin(rad1);

              const xRayTotal = cx + r * Math.cos(radTotal);
              const yRayTotal = cy - r * Math.sin(radTotal);

              const arc1Path = `M ${cx},${cy} L ${cx + 45},${cy} A 45 45 0 0 0 ${cx + 45 * Math.cos(rad1)},${cy - 45 * Math.sin(rad1)} Z`;
              const arc2Path = `M ${cx},${cy} L ${cx + 45 * Math.cos(rad1)},${cy - 45 * Math.sin(rad1)} A 45 45 0 0 0 ${xRayTotal === cx ? cx : cx + 45 * Math.cos(radTotal)},${cy - 45 * Math.sin(radTotal)} Z`;

              const common = calcGcd(angle1, angle2);
              const r1 = Math.round(angle1 / common) || 1;
              const r2 = Math.round(angle2 / common) || 4;

              return (
                <g>
                  {/* Base rays */}
                  <line x1={cx - (totalAngle === 180 ? r : 0)} y1={cy} x2={cx + r} y2={cy} stroke="#6B7280" strokeWidth="2.5" />
                  {totalAngle === 90 && <line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="#6B7280" strokeWidth="2.5" />}

                  {/* Ray 1 (Dividing ray) */}
                  <line x1={cx} y1={cy} x2={xRay1} y2={yRay1} stroke="#EC4899" strokeWidth="3" />

                  {/* Shaded arcs */}
                  <path d={arc1Path} fill="rgba(236, 72, 153, 0.3)" stroke="#EC4899" strokeWidth="1.5" />
                  <path d={arc2Path} fill="rgba(6, 182, 212, 0.3)" stroke="#06B6D4" strokeWidth="1.5" />

                  <circle cx={cx} cy={cy} r={4} fill="#FFF" />

                  {/* Angle Labels */}
                  <text x={cx + 55 * Math.cos(rad1 / 2)} y={cy - 55 * Math.sin(rad1 / 2)} fill="#EC4899" fontSize="13" fontWeight="bold">
                    {angle1}°
                  </text>
                  <text x={cx + 60 * Math.cos(rad1 + (radTotal - rad1) / 2)} y={cy - 60 * Math.sin(rad1 + (radTotal - rad1) / 2)} fill="#06B6D4" fontSize="13" fontWeight="bold">
                    {angle2}°
                  </text>

                  {/* Calculation Card */}
                  <rect x={15} y={15} width={350} height={42} rx={8} fill="rgba(139, 92, 246, 0.2)" stroke="#8B5CF6" />
                  <text x={190} y={35} fill="#C4B5FD" fontSize="13" fontWeight="bold" textAnchor="middle">
                    {angle1}° + {angle2}° = {totalAngle}° {totalAngle === 180 ? '(Supplementary)' : '(Complementary)'}
                  </text>
                  <text x={190} y={50} fill="#F59E0B" fontSize="11" textAnchor="middle">
                    Ratio = {r1}:{r2}
                  </text>
                </g>
              );
            })()}

            {/* 2. TRIANGLE VISUALIZER */}
            {(spec.type === 'triangle' || spec.type === 'right_triangle' || spec.type === 'pythagoras') && (() => {
              const base = params.base || 6;
              const height = params.height || 8;
              const ox = 60, oy = 210;
              const scale = Math.min(240 / Math.max(base, 1), 160 / Math.max(height, 1));

              const bx = base * scale;
              const hy = height * scale;
              const hypotenuse = Math.sqrt(base * base + height * height).toFixed(2);
              const area = (0.5 * base * height).toFixed(2);

              return (
                <g>
                  <line x1={0} y1={oy} x2={380} y2={oy} stroke="rgba(255,255,255,0.1)" />
                  <line x1={ox} y1={0} x2={ox} y2={260} stroke="rgba(255,255,255,0.1)" />

                  <polygon
                    points={`${ox},${oy} ${ox + bx},${oy} ${ox},${oy - hy}`}
                    fill="rgba(139, 92, 246, 0.25)"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                  />

                  <path d={`M ${ox + 12},${oy} L ${ox + 12},${oy - 12} L ${ox},${oy - 12}`} fill="none" stroke="#FFF" strokeWidth="1.5" />

                  <text x={ox + bx / 2} y={oy + 18} fill="#06B6D4" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Base = {base}
                  </text>
                  <text x={ox - 16} y={oy - hy / 2} fill="#F59E0B" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Height = {height}
                  </text>
                  <text x={ox + bx / 2 + 10} y={oy - hy / 2 - 6} fill="#EC4899" fontSize="12" fontWeight="bold">
                    c = {hypotenuse}
                  </text>

                  <rect x={180} y={20} width={180} height={36} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={270} y={42} fill="#10B981" fontSize="13" fontWeight="bold" textAnchor="middle">
                    Area = ½ × b × h = {area}
                  </text>
                </g>
              );
            })()}

            {/* 3. CIRCLE SECTOR VISUALIZER */}
            {(spec.type === 'sector' || spec.type === 'circle_sector') && (() => {
              const r = params.radius || 10;
              const angle = params.angle || 30;
              const cx = 190, cy = 140;
              const scale = Math.min(100 / Math.max(r, 1), 18);
              const cr = r * scale;

              const rad = (angle * Math.PI) / 180;
              const x2 = cx + cr * Math.cos(rad);
              const y2 = cy - cr * Math.sin(rad);
              const largeArc = angle > 180 ? 1 : 0;
              const sectorPath = `M ${cx},${cy} L ${cx + cr},${cy} A ${cr} ${cr} 0 ${largeArc} 0 ${x2},${y2} Z`;
              const sectorArea = ((angle / 360) * Math.PI * r * r).toFixed(2);

              return (
                <g>
                  <circle cx={cx} cy={cy} r={cr} fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="4" />
                  <path d={sectorPath} fill="rgba(139, 92, 246, 0.35)" stroke="#8B5CF6" strokeWidth="3" />
                  <line x1={cx} y1={cy} x2={cx + cr} y2={cy} stroke="#06B6D4" strokeWidth="2.5" />
                  <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#EC4899" strokeWidth="2.5" />
                  <circle cx={cx} cy={cy} r={4} fill="#FFF" />

                  <text x={cx + 20} y={cy - 6} fill="#F59E0B" fontSize="12" fontWeight="bold">θ = {angle}°</text>
                  <text x={cx + cr / 2} y={cy + 16} fill="#06B6D4" fontSize="12" fontWeight="bold">r = {r}</text>

                  <rect x={180} y={15} width={185} height={36} rx={8} fill="rgba(139, 92, 246, 0.2)" stroke="#8B5CF6" />
                  <text x={272.5} y={37} fill="#A78BFA" fontSize="13" fontWeight="bold" textAnchor="middle">
                    Sector Area = {sectorArea}
                  </text>
                </g>
              );
            })()}

            {/* 4. SOLID SURFACE AREA VISUALIZER */}
            {(spec.type === 'solid_surface' || spec.type === '3d_surface') && (() => {
              const r = params.radius || 7;
              const h = params.height || 14;
              const cx = 190, cy = 130;
              const cr = 45;
              const ch = 80;

              const tsa = (2 * Math.PI * r * h + 2 * Math.PI * r * r).toFixed(1);

              return (
                <g>
                  <rect x={cx - cr} y={cy - ch / 2} width={cr * 2} height={ch} fill="rgba(139, 92, 246, 0.2)" stroke="#8B5CF6" strokeWidth="2.5" />
                  <ellipse cx={cx} cy={cy - ch / 2} rx={cr} ry={14} fill="rgba(236, 72, 153, 0.3)" stroke="#EC4899" strokeWidth="2" />
                  <ellipse cx={cx} cy={cy + ch / 2} rx={cr} ry={14} fill="rgba(139, 92, 246, 0.3)" stroke="#8B5CF6" strokeWidth="2" />

                  <line x1={cx - cr - 15} y1={cy - ch / 2} x2={cx - cr - 15} y2={cy + ch / 2} stroke="#F59E0B" strokeWidth="2" strokeDasharray="4" />
                  <text x={cx - cr - 25} y={cy} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="end">h = {h}</text>

                  <line x1={cx} y1={cy - ch / 2} x2={cx + cr} y2={cy - ch / 2} stroke="#06B6D4" strokeWidth="2" />
                  <text x={cx + cr / 2} y={cy - ch / 2 - 6} fill="#06B6D4" fontSize="11" fontWeight="bold" textAnchor="middle">r = {r}</text>

                  <rect x={180} y={15} width={185} height={36} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={272.5} y={37} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Surface Area = {tsa}
                  </text>
                </g>
              );
            })()}

            {/* 5. FULL CIRCLE VISUALIZER */}
            {spec.type === 'circle' && (() => {
              const r = params.radius || 5;
              const cx = 190, cy = 130;
              const scale = Math.min(100 / Math.max(r, 1), 18);
              const cr = r * scale;

              const area = (Math.PI * r * r).toFixed(2);
              const perimeter = (2 * Math.PI * r).toFixed(2);

              return (
                <g>
                  <circle cx={cx} cy={cy} r={cr} fill="rgba(236, 72, 153, 0.2)" stroke="#EC4899" strokeWidth="3" />
                  <circle cx={cx} cy={cy} r={4} fill="#FFF" />
                  <line x1={cx} y1={cy} x2={cx + cr} y2={cy} stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4" />
                  <text x={cx + cr / 2} y={cy - 8} fill="#F59E0B" fontSize="12" fontWeight="bold" textAnchor="middle">
                    r = {r}
                  </text>

                  <rect x={20} y={15} width={140} height={50} rx={8} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
                  <text x={30} y={35} fill="#EC4899" fontSize="12" fontWeight="bold">Area = πr² = {area}</text>
                  <text x={30} y={52} fill="#06B6D4" fontSize="12" fontWeight="bold">Perimeter = {perimeter}</text>
                </g>
              );
            })()}

            {/* 6. AREA UNDER CURVE VISUALIZER */}
            {spec.type === 'area_under_curve' && (() => {
              const a = params.a !== undefined ? params.a : 0;
              const b = params.b !== undefined ? params.b : 3;
              const cx = 80, cy = 200, scaleX = 40, scaleY = 15;

              const f = (x) => (params.func === '2x+1' ? 2 * x + 1 : x * x);
              const points = [];
              for (let x = -1; x <= 4; x += 0.1) {
                const px = cx + x * scaleX;
                const py = cy - f(x) * scaleY;
                points.push(`${px},${py}`);
              }

              const fillPoints = [];
              fillPoints.push(`${cx + a * scaleX},${cy}`);
              for (let x = a; x <= b; x += 0.1) {
                fillPoints.push(`${cx + x * scaleX},${cy - f(x) * scaleY}`);
              }
              fillPoints.push(`${cx + b * scaleX},${cy}`);

              const calcArea = params.func === '2x+1' ? (b * b + b) - (a * a + a) : (Math.pow(b, 3) / 3 - Math.pow(a, 3) / 3);

              return (
                <g>
                  <line x1={0} y1={cy} x2={380} y2={cy} stroke="rgba(255,255,255,0.2)" />
                  <line x1={cx} y1={0} x2={cx} y2={260} stroke="rgba(255,255,255,0.2)" />

                  <polygon points={fillPoints.join(' ')} fill="rgba(16, 185, 129, 0.35)" stroke="none" />
                  <path d={`M ${points.join(' L ')}`} fill="none" stroke="#8B5CF6" strokeWidth="3" />

                  <line x1={cx + a * scaleX} y1={cy} x2={cx + a * scaleX} y2={cy - f(a) * scaleY} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3" />
                  <line x1={cx + b * scaleX} y1={cy} x2={cx + b * scaleX} y2={cy - f(b) * scaleY} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3" />

                  <text x={cx + a * scaleX} y={cy + 15} fill="#F59E0B" fontSize="11" fontWeight="bold">a={a}</text>
                  <text x={cx + b * scaleX} y={cy + 15} fill="#F59E0B" fontSize="11" fontWeight="bold">b={b}</text>

                  <rect x={220} y={15} width={145} height={40} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={292} y={38} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    ∫ Area = {calcArea.toFixed(2)}
                  </text>
                </g>
              );
            })()}

            {/* DEFAULT RICH DYNAMIC CONCEPT CARD (No Text Overflow!) */}
            {(!['triangle', 'right_triangle', 'pythagoras', 'circle', 'sector', 'circle_sector', 'solid_surface', '3d_surface', 'area_under_curve'].includes(spec.type) && !isAngleType) && (
              <g>
                <rect x={20} y={20} width={340} height={220} rx={14} fill="rgba(139,92,246,0.1)" stroke="#8B5CF6" strokeWidth="2" />
                <circle cx={70} cy={70} r={28} fill="rgba(139,92,246,0.2)" stroke="#A78BFA" strokeWidth="1.5" />
                <path d="M 58 70 L 66 78 L 82 62" fill="none" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />

                <foreignObject x={110} y={35} width={230} height={70}>
                  <div style={{ color: '#FFF', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
                    {spec.title || 'Dynamic Concept Visualizer'}
                  </div>
                  <div style={{ color: '#C4B5FD', fontSize: 11, marginTop: 4 }}>
                    Interactive Concept Spec
                  </div>
                </foreignObject>

                {/* Parameters Pills */}
                <foreignObject x={35} y={115} width={310} height={110}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(params).map(([k, v]) => (
                      <span key={k} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#F472B6', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </foreignObject>
              </g>
            )}
          </svg>
        </div>

        {/* PARAMETER SLIDERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={14} /> Dynamic Controls
          </span>

          {isAngleType && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Angle 1 (θ₁):</span> <b>{params.angle1 || 36}°</b>
                </label>
                <input type="range" min="1" max={(params.totalAngle || 180) - 1} value={params.angle1 || 36} onChange={(e) => updateParam('angle1', e.target.value)} style={{ width: '100%', accentColor: '#EC4899' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Angle 2 (θ₂):</span> <b>{(params.totalAngle || 180) - (params.angle1 || 36)}°</b>
                </label>
                <input type="range" disabled value={(params.totalAngle || 180) - (params.angle1 || 36)} style={{ width: '100%', opacity: 0.5 }} />
              </div>
            </>
          )}

          {(spec.type === 'triangle' || spec.type === 'right_triangle' || spec.type === 'pythagoras') && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base:</span> <b>{params.base || 6}</b>
                </label>
                <input type="range" min="1" max="15" value={params.base || 6} onChange={(e) => updateParam('base', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Height:</span> <b>{params.height || 8}</b>
                </label>
                <input type="range" min="1" max="15" value={params.height || 8} onChange={(e) => updateParam('height', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {(spec.type === 'sector' || spec.type === 'circle_sector') && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Radius r:</span> <b>{params.radius || 10}</b>
                </label>
                <input type="range" min="5" max="50" value={params.radius || 10} onChange={(e) => updateParam('radius', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Angle θ:</span> <b>{params.angle || 30}°</b>
                </label>
                <input type="range" min="5" max="355" step="5" value={params.angle || 30} onChange={(e) => updateParam('angle', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {(spec.type === 'solid_surface' || spec.type === '3d_surface') && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Radius r:</span> <b>{params.radius || 7}</b>
                </label>
                <input type="range" min="1" max="20" value={params.radius || 7} onChange={(e) => updateParam('radius', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Height h:</span> <b>{params.height || 14}</b>
                </label>
                <input type="range" min="2" max="40" value={params.height || 14} onChange={(e) => updateParam('height', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Safe React Error Boundary for Math components
class SafeMathRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn("[SafeMathRenderer Caught Error]:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#E5E7EB', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.7, padding: 12 }}>
          {this.props.fallback || this.props.children}
        </div>
      );
    }
    return this.props.children;
  }
}

// Custom Markdown Math Renderer with KaTeX & LaTeX support
function CustomMathMarkdown({ content }) {
  const mathTheme = {
    text: '#F3F4F6',
    muted: '#94A3B8',
    purple: '#A78BFA',
    accent: '#60A5FA',
    green: '#34D399',
    s2: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.1)'
  };

  return (
    <SafeMathRenderer fallback={<div style={{ whiteSpace: 'pre-wrap', color: '#E5E7EB' }}>{content}</div>}>
      <div className="math-markdown-content" style={{ fontSize: 15, lineHeight: 1.85, color: '#E5E7EB' }}>
        <MathEquationRenderer content={content} theme={mathTheme} />
      </div>
    </SafeMathRenderer>
  );
}

// ----------------------------------------------------
// MAIN MATH LAB COMPONENT
// ----------------------------------------------------
export default function MathLab() {
  const isMobile = useMediaQuery(isMobileMQ);
  const isTablet = useMediaQuery(isTabletMQ);
  const isStacked = isMobile;
  const [activeTab, setActiveTab] = useState('whiteboard');
  const [visualizerSubTab, setVisualizerSubTab] = useState('pythagoras');

  // Whiteboard State
  const canvasRef = useRef(null);
  const cropStartRef = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState('pen');
  const [penColor, setPenColor] = useState('#FFFFFF');
  const [penWidth, setPenWidth] = useState(4);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 0, h: 0, isSelecting: false, isSelected: false });
  const [isWhiteboardExpanded, setIsWhiteboardExpanded] = useState(false);

  // Equation State
  const [equationText, setEquationText] = useState('y = x + 1');
  const [recognizedText, setRecognizedText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');

  // Graph State
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(0);
  const [paramC, setParamC] = useState(1);
  const [paramD, setParamD] = useState(0);
  const [plotMode, setPlotMode] = useState('linear');
  const graphCanvasRef = useRef(null);
  const [zoomScale, setZoomScale] = useState(30);
  const [hoverCoord, setHoverCoord] = useState(null);

  // AI Tutor & Continuous Voice State
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorResponse, setTutorResponse] = useState('');
  const [isTutorThinking, setIsTutorThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [parsedVisualSpec, setParsedVisualSpec] = useState(null);
  const recognitionRef = useRef(null);
  const tutorResponseRef = useRef(null);

  // Visualizer Parameters
  const [pythA, setPythA] = useState(6);
  const [pythB, setPythB] = useState(8);
  const [trigAngle, setTrigAngle] = useState(45);
  const [calcX0, setCalcX0] = useState(1.5);
  const [calcFunc, setCalcFunc] = useState('quadratic');
  const [vecU, setVecU] = useState({ x: 4, y: 3 });
  const [vecV, setVecV] = useState({ x: -2, y: 5 });

  // Auto-scroll to AI solution response when it arrives
  useEffect(() => {
    if (tutorResponse && tutorResponseRef.current) {
      tutorResponseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [tutorResponse]);

  // URL Query Parameters & Mascot Bridge Controller
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyQueryParams = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const subtab = params.get('subtab') || params.get('vis') || params.get('experiment');
      const mode = params.get('mode');
      const eq = params.get('eq') || params.get('equation');

      if (tab) {
        if (['whiteboard', 'graph', 'visualizer'].includes(tab.toLowerCase())) {
          setActiveTab(tab.toLowerCase() === 'visualizer' ? 'graph' : tab.toLowerCase());
        }
      }
      if (subtab) {
        const validSubtabs = ['pythagoras', 'sector', 'solid', 'trig', 'calculus'];
        if (validSubtabs.includes(subtab.toLowerCase())) {
          setActiveTab('graph');
          setVisualizerSubTab(subtab.toLowerCase());
        }
      }
      if (mode) {
        const validModes = ['linear', 'quadratic', 'polynomial', 'trig', 'exponential'];
        if (validModes.includes(mode.toLowerCase())) {
          setActiveTab('graph');
          setPlotMode(mode.toLowerCase());
        }
      }
      if (eq) {
        setEquationText(decodeURIComponent(eq));
      }
    };

    applyQueryParams();

    // Listen for real-time remote commands from Desktop Mascot
    const bridge = getMascotBridge();
    const unsubscribe = bridge.subscribe((msg) => {
      if (msg.type === 'PET_ACTION_REQUESTED' && msg.payload) {
        const { action, target } = msg.payload;
        if (action === 'select_tab') {
          if (['whiteboard', 'graph', 'visualizer'].includes(target?.toLowerCase())) {
            setActiveTab(target.toLowerCase() === 'visualizer' ? 'graph' : target.toLowerCase());
          }
        } else if (action === 'select_visualizer' || action === 'select_experiment') {
          const sub = target?.toLowerCase();
          const validSubtabs = ['pythagoras', 'sector', 'solid', 'trig', 'calculus'];
          if (validSubtabs.includes(sub)) {
            setActiveTab('graph');
            setVisualizerSubTab(sub);
          }
        } else if (action === 'select_plot_mode') {
          const m = target?.toLowerCase();
          const validModes = ['linear', 'quadratic', 'polynomial', 'trig', 'exponential'];
          if (validModes.includes(m)) {
            setActiveTab('graph');
            setPlotMode(m);
          }
        }
      } else if (msg.type === 'NAVIGATE_WEBAPP' && msg.payload?.route) {
        const r = msg.payload.route;
        if (r.includes('?')) {
          const params = new URLSearchParams(r.split('?')[1]);
          const tab = params.get('tab');
          const subtab = params.get('subtab') || params.get('vis') || params.get('experiment');
          const mode = params.get('mode');
          if (tab && ['whiteboard', 'graph', 'visualizer'].includes(tab.toLowerCase())) {
            setActiveTab(tab.toLowerCase() === 'visualizer' ? 'graph' : tab.toLowerCase());
          }
          if (subtab && ['pythagoras', 'sector', 'solid', 'trig', 'calculus'].includes(subtab.toLowerCase())) {
            setActiveTab('graph');
            setVisualizerSubTab(subtab.toLowerCase());
          }
          if (mode && ['linear', 'quadratic', 'polynomial', 'trig', 'exponential'].includes(mode.toLowerCase())) {
            setActiveTab('graph');
            setPlotMode(mode.toLowerCase());
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync active math tab to Desktop Mascot
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bridge = getMascotBridge();
    bridge.sendActivityUpdate('math_tutor', {
      tab: activeTab,
      visualizerSubTab: visualizerSubTab,
      plotMode: plotMode
    });
  }, [activeTab, visualizerSubTab, plotMode]);

  // ----------------------------------------------------
  // WHITEBOARD & CROPPING
  // ----------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'whiteboard') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!hasDrawn) clearWhiteboard();
  }, [activeTab]);

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setRecognizedText('');
    setCropBox({ x: 0, y: 0, w: 0, h: 0, isSelecting: false, isSelected: false });
  };

  const clearCropSelection = () => {
    setCropBox({ x: 0, y: 0, w: 0, h: 0, isSelecting: false, isSelected: false });
  };

  const switchTool = (tool) => {
    setDrawTool(tool);
    if (tool !== 'select') clearCropSelection();
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);
    setIsDrawing(true);

    if (drawTool === 'select') {
      cropStartRef.current = { x: coords.x, y: coords.y };
      setCropBox({ x: coords.x, y: coords.y, w: 0, h: 0, isSelecting: true, isSelected: false });
    } else {
      clearCropSelection();
      setHasDrawn(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (drawTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = penWidth * 5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (drawTool === 'select' && cropBox.isSelecting) {
      const x = Math.min(cropStartRef.current.x, coords.x);
      const y = Math.min(cropStartRef.current.y, coords.y);
      const w = Math.abs(coords.x - cropStartRef.current.x);
      const h = Math.abs(coords.y - cropStartRef.current.y);
      setCropBox({ x, y, w, h, isSelecting: true, isSelected: false });
    } else {
      if (drawTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = penWidth * 5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false);
      if (drawTool === 'select' && cropBox.isSelecting) {
        if (cropBox.w > 10 && cropBox.h > 10) {
          setCropBox(prev => ({ ...prev, isSelecting: false, isSelected: true }));
        } else {
          clearCropSelection();
        }
      }
    }
  };

  const handleRecognizeCanvas = async (cropOnly = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecognizing(true);
    setAiExplanation('');

    try {
      let dataUrl = '';
      if (cropOnly && cropBox.isSelected && cropBox.w > 5 && cropBox.h > 5) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = cropBox.w;
        offCanvas.height = cropBox.h;
        const offCtx = offCanvas.getContext('2d');
        offCtx.fillStyle = '#070B16';
        offCtx.fillRect(0, 0, cropBox.w, cropBox.h);
        offCtx.drawImage(canvas, cropBox.x, cropBox.y, cropBox.w, cropBox.h, 0, 0, cropBox.w, cropBox.h);
        dataUrl = offCanvas.toDataURL('image/png');
      } else {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx.fillStyle = '#070B16';
        offCtx.fillRect(0, 0, canvas.width, canvas.height);
        offCtx.drawImage(canvas, 0, 0);
        dataUrl = offCanvas.toDataURL('image/png');
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: `Analyze this handwritten math equation image carefully.
Identify the exact equation written on the whiteboard (e.g. x = y + 4, y = 2x - 3, y = x^2 - 4, y = sin(x)).
Express it in standard Cartesian form solved for y: y = f(x).

Respond ONLY with valid JSON in this exact structure:
{
  "equation": "<original_detected_equation, e.g. x = y + 4>",
  "canonical": "<solved_for_y_equation, e.g. y = x - 4>",
  "mode": "linear" | "quadratic" | "sine",
  "params": {
    "a": <number, slope or leading coefficient, e.g. 1>,
    "b": <number, frequency or linear coeff, default 0>,
    "c": <number, y-intercept or constant, e.g. -4>,
    "d": <number, vertical offset, default 0>
  },
  "explanation": "<short explanation, e.g. Detected handwritten equation x = y + 4. Solved for y: y = x - 4 (slope m = 1, y-intercept c = -4).>"
}`,
          image: dataUrl
        })
      });

      const contentType = response.headers.get('content-type') || '';
      let resData = {};
      if (contentType.includes('application/json')) {
        resData = await response.json();
      } else {
        setAiExplanation("OCR Server initializing. Please try again.");
        return;
      }

      if (resData.error) {
        setAiExplanation("AI Engine Error: " + resData.error);
        return;
      }

      let rawText = resData.text || '';

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const parsedResult = parseMathEquation(parsed.equation || parsed.canonical, parsed.mode, parsed.params, parsed.canonical);

          setPlotMode(parsedResult.mode);
          setParamA(parsedResult.a);
          setParamB(parsedResult.b);
          setParamC(parsedResult.c);
          setParamD(parsedResult.d);
          setEquationText(parsedResult.eqText);
          setRecognizedText(parsed.equation || parsedResult.rawEq || parsedResult.eqText);
          setAiExplanation(parsed.explanation || `Detected: ${parsed.equation || parsedResult.rawEq} ➔ Plotted: ${parsedResult.eqText}`);
        } catch (err) {
          const parsedResult = parseMathEquation(rawText);
          setPlotMode(parsedResult.mode);
          setParamA(parsedResult.a);
          setParamB(parsedResult.b);
          setParamC(parsedResult.c);
          setParamD(parsedResult.d);
          setEquationText(parsedResult.eqText);
          setRecognizedText(parsedResult.rawEq || parsedResult.eqText);
          setAiExplanation(`Recognized: ${parsedResult.rawEq} ➔ Plotted: ${parsedResult.eqText}`);
        }
      } else {
        const parsedResult = parseMathEquation(rawText);
        setPlotMode(parsedResult.mode);
        setParamA(parsedResult.a);
        setParamB(parsedResult.b);
        setParamC(parsedResult.c);
        setParamD(parsedResult.d);
        setEquationText(parsedResult.eqText);
        setRecognizedText(parsedResult.rawEq || parsedResult.eqText);
        setAiExplanation(rawText.slice(0, 150) || `Detected ${parsedResult.eqText}`);
      }
    } catch (error) {
      console.error("Recognition error:", error);
      setAiExplanation("Recognition error: " + (error.message || "Failed to analyze selection"));
    } finally {
      setIsRecognizing(false);
      clearCropSelection();
      setDrawTool('pen');
    }
  };

  // ----------------------------------------------------
  // CONTINUOUS SPEECH-TO-TEXT VOICE INPUT
  // ----------------------------------------------------
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setTutorQuery(transcript);
          }
        };
        recognition.onerror = (e) => {
          console.warn("Speech notice:", e.error);
          if (e.error === 'not-allowed') {
            alert("Microphone permission denied. Please allow microphone access in browser address bar.");
            setIsListening(false);
          }
        };
        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch(err) {
        console.error("Speech error:", err);
        setIsListening(false);
      }
    }
  };

  // ----------------------------------------------------
  // 2D GRAPH PLOTTER ENGINE
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;

    ctx.fillStyle = '#07080F';
    ctx.fillRect(0, 0, width, height);

    // Gridlines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;

    for (let x = originX % zoomScale; x < width; x += zoomScale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = originY % zoomScale; y < height; y += zoomScale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Main Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Ticks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '10px sans-serif';
    for (let u = -10; u <= 10; u += 2) {
      if (u === 0) continue;
      const px = originX + u * zoomScale;
      const py = originY - u * zoomScale;
      if (px > 0 && px < width) ctx.fillText(`${u}`, px - 4, originY + 14);
      if (py > 0 && py < height) ctx.fillText(`${u}`, originX + 6, py + 4);
    }

    const evaluateY = (x) => {
      const a = paramA, b = paramB, c = paramC, d = paramD;
      switch (plotMode) {
        case 'linear':
          return a * x + c;
        case 'quadratic':
          return a * x * x + b * x + c + d;
        case 'sine':
          return a * Math.sin(b * x + c) + d;
        case 'cubic':
          return a * Math.pow(x, 3) + b * x * x + c * x + d;
        default:
          return a * x + c;
      }
    };

    // Plot Curve
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    let isFirst = true;

    if (plotMode === 'vertical') {
      const px = originX + paramC * zoomScale;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      // Highlight X-intercept for vertical line
      if (px >= 0 && px <= width) {
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(px, originY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`(${paramC}, 0)`, px + 8, originY - 6);
      }
    } else {
      for (let px = 0; px < width; px += 2) {
        const mathX = (px - originX) / zoomScale;
        const mathY = evaluateY(mathX);
        const py = originY - mathY * zoomScale;

        if (py >= -100 && py <= height + 100) {
          if (isFirst) {
            ctx.moveTo(px, py);
            isFirst = false;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          isFirst = true;
        }
      }
      ctx.stroke();

      // Highlight Y-intercept
      const yInt = evaluateY(0);
      const pyInt = originY - yInt * zoomScale;
      if (pyInt >= 0 && pyInt <= height) {
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(originX, pyInt, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`(0, ${yInt.toFixed(1)})`, originX + 8, pyInt - 6);
      }

      // Highlight X-intercept for linear curves
      if (plotMode === 'linear' && paramA !== 0) {
        const xInt = -paramC / paramA;
        const pxInt = originX + xInt * zoomScale;
        if (pxInt >= 0 && pxInt <= width && Math.abs(xInt) > 0.05) {
          ctx.fillStyle = '#3B82F6';
          ctx.beginPath();
          ctx.arc(pxInt, originY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`(${xInt.toFixed(1)}, 0)`, pxInt + 8, originY + 14);
        }
      }
    }

  }, [zoomScale, paramA, paramB, paramC, paramD, plotMode, hoverCoord]);

  const handleGraphMouseMove = (e) => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;
    const mathX = (px - originX) / zoomScale;
    const mathY = plotMode === 'linear' ? paramA * mathX + paramC : paramA * mathX * mathX + paramC;
    setHoverCoord({ x: mathX, y: mathY });
  };

  // ----------------------------------------------------
  // AI MATH TUTOR & DYNAMIC VISUALIZER PARSER
  // ----------------------------------------------------
  const handleAskTutor = async (promptQuery) => {
    const q = promptQuery || tutorQuery;
    if (!q.trim()) return;

    setIsTutorThinking(true);
    setTutorResponse('');
    setParsedVisualSpec(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: "You are Vedika Math AI, an expert math tutor. Format your explanations with crystal-clear mathematical rigor and beautiful presentation:\n\n1. Mathematical Notation:\n- ALWAYS use standard LaTeX math syntax for ALL formulas, equations, variables, and calculations.\n- For standalone equations and multi-line derivations, ALWAYS use display math $$...$$ on their own lines (e.g. $$A_{\\text{total}} = 2\\pi r h + 2\\pi r^2$$).\n- For inline symbols, variables, numbers with units, and expressions, ALWAYS use inline math $...$ (e.g. $r = 7\\text{ cm}$, $h = 10\\text{ cm}$, $\\pi \\approx \\frac{22}{7}$).\n- Use \\times for multiplication (NEVER bare * or x).\n- Use \\frac{numerator}{denominator} for fractions.\n- NEVER output bare LaTeX commands (like \\pi, \\times, \\text) without wrapping them in $...$ or $$...$$.\n\n2. Structure Your Response:\n- ### Given & Required: State values with units as inline LaTeX.\n- ### Formulas Used: Display the key formulas.\n- ### Step-by-Step Solution: Clear numbered steps (e.g., Step 1: ..., Step 2: ...).\n- ### Final Answer: Put the final answer inside $$\\boxed{\\text{Answer: } ...}$$.\n\n3. ALWAYS append a ```json block at the VERY END containing a visualSpec JSON:\n```json\n{\n  \"type\": \"supplementary_angles\" | \"complementary_angles\" | \"angles\" | \"triangle\" | \"sector\" | \"circle\" | \"solid_surface\" | \"linear_graph\" | \"quadratic_graph\" | \"quadrilateral\",\n  \"title\": \"Dynamic Visualizer Title\",\n  \"params\": {\"angle1\": 36, \"angle2\": 144, \"totalAngle\": 180, \"base\": 6, \"height\": 8, \"radius\": 10, \"angle\": 30},\n  \"labels\": {\"val1\": \"36°\", \"val2\": \"144°\", \"result\": \"180°\"}\n}\n```",
          user: `Solve and explain this mathematical equation or question step-by-step:\n"${q}"`
        })
      });

      const contentType = response.headers.get('content-type') || '';
      let data = {};

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.warn("Server HTML notice:", text.slice(0, 150));
        setTutorResponse("AI Service is initializing. Please click Solve again.");
        return;
      }

      if (data.error) {
        setTutorResponse(`AI Engine Notice: ${data.error}`);
        return;
      }

      const rawText = data.text || 'Unable to generate response.';

      const jsonMatch = rawText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          const specObj = JSON.parse(jsonMatch[1]);
          setParsedVisualSpec(specObj);
        } catch (e) {
          console.warn("Visual spec parsing failed:", e);
        }
      }

      setTutorResponse(rawText.replace(/```json\s*\{[\s\S]*?\}\s*```/, ''));
    } catch (err) {
      console.error("Math AI Connection Error:", err);
      setTutorResponse(`Notice: ${err.message || 'Failed to connect to Math AI engine.'}`);
    } finally {
      setIsTutorThinking(false);
    }
  };

  const getFormattedFormula = () => {
    switch (plotMode) {
      case 'linear': {
        const a = paramA;
        const c = paramC;
        if (a === 0) return `y = ${c}`;
        let aStr = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
        if (c === 0) return `y = ${aStr}`;
        return `y = ${aStr} ${c > 0 ? '+ ' + c : '- ' + Math.abs(c)}`;
      }
      case 'vertical':
        return `x = ${paramC}`;
      case 'quadratic': {
        const a = paramA;
        const b = paramB;
        const c = paramC;
        let res = 'y = ';
        if (a !== 0) res += `${a === 1 ? '' : a === -1 ? '-' : a}x²`;
        if (b !== 0) res += ` ${b > 0 && a !== 0 ? '+ ' : b < 0 ? '- ' : ''}${Math.abs(b) === 1 ? 'x' : Math.abs(b) + 'x'}`;
        if (c !== 0 || (a === 0 && b === 0)) res += ` ${c > 0 && (a !== 0 || b !== 0) ? '+ ' : c < 0 ? '- ' : ''}${Math.abs(c)}`;
        return res.trim();
      }
      case 'sine':
        return `y = ${paramA !== 1 ? paramA : ''}sin(${paramB !== 1 ? paramB : ''}x)${paramD !== 0 ? (paramD > 0 ? ' + ' + paramD : ' - ' + Math.abs(paramD)) : ''}`;
      default:
        return equationText || 'y = x + 1';
    }
  };

  return (
    <div className="math-lab-container">
      <div className="math-lab-inner">

        {/* 1. HEADER (matching image: Badge + Title + Subtitle) */}
        <header className="math-lab-header">
          <div className="math-lab-badge">
            <Calculator size={26} color="#FFF" />
          </div>
          <div className="math-lab-titles">
            <h1 className="math-lab-title">Vedika Math Lab</h1>
            <p className="math-lab-subtitle">
              Smart Crop Selection OCR & Interactive Visual Experiments
            </p>
          </div>
        </header>

        {/* 2. TAB SWITCHER CAPSULE (Whiteboard / Graph / AI Math Solve) */}
        <div className="math-lab-tabs-bar" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'whiteboard'}
            className={`math-lab-tab ${activeTab === 'whiteboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('whiteboard')}
          >
            <PenLine size={15} />
            <span>Whiteboard</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'graph'}
            className={`math-lab-tab ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <LineChart size={15} />
            <span>Graph</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'ai_solver'}
            className={`math-lab-tab ${activeTab === 'ai_solver' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai_solver')}
          >
            <Sparkles size={15} />
            <span>AI Math Solve</span>
          </button>
        </div>

        {/* 3. TAB CONTENT */}
        {activeTab === 'whiteboard' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* SMART HANDWRITING WHITEBOARD CARD */}
            <section className="math-whiteboard-card" aria-label="Smart Handwriting Whiteboard">

              {/* Card Header with Expand toggle */}
              <div className="math-card-header">
                <div className="math-card-header-left">
                  <PenLine size={18} color="#C084FC" />
                  <span className="math-card-title">Smart Handwriting Whiteboard</span>
                </div>
                <button
                  type="button"
                  className="math-card-expand-btn"
                  onClick={() => setIsWhiteboardExpanded(prev => !prev)}
                  title={isWhiteboardExpanded ? "Collapse canvas view" : "Expand canvas view"}
                  aria-label={isWhiteboardExpanded ? "Collapse canvas" : "Expand canvas"}
                >
                  {isWhiteboardExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>

              {/* Toolbar: Pen, Select, Eraser, Trash */}
              <div className="math-toolbar" role="toolbar" aria-label="Drawing tools">
                <button
                  type="button"
                  className={`math-tool-btn ${drawTool === 'pen' ? 'active-pen' : ''}`}
                  onClick={() => switchTool('pen')}
                  title="Draw handwriting pen"
                >
                  <PenLine size={15} />
                  <span>Pen</span>
                </button>

                <button
                  type="button"
                  className={`math-tool-btn ${drawTool === 'select' ? 'active-select' : ''}`}
                  onClick={() => switchTool('select')}
                  title="Crop selection box"
                >
                  <Crop size={15} />
                  <span>Select</span>
                </button>

                <button
                  type="button"
                  className={`math-tool-btn ${drawTool === 'eraser' ? 'active-eraser' : ''}`}
                  onClick={() => switchTool('eraser')}
                  title="Erase handwriting strokes"
                >
                  <Eraser size={15} />
                  <span>Eraser</span>
                </button>

                <button
                  type="button"
                  className="math-tool-trash-btn"
                  onClick={clearWhiteboard}
                  title="Clear entire whiteboard"
                  aria-label="Clear whiteboard"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Dotted Matrix Canvas Area */}
              <div className={`math-whiteboard-canvas-wrap ${isWhiteboardExpanded ? 'expanded' : ''}`}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={isWhiteboardExpanded ? 540 : 390}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="math-whiteboard-canvas"
                  style={{
                    cursor: drawTool === 'select' ? 'crosshair' : drawTool === 'pen' ? 'crosshair' : 'default'
                  }}
                />

                {/* Crop Bounding Box Overlay */}
                {(cropBox.isSelecting || cropBox.isSelected) && (
                  <svg
                    viewBox={`0 0 600 ${isWhiteboardExpanded ? 540 : 390}`}
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  >
                    <rect
                      x={cropBox.x}
                      y={cropBox.y}
                      width={cropBox.w}
                      height={cropBox.h}
                      fill="rgba(236, 72, 153, 0.18)"
                      stroke="#EC4899"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                    <circle cx={cropBox.x} cy={cropBox.y} r={5} fill="#FFF" />
                    <circle cx={cropBox.x + cropBox.w} cy={cropBox.y} r={5} fill="#FFF" />
                    <circle cx={cropBox.x} cy={cropBox.y + cropBox.h} r={5} fill="#FFF" />
                    <circle cx={cropBox.x + cropBox.w} cy={cropBox.y + cropBox.h} r={5} fill="#FFF" />
                  </svg>
                )}

                {/* Floating button for Selected Box */}
                {cropBox.isSelected && (
                  <button
                    type="button"
                    onClick={() => handleRecognizeCanvas(true)}
                    style={{
                      position: 'absolute',
                      top: Math.max(12, ((cropBox.y * (isWhiteboardExpanded ? 540 : 390)) / (isWhiteboardExpanded ? 540 : 390)) - 42),
                      left: Math.max(12, cropBox.x),
                      zIndex: 20,
                      background: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
                      color: '#FFF',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(236, 72, 153, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Sparkles size={14} /> Analyze Selected Box
                  </button>
                )}
              </div>
            </section>

            {/* 4. FULL-WIDTH RECOGNIZE BUTTON */}
            <button
              type="button"
              className="math-recognize-full-btn"
              onClick={() => handleRecognizeCanvas(cropBox.isSelected)}
              disabled={isRecognizing}
            >
              <Sparkles size={18} />
              <span>
                {isRecognizing
                  ? 'Analyzing Handwriting...'
                  : cropBox.isSelected
                  ? 'Recognize Selected Region'
                  : 'Recognize Full Whiteboard'}
              </span>
            </button>

            {/* AI OCR Detection & Quick Actions Card */}
            {aiExplanation && (
              <div className="math-ai-solution-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#C084FC', fontWeight: 700, fontSize: 14 }}>
                    <Sparkles size={16} /> AI OCR Detection
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('graph')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        background: 'rgba(168, 85, 247, 0.2)',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      View in Graph ➔
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('ai_solver');
                        if (recognizedText) {
                          setTutorQuery(`Solve and explain step by step: ${recognizedText}`);
                          handleAskTutor(`Solve and explain step by step: ${recognizedText}`);
                        }
                      }}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(236, 72, 153, 0.4)',
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(168, 85, 247, 0.25))',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      Solve with AI ➔
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#E2E8F0', margin: 0, lineHeight: 1.5 }}>
                  {aiExplanation}
                </p>
                {recognizedText && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 10, fontFamily: 'monospace', color: '#F472B6', fontSize: 15, fontWeight: 700 }}>
                    Detected Equation: {recognizedText}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 5. TAB 2: GRAPH PLOTTER & VISUAL CONCEPTS */}
        {activeTab === 'graph' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="math-graph-card" aria-label="Real-Time 2D Graph Plotter">
              
              {/* Header */}
              <div className="math-card-header">
                <div className="math-card-header-left">
                  <LineChart size={18} color="#C084FC" />
                  <span className="math-card-title">Real-Time 2D Graph Plotter</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setZoomScale(p => Math.min(p + 5, 60))}
                    className="math-card-expand-btn"
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomScale(p => Math.max(p - 5, 15))}
                    className="math-card-expand-btn"
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <ZoomOut size={14} />
                  </button>
                </div>
              </div>

              {/* Active Curve Banner */}
              <div className="math-curve-badge">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Active 2D Curve
                  </span>
                  {recognizedText && (
                    <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      Handwritten: {recognizedText}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#F472B6', fontFamily: 'monospace' }}>
                    {getFormattedFormula()}
                  </span>
                  <span style={{ fontSize: 12, color: '#A78BFA', fontWeight: 600 }}>
                    ({plotMode === 'linear' ? 'Linear Line' : plotMode === 'vertical' ? 'Vertical Line' : plotMode === 'quadratic' ? 'Parabola' : plotMode === 'sine' ? 'Sine Wave' : 'Curve'})
                  </span>
                </div>
              </div>

              {/* Graph Canvas */}
              <div className="math-graph-canvas-wrap">
                <canvas
                  ref={graphCanvasRef}
                  width={600}
                  height={300}
                  onMouseMove={handleGraphMouseMove}
                  onMouseLeave={() => setHoverCoord(null)}
                  className="math-graph-canvas"
                />
                {hoverCoord && (
                  <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 8px', borderRadius: 6, fontSize: 11, color: '#A78BFA' }}>
                    x: {hoverCoord.x.toFixed(2)}, y: {hoverCoord.y.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Quick Mode Presets */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {[
                  { id: 'linear', label: 'Linear' },
                  { id: 'quadratic', label: 'Quadratic' },
                  { id: 'sine', label: 'Sine' },
                  { id: 'cubic', label: 'Cubic' },
                  { id: 'vertical', label: 'Vertical' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPlotMode(m.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 10,
                      border: plotMode === m.id ? '1px solid #A855F7' : '1px solid rgba(255,255,255,0.08)',
                      background: plotMode === m.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: plotMode === m.id ? '#FFFFFF' : '#94A3B8',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Live Parameter Sliders */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#C084FC', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={14} /> Live Parameter Sliders
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Slope/Scale (a):</span> <b>{paramA}</b>
                    </label>
                    <input
                      type="range"
                      min={Math.min(-10, Math.floor(paramA - 2))}
                      max={Math.max(10, Math.ceil(paramA + 2))}
                      step="0.5"
                      value={paramA}
                      onChange={e => setParamA(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#A855F7' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Intercept/Offset (c):</span> <b>{paramC}</b>
                    </label>
                    <input
                      type="range"
                      min={Math.min(-15, Math.floor(paramC - 2))}
                      max={Math.max(15, Math.ceil(paramC + 2))}
                      step="0.5"
                      value={paramC}
                      onChange={e => setParamC(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#10B981' }}
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Visual Concepts */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Triangle size={14} color="#EC4899" /> Interactive Visual Concepts
                </div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
                  {[
                    { id: 'pythagoras', label: 'Pythagoras', icon: Triangle },
                    { id: 'sector', label: 'Circle Sector', icon: Compass },
                    { id: 'solid', label: '3D Solid Surface', icon: Box },
                    { id: 'trig', label: 'Trigonometry', icon: Circle },
                    { id: 'calculus', label: 'Calculus', icon: TrendingUp }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setVisualizerSubTab(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: 'none',
                        background: visualizerSubTab === id ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: visualizerSubTab === id ? '#C084FC' : '#94A3B8',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 8 }}>
                  {visualizerSubTab === 'pythagoras' && (
                    <DynamicMathVisualizer spec={{ type: 'triangle', title: 'Pythagoras Proof Visualizer', params: { base: pythA, height: pythB } }} />
                  )}
                  {visualizerSubTab === 'sector' && (
                    <DynamicMathVisualizer spec={{ type: 'sector', title: 'Circle Sector & Clock Hand Visualizer', params: { radius: 10, angle: 30 } }} />
                  )}
                  {visualizerSubTab === 'solid' && (
                    <DynamicMathVisualizer spec={{ type: 'solid_surface', title: '3D Cylinder & Solid Surface Area Visualizer', params: { radius: 7, height: 14 } }} />
                  )}
                  {visualizerSubTab === 'trig' && (
                    <DynamicMathVisualizer spec={{ type: 'circle', title: 'Unit Circle Visualizer', params: { radius: 5 } }} />
                  )}
                  {visualizerSubTab === 'calculus' && (
                    <DynamicMathVisualizer spec={{ type: 'area_under_curve', title: 'Calculus Integral Area Visualizer', params: { a: 0, b: 3, func: 'x^2' } }} />
                  )}
                </div>
              </div>

            </section>
          </div>
        )}

        {/* 6. TAB 3: AI MATH SOLVER (Dedicated 3rd Option) */}
        {activeTab === 'ai_solver' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section className="math-solver-card" aria-label="AI Step-by-Step Math Solver">
              {/* Header */}
              <div className="math-card-header" style={{ marginBottom: 4 }}>
                <div className="math-card-header-left">
                  <Sparkles size={18} color="#C084FC" />
                  <span className="math-card-title">AI Step-by-Step Math Solver</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 12px', lineHeight: 1.45 }}>
                Type or speak any equation or textbook math problem. Get instant formatted step-by-step solutions, formulas, and dynamic diagrams.
              </p>

              {/* Input Bar */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <input
                  type="text"
                  value={tutorQuery}
                  onChange={(e) => setTutorQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
                  placeholder="e.g. Total surface area formed by joining cylinder and hemisphere..."
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: isListening ? '1.5px solid #EC4899' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFF',
                    fontSize: 13.5,
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Stop listening" : "Speak math question"}
                  style={{
                    padding: '0 14px',
                    borderRadius: 14,
                    border: isListening ? '1.5px solid #EC4899' : '1px solid rgba(168, 85, 247, 0.3)',
                    background: isListening ? 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)' : 'rgba(168, 85, 247, 0.12)',
                    color: '#FFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isListening ? '0 0 16px rgba(236, 72, 153, 0.5)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Mic size={17} color={isListening ? '#FFF' : '#C084FC'} />
                </button>
                <button
                  type="button"
                  onClick={() => handleAskTutor()}
                  disabled={isTutorThinking}
                  style={{
                    padding: '0 18px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: isTutorThinking ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 0 18px rgba(236, 72, 153, 0.45)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Send size={15} />
                  <span>{isTutorThinking ? 'Solving...' : 'Solve'}</span>
                </button>
              </div>

              {/* Quick Try Pills */}
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Quick Try Problems:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    "Surface area of cylinder joined with hemisphere",
                    "Area swept by 10cm minute hand in 5 minutes",
                    "Total area cleaned by two 40cm wipers sweeping 115°",
                    "Find hypotenuse of right triangle with base 6 and height 8",
                    "Solve quadratic equation 2x² - 4x - 6 = 0"
                  ].map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => { setTutorQuery(ex); handleAskTutor(ex); }}
                      style={{
                        padding: '5px 11px',
                        borderRadius: 16,
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        background: 'rgba(168, 85, 247, 0.08)',
                        color: '#C4B5FD',
                        fontSize: 11.5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tutor Response */}
              {(tutorResponse || isTutorThinking) && (
                <div ref={tutorResponseRef} style={{ marginTop: 16 }}>
                  {isTutorThinking ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#C084FC', padding: '16px 12px', fontSize: 13 }}>
                      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Solving math problem and generating step-by-step derivation...</span>
                    </div>
                  ) : (
                    <div className="math-ai-solution-card" style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontWeight: 700, fontSize: 14 }}>
                          <Lightbulb size={18} /> Step-by-Step AI Solution
                        </div>
                        {recognizedText && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('graph')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              background: 'rgba(168, 85, 247, 0.15)',
                              color: '#E9D5FF',
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Plot in Graph ➔
                          </button>
                        )}
                      </div>
                      <CustomMathMarkdown content={tutorResponse} />
                      {parsedVisualSpec && (
                        <SafeMathRenderer>
                          <DynamicMathVisualizer spec={parsedVisualSpec} />
                        </SafeMathRenderer>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
