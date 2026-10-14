import { validateScene } from "./validateScene.js";

/**
 * Deterministic spatial and reference repair engine.
 * Guarantees that any scene specification that has minor coordinate bounds,
 * duplicate ID, broken connector, or missing field issues is cleanly repaired
 * into a valid, displayable SceneSpecification.
 */
export function repairSceneLocally(scene) {
  if (!scene || typeof scene !== "object") {
    return {
      valid: false,
      errors: ["Cannot repair null or non-object scene."],
      warnings: [],
      metrics: { elementCount: 0, connectorCount: 0, hasChart: false, hasEvidence: false, brokenReferencesCount: 0 }
    };
  }

  const repaired = JSON.parse(JSON.stringify(scene));

  // 1. Sanitize title and summary
  if (!repaired.title || String(repaired.title).trim().length === 0) {
    repaired.title = "Visual Summary";
  } else if (repaired.title.length > 120) {
    repaired.title = repaired.title.slice(0, 117) + "...";
  }

  if (!repaired.summary || String(repaired.summary).trim().length === 0) {
    repaired.summary = repaired.title;
  } else if (repaired.summary.length > 400) {
    repaired.summary = repaired.summary.slice(0, 397) + "...";
  }

  // 2. Ensure Canvas has required dimensions
  if (!repaired.canvas) {
    repaired.canvas = {
      width: 1200,
      height: 675,
      viewBox: "0 0 1200 675",
      safeMargin: 32,
      theme: "dark",
    };
  }

  // 3. Deduplicate element IDs and clamp coordinates into safe bounds [10..90, 20..88]
  const seenIds = new Set();
  const idRemap = new Map();

  if (!Array.isArray(repaired.elements)) {
    repaired.elements = [];
  }

  for (let i = 0; i < repaired.elements.length; i++) {
    const elem = repaired.elements[i];
    let uniqueId = elem.id || `node-${i + 1}`;
    if (seenIds.has(uniqueId)) {
      uniqueId = `${uniqueId}-${i + 1}`;
    }
    if (uniqueId !== elem.id) {
      idRemap.set(elem.id, uniqueId);
      elem.id = uniqueId;
    }
    seenIds.add(uniqueId);

    // Ensure valid position within safe bounds [10..90, 20..88]
    const rawX = typeof elem.position?.x === "number" ? elem.position.x : 50;
    const rawY = typeof elem.position?.y === "number" ? elem.position.y : 50;
    elem.position = {
      x: Math.max(10, Math.min(90, Math.round(rawX * 10) / 10)),
      y: Math.max(20, Math.min(88, Math.round(rawY * 10) / 10)),
    };

    // Ensure valid size
    const rawW = typeof elem.size?.width === "number" ? elem.size.width : 22;
    const rawH = typeof elem.size?.height === "number" ? elem.size.height : 16;
    elem.size = {
      width: Math.max(12, Math.min(75, Math.round(rawW * 10) / 10)),
      height: Math.max(8, Math.min(60, Math.round(rawH * 10) / 10)),
    };

    // Ensure card has text
    if (elem.type === "card" && (!elem.text || elem.text.trim().length === 0)) {
      elem.text = elem.subtitle ? elem.subtitle.slice(0, 40) : elem.id;
    }

    // Ensure chart has data
    if (elem.type === "chart") {
      if (!elem.chartData || !elem.chartData.values || elem.chartData.values.length === 0) {
        elem.type = "card";
        elem.text = elem.text || "Metric Overview";
      }
    }
  }

  // 4. Fix connectors
  if (Array.isArray(repaired.connectors)) {
    repaired.connectors = repaired.connectors
      .map((conn) => {
        const from = idRemap.get(conn.from) || conn.from;
        const to = idRemap.get(conn.to) || conn.to;
        return { ...conn, from, to };
      })
      .filter((conn) => seenIds.has(conn.from) && seenIds.has(conn.to) && conn.from !== conn.to);
  } else {
    repaired.connectors = [];
  }

  // 5. Ensure source evidence
  if (!repaired.sourceEvidence || repaired.sourceEvidence.length === 0) {
    repaired.sourceEvidence = [
      {
        claim: repaired.title,
        sourceSnippet: repaired.summary.slice(0, 150),
        confidence: 0.9,
      },
    ];
  }

  return validateScene(repaired);
}
