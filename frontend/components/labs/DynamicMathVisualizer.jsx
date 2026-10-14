'use client';

import React, { useState, useEffect } from 'react';
import { Box, Sliders } from 'lucide-react';

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

export default function DynamicMathVisualizer({ spec }) {
  const [params, setParams] = useState(spec?.params || {});

  useEffect(() => {
    if (spec?.params) setParams(spec.params);
  }, [spec]);

  if (!spec || !spec.type) return null;

  const updateParam = (key, val) => {
    setParams((prev) => ({ ...prev, [key]: parseFloat(val) }));
  };

  const isAngleType = ['angles', 'supplementary_angles', 'complementary_angles', 'ratio_angles'].includes(spec.type);
  const isTriangleType = ['triangle', 'right_triangle', 'pythagoras'].includes(spec.type);
  const isSectorType = ['sector', 'circle_sector'].includes(spec.type);
  const isSolidType = ['solid_surface', '3d_surface', 'cylinder'].includes(spec.type);
  const isCircleType = ['circle', 'unit_circle'].includes(spec.type);
  const isAreaUnderCurve = ['area_under_curve', 'integral'].includes(spec.type);
  const isElevationDepression = ['elevation_depression', 'heights_distances', 'elevation', 'depression'].includes(spec.type);
  const isCoordGeo = ['coordinate_geometry', 'section_formula', 'distance_midpoint'].includes(spec.type);
  const isParabola = ['quadratic_parabola', 'parabola', 'quadratic'].includes(spec.type);
  const isTrapezoid = ['trapezoid', 'trapezium', 'quadrilateral'].includes(spec.type);
  const isCone = ['cone', 'cone_surface'].includes(spec.type);
  const isSphere = ['sphere_hemisphere', 'sphere', 'hemisphere'].includes(spec.type);
  const isCompositeSolid = ['composite_solid', 'composite_3d'].includes(spec.type);
  const isVenn = ['venn_diagram', 'venn', 'sets'].includes(spec.type);
  const isBellCurve = ['bell_curve', 'normal_distribution', 'gaussian'].includes(spec.type);
  const isVector = ['vector_addition', 'parallelogram_law', 'vectors'].includes(spec.type);
  const isTangent = ['tangent_derivative', 'tangent', 'derivative'].includes(spec.type);
  const isNumberLine = ['number_line_inequality', 'number_line', 'inequality'].includes(spec.type);

  return (
    <div
      style={{
        marginTop: 16,
        background: 'rgba(10, 15, 28, 0.95)',
        borderRadius: 16,
        border: '1px solid rgba(168, 85, 247, 0.35)',
        padding: '16px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Box size={18} color="#C084FC" />
          <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#FFF' }}>
            {spec.title || 'Dynamic Math Visualizer'}
          </h4>
        </div>
        <span
          style={{
            fontSize: 11,
            background: 'rgba(168, 85, 247, 0.2)',
            color: '#E9D5FF',
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          Interactive Canvas
        </span>
      </div>

      <div
        className="math-visualizer-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 14,
          alignItems: 'start',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* SVG VISUALIZER CANVAS */}
        <div
          style={{
            background: '#070B16',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '10px 8px',
            textAlign: 'center',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
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
              margin: '0 auto',
            }}
          >
            {/* 1. ANGLES / SUPPLEMENTARY / COMPLEMENTARY */}
            {isAngleType && (() => {
              const totalAngle = params.totalAngle || (spec.type === 'complementary_angles' ? 90 : 180);
              const angle1 = params.angle1 !== undefined ? params.angle1 : (totalAngle === 180 ? 36 : 30);
              const angle2 = totalAngle - angle1;

              const cx = 190, cy = 190, r = 110;
              const rad1 = (angle1 * Math.PI) / 180;
              const radTotal = (totalAngle * Math.PI) / 180;

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
                  <line x1={cx - (totalAngle === 180 ? r : 0)} y1={cy} x2={cx + r} y2={cy} stroke="#6B7280" strokeWidth="2.5" />
                  {totalAngle === 90 && <line x1={cx} y1={cy} x2={cx} y2={cy - r} stroke="#6B7280" strokeWidth="2.5" />}
                  <line x1={cx} y1={cy} x2={xRay1} y2={yRay1} stroke="#EC4899" strokeWidth="3" />
                  <path d={arc1Path} fill="rgba(236, 72, 153, 0.3)" stroke="#EC4899" strokeWidth="1.5" />
                  <path d={arc2Path} fill="rgba(6, 182, 212, 0.3)" stroke="#06B6D4" strokeWidth="1.5" />
                  <circle cx={cx} cy={cy} r={4} fill="#FFF" />
                  <text x={cx + 55 * Math.cos(rad1 / 2)} y={cy - 55 * Math.sin(rad1 / 2)} fill="#EC4899" fontSize="13" fontWeight="bold">
                    {angle1}°
                  </text>
                  <text x={cx + 60 * Math.cos(rad1 + (radTotal - rad1) / 2)} y={cy - 60 * Math.sin(rad1 + (radTotal - rad1) / 2)} fill="#06B6D4" fontSize="13" fontWeight="bold">
                    {angle2}°
                  </text>
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

            {/* 2. TRIANGLE / PYTHAGORAS */}
            {isTriangleType && (() => {
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
                  <polygon points={`${ox},${oy} ${ox + bx},${oy} ${ox},${oy - hy}`} fill="rgba(139, 92, 246, 0.25)" stroke="#8B5CF6" strokeWidth="3" />
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

            {/* 3. CIRCLE SECTOR */}
            {isSectorType && (() => {
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

            {/* 4. SOLID CYLINDER */}
            {isSolidType && (() => {
              const r = params.radius || 7;
              const h = params.height || 14;
              const cx = 190, cy = 135;
              const cr = 48;
              const ch = 85;
              const tsa = (2 * Math.PI * r * h + 2 * Math.PI * r * r).toFixed(1);
              const vol = (Math.PI * r * r * h).toFixed(1);

              return (
                <g>
                  <rect x={cx - cr} y={cy - ch / 2} width={cr * 2} height={ch} fill="rgba(139, 92, 246, 0.2)" stroke="#8B5CF6" strokeWidth="2.5" />
                  <ellipse cx={cx} cy={cy - ch / 2} rx={cr} ry={15} fill="rgba(236, 72, 153, 0.3)" stroke="#EC4899" strokeWidth="2" />
                  <ellipse cx={cx} cy={cy + ch / 2} rx={cr} ry={15} fill="rgba(139, 92, 246, 0.3)" stroke="#8B5CF6" strokeWidth="2" />
                  <line x1={cx - cr - 15} y1={cy - ch / 2} x2={cx - cr - 15} y2={cy + ch / 2} stroke="#F59E0B" strokeWidth="2" strokeDasharray="4" />
                  <text x={cx - cr - 25} y={cy} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="end">h = {h}</text>
                  <line x1={cx} y1={cy - ch / 2} x2={cx + cr} y2={cy - ch / 2} stroke="#06B6D4" strokeWidth="2" />
                  <text x={cx + cr / 2} y={cy - ch / 2 - 6} fill="#06B6D4" fontSize="11" fontWeight="bold" textAnchor="middle">r = {r}</text>
                  <rect x={160} y={15} width={205} height={36} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={262.5} y={37} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    TSA = {tsa} | Vol = {vol}
                  </text>
                </g>
              );
            })()}

            {/* 5. CIRCLE */}
            {isCircleType && (() => {
              const r = params.radius || 5;
              const cx = 190, cy = 135;
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
                  <rect x={20} y={15} width={150} height={50} rx={8} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
                  <text x={30} y={35} fill="#EC4899" fontSize="12" fontWeight="bold">Area = πr² = {area}</text>
                  <text x={30} y={52} fill="#06B6D4" fontSize="12" fontWeight="bold">Perimeter = {perimeter}</text>
                </g>
              );
            })()}

            {/* 6. AREA UNDER CURVE / CALCULUS */}
            {isAreaUnderCurve && (() => {
              const a = params.a !== undefined ? params.a : 0;
              const b = params.b !== undefined ? params.b : 3;
              const cx = 80, cy = 205, scaleX = 40, scaleY = 15;
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
                  <rect x={210} y={15} width={155} height={40} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={287.5} y={38} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    ∫ Area = {calcArea.toFixed(2)}
                  </text>
                </g>
              );
            })()}

            {/* 7. HEIGHTS & DISTANCES (ELEVATION & DEPRESSION) */}
            {isElevationDepression && (() => {
              const distance = params.distance || 50;
              const angle = params.angle || 30;
              const rad = (angle * Math.PI) / 180;
              const calcH = distance * Math.tan(rad);
              const hypot = Math.sqrt(distance * distance + calcH * calcH).toFixed(1);

              const ox = 70, oy = 215;
              const tx = 275;
              const hScaled = Math.min(145, Math.max(30, (tx - ox) * Math.tan(rad)));
              const ty = oy - hScaled;

              return (
                <g>
                  {/* Ground */}
                  <line x1={20} y1={oy} x2={360} y2={oy} stroke="#4B5563" strokeWidth="2.5" />
                  {/* Observer */}
                  <circle cx={ox} cy={oy - 12} r={6} fill="#38BDF8" />
                  <line x1={ox} y1={oy - 6} x2={ox} y2={oy} stroke="#38BDF8" strokeWidth="2" />
                  {/* Building / Tower */}
                  <rect x={tx} y={ty} width={45} height={hScaled} fill="rgba(139, 92, 246, 0.25)" stroke="#8B5CF6" strokeWidth="2" />
                  <line x1={tx + 22.5} y1={ty} x2={tx + 22.5} y2={ty - 14} stroke="#C084FC" strokeWidth="2" />
                  <circle cx={tx + 22.5} cy={ty - 14} r={3} fill="#EC4899" />
                  {/* Line of Sight */}
                  <line x1={ox} y1={oy - 12} x2={tx} y2={ty} stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="4,2" />
                  {/* Right Angle Marker */}
                  <path d={`M ${tx - 10},${oy} L ${tx - 10},${oy - 10} L ${tx},${oy - 10}`} fill="none" stroke="#FFF" strokeWidth="1.5" />
                  {/* Angle Arc */}
                  <path d={`M ${ox + 25},${oy} A 25 25 0 0 0 ${ox + 25 * Math.cos(rad)},${oy - 25 * Math.sin(rad)}`} fill="none" stroke="#EC4899" strokeWidth="2" />
                  <text x={ox + 35} y={oy - 8} fill="#EC4899" fontSize="12" fontWeight="bold">{angle}°</text>
                  {/* Dimensions */}
                  <text x={(ox + tx) / 2} y={oy + 18} fill="#06B6D4" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Distance d = {distance}m
                  </text>
                  <text x={tx + 52} y={ty + hScaled / 2} fill="#F59E0B" fontSize="12" fontWeight="bold">
                    h = {calcH.toFixed(1)}m
                  </text>
                  {/* Formula Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(6, 182, 212, 0.18)" stroke="#06B6D4" />
                  <text x={190} y={37} fill="#E0F2FE" fontSize="12" fontWeight="bold" textAnchor="middle">
                    tan({angle}°) = h / {distance}  ➔  Height h = {calcH.toFixed(1)}m | Hyp = {hypot}m
                  </text>
                </g>
              );
            })()}

            {/* 8. COORDINATE GEOMETRY & SECTION FORMULA */}
            {isCoordGeo && (() => {
              const x1 = params.x1 !== undefined ? params.x1 : 2;
              const y1 = params.y1 !== undefined ? params.y1 : 3;
              const x2 = params.x2 !== undefined ? params.x2 : 8;
              const y2 = params.y2 !== undefined ? params.y2 : 9;
              const m = params.m || 2;
              const n = params.n || 1;

              const px = (m * x2 + n * x1) / (m + n);
              const py = (m * y2 + n * y1) / (m + n);
              const dist = Math.hypot(x2 - x1, y2 - y1);

              const ox = 60, oy = 215, sc = 24;
              const ax = ox + x1 * sc, ay = oy - y1 * sc;
              const bx = ox + x2 * sc, by = oy - y2 * sc;
              const divX = ox + px * sc, divY = oy - py * sc;

              return (
                <g>
                  {/* Grid Lines */}
                  <line x1={ox} y1={20} x2={ox} y2={oy} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <line x1={ox} y1={oy} x2={360} y2={oy} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  {/* Segment AB */}
                  <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#A855F7" strokeWidth="3" />
                  {/* Projection Triangle */}
                  <line x1={ax} y1={ay} x2={bx} y2={ay} stroke="#6B7280" strokeWidth="1.5" strokeDasharray="3" />
                  <line x1={bx} y1={ay} x2={bx} y2={by} stroke="#6B7280" strokeWidth="1.5" strokeDasharray="3" />
                  {/* Points */}
                  <circle cx={ax} cy={ay} r={5} fill="#06B6D4" />
                  <text x={ax - 8} y={ay - 8} fill="#06B6D4" fontSize="11" fontWeight="bold">A({x1},{y1})</text>
                  <circle cx={bx} cy={by} r={5} fill="#EC4899" />
                  <text x={bx + 8} y={by - 8} fill="#EC4899" fontSize="11" fontWeight="bold">B({x2},{y2})</text>
                  {/* Division Point P */}
                  <circle cx={divX} cy={divY} r={6} fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />
                  <text x={divX + 8} y={divY + 16} fill="#F59E0B" fontSize="12" fontWeight="bold">
                    P({px.toFixed(1)}, {py.toFixed(1)})
                  </text>
                  {/* Calculation Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(168, 85, 247, 0.2)" stroke="#A855F7" />
                  <text x={190} y={37} fill="#F3E8FF" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Ratio {m}:{n} ➔ P({px.toFixed(1)}, {py.toFixed(1)}) | Distance AB = {dist.toFixed(2)}
                  </text>
                </g>
              );
            })()}

            {/* 9. QUADRATIC PARABOLA & ROOTS EXPLORER */}
            {isParabola && (() => {
              const a = params.a !== undefined ? params.a : 1;
              const b = params.b !== undefined ? params.b : -4;
              const c = params.c !== undefined ? params.c : 3;

              const D = b * b - 4 * a * c;
              const vx = -b / (2 * a);
              const vy = a * vx * vx + b * vx + c;

              const cx = 190, cy = 140, scX = 22, scY = 12;
              const pts = [];
              for (let x = -6; x <= 6; x += 0.2) {
                const yVal = a * x * x + b * x + c;
                const px = cx + x * scX;
                const py = cy - yVal * scY;
                if (py >= -20 && py <= 280) pts.push(`${px},${py}`);
              }

              let r1 = null, r2 = null;
              if (D >= 0) {
                r1 = (-b - Math.sqrt(D)) / (2 * a);
                r2 = (-b + Math.sqrt(D)) / (2 * a);
              }

              return (
                <g>
                  {/* Axes */}
                  <line x1={20} y1={cy} x2={360} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <line x1={cx} y1={20} x2={cx} y2={250} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  {/* Axis of Symmetry */}
                  <line x1={cx + vx * scX} y1={20} x2={cx + vx * scX} y2={250} stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3" />
                  {/* Parabola Curve */}
                  {pts.length > 2 && <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#38BDF8" strokeWidth="3" />}
                  {/* Vertex */}
                  <circle cx={cx + vx * scX} cy={cy - vy * scY} r={5} fill="#C084FC" stroke="#FFF" strokeWidth="1.5" />
                  <text x={cx + vx * scX + 8} y={cy - vy * scY - 8} fill="#C084FC" fontSize="11" fontWeight="bold">
                    V({vx.toFixed(1)}, {vy.toFixed(1)})
                  </text>
                  {/* Roots */}
                  {r1 !== null && (
                    <>
                      <circle cx={cx + r1 * scX} cy={cy} r={5} fill="#10B981" />
                      <circle cx={cx + r2 * scX} cy={cy} r={5} fill="#10B981" />
                      <text x={cx + r1 * scX} y={cy + 16} fill="#10B981" fontSize="11" fontWeight="bold" textAnchor="middle">
                        x₁={r1.toFixed(1)}
                      </text>
                      <text x={cx + r2 * scX} y={cy + 16} fill="#10B981" fontSize="11" fontWeight="bold" textAnchor="middle">
                        x₂={r2.toFixed(1)}
                      </text>
                    </>
                  )}
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(56, 189, 248, 0.18)" stroke="#38BDF8" />
                  <text x={190} y={37} fill="#E0F2FE" fontSize="12" fontWeight="bold" textAnchor="middle">
                    D = {D.toFixed(1)} ({D > 0 ? '2 Roots' : D === 0 ? '1 Root' : 'No Real Roots'}) | Vertex ({vx.toFixed(1)}, {vy.toFixed(1)})
                  </text>
                </g>
              );
            })()}

            {/* 10. TRAPEZOID & QUADRILATERAL */}
            {isTrapezoid && (() => {
              const a = params.a || 10;
              const b = params.b || 18;
              const h = params.h || 8;
              const area = 0.5 * (a + b) * h;

              const sc = Math.min(10, 240 / Math.max(b, 1));
              const topW = a * sc;
              const botW = b * sc;
              const hScaled = Math.min(110, h * sc);

              const cx = 190, cy = 145;
              const yTop = cy - hScaled / 2;
              const yBot = cy + hScaled / 2;

              const x1 = cx - topW / 2, x2 = cx + topW / 2;
              const x3 = cx + botW / 2, x4 = cx - botW / 2;

              return (
                <g>
                  <polygon points={`${x1},${yTop} ${x2},${yTop} ${x3},${yBot} ${x4},${yBot}`} fill="rgba(139, 92, 246, 0.25)" stroke="#8B5CF6" strokeWidth="2.5" />
                  {/* Altitude */}
                  <line x1={x1} y1={yTop} x2={x1} y2={yBot} stroke="#F59E0B" strokeWidth="2" strokeDasharray="4" />
                  <path d={`M ${x1},${yBot - 10} L ${x1 + 10},${yBot - 10} L ${x1 + 10},${yBot}`} fill="none" stroke="#FFF" strokeWidth="1.5" />
                  <text x={x1 - 10} y={(yTop + yBot) / 2} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="end">h={h}</text>
                  <text x={cx} y={yTop - 8} fill="#06B6D4" fontSize="12" fontWeight="bold" textAnchor="middle">Top a = {a}</text>
                  <text x={cx} y={yBot + 18} fill="#38BDF8" fontSize="12" fontWeight="bold" textAnchor="middle">Bottom b = {b}</text>
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={190} y={37} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Trapezoid Area = ½ × ({a} + {b}) × {h} = {area.toFixed(1)}
                  </text>
                </g>
              );
            })()}

            {/* 11. CONE */}
            {isCone && (() => {
              const r = params.radius || 6;
              const h = params.height || 8;
              const l = Math.hypot(r, h);
              const csa = Math.PI * r * l;
              const vol = (1 / 3) * Math.PI * r * r * h;

              const cx = 190, cy = 195;
              const cr = 60, ch = 110;
              const apexY = cy - ch;

              return (
                <g>
                  {/* Base Ellipse */}
                  <ellipse cx={cx} cy={cy} rx={cr} ry={18} fill="rgba(139, 92, 246, 0.25)" stroke="#8B5CF6" strokeWidth="2" />
                  {/* Sides */}
                  <path d={`M ${cx - cr},${cy} L ${cx},${apexY} L ${cx + cr},${cy}`} fill="rgba(236, 72, 153, 0.15)" stroke="#EC4899" strokeWidth="2.5" />
                  {/* Altitude */}
                  <line x1={cx} y1={apexY} x2={cx} y2={cy} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3" />
                  <line x1={cx} y1={cy} x2={cx + cr} y2={cy} stroke="#06B6D4" strokeWidth="2" />
                  <text x={cx + cr / 2} y={cy + 14} fill="#06B6D4" fontSize="11" fontWeight="bold" textAnchor="middle">r={r}</text>
                  <text x={cx - 10} y={apexY + ch / 2} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="end">h={h}</text>
                  <text x={cx + cr / 2 + 15} y={apexY + ch / 2} fill="#EC4899" fontSize="11" fontWeight="bold">l={l.toFixed(1)}</text>
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(236, 72, 153, 0.2)" stroke="#EC4899" />
                  <text x={190} y={37} fill="#FDF2F8" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Slant l = {l.toFixed(1)} | CSA = {csa.toFixed(1)} | Vol = {vol.toFixed(1)}
                  </text>
                </g>
              );
            })()}

            {/* 12. SPHERE & HEMISPHERE */}
            {isSphere && (() => {
              const r = params.radius || 7;
              const isHemi = params.mode === 'hemisphere' || spec.type === 'hemisphere';
              const cx = 190, cy = 145, cr = 65;

              const csa = isHemi ? 2 * Math.PI * r * r : 4 * Math.PI * r * r;
              const tsa = isHemi ? 3 * Math.PI * r * r : 4 * Math.PI * r * r;
              const vol = isHemi ? (2 / 3) * Math.PI * Math.pow(r, 3) : (4 / 3) * Math.PI * Math.pow(r, 3);

              return (
                <g>
                  {isHemi ? (
                    <>
                      <path d={`M ${cx - cr},${cy} A ${cr} ${cr} 0 0 1 ${cx + cr},${cy} Z`} fill="rgba(56, 189, 248, 0.25)" stroke="#38BDF8" strokeWidth="2.5" />
                      <ellipse cx={cx} cy={cy} rx={cr} ry={18} fill="rgba(168, 85, 247, 0.3)" stroke="#A855F7" strokeWidth="2" />
                      <line x1={cx} y1={cy} x2={cx + cr} y2={cy} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3" />
                      <text x={cx + cr / 2} y={cy - 6} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle">r={r}</text>
                    </>
                  ) : (
                    <>
                      <circle cx={cx} cy={cy} r={cr} fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" strokeWidth="2.5" />
                      <ellipse cx={cx} cy={cy} rx={cr} ry={20} fill="none" stroke="rgba(255,255,255,0.3)" strokeDasharray="4" />
                      <line x1={cx} y1={cy} x2={cx + cr} y2={cy} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3" />
                      <text x={cx + cr / 2} y={cy - 6} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle">r={r}</text>
                    </>
                  )}
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" />
                  <text x={190} y={37} fill="#E0F2FE" fontSize="12" fontWeight="bold" textAnchor="middle">
                    {isHemi ? 'Hemisphere' : 'Sphere'} TSA = {tsa.toFixed(1)} | Volume = {vol.toFixed(1)}
                  </text>
                </g>
              );
            })()}

            {/* 13. COMPOSITE SOLID (Cylinder + Hemisphere / Cone) */}
            {isCompositeSolid && (() => {
              const r = params.radius || 3.5;
              const hCyl = params.height || 10;
              const cx = 190, cy = 150, cr = 45, ch = 75;

              return (
                <g>
                  {/* Hemisphere on top */}
                  <path d={`M ${cx - cr},${cy - ch / 2} A ${cr} ${cr} 0 0 1 ${cx + cr},${cy - ch / 2} Z`} fill="rgba(236, 72, 153, 0.25)" stroke="#EC4899" strokeWidth="2" />
                  {/* Cylinder Body */}
                  <rect x={cx - cr} y={cy - ch / 2} width={cr * 2} height={ch} fill="rgba(139, 92, 246, 0.2)" stroke="#8B5CF6" strokeWidth="2" />
                  <ellipse cx={cx} cy={cy - ch / 2} rx={cr} ry={12} fill="none" stroke="rgba(255,255,255,0.4)" strokeDasharray="3" />
                  <ellipse cx={cx} cy={cy + ch / 2} rx={cr} ry={12} fill="rgba(139, 92, 246, 0.3)" stroke="#8B5CF6" strokeWidth="2" />
                  {/* Labels */}
                  <text x={cx} y={cy - ch / 2 - 18} fill="#EC4899" fontSize="11" fontWeight="bold" textAnchor="middle">Hemisphere (r={r})</text>
                  <text x={cx - cr - 12} y={cy} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="end">h={hCyl}</text>
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={190} y={37} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Composite Solid: Joined at Boundary (r = {r})
                  </text>
                </g>
              );
            })()}

            {/* 14. VENN DIAGRAM */}
            {isVenn && (() => {
              const nA = params.onlyA !== undefined ? params.onlyA + (params.both || 10) : 30;
              const nB = params.onlyB !== undefined ? params.onlyB + (params.both || 10) : 25;
              const both = params.both || 10;
              const onlyA = nA - both;
              const onlyB = nB - both;
              const total = params.total || 50;
              const neither = Math.max(0, total - (onlyA + onlyB + both));

              return (
                <g>
                  {/* Universal Set U */}
                  <rect x={35} y={65} width={310} height={170} rx={10} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
                  <text x={50} y={85} fill="#94A3B8" fontSize="11" fontWeight="bold">Universal Set U ({total})</text>
                  {/* Circle A */}
                  <circle cx={155} cy={155} r={55} fill="rgba(6, 182, 212, 0.2)" stroke="#06B6D4" strokeWidth="2" />
                  <text x={115} y={115} fill="#06B6D4" fontSize="12" fontWeight="bold">Set A ({nA})</text>
                  {/* Circle B */}
                  <circle cx={225} cy={155} r={55} fill="rgba(236, 72, 153, 0.2)" stroke="#EC4899" strokeWidth="2" />
                  <text x={265} y={115} fill="#EC4899" fontSize="12" fontWeight="bold">Set B ({nB})</text>
                  {/* Values in Regions */}
                  <text x={135} y={160} fill="#FFF" fontSize="14" fontWeight="bold" textAnchor="middle">{onlyA}</text>
                  <text x={190} y={160} fill="#F59E0B" fontSize="14" fontWeight="bold" textAnchor="middle">{both}</text>
                  <text x={245} y={160} fill="#FFF" fontSize="14" fontWeight="bold" textAnchor="middle">{onlyB}</text>
                  <text x={55} y={220} fill="#94A3B8" fontSize="11" fontWeight="bold">Neither: {neither}</text>
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(168, 85, 247, 0.2)" stroke="#A855F7" />
                  <text x={190} y={37} fill="#F3E8FF" fontSize="12" fontWeight="bold" textAnchor="middle">
                    |A ∪ B| = {onlyA + onlyB + both} | |A ∩ B| = {both} | Total U = {total}
                  </text>
                </g>
              );
            })()}

            {/* 15. BELL CURVE / NORMAL DISTRIBUTION */}
            {isBellCurve && (() => {
              const mean = params.mean || 70;
              const sd = params.sd || 10;
              const cx = 190, cy = 210;

              const pts = [];
              const fillPts = [];
              for (let x = -3.2; x <= 3.2; x += 0.1) {
                const yVal = Math.exp(-0.5 * x * x) * 110;
                const px = cx + x * 45;
                const py = cy - yVal;
                pts.push(`${px},${py}`);
                if (x >= -1 && x <= 1) fillPts.push(`${px},${py}`);
              }

              return (
                <g>
                  {/* Baseline */}
                  <line x1={30} y1={cy} x2={350} y2={cy} stroke="#6B7280" strokeWidth="2" />
                  {/* Shaded 1-sigma Area (68%) */}
                  <polygon points={`${cx - 45},${cy} ${fillPts.join(' ')} ${cx + 45},${cy}`} fill="rgba(16, 185, 129, 0.35)" />
                  {/* Bell Curve */}
                  <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#38BDF8" strokeWidth="3" />
                  {/* Mean Line */}
                  <line x1={cx} y1={cy} x2={cx} y2={cy - 110} stroke="#F59E0B" strokeWidth="2" strokeDasharray="3" />
                  <text x={cx} y={cy + 16} fill="#F59E0B" fontSize="11" fontWeight="bold" textAnchor="middle">μ={mean}</text>
                  {/* ±1σ Marks */}
                  <text x={cx - 45} y={cy + 16} fill="#10B981" fontSize="10" textAnchor="middle">{mean - sd}</text>
                  <text x={cx + 45} y={cy + 16} fill="#10B981" fontSize="10" textAnchor="middle">{mean + sd}</text>
                  <text x={cx} y={cy - 40} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">68.2%</text>
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={190} y={37} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Normal Curve (μ = {mean}, σ = {sd}) ➔ 68% within ±1σ [{mean - sd}, {mean + sd}]
                  </text>
                </g>
              );
            })()}

            {/* 16. VECTORS & PARALLELOGRAM LAW */}
            {isVector && (() => {
              const a = params.magA || 5;
              const b = params.magB || 12;
              const angle = params.angle || 90;
              const rad = (angle * Math.PI) / 180;

              const ox = 70, oy = 205;
              const ax = ox + a * 16, ay = oy;
              const bx = ox + b * 12 * Math.cos(rad);
              const by = oy - b * 12 * Math.sin(rad);
              const rx = ax + (bx - ox);
              const ry = ay + (by - oy);

              const R = Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(rad)).toFixed(2);

              return (
                <g>
                  {/* Parallelogram Ghost Lines */}
                  <line x1={ax} y1={ay} x2={rx} y2={ry} stroke="rgba(255,255,255,0.3)" strokeDasharray="3" />
                  <line x1={bx} y1={by} x2={rx} y2={ry} stroke="rgba(255,255,255,0.3)" strokeDasharray="3" />
                  {/* Vector A */}
                  <line x1={ox} y1={oy} x2={ax} y2={ay} stroke="#06B6D4" strokeWidth="3" markerEnd="url(#arrow-cyan)" />
                  <text x={(ox + ax) / 2} y={oy + 16} fill="#06B6D4" fontSize="11" fontWeight="bold">|A|={a}</text>
                  {/* Vector B */}
                  <line x1={ox} y1={oy} x2={bx} y2={by} stroke="#EC4899" strokeWidth="3" />
                  <text x={bx - 10} y={by - 8} fill="#EC4899" fontSize="11" fontWeight="bold">|B|={b}</text>
                  {/* Resultant R */}
                  <line x1={ox} y1={oy} x2={rx} y2={ry} stroke="#10B981" strokeWidth="3.5" />
                  <text x={rx + 8} y={ry} fill="#10B981" fontSize="12" fontWeight="bold">R = {R}</text>
                  {/* Angle Arc */}
                  <text x={ox + 20} y={oy - 8} fill="#F59E0B" fontSize="11" fontWeight="bold">{angle}°</text>
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" />
                  <text x={190} y={37} fill="#10B981" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Resultant R = √(A² + B² + 2AB cos θ) = {R}
                  </text>
                </g>
              );
            })()}

            {/* 17. TANGENT & DERIVATIVE */}
            {isTangent && (() => {
              const x0 = params.x0 !== undefined ? params.x0 : 2;
              const a = 1, b = -3, c = 2;
              const y0 = a * x0 * x0 + b * x0 + c;
              const slope = 2 * a * x0 + b;

              const cx = 190, cy = 150, scX = 26, scY = 16;
              const pts = [];
              for (let x = -2; x <= 5; x += 0.2) {
                const yVal = a * x * x + b * x + c;
                pts.push(`${cx + x * scX},${cy - yVal * scY}`);
              }

              const px = cx + x0 * scX;
              const py = cy - y0 * scY;
              const tanP1 = { x: px - 2 * scX, y: py + 2 * slope * scY };
              const tanP2 = { x: px + 2 * scX, y: py - 2 * slope * scY };

              return (
                <g>
                  {/* Axes */}
                  <line x1={20} y1={cy} x2={360} y2={cy} stroke="rgba(255,255,255,0.2)" />
                  <line x1={cx} y1={20} x2={cx} y2={250} stroke="rgba(255,255,255,0.2)" />
                  {/* Curve */}
                  <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#A855F7" strokeWidth="2.5" />
                  {/* Tangent Line */}
                  <line x1={tanP1.x} y1={tanP1.y} x2={tanP2.x} y2={tanP2.y} stroke="#06B6D4" strokeWidth="2.5" />
                  {/* Point of Tangency */}
                  <circle cx={px} cy={py} r={6} fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />
                  <text x={px + 8} y={py - 8} fill="#F59E0B" fontSize="12" fontWeight="bold">
                    P({x0}, {y0})
                  </text>
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(6, 182, 212, 0.2)" stroke="#06B6D4" />
                  <text x={190} y={37} fill="#E0F2FE" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Tangent at x={x0} ➔ Slope m = f'({x0}) = {slope.toFixed(1)}
                  </text>
                </g>
              );
            })()}

            {/* 18. NUMBER LINE INEQUALITY */}
            {isNumberLine && (() => {
              const minVal = params.min !== undefined ? params.min : -3;
              const maxVal = params.max !== undefined ? params.max : 5;
              const leftInc = params.leftInclusive !== undefined ? params.leftInclusive : false;
              const rightInc = params.rightInclusive !== undefined ? params.rightInclusive : true;

              const cx = 190, cy = 140, sc = 18;
              const x1 = cx + minVal * sc;
              const x2 = cx + maxVal * sc;

              return (
                <g>
                  {/* Axis Line */}
                  <line x1={30} y1={cy} x2={350} y2={cy} stroke="#94A3B8" strokeWidth="2.5" />
                  {/* Ticks */}
                  {[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((t) => (
                    <g key={t}>
                      <line x1={cx + t * sc} y1={cy - 6} x2={cx + t * sc} y2={cy + 6} stroke="#CBD5E1" strokeWidth="1.5" />
                      <text x={cx + t * sc} y={cy + 20} fill="#94A3B8" fontSize="10" textAnchor="middle">{t}</text>
                    </g>
                  ))}
                  {/* Shaded Interval */}
                  <line x1={x1} y1={cy} x2={x2} y2={cy} stroke="#38BDF8" strokeWidth="5" />
                  {/* Left Dot */}
                  <circle cx={x1} cy={cy} r={6} fill={leftInc ? "#38BDF8" : "#050811"} stroke="#38BDF8" strokeWidth="2.5" />
                  {/* Right Dot */}
                  <circle cx={x2} cy={cy} r={6} fill={rightInc ? "#38BDF8" : "#050811"} stroke="#38BDF8" strokeWidth="2.5" />
                  {/* Top Card */}
                  <rect x={15} y={15} width={350} height={38} rx={8} fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" />
                  <text x={190} y={37} fill="#E0F2FE" fontSize="12" fontWeight="bold" textAnchor="middle">
                    Interval: {leftInc ? '[' : '('}{minVal}, {maxVal}{rightInc ? ']' : ')'}  ➔  {minVal} {leftInc ? '≤' : '<'} x {rightInc ? '≤' : '<'} {maxVal}
                  </text>
                </g>
              );
            })()}

            {/* DEFAULT RICH DYNAMIC CONCEPT CARD FOR OTHER SPECS */}
            {!isAngleType && !isTriangleType && !isSectorType && !isSolidType && !isCircleType && !isAreaUnderCurve && !isElevationDepression && !isCoordGeo && !isParabola && !isTrapezoid && !isCone && !isSphere && !isCompositeSolid && !isVenn && !isBellCurve && !isVector && !isTangent && !isNumberLine && (
              <g>
                <rect x={20} y={20} width={340} height={220} rx={14} fill="rgba(139,92,246,0.1)" stroke="#8B5CF6" strokeWidth="2" />
                <circle cx={70} cy={70} r={28} fill="rgba(139,92,246,0.2)" stroke="#A78BFA" strokeWidth="1.5" />
                <path d="M 58 70 L 66 78 L 82 62" fill="none" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />

                <foreignObject x={110} y={35} width={230} height={70}>
                  <div style={{ color: '#FFF', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
                    {spec.title || 'Dynamic Concept Visualizer'}
                  </div>
                  <div style={{ color: '#C4B5FD', fontSize: 11, marginTop: 4 }}>
                    Interactive Concept Specification
                  </div>
                </foreignObject>

                {/* Parameters Pills */}
                <foreignObject x={35} y={115} width={310} height={110}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(params).map(([k, v]) => (
                      <span
                        key={k}
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#F472B6',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </foreignObject>
              </g>
            )}
          </svg>
        </div>

        {/* PARAMETER SLIDERS CONTROLS PANEL */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'rgba(255,255,255,0.03)',
            padding: 16,
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={14} /> Dynamic Controls
          </span>

          {/* Angles */}
          {isAngleType && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Angle 1 (θ₁):</span> <b>{params.angle1 || 36}°</b>
                </label>
                <input
                  type="range"
                  min="1"
                  max={(params.totalAngle || 180) - 1}
                  value={params.angle1 || 36}
                  onChange={(e) => updateParam('angle1', e.target.value)}
                  style={{ width: '100%', accentColor: '#EC4899' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Angle 2 (θ₂):</span> <b>{(params.totalAngle || 180) - (params.angle1 || 36)}°</b>
                </label>
                <input type="range" disabled value={(params.totalAngle || 180) - (params.angle1 || 36)} style={{ width: '100%', opacity: 0.5 }} />
              </div>
            </>
          )}

          {/* Triangle */}
          {isTriangleType && (
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

          {/* Sector */}
          {isSectorType && (
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

          {/* Cylinder */}
          {isSolidType && (
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

          {/* Heights & Distances */}
          {isElevationDepression && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Distance d:</span> <b>{params.distance || 50}m</b>
                </label>
                <input type="range" min="10" max="150" step="5" value={params.distance || 50} onChange={(e) => updateParam('distance', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Angle θ:</span> <b>{params.angle || 30}°</b>
                </label>
                <input type="range" min="15" max="75" step="5" value={params.angle || 30} onChange={(e) => updateParam('angle', e.target.value)} style={{ width: '100%', accentColor: '#EC4899' }} />
              </div>
            </>
          )}

          {/* Coordinate Geometry */}
          {isCoordGeo && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ratio m:</span> <b>{params.m || 2}</b>
                </label>
                <input type="range" min="1" max="5" value={params.m || 2} onChange={(e) => updateParam('m', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ratio n:</span> <b>{params.n || 1}</b>
                </label>
                <input type="range" min="1" max="5" value={params.n || 1} onChange={(e) => updateParam('n', e.target.value)} style={{ width: '100%', accentColor: '#A855F7' }} />
              </div>
            </>
          )}

          {/* Parabola */}
          {isParabola && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Coefficient a:</span> <b>{params.a !== undefined ? params.a : 1}</b>
                </label>
                <input type="range" min="-3" max="3" step="0.5" value={params.a !== undefined ? params.a : 1} onChange={(e) => updateParam('a', e.target.value == 0 ? 0.5 : e.target.value)} style={{ width: '100%', accentColor: '#38BDF8' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Coefficient b:</span> <b>{params.b !== undefined ? params.b : -4}</b>
                </label>
                <input type="range" min="-6" max="6" value={params.b !== undefined ? params.b : -4} onChange={(e) => updateParam('b', e.target.value)} style={{ width: '100%', accentColor: '#A855F7' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Constant c:</span> <b>{params.c !== undefined ? params.c : 3}</b>
                </label>
                <input type="range" min="-6" max="6" value={params.c !== undefined ? params.c : 3} onChange={(e) => updateParam('c', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {/* Trapezoid */}
          {isTrapezoid && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Top base a:</span> <b>{params.a || 10}</b>
                </label>
                <input type="range" min="4" max="20" value={params.a || 10} onChange={(e) => updateParam('a', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bottom base b:</span> <b>{params.b || 18}</b>
                </label>
                <input type="range" min="6" max="30" value={params.b || 18} onChange={(e) => updateParam('b', e.target.value)} style={{ width: '100%', accentColor: '#38BDF8' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Height h:</span> <b>{params.h || 8}</b>
                </label>
                <input type="range" min="4" max="16" value={params.h || 8} onChange={(e) => updateParam('h', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {/* Cone */}
          {isCone && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Radius r:</span> <b>{params.radius || 6}</b>
                </label>
                <input type="range" min="2" max="15" value={params.radius || 6} onChange={(e) => updateParam('radius', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Height h:</span> <b>{params.height || 8}</b>
                </label>
                <input type="range" min="4" max="20" value={params.height || 8} onChange={(e) => updateParam('height', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {/* Sphere / Hemisphere */}
          {isSphere && (
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Radius r:</span> <b>{params.radius || 7}</b>
              </label>
              <input type="range" min="2" max="20" value={params.radius || 7} onChange={(e) => updateParam('radius', e.target.value)} style={{ width: '100%', accentColor: '#38BDF8' }} />
            </div>
          )}

          {/* Venn Diagram */}
          {isVenn && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Intersection A ∩ B:</span> <b>{params.both || 10}</b>
                </label>
                <input type="range" min="2" max="25" value={params.both || 10} onChange={(e) => updateParam('both', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {/* Vectors */}
          {isVector && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Magnitude |A|:</span> <b>{params.magA || 5}</b>
                </label>
                <input type="range" min="2" max="15" value={params.magA || 5} onChange={(e) => updateParam('magA', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Magnitude |B|:</span> <b>{params.magB || 12}</b>
                </label>
                <input type="range" min="2" max="15" value={params.magB || 12} onChange={(e) => updateParam('magB', e.target.value)} style={{ width: '100%', accentColor: '#EC4899' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Angle θ:</span> <b>{params.angle || 90}°</b>
                </label>
                <input type="range" min="15" max="165" step="5" value={params.angle || 90} onChange={(e) => updateParam('angle', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {/* Circle */}
          {isCircleType && (
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Radius r:</span> <b>{params.radius || 5}</b>
              </label>
              <input type="range" min="1" max="15" value={params.radius || 5} onChange={(e) => updateParam('radius', e.target.value)} style={{ width: '100%', accentColor: '#EC4899' }} />
            </div>
          )}

          {/* Area Under Curve / Calculus */}
          {isAreaUnderCurve && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Lower Limit a:</span> <b>{params.a !== undefined ? params.a : 0}</b>
                </label>
                <input type="range" min="-1" max="2" value={params.a !== undefined ? params.a : 0} onChange={(e) => updateParam('a', e.target.value)} style={{ width: '100%', accentColor: '#10B981' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Upper Limit b:</span> <b>{params.b !== undefined ? params.b : 3}</b>
                </label>
                <input type="range" min="1" max="4" value={params.b !== undefined ? params.b : 3} onChange={(e) => updateParam('b', e.target.value)} style={{ width: '100%', accentColor: '#F59E0B' }} />
              </div>
            </>
          )}

          {/* Composite Solid */}
          {isCompositeSolid && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Radius r:</span> <b>{params.radius || 3.5}</b>
                </label>
                <input type="range" min="1" max="8" step="0.5" value={params.radius || 3.5} onChange={(e) => updateParam('radius', e.target.value)} style={{ width: '100%', accentColor: '#EC4899' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cylinder Height h:</span> <b>{params.height || 10}</b>
                </label>
                <input type="range" min="4" max="20" value={params.height || 10} onChange={(e) => updateParam('height', e.target.value)} style={{ width: '100%', accentColor: '#8B5CF6' }} />
              </div>
            </>
          )}

          {/* Bell Curve / Normal Distribution */}
          {isBellCurve && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mean μ:</span> <b>{params.mean || 70}</b>
                </label>
                <input type="range" min="40" max="100" value={params.mean || 70} onChange={(e) => updateParam('mean', e.target.value)} style={{ width: '100%', accentColor: '#38BDF8' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Standard Dev σ:</span> <b>{params.sd || 10}</b>
                </label>
                <input type="range" min="4" max="20" value={params.sd || 10} onChange={(e) => updateParam('sd', e.target.value)} style={{ width: '100%', accentColor: '#10B981' }} />
              </div>
            </>
          )}

          {/* Tangent & Derivative */}
          {isTangent && (
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Tangent Point x₀:</span> <b>{params.x0 !== undefined ? params.x0 : 2}</b>
              </label>
              <input type="range" min="-1" max="4" step="0.5" value={params.x0 !== undefined ? params.x0 : 2} onChange={(e) => updateParam('x0', e.target.value)} style={{ width: '100%', accentColor: '#06B6D4' }} />
            </div>
          )}

          {/* Number Line */}
          {isNumberLine && (
            <>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Min Bound:</span> <b>{params.min !== undefined ? params.min : -3}</b>
                </label>
                <input type="range" min="-7" max="0" value={params.min !== undefined ? params.min : -3} onChange={(e) => updateParam('min', e.target.value)} style={{ width: '100%', accentColor: '#38BDF8' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Max Bound:</span> <b>{params.max !== undefined ? params.max : 5}</b>
                </label>
                <input type="range" min="0" max="7" value={params.max !== undefined ? params.max : 5} onChange={(e) => updateParam('max', e.target.value)} style={{ width: '100%', accentColor: '#10B981' }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
