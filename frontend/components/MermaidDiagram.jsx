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

  // Helper to clean label text: convert markdown bold/italic, escape quotes
  const cleanLabelText = (text) => {
    let clean = (text || '').trim();
    // Convert markdown bold to <b> and italic to <i> so rich typography renders cleanly in HTML labels
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    clean = clean.replace(/\*([^*]+)\*/g, '<i>$1</i>');
    clean = clean.replace(/`([^`]+)`/g, '$1');
    // If enclosed in outer quotes, unwrap first
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1).trim();
    }
    // Escape inner double quotes to single quotes to prevent breaking Mermaid syntax
    clean = clean.replace(/"/g, "'");
    return clean;
  };

  // 1. Stadium shape: A(["..."])
  code = code.replace(/\(\[\s*([^\]\n]+?)\s*\]\)/g, (_, text) => `(["${cleanLabelText(text)}"])`);

  // 2. Cylinder shape: A[("...")]
  code = code.replace(/\[\(\s*([^\)\n]+?)\s*\)\]/g, (_, text) => `[("${cleanLabelText(text)}")]`);

  // 3. Subroutine shape: A[["..."]]
  code = code.replace(/\[\[\s*([^\]\n]+?)\s*\]\]/g, (_, text) => `[["${cleanLabelText(text)}"]]`);

  // 4. Hexagon shape: A{{"..."}} (CRITICAL: Strictly NO space after {{ to comply with Mermaid 11.x lexer)
  code = code.replace(/\{\{\s*([^\}\n]+?)\s*\}\}/g, (_, text) => `{{"${cleanLabelText(text)}"}}`);

  // 5. Circle shape: A(("..."))
  code = code.replace(/\(\(\s*([^\)\n]+?)\s*\)\)/g, (_, text) => `(("${cleanLabelText(text)}"))`);

  // 6. Standard rectangle shape: A["..."] (excluding previously handled shapes)
  code = code.replace(/(?<![\(\[])\[\s*([^\(\[\{\]\)\n]+?)\s*\](?![\)\]])/g, (_, text) => `["${cleanLabelText(text)}"]`);

  // 7. Connector edge labels: -->|"label"| or -->|label|
  code = code.replace(/\|([^\|\n]+?)\|/g, (_, label) => `|"${cleanLabelText(label)}"|`);

  return code;
}


/**
 * Harmonious, vivid theme colors for flowchart blocks and connector arrows
 */
const NODE_PALETTES = [
  {
    name: 'violet',
    stroke: '#A855F7',
    fill: '#161324',
    arrow: '#A855F7',
    text: '#F8FAFC'
  },
  {
    name: 'sky',
    stroke: '#38BDF8',
    fill: '#0D1929',
    arrow: '#38BDF8',
    text: '#F8FAFC'
  },
  {
    name: 'amber',
    stroke: '#F59E0B',
    fill: '#23180C',
    arrow: '#F59E0B',
    text: '#F8FAFC'
  },
  {
    name: 'emerald',
    stroke: '#10B981',
    fill: '#0D2018',
    arrow: '#10B981',
    text: '#F8FAFC'
  },
  {
    name: 'indigo',
    stroke: '#818CF8',
    fill: '#13162B',
    arrow: '#818CF8',
    text: '#F8FAFC'
  },
  {
    name: 'rose',
    stroke: '#F43F5E',
    fill: '#241018',
    arrow: '#F43F5E',
    text: '#F8FAFC'
  },
  {
    name: 'cyan',
    stroke: '#06B6D4',
    fill: '#0C242E',
    arrow: '#06B6D4',
    text: '#F8FAFC'
  }
];

/**
 * Injects Blender Geometry & Supabase Schema distinct architectural palettes to SVG nodes
 */
function applyBlenderPalettes(root) {
  if (!root) return;
  const wrappers = root.querySelectorAll
    ? (root.classList?.contains('mermaid-svg-wrapper') ? [root] : Array.from(root.querySelectorAll('.mermaid-svg-wrapper')))
    : [];
  wrappers.forEach((wrapper) => {
    const allNodes = Array.from(wrapper.querySelectorAll('.node, g.node'));
    allNodes.forEach((n, idx) => {
      const palette = NODE_PALETTES[idx % NODE_PALETTES.length];
      n.classList.add(`node-palette-${idx % NODE_PALETTES.length}`);
      const shape = n.querySelector('rect, polygon, circle, ellipse, path:not(.arrowMarkerPath)') || n;
      if (shape && shape.style) {
        shape.style.stroke = palette.stroke;
        shape.style.fill = palette.fill;
        shape.style.strokeWidth = '2px';
        if (shape.tagName === 'rect') {
          shape.style.rx = '14px';
          shape.style.ry = '14px';
        }
      }
    });
  });
}

/**
 * Creative 2D architectural synthesizer when raw points are passed without a custom mermaid chart.
 * Groups points into 2-3 logical visual phases using subgraphs instead of flat 1-line chains.
 */
function synthesizeCreativeInfographic(points, fallbackTitle = "Visual Architecture & Concept Flow") {
  if (!points || points.length === 0) {
    return `flowchart TD
  subgraph Architecture ["🎯 Concept Architecture"]
    direction TB
    Root(["🌟 ${fallbackTitle}"])
    Start["⚡ Interactive Visual Map Ready"]
    Root ==>|"Initializes"| Start
  end`;
  }

  // Parse points: strip bullets, extract bold titles, subtitles, and clean strings
  const parsePoint = (raw) => {
    let clean = (raw || '')
      .replace(/^[-*\d.)\s]+/, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/["\(\)\[\]\{\}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Priority 1: colon separator (e.g. "Dual-Membrane: Outer membrane...")
    let match = clean.match(/^([^:]+?):\s*(.+)$/);
    if (!match) {
      match = clean.match(/^([^—–]+?)\s*[—–]\s*(.+)$/);
    }
    if (!match) {
      match = clean.match(/^([^\-]+?)\s+-\s+(.+)$/);
    }

    if (match && match[1].trim().length >= 2 && match[2].trim().length >= 2) {
      const title = match[1].trim().slice(0, 36);
      const sub = match[2].trim().slice(0, 65);
      return { title, sub };
    }
    return { title: clean.slice(0, 40), sub: '' };
  };

  const pts = points.map(p => parsePoint(p));
  const ICONS = ['⚡', '⚙️', '🔍', '💡', '🚀', '📊', '🛡️', '🧠', '🗄️', '💎'];

  if (pts.length >= 3) {
    const s1 = pts.slice(0, Math.ceil(pts.length / 3));
    const s2 = pts.slice(Math.ceil(pts.length / 3), Math.ceil((pts.length * 2) / 3));
    const s3 = pts.slice(Math.ceil((pts.length * 2) / 3));

    let chart = 'flowchart TD\n';

    // Stage 1: Horizontal inputs & catalysts side-by-side
    chart += '  subgraph Phase1 ["🌱 Stage 1: Foundation & Inputs"]\n';
    chart += '    direction LR\n';
    s1.forEach((pt, idx) => {
      const icon = ICONS[idx % ICONS.length];
      const label = pt.sub ? `<b>${icon} ${pt.title}</b><br/><i>${pt.sub}</i>` : `${icon} ${pt.title}`;
      chart += `    In_${idx + 1}(["${label}"])\n`;
    });
    if (s1.length > 1) {
      chart += `    ${s1.map((_, i) => `In_${i + 1}`).join(' ~~~ ')}\n`;
    }
    chart += '  end\n\n';

    // Stage 2: Horizontal transformation core & mechanisms
    chart += '  subgraph Phase2 ["⚙️ Stage 2: Core Mechanism & Transformation Engine"]\n';
    chart += '    direction LR\n';
    s2.forEach((pt, idx) => {
      const icon = ICONS[(idx + 2) % ICONS.length];
      const label = pt.sub ? `<b>${icon} ${pt.title}</b><br/><i>${pt.sub}</i>` : `${icon} ${pt.title}`;
      if (idx % 2 === 1) {
        chart += `    Proc_${idx + 1}{{"${label}"}}\n`;
      } else {
        chart += `    Proc_${idx + 1}[("${label}")]\n`;
      }
    });
    if (s2.length > 1) {
      chart += `    ${s2.map((_, i) => `Proc_${i + 1}`).join(' ~~~ ')}\n`;
    }
    chart += '  end\n\n';

    // Stage 3: Horizontal deliverables & impact side-by-side
    chart += '  subgraph Phase3 ["⚡ Stage 3: High-Impact Output & Yield"]\n';
    chart += '    direction LR\n';
    s3.forEach((pt, idx) => {
      const icon = ICONS[(idx + 4) % ICONS.length];
      const label = pt.sub ? `<b>${icon} ${pt.title}</b><br/><i>${pt.sub}</i>` : `${icon} ${pt.title}`;
      chart += `    Out_${idx + 1}(["${label}"])\n`;
    });
    if (s3.length > 1) {
      chart += `    ${s3.map((_, i) => `Out_${i + 1}`).join(' ~~~ ')}\n`;
    }
    chart += '  end\n\n';

    // Inter-phase conduit pipelines with descriptive labels
    chart += '  Phase1 ==>|"Processes into"| Phase2\n';
    chart += '  Phase2 ==>|"Yields deliverables"| Phase3\n';
    return chart;
  }

  // 1-2 points fallback
  const p1 = pts[0] || { title: 'Core Foundation', sub: '' };
  const p2 = pts[1] || { title: 'Practical Deliverable', sub: '' };
  const lbl1 = p1.sub ? `<b>⚡ ${p1.title}</b><br/><i>${p1.sub}</i>` : `⚡ ${p1.title}`;
  const lbl2 = p2.sub ? `<b>🎯 ${p2.title}</b><br/><i>${p2.sub}</i>` : `🎯 ${p2.title}`;

  return `flowchart TD
  subgraph Phase1 ["🌱 Stage 1: Foundation"]
    Node_1(["${lbl1}"])
  end
  subgraph Phase2 ["🚀 Stage 2: Practical Impact"]
    Node_2(["${lbl2}"])
  end
  Phase1 ==>|"Drives"| Phase2\n`;
}

// ── Smart Dynamic Zoom Bounds for Infographics ──
// Prevents over-zoomed pixelation and prevents microscopic shrinking below readable scale
const MIN_MODAL_ZOOM = 0.60;  // 60% minimum zoom clamp
const MAX_MODAL_ZOOM = 1.65;  // 165% maximum zoom
const MIN_INLINE_ZOOM = 0.60;
const MAX_INLINE_ZOOM = 1.50;
const ZOOM_STEP = 0.15;

export default function MermaidDiagram({ chart, points = [], chatHistory = [], onRegenerate, onClose }) {
  const containerRef = useRef(null);
  const modalViewportRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [svgHtml, setSvgHtml] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.95);
  const [modalZoom, setModalZoom] = useState(1.0);
  const modalZoomRef = useRef(1.0);
  modalZoomRef.current = modalZoom;

  const [isWheelZooming, setIsWheelZooming] = useState(false);
  const wheelZoomTimeoutRef = useRef(null);
  const touchDistRef = useRef(null);

  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isKeypointsOpen, setIsKeypointsOpen] = useState(false); // Collapsed by default (inline chat)
  const [isModalOpen, setIsModalOpen] = useState(true); // Open directly in fullscreen focused modal when requested!
  const takeawaysRef = useRef(null);
  const hasAnimatedRef = useRef(false); // Tracks whether live draw has completed once, to prevent wiping on reopen

  // Derived intelligent topic title for the poster header banner
  const derivedTopicTitle = React.useMemo(() => {
    if (chatHistory && chatHistory.length > 0) {
      const userMsg = [...chatHistory].reverse().find(m => m.sender === 'user' || m.role === 'user');
      if (userMsg && userMsg.text) {
        let t = userMsg.text.replace(/^(explain|teach me|what is|tell me about|how does|why is|draw|generate an infographic about|infographic on)\s+/i, '').trim();
        t = t.replace(/[?!.]+$/, '').trim();
        if (t.length > 0 && t.length <= 60) {
          return t.charAt(0).toUpperCase() + t.slice(1);
        }
      }
    }
    if (points && points.length > 0) {
      const first = points[0].replace(/^[-*\d.)\s]+/, '').replace(/\*\*/g, '');
      const parts = first.split(/[:—–\-]/);
      if (parts[0].trim().length >= 3) {
        return parts[0].trim();
      }
    }
    return "Knowledge Architecture & Concept Flow";
  }, [chatHistory, points]);

  const handleScrollToTakeaways = () => {
    if (takeawaysRef.current) {
      takeawaysRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Body scroll lock when fullscreen modal is active
  useEffect(() => {
    if (isModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isModalOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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
    isClicking: false,
    isTracing: false
  });

  const animTimeoutsRef = useRef([]);
  const animFrameRef = useRef(null);
  const animCancelledRef = useRef(false);

  const clearAnimTimeouts = () => {
    animTimeoutsRef.current.forEach((t) => clearTimeout(t));
    animTimeoutsRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const stopAndCleanAnimation = useCallback(() => {
    animCancelledRef.current = true;
    clearAnimTimeouts();
    setIsBuilding(false);
    setCursorState((prev) => ({ ...prev, visible: false, isClicking: false, isTracing: false }));
    const targets = [modalViewportRef.current, containerRef.current].filter(Boolean);
    targets.forEach((root) => {
      const wrapper = root.querySelector('.mermaid-svg-wrapper') || (root.classList?.contains('mermaid-svg-wrapper') ? root : null);
      if (wrapper) {
        wrapper.classList.remove('building');
        wrapper.style.opacity = '1';
        applyBlenderPalettes(wrapper);
        const allNodes = wrapper.querySelectorAll('.node, g.node');
        allNodes.forEach((n) => {
          n.style.opacity = '1';
          n.style.transform = 'none';
          n.style.filter = '';
          const shape = n.querySelector('rect, polygon, circle, ellipse, path:not(.arrowMarkerPath)') || n;
          if (shape && shape.style) shape.style.strokeDashoffset = '0';
          const texts = n.querySelectorAll('.label, foreignObject, text, tspan, .nodeLabel');
          texts.forEach((t) => { t.style.opacity = '1'; });
        });
        const allEdges = wrapper.querySelectorAll('.edgePaths path, .edgePath path, path.flowchart-link, g[class*="edge"] path');
        allEdges.forEach((e) => {
          e.style.opacity = '1';
          if (e.style) {
            e.style.strokeDashoffset = '0';
            e.style.stroke = '#64748B';
          }
        });
        const allMarkers = wrapper.querySelectorAll('marker, .arrowheadPath, .arrowMarkerPath, [id*="pointEnd"] path, [id*="arrow"] path, .edgeLabel, .edgeLabels');
        allMarkers.forEach((m) => {
          m.style.opacity = '1';
        });
      }
    });
  }, []);

  // Compute stable intrinsic fit zoom so diagram fills viewport comfortably with zero sudden jumps or box-by-box scroll trap
  const computeFitZoom = useCallback((viewportEl, isModal) => {
    if (!viewportEl) return isModal ? 0.9 : 0.85;
    const stageEl = viewportEl.querySelector('.mermaid-canvas-stage');
    const svgEl = viewportEl.querySelector('svg');
    if (!svgEl && !stageEl) return isModal ? 0.9 : 0.85;

    const vpH = viewportEl.clientHeight || (isModal ? 680 : 380);
    const vpW = viewportEl.clientWidth || (isModal ? 1200 : 650);

    const paddingX = isModal ? 48 : 32;
    const paddingY = isModal ? 40 : 32;

    const availW = Math.max(200, vpW - paddingX);
    const availH = Math.max(200, vpH - paddingY);

    if (isModal && stageEl) {
      // In widescreen modal mode, measure the stage composition dimensions
      const stageW = Math.max(800, stageEl.scrollWidth || stageEl.offsetWidth || 1200);
      const stageH = Math.max(420, stageEl.scrollHeight || stageEl.offsetHeight || 600);

      const scaleW = availW / stageW;
      const scaleH = availH / stageH;
      let ideal = Math.min(scaleW, scaleH);

      // If diagram is exceptionally tall, prioritize comfortable horizontal width so cards and typography remain readable
      if (stageH > stageW * 1.25) {
        ideal = Math.min(scaleW, 1.0);
      }

      return Number(Math.max(MIN_MODAL_ZOOM, Math.min(1.25, ideal)).toFixed(2));
    }

    let intrinsicW = 550;
    let intrinsicH = 380;

    if (svgEl?.viewBox?.baseVal?.width > 0 && svgEl?.viewBox?.baseVal?.height > 0) {
      intrinsicW = svgEl.viewBox.baseVal.width;
      intrinsicH = svgEl.viewBox.baseVal.height;
    } else {
      const bbox = typeof svgEl?.getBBox === 'function' ? svgEl.getBBox() : null;
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        intrinsicW = bbox.width;
        intrinsicH = bbox.height;
      }
    }

    const maxStageW = 780;
    const targetW = Math.min(availW, maxStageW);

    const aspect = intrinsicH / Math.max(40, intrinsicW);
    const renderedH = targetW * aspect;

    // Scale factor required to fit both width and height completely inside viewport
    const scaleW = availW / targetW;
    const scaleH = availH / Math.max(40, renderedH);
    let ideal = Math.min(scaleW, scaleH);

    return Number(Math.max(MIN_INLINE_ZOOM, Math.min(1.15, ideal)).toFixed(2));
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

  // Point-to-point live vector drawing animation engine
  const runLiveDrawAnimation = useCallback((containerEl) => {
    const isModal = isModalOpen && modalViewportRef.current;
    const container = containerEl || (isModal ? modalViewportRef.current : containerRef.current);
    if (!container) return;

    clearAnimTimeouts();
    animCancelledRef.current = false;

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

    // Helper to calculate exact stage coordinates from an SVG element & local point (uses cached stage rect to prevent forced layout reflow)
    let cachedStageRect = stageRect;
    const getStagePoint = (elem, localPt) => {
      const curStageRect = cachedStageRect || stageEl.getBoundingClientRect();
      const curZoom = (isModal ? (modalZoomRef.current || 0.85) : zoom) || 1;
      try {
        const ctm = elem.getScreenCTM ? elem.getScreenCTM() : null;
        const ownerSvg = elem.ownerSVGElement || svgEl;
        if (ctm && ownerSvg && ownerSvg.createSVGPoint && localPt) {
          const p = ownerSvg.createSVGPoint();
          p.x = localPt.x;
          p.y = localPt.y;
          const screenP = p.matrixTransform(ctm);
          return {
            x: (screenP.x - curStageRect.left) / curZoom,
            y: (screenP.y - curStageRect.top) / curZoom
          };
        }
      } catch {}
      const er = elem.getBoundingClientRect();
      return {
        x: (er.left - curStageRect.left) / curZoom + (er.width / curZoom) / 2,
        y: (er.top - curStageRect.top) / curZoom + (er.height / curZoom) / 2
      };
    };

    // Frame-by-frame animation runner returning a promise
    const animateFrame = (durationMs, onFrame) => {
      return new Promise((resolve) => {
        const start = performance.now();
        const step = (now) => {
          if (animCancelledRef.current) return resolve();
          const elapsed = now - start;
          const t = Math.min(1, elapsed / Math.max(1, durationMs));
          onFrame(t);
          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        animFrameRef.current = requestAnimationFrame(step);
      });
    };

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

      // Find shape element (rect, polygon, path, cylinder, circle, stadium)
      const shapeEl = el.querySelector('rect, polygon, circle, ellipse, path:not(.arrowMarkerPath)') || el;
      let shapeLen = 0;
      if (typeof shapeEl.getTotalLength === 'function') {
        try { shapeLen = shapeEl.getTotalLength(); } catch {}
      }
      if (!shapeLen || isNaN(shapeLen)) {
        shapeLen = 2 * (w + h);
      }

      const textEls = Array.from(el.querySelectorAll('.label, foreignObject, text, tspan, .nodeLabel'));

      return { id: el.id || `node_${idx}`, text, x, y, w, h, el, shapeEl, shapeLen, textEls };
    });

    // 1. Initial State: Prepare node shapes with stroke dashoffset and hide text & edges
    nodes.forEach((n, idx) => {
      const palette = NODE_PALETTES[idx % NODE_PALETTES.length];
      n.el.classList.add(`node-palette-${idx % NODE_PALETTES.length}`);
      n.el.style.opacity = '1';
      n.el.style.filter = '';
      if (n.shapeEl && n.shapeEl.style) {
        n.shapeEl.style.stroke = palette.stroke;
        n.shapeEl.style.fill = palette.fill;
        n.shapeEl.style.strokeWidth = '1.5px';
        n.shapeEl.style.strokeDasharray = `${n.shapeLen}`;
        n.shapeEl.style.strokeDashoffset = `${n.shapeLen}`;
        n.shapeEl.style.transition = 'none';
      }
      n.textEls.forEach((t) => {
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.22s ease';
      });
    });

    rawEdgeEls.forEach((e) => {
      let eLen = 0;
      if (typeof e.getTotalLength === 'function') {
        try { eLen = e.getTotalLength(); } catch {}
      }
      if (!eLen || isNaN(eLen)) eLen = 140;
      e.dataset.pathLength = String(eLen);
      e.style.strokeDasharray = `${eLen}`;
      e.style.strokeDashoffset = `${eLen}`;
      e.style.opacity = '0';
      e.style.transition = 'none';
    });

    rawMarkerEls.forEach((m) => {
      m.style.opacity = '0';
      m.style.transition = 'opacity 0.2s ease';
    });

    rawLabelEls.forEach((l) => {
      l.style.opacity = '0';
      l.style.transition = 'opacity 0.2s ease';
    });

    wrapper.classList.add('building');
    setIsBuilding(true);

    // Initial position: White hairline vector stylus hovers above first node
    const firstNode = nodes[0];
    const startX = firstNode.x + firstNode.w / 2;
    const startY = Math.max(15, firstNode.y - 30);

    setCursorState({
      x: startX,
      y: startY,
      visible: true,
      status: '🧠 Drafting Diagram...',
      label: 'Vedika AI',
      isClicking: false,
      isTracing: false
    });

    // 2. Execute point-to-point drawing sequence
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 160));
        if (animCancelledRef.current) return;

        for (let idx = 0; idx < nodes.length; idx++) {
          if (animCancelledRef.current) break;
          const node = nodes[idx];
          const colorIdx = idx % NODE_PALETTES.length;
          const palette = NODE_PALETTES[colorIdx];
          const shapeEl = node.shapeEl;
          const shapeLen = node.shapeLen;

          // Pen arrives at node and begins tracing perimeter
          setCursorState((prev) => ({
            ...prev,
            status: `Drawing Node (${idx + 1}/${nodes.length})`,
            label: node.text.slice(0, 24),
            accentColor: palette.stroke,
            isTracing: true,
            isClicking: true
          }));

          // Trace shape perimeter smoothly frame-by-frame (deliberate 500ms pace)
          cachedStageRect = stageEl.getBoundingClientRect();
          await animateFrame(500, (t) => {
            if (shapeEl && shapeEl.style) {
              shapeEl.style.strokeDashoffset = `${shapeLen * (1 - t)}`;
            }
            if (shapeEl && typeof shapeEl.getPointAtLength === 'function') {
              try {
                const pt = shapeEl.getPointAtLength(shapeLen * t);
                const stagePt = getStagePoint(shapeEl, pt);
                setCursorState((prev) => {
                  if (Math.abs(prev.x - stagePt.x) < 1 && Math.abs(prev.y - stagePt.y) < 1) return prev;
                  return { ...prev, x: stagePt.x, y: stagePt.y };
                });
              } catch {}
            }
          });

          if (animCancelledRef.current) break;

          // Settle node shape and reveal content cleanly (NO border glow!)
          if (shapeEl && shapeEl.style) shapeEl.style.strokeDashoffset = '0';
          node.textEls.forEach((t) => { t.style.opacity = '1'; });
          node.el.style.filter = '';

          setCursorState((prev) => ({
            ...prev,
            isClicking: false,
            isTracing: false,
            status: `Node ${idx + 1} Ready ✨`
          }));

          await new Promise((r) => setTimeout(r, 80));

          // Trace connecting arrow to the next node if present
          if (idx < nodes.length - 1 && rawEdgeEls[idx]) {
            const edgeEl = rawEdgeEls[idx];
            const edgeLen = parseFloat(edgeEl.dataset.pathLength || '140');

            edgeEl.style.opacity = '1';
            edgeEl.style.stroke = palette.stroke;
            edgeEl.style.strokeWidth = '1.75px';
            edgeEl.style.strokeDasharray = `${edgeLen}`;
            edgeEl.style.strokeDashoffset = `${edgeLen}`;

            setCursorState((prev) => ({
              ...prev,
              status: 'Linking Flow ➔',
              label: '➔',
              accentColor: palette.stroke,
              isTracing: true
            }));

            // Physically trace connector line from start to destination (420ms glide)
            cachedStageRect = stageEl.getBoundingClientRect();
            await animateFrame(420, (t) => {
              edgeEl.style.strokeDashoffset = `${edgeLen * (1 - t)}`;
              if (typeof edgeEl.getPointAtLength === 'function') {
                try {
                  const pt = edgeEl.getPointAtLength(edgeLen * t);
                  const stagePt = getStagePoint(edgeEl, pt);
                  setCursorState((prev) => {
                    if (Math.abs(prev.x - stagePt.x) < 1 && Math.abs(prev.y - stagePt.y) < 1) return prev;
                    return { ...prev, x: stagePt.x, y: stagePt.y };
                  });
                } catch {}
              }
            });

            if (animCancelledRef.current) break;

            // Arrow has reached destination: reveal marker and label
            edgeEl.style.strokeDashoffset = '0';
            rawMarkerEls.forEach((m) => {
              m.style.opacity = '1';
              m.style.fill = palette.stroke;
            });
            rawLabelEls.forEach((l) => { l.style.opacity = '1'; });
          }

          await new Promise((r) => setTimeout(r, 60));
        }

        if (!animCancelledRef.current) {
          hasAnimatedRef.current = true;
          setCursorState((prev) => ({
            ...prev,
            status: 'Infographic Complete ✨',
            label: 'Ready',
            isClicking: false,
            isTracing: false
          }));
        }
      } finally {
        hasAnimatedRef.current = true;
        // ALWAYS ensure every element is 100% visible and offsets zeroed out
        if (wrapper) {
          wrapper.classList.remove('building');
          const allNodes = wrapper.querySelectorAll('.node, g.node');
          allNodes.forEach((n, i) => {
            n.style.opacity = '1';
            n.style.filter = '';
            const pal = NODE_PALETTES[i % NODE_PALETTES.length];
            n.classList.add(`node-palette-${i % NODE_PALETTES.length}`);
            const shape = n.querySelector('rect, polygon, circle, ellipse, path:not(.arrowMarkerPath)') || n;
            if (shape && shape.style) {
              shape.style.strokeDashoffset = '0';
              shape.style.stroke = pal.stroke;
              shape.style.fill = pal.fill;
              shape.style.strokeWidth = '1.5px';
            }
            const texts = n.querySelectorAll('.label, foreignObject, text, tspan, .nodeLabel');
            texts.forEach((t) => { t.style.opacity = '1'; });
          });
          const allEdges = wrapper.querySelectorAll('.edgePaths path, .edgePath path, path.flowchart-link, g[class*="edge"] path');
          allEdges.forEach((e) => {
            e.style.opacity = '1';
            if (e.style) {
              e.style.strokeDashoffset = '0';
              e.style.stroke = '#64748B';
            }
          });
          const allMarkers = wrapper.querySelectorAll('marker, .arrowheadPath, .arrowMarkerPath, [id*="pointEnd"] path, [id*="arrow"] path, .edgeLabel, .edgeLabels');
          allMarkers.forEach((m) => {
            m.style.opacity = '1';
          });
        }

        setTimeout(() => {
          setCursorState((prev) => ({ ...prev, visible: false }));
          setIsBuilding(false);
        }, 300);
      }
    })();
  }, [isModalOpen, zoom]);

  const handleSkipBuild = (targetEl) => {
    hasAnimatedRef.current = true;
    stopAndCleanAnimation(targetEl || (isModalOpen ? modalViewportRef.current : containerRef.current));
  };

  const handleReplayBuild = () => {
    hasAnimatedRef.current = false;
    stopAndCleanAnimation();
    setTimeout(() => {
      const activeTarget = (isModalOpen && modalViewportRef.current) ? modalViewportRef.current : containerRef.current;
      runLiveDrawAnimation(activeTarget);
    }, 60);
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
      const timer = setTimeout(() => {
        if (modalViewportRef.current) {
          modalViewportRef.current.scrollTop = 0;
          modalViewportRef.current.scrollLeft = 0;
          autoFitModalChart();
          // Ensure Blender palettes and 100% visibility on modal open so diagram is never gone
          applyBlenderPalettes(modalViewportRef.current);
          const wrapper = modalViewportRef.current.querySelector('.mermaid-svg-wrapper');
          if (wrapper) {
            wrapper.style.opacity = '1';
            const allNodes = wrapper.querySelectorAll('.node, g.node');
            allNodes.forEach((n) => {
              n.style.opacity = '1';
              const shape = n.querySelector('rect, polygon, circle, ellipse, path:not(.arrowMarkerPath)') || n;
              if (shape && shape.style) shape.style.strokeDashoffset = '0';
              const texts = n.querySelectorAll('.label, foreignObject, text, tspan, .nodeLabel');
              texts.forEach((t) => { t.style.opacity = '1'; });
            });
            const allEdges = wrapper.querySelectorAll('.edgePaths path, .edgePath path, path.flowchart-link, g[class*="edge"] path');
            allEdges.forEach((e) => {
              e.style.opacity = '1';
              if (e.style) e.style.strokeDashoffset = '0';
            });
          }
        }
      }, 70);
      return () => clearTimeout(timer);
    } else {
      // Modal closed: safely clean up any ongoing animation
      stopAndCleanAnimation();
    }
  }, [isModalOpen, autoFitModalChart, stopAndCleanAnimation]);

  // Generate unique render ID per component mount to prevent SVG collisions
  const uniqueIdRef = useRef(`mermaid_${Math.random().toString(36).substr(2, 9)}`);

  const activeChartCode = (chart && chart.trim().length > 15 && (chart.includes('subgraph') || !points || points.length === 0))
    ? chart
    : (points && points.length > 0
        ? synthesizeCreativeInfographic(points, "Visual Architecture & Concept Flow")
        : (chart && chart.trim().length > 5 ? chart : `flowchart TD\n  Root(["🎯 Concept Summary"])\n  Start["⚡ Ready to visualize"]\n  Root ==> Start`)
      );

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
            primaryColor: '#0F1420',
            primaryTextColor: '#F8FAFC',
            primaryBorderColor: '#38BDF8',
            lineColor: '#64748B',
            secondaryColor: '#161324',
            tertiaryColor: '#0D1929',
            edgeLabelBackground: '#0F1420',
            clusterBkg: 'rgba(12, 17, 32, 0.72)',
            clusterBorder: 'rgba(56, 189, 248, 0.28)',
            fontFamily: 'var(--font-outfit), sans-serif',
            fontSize: '13px',
            nodeBorder: 'solid'
          },
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            useMaxWidth: false,
            nodeSpacing: 50,
            rankSpacing: 65,
            padding: 18
          }
        });

        const sanitized = sanitizeMermaid(activeChartCode);
        const renderId = 'mmd_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

        // Ensure web fonts are completely loaded so Mermaid measures SVG text dimensions accurately
        if (typeof document !== 'undefined' && document.fonts) {
          await document.fonts.ready;
        }

        // Render SVG dynamically
        const { svg } = await mermaid.render(renderId, sanitized);
        let cleanSvg = svg;
        // Clean transparent arrowheads or default strokes
        cleanSvg = cleanSvg.replace(/fill:\s*rgba\(255,\s*255,\s*255,\s*0\)/g, 'fill: #64748B');
        cleanSvg = cleanSvg.replace(/stroke:\s*1\.25px/g, 'stroke: #38BDF8; stroke-width: 1.5px');
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
            if (modalViewportRef.current) {
              autoFitModalChart();
              applyBlenderPalettes(modalViewportRef.current);
            }
            if (containerRef.current) {
              autoFitInlineChart();
              applyBlenderPalettes(containerRef.current);
            }
          }, 60);
        }
      } catch (err) {
        console.warn('Mermaid rendering failed, attempting simplified fallback:', err);
        // Fallback: try ultra-simple synthesized tree from points
        if (points && points.length > 0) {
          try {
            const mermaid = (await import('mermaid')).default;
            if (typeof document !== 'undefined' && document.fonts) {
              await document.fonts.ready;
            }
            const simpleChart = synthesizeCreativeInfographic(points, "Visual Concept Flow");
            const fallbackId = 'mmd_fb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
            const { svg } = await mermaid.render(fallbackId, simpleChart);
            let cleanSvg = svg;
            cleanSvg = cleanSvg.replace(/fill:\s*rgba\(255,\s*255,\s*255,\s*0\)/g, 'fill: #64748B');
            cleanSvg = cleanSvg.replace(/stroke:\s*1\.25px/g, 'stroke: #38BDF8; stroke-width: 1.5px');
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
                if (modalViewportRef.current) {
                  autoFitModalChart();
                  applyBlenderPalettes(modalViewportRef.current);
                }
                if (containerRef.current) {
                  autoFitInlineChart();
                  applyBlenderPalettes(containerRef.current);
                }
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
    if (!svgHtml) return;
    if (isModalOpen && !mounted) return;

    // If live draw is disabled or the diagram was already animated, immediately ensure 100% full visibility!
    if (!isLiveDrawEnabled || hasAnimatedRef.current) {
      stopAndCleanAnimation();
      return;
    }

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

  const handleZoomIn = () => setZoom(prev => Math.min(Number((prev + ZOOM_STEP).toFixed(2)), MAX_INLINE_ZOOM));
  const handleZoomOut = () => setZoom(prev => Math.max(Number((prev - ZOOM_STEP).toFixed(2)), MIN_INLINE_ZOOM));
  const handleZoomReset = () => setZoom(0.95);

  const handleModalZoomIn = () => setModalZoom(prev => Math.min(Number((prev + 0.10).toFixed(2)), MAX_MODAL_ZOOM));
  const handleModalZoomOut = () => setModalZoom(prev => Math.max(Number((prev - 0.10).toFixed(2)), MIN_MODAL_ZOOM));
  const handleModalZoomReset = () => {
    if (modalViewportRef.current) autoFitModalChart();
    else setModalZoom(1.0);
  };

  // Auto-fit immediately when modal opens on laptop/desktop screens and keep responsive on resize
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        autoFitModalChart();
      }, 50);
      const handleResize = () => {
        autoFitModalChart();
      };
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isModalOpen, autoFitModalChart]);

  // Handle wheel events: Smooth zooming without hijacking natural scroll
  useEffect(() => {
    if (!mounted) return;

    if (isModalOpen) {
      // Fullscreen Modal: Trackpad pinch or Ctrl+wheel performs buttery-smooth zoom
      const handleWindowWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();

          setIsWheelZooming(true);
          clearTimeout(wheelZoomTimeoutRef.current);
          wheelZoomTimeoutRef.current = setTimeout(() => setIsWheelZooming(false), 140);

          const delta = -e.deltaY * 0.0025;
          setModalZoom((prev) => Math.max(MIN_MODAL_ZOOM, Math.min(MAX_MODAL_ZOOM, Number((prev + delta).toFixed(2)))));
        }
        // When not pinching, native scrolling/trackpad momentum operates freely
      };

      window.addEventListener('wheel', handleWindowWheel, { passive: false });
      return () => {
        window.removeEventListener('wheel', handleWindowWheel);
      };
    } else {
      // Inline View: Intercept Ctrl/Cmd + wheel only when hovering over container to zoom inline canvas
      const container = containerRef.current;
      if (!container) return;

      const handleInlineWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();

          setIsWheelZooming(true);
          clearTimeout(wheelZoomTimeoutRef.current);
          wheelZoomTimeoutRef.current = setTimeout(() => setIsWheelZooming(false), 140);

          const factor = e.deltaY < 0 ? 1.08 : 0.92;
          setZoom((prev) => Math.max(MIN_INLINE_ZOOM, Math.min(MAX_INLINE_ZOOM, Number((prev * factor).toFixed(2)))));
        }
      };

      container.addEventListener('wheel', handleInlineWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleInlineWheel);
      };
    }
  }, [mounted, isModalOpen]);

  // Touch handlers for 2-finger pinch-to-zoom on touchscreen laptops, tablets, and mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchDistRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistRef.current) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchDistRef.current;
      if (ratio > 0.05 && ratio < 20) {
        setIsWheelZooming(true);
        clearTimeout(wheelZoomTimeoutRef.current);
        wheelZoomTimeoutRef.current = setTimeout(() => setIsWheelZooming(false), 140);

        if (isModalOpen) {
          setModalZoom((prev) => Math.max(MIN_MODAL_ZOOM, Math.min(MAX_MODAL_ZOOM, Number((prev * ratio).toFixed(2)))));
        } else {
          setZoom((prev) => Math.max(MIN_INLINE_ZOOM, Math.min(MAX_INLINE_ZOOM, Number((prev * ratio).toFixed(2)))));
        }
      }
      touchDistRef.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
  };

  const handleFitToScreen = () => {
    autoFitModalChart();
  };

  const handleMouseDown = (e) => {
    e.stopPropagation(); // Stop mousedown bubbling to document outside-click handler!
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    if (!modalViewportRef.current) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: modalViewportRef.current.scrollLeft,
      scrollTop: modalViewportRef.current.scrollTop
    };
  };

  // Window-level dragging listener for buttery-smooth panning without boundary clipping
  useEffect(() => {
    if (!isPanning) return;

    const handleWindowMouseMove = (e) => {
      if (!modalViewportRef.current) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      modalViewportRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      modalViewportRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    };

    const handleWindowMouseUp = (e) => {
      if (e) e.stopPropagation();
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning]);

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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
            overscrollBehavior: 'contain',
            touchAction: 'none',
            scrollBehavior: 'auto'
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
                transition: isWheelZooming ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                margin: '0 auto',
                width: '100%',
                maxWidth: '820px',
                touchAction: 'none'
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
                isTracing={cursorState.isTracing}
              />

              {/* Poster Header Banner for Inline View */}
              <div className="infographic-poster-header" style={{ marginBottom: 12, padding: '12px 16px' }}>
                <div className="infographic-poster-badge">
                  <Sparkles size={10} color="#38BDF8" />
                  <span>Visual Knowledge Blueprint</span>
                </div>
                <h3 className="infographic-poster-title" style={{ fontSize: 16 }}>{derivedTopicTitle}</h3>
              </div>

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
              width: 'min(98vw, 1560px)',
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
                      handleReplayBuild();
                    }}
                    title="Replay Google Stitch-inspired AI live drawing in full screen"
                  >
                    <Sparkles size={12} color="#D8B4FE" />
                    <span>Replay ✨</span>
                  </button>
                )}

                {/* Scroll to Key Takeaways on Poster */}
                {points && points.length > 0 && (
                  <button
                    type="button"
                    className="mermaid-btn mermaid-modal-keypoints-btn"
                    style={{
                      ...btnBaseStyle,
                      color: '#F5A95B',
                      borderColor: 'rgba(245, 169, 91, 0.4)',
                      background: 'rgba(245, 169, 91, 0.14)',
                      padding: '6px 12px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScrollToTakeaways();
                    }}
                    title="Scroll to Key Takeaways on Poster Canvas"
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
                    style={{ ...btnBaseStyle, opacity: modalZoom >= MAX_MODAL_ZOOM ? 0.45 : 1, cursor: modalZoom >= MAX_MODAL_ZOOM ? 'not-allowed' : 'pointer' }}
                    disabled={modalZoom >= MAX_MODAL_ZOOM}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalZoomIn();
                    }}
                    title={`Zoom In (Max: ${Math.round(MAX_MODAL_ZOOM * 100)}%)`}
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    className="mermaid-btn"
                    style={{ ...btnBaseStyle, opacity: modalZoom <= MIN_MODAL_ZOOM ? 0.45 : 1, cursor: modalZoom <= MIN_MODAL_ZOOM ? 'not-allowed' : 'pointer' }}
                    disabled={modalZoom <= MIN_MODAL_ZOOM}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModalZoomOut();
                    }}
                    title={`Zoom Out (Min: ${Math.round(MIN_MODAL_ZOOM * 100)}%)`}
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
                    title="Reset Zoom to 100%"
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
                    title="Fit Entire Infographic to Screen"
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

            {/* Modal Main Body: Unified Full-Width Infographic Poster Canvas */}
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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
                  scrollBehavior: 'auto',
                  overscrollBehavior: 'contain',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start'
                }}
              >
                {loading && (
                  <div className="mermaid-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#94A3B8', fontSize: 13, padding: '120px 0', minHeight: 340 }}>
                    <Sparkles size={28} className="animate-spin" color="#38BDF8" />
                    <span style={{ fontWeight: 600, letterSpacing: '0.02em', color: '#E2E8F0' }}>Rendering Knowledge Blueprint...</span>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>Synthesizing multi-tier architectural layout</span>
                  </div>
                )}

                {!loading && renderError && (
                  <div className="mermaid-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#F87171', fontSize: 13, padding: '80px 24px', textAlign: 'center', maxWidth: 600, margin: '40px auto', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 12 }}>
                    <AlertCircle size={26} color="#F87171" />
                    <span style={{ fontWeight: 600 }}>Could not render diagram visually: {renderError}</span>
                    <button
                      type="button"
                      className="mermaid-btn"
                      style={{ ...btnBaseStyle, marginTop: 8 }}
                      onClick={() => setShowCode(true)}
                    >
                      Inspect Diagram Code
                    </button>
                  </div>
                )}

                {!loading && !renderError && svgHtml && (
                  <div
                    className="mermaid-canvas-stage modal-stage"
                    style={{
                      transform: `scale(${modalZoom})`,
                      transformOrigin: 'top center',
                      transition: (isPanning || isWheelZooming) ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      margin: '0 auto',
                      width: '100%',
                      maxWidth: '1440px',
                      paddingBottom: 40,
                      minHeight: 'fit-content'
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
                      isTracing={cursorState.isTracing}
                    />

                    {/* Poster Header Banner */}
                    <div className="infographic-poster-header">
                      <div className="infographic-poster-badge">
                        <Sparkles size={11} color="#38BDF8" />
                        <span>Interactive Knowledge Blueprint</span>
                      </div>
                      <h2 className="infographic-poster-title">{derivedTopicTitle}</h2>
                      <p className="infographic-poster-subtitle">
                        Comprehensive multi-tier architectural flow & system mechanism
                      </p>
                    </div>

                    {/* 16:9 Laptop Responsive Blueprint Content */}
                    <div className="infographic-poster-content">
                      <div className="infographic-diagram-pane">
                        <div
                          className={`mermaid-svg-wrapper modal-chart ${isBuilding ? 'building' : ''}`}
                          style={{
                            margin: '0 auto',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center'
                          }}
                          dangerouslySetInnerHTML={{ __html: svgHtml }}
                        />
                      </div>

                      {/* Integrated Key Takeaways Companion Section (Right on desktop, Below on mobile) */}
                      {points && points.length > 0 && (
                        <div className="infographic-poster-takeaways" ref={takeawaysRef}>
                          <div className="infographic-takeaways-head">
                            <div className="infographic-takeaways-headline">
                              <Sparkles size={14} color="#F5A95B" />
                              <span>Key Takeaways & System Insights</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                              {points.length} Essential Concepts
                            </span>
                          </div>
                          <div className="infographic-takeaways-grid">
                            {points.map((pt, idx) => (
                              <div key={idx} className="infographic-takeaway-item">
                                <span className="infographic-takeaway-badge">{idx + 1}</span>
                                <div className="infographic-takeaway-body">
                                  {renderFormattedText(pt.replace(/^[-*•]\s+/, ''))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Status Bar with Presets & Bounds */}
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
                zIndex: 20,
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Move size={13} color="#60A5FA" />
                <span>Click &amp; drag or scroll to pan canvas &bull; Ctrl + Scroll to zoom freely &bull; Esc to go back</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#64748B', marginRight: 2 }}>Presets:</span>
                  <button
                    type="button"
                    className="mermaid-zoom-preset-btn"
                    onClick={() => autoFitModalChart()}
                    title="Fit Entire Diagram"
                  >
                    Fit
                  </button>
                  {[0.75, 1.0, 1.25, 1.50].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`mermaid-zoom-preset-btn ${Math.abs(modalZoom - lvl) < 0.04 ? 'active' : ''}`}
                      onClick={() => {
                        setModalZoom(lvl);
                        modalZoomRef.current = lvl;
                      }}
                      title={`Set Zoom to ${Math.round(lvl * 100)}%`}
                    >
                      {Math.round(lvl * 100)}%
                    </button>
                  ))}
                </div>
                <div style={{ width: 1, height: 14, background: 'rgba(255, 255, 255, 0.12)', margin: '0 4px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#64748B' }}>Canvas Zoom:</span>
                  <span style={{ color: '#38BDF8', fontWeight: 700 }}>{Math.round(modalZoom * 100)}%</span>
                  <span style={{ color: '#475569', fontSize: 10.5 }}>(Limit: 45% - 165%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
