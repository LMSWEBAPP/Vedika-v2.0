'use client';

import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  StepForward,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layers,
  Calendar,
  Eye,
  Atom,
  TrendingUp,
  Sliders,
  ChevronUp,
  PenTool,
} from "lucide-react";
import { ExportControls } from "./ExportControls";

export const AVAILABLE_LAYOUTS = [
  { type: "horizontal-process", label: "Process", icon: ArrowRight },
  { type: "circular-cycle", label: "Cycle", icon: RefreshCw },
  { type: "radial-map", label: "Radial", icon: Sparkles },
  { type: "comparison", label: "Compare", icon: Layers },
  { type: "hierarchy", label: "Hierarchy", icon: Layers },
  { type: "timeline", label: "Timeline", icon: Calendar },
  { type: "editorial", label: "Editorial", icon: Eye },
  { type: "scientific-illustration", label: "Technical", icon: Atom },
  { type: "data-chart", label: "Metrics", icon: TrendingUp },
];

export const BottomToolbar = ({
  scene,
  animationController,
  isStylusVisible,
  onToggleStylus,
  onSwitchLayout,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  svgRef,
  takeawaysCount,
  showTakeaways,
  onToggleTakeaways,
}) => {
  const currentLayout = scene?.layout?.type || "editorial";

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 11px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#cbd5e1",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.09)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  };

  const divider = (
    <div style={{ width: 1, height: 18, background: "rgba(255, 255, 255, 0.12)", margin: "0 4px" }} />
  );

  return (
    <div
      className="infographic-bottom-dock"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        padding: "8px 16px",
        background: "rgba(9, 14, 26, 0.96)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(16px)",
        color: "#94a3b8",
        fontSize: 12,
        zIndex: 30,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* ── Group 1: Playback & Stylus Controls ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={animationController.isPlaying ? animationController.pause : animationController.play}
          style={{
            ...btnBase,
            background: animationController.isPlaying ? "rgba(245, 158, 11, 0.18)" : "rgba(56, 189, 248, 0.18)",
            color: animationController.isPlaying ? "#f59e0b" : "#38bdf8",
            borderColor: animationController.isPlaying ? "rgba(245, 158, 11, 0.35)" : "rgba(56, 189, 248, 0.35)",
          }}
          title={animationController.isPlaying ? "Pause Drawing" : "Play Live Drawing"}
        >
          {animationController.isPlaying ? <Pause size={13} /> : <Play size={13} />}
          <span>{animationController.isPlaying ? "Pause" : "Play"}</span>
        </button>

        <button
          type="button"
          onClick={animationController.stepForward}
          disabled={animationController.isCompleted}
          style={{ ...btnBase, opacity: animationController.isCompleted ? 0.45 : 1 }}
          title="Step Forward"
        >
          <StepForward size={13} />
        </button>

        <button
          type="button"
          onClick={animationController.replay}
          style={btnBase}
          title="Replay from start"
        >
          <RotateCcw size={13} />
          <span>Replay</span>
        </button>

        <button
          type="button"
          onClick={animationController.skipToEnd}
          style={btnBase}
          title="Skip animation to end"
        >
          <FastForward size={13} />
          <span>Skip</span>
        </button>

        {/* Speed toggle */}
        <button
          type="button"
          onClick={() => {
            const nextSpeed = animationController.speed === 1 ? 1.5 : animationController.speed === 1.5 ? 2 : 1;
            animationController.setSpeed(nextSpeed);
          }}
          style={btnBase}
          title="Toggle Drawing Speed"
        >
          <span style={{ color: "#38bdf8" }}>{animationController.speed}x</span>
        </button>

        {/* Stylus toggle */}
        <button
          type="button"
          onClick={onToggleStylus}
          style={{
            ...btnBase,
            background: isStylusVisible ? "rgba(168, 85, 247, 0.18)" : "rgba(255, 255, 255, 0.05)",
            color: isStylusVisible ? "#c084fc" : "#94a3b8",
            borderColor: isStylusVisible ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.1)",
          }}
          title={isStylusVisible ? "Hide Drawing Stylus Pen" : "Show Drawing Stylus Pen"}
        >
          <PenTool size={13} />
          <span>Stylus</span>
        </button>

        {divider}

        {/* ── Group 2: Interactive 9-Layout Grammar Switcher ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: "#64748b", marginRight: 2 }}>Layout:</span>
          <select
            value={currentLayout}
            onChange={(e) => onSwitchLayout?.(e.target.value)}
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              outline: "none",
            }}
            title="Switch Visual Grammar Dynamically"
          >
            {AVAILABLE_LAYOUTS.map((l) => (
              <option key={l.type} value={l.type} style={{ background: "#0c1222", color: "#f8fafc" }}>
                {l.label} ({l.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Group 3: Canvas Zoom & Presets + Export + Takeaways ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {/* Key Takeaways companion button */}
        {takeawaysCount > 0 && (
          <button
            type="button"
            onClick={onToggleTakeaways}
            style={{
              ...btnBase,
              background: showTakeaways ? "rgba(245, 169, 91, 0.22)" : "rgba(245, 169, 91, 0.10)",
              color: "#f5a95b",
              borderColor: "rgba(245, 169, 91, 0.4)",
            }}
            title="Toggle Key Takeaways Panel"
          >
            <Sparkles size={13} color="#f5a95b" />
            <span>Takeaways ({takeawaysCount})</span>
          </button>
        )}

        {divider}

        {/* Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255, 255, 255, 0.03)", padding: 2, borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <button
            type="button"
            onClick={onZoomOut}
            style={{ ...btnBase, padding: "5px 8px" }}
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>

          <button
            type="button"
            onClick={onZoomReset}
            style={{ ...btnBase, padding: "5px 8px" }}
            title="Reset Zoom to 100%"
          >
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            style={{ ...btnBase, padding: "5px 8px" }}
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>

          <button
            type="button"
            onClick={onFitToScreen}
            style={{ ...btnBase, padding: "5px 8px" }}
            title="Fit Entire Diagram"
          >
            <Maximize2 size={12} />
            <span>Fit</span>
          </button>

          {[0.75, 1.0, 1.25, 1.5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onZoomReset?.(lvl)}
              style={{
                ...btnBase,
                padding: "4px 7px",
                fontSize: 11,
                background: Math.abs(zoom - lvl) < 0.04 ? "rgba(56, 189, 248, 0.2)" : "transparent",
                color: Math.abs(zoom - lvl) < 0.04 ? "#38bdf8" : "#94a3b8",
                borderColor: Math.abs(zoom - lvl) < 0.04 ? "rgba(56, 189, 248, 0.4)" : "transparent",
              }}
              title={`Zoom ${Math.round(lvl * 100)}%`}
            >
              {Math.round(lvl * 100)}%
            </button>
          ))}
        </div>

        {divider}

        {/* Export Suite */}
        <ExportControls scene={scene} svgRef={svgRef} />
      </div>
    </div>
  );
};
