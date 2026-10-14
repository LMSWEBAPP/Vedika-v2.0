export function selectLayout(extraction, userPreference) {
  // If user explicitly picked a non-automatic style and it's valid
  if (userPreference && userPreference !== "automatic") {
    const prefMap = {
      scientific: "scientific-illustration",
      "scientific-illustration": "scientific-illustration",
      editorial: "editorial",
      comparison: "comparison",
      process: "horizontal-process",
      "horizontal-process": "horizontal-process",
      radial: "radial-map",
      "radial-map": "radial-map",
      cycle: "circular-cycle",
      "circular-cycle": "circular-cycle",
      timeline: "timeline",
      hierarchy: "hierarchy",
      chart: "data-chart",
      "data-chart": "data-chart",
    };
    if (prefMap[userPreference]) {
      return {
        layout: prefMap[userPreference],
        explanation: `User preference explicitly requested '${userPreference}' layout grammar.`,
        alternateCandidate: "editorial",
        confidence: 0.95,
      };
    }
  }

  // 1. Data Chart: only if grounded numeric data exists
  if (extraction.structureType === "data" && extraction.numericData && extraction.numericData.length >= 2) {
    return {
      layout: "data-chart",
      explanation: `Tutor response contains grounded numeric metrics (${extraction.numericData.length} data points), which are best represented as an explicit chart.`,
      alternateCandidate: "editorial",
      confidence: 0.92,
    };
  }

  // 2. Comparison
  if (extraction.structureType === "comparison") {
    return {
      layout: "comparison",
      explanation: "Content is structured around contrasting entities with parallel comparative dimensions.",
      alternateCandidate: "editorial",
      confidence: 0.9,
    };
  }

  // 3. Circular Cycle
  if (extraction.structureType === "cycle") {
    return {
      layout: "circular-cycle",
      explanation: "Information represents a closed loop where return or repetition is semantically essential.",
      alternateCandidate: "horizontal-process",
      confidence: 0.91,
    };
  }

  // 4. Horizontal Process
  if (extraction.structureType === "process") {
    return {
      layout: "horizontal-process",
      explanation: "Content follows an ordered linear progression of stages with directional flow.",
      alternateCandidate: "editorial",
      confidence: 0.88,
    };
  }

  // 5. Timeline
  if (extraction.structureType === "timeline") {
    return {
      layout: "timeline",
      explanation: "Content describes chronological historical milestones or time-ordered evolution.",
      alternateCandidate: "horizontal-process",
      confidence: 0.89,
    };
  }

  // 6. Hierarchy
  if (extraction.structureType === "hierarchy") {
    return {
      layout: "hierarchy",
      explanation: "Content has nested levels, rank, dependency, or categorical classification.",
      alternateCandidate: "radial-map",
      confidence: 0.87,
    };
  }

  // 7. Scientific Illustration
  if (extraction.structureType === "scientific") {
    return {
      layout: "scientific-illustration",
      explanation: "Content features a physical or scientific subject with components, energy exchanges, and annotations.",
      alternateCandidate: "editorial",
      confidence: 0.93,
    };
  }

  // 8. Radial Map
  if (extraction.structureType === "radial") {
    return {
      layout: "radial-map",
      explanation: "Central concept with interconnected peripheral facets radiating outwards.",
      alternateCandidate: "editorial",
      confidence: 0.85,
    };
  }

  // 9. Editorial / Mixed default
  return {
    layout: "editorial",
    explanation: "Content contains multi-part concepts and varied facts; editorial grammar provides optimal visual balance and readability without forcing a rigid diagram syntax.",
    alternateCandidate: "radial-map",
    confidence: 0.86,
  };
}
