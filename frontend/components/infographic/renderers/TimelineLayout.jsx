'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const TimelineLayout = ({
  elements,
  connectors = [],
  animationController,
  canvasWidth,
  canvasHeight,
  onSelectElement,
}) => {
  const elemMap = new Map(elements.map((e) => [e.id, e]));
  const spineY = canvasHeight * 0.54;

  const ticks = [];
  const startX = 80;
  const endX = canvasWidth - 80;
  for (let x = startX; x <= endX; x += 28) {
    ticks.push(x);
  }

  return (
    <g id="layout-timeline">
      {/* 1. Subtle timeline tick marks */}
      {ticks.map((tx) => (
        <line
          key={`tick-${tx}`}
          x1={tx}
          y1={spineY - 3}
          x2={tx}
          y2={spineY + 3}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />
      ))}

      {/* 2. Glowing central horizontal timeline spine */}
      <line
        x1={60}
        y1={spineY}
        x2={canvasWidth - 60}
        y2={spineY}
        stroke="rgba(245, 158, 11, 0.15)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <line
        x1={60}
        y1={spineY}
        x2={canvasWidth - 60}
        y2={spineY}
        stroke="rgba(245, 158, 11, 0.45)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 3. Milestone stem lines and glowing axis nodes */}
      {elements.map((elem) => {
        const cx = (elem.position.x / 100) * canvasWidth;
        const cy = (elem.position.y / 100) * canvasHeight;
        const rawH = ((elem.size?.height ?? 18) / 100) * canvasHeight;
        const h = Math.min(rawH, canvasHeight - 100);
        const isRevealed = animationController.revealedElementIds.has(elem.id);
        const strokeColor = elem.style?.stroke || "#f59e0b";

        const isAbove = cy < spineY;
        const stemStartY = isAbove ? cy + h / 2 : cy - h / 2;

        return (
          <g key={`milestone-${elem.id}`} style={{ opacity: isRevealed ? 1 : 0.15, transition: "opacity 0.4s ease-out" }}>
            <line
              x1={cx}
              y1={stemStartY}
              x2={cx}
              y2={spineY}
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              strokeOpacity="0.5"
            />
            <circle
              cx={cx}
              cy={spineY}
              r={9}
              fill="#080e1a"
              stroke={strokeColor}
              strokeWidth="2"
            />
            <circle
              cx={cx}
              cy={spineY}
              r={4}
              fill={strokeColor}
            />
          </g>
        );
      })}

      {/* 4. Connectors */}
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

      {/* 5. Elements with stepNumber */}
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
