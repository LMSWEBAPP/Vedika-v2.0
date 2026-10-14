'use client';

import React from "react";
import {
  Sun,
  Droplet,
  Zap,
  Wind,
  Cpu,
  PlayCircle,
  Play,
  CheckCircle,
  ArrowRight,
  Cloud,
  CloudRain,
  Waves,
  Activity,
  Layers,
  TrendingUp,
  Info,
  Calendar,
  Bookmark,
  Award,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Database,
  Network,
  GitBranch,
  Lock,
  Globe,
  Code,
  Terminal,
  BookOpen,
  Atom,
  Brain,
  Scale,
  Gauge,
} from "lucide-react";

const ICON_MAP = {
  sun: Sun,
  droplet: Droplet,
  zap: Zap,
  wind: Wind,
  cpu: Cpu,
  "play-circle": PlayCircle,
  play: Play,
  "check-circle": CheckCircle,
  "arrow-right": ArrowRight,
  cloud: Cloud,
  "cloud-rain": CloudRain,
  waves: Waves,
  activity: Activity,
  layers: Layers,
  "trending-up": TrendingUp,
  info: Info,
  calendar: Calendar,
  bookmark: Bookmark,
  award: Award,
  sparkles: Sparkles,
  "shield-check": ShieldCheck,
  "refresh-cw": RefreshCw,
  database: Database,
  network: Network,
  "git-branch": GitBranch,
  lock: Lock,
  globe: Globe,
  code: Code,
  terminal: Terminal,
  "book-open": BookOpen,
  atom: Atom,
  brain: Brain,
  scale: Scale,
  gauge: Gauge,
};

export function getIconComponent(iconName) {
  if (!iconName) return Sparkles;
  return ICON_MAP[String(iconName).toLowerCase()] || Sparkles;
}

export function wrapSvgText(text, maxCharsPerLine = 34, maxLines = 4) {
  if (!text) return [];
  const words = String(text).split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines) break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length === maxLines && words.indexOf(currentLine.split(" ")[0]) < words.length - 1) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:!?]?$/, "...");
  }

  return lines;
}

