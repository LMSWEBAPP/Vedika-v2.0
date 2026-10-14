'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const HierarchyLayout = ({
  elements,
  connectors = [],
  animationController,
  canvasWidth,
  canvasHeight,
  onSelectElement,
}) => {
  const elemMap = new Map(elements.map((e) => [e.id, e]));

  return (
    <g id="layout-hierarchy">
      {/* 1. Subtle pyramid backdrop triangle */}
      <polygon
        points={`${canvasWidth / 2},90 ${canvasWidth - 100},${canvasHeight - 50} 100,${canvasHeight - 50}`}
        fill="rgba(129, 140, 248, 0.02)"
        stroke="rgba(129, 140, 248, 0.08)"
        strokeWidth="1.5"
        strokeDasharray="6,6"
      />

      {/* 2. Horizontal tiered stratum bands with L1, L2, L3... level indicators */}
      {elements.map((elem, idx) => {
        const cx = (elem.position.x / 100) * canvasWidth;
        const cy = (elem.position.y / 100) * canvasHeight;
        const cw = ((elem.size?.width ?? 30) / 100) * canvasWidth;
        const ch = ((elem.size?.height ?? 14) / 100) * canvasHeight;
        const strokeColor = elem.style?.stroke || "#818cf8";

        const bandW = cw + 36;
        const bandH = ch + 10;
        const bandLeft = cx - bandW / 2;
        const bandTop = cy - bandH / 2;
        const isRevealed = animationController.revealedElementIds.has(elem.id);

        return (
          <g
            key={`stratum-${elem.id}`}
            id={`stratum-band-${elem.id}`}
            style={{
              opacity: isRevealed ? 1 : 0,
              transition: "opacity 0.5s ease-out",
            }}
          >
            <rect
              x={bandLeft}
              y={bandTop}
              width={bandW}
              height={bandH}
              rx={14}
              fill="rgba(255, 255, 255, 0.015)"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            <g id={`level-tag-${elem.id}`}>
              <rect
                x={bandLeft - 38}
                y={cy - 10}
                width={28}
                height={20}
                rx={6}
                fill="rgba(15, 23, 42, 0.85)"
                stroke={strokeColor}
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              <text
                x={bandLeft - 24}
                y={cy + 3.5}
                fill={strokeColor}
                fontSize="9"
                fontWeight="800"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                L{idx + 1}
              </text>
            </g>
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

      {/* 4. Tier Elements with stepNumber */}
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
