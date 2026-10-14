'use client';

import React, { useState } from "react";
import { Download, FileJson, Image as ImageIcon, Check } from "lucide-react";

export const ExportControls = ({ scene, svgRef }) => {
  const [downloadedFormat, setDownloadedFormat] = useState(null);

  if (!scene) return null;

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scene, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `visual-summary-${scene.layout?.type || "infographic"}-${Date.now()}.json`);
    dlAnchorElem.click();
    setDownloadedFormat("json");
    setTimeout(() => setDownloadedFormat(null), 2000);
  };

  const handleExportSVG = () => {
    if (!svgRef?.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `visual-summary-${scene.layout?.type || "infographic"}-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setDownloadedFormat("svg");
    setTimeout(() => setDownloadedFormat(null), 2000);
  };

  const handleExportPNG = () => {
    if (!svgRef?.current) return;
    const svgElement = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);
    const img = new window.Image();

    img.onload = () => {
      const scale = 2; // 2x Retina resolution
      const baseWidth = scene.canvas?.width || 1200;
      const baseHeight = scene.canvas?.height || 675;

      const canvas = document.createElement("canvas");
      canvas.width = baseWidth * scale;
      canvas.height = baseHeight * scale;
      const context = canvas.getContext("2d");
      if (context) {
        context.scale(scale, scale);
        context.fillStyle = scene.canvas?.theme === "light" ? "#f8fafc" : "#0c1222";
        context.fillRect(0, 0, baseWidth, baseHeight);
        context.drawImage(img, 0, 0, baseWidth, baseHeight);
        const png = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = png;
        downloadLink.download = `visual-summary-${scene.layout?.type || "infographic"}-retina-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URLObject.revokeObjectURL(blobURL);
      setDownloadedFormat("png");
      setTimeout(() => setDownloadedFormat(null), 2000);
    };

    img.src = blobURL;
  };

  const btnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "#cbd5e1",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        type="button"
        onClick={handleExportSVG}
        title="Export Vector SVG"
        style={btnStyle}
      >
        {downloadedFormat === "svg" ? <Check size={13} color="#34d399" /> : <Download size={13} color="#38bdf8" />}
        <span>SVG</span>
      </button>

      <button
        type="button"
        onClick={handleExportPNG}
        title="Export 2x Retina PNG"
        style={btnStyle}
      >
        {downloadedFormat === "png" ? <Check size={13} color="#34d399" /> : <ImageIcon size={13} color="#a855f7" />}
        <span>PNG</span>
      </button>

      <button
        type="button"
        onClick={handleExportJSON}
        title="Download Scene JSON"
        style={btnStyle}
      >
        {downloadedFormat === "json" ? <Check size={13} color="#34d399" /> : <FileJson size={13} color="#f59e0b" />}
        <span>JSON</span>
      </button>
    </div>
  );
};