export const SvgElementNode = ({
  element,
  isRevealed,
  onSelect,
  canvasWidth,
  canvasHeight,
  stepNumber,
}) => {
  const pixelX = (element.position.x / 100) * canvasWidth;
  const pixelY = (element.position.y / 100) * canvasHeight;
  const rawWidth = ((element.size?.width ?? 22) / 100) * canvasWidth;
  const rawHeight = ((element.size?.height ?? 16) / 100) * canvasHeight;

  // Safe clamping so elements never bleed off the canvas
  const width = Math.min(rawWidth, canvasWidth - 32);
  const height = Math.min(rawHeight, canvasHeight - 100);
  const left = Math.max(16, Math.min(pixelX - width / 2, canvasWidth - width - 16));
  const top = Math.max(82, Math.min(pixelY - height / 2, canvasHeight - height - 16));

  const IconComp = getIconComponent(element.icon);
  const strokeColor = element.style?.stroke || "#38bdf8";
  const bgColor = element.style?.fill || "#0f172a";

  const isCompactPill = element.type === "badge" || element.shapeType === "pill" || height < 60;
  const isLabel = element.type === "label" && height < 75;

  return (
    <g
      id={`svg-elem-${element.id}`}
      style={{
        opacity: isRevealed ? 1 : 0,
        transform: isRevealed ? "translateY(0) scale(1)" : "translateY(16px) scale(0.94)",
        transformOrigin: `${pixelX}px ${pixelY}px`,
        transition: "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: isRevealed ? "auto" : "none",
      }}
      className="cursor-pointer select-none"
      onClick={() => onSelect?.(element)}
    >
      <defs>
        <clipPath id={`clip-card-${element.id}`}>
          <rect x={left} y={top} width={width} height={height} rx="12" />
        </clipPath>
      </defs>

      {/* 1. COMPACT PILL BADGE */}
      {isCompactPill ? (
        <g id={`pill-${element.id}`}>
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            rx={height / 2}
            fill={bgColor}
            stroke={strokeColor}
            strokeWidth="1.6"
            filter="url(#card-shadow)"
          />
          <line
            x1={left + 14}
            y1={top + 1}
            x2={left + width - 14}
            y2={top + 1}
            stroke="#ffffff"
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <text
            x={left + width / 2}
            y={top + height / 2 + (element.subtitle ? -2 : 4)}
            fill="#f8fafc"
            fontSize="12"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
            textAnchor="middle"
          >
            {element.text || element.id}
          </text>
          {element.subtitle && (
            <text
              x={left + width / 2}
              y={top + height / 2 + 12}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
            >
              {element.subtitle.slice(0, 32)}
            </text>
          )}
        </g>
      ) : isLabel ? (
        /* 2. COMPACT LABEL */
        <g id={`label-${element.id}`}>
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            rx="10"
            fill={bgColor}
            stroke={strokeColor}
            strokeWidth="1.2"
            filter="url(#card-shadow)"
          />
          <rect
            x={left}
            y={top + 4}
            width="4"
            height={height - 8}
            rx="2"
            fill={strokeColor}
          />
          <line
            x1={left + 10}
            y1={top + 1}
            x2={left + width - 10}
            y2={top + 1}
            stroke="#ffffff"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
          {(() => {
            const labelLines = wrapSvgText(element.text || element.id, Math.floor((width - 24) / 6.8), 2);
            return (
              <text
                x={left + 14}
                y={top + (labelLines.length === 1 ? height / 2 + 4 : height / 2 - 4)}
                fill="#f1f5f9"
                fontSize="11"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {labelLines.map((l, i) => (
                  <tspan key={i} x={left + 14} dy={i === 0 ? "0" : "14"}>
                    {l}
                  </tspan>
                ))}
              </text>
            );
          })()}
        </g>
      ) : (
        /* 3. MULTI-LAYERED BESPOKE CARD */
        <g id={`card-${element.id}`}>
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            rx="12"
            fill={bgColor}
            stroke={strokeColor}
            strokeWidth={element.highlight ? "2" : "1.2"}
            filter={element.highlight ? "url(#hero-glow)" : "url(#card-shadow)"}
          />

          <g clipPath={`url(#clip-card-${element.id})`}>
            <rect
              x={left}
              y={top}
              width={width}
              height={42}
              fill={strokeColor}
              fillOpacity="0.10"
            />
            <line
              x1={left}
              y1={top + 42}
              x2={left + width}
              y2={top + 42}
              stroke={strokeColor}
              strokeOpacity="0.18"
              strokeWidth="0.8"
            />
            <rect
              x={left}
              y={top}
              width="4"
              height={height}
              fill={strokeColor}
            />
          </g>

          <line
            x1={left + 12}
            y1={top + 1}
            x2={left + width - 12}
            y2={top + 1}
            stroke="#ffffff"
            strokeOpacity="0.18"
            strokeWidth="1.2"
          />

          {element.icon && (
            <g id={`icon-box-${element.id}`}>
              <rect
                x={left + 12}
                y={top + 8}
                width={26}
                height={26}
                rx={6}
                fill="rgba(255, 255, 255, 0.08)"
                stroke={strokeColor}
                strokeWidth="0.8"
                strokeOpacity="0.45"
              />
              <svg x={left + 17} y={top + 13} width={16} height={16} overflow="visible">
                <IconComp size={16} color={strokeColor} />
              </svg>
            </g>
          )}

          {stepNumber !== undefined && (
            <g id={`step-badge-${element.id}`}>
              <circle
                cx={left + width - 18}
                cy={top + 18}
                r="11"
                fill="rgba(15, 23, 42, 0.92)"
                stroke={strokeColor}
                strokeWidth="1.2"
              />
              <text
                x={left + width - 18}
                y={top + 21.5}
                fill={strokeColor}
                fontSize="9"
                fontWeight="800"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                {String(stepNumber).padStart(2, "0")}
              </text>
            </g>
          )}

          {element.category && (
            <text
              x={stepNumber !== undefined ? left + width - 36 : left + width - 14}
              y={top + 23}
              fill={strokeColor}
              fontSize="9.5"
              fontWeight="700"
              fontFamily="ui-monospace, monospace, system-ui"
              textAnchor="end"
              letterSpacing="0.06em"
            >
              {element.category}
            </text>
          )}

          {(() => {
            const rightReserved = (stepNumber !== undefined ? 36 : 14) + (element.category ? element.category.length * 6.5 : 0);
            const titleLeft = element.icon ? left + 46 : left + 14;
            const availableTitleWidth = Math.max(left + width - titleLeft - rightReserved - 8, 60);
            const maxTitleChars = Math.max(12, Math.floor(availableTitleWidth / 7.2));
            const titleLines = wrapSvgText(element.text || element.id, maxTitleChars, 2);

            if (titleLines.length <= 1) {
              return (
                <text
                  x={titleLeft}
                  y={top + 26}
                  fill="#ffffff"
                  fontSize="13.5"
                  fontWeight="700"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  letterSpacing="-0.01em"
                >
                  {titleLines[0] || element.id}
                </text>
              );
            }

            return (
              <text
                x={titleLeft}
                y={top + 19}
                fill="#ffffff"
                fontSize="12.5"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="-0.01em"
              >
                <tspan x={titleLeft} dy="0">{titleLines[0]}</tspan>
                <tspan x={titleLeft} dy="16">{titleLines[1]}</tspan>
              </text>
            );
          })()}

          {element.equation ? (
            <g id={`eq-${element.id}`}>
              <rect
                x={left + 12}
                y={top + 50}
                width={width - 24}
                height={26}
                rx={6}
                fill="#050811"
                stroke="rgba(56, 189, 248, 0.3)"
                strokeWidth="1"
              />
              <text
                x={left + width / 2}
                y={top + 67}
                fill="#38bdf8"
                fontSize="11"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                {element.equation}
              </text>
            </g>
          ) : element.subtitle ? (
            (() => {
              const maxChars = Math.max(Math.floor((width - 28) / 7.2), 22);
              const maxLines = height > 140 ? 3 : 2;
              const subLines = wrapSvgText(element.subtitle, maxChars, maxLines);

              return (
                <text
                  x={left + 14}
                  y={top + 58}
                  fill="#f1f5f9"
                  fontSize="11.5"
                  fontWeight="400"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {subLines.map((line, idx) => (
                    <tspan key={idx} x={left + 14} dy={idx === 0 ? "0" : "17"}>
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })()
          ) : null}

          {element.sourceEvidence && height >= 120 && (
            <g id={`evidence-${element.id}`}>
              <line
                x1={left + 12}
                y1={top + height - 26}
                x2={left + width - 12}
                y2={top + height - 26}
                stroke="rgba(255, 255, 255, 0.08)"
              />
              <text
                x={left + 14}
                y={top + height - 10}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace, system-ui, sans-serif"
              >
                • {element.sourceEvidence.slice(0, Math.floor((width - 40) / 6.5))}
              </text>
              <text
                x={left + width - 14}
                y={top + height - 10}
                fill={strokeColor}
                fontSize="10"
                textAnchor="end"
              >
                ✓
              </text>
            </g>
          )}
        </g>
      )}
    </g>
  );
};

export const SvgConnectorPath = ({
  connector,
  isDrawn,
  fromElement,
  toElement,
  canvasWidth,
  canvasHeight,
}) => {
  if (!fromElement || !toElement) return null;

  const fw = ((fromElement.size?.width ?? 22) / 100) * canvasWidth;
  const fh = ((fromElement.size?.height ?? 16) / 100) * canvasHeight;
  const tw = ((toElement.size?.width ?? 22) / 100) * canvasWidth;
  const th = ((toElement.size?.height ?? 16) / 100) * canvasHeight;

  const cx1 = (fromElement.position.x / 100) * canvasWidth;
  const cy1 = (fromElement.position.y / 100) * canvasHeight;
  const cx2 = (toElement.position.x / 100) * canvasWidth;
  const cy2 = (toElement.position.y / 100) * canvasHeight;

  const dx = cx2 - cx1;
  const dy = cy2 - cy1;

  let startX = cx1;
  let startY = cy1;
  let endX = cx2;
  let endY = cy2;

  // Calculate clean perimeter connection points
  if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
    if (dx > 0) {
      startX = cx1 + fw / 2;
      endX = cx2 - tw / 2 - 5;
    } else {
      startX = cx1 - fw / 2;
      endX = cx2 + tw / 2 + 5;
    }
    startY = cy1;
    endY = cy2;
  } else {
    if (dy > 0) {
      startY = cy1 + fh / 2;
      endY = cy2 - th / 2 - 5;
    } else {
      startY = cy1 - fh / 2;
      endY = cy2 + th / 2 + 5;
    }
    startX = cx1;
    endX = cx2;
  }

  const cdx = endX - startX;
  const cdy = endY - startY;
  const strokeColor = fromElement.style?.stroke || "#38bdf8";

  let pathD = "";
  if (connector.style === "curved-arrow") {
    if (Math.abs(dx) >= Math.abs(dy) * 0.75) {
      const p1x = startX + cdx * 0.5;
      const p1y = startY;
      const p2x = startX + cdx * 0.5;
      const p2y = endY;
      pathD = `M ${startX} ${startY} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${endX} ${endY}`;
    } else {
      const p1x = startX;
      const p1y = startY + cdy * 0.5;
      const p2x = endX;
      const p2y = startY + cdy * 0.5;
      pathD = `M ${startX} ${startY} C ${p1x} ${p1y}, ${p2x} ${p2y}, ${endX} ${endY}`;
    }
  } else if (connector.style === "elbow") {
    pathD = `M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`;
  } else {
    pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const approxPathLen = Math.round(Math.hypot(cdx, cdy) * 1.35 + 40);

  return (
    <g id={`svg-conn-${connector.id}`}>
      <defs>
        <marker
          id={`arrowhead-${connector.id}`}
          markerWidth="7"
          markerHeight="5"
          refX="6"
          refY="2.5"
          orient="auto"
        >
          <polygon points="0 0, 7 2.5, 0 5" fill={strokeColor} opacity="0.85" />
        </marker>
      </defs>

      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        style={{
          opacity: isDrawn ? 0.16 : 0,
          transition: "opacity 0.4s ease-out",
        }}
      />

      <circle
        cx={startX}
        cy={startY}
        r="3"
        fill={strokeColor}
        style={{
          opacity: isDrawn ? 0.9 : 0,
          transition: "opacity 0.3s ease-out",
        }}
      />

      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.0"
        strokeLinecap="round"
        strokeDasharray={connector.style === "dashed" ? "6,5" : approxPathLen}
        strokeDashoffset={connector.style === "dashed" ? 0 : isDrawn ? 0 : approxPathLen}
        markerEnd={`url(#arrowhead-${connector.id})`}
        style={{
          opacity: isDrawn ? 0.95 : 0,
          transition: "stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out",
        }}
      />

      {connector.label && isDrawn && (() => {
        const labelLen = connector.label.length;
        const pillWidth = Math.max(labelLen * 6.8 + 22, 60);
        const pillHeight = 22;

        return (
          <g id={`conn-label-${connector.id}`}>
            <rect
              x={midX - pillWidth / 2}
              y={midY - pillHeight / 2}
              width={pillWidth}
              height={pillHeight}
              rx={11}
              fill="#080d1a"
              stroke={strokeColor}
              strokeWidth="1"
              strokeOpacity="0.45"
              filter="url(#card-shadow)"
            />
            <text
              x={midX}
              y={midY + 4}
              fill={strokeColor}
              fontSize="9"
              fontWeight="700"
              fontFamily="ui-monospace, monospace, system-ui, sans-serif"
              textAnchor="middle"
              letterSpacing="0.02em"
            >
              {connector.label}
            </text>
          </g>
        );
      })()}
    </g>
  );
};
