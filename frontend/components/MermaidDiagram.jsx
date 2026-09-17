'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, RotateCcw, Code, Copy, Check, Sparkles, AlertCircle, Maximize2, ChevronDown, X, ArrowLeft, Move } from 'lucide-react';
import StitchAICursor from './StitchAICursor';
import './MermaidDiagram.css';

/**
 * Parses inline markdown formatted tokens (**bold**, *italic*, `code`)
 * into clean React elements so raw asterisks are never shown.
 */
function renderFormattedText(str) {
  if (!str) return '';
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="mermaid-text-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="mermaid-text-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="mermaid-text-italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }
  return parts.length > 0 ? parts : str;
}

/**
 * Sanitizes raw Mermaid flowchart syntax to prevent parser syntax errors
 * caused by unquoted parentheses, braces, brackets, or invalid tokens.
 */
function sanitizeMermaid(raw) {
  if (!raw) return '';
  let code = raw.trim();

  // Strip markdown code fences if accidentally included
  code = code.replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/, '').trim();

  // Ensure diagram header exists
  if (!/^(flowchart|graph|mindmap|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i.test(code)) {
    code = `flowchart TD\n${code}`;
  }

  // Replace unquoted parentheses inside square bracket node labels: A[Text (detail)] -> A["Text (detail)"]
  code = code.replace(/(\[[^"\]\n]*\([^"\]\n]*\)[^"\]\n]*\])/g, (match) => {
    const inner = match.slice(1, -1).trim();
    if (inner.startsWith('"') && inner.endsWith('"')) return match;
    return `["${inner.replace(/"/g, "'")}"]`;
  });

  return code;
}

