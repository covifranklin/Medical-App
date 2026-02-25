import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { anthropic } from "@/lib/ai";
import { PLAN_REVIEW_SYSTEM, buildPlanReviewPrompt } from "@/lib/prompts/plan-review";
import type { Prisma } from "@prisma/client";
import type { PlanReviewResult } from "@/types";

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const REGION_LABELS: Record<string, string> = {
  HEAD: "Head", NECK: "Neck", LEFT_SHOULDER: "Left Shoulder",
  RIGHT_SHOULDER: "Right Shoulder", UPPER_BACK: "Upper Back",
  LOWER_BACK: "Lower Back", CHEST: "Chest", LEFT_ARM: "Left Arm",
  RIGHT_ARM: "Right Arm", LEFT_HAND: "Left Hand", RIGHT_HAND: "Right Hand",
  LEFT_WRIST: "Left Wrist", RIGHT_WRIST: "Right Wrist",
  LEFT_HIP: "Left Hip", RIGHT_HIP: "Right Hip", LEFT_KNEE: "Left Knee",
  RIGHT_KNEE: "Right Knee", LEFT_ANKLE: "Left Ankle",
  RIGHT_ANKLE: "Right Ankle", LEFT_FOOT: "Left Foot", RIGHT_FOOT: "Right Foot",
};

const MODEL_ID = "claude-sonnet-4-5-20241022";

// GET /api/plans/:id/review — get cached reviews for a plan
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const reviews = await prisma.planReview.findMany({
      where: { treatmentPlanId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json(
      reviews.map((r) => ({
        id: r.id,
        treatmentPlanId: r.treatmentPlanId,
        result: r.result,
        modelUsed: r.modelUsed,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("Failed to fetch plan reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan reviews" },
      { status: 500 }
    );
  }
}

// POST /api/plans/:id/review — trigger AI review of a treatment plan
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Fetch the plan with its ailment and exercises
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        ailment: true,
        exercises: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found" }, { status: 404 });
    }

    // Fetch ALL other ailments for cross-condition analysis
    const otherAilments = await prisma.ailment.findMany({
      where: {
        id: { not: plan.ailmentId },
        status: { not: "RESOLVED" },
      },
      select: {
        name: true,
        bodyRegion: true,
        severityLevel: true,
        status: true,
        diagnosis: true,
      },
    });

    // Build the prompt context
    const promptContent = buildPlanReviewPrompt({
      ailmentName: plan.ailment.name,
      bodyRegion: REGION_LABELS[plan.ailment.bodyRegion] ?? plan.ailment.bodyRegion,
      severity: plan.ailment.severityLevel,
      diagnosis: plan.ailment.diagnosis,
      planTitle: plan.title,
      prescribedBy: plan.prescribedBy,
      frequency: plan.frequency,
      rawContent: plan.rawContent,
      exercises: plan.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        description: ex.description,
        targetBodyRegion: REGION_LABELS[ex.targetBodyRegion] ?? ex.targetBodyRegion,
        sets: ex.sets,
        reps: ex.reps,
        holdSeconds: ex.holdSeconds,
        durationMinutes: ex.durationMinutes,
        contraindications: ex.contraindications,
      })),
      otherAilments: otherAilments.map((a) => ({
        name: a.name,
        bodyRegion: REGION_LABELS[a.bodyRegion] ?? a.bodyRegion,
        severity: a.severityLevel,
        status: a.status,
        diagnosis: a.diagnosis,
      })),
    });

    // Call Claude
    const message = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: 2048,
      system: PLAN_REVIEW_SYSTEM,
      messages: [{ role: "user", content: promptContent }],
    });

    // Extract text from response
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "AI returned no text response" },
        { status: 502 }
      );
    }

    // Parse the JSON response — strip markdown code fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let result: PlanReviewResult;
    try {
      result = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse AI review JSON:", jsonText);
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Save to PlanReview table
    const review = await prisma.planReview.create({
      data: {
        treatmentPlanId: id,
        result: result as unknown as Prisma.InputJsonValue,
        modelUsed: MODEL_ID,
      },
    });

    // Also update the legacy fields on TreatmentPlan
    await prisma.treatmentPlan.update({
      where: { id },
      data: {
        aiReview: result as unknown as Prisma.InputJsonValue,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: review.id,
      treatmentPlanId: review.treatmentPlanId,
      result: review.result,
      modelUsed: review.modelUsed,
      createdAt: review.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate AI review:", error);
    return NextResponse.json(
      { error: "Failed to generate AI review" },
      { status: 500 }
    );
  }
}
