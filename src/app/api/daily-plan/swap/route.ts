import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, handleApiError } from "@/lib/user";
import { anthropic } from "@/lib/ai";

const MODEL_ID = "claude-sonnet-4-5-20241022";

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

// POST /api/daily-plan/swap — swap an exercise for an alternative
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { dailyPlanExerciseId, reason } = body;

    if (!dailyPlanExerciseId) {
      return NextResponse.json(
        { error: "dailyPlanExerciseId is required" },
        { status: 400 }
      );
    }

    // Find the exercise to swap and verify ownership
    const dpe = await prisma.dailyPlanExercise.findUnique({
      where: { id: dailyPlanExerciseId },
      include: {
        dailyPlan: { select: { userId: true, id: true } },
        exercise: {
          include: {
            treatmentPlan: {
              select: {
                ailment: { select: { id: true, name: true, bodyRegion: true } },
              },
            },
          },
        },
      },
    });

    if (!dpe || dpe.dailyPlan.userId !== user.id) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    // Get all exercises from the same ailment that aren't already in today's plan
    const currentPlanExerciseIds = (
      await prisma.dailyPlanExercise.findMany({
        where: { dailyPlanId: dpe.dailyPlanId },
        select: { exerciseId: true },
      })
    ).map((e) => e.exerciseId);

    const ailmentId = dpe.exercise.treatmentPlan.ailment.id;
    const alternatives = await prisma.exercise.findMany({
      where: {
        treatmentPlan: { ailmentId },
        id: { notIn: currentPlanExerciseIds },
      },
      include: {
        treatmentPlan: {
          select: { ailment: { select: { name: true } } },
        },
      },
    });

    // If no alternatives from same ailment, look for exercises targeting the same body region
    if (alternatives.length === 0) {
      const sameRegionAlts = await prisma.exercise.findMany({
        where: {
          targetBodyRegion: dpe.exercise.targetBodyRegion,
          treatmentPlan: { ailment: { userId: user.id } },
          id: { notIn: currentPlanExerciseIds },
        },
        include: {
          treatmentPlan: {
            select: { ailment: { select: { name: true } } },
          },
        },
        take: 5,
      });

      if (sameRegionAlts.length === 0) {
        return NextResponse.json({
          swapped: false,
          message:
            "No alternative exercises available for this body region. Consider adding more exercises to your treatment plans.",
        });
      }

      // Use AI to pick the best alternative
      return await pickAndSwap(
        dpe,
        sameRegionAlts,
        reason ?? "causes pain"
      );
    }

    return await pickAndSwap(
      dpe,
      alternatives,
      reason ?? "causes pain"
    );
  } catch (error) {
    return handleApiError(error, "swap exercise");
  }
}

async function pickAndSwap(
  dpe: {
    id: string;
    dailyPlanId: string;
    orderIndex: number;
    estimatedMinutes: number;
    exercise: {
      id: string;
      name: string;
      targetBodyRegion: string;
      sets: number | null;
      reps: number | null;
      holdSeconds: number | null;
      durationMinutes: number;
    };
  },
  alternatives: Array<{
    id: string;
    name: string;
    description: string | null;
    targetBodyRegion: string;
    sets: number | null;
    reps: number | null;
    holdSeconds: number | null;
    durationMinutes: number;
    treatmentPlan: { ailment: { name: string } };
  }>,
  reason: string
) {
  // If only one alternative, use it directly
  if (alternatives.length === 1) {
    const alt = alternatives[0];
    await prisma.dailyPlanExercise.update({
      where: { id: dpe.id },
      data: {
        exerciseId: alt.id,
        reason: `Swapped from "${dpe.exercise.name}" (${reason}). Alternative: ${alt.name}`,
        completed: false,
        completedAt: null,
      },
    });

    return NextResponse.json({
      swapped: true,
      newExercise: {
        id: alt.id,
        name: alt.name,
        description: alt.description,
        targetBodyRegion: alt.targetBodyRegion,
        sets: alt.sets,
        reps: alt.reps,
        holdSeconds: alt.holdSeconds,
        durationMinutes: alt.durationMinutes,
        ailmentName: alt.treatmentPlan.ailment.name,
      },
      message: `Swapped to "${alt.name}"`,
    });
  }

  // Use AI to pick the best alternative
  const prompt = `The patient needs to swap out "${dpe.exercise.name}" (${REGION_LABELS[dpe.exercise.targetBodyRegion] ?? dpe.exercise.targetBodyRegion}) because: ${reason}.

Available alternatives:
${alternatives.map((a) => `- [${a.id}] ${a.name} (${REGION_LABELS[a.targetBodyRegion] ?? a.targetBodyRegion}, ~${a.durationMinutes}min, for ${a.treatmentPlan.ailment.name})${a.description ? `: ${a.description}` : ""}`).join("\n")}

Pick the best alternative that:
1. Targets the same or similar body region
2. Won't aggravate the issue that caused the swap
3. Fits roughly the same time slot (~${dpe.estimatedMinutes} min)

Return ONLY valid JSON: { "exerciseId": "uuid", "reason": "brief explanation" }`;

  const message = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  let chosenId = alternatives[0].id;
  let aiReason = "AI-selected alternative";

  if (textBlock && textBlock.type === "text") {
    try {
      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText
          .replace(/^```(?:json)?\s*/, "")
          .replace(/\s*```$/, "");
      }
      const parsed = JSON.parse(jsonText);
      if (parsed.exerciseId && alternatives.some((a) => a.id === parsed.exerciseId)) {
        chosenId = parsed.exerciseId;
        aiReason = parsed.reason ?? aiReason;
      }
    } catch {
      // Fall back to first alternative
    }
  }

  const chosen = alternatives.find((a) => a.id === chosenId) ?? alternatives[0];

  await prisma.dailyPlanExercise.update({
    where: { id: dpe.id },
    data: {
      exerciseId: chosen.id,
      reason: `Swapped from "${dpe.exercise.name}" (${reason}). ${aiReason}`,
      completed: false,
      completedAt: null,
    },
  });

  return NextResponse.json({
    swapped: true,
    newExercise: {
      id: chosen.id,
      name: chosen.name,
      description: chosen.description,
      targetBodyRegion: chosen.targetBodyRegion,
      sets: chosen.sets,
      reps: chosen.reps,
      holdSeconds: chosen.holdSeconds,
      durationMinutes: chosen.durationMinutes,
      ailmentName: chosen.treatmentPlan.ailment.name,
    },
    reason: aiReason,
    message: `Swapped to "${chosen.name}"`,
  });
}
