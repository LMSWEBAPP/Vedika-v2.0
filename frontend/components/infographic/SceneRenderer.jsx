'use client';

import React from "react";
import { EditorialLayout } from "./renderers/EditorialLayout";
import { ScientificIllustration } from "./renderers/ScientificIllustration";
import { ComparisonLayout } from "./renderers/ComparisonLayout";
import { HorizontalProcess } from "./renderers/HorizontalProcess";
import { RadialMap } from "./renderers/RadialMap";
import { CircularCycle } from "./renderers/CircularCycle";
import { TimelineLayout } from "./renderers/TimelineLayout";
import { HierarchyLayout } from "./renderers/HierarchyLayout";
import { DataChartLayout } from "./renderers/DataChartLayout";

const LAYOUT_REGISTRY = {
  "scientific-illustration": ScientificIllustration,
  editorial: EditorialLayout,
  comparison: ComparisonLayout,
  "horizontal-process": HorizontalProcess,
  "radial-map": RadialMap,
  "circular-cycle": CircularCycle,
  timeline: TimelineLayout,
  hierarchy: HierarchyLayout,
  "data-chart": DataChartLayout,
  "technical-model": ScientificIllustration,
};

const LAYOUT_ACCENTS = {
  "scientific-illustration": "#818cf8",
  editorial: "#38bdf8",
  comparison: "#3b82f6",
  "horizontal-process": "#38bdf8",
  "radial-map": "#c084fc",
  "circular-cycle": "#10b981",
  timeline: "#f59e0b",
  hierarchy: "#818cf8",
  "data-chart": "#38bdf8",
  "technical-model": "#818cf8",
};

export const SceneRenderer = ({
  scene,
  animationController,
  onSelectElement,
  svgRef,
}) => {
  if (!scene) return null;

  const layoutType = scene.layout?.type || "editorial";
  const LayoutComponent = LAYOUT_REGISTRY[layoutType] || EditorialLayout;
  const canvasWidth = scene.canvas?.width || 1200;
  const canvasHeight = scene.canvas?.height || 675;
  const viewBox = scene.canvas?.viewBox || `0 0 ${canvasWidth} ${canvasHeight}`;
  const accentColor = LAYOUT_ACCENTS[layoutType] || "#38bdf8";

  const headerSummary =
    (scene.summary || "").length > 130
      ? scene.summary.slice(0, 127) + "..."
      : scene.summary || "";

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      className="w-full h-full select-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        backgroundColor: scene.canvas?.theme === "light" ? "#f8fafc" : "#0c1222",
        display: "block",
        margin: "0 auto",
      }}
    >
      <defs>
        <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.55" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
        </filter>

        <filter id="hero-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.22  0 0 0 0 0.74  0 0 0 0 0.97  0 0 0 0.45 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <radialGradient id="canvas-aura" cx="50%" cy="54%" r="52%" fx="50%" fy="54%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.12" />
          <stop offset="45%" stopColor={accentColor} stopOpacity="0.035" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>

        <pattern id="dot-matrix" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.1" fill="rgba(255, 255, 255, 0.05)" />
        </pattern>
      </defs>

      {/* Solid Canvas Background Rect */}
      <rect
        width={canvasWidth}
        height={canvasHeight}
        fill={scene.canvas?.theme === "light" ? "#f8fafc" : "#0c1222"}
      />

      {/* Architectural Dot Matrix Background */}
      <rect
        width={canvasWidth}
        height={canvasHeight}
        fill="url(#dot-matrix)"
      />

      {/* Canvas Aura Radial Spotlight */}
      <rect
        width={canvasWidth}
        height={canvasHeight}
        fill="url(#canvas-aura)"
      />

      {/* Structured Glassmorphic Top Header Bar */}
      <g id="scene-header">
        <rect
          x={20}
          y={14}
          width={canvasWidth - 40}
          height={64}
          rx={14}
          fill="#090e1a"
          fillOpacity="0.88"
          stroke="rgba(255, 255, 255, 0.09)"
          strokeWidth="1"
          filter="url(#card-shadow)"
        />

        <line
          x1={36}
          y1={15}
          x2={canvasWidth - 36}
          y2={15}
          stroke="#ffffff"
          strokeOpacity="0.18"
          strokeWidth="1.2"
        />

        {/* Left accent pill badge */}
        <rect
          x={36}
          y={26}
          width={4}
          height={40}
          rx={2}
          fill={accentColor}
        />

        {/* Title text */}
        <text
          x={50}
          y={39}
          fill="#f8fafc"
          fontSize="15"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.01em"
        >
          {scene.title}
        </text>

        {/* Summary text */}
        <text
          x={50}
          y={57}
          fill="#94a3b8"
          fontSize="11"
          fontWeight="500"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {headerSummary}
        </text>

        {/* Right side Grammar & Theme Badge */}
        <g id="header-right-badges" transform={`translate(${canvasWidth - 210}, 28)`}>
          <rect
            width={170}
            height={36}
            rx={10}
            fill="rgba(15, 23, 42, 0.75)"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
          <circle cx={18} cy={18} r={4.5} fill={accentColor} />
          <text
            x={28}
            y={22}
            fill="#e2e8f0"
            fontSize="10"
            fontWeight="700"
            fontFamily="ui-monospace, monospace"
            letterSpacing="0.04em"
          >
            {layoutType.toUpperCase().replace("-", " ")}
          </text>
        </g>
      </g>

      {/* Dispatched Layout Component */}
      <LayoutComponent
        elements={scene.elements}
        connectors={scene.connectors || []}
        animationController={animationController}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onSelectElement={onSelectElement}
      />
    </svg>
  );
};
