import { SceneSpecificationSchema } from "./schema.js";

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /onload=/gi,
  /onerror=/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
];

export function sanitizeString(str) {
  if (!str) return "";
  let clean = String(str);
  for (const pattern of XSS_PATTERNS) {
    clean = clean.replace(pattern, "[sanitized]");
  }
  return clean.trim();
}

export function validateScene(rawInput) {
  const errors = [];
  const warnings = [];

  if (!rawInput || typeof rawInput !== "object") {
    return {
      valid: false,
      errors: ["Scene input must be a non-null object."],
      warnings: [],
      metrics: {
        elementCount: 0,
        connectorCount: 0,
        hasChart: false,
        hasEvidence: false,
        brokenReferencesCount: 0,
      },
    };
  }

  // 1. Zod schema validation
  const parsed = SceneSpecificationSchema.safeParse(rawInput);
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      errors.push(`${issue.path.join(".") || "root"}: ${issue.message}`);
    });
    return {
      valid: false,
      errors,
      warnings,
      metrics: {
        elementCount: 0,
        connectorCount: 0,
        hasChart: false,
        hasEvidence: false,
        brokenReferencesCount: 0,
      },
    };
  }

  const scene = parsed.data;

  // Sanitize texts to prevent injection
  scene.title = sanitizeString(scene.title);
  scene.summary = sanitizeString(scene.summary);

  // 2. Element ID uniqueness and spatial checks
  const elementIdSet = new Set();
  for (const elem of scene.elements) {
    if (elementIdSet.has(elem.id)) {
      errors.push(`Duplicate element ID detected: "${elem.id}"`);
    }
    elementIdSet.add(elem.id);

    if (elem.text) {
      elem.text = sanitizeString(elem.text);
      if (elem.text.length > 200) {
        warnings.push(`Element "${elem.id}" text length is long (${elem.text.length} chars). Consider concise copy.`);
      }
    }
    if (elem.subtitle) {
      elem.subtitle = sanitizeString(elem.subtitle);
    }

    // Spatial & dimension boundary checks
    const w = elem.size?.width ?? 22;
    const h = elem.size?.height ?? 16;
    if (w <= 0 || h <= 0) {
      errors.push(`Element "${elem.id}" has invalid zero or negative dimensions (width: ${w}, height: ${h}).`);
    }

    const halfW = w / 2;
    const halfH = h / 2;
    const leftBound = elem.position.x - halfW;
    const rightBound = elem.position.x + halfW;
    const topBound = elem.position.y - halfH;
    const bottomBound = elem.position.y + halfH;

    if (leftBound < -1 || rightBound > 101 || topBound < -1 || bottomBound > 101) {
      warnings.push(
        `Element "${elem.id}" bounds [${leftBound.toFixed(1)}%, ${rightBound.toFixed(1)}%] x [${topBound.toFixed(1)}%, ${bottomBound.toFixed(1)}%] partially extend outside canvas bounds.`
      );
    }

    if (elem.type === "card" && (!elem.text || elem.text.trim().length === 0)) {
      warnings.push(`Card element "${elem.id}" has empty or missing text.`);
    }
  }

  // 3. Connectors reference integrity check
  let brokenReferencesCount = 0;
  for (const conn of scene.connectors) {
    if (!elementIdSet.has(conn.from)) {
      errors.push(`Connector "${conn.id}" references missing source ID: "${conn.from}"`);
      brokenReferencesCount++;
    }
    if (!elementIdSet.has(conn.to)) {
      errors.push(`Connector "${conn.id}" references missing target ID: "${conn.to}"`);
      brokenReferencesCount++;
    }
    if (conn.from === conn.to) {
      warnings.push(`Connector "${conn.id}" connects element "${conn.from}" to itself.`);
    }
  }

  // 4. Source Evidence verification
  let hasEvidence = false;
  if (scene.sourceEvidence && scene.sourceEvidence.length > 0) {
    hasEvidence = true;
    for (const ev of scene.sourceEvidence) {
      ev.claim = sanitizeString(ev.claim);
      ev.sourceSnippet = sanitizeString(ev.sourceSnippet);
    }
  } else {
    warnings.push("Scene does not include sourceEvidence mappings for factual grounding.");
  }

  // 5. Check if chart data exists
  const hasChart = scene.elements.some((e) => e.type === "chart" && e.chartData);

  return {
    valid: errors.length === 0,
    scene,
    errors,
    warnings,
    metrics: {
      elementCount: scene.elements.length,
      connectorCount: scene.connectors.length,
      hasChart,
      hasEvidence,
      brokenReferencesCount,
    },
  };
}
