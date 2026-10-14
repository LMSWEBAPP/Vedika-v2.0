'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const RadialMap = ({
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

  const radarRings = [135, 235, 325];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];

  const outerElements = elements.filter(
    (e) => Math.hypot((e.position.x / 100) * canvasWidth - centerX, (e.position.y / 100) * canvasHeight - centerY) > 40
  );

  return (
    <g id="layout-radial-map">
      {/* 1. Technical Coordinate Crosshairs */}
      <g id="radial-crosshairs">
        <line
          x1={centerX - 420}
          y1={centerY}
          x2={centerX + 420}
          y2={centerY}
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth="1"
          strokeDasharray="4,6"
        />
        <line
          x1={centerX}
          y1={centerY - 220}
          x2={centerX}
          y2={centerY + 220}
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth="1"
          strokeDasharray="4,6"
        />
        <path
          d={`M ${centerX - 8} ${centerY} L ${centerX + 8} ${centerY} M ${centerX} ${centerY - 8} L ${centerX} ${centerY + 8}`}
          stroke="#c084fc"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </g>

      {/* 2. Concentric Radar Rings & Degree Ticks */}
      <g id="radial-radar-rings">
        {radarRings.map((r, idx) => (
          <circle
            key={`radial-ring-${idx}`}
            cx={centerX}
            cy={centerY}
            r={r}
            fill="none"
            stroke="rgba(192, 132, 252, 0.10)"
            strokeWidth={idx === 0 ? "1.5" : "1"}
            strokeDasharray={idx === 1 ? "6,8" : "none"}
          />
        ))}

        {angles.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = centerX + 229 * Math.cos(rad);
          const y1 = centerY + 229 * Math.sin(rad);
          const x2 = centerX + 241 * Math.cos(rad);
          const y2 = centerY + 241 * Math.sin(rad);

          return (
            <line
              key={`tick-${deg}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(192, 132, 252, 0.28)"
              strokeWidth="1.2"
            />
          );
        })}

        <text x={centerX + 248} y={centerY + 3} fill="rgba(192, 132, 252, 0.4)" fontSize="8" fontFamily="ui-monospace, monospace">000°</text>
        <text x={centerX} y={centerY + 248} fill="rgba(192, 132, 252, 0.4)" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="middle">090°</text>
        <text x={centerX - 250} y={centerY + 3} fill="rgba(192, 132, 252, 0.4)" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="end">180°</text>
        <text x={centerX} y={centerY - 242} fill="rgba(192, 132, 252, 0.4)" fontSize="8" fontFamily="ui-monospace, monospace" textAnchor="middle">270°</text>
      </g>

      {/* 3. Subtle Radial Spokes from center to satellites */}
      <g id="radial-spokes">
        {outerElements.map((elem) => {
          const ex = (elem.position.x / 100) * canvasWidth;
          const ey = (elem.position.y / 100) * canvasHeight;

          return (
            <line
              key={`spoke-${elem.id}`}
              x1={centerX}
              y1={centerY}
              x2={ex}
              y2={ey}
              stroke="rgba(192, 132, 252, 0.12)"
              strokeWidth="1"
              strokeDasharray="4,6"
            />
          );
        })}
      </g>

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

      {/* 5. Elements */}
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
