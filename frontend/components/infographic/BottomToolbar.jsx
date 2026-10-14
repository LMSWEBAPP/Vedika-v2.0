'use client';

import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Move,
  Layers,
} from "lucide-react";

export const BottomToolbar = ({
  scene,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  takeawaysCount = 0,
  showTakeaways = false,
  onToggleTakeaways,
}) => {
  const layoutType = scene?.layout?.type || "editorial";
  const formattedLayoutName = layoutType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
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
    <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.12)", margin: "0 6px", flexShrink: 0 }} />
  );

  return (
    <div
      className="infographic-bottom-dock"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 24px",
        background: "rgba(8, 12, 22, 0.96)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
        color: "#94a3b8",
        fontSize: 12,
        zIndex: 30,
        width: "100%",
        boxSizing: "border-box",
        minHeight: 52,
      }}
    >
      {/* ── Left Side: Key Takeaways Companion Button & Layout Badge ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {takeawaysCount > 0 && (
          <button
            type="button"
            onClick={onToggleTakeaways}
            style={{
              ...btnBase,
              background: showTakeaways ? "rgba(245, 169, 91, 0.22)" : "rgba(245, 169, 91, 0.10)",
              color: "#f5a95b",
              borderColor: showTakeaways ? "rgba(245, 169, 91, 0.5)" : "rgba(245, 169, 91, 0.3)",
              boxShadow: showTakeaways ? "0 0 12px rgba(245, 169, 91, 0.25)" : "none",
            }}
            title="Toggle Key Takeaways (Collapsed by default)"
          >
            <Sparkles size={14} color="#f5a95b" />
            <span style={{ fontWeight: 700 }}>Key Takeaways ({takeawaysCount})</span>
          </button>
        )}

        {/* Blueprint Architecture Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 11px",
            borderRadius: 8,
            background: "rgba(56, 189, 248, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            color: "#38bdf8",
            fontSize: 11.5,
            fontWeight: 600,
          }}
          title={`Autonomous layout: ${layoutType}`}
        >
          <Layers size={13} />
          <span>{formattedLayoutName} Layout</span>
        </div>
      </div>

      {/* ── Center / Right Side: Clean Zoom Suite in ONE Line ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            background: "rgba(255, 255, 255, 0.03)",
            padding: 3,
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <button
            type="button"
            onClick={onZoomOut}
            style={{ ...btnBase, padding: "5px 8px" }}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>

          <button
            type="button"
            onClick={() => onZoomReset?.(1.0)}
            style={{ ...btnBase, padding: "5px 9px", minWidth: 46, justifyContent: "center" }}
            title="Reset to 100%"
          >
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            style={{ ...btnBase, padding: "5px 8px" }}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>

          <button
            type="button"
            onClick={onFitToScreen}
            style={{
              ...btnBase,
              padding: "5px 10px",
              background: "rgba(56, 189, 248, 0.12)",
              color: "#38bdf8",
              borderColor: "rgba(56, 189, 248, 0.3)",
            }}
            title="Fit Entire Infographic to Window"
          >
            <Maximize2 size={13} />
            <span>Fit</span>
          </button>

          {[0.75, 1.0, 1.25, 1.5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onZoomReset?.(lvl)}
              style={{
                ...btnBase,
                padding: "4px 8px",
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

        {/* Quick Canvas Hint */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            color: "#64748b",
            padding: "4px 8px",
          }}
        >
          <Move size={12} color="#38bdf8" />
          <span>Pan: Click &amp; Drag &bull; Zoom: Ctrl+Scroll &bull; Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
