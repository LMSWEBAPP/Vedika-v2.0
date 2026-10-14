'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Maximize2,
  X,
  Move,
  RotateCcw,
  Layers,
  ChevronRight,
  ChevronDown,
  Eye,
} from "lucide-react";
import { SceneRenderer } from "./SceneRenderer";
import { DrawingCursor } from "./DrawingCursor";
import { BottomToolbar } from "./BottomToolbar";
import { useDrawingSequence } from "@/lib/infographic/useDrawingSequence";
import { buildSceneFromSemanticPlan } from "@/lib/infographic/spatialEngine";

export const InfographicCanvas = ({
  scene: initialScene,
  points = [],
  onRegenerate,
  onClose,
  topicTitle,
  initialExpanded = false,
}) => {
  const [scene, setScene] = useState(initialScene);
  const [isModalOpen, setIsModalOpen] = useState(initialExpanded);
  const [modalZoom, setModalZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isStylusVisible, setIsStylusVisible] = useState(true);
  const [showTakeaways, setShowTakeaways] = useState(false);
  const [isInlineTakeawaysOpen, setIsInlineTakeawaysOpen] = useState(true);
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

  // Hook for deterministic animation
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
    // Only drag on left click and not on interactive buttons
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

  // Interactive instant re-layout across 9 visual grammars
  const handleSwitchLayout = (targetLayout) => {
    if (!scene) return;

    const semanticNodes = (scene.elements || [])
      .filter((e) => e.type !== "chart" || (e.text && e.text.trim().length > 0))
      .map((e, idx) => ({
        id: e.id,
        title: e.text || e.id,
        subtitle: e.subtitle || "",
        category: e.category,
        icon: e.icon,
        equation: e.equation,
        highlight: e.highlight,
        semanticRole: e.semanticRole || (idx === 0 ? "hero" : "stage"),
        sourceEvidence: e.sourceEvidence,
      }));

    const plan = {
      detectedTopic: scene.title,
      coreThesis: scene.summary,
      structuralPattern: `Interactive layout switch to ${targetLayout}`,
      layoutGrammar: targetLayout,
      designRationale: `User switched layout grammar to preview ${targetLayout}.`,
      alternateLayout: scene.layout?.type || "editorial",
      nodes: semanticNodes,
      connectors: (scene.connectors || []).map((c) => ({
        id: c.id,
        from: c.from,
        to: c.to,
        label: c.label,
        style: c.style,
      })),
      chartData:
        targetLayout === "data-chart"
          ? {
              labels: semanticNodes.slice(0, 4).map((n) => n.title.slice(0, 14)),
              values: [85, 92, 78, 88].slice(0, Math.min(4, semanticNodes.length)),
              unit: "%",
            }
          : null,
    };

    const newScene = buildSceneFromSemanticPlan(plan, {
      aspectRatio: scene.layout?.aspectRatio || "16:9",
      theme: scene.canvas?.theme || "dark",
      requestId: scene.metadata?.requestId,
      modelUsed: scene.metadata?.modelUsed,
    });

    setScene(newScene);
  };

  const title = scene?.title || topicTitle || "Visual Summary";
  const displayPoints = points && points.length > 0 ? points : [];

  return (
    <div className="infographic-container" style={{ margin: "12px 0", width: "100%" }}>
      {/* ── 1. INLINE CHAT MESSAGE CARD (Widescreen High-Impact Preview) ── */}
      <div
        className="infographic-inline-card"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 14, 26, 0.98) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Inline Header Bar */}
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
              <span>Expand Full Window</span>
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
          title="Click to open interactive full-window canvas"
        >
          {scene && (
            <SceneRenderer
              scene={scene}
              animationController={animationController}
            />
          )}

          {/* Inline Live Drawing Stylus Pen */}
          {scene && isStylusVisible && (
            <DrawingCursor
              x={animationController.cursorPosition.x}
              y={animationController.cursorPosition.y}
              visible={animationController.cursorPosition.visible}
              label={animationController.cursorPosition.label}
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
            <span>Click to enter interactive full-window canvas</span>
          </div>
        </div>

        {/* Key Takeaways Section (Original Vedika Design Integration) */}
        {displayPoints.length > 0 && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(10, 15, 28, 0.9)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <button
              type="button"
              onClick={() => setIsInlineTakeawaysOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#e2e8f0",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#38bdf8" }}>
                <Sparkles size={14} />
                <span>Key Takeaways ({displayPoints.length})</span>
              </div>
              <ChevronDown
                size={16}
                style={{
                  transform: isInlineTakeawaysOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  color: "#94a3b8",
                }}
              />
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

      {/* ── 2. FULL-WINDOW CANVAS MODAL (Options strictly docked at bottom) ── */}
      {isModalOpen && mounted && createPortal(
        <div
          className="infographic-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(3, 7, 18, 0.96)",
            backdropFilter: "blur(18px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top Bar: Strictly CLEAN & MINIMAL - Just Title and Close Button */}
          <div
            className="infographic-modal-topbar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 24px",
              background: "rgba(9, 14, 26, 0.95)",
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
                <span>INTERACTIVE KNOWLEDGE BLUEPRINT</span>
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

            {/* Close Button: Clean and prominent on top right */}
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

          {/* Canvas Viewport (Pan & Zoom Stage) */}
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
            {/* The Scaled SVG Stage */}
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
              {/* Drawing Stylus Pen */}
              {scene && isStylusVisible && (
                <DrawingCursor
                  x={animationController.cursorPosition.x}
                  y={animationController.cursorPosition.y}
                  visible={animationController.cursorPosition.visible}
                  label={animationController.cursorPosition.label}
                />
              )}

              {/* Master Vector SVG Scene */}
              {scene && (
                <SceneRenderer
                  scene={scene}
                  animationController={animationController}
                  svgRef={svgRef}
                />
              )}
            </div>

            {/* Key Takeaways Companion Drawer (Slide-in from right when toggled) */}
            {showTakeaways && displayPoints.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  bottom: 16,
                  width: 320,
                  maxWidth: "90%",
                  background: "rgba(10, 15, 28, 0.95)",
                  border: "1px solid rgba(245, 169, 91, 0.35)",
                  borderRadius: 14,
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.8)",
                  backdropFilter: "blur(20px)",
                  zIndex: 25,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    background: "rgba(245, 169, 91, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#f5a95b", fontWeight: 700, fontSize: 13 }}>
                    <Sparkles size={14} />
                    <span>Key Takeaways</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTakeaways(false)}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {displayPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        fontSize: 12,
                        color: "#e2e8f0",
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ color: "#f5a95b", fontWeight: 700, marginBottom: 4, fontSize: 10.5 }}>
                        POINT {idx + 1}
                      </div>
                      {pt.replace(/^[-*•]\s+/, "")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Helper Banner */}
          <div
            style={{
              padding: "4px 20px",
              background: "rgba(6, 10, 20, 0.98)",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              color: "#64748b",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Move size={12} color="#38bdf8" />
              <span>Click &amp; drag to pan canvas &bull; Ctrl + Scroll to zoom &bull; Esc to go back</span>
            </div>
            <div>
              <span>Model: {scene?.metadata?.modelUsed || "Gemini Multi-Design Engine"}</span>
            </div>
          </div>

          {/* ALL CANVAS OPTIONS LOCATED HERE AT THE BOTTOM */}
          <BottomToolbar
            scene={scene}
            animationController={animationController}
            isStylusVisible={isStylusVisible}
            onToggleStylus={() => setIsStylusVisible((v) => !v)}
            onSwitchLayout={handleSwitchLayout}
            zoom={modalZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onFitToScreen={handleFitToScreen}
            svgRef={svgRef}
            takeawaysCount={displayPoints.length}
            showTakeaways={showTakeaways}
            onToggleTakeaways={() => setShowTakeaways((v) => !v)}
          />
        </div>,
        document.body
      )}
    </div>
  );
};
