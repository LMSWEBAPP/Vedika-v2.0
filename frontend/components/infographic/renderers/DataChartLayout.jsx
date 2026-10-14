'use client';

import React from "react";
import { SvgElementNode, SvgConnectorPath } from "../LayoutComponents";

export const DataChartLayout = ({
  elements,
  connectors = [],
  animationController,
  canvasWidth,
  canvasHeight,
  onSelectElement,
}) => {
  const elemMap = new Map(elements.map((e) => [e.id, e]));
  const chartElement = elements.find((e) => e.type === "chart");
  const otherElements = elements.filter((e) => e.type !== "chart");

  const chartData = chartElement?.chartData || {
    labels: ["Metric A", "Metric B", "Metric C"],
    values: [65, 88, 45],
    unit: "%",
  };

  const isChartRevealed = chartElement
    ? animationController.revealedElementIds.has(chartElement.id)
    : true;

  const chartWidth = canvasWidth * 0.50;
  const chartHeight = canvasHeight * 0.68;
  const chartLeft = canvasWidth * 0.05;
  const chartTop = canvasHeight * 0.18;

  const maxVal = Math.max(...chartData.values, 100);

  return (
    <g id="layout-data-chart">
      {/* 1. Background card container for chart */}
      <rect
        x={chartLeft}
        y={chartTop}
        width={chartWidth}
        height={chartHeight}
        rx="18"
        fill="#090f1e"
        stroke="rgba(56, 189, 248, 0.28)"
        strokeWidth="1.2"
        filter="url(#card-shadow)"
      />

      <line
        x1={chartLeft + 16}
        y1={chartTop + 1}
        x2={chartLeft + chartWidth - 16}
        y2={chartTop + 1}
        stroke="#ffffff"
        strokeOpacity="0.15"
        strokeWidth="1"
      />

      <rect
        x={chartLeft}
        y={chartTop}
        width="4"
        height={chartHeight}
        rx="2"
        fill="#38bdf8"
      />

      <text
        x={chartLeft + 24}
        y={chartTop + 36}
        fill="#f8fafc"
        fontSize="15"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        📊 {chartElement?.text || "Quantitative Findings & Metrics"}
      </text>

      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
        const y = chartTop + chartHeight - 55 - pct * (chartHeight - 120);
        return (
          <g key={idx}>
            <line
              x1={chartLeft + 30}
              y1={y}
              x2={chartLeft + chartWidth - 30}
              y2={y}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeDasharray="4,4"
            />
            <text
              x={chartLeft + 18}
              y={y + 4}
              fill="#64748b"
              fontSize="9.5"
              fontFamily="monospace"
              textAnchor="end"
            >
              {Math.round(pct * maxVal)}
            </text>
          </g>
        );
      })}

      {/* Dynamic Animated Bars */}
      {chartData.labels.map((label, idx) => {
        const val = chartData.values[idx] || 0;
        const totalBars = chartData.labels.length;
        const barWidth = Math.min(48, Math.max(28, (chartWidth - 120) / totalBars - 16));
        const spacing = (chartWidth - 90) / totalBars;
        const x = chartLeft + 50 + idx * spacing + (spacing - barWidth) / 2;
        const maxBarH = chartHeight - 120;
        const targetBarH = (val / maxVal) * maxBarH;
        const actualBarH = isChartRevealed ? targetBarH : 0;
        const y = chartTop + chartHeight - 55 - actualBarH;

        return (
          <g key={idx} className="transition-all duration-700 ease-out">
            <defs>
              <linearGradient id={`bar-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(2, actualBarH)}
              rx="6"
              fill={`url(#bar-grad-${idx})`}
              filter="url(#glow-cyan)"
              opacity="0.85"
            />

            {isChartRevealed && (
              <text
                x={x + barWidth / 2}
                y={y - 8}
                fill="#38bdf8"
                fontSize="11.5"
                fontWeight="800"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {val}{chartData.unit || ""}
              </text>
            )}

            <text
              x={x + barWidth / 2}
              y={chartTop + chartHeight - 32}
              fill="#94a3b8"
              fontSize="10.5"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              {label.slice(0, 16)}
            </text>
          </g>
        );
      })}

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

      {/* 3. Takeaway cards on right */}
      {otherElements.map((elem) => (
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
