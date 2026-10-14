import { buildDeterministicSequence } from "./animationSequence.js";

/**
 * Assign rich, high-contrast accent strokes based on layout grammar and node role.
 * Cyan (#38bdf8), Emerald (#10b981), Indigo (#818cf8), Purple (#c084fc), Amber (#f59e0b), Rose (#f472b6/ec4899)
 */
export function resolveNodeStyle(role, layoutType, index, totalNodes, category) {
  const cat = (category || "").toLowerCase();
  const r = (role || "").toLowerCase();

  // 1. Comparison Entities
  if (r === "left-entity" || (layoutType === "comparison" && index === 0)) {
    return { stroke: "#3b82f6", fill: "#0f1d38", variant: "blue" };
  }
  if (r === "right-entity" || (layoutType === "comparison" && index === 1)) {
    return { stroke: "#ec4899", fill: "#251128", variant: "rose" };
  }
  if (layoutType === "comparison") {
    return index % 2 === 0
      ? { stroke: "rgba(59, 130, 246, 0.7)", fill: "#0e1a30", variant: "blue" }
      : { stroke: "rgba(236, 72, 153, 0.7)", fill: "#210f24", variant: "rose" };
  }

  // 2. Hub / Hero
  if (r === "hub" || r === "hero") {
    return { stroke: "#c084fc", fill: "#1a1230", variant: "purple" };
  }

  // 3. Inputs / Reactants / Early stages
  if (
    r === "input" ||
    cat.includes("input") ||
    cat.includes("reagent") ||
    cat.includes("pros") ||
    cat.includes("start")
  ) {
    return { stroke: "#f59e0b", fill: "#1c180e", variant: "amber" };
  }

  // 4. Outputs / Products / Results
  if (
    r === "output" ||
    cat.includes("output") ||
    cat.includes("product") ||
    cat.includes("cons") ||
    cat.includes("end") ||
    cat.includes("result")
  ) {
    return { stroke: "#10b981", fill: "#0e201b", variant: "emerald" };
  }

  // 5. Hierarchy tiers: progressive spectrum from Apex (Cyan) to Base (Emerald)
  if (layoutType === "hierarchy") {
    const tierColors = [
      { stroke: "#38bdf8", fill: "#0c1f30", variant: "cyan" },
      { stroke: "#818cf8", fill: "#131733", variant: "indigo" },
      { stroke: "#c084fc", fill: "#1a1230", variant: "purple" },
      { stroke: "#f59e0b", fill: "#1c180e", variant: "amber" },
      { stroke: "#10b981", fill: "#0e201b", variant: "emerald" },
      { stroke: "#f472b6", fill: "#251128", variant: "rose" },
    ];
    return tierColors[index % tierColors.length];
  }

  // 6. Sequential process & timeline
  if (layoutType === "horizontal-process" || layoutType === "circular-cycle" || layoutType === "timeline") {
    if (index === 0) return { stroke: "#38bdf8", fill: "#0d1d30", variant: "cyan" };
    if (index === totalNodes - 1) return { stroke: "#10b981", fill: "#0e201b", variant: "emerald" };
    const midColors = [
      { stroke: "#818cf8", fill: "#131733", variant: "indigo" },
      { stroke: "#c084fc", fill: "#1a1230", variant: "purple" },
      { stroke: "#f59e0b", fill: "#1c180e", variant: "amber" },
      { stroke: "#f472b6", fill: "#251128", variant: "rose" },
    ];
    return midColors[(index - 1) % midColors.length];
  }

  // 7. Radial satellites / Bento cards
  const palette = [
    { stroke: "#38bdf8", fill: "#0d1d30", variant: "cyan" },
    { stroke: "#10b981", fill: "#0e201b", variant: "emerald" },
    { stroke: "#818cf8", fill: "#131733", variant: "indigo" },
    { stroke: "#c084fc", fill: "#1a1230", variant: "purple" },
    { stroke: "#f59e0b", fill: "#1c180e", variant: "amber" },
    { stroke: "#f472b6", fill: "#251128", variant: "rose" },
  ];
  return palette[index % palette.length];
}

/**
 * Builds a full, validated SceneSpecification from a semantic plan using
 * one of the 9 deterministic collision-free spatial layout algorithms.
 */
