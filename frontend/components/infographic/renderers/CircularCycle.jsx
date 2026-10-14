'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const CircularCycle = ({
  elements,
  connectors = [],
  animationController,
  canvasWidth,
  canvasHeight,
  onSelectElement,
}) => {
  const elemMap = new Map(elements.map((e) => [e.id, e]));
  const centerX = canvasWidth * 0.5;
  const centerY = canvasHeight * 0.54;
  const rx = canvasWidth * 0.32;
  const ry = canvasHeight * 0.28;
  const rxInner = canvasWidth * 0.19;
  const ryInner = canvasHeight * 0.16;

  // Directional chevron positions along the orbital path
  const chevronAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
  let stageCounter = 0;

  return (
    <g id="layout-circular-cycle">
      {/* 1. Dual Concentric Orbital Rings */}
      <g id="cycle-orbital-tracks">
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="rgba(16, 185, 129, 0.18)"
          strokeWidth="1.8"
          strokeDasharray="6,8"
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={rxInner}
          ry={ryInner}
          fill="none"
          stroke="rgba(16, 185, 129, 0.08)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={rx}
          ry={ry}
          fill="none"
          stroke="rgba(16, 185, 129, 0.06)"
          strokeWidth="12"
        />
      </g>

      {/* 2. Directional Arrow Chevrons along the orbit perimeter */}
      {chevronAngles.map((angle, idx) => {
        const px = centerX + rx * Math.cos(angle);
        const py = centerY + ry * Math.sin(angle);
        const deg = (angle + Math.PI / 2) * (180 / Math.PI);

        return (
          <g key={`chevron-${idx}`} transform={`translate(${px}, ${py}) rotate(${deg})`}>
            <path
              d="M -4 -5 L 4 0 L -4 5"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
            />
          </g>
        );
      })}

      {/* 3. Connectors */}
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

      {/* 4. Elements with stepNumber on stages */}
      {elements.map((elem) => {
        const isHub = elem.id === "cycle-hub" || elem.semanticRole === "hub" || elem.type === "badge";
        const stepNum = isHub ? undefined : ++stageCounter;

        return (
          <SvgElementNode
            key={elem.id}
            element={elem}
            isRevealed={animationController.revealedElementIds.has(elem.id)}
            onSelect={onSelectElement}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            stepNumber={stepNum}
          />
        );
      })}
    </g>
  );
};
