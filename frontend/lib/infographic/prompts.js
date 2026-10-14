import { Type } from "@google/genai";

export const STAGE1_SYSTEM_PROMPT = `
You are an elite Art Director, Information Architect, and Educational Graphic Designer.
Your job is to read any educational tutor response or explanatory paragraph and autonomously design a world-class visual infographic structure.

You must:
1. Deeply reason about the semantic structure of the content:
   - Does it describe a sequential process, pipeline, or protocol? -> "horizontal-process"
   - Does it describe a closed, returning loop or thermodynamic/iterative cycle? -> "circular-cycle"
   - Does it contrast two distinct entities across dimensions? -> "comparison"
   - Does it describe ranked tiers, levels, or trophic pyramids? -> "hierarchy"
   - Does it recount chronological milestones or historical eras? -> "timeline"
   - Does it revolve around a central core concept with peripheral facets? -> "radial-map"
   - Does it detail an anatomy, physical organelle, scientific system, or biological mechanism with inputs/outputs? -> "scientific-illustration"
   - Does it contain concrete quantitative percentages, statistics, or measurable benchmarks? -> "data-chart"
   - Does it present a multi-faceted concept, editorial synthesis, or diverse knowledge cards? -> "editorial"

2. Node Count Rule (CRITICAL):
   - You MUST extract between 3 and 8 semantic nodes (inclusive) that strictly mirror the true information content of the text.
   - NEVER default to 4 nodes unless the text genuinely contains exactly 4 distinct entities, stages, or tiers.
   - If there are 3 distinct steps, output 3 nodes.
   - If there are 5 phases, output 5 nodes.
   - If there are 6 comparison cells, output 6 nodes.
   - If there are 7 chronological eras, output 7 nodes.

3. Node Attributes:
   - id: Unique, lowercase, kebab-case identifier (e.g. "step-syn", "tier-apex", "reactant-photons", "left-compiler").
   - title: 2 to 5 words, punchy, student-friendly, and informative.
   - subtitle: Crisp 1 to 2 sentence explanation (strictly max 110 characters).
   - category: Short uppercase classification tag (e.g. "STAGE 01", "INPUT", "TIER 1", "PROS", "CONS", "RESULT").
   - icon: Must be one of the supported icon keys:
     "sun", "droplet", "zap", "wind", "cpu", "play-circle", "play", "check-circle",
     "arrow-right", "cloud", "cloud-rain", "waves", "activity", "layers",
     "trending-up", "info", "calendar", "bookmark", "award", "sparkles",
     "shield-check", "refresh-cw", "database", "network", "git-branch",
     "lock", "globe", "code", "terminal", "book-open", "atom", "brain",
     "scale", "gauge".
   - equation: Only include if a mathematical formula, chemical equation, or code snippet appears in the text (e.g. "6CO2 + 6H2O -> C6H12O6 + 6O2" or "SYN=1, SEQ=x"). Otherwise leave empty string.
   - highlight: Set to true for hero spotlight nodes, central hubs, apex tiers, or focal insights.
   - semanticRole: One of: "hero" | "hub" | "stage" | "left-entity" | "right-entity" | "tier" | "satellite" | "metric".
   - sourceEvidence: Exact verbatim quote from the input text justifying this node.

4. Connectors:
   - Provide explicit directional connections between node IDs.
   - style: "curved-arrow" | "straight" | "dashed" | "elbow".
   - label: Optional concise action/signal label (e.g. "SYN Packet", "Evaporates", "Transfers 10%").
   - 'from' and 'to' must reference valid existing node IDs.

5. Data Chart:
   - Only populate chartData if explicit numeric metrics, percentages, or measurements exist in the text.
   - Do NOT invent fake chart metrics. If no numbers exist, set chartData to null.

6. Grounding & Anti-Hallucination:
   - Every single claim, metric, and step must be grounded in the provided tutor response.
   - Do not invent external facts.
`.trim();