export default function MermaidDiagram({ chart, points = [], chatHistory = [], onRegenerate, onClose }) {
  const containerRef = useRef(null);
  const modalViewportRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [svgHtml, setSvgHtml] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [modalZoom, setModalZoom] = useState(0.65); // Initial compact zoom to fit all boxes in view!
  const modalZoomRef = useRef(0.65);
  modalZoomRef.current = modalZoom;

  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isKeypointsOpen, setIsKeypointsOpen] = useState(false); // Collapsed by default (inline chat)
  const [isModalOpen, setIsModalOpen] = useState(true); // Fullscreen expand modal open by default for Visual Summary!
  const [isModalKeypointsOpen, setIsModalKeypointsOpen] = useState(false); // Collapsed by default (modal)

  // Mouse drag panning state for modal viewport
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // ── Stitch AI Live Construction State ──
  const [isLiveDrawEnabled, setIsLiveDrawEnabled] = useState(true);
  const [isBuilding, setIsBuilding] = useState(true);
  const [cursorState, setCursorState] = useState({
    x: 0,
    y: 0,
    visible: false,
    status: 'Drafting...',
    label: '',
    isClicking: false
  });
  const animTimeoutsRef = useRef([]);

  const clearAnimTimeouts = () => {
    animTimeoutsRef.current.forEach((t) => clearTimeout(t));
    animTimeoutsRef.current = [];
  };

  const stopAndCleanAnimation = useCallback((containerEl) => {
    clearAnimTimeouts();
    const targets = [modalViewportRef.current, containerRef.current].filter(Boolean);
    targets.forEach((root) => {
      const wrapper = root.querySelector('.mermaid-svg-wrapper');
      if (wrapper) wrapper.classList.remove('building');

      const edgeContainer = root.querySelector('g.edgePaths');
      if (edgeContainer) {
        edgeContainer.style.removeProperty('visibility');
        edgeContainer.style.removeProperty('opacity');
      }
      const edgeLabelContainer = root.querySelector('g.edgeLabels');
      if (edgeLabelContainer) {
        edgeLabelContainer.style.removeProperty('visibility');
        edgeLabelContainer.style.removeProperty('opacity');
      }

      const nodes = root.querySelectorAll('.node, g.node');
      nodes.forEach((n) => {
        n.style.removeProperty('visibility');
        n.style.removeProperty('opacity');
        n.classList.remove('stitch-node-wireframe', 'stitch-node-solidified');
      });
      const edges = root.querySelectorAll('.edgePath, g.edgePath, path.flowchart-link, g.edgePaths path');
      edges.forEach((e) => {
        e.style.removeProperty('visibility');
        e.style.removeProperty('opacity');
        e.classList.remove('stitch-edge-drawing', 'stitch-edge-drawn');
      });
    });
    setIsBuilding(false);
    setCursorState((prev) => ({ ...prev, visible: false, isClicking: false }));
  }, []);

  const runLiveDrawAnimation = useCallback((containerEl) => {
    const container = containerEl || (modalViewportRef.current || containerRef.current);
    if (!container) return;
    const wrapper = container.querySelector('.mermaid-svg-wrapper');
    if (!wrapper) return;

    clearAnimTimeouts();

    const nodes = Array.from(wrapper.querySelectorAll('.node, g.node'));
    let edges = [];
    const edgeContainer = wrapper.querySelector('g.edgePaths');
    const edgeLabelContainer = wrapper.querySelector('g.edgeLabels');

    if (edgeContainer) {
      edges = Array.from(edgeContainer.querySelectorAll('g.edgePath, path.flowchart-link, path'));
    }
    if (edges.length === 0) {
      edges = Array.from(wrapper.querySelectorAll('.edgePath, g.edgePath, path.flowchart-link'));
    }

    if (nodes.length === 0) return;

    // 1. Immediately hide all nodes and edges via direct inline styles & class
    wrapper.classList.add('building');

    if (edgeContainer) {
      edgeContainer.style.setProperty('visibility', 'hidden', 'important');
      edgeContainer.style.setProperty('opacity', '0', 'important');
    }
    if (edgeLabelContainer) {
      edgeLabelContainer.style.setProperty('visibility', 'hidden', 'important');
      edgeLabelContainer.style.setProperty('opacity', '0', 'important');
    }

    nodes.forEach((n) => {
      n.style.setProperty('visibility', 'hidden', 'important');
      n.style.setProperty('opacity', '0', 'important');
      n.classList.remove('stitch-node-wireframe', 'stitch-node-solidified');
    });
    edges.forEach((e) => {
      e.style.setProperty('visibility', 'hidden', 'important');
      e.style.setProperty('opacity', '0', 'important');
      e.classList.remove('stitch-edge-drawing', 'stitch-edge-drawn');
    });

    setIsBuilding(true);

    // Initial cursor coordinates: positioned above the first block
    const vpRect = container.getBoundingClientRect();
    const firstRect = nodes[0].getBoundingClientRect();
    const startX = (firstRect.width > 0)
      ? Math.max(20, (firstRect.left - vpRect.left) + container.scrollLeft + (firstRect.width / 2))
      : (vpRect.width / 2);
    const startY = (firstRect.height > 0)
      ? Math.max(20, (firstRect.top - vpRect.top) + container.scrollTop - 40)
      : 40;

    // ── Phase 1: Synthesizing Architecture (~750ms) ──
    setCursorState({
      x: startX,
      y: startY,
      visible: true,
      status: '🧠 Synthesizing Architecture...',
      label: 'Planning blocks & flows',
      isClicking: false
    });

    let timeline = 750;
    const BLOCK_STEP = 900; // time to glide to block, sketch wireframe, and solidify

    // ── Phase 2: Draw All Blocks & Names One by One (NO arrows yet) ──
    nodes.forEach((nodeEl, idx) => {
      // Step 2A: Glide cursor to block center & sketch glowing wireframe
      const tDraft = setTimeout(() => {
        const curWrapper = container.querySelector('.mermaid-svg-wrapper');
        const curNodes = curWrapper ? Array.from(curWrapper.querySelectorAll('.node, g.node')) : [];
        const targetNode = curNodes[idx] || nodeEl;
        if (!targetNode) return;

        const currentVp = container.getBoundingClientRect();
        const nodeR = targetNode.getBoundingClientRect();
        const nx = (nodeR.width > 0)
          ? (nodeR.left - currentVp.left) + container.scrollLeft + (nodeR.width / 2)
          : (currentVp.width / 2);
        const ny = (nodeR.height > 0)
          ? (nodeR.top - currentVp.top) + container.scrollTop + (nodeR.height / 2)
          : (idx * 90 + 70);

        const labelText = targetNode.textContent?.trim().replace(/\s+/g, ' ').slice(0, 24) || `Block ${idx + 1}`;

        setCursorState({
          x: nx,
          y: ny,
          visible: true,
          status: `Drawing Block (${idx + 1}/${nodes.length})`,
          label: labelText,
          isClicking: false
        });

        // Unhide this specific node and add wireframe blueprint style
        targetNode.style.setProperty('visibility', 'visible', 'important');
        targetNode.style.setProperty('opacity', '1', 'important');
        targetNode.classList.remove('stitch-node-solidified');
        targetNode.classList.add('stitch-node-wireframe');

        // Smoothly auto-scroll container so current block stays centered if tall diagram
        if (nodeR.height > 0 && currentVp.height > 0) {
          const relativeY = nodeR.top - currentVp.top;
          if (relativeY > currentVp.height * 0.72 || relativeY < 50) {
            container.scrollTo({
              top: container.scrollTop + relativeY - currentVp.height * 0.35,
              behavior: 'smooth'
            });
          }
        }
      }, timeline);
      animTimeoutsRef.current.push(tDraft);

      // Step 2B: Solidify card with cyan bloom flash & click shockwave
      const tSolidify = setTimeout(() => {
        const curWrapper = container.querySelector('.mermaid-svg-wrapper');
        const curNodes = curWrapper ? Array.from(curWrapper.querySelectorAll('.node, g.node')) : [];
        const targetNode = curNodes[idx] || nodeEl;
        if (targetNode) {
          targetNode.classList.remove('stitch-node-wireframe');
          targetNode.classList.add('stitch-node-solidified');
        }

        setCursorState((prev) => ({
          ...prev,
          status: 'Card Solidified ✨',
          isClicking: true
        }));
      }, timeline + 480);
      animTimeoutsRef.current.push(tSolidify);

      // Step 2C: Release click shockwave
      const tRelease = setTimeout(() => {
        setCursorState((prev) => ({ ...prev, isClicking: false }));
      }, timeline + 680);
      animTimeoutsRef.current.push(tRelease);

      timeline += BLOCK_STEP;
    });

    // ── Phase 3: Connect the Blocks with Arrows One by One ──
    // ONLY starts after all blocks have been drafted and named!
    const tPauseNotice = setTimeout(() => {
      const curWrapper = container.querySelector('.mermaid-svg-wrapper');
      if (curWrapper) {
        const curEdgeContainer = curWrapper.querySelector('g.edgePaths');
        if (curEdgeContainer) {
          curEdgeContainer.style.setProperty('visibility', 'visible', 'important');
          curEdgeContainer.style.setProperty('opacity', '1', 'important');
        }
        const curEdgeLabelContainer = curWrapper.querySelector('g.edgeLabels');
        if (curEdgeLabelContainer) {
          curEdgeLabelContainer.style.setProperty('visibility', 'visible', 'important');
          curEdgeLabelContainer.style.setProperty('opacity', '1', 'important');
        }
      }

      setCursorState((prev) => ({
        ...prev,
        status: '🔗 Connecting Blocks with Arrows...',
        label: 'Tracing Connectors',
        isClicking: false
      }));
    }, timeline + 100);
    animTimeoutsRef.current.push(tPauseNotice);

    timeline += 500;
    const EDGE_STEP = 800; // ~0.8s per connector arrow

    edges.forEach((edgeEl, edgeIdx) => {
      // Step 3A: Move cursor to start of connector & shoot laser beam
      const tStartLink = setTimeout(() => {
        const curWrapper = container.querySelector('.mermaid-svg-wrapper');
        let curEdges = [];
        if (curWrapper) {
          const edgeGroup = curWrapper.querySelector('g.edgePaths');
          if (edgeGroup) {
            curEdges = Array.from(edgeGroup.querySelectorAll('g.edgePath, path.flowchart-link, path'));
          }
          if (curEdges.length === 0) {
            curEdges = Array.from(curWrapper.querySelectorAll('.edgePath, g.edgePath, path.flowchart-link'));
          }
        }
        const targetEdge = curEdges[edgeIdx] || edgeEl;
        if (!targetEdge) return;

        const currentVp = container.getBoundingClientRect();
        const edgeR = targetEdge.getBoundingClientRect();
        const ex = (edgeR.width > 0)
          ? (edgeR.left - currentVp.left) + container.scrollLeft + (edgeR.width / 2)
          : (currentVp.width / 2);
        const eyStart = (edgeR.height > 0)
          ? (edgeR.top - currentVp.top) + container.scrollTop + 6
          : (edgeIdx * 90 + 90);

        setCursorState({
          x: ex,
          y: eyStart,
          visible: true,
          status: `Connecting Flow (${edgeIdx + 1}/${edges.length})`,
          label: 'Connecting ➔',
          isClicking: false
        });

        // Unhide this edge and start drawing
        targetEdge.style.setProperty('visibility', 'visible', 'important');
        targetEdge.style.setProperty('opacity', '1', 'important');
        targetEdge.classList.add('stitch-edge-drawing');
      }, timeline);
      animTimeoutsRef.current.push(tStartLink);

      // Step 3B: Glide cursor down arrow path to the tip & stamp shockwave
      const tFinishLink = setTimeout(() => {
        const curWrapper = container.querySelector('.mermaid-svg-wrapper');
        let curEdges = [];
        if (curWrapper) {
          const edgeGroup = curWrapper.querySelector('g.edgePaths');
          if (edgeGroup) {
            curEdges = Array.from(edgeGroup.querySelectorAll('g.edgePath, path.flowchart-link, path'));
          }
          if (curEdges.length === 0) {
            curEdges = Array.from(curWrapper.querySelectorAll('.edgePath, g.edgePath, path.flowchart-link'));
          }
        }
        const targetEdge = curEdges[edgeIdx] || edgeEl;
        if (targetEdge) {
          targetEdge.classList.remove('stitch-edge-drawing');
          targetEdge.classList.add('stitch-edge-drawn');
        }

        const currentVp = container.getBoundingClientRect();
        const edgeR = targetEdge ? targetEdge.getBoundingClientRect() : { width: 0, height: 0, left: 0, top: 0 };
        const ex = (edgeR.width > 0)
          ? (edgeR.left - currentVp.left) + container.scrollLeft + (edgeR.width / 2)
          : (currentVp.width / 2);
        const eyEnd = (edgeR.height > 0)
          ? (edgeR.top - currentVp.top) + container.scrollTop + Math.max(16, edgeR.height - 4)
          : (edgeIdx * 90 + 130);

        setCursorState({
          x: ex,
          y: eyEnd,
          visible: true,
          status: `Arrow Linked (${edgeIdx + 1}/${edges.length})`,
          label: 'Flow Connected ✨',
          isClicking: true
        });
      }, timeline + 440);
      animTimeoutsRef.current.push(tFinishLink);

      // Step 3C: Release click shockwave
      const tEdgeRelease = setTimeout(() => {
        setCursorState((prev) => ({ ...prev, isClicking: false }));
      }, timeline + 640);
      animTimeoutsRef.current.push(tEdgeRelease);

      timeline += EDGE_STEP;
    });

    // ── Phase 4: Settle & Complete ──
    const tFinish = setTimeout(() => {
      const curWrapper = container.querySelector('.mermaid-svg-wrapper');
      if (curWrapper) {
        const curNodes = curWrapper.querySelectorAll('.node, g.node');
        curNodes.forEach((n) => {
          n.style.removeProperty('visibility');
          n.style.removeProperty('opacity');
        });
        const curEdges = curWrapper.querySelectorAll('.edgePath, g.edgePath, path.flowchart-link, g.edgePaths path');
        curEdges.forEach((e) => {
          e.style.removeProperty('visibility');
          e.style.removeProperty('opacity');
          e.classList.remove('stitch-edge-drawing');
          e.classList.add('stitch-edge-drawn');
        });
      }

      setCursorState((prev) => ({
        ...prev,
        status: 'Flowchart Complete ✨',
        label: 'Canvas Ready',
        isClicking: false
      }));

      const tHide = setTimeout(() => {
        if (curWrapper) curWrapper.classList.remove('building');
        setCursorState((prev) => ({ ...prev, visible: false }));
        setIsBuilding(false);
      }, 950);
      animTimeoutsRef.current.push(tHide);
    }, timeline + 200);
    animTimeoutsRef.current.push(tFinish);
  }, []);

  const handleSkipBuild = (targetEl) => {
    stopAndCleanAnimation(targetEl || (isModalOpen ? modalViewportRef.current : containerRef.current));
  };

  const handleReplayBuild = () => {
    const activeTarget = (isModalOpen && modalViewportRef.current) ? modalViewportRef.current : containerRef.current;
    runLiveDrawAnimation(activeTarget);
  };

  const handleToggleLiveDraw = () => {
    if (isBuilding) {
      handleSkipBuild();
    }
    setIsLiveDrawEnabled((prev) => !prev);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearAnimTimeouts();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable autoFit without modalZoom dependency loop
  const autoFitModalChart = useCallback(() => {
    if (!modalViewportRef.current) return;
    const svgEl = modalViewportRef.current.querySelector('svg');
    if (!svgEl) return;

    const svgRect = svgEl.getBoundingClientRect();
    const vpH = modalViewportRef.current.clientHeight || 650;
    const vpW = modalViewportRef.current.clientWidth || 800;

    if (svgRect.height > 0) {
      const currentZ = modalZoomRef.current || 0.65;
      const rawH = svgRect.height / currentZ;
      const rawW = svgRect.width / currentZ;

      const targetH = vpH - 100;
      const targetW = vpW - 120;

      const scaleH = targetH / rawH;
      const scaleW = targetW / rawW;

      // Cap ideal between 0.22 and 0.65 so all initial boxes fit comfortably in the viewport!
      const ideal = Math.max(0.22, Math.min(0.65, Math.min(scaleH, scaleW)));
      setModalZoom(Number(ideal.toFixed(2)));
    }
  }, []);

  // Reset modal scroll and state whenever modal is opened
  useEffect(() => {
    if (isModalOpen) {
      setIsModalKeypointsOpen(false); // Collapsed by default
      const timer = setTimeout(() => {
        if (modalViewportRef.current) {
          modalViewportRef.current.scrollTop = 0;
          modalViewportRef.current.scrollLeft = 0;
          autoFitModalChart();
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, autoFitModalChart]);

  // Generate unique render ID per component mount to prevent SVG collisions
  const uniqueIdRef = useRef(`mermaid_${Math.random().toString(36).substr(2, 9)}`);

  const activeChartCode = chart || (points.length > 0
    ? `flowchart TD\n  Root["🎯 Visual Overview"]\n${points.slice(0, 6).map((p, i) => `  Node_${i + 1}["${p.replace(/["\(\)\[\]\{\}]/g, ' ').slice(0, 40)}"]\n  Root --> Node_${i + 1}`).join('\n')}`
    : `flowchart TD\n  Start["No diagram data"]`);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setRenderError(null);

    async function renderChart() {
      try {
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            darkMode: true,
            background: 'transparent',
            primaryColor: '#161D30',
            primaryTextColor: '#F8FAFC',
            primaryBorderColor: '#3B82F6',
            lineColor: '#60A5FA',
            secondaryColor: '#1E1B4B',
            tertiaryColor: '#0F172A',
            edgeLabelBackground: '#161D30',
            fontFamily: 'var(--font-outfit), sans-serif',
            fontSize: '11px',
            nodeBorder: '1.25px'
          },
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 18,
            rankSpacing: 24,
            padding: 12
          }
        });

        const sanitized = sanitizeMermaid(activeChartCode);
        const renderId = uniqueIdRef.current;

        // Render SVG dynamically
        const { svg } = await mermaid.render(renderId, sanitized);
        let cleanSvg = svg;
        cleanSvg = cleanSvg.replace(/<svg\s+([^>]*?)style="([^"]*?)"/i, (m, attrs, style) => {
          return `<svg ${attrs} style="${style}; max-width: min(100%, 360px); margin: 0 auto; display: block;"`;
        });
        if (!cleanSvg.includes('style=')) {
          cleanSvg = cleanSvg.replace(/<svg\s+/i, '<svg style="max-width: min(100%, 360px); margin: 0 auto; display: block;" ');
        }

        if (isMounted) {
          setSvgHtml(cleanSvg);
          setLoading(false);
          setTimeout(() => {
            autoFitModalChart();
          }, 60);
        }
      } catch (err) {
        console.warn('Mermaid rendering failed, attempting simplified fallback:', err);
        // Fallback: try ultra-simple synthesized tree from points
        if (points && points.length > 0) {
          try {
            const mermaid = (await import('mermaid')).default;
            const simpleChart = `flowchart TD\n  Root["🎯 Concept Summary"]\n${points.slice(0, 5).map((p, idx) => `  P${idx + 1}["${p.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().slice(0, 36)}"]\n  Root --> P${idx + 1}`).join('\n')}`;
            const { svg } = await mermaid.render(`${uniqueIdRef.current}_fallback`, simpleChart);
            let cleanSvg = svg;
            cleanSvg = cleanSvg.replace(/<svg\s+([^>]*?)style="([^"]*?)"/i, (m, attrs, style) => {
              return `<svg ${attrs} style="${style}; max-width: min(100%, 360px); margin: 0 auto; display: block;"`;
            });
            if (!cleanSvg.includes('style=')) {
              cleanSvg = cleanSvg.replace(/<svg\s+/i, '<svg style="max-width: min(100%, 360px); margin: 0 auto; display: block;" ');
            }
            if (isMounted) {
              setSvgHtml(cleanSvg);
              setLoading(false);
              setTimeout(() => {
                autoFitModalChart();
              }, 60);
              return;
            }
          } catch (fbErr) {
            console.error('Fallback mermaid render error:', fbErr);
          }
        }
        if (isMounted) {
          setRenderError(err?.message || 'Diagram syntax parsing error');
          setLoading(false);
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [activeChartCode, points, autoFitModalChart]);

  // Trigger Stitch AI live draw once the active viewport & its SVG nodes are mounted
  useEffect(() => {
    if (!svgHtml || !isLiveDrawEnabled) return;

    let cancelled = false;
    let attempts = 0;

    const timer = setInterval(() => {
      attempts++;
      const target = (isModalOpen && modalViewportRef.current)
        ? modalViewportRef.current
        : containerRef.current;

      if (target) {
        const wrapper = target.querySelector('.mermaid-svg-wrapper');
        const nodes = target.querySelectorAll('.node, g.node');
        if (wrapper && nodes.length > 0) {
          clearInterval(timer);
          if (!cancelled) {
            runLiveDrawAnimation(target);
          }
          return;
        }
      }

      if (attempts > 50) {
        clearInterval(timer);
      }
    }, 45);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [svgHtml, isLiveDrawEnabled, isModalOpen, runLiveDrawAnimation]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));
  const handleZoomReset = () => setZoom(1);

  const handleModalZoomIn = () => setModalZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 3.5));
  const handleModalZoomOut = () => setModalZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.15));
  const handleModalZoomReset = () => setModalZoom(1);

  // Attach non-passive wheel event listener to modal viewport to zoom ONLY the canvas and prevent whole webpage zoom
  useEffect(() => {
    if (!isModalOpen) return;
    const vp = modalViewportRef.current;
    if (!vp) return;

    const handleWheelNonPassive = (e) => {
      // If Ctrl/Meta key or trackpad pinch gesture is used:
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // STRICTLY PREVENTS BROWSER WEBPAGE ZOOM!
        e.stopPropagation();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setModalZoom((prev) => Math.max(0.15, Math.min(3.5, Number((prev * factor).toFixed(2)))));
      }
    };

    vp.addEventListener('wheel', handleWheelNonPassive, { passive: false });
    return () => {
      vp.removeEventListener('wheel', handleWheelNonPassive);
    };
  }, [isModalOpen]);

  // Attach non-passive wheel event listener to inline viewport as well
  useEffect(() => {
    const vp = containerRef.current;
    if (!vp) return;

    const handleInlineWheelNonPassive = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // PREVENTS BROWSER WEBPAGE ZOOM!
        e.stopPropagation();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setZoom((prev) => Math.max(0.3, Math.min(2.5, Number((prev * factor).toFixed(2)))));
      }
    };

    vp.addEventListener('wheel', handleInlineWheelNonPassive, { passive: false });
    return () => {
      vp.removeEventListener('wheel', handleInlineWheelNonPassive);
    };
  }, []);

  const handleFitToScreen = () => {
    if (!modalViewportRef.current) {
      setModalZoom(0.85);
      return;
    }
    const svgEl = modalViewportRef.current.querySelector('svg');
    if (!svgEl) {
      setModalZoom(0.85);
      return;
    }
    const svgRect = svgEl.getBoundingClientRect();
    const vpRect = modalViewportRef.current.getBoundingClientRect();
    if (svgRect.height > 0 && vpRect.height > 0) {
      const scaleH = (vpRect.height - 120) / (svgRect.height / modalZoom);
      const scaleW = (vpRect.width - 80) / (svgRect.width / modalZoom);
      const idealZoom = Math.min(Math.max(Math.min(scaleH, scaleW), 0.35), 1.25);
      setModalZoom(Number(idealZoom.toFixed(2)));
    } else {
      setModalZoom(0.85);
    }
  };

  const handleMouseDown = (e) => {
    e.stopPropagation(); // Stop mousedown bubbling to document outside-click handler!
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('a')) return;
    if (!modalViewportRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: modalViewportRef.current.scrollLeft,
      scrollTop: modalViewportRef.current.scrollTop
    };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || !modalViewportRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    modalViewportRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
    modalViewportRef.current.scrollTop = panStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = (e) => {
    if (e) e.stopPropagation();
    setIsPanning(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeChartCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const btnBaseStyle = {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#94A3B8',
    borderRadius: 6,
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    outline: 'none',
    lineHeight: 1,
    boxShadow: 'none',
    transition: 'all 0.15s ease'
  };

  return (
    <div
      className="mermaid-container"
      data-feature-container="true"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(12, 15, 28, 0.95)',
        border: '1px solid rgba(91, 140, 248, 0.2)',
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 10px 30px -8px rgba(0, 0, 0, 0.5)',
        marginTop: 10,
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Toolbar */}
      <div
        className="mermaid-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 14px',
          background: 'rgba(18, 23, 38, 0.92)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        <div className="mermaid-title-area" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="mermaid-badge"
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: 6,
              background: 'rgba(91, 140, 248, 0.15)',
              color: '#729DF8',
              border: '1px solid rgba(91, 140, 248, 0.3)',
              display: 'inline-block'
            }}
          >
            Mermaid Infographic
          </span>
          <span
            className="mermaid-label"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#E2E8F0'
            }}
          >
            Dynamic Flowchart & Concepts
          </span>
        </div>

        <div className="mermaid-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Google Stitch AI Live Draw 1-Click Toggle */}
          <button
            type="button"
            className={`stitch-toggle-btn ${isLiveDrawEnabled ? 'active' : ''}`}
            onClick={handleToggleLiveDraw}
            title={isLiveDrawEnabled ? "Live AI Drawing Enabled (Click to disable)" : "Live AI Drawing Disabled (Click to enable)"}
          >
            <div className="stitch-toggle-track">
              <div className="stitch-toggle-thumb" />
            </div>
            <span>Live Draw</span>
          </button>

          {/* Skip button during building */}
          {isBuilding && (
            <button
              type="button"
              className="stitch-skip-btn"
              onClick={() => handleSkipBuild()}
              title="Skip live drawing animation"
            >
              <span>Skip ⏭</span>
            </button>
          )}

          {/* Replay Build button when diagram is ready and not currently building */}
          {!isBuilding && !loading && !renderError && svgHtml && (
            <button
              type="button"
              className="stitch-replay-btn"
              onClick={handleReplayBuild}
              title="Replay Google Stitch-inspired AI live drawing"
            >
              <Sparkles size={12} color="#D8B4FE" />
              <span>Replay ✨</span>
            </button>
          )}

          {/* Zoom controls */}
          <button
            type="button"
            className="mermaid-btn"
            style={btnBaseStyle}
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in diagram"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            className="mermaid-btn"
            style={btnBaseStyle}
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out diagram"
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            className="mermaid-btn"
            style={btnBaseStyle}
            onClick={handleZoomReset}
            title="Reset Zoom"
            aria-label="Reset zoom"
          >
            <RotateCcw size={12} />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          {/* Code viewer toggle */}
          <button
            type="button"
            className={`mermaid-btn ${showCode ? 'active' : ''}`}
            style={{
              ...btnBaseStyle,
              background: showCode ? 'rgba(91, 140, 248, 0.2)' : btnBaseStyle.background,
              color: showCode ? '#729DF8' : btnBaseStyle.color,
              borderColor: showCode ? 'rgba(91, 140, 248, 0.4)' : btnBaseStyle.borderColor
            }}
            onClick={() => setShowCode(!showCode)}
            title="Toggle Mermaid Code"
          >
            <Code size={13} />
            <span>DSL</span>
          </button>

          {/* Copy button */}
          <button
            type="button"
            className="mermaid-btn"
            style={btnBaseStyle}
            onClick={handleCopyCode}
            title="Copy Diagram Syntax"
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
          </button>

          {/* Fullscreen / Expand Modal Toggle */}
          <button
            type="button"
            className="mermaid-btn mermaid-expand-btn"
            style={{
              ...btnBaseStyle,
              color: '#60A5FA',
              background: 'rgba(96, 165, 250, 0.1)',
              borderColor: 'rgba(96, 165, 250, 0.3)'
            }}
            onClick={() => setIsModalOpen(true)}
            title="Open in Focused Modal Window"
          >
            <Maximize2 size={12} />
            <span>Expand</span>
          </button>

          {/* Optional Regenerate */}
          {onRegenerate && (
            <button
              type="button"
              className="mermaid-btn"
              style={{
                ...btnBaseStyle,
                color: '#F59E0B',
                background: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.25)'
              }}
              onClick={onRegenerate}
              title="Regenerate Infographic"
            >
              <Sparkles size={13} color="#F59E0B" />
              <span>Regen</span>
            </button>
          )}

          {/* Optional Close button */}
          {onClose && (
            <button
              type="button"
              className="mermaid-btn"
              style={{
                ...btnBaseStyle,
                color: '#F87171',
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.25)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close Visual Summary"
            >
              <X size={12} color="#F87171" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      {showCode ? (
        <pre className="mermaid-raw-code" style={{ padding: 16, background: '#070913', color: '#7DD3FC', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 320, overflowY: 'auto', margin: 0 }}>
          {activeChartCode}
        </pre>
      ) : (
        <div
          className="mermaid-viewport"
          ref={containerRef}
          style={{
            position: 'relative',
            minHeight: 220,
            maxHeight: 520,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px 20px',
            background: 'radial-gradient(circle at 50% 50%, rgba(17, 24, 39, 0.85) 0%, rgba(8, 10, 18, 0.98) 100%)',
            userSelect: 'none'
          }}
        >
          {/* Google Stitch AI Floating Cursor */}
          <StitchAICursor
            x={cursorState.x}
            y={cursorState.y}
            visible={isBuilding && cursorState.visible && !isModalOpen}
            status={cursorState.status}
            label={cursorState.label}
            isClicking={cursorState.isClicking}
          />

          {loading && (
            <div className="mermaid-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94A3B8', fontSize: 12, padding: '40px 0' }}>
              <Sparkles size={20} className="animate-spin" color="#3B82F6" />
              <span>Rendering Mermaid diagram...</span>
            </div>
          )}

          {!loading && renderError && (
            <div className="mermaid-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#F87171', fontSize: 12, padding: 24, textAlign: 'center' }}>
              <AlertCircle size={20} />
              <span>Could not render diagram visually: {renderError}</span>
              <button
                type="button"
                className="mermaid-btn"
                style={{ ...btnBaseStyle, marginTop: 8 }}
                onClick={() => setShowCode(true)}
              >
                Inspect Mermaid Code
              </button>
            </div>
          )}

          {!loading && !renderError && svgHtml && (
            <div
              className={`mermaid-svg-wrapper ${isBuilding ? 'building' : ''}`}
              style={{
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                textAlign: 'center',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}
        </div>
      )}

      {/* Key Takeaways Section (Collapsible Accordion with Formatted Typography) */}
      {points && points.length > 0 && (
        <div
          className="mermaid-takeaways"
          style={{
            padding: '10px 14px',
            background: 'rgba(14, 18, 30, 0.75)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <button
            type="button"
            className="mermaid-takeaways-toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '8px 12px',
              color: '#94A3B8',
              outline: 'none',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setIsKeypointsOpen(!isKeypointsOpen)}
            title={isKeypointsOpen ? "Click to collapse takeaways" : "Click to view key takeaways"}
          >
            <div className="mermaid-takeaways-toggle-left" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={13} color="#F5A95B" />
              <span className="mermaid-takeaways-title" style={{ fontSize: 11, fontWeight: 700, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Key Takeaways & Concepts
              </span>
              <span className="mermaid-takeaways-count" style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                ({points.length} points)
              </span>
            </div>
            <ChevronDown
              size={15}
              className={`mermaid-takeaways-chevron ${isKeypointsOpen ? 'open' : ''}`}
              style={{
                color: isKeypointsOpen ? '#F5A95B' : '#64748B',
                transform: isKeypointsOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </button>

          {isKeypointsOpen && (
            <div className="mermaid-takeaways-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8, marginTop: 4 }}>
              {points.map((pt, idx) => (
                <div
                  key={idx}
                  className="mermaid-takeaway-item"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 8
                  }}
                >
                  <span
                    className="mermaid-takeaway-bullet"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      background: 'rgba(245, 169, 91, 0.15)',
                      color: '#F5A95B',
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="mermaid-takeaway-text" style={{ color: '#E2E8F0', fontSize: 12.5, lineHeight: 1.5, flex: 1 }}>
                    {renderFormattedText(pt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded Modal Window mounted directly to document.body to prevent layout clipping */}
      {mounted && isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="mermaid-modal-backdrop"
          data-feature-container="true"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(2, 4, 10, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <div
            className="mermaid-modal-window"
            data-feature-container="true"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(98vw, 1480px)',
              height: 'min(96vh, 940px)',
              maxHeight: 'calc(100vh - 32px)',
              background: '#080B14',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 16,
              boxShadow: '0 30px 90px -10px rgba(0, 0, 0, 0.95), 0 0 50px rgba(59, 130, 246, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div
              className="mermaid-modal-header"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: 'rgba(14, 19, 32, 0.98)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                flexShrink: 0,
                gap: 12,
                zIndex: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Prominent Back to Chat button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(false);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(91, 140, 248, 0.18)',
                    border: '1px solid rgba(91, 140, 248, 0.45)',
                    color: '#93C5FD',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Return to Chat"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Chat</span>
                </button>

                <div className="mermaid-title-area" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="mermaid-badge"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(91, 140, 248, 0.15)',
                      color: '#729DF8',
                      border: '1px solid rgba(91, 140, 248, 0.3)'
                    }}
                  >
                    Expanded Infographic
                  </span>
                  <span className="mermaid-label" style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>
                    Full Interactive View
                  </span>
                </div>
              </div>

              <div className="mermaid-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Google Stitch AI Live Draw 1-Click Toggle */}
                <button
                  type="button"
                  className={`stitch-toggle-btn ${isLiveDrawEnabled ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLiveDraw();
                  }}
                  title={isLiveDrawEnabled ? "Live AI Drawing Enabled (Click to disable)" : "Live AI Drawing Disabled (Click to enable)"}
                >
                  <div className="stitch-toggle-track">
                    <div className="stitch-toggle-thumb" />
                  </div>
                  <span>Live Draw</span>
                </button>

                {/* Skip button during building */}
                {isBuilding && (
                  <button
                    type="button"
                    className="stitch-skip-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkipBuild(modalViewportRef.current);
                    }}
                    title="Skip live drawing animation"
                  >
                    <span>Skip ⏭</span>
                  </button>
                )}

                {/* Replay Build button */}
                {!isBuilding && svgHtml && (
                  <button
                    type="button"
                    className="stitch-replay-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      runLiveDrawAnimation(modalViewportRef.current);
                    }}
                    title="Replay Google Stitch-inspired AI live drawing in full screen"
                  >
                    <Sparkles size={12} color="#D8B4FE" />
                    <span>Replay ✨</span>
                  </button>
                )}

                {/* Toggle Key Takeaways Drawer */}
                {points && points.length > 0 && (
                  <button
                    type="button"
                    className={`mermaid-btn mermaid-modal-keypoints-btn ${isModalKeypointsOpen ? 'active' : ''}`}
                    style={{
                      ...btnBaseStyle,
                      color: isModalKeypointsOpen ? '#F5A95B' : '#94A3B8',
                      borderColor: isModalKeypointsOpen ? 'rgba(245, 169, 91, 0.4)' : btnBaseStyle.borderColor,
                      background: isModalKeypointsOpen ? 'rgba(245, 169, 91, 0.15)' : btnBaseStyle.background,
                      padding: '6px 12px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalKeypointsOpen(!isModalKeypointsOpen);
                    }}
                    title={isModalKeypointsOpen ? "Hide Key Takeaways Drawer" : "Show Key Takeaways on Right Side"}
                  >
                    <Sparkles size={13} color="#F5A95B" />
                    <span>Key Takeaways ({points.length})</span>
                  </button>
                )}

                {/* Zoom Controls & Fit button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255, 255, 255, 0.04)', padding: 3, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    className="mermaid-btn"
                    style={btnBaseStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalZoomIn();
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    className="mermaid-btn"
                    style={btnBaseStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalZoomOut();
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <button
                    type="button"
                    className="mermaid-btn"
                    style={btnBaseStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalZoomReset();
                    }}
                    title="Reset Zoom"
                  >
                    <RotateCcw size={12} />
                    <span>{Math.round(modalZoom * 100)}%</span>
                  </button>
                  <button
                    type="button"
                    className="mermaid-btn"
                    style={btnBaseStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFitToScreen();
                    }}
                    title="Fit Entire Flowchart to Screen"
                  >
                    <Maximize2 size={12} />
                    <span>Fit</span>
                  </button>
                </div>

                {/* Close Button: STRICTLY closes the modal and the feature */}
                <button
                  type="button"
                  className="mermaid-modal-close-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#FCA5A5',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(false);
                    if (onClose) onClose();
                  }}
                  title="Close Modal"
                >
                  <X size={15} />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Modal Main Body: Centered Flowchart Canvas with Optional Key Takeaways Drawer */}
            <div
              className="mermaid-modal-body"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'row',
                minHeight: 0,
                overflow: 'hidden',
                position: 'relative',
                height: 'calc(100% - 94px)'
              }}
            >
              <div
                className={`mermaid-modal-viewport ${isPanning ? 'panning' : ''}`}
                ref={modalViewportRef}
                data-feature-container="true"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  height: '100%',
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'auto',
                  padding: '40px 30px 100px',
                  background: 'radial-gradient(circle at 50% 30%, rgba(18, 25, 42, 0.85) 0%, rgba(7, 9, 16, 0.98) 100%)',
                  position: 'relative',
                  cursor: isPanning ? 'grabbing' : 'grab',
                  scrollBehavior: 'smooth'
                }}
              >
                {/* Stitch AI Cursor for Fullscreen Modal */}
                <StitchAICursor
                  x={cursorState.x}
                  y={cursorState.y}
                  visible={isBuilding && cursorState.visible && isModalOpen}
                  status={cursorState.status}
                  label={cursorState.label}
                  isClicking={cursorState.isClicking}
                />

                {svgHtml && (
                  <div
                    className={`mermaid-svg-wrapper modal-chart ${isBuilding ? 'building' : ''}`}
                    style={{
                      margin: '0 auto',
                      minWidth: 'fit-content',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      transform: `scale(${modalZoom})`,
                      transformOrigin: 'top center',
                      transition: isPanning ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      paddingBottom: 80
                    }}
                    dangerouslySetInnerHTML={{ __html: svgHtml }}
                  />
                )}
              </div>

              {/* Right-Side Key Takeaways Drawer */}
              {points && points.length > 0 && isModalKeypointsOpen && (
                <aside
                  className="mermaid-modal-sidebar"
                  style={{
                    width: 360,
                    maxWidth: 380,
                    flexShrink: 0,
                    height: '100%',
                    background: '#0B0F19',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
                    zIndex: 15
                  }}
                >
                  <div
                    className="mermaid-modal-sidebar-header"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(16, 22, 36, 0.8)',
                      flexShrink: 0
                    }}
                  >
                    <div className="mermaid-modal-sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Sparkles size={14} color="#F5A95B" />
                      <span>Key Takeaways</span>
                      <span className="mermaid-takeaways-count">({points.length})</span>
                    </div>
                    <button
                      type="button"
                      className="mermaid-modal-sidebar-close"
                      style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                      onClick={() => setIsModalKeypointsOpen(false)}
                      title="Collapse Key Takeaways"
                      aria-label="Collapse Key Takeaways"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="mermaid-modal-sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {points.map((pt, idx) => (
                      <div key={idx} className="mermaid-takeaway-item sidebar-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8 }}>
                        <span className="mermaid-takeaway-bullet" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: 5, background: 'rgba(245, 169, 91, 0.15)', color: '#F5A95B', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{idx + 1}</span>
                        <div className="mermaid-takeaway-text" style={{ color: '#E2E8F0', fontSize: 12.5, lineHeight: 1.5, flex: 1 }}>{renderFormattedText(pt)}</div>
                      </div>
                    ))}
                  </div>
                </aside>
              )}
            </div>

            {/* Modal Bottom Status Bar */}
            <div
              className="mermaid-modal-statusbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 20px',
                background: 'rgba(10, 14, 26, 0.96)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                fontSize: 11.5,
                flexShrink: 0,
                zIndex: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Move size={13} color="#60A5FA" />
                <span>Click &amp; drag or scroll to pan canvas &bull; Ctrl + Scroll to zoom freely &bull; Esc to go back</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#64748B' }}>Canvas Zoom:</span>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>{Math.round(modalZoom * 100)}%</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
