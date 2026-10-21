'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, GitFork, ArrowDownUp, ArrowLeftRight, Code, Sparkles, AlertCircle, Maximize2 } from 'lucide-react';
import './CodeFlowchartVisualizer.css';

/**
 * Builds a clean Mermaid.js Control Flow Graph (CFG) from Python code.
 * Attaches line numbers so nodes can be dynamically lit up step-by-step.
 */
function generatePythonCFG(code, activeLine, orientation = 'TD') {
  if (!code || !code.trim()) {
    return `flowchart ${orientation}\n  Empty["No code provided"]`;
  }

  const rawLines = code.split('\n');
  const parsedLines = [];

  for (let idx = 0; idx < rawLines.length; idx++) {
    const raw = rawLines[idx];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = raw.search(/\S/);
    const lineNum = idx + 1;
    parsedLines.push({ lineNum, text: trimmed, indent, raw });
  }

  if (parsedLines.length === 0) {
    return `flowchart ${orientation}\n  Empty["Only comments or empty lines"]`;
  }

  let chart = `flowchart ${orientation}\n`;
  chart += '  Start(["● Start"]):::startNode\n';

  const classDefs = [
    'classDef default fill:#0F172A,stroke:#38BDF8,stroke-width:1.5px,color:#F8FAFC,font-family:monospace,font-size:11px;',
    'classDef loopNode fill:#1E1B4B,stroke:#A855F7,stroke-width:1.5px,color:#F3E8FF,font-family:monospace,font-size:11px;',
    'classDef decisionNode fill:#1E293B,stroke:#F59E0B,stroke-width:1.5px,color:#FEF3C7,font-family:monospace,font-size:11px;',
    'classDef ioNode fill:#082F49,stroke:#0EA5E9,stroke-width:1.5px,color:#E0F2FE,font-family:monospace,font-size:11px;',
    'classDef returnNode fill:#064E3B,stroke:#10B981,stroke-width:1.5px,color:#D1FAE5,font-family:monospace,font-size:11px;',
    'classDef startNode fill:#18181B,stroke:#71717A,stroke-width:1.5px,color:#A1A1AA,font-size:10px;',
    'classDef endNode fill:#18181B,stroke:#71717A,stroke-width:1.5px,color:#A1A1AA,font-size:10px;',
    'classDef activeNode fill:#1E40AF,stroke:#60A5FA,stroke-width:2.5px,color:#FFFFFF,font-weight:bold,font-family:monospace,font-size:11px;',
    'classDef activeDecision fill:#92400E,stroke:#FDE68A,stroke-width:2.5px,color:#FFFFFF,font-weight:bold,font-family:monospace,font-size:11px;'
  ];

  const nodeTypes = {};

  // Build node declarations
  parsedLines.forEach((item) => {
    const id = `L_${item.lineNum}`;
    let label = item.text
      .replace(/"/g, "'")
      .replace(/[\{\}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (label.length > 32) label = label.substring(0, 30) + '...';
    label = `L${item.lineNum}: ${label}`;

    if (item.text.startsWith('for ') || item.text.startsWith('while ')) {
      chart += `  ${id}{{"${label}"}}\n`;
      nodeTypes[id] = 'loop';
    } else if (item.text.startsWith('if ') || item.text.startsWith('elif ')) {
      chart += `  ${id}{"${label}"}\n`;
      nodeTypes[id] = 'decision';
    } else if (item.text.startsWith('else:')) {
      chart += `  ${id}["${label}"]\n`;
      nodeTypes[id] = 'decision';
    } else if (item.text.startsWith('return ') || item.text === 'return') {
      chart += `  ${id}(["${label}"])\n`;
      nodeTypes[id] = 'return';
    } else if (item.text.startsWith('print(')) {
      chart += `  ${id}[/"${label}"/]\n`;
      nodeTypes[id] = 'io';
    } else if (item.text.startsWith('def ')) {
      chart += `  ${id}(["${label}"])\n`;
      nodeTypes[id] = 'default';
    } else {
      chart += `  ${id}["${label}"]\n`;
      nodeTypes[id] = 'default';
    }
  });

  // Connect edges
  chart += `  Start --> L_${parsedLines[0].lineNum}\n`;

  for (let i = 0; i < parsedLines.length - 1; i++) {
    const curr = parsedLines[i];
    const next = parsedLines[i + 1];
    const currId = `L_${curr.lineNum}`;
    const nextId = `L_${next.lineNum}`;

    if (curr.text.startsWith('return ') || curr.text === 'return') {
      chart += `  ${currId} --> EndNode(["● End"]):::endNode\n`;
    } else if (curr.text.startsWith('if ') || curr.text.startsWith('elif ')) {
      chart += `  ${currId} -- True --> ${nextId}\n`;
      
      let falseTarget = null;
      for (let j = i + 1; j < parsedLines.length; j++) {
        if (parsedLines[j].indent <= curr.indent) {
          falseTarget = parsedLines[j];
          break;
        }
      }
      if (falseTarget && falseTarget.lineNum !== next.lineNum) {
        chart += `  ${currId} -- False --> L_${falseTarget.lineNum}\n`;
      }
    } else if (curr.text.startsWith('for ') || curr.text.startsWith('while ')) {
      chart += `  ${currId} -- Next --> ${nextId}\n`;

      let lastInLoop = null;
      let exitLoopTarget = null;
      for (let j = i + 1; j < parsedLines.length; j++) {
        if (parsedLines[j].indent > curr.indent) {
          lastInLoop = parsedLines[j];
        } else {
          exitLoopTarget = parsedLines[j];
          break;
        }
      }
      if (lastInLoop && !lastInLoop.text.startsWith('return')) {
        chart += `  L_${lastInLoop.lineNum} -. Loop .-> ${currId}\n`;
      }
      if (exitLoopTarget) {
        chart += `  ${currId} -- Done --> L_${exitLoopTarget.lineNum}\n`;
      } else {
        chart += `  ${currId} -- Done --> EndNode(["● End"]):::endNode\n`;
      }
    } else {
      chart += `  ${currId} --> ${nextId}\n`;
    }
  }

  const lastLine = parsedLines[parsedLines.length - 1];
  if (!lastLine.text.startsWith('return') && !chart.includes(`L_${lastLine.lineNum} --> EndNode`)) {
    chart += `  L_${lastLine.lineNum} --> EndNode(["● End"]):::endNode\n`;
  }

  // Add styles
  chart += '\n' + classDefs.join('\n') + '\n';

  // Apply node classes
  parsedLines.forEach((item) => {
    const id = `L_${item.lineNum}`;
    const type = nodeTypes[id];
    if (activeLine === item.lineNum) {
      if (type === 'decision' || type === 'loop') {
        chart += `  class ${id} activeDecision;\n`;
      } else {
        chart += `  class ${id} activeNode;\n`;
      }
    } else {
      if (type === 'loop') chart += `  class ${id} loopNode;\n`;
      else if (type === 'decision') chart += `  class ${id} decisionNode;\n`;
      else if (type === 'io') chart += `  class ${id} ioNode;\n`;
      else if (type === 'return') chart += `  class ${id} returnNode;\n`;
    }
  });

  return chart;
}

export default function CodeFlowchartVisualizer({ code, currentStep = 0, traceData = null }) {
  const containerRef = useRef(null);
  const [svgHtml, setSvgHtml] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [orientation, setOrientation] = useState('TD'); // 'TD' | 'LR'
  const [showCode, setShowCode] = useState(false);

  // Generate unique render ID
  const uniqueIdRef = useRef(`flowchart_${Math.random().toString(36).substr(2, 9)}`);

  const activeStepData = traceData && traceData[currentStep] ? traceData[currentStep] : null;
  const activeLine = activeStepData?.line || 1;
  const prevStepData = currentStep > 0 && traceData ? traceData[currentStep - 1] : null;

  // Active line statement string
  const activeLineText = useMemo(() => {
    if (!code) return '';
    const lines = code.split('\n');
    return lines[activeLine - 1]?.trim() || '';
  }, [code, activeLine]);

  // Generate the Mermaid CFG string
  const chartCode = useMemo(() => {
    return generatePythonCFG(code, activeLine, orientation);
  }, [code, activeLine, orientation]);

  // Variables at current step
  const variables = activeStepData?.variables || {};
  const prevVariables = prevStepData?.variables || {};
  const varKeys = Object.keys(variables).filter(k => !k.startsWith('__') && k !== 'step_counter');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setRenderError(null);

    async function renderCFG() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            darkMode: true,
            background: 'transparent',
            primaryColor: '#0F172A',
            primaryTextColor: '#F8FAFC',
            primaryBorderColor: '#38BDF8',
            lineColor: '#60A5FA',
            secondaryColor: '#1E1B4B',
            tertiaryColor: '#0F172A',
            edgeLabelBackground: '#0B0F19',
            fontFamily: 'var(--font-code), monospace',
            fontSize: '11px'
          },
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 20,
            rankSpacing: 25,
            padding: 6
          }
        });

        const renderId = `${uniqueIdRef.current}_step_${currentStep}_${orientation}`;
        const { svg } = await mermaid.render(renderId, chartCode);
        if (isMounted) {
          setSvgHtml(svg);
          setLoading(false);
        }
      } catch (err) {
        console.warn('CFG Mermaid render failed:', err);
        if (isMounted) {
          setRenderError(err?.message || 'Flowchart parsing error');
          setLoading(false);
        }
      }
    }

    renderCFG();

    return () => {
      isMounted = false;
    };
  }, [chartCode, currentStep, orientation]);

  const handleZoomIn = () => {
    setAutoFit(false);
    setZoom(z => Math.min(z + 0.15, 2.2));
  };

  const handleZoomOut = () => {
    setAutoFit(false);
    setZoom(z => Math.max(z - 0.15, 0.4));
  };

  const handleZoomReset = () => {
    setAutoFit(true);
    setZoom(1);
  };

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'TD' ? 'LR' : 'TD');
  };

  return (
    <div className="code-flowchart-container">
      {/* Header Toolbar */}
      <div className="code-flowchart-toolbar">
        <div className="code-flowchart-title">
          <span className="code-flowchart-badge">Logic Flowchart</span>
          {activeLineText && (
            <div className="code-flowchart-active-tag">
              <span>Line {activeLine}:</span>
              <code>{activeLineText.length > 28 ? activeLineText.substring(0, 26) + '...' : activeLineText}</code>
            </div>
          )}
        </div>

        <div className="code-flowchart-actions">
          {/* Fit Toggle */}
          <button
            type="button"
            className={`code-flowchart-btn ${autoFit ? 'active' : ''}`}
            onClick={() => {
              if (autoFit) {
                setAutoFit(false);
              } else {
                setAutoFit(true);
                setZoom(1);
              }
            }}
            title={autoFit ? 'Auto-Fit Enabled (Fits viewport without scrolling)' : 'Enable Auto-Fit'}
          >
            <Maximize2 size={12} />
            <span>{autoFit ? 'Fit' : 'Manual'}</span>
          </button>

          {/* Orientation Toggle (TD vs LR) */}
          <button
            type="button"
            className="code-flowchart-btn"
            onClick={toggleOrientation}
            title={`Layout: ${orientation === 'TD' ? 'Top-to-Bottom' : 'Left-to-Right'}`}
          >
            {orientation === 'TD' ? <ArrowDownUp size={12} /> : <ArrowLeftRight size={12} />}
            <span>{orientation}</span>
          </button>

          {/* Zoom controls */}
          <button
            type="button"
            className="code-flowchart-btn"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            type="button"
            className="code-flowchart-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            type="button"
            className="code-flowchart-btn"
            onClick={handleZoomReset}
            title="Reset to 100%"
          >
            <RotateCcw size={11} />
            <span>{Math.round(zoom * 100)}%</span>
          </button>

          {/* Code Viewer Toggle */}
          <button
            type="button"
            className={`code-flowchart-btn ${showCode ? 'active' : ''}`}
            onClick={() => setShowCode(!showCode)}
            title="Inspect Mermaid Code"
          >
            <Code size={12} />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      {showCode ? (
        <pre className="mermaid-raw-code">{chartCode}</pre>
      ) : (
        <div className={`code-flowchart-viewport ${autoFit ? 'is-autofit' : ''}`} ref={containerRef}>
          {loading && (
            <div className="code-flowchart-loading">
              <Sparkles size={20} className="animate-spin" color="#38BDF8" />
              <span>Rendering Flowchart...</span>
            </div>
          )}

          {!loading && renderError && (
            <div className="code-flowchart-error">
              <AlertCircle size={20} />
              <span>Could not generate flowchart: {renderError}</span>
              <button
                type="button"
                className="code-flowchart-btn"
                style={{ marginTop: 8 }}
                onClick={() => setShowCode(true)}
              >
                Inspect Code
              </button>
            </div>
          )}

          {!loading && !renderError && svgHtml && (
            <div
              className="code-flowchart-svg-wrapper"
              style={autoFit ? {} : { transform: `scale(${zoom})` }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}
        </div>
      )}

      {/* Live Variables HUD Strip */}
      {varKeys.length > 0 && (
        <div className="code-flowchart-hud">
          <div className="code-flowchart-hud-header">
            <span>Live Scope Variables (Step {currentStep + 1})</span>
            {activeStepData?.stdout && (
              <span style={{ color: '#10B981', fontFamily: 'monospace' }}>
                stdout: "{activeStepData.stdout.trim()}"
              </span>
            )}
          </div>
          <div className="code-flowchart-pills">
            {varKeys.map((key) => {
              const val = variables[key];
              const prevVal = prevVariables[key];
              const isChanged = prevVal !== undefined && JSON.stringify(prevVal) !== JSON.stringify(val);
              const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);

              return (
                <div key={key} className={`code-flowchart-pill ${isChanged ? 'changed' : ''}`}>
                  <span className="code-flowchart-pill-key">{key}:</span>
                  <span className="code-flowchart-pill-val">{displayVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
