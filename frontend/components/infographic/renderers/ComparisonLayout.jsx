'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const ComparisonLayout = ({
  elements,
  connectors = [],
  animationController,
  canvasWidth,
  canvasHeight,
  onSelectElement,
}) => {
  const elemMap = new Map(elements.map((e) => [e.id, e]));
  const midX = canvasWidth / 2;
  const centerY = canvasHeight * 0.54;

  return (
    <g id="layout-comparison">
      {/* 1. Left Entity Glass Zone Container */}
      <g id="comparison-left-zone">
        <rect
          x={24}
          y={90}
          width={midX - 44}
          height={canvasHeight - 110}
          rx={18}
          fill="rgba(59, 130, 246, 0.04)"
          stroke="rgba(59, 130, 246, 0.16)"
          strokeWidth="1.2"
        />
        <line
          x1={38}
          y1={91}
          x2={midX - 34}
          y2={91}
          stroke="#3b82f6"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
      </g>

      {/* 2. Right Entity Glass Zone Container */}
      <g id="comparison-right-zone">
        <rect
          x={midX + 20}
          y={90}
          width={midX - 44}
          height={canvasHeight - 110}
          rx={18}
          fill="rgba(236, 72, 153, 0.04)"
          stroke="rgba(236, 72, 153, 0.16)"
          strokeWidth="1.2"
        />
        <line
          x1={midX + 34}
          y1={91}
          x2={canvasWidth - 38}
          y2={91}
          stroke="#ec4899"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
      </g>

      {/* 3. Central Vertical Divider Line */}
      <line
        x1={midX}
        y1={90}
        x2={midX}
        y2={canvasHeight - 20}
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1.5"
        strokeDasharray="6,6"
      />

      {/* 4. Circular VS Medallion Badge in the center */}
      <g id="comparison-vs-medallion">
        <circle
          cx={midX}
          cy={centerY}
          r={24}
          fill="#090e1a"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1.5"
          filter="url(#card-shadow)"
        />
        <circle
          cx={midX}
          cy={centerY}
          r={19}
          fill="rgba(30, 41, 59, 0.6)"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />
        <text
          x={midX}
          y={centerY + 4.5}
          fill="#f8fafc"
          fontSize="11.5"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.08em"
          textAnchor="middle"
        >
          VS
        </text>
      </g>

      {/* 5. Connectors */}
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

      {/* 6. Elements */}
      {elements.map((elem) => (
        <SvgElementNode
          key={elem.id}
          element={elem}
          isRevealed={animationController.revealedElementIds.has(elem.id)}
          onSelect={onSelectElement}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </g>
  );
};
