import { GoogleGenAI } from "@google/genai";
import { getAllKeys } from "../keys.js";
import { STAGE1_RESPONSE_SCHEMA, STAGE1_SYSTEM_PROMPT, REPAIR_SCENE_PROMPT } from "./prompts.js";

let connectionCount = 0;

function getGeminiClients() {
  const keys = getAllKeys();
  if (!keys || keys.length === 0) return [];
  // Return clients with rotated starting index
  const clients = [];
  const startIdx = connectionCount % keys.length;
  connectionCount++;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(startIdx + i) % keys.length];
    clients.push(new GoogleGenAI({ apiKey: key, httpOptions: { headers: { "User-Agent": "aistudio-build" } } }));
  }
  return clients;
}

export function isGeminiConfigured() {
  const keys = getAllKeys();
  return keys && keys.length > 0;
}

const PLANNING_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
];

export async function planWithGemini(
  question,
  response,
  subject,
  level,
  userPreference
) {
  const clients = getGeminiClients();
  if (clients.length === 0) return null;

  const startTime = Date.now();
  const promptContent = `
Analyze the following educational content and design the optimal visual infographic specification:

CONTEXT:
- Question / Topic: ${question || "General Concept"}
- Subject: ${subject || "General"}
- Grade / Level: ${level || "Standard"}
- Explicit Layout Preference: ${userPreference || "automatic"} (If 'automatic', autonomously choose the best layout grammar)

TUTOR EXPLANATION TEXT:
"""
${response}
"""

Remember:
1. Dynamically extract between 3 and 8 semantic nodes matching the true structure of the text. Do NOT default to 4 nodes unless there are genuinely 4 items.
2. Select the optimal layout grammar out of: "scientific-illustration", "editorial", "comparison", "horizontal-process", "radial-map", "circular-cycle", "timeline", "hierarchy", "data-chart".
3. Assign each node an appropriate semanticRole, valid icon, title, subtitle (max 110 chars), category, and verbatim sourceEvidence.
4. Supply explicit directional connectors linking the node IDs.
`.trim();

  // Try each client key in rotation, and for each key try models with fast fallback
  for (const ai of clients.slice(0, 3)) {
    for (const model of PLANNING_MODELS) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: promptContent,
          config: {
            systemInstruction: STAGE1_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: STAGE1_RESPONSE_SCHEMA,
            temperature: 0.2,
          },
        });

        const responseText = result.text;
        if (!responseText) continue;

        const cleanedJson = responseText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const parsed = JSON.parse(cleanedJson);

        if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length < 2) {
          continue;
        }

        // Clamp nodes strictly to [3, 8]
        if (parsed.nodes.length > 8) {
          parsed.nodes = parsed.nodes.slice(0, 8);
        }

        const validNodeIds = new Set(parsed.nodes.map((n) => n.id));
        if (Array.isArray(parsed.connectors)) {
          parsed.connectors = parsed.connectors.filter(
            (c) => validNodeIds.has(c.from) && validNodeIds.has(c.to) && c.from !== c.to
          );
        } else {
          parsed.connectors = [];
        }

        const durationMs = Date.now() - startTime;
        return {
          plan: parsed,
          model,
          durationMs,
        };
      } catch (err) {
        console.warn(`[GeminiPlanner] Model ${model} planning notice:`, err?.message?.slice(0, 100));
        // If quota limit or high demand, move to next model/key
        if (err?.message?.includes("429") || err?.message?.includes("quota")) {
          break; // break to next client key
        }
      }
    }
  }

  return null;
}

export async function repairWithGemini(rawScene, validationErrors) {
  const clients = getGeminiClients();
  if (clients.length === 0) return null;

  const prompt = `
${REPAIR_SCENE_PROMPT.replace("${errors}", validationErrors.join("\n- "))}

INVALID SCENE SPECIFICATION:
${JSON.stringify(rawScene, null, 2)}
`.trim();

  for (const ai of clients.slice(0, 3)) {
    for (const model of PLANNING_MODELS) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const text = result.text;
        if (!text) continue;
        const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        return JSON.parse(cleaned);
      } catch (err) {
        console.warn(`[GeminiPlanner] Repair notice on ${model}:`, err?.message?.slice(0, 100));
        if (err?.message?.includes("429") || err?.message?.includes("quota")) {
          break;
        }
      }
    }
  }

  return null;
}
