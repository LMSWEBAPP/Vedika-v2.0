'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const HorizontalProcess = ({
  elements,
  connectors = [],
  animationController,
  canvasWidth,
  canvasHeight,
  onSelectElement,
}) => {
  const elemMap = new Map(elements.map((e) => [e.id, e]));
  const N = elements.length;

  return (
    <g id="layout-horizontal-process">
      {/* 1. Subtle Connected Pipeline Rail behind cards */}
      <g id="process-pipeline-rail">
        {N <= 4 ? (
          /* Single Wave Pipeline Rail */
          (() => {
            const yMid = canvasHeight * 0.52;
            return (
              <>
                <line
                  x1={60}
                  y1={yMid}
                  x2={canvasWidth - 60}
                  y2={yMid}
                  stroke="rgba(56, 189, 248, 0.06)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <line
                  x1={60}
                  y1={yMid}
                  x2={canvasWidth - 60}
                  y2={yMid}
                  stroke="rgba(56, 189, 248, 0.22)"
                  strokeWidth="2"
                  strokeDasharray="8,8"
                  strokeLinecap="round"
                />
              </>
            );
          })()
        ) : (
          /* 2-Row Serpentine Pipeline Rail */
          (() => {
            const y1 = canvasHeight * 0.34;
            const y2 = canvasHeight * 0.72;
            const leftX = canvasWidth * 0.15;
            const rightX = canvasWidth * 0.85;

            const railPath = `M ${leftX} ${y1} L ${rightX} ${y1} C ${rightX + 50} ${y1}, ${rightX + 50} ${y2}, ${rightX} ${y2} L ${leftX} ${y2}`;

            return (
              <>
                <path
                  d={railPath}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.06)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d={railPath}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.25)"
                  strokeWidth="2.2"
                  strokeDasharray="8,8"
                  strokeLinecap="round"
                />
              </>
            );
          })()
        )}
      </g>

      {/* 2. Connectors */}
      {connectors.map((conn) => (
        <SvgConnectorPath
          key={conn.id}
          connector={conn}
          isDrawn={animationController.drawnConnectorIds.has(conn.id)}
          fromElement={elemMap.get(conn.from)}
          toElement={elemMap.get(conn.to)}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}

      {/* 3. Stage Elements with stepNumber */}
      {elements.map((elem, idx) => (
        <SvgElementNode
          key={elem.id}
          element={elem}
          isRevealed={animationController.revealedElementIds.has(elem.id)}
          onSelect={onSelectElement}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          stepNumber={idx + 1}
        />
      ))}
    </g>
  );
};
