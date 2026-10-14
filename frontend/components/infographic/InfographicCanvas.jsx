'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Maximize2,
  X,
  RotateCcw,
  Layers,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { SceneRenderer } from "./SceneRenderer";
import { BottomToolbar } from "./BottomToolbar";
import { useDrawingSequence } from "@/lib/infographic/useDrawingSequence";

export const InfographicCanvas = ({
  scene: initialScene,
  isLoading = false,
  points = [],
  onRegenerate,
  onClose,
  topicTitle,
  initialExpanded = true,
}) => {
  const [scene, setScene] = useState(initialScene);
  const [isModalOpen, setIsModalOpen] = useState(initialExpanded);
  const [modalZoom, setModalZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [showTakeaways, setShowTakeaways] = useState(false);
  const [isInlineTakeawaysOpen, setIsInlineTakeawaysOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const svgRef = useRef(null);
  const viewportRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialScene) {
      setScene(initialScene);
    }
  }, [initialScene]);

  // Hook for deterministic sequential entrance animation
  const animationController = useDrawingSequence(scene);

  // Keyboard shortcut: Escape to close full-window modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
        if (onClose) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, onClose]);

  // Pan handlers for full window canvas
  const handleMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest("button") || e.target.closest("select")) return;
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panPosition };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanPosition({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Zoom handlers
  const handleZoomIn = () => setModalZoom((z) => Math.min(z + 0.15, 2.0));
  const handleZoomOut = () => setModalZoom((z) => Math.max(z - 0.15, 0.45));
  const handleZoomReset = (level = 1.0) => {
    setModalZoom(typeof level === "number" ? level : 1.0);
    setPanPosition({ x: 0, y: 0 });
  };
  const handleFitToScreen = () => {
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth - 80;
    const vh = viewportRef.current.clientHeight - 120;
    const scale = Math.min(vw / 1200, vh / 675);
    setModalZoom(Math.max(0.45, Math.min(scale, 1.25)));
    setPanPosition({ x: 0, y: 0 });
  };

  // Wheel zoom handler
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setModalZoom((z) => Math.max(0.45, Math.min(2.0, z + delta)));
    }
  };

  const displayPoints = (points && points.length > 0)
    ? points
    : (scene?.elements || [])
        .filter((e) => e.text && e.subtitle)
        .map((e) => `${e.text}: ${e.subtitle}`);

  const title = scene?.title || topicTitle || "Visual Summary";

  return (
    <div
      className="infographic-container"
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        background: "#080d1a",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* ── 1. INLINE CHAT FEED CARD ── */}
      <div className="infographic-inline-view">
        {/* Top Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "rgba(10, 15, 30, 0.8)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
                padding: "3px 9px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.03em",
              }}
            >
              <Sparkles size={11} />
              VISUAL SUMMARY
            </span>
            <span
              style={{
                color: "#e2e8f0",
                fontSize: 13,
                fontWeight: 700,
                maxWidth: 320,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Regenerate Infographic"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  padding: "5px 10px",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RotateCcw size={12} />
                <span>Regenerate</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
                border: "none",
                color: "#030712",
                padding: "5px 12px",
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 2px 8px rgba(56, 189, 248, 0.35)",
              }}
            >
              <Maximize2 size={12} />
              <span>Full Screen</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close Visual Summary"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Inline Thumbnail Preview Canvas */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            maxHeight: 380,
            background: "#0c1222",
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={() => setIsModalOpen(true)}
          title="Click to open interactive full-screen blueprint"
        >
          {scene && (
            <SceneRenderer
              scene={scene}
              animationController={animationController}
            />
          )}

          {/* Hover Overlay Hint */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.3)",
              opacity: 0,
              transition: "opacity 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          >
            <Maximize2 size={16} />
            <span>Click to Expand Full Screen</span>
          </div>
        </div>

        {/* Collapsible Key Takeaways Section (Inline - Collapsed by default) */}
        {displayPoints.length > 0 && (
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(15, 23, 42, 0.6)",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsInlineTakeawaysOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: "transparent",
                border: "none",
                padding: "2px 0",
                cursor: "pointer",
                color: "#f5a95b",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} color="#f5a95b" />
                <span>Key Takeaways ({displayPoints.length})</span>
              </div>
              {isInlineTakeawaysOpen ? (
                <ChevronDown size={14} color="#94a3b8" />
              ) : (
                <ChevronRight size={14} color="#94a3b8" />
              )}
            </button>

            {isInlineTakeawaysOpen && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {displayPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: 8,
                      fontSize: 12.5,
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        padding: "1px 7px",
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1 }}>{pt.replace(/^[-*•]\s+/, "")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. FULL-SCREEN CANVAS MODAL (Opens by default on click) ── */}
      {isModalOpen && mounted && createPortal(
        <div
          className="infographic-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(4, 7, 16, 0.97)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top Bar: Minimal - Title and Back to Chat */}
          <div
            className="infographic-modal-topbar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 24px",
              background: "rgba(8, 12, 24, 0.95)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              zIndex: 40,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  padding: "4px 11px",
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                }}
              >
                <Sparkles size={12} />
                <span>INTERACTIVE VISUAL SUMMARY</span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#f8fafc",
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </h2>
            </div>

            {/* Prominent Back to Chat Button on top right */}
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                if (onClose) onClose();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                color: "#fca5a5",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Close Full Window (Esc)"
            >
              <X size={15} />
              <span>Back to Chat</span>
            </button>
          </div>

          {/* Canvas Viewport or Generating Loading Screen */}
          {isLoading || !scene ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: 30,
                textAlign: "center",
                background: "radial-gradient(circle at 50% 45%, rgba(18, 25, 42, 0.95) 0%, rgba(6, 9, 16, 0.99) 100%)",
              }}
            >
              {/* Futuristic orbital loading indicator */}
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "3px solid rgba(56, 189, 248, 0.15)",
                    borderTopColor: "#38bdf8",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 10,
                    borderRadius: "50%",
                    border: "2px solid rgba(192, 132, 252, 0.2)",
                    borderBottomColor: "#c084fc",
                    animation: "spin 1.8s linear infinite reverse",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#38bdf8",
                  }}
                >
                  <Sparkles size={28} />
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  Generating Visual Summary...
                </h3>
                <p style={{ margin: 0, fontSize: 13.5, color: "#94a3b8", maxWidth: 440, lineHeight: 1.6 }}>
                  Gemini is analyzing the concept architecture and structuring the optimal visual diagram layout.
                </p>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                <span>Autonomous layout synthesis in progress...</span>
              </div>
            </div>
          ) : (
            <div
              ref={viewportRef}
              className="infographic-viewport"
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
                cursor: isPanning ? "grabbing" : "grab",
                background: "radial-gradient(circle at 50% 30%, rgba(18, 25, 42, 0.9) 0%, rgba(6, 9, 16, 0.99) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Scaled SVG Stage */}
              <div
                className="infographic-stage"
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${modalZoom})`,
                  transformOrigin: "center center",
                  transition: isPanning ? "none" : "transform 0.18s ease-out",
                  width: "1200px",
                  height: "675px",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Master Vector SVG Scene */}
                <SceneRenderer
                  scene={scene}
                  animationController={animationController}
                  svgRef={svgRef}
                />
              </div>

              {/* Key Takeaways Companion Drawer (Collapsed by default; slides in from right when opened) */}
              {showTakeaways && displayPoints.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    bottom: 16,
                    width: 340,
                    maxWidth: "92%",
                    background: "rgba(10, 15, 28, 0.96)",
                    border: "1px solid rgba(245, 169, 91, 0.4)",
                    borderRadius: 14,
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.85)",
                    backdropFilter: "blur(20px)",
                    zIndex: 25,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    animation: "fadeInRight 0.25s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(245, 169, 91, 0.1)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#f5a95b", fontWeight: 700, fontSize: 13.5 }}>
                      <Sparkles size={15} />
                      <span>Key Takeaways</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTakeaways(false)}
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "none",
                        color: "#cbd5e1",
                        cursor: "pointer",
                        borderRadius: 6,
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Collapse Takeaways"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    {displayPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          fontSize: 12.5,
                          color: "#f1f5f9",
                          lineHeight: 1.6,
                        }}
                      >
                        <div style={{ color: "#f5a95b", fontWeight: 700, marginBottom: 5, fontSize: 10.5, letterSpacing: "0.05em" }}>
                          POINT {String(idx + 1).padStart(2, "0")}
                        </div>
                        {pt.replace(/^[-*•]\s+/, "")}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL CANVAS OPTIONS IN ONE SLEEK LINE */}
          {scene && (
            <BottomToolbar
              scene={scene}
              zoom={modalZoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              onFitToScreen={handleFitToScreen}
              takeawaysCount={displayPoints.length}
              showTakeaways={showTakeaways}
              onToggleTakeaways={() => setShowTakeaways((v) => !v)}
            />
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
