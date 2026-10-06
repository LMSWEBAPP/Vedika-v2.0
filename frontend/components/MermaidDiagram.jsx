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

  // Sanitize node labels in square brackets: A[Text] or A["Text"]
  // Strips rogue markdown (**bold**, `code`, *italic*) and escapes unquoted parentheses or inner quotes
  code = code.replace(/(\[[^\]\n]+\])/g, (match) => {
    let inner = match.slice(1, -1).trim();
    // Strip markdown formatting characters that break Mermaid parser
    inner = inner.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
    
    // Check if already enclosed in quotes
    if (inner.startsWith('"') && inner.endsWith('"')) {
      const content = inner.slice(1, -1).replace(/"/g, "'");
      return `["${content}"]`;
    }
    // Clean inner double quotes and wrap in quotes safely
    return `["${inner.replace(/"/g, "'")}"]`;
  });

  return code;
}

/**
 * Harmonious, vivid theme colors for flowchart blocks and connector arrows
 */
const NODE_PALETTES = [
  {
    name: 'purple',
    stroke: '#A855F7',
    topHighlight: 'rgba(192, 132, 252, 0.55)',
    fillGrad: ['#24153E', '#130C22'],
    arrow: '#C084FC',
    text: '#F8FAFC'
  },
  {
    name: 'emerald',
    stroke: '#10B981',
    topHighlight: 'rgba(52, 211, 153, 0.55)',
    fillGrad: ['#0E2E22', '#081A14'],
    arrow: '#34D399',
    text: '#F8FAFC'
  },
  {
    name: 'amber',
    stroke: '#F59E0B',
    topHighlight: 'rgba(251, 191, 36, 0.55)',
    fillGrad: ['#321E0B', '#1C1106'],
    arrow: '#FBBF24',
    text: '#F8FAFC'
  },
  {
    name: 'rose',
    stroke: '#F43F5E',
    topHighlight: 'rgba(251, 113, 133, 0.55)',
    fillGrad: ['#32111A', '#1C090F'],
    arrow: '#FB7185',
    text: '#F8FAFC'
  },
  {
    name: 'cyan',
    stroke: '#06B6D4',
    topHighlight: 'rgba(56, 189, 248, 0.55)',
    fillGrad: ['#0C2732', '#07161C'],
    arrow: '#38BDF8',
    text: '#F8FAFC'
  },
  {
    name: 'indigo',
    stroke: '#6366F1',
    topHighlight: 'rgba(129, 140, 248, 0.55)',
    fillGrad: ['#181A40', '#0E0F25'],
    arrow: '#818CF8',
    text: '#F8FAFC'
  }
];



