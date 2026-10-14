export function buildDeterministicSequence(scene) {
  if (!scene || !Array.isArray(scene.elements)) return [];

  const steps = [];
  let stepOrder = 1;

  // 1. Sort elements primarily by animation.order
  const sortedElements = [...scene.elements].sort(
    (a, b) => (a.animation?.order ?? 1) - (b.animation?.order ?? 1)
  );

  // Group connectors by animation order
  const sortedConnectors = [...(scene.connectors || [])].sort(
    (a, b) => (a.animation?.order ?? 2) - (b.animation?.order ?? 2)
  );

  // Map element IDs to their position for cursor movement
  const elementPosMap = new Map();
  for (const elem of scene.elements) {
    elementPosMap.set(elem.id, {
      x: elem.position.x,
      y: elem.position.y,
    });
  }

  // Interleave elements and connectors respecting dependencies
  for (const elem of sortedElements) {
    const pos = elem.position;
    // Step A: Cursor navigates smoothly to the element anchor
    steps.push({
      stepId: `step-cursor-elem-${elem.id}`,
      targetId: elem.id,
      order: stepOrder++,
      action: "cursor-move",
      duration: 650, // deliberate, smooth stylus motion
      cursorAnchor: { x: pos.x, y: pos.y },
      label: `Navigate: ${elem.text || elem.id}`,
    });

    // Step B: Reveal / draw element
    steps.push({
      stepId: `step-reveal-${elem.id}`,
      targetId: elem.id,
      order: stepOrder++,
      action: elem.animation?.effect === "reveal" ? "reveal" : "fade-in",
      duration: Math.max(750, elem.animation?.duration || 750),
      cursorAnchor: { x: pos.x, y: pos.y },
      label: `Draw: ${elem.text || elem.id}`,
    });

    // Check if any connectors originate from this element
    const outgoingConnectors = sortedConnectors.filter((c) => c.from === elem.id);
    for (const conn of outgoingConnectors) {
      const targetPos = elementPosMap.get(conn.to) || pos;
      const midPoint = {
        x: (pos.x + targetPos.x) / 2,
        y: (pos.y + targetPos.y) / 2,
      };

      steps.push({
        stepId: `step-cursor-conn-${conn.id}`,
        targetId: conn.id,
        order: stepOrder++,
        action: "cursor-move",
        duration: 500,
        cursorAnchor: midPoint,
        label: `Trace: ${conn.label || conn.id}`,
      });

      steps.push({
        stepId: `step-draw-${conn.id}`,
        targetId: conn.id,
        order: stepOrder++,
        action: "draw",
        duration: Math.max(800, conn.animation?.duration || 800),
        cursorAnchor: targetPos,
        label: `Connect ➔ ${conn.to}`,
      });
    }
  }

  return steps;
}
