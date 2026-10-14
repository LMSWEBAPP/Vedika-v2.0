import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth";
import { trackApiConsumption } from "@/lib/memory";
import { planWithGemini, repairWithGemini } from "@/lib/infographic/geminiPlanner";
import { extractContentHeuristic } from "@/lib/infographic/extractContent";
import { selectLayout } from "@/lib/infographic/selectLayout";
import {
  buildSceneFromSemanticPlan,
  buildSceneFromExtraction,
} from "@/lib/infographic/spatialEngine";
import { validateScene } from "@/lib/infographic/validateScene";
import { repairSceneLocally } from "@/lib/infographic/repairScene";

export async function POST(req) {
  const startTime = Date.now();

  try {
    // Optional JWT verification for rate control / tracking
    const authHeader = req.headers.get("Authorization");
    let authenticatedUser = null;
    if (authHeader) {
      const payload = verifyJwt(authHeader);
      if (payload) {
        authenticatedUser = payload.user_id || payload.email || payload.sub;
      }
    }

    const body = await req.json();
    const { question, response, subject, level, aspectRatio, style } = body || {};

    // 1. Server-side validation and security boundaries
    if (!response || typeof response !== "string" || response.trim().length === 0) {
      return NextResponse.json(
        { error: "Field 'response' is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (response.length > 25000) {
      return NextResponse.json(
        { error: "Tutor response exceeds maximum character limit of 25,000 characters." },
        { status: 400 }
      );
    }

    // Sanitize optional inputs
    const cleanQuestion = typeof question === "string" ? question.slice(0, 2000).trim() : "";
    const cleanSubject = typeof subject === "string" ? subject.slice(0, 100).trim() : "General";
    const cleanLevel = typeof level === "string" ? level.slice(0, 50).trim() : "Standard";
    const cleanStyle = typeof style === "string" ? style.slice(0, 50).trim() : "automatic";

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const planningStart = Date.now();
    let sceneDraft = null;
    let modelUsed = "heuristic-fallback";

    // 2. Autonomous Gemini Art Director & Information Architect
    // Server-side only: uses rotated keys securely
    const geminiResult = await planWithGemini(
      cleanQuestion,
      response,
      cleanSubject,
      cleanLevel,
      cleanStyle
    );

    if (geminiResult && geminiResult.plan) {
      modelUsed = geminiResult.model;
      sceneDraft = buildSceneFromSemanticPlan(geminiResult.plan, {
        aspectRatio: aspectRatio || "16:9",
        theme: "dark",
        requestId,
        modelUsed,
      });
      if (authenticatedUser) {
        trackApiConsumption(authenticatedUser, `Infographic: ${cleanQuestion || cleanSubject}`, `Generated ${geminiResult.plan.layoutGrammar} infographic`);
      }
    } else {
      // Fallback: Deterministic heuristic extraction + semantic layout selection
      const extraction = extractContentHeuristic(response, cleanQuestion);
      if (cleanSubject) {
        extraction.metadata = {
          ...extraction.metadata,
          charCount: response.length,
          wordCount: response.split(/\s+/).length,
          questionContext: `${cleanQuestion || ""} (${cleanSubject})`.trim(),
        };
      }
      const layoutPlan = selectLayout(extraction, cleanStyle);
      sceneDraft = buildSceneFromExtraction(extraction, layoutPlan, {
        aspectRatio: aspectRatio || "16:9",
        theme: "dark",
        requestId,
        modelUsed: "heuristic-fallback",
      });
    }

    const planningMs = Date.now() - planningStart;

    // 3. Schema Validation & Security Check
    const validationStart = Date.now();
    let validationResult = validateScene(sceneDraft);

    // 4. Automatic Self-Repair Pass if validation fails
    if (!validationResult.valid || !validationResult.scene) {
      console.warn("Scene validation failed. Running automatic repair pass...", validationResult.errors);

      // Attempt 1: Local deterministic spatial and reference repair
      const localRepairResult = repairSceneLocally(sceneDraft);
      if (localRepairResult.valid && localRepairResult.scene) {
        validationResult = localRepairResult;
        sceneDraft = localRepairResult.scene;
        sceneDraft.warnings.push("Automatic self-repair resolved spatial/schema constraints.");
      } else {
        // Attempt 2: Gemini LLM self-repair pass
        const geminiRepaired = await repairWithGemini(sceneDraft, validationResult.errors);
        if (geminiRepaired) {
          const geminiValidation = validateScene(geminiRepaired);
          if (geminiValidation.valid && geminiValidation.scene) {
            validationResult = geminiValidation;
            sceneDraft = geminiValidation.scene;
            sceneDraft.warnings.push("Gemini self-repair pass restored schema integrity.");
          }
        }
      }
    }

    const validationMs = Date.now() - validationStart;

    if (!validationResult.valid || !validationResult.scene) {
      return NextResponse.json(
        {
          error: "Generated scene specification failed schema validation after self-repair pass.",
          details: validationResult.errors,
          warnings: validationResult.warnings,
        },
        { status: 500 }
      );
    }

    const totalMs = Date.now() - startTime;
    const finalScene = validationResult.scene;
    finalScene.metadata.timings = {
      planningMs,
      validationMs,
      totalMs,
    };
    finalScene.metadata.modelUsed = modelUsed;

    return NextResponse.json({
      requestId: finalScene.metadata.requestId,
      scene: finalScene,
      warnings: [...(validationResult.warnings || []), ...(finalScene.warnings || [])],
      timings: finalScene.metadata.timings,
    });
  } catch (error) {
    console.error("[/api/infographic/generate] Error:", error);
    return NextResponse.json(
      {
        error: "Internal error processing visual summary request.",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