export const STAGE1_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    detectedTopic: {
      type: Type.STRING,
      description: "Short punchy title for the infographic (e.g. 'TCP/IP 3-Way Handshake Protocol', 'Photosynthesis Reaction Core', max 80 chars)",
    },
    coreThesis: {
      type: Type.STRING,
      description: "1 crisp takeaway sentence summarizing the core insight, max 110 characters.",
    },
    layoutGrammar: {
      type: Type.STRING,
      enum: [
        "scientific-illustration",
        "editorial",
        "comparison",
        "horizontal-process",
        "radial-map",
        "circular-cycle",
        "timeline",
        "hierarchy",
        "data-chart",
      ],
      description: "The optimal visual grammar among the 9 supported layouts.",
    },
    structuralPattern: {
      type: Type.STRING,
      description: "Why this paragraph fits this grammar structurally (e.g. 'linear sequential progression', 'contrasting paired facets', 'closed cyclical loop').",
    },
    designRationale: {
      type: Type.STRING,
      description: "1-2 sentences explaining why this visual structure best communicates the educational content to the learner.",
    },
    alternateLayout: {
      type: Type.STRING,
      enum: [
        "scientific-illustration",
        "editorial",
        "comparison",
        "horizontal-process",
        "radial-map",
        "circular-cycle",
        "timeline",
        "hierarchy",
        "data-chart",
      ],
      description: "The second-best alternative layout grammar.",
    },
    nodes: {
      type: Type.ARRAY,
      description: "Between 3 and 8 semantic nodes matching the true structure of the text. Never default to 4 unless there are genuinely 4 items.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique kebab-case ID (e.g. 'step-syn', 'tier-apex', 'left-compiler')" },
          title: { type: Type.STRING, description: "2 to 5 words punchy title" },
          subtitle: { type: Type.STRING, description: "Concise 1-2 sentence explanation, max 110 chars" },
          category: { type: Type.STRING, description: "Short tag like 'INPUT', 'STAGE 01', 'TIER 1', 'PROS', 'CORE'" },
          icon: {
            type: Type.STRING,
            enum: [
              "sun", "droplet", "zap", "wind", "cpu", "play-circle", "play", "check-circle",
              "arrow-right", "cloud", "cloud-rain", "waves", "activity", "layers",
              "trending-up", "info", "calendar", "bookmark", "award", "sparkles",
              "shield-check", "refresh-cw", "database", "network", "git-branch",
              "lock", "globe", "code", "terminal", "book-open", "atom", "brain",
              "scale", "gauge"
            ],
            description: "Icon key strictly matching the supported icon registry."
          },
          equation: { type: Type.STRING, description: "Optional formula or code snippet if present, otherwise empty string" },
          highlight: { type: Type.BOOLEAN, description: "True for hero/hub or primary focal nodes" },
          semanticRole: {
            type: Type.STRING,
            enum: ["hero", "hub", "stage", "left-entity", "right-entity", "tier", "satellite", "metric"],
            description: "Semantic visual role of this node"
          },
          sourceEvidence: { type: Type.STRING, description: "Verbatim quote from the input text justifying this node" }
        },
        required: ["id", "title", "subtitle", "icon", "highlight", "semanticRole", "sourceEvidence"]
      }
    },
    connectors: {
      type: Type.ARRAY,
      description: "Explicit directional relationships connecting existing node IDs",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique connector ID (e.g. 'conn-syn-ack')" },
          from: { type: Type.STRING, description: "Source node ID" },
          to: { type: Type.STRING, description: "Target node ID" },
          label: { type: Type.STRING, description: "Optional short label on the connector" },
          style: {
            type: Type.STRING,
            enum: ["curved-arrow", "straight", "dashed", "elbow"],
            description: "Connector line style"
          }
        },
        required: ["id", "from", "to", "style"]
      }
    },
    chartData: {
      type: Type.OBJECT,
      description: "Populate only if explicit numeric statistics or percentages exist in text",
      properties: {
        labels: { type: Type.ARRAY, items: { type: Type.STRING } },
        values: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        unit: { type: Type.STRING }
      }
    }
  },
  required: [
    "detectedTopic",
    "coreThesis",
    "layoutGrammar",
    "structuralPattern",
    "designRationale",
    "alternateLayout",
    "nodes",
    "connectors"
  ]
};

export const REPAIR_SCENE_PROMPT = `
The previously generated scene specification failed validation with the following errors:
\${errors}

Fix the schema and spatial violations and return the corrected JSON object.
Rules:
1. Ensure all connector references reference existing element IDs in 'from' and 'to'.
2. Ensure element coordinates are strictly within safe margins (x: 10 to 90, y: 20 to 88).
3. Ensure element sizes have width >= 10 and height >= 8.
4. Ensure no duplicate element IDs exist.
5. Retain all original grounded facts and source evidence.
`;
