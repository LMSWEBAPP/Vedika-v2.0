import { z } from "zod";

export const LayoutTypeEnum = z.enum([
  "scientific-illustration",
  "editorial",
  "comparison",
  "horizontal-process",
  "radial-map",
  "circular-cycle",
  "timeline",
  "hierarchy",
  "data-chart",
  "technical-model",
]);

export const AspectRatioEnum = z.enum(["16:9", "4:3", "square", "responsive"]);

export const ElementTypeEnum = z.enum([
  "label",
  "text",
  "icon",
  "illustration",
  "shape",
  "chart",
  "equation",
  "callout",
  "card",
  "badge",
]);

export const AnimationEffectEnum = z.enum([
  "fade-in",
  "reveal",
  "draw-path",
  "pop",
  "scale",
]);

export const ConnectorStyleEnum = z.enum([
  "curved-arrow",
  "straight",
  "dashed",
  "elbow",
  "bidirectional",
]);

export const PositionSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const SizeSchema = z.object({
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
});

export const ElementAnimationSchema = z.object({
  order: z.number().int().min(0),
  effect: AnimationEffectEnum.default("fade-in"),
  duration: z.number().positive().optional().default(600),
});

export const ChartDataSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  seriesName: z.string().optional(),
  unit: z.string().optional(),
  chartType: z.enum(["bar", "pie", "line"]).default("bar"),
});

export const ElementStyleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  color: z.string().optional(),
  bg: z.string().optional(),
  variant: z.string().optional(),
}).optional();

export const SceneElementSchema = z.object({
  id: z.string().min(1),
  type: ElementTypeEnum,
  position: PositionSchema,
  size: SizeSchema.optional(),
  text: z.string().optional(),
  subtitle: z.string().optional(),
  assetId: z.string().optional(),
  icon: z.string().optional(),
  shapeType: z.enum(["rectangle", "circle", "pill", "hexagon", "card"]).optional(),
  chartData: ChartDataSchema.optional(),
  equation: z.string().optional(),
  category: z.string().optional(),
  highlight: z.boolean().optional(),
  semanticRole: z.string().optional(),
  style: ElementStyleSchema,
  animation: ElementAnimationSchema.default({ order: 1, effect: "fade-in", duration: 600 }),
  sourceEvidence: z.string().optional(),
});

export const SceneConnectorSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  style: ConnectorStyleEnum.default("curved-arrow"),
  animation: z.object({
    order: z.number().int().min(0),
    effect: z.literal("draw-path").default("draw-path"),
    duration: z.number().positive().optional(),
  }).default({ order: 2, effect: "draw-path", duration: 700 }),
});

export const AnimationStepSchema = z.object({
  stepId: z.string(),
  targetId: z.string(),
  order: z.number().int().min(0),
  action: z.enum(["cursor-move", "draw", "fade-in", "reveal", "highlight"]),
  duration: z.number().positive().default(500),
  cursorAnchor: z.object({
    x: z.number(),
    y: z.number(),
  }),
  label: z.string().optional(),
});

export const SourceEvidenceItemSchema = z.object({
  claim: z.string(),
  sourceSnippet: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export const LayoutSchema = z.object({
  type: LayoutTypeEnum,
  aspectRatio: AspectRatioEnum.default("16:9"),
  explanation: z.string().optional(),
  alternateCandidate: z.string().optional(),
});

export const CanvasSchema = z.object({
  width: z.number().positive().default(1200),
  height: z.number().positive().default(675),
  viewBox: z.string().default("0 0 1200 675"),
  safeMargin: z.number().min(0).default(32),
  theme: z.enum(["dark", "light", "blueprint", "scientific"]).default("dark"),
});

export const SceneSpecificationSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  layout: LayoutSchema,
  canvas: CanvasSchema.default({
    width: 1200,
    height: 675,
    viewBox: "0 0 1200 675",
    safeMargin: 32,
    theme: "dark",
  }),
  elements: z.array(SceneElementSchema).min(1),
  connectors: z.array(SceneConnectorSchema).default([]),
  animationSequence: z.array(AnimationStepSchema).default([]),
  sourceEvidence: z.array(SourceEvidenceItemSchema).default([]),
  warnings: z.array(z.string()).default([]),
  metadata: z.object({
    requestId: z.string().optional(),
    timings: z.object({
      planningMs: z.number().default(0),
      validationMs: z.number().default(0),
      totalMs: z.number().optional(),
    }).default({ planningMs: 0, validationMs: 0 }),
    generatedAt: z.string().optional(),
    modelUsed: z.string().optional(),
    heuristicFallback: z.boolean().optional(),
  }).default({ timings: { planningMs: 0, validationMs: 0 } }),
});
