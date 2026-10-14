'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const EditorialLayout = ({
  elements,
  connectors = [],
  animationController,
  canvasWidth,
  canvasHeight,
  onSelectElement,
}) => {
  const elemMap = new Map(elements.map((e) => [e.id, e]));

  return (
    <g id="layout-editorial">
      {/* 1. Background ambient editorial grid lines */}
      <defs>
        <pattern
          id="editorial-grid"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 36 0 L 0 0 0 36"
            fill="none"
            stroke="rgba(255, 255, 255, 0.025)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect
        width={canvasWidth}
        height={canvasHeight}
        fill="url(#editorial-grid)"
      />

      {/* 2. Bento Grid Structural Zone Frames */}
      <g id="bento-zone-frames">
        <rect
          x={canvasWidth * 0.05}
          y={canvasHeight * 0.18}
          width={canvasWidth * 0.40}
          height={canvasHeight * 0.74}
          rx={20}
          fill="rgba(56, 189, 248, 0.015)"
          stroke="rgba(56, 189, 248, 0.08)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <rect
          x={canvasWidth * 0.47}
          y={canvasHeight * 0.18}
          width={canvasWidth * 0.48}
          height={canvasHeight * 0.74}
          rx={20}
          fill="rgba(255, 255, 255, 0.01)"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      </g>

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

      {/* 4. Elements */}
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