export function buildSceneFromSemanticPlan(plan, options = {}) {
  const layoutType = plan.layoutGrammar || "editorial";
  const rawNodes = [...(plan.nodes || [])];
  const N = Math.max(3, Math.min(8, rawNodes.length));
  const nodes = rawNodes.slice(0, N);

  const isSquare = options.aspectRatio === "square";
  const canvasWidth = isSquare ? 1000 : 1200;
  const canvasHeight = isSquare ? 1000 : options.aspectRatio === "4:3" ? 900 : 675;

  const elements = [];
  const connectors = [];

  const title = (plan.detectedTopic || plan.coreThesis?.slice(0, 70) || "Visual Knowledge Blueprint").slice(0, 100);
  const summary = (plan.coreThesis || title).length > 250
    ? plan.coreThesis.slice(0, 247) + "..."
    : (plan.coreThesis || title);

  // -------------------------------------------------------------
  // SPATIAL LAYOUT ENGINES (N = 3..8, safe bounds x:10..90, y:20..88)
  // -------------------------------------------------------------
  switch (layoutType) {
    case "horizontal-process": {
      if (N <= 4) {
        // Single horizontal wave with alternating slight Y offsets (46 and 58)
        for (let i = 0; i < N; i++) {
          const node = nodes[i];
          const x = Math.round(16 + (i * (84 - 16)) / Math.max(1, N - 1));
          const y = i % 2 === 0 ? 46 : 58;
          const style = resolveNodeStyle(node.semanticRole, layoutType, i, N, node.category);

          elements.push({
            id: node.id,
            type: "card",
            text: node.title,
            subtitle: node.subtitle,
            category: node.category || `STAGE 0${i + 1}`,
            icon: node.icon || "arrow-right",
            equation: node.equation || undefined,
            highlight: node.highlight ?? (i === 0 || i === N - 1),
            position: { x, y },
            size: { width: 18, height: 18 },
            style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
            animation: { order: i + 1, effect: "fade-in", duration: 550 },
            sourceEvidence: node.sourceEvidence,
          });

          if (i > 0) {
            const existingConn = plan.connectors?.find((c) => c.from === nodes[i - 1].id && c.to === node.id);
            connectors.push({
              id: existingConn?.id || `conn-proc-${i - 1}-${i}`,
              from: nodes[i - 1].id,
              to: node.id,
              label: existingConn?.label,
              style: existingConn?.style || "curved-arrow",
              animation: { order: i + 1, effect: "draw-path", duration: 600 },
            });
          }
        }
      } else {
        // 2-row S-curve serpentine pipeline (Row 1 left-to-right y:34, Row 2 right-to-left y:72)
        const N1 = Math.ceil(N / 2);
        const N2 = N - N1;

        // Row 1 (indices 0 .. N1 - 1)
        for (let i = 0; i < N1; i++) {
          const node = nodes[i];
          const x = Math.round(15 + (i * (85 - 15)) / Math.max(1, N1 - 1));
          const y = 34;
          const style = resolveNodeStyle(node.semanticRole, layoutType, i, N, node.category);

          elements.push({
            id: node.id,
            type: "card",
            text: node.title,
            subtitle: node.subtitle,
            category: node.category || `STAGE 0${i + 1}`,
            icon: node.icon || "arrow-right",
            equation: node.equation || undefined,
            highlight: node.highlight ?? (i === 0),
            position: { x, y },
            size: { width: 16, height: 18 },
            style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
            animation: { order: i + 1, effect: "fade-in", duration: 500 },
            sourceEvidence: node.sourceEvidence,
          });

          if (i > 0) {
            const existingConn = plan.connectors?.find((c) => c.from === nodes[i - 1].id && c.to === node.id);
            connectors.push({
              id: existingConn?.id || `conn-row1-${i - 1}-${i}`,
              from: nodes[i - 1].id,
              to: node.id,
              label: existingConn?.label,
              style: existingConn?.style || "curved-arrow",
              animation: { order: i + 1, effect: "draw-path", duration: 500 },
            });
          }
        }

        // Row 2 (indices N1 .. N - 1, running right-to-left)
        for (let j = 0; j < N2; j++) {
          const idx = N1 + j;
          const node = nodes[idx];
          const x = Math.round(85 - (j * (85 - 15)) / Math.max(1, N2 - 1));
          const y = 72;
          const style = resolveNodeStyle(node.semanticRole, layoutType, idx, N, node.category);

          elements.push({
            id: node.id,
            type: "card",
            text: node.title,
            subtitle: node.subtitle,
            category: node.category || `STAGE 0${idx + 1}`,
            icon: node.icon || "arrow-right",
            equation: node.equation || undefined,
            highlight: node.highlight ?? (idx === N - 1),
            position: { x, y },
            size: { width: 16, height: 18 },
            style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
            animation: { order: idx + 1, effect: "fade-in", duration: 500 },
            sourceEvidence: node.sourceEvidence,
          });

          if (j === 0) {
            const existingConn = plan.connectors?.find((c) => c.from === nodes[N1 - 1].id && c.to === node.id);
            connectors.push({
              id: existingConn?.id || `conn-turn-${N1 - 1}-${N1}`,
              from: nodes[N1 - 1].id,
              to: node.id,
              label: existingConn?.label,
              style: existingConn?.style || "curved-arrow",
              animation: { order: N1 + 1, effect: "draw-path", duration: 650 },
            });
          } else {
            const existingConn = plan.connectors?.find((c) => c.from === nodes[idx - 1].id && c.to === node.id);
            connectors.push({
              id: existingConn?.id || `conn-row2-${idx - 1}-${idx}`,
              from: nodes[idx - 1].id,
              to: node.id,
              label: existingConn?.label,
              style: existingConn?.style || "curved-arrow",
              animation: { order: idx + 1, effect: "draw-path", duration: 500 },
            });
          }
        }
      }
      break;
    }

    case "circular-cycle": {
      // 1 compact hub pill at (50, 54)
      elements.push({
        id: "cycle-hub",
        type: "badge",
        shapeType: "pill",
        text: title.length > 25 ? title.slice(0, 22) + "..." : title,
        subtitle: "Continuous Loop",
        position: { x: 50, y: 54 },
        size: { width: 18, height: 10 },
        highlight: true,
        style: { fill: "#1a1230", stroke: "#c084fc", variant: "purple" },
        animation: { order: 1, effect: "pop", duration: 500 },
        sourceEvidence: nodes[0]?.sourceEvidence || plan.coreThesis,
      });

      // Distribute all N stages evenly around ellipse rx=32, ry=28 centered at (50, 54)
      for (let i = 0; i < N; i++) {
        const node = nodes[i];
        const theta = -Math.PI / 2 + (2 * Math.PI * i) / N;
        const x = Math.round((50 + 32 * Math.cos(theta)) * 10) / 10;
        const y = Math.round((54 + 28 * Math.sin(theta)) * 10) / 10;
        const style = resolveNodeStyle(node.semanticRole, layoutType, i, N, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || `PHASE 0${i + 1}`,
          icon: node.icon || "refresh-cw",
          equation: node.equation || undefined,
          highlight: node.highlight ?? (i === 0),
          position: { x, y },
          size: { width: 18, height: 16 },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: i + 2, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        const nextNode = nodes[(i + 1) % N];
        connectors.push({
          id: `conn-cycle-${node.id}-${nextNode.id}`,
          from: node.id,
          to: nextNode.id,
          style: "curved-arrow",
          animation: { order: i + 2, effect: "draw-path", duration: 600 },
        });
      }
      break;
    }

    case "radial-map": {
      // Central hub node at (50, 54)
      const hubIdx = nodes.findIndex((n) => n.semanticRole === "hub" || n.highlight || n.id === "radial-core");
      const centralNode = hubIdx >= 0 ? nodes.splice(hubIdx, 1)[0] : nodes.shift();
      centralNode.id = "radial-core";

      elements.push({
        id: centralNode.id,
        type: "card",
        text: centralNode.title,
        subtitle: centralNode.subtitle,
        category: centralNode.category || "CENTRAL CORE",
        icon: centralNode.icon || "sparkles",
        highlight: true,
        position: { x: 50, y: 54 },
        size: { width: 24, height: 18 },
        style: { fill: "#1a1230", stroke: "#c084fc", variant: "purple" },
        animation: { order: 1, effect: "pop", duration: 600 },
        sourceEvidence: centralNode.sourceEvidence,
      });

      // Distribute N-1 satellite nodes at rx=34, ry=29
      const satellites = nodes;
      const M = satellites.length;
      for (let i = 0; i < M; i++) {
        const node = satellites[i];
        const theta = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, M);
        const x = Math.round((50 + 34 * Math.cos(theta)) * 10) / 10;
        const y = Math.round((54 + 29 * Math.sin(theta)) * 10) / 10;
        const style = resolveNodeStyle(node.semanticRole || "satellite", layoutType, i, M, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || `FACET 0${i + 1}`,
          icon: node.icon || "layers",
          equation: node.equation || undefined,
          highlight: node.highlight ?? false,
          position: { x, y },
          size: { width: 18, height: 16 },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: i + 2, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        connectors.push({
          id: `conn-radial-${i + 1}`,
          from: "radial-core",
          to: node.id,
          style: "curved-arrow",
          animation: { order: i + 2, effect: "draw-path", duration: 550 },
        });
      }
      break;
    }

    case "comparison": {
      const leftEntity = nodes.find((n) => n.semanticRole === "left-entity") || nodes[0];
      const rightEntity = nodes.find((n) => n.semanticRole === "right-entity") || (nodes[1] ?? nodes[0]);

      elements.push({
        id: "header-entity-a",
        type: "card",
        text: leftEntity?.title || "Entity A",
        subtitle: leftEntity?.subtitle?.slice(0, 70) || "Primary Paradigm",
        category: "PARADIGM A",
        icon: leftEntity?.icon || "layers",
        highlight: true,
        position: { x: 27, y: 22 },
        size: { width: 30, height: 13 },
        style: { fill: "#0f1d38", stroke: "#3b82f6", variant: "blue" },
        animation: { order: 1, effect: "fade-in", duration: 500 },
        sourceEvidence: leftEntity?.sourceEvidence,
      });

      elements.push({
        id: "header-entity-b",
        type: "card",
        text: rightEntity?.title || "Entity B",
        subtitle: rightEntity?.subtitle?.slice(0, 70) || "Contrasting Paradigm",
        category: "PARADIGM B",
        icon: rightEntity?.icon || "cpu",
        highlight: true,
        position: { x: 73, y: 22 },
        size: { width: 30, height: 13 },
        style: { fill: "#251128", stroke: "#ec4899", variant: "rose" },
        animation: { order: 2, effect: "fade-in", duration: 500 },
        sourceEvidence: rightEntity?.sourceEvidence,
      });

      connectors.push({
        id: "conn-vs-header",
        from: "header-entity-a",
        to: "header-entity-b",
        label: "VERSUS",
        style: "dashed",
        animation: { order: 2, effect: "draw-path", duration: 600 },
      });

      // Align comparison rows vertically at y: 42, 60, 78
      const comparisonRows = nodes.filter((n) => n !== leftEntity && n !== rightEntity);
      const rowYCoordinates = [42, 60, 78, 86];
      const rowCount = Math.min(3, Math.ceil(Math.max(1, comparisonRows.length) / 2));

      for (let r = 0; r < rowCount; r++) {
        const y = rowYCoordinates[r] || 42 + r * 18;
        const leftNode = comparisonRows[r * 2];
        const rightNode = comparisonRows[r * 2 + 1];

        if (leftNode) {
          elements.push({
            id: leftNode.id,
            type: "card",
            text: leftNode.title,
            subtitle: leftNode.subtitle,
            category: leftNode.category || `DIMENSION 0${r + 1}`,
            icon: leftNode.icon || "check-circle",
            equation: leftNode.equation || undefined,
            position: { x: 27, y },
            size: { width: 32, height: 14 },
            style: { fill: "#0e1a30", stroke: "rgba(59, 130, 246, 0.65)", variant: "blue" },
            animation: { order: 3 + r * 2, effect: "fade-in", duration: 500 },
            sourceEvidence: leftNode.sourceEvidence,
          });
        }

        if (rightNode) {
          elements.push({
            id: rightNode.id,
            type: "card",
            text: rightNode.title,
            subtitle: rightNode.subtitle,
            category: rightNode.category || `DIMENSION 0${r + 1}`,
            icon: rightNode.icon || "activity",
            equation: rightNode.equation || undefined,
            position: { x: 73, y },
            size: { width: 32, height: 14 },
            style: { fill: "#210f24", stroke: "rgba(236, 72, 153, 0.65)", variant: "rose" },
            animation: { order: 4 + r * 2, effect: "fade-in", duration: 500 },
            sourceEvidence: rightNode.sourceEvidence,
          });

          if (leftNode) {
            connectors.push({
              id: `conn-row-${r + 1}`,
              from: leftNode.id,
              to: rightNode.id,
              style: "dashed",
              animation: { order: 4 + r * 2, effect: "draw-path", duration: 500 },
            });
          }
        }
      }
      break;
    }

    case "hierarchy": {
      const tierHeight = Math.round(Math.max(10, Math.min(14, 56 / N)));

      for (let i = 0; i < N; i++) {
        const node = nodes[i];
        const y = Math.round((22 + (i * (84 - 22)) / Math.max(1, N - 1)) * 10) / 10;
        const width = Math.round((24 + (i * (68 - 24)) / Math.max(1, N - 1)) * 10) / 10;
        const style = resolveNodeStyle("tier", layoutType, i, N, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || (i === 0 ? "APEX LEVEL" : i === N - 1 ? "FOUNDATION" : `TIER 0${i + 1}`),
          icon: node.icon || "layers",
          equation: node.equation || undefined,
          highlight: node.highlight ?? (i === 0),
          position: { x: 50, y },
          size: { width, height: tierHeight },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: i + 1, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        if (i > 0) {
          connectors.push({
            id: `conn-tier-${i - 1}-${i}`,
            from: nodes[i - 1].id,
            to: node.id,
            style: "straight",
            animation: { order: i + 1, effect: "draw-path", duration: 500 },
          });
        }
      }
      break;
    }

    case "timeline": {
      const cardWidth = Math.round(Math.min(20, 70 / N + 4));

      for (let i = 0; i < N; i++) {
        const node = nodes[i];
        const x = Math.round((14 + (i * (86 - 14)) / Math.max(1, N - 1)) * 10) / 10;
        const y = i % 2 === 0 ? 32 : 76;
        const style = resolveNodeStyle(node.semanticRole, layoutType, i, N, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || `ERA 0${i + 1}`,
          icon: node.icon || "calendar",
          equation: node.equation || undefined,
          highlight: node.highlight ?? (i === 0 || i === N - 1),
          position: { x, y },
          size: { width: cardWidth, height: 18 },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: i + 1, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        if (i > 0) {
          connectors.push({
            id: `conn-timeline-${i - 1}-${i}`,
            from: nodes[i - 1].id,
            to: node.id,
            style: "curved-arrow",
            animation: { order: i + 1, effect: "draw-path", duration: 550 },
          });
        }
      }
      break;
    }

    case "editorial": {
      const heroIdx = nodes.findIndex((n) => n.semanticRole === "hero" || n.highlight);
      const heroNode = heroIdx >= 0 ? nodes.splice(heroIdx, 1)[0] : nodes.shift();

      elements.push({
        id: heroNode.id,
        type: "card",
        text: heroNode.title,
        subtitle: heroNode.subtitle,
        category: heroNode.category || "CORE THESIS",
        icon: heroNode.icon || "sparkles",
        highlight: true,
        position: { x: 24, y: 54 },
        size: { width: 34, height: 56 },
        style: { fill: "#131b2e", stroke: "#38bdf8", variant: "cyan" },
        animation: { order: 1, effect: "fade-in", duration: 600 },
        sourceEvidence: heroNode.sourceEvidence,
      });

      const bentoItems = nodes;
      const M = bentoItems.length;
      const R = Math.ceil(M / 2);
      const cardHeight = R >= 3 ? 16 : 24;

      for (let k = 0; k < M; k++) {
        const node = bentoItems[k];
        const col = k % 2;
        const row = Math.floor(k / 2);
        const x = col === 0 ? 60 : 84;
        const y = R === 1 ? 54 : R === 2 ? (row === 0 ? 38 : 70) : Math.round(30 + (row * (78 - 30)) / (R - 1));
        const style = resolveNodeStyle(node.semanticRole, layoutType, k, M, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || `INSIGHT 0${k + 1}`,
          icon: node.icon || "info",
          equation: node.equation || undefined,
          position: { x, y },
          size: { width: 21, height: cardHeight },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: k + 2, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        if (k === 0 || k === 1) {
          connectors.push({
            id: `conn-hero-${node.id}`,
            from: heroNode.id,
            to: node.id,
            style: "curved-arrow",
            animation: { order: k + 2, effect: "draw-path", duration: 500 },
          });
        }
      }
      break;
    }

    case "scientific-illustration":
    case "technical-model": {
      const hubIdx = nodes.findIndex((n) => n.semanticRole === "hub" || n.semanticRole === "hero" || n.highlight);
      const anchorNode = hubIdx >= 0 ? nodes.splice(hubIdx, 1)[0] : nodes.shift();

      elements.push({
        id: anchorNode.id,
        type: "card",
        text: anchorNode.title,
        subtitle: anchorNode.subtitle,
        category: anchorNode.category || "SYSTEM CORE",
        icon: anchorNode.icon || "cpu",
        highlight: true,
        position: { x: 50, y: 54 },
        size: { width: 26, height: 26 },
        style: { fill: "#151833", stroke: "#818cf8", variant: "indigo" },
        animation: { order: 1, effect: "reveal", duration: 600 },
        sourceEvidence: anchorNode.sourceEvidence,
      });

      const inputs = nodes.filter((n) => n.category?.toLowerCase().includes("input") || n.category?.toLowerCase().includes("reagent"));
      const outputs = nodes.filter((n) => n.category?.toLowerCase().includes("output") || n.category?.toLowerCase().includes("product") || n.category?.toLowerCase().includes("result"));
      const remaining = nodes.filter((n) => !inputs.includes(n) && !outputs.includes(n));

      while (remaining.length > 0) {
        if (inputs.length <= outputs.length) {
          inputs.push(remaining.shift());
        } else {
          outputs.push(remaining.shift());
        }
      }

      for (let i = 0; i < inputs.length; i++) {
        const node = inputs[i];
        const y = inputs.length === 1 ? 54 : Math.round(36 + (i * (72 - 36)) / (inputs.length - 1));
        const style = resolveNodeStyle("input", layoutType, i, inputs.length, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || `INPUT 0${i + 1}`,
          icon: node.icon || "sun",
          equation: node.equation || undefined,
          position: { x: 18, y },
          size: { width: 20, height: 18 },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: i + 2, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        connectors.push({
          id: `conn-input-${node.id}`,
          from: node.id,
          to: anchorNode.id,
          style: "curved-arrow",
          animation: { order: i + 2, effect: "draw-path", duration: 550 },
        });
      }

      for (let j = 0; j < outputs.length; j++) {
        const node = outputs[j];
        const y = outputs.length === 1 ? 54 : Math.round(36 + (j * (72 - 36)) / (outputs.length - 1));
        const style = resolveNodeStyle("output", layoutType, j, outputs.length, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || `OUTPUT 0${j + 1}`,
          icon: node.icon || "zap",
          equation: node.equation || undefined,
          position: { x: 82, y },
          size: { width: 20, height: 18 },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: inputs.length + j + 2, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        connectors.push({
          id: `conn-output-${node.id}`,
          from: anchorNode.id,
          to: node.id,
          style: "curved-arrow",
          animation: { order: inputs.length + j + 2, effect: "draw-path", duration: 550 },
        });
      }
      break;
    }

    case "data-chart": {
      const chartData = plan.chartData && plan.chartData.values?.length >= 2
        ? plan.chartData
        : {
            labels: nodes.slice(0, 4).map((n) => n.title.slice(0, 14)),
            values: [85, 92, 78, 88].slice(0, Math.min(4, nodes.length)),
            unit: "%",
          };

      elements.push({
        id: "main-chart",
        type: "chart",
        position: { x: 28, y: 54 },
        size: { width: 44, height: 58 },
        chartData: {
          labels: chartData.labels,
          values: chartData.values,
          unit: chartData.unit || "%",
          chartType: "bar",
        },
        style: { fill: "#0c1527", stroke: "#38bdf8", variant: "cyan" },
        animation: { order: 1, effect: "reveal", duration: 700 },
      });

      const takeaways = nodes;
      const M = Math.min(4, takeaways.length);
      const cardHeight = Math.min(20, Math.floor(48 / M));

      for (let i = 0; i < M; i++) {
        const node = takeaways[i];
        const y = M === 1 ? 54 : Math.round(28 + (i * (80 - 28)) / (M - 1));
        const style = resolveNodeStyle(node.semanticRole, layoutType, i, M, node.category);

        elements.push({
          id: node.id,
          type: "card",
          text: node.title,
          subtitle: node.subtitle,
          category: node.category || `METRIC 0${i + 1}`,
          icon: node.icon || "trending-up",
          equation: node.equation || undefined,
          position: { x: 78, y },
          size: { width: 32, height: cardHeight },
          style: { fill: style.fill, stroke: style.stroke, variant: style.variant },
          animation: { order: i + 2, effect: "fade-in", duration: 500 },
          sourceEvidence: node.sourceEvidence,
        });

        if (i === 0) {
          connectors.push({
            id: `conn-chart-takeaway`,
            from: "main-chart",
            to: node.id,
            style: "curved-arrow",
            animation: { order: 2, effect: "draw-path", duration: 550 },
          });
        }
      }
      break;
    }

    default:
      break;
  }

  // Preserve explicit connectors from semantic plan if they reference created elements
  const createdElementIds = new Set(elements.map((e) => e.id));
  if (Array.isArray(plan.connectors) && plan.connectors.length > 0) {
    for (const customConn of plan.connectors) {
      if (
        createdElementIds.has(customConn.from) &&
        createdElementIds.has(customConn.to) &&
        customConn.from !== customConn.to &&
        !connectors.some((c) => c.from === customConn.from && c.to === customConn.to)
      ) {
        connectors.push({
          id: customConn.id || `conn-custom-${customConn.from}-${customConn.to}`,
          from: customConn.from,
          to: customConn.to,
          label: customConn.label,
          style: customConn.style || "curved-arrow",
          animation: { order: elements.length + 1, effect: "draw-path", duration: 500 },
        });
      }
    }
  }

  const sceneDraft = {
    schemaVersion: 1,
    title,
    summary,
    layout: {
      type: layoutType,
      aspectRatio: options.aspectRatio || "16:9",
      explanation: plan.designRationale || `Interactive composition in ${layoutType} grammar`,
      alternateCandidate: plan.alternateLayout || "editorial",
    },
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      viewBox: `0 0 ${canvasWidth} ${canvasHeight}`,
      safeMargin: 32,
      theme: options.theme || "dark",
    },
    elements,
    connectors,
    animationSequence: [],
    sourceEvidence: elements
      .filter((e) => e.sourceEvidence)
      .map((e) => ({
        claim: e.text || e.id,
        sourceSnippet: e.sourceEvidence,
        confidence: 0.95,
      })),
    warnings: [],
    metadata: {
      requestId: options.requestId || `req-${Date.now()}`,
      timings: { planningMs: 0, validationMs: 0 },
      generatedAt: new Date().toISOString(),
      modelUsed: options.modelUsed || "gemini-3.1-flash-lite",
      heuristicFallback: options.modelUsed?.includes("heuristic"),
    },
  };

  // Compile deterministic animation sequence
  sceneDraft.animationSequence = buildDeterministicSequence(sceneDraft);

  return sceneDraft;
}

export function buildSceneFromExtraction(extraction, layoutPlan, options = {}) {
  const semanticPlan = convertExtractionToSemanticPlan(extraction, layoutPlan);
  return buildSceneFromSemanticPlan(semanticPlan, {
    ...options,
    modelUsed: options.modelUsed || "heuristic-fallback",
  });
}

function convertExtractionToSemanticPlan(extraction, layoutPlan) {
  const lowerCore = (extraction.coreIdea || "").toLowerCase();
  const lowerTopic = (extraction.detectedTopic || "").toLowerCase();
  const facts = extraction.facts || [];

  const isTcp = lowerTopic.includes("tcp") || lowerCore.includes("tcp") || lowerCore.includes("handshake");
  const isPhotosynthesis = lowerTopic.includes("photosynthesis") || lowerCore.includes("photosynthesis");
  const isWaterCycle = lowerTopic.includes("water cycle") || lowerCore.includes("water cycle") || lowerCore.includes("hydrologic");

  const nodes = [];
  const connectors = [];

  if (isTcp) {
    nodes.push(
      {
        id: "step-syn",
        title: "SYN (Client Request)",
        subtitle: "Client sends Synchronize sequence packet to initiate connection.",
        category: "STEP 01",
        icon: "arrow-right",
        highlight: true,
        semanticRole: "stage",
        sourceEvidence: "When your computer - known as the client - wants to open a website, it must talk to the server.",
      },
      {
        id: "step-syn-ack",
        title: "SYN-ACK (Server Response)",
        subtitle: "Server acknowledges request and responds with synchronized sequence.",
        category: "STEP 02",
        icon: "refresh-cw",
        semanticRole: "stage",
        sourceEvidence: "Server acknowledges and sends SYN-ACK response.",
      },
      {
        id: "step-ack",
        title: "ACK (Connection Confirmed)",
        subtitle: "Client confirms acknowledgement; reliable socket connection open.",
        category: "STEP 03",
        icon: "check-circle",
        semanticRole: "stage",
        sourceEvidence: "Client sends final ACK to complete 3-way handshake.",
      },
      {
        id: "step-session",
        title: "Active Socket Session",
        subtitle: "Bi-directional reliable stream transfer ready for HTTP/TLS data.",
        category: "CONNECTED",
        icon: "activity",
        semanticRole: "stage",
        sourceEvidence: "Computers use this set of rules to talk reliably over the internet.",
      }
    );
    connectors.push({
      id: "conn-tcp-1",
      from: "step-syn",
      to: "step-syn-ack",
      label: "SYN Packet",
      style: "curved-arrow",
    });
  } else if (isPhotosynthesis) {
    nodes.push(
      {
        id: "light-energy",
        title: "Solar Photons",
        subtitle: "Sunlight energy absorbed by Chlorophyll pigments in leaf chloroplasts.",
        category: "INPUT",
        icon: "sun",
        semanticRole: "stage",
        sourceEvidence: "Chlorophyll within chloroplasts absorbs sunlight (photons).",
      },
      {
        id: "raw-reactants",
        title: "H2O & CO2 Reactants",
        subtitle: "Water absorbed by roots and atmospheric carbon dioxide via stomata.",
        category: "INPUT",
        icon: "droplet",
        semanticRole: "stage",
        sourceEvidence: "Carbon dioxide (CO2) from air and water (H2O) enter cells.",
      },
      {
        id: "reaction-core",
        title: "Chloroplast / Calvin Cycle",
        subtitle: "Photolysis splits water; light-independent reactions fix carbon.",
        category: "CORE",
        icon: "cpu",
        highlight: true,
        semanticRole: "hub",
        equation: "6CO2 + 6H2O -> C6H12O6 + 6O2",
        sourceEvidence: "Through light-dependent reactions and Calvin cycle, water molecules split.",
      },
      {
        id: "glucose-product",
        title: "Glucose Energy (C6H12O6)",
        subtitle: "High-energy carbohydrates power cellular respiration and growth.",
        category: "OUTPUT",
        icon: "zap",
        semanticRole: "stage",
        sourceEvidence: "Carbon atoms are fixed into glucose (C6H12O6).",
      },
      {
        id: "oxygen-byproduct",
        title: "Oxygen Release (O2)",
        subtitle: "Atmospheric oxygen released as essential byproduct.",
        category: "OUTPUT",
        icon: "wind",
        semanticRole: "stage",
        sourceEvidence: "Releasing oxygen (O2) into the atmosphere.",
      }
    );
  } else if (isWaterCycle) {
    nodes.push(
      {
        id: "evaporation",
        title: "Evaporation & Transpiration",
        subtitle: "Solar thermal energy transforms liquid surface water into rising vapor.",
        category: "PHASE 01",
        icon: "sun",
        semanticRole: "stage",
        sourceEvidence: "Solar radiation warms water, driving Evaporation into vapor.",
      },
      {
        id: "condensation",
        title: "Atmospheric Condensation",
        subtitle: "Cooling air causes vapor to condense into clouds and droplet clusters.",
        category: "PHASE 02",
        icon: "cloud",
        semanticRole: "stage",
        sourceEvidence: "As vapor cools, Condensation occurs, forming clouds.",
      },
      {
        id: "precipitation",
        title: "Precipitation",
        subtitle: "Droplet mass exceeds updrafts, returning as rain, snow, or sleet.",
        category: "PHASE 03",
        icon: "cloud-rain",
        semanticRole: "stage",
        sourceEvidence: "Precipitation falls as rain, snow, or hail.",
      },
      {
        id: "collection",
        title: "Collection & Runoff",
        subtitle: "Runoff percolates through aquifers into reservoirs, closing the loop.",
        category: "PHASE 04",
        icon: "waves",
        semanticRole: "stage",
        sourceEvidence: "Collection occurs through surface runoff returning water to reservoirs.",
      }
    );
  } else {
    const rawItems = facts.length >= 3 ? facts : extraction.coreIdea.split(/(?<=[.!?])\s+/).filter((s) => s.length > 8);
    const count = Math.max(3, Math.min(8, rawItems.length));

    for (let i = 0; i < count; i++) {
      const itemText = rawItems[i] || `Key Concept ${i + 1}`;
      const words = itemText.split(/\s+/);
      const title = words.slice(0, 4).join(" ").replace(/[.:,;]$/, "");
      const subtitle = itemText.length > 105 ? itemText.slice(0, 102) + "..." : itemText;

      nodes.push({
        id: `node-${i + 1}`,
        title: title || `Facet 0${i + 1}`,
        subtitle,
        category: `ITEM 0${i + 1}`,
        icon: i === 0 ? "sparkles" : i === count - 1 ? "check-circle" : "layers",
        highlight: i === 0,
        semanticRole: i === 0 ? "hero" : "stage",
        sourceEvidence: itemText,
      });
    }
  }

  let detectedTopic = extraction.detectedTopic || "Visual Summary";
  if (isTcp) detectedTopic = "TCP/IP 3-Way Handshake Protocol";

  return {
    detectedTopic,
    coreThesis: extraction.coreIdea,
    structuralPattern: `Derived ${layoutPlan.layout} grammar`,
    layoutGrammar: layoutPlan.layout,
    designRationale: layoutPlan.explanation,
    alternateLayout: layoutPlan.alternateCandidate,
    nodes,
    connectors,
    chartData: extraction.numericData && extraction.numericData.length >= 2
      ? {
          labels: extraction.numericData.map((d) => d.label),
          values: extraction.numericData.map((d) => d.value),
          unit: extraction.numericData[0]?.unit || "%",
        }
      : null,
  };
}
