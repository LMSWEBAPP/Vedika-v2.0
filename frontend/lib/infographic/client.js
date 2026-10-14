import { extractContentHeuristic } from "./extractContent.js";
import { selectLayout } from "./selectLayout.js";
import { buildSceneFromExtraction } from "./spatialEngine.js";
import { getJwtToken } from "@/lib/jwtCache";

/**
 * Client helper to request a dynamic infographic from the server-side
 * Gemini Art Director (/api/infographic/generate), with automatic
 * local heuristic fallback so it is 100% resilient.
 */
export async function generateDynamicInfographic({
  response,
  question,
  subject,
  level,
  style,
}) {
  try {
    const headers = { "Content-Type": "application/json" };
    try {
      const token = await getJwtToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (_) {}

    const res = await fetch("/api/infographic/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        response,
        question,
        subject,
        level,
        style,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.scene) {
        const points = (data.scene.sourceEvidence || []).map(
          (e) => e.claim || e.sourceSnippet
        );
        return {
          scene: data.scene,
          points: points.length > 0 ? points : [data.scene.summary],
          topic: data.scene.title,
        };
      }
    }
  } catch (err) {
    console.warn("[InfographicClient] Server generation notice, using deterministic fallback:", err?.message);
  }

  // Resilient client-side fallback
  const extraction = extractContentHeuristic(response, question);
  const layoutPlan = selectLayout(extraction, style);
  const scene = buildSceneFromExtraction(extraction, layoutPlan);

  return {
    scene,
    points: extraction.facts && extraction.facts.length > 0 ? extraction.facts : [scene.summary],
    topic: scene.title,
  };
}