export default function MermaidDiagram({ chart, points = [], chatHistory = [], onRegenerate, onClose }) {
  const containerRef = useRef(null);
  const modalViewportRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [svgHtml, setSvgHtml] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.85);
  const [modalZoom, setModalZoom] = useState(0.75);
  const modalZoomRef = useRef(0.75);
  modalZoomRef.current = modalZoom;

  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isKeypointsOpen, setIsKeypointsOpen] = useState(false); // Collapsed by default (inline chat)
  const [isModalOpen, setIsModalOpen] = useState(false); // Clean inline display in chat response by default; expandable to fullscreen modal on demand!
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

  const stopAndCleanAnimation = useCallback(() => {
    clearAnimTimeouts();
    setIsBuilding(false);
    setCursorState((prev) => ({ ...prev, visible: false, isClicking: false }));
    const targets = [modalViewportRef.current, containerRef.current].filter(Boolean);
    targets.forEach((root) => {
      const wrapper = root.querySelector('.mermaid-svg-wrapper');
      if (wrapper) {
        wrapper.classList.remove('building');
        wrapper.style.opacity = '1';
        const allNodes = wrapper.querySelectorAll('.node, g.node');
        allNodes.forEach((n) => {
          n.style.opacity = '1';
          n.style.transform = 'none';
          n.style.filter = '';
        });
        const allEdges = wrapper.querySelectorAll('.edgePaths path, .edgePath path, path.flowchart-link, g[class*="edge"] path, marker, .arrowheadPath, .arrowMarkerPath, .edgeLabel, .edgeLabels');
        allEdges.forEach((e) => {
          e.style.opacity = '1';
        });
      }
    });
  }, []);

  // Compute stable intrinsic fit zoom so diagram fills viewport comfortably with zero sudden jumps
  const computeFitZoom = useCallback((viewportEl, isModal) => {
    if (!viewportEl) return isModal ? 0.9 : 0.85;
    const svgEl = viewportEl.querySelector('svg');
    if (!svgEl) return isModal ? 0.9 : 0.85;

    let intrinsicW = 500;
    let intrinsicH = 350;

    if (svgEl.viewBox?.baseVal?.width > 0 && svgEl.viewBox?.baseVal?.height > 0) {
      intrinsicW = svgEl.viewBox.baseVal.width;
      intrinsicH = svgEl.viewBox.baseVal.height;
    } else {
      const bbox = typeof svgEl.getBBox === 'function' ? svgEl.getBBox() : null;
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        intrinsicW = bbox.width;
        intrinsicH = bbox.height;
      }
    }

    const vpH = viewportEl.clientHeight || (isModal ? 650 : 380);
    const vpW = viewportEl.clientWidth || (isModal ? 900 : 650);

    const paddingX = isModal ? 60 : 30;
    const paddingY = isModal ? 70 : 30;

    const availW = Math.max(200, vpW - paddingX);
    const availH = Math.max(200, vpH - paddingY);

    const maxStageW = isModal ? 1150 : 780;
    const targetW = Math.min(availW, maxStageW);

    const aspect = intrinsicH / Math.max(40, intrinsicW);
    const renderedH = targetW * aspect;

    let ideal = 1.0;
    if (renderedH > availH) {
      ideal = availH / renderedH;
    }

    // Never collapse below minimum legible zoom!
    const minZ = isModal ? 0.55 : 0.65;
    const maxZ = isModal ? 1.4 : 1.15;

    return Number(Math.max(minZ, Math.min(maxZ, ideal)).toFixed(2));
  }, []);

  const autoFitModalChart = useCallback(() => {
    if (!modalViewportRef.current) return;
    const fit = computeFitZoom(modalViewportRef.current, true);
    setModalZoom(fit);
    modalZoomRef.current = fit;
    modalViewportRef.current.scrollTop = 0;
    modalViewportRef.current.scrollLeft = 0;
  }, [computeFitZoom]);

  const autoFitInlineChart = useCallback(() => {
    if (!containerRef.current) return;
    const fit = computeFitZoom(containerRef.current, false);
    setZoom(fit);
    containerRef.current.scrollTop = 0;
    containerRef.current.scrollLeft = 0;
  }, [computeFitZoom]);

  const runLiveDrawAnimation = useCallback((containerEl) => {
    const isModal = isModalOpen && modalViewportRef.current;
    const container = containerEl || (isModal ? modalViewportRef.current : containerRef.current);
    if (!container) return;

    clearAnimTimeouts();

    container.scrollTop = 0;
    container.scrollLeft = 0;

    const currentZoom = isModal ? (modalZoomRef.current || 0.85) : zoom;

    const wrapper = container.querySelector('.mermaid-svg-wrapper');
    if (!wrapper) return;
    const svgEl = wrapper.querySelector('svg');
    if (!svgEl) return;
    const stageEl = container.querySelector('.mermaid-canvas-stage') || wrapper;

    const stageRect = stageEl.getBoundingClientRect();
    const rawNodeEls = Array.from(wrapper.querySelectorAll('.node, g.node'));
    const rawEdgeEls = Array.from(wrapper.querySelectorAll('.edgePaths path, .edgePath path, path.flowchart-link, g[class*="edge"] path'));
    const rawMarkerEls = Array.from(wrapper.querySelectorAll('marker, .arrowMarkerPath, .arrowheadPath, [id*="pointEnd"] path, [id*="arrow"] path'));
    const rawLabelEls = Array.from(wrapper.querySelectorAll('.edgeLabel, .edgeLabels'));

    if (rawNodeEls.length === 0) return;

    const zoomFactor = currentZoom > 0 ? currentZoom : 1;

    const nodes = rawNodeEls.map((el, idx) => {
      const r = el.getBoundingClientRect();
      const text = el.textContent?.trim().replace(/\s+/g, ' ') || `Step ${idx + 1}`;
      let x = (r.left - stageRect.left) / zoomFactor;
      let y = (r.top - stageRect.top) / zoomFactor;
      let w = Math.max(80, r.width / zoomFactor);
      let h = Math.max(36, r.height / zoomFactor);

      if (r.width === 0 || r.height === 0) {
        const transform = el.getAttribute('transform');
        const match = transform && transform.match(/translate\(([^,\)]+)[,\s]+([^,\)]+)\)/);
        if (match) {
          x = parseFloat(match[1]);
          y = parseFloat(match[2]);
          w = 120;
          h = 44;
        }
      }

      return { id: el.id || `node_${idx}`, text, x, y, w, h, el };
    });

    // 1. Initial State: Hide all nodes and edges with smooth transitions
    nodes.forEach((n) => {
      n.el.style.opacity = '0';
      n.el.style.transform = 'scale(0.85)';
      n.el.style.transformOrigin = 'center center';
      n.el.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease';
    });
    rawEdgeEls.forEach((e) => {
      e.style.opacity = '0';
      e.style.transition = 'opacity 0.25s ease';
    });
    rawMarkerEls.forEach((m) => {
      m.style.opacity = '0';
      m.style.transition = 'opacity 0.25s ease';
    });
    rawLabelEls.forEach((l) => {
      l.style.opacity = '0';
      l.style.transition = 'opacity 0.25s ease';
    });

    wrapper.classList.add('building');
    setIsBuilding(true);

    // Initial position of white stylus pen (above first node)
    const firstNode = nodes[0];
    const startX = firstNode.x + firstNode.w / 2;
    const startY = Math.max(20, firstNode.y - 35);

    setCursorState({
      x: startX,
      y: startY,
      visible: true,
      status: '🧠 Synthesizing Diagram...',
      label: 'Vedika AI',
      isClicking: false
    });

    let timeline = 250;

    // Phase 2: Glide pen to each node, draw & permanently reveal it
    nodes.forEach((node, idx) => {
      const colorIdx = idx % NODE_PALETTES.length;
      const palette = NODE_PALETTES[colorIdx];

      // 2A: Pen glides to the node
      const tArrival = setTimeout(() => {
        setCursorState({
          x: node.x + node.w / 2,
          y: node.y + node.h / 2,
          visible: true,
          status: `Drawing Node (${idx + 1}/${nodes.length})`,
          label: node.text.slice(0, 22),
          isClicking: true,
          accentColor: palette.stroke
        });
      }, timeline);
      animTimeoutsRef.current.push(tArrival);

      // 2B: Node illuminates and permanently reveals into view
      const tReveal = setTimeout(() => {
        node.el.style.opacity = '1';
        node.el.style.transform = 'scale(1)';
        node.el.style.filter = `drop-shadow(0 0 14px ${palette.stroke})`;
        setCursorState((prev) => ({
          ...prev,
          isClicking: false,
          status: `Node ${idx + 1} Ready ✨`
        }));
      }, timeline + 120);
      animTimeoutsRef.current.push(tReveal);

      // 2C: Settle glow filter to default neon border
      const tSettle = setTimeout(() => {
        node.el.style.filter = '';
      }, timeline + 360);
      animTimeoutsRef.current.push(tSettle);

      // 2D: Draw connector arrow to next node if applicable
      if (idx < nodes.length - 1) {
        const nextNode = nodes[idx + 1];
        const edgeEl = rawEdgeEls[idx];

        const tEdge = setTimeout(() => {
          // Pen moves along connector path
          setCursorState({
            x: (node.x + nextNode.x) / 2 + node.w / 2,
            y: (node.y + nextNode.y) / 2 + node.h / 2,
            visible: true,
            status: 'Linking Flow ➔',
            label: '➔',
            isClicking: false,
            accentColor: palette.arrow
          });

          // Reveal edge and arrowheads permanently
          if (edgeEl) edgeEl.style.opacity = '1';
          rawMarkerEls.forEach((m) => { m.style.opacity = '1'; });
          rawLabelEls.forEach((l) => { l.style.opacity = '1'; });
        }, timeline + 400);
        animTimeoutsRef.current.push(tEdge);

        timeline += 620; // 400ms node + 220ms edge
      } else {
        timeline += 440;
      }
    });

    // Phase 3: Complete & Settle
    const tComplete = setTimeout(() => {
      setCursorState((prev) => ({
        ...prev,
        status: 'Infographic Complete ✨',
        label: 'Ready',
        isClicking: false
      }));

      // Ensure every element has full opacity and clean transforms
      nodes.forEach((n) => {
        n.el.style.opacity = '1';
        n.el.style.transform = 'none';
        n.el.style.filter = '';
      });
      rawEdgeEls.forEach((e) => { e.style.opacity = '1'; });
      rawMarkerEls.forEach((m) => { m.style.opacity = '1'; });
      rawLabelEls.forEach((l) => { l.style.opacity = '1'; });

      const tFadeCursor = setTimeout(() => {
        setCursorState((prev) => ({ ...prev, visible: false }));
        wrapper.classList.remove('building');
        setIsBuilding(false);
      }, 400);
      animTimeoutsRef.current.push(tFadeCursor);
    }, timeline + 50);
    animTimeoutsRef.current.push(tComplete);
  }, [isModalOpen, zoom]);

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
            primaryColor: '#151D32',
            primaryTextColor: '#FFFFFF',
            primaryBorderColor: '#38BDF8',
            lineColor: '#60A5FA',
            secondaryColor: '#1E1B4B',
            tertiaryColor: '#0F172A',
            edgeLabelBackground: '#151D32',
            fontFamily: 'var(--font-outfit), sans-serif',
            fontSize: '13px',
            nodeBorder: 'solid'
          },
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 45,
            rankSpacing: 60,
            padding: 16
          }
        });

        const sanitized = sanitizeMermaid(activeChartCode);
        const renderId = uniqueIdRef.current;

        // Render SVG dynamically
        const { svg } = await mermaid.render(renderId, sanitized);
        let cleanSvg = svg;
        // Fix any transparent arrowheads or invalid borders generated by Mermaid defaults
        cleanSvg = cleanSvg.replace(/fill:\s*rgba\(255,\s*255,\s*255,\s*0\)/g, 'fill: #60A5FA');
        cleanSvg = cleanSvg.replace(/stroke:\s*1\.25px/g, 'stroke: #38BDF8; stroke-width: 2px');
        cleanSvg = cleanSvg.replace(/<svg\s+([^>]*?)style="([^"]*?)"/i, (m, attrs, style) => {
          return `<svg ${attrs} style="display: block; width: 100%; max-width: 100%; height: auto; margin: 0 auto; overflow: visible;"`;
        });
        if (!cleanSvg.includes('style=')) {
          cleanSvg = cleanSvg.replace(/<svg\s+/i, '<svg style="display: block; width: 100%; max-width: 100%; height: auto; margin: 0 auto; overflow: visible;" ');
        }

        if (isMounted) {
          setSvgHtml(cleanSvg);
          setLoading(false);
          setTimeout(() => {
            if (modalViewportRef.current) autoFitModalChart();
            if (containerRef.current) autoFitInlineChart();
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
            cleanSvg = cleanSvg.replace(/fill:\s*rgba\(255,\s*255,\s*255,\s*0\)/g, 'fill: #60A5FA');
            cleanSvg = cleanSvg.replace(/stroke:\s*1\.25px/g, 'stroke: #38BDF8; stroke-width: 2px');
            cleanSvg = cleanSvg.replace(/<svg\s+([^>]*?)style="([^"]*?)"/i, (m, attrs, style) => {
              return `<svg ${attrs} style="display: block; width: 100%; max-width: 100%; height: auto; margin: 0 auto; overflow: visible;"`;
            });
            if (!cleanSvg.includes('style=')) {
              cleanSvg = cleanSvg.replace(/<svg\s+/i, '<svg style="display: block; width: 100%; max-width: 100%; height: auto; margin: 0 auto; overflow: visible;" ');
            }
            if (isMounted) {
              setSvgHtml(cleanSvg);
              setLoading(false);
              setTimeout(() => {
                if (modalViewportRef.current) autoFitModalChart();
                if (containerRef.current) autoFitInlineChart();
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
  }, [activeChartCode, points, autoFitModalChart, autoFitInlineChart]);

  // Trigger Stitch AI live draw once the active viewport & its SVG nodes are mounted
  useEffect(() => {
    if (!svgHtml || !isLiveDrawEnabled) return;
    if (isModalOpen && !mounted) return;

    let cancelled = false;
    let attempts = 0;

    const timer = setInterval(() => {
      attempts++;
      // When modal is open, STRICTLY wait for and target modalViewportRef.current!
      // NEVER fall back to containerRef.current when isModalOpen is true!
      const target = isModalOpen ? modalViewportRef.current : containerRef.current;

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

      if (attempts > 60) {
        clearInterval(timer);
        // Timer exhausted: SVG nodes never found (e.g. diagram rendered off-screen).
        // Force-reveal the static diagram by ending the building state.
        if (!cancelled) stopAndCleanAnimation();
      }
    }, 45);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [svgHtml, isLiveDrawEnabled, isModalOpen, mounted, runLiveDrawAnimation, stopAndCleanAnimation]);

  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.3));
  const handleZoomReset = () => setZoom(1);

  const handleModalZoomIn = () => setModalZoom(prev => Math.min(Number((prev + 0.15).toFixed(2)), 3.5));
  const handleModalZoomOut = () => setModalZoom(prev => Math.max(Number((prev - 0.15).toFixed(2)), 0.2));
  const handleModalZoomReset = () => setModalZoom(1);

  // Attach non-passive wheel event listeners to viewports to zoom ONLY the canvas stage and strictly block webpage browser zoom
  useEffect(() => {
    const modalVp = modalViewportRef.current;
    const inlineVp = containerRef.current;

    const handleModalWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setModalZoom(prev => Math.max(0.2, Math.min(3.5, Number((prev * factor).toFixed(2)))));
      }
    };

    const handleInlineWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setZoom(prev => Math.max(0.25, Math.min(2.5, Number((prev * factor).toFixed(2)))));
      }
    };

    if (modalVp) modalVp.addEventListener('wheel', handleModalWheel, { passive: false });
    if (inlineVp) inlineVp.addEventListener('wheel', handleInlineWheel, { passive: false });

    return () => {
      if (modalVp) modalVp.removeEventListener('wheel', handleModalWheel);
      if (inlineVp) inlineVp.removeEventListener('wheel', handleInlineWheel);
    };
  }, [isModalOpen]);

  const handleFitToScreen = () => {
    autoFitModalChart();
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
          <button
            type="button"
            className="mermaid-btn"
            style={btnBaseStyle}
            onClick={autoFitInlineChart}
            title="Fit to Container"
            aria-label="Fit diagram to container"
          >
            <Maximize2 size={12} />
            <span>Fit</span>
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
            alignItems: 'flex-start',
            padding: '24px 20px',
            background: 'radial-gradient(circle at 50% 50%, rgba(17, 24, 39, 0.85) 0%, rgba(8, 10, 18, 0.98) 100%)',
            userSelect: 'none',
            overscrollBehavior: 'contain'
          }}
        >
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
              className="mermaid-canvas-stage inline-stage"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                margin: '0 auto',
                width: '100%',
                maxWidth: '820px'
              }}
            >
              {/* White Digital Stylus Pen Cursor */}
              <StitchAICursor
                x={cursorState.x}
                y={cursorState.y}
                visible={isBuilding && cursorState.visible && !isModalOpen}
                status={cursorState.status}
                label={cursorState.label}
                isClicking={cursorState.isClicking}
                accentColor={cursorState.accentColor || '#38BDF8'}
              />

              <div
                className={`mermaid-svg-wrapper ${isBuilding ? 'building' : ''}`}
                style={{
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  textAlign: 'center'
                }}
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </div>
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
                  padding: '24px 20px 80px',
                  background: 'radial-gradient(circle at 50% 30%, rgba(18, 25, 42, 0.85) 0%, rgba(7, 9, 16, 0.98) 100%)',
                  position: 'relative',
                  cursor: isPanning ? 'grabbing' : 'grab',
                  scrollBehavior: 'smooth'
                }}
              >
                {svgHtml && (
                  <div
                    className="mermaid-canvas-stage modal-stage"
                    style={{
                      transform: `scale(${modalZoom})`,
                      transformOrigin: 'top center',
                      transition: isPanning ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      margin: '0 auto',
                      width: '100%',
                      maxWidth: '1150px',
                      paddingBottom: 80
                    }}
                  >
                    {/* White Digital Stylus Pen Cursor for Fullscreen Modal */}
                    <StitchAICursor
                      x={cursorState.x}
                      y={cursorState.y}
                      visible={isBuilding && cursorState.visible && isModalOpen}
                      status={cursorState.status}
                      label={cursorState.label}
                      isClicking={cursorState.isClicking}
                      accentColor={cursorState.accentColor || '#38BDF8'}
                    />

                    <div
                      className={`mermaid-svg-wrapper modal-chart ${isBuilding ? 'building' : ''}`}
                      style={{
                        margin: '0 auto',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        textAlign: 'center'
                      }}
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                  </div>
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
